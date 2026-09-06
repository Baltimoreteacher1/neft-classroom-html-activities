# Repair a Lesson Bundle

A bundle's QA failed, or a teacher found a problem. Fix it at the source.

Steps:

1. Read `qa-report.md` in the bundle's staged dir. Identify every ⛔ block and
   ⚠️ warning.
2. Open the bundle's `job.json` in `tools/cardforge/examples/<slug>/` — the single
   source of truth. Never hand-edit a generated file; fix the job.
3. Common repairs:
   - "answer key covers every problem" → add an `answerKey` entry for each
     practice `n`.
   - math claim mismatch → recompute, then fix the number in `answer`/`work`.
   - "answers may vary" with no rubric → add a `rubric` and set
     `teacherJudgment: true`.
   - missing ESOL/SPED → add `esolSupports` / `spedSupports`.
   - AI-slop phrase or stray TODO → rewrite in teacher voice.
4. Rebuild and re-QA: `npm run cardforge:stage -- <job.json>`.
5. Repeat until QA passes. Report what changed.
