# Family Connections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a privacy-first Family Connections workspace that generates family messages, hands them off to Outlook or ClassDojo, connects families to existing curriculum supports, and provides equitable home-to-class engagement routines.

**Architecture:** A dependency-free static application lives at `/curriculum/family-connections/`. Educator-written templates and pure helper functions are separated from DOM orchestration so Node tests can verify message generation, resource mapping, review gates, and Outlook URL encoding. The page reads the existing curriculum manifest at runtime and keeps optional planner state on-device only.

**Tech Stack:** Semantic HTML, CSS, browser JavaScript ES modules, Node assertions, existing Vite static-copy build, existing curriculum manifest.

---

## File map

- Create `curriculum/family-connections/index.html`: semantic shell for Quick Start, Message Studio, Resource Navigator, Engagement Lab, and Connection Planner.
- Create `curriculum/family-connections/styles.css`: responsive design, focus states, reduced motion, and print layout.
- Create `curriculum/family-connections/templates.js`: canonical templates, engagement routines, global resources, message composition, review policy, and delivery URL helpers.
- Create `curriculum/family-connections/app.js`: DOM state, manifest loading, filtering, editable output, clipboard handoff, and opt-in local persistence.
- Create `curriculum/family-connections/family-connections.test.mjs`: Node assertions for all pure business rules and static integration landmarks.
- Modify `curriculum/index.html`: featured card and compact Teacher Tools link.
- Modify `teacher-tools/index.html`: Start Here and searchable directory cards.
- Modify `data/routes.json`: canonical route metadata.
- Modify `tools/validate-curriculum-hub.mjs`: guard the new curriculum entry points.

### Task 1: Lock core behavior with failing tests

**Files:**
- Create: `curriculum/family-connections/family-connections.test.mjs`

- [ ] **Step 1: Write failing assertions for the canonical module contract**

```js
import assert from "node:assert/strict";
import {
  buildOutlookUrl,
  composeMessage,
  getLessonResources,
  messageRequiresReview,
} from "./templates.js";

const message = composeMessage({
  purpose: "missing-work",
  language: "plain",
  student: "Jordan",
  lessonLabel: "Lesson 3-2 · Unit Rates",
  resource: { label: "Family Homework", url: "/lessons/3-2/homework.html" },
  context: "The first two questions are complete.",
});
assert.match(message.body, /Jordan/);
assert.match(message.body, /first two questions/i);
assert.match(message.body, /https:\/\/eduwonderlab\.com\/lessons\/3-2\/homework\.html/);
assert.equal(messageRequiresReview("missing-work"), true);
assert.equal(messageRequiresReview("celebration"), false);
assert.match(buildOutlookUrl(message), /^https:\/\/outlook\.office\.com\/mail\/deeplink\/compose\?/);
assert.deepEqual(getLessonResources({ id: "3-2", resources: {} })[0], {
  kind: "family-homework",
  label: "Family Homework",
  url: "/lessons/3-2/homework.html",
});
```

- [ ] **Step 2: Run the test and verify the missing module failure**

Run: `node curriculum/family-connections/family-connections.test.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `templates.js`.

- [ ] **Step 3: Commit the red test**

```bash
git add curriculum/family-connections/family-connections.test.mjs
git commit -m "test: define family connections behavior"
```

### Task 2: Implement message and resource rules

**Files:**
- Create: `curriculum/family-connections/templates.js`
- Test: `curriculum/family-connections/family-connections.test.mjs`

- [ ] **Step 1: Define immutable product data**

Export `PURPOSES`, `LANGUAGES`, `GLOBAL_RESOURCES`, and `ENGAGEMENT_ROUTINES`. Each purpose contains `label`, `category`, `subject`, `opening`, `action`, `familyRole`, and optional reviewed Spanish fixed copy. Each engagement routine contains `id`, `title`, `time`, `familyRole`, `directions`, `classroomReturn`, `schoolAlternative`, and `messagePurpose`.

```js
export const PURPOSES = Object.freeze({
  celebration: {
    label: "Celebrate progress",
    category: "positive",
    subject: "A positive update about {student}",
    opening: "I wanted to share a positive update about {student}.",
    action: "Please ask {student} to show or explain one thing that feels stronger now.",
    familyRole: "A short word of encouragement would mean a lot.",
  },
});
```

- [ ] **Step 2: Implement the pure helpers**

```js
export function absoluteEduWonderUrl(path) {
  return new URL(path, "https://eduwonderlab.com").href;
}

export function messageRequiresReview(purpose) {
  return ["missing-work", "learning-check-in", "conference"].includes(purpose);
}

export function buildOutlookUrl({ subject, body }) {
  const url = new URL("https://outlook.office.com/mail/deeplink/compose");
  url.searchParams.set("subject", subject);
  url.searchParams.set("body", body);
  return url.href;
}
```

`composeMessage(input)` must substitute safe fallbacks, append context only when supplied, append one selected resource with its absolute EduWonderLab URL, and return `{ subject, body, requiresReview }`. `getLessonResources(lesson)` must return only paths whose manifest resource explicitly exists, while always providing the generated family-homework path for a valid lesson ID.

- [ ] **Step 3: Run the targeted test**

Run: `node curriculum/family-connections/family-connections.test.mjs`
Expected: PASS and print `Family Connections tests passed.`

- [ ] **Step 4: Commit the business rules**

```bash
git add curriculum/family-connections/templates.js curriculum/family-connections/family-connections.test.mjs
git commit -m "feat: add family communication templates"
```

### Task 3: Build the accessible application shell

**Files:**
- Create: `curriculum/family-connections/index.html`
- Create: `curriculum/family-connections/styles.css`
- Test: `curriculum/family-connections/family-connections.test.mjs`

- [ ] **Step 1: Add static landmark assertions before markup**

Read `index.html` in the Node test and assert it contains `<!doctype html>`, `<html lang="en">`, viewport metadata, a skip link, `id="message-studio"`, `id="resource-navigator"`, `id="engagement-lab"`, `id="connection-planner"`, `aria-live="polite"`, and module script `/curriculum/family-connections/app.js`.

- [ ] **Step 2: Run the test and verify the missing-file failure**

Run: `node curriculum/family-connections/family-connections.test.mjs`
Expected: FAIL reading `index.html`.

- [ ] **Step 3: Build the semantic page**

Use a `<header>` with breadcrumb and privacy promise, a `<nav aria-label="Family Connections sections">`, and five `<section>` landmarks. Message Studio must include explicitly associated labels for purpose, language, first name/initials, class, lesson, due date, context, and resource; editable subject/body outputs; a review checkbox; and buttons for copy, Outlook, ClassDojo, and print.

- [ ] **Step 4: Add responsive and print styling**

Define a warm navy/teal/coral design with 16px+ body copy, 44px minimum controls, two-column desktop layouts that collapse below 820px, visible `:focus-visible` rings, `.visually-hidden`, `[hidden]`, `prefers-reduced-motion`, and `@media print` that prints only the prepared message or selected engagement routine.

- [ ] **Step 5: Run the static test and diff check**

Run: `node curriculum/family-connections/family-connections.test.mjs && git diff --check`
Expected: PASS with no whitespace errors.

- [ ] **Step 6: Commit the shell**

```bash
git add curriculum/family-connections/index.html curriculum/family-connections/styles.css curriculum/family-connections/family-connections.test.mjs
git commit -m "feat: build family connections workspace"
```

### Task 4: Connect curriculum resources and message delivery

**Files:**
- Create: `curriculum/family-connections/app.js`
- Modify: `curriculum/family-connections/family-connections.test.mjs`

- [ ] **Step 1: Add manifest adapter assertions**

Add tests that `normalizeLessons()` sorts lessons by numeric unit/lesson, omits duplicate flagship entries when a standard lesson exists, and maps the manifest's `resources.*.exists` fields into selectable family support links.

- [ ] **Step 2: Implement application initialization**

`app.js` imports the template module, binds controls, fetches `/data/curriculum-manifest.json`, renders lesson options and resource cards, and calls a single `refreshMessage()` function whenever composer state changes. Fetch failure must leave the global resource grid and all non-lesson features active and expose a Retry button.

- [ ] **Step 3: Implement deliberate handoff actions**

`openOutlook()` must block concern messages until the review checkbox is checked, open the encoded Outlook URL, and fall back to copying plus a blank Outlook compose link when the URL exceeds 7,500 characters. `openClassDojo()` must copy first, then open `https://teach.classdojo.com/`. Status text must say “prepared,” “copied,” or “opened,” never “sent.”

- [ ] **Step 4: Implement Resource Navigator and Engagement Lab**

Resource search filters global and lesson resources by title, lesson, standard, and type. Clicking “Use in message” synchronizes the composer selection. Engagement cards expose “Create family invitation,” which selects the corresponding message purpose and inserts the routine's family role and classroom return into the editable message.

- [ ] **Step 5: Run targeted and aggregate tests**

Run: `node curriculum/family-connections/family-connections.test.mjs && npm test`
Expected: Family Connections PASS and aggregate runner reports all discovered assertion scripts passing.

- [ ] **Step 6: Commit the connected application**

```bash
git add curriculum/family-connections/app.js curriculum/family-connections/family-connections.test.mjs
git commit -m "feat: connect family resources and message handoff"
```

### Task 5: Add the local-only Connection Planner

**Files:**
- Modify: `curriculum/family-connections/app.js`
- Modify: `curriculum/family-connections/index.html`
- Modify: `curriculum/family-connections/family-connections.test.mjs`

- [ ] **Step 1: Add planner-state tests**

Assert that `sanitizePlannerItem()` retains only `{ id, student, purpose, nextDate, note, completed }`, truncates `student` to 40 characters, `purpose` to 40, and `note` to 240, and rejects an invalid `YYYY-MM-DD` date. Assert that no email, phone, recipient, address, or message body key is retained.

- [ ] **Step 2: Implement opt-in persistence**

Keep planner items in memory by default. “Save on this device” writes the sanitized list to `localStorage` key `neft.familyConnections.planner.v1`; “Clear saved planning” removes it after confirmation. Render a visible “Stored only on this device” badge whenever persistence is active.

- [ ] **Step 3: Add positive-contact balance**

Show counts for positive, support, and concern plans. If concern exceeds positive, display a neutral prompt to consider a positive connection; never score families or students.

- [ ] **Step 4: Run tests and commit**

Run: `node curriculum/family-connections/family-connections.test.mjs`
Expected: PASS.

```bash
git add curriculum/family-connections/app.js curriculum/family-connections/index.html curriculum/family-connections/family-connections.test.mjs
git commit -m "feat: add private family follow-up planner"
```

### Task 6: Wire Family Connections into both hubs

**Files:**
- Modify: `curriculum/index.html`
- Modify: `teacher-tools/index.html`
- Modify: `data/routes.json`
- Modify: `tools/validate-curriculum-hub.mjs`
- Modify: `curriculum/family-connections/family-connections.test.mjs`

- [ ] **Step 1: Add failing entry-point assertions**

Assert the curriculum hub contains `href="/curriculum/family-connections/"` at least twice and `id="family-connections-feature-title"`; assert Teacher Tools contains the route at least twice with `data-title="Family Connections"`; assert the route registry contains a `family-connections` entry with teacher audience and public visibility.

- [ ] **Step 2: Run the test and verify the missing-link failure**

Run: `node curriculum/family-connections/family-connections.test.mjs`
Expected: FAIL on the curriculum entry-point count.

- [ ] **Step 3: Add curriculum entry points**

Add an accessible featured card in `.features-grid` titled “Family Connections” with the subtitle “Messages, family supports, and home-to-class engagement.” Add one compact `tt-link` in the Teacher Tools details block.

- [ ] **Step 4: Add Teacher Tools entry points**

Add a Start Here card and a searchable communication-category directory card. Both must use the existing `data-tool-card`, `data-title`, `data-category`, and `data-audience` conventions.

- [ ] **Step 5: Register and guard the route**

Add the route registry object and extend `tools/validate-curriculum-hub.mjs` with checks for `family-connections-feature-title` and the canonical route. Preserve every existing assertion.

- [ ] **Step 6: Run integration checks and commit**

Run: `node curriculum/family-connections/family-connections.test.mjs && npm run validate:hub && npm run validate:static`
Expected: all commands exit 0; static validation may report pre-existing warnings but no errors.

```bash
git add curriculum/index.html teacher-tools/index.html data/routes.json tools/validate-curriculum-hub.mjs curriculum/family-connections/family-connections.test.mjs
git commit -m "feat: feature family connections across teacher hubs"
```

### Task 7: Browser QA, full verification, and repair

**Files:**
- Modify only files needed for targeted repairs discovered by verification.

- [ ] **Step 1: Run the repository verification sequence**

Run:

```bash
npm run validate
npm run build
scripts/codex/codex-verify.sh
```

Expected: all required checks exit 0. Preserve unrelated baseline warnings and repair only regressions introduced by Family Connections.

- [ ] **Step 2: Run browser smoke checks**

Serve the built site and verify desktop (1440×900), Chromebook/tablet (1024×768), and phone (390×844): no horizontal overflow; keyboard navigation reaches every control; review gating works; Outlook URL contains the edited text; ClassDojo copy action preserves the message; resource filters and manifest retry work; print preview omits navigation and controls.

- [ ] **Step 3: Review privacy and language invariants**

Search the changed files for email/phone storage fields, recipient query parameters, “message sent,” answer-key exposure, unreviewed translation claims, `TBD`, `TODO`, and placeholder copy. Confirm external links use safe targets and no family PII is persisted.

- [ ] **Step 4: Review the final diff**

Run: `git diff --check && git status --short && git diff --stat HEAD~6..HEAD`
Expected: only Family Connections, hub entry points, route metadata, tests, and documentation are changed.

- [ ] **Step 5: Commit any QA repairs**

```bash
git add curriculum/family-connections curriculum/index.html teacher-tools/index.html data/routes.json tools/validate-curriculum-hub.mjs
git commit -m "fix: complete family connections QA"
```

Do not deploy or push.
