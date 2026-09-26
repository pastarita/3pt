#!/usr/bin/env node
// 3PT · PR description grader: the completeness degree tracker (docs/pr-descriptions/README.md).
//   node scripts/pr-validate.mjs docs/pr-descriptions/PR_DESCRIPTION_FOO.md   grade one file
//   node scripts/pr-validate.mjs                                                grade every description
//   node scripts/pr-validate.mjs --stdin < body.md                              grade a PR body (herald.yml)
// Reports a GRADE, not pass/fail: the sections are not equally load-bearing. Exit 1 below B (85%).
// Checks presence and shape only. It cannot tell a true figure from a wrong one.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SECTIONS = [
  [/^##\s*1\s*·\s*Coat of Arms/mi, 2, '1 · Coat of Arms'],
  [/^##\s*2\s*·\s*Summary/mi,      2, '2 · Summary'],
  [/^##\s*3\s*·\s*Changes/mi,      2, '3 · Changes'],
  [/^##\s*4\s*·\s*Provenance/mi,   2, '4 · Provenance'],
  [/^##\s*5\s*·\s*Test plan/mi,    2, '5 · Test plan and attestation'],
  [/^##\s*6\s*·\s*Completeness/mi, 1, '6 · Completeness'],
];
const SHAPE = [
  [s => /╔/.test(s) && /╚/.test(s), 1, 'ASCII block present (the compact line never replaces it)'],
  [s => /^\*\*Compact:\*\*/m.test(s), 1, 'compact line present'],
  [s => /⌘\s*policy\s*v\d+/i.test(s), 1, 'escutcheon names the harness policy version'],
  [s => /@s\d+\.\d+/.test(s) || /new seed/i.test(s), 1, 'a seed cite (@sN.NN) or "new seed"'],
  [s => /^\|\s*`[0-9a-f]{7,40}`\s*\|/m.test(s), 1, 'commits table with at least one SHA'],
  [s => /^\|\s*(check|herald)\b/mi.test(s), 1, 'gates table names check and herald'],
  [s => !/^\s*(co-authored-by:|generated with |🤖 generated)/mi.test(s), 1, 'no attribution line'],
];
function grade(text, label) {
  let earned = 0, possible = 0; const missing = [];
  const lines = [`\n${label}`];
  for (const [re, w, name] of SECTIONS) { possible += w; if (re.test(text)) { earned += w; lines.push(`  ✓ ${name}`); } else { lines.push(`  ${w === 2 ? '✗' : '⚠'} ${name} (${w === 2 ? 'required' : 'expected'})`); missing.push(name); } }
  for (const [fn, w, name] of SHAPE) { possible += w; if (fn(text)) { earned += w; lines.push(`  ✓ ${name}`); } else { lines.push(`  ✗ ${name}`); missing.push(name); } }
  const pct = Math.floor(earned * 100 / possible);
  const g = pct >= 95 ? 'A' : pct >= 85 ? 'B' : pct >= 70 ? 'C' : pct >= 50 ? 'D' : 'F';
  lines.push(`  ──── completeness ${pct}%  grade ${g}${missing.length ? `\n  missing: ${missing.join(', ')}` : ''}`);
  console.log(lines.join('\n'));
  return pct >= 85;
}
const args = process.argv.slice(2);
let ok = true;
if (args.includes('--stdin')) ok = grade(readFileSync(0, 'utf8'), '(stdin)');
else if (args.length) for (const f of args) ok = grade(readFileSync(f, 'utf8'), f) && ok;
else {
  const dir = join(ROOT, 'docs/pr-descriptions');
  const files = readdirSync(dir).filter(f => /^PR_DESCRIPTION_.*\.md$/.test(f));
  if (!files.length) console.log('no PR descriptions found');
  for (const f of files) ok = grade(readFileSync(join(dir, f), 'utf8'), `docs/pr-descriptions/${f}`) && ok;
}
console.log('');
process.exit(ok ? 0 : 1);
