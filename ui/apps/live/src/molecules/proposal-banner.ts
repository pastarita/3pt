import { h } from '../lib/dom.js';
import { icon } from '../atoms/icon.js';
import { button } from '../atoms/button.js';
/** Molecule: the harness asks before it changes itself. Yes saves a new version; No is remembered. */
export function proposalBanner(p: { text: string; why: string; onYes: () => void; onNo: () => void }): HTMLElement {
  return h('aside', { class: 'strip strip--prop', role: 'status' }, h('span', { class: 'strip__icon' }, icon('bulb')),
    h('div', { class: 'strip__txt' }, h('span', { class: 'strip__lbl' }, 'Suggestion'), h('b', {}, p.text), h('small', {}, `Why: ${p.why} Yes saves a new harness version. You can roll it back.`)),
    h('div', { class: 'strip__acts' }, button({ label: 'Yes, do it', variant: 'primary', onClick: p.onYes }), button({ label: 'No', onClick: p.onNo })));
}
