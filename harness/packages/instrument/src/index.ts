import { COLLECTIONS, type Finding, type Plan, type Stage, type StageContext } from '@3pt/core';

/**
 * Instrument measures and reports. It does not rewrite the policy or tag a checkpoint: those belong
 * to the improver (@3pt/improver), which runs outside the stage run. See StageContext in @3pt/core.
 */
export const instrumentStage: Stage<Finding[]> = {
  name: 'instrument',
  async run(ctx: StageContext) {
    const [plan] = await ctx.store.find<Plan>(COLLECTIONS.plans, { iteration: ctx.iteration } as Partial<Plan>);
    const checks = plan?.evaluation ?? [];
    const findings: Finding[] = [];                      // standards check results land here, one per check
    for (const f of findings) await ctx.store.insert(COLLECTIONS.findings, f);
    ctx.log(`[instrument] ${checks.length} checks planned, ${findings.length} findings written`);
    return findings;
  },
};
