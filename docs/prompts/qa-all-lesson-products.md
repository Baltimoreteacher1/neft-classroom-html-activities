# QA All Lesson Products

Run the Factory QA gate across every staged bundle and report a single summary.

Steps:

1. List staged bundles: each dir under `tools/cardforge/staged/**/` that has a
   `card.json`.
2. For each, run `npm run cardforge:qa -- <dir>` and collect: status (PASS /
   pass-with-warnings / BLOCKED), blocking count, warning count.
3. The QA gate verifies:
   - **Content:** "I can…" objective; ≥2 modeled examples; formulas when needed;
     an answer key for every practice set; no answer key inside a student-only
     page; ESOL present; SPED present when appropriate; sub/student-readable
     directions.
   - **Math:** answer key covers every problem; inline mean/median/range claims
     recompute correctly; no malformed answers.
   - **Design:** printables are B/W-friendly; readable fonts; no overflow.
   - **Technical:** no fake live buttons/links; no stray TODO; `npm run build`
     and `npm run validate` pass.
4. Output a table (bundle → status → blocks → warnings) and a list of every ⛔
   to repair (hand each to `/repair-lesson-bundle`).
5. Run `npm run build` and `npm run validate` once at the end and report results.

Do not deploy. Do not touch deployment files.
