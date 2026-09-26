/**
 * `3pt keys` — the terminal door to the same keys the key page edits (GET /keys on the local API).
 *   3pt keys status                 every key: where it lives, set or missing, last 4 characters
 *   3pt keys set <NAME>             read the value from stdin (hidden when typed; or `pbpaste | 3pt keys set NAME`)
 *   3pt keys import <file>          one-time move of an old .env: Atlas parts → Keychain, API keys → Atlas vault. Prints names only.
 * Values never go on argv and are never printed.
 */
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { createInterface } from 'node:readline';
import { KEYCHAIN_NAMES, VAULT_NAMES, keychainEnv, keychainGet, keychainSet, putSecret, vaultStatus, type KeychainName } from '@3pt/battery-atlas';

const isKeychain = (n: string): n is KeychainName => (KEYCHAIN_NAMES as readonly string[]).includes(n);
const env = () => ({ ...keychainEnv(), ...process.env });

async function readHidden(prompt: string): Promise<string> {
  if (!process.stdin.isTTY) { const c: Buffer[] = []; for await (const b of process.stdin) c.push(b as Buffer); return Buffer.concat(c).toString('utf8').trim(); }
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
  process.stdout.write(prompt);
  out._writeToOutput = () => {};                       // mute the echo
  const v = await new Promise<string>((r) => rl.question('', r));
  rl.close(); process.stdout.write('\n');
  return v.trim();
}

async function store(name: string, value: string) {
  if (isKeychain(name)) keychainSet(name, value);
  else if (VAULT_NAMES.includes(name)) await putSecret(env(), name, value);
  else throw new Error(`unknown key ${name}. Keychain: ${KEYCHAIN_NAMES.join(' ')} · Vault: ${VAULT_NAMES.join(' ')}`);
}

export async function keysCommand(args: string[]) {
  const [sub = 'status', name] = args;
  if (sub === 'status') {
    for (const n of KEYCHAIN_NAMES) console.log(`keychain  ${n.padEnd(20)} ${keychainGet(n) ? 'set' : '—'}${process.env[n] ? '  (host env overrides)' : ''}`);
    try {
      for (const s of await vaultStatus(env())) console.log(`vault     ${s.name.padEnd(20)} ${s.set ? `set …${s.last4}  ${s.updatedAt}` : '—'}${process.env[s.name] ? '  (host env overrides)' : ''}`);
    } catch (e) { console.log(`vault     unavailable: ${(e as Error).message}`); }
    return;
  }
  if (sub === 'set' && name) {
    const v = await readHidden(`${name}: `);
    if (!v) throw new Error('empty value; nothing stored');
    await store(name, v);
    console.log(`stored ${name} (${isKeychain(name) ? 'Keychain' : 'Atlas vault, encrypted'})`);
    return;
  }
  if (sub === 'import' && name) {
    const parsed = parseEnv(readFileSync(name, 'utf8'));
    const all = [...KEYCHAIN_NAMES, ...VAULT_NAMES];
    // Keychain first: the vault needs the Atlas parts to connect.
    for (const n of all.filter(isKeychain)) { const v = parsed[n]?.trim(); if (v && !v.includes('<')) { keychainSet(n, v); console.log(`keychain  ${n}`); } }
    for (const n of VAULT_NAMES) { const v = parsed[n]?.trim(); if (v && !v.includes('<')) { await putSecret(env(), n, v); console.log(`vault     ${n}`); } }
    console.log(`done. Check with \`3pt keys status\`, then delete ${name}.`);
    return;
  }
  console.log('3pt keys <status | set NAME | import FILE>');
}
