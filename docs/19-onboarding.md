# 3PT handoff for Yash · 2026-09-26 16:00 ET

*No secrets in this file. The keys come in the shared Apple Note; everything here is public repo
state. Source of record for the pieces: `docs/16-sandbox-provisioning.md` (the box and the flow),
`docs/17-atlas-setup-dossier.md` (the Atlas console, ids, doors), `docs/10-architecture.md` (the tree).*

## 1. History, one screen

| Time (ET) | What landed |
|---|---|
| 11:30 | Docs of record 00 to 07; hub at https://3pt.pages.dev (you are on the Access list; one-time PIN login) |
| 13:15 | Harness is built on AWS Strands; 3PT compiles a Policy into harness options (`docs/12`) |
| 13:40 | Monorepo: `ui/` `harness/` `infra/`, 18 workspaces, `3pt loop` runs one iteration against a memory store |
| 14:20 | Box battery: a Colima VM converged by Ansible ran end to end on Patrick's laptop (node, mongosh, Atlas CLI, MCP server, repo at `/opt/3pt`, worker as a service) |
| 15:40 | Atlas Sandbox live: hackathon org, project per person, `Cluster0` = **M10 dedicated**, AWS us-west-1. Ids below |
| 16:00 | Repo public; you are a collaborator. Submission plan in `docs/18-submission.md` |

## 2. Get running, about fifteen minutes

```
git clone https://github.com/pastarita/3pt.git && cd 3pt
make install                      # checks Node 22, installs pnpm, builds every workspace
cp .env.example .env              # then paste the keys from the Apple Note into it
```

Values that are not secrets, already correct for Patrick's Sandbox project; yours differ only if you
were given your own Sandbox project in the same org (then swap `ATLAS_PROJECT_ID` and the URI):

```
ATLAS_ORG_ID=69ef9daf03d2ce35c2657862
ATLAS_PROJECT_ID=6ab80ef67d3d0c27d97a4b0e
ATLAS_CLUSTER=Cluster0
ATLAS_REGION=US_WEST_1
ATLAS_TIER=M10
```

From the Apple Note: `ATLAS_URI`, `ATLAS_DBUSER`, `ATLAS_DBPASS`, `ATLAS_CLIENT_ID`, `ATLAS_CLIENT_SECRET`.
Your public IP must be on the project's access list (Security → Database & Network Access → Add Current IP).

```
pnpm --filter @3pt/battery-atlas run provision    # 7 collections, 9 indexes, transcripts_vec on Cluster0
make plan && make build && make instrument        # or: pnpm 3pt loop — one iteration, state in Atlas
pnpm --filter @3pt/worker start                   # the first workflow: scan media_index, queue jobs
```

## 3. The VM

The box is a Colima VM on the laptop that runs it; there is no shared VM to SSH into. Patrick's is
stopped because his disk is full. You run your own, same playbook, same result:

```
brew install colima docker uv     # uv runs Ansible without a global install
make box                          # guard → VM → Ansible roles → verify; first run about 15 minutes, needs 8 GB free
infra/batteries/box/box.sh status | exec '<cmd>' | ssh | down
```

Nothing stateful lives in the box. It syncs this checkout to `/opt/3pt`, builds it, provisions Atlas from
its `.env`, and runs the worker as `3pt-worker.service` against the same `Cluster0`.

## 4. The two doors to Atlas

- **CLI**, deterministic: `infra/batteries/atlas/sandbox.sh status | uri | scale M20 | autoscale on M10 M20`.
- **MCP**, for agents: merge `infra/batteries/atlas/mcp.json` into `~/.claude.json`. With the service
  account it exposes the `atlas-*` tools, including `atlas-upgrade-cluster`. Also install the MongoDB
  Agent Skills (`docs/04-resources.md`).

## 5. Rules that bite

- Everything stateful goes through Atlas. Collection names live in `harness/packages/core` only.
- Not an image analyzer, not a dashboard, not basic RAG (`docs/05-rules.md`).
- Work in a worktree: `scripts/worktree.sh new lane <slug>`. Two people and several agents share `main`.
- Commit prefixes `plan: build: instrument: media: app: docs: chore:`. `make check` is what CI runs.
- Your lane (`docs/02-lanes.md`): ICP, backend (Atlas schema, embeddings, memory), Build and Instrument prompts.

## 6. Open, in your lane

- `harness/apps/worker` re-queues a `transcribe` job for every untranscribed asset on every tick.
- The `transcripts_vec` index expects 1024-dim Voyage embeddings; nothing writes them yet.
- `@3pt/strands` is excluded from the workspace until a machine with disk builds it.
