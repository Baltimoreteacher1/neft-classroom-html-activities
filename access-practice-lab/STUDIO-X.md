# Studio X (authoring foundations)

Studio X extends the Activity Studio (`STUDIO.md`). It adds no second editor, model or format: every module reads and
writes `lp-activity/1` and goes through `normalizeActivity` / `validateActivity`. Pure modules live in
`src/studio/x/`; editor wiring is `editor/check-panel.js` and `editor/package-download.js`.

## What exists

| Capability                                             | Module           | In the editor                                                                                        |
| ------------------------------------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------- |
| Quality inspector with safe repairs                    | `x/inspect*.js`  | **Check my work** tab: plain findings, jump to block, "Fix it for me" only for deterministic repairs |
| Complete resource package (ZIP)                        | `x/package*.js`  | Share -> **Download complete package (ZIP)**                                                         |
| Source ingestion (pasted text, structured lists, DOCX) | `x/ingest*.js`   | not wired yet                                                                                        |
| Plain-language request -> plan -> first version        | `x/intent*.js`   | not wired yet                                                                                        |
| Teacher recipes (`lp-recipe/1`)                        | `x/recipes.js`   | not wired yet                                                                                        |
| Seeded variants (numbers, order, context)              | `x/variants*.js` | not wired yet                                                                                        |
| Procedural diagrams with alt text                      | `x/diagram*.js`  | not wired yet                                                                                        |

Tests: `node --test tools/studio-x-*.test.mjs`; browser: `node tools/studio-x-e2e.mjs`.

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
- Schema allows only raster `data:` images, so inline SVG diagrams become a table plus a review note unless the
  caller supplies a publishable `src`.
- Word output is verified structurally by the existing docx tests, not opened in Microsoft Word or Google Docs here.
- Not built: animation builder, visual rules editor, simulations, mission creator, document fitting, side-by-side
  differentiation workspace, component browser. Those need the shared model extended first and are listed as follow-ups.
