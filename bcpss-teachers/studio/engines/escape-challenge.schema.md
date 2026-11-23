# escape-challenge activity schema (v1)

File: `data/activities/<id>.js`, `export default {...}`. `<id>` matches `/^[a-z0-9-]+$/` and equals the `id` field.
Engine: `engines/escape-challenge.js` (logic in `engines/escape/escape-logic.js`, puzzle widgets in `engines/escape/escape-puzzles.js`, rooms in `engines/escape/escape-room.js`).
Learner moves through 3-5 rooms. Each room holds one curriculum puzzle. A solved puzzle earns a **code piece derived from the learner's own accepted answer**; the final door opens only with the pieces read in the order the keeper's note gives. No timers, no lives, no scores, no ranking. Every puzzle works by keyboard and by touch (no drag-only controls).

## Top level

| field                    | type                               | req | notes                                                      |
| ------------------------ | ---------------------------------- | --- | ---------------------------------------------------------- |
| `id`                     | string                             | yes | `/^[a-z0-9-]+$/`, equals file name                         |
| `engine`                 | `"escape-challenge"`               | yes |                                                            |
| `title`                  | string                             | yes |                                                            |
| `grade`,`band`,`subject` | taxonomy ids                       | yes |                                                            |
| `lessonId`               | string                             | no  | resolves to `data/lessons/<id>.js` when present            |
| `standards`              | string[]                           | yes | codes in the standards registry, at least 1                |
| `vocabIds`               | string[]                           | no  |                                                            |
| `minutes`                | number 10..40                      | yes |                                                            |
| `intro`                  | string                             | yes | 1-2 sentences, read aloud at the start                     |
| `story`                  | story                              | yes | see below                                                  |
| `rooms`                  | room[]                             | yes | 3..5, unique ids                                           |
| `door`                   | door                               | yes | final door                                                 |
| `supports`               | tier object                        | no  | activity default for any puzzle without its own `supports` |
| `reflection`             | `{prompt, frames:{ee,dev,exp,br}}` | yes | each tier at least 1 frame                                 |

## story

```js
story: { title:"The Lantern Keeper's Apprentice", setting:"A harbor lighthouse, one hour before the evening ferry.",
  beats:[ { id:"start", after:"start", text:"..." }, { id:"b1", after:"supply", text:"..." }, ..., { id:"end", after:"end", text:"..." } ] }
```

`beats[*]`: `{id, after, text}`. `after` is `"start"`, a room id, or `"end"`. Exactly one `start` beat and one `end` beat; at most one beat per room (a missing beat after a room is allowed, the room's `reveal` is then the only bridge). Each text 1-3 sentences, at most 60 words. The story must be coherent: a beat after room N may refer to what the learner just found, and the room N+1 `narrative` continues from it.

## room

```js
{ id:"supply", title:"The Supply Room",
  narrative:"Crates of wicks line the wall. A tag on the first crate reads 12 wicks, 9 dollars.",
  gate:{ needs:"unit-rate", label:"Finding a unit rate" },
  puzzle:{ ...puzzle },
  reveal:"Behind the crate you find a brass tag stamped with a piece of the door code." }
```

| field        | req | rule                                                                               |
| ------------ | --- | ---------------------------------------------------------------------------------- |
| `id`         | yes | `/^[a-z0-9-]+$/`, unique; also the evidence item id of that room                   |
| `title`      | yes | 2-6 words                                                                          |
| `narrative`  | yes | 1-3 sentences, 8-60 words; sets the scene, may include the numbers the puzzle uses |
| `gate.needs` | yes | kebab-case concept id the room tests (what the learner must understand to open it) |
| `gate.label` | yes | student-friendly concept name, 2-8 words; used in the debrief                      |
| `puzzle`     | yes | see below                                                                          |
| `reveal`     | yes | 1-2 sentences, shown with the earned piece                                         |

## puzzle (common fields)

| field            | req                          | rule                                                                                                                                                                                                                                                       |
| ---------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`           | yes                          | `numeric` `choice` `order` `match` `sort` `explain`                                                                                                                                                                                                        |
| `prompt`         | yes                          | the question; 6-40 words                                                                                                                                                                                                                                   |
| `visual`         | no                           | visual spec for `core/visuals.js` (needs `alt`)                                                                                                                                                                                                            |
| `hints`          | yes                          | exactly 3 strings: strategy, narrowed cue, nearly-there cue. A hint may never contain the correct answer (numeric canonical value as a whole token, the correct choice text, the correct order)                                                            |
| `misconceptions` | no                           | `[{tag, hint, model?, pick?, has?}]`; see "Diagnosing wrong answers"                                                                                                                                                                                       |
| `model`          | yes                          | `{text, visual?}` a worked PARALLEL example (different numbers and context from the puzzle), 20-80 words, shown on the 3rd wrong try. It must not contain the puzzle's answer                                                                              |
| `transfer`       | yes                          | a parallel puzzle of the SAME `type` with its own `prompt`, answer data and `hints` (3), shown on the 4th wrong try. It has no `model`, `transfer`, `misconceptions` or `supports`. Solving it does not open the room; the learner returns to the original |
| `why`            | yes                          | 1-2 sentences explaining why the right answer works; shown on success                                                                                                                                                                                      |
| `supports`       | yes (or activity `supports`) | `{ee,dev,exp,br}`, each `{directions?, frames?, wordBank?, hint?, oral?, visual?}`; `br` may be `{}`; `ee` has `directions` and at least one of `frames`/`wordBank`                                                                                        |

Rigor rule: supports change language access only. The same answer applies in every tier.

### numeric

```js
{ type:"numeric", prompt:"...", answer:"3/4", calc:"9/12", unit:"dollars per wick", ... }
```

`answer`: a positive or negative rational as a string (`"3/4"`, `"7 1/2"`, `"0.75"`, `"12"`) or number. Compared EXACTLY as rationals (BigInt), never by tolerance: `0.75`, `3/4` and `6/8` are all accepted for `3/4`; `0.7` and `0.76` are not. `calc` (optional but required for gold content): an exact rational expression using `+ - * / ( )` and decimals; the validator and tests recompute it and it must equal `answer`. `unit` (optional): text shown after the field. Accepted input characters: digits, `.`, `/`, `-`, spaces (mixed numbers), a leading `$`, commas. Anything else gives the message "Type a number, a fraction like 3/4, or a decimal." and does not count as a try.
Canonical form: lowest terms, `"n"` for integers, `"n/d"` otherwise (denominator positive). Misconception `pick` for numeric is this canonical string (for example `"4/3"`).
Code piece: the canonical answer (for example `3/4`).

### choice

```js
{ type:"choice", prompt:"...", choices:["...","...","...","..."], answer:2, tokens:["R","A","T","E"], ... }
```

`choices`: 3..5 strings. `answer`: index. `tokens`: one distinct token (1-4 chars, letters/digits) per choice. Code piece: `tokens[answer]` of the choice the learner picked (only granted when correct). Misconception `pick`: choice index (number).

### explain ("explain it": select the reasoning)

Same fields as `choice`, plus `stem` (optional string shown above the options, such as the claim being justified). Options are reasoning statements. `answer` may be an array of indexes for "choose all that explain it" (then at least 2 and at most `choices.length - 1`); the learner must select exactly the right set. Code piece: tokens of the selected indexes in ascending order, joined with `+`. Misconception `pick`: the index (single) or the sorted indexes joined with `,` (multi); `has` matches individual selected indexes.

### order

```js
{ type:"order", prompt:"...", endLabels:{start:"least", end:"greatest"},
  items:[{id:"a", text:"...", token:"S", value:"9/4"}, ...], answer:["a","b","c","d"], ... }
```

`items`: 3..6; `id` and `token` unique (token 1-3 chars). `answer`: item ids in the correct order. `value` (optional, required for gold content): exact rational string; the tests recompute that `answer` is strictly increasing by `value` (or decreasing when `endLabels.start` is `"greatest"`). The widget starts in a seeded shuffled order that is never already correct and offers Move up / Move down buttons per item (no drag required). Code piece: tokens in the learner's final order joined with `.`.
Misconception `pick`: ids joined with `,`; `has`: `"x>y"` meaning item x is placed before item y.

### match

```js
{ type:"match", prompt:"...", lefts:[{id:"l1", text:"...", calc:"18/6"}, ...],
  rights:[{id:"r1", text:"...", token:"K", value:"3"}, ...], answer:{ l1:"r1", ... } }
```

`lefts`: 3..5. `rights`: `lefts.length` to `lefts.length + 2` (extra rights are distractors). `answer`: every left id to one right id, one-to-one. `calc`/`value` (optional, required for gold): exact rationals; tests check `calc` of each left equals `value` of its answer. Each left has a select control (native `<select>`) listing the rights. Code piece: tokens of the rights chosen for the lefts, in `lefts` order, joined with `.`.
Misconception `pick`: `l=r` pairs joined with `;` in left order; `has`: `"l1=r2"`.

### sort

```js
{ type:"sort", prompt:"...", bins:[{id:"b1", label:"..."}, {id:"b2", label:"..."}],
  cards:[{id:"c1", text:"...", bin:"b1", token:"M"}, ...], answer:undefined }
```

`bins`: 2..3. `cards`: 4..8 with `bin` giving the correct bin and a unique `token`. There is no separate `answer`. Each card shows one button per bin (toggle buttons). All cards must be placed. Code piece: for each bin in order, the tokens of the cards the learner placed in it (cards in data order), joined with `.`, bins joined with `|`. Misconception `has`: `"c1:b2"` (card c1 placed in bin b2); `pick` is not used.

## Diagnosing wrong answers

`misconceptions[*]` = `{tag, hint, model?, pick?, has?}`. `tag` kebab-case, unique in the puzzle, shown to teachers as the misconception tag in evidence. `hint` names the likely thinking and points back to the idea WITHOUT stating the right answer. `model` (optional) replaces the puzzle `model.text` when that misconception is the cause at the 3rd try. A misconception matches when its `pick` equals the response key, or every entry of `has` is among the response facts (first match in list order wins). Unmatched wrong answers show the next hint-ladder line.

## Feedback ladder (what the engine does)

- try 1-2 wrong: misconception hint (or ladder hint), "Try again".
- try 3 wrong: the worked parallel example (`model`), then try again.
- try 4 wrong: the parallel puzzle (`transfer`); afterwards the original is back and the model stays available.
- "Hint" button: reveals hints[0..2] in order (counted in evidence `hints`).
- Learner is never told the answer. Evidence item per room: `{id: room.id, tries, hints, ok, tags}` via `ctx.settle`.

## door

```js
door:{ title:"The Lamp Room Door", prompt:"Type the code the keeper's note describes.", order:["lamp","supply","rope","gear"],
       success:"The lock turns. Warm light fills the lamp room." }
```

`order`: a permutation of all room ids. The code is the pieces joined in this order (no separators needed; spaces, dashes, dots and case are ignored when checking). The engine prints "Read the pieces in this order: <room titles>". Entering a wrong code says which rooms' pieces are missing or in the wrong place only as room titles, never as values. Unlimited attempts, no lockout, no counter shown.

## Resume and evidence

State saved with `ctx.save`: current screen, solved rooms with their pieces, per-room loop state, hints used. Debrief lists each room's `gate.label` as **secure** (solved first try, no hint) or **needed support** (hints, extra tries, model or parallel puzzle used), plus the code. `ctx.finish(reflectionText)` records the attempt.

## Minimal valid example

```js
export default {
  id: "min-escape",
  engine: "escape-challenge",
  title: "Minimal",
  grade: "6",
  band: "6-8",
  subject: "math",
  standards: ["6.RP.A.2"],
  minutes: 15,
  intro: "Open three rooms by solving rate puzzles.",
  story: {
    title: "T",
    setting: "S",
    beats: [
      { id: "s", after: "start", text: "You enter." },
      { id: "e", after: "end", text: "You leave." },
    ],
  },
  rooms: [room("r1"), room("r2"), room("r3")], // each as described above
  door: { title: "Door", prompt: "Type the code.", order: ["r1", "r2", "r3"], success: "Open." },
  reflection: {
    prompt: "What helped?",
    frames: {
      ee: ["I used ___."],
      dev: ["I used ___."],
      exp: ["I used ___ because ___."],
      br: ["I used ___ because ___."],
    },
  },
};
```

## Validator rules (`tools/validate-studio.mjs` and `tools/studio-engines-3.test.mjs`)

1. 3..5 rooms; unique room ids; `door.order` is a permutation of room ids; story has one `start` and one `end` beat; every `beat.after` resolves.
2. Every puzzle has 3 hints, `model`, `transfer` (same `type`), `why`, tiered `supports`.
3. Numeric `calc` recomputes exactly to `answer`; order `value`s sort to `answer`; match `calc` equals the matched `value`; choice/explain `answer` in range; tokens unique within a puzzle.
4. No hint, `model.text` or misconception `hint` contains the canonical answer as a whole token or the correct option's text.
5. Misconception tags kebab-case and unique; `pick`/`has` references resolve.
6. No emoji, placeholder or timer wording (`timer`, `countdown`, `seconds left`, `lives`, `hurry`) anywhere.
