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
