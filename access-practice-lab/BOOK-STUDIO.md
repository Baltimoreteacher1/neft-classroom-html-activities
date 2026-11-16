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

## Integrations (real content through `handoff.js`)

| From                                                      | Button                    | Becomes                                                                                                                                                                                         |
| --------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Writing Studio (`/write/<task>`, after Save to portfolio) | Add to my book            | the final draft on a page of a genre template (narrative → personal narrative, CER → science investigation, essay → evidence argument, report, summary → reading response, letter → persuasive) |
| Real-Life Scenarios (`/scenarios/<id>`, finished)         | Make it a comic book      | the conversation the learner actually had, as comic panels with characters and speech bubbles (conversation-book template)                                                                      |
| Language Worlds (`/worlds/<world>/<mission>`, recorded)   | Write the mission report  | mission + the learner's own conclusion, in the mission-report template                                                                                                                          |
| Word Lab garden (`/wordlab/garden`)                       | Make a picture dictionary | one page per garden word (word, meaning); the learner writes an original sentence, adds a picture and records the word                                                                          |

## Honest limits

- No online accounts: books live in the browser. Real-time multi-user co-editing is NOT built (no identity/sync
  infrastructure for it on this site); collaboration is turn-taking through the class queue and book files, and
  conflicting edits from two tabs are detected, never merged silently.
- Share links carry words, illustrations and drawings; uploaded pictures, recordings and videos stay on the device.
- PDF is the browser's print-to-PDF (real text). EPUB is reflowable (reading order kept, exact layout not; the export
  says so). Cover export falls back to SVG where a browser refuses to rasterise HTML.
- Read-aloud word highlighting depends on the voice reporting word boundaries; when it does not, the reader says so and
  highlights the text box instead.
- No AI writing help inside Book Studio yet (the site's AI helpers are selection-only and opt-in elsewhere).
