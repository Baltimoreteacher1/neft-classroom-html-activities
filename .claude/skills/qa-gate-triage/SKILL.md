---
name: qa-gate-triage
description: Read when a QA check, validator, gate or test fails in this repo, or when a gate reports a finding that hits a whole population of lessons. Four gates were found lying in one night — check the hour, the invocation, the build state and the detector before you believe a red result or start fixing code.
---

# A red gate is a claim, not a verdict

Every one of these was a real, reproducible failure that had nothing to do with
the code under test. Rule them out first — in this order, cheapest first.

## 1. Is it red because of the clock?

`test/focus-school-phase2.test.mjs` failed every night after ~21:00 and passed
by day. `overloadReport()` asks how tonight's work compares to tonight's
REMAINING free time; after bedtime there is none, so it correctly reported "not
overloaded" and the assertion went red. It blocked every deploy after bedtime,
on `origin/main`, while that commit was live in production.

```
TZ=Asia/Tokyo node --test <file>     # moves the wall clock, cheaply
```

The fix for this class is an injectable clock (`nowMinutes` beside the `todayIso`
these functions already take), not a weakened assertion.

## 2. Is it red because of HOW it was invoked?

`npm run audit:deps` reported "0 blocking" and demanded both live allowlist
entries be deleted. `node tools/audit-allowlist.mjs` on the same tree reported
"2 accepted" and passed.

`npm run` exports every npm config as `npm_config_*`, and a nested `npm` re-reads
them as its own flags. One unsupported key in `~/.npmrc` arrived as
`--allow-scripts` and killed the child with `EALLOWSCRIPTS`; npm answered
`{"error":{...}}` and `.vulnerabilities ?? {}` read that as zero findings — a
silent pass on an audit that never ran. **Run any suspect gate both ways.**

## 3. Is it red because of the environment, not the tree?

- `validate:lesson-visuals`, `audit:small-group-ux` and `smoke:planning` need a
  preview server: `npm run preview -- --port 4499` (that port is their default —
  passing `--base` to one and forgetting another gives false failures).
- `smoke:planning`'s "pacing API refuses anonymous — HTTP 200" against
  `npm run preview` means nothing is open; the static preview has no Functions
  runtime and its SPA fallback answers `/api/*` with index.html. Only
  `wrangler pages dev` can verify that gate.
- `tools/download-manifest.test.mjs` and `validate:determinism` fail on a
  pristine checkout until a build runs — see the `generated-files` skill.

## 4. Does the finding hit EVERYTHING?

**A whole-population finding is a detector bug until proven otherwise.**

`validate:lesson-visuals` reported 60 lessons whose Learn It tool "is not in the
interactive-visual REGISTRY — renders nothing", while its own static half
reported all 39 kinds registered. When a gate's two halves disagree, suspect the
browser half. Cause: `vocab-learn-panel.js` emits that host inside
`.vl-tool-block.vl-hidden` and mounts it only from the `wirePaced()` completion
callback — the probe snapshotted a host that was hidden and unmounted *by
design*, which is indistinguishable from a registry miss.

Before reporting such a finding, reproduce ONE case by hand in a browser.

## 5. Only then: is the code wrong?

If it survives all four, treat it as real and fix the cause, not the assertion.

## When you change a gate

- A skipped check is not a pass — this repo fails a check that verified nothing,
  deliberately. Keep that property.
- Sweep-based gates need a pinned floor in `data/sweep-floors.json`
  (`baseline`, `floor` ≈ 90% of it, and the `subject` it actually counts), so a
  discovery that collapses to zero cannot report a clean fleet. Prove it both
  ways: `SWEEP_GUARD_FORCE_EMPTY=<gate-id> node tools/<gate>.mjs` must exit 1.
- A new validator must be executed by the gate or exempted with a reason in
  `qa-exempt.json`, or `validate:gate-coverage` fails. There is no third state.
