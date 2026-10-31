# Feedback audit (screens workstream)

One feedback surface everywhere: `feedback-machine.js` (phases) + `feedback-panel.js` (draw) + `feedback-host.js` (mounts the
same panel in games and trail rounds). Heading "Correct!" or "Not quite. Let's work through it.", a large icon, the kept
answer, one explanation line, and Next or Try again. Nothing advances on its own; a first miss never states the answer.
The phase table is `GAME_PHASES` in `feedback-host.js`; `tools/fluency-screens.test.mjs` checks every game has a row.

| Surface | Before | After | Left alone and why |
| --- | --- | --- | --- |
| Practice (all modes, `#feedback`) | Panel sat below the guided-steps card, below the fold on desktop; focus never reached Next | Panel directly under the answer card; Next takes focus when a result settles | Ids and data attributes unchanged (`#feedback`, `#feedback-title`, `#feedback-copy`, `data-type`, `#next-problem`) |
| Trail rounds (`trail-view.js`) | One line of text, auto-advance after 650 ms | Shared panel; Next / See results; retry panel above the steps; second miss still says "Type N" | Fresh "one more look" item, stars, keypad |
| Fact Match | Plain note; cards flip back on a timer; last pair auto-finished | Panel per match (pair shown); mismatch shows retry with the two cards tried; last pair waits for See results | 1.1 s flip-back is the memory mechanic; "Try again" flips immediately |
| Target Hunt | Plain note; auto-finish | Panel per tap; round complete shows Next round / See results | Round and star rules |
| Answer Sort | Plain note, auto-finish | Panel per drop; retry names the bin tried, never the answer | Star rules |
| Spot the Mistake | Plain note, auto-advance 800-900 ms | Retry shows what was tried; solved shows Correct with the repair and Next | Find-the-step and "Sam is right/wrong" steps use the next prompt as feedback |
| Make It | Plain note, hand-made Next | Panel per pair; round end shows Next round / See results | Rules, 3 rounds |
| Fact Family Builder | Check + Next beside it, auto-finish | Retry lists the filled equations (never the numbers); Correct with Next in the panel | Check logic |
| Balance It | Plain note, auto-advance 1 s | Retry keeps the heavier/lighter note, never the number; Correct with Next | Tilt and decoys |
| Tricky Facts | Note + steps, auto-advance 0.7 s | Retry panel, steps stop before the answer step; Correct retires the card, waits for Next | `peekCap`, retire logic |
| Mystery Picture | Tile cleared and next prompt at once | Result view with panel and Next; picking another tile moves on | Fog, calm mode |
| Number Garden / Array Architects / Fraction Forge | Status line, auto-advance 0.7 s | `mountFeedback` on the existing `[data-feedback]` element; panel Next | `dataset.state`, hint button |
| Math World Builder / Number Puzzle Studio / Fluency Rally | Status line + appended Next | Shared panel with Next challenge / See results | "Find another valid pair" stays in the actions row |
| Puzzle worlds (all nine) | Auto-advance 0.8 s | Shared panel and Next; Reset ignored once solved (stops double scoring) | World rules |
| Strategy Match / Target Hive / Factor & Fraction Path / Ghost Sprint | Instant advance, detached Next button (Target Hive), `finish()` without `game` (crash) | Shared panel; Next / See results; `game` id passed to `finish` | Untimed, accuracy-adjusted ghost |
