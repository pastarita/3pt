#!/usr/bin/env bash
# 3PT · one-time machine setup. Idempotent; safe to re-run. docs/03-workflow.md → "The install loop".
set -euo pipefail
cd "$(dirname "$0")/.."
say(){ printf '\033[1m%s\033[0m\n' "$*"; }

say "node"; command -v node >/dev/null || { echo "install Node 22+ (https://nodejs.org or brew install node)"; exit 1; }
node -e 'const [M]=process.versions.node.split("."); if(+M<22){console.error("Node 22+ required, found "+process.version); process.exit(1)}'

say "pnpm"; if ! command -v pnpm >/dev/null; then corepack enable && corepack prepare pnpm@12.6.0 --activate; fi

if [[ "$(uname)" == "Darwin" ]]; then
  say "xcodegen"; command -v xcodegen >/dev/null || brew install xcodegen
  say "xcode clt"; xcode-select -p >/dev/null 2>&1 || xcode-select --install || true
fi

say ".env"; [[ -f .env ]] || { cp .env.example .env; echo "wrote .env from .env.example — fill in ATLAS_URI at minimum"; }
say "ok"
