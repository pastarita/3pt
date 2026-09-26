/** @3pt/worker — drains the jobs collection. Same loop body runs under node (local) and as a Worker (scheduled). */
import { COLLECTIONS, type Job, type MediaAsset, type Store } from '@3pt/core';
import { jobFor } from '@3pt/media';

export async function tick(store: Store, log: (s: string) => void): Promise<number> {
  const assets = await store.find<MediaAsset>(COLLECTIONS.media_index, {});
  let queued = 0;
  for (const a of assets) {
    const j = jobFor(a);
    if (j) { await store.insert<Job>(COLLECTIONS.jobs, j); queued++; }
  }
  log(`[worker] ${assets.length} assets scanned, ${queued} jobs queued`);
  return queued;
}
