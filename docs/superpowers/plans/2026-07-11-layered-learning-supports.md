# Layered Learning Supports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a publisher-grade, privacy-preserving Learning Supports layer to all 64 core Reveal Math lesson launchers without changing their existing default behavior.

**Architecture:** A build-time generator derives a student-safe, reviewed manifest from the 64 canonical lesson configs. A namespaced shared CSS/JS enhancement mounts optional teacher and student controls on core lesson pages, while a targeted idempotent injector adds only asset references and a stable lesson ID. Any missing or invalid support asset fails closed to the original lesson.

**Tech Stack:** Static HTML, browser JavaScript, CSS, Node.js validation/generation scripts, JSDOM assertion tests, Playwright, Vite, Cloudflare Pages guarded ship workflow.

---

## File structure

- Create `assets/learning-supports/learning-supports.js`: support-state parser, safe DOM renderer, reversible UI controller, speech/focus/preferences behavior.
- Create `assets/learning-supports/learning-supports.css`: fully namespaced teacher panel, student tools, focus mode, accessibility, responsive, reduced-motion, and print styles.
- Create `assets/learning-supports/manifest.json`: generated student-safe content for exactly 64 canonical Reveal lessons.
- Create `scripts/generate-learning-supports-manifest.mjs`: deterministic manifest generator and content sanitizer.
- Create `tools/inject-learning-supports.mjs`: idempotent targeted integration for `lessons/<N-N>/index.html` only.
- Create `tools/validate-learning-supports.mjs`: release-blocking coverage, schema, privacy, answer-leakage, integration, and preservation checks.
- Create `tools/learning-supports.test.mjs`: JSDOM behavior tests and failure-mode regression assertions.
- Modify `scripts/generate-lesson-shells.mjs`: preserve Learning Supports integration in future regenerated canonical shells.
- Modify `package.json`: add narrow generate, inject, and validate commands to existing workflows without new dependencies.
- Modify `curriculum/index.html`: add a concise teacher-facing Learning Supports entry/explainer without changing existing cards or links.
- Modify 64 `lessons/<N-N>/index.html` files mechanically through the injector: add one stylesheet, lesson ID, and deferred script.

### Task 1: Manifest generator and validator

**Files:**
- Create: `scripts/generate-learning-supports-manifest.mjs`
- Create: `tools/validate-learning-supports.mjs`
- Create: `assets/learning-supports/manifest.json`
- Modify: `package.json`

- [ ] **Step 1: Write the failing validator**

Implement assertions that canonical lesson directories match `/^\d+-\d+$/`, total exactly 64, and each manifest entry contains `lessonId`, `title`, `standard`, `contentObjective`, `languageObjective`, `vocabulary`, `workedExample`, `sentenceFrames`, `wordBank`, `readinessHref`, and `profiles`. Reject raw HTML, answer-bearing config keys (`correctIndex`, `sampleAnswer`, `kernel`, `listenFor`, `explanation`, `choiceFeedback`), unknown profile keys, external URLs, and student-identifying fields.

- [ ] **Step 2: Run the validator to verify it fails**

Run: `node tools/validate-learning-supports.mjs`
Expected: FAIL because `assets/learning-supports/manifest.json` does not exist.

- [ ] **Step 3: Implement deterministic manifest generation**

Read only canonical `lessons/<N-N>/config.json` files. Build support content from `contentObjective`, `languageObjective`, `vocabulary`, `launch.conceptIntro.iDo.lines`, `explore.discourse.sentenceFrame`, `turnAndTalk[*].stems`, `turnAndTalk[*].wordBank`, and the existing readiness route. Keep only student-safe allowlisted fields, deduplicate arrays, normalize whitespace, cap field lengths, and sort entries numerically by unit and lesson.

Profiles must use these exact keys:

```js
const PROFILE_KEYS = [
  "read-understand",
  "focus-organize",
  "build-math",
  "express-thinking",
  "language-support",
  "challenge-extend",
];
```

- [ ] **Step 4: Generate and validate the manifest**

Run: `node scripts/generate-learning-supports-manifest.mjs && node tools/validate-learning-supports.mjs`
Expected: PASS with `64/64 canonical lessons covered` and zero privacy, schema, route, or answer-leakage errors.

- [ ] **Step 5: Commit manifest foundation**

```bash
git add package.json scripts/generate-learning-supports-manifest.mjs tools/validate-learning-supports.mjs assets/learning-supports/manifest.json
git commit -m "feat: add validated lesson support manifest"
```

### Task 2: Support controller behavior

**Files:**
- Create: `assets/learning-supports/learning-supports.js`
- Create: `tools/learning-supports.test.mjs`

- [ ] **Step 1: Write failing JSDOM tests**

Cover these observable behaviors:

```js
assert.equal(document.querySelectorAll("[data-ewl-supports-root]").length, 1);
assert.equal(document.querySelector("[data-ewl-supports-teacher]").textContent.includes("Prepare Supports"), true);
assert.equal(document.querySelector("[data-ewl-supports-tools]").hidden, true);
assert.equal(originalInput.value, "student work");
assert.equal(localStorage.getItem("existing-lesson-key"), "keep-me");
```

Also test invalid manifest data, unknown fragment keys, unavailable localStorage, duplicate boot, reversible focus mode, close/Escape focus restoration, reset, safe text rendering, and no initialization when lesson ID or manifest entry is absent.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node tools/learning-supports.test.mjs`
Expected: FAIL because the controller does not exist.

- [ ] **Step 3: Implement parsing and state helpers**

Expose one idempotent global `window.EWLLearningSupports` with `init`, `destroy`, `parseSettings`, `serializeSettings`, and `version`. Allowlist support keys, cap fragment size, catch storage access, and use only `ewl-supports:v1:preferences` for local state.

- [ ] **Step 4: Implement safe teacher and student UI**

Use `createElement`, `textContent`, `setAttribute`, and event listeners; do not use manifest strings with `innerHTML`. Render a non-modal **Prepare Supports** entry, accessible dialog, six profile toggles, granular tools, preview, reset, and copy-link action. Render **Learning Tools** only when a student-controlled tool is enabled.

- [ ] **Step 5: Implement reversible tools**

- Listen reads only the current authored support text, never autoplays, and always provides stop.
- Focus applies only a namespaced root class and does not hide existing inputs or primary actions.
- Words, Example, Model, and Explain render authored manifest content in the support panel.
- Model links only to validated local readiness/manipulative routes.
- Reset removes support classes and support-owned DOM while retaining existing values and storage.

- [ ] **Step 6: Run the focused behavior test**

Run: `node tools/learning-supports.test.mjs`
Expected: PASS for all state, privacy, safe rendering, and preservation assertions.

- [ ] **Step 7: Commit controller behavior**

```bash
git add assets/learning-supports/learning-supports.js tools/learning-supports.test.mjs
git commit -m "feat: add reversible learning support controls"
```

### Task 3: Publisher-grade visual and accessibility layer

**Files:**
- Create: `assets/learning-supports/learning-supports.css`
- Modify: `tools/learning-supports.test.mjs`

- [ ] **Step 1: Add failing structural accessibility assertions**

Assert semantic dialog labeling, button names, `aria-pressed` state, live copy status, focus return, no positive `tabindex`, and no support control below a 44px minimum target class contract.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node tools/learning-supports.test.mjs`
Expected: FAIL on the new accessibility contract assertions.

- [ ] **Step 3: Implement namespaced styles**

Use only `.ewl-supports-*`, `[data-ewl-supports-*]`, and `body.ewl-supports-focus-active` selectors. Provide strong focus rings, AA color pairs, 16px minimum support text, 44px controls, 320px mobile reflow, 200% zoom resilience, `prefers-reduced-motion`, forced-colors compatibility, and print suppression unless `ewl-supports-print-enabled` is active.

- [ ] **Step 4: Re-run accessibility contract tests**

Run: `node tools/learning-supports.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit the visual layer**

```bash
git add assets/learning-supports/learning-supports.css tools/learning-supports.test.mjs
git commit -m "feat: style accessible learning support deck"
```

### Task 4: Additive integration across 64 launchers

**Files:**
- Create: `tools/inject-learning-supports.mjs`
- Modify: `scripts/generate-lesson-shells.mjs`
- Modify: 64 canonical `lessons/<N-N>/index.html` files
- Modify: `tools/validate-learning-supports.mjs`

- [ ] **Step 1: Extend the validator with failing integration assertions**

Require exactly one `data-ewl-supports-lesson` ID, one stylesheet, and one deferred controller script in each canonical shell. Capture and compare the original functional tags after stripping only the marked support blocks and support lesson attribute.

- [ ] **Step 2: Run the validator to verify it fails**

Run: `node tools/validate-learning-supports.mjs`
Expected: FAIL with 64 missing integrations.

- [ ] **Step 3: Implement the targeted injector**

Add idempotent `ewl-supports-injected:begin/end` blocks around:

```html
<link rel="stylesheet" href="/assets/learning-supports/learning-supports.css" />
<script src="/assets/learning-supports/learning-supports.js" defer></script>
```

Set `data-ewl-supports-lesson="1-1"` on `<html>` without rewriting any other markup. Support `--check` and `--revert`; target only the 64 canonical directories.

- [ ] **Step 4: Preserve integration in generated shells**

Update `buildShell(lessonId, title)` so future generation includes the same stable lesson ID and marked assets for canonical lesson IDs while leaving noncanonical/flagship shell behavior unchanged.

- [ ] **Step 5: Inject and validate all canonical launchers**

Run: `node tools/inject-learning-supports.mjs && node tools/inject-learning-supports.mjs --check && node tools/validate-learning-supports.mjs`
Expected: PASS with 64 integrated, zero duplicates, and no host-markup mutation outside the support markers and lesson ID.

- [ ] **Step 6: Commit integration**

```bash
git add tools/inject-learning-supports.mjs tools/validate-learning-supports.mjs scripts/generate-lesson-shells.mjs lessons/*/index.html
git commit -m "feat: integrate supports into Reveal lessons"
```

### Task 5: Curriculum hub teacher entry

**Files:**
- Modify: `curriculum/index.html`
- Modify: `tools/validate-learning-supports.mjs`

- [ ] **Step 1: Add a failing hub assertion**

Require one accessible Learning Supports explainer that links to a canonical preview lesson, uses “access without lowering the learning target” language, states that no IEP data is stored, and does not remove or rename any existing curriculum link.

- [ ] **Step 2: Run the validator to verify it fails**

Run: `node tools/validate-learning-supports.mjs`
Expected: FAIL on the missing curriculum entry.

- [ ] **Step 3: Add the additive hub entry**

Insert a card consistent with the existing curriculum design system. Copy must distinguish supports from IEP compliance, use no deficit labels, and direct teachers to preview supports in a canonical lesson. Do not reorder, remove, or rewrite existing hub cards.

- [ ] **Step 4: Validate the hub and supports**

Run: `node tools/validate-learning-supports.mjs && npm run validate:hub && npm run validate:curriculum-top1`
Expected: PASS.

- [ ] **Step 5: Commit the hub entry**

```bash
git add curriculum/index.html tools/validate-learning-supports.mjs
git commit -m "feat: add curriculum learning supports entry"
```

### Task 6: Browser regression and accessibility QA

**Files:**
- Create: `tests/learning-supports.spec.ts`
- Modify: `playwright.config.js` only if an existing project cannot serve the Vite preview.

- [ ] **Step 1: Write failing Playwright coverage**

Test lesson `1-1`, one lesson from each unit, and each distinct launcher template. Verify original objective and primary task remain visible, existing inputs retain values across support toggles, copy-link state contains no PII, keyboard dialog flow works, Escape returns focus, reduced motion is honored, and blocking the support JS still leaves the lesson operational.

- [ ] **Step 2: Run focused browser tests to verify they fail**

Run: `npx playwright test tests/learning-supports.spec.ts`
Expected: FAIL until selectors and support behavior meet the browser contract.

- [ ] **Step 3: Make targeted implementation corrections**

Correct only support-owned JS/CSS, manifest generation, or injection logic identified by the preserved failing assertion. Do not alter host lesson scoring or content to satisfy a support test.

- [ ] **Step 4: Run focused browser and accessibility tests**

Run: `npx playwright test tests/learning-supports.spec.ts`
Expected: PASS at desktop, Chromebook/tablet, and mobile viewports with zero serious or critical axe violations in support UI.

- [ ] **Step 5: Commit browser QA**

```bash
git add tests/learning-supports.spec.ts assets/learning-supports tools/validate-learning-supports.mjs
git commit -m "test: cover learning supports regressions"
```

### Task 7: Full repository and release verification

**Files:**
- Modify only files required by preserved failing assertions.

- [ ] **Step 1: Run narrow checks**

Run:

```bash
node tools/learning-supports.test.mjs
node tools/validate-learning-supports.mjs
node tools/inject-learning-supports.mjs --check
```

Expected: all PASS and 64/64 coverage.

- [ ] **Step 2: Run repository checks**

Run:

```bash
npm run check
npm run test
npm run validate
npm run build
scripts/codex/codex-verify.sh
```

Expected: all PASS. Preserve any failing assertion and make only a targeted support-related fix. Record pre-existing failures separately if reproduced on `origin/main`.

- [ ] **Step 3: Review final diff and preservation invariants**

Confirm no unrelated files, dependency changes, answer keys, student identifiers, external requests, route changes, scoring changes, or existing storage-key mutations. Confirm generated manifest is deterministic by regenerating and requiring a clean diff.

- [ ] **Step 4: Commit final targeted fixes**

```bash
git add assets/learning-supports scripts/generate-learning-supports-manifest.mjs scripts/generate-lesson-shells.mjs tools/inject-learning-supports.mjs tools/learning-supports.test.mjs tools/validate-learning-supports.mjs tests/learning-supports.spec.ts curriculum/index.html
git commit -m "fix: complete learning supports release gate"
```

Skip this commit if verification requires no corrections.

### Task 8: Guarded merge and production deployment

**Files:**
- No source changes expected.

- [ ] **Step 1: Confirm branch and commit scope**

Run: `git status --short --branch && git log --oneline origin/main..HEAD && git diff --stat origin/main...HEAD`
Expected: clean feature branch containing only the design, plan, supports implementation, 64 mechanical integrations, tests, and curriculum entry.

- [ ] **Step 2: Deploy through the guarded ship workflow**

Run: `ALLOW_DEPLOY=1 npm run ship -- $(git rev-list --reverse origin/main..HEAD)`
Expected: the script cherry-picks reviewed commits onto a clean `origin/main` worktree, runs its pre-push QA gate, pushes main, and reports the production build stamp serving the new commit.

- [ ] **Step 3: Verify production**

Run: `npm run ship:verify` and the production lesson monitor. Open the curriculum hub and representative lesson URLs; verify supports off, on, invalid fragment fallback, original scoring, and mobile layout.

- [ ] **Step 4: Report release evidence**

Record the production commit, public routes checked, full commands and results, and any genuine residual risk. If production smoke fails, use the guarded repository recovery procedure and report the rollback rather than leaving a degraded lesson live.
