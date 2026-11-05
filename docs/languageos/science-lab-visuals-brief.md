# Science Investigation Lab: visual and interactive build brief

Joel, 2026-11-05: "it needs a lot of visuals (especially in the science) and the steps should be interactive (and actually
showing what is happening)". Today every stage is a text card and a form. This brief turns each stage into an illustrated,
hands-on step where the learner sees the investigation happen, while the language work (the checks, the ledger, the help
rules) stays exactly as it is.

## What does not change

- Engine and content: `src/lang/science-lab*.js`, `src/content/science-lab*.js`. Read them; do not edit them. If a visual
  needs data the case does not have, derive it in the view layer from the case data, never by inventing numbers.
- Every hard rule in `docs/languageos/integration-contracts.md`: no scores, levels, percents, stars or grades; no timers,
  countdowns or student-visible time limits; no AI or network; recordings never stored; help never states an answer;
  opening any help marks the stage supported; English and Spanish for every label; no learner text in the ledger.
- Existing routes, state key and resume behaviour. Existing e2e assertions stay; extend, never weaken.

## Visual system

- New render-only modules under `access-practice-lab/src/views/`, names starting `science-lab-scene` (for example
  `science-lab-scene.js` for shared parts, `science-lab-scene-ice.js`, `science-lab-scene-soil.js`). They return inline SVG
  strings from case data plus learner state. No image files, no external assets, no canvas, no libraries.
- One scene family per phenomenon, chosen from the case `id` (ice-cover, ice-cover-transfer = cocoa cups, soil-sprout,
  soil-sprout-transfer = lettuce on window or corner shelf), with a generic lab-bench fallback for any unknown case id.
- Original, warm, illustrated style that matches the lab design tokens in `ds.css` / `DESIGN-SYSTEM.md` (rounded shapes,
  the lab palette, readable labels). Every SVG has `role="img"`, a `<title>`, and a text equivalent of what it shows
  (values included) next to or inside it. Colour is never the only signal; label conditions in text too.
- Motion: CSS animations in a new `science-lab-scenes.css` (hand-add its `<link>` to `index.html`, then run
  `node tools/sync-access-shell.mjs`). Under `prefers-reduced-motion: reduce` there is no animation: show the start and end
  frames side by side, or a "next frame" button. Animations are a time-lapse of the experiment, never a countdown: no
  ticking clock text, no "time left", nothing the learner races against.
- Determinism: what a scene shows comes from the case dataset (for example, how long the ice lasted under a cover sets
  how far through the melt that cup's animation goes relative to the others). No randomness.

## Stage by stage (what the learner sees and does)

1. Hub: an illustrated hero of the investigation and the 12 stages as a visual trail of icons with status. The help
   chooser stays first and unchanged.
2. notice: a large illustrated scene of the phenomenon. Hotspots (real buttons) on parts of the scene open short,
   neutral observations the learner can add as "I notice" or "I wonder" chips into the frames. Observations describe what
   is visible; they never give the answer.
3. question: variable cards drawn as objects (the covers, the layer counts, the measure). The learner taps one to place it
   in a "what we change" slot and the measure in "what we measure"; a sentence skeleton lights up as they do. Then they
   write their own question (checkQuestion as now).
4. hypothesis: the learner predicts by ordering the conditions (tap to move cups up or down, keyboard operable). The
   prediction is saved in the stage state and shown again next to the results in represent.
5. plan: an apparatus builder. Choosing what to change and what to keep the same updates a live SVG preview: the changed
   variable visibly differs across cups, the held variables are visibly identical and marked "kept the same", trials show
   repeated cups. checkPlan as now.
6. collect: the learner runs each condition. Running plays a time-lapse in the scene (ice shrinking to a puddle under its
   cover; cocoa steam fading; a bean seed splitting and sprouting; lettuce growing toward or away from light), then the
   measured value from that dataset row appears as a data card and joins a data table. Repeated conditions are visible as
   a second trial with its own value.
7. represent: an interactive bar chart. The learner sets each bar from their data (accessible range or number input,
   snaps to the data) and sees it grow; mismatches with the table are pointed out as a question. Their hypothesis order is
   shown beside the result order. Then one sentence about the chart (as now).
8. claim: the chart stays visible; tapping two bars puts those conditions into a comparison that frames the claim.
9. evidence: tapping bars or table rows selects evidence; selected rows highlight on both the chart and the table.
10. reasoning: a claim, evidence, reasoning diagram: the claim card, the chosen evidence cards and the learner's reasoning
    text joined by drawn connectors, filled from their own work.
11. revise: an illustrated lab partner raises the counter-question; the learner's before and after are shown with changed
    words highlighted.
12. present: a poster preview assembled from their own claim, chart and evidence, with the typed transcript and the
    optional in-memory recording (never stored) as now.
13. reflect: a recap strip of their own artefacts from each stage, with the reflection prompts.
14. transfer: the new phenomenon's scene and its data, all help closed, as now.

## Quality bar

- Looks like a finished product at 375px and 1440px: take Playwright screenshots of every stage at both widths and look at
  them (Read the PNG). Fix anything cramped, clipped, overlapping, blank or unreadable before reporting.
- Keyboard: every interactive piece is a real button or input, focus visible, operable without a pointer.
- Accessibility: axe WCAG 2.2 AA zero violations at both widths; each scene has a text equivalent; no horizontal overflow.
- Performance: no layout thrash; the SVG for a stage stays reasonable (no thousands of nodes).
- Files stay under about 500 lines each; split by scene family or stage group.
