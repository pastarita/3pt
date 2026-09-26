import { h } from '../lib/dom.js';
import { photo } from '../atoms/photo.js';
import { icon } from '../atoms/icon.js';
import { button } from '../atoms/button.js';
export interface ActionCardProps { title: string; iconName: string; src: string | null; actionLabel: string; onAct: () => void; onOpen?: () => void }
/** Molecule: one thing that needs this person, as a photo with one button. */
export function actionCard(p: ActionCardProps): HTMLElement {
  return h('article', { class: 'acard' },
    photo({ src: p.src, alt: p.title, ratio: 'tall', onClick: p.onOpen, overlay: [h('span', { class: 'acard__icon' }, icon(p.iconName)), h('b', {}, p.title)] }),
    button({ label: p.actionLabel, variant: 'primary', full: true, onClick: p.onAct }));
}
