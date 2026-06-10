# Generate a Lesson Bundle

Use the Lesson-to-Product Factory (`tools/cardforge/`) to produce a complete,
TPT-quality bundle for a Grade 6 math lesson.

Inputs I will give you: unit, lesson number, title, standard (e.g. 6.RP.2), and
the skill. If I omit any, infer conservatively and flag what is uncertain.

Steps:

1. Copy `tools/cardforge/examples/ratio-unit-rate/job.json` to
   `tools/cardforge/examples/<slug>/job.json`.
2. Fill the `card` block (unit, lesson, title, standard, skillFocus, "I can…"
   studentObjective + languageObjective, description, tags) and the `lesson`
   block: vocabulary (EN/ES + example), formulas, 2+ modeledExamples with
   numbered steps, 6 practice problems each with `answer` + `work`, a matching
   `answerKey`, a 2-item exitTicket, misconceptions (with fixes), esolSupports,
   spedSupports, extension, subNotes.
3. **Verify every answer by hand** — recompute each problem.
4. Run: `npm run cardforge:stage -- tools/cardforge/examples/<slug>/job.json`
   then `npm run cardforge:update-card -- <staged-dir>`.
5. Report the QA result and the staged path. If QA blocks, repair and re-run.

Rules: teacher voice (direct, warm, practical); no AI filler; B/W-friendly;
real problems + real answer keys, never outlines; keep math notation clean.
