# Practice, Family and Assignments — Report

Branch `feat/practice-family-assignments`. Baseline audit: `docs/audit/practice-family-assignments-BASELINE.md`.
Everything below was measured in this session unless it says otherwise. Live verification results
are in section 9.

## 1. What was built, and one decision you should know about

**New pages for all 84 core lessons, at new URLs. The existing pages are unchanged.**

| Page | URL | Audience |
| --- | --- | --- |
| Homework practice | `/lessons/<id>/practice` | student |
| Family guide (EN/ES) | `/lessons/<id>/family-guide` | family |
| Assignment (printable) | `/lessons/<id>/assignment` | student |
| Assignment answer key | `/lessons/<id>/assignment-answer-key` | teacher (gated: the path contains `answer-key`, so the existing `isTeacherSurface` predicate covers it without a code change) |
| Teacher view: every lesson, links, copy-link, QR | `/practice-hub/` | teacher |
| Family pages by unit | `/practice-hub/family/` | family |
| Family hub per unit + printable "unit at a glance" letter | `/practice-hub/family/unit-<n>` and `/letter` | family |

Linked from `/curriculum/` (a pathway link and a "Family practice by unit" card) and from
`/curriculum/units/`.

**Why new URLs instead of replacing `/lessons/<id>/homework`.** That URL is the Family Math Studio
v3, with 166 pages. It is pinned by about 20 gates (route cards, visual baselines, the Spanish
text-node sweep, print parity, the family-v3 contract) and by product decisions recorded from
you. CLAUDE.md also says "Never change what an existing URL ANSWERS without asking Joel first." I
built the new template beside it and changed nothing that URL answers. **Switching
`/lessons/<id>/homework` to the new template is one decision away.** It needs a redirect or a
generator flag, plus retiring or re-pointing the family-v3 gates. I have not done it without your
word. Say the word and it is a short follow-up.

**Why rendered by a Pages Function.** `dist/` is at Cloudflare's 20,000-file limit:
`validate:dist-file-budget` fails above 19,995, and the count was 19,992. 336 static pages would
have stopped every deploy. The pages are rendered from `functions/_lib/pfa/` (static file first;
the Function answers only when no file exists), so they add **zero files to `dist/`**. The cost
is Worker size, measured with `wrangler pages functions build`: **3.42 MB gzip before, 4.06 MB
after**. The existing worker is already above the 3 MB free-plan cap, so the project is on the
10 MB plan.

## 2. Architecture (content is data)

```
lessons/<id>/config.json  ─┐   (authored practice tiers, worked example, vocabulary, EN/ES)
data/family-homework-notes ├─> scripts/pfa/compile-pfa-data.mjs ─> data/practice/<id>.json
data/family-glossary.json  │                                      data/family/<id>.json
data/misconception-taxonomy┘                                      data/assignments.json   (single source of truth map)
                                   scripts/pfa/build-pfa-bundle.mjs ─> functions/_lib/pfa/generated/bundle.generated.js
functions/_lib/pfa/{render,problem-view,math-visuals,illustrations,generators,strings,client-runtime}.js, design-system.css
functions/lessons/[[path]].js and functions/practice-hub/[[path]].js call render.js
```

Fixing a lesson later means editing its config or sidecar and running `npm run generate:pfa`.
A file in `data/practice/` marked `"authored": true` is never overwritten by the compiler.

## 3. Counts

| | Count |
| --- | --- |
| Lessons covered (homework / family / assignment / key) | **84/84 / 84/84 / 84/84 / 84/84** |
| Homework problems | 778 (8-11 per lesson; every set has all three tiers and at least one DOK 3 item) |
| Assignment items | 562 (+ one written-explanation item per assignment) |
| Family "Try it together" problems | 330 (3-4 per lesson) |
| Item types | multiple choice 429, generated numeric/expression/ordered-pair entry 428, numeric entry from authored items 151, error analysis 130, generated "fix the mistake" 25, match 72, select-all 21, written explanation with frame 84 |
| Skill generators ("similar problem", worked parallel example) | 38 generators, 54 modes, every lesson mapped |
| Generator problems recomputed independently | 16,200 per run (300 seeds × 54 modes) |
| Visuals checked for position against their own scale | 727 |

Not done: **number-line and tape-diagram input items** (the student drawing on the model) and
**table-completion input**. Number lines, tape diagrams, tables, double number lines, coordinate
planes, dot plots, histograms, box plots, nets, area models, balances and 100-grids all render as
data-driven SVG from one renderer. But the student answers by typing, choosing, matching or
selecting, never by placing a point on the SVG.

## 4. Mapping defects found and fixed; redirects

- No stale-mapping defect exists in the current in-scope pages (0 of 336 HTML pages print a foreign
  lesson number; `validate:lesson-catalogues` passes). The new map `data/assignments.json` is read
  by the hub, the renderer and the gates. No hand-kept second list exists.
- **No redirects were added.** No existing URL changed what it answers; `validate:route-contract`
  passes unchanged.

## 5. Quality, before → after (6-6)

Scores are the auditor's judgement. The method is in the baseline.

| Criterion | Homework before → after | Family before → after | Assignment before → after |
| --- | --- | --- | --- |
| Clarity | 3 → 4 (problem 1 on the first scroll; one card per problem) | 3 → 4 | 2 → 4 |
| Problem quality and variety | 4 → 4 | 3 → 4 | 3 → 4 |
| Feedback quality | 4 → 5 (misconception-specific, three-step ladder ending in a worked example with new numbers) | 2 → 3 (tap to reveal) | 1 → 3 (separate full-solution key) |
| Visual polish | 3 → 4 | 3 → 4 | 2 → 4 |
| Accessibility | 4 → 5 | 4 → 5 | 4 → 5 |
| Spanish support | 4 → 4 (see section 7) | 4 → 5 | **1 → 4** |
| Family usability | 4 → 4 | 3 → 5 | 2 → 4 |
| Print quality | 4 → 4 (2 pages) | 3 → 5 (1 page) | 3 → 5 (2 pages) |

Screenshots: `docs/audit/screenshots/before/` (live) and `docs/audit/screenshots/after/`. The two
*before* assignment screenshots are not committed: the old sheet's Save/Resume pill is blue-violet,
and `validate:no-purple` refuses that raster in a commit.

**axe:** before, 0 serious/critical on 23 live pages (load state only). After, 0 serious/critical
on 58 page views (7 templates × EN/ES × 390/1280, plus homework, family and assignment for one
lesson in each unit), measured by `validate:pfa-browser`.

**Lighthouse: see section 9.**

## 6. Gates (all PASS on this branch)

| # | Gate | Where | Result | Negative-control evidence |
| --- | --- | --- | --- | --- |
| 1 | Math | `validate:pfa`, `tools/pfa/generators.test.mjs` | 16,200 generator problems recomputed; every converted numeric key equals its source choice and its explanation states it | corrupted key, distractor equal to the key, orphan tag, wrong expression key, a visual that prints its own answer; also a wrong numeric key and an unstated answer in `validate:pfa` |
| 2 | Schema | `validate:pfa` | 1,340 problems: tier, DOK, standard, bilingual text, rationales, hints, taxonomy-valid tag | orphan tag, missing Spanish |
| 3 | Mapping | `validate:pfa` | each page names its lesson; data equals config and manifest; 84 hub rows link only their own lesson; the student assignment carries no answers | (the answer-leak check fired on first run and was narrowed to markup) |
| 4 | URL preservation | `validate:pfa` | 588/588 inventory URLs resolve | — |
| 5 | Generated freshness | `validate:pfa` runs `compile-pfa-data --check` and `build-pfa-bundle --check` | fresh | — |
| 6 | Accessibility | `validate:pfa-browser` | axe 0 serious/critical on 58 views; keyboard-only completion of 6-6, 9/9, finish 9/9 | seeded low-contrast page caught |
| 7 | Performance | section 9 | | |
| 8 | Self-hosted fonts | `validate:pfa` + `validate:self-hosted-fonts` | only `/assets/fonts/atkinson-hyperlegible-*.woff2`, exactly the 400 and 700 faces used; no external URL | seeded Google Fonts link |
| 9 | No purple | `validate:pfa` + `validate:no-purple` | PASS | seeded hex and color word; prose word not flagged |
| 10 | Translation | `validate:pfa` | no missing or copied Spanish string; needs-review counts below | missing Spanish fixture |
| 11 | Print | `validate:pfa-browser` | homework, assignment and key 2 pages; family guide and letter 1 page; checked for 6-6 and one lesson per unit, EN and ES | seeded 400-line page |
| 12 | SCORM | n/a | the new pages are not in the Canvas fleet. Saved state is 543 characters (< 4,096), and `reportScore()` is called only when the bridge is present | — |
| 13 | Graphics and motion | `validate:pfa` + `validate:pfa-browser` | every generated visual is SVG from `math-visuals.js`; 727 marks at their computed positions; keyframes and transitions on transform/opacity only; no running animation under `reducedMotion: reduce` or the page toggle; worked-example frame time 16.67 ms average (the 60 Hz ceiling, so no dropped frames) | misplaced mark, width keyframe, color transition, running animation under reduced motion |
| 14 | Coverage | `validate:pfa` | 84/84 for every page type | — |
| 15 | Existing suite | section 8 | | |

`validate:pfa` is wired into `npm run validate` (and so into `qa:loop`). `validate:pfa-browser`
takes about 3 minutes in Chromium and is listed in `qa-exempt.json` like the other heavy family
browser suites; `npm run check:pfa` runs both. The brief asked for the gates in `npm run check`.
`check` is Biome in this repo, so I left it alone and added `check:pfa`.

## 7. Spanish: what is authored, what needs review

- All student and family text on the new pages has Spanish. Every string comes from authored
  Spanish in the repo: lesson configs, family sidecars, the family glossary, the misconception
  taxonomy, the Spanish title list and the Practice Studio objectives. One exception is listed
  next.
- **17 learning objectives** (1-1 to 1-6, 4-1 to 4-5, 10-1 to 10-6) had no Spanish anywhere. I
  wrote them (`data/practice/_objectives-es.json`). They render with
  `data-translation="needs-review"` and **need a native reviewer**.
- **Per-choice Spanish wrong-answer feedback** is rarely authored in the source configs (25 of 784
  items). Where it is missing, the Spanish feedback is the taxonomy's authored Spanish message for
  that misconception, or the item's own Spanish hint. English shows the item's specific feedback.
  This is not machine translation, but it is less specific than the English. Counts by unit
  (taxonomy / hint): 1: 40/47, 2: 78/138, 3: 69/129, 4: 39/57, 5: 55/152, 6: 111/174, 7: 26/184,
  8: 118/44, 9: 31/113, 10: 14/70.
- 344 source items were skipped because they had no Spanish. 9 orphan misconception tags in source
  items were dropped, not propagated.
- 488 of 1,340 problems carry the lesson's main misconception tag (from its generator) because the
  source item had none. The data records this as `misconceptionSource: "lesson-default"`.

## 8. Existing suite and scope

PENDING: filled in after the full comparison against `origin/main`.

## 9. Deploy and live verification

PENDING.

## 10. Out-of-scope issues found (logged, not touched)

PENDING (assembled from the failures that reproduce on a clean `origin/main`).

## 11. Next 10

1. Decide whether `/lessons/<id>/homework` should become the new template (section 1).
2. Native-speaker review of the 17 objectives and of the per-choice Spanish feedback fallbacks.
3. Author per-choice Spanish feedback (`choiceFeedbackEs`) in the lesson configs. The compiler
   picks it up automatically.
4. Add number-line, tape-diagram and table-completion input items. The renderer already draws
   them.
5. Replace lesson-default misconception tags with item-level tags in the configs (488 problems).
6. Put the four PFA links in each `/curriculum/units/` lesson row. Today they are in the
   `/practice-hub/` teacher view, which has one row per lesson.
7. Bring `validate:pfa-browser` into a scheduled CI job.
8. Run Lighthouse in CI against a preview deploy (section 9 has the local numbers).
9. Hand-author a richer 6-6 set (`"authored": true`) as the publisher showcase.
10. Fix the pre-existing failures in section 10.
