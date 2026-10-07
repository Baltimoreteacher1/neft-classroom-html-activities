# Family homework completion

Authorized: implement the 18 audit recommendations and ten unit priorities; commit and release through `ALLOW_DEPLOY=1 npm run ship`. Route copy must make tasks and stopping points explicit.

Acceptance:
- [x] Fix markup corruption, missing problem context, lesson/model/game/resource alignment.
- [x] Three understandable routes: quick (2 problems), learn (6), family (6 plus one mission/game); switching preserves work.
- [x] Compact mobile introduction, early language controls, optional/ungraded policy consistent.
- [x] Purposeful hints, parent questions, bilingual reasoning support, independent attempts.
- [x] Distinct household application; optional extras after completion.
- [x] Route-aware print problems and separate answers; resume state clear; defer optional initialization.
- [x] Unit 1–10 improvements supported by content and regression tests.
- [x] Generate all pages, targeted and required checks, desktop/mobile browser verification.
- [x] Commit reviewed changes, ship onto latest main, verify live release and routes.

Preserve existing lesson routes, student storage, Canvas wiring, and unrelated work. No new dependencies, remote student-data changes, or messaging.

Unit 10 is not taught (Joel, 2026-10-07): it keeps shared generator output only; no Unit 10-specific content was added.

## QA evidence (2026-10-07)
- Homework tests: 58/58 pass (`node --test tools/homework-*.test.mjs tools/family-week-notes.test.mjs`), incl. new pins for 9-3-part2 dollar amounts, the 1-2 ladder, 7-5/7-8 plotting missions and lazy drawing init.
- `validate:homework` 166 pages, CRITICAL 0 / HIGH 0; `validate:family-games` PASS; `audit:homework` 166/166.
- `qa:loop` 122/124 before the last fixes; the two failures (`audit`, `audit:homework`) are fixed: stale `/neft-math-lab-studio/` registry entry from 5e1daf0be4, and the audit's quick-route ban reversed per decision `family-homework-three-routes`.
- Browser (vite preview of the built site, 390×844): quick shows Learn/Check/Done with 2 problems (0/2 progress); switching quick→full keeps the answer and shows 6 problems and 7 stops; Spanish mode sets `lang="es"` and shows only Spanish route copy; a drawing pad hidden at boot initialises on first touch and draws; the family game builds only after Play; no page errors.
- Print (headless Chromium PDF, Letter, lessons 3-2, 7-6, 1-2, 9-3-part2): quick prints 2 problems on 3 pages, core 6 on 7, no blank pages, no answers. The earlier `break-inside: avoid` on whole cards produced sliver and blank pages; replaced with keep-header-with-question.
