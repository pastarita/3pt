<!-- 3PT · PR heraldry, six sections. Convention and grading: docs/pr-descriptions/README.md.
     Author the description as docs/pr-descriptions/PR_DESCRIPTION_<NAME>.md and open with
     `gh pr create --body-file <that file>`; this template is the shape, the file is the body.
     Terse: a hackathon PR should grade A in under two hundred lines. -->

# PR: {title, imperative}

**Branch:** `lane/{slug}` · **Base:** `main` · **Status:** Draft | Ready

## 1 · Coat of Arms

```
╔══════════════════════════════════════════╗
║   lane/{slug}                            ║
╠══════════════════════════════════════════╣
║           ⚜  {MAGNITUDE}  ⚜              ║
║                                          ║
║           {tincture emoji} 🛡 {tincture emoji}          ║
║      check {✓|✗|⚪}        herald {A–F}    ║
║        {charge} × {n}   {charge} × {n}   ║
║                                          ║
║     ⌘ policy v{n} · cp/{n} · {harness}   ║
║        seeds @s{N}.{NN} {…}              ║
║                                          ║
║       📁 {files}  |  +{add} / −{del}      ║
╠══════════════════════════════════════════╣
║   "{motto, Latin}"                       ║
║   {translation}                          ║
╚══════════════════════════════════════════╝
```

**Compact:** ⚜ {tinctures} 🛡 {charges} check {state} herald {grade} · ⌘ v{n} cp/{n} · 📁{files} +{add}/−{del}

| Element | Value | Meaning |
|---|---|---|
| Magnitude | {trivial · minor · moderate · major · epic} | {one clause} |
| Tincture | {lane emoji + hex} | {lane: ui · harness · infra · hub · docs · ci} |
| Charges | {prefix × count} | commits by prefix, content only |
| Dexter supporter | check {state} | `make check` on the committed tree |
| Sinister supporter | herald {grade} | `scripts/pr-validate.mjs` on this body |
| Escutcheon | ⌘ policy v{n} · cp/{n} · {harness} | the harness version and checkpoint this was built under, and which agent harness built it |
| Seeds | @s{N}.{NN} | brainstorm segments this grew from, or `new seed` |
| Motto | "{Latin}" | {translation} |

## 2 · Summary

{One to three sentences: what, why, impact.} **Context:** {what was wrong or missing, one or two sentences.}

## 3 · Changes

| Change | Where | Status |
|---|---|---|
| {what} | `{path}` | ✅ |

**Deliberately not in this PR:** {one line each, or "nothing"}.

## 4 · Provenance

- **Seeds:** {`@s1.NN` cites, with one clause each} or `new seed`, then say where the idea came from.
- **Harness:** policy `v{n}`, checkpoint `cp/{n}`, built by `{claude-code | kiro | codex | hand}`; sprint mode `{feature | improvement | fix}`.
- **Base and last content commit:** `{base-sha}..{sha}`; reproduce the figures with `git diff --shortstat {base}..{sha}`.

| SHA | Subject |
|---|---|
| `{sha}` | `{prefix}: {subject}` |

## 5 · Test plan and attestation

- [ ] {what was run, with the result}

| Gate | Result |
|---|---|
| herald (branch · prefixes · body) | ✅ / ⚠ / ⚪ not run |
| check (build · typecheck · hub lints · provenance) | ✅ / ✗ / ⚪ not run, and why |
| preview walked | ✅ / ⚪ |

Name the gate that does not pass. ⚪ means not run; never leave a row out.

## 6 · Completeness

```
{paste of: node scripts/pr-validate.mjs docs/pr-descriptions/PR_DESCRIPTION_<NAME>.md}
```

<!-- No attribution lines. No time estimates. Diagrams in Mermaid only. -->
