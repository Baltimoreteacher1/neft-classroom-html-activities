# Flagship Lesson Template

A story/simulation-driven **shell** that wraps the existing 6-phase lesson
engine. It does **not** replace the phase engine (`engine/core/lesson-renderer.js`)
— it boots it and layers on narrative framing, a simulation centerpiece, and a
completion sequence.

## What it adds

1. **Mission intro** — a full-screen "mission briefing" before the lesson.
2. **Scene HUD** — a per-phase narrative banner that updates as the student
   moves through the 6 phases (Launch, Vocab, Explore, Practice, Connect,
   Reflect).
3. **Simulation centerpiece** — optionally overrides the Explore phase with a
   manipulative (e.g. `net-folder`, `coordinate-plane`, `fraction-bars`,
   `algebra-tiles`).
4. **Level 1 / Level 2 branching** — inherited from the engine. The Practice
   phase already shows the Level 1 / Adaptive / Level 2 selector and serves
   adaptive items via `engine/core/adaptive.js` + `engine/core/levels.js`.
5. **Finale** — a satisfying "mission accomplished" sequence on completion.

## How to author a flagship lesson

Create a lesson folder (e.g. `lessons/5-3-flagship/`) with the standard three
files. The only difference from a normal lesson is the entry point and an extra
`flagship` block in `config.json`.

**`index.html`** — identical to a normal lesson (a `#app` div + module script).

**`lesson.js`**

```js
import { bootFlagship } from "@engine/templates/flagship/flagship.js";
import config from "./config.json";
bootFlagship(config);
```

**`config.json`** — the **same shape** as a normal lesson (`vocabulary`,
`launch`, `explore`, `practice`, `connect`, `reflect`, etc.) **plus** an
optional top-level `flagship` block.

## The `flagship` block schema

```jsonc
{
  // ...all the normal lesson config fields (vocabulary, launch, practice, ...)

  "flagship": {
    // Opening mission briefing (shown before the lesson starts).
    "mission": {
      "eyebrow": "Sky Harbor Mission", // small label above the title
      "title": "The Triangular Skylight", // mission title (defaults to lesson title)
      "story": "You are the lead architect…", // narrative hook (1–3 sentences)
      "objective": "Calculate the area of…", // optional one-line goal
      "cta": "Enter the Studio →", // optional start-button label
    },

    // Per-phase narrative banner. `phase` MUST be one of:
    //   "launch" | "vocab" | "explore" | "practice" | "connect" | "reflect"
    // Any phase you omit simply shows no banner.
    "scenes": [
      {
        "phase": "launch",
        "icon": "🏗️", // emoji shown in the banner
        "name": "Site Walkthrough", // scene title
        "text": "Survey the build site…", // 1-sentence framing
      },
      // ...one entry per phase you want to frame
    ],

    // Optional simulation centerpiece. When present, it OVERRIDES the Explore
    // phase's component with this one. `type` is any registered component type
    // (e.g. "net-folder", "coordinate-plane", "fraction-bars", "algebra-tiles",
    // "number-line", "coordinate-grid"…). All other keys are passed straight
    // through to that component as its config.
    "simulation": {
      "type": "net-folder",
      "instructions": "Fold this flat net into a 3D solid…",
      "solid": "cube", // component-specific props…
      "question": {
        "stem": "When this net folds up, what solid does it form?",
        "choices": ["A cube", "A triangular prism", "A cylinder", "A pyramid"],
        "correctIndex": 0,
      },
    },

    // Completion sequence shown when the student finishes all 6 phases.
    "finale": {
      "emoji": "🏆",
      "title": "Skylight Approved!",
      "text": "The city signed off on your design…",
    },
  },
}
```

### Notes for conversion agents

- **Everything in `flagship` is optional.** A config with no `flagship` block
  still boots through `bootFlagship` as a plain themed lesson.
- The `simulation` block is the cleanest way to give a lesson a 3D / interactive
  centerpiece without editing the base `explore` config. If you do **not** set
  `simulation`, the lesson's own `explore` config is used unchanged.
- **Level 1 / Level 2** require no flagship config — author the practice tiers
  as usual: `practice.approaching` → Level 1, `practice.onLevel` → core,
  `practice.extending` → Level 2. Add an optional `"scaffold"` (or `"hint"`)
  string to any `approaching` item to show an always-visible Level 1 hint.
- Keep `lessonId` unique (e.g. suffix `-flagship`) so progress saves don't
  collide with the non-flagship version.

## Reference implementation

See `lessons/5-3-flagship/` — a flagship conversion of the Area of Triangles
geometry lesson, using the `net-folder` simulation as its centerpiece.
