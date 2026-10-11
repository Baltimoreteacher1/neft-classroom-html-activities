# Math Fluency Lab

Grades 1–8, 80 focused skills. The curriculum hub links here under Featured Learning Resources.

Students can explore three checked visual steps, complete a starting-point checkup, practice with adaptive support, revisit a personal daily mix, and repair mistakes with fresh problems. Each set generates new problems; the smallest fact domains intentionally revisit a finite set of facts.

The Game Room has four untimed games on the grade's own fact trail: Fact Match (flip cards to pair problems with answers), Target Hunt (find every problem that equals a target), Answer Sort (sort problems by whether the answer is below a number), and Mystery Picture (type answers to clear fog from one of six hidden pictures). Calm mode uses fewer cards and gives the picture a head start; read-aloud works in the games. Each trail round ends with an optional "How did you think about it?" and every day the trail shows one strategy tip. Trail rounds and games earn stars, stickers, a rank, and a practice-day streak; everything is stored on the device with the other progress, and the JSON backup now carries trail stars, the fact chart, stickers, and strategy notes. "Download my facts report" saves the tricky facts (no names); the teacher studio can open several of those files for a class facts snapshot, and an assignment link can name a game and a set of facts. Games never show a model that computes an answer, and the fact chart fills only from first-try typed answers.

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
