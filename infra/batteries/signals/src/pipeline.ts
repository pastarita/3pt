/** The transform chain between the sensors and the store. Every stage is a pure-ish function over one Signal;
 *  the order is fixed (normalize → enrich → redact → strip → sample → plugins) because redaction must precede
 *  any write and sampling must see the enriched flags. Modelled on OpenTelemetry Collector processors and
 *  Vector VRL: filter, transform, redact, sample; plugins are the slot for code the harness pushes later. */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, watch, type FSWatcher } from 'node:fs';
import { hostname } from 'node:os';
import { basename, join } from 'node:path';
import vm from 'node:vm';
import type { Signal, SignalKind } from './index.js';
import { envNum, envOr } from './env.js';

export interface RawEvent { k: string; ns?: number; pid?: number; tid?: number; uid?: number; cg?: number; comm?: string; [key: string]: unknown }
export type Out = Signal | Signal[] | null;
export type Transform = (s: Signal, ctx: PipelineCtx) => Out;

export interface PipelineOptions {
  host: string;
  mediaPrefixes: string[];                  // paths under these are media (plus image extensions anywhere)
  stripAttrs: string[];                     // attrs dropped before the store
  sampleRates: Partial<Record<SignalKind, number>>;
  markerFile: string;                       // JSON {stage, iteration} the harness writes while it runs
  iteration: number;                        // fallback when the marker is absent
}
export interface PipelineCtx {
  opts: PipelineOptions;
  now(): number;
  marker(): { stage: string; iteration: number };
  seen: Map<string, number>;                // scratch the plugins share; cleared on reload
  epochNs: bigint;                          // wall-clock epoch ns at agent start, to rebase the sensor's monotonic ns
  bootNs: bigint;
}

export function pipelineOptions(env: NodeJS.ProcessEnv = process.env): PipelineOptions {
  const rates: Partial<Record<SignalKind, number>> = { exec: 1, exit: 0.2, open: 0.1, connect: 1, finding: 1, agent: 1 };
  for (const kv of envOr('SIGNALS_SAMPLE', '', env).split(',').filter(Boolean)) { const [k, v] = kv.split('='); if (k && v) rates[k.trim() as SignalKind] = Number(v); }
  return {
    host: envOr('SIGNALS_HOST', hostname(), env),
    mediaPrefixes: envOr('SIGNALS_MEDIA_PREFIXES', '/opt/3pt/data,/opt/3pt/.blob', env).split(',').map(s => s.trim()).filter(Boolean),
    stripAttrs: envOr('SIGNALS_STRIP', '', env).split(',').map(s => s.trim()).filter(Boolean),
    sampleRates: rates,
    markerFile: envOr('SIGNALS_MARKER', '/opt/3pt/.install-loop/stage.json', env),
    iteration: envNum('SIGNALS_ITERATION', 0, env),
  };
}

export function makeCtx(opts: PipelineOptions): PipelineCtx {
  let cached: { at: number; v: { stage: string; iteration: number } } | null = null;
  return {
    opts, seen: new Map(), now: () => Date.now(),
    epochNs: BigInt(Date.now()) * 1_000_000n, bootNs: 0n,
    marker() {
      const now = Date.now();
      if (cached && now - cached.at < 2000) return cached.v;
      let v = { stage: 'unknown', iteration: opts.iteration };
      try { if (existsSync(opts.markerFile)) { const j = JSON.parse(readFileSync(opts.markerFile, 'utf8')); v = { stage: String(j.stage ?? 'unknown'), iteration: Number(j.iteration ?? opts.iteration) }; } } catch { /* a half-written marker is no marker */ }
      cached = { at: now, v }; return v;
    },
  };
}

/** One sensor line → RawEvent, or null (counted by the agent, never thrown). */
export function parseLine(line: string): RawEvent | null {
  const s = line.trim(); if (!s.startsWith('{')) return null;
  try { const j = JSON.parse(s); return typeof j.k === 'string' ? j as RawEvent : null; } catch { return null; }
}

const KINDS = new Set<SignalKind>(['exec', 'exit', 'open', 'connect', 'finding', 'agent']);
/** RawEvent → Signal. Sensor ns are monotonic since boot; the first event fixes the offset to wall clock. */
export function normalize(raw: RawEvent, ctx: PipelineCtx): Signal | null {
  if (!KINDS.has(raw.k as SignalKind)) return null;
  const ns = typeof raw.ns === 'number' ? BigInt(Math.trunc(raw.ns)) : null;
  if (ns !== null && ctx.bootNs === 0n) ctx.bootNs = ns;
  const t = ns !== null ? new Date(Number((ctx.epochNs + (ns - ctx.bootNs)) / 1_000_000n)).toISOString() : new Date(ctx.now()).toISOString();
  const { k, ns: _n, pid, tid, uid, cg, comm, ...rest } = raw;
  const attrs: Signal['attrs'] = {};
  for (const [key, v] of Object.entries(rest)) if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') attrs[key] = v;
  if (typeof uid === 'number') attrs.uid = uid; if (typeof cg === 'number') attrs.cgroup = cg; if (typeof tid === 'number' && tid !== pid) attrs.tid = tid;
  const m = ctx.marker();
  return { t, host: ctx.opts.host, kind: k as SignalKind, pid: Number(pid ?? 0), comm: String(comm ?? ''), stage: m.stage, iteration: m.iteration, attrs };
}

const IMAGE = /\.(jpe?g|png|heic|webp|gif|tiff?|bmp|raw|dng|mp4|mov)$/i;
const PRIVATE = /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.0\.0\.0)/;
/** Flags the pipeline and the plugins decide on: media, write, egress class. */
export const enrich: Transform = (s, ctx) => {
  if (s.kind === 'open' && typeof s.attrs.path === 'string') {
    const p = s.attrs.path;
    s.attrs.media = ctx.opts.mediaPrefixes.some(pre => p.startsWith(pre)) || IMAGE.test(p);
    if (typeof s.attrs.flags === 'number') { s.attrs.write = (s.attrs.flags & 3) !== 0 || (s.attrs.flags & 0o100) !== 0; }
  }
  if (s.kind === 'connect') {
    const port = Number(s.attrs.dport), addr = String(s.attrs.daddr ?? '');
    s.attrs.egress = PRIVATE.test(addr) ? 'local' : port === 27017 || (port >= 27015 && port <= 27019) ? 'atlas' : port === 443 ? 'https' : 'other';
  }
  return s;
};

const URI_CREDS = /(\w+:\/\/)[^/@\s"']+@/g;
const KV_SECRET = /\b((?:api[_-]?)?key|token|secret|pass(?:word)?|authorization|bearer)([=:]\s*)\S+/gi;
const LONG_TOKEN = /\b[A-Za-z0-9_\-]{40,}\b/g;
const HOME = /^(\/(?:home|Users)\/)[^/]+/;
const SECRET_PATH = /(\.env(\.[^/]*)?|id_rsa|id_ed25519|\.pem|\.p12|ACCESS_PASS|credentials|\.netrc)$/i;
function hash8(s: string) { return createHash('sha256').update(s).digest('hex').slice(0, 8); }
/** Strings never leave the box with credentials, tokens, or user names in them. Paths to secret files keep only a hash. */
export const redact: Transform = (s) => {
  for (const [k, v] of Object.entries(s.attrs)) {
    if (typeof v !== 'string') continue;
    let out = v.replace(URI_CREDS, '$1…@').replace(KV_SECRET, '$1$2[redacted]').replace(LONG_TOKEN, m => `[h:${hash8(m)}]`).replace(HOME, '$1~');
    if ((k === 'path') && SECRET_PATH.test(out)) { out = `${out.slice(0, out.lastIndexOf('/') + 1)}[secret:${hash8(v)}]`; s.attrs.secret = true; }
    s.attrs[k] = out;
  }
  delete s.attrs.env; delete s.attrs.argv;   // never captured today; struck here so a future sensor cannot leak them by accident
  return s;
};

export const strip: Transform = (s, ctx) => { for (const a of ctx.opts.stripAttrs) delete s.attrs[a]; return s; };

/** Deterministic sampling: the same (kind, pid, path|addr) always lands on the same side, so a story is never half-told. */
export const sample: Transform = (s, ctx) => {
  if (s.kind === 'finding' || s.kind === 'agent' || (s.kind === 'open' && s.attrs.media === true)) return s;
  const rate = ctx.opts.sampleRates[s.kind] ?? 1; if (rate >= 1) return s; if (rate <= 0) return null;
  const key = `${s.kind}:${s.pid}:${s.attrs.path ?? s.attrs.daddr ?? ''}`;
  const u = parseInt(createHash('sha1').update(key).digest('hex').slice(0, 8), 16) / 0x1_0000_0000;
  return u < rate ? s : null;
};

export function compose(...ts: Transform[]): (s: Signal, ctx: PipelineCtx) => Signal[] {
  return (s0, ctx) => {
    let batch: Signal[] = [s0];
    for (const t of ts) {
      const next: Signal[] = [];
      for (const s of batch) { const o = t(s, ctx); if (o === null) continue; if (Array.isArray(o)) next.push(...o); else next.push(o); }
      batch = next; if (!batch.length) break;
    }
    return batch;
  };
}

export interface Plugin { name: string; source: 'dir' | 'atlas'; version: number; fn: Transform }
/** Code pushed into the pipeline: files in a watched directory, and documents in Atlas `pipeline_plugins`.
 *  Each runs in its own vm context with no require, no process, no network: `module.exports = (signal, ctx) => …`.
 *  Compile is time-boxed; a plugin that throws is disabled and logged, never fatal. docs/20 §5. */
export class PluginHost {
  private plugins = new Map<string, Plugin>();
  private watcher: FSWatcher | null = null;
  constructor(private log: (l: string) => void) {}
  list() { return [...this.plugins.values()].map(p => ({ name: p.name, source: p.source, version: p.version })); }
  load(name: string, code: string, source: Plugin['source'], version = 0): boolean {
    try {
      const module = { exports: {} as unknown };
      const sandbox = { module, exports: module.exports, console: { log: (...a: unknown[]) => this.log(`[plugin ${name}] ${a.join(' ')}`) } };
      const ret = vm.runInNewContext(code, sandbox, { timeout: 100, filename: `plugin:${name}` });
      const fn = (typeof module.exports === 'function' ? module.exports : typeof ret === 'function' ? ret : null) as Transform | null;
      if (!fn) throw new Error('plugin must export a function (module.exports = (signal, ctx) => …)');
      this.plugins.set(name, { name, source, version, fn });
      this.log(`[plugins] loaded ${name} (${source}${version ? ` v${version}` : ''})`);
      return true;
    } catch (e) { this.log(`[plugins] ${name} rejected: ${(e as Error).message}`); this.plugins.delete(name); return false; }
  }
  unload(name: string) { if (this.plugins.delete(name)) this.log(`[plugins] unloaded ${name}`); }
  /** The plugins as one transform; a throwing plugin is disabled on the spot. */
  transform: Transform = (s, ctx) => {
    let batch: Signal[] = [s];
    for (const p of [...this.plugins.values()]) {
      const next: Signal[] = [];
      for (const x of batch) {
        try { const o = p.fn(x, ctx); if (o === null) continue; if (Array.isArray(o)) next.push(...o); else next.push(o); }
        catch (e) { this.log(`[plugins] ${p.name} threw (${(e as Error).message}); disabled`); this.plugins.delete(p.name); next.push(x); }
      }
      batch = next; if (!batch.length) return null;
    }
    return batch;
  };
  loadDir(dir: string) {
    if (!existsSync(dir)) return;
    for (const f of readdirSync(dir).filter(f => f.endsWith('.js')).sort()) this.load(basename(f, '.js'), readFileSync(join(dir, f), 'utf8'), 'dir');
  }
  watchDir(dir: string) {
    if (!existsSync(dir)) return;
    this.watcher = watch(dir, (_ev, f) => {
      if (!f || !String(f).endsWith('.js')) return;
      const name = basename(String(f), '.js'), p = join(dir, String(f));
      if (existsSync(p)) this.load(name, readFileSync(p, 'utf8'), 'dir'); else this.unload(name);
    });
  }
  /** Reconcile with the documents Atlas holds: {name, code, version, enabled}. Higher version replaces; disabled unloads. */
  fromAtlas(docs: Array<{ name: string; code: string; version?: number; enabled?: boolean }>) {
    for (const d of docs) {
      const have = this.plugins.get(d.name);
      if (d.enabled === false) { if (have?.source === 'atlas') this.unload(d.name); continue; }
      if (!have || (have.source === 'atlas' && (d.version ?? 0) > have.version)) this.load(d.name, d.code, 'atlas', d.version ?? 0);
    }
  }
  close() { this.watcher?.close(); }
}
