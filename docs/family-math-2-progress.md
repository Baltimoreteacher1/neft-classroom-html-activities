# Family Math 2.0 progress and continuation

Branch: `feat/family-math-2` (worktree `~/wt-family-math-2`, cut from `origin/main`). Target: https://eduwonderlab.com/math/fluency-lab/family/

## Specification of record
The directive pasted by Joel on 2026-10-26 is the only specification. The "original 23-part master prompt" it builds on was
requested and not supplied (FM-000, Blocked). If Joel supplies it, extract its requirements into
`docs/family-math-2-requirements.json` and rerun `node tools/fm2/trace.mjs --write`.

## Phase
1. Ledger + traceability tooling (done): `docs/family-math-2-requirements.json`, `tools/fm2/trace.mjs`, `tools/fm2/run-all.mjs`.
2. Shared core `math/fluency-lab/family/fm2/` (in progress).
3. Ten games, adaptive/session/coach/real-world logic, pages (not started).
4. Math suites, acceptance suites, E2E, visual QA (not started).
5. Independent review, fixes, release gates, deploy via `ALLOW_DEPLOY=1 npm run ship`, production verification (not started).

## Architecture decisions
- Games are modules under `fm2/games/<id>/` with pure logic (`logic.js`, unit tested against an independent oracle) split from DOM (`ui.js`).
- Requirement links are `@fm2 FM-xxx` tags in source and test files; `trace.mjs` derives the ledger. Do not hand-edit the ledger table.
- Progress is stored per learner profile under `ewl-fm2-v1` using the Fluency Lab `profileKey` helper, so profiles never share data.
- Language uses the Fluency Lab `getLang/setLang` (`ewl-fluency-lang-v1`) so the choice is shared with the rest of the lab.

## Commands
- `node tools/fm2/run-all.mjs --unit` / `--browser` record results; `node tools/fm2/trace.mjs --write` regenerates the ledger.

## Outstanding defects
None recorded yet.

## Deployment status
Not deployed. The LCM prime-factorization fix (separate work) shipped as f04499f9fc.

<!-- fm2-summary:begin -->
**Total 105 · Implemented (incl. verified) 49 · Verified 38 · In progress 22 · Not started 25 · Blocked 1 · Failed 8 · Untested 12 · Production verified 0 · Verified 36.2%**
<!-- fm2-summary:end -->
