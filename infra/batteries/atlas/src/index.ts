/** @3pt/battery-atlas — the only place the Sandbox cluster is named. Stages get a Store; they never see a URI. */
import { COLLECTIONS, type CollectionName } from '@3pt/core';
export { atlasStore, type AtlasStore } from './store.js';

/** The connection string: ATLAS_URI when it is real, else composed from ATLAS_HOST + ATLAS_DBUSER + ATLAS_DBPASS (+ ATLAS_DB).
 *  A placeholder from .env.example (contains `<`) counts as unset. Returns undefined when nothing usable is set. */
export function atlasUri(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const raw = env.ATLAS_URI?.trim();
  if (raw && !raw.includes('<')) return raw;
  const host = env.ATLAS_HOST?.trim(), user = env.ATLAS_DBUSER?.trim(), pass = env.ATLAS_DBPASS?.trim();
  if (!host || !user || !pass) return undefined;
  const db = env.ATLAS_DB?.trim() || '3pt';
  return `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}/${db}?retryWrites=true&w=majority&appName=${env.ATLAS_CLUSTER?.trim() || '3pt'}`;
}

export interface IndexSpec { collection: CollectionName; keys: Record<string, 1 | -1 | 'text'>; unique?: boolean }
export const INDEXES: IndexSpec[] = [
  { collection: COLLECTIONS.policies,     keys: { version: -1 }, unique: true },
  { collection: COLLECTIONS.checkpoints,  keys: { iteration: -1 }, unique: true },
  { collection: COLLECTIONS.checkpoints,  keys: { tag: 1 }, unique: true },
  { collection: COLLECTIONS.plans,        keys: { iteration: -1 } },
  { collection: COLLECTIONS.measurements, keys: { iteration: -1, metric: 1 } },
  { collection: COLLECTIONS.findings,     keys: { iteration: -1, check: 1 } },
  { collection: COLLECTIONS.media_index,  keys: { assetId: 1 }, unique: true },
  { collection: COLLECTIONS.media_index,  keys: { tier: 1, lastRead: -1 } },
  { collection: COLLECTIONS.transcripts,  keys: { assetId: 1 }, unique: true },
  { collection: COLLECTIONS.jobs,         keys: { status: 1, createdAt: 1 } },
];
/** Atlas Vector Search definition over transcripts (Voyage voyage-3, 1024 dims). Created by provision(). */
export const VECTOR_INDEX = { name: 'transcripts_vec', collection: COLLECTIONS.transcripts, field: 'embedding', dims: 1024, similarity: 'cosine' } as const;

export const battery = {
  name: 'atlas',
  provides: ['atlas.find', 'atlas.latest', 'atlas.insert', 'atlas.*', 'policy.write', 'atlas.scale'],   // atlas.scale: sandbox.sh scale / MCP atlas-upgrade-cluster (docs/17 §4)
  env: ['ATLAS_URI', 'ATLAS_HOST', 'ATLAS_DBUSER', 'ATLAS_DBPASS', 'ATLAS_DB', 'ATLAS_CLUSTER', 'ATLAS_ORG_ID', 'ATLAS_PROJECT_ID', 'ATLAS_CLIENT_ID', 'ATLAS_CLIENT_SECRET', 'ATLAS_PUBLIC_KEY', 'ATLAS_PRIVATE_KEY'],
  mcp: 'mongodb-mcp-server (see mcp.json); the Sandbox cluster itself via sandbox.sh (Atlas CLI)',
} as const;
