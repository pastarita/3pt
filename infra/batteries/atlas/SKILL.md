---
name: battery-atlas
description: Stand up and use the 3PT MongoDB Atlas Sandbox: database, eight collections, indexes, the transcripts vector index, and the MongoDB MCP server the stages and the improver call. Load when a stage needs Atlas access or when provisioning a fresh environment.
---
# Battery: Atlas
1. `ATLAS_URI` in `.env` (Hackathon Sandbox cluster; docs/04-resources.md).
2. `pnpm --filter @3pt/battery-atlas run build && pnpm --filter @3pt/battery-atlas run provision` — idempotent.
3. Connect the MCP server with `mcp.json` in this directory (merge into `.mcp.json` or `~/.claude.json`).
4. Prefer the MongoDB Agent Skills for modeling and query shape; the collection names are `COLLECTIONS` in `@3pt/core` and nowhere else.
Tool grants this battery satisfies: `atlas.find`, `atlas.latest`, `atlas.insert`, `atlas.*`, `policy.write` (the improver's grant; no stage holds it).
