# wida-studio — data contract

Engine id `wida-studio`. One data file per collection: `data/wida/<id>.js`, `export default {...}`. One collection = one domain
(Listening, Speaking, Reading or Writing) = 3 to 8 tasks of that domain. Plain ES module, no DOM, importable by Node.
The collection IS the activity: it carries `engine: "wida-studio"`, so the player, the preview and `shell.openActivity` mount it.

Everything here is **original WIDA-aligned practice**. It is not an official WIDA or ACCESS item, score or prediction. Never copy
or closely paraphrase released or secure items. Practice is untimed. Rigor stays: tiers change language access (frames, word
banks, visuals, oral rehearsal), never the content task or the answer.

The pure validator `engines/wida/validate.js` (`validateCollection`, `validateTask`) enforces every rule below. The unit tests
validate every JSON example in this file and every gold collection in `data/wida/`.

## Collection

```js
export default {
  id: "wida-g7-science-heat-listening", // kebab-case, starts "wida-", unique across data/wida
  kind: "wida",
  engine: "wida-studio",
  domain: "Listening", // Listening | Speaking | Reading | Writing
  title: "How heat moves",
  grade: "7", // taxonomy GRADES ("K","1".."8"; the Studio is K-8 only)
  band: "6-8", // must equal bandOf(grade)
  cluster: "6-8", // must equal widaClusterOf(grade): K | 1 | 2-3 | 4-5 | 6-8
  subject: "science", // taxonomy subject id; "esol" for general language practice
  klus: ["Explain"], // 1-4 of Narrate | Inform | Explain | Argue
  standards: ["ELD-SC", "SL.7.2"], // every code must exist in data/standards/*.js; include at least one ELD-* code
  minutes: 25, // honest estimate; practice is untimed
  intro: "One or two sentences a student can read.",
  curriculum: { status: "standards-aligned", note: "..." }, // see STUDIO-SPEC hard rule 1
  lessonId: "optional lesson id this practice supports",
  vocab: { collection: "optional vocab id", ids: ["optional entry ids"] },
  texts: [/* Reading only: see "Reading texts" */],
  tasks: [/* 3-8 tasks, all of this domain, ids unique */],
  successCriteria: ["I can ...", "I can ..."], // 2-5 strings written as observable "I can" statements
  supports: { ee: S, dev: S, exp: S, br: S }, // collection-level supports (all four keys; br may be {})
  teacherGuide: {/* see "Teacher guide" */},
  scoring: { objective: "auto", note: "Instructional indicators only; not a WIDA score." },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
```

`S` (support object, used everywhere): `{ directions?: string, frames?: string[], wordBank?: string[], visual?: <visual spec>, hint?: string, oral?: string }`.
Tiers: `ee` Entering/Emerging, `dev` Developing, `exp` Expanding, `br` Bridging/Reaching.

`scoring.objective` is `"auto"` for Listening and Reading, `"none"` for Speaking and Writing. `scoring.note` must contain the words
"not a WIDA score". Objective items are only ever reported as instructional indicators ("3 of 4 correct on this task"), never as a level.

### Teacher guide

```js
teacherGuide: {
  purpose: "What this practice builds, in one or two sentences.",
  languageFocus: ["explain a process with because / so", "..."],        // 2-5 strings
  before: ["Show the visual and ask what students notice.", "..."],    // 1-4 strings
  during: ["...", "..."],                                              // 1-4 strings
  after: ["...", "..."],                                               // 1-4 strings
  commonChallenges: [{ challenge: "...", move: "..." }],               // 1-4
  differentiation: { ee: "...", dev: "...", exp: "...", br: "..." },   // all four, language access only
  independentPractice: "How to use the independent-practice mode and what to look for.",
  feedbackRubric: {                                                    // REQUIRED for Speaking and Writing
    title: "Teacher feedback sheet",
    criteria: [{ id: "c1", label: "Uses the target words", lookFor: "...", nextStep: "..." }]   // 3-6 criteria
  }
}
```

The feedback sheet is an observation record (Seen / Emerging / Not yet seen). It is not a scoring rubric and never produces a level.

## Shared task fields

| field             | rule                                                                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`              | kebab-case, unique inside the collection                                                                                                                   |
| `type`            | one of the 16 types below, and it must belong to the collection's domain                                                                                   |
| `title`           | short label for the task list                                                                                                                              |
| `prompt`          | what the student does, written for the student, 1-2 sentences                                                                                              |
| `klu?`            | one of Narrate Inform Explain Argue (defaults to the collection's first)                                                                                   |
| `visual?`         | a visual spec (`kind`, `alt` required; `longDesc` required when it carries data: `table`, `bars`, `coord`, `timeline`, `numberline`)                       |
| `supports`        | `{ee, dev, exp, br}` of `S`; all four keys present (`br` may be `{}`); at least `ee` and `dev` carry `frames` or `wordBank` for Speaking and Writing tasks |
| `hints?`          | up to 3 strings, graduated, never the answer                                                                                                               |
| `misconceptions?` | `[{ pick: "<option/item id>", tag: "kebab-tag", hint: "..." }]`; `pick` must exist in the task                                                             |
| `explain`         | Listening and Reading: why the answer is right, shown after the attempt (required)                                                                         |
| `teacherNote?`    | one sentence for the teacher view                                                                                                                          |
| `listenFor?`      | Listening: 1-4 short strings shown before the audio in instructional mode, hidden until requested in independent mode                                      |

Every task is attempted in two modes. **Instructional mode** shows supports for the chosen tier, gives hints, checks answers and lets
the student retry. **Independent practice** (simulated, clearly labelled "practice, not a test") shows nothing until the student asks;
answers are scored once on the review/submit screen. Both modes are untimed.

## Listening

All Listening tasks need `audio`. Audio is spoken by the browser's speech voice (no audio files). The transcript is always available
through the captions toggle and, for teachers, the transcript panel in preview mode.

```js
audio: {
  transcript: "What the student hears, exactly.",   // required, 25-400 words
  voiceHint: "adult",                                // adult | child | teen (picks pitch only), default adult
  segments: [{ speaker: "Maya", text: "...", voiceHint: "teen" }],   // optional; when present, each segment's text must occur in transcript
  ref: "<earlier task id>"                           // optional: reuse that task's audio (then transcript/segments are omitted)
}
```

### listen-select

`options` 3-4 `{id,text}` (texts unique, 1-12 words), `question`, `answer: "<option id>"`. For "choose two" use `multi: true` and
`answers: ["id","id"]` (2 to options-1 correct) instead of `answer`.

```json
{
  "id": "l1",
  "type": "listen-select",
  "title": "Main idea",
  "prompt": "Listen to the talk. Then choose the best answer.",
  "audio": {
    "transcript": "Water in a pot heats up from the bottom. Warm water is lighter, so it rises. Cooler water sinks to take its place. This circle of moving water is called a convection current.",
    "voiceHint": "adult"
  },
  "question": "What makes the water move in a circle?",
  "options": [
    { "id": "a", "text": "Warm water rises and cool water sinks." },
    { "id": "b", "text": "The pot spins around." },
    { "id": "c", "text": "Cold water is lighter than warm water." }
  ],
  "answer": "a",
  "explain": "The speaker says warm water is lighter, so it rises, and cooler water sinks to take its place.",
  "misconceptions": [
    { "pick": "c", "tag": "reversed-cause", "hint": "Listen for which water is lighter." }
  ],
  "listenFor": ["lighter", "rises", "sinks"],
  "supports": {
    "ee": { "frames": ["The warm water ___."], "wordBank": ["rises", "sinks"] },
    "dev": { "frames": ["Warm water rises because ___."] },
    "exp": { "frames": ["According to the speaker, ___."] },
    "br": {}
  }
}
```

### listen-sequence

`items` 3-6 `{id,text}`; `answer` is the full ordered list of item ids. The player shows the items in a fixed scrambled order
(never the correct order) with move-up / move-down buttons.

```json
{
  "id": "l2",
  "type": "listen-sequence",
  "title": "Order the steps",
  "prompt": "Listen. Put the steps in the order you hear them.",
  "audio": {
    "transcript": "First, the stove heats the bottom of the pot. Next, the water at the bottom gets warm and rises. Then the cooler water at the top sinks. Finally, the water moves in a circle.",
    "voiceHint": "adult"
  },
  "items": [
    { "id": "s1", "text": "The stove heats the bottom of the pot." },
    { "id": "s2", "text": "Warm water rises." },
    { "id": "s3", "text": "Cooler water sinks." },
    { "id": "s4", "text": "The water moves in a circle." }
  ],
  "answer": ["s1", "s2", "s3", "s4"],
  "explain": "The speaker uses first, next, then and finally to give the order.",
  "supports": {
    "ee": { "wordBank": ["first", "next", "then", "finally"] },
    "dev": { "frames": ["First ___. Then ___."] },
    "exp": { "frames": ["Before ___, ___."] },
    "br": {}
  }
}
```

### listen-label

`visual` required. `slots` 2-6 `{id, marker, prompt?, answer}` where `marker` is the number or letter drawn on the visual and
`answer` is a `bank` id. `bank` `{id,text}` has at least as many entries as slots (extra entries are distractors). The player shows
one labelled dropdown per slot, so no dragging is needed.

```json
{
  "id": "l3",
  "type": "listen-label",
  "title": "Label the diagram",
  "prompt": "Listen. Match each number in the diagram to the part the speaker names.",
  "audio": {
    "transcript": "Look at the diagram of the water cycle. Number one is evaporation, where water turns into vapor. Number two is condensation, where vapor turns into drops. Number three is precipitation, where water falls to the ground.",
    "voiceHint": "adult"
  },
  "visual": {
    "kind": "cycle",
    "alt": "A circle of three numbered stages with arrows between them.",
    "stages": [{ "label": "1" }, { "label": "2" }, { "label": "3" }]
  },
  "slots": [
    { "id": "n1", "marker": "1", "answer": "evap" },
    { "id": "n2", "marker": "2", "answer": "cond" },
    { "id": "n3", "marker": "3", "answer": "prec" }
  ],
  "bank": [
    { "id": "evap", "text": "evaporation" },
    { "id": "cond", "text": "condensation" },
    { "id": "prec", "text": "precipitation" },
    { "id": "runoff", "text": "runoff" }
  ],
  "explain": "The speaker names the stages in order: evaporation, condensation, precipitation.",
  "supports": {
    "ee": { "wordBank": ["evaporation", "condensation", "precipitation"] },
    "dev": { "frames": ["Number ___ is ___."] },
    "exp": { "frames": ["The speaker says number ___ is ___ because ___."] },
    "br": {}
  }
}
```

### listen-notes

The student listens and fills a note organizer. `organizer.rows` 2-6 `{id, label, placeholder?, accept?}`. `accept` is an optional
list of acceptable words or short phrases (case-insensitive, whole word). A row with `accept` is checked (instructional indicator);
a row without it is for the student's notes only. At least one row should have `accept`; if none does, the task is unscored.

```json
{
  "id": "l4",
  "type": "listen-notes",
  "title": "Take notes",
  "prompt": "Listen. Write one key word or phrase in each row.",
  "audio": {
    "transcript": "There are three ways heat moves. Conduction is heat moving through touch. Convection is heat moving in a liquid or gas that flows. Radiation is heat moving as waves, like the warmth you feel from the sun.",
    "voiceHint": "adult"
  },
  "organizer": {
    "title": "Three ways heat moves",
    "rows": [
      {
        "id": "r1",
        "label": "Conduction",
        "accept": ["touch", "contact"],
        "placeholder": "How does heat move?"
      },
      { "id": "r2", "label": "Convection", "accept": ["flows", "liquid", "gas", "moving"] },
      { "id": "r3", "label": "Radiation", "accept": ["waves", "sun"] }
    ]
  },
  "explain": "Each type has a key idea: touch, a flowing liquid or gas, and waves.",
  "supports": {
    "ee": { "wordBank": ["touch", "flows", "waves"] },
    "dev": { "frames": ["Conduction is heat moving through ___."] },
    "exp": { "frames": ["___ moves heat by ___."] },
    "br": {}
  }
}
```

## Speaking

Speaking tasks are never scored and never transcribed. The student reads the prompt, plans (no timer), says the answer aloud (to a
partner, or into the optional recorder), listens back, and self-checks against the success criteria. Recording uses `MediaRecorder`
only after an explicit button press and a plain-language permission explanation; audio stays in the browser tab and is never uploaded.
The engine never claims anything about pronunciation or accuracy.

Shared Speaking fields:

| field           | rule                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `planning?`     | `{ prompt?, organizer?: { rows: [{id,label,placeholder?}] } }`: notes space before speaking; rows 2-5                                 |
| `modelResponse` | `{ ee, dev, exp, br }` four non-empty strings: what a sample answer sounds like at each tier (played by the browser voice on request) |
| `selfCheck`     | 2-5 `{id,text}` first-person checks, e.g. "I used the word 'evaporate'."                                                              |
| `wordsToUse?`   | 0-6 target words shown as chips                                                                                                       |

### speak-describe

`visual` required.

```json
{
  "id": "s1",
  "type": "speak-describe",
  "title": "Describe the graph",
  "prompt": "Look at the bar graph. Describe what you see.",
  "visual": {
    "kind": "bars",
    "alt": "A bar graph of plant height after one, two and three weeks.",
    "longDesc": "Week 1: 2 cm. Week 2: 5 cm. Week 3: 9 cm.",
    "data": [
      { "label": "Week 1", "value": 2 },
      { "label": "Week 2", "value": 5 },
      { "label": "Week 3", "value": 9 }
    ],
    "xLabel": "Week",
    "yLabel": "Height",
    "unit": "cm"
  },
  "planning": {
    "prompt": "Note two things you will say.",
    "organizer": {
      "rows": [
        { "id": "p1", "label": "What the graph shows" },
        { "id": "p2", "label": "What changes" }
      ]
    }
  },
  "wordsToUse": ["height", "week", "increases"],
  "modelResponse": {
    "ee": "The plant is taller in week 3.",
    "dev": "The bar graph shows plant height. The plant grows each week.",
    "exp": "The graph shows that the plant grew from 2 centimeters in week 1 to 9 centimeters in week 3.",
    "br": "Over three weeks the plant's height rose steadily, from 2 to 9 centimeters, and the growth sped up after week 1."
  },
  "selfCheck": [
    { "id": "c1", "text": "I said what the graph shows." },
    { "id": "c2", "text": "I used numbers from the graph." }
  ],
  "supports": {
    "ee": { "frames": ["The plant is ___ in week ___."], "wordBank": ["taller", "week"] },
    "dev": { "frames": ["The graph shows ___. The plant ___."] },
    "exp": { "frames": ["From week ___ to week ___, the height ___."] },
    "br": {}
  }
}
```

### speak-explain

Needs `visual` or `steps` (`[{id,text}]`, 2-6 things the speaker must cover).

```json
{
  "id": "s2",
  "type": "speak-explain",
  "title": "Explain the cycle",
  "prompt": "Explain how a seed becomes a plant that makes new seeds.",
  "steps": [
    { "id": "t1", "text": "seed" },
    { "id": "t2", "text": "seedling" },
    { "id": "t3", "text": "adult plant" },
    { "id": "t4", "text": "new seeds" }
  ],
  "modelResponse": {
    "ee": "A seed grows. Then it is a plant.",
    "dev": "First a seed grows into a seedling. Then it becomes a plant.",
    "exp": "A seed sprouts into a seedling, the seedling grows into an adult plant, and the plant makes new seeds.",
    "br": "The life cycle begins with a seed that sprouts, grows into an adult plant, and produces flowers and seeds that begin the cycle again."
  },
  "selfCheck": [
    { "id": "c1", "text": "I told the steps in order." },
    { "id": "c2", "text": "I used first, then or next." }
  ],
  "supports": {
    "ee": { "frames": ["First, a ___. Then, a ___."], "wordBank": ["seed", "plant"] },
    "dev": { "frames": ["First ___. Next ___. Last ___."] },
    "exp": { "frames": ["After ___, the ___ ___."] },
    "br": {}
  }
}
```

### speak-compare

`items` exactly 2 `{id,label,visual}`; `compareOn` 2-4 strings (the features to compare).

```json
{
  "id": "s3",
  "type": "speak-compare",
  "title": "Compare two plants",
  "prompt": "Compare the two plants. Tell how they are alike and different.",
  "items": [
    {
      "id": "i1",
      "label": "Plant A",
      "visual": {
        "kind": "table",
        "alt": "Plant A gets 6 hours of light and 100 milliliters of water a day.",
        "longDesc": "Plant A: light 6 hours, water 100 mL.",
        "head": ["Plant A", "Amount"],
        "rows": [
          ["Light", "6 hours"],
          ["Water", "100 mL"]
        ]
      }
    },
    {
      "id": "i2",
      "label": "Plant B",
      "visual": {
        "kind": "table",
        "alt": "Plant B gets 2 hours of light and 100 milliliters of water a day.",
        "longDesc": "Plant B: light 2 hours, water 100 mL.",
        "head": ["Plant B", "Amount"],
        "rows": [
          ["Light", "2 hours"],
          ["Water", "100 mL"]
        ]
      }
    }
  ],
  "compareOn": ["light", "water"],
  "modelResponse": {
    "ee": "Both plants get water. Plant A gets more light.",
    "dev": "Plant A and Plant B get the same water, but Plant A gets more light.",
    "exp": "Both plants get 100 milliliters of water, whereas Plant A gets 6 hours of light and Plant B gets only 2.",
    "br": "Although the water is identical, Plant A receives three times as much light, which may explain any difference in growth."
  },
  "selfCheck": [
    { "id": "c1", "text": "I told one way they are alike." },
    { "id": "c2", "text": "I told one way they are different." }
  ],
  "supports": {
    "ee": { "frames": ["Both plants get ___."], "wordBank": ["light", "water", "more"] },
    "dev": { "frames": ["___ and ___ are alike because ___."] },
    "exp": { "frames": ["Both ___, but ___."] },
    "br": {}
  }
}
```

### speak-argue

`question`, `positions` 2-3 `{id,text}`, `evidence` 2-5 `{id,text}` the speaker may use (a good answer uses at least one), optional `counter` string (a
view to answer).

```json
{
  "id": "s4",
  "type": "speak-argue",
  "title": "Sun or shade",
  "prompt": "Take a position. Use evidence to explain your choice.",
  "question": "Where should the school put the new bean garden?",
  "positions": [
    { "id": "p1", "text": "In the sunny spot" },
    { "id": "p2", "text": "In the shady spot" }
  ],
  "evidence": [
    { "id": "e1", "text": "Bean plants in sunlight grew taller in the class test." },
    { "id": "e2", "text": "The shady spot stays cooler." }
  ],
  "counter": "Some students say shade protects plants from hot days.",
  "modelResponse": {
    "ee": "Put it in the sun. Plants need light.",
    "dev": "I think the garden should be in the sun because plants need light to grow.",
    "exp": "The garden should go in the sunny spot because the beans in sunlight grew taller in our test.",
    "br": "Although shade is cooler, the class test showed taller growth in sunlight, so the sunny spot is the stronger choice."
  },
  "selfCheck": [
    { "id": "c1", "text": "I said which spot I chose." },
    { "id": "c2", "text": "I gave a reason from the evidence." }
  ],
  "supports": {
    "ee": { "frames": ["I choose ___."], "wordBank": ["sun", "shade", "grow"] },
    "dev": { "frames": ["I think ___ because ___."] },
    "exp": { "frames": ["The evidence shows ___, so ___."] },
    "br": {}
  }
}
```

## Reading

Reading collections carry `texts` (original passages only). A text:

```js
texts: [{
  id: "t1", title: "...", genre: "article",           // article | story | letter | report | explanation | dialogue
  sections: [{
    heading: "optional heading",                       // text feature: heading
    paras: ["paragraph", "paragraph"],                 // 1-4 paragraphs
    figure: { visual: <visual spec>, caption: "..." }  // optional: chart, table, diagram with caption
  }],                                                  // 1-6 sections; 80-450 words in total
  glossary: [{ term: "adapt", def: "change to fit a new situation", simple: "change", level: 2 }]
}]
```

`glossary` powers the in-context word help. `level` is 1 (everyday), 2 (general academic) or 3 (subject word). Word help shows for Entering/
Emerging at every level, Developing at levels 2-3, Expanding at level 3, Bridging only on request; in independent practice it appears
only after the student asks. `simple` is an optional shorter definition shown at Entering/Emerging. Each `term` must occur in its text.

Tasks reference a text with `text: "<id>"`.

### read-select

`question`, `options` 3-4, `answer` (or `multi` + `answers`).

```json
{
  "id": "r1",
  "type": "read-select",
  "title": "Main idea",
  "text": "t1",
  "prompt": "Read the article. Choose the best answer.",
  "question": "What is the main idea of the article?",
  "options": [
    { "id": "a", "text": "Plants need light to grow." },
    { "id": "b", "text": "Plants need soil only." },
    { "id": "c", "text": "Plants do not need water." }
  ],
  "answer": "a",
  "explain": "The article explains how light helps plants make food.",
  "supports": {
    "ee": { "frames": ["The article is about ___."] },
    "dev": { "frames": ["The main idea is ___."] },
    "exp": { "frames": ["The article explains that ___."] },
    "br": {}
  }
}
```

### read-evidence

Two linked parts. Part 1: `question`, `options`, `answer`. Part 2: `evidence: { prompt, choices: [{id,text}], answers: [ids] }` where
each choice `text` is copied verbatim from the text (the validator checks this) and 1-2 choices are correct.

```json
{
  "id": "r2",
  "type": "read-evidence",
  "title": "Support your answer",
  "text": "t1",
  "prompt": "Answer the question. Then choose the sentence from the text that supports your answer.",
  "question": "Why do plants need light?",
  "options": [
    { "id": "a", "text": "To make their own food." },
    { "id": "b", "text": "To stay warm at night." },
    { "id": "c", "text": "To move to new places." }
  ],
  "answer": "a",
  "evidence": {
    "prompt": "Which sentence from the text best supports your answer?",
    "choices": [
      { "id": "e1", "text": "Leaves use light to make food for the plant." },
      { "id": "e2", "text": "Some plants grow near windows." },
      { "id": "e3", "text": "Soil holds the roots in place." }
    ],
    "answers": ["e1"]
  },
  "explain": "The sentence about leaves using light to make food states the reason directly.",
  "supports": {
    "ee": { "frames": ["The text says ___."] },
    "dev": { "frames": ["I know because the text says ___."] },
    "exp": { "frames": ["The sentence '___' shows that ___."] },
    "br": {}
  }
}
```

### read-sort

`categories` 2-4 `{id,label}`; `items` 4-8 `{id,text,category}` where `category` is a category id, and every category has at least one item.
The player gives each item a labelled dropdown (keyboard friendly) and shows the sorted groups.

```json
{
  "id": "r3",
  "type": "read-sort",
  "title": "Cause or effect",
  "text": "t1",
  "prompt": "Sort each statement from the text into the right group.",
  "categories": [
    { "id": "cause", "label": "Cause" },
    { "id": "effect", "label": "Effect" }
  ],
  "items": [
    { "id": "i1", "text": "A plant is kept in the dark.", "category": "cause" },
    { "id": "i2", "text": "The leaves turn pale.", "category": "effect" },
    { "id": "i3", "text": "A plant gets light every day.", "category": "cause" },
    { "id": "i4", "text": "The plant makes more food.", "category": "effect" }
  ],
  "explain": "Getting or missing light is the cause; what happens to the plant is the effect.",
  "supports": {
    "ee": { "wordBank": ["cause", "effect"] },
    "dev": { "frames": ["___ is a cause because ___."] },
    "exp": { "frames": ["Because ___, ___."] },
    "br": {}
  }
}
```

### read-multitext

`texts` is `[idA, idB]` (two different text ids). `statements` 3-6 `{id,text,answer}` with `answer` one of `"A"` (only the first
text), `"B"` (only the second), `"both"`. Optional `labels: {A,B}` overrides the headings shown.

```json
{
  "id": "r4",
  "type": "read-multitext",
  "title": "Two texts",
  "texts": ["t1", "t2"],
  "prompt": "Read both texts. Decide which text each statement matches.",
  "statements": [
    { "id": "m1", "text": "Explains why plants need light.", "answer": "A" },
    { "id": "m2", "text": "Describes a school garden.", "answer": "B" },
    { "id": "m3", "text": "Mentions water.", "answer": "both" }
  ],
  "explain": "Text A explains the science; Text B describes the garden; both mention water.",
  "supports": {
    "ee": { "wordBank": ["Text A", "Text B", "both"] },
    "dev": { "frames": ["Text ___ says ___."] },
    "exp": { "frames": ["Both texts ___, but only Text ___ ___."] },
    "br": {}
  }
}
```

## Writing

Writing tasks are never scored. The student writes in an expandable response area with a language-target checklist, can see a word
count (shown neutrally, never graded), can run the revision cycle (draft, targeted checklist, revise, compare drafts), and keeps the
work on this device (copy or print). Shared Writing fields:

| field         | rule                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| `targets`     | 2-5 `{id,label}` language targets, e.g. "I used because to give a reason." (the checklist and the revision checks) |
| `exemplars`   | `{ ee, dev, exp, br }` four non-empty strings: a model response at each tier, shown on request after a first draft |
| `lengthHint?` | one neutral sentence, e.g. "Most explanations are three to five sentences."                                        |

### write-expand

Sentence-expansion tool. `base` is a short kernel sentence; `expansions` 2-4 `{id, ask, frames?, wordBank?}` each ask one question
(who / where / when / how / why). The student answers each, then builds one expanded sentence and edits it.

```json
{
  "id": "w1",
  "type": "write-expand",
  "title": "Expand the sentence",
  "prompt": "Make the sentence longer and clearer by answering each question.",
  "base": "The ice melted.",
  "expansions": [
    {
      "id": "x1",
      "ask": "Where or when did it melt?",
      "frames": ["on the sidewalk", "in the afternoon"]
    },
    { "id": "x2", "ask": "Why did it melt?", "frames": ["because the sun was warm"] }
  ],
  "targets": [
    { "id": "t1", "label": "I added where or when." },
    { "id": "t2", "label": "I added a reason with because." }
  ],
  "exemplars": {
    "ee": "The ice melted in the sun.",
    "dev": "The ice melted on the sidewalk because the sun was warm.",
    "exp": "On the sidewalk, the ice melted quickly because the afternoon sun was warm.",
    "br": "By mid-afternoon the ice on the sidewalk had melted completely, since the sun had been warming it for hours."
  },
  "supports": {
    "ee": { "wordBank": ["because", "in", "on"] },
    "dev": { "frames": ["The ___ melted ___ because ___."] },
    "exp": { "frames": ["___, the ___ ___ because ___."] },
    "br": {}
  }
}
```

### write-explain

Explanation builder. `parts` 2-5 `{id, label, prompt, frames?: {ee,dev,exp,br}}` (e.g. Claim, Evidence, Reasoning, or Step, Step, Result).
The student fills each part; the tool assembles the parts into one editable explanation.

```json
{
  "id": "w2",
  "type": "write-explain",
  "title": "Explain with evidence",
  "prompt": "Explain why a ratio table helps solve a problem.",
  "parts": [
    {
      "id": "p1",
      "label": "Claim",
      "prompt": "What do you know?",
      "frames": {
        "ee": ["A ratio table shows ___."],
        "dev": ["A ratio table helps because ___."],
        "exp": ["A ratio table is useful because ___."],
        "br": ["Ratio tables are useful because ___."]
      }
    },
    { "id": "p2", "label": "Evidence", "prompt": "What numbers show it?" }
  ],
  "targets": [
    { "id": "t1", "label": "I made a claim." },
    { "id": "t2", "label": "I used numbers as evidence." }
  ],
  "exemplars": {
    "ee": "A ratio table shows equal ratios. 2 to 3 is 4 to 6.",
    "dev": "A ratio table helps because rows stay equal. 2 to 3 is the same as 4 to 6.",
    "exp": "A ratio table is useful because every row keeps the same ratio; for example, 2 to 3 and 4 to 6 are equivalent.",
    "br": "Ratio tables are useful because multiplying both quantities by the same factor preserves the ratio, as in the equivalent rows 2:3 and 4:6."
  },
  "supports": {
    "ee": { "wordBank": ["ratio", "row", "equal"] },
    "dev": { "frames": ["First ___. Then ___."] },
    "exp": { "frames": ["Because ___, ___."] },
    "br": {}
  }
}
```

### write-paragraph

Paragraph builder with organizer. `organizer.rows` 3-6 `{id,label,prompt,placeholder?}` (topic sentence, details, closing...). The
organizer sits beside the paragraph area; "Move my notes into the paragraph" copies the rows into the draft.

```json
{
  "id": "w3",
  "type": "write-paragraph",
  "title": "Write a paragraph",
  "prompt": "Write a paragraph that explains how plants get what they need.",
  "organizer": {
    "rows": [
      { "id": "o1", "label": "Topic sentence", "prompt": "What is your main point?" },
      { "id": "o2", "label": "Detail 1", "prompt": "First thing plants need." },
      { "id": "o3", "label": "Detail 2", "prompt": "Second thing plants need." },
      { "id": "o4", "label": "Closing", "prompt": "Finish with why it matters." }
    ]
  },
  "targets": [
    { "id": "t1", "label": "I started with a topic sentence." },
    { "id": "t2", "label": "I gave two details." }
  ],
  "exemplars": {
    "ee": "Plants need light and water. Light helps plants make food.",
    "dev": "Plants need light and water to grow. Light helps them make food, and water moves through the plant.",
    "exp": "Plants need light and water to grow. Leaves use light to make food, and roots take in water. Without both, a plant cannot stay healthy.",
    "br": "A plant's growth depends on two inputs: light, which leaves convert into food, and water, which roots absorb. Without either, the plant weakens."
  },
  "supports": {
    "ee": { "wordBank": ["light", "water", "grow"] },
    "dev": { "frames": ["Plants need ___ and ___."] },
    "exp": { "frames": ["___ is important because ___."] },
    "br": {}
  }
}
```

### write-revise

Revision task. `draft` is the starting text: a sample draft written to need work (`source: "sample"`), or a fallback for the learner's own
earlier response (`source: "previous"` with `from: "<earlier task id>"`; the player uses that task's saved text when it exists,
else `draft`). `checks` 3-5 `{id, question, tip}` is the targeted feedback checklist (Yes / Not yet). `revisePrompt` tells the
student what to change. Revision always ends with a side-by-side compare of draft 1 and draft 2.

```json
{
  "id": "w4",
  "type": "write-revise",
  "title": "Revise a draft",
  "prompt": "Read the draft. Use the checklist, then improve it.",
  "source": "sample",
  "draft": "The ice melted. It was hot. I was sad.",
  "checks": [
    {
      "id": "k1",
      "question": "Does the draft say where or when?",
      "tip": "Add a place or a time."
    },
    {
      "id": "k2",
      "question": "Does it give a reason with because?",
      "tip": "Connect the ideas with because."
    },
    { "id": "k3", "question": "Do the sentences connect?", "tip": "Join short sentences." }
  ],
  "revisePrompt": "Rewrite the draft as two clear, connected sentences.",
  "targets": [
    { "id": "t1", "label": "I joined short sentences." },
    { "id": "t2", "label": "I added a reason." }
  ],
  "exemplars": {
    "ee": "The ice melted because it was hot.",
    "dev": "The ice melted on the sidewalk because it was hot. I felt sad.",
    "exp": "The ice melted on the sidewalk because the afternoon was hot, and I felt sad about it.",
    "br": "Because the afternoon was so hot, the ice on the sidewalk melted, which made me sad."
  },
  "supports": {
    "ee": { "wordBank": ["because"] },
    "dev": { "frames": ["The ___ because ___."] },
    "exp": { "frames": ["Because ___, ___."] },
    "br": {}
  }
}
```

## Evidence the engine records

One attempt per finished practice (via `ctx.finish`). Item records are `{id, tries, hints, ok, tags}`:

- objective tasks: `ok` = every part correct, `tries` = checks made (independent mode: 1), `hints` = hints plus support requests;
- Speaking and Writing tasks: `ok: true` once the student completed the self-check or saved a draft, tag `unscored`;
- tags always include `domain:<Domain>`, `mode:instructional|independent`, `type:<task type>`, plus misconception tags.
  No student names, no audio, no writing text ever enters evidence.

## Player options

`#a=<id>&t=<tier>&l=<lessonId>&p=independent` : `p=independent` starts independent practice (default is instructional).
