/** @3pt/battery-box — the machine the workload runs on. docs/14-sandbox-provisioning.md.
 *  A box is a Colima VM (Ubuntu, Docker runtime) that `box.sh` starts and `ansible/site.yml` converges.
 *  Stages never see a box; they see the tool grants below, which Instrument may hand to Build. */

export type RepoMode = 'sync' | 'clone';

export interface BoxSpec {
  profile: string;        // Colima profile name; `default` reuses the profile already on this machine
  cpu: number;
  memoryGiB: number;
  diskGiB: number;        // allocated (sparse); only written blocks cost host disk
  atlasLocal: boolean;    // also stand up Atlas Local (Search + Vector Search offline) inside the box
  repoMode: RepoMode;     // sync = rsync this checkout into the box; clone = git clone BOX_REPO_URL@BOX_REPO_REF
  minFreeGB: number;      // host free-disk floor before any phase that writes to the VM disk
}

export function boxSpec(env: NodeJS.ProcessEnv = process.env): BoxSpec {
  return {
    profile: env.BOX_PROFILE ?? '3pt',
    cpu: Number(env.BOX_CPU ?? 2),
    memoryGiB: Number(env.BOX_MEMORY ?? 4),
    diskGiB: Number(env.BOX_DISK ?? 20),
    atlasLocal: env.BOX_ATLAS_LOCAL === '1',
    repoMode: (env.BOX_REPO_MODE as RepoMode) ?? 'sync',
    minFreeGB: Number(env.BOX_MIN_FREE_GB ?? 2),
  };
}

/** The deterministic flow, in order. `box.sh up` runs all of them; `box.sh play <role>` runs one role. */
export const PHASES = ['guard', 'vm', 'ping', 'base', 'node', 'atlas_tools', 'atlas_local', 'workload', 'verify'] as const;
export type Phase = (typeof PHASES)[number];

export const battery = {
  name: 'box',
  provides: ['box.up', 'box.exec', 'box.status', 'box.down'],
  env: ['BOX_PROFILE', 'BOX_CPU', 'BOX_MEMORY', 'BOX_DISK', 'BOX_ATLAS_LOCAL', 'BOX_REPO_MODE', 'BOX_REPO_URL', 'BOX_REPO_REF', 'BOX_MIN_FREE_GB'],
  mcp: 'mongodb-mcp-server with an Atlas service account (see mcp.json): the provisioning MCP',
} as const;
