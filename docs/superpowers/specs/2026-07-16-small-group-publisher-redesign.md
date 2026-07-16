# Small-Group Publisher Redesign

## Outcome

Rebuild every Group 1 and Group 2 lesson as a student-ready instructional experience rather than a compressed copy of the core lesson. The result must feel like a polished intervention/enrichment product: visually clear, explicitly taught, interactive, language-accessible, and rich in original practice.

## Non-negotiable contracts

- Each small-group lesson has at least 12 parallel-practice problems whose stems do not duplicate the parent lesson’s practice stems.
- Guided Practice shows one large problem at a time with a large visual model, three or four short steps, fill-in fields, immediate feedback, optional read-aloud, and hints that reveal progressively.
- Independent and More Practice retain a problem-aligned visual or interactive math tool while gradually reducing step prompts.
- Every lesson exposes a prominent interactive manipulative aligned to its concept: factor model, number line, ratio table/bar model, coordinate grid, balance model, area/volume model, data display, or equivalent.
- Vocabulary cards show a dependable illustration before students reveal the meaning. Inline vocabulary popups show the same illustration, a loading state, and a visible fallback if an asset cannot load.
- Student text uses short directions, large type, high contrast, English/Spanish vocabulary support, sentence frames, and read-aloud controls. No teacher facilitation or answer-key presentation appears in Student Mode.
- Teacher facilitation remains available only through the authenticated teacher route.

## Architecture

### Parallel-practice content

`tools/lib/small-group-parallel-practice.mjs` will own deterministic, lesson-specific problem builders. Builders are keyed by lesson ID and concept family, calculate their own correct values, and emit a common schema:

```js
{
  id: "1-1-parallel-01",
  stem: "Build the prime factorization of 42.",
  type: "guided-fill",
  answer: "2 × 3 × 7",
  visual: { kind: "factor-tree", value: 42 },
  steps: [
    { prompt: "Start with 42 = 2 × ___.", answer: "21" },
    { prompt: "Then 21 = 3 × ___.", answer: "7" },
    { prompt: "Write only prime factors: ___.", answer: "2 × 3 × 7" }
  ],
  hints: ["Try the smallest prime factor first."],
  explanation: "42 = 2 × 21 = 2 × 3 × 7."
}
```

The generator writes these items into small-group configs and validates count, unique IDs, non-duplicated stems, answers, visuals, and steps.

### Student practice UI

`engine/core/small-group-visual-practice.js` will render the problem visual, interactive tool, read-aloud control, and guided fill-in sequence. `small-group-practice.js` remains responsible for answer checking, progress, pagination, and persistence, but delegates instructional support rendering to the focused module.

Group 1 receives all steps in Guided Practice, optional steps in Practice, and a compact tool in More Practice. Group 2 receives a concise launch prompt, optional tool access, error analysis, and justification prompts.

### Vocabulary visuals

The vocabulary resolver remains the single source of truth. Vocabulary cards and popups both consume it. Images reserve space while loading, report failures in an accessible status, and replace failures with a category illustration rather than an empty box.

## Error handling

- Missing practice metadata fails generation and validation rather than producing a blank card.
- Missing or failed vocabulary assets fall back to the appropriate category image and never leave an empty popup.
- Unsupported interactive tools fall back to a large static SVG model and guided step fields.
- Student work remains local to the device; no student response is transmitted.

## Verification

- Unit tests enforce fresh stems, 12 problems, valid answers, visuals, and step scaffolds across all 128 small-group configs.
- Resolver tests verify every vocabulary image path exists and fallback behavior works.
- JSDOM/browser tests verify vocabulary images, one-problem pagination, guided fill-ins, tool controls, keyboard operation, and no hidden teacher content.
- Desktop and Chromebook/mobile Playwright checks cover representative lessons from number, fraction, ratio, algebra, geometry, data, and coordinate families.
- Build, full test suite, small-group validator, accessibility scan, guarded ship dry run, production deployment, and live smoke checks must pass.
