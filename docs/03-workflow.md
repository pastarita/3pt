# Workflow: Codebase Setup, DevX, Initialized Pipeline, Install Loop

*Source of record. Design only; no code lives in the repo yet by decision (2026-09-26).
When Lane 4 and Lane 5 start, they implement this document.*

## Principles

1. **Docs of record live in `docs/`.** Agents read them before acting. Nothing important lives only in chat.
2. **`main` always installs.** A merged change must pass the install loop on both machines within minutes.
3. **Atlas from commit one.** The pipeline skeleton reads and writes the Atlas Sandbox before it does anything clever.
4. **Harness first, UI second.** The Swift app is an inspector over Atlas state, never the feature.
5. **Every iteration leaves a checkpoint.** Git tag + Atlas checkpoint document, so rollback is one command.

## Proposed repository layout (when code lands)

```
3pt/
  CLAUDE.md / AGENTS.md       agent context (already present)
  docs/                       source of record (already present)
  harness/
    plan/                     Plan gateway: prompts, sprint-mode selector, retrospective reader
    build/                    Meta-harness adapters: claude-code/, kiro/, codex/ ; build-with-instrumentation loop
    instrument/               Standards, checks, backfeed writer, LangSmith wiring
    policies/                 The harness's own rules & context policies AS DATA (versioned, mirrored to Atlas)
    checkpoints/              Retrospectives per checkpoint (mirrored to Atlas)
  media/                      Left-side: indexers, transcribers (read-once), tiering jobs, migrations
  apps/3pt-macos/             SwiftUI inspector (xcodegen project.yml, no committed .xcodeproj)
  scripts/
    bootstrap.sh              one-time machine setup
    install-loop.sh           merge → download → build → install → launch
  .env.example                ATLAS_URI, VOYAGE_API_KEY, OPENROUTER_API_KEY, LANGSMITH_API_KEY
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
5. **Rollback.** `3pt rollback <checkpoint>` restores git sha + policy version. Demo this live.

The media workload (image indexing, transcription, tiering) is what the loop operates *on*.
It is the source of hard metrics: storage cost, hot-tier hit rate, transcript reuse rate,
token spend per iteration.

## DevX conventions

- Branch per lane; PRs optional today, fast-forward merges to `main` preferred.
- Conventional commit prefixes (`plan:`, `build:`, `instrument:`, `media:`, `app:`, `docs:`).
- Secrets only in `.env`, never committed. `.env.example` documents every key.
- Formatters and linters run in the instrumenter, not as pre-commit hooks, so the builder stays fast.
- One `Makefile` at root: `make install`, `make loop`, `make plan`, `make build`, `make instrument`, `make rollback`.

## The install loop
<!-- @s1.16 -->

Colloquial name for **merge → download → build → install**, run between both machines fast.

```
install-loop.sh
  1. git fetch origin && git merge --ff-only origin/main      # merge
  2. (implicit in fetch)                                       # download
  3. xcodegen generate && xcodebuild -scheme 3pt -configuration Release build   # build
  4. ditto build/Release/3pt.app /Applications/3pt.app && open /Applications/3pt.app   # install
```

- `make loop` polls `origin/main` and re-runs the four steps on change.
- Toolchain on Patrick's machine (verified today): Xcode 16.2, Swift 6.0.3, xcodegen via Homebrew, macOS 14.5.
- Yash's machine: run `scripts/bootstrap.sh` once (installs xcodegen, verifies Xcode CLT).
- No signing or notarization for the hackathon; ad-hoc local builds only.
- If the Swift target slips, the same loop applies to a CLI harness binary: replace step 3 with `swift build -c release` and step 4 with a copy into `~/.local/bin`.

## Agent contextualization checklist (Lane 3)

- [ ] `CLAUDE.md` and `AGENTS.md` present and identical in substance.
- [ ] MongoDB Agent Skills installed for Claude Code on both machines.
- [ ] MongoDB MCP Server connected to the Sandbox cluster on both machines.
- [ ] Kiro signed in on at least one machine (new-user bonus).
- [ ] OpenRouter, Voyage, LangSmith keys in each machine's `.env`.
- [ ] Every agent session opens by reading `docs/00-vision.md`, `docs/05-rules.md`, `docs/02-lanes.md`.
