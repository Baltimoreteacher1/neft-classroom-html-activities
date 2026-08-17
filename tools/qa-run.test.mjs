#!/usr/bin/env node
/* =============================================================================
 * qa-run.test.mjs — pins the safety properties of the parallel QA scheduler.
 * -----------------------------------------------------------------------------
 * `scripts/qa-run.mjs` made the pre-push gate ~2.5x faster by running checks
 * concurrently instead of serially. The whole value of that depends on one
 * claim: it still runs EVERYTHING the serial loop ran. A scheduler that gets
 * fast by quietly dropping a gate is the worst possible outcome here — it looks
 * like a win on every run until the day it lets a broken deploy through.
 *
 * So this test reads the OLD serial definition out of scripts/qa-loop.sh (still
 * on disk, still the fallback) and asserts the new full set covers it. If
 * someone edits either list, this fails and names the missing check.
 * ========================================================================== */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { COVERAGE, expand, GATE, needsOf, resolveSet, scopeFor } from "../scripts/qa-run.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const failures = [];
const check = (cond, msg) => {
  if (!cond) failures.push(msg);
};

/* --- 1. The serial loop's candidate list, read from the shell script -------- */
const sh = readFileSync(join(ROOT, "scripts/qa-loop.sh"), "utf8");
const block = sh.match(/CANDIDATES=\(([\s\S]*?)\n\)/);
check(block, "could not find CANDIDATES=( ... ) in scripts/qa-loop.sh");

const serialNames = (block?.[1] ?? "")
  .split("\n")
  .map((l) => l.replace(/#.*/, "").trim())
  .filter(Boolean)
  .filter((n) => pkg.scripts[n]); // the shell list intentionally names some that don't exist

check(
  serialNames.length >= 12,
  `expected the serial loop to name 12+ real scripts, found ${serialNames.length}`,
);

const serialExpanded = new Set(resolveSet(serialNames));
const fullSet = new Set(resolveSet(GATE));

for (const name of serialExpanded) {
  check(
    fullSet.has(name),
    `qa-run's FULL set no longer runs "${name}", which scripts/qa-loop.sh runs`,
  );
}

/* --- 2. No check may appear twice (that was the 24s of duplicate work) ------ */
const list = resolveSet(GATE);
check(list.length === new Set(list).size, "qa-run's FULL set contains a duplicate check");

/* --- 3. `validate` must be expanded, not run as one opaque step ------------- */
check(
  !fullSet.has("validate"),
  "`validate` should expand into its members, not run as a single serial step",
);
check(
  fullSet.has("validate:math") && fullSet.has("eval:small-groups"),
  "`validate` members are missing from the FULL set",
);

/* --- 4. build is a barrier -------------------------------------------------- */
check(needsOf("build").length === 0, "build must not depend on anything");
for (const c of list) {
  if (c === "build") continue;
  check(
    needsOf(c).includes("build"),
    `"${c}" may run concurrently with the build, which rewrites the tree it reads`,
  );
}

/* --- 5. Change scoping is default-deny -------------------------------------- */
check(
  scopeFor(["some/path/nobody/mapped.xyz"]) === null,
  "an unmapped path must escalate to the FULL gate",
);
check(scopeFor([]) === null, "an empty change set must escalate to the FULL gate");

const scoped = scopeFor(["lessons/1-1/config.json"]);
check(
  Array.isArray(scoped) && scoped.includes("validate:math"),
  "a lesson config change must pull in validate:math",
);
check(
  Array.isArray(scoped) && !scoped.includes("validate:js-syntax"),
  "a JSON-only change should not pay for the 23s js-syntax sweep",
);
check(
  scopeFor(["curriculum/showcase/showcase.js"])?.includes("validate:js-syntax"),
  "a .js change must pull in validate:js-syntax",
);
check(
  scopeFor(["curriculum/plan-notes/plan-notes.js"])?.includes("validate:plan-notes"),
  "a plan-notes change must pull in validate:plan-notes — coverage that names the file but not the gate is how stale vocab shipped",
);
check(
  scopeFor(["curriculum/units/index.html"])?.includes("validate:curriculum-links"),
  "an edit to the units page must pull in validate:curriculum-links",
);

/* --- 6. Every check named in the coverage table must actually exist --------- */
for (const [re, checks] of COVERAGE) {
  for (const c of checks) {
    check(pkg.scripts[c], `coverage rule ${re} names "${c}", which is not an npm script`);
  }
}

/* --- 7. The expander must refuse to reorder impure chains ------------------- */
check(
  expand("build").join() === "build",
  "`build` is not a pure npm-run chain and must stay atomic",
);

/* -------------------------------------------------------------------------- */
if (failures.length) {
  console.error("qa-run.test.mjs FAILED:");
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  `✓ qa-run scheduler: ${fullSet.size} checks, covers all ${serialExpanded.size} from the serial loop, build is a barrier, scoping is default-deny.`,
);
