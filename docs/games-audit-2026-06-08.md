# Math Games Audit — 2026-06-08

**Scope:** all 28 `*game*` folders (the 2D/Phaser + DOM games; the `games/3d/`
WebGL set was overhauled separately on 2026-06-04).

**Bar applied** (educational-game-design + senior-eng lens): a _real game_ makes
**the math the mechanic** — the player manipulates a visual model (build, pour,
sort, aim, balance, plot, navigate) and the math is enforced by the interaction
and visual state, **not** by clicking A/B/C/D. Theming (sprites, HP bars, bosses,
particles) that only reacts _after_ a multiple-choice answer is decoration, not
gameplay.

## Verdicts

| Game                                                                   | Standard   | Verdict             | Core issue                                                                                |
| ---------------------------------------------------------------------- | ---------- | ------------------- | ----------------------------------------------------------------------------------------- |
| ratios-proportions/6-rp-1game (Ratio Kitchen)                          | 6.RP.A.1   | QUIZ_WRAPPER        | pick A/B/C/D; kitchen is cosmetic                                                         |
| ratios-proportions/6-rp-a-2game (Unit Rate Factory)                    | 6.RP.A.2   | QUIZ_WRAPPER        | boss HP = relabeled progress bar                                                          |
| ratios-proportions/6-rp-a-3game (Shopping Mall Tycoon)                 | 6.RP.A.3   | QUIZ_WRAPPER        | no economy; **answer-key bugs** (mapScale string-concat; bestBuy "same" mismarked)        |
| unit-1/6-1game (Fraction Dungeon)                                      | 6.NS.A.1   | QUIZ_WRAPPER        | binary monster HP; **orphaned data.js/engine.js stack**                                   |
| number-system/6-ns-a-1game (Underwater)                                | 6.NS.A.1   | HYBRID→wrapper      | collision-select MCQ; math precomputed                                                    |
| number-system/6-ns-b-2game (Asteroid Miner)                            | 6.NS.B.2   | QUIZ_WRAPPER        | fly-into-the-answer                                                                       |
| number-system/6-ns-b-3game (Cooking Sim)                               | 6.NS.B.3   | QUIZ_WRAPPER        | **load-time ReferenceError + student-exposed teacher password**                           |
| number-system/6-ns-b-4game (Treasure Hunter)                           | 6.NS.B.4   | HYBRID              | real explorer wrapping GCF/LCM MCQ                                                        |
| number-system/6-ns-c-3game (Number Line Jumper)                        | 6.NS.C.3   | HYBRID              | real platformer + end-of-level MCQ                                                        |
| number-system/6-ns-c-5game (Temperature)                               | 6.NS.C.5   | HYBRID              | real signed-temp sim; **mode select is dead**                                             |
| number-system/6-ns-c-6game (Coordinate Hunt)                           | 6.NS.C.6   | HYBRID (best nav)   | navigation = plotting; bonus MCQ; announces target coords                                 |
| number-system/6-ns-c-8game (City Builder)                              | 6.NS.C.8   | HYBRID (build≈REAL) | click-the-cell plotting is real; distance MCQ                                             |
| expressions-equations/6-ee-9gamereview (Tower Defense)                 | 6.EE.C.9   | QUIZ_WRAPPER        | TD runs itself; equation = tower purchase                                                 |
| expressions-equations/6-ee-c-9game (Variable Blaster)                  | 6.EE.C.9   | **REAL_GAME**       | shoot the correct asteroid under aim+time pressure                                        |
| expressions-equations/6-ee-c-9martiangame (Mars Rover)                 | 6.EE.C.9   | QUIZ_WRAPPER        | gate=door; **correct:0 never shuffled**                                                   |
| expressions-equations/6-ee-c-9variablevelocitygame (Racing)            | 6.EE.C.9   | QUIZ_WRAPPER        | **lane steering does nothing**; correct:0; dup choice bug                                 |
| expressions-equations/cloudflare-pages-game-for-6-ee-9 (Equation Leap) | 6.EE       | HYBRID→real         | fetch the matching solution gem past decoys                                               |
| expressions-equations/variablecomparisongame (Expression Arena)        | 6.EE       | QUIZ_WRAPPER        | polished <,=,> battle; combat is reward VFX                                               |
| statistics-data/6-sp-a-1game (Detective)                               | 6.SP.A.1   | HYBRID→wrapper      | move-then-YES/NO classifier                                                               |
| statistics-data/6-sp-a-1game-2 (Stat Lab)                              | 6.SP.A.1   | QUIZ_WRAPPER        | styled worksheet; regex-graded rewrite                                                    |
| statistics-data/6-sp-b-5-data-detective-game                           | 6.SP.B.5   | **REAL_GAME**       | drag-sort median, drag range markers, click plots                                         |
| statistics-data/histogram-master-lab/games (×4)                        | 6.SP.B.4/5 | HYBRID              | real Build Lab (choose bin width) inside MC/writing worksheet; **value="correct" in DOM** |
| statistics-data/mean-median-mode-game (Sports Mgr)                     | 6.SP.B.5   | QUIZ_WRAPPER        | data chips are display-only                                                               |
| unit-5/parallelogramandrhombusgame (Architecture)                      | 6.G.1      | QUIZ_WRAPPER        | static diagram; formulaic distractors                                                     |
| math/unit-8/game-equations-quest                                       | 6.EE.5–7   | QUIZ_WRAPPER        | worksheet w/ Level 0/1/2 (good tiers)                                                     |
| math/unit-9/game-variable-voyage                                       | 6.EE.2     | QUIZ_WRAPPER        | worksheet w/ Level 0/1/2 (good tiers)                                                     |
| games/unit1-factor-frenzy.html (Factor Frenzy)                         | 6.NS.4     | QUIZ_WRAPPER        | pick-the-number; ±10 distractors guessable                                                |
| math/games/index.html, games/3d/index.html                             | —          | HUB                 | hand-maintained `<a>`-card grids (no manifest)                                            |

## Cross-cutting findings

- **One shared anti-pattern:** `loadQ → render 4 buttons → pick(i) → chosen===correct → cosmetic reaction → next`. Sprites/HP/bosses are post-answer theming, never inputs to the math.
- **Fake agency:** character/mode pickers (chefs, architects, store types, heroes) change at most lives/timer/emoji, never the mechanic.
- **Answer-giveaways:** Mars Rover + Racing hard-code `correct:0` and never shuffle choices (first option always right). Histogram Build Lab + Stat Lab put `value="correct"` / rationale in the DOM. Distractors are formulaic (`×2`, `±10`, `b+h`) → guessable.
- **Real defects to fix regardless of redesign:**
  1. `6-ns-b-3game` — load-time `ReferenceError` (unclosed `teacherMasterAll`) + student-reachable teacher panel (password `"admin"`, accepts empty) writing fake mastery to EduPulse. **Security + repo-rule violation.** → FIXED 2026-06-08.
  2. `6-rp-a-3game` — `mapScale` distractor string-concatenation (`"205 miles"`); `bestBuy` can mark "They cost the same" wrong on rounding.
  3. Racing — duplicate `"$9.00"` answer choice.
- **Templates to clone** (already math-as-mechanic, in-repo): `6-sp-b-5-data-detective-game` (drag/marker stats), `6-ns-c-8game` build phase (plot by clicking the plane), `6-ee-c-9game` (shoot the right value), histogram Build Lab (choose bin width).

## Rebuild pattern (the fix)

Replace "select the precomputed answer" with "**construct the quantity by
manipulating a visual model**," so wrong math yields a _visible_ error and
equivalence/structure becomes a felt discovery. Per-standard mechanics:

- **Ratios (RP.1):** two-tube smoothie bar — build a drink to a target ratio; 4:6 also serves a 2:3 order (equivalence felt). _(flagship — built 2026-06-08)_
- **Unit rate (RP.2):** sort boxes on a conveyor into unit-price bins; mis-sorts jam the line.
- **Percent (RP.3):** price slider + % dial vs a live demand/profit meter; hit the profit target.
- **Fraction division (NS.1):** tile a measured corridor with 3/4 segments; the door opens when it tiles exactly.
- **GCF/LCM (NS.4/B.4):** drag prime tiles into a shared overlap zone; product of the locked overlap = GCF.
- **Decimals (NS.3):** measuring cup — pour to an exact decimal fill line; overpour spills.
- **Signed numbers (NS.5):** drag the mercury column to the target integer on a zero-anchored scale.
- **Area (G.1):** shear a unit-grid rectangle into a parallelogram; cells (area) are conserved → base×height.
- **One-step equations (EE.7):** two-pan balance — remove equal weights from both sides; illegal moves tip the beam.
- **Evaluate expressions (EE.2):** drag the value-tile into every variable slot; fire operations in valid PEMDAS order.

Each rebuild keeps the existing shell (Phaser/DOM, sound, EduPulse, save-resume,
Level 1/2 support tiers) and replaces only the core loop. No folder moves
(per repo route-stability rule).
