# QA All Lesson Products

Run the Factory QA gate across every staged bundle and report one summary.

Steps:

1. List the staged bundles: every dir under `tools/cardforge/staged/**/` holding a
   `card.json`.
2. For each, run `npm run cardforge:qa -- <dir>` and collect status (PASS /
   pass-with-warnings / BLOCKED), blocking count, and warning count.
3. The gate verifies:
   - **Content** — an "I can…" objective; 2+ modeled examples; formulas where
     needed; an answer key for every practice set; no answer key inside a
     student-only page; ESOL present; SPED present where appropriate;
     sub-readable and student-readable directions.
   - **Math** — the answer key covers every problem; inline mean/median/range
     claims recompute correctly; no malformed answers.
   - **Design** — printables are B/W-friendly, fonts readable, nothing overflows.
   - **Technical** — no fake live buttons or links; no stray TODO; `npm run build`
     and `npm run validate` pass.
4. Output a table (bundle → status → blocks → warnings) plus a list of every ⛔ to
   repair. Hand each to `/repair-lesson-bundle`.
5. Run `npm run build` and `npm run validate` once at the end and report results.

Do not deploy. Do not touch deployment files.
