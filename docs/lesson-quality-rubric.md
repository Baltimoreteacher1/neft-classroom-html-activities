# Lesson Quality Rubric (Publisher / Ed-Developer Critique Standard)

Durable checklist for auditing `lessons/<unit>/config.json` content. Reused across audit
waves — update this file when new criteria emerge instead of writing one-off checklists.
Config schema reference: `lessonId, standard, unit, lesson, title, projects, theme,
contentObjective, languageObjective, noticeAndWonder, revealWordProblem, turnAndTalk,
vocabulary, launch, explore, practice{optional,approaching,onLevel,extending,commonMistake},
connect, reflect, readiness, googleForms, printables, graphicNovel`.

Score each unit 1 (missing/weak) – 3 (solid) – 5 (exemplary) per dimension. Anything
scoring ≤2 is a finding. Log findings in `docs/lesson-audit-log.md`.

## 1. Standards Rigor & Alignment

- Does `contentObjective`/`languageObjective` match the stated `standard` precisely (not just topically adjacent)?
- Is the `revealWordProblem` genuinely McGraw-Hill Reveal Math-aligned in structure (Notice/Wonder → concept → apply), not a generic word problem bolted on?
- Does the lesson build the _specific_ skill named by the standard, or a nearby-but-different skill?

## 2. Cognitive Rigor / Depth of Knowledge (DOK)

- Does `practice` span DOK levels: `approaching` (DOK1-2 recall/procedure), `onLevel` (DOK2 application), `extending` (DOK3 strategic thinking/justification)?
- Is there at least one non-routine, multi-step, or open-ended item per lesson (not all items answerable by pattern-matching)?
- Does `connect` require synthesis/transfer, or is it a restatement of `explore`?

## 3. Scaffolding Tiers (L0 / L1 / L2)

- Is there a genuine complexity gradient across `practice.approaching → onLevel → extending`, not just more numbers?
- Does `commonMistake` name a _real_, specific misconception (not a generic "check your work")?
- Are `turnAndTalk` `stems`/`wordBank`/`listenFor` fields populated with content that actually scaffolds academic language for a language learner — not filler?

## 4. Engagement & Creativity (Ed-Developer Lens)

- Is `launch.narrative`/`conceptIntro` a genuine hook (real-world stakes, curiosity, story) or a bland topic sentence?
- Does `theme`/`themeEmoji` actually carry through the lesson, or is it cosmetic on one screen?
- Would a student _want_ to do this activity, or does it read as worksheet-in-HTML-clothing?
- Is `practice.optionalActivity` a real differentiated task, not a copy of onLevel with a new name?

## 5. Misconception Anticipation

- Does `explore.discourse`/`connect.keywords` surface the misconception the standard is known to produce (not just correct-path content)?
- Is the wrong answer in `reflect.exitTicket.choices` a plausible _diagnostic_ distractor (reveals a specific error), not a random wrong number?
- Does `reflect.exitTicket.explanation` explain _why_ the correct answer is correct in terms a student who got it wrong would understand?

## 6. Vocabulary & Language Support

- Does every `vocabulary` term have `termEs`/`definitionEs` (and Vi/Ar where present) that are accurate translations, not machine-garbled?
- Is `visual` present and pedagogically useful (not decorative) for every term?
- Does `cloze`/`examples` actually use the term in the lesson's own math context?

## 7. Assessment Validity

- Does `reflect.exitTicket` actually measure the `contentObjective`, or a tangential fact?
- Is `correctIndex` verified correct (arithmetic/algebra checked, not just plausible)?
- Do `googleForms` (notes/practice/quiz) exist and align to the same objective?

## 8. Accessibility & Universal Design

- Is `noticeAndWonder.image`/`launch.contextImage` described well enough for alt text (not just a filename)?
- Are `explore.rows`/`editableCells` structured for screen-reader/keyboard use (table semantics, not layout hacks)?
- Is reading level appropriate for grade 6 with L0/L1 support present where the lesson warrants it?

## 9. Coherence & Continuity

- Does `readiness` correctly bridge from the actual prerequisite skill (not a generic review)?
- Do `projects` links match this lesson's unit, and is `graphicNovel` correctly mapped to standard?
- Is `printables` complete (game/color-by-#/word-search/MCAP per lesson pattern) and standard-tagged correctly?

## Finding Severity

- **Critical**: wrong standard alignment, incorrect answer key, broken misconception distractor, missing translation for ESOL vocab.
- **Major**: missing DOK-3 extension, generic/copy-paste narrative, weak common-mistake, thin scaffolding gradient.
- **Minor**: polish — narrative could be punchier, an extra real-world hook, an additional example.

## Engine-Level vs Per-Unit Fix

Before fixing content, check: does this finding recur across many units in the same way?
If yes, it's a **schema/engine gap** (e.g., a config field the renderer doesn't support yet,
or a field the generators silently ignore) — fix once in `lesson-renderer.js` / schema /
shared assets so all current and future lessons inherit it. Only fix in a unit's
`config.json` when the issue is specific to that lesson's content.
