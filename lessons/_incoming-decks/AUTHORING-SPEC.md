# Authoring spec — book-matching lessons (TOC realignment)

Write ONE JSON file per lesson into the parking dir named below. Do NOT create
folders under lessons/<n-m>/ — those slots are still occupied until the
renumbering. Underscore dirs are invisible to all generators/validators.

## Exemplars (READ FIRST, copy their shape exactly)
- Mindset lessons (Math Is...): lessons/_incoming-mathis/1-1-math-is-mine.json
- Content lessons (Unit 9):     lessons/_incoming-unit9/9-1-explore-relationships.json

## Hard rules
- Source of truth is the deck text in lessons/_incoming-decks/<slug>.txt.
  Use the BOOK'S contexts, names and numbers. Never invent a context when the
  deck provides one.
- Top-level keys must match the exemplar: lessonId, standard, unit, lesson,
  title, theme, themeEmoji, contentObjective, languageObjective, timeEstimate,
  vocabMode, noticeAndWonder, vocabulary (5 terms, EN+ES), launch (badge,
  narrative, conceptIntro with iDo/weDo/youDo), explore (drag-sort with
  categories+cards), connect (scenario/promptQuestion/prompt/keywords/check/
  answers/modelAnswer), practice, reflect.exitTicket, readiness: false.
- practice: approaching[6] onLevel[6-7] extending[4-5], optional: [], plus a
  commonMistake string. Every multiple-choice item needs choiceFeedback (one
  sentence PER wrong choice explaining THAT error — never boilerplate, correct
  slot is "") and 3 hints (progressive, never stating the answer).
- Mindset (MPP.*) lessons: mix open-response with the deck's real arithmetic
  (see 1-1). Do NOT force all-MC.
- ALL arithmetic must be correct — validate:math re-computes it exactly.
- Titles must match the book TOC exactly (data/reveal-toc-2025.json).

## Assignments (file name → standard → deck)
_incoming-unit9/9-2-analyze-graphs.json          6.AT.11  analyze-graphs-of-relationships-between-two-variables.txt   title: Analyze Graphs of Relationships Between Two Variables
_incoming-unit9/9-3-write-equations.json         6.AT.11  write-equations-to-represent-relationships-between-two-variables.txt  title: Write Equations to Represent Relationships Between Two Variables
_incoming-unit9/9-4-apply-two-variable.json      6.AT.11  apply-two-variable-relationships-to-solve-problems.txt      title: Apply Two-Variable Relationships to Solve Problems
_incoming-mathis/1-2-exploring-and-thinking.json 5.NF.B.4   math-is-exploring-and-thinking.txt  title: Math is Exploring and Thinking
_incoming-mathis/1-3-in-my-world.json            5.NBT.B.7  math-is-in-my-world.txt             title: Math is In My World
_incoming-mathis/1-4-explaining-and-sharing.json 5.MD.C.5   math-is-explaining-and-sharing.txt  title: Math is Explaining and Sharing
_incoming-mathis/1-5-finding-patterns.json       5.OA.B.3   math-is-finding-patterns.txt        title: Math is Finding Patterns
_incoming-mathis/1-6-ours.json                   MPP.3      math-is-ours.txt                    title: Math is Ours
_incoming-mathis/10-1-everywhere.json            MPP.3      math-is-everywhere.txt              title: Math is Everywhere
_incoming-mathis/10-2-beauty.json                MPP.7      math-is-beauty.txt                  title: Math is Beauty
_incoming-mathis/10-3-playful.json               MPP.7      math-is-playful.txt                 title: Math is Playful
_incoming-mathis/10-4-ingenuity.json             MPP.4      math-is-ingenuity.txt               title: Math is Ingenuity
_incoming-mathis/10-5-boundless.json             MPP.7      math-is-boundless.txt               title: Math is Boundless
_incoming-mathis/10-6-mine.json                  MPP.3      math-is-mine-1.txt                  title: Math is Mine
  (10-6 is the YEAR-END reflection — "look back at Lesson 1-1", changed attitudes.
   Do not confuse with 1-1.)

unit/lesson fields: from the file name (e.g. 9-2 → unit 9, lesson 2).
