# Guided experiences: Teacher Tour and family walkthrough

Two "learn by doing" paths that put a real lab activity in a same-origin frame (`?frame=1`, `html.is-framed`)
and coach the person through it one control at a time.

| Path               | Route                                                 | Module                | Steps                                                                                       |
| ------------------ | ----------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| Teacher Tour       | `/start/tour?part=1..3&grades=&skill=&support=`       | `src/intro/tour.js`   | pick a skill → try it as a student → use it with your class (support, link, QR, card)       |
| Family walkthrough | `/practice-together?step=1..3&grades=`                | `src/intro/family.js` | get started (grade, directions language) → practice together → what to do next              |

Mr. Neft (`src/intro/guide.js`, `guideBubbleHTML`) opens every part in a speech bubble, with his question box behind
"Ask Mr. Neft a question", and speaks the guide card (`copy.guide`) beside the activity.

Activity feedback in Español: `content/es-strings.json` (Spanish keyed by the exact English hint, support, correct,
extension, wrong-choice note and focus tag) and `content/es-guide.json` (skill, directions per activity), read by
`views/activity.js` (`tx`). Guarded by `tools/access-es-strings.test.mjs`.

Entry points: the home page's **Teachers: Start Here** and **Families: Start Here** cards
(`src/views/home-start.js`). Neither path opens by itself, and student practice never waits on either.

## Pieces

- `src/coach/coach.js` — the engine. One ring on the step's target inside the frame, one card beside the frame
  (docked at the bottom under 960px), auto-height frame, scroll-into-view under the lab's sticky top bar, Back /
  Next / Skip / "Try it myself" / "Show me how", Escape to hide, read-aloud (`copy.hear`), "Bring the example back"
  when the frame navigates away, and a fallback text when a target never appears (2.5 s). Targets are looked up again
  on every redraw, so lab re-renders never strand the ring.
- `src/coach/activity-steps.js` — `stepsFor(skill, say)`: `speakSteps` (question, starters, say it, self-check),
  `writeSteps` (write, check, feedback, revise; K–3 paper) and `loopSteps(say)`: the student loop (skill lesson, directions, answer, how sure,
  check, feedback, try again) with selectors for both activity shells (`views/activity.js` and `early/player.js`).
  Steps advance on the real action (`done: { click }`) or when an element appears (`appear`). The lab re-renders on
  click, so a `change` event lands on a detached input: always complete on `click`.
- `src/intro/tour-data.js` — goals, parts, the teacher's words (`TEACHER_SAY`), plain-English support descriptions,
  and `chooseActivity(index, pick, skill, level)`, which reads `content/index.json` (the tour's own activity wins for
  its level; otherwise the first activity of the preferred type).
- `src/intro/tour-finish.js` — Part 3 ("Use it with your class"): one recommended action per goal (`ACTION_ORDER`), at most two more, QR (when the
  link fits 106 bytes), Show to the class dialog, Print this card.
- `src/intro/tour-help.js` — the "Need help?" quick reference (teacher default; the family passes its own words).
- `src/intro/family-guide-data.js` — every family string as `{ en, es }`. A new language is one more key per pair;
  `pickLang` falls back to English. The guide never quotes a button's words and never translates the English task.
- `guided.css` — all `gt-*`, `ft-*` and `gc-*` styles, plus the frame-mode rules that hide lab navigation inside the
  frame.

State lives in `accessPracticeLab:v1:intro` (`guided` for the tour, `family` for the family path): this device only.

## Checks

- `node --test tools/access-intro-tour.test.mjs tools/access-intro-family.test.mjs`
- `node tools/access-intro-family-e2e.mjs` (phone + Spanish, keyboard, reload, restart, axe, microphone denied)
- `node tools/access-intro-tour-a11y.mjs`, `node tools/access-intro-e2e.mjs`
- After any edit under `access-practice-lab/`: `node tools/sync-access-shell.mjs`.

Spanish is machine-written and has not had human review.
