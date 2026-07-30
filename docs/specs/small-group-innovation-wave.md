# Small-group innovation wave — what shipped, what to kill, when to revert

Eight waves preceded this one (Studio 3.0 → 5.1, Award Waves 1–4, the depth wave).
Every one of them shipped, was declared LIVE with a commit SHA, and stated no
success criterion. Nothing in the system described what it would look like if a
feature were **not** working, which means nothing has ever been removed on
evidence — only on Joel noticing something in a live review.

This document is the correction. Each item below carries the number that would make
us take it out.

## What shipped

| Thesis                       | Change                                                          | Where                                                              |
| ---------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------ |
| Name the error               | 20-entry misconception taxonomy + arithmetic detectors          | `engine/core/small-group-misconceptions.js`                        |
| Widen the assessable surface | Reasoning reader on written responses                           | `functions/api/reasoning/`, `engine/core/small-group-reasoning.js` |
| Make the group real          | Shared table: code, seats, private commits, simultaneous reveal | `functions/api/sg-room/`, `engine/core/small-group-room.js`        |
| Fleet, not files             | Whole-fleet eval treating the generator as the artifact         | `tools/eval-small-group-fleet.mjs`                                 |
| Build the controller         | Next-move recommendation from class evidence                    | `/api/progress/next-move`, `assets/curriculum-next-move.js`        |
| Measure the 15 minutes       | Tab-arrival + seconds-to-first-problem instrumentation          | `engine/core/small-group-reach.js`                                 |
| State the epistemics         | Policy + audit of every asserting surface                       | `docs/specs/epistemic-policy.md`                                   |
| Invest in re-entry           | Catch-up hint repair; visuals already open for catch-up         | `lessons/*-catchup`, `tools/lib/small-group-parallel-practice.mjs` |

Level 2 visual gating (thesis: "differentiation is inverted") was **already fixed**
on `main` in `aa344a65a` before this wave: catch-up gets open models, Level 2 gets
the same verified models behind a "Check my model" gate. No change needed.

## Revert criteria

Read these at the next review. If a number is met, remove the feature — the point
of writing them down in advance is that the decision is not relitigated later.

**Shared table (`sg-room`)**

- Revert if, after four weeks of availability, fewer than **20%** of small-group
  sessions in a section ever open or join a table. A collaboration feature nobody
  uses is worse than none, because it occupies hero space.
- Revert if median seats per table is **< 2** — that means students are opening
  tables and working alone anyway, and the reveal gate never fires.

**Reasoning reader**

- Revert if the answer-leak guard fires on more than **2%** of reviews. That would
  mean the model is routinely trying to give the answer away and the prompt is not
  holding.
- Revert if fewer than **15%** of students who write a response ever press the
  button. An unpressed button is surface, and surface costs minutes.

**Next Move card**

- Revert if `confidence: "good"` (≥8 reporting devices) is reached in fewer than
  **half** of sections after a month. A recommendation that is permanently
  thin-evidence is a permanently misleading recommendation.

**Misconception detector**

- Revert (or retune) if the detector names a misconception on fewer than **10%** of
  wrong answers. Below that it is decoration, not signal.
- Investigate immediately if it names one on more than **70%** — that would suggest
  the single-match rule has been loosened and it is now guessing.

**Reach instrumentation**

- This one does not get reverted; it gets **acted on**. If under 60% of reporting
  devices ever reach the practice check, the next wave deletes sections instead of
  adding them. The `pacing` field on `/api/progress/next-move` surfaces exactly
  this.

**Fleet eval**

- Never revert. Loosen a detector only with a self-test case proving the loosening
  was intentional.

## Kill list

Named honestly, including the ones deliberately **not** done in this wave.

**Killed here**

- The three-voice simulated consensus board when a real table exists — replaced,
  not layered.
- The canned skeptic when a real dissenting seat exists.
- The give-away third hint in `makeItem` (the template said "never the answer" and
  did the opposite for every LCM/GCF item).

**Should be killed, not done here, with the reason**

- **The second renderer.** `lesson-renderer.js` and `small-group-renderer.js` are
  maintained in parallel; every wave ships twice and parity is repeatedly deferred
  (LEVEL_VOICE and the celebration layer were explicitly declined for the 64
  launchers). This is the single largest source of drift in the engine. Not done
  here because a big-bang merge of two live renderers during a wave that already
  touches both is how a site goes dark; it needs its own change with its own
  browser-verification pass.
- **`termVi` / `termAr` config fields.** Dead since the languages were cut to
  EN/ES. Removing them touches 128 generated configs for zero behaviour change;
  worth folding into the next scheduled regeneration, not a standalone diff.
- **The passport/XP layer.** Suspected surface-without-effect, but there is now an
  instrument that can settle it (reach + completion by tab). Measure first, then
  delete on evidence rather than on suspicion — which is the whole point of this
  document.

## Open item carried forward

`/teacher-tools/mastery/` and `/api/progress/small-group-summary` now receive the
`reported` coverage marker but do not display it. Until they do, a `0` there is
still ambiguous between "nobody understood" and "nobody reported". Recorded in
`docs/specs/epistemic-policy.md` as the one known open violation.
