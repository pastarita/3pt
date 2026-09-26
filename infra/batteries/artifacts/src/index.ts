/** Checkpoint bundles: policy snapshot + retrospective + metrics, keyed by tag. Stored beside blobs, indexed in Atlas checkpoints. */
export interface Bundle { tag: string; policyVersion: number; files: Record<string, string> }
export const battery = { name: 'artifacts', provides: ['artifacts.put', 'artifacts.get'], env: ['BLOB_BACKEND'] } as const;
export function bundleKey(tag: string): string { return `artifacts/${tag.replace('/', '-')}.json`; }
