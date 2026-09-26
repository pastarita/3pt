/** @3pt/battery-signals — kernel-witnessed signals from the box. docs/20-kernel-signals.md.
 *  sensors (bpftrace, declared) → pipeline (normalize · enrich · redact · strip · sample · plugins) → store (SQLite WAL) → drain (Atlas).
 *  Stages never see a sensor. They see `measurements` with source 'kernel' and the `finding` signals a plugin raised;
 *  Instrument turns those into findings, the improver turns findings into policy. The kernel is the witness the
 *  harness cannot talk over: a file open is a file open. */

export type SignalKind = 'exec' | 'exit' | 'open' | 'connect' | 'finding' | 'agent';

/** The canonical event, shaped like an OpenTelemetry log record: timestamp, resource (host), body (kind), attributes. */
export interface Signal {
  t: string;                  // ISO, from the sensor's monotonic nanoseconds rebased at agent start
  host: string;               // the box's hostname (resource)
  kind: SignalKind;
  pid: number;
  comm: string;
  stage: string;              // plan | build | instrument | worker | unknown — from the marker file
  iteration: number;          // 0 when no marker
  attrs: Record<string, string | number | boolean>;
}

export type Cluster = 'process' | 'file' | 'net' | 'resource';
export interface Sensor { name: string; kind: SignalKind; cluster: Cluster; file: string; hook: string; feeds: string[]; cost: 'low' | 'medium' | 'high'; note: string }

/** The sensors shipped in ./sensors. `SIGNALS_SENSORS` picks a subset; each runs as its own bpftrace process. */
export const SENSORS: Sensor[] = [
  { name: 'exec',    kind: 'exec',    cluster: 'process', file: 'sensors/exec.bt',    hook: 'tracepoint:syscalls:sys_enter_execve', feeds: ['M-K-EXEC'],   cost: 'low',    note: 'who ran what; uid and cgroup for correlation' },
  { name: 'exit',    kind: 'exit',    cluster: 'process', file: 'sensors/exit.bt',    hook: 'tracepoint:sched:sched_process_exit',  feeds: [],             cost: 'low',    note: 'process end; sampled at 20 %' },
  { name: 'open',    kind: 'open',    cluster: 'file',    file: 'sensors/open.bt',    hook: 'tracepoint:syscalls:sys_enter_openat', feeds: ['M-K-OPEN', 'M-K-REREAD'], cost: 'medium', note: 'workload comms only; media paths always kept' },
  { name: 'connect', kind: 'connect', cluster: 'net',     file: 'sensors/connect.bt', hook: 'kprobe:tcp_v4_connect (BTF)',          feeds: ['M-K-CONN', 'M-K-CONN-UNKNOWN'], cost: 'low', note: 'outbound v4 connects; classed atlas | https | local | other by port and address' },
];

/** M-* ids this battery emits into `measurements` (source 'kernel'). Defined in docs/07 §3.1 (M-20…M-24). */
export const KERNEL_METRICS = ['M-K-EXEC', 'M-K-OPEN', 'M-K-REREAD', 'M-K-CONN', 'M-K-CONN-UNKNOWN'] as const;
export type KernelMetric = (typeof KERNEL_METRICS)[number];

export type MenuStatus = 'implemented' | 'listed' | 'rejected';
export interface MenuItem { option: string; status: MenuStatus; note: string }
/** The capability menu: what a recipe may pick per slot. `implemented` = in this battery today. docs/20 §3. */
export const MENU: Record<'probe' | 'sensor' | 'transform' | 'store' | 'sink' | 'feedback', MenuItem[]> = {
  probe: [
    { option: 'bpftrace scripts',            status: 'implemented', note: 'apt package on the box; one process per sensor; JSON lines out' },
    { option: 'BCC tools (execsnoop, opensnoop, tcpconnect)', status: 'listed', note: 'bpfcc-tools; same hooks, Python front-ends' },
    { option: 'libbpf CO-RE / bpftool skeletons', status: 'listed', note: 'compiled sensors with ring buffers; needs clang on the box' },
    { option: 'cilium/ebpf (Go) · Aya (Rust)', status: 'listed', note: 'library route for a long-lived agent' },
    { option: 'Tetragon standalone',          status: 'listed', note: 'Cilium\'s sensor runtime with TracingPolicy YAML; `tetra getevents -o json` feeds the same pipeline' },
    { option: 'auditd · /proc polling · strace', status: 'listed', note: 'no-eBPF fallback when the kernel lacks BTF or the VM lacks CAP_BPF' },
  ],
  sensor: [
    { option: 'exec · exit', status: 'implemented', note: 'process cluster' },
    { option: 'openat (workload comms)', status: 'implemented', note: 'file cluster; the read-once witness' },
    { option: 'tcp_v4_connect', status: 'implemented', note: 'net cluster' },
    { option: 'sched · cpu profile · block io · memory', status: 'listed', note: 'resource cluster; map output needs bpftrace -f json' },
    { option: 'DNS (udp sendmsg :53) · TLS SNI (uprobe on OpenSSL)', status: 'listed', note: 'names for the connect sensor\'s addresses' },
  ],
  transform: [
    { option: 'normalize (OTel log record shape)', status: 'implemented', note: 'sensor JSON → Signal' },
    { option: 'enrich (stage, iteration, media, egress class)', status: 'implemented', note: 'marker file + prefixes + port table' },
    { option: 'redact (URI credentials, tokens, home dirs, secret paths)', status: 'implemented', note: 'runs before anything is written' },
    { option: 'strip (drop attrs by name)', status: 'implemented', note: 'SIGNALS_STRIP' },
    { option: 'sample (deterministic hash, per kind; media and findings always kept)', status: 'implemented', note: 'SIGNALS_SAMPLE' },
    { option: 'plugins (pushed code: decisioning, inference)', status: 'implemented', note: 'plugins/ dir watched; Atlas pipeline_plugins pulled each drain' },
    { option: 'OpenTelemetry Collector processors (filter, transform/OTTL, redaction, tail sampling)', status: 'listed', note: 'the same chain as a collector config; K3' },
    { option: 'Vector VRL remap · Fluent Bit filters', status: 'listed', note: 'K4' },
  ],
  store: [
    { option: 'SQLite WAL via node:sqlite', status: 'implemented', note: 'events + cursors + plugins; parsable with SQL; zero deps' },
    { option: 'JSONL segments with fsync + rotation', status: 'listed', note: 'parsable by anything; no query' },
    { option: 'Collector / Vector disk buffer', status: 'listed', note: 'comes with K3 / K4' },
    { option: 'Cloudflare Durable Object', status: 'rejected', note: 'the namesake, but the box is the edge here and must work offline' },
  ],
  sink: [
    { option: 'Atlas `signals` time-series (raw, TTL 7 d) + `measurements` (source kernel)', status: 'implemented', note: 'the only stateful path (docs/05 rule 1)' },
    { option: 'JSONL file sink', status: 'implemented', note: 'SIGNALS_SINK=file; the offline and CI path' },
    { option: 'Neon Postgres (relational: per-iteration rollups)', status: 'listed', note: 'MCP available; second sink when the judges ask for SQL' },
    { option: 'Atlas Vector Search over finding narratives', status: 'listed', note: 'embed the retrospective of a kernel finding; transcripts_vec already exists' },
  ],
  feedback: [
    { option: 'Instrument: kernel measurements + finding signals → findings', status: 'implemented', note: '@3pt/instrument kernelChecks()' },
    { option: 'Improver: failed findings → policy rule', status: 'implemented', note: 'already the improver\'s job; nothing added' },
    { option: 'Plan: reads M-K-* to pick a fix sprint', status: 'listed', note: 'docs/07 §3.2' },
  ],
};

export const battery = {
  name: 'signals',
  provides: ['signals.read', 'signals.query', 'signals.plugin'],
  env: ['SIGNALS_DB', 'SIGNALS_SENSORS', 'SIGNALS_SINK', 'SIGNALS_FILE_SINK', 'SIGNALS_DRAIN_MS', 'SIGNALS_PLUGIN_DIR', 'SIGNALS_MEDIA_PREFIXES', 'SIGNALS_STRIP', 'SIGNALS_SAMPLE', 'SIGNALS_MARKER', 'SIGNALS_ITERATION', 'SIGNALS_RETENTION_DAYS'],
  mcp: 'none of its own; it drains into the atlas battery\'s cluster and pulls plugins from it',
} as const;

export { parseLine, normalize, enrich, redact, strip, sample, compose, PluginHost, pipelineOptions, type Transform, type PipelineCtx, type PipelineOptions, type RawEvent } from './pipeline.js';
export { SignalStore, type StoredSignal } from './store.js';
export { drainOnce, windows, atlasSink, fileSink, type Sink } from './drain.js';
