# Units 2–9 resource review — 2026-10-02

## Scope and result

Reviewed generator contracts and resource coverage across all **72 canonical/flagship lessons in Units 2–9**. Implemented durable repairs to the student handout and full printable packet. Regenerated **84 handouts and 84 full packets** because these shared generators also own Units 1 and 10. Final independent review also led to six explicitly authorized `studentPrint`-only config edits for 6-5/6-6 and their two group variants. Teacher answer-key routes, handwritten pages, SCORM contracts, and student save stores were preserved.

This is a complete static task-contract sweep with sampled visual inspection, not a claim that every page of every DOCX/PDF/slide has been visually proofread. The parent audit covers lesson content and other generated/download resources separately.

## Findings repaired

| Original defect | Observed target scope | Repair |
| --- | --- | --- |
| Sort renderer read `items` and object categories while lessons authored `cards` and string categories | 20 full-packet tasks | Both authoring shapes render complete, deterministically shuffled banks and named response boxes. |
| Table renderer ignored `headers`/array rows and independently blanked only the final object value | 66 full-packet standard tables; all 161 tables in the three practice bands/Explore checked | Uses the existing interactive `normalizeFillTable` contract. Every editable work cell stays blank, including intermediate steps. Spanish metadata and figure metadata cannot shift columns. |
| Handout preview printed a stem without essential task payload | Among 288 preview tasks: 51 tables, 25 matching-game, 10 sorts, 5 coordinate grids, 5 number lines, 2 bar models, 1 balance task | Both resource generators now use one answer-free task renderer. Matching retains the complete choice bank; multiple-choice includes reasoning space. |
| Coordinate grids placed dark axes on the minimum bounds | 6 signed full-packet grids | Axes cross zero; all named ordered pairs appear as givens, with unplotted student grids and clear ranges/labels. |
| Inequality number-line arrays ignored; range/items variants ignored | 3 full-packet inequality sets, plus solve-first decimal Explore | One blank line per authored inequality; finite-range checks; `range`/`items` support; solve-first results remain hidden. |
| Bar-model label could disclose a solved comparison instead of presenting the question | Authored bar-model variants | Prefer question/instructions, draw authored equal-piece bars, and use a drawing workspace when `parts` contain solved quantities. |
| Full packets omitted Notice & Wonder visuals | All 72 local visual files exist | Include the authored image with alt text and print sizing; the paper task now includes the same source visual. |
| Fixed print button could cover heading; handout vocabulary fragmented at mobile width | Rendered samples | Flowing Back/Print toolbar, semantic main, focus outline, responsive sections, explicit vocabulary column proportions, print page margins and retained work space. |

## Changed sources

- `scripts/lib/student-print-tasks.mjs`: shared task renderer, engine table normalization, deterministic matching/sort order, escaped task text, graph geometry, response space, shared task styles.
- `scripts/generate-handout-html.mjs`: shared renderer integration, accessible toolbar, readable responsive document, print rules, optional existing `NEFT_LESSON_SCOPE` helper, template trailing-whitespace removal.
- `scripts/generate-printable-lesson.mjs`: shared renderer integration, authored Notice/Wonder image, semantic main/toolbar, print bounds and pagination.
- `tools/student-print-tasks.test.mjs`: fixture regressions and exhaustive static Units 2–9 task-contract sweep.
- `lessons/*/handout.html`, `lessons/*/printable.html`: regenerated core outputs through `writeGenerated`, retaining injected support/save-resume/workbench layers.

## Verification evidence

Passed:

- `node tools/student-print-tasks.test.mjs`: **72 lessons, 1,165 tasks across 13 task types, 161 normalized tables**, plus focused tests for escaping, key suppression, solve-first values, signed axes, inequality sets, both sort formats and deterministic output.
- `node scripts/generate-handout-html.mjs --check`: **84 handouts** fresh at the checked point.
- `node scripts/validate-printables-fresh.mjs`: **84 packets** fresh at the checked point.
- `node scripts/lib/preserve-injected.test.mjs` and `node tools/generators-preserve-injected.test.mjs`: injected-layer preservation checks pass.
- `node tools/validate-generator-safety.mjs`: 373 generators scanned; 128 artifact references resolve; no dangling generator routes.
- `node tools/validate-support-equivalence.mjs`: 1,590 configurations compared across three surfaces; declared differences only.
- `node tools/validate-student-supports.mjs` and `node tools/validate-worksheet-audience.mjs`: pass; 1,100 student worksheets have no inlined keys.
- Node syntax checks and scoped `git diff --check`: pass.
- Browser: **32 combinations** = lessons 2-1, 3-5, 4-1, 5-6, 6-1, 7-6, 8-5, 9-2 × handout/full packet × 390px/1366px. No horizontal overflow, empty sort headings, or duplicate/missing main landmark. Final 390px handout vocabulary measures **16px text**, 113px/218px columns, no overflow.
- Six final PDFs generated and sampled pages visually inspected: Notice/Wonder figure, standard table, fraction bar, signed coordinate grid, inequality lines, and handout pages. No observed clipping/overlap in those samples; PDF text scan found no sampled page ending with an orphan section heading.

Browser initially reported an existing `/favicon.ico` 404; no resource script failure was observed. The injected Save/Resume and Math Workbench controls remain functional. On small resource screens their actions now flow after the document, preventing the original floating stack from covering the reading column; opening the Save/Resume panel was verified after this CSS-only adjustment.

## Local review artifacts

Artifacts are local QA output under `.qa-logs/publisher-artifacts/output/playwright/resource-review/` (not production downloads):

- `2-1-mobile-final.png`: final full mobile handout.
- `7-6-desktop.png`: desktop packet capture before final Notice/Wonder image addition.
- `2-1-handout.pdf`, `3-5-printable.pdf`, `5-6-printable.pdf`, `6-1-printable.pdf`, `7-6-printable.pdf`, `8-5-printable.pdf`: final layout samples.
- `3-5-notice-review.png`, `3-5-printable-review.png`, `6-1-printable-review.png`, `7-6-printable-review.png`, `8-5-printable-review.png`: rasterized PDF samples.
- `check.cjs`, `final-visual.cjs`: repeatable browser sampling scripts using the local server on port 4186.

## Handoff and remaining limits

The content teammate corrected a final independent source issue: named number-line locations in 7-2/7-3/7-4 omitted their given values; 6-2 contained corrupted fraction labels, and several number lines used unreachable snap values. **After that source freeze, both generators and both freshness checks were rerun successfully.** The shared renderer intentionally does not print target values indiscriminately, because many are answers students must calculate. Repeat generation if any further config edits occur. PDF samples precede this final number-line content-only refresh; final static task-contract and freshness checks include it.

No full visual sweep of all 168 generated resources was performed. The test is exhaustive for the 1,165 task inputs, while browser/PDF inspection is sampled as named above. Notes, homework, downloadable DOCX/PDF files, and authored lesson variants are outside this workstream's edited ownership and are handled by the parent/team audit. No push or deployment performed.

## Independent review repairs and final verification

The first structural test sweep did not prove that all printed tasks contained the right givens or withheld every answer. Independent QA identified seven concrete renderer/content defects. Those findings led to these completed repairs:

- An explicit validated `studentPrint` source contract selects the complete student prompt, optional directions, given coordinate points versus derivation tasks, workspace model, and optional matching pairs. Source authors reviewed **43 task copies / 25 canonical tasks**. Legacy solution-bearing label/instruction text cannot reappear after an explicit override.
- Container dimensions, total face areas, and other original givens remain visible in 5-5/5-6/5-7/5-8/5-10. Scalar balance equations and four response lines appear; worked scalar answers stay out.
- The 7-8 coordinate list gives all five actual points and omits quadrant answers. The 7-9 reflection tasks print only original coordinates and reflection instructions; derived coordinates stay out.
- All **29 nested `categories[].items` tasks** now supply their complete banks. Nested single-category ordering tasks get numbered response lines. Flat one-category tasks are not misclassified as ordering. The six reviewed pairs in each of 6-5/6-6 print in real shuffled matching columns, with the completed arrows removed.
- Known unequal bars retain their numerical proportions (including the exact 6:4 ratio in 7-6). Unknown editable bar values do not determine visible segment widths; these tasks receive drawing space instead.
- The 8-3 quotient and 7-2 comparison use explicit safe prompts. 2-6 includes a blank long-division frame for 2,184 ÷ 14, and 8-1 asks for a written balance model rather than dragging nonexistent tokens.

The strengthened test now contains concrete expected givens and forbidden answers for the reviewed lessons, including exact nested bank sizes/content and 6:4 geometry. Final checks passed: renderer test (1,165 tasks/161 tables), handout freshness (84), packet freshness (84), and scoped diff check. The source and generated output are frozen after these checks.

Additional final browser review covered **14 width/page combinations**: 5-6, 7-8, 7-9, 6-5, 6-6, 2-6, 8-1 at 390px and 1366px, all without horizontal overflow. At 390px the preserved Save/Resume controls sit below `main`, and their panel opens correctly. Post-review task screenshots and freshly rendered PDF samples were visually inspected for 5-6/7-8/7-9.

Final artifacts: `.qa-logs/publisher-artifacts/output/playwright/resource-review/5-6-post-qa.pdf`, `7-8-post-qa.pdf`, `7-9-post-qa.pdf`, corresponding `*-post-qa-task.png` and `*-post-qa-pdf.png` images, `2-1-mobile-post-qa.png`, and repeatable `qa-repairs.cjs` browser checks. Earlier artifacts remain for comparison and are labeled by their earlier generation time in this report.
