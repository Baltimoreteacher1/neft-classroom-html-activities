# Formative engine: exit tickets and error tracker

Prompt 3, sections 7.3 and 7.4. Studio route: `#/formative`.

## What a teacher gets

- The unit's exit ticket WITH its rubric (emerging, developing, proficient), read from the unit's own
  `language_exit_ticket_json` (`quick_rubric`). A unit with no authored rubric shows no ticket; nothing is invented.
- A tap grid by alias (the class platform's `alias`; never names or initials). Three buttons per alias, so scoring a
  student is one tap; tapping the same level again clears it; with a row focused, keys 1, 2 and 3 score it and move on.
  Scoring a class of 28 is 28 interactions (asserted in `tools/formative-ui.test.mjs`). Taps are batched (350 ms) into
  one request.
- An instant class distribution (counts and whole percents that always add to 100) and the dominant misconception
  card: the unit's `common_language_misconception` pattern, its teacher redirect, and a follow-up activity from the
  unit's own activity list.
- Error tallies by unit: "+1 / -1" on any error type the unit's catalog names, a top-3 table (example, count, share,
  reteach activity) and the weekly trend (last 8 weeks, up / down / flat / new).
- CSV downloads (scores; error trend), built in the browser from data already on the page. Nothing is sent anywhere.
  Cells that start with `= + - @` are neutralised so a spreadsheet never runs them as formulas.
- Student self-scoring for the older band (`5_6`): stored as separate rows (`scored_by = 'self'`) and shown apart from
  the teacher's score, with how often the two match. Students never see a level name.

Copy shown with results: "Inspired by WIDA ACCESS, not official, not a score, not a placement tool."

## Rules that decide the numbers (all in `shared/formative/`, plain browser-safe ESM)

| Question | Rule |
| --- | --- |
| Error catalog (`catalog.js`) | `misc:primary` first, then `doctor:<type>` and `distractor:<type>` for each Language Doctor error type in the unit's ESOL pack, then three fixed `frame:` ids (no linking word, missing required word, blank left empty). Server and Studio use the same list. |
| Dominant misconception (`insights.js`) | Nobody scored: none. Everyone proficient: no card, "no reteach needed". Otherwise the most-tallied catalog entry; no tallies, or a tie: catalog order (so the unit's own misconception wins by default and ties are the same for every teacher), then id. |
| Top 3 | Total count, then catalog order, then id. Zero counts and ids outside the catalog are dropped. |
| Reteach activity | First unit activity whose kind is preferred for the entry's family (`RETEACH_KINDS`), else the unit's first activity. |
| Week | ISO date of the Monday (UTC). |

## API (`functions/api/formative/`)

Teacher credential is the class API's own: `x-class-teacher` (class passcode) or `x-teacher-key` (site key), checked by
`teacherRole()`. Failed credentials are limited to 30 a minute per client (scoring is many small calls from one school
address, so the deletion endpoints' 60-a-minute blanket limiter is not reused).

| Route | Who | Purpose |
| --- | --- | --- |
| `GET /api/formative/summary?code&unitId[&round]` | teacher | ticket + rubric, stored scores (teacher and self apart), catalog, reteach map, weekly error tallies |
| `POST /api/formative/score` | teacher | `{code, unitId, ticketId, scores:[{studentId, level\|null}]}`, at most 60, all-or-nothing |
| `POST /api/formative/errors` | teacher | `{code, unitId, errors:[{type, count}]}`; count -50..50, never below zero, current week |
| `POST /api/formative/self-score` | student (`x-class-student`) | `{code, unitId, ticketId, band:"5_6", level}`; student id comes from the credential |

Every body is strict (unknown fields are 400), every string goes through `rejectIfPII` (422, never echoed; an exact
opaque student id is checked against the roster instead, because the screen's long-digit rule would refuse about 3% of
real ids), student ids must be on the class roster, and error ids must be in the unit's catalog, so free text and names
cannot reach a row.

## Data (migration `0023_formative.sql`)

`formative_score` (class_code, ticket_id, unit_id, student_id, rubric_level, scored_by, created_at, updated_at;
primary key class/ticket/student/scorer, so a re-score upserts) and `formative_error` (class_code, unit_id, error_type,
week_start, count, updated_at). No free text, no names. Both are in `DELETE_PLAN`: a class delete removes both; a
student delete removes that student's scores and leaves the aggregate tallies (they name nobody). Annotations:
`shared/privacy/inventory-annotations/d1-formative.js`.

## Tests

`npm run test:formative`: `tools/formative-logic.test.mjs` (every seed unit's ticket and catalog, distribution math,
dominant pick and tie-break, top 3, trend, CSV), `tools/formative-api.test.mjs` (real migrations, auth, strict shapes,
no-PII, upsert/clear, self-score, tallies, caps, rate limits, privacy delete), `tools/formative-ui.test.mjs` (jsdom).

## Not covered here

- Student activities do not yet post distractor or frame-completion errors themselves; today the teacher tallies them.
  The catalog ids (`distractor:`, `frame:`) are the contract such a poster would use.
- There is no student-facing self-score screen: those surfaces live in `access-practice-lab/`, which this work does not
  edit. The endpoint and the teacher-side display are ready.
- The Studio nav has no link to `#/formative` yet; the route works by address.
