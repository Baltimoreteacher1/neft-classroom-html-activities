# Technical regression

This pass did not deploy and did not run the full `qa:loop`.

## Commands and results

| Command | Result |
| --- | --- |
| `node scripts/generate-homework-html.mjs` | 166 homework pages. Each lead includes the six-part path, `solve N`, and "Optional and ungraded." |
| `node --test engine/core/publisher-upgrade.test.mjs math/games/shared/game-shell.test.mjs` | 15 pass, 0 fail |
| `npm run validate:family-performance -- --no-cls` | pass. Worst first view 173 KB gzip, limit 173. Layout shift not run in that invocation. |
| `npm run validate:family-mission-content` | pass. 150 of 166 pages with no finding. Known open: TOPIC_MISMATCH 12, BILINGUAL 7. |
| `npm run qa:fast` | escalated to the full gate: `scripts/publisher-coverage.mjs` has no coverage rule. PASS 153/174, SKIPPED 2 (`validate:scorm:shipped`, `validate:fluency-family-session`). Failed checks are listed below. Wall 1412.3s. |
| `npm run qa:fast -- --only` the 24 checks from the first change-scoped run, plus `validate:family-mission-content`, `validate:shared-claims`, and `validate:no-purple`, with `PW_CHROMIUM_PATH=/usr/local/bin/google-chrome` | PASS 25/27. Failed: `test`, `validate:no-purple`. Wall 1309.6s. |
| `PW_CHROMIUM_PATH=/usr/local/bin/google-chrome node tools/verify-game-transformation-browser.mjs` | exit 0. Also passed inside the 26-check run (373.2s). |
| `npm run qa:loop` | not run |
| Browser play-through of the five demo routes as a person | not run. `validate:family-visual` (112 loads), `validate:family-experience-browser`, `validate:family-a11y`, `validate:lesson-boot`, and the game-transformation browser check did run with system Chrome. |

## What the new test covers

- `3^2` evaluates as `3×3 = 9`. The product `6` is classified as the multiply-by-the-exponent bug and opens a different fresh item. The repair text says the error may indicate a misunderstanding.
- Equivalent-ratio scale factors `1, 2, 3, 4, 0.5` keep the quantity model, tape, table row, double number line, and symbolic statement on the same pair.
- Adding, subtracting, and dividing both sides of `2x + 3 = 11` keeps the solution `4`.
- Family homework HTML under `lessons/*/homework.html` does not tell families the practice is required homework, graded, or worth bonus credit. A percent problem that uses “bonus points” as a quantity is not a policy line.
- Lesson `6-4` title, `contentObjective`, and standard `6.AT.6c` agree. Part 2 remains a separate lesson id.
- Demo and teacher routes exist as files.
- `setLanguageMode` and `setPreferredLang` do not assign input values.
- Hint rungs carry the roles strategic, representation, parallel.
- A map plan lists only prerequisites present on the in-memory graph.
- Learning events drop name and initial fields.

## What failed, and what was not claimed

The full `npm run qa:fast` failed these checks. They are not passes.

- `check` failed on that run. A later `npx biome check` of the whole tree exited 0 after import order and format fixes. The 26-check rerun then passed `check`.
- `test` runs all 821 scripts when `data/test-reads.json` changes. It failed because the manifest does not list reads from tests this upgrade did not edit: `access-practice-lab/content/es-strings.json`, `language-studio/index.html`, `functions/_lib/class-platform/ai.js`, and graphic-novel files under `graphic-novels/axiom-city/`. That drift was already in the manifest. `npm run test:reads` was not run, so this is not a pass.
- `validate:no-purple` failed on two purple fills in `scripts/lib/learn-figures.mjs` (the long-division bring-down swatch). Those colors are in the file on `origin/main` as well. Formatting the file made it a changed surface, so the gate scanned it. The two purple world colors in `math/games/practice-arcade/map.html` were changed to navy and teal. The learn-figures colors were not recolored.
- `validate:graph` failed because this environment's `core.hooksPath` is not `.githooks`. That is the agent checkout, not a curriculum change.
- `validate:notes-pdf-layout`, `validate:family-print`, and `validate:family-standards` failed with `spawn pdftoppm`, `pdfinfo`, or `pdftotext` ENOENT. Poppler is not installed here.
- `validate:fluency`, `validate:fluency-family-browser`, `validate:family-expedition-browser`, `validate:access-lab`, `smoke:injection`, `validate:html-experiences-browser`, and `validate:language-page-mystery-studio-browser` failed launching Playwright's own Chromium. They do not read `PW_CHROMIUM_PATH`. System Chrome was used only by the checks that do.
- `validate:family-visual` failed on the first full run because the hero on lesson 4-5 grew from 1218px to 1437px. The lead was shortened into the existing paragraph. The rerun passed: 112 page loads.
- `validate:family-mission-content` failed on the first full run because the lead no longer contained lowercase `solve N`. The lead now says `then solve N`. The rerun passed.
- `validate:shared-claims` failed on a test fixture titled "Lesson 3-3". The fixture title is now "Equivalent ratios". The rerun passed.
- `validate:classroom-alignment` failed because `tools/reveal-classroom-slide-text.json` is one character off the reconciler. The reconciler was not run.
- `build:generated-fresh` failed until `data/curriculum-download-manifest.json` and `data/curriculum-search-index.json` were regenerated. The 26-check rerun passed it.

## Known limits

- Family homework HTML was regenerated with `node scripts/generate-homework-html.mjs`. The six-part path and the optional, ungraded sentence are in the existing lead, which still says `solve N`, so the quick-route count check keeps working. Optional practice was not turned into required homework or bonus points.
- Practice studio HTML was not regenerated. The seven-step arc is injected at runtime by `assets/studio/clarity.js`.
- Three of the 17 game directories were not given a play shell. Reasons are in `docs/publisher-upgrade/games.md`: `dashboard` is a teacher progress reader, `engines` has no student page, and `shared` is the shell itself.
- Lesson `6-4` objective strings were copied into generated manifests, studio pages, and some printables so those surfaces do not keep the old target. That was a string alignment, not a full curriculum rebuild.
- `npm run qa:loop` was not run. The five demo routes were not clicked through by hand.
