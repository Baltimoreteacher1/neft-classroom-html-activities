# EduWonderLab Units 2–9: audit and upgrade

Date: October 2, 2026. Work is isolated on `feat/curriculum-units-2-9-publisher`, based on `f5fb2bde42d933634ef6393c30ebf3e129856c14`, the public production build verified at the start of this task. No push or deployment has been performed.

## Scope

The team reviewed all **72 canonical lessons**, **251 related configurations**, and **1,303 listed resources** in Units 2–9. Every canonical exit ticket and Apply problem/model answer was read. Mathematical, editorial, printable, navigation, accessibility, and engineering reviews were divided among independent workstreams, followed by a separate QA review.

| Unit | Lessons | Listed resources |
| --- | ---: | ---: |
| 2 | 12 | 215 |
| 3 | 10 | 185 |
| 4 | 5 | 89 |
| 5 | 10 | 185 |
| 6 | 15 | 275 |
| 7 | 9 | 160 |
| 8 | 7 | 126 |
| 9 | 4 | 68 |
| **Total** | **72** | **1,303** |

All listed resources resolve to 1,231 nonempty local files/routes and 72 source-backed inline exit tickets. Existence checks do not establish mathematical or visual correctness; those reviews are described separately below.

## What changed

### Mathematics and lesson directions

Corrections span **145 configurations: 44 canonical lessons and 101 related copies**. They include statistical-question definitions, grouped histogram interpretation, median language, box-plot readings, exact inequality boundaries, percent conversions, volume data sufficiency, trapezoid formulas, geometric assumptions, time and purchasing calculations, and meaningful contextual domains. Spanish counterparts were corrected where their mathematical meaning changed.

All 64 number-line tasks were reviewed. The intended mean is now 19.2 rather than 20, quarter/decimal values can be entered using the authored increments, and the shared component displays and announces thousandths accurately. Regression checks exercise actual keyboard placement of 0.375. Existing lesson IDs, standards, item counts, answer indices, and array lengths were preserved.

### Printed resources and downloads

A shared student-task renderer now preserves table givens, sorting cards, matching banks, scalar equations, inequalities, graph ranges, and writing space. Signed grids cross at zero. Explicit paper metadata separates given coordinates and dimensions from values students must calculate. Worked answers are withheld from solve-first directions. Bar diagrams use faithful proportions where those proportions are given, and open model workspaces where drawing the solved model would reveal the answer.

Both shared generators refresh **84 handouts and 84 full packets**, including Units 1 and 10 because they use the same templates. Full packets include authored Notice & Wonder visuals. Flowing toolbars, semantic main regions, keyboard focus styling, readable mobile columns, and print margins improve usability. Corrected lesson sources are also propagated to notes, slide HTML, support pages, worksheets, small-group practice, and relevant student/teacher DOCX and PDF downloads. The vocabulary bank and 166 homework pages carry the corrected shared definitions; notebook copy panels and second-session copies retain the same meaning.

### Finding the right lesson

The unit browser now offers explicit **Lesson / Extra support / Challenge** choices. Next and Previous retain the selected pathway; search results link directly to lessons and their exact support choices. Reading-support and student-mode parameters survive navigation. Practice uses the actual available worksheet, including second-session resources where appropriate.

Real-world examples and project recommendations now derive from current lesson configs. This removes obsolete numbering that had paired Statistics with fraction-division content and Inequalities with histogram activities. The build regenerates this metadata, and source-fidelity tests prevent it from drifting again.

### Engineering and regression protection

The resource auditor supports scoped strict checks, inspects real inline source, detects empty route entries, and clearly distinguishes file inventory from link validation. New regression tests cover resource-audit failures, context generation, number-line precision and keyboard completion, printed-task contracts, and responsive pathway/search journeys. Existing routing, teacher-resource protection, save/resume, SCORM, and injected classroom tools remain under the repository's validation gates.

## Verification and limits

| Check | Result and coverage |
| --- | --- |
| Production build | Passed; Vite output and generated curriculum resources produced successfully. |
| Full repository release gate | `npm run qa:fast` passed 118/118 checks on the settled worktree, including build, tests, syntax, curriculum validation, and browser smoke checks. Earlier failures were repaired rather than waived. |
| Clean-commit build check | All 31 build steps executed; each left tracked source unchanged. |
| Mathematical checks | Full fleet: 5,276 checks passed, 645 undecidable cases skipped. Focus-unit counts and manual review are detailed below. |
| Generated-source fidelity | All gated notes, slides, homework, worksheets, practice, MSTAR and printable outputs match their source configs. Both notebook panels have valid source provenance; second-session generation is current. |
| Strict resource inventory | 72 lessons, 1,303 resource records; zero missing or empty resources in Units 2–9. |
| Printed-task regressions | 1,165 tasks across all 72 focus lessons; 161 normalized tables; explicit assertions for complete givens and withheld solutions. |
| Number-line regressions | 64 tasks, 121 snap targets, independently calculated mean, actual keyboard completion and displayed/spoken 0.375. |
| Built-site lesson entry | All 84 canonical entry pages render. This is a boot check, not a full interaction sweep. |
| Built-site navigation | Nine Playwright tests passed again on the final delivery build (18.7 seconds), including pathway continuity, exact deep links, search, support parameters and accessibility at 320/768/1440px. |
| Taught lesson sequence | Eight-unit browser walkthrough passed: 2-7, 3-6, 4-2, 5-3, 6-1, 7-4, 8-4 and 9-3. Forward navigation follows the authored sequence and terminates correctly. |
| Binary integrity | All 275 changed PDFs parse with nonzero page counts; all 352 changed DOCX files pass ZIP CRC and required XML checks. Final re-exports were rechecked. |
| Visual inspection | Resource review covers 32 initial and 14 final width/page combinations, repaired PDF examples, two rendered DOCX samples, and desktop/mobile navigation screenshots. |
| Independent review | Seven reproduced defects repaired and independently verified; no remaining new high/medium issue in the reviewed changes. |

Implementation is committed locally as `f3b714c9b8` on `feat/curriculum-units-2-9-publisher`. The full gate log is `.qa-logs/publisher-release-gate.log`; clean-build evidence is `.qa-logs/publisher-clean-build.log`. The final delivery build and browser logs are `.qa-logs/publisher-delivery-build.log` and `.qa-logs/publisher-delivery-browser.log`. The unit suite passed 300 scripts during pre-commit; its one clean-tree-only test then passed separately with all 31 build steps checked. The explicitly opt-in `workbench-live-runtime` test, which requires separate services, was not run. Test fixtures are isolated from site discovery, the printable validator resolves the copied engine workspace, and formatting/import checks are retained. The final built site was checked to exclude `output`, `tmp`, `.playwright-cli` and `.qa-logs` review/scratch directories.

### Integration with original Reveal downloads

The local release candidate was integrated on top of `ece8810f6f`, which includes the original Reveal Word/PDF files from `9d2a10322c` and the later family-homework changes. The combined download manifest contains 5,346 resources: 2,981 files, 916 links, and 1,449 SCORM entries. The original-document test confirms byte-for-byte integrity, lesson placement, and teacher access for all 569 imported files. Download, curriculum-link, printable-freshness, and family-page validators passed. The production build passed, and all nine curriculum Chromium tests passed on the combined tree; the Unit 2 browser check also confirms that teacher-only document links stay hidden in the public unit browser.

The merged homework regression locates the statistical-question table by its warm-up content rather than a problem number; revised wording changes the deterministic ordering. All nine homework-family tests pass, including six blank response inputs and three self-review explanations.

Coverage is deliberately bounded:

- Exact-arithmetic validation proves 4,438 checks in the focus configurations and skips 599 undecidable cases. Unit 7 has no decidable checks in that arithmetic validator; human reading, number-line checks, and browser tests provide separate evidence.
- Every canonical exit ticket and Apply answer was read, but only six referenced source figures were visually verified. This is not a complete comparison against every publisher source deck.
- Printed-task contract tests cover 1,165 task inputs and 161 normalized tables. Browser and rendered PDF/DOCX inspection is sampled; not every page of every binary document was visually proofread.
- Accessibility scans cover changed navigation controls and result grids at 320, 768, and 1440px. They are not a full-site accessibility certification or testing with assistive-technology users.
- All 72 HTML slide decks passed static checks for lesson title, vocabulary, and authored worked lines. The existing template still lacks footers on 288 section-divider slides; no complete rendered-slide certification is claimed.
- The full-course inventory separately identifies 24 missing MSTAR resources in Units 1 and 10, outside this audit's focus. Units 2–9 have no missing or empty listed resources.

## Detailed evidence

- [Content and mathematical review](units-2-9-content-review.md)
- [Printed resource review](units-2-9-resource-review.md)
- [Navigation and responsive design review](units-2-9-design-review.md)
- [Independent QA findings and disposition](units-2-9-independent-review.md)
- [Scope and acceptance criteria](units-2-9-publisher-plan.md)

Local screenshot/PDF evidence is under `.qa-logs/publisher-artifacts/output/playwright/units-publisher/`, `.qa-logs/publisher-artifacts/output/playwright/resource-review/`, and `.qa-logs/publisher-artifacts/output/publisher-documents/`. These are retained local review artifacts, excluded from the publishable site. Additional integrity reports are under `.qa-logs/publisher-artifacts/reports/`. These artifact paths refer to the original `curriculum-units-2-9-publisher` worktree. The release worktree retains its integration and shipping logs under `.qa-logs/`; publication is verified separately through the live build stamp.
