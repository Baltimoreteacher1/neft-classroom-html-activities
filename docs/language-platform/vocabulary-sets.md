# Vocabulary Sets

Teacher-authored word lists for the lab. Route: `/access-practice-lab/vocab-sets`. A link sits in the Teacher Hub quick tools and the For Teachers menu.

## What it does

- A teacher pastes or types a list, one word per line: `word | meaning | example sentence | translation`. Only the word is required. Spreadsheet rows (tab separated) paste in too.
- Bad lines are named by line number (missing word, too long, repeated word, over the 120-word limit). The teacher fixes them or saves without them.
- Practice modes: flashcards (got it / again, practice the missed ones), match (button pairs, no drag), finish the sentence (typed answer, optional word bank and meaning), a which-word quiz, and a presentation mode with large cards for the class.
- After two misses an answer is shown, as elsewhere in the lab. Nothing is timed. Words without an example sentence are left out of sentence practice, and the page says how many.
- Sharing: a student link carries the whole set in the URL fragment, so students need no account and nothing is uploaded. The student page has no editing, delete, export, answer key or presentation mode. A set too big for a link says so and points to Export file. Sets also export and import as a `.json` file.
- Printing: word cards, a review sheet (match plus sentences), and a separate answer key.
- Save status is truthful. If the browser blocks storage the page says it could not save and points to Export file.

## Where it lives

| Piece                                                            | File                                                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Parsing, cleaning, rounds, share links (pure)                    | `access-practice-lab/src/vocab-sets/model.js`                                         |
| Storage (this device only, key `accessPracticeLab:v1:vocabSets`) | `access-practice-lab/src/vocab-sets/store.js`                                         |
| Practice modes                                                   | `access-practice-lab/src/vocab-sets/practice.js`                                      |
| Pages, editor, printing                                          | `access-practice-lab/src/views/vocab-sets.js`                                         |
| Styles                                                           | `access-practice-lab/vocab-sets.css`                                                  |
| Tests                                                            | `tools/vocab-sets.test.mjs` (13 unit), `tools/vocab-sets-e2e.mjs` (61 browser checks) |

Run them with `node --test tools/vocab-sets.test.mjs` and `node tools/vocab-sets-e2e.mjs`.

## Keeping it easy to make a Pro version later

The feature is one self-contained route with one entry point (`vocab-sets` in `src/main.js`, one entry in `src/sitemap.js`, one link in `access-teacher/hub-home.js`). A future gate would sit at that route and would not need changes inside the feature. Nothing about plans, billing or access is built yet, on purpose.

## Limits

- Sets live on one device. There is no cross-device library yet.
- Sets are not linked to class assignments, because assignments are still a flat list with no per-student status.
- The shared student link has a size limit (about 7,000 characters of encoded set).
