# Ratio Studio implementation checkpoint

Route: `/math/fluency-lab/ratio-studio/`. Linked from the Math Fluency Lab header and its existing proportional tape tool. The route is copied by the Vite static asset plugin.

`engine.js` holds exact rational quantities and generates synchronized ratio pairs, part-to-whole comparisons, table rows, number-line positions, graph points, and B-per-A rates. The UI stores a versioned, anonymous investigation locally and supports undo, redo, reset, and resume. No responses leave the browser.

The paired-quantity graph uses a common numeric scale on both axes, with labeled ticks and explicit units; it no longer normalizes each axis independently. A zero first quantity is graphed as its paired values and identified as not defining a function of the form `y = kx`.

The page offers counter and quantity construction, editable labels and units, proportional scaling, prediction and revision, an equivalent-pair construction check, and an independent unit-price task. Students can select a plotted equivalent pair or either tick on the paired double number line by touch or keyboard to scale the connected models. Focus returns to the same representation after keyboard activation. Typed work, feedback, open supports, units, and the math-state undo history resume locally on this device. Vocabulary pop-ups reuse Fluency Lab definitions and illustrations, including the curriculum scale-factor image. The alternate `/math/fluencylab/` path redirects to the canonical route through `data/routes.json`.

Verification: `node --test math/fluency-lab/ratio-studio/engine.test.mjs`; `node math/fluency-lab/ratio-studio/studio.browser.test.mjs` checks 390px touch and 1280px desktop layouts, resume, ratio comparison choices, graph point coordinates, zero-value behavior, and Enter-key operation; `npm run build` and the Fluency Lab validator. This is an implementation checkpoint, not completion of the wider platform program. Arbitrary point creation, editable number-line construction, teacher evidence integration, cross-platform language work, and the broader K–8 model transfer remain outstanding.
