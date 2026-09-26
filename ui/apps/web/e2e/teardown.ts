/** Merge per-flow JSON into captures/<run>/manifest.json (every shot) and flowmap.json (the flow graph). */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FLOWS } from './flows';

export default function teardown() {
  const out = join(import.meta.dirname, '..', 'captures', process.env.CAPTURE_RUN ?? 'latest');
  if (!existsSync(out)) return;
  const flows: unknown[] = [];
  const walk = (d: string) => readdirSync(d).forEach(f => {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.json') && !['manifest.json', 'flowmap.json'].includes(f) && d !== out) flows.push(JSON.parse(readFileSync(p, 'utf8')));
  });
  walk(out);
  writeFileSync(join(out, 'manifest.json'), JSON.stringify({ run: process.env.CAPTURE_RUN ?? 'latest', at: new Date().toISOString(), flows }, null, 2));
  writeFileSync(join(out, 'flowmap.json'), JSON.stringify(FLOWS.map(f => ({
    id: f.id, role: f.role, intent: f.intent, flags: f.flags ?? '', start: f.start,
    steps: f.steps.map((s, i) => ({ id: s.id, intent: s.intent, next: f.steps[i + 1]?.id ?? null })),
  })), null, 2));
}
