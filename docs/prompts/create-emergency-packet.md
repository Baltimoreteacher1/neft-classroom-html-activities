# Create an Emergency Sub Packet

Produce a stand-alone 3-day substitute packet for a lesson: printable, black and
white, runs itself.

The Factory generates it from the lesson `job.json` (`lib/sub-packet.mjs`).

1. Make sure the lesson has a `job.json` (see `/generate-lesson-bundle`). The
   packet uses its `warmUp`, `modeledExamples`, `practice` (plus `answerKey`), and
   `extension`.
2. Build: `npm run cardforge:build -- <job.json>` → `sub-packet.html` in the
   staged dir.
3. Open it and check, in order:
   - Cover page with simple sub directions.
   - Three day pages, each with a warm-up, a worked example, and 3–4 practice
     problems with work space.
   - A Challenge page for early finishers.
   - An Answer Key page, labeled teacher-only, on its own page.
4. Confirm it is B/W-friendly with large readable type, no tiny text, no
   color-dependent instructions, no filler. Print-preview to check pagination.

If anything is thin — fewer than 9 practice problems for three days, say — add
practice to the `job.json` and rebuild.
