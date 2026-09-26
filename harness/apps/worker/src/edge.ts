/**
 * Cloudflare Worker entry (target "harness" in infra/targets.json): the @3pt/api routes over fetch().
 * The demo firm model is two plain scripts that set globals; the bundle loads them first, so the
 * handler never reads files. Photos stay on the Pages site: /media-pool/* redirects there.
 * State: with the ATLAS_URI secret set, every request opens the Atlas store (the Sandbox cluster) and the
 * app loop reads and appends snapshots there, so every Worker instance sees the same harness. A Worker
 * cannot reuse a socket across requests, so the client opens per request and closes after the response.
 * Without the secret, state is in memory per instance. If Atlas does not answer within 3 s, the instance serves
 * from memory for 5 minutes and says so (header x-3pt-store, /health), so the demo stays up while Atlas is fixed.
 */
import '../../../../data/mock/media-pool/media-pool.js';
import '../../../../hub/site/sim-data.js';
import { handle, persistTo } from '@3pt/api/handler';
import { atlasStore, type AtlasStore } from '@3pt/battery-atlas';

interface Env { PAGES_ORIGIN: string; ATLAS_URI?: string; ATLAS_DB?: string }
interface Ctx { waitUntil(p: Promise<unknown>): void }
let atlasDownUntil = 0, atlasError = '';
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type' };

export default {
  async fetch(req: Request, env: Env, ctx: Ctx): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (url.pathname.startsWith('/media-pool/')) return Response.redirect(env.PAGES_ORIGIN + url.pathname, 302);
    let body: Record<string, unknown> = {};
    if (req.method === 'POST') {
      try { body = JSON.parse((await req.text()) || '{}'); } catch { return Response.json({ error: 'body is not JSON' }, { status: 400, headers: CORS }); }
    }
    let db: AtlasStore | undefined, mode = 'memory';
    try {
      if (env.ATLAS_URI && Date.now() >= atlasDownUntil) {
        try { db = await atlasStore(env.ATLAS_URI, env.ATLAS_DB || '3pt', 3000); mode = 'atlas'; }
        catch (e) { atlasDownUntil = Date.now() + 5 * 60_000; atlasError = String((e as Error).message ?? e); console.error('[worker] Atlas unreachable, memory for 5 min:', atlasError); }
      }
      if (env.ATLAS_URI && !db) { persistTo(null); mode = 'memory-fallback'; }
      const r = await handle(url, req.method, body, db);
      const out = url.pathname === '/health' && mode === 'memory-fallback' ? { ...(r.body as object), store: mode, atlas_error: atlasError } : r.body;
      return Response.json(out, { status: r.status, headers: { ...CORS, 'x-3pt-store': mode } });
    } catch (e) {
      return Response.json({ error: 'harness store unavailable', detail: String((e as Error).message ?? e) }, { status: 503, headers: CORS });
    } finally {
      if (db) ctx.waitUntil(db.close());
    }
  },
};
