#!/usr/bin/env node
/* 3PT · README lineage figure generator → docs/assets/lineage.svg
   The harness over time, drawn from the whiteboard sketch of 2026-09-26: versions of the harness along one
   axis, the code-and-harness track above (git history, one tag per checkpoint, one sprint mode per iteration,
   a deployment per sprint), one media-and-context corpus below (the same data every version runs over, kept
   in MongoDB Atlas as long-term memory), evals between them grading each version against the previous, and
   the retroactive arc: an older harness re-run over today's corpus. Same tokens as the banner (D2 dark).
   Every figure here is ILLUSTRATIVE (authored shapes, no measured tallies); it wears that chip.
   Run: node scripts/lineage.mjs */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const W = 1600, H = 660;
const T = { canvas:'#0F1216', surface:'#151A21', raised:'#1A2029', ink:'#E6E9EE', muted:'#A3ADBB', faint:'#7B8694',
  line:'#2A323D', lineStrong:'#5E6C85', accent:'#FF6B4A', onAccent:'#14100E',
  plan:'#8B7CF6', build:'#E0A33A', instrument:'#3FB886', core:'#3AA6D9', warn:'#E0A33A' };
const fmt = n => (Math.round(n*10)/10).toString();

/* ---------- a small tetrahedron mark, same projector as the banner ---------- */
const deg = d => d*Math.PI/180;
const AZ = deg(-34), EL = deg(27), ROLL = deg(6);
function rot([x,y,z]){
  let x1 = x*Math.cos(AZ) + z*Math.sin(AZ), z1 = -x*Math.sin(AZ) + z*Math.cos(AZ), y1 = y;
  let y2 = y1*Math.cos(EL) - z1*Math.sin(EL), z2 = y1*Math.sin(EL) + z1*Math.cos(EL);
  let x3 = x1*Math.cos(ROLL) - y2*Math.sin(ROLL), y3 = x1*Math.sin(ROLL) + y2*Math.cos(ROLL);
  return [x3, y3, z2];
}
function mark(cx, cy, s, grow){
  // grow ∈ [0,1]: the core rises and the faces brighten as the harness matures
  const h = 0.45 + 0.35*grow;
  const P = { A:[0,0,-1], B:[0.866,0,0.5], C:[-0.866,0,0.5], O:[0,h,0] };
  const V = {}; for (const k in P){ const [x,y] = rot(P[k]); V[k] = { x: cx + x*s, y: cy - y*s }; }
  const pt = k => `${fmt(V[k].x)},${fmt(V[k].y)}`;
  const face = (ks, hue, op) => `<polygon points="${ks.map(pt).join(' ')}" fill="${hue}" fill-opacity="${op}" stroke="${T.ink}" stroke-opacity=".35" stroke-width="1"/>`;
  const dot = (k, hue, r) => `<circle cx="${fmt(V[k].x)}" cy="${fmt(V[k].y)}" r="${r}" fill="${hue}"/>`;
  return `<g>
      ${face(['O','B','C'], T.instrument, 0.10+0.22*grow)}${face(['O','A','B'], T.build, 0.08+0.14*grow)}
      <line x1="${fmt(V.C.x)}" y1="${fmt(V.C.y)}" x2="${fmt(V.A.x)}" y2="${fmt(V.A.y)}" stroke="${T.ink}" stroke-opacity=".2" stroke-dasharray="2 3"/>
      ${dot('A', T.plan, 3.2)}${dot('B', T.build, 3.2)}${dot('C', T.instrument, 3.2)}
      <circle cx="${fmt(V.O.x)}" cy="${fmt(V.O.y)}" r="${fmt(6+4*grow)}" fill="${T.core}" fill-opacity=".25"/>
      <polygon points="${[0,1,2,3,4,5].map(i=>{const a=Math.PI/6+i*Math.PI/3;return `${fmt(V.O.x+4.6*Math.cos(a))},${fmt(V.O.y+4.6*Math.sin(a))}`}).join(' ')}" fill="${T.canvas}" stroke="${T.core}" stroke-width="1.4"/>
    </g>`;
}

/* ---------- layout ---------- */
const N = 6;
const X = i => 340 + i*206;                 // version columns
const AXIS = 292, COMMIT = 128, CORPUS = { x: 120, y: 446, w: 1360, h: 170 };
const SPRINT = ['FEATURE','IMPROVEMENT','FIX','FEATURE','IMPROVEMENT','FIX'];
const SPRINT_HUE = { FEATURE: T.plan, IMPROVEMENT: T.build, FIX: T.instrument };
const POLICY = ['rules v1', '+ context policy', '+ tool grant', 'rules v2', 'tiering policy', 'grants tightened'];
const EVAL = [[16,20,12],[22,24,18],[22,28,26],[28,32,30],[34,36,36],[40,42,42]];   // authored, illustrative

const chip = (x, y, text, hue, w) => `<rect x="${fmt(x-w/2)}" y="${y-11}" width="${w}" height="22" rx="11" fill="${T.surface}" stroke="${hue}" stroke-width="1.2"/><text class="mono chip" x="${fmt(x)}" y="${y+4}" text-anchor="middle" fill="${hue}">${text}</text>`;

let cols = '';
for (let i=0;i<N;i++){
  const x = X(i), grow = i/(N-1), sp = SPRINT[i], hue = SPRINT_HUE[sp];
  cols += `
    <!-- v${i+1} -->
    <circle cx="${x}" cy="${COMMIT}" r="5" fill="${T.canvas}" stroke="${T.ink}" stroke-width="1.6"/>
    <text class="mono tiny" x="${x}" y="${COMMIT-14}" text-anchor="middle" fill="${T.muted}">cp/${i+1}</text>
    ${chip(x, 172, sp, hue, sp.length*8.2+22)}
    <text class="mono tiny" x="${x}" y="${200}" text-anchor="middle" fill="${T.faint}">${POLICY[i]}</text>
    <line x1="${x}" y1="${COMMIT+6}" x2="${x}" y2="${158}" stroke="${T.lineStrong}" stroke-opacity=".7"/>
    <line x1="${x}" y1="${186}" x2="${x}" y2="${206}" stroke="${T.lineStrong}" stroke-opacity=".4" stroke-dasharray="2 3"/>
    ${mark(x, AXIS-14, 44, grow)}
    <circle cx="${x}" cy="${AXIS}" r="4" fill="${T.accent}"/>
    <text class="mono v" x="${x}" y="${AXIS+22}" text-anchor="middle" fill="${T.ink}">v${i+1}</text>
    <rect x="${x-26}" y="${AXIS+30}" width="52" height="14" rx="7" fill="none" stroke="${T.lineStrong}"/><text class="mono tiny" x="${x}" y="${AXIS+40}" text-anchor="middle" fill="${T.muted}">DEPLOY</text>
    <!-- re-run: the version runs over the corpus; graded: the evals come back -->
    <line x1="${x-34}" y1="${AXIS+50}" x2="${x-34}" y2="${CORPUS.y-8}" stroke="${T.ink}" stroke-opacity=".35" stroke-dasharray="3 4"/>
    <path d="M${x-34} ${CORPUS.y-2} l-4 -8 h8 Z" fill="${T.ink}" fill-opacity=".5"/>
    ${EVAL[i].map((hh,j) => `<rect x="${x-10+j*14}" y="${fmt(CORPUS.y-14-hh)}" width="10" height="${hh}" rx="2" fill="${[T.faint,T.muted,T.instrument][j]}" fill-opacity="${j===2?0.95:0.7}"/>`).join('')}
    <line x1="${x+38}" y1="${CORPUS.y-8}" x2="${x+38}" y2="${AXIS+62}" stroke="${T.instrument}" stroke-opacity=".6" stroke-dasharray="3 4"/>
    <path d="M${x+38} ${AXIS+56} l-4 8 h8 Z" fill="${T.instrument}" fill-opacity=".8"/>`;
}

/* the corpus: image tiles and the collections that hold what every version learned about them */
let tiles = '';
const hues = [T.build, T.instrument, T.plan, T.core, T.muted];
for (let i=0;i<22;i++){ const tx = CORPUS.x+18+i*61, ty = CORPUS.y+30; const hh = hues[(i*7)%5];
  tiles += `<rect x="${tx}" y="${ty}" width="48" height="36" rx="4" fill="${hh}" fill-opacity=".18" stroke="${hh}" stroke-opacity=".35"/><path d="M${tx+8} ${ty+26} l10 -11 7 7 6 -5 9 9" fill="none" stroke="${hh}" stroke-opacity=".7" stroke-width="1.2"/>`; }
const COLL = ['media_index','transcripts','plans','findings','measurements','checkpoints','policies'];
let colls = ''; { let cx = CORPUS.x+18; for (const c of COLL){ const w = c.length*7.4+18; colls += `<rect x="${cx}" y="${CORPUS.y+78}" width="${w}" height="20" rx="4" fill="${T.raised}" stroke="${T.line}"/><text class="mono tiny" x="${cx+w/2}" y="${CORPUS.y+92}" text-anchor="middle" fill="${T.core}">${c}</text>`; cx += w+10; } }

/* the retroactive arc: v2's harness, re-run over today's corpus, graded on the same evals */
const xa = X(4), xb = X(1);
const arc = `<path d="M${xa} ${CORPUS.y+4} Q ${(xa+xb)/2} ${CORPUS.y+262} ${xb} ${CORPUS.y+4}" fill="none" stroke="${T.accent}" stroke-width="1.6" stroke-dasharray="5 6" stroke-opacity=".85"/>
    <path d="M${xb} ${CORPUS.y+6} l-6 10 h12 Z" fill="${T.accent}"/>
    <rect x="${(xa+xb)/2-190}" y="${CORPUS.y+120}" width="380" height="24" rx="12" fill="${T.canvas}" stroke="${T.accent}" stroke-opacity=".8"/>
    <text class="mono chip" x="${(xa+xb)/2}" y="${CORPUS.y+136}" text-anchor="middle" fill="${T.accent}">RETROACTIVE · v2 RE-RUN OVER TODAY'S CORPUS</text>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <!-- Generated by scripts/lineage.mjs. Edit that file, not this one. Direction D2 dark. Illustrative: no measured tallies. -->
  <title id="t">The harness over time: six versions, one corpus, every version re-runnable and graded against the last.</title>
  <desc id="d">A timeline of harness versions v1 to v6. Above: the code and harness track, one checkpoint tag, one sprint mode and one deployment per version. Below: one media and context corpus in MongoDB Atlas. Between: each version re-runs over the corpus and is graded by evals against the previous version. A coral arc shows v2 re-run over today's corpus.</desc>
  <defs>
    <style>
      .sans{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
      .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.12em}
      .eyebrow{fill:${T.faint};font-size:14px;font-weight:500}
      .h{fill:${T.ink};font-size:30px;font-weight:800;letter-spacing:-.01em}
      .h .a{fill:${T.accent}}
      .band{fill:${T.muted};font-size:13px;font-weight:600}
      .chip{font-size:11px;font-weight:600}
      .tiny{font-size:10px;font-weight:500;letter-spacing:.08em}
      .v{font-size:13px;font-weight:700}
      .foot{fill:${T.faint};font-size:12px;font-weight:500}
    </style>
    <linearGradient id="axis" gradientUnits="userSpaceOnUse" x1="80" y1="0" x2="1500" y2="0"><stop offset="0" stop-color="${T.lineStrong}"/><stop offset="1" stop-color="${T.accent}"/></linearGradient>
    <radialGradient id="corpusGlow" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="${T.core}" stop-opacity=".10"/><stop offset="1" stop-color="${T.core}" stop-opacity="0"/></radialGradient>
    <clipPath id="frame"><rect width="${W}" height="${H}" rx="12"/></clipPath>
  </defs>
  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="${T.canvas}"/>
    <rect x="${CORPUS.x-80}" y="${CORPUS.y-60}" width="${CORPUS.w+160}" height="${CORPUS.h+120}" fill="url(#corpusGlow)"/>

    <text class="mono eyebrow" x="64" y="48">3PT · LINEAGE · THE HARNESS OVER TIME</text>
    <text class="sans h" x="62" y="86">Same corpus. <tspan class="a">Every version re-runnable.</tspan> Each one graded against the last.</text>
    <rect x="1416" y="30" width="120" height="22" rx="11" fill="none" stroke="${T.warn}"/><text class="mono chip" x="1476" y="45" text-anchor="middle" fill="${T.warn}">ILLUSTRATIVE</text>

    <!-- code + harness track -->
    <text class="mono band" x="64" y="${COMMIT+4}">CODE + HARNESS</text>
    <text class="mono tiny" x="64" y="${COMMIT+20}" fill="${T.faint}">git history · tag cp/&lt;i&gt;</text>
    <text class="mono tiny" x="64" y="${COMMIT+33}" fill="${T.faint}">one sprint mode per iteration</text>
    <line x1="${X(0)-30}" y1="${COMMIT}" x2="${X(N-1)+40}" y2="${COMMIT}" stroke="${T.lineStrong}" stroke-width="1.5"/>

    <!-- the axis of versions -->
    <line x1="80" y1="${AXIS}" x2="1500" y2="${AXIS}" stroke="url(#axis)" stroke-width="2"/>
    <path d="M1500 ${AXIS} l-12 -6 v12 Z" fill="${T.accent}"/>
    <text class="mono tiny" x="1520" y="${AXIS+4}" fill="${T.accent}">SPRINTS →</text>
    <text class="mono band" x="64" y="${AXIS-52}" fill="${T.muted}">HARNESS</text>
    <text class="mono tiny" x="64" y="${AXIS-36}" fill="${T.faint}">the tetrahedron, one per version</text>
    <text class="mono tiny" x="64" y="${AXIS+40}" fill="${T.faint}">sprint-wise deployments</text>

    <!-- evals -->
    <text class="mono band" x="64" y="${CORPUS.y-50}">EVALS</text>
    <text class="mono tiny" x="64" y="${CORPUS.y-36}" fill="${T.faint}">M-1 tokens · M-2 cost</text>
    <text class="mono tiny" x="64" y="${CORPUS.y-23}" fill="${T.faint}">M-4 standards pass</text>
    <text class="mono tiny" x="64" y="${CORPUS.y-10}" fill="${T.faint}">vs the previous version</text>
${cols}

    <!-- media + context: one corpus, long-term memory in Atlas -->
    <rect x="${CORPUS.x}" y="${CORPUS.y}" width="${CORPUS.w}" height="${CORPUS.h}" rx="12" fill="${T.surface}" stroke="${T.lineStrong}" stroke-opacity=".8"/>
    <text class="mono band" x="${CORPUS.x+18}" y="${CORPUS.y+20}" fill="${T.core}">MEDIA + CONTEXT · ONE CORPUS · LONG-TERM MEMORY IN MONGODB ATLAS</text>
    ${tiles}
    ${colls}
    ${arc}

    <text class="mono foot" x="64" y="${H-22}">EACH VERSION WRITES WHAT IT LEARNED BACK INTO THE CORPUS; THE NEXT ONE PLANS FROM IT. DOCS/07 · M-* METRICS, H-1, H-6.</text>
    <rect x=".5" y=".5" width="${W-1}" height="${H-1}" rx="12" fill="none" stroke="${T.line}"/>
  </g>
</svg>
`;
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'assets', 'lineage.svg');
writeFileSync(out, svg);
console.log(`wrote ${out}`);
