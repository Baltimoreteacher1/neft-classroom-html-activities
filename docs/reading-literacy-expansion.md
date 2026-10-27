# Reading and Literacy Expansion Ledger

Updated 2026-10-27 after production release `92e7733d36` (Cloudflare stamp `92e7733d3`). The feature statuses below describe this follow-up assignment. `PARTIAL` means related existing functionality or an incomplete first increment; it is not full feature acceptance. Content remains original and awaits independent editorial review. Progress and student work remain on-device.

## Acceptance matrix

| Feature | Existing implementation and current change | Remaining acceptance work | Evidence / status |
|---|---|---|---|
| 1. Serialized Reading Adventures | Added four original six-chapter stories across grades 3–5 and 6–8, chapter navigation, prompts, response saving, fixed-answer checks, recap journal, resume and ledger evidence. | Illustrations, stronger full-student journey coverage, transfer tasks and teacher review are not implemented. | Coverage validator and browser journey; **PARTIAL** |
| 2. Reading Strategy Academy | Reading Room already has Learn / Practice / Independent modes and explicit reading moves. | Build searchable academy with 24 discrete think-aloud, guided, revised and independent lessons. | Existing Reading Room tests; **PARTIAL** |
| 3. Decoding Intervention Lab | No dedicated decoding pathway found. | Screening with teacher override, 30 progressive lessons, print/audio modeling and exit evidence. | Not implemented; **NOT STARTED** |
| 4. Vocabulary Memory Engine | Existing Academic Vocabulary Network and spaced-review logic; Reading Room notebook saves context. | Validate 120 entries, productive-use evidence, per-word scheduling and scaffold fading end-to-end. | Existing vocabulary tests do not establish this spec; **PARTIAL** |
| 5. Interactive Learners Library | Existing searchable, filterable 119-item original Reading Room shelf with resume, bookmarks, annotation and word notebook. | 20+ texts/genre audit, related reads, assignment support and verified license metadata for any third-party item. | Live shelf observed; automated Reading Room suite; **PARTIAL** |
| 6. Reading Fluency Studio | General speaking recorder supports oral production. | Dedicated modeled oral reading, paired repeated reading, phrasing goals and qualified word evidence. | No dedicated studio; **PARTIAL** |
| 7. Baseline Reading Skills Check | Existing ACCESS diagnostic and reading tasks. | Separate decoding, word recognition, contextual vocabulary, literal, inference, evidence and summary profile with teacher override. | Existing diagnostic coverage is not equivalent; **PARTIAL** |
| 8. Think-Aloud Reading Mode | Existing Reading Room Learn mode provides model / guided / independent scaffolding. | Add interactive pauses and verified strategy demonstrations across a set of original passages. | Reading mode E2E; **PARTIAL** |
| 9. Reading Discussion Circles | Existing workshop, read-together and conference paths. | Produce 12 structured discussion guides, roles, evidence prompts and individual follow-up. | Existing route coverage; **PARTIAL** |
| 10. Automatic Scaffold Fading | Existing Reading Room modes and language growth recommendations. | Implement transparent evidence-based fading, learner request, teacher override and cognitive-demand invariance. | No dedicated rule set; **PARTIAL** |
| 11. Structured Reading Intervention Plans | Existing five-day Reading Workshop. | Configurable 10–20 minute sessions and at least 10 teacher-ready intervention sessions with follow-up evidence. | Workshop is not full acceptance; **PARTIAL** |
| 12. Personalized Teacher Word Lists | No end-to-end reading word-list authoring found. | Import/edit/publish/assign word collections and track productive use. | **NOT STARTED** |
| 13. Vocabulary Pre/Post Assessments | Existing vocabulary practice and diagnostic tools. | Parallel forms, receptive and productive evidence, word-level uncertainty reporting. | No qualifying pre/post workflow verified; **NOT STARTED** |
| 14. Comprehension Strategy Analytics | Local Reading Room teacher evidence table; adventure checkpoints now feed the Language Growth Engine ledger. | Add all 10 strategy categories, sample-size rules, supported/independent views, assignments and export. | Current analytics and shared ledger only; **PARTIAL** |
| 15. Chapter Recaps and Reading Journals | Adventure chapter predictions, evidence responses and recaps persist locally by story/chapter. Existing text lessons have saved reflections. | Add character/theme tracking, spoken journal path and teacher review. | Browser resume test; **PARTIAL** |

## Initial content coverage

Machine-readable counts are generated at `access-practice-lab/content/reading-room/adventure-coverage.json` by `npm run validate:reading-adventures`.

| Resource | Current count | Minimum in request | Status |
|---|---:|---:|---|
| Complete six-chapter adventures, grades 3–5 | 2 | 2 | Coverage met; independent review pending |
| Complete six-chapter adventures, grades 6–8 | 2 | 2 | Coverage met; independent review pending |
| Strategy Academy lessons | 0 discrete lessons | 24 | Gap |
| Decoding micro-lessons | 0 | 30 | Gap |
| Vocabulary entries in this increment | 24 chapter-context entries | 120 reviewed entries | Gap; existing network inventory needs audit |
| Library texts | 119 existing Reading Room packages | 20 | Numeric count met; editorial review pending; licensing metadata audit open |
| Fluency passages | 0 dedicated | 12 | Gap |
| Reading assessment tasks | 24 story checkpoints, plus existing lesson questions | 20 distinct task bank | Inventory and skill-distribution audit open |
| Intervention sessions | 0 dedicated | 10 | Gap |
| Discussion guides | 0 dedicated | 12 | Gap |

All 24 chapter comprehension checks have fixed keyed answers with explanations; all 24 chapters have a prediction prompt, open evidence response, recap prompt and chapter vocabulary. Open responses are saved and are not automatically evaluated. The only automatically checked item in this release is the keyed multiple-choice checkpoint. Correctness is local formative evidence, not an official reading score.

## Architecture and privacy decisions

- Stories are versioned JSON content loaded through the existing content loader and Reading Room route.
- Chapter, prediction, evidence, answer, recap and completion data live under the existing `accessPracticeLab:v1:readingRoom` state object in a new optional `adventures` property. Older saved objects are preserved by defaults during load.
- One checked checkpoint per story chapter writes a deduplicated first-attempt record to the existing language evidence ledger. Records include skill, correctness and provenance identifiers, never the open-response text.
- Playback uses the browser/device speech voice. It is labeled as such; no recording or third-party speech request is introduced.
- No remote accounts, class roster, speech transcription, external AI, or student data service is added.
- Stories are marked pending independent editorial review; automated content checks do not establish cultural responsiveness, grade appropriateness, factual accuracy or human approval.

## Verification record

- `npm run validate:reading-adventures` — PASS; 4 complete stories, 24 chapters, 2,079 original words and 24 comprehension checkpoints.
- `node tools/access-reading-room-e2e.mjs` — PASS; shelf/filter and reader regression, checkpoint feedback, resume, shared ledger/skill mapping, teacher checkpoint counts, axe and 390px reflow.
- `npm run check` — PASS; 27 existing lint warnings and no check errors.
- Commit hook — PASS 137/137. Guarded pre-push QA — PASS 148/148, including build, tests, ACCESS Lab validation and browser checks. One opt-in runtime test remains opt-in; the injector idempotency test is intentionally skipped when tracked files are modified.
- Production smoke — PASS 41/41. Cloudflare stamp `92e7733d3` confirmed on the live site.
- Live browser journey — PASS; four stories render, an original prediction and checkpoint can be submitted, feedback is shown, chapter progress survives reload, the saved response restores, axe reports zero violations, and 390px reflow has no horizontal overflow.

The deployment covers only the implemented first increment. The matrix remains PARTIAL/NOT STARTED for other feature groups; story illustrations and independent editorial review remain outstanding. This release does not claim the minimum coverage counts for the other 14 feature groups.
