# Design: True-3D Games + Flagship Lessons (All 10 Units)

**Date:** 2026-05-28
**Repo:** neft-classroom-html-activities
**Status:** Approved (verbal) — building

## Goal

Raise games and lessons to the highest level across all 10 Grade 6 units:
true 3D (Three.js) games where the math _is_ the mechanic, and a deepened
lesson engine plus a new flagship lesson template. Offline-friendly, deployed
on Cloudflare Pages, accessible to 6th graders.

## Hard Rules

- **No "ESOL" label anywhere** (UI or code). Use **"Level 1"** (support /
  scaffolded, vocab-first) and **"Level 2"** (enrichment / extension).
- **Vocab-first gate**: word + plain-language definition + image shown BEFORE
  any gameplay/activity. This is part of Level 1.
- Games are real games, not quiz wrappers — math drives the core mechanic.
- Mobile + Chromebook: keyboard AND touch input must both work.
- Reuse the shared design tokens (`assets/design-tokens.css`).
- Score reporting uses the existing Worker API (`/api/scores`); progress uses
  `/api/progress`. Offline falls back to localStorage and syncs when online.

## Architecture — Framework First

### 1. Shared 3D Game Framework — `games/engine3d/`

Single source of Three.js infrastructure every unit game imports.

- `core.js` — scene/camera/renderer/loop, responsive resize, asset+audio load
- `input.js` — unified keyboard + touch/pointer controls
- `hud.js` — DOM-over-canvas HUD: objective, score, lives, timer
- `vocab-gate.js` — Level 1 vocab intro (word + definition + image) before play
- `progress.js` — POST to `/api/scores` + `/api/progress`; localStorage fallback
- `a11y.js` — aria-live narration, full keyboard path, prefers-reduced-motion,
  captioned audio
- `feel.js` — particles, tweens, screen-shake, sound hooks
- `levels.js` — Level 1 / Level 2 difficulty selection + gating
- Three.js loaded via pinned CDN/import map (kept offline-cacheable by the hub SW)

**Contract:** each unit game exports `createGame(mountEl, { onScore, level })`
and consumes the framework modules; it never re-implements scene/HUD/input.

### 2. Upgraded Lesson Engine — extends `engine/`

- Adaptive difficulty: branch practice tier on live performance
- New manipulative components: 3D nets, algebra tiles, fraction bars,
  interactive coordinate plane (added under `engine/components/`)
- Level 1 / Level 2 framing enforced in the 6-phase flow; vocab-first
- **Flagship lesson template**: story/simulation-driven shell layered on the
  existing phase engine (`engine/templates/flagship/`)

### 3. The 10 Unit Games — `games/3d/unit-N/`

Math-as-mechanic per unit, e.g.:

- U1 Ratios/rates — balance ratio machines
- U2 Fractions — partition/combine in 3D
- U3 Rational numbers — number-line/3D space
- U4 Number system ops — build/break operations
- U5 Geometry/area — build 3D structures to a target area
- U6 Expressions — assemble expression machines
- U7 Integers — 3D integer navigation / opposites
- U8 Statistics — 3D data world
- U9 Coordinate plane — navigate 3D coordinate space
- U10 Volume — fill 3D prisms

### 4. Flagship Lesson Conversions

Convert each unit's lessons to the flagship template, Level 1 / Level 2 paths.

## Orchestration (Waves, committed)

Account-wide session limits are real; full set runs in committed waves so
nothing is lost and work resumes across resets.

- **Wave 1 (no deps):** 3D game framework; lesson-engine upgrade + flagship
  template. _Everything depends on these._
- **Wave 2 (exemplars):** 3 complete units (geometry/3D-heavy, ratios,
  expressions) proving both frameworks end-to-end.
- **Wave 3+:** parallel agents across the remaining 7 units (games + lessons).

Each unit ships on its own branch → PR for preview-deploy + incremental
approval. Frameworks land first and are verified before fan-out.

## Testing / Verification

- Framework: smoke-load in headless browser; input + score POST mocked.
- Games: each loads without console errors, vocab gate renders, score reports.
- Lessons: build passes; adaptive branch logic unit-tested.
- Accessibility: keyboard-only path + aria-live present per game.

## Risks

- **Session limits** mid-build → mitigated by waves + commit-after-each.
- **3D performance on Chromebooks** → low-poly budget, capped DPR, reduced-motion.
- **Bundle size** → shared framework + per-unit code-split; SW caches Three.js.
- **Consistency** → framework-first prevents per-unit drift.
