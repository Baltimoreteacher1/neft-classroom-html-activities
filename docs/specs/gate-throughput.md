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

## Decisions (made 2026-11-04, operator delegated them)

1. **Script-only `package.json` edits: no change.** `qa-run.mjs` already scopes an edit confined to `scripts` entries outside the build chain (`packageScriptsDelta`). The 2026-11-03 release ran everything because it added a step to the `validate` chain, which the gate treats as a gate change. Keeping that: a new gate is exactly the change that should run all of them once.
2. **Lock wait raised from 30 to 90 minutes** (`QA_LOCK_WAIT_MS` still overrides). With ~8 sessions a gate waits 25-30 min, so 30 sat on the edge and waiters that gave up pushed load to 58. Pre-push still outranks other waiters.
3. **Test pool backs off with load** instead of editing the Fluency tests: `tools/run-tests.mjs` sizes the pool as `cores - 1 - load/2`, clamped to 2-8 (`TEST_JOBS` overrides). The tests that flaked passed at 2 jobs; the flake was the machine, not the tests, so no test was weakened.
4. **`ship.sh` waits for the ship lock and re-picks.** A second `ship` now waits (up to `SHIP_LOCK_WAIT_S`, default 3600, `0` = old fail-fast behaviour) and then re-runs from the fetch, so it cherry-picks onto the tip the first ship produced. It does **not** skip or reuse a gate across a moved `main`: the gate result belongs to the tree that was tested.
5. **SCORM zips: both copies stay.** The Canvas page links `./packages/` (teacher-gated) and the hub links `/scorm-packages/` (public); removing either breaks a live URL, and `neft-pretest-quizzes.zip` exists only in the gated copy, so it cannot be moved to the public one. If headroom runs out, the lever is a Pages Function that serves the gated path from `/scorm-packages/` after the gate, keeping the URL and dropping ~500 files; do that only with a live gate smoke test.

## Cloudflare Pages limit

Pages refuses a deployment of more than 20,000 files, at the last step after a green build. It froze
production for ~6 hours on 2026-11-03 and once before. `validate:dist-file-budget` now fails above
19,950. Headroom is about 75 files. The largest candidate to reclaim space is the ~1,000 SCORM zips
duplicated under `scorm-packages/` and `teacher-tools/canvas-scorm/packages/`; removing either could
break Canvas links, so it needs a decision.

To read a failed build: Cloudflare dashboard -> Workers & Pages -> `neft-classroom-html-activities`
-> Details on the red deployment -> Build log. The error is the last real line (the pane scrolls
internally). Do not use "Retry deployment" to diagnose.
