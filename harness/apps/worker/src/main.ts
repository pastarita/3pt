#!/usr/bin/env node
/** @3pt/worker entry: one tick, or `--watch` every WORKER_INTERVAL_MS (default 60 s).
 *  Store = the atlas battery's when ATLAS_URI is set (injected here, at the edge), memory otherwise. */
import { memoryStore } from '@3pt/core';
import { atlasStore } from '@3pt/battery-atlas';
import { tick } from './index.js';

const watch = process.argv.includes('--watch');
const uri = process.env.ATLAS_URI && !process.env.ATLAS_URI.includes('<') ? process.env.ATLAS_URI : undefined;
const store = uri ? await atlasStore(uri, process.env.ATLAS_DB) : memoryStore();
console.log(`[worker] store=${uri ? 'atlas' : 'memory'}${watch ? ' watch' : ' once'}`);
const every = Number(process.env.WORKER_INTERVAL_MS ?? 60_000);
do {
  await tick(store, (l) => console.log(l));
  if (watch) await new Promise((r) => setTimeout(r, every));
} while (watch);
if ('close' in store) await (store as { close(): Promise<void> }).close();
