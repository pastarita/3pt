# 3PT · root targets. The harness's own verbs live here; the hub keeps its own Makefile under hub/.
#   make install      one-time on a fresh machine (scripts/bootstrap.sh) then a full build
#   make loop         the install loop: merge → download → build → install, polling origin/main
#   make plan|build|instrument|rollback   run one stage of the harness CLI
#   make check        everything CI checks: workspace build + typecheck, hub lints, provenance
#   make box          stand up the sandbox box (Colima VM + Ansible) and run the first workflow in it
#   make sandbox      create the Atlas Sandbox project + cluster with the Atlas CLI and write ATLAS_URI to .env
.PHONY: install loop build-all typecheck check plan build instrument rollback provision box box-status box-down sandbox hub-check hub-preview hub-deploy clean

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

box:              ## Colima VM + Ansible converge + verify (infra/batteries/box/box.sh up)
	@bash infra/batteries/box/box.sh up
box-status:
	@bash infra/batteries/box/box.sh status
box-down:
	@bash infra/batteries/box/box.sh down

sandbox:          ## Atlas CLI: project + cluster + user + access list inside the Sandbox org; writes ATLAS_URI
	@bash infra/batteries/atlas/sandbox.sh up --write

hub-check:
	@$(MAKE) -C hub check
hub-preview:
	@$(MAKE) -C hub preview
hub-deploy:
	@$(MAKE) -C hub deploy

clean:
	@pnpm turbo run clean; rm -rf .turbo node_modules
