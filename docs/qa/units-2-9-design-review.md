# Units 2–9 curriculum browsing review

Date: 2026-10-02. Scope: the public curriculum landing, its Units & Lessons browser, and the unit → lesson → resource journey. This is the design/navigation portion of the team audit; content and printable audits are recorded separately.

## Evidence and design decisions

Reviewed the public `https://eduwonderlab.com/curriculum` content and inspected the working copy in a real Chromium browser. The existing course shell is coherent and already uses self-hosted fonts. Its single-unit view, quiet green palette, readable lesson headings, and progressive resource disclosures are appropriate for Grade 6 students and teachers. Preserve that system.

The discovery gap was between finding a lesson and choosing the appropriate version. A unit's native selector interleaves the main lesson and two small-group versions, reaching more than 40 options in the longest unit. Search results collapsed every resource behind “Materials,” with no direct route to the selected lesson's complete context. Next/Previous lesson always returned a small-group learner to the main lesson.

Design tokens reuse the course palette: paper `#f5f6f3`, ink `#193e3b`, teal `#11675d`, border `#d2dcd7`, white `#ffffff`; the selected pathway uses dark teal `#185a51`. Typography inherits the existing self-hosted Hanken Grotesk course family. Controls use 16px minimum text, 44px minimum targets, and explicit keyboard focus outlines. No fonts, dependencies, tracking, or animation were added.

Layout follows the actual decision order:

```text
Unit selector / search
Lesson selector
Lesson title
[Lesson] [Extra support] [Challenge]
Description of the selected pathway
[Open lesson] [Practice] [Homework when available]
Previous / Next lesson
Optional resources and learning target
```

The support choices are a native button group, not a custom tab widget. Their pressed state and a plain-language description identify what changes. Search results expose actual available lesson links and a link back to exact lesson/support choices. Existing native selects remain intact; their option ordering and values are contracts used by the shared renderer.

## Changes

- Added explicit Lesson / Extra support / Challenge choices for canonical lessons with actual corresponding variants. End-of-unit and other special pathways retain their existing behavior.
- Preserve the chosen small-group pathway when moving to the adjacent lesson, with a main-lesson fallback only when that variant does not exist.
- Carry `student=1` and active `supports` into quick launch links and search-result lesson links. When the rendered main lesson has no base worksheet link, the Practice shortcut uses its actual Part 2 worksheet link (confirmed for Units 7 and 9).
- Add direct search-result launch and exact lesson-context navigation, including group IDs, history restoration, keyboard focus, and focus retention after asynchronous resource refreshes.
- Derive shortcut availability from rendered resource links so a Notes-only filter does not invent a lesson launch action.
- Keep new actions usable at narrow widths and remove them in print mode.
- Bump navigation JS/CSS cache stamps on the Units page.

## Related content defects escalated to parent audit

During the before-change browser pass, Lesson 2-1 Statistical Questions displayed a fraction-division crime-scene-tape example and Fraction Division Soccer bonus activity. Searching “histogram” also returned Lesson 8-6 Inequalities because obsolete enrichment metadata contributed to search text. These are curriculum numbering drift rather than visual defects. The parent agent owns canonical context and bonus-map corrections; this file does not claim those changes as its implementation.

## Verification

- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4186 npx playwright test tests/curriculum-units-publisher.spec.ts --workers=1` — **9 passed**, 21.4 seconds, Chromium.
- Exact core/support/challenge selection and launch/practice destinations verified for the first lesson in every unit from 2 through 9, including persisted reading-support parameters.
- Exact group deep link survives renderer refresh and browser reload. Keyboard activation, adjacent-lesson support continuity, browser Back, search-to-lesson navigation, preserved focus after repaint, Notes filter, and empty-state reset passed.
- Axe WCAG 2 A/AA, 2.1 AA, and 2.2 AA: no violations in changed pathway controls or search result grids at 320, 768, and 1440px. No horizontal overflow at those widths.
- Source-based content integration checks: Unit 2 statistical-question scenario has no old fraction-division soccer/tape content; histogram search does not return Unit 8 Lesson 8-6 or its group variants; project links point to statistics, integers, equations, and two-variable projects for Units 2, 7, 8, and 9 respectively.
- Manually inspected rendered desktop and narrow-mobile screenshots after fonts loaded: `.qa-logs/publisher-artifacts/output/playwright/units-publisher/desktop-pathways.png`, `mobile-pathways.png`, and `mobile-results.png`. Full titles and controls wrap without clipping; selected pathway, contextual hint, and focus styles remain distinct.
- `node --check assets/curriculum-units-navigation.js`, Prettier check of navigation JS and new spec, and scoped `git diff --check` passed.
- Repository-wide TypeScript still reports errors in unrelated existing modules; it reports none in `assets/curriculum-units-navigation.js`. Parent owns the repository-wide validation result.

The final browser run used the project's Vite server with the development-only reload client disabled for this suite, preventing concurrent authoring from navigating away during Axe scans. Production does not load that client. Student API routes were stubbed to 401 in fresh browser contexts. Canonical deep links use `u` and `l`, for example `/curriculum/units/?u=2&l=2-2-group1`; `unit`/`lesson` are not this page's route contract.

Coverage intentionally distinguishes all units from all lessons: the new route contract is exercised for the first lesson of every focus unit (2–9), plus sequence/history and search journeys on representative later lessons. It does not constitute manual review of every lesson or mathematical activity. Responsive accessibility checks cover the changed controls/results at 320, 768, and 1440px. No student records, teacher-authenticated data, production mutation, push, or deployment is part of these checks.
