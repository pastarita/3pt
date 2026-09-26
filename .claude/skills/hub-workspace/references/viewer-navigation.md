# hub-workspace · Viewer navigation: outline, metadata strip, minimap

Three affordances that make a long document navigable inside the Viewer (`references/polyglot-viewer.md`)
without touching a single markdown file. All three are DERIVED at load from the rendered document; the
one thing the browser cannot know (what git knows) comes from a GENERATED file. Nothing is typed by hand.

**Why not a TOC in the markdown.** A hand-written contents list is a tally: it drifts the first time a
heading changes, it is wrong in every fork, and it is one more thing the lint cannot check. The Viewer
already gives every heading a slug id (the same rule as the provenance tool, so `#anchors` land); the
outline is that list, read back from the DOM. The metadata strip counts what is on the page. The minimap
draws the block layout. None of the three exists in the source of record, so none can be stale.

**Where it was derived.** 3PT hub (`hub/site/view.html`), 2026-09-26, over 41 documents (13 to 88 sections,
one 1,700-line transcript). Every rule below was needed by at least one of them.

## 0 · The Viewer owns its layout

The Shell puts its margin on `<body>`; the Viewer must not add a centred `max-width` on top of it, or the
text is squeezed to a 450px column with dead space on its left (the first draft did exactly that). Rule:
`.doc` is a grid anchored left, `grid-template-columns: minmax(0, 800px) 260px` above 1240px, one column
below; padding `26px 76px 90px 44px` (the right gutter is the minimap's lane). The text keeps a real
measure; the outline is a column, not an overlay; nothing is centred.

## 1 · The outline, a scroll area

An `<nav class="toc">` built after `out.innerHTML` is set, from `out.querySelectorAll('h2,h3')`
(`h1` is the title; deeper levels are noise in an outline). Skip it under three headings. It is a
first-class scroll area, the same anatomy as the Shell's rail: a **pinned header** (`Contents · N`),
a **scrolling list** (`.toc-w`: thin themed scrollbar, `scrollbar-gutter: stable`, `overscroll-behavior:
contain`), **edge fades** (`::before`/`::after` on the wrapper, shown by `.more-top`/`.more-bot` from the
scroll offset), and a **pinned footer** (`↑ top`). Entries are one line, ellipsed, full text in `title`:
an outline that wraps is a second document.

**The pin.** One 3px flag-coloured bar, absolutely positioned in the list, `transition: top .16s`. It
slides to the hovered entry (soft colour) and settles back on the active one (flag) on `mouseleave`.
Hover on the entry itself is a faint background and ink text. Selecting (click) marks the entry bold ink
and moves the pin there. One indicator, two states; no underline, no chevron, no icon per row.

| Rule | Why |
|---|---|
| Wide (≥ 1240px): sticky in the second grid column, `top` under the Published strip, `max-height: calc(100vh − 62px)`; the header cannot collapse it. | The text keeps its measure; the outline never pushes it; a panel that can vanish on wide screens is a trap. |
| Narrow: a collapsible block **between the crumb and the text** (`order` on grid items: crumb −2, outline −1). Shut state remembered per browser (`<ns>_toc`). | Above the crumb it reads as chrome; below the text it is unreachable. |
| The active entry is scrolled into the list's own view (`scrollTo` on the wrapper, smooth, centred) when it is within 24px of an edge. | A long outline must follow the reader; the page must not jump. |
| Click: `preventDefault`, `history.replaceState('#slug')`, `scrollIntoView`, move the `.landed` mark to the heading. | The same landing as arriving with `#slug`; the back button is not polluted with every click. |
| Active section: `IntersectionObserver` on the headings, `rootMargin: '-40px 0px -70% 0px'`; when none intersects, the last heading above 80px. Scroll the active link into the outline's own view when the outline overflows. | A heading is "current" while its section fills the top third; the fallback covers long sections with no heading on screen. |
| Count in the header (`N sections`) is `h2` only, computed. | Tallies are never typed. |

## 2 · The metadata strip

One row of four chips under the crumb (`.meta`, grid column span). The first draft had eleven chips over
three rows; nobody read them. Not including too much is the design.

| Chip | Provenance | Content |
|---|---|---|
| Register | DERIVED | id and cluster, looked up by path in the Model's document register; `title` = the epigram |
| Reading | DERIVED | words (the tersity regex) · minutes (words / 220, min 1) |
| Shape | DERIVED | `h2` sections · figures (`figure` + `table`) |
| History | GENERATED | last commit sha · minute · author's first name · commit count; a link to the file's history; `title` = the subject |

- **DERIVED** counts come from the rendered DOM at load, so they cannot be stale.
- **GENERATED** facts come from `tools/docmeta.mjs` → `site/doc-meta.js` (`globalThis.DOCMETA[path]`):
  last commit (short sha, ISO minute, author, subject), commit count, first commit, lines.
  Regenerate at every checkpoint (`make -C hub meta`) and in `stage.sh` when history is available.
  CI checks out shallow, so the generator exits early on `git rev-parse --is-shallow-repository` and
  the committed copy ships. `--check` compares shas and warns; it is advisory in `make check`, because
  a doc edited by a concurrent session must not turn `main` red.

The strip degrades: no Model → no register chip; no `doc-meta.js` → no git chips; `file://` → the
Viewer already shows the path and the serve hint, and the strip is empty.

## 3 · The minimap

A fixed 44px strip at the viewport's right edge (`.mm`), wide screens only, shown when the document is
taller than two and a half viewports. Built after render and again 600ms later (diagrams and images
settle), and on `ResizeObserver` of the content.

| Mark | Element | Drawn as |
|---|---|---|
| `h2` | section heading | 2px full-width tick in ink |
| `h3` | subsection | 1px inset tick in soft |
| `figure`, `.tbl-wrap`, `pre` | figures, tables, code | filled block scaled to the element's height, cyan / violet / amber at low alpha |
| `a.seg` | provenance chip | 2px flag tick at the left edge |
| `p`, lists, quotes (not inside a figure, list item or table) | prose | 1px hairline in the line colour |
| the viewport | | translucent window with flag top and bottom rules, moved on scroll |

Scale is `stripHeight / document.scrollHeight`; every mark's `top` is `(rect.top + scrollY) × scale`.
Click or drag sets `scrollTo(y − innerHeight / 2)`. Hover shows a label with the nearest heading above
the pointer. `aria-hidden`: the outline is the accessible route; the minimap is a picture of the page.

## Checks worth keeping

- `md('## a\n### b\n## c')` renders ids `a`, `b`, `c` and the outline lists three entries with `b` at level 3.
- A document with two `h2` and no `h3` gets no outline (under three headings).
- `doc-meta.js` parses in Node (`node -e "require('./site/doc-meta.js')"`) and lists every document the stage script ships.
- The minimap is absent below 1240px and on a document under 2.5 viewports; present on the longest document.
- Print: outline, strip and minimap are all `display: none`.

## Anti-patterns

- A contents list typed into the markdown (a tally; see above).
- One minimap per leaf: it belongs to the Viewer only, where the block grammar is known.
- Reading git facts at load through an API: leaves fetch nothing; a generated file is the door.
- Counting the outline's entries in prose ("this document has 12 sections"); the header derives it.
