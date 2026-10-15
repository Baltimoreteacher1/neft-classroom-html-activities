# Practice studio enhancements

Four features added on top of Practice Studio v2 (`docs/specs/practice-studio-v2.md`). All keep the studio rules: nothing
is timed, a wrong answer explains the mistake and never prints the answer, Spanish for every student sentence, keyboard
only works, 375px works, reduced motion is respected.

| Feature | What it is | Where it lives |
| --- | --- | --- |
| **Skill Quest** | An adaptive run through the lesson's own skills (its generators), opened from the header. Four levels per skill (the generators' own levels). Three clean answers in a row climb a level; two helped answers in a row step back; mastery is level 3 with a streak of 3, or level 4 with a streak of 2. Ends when every skill is mastered or after a fixed count. Result is 0 to 3 stars, saved in the studio's own save and added to the share code. | `assets/studio/quest-model.js` (pure), `assets/studio/quest.js` (screen), `tools/studio-quest.test.mjs` |
| **Daily Boost** | Spaced, mixed retrieval across every lesson at `/math/practice-studio/boost/`. Every generated skill the student answers is placed in a Leitner box (1 to 5): a clean answer moves it up and pushes its next review out (1, 3, 7, 14, 30 days); anything else sends it to box 1 for tomorrow. Today's ten are the skills that are due, then fresh skills from lessons the student has opened, then the weakest. The set is saved for the day, so a reload shows the same ten. A day streak is kept. Memory is per device, in `localStorage` key `ewl_boost_v1`; nothing is sent anywhere. | `assets/studio/boost-core.js` (pure), `assets/studio/boost.js` (wiring, page boot), `boostPage()` in `scripts/lib/practice-studio-pages.mjs`, `tools/studio-boost.test.mjs` |
| **Comfort** | One panel (button in the studio header; a round button on the hand-built Unit 4 pages): text size (normal, large, extra large), reading font (studio, Lexend, Atkinson Hyperlegible), roomy spacing, high contrast, a reading ruler that follows the pointer or focus, and calm mode. Stored in `ewl_comfort_v1`, applied as `data-comfort-*` attributes on `<html>`. | `assets/studio-comfort.js`, `assets/studio-comfort.css` (loaded by every generated studio and all ten Unit 4 pages) |
| **Earned celebrations and sound** | A toast for a 3, 5, 8 or 12 answer streak, a finished section, a finished studio and a finished quest; confetti for sections, studios and three-star quests; optional sound cues (off until chosen, silent in calm mode). Only things the student earned fire; a wrong answer never does. | `assets/studio-comfort.js`, listening to `studio:solved`, `studio:progress`, `studio:complete`, `studio:quest` |

## Contracts

- The runtime's `answer` bus event now carries `gen` (the generator id) and `genLevel`; the Boost memory and the Quest depend on it.
- Quest questions are fresh generated items mounted through `StudioRT.api.mountItem` in redemption mode, so hints, Spanish,
  read-aloud and feedback behave exactly as in the five sections.
- The Boost page's `data-lesson` is `0-0`; the chrome shows "Daily Boost" for it. Its five sections hold two generated items
  each, chosen in the browser before the runtime reads `#studio-data`.
- Unit 4's hand-built pages get Comfort and celebrations only; they have no generator runtime, so no Quest or Boost entry.

## Verification

`tools/studio-quest.test.mjs`, `tools/studio-boost.test.mjs` (pure logic), and `npm run validate:studio-enhancements-browser`
(real Chromium: every Comfort setting applies, persists and fits at 375px on 13 studio pages; a Quest runs to three stars and
is remembered; the Boost is stable for the day and boxes a clean answer; a streak toast fires).
