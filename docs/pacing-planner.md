# Live Pacing Planner — `/curriculum/planning/`

The SY 2026–27 Grade 6 Math year plan, live. It answers three questions the
printed calendar cannot: what am I teaching today, what actually happened, and
what moves if today is lost.

Teacher-gated (`functions/_lib/teacher-surface.js`). No student data of any kind
is stored — this is curriculum pacing only, which is why it needs no per-student
privacy model.

---

## Where each fact comes from

There is exactly one authority per kind of fact. This is the whole architecture.

| Fact                                                         | Authority                            | Where it lives                                                  |
| ------------------------------------------------------------ | ------------------------------------ | --------------------------------------------------------------- |
| Closures, PD, quarters, breaks, early releases, MCAP window  | The official SY26-27 school calendar | `data/pacing-baseline-2026-27.json` (generated)                 |
| Unit order, unit day budgets, assessment placement           | Course 1 scope and sequence          | same file                                                       |
| Lesson title, standard, objective, vocabulary, every URL     | The live curriculum                  | `data/curriculum-launch-manifest.json`, read at **render time** |
| Which lesson is on which date **now**, actuals, notes, locks | The teacher                          | D1, via `/api/pacing`                                           |
| Printable / editable copies                                  | Generated on demand from the above   | DOCX + XLSX export                                              |

The planner stores **deltas only**. It never copies a lesson title, standard or
URL into its own storage, so a lesson renamed in the curriculum is renamed in the
planner and in every export, with nothing to re-sync.

---

## The three layers of a day

Each date carries all three at once, and the UI shows all three:

- **original** — the August baseline. Never written to.
- **plan** — the schedule as it stands now.
- **actual** — what was taught.

A pacing change never erases the original. That is what makes the Adjustment Log
and the "Shifted" chip possible in March.

---

## Seeding

`data/pacing-baseline-2026-27.json` is **generated**, by
`node tools/import-pacing-baseline.mjs`, from
`docs/pacing-sources/plan-baseline.json` — the validated pacing build that
produced the printed DOCX and XLSX before this planner existed (13/13 checks, and
its print QA is recorded in `docs/pacing-sources/planning-notes.md`). The raw
district documents and the Python that read them sit beside it, under `docs/`
because that is the one top-level directory Vite does not publish.

**Import once, then live.** Re-running the importer re-seeds the baseline and
does not touch D1, so a teacher edit made in March cannot be overwritten by a
re-import. `tools/pacing-baseline-fresh.test.mjs` fails if either generated file
stops matching its source.

A second, tiny generated file — `data/pacing-unit-ranges.json` — exists for one
reason: `/curriculum/units/` used to carry its own hardcoded unit date ranges
inside `assets/curriculum-district-pacing.js`, and they had already drifted (the
Pre-Unit ran to 9/10/26 there and to 9/8/26 in the plan being taught). The hub
now reconciles against this file on load. It is 3 KB rather than the 400 KB
baseline because that page is student-facing and sits against a request budget.

---

## The re-pacing engine

`shared/pacing/engine.js` — pure functions, no DOM, no fetch. Every teacher
action is one primitive, `insertAt`: put a payload on a date and let what was
there ripple forward until something absorbs it.

- **Absorbers** — Flex, Catch-Up, Review and Lost days. The ripple stops at the
  first one; nothing after it moves.
- **Barriers** — a locked day keeps both its date and its content; the ripple
  routes _around_ it. School closures are skipped silently, because they are not
  dates, not obstacles.
- **Refusals** — a ripple with no absorber and no room left in the year is
  refused with a reason, never truncated. Scheduling onto a closed day is
  refused. Moving a locked day is refused.
- **Nothing mutates.** Every action returns a plan of changes which the UI
  previews; only Apply writes.

One POST is one operation, with its inverse stored beside it _before_ the writes
land — which is what makes "Undo last adjustment" honest for a 13-day cascade.

---

## Saving

`curriculum/planning/planning-store.js`, modelled on the Plan Notes store.
Every edit goes to `localStorage` first and is pushed to D1 after; the outbox
drains on load, on reconnect, and after every write.

**"Saved" is only ever set by a 2xx from the server.** A failed push leaves the
edit on screen and the status reading "Not saved yet — retrying". Nothing is
discarded.

---

## What connects to what

| It needs                                                                                                                   | It uses                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Whole group, Extra Support, Challenge, catch-up, notes, homework, worksheet, family page, exit ticket, culminating project | `data/curriculum-launch-manifest.json`, by lesson id — the 168 small-group variants need no mapping, they are keyed to their parent lesson                              |
| A lesson plan for a date                                                                                                   | `/teacher-tools/lesson-plan-generator/` via **its own** deep-link contract (`date`, `standard`, `topic`, `focus`). The generator names its exports `Neft.Alba — [date]` |
| Resources for a standard                                                                                                   | `/teacher-tools/resource-finder/?standard=…`                                                                                                                            |
| Plan Week                                                                                                                  | `/curriculum/units/` — its weekly planner has a **Fill from the pacing plan** button that reads this plan (live overlay first, published baseline as fallback)          |

---

## Running it locally

```sh
npm run build
TEACHER_KEY=devkey npx wrangler pages dev dist --port 4500 --local \
  --binding TEACHER_KEY=devkey SITE_PASSWORD=devpw \
  --d1 DB=neft-student-progress --compatibility-date=2026-05-25
```

Then open `http://localhost:4500/curriculum/planning/` (Basic auth: any
username + `devpw`) and enter `devkey` in the teacher-key field.

`npm run preview` serves the static page but **not** `/api/pacing`, so the
planner opens read-only there — which is itself worth checking occasionally.

### Running the AUTHENTICATED smoke test

`npm run smoke:planning` skips its authenticated phase without credentials, and
production credentials are the wrong thing to reach for: the round trip writes
and undoes a real day. Point it at the local dev server above instead, whose
D1 is a disposable local SQLite file:

```sh
npm run build
TEACHER_KEY=devkey npx wrangler pages dev dist --port 4577 --local   --binding TEACHER_KEY=devkey SITE_PASSWORD=devpw   --d1 DB=neft-student-progress --compatibility-date=2026-05-25 &

TEACHER_KEY=devkey PLANNER_BASIC_AUTH="teacher:devpw"   node tools/smoke-planning.mjs --base http://localhost:4577
```

All 14 checks run, including preview-purity, apply, reload, undo and the
residual-mutation check. Two things were found the first time this phase
actually executed, both in the TEST rather than the planner:

- it POSTed `writes` with no `inverse`, so `undo` correctly refused with 409
  "recorded without a reversal" — a shape the real client never sends;
- it compared the overlay byte for byte afterwards, which can never pass for a
  day touched for the first time, because the client's own inverse
  (`note: prior.note ?? null`) leaves an all-null row where there was none.

That is what a permanently-skipped test costs: two years of green reports about
a phase that had never run.

---

## Gates

- `npm run validate:planning` — file lock, scoped CSS, and the three checks no
  per-file review catches: the day-type vocabulary agreeing across the engine,
  the API allow-list and the Edit Day form; the baseline still holding 210 dates
  / 180 instructional days and storing no curriculum title; the teacher gate and
  the no-student-data rule still in force.
- `npm test` — `shared/pacing/engine.test.mjs` (calendar facts, canonical
  mapping, cascade rules and every refusal), `shared/pacing/xlsx.test.mjs` (the
  workbook opens, its dates are real Excel serials, and it reflects the live plan
  rather than the baseline), `functions/api/pacing/pacing-api.test.mjs`
  (save/merge/change-log/undo against a real SQL engine, and a failed batch
  writing nothing at all), `tools/pacing-baseline-fresh.test.mjs`.

---

## Known limitations

- **Drag and drop is not implemented.** The required keyboard/button actions —
  Move Earlier, Move Later, Move to Date, Continue Tomorrow — are the primary
  and only interaction. Drag would be an addition, not a replacement.
- **In-building MCAP dates are not set.** The official window (Mar 29 – May 28)
  is displayed; the actual testing days are unknown and were not invented. Enter
  them as locked days when the school publishes them.
- **`/curriculum/units/` shows the plan of record, not live pacing.** It is a
  student-reachable page and cannot read the teacher-gated endpoint.
- Several planning assumptions are still marked CONFIRM — see the "Planning
  assumptions" link in the planner footer, and
  `docs/pacing-sources/planning-notes.md` for the full reasoning.
