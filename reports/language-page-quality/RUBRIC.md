# Language Page activity-quality rubric (A to K)

One scoring scale for every activity family on The Language Page, used for the baseline (`baseline-scores.json`)
and for each area agent's `scoresAfter`. Weights live in `rubric.json` and are read by `tools/assemble-report.mjs`.
Weights follow the mission order: instructional quality, then content quality, clarity, interaction, feedback,
accessibility, visual polish.

## Scoring rules (apply to every score)

1. Scores are integers 1 to 5. Half points are not allowed.
2. Every score needs a one-line `evidence` string naming what was measured or read (a file, a metric, a crawl result, a
   screenshot id). A score without evidence is invalid and the assembler lists it as "unsupported".
3. Mark the basis: `measured` (a script or crawl produced the number), `judged` (a person read real content or screens),
   or `mixed`. Judged scores must cite at least two concrete samples (ids or quoted fragments of fewer than 15 words).
4. A 5 needs verified evidence of the descriptor in the "after" run (tests, crawl, or screenshot). A change that has
   not been run in a browser cannot raise a score above 3 on F, G or I.
5. Do not average away a blocker. If any P0 defect exists in a family (cannot complete, wrong key, loses saved work,
   console error on load, keyboard trap), cap A, F, G and I at 2 for that family until fixed.
6. Score what a student meets first. If the family has several templates, score the weakest common template and list
   the others in `evidence`.
7. WIDA language: practice "modeled on" the WIDA framework, never "official". A/B/C are support choices, not levels.
   Do not reward a claim of alignment; reward visible, graduated supports.

## Dimensions and descriptors

### A. Visual design

- 1: Layout breaks (overflow at 390 px, overlap, unreadable contrast) on the main template.
- 2: Usable but cluttered; competing calls to action; inconsistent spacing or type.
- 3: Clean and consistent with the design system; no overflow at 390/768/1280; minor density issues.
- 4: Clear hierarchy, task is the visual focus, supports are visually secondary but findable.
- 5: Exemplary hierarchy and calm density at all three widths, verified in screenshots; no console errors.

### B. Writing and language quality

- 1: Errors, contradictions or machine-sounding text; duplicate or contradictory options.
- 2: Correct but bland, templated or very short; the same frame repeated across items.
- 3: Accurate, grade-appropriate, some variety; some generic stems.
- 4: Original, varied contexts and registers; vocabulary in context; controlled sentence complexity.
- 5: Authentic, voice-rich, age-respectful text with varied contexts (school, community, science, nature, sport, design,
  history, decisions); verified by a read of at least five items.

### C. Directions clarity

- 1: Student cannot tell what to do or what happens after "Check".
- 2: Directions wordy (over 28 words) or abstract; no example for a new interaction.
- 3: Directions direct and under 28 words; the action is clear; outcome after check is not stated.
- 4: States the goal, the action and what success looks like; one short example where the task is new.
- 5: Progressive disclosure (short direction, optional detail), model shown for new interactions, outcome stated.

### D. Engagement and authenticity

- 1: Decontextualised drill with no purpose.
- 2: Repeated stock contexts; low stakes; predictable.
- 3: Purposeful school contexts; some choice.
- 4: Real-world or real informational text, learner choice, a reason to care.
- 5: Authentic task with an audience or product, varied contexts, no extrinsic pressure (no streaks, timers, leaderboards).

### E. Instructional rigor

- 1: Tests recall of surface wording or has cluing that makes the answer guessable.
- 2: Single low-demand skill; distractors implausible.
- 3: Matches the stated objective; some higher-order items; plausible distractors.
- 4: Objective, text and task align; cognitive demand preserved with reduced language load, not reduced thinking.
- 5: Rigor is explicit (evidence, reasoning, language feature); supports fade; transfer item present.

### F. Interaction design

- 1: A state is missing or broken (cannot check, cannot retry, loses answer, drag-only).
- 2: Works but states are implicit: empty submit unexplained, no retry path, next step unclear.
- 3: START, ACTIVE, RESPONSE, FEEDBACK, NEXT work; empty submit handled; retry exists.
- 4: All states explicit and announced; scaffolded retry before reveal; non-drag alternative for every drag task.
- 5: All of 4, verified by the crawler state run and a keyboard-only pass; completion state summarises what was learned.

### G. Feedback quality

- 1: Bare "Correct" / "Try again", or feedback that contradicts the key.
- 2: Correct-answer feedback is specific, wrong-answer feedback is generic or missing for some items.
- 3: Most wrong options explain why; hint and support differ; retry offered.
- 4: Every wrong option explained with evidence or language feature; staged hint, then retry, then reveal.
- 5: Feedback names what was right, what to change and why, and how to improve the next attempt; honest criteria-based
  guidance for open responses (no invented scores or speech analysis).

### H. WIDA / ESOL scaffolding

- 1: No language supports; or supports state the answer.
- 2: Static supports (word bank, frames) shown to everyone, never fading.
- 3: Language-function tag, vocabulary with Spanish, frames; supports opt-in.
- 4: Graduated and fading supports across A/B/C and Beginning to Higher; EN/ES chrome complete.
- 5: Supports keyed to demonstrated need, listed in teacher notes, independent attempt remains scaffold-free.

### I. Accessibility (WCAG 2.2 AA)

- 1: Axe serious/critical violations on the main template, keyboard trap or no focus indicator.
- 2: No serious axe violations but controls under 24 px, unnamed buttons, or missing live-region announcements.
- 3: Axe clean; keyboard works; focus visible; most targets at least 44 px at 390 px.
- 4: All of 3, state changes announced, non-drag alternatives, audio has a transcript.
- 5: All of 4 verified at 200 percent zoom and reflow, reduced motion respected, touch targets at least 44 px.

### J. Age appropriateness

- 1: Content or tone clearly wrong for the band (infantilising or adult).
- 2: Some items off-band; cartoonish for 6-8 or too dense for K-2.
- 3: Appropriate; occasional register mismatch.
- 4: Respectful, specific and fitting to the band throughout.
- 5: Distinctive voice that students in the band would choose to read, verified against samples.

### K. Cross-template consistency

- 1: Same interaction behaves differently across pages; one-off implementations.
- 2: A shared template exists but many records bypass it.
- 3: Shared template used; small variations in labels or states.
- 4: Shared components and a validator guarantee the same states, labels and supports.
- 5: New content inherits quality through validators (a record that fails quality checks cannot ship).

## Overall score

`overall = sum(weight_k * score_k)` using `rubric.json` weights, rounded to 0.1. The overall score is a sort key,
not a result; the dimension scores and evidence are the finding. The report shows before, after and delta per family
and never fills a missing dimension.

## Fixed definitions used by the crawler and report

- Touch target: interactive element rendered at 390 px with min(width, height) under 44 px (WCAG 2.2 AA minimum is 24 px;
  the platform target is 44 px). Inline links inside running text are excluded.
- Horizontal overflow: `document.documentElement.scrollWidth > innerWidth + 1` after load, with offenders outside a
  scroll container listed.
- Axe tags: wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa. Serious means impact serious or critical.
- Console error: `console.error`, uncaught page error, or HTTP 4xx/5xx for a same-origin request. `web-vitals`
  specifier errors from `assets/nt-web-vitals.js` are a no-bundler static-server artifact and are excluded, as in every
  `tools/access-*-e2e.mjs`.
- Interaction state (activity pages): `feedback-shown` (at least six new words appear after Check),
  `terse-feedback` (fewer than six), `no-visible-feedback`, `no-check-button`.
