# Practice Studio v2 — contract

Every core lesson in Units 2-9 (67 lessons) has **two** student-facing HTML studios:

| Version   | URL                                     | Purpose                                                                 |
| --------- | --------------------------------------- | ----------------------------------------------------------------------- |
| Practice  | `/math/practice-studio/<id>/`           | Learn-by-doing: warm-up, two levels, fresh problems, mastery check      |
| Challenge | `/math/practice-studio/<id>/challenge/` | Stretch: skill climb, multi-step missions, a lab, detective, boss level |

Unit 4 keeps its hand-built pages (`/math/unit-4/...`) and receives the shared-layer upgrades only.

Design rules (non-negotiable, from Joel's standing decisions):

- **No timers, countdowns or beat-the-clock language.** Nothing is ever timed.
- **A wrong answer explains the mistake; it never prints the right answer.** The answer appears only after the student solves it.
- **No hub links** from inside a studio except the "open the full lesson" footer link.
- Student-facing: Grade 6 reading level, short sentences, sentence frames where helpful, Spanish for every student sentence.
- Notation: `×` and `÷` (never `x` or `*`), true minus `−` in prose, `·` is allowed for multiplication in algebra.
- Everything must work with keyboard only, at 375px wide, in forced-colors, and with reduced motion.
- No answer-giveaways: the stem may not contain its own answer; a hint may not state the final answer.

## 1. Worlds (variety from lesson to lesson)

Each lesson has a **world** (`data/practice-studio/worlds.json`): a palette, header motif, display font, shape language,
mascot and voice. Adjacent lessons never share a world. The Practice page is the world in daylight; the Challenge page is
the same world at night. A lesson's `story` (1-2 sentences, Grade 6 reading level) frames its problems as a mission in that
world. World ids: `reef orbit trail kitchen studio arcade lab harbor garden sports mystery workshop`.

## 2. Item kinds (what a studio draws)

All fields with an `Es` suffix are the Spanish sibling. `id` is assigned by the builder. `h` is a hint ladder (1-3 hints,
each a little more help, the last never the answer). `x` is the explanation shown AFTER the item is solved.

| `k`     | Fields                                                                                                                   | Graded by                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| `mc`    | `q, c[2-5], a, f[], x, h, viz?` ; `f[i]` explains why choice i is wrong (`""` at `a`); `tag[i]?` names the misconception | `a` index                                  |
| `num`   | `q, a, unit?, tol?, fw?[{v,f}], x, h, viz?`                                                                              | value ("1/2" = 0.5, "$3" = 3)              |
| `err`   | `t, s[{l,w}], e, fix, x, h`                                                                                              | tapping step `e`                           |
| `tbl`   | `t, hd[], rows[][], cells[{r,c,a}], x, h`                                                                                | value per cell                             |
| `wr`    | `p, fr?, min, kw[], rubric[], x, h`                                                                                      | length, then self-check against `rubric[]` |
| `sort`  | `q, bins[{l,lEs}], cards[{t,tEs,b}], x, h`                                                                               | each card's bin `b`                        |
| `match` | `q, pairs[{l,r,lEs,rEs}], x, h`                                                                                          | each left with its right                   |
| `nline` | `q, min, max, step, a, tol?, x, h`                                                                                       | tapped tick within `tol`                   |
| `gen`   | `g, level, lab?` → expanded at runtime by `StudioGen.make(g, level, seed)` into `mc` or `num`                            | per expanded item                          |
| `pool`  | `items[]` (authored `mc/num/...`, at least 2× the slots that draw from it)                                               | drawn by seed, re-rollable                 |
| `act`   | `kind, p?, level, lab?` → expanded by `StudioAct.make(kind, level, seed, p)`; a hands-on activity                        | `StudioAct.grade`                          |

`viz` on any item draws an SVG figure above the question (section 3). Items that say "the picture/diagram/graph" without a
`viz` are rejected. Tags: a wrong choice may carry a `tag` (e.g. `"added-instead"`) — the runtime builds a private **Mistake
Map** from them (section 7), so generators and authors name each misconception consistently within a lesson.

## 3. Figures — `window.StudioViz.render(spec) -> svg string`

Pure function, no DOM. Always returns a complete `<svg role="img" aria-label="…" viewBox=… >` with a text alternative in
`<title>`, uses CSS variables (`var(--brand)`, `var(--sun)`, `var(--ink)`, `var(--surface)`, `var(--border)`) so every world
recolours it, and never relies on colour alone. `spec.t` selects the figure:

| `t`     | spec                                                                                                                                                                |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dots`  | `{data:number[], min, max, step?, label?}` dot plot (stacked dots)                                                                                                  |
| `hist`  | `{bins:[{from,to,n}], xlabel?, ylabel?}`                                                                                                                            |
| `box`   | `{min,q1,med,q3,max, scale:{min,max,step}, label?}` or `{plots:[{label,min,q1,med,q3,max}], scale}` (compare)                                                       |
| `bars`  | `{labels[], values[], ylabel?, max?}`                                                                                                                               |
| `coord` | `{xmin,xmax,ymin,ymax, points:[{x,y,l?}], segments?:[[i,j]], polygon?:number[] (point indexes), line?:{m,b}, grid?:true}` four quadrants                            |
| `nline` | `{min,max,step, marks?:[{v,l?,open?}], ray?:{from,dir:"left"\|"right",open:boolean}}`                                                                               |
| `shape` | `{s:"para"\|"tri"\|"trap"\|"rect"\|"rhombus"\|"hex"\|"lshape", dims:{b?,h?,b1?,b2?,side?,w?,l?,...}, labels?:boolean, unit?}` height drawn dashed and perpendicular |
| `prism` | `{l,w,h,unit?, labels?:boolean, cubes?:boolean, net?:boolean}` box in oblique view; `net` draws the unfolded net                                                    |
| `tape`  | `{parts:[{v:number\|string, l?}], total?, groups?}` tape diagram                                                                                                    |
| `dnl`   | `{top:{label,vals[]}, bottom:{label,vals[]}}` double number line (use `null` for a blank to fill)                                                                   |
| `table` | `{hd[], rows[][], blank?:[[r,c]]}` ratio table                                                                                                                      |
| `bar1`  | `{n,d,whole?}` fraction bar(s) with `n` of `d` shaded                                                                                                               |

## 4. Generators — `StudioGen` (assets/studio-gen/*.js)

Core is `assets/studio-gen/core.js` (read it first). A generator returns ONE item whose answer is computed:

```js
StudioGen.register("medianFind", {
  title: "Find the median", titleEs: "Hallar la mediana", levels: 4,
  make(rng, level) { /* ...compute... */ return StudioGen.mc(rng, {...}) /* or StudioGen.num({...}) */ },
  check(item) { /* recompute from item.meta by a DIFFERENT route; return true or a string describing the disagreement */ },
});
```

Rules: levels 1 (recognise / one step) → 2 (grade level) → 3 (multi-step / unusual form) → 4 (challenge: reverse
problems, two-step, traps). Level changes the numbers' size AND the kind of thinking, never only the size. Every wrong
choice is a NAMED misconception with `f` feedback (`fEs` if you can). `qEs` and `xEs` are required. Contexts rotate
(≥6 distinct names/places/objects per generator). Use `viz` wherever a figure is natural. `meta` holds the raw numbers
`check()` needs. 300 seeds × 4 levels must pass `tools/studio-gen.test.mjs`.

## 5. Hands-on activities — `StudioAct` (assets/studio-act/*.js)

Core is `assets/studio-act/core.js`. Each activity is a pure model plus a DOM widget:

```js
StudioAct.register("plot", {
  title, titleEs, levels: 4,
  make(rng, level, params) -> spec,   // pure, JSON-serialisable; includes q, qEs and everything needed to grade
  solution(spec) -> state,            // pure; a state grade() must accept
  wrong(spec, rng) -> state[],        // pure; >= 2 states grade() must reject
  grade(spec, state) -> { ok, tag?, say?, sayEs? },   // pure; `say` explains a miss WITHOUT giving the answer
  mount(host, spec, api),             // DOM widget; see below
});
```

`api = { restore: state|null, change(state), submit(state), hint(), es(): boolean, say(msg) }`. The widget draws only the
interactive part (the runtime shows `spec.q`). It calls `api.change(state)` whenever the student edits (so progress
saves), shows a "Check" button that calls `api.submit(state)`, and after a solve the runtime calls `mount` again with
`api.restore = solution(spec)` and `api.solved = true` — the widget then renders read-only. Requirements: ≥44px touch
targets; works by keyboard and pointer; no timers; respects `prefers-reduced-motion`; styles injected once through
`StudioAct.css(kind, text)` using the studio tokens (`--brand --brand-dark --brand-tint --brand-line --sun --ok --bad --ink
--surface --border --radius-md`); every control has an accessible name; Spanish for every label via `api.es()`.
Never put backticks inside a comment (the CSS-integrity gate reads them as a template-literal fault).

## 6. Catalogue (ids the data files may reference)

**Generator ids**

- stats: `dotplotRead histogramRead medianFind meanFind meanMissing rangeIqr boxplotRead madCalc chooseMeasure`
- numbers: `longDivision decimalDivision decimalAddSub decimalMultiply factorsMultiples lcmFind gcfFind primeFactorization exponentEval orderOfOps`
- fractions: `fracDivWhole fracDivMixed wholeDivFrac mixedDivide fracDivWord`
- ratio: `ratioWrite unitRate eqRatioTable ratioGraphRead compareRatios convertUnits convertBetween unitRateWord eqRatioMissing`
- geometry: `areaParallelogram areaTriangle areaTrapezoid areaComposite volumePrism surfaceAreaPrism surfaceAreaPyramid areaRegularPolygon`
- algebra: `evalExpression equivalentExpr combineLikeTerms distribute simplifyExpr solutionCheck solveAddSub solveMulDiv writeInequality ineqSolutionCheck solveInequality writeEquationWord twoVarTable graphRelationship twoVarProblem`
- coordinate: `integerOpposites rationalNumberLine absoluteValue compareOrder quadrantId coordDistance polygonCoordinates reflectPoint`

**Activity kinds** (params in brackets)

- `plot` [`mode: "point"|"polygon"|"reflect"|"ratio"|"table"|"distance"`, range]: tap a grid to place points, build a polygon, reflect a point, plot a ratio table.
- `nline` [`mode: "place"|"order"|"opposite"|"abs"`]: place / order / mirror numbers on a number line.
- `ineq` [`mode: "write"|"graph"|"test"`]: build an inequality graph: pick open/closed circle, direction, boundary.
- `sizer` [`shape: "para"|"tri"|"trap"|"lshape"|"prism"`, `goal: "area"|"volume"|"surface"`]: resize a figure with steppers to meet a target and watch the measure update.
- `areabox` [`mode: "decimal"|"distribute"`]: area model; shade or split a rectangle to show a product.
- `barcut` [`mode: "wholeByFrac"|"fracByWhole"|"mixed"`]: cut fraction bars into equal pieces and count groups.
- `ldiv` [`decimal: boolean`]: long division, one step at a time (quotient digit, multiply, subtract, bring down).
- `dotbalance` [`goal: "mean"|"median"|"spread"|"outlier"`]: drag dots on a number line; the balance point, mean and median react.
- `chartbuild` [`mode: "dot"|"hist"|"box"`]: build a dot plot, histogram or box plot from a data table.
- `ratiomix` [`mode: "recipe"|"equivalent"|"unitrate"|"compare"`]: mix batches until the mixture hits a target ratio or rate.
- `convchain` [`system: "same"|"between"`]: build a unit-conversion chain; choose × or ÷ at each step.
- `balance` [`form: "add"|"mul"|"check"|"word"`]: balance scale; apply the same operation to both sides to isolate x.
- `ftree` []: build a prime factor tree by choosing factor pairs.
- `hops` [`goal: "multiples"|"lcm"|"factors"`]: two hoppers on a number line; find where they meet.
- `tiles` [`mode: "combine"|"equivalent"|"simplify"`]: algebra tiles; combine like terms and build equivalent expressions.
- `powers` [`mode: "expand"|"value"|"write"`]: build repeated factors of a base, work out the value, or set a base and exponent (several answers can be right).

**Lesson → suggested generators and activity** (authors may swap within the catalogue when the lesson's own content says so;
a lesson with no activity listed uses `sort`/`match`/`nline` items and `pool`s instead):

```
2-1  pool only                      act none          2-7  decimalDivision          act ldiv
2-2  histogramRead                  act chartbuild    2-8  meanFind meanMissing     act dotbalance
2-3  medianFind                     act chartbuild    2-9  madCalc                  act dotbalance
2-4  boxplotRead                    act chartbuild    2-10 chooseMeasure            act dotbalance
2-5  rangeIqr                       act chartbuild    2-11 decimalAddSub            act nline
2-6  longDivision                   act ldiv          2-12 decimalMultiply          act areabox
3-1  ratioWrite                     act ratiomix      3-6  convertUnits             act convchain
3-2  unitRate                       act ratiomix      3-7  convertBetween           act convchain
3-3  eqRatioTable                   act ratiomix      3-8  unitRateWord             act ratiomix
3-4  ratioGraphRead                 act plot          3-9  eqRatioMissing           act ratiomix
3-5  compareRatios                  act ratiomix      3-10 convertUnits             act convchain
5-1  areaParallelogram              act sizer         5-6  pool only (nets, views)  act none
5-2  areaTriangle                   act sizer         5-7  surfaceAreaPrism         act sizer
5-3  areaTrapezoid                  act sizer         5-8  surfaceAreaPyramid       act none
5-4  areaComposite                  act sizer         5-9  areaRegularPolygon       act none
5-5  volumePrism                    act sizer         5-10 volumePrism              act sizer
6-1  fracDivWhole                   act barcut        6-9  wholeDivFrac             act barcut
6-2  fracDivMixed                   act barcut        6-10 mixedDivide              act barcut
6-3  exponentEval                   act none          6-11 fracDivWord              act barcut
6-4  orderOfOps exponentEval        act powers          6-12 lcmFind                  act hops
6-5  evalExpression                 act none          6-13 primeFactorization       act ftree
6-6  equivalentExpr                 act tiles         6-14 distribute               act areabox
6-7  factorsMultiples gcfFind       act hops          6-15 simplifyExpr             act tiles
6-8  combineLikeTerms               act tiles
7-1  integerOpposites               act nline         7-6  coordDistance            act plot
7-2  rationalNumberLine             act nline         7-7  polygonCoordinates       act plot
7-3  absoluteValue                  act nline         7-8  quadrantId               act plot
7-4  compareOrder                   act nline         7-9  reflectPoint             act plot
7-5  quadrantId                     act plot
8-1  solutionCheck                  act balance       8-5  ineqSolutionCheck        act ineq
8-2  solveAddSub                    act balance       8-6  solveInequality          act ineq
8-3  solveMulDiv                    act balance       8-7  writeEquationWord        act balance
8-4  writeInequality                act ineq
9-1  twoVarTable                    act plot          9-3  twoVarTable              act plot
9-2  graphRelationship              act plot          9-4  twoVarProblem            act plot
```

## 7. Data file — `data/practice-studio/<id>.json`

One authored file per lesson (the build composes the Practice and Challenge pages from it plus the lesson's own
`config.json`). Anything the config already authors (warm-up, practice tiers, connect check, exit ticket) is reused
automatically by the build; the file adds what the config does not have.

```jsonc
{
  "v": 1,
  "lesson": "5-2",
  "story": "…", "storyEs": "…",                       // mission briefing in the lesson's world
  "challengeStory": "…", "challengeStoryEs": "…",     // the night-shift twist for the Challenge page
  "getReady": [ /* 4 items */ ] | null,               // null keeps the config warm-up (only if it is on-topic)
  "getReadyWhy": "why the config warm-up was replaced",   // required when getReady is not null
  "noAct": false,                                       // true only for lessons the catalogue table lists as "act none"
  "fresh":  [ { "k":"gen", "g":"areaTriangle", "level":1 }, … 6 specs, levels 1,1,2,2,3,3, + 1 act ],
            // pool-only lessons (2-1, 5-6) instead give { "pool": [14+ authored items], "slots": 7 }
  "challenge": {
    "climb":     [ 6 gen specs, levels 2,2,3,3,4,4 ]   // pool-only lessons: { "pool": [12+ harder items], "slots": 6 }
    "missions":  [ 4 authored multi-step items (mc/num/tbl) with viz where natural ],
    "lab":       [ 2 act specs (level 3-4) + 1 sort/match item ]   // noAct lessons: 3 items from sort / match / nline,
    "detective": [ 3 err items + 1 "who is right?" mc ],
    "boss":      [ 5 authored mc/num items that mix this lesson's skills, then 1 wr "create your own" ]
  },
  "mastery": [ /* optional extra authored items for the Mastery Check, 0-2 */ ],
  "glossary": [ { "t":"base", "tEs":"base", "d":"…", "dEs":"…" } ]   // 3-5 words shown in the in-page word bank
}
```

Authoring rules:

1. Every number, context and answer is original to this file or generated; do not copy a config item verbatim.
2. Keep to THIS lesson's standard (`config.json` → `standard`, `contentObjective`, `vocabulary`). Pull prior skills only in
   `getReady`. Never introduce the next lesson's idea.
3. Every wrong choice is a plausible, NAMED misconception; the `f` line says what the student probably did and where it
   goes wrong, without printing the right answer. Give `tag[i]` as a kebab-case misconception name
   (`added-instead`, `used-slant-height`, `forgot-half`, `unit-mismatch`, …) reused across the lesson's items.
4. Place the right answer at A, B, C and D roughly evenly within the lesson (the validator checks).
5. Hints: 2-3 per item, a ladder. Hint 1 recalls the idea, hint 2 sets up the structure, hint 3 does the first step.
6. Spanish: `qEs` (or `tEs`/`pEs`), `xEs`, and `cEs` whenever a choice contains words; keep terms consistent with the
   lesson's `vocabulary[].translation`.
7. Missions are multi-step and set in the lesson's world; Boss items interleave skills (never one skill five times);
   Detective errors must be the lesson's real common mistakes (read `commonMistake` and `misconceptions` in config).
8. `wr` items always carry a 3-4 line `rubric[]` the student checks themselves against ("I used the word ___").
9. Figures: use `viz` for any item that is naturally visual; the dims drawn must equal the numbers in the stem.

## 8. Iteration hooks (built in so later versions plug in without a rewrite)

- **Registries**: `StudioGen.register`, `StudioAct.register`, `StudioWorlds` (CSS + JSON), `StudioViz` — a new skill,
  activity or world is one new file plus one line in the catalogue, with its own unit-test harness.
- **Versioned saves**: every studio saves `{v:2,…}` under `neft_studio_<id>_<mode>_v2`; `StudioStore.migrate()` upgrades
  older shapes, so a schema change never wipes a child's stars.
- **Event bus**: `window.StudioBus` emits `studio:answer {lesson, mode, itemId, kind, ok, tries, tag, hints, ms:null}`,
  `studio:solved`, `studio:section`, `studio:complete`, `studio:calibration`. Nothing listens in v2 except the Mistake Map
  and the Passport; a gradebook sync, Canvas grade passback, or teacher dashboard is one listener.
- **Feature flags**: `data-features` on `<body>` (`insight readaloud passport calibration share`) so a feature can be turned
  off per page or per class.
- **Adaptive routing (v3 slot)**: `StudioRouter.next(tabState)` is the single place that picks the next item; v2 returns
  "next in list"; v3 can route by Mistake Map.
- **Tutor slot (v3)**: `window.StudioTutor?.ask(item, state)` is called by the hint ladder after the last hint when the
  object exists (the AI tutor endpoint plugs in there).
- **Class goal (v3)**: Passport stamps are the unit a class goal can count; no leaderboards, ever.

## 9. Innovations shipped in v2

1. **Hands-on activities** (15 kinds) instead of only multiple choice — build the model, then answer.
2. **Fresh problems** — seeded generators with computed answers; "New numbers" on every generated item; mastery is a streak,
   not a single right answer.
3. **Mistake Map** — every wrong choice carries a misconception tag; the studio shows the student, privately, which
   misconceptions they tend toward and a one-line fix for each; "Redemption Round" retries only the missed skills.
4. **Confidence check** — on Boss items the student first says Guess / Pretty sure / Certain; the end screen shows how
   well their confidence matched their results (metacognition, no grades).
5. **Read-aloud** — every problem and explanation can be read in English or Spanish (Web Speech API, when present).
6. **Passport** — each finished studio stamps a cross-lesson passport on the finder page; stamps are for Practice and for
   Challenge separately, and a lesson earns a gold stamp when the Challenge boss is cleared.
7. **Worlds** — each lesson has its own look, voice, and mission story; no two neighbouring lessons look alike.
8. **Share code** — a short, anonymous "my results" text the student can paste to a teacher or family member.
