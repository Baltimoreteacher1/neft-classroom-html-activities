# Small-group practice — authored content spec (v1)

Source of truth for everything a student does **after** "Learn it" in a
small-group studio (`N-M-group1`, `N-M-group2`, `N-M-catchup`): Practice
Together, On My Own, Talk, Check and the optional Challenge. One file per base
lesson:

```
data/small-group-practice/<unit>-<lesson>.json      e.g. data/small-group-practice/2-3.json
```

`tools/lib/small-group-build.mjs` copies `group1` / `group2` into
`launch.practice` of the matching studio config, and composes a catch-up's
practice from the `catchup` block of every lesson it covers.
`node tools/validate-small-group-practice.mjs [lesson…]` checks every countable
rule below.

## Why this exists (audit, 2026-10-06)

The studio's practice came from `parallelPractice` — 2,376 items stamped from
topic-family templates. In 2-3 (a **median** lesson) the first guided problem
opened with "Add all values" (the mean), "More practice" was a mean mistake, the
talk prompt asked mean vs mode, and the Hands-On lab placed mean/median/mode
markers. In 9-2 (graphs of relationships) the transfer check was a unit
conversion. Build the Idea taught one thing and every later step practised
something else. This file makes practice continue the exact move the student
just learned, in the same words and the same figures.

## What the student sees

1. **Key Words** → 2. **Learn it** (the Build section, spec v2) →
2. **Practice together** — two problems. Each step asks the student to do one
   thing; they type the step's answer (or tap Show for a step with no box).
   The group talks each step through.
3. **On my own** — four problems, one answer box each, a Hint, and
   "Show the steps" after a miss. Group 2 explains why on two of them. Then
   one talk prompt with two sentence frames — last, because it often names a
   mistake from these problems.
4. **Check** — two problems, first try counts: one like the lesson, one in a
   new situation (same skill). Then a one-tap "How sure are you now?".
5. **Apply** — the base lesson's Reveal word problem, then an optional
   **Challenge** (one stretch problem).

## File shape

```jsonc
{
  "lesson": "2-3",
  "apply": { "use": false, "why": "…" },        // OPTIONAL — keep the Reveal Apply problem out of the studio
  "group1": {
    "together": [Together, Together],           // exactly 2
    "onMyOwn": [Item, Item, Item, Item],        // exactly 4
    "talk": Talk,
    "check": [Item, Item],                      // exactly 2: [0] like the lesson, [1] transfer
    "stretch": Item                             // 1
  },
  "group2": { /* same shape */ },
  "catchup": {
    "practice": [Item, Item],                   // exactly 2
    "check": Item                               // 1
  }
}
```

### Item (On my own, Check, Stretch, catch-up)

```jsonc
{
  "problem": "…", "problemEs": "…",            // ≤ 45 words
  "figure": { /* optional — any spec-v2 figure kind */ },
  // EITHER a typed answer …
  "answer": "7", "answerEs": "…"?,             // answerEs only when the answer has words
  "accept": ["7"],                             // the answer's number must be in here
  // … OR multiple choice (use only for "which / why / what does it mean" questions)
  "choices": ["…", "…", "…"], "choicesEs": [ … ],   // 3–4
  "correct": 0,
  "choiceWhy": ["", "why this is wrong", …], "choiceWhyEs": [ … ],  // "" at `correct`
  "hint": "…", "hintEs": "…",                  // ≤ 30 words; a nudge, never the answer
  "steps": [ModelStep, …],                     // 2–4 — the worked solution, shown on "Show the steps"
  "explain": "…", "explainEs": "…",            // group2 only, optional, ≤ 25 words
  "modelExplanation": "…", "modelExplanationEs": "…"   // with explain, ≤ 45 words
}
```

`ModelStep` is the spec-v2 worked step: `{ "do", "doEs", "math"?, "mathEs"? }`
(`do` ≤ 10 words, verb first; `math` is math only, with `×` `÷` `−`, fractions
`{3/4}`, mixed `2{1/2}`).

### Together

```jsonc
{
  "problem": "…", "problemEs": "…",
  "figure": { /* optional */ },
  "steps": [                                   // 2–4
    { "ask": "…", "askEs": "…",                // ≤ 16 words: one thing to do
      "answer": "3, 7, 7, 10, 13", "answerEs": "…"?,
      "accept": ["7"]? }                       // present → the student TYPES it; absent → a Show tap
  ],
  "answer": "The median is 7.", "answerEs": "…"
}
```

Give **at least one** step per Together problem an `accept` (the student must
produce something), and the step that produces the final number always has
one. Lists and sentences ("3, 7, 7, 10, 13") stay Show-only.

### Talk

```jsonc
{
  "prompt": "…", "promptEs": "…",              // ≤ 30 words, about TODAY's move
  "frames": ["The median is ___ because ___.", "…"], "framesEs": [ … ]   // exactly 2, each with ___
}
```

## Content rules

- **Every problem practises this lesson's objective** — the move the Build
  examples taught, and nothing from the neighbouring lessons. A median lesson
  never asks for a mean (a mean of the two middle values is part of the median
  and is fine). If the objective has two cases (odd/even count, joined/cut-out
  area), practice covers both.
- **A ladder, not a list.** Together 1 is close to Build's worked example;
  Together 2 changes one thing. On my own goes friendly numbers → the lesson's
  real numbers → one word problem → one that needs a decision (which case?
  is it reasonable?). Check [0] mirrors On my own; Check [1] puts the same
  skill in a new context. Stretch is a genuinely harder case.
- **Group 1** (support): small, friendly numbers; one new idea per problem;
  contexts students know (school, sports, food, money). Steps are short.
- **Group 2** (challenge): same objective, harder thinking — unknown values,
  working backward, comparing two methods, a case where a shortcut breaks.
  Two of the four On my own items carry `explain` + `modelExplanation`.
  Together 2's last step asks _why_.
- **Catch-up**: the lesson's core move, friendly numbers, no traps.
- No two problems in a lesson share the same numbers, and none copies Build's
  examples, together problem or tryIt.
- Keep the base lesson's contexts where they fit (Reveal's settings), but new
  numbers.
- **Mindset lessons (1-x, 10-x)**: still real problems with numbers — the
  estimation, pattern or decomposition the lesson's Build uses.
- Hints point to the next move ("Put the values in order first."); they never
  state the answer.
- `choiceWhy` names the specific mistake behind each wrong choice ("That is the
  mean, not the middle value.").

## Writing rules (same as spec v2)

Grade 6 support readers, many English learners. Short, common words. One idea
per sentence. No idioms. Never "the book", "below", "above", "the picture".
Every English field has a natural Latin-American Spanish `…Es` sibling with the
same numbers. Arithmetic stated anywhere (`a op b = c`) must be correct — the
validator evaluates it. Answers must be correct; the validator recomputes what
it can, a reviewer checks the rest.

## The Apply step

A group studio's Apply step is the base lesson's Reveal word problem
(`lessons/<lesson>/config.json → revealWordProblem`), copied into the studio
config on every generator run. The Reveal lessons in
`~/Desktop/Reveal Math by Unit and Lesson/` are the current lessons (Joel,
2026-10-06); where a deck carries an Apply slide, the site's problem is that
slide's problem. Set `"apply": { "use": false, "why": "…" }` only when the
problem does not practise the lesson and no current deck carries it — the
studio then ends on the Challenge.
