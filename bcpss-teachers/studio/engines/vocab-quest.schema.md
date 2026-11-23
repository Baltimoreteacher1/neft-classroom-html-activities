# vocab-quest activity schema (v1)

File: `data/activities/<id>.js`, `export default {...}`. `<id>` matches `/^[a-z0-9-]+$/` and equals the `id` field.
Engine: `engines/vocab-quest.js` (logic in `engines/quest/quest-logic.js`, item widgets in `engines/quest/quest-items.js`).
The learner walks a five-stage quest: **see -> use-in-context -> retrieve -> apply -> revisit**. A stage unlocks when the learner has _shown_ understanding of its words (pass mark), never because time passed. The quest map shows progress as words secure per stage, not points. No timers, no streaks, no ranking.

## Top level

| field                    | type                               | req    | notes                                                                                                                   |
| ------------------------ | ---------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| `id`                     | string                             | yes    | equals file name                                                                                                        |
| `engine`                 | `"vocab-quest"`                    | yes    |                                                                                                                         |
| `title`                  | string                             | yes    |                                                                                                                         |
| `grade`,`band`,`subject` | taxonomy ids                       | yes    | K-8 only                                                                                                                |
| `lessonId`               | string                             | no     |                                                                                                                         |
| `standards`              | string[]                           | yes    | in the registry, at least 1                                                                                             |
| `vocabIds`               | string[]                           | no     | entry ids; when present must equal the union of all stage `entryIds`                                                    |
| `minutes`                | number 8..40                       | yes    |                                                                                                                         |
| `intro`                  | string                             | yes    | 1-2 sentences                                                                                                           |
| `collection`             | string                             | one of | id of `data/vocab/<id>.js`; entries are loaded by `import("../data/vocab/<id>.js")`                                     |
| `entries`                | entry[]                            | one of | inline entries, same shape as a vocab-collection entry (use for one-off words). Exactly one of `collection` / `entries` |
| `frames`                 | `{ee,dev,exp,br}` of string[]      | no     | sentence frames for `say-write` items; `{word}` is replaced by the word. Default frames are used when absent            |
| `stages`                 | stage[]                            | yes    | exactly 5, in order of kinds `see`, `use-in-context`, `retrieve`, `apply`, `revisit`                                    |
| `reflection`             | `{prompt, frames:{ee,dev,exp,br}}` | yes    | each tier at least 1 frame                                                                                              |

### Entry fields the engine reads (vocab-collection shape, see STUDIO-SPEC)

`id` (kebab-case, no `.`), `word`, `pos`, `pron`, `def` (must not contain the word), `visual` (spec) or `noVisualReason`, `context` (sentence that contains the word as a whole word in its base form; cloze items blank it), `nonExample?`, `academicSentence`, `everyday?`, `es?:{word, def, verified}`, `morphology?:{parts:[{part, meaning}]}`, `practice:{speakWrite,...}`.

- **Visuals**: picture-word items need `visual`. The visual's `alt` and any text inside it must not contain the word.
- **Spanish toggle**: shown for an entry only when `es.verified === true` and `es.word` + `es.def` exist. `verified:false` content is never shown to students.
- **Word-part builder**: offered only when `morphology.parts` exist AND the parts, with hyphens removed and joined, spell the word exactly (for example `contra-` + `dict` = `contradict`).

## stage

```js
{ id:"see", kind:"see", title:"See the words", intro:"Meet each word, then match it to a picture.",
  entryIds:["evidence","infer"], kinds:["picture-word"], items:[], passMark:0.67 }
```

| field            | req                          | rule                                                                                                                                                                                                |
| ---------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`             | yes                          | `/^[a-z0-9-]+$/`, unique                                                                                                                                                                            |
| `kind`           | yes                          | one of the five kinds above, in order                                                                                                                                                               |
| `title`, `intro` | yes                          | short, student-facing                                                                                                                                                                               |
| `entryIds`       | yes (optional for `revisit`) | 3..10 ids that resolve; `revisit` default: every word used in stages 1-4                                                                                                                            |
| `kinds`          | no                           | item kinds generated for EVERY entry of the stage (see table). Defaults: see `["picture-word"]`, use-in-context `["cloze"]`, retrieve `["type-word"]`, apply `["say-write"]`. Not used by `revisit` |
| `items`          | no                           | authored items added after the generated ones (and overriding a generated item with the same id); see authored kinds                                                                                |
| `passMark`       | no                           | 0.5..1, default 0.67: share of the stage's items answered correctly without being moved on                                                                                                          |

### Item kinds

| kind           | generated for                                                 | what the learner does                                                                                                   | correct when                                                                                                                    |
| -------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `picture-word` | entries with a `visual` (falls back to `meaning` without one) | sees the picture, chooses the word (4 choices)                                                                          | chosen word is the entry's word                                                                                                 |
| `meaning`      | any entry                                                     | sees the word (spoken on request), chooses the student-friendly definition (3 choices from other entries' `def`)        | chosen definition is the entry's `def`                                                                                          |
| `cloze`        | entries whose `context` contains the word                     | reads the real sentence with the word blanked, chooses the word (4 choices)                                             | chosen word is the entry's word                                                                                                 |
| `type-word`    | any entry                                                     | reads the definition (and sees the picture when any), types the word from memory                                        | normalized text equals the word                                                                                                 |
| `word-parts`   | entries with buildable morphology                             | taps parts in order to build the word that matches the definition (parts from this word plus 2 decoys from other words) | built string equals the word                                                                                                    |
| `say-write`    | any entry with `practice.speakWrite`                          | says the sentence aloud (optional), writes it with the tier's frame                                                     | sentence contains the word as a whole word, has at least 5 words, and the learner ticks "My sentence shows what the word means" |

Authored items (in `stage.items`):

```js
{ kind:"sentence-choice", entryId:"credible", prompt:"Which sentence uses credible correctly?",
  choices:["...","...","..."], answer:1, hints:["...","...","..."],
  misconceptions:[{pick:0, tag:"credible-means-popular", hint:"...", model?:"..."}], why:"..." }
{ kind:"cloze", entryId:"bias", sentence:"The reporter showed ___ by quoting only one side.", choices?:["..."] }
```

`sentence-choice`: exactly 3 choices, `answer` index, 3 `hints` (graduated, none contains the word's `def` verbatim or states which choice is right), `why` (1 sentence), optional `misconceptions` keyed by `pick` (choice index) with kebab-case `tag`. The word must appear in every choice. A `cloze` with `sentence` must contain exactly one `___`.

### Generated hints and supports (tier-aware, never change the task)

Generated items always carry 3 graduated hints that never state the word. Supports by tier: `ee` (speaker button on every choice, "See the meaning" on demand, word bank on `type-word`, 2-3 frames, say-it-first prompt), `dev` (speaker button, word bank after hint 1, 1-2 frames), `exp` (1 frame, no bank), `br` (no frames, no bank). Part meanings are always visible in `word-parts`.

## Progression rules

1. Stages unlock in order. Stage N+1 opens only when stage N is complete **and** its demonstrated ratio >= `passMark`.
2. An item is _demonstrated_ when answered correctly. After the 3rd wrong try the model shows; the learner may keep trying or choose "Move on"; moved-on items are not demonstrated.
3. If the ratio is below `passMark` after pass 1, the stage replays its not-demonstrated items once (choices reshuffled). After the replay the next stage unlocks regardless and the words stay flagged for the revisit stage.
4. **Revisit queue** (Leitner-style, spaced by items not by minutes): each word gets a box 1..3. Starting box = 1 if the word lapsed in this session (any not-demonstrated or hint-supported item), else the box computed from this device's earlier attempts for this activity (`attemptsFor(aid)`, item ids `<stage>.<kind>.<entryId>`: a fully clean attempt, `ok && tries===1 && hints===0`, moves up one box up to 4; an attempt with a miss resets to box 1; support only moves down one), else 2 for words never seen on this device. Words with device box 4 start at box 3. Box 1 asks `picture-word`/`meaning`, box 2 asks `cloze`, box 3 asks `type-word`. A clean answer moves the word up one box and retires it after box 3; any other result returns it to box 1 and re-queues it 2 items later (at most 3 lapses per word, then it retires flagged "needs more practice"). Words due on this device (by interval days `[0,1,2,4,8,16]` per box since the last attempt) are ordered first.
5. The start screen states how many words are due from earlier sessions on this device (hidden at zero).

## Evidence and resume

Evidence item ids are `<stage-id>.<kind>.<entryId>` (revisit items use `revisit.<kind>.<entryId>`). Each: `{id, tries, hints, ok, tags}`. The debrief lists each word as **secure** (every item clean) or **needs more practice**, with what the learner used (hints, model). State saved with `ctx.save`: stage index, item index, queues, per-item loop state, flagged words. `ctx.finish(reflection)` records the attempt.

## Minimal valid example

```js
export default {
  id: "min-vocab-quest",
  engine: "vocab-quest",
  title: "Minimal",
  grade: "8",
  band: "6-8",
  subject: "ela",
  standards: ["L.8.6"],
  minutes: 15,
  intro: "Learn, use, retrieve and apply six words.",
  collection: "g8-ela-academic-argument",
  stages: [
    { id: "see", kind: "see", title: "See", intro: "...", entryIds: ["a", "b", "c"] },
    { id: "use", kind: "use-in-context", title: "Use", intro: "...", entryIds: ["a", "b", "c"] },
    {
      id: "retrieve",
      kind: "retrieve",
      title: "Retrieve",
      intro: "...",
      entryIds: ["a", "b", "c"],
    },
    { id: "apply", kind: "apply", title: "Apply", intro: "...", entryIds: ["a", "b"] },
    { id: "revisit", kind: "revisit", title: "Revisit", intro: "..." },
  ],
  reflection: {
    prompt: "Which word will you use this week?",
    frames: {
      ee: ["I will use ___."],
      dev: ["I will use ___ when ___."],
      exp: ["I will use ___ when ___."],
      br: ["I will use ___ when ___ because ___."],
    },
  },
};
```

## Validator rules (`tools/studio-engines-3.test.mjs`)

1. Exactly 5 stages in kind order; every `entryIds` entry resolves in the collection (or inline `entries`); `vocabIds` equals the union.
2. Every entry used by `picture-word` has a valid `visual`; its `alt` does not contain the word.
3. Every `cloze` entry's `context` contains the word; every `word-parts` entry's parts spell the word.
4. `sentence-choice` follows the rules above; the correct choice contains the word.
5. Spanish content is rendered only with `verified:true`.
6. No emoji, placeholder or timer wording anywhere.
