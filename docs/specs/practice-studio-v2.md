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
- `plug` []: replace each letter in an expression with its value, then tap the value (6-5).
- `faces` [`mode: "pyramid"|"prism"|"polygon"`]: set how many of each face or equal piece make up a surface or polygon (5-6, 5-8, 5-9).
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
5-1  areaParallelogram              act sizer         5-6  pool only (nets, views)  act faces
5-2  areaTriangle                   act sizer         5-7  surfaceAreaPrism         act sizer
5-3  areaTrapezoid                  act sizer         5-8  surfaceAreaPyramid       act faces
5-4  areaComposite                  act sizer         5-9  areaRegularPolygon       act faces
5-5  volumePrism                    act sizer         5-10 volumePrism              act sizer
6-1  fracDivWhole                   act barcut        6-9  wholeDivFrac             act barcut
6-2  fracDivMixed                   act barcut        6-10 mixedDivide              act barcut
6-3  exponentEval                   act none          6-11 fracDivWord              act barcut
6-4  orderOfOps exponentEval        act powers          6-12 lcmFind                  act hops
6-5  evalExpression                 act plug          6-13 primeFactorization       act ftree
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

## 10. Lab bench — the learning labs inside the studios

The 46 learning labs (`/curriculum/learning-labs/`, 2 lessons each) own a live model, a predict-first routine, investigations, a
create task and an expedition game. Those now live INSIDE each studio instead of in a page of their own: `data/practice-studio/<id>.json`
carries a `bench` object and the build adds its items to one section per page. The lab pages stay as they are. The mathematics is the
labs' own — `curriculum/learning-labs/shared/{math,model,predict,expedition}.mjs`, imported at runtime and stamped with a content hash
(`labV`) so a lab fix reaches every studio. Unit 4's five lessons have hand-built pages, so their bench lives in
`data/practice-studio-u4/<id>.json` and `scripts/inject-u4-lab-bench.mjs` writes the same items into both pages of each lesson
(`assets/studio/lab-embed.js` gives the shared kinds a small ctx; no stars, no change to the page's own state).

```jsonc
"bench": {
  "lab": "ratio-railway",                       // a lab in data/learning-labs.json that lists this lesson
  "model": { "kind": "growth", "mode": "ratio-graph", "values": [3, 0, 4] },   // same kind as the lab; any mode; values on each control's grid
  "explore":     { "q","qEs", "goal", "miss"?,"missEs"?, "x","xEs", "h","hEs" },    // item kind "lab"  -> Practice section 4, first
  "investigate": { /* a wr item: p,pEs,fr,frEs,min,kw,kwEs,rubric,rubricEs,x,xEs,h,hEs */ },  // Practice section 4, second
  "stretch":     { /* like explore; miss/missEs REQUIRED; a different goal */ },    // item kind "lab"  -> Challenge section 3, first
  "create":      { /* a wr item */ },                                               // Challenge section 3, after the existing items
  "mission":     { "finale": "Signal Switch" }                                      // item kind "mission" -> both pages, last in that section
}
```

Item ids are explicit (`lab-explore`, `lab-investigate`, `lab-stretch`, `lab-create`, `lab-mission`) and the items are added AFTER the
section's existing items are stamped, so a student's saved progress on existing items keeps its keys.

**Goals.** Exactly one of: `{target, free}` (only control `free` changes; solved when the model's readout equals `target`),
`{match: {index: value}}` (solved when those controls hold those values; reflections, "place the point"), `{pass: boolean}`
(inequality models; solved when the test value does or does not satisfy the rule). A wrong check says `too high` / `too low` (target goals)
and the item's `miss` line; it never prints the answer. Predictions (up / down / same) are judged by the model's own readout and never graded.

**What the gate refuses** (`benchProblems`, run by `validate:practice-studio-data` and by the generator). The mathematics is SEARCHED, not read:
a goal no setting reaches; a model that already starts solved; a solving value one click from the start or at the end of its slider; a
starting readout (equation + note) that already prints the solving value; an explanation that does not state the solving value in both
languages; a hint that states it; text that says "Output" for a model whose readout has another name; a missing Spanish sibling or
English copied into it; timer language; `x`/`*` for multiplication. The mission is checked on all nine puzzles (3 destinations x 3
levels): none may start solved, every target must be a terminating decimal a student can plan, at most four settings may solve it, the
puzzles must differ, and every value they set must be one the page's controls accept.

**The mission text is generated** (`missionText(model)`), because the game asks one thing and a per-lesson sentence could only over-promise: it
unlocks one control (or, for a reflection, one coordinate), states a target, and checks the build when the student tests it. A bench
therefore carries only the lab's `finale`. The game plans difficulty from the student: a clean restore (no hint, first test) raises the next
puzzle one level, a struggle lowers it, and the field badge is earned only for a first-test, no-hint restore.

**Kinds** (`assets/studio/kinds-lab.js`). `lab` mounts the model in a shadow root (lab.css styles whole pages, so it is adopted into the root
and the prompt, hints and feedback stay in the studio's DOM), shows what the picture shows, asks for a prediction, and checks the goal.
`mission` mounts the lab's expedition (three destinations, each a different construction, hints and retries free, sound off until the
student turns it on) and solves when all three are restored. A lab file that cannot load leaves the item unsolved and lets the student move
on, unlike `broken`.

**Gates.** `tools/studio-lab-bench.test.mjs` (goals, mission puzzles of every bench AND every lab, page/data agreement, Unit 4 injection
freshness) and `npm run validate:studio-lab-browser` (every bench on both pages, driven as a student: a wrong test that must explain, the
right setting, the written items, the whole adaptive mission, reload-resume, the Spanish stack, 375px, axe).

**Words (`labels`).** A bench names its model in the lesson's own words, English and Spanish: `labels.controls[<index>] = {en, es}` for every control
but "Unused", and `labels.readout = {en, es}`. The gate requires the explore and stretch prompts (both languages) to use the readout's name or the
unlocked control's name, so "pieces", "portions" and "serving size" can never be three words for one idea (a student found the 6-9 mission confusing
for exactly that reason). The names reach the controls, the goal bar, the prediction question, the click-to-place chips and the mission. A bench
that opens on the square-pyramid net says so with `model.shape: "pyramid"` (the mission itself is played on the prism formula).

**What the student sees (added after a five-lens expert panel: learning science, game design, UX/accessibility, ESOL/WIDA, teaching).**
- *An honest loop.* The page states the GOAL ("Goal: Number of pieces = 36 · You can change: Ribbon length"); it never shows how close a build is. A
  test names only the direction ("too high"), and every test leaves a line in **My tests** (the build's equation and its direction) that the student
  can read back. A lab miss does not reset the streak and does not enter the Mistake Map (a direction is not a misconception). A "how sure are you?"
  tap before the first check feeds the studio's calibration record.
- *A hint ladder in the mission.* Press 1 asks a question, 2 states the relationship, 3 shows a worked build with DIFFERENT numbers to map across; only
  the third counts as heavy help. The difficulty ladder rises with the student and stops at the top (it used to wrap round to the easiest); a replay moves to
  new targets (rounds 0-8), not a new level.
- *The mission remembers.* Each restored place records its build's equation in the Expedition log, and the student is asked "How did you find it?" after
  every restore (the order turns with the destination). The copy-my-results note carries predictions and mission progress, never names.
- *Bilingual all the way down.* Written items show the Spanish frame, rubric and word list already authored; the lab shell, the prediction verdicts, the
  game and its 46 worlds, the controls, the click-to-place chips and the error messages carry Spanish beneath the English. A student may write in either
  language; the Foundational pathway asks for 60% of the length.
- *Accessible.* Comfort font and spacing reach the model by inheritance; selected state has a 3:1 outline; an invalid box is marked `aria-invalid` and
  described; locked controls say they are locked; focus survives a click-to-place and a return to the map; the "Touch the picture" hint sits in the
  controls column; the goal and the Check button sit together above the model.
- *On paper and offline.* Every lab and mission item carries a hidden paper twin (the goal, a try-it table named with the model's own controls, a
  sentence frame) that prints and that shows when the lab files cannot load. Data Saver and 2G skip the idle preload. Read aloud now reads the game's
  goal and feedback and says plainly when a device has no Spanish voice.
- *Teachers and shared computers.* "I am finished on this computer" (in My thinking) clears this lesson's saved work after a confirm; links accept
  `?s=4&i=1` (section, problem) and `&lang=es` to send a student straight to a station.

