import { h } from '../lib/dom.js';
import { photo } from '../atoms/photo.js';
/** Molecule: a question you can ask your photos, shown as a photo. */
export function queryCard(p: { label: string; src: string | null; active: boolean; onClick: () => void }): HTMLElement {
  return h('div', { class: `query${p.active ? ' query--on' : ''}` }, photo({ src: p.src, alt: p.label, ratio: 'wide', onClick: p.onClick, overlay: h('b', {}, p.label) }));
}
