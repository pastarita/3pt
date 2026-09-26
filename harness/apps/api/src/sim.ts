/** Read-only simulation routes: the Acme Builders demo firm, the same model the hub Simulator runs.
 *  The model lives in hub/site/sim-data.js (plain script, sets globalThis.SIM). Query parameters
 *  override its config, so a surface can ask for any firm and any week:
 *    GET /sim/config                     defaults and the config keys
 *    GET /sim/state?week=402&maxLive=3   the firm at that week: harness version, projects
 *    GET /sim/projects/p18?week=402      one project: phases, counts, latest photos
 *  Photos are paths under /media-pool/ (served by the hub, data/mock/media-pool/ in the repo).
 *  Every value is AUTHORED example data except the building records and the photos. */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

type Cfg = Record<string, string | number>;
interface Sim {
  CFG: Cfg; DEFAULTS: Cfg; NWEEKS: number; TODAY_WEEK: number; MAXLIVE: number;
  projects: any[]; versions: any[];
  build(cfg: Cfg): Sim;
  weekDate(w: number): number; status(p: any, w: number): string; phaseAt(p: any, w: number): any;
  currentVersion(w: number): any; versionsUpTo(w: number): any[]; photosUpTo(p: any, w: number): any[];
  statsUpTo(p: any, w: number): Record<string, number>; hoursSavedUpTo(w: number): number;
}

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
let base: Sim | null = null;
async function model(): Promise<Sim> {
  if (!base) {
    const g = globalThis as any;
    if (!g.MEDIA) { try { await import(join(REPO, 'data', 'mock', 'media-pool', 'media-pool.js')); } catch { g.MEDIA = {}; } }
    await import(join(REPO, 'hub', 'site', 'sim-data.js'));
    base = g.SIM as Sim;
  }
  return base;
}

const cache = new Map<string, Sim>();
async function firm(q: URLSearchParams): Promise<Sim> {
  const S = await model();
  const cfg: Cfg = { ...S.DEFAULTS };
  for (const k of Object.keys(S.DEFAULTS)) { const v = q.get(k); if (v != null && v !== '') cfg[k] = k === 'today' ? v : Number(v); }
  const key = JSON.stringify(cfg);
  if (!cache.has(key)) { if (cache.size > 20) cache.clear(); cache.set(key, S.build(cfg)); }
  return cache.get(key)!;
}
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const weekOf = (S: Sim, q: URLSearchParams) => Math.max(0, Math.min(S.NWEEKS - 1, Number(q.get('week') ?? S.TODAY_WEEK)));
const photo = (x: any) => ({ id: x.id, week: x.w, trade: x.trade, level: x.level, unit: x.unit, wall: x.wall, water: !!x.water, hazard: x.hazard ?? null, file: x.file ? '/media-pool/' + x.file : null });

function projectSummary(S: Sim, p: any, w: number) {
  const st = S.status(p, w), ph = S.phaseAt(p, w), s = S.statsUpTo(p, w);
  return {
    id: p.id, name: p.name, type: p.typeLabel, neighborhood: p.neighborhood, status: st, phase: ph ? ph.name : null,
    start: iso(S.weekDate(p.startWeek)), end: iso(S.weekDate(p.endWeek)), levels: p.levels, units: p.units,
    photos: s.photos, missing_open_wall: s.missing, walls_reopened: s.reopened,
    cover: (S.photosUpTo(p, Math.min(w, p.endWeek)).slice(-1).map(photo)[0]) ?? null,
    retro: st === 'closed' ? p.retro : null
  };
}

export async function handleSim(url: URL): Promise<{ status: number; body: unknown } | null> {
  if (!url.pathname.startsWith('/sim/')) return null;
  const q = url.searchParams;
  if (url.pathname === '/sim/config') { const S = await model(); return { status: 200, body: { defaults: S.DEFAULTS, keys: Object.keys(S.DEFAULTS) } }; }
  const S = await firm(q), w = weekOf(S, q);
  if (url.pathname === '/sim/state') {
    const v = S.currentVersion(w);
    return { status: 200, body: {
      config: S.CFG, week: w, date: iso(S.weekDate(w)), demo_week: S.TODAY_WEEK, max_live: S.MAXLIVE,
      harness: { version: v.v, changes: v.changes, why: v.why, history: S.versionsUpTo(w).map(x => ({ v: x.v, date: iso(x.date), changes: x.changes, why: x.why, rolled_back: x.rolledBackWeek != null && x.rolledBackWeek <= w })) },
      hours_saved: S.hoursSavedUpTo(w),
      projects: S.projects.map(p => projectSummary(S, p, w))
    } };
  }
  const m = url.pathname.match(/^\/sim\/projects\/(p\d+)$/);
  if (m) {
    const p = S.projects.find(x => x.id === m[1]);
    if (!p) return { status: 404, body: { error: 'no such project' } };
    return { status: 200, body: {
      ...projectSummary(S, p, w), week: w,
      phases: p.phases.map((ph: any) => ({ name: ph.name, start: iso(S.weekDate(ph.from)), end: iso(S.weekDate(ph.to)) })),
      latest_photos: S.photosUpTo(p, w).slice(-24).reverse().map(photo)
    } };
  }
  return { status: 404, body: { error: 'not found' } };
}
