/**
 * API keys in Atlas, encrypted client-side with MongoDB CSFLE explicit encryption.
 *
 *   key page / `3pt keys set` → ClientEncryption.encrypt(value, DEK) → 3pt.secrets {name, value: BinData}
 *   DEK (data key) lives in encryption.__keyVault, wrapped by the master key; the master key is 96 random
 *   bytes in the macOS Keychain (THREEPT_MASTER_KEY). Atlas never holds a plaintext key.
 *
 * KMS provider is `local` (free). For enterprise, swap it for aws / azure / gcp / kmip in kmsProviders()
 * and createDataKey(); nothing else changes. Lose the master key and the stored values are unreadable:
 * paste them again.
 */
import { randomBytes } from 'node:crypto';
import { ClientEncryption, MongoClient, type Binary } from 'mongodb';
import { COLLECTIONS, SECRET_NAMES } from '@3pt/core';
import { atlasUri } from './index.js';
import { keychainEnv, keychainGet, keychainSet } from './keychain.js';

const KEY_VAULT_DB = 'encryption', KEY_VAULT_COLL = '__keyVault';
const DEK_NAME = '3pt-secrets';
const ALGORITHM = 'AEAD_AES_256_CBC_HMAC_SHA_512-Random' as const;
export const VAULT_NAMES: readonly string[] = Object.values(SECRET_NAMES);

interface SecretDoc { name: string; value: Binary; last4: string; updatedAt: string }
export interface SecretStatus { name: string; set: boolean; last4?: string; updatedAt?: string }

function masterKey(create: boolean): Buffer | undefined {
  const b64 = keychainGet('THREEPT_MASTER_KEY');
  if (b64) return Buffer.from(b64, 'base64');
  if (!create) return undefined;
  const k = randomBytes(96);
  keychainSet('THREEPT_MASTER_KEY', k.toString('base64'));
  return k;
}

async function open<T>(env: Record<string, string | undefined>, create: boolean, fn: (v: { ce: ClientEncryption; keyId: Binary; coll: ReturnType<ReturnType<MongoClient['db']>['collection']> }) => Promise<T>): Promise<T | undefined> {
  const uri = atlasUri(env as NodeJS.ProcessEnv);
  const mk = masterKey(create);
  if (!uri || !mk) return undefined;
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
    const kv = client.db(KEY_VAULT_DB).collection(KEY_VAULT_COLL);
    const ce = new ClientEncryption(client, { keyVaultNamespace: `${KEY_VAULT_DB}.${KEY_VAULT_COLL}`, kmsProviders: { local: { key: mk } } });
    let dek = await ce.getKeyByAltName(DEK_NAME);
    if (!dek && create) {
      // MongoDB's rule for a key vault: keyAltNames unique where present.
      await kv.createIndex({ keyAltNames: 1 }, { unique: true, partialFilterExpression: { keyAltNames: { $exists: true } } });
      await ce.createDataKey('local', { keyAltNames: [DEK_NAME] });
      dek = await ce.getKeyByAltName(DEK_NAME);
    }
    if (!dek) return undefined;
    const coll = client.db(env.ATLAS_DB || '3pt').collection(COLLECTIONS.secrets);
    return await fn({ ce, keyId: dek._id as Binary, coll });
  } finally {
    await client.close();
  }
}

/** Encrypt and store one key. Creates the master key and the data key on first use. */
export async function putSecret(env: Record<string, string | undefined>, name: string, value: string): Promise<void> {
  if (!VAULT_NAMES.includes(name)) throw new Error(`vault: unknown key ${name}`);
  const done = await open(env, true, async ({ ce, keyId, coll }) => {
    const enc = await ce.encrypt(value, { keyId, algorithm: ALGORITHM });
    await coll.updateOne({ name }, { $set: { name, value: enc, last4: value.slice(-4), updatedAt: new Date().toISOString() } }, { upsert: true });
    return true;
  });
  if (!done) throw new Error('vault: no Atlas connection; set the Atlas parts first');
}

export async function deleteSecret(env: Record<string, string | undefined>, name: string): Promise<void> {
  await open(env, false, async ({ coll }) => coll.deleteOne({ name }));
}

/** Names, last 4 characters, and dates. Never decrypts. */
export async function vaultStatus(env: Record<string, string | undefined>): Promise<SecretStatus[]> {
  const docs = (await open(env, false, async ({ coll }) => coll.find({}, { projection: { value: 0 } }).toArray())) as unknown as Omit<SecretDoc, 'value'>[] | undefined;
  return VAULT_NAMES.map((name) => {
    const d = docs?.find((x) => x.name === name);
    return d ? { name, set: true, last4: d.last4, updatedAt: d.updatedAt } : { name, set: false };
  });
}

/** Every stored key, decrypted. Called once per process, at the edge (loadKeys). */
export async function vaultRead(env: Record<string, string | undefined>): Promise<Record<string, string>> {
  const out = await open(env, false, async ({ ce, coll }) => {
    const r: Record<string, string> = {};
    for (const d of (await coll.find({}).toArray()) as unknown as SecretDoc[]) r[d.name] = String(await ce.decrypt(d.value));
    return r;
  });
  return out ?? {};
}

/**
 * The key injector's source. Order, last wins: vault (Atlas) ← keychain ← process.env.
 * The host's own env wins so CI, the box and the Worker can inject without a keychain.
 * No .env file is read.
 */
export async function loadKeys(log: (l: string) => void = () => {}): Promise<Record<string, string | undefined>> {
  const base: Record<string, string | undefined> = { ...keychainEnv(), ...process.env };
  try {
    const vault = await vaultRead(base);
    if (Object.keys(vault).length) log(`[keys] ${Object.keys(vault).length} key(s) from the Atlas vault`);
    return { ...vault, ...base };
  } catch (e) {
    log(`[keys] vault unavailable (${(e as Error).message}); using keychain and host env only`);
    return base;
  }
}
