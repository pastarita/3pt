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
| Terms (install loop, backfeed, furnace, left/right triangle) | `docs/glossary.md` |

## Working rules for agents in this repo

- Docs in `docs/` are the source of record. Update the doc when you change the thing it describes.
- Do not publish artifacts or external pages; write files here.
- Secrets live only in `.env`. Add every new key to `.env.example` with a comment.
- Prefer MongoDB Agent Skills and the MongoDB MCP Server for anything touching Atlas.
- Commit prefixes: `plan:`, `build:`, `instrument:`, `media:`, `app:`, `docs:`, `chore:`.
- Keep `main` installable. If you break the install loop, fix it before anything else.
- Two humans (Patrick, Yash) run agents concurrently. Stay inside your lane's directories; if you
  must touch another lane, say so in the commit message.

## Current state (update as it changes)

- 2026-09-26 11:30 ET: docs of record written. No application code yet, by decision.
  Repo is **private**; must be public before submission. Atlas Sandbox project not yet created.
