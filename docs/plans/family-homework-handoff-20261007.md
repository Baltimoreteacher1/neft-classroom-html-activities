# Claude Code handoff — family homework release

## Authorization and current state
Joel requested all family-homework audit improvements across curriculum, then explicitly authorized commit, merge, and live deployment. Latest direction: make the short route and differences between homework routes easy to understand. Joel paused Codex due to low usage and requested this handoff. Continue implementation/verification/release; no repeated deployment permission needed.

- Worktree: `/Users/joelneft/wt-family-homework-complete`
- Branch: `codex/family-homework-complete-20261007`
- Base HEAD: `5e1daf0be4` (origin/main when created)
- Canonical repo: `/Users/joelneft/Developer/reveal-math-activities`
- Changes are UNCOMMITTED and NOT DEPLOYED. Approximately 181 tracked files changed plus new files.
- Preserve canonical checkout and its unrelated work. Do not reset it.
- Read repository AGENTS.md and docs/deploy.md.
- Release only via `ALLOW_DEPLOY=1 npm run ship -- <reviewed-sha>`. It cherry-picks to latest origin/main in a clean worktree, runs pre-push QA, pushes and verifies the live stamp. Never push working state to main or manually deploy Wrangler. Do not bypass gates.
- node_modules in this worktree links existing installed packages; @eduwonderlab/engine links THIS worktree's engine. No dependencies added.

## Implemented
Source files:
- scripts/homework-guided-notes.mjs (shared rendering, runtime and styles)
- scripts/homework-family-guidance.mjs (NEW bilingual parent questions, reasoning frames and distinct home activities)
- scripts/homework-visual-labs.mjs
- scripts/generate-homework-html.mjs
- scripts/homework-external-resources.mjs
- scripts/lib/homework-problems.mjs
- scripts/validate-homework-guided-notes.mjs
- tools/homework-family-experience.test.mjs
- tools/homework-interactions.test.mjs
- data/family-homework-ladder.json
- data/family-homework-scenarios.json
- data/family-homework-notes/6-2.json
- data/family-homework-notes/9-3-part2.json (likely formatting-only after temporary model override removed; inspect/revert this file if so)
- Generated all 166 lessons/*/homework.html and hashed assets/homework bundles.
- Build regenerated data/curriculum-download-manifest.json; regenerate and stage consistently after final homework generation.

Features:
1. Three real routes: quick 5–10 minutes = Learn/Check/Done, 2 problems; core 20 = Learn/Together/Check/Done, 6 problems; full 30 = Words and one home activity/game added. Copy gives explicit tasks and stopping points, EN/ES. Switching preserves answers and route-specific progress.
2. Compact hero, language before route chooser, readable route text, wider quick time badge on phone.
3. Optional/ungraded/no-adult-signature language; leftover Spanish photobooth signature references corrected.
4. Fixed broken 9-3-part2 Big Idea dollar amounts: regex replacement callback avoids interpreting $1 etc from prose. Read-aloud inline arguments now JSON-quoted then HTML-escaped, fixing apostrophes too.
5. Guided Together steps now independently attempted; worked steps in hints. Added explicit answer-free tasks to family-homework-scenarios for exact-support situations.
6. Family-first extension ladder fixes missing 2-4 dataset and 5-8 dimensions; new 1-2 fraction extension questions.
7. Targeted paper models for 1-2 fractions, 4-5 missing whole, 7-6 distance, 9-3-part2 affine relationship table, 10-6 evidence of growth. 6-2 mixed-number interactive division model.
8. Topic-specific problem hints, actual parent questions, 3 essential vocabulary terms, bilingual reasoning frame/criteria.
9. Distinct household applications, paper/solo options, one mission; optional extra ladder collapsed. Removed repeated kitchen-table task from Done.
10. Games labeled honestly: lesson-specific Quick Quiz vs related review; Unit 9 Part 2 uses two-variable game bank.
11. Relevant Khan links for conversions and finding the whole.
12. Route-specific print problem and answer counts; old misleading 1-page button now prints the selected plan's problems. Answers remain separate. Need real print preview verification.
13. Explicit resume note; restored answers at DOMContentLoaded instead of window.onload (browser proved slow resources delayed restoration). New regression test added.
14. Family games initialize only on Play; drawing canvases initialize only once visible, via details toggle. This latest canvas change currently fails an existing test—see below. Heavy scripts have NOT been split into lazy network bundles; initialization deferral is the implemented performance change.

## Original audit scope / remaining coverage review
Audit's 18 themes: malformed text; missing problem context; lesson/model alignment; precise or honestly labeled games; relevant external links; consistent optional/no signature policy; compact mobile intro; genuine quick route; remove repeated activity; independent attempt before worked answer; actionable hints; real parent questions; ESOL scaffolds; written response criteria; distinct home task with solo/paper option; extras after clear stopping point; route-aware print/separate answers; resume/performance.
Unit priorities: 1 fractions vs decimal model; 2 datasets attached; 3 conversions; 4 missing whole; 5 labeled dimensions/nets; 6 mixed numbers; 7 distance vs plotting; 8 boundary and both sides; 9 two-variable relationship models; 10 growth evidence.
Do not claim all details complete without reviewing final coverage. E.g. getTopicPowerUp for 7-6 may still be broad coordinate-plane; new 1-2 ladder approaching has only one authored question and could fall back to classroom decimal question for its second slot. Check and finish these before release. New household guidance uses unit-level defaults with many lesson overrides; verify it does not introduce off-topic tasks on remaining variants (especially Unit 10).

## Evidence and outstanding failures
Logs in /tmp (same machine):
- `/tmp/ewl-family-generate.log`: generated 166 pages successfully.
- `/tmp/ewl-family-validate.log`: **166 pages, CRITICAL 0, HIGH 0**, all guided-notes quality checks passed.
- `/tmp/ewl-family-games.log`: **PASS**, 166 game bank resolutions.
- `/tmp/ewl-family-tests.log`: previous targeted run **47/47 PASS** (before latest DOMContentLoaded/canvas changes).
- `/tmp/ewl-family-finaltests.log`: latest targeted run, started before handoff. **Drawing test now fails**: `drawing uses the displayed canvas size and stops after pointer cancellation`. New visible-only init means JSDOM zero-size frames are skipped; inspect whether test needs opening/measurement setup or initialization has a real bug. Don't weaken the behavior test. New persistence regression is in same file and must pass.
- `/tmp/ewl-family-build.log`: `npm run build` reached successful final generate-access-printables. Build began while a few last source fixes were still in progress; final release build must cover final snapshot.
- `/tmp/ewl-family-full-validate.log`: full npm validate ran 324 scripts: 319 passed, 4 failed, one skip, one opt-in. Failures:
  * tools/curriculum-resources.test.mjs expects >=32 resources; current origin/main guide has fewer. Appears unrelated pre-existing mismatch from streamlined curriculum commit; prove baseline before deciding minimal fix/report.
  * tools/download-manifest.test.mjs: index stale vs generated manifest. Regenerate and STAGE result before rerun.
  * tools/generated-pages-fresh.test.mjs: checks INDEX; all changes unstaged when it ran. Stage final generated pages, rerun.
  * tools/typecheck-ratchet.test.mjs: git ls-files still lists deleted old homework-core hash; stage deletions/additions, rerun.
- `git diff --check` found one newly added trailing whitespace line in guided-notes around 3096. Fix.
- Full validate's remaining chained validators did not run after test script failures. Inspect package script and finish required checks; don't simply call full suite repeatedly unnecessarily.
- No lint/typecheck final check yet; huge shared source may need formatter. Use installed Biome on touched sources, don't format unrelated files.

Independent required qa-gate review finished: 0 critical failures; 166 pages and all 56,986 inline handlers compiled. Sampled 10 lessons math good. Warnings were missing explicit Together objectives, Spanish signature leftovers, overbroad print label. All three addressed after that review, parent verification still needed. Slide-only gates correctly marked N/A. Agent did not test browser/build/deploy.

Browser checks completed on localhost:5178 (Vite):
- 3-6 quick has 3 stops, exactly 2 visible problems, progress /2.
- Switching to full retains selected radio and table input; six visible problems, /6.
- Reload initially showed blank because restoration waited for all resources. After moving to DOMContentLoaded, browser immediately restored radio + '2000' input, progress 2/6. Resume note shows saved route/last stop.
- Phone 390×844 checked; quick time badge originally wrapped, fixed with 60px/no-wrap. Need recheck final screenshot.
- Spanish mode, print preview, final games lazy init and full path not fully browser-verified yet.
- Local Vite doesn't serve generated /assets/homework-lesson-models.js (Vite build emits it); use preview build to inspect interactive models accurately.
- Chrome test tab ID 563349346, browser ID2; temporary viewport override 390x844 should be reset after QA. CUA documentation governs UI automation; use mcp__cua_repl if available. Do not touch actual student data. Local answers were synthetic only.

## Suggested completion order
1. Review this handoff, git status, final test log. Fix drawing initialization/test, whitespace, any remaining content coverage gaps above.
2. Add/finish meaningful regressions for explicit quick route, saved hidden answers, dollar/apostrophe markup, attached contexts, paper models and separate answer printing.
3. Generate homework, then download manifest. Stage only task files + generated outputs/assets/deletions. Remove formatting-only or unrelated build diff; don't delete another process's fixture while tests run.
4. Rerun targeted tests and homework/game validators, staged freshness/download/typecheck-ratchet. Diagnose baseline curriculum-resources failure accurately. Finish required quality checks and browser mobile/Spanish/print/full path; build final snapshot.
5. Update docs/plans/family-homework-complete-20261007.md and QA evidence. Inspect final diff. Commit feature branch.
6. `ALLOW_DEPLOY=1 npm run ship -- <sha>`; resolve failures safely, never bypass guards. This is the authorized merge/push/deploy path.
7. Verify production build stamp AND sampled actual homework pages/routes. Report live link and commit, verification evidence and any real limitations. Do not claim deployed until confirmed.
