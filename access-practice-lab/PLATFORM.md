# ACCESS Practice Lab — language-learning platform notes

How the studios fit together, the rules they must keep, and how to add to them. Content schemas:
`CONTENT.md` (activity bank) and `STUDIO-CONTENT.md` (missions, speaking, writing, detective).

## The learner loop

Choose a mission or studio task → prepare (plan, rehearse, supports at the learner's chosen stage) →
produce real language (speak, write, decide, collect evidence) → specific feedback → revise or re-record →
show it independently → watch growth. Direct activity links and the quick-practice rooms are unchanged.

| Surface | Route | Source |
| --- | --- | --- |
| Academic missions | `/missions`, `/missions/<id>` | `content/missions/*.json`, `src/views/missions.js` |
| Speaking Studio | `/speak`, `/speak/<task>` | `content/studio/speaking.json`, `src/views/speak.js` |
| Writing Studio | `/write`, `/write/<task>`, `/write?tab=portfolio` | `content/studio/writing.json`, `src/views/write.js` |
| Language Error Detective | `/detective`, `/detective/<pattern>` | `content/detective/patterns.json`, `src/lang/errors.js` |
| Growth Map | `/growth` | `src/lang/ledger.js` profile |
| Teacher dashboard | `/access-teacher/` (top panel) | `access-teacher/evidence.js`, `src/lang/teacher.js` |

## The engine (`src/lang/`)

- `text.js`, `lexicon.js` — tokens with offsets, sentences, phrase/number finders, connector and vocabulary data.
- `errors.js` — 25 explainable pattern detectors tuned for precision (`confidence: "high" | "check"`).
  `checkRevision()` decides whether a revision fixed a pattern without breaking others or changing the message.
- `purpose.js`, `analyze.js` — Key Language Use moves and the response analysis: strengths, next moves, evidence
  use, cohesion, sentence shapes, word-level features. Every observation carries spans of the learner's own text.
- `audio.js` — speech-activity measures from the loudness envelope (time speaking, pauses, longest run), on device.
- `ledger.js` — the evidence ledger and learner profile: first attempts, independent vs supported, revisions,
  trends (≥ 3 points), support dependence, recurring patterns, comprehension by skill and distractor.
- `adapt.js` — recommendations from demonstrated performance (next task, stage, stretch questions).
- `rubrics.js`, `scaffolds.js`, `share.js`, `studio.js`, `teacher.js` — practice rubrics, word bridges, share codes,
  studio state, teacher analysis.

## Rules that must keep holding

1. **No invented proficiency.** There is no composite score, "% developed", or WIDA level anywhere. The Growth Map
   and dashboard show trends from first attempts, and say "not enough evidence" under three. Exemplars use the
   practice bands *early / building / strong*. `tools/lib/access-studio-rules.mjs` (`SCORE_CLAIM`) is enforced over
   all studio content.
2. **Scaffolds cannot contaminate independent results.** "On my own" renders no frames, bank, model or Spanish
   bridges; feedback appears only after a submission; the ledger stage becomes *supported* if any support was
   opened. A revision after feedback is a *revision*, never a first attempt.
3. **Privacy.** Everything runs on the device. No student text or audio is sent anywhere. Recordings live in memory
   unless the learner presses "Keep for my teacher" (IndexedDB, deletable in Passport). A share code carries an
   alias, never contact details, and never audio.
4. **Not official.** WIDA scores Speaking and Writing with trained raters and its current rubrics; Listening and
   Reading are machine-scored selected response. The lab's rubrics are modeled on the long-standing three criteria
   (Linguistic Complexity, Vocabulary Usage, Language Control) but are the lab's own descriptors.

## Quality gates

- `npm run validate:access-lab` — activity bank contract, studio content (`validate-access-studio.mjs`: schema,
  verbatim evidence, detective sentences run through the real detectors), assessment quality
  (`validate-access-quality.mjs`: blueprint coverage, answer-position balance, duplicate options, key cues,
  honest labelling), index freshness.
- `npm run e2e:access-studio` — the studios in a real browser: fake microphone, independence integrity, share code →
  dashboard, axe WCAG 2.2 AA, 375px overflow.
- `npm run audit:access-bank` — report on production vs selected-response share per room.
- Unit tests: `tools/access-language-engine.test.mjs`, `tools/access-teacher-evidence.test.mjs`.

## Adding content

1. Author JSON per `STUDIO-CONTENT.md`; run `node tools/validate-access-studio.mjs` until clean.
2. New detective patterns need a detector in `errors.js` *and* lesson/practice/transfer content; the validator checks
   both directions.
3. Run `node tools/access-lab-index.mjs` (regenerates `content/index.json`) and `node tools/sync-access-shell.mjs`
   (module versions) after editing source.
