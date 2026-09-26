# Worktrees: naming, lifecycle, and garbage collection

*Source of record for how git worktrees are used in this repo. Written 2026-09-26. Two people and
several agents commit to `main` concurrently; worktrees are how an agent verifies a committed tree
or works a lane without disturbing the checkout someone else is typing in. The helper is
`scripts/worktree.sh`; the permission and Claude Code defaults are in `.claude/settings.json`.*

## Where they live

All worktrees are created under **`.claude/worktrees/`** inside the repo. The directory is
gitignored, sits beside the main checkout so relative paths and the hub's `make` targets work
unchanged, and is the same place Claude Code puts its own isolation worktrees. Nothing else in the
tree may be a worktree, and a worktree is never created inside another worktree.

## Naming

Directory name is `<kind>-<slug>`. The slug is lowercase kebab, at most 24 characters, and says
what the worktree is for. Three kinds:

| Kind | Directory | Branch | Lifetime |
|---|---|---|---|
| `verify` | `verify-<slug>` | none (detached at a ref) | The command that created it. Removed the moment its check finishes; never longer than a day. |
| `lane` | `lane-<slug>` | `lane/<slug>` | Until its branch is fast-forwarded into `main`. Then removed and the branch deleted. |
| `agent` | `agent-<slug>` | `lane/<slug>` | Claude Code isolation (`EnterWorktree`, `isolation: "worktree"`). Same rule as a lane worktree. |

Branch names follow the lane convention already in `docs/03-workflow.md`: one branch per lane or
per piece of lane work, short-lived, merged fast-forward. A worktree's branch and its directory
name carry the same slug, so `git worktree list` reads without a lookup.

## Lifecycle

```
scripts/worktree.sh new lane atlas-driver          # .claude/worktrees/lane-atlas-driver on branch lane/atlas-driver from HEAD
scripts/worktree.sh verify HEAD -- sh -c 'cd hub && make check'   # detached worktree of HEAD, run the check, remove it
scripts/worktree.sh ls                             # every worktree: branch, merged or not, age
scripts/worktree.sh rm lane-atlas-driver           # remove; deletes lane/atlas-driver if it is merged
scripts/worktree.sh gc [--dry]                     # collect the deprecated ones, then git worktree prune
```

1. **Create** with the script, never by hand, so the name and the location are always right.
2. **Work** in it like any checkout. Commit to its branch. Push the branch if the other principal
   needs to see it; otherwise keep it local.
3. **Merge** fast-forward into `main` from the main checkout, run `make check`, push.
4. **Remove** it. A merged worktree is deprecated the moment it merges.

Rules that keep this safe:

- **Verification happens in a `verify` worktree, not in the main checkout.** Before pushing, an
  agent proves the *committed* tree passes, not the working tree with someone else's half-edits
  in it. `scripts/worktree.sh verify HEAD -- <cmd>` is the one-liner.
- **The install loop, the hub deploy, and `make loop` run only from the main checkout.** Worktrees
  are for building and checking, never for deploying or for installing the app.
- **No secrets in worktrees.** `.env` is not copied. A worktree that needs Atlas or a partner key
  reads the main checkout's `.env` through `../../..`, or does without.
- **`node_modules` is symlinked** from the main checkout into new Claude Code worktrees
  (`worktree.symlinkDirectories` in `.claude/settings.json`) so the pnpm monorepo does not get
  reinstalled per worktree. If a workspace's dependencies change on the branch, run `pnpm install`
  inside the worktree; the symlink is a starting point, not a cage.
- **New worktrees branch from local HEAD**, not from `origin/main` (`worktree.baseRef: "head"`),
  because during the hackathon unpushed commits are the norm and a worktree that lacks them is
  useless.

## Deprecated worktrees and garbage collection

A worktree is **deprecated** when any of these is true:

| Kind | Deprecated when |
|---|---|
| `verify` | Older than one day. It should have been removed by its own command; if it is still here, that command died. |
| `lane`, `agent` | Its branch is an ancestor of `main` (merged, or never got a commit) **and** it has no uncommitted changes. |
| any | Its directory exists but `git worktree list` no longer knows it (an orphan), or vice versa (a stale registration). |

`scripts/worktree.sh gc` removes the first two classes, deletes merged `lane/*` branches, and
runs `git worktree prune` for the third. `--dry` prints what it would do. It never touches a
worktree with uncommitted changes and never touches the main checkout.

**When to run it.** At every checkpoint the harness tags, before the submission push, and
whenever `scripts/worktree.sh ls` shows more than a handful of entries. A worktree that survives
two checkpoints without commits is a question for its owner, not for the collector.

**What it will not do.** It does not delete unmerged branches, rebase anything, or remove a
worktree with a dirty tree. Those are decisions, and decisions are made by a person in the main
checkout.

## Settings that make this work

`.claude/settings.json` (committed, applies to both principals' agents):

```json
{
  "permissions": { "allow": ["Bash(git worktree *)", "Bash(bash scripts/worktree.sh *)", "Bash(scripts/worktree.sh *)"] },
  "worktree": { "baseRef": "head", "symlinkDirectories": ["node_modules"] }
}
```

`.gitignore` carries `.claude/worktrees/`. Claude Code only watches settings directories that
existed when a session started, so a session older than this file needs a restart to pick up the
permission.
