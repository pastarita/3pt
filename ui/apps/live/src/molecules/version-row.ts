import { h } from '../lib/dom.js';
import { badge } from '../atoms/badge.js';
import { button } from '../atoms/button.js';
import { kindLabel } from '../organisms/bulb.js';
export interface VersionRowProps { v: number; when: string; by: string; changes: string[]; why: string; current: boolean; rolledBack: boolean; score: number | null; kind?: string; to?: string; onRollback?: () => void }
/** Molecule: one harness version. Every version is a snapshot; any older one can come back. */
export function versionRow(p: VersionRowProps): HTMLElement {
  return h('li', { class: `ver${p.current ? ' ver--cur' : ''}${p.rolledBack ? ' ver--rb' : ''}` },
    h('b', { class: 'ver__v' }, `v${p.v}`),
    h('div', { class: 'ver__body' }, p.kind ? h('em', { class: `kind kind--${p.kind}` }, kindLabel(p.kind, p.to)) : null, h('b', {}, p.changes[0] ?? ''), p.changes.slice(1).map(c => h('span', {}, c)), h('small', {}, `${p.when} · ${p.by} · why: ${p.why}`)),
    h('div', { class: 'ver__side' }, p.score != null ? h('span', { class: 'ver__score' }, `${p.score}% useful`) : null,
      p.current ? badge('current', 'good') : p.rolledBack ? badge('rolled back', 'flag') : p.onRollback ? button({ label: `Roll back to v${p.v}`, onClick: p.onRollback }) : null));
}
