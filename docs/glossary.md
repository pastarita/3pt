# Glossary
<!-- @s1.02 @s1.03 @s1.04 @s1.07 @s1.12 @s1.13 @s1.16 -->

| Term | Meaning |
|---|---|
| **3PT / Three Point Harness** | The Plan → Build → Instrument meta-harness. |
| **Plan** | Polyglot gateway stage. Reads harness health, checkpoints, measurements, and media-context state; picks a sprint mode; emits a spec and an evaluation plan. |
| **Build** | Meta-harness over any existing coding-agent harness (Claude Code, Kiro, Codex). Runs the build-with-instrumentation loop. |
| **Instrument** | Stage that owns observability, DevX, CI/CD, deployment, and memory standards. Enforces them on the codebase and **backfeeds** them into harness code and Plan context. |
| **Build-with-instrumentation loop** | Builder agent ↔ instrumenter agent, alternating until standards pass or a turn budget ends. |
| **Instrumentation backfeed** | What Instrument learns becomes harness code (policies, guardrails, tool grants) and Plan prompt context. The core Recursive Harnessing mechanism. |
| **Instrumentation loop** | The area/subsystem that manages all instrumentation systems. |
| **Checkpoint** | Git tag + Atlas document (sha, policy version, metrics, retrospective). Rollback target. |
| **Retrospective** | Reflection produced at each checkpoint over only checkpoint-level memory. |
| **Measurement** | Emergent fourth dimension: hard metrics on the harness's own evolution. |
| **Sprint modes** | Feature / Improvement / Fix. Plan picks one per iteration; sequential, never parallel. |
| **Right side of the triangle** | The harness's own code history, mapped to Plan/Build/Instrument. |
| **Left side of the triangle** | Media context: indexes, blobs, embeddings, transcripts, tiering, and the pipelines that maintain them. Migrates over time, driven by the right side. |
| **Furnace** | Informal name for the right-side harness state that drives left-side migrations. |
| **Read-once transcript** | Extract context from an image once, store as source of truth, re-read only deliberately. Repeated re-reading is a hallucination vector. |
| **Hot / cold tier** | Media that must be instantly accessible vs. media that can sleep. Tier metadata lives in Atlas. |
| **Install loop** | Merge → download → build → install, run fast between team machines. `scripts/install-loop.sh` when code lands. |
| **Lane** | One of five parallel work streams (`docs/02-lanes.md`). |
| **ICP** | Ideal customer profile (`docs/01-icp.md`). |
| **Statement 1 / Statement 2** | Hackathon problem statements: Recursive Harnessing / Long Horizon Engineering. |
| **Segment** | One thought's worth of transcript, marked `<!-- sN.NN who -->` in `brainstorming.md`. The unit of provenance (`docs/09-provenance.md`). |
| **Cite** | `@sN.NN` in any comment: this text came from that segment. `@sN.NN:slug` names the idea. |
| **Bake** | `node scripts/prov.mjs --bake`: copy every cite the transcript does not yet list into its segment marker, so the transcript stays the complete record of where its ideas went. |
