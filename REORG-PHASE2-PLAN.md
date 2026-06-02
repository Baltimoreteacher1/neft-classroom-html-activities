# Phase 2 Plan — Unit-First Consolidation (remaining work)

> Decisions (made autonomously, per "you decide and move forward"):
>
> 1. Canonical unit home = **existing `math/unit-N/`** (it already has `index.html`, `projects/`, `supplemental/`). **No parallel `/unit-N/` tree.**
> 2. **`lessons/<u>-<l>/` stay in place** — they are Vite build entrypoints; moving them breaks the build. `math/unit-N/` links to them.
> 3. Redirects go through **`data/routes.json` → regenerate** with `node tools/generate-route-files.mjs`. Never hand-edit `_redirects`.
> 4. After any folder move, **regenerate** `catalog.json`, `registry.json`, `launch-manifest.json` and run `node tools/validate-static-site.mjs` (baseline issues: `teacher-tools/assign/*`, scattered missing-viewport — not regressions).

## ✅ DONE in this branch (`cleanup/reorganize-hub`)

- Retired `statistics-data/stats-of-my-life` (43-line stub) → repointed main-hub cards + theme card removed; 301 added.
- Retired `expressions-equations/ind-dep-varaibles` (91-line "Spelling Redirect" stub) → theme card removed; 301 added.
- Regenerated `_redirects` + `registry.json`. Validator clean (no new broken links).
- **Correction to Phase 1:** `statistics-data/6-sp-a-1game-2` is NOT a duplicate — it's a distinct **"News Reporter"** game (run-a-newsroom theme) for 6.SP.A.1. **Kept.** Likewise verify before retiring any "cluster" member below.

## Remaining migration (NOT executed — needs per-folder link verification)

### A. Consolidate unit-level games → `math/unit-N/games/`

⚠️ The 10 single-file games in `games/unitN-*.html` are referenced by `games/3d/unit-N/index.html` (10 referrers). Each move must update its referrer + add a 301.

| Move                                                                      | Referrer to update           |
| ------------------------------------------------------------------------- | ---------------------------- |
| `games/unit1-factor-frenzy.html` → `math/unit-1/games/factor-frenzy.html` | `games/3d/unit-1/index.html` |
| `games/unit2-fraction-kitchen.html` → `math/unit-2/games/`                | `games/3d/unit-2/`           |
| … (units 3–10, same pattern)                                              | `games/3d/unit-N/`           |
| `math/games/u1-decimal-dash`, `u1-factor-frenzy` → `math/unit-1/games/`   | `math/games/index.html`      |

### B. Fold theme folders → units (split by standard; theme folders span MULTIPLE units)

Move each sub-activity into `math/unit-N/{games|supplemental}/` by its standard:

- `number-system/` → 6.NS.2-4 to **U1**, 6.NS.1 to **U2**, 6.NS.5-8 (integers/coords) to **U9**
- `ratios-proportions/` → 6.RP.1/3a to **U3**, 6.RP.2/3b-d to **U4**
- `expressions-equations/` → 6.EE.1-4 to **U6**, 6.EE.5-8 to **U7**, 6.EE.9 to **U9**
- `statistics-data/` → all **U8** (clean 1:1)

Per sub-activity: `git mv` → add 301 to routes.json → update referrers in the theme `index.html` AND main `index.html` AND `directory/` (catalog-driven, so regenerate catalog). Keep the theme `index.html` as a thin redirect page OR retire once empty.

### C. Retire redundant top-level practice dirs into `math/unit-N/supplemental/`

`unit-1/`, `unit-4/`, `unit-5/`, `unit-5-practice/` → fold content into `math/unit-1|4|5/supplemental/`, add 301s, retire. (`unit-1/6-1game` → `lessons/6-1/game/` — it's lesson-specific.)

### D. Dedup candidates to verify-then-retire (diff first!)

- `number-system/6-ns-b-4review` vs `6-ns-b-4review1` (both 20K — likely true twin)
- `expressions-equations/` 6.EE.C.9 game pile — **play-test each**; several are distinct themes (Martian, Variable Velocity, Function Forge), NOT all dups.
- `histogram-master-lab` (276K, keep) vs `histogramhero` (44K)

### E. Naming normalization (after moves settle)

Adopt student-facing descriptive slugs; record standard in `config.json`/catalog metadata. Retire AI-artifact slugs: `5-5gemini`, `gemini-data-quest`, `*googleversion`, `*roblox`, `6eec9testproject`, `unit5worldarchitectureprojet` (misspelling).

### Cross-unit items — STAY top-level (do not fold)

`mcap-review`, `summer-bridge`, `spiral-review`, `vocab-hub`, `math/vocab-deck`, `graphic-novels`, `teacher-tools`, `dashboard`, `neft-data-studio`, `teacher-data-dashboard`, `blood-on-the-river`, `wida-access`, `esol*`, `math/finder`, `curriculum`, `end-of-year`, `world-architect-math-project` (Start-Up City), `games/3d` (3D hub), `directory`, `refugee`, `ecology-noam`.

**Execution note:** do B/C incrementally — one unit at a time, validate + (optionally) `npm run build` between units, commit per unit. Do NOT batch all 90 moves before validating.
