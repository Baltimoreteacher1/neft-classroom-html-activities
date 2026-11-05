# Adaptive navigation update

**Scope:** Local-first learner progression, diagnostic evidence, and the daily ten-question session.

## What changed

- Today’s 10 now allocates questions from the learner’s evidence. It keeps the ten-question session, gives more room to prerequisite repair when the evidence points to a foundation gap, favors scheduled retrieval, and fades support for independent checks.
- A prerequisite from an earlier grade can enter the session when the learner’s own diagnostic or practice evidence shows it may be blocking the current skill. The repair item names the skill it supports.
- A transfer item stays on the current target skill and includes a prepared contextual problem. If the item generator cannot produce a valid context, that slot returns to target practice rather than calling an unchanged question “transfer.”
- Planned independent checkpoints bypass automatic scaffolds. Student-requested hints and model interactions remain available and are recorded as support.
- “I’m not sure yet” is retained as separate diagnostic context. It is no longer stored as a wrong answer or used to recommend a gap. The uncertainty list is validated and saved with the local learner profile.
- Session purpose and reason strings are available in English and Spanish.

## Verification

- `npm run check` passed across 4,206 files (26 existing lint warnings; no errors).
- `npm run typecheck` passed (553 files checked, 86 files in the existing exception register).
- Adaptive engine: 21,591 checks passed.
- Adaptive placement: 9 grade pathways passed, including unsure, recovery, prerequisite probes, and bounded probing.
- Recommendations: 5 simulated learner profiles and 27 evidence-based explanations passed.
- Language validation: 3,551 learner-facing strings passed Spanish and placeholder checks; story-language suite passed 35,592 checks.
- Dashboard, checkup, rescue, mini-lesson, and feedback browser flows passed in Chromium.
- `npm run build` completed successfully. The build reports existing Vite script and chunk-size warnings outside this change.

## Limits

This release continues to use the existing browser-local learner profile. It does not add cross-device synchronization, authenticated class rosters, live assignment delivery, subscriptions, or billing. Class recommendations remain based on learner files a teacher opens locally. These capabilities require a separate identity, authorization, and persistence foundation before they can be advertised as multi-user services.
