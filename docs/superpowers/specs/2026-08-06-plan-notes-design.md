# Plan Notes — Lesson Plan Annotation Layer

**Date:** 2026-08-06
**Status:** Implemented. One deliberate departure from this design: document
bytes are stored in **Workers KV** (binding `PLAN_DOCS`), not R2 — R2 is not
enabled on the account, and the access pattern (write once, read on open, well
under the 25 MB value ceiling) is one KV serves correctly. Every "R2" below
should be read as "the `PLAN_DOCS` blob store". Swap to R2 if plans outgrow it;
nothing else in this design changes.
**Surface:** `/curriculum/plan-notes/` (teacher-only)

## Problem

Joel already has BCPS/Reveal lesson plan documents. What he does not have is a
place to put everything he knows about teaching them: where the timing is wrong,
where students predictably trip, what Level 1 does instead, which of his own
activities slot in where.

Today that knowledge lives in his head and dies each June. It also never reaches
the curriculum nervous system, which means the prereq DAG, gap reports, and
small-group autopilot are reasoning without the single richest signal available.

## Goals

1. **Mark up plans he already has.** Upload the real documents, annotate against
   real anchors in the text, and have those notes survive.
2. **Make the annotations machine-readable.** Every note that touches the system
   draws its tags from existing controlled vocabularies, so the DAG can consume
   them without a normalization step.

Non-goals: printing/export, sharing with team or admin, live in-class capture.
These may come later; nothing in this design forecloses them.

## Architecture

A new teacher-only surface inside the classroom repo — not a separate app.
Living in-repo buys the existing lesson IDs, misconception tags, standards list,
activity catalog, teacher auth, and deploy pipeline for free.

### One annotatable object, two front doors

Everything resolves to an `anchorKey`:

- repo lesson → `lesson:4-4`
- uploaded file → `doc:<sha256 of file bytes>`

A doc linked to a lesson shares that lesson's rail. Same note model, same
vocabulary, same UI in both cases.

### Layout

Two panes. Left renders the plan; right is the note rail, with notes positioned
at the vertical offset of what they are pinned to. A colored dot per note kind
sits in the left margin so a plan can be scanned at a glance.

Rendering by source:

| Source      | Renderer                     |
| ----------- | ---------------------------- |
| repo lesson | existing lesson renderer     |
| PDF         | vendored pdf.js, client-side |
| DOCX        | mammoth → HTML, client-side  |

No server-side document parsing. Bytes go to R2; rendering happens in the browser.

## Components

### 1. Ingest

A drop-zone taking many files at once. Per file: hash (sha256 of bytes), store to
R2 at `doc/<sha256>`, insert a `plan_docs` row. No annotation required at import.
Re-uploading an identical file is a no-op — the hash already exists.

### 2. Lesson matcher

On ingest, suggest a repo lesson ID by scoring:

- filename against `data/curriculum-manifest.json` titles and lesson numbers
- first-page text for lesson numbers, CCSS codes, and title fragments

The suggestion is always presented for confirmation or override. **Never a silent
guess** — a wrong auto-link would route notes to the wrong lesson and quietly
poison the DAG.

### 3. Library

Plans listed by unit/lesson, showing linked-or-unlinked and annotated-or-not.
The unlinked-and-unannotated subset is the working to-do list.

### 4. Annotator

The two-pane surface. Create, edit, delete notes against anchors.

### 5. API — `functions/api/plan-notes.js`

Teacher-gated via `env.TEACHER_KEY` (`?key=` or `x-teacher-key`), following the
established `functions/api/forge.js` pattern: 503 when the key is unset,
401 when it is wrong.

Routes: list/create/update/delete notes; list/create docs; presigned-ish
read of a doc blob from R2.

### 6. Rollup generator — `scripts/generate-plan-annotations.mjs`

Rolls structured notes up into `data/plan-annotations.json`, consumed read-only
by gap reports and the small-group autopilot. One-directional: nothing else
writes it, and free-text note bodies never appear in it.

## Data model

### Note kinds

The `kind` field decides a note's shape. Five kinds, matching what actually gets
written in margins:

| Kind        | Shape                                            | Feeds system                 |
| ----------- | ------------------------------------------------ | ---------------------------- |
| `timing`    | minutes + optional why                           | pacing reality-check         |
| `watch-for` | body + ≥1 misconception ID                       | yes — the highest-value kind |
| `swap`      | plan-says body + do-instead body + level (0/1/2) | yes                          |
| `resource`  | catalog ref (activity/game/printable)            | yes                          |
| `note`      | free text only                                   | no                           |

`swap` deliberately carries two bodies. "Level 1 does 4 problems with the number
line out, instead of the plan's 8" is not expressible in one text field, and it
is the note Joel writes most often.

### Tables

**D1 `plan_docs`** — `sha256` (PK), `filename`, `mime`, `page_count`,
`lesson_id` (nullable), `source_label`, `uploaded_at`.

**D1 `plan_notes`** — `id` (PK), `anchor_key`, `anchor_ref` (JSON), `kind`,
`body`, `body_alt` (swap only), `misconception_tags` (JSON array), `standards`
(JSON array), `level` (0|1|2, nullable), `activity_refs` (JSON array),
`timing_min` (nullable), `created_at`, `updated_at`, `deleted_at` (soft delete).

**R2 `PLAN_DOCS`** — document bytes at `doc/<sha256>`. New binding; must be added
to `wrangler.toml` and created in the Cloudflare account.

### Controlled vocabulary

Free text lives only in `body` and `body_alt`. Everything else validates at write
time against existing sources:

| Field                | Source                                     |
| -------------------- | ------------------------------------------ |
| `misconception_tags` | `data/misconception-labels.json` (22 tags) |
| `standards`          | `data/ccss-standards.json`                 |
| `activity_refs`      | `data/catalog.json`                        |
| `lesson_id`          | `data/curriculum-manifest.json`            |

An unknown value is a **400, not a silent insert**. This is the single constraint
that keeps the annotation layer machine-readable instead of accumulating forty
spellings of "keeps the denominator."

## Anchoring

Anchoring determines whether notes survive, so it is specified precisely.

- **repo lesson** → phase/section IDs already present in `lessons/<id>/config.json`.
  Stable; no additional work.
- **PDF / DOCX** → `{page, quote, quoteStart}`. On reopen, relocate by exact quote
  match; fall back to page; if neither resolves, the note moves to an
  **unpinned tray** pinned to the top of the rail.

**Notes never vanish silently.** A note that cannot be relocated is surfaced, not
dropped. This is a hard invariant and is covered by test.

## Offline behavior

Local-first. IndexedDB is the write path; the D1 sync is a background push on
reconnect. District classroom wifi is unreliable and note loss is unacceptable.

Conflict resolution: last-write-wins per note `id` by `updated_at`. Notes are
single-author, so this is sufficient and no merge UI is needed.

## Privacy

BCPS-authored plan documents will be stored in Joel's Cloudflare R2 bucket. This
is an accepted, explicit decision — the alternative (hash-only, requiring the
source file to be reopened from Drive each time) was considered and rejected.

Mitigations: the repo is private, the R2 bucket is not publicly readable, and all
document reads go through the same `TEACHER_KEY` gate as the rest of the API.
Documents are never exposed on any student-facing surface.

## Error handling

| Case                                  | Behavior                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| `TEACHER_KEY` unset                   | 503 with a configuration message (matches `forge.js`)                          |
| Unknown tag / standard / activity ref | 400, note not written                                                          |
| Anchor unresolvable on reopen         | note lands in unpinned tray                                                    |
| R2 binding absent                     | ingest disabled with an explanatory banner; repo-lesson annotation still works |
| Offline                               | writes land in IndexedDB, sync indicator shows pending count                   |
| Duplicate file upload                 | no-op, returns the existing doc                                                |

## Testing

**Vitest**

- anchor relocation: quote match, page fallback, unpinned tray. Includes a case
  where the document text is edited between sessions.
- vocabulary validation: each of the four validated fields rejects an unknown value.
- lesson matcher scoring: correct suggestion for representative filenames; no
  suggestion (rather than a wrong one) when confidence is low.
- rollup generator: free-text bodies never appear in `plan-annotations.json`.

**Playwright**

- annotate → reload → notes present at correct anchors
- annotate offline → reconnect → note synced to D1
- bulk ingest of multiple files → library reflects all, hashes deduped

## Open items

None blocking. Deferred by explicit decision: export/print, team sharing,
in-class live capture.
