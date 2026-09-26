#!/usr/bin/env bash
# 3PT · worktree management. Policy: docs/11-worktrees.md. All worktrees live in .claude/worktrees/
# (gitignored) and are named <kind>-<slug>: verify-* are throwaway and detached, lane-* carry a
# lane/<slug> branch, agent-* are Claude Code's own isolation worktrees.
#
#   scripts/worktree.sh new <kind> <slug> [ref]     create .claude/worktrees/<kind>-<slug> (lane: branch lane/<slug> from ref, default HEAD)
#   scripts/worktree.sh ls                          every worktree with branch, age, and whether it is merged into main
#   scripts/worktree.sh rm <name>                   remove a worktree; delete its lane/ branch if merged
#   scripts/worktree.sh gc [--dry]                  remove merged lane-*, verify-* older than 1 day, agent-* whose branch is merged; then prune
#   scripts/worktree.sh verify [ref] -- <cmd...>    one shot: detached worktree of ref, run cmd inside it, remove it
set -euo pipefail
REPO="$(git -C "$(dirname "$0")/.." rev-parse --show-toplevel)"
DIR="$REPO/.claude/worktrees"
cmd="${1:-}"; shift || true

age_hours() { local t; t=$(stat -f %m "$1" 2>/dev/null || stat -c %Y "$1"); echo $(( ( $(date +%s) - t ) / 3600 )); }
merged() { git -C "$REPO" merge-base --is-ancestor "$1" main 2>/dev/null; }
branch_of() { git -C "$1" symbolic-ref --short -q HEAD || echo "(detached)"; }

case "$cmd" in
  new)
    kind="${1:?kind: verify | lane | agent}"; slug="${2:?slug}"; ref="${3:-HEAD}"
    [[ "$slug" =~ ^[a-z0-9]([a-z0-9-]{0,22}[a-z0-9])?$ ]] || { echo "slug must be lowercase kebab, ≤24 chars" >&2; exit 1; }
    mkdir -p "$DIR"; path="$DIR/$kind-$slug"
    [ -e "$path" ] && { echo "exists: $path" >&2; exit 1; }
    case "$kind" in
      verify) git -C "$REPO" worktree add -q --detach "$path" "$ref" ;;
      lane|agent) git -C "$REPO" worktree add -q -b "lane/$slug" "$path" "$ref" ;;
      *) echo "kind must be verify | lane | agent" >&2; exit 1 ;;
    esac
    echo "$path"
    ;;
  ls)
    git -C "$REPO" worktree list --porcelain | awk '/^worktree /{print $2}' | while read -r p; do
      [ "$p" = "$REPO" ] && { printf '%-40s %-24s %s\n' "(main checkout)" "$(branch_of "$p")" ""; continue; }
      b=$(branch_of "$p"); h=$(git -C "$p" rev-parse HEAD); st="unmerged"
      merged "$h" && st="merged"; a=$(age_hours "$p")
      printf '%-40s %-24s %-9s %sh old\n' "${p#$DIR/}" "$b" "$st" "$a"
    done
    ;;
  rm)
    name="${1:?name}"; path="$DIR/$name"; [ -d "$path" ] || { echo "no such worktree: $name" >&2; exit 1; }
    b=$(branch_of "$path"); h=$(git -C "$path" rev-parse HEAD)
    git -C "$REPO" worktree remove --force "$path"
    if [[ "$b" == lane/* ]] && merged "$h"; then git -C "$REPO" branch -d "$b" >/dev/null && echo "deleted merged branch $b"; fi
    echo "removed $name"
    ;;
  gc)
    dry=0; [ "${1:-}" = "--dry" ] && dry=1
    [ -d "$DIR" ] || { git -C "$REPO" worktree prune; echo "nothing to collect"; exit 0; }
    for path in "$DIR"/*/; do
      [ -d "$path" ] || continue; path="${path%/}"; name="${path#$DIR/}"
      git -C "$REPO" worktree list --porcelain | grep -qx "worktree $path" || { echo "orphan dir (not a worktree): $name"; continue; }
      h=$(git -C "$path" rev-parse HEAD); why=""
      case "$name" in
        verify-*) [ "$(age_hours "$path")" -ge 24 ] && why="verify worktree older than 1 day" ;;
        lane-*|agent-*) merged "$h" && [ -z "$(git -C "$path" status --porcelain)" ] && why="branch merged into main and clean" ;;
      esac
      [ -z "$why" ] && continue
      if [ $dry = 1 ]; then echo "would remove $name: $why"; else "$0" rm "$name" >/dev/null && echo "removed $name: $why"; fi
    done
    [ $dry = 1 ] || git -C "$REPO" worktree prune
    ;;
  verify)
    ref="HEAD"; [ "${1:-}" != "--" ] && { ref="$1"; shift; }
    [ "${1:-}" = "--" ] && shift; [ $# -gt 0 ] || { echo "verify [ref] -- <cmd...>" >&2; exit 1; }
    slug="$(date +%H%M%S)-$RANDOM"; path=$("$0" new verify "$slug" "$ref")
    status=0; (cd "$path" && "$@") || status=$?
    git -C "$REPO" worktree remove --force "$path"
    echo "verify: $ref → exit $status (worktree removed)"; exit $status
    ;;
  *) sed -n '2,12p' "$0"; exit 1 ;;
esac
