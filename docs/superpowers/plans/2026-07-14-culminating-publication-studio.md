# Culminating Project Publication Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared evidence, quality-check, and professional publishing workflow to all 22 culminating-project versions.

**Architecture:** Build one defensive browser enhancement layer that discovers existing project markup and enriches it without modifying project math. Attach it with an idempotent injector, enforce coverage with a deterministic validator, and exercise behavior on every project route through Playwright.

**Tech Stack:** Static HTML, vanilla JavaScript, CSS, Node.js validation scripts, Playwright, Vite, Cloudflare Pages Git deployment.

---

## File Map

- Create `shared/projects/projects-publication.js`: ledger, quality model, packet builder, persistence, and exports.
- Create `shared/projects/projects-publication.css`: responsive, bilingual, accessible, print-safe presentation.
- Create `tools/inject-projects-publication.mjs`: idempotent 22-page asset injection.
- Create `tools/validate-projects-publication.mjs`: coverage, marker, hook, and URL validation.
- Modify `tests/projects-smoke.spec.ts`: all-route behavior and accessibility coverage.
- Modify `package.json`: focused injection/validation commands and validation-chain integration.
- Modify the 22 project-version `index.html` files only through the injector.

### Task 1: Lock the Publication Contract With Failing Tests

**Files:**
- Create: `tools/validate-projects-publication.mjs`
- Modify: `tests/projects-smoke.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the static contract validator**

Enumerate exactly 22 version pages and assert each contains one paired publication head block, one paired body block, canonical CSS/JS paths, at least one `.step-panel`, a final panel, and no unsafe or empty research URLs. Collect all failures, exit nonzero, and print `Publication Studio validation passed: 22 project pages.` only on success.

- [ ] **Step 2: Add focused scripts**

```json
"inject:projects-publication": "node tools/inject-projects-publication.mjs",
"validate:projects-publication": "node tools/validate-projects-publication.mjs"
```

Append `npm run validate:projects-publication` to the existing `validate` chain.

- [ ] **Step 3: Extend the browser contract**

For every student version, require `body.dataset.publicationInit === "1"`, one `.pps-quality`, one `.pps-studio`, one ledger per `.step-research`, Spanish publication copy after `toggleLanguage()`, accessible names, and no uncaught errors.

- [ ] **Step 4: Confirm RED**

```bash
npm run validate:projects-publication
npx playwright test tests/projects-smoke.spec.ts --project=chromium --grep "version-a|version-b" --workers=2
```

Expected: failure because the layer is not injected and the new DOM does not exist.

- [ ] **Step 5: Commit the contract**

```bash
git add package.json tools/validate-projects-publication.mjs tests/projects-smoke.spec.ts
git commit -m "test(projects): define publication studio contract"
```

### Task 2: Build the Research Evidence Ledger

**Files:**
- Create: `shared/projects/projects-publication.js`
- Create: `shared/projects/projects-publication.css`

- [ ] **Step 1: Implement safe foundations**

Add an IIFE with pathname-scoped local storage, HTML escaping, EN/ES helpers, defensive debounce, label extraction, and idempotent `init()` that stamps `document.body.dataset.publicationInit = "1"`. Catch storage failures.

- [ ] **Step 2: Enrich every research block**

For each `.step-research`, locate its source anchor and `data-research-find` field. Add a `.pps-ledger` with claim/decision, credibility/usefulness, access date, and an `aria-live` status. Derive stable keys from the finding ID or block index. Preserve the existing finding as the evidence-text source of truth.

- [ ] **Step 3: Score ledger completeness honestly**

Report `not started`, `developing`, or `publication ready` from finding, claim, credibility, valid source URL, and access date. Do not judge truth or mathematical correctness.

- [ ] **Step 4: Add accessible presentation and verify syntax**

Support 320px–1440px layouts, visible focus, 44px controls, bilingual spans, high-contrast status, print suppression for editing controls, and reduced motion.

```bash
node --check shared/projects/projects-publication.js
npx biome check shared/projects/projects-publication.js shared/projects/projects-publication.css
```

- [ ] **Step 5: Commit**

```bash
git add shared/projects/projects-publication.js shared/projects/projects-publication.css
git commit -m "feat(projects): add publication evidence ledger"
```

### Task 3: Add the Publication Quality Check

**Files:**
- Modify: `shared/projects/projects-publication.js`
- Modify: `shared/projects/projects-publication.css`

- [ ] **Step 1: Build a transparent snapshot**

Collect substantive responses, math/reasoning evidence, publication-ready research, reflections, rubric ratings, and project checklist state. Each category has a boolean, count, bilingual detail, and jump target. Missing optional categories are `Not used`, not failures.

- [ ] **Step 2: Mount the final-step panel**

Append one `.pps-quality.no-print` to the last `.step-panel`, with live status and a jump button for each incomplete category. Recompute on `input`, `change`, rubric clicks, and portfolio open.

- [ ] **Step 3: Preserve navigation and focus**

Jump actions call existing `goStep()` for hidden targets, wait for activation, scroll into view, and focus. Never block submission.

- [ ] **Step 4: Verify and commit**

```bash
node --check shared/projects/projects-publication.js
npx biome check shared/projects/projects-publication.js shared/projects/projects-publication.css
git add shared/projects/projects-publication.js shared/projects/projects-publication.css
git commit -m "feat(projects): add publication quality review"
```

### Task 4: Build the Professional Publication Packet

**Files:**
- Modify: `shared/projects/projects-publication.js`
- Modify: `shared/projects/projects-publication.css`

- [ ] **Step 1: Add optional publication metadata**

Mount `.pps-studio.no-print` on the final panel with title, byline, and executive-summary fields. Persist locally and explain that the byline stays on-device unless exported.

- [ ] **Step 2: Build one canonical packet model**

Include project title, optional metadata, timestamp, quality results, research records and sources, substantive work, reflections, checklist, and rubric assessment. Exclude teacher, coach, helper, and publication-control fields.

- [ ] **Step 3: Render safe preview and exports**

Render escaped content in a labeled dialog. Provide clipboard copy with fallback, UTF-8 text download, versioned JSON backup, and a printable self-contained HTML document with blocked-popup fallback. Announce every outcome through `aria-live` and never throw when APIs are missing.

- [ ] **Step 4: Add publication and print styles**

Use editorial hierarchy, wrapping source URLs, page-break control, monochrome-safe borders, responsive dialog sizing, visible focus, and reduced-motion support.

- [ ] **Step 5: Verify and commit**

```bash
node --check shared/projects/projects-publication.js
npx biome check shared/projects/projects-publication.js shared/projects/projects-publication.css
git add shared/projects/projects-publication.js shared/projects/projects-publication.css
git commit -m "feat(projects): add professional publication packet"
```

### Task 5: Inject and Validate All 22 Projects

**Files:**
- Create: `tools/inject-projects-publication.mjs`
- Modify: 22 `math/*/projects/version-*/index.html` files

- [ ] **Step 1: Write the idempotent injector**

Mirror the publisher injector: enumerate units 1–10 plus statistics and A/B; splice paired CSS/JS sentinels before the last closing tags; use cache-busted canonical asset paths; support `--dry-run`; reject partial markers; never regex-match inline markup strings.

- [ ] **Step 2: Prove idempotence**

```bash
npm run inject:projects-publication -- --dry-run
npm run inject:projects-publication
npm run inject:projects-publication -- --dry-run
```

Expected counts: 22, 22, 0.

- [ ] **Step 3: Validate and commit**

```bash
npm run validate:projects-publication
git add tools/inject-projects-publication.mjs math/*/projects/version-*/index.html
git commit -m "feat(projects): publish studio across culminating projects"
```

### Task 6: Browser Regression and Accessibility Hardening

**Files:**
- Modify: `tests/projects-smoke.spec.ts`
- Modify only as required: shared publication JS/CSS

- [ ] **Step 1: Exercise the workflow on all routes**

Fill the first research finding and ledger, assert ready status and persistence after reload, switch Spanish, open the studio, assert source/evidence output, and verify accessible control names. Stub clipboard/download/print APIs deterministically.

- [ ] **Step 2: Run all project smoke tests**

```bash
npx playwright test tests/projects-smoke.spec.ts --project=chromium --workers=2
```

Expected: all 34 project-suite routes pass without page, console, asset, or handler errors.

- [ ] **Step 3: Check accessibility and responsive behavior**

Assert unique dialog labels, keyboard reachability, live statuses, valid preview headings, visible focus, and no horizontal overflow at 360px.

- [ ] **Step 4: Preserve every failing assertion**

If a test fails, keep its assertion unchanged, make the smallest shared-layer correction, rerun that exact case, then rerun the full project spec.

- [ ] **Step 5: Commit hardening**

```bash
git add tests/projects-smoke.spec.ts shared/projects/projects-publication.js shared/projects/projects-publication.css
git commit -m "test(projects): harden publication studio workflows"
```

### Task 7: Quality Gate, Review, Merge, and Production Verification

**Files:**
- Modify only files required by preserved failing assertions.

- [ ] **Step 1: Run narrow-to-broad checks**

```bash
npm run validate:projects-publication
npm run validate:injection
npm run validate:save-resume
npm run build
npm run validate
npx playwright test tests/projects-smoke.spec.ts --project=chromium --workers=2
```

- [ ] **Step 2: Review the complete diff**

```bash
git status --short
git diff --check
git diff --stat origin/main...HEAD
git diff origin/main...HEAD -- shared/projects tools tests/projects-smoke.spec.ts package.json
```

Confirm no secrets, dependencies, answer keys, existing project logic, or unrelated files changed.

- [ ] **Step 3: Push and open a structured PR**

Push `feat/culminating-publication-studio`; create a PR with Why, How, and Tests sections and exact results; wait for required checks.

- [ ] **Step 4: Merge through GitHub**

Use the repository's allowed merge method and record the resulting `main` commit. Do not run the prohibited manual Pages deployment; Cloudflare must deploy from merged `main`.

- [ ] **Step 5: Verify production**

Confirm the successful Cloudflare production deployment source matches merged `main`. Smoke-test all 22 live routes for HTTP success, publication assets, initialized ledger/quality/studio UI, and the repaired external research destinations.
