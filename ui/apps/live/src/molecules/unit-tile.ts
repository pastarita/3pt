import { h } from '../lib/dom.js';
import { photo } from '../atoms/photo.js';
import { icon } from '../atoms/icon.js';
export interface UnitTileProps { unit: number; state: 'missing' | 'complete' | 'open'; src: string | null; onClick: () => void }
const TEXT = { missing: 'open-wall photo missing', complete: 'closed, photos complete', open: 'walls open' } as const;
/** Molecule: one unit on the level in work. The ring and the icon both say its state. */
export function unitTile(p: UnitTileProps): HTMLElement {
  return h('div', { class: `unit unit--${p.state}` },
    photo({ src: p.src, alt: `Unit ${p.unit}: ${TEXT[p.state]}`, ratio: 'wide', onClick: p.onClick,
      overlay: [h('b', { class: 'unit__n' }, String(p.unit)), p.state === 'open' ? null : h('span', { class: 'unit__st' }, icon(p.state === 'missing' ? 'cam' : 'check'))] }));
}
