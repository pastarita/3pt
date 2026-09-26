#!/usr/bin/env node
/* 3PT · README banner generator → docs/assets/banner.svg
   Direction D2 "Instrument panel", dark set, depth variant (hub/site/design-system.html COLOR.D2.dark).
   The mark is the tetrahedron the Setup leaf projects with sdf-depth.js: three points on the base
   (plan, build, instrument) and the batteries core (cyan) as the apex; every edge a tool grant. Here it is
   drawn in 3D, orthographic, tilted down and to the left, shaded the way the SDF shader shades: a soft
   plateau on each face, a rim light on the edges, contour rings marking distance outside, a glow at each
   point. The loop runs around the base; the backfeed arrow closes it. Three inspector panes sit under it:
   the surfaces (PWA, web, macOS) that read harness state. No web fonts, no scripts, no external refs.
   Run: node scripts/banner.mjs   (idempotent; the SVG is the artifact of record, this file is how it is made) */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const W = 1600, H = 520;
const T = { canvas:'#0F1216', surface:'#151A21', raised:'#1A2029', ink:'#E6E9EE', muted:'#A3ADBB', faint:'#7B8694',
  line:'#2A323D', lineStrong:'#5E6C85', accent:'#FF6B4A', onAccent:'#14100E',
  plan:'#8B7CF6', build:'#E0A33A', instrument:'#3FB886', core:'#3AA6D9' };

/* ---------- 3D: a regular tetrahedron, base in the y=0 plane, apex up ---------- */
const r = 1, h = 0.62 * r;            // the core sits lower than a regular tetrahedron's apex
const P3 = {
  A: [0, 0, -r],                    // plan, back
  B: [ 0.866*r, 0, 0.5*r],          // build, front right
  C: [-0.866*r, 0, 0.5*r],          // instrument, front left
  O: [0, h, 0],                     // core, apex
};
const deg = d => d*Math.PI/180;
const AZ = deg(-34), EL = deg(27), ROLL = deg(6);   // plan at the top of the loop, build front right, instrument front left   // build toward the viewer, plan back right, instrument back left   // turned, looked down on, and rolled to the left   // azimuth: turned so the base recedes down-left; elevation: looking down onto it
function rot([x,y,z]){
  // Ry(az)
  let x1 = x*Math.cos(AZ) + z*Math.sin(AZ), z1 = -x*Math.sin(AZ) + z*Math.cos(AZ), y1 = y;
  // Rx(el): tilt the top toward the viewer
  let y2 = y1*Math.cos(EL) - z1*Math.sin(EL), z2 = y1*Math.sin(EL) + z1*Math.cos(EL);
  // roll about the view axis: the whole solid leans down to the left
  let x3 = x1*Math.cos(ROLL) - y2*Math.sin(ROLL), y3 = x1*Math.sin(ROLL) + y2*Math.cos(ROLL);
  return [x3, y3, z2];
}
const CX = 1350, CY = 292, S = 150;  // screen centre and scale of the mark
const proj = p => { const [x,y,z] = rot(p); return { x: CX + x*S, y: CY - y*S + 24, z }; };
const V = Object.fromEntries(Object.entries(P3).map(([k,p]) => [k, proj(p)]));
const VIEW = rot([0,0,1]); // not used directly; visibility comes from the projected winding
const light = (() => { const L=[-0.55, 0.65, 0.75]; const n=Math.hypot(...L); return L.map(v=>v/n); })();
const sub=(a,b)=>a.map((v,i)=>v-b[i]), cross=(a,b)=>[a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const norm=v=>{const n=Math.hypot(...v);return v.map(x=>x/n)}, dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);

const FACES = [
  { k:'OAB', v:['O','A','B'], hue:[T.core, T.plan, T.build] },
  { k:'OBC', v:['O','B','C'], hue:[T.core, T.build, T.instrument] },
  { k:'OCA', v:['O','C','A'], hue:[T.core, T.instrument, T.plan] },
  { k:'ABC', v:['A','C','B'], hue:[T.plan, T.instrument, T.build] },
];
const SOLID = [0, h/4, 0];
for (const f of FACES){
  const p = f.v.map(k => P3[k]);
  let n = norm(cross(sub(p[1],p[0]), sub(p[2],p[0])));
  const fc = [0,1,2].map(i => (p[0][i]+p[1][i]+p[2][i])/3);
  if (dot(n, sub(fc, SOLID)) < 0) n = n.map(v => -v);   // outward
  const nr = rot(n);
  f.visible = nr[2] > 0;                    // the viewer sits on +z after the rotation
  f.lambert = Math.max(0, dot(nr, light));
}
const visible = FACES.filter(f => f.visible);

/* ---------- helpers ---------- */
const fmt = n => (Math.round(n*10)/10).toString();
const pt = k => `${fmt(V[k].x)},${fmt(V[k].y)}`;
const poly = ks => ks.map(pt).join(' ');
const mix = (a,b,t) => { const c=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)); const A=c(a),B=c(b);
  return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join(''); };
const centroid = ks => ({ x: ks.reduce((s,k)=>s+V[k].x,0)/ks.length, y: ks.reduce((s,k)=>s+V[k].y,0)/ks.length });

/* silhouette: convex hull of the four projected points */
function hull(pts){ pts=[...pts].sort((a,b)=>a.x-b.x||a.y-b.y); const cr=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);
  const lo=[]; for(const p of pts){ while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0) lo.pop(); lo.push(p);}
  const up=[]; for(const p of pts.slice().reverse()){ while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0) up.pop(); up.push(p);}
  return lo.slice(0,-1).concat(up.slice(0,-1)); }
const HULL = hull(Object.values(V));
const HC = { x: HULL.reduce((s,p)=>s+p.x,0)/HULL.length, y: HULL.reduce((s,p)=>s+p.y,0)/HULL.length };
const ring = k => HULL.map(p => `${fmt(HC.x+(p.x-HC.x)*k)},${fmt(HC.y+(p.y-HC.y)*k)}`).join(' ');

/* the loop: an ellipse in the base plane around the three points, projected */
function loopPath(rad, n=72){ const pts=[]; for(let i=0;i<=n;i++){ const a=i/n*Math.PI*2; pts.push(proj([rad*Math.sin(a),0,-rad*Math.cos(a)])); }
  return pts.map((p,i)=>`${i?'L':'M'}${fmt(p.x)} ${fmt(p.y)}`).join(''); }
const loopPt = (rad,a) => proj([rad*Math.sin(a),0,-rad*Math.cos(a)]);

/* ---------- faces ---------- */
let defs = '', faces = '';
for (const f of FACES.filter(f => !f.visible)){ const base = mix(mix(f.hue[1], f.hue[2], .5), f.hue[0], .35);
  faces += `    <polygon points="${poly(f.v)}" fill="${base}" fill-opacity=".10"/>\n`; }
for (const f of visible){
  const c = centroid(f.v);
  const base = mix(mix(f.hue[1], f.hue[2], .5), f.hue[0], .35);
  const lum = 0.62 + 0.38*f.lambert;   // ambient floor: the unlit face still reads as a face
  const inner = mix('#0F1216', base, 0.48*lum), edge = mix('#0F1216', base, 0.92*lum+0.08);
  // a soft plateau: darker in the middle, lit toward the edges (the SDF's rim), keyed to the face's own hue
  defs += `<radialGradient id="f-${f.k}" gradientUnits="userSpaceOnUse" cx="${fmt(c.x)}" cy="${fmt(c.y)}" r="${fmt(S*1.05)}">
      <stop offset="0" stop-color="${inner}"/><stop offset=".72" stop-color="${mix(inner,edge,.5)}"/><stop offset="1" stop-color="${edge}"/></radialGradient>\n`;
  faces += `    <polygon points="${poly(f.v)}" fill="url(#f-${f.k})" fill-opacity=".58"/>\n`;
  if (f.lambert > 0.5){ const o = V['O']; defs += `<radialGradient id="s-${f.k}" gradientUnits="userSpaceOnUse" cx="${fmt(o.x*0.4+c.x*0.6)}" cy="${fmt(o.y*0.4+c.y*0.6)}" r="${fmt(S*0.8)}"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".22"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>\n`;
    faces += `    <polygon points="${poly(f.v)}" fill="url(#s-${f.k})"/>\n`; }
  // hue wash from each vertex, the "nearest point takes the hue" rule
  for (let i=0;i<3;i++){ const k=f.v[i]; defs += `<radialGradient id="w-${f.k}-${k}" gradientUnits="userSpaceOnUse" cx="${fmt(V[k].x)}" cy="${fmt(V[k].y)}" r="${fmt(S*1.25)}">
      <stop offset="0" stop-color="${f.hue[i]}" stop-opacity="${(0.30*lum).toFixed(2)}"/><stop offset="1" stop-color="${f.hue[i]}" stop-opacity="0"/></radialGradient>\n`;
    faces += `    <polygon points="${poly(f.v)}" fill="url(#w-${f.k}-${k})"/>\n`; }
}
/* edges: silhouette edges bright, interior edges dimmer; hidden edges as a faint dashed ghost */
const EDGES = [['O','A'],['O','B'],['O','C'],['A','B'],['B','C'],['C','A']];
const edgeVisible = e => visible.some(f => f.v.includes(e[0]) && f.v.includes(e[1]));
let edges = '';
for (const e of EDGES){
  if (edgeVisible(e)) edges += `    <line x1="${fmt(V[e[0]].x)}" y1="${fmt(V[e[0]].y)}" x2="${fmt(V[e[1]].x)}" y2="${fmt(V[e[1]].y)}" stroke="${T.ink}" stroke-opacity=".55" stroke-width="1.4"/>\n`;
  else edges += `    <line x1="${fmt(V[e[0]].x)}" y1="${fmt(V[e[0]].y)}" x2="${fmt(V[e[1]].x)}" y2="${fmt(V[e[1]].y)}" stroke="${T.ink}" stroke-opacity=".30" stroke-width="1.1" stroke-dasharray="3 5"/>\n`;
}
/* rim: the silhouette, lit */
const rim = `    <polygon points="${HULL.map(p=>`${fmt(p.x)},${fmt(p.y)}`).join(' ')}" fill="none" stroke="${T.ink}" stroke-opacity=".28" stroke-width="2.2" filter="url(#soft)"/>\n`;

/* vertices */
const LABEL = { A:['PLAN',T.plan], B:['BUILD',T.build], C:['INSTRUMENT',T.instrument], O:['CORE · BATTERIES',T.core] };
let verts = '';
const hexPts = (cx,cy,rr) => [0,1,2,3,4,5].map(i => { const a = Math.PI/6 + i*Math.PI/3; return `${fmt(cx+rr*Math.cos(a))},${fmt(cy+rr*Math.sin(a))}`; }).join(' ');
for (const k of ['A','B','C']){
  const [name, hue] = LABEL[k], v = V[k], big = false;
  verts += `    <circle cx="${fmt(v.x)}" cy="${fmt(v.y)}" r="${big?30:22}" fill="${hue}" fill-opacity=".22" filter="url(#glow)"/>
    <circle cx="${fmt(v.x)}" cy="${fmt(v.y)}" r="${big?11:8.5}" fill="${hue}"/>
    <circle cx="${fmt(v.x)}" cy="${fmt(v.y)}" r="${big?4.2:3}" fill="#FFFFFF" fill-opacity=".8"/>\n`;
}
{ const v = V.O, hue = T.core;
  verts += `    <circle cx="${fmt(v.x)}" cy="${fmt(v.y)}" r="34" fill="${hue}" fill-opacity=".26" filter="url(#glow)"/>
    <polygon points="${hexPts(v.x, v.y, 17)}" fill="${T.canvas}" fill-opacity=".9" stroke="${hue}" stroke-width="2"/>
    <polygon points="${hexPts(v.x, v.y, 10)}" fill="${hue}" fill-opacity=".35" stroke="${hue}" stroke-width="1"/>
    <rect x="${fmt(v.x-3.5)}" y="${fmt(v.y-5)}" width="7" height="10" rx="1.5" fill="#FFFFFF" fill-opacity=".9"/><rect x="${fmt(v.x-1.5)}" y="${fmt(v.y-7)}" width="3" height="2" rx=".5" fill="#FFFFFF" fill-opacity=".9"/>\n`; }
const labelAt = (k, dx, dy, anchor) => { const [name,hue]=LABEL[k]; return `    <text class="mono vtx" x="${fmt(V[k].x+dx)}" y="${fmt(V[k].y+dy)}" text-anchor="${anchor}" fill="${hue}">${name}</text>\n`; };
const labels = labelAt('O', -32, 6, 'end') + labelAt('A', 0, -34, 'middle') + labelAt('B', 22, 6, 'start') + labelAt('C', 0, 36, 'middle');

/* the loop around the base, and the backfeed arrow that closes it */
const LR = 1.24;
const loop = `    <path d="${loopPath(LR)}" fill="none" stroke="${T.accent}" stroke-opacity=".55" stroke-width="1.6" stroke-dasharray="5 6"/>\n`;
const arrowAt = (a) => { const p=loopPt(LR,a), q=loopPt(LR,a+0.06); const ang=Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI;
  return `    <path d="M0 0 L-15 -7.5 L-11 0 L-15 7.5 Z" fill="${T.accent}" transform="translate(${fmt(q.x)} ${fmt(q.y)}) rotate(${fmt(ang)})"/>\n`; };
const arrows = arrowAt(deg(60)) + arrowAt(deg(180)) + arrowAt(deg(300));   // plan → build → instrument → plan

/* contour rings outside the silhouette (distance) and the ground under it */
let contours = '';
for (let i=1;i<=5;i++) contours += `    <polygon points="${ring(1+0.14*i)}" fill="none" stroke="${T.ink}" stroke-opacity="${(0.13-0.02*i).toFixed(3)}" stroke-width="1" stroke-linejoin="round"/>\n`;
const ground = (() => { const g = proj([0,0,0]); const gx = g.x, gy = V.B.y + 28;
  return `    <ellipse cx="${fmt(gx)}" cy="${fmt(gy)}" rx="${fmt(S*1.9)}" ry="${fmt(S*0.42)}" fill="url(#ground)" filter="url(#soft)"/>\n`; })();

/* the surfaces: three windows, each its own kind, spread around the solid. macOS and web sit behind it, the PWA phone in front. */
const rows = (x, y, list, op=0.2) => list.map(([w,i]) => `<rect x="${x}" y="${y+i*12}" width="${w}" height="5" rx="2.5" fill="${T.ink}" fill-opacity="${op}"/>`).join('');
const chip = (x, y) => `<rect x="${x}" y="${y}" width="50" height="12" rx="6" fill="none" stroke="${T.instrument}" stroke-opacity=".9"/><text class="mono chipxs" x="${x+25}" y="${y+9}" text-anchor="middle" fill="${T.instrument}">DERIVED</text>`;
function macWindow(x, y, w, h){ return `    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="${T.raised}" fill-opacity=".9" stroke="${T.lineStrong}" stroke-opacity=".7"/>
      <path d="M${x} ${y+24}h${w}" stroke="${T.line}"/>
      <circle cx="${x+13}" cy="${y+12}" r="3.4" fill="#FF5F57"/><circle cx="${x+24}" cy="${y+12}" r="3.4" fill="#FEBC2E"/><circle cx="${x+35}" cy="${y+12}" r="3.4" fill="#28C840"/>
      <text class="mono pane" x="${x+w/2+8}" y="${y+16}" text-anchor="middle" fill="${T.muted}">3PT.app</text>
      <rect x="${x}" y="${y+24}" width="42" height="${h-24}" fill="${T.surface}" fill-opacity=".8"/><path d="M${x+42} ${y+24}v${h-24}" stroke="${T.line}"/>
      ${rows(x+9, y+36, [[24,0],[18,1],[22,2],[16,3]], 0.28)}
      ${rows(x+52, y+36, [[70,0],[52,1],[64,2]])}
      ${chip(x+52, y+h-20)}
      <text class="mono pane" x="${x+w-10}" y="${y+h-10}" text-anchor="end" fill="${T.core}">MACOS</text>
    </g>\n`; }
function webWindow(x, y, w, h){ return `    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${T.raised}" fill-opacity=".9" stroke="${T.lineStrong}" stroke-opacity=".7"/>
      <path d="M${x} ${y+30}h${w}" stroke="${T.line}"/>
      <rect x="${x+8}" y="${y+6}" width="46" height="18" rx="5" fill="${T.surface}"/><rect x="${x+58}" y="${y+6}" width="30" height="18" rx="5" fill="${T.surface}" fill-opacity=".5"/>
      <rect x="${x+8}" y="${y+h-14}" width="0" height="0"/>
      <rect x="${x+10}" y="${y+38}" width="${w-20}" height="14" rx="7" fill="${T.surface}" stroke="${T.line}"/><text class="mono chipxs" x="${x+18}" y="${y+48}" fill="${T.faint}">3pt.pages.dev/app</text>
      ${rows(x+10, y+62, [[76,0],[58,1]])}
      ${chip(x+10, y+h-20)}
      <text class="mono pane" x="${x+w-10}" y="${y+h-10}" text-anchor="end" fill="${T.plan}">WEB</text>
    </g>\n`; }
function phone(x, y, w, h){ return `    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${T.raised}" fill-opacity=".96" stroke="${T.lineStrong}" stroke-opacity=".85"/>
      <rect x="${x+w/2-11}" y="${y+6}" width="22" height="5" rx="2.5" fill="${T.canvas}"/>
      <rect x="${x+8}" y="${y+20}" width="${w-16}" height="30" rx="6" fill="${T.build}" fill-opacity=".18" stroke="${T.build}" stroke-opacity=".7"/>
      <text class="mono pane" x="${x+w/2}" y="${y+39}" text-anchor="middle" fill="${T.build}">PWA</text>
      ${rows(x+12, y+58, [[w-24,0],[w-34,1],[w-28,2],[w-40,3]])}
      ${chip(x+9, y+h-30)}
      <rect x="${x+w/2-14}" y="${y+h-9}" width="28" height="3" rx="1.5" fill="${T.faint}"/>
    </g>\n`; }
const panesBehind = macWindow(1010, 96, 176, 102) + webWindow(1440, 62, 146, 96);
const panesFront  = phone(1086, 296, 68, 124);
const panes = panesBehind + `    <text class="mono foot" x="1010" y="490" text-anchor="start">SURFACES · MACOS · WEB · PWA</text>\n`;

/* ---------- the page ---------- */
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <!-- Generated by scripts/banner.mjs. Edit that file, not this one. Direction D2 dark, depth variant. -->
  <title id="t">3PT. Takes direction. Plans. Builds. Learns. Rebuilds itself.</title>
  <desc id="d">Three Point Harness: Plan, Build, Instrument around a batteries core, drawn as a tetrahedron. A self-improving meta-harness for coding agents; every checkpoint in MongoDB Atlas; PWA, web and macOS inspectors over its state.</desc>
  <defs>
    <style>
      .sans{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
      .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.14em}
      .eyebrow{fill:${T.faint};font-size:15px;font-weight:500}
      .eyebrow2{fill:${T.muted};font-size:16px;font-weight:500}
      .h{fill:${T.ink};font-size:60px;font-weight:800;letter-spacing:-.015em}
      .h .a{fill:${T.accent}}
      .sub{fill:${T.muted};font-size:21px;font-weight:400}
      .btn{font-size:19px;font-weight:600}
      .chip{font-size:14px;font-weight:600;letter-spacing:.12em}
      .chipxs{font-size:8px;font-weight:600;letter-spacing:.08em}
      .pane{font-size:9px;font-weight:600;letter-spacing:.14em}
      .foot{fill:${T.faint};font-size:12px;font-weight:500}
      .vtx{font-size:12px;font-weight:600;letter-spacing:.12em}
    </style>
    <radialGradient id="gPlan" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${T.plan}" stop-opacity=".34"/><stop offset="1" stop-color="${T.plan}" stop-opacity="0"/></radialGradient>
    <radialGradient id="gBuild" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${T.build}" stop-opacity=".30"/><stop offset="1" stop-color="${T.build}" stop-opacity="0"/></radialGradient>
    <radialGradient id="gInst" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${T.instrument}" stop-opacity=".30"/><stop offset="1" stop-color="${T.instrument}" stop-opacity="0"/></radialGradient>
    <radialGradient id="gCore" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${T.core}" stop-opacity=".38"/><stop offset="1" stop-color="${T.core}" stop-opacity="0"/></radialGradient>
    <radialGradient id="ground" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${T.core}" stop-opacity=".22"/><stop offset=".5" stop-color="${T.build}" stop-opacity=".08"/><stop offset="1" stop-color="${T.canvas}" stop-opacity="0"/></radialGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.canvas}" stop-opacity="1"/><stop offset=".55" stop-color="${T.canvas}" stop-opacity=".6"/><stop offset="1" stop-color="${T.canvas}" stop-opacity="0"/></linearGradient>
    <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
    <clipPath id="frame"><rect width="${W}" height="${H}" rx="12"/></clipPath>
${defs}  </defs>

  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="${T.canvas}"/>

    <!-- the field: a glow at each point of the tetrahedron, the core brightest -->
    <ellipse cx="${fmt(V.O.x)}" cy="${fmt(V.O.y)}" rx="360" ry="250" fill="url(#gCore)"/>
    <ellipse cx="${fmt(V.A.x)}" cy="${fmt(V.A.y)}" rx="300" ry="220" fill="url(#gPlan)"/>
    <ellipse cx="${fmt(V.B.x)}" cy="${fmt(V.B.y)}" rx="320" ry="220" fill="url(#gBuild)"/>
    <ellipse cx="${fmt(V.C.x)}" cy="${fmt(V.C.y)}" rx="320" ry="220" fill="url(#gInst)"/>
${contours}${ground}    <rect width="1100" height="${H}" fill="url(#fade)"/>

    <!-- eyebrows, headline, subline -->
    <text class="mono eyebrow"  x="64" y="72">3PT · THREE POINT HARNESS</text>
    <text class="mono eyebrow2" x="64" y="104">AN ACCESSIBLE AGENT HARNESS FOR MEDIA-HEAVY WORKFLOWS</text>
    <text class="sans h" x="60" y="178">Takes direction. Plans. Builds.</text>
    <text class="sans h" x="60" y="246"><tspan class="a">Learns. Rebuilds itself.</tspan></text>
    <text class="sans sub" x="64" y="296">For teams whose work is photos and plans, not code. It learns from what it built</text>
    <text class="sans sub" x="64" y="326">and from the media it works on; every run, rule and checkpoint lives in MongoDB</text>
    <text class="sans sub" x="64" y="356">Atlas, so each version re-runs over the same corpus and is graded against the last.</text>

    <!-- controls and stage chips -->
    <g transform="translate(64,392)">
      <rect x="0" y="0" width="172" height="52" rx="10" fill="${T.accent}"/>
      <text class="sans btn" x="86" y="33" text-anchor="middle" fill="${T.onAccent}">Approve v3</text>
      <rect x="188" y="0" width="150" height="52" rx="10" fill="${T.surface}" stroke="${T.lineStrong}" stroke-width="1.5"/>
      <text class="sans btn" x="263" y="33" text-anchor="middle" fill="${T.ink}">Roll back</text>
      <rect x="364" y="10" width="86" height="32" rx="99" fill="${T.surface}" stroke="${T.plan}" stroke-width="1.5"/>
      <text class="mono chip" x="407" y="31" text-anchor="middle" fill="${T.plan}">PLAN</text>
      <rect x="462" y="10" width="96" height="32" rx="99" fill="${T.surface}" stroke="${T.build}" stroke-width="1.5"/>
      <text class="mono chip" x="510" y="31" text-anchor="middle" fill="${T.build}">BUILD</text>
      <rect x="570" y="10" width="160" height="32" rx="99" fill="${T.surface}" stroke="${T.instrument}" stroke-width="1.5"/>
      <text class="mono chip" x="650" y="31" text-anchor="middle" fill="${T.instrument}">INSTRUMENT</text>
    </g>

    <!-- the surfaces -->
${panes}
    <!-- the mark: the tetrahedron, the loop around its base, the backfeed arrows -->
${loop}${arrows}${faces}${edges}${rim}${verts}${labels}${panesFront}
    <!-- footer -->
    <text class="mono foot" x="64" y="490">MONGODB × CEREBRAL VALLEY · HARNESS ENGINEERING &amp; MODEL WRANGLING HACKATHON · NYC · 2026-09-26</text>
    <text class="mono foot" x="1536" y="490" text-anchor="end">MIT</text>
    <rect x=".5" y=".5" width="${W-1}" height="${H-1}" rx="12" fill="none" stroke="${T.line}"/>
  </g>
</svg>
`;
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'assets', 'banner.svg');
writeFileSync(out, svg);
console.log(`wrote ${out} · visible faces: ${visible.map(f=>f.k+'('+f.lambert.toFixed(2)+')').join(' ')} · O=${fmt(V.O.x)},${fmt(V.O.y)} A=${pt('A')} B=${pt('B')} C=${pt('C')}`);
