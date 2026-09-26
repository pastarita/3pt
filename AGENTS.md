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
| Who owns which lane | `docs/02-lanes.md` |
| How code moves, repo layout, install loop, pipeline skeleton | `docs/03-workflow.md` |
| Which partner tools and credits exist, and which 3PT slot each fills | `docs/04-resources.md` |
| Rules, judging weights, banned projects, deadlines | `docs/05-rules.md` |
| Goal over time, the interior-design use case, value props, screen-capture onboarding | `docs/06-goal-and-use-case.md` |
| Theses, hypotheses, the measurement system, partner-incentive mapping, requirement set | `docs/07-assessment-and-measurement.md` |
| Visual direction: construction demo, stress test, video plan (proposal, not yet merged into docs 00 to 06) | `hub/site/direction.html` (hub leaf "Direction") |
| The monorepo: three lanes, Turborepo, batteries, diagrams, extension recipes | `docs/10-architecture.md` |
| Design system: tokens, naming, dark/light, three canonical directions, cross-surface, components, the promenade for deciding (proposal) | `hub/site/design-system.html` (hub leaf "Design system") |
| Terms (install loop, backfeed, furnace, left/right triangle) | `docs/glossary.md` |
| Where an idea came from in the brainstorm, and how to cite it | `docs/09-provenance.md`, then `docs/provenance-index.md` |
| Worktrees: where they live, how they are named, when they are collected | `docs/11-worktrees.md` |

## Working rules for agents in this repo

- Docs in `docs/` are the source of record. Update the doc when you change the thing it describes.
- Do not publish artifacts or external pages; write files here.
- Secrets live only in `.env`. Add every new key to `.env.example` with a comment.
- Prefer MongoDB Agent Skills and the MongoDB MCP Server for anything touching Atlas.
- Commit prefixes: `plan:`, `build:`, `instrument:`, `media:`, `app:`, `docs:`, `chore:`.
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
- **Harness code never goes in `hub/`.** The hub renders the repo; it is not the repo.
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
