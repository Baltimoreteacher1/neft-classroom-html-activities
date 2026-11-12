# Handoff — Math Fluency Lab publisher-grade redesign (2026-11-11)

Worktree: `~/wt-fluency-redesign`, branch `feat/fluency-publisher-redesign`, cut from `origin/main` 2026-11-11.
**Nothing is committed yet** — every change below is in the working tree (staged in part). Commit only through
the hooks (never `--no-verify`).

## Joel's standing words (quote them, do not paraphrase)
- "deploy when done" / "continue to deployment" — deploy is authorized once the work is done and gates pass,
  via `ALLOW_DEPLOY=1 npm run ship -- <sha>` only (read `.claude/skills/deploy`).
- "I need all of the points from the prompt addressed" / "make sure everything is built as detailed".
- "Do not accept anything less than a subscription based, publisher-grade, gold-standard experience throughout."
The full requirement list is `docs/fluency-redesign-requirements.md` (18 sections, each line with owner and evidence).

## Architecture decided and built
- `math/fluency-lab/index.html` → NEW student app (`math/fluency-lab/shell/`). The old page moved intact to
  `math/fluency-lab/lab.html` ("full lab": teacher studio, games, writing, tools, assignments, backups, print).
- Links meant for the full lab forward to `lab.html` before paint (inline script in `index.html` + `shell/app.js`):
  `view=teacher|games|write|path|notebook|models|practice|progress`, `start=daily|mission|checkup|realworld`,
  `stage=play`, hash `assignment|factplan|videos|board`, `diagnostics`, `publisher-demo`, `tour`, `profile`.
  Verified in browser: teacher studio, stage=play, #assignment=, start=daily all land and load.
- `shell/store.js` writes the SAME records as the lab (progress, tutor, last place, grade; per learner via
  `profileKey`), independent vs supported kept separate.
- `shell/content.js` — explanation engine: concept, synchronized worked example (studio engine frames; 106/128
  skills modeled), guided attempt (`createLesson`), misconception, Try (authored living model → engine Build →
  guided), `helpLadder` (hint → visual → steps) with a stricter `revealsAnswer` filter.
- `shell/canvas.js` synchronized picture/notation/words with Predict points. `shell/skill.js` See → Try → Practice
  (Understand = feedback + visual coaching on a miss + next problem). `shell/app.js` home / library (search with
  synonyms) / progress / More drawer. `shell/shell.css` tokens + components. `shell/words.js` EN/ES chrome.
- Authored content: `shell/authored/ratios-6.js` (Grade 6 ratios exemplar with a living model: counters, ratio
  table, double number line, equation from one state; "only red changes" contrast). Bands own
  `authored/band-k2.js`, `band-35.js`, `band-68.js`. Schema: `shell/SCHEMA.md`.
- Test: `node math/fluency-lab/shell/shell-content.test.mjs` — 128 skills, 0 help-rung answer leaks (it caught 115
  real leaks first, fixed by `revealsAnswer`).
- 33 test/tool files repointed from `index.html` / `/math/fluency-lab/?` to `lab.html`;
  `tools/package-fluency-desktop.mjs` packages `lab.html`.

## Gate status (`npm run qa:fast`, log in this session's scratchpad)
Failures seen on the first run and what was done:
1. `validate:injection` — new index.html lost the nsr layer → restored (both blocks) + `home-link.js`. Re-run.
2. `validate:fluency-family-browser` — asserted pathname `/math/fluency-lab/` → now `lab.html`. Re-run.
3. `validate:fluency` (`dashboard.browser.test.mjs:58`) — browser tests used base `/math/fluency-lab/` → base now
   `.../lab.html` in all `*.browser.test.mjs`; `teacher-family` joins fixed. Re-run; expect more of this class.
The run had not finished: read the end of the log, then run `npm run qa:fast` again until green. A new path
(`shell/`) has no `COVERAGE` rule in `scripts/qa-run.mjs` → full escalation; add a rule mapping
`math/fluency-lab/shell/**` to `validate:fluency` + the new shell test. Register the shell test with
`npm run test:reads` if the scoped test runner asks.

## Known defects / quality gaps found in audit (fix before calling it publisher-grade)
- Ratio engine predict text: "The first number goes from 2 by × 5" when it is the SECOND term (studio
  `engine-ratio.js` predicts) — wording wrong.
- Generic slip detector fired "Adding the same number to both parts" for an answer of 1 on `6:10 = □:90` —
  `likelyMistake` too loose; authored `misconceptions` now take precedence (wired in `skill.js missNote`).
- 22 skills have no engine model (list printed by `scratch cov`): 0:hidden-parts 1:shapes-2d3d 1:equal-shares
  2:doubles-near 2:time-five 2:mental-tens 3:scaled-graphs 4:mixed-numbers 4:angle-measure 5:coordinate-plane
  5:order-ops 6:order-rational 6:equivalent-expressions 6:write-inequalities 6:volume-fractional 7:fraction-ops
  7:like-terms 7:circumference 7:angle-facts 7:sampling 8:scientific-ops 8:volume-round 8:transformations-move
  8:compare-functions — they fall back to `renderModel` (legacy CSS classes, unstyled in the shell).
- Practice uses `generateProblem` only: adaptive selection (`tutor-engine difficulty/adaptiveProblem`,
  prerequisites, transfer after 3 independent) not wired (§9).
- Settings missing in More: reading font, read-aloud, reduced motion, learner switch, backup (§1.2, §10).
- No "Another way", no sentence frames / bilingual terms at point of need, no axe run, no CWV numbers,
  no screenshots, no deliverable reports (§6.4, §10, §16–18).
- Library filters Learn/Practice/Review not built (§2.5). Jargon titles not rewritten (§2.3).
- Spanish: chrome + question stems only; authored content must carry `es`.

## Next steps, in order
1. Green the gate; commit (`feat(fluency): publisher-grade student app shell …`).
2. Parallel content sessions per band (K–5, 6–8 + Ratio Studio) and one UX/QA/deliverables session —
   see `docs/fluency-redesign-requirements.md` owners.
3. Merge band branches; full browser journeys 1–7 at 320/375/768/1024/1440; axe; CWV; screenshots; reports.
4. Ship with `ALLOW_DEPLOY=1 npm run ship -- <shas>`, then `npm run smoke:live`.
