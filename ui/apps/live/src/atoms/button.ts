import { h, type Child } from '../lib/dom.js';
import { icon } from './icon.js';
export interface ButtonProps { label: Child; onClick?: () => void; variant?: 'primary' | 'default' | 'ghost'; iconName?: string; full?: boolean; ariaLabel?: string; pressed?: boolean; disabled?: boolean }
/** Atom: the only button in the app. */
export function button(p: ButtonProps): HTMLButtonElement {
  return h('button', {
    type: 'button', class: `btn btn--${p.variant ?? 'default'}${p.full ? ' btn--full' : ''}`, 'aria-label': p.ariaLabel,
    'aria-pressed': p.pressed == null ? null : String(p.pressed), disabled: p.disabled, on: { click: () => p.onClick?.() },
  }, p.iconName ? icon(p.iconName) : null, p.label);
}
