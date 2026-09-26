# Lanes and Division of Labor

*Source of record. Two people (Patrick, Yash), each driving their own coding agents against
this shared repo. Owners marked TBD are to be assigned at kickoff; fill them in here.*

## The five lanes
<!-- @s1.16 -->

| # | Lane | Deliverable | Owner | Status |
|---|---|---|---|---|
| 1 | **Repo setup** | Public repo, agent context (`CLAUDE.md`/`AGENTS.md`), docs of record, Atlas Sandbox project + cluster created, `.env.example` | Patrick | Docs done; repo still private; sandbox pending |
| 2 | **ICP definition** | `docs/01-icp.md` revised against the rules; one demo persona chosen | TBD | Drafted, needs joint review |
| 3 | **Agent contextualization** | Every agent (Claude Code, Kiro, Codex) loads the same segmented definitions: vision, rules, lanes, glossary. MongoDB Agent Skills installed. MCP servers connected. | TBD | Context files drafted |
| 4 | **Workflow** | Codebase conventions, DevX, the initialized pipeline (Plan → Build → Instrument skeleton), install loop design | TBD | `docs/03-workflow.md` drafted |
| 5 | **Swift app basis** | Minimal macOS/iOS SwiftUI app wired to Atlas, with the install loop running between both machines | TBD | Not started (deliberately) |
| — | **Resources scan** | Partners, MCPs, credits, and mapping onto 3PT | Agent (done) | `docs/04-resources.md` |

## Cross-cutting split: Stack / UI / Backend
<!-- @s1.15 -->

| Area | Contents | Owner |
|---|---|---|
| **Stack** | Harness runtime (Plan/Build/Instrument loop), model routing (OpenRouter), checkpointing (LangGraph + Atlas), MCP wiring | TBD |
| **Backend** | Atlas schema (media index, transcripts, policies, checkpoints, retrospectives, measurements), embeddings (Voyage / Atlas Automated Embeddings), hot/cold tier metadata, migrations | TBD |
| **UI** | Swift supervisory inspector (secondary by rule), optional v0 web companion for judges | TBD |

## Suggested ownership (proposal, not decided)

- **Patrick:** Repo setup, workflow/DevX/install loop, Swift app basis, Stack.
- **Yash:** ICP, background and statement of need, Backend (Atlas schema, embeddings, memory), agent contextualization for Build/Instrument prompts.
- **Shared:** the demo script and the 1-minute video. Rehearse the 3-minute live demo at least twice before 5 PM.

## Rules that shape the lanes

- The repo must be **public** before submission. Whoever owns Lane 1 flips it.
- Everything demoed must be **built today**. Docs written today are fine; imported prior code is not.
- The **harness** is the headline, never the UI. Lane 5 stays small.
- Atlas is a **core component**. Lane 4's pipeline skeleton must read and write Atlas from the first commit.

## Coordination

- Branch per lane, short-lived, merge to `main` often. `main` must always run the install loop cleanly.
- Each lane owner keeps their section of this file current. This file is the single place to answer "who is doing what."
- Yash is not yet a collaborator on `pastarita/3pt`; add before any push from their machine.
