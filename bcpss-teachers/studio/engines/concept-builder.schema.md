# concept-builder: activity data schema (v1)

Engine id `concept-builder`. One activity file is one `kind` (a representation) plus a list of tasks. The learner manipulates
the representation, presses **Check**, and then answers **What changed and why?**. Everything below is validated by
`engines/concept-kinds/validate.js` (`validateConceptActivity(activity)` returns a list of problems; empty means valid).
All rational numbers are written as strings (`"3/2"`, `"0.75"`, `"-2"`, `"1 1/2"`); JSON numbers are accepted but strings are preferred.
Every comparison is exact (see `rational.js`). Nothing is ever compared as a float.

File: `data/activities/<id>.js`, `export default { ... }`. The file name equals `id` (kebab-case).

## 1. Activity envelope

| field                          | type                                 | req | notes                                                                         |
| ------------------------------ | ------------------------------------ | --- | ----------------------------------------------------------------------------- |
| `id`                           | string                               | yes | kebab-case, equals file name                                                  |
| `engine`                       | `"concept-builder"`                  | yes |                                                                               |
| `title`                        | string                               | yes |                                                                               |
| `kind`                         | one of the kinds in section 3        | yes | one kind per activity                                                         |
| `grade` / `band` / `subject`   | taxonomy ids                         | yes | `band` must match `grade`                                                     |
| `standards`                    | string[]                             | yes | codes must exist in `data/standards/*.js`                                     |
| `curriculum`                   | `{status:"standards-aligned", note}` | no  | never `district-referenced` unless a real `unitId`                            |
| `vocabIds`                     | string[]                             | no  |                                                                               |
| `lessonId`                     | string                               | no  |                                                                               |
| `minutes`                      | integer 3..60                        | yes |                                                                               |
| `intro`                        | string                               | yes | 1-3 sentences: what the model shows and what the learner will do              |
| `model`                        | object                               | yes | kind-specific, section 3                                                      |
| `tasks`                        | Task[]                               | yes | 1..6; ids unique                                                              |
| `reflection`                   | `{prompt, frames:{ee,dev,exp,br}}`   | yes | final reflection; all four tiers present (an empty array is allowed for `br`) |
| `review`                       | `{status:"authored", checks:{}}`     | yes |                                                                               |
| `version`, `updated`, `source` | strings                              | yes | `source` e.g. `"Original - The Language Page"`                                |

Minimal valid envelope:

```js
export default {
  id: "demo-number-line",
  engine: "concept-builder",
  kind: "number-line",
  title: "Fractions on a number line",
  grade: "4",
  band: "3-5",
  subject: "math",
  standards: ["4.NF.A.2"],
  minutes: 10,
  intro: "Drag the point to the fraction that is the same distance from zero as the jump.",
  model: {/* section 3 */},
  tasks: [/* section 2 */],
  reflection: {
    prompt: "What helped you place the point?",
    frames: {
      ee: ["I used ..."],
      dev: ["I used ... because ..."],
      exp: ["I placed it by ..., so ..."],
      br: [],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
```

## 2. Task

```js
{
  id: "t1",                        // unique in the activity
  prompt: "Add rows until you can read the unit rate.",   // what to do (one or two sentences)
  goal: "A row whose first number is 1",                  // optional short success statement shown above Check
  setup: { /* optional: shallow-merged over `model` for this task */ },
  start: { /* optional kind state; default is kind.initialState(model) */ },
  target: { /* REQUIRED kind state that satisfies `check` (also used by "Show me the model") */ },
  check: { /* REQUIRED check, section 4 */ },
  answerText: "3/2",               // optional string a hint may never contain (validator-enforced)
  hints: ["h1", "h2", "h3"],       // REQUIRED, 2..4, graduated, never the answer
  misconceptions: [{ match: "additive", when: { /* check */ }, hint: "...", model: "..." }],   // optional
  model: "Worked model text shown after the third miss.",  // REQUIRED
  right: "That works.",            // optional confirmation (a system sentence describing the final state is appended)
  supports: { ee: S, dev: S, exp: S, br: S },  // REQUIRED, all four keys; S = {frames?,wordBank?,visual?,directions?,hint?,oral?}
  justify: { /* optional, section 5 */ },
  explain: {
    prompt: "What changed in the table, and why did it change that way?",   // REQUIRED
    frames: { ee: [..], dev: [..], exp: [..], br: [..] },                    // REQUIRED, all four keys
    mustMention: [{ id: "x", label: "the multiplier", any: ["times", "multipl", "scale"] }],  // optional key-idea nudge
    criteria: [{ id: "c1", label: "I said what changed." }],                 // optional self-check (default: 3 generic criteria)
  },
}
```

Feedback sentences that append a description of the final state (after a correct check or the model) end with exactly one full stop, even when the described item texts already end in one.

Behaviour: wrong -> `misconceptions` hint (first whose `when` check is true on the learner's value, else the next graduated hint) ->
second wrong -> hint -> third wrong shows `model` and a "Show the model" button that loads `target`. The **Hint** button gives
`hints[0..]` one at a time. After a correct check (or after the model), the optional `justify` step, then the required explain step.
`explain` needs at least one sentence of four words; `mustMention` only nudges, it never blocks. Rigor is identical in every
tier: tiers change `supports` and `explain.frames`, never `check`, `target` or the model.

Validator rules for a task: `start` (or the default) must NOT satisfy `check`; `target` must satisfy `check`; each
`misconceptions[].when` must be false on `target`; hints must not contain `answerText`, nor any `equals`/`within` check value of
three or more characters; `hints.length` 2..4; all four tier keys on `supports` and `explain.frames`; `explain.prompt` present.

## 3. Kinds

For every kind: `state` is what is saved/resumed and what `start`/`target` contain; `value` is what checks read (paths in section 4).
All `value` leaves are strings or arrays of strings. Common option on every model: none; each kind lists its own.

### 3.1 `ratio-table`

model

- `context` string, required. The situation in words.
- `columns` `[string, string]`, required. Column headings.
- `start` `[[a,b], ...]`, required, 1..4 rows of positive rationals. Initial rows.
- `maxRows` integer 3..12, default 8.
- `rateLabel` string, default `"per 1 of the first quantity"`. Wording of the unit rate readout.
- `allowScale` bool default true (add a row by multiplying a row by a factor). `allowCustom` bool default true (type your own pair; the table marks it "same rate" or "different rate").
- `tape` bool default true (linked double tape diagram for the selected row).

state `{ rows:[{a,b,via?:{from:int,k:string}}], sel:int }` (`rows[0..start.length-1]` are the start rows)

value

- `rows` string[][] `[[a,b],...]`; `n` row count
- `byFirst[x]` second value of the first row whose first value equals x (absent -> `"none"`); `bySecond[y]`
- `rate` = b/a of row 0 (second per 1 first); `rateInv` = a/b of row 0
- `proportional` `"true"|"false"` (every row has the same b/a as row 0); `offRows` indices of rows that do not
- `scaled` number of rows made by scaling; `factors` string[] of factors used; `last` `[a,b]`

### 3.2 `number-line`

model

- `min`,`max` rationals, `min < max`, required. `step` rational > 0, required; `(max-min)/step` must be an integer 1..240.
- `labelEvery` rational, multiple of `step`, default `step`. `format` `"fraction"|"mixed"|"decimal"|"integer"`, default `"fraction"`; `decimals` integer 0..4 for `"decimal"` (default 2).
- `points` `[{id,label,at?,fixed?}]` required, 1..6. `at` initial position (default `min`). `fixed:true` points are given and not draggable.
- `jumps` `[{id,label,from,len?,fixed?}]` optional, 0..3. `from` is a rational or `{point:"<pointId>"}`; `len` initial signed length (default `"0"`). The tip is draggable unless `fixed`. Negative length jumps left.

Dragging snaps to the nearest `step`; arrow keys move by `step`, PageUp/PageDown by `labelEvery`, Home/End to the ends.

state `{ points:{<id>:at}, jumps:{<id>:len} }`

value: `points[id]`; `jumps[id].from|to|len`; `order` point ids by position ascending (ties by model order); `ties` count of equal positions.

### 3.3 `graph-line`

model

- `xmin`,`xmax`,`ymin`,`ymax` rationals (defaults 0,10,0,10). `grid` rational snap step, default `"1"`.
- `xLabel`,`yLabel` strings, required. `rateLabel` string (readout wording).
- `points` `[{id,label,at:[x,y]}]` required, exactly two draggable defining points.
- `given` `[{id,label,at:[x,y]}]` optional fixed reference points, 0..4.
- `tableXs` rationals, default `["0","1","2","3","4","5"]`. `showTable` bool default true.
- `format` `"fraction"|"mixed"|"decimal"|"integer"`, default `"fraction"`, and `decimals` integer 0..4 (default 2, used by `"decimal"`): how the slope, equation, table values, tick labels and point coordinates are printed (`-7/5` or `-1.4`, `5/2x` or `2.5x`). Display only: the line is still computed and checked exactly (`slope`, `intercept` and `table[x]` stay fractions in `value`).

state `{ pts:{<id>:[x,y]} }`

value: `slope`, `intercept` (`"undefined"` for a vertical or degenerate line), `vertical` `"true"|"false"`, `equation`,
`table[x]` y at that x, `passes[givenId]` `"true"|"false"`, `<pointId>` `[x,y]` for each defining point.

### 3.4 `fraction-bar`

model

- `bars` `[{id,label,nMin?,nMax?,lockParts?,n?,shade?}]` required, 1..3. `nMin`/`nMax` default 1/12; `lockParts` fixes the partition count; `n` initial partitions (default `lockParts` or 1); `shade` initial shaded parts (default 0).
- `align` bool default true: draws a guide from the shaded edge of the first bar through the others.

state `{ bars:{<id>:{n:int, k:int}} }`: `n` equal parts, `k` shaded parts counted from the left (tapping part i shades parts 1..i; tapping the last shaded part removes one). Changing `n` clears shading. Shading from the left makes the shaded amount a length that lines up between bars.

value: `bars[id].n`, `.k` shaded count, `.frac` reduced `k/n`, `.raw` `"k/n"`; `equivalent` `"true"` when at least two bars are shaded and all reduced fractions are equal.

### 3.5 `area-model`

model

- `mode` `"partial"` or `"unit-square"`, required.
- partial: `w`,`h` positive rationals, `cutStep` rational (default `"1"`). The learner places one vertical cut (x) and one horizontal cut (y), or none (`"0"`).
- unit-square: `rows`,`cols` `{min,max,start}` integers 1..12; `factors` optional `[{axis:"col"|"row", of:"3/4", label}]` hatched guides drawn at their exact fractional width/height.

state partial `{ cutX, cutY }`; unit-square `{ rows, cols, on:[cell indices] }`

value partial: `cutX`,`cutY`, `areas` string[] (areas of the non-empty pieces, descending), `total`, `product` (= w x h), `widths`, `heights`.
value unit-square: `rows`,`cols`,`total`,`shaded`,`frac` (reduced), `raw`.

### 3.6 `label-diagram`

model

- `visual` visual spec (core/visuals.js), required, with `alt` and `w`,`h` (defaults 480 x 320).
- `labels` `[{id,text,distractor?}]` required. Every label is the `answer` of exactly one hotspot, or has `distractor:true`.
- `hotspots` `[{id,x,y,answer,name?}]` required, 2..10. `x`,`y` are the centre in visual units (`0..w`, `0..h`). `name` is a plain description for screen readers (for example "top left of the cell") and must not contain the answer text.

Interaction: tap/click a label, then a hotspot (or drag); keyboard: Enter on a label picks it up, Tab to a hotspot, Enter places it; Backspace/Delete on a hotspot returns its label.

state `{ placed:{<hotspotId>:<labelId>} }`

value: `placed[h]`, `correct`, `wrong`, `unplaced`, `total` (counts as strings), `wrongIds`, `unplacedIds`. Check does not reveal which label belongs where; wrong spots are marked "not yet".

### 3.7 `map-hotspots`

model

- `visual` visual spec (usually kind `map`), required. `regions` `[{id,label,rect:[x,y,w,h]}]` required, 2..12, same units as the visual. `multi` bool default true.
- `showLabels` bool default true: print each region's `label` on its hotspot. When the picture already prints the same text (a `visual.regions[].label` equal to the hotspot `label`, ignoring case) the engine does not draw it a second time; the hotspot keeps the label as its accessible name. `showLabels:false` hides every hotspot label.

state `{ selected:[ids] }`. value: `selected` (model order), `count`.

### 3.8 `process-model`

model

- `title` string. `variables` required 1..4: `{id,label,type:"slider",min,max,step,start,unit?,valueLabels?}` (`valueLabels[i]` names the value `min + i*step`) or `{id,label,type:"toggle",options:[{id,label}],start}` (value is the option id).
- `outputs` required 1..4: `{id,label,unit?,min,max,rules:[{when:[Cond],value,say,ruleId}]}`. Rules are evaluated in order, first match wins; the last rule must have `when: []` (the default). `value` is a rational within `[min,max]`; `say` is the cause-and-effect sentence shown to the learner.
- `stages` optional 2..8: `{id,label,detail?,when:[Cond]}` in process order. A stage is reached when all its conditions hold.
- `Cond` = `{var:"<id>"|out:"<id>", op:"lt|le|eq|ge|gt|ne|in", value}` or `{... op:"in", values:[...]}`; toggles compare option ids with `eq|ne|in`.

All behaviour (outputs, stages, sentences) comes from these rules. There is no code per activity.

Number display (optional): `format` and `decimals` on the model, on a variable, or on an output choose how that value is printed (an item's setting beats the model's). `format` is `"fraction"` (default, for example `-7/5`), `"mixed"`, `"decimal"` or `"integer"`; `decimals` is an integer 0..4 for `"decimal"` (default 2). Display only: the engine still computes and compares exact fractions. Authored `say` sentences and `valueLabels` are printed as written.

state `{ vars:{<id>:value}, log:[{v,from,to,effect}] }` (`log` keeps the last 8 changes).
value: `vars[id]`, `out[id]`, `why[outId]` (the `ruleId` that fired), `stage` (id of the last reached stage, `"none"` if none), `reached` ids, `changes` count of changes.

### 3.9 `timeline-sort`

model

- `span` `[min,max]` integers, required. `axisStep` integer >= 1 (placement snap). `unit` string, default `"year"`.
- `events` `[{id,label,detail?,at}]` required, 3..10. `at` is the true integer date inside `span`.

Cards start in a bank; Enter/click on a bank card places it at the middle of the axis; the placed card is a slider (Left/Right by `axisStep`, PageUp/PageDown by 10x, Home/End); dragging also works.

state `{ at:{<id>:int|null} }`. value: `at[id]` (string or `"unplaced"`), `order` (placed ids by date, ties in model order), `placed`, `unplaced`, `ties` counts.
The true dates are revealed after the learner is correct (or sees the model).

### 3.10 `scale-sort`

model

- `axis` `{label,low,high}` required (`low`/`high` name the two ends, for example "mild" and "extreme").
- `items` `[{id,text,gloss?}]` required, 3..8. List order in the file is the presented start order unless `start.order` says otherwise.

Move items with the arrow buttons (keyboard and touch), or drag.

state `{ order:[ids] }`. value: `order`, `pos[id]` (1 = low end), `first`, `last`.

## 4. Check types

A `check` is one object. `of`, `left`, `right` are paths into the kind's `value`: dotted keys, with `[key]` for keys that contain dots or slashes
(`byFirst[1.5]`, `points[A]`, `bars[A].frac`). A missing path never throws; it simply fails the check.

| type          | fields                                     | passes when                                                                                                                                                                                                    |
| ------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `equals`      | `of`, `value`                              | both parse as rationals and are exactly equal; otherwise equal as trimmed case-insensitive strings                                                                                                             |
| `within`      | `of`, `value`, `tolerance` (default `"0"`) | `abs(of - value) <= tolerance`, exact                                                                                                                                                                          |
| `order`       | `of` (array path), `expected`              | the array equals `expected`. An element of `expected` may itself be an array of ids: those ids may appear in any order inside that slice                                                                       |
| `set`         | `of`, `expected` (array), `mode`           | `equal`: same members, order ignored. `subset`: every member of `of` is in `expected`. `superset`: `of` contains all of `expected`. `member`: scalar `of` is one of `expected`                                 |
| `relation`    | `left`, `op`, `right`, `value?`            | `left` and `right` are a path string or `{value:V}`. `op`: `lt le eq ge gt ne`, `multiple` (left is an integer multiple of right), `ratio` (left / right equals `value`), `diff` (left - right equals `value`) |
| `all` / `any` | `checks:[...]`                             | every / at least one sub-check passes                                                                                                                                                                          |
| `not`         | `check`                                    | the sub-check fails                                                                                                                                                                                            |

## 5. `justify` (optional, any kind)

Shown after the check is correct (or the model was seen), before explain. Used for the "why this order / why these regions" evidence step.

```js
justify: {
  prompt: "Which clue shows that the Stamp Act came before the Boston Massacre?",
  options: [{ id: "j1", text: "...", ok: true }, { id: "j2", text: "...", ok: false, hint: "That clue does not tell you the order." }],
  min: 1,      // how many correct options must be chosen (default: count of ok options)
  model: "A sentence shown after three misses.",
}
```

Rules: at least one `ok:true` option, at least one `ok:false`, 3..6 options, ids unique, `model` required. The learner picks options and presses **Check my reasons**; the check passes when no `ok:false` option is selected and at least `min` of the `ok:true` options are selected (`min` defaults to the number of `ok` options). A selected wrong option shows its `hint` (or a generic line); nothing names the missing option.

## 6. Evidence

`ctx.settle` is called per task (item id = task id: `tries`, `hints`, `ok`, misconception `tags`) and per justify step (item id `<taskId>-why`); `ctx.finish(reflection)` runs on the final screen.
The explanation text is kept on the device in the saved progress only; it is not part of the shared evidence code except as the final reflection.

## 7. Visuals

`visual` is a spec for `renderVisual` from `core/visuals.js` (required `kind`, `alt`). Specs found anywhere in the activity are rendered by `tools/validate-studio.mjs`.
