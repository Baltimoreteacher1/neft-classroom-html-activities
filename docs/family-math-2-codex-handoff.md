# Codex handoff prompt: finish and ship Family Math 2.0

Paste everything below the line into Codex, started in `/Users/joelneft/wt-family-math-2`.

---

You are continuing a half-finished build: **EduWonderLab Family Math 2.0**, live target https://eduwonderlab.com/math/fluency-lab/family/.
Joel (the sole operator) explicitly authorized implementing, committing and deploying THIS scope to production through the repo's
established ship workflow, and said "Build it and make live". The authorization covers Family Math 2.0 and the shared files it
needs only. Do not deploy unrelated work, touch secrets, delete production data, or modify other apps. Follow
`/Users/joelneft/CLAUDE.md`, `/Users/joelneft/wt-family-math-2/CLAUDE.md` and `AGENTS.md` (read them first).

## Where things are

- Worktree `/Users/joelneft/wt-family-math-2`, branch `feat/family-math-2`, cut from `origin/main` (the LCM prime-factorization fix is
  already live there as f04499f9fc; do not redo it). Last commit on the branch: core, ledger, traceability tooling. EVERYTHING
  ELSE (ten games, pages, logic layer, tests, shell patches) is UNCOMMITTED in the working tree. Do not discard it.
- Some Claude background workers may still be finishing games (Pattern Detective, Ratio Recipe Lab, Math Puzzle Studio, Family
  Math Duel). Before editing a file, check it is not being rewritten (`git status`, file mtimes, `ps`). If a game's folder
  `math/fluency-lab/family/fm2/games/<id>/` has no passing suites when you start, finish it yourself from
  `docs/family-math-2-worker-brief.md` (contract, quality bar, required math and acceptance suites) and the mechanic notes below.
- Specification of record = the directive Joel pasted (summarized here) + `docs/family-math-2-requirements.json` (105 requirements,
  FM-000..FM-129; FM-000 is Blocked because the original "23-part master prompt" was never supplied; leave it Blocked unless Joel
  supplies it). `docs/family-math-2-progress.md` and `docs/family-math-2-pages-notes.md` hold the rest of the state.

## Architecture (read before editing)

`math/fluency-lab/family/fm2/`: `contract.js` (game module contract + `validateGame`), `shell.js` (rounds, hint tiers 0-2, Show me =
tier 3, attempts, localized feedback, `ctx.onLock`, `neutral:true` results, language switch, resume, finish screen), `store.js`
(per-profile progress `ewl-fm2-v1`), `adapt.js`, `rational.js` (exact fractions), `rng.js`, `lang.js` (EN/ES only), `registry.js`,
`inventory.js`, `recommend.js`, `session.js` (5/10/15-minute plans + URL codec), `coach.js`, `realworld.js`, `play.js` +
`session-runner.js` (host), `home.js`, `progress.js`, `art/*.js`, `fm2.css`, `games/<id>/` (ten games: number-builder, math-match,
fraction-kitchen, math-market, array-architect, number-line-quest, pattern-detective, ratio-recipe-lab, math-puzzle-studio,
family-math-duel). Pages: `family/index.html` (home), `play.html`, `progress.html`; `tonight.html` is the pre-existing flow and
must keep working. Traceability: source/test files carry `@fm2 FM-xxx` tags; `node tools/fm2/run-all.mjs --unit|--browser`
records `docs/family-math-2-results.json`; `node tools/fm2/trace.mjs --write` regenerates `docs/family-math-2-requirements.md`
(never hand-edit that table; process/production evidence goes in the `manual` fields of the JSON).
Mechanics (must stay distinct): Number Builder compose-to-target; Math Match representation concentration (consider using
`neutral:true` for exploratory mismatches); Fraction Kitchen partition-and-pour; Math Market transaction register; Array Architect
grid construction; Number Line Quest place-and-hop; Pattern Detective rule discovery by limited probing; Ratio Recipe Lab scaling
table lab; Math Puzzle Studio constraint/balance puzzles with brute-force-verified solutions; Family Math Duel two-player
challenge duel (solo vs deterministic "Orbit"; together = two humans on one device with a hand-over screen).

## What is done

Core + shell (36 checks), ledger tooling, logic layer (5 suites), home/session/progress pages, and (per their workers' reports)
passing math + acceptance suites for number-builder, math-match, fraction-kitchen, math-market, array-architect,
number-line-quest. Re-run everything yourself; do not trust the reports.

## What remains (in order)

1. Verify the four in-flight games exist and pass: `node tools/fm2/<id>.test.mjs` and `node tools/fm2/accept-<id>.mjs` for each.
2. `FM2_JOBS=2 node tools/fm2/run-all.mjs --unit`, then `--browser`; fix every failure at the root (never weaken a test).
   `tools/fm2/inventory-live.test.mjs` must pass (every grade 0-8 covered by all ten games, unique mechanics).
3. Write the missing browser suites (tags in the ledger): `tools/fm2/e2e-*.mjs` for FM-080..087 (new family, returning family,
   parent-child/together, skill practice with hint+revise+new item, bilingual EN->ES->EN with saved state, mobile at 375px, two
   local profiles with no progress transfer, and a matrix of all 9 grades x 5/10/15 minute sessions using `window.__fm2` to finish
   quickly), `tools/fm2/browser-layout.mjs` (home, grade/skill browser, mission, each game, coaching, real-world, progress, completion,
   error/empty states, Spanish; widths 320/375/390/768/1024/1440; no horizontal overflow, 44px targets, no clipped text),
   `tools/fm2/browser-a11y.mjs` (axe wcag2a/aa on every page and each game in both languages + keyboard-only journey), and
   `tools/fm2/browser-perf.mjs` with budgets documented in `docs/family-math-2-performance.md`. Use `tools/fm2/harness.mjs`.
4. Visual QA: screenshot every listed screen at the six widths (EN and ES), LOOK at them, fix clipped/overlapping/weak layouts,
   re-capture. Record evidence in the ledger `manual` fields (FM-090).
5. Independent review from seven perspectives (senior frontend, math curriculum, game design, accessibility, UX, QA, parent on a
   phone) on the real code and behavior; keep a severity-classified defect list in `docs/family-math-2-progress.md`; fix, rerun.
   Known open items: Save/Resume pill is handled by a sticky mobile action bar (verify at 320px and in Spanish); concentration
   "Show me" threshold; first-viewport and mobile length of the home page.
6. Gates A-H (requirements, math, journeys, accessibility, reliability, performance, existing features incl. Tonight's Math and
   `node tools/verify-fluency-family-browser.mjs`, release safety incl. a written rollback note: reverting the squash commit on
   `main` via `ALLOW_DEPLOY=1 npm run ship`). Do not weaken a gate to report completion.
7. Commit and ship (details below), then verify production and fill the production evidence.
8. Final report with: production status (URL, revision, verification), counts (total/implemented/verified/remaining/blocked/
   verified %), feature evidence, grade/skill coverage K-8, per-game status for all ten, QA outcomes (unit, math, integration,
   e2e, a11y, responsive, production smoke), known issues, and exactly one determination: PRODUCTION VERIFIED - COMPLETE,
   PRODUCTION VERIFIED - PARTIAL (list every exception), or NOT RELEASED - BLOCKED. Because FM-000 is Blocked the honest result
   is at best PARTIAL unless Joel supplies the original 23-part prompt. Never claim "all tests pass" or "live" without evidence.

## Repo traps (learned the hard way)

- Commits run the change-scoped gate; `data/test-reads.json` goes stale when tests read new files. Fix: `npm run test:reads`
  (slow, can take 30-60 min under load) OR merge entries by hand like earlier work (take `origin/main`'s file, add entries for
  tests that read new files). If a gate reds on pre-existing main breakage, fix the manifest/root cause, never `--no-verify`.
- `git rebase`, `git reset --hard`, force-push are not allowed. To integrate main use `git merge origin/main`.
- Shipping: `ALLOW_DEPLOY=1 npm run ship -- <sha>` cherry-picks onto a fresh `origin/main` and pushes `main`; a cherry-pick of a
  commit built on an older main conflicts on `data/test-reads.json`. Reliable method: `git switch -c ship/family-math-2
origin/main && git merge --squash feat/family-math-2`, resolve `data/test-reads.json` by taking `origin/main`'s and re-adding
  new entries, commit once, ship that SHA. Only one ship can run at a time (wait for the other pid). After ship, `smoke:live`
  runs; then verify the production URL yourself (build stamp, new UI visible, one full session per game in prod, ES, mobile
  viewport, console/network clean, linked routes `../`, `tonight.html`, `progress.html`).
- Never use `$TMPDIR` in a command that also contains `git add` (a hook misreads it); write logs to `/tmp/claude-501/`.
- Test files over 750 lines violate the repo cap; Biome only formats `tools/**` partly; use `node_modules/.bin/biome` if `npx biome` fails.
- No timers/countdowns in games, English and Spanish only, no external scripts, no emoji-only content.
- Do not push anything other than via ship. Ask Joel before anything outside this scope.
