# From three points to the tree: the architecture, disclosed rung by rung

*Nine Mermaid figures, one per rung. Rung 0 is the three points of the vision; rung 8 is the tree as built
on 2026-09-26. Each rung is the previous figure plus what that rung adds, and nothing is taken away.
The full, per-file map is `docs/20-system-map.md`; this document is the way in.*

**How to read the growth.** Three fiducials hold from rung to rung, so the eye can find what moved:

1. **Ids.** A node keeps its id and label from the rung it enters. `P`, `B`, `I` are the three points on every rung.
2. **Regions.** Subgraphs enter in a fixed order and never reorder: `PTS` the points, `STATE` what persists,
   `EDGE` what injects, `WORK` the workload, `MODEL` the models, `SURF` the surfaces, `MEDIA` the left side,
   `INFRA` what it runs on. A region may gain a longer title; it does not move.
3. **Colour.** Red (`flag`) marks what entered at this rung. On the next rung the same node wears its lane colour.
   Edges: solid = a call or import · dashed = a read through the Store · thick = the backfeed.

Each rung names the files it is drawn from. Status words are those of `docs/20` §0.

## Rung 0 · The three points

*One iteration is Plan, then Build, then Instrument, and what Instrument learns feeds the next Plan.*
From `docs/00-vision.md`. Everything else in this document is the machinery that makes the thick edge true.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph PTS["the three points"]
    direction LR
    P["Plan"]:::flag --> B["Build"]:::flag --> I["Instrument"]:::flag
  end
  I ==>|"backfeed"| P
  classDef flag fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

## Rung 1 · The harness as data

*The backfeed is not an edge from Instrument to Plan. It passes through a document: the Policy. Stages read a
frozen copy; Instrument writes findings; a separate improver rewrites the Policy. The loop and the run are apart.*
From `harness/packages/core/src/index.ts` (`Policy`, `Finding`, `freezePolicy`, `stageStore`),
`harness/packages/improver/src/index.ts`.

New: `POL` `FND` `IMP` and the region `STATE`. The rung 0 edge `I ==> P` becomes the path `I → FND → IMP ⇒ POL ⇢ P`.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph PTS["the three points · one run"]
    direction LR
    P["Plan"]:::plan --> B["Build"]:::build --> I["Instrument"]:::inst
  end
  subgraph STATE["state · a Store"]
    direction TB
    POL[("policies\nrules · contextPolicy · toolGrants")]:::flag
    FND[("findings\ncheck · passed · answer · revoke")]:::flag
  end
  IMP["improver\nrewritePolicy()"]:::flag
  POL -.->|"frozen copy"| P & B & I
  I --> FND
  FND -.-> IMP
  IMP ==>|"v n+1"| POL
  classDef plan fill:#241f3d,stroke:#8b7cf6,color:#e6e9ee
  classDef build fill:#3a2c12,stroke:#e0a33a,color:#e6e9ee
  classDef inst fill:#12342a,stroke:#3fb886,color:#e6e9ee
  classDef flag fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

## Rung 2 · State in Atlas, mirrored in git

*The Store is MongoDB Atlas. Each stage writes its own collection; the improver alone writes the two loop-owned
ones, and pairs each policy with a checkpoint. The CLI mirrors both to files a tag can pin.*
From `COLLECTIONS` and `LOOP_OWNED` in core, `infra/batteries/atlas/src/{index,store,provision}.ts`,
`harness/apps/cli/src/index.ts` (`checkpoint()`, `rollback()`).

New: `PLN` `MEA` `CPS` in `STATE`, and `GIT`. Status: wired; cp/1 and cp/2 exist as files, no tag yet.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph PTS["the three points · one run"]
    direction LR
    P["Plan"]:::plan --> B["Build"]:::build --> I["Instrument"]:::inst
  end
  subgraph STATE["Atlas · Cluster0 · db 3pt"]
    direction TB
    POL[("policies")]:::atlas
    CPS[("checkpoints\ntag cp/i · gitSha · policyVersion")]:::flag
    PLN[("plans\nmode · spec · evaluation")]:::flag
    MEA[("measurements\nM-* per iteration")]:::flag
    FND[("findings")]:::atlas
  end
  IMP["improver"]:::inst
  GIT["git mirror\nharness/policies/v<n>.json\nharness/checkpoints/cp-<i>.md · tag cp/<i>"]:::flag
  POL -.-> P & B & I
  CPS -.-> P
  MEA -.-> P
  P --> PLN
  PLN -.-> B
  B --> MEA
  I --> MEA & FND
  FND -.-> IMP
  IMP ==> POL & CPS
  POL & CPS -.-> GIT
  classDef plan fill:#241f3d,stroke:#8b7cf6,color:#e6e9ee
  classDef build fill:#3a2c12,stroke:#e0a33a,color:#e6e9ee
  classDef inst fill:#12342a,stroke:#3fb886,color:#e6e9ee
  classDef atlas fill:#12303d,stroke:#3aa6d9,color:#e6e9ee
  classDef flag fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

## Rung 3 · The edge

*Nothing in the points reads the environment. A command at the edge resolves keys, opens the Store, freezes
the policy, guards the Store, and hands a context in. Keys come from the Keychain and an encrypted collection.*
From `harness/apps/cli/src/index.ts`, `infra/batteries/atlas/src/{vault,keychain}.ts`, `readSecrets` in core.

New: region `EDGE` with `CLI` `LK` `SEC`; `KC`; `SC` in `STATE`. Status: wired.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph PTS["the three points · one run"]
    direction LR
    P["Plan"]:::plan --> B["Build"]:::build --> I["Instrument"]:::inst
  end
  subgraph STATE["Atlas · Cluster0 · db 3pt"]
    direction TB
    POL[("policies")]:::atlas
    CPS[("checkpoints")]:::atlas
    PLN[("plans")]:::atlas
    MEA[("measurements")]:::atlas
    FND[("findings")]:::atlas
    SC[("secrets · CSFLE\nOPENROUTER VOYAGE LANGSMITH GITHUB")]:::flag
  end
  subgraph EDGE["the edge · 3pt cli"]
    direction TB
    CLI["3pt loop · plan build instrument · improve · rollback"]:::flag
    LK["loadKeys() = vault ← keychain ← env\natlasUri() · readSecrets()"]:::flag
    SEC["StageContext\nfreezePolicy(policy) · stageStore(store) · secrets"]:::flag
  end
  KC["macOS Keychain\nATLAS_* parts · THREEPT_MASTER_KEY"]:::flag
  IMP["improver"]:::inst
  GIT["git mirror"]:::data
  KC --> LK
  SC -.-> LK
  LK --> SEC
  CLI --> SEC
  SEC --> P & B & I
  CLI --> IMP
  POL -.-> P & B & I
  CPS & MEA -.-> P
  P --> PLN
  PLN -.-> B
  B --> MEA
  I --> MEA & FND
  FND -.-> IMP
  IMP ==> POL & CPS
  CLI -.-> GIT
  classDef plan fill:#241f3d,stroke:#8b7cf6,color:#e6e9ee
  classDef build fill:#3a2c12,stroke:#e0a33a,color:#e6e9ee
  classDef inst fill:#12342a,stroke:#3fb886,color:#e6e9ee
  classDef atlas fill:#12303d,stroke:#3aa6d9,color:#e6e9ee
  classDef data fill:#1a2029,stroke:#6b7684,color:#a3adbb
  classDef flag fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

## Rung 4 · The workload

*What the loop improves against. A demo firm's outcomes, activity and photos sit in Atlas; Plan picks a sprint
mode from the last checkpoint; Instrument runs ten checks over a three-iteration window, and a failed check
names the grant that answers it. Replay runs the whole loop over 92 months in memory.*
From `harness/packages/plan` (`selectMode`), `harness/packages/instrument` (`PROJECT_CHECKS`, `runChecks`),
`harness/apps/cli/src/replay.ts`, `infra/batteries/atlas/src/seed-demo.ts`, `data/mock/acme-builders/`.

New: region `WORK` with `ACME` `SEED` `RPL`; `DM` in `STATE`; `MODE` beside Plan; `CHK` beside Instrument. Status: wired.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph PTS["the three points · one run"]
    direction LR
    MODE["mode\nfeature · improvement every 4th · fix"]:::flag
    P["Plan"]:::plan --> B["Build"]:::build --> I["Instrument"]:::inst
    CHK["10 checks → 10 grants\nwindow 3 · judge after 6 · cooldown 12"]:::flag
    MODE --> P
    CHK --> I
  end
  subgraph STATE["Atlas · Cluster0 · db 3pt"]
    direction TB
    POL[("policies")]:::atlas
    CPS[("checkpoints")]:::atlas
    PLN[("plans")]:::atlas
    MEA[("measurements")]:::atlas
    FND[("findings")]:::atlas
    SC[("secrets")]:::atlas
    DM[("demo_projects · demo_photos\ndemo_activity · demo_outcomes\nharness_versions")]:::flag
  end
  subgraph EDGE["the edge · 3pt cli"]
    direction TB
    CLI["3pt loop"]:::build
    LK["loadKeys()"]:::battery
    SEC["StageContext"]:::build
  end
  subgraph WORK["the workload"]
    direction TB
    ACME["data/mock/acme-builders\n20 projects · 2019 → 2026"]:::flag
    SEED["seed-demo"]:::flag
    RPL["3pt replay\nmemory store · 92 months · compare with expected/"]:::flag
  end
  KC["macOS Keychain"]:::battery
  IMP["improver"]:::inst
  GIT["git mirror"]:::data
  ACME --> SEED --> DM
  ACME --> RPL
  RPL --> SEC
  DM -.->|"3-iteration window"| I
  KC --> LK
  SC -.-> LK
  LK --> SEC
  CLI --> SEC
  SEC --> P & B & I
  CLI --> IMP
  POL -.-> P & B & I
  CPS & MEA -.-> P
  P --> PLN
  PLN -.-> B
  B --> MEA
  I --> MEA & FND
  FND -.-> IMP
  IMP ==> POL & CPS
  CLI -.-> GIT
  classDef plan fill:#241f3d,stroke:#8b7cf6,color:#e6e9ee
  classDef build fill:#3a2c12,stroke:#e0a33a,color:#e6e9ee
  classDef inst fill:#12342a,stroke:#3fb886,color:#e6e9ee
  classDef atlas fill:#12303d,stroke:#3aa6d9,color:#e6e9ee
  classDef battery fill:#1f262f,stroke:#a3adbb,color:#e6e9ee
  classDef data fill:#1a2029,stroke:#6b7684,color:#a3adbb
  classDef flag fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

## Rung 5 · The models

*Build does not run the plan itself. It compiles the Policy into the options of a Strands harness: rules become
instructions, grants become tools and interventions, the token cap becomes a limit, and a router picks a model
through OpenRouter. Without the key it is a dry run, so the loop never needs a model to close.*
From `harness/packages/strands/src/index.ts`, `harness/packages/build/src/index.ts`.

New: region `MODEL` with `STR` `CH` `OR` `DRY`. Status: wired when `OPENROUTER_API_KEY` resolves; Plan and
Instrument routes written, no caller.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph PTS["the three points · one run"]
    direction LR
    MODE["mode"]:::plan
    P["Plan"]:::plan --> B["Build"]:::build --> I["Instrument"]:::inst
    CHK["10 checks → 10 grants"]:::inst
    MODE --> P
    CHK --> I
  end
  subgraph STATE["Atlas · Cluster0 · db 3pt"]
    direction TB
    POL[("policies")]:::atlas
    CPS[("checkpoints")]:::atlas
    PLN[("plans")]:::atlas
    MEA[("measurements")]:::atlas
    FND[("findings")]:::atlas
    SC[("secrets")]:::atlas
    DM[("demo_*")]:::atlas
  end
  subgraph EDGE["the edge · 3pt cli"]
    direction TB
    CLI["3pt loop"]:::build
    LK["loadKeys()"]:::battery
    SEC["StageContext"]:::build
  end
  subgraph WORK["the workload"]
    direction TB
    ACME["acme-builders"]:::data
    SEED["seed-demo"]:::battery
    RPL["3pt replay"]:::build
  end
  subgraph MODEL["the models · @3pt/strands"]
    direction TB
    STR["harnessOptions(policy, stage, key)\nrules → instructions · grants → builtinTools, interventions\ncontextPolicy → limits"]:::flag
    CH["createHarness() · invoke(plan)\nModelRouter: fallback or classifier"]:::flag
    OR["OpenRouter · one key\nopus-5.5 → sonnet-5 for build"]:::flag
    DRY["dry run\nno key: M-ERR-build 0"]:::flag
  end
  KC["macOS Keychain"]:::battery
  IMP["improver"]:::inst
  GIT["git mirror"]:::data
  B --> STR --> CH --> OR
  B --> DRY
  SEC -.->|"secrets.openrouter"| B
  ACME --> SEED --> DM
  ACME --> RPL
  RPL --> SEC
  DM -.-> I
  KC --> LK
  SC -.-> LK
  LK --> SEC
  CLI --> SEC
  SEC --> P & B & I
  CLI --> IMP
  POL -.-> P & B & I
  CPS & MEA -.-> P
  P --> PLN
  PLN -.-> B
  B --> MEA
  I --> MEA & FND
  FND -.-> IMP
  IMP ==> POL & CPS
  CLI -.-> GIT
  classDef plan fill:#241f3d,stroke:#8b7cf6,color:#e6e9ee
  classDef build fill:#3a2c12,stroke:#e0a33a,color:#e6e9ee
  classDef inst fill:#12342a,stroke:#3fb886,color:#e6e9ee
  classDef atlas fill:#12303d,stroke:#3aa6d9,color:#e6e9ee
  classDef battery fill:#1f262f,stroke:#a3adbb,color:#e6e9ee
  classDef data fill:#1a2029,stroke:#6b7684,color:#a3adbb
  classDef flag fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

## Rung 6 · The surfaces, and the second loop

*People reach the harness only over HTTP. The API composes every screen from the current harness version and
takes every tap back as an event; on the Worker it runs a second, self-approving loop that ships a layout or
field change and undoes it when use scores it worse. The surfaces are inspectors and one app.*
From `harness/apps/api/src/{handler,app}.ts`, `harness/apps/worker/src/edge.ts`, `ui/apps/{live,web,pwa,macos}`,
`ui/packages/{inspector-client,design-system}`.

New: region `SURF` with `API` `APPL` `WRK` `LIVE` `WEB` `PWA` `MAC` `IC` `DS`; `AS` in `STATE`. Status: wired;
`pwa` planned, `macos` local.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph PTS["the three points · one run"]
    direction LR
    MODE["mode"]:::plan
    P["Plan"]:::plan --> B["Build"]:::build --> I["Instrument"]:::inst
    CHK["10 checks → 10 grants"]:::inst
    MODE --> P
    CHK --> I
  end
  subgraph STATE["Atlas · Cluster0 · db 3pt"]
    direction TB
    POL[("policies")]:::atlas
    CPS[("checkpoints")]:::atlas
    PLN[("plans")]:::atlas
    MEA[("measurements")]:::atlas
    FND[("findings")]:::atlas
    SC[("secrets")]:::atlas
    DM[("demo_*")]:::atlas
    AS[("app_state · app_events\nversions · taps")]:::flag
  end
  subgraph EDGE["the edge · 3pt cli"]
    direction TB
    CLI["3pt loop"]:::build
    LK["loadKeys()"]:::battery
    SEC["StageContext"]:::build
  end
  subgraph WORK["the workload"]
    direction TB
    ACME["acme-builders"]:::data
    SEED["seed-demo"]:::battery
    RPL["3pt replay"]:::build
  end
  subgraph MODEL["the models · @3pt/strands"]
    direction TB
    STR["harnessOptions()"]:::build
    CH["createHarness()"]:::build
    OR["OpenRouter"]:::build
    DRY["dry run"]:::data
  end
  subgraph SURF["the surfaces · HTTP only"]
    direction TB
    API["@3pt/api · handle()\n/app/* /sim/* /health /keys"]:::flag
    APPL["app loop\nplan(role) → build(version) → guard(): undo if worse"]:::flag
    WRK["Worker edge.ts\nper-request Store · ATLAS_URI secret"]:::flag
    IC["inspector-client"]:::flag
    DS["design-system"]:::flag
    LIVE["live · the app"]:::flag
    WEB["web · studio, capture suite"]:::flag
    PWA["pwa · planned"]:::flag
    MAC["macos · Swift"]:::flag
  end
  KC["macOS Keychain"]:::battery
  IMP["improver"]:::inst
  GIT["git mirror"]:::data
  API --> APPL
  WRK --> API
  APPL ==> AS
  AS -.-> APPL
  LIVE & WEB & PWA --> IC & DS
  IC -->|"fetch"| WRK
  MAC -->|"fetch"| API
  ACME -.->|"sim-data.js: seed()"| APPL
  B --> STR --> CH --> OR
  B --> DRY
  SEC -.-> B
  ACME --> SEED --> DM
  ACME --> RPL
  RPL --> SEC
  DM -.-> I
  KC --> LK
  SC -.-> LK
  LK --> SEC
  CLI --> SEC
  SEC --> P & B & I
  CLI --> IMP
  POL -.-> P & B & I
  CPS & MEA -.-> P
  P --> PLN
  PLN -.-> B
  B --> MEA
  I --> MEA & FND
  FND -.-> IMP
  IMP ==> POL & CPS
  CLI -.-> GIT
  classDef plan fill:#241f3d,stroke:#8b7cf6,color:#e6e9ee
  classDef build fill:#3a2c12,stroke:#e0a33a,color:#e6e9ee
  classDef inst fill:#12342a,stroke:#3fb886,color:#e6e9ee
  classDef atlas fill:#12303d,stroke:#3aa6d9,color:#e6e9ee
  classDef battery fill:#1f262f,stroke:#a3adbb,color:#e6e9ee
  classDef data fill:#1a2029,stroke:#6b7684,color:#a3adbb
  classDef flag fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

## Rung 7 · The left side of the triangle

*The media the harness will one day read once and index. An asset record, a tiering rule, a queue, and a worker
tick that fills it. Written and provisioned; no asset is indexed and nothing drains the queue.*
From `harness/packages/media/src/index.ts`, `harness/apps/worker/src/{index,main}.ts`, `infra/batteries/blob`.

New: region `MEDIA` with `TICK` `JF` `BLOB`; `MI` `JB` `TR` in `STATE`. Status: written.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph PTS["the three points · one run"]
    direction LR
    MODE["mode"]:::plan
    P["Plan"]:::plan --> B["Build"]:::build --> I["Instrument"]:::inst
    CHK["10 checks → 10 grants"]:::inst
    MODE --> P
    CHK --> I
  end
  subgraph STATE["Atlas · Cluster0 · db 3pt"]
    direction TB
    POL[("policies")]:::atlas
    CPS[("checkpoints")]:::atlas
    PLN[("plans")]:::atlas
    MEA[("measurements")]:::atlas
    FND[("findings")]:::atlas
    SC[("secrets")]:::atlas
    DM[("demo_*")]:::atlas
    AS[("app_state · app_events")]:::atlas
    MI[("media_index\ntier · location · transcriptId")]:::flag
    JB[("jobs\ntranscribe · tier")]:::flag
    TR[("transcripts\ntranscripts_vec 1024d")]:::flag
  end
  subgraph EDGE["the edge · 3pt cli"]
    direction TB
    CLI["3pt loop"]:::build
    LK["loadKeys()"]:::battery
    SEC["StageContext"]:::build
  end
  subgraph WORK["the workload"]
    direction TB
    ACME["acme-builders"]:::data
    SEED["seed-demo"]:::battery
    RPL["3pt replay"]:::build
  end
  subgraph MODEL["the models · @3pt/strands"]
    direction TB
    STR["harnessOptions()"]:::build
    CH["createHarness()"]:::build
    OR["OpenRouter"]:::build
    DRY["dry run"]:::data
  end
  subgraph SURF["the surfaces · HTTP only"]
    direction TB
    API["@3pt/api"]:::surface
    APPL["app loop"]:::surface
    WRK["Worker edge.ts"]:::build
    IC["inspector-client"]:::surface
    DS["design-system"]:::surface
    LIVE["live"]:::surface
    WEB["web"]:::surface
    PWA["pwa"]:::surface
    MAC["macos"]:::surface
  end
  subgraph MEDIA["the left side · @3pt/media"]
    direction TB
    TICK["worker tick()\nnode once or --watch"]:::flag
    JF["jobFor(asset)\nno transcript → transcribe · chooseTier() 7 days → tier"]:::flag
    BLOB["battery-blob · gridfs r2 fs · stub"]:::flag
  end
  KC["macOS Keychain"]:::battery
  IMP["improver"]:::inst
  GIT["git mirror"]:::data
  MI -.-> TICK --> JF --> JB
  TR -.->|"no reader yet"| B
  BLOB -.-> MI
  API --> APPL
  WRK --> API
  APPL ==> AS
  AS -.-> APPL
  LIVE & WEB & PWA --> IC & DS
  IC --> WRK
  MAC --> API
  ACME -.-> APPL
  B --> STR --> CH --> OR
  B --> DRY
  SEC -.-> B
  ACME --> SEED --> DM
  ACME --> RPL
  RPL --> SEC
  DM -.-> I
  KC --> LK
  SC -.-> LK
  LK --> SEC
  CLI --> SEC
  SEC --> P & B & I
  CLI --> IMP
  POL -.-> P & B & I
  CPS & MEA -.-> P
  P --> PLN
  PLN -.-> B
  B --> MEA
  I --> MEA & FND
  FND -.-> IMP
  IMP ==> POL & CPS
  CLI -.-> GIT
  classDef plan fill:#241f3d,stroke:#8b7cf6,color:#e6e9ee
  classDef build fill:#3a2c12,stroke:#e0a33a,color:#e6e9ee
  classDef inst fill:#12342a,stroke:#3fb886,color:#e6e9ee
  classDef atlas fill:#12303d,stroke:#3aa6d9,color:#e6e9ee
  classDef surface fill:#232a33,stroke:#7d8a99,color:#e6e9ee
  classDef battery fill:#1f262f,stroke:#a3adbb,color:#e6e9ee
  classDef data fill:#1a2029,stroke:#6b7684,color:#a3adbb
  classDef flag fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

## Rung 8 · What it runs on

*The batteries that stand each thing up, and where each piece is deployed. This is the full tree; `docs/20`
§15 and §16 draw the deployment and the CI on their own.*
From `infra/batteries/*`, `infra/targets.json`, `.github/workflows/*.yml`, `hub/`.

New: region `INFRA` with the six batteries, `CF` the two Pages projects, `HUB`, `CI`, `BOX`. Status: atlas and
repo wired; blob, tracing, artifacts stub; box written and stopped; Pages and Worker live.

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#0f1216","primaryColor":"#1a2029","primaryTextColor":"#e6e9ee","primaryBorderColor":"#3a4552","lineColor":"#a3adbb","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"12px"}}}%%
flowchart LR
  subgraph PTS["the three points · one run"]
    direction LR
    MODE["mode"]:::plan
    P["Plan"]:::plan --> B["Build"]:::build --> I["Instrument"]:::inst
    CHK["10 checks → 10 grants"]:::inst
    MODE --> P
    CHK --> I
  end
  subgraph STATE["Atlas · Cluster0 · M10 · AWS us-west-1"]
    direction TB
    POL[("policies")]:::atlas
    CPS[("checkpoints")]:::atlas
    PLN[("plans")]:::atlas
    MEA[("measurements")]:::atlas
    FND[("findings")]:::atlas
    SC[("secrets")]:::atlas
    DM[("demo_*")]:::atlas
    AS[("app_state · app_events")]:::atlas
    MI[("media_index")]:::atlas
    JB[("jobs")]:::atlas
    TR[("transcripts")]:::atlas
  end
  subgraph EDGE["the edge · 3pt cli"]
    direction TB
    CLI["3pt loop"]:::build
    LK["loadKeys()"]:::battery
    SEC["StageContext"]:::build
  end
  subgraph WORK["the workload"]
    direction TB
    ACME["acme-builders"]:::data
    SEED["seed-demo"]:::battery
    RPL["3pt replay"]:::build
  end
  subgraph MODEL["the models · @3pt/strands"]
    direction TB
    STR["harnessOptions()"]:::build
    CH["createHarness()"]:::build
    OR["OpenRouter"]:::build
    DRY["dry run"]:::data
  end
  subgraph SURF["the surfaces · HTTP only"]
    direction TB
    API["@3pt/api"]:::surface
    APPL["app loop"]:::surface
    WRK["Worker edge.ts"]:::build
    IC["inspector-client"]:::surface
    DS["design-system"]:::surface
    LIVE["live"]:::surface
    WEB["web"]:::surface
    PWA["pwa"]:::surface
    MAC["macos"]:::surface
  end
  subgraph MEDIA["the left side · @3pt/media"]
    direction TB
    TICK["worker tick()"]:::build
    JF["jobFor(asset)"]:::build
    BLOB["battery-blob · stub"]:::battery
  end
  subgraph INFRA["what it runs on"]
    direction TB
    BA["battery-atlas\nstore · provision · vault · keychain · sandbox.sh"]:::flag
    BR["battery-repo\nheadSha · showAt · snapshot"]:::flag
    BT["battery-tracing · stub"]:::flag
    BF["battery-artifacts · stub"]:::flag
    BX["battery-box\nColima + Ansible · stopped"]:::flag
    CF["Cloudflare\nPages 3pt-web: / /app/ /studio/ /media-pool/\nWorker 3pt-harness"]:::flag
    HUB["Pages 3pt · the hub · gated\nAccess + PIN · site + docs"]:::flag
    CI["GitHub Actions\nci.yml · herald.yml · deploy.yml"]:::flag
  end
  KC["macOS Keychain"]:::battery
  IMP["improver"]:::inst
  GIT["git mirror"]:::data
  BA --> LK
  BA --> SEED
  BA -.->|"provision"| STATE
  BR --> GIT
  BX -.-> TICK
  CF --> WRK & LIVE & WEB
  HUB -.-> CI
  CI -.-> HUB
  MI -.-> TICK --> JF --> JB
  BLOB -.-> MI
  API --> APPL
  WRK --> API
  APPL ==> AS
  AS -.-> APPL
  LIVE & WEB & PWA --> IC & DS
  IC --> WRK
  MAC --> API
  ACME -.-> APPL
  B --> STR --> CH --> OR
  B --> DRY
  SEC -.-> B
  ACME --> SEED --> DM
  ACME --> RPL
  RPL --> SEC
  DM -.-> I
  KC --> LK
  SC -.-> LK
  LK --> SEC
  CLI --> SEC
  SEC --> P & B & I
  CLI --> IMP
  POL -.-> P & B & I
  CPS & MEA -.-> P
  P --> PLN
  PLN -.-> B
  B --> MEA
  I --> MEA & FND
  FND -.-> IMP
  IMP ==> POL & CPS
  CLI -.-> GIT
  classDef plan fill:#241f3d,stroke:#8b7cf6,color:#e6e9ee
  classDef build fill:#3a2c12,stroke:#e0a33a,color:#e6e9ee
  classDef inst fill:#12342a,stroke:#3fb886,color:#e6e9ee
  classDef atlas fill:#12303d,stroke:#3aa6d9,color:#e6e9ee
  classDef surface fill:#232a33,stroke:#7d8a99,color:#e6e9ee
  classDef battery fill:#1f262f,stroke:#a3adbb,color:#e6e9ee
  classDef data fill:#1a2029,stroke:#6b7684,color:#a3adbb
  classDef flag fill:#3a1a12,stroke:#ff6b4a,color:#e6e9ee
```

## The rungs at a glance

| Rung | Region entered | Nodes entered | Status |
|---|---|---|---|
| 0 | `PTS` | P, B, I | the vision |
| 1 | `STATE` | POL, FND, IMP | wired |
| 2 | | CPS, PLN, MEA, GIT | wired; no tag yet |
| 3 | `EDGE` | CLI, LK, SEC, KC, SC | wired |
| 4 | `WORK` | MODE, CHK, DM, ACME, SEED, RPL | wired |
| 5 | `MODEL` | STR, CH, OR, DRY | wired with a key; dry otherwise |
| 6 | `SURF` | API, APPL, WRK, IC, DS, LIVE, WEB, PWA, MAC, AS | wired; pwa planned, macos local |
| 7 | `MEDIA` | TICK, JF, BLOB, MI, JB, TR | written |
| 8 | `INFRA` | BA, BR, BT, BF, BX, CF, HUB, CI | mixed; see `docs/20` §17 |

Forty-nine nodes and eight regions from three points. What the loop rewrites is still one document, `POL`,
and the thick edge into it is still the only thick edge.
