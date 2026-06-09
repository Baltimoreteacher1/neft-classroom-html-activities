# Template — Answer Key (reference)

Rendered by `lib/generate.mjs → renderAnswerKey(job)` from `lesson.answerKey`
(falls back to answers embedded in `lesson.practice`). Rules enforced by QA:

- Every practice problem number appears in the key (QA blocks on a count
  mismatch).
- Work is shown for teacher use.
- Open-ended items set `teacherJudgment: true` and carry a `rubric` — CardForge
  never ships a bare "answers may vary" (QA warns when it sees one without a
  rubric).
- Math is spot-checked: clean inline claims of the form `mean of a, b, c = x`
  are recomputed; a mismatch blocks QA.
