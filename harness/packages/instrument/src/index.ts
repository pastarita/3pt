import { COLLECTIONS, type Finding, type FrozenPolicy, type Measurement, type Plan, type SprintMode, type Stage, type StageContext } from '@3pt/core';

/**
 * Instrument measures and reports. It does not rewrite the policy or tag a checkpoint: those belong
 * to the improver (@3pt/improver), which runs outside the stage run. See StageContext in @3pt/core.
 *
 * It reads what happened on the projects (demo_outcomes, demo_activity) in a rolling window of the last
 * WINDOW iterations, writes one measurement per check every iteration, then runs the checks of the sprint:
 *   feature      a problem crosses its bar and no grant answers it   → finding with `answer` (grant it)
 *   improvement  a grant at least MIN_AGE old did not cut its problem → failed `effect:` finding
 *   fix          debug each failed effect: noise (problem fell since) → keep; else where it still is → `revoke`
 */
export interface OutcomeRow { iteration: number; kind: string; found?: string; project?: string }
export interface ActivityRow { iteration: number; action: string; result?: string; minutes?: number; project?: string; role?: string; query?: string; at?: string }
export interface PhotoRow { iteration: number; project?: string; uploaded_by: string; caption: string; taken_at: string; file?: string; note?: string }

export interface ProjectCheck {
  check: string;
  metric: string;                       // M-* id written each iteration
  answeredBy: string;                   // the build grant that answers the problem
  bar: number;                          // one bar rule for all: the problem shows up this often in the window
  needs?: string;                       // the check runs only when this grant is already in place
  pick(o: OutcomeRow[], a: ActivityRow[], p: PhotoRow[]): { project?: string; weight: number }[];
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
  {
    check: 'wall-search', metric: 'M-P-wall-search', answeredBy: 'field.wall_state', bar: 3,
    pick: (_o, a) => a.filter(r => r.action === 'search' && r.result === 'no' && /before drywall/.test(r.query ?? '')).map(r => ({ project: r.project, weight: 1 })),
    note: n => `${n} "before drywall" searches found nothing; add an open or closed wall field and read older photos once`,
  },
  {
    // Runs only once the fields are granted: misses that remain after it ask for more context per question.
    check: 'slow-answers', metric: 'M-P-miss-after-fields', answeredBy: 'context.photos_per_question_20', bar: 3, needs: 'field.unit_level_trade',
    pick: (_o, a) => a.filter(r => r.action === 'search' && r.result === 'no').map(r => ({ project: r.project, weight: 1 })),
    note: n => `${n} searches still find nothing with fields in place; try 20 photos per question instead of 8`,
  },
  {
    // A role that asks the same question again on the same project would use a screen made for it.
    check: 'repeat-questions', metric: 'M-P-repeat-by-role', answeredBy: 'screen.by_role', bar: 3,
    pick: (_o, a) => {
      const seen = new Set<string>();
      return a.filter(r => r.action === 'search').filter(r => { const k = `${r.project}|${r.role}|${r.query}`; const again = seen.has(k); seen.add(k); return again; })
        .map(r => ({ project: r.project, weight: 1 / 20 }));     // weight: 20 repeats count as one event
    },
    note: n => `${Math.round(n * 20)} repeated questions by the same role on the same project; learn a screen per role`,
  },
  {
    check: 'closeout-by-hand', metric: 'M-P-closeout-search', answeredBy: 'tool.closeout_set', bar: 3,
    pick: (_o, a) => a.filter(r => r.action === 'search' && /closeout/.test(r.query ?? '')).map(r => ({ project: r.project, weight: 1 })),
    note: n => `${n} searches for closeout photos by unit, built by hand; automate the closeout set`,
  },
  {
    // Near duplicates: the same image file stored again on the same project in the window.
    check: 'duplicate-photos', metric: 'M-P-duplicates', answeredBy: 'tool.drop_bursts', bar: 3,
    pick: (_o, _a, p) => {
      const seen = new Set<string>();
      return p.filter(r => { const k = `${r.project}|${r.file}`; const dup = seen.has(k); seen.add(k); return dup; })
        .map(r => ({ project: r.project, weight: 1 / 20 }));     // weight: 20 duplicates count as one event
    },
    note: n => `${Math.round(n * 20)} duplicate photos stored on the same project; stop keeping duplicates after 24 hours`,
  },
  {
    // Safety: one hazard photo in the window is enough, so this check's bar is 1, not 3.
    check: 'hazard-photos', metric: 'M-P-hazard', answeredBy: 'flag.hazard', bar: 1,
    pick: (_o, _a, p) => p.filter(r => /open edge|no rail|toe board|ladder/.test(r.note ?? '')).map(r => ({ project: r.project, weight: 1 })),
    note: n => `${n} hazard photos (open edge, missing rail, toe board, ladder) with no flag; add a hazard flag`,
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
export function runChecks(mode: SprintMode, policy: FrozenPolicy, iteration: number, o: OutcomeRow[], a: ActivityRow[], p: PhotoRow[], h: History, at = new Date().toISOString()) {
  const findings: Finding[] = [];
  const measurements: Measurement[] = [];
  for (const c of PROJECT_CHECKS) {
    if (c.needs && !policy.toolGrants.build.includes(c.needs) && !policy.toolGrants.build.includes(c.answeredBy)) continue;
    const rows = c.pick(o, a, p);
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
      // Debug first: if the problem already fell below its value at grant time, the failed effect was noise. Keep it.
      const recovered = g !== undefined && n < g.value;
      findings.push({ iteration, at, check: `fix:${c.check}`, passed: recovered, ...(recovered ? {} : { revoke: c.answeredBy }),
        note: recovered
          ? `kept ${c.answeredBy}: problem back to ${n} (was ${g!.value} at grant); last month's result was noise`
          : `revoked ${c.answeredBy}: problem still at ${n} (was ${g?.value ?? '?'}); still on ${where || 'no project'}` });
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
    const p: PhotoRow[] = [];
    for (let i = ctx.iteration - WINDOW + 1; i <= ctx.iteration; i++) {
      o.push(...await ctx.store.find<OutcomeRow>(COLLECTIONS.demo_outcomes, { iteration: i } as Partial<OutcomeRow>));
      a.push(...await ctx.store.find<ActivityRow>(COLLECTIONS.demo_activity, { iteration: i } as Partial<ActivityRow>));
      p.push(...await ctx.store.find<PhotoRow>(COLLECTIONS.demo_photos, { iteration: i } as Partial<PhotoRow>));
    }
    const { findings, measurements } = runChecks(mode, ctx.policy, ctx.iteration, o, a, p, await history(ctx));
    for (const m of measurements) await ctx.store.insert(COLLECTIONS.measurements, m);
    for (const f of findings) await ctx.store.insert(COLLECTIONS.findings, f);
    const failed = findings.filter(f => !f.passed).map(f => f.check);
    ctx.log(`[instrument] ${mode}: ${o.length} outcomes, ${a.length} activity rows, ${p.length} photos in window; ${findings.length} findings, failed: ${failed.join(', ') || 'none'}`);
    return findings;
  },
};
