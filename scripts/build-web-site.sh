#!/usr/bin/env bash
# Build the public demo site for the Pages project 3pt-web (target "web" in infra/targets.json).
#   /            ui/apps/live/landing   the landing page (static, no build)
#   /app/        ui/apps/live   the app on live harness data (screens come from the Worker)
#   /studio/     ui/apps/web    role screens, tours, component library (live data, sample fallback)
#   /media-pool/ data/mock/media-pool photos (the Worker redirects /media-pool/* here)
# Usage: THREEPT_API_URL=https://3pt-harness.<sub>.workers.dev scripts/build-web-site.sh
# Output: dist/web-site (gitignored). Deploy: npx wrangler pages deploy dist/web-site --project-name=3pt-web --branch=main
set -euo pipefail
cd "$(dirname "$0")/.."
: "${THREEPT_API_URL:?set THREEPT_API_URL to the harness Worker URL}"
OUT=dist/web-site
pnpm turbo run build --filter "@3pt/live^..." --filter "@3pt/web^..." >/dev/null
rm -rf "$OUT"; mkdir -p "$OUT"
( cd ui/apps/live && VITE_THREEPT_API_URL="$THREEPT_API_URL" npx vite build --base /app/ --outDir "../../../$OUT/app" --emptyOutDir false >/dev/null )
cp ui/apps/live/landing/index.html "$OUT/index.html"
( cd ui/apps/web && VITE_THREEPT_API_URL="$THREEPT_API_URL" npx vite build --base /studio/ --outDir "../../../$OUT/studio" --emptyOutDir false >/dev/null )
mkdir -p "$OUT/media-pool"
( cd data/mock/media-pool && find . -name '*.jpg' -exec rsync -R {} "../../../$OUT/media-pool/" \; && cp credits.json "../../../$OUT/media-pool/" )
echo "built $OUT: $(find "$OUT" -type f | wc -l | tr -d ' ') files, $(du -sh "$OUT" | cut -f1)"
