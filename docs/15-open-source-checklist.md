# Open-source and submission checklist

*Source of record for making `pastarita/3pt` an admissible, publishable open-source project.
Two ledgers: what the hackathon requires (`docs/05-rules.md`), and what an open-source release
requires on top of it. Every row wears a status. **DERIVED** was checked by a command on
2026-09-26; **AUTHORED** is our decision; **TO CONFIRM** needs a human. Tick the box when done,
and keep the status honest. Run the verification block at the bottom before submitting.*

Status at last pass · 2026-09-26 14:00 ET

| Ledger | Done | Open |
|---|---|---|
| A · Admissibility | 3 | 7 |
| B · Open-source hygiene | 4 | 7 |
| C · Submission package | 0 | 5 |

## A · Admissibility (hard requirements, `docs/05-rules.md`)

| id | Item | Status | Evidence / where |
|---|---|---|---|
| A-01 | [x] Repository is **public** | DERIVED | `gh repo view pastarita/3pt` → PUBLIC |
| A-02 | [x] **New work only.** Every commit is dated today | DERIVED | `git log --reverse` first commit 2026-09-26 11:56 ET |
| A-03 | [x] No pre-existing project code imported; public libraries only | DERIVED | Strands, Turborepo, MongoDB driver arrive as npm dependencies; `harness/packages/strands` is our compiler over them (`docs/12-strands-archaeology.md`) |
| A-04 | [ ] **MongoDB Atlas is a core component**, running in the **Atlas Hackathon Sandbox** | TO CONFIRM | Sandbox cluster not yet created (`CLAUDE.md` current state). Set `ATLAS_URI` from the Sandbox, run `3pt loop`, show a checkpoint in `COLLECTIONS.checkpoints` |
| A-05 | [ ] Demo shows features, code, functionality, **not a presentation** | AUTHORED | Live: the loop runs, Instrument rewrites a policy, checkpoint lands in Atlas, roll back. Plan: `hub/site/direction.html` |
| A-06 | [ ] Not an image analyzer, dashboard, or basic RAG | AUTHORED | Headline is the recursive loop; images are the workload; UI is an inspector. Re-read `docs/05-rules.md` § Implications before the demo |
| A-07 | [ ] **Rights to all code, data, and assets** | TO CONFIRM | Code: ours + MIT/Apache deps (B-05). Assets: fonts (B-06), banner (ours). Data: the demo image corpus must be ours or CC0 (B-08) |
| A-08 | [ ] **All team members on the submission** and on the repo | TO CONFIRM | Yash Kothari as collaborator on `pastarita/3pt`; both names on the Cerebral Valley form |
| A-09 | [ ] Team size ≤ 4 | DERIVED | Two: Patrick Astarita, Yash Kothari |
| A-10 | [ ] Problem statement named in the description | AUTHORED | Statement 1, Recursive Harnessing; Statement 2 touched via checkpoint memory |

## B · Open-source hygiene

| id | Item | Status | Evidence / where |
|---|---|---|---|
| B-01 | [x] **License file** at the root | DERIVED | `LICENSE`, MIT, copyright Patrick Astarita and Yash Kothari |
| B-02 | [x] `license` field in the root `package.json` | DERIVED | `"license": "MIT"` |
| B-03 | [x] **No secrets in the tree or the history** | DERIVED | `git log --all -- .env '*.pem'` empty; token-pattern grep (`sk-`, `ghp_`, `AKIA`, `mongodb+srv://` with credentials, PEM headers) empty; `.env` gitignored, `.env.example` holds placeholders only |
| B-04 | [x] Hub credentials never in the repo | DERIVED | `ACCESS_PASS`, Cloudflare tokens live in Pages secrets and `~/.config/3pt/`; `hub/functions/_middleware.js` verifies, never embeds |
| B-05 | [ ] **Third-party licenses compatible** with MIT | TO CONFIRM | Strands is Apache-2.0 (`docs/12-strands-archaeology.md` S1), consumed as a dependency, nothing vendored. Run `pnpm licenses list` and check for GPL/AGPL/unknown |
| B-06 | [ ] **Vendored fonts carry their license** | TO CONFIRM | `hub/site/fonts/` holds Familjen Grotesk, IBM Plex, Instrument Sans/Serif, JetBrains Mono (all SIL OFL 1.1 upstream) with no license file beside them. Add `hub/site/fonts/LICENSE-OFL.txt` via `hub/tools/vendor-fonts.sh` |
| B-07 | [ ] **Personal emails in a public repo**: keep or redact | TO CONFIRM | `CLAUDE.md:120`, `AGENTS.md:116`, `hub/README.md:92`, `hub/functions/_middleware.js:19` list team gmail and factorita addresses; `docs/05-rules.md:77` has the organizer's email and the venue Wi-Fi SSID. Decision: replace personal gmails with "see the Access policy", drop the SSID |
| B-08 | [ ] **Demo image corpus rights** | TO CONFIRM | Use the team's own site photos or a CC0 set; name the source in `docs/06-goal-and-use-case.md` |
| B-09 | [ ] **Transcript consent**: `brainstorming.md` is both people's speech, public | TO CONFIRM | Yash agrees to publish Session 1 verbatim; `scripts/prompts.mjs` already redacts secrets from appended sessions |
| B-10 | [ ] **Verbatim copy of the organizer's resource guide** | TO CONFIRM | `docs/sources/hackathon-resource-guide.md` mirrors a Google Doc. Either keep with the source line it already carries, or replace with the link. Ask ajc@cerebralvalley.ai if unsure |
| B-11 | [ ] README states license, team, and how to run | DERIVED | `README.md` § Team, § License, § Hub workspace; install loop in `docs/03-workflow.md` |

## C · Submission package (Cerebral Valley platform, due 5:00 PM ET)

| id | Item | Status | Where it comes from |
|---|---|---|---|
| C-01 | [ ] Public repo link | DERIVED | https://github.com/pastarita/3pt |
| C-02 | [ ] 1-minute demo video **with audio** | AUTHORED | Tool, cut and gate in `docs/18-submission.md` §2–3; shot list in `hub/site/direction.html`; record the live loop, not slides |
| C-03 | [ ] Description: what, problem statement, Atlas role, what was built today | AUTHORED | Text ready in `docs/18-submission.md` §6; fill the cluster name from T1 |
| C-04 | [ ] Both members added | TO CONFIRM | A-08 |
| C-05 | [ ] Demo link accessible to judges | TO CONFIRM | The hub is behind Access by design; the demo runs locally or on a public preview. Do not send judges a gated link |

## Verification (run before submitting)

```sh
gh repo view pastarita/3pt --json visibility -q .visibility          # A-01 → PUBLIC
git log --reverse --format=%ci | head -1                              # A-02 → today
git log --all --oneline -- .env '*.pem' '*.p12'                       # B-03 → empty
git grep -nE '(sk-|ghp_|github_pat_|AKIA[0-9A-Z]{12}|xox[bp]-|-----BEGIN)' -- . ':!*.example'   # B-03 → empty
git grep -nEo '[A-Za-z0-9._%+-]+@(gmail|factorita)\.[a-z]+'           # B-07 → list to review
pnpm licenses list 2>/dev/null | grep -iE 'gpl|unknown'               # B-05 → empty
ls hub/site/fonts | grep -i license                                   # B-06 → a license file
test -f LICENSE && grep -q MIT LICENSE && echo LICENSE ok             # B-01
```
