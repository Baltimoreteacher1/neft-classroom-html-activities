# Book Studio

Multimedia book authoring inside The Language Page: `/access-practice-lab/book-studio` (thelanguagepage.com
`/access-practice-lab/book-studio`), opened from **Create a Book** in the top navigation on every page and every width.
Independently designed and built; no code, templates, artwork or trade dress from any other product.

## Routes

| Route                                           | What                                                                                                                                                                              |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/book-studio`                                  | Bookshelf: create, continue, search/filter by status, books opened from files or links ("Shared with me"), open a book file, featured templates, "turn your practice into a book" |
| `/book-studio/new[?template=<id>\|kind=<kind>]` | Create: blank kind (portrait, picture book, comic, report, narrative, informational, bilingual, audio story) or template → title → editor                                         |
| `/book-studio/templates`                        | 26 templates by genre (narrative, informational, argument, comic, poetry, response, portfolio, family)                                                                            |
| `/book-studio/edit/<id>`                        | Editor                                                                                                                                                                            |
| `/book-studio/read/<id>`                        | Reader                                                                                                                                                                            |
| `/book-studio/review/<id>`                      | Reader + teacher page notes, "Return to student" downloads the book with notes                                                                                                    |
| `/book-studio/play/<id>[?test=1]`               | Play a branching story: choices, clickable clues, inventory, endings, saved progress. `?test=1` is the author's play-test with the story check shown                                |
| `/book-studio/teacher`                          | Teacher workspace: one guided form for a differentiated assignment, assignment list, learning evidence (class server records or a student's book file)                            |
| `/book-studio/shared#b=…`                       | Read-only book from a share link (the data is in the hash; it never reaches a server)                                                                                             |

## Files

| File                                                      | Owns                                                                                                                                                                                                               |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/views/book-studio.js`                                | routes, bookshelf, create flow, template gallery, recovery prompt, import                                                                                                                                          |
| `src/book/model.js`                                       | the versioned document model (`SCHEMA`), formats, kinds, normalization, `migrate`, template expansion, reading order, finish checklist. Pure: Node-testable                                                        |
| `src/book/db.js`                                          | IndexedDB `accessPracticeLab-books` (books, media, versions), recovery copy, revision conflicts, cross-tab messages                                                                                                |
| `src/book/render.js`                                      | the ONE page renderer (editor, thumbnails, reader, print, cover export)                                                                                                                                            |
| `src/book/sanitize.js`                                    | rich-text allow-list for typing, paste, import and share links                                                                                                                                                     |
| `src/book/editor*.js`                                     | editor shell and canvas (`editor.js`), state/undo/autosave (`editor-core.js`), Add toolbar (`editor-add.js`), inspector (`editor-panels.js`), dialogs (`editor-dialogs.js`), media and drawing (`editor-media.js`) |
| `src/book/reader.js`                                      | reader                                                                                                                                                                                                             |
| `src/book/export.js`                                      | Print/PDF, EPUB 3, cover PNG, `.langbook` project export/import, share links                                                                                                                                       |
| `src/book/collab.js`, `src/book/collab-model.js`          | writing together with the class: session, presence, sharing, bookshelf section; the device half of the merge (pure)                                                                                               |
| `src/book/handoff.js`                                     | `createBookFromContent()`, the one contract other studios use to start a book from real work                                                                                                                       |
| `src/book/templates*.js`, `src/book/art.js`               | 26 templates; 72 original illustrations                                                                                                                                                                            |
| `book-studio.css`                                         | all Book Studio styles (loaded by the view)                                                                                                                                                                        |
| `tools/book-studio.test.mjs`, `tools/book-studio-e2e.mjs` | unit tests; the browser journey                                                                                                                                                                                    |

## Document model

A book is JSON: `{ schema, id, title, format, kind, templateId, lang, dir, status, rev, pages[], feedback[], submission, review, source }`.
Each page: `{ id, bg, bgArt, narration, prompt, frames, elements[] }`. Elements (`text`, `image`, `art`, `shape`, `bubble`,
`audio`, `video`, `drawing`, `panel`) use percent coordinates and cqw text sizes, so one page renders at any size.
Layer order is array order. Text is a sanitized HTML subset (never a flattened image), so it stays selectable,
readable aloud and exportable. Media are IndexedDB Blobs referenced by id. `migrate()` upgrades older schemas.

## Saving

Every change writes a synchronous recovery copy to localStorage, then saves to IndexedDB after 0.7 s. The status says
"Saved on this device" only after the transaction commits; failures show "Not saved · Try again". Each save carries the
revision it started from: if another tab saved first, the save is refused and the learner chooses which version to keep
(the other is kept in Version history). A version is saved automatically every ten minutes of editing, on Finish and on
Send, and on demand (20 kept). Unsaved changes found on open are offered for restore. Books are on this device only:
the shelf says so, and the `.langbook` file is the backup and the way to move devices. The site-wide Save/Resume
engine is told to skip every Book Studio field (`data-nsr-ignore`).

## Teacher review

Two real paths, no sample data:

1. **Joined class** (`/class`): Finish → "Send to my teacher" posts the book's text (pages in reading order, picture
   descriptions, transcripts; ≤ 4,000 characters) to the class review queue (`/api/class/review/share`, server-side
   authorization by student key). The teacher reviews it with the existing rubric chips and comment; "Check for teacher
   feedback" pulls the review (`review/mine`) into the book. Pictures and recordings stay on the student's device.
2. **Book file**: a student downloads the `.langbook`; the teacher opens it, uses `/book-studio/review/<id>` to leave
   page notes and downloads it back; the student opens it and sees each note on its page ("I revised this").

## Writing together (class collaboration)

Real co-editing for learners in the same joined class (`src/book/collab.js`, `collab-model.js`; server
`functions/_lib/class-platform/books.js`, merge rules `shared/class-platform/book-merge.js`, schema
`migrations/0015_book_collab.sql`). Nothing is simulated: every collaborator, edit and presence mark comes from the class
server.

- **Who.** Only a learner who joined a class (`/class`) can share or join, and only inside that class. Share & export →
  "Share with my class" stores the book on the class server and shows a 6-character **book code**; a classmate in the
  same class types it under "Shared with my class → Join a classmate's book" on the bookshelf and joins as an
  **editor**. The owner can make a collaborator view-only, let them edit again, remove them, or stop sharing (every
  device keeps its own copy). Up to 12 writers per book, 6 shared books per owner.
- **Teacher.** The class dashboard (`/class/teacher` and the Teacher Hub, `src/class/book-collab-panel.js`) lists the
  class's shared books with owner, code, pages, participants, their edit counts and who is in the book now; it can
  set a book read-only, make a learner view-only, remove a learner, delete the shared copy, or turn writing together
  off for the class. All of it is enforced server-side on every route.
- **Sync.** The book is items with their own revisions: book details, each page, each element. Each device sends the
  difference between its book and the last server copy it saw (so typing, dragging, undo and a restored version all
  become element-level ops) and polls for classmates' changes: every 2 s while the tab is visible, every 15 s when
  hidden. Concurrent edits to different elements, or different properties of one element (one moves a box while the
  other types in it), both survive. The same property changed on two devices: the later arrival at the server wins, on
  every device. A delete beats a stale edit; deleting a page deletes its elements. Order is a fractional number per
  page/element, so two people adding pages never rewrite each other's order. Undo only takes back the learner's own
  edits (remote changes are written into the undo history too). Each write records who made it ("Last changed by …").
- **Typing safety.** A classmate's change to the box this learner is typing in is held ("Ana also changed this box…")
  and shown when they leave it; changes never arrive mid-drag.
- **Presence.** Initials of the classmates in the book (with their page and whether they are typing) in a bar under the
  top bar; a coloured outline with the classmate's name on the element they selected (dashed while typing); initials on
  the page thumbnails.
- **Media.** Pictures are shared as JPEG copies ≤ 1200 px and ≤ 350 KB, at most 30 per book (D1 BLOBs; the original
  stays on the device). Recordings and videos stay on the device that made them (the dialog says so).
- **Offline / no server.** Each copy is still a normal Book Studio book (autosave, versions, offline). Offline edits are
  sent when the device is back. If the class server is not configured (503) the bar says writing together is not
  available and solo editing is unchanged. If a device was away while others edited, the newer server items win for
  those items and this device's previous copy is saved in Version history first.
- **Retention.** A shared book is deleted 30 days after anyone last opened or changed it, with its class (120 days
  unused, or the teacher's class delete), and with its owner when the teacher removes that learner.

## Integrations (real content through `handoff.js`)

| From                                                      | Button                    | Becomes                                                                                                                                                                                         |
| --------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Writing Studio (`/write/<task>`, after Save to portfolio) | Add to my book            | the final draft on a page of a genre template (narrative → personal narrative, CER → science investigation, essay → evidence argument, report, summary → reading response, letter → persuasive) |
| Real-Life Scenarios (`/scenarios/<id>`, finished)         | Make it a comic book      | the conversation the learner actually had, as comic panels with characters and speech bubbles (conversation-book template)                                                                      |
| Language Worlds (`/worlds/<world>/<mission>`, recorded)   | Write the mission report  | mission + the learner's own conclusion, in the mission-report template                                                                                                                          |
| Word Lab garden (`/wordlab/garden`)                       | Make a picture dictionary | one page per garden word (word, meaning); the learner writes an original sentence, adds a picture and records the word                                                                          |

## Honest limits

- No online accounts: books live in the browser. Writing together (above) needs a joined class; it is polling over
  Cloudflare D1 (no WebSockets/Durable Objects on this site), so a classmate's edit appears within about 2-4 seconds,
  not instantly, and the same text box typed in by two people at once keeps one person's words (the later save), not
  a character-level merge. Two tabs of the same book on one device are still detected, never merged silently.
- A device that slept past a large burst of deletions (over 1,500 deletion markers in one book) reloads the whole
  book; an element it still had locally and never synced can come back in that rare case.
- Share links carry words, illustrations and drawings; uploaded pictures, recordings and videos stay on the device.
- PDF is the browser's print-to-PDF (real text). EPUB is reflowable (reading order kept, exact layout not; the export
  says so). Cover export falls back to SVG where a browser refuses to rasterise HTML.
- Read-aloud word highlighting depends on the voice reporting word boundaries; when it does not, the reader says so and
  highlights the text box instead.


## Book Studio 2.0 — the Living Storyworld and the ESOL Support Studio

One document model (schema 3; schema 2 books migrate on open and nothing is dropped). Four creation modes on the shelf
(`story`, `adventure`, `comic`, `movie`) are *starting points over the same document*; every book can be read, played,
narrated, printed or turned into a reader's-theater script. The editor is organised around five stages
(Imagine · Create · Bring It to Life · Improve · Publish); only the current stage's tools show (`src/book/ui-story.js`).

| File | Owns |
| --- | --- |
| `src/book/lang/profiles.js` | WIDA 2020 framing: Key Language Uses, modes, grade clusters, six **support profiles** (recipes, never levels or scores), per-skill intensity, plans. Official expectation ids come only from `src/acc/wida/catalog.js` |
| `src/book/lang/supports.js` | `LanguageSupport` model (8 types, 100+ kinds across the A–F categories), trusted normalization, **`resolveSupports`** (who sees what, assigned vs help on demand, required, fading), `groupCopy`, `publicCopy`, recommendations with evidence |
| `src/book/lang/library.js` | Searchable library (`"cause and effect, grade 6, WIDA Level 2"`), packs, suggestions from selected content, and the rule-based **Design Language Supports** command interpreter (preview-then-approve; no network, no AI service) |
| `src/book/lang/work.js` | What a learner did: support-use records (available/opened/used/completed/hidden/required/independent), first attempts, revisions labelled student / assisted / teacher, evidence report |
| `src/book/lang/ui-support.js` | The learner's tray and cards (starters, word banks, vocabulary popover, organizers, oral rehearsal with a typing path, reading help, revision side-by-side). One host serves the editor, the preview panes and the reader |
| `src/book/lang/ui-instructor*.js` | **Add Language Support** builder with live student preview, Language Support Studio (manage, bulk edit, library, packs, designer, plans and groups, fading, evidence export, **Preview as student** incl. two profiles side by side) |
| `src/book/lang/class-sync.js` | Class delivery: publish an assignment, roster, adjust a plan with a reason, evidence; student side fetches ONLY their own supports and sends events and work |
| `src/book/story.js` | Character DNA, scene actions and `compileScene` (deterministic animation), choices/state/`takeChoice`, **story validators**, the bounded **Direct this scene** interpreter (`validateOps` is the only gate), `adventureSkeleton` |
| `src/book/scene-player.js` | Web Animations player: walk/run/turn/look/point/jump/wave/appear/disappear/fade/expression/speak/pause/zoom/pan/sound, scrubbing, reduced motion = final pose, sound only after Play |
| `src/book/play.js`, `ui-story-map.js`, `instructor.js` | Play mode; characters, choices, clues, items and the visual story map; the teacher workspace |
| `functions/_lib/class-platform/book-supports.js` | `/api/class/bsupport/*`: server-side resolution per student (migration `0014_class_book_supports.sql`) |

**Where teacher/student separation is enforced.** In a class, the plan (class default, groups, per-student overrides)
lives on the server; `mine` returns only the supports resolved for that student, with `levels` removed and no profile
number, group name or classmate plan (`functions/api/class/book-supports.test.mjs`). On a single device (no class) a
teacher exports **a copy per group** that contains only that group's supports; the browser alone cannot hide data from
the person holding the file, and the UI says so. Share links, PDF and EPUB carry only supports the teacher marked
"keep in the published book" (`publicCopy`); plans, groups, use records and revisions never travel.

**Evidence.** Counts describe what happened (opened/used/completed/hidden/independent) and show the student's original
and revised text side by side. No WIDA level or ACCESS score is ever calculated; fewer clicks, word count and tool use
are not treated as proficiency. A fading suggestion always shows its evidence and needs the teacher's approval and a
reason, which is kept in the plan history.

**Tests.** `tools/book-studio-2.test.mjs` (logic), `functions/api/class/book-supports.test.mjs` (server authorization),
`tools/book-studio-2-e2e.mjs` (browser: modes → teacher support → persistence → Level 1 vs Level 5 preview → student use
and evidence → animation and reduced motion → playable branch → share link → old book → every authoring surface →
tablet/phone overflow → axe).

### Not built (honest list)
- The Designer, the support-tray coach, suggestions and "Direct this scene" follow fixed rules on the device and send
  nothing. The only generative AI is the opt-in Writing coach (below), which asks questions and offers words. No AI illustration or AI character generation.
- No machine translation, no speech-to-text, no teacher pronunciation recorder in the builder (the model and the word
  popover support a recorded pronunciation and a "machine translation" label; entering translations is manual).
- No Classroom Story Universe (shared class world). No server-hosted public publication: "Anyone with the link" is the
  existing hash share link and is gated on a teacher's approval for class, family and public audiences.
- Right-to-left editing exists at book level (`dir`); support cards and the story map were not verified in RTL.
- Parallax is a gentle background drift, not layered depth.
- The Writing coach (`src/book/editor-coach.js`, `src/book/coach-rules.js`, `/api/book-coach`) is opt-in in Book
  settings, hidden when a class teacher turns it off, and only asks questions or offers words (PLATFORM.md rule 3,
  fourth exception). Better words, Clarity check and Spanish meaning need the model; Spanish meaning falls back to the
  Word Lab bank for single words. Organize sees only page headings (or a page's first eight words), so it cannot judge
  pages whose headings say nothing about their content.
