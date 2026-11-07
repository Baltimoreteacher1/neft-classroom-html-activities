# Class platform (`/api/class`)

One server platform for both student sites: Fluency Lab (`/math/fluency-lab/`) and The Language Page
(`/access-practice-lab/`, served on thelanguagepage.com). Both apps work device-only without it; the class
platform is opt-in and every route degrades to 503 when the D1 binding `DB` is absent.

| Piece                                                             | File                                                                       |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Contract (limits, codes, alias rules, summary shapes, goal meter) | `shared/class-platform/contract.js` (also imported by the browser clients) |
| Router + class/student/progress routes                            | `functions/api/class/[[path]].js`                                          |
| Storage, hashing, auth, retention                                 | `functions/_lib/class-platform/store.js`                                   |
| Live rooms (session, game, workspace, quiz)                       | `functions/_lib/class-platform/rooms.js`                                   |
| Shared recordings + teacher voice notes                           | `functions/_lib/class-platform/audio.js`                                   |
| Selection-only AI helpers (writing feedback, hint tutor)          | `functions/_lib/class-platform/ai.js`, `functions/_lib/model-call.js`      |
| Browser client (join, sync loop, teacher calls, audio) for BOTH apps | `shared/class-platform/client.js`                                       |
| Live quiz answer key, generated from the lab item bank            | `shared/class-platform/quiz-key.json` (`node tools/access-lab-index.mjs`)  |
| Join QR (verified encoder)                                        | `shared/qr/qr-code.mjs`                                                    |
| Schema of record                                                  | `migrations/0011_class_platform.sql` (test-pinned to `SCHEMA`)             |
| Tests (real endpoint over node:sqlite)                            | `functions/api/class/class.test.mjs`                                       |

## Identity and auth

- **Teacher.** Creating a class needs `x-teacher-key` = `TEACHER_KEY` (AUTH_CONTRACT.md §3). Creation returns the
  class code and a class **teacher passcode**; that class's teacher routes accept either the site key or
  `x-class-teacher: <passcode>`, so a projector or phone can open one class without the site-wide key. The passcode
  is stored as a salted SHA-256 hash. It is not a Teacher Mode PIN and is never shipped in page source.
- **Student.** Joins with the class code (typed, or the `?class=CODE` join link a QR carries) and an **alias**. Aliases
  are nicknames: at most two words, no email, no runs of 4+ digits. The first join shows a **student key** once
  (8 characters); alias + key rejoins on another device. Wrong keys are counted durably (12 per class+alias per hour).
  A teacher can reset a key from the dashboard. Writes carry `x-class-student: <studentId>.<key>`.
- **Family.** `GET /me` gives the student a read-only family token (derived from the key hash); the digest link
  `?code=&student=&token=` opens that learner's week and nothing else. Resetting the student key revokes it.

## Progress sync

`POST /progress { code, doc, updatedAt, data, summary }`, last-write-wins by the client's `updatedAt` (ms). An older
upload gets `409 { stale: true, updatedAt }`, and the client pulls the newer copy and restores it through the app's
own backup cleaners. `data` is the app's existing backup object (Fluency Lab: `makeBackup` + `exportPlay`), capped at
256 KB. `summary` is a small validated object (`SUMMARY_FIELDS`) used by the teacher dashboard, the class goal meter
and the family digest; the progress document itself is never returned to anyone but its student.

## Retention

A class unused for 120 days is deleted whole (students, documents, rooms, audio); the sweep runs on every class
creation. Live rooms last 6 hours. Shared recordings and voice notes last 30 days. A teacher can delete a class at
any time (`POST /delete` with the code typed again) or remove one student.

## Live rooms

Poll-based on D1. No deadline, timer or answer time is stored or returned. Problems are generated on every device
from the room config (`skill`, `grade`, `seed`, `count`, or `itemIds` for the Language Page quiz). **The server judges
every answer**: it regenerates problem N from the same seed (`generateProblem(skill, seededRandom(seed + n*7919))`,
session and game rooms) or reads `quiz-key.json` (quiz rooms), and ignores any `correct` the client sends. A student's
score is at most one right answer per item (primary key room+student+item). Quiz rounds tell the learner right/wrong
as soon as the answer is recorded; session and game rooms only expose a learner's own correctness after the teacher's
reveal. Rooms with an unknown skill or a quiz item outside the key are refused at open. The response wall is anonymized (answer + count). Game
scores only add: one class score, plus a team tally.

## Voice notes

D1 BLOBs (R2 is not enabled on this account), 700 KB cap per clip, 20 shared recordings per student. A student
shares a practice recording; the teacher records a note that answers it.

## The Language Page

`access-practice-lab/src/class/` + `views/class*.js`: `/class` (join by code or `?class=CODE` QR link + alias, assignments
with Done marks, the teacher's voice notes), `/class/quiz` (live quiz), `/class/teacher` (teacher view). The same teacher
panel (`class/roster-panel.js`) is mounted in the Teacher Hub (`access-teacher/class-panel.js`), which
thelanguagepage.com now serves behind the same teacher gate (the score predictor and Flight Deck still redirect to
eduwonderlab.com; `/wida-access/` stays excluded). Lab progress syncs as the Save/Resume object (`{accessLab: 1, data}`)
and the class copy is MERGED through the lab's own importer (`importProgressData`), which keeps work already on the
device, so no prompt can lose anything. The student key is stored under `accessPracticeLabClass:v1:link`, outside the
`accessPracticeLab:v1:` namespace that Passport codes and the class copy carry.

## AI helpers (selection only)

`POST /api/class/ai/writing` classifies a learner's draft into the lab's authored next-move and error-pattern ids;
`POST /api/class/ai/hint` picks among authored Fluency hints after the step-leak filter. Claude Haiku when
`ANTHROPIC_API_KEY` is set, else Workers AI (`AI`), else 503 `{offline: true}` and the app shows its rule-based feedback or
authored hint. Model text is never returned or shown; ids are validated against the authored lists. The writing helper
receives only the learner's own words, never a prompt, passage or test item (no WIDA sample item can reach a model).

## Local testing

`node --test functions/api/class/class.test.mjs functions/api/class/ai.test.mjs tools/fluency-class.test.mjs tools/language-class.test.mjs tools/fluency-ai-hint.test.mjs`. To exercise with wrangler: `npx wrangler d1 execute
neft-student-progress --local --file migrations/0011_class_platform.sql`. Never apply with `--remote` without Joel.
