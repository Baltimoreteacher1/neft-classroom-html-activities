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
| Language Worlds | `/worlds[/<signal-station|evidence-city|conversation-quest|storyworks>[/<mission>]]` | `content/worlds.json`, `src/content/world-missions.js`, `src/views/worlds.js`, `pictures/worlds/*.svg` |
| Whole-Class Language Studio | `/classroom` | `src/views/classroom.js`, `src/views/classroom-data.js`, `classroom-studio.css` |
| Word Builder · Vocabulary & Morphology | `/vocabulary` | `src/views/vocabulary.js`, `src/content/vocabulary-items.js`, `vocabulary.css` |
| Teacher Launch Studio | `/teacher-launch` | `src/views/teacher-launch.js` |

The check-in records only answer correctness and skill tags for its short, original Listening/Reading prompts; Speaking/Writing prompts save a reflection-completed flag but never retain the response or recording. It gives an instructional starting suggestion, not a proficiency result. Teacher launch URLs contain an existing activity ID and instructional settings, never learner data. Language Worlds feature eight consequential, visually complete missions per world per grade band with domain mechanics (dispatch, evidence, dialogue, publishing) and independent transfer, alongside field practice activities. Whole-Class Studio provides projector-ready routines with source card marking, non-drag sequence building, scaffold toggles, and sample models without storing student responses. Word Builder provides spaced-retrieval academic morphology practice (1-, 3-, 7-day intervals) grounded in WIDA ELD Standards Framework 2020 contexts.

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

## Quality gates

- `npm run validate:access-lab` — activity bank contract, studio content (`validate-access-studio.mjs`: schema,
  verbatim evidence, detective sentences run through the real detectors), assessment quality
  (`validate-access-quality.mjs`: blueprint coverage, answer-position balance, duplicate options, key cues,
  honest labelling), index freshness.
- `npm run e2e:access-studio` — the studios in a real browser: fake microphone, independence integrity, share code →
  dashboard, axe WCAG 2.2 AA, 375px overflow.
- `npm run audit:access-bank` — report on production vs selected-response share per room.
- Unit tests: `tools/access-language-engine.test.mjs`, `tools/access-teacher-evidence.test.mjs`.

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
