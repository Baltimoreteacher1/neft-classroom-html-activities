# Create an Interactive Activity

Produce a self-contained interactive practice page students run on a Chromebook.

The Factory generates it from the lesson `job.json` (`lib/interactive.mjs`). It
includes name entry (no PIN, no teacher dashboard), clear directions, one problem
at a time, a hint after a wrong answer, a stronger hint after two tries, a progress
bar, and a print-your-result button.

1. Make sure the `job.json` has `practice` problems carrying `answer`, and `work`
   for the stronger hint. Items marked `teacherJudgment: true` are skipped — they
   have no single right answer to auto-check.
2. Build: `npm run cardforge:build -- <job.json>` → `interactive.html`.
3. Smoke-test in a browser: enter a name → start → answer one wrong (hint appears)
   → answer correct (advances) → finish (score plus print). Confirm zero console
   errors.
4. Check the language is ESOL-friendly (short sentences, plain words) and that the
   page works with no network — all CSS and JS inline.

Do not add a PIN, a login, or a teacher dashboard unless I explicitly ask.
