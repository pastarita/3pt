/** 3PT web: the app a construction team uses. Every screen comes from the harness over HTTP (@3pt/api);
 *  this file only routes, renders, and reports what people do. Atomic layout: atoms → molecules → organisms → pages. */
import { cssVars } from '@3pt/design-system';
import { createClient, type Photo, type Screen } from '@3pt/inspector-client';
import { h } from './lib/dom.js';
import { ROLES, route, getRole, setRole } from './lib/state.js';
import { topBar } from './organisms/top-bar.js';
import { photoViewer } from './organisms/photo-viewer.js';
import { learnedStrip } from './molecules/learned-strip.js';
import { proposalBanner } from './molecules/proposal-banner.js';
import { homePage } from './pages/home.js';
import { projectPage } from './pages/project.js';
import { harnessPage } from './pages/harness.js';
import type { BlockCtx } from './organisms/blocks.js';
import './styles.css';

const tokens = document.createElement('style'); tokens.textContent = cssVars(); document.head.prepend(tokens);
const api = createClient(import.meta.env.VITE_THREEPT_API_URL ?? 'http://127.0.0.1:8787');
const root = document.getElementById('app')!;
const modal = h('div', { id: 'modal' }); document.body.append(modal);

let role = getRole(), version: number | null = null, lastScreen: Screen | null = null;
const ask: BlockCtx['ask'] = { q: null, note: '', photos: [], fb: {} };
const TITLES: Record<string, string> = { needs: 'Needs you', beforeclose: 'Units closing', photos_week: 'This week', ask: 'Ask your photos', timesavers: 'Time savers', progress: 'Progress', portfolio: 'All projects', closeout: 'Closeout', hazards: 'Hazards', retro: 'Looking back', playbook: 'Carried to the next job', lessons: 'Started with' };

function toast(msg: string) { const t = h('div', { class: 'toast', role: 'status' }, msg); document.body.append(t); setTimeout(() => t.remove(), 2600); }
function fail(e: unknown) {
  root.replaceChildren(h('div', { class: 'page' }, h('h1', {}, 'The harness is not reachable'),
    h('p', {}, String((e as Error).message ?? e)), h('pre', {}, 'pnpm --filter @3pt/api... build\nnode harness/apps/api/dist/index.js')));
}
function openPhoto(p: Photo) {
  const checkable = (p.water || p.hazard) ? () => { void act(`look:${p.id}`); } : undefined;
  modal.replaceChildren(photoViewer({ photo: p, src: api.media(p.file), onClose: () => modal.replaceChildren(), onChecked: checkable }));
}
async function act(doStr: string) {
  const project = lastScreen?.project.id;
  await api.event({ role, action: 'act', do: doStr, project });
  const [k, arg] = doStr.split(':');
  toast(k === 'take' ? `Photo filed: unit ${arg} · plumbing · open wall` : k === 'send' ? 'Owner pack sent' : k === 'opp' ? 'Turned on' : 'Marked as checked');
  await render();
}

function shell(crumbs: { label: string; href?: string }[], body: HTMLElement, strips: HTMLElement[] = []) {
  root.replaceChildren(topBar({ crumbs, roles: ROLES, role, onRole: r => { role = r; setRole(r); ask.q = null; void render(); }, version }), ...strips, body);
}

async function render() {
  const r = route();
  try {
    if (r.page === 'home') {
      const f = await api.simState();
      version = f.harness.version;
      shell([{ label: 'Projects' }], homePage(f, api));
    } else if (r.page === 'project') {
      const s = lastScreen = await api.screen(r.id, role);
      version = s.harness.version; Object.entries(s.blocks).forEach(([k, b]) => { TITLES[k] = b.title; });
      if (ask.q) { const a = await api.ask(r.id, ask.q); ask.note = a.note; ask.photos = a.photos; }
      const ctx: BlockCtx = {
        media: api.media, act: d => void act(d), openPhoto, ask,
        onAsk: async q => { ask.q = q; ask.fb = {}; await render(); },
        onFeedback: async (q, id, v) => { ask.fb[id] = v; await api.event({ role, action: v === 'up' ? 'fb_up' : 'fb_down', block: 'ask', q, photo: id, project: r.id }); await render(); },
      };
      const strips = [s.proposal
        ? proposalBanner({ text: s.proposal.text, why: s.proposal.why, onYes: async () => { const n = await api.approve(s.proposal!.key, role); toast(`Saved harness v${n.version}`); await render(); }, onNo: async () => { await api.reject(s.proposal!.key); await render(); } })
        : learnedStrip({ text: s.harness.learned, meta: `Harness v${s.harness.version} · ${s.harness.when}` })];
      shell([{ label: 'Projects', href: '#/' }, { label: s.project.name }], projectPage(s, api, ctx, {
        use: b => { void api.event({ role, action: 'use', block: b, project: r.id }).then(x => { if (x.proposal && !lastScreen?.proposal) void render(); }); },
        hide: async b => { await api.event({ role, action: 'hide', block: b, project: r.id }); await render(); },
        add: async b => { await api.event({ role, action: 'use', block: b, project: r.id }); await api.event({ role, action: 'use', block: b, project: r.id }); await render(); },
      }), strips);
    } else {
      const s = await api.harness();
      version = s.current;
      shell([{ label: 'Projects', href: '#/' }, { label: 'Harness' }], harnessPage(s, async v => { await api.rollback(v); toast(`Rolled back to v${v}`); await render(); }, TITLES));
    }
  } catch (e) { fail(e); }
}
window.addEventListener('hashchange', () => { ask.q = null; void render(); });
void render();
