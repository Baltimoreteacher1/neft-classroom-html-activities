# QA report: Learning Labs studio layer (2026-11-13)

Results of checks that were run. Nothing here claims human review, certified accessibility or learning gains.

## Results

| Check                                                           | Result                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validate:learning-labs`                                        | PASS: 46 labs, 84 lessons, 1,426 practice items, 414 game goals, 20 independent math fixtures, 500 property checks                                                                                                                                                                                 |
| `tools/learning-labs-bridge.test.mjs`                           | PASS: 44,735 checks. Five bridges over their whole input domains with independent integer oracles (ratio 12×12 × all ideas, percent 100×120, power 4×5, balance 12×60, triangle 12×12×20); exact-fraction properties; Recorder saved-state contract (older and malformed saves, cap, ids, compare) |
| `tools/verify-learning-labs-bridge-browser.mjs`                 | PASS: 5 labs; 10 ideas tested behind a prediction; model restore; reload persistence; keyboard path; no sideways scroll at 390px; axe WCAG 2.2 AA with no serious or critical issue; Predict-bar recording on a lab with no bridge; an older save loads and keeps its work                         |
| `validate:learning-labs-browser` (existing sweep)               | PASS, exit 0                                                                                                                                                                                                                                                                                       |
| `validate:studio-lab-browser`                                   | PASS: 144 pages, 144 lab items, 144 written items, 144 missions, 144 axe scans clear (the practice studios import `model.mjs`, which gained `set()`)                                                                                                                                               |
| the six existing `tools/learning-labs-*.test.mjs`               | PASS                                                                                                                                                                                                                                                                                               |
| `check` (Biome), `validate:js-syntax`, `validate:gate-coverage` | PASS                                                                                                                                                                                                                                                                                               |
| First-screen audit, 46 labs                                     | Chromebook: first control on first screen **0 → 45 of 46**; model top median **1,654 → 489px**; words above model median **145 → 35**. Phone: first control on first screen 0 → 2 of 46; model at least 60% visible in 36 of 46. Console errors 0; horizontal overflow 0                           |
| Touch targets                                                   | The lab's own controls under 44px: 0 of 46. (The baseline figure of 46 of 46 also counted the curriculum shell's pills; the final method counts only what the lab draws, so these two numbers are not a like-for-like drop.)                                                                       |

## Defects the new checks caught while building (all fixed)

- The "percent of the part" misconception could never fire (a smaller-than-part check ran first and the input accepted only whole numbers). Found by the property test; fixed with tenth-exact decimals and the specific check first.
- A comparison slip in the same function. Found by the same test.
- "Show this in the model" and "Back to before" set the third model control to NaN on the power, balance and triangle labs, because a bridge names two quantities and the model has three. Found by the browser suite; fixed by merging into the model's current values.
- A horizontally scrollable table panel that a keyboard could not reach (axe `scrollable-region-focusable`). Fixed with a labelled, focusable region.

## Known gaps and unresolved limitations

1. **Not delivered from the directive:** per-lab content centerpieces for 41 of 46 labs; redesigned game mechanics; the five-part rebuilt explanations; Strategy Comparator; Design Studio; Discovery Portfolio; Explored / Completed / Demonstrated progress; teacher view; publisher showcase route beyond PUBLISHER-DEMO.md. See COVERAGE.md.
2. **Bridge covers 5 of 46 labs** (the five exemplars): Recipe Remix Radio, The Missing Whole Bureau, The Power Plant, The Balance Bureau, Shape-Shift Garden.
3. **English only** for the Bridge and Recorder.
4. **Phone:** the first control is below the first screen in 44 of 46 labs.
5. **Accessibility** has been checked with axe only. Keyboard operation was tested with Playwright, not a person. No screen reader, switch device, Chromebook or real tablet was used.
6. **Performance:** LCP / INP / CLS were not measured; only load success and errors were.
7. **Main is red** on gates unrelated to the labs (`validate:save-resume`, `audit:links` on `learning-studios/index.html`; `validate:family-print` on four part-2 PDFs). The three lab commits were made with `--no-verify` at Joel's instruction and the lab-relevant checks above were run by hand.

## Review protocol (not yet performed)

Each reviewer works through Recipe Remix Radio, The Missing Whole Bureau and The Power Plant, Investigate stage, on a Chromebook, without a facilitator explaining the interface.

- **Grade 6 mathematics educator:** can a student say, within 10 seconds, what to do? Does each Bridge sentence, table and equation say the same thing as the model? Is each misconception response mathematically right and kind? Is anything misleading in "Test an idea" (for example the tenth-decimal whole)?
- **Accessibility reviewer:** operate every Bridge and Recorder control by keyboard and with a screen reader; read each table and the MathML fraction aloud; check focus order after "Test this idea" and "Show this in the model"; check reflow at 400% and with forced colors.
- **Multilingual learner specialist:** judge whether the Bridge sentences and explanations are accessible to WIDA levels 2–3; list which phrases need a Spanish version and a sentence frame.

## Pilot plan (for any claim about learning)

Measure with a small, consented class, no student names in the data: first-use task success without teacher help; independent task completion; prediction accuracy over the Recorder's log; improvement from a first attempt to a new, related problem; explanation quality against a written rubric; teacher time to adopt; accessibility barriers raised; student-reported clarity. Use the school's research approval process before collecting anything.
