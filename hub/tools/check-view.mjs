// check-view.mjs — Viewer regression checks (prov:ignore — the @s tokens below are fixtures, not cites) against the SHIPPED renderers (site/view-render.js),
// then every real document in the staged artifact. Run from hub/: tools/stage.sh && node tools/check-view.mjs
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(REPO, '_site');
if (!existsSync(ROOT)) { console.error('FAIL: _site/ missing — run tools/stage.sh first'); process.exit(1); }
await import(join(ROOT, 'diagram.js'));      // the Viewer hands ```mermaid fences to TPTDIAGRAM when present
await import(join(ROOT, 'view-render.js'));
const V = globalThis.TPTVIEW;
const NUL = String.fromCharCode(0);
const errs = [];
const ok = (cond, msg) => { if (!cond) errs.push(msg); };

// the checks that caught the shipped bugs upstream
ok(V.md('We ordered 5 units and 12 crates.').includes('5 units and 12 crates'), 'bare numbers eaten by fence restore');
const f = V.md('a\n\n```js\nlet x = 1\n```\n\nb');
ok(f.includes('<pre><code') && f.includes('let x = 1') && !f.includes(NUL), 'fenced code not restored / NUL leaked');
const l = V.md('[p](p.md) [e](https://e.gov) [t](#a) [h](lanes.html)');
ok(l.includes('href="view.html?f=p.md"') && l.includes('href="https://e.gov"') && l.includes('href="#a"') && l.includes('href="lanes.html"'), 'link resolution');
const c = V.csv('a,b\n"x, y","he said ""hi"""\n');
ok(c.includes('x, y') && c.includes('he said "hi"'), 'quoted CSV');
const b = V.csv('# banner\ncol1,col2\n1,2\n');
ok(b.includes('banner') && b.includes('2 columns'), 'CSV banner lifted');
ok(V.md('- [ ] open\n- [x] done').includes('class="todo"') && V.md('- [x] d').includes('class="done"'), 'task list');
ok((V.md('line one\nline two').match(/<p>/g) || []).length === 1, 'hard-wrapped prose must join into one paragraph');
ok(V.md('- a\n  continues').includes('<li>a continues</li>'), 'indented list continuation');
ok(V.md('```\n<!-- s9.99 P -->\n```').includes('&lt;!-- s9.99 P --&gt;') && !V.md('```\n<!-- s9.99 P -->\n```').includes(NUL), 'a marker inside a code fence is shown, not rendered');
ok(!V.md('a\n<!-- @s1.01 -->\nb').includes('s1.01') && !V.md('<!-- x\ny -->\nz').includes('&lt;!--'), 'HTML comments must render as nothing');
const sg = V.md('<!-- s1.12 PY\nidea a\ngrow b\n-->\nwords');
ok(sg.includes('id="s1.12"') && sg.includes('2 ideas') && sg.includes('<p>words</p>') && V.md('<!-- s1.05 ? -->\nq').includes('id="s1.05"'), 'segment marker renders as an anchored chip');
ok(V.md('[b](../brainstorming.md) [v](00-vision.md)', 'docs/').includes('f=brainstorming.md') && V.md('[v](00-vision.md)', 'docs/').includes('f=docs/00-vision.md'), 'relative links resolve against the document directory');
ok(('a' + NUL + 'b').includes(NUL) === true, 'NUL canary cannot detect NUL');
ok(!readFileSync(join(REPO, 'site', 'view-render.js')).includes(0), 'view-render.js contains a literal NUL byte (git will treat it as binary)');
ok(V.md('## 2. Capability ledger\n### What each stage\'s harness is, concretely\n## a\n## a').match(/id="2-capability-ledger"[\s\S]*id="what-each-stages-harness-is-concretely"[\s\S]*id="a"[\s\S]*id="a-2"/), 'headings carry slug ids (prov.mjs rule, deduped) so #anchors land');

// every real document in the artifact
const docs = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    if (e.startsWith('.') || ['node_modules','tools','functions'].includes(e)) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(md|csv|json|geojson)$/.test(e)) docs.push(relative(ROOT, p));
  }
})(ROOT);
let n = 0;
for (const d of docs) {
  const text = readFileSync(join(ROOT, d), 'utf8');
  const kind = V.resolve(d);
  let html = '';
  try { html = kind === 'markdown' ? V.md(text) : kind === 'csv' ? V.csv(text) : V.json(text); }
  catch (e) { errs.push(`${d}: renderer threw ${e.message}`); continue; }
  ok(!html.includes(NUL), `${d}: NUL in output`);
  // a template failure renders `undefined` as a whole value (>undefined<, "undefined", =undefined);
  // the word in ordinary prose ("when document is undefined") is not a defect
  ok(!/(>|"|=)undefined(<|"|$)/m.test(html.replace(/<code[\s\S]*?<\/code>/g, '')), `${d}: "undefined" rendered as a value`);
  ok(!/<p><\/p>/.test(html), `${d}: empty paragraph`);
  n++;
}
// every relative markdown link must resolve inside the artifact. The Viewer resolves a link
// against the DOCUMENT'S OWN DIRECTORY (see the unit check above), so a link is checked from
// dirname(doc): `../brainstorming.md` from docs/ is right, `brainstorming.md` from docs/ is not,
// and a repo path like hub/site/x.html is never right because hub/site/ is the artifact root.
let links = 0;
for (const d of docs) {
  if (!/\.md$/.test(d)) continue;
  // fenced code is not prose: example links inside ``` blocks are not links
  const text = readFileSync(join(ROOT, d), 'utf8').replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const h = m[1];
    if (/^(https?:|mailto:|#)/.test(h)) continue;
    links++;
    const bare = h.split('#')[0].split('?')[0];
    const target = bare.startsWith('/') ? join(ROOT, bare) : join(ROOT, dirname(d), bare);   // '/x' is root-anchored in the Viewer
    if (!existsSync(target)) errs.push(`${d}: link target not in artifact (resolved from the document's directory): ${h}`);
  }
}

// every #anchor that points into a markdown document must land: on a heading slug (the Viewer's
// rule, same as prov.mjs), on a literal id="…", or on a segment marker <!-- sN.NN. Checked for
// markdown links in docs and for view.html?f=<doc>#<anchor> in every leaf and data file, so a
// pointer page cannot ship a dead pointer. Leaf anchors (x.html#id) must find id="…" in that leaf.
const slug = h => h.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'section';
const headingIds = new Map();
const idsOf = file => {
  if (!headingIds.has(file)) {
    const t = readFileSync(join(ROOT, file), 'utf8'); const seen = {}; const ids = new Set();
    for (const m of t.matchAll(/^#{1,6}\s+(.*)$/gm)) { let s = slug(m[1]); if (seen[s]) { seen[s]++; s += '-' + seen[s]; } else seen[s] = 1; ids.add(s); }
    for (const m of t.matchAll(/<!--\s*(s\d+\.\d{2})\b/g)) ids.add(m[1]);
    for (const m of t.matchAll(/\bid="([^"]+)"/g)) ids.add(m[1]);
    headingIds.set(file, { ids, text: t.toLowerCase() });
  }
  return headingIds.get(file);
};
const lands = (file, a) => { const { ids, text } = idsOf(file); const al = a.toLowerCase(); return ids.has(a) || [...ids].some(i => i.startsWith(al)) || text.includes(al); };
let anchors = 0;
for (const d of docs) {
  if (!/\.md$/.test(d)) continue;
  const text = readFileSync(join(ROOT, d), 'utf8');
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s#]+\.md)#([^)\s]+)\)/g)) {
    const target = m[1].startsWith('/') ? m[1].slice(1) : relative(ROOT, join(ROOT, dirname(d), m[1]));
    if (!existsSync(join(ROOT, target))) continue;   // reported above
    anchors++; if (!lands(target, decodeURIComponent(m[2]))) errs.push(`${d}: #${m[2]} lands nowhere in ${target}`);
  }
}
const leafIds = new Map();
for (const f of readdirSync(ROOT).filter(x => /\.(html|js)$/.test(x))) {
  // comments are not pointers: a data file may document the pointer grammar in its header
  const text = readFileSync(join(ROOT, f), 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const m of text.matchAll(/view\.html\?f=([^#"'\s)]+)#([^"'\s)<]+)/g)) {
    const target = decodeURIComponent(m[1]);
    if (!existsSync(join(ROOT, target))) { errs.push(`${f}: viewer target missing: ${target}`); continue; }
    anchors++; if (!lands(target, decodeURIComponent(m[2]))) errs.push(`${f}: view.html?f=${target}#${m[2]} lands nowhere`);
  }
  for (const m of text.matchAll(/(?:^|["'(\s])\.?\/?([a-z0-9-]+\.html)#([\w.-]+)/g)) {
    if (m[1] === 'view.html') continue;
    const leaf = join(ROOT, m[1]); if (!existsSync(leaf)) { errs.push(`${f}: leaf missing for anchor ${m[1]}#${m[2]}`); continue; }
    if (!leafIds.has(m[1])) leafIds.set(m[1], new Set([...readFileSync(leaf, 'utf8').matchAll(/\bid="([^"]+)"/g)].map(x => x[1])));
    anchors++; if (!leafIds.get(m[1]).has(m[2])) errs.push(`${f}: ${m[1]}#${m[2]} has no id="${m[2]}" in that leaf`);
  }
}

if (errs.length) { errs.forEach(e => console.error('FAIL:', e)); process.exit(1); }
console.log(`OK — 15 unit checks, ${n} workspace documents rendered clean, ${links} markdown links resolve, ${anchors} anchors land`);
