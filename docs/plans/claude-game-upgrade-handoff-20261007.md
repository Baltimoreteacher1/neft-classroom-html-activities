# Claude handoff: finish the EduWonderLab curriculum game overhaul

## User request and authorization

Joel requested that every game reachable from eduwonderlab.com/curriculum be inspected individually and significantly upgraded into a unique, engaging adventure with professional game quality, especially the arcade games. He explicitly authorized full autonomy, commits, integration/merge, remote push, and live deployment for this task. He then requested a prompt to continue the work in Claude. Codex implementation agents were interrupted for handoff; do not restart the work from scratch.

## Workspace and release contract

- Canonical repository: `/Users/joelneft/neft-classroom-html-activities` (leave its unrelated branch untouched).
- All site changes are in `/Users/joelneft/.Codex/worktrees/curriculum-adventure-upgrade`.
- Site feature branch: `feat/curriculum-adventure-upgrade`, based on `origin/main` at `5e1daf0be4`.
- Site changes are UNCOMMITTED. Nothing from this overhaul has been pushed, merged, or deployed.
- Read this worktree's `AGENTS.md`, `docs/deploy.md`, and `docs/plans/curriculum-adventure-upgrade-20261007.md`.
- Reuse existing installed dependencies. `node_modules` is a symlink to the canonical checkout's dependencies.
- Release only reviewed commits through `ALLOW_DEPLOY=1 npm run ship -- <sha> [sha...]`. This assembles selected commits on origin/main and pushes through the QA gate. Never direct-upload with Wrangler, bypass guards/hooks, or push the whole working branch to main.
- Vite dev servers were left running at `http://127.0.0.1:4190` (PID 25627) and `http://127.0.0.1:4192` (PID 37793). Use an existing server if healthy. A static server also ran at 4189; it cannot resolve the existing web-vitals bare import, so do not confuse that limitation with a new game defect.

## Inventory and implemented work

`docs/qa/curriculum-adventure-inventory-20261007.json` records 115 playable page surfaces: 11 cabinets, 11 flagships, 11 practice/review surfaces, 22 legacy lesson games, 14 other curriculum surfaces, and 46 learning-lab pages. Check this inventory against actual curriculum/lesson links and redirects before claiming full coverage. Navigation hubs and mathematical tools are not individual games; archived unlinked demos were excluded.

1. All 11 core cabinets (`math/games/u*/index.html`) gained individually authored three-chapter worlds with different interactive mechanics, native mathematical success hooks, earned supplies, undo/refund, and local progression. New shared files: `math/games/shared/cabinet-adventure.{js,css}`, `cabinet-worlds.js`. Existing `phaser-studio.js` was integrated. Worlds include skyship navigation, prime gates, reef ballast, ratio irrigation, power allocation, garden tiling, rail switches, inverse-operation bridges, wildlife planning, rover routes, and orbital construction.
2. Eleven flagship games under `math/unit-*/games/`, statistics/games, and Ratio Kitchen gained four-location expeditions, branching routes and distinct manipulation capstones. New modules: `flagship-adventures.{js,css}`, `flagship-puzzles.js`, and `adventure-worlds/*.svg`; `flagship-studio.js` and native validated-success hooks changed. Native reward/validation bugs were fixed. Agent reported 24 browser cases and all 264 capstone variants passing. Verify final current files, including the latest Chromebook stage-fit/auto-scroll adjustment.
3. Practice Arcade, Placement Quest, Review Expeditions Atlas, and eight Unit 2–9 review adventures gained native traversal, distinct biome mechanics, optional recovery/rescue objectives, and checkpoints. Shared files under `curriculum/review-expeditions/voyage.{js,css}`. Practice service-worker cache was updated. Placement resumes already graded diagnostic answers. Agent reported a 15-test suite exercising native math, movement, resume, ice physics and responsive widths; inspect/rerun the current test file.
4. All 46 learning-lab finales now have individually authored destinations and model-construction expeditions with route choice, restoration, badges and persistent progress. Files: `curriculum/learning-labs/shared/expedition.mjs`, `expedition-worlds.mjs`, updated games/app/lab.css, versioned page references, and generator asset hashing. Their existing Connection Quest remains functional. 47 browser tests passed across all 46 labs plus mobile/reload/retry. Pure math tests passed 414 game goals and independent fixtures.
5. Class Boss gained a local three-ward citadel campaign tied to actual correctly solved native questions. Charges can restore a chosen ward and persist by week. Shared class health API behavior remains unchanged. New `curriculum/class-boss/raid-campaign.js`, native integration and responsive CSS. Two browser tests passed after fixing mobile overflow and cover misses, real correct answers, spending, reload, Spanish and arcade filtering. Independent Class Boss math validator passed 55,968 generated questions.
6. Curriculum Arcade and Math Games launchers now have original key art and actual cabinet world thumbnails. New `/assets/adventure-arcade/` contains a 460 KB WebP hero, 11 world thumbnails and CSS. The key art was generated for this project and copied into the repository. A low-contrast hero description found by screenshot review was fixed. Verify the final screenshot/contrast.
7. The 22 legacy lesson-game pages have recently been modified with `math/games/shared/legacy-adventure.js`; these edits were in progress when interrupted. Do not treat them as fully verified. They need individual native-success wiring and playthrough checks. They include the Unit 1 arithmetic games, Fraction Dungeon, Underwater Adventure, Unit Rate Factory, Shopping Mall Tycoon, architecture, four Unit 7 games, Equation Quest and seven Unit 9 variable games, plus two statistics games.
8. A second curriculum batch is partially implemented: Ratio Quest, Unit Rate Market Mission, Ratio Rate Review Mission, Unit 3 Test Review, and 3.4's Laser/Sonar games. New files include `curriculum/review-expeditions/basecamp.js`, `campaign.css`, and `curriculum/3-4-activity/expeditions.css`. Inspect each diff and complete/verify. Family Jeopardy was assigned but is still untouched in the site diff.

## Outstanding games: do not overlook

- Division Foundry (`curriculum/division-foundry/index.html`) and all five Almost-Right equation missions are still untouched. Root took ownership immediately before handoff but wrote no changes.
- Almost-Right native hook: `checkMainAnswer()` validates and calls `continueAfter(fb, "practice")` on accepted answers; practice handlers disable completed inputs. `ARLCoach` provides parse/solve/judge/freshLike in `equations/mission-coach.js`. Missions are add/subtract/multiply/divide/mixed. Preserve diagnosis → explanation → correction → practice → retry → result, while adding real game-specific adventure actions.
- Division Foundry native state lives inside its IIFE (`state.ingots/jobsDone/built`); `lock()` around line 2190 validates `run.mod.check()`, sets `run.completed`, pays, increments jobsDone and emits GameStudio complete. `paintFoundry()` around line 1742 renders truckSVG/contracts/shop. Shop IDs: tower, slide, tape, kcf. Add meaningful journey/contract decisions using these native systems; do not merely decorate the page.
- Family Jeopardy needs its own significant upgrade and verification.
- Finish/test legacy and second curriculum batch above.

## Monster Math Academy: separate editable source

- Source repository/checkout: `/Users/joelneft/wt-monster-studio`.
- New source branch: `feat/academy-research-expeditions`, based on `0c44290`.
- Before edits, source and shipped `index-D5Rhbv_P.js` were matched by SHA1 `432f090121beaedfcb97e651889082946964b4a5`.
- Source edits are UNCOMMITTED: `apps/web/src/adventure-map.ts`, `rewards.ts`, `store.ts`; new `expedition-state.ts`, `expedition-state.test.ts`, `research-expedition.ts`, `research-expedition.css`.
- Native research-expedition feature is implemented but tests/typecheck/build were still in progress. It adds selectable survey/rescue commissions, four restoration chapters, and research artifacts/ship modules tied to correct solves in the selected allowed unit. Bilingual and persisted with existing monster save DTO.
- Site `curriculum/monster-math-academy/` has NOT yet received the rebuilt assets. Review source, complete verification, build with its documented commands, copy the correct production build into the site worktree, verify service-worker/version behavior and the browser. Preserve the existing unrelated node_modules link. Commit source separately so the shipped bundle has maintainable source.

## Verification evidence and remaining release work

- `npm run build` completed successfully (exit 0) in the site worktree. Log: `/tmp/ewl-adventure-build.log`. Later source changes still require a fresh final build.
- `npm run validate:game-rules` passed; log `/tmp/ewl-game-rules.log`.
- `npm run typecheck` passed its debt register; log `/tmp/ewl-typecheck.log`.
- `npm run validate:js-syntax` was still running, with log `/tmp/ewl-js-syntax.log`; no success claimed yet.
- Full `npm run validate` has NOT been run for the final change set. Independent QA/review gate and final production-build browser checks have NOT happened.
- Root test files: `tests/lab-expeditions.spec.ts`, `tests/raid-campaign.spec.ts`.
- Other new tests: `tests/flagship-adventures.spec.ts`, `tests/practice-expeditions-adventure.spec.ts`, `tests/cabinet-adventure-browser.cjs`, `tests/cabinet-adventure-rules.cjs`, `tools/flagship-puzzles.test.mjs`.
- Run Playwright using `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4190 npx playwright test <relevant tests> --workers=4`; inspect standalone CJS harness argument handling before running it.
- `/tmp/ewl-root-game-browser.log` has the initial 48 passes/1 mobile failure; that failure was fixed and `/tmp/ewl-raid-browser.log` confirms both affected tests now pass. Do not repeat the old failure as current.
- Build generators modified `data/curriculum-download-manifest.json`. Review generated drift before staging; do not blindly include unrelated generated changes.
- Review precise diff, run complete required validation/build, inspect each game at desktop/Chromebook/mobile widths, test math failures/retries, pause, sound, reduced motion, replay and save/resume. Check actual reward hooks cannot be farmed by repeat events or answer reveal.
- Preserve existing routes, SCORM/Canvas reporting, save/resume contracts, accessible controls, local-only identity assumptions and math accuracy. No countdown pressure. Keep implementation jargon out of student controls (cabinet "Math engine" was requested to become "Math challenge").
- Stage explicit reviewed files only, commit, integrate through guarded ship, confirm production build stamp AND served game assets/URLs. Do not claim live until evidence confirms it.

Joel asked "almost done?" and was told honestly that core upgrades were implemented, labs tested, older games/Monster/release checks remained, and nothing had deployed. Keep updates brief; complete the remaining work without a new approval loop.
