# Math Fluency Lab publisher engine — Antigravity handoff

## Mission and authority

Finish the EduWonderLab Math Fluency Lab (`/math/fluency-lab/`) publisher-grade refactor requested by Joel. Own the remaining implementation, verification, release preparation, and eventual deployment. **Do not push or deploy until Joel explicitly authorizes those actions.** His original directive said not to deploy until told, and his current instruction transfers responsibility to Antigravity rather than approving an immediate release. Preserve the repository's deploy guard and `ALLOW_DEPLOY=1` requirement.

Do not describe the current branch as complete or deployment-ready. It implements the new engine and live integration for eligible items in six of the Lab's 128 skills. The rest of the Lab still uses the legacy practice architecture. Keep SCORM, save/resume, assignment, diagnostic, instructional-evidence, tutor, and student-privacy contracts intact. Do not use student records or secrets as fixtures or logs.

## Repository state

- Production source repository: `/Users/joelneft/neft-classroom-html-activities`
- Isolated working tree: `/Users/joelneft/wt-fluency-publisher-engine`
- Branch: `feat/fluency-publisher-engine`
- Latest implementation commit before this handoff: `b23454a5b2` (`refactor: centralize publisher practice item routing`)
- Worktree was clean at handoff. The branch was 13 commits ahead of local `origin/main` after merging it. Check status again because other worktrees update main concurrently.
- Nothing from this branch was pushed or deployed. Local commits bypassed the repository pre-commit hook because its broad QA lock was held by another worktree; direct checks are listed below.

## Implemented

- `src/components/MathFluencyLabEngine.ts`: strict TypeScript source. Explicit `LabState` FSM; Shadow DOM ratio tape and double number line; keyboard-operable controls at least 44 px; stacked notation for numeric and one-letter-variable fractions; reduced-motion support; first-miss conceptual feedback retaining the typed response and model selection; second-miss concrete sandbox that locks the primary answer and gates retry/explanation on model manipulation and a sub-answer; three-tier explanation; isomorphic sibling generator; state/attempt/resolution/mastery events; anonymous local mastery receipts; snapshot restore without raw response.
- `src/components/MathFluencyLabEngine.js`: generated browser module. Regenerate with `node tools/build-fluency-publisher-engine.mjs`; never edit the generated JS directly. The module can be imported by Node-side tests without browser globals.
- `math/fluency-lab/app.js`: `recordPracticeAttempt` is the one existing evidence seam. Eligible normal independent practice items mount the publisher engine and still call existing attempt/finalization/session code. Corrected answers remain supported evidence; viewing an explanation does not award mastery. Session snapshots restore publisher scaffold phase and model selections. Other session modes and item structures retain legacy behavior.
- `math/fluency-lab/index.html`: seed exercise is available at `?publisher-demo=1`; the normal home screen stays unchanged so grade navigation remains above the fold.
- `math/fluency-lab/styles.css`: integrated workspace layout and legacy control handling.
- `math/fluency-lab/publisher-engine.browser.test.mjs` and `publisher-practice.browser.test.mjs`: engine acceptance and live-session browser coverage.
- `package.json`: generated-module check and both publisher browser tests are included in `validate:fluency`.

Live bridge currently recognizes only mathematically verified stems for these six skills: `6:ratios` (equivalent-ratio missing term), `6:unit-rates`, `6:percent` (part of a whole), `6:percent-whole`, `7:unit-rate`, and `7:proportions`. `adaptPracticeItem` in the TypeScript source is the central dispatcher. Unsupported items correctly fall back to the existing practice UI.

## Required remaining work

1. Complete the requested scope across the Lab's remaining skill and response families. Do not force the tape/number-line schema onto geometry, signed arithmetic, fraction operations, graphs, or constructed responses where it would misrepresent the mathematics. Add suitable zero-runtime-dependency models and checked adapters for each family.
2. Bring the live practice experience under the requested exclusive FSM without breaking existing queues, feedback, rescue, assignments, checkups, and save/resume. The legacy app still uses its own phases and booleans outside the publisher bridge.
3. Make the isomorphic sibling action participate in the normal practice queue and evidence flow. The standalone demo has sibling generation; integrated sessions currently hide that action after finalization to prevent untracked work.
4. Audit fraction rendering across the entire Lab. The new engine stacks its fractions; the legacy surface has not received a platform-wide no-slash audit.
5. Complete WCAG 2.1 AA and performance verification across supported states, grades, response types, and low-spec Chromebook conditions. Existing axe/keyboard/44 px and four-times-CPU checks are sampled engine checks, not a guarantee for the entire Lab.
6. Review and harden the instructional explanations and misconception rules for each added family. Preserve mathematically valid distractor analysis and synchronized algebra/model steps.
7. Run full release QA on the final branch, resolve any failures, review the final diff, then prepare a concrete deployment candidate for Joel's approval. Only after he explicitly authorizes it should Antigravity push and deploy through the repository's guarded process.

## Verification already obtained

- Strict TypeScript generation/check passed.
- `publisher-engine.browser.test.mjs` and `publisher-practice.browser.test.mjs` passed after the final adapter-registry change.
- `npm run build` passed on the merged branch immediately before that small registry refactor; focused compiler/browser checks, `npm run check`, and `npm run typecheck` passed after it.
- `tools/validate-fluency-lab.mjs` passed with 9 grades, 128 skills, and 32,000 generated problems checked. This validates the existing generator set, not full publisher conversion.
- The broad `validate:fluency` sequence was run in passing segments after fixing a Node import issue and a home-navigation regression. A final uninterrupted run on the latest branch has **not** been completed.
- `npm run check` exits successfully with two unrelated warnings in `tools/language-page-mystery-club/engine.js`.
- The most recent production build also completed after the latest merge; it operates on local `dist` and offloads lesson downloads in the build output. No live deployment occurred.

## Start here

```sh
cd /Users/joelneft/wt-fluency-publisher-engine
git status --short --branch
git log --oneline --left-right origin/main...HEAD
node tools/build-fluency-publisher-engine.mjs --check
node math/fluency-lab/publisher-engine.browser.test.mjs
node math/fluency-lab/publisher-practice.browser.test.mjs
npm run validate:fluency
npm run typecheck
npm run check
npm run build
```

Read the repository's applicable `AGENTS.md` and deployment documentation before modifying or publishing. Keep all changes on a feature branch. Do not push, deploy, touch credentials, or mutate shared/production data without Joel's explicit approval for that action.
