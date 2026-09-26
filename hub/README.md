# 3PT hub workspace

Everything about the hub lives in this directory. The rest of the repo does not depend on it.

The hub is a gated Cloudflare Pages site that renders the repo's docs of record and holds two
working surfaces for the principals: the lane board and the ICP explorer. Live at
**https://3pt.pages.dev**; every PR that touches `hub/` or `docs/` gets a preview at
`https://<branch>.3pt.pages.dev`.

## Layout

| Path | What |
|---|---|
| `site/index.html` | The hub: grouped cards + DERIVED tallies. Navigation only, never content. |
| `site/nav.js` | The Shell: single source of IA (`GROUPS`, `ROUTE`, glyphs, cluster registry). |
| `site/3pt-data.js` | The Model: doc Register, lanes, ICP directions, criteria, presets, helpers. |
| `site/3pt.css` | Design tokens and shared components. Dark base. |
| `site/view.html` + `site/view-render.js` | The Viewer: renders `.md` / `.csv` / `.json` inside the Shell. |
| `site/diagram.js` | The mermaid reader: ```` ```mermaid ```` fences in any doc render as SVG in the hub's tokens. Reads flowcharts (subgraphs, six shapes, five edge styles, fan-out, serpentine wrap), sequence, gitGraph, stateDiagram-v2, classDiagram. Colour comes from the class *name* (`:::plan`), never from classDef hex. `tools/check-diagram.mjs` renders every real fence in CI. |
| `site/lanes.html`, `site/icp-explorer.html`, `site/changelog.html` | Leaves. |
| `functions/_middleware.js` | The Gate: Tier 0 Basic auth at the edge. |
| `tools/stage.sh` | Builds `_site/` = `site/` + `../docs/` + `../README.md` + `../brainstorming.md`. |
| `tools/check-nav.mjs`, `tools/check-view.mjs` | Lints, run against `_site/`. The type-check for the IA. |
| `tools/tersity.mjs` | The tersity metric: words, figures, words per figure, longest paragraph, per leaf. Gates `make check`. |
| `tools/serve.py` | Pages-faithful preview server for `_site/`. |
| `wrangler.jsonc`, `Makefile` | Deploy config and targets. |
| `_site/` | Generated. Gitignored. |

## Working it

```sh
cd hub
make preview   # stage + serve at http://127.0.0.1:8000/
make check     # stage + both lints + provenance + tersity budget
make tersity   # the tersity table for every leaf
make deploy    # stage + lints + production deploy (from hub/, so functions/ compiles)
make verify    # anon 401 · valid 200 · wrong-domain 401   (needs ACCESS_PASS in the environment)
```

## Adding a surface: three moves, never a fourth

1. Write the leaf in `site/`: self-contained HTML, tokens from `3pt.css` only, `<script src="./nav.js">`.
2. Register it in `nav.js` `GROUPS` under its phase, with a minted 24×24 glyph.
3. Card it on `index.html` with one honest sentence and a go-verb.

Documents are not leaves. Card them as `view.html?f=docs/<file>.md` and route them in `nav.js` `ROUTE`.
Then `make check`.

Two rules the lints now enforce, learned 2026-09-26:

- **No HTML under `docs/`.** An HTML proposal saved there is a leaf that escaped the site root: the
  Shell cannot mark it current, the sweep skips it, and its relative links break. It goes in
  `site/` with `nav.js` + `3pt.css`, like the design-system leaf now does.
- **Every relative markdown link must resolve from the document's own directory** inside the
  artifact. From `docs/`, the transcript is `../brainstorming.md` and a root leaf is
  `../lanes.html`. Generators that emit links (`scripts/prov.mjs`) emit them that way.
- **No external fetches from a leaf.** Fonts a leaf needs are vendored: `tools/vendor-fonts.sh`
  writes `site/fonts/directions.css` and the woff2 files beside it.

## State

Hot-leaf state is per browser, in `localStorage` under the `tpt_` prefix:
`tpt_lanes_v1`, `tpt_icp_weights_v1`, `tpt_changelog_v1`, `tpt_changelog_total`, `tpt_nav`.
It does not sync between people yet. Export the lane board as text and paste it.

## Gate: two doors, one room

**Door 1, Tier 1: Cloudflare Access (Zero Trust).** One self-hosted Access application covers
`3pt.pages.dev` and `*.3pt.pages.dev`, so production and every PR preview share the same app and
AUD. The allowlist lives in the Access policy, not in code; adding a person is a dashboard edit.
Visitors sign in with a one-time PIN to their email (or any identity provider enabled on the team).
`functions/_middleware.js` then **verifies the assertion** Access attaches (RS256 against the team's
published keys, issuer, audience, expiry) and fails closed with 503 if the keys are unreachable.
The convenience email header is never trusted on its own.

**Current state (2026-09-26):** the Access application **3PT hub** exists on team
`lively-king-be23.cloudflareaccess.com`, destinations `3pt.pages.dev` + `*.3pt.pages.dev`, one
reusable policy **3PT team** (Allow: emails ending in `@factorita.com`, plus the two principals'
Gmail addresses). `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` are set in both Pages environments.
To add a person: Zero Trust → Access controls → Policies → *3PT team* → add an email. No redeploy.

Login method is **One-time PIN** (code emailed to the address). The team also has a "Cloudflare"
identity provider, which signs people in with a Cloudflare dashboard account and then fetches their
account membership; anyone who is not a member of this Cloudflare account gets *"Failed to fetch
user group information from the identity provider"*. That is what a collaborator sees if they pick
it, so the 3PT hub app is restricted to One-time PIN. If a PIN never arrives, check spam for
`noreply@notify.cloudflare.com`; relay aliases do not match the policy.

```sh
# to (re)create the app from the API instead of the dashboard — needs an API token with
# Access: Apps and Policies · Edit + Access: Organizations · Read in ~/.config/3pt/CF_API_TOKEN
ACCESS_EMAILS="patrick@factorita.com,kothariwork@gmail.com,patrickastarita@gmail.com" make access
make deploy && make verify
```

**Door 2, Tier 0: Basic auth.** Any `@factorita.com` address, the `ALLOW` array in the middleware,
or the comma-separated `ACCESS_USERS` Pages variable, plus the `ACCESS_PASS` Pages secret. This is
the door `curl` uses and the door that still works if the Access app is ever removed. On hostnames
Access fronts, it is unreachable (Access intercepts first). No password is ever in the repo.

```sh
npx wrangler pages secret put ACCESS_PASS --project-name=3pt                # production
npx wrangler pages secret put ACCESS_PASS --project-name=3pt --env preview  # preview
```

There is no `DISABLE_GATE`. Graduate to Tier 2 (self-service request-and-approve) the first time a
collaborator is locked out; the pattern is in `.claude/skills/hub-workspace/references/collaborator-access.md`.

## CI

`.github/workflows/deploy.yml` at the repo root, scoped to `hub/**`, `docs/**`, `README.md`,
`brainstorming.md`. Lints on every push and PR; deploys once the repo has `CLOUDFLARE_API_TOKEN`
and `CLOUDFLARE_ACCOUNT_ID` secrets. Until then, deploy by hand with `make deploy`.

## Tersity

A leaf is a page, not a paper. `tools/tersity.mjs` measures every `site/*.html` except the Viewer
and `make check` fails when any leaf is over budget:

| Measure | Budget | Why |
|---|---|---|
| visible prose words | ≤ 900 | one screenful of reading per leaf |
| words per figure | ≤ 120 | every ~120 words earns a picture; under 120 words no figure is owed |
| longest `<p>` | ≤ 55 words | one breath |
| `.lede` | ≤ 30 words | the italic line under the h1 is a sentence |

Words are text nodes after scripts, styles, comments and SVG are stripped. A figure is a
`<figure>`, a `<table>`, or an inline `<svg>` whose viewBox is at least 100 wide; card glyphs
do not count. Documents under `docs/` are out of scope: the Viewer renders them, they are not
articles. When a leaf is over budget, turn the paragraph into a labelled figure, not a shorter
paragraph.

## Provenance

Every figure on a leaf wears one badge: DERIVED (computed from the Model at load, computation
stated), AUTHORED (an estimate, labelled), or TO CONFIRM (a placeholder). Hub tallies are never typed.
