#!/usr/bin/env node
/** 3pt · plan | build | instrument | loop | rollback <tag>. See root Makefile. */
import { memoryStore, runIteration, seedPolicy, type HarnessKind, type StageContext } from '@3pt/core';
import { planStage } from '@3pt/plan';
import { buildStage } from '@3pt/build';
import { instrumentStage } from '@3pt/instrument';

const [cmd = 'help', arg] = process.argv.slice(2);
const ctx: StageContext = {
  iteration: Number(process.env.THREEPT_ITERATION ?? 1),
  policy: seedPolicy(),
  store: memoryStore(),               // swapped for the atlas battery's store when ATLAS_URI is set
  harness: (process.env.THREEPT_HARNESS as HarnessKind) ?? 'claude-code',
  log: (l) => console.log(l),
};
const stages = { plan: planStage, build: buildStage, instrument: instrumentStage } as const;

switch (cmd) {
  case 'plan': case 'build': case 'instrument': await stages[cmd].run(ctx); break;
  case 'loop': await runIteration([planStage, buildStage, instrumentStage], ctx); break;
  case 'rollback': console.log(`rollback → git checkout ${arg ?? '<tag>'} + restore policy version from that checkpoint (repo + atlas batteries)`); break;
  default: console.log('3pt <plan|build|instrument|loop|rollback <tag>>');
}
