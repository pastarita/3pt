/**
 * Tours: short, skippable tips that point at one part of the screen at a time.
 *
 * A step points at a region: any element with `data-region="<name>"`. The capture suite reads the
 * same attribute, so a tour step, a test and an image crop all name a region the same way.
 * A step whose region is not on screen, or whose flag is off, is skipped. That is how a tour
 * follows progressive disclosure: it only explains what the user can see.
 */
import { on, type Flag } from './flags';
import { icon } from './art';

export type Screen = 'home' | 'project' | 'harness';
export interface Step { region: string; title: string; body: string; flag?: Flag }
export interface Tour { id: string; name: string; screen: Screen; flag: Flag; steps: Step[] }

export const TOURS: Tour[] = [
  { id: 'basics', name: 'The basics', screen: 'home', flag: 'tour', steps: [
    { region: 'projects', title: 'Your projects', body: 'These are the jobs you are on. Tap one to see what it needs from you.' },
    { region: 'composer', title: 'Ask your assistant', body: 'Type a question the way you would text a coworker. It looks through your photos for you.' },
    { region: 'ask-fab', title: 'Ask your assistant', body: 'Tap here and type a question the way you would text a coworker. It looks through your photos for you.' },
    { region: 'quick', title: 'One-tap questions', body: 'The questions people in your job ask most. Tap one to ask it.' },
    { region: 'history', title: 'Earlier chats', body: 'Your past questions stay here, so you can pick up where you left off.', flag: 'agent.history' },
    { region: 'role', title: 'Your job', body: 'Change this to see the app the way a coworker sees it.' },
  ] },
  { id: 'project', name: 'Inside a project', screen: 'project', flag: 'tour', steps: [
    { region: 'familiar', title: 'The screens you know', body: 'Your daily log, punch list and reports look the way they do today. Nothing new to learn.' },
    { region: 'insight', title: 'What 3PT noticed', body: 'On top, 3PT adds one thing it found in your photos. It says what it looked at, so you can check.' },
    { region: 'card-week', title: 'This week', body: 'The newest photos. Tap one to see it big.' },
    { region: 'more', title: 'More when you want it', body: 'Extra cards wait here, so the screen stays calm.' },
  ] },
  { id: 'learns', name: 'How 3PT learns', screen: 'harness', flag: 'tour', steps: [
    { region: 'loop', title: 'One loop, three points', body: 'Plan picks one change from what people tap. Build ships it. Check scores it.' },
    { region: 'versions', title: 'Every version', body: 'Each change is a new version. Nothing is edited after it ships.' },
    { region: 'bulb', title: 'The bulb', body: 'It lights up when 3PT ships something new. Tap it to see what changed and why.' },
  ] },
  { id: 'harness', name: 'How it learns', screen: 'project', flag: 'presenter', steps: [
    { region: 'card-savers', title: 'It spots repeat work', body: 'It watches what people do by hand, again and again, and offers to do it. You say yes or no.', flag: 'cards.savers' },
    { region: 'card-learned', title: 'It changes itself', body: 'Every yes, no and "not helpful" tap teaches it. Each change is written here in plain words.', flag: 'cards.learned' },
    { region: 'undo', title: 'You stay in charge', body: 'Any change can be undone. Change 3 made answers worse, so it went back by itself.', flag: 'cards.learned' },
    { region: 'composer', title: 'Same assistant, every role', body: 'A site lead and an owner ask different things. Each gets a screen built from what their role uses.' },
  ] },
];

const SEEN = 'tpt_web_tours';
export function seen(): Record<string, boolean> { try { return JSON.parse(localStorage.getItem(SEEN) || '{}'); } catch { return {}; } }
function markSeen(id: string) { const s = seen(); s[id] = true; try { localStorage.setItem(SEEN, JSON.stringify(s)); } catch { /* ignore */ } }
export function resetTours() { try { localStorage.removeItem(SEEN); } catch { /* ignore */ } }

let active: { tour: Tour; steps: Step[]; i: number; onEnd?: () => void } | null = null;
const q = (region: string) => document.querySelector<HTMLElement>(`[data-region="${region}"]`);
/** On screen, or reachable by scroll. A part inside a closed phone sheet does not count. */
function visible(el: HTMLElement | null): boolean {
  if (!el || !el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') return false;
  for (let a: HTMLElement | null = el; a; a = a.parentElement) {
    if (getComputedStyle(a).position === 'fixed') { const r = a.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }
  }
  return true;
}

export const tourActive = () => active?.tour.id ?? null;
export const tourStep = () => (active ? { tour: active.tour.id, step: active.i, region: active.steps[active.i].region } : null);

export function startTour(id: string, onEnd?: () => void): boolean {
  const tour = TOURS.find(t => t.id === id);
  if (!tour || !on('tour') || !on(tour.flag)) return false;
  const steps = tour.steps.filter(s => (!s.flag || on(s.flag)) && visible(q(s.region)));
  if (!steps.length) return false;
  active = { tour, steps, i: 0, onEnd };
  draw();
  return true;
}

/** Start the screen's first-visit tour once, if autostart is on. */
export function autostart(screen: Screen) {
  if (active || !on('tour') || !on('tour.autostart')) return;
  const t = TOURS.find(x => x.screen === screen && x.flag === 'tour' && !seen()[x.id]);
  if (t) setTimeout(() => startTour(t.id), 250);
}

export function endTour() {
  if (!active) return;
  markSeen(active.tour.id);
  const cb = active.onEnd;
  active = null;
  document.getElementById('tour')?.remove();
  window.removeEventListener('resize', follow);
  window.removeEventListener('scroll', follow);
  cb?.();
}

function go(d: number) {
  if (!active) return;
  const n = active.i + d;
  if (n < 0) return;
  if (n >= active.steps.length) return endTour();
  active.i = n;
  draw();
}

function draw() {
  if (!active) return;
  const step = active.steps[active.i];
  const el = q(step.region);
  if (!el) return go(1);
  el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  let root = document.getElementById('tour');
  if (!root) {
    root = document.createElement('div');
    root.id = 'tour';
    root.setAttribute('data-region', 'tour');
    document.body.appendChild(root);
    window.addEventListener('resize', follow);
    window.addEventListener('scroll', follow, { passive: true });
    root.addEventListener('click', e => {
      const a = (e.target as HTMLElement).closest<HTMLElement>('[data-tour]')?.dataset.tour;
      if (a === 'next') go(1); else if (a === 'back') go(-1); else if (a === 'skip') endTour();
    });
  }
  const total = active.steps.length;
  const last = active.i === total - 1;
  root.innerHTML =
    `<div class="tour-spot"></div>` +
    `<div class="tour-pop" role="dialog" aria-modal="false" aria-labelledby="tour-title">` +
      `<div class="tour-head"><span class="tour-kicker">${icon('compass', 'ic sm')} Tip ${active.i + 1} of ${total}</span>` +
      `<button class="icon-btn" data-tour="skip" aria-label="Close tips">${icon('close', 'ic sm')}</button></div>` +
      `<h3 id="tour-title">${step.title}</h3><p>${step.body}</p>` +
      `<div class="tour-foot"><span class="dots">${active.steps.map((_, i) => `<i class="${i === active!.i ? 'on' : ''}"></i>`).join('')}</span>` +
      (active.i > 0 ? `<button class="btn ghost" data-tour="back">Back</button>` : `<button class="btn ghost" data-tour="skip">Skip</button>`) +
      `<button class="btn primary" data-tour="next">${last ? 'Done' : 'Next'}</button></div></div>`;
  follow();
  root.querySelector<HTMLElement>('[data-tour="next"]')?.focus({ preventScroll: true });
}

/** Keep the spotlight and the popover on the region when the page scrolls or resizes. No scrolling here. */
function follow() {
  const root = document.getElementById('tour');
  if (!active || !root) return;
  const el = q(active.steps[active.i].region);
  if (!el) return;
  const r = el.getBoundingClientRect(), pad = 6;
  const spot = root.querySelector<HTMLElement>('.tour-spot')!;
  Object.assign(spot.style, { top: `${r.top - pad}px`, left: `${r.left - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` });
  place(root.querySelector<HTMLElement>('.tour-pop')!, r);
}

/** Put the popover beside the region: below if there is room, else above, else centered. */
function place(pop: HTMLElement, r: DOMRect) {
  const W = document.documentElement.clientWidth, H = document.documentElement.clientHeight, m = 12;
  const pw = Math.min(340, W - 2 * m);
  pop.style.width = pw + 'px';
  const ph = pop.offsetHeight;
  let top = r.bottom + m;
  if (top + ph > H - m) top = r.top - ph - m;
  if (top < m) top = Math.max(m, Math.min(H - ph - m, r.top + r.height / 2 - ph / 2));
  top = Math.max(m, Math.min(top, H - ph - m));
  let left = Math.min(Math.max(m, r.left + r.width / 2 - pw / 2), W - pw - m);
  if (r.width > W * 0.6 && top === r.bottom + m) left = Math.max(m, r.left);
  pop.style.top = top + 'px';
  pop.style.left = left + 'px';
}

document.addEventListener('keydown', e => {
  if (!active) return;
  if (e.key === 'Escape') endTour();
  else if (e.key === 'ArrowRight') go(1);
  else if (e.key === 'ArrowLeft') go(-1);
});
