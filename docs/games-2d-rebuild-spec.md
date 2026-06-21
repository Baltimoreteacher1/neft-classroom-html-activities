# Games-2D Math-as-Mechanic Rebuild — Build Spec

> **RE-BASELINED 2026-06-21 — this spec is largely DONE; do not re-execute it wholesale.**
> A fresh classification confirmed **17 of the 23 audit games already meet the bar** and
> the data/QA layer is complete (`scripts/games2d/data.mjs` now has ~16+ entries, not 3).
> The per-game build list and Wave A/B/C plan below describe work that has **already
> shipped** for most games. Remaining real work as of 2026-06-21: rebuild `6-ns-c-6game`
> (themed-MCQ + giveaways) and minor-fix `6-ee-9gamereview`, `6-ee-c-9variablevelocitygame`,
> `6-ns-c-5game`, `6-ns-c-8game`, `6-sp-a-1game`; plus vocab gates for the `math/games/u*`
> arcade family (out of this spec's original scope). Backlog: the `u*` lane-runners are
> still collision-select MCQ and want true math-as-mechanic rewrites.

**Status:** design approved-in-principle (consolidates `docs/games-audit-2026-06-08.md`).
**Date:** 2026-06-19. **Branch:** `feat/gold-standard-complete`.
**Why this exists:** the gold-standard wave finished the data/QA layer for games-2d
(`scripts/games2d/data.mjs` → `assets/games2d-data.js`, `npm run audit:games2d-esol`).
The one remaining piece is the **game-mechanic rewrites** — turning ~20 quiz-wrappers
into real games. This spec is the agent-ready plan for that, to run when capacity allows.

## The bar (unchanged from the audit)

A _real game_ makes **the math the mechanic**: the player manipulates a visual model
(build, pour, sort, aim, balance, plot, navigate) and the math is enforced by the
interaction and visual state — **not** by clicking A/B/C/D. Theming that only reacts
_after_ an MCQ is decoration. Wrong math must produce a _visible_ error; equivalence/
structure must become a felt discovery.

## Shared contract — every rebuilt game MUST

1. **Read its metadata from the source of truth.** Pull vocab / misconceptions / tier
   labels from `window.Games2DData["<folder-id>"]` (emitted from `data.mjs`). Keep a
   tiny inline fallback so the page is never blank. Add the game's entry to `data.mjs`
   and regenerate (`npm run generate-games2d-data`) as part of the rebuild.
2. **Vocab before play.** Show term + student-facing (Level-1) definition + image
   BEFORE any interaction (repo rule).
3. **Level 0 / 1 / 2 tiers**, never labeled "ESOL" (Level 1 = Support, Level 2 =
   Challenge; Level 0 = most-supported where present). Tiers change the _mechanic's_
   difficulty (number size, speed, scaffolds shown), not just lives/emoji.
4. **No answer-giveaways.** Shuffle all options; never put `value="correct"`,
   `correct:0`, or rationale text in the DOM; distractors must not be formulaic
   (`×2`, `±10`, `b+h`). `npm run audit:games2d-esol` must stay clean.
5. **Preserve the shell:** existing Phaser/DOM scaffold, sound, save/resume
   (`SAVE_RESUME_SYSTEM.md`), and EduPulse/`nt-results` reporting — now stamped with
   the canonical `misconceptionTag` from `data.mjs` so teachers see which sub-skill failed.
6. **No folder/route moves** (route-stability rule). Replace only the core loop.
7. **Accessibility:** use the shared `assets/game-fx` kit (focus, reduced-motion,
   success-burst); ensure keyboard operability and contrast.
8. **Verify before done:** `node --check` / `npm run validate`, `audit:games2d-esol`,
   and a browser smoke test (vocab gate → playable → wrong-math-shows-error → complete).

## Templates to clone (already real, in-repo)

- `statistics-data/6-sp-b-5-data-detective-game` — drag-sort median, drag range markers.
- `number-system/6-ns-c-8game` build phase — plot by clicking the plane.
- `expressions-equations/6-ee-c-9game` (Variable Blaster) — aim/time pressure on the right value.
- `statistics-data/histogram-master-lab` Build Lab — choose bin width.

## Per-game build list (mechanic assigned from the audit)

**Leave as-is (REAL — regression-protect + wire data.mjs only):**
`6-ee-c-9game` Variable Blaster · `6-sp-b-5-data-detective-game`.

**Promote HYBRID → real (strip the MCQ bolt-on, keep the real core):**
`6-ns-c-3game` Number Line Jumper · `6-ns-c-5game` Temperature (fix dead mode select) ·
`6-ns-c-6game` Coordinate Hunt (stop announcing target coords) · `6-ns-c-8game` City
Builder (replace distance MCQ with measure-on-grid) · `6-ns-b-4game` Treasure Hunter ·
`6-sp-a-1game` Detective · histogram Build Lab (remove worksheet wrap; fix `value="correct"`).

**Full rebuild (QUIZ_WRAPPER → assigned mechanic):**

| Game                                    | Std    | New mechanic                                                                                |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| 6-rp-1game Ratio Kitchen                | RP.1   | two-tube smoothie to a target ratio (4:6 also fills a 2:3 order) — **flagship, built**      |
| 6-rp-a-2game Unit Rate Factory          | RP.2   | sort boxes on a conveyor into unit-price bins; mis-sorts jam the line                       |
| 6-rp-a-3game Shopping Mall Tycoon       | RP.3   | price slider + % dial vs live profit meter (also fix mapScale & bestBuy bugs)               |
| unit-1/6-1game Fraction Dungeon         | NS.1   | tile a measured corridor with 3/4 segments; door opens on exact tiling                      |
| 6-ns-a-1game Underwater                 | NS.1   | construct the quotient on a model, not collision-select                                     |
| 6-ns-b-2game Asteroid Miner             | NS.2   | build the quotient via partial products, not fly-into-the-answer                            |
| 6-ns-b-3game Cooking Sim                | NS.3   | measuring cup: pour to an exact decimal fill line; overpour spills (defects already fixed)  |
| u1-factor-frenzy / Factor Frenzy        | NS.4   | drag prime tiles into a shared overlap zone; locked-overlap product = GCF                   |
| 6-ee-9gamereview Tower Defense          | EE.9   | build the function table that powers towers; wrong rule = no fire                           |
| 6-ee-c-9martiangame Mars Rover          | EE.9   | drive distance from the rule (fix `correct:0` shuffle)                                      |
| 6-ee-c-9variablevelocitygame Racing     | EE.9   | lane = output of the rule; steering must depend on the equation (fix dup-choice bug)        |
| variablecomparisongame Expression Arena | EE     | evaluate both expressions on a balance; the heavier side wins (combat = result, not reward) |
| unit-8/game-equations-quest             | EE.5–7 | two-pan balance: remove equal weights from both sides; illegal moves tip the beam           |
| unit-9/game-variable-voyage             | EE.2   | drag the value-tile into each variable slot; fire operations in valid PEMDAS order          |
| 6-sp-a-1game-2 Stat Lab                 | SP.1   | drag-classify questions into statistical / non-statistical bins (kill regex grading)        |
| mean-median-mode-game Sports Mgr        | SP.5   | manipulate the data chips to hit a target mean/median (chips become inputs)                 |
| unit-5/parallelogramandrhombusgame      | G.1    | shear a unit-grid rectangle into a parallelogram; conserved cells reveal base×height        |

## Defects to fix regardless of redesign

- `6-rp-a-3game`: `mapScale` string-concat distractor; `bestBuy` "same" mismarked on rounding.
- Racing: duplicate `"$9.00"` choice; lane steering currently inert.
- Mars Rover / Racing: `correct:0` never shuffled.
- histogram Build Lab + Stat Lab: `value="correct"` / rationale exposed in DOM.

## Execution plan (when capacity allows)

- **Wave A (highest ROI, clear mechanics):** Unit Rate Factory, Fraction Dungeon,
  Factor Frenzy, equations-quest balance, parallelogram shear. Clone nearest template.
- **Wave B:** the remaining full rebuilds.
- **Wave C:** promote the HYBRIDs; regression-protect the 2 REAL games.
- **Orchestration:** one game per agent in an isolated worktree (no cross-game
  conflicts), each agent owns: rebuild core loop → add `data.mjs` entry → regenerate →
  `audit:games2d-esol` + `validate` + browser smoke → return diff. Adversarial-verify
  each rebuild against the bar (is the math actually the mechanic, or themed MCQ?).
- **Backfill:** `data.mjs` currently has 3 of ~28 games; each rebuild adds its entry so
  the SoT reaches full coverage.

## Out of scope

3D games (overhauled separately); HTML lesson content (handled separately); folder/route
changes. This spec covers only the 2D/DOM/Phaser game core loops + their data/QA wiring.
