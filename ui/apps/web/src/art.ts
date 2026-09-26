/**
 * Icons and photo art. Icons are one-stroke line glyphs so a card needs fewer words.
 * Photos are drawn SVG stand-ins for real site photos. They are content, not chrome, so their
 * colors are exempt from the token check (the capture suite skips anything inside [data-photo]).
 */
import type { Photo, PhotoKind } from './data';

const P: Record<string, string> = {
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/>',
  drop: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z"/>',
  alert: '<path d="M12 3 2 20h20Z"/><path d="M12 10v4M12 17v.5"/>',
  send: '<path d="M3 11 21 3l-6 18-3-8Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m4 18 5-5 4 4 3-3 4 4"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="m9 21 2.5-6.5L14 17v4M8 11l3-3.5 3 1.5 2.5 3M11 8l-1.5 6.5"/>',
  hardhat: '<path d="M3 17h18M5 17a7 7 0 0 1 14 0"/><path d="M10 10V6h4v4"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM8.5 12h7M8.5 16h5"/>',
  building: '<path d="M4 21V5l8-2v18M12 8h8v13"/><path d="M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2"/>',
  wrench: '<path d="M14.5 3.5a4.5 4.5 0 0 0-5.3 6L3.5 15.2a2 2 0 1 0 2.8 2.8L12 12.3a4.5 4.5 0 0 0 6-5.3l-2.8 2.8-2.6-.6-.6-2.6Z"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/><path d="m9 12 2 2 4-4"/>',
  check: '<path d="m5 12 4 4 10-10"/>',
  back: '<path d="M15 5 8 12l7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  up: '<path d="M12 19V6M6 11l6-6 6 6"/>',
  chat: '<path d="M4 5h16v11H9l-5 4Z"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 1 3.5 10.9V16h-7v-2.1A6 6 0 0 1 12 3Z"/>',
  undo: '<path d="M9 7 4 12l5 5"/><path d="M4 12h11a5 5 0 0 1 0 10h-2"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  pin: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/>',
};

export function icon(name: string, cls = 'ic'): string {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] ?? P.more}</svg>`;
}

/* ---------- photo art ---------- */

function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) % 1000) / 1000;
}

const studs = (r: () => number, color: string) => {
  let s = '';
  for (let x = 14 + r() * 10; x < 400; x += 46 + r() * 8) s += `<rect x="${x.toFixed(0)}" y="30" width="11" height="270" fill="${color}"/>`;
  return s + `<rect x="0" y="22" width="400" height="12" fill="${color}"/><rect x="0" y="286" width="400" height="14" fill="${color}"/>`;
};

const SCENES: Record<PhotoKind, (r: () => number, flag?: string) => string> = {
  framing: (r, flag) => `<rect width="400" height="300" fill="#d9c7a7"/><rect y="215" width="400" height="85" fill="#9b938a"/>${studs(r, '#c9a26b')}` +
    (flag === 'hazard' ? `<rect x="250" y="120" width="150" height="180" fill="#6f8fb3"/><path d="M250 210h150" stroke="#e5c23a" stroke-width="6" stroke-dasharray="14 10"/>` : ''),
  plumbing: (r) => `<rect width="400" height="300" fill="#d4c2a1"/>${studs(r, '#c29a62')}<path d="M${120 + r() * 60} 30v180h140" stroke="#c0503a" stroke-width="9" fill="none"/><path d="M${200 + r() * 40} 30v150h120" stroke="#3a78c0" stroke-width="9" fill="none"/><rect y="240" width="400" height="60" fill="#8e877f"/>`,
  electrical: (r) => `<rect width="400" height="300" fill="#dbc9a9"/>${studs(r, '#c7a068')}<path d="M0 ${110 + r() * 40} C120 80 220 160 400 ${90 + r() * 40}" stroke="#e3b52c" stroke-width="6" fill="none"/><rect x="${150 + r() * 80}" y="150" width="26" height="38" rx="3" fill="#5f6a74"/><rect y="245" width="400" height="55" fill="#8f8880"/>`,
  drywall: (r, flag) => `<rect width="400" height="300" fill="#e6e3dd"/><path d="M${130 + r() * 20} 0v250M${270 + r() * 20} 0v250" stroke="#cfcac1" stroke-width="3"/><rect y="250" width="400" height="50" fill="#a39b90"/>` +
    (flag === 'water' ? `<rect x="300" y="30" width="90" height="120" fill="#a9c6dc" stroke="#8a8a86" stroke-width="6"/><ellipse cx="310" cy="190" rx="44" ry="34" fill="#b99a6a" opacity=".55"/><ellipse cx="300" cy="200" rx="24" ry="18" fill="#9c7b4a" opacity=".5"/>` : ''),
  concrete: (r) => `<rect width="400" height="300" fill="#b9b6b0"/><path d="M0 170 400 150V300H0Z" fill="#8f8c86"/><rect x="${60 + r() * 40}" y="40" width="26" height="130" fill="#a6a39d"/><rect x="${260 + r() * 40}" y="40" width="26" height="115" fill="#a6a39d"/><rect width="400" height="40" fill="#9c9993"/>`,
  exterior: (r) => {
    let w = '';
    for (let y = 70; y < 250; y += 36) for (let x = 110; x < 290; x += 34) w += `<rect x="${x}" y="${y}" width="20" height="22" fill="${r() > .3 ? '#7fa6c9' : '#e8e4da'}"/>`;
    return `<rect width="400" height="300" fill="#bcd7ee"/><rect x="95" y="50" width="200" height="250" fill="#8e8a84"/>${w}<rect x="300" y="20" width="8" height="200" fill="#e0b43a"/><rect x="250" y="20" width="110" height="8" fill="#e0b43a"/><rect y="270" width="400" height="30" fill="#7b766f"/>`;
  },
  finished: (r) => `<rect width="400" height="300" fill="#efe9df"/><rect y="215" width="400" height="85" fill="#b58b5c"/><rect x="${230 + r() * 40}" y="50" width="110" height="130" fill="#cfe2f1" stroke="#fff" stroke-width="8"/><rect x="40" y="150" width="130" height="70" rx="10" fill="#6d8c7a"/><circle cx="90" cy="80" r="22" fill="#f3d9a4"/>`,
};

/**
 * Real site photos in public/photos, copied from hub/site/photos (Wikimedia Commons, public domain,
 * CC0 or CC BY; credits.json keeps every credit). A photo id always maps to the same file.
 */
const FILES: Record<string, string[]> = {
  framing: ['framing-1', 'framing-2', 'framing-3', 'framing-4', 'framing-5'],
  plumbing: ['plumbing-1', 'plumbing-2', 'plumbing-3', 'plumbing-4'],
  electrical: ['electrical-1', 'electrical-2', 'electrical-3'],
  drywall: ['drywall-1', 'drywall-2', 'drywall-3'],
  exterior: ['exterior-1', 'exterior-2', 'exterior-3', 'exterior-4', 'exterior-5', 'exterior-6'],
  concrete: ['exterior-3', 'exterior-5'],
  finished: ['finished-1', 'finished-2', 'finished-3', 'finished-4'],
  water: ['water-1'],
  hazard: ['safety-1'],
};
const PHOTO_BASE = `${import.meta.env.BASE_URL}photos/`;

/** A site photo. `label` is the plain caption a screen reader hears. Falls back to drawn art. */
export function photoArt(p: Pick<Photo, 'id' | 'kind' | 'flag'>, label: string): string {
  const list = FILES[p.flag ?? p.kind] ?? FILES[p.kind];
  if (list?.length) {
    const f = list[Math.floor(rng(p.id)() * list.length)];
    return `<img class="art" src="${PHOTO_BASE}${f}.jpg" alt="${label}" loading="lazy" decoding="async" data-photo="${p.id}">`;
  }
  return drawn(p, label);
}

/** Drawn stand-in, for a kind with no real photo yet. */
export function drawn(p: Pick<Photo, 'id' | 'kind' | 'flag'>, label: string): string {
  const r = rng(p.id);
  return `<svg class="art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}" data-photo="${p.id}">${SCENES[p.kind](r, p.flag)}</svg>`;
}
