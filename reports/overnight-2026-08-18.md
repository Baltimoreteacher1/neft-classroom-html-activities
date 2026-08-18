# Overnight audit and hardening — 2026-08-18

Running log. Appended after every work block, whether it succeeded, failed or
was skipped. Written for a morning read: decisions first, then findings ranked
by student impact.

Rules in force: no pedagogical content changed unattended (R1); mechanical /
structural fixes only, each shipped with a gate (R2); every fleet-wide number
hand-checked on a sample before it is reported (R3); one deploy per work block
and only on a fully green chain (R4).

---

## BLOCK 1 · Private-catalogue sweep

### 1.1 The headline finding — the unit hub serves the wrong lesson's materials

**Status: PROVEN IN A BROWSER, on the real page, with the shipped code.**

`/curriculum/units/` is the page a student or teacher opens to reach a lesson's
bonus activity and its printables. It builds that list at runtime in
`assets/curriculum-hub-search.js`: it scrapes each `details.lesson` block, reads
the lesson id out of that lesson's own `/lessons/<id>/` link, and looks that id
up in two catalogues — `LESSON_BONUS_ACTIVITIES` (loaded from
`curriculum/lesson-bonus-activities.js`) and `LESSON_PRINTABLES` (an inline map
in `curriculum-hub-search.js`).

Both catalogues are keyed by the **pre-2026-08-10 lesson numbers**. The page
looks them up with **current** lesson numbers. The two number spaces overlap, so
almost every lookup succeeds — and returns a different lesson's material.

Measured in Chromium against `window.NTHubUnits`, the hub's own canonical
scrape, after the page finished rendering:

- 252 lesson rows on the page (84 core lessons × core + group1 + group2)
- 174 rows are offered a bonus activity — **147 of them link to a different
  lesson**
- 174 rows are offered printables — **147 of them serve a different lesson's
  worksheet, word search, colour-by-number and MCAP packet**
- 78 rows (26 core lessons × 3) are offered **neither**, including lessons whose
  materials exist on disk and are being shown on some other lesson's row

Concrete instances, read off the rendered page:

- Lesson **1-1 "Math is Mine"** offers "🔐 Factor Tree Code Breaker" →
  `/lessons/6-13/?extra=activity`, and "📝 Practice Worksheet (A & B)" →
  `/lessons/6-13/worksheet.html`. Lesson 6-13 is *Prime Factorization*.
- Lesson **8-3 "Write and Solve Equations Using Multiplication or Division"**
  serves lesson **2-9**'s printables — *Describe Data by Mean Absolute
  Deviation*.
- Lesson **10-4 "Math is Ingenuity"** serves lesson **5-7**'s printables —
  *Determine Surface Area of Prisms*.
- Lesson **6-13 "Prime Factorization"** — whose activity is being handed to 1-1
  — is itself offered nothing.

Student impact: a student who clicks "Practice Worksheet" on the lesson they are
actually in downloads a worksheet for a different unit. A teacher who assigns
the bonus activity from the hub assigns the wrong one. This is silent: every
link resolves HTTP 200, so nothing 404s and no check that only asks "does this
link work?" can see it.

Root cause: both catalogues were generated before the 2026-08-10 Reveal-TOC
renumber and never regenerated. `curriculum/lesson-bonus-activities.js` says
"Auto-generated … do not edit by hand", and its generator
(`scripts/generate-lesson-bonus-map.mjs`) keys strictly by the on-disk lesson
directory — so a fresh run cannot produce the committed file. The committed file
is stale, not wrong-by-design.

**Hand-check (R3).** The fleet number 147 rests on a detector that compares each
map key against the lesson id its own entries link to. Sampled 10 printable keys
and 11 bonus keys deterministically and checked each against
`lessons/<id>/config.json` on disk:

- bonus map, 11 sampled: 9 disagreeing keys all genuinely misrouted (the
  activity name matches the *target* lesson's `practice.optionalActivity.name`,
  never the key lesson's); 2 agreeing keys (4-2, 5-1) genuinely coincide because
  the renumber left those ids unchanged. 11/11 correct.
- printables map, 10 sampled: 8 disagreeing keys all genuinely misrouted (served
  files sit under the target lesson's folder and match its title); 2 agreeing
  keys (3-1, 5-1) genuinely coincide. 10/10 correct.
- No false positives found. All 280 printable hrefs resolve to files that exist
  on disk, no key has more than one target lesson, and no two keys target the
  same lesson — so the re-key has exactly one unambiguous answer.

### 1.2 The false lead this detector started as (recorded so it is not repeated)

The first pass of this sweep counted distinct `"N-M"` literals per file and
compared them against `data/curriculum-manifest.json`. It reported that eight
unrelated surfaces were each missing the same 26 lessons and each listed the same
6 phantoms. Identical results across eight independent files is the signature of
a broken detector, not of eight independent bugs.

It was broken. Those files are **legacy-keyed**, and the legacy and current id
spaces are both `\d+-\d+`, so every legacy key looked like a current lesson and
every renumbered lesson looked missing. The second pass — resolve each literal
through `data/toc-migration.json` first — was also wrong, in the other
direction: it "translated" files that were already current-keyed
(`curriculum/lesson-family-homework.js`, `engine/core/small-group-math-check.js`)
and reported 19 phantom gaps in files that are complete.

Neither number is in this report. The detector that is reported here compares a
key against **the link inside its own entry**, which needs no external table and
cannot be fooled by an id that exists in both schemes.


### 1.3 What shipped in Block 1

Three mechanical fixes, one new gate, one widened ratchet.

**Fix A — regenerate the bonus-activity catalogue.**
`curriculum/lesson-bonus-activities.js` is auto-generated and says so, but its
generator threw on every run: it insisted on `BEGIN/END_LESSON_BONUS_MAP`
markers in `curriculum/index.html` that no longer exist, because both hub pages
now load the file with a plain `<script src>`. A generator that cannot be run is
not a source of truth, which is exactly how the file stayed on the old numbers.
The generator now injects when the markers are present, says so when they are
not, and always writes the file that is actually loaded. Regenerated output: 65
entries, every key equal to the lesson its own link targets.

**Fix B — re-key the printables catalogue.**
`LESSON_PRINTABLES` in `assets/curriculum-hub-search.js` cannot be regenerated
here: `scripts/integrate-lesson-printables.mjs` is a one-shot import from source
folders on Joel's own machine. It did not need to be. Every entry's files
already sit under the correct current lesson folder — only the key was stale —
so each key was set to the lesson its own hrefs point at. That answer is unique
and checkable: no key had more than one target lesson, no two keys targeted the
same lesson, and all 280 hrefs resolve to files that exist. As an independent
corroboration, all 55 re-keys agree exactly with `data/toc-migration.json`,
which was never consulted to compute them.

**Fix C — the units hub was serving a cache-stamped-stale script.**
`curriculum/units/index.html` loaded `/assets/curriculum-hub-search.js?v=8d0adf7a`.
That stamp matches no version of the file — not the current one and not HEAD's
(`9b8781e6`) — and it has been there for this repo's entire history. The stamp
IS the content hash, so a browser that cached that URL could never be given a
hub-search update, including the fix above. Both pages now carry `?v=ebba8de4`.

**Gate — `npm run validate:lesson-catalogues`** (`tools/validate-lesson-catalogues.mjs`,
wired into `npm run validate` and into `qa:fast` coverage). Three invariants over
all three hub catalogues, each with its own consequence message: key agreement,
disk in both directions, and parents-as-well-as-children. Self-tests six
detectors against known-bad fixtures before sweeping. Each direction was proven
to fire independently and then reverted clean:

- revert the printables re-key → 55 mislabelled keys reported, plus 24 omissions
- revert the regenerated bonus map → 55 mislabelled, 24 omitted, 23 phantom
- drop one key → the omission fires alone, naming the lesson
- add a key for a lesson with nothing on disk → the phantom check fires alone
- key `5-1-group1` instead of `5-1` → the variant-key check fires
- create an orphan `lessons/77-7-group1/` → the parent check fires

**Ratchet widened — `tools/curriculum-hub-assets.test.mjs`.** It recomputed each
hub asset's content hash but read only `curriculum/index.html`, which is why
Fix C's stale stamp survived indefinitely. It now checks every tracked HTML page
that references one of those assets, discovered by scanning rather than listed,
so a third consumer cannot escape it the way the second one did. Proven by
restoring the stale stamp on `curriculum/units/index.html` (it names the file and
the exact replacement) and reverting.

**Browser verification, before and after,** on `/curriculum/units/` in Chromium,
reading the hub's own `window.NTHubUnits` after render:

- rows offered a bonus activity — before 174, after 195
- …of those, linking to a different lesson — before **147**, after **0**
- rows offered printables — before 174, after 192
- …of those, serving a different lesson's files — before **147**, after **0**
- rows offered no bonus at all — before 78, after 57

The remaining 57 are the 19 lessons (× 3 rows) whose `config.json` declares no
`practice.optionalActivity` — that is authored content, not a gap, and the gate
holds it against disk rather than against a number.

A note on that probe, since it was wrong once: the first version counted a
`-group1` row linking to its parent lesson as a mismatch and reported 165. Group
rows deliberately inherit the parent's activities — `curriculum-hub-search.js`
resolves `MAP[lessonId] || MAP[baseLessonId]` — so that is correct behaviour.
Corrected, the same pre-fix tree measures 147. 147 is the number in this report.

### 1.4 Second finding — Insight Brief's catch-up routing

`teacher-tools/insight-brief/insight-engine.js` carries `CATCHUP_BANDS`, a
hand-written map of which catch-up stations exist per unit (`1: [3, 7]` and so
on). It is used by `catchupPath()` to build the "send this student to a catch-up
station" link. The bands are on the OLD unit numbering, and 36 catch-up stations
exist on disk against the 20 the table declares.

Replaying the engine's own `catchupPath()` over all 84 lessons, with `_redirects`
applied:

- 69 lessons land on a catch-up station in their own unit
- **12 land in a different unit** — every unit-7 lesson (7-4…7-9) is sent to
  `/lessons/8-7-catchup/`, unit-1 lessons 1-4…1-6 to `/lessons/2-7-catchup/`,
  4-4 and 4-5 to `/lessons/3-8-catchup/`, and 9-4 to `/lessons/7-9-catchup/`
- **3 land nowhere**: lessons 10-4, 10-5 and 10-6 all route to
  `/lessons/10-5-catchup/`, which has no directory, no `_redirects` entry and no
  entry in `functions/_lib/redirect-map.js` — a dead link
- **18 of the 36 built catch-up stations can never be reached** from Insight
  Brief at all

This one is NOT fixed. Choosing which catch-up station covers which lessons is a
pedagogical decision, not a mechanical one. See Decision 2.

**Correction worth recording (R7).** The first pass on this reported that 34 of
84 lessons hit a 404. That was wrong, and it was wrong in the way this rule
exists to prevent: it read the disk and inferred the result. A local static
server does not apply `_redirects`; Cloudflare Pages does, and six of the seven
phantom stations are rescued by a 301. Parsing `_redirects` and re-resolving
gives 12 cross-unit and 3 dead, not 34 dead. Hand-checked 8 of the 8 station
paths involved against disk, `_redirects`, `data/routes.json` and
`functions/_lib/redirect-map.js`: 8/8 correct.

I could not confirm this against production — `https://eduwonderlab.com` was
unreachable from this session (curl exit 56 on every attempt), so every claim
about the live site tonight is from source and from a local browser, never from
the live origin.

### 1.5 Third finding — the projects catalogue is legacy-keyed too, and needs a human

`LESSON_PROJECTS` (also inline in `assets/curriculum-hub-search.js`, 34 keys)
links to games under `/math/unit-N/...` rather than `/lessons/<id>/`, so the
key-agreement invariant cannot see it. Its entry text can. Comparing each
entry's own text against lesson titles:

- 16 of 34 keys share more significant words with the title the key USED to name
  before the renumber than with the title it names today
- 1 matches the current lesson
- 17 are undecidable from text alone (generic game names like "Kitchen Chef Game")

Examples, all read off the file:

- key `1-1` → "Lesson 1-1: Prime Factorization Game". Lesson 1-1 today is *Math
  is Mine*; before the renumber it was *Prime Factorization*.
- key `9-3` → "Lesson 9-3: Compare and Order Integers Game". Lesson 9-3 today is
  *Write Equations to Represent Relationships Between Two Variables*.
- key `10-1` → "Lesson 10-1: Volume of Rectangular Prisms Game". Lesson 10-1
  today is *Math is Everywhere*.

The labels are internally self-consistent — they name the same number as the key
— so a teacher sees a plausible label attached to the wrong lesson's
mathematics. This is not mechanically fixable: re-keying requires deciding which
current lesson each game belongs to, and that is a content call. See Decision 1.

### 1.6 Catalogues checked and found sound

Recorded so they are not re-audited:

- **Arcade** (`curriculum/arcade/`, `math/games/index.html`): two hand-written
  lists of the same 12 game folders, and both are complete against
  `math/games/` in both directions. No gap.
- **Resource Finder**: derived — reads `/data/asset-concept-map.json`. Not a
  private catalogue.
- **Living Curriculum Map** (`curriculum/map/`): derived — reads the generated
  `/data/curriculum-nervous-system.json`. Not a private catalogue.
- **Study Pack**: single-sourced from `shared/study-pack/` and copied into both
  deploy roots by `tools/sync-study-pack.mjs` during `npm run build`. All three
  copies are byte-identical today.
- **Pacing Planner** (`curriculum/planning/`): derived — reads
  `/data/curriculum-launch-manifest.json` and `/data/pacing-baseline-2026-27.json`,
  and is already held by `validate:planning` and `validate:pacing-unit-order`.
- **Both project index mirrors** and the portfolio: already held against disk in
  both directions by `validate:hub`, added in `c1883486`.
- **`LESSON_FAMILY_HOMEWORK`**: correctly keyed — all 84 keys equal the lesson
  they link to, matching all 84 lessons with a `homework.html`. It is now under
  the new gate so it stays that way.
- **`teacher-tools/post-forms/`**: its catalogue is `forms-index.json`, 64
  entries on the OLD numbering, pointing at real external Google Forms. Not
  fixed and not gated — see Decision 3.


---

## BLOCK 2 · Progress event keys

Audit only. Nothing here had exactly one unambiguous canonical form, so nothing
was changed. Every finding is written as a decision below.

### 2.1 There is not one on-device signal — there are five stores

The Close the Loop card on `/curriculum/` says, in its own copy, "Reads the same
on-device learning signal that powers Insight Brief." That sentence is not true
of the code. The stores, with who writes and who reads each:

**Store A — `nt-signal:v1`** (`assets/nt-signal.js`, `window.NTSignal`)
- written by: `engine/core/lesson-renderer.js` (miss path + warm-up reteach),
  `engine/core/grade-emit.js` (the correct-answer path), the small-group studio
  (`engine/core/small-group-renderer.js`, under the BASE lesson id),
  `math/games/practice-arcade/`, `math/review-arcade/`
- read by: `/curriculum/my-progress/`, Close the Loop
  (`assets/curriculum-hub-pacing.js`, via `weakStandards`), the hub resume strip,
  both arcades (`topMisconceptions`, `suggestTier`), `engine/core/retrieval.js`
  (`dueStandards`)

**Store B — `nt_results_v1`** (`assets/nt-activity-kit.js`, `assets/nt-page-enhance.js`)
- written by: standalone graded activities — WebQuests, HyperDocs, Architect
  activities and anything else mounting the activity kit
- read by: `/math/my-progress/`, `assets/brain/brain.js`
- schema: `{schema, studentAlias, section, activityId, activityTitle, standard,
  scorePercent, skills, completedAt, deviceOnly}`

**Store C — `choiceboard-u1` … `choiceboard-u10`** (10 choice-board pages)
- written by: `math/choice-boards/unit-N/index.html`, cell-indexed array
- read by: `/math/my-progress/` only

**Store D — `neft-class-brain-v1`** (`curriculum/class-brain/`)
- self-contained; no other file writes or reads it

**Store E — `nt-project-complete:v1`** (`shared/projects/projects-complete.js`)
- read by exactly one surface, `math/projects/portfolio/index.html`

**Server — D1** via `/api/progress/*`
- this is what **Insight Brief** actually reads (`/api/progress/insight`, plus
  digest / mastery-rollup / struggles / grades). It touches no on-device store at
  all.

So Close the Loop and Insight Brief do not read the same signal: one is
`localStorage`, one is D1. Insight Brief shows the class; Close the Loop shows
this one device. A teacher reading the hub copy would reasonably expect the
Close the Loop panel to reflect what Insight Brief just told them, and it does
not.

### 2.2 Two student-facing "My Progress" pages on disjoint stores — PROVEN

`/curriculum/index.html` links both, from four places, with nothing to say they
differ: "📈 Open My Progress" → `/math/my-progress/` (line 2991), and "See my
skills →" → `/curriculum/my-progress/` (lines 582, 3686).

Seeded one browser profile with work in all three device stores, using each
store's real schema, then opened both pages in Chromium:

- `/curriculum/my-progress/` showed the NTSignal skills (`6.AT.2`, `6.NOS.1`)
  and showed **nothing** from `nt_results_v1` or the choice boards
- `/math/my-progress/` showed the `nt_results_v1` activity and the choice-board
  bingo and showed **nothing** that exists only in NTSignal (`6.NOS.1` is
  absent)

`/math/my-progress/` tells the student it holds "Everything you've completed on
this device". It does not hold their lesson or arcade work. A student who spent
the week in lessons and opens the page the hub calls "Open My Progress" is told,
in effect, that they did nothing.

**Hand-check (R3), and a correction.** The first run of this probe reported that
`/math/my-progress/` showed neither store. That was my seed, not the page: I
wrote `{id, title, score, total}` where the activity kit writes
`{activityId, activityTitle, scorePercent, completedAt}`, and I wrote the choice
board as a list of names where the page writes a cell-indexed array. Re-seeded
from the real writers in `assets/nt-activity-kit.js:241` and
`math/choice-boards/unit-1/index.html:71`, the page renders both correctly. The
disjointness above is what survives that correction, and it rests on two facts
that cannot be confused: `6.NOS.1` exists only in Store A and appears only on the
curriculum page; "Seeded Activity One" exists only in Store B and appears only on
the math page.

### 2.3 An internal sentinel is shown to students as a skill — PROVEN

`engine/core/lesson-renderer.js:3225` records the warm-up reteach attempt as

    standard: config.standard || "WARMUP_RETEACH"

`WARMUP_RETEACH` is not a standard code. `nt-signal.js` documents the field as
"only standard codes (e.g. `6.NOS.A.1`)", and every consumer treats the value as
one. `/curriculum/my-progress/` renders `registry[d.standard]?.shortLabel ||
d.standard`, so with no registry entry it prints the raw string. Seeded and
confirmed in Chromium: the page shows `WARMUP_RETEACH` to the student as one of
their skills. Close the Loop would likewise rank it as a weakest standard and
then report "No lesson tagged — open Resource Finder".

It also consumes one of the 64 slots in a bounded store, evicting a real
standard.

### 2.4 The review arcade contributes no standard evidence, and erases the resume point

`math/review-arcade/index.html:1906` records:

    { standard: "", correct: !!correct, misconceptionTag: q.topic, lesson: "unit-" + unit }

Two consequences, both from reading `nt-signal.js`'s own handling:

- `standard: ""` fails `cleanKey`, so **no standard is recorded at all**. Every
  question a student answers in the review arcade is invisible to
  `/curriculum/my-progress/`, to Close the Loop and to spaced review. Only the
  misconception tag survives.
- `lesson: "unit-3"` overwrites `store.lastLesson`. The hub's resume strip
  guards with `/^\d{1,2}-\d{1,2}$/` (`curriculum/index.html:1831`), so it does
  not produce a broken link — it produces **no link**: "Pick up where you left
  off" silently disappears, and the student's real last lesson is gone.

`misconceptionTag: q.topic` is also a different vocabulary from the tag slugs the
lessons emit, so review-arcade tags and lesson tags pile into one bounded map of
32 without being the same kind of thing.

### 2.5 What is emitted but read by nobody

- **project completions** (`nt-project-complete:v1`): 27 completable projects,
  and finishing one reaches only the portfolio page. No progress consumer —
  not My Progress on either path, not Class Brain, not Close the Loop, not
  Insight Brief — knows a student finished a project.
- **`nt-journey-last`**, written by both `lesson-renderer.js` and
  `small-group-renderer.js`, is read by nothing in the repo.
- **Class Brain's `neft-class-brain-v1`** is written and read only by its own
  page, so nothing else can see what it holds and it cannot see anything else.

### 2.6 What was checked and is sound

- **Standard-code format across the NTSignal seam.** This was the most likely
  silent-failure mode: Close the Loop uppercases the recorded standard and looks
  it up in `data/asset-concept-map.json`'s `byStandard`, and lesson configs are
  keyed by the 2025 MCCRS codes. All 37 distinct standards used by the 84 lesson
  configs are present in that map — 0 misses, 84 of 84 lessons covered. Close
  the Loop resolves real lesson signals correctly.
- The small-group studio records under the BASE lesson id
  (`small-group-renderer.js:1338`), so a group variant's evidence lands on the
  parent lesson rather than fragmenting it.

