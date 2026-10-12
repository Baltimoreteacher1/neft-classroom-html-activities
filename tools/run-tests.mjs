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

import { execFile, execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { availableParallelism, setPriority, tmpdir } from "node:os";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { SKIP_EXIT } from "./lib/skip-exit.mjs";
import {
  entryFromTrace,
  loadManifest,
  MANIFEST_PATH,
  selectTests,
  serializeManifest,
  verifyReads,
} from "./lib/test-scope.mjs";

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

try {
  setPriority(0, 10); // below interactive work; test workers inherit it
} catch {}

/* --- Scoping and read tracing (see tools/lib/test-scope.mjs) -----------------
 * QA_TEST_SCOPE_FILES: file listing changed paths (set by scripts/qa-run.mjs);
 *   only tests whose recorded reads include one of them run.
 * QA_TEST_VERIFY=1:    trace every test that runs and FAIL if it read something
 *   data/test-reads.json does not list (a stale manifest would under-select).
 * --record:            run everything traced and rewrite data/test-reads.json. */
const RECORD = process.argv.includes("--record");
const VERIFY = RECORD || process.env.QA_TEST_VERIFY === "1";
const manifest = loadManifest(ROOT);
let toRun = tests;
let scopeNote = "";
if (!RECORD && process.env.QA_TEST_SCOPE_FILES) {
  let changed = [];
  try {
    changed = readFileSync(process.env.QA_TEST_SCOPE_FILES, "utf8").split("\n").filter(Boolean);
  } catch {}
  const pick = selectTests(
    tests.map((f) => relative(ROOT, f)),
    manifest,
    changed,
  );
  const chosen = new Set(pick.selected);
  toRun = tests.filter((f) => chosen.has(relative(ROOT, f)));
  scopeNote = pick.scoped
    ? `test scope: ${toRun.length} of ${tests.length} scripts — ${pick.why}`
    : `test scope: all ${tests.length} scripts — ${pick.why}`;
  console.log(scopeNote);
}
const traceDir = VERIFY ? mkdtempSync(join(tmpdir(), "qa-test-trace-")) : null;
const traceFile = (file) => join(traceDir, `${relative(ROOT, file).replace(/[^\w.-]/g, "_")}.json`);
const PRELOAD = pathToFileURL(join(ROOT, "tools/lib/test-trace-preload.mjs")).href;

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
  const started = Date.now();
  return new Promise((resolve) => {
    const args = VERIFY ? ["--import", PRELOAD, file] : [file];
    const env = VERIFY
      ? { ...process.env, QA_TRACE_OUT: traceFile(file), QA_TRACE_ROOT: ROOT }
      : process.env;
    execFile(
      process.execPath,
      args,
      { env, maxBuffer: 64 * 1024 * 1024 },
      (err, stdout, stderr) => {
        resolve({
          file,
          e: err ? { status: err.code } : null,
          output: `${stdout}${stderr}`,
          ms: Date.now() - started,
        });
      },
    );
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
    toRun.filter((f) => !isSerial(f)),
    JOBS,
  )),
  ...(await runPool(toRun.filter(isSerial), 1)),
];

/** Compare each traced test against the manifest (or rewrite it with --record). Returns failures added. */
function checkReads(done) {
  const tracked = new Set(
    execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, maxBuffer: 256 * 1024 * 1024 })
      .toString()
      .split("\0")
      .filter(Boolean),
  );
  // A directory is "tracked" when git tracks anything under it.
  const trackedDirs = new Set();
  for (const f of tracked) {
    for (let i = f.indexOf("/"); i !== -1; i = f.indexOf("/", i + 1))
      trackedDirs.add(f.slice(0, i));
  }
  const helpers = {
    isTracked: (p) => tracked.has(p) || trackedDirs.has(p),
    existsRel: (p) => existsSync(join(ROOT, p)),
  };
  const next = {};
  const drift = [];
  const unlisted = [];
  for (const { file, e } of done) {
    const rel = relative(ROOT, file);
    let trace = null;
    try {
      trace = JSON.parse(readFileSync(traceFile(file), "utf8"));
    } catch {}
    if (!trace || e?.status === SKIP_EXIT) {
      next[rel] = { wide: "no complete trace when recorded" };
      continue;
    }
    next[rel] = entryFromTrace(trace, helpers);
    const known = manifest?.tests[rel];
    if (!known) unlisted.push(rel);
    else {
      const missing = verifyReads(known, trace, helpers);
      if (missing.length) drift.push({ rel, missing });
    }
  }
  rmSync(traceDir, { recursive: true, force: true });
  if (RECORD) {
    if (done.some((r) => r.e && r.e.status !== SKIP_EXIT)) {
      console.error(
        "\nNot writing data/test-reads.json: a test failed, so its reads are incomplete.",
      );
      return 0;
    }
    const merged = { ...(manifest?.tests ?? {}) };
    for (const t of Object.keys(merged)) if (!existsSync(join(ROOT, t))) delete merged[t];
    writeFileSync(join(ROOT, MANIFEST_PATH), serializeManifest({ ...merged, ...next }));
    const wide = Object.values(next).filter((v) => v.wide).length;
    console.log(
      `\nRecorded ${MANIFEST_PATH}: ${Object.keys(next).length} tests, ${wide} always-run (opaque).`,
    );
    return 0;
  }
  if (unlisted.length) {
    console.log(
      `\n${unlisted.length} test(s) not in ${MANIFEST_PATH} (they always run; add with npm run test:reads): ${unlisted.slice(0, 5).join(", ")}${unlisted.length > 5 ? ", ..." : ""}`,
    );
  }
  if (!drift.length) return 0;
  console.error(
    `\nTEST SCOPE MANIFEST IS STALE — these tests read files ${MANIFEST_PATH} does not list,`,
  );
  console.error(
    "so a change to those files would not select them. Run `npm run test:reads` and commit it:",
  );
  for (const { rel, missing } of drift) {
    console.error(
      `  ${rel}: ${missing.slice(0, 4).join(", ")}${missing.length > 4 ? ` (+${missing.length - 4} more)` : ""}`,
    );
  }
  return drift.length;
}

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

// Where the time goes. The serial tail (SERIAL_TESTS) is invisible in the
// gate's per-check timings, and it was ~125s of build-injectors-idempotent alone.
const slowest = [...results]
  .sort((a, b) => b.ms - a.ms)
  .slice(0, 5)
  .map((r) => `${relative(ROOT, r.file)} ${(r.ms / 1000).toFixed(1)}s`);
console.log(`\nslowest test scripts: ${slowest.join(", ")}`);

console.log(`\n${toRun.length - failed - skipped.length}/${toRun.length} test scripts passed.`);
if (scopeNote) console.log(`(${scopeNote})`);
if (VERIFY) failed += checkReads(results);
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
