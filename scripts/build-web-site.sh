#!/usr/bin/env bash
# Build the public demo site for the Pages project 3pt-web (target "web" in infra/targets.json).
#   /            ui/apps/live/landing   the landing page (static, no build)
#   /app/        ui/apps/web    the app: role screens, assistant, the bulb, How it learns (live data, sample fallback)
#   /results/    hub/site/results.html   the 92-month replay showcase, without the hub rail (its leaves are gated)
#   /studio/     redirects to /app/ (the Studio became the app; ui/apps/live is no longer served)
#   /media-pool/ data/mock/media-pool photos (the Worker redirects /media-pool/* here)
# Usage: THREEPT_API_URL=https://3pt-harness.<sub>.workers.dev scripts/build-web-site.sh
# Output: dist/web-site (gitignored). Deploy: npx wrangler pages deploy dist/web-site --project-name=3pt-web --branch=main
set -euo pipefail
cd "$(dirname "$0")/.."
: "${THREEPT_API_URL:?set THREEPT_API_URL to the harness Worker URL}"
OUT=dist/web-site
pnpm turbo run build --filter "@3pt/web^..." >/dev/null
rm -rf "$OUT"; mkdir -p "$OUT"
cp ui/apps/live/landing/index.html ui/apps/live/landing/hero-bim.svg "$OUT/"
mkdir -p "$OUT/results"
cp hub/site/3pt.css hub/site/favicon.svg hub/site/replay-data.js "$OUT/results/"
# drop the hub rail (nav.js) and the link to a gated leaf; the page draws itself from replay-data.js
sed -e '/<script src=".\/nav.js"><\/script>/d' -e 's| · the mechanism: <a href="./how-it-works.html">How it works</a>||' hub/site/results.html > "$OUT/results/index.html"
( cd ui/apps/web && VITE_THREEPT_API_URL="$THREEPT_API_URL" npx vite build --base /app/ --outDir "../../../$OUT/app" --emptyOutDir false >/dev/null )
printf '/studio /app/ 301\n/studio/* /app/ 301\n' > "$OUT/_redirects"
mkdir -p "$OUT/media-pool"
( cd data/mock/media-pool && find . -name '*.jpg' -exec rsync -R {} "../../../$OUT/media-pool/" \; && cp credits.json "../../../$OUT/media-pool/" )
echo "built $OUT: $(find "$OUT" -type f | wc -l | tr -d ' ') files, $(du -sh "$OUT" | cut -f1)"
