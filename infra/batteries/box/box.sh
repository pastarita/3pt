#!/usr/bin/env bash
# 3PT · battery-box · the deterministic flow. docs/14-sandbox-provisioning.md §2
#   box.sh up             guard → vm → ping → play (every role) → verify
#   box.sh vm             start the Colima profile (create it on first run)
#   box.sh ping           Ansible ping over the generated inventory
#   box.sh play [roles]   converge; roles = comma list of base,node,atlas_tools,atlas_local,workload,signals (default: all)
#   box.sh verify         tool versions inside the box; Atlas ping when ATLAS_URI is set
#   box.sh status         profile state, host free disk, box free disk
#   box.sh exec <cmd…>    run a command inside the box from /opt/3pt with its .env loaded (the box.exec grant)
#   box.sh ssh            interactive shell
#   box.sh down           stop the VM (state kept)
#   box.sh destroy        delete the profile after confirmation
# Env (all optional, read from .env): BOX_PROFILE BOX_CPU BOX_MEMORY BOX_DISK BOX_ATLAS_LOCAL BOX_REPO_MODE
#   BOX_REPO_URL BOX_REPO_REF BOX_MIN_FREE_GB BOX_NEW_MIN_FREE_GB BOX_FORCE
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
# .env is KEY=VALUE lines, not shell: a placeholder like <user> must not become a redirection (sourcing it did, 2026-09-26 14:50).
load_env(){ local k v; while IFS= read -r line || [[ -n "$line" ]]; do
  [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || continue; k="${BASH_REMATCH[1]}"; v="${BASH_REMATCH[2]}"
  v="${v%%[[:space:]]#*}"; v="${v%"${v##*[![:space:]]}"}"; v="${v#\"}"; v="${v%\"}"; v="${v#'}"; v="${v%'}"
  [[ -n "${!k:-}" ]] || export "$k=$v"; done < "$1"; }
if [[ -f "$ROOT/.env" ]]; then load_env "$ROOT/.env"; fi
PROFILE="${BOX_PROFILE:-3pt}"; CPU="${BOX_CPU:-2}"; MEM="${BOX_MEMORY:-4}"; DISK="${BOX_DISK:-20}"
MIN_FREE="${BOX_MIN_FREE_GB:-2}"; NEW_MIN_FREE="${BOX_NEW_MIN_FREE_GB:-8}"
ATLAS_LOCAL="${BOX_ATLAS_LOCAL:-0}"; REPO_MODE="${BOX_REPO_MODE:-sync}"
ANS="$HERE/ansible"; INV="$ANS/.inventory.ini"; SSHCFG="$ANS/.ssh_config"; VARS="$ANS/.vars.json"

say(){ printf '\033[1m[box] %s\033[0m\n' "$*"; }
die(){ printf '[box] %s\n' "$*" >&2; exit 1; }
need(){ command -v "$1" >/dev/null 2>&1 || die "$1 missing — $2"; }
free_gb(){ df -g "$HOME" | awk 'NR==2{print $4}'; }

# Ansible: a global install if present, else ansible-core through uvx (no global install, ~30 MB cached).
if command -v ansible-playbook >/dev/null 2>&1; then PLAYBOOK=(ansible-playbook); ADHOC=(ansible)
else need uvx "install uv (https://docs.astral.sh/uv/) or ansible-core"; PLAYBOOK=(uvx --from ansible-core ansible-playbook); ADHOC=(uvx --from ansible-core ansible); fi

guard(){ # guard <floor-GB> <why>
  local floor="$1" why="${2:-}" f; f="$(free_gb)"
  say "guard: host free ${f}G, floor ${floor}G ${why:+($why)}"
  if (( f < floor )); then [[ "${BOX_FORCE:-0}" == 1 ]] || die "host free disk ${f}G is under the ${floor}G floor. Free space, lower BOX_MIN_FREE_GB, or BOX_FORCE=1."; fi
}
profile_exists(){ colima list -j 2>/dev/null | grep -Eq "\"name\": ?\"$PROFILE\""; }
running(){ colima status -p "$PROFILE" >/dev/null 2>&1; }

vm(){
  need colima "brew install colima docker"
  if running; then say "vm: profile '$PROFILE' running"; return; fi
  if profile_exists; then
    guard "$MIN_FREE" "start existing profile"
    say "vm: starting existing profile '$PROFILE' (cpu $CPU, mem ${MEM}G)"
    colima start -p "$PROFILE" --cpu "$CPU" --memory "$MEM"
  else
    guard "$NEW_MIN_FREE" "create a new profile: base image + diff disk"
    say "vm: creating profile '$PROFILE' (cpu $CPU, mem ${MEM}G, disk ${DISK}G sparse, vz/virtiofs, docker)"
    colima start -p "$PROFILE" --cpu "$CPU" --memory "$MEM" --disk "$DISK" --vm-type vz --mount-type virtiofs --runtime docker
  fi
}

inventory(){ # generated, gitignored: the ssh config Lima wrote, and one host that uses it
  running || die "profile '$PROFILE' is not running; box.sh vm"
  colima ssh-config -p "$PROFILE" > "$SSHCFG"
  local host user; host="$(awk '/^Host /{print $2; exit}' "$SSHCFG")"; user="$(awk '/^ *User /{print $2; exit}' "$SSHCFG")"
  printf '[box]\n%s ansible_user=%s ansible_ssh_common_args=%q ansible_python_interpreter=/usr/bin/python3\n' "$host" "$user" "-F $SSHCFG" > "$INV"
  ROOT="$ROOT" REPO_MODE="$REPO_MODE" ATLAS_LOCAL="$ATLAS_LOCAL" SSHCFG="$SSHCFG" VARS="$VARS" node -e '
    const e=process.env; const j={
      repo_root: e.ROOT, repo_mode: e.REPO_MODE, repo_url: e.BOX_REPO_URL||"", repo_ref: e.BOX_REPO_REF||"main",
      atlas_local: e.ATLAS_LOCAL==="1", ssh_config: e.SSHCFG, worker_service: (e.BOX_WORKER_SERVICE||"1")==="1",
      pnpm_version: "12.6.0", node_major: "22" };
    require("fs").writeFileSync(e.VARS, JSON.stringify(j,null,2)+"\n");'
  echo "$host"
}

ping(){ local h; h="$(inventory)"; say "ping: $h"; ANSIBLE_CONFIG="$ANS/ansible.cfg" "${ADHOC[@]}" -i "$INV" box -m ping; }

play(){ # play [roles]
  local tags="${1:-}"; inventory >/dev/null
  if [[ "$ATLAS_LOCAL" == 1 ]]; then guard 4 "Atlas Local image is ~1 GB inside the VM"; fi
  say "play: ${tags:-all roles} (repo=$REPO_MODE atlasLocal=$ATLAS_LOCAL)"
  ANSIBLE_CONFIG="$ANS/ansible.cfg" "${PLAYBOOK[@]}" -i "$INV" "$ANS/site.yml" -e "@$VARS" ${tags:+--tags "$tags"}
}

box_exec(){ # run inside the box from /opt/3pt with its .env loaded
  inventory >/dev/null; local host; host="$(awk '/^Host /{print $2; exit}' "$SSHCFG")"
  ssh -q -F "$SSHCFG" "$host" -- bash -lc "$(printf '%q ' "$(declare -f load_env); cd /opt/3pt 2>/dev/null && [ -f .env ] && load_env .env; $*")"
}

verify(){
  say "verify: toolbelt"
  box_exec 'for t in node pnpm mongosh atlas mongoimport docker; do printf "  %-12s %s\n" "$t" "$(command -v $t >/dev/null && ($t --version 2>/dev/null | head -1) || echo MISSING)"; done'
  say "verify: workload"
  box_exec 'ls /opt/3pt/harness/apps/worker/dist/main.js >/dev/null && echo "  worker built" || echo "  worker NOT built"; systemctl is-active 3pt-worker 2>/dev/null | sed "s/^/  3pt-worker: /" || true'
  say "verify: signals"
  box_exec 'systemctl is-active 3pt-signals 2>/dev/null | sed "s/^/  3pt-signals: /" || true; sudo SIGNALS_DB=/var/lib/3pt/signals.db node infra/batteries/signals/dist/agent.js --status 2>/dev/null | node -e "let s=\"\";process.stdin.on(\"data\",d=>s+=d).on(\"end\",()=>{try{const j=JSON.parse(s);console.log(\"  store \"+j.events+\" events: \"+j.kinds.map(k=>k.kind+\"=\"+k.n).join(\" \")+\" · cursors \"+(j.cursors.map(c=>c.name+\"@\"+c.pos).join(\" \")||\"-\"))}catch{console.log(\"  store: not readable\")}})"'
  say "verify: atlas"
  box_exec 'if [ -n "${ATLAS_URI:-}" ] && [[ "$ATLAS_URI" != *"<"* ]]; then mongosh "$ATLAS_URI" --quiet --eval "const r=db.runCommand({ping:1}); print(\"  ping ok=\"+r.ok+\" host=\"+db.getMongo().getURI().replace(/\\/\\/.*@/,\"//…@\"))"; else echo "  ATLAS_URI unset — no cluster to ping (infra/batteries/atlas/sandbox.sh)"; fi'
}

status(){
  say "status: profile '$PROFILE'"; colima list 2>/dev/null | awk -v p="$PROFILE" 'NR==1||$1==p'
  say "status: host free $(free_gb)G (floor ${MIN_FREE}G, new-profile floor ${NEW_MIN_FREE}G)"
  if running; then say "status: box"; box_exec 'df -h / | awk "NR==2{print \"  disk \" \$3 \" used of \" \$2}"; free -m | awk "NR==2{print \"  mem  \" \$3 \"M used of \" \$2 \"M\"}"'; fi
}

case "${1:-help}" in
  up)      vm; ping; play; verify ;;
  vm)      vm ;;
  ping)    ping ;;
  play)    play "${2:-}" ;;
  verify)  verify ;;
  status)  status ;;
  exec)    shift; box_exec "$@" ;;
  ssh)     colima ssh -p "$PROFILE" ;;
  down)    colima stop -p "$PROFILE" ;;
  destroy) read -r -p "[box] delete Colima profile '$PROFILE' and its disk? [y/N] " a; [[ "$a" == y ]] && colima delete -p "$PROFILE" -f ;;
  *)       sed -n '2,15p' "$0" ;;
esac
