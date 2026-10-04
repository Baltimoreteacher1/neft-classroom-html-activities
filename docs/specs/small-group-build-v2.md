# Small-group "Build the idea" — authored content spec (v2)

Source of truth for the Build section of every small-group studio
(`N-M-group1`, `N-M-group2`, `N-M-catchup`). One file per base lesson:

```
data/small-group-build/<unit>-<lesson>.json      e.g. data/small-group-build/2-3.json
```

`tools/generate-small-group-lessons.mjs` copies `group1` / `group2` into
`launch.build` of the matching studio config; `tools/generate-catchup-lessons.mjs`
composes a catch-up's Build from the `catchup` block of every lesson it covers.
`node tools/validate-small-group-build.mjs [file…]` checks every rule below.

## What the student sees (all at once — nothing is stepped or locked)

1. **Today's idea** — one sentence, top of the section.
2. **Worked examples** (1–2). Each: Problem box → numbered steps → Answer box,
   with one figure drawn from the example's own numbers.
3. **Let's do one together** — same layout, but each step's math sits behind a
   "Check" tap so the student thinks first.
4. **Your turn** — one problem with an answer box that checks the answer, a hint,
   and (group 2) an "Explain why" prompt with a model explanation.
5. **The big idea** — one sentence, end of the section.

## File shape

```jsonc
{
  "lesson": "2-3",
  "group1": {
    "todayIdea": "…", "todayIdeaEs": "…",
    "examples": [ /* 1–2 Example */ ],
    "together": { /* Example; steps use ask/answer */ },
    "tryIt": { /* TryIt */ },
    "bigIdea": "…", "bigIdeaEs": "…"
  },
  "group2": { /* same shape as group1 */ },
  "catchup": {
    "title": "…", "titleEs": "…",          // e.g. "Median: the middle value"
    "problem": "…", "problemEs": "…",
    "figure": { /* optional Figure */ },
    "steps": [ /* 2–4 ModelStep */ ],
    "answer": "…", "answerEs": "…",
    "check": { /* TryIt (no explain) */ }
  },
  "vocab": {                                // OPTIONAL — only to fix unclear Key Words chips
    "<exact term>": { "examples": [ { "text": "…", "isExample": true, "why": "…" }, … ] }
  }
}
```

### Example (worked, and `together`)

```jsonc
{
  "title": "Example 1 · Odd number of values",
  "titleEs": "…",
  "problem": "Find the median of 2, 4, 4, 6, 9.",
  "problemEs": "…",
  "figure": {/* optional Figure — strongly preferred, see below */},
  "steps": [/* 2–5 steps */],
  "answer": "The median is 4.",
  "answerEs": "…",
}
```

- Worked-example step (**ModelStep**): `{ "do", "doEs", "math"?, "why"?, "whyEs"? }`
- Together step (**AskStep**): `{ "ask", "askEs", "answer", "answerEs"? }` — the
  answer is hidden behind a Check tap. Every together step has an answer.

### TryIt

```jsonc
{
  "problem": "…",
  "problemEs": "…",
  "answer": "5", // what the answer box shows after checking
  "accept": ["5"], // normalized matches (case/space/comma-insensitive)
  "hint": "…",
  "hintEs": "…",
  "explain": "…",
  "explainEs": "…", // group2 ONLY: the "explain why" prompt
  "modelExplanation": "…",
  "modelExplanationEs": "…", // group2 ONLY
}
```

`accept` must contain `answer`'s numeric form when the answer is a number.
Prefer answers that are a single number or a short word (`"7"`, `"Store A"`,
`"24 square feet"` with accept `["24", "24 square feet", "24 sq ft"]`).

## Writing rules (the validator enforces the countable ones)

- **Grade 6 support readers, many English learners.** Short, common words.
  One idea per sentence. No idioms. No "the book", "below", "above", "the
  picture" (the card decides layout, not the text).
- `do`: an instruction, **≤ 10 words**, starts with a verb ("Put the values in order.").
- `math`: the math only — no sentences. Use `×` `÷` `−` (U+2212) `·` never `x`/`*`
  for multiplication. Fractions as `{3/4}`, mixed numbers `2{1/2}` — these are
  typeset stacked. Several lines of work: separate with `⟶` or use an array of
  strings (each one line).
- `why`: optional, **≤ 18 words**, says _why_ the step works.
- `ask`: a question or instruction to the student, **≤ 16 words**.
- `answer` (together step): what the student should get, short.
- `problem`: **≤ 45 words**. Keep the base lesson's context and numbers.
- `todayIdea` ≤ 22 words; `bigIdea` ≤ 28 words, one sentence, no "Formula:", no
  numbered lists.
- Every English field has an `…Es` Spanish sibling (natural Latin-American
  Spanish, same math notation).
- Arithmetic in `math` must be correct — the validator evaluates every
  `a op b = c` it can parse.

## Content rules

- **Keep the base lesson's examples.** Example 1 is the base lesson's "Watch
  me" problem (`lessons/<u>-<m>/config.json → launch.conceptIntro.iDo`),
  restructured. If that walkthrough jams two cases together (odd + even count,
  joined + cut-out area), split them into Example 1 and Example 2. The
  together problem is the base lesson's `weDo` problem. Do not change numbers,
  contexts or the mathematics; do fix errors you find and say so in your report.
- **Group 1** (support): examples exactly as above; `tryIt` is a fresh problem of
  the same kind with friendly numbers (not copied from the practice items).
- **Group 2** (challenge): Example 1 = a genuinely harder case of the same
  objective (unknown value, reverse problem, decimals/fractions, a case where a
  shortcut breaks, comparing two methods) — not the same problem with bigger
  numbers. `together` = the base `weDo` problem plus one step that asks _why_.
  `tryIt` includes `explain` + `modelExplanation`.
- **Catch-up**: the base lesson's core move in 2–4 steps + one `check`.
- **Mindset lessons (1-x, 10-x)**: still a real worked example with numbers (the
  base lesson's own estimation/pattern/decomposition task).

## Figures

One `figure` per example where the standard model exists (Reveal uses one).
Every number in a figure must come from that example. Kinds:

| kind               | fields                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dotPlot`          | `values[]`, `min`, `max`, `step`?, `label`, `mark`? `{value, text}`                                                                                                 |
| `numberLine`       | `min`, `max`, `step`, `labelEvery`?, `points[]` `{value, text?, open?}`, `jumps[]` `{from, to, text}`, `ray`? `{from, dir:"left"\|"right", open}`                   |
| `doubleNumberLine` | `top{label, values[]}`, `bottom{label, values[]}` (same length)                                                                                                     |
| `coordGrid`        | `xMin,xMax,yMin,yMax,xStep,yStep`, `xLabel?`,`yLabel?`, `points[]` `{x,y,text?}`, `connect?`, `polygon?`                                                            |
| `shape`            | `unit`, `polygons[]` `{points:[[x,y]…], cut?, label?}`, `sides[]` `{from:[x,y], to:[x,y], text}`, `heights[]` `{from,to,text}` — coordinates in the problem's units |
| `prism`            | `l`, `w`, `h`, `unit`, `cubes?` (draw unit cubes)                                                                                                                   |
| `tape`             | `rows[]` `{label, parts, partText?, shaded?, total?}`                                                                                                               |
| `ratioTable`       | `headers[2+]`, `rows[][]`, `highlight?` (row index)                                                                                                                 |
| `table`            | `headers[]`, `rows[][]`                                                                                                                                             |
| `fractionBars`     | `bars[]` `{parts, shaded, text?}`                                                                                                                                   |
| `hundredGrid`      | `shaded` (0–100), `text?`                                                                                                                                           |
| `boxPlot`          | `min,q1,median,q3,max`, `axisMin`, `axisMax`, `step`                                                                                                                |
| `histogram`        | `bins[]` `{from,to,count}`, `xLabel`, `yLabel`                                                                                                                      |
| `longDivision`     | `dividend` (string, may be decimal), `divisor` (string)                                                                                                             |
| `factorTree`       | `root`, `splits[]` `[parent, a, b]`                                                                                                                                 |
| `areaModel`        | `rows[]` (labels), `cols[]` (labels), `cells[][]`                                                                                                                   |
| `balance`          | `left`, `right` (strings)                                                                                                                                           |

Every figure also takes `caption`/`captionEs` (≤ 12 words).
