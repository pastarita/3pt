export type BlobBackend = 'gridfs' | 'r2' | 'fs';
export interface BlobStore { put(key: string, bytes: Uint8Array): Promise<void>; get(key: string): Promise<Uint8Array | null>; }
export const battery = { name: 'blob', provides: ['blob.get', 'blob.put'], env: ['BLOB_BACKEND', 'BLOB_FS_ROOT', 'R2_BUCKET'] } as const;
export function backend(): BlobBackend { return (process.env.BLOB_BACKEND as BlobBackend) ?? 'gridfs'; }
