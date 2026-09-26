# 3PT — Three Point Harness for Media-Heavy Workflows
<!-- @s1.01 -->

**MongoDB × Cerebral Valley — The Harness Engineering & Model Wrangling Hackathon, NYC, 2026-09-26.**
Problem Statement 1: Recursive Harnessing.

3PT is a self-improving meta-harness for coding agents (Claude Code, Kiro, Codex, or anything
else). It runs a three-stage loop — **Plan → Build → Instrument** — and the Instrument stage
rewrites the harness's own rules, context policies, and tool grants, persisting every checkpoint
to MongoDB Atlas. The workload it operates on is media-heavy (image corpora), which is what
stresses memory, storage tiering, and context policy hard enough to make self-improvement necessary.

The harness is the product. Images are the workload. Any UI is a secondary inspector.

## Status

Docs of record are written. No application code yet, by decision. See `docs/02-lanes.md`
for who is doing what and `docs/03-workflow.md` for how code will land.

## Layout

| Path | What lives here |
|---|---|
| `CLAUDE.md` / `AGENTS.md` | Context every coding agent loads before touching this repo |
| `docs/00-vision.md` | What 3PT is and why |
| `docs/01-icp.md` | Who it is for |
| `docs/02-lanes.md` | Lanes, owners, Stack/UI/Backend split |
| `docs/03-workflow.md` | Repo layout, pipeline skeleton, DevX, the install loop |
| `docs/04-resources.md` | Partners, MCPs, credits, and which 3PT slot each fills |
| `docs/05-rules.md` | Rules, banned projects, judging weights, deadlines |
| `brainstorming.md` | Raw transcript blocks, append-only; assessed in `docs/07-assessment-and-measurement.md` |
| `docs/sources/` | Verbatim local copies of external source documents (the hackathon resource guide) |
| `docs/07-assessment-and-measurement.md` | Theses and hypotheses converged from the transcript, the measurement system (M-*), and the partner-incentive mapping to a requirement set (R-*) |
| `docs/06-goal-and-use-case.md` | Goal over time, interior-design use case, value props, screen-capture onboarding |
| `docs/07-direction.html` | Visual direction page: construction demo, stress test, 60-second video plan. Open in a browser |
| `docs/08-icp-directions.md` | Five ICP directions side by side: focus, use case, company type, lander messaging, plausibility, rule risk |
| `docs/glossary.md` | Terms |
| `hub/` | The gated hub workspace, fully self-contained: site, gate, tools, deploy config. See `hub/README.md`. |

## Hub workspace

The docs above are rendered, behind a login, at **https://3pt.pages.dev**. Every PR touching
`hub/` or `docs/` gets a preview URL. Everything about it is cordoned under `hub/`; the only
file outside it is `.github/workflows/deploy.yml`, scoped to those paths.

```sh
make -C hub preview   # local preview at http://127.0.0.1:8000/
make -C hub check     # lints
make -C hub deploy    # production deploy
```

## Team

Patrick Astarita, Yash.
