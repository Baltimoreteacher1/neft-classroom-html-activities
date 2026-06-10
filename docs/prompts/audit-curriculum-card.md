# Audit a Curriculum Card

Check what a lesson card on the math curriculum page currently offers and what's
missing, without changing anything.

Steps:

1. Read the card source of truth: `data/curriculum-manifest.json` (the `lessons[]`
   entry for the given `unit-lesson`) and `lessons/<unit>-<lesson>/config.json`.
2. Run `npm run cardforge:audit` for the repo-wide view of weak cards.
3. For the target lesson, report: present vs missing fields (objective, standard,
   languageObjective, timeEstimate, topic) and present vs missing resources
   (lesson, guided notes, PDF/DOCX, family, teacher notes, printables).
4. List which Factory products (Student Lesson, Printable Packet, Activity Pack,
   Emergency Sub Plan, Interactive Practice) the card does NOT yet have.
5. Output a short table + a recommended next action (usually: generate the
   missing bundle with `/generate-lesson-bundle`).

Read-only. Do not edit cards, routes, or deployment files.
