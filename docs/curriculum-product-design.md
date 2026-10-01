# Curriculum product design — October 2026

The curriculum discovery pages now share a static, accessible navigation shell and a small scoped visual system. The dashboard gives students and teachers a course overview drawn from the existing manifest (10 units, 84 lessons), alongside the existing lesson finder and resources. Unit pages put the selected lesson's launch, practice sheet, and homework first, with additional resources in a native disclosure. Exact resource links come from the rendered authored outline, rather than inferred URLs.

Core and small-group lessons provide a return link and the core lesson sequence. Embedded and SCORM launches omit those links to preserve the host course. The generated lesson-sequence asset uses the existing curriculum-source loader. Workbook and learning-lab generators apply the same shell so a regeneration retains the design.

The visual system uses restrained colors, readable headings, consistent borders and spacing, visible focus, and large navigation targets. Course navigation reflows into six clearly labeled destinations on phones. Existing URLs, instructional math, lesson selection, history, local progress, print resources, and save/resume contracts remain intact.

The wider audit includes all top-level curriculum indexes and representative core, part-two, small-group, readiness, notes, homework, worksheet, project, learning-lab, and game routes. Fixes include contrast in review and support tools, native role-selection buttons, a named lesson selector and progress indicator, a keyboard-focusable ratio table, notes controls that reflow on phones, and non-overlapping small-group controls. Practice Arcade keeps secondary tools in a native Game tools disclosure. Practice Arcade fits its canvas to an explicit game container; hints support Escape and restore keyboard focus.

## Verification scope

- New Playwright suite covers the nine main discovery pages at 360, 768, 1366, and 1920 pixels with WCAG 2.2 AA-tagged axe scans, navigation targets, and overflow checks.
- Behavior checks cover exact unit/lesson resource URLs, history, reload, first/last sequence controls, reading-support keyboard behavior, no-JavaScript links, lesson entry, saved state, LMS/embed containment, support tools, and game tools/hints.
- A wider browser audit samples 46 routes on a 390-pixel phone, plus visual checks of dashboard, unit, notes, small-group, and arcade pages on phone, tablet, and Chromebook widths.
- Static contract checks cover all 84 core lessons, curriculum shell generation/idempotency, asset hashes, unit search/navigation, curriculum links, and existing content baseline.
- The guarded release process runs the repository's full QA loop from a clean assembled production worktree before pushing, and checks the public build stamp and production smoke routes afterward.

Automated accessibility scans are sampled checks, not a WCAG certification or a full screen-reader audit. The repository has existing checkJs debt; this change does not claim the entire project passes a raw TypeScript check. No dependency upgrades, new trackers, student-data integrations, or route restructuring are included.

The existing annotation hit-test fixture was updated to recognize the visible math-tools dock as well as the legacy supports pill; it continues to require a real neighboring dock and an unobscured annotation target.

Final local evidence: 295/295 lesson/activity boots passed; all 84 core lesson content baselines were unchanged. The dashboard measured 100 ms LCP, 254 ms DOM ready, 534 KB transferred, and 55 requests on the local production build with 4× CPU throttling (network unthrottled), within existing budgets.

## October 1 design refinement

The second pass gives the discovery pages a shared Hanken Grotesk type system,
warm neutral surfaces, restrained green accents, smaller corner radii, and fewer
decorative boxes. The dashboard connects the lesson index and selected lesson in
two panes, with a short orientation when nothing is selected. Secondary shortcuts
remain links. Unit search and selection sit together above the lesson, whose
heading and main lesson/practice/homework actions have a clear visual hierarchy.
Catalogs use the same headings, spacing, cards, and navigation. Learning-lab
directions are available in an optional disclosure; unit names agree with the
course overview and the generator preserves that wording.

Practice Arcade has a native phone launch screen with a labeled level selector
and a large Start button. It calls the existing game functions and validators.
Revealing the canvas re-measures Phaser's parent bounds; keyboard input on native
controls cannot also start the game. The new entry controls retain the existing
English/Spanish setting. Visual QA caught and corrected the zero-size canvas and
a progress-page heading contrast regression before release.

Refinement checks: 12 focused Playwright tests passed, including nine catalog
routes at 360, 768, 1366, and 1920 pixels, sampled WCAG 2.2 AA-tagged axe checks,
overflow, keyboard interactions, saved state, lesson sequencing, no-script
navigation, LMS containment, and the phone arcade launch. The lesson finder passed
31 behavior checks; the unit browser passed its existing behavior suite; all 84
core lesson content baselines remained unchanged. Browser visual inspection
covered the phone dashboard and arcade, tablet lesson selection, and Chromebook
learning-lab catalog.

The native phone launch improves entry to the existing canvas game. It does not
make the canvas rounds equivalent to semantic HTML or establish full screen-reader
accessibility. Canvas text and drag interactions still warrant device testing;
the sampled automated checks do not establish compliance or a complete audit of
every game round. Production release evidence is recorded by the guarded ship
process separately from these local checks.
