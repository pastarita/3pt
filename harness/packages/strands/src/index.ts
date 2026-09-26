/**
 * @3pt/strands — 3PT is a policy-to-harness compiler on Strands.
 * docs/12-strands-archaeology.md is the source of record for every identifier used here.
 *
 * STATUS 2026-09-26: compiled against harness 0.1.1 and sdk 1.19.0. Models go through OpenRouter,
 * one key (OPENROUTER_API_KEY) for every candidate.
 */
import type { Policy, StageName } from '@3pt/core';
import { ClassifierStrategy, FallbackStrategy, ModelRouter, RoutingCandidate } from '@strands-agents/sdk';
import { OpenAIModel } from '@strands-agents/sdk/models/openai';
import type { BuiltinToolsConfig, HarnessAgentOptions } from '@strands-agents/harness';

/**
 * Where a stage's model requests go. Candidates are OpenRouter model ids (GET openrouter.ai/api/v1/models).
 * Strands' own `litellm/…` string sets no reasoning level, so we build each model here and send
 * OpenRouter's `reasoning.effort` ourselves (openrouter.ai/docs/use-cases/reasoning-tokens).
 */
export interface Route {
  candidates: string[];            // e.g. ['anthropic/claude-opus-5.5', 'anthropic/claude-sonnet-5']
  effort: 'auto' | 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';
  strategy: 'fallback' | 'classifier';
  maxSwitches?: number;
}
export type Routes = Record<StageName, Route>;

/** Default routes: strong first for Build, cheap first for Plan, mid for Instrument. Ids checked on OpenRouter 2026-09-26. */
export const DEFAULT_ROUTES: Routes = {
  plan:       { candidates: ['anthropic/claude-haiku-4.5', 'anthropic/claude-sonnet-5'],   effort: 'low',    strategy: 'classifier' },
  build:      { candidates: ['anthropic/claude-opus-5.5',  'anthropic/claude-sonnet-5'],   effort: 'high',   strategy: 'fallback', maxSwitches: 2 },
  instrument: { candidates: ['anthropic/claude-sonnet-5',  'anthropic/claude-haiku-4.5'],  effort: 'medium', strategy: 'fallback' },
};

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/** One OpenRouter model. The key comes from the caller (ctx.secrets.openrouter); this package never reads env. `auto` leaves reasoning to the model's default; `off` sends OpenRouter's `none`. */
export function openRouterModel(modelId: string, effort: Route['effort'], apiKey: string): OpenAIModel {
  const reasoning = effort === 'auto' ? undefined : { effort: effort === 'off' ? 'none' : effort };
  return new OpenAIModel({
    api: 'chat',
    modelId,
    apiKey,
    clientConfig: { baseURL: OPENROUTER_BASE_URL, defaultHeaders: { 'X-Title': '3PT' } },
    ...(reasoning ? { params: { reasoning } } : {}),
  });
}

/** Tool grants → Strands `builtinTools` + `interventions`. Grant strings are ours (docs/12 §3 "grant"). */
export function grants(policy: Policy, stage: StageName): { builtinTools: BuiltinToolsConfig; interventions: string } {
  const g = new Set(policy.toolGrants[stage]);
  const builtinTools: Record<string, unknown> & BuiltinToolsConfig = { '*': false, read: true };
  if (g.has('repo.worktree') || g.has('atlas.insert')) Object.assign(builtinTools, { shell: true, write: true, edit: true, subagent: { maxDepth: 1 } });
  if (stage === 'plan') Object.assign(builtinTools, { web_fetch: true });
  const interventions =
    // 'smart' = human approval for risky tool calls, judged by the stage's own model. A Cedar gate
    // (harness/policies/gates/build.cedar) can join once that file and @cedar-policy/cedar-wasm exist.
    stage === 'build'      ? 'smart'
    : stage === 'instrument' ? 'Read-only, but writes under harness/policies and harness/checkpoints are fine'
    : 'Read-only.';
  return { builtinTools, interventions };
}

/** The whole compile step. Returns the object handed to `createHarness()`. */
export function harnessOptions(policy: Policy, stage: StageName, apiKey: string, routes: Routes = DEFAULT_ROUTES): HarnessAgentOptions {
  const { builtinTools, interventions } = grants(policy, stage);
  return {
    // No `effort` here: Strands ignores it for a pre-built router. Each model carries its own (openRouterModel).
    model: routerFor(stage, apiKey, routes),
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
    // No `caching` here: Strands cannot set it on a pre-built router, and warns if asked.
    builtinPlugins: ['todos', 'environment'],
  };
}

/**
 * ModelRouter factory (ledger L2). Fallback tries candidates in order and moves on after a failure.
 * Classifier asks a model to pick a candidate per request; it asks the first (cheapest) candidate, reasoning off.
 */
export function routerFor(stage: StageName, apiKey: string, routes: Routes = DEFAULT_ROUTES): ModelRouter {
  const r = routes[stage];
  const candidates = r.candidates.map((id) => new RoutingCandidate({ model: openRouterModel(id, r.effort, apiKey), name: id }));
  const strategy = r.strategy === 'classifier'
    ? new ClassifierStrategy(openRouterModel(r.candidates[0]!, 'off', apiKey))
    : new FallbackStrategy();
  return new ModelRouter(candidates, { strategy, ...(r.maxSwitches !== undefined ? { maxSwitches: r.maxSwitches } : {}) });
}

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
