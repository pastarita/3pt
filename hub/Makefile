# 3PT · hub workspace targets. The harness's own targets (plan/build/instrument) land here later.
.PHONY: stage check tersity tersity-check preview deploy verify meta

stage:            ## build _site/ = hub/ + docs/ + README.md
	@bash tools/stage.sh

check: stage      ## lint the IA, the Viewer, the provenance pointers, and the tersity budget of every leaf
	@node tools/check-nav.mjs
	@node tools/docmeta.mjs --check || true   # advisory: a doc edited without `make -C hub meta` prints a warning, never blocks
	@node tools/check-view.mjs
	@node tools/check-diagram.mjs
	@node ../scripts/prov.mjs --check
	@node tools/tersity.mjs || true   # advisory: reports, never gates (decision 2026-09-26); `make tersity-check` is the hard gate

tersity:          ## words, figures, words-per-figure and longest paragraph for every leaf (site/*.html)
	@node tools/tersity.mjs

tersity-check:    ## the hard gate: exit 1 when any leaf is over the tersity budget
	@node tools/tersity.mjs --check

meta:             ## regenerate site/doc-meta.js (what git knows about every document); run at every checkpoint
	@node tools/docmeta.mjs

prov:             ## rebuild docs/provenance-index.md + site/prov-data.js from brainstorming.md (repo root)
	@node ../scripts/prov.mjs

preview: stage    ## serve _site/ with Pages-style routing at http://127.0.0.1:8000/
	@python3 tools/serve.py 8000

deploy: check     ## deploy _site/ to Cloudflare Pages production (run from repo root: compiles functions/)
	@npx wrangler pages deploy _site --project-name=3pt --branch=main

access:           ## Tier 1: create/update the Cloudflare Access app + policy, write TEAM_DOMAIN/AUD to Pages (needs ~/.config/3pt/CF_API_TOKEN)
	@bash tools/access-setup.sh

verify:           ## after any gate-touching deploy. With Access in front: anon → 302 to <team>.cloudflareaccess.com; forged header → still 302
	@printf 'anon          '; curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://3pt.pages.dev/
	@printf 'forged header '; curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' -H 'Cf-Access-Authenticated-User-Email: patrick@factorita.com' https://3pt.pages.dev/
	@printf 'preview anon  '; curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://main.3pt.pages.dev/
	@echo '(Tier 0 door, only reachable on a hostname Access does not front:)'
	@printf 'valid basic   '; curl -s -o /dev/null -w '%{http_code}\n' -u "patrick@factorita.com:$${ACCESS_PASS:-$$(cat ~/.config/3pt/ACCESS_PASS 2>/dev/null)}" https://3pt.pages.dev/
	@printf 'wrong-domain  '; curl -s -o /dev/null -w '%{http_code}\n' -u "x@elsewhere.com:$${ACCESS_PASS:-$$(cat ~/.config/3pt/ACCESS_PASS 2>/dev/null)}" https://3pt.pages.dev/
