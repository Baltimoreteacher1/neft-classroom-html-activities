# Fluency release verification — October 4, 2026

Published October 4, 2026 after explicit push/deploy approval. Production is verified at commit `4056044394b28a7b4c071f1299b212d4c33bf923`.

## Release location

- Worktree: `/Users/joelneft/wt-fluency-verified-release`
- Branch: `codex/fluency-verified-release-20261004`
- Base: `3b10b916f`
- Reviewed source commit: `d480f5e2cc90e4a71e0d2c0a007ac2bd70e2754c`.
- Production commit: `4056044394b28a7b4c071f1299b212d4c33bf923`, assembled on top of ACCESS release `c5c2dde53` using the guarded ship workflow.

The earlier `wt-fluency-publisher-release` worktree was receiving unrelated ACCESS Lab edits while QA ran. Those edits were preserved there. Only the fluency source, hosted output, curriculum shortcut, generated catalogue/title updates, documentation, and tests were copied into this isolated worktree.

## Changes

The existing student and teacher routes now provide the revised 54-lesson practice studio, six guided investigations, strict answer checking, targeted hints, local refresh recovery, sketch/work export, and revised teacher navigation. The integration preserves the public-data allowlist, teacher route classification, existing lesson links, and PDF filenames. Seventeen printable packets were regenerated with the reviewed content corrections.

This continuation repaired PDF-generator lint/format errors and restored the existing teacher `LESSON_VIEW` convention that the source port had removed. A shared dependency symlink was also loading an older engine from another checkout; the isolated worktree now resolves its own workspace engine without changing dependency manifests or the other checkout. Its recoverable backup is stored in the excluded `.qa-logs/` directory so test discovery cannot traverse vendor tests.

## Verification

- 130 focused math/state tests passed, with no skips.
- Guide data validation and hosted source/data/route integration checks passed: 54 lesson mappings, 216 foundation tasks, exact student allowlist, normalized teacher routes, shared runtime/style freshness, and existing printable/navigation contracts.
- The initial full release sweep passed 118 of 119 checks. Its test-suite check reported two failures: the restored teacher view convention fixed the curriculum-reader ratchet, and local engine resolution fixed the number-line regression. Both failed checks then passed individually.
- Final repair verification: the rebuilt site, generated-file freshness and formatting checks passed. The clean test-suite rerun passed with 317 of 318 test scripts successful and zero failures. The remaining script, `tools/build-injectors-idempotent.test.mjs`, deliberately skipped because tracked release changes are uncommitted. The separate opt-in `tools/workbench-live-runtime.test.mjs` was not run because its manual services were not started.
- An intermediate rerun accidentally discovered vendor tests through the backup dependency symlink; all 317 project scripts passed in that run, but three vendor tests failed. Moving the backup into `.qa-logs/` restored the normal test set; the final runner exited zero.
- Built-route browser suite: 22 scenarios passed, no skips or uncaught page errors. It includes 162 lesson/tier configurations, 320/390/768/1440-pixel layouts, keyboard use, answer checking, storage recovery, downloads, copied student links, local-file opening, student printing, and WebKit mobile smoke coverage.
- Accessibility: zero WCAG A/AA-tagged axe violations in 19 selected states, including all six investigations in light/dark themes and teacher/student dialogs.
- PDF verification: all 17 committed packets match the inspected staged copies, with 228 pages total and PDF tags present. Student packets exclude teacher-key markers. The saved structural review reports no text outside page bounds; 26 rendered page samples were visually inspected.
- `git diff --check` passed. The final tracked-change scope contains only the fluency release paths.

## Evidence

- Full sweep: `.qa-logs/qa-2026-10-04T13-10-04-333Z.log`
- Rebuild/format verification and intermediate vendor-discovery issue: `.qa-logs/qa-2026-10-04T13-18-11-593Z.log`
- Final clean test-suite pass: `.qa-logs/qa-2026-10-04T13-22-58-586Z.log`
- Browser and accessibility results: `output/fluency/browser-results.json`, `output/fluency/accessibility-results.json`
- Focused tests and integration: `output/fluency/unit-tests.log`, `output/fluency/integration-check.log`
- PDF checks and sampled renders: `output/fluency/pdf-verification.json`, `.qa-logs/fluency-pdfs/visual/`
- Browser screenshots: `output/playwright/fluency-release/`

## Limits and release boundary

Visual inspection is sampled; PDF tags and automated accessibility scans do not constitute accessibility certification. Live signed-out checks passed: the student route returned 200, while the teacher route and a teacher-key PDF returned 401. The deployed student engine exactly matches the reviewed source. No credentials or real student records were used. Local tests use synthetic browser storage.

The approved release used `ALLOW_DEPLOY=1 npm run ship -- d480f5e`. A concurrent ACCESS release reached main during the first ship attempt, so that attempt was stopped before push and the fluency commit was applied cleanly on top of the new main. No force push or shared-history rewrite was used. QA output and local dependency symlinks were excluded from the release commit.

## Production verification

- Commit hook: 119/119 checks passed.
- Final pre-push gate: 119/119 checks passed on the combined release, including 320/320 project test scripts and build idempotence. The separate opt-in live workbench test remains outside the default suite.
- Cloudflare promotion confirmed by the public build stamp after 140 seconds.
- Site-wide post-deploy smoke: 40/40 checks passed.
- Live fluency verification: reviewed engine matches production, mobile practice accepts the expected answer, work survives refresh, all six investigations open, no horizontal overflow at 390px, and no uncaught page errors.
- Live screenshot: `output/fluency/live-mobile.png`.
- Machine-readable proof: `output/fluency/live-verification.json`.
- Ship log: `output/fluency/production-ship.log`.
