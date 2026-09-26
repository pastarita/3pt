/**
 * Cloudflare Worker entry (target "harness" in infra/targets.json): the @3pt/api routes over fetch().
 * The demo firm model is two plain scripts that set globals; the bundle loads them first, so the
 * handler never reads files. Photos stay on the Pages site: /media-pool/* redirects there.
 * State is in memory per Worker instance until the Atlas store lands (docs/13-ci-and-deployment.md).
 */
import '../../../../data/mock/media-pool/media-pool.js';
import '../../../../hub/site/sim-data.js';
import { handle } from '@3pt/api/handler';

interface Env { PAGES_ORIGIN: string }
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type' };

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (url.pathname.startsWith('/media-pool/')) return Response.redirect(env.PAGES_ORIGIN + url.pathname, 302);
    let body: Record<string, unknown> = {};
    if (req.method === 'POST') {
      try { body = JSON.parse((await req.text()) || '{}'); } catch { return Response.json({ error: 'body is not JSON' }, { status: 400, headers: CORS }); }
    }
    const r = await handle(url, req.method, body);
    return Response.json(r.body, { status: r.status, headers: CORS });
  },
};
