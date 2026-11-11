# Arcade audit and shared-model fix (2026-11-11)

Scope of this pass: **the shared live-model layer and its gates**, found by driving all 20 catalogued
skill/adventure games and the 6 review/hub surfaces in Chromium. It is not the full gameplay
overhaul in the brief; section "Not done" says exactly what remains.

Evidence: `docs/arcade-overhaul/before/` and `after/` (`audit.json` + a screenshot per surface),
produced by `npm run audit:arcade-games -- --out=<dir> --shots` against the built `dist/`
(1366×768, headless Chromium, local static server).

## Inventory

Canonical registry: `data/arcade-games.json` (20 games, 6 surfaces; id, route, file, family,
kind, curriculum unit, topic model, topic keywords). Three runtime families share one set of
helper scripts:

| Family | Games | Engine | Model/coach source |
|---|---|---|---|
| cabinet (11) | Data Dash, Decimal Dash, Ratio Rush, Percent Power, Area Attack, Volume Blast, Factor Frenzy, Fraction Frenzy, Expression Express, Coordinate Quest, Equation Quest | Phaser + `expedition-engine.js` (3 chapters × 4 missions each, `validate:expeditions`) | expedition journal |
| flagship (8) | Stats Slam, Discount Dash, Area Architect, Volume Vault, Fraction Foundry, Expression Engine, Equation Escape, Variable Velocity | Phaser (Volume Vault: DOM) + `flagship-studio.js` mission panel | `flagship-studio.js` config + live model |
| standalone (1) | Ratio Kitchen | Phaser, own page, `flagship-studio.js` panel | same |

Review/diagnostic surfaces: Curriculum Arcade hub, Math Games hub, Practice Arcade, Boss-Battle
Review Arcade, Placement Quest, Review Expeditions. All 26 surfaces loaded with no page error
and no horizontal overflow at 1366×768.

## Defects found

| # | Defect | Severity | Evidence | Status |
|---|---|---|---|---|
| 1 | The "Visual Scaffold" shown after a wrong answer defaulted to a **2:3 ratio bar** for any miss it could not classify. Equation Escape and Variable Velocity showed ratio bars under equation and variable questions. | High (wrong mathematics shown to a student who just missed) | `before/audit.json` `afterAnswer.scaffoldModel` | **Fixed**: scaffold draws the game's own model of the current question, or nothing |
| 2 | The live model panel under the mission controls drew a static ratio bar (2:3) in Stats Slam, Discount Dash, Area Architect and Volume Vault, an absolute-value number line (value cycling with the correct count) in Equation Escape and Expression Engine, and a coordinate vector in Variable Velocity. None was derived from the question. | High | table below | **Fixed** for 6 of the 7 affected games; Expression Engine now draws nothing until an expression model exists |
| 3 | Every cabinet game's Expedition Journal drew a "Target Ratio a : b" bar from missions-done / missions-total, including Percent Power, Area Attack and Equation Quest. | Medium (mislabelled progress) | `expedition-engine.js` regex on game id | **Fixed**: journal draws a labelled progress bar |
| 4 | Curriculum Arcade labelled Variable Velocity a "Skill game" (it is an adventure) and had no Spanish blurb. | Low | `validate-arcade-models` HUB_KIND_MISMATCH | **Fixed** |
| 5 | Mission-panel "Launch mission" / "Español" buttons wrapped one letter per line at 1366px. | Medium (usability on Chromebook width) | `before/equation-escape.jpg` | **Fixed** (CSS) |
| 6 | The brief reports an unrelated **median tip** under Equation Escape. | — | Not reproduced: the shipped HTML, the flagship config and the runtime coach text all carry equation guidance; the same HTML is live. Closest real cause was defect 1 (ratio picture). | **Not confirmed.** `validate:arcade-models` now fails any coach text that uses another topic's distinctive keyword, so the reported class cannot ship. |
| 7 | `/api/tutor/health` answers 404 on 19 pages in the local harness. | Info | `after/audit.json` | Harness artifact: Pages Functions are not served by the static server. Not a defect. |

### Live model, before and after (first question; scaffold after one wrong pick)

| Game | Family | Live model BEFORE | Live model AFTER | Scaffold after a miss, BEFORE → AFTER |
|---|---|---|---|---|
| Stats Slam | flagship | ratio bars 2:3 (current 2:3) | dot plot, 5 values | — → dot plot, 5 values |
| Ratio Kitchen | standalone | ratio bars 3:4 (current 0:0) | ratio bars 3:5 (current 0:0) | — → — |
| Discount Dash | flagship | ratio bars 2:3 (current 2:3) | percent grid 10% | — → percent grid 25% |
| Area Architect | flagship | ratio bars 2:3 (current 2:3) | parallelogram with base 2 and height 4 | — → parallelogram with base 2 and height 4 |
| Volume Vault | flagship | ratio bars 2:3 (current 2:3) | Rectangular prism 1 by 1 by 1 units | — → — |
| Fraction Foundry | flagship | fraction bar | fraction bar | — → — |
| Expression Engine | flagship | absolute-value number line | — | — → — |
| Equation Escape | flagship | absolute-value number line | balance x − 4 = 14 | ratio bars 2:3 (current 2:3) → balance x − 4 = 14 |
| Variable Velocity | flagship | coordinate vector | independent → dependent roles | ratio bars 2:3 (current 2:3) → independent → dependent roles |

The audit picks answers (up to six) until one is a miss. "—" means no scaffold appeared: every pick was correct, or the state has no model (Ratio Kitchen and Fraction Foundry build a model by hand and show hint text instead; Volume Vault has no wrong-pick step). The BEFORE cells show the leak: a ratio bar under an equation and a variable question.

## Per-game gameplay audit status

Only the live-model/scaffold/hub/coach layers were audited and changed. For all 20 games the
mechanics, hint ladders, question generators, save/resume, EN/ES copy and accessibility **were
not re-audited in this pass**; existing gates cover them (`validate:game-rules`,
`validate:expeditions`, `validate:save-resume`, `validate:scorm*`) and were run (see below).

## Surface load check (dist, local)

| Surface | Route | Canvas | Load ms | Horizontal overflow @1366 |
|---|---|---|---|---|
| data-dash | /math/games/u8-data-dash/ | 820×600 | 20929 | no |
| decimal-dash | /math/games/u1-decimal-dash/ | 820×600 | 14068 | no |
| stats-slam | /math/statistics/games/unit8-stats-slam.html | 1024×768 | 7076 | no |
| ratio-rush | /math/games/u3-ratio-rush/ | 820×600 | 14828 | no |
| ratio-kitchen | /math/unit-3/6-rp-1game/ | 1024×768 | 15128 | no |
| percent-power | /math/games/u4-percent-power/ | 820×600 | 9569 | no |
| discount-dash | /math/unit-4/games/unit4-discount-dash.html | 1024×768 | 12541 | no |
| area-attack | /math/games/u5-area-attack/ | 820×600 | 17199 | no |
| volume-blast | /math/games/u10-volume-blast/ | 820×600 | 13227 | no |
| area-architect | /math/unit-5/games/unit5-area-architect.html | 800×600 | 11525 | no |
| volume-vault | /math/unit-10/games/unit10-volume-vault.html | 420×280 | 2588 | no |
| factor-frenzy | /math/games/u1-factor-frenzy/ | none | 3965 | no |
| fraction-frenzy | /math/games/u2-fraction-frenzy/ | 820×600 | 14507 | no |
| expression-express | /math/games/u6-expression-express/ | 820×600 | 13506 | no |
| fraction-foundry | /math/unit-2/games/unit2-fraction-foundry.html | 900×620 | 5412 | no |
| expression-engine | /math/unit-6/games/unit6-expression-engine.html | 1024×768 | 8453 | no |
| coordinate-quest | /math/games/u9-coordinate-quest/ | 820×600 | 19576 | no |
| equation-quest | /math/games/u7-equation-quest/ | 820×600 | 19943 | no |
| equation-escape | /math/unit-8/games/unit7-equation-escape.html | 1024×768 | 15100 | no |
| variable-velocity | /math/unit-9/games/unit9-variable-velocity.html | 900×620 | 11687 | no |
| arcade-hub | /curriculum/arcade/ | none | 2024 | no |
| games-hub | /math/games/ | none | 1716 | no |
| practice-arcade | /math/games/practice-arcade/?unit=3 | 70×24 | 3844 | no |
| review-arcade | /math/review-arcade/ | none | 1604 | no |
| placement-quest | /math/games/placement-quest/ | none | 1381 | no |
| review-expeditions | /curriculum/review-expeditions/ | none | 1318 | no |

Load times were taken while the machine ran at load average 50-70 (other sessions), so they are an upper bound, not a performance measurement; percent-power timed out once at 30 s under that load and loaded in 9.6 s on rerun. Representative Chromebook performance was not measured.

## Verification run

- `node tools/arcade-models.test.mjs`: renderers + equation parser, pass
- `node tools/validate-arcade-models.mjs`: registry, hub cards, flagship model/coach, renderer contract, pass (self-tests first)
- `npm run validate:game-rules`, `validate:expeditions`, `validate:js-syntax`, `validate:gate-coverage`: pass
- `npm run typecheck`: no regression (565/651 files, 86 marked)
- browser audit before/after on `dist/` (this directory)

## Not done (needs separate work, not claimed)

- Mechanic redesigns for the 20 games (balance bridge, water-flow simulation, 3D cube construction, railway switching, etc.). The shared model layer is the foundation; no game's core loop was rewritten.
- Models still without a renderer: `factor-tree`, `decimal-line`, `expression-tree` (registry reports them as planned).
- Shared misconception-feedback architecture beyond what exists (`why` maps per distractor in Equation Escape / Expression Engine / Variable Velocity; `NTAdaptive`; `data`-driven misconceptions in `games2d`). Not extended, not validated per question family.
- Unified progression framework (stars / restoration / Citadel / relics): inspected, not changed.
- Full playthrough of every game, keyboard-only and touch runs, screen-reader pass, 200% zoom, Safari/tablet, native Spanish review, performance and memory measurement beyond load time.
- Review Expeditions unit-coverage audit and Placement Quest readiness-claims audit.
