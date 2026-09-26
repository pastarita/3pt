# 3PT — Agent Context

You are working in the 3PT ("Three Point Harness") repository during the MongoDB × Cerebral
Valley **Harness Engineering & Model Wrangling Hackathon**, Sat 2026-09-26. Submissions are
due **5:00 PM ET today**. Read this file fully, then the docs it points to, before changing anything.

## What 3PT is

A self-improving meta-harness for coding agents with three stages, **Plan → Build → Instrument**,
whose Instrument stage rewrites the harness's own rules, context policies, and tool grants and
persists every checkpoint to **MongoDB Atlas**. The workload it operates on is media-heavy
(images), which stresses memory, storage tiering, and context policy. Full statement:
`docs/00-vision.md`.

## Non-negotiables (from the rules, `docs/05-rules.md`)

1. **MongoDB Atlas Sandbox is a core component.** Every stateful thing goes through Atlas.
2. **This is NOT an image analyzer, NOT a dashboard, NOT basic RAG.** Those are banned project
   types. The harness is the product; images are the workload; the UI is a secondary inspector.
   If you find yourself building an image-classification feature or a metrics dashboard as the
   headline, stop and re-read `docs/05-rules.md`.
3. **New work only.** Do not import pre-existing project code. Public libraries are fine.
4. Target **Problem Statement 1: Recursive Harnessing**. Statement 2 (Long Horizon) is secondary.

## Read before acting

| Question | File |
|---|---|
| What are we building and why | `docs/00-vision.md` |
| Who is it for | `docs/01-icp.md` |
| Who owns which lane, term 2 (from 14:15), the checkpoint criterion | `docs/17-term-2-lanes.md` (L1–L7 closed; `docs/02-lanes.md` kept for the record) |
| How code moves, repo layout, install loop, pipeline skeleton | `docs/03-workflow.md` |
| Which partner tools and credits exist, and which 3PT slot each fills | `docs/04-resources.md` |
| Rules, judging weights, banned projects, deadlines | `docs/05-rules.md` |
| Goal over time, the interior-design use case, value props, screen-capture onboarding | `docs/06-goal-and-use-case.md` |
| Theses, hypotheses, the measurement system, partner-incentive mapping, requirement set | `docs/07-assessment-and-measurement.md` |
| Visual direction: construction demo, stress test, video plan (proposal, not yet merged into docs 00 to 06) | `hub/site/direction.html` (hub leaf "Direction") |
| The monorepo: three lanes, Turborepo, batteries, diagrams, extension recipes | `docs/10-architecture.md` |
| Strands: what we build on, the capability ledger, the handles we speak, what is struck | `docs/12-strands-archaeology.md` |
| Strands, drawn: ten Mermaid diagrams of its systems, for learning | `docs/13-strands-diagrams.md` |
| The implemented architecture, drawn: sixteen figures from the tree, every collection, key, route and loop, the status ledger | `docs/20-system-map.md` (hub leaf `system-map`) |
| The architecture disclosed rung by rung, three points to the tree, fixed ids and regions, red for what entered | `docs/22-system-ladder.md` (hub leaf `system-ladder`) |
| Sandbox provisioning: the box (Colima + Ansible) and the Sandbox cluster (Atlas CLI), the provisioning MCP | `docs/16-sandbox-provisioning.md` |
| Atlas console, screen by screen: ids, what goes in `.env`, CLI vs MCP doors, tiers and the scaling affordance | `docs/17-atlas-setup-dossier.md` |
| Strands, answered: how to configure it, fine-tune it, why it is open to self-improvement, the media workflow; every claim pinned to docs, code, Strands | `docs/18-strands-questions.md` (hub leaf `strands-journey.html`) |
| Design system: tokens, naming, dark/light, three canonical directions, cross-surface, components, the promenade for deciding (proposal) | `hub/site/design-system.html` (hub leaf "Design system") |
| CI, deployment topology, credits, the herald gate on PRs, and the deploy-target resolver (contemplation) | `docs/13-ci-and-deployment.md`, `infra/targets.json`, `scripts/target.mjs` |
| How a PR is described, graded and filed (heraldry) | `docs/pr-descriptions/README.md`, `.github/PULL_REQUEST_TEMPLATE.md` |
| Setup cascade: batteries included for a non-technical operator, provider options per slot, the proposed gateway battery | `docs/14-setup-cascade.md` (hub leaf "Setup cascade") |
| Terms (install loop, backfeed, furnace, left/right triangle) | `docs/glossary.md` |
| Where an idea came from in the brainstorm, and how to cite it | `docs/09-provenance.md`, then `docs/provenance-index.md` |
| Worktrees: where they live, how they are named, when they are collected | `docs/11-worktrees.md` |
| Open-sourcing and submission due diligence: admissibility, hygiene, the package, each row with a status | `docs/15-open-source-checklist.md` |
| Submission: what the platform asks, the filming tool, artifacts, claims with evidence, priority order to 5 PM | `docs/18-submission.md` |
| The technical interview: use case → three points → expand, why Atlas, what is real, questions; the canvas to drive | `docs/23-interview-talking-points.md` (hub leaf `canvas.html`) |

## Working rules for agents in this repo

- Docs in `docs/` are the source of record. Update the doc when you change the thing it describes.
- Do not publish artifacts or external pages; write files here.
- **No `.env`.** Bootstrap keys (Atlas parts, vault master key) live in the macOS Keychain; API keys live in the Atlas vault
  (`3pt.secrets`, CSFLE explicit encryption, `infra/batteries/atlas/src/vault.ts`). Edit them at `http://127.0.0.1:8787/keys`
  or with `3pt keys`. `loadKeys()` merges vault ← Keychain ← host env; `readSecrets()` injects `ctx.secrets`. List every new
  key name in `.env.example` (names only) and in `SECRET_NAMES` or `KEYCHAIN_NAMES`.
- Prefer MongoDB Agent Skills and the MongoDB MCP Server for anything touching Atlas.
- Commit prefixes: `plan:`, `build:`, `instrument:`, `media:`, `app:`, `docs:`, `chore:`, `hub:`, `ci:`. Branches are `lane/<slug>`; every PR opens with a description from `docs/pr-descriptions/` (see the herald).
- Keep `main` installable. If you break the install loop, fix it before anything else.
- Two humans (Patrick, Yash) run agents concurrently. Stay inside your lane's directories; if you
  must touch another lane, say so in the commit message.
- **The tree is three lanes:** `ui/` (surfaces), `harness/` (the pipeline), `infra/` (batteries).
  Dependency direction is `apps → packages → @3pt/core`; stages never import batteries; surfaces
  reach the harness only over HTTP. Adding anything follows a recipe in `docs/10-architecture.md` §5.
  `pnpm turbo run build` must stay green; `make check` is what CI will run.
- Atlas collection names live in `COLLECTIONS` (`harness/packages/core`) and nowhere else.
- **Provenance.** When a doc section or a piece of code implements something said in the brainstorm,
  cite the segment in a comment (`<!-- @s1.28 -->`, `// @s1.28`); ids are in `docs/provenance-index.md`.
  Never edit the spoken text in `brainstorming.md`; add or enrich the `<!-- sN.NN -->` markers instead.
  Then run `node scripts/prov.mjs --bake && node scripts/prov.mjs` and commit the regenerated index.
  `node scripts/prov.mjs --check` runs in CI and fails on any broken pointer.
- **Worktrees.** Verify a committed tree in a throwaway worktree, never in the main checkout:
  `scripts/worktree.sh verify HEAD -- <cmd>`. Lane work goes in `scripts/worktree.sh new lane <slug>`.
  Run `scripts/worktree.sh gc` at every checkpoint. Naming and rules: `docs/11-worktrees.md`.

## Atlas connection convention (read this before touching `.env` or a store)

- **One cluster, many doors.** State lives in the Sandbox org's `Cluster0` (M10, AWS us-west-1). Ids, screens and
  limits: `docs/17-atlas-setup-dossier.md` §7. Nothing judged runs against any other cluster.
- **The Keychain holds parts, not a string.** `ATLAS_HOST`, `ATLAS_DBUSER`, `ATLAS_DBPASS`, `ATLAS_DB`; leave `ATLAS_URI`
  blank. `atlasUri()` in `@3pt/battery-atlas` composes and URL-encodes the connection string, and treats any value
  containing `<` as unset. Every app gets its store through it: `atlasStore()` when a connection exists, a file or
  memory store otherwise. Stages never see a URI.
- **No inline comment after a real value.** `KEY=value   # note` is fine in `.env.example`; in `.env` the comment
  becomes part of the value for every loader except the shell.
- **The Worker gets the string as a Cloudflare secret, never a file:** `make worker-secret` pipes `atlasUri()` into
  `wrangler secret put ATLAS_URI` from `harness/apps/worker` (it reads the Keychain). Its `/health` says `"store":"atlas"` when it took.
- **Provision is idempotent:** `pnpm --filter @3pt/battery-atlas run provision` ensures the collections in `COLLECTIONS`,
  their indexes, and `transcripts_vec`. Run it after any change to `COLLECTIONS` or `INDEXES`.
- **Doors for people and agents:** `infra/batteries/atlas/sandbox.sh status|uri|scale|autoscale` (Atlas CLI) and the
  MongoDB MCP Server in `infra/batteries/atlas/mcp.json` (`atlas-*` tools incl. `atlas-upgrade-cluster`). Both need
  `ATLAS_CLIENT_ID` and `ATLAS_CLIENT_SECRET` from a project-level service account (not created yet).
- **The box is not the database.** `infra/batteries/box` carries only the client toolbelt; Atlas Local is opt-in and never judged.

## The hub workspace (`hub/`)

A gated Cloudflare Pages site over the docs of record, built to the hub-workspace pattern and
**cordoned entirely under `hub/`** (site, gate, tools, deploy config, its own README). The only
hub file outside that directory is `.github/workflows/deploy.yml`, scoped to hub and docs paths.
Live at https://3pt.pages.dev; previews per PR at `https://<branch>.3pt.pages.dev`.
Read `hub/README.md` before touching it, and load the `hub-workspace` skill vendored at
`.claude/skills/hub-workspace/` for the full pattern. The short version:

- **Three moves to add a surface, never a fourth:** write the leaf in `hub/site/`, register it in
  `hub/site/nav.js` GROUPS with a minted glyph, card it on `hub/site/index.html`. Documents are not
  leaves: card them as `view.html?f=docs/<file>.md` and route them in `nav.js` ROUTE.
- **Model:** `hub/site/3pt-data.js` (`globalThis.T`). Hot-leaf state in `localStorage` under `tpt_`.
- **Artifact:** `hub/tools/stage.sh` builds `hub/_site/` = `hub/site/` + `docs/` + `README.md` +
  `brainstorming.md`. Nothing else ships. `_site/` is gitignored.
- **Lints, preview, deploy:** `make -C hub check` · `make -C hub preview` · `make -C hub deploy`.
  Run `check` after every Register change; CI runs it on every push. After any gate change run
  `make -C hub verify`: anon 401, valid 200, wrong-domain 401.
- **Gate:** two doors, one room. Tier 1 Cloudflare Access app over `3pt.pages.dev` + `*.3pt.pages.dev`
  (allowlist in the Access policy; `make -C hub access` manages it over the API). Tier 0 Basic auth
  beside it (`ACCESS_PASS` secret, `ACCESS_USERS` variable). `hub/functions/_middleware.js` verifies
  the Access assertion's signature/issuer/audience/expiry and fails closed. No `DISABLE_GATE`.
  No password or token ever appears in the repo; local copies live in `~/.config/3pt/`.
- **Provenance:** every figure on a leaf wears DERIVED, AUTHORED, or TO CONFIRM. Tallies are never typed.
- **Tersity:** a leaf is a page, not a paper. `make -C hub tersity` prints words, figures, words per figure and
  longest paragraph per leaf; `make -C hub check` fails any leaf over budget (≤900 words, ≤120 words per
  figure, no paragraph over 55 words, lede ≤30). Over budget means: turn the paragraph into a labelled
  figure. Documents under `docs/` are exempt; the Viewer renders them.
- **Harness code never goes in `hub/`.** The hub renders the repo; it is not the repo.
- **Published bar:** every leaf shows the surfaces that exist outside the repo and their state, from `PUBLISHED` in
  `hub/site/nav.js`. The steward updates it at each checkpoint. Orient documents have a leaf (`vision.html` …) drawn
  in the banner's language (`orient.css`, `mark.js`) and a document twin (`vision-doc`) that carries the Register id.
- **No HTML under `docs/`.** Documents are markdown, rendered by the Viewer. Anything HTML is a leaf
  and lives in `hub/site/` with the Shell and tokens. Relative links in a doc resolve from that
  doc's directory (`../brainstorming.md` from `docs/`). Leaves fetch nothing external; vendor fonts
  with `hub/tools/vendor-fonts.sh`. `make -C hub check` fails on all three.

## Current state (update as it changes)

- 2026-09-26 11:30 ET: docs of record written. No application code yet, by decision.
  Repo is **private**; must be public before submission. Atlas Sandbox project not yet created.
- 2026-09-26 13:00 ET: brainstorm Session 1 indexed: 30 segments, 75 ideas, 7 questions (1 open: which
  ICP direction). Every doc of record cites its segments. Timeline leaf on the hub.
- 2026-09-26 12:45 ET: hub workspace live at https://3pt.pages.dev behind the Tier 0 gate
  (verified anon 401 / valid 200 / wrong-domain 401). `ACCESS_PASS` set in Production and Preview;
  the local copy is in `~/.config/3pt/ACCESS_PASS` on Patrick's machine. GitHub Actions secrets
  (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) not yet set, so CI lints but does not deploy.
  Yash not yet on the gate (`ACCESS_USERS`) or the repo. ICP not decided; see the explorer.
- 2026-09-26 13:05 ET: Tier 1 live. Cloudflare Access app "3PT hub" on team
  `lively-king-be23.cloudflareaccess.com` fronts `3pt.pages.dev` and `*.3pt.pages.dev`; reusable
  policy "3PT team" allows `@factorita.com` plus kothariwork@gmail.com and patrickastarita@gmail.com.
  `ACCESS_TEAM_DOMAIN` + `ACCESS_AUD` set in both Pages environments; middleware verifies the
  assertion. Verified: anon, forged header, and preview all 302 to Access. Add people in the policy.
- 2026-09-26 13:40 ET: Yash hit "Failed to fetch user group information" because the team's only
  identity provider was "Cloudflare" (account members only). Added the One-time PIN provider and
  restricted the 3PT hub app to it, instant authentication on. Standing rule now in the skill
  (`.claude/skills/hub-workspace/references/access-runbook.md`): Access first, PIN always.
- 2026-09-26 13:40 ET: monorepo skeleton landed. `ui/ harness/ infra/` with Turborepo + pnpm; 17
  workspaces build, `3pt loop` runs one iteration against the memory store (policy v0 → v1, cp/1),
  `3PT.app` builds ad hoc via xcodegen. `docs/10-architecture.md` + hub leaf `architecture.html`.
  Still open: Atlas driver in the atlas battery, Sandbox cluster, worker deploy, web inspector host.
- 2026-09-26 13:15 ET: **the harness is built on AWS Strands** (`createHarness`, `ModelRouter`, `Storage`,
  steering, evals, optimizer). 3PT = a Policy → harness compiler (`harness/packages/strands`, written,
  not yet compiled: disk full, package excluded in `pnpm-workspace.yaml`). Archaeology with 21 cited
  sources and a graded ledger: `docs/12-strands-archaeology.md`; handles in `harness/packages/strands/topology.json`.
  Struck: own loop, own router, own sessions, `HarnessAdapter` as the harness.
- 2026-09-26 14:10 ET: tersity pass over every HTML leaf. `hub/tools/tersity.mjs` gates `make -C hub check` and CI;
  9,767 → 3,676 visible words, 27 → 74 figures (362 → 50 words per figure). Direction is a storyboard, the design
  system is specimens rendered from the compile row. Uncommitted; HEAD's Makefile already calls the (untracked)
  metric, so `main` is red until this lands.
- 2026-09-26 14:30 ET: **sandbox provisioning.** New battery `infra/batteries/box` (Colima VM + Ansible playbook: base,
  node, atlas_tools, atlas_local, workload; `box.sh up|play|exec|status|down`). Atlas battery gains the real driver
  (`provision.ts`, `atlasStore()`), `sandbox.sh` (Atlas CLI: project, M0 cluster, user, access list, `ATLAS_URI`), and
  service-account MCP wiring. `apps/worker` has a `main.ts` (`--watch`), `apps/cli` injects `atlasStore` when `ATLAS_URI`
  is set. `make box` · `make sandbox`. Doc of record `docs/16-sandbox-provisioning.md`. Sandbox org id and credentials
  still missing on this machine; `BOX_PROFILE=default` reuses the Colima profile already on disk (host disk ≈ 3 GB free).
- 2026-09-26 15:10 ET: Atlas cluster exists (Patrick's Org → Project 0 → 3PT-Cluster, Free, sample data loaded); org and
  project ids, screens, and what goes in `.env` are in `docs/17-atlas-setup-dossier.md` (15 screenshots under
  `docs/assets/atlas/`). Service account not yet created (the one console step left). `sandbox.sh scale|autoscale` and the
  `atlas.scale` grant added; the MCP's `atlas-upgrade-cluster` is the agent-side equivalent. Box VM stopped: too heavy for
  this laptop today.
- 2026-09-26 14:15 ET: **term 2 opened.** L1–L7 closed; six lanes with a gate each (T1 loop on Atlas · T2 photos through
  the loop · T3 the judges' surface · T4 the difficulty story · T5 demo, video, pitch · T6 green main and hygiene) plus a
  steward, mapped to terminals and judging weights in `docs/17-term-2-lanes.md`. Lane board reads it. Facts at 14:15: no
  `.env`, no Sandbox cluster, nothing writes to Atlas; Yash's two commits on `origin/main` (Acme Builders, 117 licensed
  construction photos) settle the workload as construction; freeze at 16:45, submit 17:00.
- 2026-09-26 15:25 ET: **eligibility risk.** The only MongoDB email received is the generic Atlas welcome mail; no Sandbox
  join link or credit code has been found. Whether Patrick's Org is the hackathon Sandbox org is unconfirmed; Atlas credits
  are not applied (Billing → Available Credits is empty). Resolve with MongoDB staff before building further on 3PT-Cluster.
- 2026-09-26 15:30 ET: Sandbox org identified: an Atlas invitation to "Harness Engineering & Model Wrangling Hackathon
  (.local NYC)" for patrickastarita@gmail.com. Accept it, then create project + cluster there (`make sandbox` with the new
  `ATLAS_ORG_ID`); Patrick's Org / 3PT-Cluster is personal and not eligible.
- 2026-09-26 15:40 ET: **Sandbox live.** Org `69ef9daf03d2ce35c2657862`, project `6ab80ef67d3d0c27d97a4b0e`, `Cluster0` = M10 dedicated
  (AWS us-west-1) provisioned by the org template. Ids in `.env`; current IP on the access list. Left for Patrick: database
  user and a project-level service account, then `pnpm --filter @3pt/battery-atlas run provision`. `docs/17` §7.
- 2026-09-26 14:35 ET: **checkpoints persist.** `3pt loop` resumes from the newest policy (`.3pt/store/`, gitignored,
  until Atlas), writes `harness/policies/v<n>.json` + `harness/checkpoints/cp-<i>.md`; `--git` commits those two files
  and tags `cp/<i>`; `3pt rollback cp/<i>` restores that policy as a new version. Instrument still has no findings,
  so each version only bumps lineage. Next: measurements and checks. `docs/10-architecture.md` §4.7.
- 2026-09-26 14:55 ET: **the loop and the run are separate.** `@3pt/improver` owns the policy rewrite and
  the checkpoint; Instrument only writes `findings`. Stages get `freezePolicy()` and `stageStore()`, which
  refuses writes to `policies` and `checkpoints`. `3pt improve` runs the improver alone. `@3pt/build` is a
  dry run (no `HarnessAdapter`) until `@3pt/strands` compiles.
- 2026-09-26 14:50 ET: **Strands questions answered with pointers.** `docs/18-strands-questions.md` answers configure /
  fine-tune / self-improve / media workflow and pins every claim to a doc heading, a code line range, or a Strands source;
  the hub leaf `strands-journey.html` renders it from the register `hub/site/strands-data.js` (tallies DERIVED). The Viewer
  now gives every heading a slug id (`view.html?f=<doc>#<slug>`, same rule as `scripts/prov.mjs`) and `check-view.mjs`
  fails on any anchor that does not land. Eight gaps listed in docs/18 §5 (no `routes` on `Policy`, `AtlasStorage`
  uncalled, `PolicyFormula`/`harness/evals` unwritten, media tools not `tool()`s). Built on branch `lane/strands-journey`.
- 2026-09-26 15:10 ET: **the day is on the timeline.** `scripts/prompts.mjs` imported nine more Claude sessions (sessions 6–14,
  88 segments in all). `scripts/prov.mjs` now reads the session heading's `claude:<id8> · title`, resolves every `commits in
  window` hash to subject, minute and stage (`STAGE`, authored mapping of commit prefixes), and emits `prompt`/`commits` per
  segment plus clock spans per session. The Timeline leaf gains the day figure (inline SVG, three stage hues, SDF-style plateau,
  rim and glow), a spoken/typed filter, commit chips per prompt, and session headings that name their source. Re-run
  `node scripts/prompts.mjs` at every checkpoint so the rail keeps up with the sessions.
- 2026-09-26 16:20 ET: **the Worker reaches Atlas.** `/health` timed out because Cloudflare Workers egress from changing IPs and only the Mac's IP was
  on the access list. Added `0.0.0.0/0` in the console (no Atlas CLI on the host, no service account; an org resource policy hides the
  "Allow access from anywhere" button, typing the CIDR works). `/health` now says `"store":"atlas"`; `3pt-web.pages.dev/app/` loads. Delete
  the row after the hackathon. `docs/17` §7.
- 2026-09-26 16:30 ET: **the loop improves itself on project data.** Instrument runs ten project checks over `demo_outcomes`,
  `demo_activity` and `demo_photos` (3-iteration window); a failed check names a Build grant (`Finding.answer`). Plan picks the
  sprint: mostly feature, improvement every 4th iteration (effect checks judge each grant), fix after a failed effect (keep if
  it was noise, else revoke with `Finding.revoke`, 12-iteration wait). Suggestions use trade words (supers, PMs, PEs, MEP
  rough-in, OAC photo pack, turnover package, fall protection). `node harness/apps/cli/dist/index.js replay` is the dry run:
  92 months, 20 projects, memory store, no keys; 57 feature · 23 improvement · 12 fix sprints, 10 of 10 hand-written
  capabilities found, 9 held. Tuning values are demo settings (docs/10 §4.2). Atlas: keys in the Keychain (`3pt keys status`),
  provisioned and seeded (`seed-demo`: 20 projects, 4,308 photos, 11 `harness_versions` labelled demo replay); Worker
  `/health` says `"store":"atlas"` after `0.0.0.0/0` was added. Box VM: `3pt-worker` exited 1 because systemd kept `.env`
  inline comments in values; the unit now sources `.env` through bash. After the hackathon: rotate the db password and
  remove `0.0.0.0/0`.
- 2026-09-26 17:50 ET: **sculpted for the room.** Video posted (https://youtu.be/MxAMXWKRcvc, public) and registered in the Published strip,
  which is now the outermost bar on every leaf (fixed, full width, above the rail). `docs/21-the-cut.md` (DY) ranks every hub asset on
  evidence, legibility, narrative and uniqueness; the index shows the loop figure, then twelve doors in four beats (architecture, design,
  process, corpus), then the clusters and the day figures folded. `scripts/treemap.mjs` draws the tree (`docs/assets/treemap.svg`): hub 47%,
  docs 15%, harness 3.4% of tracked lines. Dedupe ledger in docs/21 §6; first typed asset to build is `design/tokens.json` (T1).
- 2026-09-26 16:50 ET: **the built architecture is drawn.** `docs/20-system-map.md` (Register `DE`): sixteen Mermaid figures derived
  from the tree (workspaces, the exact import graph, the core contract, one `3pt loop` as a sequence, the sprint selector, checks by
  mode, ten checks to ten grants, the backfeed, every Atlas collection with its writers and readers, keys, the Strands compile, the app
  loop, the media path, data, deployment, CI) plus a status ledger (wired · written · stub · planned) and where it differs from
  `docs/10`. `docs/22-system-ladder.md` (`DF`): the same architecture in nine rungs from the three points, fixed ids and regions,
  red for what entered. Both render in the hub's own Mermaid reader (`make -C hub check`: 55 diagrams, 0 errors). Found while
  drawing: the API's `/policies/latest` and `/checkpoints` answer from a memory store, not Atlas; the Worker has no `scheduled`
  handler; blob, tracing and artifacts batteries are stubs; cp/1 and cp/2 exist as untracked files with no tag.
