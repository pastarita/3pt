# Strands, drawn: architecture diagrams of the systems we build on

*Source of record for learning Strands. Nine Mermaid diagrams, one per system, drawn from the
sources registered in `docs/12-strands-archaeology.md` (S1–S20). Where a diagram shows structure
the docs only imply, the caption says "inferred". Colours follow the diagram design system in
`docs/10-architecture.md` §3 plus one class, `strands` (slate), for things that are theirs, not ours.
Companion to the SVG sketches on the hub (`hub/site/sketches.html`).*

Class key used below: `strands` = a Strands component we call as is · `ours` (flag) = what 3PT adds ·
`atlas` = state · `plan / build / inst` = our stages when they appear.

## 1. The monorepo and its packages

*What ships from `strands-agents/harness-sdk`, and which package we import from.* (S1, S2, S3, S18, S19)

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart TB
  subgraph REPO["strands-agents/harness-sdk · Apache-2.0 · pushed 2026-09-25"]
    direction LR
    PY["strands-py/\nPyPI strands-agents 1.57.1\nthe SDK: agent loop, models, tools, hooks"]:::strands
    TS["strands-ts/\nnpm @strands-agents/sdk 1.19.0\nsame surface in TypeScript"]:::strands
    HPY["harness-py/\nPyPI strands-harness 0.1.2\ncreate_harness()"]:::strands
    HTS["harness-ts/\nnpm @strands-agents/harness 0.1.1\ncreateHarness()"]:::strands
    CLI["strands-cli/\nnpm @strands-agents/cli 0.1.4\nTUI · /export"]:::strands
    MCP["strands-mcp/\nPyPI strands-agents-mcp-server 0.3.0\nsearch_docs · fetch_doc"]:::strands
    SITE["site/ · docs"]:::data
    HPY --> PY
    HTS --> TS
    CLI --> HTS
  end
  subgraph SIDE["sibling packages, PyPI"]
    direction LR
    EV["strands-evals 0.0.1"]:::strands
    OPT["strands-harness-optimizer 0.0.1"]:::strands
    SOP["strands-agents-sops 1.1.3"]:::strands
  end
  EV --> PY
  OPT --> PY
  OURS["@3pt/strands · the policy compiler"]:::ours
  OURS --> HTS
  OURS -.->|"Python step: evals + optimizer"| EV & OPT
  classDef strands fill:#232a33,stroke:#7d8a99,color:#e6e9ee
  classDef data fill:#1a2029,stroke:#6b7684,color:#a3adbb
  classDef ours fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

The harness packages are thin: they compose the SDK with defaults. The CLI composes the harness.
We compose the harness too, one level beside the CLI, from a Policy instead of a config file.

## 2. The layers: SDK → harness → CLI → 3PT

*Which layer owns which decision.* (S2, S17, S18)

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph L0["SDK · primitives"]
    direction TB
    A["Agent"]:::strands
    T["tool() · MCP"]:::strands
    M["Model · ModelRouter"]:::strands
    H["hooks · Plugin"]:::strands
    S["SessionManager · Storage"]:::strands
    MM["MemoryManager · MemoryStore"]:::strands
    I["interventions · steering"]:::strands
    G["Graph · Swarm · A2A"]:::strands
  end
  subgraph L1["harness · assembled defaults"]
    direction TB
    CH["createHarness(options)"]:::strands
    BT["built-in tools: shell read write edit\nweb_fetch web_search programmatic_tool_caller subagent"]:::strands
    BP["built-in plugins: todos · environment"]:::strands
    HC["HARNESS_CONTRACT + buildSystemPrompt"]:::strands
    DEF["defaults: caching auto · contextManager auto\nsession ./.agent/sessions · memory ./.agent/memory · skills ./.agent/skills"]:::strands
  end
  subgraph L2["CLI · a person"]
    direction TB
    TUI["strands · /model /effort /permissions /export"]:::strands
  end
  subgraph L3["3PT · a policy"]
    direction TB
    POL[/"Policy v<n>"/]:::data
    CMP["harnessOptions(policy, stage)"]:::ours
  end
  L0 --> CH
  CH --> BT & BP & HC & DEF
  CH --> TUI
  POL --> CMP --> CH
  classDef strands fill:#232a33,stroke:#7d8a99,color:#e6e9ee
  classDef data fill:#1a2029,stroke:#6b7684,color:#a3adbb
  classDef ours fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

## 3. One invocation: the agent loop with its hooks

*Where a plugin can see or change things.* (S6, S7, S12, S13) Hook order within a step is inferred.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","actorBkg":"#1a2029","actorBorder":"#3a4552","actorTextColor":"#e6e9ee","signalColor":"#a3adbb","signalTextColor":"#e6e9ee","noteBkgColor":"#1f262f","noteTextColor":"#e6e9ee","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
sequenceDiagram
  autonumber
  participant C as caller
  participant A as Agent
  participant P as plugins (hooks)
  participant I as interventions / steering
  participant M as Model (or ModelRouter)
  participant T as tools
  participant S as SessionManager → Storage
  C->>A: invoke(prompt) / stream(prompt)
  A->>P: BeforeInvocationEvent
  loop each cycle until a StopReason
    A->>P: BeforeModelCallEvent
    A->>M: messages + tools + system prompt
    M-->>A: content · toolUse? · stopReason
    A->>P: AfterModelCallEvent
    A->>I: steer_after_model → Proceed | Guide
    alt toolUse
      A->>P: BeforeToolsEvent
      A->>I: interventions: allow · ask · deny (per tool call)
      A->>I: steer_before_tool → Proceed | Guide
      A->>P: BeforeToolCallEvent
      A->>T: execute (concurrent or sequential executor)
      T-->>A: ToolResultEvent
      A->>P: AfterToolCallEvent · AfterToolsEvent
      A->>P: MessageAddedEvent
      A->>S: save (after each completed message)
      Note over A: checkpointing: true → may stop here with stopReason = checkpoint
    else endTurn · limit* · cancelled · refusal · …
      A->>P: AfterInvocationEvent
    end
  end
  A-->>C: AgentResult { stopReason, metrics, messages }
```

## 4. Stop reasons as a state machine

*Every way an invocation ends, grouped by who decided.* (S7)

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
stateDiagram-v2
  [*] --> Running
  Running --> toolUse : model asks for a tool
  toolUse --> Running : tools executed
  Running --> checkpoint : cycle boundary, checkpointing on
  checkpoint --> Running : checkpointResume
  Running --> pauseTurn : model pauses a long turn
  pauseTurn --> Running : send response back
  Running --> interrupt : human input requested
  interrupt --> Running : answered
  state "model decided" as MD {
    endTurn
    stopSequence
    maxTokens
    modelContextWindowExceeded
  }
  state "loop limits (ours to set)" as LL {
    limitTurns
    limitTotalTokens
    limitOutputTokens
  }
  state "policy decided" as PD {
    guardrailIntervened
    contentFiltered
    refusal
  }
  Running --> MD
  Running --> LL
  Running --> PD
  Running --> cancelled : agent.cancel()
  MD --> [*]
  LL --> [*]
  PD --> [*]
  cancelled --> [*]
```

For 3PT the loop-limit group is the turn budget, the policy group is what Instrument counts as
M-ERR, and `checkpoint` is the boundary a 3PT checkpoint record points at.

## 5. Model resolution and the router

*How a `provider/name` string becomes a Model, and how a ModelRouter chooses among candidates.* (S4, S5)

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  IN["model option\nModel | ModelRouter | 'provider/name' | bare Bedrock id"]:::data
  RES["resolveModel(spec, effort, caching)\nharness-ts/src/models.ts"]:::strands
  subgraph PROV["PROVIDERS table"]
    direction TB
    B["bedrock · default\nAWS credential chain"]:::strands
    BM["bedrock-mantle"]:::strands
    AN["anthropic · ANTHROPIC_API_KEY"]:::strands
    OA["openai · OPENAI_API_KEY"]:::strands
    GO["google · GEMINI_API_KEY"]:::strands
    OL["ollama · OLLAMA_HOST"]:::strands
    LL["litellm · LITELLM_BASE_URL\nOpenAI-compatible → OpenRouter?"]:::strands
  end
  EFF["effort → provider's own field\nauto|off|minimal|low|medium|high|xhigh|max"]:::strands
  IN --> RES --> PROV
  RES --> EFF
  subgraph RT["ModelRouter(candidates, {strategy, maxSwitches})"]
    direction TB
    C1["RoutingCandidate 'primary'"]:::strands
    C2["RoutingCandidate 'fallback'"]:::strands
    C3["nested ModelRouter · one opaque candidate"]:::strands
    ST{"RoutingStrategy"}:::strands
    FB["FallbackStrategy · default\nfewest recorded failures, then declaration order"]:::strands
    CL["ClassifierStrategy\nan LLM reads candidate evidence + the request\nsystemPrompt · timeoutMs · max*Chars"]:::strands
    ST --> FB & CL
  end
  PROV --> C1 & C2
  ST -->|"before first call, and after each failure"| C1
  OURS["policy.routes[stage]\ncandidates · effort · strategy"]:::ours --> RT
  classDef strands fill:#232a33,stroke:#7d8a99,color:#e6e9ee
  classDef data fill:#1a2029,stroke:#6b7684,color:#a3adbb
  classDef ours fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

Success re-arms every candidate for the next invocation; a failed call re-consults the strategy
unless another hook (a retry strategy) claims the retry.

## 6. Persistence: Storage, sessions, snapshots, memory

*One byte-store interface under three subsystems. This is the seam Atlas plugs into.* (S6, S8, S9, S10, S11)

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
classDiagram
  class Storage {
    <<interface>>
    +write(key, bytes)
    +read(key) bytes|null
    +delete(key)
    +list(prefix) string[]
    +namespace(prefix) Storage
    +search(query) StorageSearchResult[]
  }
  class FileStorage
  class S3Storage
  class InMemoryStorage
  class AtlasStorage {
    collection strands_storage
    +key, ns, bytes
  }
  Storage <|.. FileStorage
  Storage <|.. S3Storage
  Storage <|.. InMemoryStorage
  Storage <|.. AtlasStorage : 3PT
  class SessionManager {
    +config.storage : Storage
    saves after each completed message
    messages · agent state · conversation-manager state
    multi-agent: orchestrator state · node transitions
  }
  class Snapshot {
    sessions/sid/scopes/agent/scope/snapshots/
    snapshot_latest.json
    immutable_history/snapshot_uuid7.json
  }
  class MemoryManager {
    +config.stores : MemoryStore[]
    +flush()
    extraction triggers
    injection before turn
  }
  class MemoryStore {
    <<interface>>
    +name · description · writable
    +search(query, opts) MemoryEntry[]
    +add(content, meta)
    +addMessages(messages)
    +initialize()
    +getTools() Tool[]
  }
  class AtlasMemoryStore {
    transcripts + vector index
    Voyage embeddings
  }
  class Checkpoint {
    position: after_model | after_tools
    cycle_index
    schema_version
    holds no conversation state
  }
  SessionManager --> Storage
  SessionManager --> Snapshot
  MemoryManager --> Storage
  MemoryManager --> MemoryStore
  MemoryStore <|.. AtlasMemoryStore : 3PT
  Checkpoint ..> SessionManager : pair with
```

## 7. Control: interventions, steering, guardrails

*Three mechanisms that can say no, and when each speaks.* (S2, S13; Agent Control from the blog `strands-agents-with-agent-control`)

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart TB
  TC["a proposed tool call"]:::data
  subgraph INT["interventions · the gate · before a tool runs"]
    direction LR
    ASK["'ask' · human approves every call"]:::strands
    SMART["'smart' · LLM risk classifier"]:::strands
    TXT["policy text\n'Read-only, but writes under ./out are fine'"]:::strands
    CED["./agent.cedar · Cedar policy"]:::strands
    HITL["HumanInTheLoop({ ask })"]:::strands
    LAY["layered: ['./agent.cedar', 'ask']"]:::strands
  end
  subgraph STEER["steering · the nudge · before a tool and after the model"]
    direction LR
    SBT["steer_before_tool(tool_use) → Proceed | Guide(reason)"]:::strands
    SAM["steer_after_model(message, stop_reason) → Proceed | Guide(reason)"]:::strands
  end
  subgraph GR["guardrails · content policy · Bedrock or Agent Control"]
    direction LR
    EVAL["evaluator (regex · classifier) on input/output"]:::strands
    ACT["action: allow · warn · steer · deny"]:::strands
  end
  TC --> INT
  INT -->|allow| STEER
  INT -->|deny| STOP1["tool skipped · model told why"]:::data
  STEER -->|Proceed| RUN["tool runs"]:::data
  STEER -->|Guide| RETRY["model retries with the guidance"]:::data
  RUN --> GR
  GR -->|deny| STOP2["stopReason guardrailIntervened"]:::data
  OURS["policy.toolGrants[stage] → builtinTools + interventions\nInstrument standards → steering handlers"]:::ours --> INT & STEER
  classDef strands fill:#232a33,stroke:#7d8a99,color:#e6e9ee
  classDef data fill:#1a2029,stroke:#6b7684,color:#a3adbb
  classDef ours fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

Subagents inherit the intervention policy; calls inside `programmatic_tool_caller` are gated too.
Steering won 100% pass at 66% fewer input tokens than SOP prompting in Strands' own 600-run test.

## 8. Multi-agent: subagents, Graph, Swarm, A2A

*Four ways agents call agents, and which one each 3PT relation uses.* (S2, S20; A2A from `strands-ts/src/a2a/`)

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph SA["subagent · delegation inside one harness"]
    direction TB
    PA["parent agent"]:::strands
    ST["built-in subagent tool · maxDepth"]:::strands
    MS["makeSubagent({ builder, presets, instructions: Fixed, model: Inherit })"]:::strands
    AT["agent.asTool()"]:::strands
    PA --> ST & MS & AT
  end
  subgraph GRP["Graph · explicit DAG"]
    direction LR
    N1["node: plan"]:::plan --> N2["node: build"]:::build --> N3["node: instrument"]:::inst
  end
  subgraph SW["Swarm · model-driven handoff"]
    direction LR
    W1["agent A"]:::strands <--> W2["agent B"]:::strands <--> W3["agent C"]:::strands
  end
  subgraph A2A["A2A · agents as network peers"]
    direction LR
    SRV["A2A server (express)"]:::strands --- EXE["executor"]:::strands --- CLT["A2AAgent client"]:::strands
  end
  R1["builder ↔ reviewer"]:::ours --> MS
  R2["Plan → Build → Instrument"]:::ours --> GRP
  R3["two machines, one loop (later)"]:::ours -.-> A2A
  classDef strands fill:#232a33,stroke:#7d8a99,color:#e6e9ee
  classDef plan fill:#241f3d,stroke:#8b7cf6,color:#e6e9ee
  classDef build fill:#3a2c12,stroke:#e0a33a,color:#e6e9ee
  classDef inst fill:#12342a,stroke:#3fb886,color:#e6e9ee
  classDef ours fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

Multi-agent sessions persist orchestrator state, per-node results, shared context, and the node
transition history, so a `Graph` run is inspectable after the fact.

## 9. Evaluation and the optimizer loop

*How Strands scores an agent, and how the optimizer turns scores into a better harness. This is the mechanism under 3PT's Instrument stage.* (S14, S15)

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph EV["strands_evals"]
    direction TB
    CASE["Case { input, expected_output, expected_trajectory }"]:::strands
    GEN["ExperimentGenerator · cases from a description"]:::strands
    SIM["ActorSimulator · simulated users, multi-turn"]:::strands
    EXP["Experiment(cases, evaluators)"]:::strands
    TASK["task function\nonline: run the agent · offline: read recorded traces"]:::strands
    EVS["evaluators\nOutput · Trajectory · Interactions · Helpfulness · Faithfulness\nHarmfulness · ToolSelection · ToolParameter · GoalSuccessRate · …"]:::strands
    REP["EvaluationReport · scores · per-case · reasoning"]:::strands
    GEN --> CASE --> EXP
    SIM --> TASK
    EXP --> TASK --> EVS --> REP
  end
  subgraph OPT["strands_harness_optimizer · forward → loss → gradient → step"]
    direction TB
    DL["DataLoader"]:::strands
    ENG["AgentRolloutEngine / LocalRolloutEngine"]:::strands
    FRM["Formula\nprocess() · get_tunable_params() · update_params()\nSystemPromptFormula today"]:::strands
    RW["RewardFunction · win/loss over traces"]:::strands
    FO["FormulaOptimizer\nContrastiveReflectionOptimizer · MultiAgentOptimizer"]:::strands
    TR["Trainer.fit(n_epochs)"]:::strands
    DL --> ENG --> RW --> FO --> FRM --> ENG
    TR --- DL & ENG & RW & FO
  end
  REP -.->|"reward signal"| RW
  PF["PolicyFormula (3PT)\ntunable: rules · toolGrants · routes"]:::ours --> FRM
  POL[/"policy v<n+1>"/]:::data
  FRM ==>|"update_params"| POL
  classDef strands fill:#232a33,stroke:#7d8a99,color:#e6e9ee
  classDef data fill:#1a2029,stroke:#6b7684,color:#a3adbb
  classDef ours fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

Strands' numbers, system prompt only, Claude Sonnet 4.6: AppWorld 72.6 → 95.8, WebShop 56.5 → 67.5.
Our `PolicyFormula` is the Formula whose tunable parameters are the whole 3PT Policy, and the
evaluation plan that Plan hands to Instrument (sketch 4) is the `Experiment` that produces the reward.

## 10. Where 3PT touches Strands, on one page

*Every 3PT component and the one Strands seam it uses.* (summary of the above)

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph OURS["3PT"]
    direction TB
    O1["harnessOptions(policy, stage)"]:::ours
    O2["routerSpec(stage)"]:::ours
    O3["grants(policy, stage)"]:::ours
    O4["AtlasStorage"]:::ours
    O5["AtlasMemoryStore"]:::ours
    O6["measurementPlugin"]:::ours
    O7["standards as steering"]:::ours
    O8["PolicyFormula + evaluation plan"]:::ours
    O9["media tools"]:::ours
    O10["batteries' SKILL.md"]:::ours
  end
  subgraph SEAM["Strands seam"]
    direction TB
    S1["createHarness(options)"]:::strands
    S2["ModelRouter as model"]:::strands
    S3["builtinTools + interventions"]:::strands
    S4["Storage → sessionManager / storage"]:::strands
    S5["memory.stores[]"]:::strands
    S6["Plugin.initAgent + addHook"]:::strands
    S7["steer_before_tool / steer_after_model"]:::strands
    S8["Formula · Trainer · Experiment"]:::strands
    S9["tool({ inputSchema: z.object })"]:::strands
    S10["skills: [dirs]"]:::strands
  end
  O1 --> S1
  O2 --> S2
  O3 --> S3
  O4 --> S4
  O5 --> S5
  O6 --> S6
  O7 --> S7
  O8 --> S8
  O9 --> S9
  O10 --> S10
  classDef strands fill:#232a33,stroke:#7d8a99,color:#e6e9ee
  classDef ours fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

Ten seams, ten lines. Anything 3PT wants that is not one of these lines is either a new seam to
find in Strands first, or a thing we should not build.
