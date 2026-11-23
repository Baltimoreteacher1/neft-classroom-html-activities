# conversation-studio: activity data schema (v1)

Engine id `conversation-studio`. Learners prepare, rehearse, sequence and reflect on an academic partner talk. Validated by
`engines/conversation-parts/validate.js` (`validateConversationActivity(activity)` returns a list of problems; empty means valid).
No timers anywhere. Nothing is ever uploaded: the optional recording stays in the browser tab and is deleted on request or on leaving.

File: `data/activities/<id>.js`, `export default { ... }`. File name equals `id` (kebab-case).

## 1. Envelope

| field                                         | type                                                  | req | notes                                                                                                                                                      |
| --------------------------------------------- | ----------------------------------------------------- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`, `engine:"conversation-studio"`, `title` |                                                       | yes |                                                                                                                                                            |
| `grade`,`band`,`subject`,`standards`          |                                                       | yes | standards must exist in the registry                                                                                                                       |
| `minutes`                                     | integer 5..60                                         | yes |                                                                                                                                                            |
| `speechLang`                                  | BCP 47 tag, for example `"es-US"`                     | no  | language every spoken line (partner turns, move examples) is read in; default `"en-US"`. A move or partner turn may override it with its own `lang` |
| `intro`                                       | string                                                | yes | what the talk is for, 1-3 sentences                                                                                                                        |
| `topic`                                       | `{title, context, claim?, visual?}`                   | yes | `context` 1-4 sentences the partners are talking about; `claim` the statement under discussion; `visual` optional spec for `core/visuals.js` (needs `alt`) |
| `roles`                                       | `[{id,label,job}, {id,label,job}]`                    | yes | exactly two. Role 0 is the learner ("you"), role 1 is the partner. Used by the pair view                                                                   |
| `moves`                                       | Move[]                                                | yes | the move library, 4..14, ids unique                                                                                                                        |
| `purposes`                                    | Purpose[]                                             | yes | 1..4. The learner chooses one (a single purpose is chosen automatically)                                                                                   |
| `successCriteria`                             | `[{id,label}]`                                        | yes | 3..6 "I can" statements for the self-check                                                                                                                 |
| `rubric`                                      | `{criteria:[{id,label,levels:[{score,descriptor}]}]}` | yes | 3..5 criteria, 3..4 levels each, scores integers ascending. Printed as the teacher feedback sheet                                                          |
| `reflection`                                  | `{prompt, frames:{ee,dev,exp,br}}`                    | yes | final reflection; all four tiers present                                                                                                                   |
| `review`,`version`,`updated`,`source`         |                                                       | yes | `review.status` is `"authored"`                                                                                                                            |

## 2. Move

```js
{
  id: "claim",                       // unique
  label: "State a claim",
  function: "Tell the partner what you think is true.",      // one plain sentence
  frames:   { ee: ["I think ..."], dev: ["I think ... because ..."], exp: ["My claim is that ..., based on ..."], br: ["The evidence suggests that ..."] },  // REQUIRED, all four tiers, arrays of strings
  wordBank: { ee: ["plants", "air"], dev: [], exp: [], br: [] },   // optional, any tiers
  example:  "My claim is that most of a tree's mass comes from the air.",   // REQUIRED, spoken aloud on request
  listenFor: "A claim that can be tested.",        // optional, for the pair/teacher view
  notFit: "This move is for disagreeing. Your purpose today is explaining.",   // optional feedback when picked for a purpose that does not use it
}
```

## 3. Purpose

```js
{
  id: "explain", label: "Explain a claim", description: "Say what is true, give evidence, and connect them.",
  moveIds: ["claim", "evidence", "reasoning", "disagree", ...],     // pool shown in the Moves step; superset of the plan; ids must exist
  plan: {
    prompt: "Choose the moves that fit, then put them in the order you would use them.",
    expected: ["claim", "evidence", "reasoning", "check"],   // ordered; an element may be an array of ids that can go in either order
    hints: ["h1", "h2"],                                      // 2..4, graduated, never name the answer moves
    model: "Shown after the third miss: one sentence describing the order and why.",
    why: ["Claim first so the partner knows what you mean.", "..."]   // optional, shown after success, one per expected position
  },
  rehearsal: { intro: "Your partner is a classmate who has just read the same data.", turns: [Turn, ...] }
}
```

Rules: every `expected` id is in `moveIds`; at least one id in `moveIds` is not in `expected` (a real choice); `rehearsal.turns` has >= 4 turns, the first is a partner turn, at least 2 learner turns.

## 4. Turn (rehearsal)

Partner turn: `{ id, speaker:"partner", say:"text, spoken by speak() on request and shown as a transcript", lang?:"es-US", note?:"for the pair view" }`. `lang` (a BCP 47 tag) overrides the activity's `speechLang` for this line; a move may carry `lang` too and it applies to its `example`.

Learner turn:

```js
{
  id: "t2", speaker: "you", prompt: "Respond with your claim.",
  moveId: "claim",                                   // the move this turn rehearses; must exist
  options: [                                         // 3..4, the learner chooses one or says their own
    { id: "a", text: "I think the mass comes mostly from the air.", fit: "strong", note: "States a claim that can be tested." },
    { id: "b", text: "Plants are cool.", fit: "off", note: "That is true but it is not a claim about the question." },
    { id: "c", text: "Maybe air.", fit: "partial", note: "Close, but add what you think happens." }
  ]
}
```

Rules: at least one `strong` option; every option has `text`, `fit` in `strong|partial|off`, and a `note` that explains why (shown after choosing, for every fit);
the strong option's `text` must not be identical to another option. Frames and word bank come from the move at the learner's tier (`ctx.supportPanel`).

The learner hears the partner (Listen button), chooses a response or says their own (optional recording), reads the note, and moves on.

## 5. Recording (optional, local only)

Each learner turn has a "Record my own answer" button. Nothing is requested until the learner presses it: a short explanation appears first
("Your browser will ask to use the microphone. The recording stays on this device and is never uploaded. You can replay it, then delete it.")
and then the browser permission prompt. Stop, replay, **Delete recording**. If `MediaRecorder` or the microphone is unavailable the turn still works. Leaving the page deletes it.

## 6. Views and steps

Steps (one screen each, with Back/Next, no timers): 1 Purpose, 2 Moves, 3 Order, 4 Rehearse, 5 Check yourself, 6 Reflect, then Teacher sheet.

- Moves: choose which moves fit the purpose (set check against the flattened `plan.expected`). A picked move that does not belong shows its `notFit` (or a generic line) and a graduated hint; the missing move is never named.
- Order: arrange the chosen moves (keyboard: Enter picks up, arrows move, Enter drops; touch: move buttons) against `plan.expected` (order check with interchangeable groups).
- Check yourself: for each `successCriteria` the learner marks "I did this" / "Not yet"; counts are shown.
- Pair view (button in the header, also `?view=pair` in mode `projector`): one large card per turn for two partners at a projector. "Partner A" is `roles[0]`, "Partner B" is `roles[1]`. Previous/Next only, no timer, "Swap roles" flips the labels. Frames shown at the chosen tier.
- Teacher sheet: printable rubric rows (blank score circles, comment lines), the success criteria, and the plan the learner built. No names; blank lines for "Speaker" and "Partner" are for pen.

## 7. Evidence

Items settled with `ctx.settle`: `purpose`, `moves`, `order`, and `turn-<turnId>` per learner turn (`ok` = a `strong` option was chosen; `tries` = options chosen; `hints` = Listen/hint presses; `tags` = `fit-partial`, `fit-off`). `ctx.finish(reflection)` runs on Reflect.
Saved progress (`ctx.save`) keeps: step, purpose, chosen moves, order, turn picks, criteria marks, reflection draft.

## 8. Validator rules (summary)

Envelope fields present and typed; ids unique; every `frames` has all four tiers with at least one string for `ee`, `dev`, `exp`; moves have `example`; purposes reference existing moves; plan has a real choice and
2..4 hints; hints must not contain a move `label` that is in `plan.expected` (graduated hints never name the answer); turns satisfy section 4; rubric levels ascend; a `visual` has `alt`; no emoji, no placeholder text.
