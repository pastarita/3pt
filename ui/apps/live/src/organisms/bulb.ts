import type { News } from '@3pt/inspector-client';
import { h } from '../lib/dom.js';
import { icon } from '../atoms/icon.js';
/** Organism: the bulb. A small glowing blob, top right, that lights up when the harness ships a new version.
 *  Nobody asks for these changes, so this is where people find out about them. "Seen" is the last version
 *  this browser opened; anything newer counts as new. `refresh(true)` also rings the blob once. */
export interface Bulb { el: HTMLElement; refresh(ping?: boolean): Promise<void> }
const KEY = '3pt_bulb_seen';
const load = () => { try { const v = localStorage.getItem(KEY); return v == null ? null : +v; } catch { return null; } };
const save = (v: number) => { try { localStorage.setItem(KEY, String(v)); } catch { /* private mode */ } };

export function bulb(fetchNews: (since: number) => Promise<News>): Bulb {
  const count = h('span', { class: 'bulb__n', 'aria-hidden': 'true' });
  const tip = h('span', { class: 'bulb__tip', 'aria-hidden': 'true' }, 'Nothing new');
  const btn = h('button', { class: 'bulb__blob', 'aria-expanded': 'false', 'aria-controls': 'bulb-panel', 'aria-label': 'What the harness improved' },
    h('span', { class: 'bulb__halo', 'aria-hidden': 'true' }), icon('bulb'), count);
  const list = h('ol', { class: 'bulb__list' });
  const panel = h('section', { class: 'bulb__panel', id: 'bulb-panel', hidden: true, 'aria-label': 'New from the harness' },
    h('b', { class: 'bulb__title' }, 'New from the harness'),
    h('p', { class: 'bulb__sub' }, 'The harness proposed these from how people use the app, then shipped them.'), list,
    h('a', { class: 'bulb__more', href: '#/harness' }, 'Every version →'));
  const el = h('div', { class: 'bulb bulb--quiet' }, tip, btn, panel);
  let news: News | null = null, top = 0, pinged = 0;

  function draw() {
    if (!news) return;
    let seen = load();
    if (seen == null) { seen = Math.max(0, news.current - 3); save(seen); }   /* first visit: the last three count as new */
    const newest = news.items[0]?.v ?? news.current;
    if (seen > newest) { seen = newest; save(seen); }                          /* after a reset or rollback, count from here */
    const fresh = news.items.filter(i => i.v > seen!).length;
    top = newest;
    count.textContent = fresh ? String(fresh) : '';
    tip.textContent = fresh ? `${fresh} new from the harness` : 'Nothing new';
    el.classList.toggle('bulb--quiet', !fresh);
    btn.setAttribute('aria-label', fresh ? `${fresh} new improvements from the harness` : 'What the harness improved');
    list.replaceChildren(...(news.items.length ? [] : [h('li', { class: 'bulb__item' }, h('span', {}, 'Nothing shipped yet. The harness learns from use.'))]), ...news.items.slice(0, 8).map((i, n) => h('li', { class: `bulb__item${i.v > seen! ? ' bulb__item--new' : ''}`, style: `--i:${n}` },
      h('small', {}, `v${i.v} · ${i.when}${i.v > seen! ? ' · new' : ''}`),
      h('b', {}, i.changes.join('. ')),
      h('span', {}, `Why: ${i.why}`))));
  }
  /* the rings run ~3 s; drop the class after so hover gets its wiggle back */
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
  document.addEventListener('click', e => { if (!panel.hidden && !el.contains(e.target as Node)) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { close(); btn.focus(); } });

  return {
    el,
    async refresh(ring = false) {
      try {
        const before = news?.items[0]?.v ?? null;
        news = await fetchNews(-1); draw();
        if (ring || (before != null && (news.items[0]?.v ?? 0) > before)) ping();   /* a version shipped since the last look */
      } catch {                                                                      /* API down: stay dim, never block the page */
        el.classList.add('bulb--quiet');
        if (!news) list.replaceChildren(h('li', { class: 'bulb__item' }, h('span', {}, 'The harness is not reachable right now.')));
      }
    },
  };
}
