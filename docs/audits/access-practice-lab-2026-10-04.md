# ACCESS Practice Lab audit and publication upgrade

Scope: the public lab, both grade bands, classroom practice tests, and student/teacher packets. Existing routes and storage keys are retained. No analytics, external response submission, new dependencies, or official-score claims were added.

## Audit changes

| Area | Implemented changes |
| --- | --- |
| Meaningful evidence (1–4) | Empty writing and speaking cannot earn completion. Speaking notes alone do not count as oral practice. Writing guidance follows the task's purpose; vocabulary is deduplicated. |
| Saving and testing context (5–7) | Clear local-save/ACCESS1 transfer guidance; recording downloads and temporary-audio explanation; classroom tools distinguished from official WIDA testing. |
| Getting started (8–14) | Prominent session start, activity-based duration totals, explained support choices, skill-room next actions, consolidated utilities, 24-item library pages, specific activity titles. |
| Learning process (15–21) | Progressive strategies and clues, supported/independent modes, annotated models, first-draft and revision reflection, typed evidence summaries, reviewed weekly skill alignment, task-specific speaking criteria. |
| Families and access (22–28) | Spanish family shell/save instructions, labeled audio controls and persistent errors, keyboard/reflow improvements, readiness warm-up, grade/mode-preserving links, shared-device guidance, sourced 2027 dates. |

## Publication design

- Source and response appear together in a two-column workbook layout on larger screens, with an ordered single column on smaller devices.
- Writing starters and detailed help open on request. Directions, figures, response fields, and review actions have distinct hierarchy.
- Each skill room links to its printable student preview and editable Word packet.
- All 26 student and 26 teacher packet variants use designed HTML and Word layouts with actual illustrations, charts, native data tables, numbered tasks, and response areas. Word packets include running headers and page numbers.
- Packet generation fails the build if a required file or visual cannot be produced. Teacher scripts, solutions, and model responses stay out of student packets.
- Content-hashed module URLs keep returning browsers on a consistent release. Home and deep-link shells share the same generated import map; saved work and storage keys are retained.

## Verification

The focused ACCESS suite passed 73 tests, including seven packet regressions and three module-cache regressions. Repository lint, validation, and build checks passed before release; the guarded shipping process reruns its full gate on the reviewed commit.

Regression tests cover blank responses, revision state, stale asynchronous routes, storage failures, evidence accounting, worksheet undo, recording lifecycles/formats, library pagination, planning, content criteria, and packet content/audience separation.

Browser checks use synthetic responses on a local origin. Sampled widths: 375, 768, and 1366 pixels. Checks include source/response layout, draft recovery, independent and supported attempts, library selection/pagination, Spanish family controls, keyboard focus, and axe accessibility scans. Representative Word and browser-print packets are rendered and visually inspected.

Automated accessibility scans and sampled layouts do not certify every assistive technology or physical audio device. Recording lifecycle failures are tested with mocks; real microphone recording and a full human screen-reader session are not part of this release verification. The shared site's native switch-learner confirmation remains in English.
