import { COLLECTIONS, type HarnessKind, type Measurement, type Plan, type Policy, type Stage, type StageContext } from '@3pt/core';

/** What a harness adapter returns for one plan. The adapter owns the coding agent; the stage owns persistence. */
export interface BuildResult {
  harness: HarnessKind;
  ok: boolean;
  summary: string;
}

/** One coding agent behind a common call. Add a harness: one adapter here, its key in HarnessKind (docs/10 §5). */
export interface HarnessAdapter {
  kind: HarnessKind;
  run(plan: Plan, policy: Policy): Promise<BuildResult>;
}

/** Dry adapter: records what the agent would receive. Real agent calls replace this per kind. */
const dry = (kind: HarnessKind): HarnessAdapter => ({
  kind,
  async run(plan, policy) {
    const tools = policy.toolGrants.build.length;
    return { harness: kind, ok: true, summary: `${kind} dry run: ${plan.mode} sprint, ${policy.rules.length} rules, ${tools} tool grants` };
  },
});

export const ADAPTERS: Record<HarnessKind, HarnessAdapter> = {
  'claude-code': dry('claude-code'),
  kiro: dry('kiro'),
  codex: dry('codex'),
};

export const buildStage: Stage<BuildResult> = {
  name: 'build',
  async run(ctx: StageContext) {
    const plan = await ctx.store.latest<Plan>(COLLECTIONS.plans, 'iteration');
    if (!plan) throw new Error('build: no plan in store; run the plan stage first');
    const result = await ADAPTERS[ctx.harness].run(plan, ctx.policy);
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
