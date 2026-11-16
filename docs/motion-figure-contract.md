# Motion figure contract

A **figure** is a lesson-specific, animated, mathematically exact picture of what a lab model computes. It rides under the lab picture in
Practice and Challenge (`curriculum/learning-labs/shared/model.mjs`) and is the "See it move" card on the Family page. One module per
representation family lives in `shared/motion/figures/<group>.mjs` and default-exports an array of figures. The registry
(`shared/motion/figures/index.mjs`) keys them by the lab model key, `"kind:mode"`.

Reference implementation of the same ideas (not of the interface): `shared/motion/exponent-copies*.mjs`.

## Interface (`Figure`, typed in `shared/motion/figures/mount.mjs`)

```js
export default [{
  id: "fraction-partition-count",
  keys: ["fraction:servings", "fraction:ribbon", "fraction:field"],   // lab models it accompanies
  title: { en: "...", es: "..." },
  controls(key) -> [{ label, labelEs, min, max, step }],   // IDENTICAL count/order/min/max/step to the lab's own controls for that key
  build(key, values) -> model,    // pure, exact, deterministic; throw RangeError for a setting the lab would refuse
  render(model, { lang, width }) -> { body, width, height },   // SVG body only, viewBox 0 0 width height
  scene(root, model) -> { durationMs, tracks },   // tracks scheduled by FRACTION of the scene (see shared/motion/motion.mjs)
  describe(model, lang) -> string,   // complete text equivalent (every number the picture shows), grade 6
}]
```

A key is either a standalone lab's model (`tools/learning-labs/blueprints.mjs`, `kind:mode`) or a REGISTERED model that a Practice bench uses
(`curriculum/learning-labs/shared/models/<name>.mjs`, e.g. `ratio:tape`, `percent:benchmark`, `solid:faces`): the same figure may claim both when they
teach the same lesson. For a registered key, `controls`/`evaluate` live in that module, not in `math.mjs`. `values` are the lab's values for that key, in the lab's order. Their meaning is defined in
`curriculum/learning-labs/shared/math.mjs` (`controls()` and `evaluate()`): read the `case` for your kind. The figure must agree with
`evaluate()` on the headline number (a test of yours should compare them).

## Rules (all enforced by `tools/motion-figures.test.mjs`, which sweeps every legal setting, EN/ES, widths 300/400/600)

1. **The mathematics is computed, never typed.** Use `shared/motion/exact.mjs` (`Rat`, `power`, `commas`, `parse`). No float arithmetic for anything displayed; no `eval`.
2. **Show what changes, not just totals.** The point of each figure is a representation a student can watch change step to step with each step labelled by its own operation (as the exponent figure labels `3 × 3 × 3 = 27`, `3 copies of 9`, `×3`). Make it specific to the lesson: a fraction lesson must never reuse an exponent or ratio animation.
3. **Not by colour alone.** Right/wrong, part/whole, copy/original need a symbol, label, or solid-vs-dashed cue as well. Use only colours from `shared/motion/tokens.mjs` (`COLOR`, `COPY_FILLS`) written as hex literals: the mount swaps them for CSS variables. No violet/purple.
4. **Text:** every `font-size` is 13 or more, each `<text>` is at most 80 characters (split into lines), nothing outside the viewBox at width 300, 400 and 600 (lay out from `width`; 300 is a phone). Use `font-weight` and fill only through attributes.
5. **Bilingual:** every word the student reads exists in English and Spanish, written as a mathematics teacher would (not word-for-word; say "el total" not "el entero" for a whole, use "×" and "÷", true minus "−", no spaced percents). Do not translate by string replacement.
6. **Fractions are drawn stacked** (numerator over a bar over denominator) or worded ("3 divided by one fourth"); never write ambiguous inline `3 ÷ 1/4`.
7. **Motion:** `scene` returns tracks of `{ els, from, to, keyframes }` (fractions 0..1 of `durationMs`, 600-9000 ms). Keyframes animate only `opacity` and `transform` (add `transformBox: "fill-box", transformOrigin: "center"` for scaling SVG). The first keyframe is the transient state, the last is the natural state, so cancelling leaves exactly the static picture. Mark animated groups with classes/`data-step` in `render`. Deterministic: no `Math.random`, no clock.
8. **Static is complete:** the un-animated SVG must be the finished, readable picture (reduced motion, print and failed script show it).
9. **Misconception cue:** where the lesson has a well-known wrong move (adding instead of scaling, dividing the wrong way), show it as a dashed "not this" line the way the exponent figure does, but only when it is actually different from the right answer.
10. TypeScript-clean (`checkJs` covers `shared/`): JSDoc types, no `@ts-nocheck`. Biome-clean (`npx biome check --write <your files>`).

## Your job, and its limits

Edit ONLY your assigned `shared/motion/figures/<group>.mjs` (you may add helper files `shared/motion/figures/<group>-*.mjs`) and add your own tests as `tools/motion-<group>.test.mjs` (exact-value tests: expected numbers written by hand or by a different route; a headline-agrees-with-`evaluate()` test per key). Do not edit `index.mjs`, `mount.mjs`, `tools/motion-figures.test.mjs`, any shared lab or family file, or anything else, and do not run git commands (no commits, no stash). Do not change a lesson's mathematics, objective or standard.

Verify with: `FIG=<id> node --test tools/motion-figures.test.mjs`, your own test, `npx biome check --write <your files>`, and
`npx tsc --noEmit -p tsconfig.json 2>&1 | grep shared/motion`. Then LOOK at it: render each key at width 400 and 340 in EN and ES to a PNG
(Playwright is in node_modules; see `/private/tmp/claude-501/motion-shots/shoot.mjs` for how the exponent figure was screenshotted) and fix
overlaps, clipped or wrapped labels, text with no fill set, and stray marks. Report which keys you finished, anything you could not make
correct, and any content you found ambiguous (flag it; do not change it).

## Think it through (optional methods)

`headline(model, lang) -> { label, value, approx? }` and `wrong(model, lang) -> null | { value, say }` make a figure usable by the Standard,
Challenge and Family flows (`shared/motion/figures/think-ui.mjs`, logic in `think-logic.mjs`). `headline.value` and `wrong.value` are plain strings
`exact.mjs parse()` reads; `wrong` is non-null exactly when the figure draws its dashed "not this" card and never equals the headline;
`thinkWrong: false` on a figure says its `wrong` does not answer the headline question, so Challenge skips error analysis for it.
`MOTION_COVERAGE=1 node --test tools/motion-figures.test.mjs` requires every registered figure to support the flow.

- **Standard (Practice):** See one (watch the figure) -> Try one (predict a NEW setting; a miss is diagnosed, never answered; the figure keeps
  showing the numbers already seen, and shows the new setting only once it is solved) -> Explain (the student's own sentence, kept on the device) -> Apply (another new equivalent problem).
- **Challenge:** Spot the slip (error analysis built from `wrong`) -> Build it (set the controls so the headline is exactly a target; any setting that works is accepted; too high / too low feedback) -> Explain.
- **Family:** See one -> Try one, ungraded wording.
