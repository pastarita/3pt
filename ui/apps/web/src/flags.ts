/**
 * Feature flags. Three layers, last one wins:
 *   1. DEFAULTS below (what a new user gets)
 *   2. saved choices in localStorage `tpt_web_flags` (set on the #/flags screen)
 *   3. the URL: `?ff=presenter,-tour.autostart` turns `presenter` on and `tour.autostart` off
 *      for this page load only. The capture suite uses this layer, so captures stay repeatable.
 */
export const DEFAULTS = {
  setup: true,             // first-run "what is your job?" screen
  tour: true,              // the tips system at all
  'tour.autostart': true,  // start a tour the first time a screen opens
  presenter: false,        // demo mode: the "How it learns" tour and the tour menu
  'agent.history': true,   // earlier chats in the sidebar
  'cards.savers': true,    // time-saver suggestions on a project
  'cards.learned': true,   // "what your assistant learned" (the harness, explained)
} as const;

export type Flag = keyof typeof DEFAULTS;
const KEY = 'tpt_web_flags';

function saved(): Partial<Record<Flag, boolean>> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}
function fromUrl(): Partial<Record<Flag, boolean>> {
  const out: Partial<Record<Flag, boolean>> = {};
  const raw = new URLSearchParams(location.search).get('ff');
  for (const t of (raw ?? '').split(',').map(s => s.trim()).filter(Boolean)) {
    const off = t.startsWith('-');
    const name = (off ? t.slice(1) : t) as Flag;
    if (name in DEFAULTS) out[name] = !off;
  }
  return out;
}

let cache: Record<Flag, boolean> | null = null;
export function flags(): Record<Flag, boolean> {
  return (cache ??= { ...DEFAULTS, ...saved(), ...fromUrl() });
}
export const on = (f: Flag) => flags()[f];
export function setFlag(f: Flag, v: boolean) {
  const s = saved(); s[f] = v;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode: keep in memory */ }
  cache = null;
}
export function resetFlags() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  cache = null;
}
