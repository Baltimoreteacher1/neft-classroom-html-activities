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
