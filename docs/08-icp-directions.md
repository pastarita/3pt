# ICP Directions: Exploration

*Source of record for the qualitative briefs. Scores and presets live in `hub/3pt-data.js` and
render in the hub's ICP explorer. Written 2026-09-26 while the ICP is still being dialed in.
Nothing here is decided; the decision gets recorded in `docs/01-icp.md`.*

## Why we are exploring rather than deciding
<!-- @s1.30 -->

We are set on the direction: a self-improving harness for media-heavy workflows. What is not set
is the aperture. Yash raised interior design; Patrick raised construction; Yash's first framing
was advertising, marketing, and trend analysis. Each implies a different focus, example use case,
example company type, and a different lander. This document lays them side by side so the
messaging, the design system, and the explainers can be written for one of them without
guessing.

Three questions per direction:

1. **Focus.** What the harness gets good at over time for this customer.
2. **Example use case.** The concrete loop a demo would show.
3. **Example company type.** Who the lander speaks to, in their own words.

Then the estimations: lander messaging, what a fully instantiated app would do, how plausible it
is by 5 PM today, and how it sits against the banned list.

## The gate before the ranking

The rules ban Image Analyzers, dashboards as the main feature, and basic RAG. Any direction
whose demo *is* "look at these images and tell me something" is disqualified regardless of score.
Every direction below is written so the demo shows the **harness rewriting its own policies**
over a media corpus, and the media content stays incidental. The advertising direction is the
one closest to the line.

---

## Direction A: Interior design studio
<!-- @s1.26 -->

*Raised by Yash.*

**Focus.** Learning what the studio keeps remaking across projects and turning it into offered
building blocks. Renders, CAD, mood boards, and FF&E schedules pile up; the harness learns the
studio's signature and its repetition.

**Example use case.** A studio finishes its fortieth residential project. The harness has
indexed every render and drawing, transcribed each once, and noticed that a particular wall
treatment, a lighting layout, and a millwork detail recur across a dozen jobs. It proposes
parametrized templates, and the next time a designer starts a room it offers them. The harness
also decided, on its own, that it no longer needs to store full-resolution renders of superseded
options in hot storage and rewrote its tiering policy.

**Example company type.** A 10 to 40 person residential or commercial interiors studio with a
render pipeline, a CAD or Blender practice, and a marketing need to show finished work.

**Lander messaging.**
- Headline: *Your studio already drew that wall. 3PT remembers.*
- Subhead: A harness that organizes everything your studio produces, learns what repeats, and
  hands the repeats back as building blocks.
- Value props: (1) Every render and drawing indexed and transcribed once, never re-read.
  (2) Repetition becomes templates you did not have to write. (3) Two streams from one base:
  the deliverable work and the marketing work that wins the next client.

**Fully instantiated app.** Ingest from the studio's file shares and render outputs. Atlas holds
the media index, read-once transcripts, embeddings, tiering metadata, and the harness's policies
and checkpoints. Plan reads repetition metrics and picks a sprint mode. Build writes the template
generator. Instrument checks it, rewrites the tool grants and context policies, checkpoints. A
Swift inspector shows media flows and the harness's own evolution.

**Plausibility today.** Medium. The story is crisp and the media is repetitive, which is the
fuel. Sample data is the problem: we need renders and drawings in Atlas within two hours, and we
do not have a studio's corpus. Public architectural render datasets or generated placeholder
sets are the fallback.

**Rule risk.** Low if the demo leads with the policy rewrite and the template proposal, not
with "the harness looked at renders."

---

## Direction B: Construction general contractor or specialty subcontractor
<!-- @s1.18 -->

*Raised by Patrick.*

**Focus.** Learning from the daily flood of site photos, submittals, RFIs, as-builts, and drone
captures what a crew does repeatedly and where the same problems recur, then turning that into
checklists, templates, and automations owned by the contractor rather than by a data-mining
vendor.

**Example use case.** A specialty sub with fifteen active jobs receives hundreds of site photos
a day. The harness indexes and transcribes them once, correlates with the submittal and RFI
stream, and over weeks notices that a particular flashing detail generates an RFI on most jobs.
It proposes a pre-install checklist and a photo protocol, and it dials down the drone capture
stream on jobs where it stopped paying for itself.

**Example company type.** A general contractor or specialty subcontractor, 50 to 500 people,
with site superintendents on phones and a project-management system full of media nobody
re-reads.

**Lander messaging.**
- Headline: *Every site photo becomes a lesson your next job already knows.*
- Subhead: A harness that turns your jobsite media into checklists, templates, and automations
  your company owns.
- Value props: (1) Photos, submittals, and RFIs indexed and transcribed once. (2) Recurring
  problems surface as protocols before the next job starts. (3) Storage and capture streams
  tuned by the harness so you keep what pays and drop what does not.

**Fully instantiated app.** Same architecture as A. Inputs are jobsite photo streams, PM
system exports, and drone captures. The install loop matters more here because the inspector
would run on superintendents' devices.

**Plausibility today.** Lower than A. Highest real-world pain and budget, but we have no
sample data, the domain vocabulary is heavy, and the demo needs a longer story to land in three
minutes.

**Rule risk.** Low. Nobody mistakes this for an image analyzer if the demo is about protocols
and policy rewrites.

---

## Direction C: Advertising and marketing agency creative ops
<!-- @s1.11 -->

*Yash's original framing: advertising, marketing, trend analysis.*

**Focus.** Learning what a creative team keeps remaking across a large library of ad creatives,
and how creative attributes relate to performance over time.

**Example use case.** An agency's creative library of ten thousand assets. The harness
transcribes each once, joins to performance data, and notices the team has rebuilt the same
three layout families forty times. It proposes component templates and rewrites its own context
policy to stop indexing assets that never ship.

**Example company type.** Creative-ops or performance-marketing team at an agency or in-house
brand studio.

**Lander messaging.**
- Headline: *A creative library that learns what your team keeps remaking.*
- Subhead: A harness over your assets that finds the repetition, proposes the components, and
  keeps its own memory tidy.
- Value props: (1) Transcribe once, join to performance. (2) Repetition becomes components.
  (3) The harness prunes its own index as it learns what matters.

**Fully instantiated app.** Same architecture. Sample data is the easiest of all five to obtain
today.

**Plausibility today.** Medium. Data is easy, story is decent, but this is the direction judges
are most likely to read as an image analyzer or a basic RAG over a creative library, because
"trend analysis" and "insights from images" are exactly the banned framing.

**Rule risk.** **High.** This direction needs the most careful demo script. Trend analysis as a
feature is out; it can only appear as a downstream possibility.

---

## Direction D: Architecture / AEC practice

*A bridge between A and B; not raised by either principal directly but implied by both.*

**Focus.** One harness that follows a project from concept render through drawing sets to
site documentation and as-builts, learning the practice's signature across the whole arc.

**Example use case.** A practice with BIM models, render sets, drawing revisions, and site
photos. The harness learns which details survive from concept to as-built and which get redrawn
every time, proposes standard details, and evolves its storage policy per project phase.

**Example company type.** A 20 to 200 person architecture practice.

**Lander messaging.**
- Headline: *From concept render to as-built, one harness that keeps learning your practice.*
- Subhead: Organize everything your practice produces, across every phase, and get your
  repeated details back as standards.
- Value props: (1) One index across the whole project arc. (2) Repeated details become
  standards. (3) Storage tuned per phase by the harness itself.

**Plausibility today.** Lower. Broadest scope, hardest sample data, strongest expansion path.
Better as the venture story than as the hackathon demo.

**Rule risk.** Low.

---

## Direction E: Media-pipeline engineering team
<!-- @s1.13 -->

*ICP-3 from `docs/01-icp.md`: the harness for harness builders.*

**Focus.** Engineers who run classification, segmentation, extraction, or regeneration pipelines
over large image corpora and want a harness that maintains and evolves the pipeline code,
context policies, and storage tiering for them.

**Example use case.** A team's pipeline repo plus a corpus in Atlas. The harness runs Plan,
Build, and Instrument over the repo, rewrites its own rules after each checkpoint, rolls back on
a bad iteration, and tunes hot/cold tiering from hard metrics.

**Example company type.** ML or data engineering team of 3 to 20 at any company with a large
image corpus.

**Lander messaging.**
- Headline: *The harness that builds and rebuilds your media pipeline.*
- Subhead: Plan, build, instrument, checkpoint, roll back. It rewrites its own rules so you do
  not have to.
- Value props: (1) Any coding agent underneath. (2) Every checkpoint in Atlas, rollback in one
  command. (3) Context and storage policies that evolve from hard metrics.

**Fully instantiated app.** This is the harness itself with the least domain dressing. Most
demo-able today with synthetic or public image sets.

**Plausibility today.** Highest. It is the most direct answer to Statement One and the safest
against the banned list.

**Rule risk.** Lowest. The weakness is the lander: it speaks to engineers and does not carry a
business story judges feel in their gut.

---

## Reading the directions together

| Direction | Best at | Worst at | Role |
|---|---|---|---|
| A Interior design | Story, media repetition | Sample data today | **Lander and demo persona candidate** |
| B Construction | Real pain, budget | Data, demo time | Second vertical after A |
| C Agency | Sample data | Rule risk | Narrative only, not the demo |
| D Architecture | Expansion path | Scope, data | The venture story |
| E Pipeline team | Statement One fit, demo-ability | Lander warmth | **The harness's own identity** |

**Working synthesis.** Build the harness as Direction E describes it. Dress the lander and the
demo persona as Direction A. Keep B and D as the expansion narrative. Use C's data if we need
sample media quickly and say nothing about trends.

The hub's ICP explorer scores each direction on nine criteria under four presets. Read the
stability across presets, not any one score. The decision gets recorded in `docs/01-icp.md`
with the date and both names.
