# Family Connections Section Manager and Scheduling Secretary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add complete teacher-managed class sections and a recurring-availability scheduling secretary with immediate, private, conflict-safe family booking.

**Architecture:** Keep the existing static teacher/family interfaces and D1 compare-and-swap state record. Isolate pure section operations, Eastern-time recurrence expansion, and calendar generation into testable modules; expose those operations through the existing protected scheduler API and render them in focused teacher and family UI components.

**Tech Stack:** Static HTML/CSS/ES modules, Cloudflare Pages Functions, D1, Node test runner/assertions, Playwright, npm guarded ship workflow.

---

## File map

- Create `curriculum/family-connections/teacher/section-manager.js`: pure section add/rename/default/delete operations plus DOM rendering.
- Modify `curriculum/family-connections/teacher/teacher-app.js`: connect section manager to draft state and dirty-state lifecycle.
- Modify `curriculum/family-connections/teacher/index.html` and `teacher.css`: section manager and recurring rule form markup/styles.
- Create `functions/api/family-connections/scheduler-rules.js`: rule validation, Eastern-time recurrence expansion, stable slot keys, and state normalization.
- Modify `functions/api/family-connections/scheduler.js`: rule CRUD, refresh, immediate booking, cancellation semantics, and public confirmation allowlist.
- Modify `functions/api/family-connections/scheduler-d1.js`: persist normalized rule state and expose new atomic mutations.
- Modify `curriculum/family-connections/teacher/scheduler-admin.js` and `scheduler-admin.css`: rule editor and categorized meeting desk.
- Create `curriculum/family-connections/calendar-event.js`: privacy-safe ICS generation/download helper.
- Modify `curriculum/family-connections/family-scheduler.js` and `family-scheduler.css`: immediate bilingual confirmation and calendar action.
- Extend existing tests in the same feature directories; add focused pure-module tests for sections, recurrence, and calendar events.

### Task 1: Section operations and manager UI

**Files:**
- Create: `curriculum/family-connections/teacher/section-manager.js`
- Create: `curriculum/family-connections/teacher/section-manager.test.mjs`
- Modify: `curriculum/family-connections/teacher/teacher-app.js`
- Modify: `curriculum/family-connections/teacher/index.html`
- Modify: `curriculum/family-connections/teacher/teacher.css`
- Test: `curriculum/family-connections/teacher/teacher-mode.test.mjs`

- [ ] **Step 1: Write failing pure-operation tests**

Test `addSection`, `renameSection`, `setDefaultSection`, and `deleteSection` with assertions that IDs remain stable, labels are trimmed, duplicate slugs gain a suffix, deleting the last section throws, deleting the default reassigns the first remaining section, and deleting the active section returns a valid replacement ID.

```js
const renamed = renameSection(sections, "math-1", "  Period One  ");
assert.equal(renamed[0].id, "math-1");
assert.equal(renamed[0].label, "Period One");
assert.throws(() => deleteSection([sections[0]], "math-1", "math-1"), /last section/i);
assert.equal(deleteSection(sections, "math-1", "math-1").sections[0].isDefault, true);
```

- [ ] **Step 2: Verify RED**

Run: `node curriculum/family-connections/teacher/section-manager.test.mjs`
Expected: FAIL because `section-manager.js` does not exist.

- [ ] **Step 3: Implement pure operations and accessible renderer**

Export the four operations and `renderSectionManager(root, sections, activeId, handlers)`. Generate IDs from lowercase alphanumeric slugs with collision suffixes, cap sections at 12, require non-empty names, prevent final deletion, and use buttons with visible names and `aria-pressed` for active/default state.

- [ ] **Step 4: Wire draft-state behavior and markup**

Replace the select/add-button-only surface with `#section-manager`, `#new-section-name`, and `#add-section`. Keep `#section-editor` as the canonical section switch control for compatibility, synchronize it from the manager, call `markDirty()` for every mutation, and require `window.confirm` with the section name before deletion.

- [ ] **Step 5: Verify GREEN and commit**

Run: `node curriculum/family-connections/teacher/section-manager.test.mjs && node curriculum/family-connections/teacher/teacher-mode.test.mjs`
Expected: both PASS.

Commit: `feat(family): add teacher section manager`

### Task 2: Recurring availability domain

**Files:**
- Create: `functions/api/family-connections/scheduler-rules.js`
- Create: `functions/api/family-connections/scheduler-rules.test.mjs`
- Modify: `functions/api/family-connections/scheduler.js`
- Test: `functions/api/family-connections/scheduler.test.mjs`

- [ ] **Step 1: Write failing rule-normalization tests**

Cover allowed weekdays, `HH:MM` times, start/end dates, durations `[15,20,30,45,60]`, buffers `[0,5,10,15]`, supported formats, non-empty family-safe labels, enabled state, and invalid/range failures.

```js
assert.deepEqual(normalizeAvailabilityRule(validRule, now).weekdays, [1, 3]);
assert.throws(() => normalizeAvailabilityRule({ ...validRule, weekdays: [] }, now), /weekday/i);
assert.throws(() => normalizeAvailabilityRule({ ...validRule, bufferMinutes: 7 }, now), /buffer/i);
```

- [ ] **Step 2: Write failing recurrence and DST tests**

Assert a Sunday 9:00 rule expands to 9:00 Eastern on both sides of the November DST boundary, emits stable `ruleId:startAt` IDs, advances by `duration + buffer`, stops at the local end time, and produces identical output when refreshed twice.

- [ ] **Step 3: Verify RED**

Run: `node functions/api/family-connections/scheduler-rules.test.mjs`
Expected: FAIL because the rule module does not exist.

- [ ] **Step 4: Implement normalization and expansion**

Use `Intl.DateTimeFormat(..., { timeZone: "America/New_York" })` plus an offset-correction conversion from local date/time to UTC; do not use fixed `-04:00`/`-05:00` offsets. Export `normalizeSchedulerState`, `normalizeAvailabilityRule`, `expandAvailabilityRule`, and `refreshGeneratedSlots`. Generate a maximum 42-day window and preserve booked/cancelled/generated records while replacing only future open slots for changed/deleted rules.

- [ ] **Step 5: Verify GREEN and commit**

Run: `node functions/api/family-connections/scheduler-rules.test.mjs && node functions/api/family-connections/scheduler.test.mjs`
Expected: all assertions PASS.

Commit: `feat(family): generate recurring meeting availability`

### Task 3: Atomic scheduler rules and immediate family booking API

**Files:**
- Modify: `functions/api/family-connections/scheduler.js`
- Modify: `functions/api/family-connections/scheduler-d1.js`
- Modify: `functions/api/family-connections/scheduler.test.mjs`

- [ ] **Step 1: Write failing store tests**

Assert `createRule`, `updateRule`, `deleteRule`, and `refreshSlots` update `{ availabilityRules, slots, requests }`; rule deletion removes future open generated slots but preserves confirmed bookings; family `requestSlot` immediately returns `status: "confirmed"` and changes the slot to `booked`; cancellation never reopens a booked slot; legacy `{slots,requests}` state loads with an empty rule list.

- [ ] **Step 2: Write failing API tests**

Assert unauthenticated rule/dashboard mutations return 401, supported POST/PUT/DELETE routes return rule payloads, refresh returns generated slot counts, public booking response contains only `reference`, `status`, and public slot fields, and a second booking receives 409 with a just-booked message.

```js
assert.equal((await post("schedule-request", booking)).status, 201);
assert.equal(body.status, "confirmed");
assert.deepEqual(Object.keys(body).sort(), ["ok", "reference", "slot", "status"]);
assert.equal((await post("schedule-request", booking)).status, 409);
```

- [ ] **Step 3: Verify RED**

Run: `node functions/api/family-connections/scheduler.test.mjs`
Expected: FAIL on pending status and missing rule methods/routes.

- [ ] **Step 4: Implement store and API mutations**

Normalize state at store construction. Keep every D1 operation inside the existing compare-and-swap retry loop. Add method-aware protected routes for `schedule-rule` and `schedule-refresh`. Auto-confirm only family-selected open slots; leave teacher invitations as `invited`. Return an explicit public-safe confirmation object.

- [ ] **Step 5: Verify GREEN and commit**

Run: `node functions/api/family-connections/scheduler.test.mjs && node functions/api/family-connections/family-connections-api.test.mjs`
Expected: both PASS.

Commit: `feat(family): auto-confirm conflict-safe bookings`

### Task 4: Teacher availability workspace and meeting desk

**Files:**
- Modify: `curriculum/family-connections/teacher/index.html`
- Modify: `curriculum/family-connections/teacher/scheduler-admin.js`
- Modify: `curriculum/family-connections/teacher/scheduler-admin.css`
- Modify: `curriculum/family-connections/teacher/teacher-mode.test.mjs`

- [ ] **Step 1: Add failing static contracts**

Require `#availability-rule-form`, labeled weekday controls, start/end dates and times, duration/buffer/format/location controls, `#availability-rules`, `#refresh-generated-slots`, and three dashboard groups for upcoming, open, and history.

- [ ] **Step 2: Verify RED**

Run: `node curriculum/family-connections/teacher/teacher-mode.test.mjs`
Expected: FAIL on the first missing availability rule contract.

- [ ] **Step 3: Implement rule workspace**

Submit new and edited rules to `schedule-rule`, render pause/resume/edit/delete controls, use a named confirmation for deletion, refresh generated slots after mutations, and retain the one-off slot form under an “Advanced: add one time” disclosure.

- [ ] **Step 4: Implement categorized meeting desk**

Render confirmed future requests under Upcoming, open future slots under Open availability, and completed/cancelled/declined/past records under History. Provide complete/cancel, block/remove, refresh, and calendar actions with live-region status and disabled states while requests run.

- [ ] **Step 5: Verify GREEN and commit**

Run: `node curriculum/family-connections/teacher/teacher-mode.test.mjs`
Expected: PASS.

Commit: `feat(family): add availability and meeting desk UI`

### Task 5: Immediate bilingual confirmation and private ICS

**Files:**
- Create: `curriculum/family-connections/calendar-event.js`
- Create: `curriculum/family-connections/calendar-event.test.mjs`
- Modify: `curriculum/family-connections/family-scheduler.js`
- Modify: `curriculum/family-connections/family-scheduler.css`
- Modify: `curriculum/family-connections/family-connections.test.mjs`

- [ ] **Step 1: Write failing ICS privacy tests**

Assert RFC5545 escaping/folding basics, UTC start/end values, title/location/family URL inclusion, and absence of guardian name, student name, email, and note.

- [ ] **Step 2: Write failing bilingual/static tests**

Require “Meeting booked” / “Reunión reservada,” an add-to-calendar action, Eastern Time text, first-name-only guidance, and copy explaining that booking is immediate rather than a request.

- [ ] **Step 3: Verify RED**

Run: `node curriculum/family-connections/calendar-event.test.mjs && node curriculum/family-connections/family-connections.test.mjs`
Expected: FAIL because the calendar helper and confirmation contracts are missing.

- [ ] **Step 4: Implement confirmation flow**

Preserve typed values until booking succeeds. On 201, hide the form, render selected public slot details and short reference, expose an ICS Blob download, refresh availability, and focus the confirmation heading. On 409, keep entered data, announce that the time was just booked, refresh slots, and return focus to available times.

- [ ] **Step 5: Verify GREEN and commit**

Run: `node curriculum/family-connections/calendar-event.test.mjs && node curriculum/family-connections/family-connections.test.mjs`
Expected: both PASS.

Commit: `feat(family): confirm bookings with private calendar events`

### Task 6: Full QA, live deployment, and production verification

**Files:**
- Review all files changed in Tasks 1–5.

- [ ] **Step 1: Run focused and full automated checks**

Run: `npm test && npm run validate && npm run build`
Expected: all tests/validators PASS and Vite build completes.

- [ ] **Step 2: Run local browser QA**

Start: `npm run dev -- --host 127.0.0.1`

Verify teacher section add/rename/default/delete safeguards; rule create/edit/pause/resume/delete; recurring slot visibility; immediate family booking; ICS content; stale-slot recovery; mobile layout at 390px; keyboard focus order; no horizontal overflow; and unauthenticated protected API rejection.

- [ ] **Step 3: Review diff and commit any QA-only fixes test-first**

Run: `git diff --check && git status --short && git diff --stat origin/main...HEAD`
Expected: no whitespace errors and only Family Connections/spec/plan files changed.

- [ ] **Step 4: Dry-run canonical ship**

Run: `npm run ship -- $(git rev-list --reverse origin/main..HEAD)`
Expected: guarded ship reports the exact commits and planned checks without changing production.

- [ ] **Step 5: Deploy with explicit existing authorization**

Run: `ALLOW_DEPLOY=1 npm run ship -- $(git rev-list --reverse origin/main..HEAD)`
Expected: commits are assembled onto current `origin/main`, QA passes, main is pushed, and the production build stamp reaches the shipped commit.

- [ ] **Step 6: Verify production independently**

Check `https://eduwonderlab.com/curriculum/family-connections/teacher/`, the public Family Connections route, protected API rejection without credentials, public availability shape, mobile layout, and the deployed build stamp. Do not create a real family booking in production unless it can be safely cancelled during the same authenticated QA session.

