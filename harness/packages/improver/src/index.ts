/**
 * @3pt/improver — the outer loop. It owns the Policy and the checkpoint lineage.
 * The inner run (Plan → Build → Instrument) gets a frozen policy and a guarded Store from here,
 * reports findings, and returns. Only then does the improver read those findings and write v n+1.
 * Stages are passed in, never imported, so this package depends on @3pt/core alone.
 */
import {
  COLLECTIONS, freezePolicy, runIteration, seedPolicy, stageStore,
  type Checkpoint, type Finding, type HarnessKind, type Policy, type Secrets, type Stage, type Store,
} from '@3pt/core';

/** The backfeed: derive the next policy version from failed checks. Pure. */
export function rewritePolicy(prev: Policy, findings: Finding[], checkpointTag: string): Policy {
  const failed = findings.filter(f => !f.passed);
  const { _id, ...rest } = structuredClone(prev);  // a new version is a new document
  // A lesson already in the rules is not added again, so a repeated failure does not grow every stage prompt.
  const learned = failed
    .filter(f => !prev.rules.some(r => r.endsWith(`(${f.check}): ${f.note}`)))
    .map(f => `Learned at ${checkpointTag} (${f.check}): ${f.note}`);
  return {
    ...rest,
    version: prev.version + 1,
    createdAt: new Date().toISOString(),
    rules: [...prev.rules, ...learned],
    provenance: { checkpoint: checkpointTag, reason: failed.length ? `${failed.length} failed checks` : 'no failed checks; version bump for lineage' },
  };
}

export async function currentPolicy(store: Store): Promise<Policy> {
  return (await store.latest<Policy>(COLLECTIONS.policies, 'version')) ?? (await store.insert(COLLECTIONS.policies, seedPolicy()));
}

/** After a run: read its findings, write the next policy and the checkpoint. */
export async function improve(store: Store, iteration: number, prev: Policy, gitSha: string, log: (l: string) => void): Promise<Checkpoint> {
  const findings = await store.find<Finding>(COLLECTIONS.findings, { iteration } as Partial<Finding>);
  const tag = `cp/${iteration}`;
  const next = rewritePolicy(prev, findings, tag);
  await store.insert(COLLECTIONS.policies, next);
  const cp: Checkpoint = {
    iteration,
    at: new Date().toISOString(),
    gitSha,
    tag,
    policyVersion: next.version,
    metrics: { findings: findings.length, failed: findings.filter(f => !f.passed).length },
    retrospective: `Iteration ${iteration}: policy v${prev.version} → v${next.version}. ${next.provenance.reason}.`,
  };
  await store.insert(COLLECTIONS.checkpoints, cp);
  log(`[improver] policy v${next.version} written; checkpoint ${tag}`);
  return cp;
}

export interface CycleOptions {
  store: Store;                    // unguarded: the improver's own handle
  stages: [Stage, Stage, Stage];
  iteration: number;
  harness: HarnessKind;
  secrets: Secrets;                // injected by the caller (readSecrets at the edge)
  gitSha: string;
  log: (line: string) => void;
}

/** One turn of the self-improving loop: run the stages under a frozen policy, then improve. */
export async function cycle(o: CycleOptions): Promise<Checkpoint> {
  const policy = await currentPolicy(o.store);
  await runIteration(o.stages, {
    iteration: o.iteration,
    policy: freezePolicy(policy),
    store: stageStore(o.store),
    secrets: o.secrets,
    harness: o.harness,
    log: o.log,
  });
  return improve(o.store, o.iteration, policy, o.gitSha, o.log);
}
