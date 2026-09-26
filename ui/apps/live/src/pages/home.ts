import type { FirmState, InspectorClient } from '@3pt/inspector-client';
import { h } from '../lib/dom.js';
import { projectCard } from '../molecules/project-card.js';
/** Page: every project as a photo card. Live jobs first, then the next one, then the past. */
export function homePage(f: FirmState, api: InspectorClient): HTMLElement {
  const live = f.projects.filter(p => p.status === 'live'), next = f.projects.filter(p => p.status === 'planned').slice(0, 1), past = f.projects.filter(p => p.status === 'closed').reverse();
  const card = (p: FirmState['projects'][number], small = false) => projectCard({
    id: p.id, name: p.name, status: p.status, small, src: api.media(p.cover?.file),
    tag: p.status === 'live' ? (p.phase ?? 'live') : p.status === 'planned' ? `starts ${p.start}` : p.end.slice(0, 4),
    line: p.status === 'closed' ? `${p.retro?.lessons.length ?? 0} lesson${(p.retro?.lessons.length ?? 0) === 1 ? '' : 's'} · ${p.photos.toLocaleString()} photos` : p.status === 'planned' ? 'Starts with every lesson so far' : `${p.photos.toLocaleString()} photos · ${p.neighborhood}`,
  });
  return h('div', { class: 'page' },
    h('h1', {}, 'Live now ', h('small', {}, `${live.length} of ${f.max_live} slots`)),
    h('div', { class: 'cards' }, live.map(p => card(p)), next.map(p => card(p))),
    h('h2', { class: 'sec' }, 'Past projects ', h('small', {}, `${past.length} closed · each one left lessons for the next`)),
    h('div', { class: 'cards cards--small' }, past.map(p => card(p, true))));
}
