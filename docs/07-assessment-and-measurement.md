# Assessment Against the Transcript, Measurement System, and Partner-Incentive Mapping

*Source of record. Written 2026-09-26 against `brainstorming.md` (Session 1) read in parallel with
`docs/00-vision.md`, `docs/01-icp.md`, `docs/03-workflow.md`, `docs/05-rules.md`,
`docs/06-goal-and-use-case.md`, and the verbatim resource guide in
`docs/sources/hackathon-resource-guide.md`. Three jobs: (1) converge the transcript into a
numbered set of theses and falsifiable hypotheses, (2) define the measurement system that scores
the recursive improvement loop, (3) map every hackathon product and incentive onto those theses
as a requirement set, so we build on infrastructure the partners already provide.*

Identifiers used throughout: **T-n** thesis, **H-n** hypothesis, **M-n** metric, **R-n**
requirement. Priorities are MoSCoW: Must / Should / Could / Won't (today).

---

## 1. Canonical theses (converged from the transcript)

| ID | Thesis | Transcript origin | Doc anchor |
|---|---|---|---|
| **T-1** | **The harness is the product.** Plan → Build → Instrument, with Instrument's learnings backfed into harness code and Plan's prompt gateway. This is Recursive Harnessing. | "2-minute spiel", "instrumentation backfeed", "gateway in a prompt pattern to inform the planning mechanism" | `00-vision.md` §The three points; `05-rules.md` §Implications |
| **T-2** | **Media is the workload, not the feature.** Images only. The corpus exists to make context budgets, storage tiering, and memory hard enough that self-improvement is necessary. | "cut down the scope … only focus on images", "not an image analyzer" revision | `00-vision.md` §Hackathon framing |
| **T-3** | **Read once, trust the transcript.** Every image is transcribed once into durable structured context; re-reads are deliberate and counted. | "read it once and use it as a source of truth … hallucinate a lot of times by reading it in different ways" | `00-vision.md` §Scope; `glossary.md` |
| **T-4** | **Tiering is a policy the harness rewrites.** Hot vs. cold, promotion and demotion driven by relevance, with the layout adapting to the user over time. | "what needs to be hot storage and what needs to be cold storage", "custom to the user" | `00-vision.md` §Problems |
| **T-5** | **Checkpoints are git-native and Atlas-persisted; rollback is one command.** Memory kept at checkpoint granularity; retrospectives reflect only over that memory. | "like a git history, like a worktree … roll back to a healthier version", "only maintain the memory of the checkpoint" | `03-workflow.md` §Initialized pipeline step 5 |
| **T-6** | **Measurement is the fourth dimension.** Hard metric signals from the workload score each iteration and select the next sprint mode (Feature / Improvement / Fix), sequentially. | "hypothetical retrospective … new dimension of the evolution of the harness, which is measurement", "loop of features, improvements, and reducing errors" | `00-vision.md` §Loops inside the loop |
| **T-7** | **Build is a meta-harness over any coding agent.** Claude Code first, Kiro second, Codex third; the same policies drive all of them. | "meta harness for any coding agent, whether that's Kiro, Strand, or Claude Code" | `03-workflow.md` §Build |
| **T-8** | **Streams dial up and down.** The harness rewrites its own tool grants and context policies, turning input streams off when they stop paying for themselves. | "figure out what is noise … turn it off or turn it on", screen-capture onboarding | `06-goal-and-use-case.md` §Onboarding side effect |
| **T-9** | **Value compounds over time: organize → understand → suggest → building blocks.** The interior-design firm is the narrative use case; ICP-3 (pipeline-building engineer) is the hackathon buyer. | "slowly it suggests workflows that can be automated", interior design / Blender | `06-goal-and-use-case.md` §Use case; `01-icp.md` |
| **T-10** | **The UI is a supervisory inspector, never the headline.** Spatial thumbnail stacks and a simple view of the harness evolving. | "terse, spatial thumbnail view … supervisory mode" | `00-vision.md` §The supervisory UI; `05-rules.md` (dashboard ban) |
| **T-11** | **Two sides of the triangle.** Right side is harness code history; left side is media context (indexes, transcripts, tiers, pipelines-as-code). The right side ("furnace") drives migrations of the left. | "right side of our triangles … left side is how … the data inputs … are intermediated" | `00-vision.md` §Two sides of the triangle |

### Transcript claims that did not converge (deferred or cut)

| Transcript claim | Disposition | Reason |
|---|---|---|
| Trend analysis over social feeds; advertising / marketing insights | **Deferred to narrative** (ICP-1, ICP-2) | Reads as an Image Analyzer under the rules. |
| Construction / polyglot long-horizon corpus (24/7 video, LiDAR, 3D models) | **Deferred** | Statement 2 territory; video and point clouds are out of scope today. |
| Role-based access managed by the harness | **Cut** | Transcript itself concluded humans manage access, never the AI. |
| Journal / news storyline building from timestamped media | **Deferred** | Downstream consumer of the same media index; not a harness feature. |
| Two parallel long-running agent sessions | **Cut** | Transcript settled on sequential sprint modes. |
| DTrace mouse/keyboard capture correlated to screenshots | **Could** (R-25) | Valid stream for T-8; only if the screen-capture onboarding ships. |

---

## 2. Hypotheses the measurement system must be able to falsify

Each hypothesis names the metrics (§3) that decide it and the thesis it defends.

| ID | Hypothesis | Decided by | Defends |
|---|---|---|---|
| **H-1** | Over N ≥ 5 iterations on a fixed image corpus, tokens and cost per iteration fall while the standards pass rate holds or rises, because Instrument rewrites context policies. | M-1, M-2, M-4 | T-1, T-6 |
| **H-2** | The builder ↔ instrumenter negotiation converges faster over iterations (fewer turns to pass), because the rewritten rules are baked into the builder's context. | M-3 | T-1, T-7 |
| **H-3** | Image re-read rate falls and transcript reuse rate rises across iterations, without a rise in inconsistency events between transcript and re-read. | M-5, M-6, M-7 | T-3 |
| **H-4** | Hot-tier hit rate rises and hot bytes fall (or hold) as the tiering policy is rewritten, i.e. the harness learns what to keep warm. | M-8, M-9, M-10 | T-4 |
| **H-5** | Rolling back to checkpoint *k* reproduces checkpoint *k*'s metric profile within tolerance on the next iteration. | M-12, M-13 | T-5 |
| **H-6** | Every policy change is attributable to a retrospective finding (traceability ≥ 90%), so improvement is caused, not drifted. | M-11, M-14 | T-1, T-6 |
| **H-7** | The same policy set drives a second builder harness (Kiro) with a standards pass rate within 20% of Claude Code's. | M-4 per adapter | T-7 |
| **H-8** | A stream that the harness turns down (e.g. screenshot cadence) does not reduce the standards pass rate or the transcript reuse rate; a stream it turns up does. | M-15, M-4, M-6 | T-8 |
| **H-9** | Plan's context selection (reranked retrospectives) has higher precision than recency-only selection, measured by whether the selected retrospectives are cited in the resulting plan. | M-16 | T-6, T-11 |
| **H-10** | Storage bytes per unit of retained context (transcript + index) fall over iterations while the corpus grows. | M-10, M-17 | T-2, T-4 |

---

## 3. The measurement system

**Principle.** Measurement is the hard-metric signal that makes the loop recursive rather than
merely iterative. Every iteration writes one `measurements` document to Atlas. Plan reads the last
*k* documents to pick a sprint mode. Instrument reads them to decide which policies to rewrite. The
inspector UI reads them to draw the evolution. Nothing is measured that is not written to Atlas.

### 3.1 Metric register

| ID | Metric | Definition | Source of truth | Collected by | Drives |
|---|---|---|---|---|---|
| **M-1** | `tokens_per_iteration` | Sum of prompt + completion tokens across Plan, Build, Instrument for one iteration | LangSmith traces; OpenRouter usage; provider usage headers | Instrument | H-1; Improvement sprint trigger |
| **M-2** | `cost_per_iteration` | USD equivalent of M-1 at provider rates | Same as M-1 | Instrument | H-1 |
| **M-3** | `build_turns_to_pass` | Builder ↔ instrumenter round-trips until checks pass (or budget exhausted) | Build loop log | Build | H-2; Fix sprint trigger |
| **M-4** | `standards_pass_rate` | Fraction of Instrument checks passing at checkpoint | Instrument checks | Instrument | H-1, H-2, H-7, H-8; Fix sprint trigger |
| **M-5** | `image_reread_rate` | Image reads beyond the first transcription ÷ total image reads | `transcripts` + read log | Media layer | H-3 |
| **M-6** | `transcript_reuse_rate` | Transcript fetches ÷ (transcript fetches + image reads) | Same | Media layer | H-3, H-8 |
| **M-7** | `transcript_inconsistency_events` | Deliberate re-reads whose extraction disagrees with the stored transcript | Re-read job | Media layer | H-3 (guard against hollow reuse) |
| **M-8** | `hot_tier_hit_rate` | Asset requests served from hot tier ÷ all asset requests | Tiering job log | Media layer | H-4 |
| **M-9** | `tier_moves` | Promotions and demotions per iteration | `media_index` change log | Media layer | H-4 |
| **M-10** | `bytes_hot`, `bytes_cold` | Bytes resident per tier at checkpoint | `media_index` aggregation | Media layer | H-4, H-10 |
| **M-11** | `policy_diff_size` | Lines (or fields) changed in `policies` at checkpoint | `policies` version diff | Instrument | H-6; visualizes "the harness rewrote itself" |
| **M-12** | `rollback_count`, `rollback_seconds` | Rollbacks invoked and time to restore git sha + policy version | `3pt rollback` | Harness CLI | H-5 |
| **M-13** | `checkpoint_fidelity` | Distance between metric profile after rollback-then-iterate and the original checkpoint's profile | `measurements` | Instrument | H-5 |
| **M-14** | `retrospective_attribution_rate` | Policy changes citing a retrospective finding id ÷ all policy changes | `policies` + `checkpoints` | Instrument | H-6 |
| **M-15** | `stream_budget` | Per input stream: on/off, cadence, bytes ingested, and its share of M-1 | `policies.streams` | Media layer | H-8 |
| **M-16** | `context_selection_precision` | Retrospectives selected by Plan that the resulting plan actually cites ÷ selected | `plans` | Plan | H-9 |
| **M-17** | `bytes_per_retained_context` | (M-10 total) ÷ number of transcripts + index entries | Aggregation | Media layer | H-10 |
| **M-18** | `iteration_wall_seconds` | Wall clock per iteration | Harness CLI | Harness CLI | Demo pacing; Statement 2 signal |
| **M-19** | `harness_health` | Weighted composite of M-4, M-6, M-8, inverse M-1; weights themselves live in `policies` and can be rewritten | Computed | Instrument | Sprint-mode selection; inspector headline |

### 3.2 Sprint-mode selection rule (initial policy; Instrument may rewrite it)

```
if M-4 fell vs. previous checkpoint OR M-3 exceeded budget      -> Fix
elif any of M-1, M-5, M-8, M-17 regressed two checkpoints running -> Improvement
else                                                              -> Feature
```

The rule is stored in `policies.sprint_selector` so that its rewriting is itself a measurable,
attributable policy change (M-11, M-14).

### 3.3 Time domains

| Domain | Granularity | Consumer |
|---|---|---|
| Per iteration | One `measurements` doc | Plan (next sprint), Instrument (which policy to rewrite) |
| Per session (the demo) | Rolling window of the last *k* | Inspector UI, retrospective |
| Per corpus epoch | Aggregates over a tier migration | Left-side migrations (T-11) |

### 3.4 Atlas collections the measurement system touches

`measurements` (one per iteration), `checkpoints` (sha, policy version, M-* snapshot,
retrospective), `policies` (versioned; includes `streams`, `sprint_selector`, `health_weights`),
`plans`, `media_index`, `transcripts`. Defined in `docs/03-workflow.md` §Initialized pipeline;
`measurements` fields are the M-* ids above.

---

## 4. Mapping hackathon products and incentives onto the theses

One table per partner. Columns: what the incentive gives us, which theses it serves, which
hypotheses it helps decide, the candidate features (R-ids, consolidated in §5), and the decision.

### 4.1 MongoDB Atlas (Sandbox is mandatory)

| Product / incentive | Serves | Decides | Candidate feature | Decision |
|---|---|---|---|---|
| **Atlas Hackathon Sandbox cluster** | T-1, T-5, T-6, T-11 | all | R-1 All harness state (`policies`, `checkpoints`, `measurements`, `plans`, `media_index`, `transcripts`) in the Sandbox from commit one | **Must** |
| **Versioned documents + change log** (plain collections) | T-5, T-6 | H-5, H-6 | R-2 `policies` and `checkpoints` versioned with sha; R-3 `3pt rollback <checkpoint>` restores git sha + policy version | **Must** |
| **Atlas Vector Search** | T-6, T-11 | H-9 | R-4 Vector index over retrospectives and transcripts so Plan selects context by similarity, not recency | **Should** |
| **Automated Embeddings** (in-database) | T-3, T-11 | H-9, H-10 | R-5 Let Atlas embed transcript text and retrospectives itself; no separate embedding pipeline to build or instrument | **Should** (removes an entire pipeline) |
| **Embedding & Reranking API** (single HTTP endpoint) | T-6, T-11 | H-9 | R-6 Rerank candidate retrospectives before Plan reads them; plain HTTP so the Swift inspector and the harness share one path | **Should** |
| **Atlas Search** (full-text) | T-10 | — | R-7 Inspector search over transcripts and retrospectives | **Could** |
| **GridFS** (in-sandbox blob store) | T-2, T-4 | H-4, H-10 | R-8 Cold tier = GridFS; hot tier = local filesystem; tier metadata in `media_index`. Keeps the whole workload inside the Sandbox for eligibility | **Must** |
| **Aggregation pipelines** | T-6 | H-4, H-10 | R-9 `bytes_hot`, `bytes_cold`, `bytes_per_retained_context` computed in Atlas, not in app code | **Must** |
| **Change Streams** | T-10 | — | R-10 Inspector subscribes to `checkpoints` and `measurements` so the demo updates live | **Could** |
| **Time Series collections** | T-6 | H-1, H-4 | R-11 `measurements` as a time-series collection for cheap per-iteration trend queries | **Could** |
| **MongoDB MCP Server** (local) | T-1, T-7 | H-2, H-6 | R-12 Instrumenter agent inspects schema, index health, and counts directly; builder agent gets live DB access | **Must** (already in `03-workflow.md` checklist) |
| **MongoDB Agent Skills** | T-7 | H-7 | R-13 Install for Claude Code on both machines; the skills are themselves a tool grant the harness can rewrite | **Must** |
| **Atlas Managed MCP Server** (hosted, service accounts) | T-7 | H-7 | R-14 Second harness (Kiro) connects via the managed MCP with a service account, proving "any harness, no local infra" | **Could** |
| **Frontier Marketplace Connectors** | T-7 | — | R-15 Codex / Claude connector for ad-hoc DB inspection during the build | **Could** |
| **Prize: $7k / $5k / $3k** | — | — | Weighted toward Technical Demo (35%) and Difficulty (30%): the live rewrite + checkpoint + rollback is what earns it | — |

### 4.2 Voyage AI (200M tokens per participant; top-ups on site)

| Product / incentive | Serves | Decides | Candidate feature | Decision |
|---|---|---|---|---|
| **Text embeddings** (voyage-3 family) | T-6, T-11 | H-9 | R-16 Embed retrospectives and transcript text when not using Automated Embeddings (R-5); pick one path, do not build both | **Should** (fallback for R-5) |
| **Reranking** (rerank-2) | T-6 | H-9 | R-6 (same as Atlas Embedding & Reranking API; choose whichever is wired first) | **Should** |
| **Multimodal embeddings** (voyage-multimodal-3; *not mentioned in the guide*, verify on docs.voyageai.com) | T-3 | H-3 | R-17 Embed the image once alongside its transcript, so near-duplicate detection never re-reads pixels | **Could** (verify token accounting for images first) |
| **Usage dashboard** | T-6 | H-1 | R-18 Pull embedding token usage into M-1 so the media layer's cost is inside `tokens_per_iteration` | **Should** |
| **200M tokens** | — | — | Enough for the whole corpus many times over; no budget policy needed today | — |

### 4.3 OpenRouter (free credits, one key, 500+ models)

| Product / incentive | Serves | Decides | Candidate feature | Decision |
|---|---|---|---|---|
| **One key, many models** | T-1 (polyglot gateway), T-7 | H-1, H-2 | R-19 Plan and Instrument route through OpenRouter; model choice per stage lives in `policies.models` so the harness can rewrite which model plans, builds, and instruments | **Must** |
| **Usage / cost reporting** | T-6 | H-1 | R-20 OpenRouter generation cost feeds M-1 and M-2 directly | **Must** |
| **Cheap fallback models** | T-6 | H-1 | R-21 An Improvement sprint may downgrade the instrumenter model if M-4 holds; a Fix sprint may upgrade it | **Should** (this is a visible self-rewrite) |

### 4.4 OpenAI Codex (1,250 credits)

| Product / incentive | Serves | Decides | Candidate feature | Decision |
|---|---|---|---|---|
| **Codex as a builder** | T-7 | H-7 | R-22 Third Build adapter. Codex reads `AGENTS.md`, which already exists; Instrument's policy writer targets `AGENTS.md` as one of its outputs | **Could** (after Kiro) |
| **Credits** | — | — | Budget for the adapter test only | — |

### 4.5 AWS Kiro (50 credits/mo + 500 bonus; no card)

| Product / incentive | Serves | Decides | Candidate feature | Decision |
|---|---|---|---|---|
| **Kiro CLI** | T-7 | H-7 | R-23 Second Build adapter: same spec in, same standards checks out. This is the proof that Build is a meta-harness | **Should** |
| **Kiro steering files and hooks** | T-1, T-8 | H-6 | R-24 Instrument writes Kiro steering files from `policies`, exactly as it writes `CLAUDE.md` for Claude Code. One policy document, N harness-specific renderings | **Should** |
| **Spec-driven workflow** | T-1 | H-2 | Plan's spec output maps onto Kiro's spec format with no translation layer | — |
| **Kiro Crew** | T-7 | — | Not needed today | **Won't** |

### 4.6 Vercel ($30 v0 credits; AI SDK; AI Gateway)

| Product / incentive | Serves | Decides | Candidate feature | Decision |
|---|---|---|---|---|
| **v0 scaffolder + one-click deploy** | T-10 | — | R-26 A public web inspector over Atlas state (checkpoints, `measurements` trend, policy diffs) for judges if the Swift app slips. Public URL in the submission | **Should** (insurance for Technical Demo) |
| **AI SDK** (agent loops, tool calling, streaming) | T-1 | — | Alternative harness runtime for Plan/Instrument if we go TypeScript; not needed if Python + LangGraph | **Won't** (avoid two runtimes) |
| **AI Gateway** | T-1 | H-1 | Overlaps OpenRouter (R-19); pick one gateway | **Won't** |
| **Prize: v0 credits** | — | — | — | — |

### 4.7 LangChain / LangSmith ($50 credits, Deployments access; LangGraph)

| Product / incentive | Serves | Decides | Candidate feature | Decision |
|---|---|---|---|---|
| **LangGraph + MongoDB checkpointer** (`langgraph-checkpoint-mongodb`) | T-1, T-5 | H-5 | R-27 The Plan → Build → Instrument state machine as a LangGraph graph whose thread checkpoints already persist to Atlas. We add our own `checkpoints` document on top for sha + policy version | **Must** (off-the-shelf durable state machine) |
| **LangSmith tracing** | T-6 | H-1, H-2, H-9 | R-28 Every stage traced; M-1, M-3, M-16 derived from traces rather than hand-instrumented | **Must** (the measurement system's primary source) |
| **LangSmith datasets + evals** | T-6 | H-3, H-7 | R-29 A small eval set of transcripts vs. deliberate re-reads to compute M-7; per-adapter eval for H-7 | **Could** |
| **Deep Agents** | T-1 | — | Planning-agent scaffold; only if it shortens Plan | **Won't** |
| **Deployments** | — | — | Not needed for a local demo | **Won't** |
| **Prize: LangSmith credits** | — | — | — | — |

### 4.8 ElevenLabs (1 month Creator)

| Product / incentive | Serves | Decides | Candidate feature | Decision |
|---|---|---|---|---|
| **Text-to-speech** | — | — | R-30 Narration for the 1-minute submission video, generated from the retrospective text of the final checkpoint (the harness narrates its own evolution) | **Could** (cheap creativity points) |
| **Conversational agents** | — | — | — | **Won't** |

### 4.9 Judging weights as incentives

| Criterion (weight) | What to show live | Theses on stage |
|---|---|---|
| Technical Demo (35%) | One full iteration: Plan picks a sprint mode from `measurements`, Build negotiates to pass, Instrument rewrites `policies`, checkpoint lands in Atlas, then `3pt rollback` | T-1, T-5, T-6 |
| Implementation Difficulty (30%) | LangGraph state machine on Atlas, builder ↔ instrumenter negotiation, tier migration, policy diff viewer | T-4, T-7, T-11 |
| Impact Potential (20%) | Read-once transcripts and hot/cold tiering as real pain for media-heavy pipelines | T-2, T-3, T-4, T-9 |
| Creativity (15%) | Measurement as the fourth dimension; the harness narrating its own retrospective; two-sided triangle | T-6, T-11 |

---

## 5. Consolidated requirement set

| ID | Requirement | Thesis | Partner infrastructure | Priority | Lane |
|---|---|---|---|---|---|
| R-1 | All harness state in the Atlas Sandbox from commit one | T-1, T-5 | Atlas Sandbox | Must | Backend |
| R-2 | `policies` and `checkpoints` versioned with git sha | T-5 | Atlas | Must | Backend |
| R-3 | `3pt rollback <checkpoint>` restores sha + policy version, live in demo | T-5 | Atlas + git | Must | Stack |
| R-4 | Vector index over retrospectives and transcripts | T-6, T-11 | Atlas Vector Search | Should | Backend |
| R-5 | In-database embeddings for transcripts and retrospectives | T-3, T-11 | Automated Embeddings | Should | Backend |
| R-6 | Rerank candidate retrospectives before Plan reads them | T-6 | Embedding & Reranking API or Voyage rerank | Should | Stack |
| R-7 | Inspector full-text search | T-10 | Atlas Search | Could | UI |
| R-8 | Cold tier in GridFS, hot tier local, metadata in `media_index` | T-2, T-4 | GridFS | Must | Backend |
| R-9 | Tier and context byte metrics computed by aggregation | T-6 | Aggregation | Must | Backend |
| R-10 | Inspector live-updates from change streams | T-10 | Change Streams | Could | UI |
| R-11 | `measurements` as a time-series collection | T-6 | Time Series | Could | Backend |
| R-12 | MCP Server connected for builder and instrumenter agents | T-1, T-7 | MongoDB MCP Server | Must | Stack |
| R-13 | Agent Skills installed on both machines | T-7 | Agent Skills | Must | Stack |
| R-14 | Kiro connects via Atlas Managed MCP with a service account | T-7 | Managed MCP | Could | Stack |
| R-15 | Marketplace connector for ad-hoc inspection | T-7 | Connectors | Could | Stack |
| R-16 | Voyage text embeddings as fallback for R-5 | T-11 | Voyage | Should | Backend |
| R-17 | Image embeddings for near-duplicate detection without re-reads | T-3 | Voyage multimodal (verify) | Could | Backend |
| R-18 | Embedding token usage folded into M-1 | T-6 | Voyage usage | Should | Backend |
| R-19 | Per-stage model choice in `policies.models`, routed via OpenRouter | T-1, T-7 | OpenRouter | Must | Stack |
| R-20 | OpenRouter cost feeds M-1 / M-2 | T-6 | OpenRouter | Must | Stack |
| R-21 | Sprint mode may upgrade or downgrade the instrumenter model | T-6 | OpenRouter | Should | Stack |
| R-22 | Codex Build adapter targeting `AGENTS.md` | T-7 | Codex | Could | Stack |
| R-23 | Kiro CLI Build adapter | T-7 | Kiro | Should | Stack |
| R-24 | Instrument renders `policies` into `CLAUDE.md` and Kiro steering files | T-1, T-8 | Kiro | Should | Stack |
| R-25 | Input-event stream (DTrace) as a dial-able stream | T-8 | — | Could | Backend |
| R-26 | Public web inspector via v0 as demo insurance | T-10 | Vercel v0 | Should | UI |
| R-27 | Plan → Build → Instrument as a LangGraph graph checkpointed to Atlas | T-1, T-5 | LangGraph MongoDB checkpointer | Must | Stack |
| R-28 | All stages traced; M-1, M-3, M-16 derived from traces | T-6 | LangSmith | Must | Stack |
| R-29 | Eval set for transcript consistency (M-7) and per-adapter parity (H-7) | T-3, T-7 | LangSmith evals | Could | Stack |
| R-30 | Submission video narrated from the final retrospective | — | ElevenLabs | Could | UI |
| R-31 | `measurements` doc written every iteration with the M-* fields in §3.1 | T-6 | Atlas | Must | Backend |
| R-32 | Sprint selector, health weights, and stream budgets stored in `policies` so their rewrite is measurable | T-6, T-8 | Atlas | Must | Stack |

**Must-set count:** 13 (R-1, 2, 3, 8, 9, 12, 13, 19, 20, 27, 28, 31, 32). This is the minimum
that makes H-1, H-5, and H-6 decidable live on stage.

---

## 6. Where the incentives let us use set infrastructure instead of building it

| We would otherwise build | Partner gives it | Saved |
|---|---|---|
| A durable state machine with resumable checkpoints | LangGraph + MongoDB checkpointer (R-27) | The whole orchestration runtime |
| Hand-instrumented token and turn counters | LangSmith traces (R-28) | Most of the measurement collection code |
| An embedding pipeline with its own jobs and retries | Atlas Automated Embeddings (R-5) | One pipeline, and the instrumentation of it |
| A model-routing layer with cost accounting | OpenRouter (R-19, R-20) | The polyglot gateway's plumbing |
| Database introspection tools for agents | MongoDB MCP Server + Agent Skills (R-12, R-13) | Tool-building for the instrumenter |
| A second harness to prove the meta-harness claim | Kiro CLI + steering files (R-23, R-24) | Writing our own second agent runtime |
| A public inspector | v0 (R-26) | UI hours, if the Swift app slips |
| Blob storage inside the eligibility boundary | GridFS (R-8) | An external object store and its credentials |

## 7. Open questions carried forward

1. R-5 vs. R-16: confirm Automated Embeddings is available on the Sandbox tier before committing; otherwise Voyage text embeddings.
2. R-17: confirm Voyage multimodal model availability and how image tokens count against the 200M allowance.
3. R-27: confirm the LangGraph MongoDB checkpointer's collection layout does not collide with our `checkpoints` collection; namespace ours if needed.
4. H-5 tolerance: pick a concrete threshold for `checkpoint_fidelity` once the first three iterations produce numbers.
