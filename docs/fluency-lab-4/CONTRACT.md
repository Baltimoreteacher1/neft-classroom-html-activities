# Fluency Lab 4.0 — shared contract

Target: `/math/fluency-lab/` (source `math/fluency-lab/`). Base branch `feat/fluency-lab-4`. Nine workstreams build in
parallel, each in its own worktree and branch, and are merged by the integrator. Read this before writing code.

## Rules for every workstream

1. **Own your files.** Create new files freely. Edit a file owned by another workstream only for a one-line hook, and
   list that edit in your final report. Shared files (`app.js`, `index.html`, `package.json`) get the smallest possible
   edit, marked with a `// fl4:<workstream>` comment, so the integrator can merge them.
2. **Reuse, do not duplicate.** Mastery = `mastery-model.js`. Feedback = `feedback-machine.js` + `feedback-panel.js`.
   Evidence and review = `tutor-engine.js`. Spanish = `t()` from `i18n.js`. Do not create a second progress system.
3. **Preserve** existing routes, content, saves (`sanitizeTutor` stays backward compatible), family features and tests.
4. **Palette and tokens:** `ds4.css` variables only (navy/teal/blue/warm neutral, 8px spacing). No violet, purple or
   indigo (`npm run validate:no-purple`). No emoji in new art or UI. Fraunces headings, Lexend body.
5. **Accessibility (WCAG AA):** keyboard operable, 44px targets, visible focus, `prefers-reduced-motion` respected,
   screen-reader names/descriptions, never colour alone. Interactive graphics need a keyboard alternative.
6. **Spanish:** every learner-facing `t("literal")` string needs a Spanish entry in YOUR table
   `i18n-es-lab4-<workstream>.js` (English text is the key; placeholders must match). `node tools/fluency-i18n.test.mjs`
   must pass. Student lines use tú; adult/family lines use ustedes.
7. **Privacy:** no student accounts, names or network submission. Everything stays on device (same as today).
8. **Math must be correct.** Every generator, answer, distractor, diagram and adaptive decision gets an independent
   check in a test (recompute, do not re-run the same code path).
9. **Tests:** put tests in `tools/fluency-<area>.test.mjs` (node) or `math/fluency-lab/<area>.browser.test.mjs`
   (Playwright via vite `createServer`, see `feedback-panel.browser.test.mjs`). Browser tests are added to the
   `validate:fluency` script in `package.json`. Inspect real screenshots at 390, 820 and 1280px (`/tmp` or the
   scratchpad, never committed) and fix visual defects before finishing.
10. **Before committing:** `node_modules/.bin/biome check --write <your files>`, run your tests and the existing
    `tools/fluency-*.test.mjs`, then `git commit` (the hook runs the change-scoped gate, about 2 minutes; fix what it
    reports, never `--no-verify`). End the message with `Claude-Session: https://claude.ai/code/session_01Gyww8KQ5xmLJz2mzM2JJ9U`.
    Commit on your branch only. **Never push, deploy, `git stash`, rebase or reset.** Do not touch other worktrees.
11. Files over ~500 lines: split. Keep markup nesting shallow; keep one source of truth for rules and constants.

## Shared APIs (stubs exist; owners replace the bodies, signatures stay)

- `illustrations.js` (workstream **art**): `skillArt(skill, opts)`, `strandArt`, `gradeArt`, `headerArt(kind)`,
  `pathwayArt(steps)`, `badgeArt(id, {earned})`, `BADGE_IDS`, `milestoneArt(level)`, `certificateFrame(opts)`,
  `emptyStateArt(kind)`, `onboardingArt(step)`, `reportHeaderArt(kind)`, `familyArt(kind)`. All return SVG strings;
  opts `{ decorative, size, idPrefix }`.
- `graphics/registry.js` (kinds owned by **graphics-a** / **graphics-b**): `mountGraphic(kind, container, config)` →
  `handle { kind, getState(), setState(s), describe(), destroy() }`. Modes `explore | build | check`. State is plain
  JSON, exact rationals (`{n, d}`), never floats. Each `graphics/<kind>.js` exports `mount(container, config)`.
- `playAnimation(kind, container, config)` (workstream **animations**, files `graphics/animations/<kind>.js` exporting
  `play`): `handle { kind, play(), pause(), step(delta), restart(), destroy() }`. Reduced motion → no autoplay,
  Next/Back buttons. Every animation shows a caption per step that states the mathematics.
- `mountMiniLesson(container, config)` (workstream **lessons**, `mini-lesson.js`): Learn It → Watch It → Try It →
  Explain It for any of the 96 skills.
- `problem-types-4.js` (workstream **generators**): `variantsFor(skill)`, `generateVariant(skill, rng, {level 1-5, type})`
  returns an item in the problem-bank shape plus `{level, type, model?}`, or `null`.
- Difficulty levels (workstream **adaptive**, `difficulty-levels.js`): 1 concrete visual foundations, 2 foundational
  application, 3 grade-level proficiency, 4 multi-step reasoning, 5 advanced transfer and challenge. Stored tutor
  entries keep `level` 0-2 for old saves; new entries add `tier` 1-5 (sanitized, optional).

## Workstreams, branches and ownership

| id         | branch / worktree        | owns                                                                                                                                                                                                        |
| ---------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| art        | `fl4/art` `~/wt-fl4-art` | `illustrations.js`, `art/**`, `tools/fluency-art.test.mjs`                                                                                                                                                  |
| graphics-a | `fl4/graphics-a`         | `graphics/{fraction-model,number-line,place-value,array,area-model,ratio-table}.js`, `graphics/graphics.css`, `graphics/gallery.html` (shared with b: each adds only its own section)                       |
| graphics-b | `fl4/graphics-b`         | `graphics/{double-number-line,coordinate-grid,geometry,solids-nets,decimal-percent,stats-display}.js`                                                                                                       |
| animations | `fl4/animations`         | `graphics/animations/*.js`, `animations.css`                                                                                                                                                                |
| lessons    | `fl4/lessons`            | `mini-lesson.js`, `lesson-4/**`, mini-lesson data and CSS                                                                                                                                                   |
| generators | `fl4/generators`         | `problem-types-4.js`, `problem-types/**`, equivalence handling in `problem-bank.js` `validateAnswer`                                                                                                        |
| adaptive   | `fl4/adaptive`           | `difficulty-levels.js`, `diagnostic-engine.js`, `rescue.js`, `placement.js`, `tutor-engine.js`, practice-flow hooks in `app.js`                                                                             |
| dashboard  | `fl4/dashboard`          | `dashboard-4.js`, `recommendation-engine.js`, `skill-card.js`, `skill-map.js`, home + practice screen restyle (`ds4-screens.css`), feedback panel placement, trail/games feedback via `feedback-machine.js` |
| teacher    | `fl4/teacher`            | `teacher-4.js`, `reports-4.js`, `achievements-4.js`, `certificate.js`, `family/**`, `family-page.js`                                                                                                        |

The integrator (main session) owns `docs/`, merges, final QA, the `validate:fluency` list and deployment.
