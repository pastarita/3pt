/** Prints the box plan; runs it only when BOX_PROVISION=1 (it takes minutes and starts a VM). */
import { execFileSync, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PHASES, boxSpec } from './index.js';

const s = boxSpec();
const here = dirname(fileURLToPath(import.meta.url));
const sh = resolve(here, '..', 'box.sh');
console.log(`[box] profile=${s.profile} cpu=${s.cpu} mem=${s.memoryGiB}G disk=${s.diskGiB}G atlasLocal=${s.atlasLocal} repo=${s.repoMode} minFree=${s.minFreeGB}G`);
console.log(`[box] phases: ${PHASES.join(' → ')}`);
let colima = 'missing';
try { colima = execFileSync('colima', ['version'], { encoding: 'utf8' }).split('\n')[0]; } catch { /* absent */ }
console.log(`[box] colima: ${colima}`);
if (process.env.BOX_PROVISION === '1') {
  const r = spawnSync('bash', [sh, 'up'], { stdio: 'inherit' });
  process.exit(r.status ?? 1);
} else {
  console.log('[box] plan only — BOX_PROVISION=1 pnpm --filter @3pt/battery-box run provision, or: infra/batteries/box/box.sh up');
}
