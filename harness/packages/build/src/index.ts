import { COLLECTIONS, type Measurement, type Plan, type Policy, type Stage, type StageContext } from '@3pt/core';
import { harnessOptions } from '@3pt/strands';

/**
 * Build stage. It reads the latest plan and hands it to a Strands harness that @3pt/strands compiles
 * from the current policy (docs/12). Without ctx.secrets.openrouter it stays a dry run, so CI and
 * the install loop never need the key.
 */
export interface BuildResult {
  ok: boolean;
  summary: string;
  stopReason?: string;
}

export const buildStage: Stage<BuildResult> = {
  name: 'build',
  async run(ctx: StageContext) {
    const plan = await ctx.store.latest<Plan>(COLLECTIONS.plans, 'iteration');
    if (!plan) throw new Error('build: no plan in store; run the plan stage first');
    const key = ctx.secrets.openrouter;
    const result = key ? await live(ctx, plan, key) : {
      ok: true,
      summary: `dry run (no OPENROUTER_API_KEY): ${plan.mode} sprint, ${ctx.policy.rules.length} rules, ${ctx.policy.toolGrants.build.length} tool grants`,
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

/** One Strands invocation. The policy's token budget for build is the hard cap on spend. */
async function live(ctx: StageContext, plan: Plan, key: string): Promise<BuildResult> {
  // Dynamic import: the Strands packages load only when a key is present.
  const { createHarness } = await import('@strands-agents/harness');
  // harnessOptions reads the policy; the cast drops only the deep-readonly wrapper.
  const agent = await createHarness(harnessOptions(ctx.policy as Policy, 'build', key));
  const res = await agent.invoke(`Sprint: ${plan.mode}.\n\n${plan.spec}\n\nDone when:\n${plan.evaluation.map(e => `- ${e}`).join('\n')}`, {
    limits: { turns: 30, totalTokens: ctx.policy.contextPolicy.maxTokensPerStage.build },
  });
  const ok = res.stopReason === 'endTurn';
  return { ok, stopReason: res.stopReason, summary: `${res.stopReason}: ${String(res).slice(0, 200)}` };
}
