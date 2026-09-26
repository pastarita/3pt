#!/usr/bin/env node
/* 3PT · README loop infographic → docs/assets/loop.svg
   What one iteration does: direction comes in; Plan, Build, Instrument run under a frozen policy against a store
   that refuses policy and checkpoint writes; the improver, after the run, reads findings and rewrites the policy,
   tags a checkpoint, and feeds Plan; everything lands in MongoDB Atlas; rollback restores a prior policy from its
   checkpoint. The media workload enters from below through the worker's jobs. Same tokens as the banner (D2 dark).
   Source of the wiring: harness/apps/cli/src/index.ts, harness/packages/{core,improver}, docs/10-architecture.md §4.7.
   Run: node scripts/loop.mjs */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const W = 1600, H = 600;
const T = { canvas:'#0F1216', surface:'#151A21', raised:'#1A2029', ink:'#E6E9EE', muted:'#A3ADBB', faint:'#7B8694',
  line:'#2A323D', lineStrong:'#5E6C85', accent:'#FF6B4A', onAccent:'#14100E',
  plan:'#8B7CF6', build:'#E0A33A', instrument:'#3FB886', core:'#3AA6D9', warn:'#E0A33A', mongo:'#00ED64' };

const card = (x, y, w, h, hue, eyebrow, title, lines, extra='') => `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${T.raised}" stroke="${hue}" stroke-opacity=".9" stroke-width="1.4"/>
      <rect x="${x}" y="${y}" width="${w}" height="4" rx="2" fill="${hue}"/>
      <text class="mono eyebrow" x="${x+16}" y="${y+28}" fill="${hue}">${eyebrow}</text>
      <text class="sans title" x="${x+16}" y="${y+52}" fill="${T.ink}">${title}</text>
      ${lines.map((l,i)=>`<text class="sans body" x="${x+16}" y="${y+76+i*19}" fill="${T.muted}">${l}</text>`).join('')}
      ${extra}
    </g>`;
const chip = (x, y, text, hue, w) => `<rect x="${x}" y="${y-11}" width="${w}" height="22" rx="11" fill="${T.surface}" stroke="${hue}" stroke-width="1.2"/><text class="mono chip" x="${x+w/2}" y="${y+4}" text-anchor="middle" fill="${hue}">${text}</text>`;
const arrow = (x1,y1,x2,y2,hue,dash='',label='',lx=0,ly=0) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${hue}" stroke-width="1.8" ${dash?`stroke-dasharray="${dash}"`:''} marker-end="url(#m-${hue.slice(1)})"/>${label?`<text class="mono tiny" x="${lx}" y="${ly}" text-anchor="middle" fill="${hue}">${label}</text>`:''}`;
const marker = hue => `<marker id="m-${hue.slice(1)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="${hue}"/></marker>`;

// geometry
const SY = 120, SH = 150, SW = 300;
const PX = 270, BX = 640, IX = 1010;      // stage cards
const AX = 1352, AY = 96, AW = 200, AH = 380;   // Atlas
const IMX = 640, IMY = 330, IMW = 340, IMH = 128;  // improver

const stages = card(PX, SY, SW, SH, T.plan, 'STAGE 1 · PLAN', 'Reads, decides, specifies',
    ['Reads the last checkpoint and M-* metrics.', 'Picks a sprint mode: feature, improve, fix.', 'Emits the spec and the evaluation plan.'])
  + card(BX, SY, SW, SH, T.build, 'STAGE 2 · BUILD', 'Wraps a coding agent',
    ['claude-code, kiro or codex, frozen policy.', 'Builder and instrumenter take turns', 'until checks pass or the budget ends.'])
  + card(IX, SY, SW, SH, T.instrument, 'STAGE 3 · INSTRUMENT', 'Checks, then writes findings',
    ['Runs the standards checks on the result.', 'Writes this iteration\'s retrospective.', 'Writes findings. Never touches the policy.']);

const improver = card(IMX, IMY, IMW, IMH, T.accent, 'AFTER THE RUN · IMPROVER', 'Rewrites the harness itself',
    ['Reads findings and checkpoints. Rewrites rules,', 'context policies, tool grants → policy v n+1.', 'Tags cp/n: git sha, policy, metrics, retro.']);

const COLL = [['policies','improver'],['checkpoints','improver'],['plans','plan'],['findings','instr.'],['measurements','instr.'],['media_index','worker'],['transcripts','worker'],['jobs','worker']];
const atlas = `
    <g>
      <rect x="${AX}" y="${AY}" width="${AW}" height="${AH}" rx="12" fill="${T.raised}" stroke="${T.mongo}" stroke-opacity=".85" stroke-width="1.4"/>
      <ellipse cx="${AX+AW/2}" cy="${AY}" rx="${AW/2}" ry="12" fill="${T.raised}" stroke="${T.mongo}" stroke-opacity=".85" stroke-width="1.4"/>
      <text class="mono eyebrow" x="${AX+AW/2}" y="${AY+36}" text-anchor="middle" fill="${T.mongo}">MONGODB ATLAS · SANDBOX</text>
      <text class="sans body" x="${AX+AW/2}" y="${AY+56}" text-anchor="middle" fill="${T.muted}">every stateful thing, one cluster</text>
      ${COLL.map(([c,w],i)=>`<rect x="${AX+16}" y="${AY+72+i*34}" width="${AW-32}" height="26" rx="5" fill="${T.surface}" stroke="${T.line}"/><text class="mono tiny" x="${AX+26}" y="${AY+89+i*34}" fill="${T.core}">${c}</text><text class="mono tiny" x="${AX+AW-26}" y="${AY+89+i*34}" text-anchor="end" fill="${T.faint}">${w}</text>`).join('')}
      <text class="mono tiny" x="${AX+AW/2}" y="${AY+AH-12}" text-anchor="middle" fill="${T.faint}">named in COLLECTIONS only</text>
    </g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <!-- Generated by scripts/loop.mjs. Edit that file, not this one. Direction D2 dark. -->
  <title id="t">One iteration of 3PT: Plan, Build, Instrument under a frozen policy; the improver rewrites the policy and tags a checkpoint; everything in MongoDB Atlas; rollback restores a policy.</title>
  <desc id="d">Direction enters Plan. Plan, Build and Instrument run left to right under a frozen policy against a stage store that refuses policy and checkpoint writes. The improver reads findings, rewrites the policy as version n plus one, tags checkpoint cp slash n, and feeds Plan. Atlas holds policies, checkpoints, plans, findings, measurements, media index, transcripts and jobs. Rollback restores a prior policy from its checkpoint. Site photos enter through worker jobs.</desc>
  <defs>
    <style>
      .sans{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
      .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.12em}
      .eyebrow{font-size:12px;font-weight:600}
      .h{fill:${T.ink};font-size:30px;font-weight:800;letter-spacing:-.01em}
      .h .a{fill:${T.accent}}
      .title{font-size:17px;font-weight:700}
      .body{font-size:13px;font-weight:400}
      .chip{font-size:11px;font-weight:600}
      .tiny{font-size:10.5px;font-weight:500;letter-spacing:.08em}
      .foot{fill:${T.faint};font-size:12px;font-weight:500}
    </style>
    ${[T.plan,T.build,T.instrument,T.accent,T.core,T.mongo,T.lineStrong,T.muted].map(marker).join('')}
    <clipPath id="frame"><rect width="${W}" height="${H}" rx="12"/></clipPath>
  </defs>
  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="${T.canvas}"/>
    <text class="mono eyebrow" x="64" y="44" fill="${T.faint}">3PT · ONE ITERATION · THE LOOP AND THE RUN ARE SEPARATE</text>
    <text class="sans h" x="62" y="80">The run cannot change the rules. <tspan class="a">The improver can.</tspan></text>

    <!-- direction in -->
    <g>
      <rect x="64" y="${SY+30}" width="180" height="90" rx="10" fill="${T.surface}" stroke="${T.lineStrong}"/>
      <text class="mono eyebrow" x="80" y="${SY+56}" fill="${T.muted}">DIRECTION IN</text>
      <text class="sans body" x="80" y="${SY+78}" fill="${T.ink}">a superintendent, a PM,</text>
      <text class="sans body" x="80" y="${SY+96}" fill="${T.ink}">an owner, or an agent</text>
      ${arrow(244, SY+75, PX-6, SY+75, T.lineStrong)}
    </g>

    ${stages}
    ${arrow(PX+SW, SY+75, BX-6, SY+75, T.plan, '', 'spec', (PX+SW+BX)/2, SY+64)}
    ${arrow(BX+SW, SY+75, IX-6, SY+75, T.build, '', 'result', (BX+SW+IX)/2, SY+64)}

    <!-- the frozen policy and the stage store, spanning the run -->
    ${chip(PX, SY+SH+24, 'FROZEN POLICY v n', T.core, 160)}
    ${chip(PX+176, SY+SH+24, 'STAGE STORE · REFUSES WRITES TO policies, checkpoints', T.core, 420)}
    <line x1="${PX}" y1="${SY+SH+46}" x2="${IX+SW}" y2="${SY+SH+46}" stroke="${T.core}" stroke-opacity=".35" stroke-dasharray="3 5"/>

    <!-- findings down to the improver, the backfeed to Plan, the checkpoint to Atlas -->
    <path d="M${IX+SW-30} ${SY+SH} V ${IMY+IMH/2} H ${IMX+IMW+6}" fill="none" stroke="${T.instrument}" stroke-width="1.8" marker-end="url(#m-${T.instrument.slice(1)})"/><text class="mono tiny" x="${IX+SW-18}" y="${IMY+IMH/2-10}" fill="${T.instrument}">findings</text>
    ${improver}
    <path d="M${IMX} ${IMY+IMH/2} H ${PX+40} V ${SY+SH+6}" fill="none" stroke="${T.accent}" stroke-width="1.8" stroke-dasharray="6 6" marker-end="url(#m-${T.accent.slice(1)})"/>
    <text class="mono tiny" x="${PX+60}" y="${IMY+IMH/2-8}" fill="${T.accent}">BACKFEED · v n+1 becomes Plan's context</text>
    ${arrow(IMX+IMW, IMY+24, AX-6, AY+96, T.accent, '', 'policy v n+1 · cp/n', (IMX+IMW+AX)/2+40, IMY+2)}
    ${arrow(AX, AY+AH-60, IMX+IMW+6, IMY+IMH-20, T.mongo, '4 5', '3pt rollback cp/i · restores that policy as a new version', IMX+IMW/2, IMY+IMH+22)}
    ${atlas}
    ${arrow(IX+SW, SY+40, AX-6, AY+60, T.lineStrong, '2 4', 'read', (IX+SW+AX)/2, SY+30)}

    <!-- the workload from below -->
    <g>
      <rect x="64" y="500" width="${AX-64-70}" height="64" rx="10" fill="${T.surface}" stroke="${T.build}" stroke-opacity=".6"/>
      <text class="mono eyebrow" x="80" y="526" fill="${T.build}">THE WORKLOAD · SITE PHOTOS, PLANS, CAPTURES</text>
      <text class="sans body" x="80" y="548" fill="${T.muted}">The worker consumes jobs: index → transcribe once → tier → migrate. Images are read once; transcripts are what the stages see.</text>
      ${[0,1,2,3,4,5,6,7].map(i=>`<rect x="${900+i*44}" y="${514}" width="34" height="26" rx="3" fill="${[T.build,T.instrument,T.plan,T.core][i%4]}" fill-opacity=".2" stroke="${[T.build,T.instrument,T.plan,T.core][i%4]}" stroke-opacity=".5"/>`).join('')}
      ${arrow(1260, 532, AX-6, AY+AH-16, T.build, '', 'media_index · transcripts · jobs', 1150, 492)}
    </g>

    <text class="mono foot" x="64" y="${H-14}">SOURCE: harness/apps/cli · harness/packages/core, improver · docs/10-architecture.md §4.7 · DERIVED FROM CODE, LAYOUT AUTHORED</text>
    <rect x=".5" y=".5" width="${W-1}" height="${H-1}" rx="12" fill="none" stroke="${T.line}"/>
  </g>
</svg>
`;
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'assets', 'loop.svg');
writeFileSync(out, svg); console.log(`wrote ${out}`);
