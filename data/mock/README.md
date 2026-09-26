# Mock data: Acme Builders

Example data for the 3PT demo. Acme Builders is a made-up general contractor. It has worked on 20
projects since 2019, with at most 4 live at once. On demo day (2026-09-26) it has 4 live projects,
each in a different phase.

## What is real and what is made up

| Part | Source | Real? |
|---|---|---|
| 20 buildings: street, neighborhood, type, stories, floor area | NYC Open Data, DOB Job Application Filings (`ic3t-wcy2`), raw pull in `sources/` | Real records. House numbers and personal names are dropped. |
| Photos | `media-pool/`, openly licensed (CC0, public domain, CC BY, CC BY-SA). Credits in `media-pool/CREDITS.md` | Real photos, not of these buildings |
| Firm, dates, schedule, people, activity, outcomes | `hub/site/sim-data.js`, fixed seed | Made up |

## Layout

```
data/mock/
  sources/nyc-dob-nb-filings.json   raw pull from NYC Open Data
  media-pool/<trade>/*.jpg          licensed photos + credits.json + CREDITS.md
  acme-builders/
    firm.json                       firm, roles, sources
    index.json                      one row per project
    projects/<id>-<name>/
      project.json                  building, phases, dates
      media/<year>-W<week>.jsonl    weekly photo drop, one line per photo
      activity.jsonl                searches, taps, owner packs built by hand
      outcomes.jsonl                walls reopened, water stains, missing photos
    expected/harness-versions.json  what the harness should learn from this data
```

## Regenerate

```
node scripts/mock/export.mjs
```

The hub simulator (`hub/site/sim.html`) and the app (`hub/site/app.html`) read the same model,
so the folders and the screens always agree.
