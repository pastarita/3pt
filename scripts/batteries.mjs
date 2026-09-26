#!/usr/bin/env node
// Same checks as the setup page. No key values, URI strings or provider response bodies are printed.
import { readFile } from 'node:fs/promises';
import { checkBatteries, checkDeployment } from '../harness/packages/setup/dist/index.js';
import { loadKeys, probeAtlas } from '../infra/batteries/atlas/dist/index.js';

const flags = new Set(process.argv.slice(2));
for (const flag of flags) if (!['--json', '--deployed', '--deployed-only', '--help'].includes(flag)) {
  console.error(`Unknown option: ${flag}`); process.exit(2);
}
if (flags.has('--help')) {
  console.log('Usage: node scripts/batteries.mjs [--json] [--deployed | --deployed-only]\nChecks the effective runtime keys. --deployed also checks registered live APIs.\nAtlas performs a temporary write/read/delete; Voyage sends one short test string.');
  process.exit(0);
}
let report = { ready: true, checkedAt: new Date().toISOString(), checks: [] };
if (!flags.has('--deployed-only')) {
  const keys = await loadKeys();
  report = await checkBatteries(keys, { atlas: () => probeAtlas(keys) });
}
if (flags.has('--deployed') || flags.has('--deployed-only')) {
  const { targets } = JSON.parse(await readFile(new URL('../infra/targets.json', import.meta.url), 'utf8'));
  const checks = await Promise.all(Object.entries(targets).filter(([, t]) => t.kind === 'worker' && t.status === 'live').map(async ([id, t]) => {
    const start = Date.now(), result = await checkDeployment(t.url);
    return { id, label: t.url, required: true, ...result, checkedAt: new Date().toISOString(), durationMs: Date.now() - start };
  }));
  report.checks.push(...checks); report.ready &&= checks.every(c => c.status === 'pass');
}
if (flags.has('--json')) console.log(JSON.stringify(report, null, 2));
else {
  for (const c of report.checks) console.log(`${c.status.toUpperCase().padEnd(10)} ${c.label}: ${c.detail}`);
  console.log(report.ready ? 'Connections verified.' : 'Setup needs attention. Open the local /keys page, correct the connection, and test again.');
}
process.exitCode = report.ready ? 0 : 1;
