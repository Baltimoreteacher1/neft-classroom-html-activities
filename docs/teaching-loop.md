# The teaching loop

Everything else in this repo builds the site. This is the layer that uses it —
five pieces that turn live classroom signal into decisions and drafts.

| Piece                | Command / route                   | What it produces                                                                        |
| -------------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| Open-Response Grader | `/teacher-tools/response-grader/` | Rubric scores + student feedback + misconception clusters for written work              |
| Grading API          | `POST /api/grade/rubric`          | The endpoint behind it (teacher-gated, Claude)                                          |
| Friday close-out     | `npm run closeout`                | `reports/friday-closeout.md` — small groups, watch list, stalled lessons, parent drafts |
| Content decisions    | `npm run decisions`               | `reports/content-decisions.md` — BUILD / REPAIR / PROMOTE / RETIRE                      |
| District ingest      | `npm run ingest -- --file <txt>`  | `reports/ingest-*.md` — item→standard map + aligned practice set                        |

## The identity chain (read this first)

Per-student reporting only works when a student's name reaches the beacon. The
chain is:

```
student picks their name  ->  localStorage nt_student {alias, section}
                          ->  lesson-telemetry.js sends studentName/section
                          ->  lesson_telemetry rows carry an identity
                          ->  friday-closeout can group
```

Two things previously broke this and are now fixed/provisioned:

1. **Key mismatch.** `nt_student` is written as `{alias, section}` by
   `edupulse-bridge.js`, but `lesson-telemetry.js` and `family-letter.js` read
   `.name`. They always saw `undefined`, so every telemetry row landed with an
   empty `student_name`. Both readers now accept either spelling.
2. **`class_roster` was never provisioned.** The table and its rate-limit guard
   now exist in D1 (migration `0003`), so `/api/roster` can hold a class list and
   students can pick their name on any device.

Until a class actually picks names, the close-out will correctly report that it
has no per-student signal. That is the honest state, not a bug.

## What each data source can and cannot tell you

| Source             | Tells you                                       | Does NOT tell you                                                                 |
| ------------------ | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| `lesson_telemetry` | who opened what, how far they got, time on task | whether anything was correct                                                      |
| `game_scores`      | correct/total + misconception tag per attempt   | who — it carries `save_code`, which needs `student_progress` to resolve to a name |
| Grader CSV         | per-student rubric scores on written work       | anything you didn't paste in                                                      |

`friday-closeout` reads all three, and prints which ones were empty rather than
inferring groups from nothing.

## Secrets

- `ANTHROPIC_API_KEY` — required by `/api/grade` and `npm run ingest`. Bound as a
  Pages secret; **secrets bind at deploy**, so a newly added key only reaches the
  Function after the next deploy.
- `TEACHER_KEY` — gates `/api/grade/rubric`. While unset, the route is open (fresh
  project / local dev), matching `/api/roster` and `/api/board`.

## Privacy posture

- The grader writes nothing to D1. Scores live in the tab and leave only as CSV.
- Student display names are first name + last initial by convention, and the
  grader never sends the teacher's labels upstream — it re-attaches them locally
  after the model returns.
- Parent-contact output is a **draft**. Nothing sends mail.
