# language-detective activity schema (v1)

File: `data/activities/<id>.js`. Engine: `engines/language-detective.js`. Learner investigates a scene, taps evidence units (sentences, lines, or picture regions), answers detail/inference/evidence questions, collects **case notes**, then builds a claim backed by the notes, explains it with tiered frames, and revises.

## Top level

| field | type | req | notes |
|---|---|---|---|
| `id`,`engine`(`"language-detective"`),`title`,`grade`,`band`,`subject`,`standards`,`minutes`,`intro` | | yes | as in visual-match |
| `lessonId`,`vocabIds` | | no | |
| `scene` | scene | yes | see below |
| `questions` | question[] | yes | 3..8, unique ids |
| `claimPrompt` | string | yes | e.g. "What can you say about ...? Choose the claim your case notes support." |
| `claim` | claim | yes | |
| `explainFrames` | `{ee,dev,exp,br}` of string[] | yes | each tier >= 1 frame; `ee`,`dev` >= 2 |
| `supports` | tier object | no | activity level frames/word bank/visual shown with every question |
| `reflection` | `{prompt, frames:{ee,dev,exp,br}}` | yes | |

## scene

Common: `title?`, `source?` (string), `caption?`.

- `kind:"passage"`: `sentences:[{id, text, para?:int}]`, 4..40; consecutive equal `para` values render as one paragraph (default 0). Tap a sentence to select it.
- `kind:"conversation"`: `lines:[{id, speaker, text}]`, 4..30; `setting?`.
- `kind:"image"` / `"diagram"`: `visual:<visual spec>` (alt required, `longDesc` required when `kind:"diagram"`) and `regions:[{id, label, x, y, w, h}]` 3..12 in the visual's own coordinate box (`w`,`h` of the spec, default 480x320); each region inside that box; `label` is its accessible name (a short noun phrase that does not state an answer).

Unit ids (`sentences[].id`, `lines[].id`, `regions[].id`) are unique within the scene and `/^[a-z0-9-]+$/`.

## question

```js
{ id:"q2", type:"inference",                     // "detail" | "inference" | "evidence"
  prompt:"Why did Mara carry the bucket to the pond?",
  options:[{id:"a",text:"..."},{id:"b",text:"..."},{id:"c",text:"..."}],   // 2..4, required for detail and inference
  answer:"b",                                    // option id; for type "evidence": array of unit ids (the required evidence)
  evidence:[{ id:"s4", why:"She says the garden is dry.", optional:false }],  // required for evidence and inference; optional for detail
  misconceptions:[{ pick:"a", tag:"text-matching", hint:"That word is in the text, but ...", model?:"" },
                  { pick:"s2", tag:"true-but-unrelated", hint:"That sentence is true, but it does not show why." }],
  hints:["Reread the paragraph about the garden.","Look for a sentence about water.","Which sentence tells you what Mara wanted?"],
  model:"Think-aloud: I read ... so the answer is ...",
  explain:"Right: the text says ...",            // shown on success; also read as feedback
  transfer:{ prompt, options:[{id,text}], answer, explain },
  supports:{ ee:{...}, dev:{...}, exp:{...}, br:{} } }
```

Flow per question: `detail`: choose the answer (evidence optional: if `evidence` is present the learner is then asked "Tap the proof"); `inference`: choose the answer, then tap the proof; `evidence`: tap the units that prove the point (no options). Evidence check: selection must contain every non-optional `evidence[].id` and nothing outside `evidence[]` ids (so at most `evidence.length` taps). `misconceptions[].pick` is an option id or a unit id. Tapped evidence persists as highlights numbered by question and becomes a case note.

Hints are graduated (location, narrowed cue, nearly-there) and never state the answer. `model` appears after 3 misses and the correct evidence is outlined; the learner then completes it. `transfer` appears on the 4th miss.

## claim

```js
{ options:[{ id:"c1", text:"Mara cares about her garden.", strong:true },
           { id:"c2", text:"Mara does not like the pond.", strong:false, tag:"unsupported-claim", hint:"Your notes do not say that." }],
  evidenceIds:["s4","s6"],        // unit ids that support the strong claim; all must exist in scene
  evidenceMin:2,                  // how many supporting notes the learner must attach (<= evidenceIds.length)
  why:"Your notes show Mara watered the garden and carried the bucket twice.",  // one sentence: why the strong claim is supported (shown on success and as the model)
  hints:["...","...","..."],    // optional, 3 graduated hints; defaults are generic and never name the answer
  explainPrompt:"Explain how your evidence proves your claim.",
  revisionChecks:[ { id:"because", label:"I used because or so to connect my evidence to my claim.", test:{type:"contains-any", words:["because","so","this shows"]} },
                   { id:"evidence", label:"I used words from my evidence.", test:{type:"contains-evidence"} },
                   { id:"length", label:"My explanation has at least 12 words.", test:{type:"min-words", n:12} },
                   { id:"reread", label:"I read my explanation aloud once.", self:true } ] }
```

`why` is required. `evidenceIds` must all be units used as proof by at least one question (so they can appear in the learner's case notes). `options` 3..4 with exactly one `strong:true`; wrong options carry `tag` and `hint`. `revisionChecks` 2..4; `test.type` is one of `min-words {n}`, `contains-any {words:[...]}`, `contains-evidence` (>= 2 non-trivial words from an attached evidence unit); an entry with `self:true` is a self-check box. The learner submits a draft, sees the check results, revises, and submits again (the second submit always continues; the record keeps the failed check ids as `tags`).

## Minimal valid example

```js
export default { id:"mini-detective", engine:"language-detective", title:"Mini", grade:"5", band:"3-5", subject:"ela",
  standards:["RI.5.1"], minutes:8, intro:"Read, find proof, and build a claim.",
  scene:{ kind:"passage", sentences:[{id:"s1",text:"Tom packed an umbrella."},{id:"s2",text:"Gray clouds covered the sky."},{id:"s3",text:"He waited by the door."},{id:"s4",text:"Rain began to fall."}] },
  questions:[{ id:"q1", type:"detail", prompt:"What did Tom pack?", options:[{id:"a",text:"An umbrella"},{id:"b",text:"A hat"}], answer:"a",
    hints:["Reread the first sentence.","Look for what Tom packed.","It keeps you dry."], model:"The first sentence says Tom packed an umbrella." },
    /* ... at least 3 questions ... */ ],
  claimPrompt:"What can you say about Tom?", claim:{ options:[/* 3 */], evidenceIds:["s1","s2"], evidenceMin:2, explainPrompt:"Explain.", revisionChecks:[{id:"len",label:"At least 8 words.",test:{type:"min-words",n:8}},{id:"read",label:"I read it aloud.",self:true}] },
  explainFrames:{ ee:["Tom ___ because ___.","The text says ___."], dev:["I think ___ because ___.","One clue is ___."], exp:["Based on the text, ___."], br:["The evidence suggests ___ because ___."] },
  reflection:{ prompt:"What helped you find proof?", frames:{ ee:["I looked for ___.","I found ___."], dev:["I found proof by ___.","A clue was ___."], exp:["I checked ___."], br:["I verified ___."] } } };
```

## Validator rules (engine `language-detective`)

1. Required fields; `questions` 3..8; unit ids unique and well-formed; scene type fields present (see above).
2. `detail`/`inference` have `options` (2..4) and `answer` is an option id; `evidence` type has no options and `answer` is an array equal (as a set) to the non-optional `evidence[].id`.
3. Every `evidence[].id`, `misconceptions[].pick` (option or unit id), `claim.evidenceIds[]` resolves; `inference`/`evidence` questions have non-empty `evidence`; `evidence[].text/region`, if present, equals the unit's text/region.
4. Each question has 3 `hints`, none containing the exact answer option text (case-insensitive) or the full evidence sentence; `model` and `explain`/`why` strings non-empty.
5. `claim.why` non-empty; `claim.evidenceIds` is a subset of the union of all question `evidence[].id`; `claim.hints`, if present, has 3 strings; exactly one `claim.options[].strong`; wrong options have `tag` (kebab-case) and `hint`; `evidenceMin` <= `evidenceIds.length` and >= 2.
6. `revisionChecks` 2..4 with unique ids, valid test types, at least one auto test.
7. Region boxes inside the visual; region labels do not equal an answer; visual renders and has `alt` (and `longDesc` for diagrams); no emoji or placeholders anywhere.
8. `explainFrames` and `reflection.frames` have all four tiers; `ee`/`dev` have >= 2 frames.
9. Passage text is original: the validator does not check provenance, authors set `scene.source` to `"Original - The Language Page"`.
