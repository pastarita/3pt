#!/usr/bin/env node
// treemap.mjs — the corpus, drawn. Lines of tracked source per workspace, grouped by lane,
// squarified into docs/assets/treemap.svg (DERIVED). Prints the same tallies as a markdown table.
//
//   node scripts/treemap.mjs            writes docs/assets/treemap.svg, prints the table
//   node scripts/treemap.mjs --table    prints the table only
//
// Lanes are the tree's top level (docs/10-architecture.md §1): harness · ui · infra · hub · docs ·
// data · meta (scripts, CI, skills, root). A workspace is the third path segment inside a lane
// (harness/packages/core), the second elsewhere (hub/site). Generated files (prov-data.js,
// replay-data.js, provenance-index.md) are counted but drawn dimmer: they are output, not authorship.
// Fonts, photos, records under data/mock, lockfiles and binary assets are not source and are skipped.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = /\.(ts|tsx|js|mjs|swift|html|css|md|sh|ya?ml|jsonc?|toml|py)$/;
const SKIP = /(^|\/)(node_modules|fonts|photos|dist|_site)\/|pnpm-lock\.yaml$|^docs\/assets\/|^data\/mock\/.*\.(json|jsonl|csv)$|package\.json$|tsconfig[^/]*\.json$/;
const GEN = /prov-data\.js$|replay-data\.js$|provenance-index\.md$|sim-data\.js$/;
const LANE = { harness:'harness', ui:'ui', infra:'infra', hub:'hub', docs:'docs', data:'data' };
const HUE = { harness:'#e0a33a', ui:'#8b7cf6', infra:'#3aa6d9', hub:'#7d8a99', docs:'#3fb886', data:'#c98a5a', meta:'#5c6673' };
const ORDER = ['harness','ui','infra','hub','docs','data','meta'];

const files = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(f => f && SRC.test(f) && !SKIP.test(f));
const ws = new Map();   // key → { lane, name, lines, gen }
for (const f of files) {
  const p = f.split('/'), lane = LANE[p[0]] || 'meta';
  let name;
  if (lane === 'meta') name = p.length > 1 ? p[0].replace(/^\./, '') + (p[1] && p[0] === '.claude' ? '/' + p[1] : '') : 'root';
  else if (['harness','ui','infra'].includes(lane)) name = p.length > 3 ? p.slice(0, 3).join('/') : p.slice(0, 2).join('/');
  else name = p.length > 2 ? p.slice(0, 2).join('/') : p[0];
  const gen = GEN.test(f);
  const key = name + (gen ? ' (generated)' : '');
  let n = 0; try { n = readFileSync(join(ROOT, f), 'utf8').split('\n').length; } catch {}
  const r = ws.get(key) || { lane, name: key, lines: 0, files: 0, gen };
  r.lines += n; r.files += 1; ws.set(key, r);
}
const rows = [...ws.values()].sort((a, b) => ORDER.indexOf(a.lane) - ORDER.indexOf(b.lane) || b.lines - a.lines);
const total = rows.reduce((s, r) => s + r.lines, 0);
const lanes = ORDER.map(l => ({ lane: l, lines: rows.filter(r => r.lane === l).reduce((s, r) => s + r.lines, 0), rows: rows.filter(r => r.lane === l) })).filter(l => l.lines);

// table
const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ') + 'Z';
let md = `| Lane | Workspace | Files | Lines | Share |\n|---|---|---:|---:|---:|\n`;
for (const l of lanes) for (const r of l.rows) md += `| ${l.lane} | \`${r.name}\` | ${r.files} | ${r.lines.toLocaleString('en-US')} | ${(100 * r.lines / total).toFixed(1)}% |\n`;
md += `| | **total** | ${files.length} | **${total.toLocaleString('en-US')}** | 100% |\n`;
console.log(`<!-- DERIVED by scripts/treemap.mjs at ${stamp}; lanes: ${lanes.map(l => `${l.lane} ${l.lines}`).join(' · ')} -->\n` + md);
if (process.argv.includes('--table')) process.exit(0);

// squarify (Bruls, Huizing, van Wijk) into a rect
function squarify(items, x, y, w, h) {
  const out = [], sum = items.reduce((s, i) => s + i.v, 0); if (!sum) return out;
  let list = items.map(i => ({ ...i, a: i.v / sum * w * h })), X = x, Y = y, W = w, H = h;
  while (list.length) {
    const vert = W >= H, side = vert ? H : W; let row = [], best = Infinity;
    while (list.length) {
      const cand = row.concat(list[0]), area = cand.reduce((s, i) => s + i.a, 0), len = area / side;
      const worst = Math.max(...cand.map(i => Math.max(len / (i.a / len), (i.a / len) / len)));
      if (worst > best) break; best = worst; row.push(list.shift());
    }
    const area = row.reduce((s, i) => s + i.a, 0), len = area / side; let off = vert ? Y : X;
    for (const i of row) { const l = i.a / len; out.push({ ...i, x: vert ? X : off, y: vert ? off : Y, w: vert ? len : l, h: vert ? l : len }); off += l; }
    if (vert) { X += len; W -= len; } else { Y += len; H -= len; }
  }
  return out;
}
const Wd = 1000, Hd = 460, PAD = 4, TOP = 30;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Wd} ${Hd + TOP}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" role="img" aria-label="Treemap of the 3PT tree: lines of tracked source per workspace, grouped by lane">
<rect width="${Wd}" height="${Hd + TOP}" fill="#0f1216"/>
<text x="0" y="18" font-size="13" font-weight="700" fill="#a3adbb" letter-spacing=".08em">3PT · THE TREE · ${total.toLocaleString('en-US')} LINES IN ${files.length} FILES · DERIVED ${stamp}</text>\n`;
let ci = 0;
for (const L of squarify(lanes.map(l => ({ v: l.lines, l })), 0, TOP, Wd, Hd)) {
  const hue = HUE[L.l.lane], cid = 'c' + (ci++);
  svg += `<clipPath id="${cid}"><rect x="${L.x}" y="${L.y}" width="${L.w}" height="${L.h}"/></clipPath>\n<g clip-path="url(#${cid})"><rect x="${L.x + 1}" y="${L.y + 1}" width="${Math.max(0, L.w - 2)}" height="${Math.max(0, L.h - 2)}" fill="${hue}" fill-opacity=".10" stroke="${hue}" stroke-width="1.5"/>\n`;
  const inner = squarify(L.l.rows.map(r => ({ v: r.lines, r })), L.x + PAD, L.y + PAD + 14, L.w - 2 * PAD, L.h - 2 * PAD - 14);
  const lab = L.w > 120 ? `${L.l.lane.toUpperCase()} · ${L.l.lines.toLocaleString('en-US')}` : L.w > 40 ? L.l.lane.toUpperCase() : '';
  if (lab) svg += `<text x="${L.x + PAD + 4}" y="${L.y + PAD + 10}" font-size="11" font-weight="700" fill="${hue}" letter-spacing=".1em">${lab}</text>\n`;
  for (const c of inner) {
    if (c.w < 2 || c.h < 2) continue;
    const op = c.r.gen ? .18 : .42, name = c.r.name.replace(/ \(generated\)$/, '').split('/').pop();
    svg += `<rect x="${c.x + 1}" y="${c.y + 1}" width="${Math.max(0, c.w - 2)}" height="${Math.max(0, c.h - 2)}" rx="3" fill="${hue}" fill-opacity="${op}" stroke="#0f1216" stroke-width="1"${c.r.gen ? ' stroke-dasharray="3 2"' : ''}/>\n`;
    if (c.w > 46 && c.h > 22) svg += `<text x="${c.x + 6}" y="${c.y + 15}" font-size="${c.w > 90 ? 11 : 9}" font-weight="600" fill="#e6e9ee">${esc(name)}</text>`;
    if (c.w > 46 && c.h > 36) svg += `<text x="${c.x + 6}" y="${c.y + 28}" font-size="9" fill="#a3adbb">${c.r.lines.toLocaleString('en-US')}${c.r.gen ? ' · gen' : ''}</text>`;
    svg += '\n';
  }
  svg += '</g>\n';
}
svg += '</svg>\n';
writeFileSync(join(ROOT, 'docs/assets/treemap.svg'), svg);
console.error('wrote docs/assets/treemap.svg');
