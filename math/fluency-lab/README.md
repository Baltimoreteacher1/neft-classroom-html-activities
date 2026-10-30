# Math Fluency Lab

Grades 1–8, 88 focused skills. The curriculum hub links here under Featured Learning Resources.

Students can explore three checked visual steps, complete a starting-point checkup, practice with adaptive support, revisit a personal daily mix, and repair mistakes with fresh problems. Each set generates new problems; the smallest fact domains intentionally revisit a finite set of facts.

The Game Room combines untimed fact games, model-first challenges, and four grade-appropriate puzzle worlds. The original games use the grade's fact trail: Fact Match (flip cards to pair problems with answers), Target Hunt (find every problem that equals a target), Answer Sort (sort problems by whether the answer is below a number), Spot the Mistake (find the wrong step in a solution, or decide whether a classmate's answer is right, then fix it), Make It (tap two tiles that add or multiply to the target; every board hides several pairs), Fact Family Builder (Grades 1–5: place three numbers into four related equations, in both orders), Balance It (a scale shows one side as a problem and the other as a part plus a missing number; the beam tilts toward the heavier side after each try but never gives the number), Tricky Facts (flash cards built from facts and problems the learner missed lately: type the answer, a wrong try shows steps up to but not including the answer step, a right answer retires the card), and Mystery Picture (type answers to clear fog from one of six hidden pictures). Model-first play also includes Number Quest, Array Architect, and Fraction Forge. Equation Factory models inverse operations and equations, Fraction Bridge builds exact fractional spans, Balance Station checks equations with a responsive scale, and Ratio City scales quantities in proportional models. Puzzle attempts feed the shared local evidence engine; independent attempts and supported revisions are kept separate. Games include decimals, fractions, and equations, and can draw from any of the grade's skills as well as its trail stops. Game messages are announced through one persistent screen-reader live region, focus moves to the new screen, and forced-colors mode keeps every state distinguishable. In mixed play, up to a third of each board is facts the learner missed on an earlier day. Every trail ends with a Boss round that opens when each stop has 2 stars. Teachers can print paper versions of Fact Match, Target Hunt, and Answer Sort (answer key on its own page) and pick skills by standard. The class snapshot can compare two weeks of facts reports, and a one-page family summary (stars, streak, tricky facts, things to ask and try) can be printed or saved as a file. Calm mode uses fewer cards and gives the picture a head start; read-aloud works in the games. Each trail round ends with an optional "How did you think about it?" and every day the trail shows one strategy tip. Trail rounds and games earn stars, stickers, a rank, and a practice-day streak; everything is stored on the device with the other progress, and the JSON backup now carries trail stars, the fact chart, stickers, and strategy notes. "Download my facts report" saves the tricky facts (no names); the teacher studio can open several of those files for a class facts snapshot, and an assignment link can name a game and a set of facts. The fact chart continues to fill only from first-try typed answers; puzzle-world evidence is recorded separately through the local tutoring engine.

Teacher studio creates shareable assignments for selected skills, a problem count, and a support level. The same link generates new questions each visit. Five-day printable packets optionally include a separate teacher answer key. Family progress views, CSV reports, and JSON backups work locally.

The three longer-form publisher games share the same evidence and reward records. **Math World Builder** sets a target floor area and, from Grade 3, a fence-material budget; changing row and column controls redraws the building grid and updates both calculations. **Number Puzzle Studio** presents a tile bank with multiple valid addition or multiplication pairs for each target, supports touch or keyboard selection, and explains the pair after checking. **Fluency Rally** presents an untimed route checkpoint: students choose the route matching a multi-operation expression, calculate its distance, and enter the result. All three provide hints, feedback, five challenge levels, saved completion rewards, and grade-appropriate teacher assignments.

## Progress rules

- Profiles are local learner slots, not student accounts or a school roster.
- First independent responses establish evidence. Hints, retries, visual lessons, and coached answers cannot inflate independent mastery.
- A skill is remembered after at least eight recent independent checks, at least 85% success, and successful practice on two days. Recent unsuccessful work removes that status.
- Review intervals grow from one to fourteen days. A short checkup recommends topics; it does not assign a grade level.
- Two fresh independent successes in a row during repair practice resolve that skill’s notebook entries.
- Every mode is untimed. Sessions save on each response and navigation, including Streak (10 correct in a row at any pace).
- Older progress or backup files that carry the retired `sprintBest` field still load; the field is ignored.

No analytics, student names, central database, or network submission is added. Share assignment links through the school’s existing classroom system. Use downloaded reports there if collection is needed.

## Local use and verification

```sh
npm run dev -- --host 127.0.0.1
npm run validate:fluency
node tools/fluency-tutor.test.mjs
node tools/fluency-games.test.mjs
node tools/fluency-tutor-ui.test.mjs
node tools/package-fluency-desktop.mjs '/dedicated/output/Math Fluency Lab'
```

The packaging command creates both a browser-served folder and a self-contained `Math Fluency Lab.html` for offline use. JSON backups transfer progress between those origins and the live site. Local-file storage support depends on the browser; a visible warning reports write failures.

## Español

The page header has an English / Español button. Spanish covers the page tabs, the trail (stop names, ideas, rewards, boss round, strategy tips, teach-back), the whole Game Room, stickers, the family summary, and the language layer below. Math problems are not replaced: the English stays on screen as the practice, and a "See it in Spanish" peek (plus the Spanish read-aloud button) shows the same question in Spanish. Skill titles and worked-example steps stay in English. Spanish text lives in `i18n-es.js` and `i18n-es-language.js` (English text is the key); `tools/fluency-i18n.test.mjs` fails if a learner-facing string has no Spanish entry or its placeholders differ.

## Language layer (math, language, writing)

Every learner picks a **Talk & write help** level (Starter, Building, Growing, On my own; saved per learner on the device, changeable any time). It changes how much of a sentence is given, never the math, and it is not a proficiency score.

- **Words** (`language-terms.js`): a bilingual word bank (English, Español, a plain meaning in both, a "looks alike" flag) mapped to all 88 skills. Meanings contain no digits, so a word card cannot echo an answer. The Learn tab and Starter-level practice show the skill's words with read-aloud in both languages.
- **Explain card** (`language-card.js`, `language-frames.js`): after an answer (right or wrong) a card offers four moves (notice, explain, compare, check) plus "fix it" after a slip, with sentence frames at the learner's level in English or Español, word-bank chips, joining words, and a microphone. The writing is read for four ideas (a math word, a reason, a first-then order, a way to check) and shown as a checklist, never as a mark.
- **Math journal** (`language-journal.js`): saved explanations stay on the device, print as a one-page journal, and travel in the JSON backup (`play-backup.js`). The family summary shows counts only, with a bilingual starter to try at home.
- **Academic Language** on the progress card is evidence-based: it reads "Not enough yet" until the learner has written or looked up words, then blends the four ideas in the last 20 entries, the variety of math words, and word lookups.
- **Spanish stems** (`question-es.js`, `story-problems.js`): every generated question stem has a Spanish version with the same numbers; story problems carry Spanish wording. `tools/fluency-language.test.mjs` generates thousands of questions across all 88 skills and fails on any wordy stem without a Spanish rule or a changed number.
- **Teacher**: the teacher studio's "Print the language pack" prints, for the chosen skills, the words in both languages, the frames at each level, a partner-talk task, and a teacher page that explains the levels (with WIDA ELD Standard 3 language functions, no placement).

## Math Writing Studio

The **Write** tab (and "Write about it" on every skill's Learn page) is a writing room for math. A learner picks an organizer, gets a fresh problem from any skill, writes one part at a time, and watches the paragraph build. Writing never changes practice evidence or mastery, and nothing is graded.

- **Five organizers** (`writing-organizers.js`): Math paragraph (topic sentence, steps, because, check, closing), Test-style response (restate, answer, show your work, explain), Claim-evidence-reasoning, Compare two ways, and Find and fix the mistake. Each part has one job (say it, show it, explain why, check it, wrap up) and a colour that follows the job into the finished paragraph. Colour is always paired with the job's name. Every organizer has a worked model about a different problem.
- **Four support levels** are the same Starter, Building, Growing and On my own as the explain card. Each part offers a sentence starter that fades with the level (level 4 shows the task only, with "Need a starter?"). Starters contain no numbers, so one can never state an answer. English and Español are a writing choice separate from the page language.
- **Practice like the test** turns any organizer into one ruled response box with no starters or word bank, plus the four-idea checklist and two self-check boxes.
- **Prompts** (`writing-prompts.js`) generate a new problem from the chosen skill. Claim-evidence-reasoning and find-and-fix show a classmate's answer that is either correct or a plausible slip (a slip is never labelled), so the learner decides.
- **Checklist**: the four language moves the journal reads (math word, reason, first-then order, a check). It shows ideas the words already carry; it is not a grade.
- **Folder, print, backup**: finished pieces (`writing-store.js`) stay on the device, print as a one-page piece, and travel in the JSON backup (`play-backup.js`). "Print a blank organizer" gives ruled paper for writing by hand.

Test: `node tools/fluency-writing.test.mjs`. New learner strings need Spanish in `i18n-es-language.js`.

## Explanation steps

Guided steps (Learn it, the step player, live help, and "Work it with me" in practice) share one workbook-card style in `explain.css`: one idea per card, large type, a short "why" callout, and the picture directly under the words. Step wording lives in `detail-steps.js` and the generators in `problem-bank.js`: one idea per step, short sentences, number sentences instead of prose. Two-digit by two-digit multiplication splits the first factor, matching the area model beside the problem.

The picture beside the steps follows the active step (`step-model-link.js`, pinned by `tools/fluency-step-model-link.test.mjs`). In the area model, the split step marks the split, each partial-product step lights its own part with a "Step n of N" tag, finished parts get a check, and the adding step lights the total with arrows up from the parts. Tapping any step shows it in the picture. Other pictures are left alone.

## Kindergarten to Grade 3 explanations

Young learners get their own wording (`kid-steps.js`, applied in `problem-bank.js` before the older step writers): short sentences, no vocabulary words (addend, digit, quotient, interval, regroup), one idea per step, and number sentences wherever a picture can be drawn. `kid-learn.js` holds the "big idea" and "watch out" lines for every K-3 skill, in English and Español, from one table. Step pictures include a ten-frame ("Picture 10 boxes. 5 are full."), split bars ("Split 7 into 5 and 2."), tens-and-ones blocks, place-name boxes, and tens blocks for comparing numbers. A builder returns null for a shape it does not know and the skill's own steps stay. `tools/fluency-kid-steps.test.mjs` checks every K-3 draw for jargon, sentence length, true arithmetic, step count and answer-only-on-the-last-step.

## Fraction pictures

Fraction problems (Grades 3-8) now have a picture beside the steps (`fraction-picture.js`, pinned by `tools/fluency-fraction-picture.test.mjs`): equal-part bars for equivalent and compared fractions, renamed bars with the same-size pieces for adding and subtracting, a column-and-row grid for "a fraction of a fraction", a bar with one piece outlined for dividing fractions, a bar cut into groups for "a fraction of a number", and wholes cut into servings for dividing a whole by a unit fraction. The Learn example draws the result; the practice model stops before it. Negative fractions, mixed numbers and very large parts get no picture rather than a wrong one. The step link lights the bar a step names (or the renamed and result bars for the "common denominator" and last steps) and the grid's tops, bottoms or result.

## Buddy and weekly goal

Every learner has a buddy (no name, no photo). Six colors are free; hats, face items and back items unlock with stickers and ranks, so a buddy's look is always earned. The buddy shows on the trail strip and cheers after each game with a short message that praises thinking, never speed. A weekly goal of 2–5 practice days (Monday to Sunday) is set in the Game Room; meeting it earns a sticker. Buddy look, goal, retired flash cards, and missed-fact cards travel with the JSON backup.

## Steps that explain, and "Your turn"

Every guided step says what to do and why, in plain words. `detail-steps.js` writes number-specific steps (with reasons) for whole-number and decimal arithmetic, fractions, rounding, area/perimeter/volume, coins, equations, percent, unit rates, probability, and more; `step-whys.js` adds a one-line reason under the fact-strategy number sentences. When a step ends in a partial result (for example `34 + 50 = 84`), the learner types that number first ("Your turn"): a right entry opens the step, a wrong one gets a nudge, and two misses open it so nobody is stuck. The next step waits for the typed number, and the result is never in the page until then (`step-fill.js`, pinned by `tools/fluency-step-fill.test.mjs`).

## Models that open with the problem's own numbers

Every model opens loaded with the problem on screen (`problem-numbers.js` reads the numbers, story problems through `item.expr`): the Interactive Solver, the Math Tool Drawer (with a "Use this problem" / "Try my own numbers" bar), the "Show the model" picture and the guided step pictures. Adding and subtracting whole numbers and decimals use the stacked column method (`vertical-columns.js`): the numbers lined up by place value, empty answer boxes and empty regrouping boxes the learner fills; a box says right or try again, and two misses open it. There are no number-line jumps for adding or subtracting. While the answer is not earned, models show only what the learner builds and the givens (totals, products, net values and unit rates are masked), and a first miss or "Show a step" shows steps up to `peekCap` (`live-help.js`) instead of the worked solution. `tools/fluency-model-inputs.test.mjs` pins this for all 88 skills; the audit is in `docs/fluency-models-audit.md`.

## Comfort and keepsakes

The header has a Reading font switch (Lexend, more letter and line spacing) and an optional Sound switch (soft chimes for a right answer or a finished game; nothing plays for a wrong answer; off by default). The Progress area can print a Certificate of Achievement with the learner's rank, trail stops, stars, and stickers, in English or Spanish.

## Answer-free steps and wrong-answer notes

`step-leak.js` (`peekCap`) decides how many guided steps can show before one states the answer; "Show a step", the trail miss screen, Tricky Facts, Mystery Picture and the post-game review all use it, and `tools/fluency-audit-fixes.test.mjs` fails if any of the 88 skills leaks. A step that is only a list ("Factors of 48: 1, 2, 3…") counts as a search space, not an answer. When a problem has no safe step the hint shows instead. After a trail miss the learner sees the safe steps, then a fresh problem of the same kind returns as the "one more look". `mistake-notes.js` adds a one-line note on the likely slip (adding instead of subtracting, a reversed order, one group off, a place-value slip); it never contains a number. Mixed numbers ("1 5/12") are read as mixed numbers. A practice day counts for any finished practice set, trail round or game, and earned streak stickers stay earned (`bestStreak`).
