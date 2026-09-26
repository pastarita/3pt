import { h } from '../lib/dom.js';
import { roleSelect } from '../molecules/role-select.js';
/** Organism: firm name, where you are, who you are, and the harness version on duty. */
export function topBar(p: { crumbs: { label: string; href?: string }[]; roles: readonly { id: string; name: string }[]; role: string; onRole: (r: string) => void; version: number | null }): HTMLElement {
  return h('header', { class: 'topbar' },
    h('a', { class: 'topbar__firm', href: '#/' }, 'Acme Builders'),
    h('nav', { class: 'topbar__crumbs', 'aria-label': 'Breadcrumb' }, p.crumbs.map((c, i) => [i ? h('span', { 'aria-hidden': 'true' }, '›') : null, c.href ? h('a', { href: c.href }, c.label) : h('b', {}, c.label)])),
    h('span', { class: 'topbar__sp' }),
    roleSelect({ roles: p.roles, value: p.role, onChange: p.onRole }),
    p.version != null ? h('a', { class: 'topbar__hv', href: '#/harness' }, `Harness v${p.version}`) : null);
}
