# Group decisions: the walkthrough

*Source of record for what the two principals must decide together, and later for what they
decided. Written 2026-09-26 13:50 ET against everything the hub holds. Submissions close at
5:00 PM ET. Walk this top to bottom by voice; it is built to be read aloud.*

## How to use this document

1. **Transcribe as you go.** Open `brainstorming.md`, add `## Session 2 (2026-09-26)`, and before
   each domain say its number and drop a marker: `<!-- s2.01 PY -->` for domain 1, `<!-- s2.02 PY -->`
   for domain 2, and so on. Speak; do not clean up.
2. **Answer the questions in order.** Each domain has a few questions, a default that applies if
   you run out of time, and a blank decision line.
3. **Record the decision** on the domain's `Decided:` line in one sentence, then cite the segment
   it came from with `<!-- @s2.NN -->` under the heading. Skip a question only by saying "default".
4. **After the walk:** `node scripts/prov.mjs --bake && node scripts/prov.mjs`, commit, push. The
   Timeline shows the decisions as a second session; the open-question count on the hub drops.

Domains are ordered so that each decision narrows the next. Do not skip ahead.

---

## 1 · Who the demo is for
<!-- @s1.30 @s1.26 @s1.18 @s1.13 -->

The direction leaf already narrates a construction firm's site photos. The ICP doc still names the
pipeline-building engineer as the hackathon buyer. The explorer scores five directions and the
directions brief says nothing is decided. Three documents, three answers.

1. Which one direction do we build and pitch today: construction, interior design, or the
   pipeline-building engineer?
2. Is the persona on stage the business owner (construction PM) or the engineer who owns the
   harness? One person, one sentence about them.
3. What is the sample corpus, where does it come from, and can it be in Atlas within an hour?
4. What is the one-line pitch we say first, before any screen is shown?

**Default if undecided:** construction, as the direction leaf and its video plan already assume;
persona is the PM; corpus is whatever site-photo set we can get fastest; pitch is
"The harness is general. The demo is construction."

**Decided:** 

---

## 2 · What ships by 5 PM
<!-- @s1.22 @s1.12 @s1.04 -->

The assessment names 13 Must requirements. The monorepo runs one loop iteration against a memory
store. Nothing writes to Atlas yet.

1. Which single live sequence is the demo: Plan picks a sprint mode → Build negotiates → Instrument
   rewrites `policies` → checkpoint lands in Atlas → rollback. Yes or narrower?
2. Of the 13 Musts, which three could we drop and still make H-1, H-5, H-6 decidable on stage?
3. Is the second builder harness (Kiro) in or out today? In means the "any harness" claim is
   demonstrated; out means it is narrated.
4. What is the hard cut time after which no feature starts, only the demo is rehearsed?

**Default if undecided:** the full sequence above, Kiro out, cut at 3:45 PM.

**Decided:** 

---

## 3 · Compliance and submission logistics
<!-- @s1.16 -->

Hard requirements, all unchecked in the rules doc.

1. Who flips the repo public, and when? It must be before the submission form is sent.
2. Has the Atlas Hackathon Sandbox cluster been created? If not, who does it in the next 30
   minutes, and does every stateful thing move onto it?
3. Who is on the submission (all members added), who records the 1-minute video with audio, and
   is the narration the harness's own retrospective (R-30) or a person?
4. Who presents the 3-minute demo and who takes Q&A? When are the two rehearsals?

**Default if undecided:** Patrick flips public and creates the Sandbox now; Yash records the
video; both rehearse at 4:00 and 4:30; Patrick demos, Yash answers.

**Decided:** 

---

## 4 · Architecture open items
<!-- @s1.14 @s1.07 -->

Decided: Turborepo + pnpm, three lanes, GridFS default, no Mermaid in the Viewer. Open in the
architecture doc:

1. Worker runtime: node locally for the demo, or deploy the Cloudflare Worker today?
2. Web inspector host: a second Pages project, or v0, or neither (Swift only)?
3. Atlas driver in the atlas battery: who adds `mongodb` and `ATLAS_URI` and makes `provision`
   real instead of printing its plan?
4. Blob tier: stay on GridFS inside the Sandbox for eligibility, or is R2 needed for the corpus size?

**Default if undecided:** node locally; no separate inspector host; Patrick wires the driver right
after the Sandbox exists; GridFS.

**Decided:** 

---

## 5 · Which surface the judges see
<!-- @s1.09 @s1.29 @s1.16 -->

Three surfaces exist in `ui/`: PWA, web, macOS Swift. The rules say the UI is an inspector,
never the headline. The vision wants the spatial thumbnail view and the harness-evolution view.

1. One surface for the demo. Which?
2. Does it open on the policy version diff (the self-rewrite), as the design proposal insists, or
   on the media flow?
3. Is the spatial thumbnail stack shown at all today, or narrated as roadmap?
4. Does the install loop between both machines get demonstrated, or only the running app?

**Default if undecided:** the web inspector, opening on the policy diff; thumbnails narrated;
install loop not shown.

**Decided:** 

---

## 6 · Design system
<!-- @s1.30 -->

The proposal offers six pieces and three canonical directions, with a fit matrix against the ICP
directions and a ballot. Its own rule: the design decision follows the ICP decision.

1. Given domain 1, which canonical direction, or which mix of pieces?
2. Do we lock it now and regenerate the hub tokens and shell from it today, or freeze the hub as
   is and apply the system only to the demo surface?
3. For any split vote, the tie-break in the proposal stands: shape, motion, iconography to the
   Swift and shell lane; colour, type, motif to the ICP and lander lane. Agreed?

**Default if undecided:** the direction the fit matrix ranks first for the chosen ICP; hub frozen;
demo surface only; tie-break as written.

**Decided:** 

---

## 7 · Measurement and partner infrastructure
<!-- @s1.03 @s1.17 -->

Four questions carried in the assessment, plus which credits actually get used.

1. Embeddings: Atlas Automated Embeddings (R-5) if available on the Sandbox tier, else Voyage
   text (R-16). Has anyone checked the tier?
2. Voyage multimodal (R-17): in, out, or after the hackathon?
3. LangGraph MongoDB checkpointer (R-27): does its collection layout collide with ours, and do we
   namespace ours?
4. Which of the M-* metrics are live on stage: at minimum M-1 tokens, M-4 pass rate, M-11 policy
   diff size? Anything else is narrated.
5. Which partner credits do we redeem in the next hour, and which do we ignore?

**Default if undecided:** Voyage text; multimodal out; namespace our `checkpoints` collection;
M-1, M-4, M-11 live; redeem MongoDB, OpenRouter, LangSmith, Voyage; ignore the rest.

**Decided:** 

---

## 8 · Lanes and ownership
<!-- @s1.15 @s1.16 -->

Lanes 2 through 5 have no owner on the board. The suggested split was never confirmed.

1. Confirm or change: Patrick on repo, workflow, Swift, Stack; Yash on ICP, statement of need,
   Backend, agent contextualization.
2. Who owns the demo script and who owns the video? Both were marked shared.
3. Is Yash on the repo as a collaborator and on the hub's Access policy now? If not, that is the
   first action after this walk.

**Default if undecided:** the suggested split as written; script Patrick, video Yash.

**Decided:** 

---

## 9 · Process for the rest of the day
<!-- @s1.16 @s1.04 -->

1. Commit cadence: push on every green `make check`, or batch?
2. Worktrees: every agent verifies in a throwaway worktree before pushing, per the policy. Agreed?
3. Every decision from this walk lands in the transcript as Session 2 and gets cited from the doc
   it changes. Who runs the bake and the regenerate before the submission push?
4. What is frozen at 4:45 PM: `main`, the hub, the video, the form?

**Default if undecided:** push on green; worktree policy stands; Patrick bakes; everything frozen
at 4:45.

**Decided:** 

---

## After the walk

- Record the decision on every `Decided:` line above, cite its segment, bake, regenerate, push.
- Update `docs/01-icp.md` (domain 1), `docs/10-architecture.md` §6 (domain 4),
  `docs/11-design-system.html` status line (domain 6), the lane board (domain 8), and tick the hard
  requirements in `docs/05-rules.md` (domain 3).
- Run `scripts/worktree.sh gc`, then rehearse.
