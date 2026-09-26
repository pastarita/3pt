/** Idempotent: ensure the store exists with its schema, print the plan (sensors, pipeline, sink), and say whether this
 *  machine can run sensors. Never starts bpftrace. The box role installs bpftrace and the unit; Atlas collections
 *  (`signals` time-series, `pipeline_plugins`) are the atlas battery's provision. docs/20 §4. */
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SENSORS, MENU, KERNEL_METRICS } from './index.js';
import { SignalStore } from './store.js';
import { pipelineOptions } from './pipeline.js';
import { atlasUri, envOr } from './env.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = envOr('SIGNALS_DB', resolve(root, '.signals', 'signals.db'));
const o = pipelineOptions();
console.log(`[signals] store=${dbPath} sink=${envOr('SIGNALS_SINK', atlasUri() ? 'atlas' : 'file')} drain=${envOr('SIGNALS_DRAIN_MS', '30000')}ms`);
console.log(`[signals] pipeline: normalize → enrich → redact → strip(${o.stripAttrs.join(',') || '-'}) → sample(${Object.entries(o.sampleRates).map(([k, v]) => `${k}=${v}`).join(' ')}) → plugins`);
for (const s of SENSORS) console.log(`[signals] sensor ${s.name.padEnd(8)} ${s.hook.padEnd(42)} → ${s.feeds.join(', ') || '-'}`);
console.log(`[signals] metrics ${KERNEL_METRICS.join(' ')} → measurements(source=kernel)`);
console.log(`[signals] menu: ${Object.entries(MENU).map(([k, v]) => `${k} ${v.filter(i => i.status === 'implemented').length}/${v.length}`).join(' · ')} implemented`);
let bpftrace = 'missing';
try { bpftrace = execFileSync('bpftrace', ['--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* not on this machine */ }
console.log(`[signals] bpftrace here: ${bpftrace}${bpftrace === 'missing' ? ' (the box role installs it; --replay works anywhere)' : ''}`);
const store = new SignalStore(dbPath);
const st = store.stats(); store.close();
console.log(`[signals] store ok: ${st.events} events, cursors ${st.cursors.map(c => `${c.name}@${c.pos}`).join(' ') || '-'}`);
