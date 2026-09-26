/** The app's screens, composed by the harness. A surface asks for one screen; the harness decides which blocks
 *  that role sees and in what order (its layout is part of the current harness version), and fills each block
 *  from the demo firm. Every tap comes back as an event. The loop approves itself: Plan turns events into a change,
 *  Build ships it as a new version at once, Instrument scores it and rolls it back if it scores worse than its
 *  parent. Nobody approves anything. Nothing on the screen is chosen by the surface.
 *
 *    GET  /app/screen?project=p18&role=super     layout + filled blocks + "what I learned"
 *    GET  /app/ask?project=p18&q=plumb           photo search, answered with the current version's fields
 *    GET  /app/photos?project=p18                every photo the app may show for one project
 *    POST /app/events        {role, action, block?, q?, photo?}    use | hide | open | fb_up | fb_down | act
 *                            → {shipped?, rolled_back?} when the tap made the harness ship or undo a version
 *    POST /app/rollback      {v}                  a person can still undo a version; the harness will not re-ship it
 *    GET  /app/harness                            versions, fields, layouts by role, loop status
 *    GET  /app/news?since=4                        versions shipped after v4 and still live (the surfaces' bulb)
 *    POST /app/reset                              back to the seeded state
 *
 *  State: in memory, and after every change a snapshot in app_state plus each tap in app_events when a host
 *  calls persistTo(store). The node API does that with the Atlas battery when a connection is configured. */
import { COLLECTIONS, type Store } from '@3pt/core';
import { firm, iso } from './sim.js';

type Json = Record<string, any>;
interface Version { v: number; when: string; by: string; changes: string[]; why: string; layout: Record<string, string[]>; fields: string[]; rolledBack?: boolean; parent?: number; key?: string }
interface Ev { t: number; role: string; v: number; action: string; block?: string; q?: string; photo?: string }

const LAYOUT_LEARNED: Record<string, string[]> = {
  super: ['beforeclose', 'needs', 'photos_week', 'ask'],
  pm: ['needs', 'timesavers', 'progress', 'ask'],
  owner: ['progress', 'portfolio', 'timesavers'],
  pe: ['needs', 'closeout', 'ask', 'photos_week'],
};
const BASE = ['needs', 'photos_week', 'ask'];
export const BLOCKS: Record<string, { title: string; when: 'live' | 'closed' | 'any' }> = {
  needs: { title: 'Needs you', when: 'live' }, beforeclose: { title: 'Units closing', when: 'live' },
  photos_week: { title: 'This week', when: 'live' }, ask: { title: 'Ask your photos', when: 'any' },
  timesavers: { title: 'Time savers', when: 'any' }, progress: { title: 'Progress', when: 'live' },
  portfolio: { title: 'All projects', when: 'any' }, closeout: { title: 'Closeout', when: 'any' },
  hazards: { title: 'Hazards', when: 'live' }, retro: { title: 'Looking back', when: 'closed' },
  playbook: { title: 'Carried to the next job', when: 'closed' }, lessons: { title: 'Started with', when: 'live' },
};
const QUERIES: Record<string, { label: string; field?: string }> = {
  plumb: { label: 'Plumbing before drywall', field: 'wall' },
  water: { label: 'Water stains', field: 'issue' },
  window: { label: 'Near windows', field: 'near_window' },
  week: { label: 'This week' },
};

/* ---------------- state ---------------- */
let S: { versions: Version[]; cur: number; events: Ev[]; rejected: Record<string, boolean>; reviewed: Record<string, boolean>; extra: Json[] };
async function seed() {
  const F = await firm(new URLSearchParams());
  const TW = F.TODAY_WEEK;
  let layout: Record<string, string[]> = {}, fields = ['description', 'date', 'source'];
  const versions: Version[] = F.versionsUpTo(TW).map((v: any) => {
    const rb = v.rolledBackWeek != null && v.rolledBackWeek <= TW;
    if (!rb) {
      if (v.cap === 'fields') fields = fields.concat(['unit', 'level', 'trade']);
      if (v.cap === 'wall') fields = fields.concat(['wall']);
      if (v.cap === 'issue') fields = fields.concat(['issue']);
      if (v.cap === 'screens') layout = JSON.parse(JSON.stringify(LAYOUT_LEARNED));
      if (v.cap === 'hazard') layout = { ...layout, safety: ['hazards', 'needs', 'photos_week'] };
    }
    return { v: v.v, when: iso(v.date), by: v.v === 0 ? 'install' : 'harness', changes: v.changes, why: v.why, layout: JSON.parse(JSON.stringify(layout)), fields: fields.slice(), rolledBack: rb };
  });
  S = { versions, cur: versions.filter(v => !v.rolledBack).slice(-1)[0].v, events: [], rejected: {}, reviewed: {}, extra: [] };
}
/* persistence: a host (the node API with Atlas, or any Store) calls persistTo; without it, state lives in memory */
let store: Store | null = null;
export function persistTo(s: Store): void { store = s; }
async function snapshot(why: string) {
  if (!store) return;
  try { await store.insert(COLLECTIONS.app_state, { ts: Date.now(), why, versions: S.versions, cur: S.cur, rejected: S.rejected, reviewed: S.reviewed, extra: S.extra, events: S.events.slice(-500) }); }
  catch (e) { console.error('[app] snapshot not saved:', (e as Error).message); }
}
async function record(e: Ev) { if (store) try { await store.insert(COLLECTIONS.app_events, { ...e }); } catch { /* the snapshot still carries it */ } }
async function state() {
  if (S) return S;
  if (store) {
    try {
      const last = await store.latest<any>(COLLECTIONS.app_state, 'ts');
      if (last?.versions?.length) { S = { versions: last.versions, cur: last.cur, events: last.events ?? [], rejected: last.rejected ?? {}, reviewed: last.reviewed ?? {}, extra: last.extra ?? [] }; return S; }
    } catch (e) { console.error('[app] could not read the last snapshot:', (e as Error).message); }
  }
  await seed(); await snapshot('seed'); return S;
}
const ver = () => S.versions.find(v => v.v === S.cur)!;
const layoutFor = (role: string) => (ver().layout[role] ?? BASE).slice();

/* ---------------- photos: the firm's samples plus one full record per unit on the level in work ---------------- */
function focusLevel(p: any) { return Math.max(1, Math.ceil(p.levels / 2)); }
function pool(trade: string, i: number) { const m = (globalThis as any).MEDIA?.[trade]; return m?.length ? '/media-pool/' + m[i % m.length] : null; }
async function photosOf(pid: string) {
  const F = await firm(new URLSearchParams()), TW = F.TODAY_WEEK, sp = F.projects.find((x: any) => x.id === pid);
  if (!sp) return [];
  const out: Json[] = F.photosUpTo(sp, TW).slice(-60).map((x: any) => ({ id: x.id, unit: x.unit, level: x.level, trade: x.trade, wall: x.wall, week: x.w, water: !!x.water, hazard: x.hazard ?? null, file: x.file ? '/media-pool/' + x.file : null }));
  if (F.status(sp, TW) !== 'live') return out;
  const ph = F.phaseAt(sp, TW).name, L = focusLevel(sp), k = Math.min(8, sp.unitsPerLevel);
  let n = 0;
  if (['Rough-in', 'Close-in', 'Finishes', 'Closeout'].includes(ph)) {
    for (let i = 1; i <= k; i++) {
      const u = L * 100 + i, add = (trade: string, wall: string, week: number, extra: Json = {}) => out.push({ id: `${pid}-F${n}`, unit: u, level: L, trade, wall, week, focus: true, file: pool(trade, n++), ...extra });
      add('framing', 'open', TW - 6);
      if (!(ph === 'Close-in' && i === 6)) add('plumbing', 'open', TW - 4);
      add('electrical', 'open', TW - 3, i % 3 === 0 ? { near_window: true } : {});
      if (ph !== 'Rough-in' && (ph !== 'Close-in' || i <= 6)) add('drywall', 'closed', ph === 'Close-in' && i === 6 ? TW : TW - 1, i % 3 === 0 ? { near_window: true } : {});
    }
    if (ph === 'Close-in') {
      out.push({ id: `${pid}-W1`, unit: L * 100 + 3, level: L, trade: 'drywall', wall: 'closed', week: TW, water: true, near_window: true, file: pool('drywall', 3) });
      out.push({ id: `${pid}-W2`, unit: L * 100 + 5, level: L, trade: 'drywall', wall: 'closed', week: TW, water: true, file: pool('drywall', 7) });
    }
    if (ph === 'Rough-in' || ph === 'Close-in') out.push({ id: `${pid}-H1`, unit: L * 100 + 7, level: L, trade: 'framing', wall: 'open', week: TW, hazard: 'open edge, no rail', file: pool('framing', 4) });
  }
  out.push({ id: `${pid}-X1`, unit: null, level: null, trade: 'exterior', wall: null, week: TW, file: pool('exterior', sp.n) });
  return out.concat(S.extra.filter(x => x.project === pid));
}
function units(photos: Json[], sp: any) {
  const L = focusLevel(sp), k = Math.min(8, sp.unitsPerLevel), list = [];
  for (let i = 1; i <= k; i++) {
    const u = L * 100 + i, has = photos.filter(p => p.unit === u && p.focus);
    const closed = has.some(p => p.trade === 'drywall'), plumb = has.some(p => p.trade === 'plumbing');
    list.push({ unit: u, photos: has.length, closed, missing: closed && !plumb, photo: has.slice(-1)[0] ?? null });
  }
  return list.some(x => x.photos) ? list : [];
}

/* ---------------- blocks ---------------- */
async function fill(id: string, pid: string, role: string) {
  const F = await firm(new URLSearchParams()), TW = F.TODAY_WEEK, sp = F.projects.find((x: any) => x.id === pid)!;
  const photos = await photosOf(pid), us = units(photos, sp), wk = photos.filter(p => p.week === TW);
  const trade = role === 'trade' ? 'plumbing' : null;
  switch (id) {
    case 'needs': {
      const t: Json[] = [];
      if (['super', 'pm', 'trade', 'pe'].includes(role)) us.filter(u => u.missing).forEach(u => t.push({ id: 'miss' + u.unit, kind: 'photo', title: `Unit ${u.unit} · open-wall photo`, action: 'Take photo', do: `take:${u.unit}`, photo: u.photo }));
      const water = wk.filter(p => p.water && !S.reviewed[p.id]);
      if (water.length && ['super', 'pm', 'pe', 'safety'].includes(role)) t.push({ id: 'water', kind: 'water', title: `${water.length} possible water stains`, action: 'Look', do: `look:${water[0].id}`, photo: water[0] });
      const hz = wk.filter(p => p.hazard && !S.reviewed[p.id]);
      if (hz.length && ['super', 'safety'].includes(role)) t.push({ id: 'hazard', kind: 'hazard', title: `Possible hazard · unit ${hz[0].unit}`, action: 'Look', do: `look:${hz[0].id}`, photo: hz[0] });
      if (['pm', 'owner'].includes(role) && !S.reviewed['pack' + pid]) t.push({ id: 'pack', kind: 'send', title: 'Owner pack · this week', action: 'Send', do: 'send:pack', photo: wk.find(p => p.trade === 'exterior') ?? null });
      return { items: t };
    }
    case 'beforeclose': return { level: focusLevel(sp), units: us };
    case 'photos_week': return { photos: wk.filter(p => !trade || p.trade === trade).slice(0, 12) };
    case 'hazards': return { photos: photos.filter(p => p.hazard) };
    case 'progress': return { closed: us.filter(u => u.closed).length, total: us.length, photos_this_week: wk.length, hero: wk.find(p => p.trade === 'exterior') ?? null };
    case 'portfolio': return { projects: F.projects.map((p: any) => ({ id: p.id, name: p.name, status: F.status(p, TW) })), hours_saved: F.hoursSavedUpTo(TW) };
    case 'timesavers': {
      const learned = (cap: string) => F.versions.find((v: any) => v.cap === cap && v.w <= TW);
      const all = [['ownerpack', 'pack', 'Build the Friday owner photo pack', 'automate', 28], ['openwall', 'remind', 'Open-wall photo before drywall', 'remind', 12],
        ['wallstate', 'wall', 'Search photos by open or closed wall', 'harness change', 9], ['water', 'issue', 'Flag water stains the day they arrive', 'feature', 6],
        ['closeout', 'closeout', 'Closeout photo set per unit', 'automate', 16], ['inspect', null, 'Inspection photo pack per floor', 'automate', 10]] as const;
      return { items: all.map(([id, cap, title, kind, hours]) => ({ id, title, kind, hours, on: !!(cap && learned(cap)) || !!S.reviewed['opp' + id] })) };
    }
    case 'closeout': return { complete: us.filter(u => u.closed && !u.missing).length, total: us.length };
    case 'retro': return { facts: sp.retro?.facts ?? [] };
    case 'playbook': return { lessons: sp.retro?.lessons ?? [] };
    case 'lessons': return { lessons: [...new Set(F.projects.filter((p: any) => p.retro).flatMap((p: any) => p.retro.lessons))].filter((l: any) => !String(l).startsWith('No new')).slice(0, 8) };
    case 'ask': return { queries: Object.entries(QUERIES).map(([id, q]) => ({ id, label: q.label })) };
  }
  return {};
}

/* ---------------- the loop: Plan (signal) → Build (ship a version) → Instrument (score, undo) ----------------
   Self-approving: a change Plan finds ships at once. The check comes after, from use: Instrument compares the
   new version's score with its parent's and undoes it when it is clearly worse. An undone change is remembered
   (rejected) so Plan does not offer it again. */
function plan(role: string): Json | null {
  const lay = layoutFor(role), ev = S.events.filter(e => e.role === role && e.v === S.cur);
  const use: Record<string, number> = {};
  ev.filter(e => e.action === 'use' && e.block).forEach(e => { use[e.block!] = (use[e.block!] ?? 0) + 1; });
  for (const b of Object.keys(use)) {
    const i = lay.indexOf(b), key = `${role}:top:${b}`;
    if (use[b] >= 3 && i > 0 && !S.rejected[key]) return { key, kind: 'layout', text: `Move "${BLOCKS[b].title}" to the top of this screen?`, why: `Used ${use[b]} times in this version. It sits at position ${i + 1}.`, apply: { move: b, role } };
  }
  for (const b of Object.keys(use)) {
    const key = `${role}:add:${b}`;
    if (use[b] >= 2 && !lay.includes(b) && !S.rejected[key]) return { key, kind: 'layout', text: `Add "${BLOCKS[b].title}" to this screen?`, why: `Opened from "Add to my screen" ${use[b]} times.`, apply: { add: b, role } };
  }
  const hid = ev.filter(e => e.action === 'hide');
  if (hid.length) { const b = hid[hid.length - 1].block!, key = `${role}:rm:${b}`; if (lay.includes(b) && !S.rejected[key]) return { key, kind: 'layout', text: `Remove "${BLOCKS[b].title}" from this screen?`, why: 'You closed it.', apply: { remove: b, role } }; }
  for (const [q, def] of Object.entries(QUERIES)) {
    if (!def.field || ver().fields.includes(def.field)) continue;
    const downs = S.events.filter(e => e.action === 'fb_down' && e.q === q && e.v === S.cur).length, key = 'field:' + def.field;
    if (downs >= 3 && !S.rejected[key]) return { key, kind: 'rule', text: `Add a "${def.field}" field and read the matching photos again?`, why: `${downs} "no" taps on "${def.label}". The current fields cannot answer it.`, apply: { field: def.field } };
  }
  return null;
}
function tally(v: number) {
  const ev = S.events.filter(e => e.v === v), good = ev.filter(e => e.action === 'fb_up' || e.action === 'act').length, bad = ev.filter(e => e.action === 'fb_down' || e.action === 'hide').length;
  return { n: good + bad, pct: good + bad ? Math.round((100 * good) / (good + bad)) : null };
}
const score = (v: number) => tally(v).pct;
/* Instrument's guard: at least MIN_SIGNALS scored taps on the new version, and DROP points under its parent. */
const MIN_SIGNALS = 4, DROP = 20;
function guard(): Version | null {
  const cur = ver();
  if (cur.by !== 'harness' || cur.parent == null || !cur.key) return null;
  const now = tally(cur.v), before = score(cur.parent);
  if (now.n < MIN_SIGNALS || now.pct == null || before == null || now.pct > before - DROP) return null;
  cur.rolledBack = true; S.rejected[cur.key] = true; S.cur = cur.parent;
  return cur;
}
/** One turn of the loop after a tap: undo a bad version first, else ship the next change if Plan has one. */
function selfApprove(role: string): { shipped: Json | null; rolled_back: Json | null } {
  const bad = guard();
  if (bad) return { shipped: null, rolled_back: { version: bad.v, to: S.cur, why: `Scored ${score(bad.v)}% useful against ${score(S.cur)}% before it` } };
  const p = plan(role);
  if (!p) return { shipped: null, rolled_back: null };
  const nv = build(p, 'harness'); nv.key = p.key;
  return { shipped: { version: nv.v, changes: nv.changes, why: nv.why }, rolled_back: null };
}
function build(p: Json, by: string) {
  const base = ver(), nv: Version = { v: S.versions.length, when: new Date().toISOString().slice(0, 10), by, changes: [], why: p.why, layout: JSON.parse(JSON.stringify(base.layout)), fields: base.fields.slice(), parent: base.v };
  const a = p.apply, lay = (nv.layout[a.role] ?? BASE).slice();
  if (a.move) { lay.splice(lay.indexOf(a.move), 1); lay.unshift(a.move); nv.layout[a.role] = lay; nv.changes = [`Moved "${BLOCKS[a.move].title}" to the top for ${a.role}`]; }
  if (a.add) { lay.push(a.add); nv.layout[a.role] = lay; nv.changes = [`Added "${BLOCKS[a.add].title}" for ${a.role}`]; }
  if (a.remove) { lay.splice(lay.indexOf(a.remove), 1); nv.layout[a.role] = lay; nv.changes = [`Removed "${BLOCKS[a.remove].title}" for ${a.role}`]; }
  if (a.field) { nv.fields.push(a.field); nv.changes = [`Added field: ${a.field}`, 'Read the matching photos again, once']; }
  S.versions.push(nv); S.cur = nv.v; return nv;
}

async function ask(pid: string, q: string) {
  const F = await firm(new URLSearchParams()), TW = F.TODAY_WEEK, ps = await photosOf(pid), f = ver().fields;
  if (q === 'plumb') { const has = f.includes('wall'); return { note: has ? 'Uses the "open or closed wall" field.' : 'This version cannot tell open walls from closed.', photos: ps.filter(p => p.trade === 'plumbing' || (!has && p.trade === 'drywall')).filter(p => !has || p.wall === 'open').slice(0, 12) }; }
  if (q === 'water') { const has = f.includes('issue'); return { note: has ? 'Uses the "issue" field.' : 'No field for water yet. Tap 👎 on wrong ones.', photos: has ? ps.filter(p => p.water) : ps.filter(p => p.trade === 'drywall').slice(0, 12) }; }
  if (q === 'window') { const has = f.includes('near_window'); return { note: has ? 'Uses the "near_window" field.' : 'No field for windows yet. These are guesses. Tap 👎 on wrong ones.', photos: has ? ps.filter(p => p.near_window) : ps.filter(p => p.focus).slice(0, 12) }; }
  return { note: 'Everything filed this week.', photos: ps.filter(p => p.week === TW).slice(0, 12) };
}

/* ---------------- routes ---------------- */
export async function handleApp(url: URL, method = 'GET', body: Json = {}, db?: Store): Promise<{ status: number; body: unknown } | null> {
  if (!url.pathname.startsWith('/app/')) return null;
  /* A Worker passes a fresh store per request: drop the cached state so the newest snapshot wins
     and every Worker instance shows the same harness version. */
  if (db) { store = db; S = undefined as unknown as typeof S; }
  await state();
  const q = url.searchParams, path = url.pathname;
  if (path === '/app/screen' && method === 'GET') {
    const F = await firm(new URLSearchParams()), TW = F.TODAY_WEEK, role = q.get('role') ?? 'super';
    const pid = q.get('project') ?? (F.projects.find((p: any) => F.status(p, TW) === 'live' && F.phaseAt(p, TW).name === 'Close-in') ?? F.projects[0]).id;
    const sp = F.projects.find((x: any) => x.id === pid);
    if (!sp) return { status: 404, body: { error: 'no such project' } };
    const st = F.status(sp, TW), hidden = new Set(S.events.filter(e => e.role === role && e.v === S.cur && e.action === 'hide').map(e => e.block));
    const fits = (b: string) => BLOCKS[b] && (BLOCKS[b].when === 'any' || BLOCKS[b].when === st);
    const layout = [...(st === 'closed' ? ['retro', 'playbook'] : []), ...layoutFor(role).filter(fits)].filter((b, i, a) => a.indexOf(b) === i && !hidden.has(b));
    const more = Object.keys(BLOCKS).filter(b => !layout.includes(b) && fits(b) && b !== 'retro' && b !== 'playbook');
    const blocks: Json = {}; for (const b of layout) blocks[b] = { title: BLOCKS[b].title, ...(await fill(b, pid, role)) };
    const v = ver();
    return { status: 200, body: {
      project: { id: sp.id, name: sp.name, type: sp.typeLabel, status: st, phase: st === 'live' ? F.phaseAt(sp, TW).name : null, week: TW - sp.startWeek + 1, cover: (await photosOf(pid)).filter(p => p.file).slice(-1)[0]?.file ?? null },
      role, harness: { version: v.v, learned: ver().layout[role] ? v.changes[v.changes.length - 1] : 'This is a basic screen. I learn this role\'s screen from what you use.', when: v.when },
      layout, more: more.map(b => ({ id: b, title: BLOCKS[b].title })), blocks,
    } };
  }
  if (path === '/app/block' && method === 'GET') {
    const b = q.get('id') ?? '', pid = q.get('project') ?? '', role = q.get('role') ?? 'super';
    if (!BLOCKS[b]) return { status: 404, body: { error: 'no such block' } };
    return { status: 200, body: { id: b, title: BLOCKS[b].title, ...(await fill(b, pid, role)) } };
  }
  if (path === '/app/photos' && method === 'GET') return { status: 200, body: { photos: await photosOf(q.get('project') ?? '') } };
  if (path === '/app/ask' && method === 'GET') return { status: 200, body: await ask(q.get('project') ?? '', q.get('q') ?? 'week') };
  if (path === '/app/events' && method === 'POST') {
    const e: Ev = { t: Date.now(), v: S.cur, role: String(body.role ?? 'super'), action: String(body.action ?? 'use'), block: body.block, q: body.q, photo: body.photo };
    S.events.push(e); await record(e);
    if (e.action === 'act' && body.do) {
      const [k, arg] = String(body.do).split(':');
      if (k === 'take') S.extra.push({ project: body.project, id: `take-${S.extra.length}`, unit: +arg, level: Math.floor(+arg / 100), trade: 'plumbing', wall: 'open', week: (await firm(new URLSearchParams())).TODAY_WEEK, focus: true, file: pool('plumbing', +arg) });
      if (k === 'look') S.reviewed[arg] = true;
      if (k === 'send') S.reviewed['pack' + body.project] = true;
      if (k === 'opp') S.reviewed['opp' + arg] = true;
    }
    /* every tap changes what plan() sees (hides, 👎 counts), so every tap runs the loop once and is a snapshot */
    const turn = selfApprove(e.role);
    await snapshot(turn.shipped ? `self-approve v${turn.shipped.version}` : turn.rolled_back ? `self-rollback v${turn.rolled_back.version}` : e.action === 'act' ? 'act ' + body.do : 'tap ' + e.action);
    return { status: 200, body: { ok: true, ...turn } };
  }
  if (path === '/app/rollback' && method === 'POST') {
    const to = Number(body.v), cur = ver();
    if (!S.versions.some(v => v.v === to && !v.rolledBack)) return { status: 400, body: { error: 'cannot roll back to that version' } };
    cur.rolledBack = true; if (cur.key) S.rejected[cur.key] = true; S.cur = to; await snapshot(`rollback to v${to}`); return { status: 200, body: { version: to, rolled_back: cur.v } };
  }
  if (path === '/app/harness' && method === 'GET') {
    const v = ver();
    return { status: 200, body: { current: v.v, fields: v.fields, layouts: v.layout, versions: S.versions.slice().reverse().map(x => ({ ...x, score: score(x.v) })), events: S.events.length } };
  }
  /* the bulb: a version counts as news once build() saved it and it is still live. A rolled-back version drops out,
     so a failed change never shows up as a feature. The surface keeps "since" (the last version it showed). */
  if (path === '/app/news' && method === 'GET') {
    const since = Number(q.get('since') ?? -1);
    const items = S.versions.filter(v => v.v > 0 && v.v > since && !v.rolledBack).reverse().slice(0, 12)
      .map(v => ({ v: v.v, when: v.when, by: v.by, changes: v.changes, why: v.why }));
    return { status: 200, body: { current: S.cur, items } };
  }
  if (path === '/app/reset' && method === 'POST') { await seed(); await snapshot('reset'); return { status: 200, body: { ok: true } }; }
  return { status: 404, body: { error: 'not found' } };
}
