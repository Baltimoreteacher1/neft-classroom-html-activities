# Registered models (W4b)

One module per canonical model, keyed by `kind:mode`. `math.mjs` (`controls`, `evaluate`, `puzzle`) and `model.mjs` (`visual`, `guidance`)
ask `index.mjs` first; a model nobody registered behaves as before. A module `export default`s one object and imports only from
`./util.mjs` and `./draw.mjs` (never `../math.mjs`: that is a cycle).

```js
export default {
  kind: 'percent', mode: 'tape',          // kind must be the kind of the lab the lesson uses (data/learning-labs.json)
  values: [25, 80],                       // a valid starting setting
  controls: (model) => [                  // one entry per value; labelEs is the Spanish name (a lesson's bench.labels may override both)
    { label: 'Percent', labelEs: 'Porcentaje', min: 0, max: 100, step: 5 }, ...],
  evaluate: (model, values, options) => ({ value, label, unit, equation, note, ...extra }),   // pure; throws on an invalid setting
  visual: (values, result, model) => '<svg body>',                  // body only; coordinates inside viewBox
  viewBox: '0 0 600 300',                                           // optional
  guidance: ['What the picture shows.', 'What to try.'],           // two plain sentences, grade 6
  free: 0,                                // optional: the control a mission puzzle unlocks (default 0)
  round: (model, round, level) => ({ base, goal, free }),           // optional: own mission set-up (then YOU make it plannable)
  approx: true,                           // optional: the readout is irrational (regular polygon)
};
```

Rules (checked by `tools/studio-models.test.mjs`):

- `evaluate().value` is the readout a goal targets. Finite for every setting of every control. `equation` is one line a student can read
  as arithmetic; `note` is one or two plain sentences. Neither may print the answer a student is asked to find *before* they have set it up
  (the readout is the model's job, not a giveaway for "set the controls to reach X" tasks: the readout shows the CURRENT result).
- `visual` draws from `values`/`result` only. Use the lab's classes (`shape`, `shape-alt`, `shape-light`, `point`, `point-alt`, `open-point`,
  `solution`, `heavy`, `dashed`, `gridline`, `plot`) and the helpers in `draw.mjs`; the picture sits on white, so inline `fill`/`stroke`
  attributes are fine, but text must keep contrast >= 4.5:1 and never be smaller than 13px. Every element inside the viewBox.
  Meaning is never carried by colour alone (label it). No timers, no animation required.
- Every number a student reads off the picture is computed from `values`, never hard-coded.
- English only inside `visual`/`evaluate` (the studio adds the Spanish stack from the bench `labels`); Spanish for control names lives in
  `labelEs`.
