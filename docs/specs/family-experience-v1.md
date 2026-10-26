# Family experience, version 1

Scope: the family homework page (`/lessons/<id>/homework.html`, 166 pages), its weekly hub
(`/curriculum/family-connections/`), the family landing page (`/families/`) and the lesson guides.
Families are almost all English-language learners; the only languages are **English and Spanish**.

This is the contract. Every line has an owner in code and a check that fails when it drifts.

## What a family should feel

| Moment           | What they see                                                                                                                                                 | Why                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| The first screen | Language first (one English                                                                                                                                   | Español control), then the lesson, the big idea in one sentence, time, what to bring, the goal, and how much time they have. | A family decides in seconds whether to try. Nothing before the language picker, nothing a family has to decode. |
| Starting         | Two routes by time. Quick Practice (about 5–10 min, two problems) is the default. Keep Going (about 20–30 min) carries every item.                            | Joel's decision (2026-10-12): the 30-minute path is the default. Busy nights get an honest short path.                       |
| Learning         | The big idea, how sure am I (a plant that grows), tonight's mystery challenge, the model to touch, one drawer for the grown-up.                               | Prediction, agency and a reason to finish. The grown-up gets the one question to ask without a wall of coaching.             |
| Practicing       | A goal of four, not twelve. Pips fill. A wrong answer teaches (three-step hints); it never counts.                                                            | Reachable on a school night, honest about what finished means, and the rest is bonus.                                        |
| Finishing        | The goal opens the mystery challenge, then teach it to someone (any language first, then three English words), the plant again, a certificate, share the win. | Explaining is the strongest learning move and the most natural thing to do at home in any language.                          |

## The contract

1. **One name.** The experience is _Family Math Studio_ / _Estudio familiar de matemáticas_ on every family surface. The two routes are Quick Practice and Keep Going. The page and a route never share a word. (`tools/homework-experience.test.mjs`, `curriculum/family-connections/family-connections.test.mjs`)
2. **Two languages.** English and Spanish, written as pairs, shown as English only, Spanish only, or both. One language at a time, from one control. A first visit is English, or Spanish on a phone set to Spanish; `?lang=` and the saved choice win. A saved or linked "bilingual" choice falls back to the same rule. No Arabic, French, Dari or any other language is offered anywhere (`data/product-decisions.json`: `family-surfaces-english-spanish-only`; tripwire in `npm run validate:family-exit-ticket`).
3. **Tonight's goal** is `GOAL_TARGET` (4) problems, `GOAL_QUICK` (2) on Quick, from `scripts/lib/homework-experience.mjs`. One function (`hwGoalSnapshot`) defines it; one function (`hwRenderGoal`) writes the meter, pips, banner and mystery lock. "Done" means solved or compared with the key. A wrong answer is never progress, and nothing celebrates before the goal.
4. **Progress survives.** Solved problems are stored per lesson (`hw_exp_<lesson>_solved`) and restored before any render may write; a reload never celebrates twice.
5. **Mystery challenge.** Every page carries one: the last Level-up problem, quoted only when its stem stands alone (no "below", "table", "graph"), locked until the goal is met.
6. **Confidence plant.** 🌱 🌿 🌳 before and after, local only, with a growth message that is honest when confidence did not grow.
7. **No native dialogs.** `alert`, `confirm` and `prompt` are replaced by in-page, bilingual toasts and a `<dialog>`. A native dialog can be blocked on a phone and only ever spoke English.
8. **Reduced motion.** Confetti, fanfare and the unlock animation are off when the family asks for reduced motion.
9. **Type and touch.** Reading text and controls are 14px or more; uppercase labels and tab names 13px. Language buttons, routes, tabs, the plant, the mystery button and the grown-up drawer are 44px or more. The floor lives in one block of `homework-experience-css.mjs`.
10. **Nothing on top of anything.** A fixed control never covers another fixed control; on a phone the Learning-supports launcher is an icon.
11. **The first screen is short.** The language picker is first in the page and on the screen. The Start button is within two screens in every language mode.
12. **Honest links.** External links are on the lesson's own topic, verified to resolve, and the sentence claiming so is only printed when a link is.
13. **Plain words.** Family-facing definitions are short and plain (12 words or fewer, grade 5 or lower), with the formal definition one tap away.
14. **Privacy.** Nothing a student types or chooses leaves the device. Sharing sends the lesson name and a link.

## Where each rule is enforced

| Rule                          | Check                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1, 5, 6, 7, 11 (structure)    | `tools/homework-experience.test.mjs` (every one of the 166 pages)                                                                           |
| 3, 4, 8 (behavior)            | `tools/homework-experience.test.mjs` (JSDOM), `tools/verify-family-experience-browser.mjs`                                                  |
| 9, 10, 11 (what a phone sees) | `npm run validate:family-experience-browser` (`--all` sweeps every page, about 15 minutes)                                                  |
| Spanish domino tiles          | `data/family-game-pairs-es.json`, test in `tools/homework-experience.test.mjs`                                                              |
| 12 (links)                    | `npm run validate:family-resources` (offline) and `npm run verify:family-resources` (browser refresh)                                       |
| 13 (plain words)              | `npm run validate:family-plain-definitions`                                                                                                 |
| Product decisions             | `data/product-decisions.json` (`family-homework-route-choices`, `family-homework-experience-layer`, `family-surfaces-english-spanish-only`) |

## Changing it safely

- Change the number once: `GOAL_TARGET`, `GOAL_QUICK`, `ROUTE_TIMES`. Copy that states them reads them from the same module or from the DOM.
- A new component gets `hw-stack` (two languages stacked) or `hw-inline` (one line) and a 44px target, and is added to the browser sweep's `TARGETS` list if it is a control.
- A new fixed-position control needs a bottom offset that clears `.bottom-status-bar` and the launcher; the sweep fails if two fixed controls overlap.
- Never reintroduce a native dialog, a second celebration path, or a goal that reads a route's `problemLimit`.
- The family never sees "Part 2" or "Apply Day"; they see Session 1 and Session 2.

## What is deliberately not here

- A cross-class "how our class guessed" pulse. It needs a rate-limited public write endpoint and a D1 table; the answer is not worth a shared-data risk on a family page. The mystery challenge and the plant give the same sense of progress on the device.
- Audio or video explainers for every lesson. The weekly welcome from Mr. Neft is built (`data/family-welcome.json`, off until recorded); per-lesson explainers wait for captioned recordings.
- Any language beyond English and Spanish.
