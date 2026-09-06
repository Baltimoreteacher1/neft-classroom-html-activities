# Audit a Curriculum Card

Report what a lesson card on the math curriculum page currently offers and what is
missing. Change nothing.

Steps:

1. Read the sources of truth: the `lessons[]` entry for the given `unit-lesson` in
   `data/curriculum-manifest.json`, and `lessons/<unit>-<lesson>/config.json`.
2. Run `npm run cardforge:audit` for the repo-wide view of weak cards.
3. For the target lesson, report present vs missing fields (objective, standard,
   languageObjective, timeEstimate, topic) and present vs missing resources
   (lesson, guided notes, PDF/DOCX, family, teacher notes, printables).
4. List which Factory products — Student Lesson, Printable Packet, Activity Pack,
   Emergency Sub Plan, Interactive Practice — the card does not yet have.
5. Output a short table and one recommended next action, usually generating the
   missing bundle with `/generate-lesson-bundle`.

Read-only. Do not edit cards, routes, or deployment files.
