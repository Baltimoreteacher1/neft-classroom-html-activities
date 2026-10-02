# ACCESS Practice Lab: guided practice and reliable sessions

## Scope and acceptance criteria

Preserve existing activity URLs, grade bands, content banks, local progress keys, and Save/Resume integration. Add meaningful student and assignment workflows without accounts, uploads, analytics, or new runtime dependencies.

- A home practice planner offers skill, support and 2/4/6 activity choices. Saved drafts come first, followed by retry opportunities, new work and review. Recommendations explain their basis and do not infer proficiency.
- A searchable activity library filters topics/skills, domain, support and local progress. Learners/teachers can compose up to 12 ordered activities, reload the selection, and copy a direct assignment URL. URLs carry only content IDs and grade band, never student responses.
- Test timers pause on exit and resume deliberately. Reset/import cannot resurrect cached test answers. Speaking evidence requires recording or explicit oral practice; planning notes do not count as spoken responses.
- Media stops on navigation, question changes and page departure. Cancelled microphone requests release late streams; previous speech events cannot affect newer narration. Empty recordings do not count as evidence.
- Keyboard focus survives searching and answer feedback. Layouts remain usable on phones, Chromebooks and enlarged text.

## Specialist review

Three parallel specialists reviewed learning design, interface/accessibility and runtime reliability. Their recommendations informed the implementation and subsequent review, including support-based language, honest writing feedback, unfinished-work recovery, and media lifecycle regressions.

Primary pedagogical references consulted:

- WIDA, Preparing Students: https://wida.wisc.edu/assess/access/preparing-students
- WIDA, Scores and Reports: https://wida.wisc.edu/assess/access/scores-reports
- WIDA, Speaking Scoring Rubric: https://wida.wisc.edu/sites/default/files/resource/ACCESS-Speaking-Scoring-Rubric-Grades-1-12.pdf

The lab is original classroom language practice, not an official WIDA test, score, placement, or replica of the assessment interface. Starting/Growing/Expanding remain flexible support choices; A/B/C route keys remain compatible.

## Verification

Run targeted model/lifecycle tests:

```sh
node --test tools/access-lab*.test.mjs
npm run validate:access-lab
npm run e2e:access-lab
```

The browser journey uses isolated synthetic progress and covers guided sessions, draft recovery, search/filters, ordered assignments, URL restoration, keyboard feedback focus, legacy links, all activity types, pause/resume, practice reports, and mobile overflow. No real student records are used.

Targeted results: 41 unit/regression tests passed; the extended browser journey passed; 28 responsive/accessibility/workflow checks passed, including home/library at 375px and 1366px with 100% and 200% text. Eight axe scans reported no serious or critical violations. Production build and typecheck passed. Full repository validation is also run before shipping.

For additional browser accessibility checks against a local preview:

```sh
BASE=http://127.0.0.1:4189 node tools/access-lab-accessibility.mjs
```

Repository checks: `npm run validate`, `npm run build`, and the guarded pre-push QA loop. Results and any baseline limitations are recorded in the delivery note.

## Release

Deploy only reviewed commits through `ALLOW_DEPLOY=1 npm run ship -- <sha>`. This repository integrates onto main by cherry-picking the reviewed commit, then verifies the production build stamp and live smoke checks. No direct Wrangler deployment or guard bypass.
