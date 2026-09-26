/**
 * The bootstrap keys, in the macOS Keychain (service "3pt", account = the key's name). No .env.
 * Only what is needed to reach Atlas and open the vault lives here: the Atlas parts and the
 * vault's master key. Every other key lives in Atlas, encrypted (vault.ts).
 * Off macOS (the box, CI, the Worker) the keychain is empty and the host injects env by its own
 * secret store: systemd credentials, GitHub Actions secrets, `wrangler secret put`.
 */
import { spawnSync } from 'node:child_process';

const SERVICE = '3pt';
/** Names the keychain may hold. The key page and `3pt keys` write only these. */
export const KEYCHAIN_NAMES = ['ATLAS_URI', 'ATLAS_HOST', 'ATLAS_DBUSER', 'ATLAS_DBPASS', 'ATLAS_DB', 'ATLAS_CLUSTER', 'THREEPT_MASTER_KEY'] as const;
export type KeychainName = (typeof KEYCHAIN_NAMES)[number];

const onMac = process.platform === 'darwin';

export function keychainGet(name: KeychainName): string | undefined {
  if (!onMac) return undefined;
  const r = spawnSync('security', ['find-generic-password', '-s', SERVICE, '-a', name, '-w'], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.replace(/\n$/, '') || undefined : undefined;
}

/** -U updates in place. The value goes on argv, which only this user's processes can read, for the life of one `security` call. */
export function keychainSet(name: KeychainName, value: string): void {
  if (!onMac) throw new Error('keychain: macOS only; on this host inject the value through the host secret store');
  const r = spawnSync('security', ['add-generic-password', '-U', '-s', SERVICE, '-a', name, '-l', `3pt ${name}`, '-w', value], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`keychain: could not store ${name}: ${r.stderr.trim()}`);
}

export function keychainDelete(name: KeychainName): void {
  if (onMac) spawnSync('security', ['delete-generic-password', '-s', SERVICE, '-a', name]);
}

/** Every keychain value that is set, as an env-shaped record. */
export function keychainEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const n of KEYCHAIN_NAMES) { const v = keychainGet(n); if (v) out[n] = v; }
  return out;
}
