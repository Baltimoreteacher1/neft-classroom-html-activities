# EWL Curriculum 2.0 — one shared engine (Mission cockpit, Pocket Reference, Living Math Canvas, Math Reality Lab, Fluency Spiral)

Status: build contract. Joel asked for two briefs ("Curriculum 2.0" and "Living Math Canvas + Math Reality Lab") on 2026-10-15. They overlap
(isomorphic lens = canvas; counterexample forge / executable discourse = reality lab arguments; EWLStateStore = progress + notebook),
so they are built once, on one core, and wired into the surfaces students already use.

## 1. Rules that outrank this document

* **Reuse before new.** Existing student pathways, progress records and curriculum alignment win over new routes. Only two new
  routes exist: `/curriculum/math-canvas/` and `/curriculum/reality-lab/`. Everything else extends an existing surface
  (hub `/curriculum/`, learning labs, notes studio, extra help, fluency, my-progress).
* **Additive only.** No existing URL changes what it answers. `?teacher=1` on `/curriculum/` keeps today's teacher console unchanged.
* **Joel's standing rules for student activities:** no timers or countdowns; no worked solution after a wrong pick (help comes as a
  question, then a picture, then a counterexample; the checked result is shown only when the student presses "Show checked result" after at least two attempts); no links that leave the activity for a hub mid-task.
* **Unit numbering is the repo's** (Reveal TOC): stats = 2, ratios = 3, percent = 4, geometry = 5, fractions/exponents/expressions = 6,
  integers/coordinates = 7, equations/inequalities = 8, two-variable = 9. Unit 10 is not taught: build nothing for it.
* **No name, section or student id is stored or sent.** State lives in `localStorage` (`ewl_state_v1`) and rides existing Save/Resume.
* **Math is exact.** Judge equality with `EWL.Rat.eq`, never floats. `Rat.num()` is for drawing only.
* **Correctness is deterministic.** `EWL.Reason` decides right/wrong/which misconception. AI (`EWL.Reason.coach`) is optional, advisory, labelled, and never required.
* Bilingual: every student-visible string has an `…Es` sibling; `EWL.t(en, es)`; `?lang=es`.
* Build DOM with `EWL.h` / `EWL.svg`. Never `innerHTML` with data, URL values or student text.
* Accessibility: keyboard-complete, 44px targets, visible focus, `aria-live` via `EWL.announce`, figures have `<title>`/`aria-label`
  text alternatives, meaning is never color-only (shape/pattern/label too), reduced motion respected, 375px no horizontal scroll.
* Files: ≤500 lines each (hard cap 750). Plain-browser IIFE scripts on `window.EWL`, no dependencies, no build step. No `@ts-nocheck`.
* Formatting: run `node_modules/.bin/biome check --write <your files>` before you finish. Plain `npx biome` does not work here.

## 2. Core (already written — read these first)

| File | Provides |
| --- | --- |
| `assets/ewl/rational.js` | `EWL.Rat` exact BigInt rationals: `Rat.of`, `Rat.parse("3/5" \| "0.6" \| "60%" \| "1 1/2")`, `add/sub/mul/div/pow/cmp/eq`, `frac/mixed/decimal/percent`, `Rat.names(r)`, `Rat.equivalents(r, dens)` |
| `assets/ewl/state-store.js` | `window.EWLStateStore` (= `EWL.state`): lesson/unit, mission stages, Check-Yourself flags, vocab tokens, fluency HUD, evidence (`addEvidence(activityId, entry)`), canvas progress (`setCanvas`), URL hydration, Base64 passport, `selfTest()` |
| `assets/ewl/reasoning.js` | `EWL.Reason`: misconception rules, `diagnose`, `ladder` (question → picture → counterexample → reveal), `scoreArgument` rubric, optional `coach` |
| `assets/ewl/ui.js` | `EWL.h`, `EWL.svg`, `EWL.t`, `EWL.lang`, `EWL.announce`, `EWL.rng` (mulberry32), `EWL.hash`, `EWL.id(kind, slug)`, `EWL.flags()`, `EWL.json(url)` |
| `assets/ewl/lab-registry.js` | `EWL.Lab.registerMode`, `EWL.Lab.context` (see file header) |
| `assets/ewl/ewl.css` | tokens + `.ewl-card .ewl-btn .ewl-chip .ewl-msg .ewl-fig .ewl-sr` |
| `tools/lib/ewl-vm.mjs` | `loadEwl({only})` loads `assets/ewl/*.js` into a node:vm context for tests |
| `tools/ewl-core.test.mjs` | tests for the three core modules (pattern to copy) |

Script load order on every EWL page: `rational.js, state-store.js, reasoning.js, ui.js, lab-registry.js` then the surface's own files.
Never change a core file; if you need a core change, say so in your report.

Stable activity ids: `ewl.<canvas|lab|forge|invariant|discourse|fluency|sketch|lens|reference>.<slug>`; validated by `EWL.id`.
They are the key for evidence, progress, teacher summary and printables. Never rename one after it ships.

## 3. Surfaces and ownership

| Surface | Route | Owner files |
| --- | --- | --- |
| Isomorphic Lens + Living Math Canvas | `/curriculum/math-canvas/` | `assets/ewl/lens*.js`, `assets/ewl/canvas*.js`, `assets/ewl/canvas.css`, `curriculum/math-canvas/index.html`, `data/ewl/canvas-scenes.json`, `tools/ewl-canvas.test.mjs` |
| Math Reality Lab (shell, Investigate mode, Evidence Notebook, Executable Discourse) | `/curriculum/reality-lab/` | `assets/ewl/lab.js`, `assets/ewl/lab-*.js` (not `lab-registry.js`), `assets/ewl/notebook*.js`, `assets/ewl/discourse*.js`, `assets/ewl/lab.css`, `curriculum/reality-lab/index.html`, `data/ewl/investigations.json`, `tools/ewl-lab.test.mjs` |
| Counterexample Forge, Invariant Hunter, Sketch compiler (modes of the Reality Lab) | `/curriculum/reality-lab/?mode=forge\|invariant\|sketch` | `assets/ewl/forge*.js`, `assets/ewl/invariant*.js`, `assets/ewl/sketch*.js`, `assets/ewl/modes.css`, `data/ewl/forge-bots.json`, `data/ewl/invariants.json`, `tools/ewl-modes.test.mjs` |
| Mission Control cockpit + Pocket Reference | `/curriculum/` (student view, no `?teacher=1`), drawer on EWL pages | `assets/ewl/cockpit*.js`, `assets/ewl/cockpit.css`, `assets/ewl/reference*.js`, `assets/ewl/reference.css`, `data/ewl/pocket-reference.json`, `tools/ewl-cockpit.test.mjs` |
| Fluency Spiral, `?diag=1`, integration into labs / my-progress / extra-help / notes-studio / registration / gates | existing pages | lead |

Agents do not edit another owner's files, `curriculum/index.html` (except the cockpit owner, minimally: one mount `<div>` and the script/link tags),
`curriculum/learning-labs/**`, `scripts/**`, `package.json`, `data/catalog.json`, or generated files. Do not commit. Do not run generators, `qa:fast`, or `npm test`.
Run your own test with `node tools/<yours>.test.mjs` and check the page in a browser (Playwright is installed; serve the worktree with
`python3 -m http.server <your port>`). Your report lists files, what you verified, and anything you need from the lead.

## 4. Interfaces between surfaces

* Canvas deep link: `/curriculum/math-canvas/?scene=<sceneId>&lesson=<id>&lens=<tape\|dnl\|table\|plane\|balance>&preset=<presetId>&lang=es`.
  Scene ids and presets come from `data/ewl/canvas-scenes.json`. Unknown values are ignored, not errors.
* Reality Lab deep link: `/curriculum/reality-lab/?inv=<investigationId>&mode=<modeId>&lesson=<id>`.
* `EWL.Lens.mount(host, spec)` → `{ set(valueText), highlight(partId\|null), onChange(fn), reps(), destroy() }` — also used by Reality Lab investigations that need a picture.
* Evidence entry (what every mode saves with `ctx.evidence(activityId, entry)`): `{ claim?, prediction?, data?, argument?, ok?, rule?, note? }`; the notebook renders any subset.
* Teacher view: `?teacher=1` on the canvas and lab pages shows an "Evidence" panel from this device's notebook (print + copy summary). It does not read other students' data; class-level views remain the existing teacher tools.
* The cockpit reads `/data/curriculum-launch-manifest.json` (84 lessons, `resources{}`), `/data/ewl/integration-map.json` (lead-owned: lesson → canvas scene / investigation / learning lab) and `EWLStateStore`.

## 5. Tests and evidence required of every surface

1. Pure logic in a `tools/ewl-*.test.mjs` that runs under `node` via `tools/lib/ewl-vm.mjs` (or jsdom for DOM), with negative controls (a corrupted answer / rule / data row must be rejected).
2. Data validated by a function the test calls (shape, bilingual fields, ids valid against `EWL.ID_RE`, lesson ids exist in the launch manifest and in the right unit).
3. A real-browser pass at 375, 768, 1280 widths: no console errors, no horizontal overflow, keyboard path completes the main task, `?lang=es` shows Spanish.
4. `?diag=1` support: every page exposes `EWL.selfTest` entries (each module registers `EWL.selfTests.push({name, run})`); the lead renders them.
