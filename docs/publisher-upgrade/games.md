# Game directories

The inventory in `scripts/publisher-coverage.mjs` lists 17 directories under `math/games/` and `curriculum/arcade`. This checkout has no `curriculum/arcade` directory, so all 17 are under `math/games/`.

The shared shell is `math/games/shared/game-shell.js`. It shows the mathematical objective, a one-step tutorial, keyboard instructions, a miss line that says the error may indicate a misunderstanding, and progress in `localStorage` key `ewl-game-shell-v1`. The stored record is the game id plus solved, misses, and attempts. It does not store a name. A short generic miss is replaced with that game's line. A longer message the game already computed is kept.

Checks for a power, an equivalent ratio, and an equation call `engine/core/publisher-models.js`. A miss line does not print the worked value.

## Wired through the shared shell

| Directory | How the shell loads | Math |
| --- | --- | --- |
| `math/games/u1-decimal-dash` | `phaser-studio.js` writes the shell script | Existing number-line check kept |
| `math/games/u2-fraction-frenzy` | same | Existing shade-the-fraction check kept |
| `math/games/u3-ratio-rush` | same | Existing equivalent-ratio check kept. `checkGameMove` also calls `connectedRatio` |
| `math/games/u4-percent-power` | same | Existing percent check kept |
| `math/games/u5-area-attack` | same | Existing area check kept |
| `math/games/u6-expression-express` | same | Existing expression check kept. A generic miss uses the exponent line |
| `math/games/u7-equation-quest` | same | Existing both-sides check kept. `checkGameMove` calls `equationSolution` and `applyBothSides` |
| `math/games/u8-data-dash` | same | Existing data-display check kept |
| `math/games/u9-coordinate-quest` | same | Existing coordinate check kept |
| `math/games/u10-volume-blast` | same | Existing volume check kept |
| `math/games/u1-factor-frenzy` | `cabinet-tools.js` adds the shell script | Existing factor-tree check and expedition feedback kept |
| `math/games/placement-quest` | `cabinet-tools.js` | Existing topic questions kept. The shell watches `#feedback-line` |
| `math/games/practice-arcade` | script tag on `index.html` and `map.html` | Lesson items kept. The generic "Not quite — try again!" line now names a possible different operation and does not reveal the answer |
| `math/games/u6-power-up-arcade` | script tag on `index.html` | Existing exponent battles kept, including the line that `3⁴` is repeated multiplication and not `3 × 4`. The shell watches `#coach` |

## Not changed, and why

| Directory | Why it was not turned into a playable cabinet |
| --- | --- |
| `math/games/dashboard` | This is a teacher progress reader. It summarizes EduPulse and Save/Resume data already stored on the device. Adding a math-check shell would cover the dashboard and invent a second game on a page that does not ask a question. |
| `math/games/engines` | Ten scene modules (`u2-circuit-breaker` through `u9-flux-plotter`) plus `core/`. There is no student `index.html` in this directory. The modules are imported by other cabinets. Editing them in place would fork mechanics that those cabinets already check. |
| `math/games/shared` | This directory is the shell: `game-shell.js`, `phaser-studio.js`, `cabinet-tools.js`, and the expedition engine. It is not a route a student opens to play one game. |

No second game platform was added. `qa:loop` and a browser play-through of these cabinets were not run for this note.
