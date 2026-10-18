# EduWonderLab HTML transformation inventory

Updated 2026-10-17. This records the implementation and verification boundary for the current release. It is a continuation guide, not a claim that every activity has been redesigned.

## Baseline and compatibility

The original checkout was a detached worktree more than 1,000 commits behind production. Work was moved to `feat/eduwonderlab-integrated-mission`, based on freshly fetched `origin/main` at `cf685f4843`. The old worktree remains untouched. Production still uses the established `npm run ship` cherry-pick workflow. Existing URLs, content IDs, local progress formats, SCORM paths, and teacher routes were retained.

The repository already contains a curriculum hub, 84 numbered core lessons, 46 authored learning labs, worksheet and homework generators, a student launcher, EWL progress store, Save/Resume, Math Workbench, Class Boss, Almost-Right Lab, Forge, Fluency, and teacher tools. This batch extends those systems.

## Existing HTML coverage

Counts are path inventory, not claims of page-by-page review. The `lessons/` tree contains 701 `index.html`, 166 `homework.html`, 370 `worksheet.html`, and 204 `practice.html` files; 84 numbered core lessons each have a homework page. There are 48 learning-lab `index.html` paths, of which 46 are authored labs with `content.json`. The `games/3d/` and `math/games/` trees together have 30 `index.html` paths. The repository has 5,339 HTML paths overall, including teacher, generated, and answer-key pages.

| Existing experience | Change in this release | Scope and evidence |
| --- | --- | --- |
| Student launcher | Existing lesson selection now shows today's mission, actual stage status, next action, and a link to the last saved lesson position. Guided activity and independent check labels are distinct. | Shared launcher; unit and browser checks. |
| Learning labs | Student explanation is saved as a draft, then compared with a model response. The comparison step asks for mathematical evidence and avoids claiming a written answer was automatically graded. | Shared activities and progress code used by 46 labs; two lab browser flows plus lab data/property tests. |
| Percent learning lab | A second hundred grid allows constructing 101–200%, with synchronized fraction, decimal, percent, and amount readouts. Zero remains valid for a part but is excluded when recovering a whole from a known part. | Shared percent model, controls, and touch mapping; numeric, pointer, and browser checks, including 150%. |
| Existing online worksheets | Larger reading text and writing space, with mobile reflow, through the existing print-support loader. Print layout remains governed by existing print CSS. | Shared loader present on 370 worksheet pages; 4-1 representative browser/visual check at three widths. |
| Homework | Corrected the power-up star badge contrast through the shared lesson-model module. | Shared module present on 84 core homework pages; 4-1 automated browser check. |
| Almost-Right landing page | Teacher guidance now uses a keyboard-operable disclosure so students reach the activity choices sooner on mobile. | Keyboard Enter opens and closes the existing guidance in the browser check. |
| Lessons, small-group practice, Fluency, Class Boss | Existing functionality and routing checked in the browser. No major gameplay or instructional redesign in this batch. | Representative routes at 1365, 1024, and 390 CSS pixels. |

## Verification boundary

`npm run validate:html-experiences-browser` covers the launcher, core lesson, worksheet, homework, small-group practice, learning lab, Almost-Right Lab, Fluency index, and Class Boss at desktop, Chromebook, and mobile widths. All 27 sampled combinations passed against the production build. The check runs in the QA gate and checks route status, runtime errors, horizontal overflow, and sampled axe WCAG A/AA rules with reduced motion. It does not establish full WCAG 2.2 AA conformance. The lab-specific browser sweep checks two authored labs, explanation review, direct manipulation, and responsive screenshots. Save/Resume compatibility was preserved and launcher resume behavior has a unit test, including a damaged storage record beside valid work; cross-activity persistence and SCORM require additional end-to-end verification.

## Work remaining

- **Partially implemented:** A coherent mission route exists in the student launcher; broader assignment sequencing, retention scheduling, and teacher assignment builder integration remain to be built on the existing systems.
- **Not implemented in this release:** Mathematical Thinking Graph, cross-topic Representation Bridge, simulation architecture, cooperative gameplay, argument arena, invention studio, and broad project upgrades.
- **Games:** Class Boss and other games were sampled for route and accessibility behavior. Their core mechanics were not redesigned in this release. The next game batch should begin with a question-specific model or consequential decision inside an existing game, with math invariants and replay testing.
- **HTML depth:** The worksheet styling is broad, but lesson-specific mathematics, explanations, answer keys, and interactivity across all HTML paths have not been individually validated. Continue by auditing weak pages by unit and upgrading their existing activity code, then add representative browser assertions per template and selected individual pages.
- **Manual verification:** Screen reader, keyboard-only, Chromebook hardware, print device, and mobile touch checks still need human review beyond the sampled automated browser checks.

Release status and live smoke evidence should be appended only after the guarded deployment completes.

## Release 1 — live

- Feature commit: `05f9f26a8f`; production commit assembled by `ship`: `59725c25c7`.
- The shipping gate passed 134/134 checks, and the live build stamp matched the production commit.
- The repository's production smoke test passed 40/40 checks, including public curriculum routes and teacher authentication boundaries.
- The pre-commit test run exposed a polling race in the read-aloud test. The mock now observes highlights immediately after speech boundaries, retaining the original word-by-word assertions.

## Desktop source alignment — second implementation batch

The current `Reveal Math by Unit and Lesson` desktop folder contains 54 lesson folders. Its newer Word/PDF masters differed from 1,090 packaged copies. The importer now supports refreshing established resources in place, checking freshness, and adding newly authored unit resources while preserving existing URLs, IDs, categories, and teacher access. It preflights conflicting duplicate masters and retains downloadable copies when a master is missing. Two moved Unit 3 masters were subsequently found under their new paths; their existing URLs were retained.

- Refreshed 1,090 document copies and added 592 document resources. The resulting manifest has 2,331 downloads and 2,333 source references, including two historical aliases for moved masters.
- Added 216 current guided-step practice documents and 108 teaching-support guides to the existing lesson resource groups. All 54 source lesson numbers remain intact. Reveal 2.6 still maps explicitly to site 2-3 as supplemental median material; it is excluded from site 2-6's long-division lab.
- `--check-existing` verifies all 2,331 current downloadable files against the desktop masters with zero stale files and zero missing masters. A repeat import is byte-stable. Existing download tests verify every file's hash, filename, lesson placement, and teacher access. A text scan found no teacher-key markers in 760 student-facing Word masters; this is a sampled-content safeguard, not a complete answer-disclosure audit.
- Snapshotted the exact current conceptual task bank in build-only tooling. Its Session 1 fresh checks are integrated into the existing labs for 53 matching lessons, adding 159 items across the three existing support choices. Session 2 tasks are not silently moved into Session 1.
- Fresh checks preserve the first response and distinguish recorded task support from later model comparison and revision. Download/print reports now include that evidence. These records need human review and do not establish mastery automatically.
- Removed the 40-word completion requirement from the existing Create activities. Students review quantities, representations, and reasoning with the established self-checklist; concise mathematical evidence is accepted and labeled for human review.

Verification includes direct source-byte checks, repeated-import stability, route/access tests for all downloads, source-fidelity checks for the 53 lesson mappings, a rendered percent practice PDF, and browser flows for first response, model/hint use, comparison autosave, refresh, revision, and work export. Production release status for this batch must be recorded after shipping.

Desktop PowerPoint slide content and all generated online lesson examples have not been individually reconciled in this batch. The direct source downloads and new lab checks match the current authored material; this does not claim that every online task is identical to the desktop packet.

## Release 2 — live desktop alignment and source checks

- Feature commit: `2694a3f3ed`; production commit assembled by `ship`: `a62d131eee`.
- Pre-commit: 129/129 checks passed, including all 436 test scripts. The required full gate caught an outdated generated download index after the lesson-link ordering repair; regenerating and staging that index resolved it. No tests or deployment guards were bypassed.
- Shipping gate: 134/134 checks passed, including the production build, generated-file freshness, mathematics/curriculum validators, SCORM checks, and the applicable browser checks. Production served the expected commit after 115 seconds; post-deployment smoke passed 40/40.
- Every one of the 2,331 files in the production build matched its current manifest byte length and SHA-256. A fresh read-only comparison with the Desktop masters found zero changed or missing sources. Ten live public download samples spanning Units 2–9, a current practice PDF, and a guided-step document matched their source hashes. These ten samples are not a hash audit of every deployed file.
- The live browser sweep passed all 27 route/viewport combinations (1365, 1024, and 390 CSS pixels). It found no sampled axe violations, runtime errors, or horizontal overflow. The targeted live lab workflow verified an immutable first response, comparison autosave after refresh, revision without replacing first evidence, work export, and recorded model/hint use on a separate fresh check. Its 1024- and 390-pixel renders were visually inspected.
- A current teaching-support guide returned HTTP 401 without teacher authentication. The build-only original concept bank returned HTTP 404. Student testing used an isolated browser context and synthetic responses; no production student records were read or changed.

### Continuation

The work remains on `feat/eduwonderlab-integrated-mission` in `/Users/joelneft/wt-eduwonderlab-mission`; the stale original checkout remains untouched. Use `ALLOW_DEPLOY=1 npm run ship -- <new-feature-sha>` for subsequent releases. Production already contains the equivalent cherry-picked Release 1 and Release 2 commits; do not replay their feature SHAs.

Next substantive batch: improve existing game mechanics and resume behavior, beginning with an existing mathematical model game, then extend verified patterns to appropriate games. Percent Power's bar builder is an identified opportunity: preserve its actual shading mechanic, strengthen constructed numerical reasoning, remove automatic answer completion after repeated mistakes, and verify state restoration through the existing Save/Resume system. No such gameplay changes have been made yet. Continue the broader activity-specific HTML work and the remaining architecture/teacher/project work listed above. Desktop slide-by-slide and online-example reconciliation remains incomplete.

## Release 3 — live classroom-source reconciliation and worksheet work tools

- Feature commit: `ffeb0748fe`; production commit assembled by `ship`: `ee8ebc65d8`.
- Pre-commit gate: 130/130. Pre-push gate passed. Post-deploy smoke: 40/40. The live build stamp matched `ee8ebc65d`.
- Imported all 108 session worked examples from the current practice forms, with lesson and session boundaries retained. Two source changes carried online: the commuting task specifies a four-week model, and the bridge task specifies `1 lb ≈ 0.454 kg`.
- Added about 60 teacher slide decks under `lessons/*/downloads/reveal/teacher/` and a classroom-alignment reconciliation (`npm run validate:classroom-alignment`). A live request for `2.1.pptx` returned 401 without authentication; the other teacher decks were not individually probed.
- Worksheet work tools (`assets/worksheet-work.js`): typed reasoning, keyboard answer selection, optional hints, and prediction before revealing worked steps, on the existing Save/Resume system with the paper print layout kept. Covered by unit tests and the sampled browser sweep. The live typed-reasoning, hint and predict flows were not exercised by hand.
- The slide-by-slide comparison is not complete. The new check confirms the reconciliation data is current; it does not establish that every slide matches its online lesson.

### Game construction batch — Release 4

Branch `feat/game-construction`, commit `e89ec24c76`. Percent Power and the unit games now have the student construct the amount (`math/games/u4-percent-power/construction.js`) and keep the model editable after every miss; the 3D boss battle resumes battle progress and drafts. Fixes found by `validate:game-transformation-browser`:

- The check raced the delayed `gfx-mission-brief`; it now dismisses the briefing and waits for the auto-resume toast.
- Save/Resume's late restore closed a construction dialog the student had reopened; `flagship-adventures.js` now reopens it after the queued close event.
- At 390px the fixed on-screen pad in `unit7-equation-escape.html` covered the "Enter" button; the page now reserves bottom space.

The check passes at 1365, 1024 and 390px (60 runs) and the commit gate passed 130/130. Gameplay feel, replay balance and the mathematical difficulty of each constructed task were not reviewed by a person. Release status below is recorded after shipping.

### Still remaining

Game redesign, slide-by-slide deck reconciliation, per-page checks of lesson mathematics, answer keys and interactivity across the HTML pages, the unbuilt systems listed under Work remaining above, and manual screen reader, keyboard-only, Chromebook, print and touch review.

## Release 4 — live game construction batch

- Feature commits: `e89ec24c76` (games) and `6602e51761` (docs), with `968ea7946d` (Release 3 record); production commit assembled by `ship`: `7908d775eb`. Do not replay these feature SHAs.
- Pre-commit gate 130/130, pre-push gate passed, post-deploy smoke 40/40, live build stamp matched after 125 seconds.
- Live probes: the Percent Power page and `construction.js`, the boss battle page and the Equation Escape page (including the touch-pad clearance CSS) are served. All 55 teacher decks added in Release 3 return 401 without authentication.
- Not exercised live: the constructed-answer flows and Save/Resume restore on production; only the pre-deploy browser check covered them. Gameplay feel and difficulty have had no human review.
- The superseded local branch `wip/game-transformation` (committed with `--no-verify`) still exists and can be deleted; its content lives in `feat/game-construction`.

## Deck-to-online reconciliation (2026-10-18) — findings

Read-only number-level comparison of all 55 classroom decks (2,591 slides) against each lesson's own online content: 1,524 of 1,559 numeric task paragraphs matched; 35 flagged. Most flags are extraction artifacts or skills-check warm-ups. Nine lessons have deck launch/explore tasks with no online counterpart: 2-4, 2-10, 3-2, 5-2, 5-7, 6-5, 7-3, 8-1, 8-2. (9-3 s31 was first listed but is a Session 2 skills-check warm-up question, not a launch task.) The full table, figure dependence, method and limits are in `~/reports/deck-online-reconciliation-2026-10-18.md`; the re-runnable script is `~/reports/deck-online-compare.mjs` (run from the repo root).

No online slot exists for these tasks: the lesson model has one `revealWordProblem` (the Apply task), the site's own launch narrative, and district practice-sheet examples (Session 1 data). The Session 1 source is not the deck launch tasks. No content was added. Slide text stays the source of truth; copy it verbatim from `tools/reveal-classroom-slide-text.json`.

Decision needed before building: where deck launch tasks live online (a new field on the lesson config rendered on the existing lesson page, or inside the existing concept-intro "We do"), and how figure-dependent tasks get their figure (the deck images are in the lesson's `reveal-assets/` where present). Then add the tasks lesson by lesson with a validator that fails when a deck task has no online counterpart, so this cannot drift again.
