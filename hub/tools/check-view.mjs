// check-view.mjs — Viewer regression checks against the SHIPPED renderers (site/view-render.js),
// then every real document in the staged artifact. Run from hub/: tools/stage.sh && node tools/check-view.mjs
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(REPO, '_site');
if (!existsSync(ROOT)) { console.error('FAIL: _site/ missing — run tools/stage.sh first'); process.exit(1); }
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
ok(('a' + NUL + 'b').includes(NUL) === true, 'NUL canary cannot detect NUL');
ok(!readFileSync(join(REPO, 'site', 'view-render.js')).includes(0), 'view-render.js contains a literal NUL byte (git will treat it as binary)');

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
  ok(!/\bundefined\b/.test(html.replace(/<code[\s\S]*?<\/code>/g, '')), `${d}: "undefined" in output`);
  ok(!/<p><\/p>/.test(html), `${d}: empty paragraph`);
  n++;
}
if (errs.length) { errs.forEach(e => console.error('FAIL:', e)); process.exit(1); }
console.log(`OK — 10 unit checks, ${n} workspace documents rendered clean`);
