// tersity.mjs — the tersity metric for first-class leaves (HTML under hub/site/).
// Documents (.md via the Viewer) are out of scope: the Viewer renders them, they are not articles.
//
//   node hub/tools/tersity.mjs            table for every leaf
//   node hub/tools/tersity.mjs --check    exit 1 when any leaf is over budget (make -C hub check)
//   node hub/tools/tersity.mjs a.html …   only those leaves
//
// Words are VISIBLE prose: text nodes after <script>, <style>, comments and <svg> are stripped
// (diagram labels are not prose). Figures are things a reader looks at instead of reading:
// <figure> (one figure whatever it wraps), and outside any <figure>: <table> and any <svg> whose
// viewBox is wider than a glyph (>= 100 units).
//
// Budget per leaf (the gate):
//   words      <= 900      a leaf is a page, not a paper
//   words/fig  <= 120      every ~120 words earns a picture; under 120 words no figure is owed
//   max <p>    <= 55       no paragraph longer than a breath
//   lede       <= 30       the italic line under the h1
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const BUDGET = { words: 900, perFig: 120, para: 55, lede: 30 };
const EXEMPT = new Set(['view.html']);                 // plumbing, renders documents

const args = process.argv.slice(2);
const check = args.includes('--check');
const only = args.filter(a => a.endsWith('.html')).map(a => basename(a));
const files = readdirSync(SITE).filter(f => f.endsWith('.html') && !EXEMPT.has(f) && (!only.length || only.includes(f))).sort();

const words = s => (s.replace(/&[a-z#0-9]+;/gi, ' ').match(/[A-Za-z0-9][A-Za-z0-9'’\-\.]*/g) || []).length;
// innermost-first so nested elements (an <svg> inside an <svg>, a <table> inside a <figure>) strip whole
const strip = (html, tag) => { const re = new RegExp(`<${tag}(?:\\s[^>]*)?>(?:(?!<${tag}[\\s>])[\\s\\S])*?<\\/${tag}>`, 'gi'); let prev; do { prev = html; html = html.replace(re, ' '); } while (html !== prev); return html; };
const text = html => strip(strip(strip(html.replace(/<!--[\s\S]*?-->/g, ' '), 'script'), 'style'), 'svg').replace(/<[^>]+>/g, ' ');

export function measure(file) {
  const src = readFileSync(join(SITE, file), 'utf8');
  const body = text(src);
  const w = words(body);
  // a <figure> is one figure whatever it wraps; tables and wide svgs count only outside a <figure>
  const loose = strip(src, 'figure');
  const figs = (src.match(/<figure[\s>]/gi) || []).length + (loose.match(/<table[\s>]/gi) || []).length
    + (loose.match(/<svg[^>]*viewBox="[^"]*"/gi) || []).filter(s => { const m = s.match(/viewBox="[^"]*?\s([\d.]+)\s[\d.]+"/); return m && +m[1] >= 100; }).length;
  const paras = [...src.matchAll(/<p[\s>][\s\S]*?<\/p>/gi)].map(m => words(text(m[0])));
  const lede = src.match(/class="lede"[^>]*>([\s\S]*?)<\/p>/i);
  return { file, words: w, figs, perFig: figs ? Math.round(w / figs) : Infinity, maxPara: Math.max(0, ...paras), lede: lede ? words(text(lede[1])) : 0 };
}

const rows = files.map(measure);
// a leaf with less than one figure's worth of words (an interactive surface, a board) owes no figure
const over = r => [r.words > BUDGET.words && 'words', r.words > BUDGET.perFig && r.perFig > BUDGET.perFig && 'w/fig', r.maxPara > BUDGET.para && 'para', r.lede > BUDGET.lede && 'lede'].filter(Boolean);
const pad = (s, n) => String(s).padStart(n);
console.log(`${'leaf'.padEnd(22)}${pad('words', 7)}${pad('figs', 6)}${pad('w/fig', 7)}${pad('maxP', 6)}${pad('lede', 6)}  over`);
for (const r of rows) console.log(`${r.file.padEnd(22)}${pad(r.words, 7)}${pad(r.figs, 6)}${pad(r.perFig === Infinity ? '∞' : r.perFig, 7)}${pad(r.maxPara, 6)}${pad(r.lede, 6)}  ${over(r).join(',')}`);
const tot = rows.reduce((a, r) => a + r.words, 0), tf = rows.reduce((a, r) => a + r.figs, 0);
console.log(`${'total'.padEnd(22)}${pad(tot, 7)}${pad(tf, 6)}${pad(tf ? Math.round(tot / tf) : '∞', 7)}   budget: words<=${BUDGET.words} w/fig<=${BUDGET.perFig} p<=${BUDGET.para} lede<=${BUDGET.lede}`);
const failing = rows.filter(r => over(r).length);
if (check && failing.length) { console.error(`FAIL: ${failing.length} leaf(s) over the tersity budget: ${failing.map(r => r.file).join(', ')}`); process.exit(1); }
