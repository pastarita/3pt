# harness/ — the running pipeline

The product. Plan → Build → Instrument runs the work. The improver, outside that run, rewrites the
harness's own policies from Instrument's findings and persists every checkpoint to Atlas. Layout follows the Turborepo convention inside the lane:

| Path | Package | What |
|---|---|---|
| `packages/core` | `@3pt/core` | Stage contract, iteration runner, record types, collection names, seed policy, memory store |
| `packages/plan` | `@3pt/plan` | Sprint-mode selector, spec + evaluation plan writer |
| `packages/build` | `@3pt/build` | Harness adapters (claude-code, kiro, codex), builder ↔ instrumenter loop |
| `packages/instrument` | `@3pt/instrument` | Standards checks → `findings`. Cannot write policies or checkpoints |
| `packages/improver` | `@3pt/improver` | The self-improving loop: runs the stages under a frozen policy, then **rewrites the policy (the backfeed)** and tags the checkpoint |
| `packages/media` | `@3pt/media` | Left side: tiering, read-once transcript rules, job derivation |
| `apps/cli` | `@3pt/cli` | `3pt plan|build|instrument|improve|loop|rollback` |
| `apps/api` | `@3pt/api` | HTTP the surfaces read from |
| `apps/worker` | `@3pt/worker` | Job drainer; node locally, Cloudflare Worker deployed |
| `policies/` | data | Git mirror of the `policies` collection |
| `checkpoints/` | data | Git mirror of the `checkpoints` collection |

Dependency direction: `apps → packages → core`. `core` imports nothing from the workspace.
Batteries (`infra/`) are injected, never imported by stages: a stage sees a `Store` and tool grants.
The loop is separate from the run: a stage gets `freezePolicy(policy)` and `stageStore(store)`, so
it can read the rules but not change them. Only `@3pt/improver` writes `policies` and `checkpoints`.
Full picture: `docs/10-architecture.md`.
