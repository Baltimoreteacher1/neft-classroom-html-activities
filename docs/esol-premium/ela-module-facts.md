# ELA module facts (district Wit & Wisdom pacing guides)

The Language Studio shows, for ELA units 1–3 in every grade (K–8), what the district's Wit & Wisdom pacing guides say about the
matching module, and where each lesson companion sits in the module's weeks.

## Where it comes from

- **Source:** the SY 2025–26 guides (Start Strong / Module 0, Modules 1–3, K–8). They are PDFs on Joel's Desktop, not in the repo.
- **`tools/extract-ela-modules.mjs --src ~/Desktop`** → `data/ela-modules.json`: per grade × module the dates, introduction,
  end-of-module task, the "Module:" line, each week (number, date range, Texts column, publisher lesson numbers, the
  week's words) and the module's anchor texts. Every stored string is a slice of the PDF text and the run fails if one is not.
  `--check` fails when the committed file differs from a fresh extraction (needs the PDFs and `pdftotext`).
- **`tools/build-bcpss-module-facts.mjs`** → `db/seeds/bcpss/v2/module-facts/<unit>.mjs` (27 files, lazy-loaded through
  `MODULE_FACT_LOADERS` in `v2/index.mjs`). Served by `functions/_lib/bcpss/module-facts.js`: `unit detail → module`,
  `/api/bcpss/units/<id>/lessons → module + lesson.module_week`, `/api/bcpss/lessons/<id> → module_week`.

## What is fact and what is a suggestion

- **Fact (printed in the guide):** module number and dates, introduction, end-of-module task, the module title and question
  when the guide prints them (Modules 2–3), week dates, "Wit & Wisdom lessons a–b" for a week, texts.
- **Suggestion (ours):** the week each lesson companion is placed in. It is the best non-decreasing placement by shared
  vocabulary (new words count three times a review word, words every week uses count little). `how: "terms"` names the words;
  `how: "order"` means no week used the lesson's words, so it keeps the lessons' order. Nothing is invented: a lesson is
  only ever placed in a week the guide prints, and never in a Start Strong (Module 0) week.
- **Module 0 (Start Strong)** is the opening weeks of the Module 1 guide, not a separate unit; the card marks those weeks.
- **Module 4** is not in the district files, so ELA unit 4 shows no module card.

## Known problems in the source PDFs (kept, not hidden)

Listed per module under `repairs` in `data/ela-modules.json`:

- Grade 5 Module 2: the Grade 6 Module 2 title line is pasted into the middle of the introduction (repaired by an explicit, recorded replacement).
- Grade 8 Module 2: the "Module:" line says "What Is Love?" (the Module 3 title); the introduction is about World War I (the line is dropped).
- The Grade K Start Strong file carries Grade 8's introduction (those files are not used for facts).
- Six modules print a final week that starts a few days after the module's stated end date (e.g. "March 2–6" under a March 4 end).
- Some weeks have no date in the PDF (week 13 flex weeks, a few Memorial Day weeks); they show without dates.
- The Texts column is read by position; the PDF clips some cell text, so entries are kept only when they read like a title and credit. Some are merged ("… Robert Burleigh Starry Messenger, Peter Sís") or contain odd spacing from the source ("Anon ymous").

## Checks

`npm run validate:bcpss-module-facts` (in `validate:bcpss`; pinned floor in `data/sweep-floors.json`),
`npm run validate:bcpss-module-e2e` (Chromium: card, chips, lesson note, student view, 360px and easy-read),
`node --test tools/ela-module-facts.test.mjs`.

## Not changed on purpose

`unit_title`, `unit_summary` and `essential_question` in the ELA seeds are unchanged: the unit titles already match all 27
guide modules, the live unit rows come from D1 (a seed edit would not reach production without a database write), and the
summaries feed family-facing pages that should not quote a teacher-facing guide verbatim.
