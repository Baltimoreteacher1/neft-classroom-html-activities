# Reading Room 2.0 release checklist

Branch: `feat/access-reading-room-2` (based on the live ACCESS release `834b42d5a9`).

## Audit baseline

- [x] Confirm existing routes, local storage contracts, reading bank, shared reader tools, service-worker flow, and validation commands.
- [x] Preserve the existing 114 reading activities and all `/Reading/...` routes.
- [x] Inventory the reading source: 81 passage-bearing activities; 37 have 100+ words. The bank already provides vocabulary, teacher prompts, multiple task mechanics, read-aloud, and an evidence notebook, but most source entries are single-question practice rather than full lessons.
- [ ] Audit all reading texts, answer keys, visual references, and accessibility details against the publishing criteria.

## Delivery checklist (26 October 2026)

- [x] Existing ACCESS Lab source activities inspected; Reading Room route and local-storage contract preserved.
- [x] Reading Room library, reader, search, filters, bookmarks, Continue Reading, recent texts, word notebook, and local clearing.
- [ ] 100 complete lesson target. Current: 112 authored packages (14 initial standalone lessons, 61 packages extending distinct multi-section source-bank passages, and 37 new original lessons). The count target is met; independent editorial review remains open.
- [x] Grade coverage includes grades 6–8 and 9–12. Current counts: grade 1 (4), grades 2–3 (4), grades 4–5 (2), grades 6–8 (24), grades 9–12 (2), and 15 legacy grade 3–5 local-band packages whose WIDA cluster is explicitly unspecified.
- [x] Reading sequence with Learn, Practice, and Independent modes; objective interactions, evidence marks, annotations, answer feedback, and locally saved progress.
- [x] Existing passage source tasks preserved and supported: choice, connector, multiple selection, hot text, cloze, short response, evidence, ordering, and sorting. New evidence, vocabulary, and summary transfer tasks are rubric-guided, not auto-scored.
- [x] Fourteen editable, persistent graphic organizers; print control.
- [x] Five-day workshop sequence, Model/Practice, Read Together, Independent, Small Group, and Conference pathways; local teacher evidence view with downloadable CSV; family path; evidence-based small-group suggestions.
- [x] Optional browser text-to-speech controls; semantic table/map rendering and text descriptions. No recorded audio service is configured; speech output depends on the browser/device voice.
- [x] Local-only progress persistence and accurate device-scope disclosures.
- [x] WIDA alignment candidates are traceable to local public framework metadata where supplied, and flagged for educator review; candidate tags are not independently certified.
- [ ] Independent editorial review. All packages remain `authored-pending-independent-editorial-review`. Automated validation is structural and cannot establish factual accuracy, bias review, grade suitability, question validity, or human editorial approval. No human review is claimed.
- [ ] Broader release readiness: full review of all 51 lessons, accessibility review beyond automated axe/sample routes, additional device/browser tests, and production deployment remain outstanding.

## Current release status

This branch is an expanded but incomplete implementation slice. It is **not production-ready or deployed**. All 112 packages pass deterministic schema, answer-key, evidence-reference, and cross-link checks. That validation does not replace independent editorial review. The lesson count target is met with 112 packages. All are still marked pending independent editorial review, so publication is blocked pending that review. Teacher evidence remains browser-local and is not synchronized to authenticated teacher/student records.

## Editorial review checklist

A qualified independent reviewer must assess each passage and its aligned activities for factual accuracy, age/grade suitability, reading interest, language-development value, cultural responsiveness, vocabulary, question validity, distractor rationale, answer keys, scaffolded variants, accessible visual descriptions, and teacher-guide consistency. Record reviewer, date, revision, findings, and corrections in lesson metadata before changing editorial status. Automated validation alone must never change that status.

## Reading Room visual direction

- **Color:** chalk `#F5F2E9`, deep-ocean `#17354A`, field-green `#17685B`, signal-amber `#D69A32`, mist-blue `#E4EDF2`, and slate ink `#24313A`.
- **Type:** existing system sans for controls and wayfinding; the existing Georgia/serif stack only for sustained passage reading. No external font request.
- **Library layout:** one short introductory band, a narrow filter rail, and a flexible book-spine list with a single featured reading and a Continue Reading strip; align text to the left.
- **Reader layout:** passage in the central reading column; small section guide and settings above; vocabulary and notes in a collapsible side workspace that moves below the passage on narrow screens.
- **Distinctive device:** reading path is represented by pencil-margin marks and a quiet amber reading-progress rule; categories encode instructional function, not decoration.
- **Self-critique:** avoid a generic hero plus identical cards. Keep actual passage titles, topic artwork, and reading demands visible in the library; reserve strong color for reading stage, evidence category, and current location.

## Release notes

- Do not count existing short, one-question practice activities as full authored lessons.
- Count a full lesson only when its text, objectives, vocabulary, multiple comprehension demands, feedback, teacher guide, and validation status are present.
- WIDA references are instructional alignment proposals only. An automated metadata suggestion is never an official or verified WIDA alignment.
- Keep all learner content and progress on-device; never send student work to an external service.
