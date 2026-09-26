#!/usr/bin/env node
// prov.mjs — the provenance index over brainstorming.md.
//
// The transcript stays verbatim. Segment markers are HTML comments (invisible when rendered) that
// name a segment, who spoke, the ideas born or moved there, its lineage, and where it landed.
// Anything else in the repo cites a segment with @s<session>.<nn> inside a comment. This tool
// parses both directions, validates them, and emits the index. Grammar: docs/09-provenance.md.
//
//   node scripts/prov.mjs            parse + validate + write docs/provenance-index.md and hub/site/prov-data.js
//   node scripts/prov.mjs --check    validate only; exit 1 on any error (CI)
//   node scripts/prov.mjs --bake     also append `doc <file>` lines to segment blocks for every @cite
//                                    found in the repo that the block does not list yet, then regenerate
//   node scripts/prov.mjs --json     print the model to stdout instead of writing files
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const TRANSCRIPT = 'brainstorming.md';
const OUT_MD = 'docs/provenance-index.md';
const OUT_JS = 'hub/site/prov-data.js';
const args = new Set(process.argv.slice(2));
const CHECK = args.has('--check'), BAKE = args.has('--bake'), JSON_OUT = args.has('--json');

const KEYS = new Set(['idea', 'grow', 'pivot', 'drop', 'from', 'lane', 'doc', 'code', 'term', 'q', 'note']);
const OPS = new Set(['idea', 'grow', 'pivot', 'drop']);
const SEG = /^s(\d+)\.(\d{2})$/;
const BLOCK_OPEN = /^<!--\s*(s\d+\.\d{2})(?:\s+([PYX?]+))?(?:\s+(\d{1,2}:\d{2}))?\s*(-->)?\s*$/;
const CITE = /@(s\d+\.\d{2})(?::([a-z0-9][a-z0-9-]*))?/g;
const SESSION = /^##\s+Session\s+(\d+)\s*\((\d{4}-\d{2}-\d{2})\)/;
const SKIP_DIRS = new Set(['.git', 'node_modules', '_site', '.wrangler', 'build', 'DerivedData', '.build', 'dist', '.install-loop']);
const TEXT_EXT = new Set(['.md', '.js', '.mjs', '.ts', '.swift', '.py', '.sh', '.html', '.css', '.yml', '.yaml', '.json', '.jsonc', '.txt', '.toml', '']);

const errs = [], warns = [];
const err = (m) => errs.push(m);
const warn = (m) => warns.push(m);

// ---------- parse the transcript ----------
const src = readFileSync(join(REPO, TRANSCRIPT), 'utf8');
const lines = src.split('\n');
const sessions = [];      // {n, date, line}
const segments = [];      // {id, session, n, who, time, line, bodyStart, bodyEnd, body, excerpt, words, ops:[], from:[], lanes:[], docs:[], code:[], terms:[], qs:[], notes:[], blockEnd}
let cur = null, session = null;

const slug = (h) => h.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
const finishBody = (seg, endLine) => {
  seg.bodyEnd = endLine;
  const body = lines.slice(seg.bodyStart, endLine).join('\n').replace(/^\s*\n+|\n+\s*$/g, '');
  seg.body = body;
  const first = body.split('\n').map(s => s.trim()).find(s => s && !/^[-—–\s\[\] ]+$/.test(s)) || '';
  seg.excerpt = first.length > 160 ? first.slice(0, 157).replace(/\s+\S*$/, '') + '…' : first;
  seg.words = body.split(/\s+/).filter(Boolean).length;
  if (!seg.words) warn(`${seg.id}: empty segment body`);
};

for (let i = 0; i < lines.length; i++) {
  const L = lines[i];
  const sm = L.match(SESSION);
  if (sm) {
    if (cur) { finishBody(cur, i); cur = null; }
    session = { n: +sm[1], date: sm[2], line: i + 1 };
    sessions.push(session);
    continue;
  }
  const bm = L.match(BLOCK_OPEN);
  if (!bm) continue;
  if (cur) finishBody(cur, i);
  const id = bm[1];
  const seg = { id, session: session ? session.n : null, n: +id.split('.')[1], who: bm[2] || '?', time: bm[3] || null,
    line: i + 1, ops: [], from: [], lanes: [], docs: [], code: [], terms: [], qs: [], notes: [], blockEnd: null, inline: !!bm[4] };
  if (!session) err(`${id} (line ${i + 1}): segment marker before any "## Session N (date)" heading`);
  else if (+id.match(SEG)[1] !== session.n) err(`${id} (line ${i + 1}): session number does not match the heading (Session ${session.n})`);
  if (segments.some(s => s.id === id)) err(`${id} (line ${i + 1}): duplicate segment id`);
  const prev = segments[segments.length - 1];
  if (prev && prev.session === seg.session && prev.n >= seg.n) err(`${id} (line ${i + 1}): segment ids must increase within a session (after ${prev.id})`);
  if (!/^[PYX?]+$/.test(seg.who)) err(`${id}: who must be letters from P Y X ? (got "${seg.who}")`);
  segments.push(seg);
  if (bm[4]) { seg.blockEnd = i + 1; seg.bodyStart = i + 1; cur = seg; continue; }
  // multi-line block: directives until a line that is exactly -->
  let lastOp = null, j = i + 1;
  for (; j < lines.length; j++) {
    const raw = lines[j];
    if (raw.trim() === '-->') break;
    if (!raw.trim()) continue;
    const dm = raw.match(/^(\s*)([a-z]+)\s+(.*\S)\s*$/);
    if (!dm) { err(`${id} (line ${j + 1}): unparsable directive "${raw.trim()}"`); continue; }
    const [, indent, key, rest] = dm;
    if (!KEYS.has(key)) { err(`${id} (line ${j + 1}): unknown directive "${key}"`); continue; }
    if (OPS.has(key)) {
      const m = rest.match(/^([a-z0-9][a-z0-9-]*)(?:\s*::\s*(.*))?$/);
      if (!m) { err(`${id} (line ${j + 1}): ${key} needs "<slug> [:: gloss]"`); continue; }
      lastOp = { op: key, slug: m[1], gloss: m[2] || '', docs: [], code: [], line: j + 1 };
      seg.ops.push(lastOp);
    } else if (key === 'doc' || key === 'code') {
      const target = { path: rest.split('#')[0].trim(), anchor: rest.includes('#') ? rest.slice(rest.indexOf('#') + 1).trim() : null, line: j + 1 };
      if (indent && lastOp) lastOp[key === 'doc' ? 'docs' : 'code'].push(target); else seg[key === 'doc' ? 'docs' : 'code'].push(target);
      if (indent && !lastOp) warn(`${id} (line ${j + 1}): indented ${key} with no idea above it; attached to the segment`);
    } else if (key === 'from') {
      seg.from.push(...rest.split(/[\s,]+/).filter(Boolean));
    } else if (key === 'lane') {
      seg.lanes.push(...rest.split(/[\s,]+/).filter(Boolean).map(Number));
    } else if (key === 'term') {
      seg.terms.push(rest);
    } else if (key === 'q') {
      const k = rest.indexOf('=>');
      const ans = k >= 0 ? rest.slice(k + 2).trim() : '';
      seg.qs.push({ q: (k >= 0 ? rest.slice(0, k) : rest).trim(), a: /^open$/i.test(ans) ? null : (ans || null), line: j + 1 });
    } else if (key === 'note') {
      seg.notes.push(rest);
    }
  }
  if (j >= lines.length) err(`${id}: block never closed with -->`);
  seg.blockEnd = j + 1;
  seg.bodyStart = j + 1;
  cur = seg;
  i = j;
}
if (cur) finishBody(cur, lines.length);
if (!segments.length) err(`no segment markers found in ${TRANSCRIPT}`);

// ---------- validate lineage, ideas, lanes, targets ----------
const byId = new Map(segments.map(s => [s.id, s]));
const order = new Map(segments.map((s, i) => [s.id, i]));
const ideas = new Map();   // slug → {slug, born, who, gloss, history:[{seg, op, gloss}], docs:Set, code:Set}
let lanes = [1, 2, 3, 4, 5, 6, 7], laneNames = {};
try {
  await import(join(REPO, 'hub/site/3pt-data.js'));
  if (globalThis.T && globalThis.T.LANES) { lanes = globalThis.T.LANES.map(l => l.n); globalThis.T.LANES.forEach(l => laneNames[l.n] = l.name); }
} catch { /* hub absent: keep the static lane list */ }

const headings = new Map();  // file → [slug]
const fileText = new Map();
const readRepoFile = (p) => { if (!fileText.has(p)) fileText.set(p, readFileSync(join(REPO, p), 'utf8')); return fileText.get(p); };
const resolveTarget = (seg, t, kind) => {
  if (/^[a-z]+:|^\/|\.\./.test(t.path)) { err(`${seg.id} (line ${t.line}): ${kind} path must be repo-relative: ${t.path}`); return; }
  if (!existsSync(join(REPO, t.path))) { err(`${seg.id} (line ${t.line}): ${kind} target missing: ${t.path}`); return; }
  if (!t.anchor) return;
  const text = readRepoFile(t.path);
  if (!headings.has(t.path)) headings.set(t.path, [...text.matchAll(/^#{1,6}\s+(.*)$/gm)].map(m => ({ slug: slug(m[1]), text: m[1] })));
  const a = t.anchor, al = a.toLowerCase();
  const hit = headings.get(t.path).some(h => h.slug.startsWith(al) || h.text.toLowerCase().includes(al)) || text.includes(a);
  if (!hit) err(`${seg.id} (line ${t.line}): anchor "#${a}" not found in ${t.path} (no heading starts with it and it appears nowhere literally)`);
};

for (const seg of segments) {
  for (const f of seg.from) {
    if (!byId.has(f)) err(`${seg.id}: from ${f} — no such segment`);
    else if (order.get(f) >= order.get(seg.id)) err(`${seg.id}: from ${f} — lineage must point backwards in time`);
  }
  for (const n of seg.lanes) if (!lanes.includes(n)) err(`${seg.id}: lane ${n} is not a known lane (${lanes.join(', ')})`);
  for (const op of seg.ops) {
    if (op.op === 'idea') {
      if (ideas.has(op.slug)) err(`${seg.id} (line ${op.line}): idea ${op.slug} already born in ${ideas.get(op.slug).born}`);
      else ideas.set(op.slug, { slug: op.slug, born: seg.id, who: seg.who, gloss: op.gloss, history: [], docs: new Set(), code: new Set(), status: 'live' });
    } else if (!ideas.has(op.slug)) {
      err(`${seg.id} (line ${op.line}): ${op.op} ${op.slug} — idea was never born (declare it with "idea" in this or an earlier segment)`);
      continue;
    }
    const idea = ideas.get(op.slug);
    idea.history.push({ seg: seg.id, op: op.op, gloss: op.gloss });
    if (op.op === 'drop') idea.status = 'dropped';
    if (op.op === 'pivot' && idea.status !== 'dropped') idea.status = 'pivoted';
    for (const t of op.docs) { resolveTarget(seg, t, 'doc'); idea.docs.add(t.path); }
    for (const t of op.code) { resolveTarget(seg, t, 'code'); idea.code.add(t.path); }
  }
  for (const t of seg.docs) resolveTarget(seg, t, 'doc');
  for (const t of seg.code) resolveTarget(seg, t, 'code');
}

// ---------- scan the repo for @cites ----------
const cites = [];  // {file, line, seg, idea}
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    if (SKIP_DIRS.has(e)) continue;
    const p = join(dir, e);
    const rel = relative(REPO, p);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) { walk(p); continue; }
    if (rel === TRANSCRIPT || rel === OUT_MD || rel === OUT_JS || !TEXT_EXT.has(extname(e))) continue;
    if (st.size > 2_000_000) continue;
    const text = readFileSync(p, 'utf8');
    if (!text.includes('@s')) continue;
    text.split('\n').forEach((L, i) => { for (const m of L.matchAll(CITE)) cites.push({ file: rel, line: i + 1, seg: m[1], idea: m[2] || null }); });
  }
})(REPO);
for (const c of cites) {
  if (!byId.has(c.seg)) { err(`${c.file}:${c.line}: cites @${c.seg}, no such segment`); continue; }
  if (c.idea && !byId.get(c.seg).ops.some(o => o.slug === c.idea)) err(`${c.file}:${c.line}: cites @${c.seg}:${c.idea}, but ${c.seg} does not declare or move that idea`);
}

// ---------- cross-check the two directions ----------
const forward = new Map();   // seg → Set(path)  (segment says it landed in path)
for (const seg of segments) {
  const set = new Set([...seg.docs, ...seg.code, ...seg.ops.flatMap(o => [...o.docs, ...o.code])].map(t => t.path));
  forward.set(seg.id, set);
}
const backward = new Map();  // seg → Set(file)  (file cites the segment)
for (const c of cites) { if (!byId.has(c.seg)) continue; if (!backward.has(c.seg)) backward.set(c.seg, new Set()); backward.get(c.seg).add(c.file); }
const gaps = [];  // {kind:'unbaked'|'unacknowledged', seg, path}
for (const seg of segments) {
  for (const p of forward.get(seg.id)) if (!(backward.get(seg.id) || new Set()).has(p)) gaps.push({ kind: 'unacknowledged', seg: seg.id, path: p });
  for (const f of backward.get(seg.id) || []) if (!forward.get(seg.id).has(f)) gaps.push({ kind: 'unbaked', seg: seg.id, path: f });
}

// ---------- bake ----------
if (BAKE && !errs.length) {
  const toBake = gaps.filter(g => g.kind === 'unbaked');
  if (toBake.length) {
    const out = lines.slice();
    // apply bottom-up so line numbers stay valid
    for (const seg of [...segments].reverse()) {
      const add = toBake.filter(g => g.seg === seg.id).map(g => `doc ${g.path}`);
      if (!add.length) continue;
      if (seg.inline) {
        out.splice(seg.line - 1, 1, out[seg.line - 1].replace(/\s*-->\s*$/, ''), ...add, '-->');
      } else {
        out.splice(seg.blockEnd - 1, 0, ...add);
      }
    }
    writeFileSync(join(REPO, TRANSCRIPT), out.join('\n'));
    console.log(`baked ${toBake.length} doc line(s) into ${TRANSCRIPT}; re-run to regenerate the index`);
    process.exit(0);
  }
  console.log('nothing to bake');
}

// ---------- report ----------
for (const w of warns) console.log('warn:', w);
if (errs.length) { for (const e of errs) console.error('FAIL:', e); process.exit(1); }

// ---------- model ----------
const model = {
  generated: (d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`)(new Date()),
  transcript: TRANSCRIPT,
  sessions: sessions.map(s => ({ n: s.n, date: s.date, segments: segments.filter(x => x.session === s.n).length, ideas: [...ideas.values()].filter(i => byId.get(i.born).session === s.n).length })),
  segments: segments.map(s => ({ id: s.id, session: s.session, date: (sessions.find(x => x.n === s.session) || {}).date || null, time: s.time, who: s.who, line: s.line,
    bodyLines: [s.bodyStart + 1, s.bodyEnd], words: s.words, excerpt: s.excerpt, body: s.body,
    ops: s.ops.map(o => ({ op: o.op, slug: o.slug, gloss: o.gloss, docs: o.docs.map(t => t.path + (t.anchor ? '#' + t.anchor : '')), code: o.code.map(t => t.path) })),
    from: s.from, to: segments.filter(x => x.from.includes(s.id)).map(x => x.id), lanes: s.lanes,
    docs: s.docs.map(t => t.path + (t.anchor ? '#' + t.anchor : '')), code: s.code.map(t => t.path), terms: s.terms, qs: s.qs.map(q => ({ q: q.q, a: q.a })), notes: s.notes,
    citedBy: [...(backward.get(s.id) || [])].sort() })),
  ideas: [...ideas.values()].map(i => ({ slug: i.slug, born: i.born, who: i.who, gloss: i.gloss, status: i.status, history: i.history,
    docs: [...new Set([...i.docs, ...i.history.flatMap(h => [])])].sort(), code: [...i.code].sort(),
    citedBy: [...new Set(cites.filter(c => c.idea === i.slug).map(c => c.file))].sort() })),
  questions: segments.flatMap(s => s.qs.map(q => ({ seg: s.id, who: s.who, q: q.q, a: q.a, open: !q.a }))),
  terms: segments.flatMap(s => s.terms.map(t => ({ term: t, seg: s.id }))),
  lanes: lanes.map(n => ({ n, name: laneNames[n] || null, segments: segments.filter(s => s.lanes.includes(n)).map(s => s.id) })).filter(l => l.segments.length),
  docs: (() => { const m = new Map(); const add = (p, k, seg) => { if (!m.has(p)) m.set(p, { path: p, landed: new Set(), cites: new Set() }); m.get(p)[k].add(seg); };
    for (const s of segments) for (const p of forward.get(s.id)) add(p, 'landed', s.id);
    for (const c of cites) if (byId.has(c.seg)) add(c.file, 'cites', c.seg);
    return [...m.values()].map(d => ({ path: d.path, landed: [...d.landed], cites: [...d.cites] })).sort((a, b) => a.path.localeCompare(b.path)); })(),
  gaps
};
if (JSON_OUT) { process.stdout.write(JSON.stringify(model, null, 2) + '\n'); process.exitCode = 0; }
else if (CHECK) { console.log(`OK — ${segments.length} segments, ${ideas.size} ideas, ${cites.length} cites, ${model.questions.filter(q => q.open).length} open questions, ${gaps.length} gaps`); process.exitCode = 0; }
if (JSON_OUT || CHECK) { /* no writes */ } else {

// ---------- emit markdown ----------
const glyph = { idea: '●', grow: '＋', pivot: '↻', drop: '✕' };
const segLink = (id) => `[${id}](brainstorming.md#${id})`;
const docLink = (p) => { const [path, anchor] = p.split('#'); return `[${p}](${path})`; };
const cell = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const md = [];
md.push(`<!-- GENERATED by scripts/prov.mjs from ${TRANSCRIPT} on ${model.generated}. Do not edit; edit the segment blocks in ${TRANSCRIPT} or the @cites in the docs, then run: node scripts/prov.mjs -->`);
md.push('', '# Provenance index', '', `*Derived from \`${TRANSCRIPT}\` on ${model.generated} by \`scripts/prov.mjs\`. Every row traces back to a segment marker in the transcript (grammar: \`docs/09-provenance.md\`). Regenerate after editing; never edit here.*`, '');
md.push('## Sessions', '', '| Session | Date | Segments | Ideas born |', '|---|---|---|---|');
for (const s of model.sessions) md.push(`| ${s.n} | ${s.date} | ${s.segments} | ${s.ideas} |`);
md.push('', '## Chronology', '', 'One row per segment, in the order spoken. Who: P Patrick, Y Yash, X guest or mentor, ? uncertain. Ops: ● born, ＋ grown, ↻ pivoted, ✕ dropped.', '',
  '| Seg | Who | Ideas | From | Lanes | Landed in | Says |', '|---|---|---|---|---|---|---|');
for (const s of model.segments) {
  const ops = s.ops.map(o => `${glyph[o.op]} ${o.slug}`).join('<br>');
  const landed = [...new Set([...s.docs, ...s.code, ...s.ops.flatMap(o => [...o.docs, ...o.code])])].map(docLink).join('<br>');
  md.push(`| ${segLink(s.id)} | ${s.who} | ${ops} | ${s.from.map(segLink).join(' ')} | ${s.lanes.join(' ')} | ${landed} | ${cell(s.excerpt)} |`);
}
md.push('', '## Ideas', '', 'Birth is unique. History lists every later segment that grew, pivoted, or dropped the idea.', '',
  '| Idea | Born | Who | Status | History | Landed in | Gloss |', '|---|---|---|---|---|---|---|');
for (const i of model.ideas) {
  const hist = i.history.filter(h => h.op !== 'idea').map(h => `${glyph[h.op]} ${segLink(h.seg)}`).join(' ');
  md.push(`| \`${i.slug}\` | ${segLink(i.born)} | ${i.who} | ${i.status} | ${hist} | ${i.docs.map(docLink).join('<br>')} | ${cell(i.gloss)} |`);
}
md.push('', '## Questions', '', 'The decision space. Open questions are the annealing worklist; resolved ones say where the answer landed.', '',
  '| Seg | Question | Resolution |', '|---|---|---|');
for (const q of model.questions) md.push(`| ${segLink(q.seg)} | ${cell(q.q)} | ${q.a ? cell(q.a) : '**open**'} |`);
if (model.terms.length) {
  md.push('', '## Terms coined', '', '| Term | Seg |', '|---|---|');
  for (const t of model.terms) md.push(`| ${cell(t.term)} | ${segLink(t.seg)} |`);
}
md.push('', '## Lanes', '', '| Lane | Segments that invoked it |', '|---|---|');
for (const l of model.lanes) md.push(`| ${l.n}${l.name ? ' ' + l.name : ''} | ${l.segments.map(segLink).join(' ')} |`);
md.push('', '## Documents', '', '*Landed* = the transcript says the segment landed here. *Cites* = the file cites the segment with `@sN.NN`. The two should agree.', '',
  '| Document | Landed (from transcript) | Cites (from the file) |', '|---|---|---|');
for (const d of model.docs) md.push(`| [${d.path}](${d.path}) | ${d.landed.map(segLink).join(' ')} | ${d.cites.map(segLink).join(' ')} |`);
md.push('', '## Gaps', '');
if (!gaps.length) md.push('None. Every forward pointer is acknowledged by a cite and every cite is baked into the transcript.');
else {
  md.push('| Kind | Seg | Path | Fix |', '|---|---|---|---|');
  for (const g of gaps) md.push(`| ${g.kind} | ${segLink(g.seg)} | ${g.path} | ${g.kind === 'unbaked' ? '`node scripts/prov.mjs --bake`' : `add \`<!-- @${g.seg} -->\` to the file, or remove the doc line`} |`);
}
md.push('');
writeFileSync(join(REPO, OUT_MD), md.join('\n'));

// ---------- emit the hub data layer ----------
const js = `/* 3PT · provenance model — DERIVED. Generated by scripts/prov.mjs from ${TRANSCRIPT} on ${model.generated}.
   Do not edit; edit the segment blocks in ${TRANSCRIPT} and run: node scripts/prov.mjs
   Node-safe: defines globalThis.PROV and does no DOM work. */
(typeof globalThis!=='undefined'?globalThis:window).PROV = ${JSON.stringify(model, null, 1)};
`;
if (existsSync(join(REPO, dirname(OUT_JS)))) writeFileSync(join(REPO, OUT_JS), js); else warn(`${dirname(OUT_JS)} missing; skipped ${OUT_JS}`);
console.log(`OK — ${segments.length} segments, ${ideas.size} ideas, ${cites.length} cites, ${model.questions.filter(q => q.open).length} open questions, ${gaps.length} gaps → ${OUT_MD}${existsSync(join(REPO, OUT_JS)) ? ', ' + OUT_JS : ''}`);
}
