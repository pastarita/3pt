# Provenance: the transcript DSL and the index built from it

*Source of record for how ideas are traced from the spoken brainstorm to the documents, decisions,
and code that came out of it. Written 2026-09-26. The transcript is `brainstorming.md`; the
tool is `scripts/prov.mjs`; the generated index is `docs/provenance-index.md`; the hub renders it
as the Timeline leaf. `@s1.28` cites a segment; this document cites none because it is about the
mechanism, not an idea from the room.*

## What this is for

Three things had to be true at once:

1. **The transcript stays verbatim.** `brainstorming.md` is appended to as spoken and never
   cleaned up. Yash and Patrick keep transcribing straight into it.
2. **Every idea has a birthplace.** Who raised it, when in the conversation, what it grew out of,
   what it became, and where in the docs and code it landed.
3. **Both directions are checkable.** The transcript says where an idea landed; the landing site
   says where it came from. When the two disagree, that disagreement is the worklist.

So the annotations live *inside* the transcript as HTML comments, which render as nothing, and
everything downstream points back with one token. A script turns both into an index and a
timeline, and it refuses to build when a pointer is broken.

## The two tokens

### 1. Segment marker (only in `brainstorming.md`)

A segment is a stretch of transcript with one thought in it. Its marker is an HTML comment placed
on the line **before** the segment's first line. Nothing inside the marker is transcript.

```
<!-- s1.12 PY
idea sprint-modes :: feature, improvement, fix sprints as a constant loop; sequential, never parallel
grow polyglot-plan-gateway :: these are modes of planning that choose the data streams
q Does the fix loop belong to Plan or to Instrument? => Plan selects the mode each iteration (s1.12)
from s1.11 s1.03
lane 4
doc docs/00-vision.md#loops-inside-the-loop
doc docs/07-assessment-and-measurement.md#T-6
term sprint modes
-->
```

The minimum marker is one line, and that is all you write while transcribing:

```
<!-- s1.31 Y -->
```

Everything else is added later, in the annealing pass.

**Header:** `<!-- s<session>.<nn> [who] [hh:mm]`. The id is the session number from the
`## Session N (YYYY-MM-DD)` heading and a two-digit ordinal. Ids must increase within a session;
order is chronology. `who` is any run of `P` (Patrick), `Y` (Yash), `X` (someone outside the
team, a mentor at the table), `?` (uncertain). `YP?` means "Yash then Patrick, probably."
Time is optional; the transcript rarely has it.

**Directives**, one per line, `key rest`:

| Key | Form | Meaning |
|---|---|---|
| `idea` | `idea <slug> [:: gloss]` | An idea is **born** here. A slug is born exactly once. |
| `grow` | `grow <slug> [:: how]` | An existing idea is extended or made concrete here. |
| `pivot` | `pivot <slug> [:: how]` | An existing idea materially changes scope or direction here. |
| `drop` | `drop <slug> [:: why]` | An existing idea is deferred or cut here. |
| `from` | `from <seg> [<seg> …]` | Lineage: this segment builds on those earlier segments. Must point backwards. |
| `lane` | `lane <n> [<n> …]` | The lane(s) this segment invoked or shaped (`docs/02-lanes.md`, hub lane board). |
| `doc` | `doc <path>[#anchor]` | Where this landed in the docs. Repo-relative. The anchor is a heading (prefix match on its slug) or any literal token in the file, such as `T-6` or `R-25`. |
| `code` | `code <path>` | Where this landed in code or the hub. |
| `term` | `term <words>` | Vocabulary coined here; feeds the glossary. |
| `q` | `q <question> [=> <resolution>]` | A question opened here. No `=>` (or `=> open`) means it is still open. |
| `note` | `note <text>` | Anything else worth keeping beside the segment. |

A `doc` or `code` line **indented under an idea line** attaches to that idea rather than to the
whole segment. Use this when a segment carries several ideas that landed in different places.

Slugs are `[a-z0-9-]`, terse, and stable: `read-once-transcript`, `stream-dialing`. The gloss is
one line in your own words, not a quote. The transcript already has the quote.

### 2. Citation (anywhere else in the repo)

```
<!-- @s1.13 -->                       in Markdown, under the heading that came from s1.13
<!-- @s1.13:read-once-transcript -->  the same, naming which idea in the segment
// @s1.28                             in JavaScript, Swift, or any code comment
# @s1.16                              in shell, Python, YAML
```

The token is `@s<session>.<nn>` with an optional `:<slug>`. The scanner looks inside every text
file in the repo except the transcript and the generated outputs, so the comment syntax does not
matter. In Markdown, a token inside a code fence or a backtick span is a quotation and is ignored,
which is how this document can show examples without claiming them. A file containing the literal
`prov:ignore` anywhere is skipped entirely (test fixtures). Cite the segment where the idea was born unless a later `grow` or `pivot` is what the
text actually reflects.

## The loop

```
transcribe  →  mark  →  enrich  →  cite  →  bake  →  build
```

1. **Transcribe** into `brainstorming.md`. New session: add `## Session N (YYYY-MM-DD)`.
2. **Mark** segments as you go: `<!-- s2.01 P -->` before each thought. Cheap; do it live.
3. **Enrich** later: ideas, lineage, questions, lanes. This is the annealing pass. Do it with the
   discussion still warm, and again whenever a decision lands.
4. **Cite** from the docs and code you write: put `@sN.NN` in a comment where the idea lands.
5. **Bake**: `node scripts/prov.mjs --bake` copies every cite the transcript does not yet know
   about into the segment's marker as a `doc` line. The transcript is the one place that knows
   everything downstream of it.
6. **Build**: `node scripts/prov.mjs` regenerates the index and the hub data layer.

```sh
node scripts/prov.mjs           # validate, then write docs/provenance-index.md + hub/site/prov-data.js
node scripts/prov.mjs --check   # validate only; exit 1 on errors (run in CI)
node scripts/prov.mjs --bake    # append doc lines for un-baked cites, then re-run to build
node scripts/prov.mjs --json    # the model on stdout
```

## What the checker refuses

Errors stop the build. Each names the segment and line.

- A segment id that repeats, goes backwards, or does not match its session heading.
- `from` pointing at a segment that does not exist or comes later.
- `grow`, `pivot`, or `drop` on a slug that was never born; `idea` on a slug born already.
- A `doc` or `code` path that does not exist, or an anchor that matches no heading and appears
  nowhere in the file.
- A `lane` number the hub's lane board does not know.
- A citation of a segment that does not exist, or `@seg:idea` where the segment does not carry
  that idea.
- A directive key not in the table above, or an unclosed marker.

Gaps are reported, not refused, because annealing is incremental:

- **unbaked**: a file cites a segment the segment does not list. `--bake` fixes it.
- **unacknowledged**: a segment says it landed in a file that never cites it back. Add the
  cite, or remove the `doc` line if the claim was wrong.

## What it produces

| Output | For whom | Contents |
|---|---|---|
| `docs/provenance-index.md` | agents and humans in the repo | Sessions; chronology (one row per segment); ideas with birth, history, status, landing sites; questions open and resolved; terms; lanes; documents with both directions; gaps. |
| `hub/site/prov-data.js` | the hub | The same model as `globalThis.PROV`, with full segment bodies so the timeline can show the words. |
| `hub/site/timeline.html` | the two principals | The chronology as a rail: who spoke, what was born, what it grew from, where it went, what is still open. Filter by person; open any segment in place; jump to it in the Viewer. |

Both generated files are committed so a fresh clone and the deployed hub agree without running
anything. Regenerate before committing a transcript or citation change.

The Viewer renders each segment marker as a small anchored chip (`s1.12 · PY · 2 ideas`) so
`view.html?f=brainstorming.md#s1.12` lands on the segment. Every other HTML comment renders as
nothing, which is how the citations stay invisible in the docs.

## Session 1, as indexed

Thirty segments, seventy-five ideas born, seven questions raised of which one is still open (which
ICP direction to build for today). The chronology runs from the two-minute spiel to the mentor
(`s1.01`) through the media-heavy pivot (`s1.06`), images-only scoping (`s1.08`), sprint modes
(`s1.12`), Yash's statement of need (`s1.13`), the labor split (`s1.15`, `s1.16`), the construction
and interior-design candidates (`s1.18`, `s1.26`), the screen-capture onboarding idea (`s1.28`),
and the ICP exploration that is still running (`s1.30`). The theses in
`docs/07-assessment-and-measurement.md` now cite their segments by id instead of by quoted phrase.

## Design notes

- **Comments, not a sidecar file.** A sidecar drifts the first time someone pastes a new session.
  A marker sits between the lines it describes and moves with them.
- **Segments are the citation unit, ideas are the index unit.** A segment is a fact about the
  transcript (these lines, this speaker). An idea is an interpretation. Cite the fact; refine with
  `:slug` when it matters. The index maps ideas to documents through the segments either way.
- **The transcript is the aggregate.** Forward `doc` lines in the marker are the complete record of
  where a segment went; `--bake` keeps that true by copying cites in, never out. Markdown docs are
  never edited by the tool.
- **Speaker attribution is a claim.** The log was dictated and merged; `who` is best judgment from
  context and `?` is allowed and expected. Correcting it is an edit to the marker, not the text.
- **One tool, no dependencies.** Node only, like the hub's checkers. It reads
  `hub/site/3pt-data.js` for lane names when present and works without it.
