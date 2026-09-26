import type { InspectorClient, Screen } from '@3pt/inspector-client';
import { h } from '../lib/dom.js';
import { photo } from '../atoms/photo.js';
import { badge } from '../atoms/badge.js';
import { button } from '../atoms/button.js';
import { blockFrame } from '../organisms/block-frame.js';
import { renderBlock, BLOCK_ICON, type BlockCtx } from '../organisms/blocks.js';
import { ROLES } from '../lib/state.js';
/** Page: one project, as the harness composed it for this role. The page renders; the harness decides. */
export function projectPage(s: Screen, api: InspectorClient, ctx: BlockCtx, on: { hide(b: string): void; use(b: string): void; add(b: string): void }): HTMLElement {
  const p = s.project;
  return h('div', { class: 'page' },
    h('div', { class: 'banner' }, photo({ src: api.media(p.cover), alt: `${p.name} site`, ratio: 'fill' }),
      h('span', { class: 'banner__over' }, h('b', {}, p.name), h('span', {}, p.status === 'live' ? `Week ${p.week} · ${p.phase}` : p.status === 'closed' ? 'Closed' : 'Planned')),
      h('span', { class: 'banner__role' }, badge(ROLES.find(r => r.id === s.role)?.name ?? s.role, 'muted'))),
    h('div', { class: 'blocks' }, s.layout.map(id => blockFrame({ id, title: s.blocks[id].title, iconName: BLOCK_ICON[id] ?? 'stack', onHide: () => on.hide(id), onUse: () => on.use(id), children: renderBlock(id, s.blocks[id], ctx) }))),
    s.more.length ? h('div', { class: 'tray' }, h('span', { class: 'tray__lbl' }, 'Add to my screen'), s.more.map(m => button({ label: m.title, onClick: () => on.add(m.id) }))) : null);
}
