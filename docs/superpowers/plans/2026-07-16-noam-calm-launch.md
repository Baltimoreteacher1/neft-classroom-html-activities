# Noam Calm Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Make Noam open with immediate feedback, reduce first-run overload, and meet persistent touch-target standards without changing user data or sync.

**Architecture:** Keep the current static PWA architecture. Add an HTML/CSS boot shell that the existing render function replaces, derive a short first-run home-card order without persisting it, and bump the service-worker cache version so installed apps receive the new shell.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node assertion tests, Cloudflare Pages.

---

## File Map

- Create test/focus-school-shell.test.mjs: static regression contract for boot, first-run focus, touch targets, and cache version.
- Modify focus-school/index.html: accessible initial loading shell.
- Modify focus-school/styles.css: boot visuals, reduced motion, and 44px control targets.
- Modify focus-school/app.js: clear busy state and derive focused first-run cards.
- Modify focus-school/sw.js: cache-version bump.
- Modify test/focus-school-smart-planning.test.mjs: expected service-worker version.

### Task 1: Establish the failing calm-launch contract

**Files:**
- Create: test/focus-school-shell.test.mjs

- [ ] **Step 1: Write the failing test**

~~~js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("focus-school/index.html", "utf8");
const css = readFileSync("focus-school/styles.css", "utf8");
const app = readFileSync("focus-school/app.js", "utf8");
const sw = readFileSync("focus-school/sw.js", "utf8");

assert.match(html, /class="boot-shell"/);
assert.match(html, /Preparing your day/);
assert.match(html, /aria-busy="true"/);
assert.match(css, /\.boot-shell/);
assert.match(css, /prefers-reduced-motion[\s\S]*boot-shimmer/);
assert.match(app, /removeAttribute\("aria-busy"\)/);
assert.match(app, /focusedFirstRunOrder/);
assert.match(css, /#connChip[\s\S]*min-height:\s*44px/);
assert.match(css, /\.cal-day[\s\S]*min-height:\s*44px/);
assert.match(sw, /focus-school-v54/);
console.log("focus-school-shell: calm launch contracts passed");
~~~

- [ ] **Step 2: Run the test to verify it fails**

Run: node test/focus-school-shell.test.mjs

Expected: FAIL because the boot shell is not present.

- [ ] **Step 3: Commit the failing test**

~~~bash
git add test/focus-school-shell.test.mjs
git commit -m "test: define Noam calm launch contracts"
~~~

### Task 2: Implement instant shell and focused first run

**Files:**
- Modify: focus-school/index.html
- Modify: focus-school/styles.css
- Modify: focus-school/app.js
- Modify: focus-school/sw.js
- Modify: test/focus-school-smart-planning.test.mjs

- [ ] **Step 1: Add meaningful boot markup**

Place a boot-shell block in hero with “Preparing your day,” add three decorative boot cards in main, and add a polite loading label inside tabbar. Mark hero, main, and tabbar aria-busy=true; mark skeleton shapes aria-hidden=true.

- [ ] **Step 2: Add restrained shell styling**

~~~css
.boot-shell { position: relative; z-index: 1; }
.boot-line { border-radius: 999px; background: rgba(255,255,255,.14); animation: boot-shimmer 1.4s ease-in-out infinite; }
.boot-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 14px; }
@media (max-width: 820px) { .boot-grid { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { .boot-line { animation: none; } }
~~~

- [ ] **Step 3: Clear loading semantics on first render**

At the end of render, remove aria-busy from hero, main, and tabbar after their real content has been written.

~~~js
["hero", "main", "tabbar"].forEach((id) => document.getElementById(id)?.removeAttribute("aria-busy"));
~~~

- [ ] **Step 4: Derive a calm first-run card order**

Inside VIEWS.home, keep the saved personalized order unchanged, but render only routine, plan, and assignments while the welcome state is active.

~~~js
const personalizedOrder = state.settings.homeOrder.filter(
  (key) => !state.settings.hiddenCards.includes(key),
);
const focusedFirstRunOrder = ["routine", "plan", "assignments"];
const showingWelcome = state.assignments.length === 0 && !state.settings.welcomeDismissed;
const order = showingWelcome ? focusedFirstRunOrder : personalizedOrder;
~~~

- [ ] **Step 5: Bump the installed-PWA cache**

Change focus-school-v53 to focus-school-v54 in sw.js and in the existing smart-planning test assertion.

- [ ] **Step 6: Run focused tests**

Run: node test/focus-school-shell.test.mjs && node test/focus-school-smart-planning.test.mjs

Expected: both pass.

- [ ] **Step 7: Commit the implementation**

~~~bash
git add focus-school/index.html focus-school/styles.css focus-school/app.js focus-school/sw.js test/focus-school-smart-planning.test.mjs
git commit -m "feat(noam): add calm instant launch"
~~~

### Task 3: Touch-target polish and regression verification

**Files:**
- Modify: focus-school/styles.css

- [ ] **Step 1: Make persistent targets comfortably tappable**

~~~css
#connChip { min-height: 44px; }
.cal-day { min-height: 44px; }
~~~

- [ ] **Step 2: Run Focus School tests**

Run: npm test

Expected: every test script passes.

- [ ] **Step 3: Run repository release gates**

Run: npm run validate && npm run build

Expected: validation and production build pass; existing non-module Vite notices remain non-blocking.

- [ ] **Step 4: Browser QA**

Verify fresh desktop and 390px states, initial shell replacement, shortened first-run Now screen, no horizontal document overflow, no console errors, and 44px target heights.

- [ ] **Step 5: Commit any final scoped polish**

~~~bash
git add focus-school/styles.css
git commit -m "fix(noam): polish mobile touch targets"
~~~

### Task 4: Publish and verify production

- [ ] **Step 1: Push branch and merge through GitHub**

Push codex/noam-flawless-20260716, create a concise PR, and merge after available gates. If GitHub Actions cannot start because of the already-confirmed account billing limit, rely on the complete local release gate and record that infrastructure limitation.

- [ ] **Step 2: Run the guarded Noam deployment**

Run: ALLOW_DEPLOY=1 npm run deploy:noam

Expected: deploy script builds the isolated focus-school upload, verifies v54 is newer than production, uploads the Pages project, and runs live smoke checks.

- [ ] **Step 3: Verify live markers**

Confirm noam.eduwonderlab.com serves focus-school-v54, contains “Preparing your day” in the static shell, renders the focused first-run dashboard, has no console errors, and keeps sync/API health intact.
