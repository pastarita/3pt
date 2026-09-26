import type { Photo } from '@3pt/inspector-client';
import { h } from '../lib/dom.js';
import { button } from '../atoms/button.js';
/** Organism: one photo, big, with what the harness read from it. Esc or Close ends it. */
export function photoViewer(p: { photo: Photo; src: string | null; onClose: () => void; onChecked?: () => void }): HTMLElement {
  const rows: [string, string][] = [['photo', p.photo.id], ['unit', String(p.photo.unit ?? 'site')], ['trade', p.photo.trade]];
  if (p.photo.wall) rows.push(['wall', p.photo.wall]);
  if (p.photo.water) rows.push(['flag', 'possible water stain']);
  if (p.photo.hazard) rows.push(['flag', p.photo.hazard]);
  const close = () => { document.removeEventListener('keydown', onKey); p.onClose(); };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  const dlg = h('div', { class: 'viewer', role: 'dialog', 'aria-modal': 'true', 'aria-label': `Photo ${p.photo.id}`, on: { click: (e: MouseEvent) => { if (e.target === dlg) close(); } } },
    h('div', { class: 'viewer__box' },
      p.src ? h('img', { src: p.src, alt: `${p.photo.trade} photo` }) : null,
      h('dl', {}, rows.map(([k, v]) => [h('dt', {}, k), h('dd', {}, v)])),
      h('div', { class: 'bar' }, p.onChecked ? button({ label: 'Mark as checked', variant: 'primary', onClick: () => { p.onChecked!(); close(); } }) : null, button({ label: 'Close', onClick: close }))));
  queueMicrotask(() => (dlg.querySelector('button') as HTMLButtonElement | null)?.focus());
  return dlg;
}
