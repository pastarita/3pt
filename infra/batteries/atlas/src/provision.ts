/** Idempotent: creates collections and indexes that do not exist yet. Needs ATLAS_URI. Uses the driver once it is added. */
import { COLLECTIONS } from '@3pt/core';
import { INDEXES, VECTOR_INDEX } from './index.js';
const uri = process.env.ATLAS_URI;
if (!uri) { console.log('[atlas] ATLAS_URI unset — printing the plan only'); }
console.log(`[atlas] db=${process.env.ATLAS_DB ?? '3pt'}`);
for (const c of Object.values(COLLECTIONS)) console.log(`[atlas] ensure collection ${c}`);
for (const i of INDEXES) console.log(`[atlas] ensure index ${i.collection} ${JSON.stringify(i.keys)}${i.unique ? ' unique' : ''}`);
console.log(`[atlas] ensure vector index ${VECTOR_INDEX.name} on ${VECTOR_INDEX.collection}.${VECTOR_INDEX.field} (${VECTOR_INDEX.dims}d ${VECTOR_INDEX.similarity})`);
// TODO(lane 4): `pnpm --filter @3pt/battery-atlas add mongodb`, then MongoClient(uri).db().createCollection / createIndex / createSearchIndex.
