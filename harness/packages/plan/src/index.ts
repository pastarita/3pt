import { COLLECTIONS, type Checkpoint, type Measurement, type Plan, type SprintMode, type Stage, type StageContext } from '@3pt/core';

/** Sprint-mode selector. Fix if the last checkpoint regressed, improvement if metrics are flat, else feature. */
export function selectMode(last: Checkpoint | null, recent: Measurement[]): SprintMode {
  if (!last) return 'feature';
  const errors = recent.filter(m => m.metric.startsWith('M-ERR')).reduce((a, m) => a + m.value, 0);
  if (errors > 0) return 'fix';
  const flat = recent.length > 0 && recent.every(m => m.value === 0);
  return flat ? 'improvement' : 'feature';
}

export const planStage: Stage<Plan> = {
  name: 'plan',
  async run(ctx: StageContext) {
    const last = await ctx.store.latest<Checkpoint>(COLLECTIONS.checkpoints, 'iteration');
    const recent = await ctx.store.find<Measurement>(COLLECTIONS.measurements, { iteration: ctx.iteration - 1 } as Partial<Measurement>);
    const mode = selectMode(last, recent);
    const plan: Plan = {
      iteration: ctx.iteration,
      at: new Date().toISOString(),
      mode,
      spec: `Iteration ${ctx.iteration}: ${mode} sprint over the media workload under policy v${ctx.policy.version}.`,
      evaluation: ['standards checks pass', 'hot-tier budget respected', 'transcript reuse rate reported'],
      basedOn: { checkpoint: last?.tag, policyVersion: ctx.policy.version },
    };
    await ctx.store.insert(COLLECTIONS.plans, plan);
    ctx.log(`[plan] mode=${mode} basedOn=${last?.tag ?? 'none'}`);
    return plan;
  },
};
