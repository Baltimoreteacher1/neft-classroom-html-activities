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


---

## BLOCK 3 · EN/ES parity

Audit only. Nothing translated, nothing changed — translation is content.

### 3.1 Method, and what the numbers mean

Two different bilingual conventions exist in this codebase, and they have to be
measured separately:

- **lessons** use a `<field>` / `<field>Es` pair inside `config.json`, rendered
  by `engine/core/i18n.js` as a stacked `.i18n-en` / `.i18n-es` block
- **project pages** use sibling `.en-text` / `.es-text` ELEMENTS in the HTML —
  a parallel system that shares no code with the engine's

For lessons, every config on disk was walked and each translatable English
string paired with its `Es` sibling. The fields were then split into two
populations, because they mean different things:

- fields that carry an `Es` sibling SOMEWHERE in the fleet have a translation
  convention, and a missing one is a per-lesson gap;
- fields that carry one in NO lesson are surfaces the bilingual layer has never
  covered at all.

That split matters: without it the audit reported ~5,000 phantom "gaps" in
fields that were never bilingual by design.

### 3.2 Classification

288 lesson configs audited (84 whole-group, 168 small-group, 36 catch-up).
**Every single one is PARTIAL.** None is fully bilingual; none is English only.

43,751 translatable string slots in fields that have an `Es` convention;
29,683 of them carry Spanish (68%).

### 3.3 Surfaces the bilingual layer has never covered

These field names carry `Es` in **no lesson anywhere**, so the surface is
English-only by construction, not by omission:

- 2,106 `cloze` — every vocabulary cloze sentence
- 1,092 `question` — Turn-and-Talk / discussion questions
- 514 `caption`
- 317 `example` — vocabulary examples
- 288 `contentObjective` (one per lesson, all 288)
- 288 `languageObjective` (one per lesson, all 288) — the language objective
  itself is English only
- 288 `heading`
- 110 `answer`
- 10 `objective`

The language objective being English-only is the one I would look at first: it
is the sentence that tells a multilingual learner what language work the lesson
expects of them.

### 3.4 Untranslated slots by surface, across all 288 lessons

- 3,699 other prose
- 2,460 vocabulary
- 2,315 feedback & explanations
- 2,076 headings & labels
- 1,056 practice prompts
- 1,039 hints
- 548 worked example (Learn It)
- 384 exit ticket
- 261 launch / warm-up
- 227 discussion prompts
- 3 interactive tool labels

Hints and feedback are the two that matter most for the students this is for: a
student who is doing the problem in Spanish and then misses it gets the
explanation of why in English.

### 3.5 By unit — the clustering is unmistakable

Whole-group lessons only, so variants do not triple-count:

- unit 1: 6 lessons, 495 of 529 slots untranslated (94%)
- unit 2: 12 lessons, 693 of 1,650 (42%)
- unit 3: 10 lessons, 631 of 1,442 (44%)
- unit 4: 5 lessons, 419 of 605 (69%)
- unit 5: 10 lessons, 550 of 1,482 (37%)
- unit 6: 15 lessons, 774 of 1,768 (44%)
- unit 7: 9 lessons, 565 of 1,213 (47%)
- unit 8: 7 lessons, 385 of 925 (42%)
- unit 9: 4 lessons, 403 of 425 (95%)
- unit 10: 6 lessons, 539 of 570 (95%)

Units 1, 9 and 10 sit at ~95% untranslated while the rest cluster at 37–47%.
Unit 4 (69%) is the middle case. Units 1 and 10 are the "Math is…" identity
lessons that open and close the year — the two moments a newly-arrived student is
most likely to be in the room and least likely to have any English footing.

Worst individual lessons: 2-5 (134 of 153), 6-7 (116 of 134), 4-5 (115 of 132),
9-1 (115 of 120), 4-1 (111 of 133), 3-6 (106 of 126).

### 3.6 Project pages — 26 of 27 are fully paired, 1 has no Spanish at all

27 student-facing project pages (answer keys excluded). **3,995 `.en-text`
elements, 3,995 with a Spanish sibling — 100% pairing on 26 of them.**

The exception is **`math/unit-10/projects/world-architect/`**: 133 KB, zero
`.es-text`, zero `.i18n-es`, zero `lang="es"`, and zero Spanish words by an
accent/keyword scan. It is the only English-only student-facing project page in
the repo — and it is one of the three projects made reachable from the gallery
only last commit (`c1883486`), so students can now find it.

### 3.7 Functional paths — what I can and cannot stand behind

**Chrome strings are complete.** All 143 fixed UI strings in
`engine/core/i18n.js` (`STRINGS` 129, `PHASE_NAMES` 8, `BADGE_NAMES` 6) have a
non-empty `es`. There is no empty-Spanish-button failure mode there.

**The engine's content fallback is correct.** `stackContentHtml` returns the
English alone when the Spanish is blank or identical, rather than emitting an
empty `.i18n-es`, so a missing translation degrades to English rather than to a
blank line. That is the right behaviour and it is deliberate — the reasoning is
written into the function's own comment.

**Answer checking is not at risk from a label mismatch.** Both language lanes
are placed in the DOM and CSS chooses between them; grading compares against the
config value, not against rendered text. The article-bug shape — a label
mismatch destroying a completion — does not reproduce on this path.

**Observed in a browser, built lesson at `?lang=es`** (`<html lang="es">`
confirmed stamped): of 9 visible controls on the lesson shell, 7 carry no
`.i18n-es` lane — including **"💾 Save / Resume"** and **"🧰 Tools"**. Those two
are the controls a student uses most. I did **not** trace each label back to its
source, so some may be bilingual by a mechanism this probe cannot see; treat
this as a lead to check, not a settled count.

**A detector I am NOT reporting a number from.** I also counted "interactive
controls with no Spanish" on project pages. Hand-checking 4 flagged pages found
at least 3 false positives: `math/unit-7/projects/version-a` renders the Spanish
as a SEPARATE button ("Use Example Coordinates" and "Usar Coordenadas de
Ejemplo" are two elements), and `math/unit-9/projects/version-b` has "Siguiente
paso" and "Atrás" on the page with the English swapped in by script. The
sibling-element assumption does not hold for controls, so no control-level count
from that pass is in this report. The `.en-text`/`.es-text` pairing figure in 3.6
does not depend on it.


---

## BLOCK 4 · Readability baseline

Audit only. Nothing rewritten — simplifying a sentence is a content decision.

### 4.1 The measure, and why

**Flesch–Kincaid Grade Level**, `0.39·(words/sentence) + 11.8·(syllables/word) − 15.59`.

Chosen because it reports in grade levels, which is the unit the decision is
actually made in ("is this above grade 6?"). Its weakness is real: FK is
syllable-driven, and math prose is full of numerals, symbols and long domain
terms that raise the score without making the sentence harder for a student who
has been taught the term. So the text is prepared first:

1. markup, LaTeX fragments and math symbols stripped
2. numerals deleted — a number contributes nothing to how hard a sentence is to
   read, so it belongs in neither the numerator nor the denominator
3. **every term in that lesson's own vocabulary word bank removed**, with its
   plural, because that vocabulary is the point of the lesson; counting
   "denominator" against a lesson penalises it for teaching the word it exists to
   teach
4. a surface is scored only with ≥ 40 words and ≥ 3 sentences

Scope: all 84 whole-group lesson configs, five student-facing prose surfaces
each (worked example / practice prompts / hints / explanations / explore /
connect). 376 scored samples.

### 4.2 The distribution

- mean FK **4.18**
- p10 2.3 · p25 3.2 · **median 4.0** · p75 4.9 · p90 6.3 · max 11.5 · min 0.1

By band:

- below 4.0 — 184 samples (49%)
- 4–6 — 147 (39%)
- 6–8 — 33 (9%)
- 8–10 — 9 (2%)
- 10–12 — 3 (1%)

By surface (mean FK, n):

- explanations 5.21 (n=84)
- connect 4.05 (n=80)
- practice prompts 3.95 (n=84)
- explore 3.93 (n=44)
- hints 3.65 (n=84)

Above thresholds:

- above FK 6 — 45 of 376 samples (12%), across 34 lessons
- above FK 8 — 12 of 376 (3%), across 11 lessons, all `explanations` or `connect`
- above FK 10 — 3 of 376 (1%), all `connect`

### 4.3 Hand-check of the extremes (R3)

**10 highest — 10 of 10 are genuine.** Every one has both a high
syllables-per-word (1.35–1.69 against a corpus mean near 1.25) and long
sentences (12–23 words). The text really is denser:

- 1-6 connect, FK 11.5 — "Propose a class agreement for working ___, and another
  for working alone, based on showing ___ for classmates."
- 9-2 connect, FK 11.4 — "___ is the independent variable, while ___ is the
  dependent variable."
- 10-6 connect, FK 10.1 — "Describe how your math story has ___ this year, ask a
  ___ about their story, and then ___ the two to see how they are alike and
  different."
- then 2-1 explanations (9.5), 10-4 connect (9.4), 9-3 connect (9.3), 1-2
  connect (8.9), 1-4 connect (8.8), 1-1 connect (8.8), 3-7 explanations (8.5)

Seven of the ten are `connect` — the "put it in words" surface. Some density
there is the point of that surface; the three above FK 10 are still worth a
read.

**10 lowest — only 2 of 10 are genuine.** Eight are fill-in-the-blank frames or
coordinate lists where blanks and equations, not words, make up most of the
surface: "The chest's SA is ___ ft² because SA = 2(___×___) + 2(___×___) +
2(___×___) = ___ + ___ + ___ = ___" (5-7, FK 1.1) is not simple prose, it is not
prose. The two that are genuine are `8-2 explore` (FK 0.7) and `4-3 hints`
(FK 1.4) — short, plain, and appropriately so.

**Conclusion from the hand-check: the top of this distribution can be acted on;
the bottom cannot.** Any target should be a ceiling, never a floor, because a
floor would be measuring blanks.

### 4.4 Two detector bugs found and fixed before these numbers were produced

Both were caught by hand-checking the extremes, and both would have produced a
confidently wrong baseline:

1. **Numerals were replaced with the token `num`**, which the word regex then
   counted as a word. Lesson 6-2's explanations scored **FK 21.4** on "891
   words in 15 sentences" — almost all of those words were stripped numerals.
   Fixed by deleting numerals instead of tokenising them.
2. **The numeral regex swallowed sentence-final periods.** `/\d[\d.,:\/]*/`
   consumed the full stop of every sentence ending in a number, so "so it is
   n + 7." ran into the next explanation. Lesson 6-5's explanations came out as
   "sentences" of 85 words and scored FK 13.7; the source sentences are ordinary
   length. Fixed so a period is consumed only when a digit follows it.

Before those fixes the corpus mean was 5.27 with a max of 21.4. After: mean
4.18, max 11.5. **Only the second set of numbers is in this report.**

### 4.5 Recommended target, with reasoning

**Ceiling of FK 6.0 for student-facing prose, measured with the lesson's own word
bank excluded; anything above FK 8 reviewed by hand.**

Reasoning:

- The corpus already sits at median 4.0 and 88% of samples are at or below 6.0,
  so this is a ratchet on a healthy body of writing, not a rewrite programme. It
  makes 45 samples across 34 lessons the work, and 12 samples across 11 lessons
  the urgent part.
- 6.0 is the grade being taught. Above it, the sentence is harder than the
  mathematics, which inverts what the lesson is for — and this class has many
  multilingual learners, for whom an English sentence above grade level is a
  second barrier in front of a first one.
- It must be a **ceiling, not a band**. A floor would push writers to add
  syllables, and the hand-check shows the low tail is measurement artefact, not
  writing.
- Vocabulary exclusion has to stay part of the definition. Without it the target
  would penalise exactly the lessons doing the most vocabulary teaching.
- I would NOT gate this in CI. FK is a rough instrument on math prose even after
  the two fixes above, and a build that fails on a sentence a teacher wrote
  deliberately trains people to work around the gate. A report, re-run when
  lesson prose changes, with 34 named lessons to look at, is the useful form.

