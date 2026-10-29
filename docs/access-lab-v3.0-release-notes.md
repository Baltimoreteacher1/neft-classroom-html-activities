# ACCESS Practice Lab v3.0 release notes

## Release status

The ACCESS surface builds as part of the EduWonderLab production build. Production deployment is pending the repository's guarded ship flow.

## What changed

- Applied the shared navy and teal visual identity across ACCESS activities, content data, artwork, shell, and generated print packets.
- Corrected Reading Room primary-control contrast: white text now uses dark teal at 6.05:1 contrast.
- Kept the lab's original-practice disclaimer, on-device learner identity and recordings, and non-score passport language.
- Regenerated the ACCESS content index, app shell, service-worker hashes, and student/teacher printable packets from their source tools.
- Fixed the weekly-goal browser fixture to use a deterministic clock; product behavior and assertions remain intact.

## Verification

- `npm run validate:access-lab` passed, including 501 activities, 17 tests, 38 Spanish-route checks, accessibility probes, offline recovery, and 320–1440px family-route reflow.
- The full production build passed and generated 52 student/teacher HTML and DOCX printable packets plus 5 studio-printable files.
- Changed-surface palette gate passed with zero findings for the changed text, data, and raster surfaces.

## Needs Joel's judgment

- The requested 25-item editorial audit was skipped. The validator reports a small reading-level advisory; review those passages before treating the content as fully editorially cleared.
- The lab is original WIDA-aligned practice, not an official ACCESS test, score predictor, or placement tool.
