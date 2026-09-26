---
name: battery-repo
description: git and GitHub for 3PT: instantiate the repository a harness iteration works in, one worktree per iteration, one tag per checkpoint, rollback by tag. Load when Build needs a worktree, Instrument tags a checkpoint, or the CLI rolls back.
---
# Battery: Repo
Checkpoints are git-native: `snapshot({ tag, paths, message })` commits only the policy and checkpoint files and tags `cp/<n>`. It refuses to move an existing tag. `showAt(tag, path)` reads a file at a tag, which `3pt rollback` uses to restore the policy as a new version. Code rollback stays manual: `git checkout cp/<n>`. Never force-push; the install loop merges fast-forward only.
