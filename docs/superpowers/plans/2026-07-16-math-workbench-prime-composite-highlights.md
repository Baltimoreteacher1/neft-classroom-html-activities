# Math Workbench Prime and Composite Highlights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Prime, Composite, and Clear controls beneath the Math Workbench multiplication chart.

**Architecture:** Extend the existing self-contained multiplication-chart component in `curriculum/math-workbench/index.html`. A small classification state drives semantic buttons, body-cell classes, and a live status message while remaining independent of the existing row/column fact state.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node static-contract tests, Playwright browser QA

---

### Task 1: Add the regression contract

**Files:**
- Create: `tools/math-workbench-number-highlights.test.mjs`

- [ ] **Step 1: Write the failing test**

Read the canonical Workbench HTML and assert that it contains:

```js
assert.match(html, /id="multPrimeBtn"/);
assert.match(html, /id="multCompositeBtn"/);
assert.match(html, /id="multClassClearBtn"/);
assert.match(html, /function isPrime\(value\)/);
assert.match(html, /classList\.toggle\("is-prime"/);
assert.match(html, /classList\.toggle\("is-composite"/);
assert.match(html, /classControls\.hidden = div/);
assert.match(html, /aria-live="polite"/);
```

Also extract and evaluate `isPrime` to prove 1 is neither, 2/3/5/7/11 are prime, and 4/6/8/9/12 are composite.

- [ ] **Step 2: Verify RED**

Run: `node tools/math-workbench-number-highlights.test.mjs`

Expected: FAIL because `multPrimeBtn` is absent.

### Task 2: Build the controls and behavior

**Files:**
- Modify: `curriculum/math-workbench/index.html:12190-12530`

- [ ] **Step 1: Add the bottom controls and accessible directions**

Add a `mult-class-controls` group before the multiplication/division mode button with Prime, Composite, and Clear buttons, `aria-pressed` on the two modes, and a polite live status.

- [ ] **Step 2: Add high-contrast responsive styles**

Give every control a 44-pixel minimum target. Add distinct `.is-prime` and `.is-composite` cell treatments with color plus inset visual markers, visible focus states, and a compact mobile grid.

- [ ] **Step 3: Add classification logic**

Implement:

```js
function isPrime(value) {
  if (value < 2) return false;
  for (var factor = 2; factor * factor <= value; factor++) {
    if (value % factor === 0) return false;
  }
  return true;
}
```

Track `classificationMode`, toggle `is-prime` or `is-composite` on every table body cell based on its numeric product, update button states/status, clear classification independently, and clear/hide these controls in division mode.

- [ ] **Step 4: Verify GREEN**

Run: `node tools/math-workbench-number-highlights.test.mjs`

Expected: PASS with prime/composite classification assertions.

### Task 3: Verify and ship

**Files:**
- Test: `tools/math-workbench-number-highlights.test.mjs`
- Verify: `curriculum/math-workbench/index.html`

- [ ] **Step 1: Run focused checks**

Run `npm run check -- curriculum/math-workbench/index.html tools/math-workbench-number-highlights.test.mjs`, `node tools/detect-injection-damage.js`, and `git diff --check`.

- [ ] **Step 2: Run browser QA**

In the built preview, verify Prime, Composite, and Clear with mouse and keyboard; confirm 1 remains neutral; confirm hover/tap fact highlighting still works; verify division mode hides/resets the controls; inspect 390-pixel mobile layout.

- [ ] **Step 3: Run broad verification**

Run `npm test` and `npm run build`. Restore only unrelated deterministic build outputs if regenerated.

- [ ] **Step 4: Commit and guarded deploy**

Commit as `feat(workbench): add prime composite highlights`, then run the guarded ship script with `ALLOW_DEPLOY=1` and the design, plan, and implementation commits. Verify the public build stamp and repeat the browser smoke test on `https://eduwonderlab.com/curriculum/math-workbench/`.
