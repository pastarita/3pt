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
  findings: 'findings',          // Instrument's standards-check results; the improver's input
  media_index: 'media_index',    // asset id, tier, location, transcript ref
  transcripts: 'transcripts',    // read-once extraction + embedding
  jobs: 'jobs',                  // worker queue: index | transcribe | tier | migrate
  /* the demo firm (data/mock/acme-builders), seeded by infra/batteries/atlas seed-demo */
  demo_projects: 'demo_projects',        // one document per project: building, phases, dates
  demo_photos: 'demo_photos',            // weekly photo drops, one document per photo
  demo_activity: 'demo_activity',        // searches, taps, owner packs built by hand
  demo_outcomes: 'demo_outcomes',        // walls reopened, water stains, missing photos
  harness_versions: 'harness_versions',  // every harness version: changes, why, layouts by role, fields
  app_state: 'app_state',                // snapshot of the app loop after each change (versions, current, choices)
  app_events: 'app_events',              // every tap the app reported: the loop's evidence
  secrets: 'secrets',                    // API keys, value encrypted client-side (CSFLE); see @3pt/battery-atlas vault.ts
} as const;
export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export type SprintMode = 'feature' | 'improvement' | 'fix';
export type StageName = 'plan' | 'build' | 'instrument';
export type HarnessKind = 'claude-code' | 'kiro' | 'codex';
export type Tier = 'hot' | 'cold';

/** The harness's own rules AS DATA. The improver rewrites this; that rewrite is the Recursive Harnessing proof. */
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

/** One result of a standards check. Instrument writes it; only the improver turns it into policy. */
export interface Finding {
  _id?: string;
  iteration: number;
  at: string;
  check: string;                   // which standard, e.g. 'hot-tier budget'
  passed: boolean;
  note: string;                    // what the improver may learn from it
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

/**
 * The loop and the run are separate. The improver (outer loop, @3pt/improver) owns the Policy and
 * the checkpoint lineage. A stage (inner run) sees only a frozen copy of the policy and a Store that
 * refuses writes to what the loop owns. A stage can report findings; it cannot rewrite the harness.
 */
type DeepReadonly<T> = T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;
export type FrozenPolicy = DeepReadonly<Policy>;

/** Collections only the improver may write. Stages read them; a write from a stage throws. */
export const LOOP_OWNED: readonly CollectionName[] = [COLLECTIONS.policies, COLLECTIONS.checkpoints];

/**
 * Keys a stage may use, injected at the edge like the Store. Stages never read process.env: an app
 * (cli, worker) calls readSecrets() once and hands the result in. A missing key means that feature
 * runs dry. Atlas is not here: its URI goes to the atlas battery, which builds the Store.
 */
export interface Secrets {
  readonly openrouter?: string;    // OPENROUTER_API_KEY: every model call (@3pt/strands routes)
  readonly voyage?: string;        // VOYAGE_API_KEY: embeddings
  readonly langsmith?: string;     // LANGSMITH_API_KEY: traces
  readonly github?: string;        // GITHUB_TOKEN: repo battery
}

/** The one place a secret maps to its name. The vault and the key page use these names too. */
export const SECRET_NAMES = {
  openrouter: 'OPENROUTER_API_KEY',
  voyage: 'VOYAGE_API_KEY',
  langsmith: 'LANGSMITH_API_KEY',
  github: 'GITHUB_TOKEN',
} as const satisfies Record<keyof Secrets, string>;

/** Pick the secrets out of a merged key record (see loadKeys()). Blank and `<placeholder>` values count as missing. */
export function readSecrets(env: Readonly<Record<string, string | undefined>>): Secrets {
  const get = (name: string) => {
    const v = env[name]?.trim();
    return v && !v.includes('<') ? v : undefined;
  };
  return Object.freeze(Object.fromEntries(Object.entries(SECRET_NAMES).map(([k, n]) => [k, get(n)])) as Secrets);
}

export interface StageContext {
  iteration: number;
  policy: FrozenPolicy;
  store: Store;                    // guarded: see stageStore()
  secrets: Secrets;                // injected at the edge: see readSecrets()
  harness: HarnessKind;
  log: (line: string) => void;
}

export interface Stage<Out = unknown> {
  name: StageName;
  run(ctx: StageContext): Promise<Out>;
}

function deepFreeze<T>(o: T): T {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v);
  }
  return o;
}

/** A copy of the policy that a stage can read but not change, at compile time or at run time. */
export function freezePolicy(p: Policy): FrozenPolicy {
  return deepFreeze(structuredClone(p));
}

/** Wrap a Store so a stage cannot write policies or checkpoints. */
export function stageStore(store: Store): Store {
  return {
    ...store,
    async insert(c, doc) {
      if (LOOP_OWNED.includes(c)) throw new Error(`stage may not write ${c}; only the improver writes it`);
      return store.insert(c, doc);
    },
  };
}

/** One iteration = Plan → Build → Instrument, in order, never in parallel. Returns each stage's output. */
export async function runIteration(stages: [Stage, Stage, Stage], ctx: StageContext): Promise<unknown[]> {
  const out: unknown[] = [];
  for (const s of stages) {
    ctx.log(`[${s.name}] start iteration ${ctx.iteration}`);
    out.push(await s.run(ctx));
    ctx.log(`[${s.name}] done`);
  }
  return out;
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
      instrument: ['atlas.find', 'atlas.insert', 'tracing.read'],
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
