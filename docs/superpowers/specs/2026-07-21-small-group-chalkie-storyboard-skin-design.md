# Small-Group Chalkie Storyboard Skin

**Date:** 2026-07-21  
**Status:** Implemented (presentation layer)  
**Approach:** Skin + scene motion layer on the shared small-group renderer  
**Reference look:** Chalkie-like illustrated classroom storyboard (animated), not arcade/game FX

## Outcome

Upgrade the visual and motion presentation of every small-group lesson (group1, group2, catch-up) so it feels closer to a polished Chalkie lesson storyboard: theme art, short scene animations, and richer feedback juice — while keeping **identical content, section flow, interactive features, Save/Resume behavior, and teacher/student mode**.

Publisher ask: animation/graphics upgrades. Product constraint from Joel: “C but make sure all of the content, flow, etc. stays the same as well as the interactive features.”

## Non-negotiable contracts

1. **No content changes.** `lessons/*-{group1,group2,catchup}/config.json` stems, prompts, answers, practice items, labs, vocab text, and objectives stay as-is for this workstream (unless a separate content task is opened).
2. **No flow changes.** Section order remains: sticky rail → hero → mode → teacher details → mission → talk → vocab → explore → model → build → apply → practice → innovation → reflect.
3. **No interactive contract changes.** Existing manipulatives, practice types, hint ladders, cloze, timers, consensus/prove-it, and Save/Resume keys (`nt-sg:<lessonId>`) keep working with the same APIs and student affordances.
4. **No new gates.** Scene motion may decorate a section; it must never block the next step behind a dismissible overlay or timed lock.
5. **Accessibility.** Every animation honors `prefers-reduced-motion: reduce` (instant final state, no continuous motion). Touch targets, contrast, and readable type stay at current floors or better.
6. **Chromebook-safe.** Prefer CSS transforms/opacity and lightweight SVG; do not pull Framer/GSAP/Lottie/Three.js into small-group pages. Cap particle bursts (existing celebrate pattern).

## Architecture

### Presentation layer only

All upgrades live in the shared engine surface so regenerated 3-file lesson stubs do not need hand edits:

| Area | Primary files |
|------|----------------|
| Styles / tokens / keyframes | `engine/core/small-group-ui.js` (injected stylesheet), optionally `assets/small-group-storyboard.css` if the inline block grows too large |
| Theme art wiring | `engine/core/theme-illustrations.js` (existing) called from small-group mission/hero render paths |
| Mission / engagement visuals | `engine/core/small-group-engagement.js` |
| Lab mount flourishes | `engine/core/small-group-labs.js` (CSS class hooks only; manipulative APIs unchanged) |
| Practice / build juice | `engine/core/small-group-practice.js`, build stepper in renderer/ui |
| Static figure scenes | `engine/core/visual-figures.js` (additive animation-friendly markup/classes; same figure data) |

**Out of band for this spec:** curriculum hub redesign, flagship template, game-fx injector, printable packets, content regeneration, publisher practice-item count work (already covered by `2026-07-16-small-group-publisher-redesign.md`).

### How scenes attach

Each existing section root gets optional CSS hooks, e.g. `data-sg-scene="mission"`. On first paint / intersection, a one-shot class (`is-scene-in`) plays the enter animation. Reduced-motion skips to the settled state.

Math figures (factor tree, number line chips, tape bars, etc.) gain optional “scene” variants: same numbers/labels, branches/chips animate into place once. Interactives that students manipulate do **not** get replaced — only idle intro flourishes and success pulses.

## Scene inventory (locked)

| Section | Keeps | Adds |
|---------|-------|------|
| Hero | Title, kicker, objectives, variant colors | Theme SVG float; soft bloom |
| Mission | Context copy; existing visual/data-chips | Theme art; figure scene (e.g. tree grow, chips land) |
| Talk | Frames, timer, prompts | Card enter stagger |
| Vocab | Language lanes, defs, cloze | Fill illustration slot; picture fade-in |
| Explore / Model / Apply labs | Same components & controls | Mount flourish; success pulse |
| Build stepper | I-do / We-do / You-do | Step reveal motion |
| Practice | Item types, hints, feedback | Richer correct/wrong juice (CSS; celebrate stays deterministic) |
| Innovation / Reflect | Existing labs & exit ticket | Short completion beat — not a new screen |

## Visual language

- **Tone:** Chalkie classroom storyboard — illustrated, clear hierarchy, lightly theatrical. Not game HUD, not purple neon, not newspaper/broadsheet.
- **Preserve:** Nunito + Atkinson Hyperlegible; group1 blue / group2 amber / catch-up teal variant tokens; cream/dot-grid paper; 18px card radii; touch-safe controls.
- **Theme art:** Reuse `THEME_SVGS` / `renderThemeIllustration()` from parent lessons so small-group and core lessons share the same illustration system.
- **Motion budget:** Short (≈0.25–0.8s), transform/opacity first, one-shot on enter; continuous motion limited to gentle hero float and progress shimmer already in the system.

## Error handling / fallbacks

- Missing theme key → keep current emoji / data-chip visual (no blank hole).
- Missing vocab image → existing category fallback path; still animate the slot container, not a broken image.
- Unsupported figure kind for scene variant → render static figure as today.
- Reduced motion → no enter animation, no float, confetti/celebrate collapses to a non-animated success state (or existing reduced path).

## Rollout

1. Implement in shared renderer + CSS.
2. Smoke on three anchors: `lessons/1-1-group1/` (space-station / factor tree), one group2, one catch-up.
3. Spot-check `prefers-reduced-motion` and a narrow Chromebook-like viewport.
4. Run `npm run validate` after implementation. If only engine CSS/JS for small-group changed, still prefer full `validate` so Save/Resume and injection balance stay green.
5. No lesson folder regeneration required unless a generator template must emit a new CSS link (prefer engine-injected styles to avoid regen).

## Verification checklist

- [ ] Mission/hero shows theme SVG when theme is known (not emoji-only).
- [ ] Section order and all interactive controls match pre-change behavior.
- [ ] Save/Resume still restores progress under `nt-sg:<lessonId>`.
- [ ] Factor-tree (and other) scene animations play once then settle; student can still use labs immediately.
- [ ] `prefers-reduced-motion: reduce` disables continuous and enter motion.
- [ ] No new overlay gates progress.
- [ ] `npm run validate` passes for touched surfaces.

## Success criteria (publisher-facing)

A reviewer opening a small-group lesson should see: illustrated mission, motion that “tells” the math figure, filled vocab pictures, and lively but school-safe feedback — while teaching the same lesson with the same clicks as before.

## Decisions locked by Joel

- Focus: illustrations + motion + interactive math visual polish (all lanes).
- Direction: Approach **C** animated storyboard.
- Constraint: same content, flow, interactives.
- Implementation approach: **#2 Skin + scene motion layer** (not safer skin-only, not flagship overlay shell).
- Remaining taste calls: agent discretion (this document).
