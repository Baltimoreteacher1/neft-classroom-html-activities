// The dead-code audit must not recommend deleting a live test.
//
// `tools/run-tests.mjs` finds test files by WALKING the tree: nothing imports
// them, and no npm script names them one by one. A reference-graph audit sees
// that as "unreferenced". On 2026-08-23 `reports/dead-code.md` listed 145
// deletion candidates and 80 of them were tests that run on every push —
// including the guards for misconception detection, inequality diagnosis and
// the operand tagger.
//
// Following that report would have deleted 80 working tests, and `npm test`
// would have gone green with less coverage and said nothing. The report is
// explicitly "reports only, never deletes", but a report a human is meant to
// act on is only as safe as its worst recommendation.
//
// This asserts the invariant rather than the number: every file the runner
// discovers must be treated as REACHED by the audit.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("..", import.meta.url).pathname;

/** Every test file the runner would discover, as repo-relative paths. */
function discoveredTests() {
  const out = execFileSync("git", ["ls-files", "*.test.mjs", "*.test.cjs", "*.test.js"], {
    cwd: root,
    encoding: "utf8",
  });
  return out.split("\n").filter(Boolean);
}

test("the runner discovers test files by walking, so they cannot be 'unreferenced'", () => {
  const found = discoveredTests();
  assert.ok(found.length > 100, `expected the suite to be large; found ${found.length}`);

  const audit = readFileSync(new URL("../scripts/audit-dead-code.mjs", import.meta.url), "utf8");
  // The audit must exempt them by PATTERN, not by listing individual files —
  // a list would go stale the moment someone adds a test.
  assert.match(
    audit,
    /ENTRYPOINT_HINTS[\s\S]*\\\.test\\\.\(mjs\|cjs\|js\)\$/,
    "audit-dead-code.mjs must exempt *.test.{mjs,cjs,js} from the unreferenced list",
  );
});

test("the committed report does not name a live test as unreferenced", () => {
  let report;
  try {
    report = readFileSync(new URL("../reports/dead-code.md", import.meta.url), "utf8");
  } catch {
    return; // report not generated in this checkout — nothing to contradict
  }
  const section = report.split("## Unreferenced")[1]?.split("\n## ")[0] ?? "";
  const named = discoveredTests().filter((f) => section.includes(`\`${f}\``));
  assert.deepEqual(
    named,
    [],
    `the dead-code report lists ${named.length} LIVE test file(s) as deletion candidates:\n  ${named.slice(0, 10).join("\n  ")}`,
  );
});
