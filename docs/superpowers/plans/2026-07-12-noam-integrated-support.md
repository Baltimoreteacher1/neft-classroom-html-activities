# Noam Integrated Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Focus School into a cohesive assignment-to-help-to-action system while improving recovery planning, offline resilience, navigation, and private progress coaching.

**Architecture:** Extend the existing single-source planner state and delegated `ACTIONS` system in `focus-school/app.js`; do not add dependencies or a second data store. Pure helpers are exported through `window.__FOCUS_SCHOOL_TEST__` for deterministic tests, while UI changes reuse existing cards, modals, assignment steps, reminders, activity history, class metadata, and AI endpoint.

**Tech Stack:** Static HTML/CSS/JavaScript PWA, Node assertion tests, Cloudflare Pages/Functions, existing service worker.

---

### Task 1: Shared academic-support context and assignment entry points

**Files:** Modify `focus-school/app.js`, `focus-school/styles.css`; test `test/focus-school-integrated-support.test.mjs`.

- [ ] Write failing assertions for `academicHelpPrompt`, direct assignment `Get help` controls, and selected-assignment routing.
- [ ] Run `node test/focus-school-integrated-support.test.mjs`; expect missing helper/UI assertions to fail.
- [ ] Add a reusable support-context builder and `Get help` buttons to assignment cards; route to Academic Help with a selected assignment and prefilled hint-first prompt.
- [ ] Rerun the focused test; expect all Task 1 assertions to pass.

### Task 2: Guided tutoring flow

**Files:** Modify `focus-school/app.js`, `focus-school/styles.css`; test `test/focus-school-integrated-support.test.mjs`.

- [ ] Add failing assertions for the three-stage flow: assignment, stuck point, support style.
- [ ] Run the focused test and confirm the new guided-flow assertion fails.
- [ ] Render compact guided choices that populate a specific request while preserving free text, photo upload, Hint/Solve modes, and existing prompt chips.
- [ ] Rerun the focused test; expect the guided-flow assertions to pass.

### Task 3: Preview-before-save advice actions

**Files:** Modify `focus-school/app.js`, `focus-school/styles.css`; test `test/focus-school-integrated-support.test.mjs`.

- [ ] Add failing tests for extracting safe checklist steps and building a preview without mutating state.
- [ ] Run the focused test and confirm failure because the helpers do not exist.
- [ ] Add AI-response actions for previewing extracted steps, creating a focus block, or creating a reminder; apply planner mutations only from explicit confirmation actions.
- [ ] Rerun the focused test; expect preview/no-mutation and confirmation assertions to pass.

### Task 4: Teacher escalation and offline strategies

**Files:** Modify `focus-school/app.js`, `focus-school/styles.css`; test `test/focus-school-integrated-support.test.mjs`.

- [ ] Add failing assertions for a concise teacher-help draft and deterministic offline strategy selection.
- [ ] Run the focused test and confirm the helper assertions fail.
- [ ] Offer `Ask my teacher` after repeated support turns and on errors; reuse saved class teacher/email data and existing Gmail compose flow. Render actionable offline strategy cards whenever AI is unavailable.
- [ ] Rerun the focused test; expect escalation/offline assertions to pass.

### Task 5: Calm catch-up mode

**Files:** Modify `focus-school/app.js`, `focus-school/styles.css`; test `test/focus-school-integrated-support.test.mjs`.

- [ ] Add failing assertions that catch-up planning returns at most three urgency-ranked assignments and includes realistic minutes.
- [ ] Run the focused test and confirm the catch-up helper is missing.
- [ ] Add a catch-up card and modal that show only three recovery actions with Start, Get help, and Plan later controls.
- [ ] Rerun the focused test; expect catch-up assertions to pass.

### Task 6: Personalized navigation

**Files:** Modify `focus-school/app.js`, `focus-school/styles.css`; test `test/focus-school-integrated-support.test.mjs`.

- [ ] Add failing assertions for stable navigation ranking: core Now/Homework remain pinned, frequently used views fill the remaining visible slots, all views remain reachable.
- [ ] Run the focused test and confirm ranking helper failure.
- [ ] Track local view-open counts, render five primary mobile tabs plus More, and expose every secondary view inside More without changing desktop keyboard shortcuts.
- [ ] Rerun the focused test; expect navigation assertions to pass.

### Task 7: Private progress insights

**Files:** Modify `focus-school/app.js`, `focus-school/styles.css`; test `test/focus-school-integrated-support.test.mjs`.

- [ ] Add failing assertions for estimation accuracy, best focus period, delayed class, and effective support strategy summaries from local planner history.
- [ ] Run the focused test and confirm insight helper failure.
- [ ] Record privacy-safe support outcomes and render a `What helps me` card in Insights using only local/synced planner state—never AI transcript text.
- [ ] Rerun the focused test; expect insight assertions to pass.

### Task 8: Release hardening

**Files:** Modify `focus-school/sw.js`; verify all Focus School files and tests.

- [ ] Bump the service-worker cache version so installed PWAs receive the release.
- [ ] Run `node --check focus-school/app.js`, all `test/focus-school-*.test.mjs`, `npm test`, `npm run build`, and the repository QA loop; expect zero failures.
- [ ] Browser-test desktop and 390×844 mobile flows, including direct Get help, guided prompt, preview/cancel/confirm, catch-up, offline fallback, More navigation, and Insights; expect no console errors or obscured controls.
- [ ] Review `git diff --check`, commit only scoped files, fast-forward remote `main`, run `ALLOW_DEPLOY=1 npm run deploy:noam`, and verify the live bundle/service-worker version.
