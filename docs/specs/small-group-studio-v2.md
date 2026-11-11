# Small-group Studio 2.0 — architecture (2026-11-11)

One shell renders all 204 small-group studios (Group 1 Foundations, Group 2 Challenge,
catch-up) and their Practice Sets. This records what the 2026-11-11 rebuild changed and
where each rule lives, so nothing is restated twice.

## Flow — `engine/core/small-group-pathway.js` (single source)

Launch & Notice → Build Understanding → Solve Together → Your Turn → Prove It, 17–19 minutes
(minutes per stage and variant are data in that file; the tab rail, Teacher View and tests
read it). Stage ids are the saved tab ids already on student devices (`sg-tab-words`,
`-learn`, `-together`, `-own`, `-check`); the retired `sg-tab-apply` restores onto Prove It
through `LEGACY_TAB`. Apply and Challenge now sit inside Prove It.

| Stage               | Content                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Launch & Notice     | `small-group-launch.js`: the lesson's own notice/wonder image and starters; key words                                                       |
| Build Understanding | Build section (data/small-group-build) + **Move the model** (`createBuildModel`)                                                            |
| Solve Together      | guided problems; Group 2 adds the conjecture and strategy-comparison cards                                                                  |
| Your Turn           | four problems + "More practice", one at a time, with manipulatives                                                                          |
| Prove It            | independent first-try check (no manipulative, no hints before the first answer), Group 2 error analysis, Apply, Challenge, evidence summary |

## One task at a time — `small-group-task-stepper.js`

`taskStepper(cards, {store, key})` shows a single card, a numbered rail and an obvious
forward button; cards stay in the DOM (hidden) so restore, tallies and print work; the
index is saved as `<key>-i`.

## Manipulatives — `small-group-manipulatives.js` (+ `-plane.js`)

Eleven tools keyed by the figure `kind` the lesson already draws: number line, tape/fraction
bar, 10×10 percent grid, dot plot, equation balance, area and box builders, double number
line (for ratio tables), coordinate plane, factor tree. Tools open on a NEUTRAL board and
read out only what the student built (never a giveaway). Pointer, keyboard and plain
buttons all work — nothing is drag-only. Prove It cards never get one.

## Feedback loop — `small-group-feedback.js`

Attempt → **Diagnose** (`diagnoseAnswer` names the likely move: added, subtracted, swapped
ratio order, sign, place value, copied a given — never the answer) → **Explain** (what will
you change?) → **Revise** → new attempt (the next problem; Prove It for the final proof).
Hints are a three-stage ladder (hint, first move, worked steps). Each card records
`-sup` = `independent | coached | shown` and `-dx` (diagnosis); the evidence summary
(`small-group-evidence-summary.js`) and the Teacher View read those, and the next-step
decision counts **independent work only**.

## Group 2 investigation — `data/small-group-investigations/`

See `small-group-investigations-v1.md`. Units 1 and 10 are not taught and have none.

## Teacher View — `small-group-teacher-view.js`

One docked button and a side drawer, mounted only after the teacher route is confirmed. It
absorbed the studio guide, rhythm coach, misconception card and evidence console that used
to stack above the first task. `.sg-tv` is in Present Mode's blackout list.

## Look — `assets/small-group-designsystem.css` (bottom block)

Cobalt, teal, coral, amber, navy, and **iris** for the violet role: `validate:palette`
forbids hue 255–335 on lessons, so true violet cannot ship; iris is hue 232. Gradients are
confined to the active stage, the rail dot and the model workspace; shadows stay hairline
(`sweep:small-group` budgets). Practice Sets get the same skin on screen only
(`SG_PRACTICE_PREMIUM_CSS`), leaving the paper print layout untouched.

## Store — `small-group-state.js`

Writes are debounced 200 ms for typing and now flushed on `pagehide` /
`visibilitychange`, so a reload straight after an answer keeps it.

## Verification

`npm run verify:small-group-studio` (ledger, 204 routes × 4 viewports),
`npm run validate:small-group-investigations`, `node --test engine/core/small-group-*.test.mjs`.
