# Construction roles: what each one sees on screen, and where AI insights fit

Research date: 2026-09-26. Purpose: build an app that shows each role the screens they already know (Procore-style home, daily log, punch list, drawings with pins, photo timeline, 360 walk, owner report), with "harness insights" layered on top. The app is photo-heavy.

Rules for this file: every factual claim has a URL. **INFERRED** marks my own reasoning with no source. Frequencies are INFERRED unless a source is cited.

Name note: Autodesk now sells Autodesk Build as "Forma Build" and the mobile app as "Autodesk Forma" (https://www.autodesk.com/products/forma-build/overview, https://apps.apple.com/us/app/autodesk-forma/id498795789). This file says "Autodesk Build" because the help docs still use it.

---

## 0. Shared screens (the vocabulary every role knows)

These screens repeat across roles. Build them once and change the default view per role.

| Screen | What it shows (source) |
|---|---|
| **Procore Project Overview** (the new project home) | Cards: Project Information, Open Items (My Open Items / All Open Items, with counts), Project Timeline, Project Weather, Project Team, Project Message, Notes, Links, Quick Create (RFIs, Observations), and Procore Insights such as "Average Submittal Response Time" and "Average RFI Response Time". Users show or hide cards. https://support.procore.com/products/online/user-guide/project-level/project-overview |
| **Procore legacy Project Home** | Project Overview bar chart of overdue / due soon / future items per tool, My Open Items (type, status, due date), Recently Changed Items, Today's Schedule, Project Milestones, My Dashboards, Weather, Links. https://support.procore.com/products/online/user-guide/project-level/home/tutorials/about-the-project-home-page |
| **My Open Items** | Items that need *your* action. Group By item type; filter by due date. You see only the tools you have permission for. https://support.procore.com/products/online/user-guide/project-level/home/tutorials/open-items-from-the-project-overview-in-the-projects-home-page |
| **Autodesk Build Home** | Cards you add from a Card Library: Assigned to Me, Recent Items, My Projects, Bookmarks, partner cards, milestones, weather, team status. https://resources.imaginit.com/building-solutions-blog/personalized-insights-at-your-fingertips-introducing-dashboards-in-autodesk-construction-cloud, https://help.autodesk.com/view/DOCS/ENG/?guid=Insight_Customize_Dashboards |
| **Daily Log** (Procore) | Sections: Daily Construction Report, Manpower (company, workers, hours, cost code), Weather (auto-pulled), Deliveries, Notes, plus Photos, Inspections, Safety Violations, Visitors, Waste, Productivity. https://en-ca.support.procore.com/products/online/user-guide/project-level/daily-log/tutorials/daily-log-overview |
| **Ball in court (BIC) list** | The person who owes the next action on an RFI (request for information) or submittal. It is the core of workflow in Procore. It changes only in Draft or Open status. https://support.procore.com/products/online/user-guide/project-level/submittals/tutorials/change-the-ball-in-court-on-a-submittal, https://www.followupcrm.com/blog/how-to-change-ball-in-court-in-procore |
| **Punch list with statuses** | Assignee marks "Ready for Review"; the Punch Item Manager reviews; only the Final Approver or an Admin closes it. Before and after photos show the fix. https://support.procore.com/faq/what-is-the-punch-list-work-flow, https://zentekconsultants.net/procore-punch-list-best-practices-for-superintendents-and-project-managers/ |
| **Drawing (sheet) viewer with pins** | Drop a pin where the issue is, even offline; it syncs later (Fieldwire). Pins on 2D sheets or 3D models (Autodesk Build). Photos pinned to a drawing also land in a "Photos from Drawings" album (Procore). https://www.fieldwire.com/blog/field-task-management/, https://help.autodesk.com/cloudhelp/ENU/Build-Issues/files/Issues_Create.html, https://support.procore.com/products/online/user-guide/project-level/drawings/tutorials/add-photos-to-a-drawing |
| **Photos / albums** | Phone photo goes to an album; with no album chosen it goes to "Unclassified". Options: location, drawing pin, geotag. https://support.procore.com/procore-mobile-ios/user-guide/photos-ios/tutorials/take-and-add-photos-to-an-album |
| **Photo timeline** (CompanyCam) | Each project has a timeline: a date-ordered feed of every photo, video, and document. Each photo carries a time stamp, GPS (global positioning system) tag, and user. Tags and global search help find "that one photo". https://companycam.com/features/project-feed, https://companycam.com/features/galleries-timelines |
| **360 walk** (OpenSpace) | 360 captures placed on the floor plan. Split View puts two dates side by side; Reveal Mode overlays past and present. Share as link, JPG, or PDF, also to people with no account. https://support.openspace.ai/hc/en-us/articles/41887582726547-Viewing-Your-OpenSpace-360-Captures-on-Desktop, https://www.openspace.ai/products/capture/ |
| **Checklist form / inspection** | Template-driven checklist on phone. Failed items become "actions" with title, priority, due date, assignee, photos (SafetyCulture). https://help.safetyculture.com/en-US/004828/, https://www.workyard.com/compare/iauditor-review |
| **Lookahead** (3 to 6 weeks) | Super and trade foremen build it together (Last Planner System). It used to be sticky notes on a trailer whiteboard. Now iPad apps let them update progress on the walk. https://www.planera.io/post/construction-lookahead-scheduling, https://www.outbuild.com/construction-ipad-app |
| **Budget table** | Line items with budget, commitments, approved changes, projected cost, and a Forecasting tab. Change orders flow into the budget. https://support.procore.com/products/online/user-guide/project-level/budget, https://support.procore.com/faq/how-does-the-budget-forecast-report |

### Industry pain numbers (use these in the pitch)

- 35% of time (over 14 hours a week) goes to non-productive work. 5.5 hours of that is looking for project data. Poor data and miscommunication cause 48% of US rework (about $31.3B in 2018). Survey of 599 people, PlanGrid + FMI "Construction Disconnected" 2018. https://www.autodesk.com/blogs/construction/construction-disconnected-fmi-report/, https://www.constructiondive.com/news/industry-could-be-overspending-177b-per-year-study-finds/529450/
- Some teams spend 25 to 40 hours preparing for each biweekly OAC (owner-architect-contractor) meeting. Source is a vendor blog. https://www.linarc.com/buildspace/oac-reporting-construction-fix-in-five-minutes

---

## 1. Superintendent (the GC's boss in the field)

**Device and context.** Phone and tablet on site all day. Tablet for plans and punch lists in bad light with dirty hands and weak signal (https://www.constructionperks.com/software/fieldwire). iPad on the site walk for the lookahead (https://www.outbuild.com/construction-ipad-app). Laptop in the trailer at end of day for the daily log (INFERRED).

**First screen.** Project home with My Open Items, Today's Schedule, and Weather (https://support.procore.com/products/online/user-guide/project-level/home/tutorials/about-the-project-home-page). Then the Daily Log for today (INFERRED).

**Top 5 jobs on screen**

| Job | Frequency | Source |
|---|---|---|
| Fill the daily log: manpower by sub, weather, deliveries, notes, photos | Daily | https://en-ca.support.procore.com/products/online/user-guide/project-level/daily-log/tutorials/daily-log-overview |
| Walk the site and take photos; pin them to sheets | Daily, many times | https://support.procore.com/products/online/user-guide/project-level/drawings/tutorials/add-photos-to-a-drawing |
| Update the 3-week lookahead with trade foremen | Weekly | https://www.planera.io/post/construction-lookahead-scheduling |
| Create and verify punch items and observations | Daily near closeout | https://zentekconsultants.net/procore-punch-list-best-practices-for-superintendents-and-project-managers/ |
| Run or join inspections (quality, pre-drywall) | Weekly per area (INFERRED) | https://www.procore.com/quality-safety/inspections |

**Patterns relied on.** Daily log form, drawing viewer with pins, punch list with Ready for Review, lookahead bars, photo album.

**Pain points**
- A blank daily log takes 30+ minutes a day; field supervisors spend 5 to 8 hours a week on paperwork. Vendor blog. https://aihomebuilding.com/articles/ai-daily-logs-litigation-documentation
- Some supers re-type handwritten notes into a spreadsheet for two hours each evening. Same source.
- "No issues" in the log weakens the record in a later dispute; each super writes logs differently. Same source.
- Photos with no album go to "Unclassified", so they are hard to find later (INFERRED from https://support.procore.com/procore-mobile-ios/user-guide/photos-ios/tutorials/take-and-add-photos-to-an-album).
- Pre-drywall is the last chance to see wiring, pipes, ducts, blocking, and firestopping. After the wall closes, the photos are the only record. https://www.scanmanifold.com/blog-posts/pre-drywall-inspection-checklist-contractors-2026, https://www.nachi.org/pre-drywall-inspections.htm

**Harness insights** (all INFERRED)
1. **Daily log card:** "Draft ready from today's 42 photos: 6 trades seen, concrete pour on L2, 1 delivery (pallet of drywall). Review and sign."
2. **Pre-drywall card on the lookahead:** "Drywall starts Unit 4B on Thursday. 3 of 11 walls in 4B have no in-wall photo. Walk them before Wednesday."
3. **Punch list:** "5 open items have a newer photo at the same pin that looks fixed. Mark Ready for Review?"

---

## 2. Project manager (PM)

**Device and context.** Laptop in the office or trailer most of the day; phone for approvals and email (INFERRED). Weekly or biweekly OAC meeting with the owner's rep: schedule, open RFIs, budget (https://projul.com/blog/construction-owners-representative-guide/).

**First screen.** Project Overview with Open Items and Procore Insights (RFI and submittal response times) (https://support.procore.com/products/online/user-guide/project-level/project-overview). Budget and Change Orders are next (INFERRED).

**Top 5 jobs on screen**

| Job | Frequency | Source |
|---|---|---|
| Push RFIs and submittals; watch who holds ball in court | Daily | https://www.followupcrm.com/blog/how-to-change-ball-in-court-in-procore |
| Update budget, commitments, change orders, forecast | Weekly / monthly | https://support.procore.com/faq/how-does-the-budget-forecast-report |
| Build the OAC / owner report: budget vs schedule, field photos, RFIs, change orders | Weekly or biweekly | https://www.linarc.com/buildspace/oac-reporting-construction-fix-in-five-minutes |
| Run meetings: agenda, minutes, action items | Weekly | https://www.procore.com/project-management |
| Review sub pay applications against the schedule of values (SOV) and work in place | Monthly | https://superconstruct.io/construction-pain-points/ |

**Patterns relied on.** BIC list, status chips (Draft / Open / Closed), budget table with forecast columns, meeting minutes, PDF report export.

**Pain points**
- Flips between ten spreadsheets, a sub's Dropbox, and email threads to find the latest RFIs and change orders; several "final" versions disagree. https://www.linarc.com/buildspace/oac-reporting-construction-fix-in-five-minutes
- Hours to build 30-day field reports from emails, PDFs, notebooks, and folders. https://superconstruct.io/construction-pain-points/
- "Which set is latest?" and building from an old drawing set. Same source.
- RFIs raised by phone or text lose context. Same source.

**Harness insights** (all INFERRED)
1. **OAC report:** "Weekly owner report drafted: 18 photos chosen (one per area with change), 4 RFIs closed, 2 change orders pending. Edit before send."
2. **Change order row:** "CO-014 (added blocking, Unit 3) has 3 photos from 9/18 showing the work in place. Attach as backup?"
3. **RFI list:** "RFI-032 asks about duct clash at grid C4. 2 site photos from today show that spot. Link them."

---

## 3. Owner / owner's representative

**Device and context.** Laptop for reports and pay apps; phone or tablet on site visits (INFERRED). Often has no seat in the GC's tool: OpenSpace lets GCs share captures with people who have no account (https://www.openspace.ai/products/capture/).

**First screen.** A portfolio or project dashboard: cost, schedule, and risk, kept current (https://www.mastt.com/solutions/owners-representative). Percent complete across the portfolio (https://www.openspace.ai/solutions/owners/). Or, in practice, the PDF the GC sends each week (INFERRED).

**Top 5 jobs on screen**

| Job | Frequency | Source |
|---|---|---|
| Read the GC's progress report / OAC packet | Weekly or biweekly | https://projul.com/blog/construction-owners-representative-guide/ |
| Check GC pay application against SOV, prior pay apps, and daily work | Monthly | https://superconstruct.io/construction-pain-points/ |
| Verify work in place from visual evidence before paying | Monthly | https://www.openspace.ai/solutions/owners/ |
| Approve change orders and track budget, retainage | As needed | https://superconstruct.io/construction-pain-points/ |
| Collect inspections and submittals for handover and compliance | At closeout | https://superconstruct.io/construction-pain-points/ |

**Patterns relied on.** Weekly report PDF, 360 Split View (then vs now), portfolio percent-complete dashboard, budget table.

**Pain points**
- Budget, spend, retainage, and status sit in separate spreadsheets; manual rollups slow decisions. https://superconstruct.io/construction-pain-points/
- Validating pay apps takes a long time. Same source.
- Hard to collect inspections and submittals after the job ends. Same source.
- Every owner's rep wants information in a different format. https://projul.com/blog/construction-owners-representative-guide/

**Harness insights** (all INFERRED)
1. **Pay app line:** "Drywall L3 billed at 80%. Photos from 9/22 show about 55% hung on L3. Ask before approving."
2. **Weekly report:** "What changed since last week", shown as 6 then/now photo pairs picked from 310 new photos.
3. **Closeout:** "12 of 40 rooms have no pre-drywall photo set. Request them now, before the finishes go in."

---

## 4. Trade foreman (example: plumbing)

**Device and context.** Phone or tablet in the field; mobile ease of use is the main buying test (https://www.fieldwire.com/blog/subcontractor-project-management-software/). Works inside the GC's system on the GC's job, and often inside several GCs' systems at once (same source).

**First screen.** Task list or plans on phone (Fieldwire), filtered to their tasks and punch items (https://www.fieldwire.com/usecase/punch-management-gc/). For their own company: daily report and time cards in an app like Raken (https://www.rakenapp.com/features/daily-reports).

**Top 5 jobs on screen**

| Job | Frequency | Source |
|---|---|---|
| Open current plans and find their scope on the sheet | Daily | https://www.constructionperks.com/software/fieldwire |
| Enter crew hours (time cards) | Daily | https://help.rakenapp.com/en/articles/14115530-raken-time-cards-overview |
| Daily report with photos, voice-to-text notes | Daily | https://www.rakenapp.com/features/daily-reports |
| Close assigned punch items with a photo, mark Ready for Review | Daily near closeout | https://support.procore.com/faq/what-is-the-punch-list-work-flow |
| Agree next weeks' work on the lookahead with the super | Weekly | https://www.planera.io/post/construction-lookahead-scheduling |

**Patterns relied on.** Sheet viewer with pins, task list filtered to "assigned to me", camera button, time card grid, checklist.

**Pain points**
- Many portals and outdated drawings; re-keying numbers by hand from spreadsheets and old PDFs. https://superconstruct.io/construction-pain-points/
- Separate login and workspace per GC. https://www.fieldwire.com/blog/subcontractor-project-management-software/
- Rebuilding context for each pay app across several projects. https://superconstruct.io/construction-pain-points/

**Harness insights** (all INFERRED)
1. **My tasks:** "4 of your 7 punch items have a photo from your crew today at the same pin. Send as Ready for Review in one tap."
2. **Rough-in photos:** "Rough-in done on 3 units. The GC's pre-drywall checklist asks for 2 photos per wet wall; you have 1 for Unit 2C."
3. **Daily report:** "Crew hours drafted from yesterday; 9 photos tagged plumbing attached. Confirm."

---

## 5. Safety manager

**Device and context.** Phone or rugged tablet in the field for inspections and near misses, "in under a minute" (https://abccarolinas.org/construction-safety-data-capture-from-paper-checklists-to-real-time-risk-intelligence/). Laptop for trends and the OSHA (Occupational Safety and Health Administration) 300 log (INFERRED).

**First screen.** Inspections list and the action tracker: open corrective actions with priority, due date, assignee, photos (https://www.workyard.com/compare/iauditor-review). In Procore: Observations and Inspections, with Safety Violations in the daily log (https://support.procore.com/products/online/user-guide/project-level/observations).

**Top 5 jobs on screen**

| Job | Frequency | Source |
|---|---|---|
| Walk the site; log hazards as observations with photo, location, hazard type | Daily | https://support.procore.com/procore-mobile-ios/user-guide/observations-ios/tutorials/create-an-observation-ios |
| Run toolbox talks and pre-task plans with crews | Daily / weekly | https://3psafetystaffing.com/site-safety-manager-job-description/ |
| Review the day's work against the JHA (job hazard analysis) | Daily; again when crews or methods change | https://www.miter.com/resources/job-hazard-assessment/ |
| Do checklist inspections (scaffold, equipment, permits for hot work) | Daily / weekly | https://3psafetystaffing.com/site-safety-manager-job-description/ |
| Handle incidents and near misses; update OSHA 300 log | As needed | https://3psafetystaffing.com/site-safety-manager-job-description/ |

**Patterns relied on.** Checklist form with pass/fail/NA, action tracker with status chips, observation with photo and pin, trend chart of leading indicators.

**Pain points**
- Paper forms sit in trucks, get re-typed by someone guessing at handwriting; by review time data is three days old. https://abccarolinas.org/construction-safety-data-capture-from-paper-checklists-to-real-time-risk-intelligence/
- Data spread over paper, spreadsheets, email, and several systems hides trends. https://www.hcss.com/blog/construction-safety-software-benefits/
- Teams rely on lagging numbers (recordables, claims) and learn about a problem after someone is hurt. A cluster of near misses in one trade is a leading sign. https://abccarolinas.org/construction-safety-data-capture-from-paper-checklists-to-real-time-risk-intelligence/

**Harness insights** (all INFERRED)
1. **Observations list:** "Today's 42 photos show 3 possible hazards: open edge at L4 east, no guardrail; ladder on stair landing; missing hard hat in 1 photo. Create observations?"
2. **Leading indicator card:** "Scaffold items failed in 3 of the last 5 inspections, all Framer Co. Plan a toolbox talk."
3. **JHA card:** "Tomorrow's lookahead adds roof work. The current JHA has no fall-protection section for roof. Review."

---

## 6. Project engineer (useful: owns the logs the PM reads)

**Device and context.** Laptop, office or trailer (INFERRED). Drafts RFIs for the PM; carries out RFI answers (https://learn.procore.com/contract-administration-rfis-and-submittals).

**Top jobs.** Keep RFI and submittal logs, meeting minutes, and daily log support (https://www.procore.com/project-management/rfis, https://www.procore.com/project-management). Keep the drawing set current (INFERRED).

**Harness insights** (INFERRED)
1. **RFI draft:** "Photo #118 (pinned C4, L2) shows the duct clash. RFI draft filled with sheet, grid, and photo."
2. **Drawing revision:** "Sheet M-201 rev C landed. 14 photo pins on rev B now sit on changed areas. Re-check 3."

## 7. Architect (useful only for submittal review and site visits)

**Device and context.** Desktop PDF tool. Bluebeam Studio Sessions: many reviewers mark up and stamp one file, each mark with name and time; stamps such as Approved, Rejected, As-Built (https://www.bluebeam.com/workflows/rfis-and-submittals/, https://www.bluebeam.com/resources/pdf-markup-in-construction-guide-2026/).

**Harness insight** (INFERRED): on a site-visit report, "Your comment 7 from 9/10 (tile layout, lobby) has a 9/24 photo that shows it built as marked."

---

## 8. Takeaways for the build (all INFERRED)

1. **One shell, role-picked default screen.** Super: Daily Log + lookahead. PM: Open Items + budget + OAC report. Owner: weekly report + then/now. Foreman: My Tasks on a sheet. Safety: action tracker + observations. The cards match the Procore and Autodesk Build home cards above, so they look familiar.
2. **Insights are chips on existing rows, not a new page.** Each insight names a count, a source ("from 42 photos"), and one action (Draft / Link / Mark ready). This keeps the app from looking like an image analyzer or a dashboard, which the hackathon rules ban (`docs/05-rules.md`).
3. **Photos are the join key.** Every insight above ties a photo (time, place, pin, trade) to an item that already exists: log, punch, RFI, CO, pay line, observation, JHA. That is the storage and memory load the harness must handle.
4. **Strongest demo moments:** daily log drafted from photos (super), pre-drywall gap warning (super / owner), punch item "looks fixed" (foreman / super), pay-app vs photo mismatch (owner). Each has a sourced pain point above.
