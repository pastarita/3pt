import type { HarnessState } from '@3pt/inspector-client';
import { h } from '../lib/dom.js';
import { versionRow } from '../molecules/version-row.js';
import { ROLES } from '../lib/state.js';
/** Page: the harness itself. Three points, every version, the screen it serves each role, and rollback. */
export function harnessPage(s: HarnessState, onRollback: (v: number) => void, titles: Record<string, string>): HTMLElement {
  const cur = s.versions.find(v => v.v === s.current)!;
  return h('div', { class: 'page' },
    h('h1', {}, 'The harness ', h('small', {}, `v${s.current} on duty · ${s.events} signals this session`)),
    h('div', { class: 'loop' },
      h('div', { class: 'loop__pt loop__pt--plan' }, h('b', {}, 'Plan'), h('span', {}, 'Reads taps, hides and failed searches. Proposes one change.')),
      h('div', { class: 'loop__pt loop__pt--build' }, h('b', {}, 'Build'), h('span', {}, cur.changes[0] ?? '')),
      h('div', { class: 'loop__pt loop__pt--instrument' }, h('b', {}, 'Instrument'), h('span', {}, cur.score != null ? `${cur.score}% of actions useful in this version` : 'Scores each version on useful actions. A drop means roll back.'))),
    h('h2', { class: 'sec' }, 'Screens by role'),
    h('div', { class: 'layouts' }, ROLES.map(r => h('div', { class: 'layout' }, h('b', {}, r.name),
      s.layouts[r.id] ? h('ol', {}, s.layouts[r.id].map(b => h('li', {}, titles[b] ?? b))) : h('span', { class: 'hint' }, 'basic screen · still learning')))),
    h('h2', { class: 'sec' }, 'What it reads from each photo'),
    h('div', { class: 'chips' }, s.fields.map(f => h('span', { class: 'chip' }, f))),
    h('h2', { class: 'sec' }, 'Versions ', h('small', {}, 'newest first · snapshots, never edited')),
    h('ol', { class: 'vers' }, s.versions.map(v => versionRow({ v: v.v, when: v.when, by: v.by, changes: v.changes, why: v.why, current: v.v === s.current, rolledBack: !!v.rolledBack, score: v.score, onRollback: () => onRollback(v.v) }))));
}
