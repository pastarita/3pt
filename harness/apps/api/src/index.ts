/** @3pt/api — HTTP for the surfaces. node:http here; the same handle() runs in the Cloudflare Worker
 *  (harness/apps/worker/src/edge.ts), which imports it from ./handler.js. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize } from 'node:path';
import { repo } from './sim.js';
import { handle } from './handler.js';
export { handle };

/* demo photos: data/mock/media-pool, read-only, jpg only */
const POOL = join(repo(), 'data', 'mock', 'media-pool');
async function media(path: string): Promise<Buffer | null> {
  const rel = normalize(path.replace(/^\/media-pool\//, ''));
  if (rel.startsWith('..') || !/^[a-z]+\/[a-z]+-\d+\.jpg$/.test(rel)) return null;
  try { return await readFile(join(POOL, rel)); } catch { return null; }
}

if (process.argv[1]?.endsWith('index.js')) {
  const port = Number(process.env.PORT ?? 8787);
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type' };
  createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://x');
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return; }
    if (url.pathname.startsWith('/media-pool/')) {
      const buf = await media(url.pathname);
      res.writeHead(buf ? 200 : 404, { ...cors, 'content-type': buf ? 'image/jpeg' : 'text/plain', 'cache-control': 'max-age=3600' });
      res.end(buf ?? 'not found'); return;
    }
    let body: Record<string, unknown> = {};
    if (req.method === 'POST') {
      const chunks: Buffer[] = []; for await (const c of req) chunks.push(c as Buffer);
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { res.writeHead(400, cors); res.end('{"error":"body is not JSON"}'); return; }
    }
    const r = await handle(url, req.method ?? 'GET', body);
    res.writeHead(r.status, { ...cors, 'content-type': 'application/json' });
    res.end(JSON.stringify(r.body));
  }).listen(port, () => console.log(`3pt api on :${port}`));
}
