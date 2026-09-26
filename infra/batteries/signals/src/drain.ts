/** The drain: store → cloud, by cursor, at-least-once. Raw rows go to the Atlas `signals` time-series collection;
 *  per-batch windows become `measurements` with source 'kernel' (M-K-*, docs/07 §3.1). Plugins pushed into
 *  `pipeline_plugins` come back down the same connection. A file sink is the offline twin. docs/20 §7. */
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { MongoClient, type Document } from 'mongodb';
import { COLLECTIONS, type Measurement } from '@3pt/core';
import { TIMESERIES } from '@3pt/battery-atlas';
import type { SignalStore, StoredSignal } from './store.js';
import type { KernelMetric } from './index.js';

export interface PluginDoc { name: string; code: string; version?: number; enabled?: boolean }
export interface Sink {
  name: string;
  write(batch: StoredSignal[]): Promise<void>;
  measure(ms: Measurement[]): Promise<void>;
  plugins(): Promise<PluginDoc[]>;
  close(): Promise<void>;
}

/** Windows over one drained batch, one measurement per (iteration, metric). Counts, never rates: Instrument sums windows. */
export function windows(store: SignalStore, lo: number, hi: number, at = new Date().toISOString()): Measurement[] {
  const out: Measurement[] = [];
  for (const iteration of store.iterationsIn(lo, hi)) {
    const w = 'AND iteration = ?';
    const m = (metric: KernelMetric, value: number, unit = 'count') => { if (value > 0) out.push({ iteration, at, metric, value, unit, source: 'kernel' }); };
    m('M-K-EXEC', store.countIn(lo, hi, 'exec', w, [iteration]));
    m('M-K-OPEN', store.countIn(lo, hi, 'open', w, [iteration]));
    m('M-K-CONN', store.countIn(lo, hi, 'connect', w, [iteration]));
    m('M-K-CONN-UNKNOWN', store.countIn(lo, hi, 'connect', `${w} AND json_extract(attrs,'$.egress') = 'other'`, [iteration]));
    m('M-K-REREAD', store.rereadsIn(lo, hi));   // already scoped to the batch; the same-iteration join is inside
  }
  return out;
}

export async function drainOnce(store: SignalStore, sink: Sink, batch = 500, log: (l: string) => void = () => {}): Promise<{ events: number; measurements: number; cursor: number }> {
  const name = `drain:${sink.name}`;
  let lo = store.cursor(name), events = 0, measurements = 0;
  for (;;) {
    const rows = store.since(lo, batch); if (!rows.length) break;
    const hi = rows[rows.length - 1].id;
    await sink.write(rows);
    const ms = windows(store, lo, hi); if (ms.length) await sink.measure(ms);
    store.advance(name, hi);                     // after the sink accepted the batch: a crash before this line replays it
    events += rows.length; measurements += ms.length; lo = hi;
    if (rows.length < batch) break;
  }
  if (events) log(`[drain] ${events} signals, ${measurements} measurements → ${sink.name} (cursor ${lo})`);
  return { events, measurements, cursor: lo };
}

/** Atlas: the only stateful path. `signals` is a time-series collection (t, meta{host,kind,stage}); the atlas battery creates it. */
export function atlasSink(uri: string, dbName = '3pt'): Sink {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 });
  const db = () => client.db(dbName);
  let ensured = false;
  /** Idempotent: the time-series collection with its TTL, once per process (the atlas battery's provision does the same from TIMESERIES). */
  const ensure = async () => {
    if (ensured) return; await client.connect();
    const ts = TIMESERIES[COLLECTIONS.signals]!;
    const have = await db().listCollections({ name: COLLECTIONS.signals }, { nameOnly: true }).toArray();
    if (!have.length) await db().createCollection(COLLECTIONS.signals, { timeseries: { timeField: ts.timeField, metaField: ts.metaField, granularity: ts.granularity }, expireAfterSeconds: ts.expireAfterSeconds });
    ensured = true;
  };
  return {
    name: 'atlas',
    async write(batch) {
      await ensure();
      await db().collection(COLLECTIONS.signals).insertMany(batch.map(({ id, t, host, kind, stage, ...r }) => ({ t: new Date(t), meta: { host, kind, stage }, boxId: id, ...r })), { ordered: false });
    },
    async measure(ms) { await client.connect(); await db().collection(COLLECTIONS.measurements).insertMany(ms as unknown as Document[]); },
    async plugins() { await client.connect(); return db().collection(COLLECTIONS.pipeline_plugins).find({}).project({ name: 1, code: 1, version: 1, enabled: 1, _id: 0 }).toArray() as Promise<PluginDoc[]>; },
    close: () => client.close(),
  };
}

/** JSONL on disk: the same shape the Atlas sink writes, for CI and for a box with no cluster. */
export function fileSink(path: string): Sink {
  mkdirSync(dirname(path), { recursive: true });
  const put = (kind: string, rows: object[]) => appendFileSync(path, rows.map(r => JSON.stringify({ c: kind, ...r })).join('\n') + '\n');
  return {
    name: 'file',
    async write(batch) { put(COLLECTIONS.signals, batch); },
    async measure(ms) { put(COLLECTIONS.measurements, ms); },
    async plugins() { return []; },
    async close() { /* nothing open */ },
  };
}
