# Common brief for every Studio worker

Worktree: /Users/joelneft/wt-lp-teacher-studio (branch feat/lp-teacher-studio-20261123). Work ONLY there. Never cd elsewhere.
Read first: `bcpss-teachers/studio/STUDIO-SPEC.md` (the contract), `data/taxonomy.js`, `engines/engine-core.js`, `core/*.js`, and `access-practice-lab/ds.css` tokens (skim `:root`).

Rules
- Edit only the files you own (listed in your task). Other workers are writing the rest at the same time. If you need a change in a file you do not own, message the lead in your final report; do not edit it.
- Do NOT run git add/commit/push/stash/checkout. The lead commits. Do not run `npm install`, `npm run build`, `npm run qa:*`, `npm test` (whole suite) or `npm run validate` (whole gate): they are slow and the tree is mid-edit. Run only your own narrow checks (`node --test tools/studio-<yours>.test.mjs`, `node tools/validate-studio.mjs --only <yourfile>`, a Playwright script of your own).
- A PostToolUse hook may reformat files you write; re-Read before a later Edit if an edit fails.
- Vanilla ES modules, no new dependencies, no build step for studio code, no emoji anywhere (UI, data, comments), no placeholder text. Use ds.css tokens (`var(--brand)`, `var(--teal)`...), classes prefixed `st-`. Visible focus, 44px targets, reduced motion, aria-live feedback, keyboard + touch.
- ≤500 lines per code file (split into modules); data files may be longer but keep each under ~900 lines.
- Quality bar: this is shown to teachers and students. Real content, real interaction, no stubs, no "coming soon". If something is not feasible, build the smaller thing completely and say so in your report.
- Local preview: static serve the worktree root, e.g. `cd /Users/joelneft/wt-lp-teacher-studio && python3 -m http.server <your-own-port 5200-5299>` (pick a port from your task) and open `http://localhost:<port>/bcpss-teachers/studio/...` with Playwright (mcp__playwright__* tools or a node script using @playwright/test chromium). Save screenshots under the scratchpad directory only. Kill your server when done. Note: `/api/bcpss/*` is not served by python; the studio must degrade gracefully (clear message + retry) when an API call fails, and your tests should stub it.
- Final report (≤25 lines): files created, what works (verified how), what does not, anything the lead must wire. Plain facts, no flattery.


## SCOPE CHANGE (Joel, 2026-11-23): K–8 ONLY
No Pre-K and no grades 9–12 anywhere: not in UI, data, fixtures, gold activities, copy, tests. Grades K,1,2,3,4,5,6,7,8; bands k-2, 3-5, 6-8; WIDA clusters K,1,2-3,4-5,6-8 (taxonomy.js already updated). Where a brief of yours mentions Pre-K, grades 9–12 or high school, substitute the nearest K–8 equivalent (K–2 early-childhood for Pre-K; grade 8 / 6–8 for high school). 'Early learners' now means K–2. Subjects stay all 11, across K–8.
