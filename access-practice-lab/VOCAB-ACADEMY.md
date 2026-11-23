# Vocabulary Academy

Vocabulary Academy is a Kindergarten to Grade 8 vocabulary program inside The Language Page (the ACCESS Practice Lab).
It is built like a Wordly Wise-style workbook series: each grade is a set of **Units**, each unit groups three or four
**Lessons**, and every lesson teaches its own words (5 in Kindergarten, 6 in Grade 1, 8 in Grade 2, 10 from Grade 3), so a
unit builds a set of 20 to 40. A lesson is a Word List, six lettered exercises and a review. A unit adds a crossword, a unit
test, mixed practice and games over all of its words. Students also study word parts and review words on a spaced schedule.
Teachers can assign lessons, sections or whole units, differentiate supports, present a lesson, print materials and build
custom word lists. The structure and exercise names follow the familiar workbook shape; the words, sentences and
passages are original to this program. It is original practice for vocabulary growth. It is **not** an official WIDA or ACCESS score and does
not predict one; every Academy page says so.

Grades 9 to 12 are **not** part of this release. The app says "coming later" for them and the validator fails on any
9–12 content file.

This file is the product reference. The build contract is `docs/vocab-academy/SPEC.md`; content quality rules are
`docs/vocab-academy/content-qa.md`.

## What is authored, and what is checked

All content is static JSON under `content/vocab-academy/` (scope per grade in `g<G>/grade.json`, one file per lesson in
`g<G>/u<NN>.json` (the file name predates the Units and Lessons layout; each file is one lesson), word-part data in `morphology.json`, and a generated `index.json`). Run
`npm run validate:vocab-academy` for the current count of units and words per grade; that is the source of truth for
what is published. A unit that is planned but not written is shown truthfully as "being written".

**Every lesson is auto-checked only.** The gates (`validate:vocab-academy`, 100+ self-tested detectors) check structure,
readability, vocabulary policy, answer integrity and cross-grade rules. No lesson has been reviewed by a person. In
particular, a human still has to check: every Spanish gloss and cognate flag, every etymology and morphology note,
every factual claim in a passage, and each `editorial.needsReview` item the writers flagged.

## Student side (`/access-practice-lab/vocabulary-academy/…`)

| Route                                         | What it is                                                                                                                        |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                           | My Vocabulary: continue, daily review, grade picker                                                                               |
| `/grades`, `/grade/<G>`                       | Grade levels; one grade's units, each with its lessons                                                                            |
| `/grade/<G>/unit/<U>`                         | A unit: its lessons, the unit crossword and test, mixed practice, games, and a word wall of every unit word                       |
| `/grade/<G>/unit/<U>/crossword`, `…/test`     | The unit crossword (clues are meanings) and the unit test (questions from every lesson, scored word by word)                      |
| `/grade/<G>/lesson/<N>`                       | A lesson: the Word List (pronunciation, meaning, two example sentences, word forms, Spanish) and its eight sections               |
| `/grade/<G>/lesson/<N>/<a–h>`                 | The lesson player: a Word List study, Exercises A Finding Meanings, B Just the Right Word, C Applying Meanings, D Word Study, E Reading Passage, F Using the Words, and the Lesson Review |
| `/word/<id>`                                  | One word: meaning, picture, Spanish, word parts, related words, your evidence                                                     |
| `/practice`, `/review`                        | Choose-your-own practice (52 activity types, over a lesson or a whole unit) and spaced review                                     |
| `/games`, `/games/<id>`                       | Ten vocabulary games (over a lesson or a whole unit)                                                                              |
| `/word-study`, `/word-study/<tool>`           | Word Study Lab (202 word parts, 1,122 derivations, 53 families)                                                                   |
| `/family`                                     | Family view: a lesson's words and talk prompts                                                                                    |

Units are a presentation of the lesson files: `data.js` `groupLessons` puts lessons into units of four (grades with 12 or
20 lessons) or three (15 or 18), so every unit in a grade is the same size. Section letters are stored as a–h in progress
(a Word List, b–g Exercises A–F, h Review), so a learner's saved place survives the layout.

Practice is adaptive but never punitive: a word's state (new, learning, developing, applying, secure, review-needed)
comes from evidence across six dimensions, heavy supports count half, and nothing is a grade. Progress lives in one
localStorage record (`accessPracticeLab:v1:vocabAcademy`) through `src/vocab-academy/store.js`, with the lab's normal
Save/Resume, export and import. Reopening a lesson resumes where the learner left off.

## Teacher side

Teacher mode reuses the lab's existing detection; the Academy never invents its own teacher key. Teacher routes show a
"teachers only" panel on a student device and the controls do not exist in the student DOM.

| Route                                            | What it is                                                                                                       |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `/teacher`                                       | Dashboard: units and lessons, supports and differentiation, assignment, class results                           |
| `/teacher/custom`                                | Custom lesson builder (saved on this device as `cu.<slug>`; never overwrites published content)                 |
| `/present/<G>/<N>` (or `/present/<G>/cu_<slug>`) | Presentation mode for lesson N, keyboard driven                                                                  |
| `/print/<G>/<N>/<kind>`                          | Printables: `workbook`, `review`, `assessment`, `words` (student) and `teacher`, `assessment-key` (teacher only) |

Assigning uses the class platform in `src/class/*`: an assignment is a path such as
`vocabulary-academy/grade/4/lesson/3` (a lesson), `…/lesson/3/b` (one exercise), `…/unit/2` (a unit), `…/unit/2/test`
or `…/practice?set=<ids>`; a differentiated assignment adds the supports and word
subset in the query (`sup`, `sf`, `son`, `soff`, `w`), which the lesson player and practice view read through
`supports.js`. Teacher answers, notes and rationale are never rendered for students.

The source folders for teacher-facing code are named `educator/`, not `teacher/`, because the production teacher gate
(`functions/_lib/teacher-surface.js`) refuses any file path containing "teacher" or "dashboard" and would blank the
student app.

## Printables

Print routes are the product: pages are rendered from the unit JSON on demand and printed from the browser (US Letter,
running header, name and date line). Sheets that run slightly over a page are shrunk to fit (never below 94%) and a short
tail never gets a page of its own. `tools/generate-vocab-academy-pdfs.mjs` renders the same pages to tagged PDFs for
checking or bundling. Nothing in `/print/…/workbook`, `/review`, `/assessment` or `/words` contains teacher text or
answers (`tools/validate-vocab-academy-print.mjs` and `tools/vocab-academy-print.test.mjs` prove it for every unit).

Known limit: a few review and assessment-key packets still end on a nearly empty last page
(`node tools/validate-vocab-academy-print.mjs --pdf` reports them).

## Where the Academy connects to the rest of the lab

- **Home and Resume:** a home card, a teacher card and a family card (`home-registry.js`); "Continue" on the lab home
  reads `integrations/home.js`.
- **Family Hub / family view:** `integrations/family-view.js` and `family-project.js`. A whitelist projection copies named
  student-facing fields only. The page is labelled "Optional home practice — not assigned by your teacher" unless the
  teacher's link carries `assigned=1`.
- **Lesson Builder (Resource Studio and Lesson Planner):** one teacher-only panel (`integrations/studio-panel.js`) turns a
  unit into an exit ticket, reading activity, writing task, differentiated practice, worksheet or review packet, and adds a
  labelled link to a lesson phase or a week day. Answer keys stay apart from student markup.
- **Progress surfaces:** Passport, Growth Map and Teacher Hub read word counts from `integrations/progress.js`. They are
  counts of words the learner has shown they know. They are never combined into a score, percent or level.
- **Offline:** the app code, `index.json`, `morphology.json` and every `grade.json` are in the install cache; a unit opens
  offline once it has been opened, and "save this unit/grade for offline" uses the existing pack mechanism
  (`integrations/offline.js`). Unit files are deliberately not pre-cached.
- **Sitemap, early-reader gate, backup/import:** `sitemap.js`, `early/gate.js` and `store.js` know the Academy.

## Commands

| Command                                     | Purpose                                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm run validate:vocab-academy`            | Self-tested content gate (0 errors required; warnings are reviewed)                                     |
| `npm run validate:vocab-academy:complete`   | K–8 must be finished: every unit and word, index current, no 9–12 files                                 |
| `npm run build:vocab-academy-index`         | Regenerate `content/vocab-academy/index.json` (run after any content change)                            |
| `npm run validate:vocab-academy-print`      | Every unit × every print kind renders and student kinds leak nothing                                    |
| `npm run test:vocab-academy`                | Unit tests for the model, activities, lessons, units, games, word study, educator tools, print and integration |
| `node tools/vocab-academy-student-e2e.mjs`  | Student journey in Chromium at 390 and 1280px                                                           |
| `node tools/vocab-academy-educator-e2e.mjs` | Teacher journey in Chromium (dashboard, differentiate, assign, present, custom unit)                    |

## Rules this module follows

Navy/teal/off-white palette, no purple; 44px targets; semantic landmarks, keyboard focus and reduced motion; Spanish
support beside English everywhere a learner sees text; no third-party analytics; student identity and work stay on the
device; no timers or beat-the-clock in the games; a missed answer never prints the worked solution.
