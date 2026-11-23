# Activity Studio (BCPSS Activity Studio)

A teacher builds an interactive activity, a printable/editable worksheet, a learning game or a quick check from one
shared content model: **Choose what to make → Add what students should learn → Preview, adjust, share.**
The route is `/activity-studio` (teacher), `/activity-studio/mine` (My Activities), `/do/<id>` (student page).
Everything here is local-first: drafts live on the device; a class (existing class code + teacher passcode) adds
cross-device drafts, stable share links and evidence. No new login system.

## The model (`src/studio/core/schema.js`)

One activity = `{ schema: "lp-activity/1", id, rev, title, description, kind, template, context, supports, look,
options, blocks[], notes }`. `normalizeActivity(untrusted)` is the ONLY way data enters: it drops unknown fields,
caps sizes, strips control characters, allows only raster `data:` images or same-site paths. Text is plain; renderers
escape everything and apply only the math markup of `core/math.js` (`{3/4}` stacked fraction, `x^2`, `_{n}`) and `**bold**`.

- `kind`: `interactive | worksheet | game | check`. `template`: one per kind-specific list in `TEMPLATES`.
- Blocks: `text passage vocab image math table question organizer note audio`.
- Question formats (15): `choice multi match sort order blank number short identify hotspot numberline build error fillTable plot`.
  Field shapes are in `QUESTION` in schema.js; `core/fixtures.js#allFormats()` has a valid example of each.
- `options.timer` is always `false`: timers are never offered.
- `context.standards[].origin` is `"curriculum"` (verified metadata) or `"teacher"` (teacher's choice). Never invent `"curriculum"`.
- Teacher-only content: `notes`, `note` blocks, answer keys. The student copy never carries `notes`/`note` blocks;
  a **worksheet** student copy also carries no answers at all.

## Core modules (pure, no DOM, no network)

| Module             | Purpose                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `core/math.js`     | exact rational parse/eval/compare, `mathRuns`, `plainMath`, `spokenMath`                      |
| `core/check.js`    | `checkResponse(question, response)`, `answerText(q)`, `parseMarked`, `marksOf`, `tableBlanks` |
| `core/validate.js` | `validateActivity(a) → { ok, errors[], warnings[] }`; errors block publishing                 |
| `core/schema.js`   | constants, `normalizeActivity`, `cleanBlock`, `uid`, `safeImageSrc`, `questionsOf`            |
| `core/fixtures.js` | `allFormats()`, `vocabSample()` for tests and the studio's sample                             |

Response shapes for `checkResponse` are documented in check.js. `status` is `correct | incorrect | partial | review | empty`.
Free writing (`short`) is never auto-graded.

## Files and owners (do not edit files you do not own)

- `src/studio/player/**`, `tools/build-studio-player.mjs`, `access-practice-lab/player/**` (generated), `src/studio/export/html.js`: player + HTML export
- `src/studio/print/**`, `functions/_lib/studio/docx.js`, `functions/api/studio/docx.js`: worksheet print + Word
- `functions/_lib/class-platform/activities.js`, `functions/api/studio/ai.js`, migration + schema registration: server
- `src/studio/core/mathgen.js`: verified math problem generators
- everything else under `src/studio/` (editor, library, generate, curriculum, view) and routing: integration

## Server contract (`/api/class/activity/*`, teacher routes use the existing class teacher gate)

`GET play?id=` public student copy · `GET list?code=` · `GET get?code=&id=` · `POST save {code, activity, baseRev}`
(409 `conflict` with `current` when `baseRev` is stale) · `POST duplicate` · `POST delete` · `POST publish` (re-validates;
refuses on errors) · `POST unpublish` · `GET revisions` · `POST restore` · `POST response` (public, anonymous, tiny,
rate-limited: per-question first-try/final correctness, hints, revised) · `GET evidence?code=&id=` (aggregates only).
States: `draft | published | unpublished`; "updated" = the draft rev is ahead of the published rev.

## Conventions

Plain ES modules, no new dependencies, files ≤ 500 lines (hard cap 750), Biome-formatted, English + Spanish for every
teacher- or student-facing string (`T("English", "Español")` pairs in the lab; the standalone player takes a
`strings` table), WCAG 2.2 AA (keyboard for every pointer interaction, visible focus, no color-only feedback, reduced
motion, 44px targets), no timers, no scores that rank, nothing sent anywhere without the teacher publishing.

Tests: `node --test tools/studio-*.test.mjs functions/**/studio*.test.mjs functions/api/class/activities.test.mjs`.
