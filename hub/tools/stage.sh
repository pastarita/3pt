#!/usr/bin/env bash
# 3PT · stage the hub's deploy artifact. hub/_site/ = hub/site/ + docs/ + README.md + brainstorming.md.
# The hub is cordoned under hub/; the docs of record live at the repo root and are copied in so
# view.html?f=docs/... resolves in production exactly as in preview. Nothing else ever ships.
set -euo pipefail
HUB="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$HUB/.." && pwd)"
OUT="$HUB/_site"
rm -rf "$OUT"
mkdir -p "$OUT/docs"
rsync -a --exclude '.DS_Store' "$HUB/site/"  "$OUT/"
rsync -a --exclude '.DS_Store' "$REPO/docs/" "$OUT/docs/"
cp "$REPO/README.md"        "$OUT/README.md"
cp "$REPO/brainstorming.md" "$OUT/brainstorming.md"
# no secret file may exist in the artifact — the upload ignores .gitignore
if find "$OUT" \( -name '.dev.vars' -o -name '*.env' -o -name '.env*' \) | grep -q .; then
  echo "FAIL: secret-looking file inside hub/_site/" >&2; exit 1
fi
echo "Staged $(find "$OUT" -type f | wc -l | tr -d ' ') files into hub/_site/"
