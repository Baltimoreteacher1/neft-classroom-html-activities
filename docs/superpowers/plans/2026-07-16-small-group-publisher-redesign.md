# Small-Group Publisher Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every small-group lesson original parallel practice, large visual models, guided fill-in steps, interactive math supports, and reliable vocabulary images.

**Architecture:** A deterministic content builder generates lesson-specific parallel practice with explicit visual/step metadata. A focused visual-practice renderer consumes that schema inside the existing tabbed experience. Vocabulary cards and popups share the existing image resolver with tested fallbacks.

**Tech Stack:** Static HTML, JavaScript ES modules, Vite, JSDOM, Playwright, Cloudflare Pages Functions.

---

### Task 1: Lock the publisher-quality content contract

**Files:**
- Modify: `tools/small-group-modes.test.mjs`
- Modify: `tools/validate-small-group-lessons.mjs`

- [ ] Add assertions that every small-group config has 12 unique `parallelPractice` items, no stem matches its parent lesson, and every item has an ID, answer/check contract, visual metadata, and at least two guided steps.
- [ ] Run `node tools/small-group-modes.test.mjs` and confirm it fails because `parallelPractice` is missing.
- [ ] Keep the failing assertions while implementing Tasks 2–4.

### Task 2: Generate original parallel practice

**Files:**
- Create: `tools/lib/small-group-parallel-practice.mjs`
- Modify: `tools/generate-small-group-lessons.mjs`
- Modify: `lessons/*-group1/config.json`
- Modify: `lessons/*-group2/config.json`

- [ ] Implement deterministic builders for number operations, fractions, ratios/percents, algebra/equations, geometry, statistics, and coordinate concepts.
- [ ] Give every generated item calculated answers, concise hints, a worked explanation, a visual kind, and cloze-style steps.
- [ ] Add `parallelPractice` to the student-safe config before it is written.
- [ ] Run `node tools/generate-small-group-lessons.mjs --configs-only` and confirm all 128 configs regenerate.
- [ ] Run the Task 1 tests and confirm the content contract passes.

### Task 3: Build the visual guided-practice component

**Files:**
- Create: `engine/core/small-group-visual-practice.js`
- Modify: `engine/core/small-group-practice.js`
- Modify: `engine/core/small-group-renderer.js`
- Modify: `engine/core/small-group-ui.js`

- [ ] Add a failing JSDOM contract for a large visual, interactive control, read-aloud button, and fill-in step fields.
- [ ] Render concept-specific SVG models with interactive controls and an accessible static fallback.
- [ ] Render one short step at a time; check each blank before unlocking the next step.
- [ ] Use full scaffolds in Guided, optional scaffolds in Practice, and a compact tool in More Practice.
- [ ] Verify keyboard operation, live feedback, large type, contrast, and reduced-motion behavior.

### Task 4: Repair vocabulary image presentation

**Files:**
- Modify: `engine/core/vocab-images.js`
- Modify: `engine/core/small-group-engagement.js`
- Modify: `engine/core/small-group-annotation.js`
- Modify: `assets/small-group-annotation.css`
- Modify: `tools/small-group-modes.test.mjs`

- [ ] Add a failing test proving every resolved vocabulary asset exists and every vocabulary card/popup receives an image source.
- [ ] Add illustrations to vocabulary cards and make the whole card’s “See picture and meaning” control open the visual definition.
- [ ] Add loading, error, and category-fallback handling to popup images.
- [ ] Verify all four words in a representative lesson show non-zero image dimensions on desktop and mobile.

### Task 5: Production QA and deployment

**Files:**
- Review all changed files.

- [ ] Run Biome on changed JavaScript.
- [ ] Run `npm test`, `npm run validate:small-groups`, `npm run validate:static`, and `npm run build`.
- [ ] Run Playwright on representative lessons from all seven concept families and confirm zero failed requests or page errors.
- [ ] Run Axe on Vocabulary, Guided, Practice, and More Practice panels.
- [ ] Review `git diff --check`, changed paths, and public bundles for teacher-data leakage.
- [ ] Commit, run the guarded ship dry run against current `origin/main`, deploy with `ALLOW_DEPLOY=1`, wait for the live build stamp, and repeat production browser checks.
