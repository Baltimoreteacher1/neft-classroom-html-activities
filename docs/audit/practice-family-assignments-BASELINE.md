# Practice, Family and Assignments — Baseline Audit

Audited 2026-11-27 against `main` at `2c14acad`, live site `https://eduwonderlab.com`, read-only.
Script: `node tools/pfa/audit-baseline.mjs` (writes `pfa-url-inventory.json` and
`pfa-baseline-data.json` beside this file). Screenshots: `screenshots/before/` (viewport, 375 and
1280 px, live). The two `assignment-6-6` screenshots were taken but are not committed:
the old sheet's Save/Resume pill paints a blue-violet (`rgb(128,132,245)`) that `validate:no-purple`
rightly refuses in any changed raster. Re-capture with `node tools/pfa/screenshot.mjs
https://eduwonderlab.com <dir> assignment-6-6=/lessons/6-6/worksheet.html`.

Scope is the 84 core lessons in `data/curriculum-launch-manifest.json` (current Reveal TOC
numbering, post 2026-08-10 migration). The lessons themselves are out of scope.

## 1. Inventory

588 in-scope URLs, 7 per lesson. Full list with source file, generator and live status:
`pfa-url-inventory.json`.

| Surface | URL pattern | Source (generator) | On disk | Live |
| --- | --- | --- | --- | --- |
| Homework / family practice page | `/lessons/<id>/homework` | `scripts/generate-homework-html.mjs` (+ `scripts/lib/homework-*`) | 84/84 | 84 × 200 |
| Family page ("how to help at home") | `/lessons/<id>/family/` | `scripts/generate-lesson-support-pages.mjs` | 84/84 | 84 × 200 |
| Assignment (practice sheet, Set A) | `/lessons/<id>/worksheet.html` | `scripts/generate-worksheets.mjs` | 84/84 | 84 × 200 |
| Assignment answer key | `/lessons/<id>/worksheet-answer-key.html` | `scripts/generate-worksheets.mjs` | 84/84 | 84 × 401 (teacher gate, correct) |
| Publisher homework PDF | `/lessons/<id>/downloads/<id>-homework.pdf` | publisher docx → `generate-homework-pdf` | 84/84 | 84 × 200 (R2) |
| Family take-home sheet EN | `/lessons/<id>/downloads/<id>-family-sheet.pdf` | `scripts/generate-family-takehome.mjs` | 84/84 | 84 × 200 |
| Family take-home sheet ES | `/lessons/<id>/downloads/<id>-family-sheet-es.pdf` | `scripts/generate-family-takehome.mjs` | 84/84 | 84 × 200 |

Every page is generated. None carries the `<!-- hand-edited -->` marker, so there is nothing on
the conversion list.

## 2. Correctness and mapping

- **No stale-mapping defect found.** No in-scope page prints a lesson number other than its own
  in its `<title>` or `<h1>` (0 / 336 HTML pages), and every page names its own lesson by number or
  title. `npm run validate:lesson-catalogues` passes: 4 hub catalogues, 367 keys, each naming the
  lesson it links to (this is the gate that was written after the 147-of-174 incident).
- Standards: each surface prints `lessons/<id>/config.json` `standard`; enforced already by
  `validate:family-standards`.

## 3. Math

- `npm run validate:math`: 4,273 decidable answer checks over 370 lesson configs, 0 failures,
  517 undecidable shapes skipped.
- `npm run validate:bank-answers`: 8,829 multiple-choice items, 466 keys recomputed exactly, 0
  problems.
- Gap: about 11% of checks are undecidable (word problems, open response). Those are the items a
  new practice set must either avoid or recompute with a dedicated generator.

## 4. Quality scores (1–5)

Scored by reading the live pages at 375 and 1280 px plus the measurements in this file. These are
judgement scores. The reviewer is the auditor, not a publisher.

| Criterion | Homework (`homework`) | Family (`family/`) | Assignment (`worksheet.html`) |
| --- | --- | --- | --- |
| Clarity | 3: strong first screen, but ≥3 taps and reading before problem 1 (FAMILY_PRACTICE_AUDIT M1) | 3: clear "idea in 30 seconds", long scroll | 2: an injected "Think • represent • explain" panel sits above the header; floating buttons cover body text at 375 px |
| Problem quality and variety | 4: six MC skill items + v3 models | 3: try-together and check items | 3: tiered items from the lesson, MC heavy |
| Feedback quality | 4: per-choice feedback, 3-step hints | 2: reveal only | 1: none on screen (paper sheet) |
| Visual polish | 3: top bar renders as unstyled buttons with dark-on-navy "Family Home" text at 1280 px; red hero breaks the navy/teal palette | 3: pill tabs wrap mid-word ("Understan d") at 375 px | 2: web-page look, blue Save/Resume pill, overlapping floating chrome |
| Accessibility | 4: axe 0 serious/critical on load | 4: axe 0 | 4: axe 0 |
| Spanish support | 4: EN / ES / EN·ES toggle | 4: present | 1: **no Spanish on any of the 84 sheets or keys** |
| Family usability | 4 | 3 | 2 |
| Print quality | 4: dedicated take-home PDFs (gated by `validate:family-print`) | 3 | 3: prints the web chrome |

## 5. Accessibility and performance

axe (WCAG 2.0/2.1/2.2 A and AA, live, 390 px, page as loaded) on 23 pages: 6-6 homework, family and
assignment plus the first lesson's family and assignment page in each of the 10 units. **0 serious,
0 critical** on all 23. axe sees only the loaded state, and it counts text on a gradient as
unjudged. The low-contrast unit eyebrow on the red hero (6-6 homework, 1280 px) is visible in the
screenshot even though axe passed it.

Lighthouse is not installed in this repo and was not run for the baseline. The existing budget
gate, `validate:family-performance`, holds the homework page to ≤175 KB gzip first view, with the
heaviest page around 172 KB.

## 6. Translation coverage (in-scope pages with Spanish markers / pages)

| Unit | Homework | Family | Assignment | Answer key |
| --- | --- | --- | --- | --- |
| 1 | 6/6 | 6/6 | 0/6 | 0/6 |
| 2 | 12/12 | 12/12 | 0/12 | 0/12 |
| 3 | 10/10 | 10/10 | 0/10 | 0/10 |
| 4 | 5/5 | 5/5 | 0/5 | 0/5 |
| 5 | 10/10 | 10/10 | 0/10 | 0/10 |
| 6 | 15/15 | 15/15 | 0/15 | 0/15 |
| 7 | 9/9 | 9/9 | 0/9 | 0/9 |
| 8 | 7/7 | 7/7 | 0/7 | 0/7 |
| 9 | 4/4 | 4/4 | 0/4 | 0/4 |
| 10 | 6/6 | 6/6 | 0/6 | 0/6 |

The earlier "Units 1, 9, 10 about 95% untranslated" finding no longer holds for the homework and
family pages. It holds completely for assignments: 0 of 168 assignment pages carry Spanish.
Source data is mostly bilingual: of the 1,726 practice items in the 84 configs, 1,588 (92%)
carry a Spanish stem, label or title. The 138 without one cluster in Units 2, 7 and 8, where the
gaps are mostly in hints and explanations rather than stems.

## 7. Hub links

`/curriculum/units/` builds each lesson row from the catalogues `LESSON_FAMILY_HOMEWORK`,
`LESSON_PRINTABLES` and `LESSON_BONUS_ACTIVITIES`. `validate:lesson-catalogues` passes, which
means every row's homework, family and printable link resolves to its own lesson. The hub offers
no teacher-facing assignment view with copy-link or QR, and no per-unit family hub.

## 8. Constraints found that shape the build

1. **`dist/` is at its file ceiling.** `validate:dist-file-budget` fails above 19,995 files, and
   the last recorded count was 19,992. Adding 336 static pages (84 × homework, family, assignment,
   key) would stop every deploy. The new pages therefore have to add **zero** files to `dist/`.
2. **The current `homework` URL is gated by about 20 validators** pinned to the Family Math Studio
   v3 structure (route cards, five stops, visual baselines, Spanish text-node sweep, print
   parity). See CLAUDE.md, the `validate:family-*` rows.
3. **Route rule.** CLAUDE.md: "Never change what an existing URL ANSWERS without asking Joel
   first." Joel's brief authorises the upgrade but also says to stop rather than break live
   URLs. The build plan is in `docs/PRACTICE_FAMILY_ASSIGNMENTS_REPORT.md`.

## Top defects (ranked)

1. Assignments have no Spanish at all (168 pages).
2. Assignments give no on-screen feedback and print the web chrome; floating controls cover text on
   phones.
3. No teacher view lists homework, family, assignment and key per lesson with copy-link and QR.
4. No per-unit family hub or "unit at a glance" letter.
5. Homework opens on reading, not on problem 1. The top bar renders unstyled at 1280 px.
6. The red hero and the blue Save/Resume pill sit outside the navy/teal/amber palette.
7. 8% of source practice items (138 of 1,726) lack a Spanish stem, so any new set must pick items
   that have one or flag them.
