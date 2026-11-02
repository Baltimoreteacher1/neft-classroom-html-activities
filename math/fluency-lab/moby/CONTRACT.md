# Fluency Lab "Moby" layer — contract for build agents

Goal (Joel): turn the Math Fluency Lab into a K-8 adaptive platform that completes the cycle
**diagnose → learn → practice → feedback → revise → reassess → master → retain**, with a real fact-fluency system,
interactive instruction, gamification that rewards learning (never speed or guessing), a teacher intervention
toolkit, and family practice pathways. The Lab ALREADY has: `placement.js` (adaptive checkup), `diagnostic-engine.js`,
`ability.js`, `prerequisite-map.js`, `tutor-engine.js` (record + `recordAnswer`/`evidence`/`prerequisites`),
`mastery-model.js` (0-100 score, 1/3/7/14/30 day ladder), `recommendation-engine.js`, `rescue.js`, `mistake-bank.js`,
`mistake-notes.js` (`classifyMistake`), `fact-trail.js` (coarse fact chart), `reports-groups.js`, `rewards.js`,
`achievements-4.js`, `studio/*` (manipulative engines), `family/*`, `teacher-4*.js`. READ them before writing.
Extend and integrate; never duplicate or replace a working engine. Everything new lives in `math/fluency-lab/moby/`.

## Hard rules

- Worktree `/Users/joelneft/wt-fl-moby`, branch `feat/fluency-mobymax-engines` (cut from live main). Dev server is already
  running at http://127.0.0.1:4511/math/fluency-lab/ (`?grade=N`). Do NOT start another, do NOT run `npm run build`,
  do NOT commit/push/deploy, do NOT run `npm ci/install`. The lead commits.
- Do NOT edit `app.js`, `index.html`, `sw.js`, `i18n.js`, `i18n-es.js` (lead only). Need a hook? Export a documented
  `mountX(host, ctx)` / pure function and describe the exact integration in your final report. Narrow Edits to other
  existing files only when your brief names them.
- Never rename ids/classes/data-attributes/storage keys legacy code reads. Preserve routes, autosave, progress,
  answer-masking (`fluency-model-inputs`, `fluency-step-leak` tests), bilingual support, a11y.
- Pure modules (no DOM, clock only via a `now` argument, randomness only via an injected `rng`) with node tests
  `tools/fluency-moby-<area>.test.mjs` (`node tools/fluency-moby-<area>.test.mjs` must exit 0; `npm test` walks `*.test.mjs`).
  Tests must be reproducible fixtures (seeded rng), include negative cases, and prove thresholds.
- Persistence: `readLocal/writeLocal/profileKey/profiles` from `school-tools.js`; keys prefixed `ewl-fluency-moby-`;
  every load passes through a `sanitize*` that drops malformed data (a hand-edited save must never crash the Lab).
  Include new records in the JSON backup via narrow edits to `play-backup.js` ONLY if your brief says so.
- Honesty: never fabricate analytics. Observed (counted) vs inferred (suggested) stay separate and labelled. A short
  screening is never called a validated/standardized assessment. Rewards never pay for speed, guessing, or repetition.
  Untimed always fully supported; timed is opt-in, low-pressure, never required for mastery.
- Spanish: every student/family/teacher string goes through `t()` from `i18n.js`; add a Spanish map in your own
  `moby/i18n-es-<area>.js` exporting `ES_MOBY_<AREA>` (English text is the key; students use tú, adults ustedes). The lead
  wires the import. Follow `i18n-es-lab4-adaptive.js` for shape.
- Design: use existing CSS vars where present; new CSS in your own `moby/<area>.css`, scoped under a unique class prefix.
  NO violet/purple/magenta/indigo (hue 255-335; `node tools/validate-no-purple.mjs`). AA contrast, 44px targets, visible
  `:focus-visible`, `prefers-reduced-motion` alternatives, keyboard operable, no emoji as art (original inline SVG),
  no horizontal scroll at 375px. Grade look: Grades 1-2 big/tactile/illustrated; 3-4 interactive models; 5-6 diagrams and
  ratios; 7-8 mature, restrained, algebraic. Read `grade-experience.js` for the existing per-grade architecture
  (`html[data-grade-experience="N"]`) and reuse it. Another session is redesigning visuals in `~/wt-fl5` (`fl5/`): do not
  look there or duplicate it; keep your CSS token-driven so it adapts.
- File count matters (Cloudflare Pages 20,000-file limit): keep new files to what you need (<= 12 per agent).
- Verify in a REAL browser (Playwright MCP via ToolSearch `select:mcp__playwright__browser_navigate,mcp__playwright__browser_snapshot,mcp__playwright__browser_take_screenshot,mcp__playwright__browser_evaluate,mcp__playwright__browser_resize,mcp__playwright__browser_click`, or a node Playwright script with NODE_PATH=/Users/joelneft/wt-fl-moby/node_modules). Look at screenshots at 375/768/1440 and Grades 1, 4, 8. Save evidence to `/Users/joelneft/reports/fl-moby/<area>/`.
- Finish with `node tools/validate-no-purple.mjs`, your own tests, and `node tools/validate-fluency-lab.mjs`, then a SHORT report:
  files created/changed, exports + integration lines the lead must add, what you verified, anything not done.
