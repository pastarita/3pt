# Goal, Use Case, and Value Props

*Source of record. Distilled from Patrick + Yash, 2026-09-26. This is the answer to "what is the
goal of the harness, for it to be more valuable over time," written against Problem Statement One.*

## The problem statement we are answering

From the hackathon guide (MongoDB × Cerebral Valley, The Malin Chelsea, Sep 26):

> **Statement One: Recursive Harnessing.** Build a self-improving agent harness that automatically
> evolves its own architecture: updating rules, context policies, guardrails, tool access, and more.
> How can agents dynamically adapt their entire environment to fit a specific user, task, or use case?

The hackathon frames harness engineering as "the systems around a model (rules, context policies,
guardrails, tool access and memory) that let agents adapt to a task, sustain work over long horizons
and act on real data," with MongoDB as the data and memory layer.

## Goal
<!-- @s1.19 @s1.20 @s1.23 @s1.24 @s1.25 -->

Build a purpose-built image and knowledge management pipeline across the unique workflow of a
media-heavy business, such that **the harness gets more valuable the longer it runs**.

The 3PT harness can take in any kind of media a company produces and help that company learn from
it. It understands new media models as they arrive, organizes them well, and progressively dials
down the context needed to represent everything generated over time. The business ends up with
insight into what it has actually been doing across its media-heavy workloads.

## Use case: an interior design firm
<!-- @s1.26 -->

Interior design firms derive models continuously (Blender scenes, CAD drawings, renders, line
drawings, mood boards). Authors derive models; firms derive models; the models pile up.

1. **Organize.** At first the harness only organizes. Every model, render, and drawing gets indexed,
   transcribed once, and tiered.
2. **Understand.** Over time the harness understands what is being organized well enough to derive
   the context that matters to the business: which elements recur, which projects share structure,
   which outputs are the firm's signature.
3. **Suggest.** It starts suggesting workflows that can be automated. If the firm draws the same
   kind of wall system again and again, and is very good at it, no person should draw it from
   scratch every time. The harness builds out a parametrized template from the stored base and
   offers it back.
4. **Become building blocks.** Repeated parts of the firm's outputs become building blocks that the
   harness itself carries. The next time someone starts a piece of work, the harness proposes the
   blocks to incorporate. The firm's workflow trends toward no-code, no manual repetition.

Two streams come out of this and should be segmented from each other:

- **Service-bureau work.** The meat-and-potatoes deliverables of the firm.
- **Representative work.** High-quality marketing and advertising content that demonstrates the
  work and acquires new customers, produced from the same media base.

## Value props
<!-- @s1.27 -->

- **A lot of data from a media pipeline, turned into feedback.** The harness slowly learns your
  media workflows and what repeats in your outputs, then suggests automations for the repeated parts.
- **Automations become part of the harness.** In Blender, if the same template, creation, or line
  drawing recurs, the harness figures that out and creates the automation. That automation is now
  harness architecture, not a one-off script. This is the recursive part.
- **Building blocks, not instructions.** The harness offers blocks you can incorporate, so the
  workflow becomes composition instead of repetition.

## Onboarding side effect: learn from the screen
<!-- @s1.28 -->

A company already running CAD every day can be onboarded by observation rather than by data entry.

- Capture a screenshot every ~20 seconds during real technical work (CAD design review, for
  instance), run the day's captures through the pipeline nightly.
- Attach the CAD file to each screenshot so the harness knows exactly what the source looks like
  alongside what the render looks like, and slowly learns "if I do this, it looks like this."
- Optionally capture input events (mouse, keyboard, via a tracing tool) and correlate them, making
  this a polyglot workflow that shows the actual technical process and how it grows over time.
- The harness decides what is noise. When an input stream stops paying for itself, the harness
  turns it down or off. When one becomes valuable, it turns it up. This is the harness rewriting
  its own tool access and context policies.
- The institution owns all of it. Instead of a vendor data-mining their CAD usage, they have a
  machine-learning engineer in the form of a harness, and they steer the kind of feedback it gives.
- Over-the-shoulder suggestions become possible: a live tool that learned the user's intuitions
  offers the next block while they work.

## Recap: why this is self-improving
<!-- @s1.21 @s1.29 -->

There is an instrumentable flow of media coming in and being processed. The processor is the
harness. The harness grows over time.

A **supervisory outer loop** watches the harness's productivity, workings, observability, and output
streams as it operates. It proactively finds ways to increase the affordances, specificity, and
capabilities of the tooling, dialing individual data streams up or down. Two objectives drive it:
reduce overall bit-storage load over time, and extract value from the media streams across
different time domains (today, this quarter, this decade).

## The UI we want
<!-- @s1.29 -->

For non-technical people to configure the harness from what they already know and use. It should:

- Let a non-technical operator set up and steer the harness without code.
- Visualize the media flows: how they come in and how they are shaped over time.
- Show, very simply, the harness itself and the way it plans, builds, and evolves over time.

Per the rules, the UI is an inspector and configurator, never the headline feature.
