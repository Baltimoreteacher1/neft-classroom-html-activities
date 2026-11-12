# Technical regression

This pass did not deploy and did not run the full `qa:loop`.

## Commands and results

| Command | Result |
| --- | --- |
| `node --test engine/core/publisher-upgrade.test.mjs` | 10 pass, 0 fail |
| `node --test engine/core/bilingual-practice.test.mjs engine/core/small-group-pathway.test.mjs` | exit 0 |
| `node --check` on `assets/ewl/lens-ratio.js`, `assets/ewl/canvas-flow.js`, `assets/studio/clarity.js`, `curriculum/map/panel.js`, `engine/core/publisher-models.js` | exit 0 |
| `node scripts/publisher-coverage.mjs` | 84 core lessons, 532 matrix rows |
| `npm run qa:fast` | not run |
| `npm run qa:loop` | not run |
| Browser play-through of the five demo routes | not run in this environment |

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

## Known limits

- Generated family `homework.html` pages were not regenerated. The new “what we are learning …” sentence lives in `scripts/lib/homework-mission.mjs` and will appear on the next homework generation.
- Practice studio HTML was not regenerated. The seven-step arc is injected at runtime by `assets/studio/clarity.js`.
- Bespoke arcade games were inventoried as reviewed-not-rebuilt.
- Lesson `6-4` objective strings were copied into generated manifests, studio pages, and some printables so those surfaces do not keep the old target. That was a string alignment, not a full curriculum rebuild.
- No axe, contrast measurement, or mobile screenshot pass was run.
