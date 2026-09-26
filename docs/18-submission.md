# Submission: what the platform asks, what we film, what we claim, what we build first

*Source of record from 2026-09-26 14:40 ET. Owned by lane T5 (`docs/17-term-2-lanes.md` §5). The checklist rows C-01 to C-05 in
`docs/15-open-source-checklist.md` are ticked from here. §8 is the submission checklist: the links to open and every field with its gate.*
<!-- @s1.04 @s1.22 -->

## 1 · What the platform asks

Read from the event page at 14:35 ET. Quotes are the organizer's words.
<!-- DERIVED: https://cerebralvalley.ai/e/mongodb-nyc-hackathon/details -->

| Ask | Organizer's wording | Where |
|---|---|---|
| Submit | "Teams should submit here when they have completed hacking" | https://cerebralvalley.ai/e/mongodb-nyc-hackathon/hackathon/submit |
| Deadline | 5:00 PM submissions due; 5:15–6:45 PM first-round judging, "~3 minutes to live demo… followed by 1-2 minutes of Q&A" | Assigned rooms |
| Video | "a short one minute demo video… highlighting the specific features, code, and functionality that your team built during the hackathon" | Uploaded in the form; "verify that your video has video & audio playback" (resource guide) |
| Repo | "Repositories must be public" | https://github.com/pastarita/3pt |
| Description | "a concise project description detailing what you built" (resource guide) | §6 below |
| Team | "all team members have been added to the submission page" | Patrick, Yash |
| Demo link | "your demo link is accessible" | Ungated; never the hub behind Access |
| Atlas | "Teams selected as finalists must build their project using the MongoDB Atlas Sandbox… Projects that do not will not be eligible" | Sandbox cluster from the email link, lane T1 |
| Provenance | "Judges must be able to clearly identify what was created during the event. Failure… will result in immediate disqualification" | Commit log, README, §4 |
| Banned | "Image Analyzers", "Basic RAG Applications", "Any project where a dashboard is the main feature" | The loop is the headline; photos are the workload |
| Sept 30 | Finalists present at MongoDB.local NYC; "at least one member… present starting at 10 AM" | Decide who before submitting |

Weights: Technical Demo 35, Implementation Difficulty 30, Impact 20, Creativity 15. "Please do not show us a presentation."

## 2 · The filming tool

Decision basis: no install, no account, a local master file, audio and screen in one take, and a cut that fits the form in under ten minutes.

| Tool | On this Mac | For | Against |
|---|---|---|---|
| **QuickTime Player · New Screen Recording** | yes | Built in; mic picker in the record menu; trim with ⌘T; exports 1080p H.264 `.mov` | No camera overlay; one take per file |
| `screencapture -v -k` | yes | Scriptable capture from a terminal for the loop shot | No mic; separate audio track |
| `ffmpeg` | yes, Homebrew | Concatenate takes, cut to 60 s, normalize loudness, write `.mp4` | Command-line only |
| Loom | installed | Camera bubble, instant share link as the fallback video URL | Needs an account and upload; the file is theirs |
| Phone camera | Yash's | The on-site cut: a superintendent's phone, the room, the team | Shaky; transfer time |

**Decision: QuickTime for the master takes, ffmpeg for the cut, a Loom or unlisted YouTube link as the fallback URL.**
The one-line cut, run from the repo root once the takes are in `~/Movies/3pt/`:

```
ffmpeg -i take1.mov -i take2.mov -filter_complex "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1" -t 60 -c:v libx264 -crf 20 -c:a aac -movflags +faststart 3pt-demo-60s.mp4
```

Check before upload: 60 s or under, audio audible on laptop speakers, the terminal font legible at 1080p, the Atlas UI visible once.

## 3 · Artifacts to produce

Each row is one file or one screen. Done means it exists at the path and the gate holds.

| # | Artifact | Path or place | Owner · lane | Gate | Due |
|---|---|---|---|---|---|
| S1 | 60-second video with audio | `~/Movies/3pt/3pt-demo-60s.mp4`; link recorded in `docs/15` C-02 | Both · T5 | Plays with audio; only today's work on screen | 16:30 |
| S2 | Description, under 150 words | §6 of this file, pasted into the form | Patrick · T5 | Names Statement One, the Sandbox cluster, what was built today | 16:15 |
| S3 | Public repo, today's commit log | https://github.com/pastarita/3pt | Patrick · T6 | `git log --since=today` is the whole history; README lists outside libraries and models | 16:45 |
| S4 | Demo link that opens without login | Ungated Pages preview or Vercel, or "runs locally" plus the repo | Yash · T3 | `curl -sI` returns 200 with no redirect to Access | 16:00 |
| S5 | The live loop, three minutes | Terminal + Atlas UI + the app, in that order | Patrick drives, Yash narrates · T5 | Runs twice in rehearsal without a fix in between | 16:30 |
| S6 | Q&A crib, one page | `docs/18` §7 | Patrick · T4 | Every answer points at a file | 16:15 |
| S7 | Photo credits in the tree | `data/mock/media-pool/CREDITS.md` (Yash, landed 14:14) | Yash · T6 | Every file in the pool has a row | done |
| S8 | Both members on the form; Sept 30 attendee named | The form | Patrick | Confirmed in chat before 16:45 | 16:45 |

## 4 · Claims, and where each one is substantiated

The video and the room say only what a judge can open. Three grades: **built** (in the tree now), **due** (lands with a term 2 gate), **simulated** (the Simulator replays a fixed-seed model; say so on screen).
<!-- DERIVED: harness/packages/core/src/index.ts, harness/packages/instrument/src/index.ts, harness/apps/cli/src/index.ts, data/mock/README.md, hub/site/tour.html voice-over -->

| # | Claim as spoken | Grade | Evidence to open |
|---|---|---|---|
| K1 | The harness's rules are data, versioned, and the loop rewrites them after each run | built | `Policy` in `harness/packages/core`; `rewritePolicy` in `harness/packages/improver`; stages get a frozen policy (`freezePolicy`, `stageStore`) |
| K2 | Every iteration ends in a checkpoint: git sha, policy version, metrics, retrospective | built | `Checkpoint` type; `3pt loop` prints `cp/1` |
| K3 | Checkpoints and policies persist in MongoDB Atlas, in the Sandbox cluster | due · T1 | `atlasStore()` in the atlas battery; the `checkpoints` collection in the Atlas UI |
| K4 | Rollback restores a prior policy version from its checkpoint | due · T1 | `3pt rollback <tag>` today prints the plan; make it read the checkpoint |
| K5 | The workload is construction site photos; the harness learns fields like unit, level, and open or closed wall | due · T2 | `media_index` seeded from `data/mock/acme-builders`; the v1 diff names the fields |
| K6 | 3PT compiles a policy into a Strands harness rather than owning its own loop | built, not compiled | `harness/packages/strands`, excluded from the workspace for disk; `docs/12-strands-archaeology.md` |
| K7 | "It reads sixteen thousand old photos once" and "checks itself on fifty labelled photos" | simulated | `hub/site/sim-data.js`, fixed seed; `expected/harness-versions.json` v0–v10 |
| K8 | "Answers get worse, so it undoes that one by itself" | simulated | Same; the real rollback is K4 and is operator-approved, not automatic |
| K9 | "The Friday owner update took Dev twenty-eight hours a job. One tap, and that tool becomes part of the harness" | simulated | `activity.jsonl` per project; no tool-grant rewrite runs today |
| K10 | 20 real NYC building records; 144 openly licensed photos | built | `data/mock/README.md`; `CREDITS.md`; NYC Open Data `ic3t-wcy2` |
| K11 | Everything was built today | built | Commit log starts 12:46 ET today; `docs/15` A-03 |

Rule for the room: K7–K9 are shown as the Simulator with the word "simulated" on screen, or cut. A judge who opens the repo must find K1–K5 as code, not as a page.

## 5 · Priority order to 5 PM

Ordered. A row starts only when every row above it is green or explicitly parked.
<!-- @s1.22 -->

| P | Do | Lane | Why first | Gate | Slot |
|---|---|---|---|---|---|
| P0 | Sandbox cluster from the email link; `ATLAS_URI` in both `.env` files | T1 | Finalist eligibility and K3; everything below narrates without it | `3pt loop` writes `cp/1` to Atlas | 15:15 |
| P0 | Pull Yash's eight commits, reconcile the vendored skill, commit the dirty tree in segments, push | T6 | Two machines, one `main`; the demo runs from `main` | `main` = `origin/main`, `make check` green | 15:30 |
| P1 | `3pt rollback <tag>` reads the checkpoint and restores the policy | T1 | K4 is the Recursive Harnessing proof in reverse | Rollback returns v0, visible in Atlas | 15:45 |
| P1 | `media_index` seeded from `data/mock/acme-builders`; one Instrument pass whose diff names the photo fields | T2 | K5 makes the workload real, not a slide | `policies` v1 in Atlas mentions unit, level, wall | 15:45 |
| P1 | Record takes: loop in the terminal, Atlas UI, rollback, then the app | T5 | The video is the only artifact a judge sees before the room | Takes in `~/Movies/3pt/` | 16:00 |
| P2 | App or Simulator reads harness versions from Atlas; ungated demo link | T3 | S4 and the "not a dashboard" line: the app shows the loop's output | Link returns 200 unauthenticated | 16:00 |
| P2 | Cut the video; write the description; rehearse twice | T5 | S1, S2, S5 | Each rehearsal under three minutes | 16:30 |
| P3 | Strands journey leaf and the Q&A crib | T4 | Implementation Difficulty in Q&A | `make -C hub check` green | 16:15 |
| P3 | Checklist rows B-05 to B-10, C-01 to C-05 ticked; CI secrets | T6 | Admissibility | Rows ticked with evidence | 16:45 |
| park | Strands package compiled; Kiro as second builder; automatic rollback; tool-grant rewrite | — | Not reachable by 16:45; say "next" in Q&A | — | — |

Freeze at 16:45: `main`, the hub, the video, the form. Submit by 16:50; the platform, not the clock, confirms.

## 6 · Description for the form

Under 150 words. Fill the bracket from T1's gate before pasting.

> **3PT (Three Point Harness)** is a self-improving harness for coding agents, built today for Problem Statement One, Recursive Harnessing. Three stages, Plan → Build → Instrument, run in a loop. Instrument rewrites the harness's own rules, context policies, and tool grants as data, and every iteration ends in a checkpoint (git sha, policy version, metrics, retrospective) persisted to the MongoDB Atlas Sandbox cluster [cluster name]. Roll back to any checkpoint and the harness runs the earlier policy. The workload is media-heavy: a construction firm's site photos (144 openly licensed images, 20 real NYC building records), which stress memory, storage tiering, and context policy. 3PT compiles a policy into an AWS Strands harness instead of owning its own loop. Everything in the repo was written today: monorepo, harness, Atlas battery, sandbox provisioning, the inspector app, and the docs of record. Team: Patrick Astarita, Yash Kothari.

## 7 · Q&A crib

| Likely question | Answer, and the file to open |
|---|---|
| What did the harness change about itself? | The policy diff v0 → v1: rules, context policy, tool grants. `harness/packages/instrument/src/index.ts` |
| Where is that stored? | `policies` and `checkpoints` in the Sandbox cluster. `COLLECTIONS` in `harness/packages/core` |
| How do you roll back? | `3pt rollback <tag>` reads the checkpoint, restores the policy version. `harness/apps/cli/src/index.ts` |
| Why not just prompts? | State machine over three stages, checkpoint schema, a policy compiler onto Strands, a measurement register. `docs/07-assessment-and-measurement.md` §3, `docs/12-strands-archaeology.md` |
| Isn't this an image analyzer? | Images are the workload the policy learns on; nothing classifies images as a product. `docs/05-rules.md` § Implications |
| What is simulated? | The Simulator replays a fixed-seed firm across seven years; the loop, the checkpoints, and Atlas are real. `data/mock/README.md` |
| What was built before today? | Nothing. First commit 12:46 ET today; libraries are npm dependencies. `docs/15-open-source-checklist.md` A-03 |
| What is next? | Compile the Strands package, a second builder harness, automatic rollback under a metric gate. `docs/17-term-2-lanes.md` §5 park row |

## 8 · Submission checklist

One table, in the order the form is filled. Open the three links first. A row is done when its gate holds, not when
the box is ticked. Status as of 16:30 ET: every row **TO CONFIRM** until a human runs the gate; `docs/15` C-01 to C-05
tick from here.
<!-- DERIVED: §1 above, docs/sources/hackathon-resource-guide.md § Cerebral Valley Platform, docs/15-open-source-checklist.md § C -->

**Links to open**

| Open | URL | Why |
|---|---|---|
| The form | https://cerebralvalley.ai/e/mongodb-nyc-hackathon/hackathon/submit | Where the submission is filed |
| The event page | https://cerebralvalley.ai/e/mongodb-nyc-hackathon/details | The organizer's wording for every ask |
| The resource guide | https://docs.google.com/document/d/13c8je_4unbaLLMGYhCO58zMKx4eZZ_GcuYhrUSONld8/edit | "You will submit" is quoted from here; local copy in `docs/sources/` |
| The repo | https://github.com/pastarita/3pt | Must read PUBLIC |
| The demo | https://3pt-web.pages.dev and https://3pt-harness.3pt-worker.workers.dev/health | Must open without a login; `/health` says `"store":"atlas"` |
| The Sandbox project | https://cloud.mongodb.com/v2/6ab80ef67d3d0c27d97a4b0e | `Cluster0`; open `checkpoints` on screen for the demo |

**The rows**

| # | Field or requirement | Fill with | Gate | Owner |
|---|---|---|---|---|
| F-01 | [ ] Team members on the submission | Patrick Astarita, Yash Kothari, both on the platform and checked in | Both names visible on the form; A-08, C-04 | Patrick |
| F-02 | [ ] Project name and one line | 3PT, Three Point Harness; "the harness rewrote its rules; approve or roll back" | Matches README title and banner | Patrick |
| F-03 | [ ] Description | §6 above, under 150 words, cluster name filled (`Cluster0`, Sandbox org) | Names Statement One, the Sandbox cluster, and what was built today; C-03 | Patrick |
| F-04 | [ ] Public GitHub repository link | https://github.com/pastarita/3pt | `gh repo view --json visibility` says PUBLIC; A-01, C-01 | Patrick |
| F-05 | [ ] 1-minute demo video with audio | `~/Movies/3pt/3pt-demo-60s.mp4` uploaded, or the Loom / unlisted YouTube URL | 60 s or under; plays with audio on laptop speakers; only today's work on screen; C-02 | Both |
| F-06 | [ ] Demo link | https://3pt-web.pages.dev | `curl -sI` returns 200 with no redirect to Access; never the hub; C-05 | Yash |
| F-07 | [ ] Problem statement named | Statement One, Recursive Harnessing | In the description and the README; A-10 | Patrick |
| F-08 | [ ] Built in the Atlas Hackathon Sandbox | Org `69ef9daf03d2ce35c2657862`, project `6ab80ef67d3d0c27d97a4b0e`, `Cluster0` | A checkpoint visible in `checkpoints` in that project; Worker `/health` says atlas; A-04 | Patrick |
| F-09 | [ ] Everything on screen was built today | Commit log, README, `docs/15` A-02 | `git log --reverse` first commit today; nothing vendored; A-02, A-03 | Patrick |
| F-10 | [ ] Not a banned type | The loop is the headline; photos are the workload; the app is an inspector | The video opens on the terminal loop, not on the app; A-06 | Both |
| F-11 | [ ] Rights to code, data, assets | `LICENSE` MIT; `THIRD_PARTY.md`; `data/mock/media-pool/CREDITS.md` | Every photo has a credit row; fonts carry OFL; A-07, B-05, B-06, B-08 | Yash |
| F-12 | [ ] Secrets out of the tree | `.env` gitignored; `.env.example` placeholders only | The B-03 grep block in `docs/15` § Verification is empty | Patrick |
| F-13 | [ ] Sept 30 attendee named | One of the two at Pier 36, 10:00 to 16:30 | Decided in chat before 16:45; S8 | Both |
| F-14 | [ ] `main` frozen and green | `main` = `origin/main`; `make check` green; hub deployed | Freeze at 16:45; no push after | Patrick |
| F-15 | [ ] Submitted, and the platform confirms | Press submit by 16:50 | The confirmation screen, screenshotted into `docs/assets/` | Patrick |

**Before pressing submit, in order:** F-04 (public), F-06 (demo opens), F-05 (video plays), F-03 (description pasted), F-01
(both names), F-15. Everything else is evidence for the room, not for the form.
