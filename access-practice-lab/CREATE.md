# Create (Project Studio)

One Create experience on The Language Page's teacher pages. A teacher opens a resource, chooses **Create from this**,
picks what to make, sees a real preview at once, adjusts it if they want, and uses it: open it in the Activity Studio,
add it to a packet, download HTML, print or save as PDF, or download an editable Word file.

Create is the front door to machinery that already exists. It invents no content and adds no second editor:

| Need                         | Existing system Create uses                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| Read a page's resource       | Customize adapters, `src/studio/adapters/` (see `CUSTOMIZE.md`)                    |
| One content model            | `lp-activity/1`, `src/studio/core/schema.js` (see `STUDIO.md`)                     |
| Formats                      | `src/studio/core/transforms.js` (`toKind`, `vocabPractice`, `exitTicket`, ...)     |
| Adjustments                  | `src/studio/core/differentiate.js` presets (`language-support`, `shorten`, ...)    |
| Student screen and HTML file | the Studio player bundle + `src/studio/export/html.js`                             |
| Printed page and PDF         | `src/studio/print/worksheet.js` + `open-print.js` (browser print, text stays text) |
| Word file                    | `POST /api/studio/docx` (`functions/_lib/studio/docx.js`, real paragraphs/tables)  |
| Full editing, sharing        | the Activity Studio editor (Create saves a teacher draft and opens it)             |

## Files (`src/create/`)

| File                       | Purpose                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| `routes.js`                | The route-capability registry: every lab route view has a disposition and a reason.                    |
| `build.js`                 | Pure: formats, the three adjustments, `buildResource`, `outputsFor`, `packetActivity`.                 |
| `session.js`               | Pure: the packet and the last choice, versioned (`lp-create-session/1`) in this device's storage.      |
| `panel.js`                 | The Create dialog (3 steps) and the source picker.                                                     |
| `packet.js`                | The packet tray: reorder with buttons, remove, one combined PDF / Word / Studio copy, HTML per part.   |
| `launcher.js`, `gate.js`   | Lab header controls. `main.js` imports only `gate.js` (1 KB); authoring code loads on teacher devices. |
| `page.js`, `page-entry.js` | Teacher pages outside the lab: their existing Customize links open Create for the same resource.       |
| `ways.js`, `wire-kit.js`, `wire.css` | Describe it, Use my own material and recipes inside the panel (shared with the Studio chooser). |
| `handoff.js`, `files.js`   | Save a draft and open the Studio; download helpers and the Word request.                               |
| `create.css`               | Panel styles on the lab's tokens, with fallbacks for pages outside the lab. Light only.                |
| `supports.js`, `supports-ui.js` | Student level (WIDA tiers) and eight supports, mapped onto the Studio's `makeVersion` / `applySupports`. |
| `upload.js`                | A teacher's Word, text or PDF file, or pasted text, read on the device by `studio/x/ingest*.js`.       |
| `my-recipes.js`            | Saved recipes (`lp-create-recipes/1`): format, adjustments and supports by name; never content.       |
| `deck.js`                  | One slide model: an offline HTML presentation and an editable PowerPoint (answers in speaker notes).  |
| `scorm.js`                 | SCORM 1.2 package: manifest + the offline student page with the SCORM boot (completion, no score).    |
| `word-cards.js`            | Printable Frayer-style word cards from the page's own word list.                                       |
| `deck-play.js`             | Class play in the slide deck: team points (T) and a fair number picker (P). No names, timers or storage. |
| `print-games.js`           | Word bingo (a card per student + caller's list), I have / Who has loop cards, and exit slips.         |
| `extras.js`, `icons.js`    | Step-3 tiles, the saved-recipe bar, and line icons built with DOM calls.                               |

## The three steps

1. **What do you want to make?** Only formats this content can really become are offered (`formatStatus`); the others
   are listed in a closed disclosure with the reason the Activity Studio gives.
2. **Preview and adjust.** The preview is the real student page, the printed page, the answer key, or the slides.
   Two adjustments (amount of practice, challenge), then **Student supports**: who it is for (grade level, WIDA 1-2,
   3, 4, ready for more) and eight supports (read aloud, sentence frames, word banks, words first, Spanish glossary,
   pictures with words, short reading parts, step-by-step directions). A support the page cannot provide is shown
   disabled with the reason. `assertRigor` runs after supports: they change access, never a question or an answer.
   **My recipes** saves these choices by name for any page. Ready-made structure recipes are extra formats in step 1,
   offered only when every step can be filled from the page.
3. **Use it.** Tiles in four groups: with students (Activity Studio, offline HTML, slides with team points and a
   student picker, PowerPoint), print and edit (PDF, Word, answer key, word cards), play and check (word bingo from 8
   words, I have / Who has from 4, exit slips from the first questions, never their answers), share and bundle
   (packet, three-level set for WIDA 1-2 / 3 / 4, SCORM 1.2, complete ZIP). Print and Word appear for
   worksheets and exit tickets. **Use your own file or text** in the picker starts from a teacher's material.

The last choice per resource is remembered, so a refresh or browser restart reopens the same format and settings.

## Packet

**Add to packet** on any page keeps a part in the session (12 parts max, about 1.5 MB). A discreet **Packet (n)** chip sits
in the lab header on teacher pages while parts are waiting. The packet is combined into ONE worksheet model
(`packetActivity`): a heading per part, identical non-question blocks (the same word list or directions) once, questions
never merged or dropped silently; past the 80-block schema limit the count of blocks that did not fit is shown.

## Boundaries

- **Teacher mode.** Create appears only when `isTeacherMode()` is true (the lab's existing signal: Teacher Hub audience or
  site teacher key, never a device linked to a class as a student). This hides authoring; it is not authentication.
  Nothing it unlocks is secret: it reads the same public content files the student pages load, and writes only to this
  device. Pages outside the lab are teacher surfaces behind the site's teacher gate.
- **Students** never download authoring code: `main.js` imports `gate.js` only, and `launcher.js` loads only after the
  pre-check. Student and family routes are `excluded` with `tray: false`, so neither Create nor the packet chip appears.
- **Student copies** carry no answers on paper; the answer key is a separate part. Free writing and speaking are never
  auto-graded. No timers. Nothing is published: sharing happens in the Activity Studio with the teacher's class.
- **Safety.** Every activity passes `normalizeActivity` (plain text, size caps, same-site or raster images only). The panel
  builds DOM with `createElement` only. A Customize link becomes a Create source only for this origin, the Studio
  chooser path, and a well-formed family and ref. No teacher code is ever executed.

## Not done (honest list)

- Ten views still have no adapter and stay `excluded` with a specific note: journey, language-games, language-labs,
  language-studios, learn, lingua and reality keep their content inside the page's interactive engine; stories keeps
  its episode text in the view's code; simulations are branching, saved-state missions; the three Language City
  episodes have a different data shape from the missions. An adapter for any of them turns its routes into sources.
- Book Studio, Experience Builder, the Lesson Builder, Pathways, Task Packs, Vocab Sets and Demand keep their own
  creation workflows (`workspace`).
- PDF upload reads only PDFs with real text (no text recognition for scans). "Pictures with words" applies only where a
  word list already has pictures; nothing draws or fetches pictures.
- SCORM reports completion and session time only: the player keeps no score by design.
- Studio X: **Describe what you want** sits above the resource list; own-material and structure recipes live in the Activity
  Studio chooser (see `STUDIO-X.md`); the Create panel's own upload and recipe bar are separate and unchanged.

## Ledger

<!-- ledger:begin -->

Generated by `node tools/create-coverage.mjs`; do not edit by hand.

### Format coverage (measured)

Every listed source was copied and built into every format it supports, with 6 adjustment settings each (102,534 builds). A format counts for a source only when every setting validated with zero errors.

| Source family | Sources read | Interactive activity | Worksheet | Learning game | Vocabulary practice | Exit ticket | Speaking task | Writing task | Visual vocabulary, interactive practice, exit ticket | Science investigation, evidence table, writing task | Reading passage, vocabulary, comprehension questions | Speaking rehearsal, sentence frames, independent response | Math model, error analysis, fresh practice | Small-group explanation, guided activity, transfer task |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `access-bank` (ACCESS Practice Lab question sets) | 40 / 40 | 40 | 40 | 40 | 0 | 20 | 27 | 27 | 7 | 26 | 8 | 20 | 5 | 20 |
| `vocab-academy` (Vocabulary Academy units) | 157 / 157 | 157 | 157 | 157 | 157 | 157 | 157 | 157 | 157 | 151 | 131 | 151 | 1 | 147 |
| `reading-room` (Reading Room lessons) | 183 / 183 | 183 | 183 | 183 | 183 | 122 | 183 | 183 | 182 | 180 | 150 | 180 | 14 | 173 |
| `bcpss-unit` (BCPSS curriculum units) | 162 / 162 | 162 | 162 | 162 | 162 | 162 | 162 | 162 | 162 | 162 | 158 | 162 | 27 | 162 |
| `reading-ladder` (Reading Ladder passages) | 18 / 18 | 18 | 18 | 18 | 0 | 18 | 18 | 18 | 1 | 17 | 0 | 0 | 0 | 0 |
| `missions` (Academic Missions) | 9 / 9 | 9 | 9 | 9 | 9 | 9 | 9 | 9 | 0 | 9 | 3 | 9 | 0 | 9 |
| `puzzle-den` (Puzzle Den puzzles) | 61 / 61 | 61 | 61 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `mentor-texts` (Mentor Text Explorer texts) | 32 / 32 | 32 | 32 | 32 | 0 | 0 | 32 | 32 | 0 | 32 | 0 | 0 | 0 | 0 |
| `newsroom-prompts` (Newsroom story prompts) | 48 / 48 | 48 | 48 | 48 | 0 | 0 | 48 | 48 | 18 | 45 | 0 | 15 | 0 | 3 |
| `reading-path` (Reading Path phonics units) | 15 / 15 | 15 | 15 | 0 | 0 | 0 | 15 | 15 | 0 | 15 | 0 | 0 | 0 | 0 |
| `newcomer-packs` (Newcomer vocabulary packs) | 14 / 14 | 14 | 14 | 2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `quest-missions` (Language Quest missions) | 10 / 10 | 10 | 10 | 10 | 10 | 8 | 7 | 7 | 10 | 8 | 1 | 8 | 0 | 7 |
| `studio-task` (Speaking and Writing Studio tasks) | 56 / 56 | 56 | 56 | 9 | 56 | 9 | 33 | 33 | 52 | 26 | 23 | 26 | 1 | 26 |
| `twr` (TWR sentence-skill sets) | 132 / 132 | 132 | 132 | 132 | 0 | 132 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 |
| `talk-table` (Talk Table discussion decks) | 20 / 20 | 20 | 20 | 20 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `warmup` (Daily Warm-Up word sets) | 24 / 24 | 24 | 24 | 24 | 24 | 24 | 12 | 12 | 24 | 24 | 16 | 24 | 0 | 24 |
| `subject-reading` (Subject Reading passages) | 5 / 5 | 5 | 5 | 0 | 5 | 0 | 5 | 5 | 5 | 5 | 5 | 5 | 0 | 5 |
| `teach-back` (Teach-Back concepts) | 24 / 24 | 24 | 24 | 24 | 24 | 0 | 0 | 0 | 24 | 0 | 0 | 0 | 6 | 0 |
| `word-parts` (Word-part builders) | 2 / 2 | 2 | 2 | 2 | 2 | 2 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 |
| `wordlab` (Word Lab word sets) | 68 / 68 | 68 | 68 | 67 | 67 | 67 | 0 | 0 | 67 | 0 | 0 | 0 | 0 | 0 |
| `phonics` (Phonics Path lessons) | 58 / 58 | 58 | 58 | 58 | 0 | 58 | 40 | 40 | 0 | 40 | 0 | 0 | 0 | 0 |
| `world-missions` (Language Worlds missions) | 8 / 8 | 8 | 8 | 8 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `scenarios` (Real-Life Scenarios) | 27 / 27 | 27 | 27 | 27 | 0 | 27 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `voice-lab` (Voice Lab retells, picture talk and sound pairs) | 18 / 18 | 18 | 18 | 11 | 12 | 5 | 7 | 7 | 9 | 5 | 4 | 5 | 0 | 4 |
| `scaffold-items` (Language builders) | 6 / 6 | 6 | 6 | 6 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `craft-sentences` (Sentence Lab levels and challenges) | 18 / 18 | 18 | 18 | 18 | 0 | 18 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `lab-activity` (Language Page practice activities) | 933 / 933 | 933 | 933 | 0 | 915 | 0 | 388 | 388 | 911 | 346 | 259 | 346 | 32 | 310 |
| `access-prep` (Access Prep skill builders) | 64 / 64 | 64 | 64 | 64 | 24 | 64 | 16 | 16 | 24 | 12 | 0 | 4 | 8 | 2 |
| `grammar-packs` (Grammar practice packs) | 7 / 7 | 7 | 7 | 7 | 0 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `claim-check` (Misconception Detective cases) | 30 / 30 | 30 | 30 | 30 | 30 | 30 | 0 | 0 | 30 | 0 | 0 | 0 | 2 | 0 |
| `argument-arena` (Argument Arena topics) | 26 / 26 | 26 | 26 | 26 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| `choice-boards` (Language Choice Boards) | 20 / 20 | 20 | 20 | 20 | 0 | 0 | 20 | 20 | 0 | 20 | 1 | 20 | 0 | 20 |
| `language-city` (Language City missions) | 12 / 12 | 12 | 12 | 12 | 0 | 12 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `communication` (Culture & Communication scenarios) | 16 / 16 | 16 | 16 | 16 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `exhibition` (Language World exhibitions) | 2 / 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 0 | 2 | 0 | 2 |
| `adventures` (Adventure Worlds missions) | 56 / 56 | 56 | 56 | 48 | 38 | 18 | 56 | 56 | 29 | 55 | 17 | 48 | 2 | 46 |
| `error-detective` (Language Error Detective case files) | 25 / 25 | 25 | 25 | 25 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| `conversation-sim` (Conversation Simulator scenarios) | 2 / 2 | 2 | 2 | 2 | 0 | 1 | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| `construction-lab` (Language Construction Lab) | 1 / 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `dialogue-studio` (Dialogue Studio) | 1 / 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| `sentence-architect` (Sentence Architect Studio) | 1 / 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

PDF and Word come from the Worksheet and Exit ticket formats; HTML from every format.

### Lab routes

119 route views: 42 source, 35 hub, 8 workspace, 34 excluded. Any hub or source route with `?bcpssUnit=<id>` becomes a BCPSS unit source.

| Route view | Disposition | Reason |
| --- | --- | --- |
| `access-prep` | Create from this page | An Access Prep skill-builder set: its texts, word work and every step. |
| `activity` | Create from this page | A practice activity: its reading or listening, vocabulary and task. |
| `adventures` | Create from this page | An Adventure Worlds mission at the grade band in the address: its story, readings, clues, choices and writing. |
| `architect` | Create from this page | The Sentence Architect kernels and their phrase blocks. |
| `arena` | Create from this page | An Argument Arena topic: its question, evidence cards and objections. |
| `assess` | Create from this page | An ACCESS Practice Lab set (instructional practice; no test material is reproduced). |
| `choice-boards` | Create from this page | A Language Choice Board at the grade band in the address: its nine tasks, frames and texts. |
| `city` | Create from this page | A Language City mission: its signs, what the character says and every step. |
| `claim-check` | Create from this page | A Misconception Detective case: the explanation, the wrong line and the evidence cards. |
| `communication` | Create from this page | A Culture & Communication scenario: its messages, audience shifts and writing task. |
| `construction` | Create from this page | The Construction Lab's expansion challenges and register rewrites. |
| `conversation` | Create from this page | A Conversation Simulator scenario: each turn and its sample responses. |
| `detective` | Create from this page | A Language Error Detective case file: the rule, examples and sentences to fix. |
| `dialogue-studio` | Create from this page | The Dialogue Studio's dialogues, grammar stories, picture words and warm-ups. |
| `exhibition` | Create from this page | The Language World exhibition for the grade band in the address: its four linked tasks. |
| `grammar` | Create from this page | A grammar practice pack: its rule and every item. |
| `ladder` | Create from this page | Reading Ladder: the passage shown follows the learner's round, so Create opens with the ladder's passages in the picker. |
| `mentor` | Create from this page | A Mentor Text Explorer text: the text, its writer's moves and the try-it tasks. |
| `mission` | Create from this page | An Academic Mission: its sources, vocabulary and every task. |
| `missions` | Create from this page | An Academic Mission: its sources, vocabulary and every task. |
| `newsroom` | Create from this page | A Newsroom story prompt: the assignment, the reporter's notes and the writing tasks. |
| `packs` | Create from this page | A newcomer pack: the open pack, or the survival-vocabulary topics in the picker. |
| `puzzles` | Create from this page | A Puzzle Den puzzle with its hints and answer. |
| `quest` | Create from this page | A Language Quest mission: its readings, checks, sorts, timelines and writing and speaking tasks. |
| `reading-path` | Create from this page | A Reading Path phonics unit: its decodable book, Spanish version and words. |
| `reading-room` | Create from this page | A Reading Room lesson: its reading, vocabulary and authored questions. |
| `scaffold` | Create from this page | A language builder (sentence building, evidence or language upgrade): its items for the grade band. |
| `scenarios` | Create from this page | A Real-Life Scenario: each conversation turn with the reply the scene rates best, and a role-play. |
| `science-of-reading` | Create from this page | A Phonics Path lesson: sound cards, build, read, sort, spell, passage and dictation. |
| `sentences` | Create from this page | A Sentence Lab level or paragraph challenge: sentences to build, combine, expand and fix. |
| `sor` | Create from this page | Science of Reading: a Phonics Path lesson when one is open. |
| `speak` | Create from this page | A Speaking Studio task: scenario, recording or source, checks, vocabulary, frames and the task. |
| `subject-reading` | Create from this page | A Subject Reading passage: the reading, its words and the evidence question. |
| `talk-table` | Create from this page | A Talk Table deck: eight discussion cards for one grade band and language use. |
| `teach-back` | Create from this page | A Teach-Back concept: the idea, its words, the key points and the explanation task. |
| `twr` | Create from this page | A TWR set: the rule and model, every practice item and the writing task. |
| `vocab-academy` | Create from this page | A Vocabulary Academy lesson: its words, meanings, examples, Spanish and reading. |
| `vocabulary` | Create from this page | The Vocabulary word-part builders for the grade band in the address. |
| `voice` | Create from this page | A Voice Lab retell, picture-talk ladder or sound-pair set. |
| `wordlab` | Create from this page | Word Lab: the word set that holds the open word. |
| `worlds` | Create from this page | A Language World's eight missions for the grade band. |
| `write` | Create from this page | A Writing Studio task: scenario, sources, vocabulary, organizer, frames and the task. |
| `bridge` | Create with a source picker | Language Bridge analyzes text a teacher pastes; it has no content of its own, so Create opens the source picker. |
| `class-teacher` | Create with a source picker | Class teacher view. |
| `classroom` | Create with a source picker | Classroom tools. |
| `collection` | Create with a source picker | A learner's collection book: badges and keepsakes, no content of its own; Create opens the source picker. |
| `early` | Create with a source picker | Early learners' home: a launcher of the early pages; Create opens the source picker. |
| `evidence` | Create with a source picker | Evidence Studio pairs readings from the practice activities and missions; Create opens the source picker (the practice activities family holds those readings). |
| `explore` | Create with a source picker | Explore lists every destination; it has no content of its own, so Create opens the source picker. |
| `flashcards` | Create with a source picker | Word cards are drawn from the practice activities and reviewed on this device; Create opens the source picker. |
| `growth` | Create with a source picker | Language Growth Map: a record of the learner's own work, no content of its own; Create opens the source picker. |
| `guided-units` | Create with a source picker | Guided Units link to other pages in a sequence; Create opens the source picker. |
| `launch` | Create with a source picker | Teacher launch page. |
| `launch-studio` | Create with a source picker | Teacher launch studio. |
| `lens` | Create with a source picker | My Words (the Language Lens): a record of the learner's own work with no content of its own; Create opens with the source picker. |
| `library` | Create with a source picker | Resource library. |
| `partner` | Create with a source picker | Partner Talk: a pass-the-device recorder with three general speaking prompts; Create opens with the source picker. |
| `passport` | Create with a source picker | My Passport: a record of the learner's own work with no content of its own; Create opens with the source picker. |
| `path` | Create with a source picker | My Language Path: a record of the learner's own work with no content of its own; Create opens with the source picker. |
| `portfolio` | Create with a source picker | My portfolio: a record of the learner's own work with no content of its own; Create opens with the source picker. |
| `program` | Create with a source picker | Program and strategies pages. |
| `publisher-demo` | Create with a source picker | Publisher demo. |
| `radar` | Create with a source picker | Reclassification Radar: a teacher evidence view over a demo roster with no content of its own; Create opens with the source picker. |
| `reader` | Create with a source picker | Immersive Reader: a reading tool for any text; its three sample texts have no tasks, so Create opens with the source picker. |
| `ready-plan` | Create with a source picker | My ACCESS plan: a record of the learner's own work with no content of its own; Create opens with the source picker. |
| `road` | Create with a source picker | Road to ACCESS: a weekly plan that links to activities; it has no content of its own. |
| `room` | Create with a source picker | Skill room: a list of activities for one domain and level; Create opens with the source picker. |
| `simulator` | Create with a source picker | Speaking simulator: a practice engine over a few built-in prompts; the Speaking Studio tasks in the picker hold the full authored speaking content. |
| `site-guide` | Create with a source picker | Site guide. |
| `start` | Create with a source picker | Getting started. |
| `supports` | Create with a source picker | Scaffold Studio in use: support layers over one pilot reading and this device's independence record, with no questions to build from. |
| `teacher-launch` | Create with a source picker | Teacher launch. |
| `time-machine` | Create with a source picker | Language Time Machine: a learner's own earlier and later work, a personal record with no content of its own. |
| `tools` | Create with a source picker | Teacher tools. |
| `units` | Create with a source picker | Units overview. |
| `vocab-curriculum` | Create with a source picker | Vocabulary curriculum overview. |
| `warmup` | Create with a source picker | Daily Warm-Up: the day's word changes daily; the picker offers the warm-up words in sets of ten. |
| `activity-studio` | Already a creation tool | The Activity Studio is the full editor that Create hands drafts to. |
| `book-studio` | Already a creation tool | Book Studio has its own creation workflow; Create does not add a second one. |
| `demand` | Already a creation tool | The Language Demand Analyzer has its own hand-off into Activity Studio; Create does not add a second one. |
| `experience-builder` | Already a creation tool | Experience Builder has its own authoring workflow. |
| `lesson-builder` | Already a creation tool | The Lesson Builder has its own resource studio and planner. |
| `pathways` | Already a creation tool | Pathways has its own builder. |
| `task-packs` | Already a creation tool | Task Packs is a speaking task builder with its own drafts. |
| `vocab-sets` | Already a creation tool | Vocabulary Sets is a word-list builder with its own practice, print and share. |
| `accessibility` | Not offered | No instructional content. |
| `class` | Not offered | Student-facing: authoring controls never appear here. |
| `class-quiz` | Not offered | Student-facing: authoring controls never appear here. |
| `diagnostic` | Not offered | Student-facing: authoring controls never appear here. The check-in recommends a starting point and must stay unchanged. |
| `do` | Not offered | Student-facing: authoring controls never appear here. |
| `family` | Not offered | Family-facing: the simple family experience is kept; teachers create from the teacher pages instead. |
| `family-bridge` | Not offered | Family-facing: the simple family experience is kept; teachers create from the teacher pages instead. |
| `family-start` | Not offered | Family-facing: the simple family experience is kept; teachers create from the teacher pages instead. |
| `games` | Not offered | Live game play: each game is its own engine. Teachers make a game from any source with Create on a teacher page. |
| `goals` | Not offered | The student and family goal sheet; teachers set goals in the Teacher Hub's goal-setting form. |
| `home` | Not offered | The home page leads to the hubs, where Create appears. |
| `journey` | Not offered | ACCESS Learning Journey: its content lives inside the page's own interactive engine and no adapter reads it yet, so Create is not shown rather than offering a blank page. |
| `language-games` | Not offered | Language Games (four story games on the flagship engine): its content lives inside the page's own interactive engine and no adapter reads it yet, so Create is not shown rather than offering a blank page. |
| `language-labs` | Not offered | Language Labs (Verb Time Machine, Connector Bridge, Paragraph X-Ray): its content lives inside the page's own interactive engine and no adapter reads it yet, so Create is not shown rather than offering a blank page. |
| `language-studios` | Not offered | Language Studios (syntax, morphology and cohesion manipulatives): its content lives inside the page's own interactive engine and no adapter reads it yet, so Create is not shown rather than offering a blank page. |
| `learn` | Not offered | Interactive Learn Hub: its content lives inside the page's own interactive engine and no adapter reads it yet, so Create is not shown rather than offering a blank page. |
| `lingua` | Not offered | Everyday English studio: its content lives inside the page's own interactive engine and no adapter reads it yet, so Create is not shown rather than offering a blank page. |
| `method` | Not offered | No instructional content: explains how practice is built and what the lab can show. |
| `move` | Not offered | Moves a learner's saved work between sites: a device utility with no instructional content. |
| `pairs` | Not offered | Student-facing: authoring controls never appear here. Listening partners share recorded takes between classmates. |
| `play` | Not offered | Student-facing: authoring controls never appear here. |
| `practice-together` | Not offered | Family-facing: the simple family experience is kept; teachers create from the teacher pages instead. |
| `privacy` | Not offered | No instructional content. |
| `reality` | Not offered | Language Reality View: its content lives inside the page's own interactive engine and no adapter reads it yet, so Create is not shown rather than offering a blank page. |
| `scenes` | Not offered | Class scenes are written by learners in a class and approved by their teacher; learner writing is never a Create source. |
| `search` | Not offered | Search results: Create appears on the resource a result opens. |
| `session-done` | Not offered | Student-facing: authoring controls never appear here. |
| `simulations` | Not offered | Simulation missions are branching, saved-state experiences whose later scenes depend on earlier choices; no adapter maps them to a linear activity yet. |
| `skill-arcade` | Not offered | Student-facing: authoring controls never appear here. Phonics and sound game rounds. |
| `stories` | Not offered | Student story episodes whose text is part of the page code rather than a content file, so no adapter can read it. |
| `students` | Not offered | Student-facing: authoring controls never appear here. |
| `styleguide` | Not offered | Design reference, no instructional content. |
| `test` | Not offered | Student-facing: authoring controls never appear here. Test simulation must stay unchanged. |
| `tests` | Not offered | Practice-test chooser for students. |

### Pages outside the lab

| Page | Disposition | What Create reads |
| --- | --- | --- |
| `/bcpss-teachers/` | Create from this page | The open BCPSS unit (vocabulary, cloze items, one reading level, exit ticket, standards), at the WIDA band the page shows. |
| `/access-teacher/` | Create from this page | Each ACCESS set row in the content panel opens Create with that set. |

<!-- ledger:end -->
