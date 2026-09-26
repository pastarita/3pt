# infra/ — batteries included

A **battery** is an instantiable artifact: a package that can stand up, idempotently, one thing the
running pipeline depends on, plus the agent skill and MCP wiring for using it. The harness never
imports a battery; it receives what the battery provides (a `Store`, a tool grant) at the edge.
That is what lets the Instrument stage change tool grants without changing stage code.

| Battery | Package | Stands up | Provides (tool grants) |
|---|---|---|---|
| `batteries/atlas` | `@3pt/battery-atlas` | Sandbox db, 7 collections, indexes, vector index; MongoDB MCP server | `atlas.find` `atlas.latest` `atlas.insert` `atlas.*` `policy.write` |
| `batteries/blob` | `@3pt/battery-blob` | Image bytes: gridfs (default, in-Sandbox), r2, or fs | `blob.get` `blob.put` |
| `batteries/artifacts` | `@3pt/battery-artifacts` | Checkpoint bundles keyed by tag | `artifacts.put` `artifacts.get` |
| `batteries/repo` | `@3pt/battery-repo` | Repo instantiation, worktrees per iteration, tags per checkpoint | `repo.worktree` `repo.tag` `repo.rollback` `repo.instantiate` |
| `batteries/tracing` | `@3pt/battery-tracing` | LangSmith project; trace → M-* reader | `tracing.read` `tracing.span` |

Each battery directory has the same four things: `package.json` (`build`, `provision`), `src/index.ts`
(the descriptor: name, provides, env), `src/provision.ts` (idempotent stand-up), `SKILL.md` (the
agent skill). `atlas` also carries `mcp.json`. `pnpm provision` runs every battery; each prints its
plan when its env is missing rather than failing, so a fresh clone can see what it lacks.

Adding a data source = adding a battery. Nothing else changes until Instrument grants its tools.
Full picture: `docs/10-architecture.md`.
