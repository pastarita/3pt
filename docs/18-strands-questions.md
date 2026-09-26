# Strands, answered: four questions, where each is substantiated, and where we extend

*Source of record. Written 2026-09-26 ~14:40 ET after the archaeology (`docs/12-strands-archaeology.md`)
and the diagrams (`docs/13-strands-diagrams.md`) landed. Four questions were asked of the Strands
basis we build on. Each is answered in one paragraph, then substantiated with pointers into three
corpora: the docs of record and sketches (**corpus**), this repository (**codebase**), and Strands
itself (**Strands**). A fourth column says where 3PT extends the seam. The hub renders this index as
the journey leaf `../strands-journey.html`; the pointer register it draws from is
`hub/site/strands-data.js`, written together with this file. Nothing here is from memory: every
Strands claim traces to a source id S1–S21 in docs/12 §1, every 3PT claim to a file and line.*

## 0. How to read a pointer

| Kind | Form | Lands where |
|---|---|---|
| Doc section | `docs/12-strands-archaeology.md#2-capability-ledger` | The Viewer scrolls to the heading. Anchors are heading slugs: lowercase, punctuation dropped, spaces to hyphens (the same rule `scripts/prov.mjs` uses). |
| Ledger row | L1–L22 | A row of docs/12 §2. Grade tells you whether Strands ships it (DISPATCHABLE), we adapt it (COMPOSABLE), or we build it (TO-BUILD). |
| Source | S1–S21 | A row of docs/12 §1, with the URL and the version fetched. |
| Sketch | `../sketches.html#f2` | A figure on the Sketch gallery leaf. |
| Code | `harness/packages/strands/src/index.ts` L41–62 | A GitHub blob link with a line range as of this commit; the symbol name is given so the pointer survives drift. |
| Segment | `s4.04` | A spoken segment in `../brainstorming.md`; the Timeline leaf opens it in context. |

The repository is private until submission, so code links resolve for the two principals and their
agents; after the repo goes public they resolve for judges.

## 1. How can we configure Strands?
<!-- @s4.04 -->

**Answer.** Strands is configured at three layers, and 3PT sets all three from one document.
`createHarness(options)` takes the harness-level knobs: `instructions`, `builtinTools`,
`interventions`, `session`, `memory`, `skills`, `plugins`, `mcpServers`, `subagent`,
`contextManager`, `caching`, `effort`, and `model` (S2, S4). The `model` may be a `ModelRouter`
over `RoutingCandidate`s with a `FallbackStrategy` or `ClassifierStrategy` and a `maxSwitches`
budget (S5). Everything the harness does not name passes through to `AgentConfig`: `storage`,
`sessionManager`, `memoryManager`, `checkpointing`, `conversationManager`, `retryStrategy`,
`structuredOutputSchema` (S6). 3PT's `Policy` (rules, contextPolicy, toolGrants) compiles into
these options in `harnessOptions()`; tool grants become `builtinTools` plus `interventions` in
`grants()`; routes become a router spec in `routerSpec()`. The `strands` CLI configures the same
harness by hand and `/export`s it as a project, which is the fastest way to try a configuration
before compiling it (S18).

### The three layers

| Layer | Strands surface | 3PT sets it from | Substantiation |
|---|---|---|---|
| Harness options | `createHarness({ instructions, builtinTools, interventions, session, memory, skills, plugins, mcpServers, contextManager, caching, effort })` | `harnessOptions(policy, stage)` | docs/12 [§1 S2, S4](12-strands-archaeology.md#1-source-register) · [L1, L3, L4, L5, L20](12-strands-archaeology.md#2-capability-ledger) · docs/13 [§2 layers](13-strands-diagrams.md#2-the-layers-sdk-harness-cli-3pt) · [`index.ts` L41–62](https://github.com/pastarita/3pt/blob/main/harness/packages/strands/src/index.ts#L41-L62) |
| Model and router | `model: 'provider/name' \| ModelRouter(candidates, { strategy, maxSwitches })`, `effort` | `DEFAULT_ROUTES` → `routerSpec(stage)` | docs/12 [S5](12-strands-archaeology.md#1-source-register) · [L2](12-strands-archaeology.md#2-capability-ledger) · docs/13 [§5 routing](13-strands-diagrams.md#5-model-resolution-and-the-router) · [`index.ts` L12–25, L64–70](https://github.com/pastarita/3pt/blob/main/harness/packages/strands/src/index.ts#L12-L25) |
| Agent passthrough | `AgentConfig`: `storage`, `sessionManager`, `memoryManager`, `checkpointing`, `conversationManager`, `retryStrategy` | `AtlasStorage` as `storage` (L7); `checkpointing: true` (L11) | docs/12 [S6, S8](12-strands-archaeology.md#1-source-register) · [L7, L11](12-strands-archaeology.md#2-capability-ledger) · docs/13 [§6 persistence](13-strands-diagrams.md#6-persistence-storage-sessions-snapshots-memory) · [`index.ts` L72–81](https://github.com/pastarita/3pt/blob/main/harness/packages/strands/src/index.ts#L72-L81) |
| Tool grants as data | `builtinTools` list, map, or `{'*': false, read: true}`; `interventions` `'ask' \| 'smart' \| policy text \| .cedar \| handler \| layered` | `grants(policy, stage)` from `policy.toolGrants` | docs/12 [L4](12-strands-archaeology.md#2-capability-ledger) · [§4 concrete table](12-strands-archaeology.md#what-each-stages-harness-is-concretely) · docs/13 [§7 control](13-strands-diagrams.md#7-control-interventions-steering-guardrails) · docs/10 [§4.3](10-architecture.md#43-batteries-tool-grants-stages) · [`index.ts` L28–38](https://github.com/pastarita/3pt/blob/main/harness/packages/strands/src/index.ts#L28-L38) · [`policies/v0.json`](https://github.com/pastarita/3pt/blob/main/harness/policies/v0.json) |
| By hand first | `strands` TUI: `--model`, `--effort`, `--mcp-config`, `--builtin-tools`, `/export` | try a config, export it, diff against `harnessOptions()` | docs/12 [S18](12-strands-archaeology.md#1-source-register) · [L17](12-strands-archaeology.md#2-capability-ledger) · [`strands-cli/README.md`](https://github.com/strands-agents/harness-sdk/tree/main/strands-cli) |

The Policy is where the configuration lives: [`Policy` in `@3pt/core` L28–40](https://github.com/pastarita/3pt/blob/main/harness/packages/core/src/index.ts#L28-L40),
seeded by [`seedPolicy()` L122–140](https://github.com/pastarita/3pt/blob/main/harness/packages/core/src/index.ts#L122-L140),
mirrored in [`harness/policies/`](https://github.com/pastarita/3pt/blob/main/harness/policies/README.md). The handles we say for each knob
are in docs/12 [§3 lexicon](12-strands-archaeology.md#3-lexicon-the-semantic-basis) and
[`topology.json`](https://github.com/pastarita/3pt/blob/main/harness/packages/strands/topology.json). Sketch:
[f1](../sketches.html#f1) shows the policy packet Plan hands forward.

### Where we extend

- **`routes` is not yet a field of `Policy`.** docs/12 §3 says `policy.routes[stage]`; the type in `@3pt/core` has `rules`, `contextPolicy`, `toolGrants` only, and `DEFAULT_ROUTES` lives in `@3pt/strands`. Add `routes: Routes` to `Policy` so Instrument can rewrite them (M-11 counts the diff).
- **`routerFor()` is a comment.** It becomes a `ModelRouter` the moment `@strands-agents/sdk` installs (docs/12 §6: the package is excluded from `pnpm-workspace.yaml` for disk).
- **The Build gate file does not exist.** `grants()` names `./harness/policies/gates/build.cedar`; write it (writes inside the worktree only).
- **Provider path.** The first candidate must be a provider we hold a key for (S21: no AWS or Anthropic credits from the guide). OpenRouter through `litellm/` is SEED until tried.

## 2. How can we fine-tune Strands?
<!-- @s1.02:instrumentation-backfeed @s1.03:measurement-dimension @s2.03 -->

**Answer.** Not by training model weights. Strands has no seam for weight fine-tuning; that is a
provider-side act (Bedrock custom models), and the guide provides no AWS credits (S21). What Strands
does treat as trainable is **the harness configuration itself**: the harness optimizer wraps a
`Formula` (`process`, `get_tunable_params`, `update_params`), scores rollouts with a
`RewardFunction`, and runs a `FormulaOptimizer` under `Trainer.fit()`; today only
`SystemPromptFormula` ships (S14). The reward comes from the evals SDK: `Case`, `Experiment`,
evaluators such as `GoalSuccessRate`, `Trajectory`, `ToolSelectionAccuracy`, over online runs or
recorded traces (S15). Below training there are lighter dials that tune behaviour without an
optimizer: `effort` per call, steering handlers that return `Proceed` or `Guide` (100% pass at 66%
fewer input tokens than SOP prompting in Strands' own 600-run test, S13), `ClassifierStrategy`
routing, `contextManager`, `caching`. 3PT's fine-tuning is a `PolicyFormula` whose tunable
parameters are the whole Policy, rewarded by the M-* metrics Instrument writes.

### The tuning ladder

| Rung | Strands mechanism | 3PT use | Substantiation |
|---|---|---|---|
| Dials, no training | `effort`, `caching: 'auto'`, `contextManager: 'auto' \| 'agentic'`, `ClassifierStrategy` | per-stage `effort` in `DEFAULT_ROUTES`; harness defaults (1500-token tool-result truncation, summarize at 85%) | docs/12 [S4, S5, S17](12-strands-archaeology.md#1-source-register) · [L2, L5](12-strands-archaeology.md#2-capability-ledger) · [`index.ts` L21–25, L58–59](https://github.com/pastarita/3pt/blob/main/harness/packages/strands/src/index.ts#L21-L25) |
| Steering | `steer_before_tool` / `steer_after_model` → `Proceed(reason)` \| `Guide(reason)` | Instrument's standards enforced *during* Build, not after | docs/12 [S13](12-strands-archaeology.md#1-source-register) · [L13](12-strands-archaeology.md#2-capability-ledger) · docs/13 [§7](13-strands-diagrams.md#7-control-interventions-steering-guardrails) · [steering blog](https://strandsagents.com/blog/steering-accuracy-beats-prompts-workflows/) |
| Measure | `Plugin.initAgent` + `addHook(AfterModelCall \| AfterToolCall \| AfterInvocation)` | `measurementPlugin(sink, stage)` → `measurements` (M-TURNS, M-TOOLS, M-STOP) | docs/12 [S12](12-strands-archaeology.md#1-source-register) · [L9](12-strands-archaeology.md#2-capability-ledger) · docs/13 [§3 hooks](13-strands-diagrams.md#3-one-invocation-the-agent-loop-with-its-hooks) · docs/07 [§3.1 metric register](07-assessment-and-measurement.md#31-metric-register) · [`index.ts` L83–99](https://github.com/pastarita/3pt/blob/main/harness/packages/strands/src/index.ts#L83-L99) · [`Measurement` L42–50](https://github.com/pastarita/3pt/blob/main/harness/packages/core/src/index.ts#L42-L50) |
| Evaluate | `strands_evals`: `Case`, `Experiment`, evaluators, offline task functions over traces | Plan emits `evaluation[]`; Instrument runs it as the `Experiment` | docs/12 [S15](12-strands-archaeology.md#1-source-register) · [L15](12-strands-archaeology.md#2-capability-ledger) · docs/13 [§9](13-strands-diagrams.md#9-evaluation-and-the-optimizer-loop) · [`Plan.evaluation` L52–60](https://github.com/pastarita/3pt/blob/main/harness/packages/core/src/index.ts#L52-L60) · [evals guide](https://strandsagents.com/blog/evaluating-ai-agents-practical-guide-strands-evals/) |
| Optimize | `Formula` → `RewardFunction` → `FormulaOptimizer` (`ContrastiveReflectionOptimizer`, `MultiAgentOptimizer`) → `Trainer.fit()` | `PolicyFormula`: tunable `rules · toolGrants · routes`; reward = M-19 `harness_health` | docs/12 [S14](12-strands-archaeology.md#1-source-register) · [L14](12-strands-archaeology.md#2-capability-ledger) · [§5 sizing](12-strands-archaeology.md#5-what-is-genuinely-net-new-sized) · docs/13 [§9](13-strands-diagrams.md#9-evaluation-and-the-optimizer-loop) · [optimizer blog](https://strandsagents.com/blog/introducing-harness-optimizer/) |
| Today's stand-in | none | `rewritePolicy(prev, findings, tag)` appends findings as rules and bumps the version | [`instrument/src/index.ts` L4–12](https://github.com/pastarita/3pt/blob/main/harness/packages/instrument/src/index.ts#L4-L12) · docs/07 [§3.2 sprint selector](07-assessment-and-measurement.md#32-sprint-mode-selection-rule-initial-policy-instrument-may-rewrite-it) |

### Where we extend

- **`harness/evals/` does not exist.** Python package: build an `Experiment` from `Plan.evaluation[]`, run it offline over the traces the tracing battery stores, emit `EvaluationReport` scores as `measurements`.
- **`PolicyFormula` is unwritten.** A `Formula` subclass whose `get_tunable_params()` returns `rules`, `toolGrants`, `routes` and whose `update_params()` writes `policies` v<n+1>. Caution: `strands-harness-optimizer` is 0.0.1 and ships one Formula.
- **Reward design.** M-19 weights live in `policies.health_weights` so the reward itself is a rewritable policy (docs/07 §3.1). Guard with M-7 so transcript reuse is not hollow.
- **Steering in TypeScript.** The vended `steering` plugin is documented for Python; the TS equivalent is to confirm (L13 caution).

## 3. How is Strands open to self-improvement?
<!-- @s1.02:instrumentation-backfeed @s1.04:git-native-checkpoints @s1.20 @s1.29:supervisory-outer-loop -->

**Answer.** Strands does not improve itself; it exposes every seam a loop needs to improve it, and
the harness is data, so a new configuration is a new harness without new code. Six seams:
**see** every model call and tool call through `Plugin` hooks (S12); **rebuild** from
`createHarness(options)` (S2, S17); **remember** through `Storage`, sessions, and snapshots with an
immutable UUID v7 history (S8, S10); **pause and roll back** through `checkpointing` and
`stop_reason: checkpoint` (S11) paired with a session; **carry** learnings across invocations through
`MemoryStore`s (S9); **train** the configuration through the optimizer (S14). A `Graph` run also
persists node transitions, so the loop is inspectable after the fact (S10, S20). 3PT closes the loop:
Instrument's `rewritePolicy()` writes policy v<n+1>, the next iteration's `harnessOptions()` builds
from it, and a checkpoint is the triple (snapshot id, git tag, policy version) so one command rolls
all three back. That rewrite is the Recursive Harnessing proof (docs/05 Statement 1).

### The six seams and the closing edge

| Seam | Strands identifier | 3PT component | Substantiation |
|---|---|---|---|
| See | `Plugin { name, initAgent }`, `agent.addHook(BeforeModelCall … AfterInvocation)` | `measurementPlugin()` | docs/12 [S12](12-strands-archaeology.md#1-source-register) · [L9](12-strands-archaeology.md#2-capability-ledger) · docs/13 [§3](13-strands-diagrams.md#3-one-invocation-the-agent-loop-with-its-hooks) · [§4 stop reasons](13-strands-diagrams.md#4-stop-reasons-as-a-state-machine) · [`index.ts` L83–99](https://github.com/pastarita/3pt/blob/main/harness/packages/strands/src/index.ts#L83-L99) |
| Rebuild | `createHarness(options)` returns an assembled `Agent`; options are plain data | `harnessOptions(policy, stage)` | docs/12 [§0](12-strands-archaeology.md#0-the-finding-that-changes-the-plan) · [S2, S17](12-strands-archaeology.md#1-source-register) · [`index.ts` L41–62](https://github.com/pastarita/3pt/blob/main/harness/packages/strands/src/index.ts#L41-L62) |
| Remember | `Storage { write, read, delete, list, namespace?, search? }`; snapshots `immutable_history/<uuid7>.json` | `AtlasStorage` over `strands_storage` | docs/12 [S8, S10](12-strands-archaeology.md#1-source-register) · [L7, L22](12-strands-archaeology.md#2-capability-ledger) · docs/13 [§6](13-strands-diagrams.md#6-persistence-storage-sessions-snapshots-memory) · [`index.ts` L72–81](https://github.com/pastarita/3pt/blob/main/harness/packages/strands/src/index.ts#L72-L81) |
| Pause, roll back | `checkpointing: true`, `Checkpoint { position, cycle_index }`, `stop_reason: checkpoint` | checkpoint = (snapshot id, git tag `cp/<n>`, policy version) | docs/12 [S11](12-strands-archaeology.md#1-source-register) · [L11](12-strands-archaeology.md#2-capability-ledger) · docs/10 [§4.7 rollback in git](10-architecture.md#47-checkpoints-and-rollback-in-git) · [`Checkpoint` L62–71](https://github.com/pastarita/3pt/blob/main/harness/packages/core/src/index.ts#L62-L71) · [`policies/README.md`](https://github.com/pastarita/3pt/blob/main/harness/policies/README.md) |
| Carry | `MemoryStore { search, add, addMessages, initialize, getTools }`, `memory: { stores }` | `AtlasMemoryStore` over `transcripts` + Vector Search (to build) | docs/12 [S9](12-strands-archaeology.md#1-source-register) · [L8](12-strands-archaeology.md#2-capability-ledger) · docs/13 [§6](13-strands-diagrams.md#6-persistence-storage-sessions-snapshots-memory) |
| Train | `Formula`, `RewardFunction`, `Trainer.fit()` | `PolicyFormula` (to build) | docs/12 [S14](12-strands-archaeology.md#1-source-register) · [L14](12-strands-archaeology.md#2-capability-ledger) · docs/13 [§9](13-strands-diagrams.md#9-evaluation-and-the-optimizer-loop) |
| Inspect | `Graph` persists orchestrator state, per-node results, node transitions | Plan → Build → Instrument as a `Graph` | docs/12 [S10, S20](12-strands-archaeology.md#1-source-register) · [L19](12-strands-archaeology.md#2-capability-ledger) · docs/13 [§8](13-strands-diagrams.md#8-multi-agent-subagents-graph-swarm-a2a) |
| The closing edge | (ours) | `rewritePolicy()` → `policies` v<n+1> → next `harnessOptions()` | docs/00 [loops inside the loop](00-vision.md#loops-inside-the-loop) · docs/06 [why this is self-improving](06-goal-and-use-case.md#recap-why-this-is-self-improving) · docs/07 [§3 principle](07-assessment-and-measurement.md#3-the-measurement-system) · docs/10 [§4.2 one iteration](10-architecture.md#42-one-iteration) · docs/12 [§4 topology](12-strands-archaeology.md#4-topology) · sketches [f2](../sketches.html#f2), [f8](../sketches.html#f8) · [`instrument/src/index.ts` L4–12](https://github.com/pastarita/3pt/blob/main/harness/packages/instrument/src/index.ts#L4-L12) |

What we struck because Strands already holds the seam: our own loop, router, session manager,
tool-permission checker, and tracing (docs/12 [strike list](12-strands-archaeology.md#strike-list-things-we-now-do-not-build)).

### Where we extend

- **Wire `AtlasStorage` in.** It is a class with six methods and no caller; pass it as `session.storage` and `AgentConfig.storage` once the SDK installs, and the two-machine demo (L22) follows.
- **Make the checkpoint a triple.** `instrumentStage` writes the Atlas document and names the tag; the git tag and the `harness/policies/v<n>.json` mirror are not yet written by code. `3pt rollback` (M-12) needs all three.
- **Rewrite more than rules.** `rewritePolicy()` appends to `rules`; the proof wants edits to `toolGrants` and `routes` too, measured by M-11 `policy_diff_size` and attributed by M-14.
- **Stop reasons into measurements.** `measurementPlugin` records `M-STOP:<reason>`; Plan should read `limitTurns` and `modelContextWindowExceeded` counts when choosing a Fix sprint.

## 4. How does the 3PT workflow look for media-heavy content?
<!-- @s1.06:media-heavy-workload @s1.07:triangle-two-sides @s1.13:read-once-transcript @s1.13:hot-cold-tiering @s1.21:context-management-not-classification -->

**Answer.** The loop runs on the right side of the triangle; the media is the left side; the two
meet twice per iteration. **Plan** reads the last checkpoint, the last measurements, and the media
state (tiers, transcripts, jobs) and picks a sprint mode. **Build** is a Strands harness with the
media tools granted (`index`, `transcribe` read-once, `tier`) that edits the pipelines living inside
the repo; the **worker** drains the `jobs` collection (`index | transcribe | tier | migrate`) against
the blob battery (GridFS, R2, or fs). **Instrument** reads the media metrics (M-5 re-read rate, M-6
transcript reuse, M-8 hot-tier hit rate, M-10 bytes per tier, M-17 bytes per retained context) and
rewrites the context policy (`readOnceTranscripts`, `hotTierBudgetMB`, per-stream budgets), which
is the second meeting: the right side driving left-side migrations. Two rules hold throughout:
read an image once and trust the transcript; keep hot what is asked for and let the rest sleep. No
feature classifies, captions, or judges images for a user (docs/05 banned list).

### One iteration over the two sides

| Step | Right side (harness) | Left side (media) | Substantiation |
|---|---|---|---|
| Plan reads | `selectMode(last, recent)` over `checkpoints` and `measurements` | media state packet: tiers, transcripts, jobs | docs/00 [two sides](00-vision.md#two-sides-of-the-triangle) · sketches [f4](../sketches.html#f4) · [`plan/src/index.ts` L4–10](https://github.com/pastarita/3pt/blob/main/harness/packages/plan/src/index.ts#L4-L10) · [`COLLECTIONS` L11–19](https://github.com/pastarita/3pt/blob/main/harness/packages/core/src/index.ts#L11-L19) |
| Build edits | Strands harness, `builtinTools` shell·read·write·edit, media tools granted | pipelines codified in the repo; `blob.get` grant | docs/12 [§4 concrete table](12-strands-archaeology.md#what-each-stages-harness-is-concretely) · [L6, L21](12-strands-archaeology.md#2-capability-ledger) · docs/10 [§4.3](10-architecture.md#43-batteries-tool-grants-stages) · [`seedPolicy()` grants L132–136](https://github.com/pastarita/3pt/blob/main/harness/packages/core/src/index.ts#L132-L136) |
| Worker drains | — | `tick()` derives a job per asset: `jobFor()` → transcribe if no transcript, else tier if `chooseTier()` disagrees | docs/10 [§4.6 triangle → directories](10-architecture.md#46-the-triangle-mapped-to-directories) · [§5 recipe: a left-side job](10-architecture.md#5-extension-recipes) · [`media/src/index.ts` L4–17](https://github.com/pastarita/3pt/blob/main/harness/packages/media/src/index.ts#L4-L17) · [`worker/src/index.ts` L5–14](https://github.com/pastarita/3pt/blob/main/harness/apps/worker/src/index.ts#L5-L14) |
| Read once | rule in every stage prompt: `read-once transcripts on` | `needsTranscript()`; `transcripts` collection; Voyage embeddings | docs/00 [scope](00-vision.md#scope-for-the-hackathon) · [problems](00-vision.md#problems-we-are-addressing-statement-of-need) · docs/07 [M-5, M-6, M-7](07-assessment-and-measurement.md#31-metric-register) · [`index.ts` L51](https://github.com/pastarita/3pt/blob/main/harness/packages/strands/src/index.ts#L51) · [`MediaAsset` L73–81](https://github.com/pastarita/3pt/blob/main/harness/packages/core/src/index.ts#L73-L81) |
| Tier | `hotTierBudgetMB` in `contextPolicy` | `chooseTier()` recency now, relevance later; `media_index.tier` | docs/07 [M-8, M-9, M-10](07-assessment-and-measurement.md#31-metric-register) · docs/06 [use case](06-goal-and-use-case.md#use-case-an-interior-design-firm) · [`Policy.contextPolicy` L33–37](https://github.com/pastarita/3pt/blob/main/harness/packages/core/src/index.ts#L33-L37) · [blob battery `SKILL.md`](https://github.com/pastarita/3pt/blob/main/infra/batteries/blob/SKILL.md) |
| Instrument rewrites | M-5…M-10, M-17 → `rewritePolicy()`; `contextPolicy` and stream budgets (M-15) | migrations run from the new policy | docs/00 [two sides](00-vision.md#two-sides-of-the-triangle) · docs/06 [recap](06-goal-and-use-case.md#recap-why-this-is-self-improving) · docs/07 [§3.1](07-assessment-and-measurement.md#31-metric-register) · sketches [f5](../sketches.html#f5), [f6](../sketches.html#f6) · docs/03 [the media workload is what the loop operates on](03-workflow.md#the-initialized-pipeline-plan-build-instrument-skeleton) |
| Plan remembers | `memory: { stores: [AtlasMemoryStore] }` over `transcripts` with a vector index | Voyage embeddings inside `add()` | docs/12 [L8](12-strands-archaeology.md#2-capability-ledger) · docs/13 [§6](13-strands-diagrams.md#6-persistence-storage-sessions-snapshots-memory) · docs/07 [§4.2 Voyage](07-assessment-and-measurement.md#42-voyage-ai-200m-tokens-per-participant-top-ups-on-site) |

The demo direction that exercises this on a construction firm's photos, with its stress-test
questions, is the [Direction leaf](../direction.html#stress).

### Where we extend

- **Media tools are not yet Strands tools.** `index`, `transcribe`, `tier` become `tool({ name, description, inputSchema: z.object(…), callback })` in `@3pt/media` and are granted to Build by name (L6, L21).
- **The worker measures nothing.** `tick()` queues jobs; it should write M-5, M-6, M-8, M-9, M-10 to `measurements` so Instrument has the left-side signal.
- **`migrate` has no derivation.** `Job['kind']` includes it; `jobFor()` never emits it. Its trigger is a policy change (tier budget, layout), per docs/10 §5.
- **`AtlasMemoryStore`** is the one COMPOSABLE piece that touches Voyage and Vector Search; one day of work (docs/12 §5).

## 5. Gaps this index makes visible

| Gap | Where it shows | Ledger |
|---|---|---|
| `Policy` has no `routes` field; docs/12 §3 assumes one | `@3pt/core` vs `@3pt/strands` `DEFAULT_ROUTES` | L2 |
| `@3pt/strands` is not compiled; the workspace excludes it | `pnpm-workspace.yaml`, docs/12 §6 | L1–L9 |
| `routerFor()` is a comment | `index.ts` L64–70 | L2 |
| `harness/policies/gates/build.cedar` is named, not written | `grants()` L34 | L4 |
| `AtlasStorage` has no caller | `index.ts` L74 | L7, L22 |
| `AtlasMemoryStore`, `PolicyFormula`, `harness/evals/` do not exist | docs/12 §5 | L8, L14, L15 |
| Media tools are functions, not `tool()`s; the worker writes no measurements | `@3pt/media`, `apps/worker` | L6, L21 |
| Checkpoint writes one of its three parts | `instrumentStage` | L11 |

Every row is a `TO-BUILD` or a wiring step, none is a design question. The first `pnpm install`
with disk promotes or demotes the ledger rows above (docs/12 §2 caution).
