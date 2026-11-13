# Maintaining the Learning Labs studio layer

How to add to the labs without losing what this layer fixed.

## Source of truth

Lab pages are generated. Edit `tools/learning-labs/blueprints.mjs`, a lesson config, or the shared modules in `curriculum/learning-labs/shared/`, then run `npm run generate:learning-labs`. Never hand-edit `curriculum/learning-labs/*/index.html`. A new shared module must be added to the `?v=` hash list in `tools/generate-learning-labs.mjs`, or browsers keep the old bytes.

## The rules this layer enforces

1. **Workspace first.** The Investigate stage opens with the open question, then the model. Instructions go in the `studio-how` disclosure. Do not put reading above the model. Measure it: `npm run audit:learning-labs-first-screen -- <label>` and compare with `first-screen-final.md` (Chromebook: first control on the first screen in 45 of 46 labs).
2. **A tool mounts only where its mathematics belongs.** Gate by `lab.model.kind` / `mode`, as the 3D net inspector is gated to `solid`. A cross-topic widget goes in the closed "Partner and small-group tools" disclosure or is not built. Never ship invented classmates, peers or scores.
3. **44px targets** for everything a lab draws. `studio.css` sets the floor for `button`, `summary`, `select` and checkbox labels; do not lower it.
4. **Colour never carries meaning alone.** Use the `--studio-*` tokens in `studio.css` (quantity A teal, quantity B coral, active sapphire, prediction violet, correct green, misconception ink, hint amber) and always pair them with a column name, icon or sentence.
5. **Saved state is additive.** `state.version` stays `1`; new fields are added with `||=` or in `fresh()`, never by renaming or removing. A save written before a field existed must load, keep its work, and get an empty value (`verify-learning-labs-bridge-browser.mjs` tests exactly this for `experiments`).

## Adding a Representation Bridge to a lab

A bridge is one object in `shared/bridge-math.mjs`, keyed `kind:mode` of the lab's model (`data/learning-labs.json`). It declares:

- `quantities` (two), `domain` (a sentence), `invariants`, `representations`;
- `transformations`: each has `id`, `label`, `question` (the yes/no prediction), and `param` (or null);
- `misconceptions`: at least three, each with `id`, `name`, `response`;
- `describe(values)` returning `table` (with `tones`), `equation` (text, `note`, and optionally `fraction`, `power` or `half` for MathML), `words`, `invariant`, `a11y`;
- `test(values, id, param)` returning `{ before, after, preserved, why, misconception, fits, names }`.

Rules: whole-number or exact-fraction arithmetic only (`frac`, `fmul`, `feq`; never floats); `describe` and `test` throw `RangeError` outside the domain, and the domain must contain every setting the model's own controls allow; `before` and `after` may name only the bridge's quantities (the lab merges them into the full model vector); a misconception id returned by `test` must be declared; the explanation must state the numbers it is about. Add the object to `BRIDGES`, then extend `tools/learning-labs-bridge.test.mjs` with an independent integer oracle over the whole domain, and add the lab to the `wrong` table in `tools/verify-learning-labs-bridge-browser.mjs`. Register nothing else: `activities.mjs` mounts a bridge automatically when `bridgeFor(lab.model)` finds one.

## The Experiment Recorder

`shared/recorder.mjs`. `state.experiments = { v: 1, items }`, capped at 40. Entries are process evidence (prediction, change, outcome, relationship), never a score. A new feature that makes a student predict or test something should call `recorder.add(...)` rather than keep its own log.

## Checks

| Command                                               | What it holds                                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm run validate:learning-labs`                      | models, content, links (existing)                                                                       |
| `node tools/learning-labs-bridge.test.mjs`            | Bridge arithmetic over each model's whole domain; Recorder contract (in `npm test`)                     |
| `npm run validate:learning-labs-browser`              | the existing lab sweep, then the Bridge/Recorder browser suite                                          |
| `npm run validate:studio-lab-browser`                 | the practice studios import the same lab modules; run it after touching `model.mjs` or `shared/models/` |
| `npm run audit:learning-labs-first-screen -- <label>` | report only: first-screen layout and target size across all 46 labs                                     |
