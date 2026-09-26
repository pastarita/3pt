import { svg } from '../lib/dom.js';
const PATHS: Record<string, string> = {
  cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/>',
  drop: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z"/>',
  warn: '<path d="M12 3 2 20h20Z"/><path d="M12 10v4M12 17v.5"/>',
  send: '<path d="M3 11 21 3l-6 18-3-8Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 1 3.5 10.9V16h-7v-2.1A6 6 0 0 1 12 3Z"/>',
  check: '<path d="m5 12 4 4 10-10"/>',
  stack: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  up: '<path d="M7 11v9H4v-9Z"/><path d="M7 11l4-7c1.5 0 2.5 1 2.3 2.5L13 10h6a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 17.8 20H7"/>',
  down: '<path d="M7 13V4H4v9Z"/><path d="M7 13l4 7c1.5 0 2.5-1 2.3-2.5L13 14h6a2 2 0 0 0 2-2.3l-1.2-6A2 2 0 0 0 17.8 4H7"/>',
};
/** Atom: a line icon. Decorative unless a label is given. */
export function icon(name: string, label?: string): SVGElement {
  const el = svg(`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${PATHS[name] ?? ''}</svg>`);
  if (label) { el.setAttribute('role', 'img'); el.setAttribute('aria-label', label); } else el.setAttribute('aria-hidden', 'true');
  return el;
}
