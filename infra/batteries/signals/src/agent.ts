#!/usr/bin/env node
/** 3pt-signals · the agent that runs on the box (root, systemd unit 3pt-signals).
 *    3pt-signals                        run: sensors → pipeline → store; drain every SIGNALS_DRAIN_MS
 *    3pt-signals --replay <jsonl> --once  feed a fixture through the same pipeline (no root, no eBPF); drain; exit
 *    3pt-signals --status               store stats as JSON
 *    3pt-signals --query "<sql>"        read-only SQL over the store (parsability)
 *    3pt-signals --drain                one drain pass, then exit
 *  Env: SIGNALS_DB SIGNALS_SENSORS SIGNALS_SINK (atlas|file|none) SIGNALS_FILE_SINK SIGNALS_DRAIN_MS SIGNALS_PLUGIN_DIR
 *       SIGNALS_MEDIA_PREFIXES SIGNALS_STRIP SIGNALS_SAMPLE SIGNALS_MARKER SIGNALS_ITERATION SIGNALS_RETENTION_DAYS ATLAS_URI ATLAS_DB */
import { spawn, type ChildProcess } from 'node:child_process';
import { createReadStream, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SENSORS, type Signal } from './index.js';
import { PluginHost, compose, enrich, makeCtx, normalize, parseLine, pipelineOptions, redact, sample, strip } from './pipeline.js';
import { SignalStore } from './store.js';
import { atlasSink, drainOnce, fileSink, type Sink } from './drain.js';
import { atlasUri, envNum, envOr } from './env.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const args = process.argv.slice(2);
const flag = (n: string) => { const i = args.indexOf(n); return i >= 0 ? (args[i + 1] ?? '') : undefined; };
const env = process.env;
const dbPath = envOr('SIGNALS_DB', resolve(root, '.signals', 'signals.db'));
const log = (l: string) => { console.log(`${new Date().toISOString().slice(11, 19)} ${l}`); store?.log(l); };
let store: SignalStore | null = null;

if (args.includes('--query')) {
  const s = new SignalStore(dbPath, true); console.log(JSON.stringify(s.query(flag('--query') ?? 'SELECT kind, count(*) n FROM events GROUP BY kind'), null, 2)); s.close(); process.exit(0);
}
if (args.includes('--status')) { const s = new SignalStore(dbPath, true); console.log(JSON.stringify(s.stats(), null, 2)); s.close(); process.exit(0); }

store = new SignalStore(dbPath);
const opts = pipelineOptions(env);
const ctx = makeCtx(opts);
const plugins = new PluginHost(log);
const pluginDir = envOr('SIGNALS_PLUGIN_DIR', resolve(root, 'plugins'));
for (const p of store.plugins().filter(p => p.source === 'atlas')) plugins.load(p.name, p.code, 'atlas', p.version);   // what Atlas pushed last time, before the network is back
plugins.loadDir(pluginDir); plugins.watchDir(pluginDir);
const pipeline = compose(enrich, redact, strip, sample, plugins.transform);

const uri = atlasUri();
const sinkKind = envOr('SIGNALS_SINK', uri ? 'atlas' : 'file');
const sink: Sink | null = sinkKind === 'none' ? null : sinkKind === 'atlas' && uri ? atlasSink(uri, envOr('ATLAS_DB', '3pt')) : fileSink(envOr('SIGNALS_FILE_SINK', resolve(root, '.signals', 'drain.jsonl')));   // atlas without a usable URI falls back to the file sink
const drainMs = Math.max(1000, envNum('SIGNALS_DRAIN_MS', 30_000));
const retentionDays = envNum('SIGNALS_RETENTION_DAYS', 7);

let pending: Signal[] = [], parsed = 0, dropped = 0, kept = 0;
const flushTimer = setInterval(() => { if (pending.length) { kept += store!.insertMany(pending); pending = []; } }, 200);
function ingest(line: string) {
  const raw = parseLine(line); if (!raw) { dropped++; return; }
  parsed++;
  const s = normalize(raw, ctx); if (!s) { dropped++; return; }
  pending.push(...pipeline(s, ctx));
}

async function drain() {
  if (!sink) return;
  try {
    const docs = await sink.plugins();
    if (docs.length) { plugins.fromAtlas(docs); for (const d of docs) if (d.enabled !== false) store!.rememberPlugin(d.name, 'atlas', d.version ?? 0, d.code); }
    await drainOnce(store!, sink, 500, log);
    const pruned = store!.prune(retentionDays); if (pruned) log(`[store] pruned ${pruned} rows older than ${retentionDays} d`);
  } catch (e) { log(`[drain] ${sink.name} failed: ${(e as Error).message.split('\n')[0]}; rows stay in the store`); }
}

async function main() {
  log(`[agent] store=${dbPath} sink=${sink?.name ?? 'none'} plugins=${plugins.list().map(p => p.name).join(',') || '-'} marker=${opts.markerFile}`);
  const replay = flag('--replay');
  if (replay) {
    for await (const line of createInterface({ input: createReadStream(replay) })) ingest(line);
    ingest(JSON.stringify({ k: 'agent', pid: process.pid, comm: 'replay', file: replay }));
  } else {
    const names = envOr('SIGNALS_SENSORS', SENSORS.map(s => s.name).join(',')).split(',').map(s => s.trim()).filter(Boolean);
    const procs: ChildProcess[] = [];
    for (const n of names) {
      const sensor = SENSORS.find(s => s.name === n); if (!sensor) { log(`[agent] unknown sensor ${n}`); continue; }
      const file = resolve(root, sensor.file);
      const [cmd, ...pre] = process.getuid?.() === 0 ? ['bpftrace'] : ['sudo', '-n', 'bpftrace'];
      const p = spawn(cmd, [...pre, file], { stdio: ['ignore', 'pipe', 'pipe'] });
      p.stdout && createInterface({ input: p.stdout }).on('line', ingest);
      p.stderr && createInterface({ input: p.stderr }).on('line', l => { if (!/^Attaching/.test(l)) log(`[sensor ${n}] ${l}`); });
      p.on('exit', code => log(`[sensor ${n}] exited ${code}`));
      procs.push(p); log(`[sensor ${n}] ${sensor.hook} (pid ${p.pid})`);
    }
    ingest(JSON.stringify({ k: 'agent', pid: process.pid, comm: 'signals', sensors: names.join(','), host: opts.host }));
    const stop = async () => { log('[agent] stopping'); for (const p of procs) p.kill('SIGINT'); await finish(); };
    process.on('SIGTERM', stop); process.on('SIGINT', stop);
  }
  await new Promise(r => setTimeout(r, 300));
  const timer = args.includes('--once') || args.includes('--drain') ? null : setInterval(drain, drainMs);
  if (args.includes('--once') || args.includes('--drain')) { clearInterval(flushTimer); if (pending.length) { kept += store!.insertMany(pending); pending = []; } await drain(); await finish(); }
  else setInterval(() => log(`[agent] parsed=${parsed} kept=${kept} dropped=${dropped} events=${store!.maxId()}`), 60_000);
  void timer;
}
async function finish() {
  clearInterval(flushTimer); if (pending.length) { kept += store!.insertMany(pending); pending = []; }
  await drain();
  log(`[agent] parsed=${parsed} kept=${kept} dropped=${dropped} events=${store!.maxId()}`);
  plugins.close(); await sink?.close(); store!.close(); process.exit(0);
}
if (args.includes('--drain')) { await drain(); await finish(); } else await main();
