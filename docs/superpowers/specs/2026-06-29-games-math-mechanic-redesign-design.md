# Games — Math-as-Mechanic Redesign (Design)

Date: 2026-06-29
Status: Pilot approved (Option 1) — build u4, verify, deploy, then fan out.

## Problem

Audit of the 26 live games (`math/games/u*`, `math/unit-*/games/*`, two arcades)
found viewability and functionality healthy (all load, no console errors, no
mobile overflow, vocab-first + HUD + save/resume + accessibility shells intact),
but the **arcade games collapse to ~4 reskinned mechanics** and most are
_multiple-choice-in-costume_: steer/shoot/fly an avatar into the pre-made correct
answer. Wrong **math** has no consequence distinct from "wrong"; the arcade layer
is decoration, not the math.

Duplicate clusters in the small set:

- Catchers: `u1-decimal-dash`, `u4-percent-power`, `u8-data-dash`
- Cannons: `u2-fraction-frenzy`, `u5-area-attack`, `u10-volume-blast`
- Leaper: `u7-equation-quest`; Pilot/steer: `u6`, `u9`, `practice-arcade`

## Goal

Convert the duplicate-mechanic games into **genuinely different game types where
the math drives the mechanic** — calm, self-paced build/place/balance/plot
puzzles, **no timed/reflex pressure** (a standing user preference). Wrong math
fails you, not slow reflexes.

## Constraints

- Keep the existing per-game shell unchanged: Boot → Title → **Vocab gate** →
  Play → Result; SFX; HUD (score/lives/streak/level/progress); `game-fx`,
  save/resume, EduPulse, Math Workbench, canvas accessibility (`role`/aria).
- Phaser 3.80.1, single self-contained `index.html` per game (local vendor +
  CDN fallback). Use the `Phaser.Scene.call(this, …)` prototype pattern already
  in place (avoids the known scene-factory prototype bug).
- Touch **and** keyboard input; reduced-motion safe; screen-reader live region.
- No route/structure changes. Deploy = commit + push to `main` (CF Git
  auto-deploy) via the documented safe path.

## Approach (Option 1 — pilot first)

Redesign **`math/games/u4-percent-power`** to a gold standard, verify in-browser,
deploy, then roll the proven pattern to the other clones — each unit getting a
**distinct** mechanic from this family:

| Unit           | Topic   | New mechanic                                       |
| -------------- | ------- | -------------------------------------------------- |
| u4 percent     | 6.RP.3c | **Percent bar / number-line builder** (this pilot) |
| u2 fractions   | 6.NS    | partition / area-model splitter                    |
| u3 ratios      | 6.RP    | ratio table / double-number-line balancer          |
| u5 area        | 6.G     | decompose-and-tile builder                         |
| u1 decimals    | 6.NS.3  | place-value number-line placer                     |
| u7 equations   | 6.EE    | balance scale                                      |
| u9 coordinate  | 6.NS.6  | plot-on-grid                                       |
| u8 data        | 6.SP    | arrange-to-hit-target (mean/median)                |
| u10 volume     | 6.G     | stack unit cubes                                   |
| u6 expressions | 6.EE    | build-the-expression assembler                     |

## Pilot mechanic — Percent Power "Bar Model Builder"

**Core action:** the bar represents the whole (0 … `whole`). The student drags a
handle (pointer) or nudges ±5% (← →, A/D) to shade a percent, then presses
**Lock In** (or Enter/Space). Two live readouts update continuously:
`<pct>%` and `= <part> of <whole>`. The marker snaps to 5% increments; all target
answers are 5% multiples, so a correct shade is exact (no fuzzy tolerance).

**Problem framings (scale by level), all reduce to "set the bar to target %P":**

- L1–2 **Find the part:** "Shade 75% of 20" → target 75%, readout teaches part=15.
- L3 **Decimal → bar:** "Shade the bar to show 0.25" → target 25%.
- L4–5 **Find the percent:** "How much of 20 is 15? Shade it." → target 75%.
- L6+ **Sale price:** "$20, 25% off — shade what you PAY" → target 75% ($15).

**Feedback / fail:** wrong lock → lose a life, marker animates to the correct
position with the `why` explanation (teaching moment); correct → particle burst,
score + streak bonus. Win at 10 solved; lose at 0 lives. Stars from solved count.
Reuses existing `afterAttempt`/`updateHUD`/`endGame`/Result + EduPulse emit.

**Removed:** falling-coin loop, cart, coin spawn/collision, and the MCQ option
generators (`pctOfNumber`/`salePrice`/`pctDecimal`/`makeProblem`) — replaced by a
single `barProblem(level)` generator. No dead code left behind.

## Units / boundaries

- `barProblem(level)` — pure function → `{kind, label, prompt, whole, targetPct,
readout, why}`. Independently reasoned/testable; no rendering.
- `GameScene` — owns bar geometry (`pctToX`/`xToPct`), marker state, input, lock,
  and feedback; depends on shell helpers (`SFX`, `srSay`, `afterAttempt`).
- Shell scenes unchanged.

## Verification

- `npm run validate` (link/structure) + `npm run build` (Vite) must pass.
- Playwright smoke: load → Start → vocab → Play; drag + arrow input changes the
  bar; correct lock advances; wrong lock costs a life; mobile (390px) no overflow,
  touch drag works; no console errors. Screenshot gameplay.
- `node tools/audit-save-resume-integration.js` unaffected (shell untouched).

## Risks

- Pointer→game-space mapping under `Scale.FIT` (Phaser converts; verify on mobile).
- Local `main` diverges from origin (auto-reset) — deploy by cherry-picking the
  commit onto a clean detached `origin/main` worktree, never pushing local `main`.
