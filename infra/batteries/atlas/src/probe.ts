import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { COLLECTIONS } from '@3pt/core';
import { atlasUri } from './index.js';

/** Real database authentication and a write → read → delete round trip, isolated to our own probe id. */
export async function probeAtlas(env: Record<string, string | undefined>) {
  const uri = atlasUri(env);
  if (!uri) return { status: 'missing' as const, code: 'missing', detail: 'Save the database connection, then test again.' };
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8_000, connectTimeoutMS: 8_000, timeoutMS: 12_000 });
  let phase = 'connect'; const id = randomUUID();
  try {
    await client.connect();
    const db = client.db(env.ATLAS_DB || '3pt');
    await db.command({ ping: 1 });
    const collection = db.collection<{ _id: string; at: Date }>(COLLECTIONS.health_checks);
    phase = 'write';
    await collection.insertOne({ _id: id, at: new Date() });
    try {
      phase = 'read';
      if (!await collection.findOne({ _id: id })) throw new Error('probe missing');
    } finally {
      const operation = phase; phase = 'cleanup';
      if ((await collection.deleteOne({ _id: id })).deletedCount !== 1) throw new Error('cleanup failed');
      phase = operation;
    }
    return { status: 'pass' as const, code: 'verified', detail: 'Authenticated. Database write, read and cleanup passed.' };
  } catch (error) {
    // Never return the driver message: it may include a connection string or host credentials.
    const e = error as { code?: number; message?: string };
    const auth = e.code === 18 || /authentication failed|bad auth/i.test(e.message ?? '');
    return { status: 'fail' as const, code: auth ? 'authentication' : e.code === 13 ? 'permission' : phase,
      detail: auth ? 'Database authentication was rejected. Check the database user and password.'
        : e.code === 13 ? 'The database user lacks the required read/write permissions.'
        : phase === 'cleanup' ? 'Could not remove the temporary check record. Check database permissions.'
        : phase === 'connect' ? 'Could not reach the database. Check its host, network access list and TLS connection.'
        : `The database ${phase} check failed. Check access to this database.` };
  } finally { await client.close(); }
}
