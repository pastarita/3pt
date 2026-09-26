# Workflow: Codebase Setup, DevX, Initialized Pipeline, Install Loop

*Source of record. Written as design on 2026-09-26 AM; the monorepo skeleton landed the same
afternoon and this file now describes what exists. The architecture (three lanes, Turborepo,
batteries) is `docs/10-architecture.md`.*

## Principles

1. **Docs of record live in `docs/`.** Agents read them before acting. Nothing important lives only in chat.
2. **`main` always installs.** A merged change must pass the install loop on both machines within minutes.
3. **Atlas from commit one.** The pipeline skeleton reads and writes the Atlas Sandbox before it does anything clever.
4. **Harness first, UI second.** The Swift app is an inspector over Atlas state, never the feature.
5. **Every iteration leaves a checkpoint.** Git tag + Atlas checkpoint document, so rollback is one command.

## Repository layout (implemented 2026-09-26)

Three top-level lanes, Turborepo `apps/` + `packages/` inside each. Full tree and the reasoning in
`docs/10-architecture.md`.

```
3pt/
  CLAUDE.md / AGENTS.md       agent context
  docs/                       source of record
  hub/                        gated Pages site over docs/ (cordoned; not a lane)
  package.json  pnpm-workspace.yaml  turbo.json  tsconfig.base.json  Makefile  .env.example
  scripts/
    bootstrap.sh              one-time machine setup (node 22, pnpm, xcodegen, .env)
    install-loop.sh           merge → download → build → install (+ --watch)
  ui/
    apps/pwa, apps/web        Vite + TypeScript inspectors (installable / deployable)
    apps/macos                SwiftUI inspector: xcodegen project.yml, no committed .xcodeproj
    packages/design-system, packages/inspector-client
  harness/
    packages/core             stage contract, runner, record types, COLLECTIONS, seed policy
    packages/plan|build|instrument|media
    apps/cli                  3pt plan|build|instrument|loop|rollback <tag>
    apps/api                  HTTP for the surfaces
    apps/worker               job drainer (node locally, Cloudflare Worker deployed)
    policies/                 the harness's own rules AS DATA (v<n>.json, mirrored to Atlas)
    checkpoints/              retrospectives per checkpoint (mirrored to Atlas)
  infra/
    batteries/atlas|blob|artifacts|repo|tracing   provisioners: package + descriptor + provision + SKILL (+ mcp.json)
```

## The initialized pipeline (Plan → Build → Instrument skeleton)
<!-- @s1.04 @s1.14 -->

Minimum viable loop, in order of implementation:

1. **State in Atlas.** Collections: `policies` (versioned harness rules/context policies/tool grants),
   `checkpoints` (git sha + policy version + metrics + retrospective), `media_index`
   (asset id, tier, location, transcript ref), `transcripts` (read-once extraction, embedding),
   `measurements` (hard metric signals per iteration).
2. **Plan.** Reads the latest checkpoint + measurements, selects a sprint mode (feature / improvement / fix),
   emits a spec and an evaluation plan. Persist as a `plans` document.
3. **Build.** Wraps a coding agent (start with Claude Code headless; Kiro CLI second to prove "any harness").
   Runs builder ↔ instrumenter turns until the instrumenter's checks pass or a turn budget is exhausted.
4. **Instrument.** Runs the standards checks, writes a retrospective, **rewrites `policies`**
   (this is the Recursive Harnessing proof), and tags a checkpoint.
5. **Rollback.** `3pt rollback <checkpoint>` restores the policy version as a new version and prints the `git checkout` for the code. Demo this live. Snapshot details: `docs/10-architecture.md` §4.7.

The media workload (image indexing, transcription, tiering) is what the loop operates *on*.
It is the source of hard metrics: storage cost, hot-tier hit rate, transcript reuse rate,
token spend per iteration.

## DevX conventions

- Branch per lane; PRs optional today, fast-forward merges to `main` preferred.
- Conventional commit prefixes (`plan:`, `build:`, `instrument:`, `media:`, `app:`, `docs:`).
- Secrets only in `.env`, never committed. `.env.example` documents every key.
- Formatters and linters run in the instrumenter, not as pre-commit hooks, so the builder stays fast.
- One `Makefile` at root: `make install`, `make loop`, `make plan`, `make build`, `make instrument`, `make rollback CP=cp/<n>`, `make provision`, `make check`. The hub keeps its own under `hub/`.
- Turborepo runs every workspace, Swift included, through `pnpm turbo run build`; the Swift wrapper skips itself where Xcode is absent.

## The install loop
<!-- @s1.16 -->

Colloquial name for **merge → download → build → install**, run between both machines fast.

```
scripts/install-loop.sh            (--watch polls origin/main every 20s)
  1. git fetch origin && git merge --ff-only origin/main                    # merge (download implicit)
  2. pnpm install --frozen-lockfile && pnpm turbo run build --filter='!@3pt/macos'   # build: workspaces
  3. cd ui/apps/macos && xcodegen generate && xcodebuild -scheme 3PT -configuration Release build   # build: app
  4. ditto …/Release/3PT.app /Applications/3PT.app && open /Applications/3PT.app                    # install + launch
```

- `make loop` polls `origin/main` and re-runs the four steps on change; `make once` is one pass; `make install` is the first-time path (bootstrap + install + build).
- Toolchain on Patrick's machine (verified today): Xcode 16.2, Swift 6.0.3, xcodegen via Homebrew, macOS 14.5.
- Yash's machine: `make install` once (runs `scripts/bootstrap.sh`: Node 22, pnpm, xcodegen, `.env` from the example).
- Verified 2026-09-26 PM on Patrick's machine: 17 workspace builds green, `3pt loop` writes policy v1 + cp/1 against the memory store, `3PT.app` builds ad hoc.
- No signing or notarization for the hackathon; ad-hoc local builds only.
- If the Swift target slips, the same loop applies to a CLI harness binary: replace step 3 with `swift build -c release` and step 4 with a copy into `~/.local/bin`.

## Agent contextualization checklist (Lane 3)

- [ ] `CLAUDE.md` and `AGENTS.md` present and identical in substance.
- [ ] MongoDB Agent Skills installed for Claude Code on both machines.
- [ ] MongoDB MCP Server connected to the Sandbox cluster on both machines.
- [ ] Kiro signed in on at least one machine (new-user bonus).
- [ ] OpenRouter, Voyage, LangSmith keys in each machine's `.env`.
- [ ] Every agent session opens by reading `docs/00-vision.md`, `docs/05-rules.md`, `docs/02-lanes.md`.
