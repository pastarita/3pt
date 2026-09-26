/** The real Store over the Sandbox cluster (or Atlas Local). Injected at the edge by apps/cli and apps/worker; stages never import this. */
import { MongoClient, type Document } from 'mongodb';
import type { CollectionName, Store } from '@3pt/core';

export interface AtlasStore extends Store { close(): Promise<void>; dbName: string }

export async function atlasStore(uri = process.env.ATLAS_URI, dbName = process.env.ATLAS_DB ?? '3pt'): Promise<AtlasStore> {
  if (!uri || uri.includes('<')) throw new Error('ATLAS_URI unset (infra/batteries/atlas/sandbox.sh writes it)');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 });
  await client.connect();
  const db = client.db(dbName);
  const col = (c: CollectionName) => db.collection<Document>(c);
  return {
    dbName,
    async insert(c, doc) { const r = await col(c).insertOne({ ...doc }); return { ...doc, _id: String(r.insertedId) }; },
    async latest(c, k) { const d = await col(c).find({}).sort({ [k]: -1 }).limit(1).next(); return d ? ({ ...d, _id: String(d._id) } as any) : null; },
    async find(c, f) { const rows = await col(c).find(f as Document).toArray(); return rows.map(d => ({ ...d, _id: String(d._id) })) as any; },
    close: () => client.close(),
  };
}
