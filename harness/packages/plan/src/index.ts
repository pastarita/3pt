import { COLLECTIONS, type Checkpoint, type Finding, type Measurement, type Plan, type SprintMode, type Stage, type StageContext } from '@3pt/core';

/** Every IMPROVE_EVERY-th iteration is an improvement sprint: Instrument checks whether past grants worked. */
export const IMPROVE_EVERY = 4;

/**
 * Sprint-mode selector. Mostly feature sprints (find new problems, grant answers).
 * Fix when the last run broke (M-ERR) or an improvement sprint found a grant that did not work.
 * Improvement on a fixed cadence once there is at least one grant to judge.
 */
export function selectMode(iteration: number, last: Checkpoint | null, recent: Measurement[], lastFindings: Finding[] = [], grants = 0): SprintMode {
  if (!last) return 'feature';
  const errors = recent.filter(m => m.metric.startsWith('M-ERR')).reduce((a, m) => a + m.value, 0);
  if (errors > 0) return 'fix';
  if (lastFindings.some(f => f.check.startsWith('effect:') && !f.passed)) return 'fix';
  if (grants > 0 && iteration % IMPROVE_EVERY === 0) return 'improvement';
  return 'feature';
}

const EVALUATION: Record<SprintMode, string[]> = {
  feature: ['project checks: a new problem crosses its bar with no grant to answer it'],
  improvement: ['effect checks: each grant cut the problem it answers'],
  fix: ['debug each grant that did not work; revoke it'],
};

export const planStage: Stage<Plan> = {
  name: 'plan',
  async run(ctx: StageContext) {
    const last = await ctx.store.latest<Checkpoint>(COLLECTIONS.checkpoints, 'iteration');
    const recent = await ctx.store.find<Measurement>(COLLECTIONS.measurements, { iteration: ctx.iteration - 1 } as Partial<Measurement>);
    const lastFindings = await ctx.store.find<Finding>(COLLECTIONS.findings, { iteration: ctx.iteration - 1 } as Partial<Finding>);
    const grants = ctx.policy.toolGrants.build.filter(g => /^(field|tool|flag)\./.test(g)).length;
    const mode = selectMode(ctx.iteration, last, recent, lastFindings, grants);
    const plan: Plan = {
      iteration: ctx.iteration,
      at: new Date().toISOString(),
      mode,
      spec: `Iteration ${ctx.iteration}: ${mode} sprint over the media workload under policy v${ctx.policy.version}.`,
      evaluation: EVALUATION[mode],
      basedOn: { checkpoint: last?.tag, policyVersion: ctx.policy.version },
    };
    await ctx.store.insert(COLLECTIONS.plans, plan);
    ctx.log(`[plan] mode=${mode} basedOn=${last?.tag ?? 'none'}`);
    return plan;
  },
};
