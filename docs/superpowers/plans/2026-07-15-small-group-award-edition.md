# Small-Group Award Edition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a private, adaptive Evidence Lab to all 128 small-group studios so students choose representations, revise ideas through anonymous consensus, receive a transparent next move, create original mathematics, and leave with a printable evidence artifact.

**Architecture:** Keep lesson configs as the curriculum source of truth. Add one focused innovation module that owns premium interactions and a deterministic adaptive-path function, pass lightweight attempt/hint/solve events out of the existing practice module, and let the renderer compose one in-memory `studioState`. Load a scoped static stylesheet from the existing UI injector so current modules remain under the repository size limit.

**Tech Stack:** Static ES modules, DOM APIs, CSS, Node `node:test`, Playwright, Axe, Vite, guarded Cloudflare Pages ship script.

---

## Task 1: Lock the deterministic coaching contract

**Files:**

- Create: `tools/small-group-innovation.test.mjs`
- Create: `engine/core/small-group-innovation.js`

1. Write Node tests that import `chooseAdaptivePath` and assert:
   - readiness 1–2, two incorrect attempts, or two opened hints chooses `stabilize`;
   - a completed Group 2 session with high readiness and no struggle chooses `stretch`;
   - the middle case chooses `connect`;
   - every returned path provides a student label, reason, prompt, and selectable alternatives.
2. Run `node --test tools/small-group-innovation.test.mjs` and confirm RED because the module/export does not exist.
3. Implement only the pure deterministic selector and its three pathway descriptors.
4. Re-run the Node test and confirm GREEN.
5. Run `node --check engine/core/small-group-innovation.js`.

## Task 2: Specify the premium student journey in the browser

**Files:**

- Modify: `tests/small-group-studio.spec.ts`

1. Add a Playwright test for Group 1 that expects:
   - a “Choose your proof path” control with four native buttons;
   - selecting a path changes the response prompt and marks the selection;
   - an anonymous three-voice consensus board hides the distribution until all three votes are recorded;
   - the team can mark “revised” and record why;
   - the adaptive coach shows a transparent recommendation and allows a different path;
   - the Create-a-Challenge lab captures a challenge and verification note;
   - completion reveals a printable Studio Evidence Card containing the chosen path, revision, and challenge.
2. Add a Group 2 assertion that the creation prompt requires a constraint, tricky case, or misconception and the coach can surface a stretch pathway.
3. Run `npx playwright test tests/small-group-studio.spec.ts --grep "Award Edition"` and confirm RED on missing premium UI.

## Task 3: Build proof choice and anonymous consensus

**Files:**

- Modify: `engine/core/small-group-innovation.js`
- Create: `assets/small-group-innovation.css`
- Modify: `engine/core/small-group-ui.js`
- Modify: `engine/core/small-group-renderer.js`

1. Implement `createProofPathLab(config, variant, state)` using a labeled fieldset, four buttons, a live prompt, and optional response textarea. Store only the selected path and local response.
2. Implement `createConsensusLab(config, variant, state)` as a pass-the-device three-voice protocol. Keep individual votes concealed in the UI until the third vote, then reveal an anonymous count distribution.
3. Add native kept/revised controls and a reason textarea; store the team-level result in memory.
4. Compose proof choice inside Build and consensus inside Talk without adding another progress phase.
5. Load `/assets/small-group-innovation.css?v=20260715-award1` once from `injectSmallGroupStyles` and add scoped responsive, focus, reduced-motion, and print styles.
6. Re-run the focused Award Edition Playwright test. Expect the proof and consensus assertions GREEN while later assertions remain RED.

## Task 4: Instrument practice and add the adaptive coach

**Files:**

- Modify: `engine/core/small-group-practice.js`
- Modify: `engine/core/small-group-renderer.js`
- Modify: `engine/core/small-group-innovation.js`
- Modify: `tools/small-group-innovation.test.mjs`

1. Extend practice/check creators with an optional events object while preserving existing call compatibility.
2. Report `onAttempt({ correct })`, `onHint()`, and `onSolved()` from every applicable practice type. Do not expose answers or add storage/network calls.
3. Track attempts, incorrect attempts, hints, and solved checks in shared `studioState`.
4. Implement `createAdaptiveCoach(config, variant, state)` with a “Find my next move” button that calls the pure selector, explains why the path was recommended, and offers all three pathways as student-selectable alternatives.
5. Add/extend unit tests for boundary cases and rerun `node --test tools/small-group-innovation.test.mjs`.
6. Re-run the focused Award Edition Playwright test and confirm coaching assertions GREEN.

## Task 5: Add original creation and the evidence artifact

**Files:**

- Modify: `engine/core/small-group-innovation.js`
- Modify: `engine/core/small-group-renderer.js`
- Modify: `assets/small-group-innovation.css`

1. Implement `createChallengeLab(config, variant, state)` using the lesson objective, key idea, and vocabulary with graceful generic fallbacks.
2. Give Group 1 a one-feature remix brief and Group 2 a constraint/counterexample/misconception brief.
3. Require both a student-created challenge and a verification note before recording the artifact.
4. Implement `createEvidenceCard(config, state)` with lesson/standard, confidence change, proof path, vocabulary, team revision, adaptive path, challenge, verification, and a print/save button. Include no name or identity field.
5. Reveal and refresh the evidence card only after reflection completion.
6. Re-run the focused Award Edition browser test and confirm the complete student journey GREEN.

## Task 6: Add the private Facilitation Console

**Files:**

- Modify: `engine/core/small-group-innovation.js`
- Modify: `engine/core/small-group-renderer.js`
- Modify: `assets/small-group-innovation.css`
- Modify: `tests/small-group-studio.spec.ts`

1. Add a failing Playwright test asserting the console and its text are absent from student mode/accessibility tree.
2. Assert teacher mode shows six anonymous observation toggles, live evidence count, deterministic next-move recommendation, print button, and privacy statement.
3. Confirm RED on missing console behavior.
4. Implement `createTeacherEvidenceConsole(config, state)` and connect updates to the shared session state without names, analytics, persistence, or external transmission.
5. Re-run the teacher privacy test and confirm GREEN.

## Task 7: Accessibility, resilience, and regression verification

**Files:**

- Modify: `tests/small-group-studio.spec.ts`
- Modify: `tools/validate-small-group-lessons.mjs` only if a static contract is needed

1. Extend browser checks to assert no name/email input exists, all premium controls are keyboard-reachable native controls, and a 390px viewport has no horizontal overflow.
2. Run Axe against both student and teacher modes; reject serious or critical violations.
3. Syntax-check modified JavaScript modules.
4. Run:
   - `node --test tools/small-group-innovation.test.mjs`
   - `npx playwright test tests/small-group-studio.spec.ts`
   - `npm run validate:small-groups`
   - `npm run validate`
   - `npm test`
   - `npm run e2e`
5. Restore any generated files changed only as a side effect of build/test by applying the exact pre-run content; do not commit unrelated generated drift.

## Task 8: Review, commit, ship, and verify production

**Files:**

- Review every file in the feature diff.

1. Run `git diff --check`, review `git status --short`, and confirm no unrelated files are included.
2. Commit the implementation with `feat(lessons): add small-group award edition`.
3. Run the guarded dry verification against the feature SHA.
4. Deploy with `ALLOW_DEPLOY=1 npm run ship -- <feature-sha>`. The ship script must integrate the feature onto the newest `origin/main`, push, and deploy.
5. Verify the production build stamp matches the shipped SHA.
6. Open the ordinary, unversioned URLs for `/curriculum/`, one Group 1 studio, and one Group 2 studio. Verify the premium interactions, no-store curriculum response, mobile layout, and zero public console errors.
7. Report the full upgrade inventory, test results, production SHA, and live routes.
