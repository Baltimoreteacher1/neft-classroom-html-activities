# ACCESS Practice Lab 2.0: inventory of what exists, and what the new engine adds

Read-only inventory of `access-practice-lab/` taken 2026-11-25 on branch `feat/p3-w3-acc-20261125`. Nothing under
`access-practice-lab/` was edited: its shell files are rewritten by a sync script and other sessions edit it. The
2.0 engine lives in `shared/access-lab2/` as plain browser-safe ESM so it can be wired into the Lab later.

Honesty rules that apply to everything below and to the new engine: practice material is original and inspired by the
four ACCESS domains and the WIDA proficiency framing. It does not reproduce or claim parity with official items. Every
results or practice-test output carries "Inspired by WIDA ACCESS, not official, not a score, not a placement tool."
Nothing is timed by default. Recordings stay on the device. Learners are identified by classroom alias only.

## 1. Practice items (the bank)

| What | Where | Shape |
| --- | --- | --- |
| Bank of 40 item sets, 320 items | `content/bank/b35-*.json`, `b68-*.json`, index `content/bank/index.json` | Per set: `{ id, title, grade ("3-5" or "6-8"), domain, minutes, bank{version, provenance, reviewStatus}, stimuli[], items[] }`. 160 items per grade cluster, 40 per domain. |
| Item types in the bank | same | `listening-response`, `multiple-choice`, `multiple-select`, `dropdown`, `ordering`, `matching`, `drag-drop` (objective, scored by key); `speaking-response`, `constructed-response` (rubric). |
| Item metadata (`meta`) | `src/acc/content/item-meta.js` | `band` (early, building, strong: practice bands, never WIDA levels), `cognitive`, `languageDemand`, `functions[]`, `features[]`, `scoring` (key or rubric), `wida{ids, explicit}`, `reviewStatus` (`automated-checks-only`, `human-review-requested`, `human-reviewed`; no item may claim human review today). |
| Item schema and scorer | `src/acc/engine/schema.js`, `scoring.js` | Nine question types, domains Listening/Reading/Speaking/Writing, KLUs Narrate/Inform/Explain/Argue, grades 3-5 and 6-8. |
| Starter mixed sets | `content/assess/starter-3-5.json`, `starter-6-8.json`, `sets.json` | One 9-item set per cluster, every response type. |
| Blueprints and coverage floors | `content/blueprints.json` | WIDA framework references (code and short name), standards ELD-SI/LA/MA/SC/SS, KLU definitions, three language dimensions, per-domain format notes, `minimumCoverage`, `itemQuality` rules (answer position balance, length cue, passage grade level). |
| Rubrics | `content/rubrics/speaking-practice.json`, `writing-practice.json` | Four ratings, original descriptors, explicitly "NOT a WIDA rubric". |
| Leveled reading ladder | `content/ladder/leveled.json`, `passages.json` | Easier/on-level/richer plus a Spanish parallel, labeled machine-assisted. |
| Grade-band content | `content/gK`, `g1`, `g2-3`, `g3-5`, `g6-8` | Activities, not test items. |
| Validators | `tools/validate-access-bank.mjs`, `tools/access-acc-bank*.mjs`, `tools/access-acc-*.test.mjs` | Bank, WIDA catalog, engine and storage checks. |

## 2. Practice tests

| What | Where |
| --- | --- |
| Full forms and mini tests | `content/tests/g35-form-a.json`, `g35-form-b.json`, `model-form-a/b/c.json`, `g35-{listening,reading,speaking,writing}-mini.json`, `wida-{listening,reading,speaking,writing}-*.json` (17 files). Each: `{ id, band, kind, domain, title, gradeCluster, tier, overview, sections[] }`. A full form has Listening 6, Reading 6, Speaking 3, Writing 2 items. Overview text already states "Classroom practice; not an ACCESS tier" and that scoring, timing and routing are not equivalent to ACCESS. |
| Test runner and review | `src/acc/engine/session.js`, `src/acc/review/`, `src/lab/` (listening, speaking flow and session, workbench) |
| Practice plan from local evidence | `src/practice-plan.js`: transparent per-activity status (new, draft, retry, done) and suggestions, "not a proficiency assessment" |
| Mastery and assignment | `src/acc/adapt/mastery.js` (conservative: independent first-try work on different items across different days; teacher-configurable thresholds), `assign.js` |

The existing tests are fixed forms built by hand. There is no seeded assembler, no reviewed-only filter for students, no
stimulus-repeat rule, and no per-domain coarse profile with "what to practice next".

## 3. Speaking recorder

`src/recorder.js` (159 lines): in-tab recording with a live level meter, optional `maxSeconds`, `countdown()` helper,
takes held as object URLs that are "never uploaded or written to storage". Phone audio-session rules live in
`src/audio-session.js`; `src/acc/audio/` has mic preflight, capture and the speaking state machine;
`src/speaking/` has the question bank (alias-seeded draws, "no score is derived") and task packs. Existing speaking
rubrics are teacher/student review, not auto-scored.

The 2.0 item model keeps this contract: a `record` response must declare `constraints.storage: "device"`, and no
recording timer (`maxSeconds`) is allowed on an item.

## 4. The 12-week Road to ACCESS

`content/road.json`, keys `"3-5"` and `"6-8"`: 12 weeks each with `{ n, start (fixed 2026-10-05 start), taskType
(Narrate, Inform, Explain, Argue, Practice review), theme, focus, level (A/B/C support label), activities[] (ids of
existing activities), family{en, es}, activityRationale }`. Offline version in `src/road-offline.js`. The calendar is
fixed, themes are the same for everyone, there is no profile input, no built-in retrieval, no mid-point or final test
weeks, no catch-up behavior, and no teacher pins.

## 5. What exists for other Wave 3 surfaces (not touched)

Family coach and homework (`content/family*.json`, `src/family/`), Language Page and Studios (`src/studios/`, `src/acc/`
shell, owned by other sessions), glossary (`content/glossary.json`), engagement and word goals.

## 6. What the 2.0 engine adds (`shared/access-lab2/`)

| Module | Adds |
| --- | --- |
| `item.js` | One item model and validator (task types per domain, response modes, key/rubric/self-check scoring, supports, v2 provenance and review vocabulary, human-only review, alt text, no manipulative wording, no parity claims, frames fade by band). |
| `scoring.js`, `profile.js` | One scorer for keyed and self-check items (self-check counts half), coarse per-domain practice bands from at least three answers, Key Language Use strengths, "what to practice next", and a student view with no band, level, program or score words. Reuse note: `shared/learner` does not exist on this branch, so a small local profile interface is used; swap it in when that module lands. |
| `builder.js` | Seeded domain-balanced practice tests (mini 10, standard 30, long 60), reviewed items only for students (a `viewer` argument; draft items are teacher-visible only), no repeated stimulus, balanced KLU coverage, early-to-strong ramp, optional untimed "stamina" mode that shows elapsed time to the student only, and `verifyPracticeTest` as an independent rule check. |
| `diagnostic.js` | About 15 minutes of adaptive-lite diagnostic: starts mid-band, steps on streaks of two, 4 to 6 items per domain, Speaking and Writing by self-check only; teacher one-page summary by alias, friendly student view, and a Road seed. |
| `road.js`, `road-strings.js`, `wording.js` | 12-week plan from the profile and a calendar (days of week, breaks), 10-20 minute sessions, built-in retrieval, mini test in week 6, final practice set in week 11 (one domain per day), readiness week 12, a refresh when a student drifts from the plan (kind wording, checked against EN and ES banned-phrase lists), teacher pins that survive regeneration, and printable family data in EN and ES with Spanish marked "draft translation". |
| `readiness.js` | Generic readiness checklist data in kid language (headset and microphone, volume, select/drag/order/record practice, keyboard writing, word-list tool, calming routine, test-day expectations). |
| `bank-health.js` | Items per domain, grade band, practice band and KLU; reviewed versus draft; gaps against the coverage matrix; FLOORS (default 3 reviewed per cell, 2 per KLU) below which nothing publishes; hook for item-analytics flags (`ambiguous` and `audio-issue` hold an item). |
| `disclaimer.js` | The mandatory statement, its Spanish draft, and a deep check that every generated output carries it. |
| `demo-items.js` | 36 clearly synthetic draft items (3 per domain per practice band, grade band 3-5). Not a bank. |

### Integration notes for the later wiring

- Existing bank items convert to the new model by mapping `type` to a task type and response mode, `klu` to `kluTags`,
  `meta.band` to `band`, `meta.reviewStatus` to `reviewState` (`human-reviewed` to `reviewed` only once a named human
  reviewer is recorded), and `stimulus` to `task.stimulus`. No conversion was written: it needs a reviewer decision on
  which of the 320 items become `reviewed`.
- The Road's existing activity ids can fill `itemQuery` slots in `road.js`; the engine emits activity descriptors
  (`domain`, `taskType`, `klu`, `itemQuery`) and does not read lab files.
- The seeded generator in `shared/access-lab2/rng.js` repeats the fixture library's algorithm because the fixture tree is
  developer-only and not published; a test pins the two streams together.
- Not wired: no route, view, store key or D1 table. No student data is stored by this engine.
