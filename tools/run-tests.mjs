#!/usr/bin/env node
// Lightweight test runner for this repo's standalone node assertion scripts.
//
// The repo's "tests" are plain node scripts (e.g. games/engine3d/geometry-math.test.mjs,
// graphic-novels/_engine/tests/*.test.cjs) that run top-level assertions and exit
// non-zero on failure. They are NOT vitest/jest suites, so a generic runner that
// expects describe()/it() blocks fails them with "No test suite found". This runner
// simply executes each script with node and aggregates pass/fail.
//
// Usage: node tools/run-tests.mjs   (wired as `npm run test`)

import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { SKIP_EXIT } from "./lib/skip-exit.mjs";

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(["node_modules", "dist", ".git", ".qa-logs", "coverage"]);
const TEST_RE = /\.test\.(mjs|cjs|js)$/;

function findTests(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (IGNORE_DIRS.has(entry) || entry.startsWith(".")) continue;
      findTests(full, out);
    } else if (TEST_RE.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const tests = findTests(ROOT).sort();
if (tests.length === 0) {
  // Finding nothing is a broken discovery walk, not a clean run. This used to
  // exit 0, which is the same lie as a gate that skips and reports PASS.
  console.error("No test scripts found — the discovery walk is broken, not the suite empty.");
  process.exit(1);
}

let failed = 0;
const skipped = [];
for (const file of tests) {
  const rel = relative(ROOT, file);
  try {
    execFileSync(process.execPath, [file], { stdio: "inherit" });
    console.log(`PASS  ${rel}`);
  } catch (e) {
    // Exit 3 = SKIP (tools/lib/skip-exit.mjs): the test could not run — a dirty
    // tree it refuses to judge, a runtime it needs and does not have. Not a
    // pass, not a failure, and NAMED in the summary either way.
    if (e?.status === SKIP_EXIT) {
      console.log(`SKIP  ${rel}  (did not run)`);
      skipped.push(rel);
      continue;
    }
    console.error(`FAIL  ${rel}`);
    failed += 1;
  }
}

console.log(`\n${tests.length - failed - skipped.length}/${tests.length} test scripts passed.`);
if (skipped.length) {
  console.log(`${skipped.length} SKIPPED (verified nothing): ${skipped.join(", ")}`);
  if (process.env.CI) {
    console.error("CI must not report skipped tests as a pass.");
    process.exit(1);
  }
}
process.exit(failed > 0 ? 1 : 0);
