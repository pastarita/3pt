import type { Checkpoint, Policy } from '@3pt/core';
export interface InspectorClient {
  health(): Promise<{ ok: boolean; at: string }>;
  latestPolicy(): Promise<Policy | null>;
  checkpoints(): Promise<Checkpoint[]>;
  /** The Acme Builders demo firm at a week. Query keys: week, seed, projects, maxLive, cadence, learn, today, missBase. */
  simState(query?: Record<string, string | number>): Promise<any>;
  simProject(id: string, query?: Record<string, string | number>): Promise<any>;
}
export function createClient(baseUrl: string, f: typeof fetch = fetch): InspectorClient {
  const get = async <T>(p: string): Promise<T> => { const r = await f(`${baseUrl}${p}`); if (!r.ok) throw new Error(`${p}: ${r.status}`); return r.json() as Promise<T>; };
  const qs = (q?: Record<string, string | number>) => q ? '?' + new URLSearchParams(Object.entries(q).map(([k, v]) => [k, String(v)])).toString() : '';
  return { health: () => get('/health'), latestPolicy: () => get('/policies/latest'), checkpoints: () => get('/checkpoints'),
           simState: (q) => get('/sim/state' + qs(q)), simProject: (id, q) => get('/sim/projects/' + id + qs(q)) };
}
