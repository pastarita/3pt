# Third-party material

The code in this repo is MIT (see `LICENSE`). The material below is not ours. Each item keeps its own licence.
Checked 2026-09-26: every item is free to use, including commercially. Nothing is non-commercial (NC) or no-derivatives (ND).

| Material | Where | Licence | What we must do |
|---|---|---|---|
| 117 construction photos (demo firm) | `data/mock/media-pool/` | CC0 12 · public domain 8 · CC BY 58 · CC BY-SA 39 | Credit each CC BY / CC BY-SA photo: `data/mock/media-pool/CREDITS.md`. Resized copies of CC BY-SA photos stay CC BY-SA. |
| 27 construction photos (web app) | `ui/apps/web/public/photos/`, `hub/site/photos/` | CC0 17 · public domain 10 | None required. Sources are listed in `credits.json` anyway. The 2 CC BY photos were replaced on 2026-09-26. |
| 20 building records | `data/mock/sources/nyc-dob-nb-filings.json` | NYC Open Data. NYC Admin Code § 23-502(d): data sets are available "without any registration requirement, license requirement or restrictions on their use" | None required. We name the source anyway. Personal names and house numbers are not stored. |
| Fonts: Familjen Grotesk, IBM Plex Sans, IBM Plex Mono, Instrument Sans, Instrument Serif, JetBrains Mono | `hub/site/fonts/` | SIL Open Font License 1.1 | Ship the licence with the fonts: `hub/site/fonts/OFL-*.txt`. Do not sell the fonts on their own. |
| hub-workspace skill | `.claude/skills/hub-workspace/` | its own `LICENSE` | Keep the file. |

How the licences were checked:
- Photos: the licence field from the Openverse API and the Wikimedia Commons API, per file. The 8 public-domain
  photos were checked again on 2026-09-26 (6 on Commons: `License = pd`; 2 on Flickr through Openverse: Public Domain Mark 1.0).
- NYC Open Data: Local Law 11 of 2012, NYC Admin Code § 23-502(d).
- Fonts: the `OFL.txt` of each family in the google/fonts repository.
