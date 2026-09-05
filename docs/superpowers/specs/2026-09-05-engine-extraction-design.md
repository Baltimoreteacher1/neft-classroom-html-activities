# Engine Extraction — Phase 1 Design

**Date:** 2026-09-05
**Status:** Approved (scope decisions locked by Joel 2026-09-05; execution delegated)
**Project:** Productize the eduwonderlab lesson engine. Phase 1 of 4 (Extract → Manifest-ize → Tenant #2 → Foreign curriculum).

## Goal

Extract the browser-side lesson runtime into a workspace package, `@eduwonderlab/engine`,
with **zero visible change** to eduwonderlab.com. Success = the built site is byte-identical
before and after, and the engine has a real package boundary that later phases (multi-tenant
platform) can consume.

## Locked scope decisions

| Decision         | Choice                                                                          |
| ---------------- | ------------------------------------------------------------------------------- |
| First milestone  | Clean extraction only — no tenancy, no auth, no new users                       |
| Repo shape       | npm workspace package inside this repo (`packages/engine`), not a separate repo |
| Extraction scope | Runtime engine only — generators stay as-is (Phase 2)                           |
| Parity bar       | Byte-identical `dist/` output (modulo build stamp) at every milestone           |

## What becomes the package

**Revised 2026-09-05 during planning:** a reference inventory found **132 files in
`tools/` and `scripts/`** that reach into `engine/` by path. Physically relocating the
directory would force edits to all 132 under the byte-identical bar for zero functional
gain, and symlink shims are banned (Drive mirror never syncs symlinks). So Phase 1
declares **`engine/` itself as the workspace package, in place**: `engine/package.json`
(name `@eduwonderlab/engine`) plus `"workspaces": ["engine"]` in the root
`package.json`. The boundary is the package manifest + exports map + standalone test
run — not the directory's address. Physical relocation to `packages/` is deferred to
Phase 2, after the 132 external imports are rerouted through the package entry points.

The package covers `engine/` (230 files, ~88k JS lines, 12 stylesheets, 36 colocated
tests): `engine/core/` (lesson-renderer, app, present-mode, notebook-checkpoint,
teacher/tools/levels modes, misconceptions, hint-ladder, i18n, score-reporter,
small-group sub-engine), `engine/components/` (77 manipulatives), `engine/styles/`
(incl. design-system.css), and `engine/templates/flagship/`.

The `@engine` Vite alias, the 367 per-lesson `lesson.js` boot files, and all lesson
HTML are untouched.

## What explicitly does NOT move (Phase 1)

- `shared/` and `assets/` runtime globals (`save-resume-engine.js`, `learning-supports`,
  `lesson-shell-guard`, `edupulse-bridge`, `math-workbench-launcher`, …). These are loaded
  by **absolute URL from 3,453 committed HTML files**; moving them means rewriting
  committed HTML — out of scope, deferred to a later step with its own parity run.
- The `inject-*` post-processor pipeline (~30 tools that rewrite committed HTML in place).
- `curriculum/runtime/*` (instance app surface, not the lesson engine).
- All backends: `functions/`, `lti-worker/`, `results-worker/`, `workers/*`, sync workers.
- All generators (`scripts/`, `tools/`) — they are updated only where they import engine
  files by path, never restructured.
- Every committed/generated HTML file and everything under `data/`.

## Package shape

```
packages/engine/
  package.json      # name: @eduwonderlab/engine, type: module, private for now
  README.md         # what it is, how lessons boot it, what it must not depend on
  src/              # former engine/ contents, unchanged layout (core/, components/, styles/, templates/)
```

- Root `package.json` gains `"workspaces": ["packages/*"]`.
- No build step for the package itself in Phase 1 — Vite keeps bundling from source via
  the alias, exactly as today. An exports map is added but the alias remains the only
  consumer path until Phase 2.
- Colocated `*.test.mjs` move with their modules; the root test runner
  (`tools/run-tests.mjs`) and vitest/biome/typecheck globs are updated to the new path.

## Reference inventory (documented, not churned)

Because the package is declared in place, no path references change in Phase 1. The
132-file inventory of `tools/`+`scripts/` files that import engine internals is
committed as a spec appendix (`2026-09-05-engine-reference-inventory.md`) — it is the
Phase 2 worklist for rerouting external consumers through the package's exports map.
The only files edited in Phase 1: root `package.json` (+ lockfile, intentionally, for
the workspace entry), new `engine/package.json`, new `engine/README.md`, the parity
harness under `tools/parity/`, and these docs.

## Parity harness (built first, before anything moves)

`tools/parity/parity-check.mjs`, two modes:

- `--snapshot <manifest.json>`: after a full `npm run build`, walk `dist/`, apply the
  normalization rules (strip the build stamp written by `tools/stamp-build.mjs` into
  `dist/access-practice-lab/config.json` and stamped HTML, plus any nondeterminism
  found by the M0 double-build probe — each rule documented in the script with its
  reason), and write `{relativePath: sha256}` sorted JSON.
- `--compare <manifest.json>`: snapshot the current `dist/` the same way and diff
  against the stored manifest. Any added/removed/changed entry = FAIL, printed in full.

The baseline manifest is produced once at the branch point (main `17191d6a4`) by
building twice and reconciling — bytes that differ between two builds of the same
commit are nondeterminism to normalize, never waved through silently.

Vite content-hashed filenames make this strict: identical inputs ⇒ identical hashes ⇒
identical names. Any drift shows up as renamed files, not just changed bytes.

Run at milestones (the build chain — ~20 generator steps + ~370 Vite entries — is too
heavy per-commit). Milestones: after workspace scaffolding (expect no-op), after the
`git mv` + reference updates, and before handing the branch to Joel.

## Execution plan shape

1. **M0 — baseline + determinism probe:** commit the parity harness; build **twice** at
   the branch point and diff the two runs against each other — every differing byte is
   build nondeterminism and becomes a documented normalization rule; the normalized
   manifest is the stored baseline.
2. **M1 — the package:** root `workspaces: ["engine"]`, `engine/package.json` with
   exports map, `npm install` (lockfile updated intentionally), engine tests runnable
   standalone via `npm test -w @eduwonderlab/engine`. Build, parity vs baseline.
3. **M2 — hygiene + handoff docs:** `engine/README.md` (boundary contract), reference
   inventory appendix, full `npm test` + `lint` + `typecheck`, final parity run.
4. Hand off: branch stays local; Joel reviews and ships via the guarded ship pipeline.
   No push, no deploy from this project.

## Error handling / rollback

- All work on `feat/engine-extraction` in the dedicated `wt-engine-extract` worktree.
  The canonical checkout, `nca-adaptive`, and the night-shift runner are untouched.
- Any parity failure stops the milestone; the fix goes in before proceeding. If a
  normalization exception is ever needed (harmless byte churn), it is documented in the
  parity script with the reason — never waved through silently.
- Rollback is `git branch -D` + worktree removal; nothing outside the worktree changes.

## Testing

- Parity harness (primary gate, defined above).
- `npm test`, `npm run lint`, `npm run typecheck` at M2 and M3.
- Engine's 36 colocated tests must run from their new location.
- No new runtime behavior exists in Phase 1, so no new behavioral tests — the deliverable
  is a boundary, verified by parity.

## Out-of-scope risks acknowledged for later phases

- Absolute-URL runtime globals and the inject pipeline are the largest remaining
  single-tenant couplings; they need their own phase with committed-HTML rewrites.
- `cssCodeSplit: false` (single bundled stylesheet) is a deliberate instance decision the
  package must not hard-code forever.
- Reveal-aligned content stays instance-only; the package must never absorb curriculum
  content (copyright boundary).
