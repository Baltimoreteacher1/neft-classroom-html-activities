# Curriculum resource discovery

## Goal and approach

Make reusable teaching materials discoverable from `/curriculum/` without knowing a product name or opening nested menus. Keep the lesson finder and existing resource routes intact.

- A header shortcut jumps directly to an always-visible Resources & tools section; Fluency has a direct audience-appropriate shortcut.
- A short curated guide groups reusable hubs by teaching task. Search covers names, descriptions, formats, and common synonyms. The full site directory remains the exhaustive index.
- Pin useful resources on this device for repeat visits. Teacher resources follow the existing teacher-view state; the existing server authorization remains authoritative.
- Use the existing navy/blue/teal palette, Nunito headings, Atkinson body text, compact filter controls, and readable resource summaries. No additional dependencies or decorative motion.

## Implementation

`data/curriculum-resource-guide.json` owns titles, descriptions, task categories, search terms, routes, and audience. `assets/curriculum-resources.js` renders and filters it. The hub has static fallback links if loading or JavaScript fails. Styling is scoped in `assets/curriculum-resources.css`; the script participates in the existing hub bundle.

## Acceptance and checks

- Fluency opens from the header in one click. Resources & tools opens without expanding any disclosure.
- Search finds fluency, worksheets, small groups, supports, planning, assessment, and games with useful descriptions.
- Filters, result count, load-more, clear, pins, empty/error states, blocked storage, and teacher/student switching work by keyboard and touch.
- All authored links resolve, public entries pass the shared teacher-surface check, and arbitrary saved IDs cannot introduce links.
- Existing lesson selection, Teach today, print, and access controls still work.
- Verify desktop/mobile in Chromium; run focused behavioral tests, accessibility, build, and the repository release gate. Deploy only through the authorized guarded ship workflow.

## Maintenance

Add a resource to the JSON guide when it is a reusable entry point, not each worksheet or individual lesson. Use a plain description of what someone can do there. Set audience to `teacher`, `student` (student view only), or `all`. Keep the site's exhaustive catalog generated separately. Pinned IDs are local UI preferences; no student records or analytics are added.

## Verification

Ten focused behavior checks cover all authored routes, search synonyms, categories, audience changes, persistent pins, keyboard focus, failed loading/retry, invalid URLs, blocked storage, escaped query text, and cold fragment links that settle after the lesson list loads without overriding user input. The built hub was exercised in Chromium at 1366px, 768px, and 390px, including pin/reload, teacher-to-student switching, Fluency launch, and a simulated guide-fetch failure. The resource section passes axe in both audiences; the full 24-page accessibility sample reports zero violations. The new script also passes a direct TypeScript check against the repository's non-strict JavaScript settings.
