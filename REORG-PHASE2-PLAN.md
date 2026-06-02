# Phase 2 Plan — Unit-First Consolidation

> Decisions (made autonomously, per "you decide and move forward"):
>
> 1. Canonical unit home = **existing `math/unit-N/`** (has `index.html`, `projects/`, `supplemental/`). No parallel `/unit-N/` tree.
> 2. **`lessons/<u>-<l>/` stay in place** — Vite build entrypoints.
> 3. Redirects via **`data/routes.json` → regenerate**. Never hand-edit `_redirects`.
> 4. After any move: regenerate `catalog.json`/`registry.json`/`launch-manifest.json`, run `node tools/validate-static-site.mjs` (baseline issues: `teacher-tools/assign/*`, scattered missing-viewport — not regressions).

## ✅ DONE & VERIFIED in branch `cleanup/reorganize-hub`

- Retired `statistics-data/stats-of-my-life` (43-line stub) → cards repointed to `statistics-of-my-life` (1368-line project).
- Retired `expressions-equations/ind-dep-varaibles` (91-line "Spelling Redirect" stub) → `ind-dep-variables` canonical.
- 4× 301s added via `routes.json`; `_redirects` + `registry.json` regenerated.
- **Verified by serving locally + screenshotting both hub pages:** grids render clean, no empty/broken cards, winners present, retired paths 404 locally (301 on Cloudflare).
- **Phase 1 correction:** `statistics-data/6-sp-a-1game-2` = distinct **"News Reporter"** game, NOT a duplicate. Kept.

## 🛑 BLOCKED — unit fold cannot proceed until a curriculum-integrity decision is made

**The repo has TWO conflicting unit-numbering systems, and the `math/unit-N` hubs are internally inconsistent.** Folding activities "by unit" now would freeze the contradiction into the live site.

### Verified classroom `math/unit-N` map (from hub titles) vs. Reveal `lessons/N-x`

| Classroom `math/unit-N` | Hub title                                  | Standards | But its lesson links go to… | `lessons/N-x` actually is                |
| ----------------------- | ------------------------------------------ | --------- | --------------------------- | ---------------------------------------- |
| unit-1                  | Number Sense                               | 6.NS.2-4  | lessons/1-\*                | 6.NS factors/decimals ✅                 |
| unit-2                  | Fraction Division                          | 6.NS.1    | lessons/2-\*                | 6.NS.1 ✅                                |
| unit-3                  | Ratios & Rates                             | 6.RP      | lessons/3-\*                | 6.RP ✅                                  |
| unit-4                  | Rates/Percents/Unit Rates                  | 6.RP      | lessons/4-\*                | 6.RP ✅                                  |
| unit-5                  | Area                                       | 6.G.1     | lessons/5-\*                | 6.G.1 ✅                                 |
| unit-6                  | Expressions                                | 6.EE.1-4  | lessons/6-\*                | 6.EE.1-4 ✅                              |
| **unit-7**              | **Integers & Coordinate Plane** (6.NS.5-8) | —         | **lessons/7-\***            | **6.EE.5-8 equations/ineq ❌ MISMATCH**  |
| **unit-8**              | **Equations & Inequalities** (6.EE.5-8)    | —         | **lessons/8-\***            | **6.SP statistics ❌ MISMATCH**          |
| **unit-9**              | **Two-Variable Relationships** (6.EE.9)    | 6.EE.9    | **lessons/9-\***            | **6.NS.5-8 integers/coords ❌ MISMATCH** |
| unit-10                 | Volume & Surface Area                      | 6.G.2/4   | lessons/10-\*               | 6.G.2/4 ✅                               |

**Two concrete problems:**

1. **Units 7/8/9 hubs link to mis-matched lessons.** e.g. `math/unit-8` (titled Equations) links to `lessons/8-1..8-7` which are _statistics_. `math/unit-8`'s own subfolders (`8-1-understand-equations`…) are equations — so the hub contradicts its own lesson links.
2. **Statistics (6.SP) has no `math/unit-N` home.** It lives only in standalone `statistics-data/` + `math/statistics/` ("Statistics & Data — Unit Collection", which correctly links lessons/8-\*). So there is no clean "Unit N" to fold `statistics-data/` into.

> Context: the prior branch was `feature/curriculum-integrity-auditor` — unit integrity appears to be actively in flux. Reorganizing on top of an in-flight integrity audit is unsafe.

### THE GATING QUESTION (only Joel can answer)

**Which unit numbering is canonical for the reorg — the Reveal lesson numbering (8 = Statistics) or the classroom `math/unit-N` numbering (8 = Equations, no stats unit)?** And should the unit-7/8/9 hubs' lesson links be corrected first? This determines where ~90 folders land.

## Remaining migration (run ONLY after the gating question is answered)

- **A. Unit-level games** → `math/unit-N/games/` (10 `games/unitN-*.html`; each referenced by `games/3d/unit-N/`).
- **B. Theme folders → units** (`number-system`, `ratios-proportions`, `expressions-equations`, `statistics-data`) split by standard — _using the CORRECTED unit map above_, per sub-activity: `git mv` → 301 → update referrers → regenerate catalog.
- **C. Retire redundant top-level practice dirs** (`unit-1/`,`unit-4/`,`unit-5/`,`unit-5-practice/`) into `math/unit-N/supplemental/`.
- **D. Dedup-after-diff:** `6-ns-b-4review` vs `…review1`; the 6.EE.C.9 game pile (several are DISTINCT themes — play-test, don't assume); `histogramhero` vs `histogram-master-lab`.
- **E. Naming normalization:** retire AI-artifact slugs (`5-5gemini`, `gemini-data-quest`, `*googleversion`, `*roblox`, `unit5worldarchitectureprojet`).

### Cross-unit items — STAY top-level

`mcap-review`, `summer-bridge`, `spiral-review`, `vocab-hub`, `math/vocab-deck`, `graphic-novels`, `teacher-tools`, `dashboard`, `neft-data-studio`, `teacher-data-dashboard`, `blood-on-the-river`, `wida-access`, `esol*`, `math/finder`, `curriculum`, `end-of-year`, `world-architect-math-project`, `games/3d`, `directory`, `refugee`, `ecology-noam`.

**Execute incrementally — one unit at a time, validate between units, commit per unit.**
