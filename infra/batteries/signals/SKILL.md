---
name: battery-signals
description: Kernel-witnessed signals from the box. bpftrace sensors (exec, exit, open, connect) feed a transform pipeline (normalize, enrich, redact, strip, sample, pushed plugins) into a SQLite WAL store on the box, which a drain offloads to Atlas as `signals` (time-series) and `measurements` (source kernel). Load when a stage holds a signals.* grant, when Instrument needs an independent witness for a check (read-once, egress), or when pushing a decisioning plugin into the box pipeline.
---
# Battery: Signals
Doc of record: `docs/20-kernel-signals.md`. The box (`infra/batteries/box`) installs bpftrace and runs `3pt-signals` as root under systemd.

1. Sensors are bpftrace programs in `sensors/`, one hook each, JSON lines out; `SENSORS` in `src/index.ts` is the catalogue. `SIGNALS_SENSORS=exec,open` picks a subset.
2. The pipeline order is fixed: normalize → enrich → redact → strip → sample → plugins. Redaction precedes every write. `SIGNALS_SAMPLE=open=0.1,exit=0.2` sets rates; media opens and findings are never sampled out.
3. Plugins are `module.exports = (signal, ctx) => Signal | Signal[] | null`, in `plugins/` (watched) or in Atlas `pipeline_plugins` (`{name, code, version, enabled}`, pulled every drain). They run in a vm context: no require, no network. `plugins/reread-alarm.js` is the worked example.
4. The store is `SIGNALS_DB` (default `.signals/signals.db`; `/var/lib/3pt/signals.db` on the box). `3pt-signals --query "SELECT …"` reads it; `--status` prints counts and cursors.
5. The drain runs every `SIGNALS_DRAIN_MS` by cursor, at-least-once: rows → `signals`, per-batch windows → `measurements` (M-K-EXEC, M-K-OPEN, M-K-REREAD, M-K-CONN, M-K-CONN-UNKNOWN). `SIGNALS_SINK=file` writes JSONL instead (CI, no cluster).
6. `pnpm --filter @3pt/battery-signals run replay` pushes `fixtures/replay.jsonl` through everything without root or eBPF. `box.sh play signals` converges the box; `box.sh verify` shows the unit and the store.

Tool grants this battery satisfies: `signals.read`, `signals.query`, `signals.plugin`.
