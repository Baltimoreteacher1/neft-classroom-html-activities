# Practice Arcade — Inventory and Gap Audit (2026-10-25)

Stage 1 of the Practice Arcade transformation brief. Measured on `origin/main` at `361f302e16`.
Method: file listing, `<title>` extraction, and feature greps across `math/games/u*/` and `math/games/shared/`.
Counts are grep hits per game (index.html + JS), not verified behavior. Behavior is verified in Stage 5.

## 1. In-scope entry points

| Folder                             | Title                                   | Unit   | Core mechanic (from expedition modules)              | Request name                                      |
| ---------------------------------- | --------------------------------------- | ------ | ---------------------------------------------------- | ------------------------------------------------- |
| `math/games/u1-decimal-dash`       | Decimal Dash — Number-Line Placer       | 1      | place decimals on a number line; cargo, fuel         | —                                                 |
| `math/games/u1-factor-frenzy`      | Factor Frenzy — Prime Factorization     | 1      | forge, mount                                         | —                                                 |
| `math/games/u2-fraction-frenzy`    | Fraction Frenzy — Partition & Shade     | 2      | partition and shade fraction bars; flow              | —                                                 |
| `math/games/u3-ratio-rush`         | Ratio Rush — Double Number Line         | 3      | double number line; flow                             | Ratio Rush                                        |
| `math/games/u4-percent-power`      | Percent Power — Bar Model Builder       | 4      | shade a percent bar; construction                    | Percent Power                                     |
| `math/games/u5-area-attack`        | Area Attack — Decompose & Tile          | 5      | decompose and tile; core, pavilion, yard             | Area Attack                                       |
| `math/games/u6-expression-express` | Expression Express — Assembler          | 6      | assemble expressions; kit, trains                    | —                                                 |
| `math/games/u7-equation-quest`     | Equation Quest — Balance Scale          | 7      | balance scale; gates                                 | Equation Quest                                    |
| `math/games/u8-data-dash`          | Data Dash — Line Plot Builder           | 8      | build line plots; data, plots, report                | Stats Slam (closest; not a sports-management sim) |
| `math/games/u9-coordinate-quest`   | Coordinate Quest — Coordinate Plane     | 9      | plot and navigate coordinates; grid, descent, survey | —                                                 |
| `math/games/u10-volume-blast`      | Volume Blast — Unit-Cube Stacker        | 10     | stack unit cubes; hull, build                        | —                                                 |
| `math/games/practice-arcade/`      | Practice Arcade — Review Lab; World Map | hub    | world map and launcher                               | —                                                 |
| `math/review-arcade/`              | Boss-Battle Review Arcade               | review | boss encounters                                      | Boss-Battle Review                                |

Thematic names in the brief (Oasis, Neon City, Terrace Architects, Bridgekeepers, Sports) appear only as art
sets in `math/games/shared/art/` (`oasis-engineers.webp`, `neon-grid.webp`, `terrace-architects.webp`,
`bridgekeepers.webp`, …). They are not separate games.

The mechanic redesign spec (`docs/superpowers/specs/2026-06-29-games-math-mechanic-redesign-design.md`)
already assigned a distinct mechanic per unit. All 11 folders above implement one.

## 2. Measured feature coverage (grep hits, per game)

| Game          | save/resume | misconception | hints | ES/lang | reduced-motion | aria | keyboard | adaptive |
| ------------- | ----------- | ------------- | ----- | ------- | -------------- | ---- | -------- | -------- |
| u1 decimal    | 4           | 6             | 24    | 11      | 5              | 4    | 23       | 18       |
| u1 factor     | 5           | 20            | 21    | 4       | 3              | 23   | 3        | 15       |
| u2 fraction   | 4           | 18            | 32    | 5       | 4              | 4    | 28       | 18       |
| u3 ratio      | 4           | 14            | 22    | 5       | 4              | 13   | 26       | 18       |
| u4 percent    | 27          | 36            | 36    | 4       | 7              | 11   | 21       | 17       |
| u5 area       | 4           | 10            | 20    | 3       | 5              | 8    | 26       | 17       |
| u6 expression | 4           | 17            | 22    | 3       | 5              | 4    | 30       | 17       |
| u7 equation   | 4           | 8             | 22    | 5       | 5              | 7    | 24       | 14       |
| u8 data       | 5           | 6             | 57    | 5       | 4              | 4    | 31       | 12       |
| u9 coordinate | 4           | 12            | 54    | 7       | 8              | 4    | 27       | 14       |
| u10 volume    | 4           | 9             | 48    | 9       | 8              | 4    | 26       | 15       |

Cross-cutting features, counted across all unit games and `shared/`:

| Feature                                                | Files with it | Status                                            |
| ------------------------------------------------------ | ------------- | ------------------------------------------------- |
| Text-to-speech / read-aloud (`speechSynthesis`)        | 0             | **missing**                                       |
| In-game EN/ES language toggle                          | 0             | **missing** (ES strings exist only as vocab)      |
| High-contrast mode                                     | 0             | **missing**                                       |
| Boss encounters in unit games (`boss`)                 | 0             | **missing** (boss exists only in `review-arcade`) |
| Student-created challenges                             | 0             | **missing**                                       |
| Mute / volume controls                                 | 16            | present, partial                                  |
| Teacher-assigned missions (`assign`/`teacher mission`) | 34            | present                                           |

Unit 4 has the deepest save/resume and persistence (27 hits). It is the reference for shared persistence work.

## 3. Gap list against the brief

Sections the code already covers: 2 (mechanics), 5 (flagship mechanic per unit), 7 (misconception feedback),
8 (adaptive difficulty), 10 partial (mission chapters), 14 partial (keyboard, reduced-motion, aria).

Sections not covered:

1. **Read-aloud and narration (§4, §9, §14).** No TTS in any game. Needs one shared module.
2. **In-game EN/ES toggle (§9).** Needs a shared language layer. Brief says "English/Spanish only".
3. **High-contrast and sensory settings (§14).** Needs a shared accessibility preferences module.
4. **Boss encounters in unit games (§5, Boss-Battle Review).** Only `review-arcade` has bosses. Unit games have none.
5. **Student-created challenges (§11).** Not started. Privacy and moderation requirements apply. Largest and riskiest item.
6. **Visual system (§3).** 12 art webp files exist in `shared/art/`. Per-game art is not measured here. Stage 5 needs a visual review.
7. **Stats Slam (§5).** No sports-management game exists. Data Dash is the closest. Creating one is a new game, not an upgrade.

## 4. Constraints found

- Each unit game is a single `index.html` plus expedition JS modules. Shared code is loaded per page.
- `tools/validate-game-rules.mjs` rejects hub links, countdowns, and solution-on-miss. Any new game UI must pass it.
- Save/resume contracts are covered by `validate:save-resume`. Changes to persistence must keep its contract.
- Deployment is via `scripts/ship.sh` only, and only with explicit authorization (repo CLAUDE.md).

## 5. Baseline (this worktree, `361f302e16`, after `npm ci`)

| Check                          | Result                                            |
| ------------------------------ | ------------------------------------------------- |
| `npm run validate:game-rules`  | PASS — 210 game files clean                       |
| `npm run validate:expeditions` | PASS — 11 expeditions complete, bilingual, mapped |
| `npm run validate:save-resume` | PASS                                              |

## 6. Recommended order for the remaining stages

1. Shared accessibility preferences module (reduced-motion, high-contrast, text size, sound) injected into all 11 games.
2. Shared read-aloud module with captions, EN/ES, and an opt-in toggle.
3. Boss encounter mechanic for unit games, built on the existing `review-arcade` boss code.
4. Student-created challenges, after a privacy and moderation design is approved.
5. Visual and animation pass per game, verified with browser playthroughs.
