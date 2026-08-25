# Class-aware pacing: what is shared, what is per-class, and why

One pacing system, one canonical curriculum, three class-aware teaching plans —
without three drifting copies of the year.

## The seam

`resolveYear(baseline, overlay)` in `shared/pacing/engine.js` takes a plain
`{date → overlay}` map. That is the entire integration point, and it is why the
engine never learned what a class is.

```
data/pacing-baseline-2026-27.json      the district's original plan (immutable, shared, not in D1)
        ↓
pacing_day WHERE section = ''          the SHARED plan: grade-wide deltas
        ↓
pacing_day WHERE section = '601'       the CLASS plan: only what this class did differently
        ↓
effectiveOverlay(shared, class)  →  resolveYear(baseline, overlay)  →  the five views
```

Class awareness is **composed into the overlay before the engine sees it**. The
ripple, absorbers, locked days, closure skipping, refusal-rather-than-truncation
and undo are untouched and stay exactly as validated. `shared/pacing/engine.js`
is byte-for-byte unchanged by this work, and `validate:planning` fails if the
word "section" ever appears in it.

Adding a class costs nothing until that class diverges.

## What is global vs class-specific

Decided deliberately, not by scoping every field:

| Data                                          | Layer                       | Why                                                                     |
| --------------------------------------------- | --------------------------- | ----------------------------------------------------------------------- |
| Instructional calendar, closures, school days | **baseline**                | The district decides when school happens. No class can differ.          |
| Unit order, canonical lesson metadata         | **baseline / manifest**     | One curriculum. Resolved at render time, never copied into the planner. |
| Grade-wide re-pace, snow day, schedule change | **shared** (`section = ''`) | True of all three classes; storing it three times is how they drift.    |
| Lesson moved / continued                      | **class**                   | 601 continuing 5-2 says nothing about 602.                              |
| Actual lesson taught                          | **class**                   | The whole point of "actual" is that it differs per period.              |
| Teacher note                                  | **class**                   | Notes are about how _this_ period went.                                 |
| Lock                                          | **class**                   | A class locks its own day.                                              |

## Field-level, not row-level, merge

`mergeDay()` merges the four overlay fields (`plan`, `actual`, `note`, `locked`)
independently. Absent means inherit.

This matters for usability: a teacher records "601 actually taught 5-3" without
restating the plan, and a grade-wide snow day reaches all three classes unless
one has said otherwise. Row-level replacement would force every class row to
carry a copy of the shared plan — exactly the triplication this design exists to
avoid.

**Known limit, accepted deliberately:** a class cannot express "I have _no_ note
where the shared plan has one". Absent means inherit, so there is no tombstone.
In practice a teacher clears their own note, not the grade's, and inventing a
tombstone value would complicate every read for a case that has not come up.

## Storage

`pacing_day` is keyed `(school_year, section, date)`. `pacing_op` and
`pacing_change` carry `section` so history and undo can say — and restrict
themselves to — which class an operation belonged to.

Persistence stores **canonical ids and deltas only**. Never lesson titles,
objectives, standards, vocabulary or URLs; those resolve from the curriculum
manifest at render time, so a lesson renamed in the curriculum is renamed in the
planner. A test asserts none of those strings can appear in a planner row.

## Migration (v1 → v2)

Legacy planner data becomes the **shared plan**, inherited by all three classes,
and diverges only when a class is explicitly edited. That is the whole semantic,
and `ADD COLUMN section TEXT NOT NULL DEFAULT ''` implements it by doing nothing
— which is why the section id is the empty string rather than a `'default'`
sentinel that would have required rewriting every row to mean what it already
meant.

The primary-key widening needs SQLite's table-rebuild dance, so
`functions/_lib/pacing-schema.js` is written to be:

- **idempotent** — every step inspects the live schema first; a repeat run is a
  no-op and a half-finished previous attempt resumes rather than corrupts;
- **fail-closed** — if the copy cannot be verified by row count, it throws
  _before_ dropping anything, and the endpoint answers 503. A planner that will
  not save is recoverable; one that saved into a half-migrated table is not;
- **lossless** — the copy is column-explicit, and an unrecognised column aborts
  the migration rather than being silently dropped;
- **versioned** — `pacing_meta.schema_version`. A version newer than this code
  understands is refused outright, because a rollback reading a future schema
  with old assumptions produces plausible, wrong data.

**Measured before any of it was written: production `pacing_day`, `pacing_op` and
`pacing_change` all held ZERO rows.** In production this is a schema change over
empty tables. Everything above is for the deployments that are not production —
the local test D1, a restore from backup, and whoever runs this next year with a
full year of plans in it.

## Offline

The outbox is one ordered queue, and each entry is **stamped with its class at
queue time**. `drain()` sends each entry to the section recorded on it, not to
whichever class is selected when the network returns — otherwise an edit made in
601 on dropped classroom wifi replays into 602, silently, while the planner says
Saved.

Overlay caches are keyed per layer (`nt-pacing:overlay:shared`, `:601`, …). A
single cache key would serve 601's plan to 602 on the next offline open with
nothing to contradict it.

## Context across surfaces

The active class lives in `curriculumTeacherWorkflow:v1.section` — the key the
curriculum hub's own picker already writes. Picking 602 in the planner and
picking 602 on the hub are the same act. The planner also accepts `?section=` so
a bookmarked link opens on the right class; unknown values fall back to the
shared plan, never to a guessed class.

Teacher keys never travel in a URL. A class number is not a secret.

## What the gates hold

`validate:planning` fails if:

- `shared/pacing/engine.js` mentions a section (the engine must stay class-agnostic);
- any query against `pacing_day` / `pacing_op` / `pacing_change` is unscoped
  (`GROUP BY section` counts as scoped — the health route reports per-layer
  totals on purpose);
- `pacing_day` writes do not carry a section;
- `shared/pacing/sections.js` drifts from the roster source in
  `supports-schema.js`, or the planner hardcodes a second `["601", "602", …]`;
- the schema module stops refusing a future version, or the endpoint stops
  failing closed on a schema error;
- the outbox drains without the section recorded on each queued operation.

All six are mutation-tested.
