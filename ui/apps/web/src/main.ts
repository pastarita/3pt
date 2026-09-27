/**
 * 3PT app: the role-based screen a non-technical person uses every day.
 *
 *   ┌───────────────────────────────┬──────────────┐
 *   │ main: projects, or one project │ side: assistant (ask box,
 *   │ with role-focused cards        │ quick actions, earlier chats)
 *   └───────────────────────────────┴──────────────┘
 *
 * Routes (hash): #/ home · #/p/<id> project · #/harness versions · #/setup first run · #/flags feature flags.
 * Conventions the capture suite relies on (docs/13-ui-capture.md):
 *   data-region="<name>"  every part of the screen a tour, a test or an image crop can point at
 *   data-screen="<name>"  on <main>, the screen that is showing
 *   window.__app          read-only state for the capture suite
 */
import { appCssVars } from '@3pt/design-system';
import './styles.css';
import {
  LIVE, LAYOUT, LESSONS, PHOTOS, PROJECT_QUICK, QUICK, ROLES, SESSIONS,
  WIDGETS, cardsFor, isWidget, photo, project, projectsFor, role, saversFor, unitStatus,
  type CardId, type Project, type RoleId, type Tone, type Widget, type WidgetId,
} from './data';
import { icon, mark, photoArt } from './art';
import { flags, on, resetFlags, setFlag, DEFAULTS, type Flag } from './flags';
import { autostart, endTour, resetTours, startTour, tourActive, tourStep, TOURS } from './tour';
import { reply, type Msg } from './agent';
import { addPhoto, api, loadLive, refreshHarness, send, setTurnHandler } from './live';
import { bulb, kindLabel } from './bulb';
import type { HarnessState } from '@3pt/inspector-client';

const vars = document.createElement('style');
vars.textContent = appCssVars();
document.head.prepend(vars);

/* ---------- state ---------- */

interface State {
  role: RoleId | null;
  visits: number;                      // project opens; drives progressive disclosure
  expanded: Record<string, boolean>;   // "show more" per project
  savers: Record<string, 'on' | 'no'>;
  undone: Record<number, boolean>;
  insights: Record<string, boolean>;   // insights acted on
  dismissed: Record<string, boolean>;  // insights set aside with "Not now"
  chat: Msg[];
  sheet: boolean;                      // phone: assistant sheet open
}
const KEY = 'tpt_web_state';
const fresh = (): State => ({ role: null, visits: 0, expanded: {}, savers: {}, undone: {}, insights: {}, dismissed: {}, chat: [], sheet: false });
let S: State = (() => { try { return { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return fresh(); } })();
S.sheet = false;
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* private mode */ } };

/** Event log for the Instrument stage: what people tap, per role. Kept locally, and sent to the loop when the API answers (live.ts). */
function log(action: string, detail?: string) {
  try {
    const k = 'tpt_web_events';
    const a = JSON.parse(localStorage.getItem(k) || '[]');
    a.push({ t: Date.now(), role: S.role, action, detail });
    localStorage.setItem(k, JSON.stringify(a.slice(-500)));
  } catch { /* ignore */ }
  send(action, detail, S.role);
}

/* ---------- routing ---------- */

type Route = { screen: 'home' } | { screen: 'project'; id: string } | { screen: 'harness' } | { screen: 'setup' } | { screen: 'flags' } | { screen: 'components' };
function route(): Route {
  const h = location.hash.replace(/^#\/?/, '');
  if (h.startsWith('p/')) return { screen: 'project', id: h.slice(2) };
  if (h === 'flags') return { screen: 'flags' };
  if (h === 'harness') return { screen: 'harness' };
  if (h === 'components') return { screen: 'components' };
  if (h === 'setup' || (!S.role && on('setup'))) return { screen: 'setup' };
  return { screen: 'home' };
}
const go = (h: string) => { location.hash = h; };

/* ---------- small parts ---------- */

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const me = () => role(S.role ?? 'super');
const statusPill = (p: Project) =>
  p.status === 'live' ? '<span class="pill good">In progress</span>'
  : p.status === 'planned' ? '<span class="pill">Starts soon</span>'
  : '<span class="pill quiet">Finished</span>';
const coverPhoto = (p: Project) => PHOTOS.find(x => x.project === p.id && x.kind === p.cover) ?? { id: `cover-${p.id}`, kind: p.cover };
const pic = (id: string, label: string) => { const x = photo(id); return x ? photoArt(x, label) : ''; };

/** One line under each project card, written for the person looking. */
function roleLine(p: Project, r: RoleId): string {
  if (p.status === 'done') return r === 'owner' ? 'See what it cost and what you got' : `Lessons from this job help ${project(LIVE.demo)?.name ?? 'the next job'}`;
  if (p.status === 'planned') return p.next;
  const n = LAYOUT[r].filter(c => isWidget(c) && !S.insights[c] && !S.dismissed[c]).length;
  if (r === 'owner') return `${p.percent}% done · ${n} new from 3PT`;
  return n ? `${n} new ${n === 1 ? 'thing' : 'things'} from 3PT today` : 'You are up to date';
}

/* ---------- screens ---------- */

function setupScreen(): string {
  return `<section class="setup" data-region="setup">
    <div class="setup-mark">${mark()}</div>
    <h1>Welcome. What is your job?</h1>
    <p class="lead">Pick one. We will show you only what matters for it. You can change it later.</p>
    <div class="role-grid" data-region="role-picker">
      ${ROLES.map(r => `<button class="role-tile" data-act="pick-role" data-id="${r.id}">
        <span class="role-ic">${icon(r.icon, 'ic lg')}</span><b>${r.name}</b><small>${r.blurb}</small></button>`).join('')}
    </div>
  </section>`;
}

function homeCard(p: Project): string {
  const c = coverPhoto(p);
  return `<a class="pcard" href="#/p/${p.id}" data-region="project-${p.id}">
    <div class="pcard-photo">${photoArt(c, `${p.name} photo`)}${statusPill(p)}</div>
    <div class="pcard-body"><b>${p.name}</b><span class="meta">${p.kind} · ${p.when}</span>
    <span class="role-line">${esc(roleLine(p, me().id))}</span></div></a>`;
}

function homeScreen(): string {
  const r = me();
  const list = projectsFor(r.id);
  const live = list.filter(p => p.status !== 'done');
  const done = list.filter(p => p.status === 'done');
  const grid = (ps: Project[]) => ps.map(homeCard).join('');
  return `<header class="page-head">
      <div><p class="hello">Good morning, ${r.person}</p><h1>Your projects</h1></div>
    </header>
    <section data-region="projects">
      <div class="pgrid">${grid(live)}</div>
      ${done.length ? `<h2 class="section">Finished <small class="muted">${done.length} jobs · each one left lessons</small></h2>
        <div class="pgrid small">${grid(S.expanded.done ? done : done.slice(0, 6))}</div>
        ${done.length > 6 && !S.expanded.done ? `<button class="more" data-act="more" data-id="done">${icon('plus', 'ic sm')} Show all ${done.length}</button>` : ''}` : ''}
    </section>`;
}

type HarnessCard = Exclude<CardId, WidgetId>;
const CARD_TITLE: Record<HarnessCard, [string, string]> = {
  week: ['This week in photos', 'image'], savers: ['Time savers', 'clock'], learned: ['What your assistant learned', 'bulb'],
  lookback: ['Looking back', 'clock'], upcoming: ['Before it starts', 'flag'],
};

/**
 * One card. A familiar widget shows the screen the role already knows (its daily log, punch list,
 * pay application) with the harness insight on top. The first card of each kind carries the
 * `insight` and `familiar` regions, so the tour can point at "what 3PT added" and "what you know".
 */
function card(id: CardId, p: Project, first: boolean): string {
  if (isWidget(id)) return widgetCard(WIDGETS[id], first);
  const [title, ic] = CARD_TITLE[id];
  const body = CARD_BODY[id](p);
  if (!body) return '';
  return `<article class="card wide" data-region="card-${id}">
    <header><span class="card-ic">${icon(ic, 'ic sm')}</span><h2>${title}</h2></header>${body}</article>`;
}

const TONE: Record<Tone, string> = { good: 'good', warn: 'warn', alert: 'alert', quiet: 'quiet' };
function widgetCard(w: Widget, first: boolean): string {
  const done = S.insights[w.id];
  const ins = w.insight;
  const insight = `<div class="insight${done ? ' is-done' : ''}"${first ? ' data-region="insight"' : ''}>
      <div class="insight-top"><span class="insight-tag">${icon('sparkle', 'ic sm')} 3PT noticed</span><small>${ins.basis}</small></div>
      <p>${ins.text}</p>
      <div class="insight-row">${(ins.photos ?? []).slice(0, 3).map(id => `<button class="mini" data-act="photo" data-id="${id}">${pic(id, id)}</button>`).join('')}
        <span class="grow"></span>
        ${done ? `<span class="pill good">${icon('check', 'ic sm')} ${ins.done}</span>` : `<button class="btn ghost small" data-act="dismiss" data-id="${w.id}">Not now</button><button class="btn primary small" data-act="insight" data-id="${w.id}">${ins.action}</button>`}
      </div></div>`;
  return `<article class="card" data-region="card-${w.id}">
    <header><span class="card-ic">${icon(w.icon, 'ic sm')}</span><h2>${w.title}</h2></header>
    ${S.dismissed[w.id] ? '' : insight}
    <div class="familiar"${first ? ' data-region="familiar"' : ''}>${familiar(w)}</div></article>`;
}

function familiar(w: Widget): string {
  if (w.kind === 'units') {
    return `<div class="units">${unitStatus().map(u => `<div class="unit ${u.state}"><b>${u.unit}</b><small>${
      u.state === 'missing' ? 'Photo missing' : u.state === 'closed' ? 'Closed' : 'Open'}</small></div>`).join('')}</div>
      <p class="hint"><span class="key missing"></span> needs a photo <span class="key closed"></span> wall closed <span class="key open"></span> still open</p>`;
  }
  if (w.kind === 'stats') return `<div class="stats">${(w.stats ?? []).map(([n, l]) => `<div><b>${n}</b><small>${l}</small></div>`).join('')}</div>`;
  if (w.kind === 'pairs') {
    const pairs: [string, string][] = [['IMG_2100', 'IMG_2103'], ['IMG_2104', 'IMG_2107'], ['IMG_2112', 'IMG_2115']];
    return `<div class="pairs">${pairs.map(([a, b]) => `<div class="pair"><button class="thumb" data-act="photo" data-id="${a}">${pic(a, 'Before')}<span>Wk 9</span></button><button class="thumb" data-act="photo" data-id="${b}">${pic(b, 'Now')}<span>Wk 14</span></button></div>`).join('')}</div>`;
  }
  return `<ul class="rows">${(w.rows ?? []).map(r => `<li>${r.photo ? `<button class="mini" data-act="photo" data-id="${r.photo}">${pic(r.photo, r.label)}</button>` : ''}
    <div class="row-text"><b>${r.label}</b>${r.sub ? `<small>${r.sub}</small>` : ''}</div>
    ${r.chip ? `<span class="pill ${TONE[r.chip[1]]}">${r.chip[0]}</span>` : ''}</li>`).join('')}</ul>`;
}

const CARD_BODY: Record<HarnessCard, (p: Project) => string> = {
  week: p => {
    const ph = PHOTOS.filter(x => x.project === p.id && x.week >= 13).slice(-8).reverse();
    if (!ph.length) return '<p class="muted">No photos yet this week.</p>';
    return `<div class="photos">${ph.map(x => `<button class="thumb" data-act="photo" data-id="${x.id}">${photoArt(x, `Unit ${x.unit ?? 'site'} ${x.kind}`)}<span>${x.unit ?? 'Outside'}</span></button>`).join('')}</div>`;
  },
  savers: () => {
    if (!on('cards.savers')) return '';
    const list = saversFor(me().id);
    return `<div class="savers">${list.map(s => {
      const st = S.savers[s.id];
      return `<div class="saver${st === 'on' ? ' is-on' : ''}"><div class="hours"><b>${s.hours}</b><small>hours a job</small></div>
        <div class="saver-text"><b>${s.title}</b><small>${s.why}</small></div>
        ${st === 'on' ? `<span class="pill good">${icon('check', 'ic sm')} On</span>`
          : st === 'no' ? '<span class="pill quiet">Not now</span>'
          : `<div class="saver-acts"><button class="btn ghost" data-act="saver-no" data-id="${s.id}">Not now</button><button class="btn primary" data-act="saver-on" data-id="${s.id}">Turn on</button></div>`}
      </div>`;
    }).join('')}</div>`;
  },
  learned: () => {
    if (!on('cards.learned')) return '';
    return `<ol class="lessons">${LESSONS.slice().reverse().map((l, i) => {
      const undone = l.undone || S.undone[l.v];
      return `<li class="${undone ? 'undone' : ''}"><span class="when">${l.when}</span><div><p>${l.plain}</p><small>${l.by}${undone ? ' · undone' : ''}</small></div>
        ${!undone && i === 0 ? `<button class="btn ghost small" data-act="undo" data-id="${l.v}" data-region="undo">${icon('undo', 'ic sm')} Undo</button>` : ''}</li>`;
    }).join('')}</ol>`;
  },
  lookback: () => `<ul class="checks"><li>${icon('check', 'ic sm')} Take the pipe photo before drywall, every unit</li><li>${icon('check', 'ic sm')} Send the owner photos every Friday</li><li>${icon('check', 'ic sm')} Check window walls for water</li></ul><p class="muted">These three lessons now run on Tower B.</p>`,
  upcoming: () => `<ul class="checks"><li>${icon('check', 'ic sm')} Starts with 5 lessons from Tower A and Riverside Clinic</li><li>${icon('check', 'ic sm')} Pipe-photo reminders on from day one</li><li>${icon('check', 'ic sm')} Owner photo update every Friday</li></ul>`,
};

function projectScreen(id: string): string {
  const p = project(id);
  if (!p) return `<p>That project does not exist. <a href="#/">Back to projects</a></p>`;
  const r = me();
  const all = cardsFor(r.id, p).filter(c => (c !== 'savers' || on('cards.savers')) && (c !== 'learned' || on('cards.learned')));
  // Progressive disclosure: three cards first. The rest open on "Show more", or by themselves
  // from the second project visit on, or at once in presenter mode.
  const openAll = S.expanded[p.id] || S.visits > 1 || on('presenter');
  const first = openAll ? all : all.slice(0, 3);
  const rest = all.length - first.length;
  const c = coverPhoto(p);
  const canAdd = LIVE.source === 'api' && p.status === 'live';
  return `<nav class="crumbs"><a href="#/" class="back" data-region="back">${icon('back', 'ic sm')} Projects</a>
      ${canAdd ? `<button class="btn primary small" data-act="add-photo" data-id="${p.id}" data-region="add-photo">${icon('camera', 'ic sm')} Add a photo</button>` : ''}</nav>
    <header class="banner" data-region="banner">${photoArt(c, `${p.name} photo`)}
      <div class="banner-text">${statusPill(p)}<h1>${p.name}</h1><span>${p.kind} · ${p.where} · ${p.when}</span></div>
      <span class="who">${icon(r.icon, 'ic sm')} You are the ${r.name.toLowerCase()}</span></header>
    <div class="cards">${first.map((cid, i) => card(cid, p, i === first.findIndex(isWidget))).join('')}</div>
    ${rest > 0 ? `<button class="more" data-act="more" data-id="${p.id}" data-region="more">${icon('plus', 'ic sm')} Show ${rest} more</button>` : ''}`;
}

/**
 * Component library: every part of the app, rendered by the same functions the screens use, so it
 * cannot drift from them. K-numbers match the hub design-system leaf (§8); A-numbers are app-only.
 * The capture suite screenshots this screen for the hub Components leaf.
 */
function componentsScreen(): string {
  const tp = project('towerb')!;
  const r = me();
  const sec = (id: string, name: string, note: string, body: string) =>
    `<section class="comp" data-region="comp-${id.toLowerCase()}"><header><span class="pill quiet">${id}</span><b>${name}</b><small>${note}</small></header><div class="comp-body">${body}</div></section>`;
  return `<header class="page-head"><div><p class="hello">3PT app</p><h1>Component library</h1>
      <p class="lead">Live parts of the app. K numbers match the hub design system.</p></div></header>
    <div class="comps">
    ${sec('K1', 'Button', 'Primary, ghost, small. One primary per card.', `<div class="row-btns start"><button class="btn primary">Review draft</button><button class="btn ghost">Not now</button><button class="btn ghost small">${icon('undo', 'ic sm')} Undo</button><button class="btn primary small">Turn on</button></div>`)}
    ${sec('K2', 'Status pill', 'Good, warn, alert, quiet. Words first, color second.', `<div class="row-btns start"><span class="pill good">Filled</span><span class="pill warn">Due soon</span><span class="pill alert">Photo missing</span><span class="pill quiet">Drafted</span></div>`)}
    ${sec('A1', 'Quick question', 'A one-tap question in the assistant.', `<div class="quick narrow">${QUICK[r.id].slice(0, 2).map(q => `<button class="chip">${icon(q.icon, 'ic sm')} ${q.label}</button>`).join('')}</div>`)}
    ${sec('K4', 'Project card', 'Photo first. One line for this role.', `<div class="pgrid narrow">${homeCard(tp)}</div>`)}
    ${sec('K10', 'Insight on a familiar widget', 'What 3PT noticed, what it looked at, one action and one no.', `<div class="narrow-card">${widgetCard(WIDGETS.dailylog, false)}</div>`)}
    ${sec('K7', 'Unit grid', 'One square per unit. Red means act before the wall closes.', `<div class="narrow-card">${widgetCard(WIDGETS.predrywall, false)}</div>`)}
    ${sec('K5', 'Stat tiles', 'Big number, plain label.', `<div class="narrow-card">${widgetCard(WIDGETS.inspections, false)}</div>`)}
    ${sec('A2', 'Then and now', 'Photo pairs for the owner.', `<div class="card">${familiar(WIDGETS.weekly)}</div>`)}
    ${sec('A3', 'Photo grid', 'Tap a photo to see it big.', `<div class="card">${CARD_BODY.week(tp)}</div>`)}
    ${sec('K10', 'Time saver', 'Hours saved a job, the reason, yes or not now.', `<div class="card">${CARD_BODY.savers(tp)}</div>`)}
    ${sec('K6', 'Change log with undo', 'The harness, explained in plain words.', `<div class="card">${CARD_BODY.learned(tp)}</div>`)}
    ${sec('A4', 'Chat', 'Your question right, the answer left, photos below.', `<div class="thread"><div class="msg me"><p>Find photos of unit 203</p></div><div class="msg ai"><p>I found 6 photos of unit 203. The newest is from week 14.</p><div class="msg-photos">${['IMG_2108', 'IMG_2109', 'IMG_2110', 'IMG_2111'].map(id => `<button class="thumb">${pic(id, id)}</button>`).join('')}</div></div></div>`)}
    ${sec('A5', 'Ask box', 'Always at the bottom of the assistant. Enter sends.', `<form class="composer flat" onsubmit="return false"><textarea rows="2" placeholder="Ask about Tower B…" aria-label="Ask"></textarea><div class="composer-row"><span class="ctx">${icon(r.icon, 'ic sm')} ${r.name} · Tower B</span><button class="send" type="button" aria-label="Send">${icon('up', 'ic sm')}</button></div></form>`)}
    ${sec('A6', 'Tip', 'One region at a time. Skip is always there.', `<div class="tour-pop static"><div class="tour-head"><span class="tour-kicker">${icon('compass', 'ic sm')} Tip 2 of 4</span><button class="icon-btn" aria-label="Close">${icon('close', 'ic sm')}</button></div><h3>What 3PT noticed</h3><p>On top, 3PT adds one thing it found in your photos.</p><div class="tour-foot"><span class="dots"><i></i><i class="on"></i><i></i><i></i></span><button class="btn ghost">Back</button><button class="btn primary">Next</button></div></div>`)}
    ${sec('A7', 'Role tile', 'First run: pick your job.', `<div class="role-grid narrow">${ROLES.slice(0, 2).map(x => `<button class="role-tile"><span class="role-ic">${icon(x.icon, 'ic lg')}</span><b>${x.name}</b><small>${x.blurb}</small></button>`).join('')}</div>`)}
    </div>`;
}

function flagsScreen(): string {
  const f = flags();
  return `<nav class="crumbs"><a href="#/" class="back">${icon('back', 'ic sm')} Projects</a></nav>
    <header class="page-head"><div><h1>Settings</h1><p class="lead">Turn parts of the app on or off. Presenter mode adds the "How it learns" tour.</p></div></header>
    <div class="flag-list" data-region="flags">${(Object.keys(DEFAULTS) as Flag[]).map(k => `<label class="flag-row"><span><b>${k}</b></span>
      <input type="checkbox" class="switch" data-flag="${k}" ${f[k] ? 'checked' : ''}></label>`).join('')}</div>
    <div class="row-btns"><button class="btn ghost" data-act="reset-tips">Show all tips again</button><button class="btn ghost" data-act="reset-flags">Reset settings</button><button class="btn ghost" data-act="reset-all">Start over</button><a class="btn ghost" href="#/components">Component library</a></div>`;
}

/* ---------- the harness: every version, newest first, with rollback ---------- */

/** Loaded on demand from @3pt/api; `null` until then. A shipped or undone version clears it. */
let HS: HarnessState | null = null, hsLoad: 'idle' | 'busy' | 'failed' = 'idle';
async function loadHarness() {
  if (hsLoad === 'busy') return;
  hsLoad = 'busy';
  try { HS = await api.harness(); hsLoad = 'idle'; } catch { hsLoad = 'failed'; }
  if (route().screen === 'harness') render();
}

function harnessScreen(): string {
  const head = `<nav class="crumbs"><a href="#/" class="back">${icon('back', 'ic sm')} Projects</a></nav>`;
  if (!HS) {
    if (hsLoad === 'idle') void loadHarness();
    return `${head}<header class="page-head"><div><h1>How 3PT learns</h1><p class="lead">${hsLoad === 'failed' ? '3PT is not reachable right now. Try again in a minute.' : 'Loading every version…'}</p></div></header>`;
  }
  const cur = HS.versions.find(v => v.v === HS!.current);
  const pt = (k: string, name: string, text: string) => `<div class="loop-pt ${k}"><b>${name}</b><span>${esc(text)}</span></div>`;
  return `${head}
    <header class="page-head"><div><p class="hello">Version ${HS.current} is on duty · ${HS.events} taps this session</p><h1>How 3PT learns</h1>
      <p class="lead">Every tap is a signal. 3PT plans one change, builds it, and checks that it helped. Nobody approves it by hand.</p></div></header>
    <section class="loop" data-region="loop">
      ${pt('plan', 'Plan', 'Reads taps, hides and searches that came back empty. Picks one change.')}
      ${pt('build', 'Build', cur?.changes[0] ?? 'Nothing built yet.')}
      ${pt('instrument', 'Check', cur?.score != null ? `${cur.score}% of actions were useful in this version.` : 'Scores each version on useful actions. A drop means undo.')}
    </section>
    <h2 class="section">Pattern checks <small class="muted">${HS.scan ? `last run ${new Date(HS.scan.at).toLocaleString()} · ${HS.scan.photos} photos, ${HS.scan.uploads} added here` : 'not run yet'}</small></h2>
    <div class="scan" data-region="scan">
      ${(HS.scan?.found ?? []).map(f => `<div class="scan-row"><span class="pill ${f.n ? 'warn' : 'quiet'}">${esc(f.check)}</span><span>${esc(f.note)}</span></div>`).join('')}
      <p class="muted">3PT reads every photo so far every 30 minutes, and each time someone adds one. A pattern that asks for a change ships as a new version.</p>
      <button class="btn ghost small" data-act="scan">${icon('search', 'ic sm')} Check all photos now</button>
    </div>
    <h2 class="section">What it reads from each photo</h2>
    <div class="fields">${HS.fields.map(f => `<span class="pill quiet">${esc(f)}</span>`).join('')}</div>
    <h2 class="section">Every version <small class="muted">newest first · never edited</small></h2>
    <ol class="vers" data-region="versions">${HS.versions.map(v => `<li class="ver${v.v === HS!.current ? ' is-current' : ''}${v.rolledBack ? ' is-undone' : ''}">
      <span class="ver-n">v${v.v}</span>
      <div class="ver-text">${v.kind ? `<span class="kind ${v.kind}">${esc(kindLabel(v.kind, v.to))}</span>` : ''}
        <b>${esc(v.changes.join('. ') || 'The starting screen')}</b><small>${esc(v.when)} · ${v.by === 'harness' ? '3PT' : esc(v.by)}${v.why ? ` · ${esc(v.why)}` : ''}${v.rolledBack ? ' · undone' : ''}</small></div>
      ${v.v === HS!.current ? '<span class="pill good">On duty</span>' : v.rolledBack ? '' : `<button class="btn ghost small" data-act="rollback" data-id="${v.v}">${icon('undo', 'ic sm')} Go back to this</button>`}
    </li>`).join('')}</ol>`;
}

/* ---------- sidebar ---------- */

function sidebar(rt: Route): string {
  const r = me();
  const pid = rt.screen === 'project' ? rt.id : undefined;
  const quick = pid ? [...PROJECT_QUICK[r.id], ...QUICK[r.id]].slice(0, 4) : QUICK[r.id];
  const where = pid ? project(pid)?.name : undefined;
  const thread = S.chat.length
    ? `<div class="thread" data-region="thread">${S.chat.map(m => `<div class="msg ${m.from}"><p>${esc(m.text)}</p>${
        m.photos?.length ? `<div class="msg-photos">${m.photos.map(id => `<button class="thumb" data-act="photo" data-id="${id}">${pic(id, id)}</button>`).join('')}</div>` : ''}</div>`).join('')}</div>`
    : `<div class="side-hello"><span class="spark">${icon('sparkle', 'ic lg')}</span><b>What can I help with${where ? ` on ${where}` : ''}?</b><small>I know your photos, your projects and your job.</small></div>`;
  return `<div class="side-head"><b>${icon('sparkle', 'ic sm')} Assistant</b>
      ${S.chat.length ? `<button class="btn ghost small" data-act="new-chat">${icon('plus', 'ic sm')} New chat</button>` : ''}
      <button class="icon-btn sheet-close" data-act="sheet" aria-label="Close assistant">${icon('close', 'ic sm')}</button></div>
    <div class="side-scroll">${thread}
      ${S.chat.length ? '' : `<div class="quick" data-region="quick"><span class="label">Try asking</span>${quick.map(q => `<button class="chip" data-act="ask" data-prompt="${esc(q.prompt)}">${icon(q.icon, 'ic sm')} ${q.label}</button>`).join('')}</div>`}
      ${on('agent.history') && !S.chat.length ? `<div class="history" data-region="history"><span class="label">Earlier</span>${SESSIONS[r.id]
        .filter(s => !pid || !s.project || s.project === pid)
        .map(s => `<button class="hist" data-act="ask" data-prompt="${esc(s.title)}">${icon('chat', 'ic sm')}<span>${s.title}</span><small>${s.when}</small></button>`).join('')}</div>` : ''}
    </div>
    <form class="composer" data-region="composer" data-act="send">
      <textarea name="q" rows="2" placeholder="Ask about ${where ?? 'your projects'}…" aria-label="Ask your assistant"></textarea>
      <div class="composer-row"><span class="ctx">${icon(r.icon, 'ic sm')} ${r.name}${where ? ` · ${where}` : ''}</span>
      <button class="send" type="submit" aria-label="Send">${icon('up', 'ic sm')}</button></div>
    </form>`;
}

/* ---------- top bar ---------- */

function topbar(): string {
  const r = me();
  const rt = route();
  const tab = (href: string, label: string, on: boolean) => `<a class="nav-a${on ? ' on' : ''}" href="${href}"${on ? ' aria-current="page"' : ''}>${label}</a>`;
  const tip = TOURS.some(t => t.screen === rt.screen && t.flag === 'tour');
  return `<a class="brand" href="/" aria-label="3PT home">${mark()}<b>3PT</b></a>
    <nav class="topnav" aria-label="Site" data-region="site-nav">
      ${tab('#/', 'Projects', rt.screen === 'home' || rt.screen === 'project')}${tab('#/harness', 'How it learns', rt.screen === 'harness')}
      <span class="nav-sep" aria-hidden="true"></span>
      <a class="nav-a" href="/results/">Results</a><a class="nav-a" href="https://github.com/pastarita/3pt" target="_blank" rel="noopener">Code ↗</a>
    </nav>
    <div class="top-right">
      <span data-slot="bulb"></span>
      ${on('presenter') ? `<div class="tour-menu" data-region="tour-menu">${TOURS.filter(t => on(t.flag)).map(t => `<button class="chip small" data-act="tour" data-id="${t.id}">${icon('compass', 'ic sm')} ${t.name}</button>`).join('')}</div>` : ''}
      ${on('tour') && !on('presenter') && tip ? `<button class="icon-btn" data-act="help" aria-label="Show tips" data-region="help">${icon('compass')}</button>` : ''}
      <label class="role-select" data-region="role">${icon(r.icon, 'ic sm')}
        <select data-act="role" aria-label="Your job">${ROLES.map(x => `<option value="${x.id}" ${x.id === r.id ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>
      <a class="avatar" href="#/flags" aria-label="Settings" data-region="settings">${r.person[0]}</a>
    </div>`;
}

/* ---------- render ---------- */

const app = document.getElementById('app')!;
/* the bulb: lights up when 3PT ships a version. It rings at once when a tap here made it ship; the poll
   catches versions shipped from another device or by the Worker. Built once, put back after every render. */
const news = bulb(() => api.news(-1));
setTurnHandler(t => {
  if (t.shipped) toast(`3PT shipped version ${t.shipped.version}: ${t.shipped.changes[0]}`);
  else if (t.rolled_back) toast(`3PT undid version ${t.rolled_back.version}. ${t.rolled_back.why}.`);
  HS = null; void news.refresh(!!t.shipped);
  /* the harness changed its screen for this role: read it, then draw the cards in its new order */
  void refreshHarness().then(render).catch(() => undefined);
});
/** Photo note. The bundled photos are public domain or CC0 (no credit needed). Live photos from the API
 *  come from data/mock/media-pool, where some are CC BY / CC BY-SA, so the link to the credits stays. */
function credits(): string {
  return `<footer class="credits" data-region="credits">Photos: openly licensed. <a href="https://github.com/pastarita/3pt/blob/main/THIRD_PARTY.md" target="_blank" rel="noopener">Credits</a> · Buildings: NYC Open Data.</footer>`;
}

function render() {
  const rt = route();
  if (rt.screen === 'setup') {
    app.className = 'shell setup-mode';
    app.innerHTML = `<main data-screen="setup">${setupScreen()}${credits()}</main>`;
    return expose(rt);
  }
  app.className = 'shell' + (S.sheet ? ' sheet-open' : '');
  const main = rt.screen === 'project' ? projectScreen(rt.id) : rt.screen === 'harness' ? harnessScreen() : rt.screen === 'flags' ? flagsScreen() : rt.screen === 'components' ? componentsScreen() : homeScreen();
  app.innerHTML = `<header class="topbar" data-region="topbar">${topbar()}</header>
    <main class="main" data-screen="${rt.screen}" data-region="main">${main}${credits()}</main>
    <aside class="side" data-region="assistant" aria-label="Assistant">${sidebar(rt)}</aside>
    <button class="ask-fab" data-act="sheet" data-region="ask-fab" aria-label="Open assistant">${icon('sparkle', 'ic sm')} Ask</button>
    <div class="sheet-scrim" data-act="sheet"></div>`;
  app.querySelector('[data-slot="bulb"]')?.replaceWith(news.el);
  const th = app.querySelector('.thread');
  if (th) th.scrollTop = th.scrollHeight;
  expose(rt);
  if (rt.screen === 'home' || rt.screen === 'project' || (rt.screen === 'harness' && HS)) autostart(rt.screen);
}

/** Read-only view of app state for the capture suite. Never used by the app itself. */
function expose(rt: Route) {
  (window as unknown as { __app: unknown }).__app = {
    route: rt, role: S.role, visits: S.visits, flags: flags(), tour: tourStep(),
    regions: [...document.querySelectorAll<HTMLElement>('[data-region]')].map(e => e.dataset.region),
  };
}

/* ---------- actions ---------- */

function ask(text: string) {
  const t = text.trim();
  if (!t) return;
  const rt = route();
  S.chat.push({ from: 'me', text: t });
  S.chat.push(reply(t, me().id, rt.screen === 'project' ? rt.id : undefined));
  if (innerWidth < 900) S.sheet = true;
  log('ask', t);
  save(); render();
}

function toast(msg: string) {
  const d = document.createElement('div');
  d.className = 'toast'; d.setAttribute('role', 'status'); d.textContent = msg;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 2400);
}

/** Add a photo: the person's tags and a note. 3PT does not look inside the image. It learns from the tags and
 *  the note, then checks every photo so far for patterns (harness/apps/api/src/app.ts scan()). */
const TRADE_OPTS = ['plumbing', 'electrical', 'framing', 'drywall', 'finishes', 'exterior', 'concrete', 'hvac'];
async function thumb(file: File): Promise<string | null> {
  try {
    const bmp = await createImageBitmap(file), k = Math.min(1, 360 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const url = c.toDataURL('image/jpeg', 0.6); return url.length < 190_000 ? url : null;
  } catch { return null; }
}
function openUpload(pid: string) {
  const p = project(pid); if (!p) return;
  const m = document.createElement('div');
  m.className = 'modal'; m.setAttribute('data-region', 'upload');
  m.innerHTML = `<form class="modal-box upload" role="dialog" aria-label="Add a photo">
    <label class="up-drop"><input type="file" name="file" accept="image/*" capture="environment" hidden><span class="up-prev">${icon('camera', 'ic lg')}<b>Choose or take a photo</b><small>Optional. 3PT learns from the tags and the note.</small></span></label>
    <div class="up-fields">
      <label>Unit<input name="unit" inputmode="numeric" placeholder="903"></label>
      <label>Trade<select name="trade">${TRADE_OPTS.map(t => `<option>${t}</option>`).join('')}</select></label>
      <label>Wall<select name="wall"><option value="">—</option><option value="open">open</option><option value="closed">closed</option></select></label>
      <label class="wide">What does it show?<textarea name="note" rows="2" placeholder="Hairline crack along the ceiling joint"></textarea></label>
    </div>
    <div class="row-btns"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn primary" type="submit">Add to ${esc(p.name)}</button></div></form>`;
  let file: string | null = null;
  const inp = m.querySelector<HTMLInputElement>('input[type=file]')!, prev = m.querySelector<HTMLElement>('.up-prev')!;
  inp.addEventListener('change', async () => { const f = inp.files?.[0]; if (!f) return; file = await thumb(f); if (file) prev.innerHTML = `<img class="art" src="${file}" alt="New photo">`; });
  m.addEventListener('click', e => { if (e.target === m || (e.target as HTMLElement).closest('[data-close]')) m.remove(); });
  m.querySelector('form')!.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement), btn = m.querySelector<HTMLButtonElement>('button[type=submit]')!;
    btn.disabled = true; btn.textContent = 'Adding…';
    try {
      const r = await api.upload({ role: S.role ?? 'super', project: pid, unit: fd.get('unit') ? Number(fd.get('unit')) : null, trade: String(fd.get('trade')), wall: (fd.get('wall') || null) as 'open' | 'closed' | null, note: String(fd.get('note') ?? ''), file });
      addPhoto(r.photo, pid); m.remove(); log('upload', r.photo.id);
      const flag = r.photo.hazard ? ` It may show a hazard (${r.photo.hazard}).` : r.photo.water ? ' It may show water.' : '';
      if (r.shipped) { toast(`3PT shipped version ${r.shipped.version}: ${r.shipped.changes[0]}`); HS = null; void news.refresh(true); void refreshHarness().then(render); }
      else toast(`Photo filed.${flag} 3PT checked ${r.scan.photos} photos for patterns.`);
      render();
    } catch { btn.disabled = false; btn.textContent = 'Try again'; toast('3PT is not reachable right now.'); }
  });
  document.body.appendChild(m);
  m.querySelector<HTMLTextAreaElement>('textarea')!.focus();
}

function openPhoto(id: string) {
  const p = photo(id);
  if (!p) return;
  const m = document.createElement('div');
  m.className = 'modal'; m.setAttribute('data-region', 'photo-viewer');
  m.innerHTML = `<div class="modal-box" role="dialog" aria-label="Photo">${photoArt(p, `Unit ${p.unit ?? 'site'} ${p.kind}`)}
    <div class="modal-meta"><b>${p.unit ? `Unit ${p.unit}` : 'Outside'} · ${p.kind}</b><small>Week ${p.week}${p.flag ? ` · may show ${p.flag === 'water' ? 'a water stain' : 'a hazard'}` : ''}</small></div>
    <div class="row-btns"><button class="btn ghost" data-close>Not helpful</button><button class="btn primary" data-close>Close</button></div></div>`;
  m.addEventListener('click', e => { if (e.target === m || (e.target as HTMLElement).closest('[data-close]')) { if ((e.target as HTMLElement).textContent === 'Not helpful') log('not-helpful', id); m.remove(); } });
  document.body.appendChild(m);
  log('photo', id);
}

app.addEventListener('click', e => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
  if (!el || el.tagName === 'FORM' || el.tagName === 'SELECT') return;
  const id = el.dataset.id ?? '';
  switch (el.dataset.act) {
    case 'pick-role': S.role = id as RoleId; log('setup', id); save(); if (location.hash === '#/') render(); else go('#/'); break;
    case 'ask': ask(el.dataset.prompt ?? ''); break;
    case 'new-chat': S.chat = []; save(); render(); break;
    case 'sheet': S.sheet = !S.sheet; render(); break;
    case 'more': S.expanded[id] = true; log('more', id); save(); render(); break;
    case 'photo': openPhoto(id); break;
    case 'insight': S.insights[id] = true; log('insight-yes', id); save(); render(); toast('Done. 3PT will remember this helped.'); break;
    case 'dismiss': S.dismissed[id] = true; log('insight-no', id); save(); render(); toast('Hidden. 3PT will show fewer like this.'); break;
    case 'saver-on': S.savers[id] = 'on'; log('saver-on', id); save(); render(); toast('Turned on. You can undo it any time.'); break;
    case 'saver-no': S.savers[id] = 'no'; log('saver-no', id); save(); render(); break;
    case 'add-photo': openUpload(id); break;
    case 'scan': void api.scan().then(r => { HS = null; toast(r.shipped ? `3PT shipped version ${r.shipped.version}: ${r.shipped.changes[0]}` : `Checked ${r.scan.photos} photos. Nothing new to change.`); if (r.shipped) { void news.refresh(true); void refreshHarness(); } render(); }).catch(() => toast('3PT is not reachable right now.')); break;
    case 'rollback': void api.rollback(+id).then(() => { toast(`Back to version ${id}.`); HS = null; void news.refresh(); render(); }).catch(() => toast('3PT is not reachable right now.')); break;
    case 'undo': S.undone[+id] = true; log('undo', id); save(); render(); toast('Undone. The assistant went back one step.'); break;
    case 'help': { const rt = route(); const t = TOURS.find(x => x.screen === rt.screen && x.flag === 'tour'); if (!t || !startTour(t.id)) toast('No tips for this screen yet.'); break; }
    case 'tour': startTour(id); break;
    case 'reset-tips': resetTours(); toast('Tips will show again.'); break;
    case 'reset-flags': resetFlags(); render(); break;
    case 'reset-all': localStorage.clear(); S = fresh(); resetFlags(); go('#/setup'); break;
  }
});
app.addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target as HTMLFormElement;
  ask((f.elements.namedItem('q') as HTMLTextAreaElement).value);
});
app.addEventListener('keydown', e => {
  const t = e.target as HTMLElement;
  if (t.tagName === 'TEXTAREA' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (t.closest('form') as HTMLFormElement).requestSubmit(); }
});
app.addEventListener('change', e => {
  const t = e.target as HTMLInputElement;
  if (t.dataset.act === 'role') { S.role = t.value as RoleId; S.chat = []; log('role', t.value); save(); render(); }
  if (t.dataset.flag) { setFlag(t.dataset.flag as Flag, t.checked); render(); }
});

let last = '';
window.addEventListener('hashchange', () => {
  if (tourActive()) endTour();
  const rt = route();
  if (rt.screen === 'project' && last !== location.hash) { S.visits++; save(); }
  last = location.hash;
  S.sheet = false;
  render();
  window.scrollTo(0, 0);
});

if (route().screen === 'project') { S.visits++; save(); }
last = location.hash;
render();
/* swap the sample data for the harness's own when the API answers; the first paint never waits for it */
if (on('live.api')) { void news.refresh(); setInterval(() => { if (!document.hidden) void news.refresh(); }, 30_000); }
/* a sample project opened before the live data came in has no live twin: open the live demo job instead */
if (on('live.api')) void loadLive().then(ok => {
  if (!ok) return;
  const rt = route();
  if (rt.screen === 'project' && !project(rt.id)) go(`#/p/${LIVE.demo}`); else render();
}).catch(() => undefined);
