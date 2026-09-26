#!/usr/bin/env bash
# 3PT · pull the hub-workspace skill in from its public repository.
# Source of record: https://github.com/pastarita/hub-workspace (MIT). The copy under
# .claude/skills/hub-workspace is vendored so every agent in this repo loads the same pattern;
# never edit it here — change it upstream and re-run this. Works with a dirty working tree
# (git subtree refuses one), and pins the exact upstream commit in .claude/skills/hub-workspace/.source.
set -euo pipefail
REPO="pastarita/hub-workspace"; REF="${1:-main}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/.claude/skills/hub-workspace"
TMP="$(mktemp -d)"
SHA="$(gh api "repos/$REPO/commits/$REF" --jq .sha)"
gh api "repos/$REPO/tarball/$SHA" > "$TMP/skill.tgz"
mkdir -p "$TMP/x" && tar -xzf "$TMP/skill.tgz" -C "$TMP/x"
SRC="$(find "$TMP/x" -mindepth 1 -maxdepth 1 -type d | head -1)"
rm -rf "$DEST" && mkdir -p "$DEST"
rsync -a --exclude '.git' --exclude '.DS_Store' "$SRC/" "$DEST/"
printf 'https://github.com/%s\n%s\n%s\n' "$REPO" "$SHA" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$DEST/.source"
rm -rf "$TMP"
echo "hub-workspace skill synced from $REPO@${SHA:0:7} into .claude/skills/hub-workspace"
