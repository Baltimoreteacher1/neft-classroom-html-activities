# Family Math Studio v3.0: lesson-keyed content contract

Why: until v3.0 the family homework page took its Learn-stop co-learning content (bridge, Socratic prompts, worked example, transfer
problem, spot-the-glitch, spiral check, kitchen-table prompt) from a UNIT-level topic bank (`TOPIC_CO_LEARNING_BANK`) with a
`"ratios"` default. 89 of 166 pages printed another lesson's content (a smoothie ratio on a percent page, "Jordan says 3:5" on an area
page). A unit cannot choose a lesson's story. v3.0 removes the bank and the default: **a lesson with no authored `v3` block fails the
build.** Working copies of the two briefs: `docs/family-homework-v3/brief-content.md`, `brief-design.md`.

## Where it lives

`data/family-homework-notes/<id>.json` gains ONE new top-level key, `v3`. Nothing else in the file changes. Existing keys that v3 REUSES
(do not re-author them): `bigIdea`, `learningTonight`, `conceptSteps`, `watchFor`, `tryTogether`, `stuckTips` (`say` becomes the
Socratic prompts), `bridge` (`class` = "in class today", `before` = "how you may have learned it", `why`), `corner`, `basicPractice`,
`vocabulary` (Part 2), and the lesson `config.json` (`title`, `standard`, `vocabulary`, `launch.conceptIntro.iDo` = the worked example).

## Shape (every `{en, es}` has both languages; Spanish is natural US Spanish, see `docs/family-homework-v3/es-style-guide.md`)

```jsonc
"v3": {
  "version": 1,
  "kind": "math",                       // "math" | "mindset" (Unit 10 "Math is ..." lessons use "mindset": no model, no transfer/spiral)
  "topicKey": "percent-find-whole",     // lowercase-kebab slug that names THIS lesson's idea; unique across lessons
  "standardPlain": { "en": "", "es": "" },  // one friendly sentence for config.standard. The CODE is never authored here; it comes from config.standard.
  "hook": {                             // "The Spark": a 20-second question in the family's world, answered by the end. SAME story/numbers as bigIdea + worked example.
    "style": "price-tag",               // price-tag | recipe | scoreboard | map | ticket | receipt
    "en": "", "es": "",                 // the mystery, <= 40 words, ends in a question
    "guess": { "en": "", "es": "" },    // estimate-first prompt ("more or less than $42?")
    "reveal": { "en": "", "es": "" }    // shown after a first try; names the answer + one reason
  },
  "classModel": { "name": { "en": "the 10% stepping stone", "es": "el peldaño del 10%" } },  // the lesson's own model/method name, used in headings and alt text
  "model": {                            // data -> SVG (assets/design/family/art/math-models.mjs). kind "none" only for mindset lessons.
    "kind": "tape",                     // tape | doubleline | ratiotable | area | grid | numberline | coord | barplot | fraction | balance | none
    "data": { },                        // shape per kind below, built from the lesson's OWN numbers
    "alt": { "en": "", "es": "" }       // a real text alternative describing the math, mentions the numbers
  },
  "transfer": {                         // ONE new-context problem (not tonight's story). Omit for mindset.
    "stem": { "en": "", "es": "" },
    "choices": [ { "en": "", "es": "", "correct": false, "misconception": "multiplied-instead-of-divided" }, ... 3 choices, exactly one correct ],
    "reasoning": { "en": "", "es": "" },
    "calc": { "expr": "27 / 0.30", "value": 90, "unit": "$" }   // recomputed by validate:family-math; the correct choice must show `value`
  },
  "glitch": null,                       // REQUIRED object on "-part2"/"-part3" pages, null elsewhere:
                                        // { "scenario":{en,es}, "steps":[{en,es,isGlitch}, x3 exactly one glitch], "fix":{en,es}, "frame":{en,es},
                                        //   "calc": { "expr": "...", "value": n } }   // checks the CORRECT step
  "spiral": [                           // exactly 2 items, from lessons that are genuinely EARLIER in the sequence
    { "from": "4-3", "q": { "en": "", "es": "" }, "options": ["", "", ""], "correctIdx": 0, "exp": { "en": "", "es": "" },
      "calc": { "expr": "0.25 * 80", "value": 20 } }
  ],
  "kitchenTable": { "en": "", "es": "" },     // household-object challenge, <= 5 minutes of setup, no pencil needed to talk
  "vocab": [                            // 3-6 entries, one per term the page shows (term must match a vocabulary term, EN)
    { "term": "Whole",
      "example": { "en": "", "es": "" },      // uses THIS page's story or is labeled "A different situation:"
      "nonExample": { "en": "", "es": "" },
      "frame": { "en": "The whole is ___ because ...", "es": "..." } }   // a real sentence frame about THIS idea; never "I can use <term> to explain why"
  ],
  "confused": [                         // exactly 3 rounds, escalating; the "Confused Grown-Up" says a believable wrong answer for THIS lesson
    { "wrong": { "en": "42 times 0.6 is 25.2, so the whole is 25.2.", "es": "" },
      "coach": { "en": "Should the whole be bigger or smaller than the part?", "es": "" },   // an open question, no answer inside
      "why":   { "en": "", "es": "" },
      "misconception": "multiplied-instead-of-divided",
      "calc": { "expr": "42 / 0.6", "value": 70 } }
  ]
}
```

### `calc`

`expr` uses only numbers, `+ - * / ( )` and `^`; `validate:family-math` evaluates it with exact rational arithmetic
(`scripts/lib/rational.mjs`) and requires it to equal `value` and the correct answer text to contain `value` (thousands separators,
`$`, `%` and trailing units tolerated). Money rounds to cents. `calc` is how the build proves an answer without parsing prose.

### `model.data` by kind (all labels are `{en, es}` unless a plain string is safe in both languages, e.g. "$42")

| kind         | data                                                                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tape`       | `{ parts, highlight, partLabel, wholeLabel, blockLabel, unknown: "whole"\|"part"\|null }` (equal blocks; `highlight` of `parts` blocks form the part) |
| `doubleline` | `{ top: { label, ticks: [..] }, bottom: { label, ticks: [..] }, unknown: [indexes] }`                                                                 |
| `ratiotable` | `{ headers: [a, b], rows: [[x, y], ...], unknownCells: [[row, col]], arrows: [{ from, to, label }] }`                                                 |
| `area`       | `{ shape: "rectangle"\|"parallelogram"\|"triangle"\|"trapezoid", dims: { base, height, ... }, unit, cutAndSlide }`                                    |
| `grid`       | `{ rows, cols, filled, groupSize: 5\|10, label }`                                                                                                     |
| `numberline` | `{ min, max, step, points: [{ value, label, kind: "given"\|"unknown"\|"answer" }], unit }`                                                            |
| `coord`      | `{ xmax, ymax, points: [{ x, y, label }], quadrants: false }`                                                                                         |
| `barplot`    | `{ categories: [{ label, value }], unit }`                                                                                                            |
| `fraction`   | `{ parts, shaded, label }`                                                                                                                            |
| `balance`    | `{ left: [..], right: [..], unknown }`                                                                                                                |
| `none`       | `{}`                                                                                                                                                  |

## Rules the gates enforce

- No string of 60+ characters appears on more than 3 lessons (UI chrome allow-listed). Base lesson and its `-part2` are different sessions.
- Ratio signatures (smoothie, compost, "Jordan says 3:5", "keep the taste/color the same") appear only on ratio lessons.
- `hook`, `bigIdea`, `model` and `transfer`-contrast use ONE story; no hint 1 or 2 states an answer; the Socratic ("Ask") prompts contain no answer.
- Spiral `from` ids are earlier than the lesson (by unit, then lesson number) and exist.
- English family-facing text is grade 5 or lower (math vocabulary defined on the page excepted); no brands, no real people, no timers,
  no "co-pilot/engine/enterprise" words, SPED labels never appear.
- Spanish: `el total` for the whole (Reveal glossary), `tú` for the student, `ustedes` for adults, `60%` with no space.
- Unit 10 ("Math is ...") uses `kind: "mindset"`: hook, classModel, kitchenTable, vocab (mindset words), confused (self-talk
  misconceptions such as "if I am stuck I am bad at math"); `transfer`, `spiral`, `model.kind: "none"`.
