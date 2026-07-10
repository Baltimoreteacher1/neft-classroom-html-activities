# Curriculum Teacher Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete teacher workflow and student-safe launch surface to the existing curriculum hub without changing or removing existing content.

**Architecture:** Extend the existing additive curriculum layer with a separate teacher-workflow asset, generate a public-safe lesson manifest from the canonical curriculum manifest, and add a static student launcher. Store plans and aggregate evidence locally; keep the existing public Student Mode and teacher-resource gates intact.

**Tech Stack:** Static HTML, CSS, browser JavaScript, Node.js build scripts, localStorage, Playwright, Vite, Cloudflare Pages.

---

### Task 1: Lock the requirements with a failing validator

**Files:**
- Create: `tools/validate-curriculum-teacher-workflow.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the validator** to require the workflow assets, student launcher, safe manifest, index wiring, Teacher Mode guard, 44px targets, focus styles, print styles, and absence of teacher-only resource keys in the public manifest.
- [ ] **Step 2: Run `node tools/validate-curriculum-teacher-workflow.mjs`** and confirm it fails because the new files do not exist.
- [ ] **Step 3: Add `validate:teacher-workflow` to `package.json` and append it to `validate`.**
- [ ] **Step 4: Commit with `test: lock curriculum teacher workflow requirements`.**

### Task 2: Generate the public-safe launch manifest

**Files:**
- Create: `scripts/generate-curriculum-launch-manifest.mjs`
- Create: `data/curriculum-launch-manifest.json`
- Modify: `package.json`

- [ ] **Step 1: Add a generator** that reads `data/curriculum-manifest.json`, retains `id`, unit, lesson, title, standard, objective, language objective, time, student vocabulary/frames, and only `lesson`, `guidedNotes`, `handout`, `homework`, `familyPage`, `studentHelp`, and `exitTicket` paths.
- [ ] **Step 2: Reject forbidden keys** matching `slides|teacher|answer|gradebook|dashboard|docx|pdf` before writing output.
- [ ] **Step 3: Run the generator** and confirm all 74 lessons are present and every emitted path is rooted under `/lessons/`.
- [ ] **Step 4: Wire generation before `vite build` and rerun the validator.**
- [ ] **Step 5: Commit with `feat: generate student-safe curriculum launch data`.**

### Task 3: Build the distraction-free student launcher

**Files:**
- Create: `curriculum/student-launch/index.html`
- Create: `assets/curriculum-student-launch.css`
- Create: `assets/curriculum-student-launch.js`

- [ ] **Step 1: Add semantic launcher markup** with skip link, status region, lesson heading, numbered directions, resource actions, support panel, completion checklist, and playlist navigation.
- [ ] **Step 2: Load the generated manifest** using `?lesson=1-1`; show a clear recovery message and link to `/curriculum/` for invalid IDs.
- [ ] **Step 3: Add playlist support** using repeated validated IDs in `?playlist=1-1,1-2`; never render arbitrary HTML or arbitrary URLs from the query string.
- [ ] **Step 4: Add local completion state and browser speech synthesis** with visible stop controls and no network requests.
- [ ] **Step 5: Add responsive, high-contrast, print, focus, and reduced-motion styles.**
- [ ] **Step 6: Run the validator and commit with `feat: add safe student lesson launcher`.**

### Task 4: Build Today's Teaching and the Lesson Readiness Card

**Files:**
- Create: `assets/curriculum-teacher-workflow.js`
- Create: `assets/curriculum-teacher-workflow.css`
- Create: `data/curriculum-teacher-workflow.json`
- Modify: `curriculum/index.html`

- [ ] **Step 1: Add workflow data** for materials, prerequisites, misconceptions, response moves, success criteria, and 45/90-minute sequence templates by skill family.
- [ ] **Step 2: Render only when `body.teacher-mode` is active** and reuse `window.CurriculumHub.unitsData`, the current lesson selection, support data, and UIFR data.
- [ ] **Step 3: Add previous/next, teach, student launch, local QR, copy, print, favorite, recent, and substitute-plan actions.**
- [ ] **Step 4: Add the readiness card** with objective, language objective, success criteria, timing, materials, prerequisite, misconception response, TWR, WIDA 1–2/3–4, SPED, and enrichment.
- [ ] **Step 5: Wire the new CSS/JS immediately after `curriculum-top1` assets without modifying any unit or lesson markup.**
- [ ] **Step 6: Run both curriculum validators and commit with `feat: add teacher daily command center`.**

### Task 5: Add pacing, playlists, unit map, and next-day planning

**Files:**
- Modify: `assets/curriculum-teacher-workflow.js`
- Modify: `assets/curriculum-teacher-workflow.css`

- [ ] **Step 1: Add a Monday–Friday pacing view** with local save, per-day clear, copy, print, and no account requirement.
- [ ] **Step 2: Add an ordered playlist builder** with add, move, remove, copy-link, and preview actions using only canonical lesson IDs.
- [ ] **Step 3: Add a unit map** showing lesson, standard, objective, time, readiness state, teach action, and student-safe launch action.
- [ ] **Step 4: Add the aggregate next-day loop** for Ready/Developing/Reteach counts and map each band to canonical resources and support guidance without student names.
- [ ] **Step 5: Collapse the existing featured-tool strip into a reversible Teacher Tools drawer in Teacher Mode while leaving every card and link in the DOM.**
- [ ] **Step 6: Run the validator and commit with `feat: complete curriculum planning workflows`.**

### Task 6: Add browser coverage and verify the production build

**Files:**
- Create: `tests/curriculum-teacher-workflow.spec.ts`

- [ ] **Step 1: Test public safety**: `/curriculum/` starts in Student Mode and does not show the teacher workflow.
- [ ] **Step 2: Seed Teacher Mode locally** and test daily lesson selection, previous/next, readiness content, and safe student link generation.
- [ ] **Step 3: Test pacing persistence, playlist construction/navigation, next-day recommendations, mobile viewport, keyboard focus, and an axe scan.**
- [ ] **Step 4: Run `npm run validate:teacher-workflow`, `npm run validate`, `npm run audit`, `npm run build`, and `npx playwright test tests/curriculum-teacher-workflow.spec.ts`.**
- [ ] **Step 5: Review `git diff --check`, the full diff, generated output, and changed-file scope.**
- [ ] **Step 6: Commit with `test: verify curriculum teacher command center`.**

### Task 7: Integrate and publish through the supported deployment path

**Files:**
- No source-file changes expected.

- [ ] **Step 1: Confirm the feature branch is clean and all commits are based on current `origin/main`.**
- [ ] **Step 2: Merge the feature branch into `main` from the clean main worktree without rewriting history.**
- [ ] **Step 3: Rerun the focused validator and build from the merged main worktree.**
- [ ] **Step 4: Push `main` to `origin`; Cloudflare Pages Git integration performs production deployment. Do not run manual Wrangler deployment.**
- [ ] **Step 5: Poll the production URL until the deployed commit and new routes are live, then smoke-test `/curriculum/` and `/curriculum/student-launch/?lesson=1-1`.**
