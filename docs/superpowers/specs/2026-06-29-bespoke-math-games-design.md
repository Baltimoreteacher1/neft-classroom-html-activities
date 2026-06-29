# Bespoke Math-as-Mechanic Games — One Type per Topic (Design)

Date: 2026-06-29
Status: Approved (user directive) — build in verified waves, panel-review, deploy.

## Why

The Practice Arcade is honestly "polished problems" (answer-selection with a
game-feel wrapper). Real games make the MATH the mechanic — wrong _thinking_
fails you, not aim/guess/reflex. Pilot proof: `u4-percent-power` → percent **Bar
Builder**. This spec fans that approach across every unit's "Pick a Game" slot so
each is its OWN game type tailored to the topic.

## Shared requirements (every game)

- Rebuild the Play scene of `math/games/u<N>-<name>/index.html` in place.
- Keep the whole shell from the u4 pattern: Boot → Title → **Vocab gate** (topic
  terms) → Play → Result; HUD (score/lives/streak/level/progress); injected
  blocks (save-resume, game-fx, mobile-access, math-workbench); EduPulse emit;
  canvas `role=application` + aria-label + `#..-sr` live region; Phaser 3.80.1,
  `Phaser.Scene.call(this,…)` pattern; W=820/H=600 `Scale.FIT`.
- Add the shared **game-feel layer**: include `/assets/game-juice.js` (head) +
  `/assets/lesson-passport.{css,js}`; use `window.GameJuice` for burst/confetti/
  shake/floatText/popIn/tilePop/audio + `JUICE.award(xp,...)` progression.
- **No timed/reflex pressure.** Calm, self-paced; a wrong _answer_ (bad math)
  costs a life and the game shows/animates the correct state to teach.
- Touch AND keyboard; reduced-motion + `NT_MUTED` honored; mobile no overflow.
- 8–10 solved to win; lives=3; stars by accuracy; level scaling raises rigor.

## Mechanic map (distinct type per unit)

| Unit               | Game               | Standard | Mechanic (math IS the action)                                                                                                               |
| ------------------ | ------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| u1 decimals        | Decimal Dash       | 6.NS.3   | **Number-line placer**: drag a marker to the exact decimal; later order 2–3 values. Variable ranges + tick granularity (tenths→hundredths). |
| u2 fractions       | Fraction Frenzy    | 6.NS.1   | **Partition & shade**: choose # of equal parts, shade to model a fraction / count unit fractions in a whole (÷).                            |
| u3 ratios          | Ratio Rush         | 6.RP.1/3 | **Double number line / ratio table**: drag to keep two quantities in ratio; fill the equivalent ratio.                                      |
| u4 percent         | Percent Power      | 6.RP.3c  | **Bar builder** — DONE (shade % of a whole; 4 framings).                                                                                    |
| u5 area            | Area Attack        | 6.G.1    | **Decompose & tile**: draw rectangles on a grid to cover/compose a figure; area = tiles.                                                    |
| u6 expressions     | Expression Express | 6.EE.1-2 | **Expression assembler**: drag value/operation tiles to build an expression equal to a target, or order the evaluation steps.               |
| u7 equations       | Equation Quest     | 6.EE.5-8 | **Balance scale**: add/remove equal amounts from both pans to isolate x and keep balance.                                                   |
| u8 data            | Data Dash          | 6.SP.3-5 | **Build-the-plot**: place dots on a line plot to hit a target mean / median / range.                                                        |
| u9 integers/coords | Coordinate Quest   | 6.NS.6   | **Plot on grid**: place points at given coordinates; reflect across axes; integer number line.                                              |
| u10 volume         | Volume Blast       | 6.G.2    | **Unit-cube stacker**: set L×W×H to fill a prism to a target volume.                                                                        |

## Build order (waves; verify + deploy each)

1. Wave 1: u1 (placer), u7 (balance), u8 (plot), u10 (cubes) — tractable, highly distinct.
2. Wave 2: u2 (partition), u3 (double-number-line), u5 (grid tile), u6 (assembler), u9 (coordinate).

- Each game built by a dedicated agent against this spec + u4 + game-juice as
  references; then verified centrally (Playwright: load → 0 console errors →
  full correct play-through → wrong path costs a life → mobile fit → screenshot).

## Verification bar (per game, before deploy)

- 0 console/page errors desktop + mobile (390px), no horizontal overflow.
- Plays start→win through the real mechanic; wrong answer loses a life + teaches.
- Generator/logic produces valid, solvable problems across levels.
- Shell intact (vocab gate, HUD, save/resume, accessibility, juice).

## Risks

- Bespoke Phaser interactions (grid draw, cube iso, balance) are non-trivial →
  central verification + fix loop required; don't trust agent self-reports.
- Keep deploys on the clean-worktree origin/main path; pre-push QA gate must pass.
