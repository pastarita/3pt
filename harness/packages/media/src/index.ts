import type { Job, MediaAsset, Tier } from '@3pt/core';

/** Promotion / demotion rule. Relevance-driven later; recency-driven now. */
export function chooseTier(asset: MediaAsset, now = Date.now(), hotWindowMs = 7 * 24 * 3600_000): Tier {
  if (!asset.lastRead) return 'cold';
  return now - Date.parse(asset.lastRead) < hotWindowMs ? 'hot' : 'cold';
}

/** Read-once: an asset with a transcript is never re-read for context. */
export function needsTranscript(asset: MediaAsset): boolean { return !asset.transcriptId; }

export function jobFor(asset: MediaAsset): Job | null {
  if (needsTranscript(asset)) return { kind: 'transcribe', assetId: asset.assetId, status: 'queued', attempts: 0, createdAt: new Date().toISOString() };
  const t = chooseTier(asset);
  if (t !== asset.tier) return { kind: 'tier', assetId: asset.assetId, status: 'queued', attempts: 0, createdAt: new Date().toISOString() };
  return null;
}
