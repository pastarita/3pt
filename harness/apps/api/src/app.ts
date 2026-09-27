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
 *    POST /app/photos        {role, project, unit?, trade, wall?, note?, file?}   a new photo; the harness tags it from its
 *                            note, then checks every photo so far for patterns (media scan) → {photo, shipped?}
 *    POST /app/scan                               the media scan alone; the Worker's cron runs it every 30 minutes
 *    POST /app/reset                              back to the seeded state
 *
 *  State: in memory, and after every change a snapshot in app_state plus each tap in app_events when a host
 *  calls persistTo(store). The node API does that with the Atlas battery when a connection is configured. */
import { COLLECTIONS, type Store } from '@3pt/core';
import { firm, iso } from './sim.js';

type Json = Record<string, any>;
/* kind: who acts on a change. suggest = the app tells a person (`to`) to do something; automate = the app does a task
   people did by hand; improve = the app answers better and nobody's task changes. Versions from `3pt replay` carry it. */
type Kind = 'suggest' | 'automate' | 'improve';
interface Version { v: number; when: string; by: string; changes: string[]; why: string; layout: Record<string, string[]>; fields: string[]; rolledBack?: boolean; parent?: number; key?: string; kind?: Kind; to?: string }
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
let S: { versions: Version[]; cur: number; events: Ev[]; rejected: Record<string, boolean>; reviewed: Record<string, boolean>; extra: Json[]; scan?: Scan };
/** The last media scan: when it ran, how many photos it read, and what each check found. */
interface Scan { at: string; photos: number; uploads: number; found: { check: string; n: number; note: string }[] }

/* The replay's grants as app versions. hub/site/replay-data.js (globalThis.REPLAY, written by scripts/replay-data.mjs
   from `3pt replay`) holds every grant and revoke of the 92 replayed months. Each grant becomes one version; a revoke
   marks the version that made it rolled back. CAP is the same grant → capability map as harness/apps/cli/src/replay.ts;
   KIND is AUTHORED from each check's note in PROJECT_CHECKS (harness/packages/instrument/src/index.ts). */
const CAP: Record<string, string> = {
  'field.unit_level_trade': 'fields', 'tool.open_wall_gap': 'remind', 'flag.issue_on_arrival': 'issue', 'tool.owner_pack': 'pack',
  'field.wall_state': 'wall', 'context.photos_per_question_20': 'wide', 'screen.by_role': 'screens', 'tool.closeout_set': 'closeout',
  'tool.drop_bursts': 'bursts', 'flag.hazard': 'hazard',
};
const KIND: Record<string, [Kind, string?]> = {
  fields: ['automate'], remind: ['suggest', 'the super'], issue: ['suggest', 'the super'], pack: ['automate'], wall: ['automate'],
  wide: ['improve'], screens: ['improve'], closeout: ['automate'], bursts: ['automate'], hazard: ['suggest', 'the safety manager'],
};
async function replayData(): Promise<any> {
  const g = globalThis as any;
  if (!g.REPLAY) { try { const { repo } = await import('./sim.js'); await import(repo() + 'hub/site/replay-data.js'); } catch { /* not on disk: the simulator's history */ } }
  return g.REPLAY ?? null;
}
function fromReplay(R: any): Version[] {
  const caps = new Set<string>(), live = new Map<string, Version>();
  const snap = () => {
    const fields = ['description', 'date', 'source'].concat(caps.has('fields') ? ['unit', 'level', 'trade'] : [], caps.has('wall') ? ['wall'] : [], caps.has('issue') ? ['issue'] : []);
    let layout: Record<string, string[]> = caps.has('screens') ? JSON.parse(JSON.stringify(LAYOUT_LEARNED)) : {};
    if (caps.has('hazard')) layout = { ...layout, safety: ['hazards', 'needs', 'photos_week'] };
    return { fields, layout };
  };
  const versions: Version[] = [{ v: 0, when: R.first + '-01', by: 'install', changes: ['Generic start: describe each image, its date and its source'], why: 'Install', ...snap() }];
  for (const m of R.months) for (const e of m.events) {
    const cap = CAP[e.grant];
    if (e.k === '+' && cap) {
      const [problem, fix = problem] = String(e.note).split('; ');
      const said = fix.replace(/^flag them\b/i, 'Flag these photos');   /* the hazard note says "flag them"; a notice stands alone */
      caps.add(cap);
      const [kind, to] = KIND[cap] ?? ['improve'];
      const nv: Version = { v: versions.length, when: m.month + '-01', by: 'harness', changes: [said[0].toUpperCase() + said.slice(1)], why: problem, kind, ...(to ? { to } : {}), ...snap() };
      versions.push(nv); live.set(e.grant, nv);
    }
    if (e.k === '-' && cap && live.has(e.grant)) {
      const old = live.get(e.grant)!; old.rolledBack = true; old.changes = old.changes.concat(`Undone ${m.month}: ${e.note}`);
      live.delete(e.grant); caps.delete(cap);
    }
  }
  return versions;
}

async function seed() {
  const R = await replayData();
  if (R?.months?.length) {
    const versions = fromReplay(R);
    S = { versions, cur: versions.filter(v => !v.rolledBack).slice(-1)[0].v, events: [], rejected: {}, reviewed: {}, extra: [] };
    return;
  }
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
export function persistTo(s: Store | null): void { store = s; }   /* null: stop persisting (the Worker's fallback) */
async function snapshot(why: string) {
  if (!store) return;
  try { await store.insert(COLLECTIONS.app_state, { ts: Date.now(), why, versions: S.versions, cur: S.cur, rejected: S.rejected, reviewed: S.reviewed, extra: S.extra, events: S.events.slice(-500), scan: S.scan }); }
  catch (e) { console.error('[app] snapshot not saved:', (e as Error).message); }
}
async function record(e: Ev) { if (store) try { await store.insert(COLLECTIONS.app_events, { ...e }); } catch { /* the snapshot still carries it */ } }
async function state() {
  if (S) return S;
  if (store) {
    try {
      const last = await store.latest<any>(COLLECTIONS.app_state, 'ts');
      if (last?.versions?.length) { S = { versions: last.versions, cur: last.cur, events: last.events ?? [], rejected: last.rejected ?? {}, reviewed: last.reviewed ?? {}, extra: last.extra ?? [], scan: last.scan }; return S; }
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
  /* only ids in BLOCKS count: a client that sends any other id (a project id, a card of its own) must never reach
     BLOCKS[b].title below, or every later tap by this role fails on the same saved events */
  ev.filter(e => e.action === 'use' && e.block && BLOCKS[e.block]).forEach(e => { use[e.block!] = (use[e.block!] ?? 0) + 1; });
  for (const b of Object.keys(use)) {
    const i = lay.indexOf(b), key = `${role}:top:${b}`;
    if (use[b] >= 3 && i > 0 && !S.rejected[key]) return { key, kind: 'layout', text: `Move "${BLOCKS[b].title}" to the top of this screen?`, why: `Used ${use[b]} times in this version. It sits at position ${i + 1}.`, apply: { move: b, role } };
  }
  for (const b of Object.keys(use)) {
    const key = `${role}:add:${b}`;
    if (use[b] >= 2 && !lay.includes(b) && !S.rejected[key]) return { key, kind: 'layout', text: `Add "${BLOCKS[b].title}" to this screen?`, why: `Opened from "Add to my screen" ${use[b]} times.`, apply: { add: b, role } };
  }
  const hid = ev.filter(e => e.action === 'hide' && e.block && BLOCKS[e.block]);
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
  if (p.say) nv.changes = [p.say];
  if (p.who) { nv.kind = p.who; if (p.to) nv.to = p.to; }
  S.versions.push(nv); S.cur = nv.v; return nv;
}

async function ask(pid: string, q: string) {
  const F = await firm(new URLSearchParams()), TW = F.TODAY_WEEK, ps = await photosOf(pid), f = ver().fields;
  if (q === 'plumb') { const has = f.includes('wall'); return { note: has ? 'Uses the "open or closed wall" field.' : 'This version cannot tell open walls from closed.', photos: ps.filter(p => p.trade === 'plumbing' || (!has && p.trade === 'drywall')).filter(p => !has || p.wall === 'open').slice(0, 12) }; }
  if (q === 'water') { const has = f.includes('issue'); return { note: has ? 'Uses the "issue" field.' : 'No field for water yet. Tap 👎 on wrong ones.', photos: has ? ps.filter(p => p.water) : ps.filter(p => p.trade === 'drywall').slice(0, 12) }; }
  if (q === 'window') { const has = f.includes('near_window'); return { note: has ? 'Uses the "near_window" field.' : 'No field for windows yet. These are guesses. Tap 👎 on wrong ones.', photos: has ? ps.filter(p => p.near_window) : ps.filter(p => p.focus).slice(0, 12) }; }
  if (q.startsWith('tag:') && f.includes(q)) { const ws = q.slice(4).split(' '); return { note: `Uses the "${ws.join(' ')}" tag the media scan added.`, photos: ps.filter(p => ws.every(w => String(p.note ?? '').toLowerCase().includes(w))).slice(0, 12) }; }
  return { note: 'Everything filed this week.', photos: ps.filter(p => p.week === TW).slice(0, 12) };
}

/* ---------------- media: learn from new photos, and keep checking every photo so far ----------------
   3PT does not look inside an image (no vision model here). A new photo arrives with the uploader's tags (unit,
   trade, wall) and a free-text note; tag() reads the note for water and hazard words. scan() then reads every photo
   of every live job plus every upload and runs the media checks below. The first finding that asks for a change
   ships as a version, the same way plan() ships one, and guard() can undo it. The Worker's cron runs scan() every
   30 minutes, so patterns that build up slowly are found without a tap. Bars are demo settings, one per check. */
const WATER = /\b(leak\w*|stain\w*|wet|damp|water|drip\w*|mou?ld)\b/i;
const HAZARD = /\b(no rail|guard ?rail|open edge|ladder|unguarded|fall|harness|tripping|trip hazard|exposed wire\w*)\b/i;
const STOP = new Set('this that with from have there their about photo photos unit wall floor level today after before where which still into over some more very just been were they them then than what when will also only along near next under above behind around'.split(' '));
const TRADES = new Set(['framing', 'plumbing', 'electrical', 'drywall', 'finishes', 'exterior', 'paint', 'concrete', 'steel', 'hvac', 'insulation', 'site']);
const KEEP_FILES = 12;   /* uploads keep their thumbnail in the snapshot; older ones fall back to a pool photo of the trade */

function tag(note: string) { return { water: WATER.test(note), hazard: HAZARD.test(note) ? (note.match(HAZARD)![0].toLowerCase()) : null }; }
function words(note: string) { return [...new Set(note.toLowerCase().match(/[a-z]{4,}/g) ?? [])].filter(w => !STOP.has(w) && !TRADES.has(w)); }

async function scan(): Promise<Json | null> {
  const F = await firm(new URLSearchParams()), TW = F.TODAY_WEEK, f = ver().fields;
  const live = F.projects.filter((p: any) => F.status(p, TW) === 'live');
  const all: Json[] = [], missing: string[] = [];
  for (const sp of live) { const ps = await photosOf(sp.id); all.push(...ps); units(ps, sp).filter(u => u.missing).forEach(u => missing.push(`${sp.name} ${u.unit}`)); }
  const ups = S.extra.filter(x => x.upload), found: Scan['found'] = [];
  const cand: Json[] = [];

  /* 1 · words that keep coming back in notes become one tag and a search. Words that always come together
     ("hairline crack") are one tag, in the order the first note wrote them. */
  const seen: Record<string, string[]> = {};
  ups.forEach(x => words(x.note ?? '').forEach(w => { (seen[w] ??= []).push(x.id); }));
  const tagged = new Set(f.filter(t => t.startsWith('tag:')).flatMap(t => t.slice(4).split(' ')));
  const top = Object.entries(seen).sort((a, b) => b[1].length - a[1].length).find(([w, ids]) => ids.length >= 3 && !tagged.has(w) && !S.rejected['media:tag:' + w]);
  const group = top ? words(ups.find(x => x.id === top[1][0])!.note).filter(w => seen[w].join() === top[1].join() && !tagged.has(w)) : [];
  const label = group.join(' '), n = top?.[1].length ?? 0;
  found.push({ check: 'repeat-word', n, note: top ? `"${label}" in ${n} new photos` : 'no word in 3 or more new photos' });
  if (top) cand.push({ key: 'media:tag:' + top[0], apply: { field: 'tag:' + label }, say: `Tag photos that mention "${label}" and let people search for them`, why: `${n} new photos mention "${label}". No field held it.`, who: 'improve' });

  /* 2 · water in new photos, and no field for it yet */
  const wet = all.filter(x => x.water && x.week >= TW - 2);
  found.push({ check: 'water', n: wet.length, note: `${wet.length} water photos in 3 weeks` });
  if (wet.length >= 3 && !f.includes('issue') && !S.rejected['media:issue']) cand.push({ key: 'media:issue', apply: { field: 'issue' }, say: 'Flag water stains the day the photo arrives', why: `${wet.length} photos in 3 weeks show water. Nothing flagged them.`, who: 'suggest', to: 'the super' });

  /* 3 · a hazard in a recent photo, and the safety manager's screen has no hazards block */
  const hz = all.filter(x => x.hazard && x.week >= TW - 2);
  found.push({ check: 'hazard', n: hz.length, note: `${hz.length} hazard photos in 3 weeks` });
  if (hz.length >= 1 && !layoutFor('safety').includes('hazards') && !S.rejected['safety:add:hazards']) cand.push({ key: 'safety:add:hazards', apply: { add: 'hazards', role: 'safety' }, say: 'Flag these photos to the safety manager the same day', why: `${hz.length} recent photos show a hazard (${hz[0].hazard}).`, who: 'suggest', to: 'the safety manager' });

  /* 4 · walls close without the pipe photo, across jobs: the super's screen opens on the units closing */
  found.push({ check: 'wall-gap', n: missing.length, note: missing.length ? `${missing.length} unit${missing.length === 1 ? '' : 's'} closed with no pipe photo` : 'every closed wall has its pipe photo' });
  if (missing.length >= 3 && layoutFor('super')[0] !== 'beforeclose' && !S.rejected['super:top:beforeclose']) cand.push({ key: 'super:top:beforeclose', apply: { move: 'beforeclose', role: 'super' }, say: 'Open the super\'s screen on the units about to close', why: `${missing.length} units closed with no open-wall photo: ${missing.slice(0, 3).join(', ')}.`, who: 'suggest', to: 'the super' });

  /* 5 · bursts: three or more uploads of one unit and trade in one week */
  const burst: Record<string, number> = {};
  ups.forEach(x => { const k = `${x.project}:${x.unit}:${x.trade}:${x.week}`; burst[k] = (burst[k] ?? 0) + 1; });
  const b = Object.values(burst).filter(n => n >= 3).length;
  found.push({ check: 'bursts', n: b, note: b ? `${b} bursts of 3 or more shots` : 'no bursts' });
  if (b && !S.reviewed['media:bursts'] && !S.rejected['media:bursts']) cand.push({ key: 'media:bursts', apply: {}, say: 'Keep one shot per burst after 24 hours', why: `${b} bursts of 3 or more shots of the same unit and trade.`, who: 'automate', mark: 'media:bursts' });

  S.scan = { at: new Date().toISOString(), photos: all.length, uploads: ups.length, found };
  const p = cand[0];
  if (!p) return null;
  if (p.mark) S.reviewed[p.mark] = true;
  const nv = build(p, 'harness'); nv.key = p.key;
  return { version: nv.v, changes: nv.changes, why: nv.why };
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
    return { status: 200, body: { current: v.v, fields: v.fields, layouts: v.layout, versions: S.versions.slice().reverse().map(x => ({ ...x, score: score(x.v) })), events: S.events.length, scan: S.scan ?? null } };
  }
  /* the bulb: a version counts as news once build() saved it and it is still live. A rolled-back version drops out,
     so a failed change never shows up as a feature. The surface keeps "since" (the last version it showed). */
  if (path === '/app/news' && method === 'GET') {
    const since = Number(q.get('since') ?? -1);
    const items = S.versions.filter(v => v.v > 0 && v.v > since && !v.rolledBack).reverse().slice(0, 12)
      .map(v => ({ v: v.v, when: v.when, by: v.by, changes: v.changes, why: v.why, kind: v.kind, to: v.to }));
    return { status: 200, body: { current: S.cur, items } };
  }
  if (path === '/app/photos' && method === 'POST') {
    const F = await firm(new URLSearchParams()), TW = F.TODAY_WEEK, sp = F.projects.find((x: any) => x.id === body.project);
    if (!sp) return { status: 404, body: { error: 'no such project' } };
    const note = String(body.note ?? '').slice(0, 280), unit = body.unit == null || body.unit === '' ? null : Number(body.unit);
    const trade = TRADES.has(String(body.trade)) ? String(body.trade) : 'site';
    const file = typeof body.file === 'string' && body.file.startsWith('data:image/') && body.file.length < 200_000 ? body.file : null;
    const photo: Json = { project: sp.id, id: `up-${S.extra.length}`, upload: true, unit, level: unit ? Math.floor(unit / 100) : null, trade, wall: body.wall === 'open' || body.wall === 'closed' ? body.wall : null,
      week: TW, note, focus: unit != null, ...tag(note), file: file ?? pool(trade, S.extra.length) };
    S.extra.push(photo);
    /* only the newest uploads keep their own thumbnail, so the snapshot stays small */
    const ups = S.extra.filter(x => x.upload && String(x.file ?? '').startsWith('data:'));
    ups.slice(0, Math.max(0, ups.length - KEEP_FILES)).forEach(x => { x.file = pool(x.trade, 0); });
    const e: Ev = { t: Date.now(), v: S.cur, role: String(body.role ?? 'super'), action: 'upload', photo: photo.id };
    S.events.push(e); await record(e);
    const bad = guard(), shipped = bad ? null : await scan();
    await snapshot(shipped ? `media scan v${shipped.version}` : bad ? `self-rollback v${bad.v}` : 'upload ' + photo.id);
    return { status: 200, body: { ok: true, photo, shipped, rolled_back: bad ? { version: bad.v, to: S.cur, why: `Scored ${score(bad.v)}% useful against ${score(S.cur)}% before it` } : null, scan: S.scan } };
  }
  if (path === '/app/scan' && method === 'POST') {
    const shipped = await scan();
    await snapshot(shipped ? `media scan v${shipped.version}` : 'media scan');
    return { status: 200, body: { ok: true, shipped, scan: S.scan } };
  }
  if (path === '/app/reset' && method === 'POST') { await seed(); await snapshot('reset'); return { status: 200, body: { ok: true } }; }
  return { status: 404, body: { error: 'not found' } };
}
