---
name: battery-box
description: Stand up, converge, use, and tear down the 3PT sandbox box: a Colima VM that an Ansible playbook turns into the machine the workload runs on (install loop, worker, mongosh, Atlas CLI, MongoDB MCP server), pointed at the Atlas Sandbox cluster or at Atlas Local. Load when a workflow needs a machine, when provisioning a fresh environment, or when a stage holds a box.* grant.
---
# Battery: Box
The flow is deterministic and idempotent; every phase can be re-run. `docs/16-sandbox-provisioning.md` is the doc of record.

1. `.env` at the repo root (`ATLAS_URI` for the Sandbox cluster; `BOX_*` optional). Never pass secrets on the command line; the playbook reads them from `.env`.
2. `infra/batteries/box/box.sh up` — guard (host free disk) → vm (Colima start or create) → ping → playbook (base, node, atlas_tools, atlas_local when `BOX_ATLAS_LOCAL=1`, workload) → verify.
3. `box.sh play <role>` re-runs one role. `box.sh exec '<cmd>'` runs inside the box from `/opt/3pt`. `box.sh status` prints profile, host free disk, tool versions. `box.sh down` stops; `box.sh destroy` deletes the profile (asks).
4. Ansible runs on the host through `uvx --from ansible-core ansible-playbook` (no global install); the inventory is generated from `colima ssh-config`.
5. Inside the box the repo lives at `/opt/3pt`; `make once` there is the install loop; `pnpm --filter @3pt/worker start` is the first workflow (scan `media_index`, queue `transcribe` jobs into Atlas).
6. The provisioning MCP is `mcp.json` here: the MongoDB MCP Server with an Atlas service account, which exposes the `atlas-*` tools. Prefer it, and the MongoDB Agent Skills, over hand-written Admin API calls.

Tool grants this battery satisfies: `box.up`, `box.exec`, `box.status`, `box.down`.
Machine constraint on Patrick's laptop (2026-09-26): host disk is near full; `BOX_PROFILE=default` reuses the profile already on disk. The guard refuses to create a new profile under `BOX_NEW_MIN_FREE_GB` (8) free.
