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
//
// Scripts run CONCURRENTLY in a bounded pool (TEST_JOBS overrides the size).
// They ran one at a time until 2026-10-09, which made `test` the slowest member
// of the pre-push gate (130-285s for ~330 scripts). Each script is its own node
// process, so the only shared state is the filesystem and ports. Tests that bind
// HTTP use port 0; tests that touch the real tree are listed in SERIAL_TESTS and
// run alone after the pool. Output is buffered per script and printed in
// discovery order once all scripts finish.

import { execFile } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { availableParallelism } from "node:os";
import { join, relative } from "node:path";
import { SKIP_EXIT } from "./lib/skip-exit.mjs";

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(["node_modules", "dist", ".git", ".qa-logs", "coverage"]);
const TEST_RE = /\.test\.(mjs|cjs|js)$/;

/**
 * Tests that need a service NO automated run provides — a hand-started Vite dev
 * server, a locally-run Worker — keyed to the env var that turns each one on.
 *
 * These are not "skips" in the skip-exit sense. That protocol is about a check
 * that SHOULD have run and could not (no browser, no network), which in CI is
 * correctly a failure. A test that structurally cannot run without someone
 * manually starting two servers is a different thing: leaving it in the default
 * suite made the required gate red on every PR forever, for a reason no PR could
 * ever fix, which is exactly how a gate stops being read. Naming them here keeps
 * that visible and deliberate instead of hiding it inside the test.
 *
 * Set the env var to include one; the summary always says which were left out.
 */
const OPT_IN_TESTS = new Map([["tools/workbench-live-runtime.test.mjs", "MWB_RUNTIME_TEST"]]);

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

const discovered = findTests(ROOT).sort();
const optedOut = [];
const tests = discovered.filter((file) => {
  const rel = relative(ROOT, file);
  const gate = OPT_IN_TESTS.get(rel);
  if (gate && process.env[gate] !== "1") {
    optedOut.push(`${rel} (set ${gate}=1)`);
    return false;
  }
  return true;
});
if (tests.length === 0) {
  // Finding nothing is a broken discovery walk, not a clean run. This used to
  // exit 0, which is the same lie as a gate that skips and reports PASS.
  console.error("No test scripts found — the discovery walk is broken, not the suite empty.");
  process.exit(1);
}

const JOBS = Math.max(1, Number(process.env.TEST_JOBS) || Math.min(8, availableParallelism() - 1));

/**
 * Tests that must run ALONE, after the pool drains, because they write the real
 * working tree while running and a concurrent test would read it mid-write:
 *   - gate-mutation plants additive files in the tree;
 *   - build-injectors-idempotent re-runs the build's in-place injectors;
 *   - small-group-generator-idempotent and generators-preserve-vocabulary run
 *     the generators, which overwrite tools/*-rows.json (and
 *     _facilitation-data.js) before the test restores them. Run together, one
 *     snapshots the other's overwrite and "restores" it — measured 2026-10-09.
 * A new test that writes outside a tmpdir belongs here.
 */
const SERIAL_TESTS = new Set([
  "tools/gate-mutation.test.mjs",
  "tools/build-injectors-idempotent.test.mjs",
  "tools/small-group-generator-idempotent.test.mjs",
  "tools/generators-preserve-vocabulary.test.mjs",
]);

/** Run one script; `e.status` carries the exit code, as execFileSync's error did. */
function runOne(file) {
  return new Promise((resolve) => {
    execFile(process.execPath, [file], { maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ file, e: err ? { status: err.code } : null, output: `${stdout}${stderr}` });
    });
  });
}

/** Run `files` with at most `jobs` at once; results come back in input order. */
async function runPool(files, jobs) {
  const results = new Array(files.length);
  let next = 0;
  const worker = async () => {
    while (next < files.length) {
      const i = next++;
      results[i] = await runOne(files[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(jobs, files.length) }, worker));
  return results;
}

const isSerial = (file) => SERIAL_TESTS.has(relative(ROOT, file));
const results = [
  ...(await runPool(
    tests.filter((f) => !isSerial(f)),
    JOBS,
  )),
  ...(await runPool(tests.filter(isSerial), 1)),
];

let failed = 0;
const skipped = [];
for (const { file, e, output } of results) {
  const rel = relative(ROOT, file);
  if (output) process.stdout.write(output.endsWith("\n") ? output : `${output}\n`);
  if (!e) {
    console.log(`PASS  ${rel}`);
    continue;
  }
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

console.log(`\n${tests.length - failed - skipped.length}/${tests.length} test scripts passed.`);
if (optedOut.length) {
  // Always named, never silent: "what did this run actually verify?" must stay
  // answerable, the same reason skipped tests are listed below.
  console.log(`${optedOut.length} opt-in test(s) NOT run: ${optedOut.join(", ")}`);
}
if (skipped.length) {
  console.log(`${skipped.length} SKIPPED (verified nothing): ${skipped.join(", ")}`);
  if (process.env.CI) {
    console.error("CI must not report skipped tests as a pass.");
    process.exit(1);
  }
}
process.exit(failed > 0 ? 1 : 0);
