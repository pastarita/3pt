import { h } from '../lib/dom.js';
import { icon } from '../atoms/icon.js';
/** Molecule: what the harness changed, in plain words. Links to the full history. */
export function learnedStrip(p: { text: string; meta: string }): HTMLElement {
  return h('aside', { class: 'strip strip--learned' }, h('span', { class: 'strip__icon' }, icon('spark')),
    h('div', { class: 'strip__txt' }, h('span', { class: 'strip__lbl' }, 'What I learned'), h('b', {}, p.text), h('small', {}, p.meta)),
    h('a', { class: 'btn btn--default', href: '#/harness' }, 'All changes'));
}
