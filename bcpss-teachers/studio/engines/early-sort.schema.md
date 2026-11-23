# early-sort activity schema (v1) - ages 5-8, Kindergarten to Grade 2

File: `data/activities/<id>.js`. Engine: `engines/early-sort.js` (+ `early-sort-modes.js`). No reading required: every item has a picture and is spoken aloud (`speechSynthesis`; the text is the transcript). Targets are >= 64px, no timers, no failure sounds, warm feedback ("Try another spot."). Grown-up mode (toggle) shows the adult's teaching prompt.

## Top level

| field | type | req | notes |
|---|---|---|---|
| `id`,`engine`(`"early-sort"`),`title`,`grade`(`K 1 2`),`band`(`k-2`),`subject`,`standards`,`minutes`(3..15),`intro` | | yes | `intro` is spoken first ("Let's sort some pictures together.") |
| `rounds` | round[] | yes* | 1..6. *Shorthand: a top-level `mode` plus that mode's fields is one round |
| `grownUp` | `{ask:string, notice?:string}` | no | activity-level adult prompt (a question to ask, never an answer key) |
| `supports` | tier object | no | tier frames for oral rounds |
| `reflection` | `{prompt, frames:{ee,dev,exp,br}, write?:boolean}` | yes | spoken for Kindergarten; `write:true` adds a typing box (Grades 1-2) |

## Round (common)

`{ id, mode, title?, prompt, say?, grownUp?:{ask,notice?}, supports? }`. `prompt` is the spoken instruction (<= 14 words, no reading needed). `say` overrides what is spoken. Item ids are unique across the whole activity.

### mode `picture-sort`

```js
{ id:"r1", mode:"picture-sort", prompt:"Is it an animal or a plant? Put it in the right home.",
  categories:[{ id:"animal", label:"animals", visual:{kind:"icon",name:"cat",alt:"A cat"}, say:"animals" },
              { id:"plant",  label:"plants",  visual:{kind:"icon",name:"flower",alt:"A flower"} }],     // 2..4
  items:[{ id:"dog", word:"dog", visual:{...}, category:"animal", say:"dog",
           hints:["Does it move around by itself?","Listen: does it have legs?","Does it grow in the ground?"],
           misconceptions:[{ pick:"plant", tag:"living-confusion", hint:"Try another spot. Does it grow roots?" }],
           model:"A dog can run and eat. Animals move and eat." }] }                                      // 4..10
```

Choices visible start at 2 and grow: categories unlock in listed order (a 3rd/4th bin appears when the first item belonging to it is presented); items are presented grouped so a round with 4 categories starts with only items of categories 1-2. `category` resolves. `hints` (3, never naming the category) and `model` optional; defaults are calm generic lines.

### mode `sound-match` (`kind:"beginning"|"rhyme"`)

```js
{ id:"r2", mode:"sound-match", kind:"beginning", prompt:"Which picture starts like ball?",
  trials:[{ id:"t1", cue:{ word:"ball", visual:{...} },
            choices:[{ id:"bus", word:"bus", visual:{...} },{ id:"cup", word:"cup", visual:{...}, tag:"different-sound" }],   // 2..4
            answer:"bus", say:"Which picture starts like ball?" }] }                                                           // 3..8
```

`choices` count of trial 1 is exactly 2 and never decreases. `answer` resolves. Rhymes use spoken words only. A trial may also carry `misconceptions:[{pick, tag, hint, model?}]` (`pick` is a choice id); these win over a choice's own `tag`/`hint`. On the third miss the child sees the misconception's `model`, else the trial's `model`; a `hint` is shown before it and never stands in for the model.

### mode `syllable-clap`

`items:[{ id, word, visual, syllables:["but","ter","fly"], say? }]` (3..8). Learner taps the clap pad once per beat, then "That's all". Chunks appear as they tap; on success each chunk is spoken. `syllables.join("")` equals `word` (letters only, lower case), 1..4 chunks.

### mode `sequence-story`

`title`, `cards:[{ id, visual, say, order }]` (3..4; `order` 1..n unique; `say` is the caption spoken when the card is chosen). Learner picks what happens first, next, last. Optional `hints`.

### mode `oral-describe`

`items:[{ id, visual, word?, say, frames?:tier object, grownUp?:{ask,notice?}, record?:boolean }]` (1..6). Look, say, optionally record locally (MediaRecorder after an explicit tap; stays on the device and is never uploaded), then "I said it". No right or wrong.

## Per-item shared optional fields

`hints:[3]`, `misconceptions:[{pick|match, tag, hint, model?}]`, `model`, `transfer:{prompt, options:[{id,word?,visual?}] 2..3, answer, explain}`. Defaults: calm hints ("Try another spot.", "Listen again.", "Let's look together."), model "Let's do this one together."

## Minimal valid example

```js
export default { id:"mini-early-sort", engine:"early-sort", title:"Mini", grade:"K", band:"k-2", subject:"science", standards:["L.K.5.a"], minutes:4,
  intro:"Let's sort some pictures together.",
  rounds:[{ id:"r1", mode:"picture-sort", prompt:"Put it where it belongs.",
    categories:[{id:"a",label:"animals",visual:{kind:"icon",name:"cat",alt:"A cat"}},{id:"b",label:"plants",visual:{kind:"icon",name:"flower",alt:"A flower"}}],
    items:[ /* 4 items */ ] }],
  reflection:{ prompt:"Tell a grown-up one thing you sorted.", frames:{ ee:["I sorted ___."], dev:["I put ___ with ___."], exp:["I put ___ with ___ because ___."], br:["I sorted ___ by ___."] } } };
```

## Validator rules (engine `early-sort`)

1. Required fields; `grade` in `K 1 2`; rounds 1..6 and each mode known; ids unique across rounds, categories, items, trials, cards.
2. picture-sort: 2..4 categories with visual; 4..10 items; every `category` resolves; each category has >= 1 item.
3. sound-match: 3..8 trials; trial 1 has exactly 2 choices, counts non-decreasing, <= 4; `answer` resolves; exactly one choice is the answer.
4. syllable-clap: 3..8 items; `syllables.join("")` equals `word` ignoring case; 1..4 chunks.
5. sequence-story: 3..4 cards, `order` is exactly 1..n; every card has `say`.
6. oral-describe: items have `say`; `frames` shape valid when present.
7. All visuals render and have `alt`; no emoji; prompts <= 14 words; any item prompt/`say` non-empty so audio exists; no timer words ("hurry", "quick", "seconds", "countdown", "time's up") and no failure words ("wrong", "incorrect", "fail") in any string.
8. `hints`, if present, have exactly 3 strings and never contain the category label or answer word.
9. `reflection.frames` all four tiers; `ee`,`dev` >= 1 frame.
