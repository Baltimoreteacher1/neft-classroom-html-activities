# Games as model: is the mechanic the mathematics? (2026-10-16)

Scope: every equation, balance, ratio and coordinate "game" Joel named, plus the unit game folders, the
arcade catalog and Review Expeditions. Read with `tools/validate-game-rules.mjs` and
`data/product-decisions.json`. Evidence is file and line in this worktree (branch `feat/award-gold-wave`,
cut from `origin/main` aa873132f0) on 2026-10-16. One candidate was upgraded to gold: see section 4.

## 1. The test

A game is a **model** when the only moves it offers are the legal moves of the mathematics, and the
consequence of a wrong move is the mathematics' own consequence. It is a **quiz in disguise** when the
mathematical answer is picked or typed once and everything else (running, flying, lives, scenery) is
a wrapper. Five checks, each yes or no:

| #   | Check                                                                                                         | Why it matters here                                         |
| --- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | Legal moves only: the student cannot do something the mathematics forbids (one side only, divide by 0)        | the move set IS the idea of equality                        |
| 2   | The student supplies every value the model uses                                                               | `fluency-models-student-enters-the-math` (Joel, 2026-10-09) |
| 3   | A wrong move fails the way the structure fails (the beam tips, the move is refused), not with a score penalty | the consequence teaches; a life lost does not               |
| 4   | No answer or running total is handed over (hint ladder: method, then a concrete step)                         | `games-no-giveaways` (Joel, 2026-07-04)                     |
| 5   | The model's own state is true (a "balanced" scale is balanced)                                                | a lying model teaches the lie                               |

## 2. Verdicts

| Candidate                                                                       | Verdict                                                  | Strongest evidence                                                                       | Recommendation                                                                   |
| ------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `algebra-balance-scale/` (before this wave)                                     | Model by buttons, contradicted by its own physics        | 6 fixed buttons, no typed value; x weighs 4 on every quest, so 2 of 3 solved states tilt | **Rebuilt as Balance Builder** (section 4)                                       |
| `mad-balance-sandbox/`                                                          | **Model** (mean as the balance point), with one giveaway | real torque, pivot slider; `Auto-Balance` snaps to the mean                              | Keep. Earn or remove Auto-Balance                                                |
| `math/games/u7-equation-quest/` Bridgekeepers expedition                        | **Model**, the strongest existing                        | op + amount + target pan; one-sided moves tip the beam                                   | Keep. Align tags, let students type amounts                                      |
| `engine/components/equation-balance-lab.js`                                     | **Model** that computes the work for the student         | real both-sides algebra with a typed amount                                              | Keep for lessons. Port the typed-result turn when engine files can be web-served |
| `math/unit-8/game-equations-quest/`                                             | Model-lite with a life penalty                           | `-1` and `÷ groups` only; a legal move costs a life                                      | Superseded by Balance Builder                                                    |
| `cartesian-odyssey/`                                                            | Instruction-following sandbox                            | validators compare to the coordinates written in the prompt                              | Rewrite missions as relationships; ladder the mission 3 hint                     |
| `double-line-racer/`                                                            | **Not a model** (copy the target)                        | two independent sliders; target printed in the quest text                                | Rebuild on the both-rows move (next flagship candidate)                          |
| `engine/components/balance-scale.js`                                            | **Quiz in disguise** with decorative buttons             | the four operation buttons never change the equation                                     | Replace with equation-balance-lab or the Balance Builder core                    |
| `math/fluency-lab/balance-game.js`                                              | Partial: missing-addend drill                            | four tiles + decoys; the beam hints direction                                            | Keep as a drill, not as a flagship                                               |
| `curriculum/review-expeditions/`                                                | **Quiz in disguise** (theme only)                        | traversal board over multiple-choice generators                                          | Keep as review; it is not a model                                                |
| `curriculum/arcade/`                                                            | Not a game (catalog page)                                | 671 lines of cards                                                                       | Registration surface only                                                        |
| `math/unit-6/games/`, `math/unit-8/games/` (expression-engine, equation-escape) | **Quiz in disguise**                                     | multiple choice + lives + 50/50 eliminate                                                | Convert to the both-sides / build-the-expression move set                        |
| `math/unit-2/games/`, `unit-5`, `unit-9`, `unit-10`                             | Model-leaning (slice, size, plot, build)                 | student sets a dimension, a cut or a point                                               | Audit the live readouts for computed partial results                             |

## 3. Evidence by candidate

### algebra-balance-scale (before)

- Operations were six fixed buttons, `Add 1 / Sub 1 / Add 5 / Sub 5 / Mult 2 / Div 2 / Mult 3 / Div 3`
  (old `index.html` 631-649). A student never typed a value, and `Sub 3` on `x + 8 = 20` did not exist.
- `CONFIG.quests` had three equations, all `ax + b = c` (695-697). Solved meant the state equalled the
  stored `target` (931-932).
- The physics contradicted the algebra. Every `x` weighed 4 (`wLeft = leftX * 4 + leftC`, 1074-1075 and
  1101-1105). Quest 1 (`x = 4`) ends balanced by coincidence; quest 2 ends at `x = 3`, 4 vs 3, **tilting**;
  quest 3 ends at `x = 5`, 4 vs 5, tilting. The status pill read `TILTING` on a solved equation (1078).
- A refused move (`Sub 5` with 3 units, `Div 3` on `2x`) wrote only to a hidden Diagnostics log (898, 916).
  The student saw nothing.
- The "3D deck" (drag to rotate, 604, 948) carried no mathematics.
- Checks 1 yes, 2 no, 3 partly, 4 yes (no hints at all), 5 **no**.

### mad-balance-sandbox

- Real structure: torque is `sum(x_i - pivotX)` and the beam is level when the pivot sits at the mean
  (`calculateStatistics`, 975-1006). Mean-as-fulcrum is the right model for 6.DS.
- Giveaways: `autoBalancePivot` snaps the pivot to the mean (1078-1090); mean and MAD are computed and
  displayed (975-1006); quests print the target ("Mean = 12", `checkQuests` 1152-1206).
- Checks 1 yes, 2 partly, 3 yes, 4 no, 5 yes.

### math/games/u7-equation-quest (Bridgekeepers expedition and legacy arcade)

- `expedition-math.js` `applyOp` (56-97): operation, amount 1-20 and a target of both, left or right pan.
  A one-sided move leaves the scale tipped; impossible moves (`split`, `negRight`, `tooMany`, 84-95) are
  refused and never counted as a miss. `judgeScale` (108-119) names `oneSide`, `sameOp`, `wrongOp`.
  Inequalities use keystones and weight gates (`genStones`, `genGate`).
- Gaps: the amount is a `+`/`-` stepper (`bumpAmount`, `expedition-missions.js` 129-135), the engine
  computes each new equation, `genScale` (25-43) is one-step only (no two-step, no x on both sides), and
  the board is a Phaser canvas.
- The tags are game-local keys (`oneSide`, `sameOp`, `flipped`, `endpoint`, ..., `expedition.js` 189-) that
  `expedition-engine.js` 903 passes to `NTSignal.record({ misconceptionTag })`. None exist in
  `data/misconception-labels.json`, so the heatmap cannot label them.
- The legacy arcade page prints a correct value after two misses: `"A number that works: " + right.opt.label`
  (`index.html` 1377-1382). `SOLUTION_ON_MISS` does not see it (it matches two shapes only).
- Checks 1 yes, 2 no, 3 yes, 4 mostly (arcade page no), 5 yes.

### engine/components/equation-balance-lab.js

- Both-sides algebra on `a*x + b` states with a typed amount (`OPS` 116-122, `doOp` 413-433). The best
  symbolic engine in the repo. It is the oracle for this wave's tests.
- It computes the new equation after every move and draws it (`history.push`, 417), and `describeProgress`
  (155-190) tells the student whether the move was "closer". Pressing Enter in the amount box runs
  Subtract (457-460), a move the student did not choose. No hint ladder, no misconception tag, no
  save/resume. Spanish strings are being added in this wave (`lab-strings-es.js`); verify at integration.
- Checks 1 yes, 2 no (amount only), 3 partly, 4 partly, 5 yes.

### engine/components/balance-scale.js

- The four buttons only append text (`steps.push(...)`, 221) and run a random wobble (`animateTilt`, 224).
  The equation never changes. The answer is a typed value compared to the authored one (361). The
  hints array advances one per miss (381-382), which is correct, but the buttons imply a function they do
  not have.
- Checks 1 n/a, 2 yes, 3 no, 4 yes, 5 yes (nothing to contradict).

### double-line-racer

- Two independent range sliders for distance and time (727, 736). Solved is `distVal === targetD &&
timeVal === targetT` (959). The quest text gives the target: "(Requires D=9, T=6)" (783-784).
- A double number line has one legal move, scale both rows by the same factor. This page allows any pair.
- Checks 1 no, 2 yes, 3 no, 4 no, 5 yes.

### cartesian-odyssey

- Mission validators compare points to coordinates written in the prompt: "Move Point A to (-4, 5)"
  (`quests` 1263-1316). Mission 3 hints the answer outright: "Try width 5 and height 3: 5 + 5 + 3 + 3 = 16"
  (1296).
- Checks 1 yes, 2 yes, 3 partly, 4 no, 5 yes.

### math/fluency-lab/balance-game.js

- `a + ? = total` with four tiles and decoys (`balanceRound`, 13-30). The beam leans after every try
  (64-66), so the game can be solved by elimination. Stars come from the miss count (10).
- Structure is the missing addend, interaction is multiple choice with a direction signal.

### curriculum/review-expeditions and curriculum/arcade

- `voyage.js` states it plainly: "Math stays in each game's existing checked content engine" (line 1).
  World 8 "The Balance Keepers" is a traversal board (13). The u8 pack's `makeEq` (12) is a sound
  generator behind `shuffleOptions` multiple choice (159, 272).
- `curriculum/arcade/index.html` is the catalog page (cards for the Phaser games). It is a registration
  surface, not a mechanic.

### unit game folders (`math/unit-N/games/`)

- Multiple choice with lives: `unit6-expression-engine` (options and `removedChoices`, 21 hits) and
  `unit7-equation-escape` (`genQuestions` 340-383, lives 1416).
- Model-leaning: `unit2-fraction-foundry` (partition 973), `unit2-fraction-kitchen` ("No timing", 126),
  `unit5-area-architect` ("instead of picking one of four answers", 317; the "Live formula readout", 1761,
  may compute for the student, so check 2 needs a read), `unit9-variable-velocity` (plot 267, 1000),
  `unit10-volume-vault` (set the edges, 630).
- `unit4-discount-dash` and `unit3-ratio-rally` are choose-a-lane / choose-an-option.
- `math/unit-8/game-equations-quest`: real both-sides moves, but two buttons only, 5 or 3 lives
  (`loseLife`, 730-737), the method tip printed up front (`loadRound`, 664-682), and a penalty for a
  legal move that does not help (`opSub` 739-757).

### The cabinets `math/games/u*`

`docs/superpowers/specs/2026-06-29-games-math-mechanic-redesign-design.md` already records that the arcade
games "collapse to ~4 reskinned mechanics" and are "multiple-choice-in-costume". That spec lists balance
scale as the intended u7 mechanic, which is what Bridgekeepers and Balance Builder now deliver.

## 4. What was built: Balance Builder (`/algebra-balance-scale/`)

Chosen because it is the one balance page with no mechanic worth keeping, so a rebuild loses nothing,
and because the engine already contains the correct model to test against. Same route, same folder.

| Requirement                          | How it is met                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mechanic is the structure            | The only move is "do this to BOTH sides" with +, -, x or divide by a positive amount (`balance-model.js` `applyMove`). No one-sided move exists. x-terms are movable, so x on both sides is legal.                                                                                                                                                                                                                                                 |
| Student types every value            | After a move the sides are written out unsimplified (`2x + 3 - 3                                                                                                                                                                                                                                                                                                                                                                                   | 11 - 3`); the student types each simplified side and, in the tilt level, the symbol. The model checks, never fills in. |
| Levels                               | 1 One step (Unit 8, 8-2/8-3, 6.AT.8), 2 Two steps and 3 x on both sides (**stretch**, Grade 7 content, never gating), 4 Tilt (8-4 to 8-6, 6.AT.9). All open from the start.                                                                                                                                                                                                                                                                        |
| Inequalities as tilt                 | The beam leans by the symbol; legal moves keep the lean; a typed test value shows which pan is lower; the answer is graphed with an open or closed circle and a direction.                                                                                                                                                                                                                                                                         |
| Untimed                              | No clock API in any file (`game-contract.test.mjs`).                                                                                                                                                                                                                                                                                                                                                                                               |
| No worked solution on a miss         | A miss names the side that is off, the tilt direction, and a coaching sentence. Hints unlock after a try, method first, concrete move second. A test proves no hint mentions a number that is not already on screen.                                                                                                                                                                                                                               |
| Misconception chip                   | Seven existing tags (`equation-not-inverse-operation`, `equation-answered-with-given-number`, `algebra-distributive-partial`, `sign-dropped`, `inequality-direction-flipped`, `inequality-boundary-inclusion`, `inequality-graph-direction`). Labels (EN and ES) are read from `data/misconception-labels.json`. A tag is reported only when exactly one prediction fits, the rule `engine/core/misconceptions.js` uses. No new tags (test).       |
| Save/resume                          | `NeftSaveResume` provider/restorer; moves are replayed, not stored as pictures. Verified through the real autosave and reload path.                                                                                                                                                                                                                                                                                                                |
| Keyboard, touch, screen reader, calm | Native radios, buttons and inputs; focus moves to the next thing to do; two polite live regions; 44px targets (spec); `studio-reduced-motion` and the OS preference both stop the one animation.                                                                                                                                                                                                                                                   |
| EN / ES                              | `nt-lang` and `ewl:lang`; every string has a sibling and the same placeholders (test).                                                                                                                                                                                                                                                                                                                                                             |
| Level editor                         | Numbers, one letter and one symbol from fixed lists. The validator guarantees exactly one whole-number answer (or an integer boundary), rates difficulty from solution length plus features, and **says yes or no, never the value**, so it cannot be used as a solver. A puzzle is shareable only after its maker solves it. Saved on the device; shared as a 9-character code (45 bits, 8-bit check, any single mistyped character is rejected). |

Teacher-safe: the editor and the code carry no free text. The paste field accepts only the code alphabet.

## 5. Gate findings (report only; `tools/validate-game-rules.mjs` is not owned here)

1. The gate sweeps `GAME_DIRS`, `math/unit-N/games/` and `missionDirs()`. It does not include
   `algebra-balance-scale`, `mad-balance-sandbox`, `cartesian-odyssey`, `double-line-racer`, or any
   `math/unit-N/<slug>/` game page. Running the real `scan()` over the unlisted pages finds **14 real
   violations**: HUB_LINK (`href="/math/games/"`) in 12 pages (`math/unit-1/6-ns-b-2game`, `6-ns-b-3game`,
   `unit-2/6-ns-a-1game`, `unit-4/6-rp-a-2game`, `6-rp-a-3game`, `unit-8/game-equations-quest`,
   `unit-9/6-ee-9gamereview`, `6-ee-c-9martiangame`, `6-ee-c-9variablevelocitygame`,
   `cloudflare-pages-game-for-6-ee-9`, `game-variable-voyage`, `variablecomparisongame`) and COUNTDOWN in 2
   (`unit-7/6-ns-c-5game` `timeLeft`; `unit-9/6-ee-c-9game` `countdown`). The page list is a name
   heuristic over `math/unit-*/*/index.html`, so it may be incomplete.
2. All three detectors pass on every candidate in section 2. They check what a game must not print.
   They cannot say whether a game is a model; this audit is that judgment.
3. `SOLUTION_ON_MISS` is two regexes. `u7-equation-quest/index.html` 1377-1382 and `cartesian-odyssey` 1296
   print an answer and pass.
4. Balance Builder: `scan()` run over every file in the folder, with zero findings (asserted by
   `algebra-balance-scale/game-contract.test.mjs`). Adding `"algebra-balance-scale"` to `GAME_DIRS`
   would make the gate itself enforce it.

## 6. Registration (nothing edited; each needs the integrator)

The route does not change, so `data/public-route-contract.json`, `data/routes.json` and `_redirects` are
untouched. `data/launch-manifest.json` lists lessons only, so a game does not register there.

| File                                                                                                                  | Change                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data/catalog.json`, `data/registry.json`, `sitemap.xml`                                                              | Regenerate (`npm run generate-catalog`, `generate-registry`, `generate-sitemap`). The page title is now "Balance Builder \| Algebra Balance Scale". `validate:catalog` is already stale on this branch for four unrelated paths. |
| `tools/scorm/activity-catalog.json`                                                                                   | Entry `algebra-balance-scale` is titled "Algebra Balance Scale", grade `completion`. Decide the title; `NeftScore` also posts a result, so `score` may fit.                                                                      |
| `teacher-tools/canvas-studio/library.json`, `teacher-tools/teaching-evidence/coverage.json`                           | Title strings still say "Algebra Balance Scale \| Solve Equations Visually".                                                                                                                                                     |
| `data/asset-concept-map.json`, `data/content-graph.json`, `data/_tagging/merged.json`, `functions/_lib/plan-vocab.js` | Generated from the catalog; regenerate (`npm run generate-plan-vocab`).                                                                                                                                                          |
| `engine/core/concept-tool.js`                                                                                         | Optional: label the `algebra-balance-scale` kind "Balance Builder".                                                                                                                                                              |
| `data/font-bundles.json`                                                                                              | The "why" note lists this page under `outfit-plus-jakarta-sans-ffc08d`; it now uses `...-f764d6` (Lexend). Informational; regenerate with `tools/self-host-fonts.mjs`.                                                           |
| `tools/validate-game-rules.mjs`                                                                                       | Add `algebra-balance-scale` to `GAME_DIRS` (section 5).                                                                                                                                                                          |
| `scripts/qa-run.mjs` COVERAGE                                                                                         | `algebra-balance-scale/**` has no rule, so it escalates to the full gate. Suggested rule: `test`, `validate:game-rules`, `validate:save-resume`, `validate:js-syntax`, `check`.                                                  |
| `data/test-reads.json`                                                                                                | Run `npm run test:reads` after the five new test files. Until then they always run.                                                                                                                                              |
| Lesson surfaces                                                                                                       | Optional product decision: link Balance Builder from lessons 8-2 to 8-6 (the bonus map is generated by `scripts/generate-lesson-bonus-map.mjs`).                                                                                 |

## 7. Open decisions for Joel

- Levels 2 and 3 are Grade 7 content (two-step, x on both sides). They are labelled "Stretch", open from
  the start and never count toward on-grade evidence (`NeftScore` and `NTSignal` standards are recorded for
  levels 1 and 4 only). Keep, or hide them behind a teacher setting?
- The shared site chrome (`nt-chrome.js`) adds Home and Find pills at runtime on every page including games.
  `games-self-contained` is enforced on page source only, and the shared toolbar in `assets/game-studio.js`
  currently carries no "back to games" exit. Decide whether that exit should return.
- `assets/game-studio.js` `relabel()` does not refresh the toolbar badge when the language changes
  (the badge keeps the title it was mounted with). Small, shared, not owned here.
- Bridgekeepers' local misconception tags (section 3) should be mapped onto the shared taxonomy so the
  heatmap can show them.
