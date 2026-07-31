# The Curriculum Nervous System

Six surfaces on `/curriculum/` that share one spine. Everything here is additive —
nothing that already existed was removed, replaced, or re-pointed.

## The idea

The platform already had breadth: 74 lessons, an arcade, projects, graphic novels,
family resources, ~40 teacher tools. What it did not have was a moment where all of
it behaves as one organism. The nervous system is that moment:

**sense → reason → act → sense again.**

- **Sense** — live misconception telemetry the lessons already emit.
- **Reason** — a prerequisite graph that can answer "what is actually underneath
  this struggle?"
- **Act** — generate the missing lesson, on the spot, at a real URL.
- **Sense again** — the forged lesson is instrumented like every other lesson, so
  its own results flow back into the same signal.

## The spine

### `data/standards-prerequisites.json` — hand-authored, the only new source of truth

48 prerequisite edges across 42 standards, each carrying a `strength`
(`core` / `supporting` / `fluency`) and a `why` sentence in plain English. Nothing
else in the repo encoded which standard has to come before another, so causal
tracing was impossible before this file existed. Also holds `tagStandards`: the
join from a live misconception tag to the standard it is diagnostic of.

### `data/curriculum-nervous-system.json` — generated, never hand-edited

Built by `tools/build-nervous-system.mjs` (`npm run generate:nervous-system`) by
fusing four existing files:

| Source                              | Contributes                            |
| ----------------------------------- | -------------------------------------- |
| `data/standards-taxonomy.json`      | the 47 authored standard rows          |
| `data/standards-prerequisites.json` | prerequisite edges + tag join          |
| `data/asset-concept-map.json`       | every asset that teaches each standard |
| `data/content-coverage.json`        | level 0/1/2 coverage and gap flags     |

Standard ids are **normalized** to the form the concept map already uses — cluster
letter dropped, sub-part de-dotted: `6.AT.A.3.a` → `6.AT.3a`. That is the only id
form that joins all four files, so it is the graph's node id. 47 taxonomy rows
collapse to 42 unique nodes.

Layout (`x`, `y`) is computed at build time and is fully deterministic — `x` is
longest-path depth from a root, `y` is a domain lane. `--check` asserts the
committed graph matches a fresh build, so a stale graph cannot ship.

### `functions/api/class-pulse.js` — the student-safe read

`/api/misconception-heatmap` is a teacher instrument: `TEACHER_KEY`-gated, returns
lesson slugs and per-lesson student counts. None of that may reach a student
device. Class Pulse is the deliberately impoverished alternative:

- misconception **tag counts only** — no lesson, no section, no student, no free
  text from any payload;
- a **closed tag vocabulary** — an unrecognised tag is dropped rather than echoed;
- a **k-anonymity floor** (`MIN_COHORT = 5` students, `MIN_EVENTS = 12`). Below it,
  `suppressed: true` and an empty tag list. With three kids in the data, "the
  class's top mistake" is one identifiable child's mistake on a shared screen.

Every client must treat `suppressed: true` as "fall back to curriculum defaults",
never as an error state.

## The six surfaces

| Surface                 | Path                                                       | Audience                     |
| ----------------------- | ---------------------------------------------------------- | ---------------------------- |
| Living Curriculum Map   | `/curriculum/map/` (`/map`)                                | everyone                     |
| The Forge               | `/curriculum/forge/` (`/forge`)                            | teacher                      |
| Class Boss              | `/curriculum/class-boss/` (`/boss`)                        | students, projector          |
| Teach the Machine       | `/curriculum/teach-the-machine/` (`/teach`)                | students                     |
| Weekly Family Broadcast | `/curriculum/family-connections/broadcast/` (`/broadcast`) | families                     |
| Student Work Gallery    | `/curriculum/showcase/` (`/showcase`)                      | students, teacher moderation |

All six are linked from cards at the top of the curriculum hub, under the
"Curriculum Nervous System" section header.

### Why the Forge is a Rollup entry

`curriculum/forge/index.html` is registered in `vite.config.js` under
`build.rollupOptions.input`, unlike every other page under `curriculum/` which is
copied verbatim. That is deliberate: the Forge imports the **real** lesson engine
(`bootLesson` from `@engine/core/lesson-renderer.js`), so a generated config runs
as a genuine lesson — hint ladders, vocabulary pop-ups, Spanish, learning supports
and telemetry all included — rather than as a preview of one.

Because `curriculum/` is also copied wholesale, the static copy would overwrite
Rollup's built HTML with the raw source. `BUILT_HTML_ENTRIES` in `vite.config.js`
snapshots and restores it, then **asserts by content** that the restored file
references a hashed bundle and not `./forge.js`. An existence check would pass just
as happily on a clobbered stub.

## Gates

`npm run validate:nervous-system` (wired into `npm run validate`, which the
pre-push hook runs) asserts:

1. the committed graph matches a fresh build;
2. the prerequisite graph is a DAG, every edge lands on a real standard, every
   edge has a real `why` sentence, and no standard is isolated;
3. every misconception tag the engine can emit maps to a real standard;
4. **the drift guard** — `class-pulse.js` inlines the tag vocabulary and the
   tag→standard map (Pages Functions cannot read repo data files at runtime), and
   that inlined copy must stay in parity with the data files. Drift here is
   invisible until a real class hits it. The k-anonymity floor is asserted to still
   exist and to still be ≥ 5;
5. the hub links to all six surfaces and every linked page exists on disk.

Each surface additionally ships its own validator: `validate:forge`,
`validate:class-boss`, `validate:teach-machine`, `validate:family-broadcast`,
`validate:showcase`.

## Coverage intelligence this surfaced

Building the graph produced real findings, recorded in the `gaps` block of the
generated file:

- **3 standards have no asset that teaches them** — `6.AT.11` (dependent and
  independent variables), `6.GR.3` (polygons in the coordinate plane), `6.NOS.5`
  (positive and negative numbers in context). Not a bug in the graph; a genuine
  hole in the curriculum.
- **34 standards have no extra-support (level 0) version.**
- **30 standards have no enrichment (level 2) version.**

Sub-part standards (`6.NOS.8a`) and umbrella parents (`6.AT.6`) that the concept
map does not index directly inherit their family's assets as `relatedAssets`, with
a `relation` and `taughtWithin` so the map can say where the teaching actually
lives instead of rendering an empty node.
