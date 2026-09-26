import { COLLECTIONS, type Measurement, type Plan, type Stage, type StageContext } from '@3pt/core';

/**
 * Build stage, dry run. It reads the latest plan and reports what the coding agent would receive.
 * The real agent call comes from the Strands compiler (harness/packages/strands, docs/12), which
 * replaces our own adapter layer. Until that package compiles, this stage records one measurement.
 */
export interface BuildResult {
  ok: boolean;
  summary: string;
}

export const buildStage: Stage<BuildResult> = {
  name: 'build',
  async run(ctx: StageContext) {
    const plan = await ctx.store.latest<Plan>(COLLECTIONS.plans, 'iteration');
    if (!plan) throw new Error('build: no plan in store; run the plan stage first');
    const result: BuildResult = {
      ok: true,
      summary: `${ctx.harness} dry run: ${plan.mode} sprint, ${ctx.policy.rules.length} rules, ${ctx.policy.toolGrants.build.length} tool grants`,
    };
    const m: Measurement = {
      iteration: ctx.iteration,
      at: new Date().toISOString(),
      metric: 'M-ERR-build',
      value: result.ok ? 0 : 1,
      unit: 'count',
      source: 'harness',
    };
    await ctx.store.insert(COLLECTIONS.measurements, m);
    ctx.log(`[build] ${result.summary}`);
    return result;
  },
};
