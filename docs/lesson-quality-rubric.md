# Lesson Quality Rubric (Publisher / Ed-Developer Critique Standard)

Durable checklist for auditing `lessons/<unit>/config.json` content. Reused across
audit waves — when a new criterion emerges, add it here rather than writing a
one-off checklist.

Config schema: `lessonId, standard, unit, lesson, title, projects, theme,
contentObjective, languageObjective, noticeAndWonder, revealWordProblem,
turnAndTalk, vocabulary, launch, explore,
practice{optional,approaching,onLevel,extending,commonMistake}, connect, reflect,
readiness, googleForms, printables, graphicNovel`.

Score each unit per dimension: 1 (missing/weak), 3 (solid), 5 (exemplary).
Anything ≤2 is a finding. Log findings in `docs/lesson-audit-log.md`.

## 1. Standards rigor and alignment

- Do `contentObjective`/`languageObjective` match the stated `standard` precisely, not just topically?
- Is `revealWordProblem` genuinely Reveal Math–aligned in structure (Notice/Wonder → concept → apply), or a generic word problem bolted on?
- Does the lesson build the _specific_ skill the standard names, or a nearby-but-different one?

## 2. Cognitive rigor / depth of knowledge

- Does `practice` span DOK levels — `approaching` (DOK 1–2, recall/procedure), `onLevel` (DOK 2, application), `extending` (DOK 3, strategic thinking and justification)?
- Is at least one item non-routine, multi-step, or open-ended, rather than answerable by pattern-matching?
- Does `connect` require synthesis or transfer, or does it restate `explore`?

## 3. Scaffolding tiers (L0 / L1 / L2)

- Is there a real complexity gradient across `practice.approaching → onLevel → extending`, not just bigger numbers?
- Does `commonMistake` name a specific, real misconception rather than "check your work"?
- Do `turnAndTalk` `stems`/`wordBank`/`listenFor` actually scaffold academic language for a language learner, or are they filler?

## 4. Engagement and creativity (ed-developer lens)

- Is `launch.narrative`/`conceptIntro` a genuine hook — real-world stakes, curiosity, story — or a bland topic sentence?
- Does `theme`/`themeEmoji` carry through the lesson, or is it cosmetic on one screen?
- Would a student _want_ to do this, or does it read as a worksheet in HTML clothing?
- Is `practice.optionalActivity` a real differentiated task, or `onLevel` renamed?

## 5. Misconception anticipation

- Does `explore.discourse`/`connect.keywords` surface the misconception this standard is known to produce, not just the correct path?
- Is each wrong answer in `reflect.exitTicket.choices` a plausible _diagnostic_ distractor that reveals a specific error, rather than a random wrong number?
- Does `reflect.exitTicket.explanation` explain _why_ the correct answer is correct, in terms a student who missed it would follow?

## 6. Vocabulary and language support

- Does every `vocabulary` term have accurate `termEs`/`definitionEs` (and Vi/Ar where present), not machine-garbled text?
- Is `visual` present and pedagogically useful — not decorative — for every term?
- Do `cloze`/`examples` use the term in this lesson's own math context?

## 7. Assessment validity

- Does `reflect.exitTicket` measure the `contentObjective`, or a tangential fact?
- Is `correctIndex` verified by recomputing the arithmetic, not just judged plausible?
- Do the `googleForms` (notes, practice, quiz) exist and align to the same objective?

## 8. Accessibility and universal design

- Is `noticeAndWonder.image`/`launch.contextImage` described well enough to write alt text from, rather than a bare filename?
- Are `explore.rows`/`editableCells` built with real table semantics for screen-reader and keyboard use, not layout hacks?
- Is the reading level right for grade 6, with L0/L1 support present where the lesson warrants it?

## 9. Coherence and continuity

- Does `readiness` bridge from the actual prerequisite skill, not a generic review?
- Do `projects` links match this lesson's unit, and is `graphicNovel` mapped to the right standard?
- Is `printables` complete (game / color-by-number / word search / MCAP per the lesson pattern) and correctly standard-tagged?

## Finding severity

- **Critical** — wrong standard alignment, incorrect answer key, broken misconception distractor, missing ESOL vocabulary translation.
- **Major** — missing DOK-3 extension, generic or copy-paste narrative, weak common-mistake, thin scaffolding gradient.
- **Minor** — polish: a punchier narrative, an extra real-world hook, one more example.

## Engine-level vs per-unit fix

Before fixing content, ask whether the finding recurs across many units in the same
way. If it does, it is a schema or engine gap — a config field the renderer does not
support yet, or one the generators silently ignore — and it belongs in
`lesson-renderer.js`, the schema, or the shared assets, fixed once so every current
and future lesson inherits it. Fix a unit's `config.json` only when the issue is
specific to that lesson's content.
