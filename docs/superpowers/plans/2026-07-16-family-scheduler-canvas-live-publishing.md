# Family Scheduler, Canvas Connection, and Live Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a professional family-meeting scheduler, restore ClassDojo, provide direct teacher-only Canvas actions, and make published family updates appear immediately.

**Architecture:** Keep public scheduling data and protected request data in separate API representations backed by D1. Delegate scheduler and Canvas operations from the existing Family Connections route into focused modules. Keep Canvas credentials in the current page session only and use the existing password middleware for every protected operation.

**Tech Stack:** Static HTML/CSS/ES modules, Cloudflare Pages Functions, D1, Web Crypto, Node assertion tests, Playwright browser QA.

---

### Task 1: Live publication and ClassDojo repair

**Files:**
- Modify: `curriculum/family-connections/family-app.js`
- Modify: `functions/api/family-connections/[[path]].js`
- Modify: `curriculum/family-connections/family-connections.test.mjs`
- Modify: `functions/api/family-connections/family-connections-api.test.mjs`

- [ ] Add failing assertions that ClassDojo uses `safeExternalUrl`, the published response is `no-store`, fetch uses `cache: "no-store"`, and visibility-aware revision polling exists.
- [ ] Run both tests and confirm the new assertions fail for the missing behavior.
- [ ] Render every safe ClassDojo URL, return published snapshots with `no-store`, and add a 30-second visible-tab refresh that re-renders only on a higher revision.
- [ ] Re-run both tests and commit `fix(family): refresh live publications and restore ClassDojo`.

### Task 2: Scheduler domain and storage

**Files:**
- Create: `functions/api/family-connections/scheduler.js`
- Create: `functions/api/family-connections/scheduler.test.mjs`
- Modify: `functions/api/family-connections/[[path]].js`

- [ ] Write failing tests for future-slot validation, overlap rejection, public-field filtering, atomic family claims, teacher confirmation/decline/cancel transitions, invitation token hashing, expiration, and single-use responses.
- [ ] Run `node functions/api/family-connections/scheduler.test.mjs` and confirm failures reference missing exports.
- [ ] Implement `createMemorySchedulerStore()`, `createD1SchedulerStore(db)`, and `handleSchedulerRequest(context, store, access)` with flat routes `schedule-availability`, `schedule-request`, `schedule-dashboard`, `schedule-slot`, `schedule-decision`, `schedule-invitation`, and `schedule-response`.
- [ ] Create D1 tables idempotently with parameterized queries. Public responses must pass through `publicSlot()` and never include contact fields or token hashes.
- [ ] Re-run scheduler and existing API tests and commit `feat(family): add secure meeting scheduler API`.

### Task 3: Public scheduler interface

**Files:**
- Modify: `curriculum/family-connections/index.html`
- Create: `curriculum/family-connections/family-scheduler.js`
- Create: `curriculum/family-connections/family-scheduler.css`
- Modify: `curriculum/family-connections/family-app.js`
- Modify: `curriculum/family-connections/shared/copy-defaults.js`
- Modify: `curriculum/family-connections/family-connections.test.mjs`

- [ ] Add failing static contracts for the scheduler navigation link, `family-scheduler` region, availability list, request form, student-first-name guidance, confirmation disclaimer, and scheduler module.
- [ ] Confirm the static test fails.
- [ ] Build grouped local-date slot cards, an accessible request form, loading/empty/error/success states, an invitation response panel driven by a `meeting` query token, and concise bilingual labels.
- [ ] Ensure the form collects guardian name, student first name, email, optional note, consent, and a hidden honeypot only.
- [ ] Re-run static and API tests and commit `feat(family): add family meeting requests`.

### Task 4: Teacher scheduling console

**Files:**
- Modify: `curriculum/family-connections/teacher/index.html`
- Create: `curriculum/family-connections/teacher/scheduler-admin.js`
- Create: `curriculum/family-connections/teacher/scheduler-admin.css`
- Modify: `curriculum/family-connections/teacher/teacher-app.js`
- Modify: `curriculum/family-connections/teacher/teacher-mode.test.mjs`

- [ ] Add failing contracts for slot creation, status dashboard, request decisions, invitation creation, copied response links, and protected contact display.
- [ ] Confirm the teacher test fails.
- [ ] Implement an `Availability & family meetings` disclosure with a date/time/duration/format form, status-filtered meeting cards, confirm/decline/cancel/complete actions, and an invitation form that generates a copyable secure link.
- [ ] Refresh the dashboard after every mutation and provide keyboard-accessible inline status messages.
- [ ] Re-run teacher, scheduler, and API tests and commit `feat(family): add teacher scheduling console`.

### Task 5: Direct Canvas connection

**Files:**
- Create: `functions/api/family-connections/canvas-direct.js`
- Create: `functions/api/family-connections/canvas-direct.test.mjs`
- Modify: `functions/api/family-connections/[[path]].js`
- Modify: `curriculum/family-connections/teacher/index.html`
- Create: `curriculum/family-connections/teacher/canvas-direct.js`
- Modify: `curriculum/family-connections/teacher/teacher-app.js`
- Modify: `curriculum/family-connections/teacher/teacher-mode.test.mjs`

- [ ] Write failing tests for host allowlisting, sanitized connection results, Canvas authorization headers, announcement creation, calendar event upsert, unsupported actions, and absence of token persistence/response leakage.
- [ ] Confirm the Canvas test fails for missing exports.
- [ ] Implement `validateCanvasHost()`, `testCanvasConnection()`, and `syncCanvas()` with injected fetch support. Allow `*.instructure.com` and `CANVAS_ALLOWED_HOSTS`; reject credentials in URLs and non-443 ports.
- [ ] Add protected `canvas-connect` and `canvas-sync` routes. Build payloads from server-side published snapshot/open slots.
- [ ] Add a password token field, `Test connection`, `Publish weekly update`, `Sync meeting availability`, and `Forget token` controls. Hold the token only in module memory and clear it on unload.
- [ ] Preserve the existing feed/copy/download tools as fallbacks, re-run all Family Connections tests, and commit `feat(family): add direct Canvas connection`.

### Task 6: Final verification and deployment

**Files:**
- Review every changed path from `git status --short`.

- [ ] Run `node` syntax checks and all Family Connections tests.
- [ ] Run `npm test`, `npm run build`, and `npm run validate:static`.
- [ ] Run browser QA at desktop and 390px widths for public requests, teacher scheduling, live revision refresh, ClassDojo, Canvas session behavior, keyboard focus, overflow, and console errors.
- [ ] Scan changed files for placeholders, debug statements, secrets, student last-name/ID collection, unsafe URLs, and public PII leakage.
- [ ] Review the diff and commit any verification repairs.
- [ ] Use the guarded ship script with only this feature's commits, poll the production build stamp, and verify public, protected, scheduler, ClassDojo, and Canvas routes live.
