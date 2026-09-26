/**
 * 3pt replay [dir] — a dry run of the loop over the Acme projects, one iteration per month.
 * Each month, the edge (this file) puts that month's outcomes and activity into the store, then the real
 * Plan → Build → Instrument run and the real improver run. Always a memory store: nothing reaches Atlas or git.
 * At the end it compares the grants the loop found with the hand-written versions in expected/harness-versions.json.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { COLLECTIONS, freezePolicy, memoryStore, runIteration, seedPolicy, stageStore, type Finding, type Plan, type Policy, type Secrets } from '@3pt/core';
import { planStage } from '@3pt/plan';
import { buildStage } from '@3pt/build';
import { instrumentStage } from '@3pt/instrument';
import { improve } from '@3pt/improver';

const rows = (f: string) => readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l) as Record<string, any>);

// Authored: which hand-written capability each grant stands for. Used only for the comparison at the end.
const CAPABILITY: Record<string, string> = {
  'field.unit_level_trade': 'fields', 'tool.open_wall_gap': 'remind', 'flag.issue_on_arrival': 'issue', 'tool.owner_pack': 'pack',
};

export async function replay(dir: string, secrets: Secrets, gitSha: string) {
  const byMonth = new Map<string, { o: any[]; a: any[] }>();
  const bucket = (m: string) => byMonth.get(m) ?? (byMonth.set(m, { o: [], a: [] }), byMonth.get(m)!);
  const projects = readdirSync(join(dir, 'projects'));
  for (const p of projects) {
    for (const r of rows(join(dir, 'projects', p, 'outcomes.jsonl'))) bucket(r.at.slice(0, 7)).o.push({ ...r, project: p });
    for (const r of rows(join(dir, 'projects', p, 'activity.jsonl'))) bucket(r.at.slice(0, 7)).a.push({ ...r, project: p });
  }
  const months = [...byMonth.keys()].sort();
  console.log(`[replay] ${projects.length} projects, ${months.length} months (${months[0]} → ${months.at(-1)}), memory store`);

  const store = memoryStore();
  await store.insert(COLLECTIONS.policies, seedPolicy());
  const quiet = () => {};
  const found: { first: string; kept: string; grant: string }[] = [];
  const verdict = new Map<string, boolean>();       // grant → last effect result; only changes are printed
  const strip = new Map<string, string>();          // year → one letter per month: F feature, I improvement, X fix
  const tally = { feature: 0, improvement: 0, fix: 0, granted: 0, revoked: 0, worked: 0, failedEffect: 0 };

  for (const [i, month] of months.entries()) {
    const iteration = i + 1;
    const { o, a } = byMonth.get(month)!;
    for (const r of o) await store.insert(COLLECTIONS.demo_outcomes, { ...r, iteration });
    for (const r of a) await store.insert(COLLECTIONS.demo_activity, { ...r, iteration });
    const policy = (await store.latest<Policy>(COLLECTIONS.policies, 'version'))!;
    await runIteration([planStage, buildStage, instrumentStage], {
      iteration, policy: freezePolicy(policy), store: stageStore(store), secrets, harness: 'claude-code', log: quiet,
    });
    const cp = await improve(store, iteration, policy, gitSha, quiet);
    const next = (await store.latest<Policy>(COLLECTIONS.policies, 'version'))!;
    const [plan] = await store.find<Plan>(COLLECTIONS.plans, { iteration } as Partial<Plan>);
    const findings = await store.find<Finding>(COLLECTIONS.findings, { iteration } as Partial<Finding>);
    tally[plan.mode]++;
    const y = month.slice(0, 4);
    strip.set(y, (strip.get(y) ?? '') + { feature: 'F', improvement: 'I', fix: 'X' }[plan.mode]);

    const lines: string[] = [];
    for (const g of next.toolGrants.build.filter(g => !policy.toolGrants.build.includes(g))) {
      tally.granted++; verdict.delete(g);
      const f = found.find(x => x.grant === g);
      if (f) f.kept = month; else found.push({ first: month, kept: month, grant: g });
      lines.push(`+ ${g}   ${findings.find(f => f.answer === g)?.note ?? ''}`);
    }
    for (const g of policy.toolGrants.build.filter(g => !next.toolGrants.build.includes(g))) {
      tally.revoked++; lines.push(`- ${findings.find(f => f.revoke === g)?.note ?? g}`);
    }
    for (const f of findings.filter(f => f.check.startsWith('effect:'))) {
      if (f.passed) tally.worked++; else tally.failedEffect++;
      const g = f.note.split(' ')[0];
      if (verdict.get(g) !== f.passed) lines.push(`${f.passed ? '✓' : '✗'} ${f.note}`);
      verdict.set(g, f.passed);
    }
    if (lines.length) {
      console.log(`[replay] ${month} ${plan.mode.padEnd(11)} ${cp.tag.padEnd(6)} v${policy.version} → v${next.version}`);
      for (const l of lines) console.log(`           ${l}`);
    }
  }

  console.log('\n[replay] sprints by month (F feature · I improvement · X fix):');
  for (const [y, s] of strip) console.log(`  ${y}  ${s.split('').join(' ')}`);
  console.log(`  ${tally.feature} feature · ${tally.improvement} improvement · ${tally.fix} fix sprints; ` +
    `${tally.granted} grants, ${tally.worked} confirmed, ${tally.failedEffect} failed effect checks, ${tally.revoked} revoked`);

  const final = (await store.latest<Policy>(COLLECTIONS.policies, 'version'))!;
  const seed = seedPolicy();
  console.log(`\n[replay] policy v0 → v${final.version}: build grants now ${final.toolGrants.build.slice(seed.toolGrants.build.length).join(', ') || 'none'}; ${final.rules.length - seed.rules.length} rules learned`);

  const expected = JSON.parse(readFileSync(join(dir, 'expected', 'harness-versions.json'), 'utf8')) as { v: number; date: string; capability: string | null; why: string }[];
  console.log('\n[replay] compared with expected/harness-versions.json (hand-written):');
  console.log('  v   capability  expected   loop first try   loop kept');
  for (const e of expected.filter(e => e.capability)) {
    const f = found.find(x => CAPABILITY[x.grant] === e.capability);
    console.log(`  ${String(e.v).padEnd(3)} ${e.capability!.padEnd(11)} ${e.date.slice(0, 7)}    ${f ? `${f.first}          ${f.kept}  (${f.grant})` : 'no check for it yet'}`);
  }
  console.log(`  found ${found.length} of ${expected.filter(e => e.capability).length}`);
}
