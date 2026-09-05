# Phase 2b — Curriculum Source Layer

**Date:** 2026-09-05
**Status:** Approved (Joel 2026-09-05: "handle all of it"; design delegated)
**Parent:** `2026-09-05-engine-extraction-design.md` (Phase 2 of the productization plan)

## Decisions made here

1. **The physical `engine/` → `packages/` move is CANCELLED**, not deferred. After
   Phase 2a, the boundary that matters is enforced logically: imports go through
   `@eduwonderlab/engine` (gated by `validate:engine-imports`), and the package
   manifest + exports map define the surface. The remaining 134 path-string
   references are tests/validators reading engine files as _text_ (source-invariant
   greps), which is analysis, not coupling. Rewriting them buys a cosmetic
   directory layout at real regression risk in the repo's most safety-critical
   files. If a future phase needs the repo split, this decision gets revisited
   with that phase's spec.

2. **Phase 2b = one canonical curriculum access layer + a ratchet**, not a
   big-bang migration. 217 files in `tools/`+`scripts/` read `lessons/` directly
   today; each one hardcodes the assumption that curriculum == this directory
   layout. Multi-tenancy (Phase 3+) requires swapping the source behind ONE seam.
   The seam is built now, the flagship generators are migrated to prove it, and a
   ratchet pins the direct-reader count so it can only shrink — the same idiom as
   `typecheck-ratchet` (`@ts-nocheck` count may only shrink).

## The module — `tools/lib/curriculum-source.mjs`

The single place that knows where curriculum content lives and how it is shaped:

```js
export const REPO_ROOT;      // absolute
export const LESSONS_DIR;    // absolute — the only copy of this path
export const CORE_ID_RE;     // /^\d+-\d+$/ — core lesson id shape
export function listLessonDirs({ filter } = {});
  // sorted dir names under LESSONS_DIR that contain a config.json;
  // filter: optional RegExp applied to the dir name (e.g. CORE_ID_RE)
export function lessonPath(id, ...segments);   // join(LESSONS_DIR, id, ...)
export function loadLessonConfig(id);          // parsed config.json (throws on absence)
export function tryLoadLessonConfig(id);       // null instead of throwing
```

Deliberately thin: no caching (generators run once per process), no schema layer
(that is a later phase, and inventing one now would be speculation), no writes
(generators keep their own `writeGenerated` discipline).

## The ratchet — `tools/curriculum-source-ratchet.test.mjs`

Counts files under `tools/` and `scripts/` that access `lessons/` directly
(readdir of the lessons dir, string paths joining into it) instead of through
the module. The count is pinned; a new direct reader fails `npm test` with
instructions to use `curriculum-source.mjs`. Migrating a file lowers the pin
in the same commit. Runs in `npm test` like every ratchet. Self-tests its
detector against known-positive and known-negative fixtures first.

## First migrations (prove the seam)

`scripts/generate-worksheets.mjs`, `scripts/generate-notes.mjs`,
`scripts/generate-slides.mjs`, `tools/generate-small-group-lessons.mjs`,
`scripts/generate-printable-lesson.mjs` — the fleet generators (and one build
chain member). Each migration is enumeration/config-loading only; generation
logic is untouched.

## Verification bar

- Regenerated output must be byte-identical: `generated-pages-fresh`,
  `validate:printables-fresh`, and the dist parity harness across the full build.
- Full `npm test` + `check` (run bare — exit codes, never piped), the validate
  chain members that cover generators (`validate:generator-safety`,
  `eval:small-groups`), and the ship gate.

## Out of scope (recorded so it stays deliberate)

- Migrating all 217 readers (the ratchet drives that incrementally).
- A curriculum manifest _schema_ / foreign-curriculum support — Phase 3 design.
- Any change to lesson content, generated output, or the engine package.
