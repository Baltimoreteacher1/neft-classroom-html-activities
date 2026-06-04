# Graphic-Novel Engine — Story Data Format

One engine (`gn-engine.css` + `gn-engine.js`) renders every novel. A novel is a
single offline HTML file that inlines the engine and one `window.GN_STORY`
object. Authors only ever write the `STORY` object; the engine never changes.

## Why this shape

The old files baked each act into hand-written HTML + per-act JS (`initAct1`,
`initAct2`…). That is why 20 files could not share a comic system. Here, **all
narrative + math is data**; panels, bubbles, pop-ups, locking, scoring, and the
master challenge are produced by the engine.

## Top-level object

```js
window.GN_STORY = {
  meta:   { ... },     // identity, art path, theme
  cast:   { ... },     // speakers (protagonist + companion + narrator)
  cover:  { ... },     // title page
  acts:   [ ... ],     // ordered chapters; each is panels + voiced math
  glossary: [ ... ],   // word bank
  complete: { ... },   // mission-complete + master-rank challenge
};
```

### meta

```js
meta: {
  unit: 1, version: 1,            // version 1 = Support, 2 = Enrichment
  level: "Support",              // shown on the level pill
  title: "Prime Station: The Factor Code",   // may contain HTML entities
  standard: "6.NS.4",            // copied verbatim from the source file
  artBase: "../_art/unit1/",     // reused existing backgrounds
  home: "../index.html",
  theme: { "--accent": "#ff8a3d", "--accent2": "#3da5ff" }  // optional overrides
}
```

### cast — the speaker model (with optional avatar slot)

Every speaker is referenced by a short key used throughout the story.

```js
cast: {
  cadet: {                       // PROTAGONIST = the reader's stand-in
    name: "Cadet",
    role: "protagonist",         // its replies are the answer choices
    color: "#ff8a3d",            // bubble accent + name-tag color
    tagIcon: "🧑‍🚀",              // optional; falls back to first letter
    avatar: null,                // OPTIONAL image (relative to artBase).
                                 // null → engine shows a styled name tag only,
                                 // so illustrated character art can drop in
                                 // later with ZERO code changes.
    blurb: "You"                 // shown on the cover cast row
  },
  axis: {                        // COMPANION / GUIDE
    name: "AXIS",
    role: "companion",
    color: "#3da5ff",
    avatar: null,
    blurb: "Station AI · jumps to the wrong factor"
  },
  narrator: { name: "Station Log", role: "narrator", color: "#3da5ff" }
}
```

- `role: "protagonist"` → bubble sits **right**, tag shows “· YOU”.
- `role: "companion"` → bubble sits **left**.
- `role: "narrator"` → caption-style bubble (no character voice).
- **Avatar slot:** when `avatar` is a filename, the name tag shows that
  circular image; when `null`, it shows a colored initial chip. Either way the
  bubble, tail, and layout are identical — illustrated portraits are a drop-in.

### The misconception-as-companion mechanic

On ~one beat per act the **companion voices the common misconception out loud**
(`misconception: true` on the beat → an “uh-oh” glow). The matching challenge’s
correct answer is the protagonist _catching_ it; the wrong line maps to the
existing distractor. The math distractors never change — they just become a
character moment instead of a trick option.

### acts → steps

An act is an ordered list of **steps**. The engine plays them top to bottom.

```js
acts: [
  {
    id: "act1",
    tab: "Act 1: The Locked Bay", // tab label (lock icon added by engine)
    kicker: "Act 1 · Lesson 1-1",
    title: "The Locked Bay",
    advanceLabel: "Open the airlock 🚀", // button that unlocks the next chapter
    steps: [
      // STEP type "beats": a panel (background) + a short burst of dialogue
      {
        type: "beats",
        art: "airlock-locked.png",
        alt: "The cadet faces a locked airlock with a glowing code panel",
        lastLabel: "Try the lock ▶",
        beats: [
          {
            who: "axis",
            caption: true,
            en: "Cadet! This airlock is sealed with a FACTOR CODE.",
            es: "¡Cadete! Esta puerta tiene un CÓDIGO DE FACTORES.",
          },
          {
            who: "cadet",
            en: "Factor codes need a prime number. Let me read the panel.",
            es: "Los códigos usan un número primo. Voy a leer el panel.",
            vocab: [
              {
                term: "prime number",
                en: "A number bigger than 1 with only two factors: 1 and itself.",
                es: "Un número mayor que 1 con solo dos factores: 1 y él mismo.",
              },
            ],
          },
          {
            who: "axis",
            misconception: true, // companion is wrong on purpose
            en: "Easy — 9 is prime, right? I’ll enter 9.",
            es: "Fácil, 9 es primo, ¿no? Voy a poner 9.",
          },
        ],
      },

      // STEP type "challenge": the math, VOICED by a character; choices = replies
      {
        type: "challenge",
        id: "1a",
        ask: {
          who: "axis",
          en: "Wait — which number is actually prime? Tell me before I lock us out!",
          es: "Espera, ¿cuál número es primo de verdad?",
        },
        hint: {
          en: "Try to split each number as 2 × something…",
          es: "Intenta dividir cada número como 2 × algo…",
        },
        frame: {
          en: "“The number ___ is prime because it has only ___ factors.”",
          es: "“El número ___ es primo porque solo tiene ___ factores.”",
        },
        choices: [
          {
            en: "Not 9 — that’s 3 × 3. The prime is 7.",
            correct: true,
            es: "9 no: es 3 × 3. El primo es 7.",
          },
          {
            en: "You’re right, 9 is prime.",
            correct: false, // = companion's misconception
            es: "Tienes razón, 9 es primo.",
          },
          { en: "15 is prime.", correct: false, es: "15 es primo." },
        ],
        goodEn: "✅ 7 is prime — only 1 and 7 divide it. Lock one opens!",
        goodEs: "¡Correcto! 7 es primo. ¡Primer cerrojo abierto!",
        badEn:
          "❌ That number splits into smaller factors, so it isn’t prime. Use the hint.",
        badEs: "Ese número se puede dividir, no es primo. Usa la pista.",
        solveArt: "airlock-open.png", // optional art swap on solve
        solveAlt: "The airlock slides open with golden light",
        solveBeat: {
          who: "cadet",
          en: "Open! Now the full code…",
          es: "¡Abierto! Ahora el código completo…",
        },
      },
    ],
  },
];
```

Step fields:

| field                       | on         | purpose                                                                             |
| --------------------------- | ---------- | ----------------------------------------------------------------------------------- |
| `type`                      | every step | `"beats"` or `"challenge"`                                                          |
| `art`, `alt`                | both       | panel background (reuses existing `_art`)                                           |
| `beats[]`                   | beats      | sequential bubbles; each `{who,en,es,pos?,vocab?,callout?,caption?,misconception?}` |
| `lastLabel`                 | beats      | label of the Next button on the final beat                                          |
| `ask`                       | challenge  | the question, voiced as a bubble `{who,en,es,vocab?,callout?,misconception?}`       |
| `hint`                      | challenge  | folds into a “Need a hint?” bubble                                                  |
| `frame`                     | challenge  | the sentence frame, folded into a “Writing coach” bubble                            |
| `choices[]`                 | challenge  | protagonist replies `{en,es?,tree?,correct}`                                        |
| `goodEn/Es`, `badEn/Es`     | challenge  | feedback                                                                            |
| `solveArt/Alt`, `solveBeat` | challenge  | optional art swap + reaction line on solve                                          |

### Pop-ups (layered on the panel, never replacing it)

- **Vocab** — add `vocab:[{term,en,es}]` to any beat/ask. The engine wraps the
  term in the English text with a tappable tag → definition popover (EN + ES).
- **Hint** — `hint` on a challenge → tappable “Need a hint?” fold-out.
- **Writing coach** — `frame` on a challenge → tappable fold-out (sentence frame).
- **Callout** — `callout:{x,y,icon,title,en,es}` on a beat/ask pins a pulsing dot
  at `x%,y%` of the panel that opens a popover pointing at part of the scene.

### glossary

`[{ ico, en, es, def }]` — unchanged from the source files.

### complete (+ master-rank challenge)

```js
complete: {
  art: "mission-complete.png", alt: "…", badge: "🎉🚀⭐",
  titleEn: "Mission Complete!",
  en: "You restored Prime Station using prime factorization and the GCF!",
  es: "¡Restauraste la estación usando factorización en primos y el MFC!",
  master: {
    headingEn: "Prove your rank to certify your Master Certificate!",
    promptEn: "The final chest needs the GCF of 18 and 27. Biggest number that divides both?",
    promptEs: "El cofre final necesita el MFC de 18 y 27…",
    choices: [
      { en: "A) 3 (common, but not greatest)", correct: false },
      { en: "B) 9 (the Greatest Common Factor) ✅", correct: true },
      { en: "C) 18 (divides 18, not 27)", correct: false }
    ],
    goodEn: "🏆 Master Rank Certified! 🌟",
    certifyTitle: "🏆 Master Certified: Mission Complete!"
  }
}
```

## Preserved contracts (do not rename)

The Neft results pipeline (`/teacher-tools/nt-results.js`, loaded at the bottom
of every file) scores by reading the rendered DOM. The engine guarantees:

- every math group is `.choices` with `.choice` buttons; the solved correct one
  gets class `correct`;
- the master-rank group is `#choicesComplete` (the tracker excludes it);
- the finish scene is `#scene-complete` and gets `show`/`active` when reached.

Student name persists under `localStorage["nt_gn_student"]` (existing `nt_`
convention). The per-file tracking `<script>` and the
`/assets/nt-page-enhance.js` include are appended unchanged.

## Accessibility guarantees (engine-level)

WCAG-AA bubble contrast (light bubble + scrim over art), resizable text (A+
control → `lg`/`xl`), full keyboard nav (tab roving arrows, focus rings,
Esc closes pop-ups), 48 px minimum targets, `aria-live` speech region, reduced-
motion support, and functional layout down to 320 px (panel aspect ratio steps
16:9 → 4:3 → 1:1; bubbles reflow to 94% width).

## Literacy layer (SP1) — comprehension, interactions, dual scoring

### `meta.readingStandard`
Default reading-comprehension standard for the novel's Reading score rollup,
e.g. `"RL.6.1"`. Used by the results tracker for the "Reading Comprehension"
section.

### `comprehension` step type
A scored READING question, a sibling of `challenge`. Same flow (voiced `ask`,
choices/interaction, gating), but tagged as reading so it scores separately.

```js
{ type: "comprehension",
  id: "c1",
  skill: "main_idea",          // one of the 7 skills (see below) — REQUIRED
  standard: "RI.6.2",          // RL/RI.6.x — REQUIRED (aggregates the Reading score)
  dok: 2,                       // optional Depth of Knowledge 1–3 (shown as a chip)
  ask: { who: "log", en: "…", es: "…" },   // the question, voiced/captioned
  passageRef: "act1.beat2",    // optional authoring note: which beat/panel it points back to
  interaction: "mc",           // "mc" (default) | "evidence" | "sequence"
  choices: [ { en, es?, correct } ],        // for mc / evidence (exactly one correct)
  items:   [ { en, es?, order } ],          // for sequence (>=2, numeric order)
  hint, frame,                  // optional (folded "hint" / "writing coach")
  goodEn/Es, badEn/Es }         // optional (engine supplies defaults if absent)
```

`skill` values (→ publisher label): `vocab_in_context` (Vocabulary in Context),
`main_idea` (Determine Main Idea), `key_details` (Key Details), `sequence`
(Sequence / Cause & Effect), `inference` (Make an Inference), `cite_evidence`
(Cite Text Evidence), `prediction` (Make a Prediction). The engine renders a
`.reading-tag` header with the skill, standard, and DOK.

### `interaction` field (on a comprehension OR challenge step)
- `"mc"` / omitted — multiple-choice buttons (default; existing behavior).
- `"evidence"` — each `choices[]` renders as a tappable "text-evidence" line;
  selecting the `correct` one scores (cite-evidence). Reuses the choice contract.
- `"sequence"` — `items[]` render as drag/keyboard-reorderable cards; correct
  order = ascending `order`. On a correct check the engine emits a hidden
  `.choice.correct` so the results tracker records it.

### Dual scoring contract
Comprehension `.choices` groups carry `data-score-group="reading"` (and
`data-standard`). The results tracker reports two sections — **Math** (existing
`meta.standard`) and **Reading Comprehension** (`meta.readingStandard`) — into
the `NTResults`/EduPulse pipeline. Math challenge groups are unchanged. The
`.choices` / `.choice.correct` / `#choicesComplete` contract is never renamed.

### Read-aloud, notebook
Every bubble (and comprehension `ask`) gets a 🔊 read-aloud control (Web Speech
API, EN + ES) when the browser supports it. The mission-complete screen renders
a printable "My Reading + Math Log" (`#nt-notebook`) collecting each solved
item; a print button triggers the print stylesheet (`@media print`).
