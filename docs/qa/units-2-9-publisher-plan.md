# Units 2–9 publisher review

Base: `f5fb2bde42d933634ef6393c30ebf3e129856c14`, verified against the public production build stamp on 2026-10-02. Work is isolated on `feat/curriculum-units-2-9-publisher`.

## Scope and acceptance criteria

- Inventory every resource listed for all 72 canonical lessons in Units 2–9; identify variants separately.
- Audit mathematical correctness, standards/content alignment, student instructions, printable fidelity, resource discovery, keyboard/mobile usability, local links, and existing integration contracts.
- Fix demonstrated defects in their source generators or authored configs; preserve authored content, lesson IDs, grading, save/resume, and protected teacher resources.
- Verify new behavior with regression checks and browser/rendered-output inspection. Report automated, sampled, and manual coverage separately; passing file checks do not certify every instructional item.
- Produce a reviewable local change set and a concise audit report. No push or production deployment in this task without explicit deployment approval.

## Team ownership

1. Lesson content: Units 2–9 configs, mathematical/editorial corrections, content review.
2. Resource quality: handout/printable generators, shared static task rendering, regenerated resources, render inspection.
3. Curriculum design: unit/lesson/pathway navigation, search-result actions, responsive and keyboard verification.
4. Integration: curriculum enrichment mapping freshness, reproducible resource audit, combined build/checks and final coverage report.

## Baseline findings

- All 84 canonical lesson entry pages render; this is a boot check, not a complete interaction walkthrough.
- Existing local-link audit resolves 46,629 unique links across 5,082 HTML files.
- All target-unit manifest resources exist. The full-course resource inventory separately flags 24 missing MSTAR entries in Units 1 and 10.
- Static real-world snippets and bonus labels retain earlier lesson numbering, causing wrong-topic recommendations and false search matches.
- Printable tasks can lose sorting cards/table context and can expose prefilled answers; signed coordinate grids need correct zero axes.
- Mathematical explanations include qualitative defects not detectable by the existing arithmetic-only checks.

## Verification plan

Run targeted new regressions, resource inventory, mathematical/Spanish/content checks, curriculum navigation browser tests, PDF/render inspection, all-lesson boot checks, `npm run validate`, and `npm run build`. Record failures and environmental limits accurately; repair regressions caused by this work.
