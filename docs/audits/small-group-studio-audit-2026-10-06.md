# Small-group studio audit — 2026-10-06

Scope: all 204 small-group studios (84 × Group 1, 84 × Group 2, 36 catch-ups)
at `eduwonderlab.com/lessons/<id>/`. Method: every step of 2-3 Group 1 walked
and screenshotted live; 2-3 G2, 5-4 G1, 7-6 G1, 9-2 G2 outlined; then a
per-lesson content audit of all 84 base lessons by 16 reviewers reading each
studio's config against the lesson's objective and its Build section.

## Verdict

Only **Build the Idea** (rebuilt 2026-10-04) taught the lesson. Every step
after it was generated from topic templates and drifted, and the shell around
it buried the mathematics under tools.

## Critique

### 1. Practice did not practise the lesson (content — the main defect)

`parallelPractice` (2,376 items) was stamped from topic-family templates. The
audit found off-lesson or broken practice in essentially every unit:

| Lesson                    | What students got                                                                                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2-3 Median                | Guided practice opened with "Add all values" (the mean); talk prompt was mean vs mode; Hands-On placed mean/median/mode markers; "More practice" was a _mean_ mistake |
| 2-5 Range/IQR             | All 12 items asked for the _shape_ of a distribution                                                                                                                  |
| 2-8 Mean                  | Every item asked for mean, median **and** mode; no fair-share or target-mean item                                                                                     |
| 2-10 Mean vs median       | All 12 answers were "median" — the same data with one outlier added                                                                                                   |
| 3-4 Graph ratios          | Copied from 3-3; no ordered pairs or graph at all                                                                                                                     |
| 3-7 Convert units         | Gold/blue tile ratios; never converts a unit                                                                                                                          |
| 4-1 Percent as rate       | All items converted percent → decimal (4-2's skill)                                                                                                                   |
| 5-8 Pyramids              | Slant heights that make the pyramid impossible                                                                                                                        |
| 5-9 Regular polygons      | "Regular hexagon" with heights no regular hexagon has                                                                                                                 |
| 6-4 Order of operations   | All 24 items evaluated `2x + 4` (6-5's skill)                                                                                                                         |
| 6-9 Whole ÷ fraction      | Items read "8 ÷ 1." — the template dropped the fraction                                                                                                               |
| 7-2 / 7-4                 | Identical 12 items in both lessons                                                                                                                                    |
| 7-7 Polygons on the plane | All items were quadrant naming (7-8)                                                                                                                                  |
| 9-2 Graphs                | Bare x→y tables; G2's transfer check was a unit conversion                                                                                                            |
| 10-3 Tower of Hanoi       | Exponent drill                                                                                                                                                        |
| 1-x / 10-x exit tickets   | "Which statement best shows math is…" — no mathematics                                                                                                                |

Also: Group 2 was usually Group 1 with bigger numbers; hints were generic
("Re-read the question"); several exit tickets' feedback did not match their
choices (6-4, 6-9, 6-11).

### 2. The flow was confusing (structure)

- Two navigation levels at once: 3 parts × 3 sub-steps, with "1 Focus & Learn"
  and "Step 1 of 3 · Key Words" on screen together.
- A "Private readiness pulse" before any mathematics.
- Each problem carried a strategy picker (Write / Draw / Manipulatives / Talk),
  Check my thinking, Break it into steps, Open hint 1, Try Another Way and Show
  the guidance — six or more controls on one problem.
- Practice Studio also stacked a Data Lab, an adaptive coach, a role-rotation
  talk timer, a recorder and a five-step "Team consensus protocol".
- Check & Growth asked Group 1 support students to pick a Level 2/3/4, write
  "Justify / Generalize / Create" tasks, and self-rate against criteria whose
  example evidence was "my factor tree shows every prime factor" in a median
  lesson.
- The mission briefing reused the Notice & Wonder context with an unrelated
  dot plot; Apply offered six generic "moves" (Multiply or scale, Break into
  factors…) for every problem.
- A station timer floated over every student page.

## What was built

1. **Authored practice for every lesson** — `data/small-group-practice/<lesson>.json`
   (contract `docs/specs/small-group-practice-v1.md`, gate
   `npm run validate:small-group-practice`). Per group: 2 Practice Together
   problems solved step by step (typed step answers), 4 On My Own problems,
   one talk prompt with two sentence frames, a 2-problem Check (like the
   lesson + new context), and one Challenge. Catch-ups get 2 problems + 1
   check per covered lesson. Group 2 works backward, compares methods and
   explains why on two problems. Spanish for every field. Every answer
   independently re-solved by a second reviewer.
2. **One flat path** — Key Words → Learn It → Practice Together → On My Own →
   Check → Apply (or Challenge). One strip, numbered once.
3. **One problem card** — Problem (read aloud) → figure → answer box → Check →
   Hint → "Show the steps" after a miss. The Check withholds hints until the
   student tries and records the first try for the teacher.
4. **Removed from the student path**: readiness pulse, sub-step strips,
   strategy picker, Hands-On lab, Data Labs, coach, consensus protocol, talk
   timer/recorder, mastery ladder (module deleted), mission briefing, Apply
   "moves" picker, Go Deeper, student station timer (now teacher-only).
   Teacher console, evidence sync, misconception tracking, Spanish lane,
   save/resume and the Reveal Apply problem are kept.

## Apply problems and the other surfaces (follow-up, same day)

Joel: the Reveal lessons in `~/Desktop/Reveal Math by Unit and Lesson/` are the
current lessons. Checked against every Apply slide in those 54 decks:

- The site's Apply problems ARE the decks' problems (Middle School Fundraiser,
  Which Brand to Buy?, Street Corn, Football Plays, Snack Bags, …). They looked
  off-lesson only because one Desktop lesson spans two sessions and the site
  splits it in two. Kept. 3-3 now carries the deck's instruction (compare with
  a ratio table) and a ratio-table sample answer; 9-4's sample answer no longer
  claims the wrong break-even.
- **26 group studios had no Apply step at all** (2-8, 4-3, 7-1, 7-7, 9-1–9-4,
  1-3–1-5, 10-1, 10-3 × 2 groups): the 2026-08-10 renumber stripped their old
  problems and the generator never let the base lesson's new one through. The
  Apply problem is now owned by `tools/lib/small-group-build.mjs` and copied
  from the base lesson on every run.
- Kept out of the studio, with the reason in the data (`apply.use: false`):
  5-5 Buying Popcorn (no measurements), 6-5 Acceptable Quality Levels (a
  percent problem), 10-3 The 15 Puzzle (parity argument; Unit 10 has no
  Desktop deck). Those studios end on the Challenge.
- **Apply Day (Part 2)** leveled tables now draw from the authored practice
  first (Level 1 = catch-up + Group 1's easy half, Level 2 = both groups'
  grade-level halves, Level 3 = the state item + Group 2's hard half); the
  inherited tiers only top a level up. 2-3's Level 1 was "Find the mean…".
- **Small-group printed worksheets** print the studio's own problems: Set A =
  Practice Together (as guided steps) + On My Own; Set B = Your turn + Check +
  Challenge (catch-ups: the per-lesson checks). The "Explain your thinking" box
  uses the lesson's talk prompt instead of the inherited Explore discourse.
  One converter (`tools/lib/small-group-practice-items.mjs`) serves both.

## Not changed (reported for follow-up)

- The core lessons' own practice tiers still drift in places (2-3 carries mean
  items; 2-4 carries IQR) — whole-group content, out of this scope.
- Base-lesson config errors found (not small-group content): 6-9 keyIdea titled
  "Dividing Fractions by Fractions"; 10-5 keyIdea about tessellations; 9-1
  warm-up contradicts itself ($8 ticket vs 8t = 56); 7-3 image alt in feet vs
  text in meters; 5-2/5-3/5-4 optional-item feedback about the wrong shape;
  9-4 apply sample answer's break-even claim.
