/** Idempotent stand-up of the 3pt database: collections, indexes, the transcripts vector index. Needs ATLAS_URI; prints the plan without it.
 *  Works against the Sandbox cluster and against Atlas Local (both accept createSearchIndex). docs/16-sandbox-provisioning.md §3. */
import { MongoClient } from 'mongodb';
import { COLLECTIONS } from '@3pt/core';
import { INDEXES, VECTOR_INDEX, atlasUri } from './index.js';

const uri = atlasUri();
const dbName = process.env.ATLAS_DB ?? '3pt';
const mask = (u: string) => u.replace(/\/\/[^@]*@/, '//…@');
console.log(`[atlas] db=${dbName} ${uri ? `uri=${mask(uri)}` : '(no ATLAS_URI or ATLAS_HOST+ATLAS_DBUSER+ATLAS_DBPASS — plan only)'}`);
for (const c of Object.values(COLLECTIONS)) console.log(`[atlas] ensure collection ${c}`);
for (const i of INDEXES) console.log(`[atlas] ensure index ${i.collection} ${JSON.stringify(i.keys)}${i.unique ? ' unique' : ''}`);
console.log(`[atlas] ensure vector index ${VECTOR_INDEX.name} on ${VECTOR_INDEX.collection}.${VECTOR_INDEX.field} (${VECTOR_INDEX.dims}d ${VECTOR_INDEX.similarity})`);
if (!uri) process.exit(0);

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15_000 });
await client.connect();
const db = client.db(dbName);
const hello = await db.command({ hello: 1 });
console.log(`[atlas] connected: ${hello.me ?? hello.primary ?? 'ok'}${hello.setName ? ` rs=${hello.setName}` : ''}`);
const have = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map(c => c.name));
for (const c of Object.values(COLLECTIONS)) if (!have.has(c)) { await db.createCollection(c); console.log(`[atlas] created ${c}`); }
for (const i of INDEXES) await db.collection(i.collection).createIndex(i.keys as any, { unique: i.unique ?? false, ...(i.expireAfterSeconds === undefined ? {} : { expireAfterSeconds: i.expireAfterSeconds }) });
console.log(`[atlas] ${INDEXES.length} indexes ensured`);
try {
  const existing = await db.collection(VECTOR_INDEX.collection).listSearchIndexes().toArray();
  if (!existing.some(s => s.name === VECTOR_INDEX.name)) {
    await db.collection(VECTOR_INDEX.collection).createSearchIndex({
      name: VECTOR_INDEX.name, type: 'vectorSearch',
      definition: { fields: [{ type: 'vector', path: VECTOR_INDEX.field, numDimensions: VECTOR_INDEX.dims, similarity: VECTOR_INDEX.similarity }] },
    });
    console.log(`[atlas] created vector index ${VECTOR_INDEX.name}`);
  } else console.log(`[atlas] vector index ${VECTOR_INDEX.name} present`);
} catch (e) {
  console.log(`[atlas] vector index skipped: ${(e as Error).message.split('\n')[0]} (needs an Atlas cluster or Atlas Local)`);
}
await client.close();
console.log('[atlas] ok');
