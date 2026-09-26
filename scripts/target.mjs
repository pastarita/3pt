#!/usr/bin/env node
// 3PT · deploy-target resolver over infra/targets.json (docs/13-ci-and-deployment.md §2).
//   node scripts/target.mjs list                 one line per target: name, kind, provider, status, url
//   node scripts/target.mjs resolve <name>       everything the deploy needs, as key: value lines (or --json)
//   node scripts/target.mjs matrix [status]      GitHub Actions matrix JSON of targets with a workflow (default status: live)
//   node scripts/target.mjs check                every referenced workflow file exists; exit 1 otherwise
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { targets } = JSON.parse(readFileSync(join(ROOT, 'infra/targets.json'), 'utf8'));
const [cmd = 'list', arg] = process.argv.slice(2);
const json = process.argv.includes('--json');
if (cmd === 'list') {
  for (const [n, t] of Object.entries(targets)) console.log([n.padEnd(8), (t.kind || '').padEnd(14), (t.provider || '').padEnd(14), (t.status || '').padEnd(8), t.url || ''].join(' '));
} else if (cmd === 'resolve') {
  const t = targets[arg]; if (!t) { console.error(`no such target: ${arg}. Known: ${Object.keys(targets).join(', ')}`); process.exit(1); }
  if (json) console.log(JSON.stringify({ name: arg, ...t }, null, 2));
  else for (const [k, v] of Object.entries(t)) console.log(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
} else if (cmd === 'matrix') {
  const want = arg || 'live';
  const include = Object.entries(targets).filter(([, t]) => t.workflow && t.status === want).map(([name, t]) => ({ name, kind: t.kind, cwd: t.cwd || '.', deploy: t.deploy, secrets: t.secrets || [] }));
  console.log(JSON.stringify({ include }));
} else if (cmd === 'check') {
  let bad = 0;
  for (const [n, t] of Object.entries(targets)) {
    if (t.workflow && !existsSync(join(ROOT, t.workflow))) { console.error(`FAIL: ${n} names a workflow that does not exist: ${t.workflow}`); bad++; }
    for (const s of t.secrets || []) if (!/^[A-Z][A-Z0-9_]+$/.test(s)) { console.error(`FAIL: ${n} secret name is not a name: ${s}`); bad++; }
  }
  console.log(bad ? `${bad} problem(s)` : `OK — ${Object.keys(targets).length} targets, every workflow present, secrets are names only`);
  process.exit(bad ? 1 : 0);
} else { console.error('usage: target.mjs list | resolve <name> [--json] | matrix [status] | check'); process.exit(2); }
