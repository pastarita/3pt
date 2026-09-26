---
name: battery-repo
description: git and GitHub for 3PT: instantiate the repository a harness iteration works in, one worktree per iteration, one tag per checkpoint, rollback by tag. Load when Build needs a worktree, Instrument tags a checkpoint, or the CLI rolls back.
---
# Battery: Repo
Checkpoints are git-native: `repo.tag cp/<n>` after Instrument writes the Atlas document. Rollback = `git checkout cp/<n>` + restore that checkpoint's policy version (atlas battery) + its bundle (artifacts battery). Never force-push; the install loop merges fast-forward only.
