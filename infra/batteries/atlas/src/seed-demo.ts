/** Seeds the Atlas Sandbox with the demo firm: data/mock/acme-builders/ → the demo_* collections and harness_versions.
 *  Idempotent: each run replaces the demo collections. Needs ATLAS_URI (read here, never printed). ATLAS_DB defaults to 3pt.
 *    pnpm --filter @3pt/battery-atlas build && node --env-file=.env infra/batteries/atlas/dist/seed-demo.js */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';
import { COLLECTIONS } from '@3pt/core';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const DATA = join(REPO, 'data', 'mock', 'acme-builders');
const lines = (f: string) => existsSync(f) ? readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];

const uri = process.env.ATLAS_URI;
if (!uri) { console.error('[seed-demo] ATLAS_URI is not set. Put it in .env and run with node --env-file=.env'); process.exit(1); }
const client = new MongoClient(uri, { appName: '3pt-seed-demo' });
await client.connect();
const db = client.db(process.env.ATLAS_DB ?? '3pt');

const projects: object[] = [], photos: object[] = [], activity: object[] = [], outcomes: object[] = [];
for (const dir of readdirSync(join(DATA, 'projects')).sort()) {
  const base = join(DATA, 'projects', dir), p = JSON.parse(readFileSync(join(base, 'project.json'), 'utf8'));
  projects.push({ ...p, _id: p.id, folder: 'projects/' + dir });
  for (const f of readdirSync(join(base, 'media')).sort()) for (const x of lines(join(base, 'media', f))) photos.push({ ...x, _id: x.photo, project: p.id, drop: f.replace('.jsonl', '') });
  for (const x of lines(join(base, 'activity.jsonl'))) activity.push({ ...x, project: p.id });
  for (const x of lines(join(base, 'outcomes.jsonl'))) outcomes.push({ ...x, project: p.id });
}
const versions = JSON.parse(readFileSync(join(DATA, 'expected', 'harness-versions.json'), 'utf8')).map((v: any) => ({ ...v, _id: 'v' + v.v, source: 'demo replay' }));

const plan: [string, object[]][] = [[COLLECTIONS.demo_projects, projects], [COLLECTIONS.demo_photos, photos], [COLLECTIONS.demo_activity, activity], [COLLECTIONS.demo_outcomes, outcomes], [COLLECTIONS.harness_versions, versions]];
for (const [name, docs] of plan) {
  const c = db.collection(name);
  await c.deleteMany({});
  for (let i = 0; i < docs.length; i += 1000) await c.insertMany(docs.slice(i, i + 1000) as any[], { ordered: false });
  console.log(`[seed-demo] ${name}: ${docs.length}`);
}
await db.collection(COLLECTIONS.demo_photos).createIndex({ project: 1, taken_at: -1 });
await db.collection(COLLECTIONS.demo_activity).createIndex({ project: 1, at: -1 });
await db.collection(COLLECTIONS.harness_versions).createIndex({ v: -1 });
await client.close();
console.log('[seed-demo] done');
