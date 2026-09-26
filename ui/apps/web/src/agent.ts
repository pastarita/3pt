/**
 * The assistant, as the app sees it. For now it answers from the sample data with fixed rules,
 * so the flows can be shown and captured without a model or a network. When the harness API
 * serves answers, replace `reply` with a call through @3pt/inspector-client and keep the shape.
 */
import { PHOTOS, project, projectsFor, todosFor, unitStatus, type RoleId } from './data';

export interface Msg { from: 'me' | 'ai'; text: string; photos?: string[] }

export function reply(text: string, r: RoleId, projectId?: string): Msg {
  const t = text.toLowerCase();
  const p = projectId ? project(projectId) : undefined;
  const unit = t.match(/\b(20[1-8])\b/)?.[1];
  if (unit) {
    const ph = PHOTOS.filter(x => x.unit === +unit).map(x => x.id);
    return { from: 'ai', text: `I found ${ph.length} photos of unit ${unit}. The newest is from week 14.`, photos: ph.slice(0, 4) };
  }
  if (/owner|update|report/.test(t)) {
    return { from: 'ai', text: 'Here is a draft for the owner: "Level 2 walls close Friday. 34% done. 2 walls need a look for water." I picked 4 photos. Send it?', photos: ['IMG_2132', 'IMG_2126', 'IMG_2103', 'IMG_2116'] };
  }
  if (/risk|safety|hazard|edge|rail/.test(t)) {
    return { from: 'ai', text: 'One photo from this morning shows an open edge with no rail in unit 207.', photos: ['IMG_2131'] };
  }
  if (/close|pipe|wall/.test(t)) {
    const miss = unitStatus().filter(u => u.state === 'missing').map(u => u.unit);
    return { from: 'ai', text: miss.length ? `Unit ${miss.join(', ')} has a closed wall but no pipe photo. Units 207 and 208 close next.` : 'Every closed wall has a pipe photo.', photos: ['IMG_2122'] };
  }
  if (/add photo|upload/.test(t)) return { from: 'ai', text: 'Tap the camera, or drop photos here. I will sort them by unit and trade for you.' };
  if (/behind/.test(t)) return { from: 'ai', text: 'Tower B is 2 days behind on level 2 drywall. Everything else is on time.' };
  if (/today|need|job/.test(t)) {
    const n = todosFor(r).length;
    return { from: 'ai', text: n ? `${n} things need you today. The first: ${todosFor(r)[0].title.toLowerCase()}.` : 'Nothing needs you today.' };
  }
  if (/how|going|best|week/.test(t)) {
    const list = p ? [p] : projectsFor(r).filter(x => x.status === 'live');
    return { from: 'ai', text: list.map(x => `${x.name}: ${x.percent}% done. Next: ${x.next}.`).join(' ') || 'No project is running right now.', photos: ['IMG_2132', 'IMG_2118'] };
  }
  return { from: 'ai', text: 'I can look through your photos, find what is missing, and draft updates. Try "find photos of unit 203".' };
}
