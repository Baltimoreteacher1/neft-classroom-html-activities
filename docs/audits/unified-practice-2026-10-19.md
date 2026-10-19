# Unified HTML practice — audit and decisions (2026-10-19)

Request: merge the learning labs and the existing games into the student "HTML practice" pages, both the regular and the Challenge version,
without creating a new studio. Scope read from the hub: each lesson row offers **HTML practice** (`/math/practice-studio/<id>/`) and
**HTML practice (Challenge)** (`…/challenge/`), plus an **Interactive Learning Lab** and the **Interactive Lesson** (`/lessons/<id>/`).
The two HTML practice pages are the destination. The lesson launcher, the labs, every worksheet/notes/homework/slides file and every route
are untouched.

## What was audited

| surface                                                             | finding                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Learning labs (46, 2 lessons each, generated)                       | Real, reusable core: parametric model (19 kinds), predict-first judge, target generator, expedition game. **Not reusable as-is:** the investigate tab also mounts three "next-gen" widgets (net inspector, Ares colony, station jigsaw) on every lab, unrelated to the lab's mathematics (a 3D net inspector on a ratio lab). They were not carried into the studios. |
| Expedition mission game                                             | Mathematically thin: a live "too high / too low / ready to restore" line turned it into hill-climbing; difficulty never adapted; targets could be repeating decimals ("approximately 2.6667"), start already solved, or be hit by 7+ settings; balance puzzles could set a control past its maximum and refuse the build.                                             |
| Practice studios (67 generated + 5 hand-built Unit 4, 2 pages each) | Mature: 5 sections, generators with independent checks, hands-on activities, Mistake Map, redemption round, Spanish, pathways. Duplicate stems across a lesson's pages: 6 in 134 pages. Two worlds' accent colour failed 4.5:1 against its button ink.                                                                                                                |
| Lab practice tiers                                                  | ~1,400 items adapted from the lesson configs the studios already use: not imported (it would be the duplicate-question problem the brief asks to remove).                                                                                                                                                                                                             |
| Unit 1 and Unit 10                                                  | No studios exist (`practice-studio-v2.md`: out of scope). Unit 10 is not taught. Not touched.                                                                                                                                                                                                                                                                         |
| Other game surfaces (36 pages)                                      | 29 handle reduced motion, 29 have sound controls, 30 handle the keyboard; the 7 without reduced-motion handling contain no animation or transition. Joel's three game rules are already a gate. Not rewritten (see limits).                                                                                                                                           |

## What changed

1. **Lab bench inside both studios** (`docs/specs/practice-studio-v2.md` §10). New item kinds `lab` (live model, predict first, a goal reached by
   reasoning) and `mission` (the expedition) in `assets/studio/kinds-lab.js`; a bench per lesson in `data/practice-studio/<id>.json`
   (Unit 4: `data/practice-studio-u4/`, injected into the hand-built pages). Practice section 4 gains an explore task, a written
   investigation and the mission; Challenge section 3 gains a stretch task, a design-and-explain task and the mission. Existing items keep their
   ids, so saved progress is intact. The lab modules are imported at runtime (one source of truth) inside shadow roots because `lab.css` styles whole pages.
2. **Mission game upgraded** (shared with the 46 lab pages): plan-then-test with a diagnostic on every miss, no live closeness hint, difficulty
   that follows the student, first-test no-hint badge, sound toggle (off by default), responsive art, focus management. Puzzle targets are now
   plannable (terminating, not pre-solved, few solutions, inside the controls); three lab models whose fixed values made every puzzle identical were re-valued.
3. **Content for 72 lessons, reviewed twice.** Authored in 9 batches, then independently reviewed (math, alignment, giveaways, Spanish) and
   rewritten; a second independent review found 40 smaller defects, all fixed. The reviews found real errors the validator could not: stale
   explanations, answer-revealing hints, tasks relabelling a model, wrong Spanish terms. Mission text is generated from the model so it cannot over-promise.
4. **Resources stay reachable.** Every studio footer lists the lesson's student materials that exist (guided notes, worksheets, homework,
   vocabulary, family page, Part 2, its learning lab). Answer keys and teacher notes are never listed.
5. **Accessibility.** World accent colours now keep 4.5:1 with their button ink (2 of 24 adjusted); axe is clean on every bench page.

## Gates added

`benchProblems` (data gate, generator), `tools/studio-lab-bench.test.mjs` (goals, nine mission puzzles for every bench and every lab, page/data
agreement, Unit 4 injection), `npm run validate:studio-lab-browser` (144 pages). The learning-labs verifier was updated for adaptive levels.

## Limits, stated plainly

- **Model fit.** The 19 lab models are generic. Where one draws only part of a lesson (2-1 statistical questions, 2-11 decimal addition,
  3-2 rates with two units, 5-1 parallelogram, 5-10 fractional edges, 6-8 properties, 6-13 factor trees, 7-4 ordering, 7-2 quarters) the task is
  honest about it and the written items carry the rest; these are the lessons a teacher should look at first.
- **Games.** One shared engine (the expedition) was redesigned. The 11 unit cabinets, Placement Quest, Practice Arcade and the 8 review expeditions were
  audited, not rewritten; they keep their own recent audits and the `validate:game-rules` gate.
- **Interactive Lesson pages** (`/lessons/<id>/`) were not changed: they are a different page from the HTML practice the request named.
- The bench is ungraded: no star, coin, SCORM value or grade is written.

## Round 2 — expert panel (same day)

Five reviewers (learning science, game design, UX/accessibility, ESOL/WIDA, teaching/assessment) judged the live build for award criteria. A student
also reported the 6-9 "Street arch" stop confusing. What was built from that:

- **Lesson words.** Every bench names its controls and result in the lesson's own words, English and Spanish (`labels`), enforced by the gate; the fraction model
  says pieces / servings / groups by lab; a bench can open on the pyramid net (5-8).
- **Honest plan-then-test.** Goal bar instead of a live closeness line, direction-only diagnoses, a test trail, a three-rung hint ladder ending in a worked build with
  other numbers, a confidence tap, lab misses no longer punished or mis-tagged; the difficulty ladder no longer wraps to the easiest level.
- **Bilingual and accessible.** Spanish for written-item frames/rubrics (211 existing, never shown before), the lab shell, the game and its worlds, controls and chips;
  Comfort settings reach the model; selected-state contrast; `aria-invalid`; focus kept; layout fixed; paper twin; Data Saver; read-aloud of the game.
- **Teacher and shared computers.** Finish-on-this-computer hand-off; station deep links.
- **Not built (recommended next):** a paste-in Class Pulse page (needs a new teacher-gated route), per-lesson teacher look-fors with a model-fit note, a "predict the number"
  step, spaced re-checks, concreteness fading, a faulty-build error-analysis round, and a "make a puzzle for a friend" code.

