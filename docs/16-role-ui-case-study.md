# Role UI case study: show people what they already see
<!-- @s1.29 -->

*Source of record for what each role sees in the app (`ui/apps/web`). The research, with a URL
for every claim, is in [sources/construction-role-screens.md](sources/construction-role-screens.md).
Lines marked INFERRED there are our own reasoning.*

## The rule

Each role opens a project and sees the screens it uses today: the daily log, the punch list, the
pay application. The harness adds one insight on top of each screen. It does not add a new page.

```
┌──────────────────────────────────────────┐
│ Daily log · today            (familiar)  │
│ ┌──────────────────────────────────────┐ │
│ │ 3PT noticed · read 42 photos         │ │  ← harness insight
│ │ Draft ready: 6 trades, 1 delivery    │ │    says what it looked at
│ │ [photo][photo]    Not now  [Review]  │ │    one action, one "no"
│ └──────────────────────────────────────┘ │
│ Manpower   6 companies       Drafted     │  ← the screen they know
│ Weather    Clear, 64°F       Filled      │
│ Notes      Empty             You         │
└──────────────────────────────────────────┘
```

Three reasons:

- **Nothing new to learn.** The widget names match Procore and Autodesk Build home cards
  (My Open Items, Daily Log, Punch List). A new user already knows where to look.
- **Every claim can be checked.** Each insight names its basis ("read 42 photos"). The user can
  open the photos behind it.
- **Every tap teaches the harness.** "Review", "Not now" and "not helpful" go to the event log.
  The Instrument stage reads that log to rewrite which insights each role gets. This keeps the
  app a harness surface, not an image analyzer or a dashboard (`docs/05-rules.md`).

## What each role sees

| Role | Device | Screens they know (first 3 cards) | 3PT insight on top |
|---|---|---|---|
| Superintendent | Phone and tablet on site | Daily log · Level 2 before walls close (lookahead) · Punch list | Daily log drafted from today's photos. Unit 206 has no pipe photo and closes Thursday. 3 punch items look fixed in a newer photo. |
| Project manager | Laptop in the office | My open items (ball in court) · Owner report · Change orders | RFI-032 has 2 photos of that exact spot. Owner report drafted from 310 photos. CO-014 has photos that prove the work. |
| Owner | Weekly, any device | This week vs last week · Pay application · Handover records | 6 then-and-now pairs. Drywall billed at 80%, photos show about 55%. Unit 206 pipe photo missing before the wall closes. |
| Plumbing foreman | Phone on site | My tasks · Rough-in photos (pre-drywall checklist) · Daily report and time cards | 2 punch items have a crew photo today. Unit 206 needs a pipe photo. Hours drafted, 9 photos attached. |
| Safety manager | Phone or tablet on site | Observations · Inspections · Job hazard plan | 1 open edge with no rail in today's photos. Scaffold failed 3 of 5 checks, one company. Roof work next week has no fall plan. |

After the first three cards, "Show more" opens: this week in photos, time savers, and what the
assistant learned. The layout lives in `LAYOUT` and the widgets in `WIDGETS`
(`ui/apps/web/src/data.ts`).

## Why these moments

Four moments have the strongest sourced pain behind them. Use them in the demo.

| Moment | Role | Pain it answers |
|---|---|---|
| Daily log drafted from photos | Superintendent | A blank daily log takes 30+ minutes a day (vendor source). |
| Pipe photo missing before the wall closes | Superintendent, owner | After drywall, the photos are the only record of what is inside the wall. |
| Punch item looks fixed | Foreman, superintendent | Punch items wait for a person to walk and check each one. |
| Pay line billed ahead of the photos | Owner | Owners find it slow to check the monthly pay application. |

The industry number behind all four: people lose 5.5 hours a week to looking for project data
(PlanGrid and FMI, 2018, 599 people).

## Open questions

- All data is AUTHORED sample data. The insight text must come from the harness once the API
  serves it. The shape to keep is `Insight` in `ui/apps/web/src/data.ts`.
- Frequencies and devices per role are mostly INFERRED. A 10-minute talk with one real
  superintendent would confirm or change the first three cards.
