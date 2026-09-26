# Design system spec

*Reference tables for the design system proposal. The leaf `hub/site/design-system.html` keeps the figures, the specimens, the contrast check, the fit matrix and the ballot; the tables it cites live here. Moved out of the leaf on 2026-09-26 so the leaf fits the tersity budget. Section numbers match the leaf. Status: proposal, nothing decided.*

## 0 · Where we stand

*Two systems already exist. This page ends that.*

Two visual systems exist; one vocabulary, readable by Swift, absorbs both.

| Surface | Where | What it is | Debt |
|---|---|---|---|
| **Hub tokens** | `hub/site/3pt.css` | Dark only. `--bg --panel --card`; cluster accents `--violet --cyan --amber --slate`; point hues, flag, status, badge. | No light mode; colour words at the semantic layer. |
| **Nav shell** | `hub/site/nav.js` | Sidebar and glyphs: 24 grid, 1.7 stroke, round caps. | Hardcoded `#0b0e12 #ff6b4a #6b7684`. |
| **Direction page** | `hub/site/direction.html` | Light plus dark. `--ground --sheet --ink --marker`, keep and cut hues, film strip, Familjen Grotesk, IBM Plex. | No alert, point or badge hues; a second vocabulary. |

**Consequence.** They become D1 and D2, each completed with the mode it lacks; D3 is new. Tokens and shell regenerate; no private hex survives.

## 1 · Invariants

*What holds under every direction*

- **I1 Three tiers of tokens.** Primitive feeds semantic feeds component (F-a).
- **I2 Dark and light are peers.** Both values for every token; mode never in the name.
- **I3 The three points keep their slots.** `point.plan · build · instrument`, in order, colour nothing else; the triangle is the wordmark.
- **I4 Status is not category.** ok, warn, alert mark provenance and outcomes only, always with a glyph or word.
- **I5 Every figure wears provenance.** DERIVED, AUTHORED, TO CONFIRM alias the status hues; legible at 8.5px mono everywhere.
- **I6 Photos are neutral.** 1px frame, no tint, never larger than the record beside it, never the hero (F-f).
- **I7 One accent per screen.** One hue says new, picked, here; the rest is neutral.
- **I8 One glyph set, three weights.** The nav.js paths everywhere; directions change stroke and caps only; Swift gets symbols.
- **I9 Nothing web-only carries meaning.** No blur, gradient or filter as signal; SwiftUI must draw it with colour, path, text.
- **I10 Tokens have one source.** One file generates CSS, xcassets, Swift and manifest (F-e); hand-edited hex fails lint.

## 2 · Naming convention

*How the colour schema is named*

C survives a change of direction or platform without a rename.

| Option | Example | Verdict |
|---|---|---|
| **N-A Material metaphor** (direction.html) | `--ground --sheet --ink --marker` | Evocative but tied to one direction: "marker" means nothing on a sheet. *(no)* |
| **N-B Short unprefixed** (3pt.css) | `--bg --panel --card --violet` | Fast; no layer signal; colour words force renames; collides with third-party CSS. *(no)* |
| **N-C Layer, then role** | `bg.canvas · fg.muted · line.strong · accent.soft · point.plan · status.warn-soft` | Neutral to direction and platform; one path in CSS, JSON, Swift. Cost: one rename. *(recommended)* |

### The semantic layers (option C)

| Layer | Roles | Meaning |
|---|---|---|
| **L-bg** `bg` | canvas · surface · raised · deep | Ground; panel; panel on panel; inverted block. |
| **L-fg** `fg` | default · muted · faint · on-accent · on-deep | Body; secondary; labels; on accent; on deep. |
| **L-line** `line` | default · strong | Hairlines; control edges (3:1 on surface). |
| **L-accent** `accent` | default · soft | The one accent (I7) and its tint. |
| **L-point** `point` | plan · build · instrument | Reserved (I3). |
| **L-status** `status` | ok · ok-soft · warn · warn-soft · alert · alert-soft | Outcomes and provenance only (I4). |
| **L-prov** `prov` | derived → status.ok · authored → status.warn · confirm → status.alert | Aliases, so the badge can move later. |
| **L-cluster** `cluster` | orient · decide · build · record | Hub-only; absent from app sets. |

**Spelling.**

- JSON `bg.canvas`
- CSS `--bg-canvas`
- Swift `TPT.bg.canvas`, asset `bg/canvas`
- Tailwind `bg-canvas`

**Rules.**

- Mode never in the name.
- Colour words and numbers only in primitives (`gray.900`).
- Components read semantics only.
- Same shape: `type.display · space.4 · radius.card · motion.fast`.

**Migration.**

- `3pt.css`: 34 variables renamed once.
- `nav.js`: five hex values to `var()`.
- `direction.html`: stays, dated.

## 3 · Dark and light

*Accessible patterns for both modes*

| Pattern | Rule |
|---|---|
| **Mode selection** | `color-scheme` on the root; `prefers-color-scheme` by default; `data-theme` overrides, persisted as `tpt_theme` (app too); two PWA `theme-color` metas; SwiftUI `preferredColorScheme`. |
| **Accent in dark** | Lighter, less saturated, with its own dark `fg.on-accent`; reusing white is the common failure. |
| **Contrast targets** | 4.5:1 body, muted, accent as text, status on soft; 3:1 faint labels, strong lines, point marks; APCA Lc 60 for body once tokens.json exists. |
| **Focus, motion, forced colours** | Focus ring 2px accent, 2px offset; `prefers-reduced-motion` zeroes durations; `forced-colors` restores borders; 44pt targets on PWA and iOS. |
| **Never colour alone** | Every status carries a glyph or word; tile marks, keep and cut, and the diff are text. |

## 7 · Cross-surface

*One source, three surfaces*

| Concern | Web app (Next.js, Vercel) | PWA (installed) | Swift inspector (macOS, iOS) |
|---|---|---|---|
| **Colour** | CSS variables; `data-theme` override. | Plus `theme-color` metas; maskable icon from the triangle. | Asset catalog, both appearances. |
| **Type** | woff2 in `design/fonts/`; rem on a fixed scale. | `font-display: swap`, Latin subset, metric fallbacks. | Display font bundled only if demanded; Dynamic Type: display → largeTitle, h2 → title2, body → body, eyebrow → caption mono. |
| **Space** | 4px grid; `space.1 … 8` = 4, 8, 12, 16, 24, 32, 48, 64. | Plus `env(safe-area-inset-*)`. | Same, in points; `TPT.space.4`. |
| **Radius** | `radius.control · card · pill`, per direction. | Same. | `RoundedRectangle(cornerRadius: TPT.radius.card, style: .continuous)`. |
| **Icons** | nav.js paths, `currentColor`, stroke per direction. | Same. | Custom SF Symbols; weight follows text. |
| **Motion** | `motion.fast · ease`; reduced motion zeroes them. | Same. | `withAnimation(.easeOut(duration:))`; `accessibilityReduceMotion`. |
| **Density** | Dense tables use `space.2`. | Compact below 560px; 44px targets. | iOS 44pt; web row heights. |
| **Photos** | I6. | Lazy, sized by the record. | `TPTTile`. |

## 8 · Component library

*Our own components, and what they read*

Our own: no kit has badge, diff, ladder, switch, proposal. Twelve cover the demo; each records anatomy, tokens, states, Swift twin.

**Naming.**

- CSS `.tpt-button.primary`, parts `.tpt-card-title`; no BEM.
- Swift `TPTButton(.primary)`, variants as enums.
- One fragment plus one Swift file each in `design/components/`; the hub renders the fragments.

**Rules.**

- Reads component tokens, never a hue.
- Light and dark screenshots before use.
- States: default, hover, focus, active, disabled; plus the fixed triple.
- A thirteenth needs a written reason.

|   | Component | Anatomy | Reads | Swift |
|---|---|---|---|---|
| **K1** | **Button** primary · secondary · quiet | label, glyph; 44pt on touch | accent, fg.on-accent, line.strong, bg.surface | `TPTButton` |
| **K2** | **Chip** | mono uppercase; point, cluster variants | bg.raised, line, point.* | `TPTChip` |
| **K3** | **Provenance badge** | DERIVED · AUTHORED · TO CONFIRM; 8.5px mono | prov.* | `TPTProvenance` |
| **K4** | **Card** | glyph, title, sentence, go-verb | bg.surface, line, accent (verb) | `TPTCard` |
| **K5** | **Stat tile** | tabular number, label, provenance | bg.surface, fg.muted | `TPTStat` |
| **K6** | **Version diff row** | part, v(n), v(n+1); added, struck | status.ok, status.alert as text | `TPTDiffRow` |
| **K7** | **Photo tile** | square, 1px frame, text mark | line, status.ok, status.alert | `TPTTile` |
| **K8** | **Stream switch** | track, knob, name, line | line.strong, status.ok | `TPTSwitch` (Toggle) |
| **K9** | **Ladder rung** | numbered disc, verb, line | fg.default on bg.canvas inverted | `TPTRung` |
| **K10** | **Proposal card** | accent border, claim, approve, decline | accent, bg.surface | `TPTProposal` |
| **K11** | **Rulebox** | warn edge, bold lead, muted body | status.warn, bg.surface | `TPTCallout` |
| **K12** | **Table** | mono head, hairlines, tabular numbers | bg.raised, line | `TPTTable` |

## 9 · Motifs against the ICP

*Bases every motif must pass*

### Bases: every motif must pass all seven

|   | Basis | Why |
|---|---|---|
| **B1** | Hero never a photo; no photo larger than its record. | Image analyzers are banned. |
| **B2** | One accent; status never colours categories; points keep slots. | I3, I4, I7. |
| **B3** | Badges legible in the motif's colours, both modes. | Every number's credibility. |
| **B4** | Same glyph paths everywhere; stroke may change. | I8. Swift gets the same symbols. |
| **B5** | Drawable with colour, path and text. | I9. The inspector is native. |
| **B6** | Buildable today: self-hostable fonts, no custom illustration. | Due 5:00 PM. |
| **B7** | No MongoDB green accent, no black-on-black Vercel base. | Forty submissions wear those palettes. |
