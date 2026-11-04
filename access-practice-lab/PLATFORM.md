# ACCESS Practice Lab — language-learning platform notes

How the studios fit together, the rules they must keep, and how to add to them. Content schemas:
`CONTENT.md` (activity bank) and `STUDIO-CONTENT.md` (missions, speaking, writing, detective).

## The learner loop

Choose a mission or studio task → prepare (plan, rehearse, supports at the learner's chosen stage) →
produce real language (speak, write, decide, collect evidence) → specific feedback → revise or re-record →
show it independently → watch growth. Direct activity links and the quick-practice rooms are unchanged.

| Surface | Route | Source |
| --- | --- | --- |
| Academic missions | `/missions`, `/missions/<id>` | `content/missions/*.json`, `src/views/missions.js` |
| Speaking Studio | `/speak`, `/speak/<task>` | `content/studio/speaking.json`, `src/views/speak.js` |
| Writing Studio | `/write`, `/write/<task>`, `/write?tab=portfolio` | `content/studio/writing.json`, `src/views/write.js` |
| Language Error Detective | `/detective`, `/detective/<pattern>` | `content/detective/patterns.json`, `src/lang/errors.js` |
| Growth Map | `/growth` | `src/lang/ledger.js` profile |
| Teacher dashboard | `/access-teacher/` (top panel) | `access-teacher/evidence.js`, `src/lang/teacher.js` |
| Optional entry check-in | `/diagnostic[/<Listening|Reading|Speaking|Writing>]` | `src/views/diagnostic.js` |
| Language World · Science Exhibition | `/exhibition`, `/exhibition/<listen|read|speak|write|teacher>` | `src/content/exhibition.js`, `src/lang/exhibition.js`, `src/views/exhibition*.js`, `exhibition.css` |
| Language Worlds | `/worlds[/<signal-station|evidence-city|conversation-quest|storyworks>[/<mission>]]` | `content/worlds.json`, `src/content/world-missions.js`, `src/views/worlds.js`, `pictures/worlds/*.svg` |
| Whole-Class Language Studio | `/classroom` | `src/views/classroom.js`, `src/views/classroom-data.js`, `classroom-studio.css` |
| Word Builder · Vocabulary & Morphology | `/vocabulary` | `src/views/vocabulary.js`, `src/content/vocabulary-items.js`, `vocabulary.css` |
| Teacher Launch Studio | `/launch-studio`, `/launch`, `/teacher-launch` | `src/views/launch-studio.js`, `launch-studio.css` |

The check-in records only answer correctness and skill tags for its short, original Listening/Reading prompts; Speaking/Writing prompts save a reflection-completed flag but never retain the response or recording. It gives an instructional starting suggestion, not a proficiency result. Teacher launch URLs contain an existing activity ID and instructional settings, never learner data. Language Worlds feature eight consequential, visually complete missions per world per grade band with domain mechanics (dispatch, evidence, dialogue, publishing) and independent transfer, alongside field practice activities. Whole-Class Studio provides projector-ready routines with source card marking, non-drag sequence building, scaffold toggles, and sample models without storing student responses. Word Builder provides spaced-retrieval academic morphology practice (1-, 3-, 7-day intervals) grounded in WIDA ELD Standards Framework 2020 contexts.

### Language World (the Science Exhibition)

One original scenario per band (6–8 *The Clean Water Exhibition*, 3–5 *The Seed Science Fair*) carries four linked tasks:
Listening (Inform) → Reading (Explain; selected evidence becomes the writing evidence bank) → Speaking (Explain / Narrate;
plan, say or record, self-check, choose one improvement) → Writing (Argue / Explain; draft, rule-based feedback quoting the
learner's own sentences, revision compared with the earlier draft, then a new attempt on a transfer prompt with all help
closed). State is one key, `accessPracticeLab:v1:exhibition`, so the Passport export carries it; recordings are never
stored. Opening any help marks the work supported. Help items are written so they never state an answer
(`tools/access-living-studio.test.mjs` enforces it). Checks: that test, `npm run e2e:access-living`,
`node tools/access-axe-sweep.mjs --width 375|1440`.

## The engine (`src/lang/`)

- `text.js`, `lexicon.js` — tokens with offsets, sentences, phrase/number finders, connector and vocabulary data.
- `errors.js` — 25 explainable pattern detectors tuned for precision (`confidence: "high" | "check"`).
  `checkRevision()` decides whether a revision fixed a pattern without breaking others or changing the message.
- `purpose.js`, `analyze.js` — Key Language Use moves and the response analysis: strengths, next moves, evidence
  use, cohesion, sentence shapes, word-level features. Every observation carries spans of the learner's own text.
- `audio.js` — speech-activity measures from the loudness envelope (time speaking, pauses, longest run), on device.
- `ledger.js` — the evidence ledger and learner profile: first attempts, independent vs supported, revisions,
  trends (≥ 3 points), support dependence, recurring patterns, comprehension by skill and distractor.
- `adapt.js` — recommendations from demonstrated performance (next task, stage, stretch questions).
- `rubrics.js`, `scaffolds.js`, `share.js`, `studio.js`, `teacher.js` — practice rubrics, word bridges, share codes,
  studio state, teacher analysis.

## Rules that must keep holding

1. **No invented proficiency.** There is no "% developed", WIDA level, scale score or exit prediction anywhere. The
   Growth Map and dashboard show trends from first attempts, and say "not enough evidence" under three. Exemplars use
   the practice bands *early / building / strong*. `tools/lib/access-studio-rules.mjs` (`SCORE_CLAIM`) is enforced over
   all studio content.
   **One exception, decided by Joel on 2026-10-23 (`data/product-decisions.json`): the Practice Composite** on
   practice-test results (`src/lang/composite.js`, shown only by `views/test.js`; `tools/access-composite.test.mjs`
   enforces both). It follows the expert guidance for a practice composite: WIDA's published Overall weighting
   (Listening 15%, Speaking 15%, Reading 35%, Writing 35%; WIDA TR-2019-3); each skill needs at least 6 answered
   questions; a missing or unrated skill withholds the overall number and is never filled in or reweighted; Speaking and
   Writing enter only through an explicit practice-rubric rating that records who rated (self or teacher); a skill with
   fewer than 12 questions is flagged as a small sample; the parts, the method and the limits are always on screen;
   and it is called "practice points", never a WIDA score, level, placement or prediction. No other surface may show a
   composite.
2. **Scaffolds cannot contaminate independent results.** "On my own" renders no frames, bank, model or Spanish
   bridges; feedback appears only after a submission; the ledger stage becomes *supported* if any support was
   opened. A revision after feedback is a *revision*, never a first attempt.
3. **Privacy and retention.** Everything runs on the device. No student text or audio is sent anywhere. Recordings live in memory
   unless the learner presses "Keep for my teacher" (IndexedDB, deletable in Passport). A share code carries an
   alias, never contact details, and never audio. Kept recordings expire after 30 days. The teacher roster lives in the
   teacher's browser only (sections, per-student removal, "Remove everything" also clears saved scores, a visible
   warning when storage is nearly full or a save fails).
4. **Not official.** WIDA scores Speaking and Writing with trained raters and its current rubrics; Listening and
   Reading are machine-scored selected response. WIDA revises its scoring rubrics (Writing changed for 2025–26), so the
   lab's practice rubrics are its own descriptors, organized by the three WIDA language dimensions (Discourse,
   Sentence, Word/Phrase) — never WIDA's rubric text.

## Evidence tools (supports, goals, official results, families)

Built on the same ledger, so none of them can claim more than was observed. All local to the device; the
teacher's goals and typed official results live in the teacher's browser only.

| Tool | Where | Source |
| --- | --- | --- |
| "How sure are you?" (optional, before Check) | Reading/Listening activities | `src/lang/calibration.js`, `views/activity.js` |
| Spaced review of guessed answers | Journey / Keep it strong | `src/lang/adapt.js` (`dueForReview`), `skill-graph.js` (`selfSure`) |
| Retell it (after a right Reading/Listening answer) | activity page | `src/views/retell.js` |
| Supports and independence; gradual release | Passport "How I work", teacher sheet | `src/lang/supports-report.js`, `src/lang/fade.js` |
| Family letter (EN / ES / both) | Passport | `src/lang/family-letter.js`, `views/passport-work.js` |
| Word cards and partner talk | `/flashcards`, Families "More" | `src/lang/flashcards.js`, `views/flashcards.js` |
| My reading log | Reading Room shelf; shared with the code | `src/reading-state.js`, `views/reading-log.js` |
| Goal bank (50 goals, a try-tomorrow move each) | Teacher Hub student panel | `content/goal-bank.json`, `src/lang/goals.js` |
| Official ACCESS results, typed by the teacher | Teacher Hub student panel | `src/lang/official-scores.js` |
| Conference sheet | Teacher Hub "Print this student's sheet" | `access-teacher/evidence-extras.js` |
| Check-in reminders (.ics, no student data) | Teacher Hub "Check-ins" | `src/lang/checkin-calendar.js` |

Rules these keep, on top of the four above:

1. **A rating never changes correctness.** "Guessing" on a right answer only brings it back for review; "Sure" on a wrong one is
   flagged as a belief to revisit. Counts only; withheld under five ratings.
2. **Goals are chosen by a teacher, never inferred.** Evidence for a goal is counts plus a status (not enough evidence yet /
   building / shown on my own). `validateGoalBank` rejects level or score wording and any try-tomorrow move that needs prepared materials.
3. **Official results are typed, validated (1.0-6.0, one decimal) and shown beside the practice evidence, never merged with it.** The
   lab never computes, estimates or predicts one. A difference between two years is arithmetic on two reported levels.
4. **No student data leaves the device.** The calendar file holds a title, dates and generic instructions. The reading log and its
   notes are shared only inside the learner's own share code.

## Quality gates

- `npm run validate:access-lab` — activity bank contract, studio content (`validate-access-studio.mjs`: schema,
  verbatim evidence, detective sentences run through the real detectors), assessment quality
  (`validate-access-quality.mjs`: blueprint coverage, answer-position balance, duplicate options, key cues,
  honest labelling), index freshness.
- `npm run e2e:access-studio` — the studios in a real browser: fake microphone, independence integrity, share code →
  dashboard, axe WCAG 2.2 AA, 375px overflow.
- `npm run audit:access-bank` — report on production vs selected-response share per room.
- Unit tests: `tools/access-language-engine.test.mjs`, `tools/access-teacher-evidence.test.mjs`, `tools/access-calibration.test.mjs`,
  `tools/access-evidence-tools.test.mjs`, `tools/access-student-tools.test.mjs`; browser: `npm run e2e:access-evidence`.

## Adding content

1. Author JSON per `STUDIO-CONTENT.md`; run `node tools/validate-access-studio.mjs` until clean.
2. New detective patterns need a detector in `errors.js` *and* lesson/practice/transfer content; the validator checks
   both directions.
3. Run `node tools/access-lab-index.mjs` (regenerates `content/index.json`) and `node tools/sync-access-shell.mjs`
   (module versions) after editing source.

## Ledger semantics (what the numbers mean)

- A **first attempt** is the first feedback request of an *attempt*; "Start a new attempt" begins a new one, so growth
  can be measured across attempts. Asking again without changing the text logs nothing.
- A pattern counts **once per piece of work, in its latest state**: fixed in the final version means no longer recurring.
- A pattern is **mastered** only after independent transfer passes on at least two different days and prompts.
- Mission choices (`byFlag`) change the later speaking/writing prompt, planner hints and revision question.

## Enterprise layer (`src/acc/`, `acc.css`, `acc-engine.css`)

One shared design and engine layer for every ACCESS route. Independent practice material: the footer and every results
screen say it is not a WIDA or DRC assessment and produces no official score or level.

| Part | Files | Rules it keeps |
| --- | --- | --- |
| Tokens and shell | `acc.css`, `src/acc/{routes,copy,shell}.js` | `--acc-*` palette is pinned by `tools/access-acc-foundation.test.mjs`; 48px targets; the four standalone pages (Teacher Hub, Family Expedition, Family Adventure, Side Quest) load the same tokens and the same header, breadcrumb and disclaimer. The Math Workbench and formula pop-up are not loaded on ACCESS pages. |
| Assessment engine | `src/acc/engine/*`, `src/views/assess.js`, route `/assess` | One validated item schema (nine response types). Summative mode gives no hints and no feedback. Learning mode runs check, feedback, support ladder (1 clue, 2 language, 3 mentor model, unlocked in order), revise, fresh attempt. A success after support is recorded as supported, never independent. Speaking and writing are never auto-scored (`needs-review`). |
| Toolbar | `engine/toolbar.js`, `tool-state.js`, `highlight-dom.js` | Highlighter wraps text nodes only; the line reader masks are `aria-hidden` and pointer-transparent; the magnifier scales the canvas font size so text reflows; a crossed-out choice stays a real, enabled control and the last choice cannot be crossed out. |
| Audio | `src/acc/audio/*` | A person starts every permission request and every recording. The microphone check runs a real 3-second RMS calibration. The file type is whatever the browser produced (never relabelled WAV). A recording is written to IndexedDB and read back before it is called saved. Listening plays are counted in the saved session, so a refresh cannot grant extra plays; a failed play costs nothing. |
| Storage | `src/acc/storage/*`, `engine/persist.js` | `ACCESS_Lab_DB` v1: `sessions`, `recordings`, `passport_progress`, `settings`. Each save writes a short localStorage buffer, commits to IndexedDB, then removes the buffer, so a refresh cannot lose the last answer. Records carry a random per-device learner id, never a name. Multi-row writes are one transaction. Import never overwrites. The learner can export, import and delete. If IndexedDB is unavailable the lab says nothing is being saved. No network calls, no sync, no analytics. |
| Offline | `sw.js` (generated block) | The lab and its practice sets work offline once loaded. Driven browsers register the worker only with `?sw=1`. Reconnecting never claims anything was synchronised. |

Checks: `node --test tools/access-acc-{foundation,engine,audio}.test.mjs`, `node tools/access-acc-{assess,audio,storage}-e2e.mjs`,
`node tools/access-acc-visual.mjs` (screenshots at 1440, 768 and 390 plus axe, overflow and target size).

### Teacher evidence, WIDA mapping, languages and the family journey (Phase 5)

- **Teacher Hub panel** (`access-teacher/acc-evidence-panel.js`, section `#accEvidence`): Domain x Key Language Use x Academic Context matrix read from `passport_progress` on this device. A cell with fewer than three items says "not enough yet", a combination with no practice says "no evidence", and review-only items (speaking, writing) are never scored. Recommendations (`src/acc/analytics/evidence.js`) are rules over those counts and print the counts that triggered them. Several students are combined by importing the files they export; the panel says it is one device and not a roster.
- **WIDA mapping** (`src/acc/wida/{catalog,framework}.js`): the one expectation catalog (also used by `tools/lib/access-lab-alignment.mjs`) and an inspectable Task -> Domain -> Key Language Use -> Context -> Expectation family -> Observable evidence -> Feedback -> Revision -> New attempt chain. A combination the framework lists is "explicit"; anything else is "supplementary". Grades 3-5 map to both WIDA clusters 2-3 and 4-5. Item-level Language Expectation wording is not reproduced and no code is invented.
- **Learning brief**: one printable page per student with evidence dates, strengths, priorities, next activities, growth (only after three sittings) and the limits of the evidence. It states that it is not a WIDA/ACCESS score report, not a proficiency level and not an IEP or 504 document.
- **Languages**: English and Spanish only. `src/acc/i18n/I18nEngine.js` translates interface text from `locales/es*.js`; authored content (passages, questions, choices, supports, student work) stays English and is tagged `lang="en"` inside a Spanish page. `tools/access-acc-i18n-scan.mjs` fails if any interface string on the covered screens is left in English. Spanish is machine-assisted and has not been reviewed by a human translator.
- **Family journey**: `src/family/journey.js` (Welcome, Understand ACCESS, Choose a skill, Practice together, Review progress, Plan the next session) on the family pages, and `/family/understand` with read-aloud buttons and plain statements that practice is not the official test and does not predict a score.

## Phase 6C-6E: rubrics, review, adaptive practice, teacher intelligence

Everything below is practice feedback on one device. None of it is a WIDA or ACCESS score or level, and none of it is sent anywhere.

**Evidence kinds** (shown on screen so nobody mistakes one for another)
- *Auto-scored by answer key*: objective items only.
- *Rule-based observation*: `src/acc/feedback/writing-feedback.js` counts words, sentences, linking words, numbers taken from the task's own data and copied runs of six words. It never judges meaning and says so.
- *Teacher-reviewed*: a person rated a response against a rubric in the Hub.
- *Not scored by the lab*: speaking and writing without a teacher review.

**Rubrics** (`content/rubrics/speaking-practice.json`, `writing-practice.json`): seven or eight dimensions, four neutral ratings ("Not yet shown" to "Shows clearly"), written by EduWonderLab, not WIDA wording. Speaking names three things the lab never scores: pronunciation, speed and pauses, grammar accuracy.

**Teacher review** (`access-teacher/acc-review-panel.js`, `src/acc/review/review.js`): a queue from the evidence rows with `status: needs-review`. The teacher plays the recording (from the local `recordings` store) or reads the text, rates every dimension, adds an optional note and chooses whether to show it to the student on this device. Saved under settings key `review.<learner>|<session>|<item>`. The student's chooser page shows shared feedback as strengths first and one next step, never a number.

**Self-check**: in Learning mode the checklist on a speaking or writing item is tickable; ticks are saved in the session (`tools.selfCheck`) and travel into the evidence row as `selfChecked` / `selfTotal`.

**Adaptive practice** (`src/acc/adapt/mastery.js`): a skill is *secure* only after independent first-try success on at least N different items on at least M different days at a teacher-set percentage (defaults 3, 2, 80). Supported success never counts. `fadeAdvice` looks at the last three responses; `nextStep` picks the weakest skill and offers unseen bank items, preferring a different parallel group. `meta.parallel` is computed by `tools/access-acc-bank-parallel.mjs` (54 groups), never typed. `assembleSet` builds `/assess/custom?ids=<set>:<item>,...` sets with namespaced stimulus ids.

**Teacher intelligence** (`acc-insights-panel.js`, `acc-assign-panel.js`): per-skill progress, suggested next step, language-function strengths (reported after 3 objective items), revision and completion patterns, tagged first-choice misunderstandings, missing data. The assignment builder (domain, mixed, context, key language use, language function, whole-set simulation, supported practice) produces a link or a printed list; it delivers nothing.

**Tests**: `tools/access-acc-{feedback,adapt,assign}.test.mjs`, `tools/access-acc-intel-e2e.mjs`. `npm run report:access-bank` writes `reports/access-bank-report.md`.

**Limits to keep saying**: Spanish is machine-assisted and not human-reviewed; rubric text, item content, language-function names and misconception tags are English. No item has been human-reviewed. There is no backend, so review, mastery and assignments live on the device where they were made.
