# Hackathon Rules & Compliance

*Source of record. Captured 2026-09-26 from
https://cerebralvalley.ai/e/mongodb-nyc-hackathon/details and the partner resource guide
(Google Doc, registered in `docs/04-resources.md` under Source documents).
Event: **The Harness Engineering & Model Wrangling Hackathon** (MongoDB × Cerebral Valley).*

**Hackathon day: Saturday, September 26, 2026, at The Malin Chelsea (220 W 26th St, NYC).**
Submissions due 5:00 PM that day. September 30 at Pier 36 is the MongoDB.local showcase and
applies only to the six finalists selected on the 26th.

## Timeline (all times ET)

| When | What |
|---|---|
| Sat Sep 26, 10:30 AM | Hacking begins. Partner credit codes distributed from this time (email / Discord bot). |
| **Sat Sep 26, 5:00 PM** | **Submissions due** (Cerebral Valley platform: public repo link, 1-minute demo video with audio, description, all team members added). |
| Sat Sep 26, 5:15–6:45 PM | Round 1 judging: ~3 min live demo + 1–2 min Q&A, in assigned rooms. Top 6 selected. |
| Sat Sep 26, 7:00 PM | Top 6 demo on stage. |
| Wed Sep 30, 10:00 AM–4:30 PM | Finalists exhibit at MongoDB.local NYC (Pier 36). Community vote → Top 3. ≥1 team member must be present from 10 AM. |
| Wed Sep 30, 3:30 / 4:30 PM | Top 3 notified / present on main stage, 3 min + 3 min Q&A. |

Venue: The Malin Chelsea, 220 W 26th St. Team size ≤ 4.

## Problem statements (must build in at least one)

1. **Recursive Harnessing** — a self-improving agent harness that automatically evolves its own
   architecture: rules, context policies, guardrails, tool access, and more. Adapts its whole
   environment to a specific user, task, or use case.
2. **Long Horizon Engineering** — sustain coherent memory across billions of tokens in one
   session, optimize toward long-term goals, learn from hard metric signals.

**3PT targets Statement 1 primarily and touches Statement 2** via checkpoint memory and
metric-driven sprint selection.

## Hard requirements

- [ ] **MongoDB Atlas as a core component**, built inside the **Atlas Hackathon Sandbox** (link arrived by email). Non-negotiable for finalist eligibility.
- [x] **Repository is public.** (`pastarita/3pt` flipped public 2026-09-26; verified with `gh repo view`. Full due-diligence ledger: `docs/15-open-source-checklist.md`.)
- [ ] **New work only.** Everything demoed must have been built today; judges must be able to identify it. Do not import pre-existing code or present prior projects.
- [ ] Demo shows features, code, and functionality — **not a presentation**.
- [ ] Rights to all code, data, and assets used.
- [ ] All team members added to the submission; demo link accessible; video has audio and video.

## Banned project types (strictly no)

AI mental-health advisor · **Basic RAG applications** · Streamlit apps · **Image Analyzers** ·
"AI for Education" chatbot · AI job-application screener · AI nutrition coach · personality
analyzers · AI medical advice · **any project where a dashboard is the main feature** ·
sports analyzers or coaches.

### Implications for 3PT

| Original framing | Risk | Revised framing |
|---|---|---|
| "Generate context from images, trend analysis" | Reads as an **Image Analyzer** | The **harness** is the product. Images are the *workload* that stresses memory, storage tiering, and context policies. The demo shows the harness rewriting its own policies; image content is incidental. |
| 3D thumbnail supervisory UI as a headline | Reads as **dashboard as main feature** | UI is a secondary inspector. Headline is the recursive loop and its Atlas-backed state. |
| Embeddings + retrieval over image transcripts | Reads as **basic RAG** | Retrieval exists to serve the harness's own memory and policy evolution, not to answer user questions. Emphasize checkpoints, retrospectives, migrations. |

## Judging criteria (Round 1 weights; same categories in the final)

| Criterion | Weight | What it means for us |
|---|---|---|
| Technical Demo | 35% | The loop must *visibly run live*: a harness that modifies its own rules/context policy, persists a checkpoint to Atlas, and rolls back. |
| Implementation Difficulty | 30% | Show depth beyond prompts: state machine, checkpointing, migrations of the context store, builder↔instrumenter negotiation. |
| Impact Potential | 20% | Media-heavy long-running pipelines are underserved; hot/cold tiering and read-once transcripts are real pain. |
| Creativity | 15% | The three-point loop with backfeed and a Measurement dimension; polyglot left/right triangle. |

## Prizes

| Place | MongoDB | ElevenLabs | LangSmith | Vercel v0 |
|---|---|---|---|---|
| 1st | $7,000 | 3 mo Scale | $3,000 | $1,800 |
| 2nd | $5,000 | 3 mo Pro | $2,000 | $1,200 |
| 3rd | $3,000 | 3 mo Pro | $1,000 | $600 |

Questions: ajc@cerebralvalley.ai or Discord. Wi-Fi: `TheMalinChelseaEvents`.
