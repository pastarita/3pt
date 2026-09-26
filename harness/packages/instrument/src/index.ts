import { COLLECTIONS, type Finding, type Measurement, type Plan, type Stage, type StageContext } from '@3pt/core';

/**
 * Instrument measures and reports. It does not rewrite the policy or tag a checkpoint: those belong
 * to the improver (@3pt/improver), which runs outside the stage run. See StageContext in @3pt/core.
 */

/** A row of the Atlas `signals` collection, as the signals battery drains it (only the fields Instrument reads). */
interface FindingSignal { kind: string; iteration: number; attrs: Record<string, string | number | boolean> }

/** The kernel witness: measurements the signals battery drained (source 'kernel', docs/20) and the `finding` signals
 *  a pipeline plugin raised, turned into standards-check results. Pure. Provenance: docs/20 §1. */
export function kernelChecks(policy: { contextPolicy: { readOnceTranscripts: boolean } }, iteration: number, at: string, kernel: Measurement[], raised: FindingSignal[]): Finding[] {
  if (!kernel.length && !raised.length) return [];
  const sum = (metric: string) => kernel.filter(m => m.metric === metric).reduce((a, m) => a + m.value, 0);
  const execs = sum('M-K-EXEC'), opens = sum('M-K-OPEN'), rereads = sum('M-K-REREAD'), unknown = sum('M-K-CONN-UNKNOWN');
  const out: Finding[] = [{ iteration, at, check: 'kernel:witness', passed: true, note: `the box's kernel saw ${execs} execs, ${opens} opens, ${sum('M-K-CONN')} connects this iteration` }];
  if (policy.contextPolicy.readOnceTranscripts) out.push({
    iteration, at, check: 'kernel:read-once', passed: rereads === 0,
    note: rereads === 0 ? 'no media file was opened twice' : `${rereads} media opens were re-reads of a path already opened this iteration; route reads through transcripts`,
  });
  out.push({ iteration, at, check: 'kernel:egress', passed: unknown === 0, note: unknown === 0 ? 'every outbound connect was Atlas, https, or local' : `${unknown} outbound connects were neither Atlas, https, nor local` });
  for (const r of raised) {
    const check = String(r.attrs.check ?? 'kernel:plugin'), by = String(r.attrs.by ?? 'plugin');
    if (out.some(f => f.check === check && f.note.includes(`(${by})`))) continue;
    out.push({ iteration, at, check, passed: r.attrs.passed === true, note: `raised on the box by ${by} (${by}): ${Object.entries(r.attrs).filter(([k]) => !['check', 'by', 'passed'].includes(k)).map(([k, v]) => `${k}=${v}`).join(' ')}` });
  }
  return out;
}

export const instrumentStage: Stage<Finding[]> = {
  name: 'instrument',
  async run(ctx: StageContext) {
    const [plan] = await ctx.store.find<Plan>(COLLECTIONS.plans, { iteration: ctx.iteration } as Partial<Plan>);
    const checks = plan?.evaluation ?? [];
    const findings: Finding[] = [];                      // standards check results land here, one per check
    const at = new Date().toISOString();
    const kernel = await ctx.store.find<Measurement>(COLLECTIONS.measurements, { iteration: ctx.iteration, source: 'kernel' } as Partial<Measurement>);
    const raised = await ctx.store.find<FindingSignal>(COLLECTIONS.signals, { kind: 'finding', iteration: ctx.iteration } as Partial<FindingSignal>);
    findings.push(...kernelChecks(ctx.policy, ctx.iteration, at, kernel, raised));
    for (const f of findings) await ctx.store.insert(COLLECTIONS.findings, f);
    ctx.log(`[instrument] ${checks.length} checks planned, ${findings.length} findings written${kernel.length ? ` (${kernel.length} kernel measurements, ${raised.length} raised on the box)` : ''}`);
    return findings;
  },
};
