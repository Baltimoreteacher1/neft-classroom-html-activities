# Getting work through the QA gate (measured 2026-11-03)

Why a release took hours, what is safe to do about it, and what needs a decision. Every number below
was measured on this machine on 2026-11-03 while ~8 sessions shared it.

## Where the time goes

| Cost                  | Measured                   | Cause                                                                                                                    |
| --------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Lock wait             | 25–30 min per gate         | one full gate at a time per machine (`scripts/lib/qa-lock.mjs`); ~8 sessions queue                                       |
| Full sweep            | 150 checks, 20–40 min      | any `package.json` change, or a path with no coverage rule, escalates to everything (default-deny)                       |
| Fluency browser tests | ~8 min, flake under load   | 46 "opaque" tests always run; they lose races to CPU load (load average reached 58 on a 10-core machine)                 |
| Two gates per release | commit hook, then pre-push | not duplicates: the push gate runs the browser checks the commit gate deferred                                           |
| Timeouts              | a check killed at 15 min   | `QA_TIMEOUT_MS` default; a loaded `test` step exceeds it and reads as "TIMED OUT (verified nothing)"                     |
| Lost race             | a full gate wasted         | `scripts/ship.sh` does not rebase: if `origin/main` moves while the push gate waits, the push is rejected after the gate |

## What to do (safe, no gate is weakened)

- **Run gates with `TEST_JOBS=2 QA_TIMEOUT_MS=5400000`.** `run-tests.mjs` defaults to up to 8 parallel browsers; at 2 the same tests that flaked all passed, and the timeout stops a slow-but-healthy `test` step from dying.
- **Make plain commits.** `git commit -- <path>` gives the hook a temporary index without your other staged files, so new tests look "untracked" and the manifest check fails.
- **Compose, then gate once.** `git cherry-pick` stops invoking the hook only when there are no conflicts; after a conflict, `--continue` runs it. Build combined trees with `git write-tree` + `git commit-tree` + `git update-ref`, then make ONE real commit so the gate runs once on what ships. Never `--no-verify`.
- **Split the urgent fix from the big release.** A fix whose paths have a `qa-run.mjs` coverage rule runs a scoped gate (the 2026-11-03 file-limit fix: 4 checks, ~7 min) instead of the full sweep.
- **Retry `ship` while another ship runs.** `ship.sh` is single-flight and says so; poll it rather than starting a second one. Re-fetch before each attempt so the cherry-pick lands on the newest `main`.
- **Lower the priority of non-shipping heavy gates** (`renice +12`, same user, reversible by letting them finish) rather than stopping them: pausing them risks their own check timeouts on resume.
- **Batch.** Merge finished branches into one release instead of one gate pair each.
- **Watch the Cloudflare build, not just the push.** A green push is not a deploy: see the 20,000-file limit below.

## Needs a decision (changes what "passed" means for every session)

1. **Scope a `package.json` change that only adds script entries** instead of running all 150 checks (`tools/lib/test-scope.mjs` treats any `package.json` edit as "everything").
2. **Raise the lock wait above 30 minutes.** When a waiter gives up and runs unserialised, load climbs (58 observed) and every gate gets slower, which is the opposite of what the lock was built for.
3. **Make the always-run Fluency browser tests load-tolerant** (they belong to that surface); at minimum stop them running for changes that cannot affect them.
4. **Have `ship.sh` re-fetch and re-pick before pushing** so a moved `main` costs seconds, not a full gate.

## Cloudflare Pages limit

Pages refuses a deployment of more than 20,000 files, at the last step after a green build. It froze
production for ~6 hours on 2026-11-03 and once before. `validate:dist-file-budget` now fails above
19,950. Headroom is about 75 files. The largest candidate to reclaim space is the ~1,000 SCORM zips
duplicated under `scorm-packages/` and `teacher-tools/canvas-scorm/packages/`; removing either could
break Canvas links, so it needs a decision.

To read a failed build: Cloudflare dashboard -> Workers & Pages -> `neft-classroom-html-activities`
-> Details on the red deployment -> Build log. The error is the last real line (the pane scrolls
internally). Do not use "Retry deployment" to diagnose.
