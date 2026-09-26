/** @3pt/battery-atlas — the only place the Sandbox cluster is named. Stages get a Store; they never see a URI. */
import { COLLECTIONS, type CollectionName } from '@3pt/core';
export { atlasStore, type AtlasStore } from './store.js';

export interface IndexSpec { collection: CollectionName; keys: Record<string, 1 | -1 | 'text'>; unique?: boolean }
export const INDEXES: IndexSpec[] = [
  { collection: COLLECTIONS.policies,     keys: { version: -1 }, unique: true },
  { collection: COLLECTIONS.checkpoints,  keys: { iteration: -1 }, unique: true },
  { collection: COLLECTIONS.checkpoints,  keys: { tag: 1 }, unique: true },
  { collection: COLLECTIONS.plans,        keys: { iteration: -1 } },
  { collection: COLLECTIONS.measurements, keys: { iteration: -1, metric: 1 } },
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
  env: ['ATLAS_URI', 'ATLAS_DB', 'ATLAS_CLUSTER', 'ATLAS_ORG_ID', 'ATLAS_PROJECT_ID', 'ATLAS_CLIENT_ID', 'ATLAS_CLIENT_SECRET', 'ATLAS_PUBLIC_KEY', 'ATLAS_PRIVATE_KEY'],
  mcp: 'mongodb-mcp-server (see mcp.json); the Sandbox cluster itself via sandbox.sh (Atlas CLI)',
} as const;
