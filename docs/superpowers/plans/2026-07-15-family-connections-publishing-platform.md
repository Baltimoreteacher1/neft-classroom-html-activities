# Family Connections Publishing Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver separate public Family Mode and protected Teacher Mode pages with editable weekly plans, every manifest homework, deliberate publishing, ClassDojo handoff, and Canvas-ready exports.

**Architecture:** Shared pure browser modules merge a versioned published snapshot over the curriculum manifest. A Pages Function stores private draft and public published snapshots in the existing D1 binding, while the public page retains a manifest-only fallback. Teacher Mode uses the existing protected-path convention and publishes complete snapshots atomically.

**Tech Stack:** Static HTML/CSS/ES modules, Cloudflare Pages Functions, D1, Node assertions, Playwright, existing Vite build.

---

## File map

- Replace `curriculum/family-connections/index.html` with the public Family Mode shell.
- Create `curriculum/family-connections/family.css` and `family-app.js` for public rendering.
- Create `curriculum/family-connections/shared/model.js`, `api-client.js`, and `render.js` for shared contracts.
- Create `curriculum/family-connections/teacher/index.html`, `teacher.css`, and focused teacher modules.
- Create `functions/api/family-connections/domain.js` and `[[path]].js` for validation, storage, and routing.
- Replace the focused Node contract test and add API and Playwright coverage.
- Update hub links, route metadata, and the backward-compatible family redirect.
- Remove superseded one-page modules after parity is confirmed.

### Task 1: Lock the shared publication model

**Files:**
- Create: `curriculum/family-connections/shared/model.test.mjs`
- Create: `curriculum/family-connections/shared/model.js`

- [ ] **Step 1: Write failing tests**

Assert that `createDefaultSnapshot()` creates one visible default section and five weekdays; `normalizeLessons()` returns all 74 manifest lessons in numeric order; `mergeHomework()` includes a synthetic future manifest lesson automatically; hidden overrides are omitted; and unsafe supplemental links are rejected.

```js
const future = { id: "12-9", unit: 12, lesson: 9, title: "Future", resources: { homework: { exists: true, path: "/lessons/12-9/homework.html" } } };
assert.equal(mergeHomework([...lessons, future], {}).at(-1).id, "12-9");
assert.equal(mergeHomework([future], { "12-9": { visible: false } }).length, 0);
```

- [ ] **Step 2: Run the red test**

Run: `node curriculum/family-connections/shared/model.test.mjs`  
Expected: module-not-found failure for `model.js`.

- [ ] **Step 3: Implement the pure contract**

Export `DAYS`, `createDefaultSnapshot`, `normalizeLessons`, `mergeHomework`, `resolveWeek`, `safeExternalUrl`, `buildCanvasAnnouncement`, `buildCanvasModuleLinks`, and `buildCanvasExport`. Keep canonical lesson paths in the manifest and apply only public-facing override fields.

- [ ] **Step 4: Run green and commit**

Run: `node curriculum/family-connections/shared/model.test.mjs && git diff --check`  
Expected: PASS.

```bash
git add curriculum/family-connections/shared
git commit -m "feat: define family publishing model"
```

### Task 2: Build and verify the versioned API

**Files:**
- Create: `functions/api/family-connections/domain.js`
- Create: `functions/api/family-connections/[[path]].js`
- Create: `functions/api/family-connections/family-connections-api.test.mjs`

- [ ] **Step 1: Write failing domain and route tests**

Use an in-memory D1 double. Assert public reads return only `published`; draft, history, save, and publish reject anonymous requests; invalid lesson IDs and unsafe URLs return 400; stale draft revisions return 409; publish increments revision and preserves the previous publication in bounded history.

```js
assert.equal((await invoke("GET", "published")).status, 200);
assert.equal((await invoke("GET", "draft")).status, 401);
assert.equal((await invoke("PUT", "draft", invalidSnapshot, teacherAccess)).status, 400);
```

- [ ] **Step 2: Run the red test**

Run: `node functions/api/family-connections/family-connections-api.test.mjs`  
Expected: module-not-found failure.

- [ ] **Step 3: Implement validation and storage**

Normalize every accepted field with explicit size limits. Create the singleton and history tables idempotently. Read and write full JSON snapshots, use revision checks, retain five publications, return `no-store` for teacher endpoints, and fail closed for protected operations.

- [ ] **Step 4: Run green and commit**

Run: `node functions/api/family-connections/family-connections-api.test.mjs`  
Expected: PASS for public isolation, validation, conflict, and publication cases.

```bash
git add functions/api/family-connections
git commit -m "feat: add family publishing api"
```

### Task 3: Publish the family-first public page

**Files:**
- Replace: `curriculum/family-connections/index.html`
- Create: `curriculum/family-connections/family.css`
- Create: `curriculum/family-connections/family-app.js`
- Create: `curriculum/family-connections/shared/render.js`
- Replace: `curriculum/family-connections/family-connections.test.mjs`

- [ ] **Step 1: Write failing public-page contracts**

Assert semantic landmarks, a skip link, language controls, week section, section selector, homework search and unit filter, ClassDojo and Canvas action slots, AI guidance, school alternative, live region, and no teacher editor or answer-key links.

- [ ] **Step 2: Build the semantic shell and renderer**

Load the manifest and public snapshot in parallel. Render the chosen public section, weekday lesson cards, announcements, communication links, and the complete merged homework library. On API failure, render manifest homework and a precise weekly-status message.

- [ ] **Step 3: Add publisher-grade responsive styling**

Use a warm editorial visual system with fluid type and spacing, 44px controls, 320px-safe grids, bounded line lengths, visible focus, contrast mode, large text, reduced motion, and print rules. Confirm every grid child has `min-width: 0` and long links wrap.

- [ ] **Step 4: Add family supports**

Implement English/Spanish interface labels, browser read-aloud for the current week, homework search and filters, and safe external-link labeling. Persist only display preferences on device.

- [ ] **Step 5: Run tests and commit**

Run: `node curriculum/family-connections/family-connections.test.mjs && node curriculum/family-connections/shared/model.test.mjs`  
Expected: PASS.

```bash
git add curriculum/family-connections
git commit -m "feat: launch family connections family mode"
```

### Task 4: Build protected Teacher Mode

**Files:**
- Create: `curriculum/family-connections/teacher/index.html`
- Create: `curriculum/family-connections/teacher/teacher.css`
- Create: `curriculum/family-connections/teacher/teacher-app.js`
- Create: `curriculum/family-connections/teacher/editors.js`
- Create: `curriculum/family-connections/shared/api-client.js`
- Create: `curriculum/family-connections/teacher/teacher-mode.test.mjs`

- [ ] **Step 1: Write failing teacher-page contracts**

Assert the protected route contains publication status, section and weekday controls, the all-homework editor, announcement and resource controls, ClassDojo and Canvas URL settings, exact preview region, save and publish actions, history, and no browser field for Canvas credentials.

- [ ] **Step 2: Implement draft editing**

Load manifest plus private draft, render one default public section with add/rename/hide controls, allow weekday lesson/status assignment, and provide searchable per-lesson overrides for title, directions, time, materials, language support, links, and visibility. Keep unsaved state in memory and warn before navigation.

- [ ] **Step 3: Implement preview and publishing**

Render the draft through the same `renderFamilyExperience()` used publicly. Save the complete draft through the API client, surface validation and 409 conflicts without data loss, and require deliberate confirmation before publish.

- [ ] **Step 4: Implement ClassDojo and Canvas tools**

Validate destination URLs, copy Canvas announcement text/HTML and module links, download versioned JSON, and open Canvas or ClassDojo in a separate tab. Clipboard failure leaves selectable output and a manual-copy instruction.

- [ ] **Step 5: Run tests and commit**

Run: `node curriculum/family-connections/teacher/teacher-mode.test.mjs && node curriculum/family-connections/shared/model.test.mjs`  
Expected: PASS.

```bash
git add curriculum/family-connections/teacher curriculum/family-connections/shared
git commit -m "feat: add family connections teacher mode"
```

### Task 5: Route both audiences correctly and retire the one-page workspace

**Files:**
- Create: `curriculum/family-connections/family/index.html`
- Modify: `curriculum/index.html`
- Modify: `teacher-tools/index.html`
- Modify: `data/routes.json`
- Modify: `tools/validate-curriculum-hub.mjs`
- Remove after replacement: `curriculum/family-connections/app.js`, `styles.css`, and `templates.js`

- [ ] **Step 1: Add failing route assertions**

Require family-facing curriculum links to use the public root, teacher-tool links to use `/teacher/`, the legacy `/family/` page to redirect canonically, and route metadata to include both audiences.

- [ ] **Step 2: Update links and compatibility route**

Preserve the public route, point teacher-only cards to Teacher Mode, and implement a semantic HTML redirect with a fallback link. Remove the superseded one-page modules only after the focused test proves no HTML references them.

- [ ] **Step 3: Run integration checks and commit**

Run: `node curriculum/family-connections/family-connections.test.mjs && npm run validate:hub && npm run validate:static`  
Expected: all exit 0.

```bash
git add curriculum/family-connections curriculum/index.html teacher-tools/index.html data/routes.json tools/validate-curriculum-hub.mjs
git commit -m "feat: separate family and teacher connection pages"
```

### Task 6: Browser and zoom verification

**Files:**
- Create: `tests/family-connections.spec.js`
- Modify only targeted files when a failing assertion identifies a regression.

- [ ] **Step 1: Write browser assertions**

Mock the publication API and verify public weekly rendering, section switching, all-homework search, the school alternative, integration visibility, teacher edit/preview/save/publish, and accessible names. For widths 320, 390, 1024, and 1440, assert `document.documentElement.scrollWidth <= innerWidth`. Repeat at a 200% zoom-equivalent narrow viewport.

- [ ] **Step 2: Run and repair targeted failures**

Run: `npx playwright test tests/family-connections.spec.js --reporter=line`  
Expected: PASS in Chromium with no page errors or horizontal overflow.

- [ ] **Step 3: Run axe and keyboard smoke coverage**

Verify no serious or critical axe findings and that keyboard focus reaches section selection, read-aloud, homework filters, communication actions, teacher editors, save, preview, and publish in logical order.

- [ ] **Step 4: Commit verified browser coverage**

```bash
git add tests/family-connections.spec.js curriculum/family-connections functions/api/family-connections
git commit -m "test: verify family publishing experience"
```

### Task 7: Full QA, merge, and production release

**Files:**
- Modify only files required by a preserved failing assertion.

- [ ] **Step 1: Run repository verification**

Run:

```bash
npm run check
npm test
npm run validate
npm run build
scripts/codex/codex-verify.sh
```

Expected: required checks exit 0; repair only regressions introduced by this feature.

- [ ] **Step 2: Run the final QA skill**

Audit security, privacy, public-data isolation, keyboard and zoom behavior, generated build output, internal links, Canvas/ClassDojo handoff wording, and focused diff scope. Confirm no family identifiers, protected lesson resources, or credential inputs exist.

- [ ] **Step 3: Review and release**

Run `git diff --check`, inspect the complete branch diff and status, then invoke the guarded repository ship command with the branch commit range and its required deploy authorization. The ship script rebases the release onto current main, reruns its gates, pushes, and verifies the live build stamp.

- [ ] **Step 4: Verify production**

Check the public route without sign-in, the protected route without credentials, the public API payload boundary, responsive layout, weekly and homework fallback, ClassDojo/Canvas actions, and deployed commit stamp.
