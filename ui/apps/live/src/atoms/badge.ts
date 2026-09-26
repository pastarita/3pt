import { h } from '../lib/dom.js';
/** Atom: a small status label. Tone carries meaning; the text always says it too. */
export function badge(text: string, tone: 'live' | 'closed' | 'good' | 'flag' | 'muted' = 'muted'): HTMLSpanElement {
  return h('span', { class: `badge badge--${tone}` }, text);
}
