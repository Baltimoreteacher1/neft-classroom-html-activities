# Studio X (authoring foundations)

Studio X extends the Activity Studio (`STUDIO.md`). It adds no second editor, model or format: every module reads and
writes `lp-activity/1` and goes through `normalizeActivity` / `validateActivity`. Pure modules live in
`src/studio/x/`; editor wiring is `editor/check-panel.js` and `editor/package-download.js`.

## What exists (all reachable from the editor or the Create panel)

| Capability | Module | Where a teacher finds it |
| --- | --- | --- |
| Quality inspector with safe repairs | `x/inspect*.js` | Editor tab **Check my work** |
| Complete resource package (ZIP) | `x/package*.js` | Share -> **Download complete package (ZIP)** |
| Describe it (plain-language request -> plan -> first version) | `x/intent*.js` | Chooser / Create panel: **Describe it** |
| Use my own material (pasted text, DOCX; PDF refused honestly) | `x/ingest*.js` | Chooser / Create panel: **Use my own material** |
| Recipes (`lp-recipe/1`, six built in) | `x/recipes.js` | Chooser / Create panel: **Start from a recipe** |
| Side-by-side versions, another version (seeded) | `x/variants*.js`, `editor/compare-*.js` | Editor tab **Versions side by side** |
| Academic language support builder | `x/language-support*.js` | Editor tab **Language support** |
| Component browser (recommended first) | `x/components*.js` | Editor tab **Add components** |
| Mission builder (7 mission types) | `x/missions*.js` | **Add components** -> Build a mission |
| `diagram` block (spec-only, redrawn everywhere) | `x/diagram*.js`, player/print/docx | Add components, or Add block -> Diagram |
| `animation` block (7 presets, step/pause/replay, reduced motion) | `x/animations*.js`, player/print/docx | Add components, or Add block -> Animation |
| Document fitting (7 goals, never below readable size) | `x/fit*.js` | Share -> **Fit to the page** |

Tests: `node --test tools/studio-x-*.test.mjs`; browser: `tools/studio-x-*-e2e.mjs`.

## Rules the modules keep

- Nothing is invented. Uncertain input becomes a `review[]` item for the teacher, never a guess.
- No paid runtime service, no network. Requests that cannot be met reliably return choices, not a pretend result.
- Teacher-only content (answer keys, notes) goes only under `teacher/` in a package and never into student files.
- Variants never claim assessment equivalence (`equivalence: "not-claimed"`).
- Every teacher-facing string is `{en, es}`; the Spanish has not had native review.

## Fixed along the way

- The standalone HTML export of a **worksheet** embedded the answer key in its JSON (`export/html.js` stripped notes only).
  It now uses the same `studentCopyFor` the server publishes; the module moved to `src/studio/core/student-copy.js`
  so there is one implementation.

## Honest limits

- PDF input is refused with an explanation (no PDF reader is installed or added). Paste the text or use DOCX.
- Interactive HTML pages check answers in the browser, so those files contain the answers; the manifest says so.
- Word output has no drawn figure for `diagram` / `animation` blocks (the docx package needs a PNG fallback and the Pages
  Function cannot rasterize); Word gets the alt text, a real data table and captions. The printable version has the figure.
- Not built: a visual "when this, then that" rules editor, free-form simulations, maps, flip cards, voice recording,
  scroll-free jumping between mission stages (students move forward one question at a time).
- Page counts in the Fit panel come from a browser measurement; the print dialog's count is the final word.
- Word output is verified structurally by the docx tests, not opened in Microsoft Word or Google Docs here.
- All Spanish is unreviewed by a native speaker.
