# Local build, services and agent operations

Source of record for running a checkout on a local server. Service options checked against the
upstream documentation on 2026-09-26. The default target is a Mac; Atlas remains the state store.

## Recommended shape

Use Homebrew for host tools, the repository's pinned pnpm for builds, and `launchd` for persistent
Mac processes. Build once when deploying a revision; the service runs the resulting JavaScript.
An always-running build watcher is a development option, not a requirement for serving the app.

| Option | What it provides | Fit for 3PT |
|---|---|---|
| Homebrew tools + native `launchd` | Dependencies from Homebrew; repository-owned launch agents | Recommended first Mac install. No custom package distribution to maintain. |
| A 3PT Homebrew tap/formula | Versioned installation plus `brew services start 3pt` | A useful distribution milestone once a relocatable runtime bundle exists. There is no 3PT formula today. |
| Colima + Ansible + `systemd` | A Linux VM with the existing box battery and worker unit | Existing route to a managed worker. API and web service units are still needed for the full app. |
| Foreground processes | API, worker and static server in terminals | Fastest way to verify the build and configuration before service registration. |

Homebrew services wraps `launchctl` on macOS and `systemctl` on Linux. A user service starts at
login; using root changes it to a boot service. Formulae can declare their command, working
directory, restart behavior and logs with a `service` block. A custom `--file` still belongs to a
formula; it is not a standalone arbitrary-script installer. [Homebrew manual](https://docs.brew.sh/Manpage#services-subcommand),
[formula service files](https://docs.brew.sh/Formula-Cookbook#service-files).

For a Mac that must serve before anyone logs in, use a system LaunchDaemon with a dedicated
unprivileged account. For the developer's logged-in Mac, use a LaunchAgent. Apple's process
supervisor already supplies this lifecycle. [Apple daemon and agent reference](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html).

## What the build produces

`node scripts/setup.mjs --site` checks Node 22+ and the pnpm version in `package.json`, runs
`pnpm install --frozen-lockfile`, builds the workspaces except `@3pt/macos`, and assembles the site.
Secrets use the shared Keychain / Atlas vault / host-environment loader. The script neither
writes credential files, starts services nor creates provider accounts.

| Output | Use |
|---|---|
| `harness/apps/api/dist/index.js` | Node HTTP API, port 8787 by default |
| `harness/apps/worker/dist/main.js --watch` | Periodic media scan / job enqueueing |
| `harness/apps/cli/dist/index.js` | One-shot harness stages, loop and policy rollback |
| `harness/packages/*/dist`, `infra/batteries/*/dist` | Runtime libraries referenced through pnpm workspace links |
| `dist/web-site/` | Static site: landing at `/`, live app at `/app/`, studio at `/studio/`, photos at `/media-pool/` |

The Node runtime currently needs the checkout, installed workspace dependencies, and built
workspace libraries. Copying just `harness/apps/api/dist` does not create a distributable service.
The API also resolves sample data relative to the checkout. Only `dist/web-site` is a web document
root; runtime configuration and secrets stay outside it.

`THREEPT_API_URL` is a build-time setting for the site, defaulting to `http://127.0.0.1:8787` in
setup. Rebuild the site when it changes. In a remote browser, 127.0.0.1 means the browser's own
machine: a LAN deployment needs a reachable API URL or a same-origin reverse proxy.

For a future Homebrew formula, first produce a relocatable runtime under `dist/service/` with its
production dependencies, data files, startup wrappers and revision manifest. Keep that separate
from `dist/web-site/`. Pin a release archive and checksum in the formula, keep configuration
outside the versioned Cellar directory, and give each long-running process a service definition.
That bundle and formula are proposed work, not outputs of today's setup command.

## Build and configure

On a Mac with Homebrew, install Node if needed, then install the package manager pinned by this
checkout. The static serving option below uses Caddy; the native app additionally needs Xcode
and xcodegen, which are outside the default server build.

```sh
brew install node@22 caddy
export PATH="$(brew --prefix node@22)/bin:$PATH"
npm install --global pnpm@12.6.0
node scripts/setup.mjs --site
```

Read `package.json` before using the pnpm version above if the checkout has moved on.
The existing `make install` still bootstraps the native app toolchain. `make setup` is the new
shortcut for the local server/site build.

Configure `ATLAS_HOST`, `ATLAS_DBUSER`, `ATLAS_DBPASS`, `ATLAS_DB` through the existing local key
page (`/keys` on the Node API) or host environment. Leave `ATLAS_URI` blank when using parts and
use the existing Sandbox `Cluster0` connection. Follow `docs/17-atlas-setup-dossier.md` §7.
The CLI and setup provision step use `loadKeys()`: macOS Keychain for bootstrap keys, the Atlas
vault for encrypted provider keys, and explicit host environment overrides. Keep credentials out
of logs and generated service files. A legacy `.env` can be loaded explicitly with Node's
`--env-file=.env`; setup does not create or execute it.
[Node environment-file option](https://nodejs.org/api/cli.html#--env-filefile).

```sh
node scripts/setup.mjs --provision
node scripts/batteries.mjs --deployed
```

Provisioning loads configured keys and invokes each provisioner directly, so the Atlas connection parts
are not dropped by Turbo's environment allowlist. It requires a connection and fails if a command
fails. The provisioners' capabilities still differ:

| Battery | Current setup action | Verify / remaining work |
|---|---|---|
| Atlas | Ensures `COLLECTIONS`, indexes and attempts `transcripts_vec` | Verify connectivity and index status. Vector-index errors are logged as skipped by the existing provisioner. |
| Blob | Creates the fs directory; GridFS is lazy | The R2 path prints a plan. Actual byte-storage adapters still need implementation; a configured backend is not proof of a write. |
| Artifacts | Prints that it uses the blob backend | Archive and retrieval are not established by provisioning. |
| Repo | Checks the checkout revision and presence of a GitHub token | Local work needs git; creating a remote additionally needs credentials. |
| Tracing | Reports the configured LangSmith project and whether a key exists | This does not create or verify a remote project. |
| Models / embeddings | Keys documented in `.env.example` | The Strands compiler is built; Build uses OpenRouter when configured and otherwise performs a dry run. Do not equate a present key with an exercised model call. |
| Box | Separate opt-in `make box` | Installs and starts the VM worker through Ansible; not invoked by setup. |

Use MongoDB Agent Skills and the MongoDB MCP Server for Atlas inspection. Do not create another
cluster as a side effect of local setup. New provider choices belong in `docs/14-setup-cascade.md`
and new environment keys in `.env.example`.

## Verify in the foreground

Run these in separate terminals from the main checkout. The CLI loop writes a policy and
checkpoint; it is an explicit smoke run, not part of installing dependencies.

```sh
node harness/apps/api/dist/index.js
node harness/apps/worker/dist/main.js --watch
caddy file-server --listen 127.0.0.1:8080 --root dist/web-site
```

Check `http://127.0.0.1:8080/`, `/app/`, `/studio/`, a photo, and
`curl --fail http://127.0.0.1:8787/health`. Caddy's file server can serve the built directory;
keep it in the foreground while validating the deployment. [Caddy command reference](https://caddyserver.com/docs/command-line#caddy-file-server).

Then run `node harness/apps/cli/dist/index.js loop`, record the printed checkpoint
tag, and inspect that checkpoint and policy in Atlas. Without a connection the CLI uses
`.3pt/store`; the worker uses memory. Neither fallback proves Atlas persistence.

**Current local runtime gaps:** the Node API does not inject Atlas into `handle()`;
`/policies/latest` and `/checkpoints` use the handler's memory store even when another caller
passes a durable store. Wire the store at the API entry point and use it in those routes before
calling the local system durable. Restart the API and confirm a saved app change survives.
The worker currently queues jobs from media assets; it does not implement the full transcription
and tier-migration consumer. Repeated watches can enqueue the same outstanding work again.
These are runtime tasks, not problems a service manager solves.

## Installing services

Service installation is the next step after the foreground checks, and is not implemented by
`setup.mjs`. For a native Mac install, have the operations agent generate and validate a LaunchAgent
plist for each process below. Use the resolved absolute Node/Caddy and entry-point paths, `WorkingDirectory` at the main checkout, `RunAtLoad`, `KeepAlive`,
`ThrottleInterval`, and separate stdout/stderr log files outside the web root. Do not assume
launchd inherits a terminal's PATH. Do not start a second copy on an occupied port.

| Label | Program and arguments | When to start |
|---|---|---|
| `com.threept.api` | Node, `<checkout>/harness/apps/api/dist/index.js` | Once durable-store wiring and restart checks pass |
| `com.threept.worker` | Node, `<checkout>/harness/apps/worker/dist/main.js`, `--watch` | Once queue behavior is appropriate for continuous operation |
| `com.threept.web` | Caddy, `file-server`, `--listen`, `127.0.0.1:8080`, `--root`, `<checkout>/dist/web-site` | After the site and API checks pass |

For each generated plist, validate with `plutil -lint`, place it under `~/Library/LaunchAgents`,
and register with `launchctl bootstrap gui/$(id -u) <plist>`. Inspect with
`launchctl print gui/$(id -u)/com.threept.api`; restart with
`launchctl kickstart -k gui/$(id -u)/com.threept.api`; stop/unregister with
`launchctl bootout gui/$(id -u)/com.threept.api`. Repeat with the worker and web labels.
Retain the generated files in the checkout's ignored `dist/local-services/` as the reviewed
installation inputs. A future installer should automate this generate → validate → register
sequence and provide status, restart and uninstall verbs.

The alternative already in the repository is `brew install colima docker ansible`, then
`make box`. `infra/batteries/box/box.sh` drives Ansible, and
`infra/batteries/box/ansible/roles/workload/templates/3pt-worker.service.j2` defines the worker's
systemd service. Check `make box-status` and `infra/batteries/box/box.sh verify`. Colima is
available through Homebrew. [Colima installation](https://colima.run/docs/installation/).
See `docs/16-sandbox-provisioning.md` for the existing VM flow, including its disk requirements.

## Updating and recovering

Record the running git revision, Node/pnpm versions, API URL and active services before changing
anything. Build and check the candidate committed revision in a throwaway verification worktree:
`scripts/worktree.sh verify <ref> -- make check` after arranging dependencies there. Keep secrets
in the main checkout. The existing install loop (`make once` / `make loop`) fetches and
fast-forwards main and installs the native app; it is not a server deployment transaction.

For the current checkout-based service, stop the affected services, fast-forward to the verified
revision, run setup, restart, and check both HTTP behavior and Atlas persistence. Retain the prior
revision so an agent can rebuild it if checks fail. Avoid building over running JavaScript files.
A future `dist/service` release should use versioned directories and switch only after validation.
Policy rollback via the CLI is separate from rolling application code back.

## Context to hand an operations agent

> Read AGENTS.md, docs/03-workflow.md, docs/10-architecture.md, docs/11-worktrees.md,
> docs/14-setup-cascade.md, docs/17-atlas-setup-dossier.md §7 and this document. Your task is to
> build the chosen revision, configure its batteries, deploy it on the local server, and prove
> it survives restart. Default to the local Mac. Inspect the existing processes and configuration
> first; preserve configured secrets and concurrent lane work. Use scripts/setup.mjs for locked dependencies
> and build output. Distinguish code gaps, missing credentials and provisioning plans from
> verified services. Resolve the documented local API and worker gaps before claiming the full
> system is operational. Prepare and validate service definitions before registering them.
> Keep state in the existing Atlas cluster and use the existing secret loader. Do not publish a site or
> deploy to external hosting as part of this local task. Report the revision, build results,
> service status, local URLs, Atlas evidence, restart result, rollback procedure and anything
> still incomplete. Run worktree garbage collection at the checkpoint.
