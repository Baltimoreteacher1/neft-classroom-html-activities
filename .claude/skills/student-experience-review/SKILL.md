---
name: student-experience-review
description: Read when asked to review, check or judge what a student actually sees — how a lesson looks or behaves, whether an activity works, visual polish, print output, or "does this render right". Source review and passing validators do not answer these questions; this is how to drive the real page.
---

# Reviewing what the student sees

Every gate in this repo can be green while a lesson is unusable. The engine
stamps `data-iv-mounted` BEFORE running a component factory and swallows a
throw with a `console.warn`, so a dead manipulative parses, lints, serves 200,
and renders an empty box. **Open the page.**

## Getting a lesson on screen

```
npm run build                       # dist/ is what the gates and probes read
npm run preview -- --port 4499      # 4499 is the default the probes assume
```

A core or flagship lesson will not boot until the identity gate is satisfied —
this is the step that silently wastes an hour:

1. flagship only: click `.flagship-mission-start` (each theme words it
   differently — match the class, never the text)
2. fill `#id-name`, fill `#id-period`
3. click `#id-start`, then confirm `window.__ntLessonClearApi` exists
4. walk phases: `document.dispatchEvent(new CustomEvent("rma:navigate", {detail:{phase: n}}))` for n in 0..7
5. open the tabs: `rma:openextra` with `{kind: "vocab"}` then `{kind: "learn"}`

Small-group lessons render the whole thing on one page — nothing to navigate.

**The Learn It tool needs pacing.** Its host sits in `.vl-tool-block.vl-hidden`
and only mounts when the worked example is walked to its end. Click
`.vl-pace-all` / `.vl-pace-next`, then `.vl-next-btn` / `.vl-continue-btn`.
Snapshotting before that shows an unmounted host, which is indistinguishable
from a broken one — it condemned 60 healthy lessons.

## The gates that drive real pages

```
npm run validate:lesson-visuals   # 288 lessons booted, every visual asserted to RENDER
npm run audit:small-group-ux      # overflow + tap targets at two widths
npm run e2e:visual                # visual regression
npm run audit:a11y                # advisory ratchet, not a gate
```

The first two need the preview server running, and fail loudly rather than
vacuously if it is absent — that is correct behaviour, not a bug to route
around.

## What to actually look for

- **Does the activity give away its own answer?** Options in solution order, a
  worked example stating the result the question asks for.
- **Dead controls.** A button that renders but is wired to nothing.
- **NaN / undefined in a manipulative.** `/lessons/2-11/` once served a Decimal
  Columns lab with no operands, spelling "N a N" down the column — interactive,
  rendering, and passing every check that existed.
- **Print and export.** Printables strip interactivity by design; confirm what
  remains still teaches. Check figures in OS dark mode — they have rendered
  near-black before.
- **Narrow widths.** Tablet and phone overflow has shipped to production before.

## Comparing before and after

When a change could move the page, measure both renders rather than eyeballing:
capture `getBoundingClientRect()` plus computed font-size and colour for every
heading, paragraph, cell and button, and diff them.

**Always run a control**: load the SAME build twice and diff it against itself
first. Animated and randomised pages report dozens of moved boxes that have
nothing to do with your change — on one game, 46 of 161 boxes "moved" between
two identical loads.
