# Brainstorming transcript

Raw notes from our brainstorming sessions. Append new sessions at the bottom. Keep the text as spoken; do not clean it up here.

## Session 1 (2026-09-26)

<!-- s1.01 P
idea three-point-harness :: Plan, Build, Instrument as three stages of one loop
  doc docs/00-vision.md#the-three-points
  doc docs/07-assessment-and-measurement.md#T-1
idea meta-harness-any-agent :: Build is a meta harness over any coding agent (Kiro, Strands, Claude Code)
  doc docs/07-assessment-and-measurement.md#T-7
idea polyglot-plan-gateway :: planning starts with a polyglot gateway that can also change the build process
idea standards-after-build :: let the frontier agent build fast, then refactor to our standards as they grow
doc docs/00-vision.md#one-paragraph-pitch
doc README.md
term Three Point Harness
note the 2-minute spiel, given to a mentor at the table
-->
cv mongodb hack

3PT (‘Three Point Harness’) for Media-Heavy Workflows.


I'll give you a 2-minute spiel on the 3-point system. It starts with a polyglot gateway system for planning, and you can also dynamically change the build process, which will be a meta harness for any coding agent, whether that's Kiro, Strand, or Claude Code.

We want to differentiate the process of instrumentation and the codebase developer experience standards that get inculcated afterward, after the build is done. We can get the build started and let whatever agent is the frontier agent build whatever needs to be built, then refactor that code according to our standards as they grow over time.

In this harness, there are three stages:
1. Plan
2. Build, which is itself a meta harness for any given existing harness
3. Instrument, which is our observability standards that then get baked back into the harness code


<!-- s1.02 XP
idea instrumentation-loop :: one area manages all instrumentation: observability, DevX, CI/CD, deployments, memory
idea instrumentation-backfeed :: what Instrument learns is written back into harness code
grow polyglot-plan-gateway :: Instrument also feeds Plan through a prompt-pattern gateway
from s1.01
doc docs/00-vision.md#loops-inside-the-loop
doc docs/07-assessment-and-measurement.md#T-1
doc docs/glossary.md#Instrumentation backfeed
term instrumentation loop
term backfeed
note "test in a production session, with some backport" was the mentor's prompt for the quality loop
-->
Why not also give some instructions here to maintain quality? We can test in a production session. There will be some backport. That's a great idea.

We're going to have a feedback loop right here before we get started. There will be an instrumentation feedback loop with respect to the competency and durability of the stack growing over time, which will account for all instrumentation, whether that's observability, developer experience, CI/CD pipeline, deployments, or memory. All those systems will be managed in an area called the instrumentation loop.

There's also an instrumentation backfeed process. That's great, and the instrumentation will also have a gateway in a prompt pattern to inform the planning mechanism itself. 

- [ ] —-

<!-- s1.03 XP
idea checkpoint-retrospective :: at every checkpoint reflect on the last few steps, a hypothetical retrospective on the plan
idea measurement-dimension :: the retrospective feeds a new dimension of the harness's evolution: measurement
grow three-point-harness :: Plan dispatches to Instrument as well as to Build
from s1.02
doc docs/00-vision.md#loops-inside-the-loop
doc docs/07-assessment-and-measurement.md#T-6
doc docs/glossary.md#Retrospective
doc 3Pt_MOTTO.md
term retrospective
term measurement
doc docs/12-decisions.md
-->
If we have the planning and instrumentation system, not only dispatch to build but also dispatch to instrument, we could also have a mechanism that considers it a little more heuristically. Provided that the build plan is going as desired, we will do a hypothetical retrospective on what this plan is over time. At every checkpoint, we just reflect on the last few things we don't only have to meet in those dimensions. That retrospective goes into the new dimension of the evolution of the harness, which is measurement. Great, so that the building of the harness

—-

<!-- s1.04 YX
idea build-with-instrumentation-loop :: frontier model builds, instrumentation model checks SE principles and repo patterns, back and forth, then return to Plan
idea git-native-checkpoints :: the harness's own history is a git worktree with checkpoints; roll back to a healthier version
idea checkpoint-only-memory :: keep only checkpoint-level memory and reflect over that
grow three-point-harness :: Plan also plans the evaluation and the instrumentation; the loop returns to Plan to assess health
from s1.01 s1.03
doc docs/00-vision.md#loops-inside-the-loop
doc docs/03-workflow.md#the-initialized-pipeline
doc docs/07-assessment-and-measurement.md#T-5
doc docs/glossary.md#Checkpoint
term checkpoint
term build-with-instrumentation loop
note Yash restating the system to the mentor ("you can correct me"); the mentor leaves here
doc docs/12-decisions.md
-->
The planning stage does the build process and also plans for the evaluation and instrumentation. Once it starts building, we have a build-with-instrumentation loop.

In this loop, a frontier model just builds, and the instrumentation model checks for software engineering principles and good repository patterns that we are trying to maintain. It tries to fix any issues with the loop, giving it feedback and going back and forth. Once it's done here, it moves back to the planning stage, where it sees what's going on, assesses its health, and figures out what's next to be done.

What's this part about? It's like a git history, like a worktree. Here's the harness right now. Over time, it will have checkpoints, and that makes it easier to roll back to a healthier version of it. You can correct me if I'm saying it.

I think we are also thinking of having some sense of retrospection after checkpoints. We'll have checkpoints, and we'll only maintain the memory of the checkpoint part and only reflect on that. Over time, this build process also includes finding bugs. Very cool. Good luck, guys. Thank you. 

—-

<!-- s1.05 ?
q What do we want our harness to do? => media-heavy workflows for a business (s1.06); the use case is dialed in at s1.26 and s1.30
from s1.04
lane 2
-->
What do we want our harness to do? 

—-

<!-- s1.06 Y
idea media-heavy-workload :: focus on media-heavy harnesses; long-term memory helps them; nobody works on this
idea media-storage-management :: a self-replicating, self-improving media harness will hit storage limits and must manage them
idea media-ui :: a UI for media-heavy workloads that also feeds information back
from s1.05
lane 2
doc docs/00-vision.md#hackathon-framing
doc docs/07-assessment-and-measurement.md#T-2
-->
Help someone run a business. I think I have a good problem statement here: we should focus on media-heavy harnesses. I feel like a lot of people don't work on media-heavy workloads, and I think long-term memory can be helpful for them over time. If we build a media-heavy harness that is self-replicating and self-improving, I think we will have some issues with storage, so we'll have to maintain and manage that. We can make a UI for media-heavy workloads and probably get some sort of feedback or information online from that.

<!-- s1.07 P
idea terse-media-index :: terse indexes over large media assets, blobs, and NoSQL stores, embedded in the codebase
idea pipelines-in-repo :: codified pipelines that run as code and live inside the running repository
idea triangle-two-sides :: right side = history of the harness code mapped to Plan/Build/Instrument; left side = how media inputs are intermediated at each instantiation
idea furnace :: the right-side harness state that drives left-side migrations
idea left-side-migrations :: the media context itself must improve; migrations run based on the furnace state
idea polyglot-left-side :: a plurality of indexing, parsing, and job methods for maintaining long-term media data
idea temporal-segmentation-viz :: a visualization of the temporal segmentation of media assets
from s1.06
doc docs/00-vision.md#two-sides-of-the-triangle
doc docs/07-assessment-and-measurement.md#T-11
doc docs/glossary.md#Furnace
term furnace
term left side / right side of the triangle
doc docs/12-decisions.md
-->
I think the new dimension you're opening up for media-heavy harnesses is that we have terse indexes of large media assets, blobs, non-SQL stores, and other respective stores that need to be embedded in the codebase. The context and specificity of that content need to be managed over time. There are also codified pipelines that run as code and live inside the running repository.

The media-heavy part is here and not here. This is how to manage that. The right side of our triangles in the stack graph is the history of the harness code itself, mapped to the respective plan-build-instrument 3-point system. The left side is how, at each instantiation level, the data inputs with respect to the media-heavy systems are intermediated. You can build on that, and the context is managed on the left side.

Over time, even the context needs to improve, and we need to run migrations to improve it based on the state of the furnace on the right side. We want to contemplate a plurality of ways in which we can make a polyglot system for the left-side visualization of the temporal segmentation of the media-heavy assets. That system allows us to utilize a plurality of methods for indexing, parsing, and running pipelines and jobs for the maintenance of that long-term data. 

—-

<!-- s1.08 Y?
grow triangle-two-sides :: naming the sides: media + context on the left, code + harness on the right
pivot media-heavy-workload :: images only for now; no video, no sound; large context size is the inextricable problem
from s1.07
doc docs/00-vision.md#scope-for-the-hackathon
doc docs/07-assessment-and-measurement.md#T-2
-->
 media context or media plus context, and then code plus infra, or maybe code plus harness. We can go really deep on the media-heavy harness because we could invoke a lot of specificity, given that this is a 3.100 and that it's for heavy media. We can also abstract a little bit, but I think we should focus on the heavy media.

One thing that's inextricable from heavy media is the large context size. I think for now, let's cut down the scope a little bit and only focus on images here. We don't have to care about video, sound, or anything. Sounds good. I think that's a good problem to start with, and then we can expand the UI.

<!-- s1.09 YP
q Generic image harness, or one specific use case? => contemplate a plurality of use cases, then pick one slice for the hackathon (s1.22, s1.30)
idea use-case-plurality :: contemplate several use cases before choosing
idea spatial-thumbnail-ui :: a terse spatial 3D thumbnail stack scaled to corpus magnitude at each node, with drill-in, as the human's supervisory mode
grow media-ui :: the UI is where the human evaluates images and judges how pipelines are working
from s1.08
doc docs/00-vision.md#the-supervisory-ui
doc docs/07-assessment-and-measurement.md#T-10
doc docs/12-decisions.md
-->
In images, what kind of problem do we want to solve with the harness specifically? Do we want to keep it generic, so that it can handle whatever long-running image-related task may be there, or do we want to make it super specific to a use case that we want to build for now? I think we should contemplate a plurality of use cases.

I could imagine having a really terse, spatial thumbnail view that allows us to see the magnitude of the image content based on a thumbnail stack in 3D. It scales based on the node it's appended to and how big that corpus is, with inspectability into that corpus so it's really easy for the human to provide feedback on evaluating those images and how those pipelines are working. It gives a supervisory mode for the iteration of that work.

What do you want the use case to be? This order 

—-

<!-- s1.10 YP
idea context-from-images-not-generation :: keep information from images built over time and use it as a data source for business insight
idea content-creation :: the simplest option, content creation
drop content-creation :: not an interesting problem; generation is not the point
idea icp-refinement :: enumerate which businesses generate and consume many images, then refine the ICP from that list
q Which businesses generate and use lots of images? => advertising, marketing, trend analysis (s1.11); construction (s1.18); interior design (s1.26)
from s1.09
lane 2
doc docs/01-icp.md#explicitly-deprioritized
doc docs/00-vision.md#scope-for-the-hackathon
-->
Media generation over time and media consistency. I'm trying to think from a user perspective: what would a user want to do with such a harness?

The simplest option is content creation, but I think that's not an interesting problem to solve. I want to focus more on having images built over time and maintaining some level of information from those images, then using that as a data source for valuable insights into the business or something.

You already have an image generation pipeline. What you want to do is use that with your harness to bring out insights from the images over time. What kind of businesses use a lot of images and also generate images from their business processes, whether real images or generated images, and could use this in a very specific context as well as a broader context? I think we could generate options for that as well to complete it, and then that should be our step for refining who the ICP is. 

—-

<!-- s1.11 Y
idea icp-advertising :: advertising and marketing teams have many images and need value from them
idea icp-trend-analysis :: trend spotting over social image feeds; the feed never stops, so the harness generates context, not images
idea harness-proposes-next-build :: after a dropout threshold the harness itself proposes what to build for next
grow context-from-images-not-generation :: the harness maintains context from an incoming feed over short and long time domains
from s1.10
lane 2
doc docs/01-icp.md#icp-1
doc docs/01-icp.md#icp-2
doc docs/08-icp-directions.md#direction-c
doc docs/07-assessment-and-measurement.md#transcript-claims-that-did-not-converge
-->
I think once we start with users, one could be advertising, because they have a lot of images and need to drive value out of them. One could be marketing, but marketing is more about generation than about getting information. One could be getting insights from images online or doing trend analysis from images only. I think that's a very good point to focus on.

We could think about the data sources being social media feeds and factorization. I like this idea of trend spotting, managing large observatory workflows for images, building insights, and deriving those insights from those images. The good thing is that, over time, the images keep coming into your feed, so your harness is not generating images. Rather, it is generating context from the images and maintaining that over time, doing trend analysis in both long-term and short-term use cases.

Perhaps there's a dropout threshold: once we've looked over this corpus, in order to plan to iterate your harness, what could be the thesis you want to explore? The harness itself figures out, "Okay, this is the one use case we saw often. Now, what else do we want to build for, and how do we improve this process?" If we are done with improving this process, what else can we build for?

<!-- s1.12 PY
idea sprint-modes :: feature sprint, improvement sprint, fix sprint, as a constant loop; sequential, never parallel, so features and improvements do not collide
grow polyglot-plan-gateway :: these are modes of planning that invoke different contexts and choose the data streams available from the harness
grow instrumentation-loop :: the sprint loop is a sub-loop of the instrument loop, auto-optimization
q Does the fix loop belong to Plan or to Instrument? => Plan selects the mode each iteration; the loop runs on the harness itself (s1.12)
from s1.11 s1.03
doc docs/00-vision.md#loops-inside-the-loop
doc docs/07-assessment-and-measurement.md#T-6
doc docs/07-assessment-and-measurement.md#Sprint-mode selection rule
doc docs/glossary.md#Sprint modes
term sprint modes
doc docs/12-decisions.md
-->
What are some of the use cases there for the analysis and production, and in what way would you want to differentiate across analysis versus production? I think maybe we could use something a tech company usually does: when do you launch a feature, and when do you improve your feature? How do you focus on that, or how do you allocate your resources?

We could look at it as sprint-wise deployments, with one sprint for features and one for improvements, not two weeks. It's one long-running agent session, or we could have two long-running parallel agent sessions. I think sequential is better because we don't want features being developed while features are being improved, because they might just time out of each other. It's better to develop parallel features, then do final improvements. We could do a feature sprint, then an improvements sprint, and just have a loop of that running constantly on the harness.

We could also add a fixing sprint, which is not improvements but finding issues in the system and trying to fix those up. It's a loop of features, improvements, and reducing errors. That sounds great. We can put that as a sub-loop of our instrument loop. That is like auto-optimization. Wouldn't that be in the planning? No, it will use the harness itself. You're right, so planning can also do the instrumentation loop. There could be a loop here also, or a loop here. These are modes of planning that invoke different contexts and choose the data streams available from the harness. I think every new iteration would want to plan and instrument first, then run the whole three points. Okay, great. 

—-

<!-- s1.13 Y
idea statement-of-need :: the background and problems for media-heavy workflows, per ICP
idea hot-cold-tiering :: which media must be accessible right away and which can sleep
idea read-once-transcript :: read an image once, store it as the source of truth, re-read only deliberately; repeated reading hallucinates
idea icp-pipeline-engineer :: engineers running classification, segmentation, extraction, regeneration pipelines want to build their own harness and index large datasets
idea personal-storage-layout :: local media organization is personal; the harness adapts its storage layout to the user
from s1.06
lane 2
doc docs/00-vision.md#problems-we-are-addressing
doc docs/01-icp.md#icp-3
doc docs/07-assessment-and-measurement.md#T-3
doc docs/07-assessment-and-measurement.md#T-4
doc docs/glossary.md#Read-once transcript
doc docs/glossary.md#Hot / cold tier
term read-once transcript
term hot / cold tier
doc docs/08-icp-directions.md
doc docs/12-decisions.md
-->
Yash is going to introduce some of the background and statement of need for the media-heavy workflows we're addressing, along with the problems we're addressing in them for our ICPs.
- How do you manage storage for this? How do you manage what needs to be hot storage and what needs to be cold storage in media? Which media is relevant right now, and which media needs to be accessible right away?
- How do you transcribe the media? If you are focusing on images, how do you get relevant context out of the image without reading it all the time? If the harness is going to read the image all the time, it is going to hallucinate a lot of times by reading it in different ways, which you probably don't want. You just want to read it once and use it as a source of truth, and if needed, read it again.
- Suppose you are doing some type of classification pipeline, building a custom harness for that, running a segmentation pipeline, an extraction pipeline, or a regeneration pipeline. In these cases, engineers and people running these data science pipelines or respective media pipelines want to be able to build their own respective harness. They want to be able to organize these large datasets and index them properly so they can stratify them by different respective methods, whether they're cold storage or some type of blob.
- How do you manage the media in the harness and the app? If it's a local microapp, the problem is that how images are maintained in local storage is very personal to the person, so the harness needs to evolve over time. How does it manage storage, put different images in different places, and organize them, which is custom to the user?


<!-- s1.14 PY
idea atlas-as-state :: a list-based system on a NoSQL database, MongoDB, manages the media remotely
idea rbac :: a permissioning layer the harness could manage as an additionality
drop rbac :: out of scope; a self-creating harness must not control roles; humans decide access
idea single-user-scope :: personal harness, no collaboration today
from s1.13
lane 4
doc docs/00-vision.md#scope-for-the-hackathon
doc docs/03-workflow.md#the-initialized-pipeline
doc docs/07-assessment-and-measurement.md#R-1
doc docs/01-icp.md#explicitly-deprioritized
doc docs/12-decisions.md
-->
To lean into the hackathon in this way, we can use a list-based system and a NoSQL database like MongoDB to manage that remotely. We can also engineer role-based access systems or a permissioning layer for that type of content. The harness might be able to manage the keys or access to that respective content, which could be an additionality. It might be out of scope right now, but maybe there's something. I think a raw data system would be out of scope because, if it's a personal harness right now, we don't want to add collaboration because that could mess up a lot of things. If it's a self-healing or self-creating harness, it might do weird things with raw data access, and we don't want the harness to actually control roles. We just want it to be managed by the human because the human wants to decide who to give access to, not the AI. Let's keep that out of scope for now. Maybe you'll build that later. 

—
<!-- s1.15 ?
idea stack-ui-backend-split :: divide the agentic development thrust across Stack, UI, Backend
from s1.14
doc docs/02-lanes.md#cross-cutting-split
doc docs/12-decisions.md
-->
How will we divide our labor/Agentic Development thrust across Across:

Stack
UI
Backend

—
<!-- s1.16 P
idea five-lanes :: repo setup, ICP definition, agent contextualization, workflow + DevX + initialized pipeline, Swift app basis
idea install-loop :: merge, download, build, install, run fast between both machines
idea swift-app :: a Swift app as the basis we get up and running with some type of workflow
idea resources-scan :: dispatch an agent to investigate the available MCPs and credits and map partner capabilities onto the app
from s1.15
lane 1 2 3 4 5 6
doc docs/02-lanes.md#the-five-lanes
doc docs/03-workflow.md#the-install-loop
doc docs/04-resources.md
doc docs/glossary.md#Install loop
term install loop
doc docs/00-vision.md
doc docs/12-decisions.md
-->
Predications: some of the predictions are that Yash and I are in a respective hackathon. There are several lanes, and we want to distribute workloads with respect to the utilization of our own coding agents on our shared repo:
1. Setting up the repo
2. Defining the ICPs
3. Getting the agents contextualized with respect to the segmented definitions we have contemplated thus far
4. Structuring a workflow that works for setting up the CodeBase, establishing DevX, and establishing the initialized pipeline
5. Getting to a basis for building us on a Swift app that we can get up and running with some type of workflow
That workflow includes an automation for the merge, download, build, and install pattern, colloquially known as the install loop. We want to be able to run that between our respective machines very quickly. We are using, to the best of our extent, the evaluated capabilities with respect to the available MCPs and the credits for this respective hackathon. We need to dispatch an agent to investigate those respective criteria and the available respective credits. That will enable us to best attribute and map the respective capabilities that each of those respective program partners can provide to the respective application development.
—-

<!-- s1.17 ?
grow resources-scan :: the master resource link the scan agent reads from
from s1.16
lane 6
doc docs/sources/hackathon-resource-guide.md
doc docs/04-resources.md#source-documents
doc docs/12-decisions.md
-->
hack resource master link: https://docs.google.com/document/u/0/d/13c8je_4unbaLLMGYhCO58zMKx4eZZ_GcuYhrUSONld8/mobilebasic


—
—
—

<!-- s1.18 P
idea icp-construction :: a construction project with polyglot sources: 24/7 video, LiDAR, stakeholder photos, 3D models, managed by long-running projects and programs
idea polyglot-sources :: many media types conglomerated over timelines with contextual specificity per concern
idea institutional-learning :: documenting the project and program is a role; compliance, confirmation, validation, optimization are the concerns
idea long-horizon-program :: projects and programs that run over a long time manage the whole corpus (Statement 2 territory)
from s1.10
lane 2
doc docs/08-icp-directions.md#direction-b
doc docs/07-assessment-and-measurement.md#transcript-claims-that-did-not-converge
doc docs/12-decisions.md
-->
Use Case Potential Potential   

Let's say, for instance, that the long-horizon addressed scenario is a construction project with a polyglot number of sources, meaning there could be:
* 24/7 video data
* LiDAR data
* Images taken by employees, surveyors, or any number of stakeholders
* 3D models of that respective environment
This polyglot data is managed by projects and programs that run over a long time and manage the entire media corpus around that. The institutional learnings are indicative of those projects and programs. There is a role in large contracting and engineering: documenting the project and program. This is more about building an institute, and compliance is one concern. I think another concern is institutional learning, including confirmation and validation for installs and optimization. There are many different forks in context in which that same data will be conglomerated over certain timelines and with certain contextual specificity to manage those concerns with respect to those different enumerations. We can go about different enumerations that are concerns for that type of traditionally non-technical institution that generates a lot of high-fidelity data. That data is managed over a media content workflow with an ingestion pattern, an engineering pattern around the analysis of that, and outcome- and goal-driven conglomerative workflows. AI and engineering are part of it, and then AI is used again for the non-technical, non-deterministic


—


<!-- s1.19 YP
q Is compliance-driven media reuse a wide enough value proposition? => reframed at s1.20: value comes from what we store, and the harness serves that
idea value-from-reuse-over-time :: the harness makes duplicative and extended use of a corpus more valuable over time: institutional learning, optimization, scenario planning
idea opportunity-finding :: from self-improving to finding opportunities in the business
from s1.18
doc docs/06-goal-and-use-case.md#goal
-->
The question is whether, for these types of companies that are using images for compliance, that data does not have extensible utilization and the value proposition is narrow. It could be that our harness makes the duplicative and extended usage of that data corpus more valuable over time, and it could be institutional learning, optimization, or scenario planning. Maybe I like data, so the hardness figures are what the value in the data is over time. Yeah exactly. I don't like that because 

From Self Improving to Finding Opportunties in the Business 

—
<!-- s1.20 Y
q Self-improving harness, or long-term domain harness? => self-improving, built around the value of the media we store (s1.20); reframed against the rules in docs/00-vision.md#hackathon-framing
idea value-of-stored-media :: the important input is what is valuable in what we store, not what is valuable in the industry
pivot opportunity-finding :: value must come from the stored context, not outside sources; the harness goes behind that value
from s1.19
doc docs/00-vision.md#hackathon-framing
doc docs/06-goal-and-use-case.md#goal
-->
 We're still considering whether we're going to go for the self-improving harness (which I think we have a good scaffold for) or the long-term domain harness. Even in the long-term domain harness, the more important input would be what is valuable in the industry rather than what is valuable in the context we are storing. That way, what we are building wouldn't create value because the value would actually come from outside sources and from using the context we have from our images.

What I want to focus more on is giving the value of what we are storing and having the harness go behind that value. The harness should either self-improve or just use long-term memory improvements to focus on maintaining and using that context for our use case really well. What do you think? 

—

<!-- s1.21 Y
idea context-management-not-classification :: the harness does not classify; it builds custom context management for your media over time
idea yes-no-signals :: what is good and not good for the user are the signals for the next feature or improvement
idea journal-storyline :: a journal that uses timestamps to find what is relevant now and builds the storyline around it
idea proactive-harness :: the harness proactively gets the user to instrument the real world so the experimental apparatus can be built
from s1.20 s1.11
doc docs/00-vision.md#scope-for-the-hackathon
doc docs/06-goal-and-use-case.md#recap
doc docs/07-assessment-and-measurement.md#transcript-claims-that-did-not-converge
-->
In what scenarios or workflow     or business cases to we want media over time:

News
Journals
Quick Searches over media

Improve the harness overtime:

The harness doesn't focus on classifying information. It focuses more on building custom context management for your media over time. It learns from your use cases, what is good for you, and what is not bad for you. Those are signals for the next feature or next improvement.

Through those yes and no signals, the context understands how to organize your media, how to bring value from it, and what information to generate from it. That information can be used in future planning for your business, future opportunity finding, or finding insights using media. It can also just use that media again and/or find it in one specific use case.

Let's say it's a journal that can use timestamp information from media, such as something that was posted a year ago, is relevant now, or needs continuity now. It will be able to help find that out and build the storyline around it. It is proactive about getting the user to instrument the real world (or whatever the respective signals are from the actual business use case and business value propositions) in order to properly build the experimental apparatus. That apparatus is used to get and provide that information over time. 


<!-- s1.22 ?
idea hackathon-slice :: one specific use case, a harness recursively improving itself, lots of incoming media from a free source, context managed over time
grow journal-storyline :: the free feed plus what we search for becomes a storyline for a journal
grow proactive-harness :: the harness slowly becomes proactive about what media to gather
from s1.21 s1.09
doc docs/00-vision.md#hackathon-framing
doc docs/12-decisions.md
-->
— Hackathon Overview
  For just the hackathon we could build out one specific use case with a harness that it's recursively improving (itself) We have a lot of incoming media, and it's managing context over time. The harness is understanding what kind of media we want to capture or gather, trying to organize it, and slowly becoming proactive. Yes, the harness's purpose is to  the harness’s purpose is to be proactive over time that we have a lot of media coming in from the internet, from a free data source. Over time, based on what we are searching for, it will figure out what we want, use that, and build a storyline on top of that for a journal. 

<!-- s1.23 P
idea business-case-thesis :: media companies produce polyglot, institution-specific feeds that existing image-classifier providers neither discover nor maintain; the logical move is a custom harness that understands the business
idea hierarchical-specificity :: the harness understands content contextually at hierarchical levels of specificity
grow measurement-dimension :: increasing voracity and measurability of feedback and experimentation built into the harness itself
from s1.22
doc docs/06-goal-and-use-case.md#goal
doc docs/07-assessment-and-measurement.md#T-9
-->
—   We'll call this the business case thesis: media companies are producing polyglot, media-heavy feeds that are specific to a particular institution and are undiscovered and unmaintained by existing providers of image classifier systems. The most logical scenario is to build a custom harness that understands the business.

This process, along with the technical aptitude needed to build a custom harness and system over time, involves feeding content into it. The harness improves its understanding of the content contextually and at hierarchical levels of specificity, with increasing voracity and measurability of feedback and experimentation built into the harness itself. The harness continues to utilize and understand the nature of the content and the way value from that content can be fed back into the business. 

—-

<!-- s1.24 ?
idea goal-statement :: a purpose-built image and knowledge management pipeline across a unique workflow for a media-heavy business case
from s1.23
doc docs/06-goal-and-use-case.md#goal
-->
What is the goal of the harness for it to be more valuable overtime

 
To build a purpose-built technological image and knowledge management pipeline across a unique workflow for a given media-heavy business case 

—
—
—
<!-- s1.25 Y
grow goal-statement :: any kind of media; organize new media models well; dial down the context of everything generated over time; the business gets insight into its media-heavy work
from s1.24
doc docs/06-goal-and-use-case.md#goal
-->
The 3PT-Harness can handle any kind of media for a company, and help that company learn.

 Understand different new media models and focus on organizing them well to really dial down the context of all that is generated over time. That way the business can get insights into what they've been doing around their media-heavy workloads. 

<!-- s1.26 YP
idea icp-interior-design :: an interior design firm derives models continuously; the harness organizes them, understands them, then suggests automations
idea building-blocks :: if the firm keeps drawing the same walls, build a parametrized template from the stored base and offer it back
idea harness-suggests-automations :: the harness suggests templates, workflows, and automations that remove repetition from media workloads
idea two-streams :: segment the service-bureau work from the representative marketing work that acquires customers, both from one media base
from s1.25 s1.10
lane 2
doc docs/06-goal-and-use-case.md#use-case
doc docs/08-icp-directions.md#direction-a
doc docs/07-assessment-and-measurement.md#T-9
doc docs/12-decisions.md
-->
Use Case:

is an interior design firm, because they build models, right? Autores can derive models, and over time, interior design firms derive models. Autores models are just organized, and the harness slowly understands what's being organized. Over time, it understands well enough to organize this really well and derive important context from it, which is important for the business. Slowly, it suggests workflows that can be automated and made super easy.

For example, if you have to draw the same kind of walls around your system and your firm is really good at creating such walls, you don't want a person to always create that. You can have a slowly built-out template for your storing base based on certain parameters, and the agent can slowly start giving you that inside.

The harness focuses on organizing all these models and getting insights from them. It gives insightful templates, workflows, or automations that you can start implementing in your business to remove the bluff in the store on media workloads. I think it also includes domain-specific content streams that can come out of that media. A team like this might want to be able to produce high-quality marketing and advertising content based on the work they do. Given that, they want to segment those workflows into the real meat-and-potatoes work of their service bureau and the representative work of how they demonstrate that and acquire new customers. 


<!-- s1.27 Y
grow building-blocks :: in Blender, repeated templates and line drawings become building blocks the harness carries; the workflow tends toward no-code
idea automations-become-harness :: an automation the harness discovers becomes part of the harness itself, not a one-off script
from s1.26
doc docs/06-goal-and-use-case.md#value-props
doc docs/07-assessment-and-measurement.md#T-9
-->
Value Props    
How we get a lot of data from a media pipeline and give you feedback.


The harness slowly understands your media workflows and what is being repeated in your media outputs, and then it starts suggesting automations for those repeated parts of your outcomes.

For example, in Blender models, if you are repeating the same kind of template or the same kind of creations or line drawings, it can figure that out over time and create automations. That becomes part of the harness itself.

The next time you are trying to create something, it will suggest that you can have these building blocks you can incorporate into your system. The harness slowly becomes like no-code or no manual workflow, just building blocks. 

——

<!-- s1.28 PY
idea screen-capture-onboarding :: screenshot real technical work (CAD review) every ~20 seconds, run it through the pipeline daily, learn the institution's process
idea cad-file-attach :: attach the CAD file to each screenshot so the harness learns what the source looks like alongside the render
idea input-event-correlation :: capture mouse and keyboard events (DTrace) and correlate them with the screenshots; a polyglot workflow
idea stream-dialing :: the harness decides what is noise and turns input streams off or on
idea institution-owns-the-harness :: the institution owns the learning instead of a vendor data-mining their CAD usage
idea over-the-shoulder-suggestions :: a live suggestion tool learned from the user's intuitions
from s1.27
doc docs/06-goal-and-use-case.md#onboarding-side-effect
doc docs/07-assessment-and-measurement.md#T-8
doc docs/07-assessment-and-measurement.md#R-25
-->
 One side effect is that we might be able to use the XFCE screenshotter or something like it to produce images from regular use of a respective computer in some type of technical workflow (say, in CAD design review). It actually learns from a respective institution's process and allows that to be fed back into a model on a custom harness. That allows them to specify and steer the type of feedback being incurred from that system.

This could be an onboarding process for a company that wants to incorporate this system. More so, it could be like, "Hey, you're running Cat every day anyway, right? We could be taking a screenshot every 20 seconds, running it through the pipeline every day, and using some of the heuristics from that, like the duplicative aspects or the way there can be a live over-the-shoulder suggestion tool learning from the user's intuitions to provide feedback."

Instead of that being something an institutional company is doing with data mining in CAD, this is something that institution owns very easily. They have a machine learning engineer as a harness. What you can also do while taking the screenshot is get the CAD file so the screenshot is attached to it. That way, you exactly know what the CAD code looks like, what the code looks like for that, and the machine slowly starts to understand: "Okay, if I do this, it would look like this."

We could also grab DT trace to get mouse click and keyboard input events and correlate those accordingly, so we're dealing with a polyglot workflow. We're then showing the actual technical process of the catmentation and how it grows over time. The harness can figure out what is noise and what is not, and slowly start to understand that this kind of input we don't really need anymore, so it can just turn it off or turn it on. 

—
<!-- s1.29 P
idea supervisory-outer-loop :: an outer loop learns from the harness's productivity, observability, and output streams and proactively increases the tooling's affordances
idea bit-storage-reduction :: reduce the overall bit storage load over time while getting value in different time domains
idea ui-nontechnical-config :: non-technical people configure the harness from what they already know and use
idea media-flow-viz :: visualize the media flows, how they come in and how they are shaped over time
idea harness-evolution-viz :: a very simple visualization of the harness planning, building, and evolving
grow stream-dialing :: dial streams up or down to reduce storage and extract value across time domains
grow spatial-thumbnail-ui :: the UI is a coordination basis for the media flows and the harness itself
from s1.28 s1.09 s1.03
doc docs/06-goal-and-use-case.md#recap
doc docs/06-goal-and-use-case.md#the-ui-we-want
doc docs/00-vision.md#the-supervisory-ui
doc docs/07-assessment-and-measurement.md#T-10
doc docs/12-decisions.md
-->
 To recap there, we have this 3-point harness system. It's self-improving because there is an instrumentable flow of media that's incoming and being processed, and the processor for that is the harness. The harness is going to grow over time.

There's a supervisory outer loop that learns from the productivity, workings, and observability and output streams of that harness as it operates and improves. It then proactively finds ways to increase the affordances, specificity, and capabilities of the tooling as needed, whether by dialing up or dialing down certain data streams in that media-heavy stream. This is to reduce the overall bit storage load over time and get value in different time domains from those media streams.

We want to build the right UI to help folks who are non-technical configure that from what they know and already use. The UI should also provide a very solid coordination basis for visualizing those media flows, how they're coming in, and how they are shaped over time. It should also include a very simple visualization of the harness and the way it plans, builds, and evolves over time. 


—

<!-- s1.30 P
idea icp-directions-exploration :: lay several directions side by side (focus, example use case, company type, lander messaging), estimate in parallel, then decide
grow icp-refinement :: the decision space is now explicit: interior design (Yash), construction (Patrick), advertising and trends (Yash first)
q Which ICP direction do we build for today? => open
note docs/01-icp.md records a working decision for ICP-3 while docs/08-icp-directions.md says nothing is decided; reconcile when the direction is picked
from s1.26 s1.18 s1.11
lane 2
doc docs/08-icp-directions.md#why-we-are-exploring
doc docs/01-icp.md#working-decision
code hub/site/icp-explorer.html
doc docs/12-decisions.md
-->
 Still dialing in ICP/Usecase. Our use case is particularly about interior design. Yash brought up interior design and I brought up construction. Yash initially brought up advertising, marketing, trend analysis, and media-heavy workflows. We're set on that direction but we want to dial in and contemplate several respective directions and scopes with respect to:
* what our focus is
* the example use case
* the example company type that this harness particularly targets and scopes for its messaging around its design system and communications on the lander and explainers
Those communications inculcate the patterns and value propositions for those respective users. You want to go a little bit exploratively and then we'll do some parallel estimations and outcome-specificity assessments that are plausible with respect to a fully instantiated app that fulfills these respective criteria and meets the needs contemplated for thos
e different directions and the theme space for our tentative ICP.
