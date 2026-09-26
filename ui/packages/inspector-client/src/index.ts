import type { Checkpoint, Policy } from '@3pt/core';

/* ---------- screens the harness composes (see harness/apps/api/src/app.ts) ---------- */
export interface Photo { id: string; unit: number | null; level: number | null; trade: string; wall: string | null; week: number; water?: boolean; hazard?: string | null; file: string | null }
/** What one tap made the loop do. The harness approves itself: it ships a change, or undoes one that scored worse. */
export interface LoopTurn { shipped: { version: number; changes: string[]; why: string } | null; rolled_back: { version: number; to: number; why: string } | null }
export interface Screen {
  project: { id: string; name: string; type: string; status: 'live' | 'closed' | 'planned'; phase: string | null; week: number; cover: string | null };
  role: string;
  harness: { version: number; learned: string; when: string };
  layout: string[];
  more: { id: string; title: string }[];
  blocks: Record<string, { title: string } & Record<string, any>>;
}
/** kind: suggest = the app asks a person (`to`); automate = the app does a task people did by hand; improve = better answers */
export type ChangeKind = 'suggest' | 'automate' | 'improve';
export interface HarnessVersion { v: number; when: string; by: string; changes: string[]; why: string; fields: string[]; layout: Record<string, string[]>; rolledBack?: boolean; score: number | null; kind?: ChangeKind; to?: string }
export interface HarnessState { current: number; fields: string[]; layouts: Record<string, string[]>; versions: HarnessVersion[]; events: number }
export interface FirmProject { id: string; name: string; type: string; neighborhood: string; status: 'live' | 'closed' | 'planned'; phase: string | null; start: string; end: string; photos: number; cover: Photo | null; retro: { facts: [number, string][]; lessons: string[] } | null }
export interface FirmState { week: number; date: string; max_live: number; harness: { version: number; changes: string[]; why: string }; hours_saved: number; projects: FirmProject[] }
export interface NewsItem { v: number; when: string; by: string; changes: string[]; why: string; kind?: ChangeKind; to?: string }
export interface News { current: number; items: NewsItem[] }
export interface AppEvent { role: string; action: 'use' | 'hide' | 'open' | 'fb_up' | 'fb_down' | 'act'; block?: string; q?: string; photo?: string; project?: string; do?: string }

export interface InspectorClient {
  health(): Promise<{ ok: boolean; at: string }>;
  latestPolicy(): Promise<Policy | null>;
  checkpoints(): Promise<Checkpoint[]>;
  /** The Acme Builders demo firm at a week. Query keys: week, seed, projects, maxLive, cadence, learn, today, missBase. */
  simState(query?: Record<string, string | number>): Promise<FirmState>;
  simProject(id: string, query?: Record<string, string | number>): Promise<any>;
  /** One screen for one role on one project. The harness picks the blocks and their order. */
  screen(project: string | null, role: string): Promise<Screen>;
  block(id: string, project: string, role: string): Promise<{ title: string } & Record<string, any>>;
  ask(project: string, q: string): Promise<{ note: string; photos: Photo[] }>;
  photos(project: string): Promise<{ photos: (Photo & { focus?: boolean })[] }>;
  event(e: AppEvent): Promise<{ ok: boolean } & LoopTurn>;
  rollback(v: number): Promise<{ version: number; rolled_back: number }>;
  harness(): Promise<HarnessState>;
  /** Versions the harness shipped after `since` that are still live, newest first. Drives the bulb. */
  news(since: number): Promise<News>;
  reset(): Promise<{ ok: boolean }>;
  /** Absolute URL for a photo path the API returned (/media-pool/…). */
  media(path: string | null | undefined): string | null;
}

export function createClient(baseUrl: string, f: typeof fetch = fetch): InspectorClient {
  const get = async <T>(p: string): Promise<T> => { const r = await f(`${baseUrl}${p}`); if (!r.ok) throw new Error(`${p}: ${r.status}`); return r.json() as Promise<T>; };
  const post = async <T>(p: string, body: unknown): Promise<T> => {
    const r = await f(`${baseUrl}${p}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`${p}: ${r.status}`); return r.json() as Promise<T>;
  };
  const qs = (q?: Record<string, string | number | null>) => q ? '?' + new URLSearchParams(Object.entries(q).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString() : '';
  return {
    health: () => get('/health'), latestPolicy: () => get('/policies/latest'), checkpoints: () => get('/checkpoints'),
    simState: (q) => get('/sim/state' + qs(q)), simProject: (id, q) => get('/sim/projects/' + id + qs(q)),
    screen: (project, role) => get('/app/screen' + qs({ project, role })),
    block: (id, project, role) => get('/app/block' + qs({ id, project, role })),
    ask: (project, q) => get('/app/ask' + qs({ project, q })),
    photos: (project) => get('/app/photos' + qs({ project })),
    event: (e) => post('/app/events', e),
    rollback: (v) => post('/app/rollback', { v }),
    harness: () => get('/app/harness'),
    news: (since) => get('/app/news' + qs({ since })),
    reset: () => post('/app/reset', {}),
    media: (path) => (path ? (path.startsWith('http') ? path : baseUrl + path) : null),
  };
}
