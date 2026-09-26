import { h } from '../lib/dom.js';
import { badge } from '../atoms/badge.js';
import { photo } from '../atoms/photo.js';
export interface ProjectCardProps { id: string; name: string; status: 'live' | 'closed' | 'planned'; tag: string; line: string; src: string | null; small?: boolean }
/** Molecule: a project as a big photo card. The whole card is the link. */
export function projectCard(p: ProjectCardProps): HTMLAnchorElement {
  return h('a', { class: `pcard${p.small ? ' pcard--small' : ''}`, href: `#/p/${p.id}` },
    photo({ src: p.src, alt: `${p.name} site photo`, ratio: 'fill' }),
    h('span', { class: 'pcard__tag' }, badge(p.tag, p.status === 'live' ? 'live' : p.status === 'planned' ? 'muted' : 'closed')),
    h('span', { class: 'pcard__over' }, h('b', {}, p.name), h('span', {}, p.line)));
}
