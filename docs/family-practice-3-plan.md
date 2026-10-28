# Family Practice 3.0 — slice plan

Status values: NOT STARTED → IMPLEMENTED → TESTED → SHIPPED (live and checked on production).
A slice is done only at SHIPPED. Each slice has its own acceptance checks.

Source of truth for behavior: `docs/specs/family-experience-v1.md`. Visual and
structural contract: this file. Generators own the pages: change `scripts/lib/homework-*`
and regenerate with `node scripts/generate-homework-html.mjs`; never hand-edit a
`lessons/<id>/homework.html`.

## Common acceptance for every slice

- Renders at 390px and 1280px with no horizontal scroll and no clipped control text.
- EN and ES both complete the slice's task without English dependence.
- Keyboard-only path works; visible focus; 44px touch targets on family controls.
- `npm run validate:family-experience-browser -- --lesson=<sample>` passes.
- Save/resume and deep links (`/lessons/<id>/homework.html`) keep working.
- No new third-party code, tracking, or personal data.

## Slices

| #   | Slice                                                                                             | Status                                         | Acceptance (beyond common)                                                                                      |
| --- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1   | Phone language buttons never clip                                                                 | SHIPPED (27ef47b93b, pending production check) | Browser gate fails on clipped label                                                                             |
| 2   | Validator crash on a Check stop with no multiple-choice item                                      | IMPLEMENTED (14c98b5c91)                       | Reports a named failure, no crash                                                                               |
| 3   | Family Coach: three levels (Ask, Show, Explain) per problem                                       | IMPLEMENTED                                                                     | Hints differ per problem; Explain only after an attempt or deliberate request; the answer is never shown at Ask |
| 4   | Stop indicator and one-task-at-a-time stops (Learn, Try Together, Practice, Play, Celebrate)      | IMPLEMENTED                                    | Only one stop's content visible; Back/Next preserve answers; progress reads "Not started" before any attempt    |
| 5   | Lesson launch card: title, goal, time estimate, materials, Start Together, Practice Independently | NOT STARTED                                    | Realistic minutes from the actual problem count                                                                 |
| 6   | Misconception feedback on wrong answers, with a revision attempt                                  | NOT STARTED                                    | Feedback names the likely error; a new attempt is allowed                                                       |
| 7   | Family games: solo and two-player variants of existing games                                      | NOT STARTED                                    | Each game has a non-timed solo mode and no leaderboard                                                          |
| 8   | Real-world family missions with a paper/no-cost alternative                                       | NOT STARTED                                    | Every mission lists a low-resource option                                                                       |
| 9   | Print layout for a single stop's practice                                                         | NOT STARTED                                    | Printed page has no navigation and readable workspace                                                           |
| 10  | Unit-by-unit migration of slices 3–9                                                              | NOT STARTED                                    | Unit 4 first, then Units 1–3, 5–9; Unit 10 out of scope                                                         |

## Process

- Independent slices (3, 6, 7, 8, 9) run in parallel worktrees off `origin/main`.
- Slices 4 and 5 touch the shared hero and stop chrome, so they run in sequence.
- Each slice ends with a commit whose message names the slice number.
- Production ship happens after the sweep on the sampled lessons passes.

## Open findings

- Lesson 10-6: Check stop has no multiple-choice item on the default route, so the
  wrong-answer behavior cannot be tested there (Unit 10 is out of scope).
