# Curriculum matrix, lesson tracks and engine map

Delivered from the "curriculum consolidation" brief as an additive subset. Nothing existing was removed or redirected.

## What shipped

| Piece | Where |
| --- | --- |
| Typed data contract | `types/curriculum.d.ts` (`CurriculumMatrix`, `MatrixUnit`, `MatrixLesson`) |
| Generated manifest (units 1-9, 78 lessons) | `data/curriculum/matrix.json`, built by `scripts/generate-curriculum-matrix.mjs` (`--check`) from the launch manifest, the units page, the EWL integration map and disk existence |
| Matrix dashboard | `/curriculum/matrix/` (`assets/curriculum-matrix.{js,css}`), Inspector drawer (never navigates), Ctrl/Cmd+K omnibar (`assets/curriculum-matrix-search.js`, pure and unit-tested) |
| Lesson Path tracks | `Core / Group 1 (Scaffold) / Enrichment` switcher on `/math/lesson-path/<id>/`, kept in `localStorage` (`lp_track`) and `?track=` |
| Teacher layer | Shift+T or `?teacher=1` on the lesson path: standards, pacing, link to the matrix. Metadata only |
| Print | `@media print` on the lesson path and matrix: no nav or buttons, black on white, `@page { margin: 15mm }`, no breaks inside steps |

## Decisions that differ from the brief

- Domains are the repo's MCCRS 2025 set (AT, NOS, GR, DS, MP), not RP/NS/EE/G/SP.
- Unit 10 is not taught and is excluded.
- `/curriculum/`, `/directory`, `/curriculum/map`, variant routes and PDFs stay as they are. No redirects, no master packs.
- No React or Next. The site is static HTML with plain browser scripts; the new pages follow that.
- The teacher layer never reveals answer keys or teaching guidance on the client. Teacher surfaces stay gated on the server (the auth contract is frozen), so the public page cannot leak them.

## The three "engines" already exist

The brief asked for BalanceEquivalence, RatioRate and CartesianPlane engines. The repo has them as EWL lenses and studio activities; a lesson mounts one through its entry in `data/ewl/integration-map.json`.

| Brief engine | Existing implementation |
| --- | --- |
| Balance / equivalence | `assets/ewl/lens-equation.js` (equation family) and the studio balance activity in `assets/studio-act/` |
| Ratio / rate | `assets/ewl/lens-ratio.js`, `lens-ratio-plane.js`; studio ratio mix and conversion-chain activities |
| Cartesian plane | `assets/ewl/lens-ratio-plane.js` and `lens-rational-line.js`; studio plot activity and `StudioViz` `coord` |

New engines should be added as lenses (`EWL.Lens`) and registered via `EWL.Lab.registerMode`, not as a parallel framework.
