# 3PT · root targets. The harness's own verbs live here; the hub keeps its own Makefile under hub/.
#   make install      one-time on a fresh machine (scripts/bootstrap.sh) then a full build
#   make loop         the install loop: merge → download → build → install, polling origin/main
#   make plan|build|instrument|rollback   run one stage of the harness CLI
#   make check        everything CI checks: workspace build + typecheck, hub lints, provenance
#   make signals      converge the signals role on the box (kernel witness); make signals-replay runs the pipeline here on a fixture
.PHONY: install loop build-all typecheck check plan build instrument rollback provision signals signals-replay hub-check hub-preview hub-deploy clean

install:          ## bootstrap the machine, then install and build every workspace
	@bash scripts/bootstrap.sh
	@pnpm install
	@pnpm turbo run build

loop:             ## poll origin/main and re-run merge → download → build → install on change
	@bash scripts/install-loop.sh --watch

once:             ## one pass of the install loop
	@bash scripts/install-loop.sh

build-all:        ## build every workspace (TypeScript + the Swift app when xcodebuild exists)
	@pnpm turbo run build

typecheck:
	@pnpm turbo run typecheck

check: build-all typecheck hub-check   ## what CI runs
	@node scripts/prov.mjs --check

plan:             ## Plan stage: read checkpoint + measurements, pick a sprint mode, emit a plan
	@pnpm --filter @3pt/cli run build >/dev/null && node harness/apps/cli/dist/index.js plan

build:            ## Build stage: wrap $THREEPT_HARNESS, run builder ↔ instrumenter turns
	@pnpm --filter @3pt/cli run build >/dev/null && node harness/apps/cli/dist/index.js build

instrument:       ## Instrument stage: checks, retrospective, rewrite policies, tag a checkpoint
	@pnpm --filter @3pt/cli run build >/dev/null && node harness/apps/cli/dist/index.js instrument

rollback:         ## make rollback CP=<checkpoint>
	@pnpm --filter @3pt/cli run build >/dev/null && node harness/apps/cli/dist/index.js rollback $(CP)

provision:        ## stand up every battery in infra/batteries (idempotent; needs .env)
	@pnpm turbo run provision

signals:          ## converge the signals role on the box (bpftrace + 3pt-signals unit) and show the store
	@bash infra/batteries/box/box.sh play signals && bash infra/batteries/box/box.sh verify
signals-replay:   ## push the fixture through the pipeline here (no root, no eBPF); prints the store
	@pnpm --filter @3pt/battery-signals run build >/dev/null && pnpm --filter @3pt/battery-signals run replay && node infra/batteries/signals/dist/agent.js --status

hub-check:
	@$(MAKE) -C hub check
hub-preview:
	@$(MAKE) -C hub preview
hub-deploy:
	@$(MAKE) -C hub deploy

clean:
	@pnpm turbo run clean; rm -rf .turbo node_modules
