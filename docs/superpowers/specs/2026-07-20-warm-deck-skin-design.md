# Warm Deck Skin — Design

**Date:** 2026-07-20 · **Status:** Pilot (Lesson 1-1)

## Goal

Give curriculum lessons a warm, slide-deck visual style (inspired by modern
lesson-deck tools; no external branding) while keeping ALL content, flow,
interactive features, save/resume, and Canvas/SCORM behavior exactly as-is.

## Approach: opt-in CSS skin layer

- `engine/styles/theme-warm.css`, imported after `editorial.css` in
  `engine/core/app.js`. Scoped entirely under `body.editorial.skin-warm-deck`.
- Boot seam: `config.skin` in a lesson's `config.json` → body class
  `skin-${config.skin}`. No DOM, renderer, or content changes.
- The editorial layer is var-driven, so the skin mostly retokenizes it:
  `--fl-serif` → Baloo 2 (chunky rounded display), `--fl-body` → Nunito
  (readable rounded sans), paper palette → warm cream/blush, radii/shadows
  softer and rounder. Patrick Hand (school-print) is reserved for hints,
  feedback, and vocab reveals — not long body text (readability for L0/L1).
- Signature elements: cream slide-card sections, pill badges/buttons, dashed
  "sticker" objective panels, tilted coral pill on the masthead, teal deck
  sidebar.

## Typography

| Role                | Face            | Fallbacks                          |
| ------------------- | --------------- | ---------------------------------- |
| Display/headings    | Baloo 2 800     | Arial Rounded MT Bold, Avenir Next |
| Body                | Nunito          | Avenir Next, Calibri, system-ui    |
| UI accents          | Fredoka 500–700 | Avenir Next                        |
| Handwritten accents | Patrick Hand    | Comic Sans MS, Chalkboard SE       |

Fonts load via Google Fonts `@import`, matching the existing pattern in
`design-system.css` and `editorial.css` (Outfit/Hanken/Fraunces). Follow-up
option: vendor woff2 files into `shared/fonts/` for fully-offline SCORM.

## Canvas / SCORM compatibility

- DOM unchanged → completion codes, grade bridge, iframe sizing all untouched.
- Skin ships inside the Vite CSS bundle (hashed filename, no `?v=` bump
  needed for the lesson app).
- Print styles flatten the skin to clean white handouts.

## Rollout

1. Pilot: `"skin": "warm-deck"` on Lesson 1-1 only. Verify desktop/mobile +
   a SCORM package in Canvas.
2. On approval: flip the default (boot adds the class unless a config opts
   out), retiring the dual look — single canonical style.
