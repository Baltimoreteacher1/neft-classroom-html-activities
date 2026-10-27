# Family Math 2.0 — worker brief (shared rules)

Read this whole file, then your assignment in the prompt. Work only in `/Users/joelneft/wt-family-math-2` (a git worktree on
branch `feat/family-math-2`). Other workers edit other files in the same tree at the same time.

## Hard rules

- Edit and create ONLY the files your assignment lists. Never edit another worker's files, `fm2/*.js` core files, or
  `docs/family-math-2-requirements.json`. If a core file has a bug or gap, describe it in your final report; do not patch it.
  (Exception: you may add small exports to nothing — ask in your report instead.)
- Do NOT run `git commit`, `git add`, `git stash`, `git switch`, `npm run build`, `npm test`, `qa:*`, `validate:*`, or any
  deploy/ship command. Do not push. The lead commits. Only run your own suites (below) and `npx biome check --write <your files>`.
- Do not start servers on fixed ports. The harness uses Vite with port 0. Close browsers/servers when a suite ends.
- Repo rules that apply to student games: NO timers or countdowns anywhere; no links to other site hubs; no printing the worked
  solution when a learner merely misses (the "Show me" button after three misses and hint tier 3 are the only places an
  answer is shown); no external scripts; self-contained; no emoji as the only content carrier; no Arabic/French/other languages
  (English and Spanish only).
- Files stay ≤ 500 lines (hard cap 750). Split `logic.js`, `copy.js`, `ui.js`, `index.js` as needed.
- Matching surrounding style: ES modules, 2-space indent, Biome formatting (run `npx biome check --write` on your files).

## What exists (read these first)

- `math/fluency-lab/family/fm2/contract.js` — the game module contract and `validateGame` (your game must pass it).
- `math/fluency-lab/family/fm2/shell.js` — owns rounds, hints (tiers 0–2, tier 3 = Show me), attempts, feedback, recording,
  language switch, resume. Your `mount` renders only the interaction into the stage and calls `ctx.submit(response)`.
- `fm2/rng.js` (seeded `makeRng`, `int`, `pick`, `shuffle`, `sample`), `fm2/rational.js` (exact fractions: `frac`, `add`, `sub`,
  `mul`, `div`, `cmp`, `eq`, `parse`, `toString`, `toDecimalString`), `fm2/lang.js` (`L`, `fmt`, `tx`, `escapeHtml`),
  `fm2/art/base.js` (palette + svg helpers), `fm2/fm2.css` (tokens `--fm-*`, `.fm2-btn`, `.fm2-card`, focus ring).
- `tools/fm2/shell.test.mjs` holds a tiny fake game: copy its shape. `tools/fm2/harness.mjs` is the Playwright harness.
- Host page: `/math/fluency-lab/family/play.html?game=<id>&grade=<0-8>&skill=<id>&level=<1-3>&rounds=<n>&seed=<int>&lang=<en|es>&profile=<0-5>&mode=<solo|together>&resume=1`.
  The shell exposes `window.__fm2 = { game, round, solve(), submit(response), next(), tools }` (test seam; `solve()` returns
  your own `game.solve(round)`).
- Existing Fluency Lab engine (`math/fluency-lab/problem-bank.js`, 93 K–8 skills) is a reference for grade-level content, not
  a dependency.

## Deliverable per game (one folder `math/fluency-lab/family/fm2/games/<id>/`)

`index.js` (default export, passes `validateGame`), `logic.js` (pure), `copy.js` ({en, es} strings, hints, feedback),
`ui.js` (DOM), `game.css`. `cssHref: new URL("./game.css", import.meta.url).href`. Skills: at least 14 across K–8, EVERY grade
0–8 covered by ≥ 2 skills, each with a standards code (CCSS/MCCRS-style, e.g. "3.NF.A.1"), strand and title in both
languages, `labSkill` optional ("6:lcm" style key into the Fluency Lab). Three levels per skill: level 1 gentle, 2 on-grade, 3
stretch; levels must change the mathematical demand (ranges, steps, representations), not just numbers. The grade argument
tunes ranges within a skill that spans several grades.

### Mathematics quality (release-blocking)

- Every round is solvable and its answer is exactly right. Use exact rationals (`fm2/rational.js`) for fractions, decimals,
  percents; no floating-point comparisons. Numbers are grade-appropriate; no negative results below grade 6 unless the skill is
  about integers; no remainders/decimals where the grade has not met them.
- `check(round, response)` accepts every mathematically correct response (multiple solutions where they exist) and rejects
  incorrect ones with feedback that NAMES the likely mistake (`mistake` key + specific EN/ES text), never just "wrong".
- `hint(round, tier)`: tier 0 nudge, 1 strategy, 2 worked step on a parallel or partial step; none of tiers 0–2 may contain the
  answer (`answerText(round)`) as a standalone number/word; tier 3 states the full solution. Hints must be mathematically correct
  for THIS round.
- `solve(round)` returns a response that `check` accepts; `answerText(round)` is short text of the answer.
- Rounds are pure functions of `(skillId, level, rng, grade)` and JSON-serializable (resume rebuilds them from the seed).

### Interaction quality

- A real, differentiated mechanic (see assignment). Not a multiple-choice quiz with a skin. A multiple-choice moment is allowed
  only as a sub-step. Mistakes can be corrected (undo/remove/reset); the shell's "Reset this puzzle" calls `mount` again.
- Every drag/drop/slider/gesture has a keyboard path (buttons, arrow keys) and a touch path; controls ≥ 44×44 CSS px; visible
  focus (use the `:focus-visible` look from fm2.css); no information by color alone; labels via real text or `aria-label`.
  Announce meaningful changes with `ctx.announce(text)` (e.g. "Added a tens rod. 34 so far.").
- `mount` returns `{ destroy(), setLang(lang) }`; `setLang` re-renders labels from internal state without losing the work.
- Layout works from 320px to 1440px with no horizontal page scroll; the stage may scroll internally only for wide models.
- Models are SVG/HTML drawn from the round's own numbers (publisher quality: consistent `PALETTE`, clear shapes, labels).
  Put reusable drawing helpers in `fm2/art/<topic>.js` ONLY if your assignment says you own that file; otherwise keep them in
  your game folder.
- Everything learner-facing is bilingual: prompt, labels, hints, feedback, instructions (`howTo`, 3–5 steps), the `together`
  text (how two people play this game). Spanish is natural classroom Spanish, not word-for-word.

## Tests you must write (both must pass before you report)

1. **Math suite** `tools/fm2/<id>.test.mjs` (plain node assertion script, no framework; tag lines `// @fm2 FM-0xx ...`):
   - `validateGame(game)` has no problems; distinct `mechanic`.
   - For every skill × level × grade in range × ≥ 40 seeds: round is JSON-serializable; `solve` accepted by `check`;
     the answer is re-derived by an INDEPENDENT oracle written in the test (brute force / exact rationals / a separate formula —
     never by calling your own generator or checker to produce the expected value); corrupted/plausible-wrong responses are rejected;
     numbers within a per-grade limit table declared in the test; hints tiers 0–2 never contain `answerText`, tier 3 does;
     feedback for each catalogued wrong-answer type is specific; EN and ES text present, non-empty, and ES differs from EN for
     non-numeric prompts; variety: ≥ 30 distinct round fingerprints across 100 seeds for each skill; level 3 demands more than level 1
     (declare a measurable difficulty proxy and assert it rises on average).
   - Required tags: FM-050..FM-065 as relevant (arithmetic 050, ranges 051, equivalence 052, fractions 053, decimals 054,
     negatives 055, ratios 056, percents 057, expressions/equations 058, model correctness 059, solvability/multiple solutions
     060, variety 061, hint correctness 062, feedback 063, seeded property tests 065), FM-019, FM-032, FM-033, FM-017, FM-020, and
     your game's id (FM-007..FM-016).
2. **Acceptance suite** `tools/fm2/accept-<id>.mjs` using `tools/fm2/harness.mjs` (Playwright/Chromium), tags FM-070..FM-079
   (your game's), FM-038, FM-039, FM-040, FM-037, FM-020, FM-021, FM-026. It must, against the real page:
   1. open `play.html` for your game at several grades (at least grades 0, 3, 6, 8) with no console/network/page errors;
   2. open "How to play": the steps are visible in English and in Spanish;
   3. perform a REAL interaction through the UI (click/tap/keyboard — not `window.__fm2.submit`) that solves at least one round
      of each of three different skills; write a helper that translates `window.__fm2.solve()` (the round's solution) into UI
      actions; assert the shell shows "Correct!" and Next;
   4. submit a wrong answer through the UI: feedback appears, no Next, then correct it through the UI and succeed;
   5. use hint tiers (hint box shows, text differs per tier) and the Show me path after three misses;
   6. "Reset this puzzle" and "Start over" work; finish a 5-round activity; the finish screen shows stars; `localStorage`
      key `ewl-fm2-v1` contains the skill record with the right plays count; a second profile (`profile=1`) has no such record;
   7. leave and return: reload with `resume=1` mid-activity restores the same round index and earlier results;
   8. language: start English, switch to Spanish mid-round (shell button), the interaction's labels change, in-progress work is
      kept (e.g. pieces already placed remain), solve, switch back;
   9. mobile touch: a `touch: true` context at 375px, tap interactions solve a round; no horizontal overflow at 320, 375, 768,
      1440 (`hasOverflow`); `smallTargets(page)` inside the stage is empty;
   10. keyboard: every manipulation can be completed with the keyboard only (Tab, Enter/Space, arrows) — drive at least one round that way;
   11. axe-core (`@axe-core/playwright`, wcag2a/aa) reports no violations on the game page in both languages;
   12. `assertClean(problems)` at the end.
       Keep the whole suite under ~3 minutes. Print `PASS`-style summary lines; exit non-zero on failure (uncaught assertion is fine).
3. Run both suites repeatedly until they pass, take screenshots of your game at 1440, 768 and 375 px (and Spanish) with
   Playwright into `/tmp/claude-501/fm2-shots/<id>/`, LOOK at them (Read tool), and fix layout/visual problems you see.

## Final report (what the lead needs, ≤ 40 lines)

Files created; skill inventory table (id, grades, levels, standard); the mechanic in two sentences; test results (counts);
screenshots you inspected and defects fixed; anything unresolved or any core-file gap (be specific, with file and line).
Do not claim a requirement is verified: report evidence; the ledger is computed from tags and passing suites.
