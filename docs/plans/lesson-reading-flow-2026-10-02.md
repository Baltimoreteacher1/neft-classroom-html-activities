# Simpler lesson presentation

Authorized scope: interactive curriculum lessons and small-group lessons; commit and publish through the guarded ship workflow.

Observed in production: introductory chrome filled the first Chromebook screen; warm-ups stacked four questions and a bonus; vocabulary stacked eight bilingual cards; small-group sections showed two different Next destinations.

Implementation:
- Shared current-step label with an expandable full outline.
- One warm-up question or small-group vocabulary card at a time, with Show all.
- Keep original answer nodes, grading callbacks, content, tools, and routes.
- Fold secondary introductory material and story reminders into disclosures.
- Split stacked small-group sections; show the next-part action only at the last substep.
- Restore older numeric small-group bookmarks by their previous section names.
- Drive teacher presentation through the same substep controls; preserve its progressive word reveal and teacher-note blackout.
- Reveal cards and supplementary text for printing, then restore the screen state.

Acceptance checks: answer persistence and review; old bookmark migration; uninterrupted lesson navigation; one forward destination in small groups; print visibility; teacher presentation; no horizontal overflow at 320, 768, 1024, and 1280 pixels; current task visible on desktop/Chromebook; repository validation and production build.

Coverage is shared-engine coverage plus browser samples of whole-group, Foundations, and Practice variants. It is not a claim that every authored lesson was manually reviewed.

Verification before release: production build passed; 29 Playwright checks passed against the built site (reading flow, lesson reflow, score bridge, small-group presenting); changed JavaScript lint passed. The initial standalone validation reached its render check before the concurrent first build finished; release validation runs after the build barrier. Its unit stage passed 303 scripts and explicitly skipped the clean-tree build-idempotence script because these changes were uncommitted.
