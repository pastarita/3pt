import type { Photo } from '@3pt/inspector-client';
import { h } from '../lib/dom.js';
import { photo } from '../atoms/photo.js';
import { stat } from '../atoms/stat.js';
import { button } from '../atoms/button.js';
import { icon } from '../atoms/icon.js';
import { actionCard } from '../molecules/action-card.js';
import { unitTile } from '../molecules/unit-tile.js';
import { saverCard } from '../molecules/saver-card.js';
import { queryCard } from '../molecules/query-card.js';
import { feedbackPhoto } from '../molecules/feedback-photo.js';

export interface BlockCtx {
  media(p: string | null | undefined): string | null;
  act(doStr: string): void;
  openPhoto(p: Photo): void;
  ask: { q: string | null; note: string; photos: Photo[]; fb: Record<string, 'up' | 'down'> };
  onAsk(q: string): void;
  onFeedback(q: string, photoId: string, v: 'up' | 'down'): void;
}
export const BLOCK_ICON: Record<string, string> = { needs: 'warn', beforeclose: 'stack', photos_week: 'cam', ask: 'bulb', timesavers: 'clock', progress: 'stack', portfolio: 'stack', closeout: 'check', hazards: 'warn', retro: 'clock', playbook: 'bulb', lessons: 'bulb' };
const KIND_ICON: Record<string, string> = { photo: 'cam', water: 'drop', hazard: 'warn', send: 'send' };
const alt = (p: Photo) => `${p.trade}${p.unit ? ` · unit ${p.unit}` : ''}`;
const calm = (text: string) => h('p', { class: 'calm' }, icon('check'), text);
const wall = (ps: Photo[], c: BlockCtx) => h('div', { class: 'wall' }, ps.map((p, i) => photo({ src: c.media(p.file), alt: alt(p), ratio: i === 0 ? 'hero' : 'square', flag: p.water ? 'water?' : p.hazard ? 'hazard?' : null, onClick: () => c.openPhoto(p) })));

/** Organism registry: block id → how its data looks. The harness sends the ids and the data; this file never decides which blocks show. */
export function renderBlock(id: string, d: Record<string, any>, c: BlockCtx): HTMLElement {
  switch (id) {
    case 'needs': return d.items.length ? h('div', { class: 'row' }, d.items.map((t: any) => actionCard({ title: t.title, iconName: KIND_ICON[t.kind] ?? 'warn', src: c.media(t.photo?.file), actionLabel: t.action, onAct: () => c.act(t.do), onOpen: t.photo ? () => c.openPhoto(t.photo) : undefined }))) : calm('All clear');
    case 'beforeclose': return h('div', {}, h('p', { class: 'hint' }, `Level ${d.level}`), h('div', { class: 'units' }, d.units.map((u: any) => unitTile({ unit: u.unit, state: u.missing ? 'missing' : u.closed ? 'complete' : 'open', src: c.media(u.photo?.file), onClick: () => u.photo && c.openPhoto(u.photo) }))));
    case 'photos_week': case 'hazards': return d.photos.length ? wall(d.photos, c) : calm('Nothing this week');
    case 'progress': return h('div', { class: 'progress' }, photo({ src: c.media(d.hero?.file), alt: 'Site this week', ratio: 'hero', overlay: h('span', { class: 'bigover' }, h('b', {}, `${d.closed} of ${d.total}`), h('small', {}, 'units closed on the level in work')) }), stat(d.photos_this_week, 'photos this week'));
    case 'portfolio': return h('div', { class: 'row' }, stat(`${d.hours_saved.toLocaleString()} h`, 'saved by the harness, all jobs'), stat(d.projects.filter((p: any) => p.status === 'live').length, 'live projects'), stat(d.projects.filter((p: any) => p.status === 'closed').length, 'closed, each left lessons'));
    case 'timesavers': return h('div', { class: 'row' }, d.items.map((s: any, i: number) => saverCard({ title: s.title, kind: s.kind, hours: s.hours, on: s.on, src: c.media(`/media-pool/${['exterior', 'plumbing', 'drywall', 'drywall', 'electrical', 'framing'][i % 6]}/${['exterior', 'plumbing', 'drywall', 'drywall', 'electrical', 'framing'][i % 6]}-0${(i % 5) + 1}.jpg`), onTurnOn: () => c.act(`opp:${s.id}`) })));
    case 'closeout': return h('div', { class: 'row' }, stat(`${d.complete} / ${d.total}`, 'units with a full photo record'), button({ label: 'Build closeout set', variant: 'primary', onClick: () => c.act('opp:closeout') }));
    case 'retro': return h('div', { class: 'row' }, d.facts.map((f: [number, string]) => stat(f[0], f[1])));
    case 'playbook': case 'lessons': return h('div', { class: 'row' }, d.lessons.map((l: string) => h('div', { class: 'lesson' }, icon('bulb'), h('span', {}, l))));
    case 'ask': {
      const qs = h('div', { class: 'queries' }, d.queries.map((q: any, i: number) => queryCard({ label: q.label, active: c.ask.q === q.id, src: c.media(`/media-pool/${['plumbing', 'drywall', 'finishes', 'exterior'][i % 4]}/${['plumbing', 'drywall', 'finishes', 'exterior'][i % 4]}-02.jpg`), onClick: () => c.onAsk(q.id) })));
      if (!c.ask.q) return h('div', {}, qs, h('p', { class: 'hint' }, 'Pick a question. Tap yes or no on results so the harness learns what you meant.'));
      return h('div', {}, qs, h('p', { class: 'hint' }, c.ask.note), h('div', { class: 'wall' }, c.ask.photos.map(p => feedbackPhoto({ src: c.media(p.file), alt: alt(p), value: c.ask.fb[p.id] ?? null, onOpen: () => c.openPhoto(p), onUp: () => c.onFeedback(c.ask.q!, p.id, 'up'), onDown: () => c.onFeedback(c.ask.q!, p.id, 'down') }))));
    }
  }
  return h('p', { class: 'hint' }, 'This block has no view yet.');
}
