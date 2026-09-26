import { COLLECTIONS, type Finding, type FrozenPolicy, type Measurement, type Plan, type SprintMode, type Stage, type StageContext } from '@3pt/core';

/**
 * Instrument measures and reports. It does not rewrite the policy or tag a checkpoint: those belong
 * to the improver (@3pt/improver), which runs outside the stage run. See StageContext in @3pt/core.
 *
 * It reads what happened on the projects (demo_outcomes, demo_activity) in a rolling window of the last
 * WINDOW iterations, writes one measurement per check every iteration, then runs the checks of the sprint:
 *   feature      a problem crosses its bar and no grant answers it   → finding with `answer` (grant it)
 *   improvement  a grant at least MIN_AGE old did not cut its problem → failed `effect:` finding
 *   fix          debug each failed effect: where the problem still is → finding with `revoke`
 */
export interface OutcomeRow { iteration: number; kind: string; found?: string; project?: string }
export interface ActivityRow { iteration: number; action: string; result?: string; minutes?: number; project?: string }

export interface ProjectCheck {
  check: string;
  metric: string;                       // M-* id written each iteration
  answeredBy: string;                   // the build grant that answers the problem
  bar: number;                          // one bar rule for all: the problem shows up this often in the window
  pick(o: OutcomeRow[], a: ActivityRow[]): { project?: string; weight: number }[];
  note(n: number): string;
}

// Demo tuning (authored, one value each, not per check): see docs/10-architecture.md §4.2.
export const WINDOW = 3;                // iterations; one iteration = one month in `3pt replay`
export const MIN_AGE = 6;               // a grant is judged only after this many iterations
export const COOLDOWN = 12;             // a revoked grant is not granted again for this many iterations

// Authored: which signal each check watches and which grant answers it. The bar is the same for every
// check (3 events, or 3 hours of hand work, in the window) so no threshold is tuned to a known answer.
export const PROJECT_CHECKS: ProjectCheck[] = [
  {
    check: 'search-miss', metric: 'M-P-search-miss', answeredBy: 'field.unit_level_trade', bar: 3,
    pick: (_o, a) => a.filter(r => r.action === 'search' && r.result === 'no').map(r => ({ project: r.project, weight: 1 })),
    note: n => `${n} photo searches found nothing; photos carry no unit, level or trade`,
  },
  {
    check: 'wall-evidence', metric: 'M-P-wall', answeredBy: 'tool.open_wall_gap', bar: 3,
    pick: o => o.filter(r => r.kind === 'wall_reopened' || r.kind === 'closed_without_open_wall_photo').map(r => ({ project: r.project, weight: 1 })),
    note: n => `${n} walls closed or reopened with no open-wall photo; remind before drywall`,
  },
  {
    check: 'water-late', metric: 'M-P-water-late', answeredBy: 'flag.issue_on_arrival', bar: 3,
    pick: o => o.filter(r => r.kind === 'water_stain' && r.found === 'at closeout').map(r => ({ project: r.project, weight: 1 })),
    note: n => `${n} water stains found only at closeout; flag issue photos the day they arrive`,
  },
  {
    check: 'manual-pack', metric: 'M-P-pack-hours', answeredBy: 'tool.owner_pack', bar: 3,
    pick: (_o, a) => a.filter(r => r.action === 'owner_pack_by_hand').map(r => ({ project: r.project, weight: (r.minutes ?? 0) / 60 })),
    note: n => `${Math.round(n)} hours spent building owner packs by hand; automate the pack`,
  },
];

const total = (xs: { weight: number }[]) => Math.round(xs.reduce((s, x) => s + x.weight, 0) * 10) / 10;

/** What Instrument knows about the past, read from the store: when each grant happened and its value then. */
export interface History {
  grantedAt: Record<string, { iteration: number; value: number }>;   // by check, the latest grant
  revokedAt: Record<string, number>;                                  // by check, the latest revoke
  failedEffects: string[];                                            // checks whose effect failed last iteration
}

/** Pure: run the sprint's checks over one window under one policy. */
export function runChecks(mode: SprintMode, policy: FrozenPolicy, iteration: number, o: OutcomeRow[], a: ActivityRow[], h: History, at = new Date().toISOString()) {
  const findings: Finding[] = [];
  const measurements: Measurement[] = [];
  for (const c of PROJECT_CHECKS) {
    const rows = c.pick(o, a);
    const n = total(rows);
    measurements.push({ iteration, at, metric: c.metric, value: n, unit: 'count', source: 'atlas' });
    const granted = policy.toolGrants.build.includes(c.answeredBy);
    const g = h.grantedAt[c.check];

    if (mode === 'feature' && !granted) {
      const cooling = h.revokedAt[c.check] !== undefined && iteration - h.revokedAt[c.check] < COOLDOWN;
      findings.push({ iteration, at, check: c.check, passed: n < c.bar, note: c.note(n), ...(cooling ? {} : { answer: c.answeredBy }) });
    }
    if (mode === 'improvement' && granted && g && iteration - g.iteration >= MIN_AGE) {
      const worked = n < g.value;
      findings.push({ iteration, at, check: `effect:${c.check}`, passed: worked,
        note: `${c.answeredBy} ${worked ? 'worked' : 'did not work'}: ${g.value} at grant (cp/${g.iteration}), ${n} now` });
    }
    if (mode === 'fix' && granted && h.failedEffects.includes(c.check)) {
      const by = new Map<string, number>();
      for (const r of rows) by.set(r.project ?? '?', (by.get(r.project ?? '?') ?? 0) + r.weight);
      const where = [...by].sort((x, y) => y[1] - x[1]).slice(0, 3).map(([p, w]) => `${p.slice(0, 3)} ${Math.round(w)}`).join(', ');
      findings.push({ iteration, at, check: `fix:${c.check}`, passed: false, revoke: c.answeredBy,
        note: `revoked ${c.answeredBy}: problem still at ${n} (was ${g?.value ?? '?'}); still on ${where || 'no project'}` });
    }
  }
  return { findings, measurements };
}

async function history(ctx: StageContext): Promise<History> {
  const h: History = { grantedAt: {}, revokedAt: {}, failedEffects: [] };
  for (const c of PROJECT_CHECKS) {
    const grants = (await ctx.store.find<Finding>(COLLECTIONS.findings, { check: c.check } as Partial<Finding>)).filter(f => !f.passed && f.answer);
    const lastGrant = grants.sort((x, y) => y.iteration - x.iteration)[0];
    if (lastGrant) {
      const [m] = await ctx.store.find<Measurement>(COLLECTIONS.measurements, { iteration: lastGrant.iteration, metric: c.metric } as Partial<Measurement>);
      h.grantedAt[c.check] = { iteration: lastGrant.iteration, value: m?.value ?? 0 };
    }
    const revokes = await ctx.store.find<Finding>(COLLECTIONS.findings, { check: `fix:${c.check}` } as Partial<Finding>);
    if (revokes.length) h.revokedAt[c.check] = Math.max(...revokes.map(f => f.iteration));
    const effects = await ctx.store.find<Finding>(COLLECTIONS.findings, { check: `effect:${c.check}`, iteration: ctx.iteration - 1 } as Partial<Finding>);
    if (effects.some(f => !f.passed)) h.failedEffects.push(c.check);
  }
  return h;
}

export const instrumentStage: Stage<Finding[]> = {
  name: 'instrument',
  async run(ctx: StageContext) {
    const [plan] = await ctx.store.find<Plan>(COLLECTIONS.plans, { iteration: ctx.iteration } as Partial<Plan>);
    const mode = plan?.mode ?? 'feature';
    const o: OutcomeRow[] = [];
    const a: ActivityRow[] = [];
    for (let i = ctx.iteration - WINDOW + 1; i <= ctx.iteration; i++) {
      o.push(...await ctx.store.find<OutcomeRow>(COLLECTIONS.demo_outcomes, { iteration: i } as Partial<OutcomeRow>));
      a.push(...await ctx.store.find<ActivityRow>(COLLECTIONS.demo_activity, { iteration: i } as Partial<ActivityRow>));
    }
    const { findings, measurements } = runChecks(mode, ctx.policy, ctx.iteration, o, a, await history(ctx));
    for (const m of measurements) await ctx.store.insert(COLLECTIONS.measurements, m);
    for (const f of findings) await ctx.store.insert(COLLECTIONS.findings, f);
    const failed = findings.filter(f => !f.passed).map(f => f.check);
    ctx.log(`[instrument] ${mode}: ${o.length} outcomes, ${a.length} activity rows in window; ${findings.length} findings, failed: ${failed.join(', ') || 'none'}`);
    return findings;
  },
};
