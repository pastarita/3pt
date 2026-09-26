#!/usr/bin/env node
// prompts.mjs — pull the prompts typed into Claude Code sessions for this repo out of the session
// transcripts on disk and append them to brainstorming.md as provenance-marked sessions.
//
// Source of truth: ~/.claude/projects/<sanitized cwd>/<session>.jsonl. Every line is one event; a typed
// prompt is {type:"user", message:{content:<string>}, promptId, sessionId, timestamp, cwd, gitBranch}.
// Tool results are arrays, not strings; meta and sidechain (subagent) records are skipped. No API, no
// network: this is deterministic over files that already exist. Grammar of the output: docs/09-provenance.md.
//
//   node scripts/prompts.mjs            append every prompt not yet in brainstorming.md, then rebuild the index
//   node scripts/prompts.mjs --dry      print what would be appended, write nothing
//   --who P|Y                           who typed on this machine (default: $PROV_WHO or P)
//   --no-redact                         keep strings that look like secrets (default: replace with [redacted])
//   --no-build                          skip node scripts/prov.mjs afterwards
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const TRANSCRIPT = join(REPO, 'brainstorming.md');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const DRY = flag('--dry'), REDACT = !flag('--no-redact'), BUILD = !flag('--no-build');
const WHO = opt('--who', process.env.PROV_WHO || 'P');
if (!/^[PYX?]+$/.test(WHO)) { console.error('--who must be letters from P Y X ?'); process.exit(1); }

// ---------- locate the session files: this repo's project dir, plus any worktree of it ----------
const sanitized = (p) => p.replace(/[\\/._]/g, "-");
const PROJECTS = join(homedir(), '.claude', 'projects');
const prefix = sanitized(REPO);
const dirs = existsSync(PROJECTS) ? readdirSync(PROJECTS).filter(d => d === prefix || d.startsWith(prefix + '-')).map(d => join(PROJECTS, d)) : [];
if (!dirs.length) { console.error(`no Claude Code project directory for ${REPO} under ${PROJECTS}`); process.exit(1); }
const files = dirs.flatMap(d => readdirSync(d).filter(f => f.endsWith('.jsonl')).map(f => join(d, f)));

// ---------- read every prompt ----------
const sessions = new Map();   // sessionId → {id, title, cwd, branch, prompts:[{id, ts, text, pasted}]}
for (const file of files) {
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    const sid = o.sessionId || basename(file, '.jsonl');
    if (!sessions.has(sid)) sessions.set(sid, { id: sid, title: null, cwd: null, branch: null, prompts: [], lastTs: null });
    const s = sessions.get(sid);
    if (o.timestamp && (!s.lastTs || o.timestamp > s.lastTs)) s.lastTs = o.timestamp;   /* the session's last event closes the final prompt's commit window */
    if (o.type === 'ai-title' && o.aiTitle) { s.title = o.aiTitle; continue; }
    if (o.type !== 'user' || typeof o.message?.content !== 'string' || o.isMeta || o.isSidechain) continue;
    if (o.userType && o.userType !== 'external') continue;
    const cleaned = clean(o.message.content);
    if (!cleaned.text) continue;
    s.cwd = s.cwd || o.cwd; s.branch = s.branch || o.gitBranch;
    s.prompts.push({ id: o.promptId || o.uuid, ts: o.timestamp, text: cleaned.text, pasted: cleaned.pasted });
  }
}
function clean(raw) {
  let t = raw, pasted = 0;
  t = t.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '');
  t = t.replace(/<local-command-stdout>[\s\S]*?<\/local-command-stdout>/g, '');
  t = t.replace(/<pasted_content[^>]*>([\s\S]*?)<\/pasted_content[^>]*>/g, (_, inner) => { pasted++; return inner; });
  const cmd = t.match(/<command-name>([^<]*)<\/command-name>/);
  if (cmd) { const a = t.match(/<command-args>([^<]*)<\/command-args>/); t = (cmd[1] + ' ' + (a ? a[1] : '')).trim(); }
  t = t.replace(/<command-message>[\s\S]*?<\/command-message>/g, '');
  return { text: t.replace(/\r/g, '').trim(), pasted };
}

// ---------- what is already in the transcript ----------
const existing = readFileSync(TRANSCRIPT, 'utf8');
const have = new Set([...existing.matchAll(/^note prompt (\S+)/gm)].map(m => m[1]));
let nextSession = Math.max(0, ...[...existing.matchAll(/^##\s+Session\s+(\d+)/gm)].map(m => +m[1])) + 1;

// ---------- redaction ----------
const SECRET = [/\b(sk|rk|pk)-[A-Za-z0-9_-]{16,}\b/g, /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, /\bAKIA[0-9A-Z]{16}\b/g, /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
  /\bmongodb(\+srv)?:\/\/[^\s'"]+/g, /\b(eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,})\b/g, /\b[A-Fa-f0-9]{40,}\b/g];
const redacted = [];
const scrub = (text, where) => { if (!REDACT) return text; let out = text; for (const re of SECRET) out = out.replace(re, (m) => { redacted.push(`${where}: ${m.slice(0, 6)}…`); return '[redacted]'; }); return out; };

// ---------- compose ----------
const local = (iso) => { const d = new Date(iso); return { date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, hm: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }; };
const commitsBetween = (a, b) => { try { return execFileSync('git', ['log', '--all', '--format=%h', `--since=${a}`, ...(b ? [`--until=${b}`] : [])], { cwd: REPO }).toString().trim().split('\n').filter(Boolean); } catch { return []; } };
const ordered = [...sessions.values()].filter(s => s.prompts.length).map(s => ({ ...s, prompts: s.prompts.filter(p => !have.has(p.id)).sort((x, y) => x.ts.localeCompare(y.ts)) }))
  .filter(s => s.prompts.length).sort((x, y) => x.prompts[0].ts.localeCompare(y.prompts[0].ts));
const now = local(new Date().toISOString());
const blocks = [];
for (const s of ordered) {
  const n = nextSession++, sid8 = s.id.slice(0, 8), first = local(s.prompts[0].ts);
  const out = [];
  out.push('', `## Session ${n} (${first.date}) · claude:${sid8}${s.title ? ' · ' + s.title : ''}`, '',
    `*Prompts typed into Claude Code session ${s.id} by ${WHO}, cwd \`${s.cwd || '?'}\`, branch \`${s.branch || '?'}\`. Imported verbatim by \`scripts/prompts.mjs\` on ${now.date} ${now.hm}. The agent's replies and tool calls are not transcript; they are in the session file.*`);
  s.prompts.forEach((p, i) => {
    const t = local(p.ts), next = s.prompts[i + 1];
    const commits = commitsBetween(p.ts, next ? next.ts : s.lastTs);
    out.push('', `<!-- s${n}.${String(i + 1).padStart(2, '0')} ${WHO} ${t.hm}`, `note prompt ${p.id} claude ${sid8}`);
    if (commits.length) out.push(`note commits in window ${commits.join(' ')}`);
    if (p.pasted) out.push(`note ${p.pasted} pasted block(s) unwrapped`);
    out.push('-->', '', scrub(p.text, `s${n}.${String(i + 1).padStart(2, '0')}`));
  });
  blocks.push({ n, sid8, title: s.title, count: s.prompts.length, text: out.join('\n') });
}
if (!blocks.length) { console.log('nothing new: every prompt is already in brainstorming.md'); process.exit(0); }
for (const b of blocks) console.log(`Session ${b.n} ← claude:${b.sid8} · ${b.count} prompt(s)${b.title ? ' · ' + b.title : ''}`);
for (const r of redacted) console.log('redacted', r);
if (DRY) { console.log(blocks.map(b => b.text).join('\n')); process.exit(0); }
writeFileSync(TRANSCRIPT, existing.replace(/\s*$/, '\n') + blocks.map(b => b.text).join('\n') + '\n');
console.log(`appended ${blocks.reduce((a, b) => a + b.count, 0)} prompt(s) in ${blocks.length} session(s) to brainstorming.md`);
if (BUILD) execFileSync('node', [join(REPO, 'scripts/prov.mjs')], { cwd: REPO, stdio: 'inherit' });
