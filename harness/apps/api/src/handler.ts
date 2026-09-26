/** The API's routes, with no Node server or file access, so a Worker can run them too. */
import { COLLECTIONS, memoryStore, seedPolicy, type Store } from '@3pt/core';
import { handleSim } from './sim.js';
import { handleApp } from './app.js';

const store = memoryStore();
await store.insert(COLLECTIONS.policies, seedPolicy());

/** `db` is the durable store when the caller has one (the Worker passes Atlas); without it, state is in memory. */
export async function handle(url: URL, method = 'GET', body: Record<string, unknown> = {}, db?: Store): Promise<{ status: number; body: unknown }> {
  const app = await handleApp(url, method, body, db); if (app) return app;   /* screens composed by the harness, see app.ts */
  const sim = await handleSim(url); if (sim) return sim;                 /* the demo firm, see sim.ts */
  if (url.pathname === '/health') {
    const snap = db ? await db.latest<{ ts: number; why: string }>(COLLECTIONS.app_state, 'ts') : null;
    return { status: 200, body: { ok: true, at: new Date().toISOString(), store: db ? 'atlas' : 'memory', state_at: snap ? new Date(snap.ts).toISOString() : null, state_why: snap?.why ?? null } };
  }
  if (url.pathname === '/policies/latest') return { status: 200, body: await store.latest(COLLECTIONS.policies, 'version' as never) };
  if (url.pathname === '/checkpoints') return { status: 200, body: await store.find(COLLECTIONS.checkpoints, {}) };
  return { status: 404, body: { error: 'not found' } };
}
