/**
 * 3PT app: the role-based screen a non-technical person uses every day.
 *
 *   ┌───────────────────────────────┬──────────────┐
 *   │ main: projects, or one project │ side: assistant (ask box,
 *   │ with role-focused cards        │ quick actions, earlier chats)
 *   └───────────────────────────────┴──────────────┘
 *
 * Routes (hash): #/ home · #/p/<id> project · #/setup first run · #/flags feature flags.
 * Conventions the capture suite relies on (docs/13-ui-capture.md):
 *   data-region="<name>"  every part of the screen a tour, a test or an image crop can point at
 *   data-screen="<name>"  on <main>, the screen that is showing
 *   window.__app          read-only state for the capture suite
 */
import { appCssVars } from '@3pt/design-system';
import './styles.css';
import {
  LAYOUT, LESSONS, PHOTOS, PROJECT_QUICK, QUICK, ROLES, SESSIONS,
  WIDGETS, cardsFor, isWidget, photo, project, projectsFor, role, saversFor, unitStatus,
  type CardId, type Project, type RoleId, type Tone, type Widget, type WidgetId,
} from './data';
import { icon, photoArt } from './art';
import { flags, on, resetFlags, setFlag, DEFAULTS, type Flag } from './flags';
import { autostart, endTour, resetTours, startTour, tourActive, tourStep, TOURS } from './tour';
import { reply, type Msg } from './agent';

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

/** Event log for the Instrument stage: what people tap, per role. Stays local until the API takes it. */
function log(action: string, detail?: string) {
  try {
    const k = 'tpt_web_events';
    const a = JSON.parse(localStorage.getItem(k) || '[]');
    a.push({ t: Date.now(), role: S.role, action, detail });
    localStorage.setItem(k, JSON.stringify(a.slice(-500)));
  } catch { /* ignore */ }
}

/* ---------- routing ---------- */

type Route = { screen: 'home' } | { screen: 'project'; id: string } | { screen: 'setup' } | { screen: 'flags' };
function route(): Route {
  const h = location.hash.replace(/^#\/?/, '');
  if (h.startsWith('p/')) return { screen: 'project', id: h.slice(2) };
  if (h === 'flags') return { screen: 'flags' };
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
  if (p.status === 'done') return r === 'owner' ? 'See what it cost and what you got' : 'Lessons from this job help Tower B';
  if (p.status === 'planned') return p.next;
  const n = LAYOUT[r].filter(c => isWidget(c) && !S.insights[c] && !S.dismissed[c]).length;
  if (r === 'owner') return `${p.percent}% done · ${n} new from 3PT`;
  return n ? `${n} new ${n === 1 ? 'thing' : 'things'} from 3PT today` : 'You are up to date';
}

/* ---------- screens ---------- */

function setupScreen(): string {
  return `<section class="setup" data-region="setup">
    <div class="setup-mark">${icon('sparkle', 'ic lg')}</div>
    <h1>Welcome. What is your job?</h1>
    <p class="lead">Pick one. We will show you only what matters for it. You can change it later.</p>
    <div class="role-grid" data-region="role-picker">
      ${ROLES.map(r => `<button class="role-tile" data-act="pick-role" data-id="${r.id}">
        <span class="role-ic">${icon(r.icon, 'ic lg')}</span><b>${r.name}</b><small>${r.blurb}</small></button>`).join('')}
    </div>
  </section>`;
}

function homeScreen(): string {
  const r = me();
  const list = projectsFor(r.id);
  const live = list.filter(p => p.status !== 'done');
  const done = list.filter(p => p.status === 'done');
  const grid = (ps: Project[]) => ps.map(p => {
    const c = coverPhoto(p);
    return `<a class="pcard" href="#/p/${p.id}" data-region="project-${p.id}">
      <div class="pcard-photo">${photoArt(c, `${p.name} photo`)}${statusPill(p)}</div>
      <div class="pcard-body"><b>${p.name}</b><span class="meta">${p.kind} · ${p.when}</span>
      <span class="role-line">${esc(roleLine(p, r.id))}</span></div></a>`;
  }).join('');
  return `<header class="page-head">
      <div><p class="hello">Good morning, ${r.person}</p><h1>Your projects</h1></div>
    </header>
    <section data-region="projects">
      <div class="pgrid">${grid(live)}</div>
      ${done.length ? `<h2 class="section">Finished</h2><div class="pgrid small">${grid(done)}</div>` : ''}
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
  return `<nav class="crumbs"><a href="#/" class="back" data-region="back">${icon('back', 'ic sm')} Projects</a></nav>
    <header class="banner" data-region="banner">${photoArt(c, `${p.name} photo`)}
      <div class="banner-text">${statusPill(p)}<h1>${p.name}</h1><span>${p.kind} · ${p.where} · ${p.when}</span></div>
      <span class="who">${icon(r.icon, 'ic sm')} You are the ${r.name.toLowerCase()}</span></header>
    <div class="cards">${first.map((cid, i) => card(cid, p, i === first.findIndex(isWidget))).join('')}</div>
    ${rest > 0 ? `<button class="more" data-act="more" data-id="${p.id}" data-region="more">${icon('plus', 'ic sm')} Show ${rest} more</button>` : ''}`;
}

function flagsScreen(): string {
  const f = flags();
  return `<nav class="crumbs"><a href="#/" class="back">${icon('back', 'ic sm')} Projects</a></nav>
    <header class="page-head"><div><h1>Settings</h1><p class="lead">Turn parts of the app on or off. Presenter mode adds the "How it learns" tour.</p></div></header>
    <div class="flag-list" data-region="flags">${(Object.keys(DEFAULTS) as Flag[]).map(k => `<label class="flag-row"><span><b>${k}</b></span>
      <input type="checkbox" class="switch" data-flag="${k}" ${f[k] ? 'checked' : ''}></label>`).join('')}</div>
    <div class="row-btns"><button class="btn ghost" data-act="reset-tips">Show all tips again</button><button class="btn ghost" data-act="reset-flags">Reset settings</button><button class="btn ghost" data-act="reset-all">Start over</button></div>`;
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
  return `<div class="brand"><span class="logo">3</span><b>3PT</b></div>
    <div class="top-right">
      ${on('presenter') ? `<div class="tour-menu" data-region="tour-menu">${TOURS.filter(t => on(t.flag)).map(t => `<button class="chip small" data-act="tour" data-id="${t.id}">${icon('compass', 'ic sm')} ${t.name}</button>`).join('')}</div>` : ''}
      ${on('tour') && !on('presenter') ? `<button class="icon-btn" data-act="help" aria-label="Show tips" data-region="help">${icon('compass')}</button>` : ''}
      <label class="role-select" data-region="role">${icon(r.icon, 'ic sm')}
        <select data-act="role" aria-label="Your job">${ROLES.map(x => `<option value="${x.id}" ${x.id === r.id ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>
      <a class="avatar" href="#/flags" aria-label="Settings" data-region="settings">${r.person[0]}</a>
    </div>`;
}

/* ---------- render ---------- */

const app = document.getElementById('app')!;
function render() {
  const rt = route();
  if (rt.screen === 'setup') {
    app.className = 'shell setup-mode';
    app.innerHTML = `<main data-screen="setup">${setupScreen()}</main>`;
    return expose(rt);
  }
  app.className = 'shell' + (S.sheet ? ' sheet-open' : '');
  const main = rt.screen === 'project' ? projectScreen(rt.id) : rt.screen === 'flags' ? flagsScreen() : homeScreen();
  app.innerHTML = `<header class="topbar" data-region="topbar">${topbar()}</header>
    <main class="main" data-screen="${rt.screen}" data-region="main">${main}</main>
    <aside class="side" data-region="assistant" aria-label="Assistant">${sidebar(rt)}</aside>
    <button class="ask-fab" data-act="sheet" data-region="ask-fab" aria-label="Open assistant">${icon('sparkle', 'ic sm')} Ask</button>
    <div class="sheet-scrim" data-act="sheet"></div>`;
  const th = app.querySelector('.thread');
  if (th) th.scrollTop = th.scrollHeight;
  expose(rt);
  if (rt.screen === 'home' || rt.screen === 'project') autostart(rt.screen);
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
    case 'undo': S.undone[+id] = true; log('undo', id); save(); render(); toast('Undone. The assistant went back one step.'); break;
    case 'help': { const rt = route(); const t = TOURS.find(x => x.screen === rt.screen && x.flag === 'tour'); if (t) startTour(t.id); break; }
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
