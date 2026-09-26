// Run: node ui/apps/live/landing/hero-bim.mjs ui/apps/live/landing/hero-bim.svg
// Generates a BIM-style isometric wireframe for the landing hero.
import { writeFileSync } from 'node:fs';
const W = 1600, H = 1000, S = 36, ox = 1110, oy = 470;
const c = Math.cos(Math.PI / 6), s = Math.sin(Math.PI / 6);
const P = (x, y, z) => [ox + (x - y) * c * S, oy + (x + y) * s * S - z * S];
const pt = p => p.map(v => v.toFixed(1)).join(',');
const line = (a, b, cls) => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" class="${cls}"/>`;
const poly = (ps, cls) => `<polygon points="${ps.map(pt).join(' ')}" class="${cls}"/>`;
const NX = 6, NY = 4, BX = 2.2, BY = 2.2, FH = 1.25, BUILT = 4, LEVELS = 8;
const out = [];
// slabs
for (let l = 0; l <= LEVELS; l++) {
  const z = l * FH, planned = l > BUILT;
  const corners = [P(0,0,z), P(NX*BX,0,z), P(NX*BX,NY*BY,z), P(0,NY*BY,z)];
  out.push(poly(corners, planned ? 'slab plan' : l === 3 ? 'slab hot' : 'slab'));
  for (let i = 0; i <= NX; i++) out.push(line(P(i*BX,0,z), P(i*BX,NY*BY,z), planned ? 'beam plan' : 'beam'));
  for (let j = 0; j <= NY; j++) out.push(line(P(0,j*BY,z), P(NX*BX,j*BY,z), planned ? 'beam plan' : 'beam'));
}
// columns
for (let i = 0; i <= NX; i++) for (let j = 0; j <= NY; j++) {
  out.push(line(P(i*BX,j*BY,0), P(i*BX,j*BY,BUILT*FH), 'col'));
  out.push(line(P(i*BX,j*BY,BUILT*FH), P(i*BX,j*BY,LEVELS*FH), 'col plan'));
}
// MEP runs on level 2 (just under slab 3)
const zp = 3*FH - 0.25, zd = 3*FH - 0.45;
out.push(`<polyline points="${[P(0.4,1.1,zp),P(NX*BX-0.4,1.1,zp),P(NX*BX-0.4,NY*BY-0.5,zp)].map(pt).join(' ')}" class="pipe"/>`);
out.push(`<polyline points="${[P(0.4,3.3,zd),P(NX*BX-1.5,3.3,zd),P(NX*BX-1.5,NY*BY-0.5,zd)].map(pt).join(' ')}" class="duct"/>`);
out.push(`<polyline points="${[P(1.2,NY*BY-0.3,zp+0.1),P(NX*BX-0.3,NY*BY-0.3,zp+0.1)].map(pt).join(' ')}" class="elec"/>`);
// highlighted unit on level 2 (bay i=2..3, j=0..1)
const u0 = 2*FH, u1 = 3*FH, ax = 2*BX, bx = 4*BX, ay = 0, by = 2*BY;
const box = [[ax,ay],[bx,ay],[bx,by],[ax,by]];
out.push(poly(box.map(([x,y]) => P(x,y,u0)), 'unit'));
out.push(poly([P(ax,by,u0),P(bx,by,u0),P(bx,by,u1),P(ax,by,u1)], 'unit'));
out.push(poly([P(bx,ay,u0),P(bx,by,u0),P(bx,by,u1),P(bx,ay,u1)], 'unit'));
for (const [x,y] of box) out.push(line(P(x,y,u0), P(x,y,u1), 'unitedge'));
// photo pins: each a dot with a leader and a label
const pins = [
  [3*BX, BY, u0+0.2, 'UNIT 206 · PLUMBING · OPEN WALL', 1, 40, -175],
  [5*BX, 3*BY, FH+0.2, 'L1 · ELECTRICAL · ROUGH-IN', 0, 60, 70],
  [1*BX, 2*BY, 4*FH+0.2, 'L4 · FRAMING · CLOSED', 0, 70, -90],
  [4.5*BX, 0.5*BY, 5*FH, 'L5 · PLANNED', 2, 50, -150],
];
pins.forEach(([x,y,z,t,k,dx,dy]) => {
  const p = P(x,y,z), q = [p[0] + dx, p[1] + dy];
  out.push(line(p, q, 'lead'));
  out.push(`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${k===1?9:6}" class="pin${k===1?' hotpin':k===2?' planpin':''}"/>`);
  out.push(`<text x="${(q[0]+8).toFixed(1)}" y="${(q[1]+4).toFixed(1)}" class="tag${k===1?' hottag':''}">${t}</text>`);
});
// grid axis labels
for (let i = 0; i <= NX; i++) { const p = P(i*BX, -0.9, 0); out.push(`<text x="${p[0].toFixed(1)}" y="${p[1].toFixed(1)}" class="axis">${String.fromCharCode(65+i)}</text>`); }
for (let j = 0; j <= NY; j++) { const p = P(-0.9, j*BY, 0); out.push(`<text x="${p[0].toFixed(1)}" y="${p[1].toFixed(1)}" class="axis">${j+1}</text>`); }

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
<defs>
<pattern id="g" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#1c2a3a" stroke-width="1"/></pattern>
<pattern id="G" width="120" height="120" patternUnits="userSpaceOnUse"><rect width="120" height="120" fill="url(#g)"/><path d="M120 0H0V120" fill="none" stroke="#223549" stroke-width="1.2"/></pattern>
<radialGradient id="glow" cx="64%" cy="46%" r="55%"><stop offset="0" stop-color="#16324a" stop-opacity=".9"/><stop offset="1" stop-color="#0f1216" stop-opacity="0"/></radialGradient>
</defs>
<style>
.slab{fill:rgba(58,166,217,.05);stroke:#3aa6d9;stroke-width:1.4}
.slab.hot{fill:rgba(255,107,74,.08);stroke:#ff6b4a;stroke-width:1.8}
.slab.plan{fill:none;stroke:#3aa6d9;stroke-opacity:.35;stroke-dasharray:5 6}
.beam{stroke:#3aa6d9;stroke-opacity:.45;stroke-width:1}
.beam.plan{stroke-opacity:.14;stroke-dasharray:4 6}
.col{stroke:#8fd3f4;stroke-width:1.6;stroke-opacity:.8}
.col.plan{stroke:#3aa6d9;stroke-opacity:.25;stroke-dasharray:4 6;stroke-width:1}
.pipe{fill:none;stroke:#3fb886;stroke-width:3;stroke-linejoin:round}
.duct{fill:none;stroke:#e0a33a;stroke-width:5;stroke-linejoin:round;stroke-opacity:.85}
.elec{fill:none;stroke:#8b7cf6;stroke-width:2.2;stroke-dasharray:10 4}
.unit{fill:rgba(255,107,74,.22);stroke:#ff6b4a;stroke-width:1.6}
.unitedge{stroke:#ff6b4a;stroke-width:2}
.lead{stroke:#e6e9ee;stroke-opacity:.55;stroke-width:1}
.pin{fill:#0f1216;stroke:#e6e9ee;stroke-width:2}
.hotpin{fill:#ff6b4a;stroke:#fff}
.planpin{stroke:#3aa6d9;stroke-dasharray:3 3}
.tag{font:600 13px ui-monospace,Menlo,monospace;fill:#cfd6df;letter-spacing:.06em}
.hottag{fill:#ff6b4a;font-weight:700}
.axis,.lvl{font:600 13px ui-monospace,Menlo,monospace;fill:#5f7a93;text-anchor:middle}
</style>
<rect width="${W}" height="${H}" fill="#0c1117"/>
<rect width="${W}" height="${H}" fill="url(#G)"/>
<rect width="${W}" height="${H}" fill="url(#glow)"/>
${out.join('\n')}
</svg>`;
writeFileSync(process.argv[2], svg);
