# PR descriptions: the heraldry filing system

*Source of record for how a 3PT pull request is described, graded, and filed. Adapted 2026-09-26
from the Lanternade Control convention (`lc_dev/release/docs/CONTRIBUTING.md` §4) for a two-person
hackathon: the same six load-bearing parts, a fraction of the words. The template is
`.github/PULL_REQUEST_TEMPLATE.md`; the grader is `scripts/pr-validate.mjs`; the gate is
`.github/workflows/herald.yml`.*

## The rule

**The description file is the PR body.** Author `PR_DESCRIPTION_<NAME>.md` in this directory
first, grade it, commit it as its own `docs(pr):` commit, then `gh pr create --body-file` it.
Never `--body` with a shorter paraphrase: the reviewed copy would be the worse one. The file
stays after the merge; this directory is the reviewable history of why the codebase changed,
one Markdown file per PR, diagrams in Mermaid so GitHub renders them.

## Six sections, in order

| # | Section | Weight | What it must carry |
|---|---|---|---|
| 1 | Coat of Arms | required | the ASCII block, the compact line, the key table |
| 2 | Summary | required | one to three sentences, plus one or two of context |
| 3 | Changes | required | a table of what changed and where; "deliberately not in this PR" |
| 4 | Provenance | required | seeds, the harness version and checkpoint, the agent harness, base and last content commit, the commits table |
| 5 | Test plan and attestation | required | what was run, and the gates table naming anything that did not pass |
| 6 | Completeness | expected | the grader's output pasted in; the degree tracker |

The grader also checks: the ASCII block is real (`╔` and `╚` present, the compact line never
replaces it); no attribution line anywhere; a `⌘` escutcheon line naming the policy version; at
least one `@s` seed cite or the words `new seed`; a commits table with at least one seven-character
SHA.

## Heraldry, 3PT edition

| Element | Values |
|---|---|
| Magnitude | trivial · minor · moderate · major · epic |
| Tincture | the lane: ui 🩶 `#7d8a99` · harness 🟠 `#e0a33a` · infra 🔵 `#3aa6d9` · hub ⚫ `#6b7684` · docs 🟣 `#8b7cf6` · ci 🔴 `#ff6b4a`. Two at most; the primary first. |
| Charges | commit prefixes with counts: `plan` ◆ · `build` ⚒ · `instrument` ⚖ · `media` ▣ · `app` ▭ · `docs` 📖 · `chore` 🔧 · `hub` ⌂ · `ci` ⚙ |
| Dexter supporter | `check`: ✓ green, ✗ failed, ⚪ not run |
| Sinister supporter | `herald`: the completeness grade A to F |
| Escutcheon | `⌘ policy v<n> · cp/<n> · <harness>`: the harness's own version and checkpoint at the time of the work, and which agent harness did it. This is the line that makes a PR a record of the harness building itself. |
| Seeds | `@s<session>.<segment>` from `docs/provenance-index.md`, or `new seed` |
| Motto | Latin, with translation, and no more than one joke |

**Heraldry counts content, not paperwork.** The `docs(pr):` commit that adds the description is
excluded from the charges, the file count and the diffstat. State the base and the last content
commit so the reader reproduces the figures instead of trusting them:

```sh
git diff --shortstat <base>..<last-content-sha>
git log --format=%s <base>..<last-content-sha> | sed -E 's/^([a-z]+)(\(.*\))?:.*/\1/' | sort | uniq -c
```

## The completeness degree tracker

`node scripts/pr-validate.mjs <file>` reports a **grade, not a pass/fail**, because the sections
are not equally load-bearing and a tool that collapses a missing Test plan and a missing
Completeness paste into one "invalid" trains people to ignore it. Required sections weigh 2,
expected sections weigh 1, the block, the escutcheon, the seed cite, the commits table and the
no-attribution check weigh 1 each.

| Grade | Completeness | Meaning |
|---|---|---|
| A | ≥ 95% | ready; the target |
| B | ≥ 85% | **the floor for opening a PR**; `herald.yml` fails below this |
| C | ≥ 70% | a draft |
| D | ≥ 50% | a sketch |
| F | < 50% | not a description |

The tracker checks presence and shape, not truth. Figures that are wrong and sections that are
present but empty pass it; the reviewer is still the reviewer.

## Naming and filing

`PR_DESCRIPTION_<NAME>.md`, `<NAME>` in upper snake case matching the branch slug
(`lane/ci-heraldry` → `PR_DESCRIPTION_CI_HERALDRY.md`). One file per PR, never edited after the
merge except to add a `Landed:` line with the merge SHA. Stacked PRs say so in **Base** and give
the land order.

## Honesty

Name the gate that does not pass. An attestation table that drops a failing row is worse than one
that reports it red, because the reader cannot tell absence from success. ⚪ is "not run", and it
is always accompanied by why.
