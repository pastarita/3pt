/**
 * Local Store until the atlas battery is wired: one JSONL file per collection under `.3pt/store/`
 * (gitignored). Same contract as memoryStore(), but it survives the process, so iteration n+1 starts
 * from the policy iteration n wrote. The git-native snapshot lives in harness/policies + checkpoints.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Store } from '@3pt/core';

export function fileStore(dir: string): Store {
  mkdirSync(dir, { recursive: true });
  const file = (c: string) => join(dir, `${c}.jsonl`);
  const rows = (c: string): any[] =>
    existsSync(file(c)) ? readFileSync(file(c), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
  return {
    async insert(c, doc) {
      const d = { ...doc, _id: `file-${c}-${rows(c).length + 1}` };
      appendFileSync(file(c), JSON.stringify(d) + '\n');
      return d;
    },
    async latest(c, k) { const r = rows(c); return r.length ? r.sort((a, b) => (a[k] < b[k] ? 1 : -1))[0] : null; },
    async find(c, f) { return rows(c).filter(r => Object.entries(f).every(([k, v]) => r[k] === v)); },
  };
}
