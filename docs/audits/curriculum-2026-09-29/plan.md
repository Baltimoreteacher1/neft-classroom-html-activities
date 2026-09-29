# Curriculum audit and upgrade — September 29, 2026

Source: `curriculum/index.html`, shared curriculum assets, canonical curriculum and launch manifests. Branch: `codex/curriculum-comprehensive-upgrade-20260929` from `df629746b`.

## Acceptance criteria

- A visitor can find a core lesson by title, topic, standard, or lesson number directly on the hub, then open its actual resources.
- Search, unit filtering, saved lessons, and URL state work together; empty/error/storage-denied states remain usable.
- Resource links come from existing manifests; teacher resources retain existing visibility and server authorization boundaries; no student records are read or changed.
- All existing tools remain reachable through labeled disclosures. The initial viewport prioritizes curriculum use, with predictable keyboard navigation and no horizontal overflow at 320, 390, 768, and 1366 pixels.
- Mobile and desktop browser checks cover core workflows, expanded content, and accessibility. Required project validation and build are run; pre-existing failures are distinguished from regressions.
- Existing dirty download manifest and QA files are preserved. No push or deployment without explicit approval.

## Work

1. Audit live hub and units page, source contracts, links, data, accessibility, and performance.
2. Implement the lesson desk and progressive disclosure, then repair observed defects and unsupported interface claims.
3. Verify generated resource coverage, search/selection persistence, keyboard and responsive behavior, route contracts, required validators, and production build.
4. Commit the reviewed changes, integrate through the guarded ship workflow, verify production, and deliver the audit with honest limits.

## Design

Keep EduWonderLab's self-hosted Nunito headings and Atkinson Hyperlegible body. Use blue ink #14365b, paper #ffffff, slate #475569, ocean #175da0, and teal #11675d. The lesson desk is the primary visual structure: a searchable lesson list beside a source-backed resource preview. Numbers identify real units and lessons. Native disclosures hold optional tools. Avoid adding another competing dashboard or unsupported progress judgments.

## Authorization update

Joel explicitly authorized merging, committing, and deploying all completed changes, and requested multiple agents. Three agents handled the lesson desk, units browser, and independent audit; root integrates and verifies the release.
