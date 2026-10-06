# Grade 6 Fluency & Readiness

## Access and purpose

In Teacher view, use the Fluency & Readiness shortcut in Curriculum Hub. For a specific lesson, open Teach today, select the lesson, then choose Fluency & readiness or Fluency student practice. The separate Grades 1–8 Math Fluency Lab at `/math/fluency-lab/` is a different product and runtime.

- Teacher guide: `/curriculum/fluency/teacher/`, behind the existing teacher access gate.
- Public student practice: `/curriculum/fluency/`.
- Unit worksheets and teacher keys: `/curriculum/fluency/teacher/printables/`.

The guide covers 54 district lessons in Units 2–9: 216 foundation tasks, 162 A/B/C checks, 54 extensions, 54 partner activities, and 12 core-skill drills. Units 1 and 10 and other unsupported lesson IDs do not receive a fluency link. Lesson 2-6 is whole-number division, matching the site's lesson manifest.

Student lesson launchers now open **Lesson workshop (8 tasks)**. Each of the 54 workshops includes a learning objective, a labeled model with equivalent text, a distinct three-step worked example, two guided tasks, four independent tasks, error analysis and contextual transfer: **432 additional tasks**. The first six tasks use objective numeric, choice, comparison, ratio or coordinate checking; the final two ask for self-reviewed reasoning. Guided responses are recorded as supported work. Models include data displays, ratio counters, fraction groups, percent grids, area diagrams, foldable prism and pyramid nets, signed number lines, coordinates, inequalities and balanced equations. Conversions include length, mass, capacity and supplied approximate rates.

Build foundations (4 tasks), Connect & apply (8), and Extend & explain (4) remain available with all their original content. Existing foundation links still work. Focused practice supports typed reasoning, optional sketches, two strategy hints, worked examples, reflection, a set summary and a local work download. Six investigations address statistics, ratios, fractions, perpendicular height, coordinates and equations through predictions, manipulable models and explanations.

The checker distinguishes correct answers entered independently, answers checked with support and self-reviewed reasoning. Viewing an example does not finish a task. The parser preserves signs, order, requested fraction/decimal/percent forms and the requested ratio scale; it does not execute expressions. These are practice records, not grades or evidence of mastery by themselves.

## Data, recovery and sharing

The public edition is generated from an allowlisted subset of the lesson data. Teacher diagnostics, reteach scripts, error tables and teacher-key screens stay out of that edition. Worked practice answers are intentionally available for learner comparison.

Practice and investigation work use bounded, versioned `sessionStorage` (`fluency.v4.practice` and `fluency.v4.labs`) so work can survive a refresh in the same tab. Storage is not an account or a durable backup. The interface warns when storage is blocked or a session is too large; oversized existing work is retained rather than silently overwritten. “Clear this set” affects the selected practice set, not other lessons. Download work before closing a shared-device session or when saving is unavailable. Keep names and personal information out of responses.

There is no new server submission, roster, analytics, Canvas grade passback or save-code synchronization. Copying a student link shares lesson/tier/investigation selection, not the learner's responses. Hosted teacher builds use `studentPath: '../'` and `pdfPath: 'printables/'`; Desktop builds can supply sibling-file paths. Existing `mode=practice` and `mode=worksheet` links remain supported.

## Source and rebuild

Maintain sources under `tools/fluency-guide/src/`; do not edit generated hosted HTML alone.

- `data/curriculum.core.json`: lesson titles, prerequisite skills, check A, diagnostics and spine relationships.
- `data/practice.json`: the 216 foundation tasks and explanations.
- `data/enrich-unit-*.json`: B/C checks, vocabulary, extensions and teacher supports.
- `data/enrich-spine.json`: core-skill drills and progression notes.
- `studio.js`, `studio.css`, `labs.css`: the shared studio, strict checker, hints, investigations, sketch/export and print behavior.
- `workshop-bank.mjs`: deterministic authoring for all 54 additional workshops, with inspectable quantities and build-time validation.
- `models.js`, `workshop.css`: local SVG/semantic-table models, text equivalents, instructional presentation and print layout.
- `app.js`, both HTML templates, `styles.css`, `teacher.css`: teacher navigation and edition presentation.

```sh
node tools/fluency-guide/build.mjs --check
node tools/fluency-guide/build.mjs
node tools/fluency-readiness.test.mjs
node --test tools/fluency-guide/math-audit.test.cjs tools/fluency-guide/state-audit.test.cjs
node --test tools/fluency-guide/workshop-audit.test.mjs
```

The public allowlist intentionally includes `workshop`, with its learner examples and comparison answers. Teacher diagnostics remain excluded. The teacher's standalone student HTML export embeds both the public workshop bank and the model library; it works without a server.

Printing the workshop produces a nine-page booklet: one model/example/vocabulary page followed by one task per page with substantial workspace. A separate worked key contains the eight practice solutions. Existing core unit PDFs are unchanged. Run `npm run validate:fluency-workshops-browser` to verify the workshop browser flows. The audit starts and closes its own loopback-only server on an available port; `FLUENCY_PREVIEW_URL` can select an existing local preview instead. This command is wired into the full validation gate. The audit checks all 54 lessons at three viewport widths, submits all 432 tasks through DOM events, inspects SVG bounds, samples axe accessibility in both themes, verifies recovery/export, and renders every student booklet to check actual pagination. Screenshots, PDF packets and the JSON report remain local under `output/playwright/`; offline HTML export checks use a temporary directory outside the site tree.

The generator writes the teacher and student pages. The Vite build copies the committed pages and PDFs to `dist`; no additional runtime dependency or deployment service is required. `assets/curriculum-fluency.js` and `data/fluency-resources.json` retain the 54 known lesson mappings. Run the repository's route/auth/link checks, `npm run validate` and `npm run build` before release. `npm run validate:fluency` checks the separate Grades 1–8 lab, so it does not replace these guide tests.

## Rebuild printable packets

Run after rebuilding the HTML:

```sh
node tools/fluency-guide/generate-pdfs.mjs
```

This explicit maintenance command uses existing Playwright Chromium and Poppler (`pdfinfo` and `pdftotext`). It opens the generated local teacher page and uses the same public print methods as the interface. No native print dialog, server or external service is needed.

The command stages all 17 packets under `.qa-logs/fluency-pdfs/`, checks expected page counts and student/key separation, then replaces the existing filenames only after every packet passes. The eight core-level unit worksheet packets contain 108 pages, their separate teacher keys contain 108 pages, and the student core-skill drill packet contains 12 pages: **228 pages total**. PDF structure tags are requested, but tagging alone does not certify PDF accessibility.

PDF creation timestamps and browser-version metadata can differ across runs. Generate only when source, layout or an intentional artifact refresh requires it; tests and normal builds must not rewrite PDFs. Validate text, page counts and rendered pages rather than expecting byte-identical metadata. Render representative pages with `pdftoppm`, especially long answers and changed geometry/statistics tasks. Do not publish clipping, blank pages, missing glyphs or mixed student/key packets.

## Review evidence and release boundaries

The October 2026 content review read all 216 foundation prompt/answer/explanation triples, 54 check-A pairs, 108 variants, 54 extensions and 72 drill items. Sixteen corrective field edits repaired a geometrically impossible prism net, unsupported range/IQR conclusions, pyramid face wording, ambiguous unit-line indexing, unstated ratio/table assumptions and an estimation example. This is AI-assisted mathematical review, not independent human subject-matter certification.

The regression suites cover answer forms, adversarial literals, ratio scale, list order, self-review refusal, targeted hints, malformed routes, saved-state recovery and exported sketches. The October 4 hosted-route browser review passed 22 scenarios, including all 162 lesson/tier configurations, keyboard navigation, 320/390/768/1440-pixel layouts, refresh recovery, downloads, copied student links, local-file access, printing and a WebKit mobile smoke test. Automated accessibility scans found no WCAG A/AA-tagged violations in 19 sampled light/dark states, including all six investigations. All 17 committed PDFs (228 pages) match the structurally checked packets; 26 rendered page samples were visually inspected. These are sampled visual and automated checks, not exhaustive accessibility certification. Live signed-out authentication responses still require deployment-time verification; local route classification is covered by the regression tests.

Use the repository's reviewed-commit ship workflow and explicit deploy approval. This feature does not change authentication, production storage or the site's assessment/save-resume contracts.
