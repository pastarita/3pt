import { h } from '../lib/dom.js';
/** Molecule: who you are on the project. Changing it changes the whole screen. */
export function roleSelect(p: { roles: readonly { id: string; name: string }[]; value: string; onChange: (id: string) => void }): HTMLElement {
  const sel = h('select', { id: 'role', on: { change: () => p.onChange(sel.value) } }, p.roles.map(r => h('option', { value: r.id, selected: r.id === p.value }, r.name)));
  return h('label', { class: 'rolesel', for: 'role' }, h('span', {}, 'You are'), sel);
}
