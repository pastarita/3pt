import { h } from '../lib/dom.js';
/** Atom: one big number and what it counts. */
export function stat(value: string | number, label: string): HTMLDivElement {
  return h('div', { class: 'stat' }, h('b', { class: 'stat__n' }, String(value)), h('span', { class: 'stat__l' }, label));
}
