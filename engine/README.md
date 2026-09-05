# @eduwonderlab/engine

The browser-side lesson runtime: renderer (`core/lesson-renderer.js`), boot shell
(`core/app.js`, `templates/flagship/flagship.js` → `bootFlagship(config)`), present
mode, notebook checkpoints, teacher/tools/levels modes, misconceptions + hint ladder,
i18n/voice, score reporting, the small-group sub-engine, 77 manipulatives
(`components/`), and the design system styles (`styles/`).

## How lessons use it

Each lesson ships a 3-line `lesson.js`:
`import { bootFlagship } from "@engine/templates/flagship/flagship.js"` plus its
`config.json`. The `@engine` Vite alias points here; Vite bundles from source. There
is no separate package build step.

## Boundary contract

Phase 1 of the extraction — see
`docs/superpowers/specs/2026-09-05-engine-extraction-design.md`.

- This package must stay curriculum-agnostic: no imports from `lessons/`, `data/`,
  `curriculum/`, or anything Reveal-aligned. Curriculum flows in through
  `bootFlagship(config)` only. (Colocated `*.test.mjs` fleet sweeps may read
  `lessons/` as test evidence — resolved from `import.meta.url`, never cwd.)
- Known Phase 1 leaks (do not add more): 132 files in `tools/` and `scripts/` import
  engine internals by path — inventory in
  `docs/superpowers/specs/2026-09-05-engine-reference-inventory.md`. Phase 2 reroutes
  them through this package's exports map before the directory can move.
- Runtime siblings that are NOT part of this package (loaded by absolute URL from
  committed HTML, so moving them means rewriting 3,453 pages): `shared/save-resume/`,
  `assets/learning-supports/`, `assets/lesson-shell-guard.js`,
  `assets/edupulse-bridge.js`, `assets/math-workbench-launcher.js`.

## Tests

`npm test -w @eduwonderlab/engine` — the colocated `*.test.mjs` files, standalone.
The root `npm test` tree walk picks the same files up, so they gate every push
either way.
