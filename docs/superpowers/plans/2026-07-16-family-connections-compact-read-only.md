# Family Connections Compact Read-Only Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the oversized family portal with a compact read-only weekly dashboard and reorganize Teacher Mode into a faster editor-plus-preview workspace without changing the publishing model or access boundary.

**Architecture:** Keep the existing static HTML, CSS, ES modules, shared snapshot model, and Cloudflare API. Change only presentation and small rendering behavior: native `<details>` elements provide progressive disclosure, the shared renderer produces compact homework summaries, and Teacher Mode keeps every existing control ID so its tested publishing logic remains canonical.

**Tech Stack:** Static HTML, CSS, browser ES modules, Node contract tests, JSDOM, Vite, Cloudflare Pages Functions/D1.

---

### Task 1: Lock the family read-only and compact contracts

**Files:**
- Modify: `curriculum/family-connections/family-connections.test.mjs`
- Test: `curriculum/family-connections/family-connections.test.mjs`

- [ ] **Step 1: Add failing public-page assertions**

Add requirements for `id="all-homework-panel"`, `class="compact-intro"`, `class="homework-details-disclosure"`, “Optional family practice,” and “separate from regular homework.” Replace the old required teacher-route link assertion with negative assertions for `/curriculum/family-connections/teacher/`, `editor.js`, `edit-toggle`, and `contenteditable`.

- [ ] **Step 2: Run the contract and confirm RED**

Run: `node curriculum/family-connections/family-connections.test.mjs`

Expected: FAIL because the public HTML still links to Teacher Mode and lacks the compact disclosure contracts.

- [ ] **Step 3: Preserve the failure output**

Record the first failing assertion in the task notes before implementation so the regression check remains tied to the original public-editing exposure.

### Task 2: Build the compact family dashboard

**Files:**
- Modify: `curriculum/family-connections/index.html`
- Modify: `curriculum/family-connections/family.css`
- Modify: `curriculum/family-connections/family-app.js`
- Modify: `curriculum/family-connections/shared/render.js`
- Test: `curriculum/family-connections/family-connections.test.mjs`

- [ ] **Step 1: Replace the oversized hero with the compact intro**

Keep `page-title`, all preference control IDs, the partnership copy, and semantic landmarks. Use one short title, one sentence, and one compact partnership line before `#family-week`. Remove both hero jump buttons because the weekly card immediately follows.

- [ ] **Step 2: Make this week the primary card**

Keep `#section-select`, `#read-week`, `#week-grid`, publication status, and published note IDs. Group them into a single elevated weekly panel with dense day cards and hide the class field wrapper when only one public section exists.

- [ ] **Step 3: Put the full homework catalog behind progressive disclosure**

Rename the family-facing catalog “Optional family practice” and place a nearby plain-language explanation that it is separate from regular assigned homework, never graded, and available only as a review/practice opportunity when it works for the family. Add matching reviewed Spanish strings. Wrap the existing filters, grid, and load-more button in `<details id="all-homework-panel">` with a summary that clearly says “Browse optional family practice.” Keep all search/filter IDs and live regions intact.

- [ ] **Step 4: Render concise homework summaries**

In `renderHomework`, keep lesson number, estimated time, title, and actions visible. Label the primary action “Open optional practice.” Move directions, materials, language support, and school alternative into `<details class="homework-details-disclosure">` with summary text “Directions & ways to help.” Continue assigning text through `textContent` and links through the existing safe path model.

- [ ] **Step 5: Condense family support and remove teacher entry points**

Replace the large support-card grid with a compact three-step “Ask · Listen · Encourage” strip plus published resource links. Remove the footer Teacher Mode link. Retain the ClassDojo/Canvas family destination and equity statement.

- [ ] **Step 6: Run the family contract and confirm GREEN**

Run: `node curriculum/family-connections/family-connections.test.mjs`

Expected: `Family Mode static contracts passed.`

### Task 3: Lock and build the streamlined Teacher Mode shell

**Files:**
- Modify: `curriculum/family-connections/teacher/teacher-mode.test.mjs`
- Modify: `curriculum/family-connections/teacher/index.html`
- Modify: `curriculum/family-connections/teacher/teacher.css`
- Test: `curriculum/family-connections/teacher/teacher-mode.test.mjs`

- [ ] **Step 1: Add failing teacher-layout assertions**

Require `class="teacher-edit-column"`, `class="teacher-preview-column"`, disclosure IDs `homework-tools`, `updates-tools`, and `sharing-tools`, and the teacher-facing “separate from regular homework” clarification. Preserve every existing control-ID assertion and the `noindex,nofollow` contract.

- [ ] **Step 2: Run the teacher contract and confirm RED**

Run: `node curriculum/family-connections/teacher/teacher-mode.test.mjs`

Expected: FAIL because the current six-section sidebar layout does not expose the new editor/preview columns or disclosures.

- [ ] **Step 3: Recompose existing controls without changing their IDs**

Remove the sidebar. Keep the weekly editor always open in `.teacher-edit-column`. Place homework, updates/resources, and ClassDojo/Canvas sections inside closed native details elements with explicit summaries. Move `#preview-plan` into `.teacher-preview-column` and keep `#family-preview` plus `#publication-history` intact.

- [ ] **Step 4: Apply the compact teacher visual system**

Create a responsive two-column desktop grid, sticky preview, compact weekday cards, clear draft/live state, 44px minimum action targets, visible focus, reduced motion, and a one-column phone layout. Do not hide required fields or publication state.

- [ ] **Step 5: Run teacher and family contracts**

Run: `node curriculum/family-connections/teacher/teacher-mode.test.mjs && node curriculum/family-connections/family-connections.test.mjs`

Expected: both static contract messages pass.

### Task 4: Verify model and server permission invariants

**Files:**
- Verify: `curriculum/family-connections/shared/model.test.mjs`
- Verify: `functions/api/family-connections/family-connections-api.test.mjs`
- Verify: `functions/_middleware.js`

- [ ] **Step 1: Run targeted behavior tests**

Run: `node curriculum/family-connections/shared/model.test.mjs && node functions/api/family-connections/family-connections-api.test.mjs`

Expected: the model and API suites pass, including unauthenticated 401 responses for draft/history/publish and the fail-closed 503 response when Access is not configured.

- [ ] **Step 2: Verify the source privacy boundary**

Run: `rg -n "editor\.js|edit-toggle|contenteditable|family-connections/teacher" curriculum/family-connections/index.html curriculum/family-connections/family-app.js`

Expected: no matches.

- [ ] **Step 3: Verify no hidden answer keys or secret fields**

Run: `rg -ni "answer[ -]?key|name=.[^\n]*(token|password|secret)|studentRecords|familyContacts" curriculum/family-connections functions/api/family-connections`

Expected: only negative test fixtures may match; public production files contain none.

### Task 5: Format, build, and browser-QA the complete experience

**Files:**
- Modify only targeted Family Connections files if verification exposes a regression.

- [ ] **Step 1: Format changed source**

Run: `npx biome format --write curriculum/family-connections/index.html curriculum/family-connections/family.css curriculum/family-connections/family-app.js curriculum/family-connections/shared/render.js curriculum/family-connections/family-connections.test.mjs curriculum/family-connections/teacher/index.html curriculum/family-connections/teacher/teacher.css curriculum/family-connections/teacher/teacher-mode.test.mjs`

Expected: formatter exits 0.

- [ ] **Step 2: Run lint and targeted tests**

Run: `npx biome check curriculum/family-connections functions/api/family-connections && node curriculum/family-connections/family-connections.test.mjs && node curriculum/family-connections/shared/model.test.mjs && node curriculum/family-connections/teacher/teacher-mode.test.mjs && node functions/api/family-connections/family-connections-api.test.mjs`

Expected: all commands exit 0.

- [ ] **Step 3: Run static validators and build**

Run: `npm run validate:static && npm run validate:hub && npm run build`

Expected: all commands exit 0; repair the first introduced error and rerun the failing command.

- [ ] **Step 4: Run local browser QA**

Serve the Vite preview and inspect family and teacher routes at 1440×900, 1024×768, and 390×844. Verify no horizontal overflow; family has no editing control, editable node, or teacher link; the homework disclosures, filters, language, large text, high contrast, read-aloud, teacher disclosures, preview, save, and publish gating remain keyboard-usable.

- [ ] **Step 5: Review the final diff**

Run: `git diff --check && git status --short && git diff --stat && git diff -- curriculum/family-connections`

Expected: only the spec, plan, and targeted Family Connections source/tests changed; no dependency, lockfile, generated `dist`, secret, or deployment configuration changed.
