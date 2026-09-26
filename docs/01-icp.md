# Ideal Customer Profiles

*Source of record. Candidates generated in the founding conversation, re-ranked 2026-09-26
against the hackathon rules (`docs/05-rules.md`): Image Analyzers are banned, so the customer
we build for today must be buying a **harness**, not image insights.*

## Revised ranking

| Rank | ICP | Why |
|---|---|---|
| **Primary (hackathon)** | ICP-3 Pipeline-building engineer | Buys a self-improving harness for a media-heavy codebase. Fits Recursive Harnessing directly. No image-analysis feature needed. |
| Secondary | ICP-1 Visual trend analyst | Still the most vivid downstream story, but its demo *is* an image analyzer. Keep as narrative, do not build its features today. |
| Later | ICP-2 Ad / creative-ops analyst | Same risk as ICP-1 plus a data-join burden. |

## Selection criteria

An ICP fits 3PT if they (a) accumulate images continuously, (b) need *context extracted*
from those images rather than new images generated, (c) care about both short-term and
long-term trends, and (d) would benefit from a self-improving harness rather than a fixed
pipeline.

## ICP-1 (primary): Visual trend analyst

**Who.** A strategist, researcher, or small team monitoring image-dominant social feeds
(Instagram, TikTok stills, Pinterest, X) to spot emerging visual trends for a brand,
agency, or publication.

**Jobs to be done.**
- Ingest a continuous image feed; never generate images.
- Transcribe each image once into structured context (subjects, style, palette, objects, text, vibe).
- Cluster and track motifs over time; distinguish a spike from a durable shift.
- Surface "what changed this week" and "what has been building for months."
- Let the human inspect the evidence (the actual thumbnails) behind any claim.

**Why 3PT.** The feed never stops, so the context store and the pipelines must evolve.
A harness that re-plans, rebuilds, and re-instruments itself is the only thing that keeps up.

**Data.** Public feeds, RSS/image scrapers, exported CSVs of post URLs. Volume: 10³–10⁵ images/week.

**Hackathon demo slice.** One feed, one week of images, one trend board, one retrospective checkpoint.

## ICP-2: Advertising / creative-ops analyst

**Who.** Performance-marketing or creative-ops person at an agency or in-house team sitting
on a large library of ad creatives with performance data attached.

**Jobs.** Extract creative attributes from every ad image, join to performance, find which
attributes drive results, watch those relationships drift over time.

**Why 3PT.** Same extract-once / track-over-time pattern; the join to business metrics makes
the insights directly valuable. Slightly heavier data-integration burden than ICP-1.

## ICP-3: Pipeline-building data engineer / ML engineer

**Who.** An engineer running classification, segmentation, extraction, or regeneration
pipelines over large image datasets who wants to build *their own* harness.

**Jobs.** Organize and index very large datasets; stratify across hot/cold/blob stores;
codify pipelines as code in the repo; supervise long-running jobs with a spatial UI.

**Why 3PT.** This is the "harness for harness builders" angle. It is the most general and
the most technically aligned with the meta-harness idea, but the hardest to demo in a
hackathon window.

## Explicitly deprioritized

- **Content creation / marketing generation.** Generation is a solved, crowded space and does
  not exercise the long-term-context problem.
- **Multi-user collaboration and RBAC.** Out of scope; humans manage access, never the AI.

## Working decision

Build for **ICP-3** during the hackathon: an engineer who owns a long-running, media-heavy
codebase and wants the harness that maintains it to evolve its own rules, context policies,
and tool grants. The demo persona is that engineer, and the demo artifact is the harness
rewriting itself over an image corpus, with Atlas holding every checkpoint.

ICP-1 stays as the "what this enables" story for the pitch. Keep the data model general enough
that ICP-1 and ICP-2 are downstream consumers of the same media index and transcripts.
