# Noam Smart Planning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add smarter assignment capture, source links, assignment-aware Academic Help, and adaptive workload forecasting to Focus School.

**Architecture:** Extend the existing normalized assignment/import models and pure helper layer in `focus-school/app.js`. Keep parsing and forecasting deterministic, render through current views/actions, and preserve offline/sync behavior without dependencies.

**Tech Stack:** Vanilla JavaScript, static HTML/CSS, Node VM tests, Cloudflare Pages.

---

### Task 1: Smart capture model and parser

**Files:**
- Modify: `focus-school/app.js`
- Create: `test/focus-school-smart-planning.test.mjs`

- [ ] Write failing VM tests asserting `safeSourceUrl`, `matchImportClass`, and `parseImportText` extract class aliases, due time, teacher, assignment type, and HTTPS source links while rejecting unsafe URLs.
- [ ] Run `node test/focus-school-smart-planning.test.mjs`; expect failure because the helpers are not exported.
- [ ] Extend normalized assignment/import records with bounded metadata and implement the pure parser helpers.
- [ ] Run the focused test; expect parser assertions to pass.
- [ ] Commit with `feat: improve assignment capture parsing`.

### Task 2: Source-link flow and inbox presentation

**Files:**
- Modify: `focus-school/app.js`
- Modify: `focus-school/styles.css`
- Test: `test/focus-school-smart-planning.test.mjs`

- [ ] Add failing source assertions for “Open source” and safe link attributes.
- [ ] Run the focused test; expect the UI assertion to fail.
- [ ] Carry metadata through queue/import, show it in Import Inbox, and expose source links on imported assignment cards.
- [ ] Run the focused test and all `test/focus-school-*.test.mjs` files; expect all to pass.
- [ ] Commit with `feat: preserve assignment source links`.

### Task 3: Context-aware Academic Help

**Files:**
- Modify: `focus-school/app.js`
- Test: `test/focus-school-smart-planning.test.mjs`

- [ ] Add failing tests requiring due date, directions, incomplete steps, and estimate in `academicHelpPrompt` and `buildGuidedHelpPrompt`, with no URL leakage.
- [ ] Run the focused test; expect prompt-context assertions to fail.
- [ ] Add a bounded context builder shared by both prompt paths.
- [ ] Run focused and existing academic-help tests; expect all to pass.
- [ ] Commit with `feat: enrich academic help context`.

### Task 4: Adaptive workload forecasting

**Files:**
- Modify: `focus-school/app.js`
- Modify: `focus-school/styles.css`
- Test: `test/focus-school-smart-planning.test.mjs`

- [ ] Add failing tests for the 60-minute fallback, clamped median adaptation, seven-day load totals, overload flags, and earliest-capacity move suggestions.
- [ ] Run the focused test; expect missing-helper failure.
- [ ] Implement `estimateDailyCapacity` and `buildWorkloadForecast` as pure helpers.
- [ ] Render the forecast and suggestions in Daily Briefing; suggestions open the assignment editor and never mutate dates automatically.
- [ ] Run focused and Focus School tests; expect all to pass.
- [ ] Commit with `feat: add adaptive workload forecast`.

### Task 5: Release verification and deployment

**Files:**
- Modify: `focus-school/sw.js`

- [ ] Bump the service-worker cache version after tests demonstrate the new UI markers.
- [ ] Run `node --check focus-school/app.js`, focused tests, `npm test`, `npm run lint`, `npm run build`, and `npm run qa:loop`; expect zero failures.
- [ ] Verify desktop and 390px mobile flows in a real browser, including safe source opening, enriched help selection, forecast warnings, and no horizontal overflow.
- [ ] Review the scoped diff and commit `chore: prepare smart planning release`.
- [ ] Rebase on `origin/main`, rerun the QA loop, push the feature branch, fast-forward `main`, and deploy with `ALLOW_DEPLOY=1 npm run deploy:noam`.
- [ ] Verify the live custom domain serves the exact released `app.js`, new UI markers, and the bumped service-worker version.
