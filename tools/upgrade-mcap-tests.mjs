#!/usr/bin/env node
// ── RETIRED ───────────────────────────────────────────────────────────────────
// This one-shot, in-place string mutator has been replaced by a proper generator.
//
// The 6 interactive MCAP practice tests are now built from the single source of
// truth in mcap-review/data/mcap-test-items.mjs by:
//
//     npm run generate-mcap-tests      (scripts/generate-mcap-tests.mjs)
//
// That generator emits the CBT timer/flag/review-panel chrome, the auto-grading
// quiz engine, Level 1/2 differentiation, and misconception-aware distractor
// feedback in one regenerable, idempotent pass — so there is no longer a
// divergent hand-edited path to mutate.
//
// This file is intentionally a no-op stub; do not re-introduce string injection.

console.error(
  "tools/upgrade-mcap-tests.mjs is retired.\n" +
    "Edit mcap-review/data/mcap-test-items.mjs and run: npm run generate-mcap-tests",
);
process.exit(1);
