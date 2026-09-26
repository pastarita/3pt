#!/usr/bin/env node
// Local setup entry point. Operating procedure: docs/19-local-operations.md.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = new Set(process.argv.slice(2));
const flags = ['--help', '--site', '--provision', '--check'];
function fail(message) { console.error(`[setup] ${message}`); process.exit(1); }
for (const arg of args) if (!flags.includes(arg)) fail(`Unknown option: ${arg}. Use --help.`);
if (args.has('--help')) {
  console.log(`Usage: node scripts/setup.mjs [--site] [--provision] [--check]

Checks Node and the pinned pnpm version, installs locked dependencies, builds
the workspaces (except the optional native macOS app). Secrets are loaded from
the existing Keychain / Atlas vault / host environment when provisioning.

  --site       Also build dist/web-site for the local API on 127.0.0.1:8787.
               THREEPT_API_URL can select another API when building.
  --provision  Load configured keys and run Atlas, blob, artifacts, repo and tracing
               provisioners. Requires an Atlas connection; no VM is created.
  --check      Test the effective database and service connections after building.

Service options and the agent handoff: docs/19-local-operations.md`);
  process.exit(0);
}
if (Number(process.versions.node.split('.')[0]) < 22) fail('Node 22+ is required.');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const pinned = pkg.packageManager.split('@')[1];
const pnpm = spawnSync('pnpm', ['--version'], { cwd: root, encoding: 'utf8' });
if (pnpm.status !== 0 || pnpm.stdout.trim() !== pinned) {
  fail(`Install the pinned package manager: npm install --global pnpm@${pinned}`);
}

function run(command, argv, env = process.env) {
  console.log(`[setup] ${command} ${argv.join(' ')}`);
  const result = spawnSync(command, argv, { cwd: root, env, stdio: 'inherit' });
  if (result.error) fail(result.error.message);
  if (result.status !== 0) fail(`${command} failed (${result.signal ?? result.status}).`);
}

run('pnpm', ['install', '--frozen-lockfile']);
run('pnpm', ['turbo', 'run', 'build', '--filter=!@3pt/macos']);

if (args.has('--site')) {
  run('bash', ['scripts/build-web-site.sh'], {
    ...process.env,
    THREEPT_API_URL: process.env.THREEPT_API_URL || 'http://127.0.0.1:8787',
  });
}

if (args.has('--provision')) {
  const { atlasUri, loadKeys } = await import('../infra/batteries/atlas/dist/index.js');
  const env = await loadKeys();
  if (!atlasUri(env)) fail('No Atlas connection configured. Set the Atlas keys through the local key page or host environment, then rerun --provision.');
  // Run directly: Turbo's provision allowlist does not include every Atlas part.
  for (const battery of ['atlas', 'blob', 'artifacts', 'repo', 'tracing']) {
    run('pnpm', ['--filter', `@3pt/battery-${battery}`, 'run', 'provision'], env);
  }
  console.log('[setup] Provisioners completed. Check their output: optional providers may report plans only.');
}
if (args.has('--check')) run(process.execPath, ['scripts/batteries.mjs']);
console.log('[setup] Build ready. Local startup and service installation: docs/19-local-operations.md');
