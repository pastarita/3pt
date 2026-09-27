/**
 * Live data. When @3pt/api answers, this swaps the sample lists in data.ts for the harness's own:
 * the 20 Acme Builders projects, the demo job's photos and units, each role's to-dos, the time savers,
 * and the harness's version history. Every tap goes back as an event, which is what the loop learns from.
 * If the API does not answer in 1.5 s, or the flag `live.api` is off (?ff=-live.api), the sample data stays.
 */
import { createClient, type LoopTurn, type Photo as ApiPhoto } from '@3pt/inspector-client';
import { BLOCK_OF, FILES_BY_ID, HARNESS, LESSONS, LIVE, PHOTOS, PROJECTS, ROLES, SAVERS, TODOS, WIDGETS, type PhotoKind, type CardId, type Project, type RoleId, type Todo } from './data';

export const api = createClient(import.meta.env.VITE_THREEPT_API_URL ?? 'http://127.0.0.1:8787');
const KIND: Record<string, PhotoKind> = {
  site: 'concrete', concrete: 'concrete', steel: 'concrete', framing: 'framing', plumbing: 'plumbing', electrical: 'electrical',
  hvac: 'electrical', insulation: 'drywall', drywall: 'drywall', finishes: 'finished', paint: 'finished', exterior: 'exterior',
};
const ALL: RoleId[] = ROLES.map(r => r.id);
const ICON: Record<string, string> = { photo: 'camera', water: 'drop', hazard: 'alert', send: 'send' };
const within = <T>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<never>((_, no) => setTimeout(() => no(new Error('timeout')), ms))]);
let current = 0;

export function addPhoto(x: ApiPhoto & { focus?: boolean }, project: string) {
  if (PHOTOS.some(p => p.id === x.id)) return;
  PHOTOS.push({ id: x.id, project, unit: x.unit, kind: KIND[x.trade] ?? 'exterior', week: x.week, flag: x.water ? 'water' : x.hazard ? 'hazard' : undefined, file: x.file, focus: x.focus });
  if (x.file) FILES_BY_ID[x.id] = x.file.startsWith('data:') ? x.file : api.media(x.file)!;
}

export async function loadLive(): Promise<boolean> {
  try { await within(api.health(), 1500); } catch { return false; }
  const [firm, screen, harness] = await Promise.all([api.simState(), api.screen(null, 'super'), api.harness()]);
  const demo = screen.project.id, TW = firm.week;

  /* projects: the firm on demo day */
  const projects: Project[] = firm.projects.filter(p => p.status !== 'planned').map(p => {
    const start = Date.parse(p.start), end = Date.parse(p.end), now = Date.parse(firm.date);
    const pct = p.status === 'closed' ? 100 : Math.max(1, Math.min(99, Math.round((100 * (now - start)) / (end - start))));
    if (p.cover?.file) FILES_BY_ID[`cover-${p.id}`] = api.media(p.cover.file)!;
    return {
      id: p.id, name: p.name, kind: p.type, status: p.status === 'closed' ? 'done' : 'live', cover: KIND[p.cover?.trade ?? 'exterior'] ?? 'exterior',
      where: p.neighborhood, when: p.status === 'closed' ? `Finished in ${p.end.slice(0, 4)}` : `${p.phase} · started ${p.start.slice(0, 7)}`,
      team: p.status === 'closed' ? ['pm', 'owner', 'super'] : ALL, photos: p.photos, percent: pct,
      next: p.status === 'closed' ? `${p.retro?.lessons.length ?? 0} lessons carried forward` : `${p.phase} now`,
    };
  });
  const next = firm.projects.find(p => p.status === 'planned');
  if (next) projects.push({ id: next.id, name: next.name, kind: next.type, status: 'planned', cover: 'exterior', where: next.neighborhood, when: `Starts ${next.start}`, team: ALL, photos: 0, percent: 0, next: 'Starts with every lesson so far' });
  projects.sort((a, b) => (a.id === demo ? -1 : b.id === demo ? 1 : 0) || ['live', 'planned', 'done'].indexOf(a.status) - ['live', 'planned', 'done'].indexOf(b.status));
  PROJECTS.splice(0, PROJECTS.length, ...projects);

  /* photos: every live job's photos; the sample ones stay so the widgets' authored examples still resolve */
  /* every request below runs in parallel: the Worker answers each in about 0.8 s, so in series the app waited 11 s */
  const liveJobs = firm.projects.filter(x => x.status === 'live');
  const [shots, needs, saverBlock, units] = await Promise.all([
    Promise.all(liveJobs.map(p => api.photos(p.id))),
    Promise.all(ALL.map(r => api.block('needs', demo, r))),
    api.block('timesavers', demo, 'owner'),
    api.block('beforeclose', demo, 'super') as Promise<{ level?: number; units?: { unit: number; missing: boolean; closed?: boolean; photo: ApiPhoto | null }[] }>,
  ]);
  liveJobs.forEach((p, i) => { for (const x of shots[i].photos) addPhoto(x, p.id); });

  /* to-dos: ask the harness once per role, merge by id */
  const todos = new Map<string, Todo>();
  for (const [i, r] of ALL.entries()) {
    const b = needs[i];
    for (const t of b.items as { id: string; kind: string; title: string; action: string; do: string; photo: ApiPhoto | null }[]) {
      if (t.photo) addPhoto(t.photo, demo);
      const have = todos.get(t.id);
      if (have) { have.roles.push(r); continue; }
      todos.set(t.id, { id: t.id, title: t.title, detail: `From ${screen.project.name}, this week`, action: t.action, photo: t.photo?.id ?? '', icon: ICON[t.kind] ?? 'alert', roles: [r] });
      DO[t.id] = t.do;
    }
  }
  TODOS.splice(0, TODOS.length, ...todos.values());

  /* time savers the harness found, and its own history */
  const savers = saverBlock.items as { id: string; title: string; kind: string; hours: number; on: boolean }[];
  SAVERS.splice(0, SAVERS.length, ...savers.map(s => ({ id: s.id, title: s.title, why: `${s.kind}${s.on ? ' · already on' : ''} · found in past jobs`, hours: s.hours, from: 'past jobs', roles: ALL })));
  LESSONS.splice(0, LESSONS.length, ...harness.versions.slice().reverse().filter(v => v.v > 0).map(v => ({ v: v.v, when: v.when.slice(0, 7), by: v.by === 'harness' ? 'The assistant' : v.by, plain: v.changes[0], undone: !!v.rolledBack })));
  current = harness.current;
  readLayouts(harness);

  /* the pre-drywall widget speaks about the level the harness is watching, not the sample level */
  if (units.level && units.units?.length) {
    const miss = units.units.filter(u => u.missing);
    WIDGETS.predrywall.title = `Level ${units.level} · before walls close`;
    WIDGETS.predrywall.insight.text = miss.length
      ? `Drywall started in unit ${miss.map(u => u.unit).join(', ')}. It has no pipe photo yet. Take it before the wall closes.`
      : 'Every closed wall on this level has a pipe photo.';
    WIDGETS.predrywall.insight.basis = `Checked ${units.units.length} units on level ${units.level} against their photos`;
    WIDGETS.predrywall.insight.photos = miss.map(u => u.photo?.id).filter((x): x is string => !!x);
  }

  /* the familiar widgets: their insight line now counts the demo job's own photos and units */
  const mine = PHOTOS.filter(p => p.project === demo), week = mine.filter(p => p.week === TW);
  const trades = new Set(week.map(p => p.kind)).size, lvl = units.level ?? 0, us = units.units ?? [];
  const closed = us.filter(u => u.closed).length;
  const missing = us.filter(u => u.missing).map(u => u.unit), open = us.length - closed;
  const hz = week.find(p => p.flag === 'hazard'), wet = week.filter(p => p.flag === 'water');
  const say = (id: keyof typeof WIDGETS, text: string, basis: string, photos: string[]) => { const w = WIDGETS[id]; if (w?.insight) { w.insight.text = text; w.insight.basis = basis; w.insight.photos = photos.slice(0, 3); } };
  const ids = (list: typeof week) => list.map(p => p.id);
  say('dailylog', `Draft ready from this week's ${week.length} photos: ${trades} trades on site${missing.length ? `, and unit ${missing.join(', ')} still needs its pipe photo` : ''}.`, `Read ${week.length} photos filed this week`, ids(week));
  say('ownerreport', `Drafted from ${week.length} photos: ${closed} of ${us.length} units on level ${lvl} are closed${wet.length ? `, ${wet.length} walls need a look for water` : ''}.`, `Picked from ${mine.length} photos of ${screen.project.name}`, ids(week.filter(p => p.kind === 'exterior').concat(week)));
  WIDGETS.ownerreport.title = `Owner report · week ${screen.project.week}`;
  say('weekly', `Level ${lvl} walls closed in ${closed} of ${us.length} units. ${week.length} new photos this week.`, `Counted units on level ${lvl} against their photos`, ids(week));
  say('observations', hz ? `One photo this week shows ${hz.id.endsWith('H1') ? 'an open edge with no rail' : 'a possible hazard'} in unit ${hz.unit}.` : 'No hazard seen in this week\'s photos.', `Looked at ${week.length} photos from this week`, hz ? [hz.id] : []);
  say('roughin', `${open} units on level ${lvl} still have open walls.${missing.length ? ` Unit ${missing.join(', ')} closed without a pipe photo.` : ''}`, `Checked ${us.length} units on level ${lvl}`, missing.length ? us.filter(u => u.missing).map(u => u.photo?.id ?? '').filter(Boolean) : ids(week.filter(p => p.kind === 'plumbing')));

  LIVE.source = 'api'; LIVE.demo = demo;
  void TW;
  return true;
}

/** The harness's own action for each to-do (take photo, look, send). */
export const DO: Record<string, string> = {};

/** The harness's screen per role on the version on duty, and the blocks it took off since an earlier version. */
function readLayouts(h: Awaited<ReturnType<typeof api.harness>>) {
  HARNESS.layout = h.layouts;
  const removed: Record<string, string[]> = {};
  for (const [role, lay] of Object.entries(h.layouts)) {
    const once = new Set(h.versions.filter(v => v.v <= h.current && !v.rolledBack).flatMap(v => v.layout[role] ?? []));
    removed[role] = [...once].filter(b => !lay.includes(b));
  }
  HARNESS.removed = removed;
}
/** Read the harness again after it shipped or undid a version, so the next render uses its new screen. */
export async function refreshHarness(): Promise<void> {
  const h = await api.harness(); current = h.current; readLayouts(h);
  LESSONS.splice(0, LESSONS.length, ...h.versions.slice().reverse().filter(v => v.v > 0).map(v => ({ v: v.v, when: v.when.slice(0, 7), by: v.by === 'harness' ? 'The assistant' : v.by, plain: v.changes[0], undone: !!v.rolledBack })));
}

/** What the loop did in answer to a tap (shipped or undid a version). main.ts sets it to ring the bulb. */
let onTurn: (t: LoopTurn) => void = () => undefined;
export function setTurnHandler(fn: (t: LoopTurn) => void): void { onTurn = fn; }

/** Report one tap to the loop. Fire and forget: the screen never waits for it. */
export function send(action: string, detail: string | undefined, role: RoleId | null): void {
  if (LIVE.source !== 'api' || !role) return;
  const e = { role, project: LIVE.demo };
  const post = (x: Parameters<typeof api.event>[0]) => { void api.event(x).then(t => { if (t.shipped || t.rolled_back) onTurn(t); }).catch(() => undefined); };
  switch (action) {
    case 'photo': return post({ ...e, action: 'use', block: 'photos_week', photo: detail });
    case 'not-helpful': {
      /* a "no" on a plumbing or water photo is a "no" on that photo search: three of them ask for a new field */
      const p = PHOTOS.find(x => x.id === detail);
      const q = p?.flag === 'water' ? 'water' : p?.kind === 'plumbing' ? 'plumb' : undefined;
      return post({ ...e, action: 'fb_down', block: q ? 'ask' : 'photos_week', q, photo: detail });
    }
    case 'ask': return post({ ...e, action: 'use', block: 'ask', q: detail });
    case 'saver-on': return post({ ...e, action: 'act', block: 'timesavers', do: `opp:${detail}` });
    case 'saver-no': return post({ ...e, action: 'fb_down', block: 'timesavers' });
    case 'insight-yes': return post({ ...e, action: 'act', block: BLOCK_OF[detail as CardId] });
    case 'insight-no': { const b = BLOCK_OF[detail as CardId]; return b ? post({ ...e, action: 'hide', block: b }) : undefined; }
    case 'todo': return post({ ...e, action: 'act', block: 'needs', do: DO[detail ?? ''] ?? '' });
    case 'undo': if (Number(detail) === current) void api.rollback(Math.max(0, current - 1)).then(r => { current = r.version; onTurn({ shipped: null, rolled_back: { version: Number(detail), to: r.version, why: 'You pressed Undo' } }); }).catch(() => undefined); return post({ ...e, action: 'hide', block: 'learned' });
    /* setup, role, more: not a block, so not a signal the loop can plan from */
    default: return;
  }
}
