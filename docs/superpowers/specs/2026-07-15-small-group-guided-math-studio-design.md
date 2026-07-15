# Small-Group Guided Math Studio Design

## Goal

Turn all 128 small-group lesson variants into short, coherent, publisher-ready guided math experiences while keeping every variant directly beneath its corresponding main lesson in the curriculum dropdown.

## Information architecture

- The curriculum order is canonical: main lesson, Group 1 (Extra Support), Group 2 (Challenge), then any catch-up resource.
- Small-group entries remain indented sibling dropdowns so teachers can see and open them without first opening the main lesson.
- A deterministic validator checks all 64 parent lessons, both variants, page/config existence, titles, links, and ordering.

## Student experience

Each small-group lesson follows a four-part studio rhythm designed for 15–20 minutes:

1. **Launch:** a lesson-specific mission brief, optional source visual, read-aloud control, and private readiness check.
2. **Build:** a concise I Do / We Do / You Do sequence plus an interactive multilingual vocabulary lab.
3. **Team:** a timed, role-based math talk using the lesson's own question, sentence frames, and word bank, followed by scaffolded interactive practice.
4. **Show it:** the aligned exit ticket and a before/after growth reflection.

Group 1 emphasizes reassurance, models, word banks, retryable steps, and teacher-guided language. Group 2 emphasizes productive struggle, justification, counterexamples, and skeptic/evidence roles. Neither path uses public scores or speed as a proxy for learning.

## Accessibility, language, and privacy

- Atkinson Hyperlegible and Nunito provide readable student typography; controls meet touch-size and contrast requirements.
- All interactions are keyboard operable, have visible focus, and expose status through polite live regions.
- Reduced-motion and print modes are first-class.
- Existing English, Spanish, Vietnamese, and Arabic vocabulary fields are surfaced only when present; no translations are invented.
- Student writing and confidence choices stay in the page/local save-resume system. No names, analytics, network submission, or new storage service is added.
- Wrong answers receive retry and scaffold prompts. Student screens do not reveal or embed a teacher answer-key panel.

## Architecture

- `engine/core/small-group-ui.js` owns shared DOM helpers, safe text rendering, theme tokens, celebration, and scoped style injection.
- `engine/core/small-group-engagement.js` owns mission, vocabulary, math-talk, timer, readiness, and reflection interactions.
- `engine/core/small-group-renderer.js` remains the composition and math-practice engine. It imports the two focused modules and stays below the repository hard file-size cap.
- Existing lesson configs remain the content source of truth. No duplicated lesson text is introduced.
- `tools/validate-small-group-lessons.mjs` enforces hierarchy and content invariants; `package.json` exposes it as `validate:small-groups` and includes it in the full validation chain.

## Failure behavior

- Missing optional visuals, translations, talk prompts, or browser speech support degrade cleanly without blocking the lesson.
- The timer remains usable without audio and announces its final state visually.
- A missing required config, parent link, variant pair, or lesson route fails validation with the exact lesson ID.

## Verification

- Syntax-check all new and modified modules.
- Run the small-group generator in dry mode and the new invariant validator.
- Run focused browser tests at desktop, Chromebook/tablet, and phone sizes for both Group 1 and Group 2.
- Run repository check, test, validation, and production build gates before shipping.
- Deploy only through the repository's guarded `ALLOW_DEPLOY=1 npm run ship -- <sha>` flow and verify the live build stamp and representative production routes.
