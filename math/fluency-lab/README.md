# Math Fluency Lab

Grades 1–8, 80 focused skills. The curriculum hub links here under Featured Learning Resources.

Students can explore three checked visual steps, complete a starting-point checkup, practice with adaptive support, revisit a personal daily mix, and repair mistakes with fresh problems. Each set generates new problems; the smallest fact domains intentionally revisit a finite set of facts.

The Game Room has nine untimed games on the grade's own fact trail: Fact Match (flip cards to pair problems with answers), Target Hunt (find every problem that equals a target), Answer Sort (sort problems by whether the answer is below a number), Spot the Mistake (find the wrong step in a solution, or decide whether a classmate's answer is right, then fix it), Make It (tap two tiles that add or multiply to the target; every board hides several pairs), Fact Family Builder (Grades 1–5: place three numbers into four related equations, in both orders), Balance It (a scale shows one side as a problem and the other as a part plus a missing number; the beam tilts toward the heavier side after each try but never gives the number), Tricky Facts (flash cards built from facts and problems the learner missed lately: type the answer, a wrong try shows steps up to but not including the answer step, a right answer retires the card), and Mystery Picture (type answers to clear fog from one of six hidden pictures). Games include decimals, fractions, and equations, and can draw from any of the grade's skills as well as its trail stops. Game messages are announced through one persistent screen-reader live region, focus moves to the new screen, and forced-colors mode keeps every state distinguishable. In mixed play, up to a third of each board is facts the learner missed on an earlier day. Every trail ends with a Boss round that opens when each stop has 2 stars. Teachers can print paper versions of Fact Match, Target Hunt, and Answer Sort (answer key on its own page) and pick skills by standard. The class snapshot can compare two weeks of facts reports, and a one-page family summary (stars, streak, tricky facts, things to ask and try) can be printed or saved as a file. Calm mode uses fewer cards and gives the picture a head start; read-aloud works in the games. Each trail round ends with an optional "How did you think about it?" and every day the trail shows one strategy tip. Trail rounds and games earn stars, stickers, a rank, and a practice-day streak; everything is stored on the device with the other progress, and the JSON backup now carries trail stars, the fact chart, stickers, and strategy notes. "Download my facts report" saves the tricky facts (no names); the teacher studio can open several of those files for a class facts snapshot, and an assignment link can name a game and a set of facts. Games never show a model that computes an answer, and the fact chart fills only from first-try typed answers.

Teacher studio creates shareable assignments for selected skills, a problem count, and a support level. The same link generates new questions each visit. Five-day printable packets optionally include a separate teacher answer key. Family progress views, CSV reports, and JSON backups work locally.

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

The page header has an English / Español button. Spanish covers the page tabs, the trail (stop names, ideas, rewards, boss round, strategy tips, teach-back), the whole Game Room, stickers, and the family summary. Math problems, skill titles, and worked-example steps stay in English. Spanish text lives in `i18n-es.js` (English text is the key); `tools/fluency-i18n.test.mjs` fails if a learner-facing string has no Spanish entry or its placeholders differ.

## Buddy and weekly goal

Every learner has a buddy (no name, no photo). Six colors are free; hats, face items and back items unlock with stickers and ranks, so a buddy's look is always earned. The buddy shows on the trail strip and cheers after each game with a short message that praises thinking, never speed. A weekly goal of 2–5 practice days (Monday to Sunday) is set in the Game Room; meeting it earns a sticker. Buddy look, goal, retired flash cards, and missed-fact cards travel with the JSON backup.

## Steps that explain, and "Your turn"

Every guided step says what to do and why, in plain words. `detail-steps.js` writes number-specific steps (with reasons) for whole-number and decimal arithmetic, fractions, rounding, area/perimeter/volume, coins, equations, percent, unit rates, probability, and more; `step-whys.js` adds a one-line reason under the fact-strategy number sentences. When a step ends in a partial result (for example `34 + 50 = 84`), the learner types that number first ("Your turn"): a right entry opens the step, a wrong one gets a nudge, and two misses open it so nobody is stuck. The next step waits for the typed number, and the result is never in the page until then (`step-fill.js`, pinned by `tools/fluency-step-fill.test.mjs`).

## Comfort and keepsakes

The header has a Reading font switch (Lexend, more letter and line spacing) and an optional Sound switch (soft chimes for a right answer or a finished game; nothing plays for a wrong answer; off by default). The Progress area can print a Certificate of Achievement with the learner's rank, trail stops, stars, and stickers, in English or Spanish.
