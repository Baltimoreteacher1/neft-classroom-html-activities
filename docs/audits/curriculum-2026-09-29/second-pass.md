# Curriculum second critique and upgrade

Follow-up to release `8a1f1a4ae`. Scope: actual friction in finding a lesson, opening its resources, moving between results, and recovering from failed local actions.

## Findings selected for implementation

- The lesson preview and shared student page disagree about available worksheets.
- All 84 lessons have a matching learning lab, but a selected preview does not show it.
- The 64 existing readiness pages are missing from the primary lesson-discovery flows.
- Search rejects common lesson-number phrases and existing Spanish lesson titles.
- Mobile users have no direct return from a long lesson preview to their result.
- Recent selections can conflict with active filters; reset can leave a stale clear button.
- Save failure feedback is far below the button that caused it.
- Legacy copy/offline actions can report success even when the requested action fails.
- The floating reading control can cover page controls on small screens.
- Unit Copy link uses the old home-page query contract and loses exact lesson selection.
- Browser Back to a bare units URL keeps the later unit selected; clearing no results can leave a stale search URL.
- Global unit filters display long, fully expanded resource cards before the user chooses a lesson.

## Acceptance criteria

1. Catalog and student handoff expose existing, applicable readiness, practice, and matching lab resources without adding teacher-only resources or accepting unsafe destinations.
2. Common English/Spanish search and numeric lesson phrases find the right lessons; result/preview/filter/history state stays coherent.
3. Return navigation restores visible keyboard focus; action feedback is adjacent to the action; no horizontal overflow at 320/390/768/1366px.
4. Copy, persistence, and offline recovery messages reflect actual outcomes, including denied storage/clipboard and partial network failure.
5. Keep current classroom routes, authored lesson content, server authorization, and deploy guard unchanged.
6. Targeted behavior checks and browser verification precede required repository QA, reviewed commit, guarded deployment, and live verification. Earlier authorization to commit/integrate/deploy this curriculum upgrade remains in effect.

## Design

Keep the current self-hosted typography and blue/teal curriculum palette. Improve information hierarchy, resource grouping, and navigation feedback. Reuse current controls and native browser behavior; add no dependency or speculative dashboard.

## Work ownership

Navigator agent: lesson finder/search/resource preview and focus flow. Resource agent: launch-manifest contract and student-launch resources/persistence. Units agent: unit navigation and search recovery. Root: page controls, legacy action reliability, integration, verification, release.

## Results

### Implemented

- Search recognizes lesson-number phrases (including `Lesson 3.2` and `lesson3-2`), unit prefixes, and the existing authored Spanish titles with accent-insensitive matching. Spanish-title matches show the authored title as a cue.
- Back to results restores visible keyboard focus to the chosen lesson. Recent lessons retain compatible filters and clear conflicting ones. Reset, history, and the shared clear-search button stay synchronized.
- Save/copy feedback sits directly beside the preview actions. Teacher view adds Teach this lesson, wired to the existing selected-lesson cockpit.
- The launch manifest now joins all 84 lessons to the existing 46 learning labs and exposes the 64 available readiness pages. No new runtime request was added. Strict registry/path/existence/assignment validation guards the new route type; all 1,060 core resource routes resolve locally.
- The student handoff groups optional worksheets, labs, and home resources behind native disclosures. Every resource link preserves student mode, allowed support parameters, and section anchors. The main launch remains prominent.
- Checklist persistence reports failure truthfully and retains temporary changes while moving through a playlist. Copy has a selected, accessible manual fallback. Continuity import validates shape, verifies persistence before reporting success, and recovers from malformed stored workflow data.
- Recovery-file saving counts successful cache writes and distinguishes complete, partial, and failed attempts. It explicitly avoids promising that every activity works offline. Duplicate requests are prevented while saving.
- Unit links now use the unit-browser route and preserve the exact lesson/group/activity. Browser history restores unit and activity selection; no-results reset clears the query and restores search focus.
- Unit search and resource filters use compact result cards with Materials disclosures, eight initial results, and Show more with focus restoration. Optional controls and unit-wide resources use disclosures without changing the canonical unit-card order.
- Reading supports moved into the header instead of covering content. The redundant search-area view toggle is hidden while the header view controls retain the existing behavior. The command palette close control and manual-copy field fit small screens.
- Content hashes were refreshed for changed script/style consumers. No dependency, curriculum problem, private record, API permission, or production-data change was introduced.

### Verification before release

- 30 navigator behavior tests and 19 recovery-action failure/success tests pass.
- Expanded launch-resource, student-handoff, and units-navigation regression suites pass. The browser sweep verifies all 84 lesson-to-lab links and the new filtered Materials flow.
- All 44 teacher-workflow and 22 product-upgrade contract checks pass.
- Twelve Playwright journeys pass against the production build, including existing teacher planning/print flows and four new second-pass journeys.
- Production build passes. Biome reports no errors; one existing unused-parameter warning and schema-version informational message remain outside this change. The repository typecheck ratchet passes.
- Fresh public browser profiles, blocked API calls, and blocked service workers were used for UI verification. Home and units pages show no browser exceptions or sampled WCAG A/AA violations; no horizontal overflow at 320, 390, 768, or 1366px. Expanded student/teacher home states and the clipboard fallback were checked separately.
- Agent browser measurements at 1366px: Notes results fall from 12,379px to 2,153px (83%); volume search from 6,867px to 1,965px (71%). At 390px the lesson picker appears 437px earlier (1,605px to 1,168px). These are sampled layouts, not universal performance claims.
- Independent review caught and resolved the malformed-workflow import edge case. The first full gate caught missing readiness/lab links in the older teacher picker; both keys are now included and its resource-completeness regression passes. Required commit and guarded-ship gates provide the final release checks; live build-stamp/smoke verification follows publication.

### Evidence and limits

Local screenshots, browser reports, and command logs are under `output/playwright/curriculum-round2/`, with supporting first-round harness output under `output/playwright/curriculum-audit/`. These local artifacts are excluded from the commit. This audit verifies public navigation, local browser state, generated route contracts, and sampled accessibility. It does not access or certify private classroom records, third-party LMS installations, every browser, or all offline dependencies.
