/**
 * @3pt/strands — 3PT is a policy-to-harness compiler on Strands.
 * docs/12-strands-archaeology.md is the source of record for every identifier used here.
 *
 * STATUS 2026-09-26: written against the documented API (harness 0.1.1, sdk 1.19.0) but NOT yet
 * compiled: the workspace excludes this package until the machine has disk for `pnpm install`.
 * Imports are typed loosely on purpose so the first compile surfaces the real signatures.
 */
import type { Policy, StageName } from '@3pt/core';

/** Where a stage's model requests go. Mirrors Strands' `provider/name` strings and `effort` levels. */
export interface Route {
  candidates: string[];            // e.g. ['anthropic/claude-opus-5', 'litellm/anthropic/claude-sonnet-4.6']
  effort: 'auto' | 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';
  strategy: 'fallback' | 'classifier';
  maxSwitches?: number;
}
export type Routes = Record<StageName, Route>;

/** Default routes: strong first for Build, cheap first for Plan, mid for Instrument. Bedrock is not a candidate (no AWS creds). */
export const DEFAULT_ROUTES: Routes = {
  plan:       { candidates: ['anthropic/claude-haiku-4-5', 'anthropic/claude-sonnet-4-6'], effort: 'low',    strategy: 'classifier' },
  build:      { candidates: ['anthropic/claude-opus-5',    'anthropic/claude-sonnet-4-6'], effort: 'high',   strategy: 'fallback', maxSwitches: 2 },
  instrument: { candidates: ['anthropic/claude-sonnet-4-6', 'anthropic/claude-haiku-4-5'], effort: 'medium', strategy: 'fallback' },
};

/** Tool grants → Strands `builtinTools` + `interventions`. Grant strings are ours (docs/12 §3 "grant"). */
export function grants(policy: Policy, stage: StageName): { builtinTools: Record<string, unknown>; interventions: string | string[] } {
  const g = new Set(policy.toolGrants[stage]);
  const builtinTools: Record<string, unknown> = { '*': false, read: true };
  if (g.has('repo.worktree') || g.has('atlas.insert')) Object.assign(builtinTools, { shell: true, write: true, edit: true, subagent: { maxDepth: 1 } });
  if (stage === 'plan') Object.assign(builtinTools, { web_fetch: true });
  const interventions =
    stage === 'build'      ? ['./harness/policies/gates/build.cedar', 'smart']
    : stage === 'instrument' ? 'Read-only, but writes under harness/policies and harness/checkpoints are fine'
    : 'Read-only.';
  return { builtinTools, interventions };
}

/** The whole compile step. Returns the object handed to `createHarness()`. */
export function harnessOptions(policy: Policy, stage: StageName, routes: Routes = DEFAULT_ROUTES) {
  const { builtinTools, interventions } = grants(policy, stage);
  const r = routes[stage];
  return {
    // model: routerFor(stage, routes)   ← a ModelRouter instance once the SDK is installed; string until then
    model: r.candidates[0],
    effort: r.effort,
    instructions: [
      `You are the ${stage} stage of 3PT, iteration policy v${policy.version}.`,
      ...policy.rules.map(x => `- ${x}`),
      `Context: max ${policy.contextPolicy.maxTokensPerStage[stage]} tokens; read-once transcripts ${policy.contextPolicy.readOnceTranscripts ? 'on' : 'off'}.`,
    ].join('\n'),
    builtinTools,
    interventions,
    session: { id: `3pt-${stage}` },        // resumable from either machine once Storage is Atlas
    memory: { dir: './.agent/memory' },      // becomes { stores: [atlasMemoryStore] } (ledger L8)
    skills: ['./infra/batteries', './.agent/skills'],
    contextManager: 'auto',
    caching: 'auto',
    builtinPlugins: ['todos', 'environment'],
  };
}

/**
 * ModelRouter factory (ledger L2). Uncomment once installed:
 *   import { ModelRouter, RoutingCandidate, FallbackStrategy, ClassifierStrategy } from '@strands-agents/sdk'
 *   return new ModelRouter(r.candidates.map((m, i) => new RoutingCandidate({ model: m, name: `c${i}` })),
 *     { strategy: r.strategy === 'classifier' ? new ClassifierStrategy() : new FallbackStrategy(), maxSwitches: r.maxSwitches })
 */
export function routerSpec(stage: StageName, routes: Routes = DEFAULT_ROUTES): Route { return routes[stage]; }

/** Strands `Storage` over Atlas (ledger L7). Six methods, one collection `strands_storage {key, ns, bytes}`. */
export interface KV { get(k: string): Promise<Uint8Array | null>; put(k: string, v: Uint8Array): Promise<void>; del(k: string): Promise<void>; keys(prefix: string): Promise<string[]> }
export class AtlasStorage {
  constructor(private kv: KV, private prefix = '') {}
  write(key: string, data: Uint8Array) { return this.kv.put(this.prefix + key, data); }
  read(key: string) { return this.kv.get(this.prefix + key); }
  delete(key: string) { return this.kv.del(this.prefix + key); }
  async list(prefix: string) { return (await this.kv.keys(this.prefix + prefix)).map(k => k.slice(this.prefix.length)).sort(); }
  namespace(prefix: string) { return new AtlasStorage(this.kv, this.prefix + prefix); }
}

/** Measurement plugin shape (ledger L9). `initAgent` registers AfterModelCall / AfterToolCall / AfterInvocation hooks. */
export interface MeasurementSink { record(metric: string, value: number, unit: string): Promise<void> }
export function measurementPlugin(sink: MeasurementSink, stage: StageName) {
  let modelCalls = 0, toolCalls = 0;
  return {
    name: `3pt:measurement:${stage}`,
    initAgent(agent: { addHook: (ev: unknown, cb: (e: any) => void) => void }, events: { AfterModelCallEvent: unknown; AfterToolCallEvent: unknown; AfterInvocationEvent: unknown }) {
      agent.addHook(events.AfterModelCallEvent, () => { modelCalls++; });
      agent.addHook(events.AfterToolCallEvent, () => { toolCalls++; });
      agent.addHook(events.AfterInvocationEvent, async (e) => {
        await sink.record('M-TURNS', modelCalls, 'calls');
        await sink.record('M-TOOLS', toolCalls, 'calls');
        if (e?.result?.stopReason) await sink.record(`M-STOP:${e.result.stopReason}`, 1, 'count');
      });
    },
  };
}
