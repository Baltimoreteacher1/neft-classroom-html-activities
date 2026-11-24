# Language Bridge: Read it 3 ways + Word Bridge

Family practice pages (`lessons/<id>/homework.html`, 166 pages). Shipped 2026-11-24.
Code: `assets/family-studio/language-bridge.mjs` (DOM), `assets/family-studio/language-logic.mjs`
(pure text logic), styles in `assets/family-studio/studio.css`. Proof: `tools/family-language-bridge.test.mjs`.

## What a family sees

**Read it 3 ways** (👀 button beside Listen on every word problem). It runs the Three Reads routine that
teachers use with multilingual learners:

1. **The story**: the problem with every number shown as a dashed `?` and the question held back.
   "What is happening? Tell each other in your own words." Frame: _This story is about \_\_\_._
2. **The numbers**: the full problem. Each number is a chip in the "given" colour. Tapping it checks it
   off and shows the word the story puts after it ("crayons"). A tally reads "2 of 3 numbers talked
   about". Frame: _The number \_\_\_ tells us \_\_\_._
3. **The question**: the asking sentence, highlighted in the "unknown" colour. Frame: _We need to find
   \_\_\_._ **Start solving** closes the panel and puts focus in the answer box.

**Word Bridge** (Discover stop, before the optional extras; shown when 3 or more of tonight's words are
twins). Headline: "7 of tonight's 9 math words are word twins". Each twin pair appears side by side
with the letters it shares underlined, plus a Listen button that reads both words. Two more parts:

- **Match the twins**: tap an English word, then its Spanish twin. A miss explains which word that
  Spanish twin really goes with.
- **New words to learn by meaning**: the words that are not twins, with their plain definitions.

Both features follow the page's EN / ES / both switch, read aloud through `window.hwVoice` (the button
is hidden when the device cannot speak), and store or send nothing. There are no timers, scores, or
points.

## Why these two (the debate)

The page already has a lot: route picker, 5 stops, hint ladder, worked example, Understand / Play
studio, read-aloud in both languages, voice memo, photobooth, games, confused-grown-up, glitch, take-home
PDFs. Another feature has to earn its place. A parallel Freebuff branch
(`freebuff/family-practice-pages-improvement`) is building model manipulatives per `model.kind`,
predict-then-reveal, a faded worked example, tap-the-glitch, a Finish moment, and a "this week" strip.
Anything that overlaps those was out.

| Idea                                                             | Verdict          | Reason                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Three Reads on word problems                                     | **Built**        | The best-known routine for multilingual learners on word problems, and missing here. It works on 832 problems from text that already exists, and it cannot reveal an answer because it only hides or re-shows the problem's own words. |
| Spanish word twins (cognates)                                    | **Built**        | 185 of 437 vocabulary pairs are twins; on 6-6 it is 7 of 9. It treats the family's Spanish as an advantage, not a gap. It is computed from the lesson's own glossary, so there is nothing new to author or translate.                  |
| Speech-to-text answers / pronunciation scoring                   | Rejected         | Browser speech recognition sends a child's audio to a cloud service. That is a privacy problem for students, and it is unreliable for accented speech.                                                                                 |
| Live "grown-up coach" prompts after each check                   | Rejected         | Already there: every feedback card carries a Parent Coach Tip, and the both-languages mode covers mixed-language homes.                                                                                                                |
| Which One Doesn't Belong / TPR gestures per word                 | Rejected for now | Strong ideas, but each needs new authored content for 166 lessons, plus review of the Spanish and the math. Without that content they would become a quiz skin.                                                                        |
| Manipulatives, predict-reveal, faded example, finish, week strip | Not here         | Owned by the Freebuff branch. Building them twice would make two implementations that drift.                                                                                                                                           |
| A dual-device "parent phone / child phone" mode                  | Rejected         | Needs a sync backend, which the pages do not have (they make no network calls).                                                                                                                                                        |

## Rules the code keeps (and the tests prove)

- **Read 2 is the problem itself**, character for character. Read 1 shows no number. Read 3 is a
  sentence from the problem. All three are swept over every stem on every page.
- **What counts as a word problem**: 10+ words, a question, and at least one number that names what it
  counts ("20 crayons") or is money. Labels ("Row 1", "Step 2") and ratios ("2:3") are not quantities.
  Pure computation and expressions do not get the button. Result: 832 of 2,727 stems. The Spanish read
  follows the English decision, so the two languages never disagree about whether a problem gets the
  button.
- **Twins are conservative**: every English content word must pair with a Spanish word at 0.72
  likeness or better, after the usual spelling changes (-tion/-ción, -ty/-dad, -ify/-ificar, ph/f, qu/c,
  z/c, es+consonant). The first three letters must agree (or the words be near-identical, as in equation/ecuación), terms longer than three words (lesson titles)
  never count, and known false friends never count. Ratio/razón, rate/tasa, mean/media, and
  quotient/cociente are deliberately NOT called twins.
- Spanish words that must stay visible in English mode use `lang="es-US"`. The page's English mode
  hides `[lang="es"]` (exact match), and the screen reader still pronounces `es-US` in Spanish.
- Everything loads lazily from `decoratePractice()` (idle time, after the page is usable), so first-view
  weight is unchanged. No generator change; no page was regenerated.

## Known limits

- The "what it counts" hint is the word right after the number. When the story names the thing
  earlier ("the bike travels 4"), the chip shows only a check, and the family says the rest.
- Twins are decided by spelling. A native-speaker review of the 185 pairs is still worth doing
  (`npm run export:family-spanish-review` does not cover them yet).
