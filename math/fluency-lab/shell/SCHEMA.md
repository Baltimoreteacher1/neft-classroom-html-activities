# Student app explanation schema (`shell/authored/*`)

One entry per skill, keyed `"grade:skillId"` (ids from `problem-bank.js` GRADES). Every text field is `{ en, es }`;
Spanish is written for meaning, never a word-for-word copy, and carries the same numbers.

| Field | Required | Meaning |
| --- | --- | --- |
| `concept` | yes | 1–2 sentences: what we are trying to understand and what the idea MEANS (not a procedure). |
| `reasons` | yes | 2–4 lines: WHY the strategy works, tied to the model. Shown beside the Try It model. |
| `misconception` | yes | The likeliest wrong idea, named plainly, with what to do instead. |
| `misconceptions` | recommended | `[{ id, detect(item, raw) → bool, feedback: {en,es} }]` — checked before generic feedback. |
| `living` | recommended | `{ mount(host, { lang, say }) → { observed() } }` — a bounded model whose numbers drive picture, table and equation together. No hidden state; every control labelled; keyboard operable. |
| `transfer` | recommended | `{ prompt, answers, kind, explanation }` — a new-context problem shown after 3 independent successes. |
| `frames` | optional | Replace the engine's worked example: `[{ svg, eq, cap }]` with a picture, notation and words per step. |
| `title` | optional | Student-friendly title when the bank title is jargon. |

Rules: precise mathematics; K–2 short sentences and no undefined terms; 3–5 connect models to equations; 6–8 formal
vocabulary. Never state the answer to a practice problem before the student answers. `shell/shell-content.test.mjs`
must stay green; add the skill to its authored-coverage assertions.
