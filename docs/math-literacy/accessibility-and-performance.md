# Math Literacy Studio: accessibility and performance

What was measured, with what, and what was not. Nothing here claims WCAG conformance or a screen-reader pass.

## Accessibility: measured

Run by `node tools/mls-e2e.mjs` (Playwright, Chromium, axe-core via `@axe-core/playwright`, tags `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`). The check fails on any **serious** or **critical** violation. Moderate and minor findings are not gated.

| Surface | axe (serious/critical) | Keyboard | Overflow at 1280 / 820 / 375 px |
| --- | --- | --- | --- |
| Landing (three doors) | none | doors, search, grade links reachable | none |
| Teach: skill page | none | support choice, resource links | none |
| Builder (worksheet) | none | dials, edit fields, Save, Download | none |
| Support a learner plan | none | concern, grade, skill, resource links | not gated |
| Activities: 7 engines, games and manipulatives sampled | none | see below | none |
| Collections, Family view | none | yes | none |

Counts for the last full run: 177 checks across 11 scenarios, all passing.

- **Manipulatives (30):** `tools/mls-manips-a-check.mjs` (249 checks) and `tools/mls-manips-b-check.mjs` (409 checks) drive each one with Tab, typed values, Space and Enter only, and assert that every operation changes a live-region summary and that Reset is reachable.
- **Games (12) and engines (12):** `mls-games-check.mjs` (28 checks) and `mls-engines-a/b-check.mjs` (24,620 checks in A) cover answer checking, hints that never reveal the answer, no timers, and the reasoning check.
- **Visuals (30 kinds):** `mls-visuals-check.mjs` renders 934 specs (31,667 property checks): palette only, text at least 12 units, every svg has a title and a description, and a hidden value never appears in svg text, alt or summary.
- **No timers, no scores:** the activities scenario asserts no countdown text; the UI says so.

Axe cannot enter the preview frames (`sandbox` without `allow-scripts`, on purpose). The preview document is the same HTML the print and HTML export produce; it was not separately audited with axe.

## Decision: picture descriptions are always available to assistive technology

`renderVisual` returns `{ svg, alt, summary }`. `summary` states the values that are **drawn**, and never states a derived result (a total, a product, a volume, a difference the picture does not print). A value the student must find (`?`) is spoken as "unknown".

For a read-the-graph item a screen-reader user therefore hears the drawn values, the same information a sighted student reads from the gridlines. The studio does not hold the description back until after the student answers, and it is not limited to teacher or print views. Reason: hiding it would make the item impossible for a blind student, and the item is practice that records nothing. The cost: for a few "read one value" items the drawn value is also the answer. Teachers who want a secured check should use a different resource type. Revisit this with the screen-reader pass (H-25).

## Not done

- **No screen-reader pass** (NVDA, JAWS, VoiceOver). Tracked as H-25.
- **No Safari or Firefox run.** Chromium only.
- **Speech:** device speech synthesis only; Spanish voice quality was not listened to.
- **Exports:** checked with python-docx, python-pptx and LibreOffice (conversion to PDF, page images), not in Word or PowerPoint. PPTX omits workspace lines and speaker notes. Word accessibility checker was not run.
- **Color contrast** was checked by axe in the light theme the lab ships; no forced-colors or high-contrast mode run.

## Performance: measured

All timings are scripted runs of the source tree on a local static server on one laptop. They are not field data and not a Core Web Vitals measurement.

- Landing to skill page, three selections: about 1 s.
- Landing to a previewed worksheet (Create): 0.3 to 0.7 s.
- Standard worksheet opens in the builder: 0.2 to 0.4 s.
- **Lab shell weight:** the shell import map lists every `src/**/*.js` module, so the 34 new modules add about 0.5 KB gzip. `validate-language-page-performance` measured 29.8 KB against a ratchet of 29.3; the ratchet was raised once to 29.8 with a note in `data/language-page-perf-budget.json` and needs owner review (see `deployment-readiness.md`). Consolidating files would save about 0.16 KB and break the file-size cap. No stylesheet or module preload was added to the shell.
- **Studio payload** (loaded on Studio routes only; sizes are the static files, gzip -9):

| Part | Files | Raw KB | Gzip KB |
| --- | --- | --- | --- |
| Core (model, language, roles, navigator, search, store, content, merge, visuals, kit) | 10 | 225 | 70 |
| Export (html, docx, pptx, print, raster, index) | 6 | 115 | 37 |
| Problem families (60, four grade bands) | 5 | 974 | 238 |
| Engines | 4 | 202 | 57 |
| Manipulatives | 4 | 134 | 42 |
| Games | 1 | 101 | 29 |
| Views | 3 | 77 | 23 |
| Styles | 7 | 50 | 14 |
| Skill content, grades 1 to 8 | 8 | 1546 | 370 |

Skill content is one JSON file per grade. A teacher who opens one grade fetches one file plus the index and progressions (12 KB gzip), not all eight.
