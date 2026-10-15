# "Watch me" figures: `launch.conceptIntro.iDo.viz`

Joel (2026-10-15): the "Watch me" worked example needs a picture in every lesson. Today a picture appears only where
`scripts/lib/learn-figures.mjs` can parse one out of the sentences (24 of the 72 lessons in Units 2-9). The other 48 now take an AUTHORED figure.

`iDo.viz` is one figure spec for the library the Practice Studios use (`assets/studio-viz*.js`; types and fields in
`docs/specs/practice-studio-v2.md` section 3: `dots hist box bars nline coord shape prism tape dnl table bar1`). It is drawn
beside the steps in the interactive lesson (Learn It, "Watch Me Solve It") and above the worked example on the generated
`learn.html`, by the same renderer (`scripts/lib/worked-viz.mjs`).

## Rules

1. **The figure is THIS worked problem.** It draws exactly the situation `iDo.lines` states, with the lesson's own numbers: if the example
   finds the median of 3, 7, 9, 12, 15, the figure is a dot plot or number line of those five values with the median marked. A figure of
   a different example, or a generic picture, is worse than none (a student trusts the picture). If no figure type can draw this example
   truthfully, author none and say so in your report.
2. **Every number the figure prints is a number the lines state.** `scripts/validate-learn-figures.mjs` checks the figure's text
   alternative against the lines; run `node scripts/validate-learn-figures.mjs`.
3. **Use the figure type that carries the lesson's representation** (the one the lesson teaches with): tape/dnl/table for ratios, percents and
   fractions, `shape`/`prism` for geometry, `nline`/`coord` for integers, coordinates and inequalities, `dots/hist/box/bars` for statistics,
   `tape` for equations and expressions, `table` for tables of values. Read the type's fields in the studio spec and in the matching figure code
   before you write the spec; render it to check (see below) and LOOK at it.
4. Labels and alternatives: use the optional `alt` field to state in one sentence what the figure shows ("Tape diagram: 3 equal parts of 4 make 12"),
   and keep every printed label short. Use real math typography in labels: × ÷ − (U+2212) ½, not * / -.
5. **Do not change `iDo.lines`, `linesEs`, or any other field of the lesson config.** Add only `viz` inside `launch.conceptIntro.iDo`
   (`lessons/<id>/config.json`, 2-space JSON, keep key order, keep the trailing newline).
6. Lessons that already have a figure (workedFigure(config) draws one) are NOT yours, and neither are 2-6, 2-7 and 6-13 (their steps draw a live
   long-division or factor-tree figure that an authored figure would replace).

## How to check your work

```
node -e 'import("./scripts/lib/learn-figures.mjs").then(m=>{const c=JSON.parse(require("fs").readFileSync("lessons/ID/config.json","utf8"));const f=m.workedFigure(c);console.log(f&&f.kind,f&&f.alt)})'
node scripts/validate-learn-figures.mjs          # must end with the success line
```
To see a figure: write a small node script that prints `renderWorkedViz(spec)` to an .svg file in your scratch directory and open it with the
Read tool (it renders as an image). Look at every figure you author.

Do not run generators, `qa:fast`, `npm test`, or commit. Report: the lessons you authored a figure for (with the figure type), the lessons you
skipped and why.
