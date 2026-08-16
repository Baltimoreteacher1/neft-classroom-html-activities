# Focus School — the school-planning system

How the planner decides what Noam should do next, and where each rule lives.

## Architecture

```
planner-core.js   pure rules   no DOM, no storage, no clock reads
      ▲
      │ window.PlannerCore
      │
   app.js         School OS layer   views, actions, state wiring
      ▲
      │ state (IndexedDB + localStorage mirror)
      │
  /api/state      Cloudflare KV      +  /api/live (SyncRoom Durable Object)
```

`planner-core.js` is loaded by `index.html` **before** `app.js` and holds every
scheduling decision. It never reads the clock — callers pass `todayIso` and
`nowMin`. That is what makes the whole planner unit-testable without a browser.

The "School OS layer" inside `app.js` (search for `SCHOOL OS LAYER`) is
presentation and wiring only. It must not re-implement a rule that belongs in
the core.

## Data model

Everything lives on the single synced `state` object.

| Concept                                        | Where                              | Notes                                     |
| ---------------------------------------------- | ---------------------------------- | ----------------------------------------- |
| Assignment / project / assessment / study task | `state.assignments[]`              | discriminated by `kind`                   |
| Project steps                                  | `assignment.steps[]`               | each may carry `date` + `minutes`         |
| Study sessions                                 | `state.studyPlans[assessmentId][]` | generated, not hand-made                  |
| School timetable                               | `state.schedule`                   | periods, rotation, exceptions, activities |
| Packing needs                                  | `state.subjectNeeds[classId]`      | `["PE clothes"]`                          |
| Packing checkboxes                             | `state.packLog[dateIso]`           |                                           |
| Duration learning                              | `state.estimateModel[classId]`     | `{ ratio, n }`                            |

### Dates: four different things, never conflated

- `due` — the real deadline. **The planner never rewrites this.**
- `plannedDate` — the day the WORK is planned for. This is what moves.
- `originalDue` — set once, the first time anything is rescheduled.
- `completedAt` — when it was actually finished.

`PlannerCore.workDate(item)` returns `plannedDate || due` and is the scheduling
identity of an item.

### Virtual items

The planner pool (`plannerItems()`) contains items that are **not** assignments:

- a project contributes its _current step_, with `projectId` + `stepId`
- an assessment contributes its _due study sessions_, with `assessmentId`

Their ids are not assignment ids. **Any code that mutates real data must call
`owningAssignmentId(item)` first.** Forgetting this is exactly how "set this
aside" silently no-opped on a study session (regression test covers it).

## Priority algorithm

`PlannerCore.scoreItem` / `prioritize`. Deterministic and explainable — every
item carries the one sentence that justifies its position.

Bands (spaced so no modifier can jump an item between bands):

| Situation            | Score                          |
| -------------------- | ------------------------------ |
| Overdue              | `1000 + min(200, daysLate×10)` |
| Assessment today     | 900                            |
| Due today            | 800                            |
| Due tomorrow         | 700                            |
| Assessment in N days | `700 − N×30`                   |
| Due in N days        | `620 − N×25`                   |
| Assessment, no date  | 300                            |
| No due date          | 200                            |

Modifiers: started `+40`, importance `±25`, project step planned today `+60`,
fits the time left `+15`, too big for the time left `−50`.

Ties break on: shorter estimate → due date → title → id. Input order can never
change the output.

Assessments themselves are **excluded** from the ranking — you don't "do" a
quiz, you study for it.

## Study plans

`buildStudyPlan(assessment, todayIso)`. A quiz gets up to 3 sessions, a test up
to 4, spread evenly across the days that actually exist. The ladder is applied
nearest-last, so the final session before the assessment is always a light
review, never new material. Entered late, the plan **compresses** (fewer
sessions, longer each) rather than inventing days. Completed sessions survive
regeneration.

## Projects

`defaultProjectSteps(title)` picks a step list by project kind (writing /
research / build / presentation). `scheduleProjectSteps` fans the steps across
the days before the deadline, with "turn it in" landing on the due date itself.
`currentProjectStep` surfaces the first unfinished step due on or before today.

Projects are auto-decomposed at boot if they have no dated steps, so a project
that arrives by sync or import can never sit as one intimidating blob.

## Available time and Start My Plan

`availableMinutes` starts the clock at dismissal (not at the moment he opens the
app), subtracts any scheduled activity, and caps at a humane after-school
ceiling (`settings.maxWorkMin`, default 150).

`buildPlan` fills that budget in priority order, chunking anything long into
blocks of at most 30 minutes, inserting breaks only _between_ work blocks and
never at the end, and reporting what did not fit as `leftOver`.

## Missed-work recovery

`recoveryFor` recommends one safe move per unfinished item:

- overdue or due today → **finish now** (it cannot move)
- tomorrow already loaded past capacity → push further out
- otherwise → tomorrow

`applyRecovery` moves `plannedDate` only, preserves `originalDue`, and appends
to `planHistory`. `repairMissedWork()` runs at boot and is idempotent.

## Blocked work

`assignment.blocked = { reason, since, nextAction }`. Blocked items are removed
from the planner pool (so they never dominate Next Up) but stay visible in a
"Waiting on something" card, and setting one aside creates a school-context
reminder for the next morning.

## Natural-language entry

`parseEntry(text, { todayIso, classes })` — deterministic, no AI. Recognizes
durations, quiz/test/project, relative and absolute dates, ranges
("chapters 3-4"), and class names. Returns a `confidence` of high/medium/low;
**low confidence must be shown for confirmation, never saved silently.** The
UI previews the parse live before anything is created.

## Schedule model

Periods carry `days` and optional `rotationDays`. `rotationDayFor` walks
**school days only**, so weekends and no-school days never consume an A/B slot.
Exceptions (`no-school`, `early-dismissal`, `modified`, `event`) override the
weekday timetable and feed Today, packing, and available-time calculations.

## Parent / setup

`state.settings.parentPin` gates the Setup view. The parent summary answers one
question — _does he need help?_ — from risk signals (an assessment near with no
study done, a project with many steps left, work moved repeatedly, blocked
work). It is deliberately **not** an activity log.

## Sync

Unchanged from the existing design: full-state push/pull to KV, `mergeStates`
last-write-wins per entity with tombstones, plus the `SyncRoom` Durable Object
as a realtime accelerator. New maps (`studyPlans`, `subjectNeeds`, `packLog`,
`estimateModel`) merge with the containing document. `normalize()` is
idempotent and self-heals duplicate classes on every load.

## Migration

`normalize()` adds all new keys with safe defaults and never drops unknown
data. Existing assignments become `kind: "assignment"` with empty
`plannedDate` / `originalDue`. Verified against Noam's real production state
shape in `test/focus-school-school-os.test.mjs`.

### Class de-duplication

Classes were historically re-seeded whenever a device's list was momentarily
empty, then unioned by id on sync — Noam's live account had grown to ~120
classes. `dedupeClasses()` collapses by name, keeping the **oldest** id so
existing `assignment.classId` references stay valid. It runs inside
`normalize()`, so it self-heals on every load and after every merge.

## Testing

```bash
node test/focus-school-planner-core.test.mjs   # 66 pure-rule checks
node test/focus-school-school-os.test.mjs      # 28 integration/migration checks
node tools/focus-school-qa.mjs [baseUrl]       # 53 real-browser user-flow checks
npm test                                        # everything
npm run qa:loop                                 # full pre-push gate
```

The browser QA drives the actual student flow (start → focus → complete →
next up advances, stuck, overwhelmed, blocked, packing, quick entry) and checks
responsive layout and accessible names. Run it against production too:

```bash
node tools/focus-school-qa.mjs https://noam.eduwonderlab.com/
```

## Deploying

`focus-school` is a **direct-upload** Cloudflare Pages project — pushing to
`main` does not deploy it.

```bash
ALLOW_DEPLOY=1 npm run ship -- <sha>     # push to main (classroom copy + source)
ALLOW_DEPLOY=1 npm run deploy:noam       # the real noam.eduwonderlab.com
```

**Version-bump contract** — bump together or returning PWAs keep a stale shell:

1. `sw.js` `const VERSION`
2. the `?v=NN` query strings in **both** `sw.js` precache and `index.html`
   (`styles.css`, `planner-core.js`, `app.js`)

`test/focus-school-school-os.test.mjs` asserts index.html and sw.js agree on
every asset version, and that `planner-core.js` loads before `app.js`.
