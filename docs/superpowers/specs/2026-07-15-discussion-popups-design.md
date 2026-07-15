# Discussion Moments — clickable discourse pop-ups for curriculum lessons

**Date:** 2026-07-15
**Status:** Approved (standing directive: build → merge → deploy when flawless)
**Area:** `engine/core` lesson renderer (shared across all 98 `eduwonderlab.com/curriculum` lessons)

## Problem

Lessons need more structured opportunities for students to **talk to and question each
other**. The engine already ships an inline **Turn & Talk** card in the launch, explore,
and connect phases, but there is no discussion moment in **Practice** (the longest phase)
or as a **capstone synthesis** before the Exit Ticket, and nothing that explicitly
scaffolds _reciprocal_ student-to-student questioning ("How do you know?" / "Convince me").

## Goal

Add opt-in, clickable **discussion pop-ups** at points that currently lack a discussion
moment, so they only _support_ the lesson and never disrupt it. Each pop-up presents a
rigorous discourse question, a reciprocal partner-questioning protocol, and tiered
supports (Level 1 support / Level 2 stretch) that are available but not distracting.

## Non-goals (YAGNI)

- No grading, scoring, XP, stars, or phase-completion coupling — purely formative.
- No new config authoring burden: works with zero authoring, honors existing
  `config.turnAndTalk` when present.
- No auto-open / no modal that blocks progress. Student chooses to open it.
- Do **not** duplicate the existing inline Turn & Talk (launch/explore/connect keep it).

## Design

### New module: `engine/core/discourse.js`

Single responsibility: render a compact, quiet **trigger pill** into a host element and,
on click, open one **accessible modal dialog** with the discussion content. Exports:

```
mountDiscussionMoment(host, { phase, config, state, prompt, variant })
```

- **Trigger pill** — a small `button` ("💬 Discuss & question a partner"), calm styling,
  not auto-opening. Shows a "✓ discussed" state once confirmed. Keyboard-focusable.
- **Modal** — `role="dialog"` `aria-modal="true"`, labelled by its title, focus-trapped,
  Esc-to-close, click-backdrop-to-close, returns focus to the trigger on close. Body
  scroll locked while open. Rendered once per open, torn down on close.
- **Content**
  - **Question** — rigorous, press-for-reasoning. Source order: authored
    `config.turnAndTalk[phase].question` → keyword prompt from lesson vocab → a stable
    per-lesson reasoning prompt (deterministic hash, no `Math.random`).
  - **Reciprocal questioning protocol** ("Question each other") — 3 concrete moves:
    Partner A explains → Partner B asks a probe ("How do you know?" / "Why does that
    work?" / "What if the numbers changed?") → switch roles. This is the differentiator
    vs. the inline Turn & Talk.
  - **Level 1 support** (disclosure, collapsed by default so it does not overwhelm):
    bilingual sentence stems (en/es) + word bank chips + optional "Start here" kernel.
  - **Level 2 stretch** (disclosure): an extend/convince question + stretch stems.
  - **"We discussed ✓"** confirm button — records a non-graded flag via
    `state.saveResponse(phaseId, key, "done")`; re-open shows the confirmed state.

Supports are behind disclosures so the default view is just _question + protocol_ — quiet
by design. All questions/stems are self-contained in the module with an engine fallback so
every lesson surfaces a valid moment with zero authoring.

### Styling

Consistent with the file's existing inline-style idiom + reused `card`/`badge` classes.
One `<style>` block injected **once**, all selectors prefixed `.discourse-` and the overlay
scoped, to avoid the known engine-CSS bundle-leak (never emit bare element selectors).

### Wiring (`lesson-renderer.js`) — additive, at gaps only

1. **Practice phase** (`renderPracticePhase`, after skill practice / near the score bar):
   a strategy-focused discussion pop-up ("Compare your method with a partner's").
2. **Reflect / pre-Exit-Ticket capstone**: a synthesis discussion pop-up ("Before the exit
   ticket, convince a partner your answer is right").

Existing inline Turn & Talk in launch/explore/connect is untouched.

## Data flow

`config.json` (optional `turnAndTalk`) → resolved prompt in `lesson-renderer.js` →
`mountDiscussionMoment` renders trigger → click opens modal → "We discussed" →
`state.saveResponse` (non-graded, save/resume-persisted) → re-render shows confirmed.

## Accessibility & i18n

- Full keyboard support, focus trap, focus return, `aria-modal`, Esc/backdrop close.
- Bilingual (en/es) stems following the existing `DEFAULT_TURN_TALK_STEMS` pattern.
- Large, readable text; calm color; respects the lesson's existing theme tokens.

## Risks & mitigations

- **CSS bundle leak** → prefix + scope all selectors, inject `<style>` once.
- **Redundancy with Turn & Talk** → only placed where no discussion moment exists.
- **Disruption** → opt-in trigger, supports collapsed, never blocks progress, never graded.
- **Save/Resume regression** → uses the existing `state` API only; run
  `npm run validate:save-resume`.

## Verification

`npm run build` (Vite) → `npm run validate` (static/reveal/hub/ccss/save-resume/injection)
→ `npm run preview` + Playwright smoke: open a lesson, confirm pill renders, modal opens,
focus traps, Esc closes, "We discussed" persists across reload, no console errors.

## Deploy

`ALLOW_DEPLOY=1 npm run ship -- <sha>` after checks pass (standing authorization for this
task). Single deploy path = push to `main` via `ship.sh`.
