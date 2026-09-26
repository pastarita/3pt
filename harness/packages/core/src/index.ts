/**
 * @3pt/core — the contract every stage, surface and battery agrees on.
 * docs/00-vision.md (the three points), docs/03-workflow.md (the initialized pipeline),
 * docs/10-architecture.md (where this sits in the monorepo).
 *
 * Nothing here talks to a network. Atlas access is injected through `Store` so the runner can be
 * exercised against memory in tests and against the Sandbox cluster in production.
 */

/** Atlas collection names. Single source: infra/batteries/atlas provisions exactly these. */
export const COLLECTIONS = {
  policies: 'policies',          // versioned harness rules, context policies, tool grants
  checkpoints: 'checkpoints',    // git sha + policy version + metrics + retrospective
  plans: 'plans',                // Plan stage output per iteration
  measurements: 'measurements',  // hard metric signals per iteration (M-* in docs/07)
  media_index: 'media_index',    // asset id, tier, location, transcript ref
  transcripts: 'transcripts',    // read-once extraction + embedding
  jobs: 'jobs',                  // worker queue: index | transcribe | tier | migrate
  /* the demo firm (data/mock/acme-builders), seeded by infra/batteries/atlas seed-demo */
  demo_projects: 'demo_projects',        // one document per project: building, phases, dates
  demo_photos: 'demo_photos',            // weekly photo drops, one document per photo
  demo_activity: 'demo_activity',        // searches, taps, owner packs built by hand
  demo_outcomes: 'demo_outcomes',        // walls reopened, water stains, missing photos
  harness_versions: 'harness_versions',  // every harness version: changes, why, layouts by role, fields
} as const;
export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export type SprintMode = 'feature' | 'improvement' | 'fix';
export type StageName = 'plan' | 'build' | 'instrument';
export type HarnessKind = 'claude-code' | 'kiro' | 'codex';
export type Tier = 'hot' | 'cold';

/** The harness's own rules AS DATA. Instrument rewrites this; that rewrite is the Recursive Harnessing proof. */
export interface Policy {
  _id?: string;
  version: number;
  createdAt: string;               // ISO
  rules: string[];                 // natural-language rules injected into every stage prompt
  contextPolicy: {
    maxTokensPerStage: Record<StageName, number>;
    readOnceTranscripts: boolean;  // never re-read image bytes when a transcript exists
    hotTierBudgetMB: number;
  };
  toolGrants: Record<StageName, string[]>;   // MCP tool names each stage may call
  provenance: { checkpoint?: string; reason: string };
}

export interface Measurement {
  _id?: string;
  iteration: number;
  at: string;
  metric: string;                  // M-* id from docs/07-assessment-and-measurement.md
  value: number;
  unit: string;
  source: 'langsmith' | 'atlas' | 'git' | 'harness';
}

export interface Plan {
  _id?: string;
  iteration: number;
  at: string;
  mode: SprintMode;
  spec: string;
  evaluation: string[];            // what Instrument will check
  basedOn: { checkpoint?: string; policyVersion: number };
}

export interface Checkpoint {
  _id?: string;
  iteration: number;
  at: string;
  gitSha: string;
  tag: string;                     // cp/<iteration>
  policyVersion: number;
  metrics: Record<string, number>;
  retrospective: string;
}

export interface MediaAsset {
  _id?: string;
  assetId: string;
  tier: Tier;
  location: { backend: 'gridfs' | 'r2' | 'fs'; key: string };
  transcriptId?: string;
  bytes: number;
  lastRead?: string;
}

export interface Job {
  _id?: string;
  kind: 'index' | 'transcribe' | 'tier' | 'migrate';
  assetId?: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  attempts: number;
  createdAt: string;
}

/** Minimal persistence contract. The atlas battery supplies the real one; tests use memoryStore(). */
export interface Store {
  insert<T extends object>(c: CollectionName, doc: T): Promise<T & { _id: string }>;
  latest<T extends object>(c: CollectionName, sortKey: keyof T & string): Promise<T | null>;
  find<T extends object>(c: CollectionName, filter: Partial<T>): Promise<T[]>;
}

export interface StageContext {
  iteration: number;
  policy: Policy;
  store: Store;
  harness: HarnessKind;
  log: (line: string) => void;
}

export interface Stage<Out = unknown> {
  name: StageName;
  run(ctx: StageContext): Promise<Out>;
}

/** One iteration = Plan → Build → Instrument, in order, never in parallel. */
export async function runIteration(stages: [Stage, Stage, Stage], ctx: StageContext): Promise<void> {
  for (const s of stages) {
    ctx.log(`[${s.name}] start iteration ${ctx.iteration}`);
    await s.run(ctx);
    ctx.log(`[${s.name}] done`);
  }
}

/** The policy the loop starts from before Instrument has ever rewritten anything. */
export function seedPolicy(): Policy {
  return {
    version: 0,
    createdAt: new Date().toISOString(),
    rules: [
      'Atlas is the only state store; nothing stateful lives in process memory across iterations.',
      'Read an image once, store the transcript, re-read only deliberately.',
      'The harness is the product; the UI is an inspector.',
    ],
    contextPolicy: { maxTokensPerStage: { plan: 40_000, build: 120_000, instrument: 60_000 }, readOnceTranscripts: true, hotTierBudgetMB: 512 },
    toolGrants: {
      plan: ['atlas.find', 'atlas.latest'],
      build: ['atlas.find', 'atlas.insert', 'blob.get', 'repo.worktree'],
      instrument: ['atlas.*', 'repo.tag', 'tracing.read', 'policy.write'],
    },
    provenance: { reason: 'seed' },
  };
}

/** In-memory Store for tests and for running the loop before the Sandbox cluster exists. */
export function memoryStore(): Store {
  const data = new Map<string, Array<Record<string, unknown>>>();
  let n = 0;
  const col = (c: string) => data.get(c) ?? (data.set(c, []), data.get(c)!);
  return {
    async insert(c, doc) { const d = { ...doc, _id: `mem-${++n}` }; col(c).push(d); return d; },
    async latest(c, k) { const rows = col(c) as any[]; return rows.length ? rows.slice().sort((a, b) => (a[k] < b[k] ? 1 : -1))[0] : null; },
    async find(c, f) { return (col(c) as any[]).filter(r => Object.entries(f).every(([k, v]) => r[k] === v)); },
  };
}
