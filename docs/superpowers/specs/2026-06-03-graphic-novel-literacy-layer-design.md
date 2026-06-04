# Graphic-Novel Literacy Layer — Design Spec

**Date:** 2026-06-03
**Repo:** `neft-classroom-html-activities` · engine at `graphic-novels/_engine/`
**Author/owner:** Joel (Grade 6 math, BCPS, Reveal Math; ESOL + multi-level students)

## 1. Summary

Extend the shared graphic-novel engine (24 novels: 10 units × Support/Enrichment +
4 lesson novels) into a **literacy + interactivity layer**: a richer, built-out
story; **reading-comprehension questions** woven into the narrative; and a set of
**interactive features** — all scored so reading and math both flow into the
teacher results pipeline. One engine change re-skins/extends all novels.

The bar: **publisher-grade.** A teacher or administrator should not be able to
tell these apart from a Pearson/Savvas (myView/myWorld) or HMH (Into Reading /
Into Math) published product.

## 2. Quality bar (publisher-grade) — primary requirement

Everything below must meet the standard of a major published curriculum:

- **Reading-program conventions:** each comprehension item presents like a real
  program — a clear skill label ("Cite Text Evidence", "Determine Main Idea"),
  the **standard** (RL.6.1, RI.6.2…), and a **DOK level**; text-dependent
  questions that send students back to the panel/passage; an answer rationale.
- **Typography & layout:** consistent type scale, generous spacing, restrained
  professional palette, aligned grids — no "homemade worksheet" feel. The comic
  panels, character art, and reading apparatus share one design system.
- **Consistent characters & art:** the illustrated cast (already generated) is
  used coherently; expressions/poses added as needed read as one art direction.
- **Accessibility (publisher requirement):** WCAG 2.1 AA, full keyboard nav,
  screen-reader labels, resizable text, reduced-motion, 320px reflow, 48px
  targets, read-aloud.
- **Print-ready:** a clean print stylesheet so any novel (and the notebook)
  prints like a published consumable page.
- **Leveling:** Level 1 (Support) and Level 2 (Enrichment) — never labeled
  "ESOL"; Spanish support present where the source has it.

## 3. Scope & decomposition

Three sub-projects, built in order. **This spec covers Sub-project 1 only.**

- **SP1 — Platform** (this spec): engine + data-model extensions, interaction
  registry + 4 starter interactions, read-aloud, notebook, **dual Math/Reading
  scoring**, publisher-grade design system. Proven on **Unit 1** as the reference
  build, deployed.
- **SP2 — Content** (own spec/plan): expand every novel's story and author the
  comprehension questions to fit (all 7 skills, distributed by beat + level)
  across 24 novels, via subagents. Begins after SP1 is accepted.
- **SP3 — More features** (future): character reactions, badges/stamps,
  page-turn motion — added through the registry from SP1.

## 4. Pedagogical design

**Seven comprehension skills**, all used, distributed to fit each story moment
and scaled by level (kept accessible — text-supported, Grade-6/ESOL-friendly):

| Skill                   | Example stem                                   | Std (typical)  | DOK |
| ----------------------- | ---------------------------------------------- | -------------- | --- |
| Vocabulary in context   | "In this panel, _prime_ means…"                | L.6.4 / RI.6.4 | 1–2 |
| Main idea / gist        | "What is the Cadet mainly trying to do here?"  | RI.6.2         | 2   |
| Key details             | "How many fuel cells did the engine need?"     | RI.6.1         | 1   |
| Sequence & cause/effect | "What happened _because_ the airlock opened?"  | RI.6.3         | 2   |
| Inference               | "Why did AXIS guess wrong?"                    | RL.6.1         | 3   |
| Cite text evidence      | "Tap the line that proves the door is locked." | RL.6.1         | 3   |
| Prediction              | "What will the Cadet need to do next?"         | RL.6.3         | 2–3 |

- **Leveling:** Level 1 emphasizes vocab / main idea / key details / sequence;
  Level 2 adds inference / cite-evidence / prediction. The engine selects per
  `meta.level`, but SP2 authoring decides the exact placement per story.
- **ESOL scaffolds:** every item supports a sentence frame and read-aloud; EN+ES
  where present; distractors are plausible, not tricky.

## 5. Story-data format extensions (backward-compatible)

New, additive fields on the existing `STORY` schema (`story.schema.md`):

```js
meta: {
  …existing…,
  standard: "6.NS.4",          // math standard (existing)
  readingStandard: "RL.6.1",   // NEW: default reading rollup standard
}

// NEW step type, sibling of "challenge":
{ type: "comprehension",
  id: "c1", skill: "main_idea", standard: "RI.6.2", dok: 2,
  ask: { who: "narrator", en: "…", es: "…" },     // the question (voiced/captioned)
  passageRef: "act1.beat2",   // optional: which beat/panel it points back to
  interaction: "mc",          // "mc" | "evidence" | "sequence"  (default "mc")
  choices: [ { en, es?, correct } ],              // for mc / evidence
  items:   [ { en, es?, order } ],                // for sequence
  hint, frame, goodEn/Es, badEn/Es }
```

- `interaction` lets a comprehension OR challenge step use a richer input than
  multiple choice. Default `"mc"` = today's behavior (no migration needed).
- All existing novels keep working unchanged; comprehension is opt-in per story.

## 6. Dual scoring & results integration

Today the bottom `nt-results` tracker counts every `.choices` group as one
"Story Challenges" score. We split it:

- Math challenge groups: unchanged scoring.
- Comprehension groups render with `data-score-group="reading"` and a
  `data-standard` attribute.
- The tracker reports **two sections** in one `NTResults.finish` call:
  `[{name:"Math", standard: mathStd, correct, total},
  {name:"Reading Comprehension", standard: readingStd, correct, total}]`,
  preserving the existing math section exactly (no regression).
- This flows through the **existing results pipeline → EduPulse gradebook**
  bridge already wired into graded activities, so the Reading score appears
  alongside Math per student/standard with **no parallel system**.
- Interaction-based items (`evidence`, `sequence`) still expose a `.choices`-
  compatible scored result (a hidden `.choice.correct` marker on solve) so the
  tracker contract is honored without special-casing.

## 7. Interaction registry + starter interactions

A small registry in the engine so features plug in without touching core flow:

```js
INTERACTIONS["sequence"] = { render(step, host, onSolve), };
INTERACTIONS["evidence"] = { render(step, host, panelEl, onSolve), };
// each renders its UI, judges correctness, and on success drops the
// .choices/.choice.correct marker + calls onSolve (engine advances as today).
```

**The four starter features (SP1):**

1. **Read-aloud (text-to-speech).** A 🔊 control on every bubble, passage, and
   question. Uses the Web Speech API (`speechSynthesis`) — offline, no assets;
   picks an EN or ES voice from the text language. Per-element and "play all".
   Honors reduced-motion / can be disabled.
2. **Evidence highlighter.** For cite-evidence items, lines/regions of the panel
   become tappable targets; selecting the proving one scores. Keyboard-navigable.
3. **Drag-to-sequence.** Reorderable cards (pointer + keyboard reorder); correct
   order scores. Used for sequence/cause-effect.
4. **Reading/Math notebook.** Auto-collects each answer + any sentence-frame
   writing into a printable "My Reading + Math Log" (student_ref only, no PII),
   matching the print stylesheet.

## 8. Extensibility seam

- `INTERACTIONS` registry (above) for new input types.
- A `FEATURES` hook list the engine calls at defined lifecycle points
  (onBeat, onSolve, onComplete) so SP3 features (character reactions, badges,
  motion) register without editing core. Each feature is self-contained and
  removable.

## 9. Non-functional requirements

- **Offline, single-file** per novel (engine inlined; read-aloud uses the
  built-in browser API; no network).
- **No PII** — student_ref only, consistent with the results/EduPulse contract.
- **Accessibility** per §2.
- **Print stylesheet** for novel pages + notebook.
- **Preserve** all existing content, math, Spanish, glossary, master-rank,
  scoring contract, and the comic/character visual system.

## 10. Build sequence (SP1)

1. Extend `story.schema.md`, `gn-engine.js`, `gn-engine.css`, `validate.cjs`.
2. Build the interaction registry + 4 starter features.
3. Wire dual scoring into the tracker template (`build.py`) + verify EduPulse
   receives a Reading section.
4. Expand **Unit 1 #1 + #2** story and author comprehension items across all 7
   skills/3 interactions as the **reference build**.
5. Verify: offline, mobile (320px), keyboard, read-aloud (EN+ES), print, and
   that the results pipeline records **separate Math + Reading** scores.
6. Deploy via wrangler; confirm live.
7. Hand to SP2 for content scale-out.

## 11. Risks & constraints

- **Concurrent automation** moves `main` mid-session — commit to a branch,
  cherry-pick by SHA, verify before push (known repo behavior).
- **Scoring contract** is load-bearing (EduPulse + nt-results) — extend
  additively; never rename `.choices`/`.choice.correct`/`#choicesComplete` or
  break the existing Math section.
- **Engine size** — keep new features in registry modules so core stays legible.
- **Read-aloud voice availability** varies by device — degrade gracefully
  (hide the control if no voice; never block).

## 12. Out of scope (SP1)

- Authoring expanded story/questions for all 24 novels (that is SP2).
- Character expression art generation, badges, page-turn motion (SP3).
- Any change to the curriculum/lesson hubs beyond what links the novels.

## 13. Acceptance criteria (SP1)

- New `comprehension` step + `interaction` types render, score, and are
  keyboard/AA-accessible; `mc` default unchanged for existing novels.
- Unit 1 #1 and #2 carry expanded story + all 7 comprehension skills + the 3
  interaction types, and read like a published reading-program page.
- Results pipeline records **separate Math and Reading** scores (verified into
  EduPulse) with no regression to existing math tracking.
- Read-aloud (EN+ES), notebook (print), offline, and 320px all verified.
- Deployed live; `validate.cjs` extended and green.
