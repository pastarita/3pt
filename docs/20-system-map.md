# System map: the implemented architecture, drawn

*Source of record for what exists in the tree on 2026-09-26 (HEAD `8e40630` plus the working tree).
Sixteen Mermaid figures, each derived from the files it names, in the diagram design system of
`docs/10-architecture.md` §3. `docs/10` is the design; this is the recapitulation of what was built
against it. Where the two differ, §17 says so, and this document wins for "what runs today".*

Status words, on every figure. **wired** = called on a path a command exercises today ·
**written** = code exists, nothing calls it · **stub** = declares what it will provide (`battery.provides`)
and no more · **planned** = a record only (`infra/targets.json`, a doc).

| § | Figure | Question it answers |
|---|---|---|
| 1 | The tree | What is in the repo, workspace by workspace |
| 2 | Who imports whom | The exact dependency edges in `package.json` |
| 3 | The core contract | The records and interfaces everything agrees on |
| 4 | One `3pt loop` | What happens, in order, when the loop runs once |
| 5 | The sprint selector | How Plan picks feature, improvement, or fix |
| 6 | Checks by mode | What Instrument writes under each mode |
| 7 | Ten checks, ten grants | What the loop can learn on the demo firm |
| 8 | The backfeed | How findings become the next policy version |
| 9 | Atlas | Every collection, who writes it, who reads it |
| 10 | Keys | Where each key lives and how it reaches a stage |
| 11 | Policy to Strands | The compile step, field by field |
| 12 | The app loop | The second loop: screens, taps, ship, score, undo |
| 13 | The media path | The left side of the triangle, as far as it goes |
| 14 | Data | The demo firm and its three consumers |
| 15 | What runs where | Deployment, as live |
| 16 | CI, the herald, the hub pipeline | What gates a push and a PR |
| 17 | Lineage today, and the ledger | Checkpoints on disk, and every component's status |

## 1. The tree

*Twenty-two pnpm workspaces in three lanes, and the directories beside them that are not workspaces.*
Derived from `pnpm-workspace.yaml` and every `package.json` under `ui/`, `harness/`, `infra/`.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart TB
  subgraph UI["ui/ · surfaces · 6 workspaces"]
    direction TB
    subgraph UIA["apps"]
      direction LR
      LIVE["live\nthe app on live harness data"]:::surface
      WEB["web\nrole screens, tours, capture suite"]:::surface
      PWA["pwa\ninstallable inspector"]:::surface
      MAC["macos\nSwiftUI inspector"]:::surface
    end
    subgraph UIP["packages"]
      direction LR
      DS["design-system\ntokens, cssVars()"]:::surface
      IC["inspector-client\ntyped fetch over the API"]:::surface
    end
  end
  subgraph HA["harness/ · the pipeline · 10 workspaces"]
    direction TB
    subgraph HAA["apps"]
      direction LR
      CLI["cli\n3pt plan build instrument improve loop rollback replay keys"]:::build
      API["api\nHTTP: /app/* /sim/* /health /keys"]:::surface
      WK["worker\ntick() under node · edge.ts on Cloudflare"]:::build
    end
    subgraph HAP["packages"]
      direction LR
      CORE["core\nCOLLECTIONS, Policy, Store, runIteration"]:::flag
      PL["plan"]:::plan
      BU["build"]:::build
      IN["instrument"]:::inst
      IMP["improver"]:::inst
      ME["media\nchooseTier, jobFor"]:::build
      STR["strands\nPolicy → createHarness() options"]:::build
    end
  end
  subgraph INF["infra/batteries · 6 workspaces"]
    direction LR
    BA["atlas\nstore, provision, vault, keychain, seed-demo, sandbox.sh"]:::battery
    BB["blob\nstub"]:::battery
    BR["repo\nheadSha, showAt, snapshot"]:::battery
    BT["tracing\nstub"]:::battery
    BF["artifacts\nstub"]:::battery
    BX["box\nColima + Ansible, box.sh"]:::battery
  end
  subgraph NW["beside the workspaces"]
    direction LR
    DOCS["docs/\nsource of record"]:::data
    HUB["hub/\nthe gated site over docs/"]:::data
    DATA["data/mock/\nAcme Builders, media-pool"]:::data
    SCR["scripts/\nprov, prompts, worktree, target, build-web-site"]:::data
    POL["harness/policies/ · harness/checkpoints/\nthe git mirror of the lineage"]:::data
  end
  classDef plan fill:#241f3d,stroke:#8b7cf6,color:#e6e9ee
  classDef build fill:#3a2c12,stroke:#e0a33a,color:#e6e9ee
  classDef inst fill:#12342a,stroke:#3fb886,color:#e6e9ee
  classDef surface fill:#232a33,stroke:#7d8a99,color:#e6e9ee
  classDef battery fill:#1f262f,stroke:#a3adbb,color:#e6e9ee
  classDef data fill:#1a2029,stroke:#6b7684,color:#a3adbb
  classDef flag fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

Turborepo runs `build` with `dependsOn: ["^build"]` across all twenty-two; `macos` is a manifest that
lets `turbo build` drive xcodegen and xcodebuild, not a JS package.

## 2. Who imports whom

*Every edge is a line in a `dependencies` block. Nothing is inferred.*
Derived from the twenty-two `package.json` files. External packages are the grey nodes.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph S["surfaces"]
    direction TB
    LIVE[live]:::surface
    WEB[web]:::surface
    PWA[pwa]:::surface
    IC[inspector-client]:::surface
    DS[design-system]:::surface
  end
  subgraph A["apps"]
    direction TB
    CLI[cli]:::build
    API[api]:::surface
    WK[worker]:::build
  end
  subgraph P["packages"]
    direction TB
    PL[plan]:::plan
    BU[build]:::build
    IN[instrument]:::inst
    IMP[improver]:::inst
    ME[media]:::build
    STR[strands]:::build
    CORE[core]:::flag
  end
  subgraph B["batteries"]
    direction TB
    BA[atlas]:::battery
    BR[repo]:::battery
    BB[blob]:::battery
    BT[tracing]:::battery
    BF[artifacts]:::battery
    BX[box]:::battery
  end
  subgraph X["external"]
    direction TB
    SH["@strands-agents/harness 0.1.1"]:::data
    SS["@strands-agents/sdk 1.19.0"]:::data
    MG["mongodb · mongodb-client-encryption"]:::data
    OA["openai · zod"]:::data
  end
  LIVE & WEB & PWA --> DS & IC & CORE
  IC --> CORE
  CLI --> PL & BU & IN & IMP & BA & BR & CORE
  API --> BA & CORE
  WK --> ME & BA & API & CORE
  BU --> STR & SH & CORE
  STR --> SH & SS & OA & CORE
  PL & IN & IMP & ME --> CORE
  BA --> MG & CORE
  BR & BB & BT & BF & BX --> CORE
  classDef plan fill:#241f3d,stroke:#8b7cf6,color:#e6e9ee
  classDef build fill:#3a2c12,stroke:#e0a33a,color:#e6e9ee
  classDef inst fill:#12342a,stroke:#3fb886,color:#e6e9ee
  classDef surface fill:#232a33,stroke:#7d8a99,color:#e6e9ee
  classDef battery fill:#1f262f,stroke:#a3adbb,color:#e6e9ee
  classDef data fill:#1a2029,stroke:#6b7684,color:#a3adbb
  classDef flag fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

Three rules hold in the built tree: stages import `core` only; batteries are imported by apps, never by
stages; surfaces import `core` for types and reach the harness over HTTP. Two edges deserve a note.
`worker → api` is the one app-to-app edge: the Cloudflare Worker *is* the API's deployment. `api → atlas`
is a dynamic import behind a variable module name, so the Worker bundle never pulls in the driver.

## 3. The core contract

*The records every stage, surface and battery agrees on, and the three things that keep the loop and the
run apart: a frozen policy, a guarded store, injected secrets.*
Derived from `harness/packages/core/src/index.ts`.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
classDiagram
  class Policy {
    version
    createdAt
    rules
    contextPolicy
    toolGrants
    provenance
  }
  class Checkpoint {
    iteration
    tag
    gitSha
    policyVersion
    metrics
    retrospective
  }
  class Plan {
    iteration
    mode
    spec
    evaluation
    basedOn
  }
  class Finding {
    iteration
    check
    passed
    note
    answer
    revoke
  }
  class Measurement {
    iteration
    metric
    value
    unit
    source
  }
  class MediaAsset {
    assetId
    tier
    location
    transcriptId
    lastRead
  }
  class Job {
    kind
    assetId
    status
    attempts
  }
  class Store {
    <<interface>>
    +insert()
    +latest()
    +find()
  }
  class StageContext {
    iteration
    policy
    store
    secrets
    harness
    log
  }
  class Stage {
    <<interface>>
    name
    +run(ctx)
  }
  class Secrets {
    openrouter
    voyage
    langsmith
    github
  }
  Stage ..> StageContext : run(ctx)
  StageContext ..> Policy : freezePolicy() deep-frozen copy
  StageContext ..> Store : stageStore() refuses policies, checkpoints
  StageContext ..> Secrets : readSecrets() at the edge
  Finding ..> Policy : rewritePolicy() in the improver
  Checkpoint ..> Policy : policyVersion
  Plan ..> Checkpoint : basedOn
  Job ..> MediaAsset : assetId
  Store <|.. memoryStore : core, tests and replay
  Store <|.. fileStore : cli, .3pt/store/*.jsonl
  Store <|.. AtlasStore : battery-atlas, the Sandbox cluster
```

Sixteen collection names live in `COLLECTIONS` and nowhere else. `LOOP_OWNED` is `policies` and
`checkpoints`: a stage that inserts into either throws. `runIteration` runs the three stages in order, never
in parallel. `seedPolicy()` is v0: three rules, token caps of 40k / 120k / 60k, and the grant lists a stage
starts with.

## 4. One `3pt loop`

*What the CLI does, in order, when the loop runs once. `--git` adds the last step.*
Derived from `harness/apps/cli/src/index.ts`, `infra/batteries/atlas/src/vault.ts`,
`harness/packages/improver/src/index.ts`. Status: wired; the Build stage is a dry run unless
`OPENROUTER_API_KEY` resolves.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
sequenceDiagram
  autonumber
  actor Op as operator
  participant CLI as 3pt cli
  participant K as macOS Keychain
  participant V as Atlas vault 3pt.secrets
  participant ST as Store
  participant P as Plan
  participant B as Build
  participant I as Instrument
  participant IM as improver
  participant G as git
  Op->>CLI: 3pt loop [--git]
  CLI->>K: keychainEnv(): ATLAS_* parts, THREEPT_MASTER_KEY
  CLI->>V: vaultRead(): decrypt OPENROUTER, VOYAGE, LANGSMITH, GITHUB
  Note over CLI: loadKeys() = vault ← keychain ← host env · readSecrets() → ctx.secrets
  CLI->>ST: atlasUri(keys) ? atlasStore() : fileStore(.3pt/store)
  CLI->>ST: latest(policies) vs harness/policies/v<n>.json vs seedPolicy()
  CLI->>ST: latest(checkpoints) → iteration = max(store, cp-<i>.md) + 1
  Note over CLI,ST: ctx = { freezePolicy(policy), stageStore(store), secrets, harness }
  CLI->>P: run(ctx)
  P->>ST: latest(checkpoints), find(measurements, findings @ i-1)
  P->>ST: insert(plans) { mode, spec, evaluation, basedOn }
  CLI->>B: run(ctx)
  B->>ST: latest(plans)
  alt OPENROUTER_API_KEY present
    B->>B: createHarness(harnessOptions(policy, build)).invoke(spec)
  else no key
    B->>B: dry run
  end
  B->>ST: insert(measurements) M-ERR-build
  CLI->>I: run(ctx)
  I->>ST: find(demo_outcomes, demo_activity, demo_photos) over 3 iterations
  I->>ST: insert(measurements) one per check · insert(findings) per mode
  CLI->>IM: improve(store, iteration, policy, gitSha)
  IM->>ST: find(findings @ i) → rewritePolicy()
  IM->>ST: insert(policies) v n+1 · insert(checkpoints) cp/i
  CLI->>CLI: write harness/policies/v<n+1>.json, harness/checkpoints/cp-<i>.md
  opt --git
    CLI->>G: commit those two files · tag cp/i
  end
```

`3pt plan`, `3pt build`, `3pt instrument` run one stage under the same context. `3pt improve` runs the
improver alone. `3pt rollback cp/<i>` reads the policy at the tag, or the file, and inserts it as a new
version, code untouched. `3pt replay [dir]` runs the same loop body over a memory store, one iteration per
month of demo data, and never opens Atlas or git.

## 5. The sprint selector

*How Plan picks the mode for an iteration. Pure: `selectMode()`.*
Derived from `harness/packages/plan/src/index.ts`. `IMPROVE_EVERY = 4`. Status: wired.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart TB
  S([iteration i]):::plan --> Q1{{"a checkpoint exists?"}}:::plan
  Q1 -->|no| F1([feature]):::plan
  Q1 -->|yes| Q2{{"sum of M-ERR* at i-1 > 0?"}}:::plan
  Q2 -->|yes| X1([fix]):::build
  Q2 -->|no| Q3{{"an effect: finding failed at i-1?"}}:::plan
  Q3 -->|yes| X2([fix]):::build
  Q3 -->|no| Q4{{"grants > 0 and i mod 4 = 0?"}}:::plan
  Q4 -->|yes| M1([improvement]):::inst
  Q4 -->|no| F2([feature]):::plan
  classDef plan fill:#241f3d,stroke:#8b7cf6,color:#e6e9ee
  classDef build fill:#3a2c12,stroke:#e0a33a,color:#e6e9ee
  classDef inst fill:#12342a,stroke:#3fb886,color:#e6e9ee
```

"Grants" counts Build grants that match `field. tool. flag. screen. context.`, the prefixes a finding can
answer with. The plan's `evaluation` line is one sentence per mode; it is what Instrument will check.

## 6. Checks by mode

*What Instrument writes under each mode, for every check in `PROJECT_CHECKS`. Pure: `runChecks()`.*
Derived from `harness/packages/instrument/src/index.ts`. `WINDOW 3` · `MIN_AGE 6` · `COOLDOWN 12`
(demo settings, `docs/10` §4.2). Status: wired.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart TB
  W["window: demo_outcomes, demo_activity, demo_photos\niterations i-2 .. i"]:::atlas --> C
  C["for each check: n = pick(rows) · granted = grant in policy"]:::inst
  C --> M[("measurements\none row per check, source atlas")]:::atlas
  C --> F{{"plan.mode"}}:::inst
  F -->|"feature, not granted"| A["finding { check, passed: n < bar, answer: grant }\nno answer while a revoke is under 12 iterations old"]:::inst
  F -->|"improvement, granted, age ≥ 6"| E["finding effect:check\npassed = n < value at grant"]:::inst
  F -->|"fix, granted, effect failed at i-1"| X{{"n < value at grant?"}}:::inst
  X -->|"yes: last month was noise"| K["finding fix:check passed\nkeep the grant"]:::inst
  X -->|"no"| R["finding fix:check failed\nrevoke: grant · names the projects it is still on"]:::build
  A & E & K & R --> FD[("findings")]:::atlas
  H["history(): last grant per check and its value then,\nlast revoke, effects that failed at i-1"]:::inst -.-> C
  FD -.-> H
  M -.-> H
  classDef build fill:#3a2c12,stroke:#e0a33a,color:#e6e9ee
  classDef inst fill:#12342a,stroke:#3fb886,color:#e6e9ee
  classDef atlas fill:#12303d,stroke:#3aa6d9,color:#e6e9ee
```

Instrument never touches the policy. A finding carries at most one instruction for the improver:
`answer` (grant this) or `revoke` (remove this). A check with `needs` runs only once its prerequisite grant
is in place.

## 7. Ten checks, ten grants

*Everything the loop can learn on the demo firm. Each check has one bar, one metric, one answering grant.*
Derived from `PROJECT_CHECKS` in `harness/packages/instrument/src/index.ts`. Bar is 3 events or 3 hours of
hand work in the window, except `hazard-photos` at 1. Status: wired; `3pt replay` finds 10 of 10, holds 9.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph CK["checks · Instrument · metric M-P-*"]
    direction TB
    C1["search-miss"]:::inst
    C2["wall-evidence"]:::inst
    C3["water-late"]:::inst
    C4["manual-pack"]:::inst
    C5["wall-search"]:::inst
    C6["slow-answers\nneeds field.unit_level_trade"]:::inst
    C7["repeat-questions"]:::inst
    C8["closeout-by-hand"]:::inst
    C9["duplicate-photos"]:::inst
    C10["hazard-photos · bar 1"]:::inst
  end
  subgraph GR["grants · Policy.toolGrants.build"]
    direction TB
    G1["field.unit_level_trade"]:::build
    G2["tool.open_wall_gap"]:::build
    G3["flag.issue_on_arrival"]:::build
    G4["tool.owner_pack"]:::build
    G5["field.wall_state"]:::build
    G6["context.photos_per_question_20"]:::build
    G7["screen.by_role"]:::build
    G8["tool.closeout_set"]:::build
    G9["tool.drop_bursts"]:::build
    G10["flag.hazard"]:::build
  end
  C1 --> G1
  C2 --> G2
  C3 --> G3
  C4 --> G4
  C5 --> G5
  C6 --> G6
  C7 --> G7
  C8 --> G8
  C9 --> G9
  C10 --> G10
  G1 -.->|needs| C6
  classDef build fill:#3a2c12,stroke:#e0a33a,color:#e6e9ee
  classDef inst fill:#12342a,stroke:#3fb886,color:#e6e9ee
```

The grants are strings in a policy document. Nothing in the tree executes `tool.owner_pack`; what a grant
does today is change the next policy's `toolGrants.build`, which the Strands compile (§11) turns into
`builtinTools` and the stage's instructions.

## 8. The backfeed

*How the findings of one iteration become the next policy version and its checkpoint. Pure: `rewritePolicy()`;
then two inserts.* <!-- @s1.02 -->
Derived from `harness/packages/improver/src/index.ts`. Status: wired.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  FD[("findings @ i")]:::atlas --> FAIL["failed = passed: false"]:::inst
  PREV["policy v n\nrules · toolGrants · contextPolicy"]:::data --> RW
  FAIL --> RW["rewritePolicy(prev, failed, cp/i)"]:::inst
  RW --> L["learned rules\n'Learned at cp/i (check): note'\nonce per check, always for a revoke"]:::inst
  RW --> GA["grants: each answer not already held"]:::build
  RW --> RV["revoked: each revoke that is held"]:::build
  L & GA & RV --> NEXT["policy v n+1\nrules + learned\ntoolGrants.build − revoked + grants\nprovenance { checkpoint: cp/i, reason }"]:::flag
  NEXT ==> POL[("policies")]:::atlas
  NEXT --> CP["checkpoint cp/i\ngitSha · policyVersion n+1\nmetrics { findings, failed } · retrospective"]:::inst
  CP ==> CPS[("checkpoints")]:::atlas
  NEXT -.-> FILE["harness/policies/v<n+1>.json\nharness/checkpoints/cp-<i>.md"]:::data
  classDef build fill:#3a2c12,stroke:#e0a33a,color:#e6e9ee
  classDef inst fill:#12342a,stroke:#3fb886,color:#e6e9ee
  classDef atlas fill:#12303d,stroke:#3aa6d9,color:#e6e9ee
  classDef data fill:#1a2029,stroke:#6b7684,color:#a3adbb
  classDef flag fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

With no failed checks the version still bumps, reason "no failed checks; version bump for lineage".
That is what v1 and v2 on disk are: the Atlas Sandbox has no `demo_*` rows in the window the two live
loops ran over, so every check passed.

## 9. Atlas

*Every collection in `COLLECTIONS`, who writes it, who reads it. Cylinders are collections; the two grey ones
are outside `COLLECTIONS`.* <!-- @s1.14 -->
Derived from `harness/packages/core/src/index.ts`, `infra/batteries/atlas/src/*.ts`, the stage packages,
`harness/apps/api/src/app.ts`. Solid edges write; dashed edges read. Status: provisioned and seeded on
`Cluster0`; the media collections are empty.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph W["writers"]
    direction TB
    IMP["improver"]:::inst
    PL["plan"]:::plan
    BU["build"]:::build
    IN["instrument"]:::inst
    WK["worker tick()"]:::build
    SEED["seed-demo"]:::battery
    APP["api app.ts"]:::surface
    VLT["vault.ts"]:::battery
  end
  subgraph LO["loop-owned · LOOP_OWNED"]
    direction TB
    POL[("policies\nversion unique")]:::atlas
    CPS[("checkpoints\niteration, tag unique")]:::atlas
  end
  subgraph SO["stage output"]
    direction TB
    PLN[("plans")]:::atlas
    MEA[("measurements\niteration, metric")]:::atlas
    FND[("findings\niteration, check")]:::atlas
  end
  subgraph MD["media · empty today"]
    direction TB
    MI[("media_index\nassetId unique · tier, lastRead")]:::atlas
    TR[("transcripts\nassetId unique · transcripts_vec 1024d cosine")]:::atlas
    JB[("jobs\nstatus, createdAt")]:::atlas
  end
  subgraph DM["demo firm"]
    direction TB
    DP[("demo_projects")]:::atlas
    DPH[("demo_photos")]:::atlas
    DA[("demo_activity")]:::atlas
    DO[("demo_outcomes")]:::atlas
    HV[("harness_versions")]:::atlas
  end
  subgraph AL["app loop"]
    direction TB
    AS[("app_state\nts")]:::atlas
    AE[("app_events")]:::atlas
  end
  subgraph KY["keys"]
    direction TB
    SC[("secrets\nname unique · value BinData")]:::atlas
    KV[("encryption.__keyVault\nthe DEK, wrapped")]:::data
    SS[("strands_storage\nwritten, never created")]:::data
  end
  IMP ==> POL & CPS
  PL --> PLN
  BU --> MEA
  IN --> MEA & FND
  WK --> JB
  SEED --> DP & DPH & DA & DO & HV
  APP --> AS & AE
  VLT --> SC & KV
  PL -.-> CPS & MEA & FND
  IN -.-> PLN & FND & MEA & DO & DA & DPH
  IMP -.-> FND & POL
  WK -.-> MI
  APP -.-> AS
  classDef plan fill:#241f3d,stroke:#8b7cf6,color:#e6e9ee
  classDef build fill:#3a2c12,stroke:#e0a33a,color:#e6e9ee
  classDef inst fill:#12342a,stroke:#3fb886,color:#e6e9ee
  classDef atlas fill:#12303d,stroke:#3aa6d9,color:#e6e9ee
  classDef surface fill:#232a33,stroke:#7d8a99,color:#e6e9ee
  classDef battery fill:#1f262f,stroke:#a3adbb,color:#e6e9ee
  classDef data fill:#1a2029,stroke:#6b7684,color:#a3adbb
```

`provision.ts` ensures every collection, the twelve indexes in `INDEXES`, and the vector index; it is
idempotent and prints the plan without a connection. The Store contract is three verbs, so no stage runs an
aggregation; the checks do their arithmetic in memory over a three-iteration window.

## 10. Keys

*Where each key lives and how it reaches a stage. No `.env` is read anywhere.*
Derived from `infra/batteries/atlas/src/{vault,keychain,index}.ts`, `harness/packages/core` (`readSecrets`),
`harness/apps/cli/src/index.ts`, `harness/apps/api/src/{index,keys}.ts`, `harness/apps/worker/src/{main,edge}.ts`,
`wrangler.jsonc`. Status: wired on the Mac; the Worker takes one secret and never sees the vault.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph SRC["sources"]
    direction TB
    KC["macOS Keychain\nATLAS_HOST ATLAS_DBUSER ATLAS_DBPASS ATLAS_DB ATLAS_CLUSTER\nTHREEPT_MASTER_KEY"]:::battery
    VL[("Atlas 3pt.secrets · CSFLE\nOPENROUTER_API_KEY VOYAGE_API_KEY\nLANGSMITH_API_KEY GITHUB_TOKEN")]:::atlas
    ENV["host env\nCI · the box · a shell"]:::data
  end
  KC -->|"master key wraps the DEK"| VL
  KC & ENV --> BASE["base = keychain ← env\nenv wins · blank and <placeholder> are unset"]:::battery
  BASE -->|"atlasUri(base)"| VL
  VL & BASE --> LK["loadKeys() = vault ← base"]:::flag
  LK --> URI["atlasUri(keys)\ncomposes and URL-encodes the string"]:::battery
  LK --> RS["readSecrets(keys) → Secrets\n{ openrouter, voyage, langsmith, github }"]:::battery
  subgraph CONS["consumers"]
    direction TB
    CLI["cli: store + ctx.secrets"]:::build
    APIN["api under node: persistTo(atlasStore)\n/keys page, loopback only, 3pt keys"]:::surface
    WKM["worker main.ts: atlasUri() from process.env only"]:::build
    WKE["worker edge.ts: ATLAS_URI as a Cloudflare secret\nmake worker-secret · no vault, no native binding"]:::build
  end
  URI --> CLI & APIN
  RS --> CLI
  ENV --> WKM
  KC -.->|"make worker-secret pipes atlasUri()"| WKE
  classDef build fill:#3a2c12,stroke:#e0a33a,color:#e6e9ee
  classDef atlas fill:#12303d,stroke:#3aa6d9,color:#e6e9ee
  classDef surface fill:#232a33,stroke:#7d8a99,color:#e6e9ee
  classDef battery fill:#1f262f,stroke:#a3adbb,color:#e6e9ee
  classDef data fill:#1a2029,stroke:#6b7684,color:#a3adbb
  classDef flag fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

The KMS provider is `local`: the master key is 96 random bytes in the Keychain, and the data key in
`encryption.__keyVault` is wrapped with it. Lose the Keychain entry and the stored values are unreadable.
The key page tests OpenRouter and GitHub keys with a live request; a POST must come from the page's own
origin on loopback.

## 11. Policy to Strands

*The compile step: what each field of a Policy becomes in the options handed to `createHarness()`.*
Derived from `harness/packages/strands/src/index.ts`, `harness/packages/build/src/index.ts`. Status: wired for
Build when a key resolves; Plan and Instrument routes are written, no caller. `AtlasStorage` and
`measurementPlugin` are written, not registered.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph POL["Policy v n"]
    direction TB
    R["rules[]"]:::data
    TG["toolGrants[stage]"]:::data
    CX["contextPolicy.maxTokensPerStage[stage]\nreadOnceTranscripts"]:::data
  end
  subgraph RT["DEFAULT_ROUTES[stage]"]
    direction TB
    RB["build: opus-5.5 → sonnet-5 · high · fallback · 2 switches"]:::build
    RP["plan: haiku-4.5 → sonnet-5 · low · classifier"]:::plan
    RI["instrument: sonnet-5 → haiku-4.5 · medium · fallback"]:::inst
  end
  R --> INS["instructions\n'You are the {stage} stage of 3PT, policy v n'\n- rule … · context line"]:::build
  TG --> GR["grants()\nbuiltinTools { '*': false, read }\n+ shell write edit subagent if repo.worktree or atlas.insert\n+ web_fetch for plan"]:::build
  TG --> IV["interventions\nbuild: smart · instrument: read-only with two paths · plan: read-only"]:::build
  RB & RP & RI --> MR["routerFor(): ModelRouter\nRoutingCandidate(OpenAIModel @ openrouter.ai, reasoning.effort)\nFallbackStrategy or ClassifierStrategy"]:::build
  FX["fixed: session 3pt-{stage} · memory ./.agent/memory\nskills ./infra/batteries ./.agent/skills\ncontextManager auto · plugins todos, environment"]:::data
  INS & GR & IV & MR & FX --> HO["harnessOptions(policy, stage, key)"]:::flag
  HO --> CH["createHarness(options)"]:::build
  PLN[("plans: latest")]:::atlas --> IVK["invoke(mode + spec + evaluation)\nlimits { turns 30, totalTokens }"]:::build
  CX --> IVK
  CH --> IVK
  IVK --> SR{{"stopReason = endTurn?"}}:::build
  SR --> MEA[("measurements M-ERR-build 0 or 1")]:::atlas
  KEY{{"ctx.secrets.openrouter?"}}:::flag -->|yes| CH
  KEY -->|no| DRY["dry run: mode, rule count, grant count"]:::data
  DRY --> MEA
  W1["AtlasStorage(kv) · six methods · no KV yet"]:::data
  W2["measurementPlugin(sink, stage)\nAfterModelCall AfterToolCall AfterInvocation → M-TURNS M-TOOLS M-STOP"]:::data
  classDef plan fill:#241f3d,stroke:#8b7cf6,color:#e6e9ee
  classDef build fill:#3a2c12,stroke:#e0a33a,color:#e6e9ee
  classDef inst fill:#12342a,stroke:#3fb886,color:#e6e9ee
  classDef atlas fill:#12303d,stroke:#3aa6d9,color:#e6e9ee
  classDef data fill:#1a2029,stroke:#6b7684,color:#a3adbb
  classDef flag fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

The Strands packages load by dynamic import inside `live()`, so the install loop and CI never need the key.
Every model call goes through OpenRouter with one key. The `docs/12` ledger rows L7 (Storage) and L9
(measurement hooks) are the two grey nodes: shaped, not plugged in.

## 12. The app loop

*The second loop, live on the Worker. Every screen is composed by the harness; every tap is evidence; the
harness ships its own change and undoes it when use says it was worse.* <!-- @s1.29 -->
Derived from `harness/apps/api/src/app.ts`, `ui/apps/web/src/{main,live,bulb}.ts`, `ui/packages/inspector-client/src/index.ts`.
The app at `/app/` is `ui/apps/web` since 2026-09-26 evening; `ui/apps/live` spoke the same endpoints and is no longer served.
`MIN_SIGNALS 4` · `DROP 20`. Status: wired; state in `app_state` and `app_events` when the Worker has Atlas.

**New photos and the media scan.** `POST /app/photos` files a photo with the uploader's tags (unit, trade, wall) and a
note. 3PT does not look inside the image: it reads the note for water and hazard words. Then `scan()` reads every photo
of every live job plus every upload and runs five checks: a word in 3 or more notes (becomes a tag and a search), water
with no `issue` field, a hazard with no hazards block for the safety manager, 3 or more units closed with no pipe photo,
and bursts of 3 or more shots. The first finding that asks for a change ships as a version, and `guard()` can undo it.
The Worker's cron (`*/30 * * * *`) runs `POST /app/scan`, so slow patterns are found with nobody tapping. The app shows
the last scan on "How it learns". Taps from the app reach the loop as Worker blocks (`BLOCK_OF` in `ui/apps/web/src/data.ts`);
`plan()` ignores any id that is not in `BLOCKS`.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
sequenceDiagram
  autonumber
  actor U as super, PM, PE, owner
  participant L as app · ui/apps/web
  participant W as Worker · app.ts
  participant A as Atlas
  L->>W: GET /app/screen?project&role
  W->>A: latest(app_state)
  alt a snapshot exists
    W->>W: S = snapshot
  else none
    W->>W: seed() from sim-data.js versions · snapshot('seed')
  end
  W-->>L: firm, photos, blocks per role (needs, timesavers, beforeclose), harness { versions }
  U->>L: tap: use · hide · open · fb_up · fb_down · act
  L->>W: POST /app/events { role, action, block or q or photo }
  W->>A: insert(app_events)
  W->>W: guard(): current version by harness, ≥ 4 scored taps, ≤ parent − 20 points?
  alt worse than its parent
    W->>W: rolledBack, rejected[key], cur = parent
    W->>A: insert(app_state) snapshot
    W-->>L: { rolled_back: { version, to, why } }
  else keep, and plan(role)
    W->>W: use ≥ 3 → move to top · use ≥ 2 not shown → add · hide → remove · fb_down ≥ 3 on a query → add field
    W->>W: build(): version n+1 { by harness, parent, changes, why, layout, fields }
    W->>A: insert(app_state) snapshot
    W-->>L: { shipped: { version, changes, why } } or nothing
  end
  loop every 30 s, and at once after a ship
    L->>W: GET /app/news?since=v
    W-->>L: versions after v still live → the bulb
  end
  U->>L: Undo
  L->>W: POST /app/rollback { v }
```

A version's life, as the code keeps it:

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
stateDiagram-v2
  [*] --> proposed : plan(role) finds a signal with no rejected key
  proposed --> live : build() ships it at once, by harness, parent = current
  live --> scored : taps on this version accrue in app_events
  scored --> live : fewer than 4 signals, or within 20 points of the parent
  scored --> rolledBack : guard() · worse than the parent
  live --> rolledBack : a person taps Undo · POST /app/rollback
  rolledBack --> rejected : key remembered · plan() never offers it again
  rejected --> [*]
```

The Worker opens a fresh Store per request and drops its cached state, so every instance shows the same
harness version. Without Atlas, state is per instance and says so in `x-3pt-store`.

## 13. The media path

*The left side of the triangle, as far as it is built: an index, a tiering rule, a queue, and a worker that
fills it. Nothing drains it yet.* <!-- @s1.07 --> <!-- @s1.13 -->
Derived from `harness/packages/media/src/index.ts`, `harness/apps/worker/src/{index,main}.ts`,
`infra/batteries/blob/src/index.ts`, `infra/batteries/atlas/src/index.ts`, `scripts/build-web-site.sh`.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph TODAY["photos reach a screen today · static"]
    direction LR
    POOL["data/mock/media-pool/<trade>/*.jpg\nlicensed, credits.json"]:::data --> PAGES["3pt-web.pages.dev/media-pool/*"]:::surface
    WKR["Worker /media-pool/* → 302"]:::build --> PAGES
    NODE["node api serves the folder, jpg only"]:::surface
  end
  subgraph LEFT["the index path · written, empty"]
    direction LR
    MI[("media_index\nMediaAsset: tier, location, transcriptId, lastRead")]:::atlas
    MI -.->|"find all"| TICK["worker tick()\nnode: once or --watch 60 s\nbox: systemd unit 3pt-worker"]:::build
    TICK --> JF{{"jobFor(asset)"}}:::build
    JF -->|"no transcriptId"| J1["job transcribe"]:::build
    JF -->|"chooseTier() ≠ tier · hot if read in 7 days"| J2["job tier"]:::build
    J1 & J2 --> JB[("jobs · queued")]:::atlas
    JB -.-> NONE["no consumer for index, transcribe, tier, migrate"]:::flag
    TR[("transcripts\ntranscripts_vec 1024d, Voyage")]:::atlas -.-> NONE2["no writer · VOYAGE_API_KEY unused"]:::flag
    BLOB["battery-blob: backend() = BLOB_BACKEND or gridfs\nstub"]:::battery
  end
  classDef build fill:#3a2c12,stroke:#e0a33a,color:#e6e9ee
  classDef atlas fill:#12303d,stroke:#3aa6d9,color:#e6e9ee
  classDef surface fill:#232a33,stroke:#7d8a99,color:#e6e9ee
  classDef battery fill:#1f262f,stroke:#a3adbb,color:#e6e9ee
  classDef data fill:#1a2029,stroke:#6b7684,color:#a3adbb
  classDef flag fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

The read-once rule is enforced as a policy line (`readOnceTranscripts: true`) and a predicate
(`needsTranscript`), not yet as a transcriber. The Worker's `scheduled` handler is not wired; `edge.ts`
exports `fetch` only.

## 14. Data

*The demo firm and its three consumers. What is real and what is authored is in `data/mock/README.md`.*
Derived from `data/mock/`, `hub/site/sim-data.js`, `harness/apps/cli/src/replay.ts`,
`infra/batteries/atlas/src/seed-demo.ts`, `harness/apps/api/src/sim.ts`.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph SRC["data/mock"]
    direction TB
    NYC["sources/nyc-dob-nb-filings.json\nreal buildings, NYC Open Data"]:::data
    ACME["acme-builders/\nfirm.json · index.json\nprojects/<id>/ project.json, media/<week>.jsonl, activity.jsonl, outcomes.jsonl\nexpected/harness-versions.json"]:::data
    POOL["media-pool/<trade>/*.jpg"]:::data
  end
  SIM["hub/site/sim-data.js\nglobalThis.SIM · fixed seed 20260926\n20 projects, at most 4 live, versions with a cap"]:::data
  NYC --> SIM
  SIM -->|"scripts/replay-data.mjs"| ACME
  ACME -->|"3pt replay · memory store · one iteration per month · compare with expected/"| RP["Plan → Build → Instrument → improve"]:::inst
  ACME -->|"seed-demo · idempotent"| AT[("Atlas demo_* · harness_versions")]:::atlas
  AT -.-> IN["instrument on the live loop"]:::inst
  SIM -->|"firm(q)"| API["api /sim/* and app.ts seed()"]:::surface
  SIM --> HUBS["hub Simulator leaf"]:::surface
  POOL --> WEBS["3pt-web.pages.dev/media-pool"]:::surface
  classDef inst fill:#12342a,stroke:#3fb886,color:#e6e9ee
  classDef atlas fill:#12303d,stroke:#3aa6d9,color:#e6e9ee
  classDef surface fill:#232a33,stroke:#7d8a99,color:#e6e9ee
  classDef data fill:#1a2029,stroke:#6b7684,color:#a3adbb
```

One model, three doors: the browser Simulator, the API's `/sim/*` and the app seed, and the files the loop
replays. The Worker bundle imports `sim-data.js` and `media-pool.js` as globals so it never reads a file.

## 15. What runs where

*Deployment as live at the time of writing. Grey edges are the local machine.*
Derived from `infra/targets.json`, `hub/site/nav.js` `PUBLISHED`, `harness/apps/worker/wrangler.jsonc`,
`scripts/build-web-site.sh`, `scripts/install-loop.sh`, `docs/17-atlas-setup-dossier.md` §7.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  BR(["browser"]):::surface
  subgraph CF["Cloudflare"]
    direction TB
    HUB["Pages 3pt · 3pt.pages.dev · gated\nAccess app + one-time PIN · Basic auth beside it\nfunctions/_middleware.js fails closed\nfrom hub/_site = site + docs + README + brainstorming"]:::surface
    WEBP["Pages 3pt-web · 3pt-web.pages.dev · ungated\n/ landing · /app/ web · /results/ · /studio/ → /app/ · /media-pool/\nbuilt by scripts/build-web-site.sh, deployed by hand"]:::surface
    WRK["Worker 3pt-harness\nedge.ts → @3pt/api handle()\nvars PAGES_ORIGIN, ATLAS_DB · secret ATLAS_URI\nper-request Store, 3 s timeout, 5 min memory fallback"]:::build
  end
  ATL[("Atlas Sandbox · Cluster0 · M10 · AWS us-west-1\ndb 3pt · access list 0.0.0.0/0 for the Worker")]:::atlas
  subgraph LOCAL["the Mac"]
    direction TB
    CLI["3pt cli · loop, replay, keys"]:::build
    APIN["node api :8787\n/app/* /sim/* /health /keys /media-pool"]:::surface
    MAC["3PT.app · /Applications\ninstall loop: merge, build, ditto"]:::surface
    PWA["pwa · dev server only"]:::surface
    BOX["box VM · Colima + Ansible\n3pt-worker unit · stopped today"]:::battery
  end
  BR --> HUB
  BR --> WEBP
  WEBP -->|"fetch, VITE_THREEPT_API_URL"| WRK
  WRK -->|"/media-pool/* 302"| WEBP
  WRK ==> ATL
  CLI ==> ATL
  APIN ==> ATL
  MAC -.->|"THREEPT_API_URL"| APIN
  PWA -.-> APIN
  BOX -.-> ATL
  classDef build fill:#3a2c12,stroke:#e0a33a,color:#e6e9ee
  classDef atlas fill:#12303d,stroke:#3aa6d9,color:#e6e9ee
  classDef surface fill:#232a33,stroke:#7d8a99,color:#e6e9ee
  classDef battery fill:#1f262f,stroke:#a3adbb,color:#e6e9ee
```

Two things the picture makes plain. The public demo (`/app/`) runs against the Worker and Atlas, not the
local API; the local API exists for the key page, the Swift app and development. And the Worker's `/health`
says `"store":"atlas"` only because `0.0.0.0/0` is on the access list, a row to delete after the hackathon.

## 16. CI, the herald, the hub pipeline

*What gates a push, what gates a PR, and how a document becomes a page.*
Derived from `.github/workflows/{ci,herald,deploy}.yml`, `hub/Makefile`, `hub/tools/*.mjs`, `scripts/prov.mjs`.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph CI["ci.yml · every push"]
    direction TB
    T1["targets resolve\nscripts/target.mjs"]:::inst --> T2["PR descriptions grade\nscripts/pr-validate.mjs"]:::inst --> T3["hub lints\nmake -C hub check"]:::inst --> T4["provenance\nprov.mjs --check"]:::inst --> T5["pnpm install\nturbo build + typecheck, macos excluded"]:::inst
  end
  subgraph HER["herald.yml · every PR"]
    direction TB
    H1["branch is lane/<slug>"]:::inst --> H2["commit prefixes allowed"]:::inst --> H3["PR body grades B or better"]:::inst
  end
  subgraph HUBP["hub pipeline · make -C hub check, deploy"]
    direction TB
    SRC["hub/site + docs/ + README + brainstorming.md"]:::data --> STG["tools/stage.sh → _site/"]:::data
    STG --> L1["check-nav: one Register, every slug carded"]:::inst
    STG --> L2["check-view: every anchor lands"]:::inst
    STG --> L3["check-diagram: every mermaid fence parses in diagram.js"]:::inst
    STG --> L4["tersity: word and figure budgets, advisory"]:::inst
    L1 --> DEP
    L2 --> DEP
    L3 --> DEP
    L4 --> DEP["deploy.yml → wrangler pages deploy\nwhen the two Cloudflare secrets exist"]:::surface
    DEP --> VIEW["view.html renders a document\ndiagram.js typesets its mermaid in the tokens"]:::surface
  end
  classDef inst fill:#12342a,stroke:#3fb886,color:#e6e9ee
  classDef surface fill:#232a33,stroke:#7d8a99,color:#e6e9ee
  classDef data fill:#1a2029,stroke:#6b7684,color:#a3adbb
```

The hub reads Mermaid with its own parser and a closed grammar (flowchart, sequence, state, class, git). Every
figure in this document is inside that grammar; `make -C hub check` proves it.

## 17. Lineage today, and the ledger

*Where the two checkpoints that exist actually live, then every component with its status.*
Derived from `harness/policies/`, `harness/checkpoints/`, `git status`, `git tag`.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph AT["Atlas · policies, checkpoints"]
    direction LR
    V0[("v0 seed")]:::atlas --> V1[("v1 · cp/1")]:::atlas --> V2[("v2 · cp/2\nno failed checks; version bump for lineage")]:::atlas
  end
  subgraph FS["working tree · git mirror"]
    direction LR
    F0["policies/v0.json · tracked"]:::data
    F1["policies/v1.json · checkpoints/cp-1.md · untracked"]:::flag
    F2["policies/v2.json · checkpoints/cp-2.md · untracked"]:::flag
  end
  subgraph GT["git tags"]
    direction LR
    NT["no cp/* tag · --git never passed"]:::flag
  end
  V1 -.-> F1
  V2 -.-> F2
  F1 -.-> NT
  F2 -.-> NT
  classDef atlas fill:#12303d,stroke:#3aa6d9,color:#e6e9ee
  classDef data fill:#1a2029,stroke:#6b7684,color:#a3adbb
  classDef flag fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

A checkpoint is meant to be a triple: the Atlas document, the two mirrored files, the git tag. Today the first
two exist for cp/1 and cp/2 and the third does not; `3pt rollback` still works from the files.

### The ledger

| Component | Status | Evidence |
|---|---|---|
| `@3pt/core` contract, `runIteration`, `freezePolicy`, `stageStore` | wired | `3pt loop`, `3pt replay` |
| Plan, Instrument, improver | wired | §5, §6, §8; replay finds 10 of 10 grants |
| Build, live path through Strands | wired when `OPENROUTER_API_KEY` resolves | `build/src/index.ts` `live()` |
| Build, dry run | wired | writes `M-ERR-build` |
| `@3pt/strands` Plan and Instrument routes | written | `DEFAULT_ROUTES`; only Build calls `harnessOptions` |
| `AtlasStorage`, `measurementPlugin` | written | no KV, no registration |
| Atlas battery: `atlasStore`, `provision`, `seed-demo`, vault, keychain | wired | `Cluster0` provisioned and seeded; `/health` says atlas |
| `sandbox.sh`, MCP wiring | written | needs `ATLAS_CLIENT_ID` and secret; service account not created |
| Repo battery: `headSha`, `showAt`, `snapshot` | wired | `--git`, `rollback` |
| Blob, tracing, artifacts batteries | stub | `battery.provides` only |
| Box battery | written | VM stopped; `3pt-worker` unit sources `.env` through bash |
| Media package, worker `tick()` | written | no assets in `media_index`, no job consumer |
| Worker `scheduled` | wired | cron `*/30 * * * *` runs the media scan (`POST /app/scan`) |
| API app loop | wired | live at the Worker, state in Atlas |
| API `/policies/latest`, `/checkpoints` | written | served from a memory store seeded with v0, not Atlas |
| API key page | wired | node only, loopback only |
| `live` app | written | builds; no longer served (the web app took `/app/`) |
| `web` app and capture suite | wired | `3pt-web.pages.dev/app/` (bulb, How it learns); Playwright captures |
| `pwa` | planned | builds; no deploy |
| `macos` | written | builds and installs; reads the local API |
| Hub, gate, Viewer, diagram reader | wired | `3pt.pages.dev` |
| CI build, herald | wired | `ci.yml`, `herald.yml` |
| Deploy of `web` and `harness` from Actions | planned | by hand with wrangler today |

### Where this differs from `docs/10`

- `docs/10` §4.1 has no `live`, `box` or `strands` node and no `worker → api` edge. §2 here is the built graph.
- `docs/10` §4.4 shows surfaces reading policies and checkpoints from the API. The built API answers those two
  routes from memory; only `/app/*` and `/health` touch Atlas. The Swift app therefore shows v0.
- `docs/10` §4.7 draws five iterations and a rollback with tags. §17 here shows two iterations, no tags.
- `docs/10` §4.3 lists batteries as if all provide tools. Three are stubs; the grants a policy carries are strings
  the Strands compile maps to `builtinTools`, not calls into a battery.
