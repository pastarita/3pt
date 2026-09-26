#!/usr/bin/env node
/** 3pt · plan | build | instrument | improve | loop [--git] | rollback <tag>. See root Makefile. */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { COLLECTIONS, freezePolicy, readSecrets, runIteration, seedPolicy, stageStore, type Checkpoint, type HarnessKind, type Policy, type StageContext } from '@3pt/core';
import { planStage } from '@3pt/plan';
import { buildStage } from '@3pt/build';
import { instrumentStage } from '@3pt/instrument';
import { improve } from '@3pt/improver';
import { headSha, repoRoot, showAt, snapshot } from '@3pt/battery-repo';
import { atlasStore, atlasUri } from '@3pt/battery-atlas';
import { fileStore } from './store.js';

const argv = process.argv.slice(2);
const gitSnapshot = argv.includes('--git');           // opt-in: commits land on whatever branch is checked out
const [cmd = 'help', arg] = argv.filter(a => !a.startsWith('--'));

const root = repoRoot() ?? process.cwd();
// Key injector: .env (if present) → process.env → readSecrets() → ctx.secrets. Values already in the
// shell win over .env, so CI and the box can inject their own. Stages never read process.env.
if (existsSync(join(root, '.env'))) process.loadEnvFile(join(root, '.env'));
const secrets = readSecrets(process.env);
const POLICIES = 'harness/policies';
const CHECKPOINTS = 'harness/checkpoints';
const uri = atlasUri();
const store = uri ? await atlasStore(uri, process.env.ATLAS_DB) : fileStore(join(root, '.3pt/store'));   // the battery is injected here, at the edge
const gitSha = process.env.GIT_SHA ?? headSha(root);  // the improver records the code sha the iteration ran on

/** Highest n among `<prefix><n><suffix>` files in a directory, or -1. */
const maxN = (dir: string, re: RegExp) =>
  existsSync(join(root, dir)) ? Math.max(-1, ...readdirSync(join(root, dir)).map(f => Number(f.match(re)?.[1] ?? -1))) : -1;

/** Resume from the newest policy: the store first, then the git mirror, then the seed. */
async function currentPolicy(): Promise<Policy> {
  const fromStore = await store.latest<Policy>(COLLECTIONS.policies, 'version');
  const n = maxN(POLICIES, /^v(\d+)\.json$/);
  const fromFile = n >= 0 ? (JSON.parse(readFileSync(join(root, POLICIES, `v${n}.json`), 'utf8')) as Policy) : null;
  if (fromStore && (!fromFile || fromStore.version >= fromFile.version)) return fromStore;
  return fromFile ?? seedPolicy();
}

async function nextIteration(): Promise<number> {
  if (process.env.THREEPT_ITERATION) return Number(process.env.THREEPT_ITERATION);
  const last = await store.latest<Checkpoint>(COLLECTIONS.checkpoints, 'iteration');
  return Math.max(last?.iteration ?? 0, maxN(CHECKPOINTS, /^cp-(\d+)\.md$/)) + 1;
}

const writePolicy = (p: Policy) => {
  const { _id, ...doc } = p;
  const path = `${POLICIES}/v${p.version}.json`;
  writeFileSync(join(root, path), JSON.stringify(doc, null, 2) + '\n');
  return path;
};

/** The snapshot: mirror the new policy and the checkpoint into git-tracked files, then optionally commit + tag. */
async function checkpoint(cp: Checkpoint) {
  const policy = await store.latest<Policy>(COLLECTIONS.policies, 'version');
  if (!policy) throw new Error('checkpoint: the improver wrote no policy');
  mkdirSync(join(root, CHECKPOINTS), { recursive: true });
  const cpPath = `${CHECKPOINTS}/cp-${cp.iteration}.md`;
  writeFileSync(join(root, cpPath), [
    `# ${cp.tag}`, '',
    `| field | value |`, `|---|---|`,
    `| iteration | ${cp.iteration} |`, `| at | ${cp.at} |`, `| code sha | \`${cp.gitSha}\` |`,
    `| policy | v${cp.policyVersion} (\`${POLICIES}/v${cp.policyVersion}.json\`) |`,
    `| policy reason | ${policy.provenance.reason} |`,
    `| metrics | ${Object.keys(cp.metrics).length ? '`' + JSON.stringify(cp.metrics) + '`' : 'none recorded'} |`, '',
    '## Retrospective', '', cp.retrospective, '',
  ].join('\n'));
  const paths = [writePolicy(policy), cpPath];
  console.log(`[checkpoint] wrote ${paths.join(', ')}`);
  if (gitSnapshot) {
    const sha = snapshot({ tag: cp.tag, paths, message: `instrument: checkpoint ${cp.tag}, policy v${policy.version}`, cwd: root });
    console.log(`[checkpoint] committed ${sha.slice(0, 7)} and tagged ${cp.tag}`);
  }
}

/** Restore the harness state of a checkpoint as a NEW policy version, so the lineage stays append-only. */
async function rollback(tag: string) {
  const n = Number(tag.match(/^cp\/(\d+)$/)?.[1]);
  if (!n) throw new Error(`rollback: expected cp/<n>, got ${tag}`);
  const cp = (await store.find<Checkpoint>(COLLECTIONS.checkpoints, { tag } as Partial<Checkpoint>))[0];
  const cpFile = showAt(tag, `${CHECKPOINTS}/cp-${n}.md`, root)
    ?? (existsSync(join(root, CHECKPOINTS, `cp-${n}.md`)) ? readFileSync(join(root, CHECKPOINTS, `cp-${n}.md`), 'utf8') : null);
  const version = cp?.policyVersion ?? Number(cpFile?.match(/\| policy \| v(\d+)/)?.[1] ?? NaN);
  if (Number.isNaN(version)) throw new Error(`rollback: no checkpoint ${tag} in the store, the tag, or ${CHECKPOINTS}`);
  const path = `${POLICIES}/v${version}.json`;
  const raw = showAt(tag, path, root) ?? (existsSync(join(root, path)) ? readFileSync(join(root, path), 'utf8') : null);
  if (!raw) throw new Error(`rollback: ${path} not found at ${tag} or in the working tree`);
  const latest = await currentPolicy();
  const restored: Policy = {
    ...(JSON.parse(raw) as Policy),
    version: latest.version + 1,
    createdAt: new Date().toISOString(),
    provenance: { checkpoint: tag, reason: `rollback to ${tag} (policy v${version})` },
  };
  await store.insert(COLLECTIONS.policies, restored);
  console.log(`[rollback] policy v${version} from ${tag} restored as v${restored.version}; wrote ${writePolicy(restored)}`);
  console.log(`[rollback] code is not touched. To also restore it: git checkout ${tag}`);
}

// The loop and the run are separate: stages get a frozen policy and a store that refuses policy and
// checkpoint writes. Only the improver, after the run, rewrites the policy and tags the checkpoint.
const iteration = await nextIteration();
const policy = await currentPolicy();
const ctx: StageContext = {
  iteration,
  policy: freezePolicy(policy),
  store: stageStore(store),
  secrets,
  harness: (process.env.THREEPT_HARNESS as HarnessKind) ?? 'claude-code',
  log: (l) => console.log(l),
};
const stages = { plan: planStage, build: buildStage, instrument: instrumentStage } as const;
const improveAndSnapshot = async () => checkpoint(await improve(store, iteration, policy, gitSha, ctx.log));

switch (cmd) {
  case 'plan': case 'build': case 'instrument': await stages[cmd].run(ctx); break;
  case 'improve': await improveAndSnapshot(); break;
  case 'loop': {
    await runIteration([planStage, buildStage, instrumentStage], ctx);
    await improveAndSnapshot();
    break;
  }
  case 'rollback': await rollback(arg ?? ''); break;
  default: console.log('3pt <plan|build|instrument|improve|loop [--git]|rollback cp/<n>>');
}
