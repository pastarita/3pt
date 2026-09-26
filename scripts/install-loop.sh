#!/usr/bin/env bash
# 3PT · the install loop: merge → download → build → install. docs/03-workflow.md.
#   scripts/install-loop.sh            one pass
#   scripts/install-loop.sh --watch    poll origin/main every 20s and re-run on change
set -euo pipefail
cd "$(dirname "$0")/.."
APP="ui/apps/macos"
pass(){
  git fetch -q origin && git merge -q --ff-only origin/main            # 1 merge (2 download is implicit)
  pnpm install --frozen-lockfile --prefer-offline >/dev/null           # 3 build: workspaces
  pnpm turbo run build --filter='!@3pt/macos' >/dev/null
  if [[ "$(uname)" == "Darwin" ]] && command -v xcodegen >/dev/null; then
    (cd "$APP" && xcodegen generate -q && xcodebuild -quiet -scheme 3PT -configuration Release -derivedDataPath .build build)
    local built; built="$(find "$APP/.build/Build/Products/Release" -maxdepth 1 -name '3PT.app' | head -1)"
    if [[ -n "$built" ]]; then ditto "$built" /Applications/3PT.app && open /Applications/3PT.app; fi   # 4 install + launch
  fi
  echo "install loop: $(git rev-parse --short HEAD) $(date +%H:%M:%S)"
}
if [[ "${1:-}" == "--watch" ]]; then
  last=""
  while true; do
    git fetch -q origin || true
    cur="$(git rev-parse origin/main)"
    if [[ "$cur" != "$last" ]]; then pass || echo "install loop: pass failed at $cur"; last="$cur"; fi
    sleep 20
  done
else pass; fi
