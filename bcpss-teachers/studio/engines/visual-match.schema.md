# visual-match activity schema (v1)

File: `data/activities/<id>.js`, `export default {...}`. `<id>` matches `/^[a-z0-9-]+$/` and equals the `id` field.
Engine: `engines/visual-match.js`. Learner connects **terms** (movable chips) to **prompt cards** (pictures, definitions, or example sentences with a blank). Select-then-place (tap/click/Enter) and drag both work; keyboard: Tab to a chip, Enter picks it up, Tab to a card, Enter places it.

## Top level

| field | type | req | notes |
|---|---|---|---|
| `id` | string | yes | `/^[a-z0-9-]+$/`, equals file name |
| `engine` | `"visual-match"` | yes | |
| `title` | string | yes | |
| `grade`,`band`,`subject` | taxonomy ids | yes | |
| `lessonId` | string | no | must resolve to `data/lessons/<id>.js` when present |
| `standards` | string[] | yes | codes in the standards registry; at least 1 |
| `vocabIds` | string[] | no | `<collection>:<entryId>` or entry ids that resolve |
| `minutes` | number 5..30 | yes | |
| `intro` | string | yes | 1-2 sentences, spoken at the start |
| `speechLang` | BCP 47 tag, for example `"es-US"` | no | language the card and word-bank text is read aloud in (default `"en-US"`). Use it when the terms themselves are in another language. The Spanish-support toggle always reads its terms as `es-US`; directions stay in English |
| `modes` | string[] | yes | non-empty, unique, subset of `term-visual term-definition term-example` |
| `pairs` | pair[] | yes | 4..12 |
| `distractors` | distractor[] | no | strategic wrong cards |
| `rounds` | round[] | no | default: one round per mode, in `modes` order; level `recognise`, `distinguish`, `apply` by index (index 2+ is `apply`) |
| `supports` | tier object | yes unless every round has `supports` | `{ee,dev,exp,br}`; see below |
| `reflection` | `{prompt, frames:{ee,dev,exp,br}}` | yes | each tier at least 1 frame; `ee` and `dev` at least 2 |

## pair

```js
{ id:"larva", term:"larva",
  visual:{ kind:"scene", alt:"A green caterpillar eating a leaf", ... },      // spec for core/visuals.js
  definition:"The young, worm-like stage that eats and grows.",
  example:"The larva ate leaves all day so it could grow.",                 // contains term (or one of forms)
  forms:["larvae"],                                                           // optional inflections accepted when blanking
  why:"A larva has no wings; it eats and grows before it changes.",         // one sentence, shown as the model after 3 misses
  hints:["Think about which stage eats the most.","This stage has no wings yet.","It comes after the egg and before the pupa."],
  confusions:[{ pick:"pupa", tag:"stage-order", hint:"Pupa is the resting stage. Which stage is still eating?", model:"..." }],
  es:{ term:"larva", definition:"...", example:"...", verified:true },
  transfer:{ prompt:"Which animal stage is a larva?", options:[{id:"a",text:"A tadpole"},{id:"b",text:"A cow"}], answer:"a", explain:"A tadpole is a young stage that changes later." } }
```

| field | req | rule |
|---|---|---|
| `id` | yes | unique in activity, `/^[a-z0-9-]+$/` |
| `term` | yes | 1-3 words |
| `visual` | if `term-visual` in modes (or any round using it) | valid visual spec: `kind`, `alt` (required, no emoji), renders without error |
| `definition` | if `term-definition` used | 4-25 words, must not contain the term or a form (whole word) |
| `example` | if `term-example` used | must contain the term or a `forms` entry as a whole word (the engine blanks it); 5-30 words |
| `forms` | no | strings |
| `why` | yes | 1 sentence, <= 30 words; shown as the model |
| `hints` | yes | exactly 3 strings, graduated (strategy, narrowed cue, nearly-there cue); none may contain the term/forms as a whole word |
| `confusions` | no | `{pick:<other pair id>, tag, hint, model?}`: `pick` is the OTHER pair whose term was wrongly placed on THIS pair's card and `hint` answers that mistake; `tag` kebab-case; a `pick` may appear once |
| `es` | no | `{term, definition?, example?, verified:boolean}`. The Spanish toggle appears only when EVERY pair has `es.term` and `es.verified === true`. `verified:false` content is never shown to students |
| `transfer` | no | `{prompt, options:[{id,text}] 2..4, answer:<option id>, explain}`; shown on the 4th miss |

## distractor

Extra card of exactly ONE kind among `term`, `visual`, `definition`, `example`, plus:
`{ id, tag, hint, pairIds? }` (`id` unique across pairs and distractors). `term` distractors are extra chips in the bank (appear in `distinguish`/`apply` rounds). `visual`/`definition`/`example` distractors are decoy cards in rounds of that mode that no term belongs to; placing any chip on one shows `hint`. `pairIds` limits it to batches containing those pairs. `hint` must name the confusion without naming the correct term.

## round

`{ id, mode, level:"recognise"|"distinguish"|"apply", title?, prompt?, pairIds?:[ids], supports? }`.
`recognise`: bank = this batch's terms. `distinguish`: also adds up to 2 term distractors plus the terms of pairs named in `confusions` (near-miss), and decoy cards. `apply`: bank = batch terms plus distractors and decoys; the mode must be `term-example` (sentences with a blank). Batch size by tier: ee 3, dev/exp/br 4 (the task and answers are identical at every tier).

## supports (tier object)

`{ee:S,dev:S,exp:S,br:S}`, `S={frames?:[],wordBank?:[],visual?:spec,directions?:"",hint?:"",oral?:""}`; `br` may be `{}`. At `ee` the engine also shows each term's picture on its chip in non-picture rounds (a language access support, not a hint).

## Minimal valid example

```js
export default {
  id:"mini-visual-match", engine:"visual-match", title:"Mini", grade:"3", band:"3-5", subject:"science",
  standards:["3-LS1-1"], minutes:5, intro:"Match each word to its picture.", modes:["term-visual"],
  pairs:[1,2,3,4].map(n=>({ id:`w${n}`, term:`word${n}`, visual:{kind:"icon",name:"leaf",alt:`Picture ${n}`},
    why:"This picture shows it.", hints:["Look closely.","Think about the shape.","Say the word aloud."] })),
  supports:{ ee:{frames:["This is a ___."]}, dev:{}, exp:{}, br:{} },
  reflection:{ prompt:"What helped you match?", frames:{ ee:["I looked at ___.","The picture showed ___."], dev:["I matched ___ because ___.","A clue was ___."], exp:["I used ___ to match."], br:["I matched by ___."] } },
};
```

## Validator rules (tools/validate-studio.mjs, engine `visual-match`)

1. Required fields present; `id` equals file name and regex; `modes` subset/unique; `pairs` 4..12; unique ids across pairs, distractors, rounds.
2. Every mode in `modes` (and every round mode) has the data it needs on all pairs it covers (`visual`, `definition`, `example`).
3. `example` contains `term` or a `forms` item as a whole word (case-insensitive); `definition` does not contain the term.
4. `hints` is exactly 3 non-empty strings, none contains the term/forms as a whole word.
5. `confusions[].pick` and `distractors[].pairIds[]` resolve to pair ids; tags are kebab-case; no `pick` equals the pair's own id.
6. Every visual (pair, supports, transfer options) passes `renderVisual` and has `alt`; no emoji; no placeholder strings.
7. `es` rule: if any pair has `es`, the pair must have `es.term` and boolean `verified`; unverified Spanish is allowed in data but flagged in the report.
8. `transfer.answer` is one of its option ids.
9. `supports` complete for `ee dev exp br` (a missing tier resolves downward, but `ee` and `dev` must exist); `reflection.frames` has all four tiers.
10. `rounds[].pairIds` resolve; round modes are in `modes`.
