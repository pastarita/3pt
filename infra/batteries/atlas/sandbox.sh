#!/usr/bin/env bash
# 3PT · battery-atlas · the Sandbox cluster, the Atlas-conventional way (Atlas CLI). docs/16-sandbox-provisioning.md §3
#   sandbox.sh up        auth → project → cluster (M0) → db user → access list → ATLAS_URI (written to .env with --write)
#   sandbox.sh status    what exists in the project
#   sandbox.sh uri       print the composed connection string (password masked unless --show)
#   sandbox.sh scale <tier>              Free/Flex → FLEX | M10 | M20 … (atlas clusters upgrade; 7-10 min downtime). The atlas.scale grant.
#   sandbox.sh autoscale on|off [min] [max]   M10+ only: autoScaling.compute via `atlas api clusters updateCluster` (docs/17 §4)
# Auth, in order of preference (all read from .env):
#   ATLAS_CLIENT_ID + ATLAS_CLIENT_SECRET        Atlas service account  → MONGODB_ATLAS_CLIENT_ID/SECRET
#   ATLAS_PUBLIC_KEY + ATLAS_PRIVATE_KEY         programmatic API key   → MONGODB_ATLAS_PUBLIC_API_KEY/PRIVATE_API_KEY
#   neither                                       `atlas auth login` (device flow; works over ssh)
# Scope: ATLAS_ORG_ID (the Sandbox org the hackathon email enrolled you in), ATLAS_PROJECT_ID (found or created by name).
# Runs on the host if `atlas` is installed, else inside the box (infra/batteries/box/box.sh exec atlas …).
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; ROOT="$(cd "$HERE/../../.." && pwd)"
if [[ -f "$ROOT/.env" ]]; then set -a; . "$ROOT/.env"; set +a; fi
NAME="${ATLAS_PROJECT_NAME:-3pt}"; CLUSTER="${ATLAS_CLUSTER:-3pt}"; TIER="${ATLAS_TIER:-M0}"; PROVIDER="${ATLAS_PROVIDER:-AWS}"; REGION="${ATLAS_REGION:-US_EAST_1}"
DBUSER="${ATLAS_DBUSER:-3pt}"; DB="${ATLAS_DB:-3pt}"
say(){ printf '\033[1m[sandbox] %s\033[0m\n' "$*"; }; die(){ printf '[sandbox] %s\n' "$*" >&2; exit 1; }

export MONGODB_ATLAS_CLIENT_ID="${ATLAS_CLIENT_ID:-}" MONGODB_ATLAS_CLIENT_SECRET="${ATLAS_CLIENT_SECRET:-}"
export MONGODB_ATLAS_PUBLIC_API_KEY="${ATLAS_PUBLIC_KEY:-}" MONGODB_ATLAS_PRIVATE_API_KEY="${ATLAS_PRIVATE_KEY:-}"
export MONGODB_ATLAS_ORG_ID="${ATLAS_ORG_ID:-}" MONGODB_ATLAS_PROJECT_ID="${ATLAS_PROJECT_ID:-}"
if command -v atlas >/dev/null 2>&1; then A(){ atlas "$@"; }
else say "atlas CLI not on the host; running it inside the box"; A(){ "$ROOT/infra/batteries/box/box.sh" exec atlas "$@"; }; fi
need_jq(){ command -v jq >/dev/null || die "jq missing (brew install jq)"; }

auth(){
  if [[ -n "${ATLAS_CLIENT_ID:-}" || -n "${ATLAS_PUBLIC_KEY:-}" ]]; then say "auth: keys from .env"; return; fi
  if A auth whoami >/dev/null 2>&1; then say "auth: logged in"; else say "auth: atlas auth login (device flow)"; A auth login --noBrowser; fi
}
project(){
  need_jq
  if [[ -z "${ATLAS_PROJECT_ID:-}" ]]; then
    ATLAS_PROJECT_ID="$(A projects list -o json ${ATLAS_ORG_ID:+--orgId "$ATLAS_ORG_ID"} | jq -r --arg n "$NAME" '.results[]? | select(.name==$n) | .id' | head -1)"
    if [[ -z "$ATLAS_PROJECT_ID" ]]; then
      [[ -n "${ATLAS_ORG_ID:-}" ]] || die "ATLAS_ORG_ID unset: the Sandbox org id from the hackathon email (Atlas → Organization settings)"
      say "project: creating '$NAME' in org $ATLAS_ORG_ID"
      ATLAS_PROJECT_ID="$(A projects create "$NAME" --orgId "$ATLAS_ORG_ID" -o json | jq -r .id)"
    fi
  fi
  export MONGODB_ATLAS_PROJECT_ID="$ATLAS_PROJECT_ID"; say "project: $NAME = $ATLAS_PROJECT_ID"
}
cluster(){
  if A clusters describe "$CLUSTER" --projectId "$ATLAS_PROJECT_ID" >/dev/null 2>&1; then say "cluster: $CLUSTER exists"
  else say "cluster: creating $CLUSTER ($TIER $PROVIDER $REGION)"; A clusters create "$CLUSTER" --projectId "$ATLAS_PROJECT_ID" --provider "$PROVIDER" --region "$REGION" --tier "$TIER"; fi
  say "cluster: waiting for IDLE"; A clusters watch "$CLUSTER" --projectId "$ATLAS_PROJECT_ID"
}
dbuser(){
  if A dbusers describe "$DBUSER" --projectId "$ATLAS_PROJECT_ID" >/dev/null 2>&1; then say "dbuser: $DBUSER exists (password kept from .env)"; [[ -n "${ATLAS_DBPASS:-}" ]] || say "dbuser: ATLAS_DBPASS unset; set it in .env or rotate with: atlas dbusers update $DBUSER --password …"
  else ATLAS_DBPASS="${ATLAS_DBPASS:-$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 24)}"
       say "dbuser: creating $DBUSER (readWriteAnyDatabase)"; A dbusers create --username "$DBUSER" --password "$ATLAS_DBPASS" --role readWriteAnyDatabase --projectId "$ATLAS_PROJECT_ID"; fi
}
access(){
  say "access: this machine's IP (the box egresses through it)"; A accessLists create --currentIp --projectId "$ATLAS_PROJECT_ID" 2>/dev/null || say "access: current ip already listed"
  if [[ "${ATLAS_OPEN_ACCESS:-0}" == 1 ]]; then say "access: 0.0.0.0/0 (ATLAS_OPEN_ACCESS=1: the Cloudflare worker has no fixed IP)"; A accessLists create --cidr 0.0.0.0/0 --projectId "$ATLAS_PROJECT_ID" 2>/dev/null || true; fi
}
uri(){
  need_jq; local srv; srv="$(A clusters connectionStrings describe "$CLUSTER" --projectId "$ATLAS_PROJECT_ID" -o json | jq -r .standardSrv)"
  [[ -n "$srv" && "$srv" != null ]] || die "no standardSrv yet; cluster still provisioning?"
  ATLAS_URI="${srv/mongodb+srv:\/\//mongodb+srv://$DBUSER:${ATLAS_DBPASS:-<ATLAS_DBPASS>}@}/$DB?retryWrites=true&w=majority"
  if [[ "${1:-}" == --show ]]; then echo "$ATLAS_URI"; else echo "${ATLAS_URI/$DBUSER:*@/$DBUSER:…@}"; fi
}
write_env(){ # replace-or-append KEY=VALUE in .env
  local k="$1" v="$2" f="$ROOT/.env"; touch "$f"
  if grep -q "^$k=" "$f"; then sed -i.bak -E "s|^$k=.*|$k=$v|" "$f" && rm -f "$f.bak"; else printf '%s=%s\n' "$k" "$v" >> "$f"; fi
}
up(){
  auth; project; cluster; dbuser; access; local u; u="$(uri --show)"
  say "uri: $(uri)"
  if [[ "${1:-}" == --write ]]; then write_env ATLAS_URI "$u"; write_env ATLAS_PROJECT_ID "$ATLAS_PROJECT_ID"; write_env ATLAS_DBPASS "$ATLAS_DBPASS"; say "wrote ATLAS_URI, ATLAS_PROJECT_ID, ATLAS_DBPASS to .env"
  else say "re-run with --write to put ATLAS_URI in .env"; fi
  if command -v mongosh >/dev/null; then say "ping"; mongosh "$u" --quiet --eval 'print("ok="+db.runCommand({ping:1}).ok)'; fi
}
status(){ auth; project; A clusters list --projectId "$ATLAS_PROJECT_ID"; A dbusers list --projectId "$ATLAS_PROJECT_ID"; A accessLists list --projectId "$ATLAS_PROJECT_ID"; }
scale(){ # scale <tier>: the only lever below M10. Same call the MCP tool atlas-upgrade-cluster makes.
  local tier="${1:-}"; [[ -n "$tier" ]] || die "scale <FLEX|M10|M20|…>"
  auth; project
  say "scale: $CLUSTER → $tier (Free/Flex scaling takes 7-10 minutes of downtime; M10+ bills hourly)"
  A clusters upgrade "$CLUSTER" --projectId "$ATLAS_PROJECT_ID" --tier "$tier"
  A clusters watch "$CLUSTER" --projectId "$ATLAS_PROJECT_ID"
}
autoscale(){ # autoscale on|off [min] [max]: dedicated tiers only (M10+)
  local on="${1:-on}" min="${2:-M10}" max="${3:-M20}" f; f="$(mktemp)"
  auth; project
  [[ "$on" == on ]] && on=true || on=false
  printf '{"replicationSpecs":[{"regionConfigs":[{"autoScaling":{"compute":{"enabled":%s,"scaleDownEnabled":%s,"minInstanceSize":"%s","maxInstanceSize":"%s"},"diskGB":{"enabled":true}}}]}]}\n' "$on" "$on" "$min" "$max" > "$f"
  say "autoscale: compute=$on $min..$max, disk=true on $CLUSTER"
  A api clusters updateCluster --version 2024-10-23 --clusterName "$CLUSTER" --groupId "$ATLAS_PROJECT_ID" --file "$f"; rm -f "$f"
}
case "${1:-help}" in
  up) up "${2:-}" ;; status) status ;; uri) auth; project; uri "${2:-}" ;;
  scale) scale "${2:-}" ;; autoscale) autoscale "${2:-on}" "${3:-M10}" "${4:-M20}" ;;
  *) sed -n '2,14p' "$0" ;;
esac
