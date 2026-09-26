import { h, svg } from '../lib/dom.js';
/** Organism: the general navigation bar. One row, above the top bar, on every screen of /app/:
 *  the 3PT mark, the app's own sections (Projects, Harness), then the other public surfaces of the
 *  demo site (landing, results, studio, code). Active state follows the hash route; `refresh()` re-reads it.
 *  The top bar below stays what it is: firm, breadcrumb, role, harness version. */
const MARK = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l8.5 15h-17Z"/><circle cx="12" cy="3.5" r="1.6" fill="currentColor"/><circle cx="20.5" cy="18.5" r="1.6" fill="currentColor"/><circle cx="3.5" cy="18.5" r="1.6" fill="currentColor"/></svg>';
type Item = { label: string; href: string; on: (hash: string) => boolean; ext?: boolean };
const APP: Item[] = [
  { label: 'Projects', href: '#/', on: hs => !/^#\/(harness)/.test(hs) },
  { label: 'Harness', href: '#/harness', on: hs => /^#\/harness/.test(hs) },
];
const SITE: Item[] = [
  { label: 'Landing', href: '/', on: () => false },
  { label: 'Results', href: '/results/', on: () => false },
  { label: 'Studio', href: '/studio/', on: () => false },
  { label: 'Code', href: 'https://github.com/pastarita/3pt', on: () => false, ext: true },
];
function link(it: Item, hash: string): HTMLElement {
  const active = it.on(hash);
  return h('a', { class: 'sitenav__a' + (active ? ' sitenav__a--on' : ''), href: it.href, 'aria-current': active ? 'page' : null, ...(it.ext ? { target: '_blank', rel: 'noopener' } : {}) }, it.label, it.ext ? h('span', { class: 'sitenav__ext', 'aria-hidden': 'true' }, '↗') : null);
}
export function siteNav(): { el: HTMLElement; refresh: () => void } {
  const app = h('div', { class: 'sitenav__grp', role: 'list' }), site = h('div', { class: 'sitenav__grp sitenav__grp--site', role: 'list' });
  const el = h('nav', { class: 'sitenav', 'aria-label': 'Site' },
    h('a', { class: 'sitenav__mark', href: '/', 'aria-label': '3PT home' }, svg(MARK), h('b', {}, '3PT')),
    app, h('span', { class: 'sitenav__sep', 'aria-hidden': 'true' }), site);
  function refresh() {
    const hs = location.hash || '#/';
    app.replaceChildren(...APP.map(i => link(i, hs)));
    site.replaceChildren(h('span', { class: 'sitenav__lbl' }, 'Demo site'), ...SITE.map(i => link(i, hs)));
  }
  refresh();
  return { el, refresh };
}
