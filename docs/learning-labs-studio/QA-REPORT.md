# QA report: Learning Labs studio layer (2026-11-13)

Results of checks that were run. Nothing here claims human review, certified accessibility or learning gains.

## Results

| Check                                                           | Result                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validate:learning-labs`                                        | PASS: 46 labs, 84 lessons, 1,426 practice items, 414 game goals, 20 independent math fixtures, 500 property checks                                                                                                                                                                                 |
| `tools/learning-labs-bridge.test.mjs`                           | PASS: 5,172,297 checks. 21 Bridges over their whole input domains with independent integer oracles; Spanish-twin gate for every declared and generated string; exact-fraction properties; additive Recorder contract |
| `tools/verify-learning-labs-bridge-browser.mjs`                 | PASS: 21 labs; 42 ideas tested behind a prediction; 35 model restores; keyboard path, reload persistence, phone width, axe (0 violations), Predict-bar recording without a Bridge, older-save compatibility |
| `validate:learning-labs-browser`                                | PASS, exit 0: 46 labs / 276 tabs / 138 levels / 508 answers / 138 puzzle rounds / 46 matching games / 84 curriculum links; no browser errors |
| `validate:studio-lab-browser`                                   | PASS: 144 pages, 144 lab items, 144 written items, 144 missions, 144 axe scans clear (the practice studios import `model.mjs`, which gained `set()`)                                                                                                                                               |
| the six existing `tools/learning-labs-*.test.mjs`               | PASS                                                                                                                                                                                                                                                                                               |
| `check` (Biome)                                                  | FAIL: 4 diagnostics in three untouched files: `scripts/generate-homework-html.mjs`, `tools/homework-family-experience.test.mjs`, `tools/family-studio-picture.test.mjs`                                                                                                                          |
| `validate:js-syntax`, `validate:gate-coverage`                   | PASS: 5,259 script files and 8,102 inline blocks parse; 225 validator files covered (169 gated, 56 reasoned exemptions, 0 dark)                                                                                                                                                                |
| First-screen audit, 46 labs                                     | This slice: Chromebook first control **45 → 46 of 46** (Wrap Lab fixed); phone first control **2 → 41 of 46**; phone model at least 60% visible **36 → 40 of 46** (median **68% → 78.5%**). Controls under 44px: 0; console errors: 0; horizontal overflow: 0. Evidence: `first-screen-before.*`, `first-screen-phone-final.*` |
| Touch targets                                                   | The lab's own controls under 44px: 0 of 46. (The baseline figure of 46 of 46 also counted the curriculum shell's pills; the final method counts only what the lab draws, so these two numbers are not a like-for-like drop.)                                                                       |

## Defects the new checks caught while building (all fixed)

- The "percent of the part" misconception could never fire (a smaller-than-part check ran first and the input accepted only whole numbers). Found by the property test; fixed with tenth-exact decimals and the specific check first.
- A comparison slip in the same function. Found by the same test.
- "Show this in the model" and "Back to before" set the third model control to NaN on the power, balance and triangle labs, because a bridge names two quantities and the model has three. Found by the browser suite; fixed by merging into the model's current values.
- A horizontally scrollable table panel that a keyboard could not reach (axe `scrollable-region-focusable`). Fixed with a labelled, focusable region.

## Known gaps and unresolved limitations

1. **Not delivered from the directive:** per-lab content centerpieces for 41 of 46 labs; redesigned game mechanics; the five-part rebuilt explanations; Strategy Comparator; Design Studio; Discovery Portfolio; Explored / Completed / Demonstrated progress; teacher view; publisher showcase route beyond PUBLISHER-DEMO.md. See COVERAGE.md.
2. **Bridge covers 21 of 46 labs** across ratio, percent, power, balance, area, fraction, number-line, coordinate, inequality, expression and growth models.
3. **Spanish text** is present for all 21 Bridges and the Recorder and is checked by the Bridge test and browser verifier. No native Spanish review has occurred; the translations need review by a fluent speaker.
4. **Phone:** the first control remains below the first screen in five data labs: Data Newsroom, Middle Ground, Consistency Cup, Fair Share Festival and Outlier Investigation. The full-width plot is retained on those labs.
5. **Accessibility** has been checked with axe only. Keyboard operation was tested with Playwright, not a person. No screen reader, switch device, Chromebook or real tablet was used.
6. **Performance:** LCP / INP / CLS were not measured; only load success and errors were.
7. **Main remains red** on `validate:save-resume` (missing CSS/JS refs in `learning-studios/index.html`), `audit:links` (11 unresolved `/studios/...` links in `learning-studios/index.html`), and `validate:family-print` (8 small-text findings across four part-2 PDFs: 3-4-part2, 7-6-part2, 7-7-part2 and 7-9-part2, English and Spanish). These checks were rerun on 2026-11-13. `npm run check` also reports four pre-existing Biome diagnostics in the three untouched files listed above.

## Review protocol (not yet performed)

Each reviewer works through Recipe Remix Radio, The Missing Whole Bureau and The Power Plant, Investigate stage, on a Chromebook, without a facilitator explaining the interface.

- **Grade 6 mathematics educator:** can a student say, within 10 seconds, what to do? Does each Bridge sentence, table and equation say the same thing as the model? Is each misconception response mathematically right and kind? Is anything misleading in "Test an idea" (for example the tenth-decimal whole)?
- **Accessibility reviewer:** operate every Bridge and Recorder control by keyboard and with a screen reader; read each table and the MathML fraction aloud; check focus order after "Test this idea" and "Show this in the model"; check reflow at 400% and with forced colors.
- **Multilingual learner specialist:** judge whether the Bridge sentences and explanations are accessible to WIDA levels 2–3; review the Spanish wording and recommend sentence frames.

## Pilot plan (for any claim about learning)

Measure with a small, consented class, no student names in the data: first-use task success without teacher help; independent task completion; prediction accuracy over the Recorder's log; improvement from a first attempt to a new, related problem; explanation quality against a written rubric; teacher time to adopt; accessibility barriers raised; student-reported clarity. Use the school's research approval process before collecting anything.
