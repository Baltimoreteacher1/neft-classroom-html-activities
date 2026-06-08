# Lesson Slides Upgrade — Audit & Plan

## System map (source of truth → output)

- **Data:** `lessons/<id>/config.json` (74 lessons) — rich: `contentObjective`,
  `languageObjective`, `vocabulary[]` (term/termEs/definition/definitionEs/visual/
  cloze/examples[] with isExample+why), `launch`, `explore`, `practice`
  (approaching/onLevel/extending/optional, each with `type` incl. structured
  `error-analysis` = workedExample/errorStep/correctWork/hints), `connect`,
  `reflect.exitTicket`, `turnAndTalk[]`.
- **Mapper:** `scripts/generate-slides.mjs` (builds the slide `ctx` from config).
- **Template (reusable):** `scripts/lib/tpt-slide-deck-v3.mjs` (deck builder, ~40
  slides) + `scripts/lib/slide-reference-theme.mjs` (layouts + REFERENCE_CSS).
- **Output:** `lessons/<id>/slides.html` (regenerated; do NOT hand-edit).
- **Routes/structure untouched** — only template + regenerated output change.

## Existing structure (already strong — covers the required sequence)

Title → How-to → Learning targets → Agenda → Launch divider → Warm-up →
Notice/Wonder → Concept → I Do/We Do/You Do (reveals) → Vocab table + checks →
Turn&Talk → Explore (visual model + activity) → CFUs → Practice MC → unit
activity → Sort → Error Analysis → Choice Board → Think-Write → Workspace →
Differentiation → Partner → Connect → Closure divider → Exit ticket → Goal
tracker → Reflection → Activity/Family CTAs → Teacher notes → Answer key.

## Gaps found (quality, not structure)

1. **Error Analysis slide (worst):** used `practice.commonMistake` meta-text as
   the "scenario" and a hardcoded wrong `A = b × h = 70` as the student work.
   Ignored the real `error-analysis` problem (present in all 74 configs).
2. **Vocabulary:** `examples[]` (example/non-example with reasons, in 56/74
   configs) was never rendered. User explicitly wants example/non-example.
3. **Think-Write-Respond:** fully generic frames ("The key formula works
   because \_\_\_") — not lesson-specific.
4. **Choice Board:** fully generic options — didn't reference lesson vocab/concept.

## Fixes (all in reusable templates → benefit all 74 lessons, config-driven)

1. Rebuild Error Analysis from structured `error-analysis` data: real labeled
   worked steps, "find the error step" interaction, "The mistake was **_ because
   _**" frame, reveal of `correctWork`. Concept-derived fallback (never wrong math).
2. Add example/non-example chips to the Vocabulary slide from `examples[]`.
3. Lesson-aware TWR frames (Because/But/So + mistake-was + prove-correct) using
   concept key idea, vocab, and the real error.
4. Lesson-aware Choice Board weaving real vocab terms + concept; full menu
   (draw/model, explain, solve, create-a-problem, compare, teach-it).

Then: regenerate all → `npm run validate` → `npm run build` → spot-check → commit.
