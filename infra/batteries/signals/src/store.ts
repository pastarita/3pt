/** The durable object on the box: one SQLite file in WAL mode (node:sqlite, no dependency). Every signal is a row
 *  with its attrs as JSON, so the store is parsable with plain SQL (`3pt-signals --query`), the drain reads by a
 *  cursor (at-least-once), and retention is a DELETE below the drained watermark. docs/20 §6. */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Signal } from './index.js';

export interface StoredSignal extends Signal { id: number }

const SCHEMA = `
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, t TEXT NOT NULL, host TEXT NOT NULL, kind TEXT NOT NULL,
  pid INTEGER NOT NULL, comm TEXT NOT NULL, stage TEXT NOT NULL, iteration INTEGER NOT NULL, attrs TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS events_kind_t ON events(kind, t);
CREATE INDEX IF NOT EXISTS events_iter_kind ON events(iteration, kind);
CREATE TABLE IF NOT EXISTS cursors (name TEXT PRIMARY KEY, pos INTEGER NOT NULL DEFAULT 0, at TEXT);
CREATE TABLE IF NOT EXISTS plugins (name TEXT PRIMARY KEY, source TEXT NOT NULL, version INTEGER NOT NULL, code TEXT NOT NULL, at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS agent_log (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, line TEXT NOT NULL);`;

export class SignalStore {
  readonly db: DatabaseSync;
  private ins; private cur; private curSet; private plugUp;
  constructor(readonly path: string, readOnly = false) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path, { readOnly });
    if (!readOnly) {
      this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA busy_timeout=2000;');
      this.db.exec(SCHEMA);
    }
    this.ins = this.db.prepare('INSERT INTO events (t,host,kind,pid,comm,stage,iteration,attrs) VALUES (?,?,?,?,?,?,?,?)');
    this.cur = this.db.prepare('SELECT pos FROM cursors WHERE name = ?');
    this.curSet = this.db.prepare('INSERT INTO cursors (name,pos,at) VALUES (?,?,?) ON CONFLICT(name) DO UPDATE SET pos=excluded.pos, at=excluded.at');
    this.plugUp = this.db.prepare('INSERT INTO plugins (name,source,version,code,at) VALUES (?,?,?,?,?) ON CONFLICT(name) DO UPDATE SET source=excluded.source, version=excluded.version, code=excluded.code, at=excluded.at');
  }
  insert(s: Signal): number { return Number(this.ins.run(s.t, s.host, s.kind, s.pid, s.comm, s.stage, s.iteration, JSON.stringify(s.attrs)).lastInsertRowid); }
  /** One transaction per batch: the agent flushes every 200 ms, so a burst of opens is one fsync, not hundreds. */
  insertMany(batch: Signal[]): number {
    if (!batch.length) return 0;
    this.db.exec('BEGIN'); try { for (const s of batch) this.insert(s); this.db.exec('COMMIT'); } catch (e) { this.db.exec('ROLLBACK'); throw e; }
    return batch.length;
  }
  cursor(name: string): number { const r = this.cur.get(name) as { pos: number } | undefined; return r?.pos ?? 0; }
  advance(name: string, pos: number) { this.curSet.run(name, pos, new Date().toISOString()); }
  /** Rows after a cursor, oldest first. */
  since(pos: number, limit = 500): StoredSignal[] {
    return (this.db.prepare('SELECT * FROM events WHERE id > ? ORDER BY id LIMIT ?').all(pos, limit) as any[]).map(r => ({ ...r, attrs: JSON.parse(r.attrs) }));
  }
  /** Media paths in (lo, hi] that were already opened earlier in the same iteration: the read-once rule, witnessed. */
  rereadsIn(lo: number, hi: number): number {
    const r = this.db.prepare(`SELECT count(*) AS n FROM events e WHERE e.kind='open' AND e.id > ? AND e.id <= ? AND json_extract(e.attrs,'$.media') = 1
      AND EXISTS (SELECT 1 FROM events p WHERE p.kind='open' AND p.iteration = e.iteration AND p.id < e.id AND json_extract(p.attrs,'$.path') = json_extract(e.attrs,'$.path'))`).get(lo, hi) as { n: number };
    return r.n;
  }
  countIn(lo: number, hi: number, kind: string, where = '', params: Array<string | number> = []): number {
    const r = this.db.prepare(`SELECT count(*) AS n FROM events WHERE kind = ? AND id > ? AND id <= ? ${where}`).get(kind, lo, hi, ...params) as { n: number };
    return r.n;
  }
  iterationsIn(lo: number, hi: number): number[] { return (this.db.prepare('SELECT DISTINCT iteration FROM events WHERE id > ? AND id <= ? ORDER BY iteration').all(lo, hi) as any[]).map(r => r.iteration); }
  maxId(): number { return (this.db.prepare('SELECT coalesce(max(id),0) AS m FROM events').get() as { m: number }).m; }
  /** Retention: rows older than `days` that every cursor has passed. */
  prune(days: number): number {
    const floor = (this.db.prepare('SELECT coalesce(min(pos), 0) AS p FROM cursors').get() as { p: number }).p;
    const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
    return Number(this.db.prepare('DELETE FROM events WHERE id <= ? AND t < ?').run(floor, cutoff).changes);
  }
  rememberPlugin(name: string, source: string, version: number, code: string) { this.plugUp.run(name, source, version, code, new Date().toISOString()); }
  plugins(): Array<{ name: string; source: string; version: number; code: string }> { return this.db.prepare('SELECT name, source, version, code FROM plugins').all() as any[]; }
  log(line: string) { try { this.db.prepare('INSERT INTO agent_log (at, line) VALUES (?, ?)').run(new Date().toISOString(), line); } catch { /* read-only or closed */ } }
  /** Parsability: any SELECT, rows as objects. */
  query(sql: string): Record<string, unknown>[] { return this.db.prepare(sql).all() as Record<string, unknown>[]; }
  stats() {
    const kinds = this.db.prepare('SELECT kind, count(*) AS n FROM events GROUP BY kind ORDER BY kind').all() as Array<{ kind: string; n: number }>;
    const cursors = this.db.prepare('SELECT name, pos, at FROM cursors').all() as Array<{ name: string; pos: number; at: string }>;
    return { path: this.path, events: this.maxId(), kinds, cursors, plugins: this.plugins().map(p => `${p.name}@${p.version}(${p.source})`) };
  }
  close() { this.db.close(); }
}
