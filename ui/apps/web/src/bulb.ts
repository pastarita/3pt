/**
 * The bulb: a small glowing blob in the top bar that lights up when the harness ships a new version.
 * Nobody asks for these changes, so this is where people find out about them. "Seen" is the last
 * version this browser opened; anything newer counts as new. `refresh(true)` also rings it once.
 * Ported from the first live app (ui/apps/live/src/organisms/bulb.ts) into this app's tokens.
 * The element is built once and survives every render: main.ts puts it back into `[data-slot="bulb"]`.
 */
import type { News } from '@3pt/inspector-client';
import { icon } from './art';

/** Who acts on a change: a person the app asks, or the app itself. */
export function kindLabel(kind: string, to?: string): string {
  return kind === 'suggest' ? `Suggestion${to ? ' to ' + to : ''}` : kind === 'automate' ? 'Automation in the app' : 'Improvement in the app';
}
export interface Bulb { el: HTMLElement; refresh(ring?: boolean): Promise<void> }

const KEY = 'tpt_web_bulb_seen';
const load = () => { try { const v = localStorage.getItem(KEY); return v == null ? null : +v; } catch { return null; } };
const save = (v: number) => { try { localStorage.setItem(KEY, String(v)); } catch { /* private mode */ } };
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export function bulb(fetchNews: () => Promise<News>): Bulb {
  const el = document.createElement('div');
  el.className = 'bulb bulb--quiet';
  el.dataset.region = 'bulb';
  el.innerHTML = `<button class="bulb-blob" type="button" aria-expanded="false" aria-controls="bulb-panel" aria-label="What 3PT improved">
      <span class="bulb-halo" aria-hidden="true"></span>${icon('bulb')}<span class="bulb-n" aria-hidden="true"></span></button>
    <section class="bulb-panel" id="bulb-panel" hidden aria-label="New from 3PT">
      <b class="bulb-title">New from 3PT</b>
      <p class="bulb-sub">3PT found, tested and shipped these itself. Nobody asked for them.</p>
      <ol class="bulb-list"></ol>
      <a class="bulb-more" href="#/harness">Every version →</a></section>`;
  const btn = el.querySelector<HTMLButtonElement>('.bulb-blob')!;
  const count = el.querySelector<HTMLElement>('.bulb-n')!;
  const panel = el.querySelector<HTMLElement>('.bulb-panel')!;
  const list = el.querySelector<HTMLElement>('.bulb-list')!;
  let news: News | null = null, top = 0, pinged = 0;

  function draw() {
    if (!news) return;
    let seen = load();
    if (seen == null) { seen = Math.max(0, news.current - 3); save(seen); }   /* first visit: the last three count as new */
    const newest = news.items[0]?.v ?? news.current;
    if (seen > newest) { seen = newest; save(seen); }                          /* after a reset or rollback, count from here */
    const s = seen, fresh = news.items.filter(i => i.v > s).length;
    top = newest;
    count.textContent = fresh ? String(fresh) : '';
    el.classList.toggle('bulb--quiet', !fresh);
    btn.setAttribute('aria-label', fresh ? `${fresh} new improvements from 3PT` : 'What 3PT improved');
    btn.title = fresh ? `${fresh} new from 3PT` : 'Nothing new';
    list.innerHTML = news.items.length
      ? news.items.slice(0, 8).map((i, n) => `<li class="bulb-item${i.v > s ? ' is-new' : ''}" style="--i:${n}">
          <small>v${i.v} · ${esc(i.when)}${i.v > s ? ' · new' : ''}</small>
          ${i.kind ? `<span class="kind ${i.kind}">${esc(kindLabel(i.kind, i.to))}</span>` : ''}
          <b>${esc(i.changes.join('. '))}</b><span>Why: ${esc(i.why)}</span></li>`).join('')
      : '<li class="bulb-item"><span>Nothing shipped yet. 3PT learns from use.</span></li>';
  }
  /* the rings run about 3 s; drop the class after so hover gets its wiggle back */
  function ping() {
    el.classList.remove('bulb--ping'); void el.offsetWidth; el.classList.add('bulb--ping');
    clearTimeout(pinged); pinged = window.setTimeout(() => el.classList.remove('bulb--ping'), 3200);
  }
  function close() { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); el.classList.remove('bulb--open'); }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    if (!panel.hidden) return close();
    panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); el.classList.add('bulb--open');
    save(top); el.classList.add('bulb--quiet'); count.textContent = '';   /* opened = seen; the list keeps its "new" marks until next draw */
  });
  panel.addEventListener('click', e => { if ((e.target as HTMLElement).closest('.bulb-more')) close(); });
  document.addEventListener('click', e => { if (!panel.hidden && !el.contains(e.target as Node)) close(); });
  window.addEventListener('hashchange', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { close(); btn.focus(); } });

  return {
    el,
    async refresh(ring = false) {
      try {
        const before = news?.items[0]?.v ?? null;
        news = await fetchNews(); draw();
        if (ring || (before != null && (news.items[0]?.v ?? 0) > before)) ping();   /* a version shipped since the last look */
      } catch {                                                                     /* API down: stay dim, never block the page */
        el.classList.add('bulb--quiet');
        if (!news) list.innerHTML = '<li class="bulb-item"><span>3PT is not reachable right now.</span></li>';
      }
    },
  };
}
