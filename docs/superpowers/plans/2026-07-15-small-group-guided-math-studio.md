# Small-Group Guided Math Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade every small-group lesson into an accessible guided math studio and permanently enforce parent-to-variant curriculum ordering.

**Architecture:** Keep lesson configs as the content source of truth. Split shared presentation and engagement concerns out of the oversized renderer, compose them from the renderer, and add a zero-dependency invariant validator that covers all 128 generated variants.

**Tech Stack:** Static ES modules, DOM APIs, CSS, Node.js validation, Vite, Playwright, Cloudflare Pages Git deployment.

---

### Task 1: Add the failing small-group integrity gate

**Files:**
- Create: `tools/validate-small-group-lessons.mjs`
- Modify: `package.json`

- [ ] Verify the gate fails when a fixture-equivalent parent/Group 1/Group 2 sequence is incomplete or out of order.
- [ ] Implement checks for 64 unique parents, exactly two variants per parent, Group 1 before Group 2, immediate curriculum placement, matching titles/variants, required config sections, and existing page/config files.
- [ ] Add `validate:small-groups` to `package.json` and the full `validate` chain.
- [ ] Run `npm run validate:small-groups`; expected result: one success summary naming 64 parents and 128 variants.

### Task 2: Extract the shared UI foundation

**Files:**
- Create: `engine/core/small-group-ui.js`
- Modify: `engine/core/small-group-renderer.js`

- [ ] Move `ACCENT`, `esc`, `el`, celebration, and scoped CSS injection into the UI module without changing public renderer behavior.
- [ ] Add the guided-studio visual system: readable type, connected phase rail, mission surfaces, touch targets, focus rings, high-contrast state colors, reduced motion, responsive layout, and print rules.
- [ ] Import the extracted helpers from the renderer and keep each source file below 750 lines.
- [ ] Run `node --check` on both modules; expected result: no output and exit code 0.

### Task 3: Build the engagement layer

**Files:**
- Create: `engine/core/small-group-engagement.js`
- Modify: `engine/core/small-group-renderer.js`

- [ ] Render a mission brief from `noticeAndWonder`, with optional image, browser read-aloud, sentence-starter response areas, and a private confidence pulse.
- [ ] Replace passive vocabulary cards with revealable multilingual word cards and a retryable term-definition match.
- [ ] Render a lesson-aligned group talk from `turnAndTalk`, including sentence frames, word bank, rotating roles, and a 60-second visible timer.
- [ ] Add a completion reflection that compares the student's own readiness before and after without collecting identity or transmitting data.
- [ ] Compose Launch → Build → Team → Show It in the renderer and connect each phase to the progress rail.

### Task 4: Improve practice feedback and protect teacher material

**Files:**
- Modify: `engine/core/small-group-renderer.js`

- [ ] Change wrong multiple-choice answers to retryable feedback without automatically highlighting the correct choice.
- [ ] Change fill-in feedback to route students to a hint or group discussion instead of printing the answer after two attempts.
- [ ] Change open responses from “Show a model answer” to an “I'm ready to share” checkpoint.
- [ ] Keep teacher facilitation moves in teacher mode and add the selected talk prompt's listen-for there only.
- [ ] Verify keyboard Enter, live feedback, hint ladders, and completion tally still work.

### Task 5: Add focused browser coverage

**Files:**
- Create: `tests/small-group-studio.spec.ts`

- [ ] Test a Group 1 lesson for mission content, confidence selection, vocabulary match, talk roles/timer, practice retry behavior, and absence of student answer-key text.
- [ ] Test a Group 2 lesson for challenge language, student/teacher separation, and responsive no-overflow behavior.
- [ ] Test `/curriculum/` for main lesson → Group 1 → Group 2 order and working links.
- [ ] Run `npx playwright test tests/small-group-studio.spec.ts`; expected result: all focused tests pass.

### Task 6: Run production gates and ship

**Files:**
- Review all changed files; no additional source file is expected.

- [ ] Run formatter/checker, focused tests, `npm run validate`, and `npm run build`; repair any failure without weakening assertions.
- [ ] Review `git diff --check`, changed paths, placeholders, and the final branch diff.
- [ ] Commit only the reviewed paths with a Conventional Commit message.
- [ ] Run the guarded ship dry run, then `ALLOW_DEPLOY=1 npm run ship -- <sha>`.
- [ ] Verify the live build stamp and smoke-test `/curriculum/`, `/lessons/1-1-group1/`, and `/lessons/7-2-group2/` on production.
