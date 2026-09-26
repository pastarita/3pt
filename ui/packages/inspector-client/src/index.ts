import type { Checkpoint, Policy } from '@3pt/core';
export interface InspectorClient {
  health(): Promise<{ ok: boolean; at: string }>;
  latestPolicy(): Promise<Policy | null>;
  checkpoints(): Promise<Checkpoint[]>;
}
export function createClient(baseUrl: string, f: typeof fetch = fetch): InspectorClient {
  const get = async <T>(p: string): Promise<T> => { const r = await f(`${baseUrl}${p}`); if (!r.ok) throw new Error(`${p}: ${r.status}`); return r.json() as Promise<T>; };
  return { health: () => get('/health'), latestPolicy: () => get('/policies/latest'), checkpoints: () => get('/checkpoints') };
}
