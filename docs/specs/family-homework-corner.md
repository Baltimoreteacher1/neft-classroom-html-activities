# Family homework: lesson-specific corner content and basic practice

Joel (2026-10-15): `/lessons/4-1-part2/homework` ("percents greater than 100%") told families to draw a 25% discount in the
Family Activity Corner, a concept the lesson never covers, and it had too little basic practice. The page's pieces came from unit-wide
defaults in code (`homework-family-guidance.mjs`, `getTopicMisconception`, `getTopicPowerUp`, `getRealWorldSpotlight`). A unit is too broad
to choose a lesson's task, so every page now carries its own authored content in `data/family-homework-notes/<id>.json`.

## What each sidecar gets (two new top-level keys; touch nothing else in the file)

```jsonc
"corner": {
  "mission":  { "en": "...", "es": "..." },   // the Family Activity Corner task: 2-4 sentences, paper and pencil, real objects optional
  "question": { "en": "...", "es": "..." },   // the "Talk about it" question an adult can ask; also the parent coach question
  "frame":    { "en": "...", "es": "..." },   // a sentence frame with ___ blanks the student can complete
  "spotlight": { "titleEn": "", "titleEs": "", "factEn": "", "factEs": "", "icon": "🏆" },   // "why this matters": a real-world use of THIS idea
  "watchOut": { "en": "...", "es": "..." },   // the one misconception to listen for, stated as what a student might think
  "powerUp":  { "qEn": "", "qEs": "", "choices": [ {"en":"","es":""}, {..}, {..} ], "correctIndex": 0|1|2, "hintEn": "", "hintEs": "" }
},
"basicPractice": [ /* exactly 6 multiple-choice items, same shape as lessons/<id>/config.json practice items */ ]
```

`corner` is required for every page that has no exact lesson-specific family support already (`needsCorner(id)` in
`tools/lib/family-homework-content.mjs` tells you; for those lessons skip `corner` and write only `basicPractice`).
`basicPractice` is required for every page.

Worked model: `data/family-homework-notes/4-1-part2.json` (read its `corner` and `basicPractice`).

## Rules (these are the point of the task)

1. **Only the lesson's own ideas.** Everything on a page is about the idea that page teaches, and ideas taught earlier. Before writing, read
   the page's sidecar (`sessionTitle`, `learningTonight`, `bigIdea`, `conceptSteps`, `watchFor`, `tryTogether`, `vocabulary`), the lesson config
   (`lessons/<id>/config.json`: `title`, `contentObjective`, `vocabulary`, `launch.conceptIntro`, `practice`) and for a `-part2` page the Apply-Day
   config (`lessons/<id>/config.json`, `groupLevels`) — a part 2 is the lesson's SECOND session, so its idea can differ from part 1 (4-1 is "understand
   percent"; 4-1-part2 is "percents greater than 100%"). If the mission mentions money, discounts, recipes, a unit rate, a shape, a graph, etc.,
   that thing must be what the lesson is about.
2. **Basic practice is plain skill reps.** Six short, direct items on the lesson's core skill, ordered easiest first, each answerable in under a
   minute with paper and pencil: recognize, convert, compute one step, name, compare, match a representation to a number. They come BEFORE the
   existing warm-up (which asks students to reason), so they are the "do the basic move" reps. Not word-problem essays, not "find the error".
   Use small friendly numbers. Items 1-2 can be one-step; items 5-6 can be a short two-step or a simple context. Vary what is asked.
3. **Item quality.** Four choices where natural (three is fine). Wrong choices are *specific misconceptions* a student really has, each with
   `choiceFeedback` explaining why that choice is wrong in one kind sentence (the correct choice's feedback is the empty string `""`).
   Put the correct answer at different positions across the six items (at least two different positions; aim for all four used).
   `explanation` states the correct answer and why. `hints` is exactly 3 rungs: (1) a question that points at what to notice, (2) a strategy or
   picture cue, (3) a first step. Hint 1 never states the answer. Every English field has a Spanish sibling: `stemEs`, `choicesEs`, `explanationEs`,
   `choiceFeedbackEs`, `hintsEs`. Keep Spanish natural and simple (no Spanglish). Numbers and symbols may be identical in both languages.
4. **Math must be exactly right.** Recompute every answer yourself, then confirm with a quick node/python check for arithmetic items. Units, signs, and
   rounding must be correct and unambiguous (one correct choice). Notation: use × and −, "÷", fractions as 3/4, percents with %.
5. **No timers or countdowns, no `find the error` items, no "Unit 10" content.** Do not name brands or real people. Keep reading level grade 6 or below.
6. **No copy-paste between lessons.** Missions, power-ups and stems must differ page to page (the validator fails on repeats across lessons). A base
   lesson and its `-part2` are different sessions: write different content.
7. **Power-up**: one clear question on the lesson's core idea (not harder than the warm-ups), three distinct choices, one correct; vary `correctIndex`.
8. **Corner mission**: something a family can do at home in about 5 minutes that practices THIS idea (draw, measure, count, sort, compare, build a table).
   It must be doable without any special materials. The step-2 text ("Show a labeled drawing...") is added automatically; do not write it.

## How to work

- Edit only `data/family-homework-notes/<id>.json` for your assigned ids; keep every existing key and the file's 2-space JSON format
  (`json.dump(d, f, indent=2, ensure_ascii=False)` plus a trailing newline).
- Check your pages: `node tools/validate-family-homework-content.mjs <id> <id> ...` must print the success line.
- Look at one rendered page for each lesson type you wrote: `node scripts/generate-homework-html.mjs` regenerates every homework page (about a minute; it
  also rewrites `assets/homework/` hashed files, which is expected; do not commit). Then open `/lessons/<id>/homework.html` through a static server
  (`python3 -m http.server <your port>` from the repo root), tap the "Check" step and confirm the six basic items and the corner read well.
  Do NOT run `qa:fast`, `npm test`, other generators, or commit.
- Report: the ids done, anything you could not do, and any lesson whose existing sidecar/config content looked wrong (report, don't fix).
