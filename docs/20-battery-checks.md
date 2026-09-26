# Connection checks

Open `/keys` on the local Node API, save the database connection and service keys, then choose
**Test connections**. The page and CLI use the same effective configuration and checks. Users do
not need to choose deployment accounts or understand where each key is stored.

```sh
node scripts/setup.mjs --check
# After a build:
pnpm batteries
pnpm batteries --deployed
pnpm batteries --deployed-only --json
node harness/apps/cli/dist/index.js keys test
```

Exit status is nonzero if a required connection is missing, a configured service fails or cannot
be verified, or a requested deployment check fails. Unconfigured optional services are labelled
optional. A successful check proves the operation below, not every feature of that provider.

| Connection | Test | Required |
|---|---|---|
| Atlas | Authenticate, ping, write a uniquely identified `health_checks` document, read it, delete that document | Yes |
| Models / OpenRouter | Authenticated `GET /api/v1/key`; no generation request | Yes for the live harness |
| Embeddings / Voyage | Embed “3PT connection check” with `voyage-3.5-lite`; no user documents | Optional; configured keys are tested |
| Tracing / LangSmith | Authenticated project-list read, limit 1 | Optional; trace ingestion is not tested |
| Repository / GitHub | Authenticated read of `pastarita/3pt` | Optional; pushes are not tested |
| Deployed API | `/health` must report `ok: true` and `store: atlas` | With `--deployed`; remote writes are not tested |

The database probe deletes only its own random id. Provisioning adds a one-hour TTL index to
`health_checks` for records left by interrupted checks; TTL deletion is asynchronous. Provision
after deploying the new collection/index definition. The tiny Voyage request may consume credits.
Missing credentials cause no provider request. HTTP checks time out after 12 seconds, deployment
checks after 15 seconds, and redirects are rejected. Results never contain keys, connection
strings, provider response bodies or raw driver errors.

Blob/artifact round trips, actual model generation, trace writes and repository write permissions
are not checked yet. “Connections ready” does not claim that those operations ran.

## Implementation and verification

- Shared checks: `harness/packages/setup`; Atlas adapter: `infra/batteries/atlas/src/probe.ts`.
- `POST /keys/check` retains the existing loopback, exact Host and same-origin guards. The public
  Worker does not expose this local setup endpoint.
- The CLI reads live Worker targets from `infra/targets.json`. Deployment details stay out of
  the user’s setup screen.
- `pnpm --filter @3pt/setup test` covers missing keys, authentication, permissions, malformed
  responses, timeouts/rate limits, redaction and misleading health responses. `make check` runs it.

The runtime loader does not automatically read a legacy `.env`. For a diagnostic, explicitly use
`node --env-file=.env scripts/batteries.mjs`. To migrate existing configuration into the setup,
use `3pt keys import <file>`. Tests never migrate or rewrite secrets silently.

## Observed on 2026-09-26

| Surface | Observation |
|---|---|
| `3pt-web.pages.dev` | HTTP 200; landing at `/`, app at `/app/` |
| `3pt.pages.dev` | HTTP 302 to its expected sign-in gate |
| `3pt-harness.3pt-worker.workers.dev` | Initially timed out; the check at 20:43 UTC passed with `store: atlas` |
| `3pt-harness.patrickastarita.workers.dev` | HTTP 200 with `ok` and `at` only; Atlas connectivity unverified |
| Patrick’s existing local configuration | Atlas authentication, write, read and cleanup passed; the Keychain/host loader without the legacy file has no keys |

These are dated observations. Rerun after changing secrets: setting a secret and opening Atlas
are separate operations.

References: [OpenRouter authentication](https://openrouter.ai/docs/api/reference/authentication),
[Voyage embeddings](https://docs.voyageai.com/reference/embeddings-api),
[GitHub repository read](https://docs.github.com/en/rest/repos/repos#get-a-repository),
[MongoDB TTL indexes](https://www.mongodb.com/docs/manual/core/index-ttl/).
