import { h } from '../lib/dom.js';
import { photo } from '../atoms/photo.js';
import { button } from '../atoms/button.js';
/** Molecule: a search result with yes and no. Each tap is a signal the harness learns from. */
export function feedbackPhoto(p: { src: string | null; alt: string; value: 'up' | 'down' | null; onOpen: () => void; onUp: () => void; onDown: () => void }): HTMLElement {
  return h('div', { class: 'fbphoto' }, photo({ src: p.src, alt: p.alt, onClick: p.onOpen }),
    h('div', { class: 'fbphoto__bar' },
      button({ label: '', iconName: 'up', ariaLabel: 'Useful', pressed: p.value === 'up', onClick: p.onUp }),
      button({ label: '', iconName: 'down', ariaLabel: 'Not useful', pressed: p.value === 'down', onClick: p.onDown })));
}
