# Family Connections Family Experience Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Family Connections more compact, easier to navigate, calmer when no week is published, and clearer when families choose optional practice.

**Architecture:** Add one pure shared weekly-state helper to the family publication model, then consume it in both the public renderer and protected teacher preview. Keep navigation/layout changes in the public shell, filter/integration behavior in the public app, and guard every new behavior with existing static/model contract suites.

**Tech Stack:** Static HTML/CSS, vanilla ES modules, Node assertions, Vite, Playwright, guarded Cloudflare Pages shipping

---

### Task 1: Define weekly-state and family-page contracts

**Files:**
- Modify: `curriculum/family-connections/shared/model.test.mjs`
- Modify: `curriculum/family-connections/family-connections.test.mjs`
- Modify: `curriculum/family-connections/teacher/teacher-mode.test.mjs`

- [ ] **Step 1: Add failing model assertions**

Import `weekHasMeaningfulContent` and assert:

```js
assert.equal(weekHasMeaningfulContent(createDefaultSnapshot().sections[0]), false);
const meaningful = createDefaultSnapshot().sections[0];
meaningful.week.days[0] = { day: "Monday", status: "review", lessonId: "", note: "Review together." };
assert.equal(weekHasMeaningfulContent(meaningful), true);
```

- [ ] **Step 2: Add failing public contracts**

Require `family-quick-nav`, links to `#family-week`, `#homework-library`, and `#family-support`, `clear-homework-filters`, `week-empty-state`, `today-badge`, `Learning focus`, `Start optional practice`, `Open family help`, and configured-destination filtering. Continue asserting read-only behavior and no curriculum-hub link.

- [ ] **Step 3: Add failing teacher-preview contracts**

Require the teacher renderer to use `weekHasMeaningfulContent`, `preview-empty-week`, and `preview-summary`.

- [ ] **Step 4: Verify RED**

Run the three family test scripts directly. Expected: FAIL on the missing weekly-state helper or quick-navigation contract.

### Task 2: Implement shared weekly state and family renderer polish

**Files:**
- Modify: `curriculum/family-connections/shared/model.js`
- Modify: `curriculum/family-connections/shared/render.js`
- Modify: `curriculum/family-connections/teacher/editors.js`

- [ ] **Step 1: Add the pure weekly-state helper**

```js
export function weekHasMeaningfulContent(section) {
  return (section?.week?.days ?? []).some(
    (day) => day?.status !== "no-class" || day?.lessonId || String(day?.note ?? "").trim(),
  );
}
```

- [ ] **Step 2: Improve the public week renderer**

When the helper returns false, render one `week-empty-state` article with a calm check-back message and leave the optional library available. Otherwise render weekday cards as before, adding a visible `today-badge` and accessible label to the current day.

- [ ] **Step 3: Improve optional-practice cards**

Render a `homework-focus` paragraph from `item.objective`, label the primary action `Start optional practice`, and label family support `Open family help`. Preserve directions, language supports, school alternative, and supplemental links.

- [ ] **Step 4: Improve teacher preview fidelity**

Use the shared helper to show one `preview-empty-week` state for an untouched week. Add `preview-summary` with the number of posted days and assigned visible optional-practice lessons.

- [ ] **Step 5: Verify GREEN for shared behavior**

Run `node curriculum/family-connections/shared/model.test.mjs` and `node curriculum/family-connections/teacher/teacher-mode.test.mjs`. Expected: PASS.

### Task 3: Compact the public shell and improve navigation/filter recovery

**Files:**
- Modify: `curriculum/family-connections/index.html`
- Modify: `curriculum/family-connections/family-app.js`
- Modify: `curriculum/family-connections/family.css`
- Modify: `curriculum/family-connections/family-components.css`

- [ ] **Step 1: Add semantic quick navigation and support anchor**

Add a `family-quick-nav` after the header with three anchor links. Add `id="family-support"` to the support section and add a `clear-homework-filters` button beside the search/unit controls.

- [ ] **Step 2: Add filter reset and natural result counts**

Show `N lessons available` with no filters and `N matching lessons` while filtered. Reveal Clear filters only when search or unit is active; clearing resets both controls, resets pagination, rerenders, focuses search, and announces the result.

- [ ] **Step 3: Filter generic communication homepages**

Add `isConfiguredDestination(value)` that accepts only safe HTTPS URLs with a meaningful path, query, or hash. Use it for both public communication buttons so generic service landing pages remain hidden.

- [ ] **Step 4: Apply responsive visual polish**

Compact the mobile header/hero, de-emphasize Teacher sign in without removing it, style the quick-nav row, empty-week card, Today badge, learning-focus line, and Clear filters button. Maintain 44-pixel targets, visible focus, high contrast, large text, and no horizontal overflow.

- [ ] **Step 5: Verify GREEN for public contracts**

Run `node curriculum/family-connections/family-connections.test.mjs`. Expected: PASS.

### Task 4: Verify, commit, and deploy

**Files:**
- Verify all changed Family Connections files and existing Canvas publication contracts.

- [ ] **Step 1: Run focused checks**

Run all Family Connections tests, Biome check on changed JS/CSS/HTML, static-site validation, and `git diff --check`.

- [ ] **Step 2: Run local browser QA**

Verify public desktop and 390-pixel mobile layouts, empty-week state, quick links, practice expansion, search/reset, lesson focus/action labels, Spanish/large-text/high-contrast controls, and no public editing controls. Verify the local protected teacher page preview summary and publication controls.

- [ ] **Step 3: Run broad checks**

Run `npm test` and `npm run build`; remove only unrelated deterministic build outputs.

- [ ] **Step 4: Commit and guarded deploy**

Commit as `feat(family): polish the family experience`. Ship only the family design, plan, and implementation commits with `ALLOW_DEPLOY=1 npm run ship -- ...`; do not include unrelated pending commits.

- [ ] **Step 5: Verify production**

Wait for the exact build stamp, then test the public page at `https://eduwonderlab.com/curriculum/family-connections/`, confirm the protected teacher route still returns 401 without credentials, and verify the public page contains no edit controls or curriculum-hub link.
