# Ratio Studio implementation checkpoint

Route: `/math/fluency-lab/ratio-studio/`. Linked from the Math Fluency Lab header and its existing proportional tape tool. The route is copied by the Vite static asset plugin.

`engine.js` holds exact rational quantities and generates synchronized ratio pairs, part-to-whole comparisons, table rows, number-line positions, graph points, and B-per-A rates. The UI stores a versioned, anonymous investigation locally and supports undo, redo, reset, and resume. No responses leave the browser.

The page offers counter and quantity construction, proportional scaling, prediction and revision, an equivalent-pair construction check, and an independent unit-price task. Students can select a plotted equivalent pair by touch or keyboard to scale the connected models. Typed work, feedback, open supports, and the math-state undo history resume locally on this device. Vocabulary pop-ups reuse Fluency Lab definitions and illustrations, including the curriculum scale-factor image. The alternate `/math/fluencylab/` path redirects to the canonical route through `data/routes.json`.

Verification: `node --test math/fluency-lab/ratio-studio/engine.test.mjs`; local Chromium checks at 390px touch and 1280px desktop widths for resume, ratio comparison choices, and graph manipulation, including Enter-key operation; `vite build` and dist route check. This is an implementation checkpoint, not completion of the wider platform program. Arbitrary point creation, editable number-line construction, teacher evidence integration, cross-platform language work, and the broader K–8 model transfer remain outstanding.
