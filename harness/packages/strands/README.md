# @3pt/strands — the policy-to-harness compiler

3PT does not run its own agent loop. A 3PT `Policy` compiles into Strands `createHarness()` options
(`harnessOptions`), a `ModelRouter` spec per stage (`routerSpec`), tool grants as `builtinTools` +
`interventions` (`grants`), an Atlas-backed Strands `Storage` (`AtlasStorage`), and a measurement
plugin (`measurementPlugin`). The archaeology that justifies each identifier: `docs/12-strands-archaeology.md`.
The handles we speak: `topology.json`.

**Excluded from the workspace on 2026-09-26** (disk full during `pnpm install`). Re-enable: remove the
exclusion in `pnpm-workspace.yaml`, `pnpm install`, `pnpm --filter @3pt/strands typecheck`.
