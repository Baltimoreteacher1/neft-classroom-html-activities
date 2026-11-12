# Math validation

Executed with `node --test engine/core/publisher-upgrade.test.mjs` (10 pass, 0 fail). These checks use exact arithmetic in `engine/core/publisher-models.js`. They do not claim a student-outcome gain.

## Exponents

- `powerValue(3, 2)` expands to `3×3` and equals `9`.
- `exponentProductBug(3, 2)` equals `6`.
- A submitted `6` is the product bug. The repair message says this may indicate a misunderstanding and that one answer does not show the student’s reasoning.
- The fresh item is a different base or exponent, and its key matches `powerValue`.
- A submitted `9` is correct and does not open the bug path.

## Equivalent ratios

For base ratio `2:3` and scale factors `1`, `2`, `3`, `4`, and `0.5`:

- quantity totals, tape totals, table row, and double-number-line coordinates are the same pair
- each total is the base quantity times the factor
- the unit rate `3/2` is unchanged
- the symbolic statement is `2:3 = x:y` for that pair

`connectedRatio(2, 3, 4)` is `2:3 = 8:12`.

The Living Math Canvas scene `equivalent-ratios` now asks for five representations: quantity, tape, double number line, table, and statement. The invariant test is the deterministic check. A browser was not used to watch the slider.

## Equations

Start: `2x + 3 = 11`, solution `4`.

- Subtract `3` from both sides.
- Divide both sides by `2`.
- Add `5` to both sides.

The solution stays `4` after each step. The existing equation lens already tells the canvas that the unknown does not change. This test is the pure check of that rule.

## Lesson 6-4

Standard `6.AT.6c` text: evaluate expressions at specific values of their variables.

The learning target now says: evaluate expressions at specific values of their variables, including powers and expressions from a real situation.

That sentence uses the standard’s “specific values,” the title’s powers, and the launch task `150 + 12s`. It does not add a new objective. Part 2 keeps its own lesson id.

No other lesson’s answers were recomputed in this pass. `npm run validate:math` was not run.
