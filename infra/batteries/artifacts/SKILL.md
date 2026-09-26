---
name: battery-artifacts
description: Checkpoint bundles for 3PT (policy snapshot, retrospective, metrics) keyed by checkpoint tag, so rollback restores harness state and not only code. Load when Instrument tags a checkpoint or the CLI rolls one back.
---
# Battery: Artifacts
`artifacts.put(tag, bundle)` at every checkpoint; `artifacts.get(tag)` on rollback. Bytes go through the blob battery; the index is the `checkpoints` collection.
