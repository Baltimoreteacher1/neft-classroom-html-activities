# Lesson Motion Layer — Design (2026-07-21)

## Why

Publisher feedback: lessons on eduwonderlab.com feel static — "should maybe have
some animated features / more fun graphics." Feedback micro-animations already
exist (confetti, streak, pops); the gap is content and chrome. Approved
direction: Tier 1 (site-wide juice + celebrations) plus Tier 2 (math that
moves), holding character/journey ideas for later.

## Scope

Engine-level only — no per-lesson file edits. Ships to all Vite-built lessons
via the shared bundle on rebuild.

### Tier 1 — chrome & celebrations

- `engine/styles/motion.css` (new, imported by `engine/core/app.js`): phase
  content entrance stagger (capped at 8 children), section-header icon
  land/float + underline draw-in, button/card/option micro-interactions,
  streak-flame flicker, star glow, phase-complete shine sweep and badge
  stamp-in. All rules scoped under `.app` (cssCodeSplit:false leak guard) and
  wrapped in `@media (prefers-reduced-motion: no-preference)`.
- `engine/engagement/engagement.js`: `sparkleBurst()` on correct answers,
  `flyXPOrbs()` on phase complete (orbs fly to the streak display). Both
  gated by a `matchMedia("(prefers-reduced-motion: reduce)")` check.

### Tier 2 — math that moves (per-component, styles in each component's

id-guarded injected `<style>`)

- `step-solver.js`: self-writing step reveal (typewriter, SR-safe twin text,
  ~900ms cap) + highlight sweep.
- `fraction-bars.js`: liquid fill stagger + readout pop; bars draw in on mount.
- `factor-tree.js` / `factor-tree-fill.js`: branches grow in with spring ease,
  connectors fade after children land, prime tags pop.
- `number-line.js`: line draws in, ticks stagger, markers spring to placement
  with snap pulse.
- `bar-model.js`: segments draw in left-to-right, smooth width transitions.

## Constraints honored

- Pure CSS/vanilla JS, zero dependencies, self-contained (no CDN).
- `prefers-reduced-motion` disables everything (CSS media query + JS guards).
- No timed pressure mechanics; animations never block or delay input.
- Behavior-preserving: grading, state, save/resume untouched.

## Out of scope (parked)

Companion character, journey-map nav, ambient unit-themed backgrounds.

## Verification

`node --check` + Biome per file, `npm run build`, `npm run validate`,
Playwright smoke of a built lesson (visual + console-error check, including a
reduced-motion pass).
