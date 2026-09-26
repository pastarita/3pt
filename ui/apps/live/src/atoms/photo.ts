import { h, type Child } from '../lib/dom.js';
export interface PhotoProps { src: string | null; alt: string; ratio?: 'square' | 'wide' | 'tall' | 'hero' | 'fill'; overlay?: Child; onClick?: () => void; flag?: string | null }
/** Atom: a site photo. A real image when the API has one, an empty frame when not. Clickable only with onClick. */
export function photo(p: PhotoProps): HTMLElement {
  const img = p.src ? h('img', { src: p.src, alt: p.alt, loading: 'lazy', decoding: 'async' }) : h('span', { class: 'photo__empty' }, p.alt);
  const kids = [img, p.flag ? h('span', { class: 'photo__flag' }, p.flag) : null, p.overlay ? h('span', { class: 'photo__over' }, p.overlay) : null];
  return p.onClick
    ? h('button', { type: 'button', class: `photo photo--${p.ratio ?? 'square'}`, 'aria-label': p.alt, on: { click: () => p.onClick!() } }, kids)
    : h('div', { class: `photo photo--${p.ratio ?? 'square'}` }, kids);
}
