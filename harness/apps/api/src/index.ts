/** @3pt/api — HTTP for the surfaces. node:http today; same handler shape as a Worker fetch(). */
import { createServer } from 'node:http';
import { COLLECTIONS, memoryStore, seedPolicy } from '@3pt/core';
import { handleSim } from './sim.js';

const store = memoryStore();
await store.insert(COLLECTIONS.policies, seedPolicy());

export async function handle(url: URL): Promise<{ status: number; body: unknown }> {
  const sim = await handleSim(url); if (sim) return sim;   /* the demo firm, see sim.ts */
  if (url.pathname === '/health') return { status: 200, body: { ok: true, at: new Date().toISOString() } };
  if (url.pathname === '/policies/latest') return { status: 200, body: await store.latest(COLLECTIONS.policies, 'version' as never) };
  if (url.pathname === '/checkpoints') return { status: 200, body: await store.find(COLLECTIONS.checkpoints, {}) };
  return { status: 404, body: { error: 'not found' } };
}

if (process.argv[1]?.endsWith('index.js')) {
  const port = Number(process.env.PORT ?? 8787);
  createServer(async (req, res) => {
    const r = await handle(new URL(req.url ?? '/', 'http://x'));
    res.writeHead(r.status, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify(r.body));
  }).listen(port, () => console.log(`3pt api on :${port}`));
}
