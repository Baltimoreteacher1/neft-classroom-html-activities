# Noam Reliability Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deduplicating assignment import inbox, useful daily briefings, readable cross-device history, and safe undo/recent-change recovery to Focus School.

**Architecture:** Extend the canonical planner state with normalized `importInbox` and `changeLog` collections, merged using stable IDs and capped history. Keep undo functions runtime-only while recording privacy-safe change summaries in synced state; route Classroom paste and Gmail conversion through one inbox and reuse existing assignment, to-do, class, sync, modal, and delegated-action codepaths.

**Tech Stack:** Static HTML/CSS/JavaScript PWA, Node assertion tests, existing IndexedDB/cloud sync, Cloudflare Pages.

---

### Task 1: Import inbox and duplicate detection

**Files:** Modify `focus-school/app.js`, `focus-school/styles.css`; create `test/focus-school-reliability.test.mjs`.

- [ ] Write failing assertions for canonical candidate keys, duplicate detection against assignments and pending inbox entries, and candidate normalization.
- [ ] Run `node test/focus-school-reliability.test.mjs`; expect missing-helper failure.
- [ ] Add normalized `importInbox` state and route Classroom paste plus Gmail task/reminder conversion into a review queue with Import, Edit, Dismiss, and duplicate labels.
- [ ] Rerun the focused test; expect inbox assertions to pass.

### Task 2: Morning and after-school briefings

**Files:** Modify `focus-school/app.js`, `focus-school/styles.css`; update `test/focus-school-reliability.test.mjs`.

- [ ] Add failing assertions for deterministic morning and after-school briefing summaries from assignments, to-dos, routines, and recent changes.
- [ ] Run the focused test and confirm the briefing helper is missing.
- [ ] Add a Daily Briefing view and contextual home card; morning prioritizes due/overdue work and first action, while after-school highlights new changes, workload, and the next routine.
- [ ] Rerun the focused test; expect briefing assertions to pass.

### Task 3: Sync/change history

**Files:** Modify `focus-school/app.js`, `focus-school/styles.css`; update `test/focus-school-reliability.test.mjs`.

- [ ] Add failing assertions for stable change-event normalization and conflict-safe capped log merging.
- [ ] Run the focused test and confirm history helpers are absent.
- [ ] Record privacy-safe assignment/import/reminder events with timestamp and device label, merge logs across devices, and show Recent Sync Activity under Backup & Sync and More.
- [ ] Rerun the focused test; expect merge/history assertions to pass.

### Task 4: Undo and recently changed recovery

**Files:** Modify `focus-school/app.js`, `focus-school/styles.css`; update `test/focus-school-reliability.test.mjs`.

- [ ] Add failing source/UI assertions for undoable complete, reopen, delete, import, dismiss, and reschedule actions.
- [ ] Run the focused test and confirm recovery assertions fail.
- [ ] Add a runtime undo stack with an accessible toast Undo control and a Recently Changed view backed by synced `changeLog`; preserve original IDs and timestamps when restoring.
- [ ] Rerun the focused test; expect recovery assertions to pass.

### Task 5: Release verification

**Files:** Modify `focus-school/sw.js`; verify all scoped files.

- [ ] Bump the service-worker cache version.
- [ ] Run focused tests, every Focus School regression, `npm test`, build, lint, validation, and repository QA loop; expect zero failures.
- [ ] Browser-test desktop and 390×844 mobile flows for inbox review, duplicate labels, both briefings, sync history, undo, and recently changed with no console errors or obscured controls.
- [ ] Review the diff, commit only scoped files, rebase onto current remote main, fast-forward remote main, deploy with `ALLOW_DEPLOY=1 npm run deploy:noam`, and verify live assets plus installed-PWA activation.
