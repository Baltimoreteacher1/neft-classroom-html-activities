# Premium experience implementation

Base: current production source, integrated through `723405a647` (initial audit base `e5749d2fea`). The older root checkout and its experimental evidence changes are excluded. Changes stay inside existing routes, engines, records and authoring workflows.

## Implemented

- Shared premium layer reuses Harbor tokens, local fonts, focus indicators and restrained motion; teacher command-center spacing and existing action cards refined.
- Student learning page has an original landscape illustration and responsive two-column composition. The illustration is decorative, not a report of learner completion.
- Family hub uses an original reading scene and clearer existing practice cards. Language selection and resources remain intact.
- Conversation studio has original field-station/archive environments and characters. Its presentation follows actual audio playback completion and microphone state; it does not claim lip synchronization.
- Writing studio has an optional reversible focus workspace. Drafts, sources, targeted feedback and revision history remain in the existing engine.
- Book reader adds daylight/evening surroundings and keyboard-operable direct page seeking, with local preference persistence. Authored page colors and content are preserved. The existing illustration/background picker now offers both original paintings: ordinary insertion remains editable, explicit backgrounds receive readable text backings, and actual image blobs travel with project/EPUB/print exports.
- Existing City map facade highlighting connects pointer/keyboard focus to the selected destination; existing interiors receive scoped visual depth.
- Science Lab labels existing inspection controls on focus/selection and refines observation-panel hierarchy. Experiment behavior and response evidence remain unchanged.
- Museum and newsroom scene enhancements are integrated through their existing views. The Museum case control opens and focuses the authored evidence grid; the Newsroom counters reflect actual local reporting work.

## Verification approach

`tools/access-premium-visual-e2e.mjs` serves real source through Vite and captures home, student, family, conversation, writing, books, growth, supports, practice, City, Science, Museum, Newsroom and Teacher routes at three viewport sizes. It fails when an unknown route falls back to home, on page errors, on document overflow, or on WCAG-tagged axe violations in the specified student/conversation/writing views.

Book and conversation/writing regression suites exercise actual interactions, persistence, export/import, microphone recovery, focus mode and reduced motion. Existing City/Science content/engine tests protect instructional behavior. The repository gate and guarded ship remain required; logs are external to the source tree.

## Practical limits

This is an extension of working software. It does not replace all site art with 3D assets or produce bespoke professional artwork for every teacher-authored book. New illustrations combine original lightweight vectors with two original generated environmental paintings for Museum and Newsroom. The paintings have responsive 640px/1440px JPEG variants, lazy loading and explicit dimensions; mobile variants are under 90 KB each and desktop variants under 320 KB each. The images provide atmosphere; evidence and interactions remain separate semantic controls. Existing local-only progress remains local-only. No new authentication, assessment ingestion, remote assignments, official WIDA scoring, or production student-data migration is introduced. The full master product specification is not certified complete by this visual release.

The references guide composition and richness; competitor art and layouts have not been copied. Measured browser route-render timings are recorded by the visual runner; these desktop automation timings are not a Chromebook performance certification.

## Repeatable checks

- `npm run validate:language-premium-browser` — self-hosted Chromium render/axe/overflow matrix; set `LANGUAGE_QA_BROWSER=firefox` or `webkit` to check another installed Playwright engine.
- `npm run validate:language-premium-authoring` — real picker/media/project/EPUB/print integration.
- `npm run validate:language-premium-webkit` — cold-load/responsive header stability and page lifecycle regression; requires the Playwright WebKit binary.
- `node tools/book-studio-e2e.mjs` and `node tools/adventures-e2e.mjs` — existing journeys plus the new reader and case-inspection regressions.

These browser suites are explicitly runnable checks; do not infer they run in every existing CI job. CI retains its established dependency and browser setup.
