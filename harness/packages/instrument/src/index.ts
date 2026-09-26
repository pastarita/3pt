import { COLLECTIONS, type Checkpoint, type Policy, type Stage, type StageContext } from '@3pt/core';

/** The backfeed: derive the next policy version from what this iteration measured. Pure. */
export function rewritePolicy(prev: Policy, findings: string[], checkpointTag: string): Policy {
  return {
    ...prev,
    version: prev.version + 1,
    createdAt: new Date().toISOString(),
    rules: [...prev.rules, ...findings.map(f => `Learned at ${checkpointTag}: ${f}`)],
    provenance: { checkpoint: checkpointTag, reason: findings.length ? 'instrument findings' : 'no findings; version bump for lineage' },
  };
}

export const instrumentStage: Stage<Checkpoint> = {
  name: 'instrument',
  async run(ctx: StageContext) {
    const findings: string[] = [];                       // standards checks land here
    const tag = `cp/${ctx.iteration}`;
    const next = rewritePolicy(ctx.policy, findings, tag);
    await ctx.store.insert(COLLECTIONS.policies, next);
    const cp: Checkpoint = {
      iteration: ctx.iteration,
      at: new Date().toISOString(),
      gitSha: process.env.GIT_SHA ?? 'unknown',
      tag,
      policyVersion: next.version,
      metrics: {},
      retrospective: `Iteration ${ctx.iteration}: policy v${ctx.policy.version} → v${next.version}.`,
    };
    await ctx.store.insert(COLLECTIONS.checkpoints, cp);
    ctx.log(`[instrument] policy v${next.version} written; checkpoint ${tag}`);
    return cp;
  },
};
