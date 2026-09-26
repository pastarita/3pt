/**
 * Example data for the role-based app. Every person, project, photo and hour here is AUTHORED
 * sample data, carried over from the hub prototype (hub/site/app.html, wireframe 2) so the two
 * stay in step. Nothing here comes from MongoDB yet. Swap this file when the API serves real data.
 */

export type RoleId = 'super' | 'pm' | 'owner' | 'trade' | 'safety';
/** Harness cards (the same for every role) plus the familiar widgets in WIDGETS below. */
export type CardId = 'week' | 'savers' | 'learned' | 'lookback' | 'upcoming' | WidgetId;
export type WidgetId =
  | 'dailylog' | 'predrywall' | 'punch'                 // superintendent
  | 'openitems' | 'ownerreport' | 'changeorders'        // project manager
  | 'weekly' | 'payapp' | 'closeout'                    // owner
  | 'mytasks' | 'roughin' | 'timecards'                 // trade foreman
  | 'observations' | 'inspections' | 'jha';             // safety manager
export type PhotoKind = 'framing' | 'plumbing' | 'electrical' | 'drywall' | 'concrete' | 'exterior' | 'finished';
export type Status = 'live' | 'done' | 'planned';

export interface Role { id: RoleId; name: string; short: string; person: string; where: string; icon: string; blurb: string }
export interface Project {
  id: string; name: string; kind: string; status: Status; cover: PhotoKind; where: string;
  when: string; team: RoleId[]; photos: number; percent: number; next: string;
}
export interface Photo { id: string; project: string; unit: number | null; kind: PhotoKind; week: number; flag?: 'water' | 'hazard' }
export interface Todo { id: string; title: string; detail: string; action: string; photo: string; icon: string; roles: RoleId[] }
export interface Saver { id: string; title: string; why: string; hours: number; from: string; roles: RoleId[] }
export interface Lesson { v: number; when: string; plain: string; by: string; undone?: boolean }
export interface Session { id: string; title: string; when: string; project?: string }
export interface QuickAction { id: string; label: string; icon: string; prompt: string }

export const ROLES: Role[] = [
  { id: 'super', name: 'Superintendent', short: 'Site lead', person: 'Maria', where: 'On site, on a phone', icon: 'hardhat', blurb: 'Runs the site day to day' },
  { id: 'pm', name: 'Project manager', short: 'PM', person: 'Dev', where: 'In the office', icon: 'clipboard', blurb: 'Keeps cost, time and people on track' },
  { id: 'owner', name: 'Owner', short: 'Owner', person: 'Grace', where: 'Checks in weekly', icon: 'building', blurb: 'Pays for the work and wants the big picture' },
  { id: 'trade', name: 'Plumbing foreman', short: 'Plumbing', person: 'Luis', where: 'On site, on a phone', icon: 'wrench', blurb: 'Leads the plumbing crew' },
  { id: 'safety', name: 'Safety manager', short: 'Safety', person: 'Ana', where: 'On site, on a tablet', icon: 'shield', blurb: 'Keeps every person safe on site' },
];

export const PROJECTS: Project[] = [
  { id: 'towerb', name: 'Tower B', kind: 'Apartment tower', status: 'live', cover: 'framing', where: '14 Harbor St',
    when: 'Week 14 of 40', team: ['super', 'pm', 'owner', 'trade', 'safety'], photos: 412, percent: 34, next: 'Level 2 walls close Friday' },
  { id: 'lofts', name: 'Harbor Lofts', kind: 'Loft conversion', status: 'planned', cover: 'exterior', where: '2 Pier Rd',
    when: 'Starts in November', team: ['super', 'pm', 'owner', 'safety'], photos: 38, percent: 0, next: 'Site walk on Oct 12' },
  { id: 'clinic', name: 'Riverside Clinic', kind: 'Medical office', status: 'done', cover: 'finished', where: '80 River Rd',
    when: 'Finished in 2025', team: ['pm', 'owner', 'trade'], photos: 6200, percent: 100, next: 'Warranty walk in March' },
  { id: 'towera', name: 'Tower A', kind: 'Apartment tower', status: 'done', cover: 'concrete', where: '12 Harbor St',
    when: 'Finished in 2024', team: ['pm', 'owner'], photos: 9800, percent: 100, next: 'Nothing due' },
];

/** Which cards each role sees on a project, in order. The first three show at once; the rest wait. */
// Case study: docs/18-role-ui-case-study.md. Each role first sees the screens it already uses.
export const LAYOUT: Record<RoleId, CardId[]> = {
  super: ['dailylog', 'predrywall', 'punch', 'week', 'savers', 'learned'],
  pm: ['openitems', 'ownerreport', 'changeorders', 'week', 'savers', 'learned'],
  owner: ['weekly', 'payapp', 'closeout', 'savers', 'learned'],
  trade: ['mytasks', 'roughin', 'timecards', 'week', 'learned'],
  safety: ['observations', 'inspections', 'jha', 'week', 'savers', 'learned'],
};
/** Cards that make sense for a project in each status. Every familiar widget is a live-project card. */
const LIVE_WIDGETS = Object.values(LAYOUT).flat().filter(c => !['week', 'savers', 'learned'].includes(c));
export const FITS: Record<Status, CardId[]> = {
  live: [...LIVE_WIDGETS, 'week', 'savers', 'learned'],
  planned: ['upcoming', 'savers', 'learned'],
  done: ['lookback', 'learned'],
};

/* ---------- familiar widgets, with the harness insight on top ---------- */

export type Tone = 'good' | 'warn' | 'alert' | 'quiet';
export interface Row { label: string; sub?: string; chip?: [string, Tone]; photo?: string; right?: string }
/** What the harness noticed. `basis` says what it looked at, so the claim can be checked. */
export interface Insight { text: string; basis: string; action: string; done: string; photos?: string[] }
export interface Widget {
  id: WidgetId; title: string; known: string; icon: string;
  kind: 'rows' | 'units' | 'pairs' | 'stats';
  rows?: Row[]; stats?: [string, string][]; insight: Insight;
}

export const WIDGETS: Record<WidgetId, Widget> = {
  dailylog: { id: 'dailylog', title: 'Daily log · today', known: 'Daily log', icon: 'clipboard', kind: 'rows',
    insight: { text: 'Draft ready from today’s 42 photos: 6 trades on site, drywall delivery at 9:40, pipe work in 207 and 208.', basis: 'Read 42 photos and the weather', action: 'Review draft', done: 'Draft opened', photos: ['IMG_2123', 'IMG_2133', 'IMG_2132'] },
    rows: [
      { label: 'Manpower', sub: '6 companies · 31 workers', chip: ['Drafted', 'quiet'] },
      { label: 'Weather', sub: 'Clear, 64°F, no delays', chip: ['Filled', 'good'] },
      { label: 'Deliveries', sub: '1 · drywall, 40 sheets', chip: ['Drafted', 'quiet'] },
      { label: 'Notes', sub: 'Empty', chip: ['You', 'warn'] },
    ] },
  predrywall: { id: 'predrywall', title: 'Level 2 · before walls close', known: 'Lookahead and pre-drywall walk', icon: 'layers', kind: 'units',
    insight: { text: 'Drywall starts in unit 206 on Thursday. It has no pipe photo yet. Walk it before Wednesday.', basis: 'Matched the lookahead to 37 unit photos', action: 'Add to my walk', done: 'On your walk', photos: ['IMG_2122'] } },
  punch: { id: 'punch', title: 'Punch list', known: 'Punch list', icon: 'check', kind: 'rows',
    insight: { text: '3 open items have a newer photo at the same spot that looks fixed.', basis: 'Compared 9 punch photos with this week’s', action: 'Mark ready for review', done: 'Sent for review', photos: ['IMG_2103', 'IMG_2107', 'IMG_2111'] },
    rows: [
      { label: '#41 Paint touch-up, hall L2', sub: 'Painter · due Fri', chip: ['Looks fixed', 'good'], photo: 'IMG_2103' },
      { label: '#44 Missing outlet cover, 202', sub: 'Electrician · due Fri', chip: ['Looks fixed', 'good'], photo: 'IMG_2107' },
      { label: '#47 Door stop, 203', sub: 'Carpenter · due Mon', chip: ['Looks fixed', 'good'], photo: 'IMG_2111' },
      { label: '#52 Scuffed base, 205', sub: 'Carpenter · due Mon', chip: ['Open', 'warn'] },
    ] },
  openitems: { id: 'openitems', title: 'My open items', known: 'My open items (ball in court)', icon: 'clipboard', kind: 'rows',
    insight: { text: 'RFI-032 asks about the duct at grid C4. Two photos from today show that exact spot.', basis: 'Matched RFI text to photo pins', action: 'Link photos', done: 'Photos linked', photos: ['IMG_2127', 'IMG_2125'] },
    rows: [
      { label: 'RFI-032 Duct clash at C4', sub: 'Waiting on you · 3 days', chip: ['Overdue', 'alert'] },
      { label: 'Submittal 09 29 00 Drywall', sub: 'Waiting on architect', chip: ['Open', 'quiet'] },
      { label: 'RFI-035 Tile layout, lobby', sub: 'Waiting on you · due Mon', chip: ['Due soon', 'warn'] },
    ] },
  ownerreport: { id: 'ownerreport', title: 'Owner report · week 14', known: 'Weekly owner report', icon: 'send', kind: 'pairs',
    insight: { text: 'Drafted: 6 then-and-now photo pairs, 4 RFIs closed, 2 change orders waiting.', basis: 'Picked from 310 new photos', action: 'Edit and send', done: 'Sent to Grace', photos: ['IMG_2132'] } },
  changeorders: { id: 'changeorders', title: 'Change orders', known: 'Change orders', icon: 'layers', kind: 'rows',
    insight: { text: 'CO-014 (extra blocking, unit 203) has 3 photos from Sep 18 that show the work in place.', basis: 'Matched CO scope to unit photos', action: 'Attach as backup', done: 'Attached', photos: ['IMG_2108', 'IMG_2110'] },
    rows: [
      { label: 'CO-014 Extra blocking, 203', sub: '$4,200 · owner review', chip: ['No backup', 'warn'] },
      { label: 'CO-015 Lobby tile upgrade', sub: '$11,800 · draft', chip: ['Draft', 'quiet'] },
    ] },
  weekly: { id: 'weekly', title: 'This week vs last week', known: 'The weekly report', icon: 'image', kind: 'pairs',
    insight: { text: 'Level 2 walls went up in 5 of 8 units. Here are the 6 photo pairs that show the change.', basis: 'Picked from 310 new photos', action: 'See all 6', done: 'Opened', photos: ['IMG_2132'] } },
  payapp: { id: 'payapp', title: 'Pay application #7', known: 'The monthly pay application', icon: 'clipboard', kind: 'rows',
    insight: { text: 'Drywall on level 2 is billed at 80%. Photos from Sep 22 show about 55% hung. Ask before you approve.', basis: 'Counted hung walls in 24 photos', action: 'Ask the PM', done: 'Question sent', photos: ['IMG_2103', 'IMG_2115'] },
    rows: [
      { label: 'Framing, level 2', sub: 'Billed 100%', chip: ['Matches photos', 'good'] },
      { label: 'Drywall, level 2', sub: 'Billed 80%', chip: ['Photos say ~55%', 'alert'] },
      { label: 'Plumbing rough-in, L2', sub: 'Billed 90%', chip: ['Matches photos', 'good'] },
    ] },
  closeout: { id: 'closeout', title: 'Handover records', known: 'Closeout documents', icon: 'check', kind: 'stats',
    insight: { text: 'Unit 206 has no pipe photo, and its wall closes Thursday. After that, no one can see inside it.', basis: 'Checked 8 units for a pipe photo', action: 'Ask for it now', done: 'Asked', photos: ['IMG_2122'] },
    stats: [['7 of 8', 'units with pipe photos'], ['2', 'walls to check for water'], ['0', 'records missing after close']] },
  mytasks: { id: 'mytasks', title: 'My tasks', known: 'Tasks assigned to me', icon: 'wrench', kind: 'rows',
    insight: { text: '2 of your punch items have a photo from your crew today at the same spot.', basis: 'Matched crew photos to task pins', action: 'Send as ready', done: 'Sent', photos: ['IMG_2133', 'IMG_2124'] },
    rows: [
      { label: 'Leak at trap, 208', sub: 'Punch · due today', chip: ['Photo today', 'good'], photo: 'IMG_2133' },
      { label: 'Cap stub-out, 207', sub: 'Punch · due Fri', chip: ['Photo today', 'good'], photo: 'IMG_2124' },
      { label: 'Rough-in, 206', sub: 'Task · before drywall Thu', chip: ['No photo', 'alert'] },
    ] },
  roughin: { id: 'roughin', title: 'Rough-in photos', known: 'Pre-drywall checklist', icon: 'camera', kind: 'units',
    insight: { text: 'The checklist asks for a pipe photo in every unit. Unit 206 has none.', basis: 'Checked 8 units', action: 'Take it now', done: 'On your list', photos: ['IMG_2122'] } },
  timecards: { id: 'timecards', title: 'Daily report · crew', known: 'Daily report and time cards', icon: 'clock', kind: 'rows',
    insight: { text: 'Hours drafted from yesterday. 9 plumbing photos attached.', basis: 'Read 9 photos tagged plumbing', action: 'Confirm', done: 'Confirmed' },
    rows: [
      { label: 'Luis', sub: '8.0 h · rough-in 207', chip: ['Drafted', 'quiet'] },
      { label: 'Sam', sub: '8.0 h · rough-in 208', chip: ['Drafted', 'quiet'] },
      { label: 'Kai', sub: '6.5 h · stub-outs', chip: ['Drafted', 'quiet'] },
    ] },
  observations: { id: 'observations', title: 'Observations', known: 'Safety observations', icon: 'shield', kind: 'rows',
    insight: { text: 'Today’s 42 photos show 1 open edge with no rail, in unit 207.', basis: 'Looked at 42 photos for fall risks', action: 'Create observation', done: 'Created', photos: ['IMG_2131'] },
    rows: [
      { label: 'Open edge, no rail · 207', sub: 'From a photo, 8:12 am', chip: ['New', 'alert'], photo: 'IMG_2131' },
      { label: 'Cords across stair · L1', sub: 'Logged yesterday', chip: ['Fixed', 'good'] },
    ] },
  inspections: { id: 'inspections', title: 'Inspections', known: 'Inspection checklists', icon: 'check', kind: 'stats',
    insight: { text: 'Scaffold items failed in 3 of the last 5 checks, all with Framer Co.', basis: 'Read 5 inspection forms', action: 'Plan a toolbox talk', done: 'Planned for Mon' },
    stats: [['5', 'checks this week'], ['3', 'failed items'], ['1', 'company']] },
  jha: { id: 'jha', title: 'Job hazard plan', known: 'Job hazard analysis', icon: 'alert', kind: 'rows',
    insight: { text: 'Next week the lookahead adds roof work. The plan has no fall-protection part for the roof.', basis: 'Compared the lookahead with the plan', action: 'Review plan', done: 'Opened' },
    rows: [
      { label: 'Level 2 fit-out', sub: 'Covered', chip: ['OK', 'good'] },
      { label: 'Roof work, week 15', sub: 'Not in the plan', chip: ['Missing', 'alert'] },
    ] },
};
export const isWidget = (c: CardId): c is WidgetId => c in WIDGETS;

export const UNITS = [201, 202, 203, 204, 205, 206, 207, 208];

function seedPhotos(): Photo[] {
  const out: Photo[] = [];
  let n = 0;
  const id = () => `IMG_${2100 + n++}`;
  for (const u of UNITS) {
    out.push({ id: id(), project: 'towerb', unit: u, kind: 'framing', week: 9 + (u % 2) });
    if (u !== 206) out.push({ id: id(), project: 'towerb', unit: u, kind: 'plumbing', week: 11 + (u % 3) });
    out.push({ id: id(), project: 'towerb', unit: u, kind: 'electrical', week: 12 });
    if (u <= 206) out.push({ id: id(), project: 'towerb', unit: u, kind: 'drywall', week: u === 206 ? 14 : 13 + (u % 2) });
  }
  out.push({ id: id(), project: 'towerb', unit: 203, kind: 'drywall', week: 14, flag: 'water' });
  out.push({ id: id(), project: 'towerb', unit: 205, kind: 'drywall', week: 14, flag: 'water' });
  out.push({ id: id(), project: 'towerb', unit: 207, kind: 'framing', week: 14, flag: 'hazard' });
  out.push({ id: id(), project: 'towerb', unit: null, kind: 'exterior', week: 14 });
  out.push({ id: id(), project: 'towerb', unit: 208, kind: 'plumbing', week: 14 });
  return out;
}
export const PHOTOS: Photo[] = seedPhotos();

export const TODOS: Todo[] = [
  { id: 'miss206', title: 'Unit 206 needs a photo', detail: 'Drywall started, but no one took the pipe photo first.', action: 'Take photo', photo: 'IMG_2122', icon: 'camera', roles: ['super', 'pm', 'trade'] },
  { id: 'water', title: '2 walls may have water stains', detail: 'Units 203 and 205, near the windows.', action: 'Look', photo: 'IMG_2129', icon: 'drop', roles: ['super', 'pm', 'safety'] },
  { id: 'hazard', title: 'Open edge with no rail', detail: 'Unit 207, photo from this morning.', action: 'Look', photo: 'IMG_2131', icon: 'alert', roles: ['super', 'safety'] },
  { id: 'pack', title: 'Owner photo update is ready', detail: 'Your assistant made it last night.', action: 'Send', photo: 'IMG_2132', icon: 'send', roles: ['pm'] },
];

export const SAVERS: Saver[] = [
  { id: 'ownerpack', title: 'Make the Friday owner update for me', why: 'You made it by hand 38 times on Tower A.', hours: 28, from: 'Tower A', roles: ['pm', 'owner'] },
  { id: 'openwall', title: 'Remind me before a wall closes', why: '3 walls on Tower A were opened again to find a pipe.', hours: 12, from: 'Tower A', roles: ['super', 'pm', 'trade'] },
  { id: 'water', title: 'Point out water stains near windows', why: 'Water damage cost 2 weeks on Riverside Clinic.', hours: 6, from: 'Riverside Clinic', roles: ['super', 'pm', 'safety', 'owner'] },
  { id: 'rails', title: 'Point out open edges with no rail', why: 'Your safety walks found 11 of these by eye last year.', hours: 5, from: 'Riverside Clinic', roles: ['safety', 'super'] },
];

/** The assistant's own change history, in plain words. This is the harness, explained. */
export const LESSONS: Lesson[] = [
  { v: 1, when: 'May 2024', by: 'Dev, project manager', plain: 'Started to sort photos by unit, floor and trade.' },
  { v: 2, when: 'Sep 2024', by: 'Maria, site lead', plain: 'Learned to tell open walls from closed walls, after 38 "not helpful" taps.' },
  { v: 3, when: 'Nov 2024', by: 'The assistant', plain: 'Tried to read 20 photos per question instead of 8. Answers got worse, so it went back.', undone: true },
  { v: 4, when: 'Feb 2025', by: 'Dev, project manager', plain: 'Got a new skill: find units with no pipe photo.' },
  { v: 5, when: 'Jan 2026', by: 'The assistant', plain: 'Set up a screen for each role from 2 years of use. Tower B started with 5 lessons.' },
];

export const SESSIONS: Record<RoleId, Session[]> = {
  super: [
    { id: 's1', title: 'Which units still need a pipe photo?', when: 'Today', project: 'towerb' },
    { id: 's2', title: 'Photos of the level 2 hallway', when: 'Yesterday', project: 'towerb' },
    { id: 's3', title: 'What did we learn on Tower A?', when: 'Mon' },
  ],
  pm: [
    { id: 'p1', title: 'Draft the owner update for week 13', when: 'Last Fri', project: 'towerb' },
    { id: 'p2', title: 'Compare Tower A and Tower B at week 14', when: 'Tue' },
    { id: 'p3', title: 'Closeout photos for Riverside Clinic', when: 'Sep 2', project: 'clinic' },
  ],
  owner: [
    { id: 'o1', title: 'How is Tower B going?', when: 'Last Fri', project: 'towerb' },
    { id: 'o2', title: 'Show me the lobby at Riverside Clinic', when: 'Aug 30', project: 'clinic' },
  ],
  trade: [
    { id: 't1', title: 'Where is the shutoff in unit 204?', when: 'Today', project: 'towerb' },
    { id: 't2', title: 'My photos from last week', when: 'Mon', project: 'towerb' },
  ],
  safety: [
    { id: 'a1', title: 'Open edges on level 2', when: 'Yesterday', project: 'towerb' },
    { id: 'a2', title: 'Safety walk notes, week 13', when: 'Last Thu', project: 'towerb' },
  ],
};

/** Quick actions: home screen, per role. */
export const QUICK: Record<RoleId, QuickAction[]> = {
  super: [
    { id: 'q-today', label: 'What needs me today?', icon: 'sun', prompt: 'What needs me today?' },
    { id: 'q-find', label: 'Find a photo', icon: 'search', prompt: 'Find photos of unit 203' },
    { id: 'q-snap', label: 'Add photos', icon: 'camera', prompt: 'I want to add photos from today' },
  ],
  pm: [
    { id: 'q-update', label: 'Draft the owner update', icon: 'send', prompt: 'Draft the owner update for this week' },
    { id: 'q-behind', label: 'What is behind?', icon: 'clock', prompt: 'What is behind on my projects?' },
    { id: 'q-find', label: 'Find a photo', icon: 'search', prompt: 'Find photos of unit 203' },
  ],
  owner: [
    { id: 'q-how', label: 'How are my projects?', icon: 'sun', prompt: 'How are my projects going?' },
    { id: 'q-show', label: 'Show me this week', icon: 'image', prompt: 'Show me the best photos from this week' },
  ],
  trade: [
    { id: 'q-mine', label: 'My jobs today', icon: 'sun', prompt: 'What are my jobs today?' },
    { id: 'q-snap', label: 'Add photos', icon: 'camera', prompt: 'I want to add photos from today' },
  ],
  safety: [
    { id: 'q-risk', label: 'Any risks today?', icon: 'alert', prompt: 'Any safety risks in today’s photos?' },
    { id: 'q-walk', label: 'Start a safety walk', icon: 'walk', prompt: 'Start a safety walk for Tower B' },
  ],
};

/** Quick actions inside a project, per role. */
export const PROJECT_QUICK: Record<RoleId, QuickAction[]> = {
  super: [
    { id: 'pq-close', label: 'Which walls close next?', icon: 'layers', prompt: 'Which walls close next?' },
    { id: 'pq-find', label: 'Find a photo here', icon: 'search', prompt: 'Find photos of unit 203' },
  ],
  pm: [
    { id: 'pq-update', label: 'Owner update for this project', icon: 'send', prompt: 'Draft the owner update for this week' },
    { id: 'pq-behind', label: 'What is behind here?', icon: 'clock', prompt: 'What is behind on this project?' },
  ],
  owner: [
    { id: 'pq-sum', label: 'Explain this in 3 lines', icon: 'sun', prompt: 'How is this project going?' },
  ],
  trade: [
    { id: 'pq-pipes', label: 'Units that need my photo', icon: 'camera', prompt: 'Which units still need a pipe photo?' },
  ],
  safety: [
    { id: 'pq-risk', label: 'Risks on this site', icon: 'alert', prompt: 'Any safety risks in today’s photos?' },
  ],
};

export const role = (id: RoleId) => ROLES.find(r => r.id === id)!;
export const project = (id: string) => PROJECTS.find(p => p.id === id);
export const photo = (id: string) => PHOTOS.find(p => p.id === id);
export const projectsFor = (r: RoleId) => PROJECTS.filter(p => p.team.includes(r));
export const todosFor = (r: RoleId) => TODOS.filter(t => t.roles.includes(r));
export const saversFor = (r: RoleId) => SAVERS.filter(s => s.roles.includes(r));
export const cardsFor = (r: RoleId, p: Project) => {
  const fit = FITS[p.status];
  const mine = LAYOUT[r].filter(c => fit.includes(c));
  const extra = fit.filter(c => !mine.includes(c) && (c === 'upcoming' || c === 'lookback'));
  return [...extra, ...mine];
};

/** Unit status on level 2: has a closed-wall photo but no pipe photo means "missing". */
export function unitStatus() {
  const live = PHOTOS.filter(p => p.project === 'towerb');
  return UNITS.map(u => {
    const mine = live.filter(p => p.unit === u);
    const closed = mine.some(p => p.kind === 'drywall');
    const pipes = mine.some(p => p.kind === 'plumbing');
    return { unit: u, count: mine.length, state: closed && !pipes ? 'missing' : closed ? 'closed' : 'open' } as const;
  });
}
