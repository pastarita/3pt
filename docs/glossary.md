| **Signal** | One kernel-witnessed event from the box (exec, exit, open, connect, or a `finding` a plugin raised), shaped like an OpenTelemetry log record and stored in Atlas `signals`. `docs/20-kernel-signals.md`. |
| **Sensor** | A declared bpftrace program, one hook, JSON lines out; the signals battery runs one process per sensor. |
| **Drain** | The cursor-driven offload from the box's SQLite store to Atlas: rows to `signals`, windows to `measurements` (source `kernel`). At-least-once. |
| **Kernel witness** | The idea that the kernel is the one reporter the harness cannot talk over; Instrument's `kernel:*` checks are findings drawn from it. |
# Glossary
<!-- @s1.02 @s1.03 @s1.04 @s1.07 @s1.12 @s1.13 @s1.16 -->

| Term | Meaning |
|---|---|
| **3PT / Three Point Harness** | The Plan → Build → Instrument meta-harness. |
| **Plan** | Polyglot gateway stage. Reads harness health, checkpoints, measurements, and media-context state; picks a sprint mode; emits a spec and an evaluation plan. |
| **Build** | Meta-harness over any existing coding-agent harness (Claude Code, Kiro, Codex). Runs the build-with-instrumentation loop. |
| **Instrument** | Stage that owns observability, DevX, CI/CD, deployment, and memory standards. Checks them on the codebase and reports **findings**. It does not write the policy. |
| **Improver** | The self-improving loop, `@3pt/improver`. Runs outside Plan → Build → Instrument. Reads findings, writes the next policy version and the checkpoint. The only writer of `policies` and `checkpoints`. |
| **Finding** | One standards-check result (check, passed, note) in the `findings` collection. Instrument writes it; the improver turns failed ones into rules. |
| **Build-with-instrumentation loop** | Builder agent ↔ instrumenter agent, alternating until standards pass or a turn budget ends. |
| **Instrumentation backfeed** | What Instrument finds, the improver turns into harness code (policies, guardrails, tool grants) and Plan prompt context. The core Recursive Harnessing mechanism. |
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
| **Lane** | One of five parallel work streams (`docs/02-lanes.md`). Also: one of the three top-level directories `ui/`, `harness/`, `infra/` (`docs/10-architecture.md`). |
| **Battery** | An instantiable artifact under `infra/batteries/`: a package that stands up one thing the pipeline runs on (Atlas, blob, artifacts, repo, tracing), idempotently, with its agent skill and MCP wiring. Stages never import batteries; they receive what a battery provides (a Store, a tool grant). |
| **Tool grant** | A string like `atlas.find` in `policy.toolGrants`, per stage. Data in Atlas, mirrored in `harness/policies/`. The improver rewrites it. |
| **ICP** | Ideal customer profile (`docs/01-icp.md`). |
| **Statement 1 / Statement 2** | Hackathon problem statements: Recursive Harnessing / Long Horizon Engineering. |
| **Segment** | One thought's worth of transcript, marked `<!-- sN.NN who -->` in `brainstorming.md`. The unit of provenance (`docs/09-provenance.md`). |
| **Cite** | `@sN.NN` in any comment: this text came from that segment. `@sN.NN:slug` names the idea. |
| **Bake** | `node scripts/prov.mjs --bake`: copy every cite the transcript does not yet list into its segment marker, so the transcript stays the complete record of where its ideas went. |
