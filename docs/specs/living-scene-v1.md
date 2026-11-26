# Living scenes v1

A living scene is a short See it · Try it · Explain it film the student steps
through: one SVG stage whose objects keep their identity while they change
form (bags of tiles → regrouped terms → an area model; a ratio batch → a tape
→ a double number line → a table → a graph). The motion is the explanation;
the end state of every step is always drawn, so nothing depends on watching.

## Where it appears

One authored field, three surfaces:

| Surface           | Where                                                                         | Mounted by                                                                    |
| ----------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Learn It (lesson) | under the worked example                                                      | `engine/components/vocab-learn-panel.js`                                      |
| Practice Studio   | "See it first" card above the stages (Practice only, not Part 2 or Challenge) | `scripts/lib/practice-studio-pages.mjs` + `/assets/homework-lesson-models.js` |
| Family practice   | Discover stop, after the lesson picture                                       | `scripts/lib/homework-living.mjs` + `/assets/homework-lesson-models.js`       |

## Authoring

```json
"launch": { "conceptIntro": { "livingScene": {
  "kind": "living-scene", "play": "distribute",
  "a": 3, "c": 4, "presets": [{ "a": 2, "c": 5 }, { "a": 4, "c": 3 }]
} } }
```

Use numbers the lesson itself uses. After editing, regenerate the studios
(`node scripts/generate-practice-studios.mjs`) and the family pages
(`node scripts/generate-homework-html.mjs`).

## Plays

`engine/components/living/index.js` is the list. Each play exports
`build<Name>Play(cfg)` and `validate<Name>(cfg)`. A play returns `null` for
numbers it cannot draw correctly; `tools/living-scene-configs.test.mjs`
fails when an authored config is refused, so a scene can never be a silent
blank.

## Kernel (`engine/core/living-scene.js`)

- One persistent stage; scenes move existing elements (`ctx.tween`).
- Reduced motion: tweens apply their end state at once.
- Gates: a scene with `gate: true` holds Next until the student predicts,
  chooses or manipulates. A miss shows that choice's cue (a question or a
  pointer at the picture), never the answer, and the choice stays open.
- Narration and feedback go to polite live regions; the stage is `role="img"`
  with a full description; every control is a button or a range with a label.
- Progress saves per scene under `nt-living:v1:<play>:<surface-lesson>`; a
  returning student reopens on the same scene (earlier scenes replay to their
  end state instantly).
- Language follows the page: `lang-mode-*` body classes on family pages, then
  `<html lang>`, then the saved preference. The mount module re-mounts living
  hosts when it changes.
- Colors, type sizes, radii and fonts are `--lsx-*` variables that resolve to
  the family design tokens (`--fm-*`) where present, with lesson-page fallbacks.
  Plays use only `var(--lsx-*)`.
- Narrow containers (≤ 520px) show "Scene n of N" instead of the scene dots.
