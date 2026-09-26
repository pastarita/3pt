# UI capture: Playwright conventions and the image review loop
<!-- @s1.29 -->

*Source of record for how the app (`ui/apps/web`) is captured and scored. Code:
`ui/apps/web/e2e/`, `ui/apps/web/playwright.config.ts`.*

## The loop

```
flows.ts ──► capture.spec.ts ──► captures/<run>/ ──► image review ──► change the app
 (steps)      (per viewport)      PNG + manifest       (model + rubric)      │
    ▲                                                                          │
    └──────────────────────────────────────────────────────────────────────────┘
```

Run it:

```sh
cd ui/apps/web
pnpm capture                    # builds, serves on :4317, runs every flow on desktop and iPhone
CAPTURE_RUN=2026-09-26-a pnpm capture   # name the run; default is "latest"
```

## Conventions

| Thing | Rule |
|---|---|
| Region | Every part of the screen that a tour, a test or a crop can name has `data-region="<name>"`. One name, three users. |
| Screen | `<main data-screen="home|project|setup|flags">`. |
| Flow | A list of steps in `e2e/flows.ts`. Add flows there, never in the spec. A step returns `'skip'` when it does not apply on a viewport (for example, the ask box is in a sheet on the phone). |
| State | A flow seeds `localStorage` (role, tours seen, visits) and sets flags with `?ff=`. No flow depends on another. |
| Viewports | `desktop` 1440×900 and `iphone` (iPhone 15 size and touch, run in Chromium). |
| Files | `captures/<run>/<viewport>/<flow>/<NN>-<step>.png`, one per step, viewport only (what a person sees). |
| Manifest | `captures/<run>/manifest.json`: every shot with flow, step, intent, route, flags, drift, density and region boxes. `flowmap.json`: the flow graph. |
| Photos | Anything inside `[data-photo]` is content. The drift check skips it. |
| Output | `captures/` and `test-results/` are gitignored. Keep a run by copying it out, or store it in Atlas. |

## What the machine measures (no model needed)

| Metric | Objective it serves | How |
|---|---|---|
| `drift.total` | Design-system consistency | Count of computed colors, font sizes and radii not in `app` tokens (`@3pt/design-system`). Target 0. |
| `density.words` | No overload | Visible words in the viewport. |
| `density.targets` | No overload | Visible tap targets. |
| `density.smallTargets` | Phone use | Tap targets under 24px. Target 0. |
| `errors` | Works at all | Page errors and console errors. The test fails on any. |

## What the image review scores (model plus rubric)

Give the reviewer the PNG, the step `intent`, the previous step's PNG and the role. Ask for a
score from 1 to 5 on each qualifier, with one sentence of evidence each:

1. **Design-system consistency.** Same type sizes, colors, radii and button styles as the other
   screens in the run.
2. **Flow in context.** Does this screen answer the step's intent? Is the next action obvious?
   Does it follow from the previous screen?
3. **Progressive disclosure.** Does the screen show only what this role needs at this step?
4. **Familiar patterns.** Does it look like a screen this role already uses (daily log, punch
   list, photo grid, iPhone sheet)? See `docs/18-role-ui-case-study.md`.

Store each score with the shot's `file` as the key. A change to the app is better only when no
qualifier drops and at least one rises. That is the multi-objective rule.

## Tours and feature flags

Tours live in `ui/apps/web/src/tour.ts`. A step points at a region. A step whose region is not on
screen, or whose flag is off, is skipped. So a tour only explains what the user can see.

| Flag | Default | What it does |
|---|---|---|
| `setup` | on | First-run "what is your job?" screen |
| `tour` | on | The tips system |
| `tour.autostart` | on | Start a screen's tour on the first visit |
| `presenter` | off | Tour menu in the top bar, all cards open, the "How it learns" tour |
| `agent.history` | on | Earlier chats in the assistant |
| `cards.savers` | on | Time-saver suggestions |
| `cards.learned` | on | The harness change log, in plain words, with undo |

Set flags on the Settings screen (`#/flags`), or for one page load with the URL:
`?ff=presenter,-tour.autostart`. Use presenter mode for the demo.
