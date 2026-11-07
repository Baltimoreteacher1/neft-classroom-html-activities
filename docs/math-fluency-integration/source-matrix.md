# Curriculum to Fluency Lab: source audit checkpoint

This records inspected source, not a claim that the entire migration is complete. The Curriculum and Fluency Lab surfaces share this repository and a Vite static copy. Curriculum's Grade 6 lesson shell remains distinct from Fluency Lab's K–8 entry and persistence.

| Source | Mathematical capability | Destination decision | Remaining integration and verification |
| --- | --- | --- | --- |
| `assets/ewl/lens-ratio.js`, `lens-ratio-plane.js`, `rational.js` (Living Math Canvas) | Exact rational ratio state, tapes, double number lines, tables, coordinate plane, bilingual labels | Reuse the representation rules; adapt behind a module interface with problem context. Current Ratio Studio has an independent exact state as an initial adapter. | Consolidate the two rational implementations, connect model actions to actual Fluency problems, test both Canvas and Fluency. |
| `assets/ewl/canvas-kinds.js` | Specific additive-ratio and reversed-rate misconception feedback | Reuse diagnostic rules after evidence from construction, with ambiguous-error follow-up. | Avoid assigning a misconception from one answer. |
| `curriculum/learning-labs/ratio-table-lab/studio.mjs` | Learner-built table, plotted points, accessible cursor, local restore; uses floating tolerance | Refactor table/graph interaction to use exact rational core. | Touch and keyboard graph journeys, legacy lab regression. |
| `curriculum/learning-labs/shared/models/ratio-*.mjs` | Interactive ratio tapes, mixtures, unit-rate contexts | Reuse scenarios and interaction patterns; evaluate with exact shared state. | Test recipe, railway, mixture, and best-buy journeys in Fluency. |
| `curriculum/learning-labs/{ratio-railway,recipe-remix,best-buy-boulevard}/content.json` | Grade 6 objectives, guided examples, English/Spanish language supports | Reuse vetted task content inside Fluency skill progression. | Preserve the Curriculum lesson shell and verify new independent items. |
| `assets/studio-act/{balance,netfold,ratiomix}.js`, `assets/ewl/invariant-engine.js` | Balance, 3D net, mixture, and invariant mechanics | Audit and adapt rather than duplicate. | Bidirectional equations, geometry, and investigations remain unfinished. |
| `curriculum/math-workbench/*` | Open mathematical construction, save/export, reference tools | Preserve as open-ended source; extract only compatible controls. | Discovery Studio and problem evidence link remain unfinished. |
| `math/fluency-lab/ratio-scaler.js`, `visual-lab.js`, `e8/models-ratio-algebra.js` | Existing tape, static model views, middle-grade ratio models | Preserve current behavior; link to the new Studio during transition. | Replace the preset-only ratio scaler once problem-aware model integration is verified. |

The current Ratio Studio checkpoint supports exact 2:3 scaling, part-to-whole distinction, constructed equivalent rows, undo/redo, local resume, vocabulary images, and an independent unit-price check. It does not yet fulfill the full six-stage progression or the cross-skill and cross-platform requirements.
