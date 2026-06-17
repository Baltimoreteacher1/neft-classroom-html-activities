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

const ROOT = process.cwd();
const IGNORE_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".qa-logs",
  "coverage",
]);
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
  console.log("No test scripts found.");
  process.exit(0);
}

let failed = 0;
for (const file of tests) {
  const rel = relative(ROOT, file);
  try {
    execFileSync(process.execPath, [file], { stdio: "inherit" });
    console.log(`PASS  ${rel}`);
  } catch {
    console.error(`FAIL  ${rel}`);
    failed += 1;
  }
}

console.log(
  `\n${tests.length - failed}/${tests.length} test scripts passed.`,
);
process.exit(failed > 0 ? 1 : 0);
