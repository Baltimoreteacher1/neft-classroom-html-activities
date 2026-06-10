# Repair a Lesson Bundle

A bundle's QA failed or a teacher found a problem. Fix it at the source.

Steps:

1. Read the bundle's `qa-report.md` in its staged dir. Identify every ⛔ block
   and ⚠️ warning.
2. Open the bundle's `job.json` (in `tools/cardforge/examples/<slug>/`) — the
   single source of truth. Never hand-edit generated files; fix the job.
3. Common repairs:
   - "answer key covers every problem" → add an `answerKey` entry for each
     practice `n`.
   - math claim mismatch → recompute and fix the number in `answer`/`work`.
   - "answers may vary" without rubric → add a `rubric` and set
     `teacherJudgment: true`.
   - missing ESOL/SPED → add `esolSupports` / `spedSupports`.
   - AI-slop phrase / TODO → rewrite in teacher voice.
4. Rebuild + re-QA: `npm run cardforge:stage -- <job.json>`.
5. Repeat until QA is PASS. Report what changed.
