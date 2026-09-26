# hub-workspace · symbolic identity system

Generalized 2026-07 from the Labs estate (`~/Documents/Code/Labs_dev/`), the CLOSE-OUT symbol
rules, the COMPAASS program registry, and the railroad URN scheme. This is the identification
layer that makes a workspace navigable at estate scale: **navigability comes from one identity
system, not from more navigation chrome.**

## The Register — the identity tuple

Every module (lab, lane, program, venture) carries **one record in one registry**, and every
surface renders from it:

```js
// tightest canonical expression: Labs_dev/labs_art_director.html `BASE`
// [id, slug, NAME, verb, accent, epigram, mark]
['L01','araeus','ARAEUS','Homesteading','#c2762e','The home as its own factory.','araeus.svg']

// fully-keyed form: Labs_dev/docket/data/labs.js `containers`
{ id:'L01', slug:'araeus', name:'ARAEUS', gerund:'Homesteading', domain:'habitat',
  thesis:'…', product:'…', procurement:{ status:'concept' } }
```

Field contract:

- **`id`** — the spoken ordinal: short, prefixed, sortable (`L01`…`L12`, `D1`…`D6`, `S07`).
  Rendered visibly in the sidebar row and the top bar, not hidden in data.
- **`slug`** — the machine join key. *Stable forever*: never rename a slug once any artifact
  references it (LAB_MODULE_CONTRACT.md §3). It joins the module across every layer:
  `abstracts/<slug>/`, `charters/<slug>/`, `data/layout/<slug>.js`, `#lab=<slug>`.
- **`name`** — the displayed proper name.
- **`verb`** (gerund) — one verb-in-progress naming what the module *does*
  (`Homesteading · Manufacturing · Excavating`). Doubles as a navigational axis.
- **`cluster`** — a key into the cluster registry below. Never free text.
- **`epigram`** — one sentence of identity ("Walk your repository as terrain.").
- **`glyph`** — hand-minted 24×24 inner-SVG markup (see minting rule).

## The cluster registry — clusters are records, not headings

```js
// Labs_dev/docket/data/labs.js `meta.domains`
domains: {
  habitat:      { label:'Habitat & Domestic Fab', color:'#c2762e' },
  manufacturing:{ label:'Modular Manufacturing',  color:'#7b6cc4' },
  …
}
```

The Shell's `GROUPS`, the hub's card sections, the accent hues, and the prose all key into
this one object. **One namespace per workspace** — the canonical failure (Seaweed City,
pre-uplift) is two half-systems for the same five lanes: dispatch lane letters (`Lane A…F`)
living in page prose while the hub mints its own disc glyphs (`N · $ · V · §`), with neither
able to resolve the other.

## Sidebar row grammar

```
glyph  +  [ID · NAME]  +  [verb · cluster-label]  (+ optional status dot)
```

From `Labs_dev/hub.html buildNav()`: `<span class="n">${l.id}</span>${l.name}` over
`${l.gerund} · ${domOf(l).label}`, with `docket/hub.html` adding a completeness dot
(costed vs concept). The ID is chrome, not metadata.

## Glyph minting rule (the CLOSE-OUT rule)

Stated in `ee26/CLOSE-OUT/symbol-system.html`, inherited verbatim by
`Labs_dev/docket/data/symbols.js`:

- `viewBox="0 0 24 24"`, `stroke-width` 1.6–1.7, round caps/joins, `fill="none"` except one
  light accent (`fill-opacity=".15"`).
- **`currentColor` only** — the cluster color is applied by the renderer (CSS `color`), so
  one glyph recolors per cluster and the same mark reads in a table row, a card, and a
  plan-view.
- Naming law: `symbols/<slug>.svg` · sprite id `sym-<slug>` · slug = kebab name.
- Closed vocabulary with a fallback: unknown symbol falls back to a named default; "if you
  need a new symbol, still pick the nearest from this list" — then mint deliberately
  (the mint-on-demand agent prompt is §4 of `symbol-system.html`).

## Status glyph vocabulary

```js
// Labs_dev/data/readiness_schema.js
substantiated:{ glyph:'●', weight:1.0,  hue:'#2f8f6b' },
drafted:      { glyph:'◐', weight:0.6,  hue:'#c99a2e' },
prospective:  { glyph:'◒', weight:0.35, hue:'#3b6fb5' },
todo:         { glyph:'○', weight:0.0,  hue:'#b0483f' },
na:           { glyph:'—', weight:null, hue:'#8b877c' }
```

Statuses carry weights, so they roll up into coverage matrices (the 12×12 readiness heat
table) for free. Pairs with the honesty ledger (SECURED / PROSPECTIVE / ASPIRATIONAL) and
the provenance badges — all are status vocabularies, styled in status hues, never in a
cluster accent.

## Addressing — everything citable gets a stable handle

Three schemes, by depth:

1. **Hash deep-links** — the hub is a router: `#lab=<slug>&doc=<class>`, `#inst=<key>`,
   with a dispatch table declaring each surface's render kind
   (`{kind:'iframe'|'md'|'matrix'|'link', src|key}`) — this is how one hub stays a polyglot
   viewer over HTML, markdown-as-JS, and computed tables (`Labs_dev/hub.html INST` +
   `render()`).
2. **Dotted node ids** — `<slug>.<phase>.<group>.<key>`
   (`araeus.P1.mission.one_sentence`) for checklist/claim nodes; declared as "the shared
   referential basis … a join key that survives the move to the monorepo"
   (`readiness_schema.js`). Each node names the artifact class that substantiates it, and an
   artifact-class registry maps class → route.
3. **Artifact URNs** — `ns:<id>:<kind>` with a `collection` cluster key
   (`rr:<sid>:<kind>`, `railroad/data.js`): every artifact in the workspace — including
   `.md` and manifests — gets an address and a collection. The most complete scheme found;
   use it when non-HTML artifacts must be first-class citable surfaces.

## The Estate tier — when one hub becomes several

**The identity claim** (which is what belongs in this file): in a **layer estate** the contract
is **layer-major, module-horizontal** (`Labs_dev/LAB_MODULE_CONTRACT.md`) — each top-level
directory is one artifact layer (abstracts / docket / charters / publications / data), each
module cuts all layers, joined by `slug`; the root hub is the interstitial surface that joins
every layer per module. Cross-layer artifacts resolve by string template, never by index.

A **federated estate** is the other topology: peer hubs joined by *role* rather than by `slug`,
each owning its own Shell, tokens and namespace.

> **The estate strip federates tools, not documents.** Layer directories carry no strip and
> that is correct — they are reached *through* the estate hub, which renders them per module.
> Put the strip on anything a person navigates *to*; leave it off anything a hub renders *for*
> them.

**The full build contract — registry shape, the depth-independent root, `ARCHIVED`/`since`, the
fixed-panel collision sweep, the two-tier nav contract, the scaffold checklist and the estate
anti-patterns — is `references/estate.md`.** Read that before building one.

## Version-control navigability

The git history is itself a navigable surface (`Labs_dev/SDLC.md`):

- Tag taxonomy — `epoch/<yyyy.mm>-<slug>` (time anchors), `layer/<name>-v<n>` (artifact-layer
  milestones), `org/<yyyy.mm>-<slug>` (consolidations). "Any era or layer is one
  `git checkout <tag>` away — that *is* the reviewability index."
- Branch grammar — `layer/<name>`, `lab/<slug>`, `surface/<name>`, `fix/<thing>`.
- Generated files carry a `/* GENERATED by <script> — do not hand-edit */` header;
  data is separated from render so diffs attribute cleanly.
- Provenance can be *mined*, not asserted: `data/lab_provenance.js` recovers each module's
  origin from filesystem mtimes ("Spans are soft; origins are hard") — generated by a
  script, never hand-edited.

## Exemplars

| Path | Study it for |
|---|---|
| `~/Documents/Code/Labs_dev/hub.html` | The estate hub: Register-driven sidebar, hash router, five render modes, keyboard mnemonics per document class |
| `~/Documents/Code/Labs_dev/docket/data/labs.js` | The Register + cluster registry in canonical form |
| `~/Documents/Code/Labs_dev/data/estate_nav.js` | The estate strip (root-from-own-src, regex active detection) |
| `~/Documents/Code/Labs_dev/data/readiness_schema.js` | Dotted node ids + status glyph vocabulary + artifact-class routes |
| `~/Documents/BUSINESS/Events/ee26/CLOSE-OUT/symbol-system.html` | The glyph minting rule + mint-on-demand prompt |
| `~/Documents/Code/Labs_dev/abstracts/compaass/programs/_generator/programs.js` | One registry procedurally emitting a whole leaf family (ordinal + accent + glyph + catechism) |
| `~/Documents/Code/rrdemosim_dev/research/gtm/railroad/` | Artifact URNs (`rr:<sid>:<kind>`), data-driven ranked nav, shell-less print-destiny doctrine |
| `~/Documents/Mantafarm/_dev/seaweed-city/` | A completed Register retrofit: two legacy namespaces reconciled into `B/P/M/I` ordinals with lane letters as chips, node-safe `nav.js` + `tools/check-nav.mjs` lint, hub cards rendered from the Register with tallies kept hub-side |
