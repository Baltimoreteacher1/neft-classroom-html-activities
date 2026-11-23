# argument-builder activity schema (v1)

File: `data/activities/<id>.js`, `export default {...}`. `<id>` matches `/^[a-z0-9-]+$/` and equals the `id` field.
Engine: `engines/argument-builder.js` (logic in `engines/argument/argument-logic.js`, steps in `engines/argument/argument-steps.js`).
The learner reads a question and sources, then: **claim -> evidence -> reasoning -> counterclaim (tiers that need it) -> assemble and revise**. The engine reviews the draft with a revision checklist, builds a "strengthen it" list from the learner's own choices, and allows a second draft. Output is a plain-text argument the learner can copy, download and print; it is saved on this device only. Works for ELA, science CER, social studies source arguments and health/CTE decisions (`format`).

## Top level

| field                    | type                                       | req                                 | notes                                                                                                                                                               |
| ------------------------ | ------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                     | string                                     | yes                                 | equals file name                                                                                                                                                    |
| `engine`                 | `"argument-builder"`                       | yes                                 |                                                                                                                                                                     |
| `title`                  | string                                     | yes                                 |                                                                                                                                                                     |
| `grade`,`band`,`subject` | taxonomy ids                               | yes                                 | K-8 only                                                                                                                                                            |
| `lessonId`               | string                                     | no                                  |                                                                                                                                                                     |
| `standards`              | string[]                                   | yes                                 | in the registry                                                                                                                                                     |
| `minutes`                | number 10..40                              | yes                                 |                                                                                                                                                                     |
| `intro`                  | string                                     | yes                                 | 1-2 sentences                                                                                                                                                       |
| `format`                 | `"cer"` `"ela"` `"source"` `"decision"`    | yes                                 | label set (below)                                                                                                                                                   |
| `labels`                 | `{claim,evidence,reasoning,counter}`       | no                                  | overrides the labels of `format`                                                                                                                                    |
| `question`               | string                                     | yes                                 | 6-40 words; the argument must answer it                                                                                                                             |
| `sources`                | source[]                                   | yes                                 | 2..4                                                                                                                                                                |
| `claims`                 | claim[]                                    | yes                                 | 3..4                                                                                                                                                                |
| `evidence`               | evidence[]                                 | yes                                 | 6..10                                                                                                                                                               |
| `minEvidence`            | number 1..3                                | no                                  | strong cards needed (default 2); `maxEvidence` default 4                                                                                                            |
| `counterclaims`          | `{<claimId>: string}`                      | if any tier requires a counterclaim | an opposing view for each STRONG claim                                                                                                                              |
| `counter`                | `{requiredTiers?, optionalTiers?, frames}` | no                                  | defaults `requiredTiers:["exp","br"]`, `optionalTiers:["dev"]`; `frames:{acknowledge:{ee,dev,exp,br}, rebut:{ee,dev,exp,br}}` required when any tier shows the step |
| `reasoningFrames`        | `{ee,dev,exp,br}` of string[]              | yes                                 | frames contain `___` blanks; `ee`,`dev`,`exp` at least 1; `br` may be `[]` (free writing)                                                                           |
| `linkWords`              | string[]                                   | no                                  | extra connecting phrases accepted as "explains why"                                                                                                                 |
| `hints`                  | `{claim:[3], evidence:[3], reasoning:[3]}` | yes                                 | graduated; never name the right claim or card                                                                                                                       |
| `model`                  | model                                      | yes                                 | worked PARALLEL example on a different topic (see below), shown on the 3rd wrong try at the claim or evidence step                                                  |
| `revision`               | `{checks:[{id,label,tiers?}]}`             | yes                                 | 3..6 checks                                                                                                                                                         |
| `supports`               | `{ee,dev,exp,br}`                          | yes                                 | each `{directions?, frames?, wordBank?, hint?, oral?}`; applies at every step; `br` may be `{}`                                                                     |
| `reflection`             | `{prompt, frames:{ee,dev,exp,br}}`         | yes                                 |                                                                                                                                                                     |

### format labels

| format     | claim    | evidence        | reasoning      | counter           | use            |
| ---------- | -------- | --------------- | -------------- | ----------------- | -------------- |
| `cer`      | Claim    | Evidence        | Reasoning      | Other explanation | science        |
| `ela`      | Claim    | Text evidence   | Reasoning      | Opposing view     | ELA            |
| `source`   | Claim    | Source evidence | Explanation    | Another viewpoint | social studies |
| `decision` | Decision | Facts           | Why it matters | Other option      | health, CTE    |

## source

```js
{ id:"s1", title:"Sleep log summary", byline:"Written for this activity", text:"60-140 words ...", visual?:<spec>, note?:"..." }
```

Each source has `text`, a `visual` spec (with `alt`), or both. `byline` states who wrote it (original practice text, never real publisher or news text); `text` at most 160 words. Sources are read aloud on request (`speak`), with the text as transcript.

## claim

```js
{ id:"c1", text:"Classes should start later because ...", strong:true,
  why:"This claim answers the question and the sources can support it." }
```

`strong:true` = answers the question, is arguable, and the sources can support it. `strong:false` = off-topic, too broad, a fact (not arguable) or unsupported. 2 or more strong, 1 or more weak. `why`: 1-2 sentences explaining the quality of that claim, shown when it is picked.

## evidence card

```js
{ id:"e1", sourceId:"s1", text:"Students who started at 8:30 slept 52 minutes longer.", supports:"c1",
  quality:"strong", feedback:"Strong: a measured result from the source that bears on the claim." }
```

| field      | rule                                                                                                                                                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sourceId` | resolves to a source                                                                                                                                                                                              |
| `supports` | a claim id the card backs, or `null` (backs none)                                                                                                                                                                 |
| `quality`  | `strong` (specific, from a source, tied to its claim), `weak` (vague, opinion, anecdote or only loosely related to the claim it backs), `irrelevant` (true but not about the question; `supports` must be `null`) |
| `feedback` | 1-2 sentences explaining why the card has that quality; shown after the learner checks the cards. Must not name which other card to pick                                                                          |

For a chosen claim X, a card is classified: `strong` (quality strong and `supports === X`), `weak` (quality weak and `supports === X`), `other-claim` (it supports a different claim; the engine says so using that claim's id-free wording "supports a different claim"), `irrelevant`. Every strong claim has at least `minEvidence` strong cards, from at least 2 different sources among them, and at least 1 weak card; at least 1 card is irrelevant.

## model (parallel worked example)

```js
model:{ question:"Should the school garden get a rain barrel?", claim:"...",
  strong:{ text:"...", why:"..." }, weak:{ text:"...", why:"..." }, tip:"1 sentence about checking evidence" }
```

A different topic from the activity. Never contains text from `claims` or `evidence`.

## Steps and gating

1. **Question and sources**: read, listen, view visuals.
2. **Claim**: pick a claim, "Check my claim". A weak claim shows its `why`, then the hint ladder; strong passes. 3rd wrong try shows `model`.
3. **Evidence**: choose `minEvidence` to `maxEvidence` cards, "Check my evidence". Per-card `feedback` is shown for every chosen card. Passes with at least `minEvidence` strong cards and no irrelevant or other-claim card. Weak cards may stay (they appear in "strengthen it").
4. **Reasoning**: one frame builder per chosen card (frames by tier; "write my own sentence" toggle). A reasoning passes when it has at least 6 words, no unfilled `___`, a connecting phrase (`because`, `so`, `which means`, `this shows`, `shows that`, `proves`, `suggests`, `therefore`, `since`, `as a result`, `explains why`, `means that`, `demonstrates`, `supports`, plus `linkWords`), and shares an idea word (4+ letters, by 5-letter stem) with the claim or the card; the frame's own words do not count toward the idea check. The page says this check looks for connecting language and ideas, and the learner decides whether it makes sense.
5. **Counterclaim** (only for `requiredTiers` and `optionalTiers`): the engine shows the opposing view for the chosen claim; learner writes an acknowledgement and a rebuttal (frames by tier). Passes when each has at least 4 words and the rebuttal has a connecting phrase.
6. **Assemble and revise**: the argument appears as plain text (labeled or paragraph view); the revision checklist shows each check as Met or Look again with a reason; "Strengthen it" lists concrete next steps computed from the learner's choices; "Revise (draft 2)" returns to step 3 with choices kept. "Finish" opens the output (copy, download .txt, print) and the reflection.

### Known revision check ids (auto-evaluated)

| id                 | met when                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `claim-clear`      | a strong claim is chosen                                                                                  |
| `evidence-source`  | at least `minEvidence` strong cards, no irrelevant or other-claim cards                                   |
| `evidence-variety` | the strong cards come from at least 2 sources (only when 2+ sources exist)                                |
| `evidence-strong`  | no weak cards remain                                                                                      |
| `reasoning-why`    | every chosen card has passing reasoning                                                                   |
| `counterclaim`     | the counterclaim step passes (shown only for tiers in `tiers`; default `requiredTiers` + `optionalTiers`) |

Unknown ids become learner self-checks (a checkbox). `tiers` (optional) limits the check to those tiers. Checks tagged `tiers:["exp","br"]` are marked required there and optional ("challenge") for `dev` if the tier is in `optionalTiers`.

## Output

Plain text, no names. Labeled view:

```
Question: ...
<Claim label>: ...
<Evidence label> 1 (<source title>): "..."
<Reasoning label> 1: ...
<Counter label>: <acknowledge> <rebuttal>
```

Paragraph view joins the same pieces into sentences. Saved on this device with the draft number (`out.<activityId>` in `core/store.js`), never uploaded, never part of the evidence code. Evidence per step: `{id:"claim"|"evidence"|"reasoning"|"counter"|"revision", tries, hints, ok, tags}`; `revision.tries` is the number of drafts and `tags` are `unmet-<check id>` for checks still unmet at the end.

## Minimal valid example

```js
export default {
  id:"min-argument", engine:"argument-builder", title:"Minimal", grade:"8", band:"6-8", subject:"social-studies",
  standards:["W.8.1"], minutes:20, intro:"Answer a question with a claim, evidence and reasoning.", format:"source",
  question:"Should the library open on Sundays?",
  sources:[{id:"s1",title:"Visit counts",byline:"Written for this activity",text:"..."},{id:"s2",title:"Staff memo",byline:"Written for this activity",text:"..."}],
  claims:[ /* 2+ strong, 1+ weak */ ], evidence:[ /* 6+ cards */ ],
  counterclaims:{ c1:"Some people say ..." }, counter:{ frames:{ acknowledge:{ee:["Some people think ___."],dev:[],exp:[],br:[]}, rebut:{ee:["But ___."],dev:[],exp:[],br:[]} } },
  reasoningFrames:{ ee:["This shows ___ because ___."], dev:["This supports my claim because ___."], exp:["___ supports my claim because ___."], br:[] },
  hints:{ claim:["h1","h2","h3"], evidence:["h1","h2","h3"], reasoning:["h1","h2","h3"] },
  model:{ ... }, revision:{ checks:[{id:"claim-clear",label:"My claim answers the question."}, ...] },
  supports:{ ee:{directions:"..."}, dev:{}, exp:{}, br:{} },
  reflection:{ prompt:"...", frames:{ ee:["..."], dev:["..."], exp:["..."], br:["..."] } }
};
```

## Validator rules (`tools/studio-engines-3.test.mjs`)

1. 2..4 sources with text and/or visual; 3..4 claims (>= 2 strong, >= 1 weak); 6..10 evidence cards with resolving `sourceId`/`supports`; irrelevant cards have `supports:null`.
2. Every strong claim: >= `minEvidence` strong cards (from >= 2 sources), >= 1 weak card, and a `counterclaims` entry when any tier requires one.
3. Hints never contain the text of a claim or card; `model` shares no sentence with the claims or cards.
4. `reasoningFrames` contain `___` and tiers ee/dev/exp are non-empty.
5. Revision check ids are unique; known ids are evaluable.
6. No emoji, placeholder or timer wording; sources are original ("Written for this activity" byline).
