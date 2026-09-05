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

## What moves

`engine/` (230 files, ~88k JS lines, 12 stylesheets, 36 colocated tests) moves to
`packages/engine/src/` via `git mv`, published in-repo as the workspace package
`@eduwonderlab/engine`. This includes: `engine/core/` (lesson-renderer, app,
present-mode, notebook-checkpoint, teacher/tools/levels modes, misconceptions,
hint-ladder, i18n, score-reporter, small-group sub-engine), `engine/components/`
(77 manipulatives), `engine/styles/` (incl. design-system.css), and
`engine/templates/flagship/`.

The `@engine` Vite alias repoints to `packages/engine/src`, so the 367 per-lesson
`lesson.js` boot files (`import { bootFlagship } from "@engine/..."`) and all lesson
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

## Reference updates (exhaustive, not sampled)

Every reference to the `engine/` path must be found and updated in one pass:

1. `vite.config.js` — `@engine` alias, the `engine/homework-lesson-models.js` entry,
   `copyStandaloneHtml` skip list (add `packages/`, keep skipping the old path until it
   is gone).
2. Any `import`/`readFile`/glob in `tools/` (522 files) and `scripts/` (410 files) that
   touches `engine/` by relative or root-relative path — discovered by grep for
   `engine/`, `../engine`, `@engine` across the repo, excluding `lessons/`, `dist/`,
   committed HTML.
3. Validator globs among the 104 `validate:*` scripts that scan `engine/`.
4. Config: `biome`, `tsconfig`/typecheck-ratchet file lists, vitest config, playwright
   config, `.gitignore` patterns if any mention `engine/`.
5. `package.json` scripts referencing `engine/` paths.

Rule: the grep inventory is produced first and committed with the change, so the diff
reviewer can see the full reference set, not a sample.

## Parity harness (built first, before anything moves)

`tools/parity/parity-check.sh`:

1. Build candidate (current worktree): full `npm run build` → snapshot `dist/` to a
   scratch dir.
2. Build baseline (merge-base with `main`) in a throwaway worktree with its own
   `npm ci` → snapshot its `dist/`.
3. Normalize both: strip the build stamp (`stamp-build` output) and any other
   known-variable bytes (list maintained in the script; each normalization documented).
4. `diff -r` the trees. Non-empty diff = FAIL, printed in full.

Vite content-hashed filenames make this strict: identical inputs ⇒ identical hashes ⇒
identical names. Any drift shows up as renamed files, not just changed bytes.

Run at milestones (the build chain — ~20 generator steps + ~370 Vite entries — is too
heavy per-commit). Milestones: after workspace scaffolding (expect no-op), after the
`git mv` + reference updates, and before handing the branch to Joel.

## Execution plan shape

1. **M0 — baseline:** `npm ci`, full build, record dist manifest. Commit parity harness.
2. **M1 — workspaces scaffolding:** root workspaces field + empty `packages/engine`
   `package.json`. Build must be byte-identical (pure no-op).
3. **M2 — the move:** `git mv engine packages/engine/src`, apply the full reference
   inventory, build, parity check, full test suite + lint + typecheck ratchet.
4. **M3 — package hygiene:** README, exports map, engine tests runnable standalone
   (`npm test -w @eduwonderlab/engine` or equivalent), docs note in repo docs.
5. Hand off: branch stays local; Joel reviews and ships via the guarded ship pipeline.
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
