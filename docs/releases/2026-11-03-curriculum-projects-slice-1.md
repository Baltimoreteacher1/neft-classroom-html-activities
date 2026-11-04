# Release record: Curriculum + Projects slice 1 (2026-11-03)

Rollback point (production before this release): `b9d39ab1ee3f42a9e2a877a6ccce557e213602d6` (origin/main). To roll back:
`git revert <this release commit>` on a worktree cut from origin/main, then
`ALLOW_DEPLOY=1 npm run ship -- <revert sha>`. No data migration is part of this release,
so a revert restores the previous behaviour completely.

## What ships
- `/curriculum/all-resources/`: directory of all 7,768 lesson/unit resources and 59 tool pages
  (new URL; linked from the hub; global nav unchanged).
- Zero-resource-loss baseline gate (`validate:resource-baseline`, 12.2k pinned entries).
- Projects: canonical registry (`data/project-registry.json`), inventory, `validate:projects-registry`,
  and the registry-driven gallery at `/curriculum/projects/` and `/math/projects/` (same URLs).
- Every unit carries its own project: the launch manifest's picker rows for Unit 1 and Unit 10 no
  longer open another unit's project; hub unit cards say "Includes a unit project";
  `tools/unit-projects-membership.test.mjs`. See `docs/specs/projects-unit-numbering-finding.md`.

## Why production was frozen (fix shipped separately as 4b6393a)
Cloudflare Pages' build log for `b9d39ab` and `21156fe` (both failed, production stuck on `806280c`
since 12:44 UTC): the Vite build and the generators SUCCEED, then the deploy step stops with
`Pages only supports up to 20,000 files in a deployment`. `dist/` had grown past 20,000 files
(my slice alone built 20,131; `origin/main` was already over). Contributors: the 105-file
`functions/` directory (server source and tests, including `_lib/teacher-session.js`) and 94
`*.test.*` files were being copied into `dist/` and served publicly. Fix, shipped on its own as `4b6393a` ahead of this slice: `functions` joins
`SKIP_DIRS` in `vite.config.js` (Pages deploys Functions from the repo-root `functions/`, which the
build log confirms: "Found Functions directory at /functions"), and the copy filter skips test
files. `dist/` is now 19,897 files. New gate `validate:dist-file-budget` fails above 19,950 so this
cannot freeze production silently again. Headroom is only ~100 files: any large generated addition
needs a decision (candidate: ~1,000 SCORM zips in `scorm-packages/` and
`teacher-tools/canvas-scorm/packages/`; not touched here).

## Not in this release
Lesson shell, role workspaces, interactive-tool upgrades, per-project studio workspaces,
portfolio/certificate upgrade, hub performance work. In progress on separate branches.

## Evidence (run on the integrated tree, bare)
validate:resource-baseline, validate:all-resources, validate:all-resources-browser,
validate:projects-registry, validate:projects-gallery-browser, validate:hub,
validate:curriculum-top1, validate:route-contract, validate:gate-coverage, npm run check,
curriculum-shell / hub-lesson-picker / pathway-counts / source-ratchet / hub-assets tests,
save-resume audit: all exit 0. The commit hook and the pre-push gate run the full change-scoped sweep.

## Known, unchanged
Hub /curriculum/ is over its performance budget (about 990 KB, 80 requests); tracked separately.
