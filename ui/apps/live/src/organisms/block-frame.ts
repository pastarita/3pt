import { h, type Child } from '../lib/dom.js';
import { icon } from '../atoms/icon.js';
import { button } from '../atoms/button.js';
/** Organism: the frame every block sits in. The harness chose the block; the person can hide it. */
export function blockFrame(p: { id: string; title: string; iconName: string; onHide?: () => void; onUse: () => void; children: Child }): HTMLElement {
  const el = h('section', { class: 'block', 'data-block': p.id, 'aria-label': p.title },
    h('header', { class: 'block__head' }, h('span', { class: 'block__icon' }, icon(p.iconName)), h('h2', {}, p.title),
      p.onHide ? button({ label: '', iconName: 'x', variant: 'ghost', ariaLabel: `Hide ${p.title}`, onClick: p.onHide }) : null),
    h('div', { class: 'block__body' }, p.children));
  /* any click inside the body counts as using this block: the loop's main signal */
  el.querySelector('.block__body')!.addEventListener('click', () => p.onUse(), { capture: true });
  return el;
}
