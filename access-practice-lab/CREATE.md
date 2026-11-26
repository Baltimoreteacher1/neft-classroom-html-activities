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
| `handoff.js`, `files.js`   | Save a draft and open the Studio; download helpers and the Word request.                               |
| `create.css`               | Panel styles on the lab's tokens, with fallbacks for pages outside the lab. Light only.                |

## The three steps

1. **What do you want to make?** Only formats this content can really become are offered (`formatStatus`); the others
   are listed in a closed disclosure with the reason the Activity Studio gives.
2. **Preview and adjust.** The preview is the real student page (sandboxed frame) or the real printed page and answer
   key. Three adjustments, each an existing preset: language support (standard / more), amount of practice (shorter /
   standard / more), challenge (standard / add). Language support is checked with `assertRigor`: it may change access,
   never a question or an answer. Every change and every gap (no pictures, missing hints) is listed for review.
3. **Use it.** Only actions that exist for the kind are shown: print and Word appear for worksheets and exit tickets.

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

- 81 route views are `excluded` because no adapter can read their content (games, adventures, worlds, studios, TWR,
  missions, ...). Adding an adapter for a family turns its routes into sources; the registry test then requires a decision.
- Book Studio, Experience Builder, the Lesson Builder and Pathways keep their own creation workflows (`workspace`).
- Uploading teacher documents (DOCX/PDF), recipes, and a visual component library are not built.
- Presentation decks, SCORM and LMS exports are not offered from Create (the Studio share panel has what exists).

## Ledger

<!-- ledger:begin -->

Generated by `node tools/create-coverage.mjs`; do not edit by hand.

### Format coverage (measured)

Every listed source was copied and built into every format it supports, with 6 adjustment settings each (21,882 builds). A format counts for a source only when every setting validated with zero errors.

| Source family | Sources read | Interactive activity | Worksheet | Learning game | Vocabulary practice | Exit ticket | Speaking task | Writing task |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `access-bank` (ACCESS Practice Lab question sets) | 40 / 40 | 40 | 40 | 40 | 0 | 20 | 27 | 27 |
| `vocab-academy` (Vocabulary Academy units) | 157 / 157 | 157 | 157 | 157 | 157 | 157 | 157 | 157 |
| `reading-room` (Reading Room lessons) | 183 / 183 | 183 | 183 | 183 | 183 | 122 | 183 | 183 |
| `bcpss-unit` (BCPSS curriculum units) | 162 / 162 | 162 | 162 | 162 | 162 | 162 | 162 | 162 |

PDF and Word come from the Worksheet and Exit ticket formats; HTML from every format.

### Lab routes

119 route views: 3 source, 13 hub, 5 workspace, 98 excluded. Any hub or source route with `?bcpssUnit=<id>` becomes a BCPSS unit source.

| Route view | Disposition | Reason |
| --- | --- | --- |
| `assess` | Create from this page | An ACCESS Practice Lab set (instructional practice; no test material is reproduced). |
| `reading-room` | Create from this page | A Reading Room lesson: its reading, vocabulary and authored questions. |
| `vocab-academy` | Create from this page | A Vocabulary Academy lesson: its words, meanings, examples, Spanish and reading. |
| `class-teacher` | Create with a source picker | Class teacher view. |
| `classroom` | Create with a source picker | Classroom tools. |
| `launch` | Create with a source picker | Teacher launch page. |
| `launch-studio` | Create with a source picker | Teacher launch studio. |
| `library` | Create with a source picker | Resource library. |
| `program` | Create with a source picker | Program and strategies pages. |
| `publisher-demo` | Create with a source picker | Publisher demo. |
| `site-guide` | Create with a source picker | Site guide. |
| `start` | Create with a source picker | Getting started. |
| `teacher-launch` | Create with a source picker | Teacher launch. |
| `tools` | Create with a source picker | Teacher tools. |
| `units` | Create with a source picker | Units overview. |
| `vocab-curriculum` | Create with a source picker | Vocabulary curriculum overview. |
| `activity-studio` | Already a creation tool | The Activity Studio is the full editor that Create hands drafts to. |
| `book-studio` | Already a creation tool | Book Studio has its own creation workflow; Create does not add a second one. |
| `experience-builder` | Already a creation tool | Experience Builder has its own authoring workflow. |
| `lesson-builder` | Already a creation tool | The Lesson Builder has its own resource studio and planner. |
| `pathways` | Already a creation tool | Pathways has its own builder. |
| `access-prep` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `accessibility` | Not offered | No instructional content. |
| `activity` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `adventures` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `architect` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `arena` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `bridge` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `choice-boards` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `city` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `claim-check` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `class` | Not offered | Student-facing: authoring controls never appear here. |
| `class-quiz` | Not offered | Student-facing: authoring controls never appear here. |
| `collection` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `communication` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `construction` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `conversation` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `demand` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `detective` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `diagnostic` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `dialogue-studio` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `do` | Not offered | Student-facing: authoring controls never appear here. |
| `early` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `evidence` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `exhibition` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `explore` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `family` | Not offered | Family-facing: the simple family experience is kept; teachers create from the teacher pages instead. |
| `family-bridge` | Not offered | Family-facing: the simple family experience is kept; teachers create from the teacher pages instead. |
| `family-start` | Not offered | Family-facing: the simple family experience is kept; teachers create from the teacher pages instead. |
| `flashcards` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `games` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `goals` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `grammar` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `growth` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `guided-units` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `home` | Not offered | The home page leads to the hubs, where Create appears. |
| `journey` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `ladder` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `language-games` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `language-labs` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `language-studios` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `learn` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `lens` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `lingua` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `mentor` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `method` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `mission` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `missions` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `move` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `newsroom` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `packs` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `pairs` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `partner` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `passport` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `path` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `play` | Not offered | Student-facing: authoring controls never appear here. |
| `portfolio` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `practice-together` | Not offered | Family-facing: the simple family experience is kept; teachers create from the teacher pages instead. |
| `privacy` | Not offered | No instructional content. |
| `puzzles` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `quest` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `radar` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `reader` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `reading-path` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `ready-plan` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `reality` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `road` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `room` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `scaffold` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `scenarios` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `scenes` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `science-of-reading` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `search` | Not offered | Search results: Create appears on the resource a result opens. |
| `sentences` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `session-done` | Not offered | Student-facing: authoring controls never appear here. |
| `simulations` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `simulator` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `skill-arcade` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `sor` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `speak` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `stories` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `students` | Not offered | Student-facing: authoring controls never appear here. |
| `styleguide` | Not offered | Design reference, no instructional content. |
| `subject-reading` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `supports` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `talk-table` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `task-packs` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `teach-back` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `test` | Not offered | Student-facing: authoring controls never appear here. Test simulation must stay unchanged. |
| `tests` | Not offered | Practice-test chooser for students. |
| `time-machine` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `twr` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `vocab-sets` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `vocabulary` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `voice` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `warmup` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `wordlab` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `worlds` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |
| `write` | Not offered | No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page. |

### Pages outside the lab

| Page | Disposition | What Create reads |
| --- | --- | --- |
| `/bcpss-teachers/` | Create from this page | The open BCPSS unit (vocabulary, cloze items, one reading level, exit ticket, standards), at the WIDA band the page shows. |
| `/access-teacher/` | Create from this page | Each ACCESS set row in the content panel opens Create with that set. |

<!-- ledger:end -->
