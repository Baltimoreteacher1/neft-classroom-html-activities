# ACCESS Practice Lab transformation ledger

Updated 2026-10-27 after production release `92e7733d36` (Cloudflare stamp `92e7733d3`) on `main`. This ledger tracks the full publisher-grade specification; related screens alone do not meet acceptance. The active product is static/local-first, so server accounts, district tenancy, remote storage, cloud transcription and external AI remain unavailable and disabled.

## Product and release baseline

- Repository: `neft-classroom-html-activities`, static HTML/ES modules, Vite, Cloudflare Pages (`dist`); production route is `/access-practice-lab/` and deep links are served by the Pages Function.
- Existing student route, legacy progress keys, ACCESS1 transfer codes, local-only teacher imports, print flows and offline shell are compatibility contracts. No migration or API change was made in this workstream.
- Production browser verification after this release confirmed the Reading Adventures shelf and chapter reader at `https://eduwonderlab.com/access-practice-lab/reading-room/adventures`; the complete release smoke checked 41 routes/assets, and the adventure journey passed response, checkpoint feedback, chapter resume, axe and 390px reflow checks.
- Release commit: `92e7733d36` (`feat(reading): ship reading adventures and accessible navigation`), assembled and pushed by the guarded `ship` workflow. Do not push a working branch directly.
- Existing ACCESS Practice Lab, Reading Room, WIDA metadata, speaking evidence, adaptive missions, spaced review, listening strategy, teacher insights and language worlds remain in place; the release added serialized adventures and corrected homework path-control semantics discovered by the release accessibility gate.

## Requirement-to-implementation acceptance matrix

**Status meanings:** PASS = the specified acceptance is implemented and verified; PARTIAL = meaningful related functionality exists but the complete specification/acceptance is not met; BLOCKED = an identified dependency prevents safe enablement; NOT STARTED = no qualifying implementation found. No row below is promoted to PASS from this one narrow change.

| Feature | Existing implementation | Gap / target acceptance still required | Dependencies | Verification evidence | Status |
|---|---|---|---|---|---|
| Intelligent Speaking Coach | Local recorder, playback, rerecording, transcript typed/confirmed by learner, on-device feedback, rehearsal and take comparison | Reliable provider transcription and teacher review workflow are not configured; broader evidence/revision portfolio acceptance remains | Approved speech provider, consent, identity/retention review for automation | Local studio browser suite covers recording, feedback, independence and no score claims; provider disabled | PARTIAL |
| Writing Coach / Revision Studio | Drafts, autosave, local feedback, revisions, version comparison, portfolio | Broader task variation, teacher portfolio review, and independent transfer sequences need coverage | Local content and evidence ledger | E2E verifies original attempt, actionable feedback, revision, comparison and portfolio | PARTIAL |
| Reading Workshop 2.0 | Reading Room, original passages, source evidence, annotations and inference/synthesis practice | Full publisher progression, paired text/visual variety, transfer sequence and all-grade coverage | Original reviewed content | Reading evidence tests and browser suite; full coverage not established | PARTIAL |
| Authentic Listening Studio | Original audio/text, playback controls, strategy and transcript support, multi-source mission listening | More authored multi-speaker lessons and complete listening synthesis progression | Original audio/media production | Listening strategy unit tests and browser suite; content coverage remains partial | PARTIAL |
| Adaptive Learning Paths | Skill evidence graph, check-in, recommendations, recency review, support stage and student override | Multiple independent mastery rules, teacher override and transparent cross-domain path need complete acceptance | Local evidence exists; authenticated teacher relationship absent | Language-engine, skill graph and spaced-review suites pass | PARTIAL |
| Integrated Language Growth Engine | Ledger, analysis, targeted feedback, revision and transfer patterns across studios/missions | Unified attempt→instruction→revision→independent transfer provenance is not consistently required across all domains | Content schemas and evidence ledger | Engine and studio E2E verify selected cycles only | PARTIAL |
| Teacher Dashboard / Intervention | Local imported class evidence, diagnostics, groups, editable template lesson drafts, review and export | No authenticated class relationship, remote assignment/due dates, or secure multi-user role boundary | School identity/tenant authorization; district privacy review | Teacher-insights unit tests and browser evidence import suite | PARTIAL / server features BLOCKED |
| WIDA-aligned curriculum | WIDA ELD Standards Framework 2020 metadata and reviewed expectation mappings | Crosswalk quality and grade-cluster coverage still need complete content audit; not official scoring | Current official WIDA reference review | Existing alignment validator and blueprint checks | PARTIAL |
| Cross-domain missions | Six original missions connect listening, reading, decisions, speaking and writing | More mission variety/grade clusters and all mission-specific transfer paths remain | Original content | Mission studio E2E and content validator | PARTIAL |
| Conversation Simulator | Conversation Quest and scripted interactive conversations | Full response quality feedback, safe adaptive dialogue and transfer breadth not complete; adaptive AI stays off | Original scripts; AI would require approval | World route/count browser checks | PARTIAL |
| Academic Vocabulary Network | Vocabulary Builder, morphology, context and spaced retrieval | Productive speaking/writing use, accurate home-language coverage and full domain transfer remain | Reviewed lexical content/translations | Existing lab tests plus vocabulary routes in browser | PARTIAL |
| Visual Literacy Studio | Visual stimuli embedded in authored activities, missions and accessible tables | Dedicated infer/compare/synthesize progression and broad visual inventory | Original visuals and text alternatives | Existing source/content checks; no complete visual literacy matrix | PARTIAL |
| Language Detective | 25 deterministic language detectors, explanations, revisions and transfer prompts | Broader misconception catalog/coverage and cross-domain application | Detector/content review | Studio content validator and detective browser journey | PARTIAL |
| Sentence Construction Studio | Sentence construction activities and Language Detective sentence work | Full planned sequence (expansion, combining, paragraph transfer) across support fade | Original tasks and scaffolds | Existing activity bank validator; no complete sequence acceptance | PARTIAL |
| Misconception-Based Practice | Named feedback traps, patterns, targeted recommendation links | Every need must have validated intervention plus a new independent transfer item | Reviewed pattern catalog | Studio validator checks patterns/detectors; coverage not complete | PARTIAL |
| Student Conference Mode | Teacher-local imported work, conference needs and template lesson review | Authenticated feedback-to-student delivery and verified next-attempt review unavailable | Secure teacher/student identity and sync | Teacher insights and evidence E2E covers local review only | PARTIAL / delivery BLOCKED |
| Personalized Daily Five | Local daily practice journey and customizable plan | Five-part composition needs retrieval, comprehension, production, focused improvement and transfer/reflection evidence for each adaptive path | Balanced activity metadata | Home route E2E; five-part rubric coverage not established | PARTIAL |
| Language Learning Games | Existing original game-like practice and Language Worlds mechanics | Publisher-grade game coverage, all answers/feedback and role/accessibility QA across modes | Original content and tested interactions | Selected route/content checks only | PARTIAL |
| Family Practice Studio | Guest family hub, bilingual direction in supported areas and print resources | Plain-language evidence reports and family growth story across student portfolio remain | Student-controlled privacy-safe export | Family content validators; no report/portfolio acceptance | PARTIAL |
| Teacher Content Authoring | Teacher Launch Studio creates links/settings | No authenticated author/edit/preview/validate/publish/archive content studio | Teacher identity, ownership model and review workflow | Browser confirms launch-link generation only | NOT STARTED |
| Family/Teacher Progress Reporting | Local summaries, evidence import/export and print | Family-specific, privacy-minimized report with examples and next steps not implemented end to end | Local export; no server necessary for a first opt-in artifact | Existing teacher export checks only | PARTIAL |
| Content Quality-Control Engine | Bank/studio schema, answer, cue, evidence, claim and coverage validators | Central author review workflow and automated accessibility/media/language/sequence diagnostics are incomplete | Content metadata schema and validator integrations | `validate:access-lab` passes current gates | PARTIAL |
| Premium User Experience | Unified visual system, responsive pages, shell navigation and accessible states | Full role-based visual QA and every changed view at target sizes not complete | Existing design system | Browser journey sampled at 375px; see QA notes | PARTIAL |
| Persistence and privacy | Local storage, autosave, version history, audio retention controls, alias-only transfer, offline use | No general durable account sync, central delete/export or authenticated relationships | Infrastructure/privacy approval for server features | Existing recovery, share, audio and local storage tests | PARTIAL |
| Original content coverage | Original 3–8 quick activities, studio tasks, missions, words and visuals | Coverage report does not yet prove minimum tasks by cluster/function/domain/support level/transfer | Machine-readable schema and curriculum review | Current bank: 501 activities; studio: 18 speaking, 14 writing, 6 missions, 25 patterns | PARTIAL |
| Automated/browser QA | Content/engine unit suites, student/teacher E2E and responsive checks; adventure-specific axe and 390px reflow checks added | Complete phone/tablet/Chromebook/security/reliability matrix remains | Clean-worktree pre-push gate | Release pre-push gate passed 148/148; the full QA matrix remains broader than this release | PARTIAL |
| Production deployment verification | Guarded release `92e7733d36` is live at the public ACCESS Practice Lab route | Overall transformation remains incomplete; future releases still require this verification | Existing guarded ship pipeline | Pre-push QA 148/148; production smoke 41/41; live adventure browser journey passed | PASS (this release; overall transformation remains partial) |

## This turn: mission-to-studio scaffold handoff

| Feature | Existing implementation | Gap | Target behavior | Dependencies | Acceptance tests | Status |
|---|---|---|---|---|---|---|
| Evidence-based mission support | `missionSupport()` made a recommendation and the mission page displayed it; the speaking/writing links discarded it | Destination studio independently selected a different support level | Carry only the allowed stage (no evidence counts or student work) through the mission URL; validate it; show the reason; preselect it while leaving the student free to change it | Existing local ledger, route parameter and stage picker | Browser test seeds synthetic evidence where mission and studio heuristics differ; verifies actual radio state and learner override for both modalities | PASS (local E2E) |

Implementation locations: `access-practice-lab/src/views/missions.js`, `src/views/speak.js`, `src/views/write.js`; regression coverage in `tools/access-studio-e2e.mjs`. This does not provide teacher approval, does not activate provider-backed features, and does not assert that the full adaptive-scaffolding workstream is complete.

## This release: serialized Reading Adventures and accessible homework path controls

The Reading Room now includes four original six-chapter adventures (two each for grades 3–5 and 6–8), with chapter navigation, predictions, evidence responses, keyed checkpoints, feedback, recaps, device-local resume, and deduplicated evidence in the existing Language Growth Engine ledger. Open student writing remains local and is not sent to the ledger. The release also removes invalid nested tab semantics from homework navigation while preserving navigation and active-step state.

Implementation locations: `access-practice-lab/src/views/reading-room.js`, `src/reading-state.js`, original adventure JSON and coverage report, `scripts/homework-guided-notes.mjs`, generated homework pages and hashed shared asset. The serialized story validator, Reading Room browser journey and homework browser accessibility journey are in `tools/`.

## Current local increment: Reading Strategy Academy

Added 26 original strategy lessons across four strands and both supported grade clusters, with think-aloud models, guided response/explanation/retry, independent new-passage transfer, local resume, strategy evidence in the shared skill graph, and local teacher evidence. The addition extends the existing Reading Room state key and language ledger; no accounts or remote data services are introduced. `npm run validate:access-lab` and the focused Reading Room browser journey pass. Independent content review, full project build/ship, and live verification are still pending. Overall transformation and the remaining reading/mathematics feature requirements remain incomplete.

## Verification and release evidence

- `npm run check` — PASS, with 27 existing lint warnings and no check errors.
- `npm run build` — PASS; the build emitted existing non-fatal large-chunk and Vite config-loader warnings.
- Commit hook — PASS 137/137. Guarded pre-push QA — PASS 148/148; includes build, full test set, ACCESS Lab validation, homework accessibility and other browser lanes.
- Production ship smoke — PASS 41/41; Cloudflare serves `92e7733d3`.
- Live browser journey — PASS: four adventure cards, original response, checkpoint feedback, chapter progression, response restoration after reload, axe 0 violations, no runtime errors and 390px reflow.
- Content coverage — PASS for the first-release target of four complete stories, 24 chapters, 2,079 original words and 24 checkpoints. Independent editorial review remains pending.
- Coverage remains partial for the master specification; see the feature matrix and `docs/reading-literacy-expansion.md`. Automated checks do not replace editorial review.

## Next work

Continue the remaining PARTIAL and NOT STARTED workstreams in the matrices, keeping the app local-first and preserving current routes and progress contracts. Keep cloud AI/transcription, class sync and sensitive teacher-record workflows disabled until their documented prerequisites are satisfied. The full specifications are not complete even though this release is deployed and verified.
