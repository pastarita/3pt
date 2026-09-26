import { h } from '../lib/dom.js';
import { photo } from '../atoms/photo.js';
import { button } from '../atoms/button.js';
import { icon } from '../atoms/icon.js';
export interface SaverCardProps { title: string; kind: string; hours: number; on: boolean; src: string | null; onTurnOn: () => void }
/** Molecule: a time saver the harness found, with the hours it saves per job. */
export function saverCard(p: SaverCardProps): HTMLElement {
  return h('article', { class: `saver${p.on ? ' saver--on' : ''}` },
    photo({ src: p.src, alt: p.title, ratio: 'wide', overlay: h('span', { class: 'saver__h' }, h('b', {}, String(p.hours)), h('small', {}, 'h / job')) }),
    h('b', { class: 'saver__t' }, p.title), h('span', { class: 'saver__k' }, p.kind),
    p.on ? h('span', { class: 'saver__on' }, icon('check'), 'On') : button({ label: 'Turn on', variant: 'primary', full: true, onClick: p.onTurnOn }));
}
