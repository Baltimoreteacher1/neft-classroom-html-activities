# Lesson Platform "Top 1%" — Design Spec

**Date:** 2026-06-19
**Branch:** `feat/lesson-platform-top1` (built in worktree `../nclp-worktree` to survive repo automation clobbering)
**Goal:** Elevate the 78 self-contained math lessons to gold-standard / enterprise quality across four axes, in parallel, as additive shared modules on the existing layer.

## Architectural principle

Everything is **additive shared modules** wired through a **single loader** (`assets/lesson-platform.js`) injected once into all 78 lessons via an idempotent injector (`tools/inject-lesson-platform.js`, mirrors `tools/inject-game-fx.js`). No hand-editing lessons, no parallel v2 engine, single canonical path. Degrades gracefully: any layer absent/erroring must never break the lesson. Respects `prefers-reduced-motion`, a mute toggle, and existing dark-mode caveats. Deploy-safe on a feature branch.

## Integration contract (verified against real lessons)

- Interactive items: `<input class="fill-input" data-answer="62">` and `.check-btn` buttons; some MCQ via `.check-btn` + `data-answer`.
- Every lesson already loads `/assets/nt-page-enhance.js` (save/grade bar; reads `window.NT_GRADE_ITEMS`) and `/shared/save-resume/save-resume-engine.js`.
- Progress backend: D1 via `functions/api/progress/[[path]].js` (GET/POST). Canonical student-progress store lives in this classroom repo.
- Lessons are **generated/enhanced**; injection is the canonical way to add a script to all of them.
- Sections present: Warm-Up, Launch (gradual release), Practice, Challenge, vocab, Turn & Talk, Show-Your-Work scaffold; Level 0/1/2 tiers exist.

## The four layers

### 1. Adaptive Mastery Engine — `assets/adaptive-engine.js` (+ `adaptive-engine.css`)

- Wraps existing `.check-btn`/`data-answer` items: captures responses, tags misconceptions via a per-lesson map (`window.NT_MISCONCEPTIONS` injected from config; falls back to generic "common error" tags).
- Mastery state machine per skill: wrong answer → inline targeted re-teach micro-block + a fresh similar item; advance only on mastery threshold (default 2 consecutive correct or 80%).
- Difficulty laddering tied to Level 0/1/2 tiers; spaced-retrieval block pulling 1–2 prior-lesson items.
- Emits events to layer 4. No giveaways (Socratic hint ladder, not the answer).

### 2. Engagement / Production Layer — `assets/lesson-juice.{js,css}` (extends `game-fx`)

- Progress arc, streak counter, XP/level, satisfying correct/incorrect states, completion certificate (reuse intervention cert).
- Audio: correct/incorrect chimes, optional ambient, reuse `speechSynthesis` TTS read-aloud. Global mute + `prefers-reduced-motion` honored.
- Per-unit light narrative theming (data-driven, no per-lesson hand work).

### 3. AI Tutor — `assets/ai-tutor.js` + `functions/api/tutor/[[path]].js` (Worker proxy)

- Floating tutor: Socratic hint ladder, "explain why," infinite on-level practice generation, scoped to current standard + item + student work.
- Proxy keeps credentials server-side, rate-limited. **No student PII** sent to model (standard + item text + work only).
- Model strategy: prefer `ANTHROPIC_API_KEY` (Claude `claude-haiku-4-5` for cost) if secret set; **fall back to Cloudflare Workers AI binding** so it is deployable with no external secret. Tutor shows a friendly "offline" state if neither is configured — never blocks the lesson.

### 4. Rigor / Data Backbone

- `assets/lesson-telemetry.js`: batches interaction events → existing `/api/progress` (item attempts, mastery, time-on-task, hints used). Offline-first queue.
- Teacher mastery view: extend existing dashboard surface (additive page `teacher-tools/mastery/`).
- Accessibility: engine-wide AAA pass in the shared modules (focus management, ARIA live regions for feedback, contrast, keyboard paths). Guard all DOM helpers (the unguarded-DOM crash class).
- Tests: `tests/lesson-platform.spec.ts` (Playwright + axe) — boots reference lesson + a sample across units, asserts no console errors, a11y clean, adaptive/juice/telemetry/tutor-offline all initialize.

## Loader & rollout

`assets/lesson-platform.js` boots the four layers in order (telemetry → adaptive → juice → tutor), each in try/catch, reading optional `window.NT_*` config. Injector adds one CSS + one JS tag (sentinel-guarded, `--dry-run`/`--revert`).

Rollout: build modules → prove on reference lesson `math/unit-1/1-1-math-is-mine/` (Playwright) → inject into all 78 → run test suite → commit → deploy.

## Execution

Multi-agent workflow: shared-contract phase → 4 concurrent build tracks (one per layer) + loader/injector → integration & Playwright verification on reference lesson → roll to all 78 → test sweep.

## Non-goals

No folder reorg. No lockfile/dep churn beyond Playwright/axe dev-deps if absent. No change to lesson content/standards. No production secret provisioning (Workers AI fallback keeps it deployable).
