---
name: battery-atlas
description: Stand up and use the 3PT MongoDB Atlas Sandbox: the project and cluster inside the hackathon Sandbox org (Atlas CLI), the database with eight collections, indexes, the transcripts vector index (driver), and the MongoDB MCP server the Build and Instrument stages call. Load when a stage needs Atlas access or when provisioning a fresh environment.
---
# Battery: Atlas
1. **Cluster** (once, Atlas-conventional): `infra/batteries/atlas/sandbox.sh up --write` — Atlas CLI: auth → project in the Sandbox org (`ATLAS_ORG_ID`) → M0 cluster → db user → access list → writes `ATLAS_URI` to `.env`. Runs on the host if `atlas` is installed, else inside the box.
2. **Database** (idempotent): `pnpm --filter @3pt/battery-atlas run build && pnpm --filter @3pt/battery-atlas run provision` — creates the eight collections, nine indexes, and the `transcripts_vec` vector index over the driver. Same call works against Atlas Local.
3. **Store**: apps import `atlasStore()` from `@3pt/battery-atlas` when `ATLAS_URI` is set; stages only ever see `Store`.
4. **MCP**: `mcp.json` here (merge into `.mcp.json` or `~/.claude.json`); with `ATLAS_CLIENT_ID/SECRET` the server also exposes the `atlas-*` provisioning tools. Prefer the MongoDB Agent Skills for modeling and query shape; collection names are `COLLECTIONS` in `@3pt/core` and nowhere else.
5. **Scale** (the dynamic-scaling affordance): `sandbox.sh scale FLEX|M10` below M10, `sandbox.sh autoscale on M10 M20` from M10. Over MCP the same move is `atlas-upgrade-cluster`. Screens and limits: `docs/17-atlas-setup-dossier.md`.
Tool grants this battery satisfies: `atlas.find`, `atlas.latest`, `atlas.insert`, `atlas.*`, `policy.write` (the improver's grant; no stage holds it), `atlas.scale`.
Doc of record for the provisioning flow: `docs/16-sandbox-provisioning.md`.
