# Independent Units 2–9 review

Date: 2026-10-02. Reviewer scope: the shared student print renderer, its handout/packet generators, curriculum context generation and navigation diff, and sampled critical mathematics. This review is independent of the implementation agents' checks. The parent owns repository-wide validation, build and final regeneration. No production changes were made.

## Findings discovered in the first review

These are reproduced defects, not inferred risks. Source line references below describe the initial reviewed version; the final disposition is recorded separately below.

| ID | Severity | Evidence | Required repair |
| --- | --- | --- | --- |
| R1 | High | `scripts/lib/student-print-tasks.mjs:38` suppresses every bar-model `label`. Lesson 5-5 onLevel[2] then prints only “Each section holds how many cubic inches?” and two half labels; its 10 × 4 × 3 dimensions disappear. Lessons 5-6/5-7 lose their total surface areas 222/340, and 5-10 loses its container dimensions. | Preserve student givens using an explicit safe source contract; continue withholding worked solution labels in ratio-model variants. |
| R2 | High | `student-print-tasks.mjs:119` only reads `cards`/`items`. Twenty-nine tasks author their cards under `categories[].items`, so the renderer emits empty word banks; examples include 2-8 Explore, 2-1 onLevel[3], 5-7 onLevel[3], and 8-4 Explore. | Support both nested sorting and single-category ordering; test that the authored cards actually appear. |
| R3 | High | `student-print-tasks.mjs:258` treats any label containing `(` as coordinate data. Lesson 7-8 Explore prints “Clue A (I)” etc. without any coordinates. | Distinguish coordinates from quadrant/axis annotations; preserve all givens without displaying requested classifications. |
| R4 | High | `student-print-tasks.mjs:264` supports only balance `items`. Lesson 8-1 Explore omits the sole equation `n + 15 = 42`. Seventeen scalar balance tasks generate empty tables, without usable response workspaces. | Support scalar equations and comparisons, using unsolved expressions and response space. |
| R5 | High | Balance labels in 6-5, 6-6, 6-14 and 6-15 state equivalence/solutions above the task. Coordinate targets in 7-9 onLevel[0] reveal all reflection answers. Source instructions in 8-3 onLevel[3] include `72 ÷ 6 = 12`, and 7-2 extending[2] contains the full comparison solution. | Give student prompts an explicit source contract and withhold solved coordinates/conclusions. |
| R6 | Medium | `student-print-tasks.mjs:282` draws every bar at equal width and says “equal pieces” in its accessible description, including areas 120/60/42 in 5-6 and lengths 6/4 in 7-6. | Use mathematically faithful geometry or explicitly identified diagrams that are not to scale; retain accurate equal-piece fraction models. |
| R7 | Medium | Lesson 5-3 extending[2] asks for a trapezoid with bases 10 and 4, height 6, but its hint uses triangle formula `A = 1/2 x b x h`. Correct area is 42. | Correct source and mirrored hints to half the sum of parallel bases times height. |

The original renderer test passed despite R1–R6. In particular, its nested-card assertion compared zero emitted cards to zero top-level cards. Passing structural tests alone was insufficient evidence of answerability.

## Checks independently run

| Check | Result | Scope |
| --- | --- | --- |
| `node tools/student-print-tasks.test.mjs` | Passed initially, semantic gaps identified above | 72 base lessons, 1,165 tasks across all bands, 161 engine-normalized tables |
| `node tools/curriculum-context.test.mjs` | Passed | Source fidelity, ordered script wiring, safe local links, 209 project destinations |
| `node tools/curriculum-resource-audit.test.mjs` | Passed | Strict/scoped failures, invalid unit ranges, real inline source and empty route fixtures |
| `node scripts/audit-curriculum-resources.mjs --units 2-9 --strict --no-write` | Passed | 72 lessons; 1,303 resource records; 1,231 nonempty files/routes plus 72 inline resources; zero missing/empty |
| `node tools/number-line-curriculum.test.mjs` | Passed | 64 tasks, 121 snap targets, independently computed mean, keyboard completion and thousandths display |
| Curriculum navigation/context source review | No new blocker found | Preserved URLs, base/group fallbacks, support query propagation, history/focus code, generated config ownership; separate design-agent browser evidence is not counted as this reviewer's own execution |
| Fresh Chromium navigation via Playwright CLI | Passed | At 320 × 900, deep-linked 7-4-group1 retains Extra support and `supports=reading`; Next selects 7-5-group1; Back restores 7-4-group1. Launch/practice links carry `student=1` and the support value; no horizontal overflow and no browser console errors. |
| Independent exact arithmetic with Python `Fraction` | Passed | Histogram frequencies total 114 and 69/114 rounds to 60.5%; $302 at $15/hour takes 20 h 8 min combined or 5 h 2 min each for four people; $80/$0.75 crosses between 106 and 107 songs; three snack boxes leave ten bags of each kind; trapezoid area is 42. |
| Final `node tools/student-print-tasks.test.mjs` | Passed after repair | Expanded schema, source-given, answer-withholding and matching regressions; 72 lessons, 1,165 tasks, 161 tables |
| `node scripts/generate-handout-html.mjs --check` | Passed | All 84 generated handouts current, including shared-generator effects in Units 1 and 10 |
| `node scripts/generate-printable-lesson.mjs --check` | Passed | Zero stale packets; generator reported zero files changed |
| Independent repaired-case assertions | Passed | Four bar-model missing-given cases; four scalar solution-label cases; quadrant/coordinate distinction; withheld reflection coordinates; 6:4 proportional geometry; all 29 nested-card word banks |
| Final generated HTML assertions | Passed | 6-5/6-6 each have six separate shuffled matching rows; 8-1 has equation and four work lines; 2-6 has paper directions, blank long-division frame and work lines |

## Specialized slide output gates

The notebook-oriented G-list is distinct from generator input P1–P9. This task supplies HTML course resources, not a confirmed notebook scenario extraction. An independent static DOM scan of all 72 base HTML slide decks found every config lesson title on the first slide, at least four distinct rendered `.ref-vocab-term` entries per deck, no literal banned `#4A2580`, and every authored `launch.conceptIntro.weDo.lines` string present verbatim in slide text. A separate scan found no six-digit hex color with HSV hue 265–310° and saturation above 20% in those HTML files. These are static checks, not a claim of complete rendered-slide inspection or fidelity against unavailable publisher source decks.

The existing slide template has no semantic `footer` on its title slide and four section-divider slides per deck: 360 slides total. A closer source inspection distinguishes the visual footer on the title slide (`ref-title-footer-row`) from the four section dividers that have no footer at all: 288 dividers. This is a pre-existing G8 limitation. No blanket PASS is issued for independent/dependent-variable naming, complete table values, all equation contexts, every writing zone, or absence of all other purple shades; those require a confirmed scenario/source and/or broader rendered verification.

The implementation agent's `.qa-logs/publisher-artifacts/output/playwright/units-publisher/mobile-pathways.png` was independently viewed: the 320px layout wraps the long lesson title, presents the pressed Extra support choice distinctly, and keeps launch, practice and sequence controls legible. This is a review of an existing screenshot, not an independently executed browser session.

A subsequent fresh Chromium session independently exercised the navigation steps recorded above and captured `.qa-logs/publisher-artifacts/output/playwright/units-publisher/independent-mobile.png`. The screenshot was opened and inspected; the changed pathway and sequence controls remain readable without overlap. This is a sampled journey, not all-lesson browser coverage.

## Final disposition

**Focused change review: approved. R1–R7 repaired and independently verified. No unresolved high/medium finding from this review remains.**

| Finding | Final evidence |
| --- | --- |
| R1 | Explicit `studentPrint` prompts preserve 10 × 4 × 3, 222/120/60, 340/150/120, and 8 × 4 × 3 givens. Assertions exclude the respective numerical answers. |
| R2 | All 29 nested-card tasks emit the exact number of authored cards. Single-category nested ordering has numbered response lines; flat one-category matching in 6-5/6-6 uses explicit six-pair student matching data instead of a false ordering task. |
| R3 | 7-8 gives all five coordinate pairs and withholds quadrant classifications. Parentheses are checked as numeric coordinate pairs, not assumed to be coordinates. |
| R4 | Scalar balance tasks retain equations or explicit unsolved prompts and have work space. 8-1's printed equation is `n + 15 = 42`. |
| R5 | The inspected scalar prompts withhold their solved labels. 7-9 onLevel[0] gives only the original point and reflection instructions. 8-3's division and 7-2's comparison omit their worked answers. |
| R6 | The 7-6 model has exact 6:4 proportional widths. Unknown-value geometry tasks use labeled student drawing space. Equal-piece fraction models remain equal. |
| R7 | 5-3's trapezoid hint now uses `A = ½ × (b₁ + b₂) × h`; independent arithmetic gives 42. |

Follow-up paper directions were also repaired: 8-1 no longer asks students to drag nonexistent paper controls, and 2-6 now provides handwritten long division with an actual blank frame. These checks include the generated HTML, not only the renderer function.

Final browser samples used the available Vite server at port 4186; the earlier port 4187 server was unavailable. Independently captured and opened `independent-5-6-task-mobile.png`, `independent-7-8-task-mobile.png`, and `independent-7-9-task-desktop.png` under `.qa-logs/publisher-artifacts/output/playwright/units-publisher/`. The 5-6 and 7-8 pages have no horizontal overflow at 320px. The images show complete givens, blank model/grid spaces, no clipped task text and no revealed reflection coordinates. The final 7-9 browser session logged one missing `/favicon.ico` request and no JavaScript exception; this is separate from the successful resource rendering.

This approval covers the reviewed changes and repaired cases. It does not certify every activity's mathematical content, every PDF/DOCX page, every viewport, every classroom interaction, or publisher-source fidelity for all guided stems. Full repository validation/build and broader browser results belong to the parent report. The pre-existing G8 section-divider footer limitation and unverified specialized G-list areas described above remain explicit limitations, not hidden passes.

## Final focused addendum

The final source edits and freshness-validator repair received a separate read-only review on 2026-10-02. **No new blocker was found.**

- The 2-1 notebook definition, “A question that does not anticipate variability,” correctly states the distinguishing property. The core and generated Part 2 box-1 panels are deeply equal and both declare `authored: true`. `node scripts/generate-notebook-copy-panels.mjs --check --only 2-1` passed and explicitly preserved the authored panel. The precise longer definition also appears in the current notes, teacher notes, slides, handout and packet.
- The actual `5-3/reveal-assets/word-problem.png` was opened and inspected. The stated horizontal split gives an upper rectangle of 25 × (70 − 40) = 750 square feet and a lower trapezoid of ½ × (25 + 57 + 54) × 40 = 2,720 square feet. Independent integer arithmetic confirms 3,470 square feet and 2,411,650 cents ($24,116.50). All five 5-3 configs carry the same revised sample answer. The existing Part 2 generator carries `revealWordProblem` verbatim; its renderer reads the config and reveals this answer only in teacher mode. Its absence from student handouts is therefore expected, not stale output.
- `scripts/validate-printables-fresh.mjs` creates its workspace link inside a unique scratch directory and points it at that directory's copied engine. The copied engine's package exports support the shared renderer's `normalizeFillTable` import. This repairs package resolution without redirecting regeneration into the working tree. Syntax validation passed. The parent owns execution of the full release/freshness gate; this addendum does not claim an additional full run.
- A final static check of the two affected HTML slide decks found both lesson titles on slide 1, six distinct vocabulary entries per deck, all seven combined authored guided lines verbatim, and no literal banned `#4A2580`. Each still has four footerless section-divider slides. This does not expand the earlier approval into complete G-list, rendered-slide, or publisher-source certification.
