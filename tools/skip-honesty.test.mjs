#!/usr/bin/env node
/**
 * skip-honesty.test.mjs — a check that did not run may never report PASS.
 *
 * `validate:lesson-boot` exited 0 when no Chromium was available and qa-run
 * printed `PASS validate:lesson-boot 4.6s` — the same line 16 genuinely
 * rendered pages produce. That is the failure shape this repo keeps writing
 * gates against (the injector target list that covered nothing, the orphaned
 * project pages, the stamp that matched no file), and it had reached the gate
 * runner itself.
 *
 * This test pins the fix in three places, because the protocol is only as good
 * as its weakest participant:
 *
 *   1. the CODE — exit 3 means SKIP, and qa-run's classifier says so;
 *   2. the RUNNERS — qa-run and run-tests both name skipped checks and both
 *      fail in CI;
 *   3. the SCRIPTS — a static ratchet: no gate script may exit 0 next to
 *      skip wording. That is the pattern itself, and it must not come back.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { classifyResult } from "../scripts/qa-run.mjs";
import { SKIP_EXIT, skipExit } from "./lib/skip-exit.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

test("SKIP is its own exit code, distinct from pass and fail", () => {
  assert.equal(SKIP_EXIT, 3);
  assert.notEqual(SKIP_EXIT, 0);
  assert.notEqual(SKIP_EXIT, 1);
});

test("skipExit is fatal in CI and non-blocking locally", () => {
  const had = process.env.CI;
  try {
    process.env.CI = "";
    delete process.env.CI;
    assert.equal(skipExit("no browser"), SKIP_EXIT, "a local skip must not block the push");
    process.env.CI = "1";
    assert.equal(skipExit("no browser"), 1, "CI must treat a skip as a failure");
  } finally {
    if (had === undefined) delete process.env.CI;
    else process.env.CI = had;
  }
});

test("qa-run classifies a skip as SKIP, never PASS", () => {
  assert.deepEqual(classifyResult(null), {
    ok: true,
    skipped: false,
    timedOut: false,
    status: "PASS",
  });
  assert.deepEqual(classifyResult({ code: SKIP_EXIT }), {
    ok: false,
    skipped: true,
    timedOut: false,
    status: "SKIP",
  });
  assert.deepEqual(classifyResult({ code: 1 }), {
    ok: false,
    skipped: false,
    timedOut: false,
    status: "FAIL",
  });
});

test("a killed check is a TIMEOUT and a FAILURE, never a skip", () => {
  // The fourth outcome, added with the per-check timeout. It is pinned here
  // rather than beside the timeout because the danger is the same one this file
  // exists for: a check that verified nothing reporting as though it had.
  //
  // The ordering matters and is the reason this assertion is specific about a
  // killed child that ALSO carries the skip code. `execFile` reports the signal
  // it killed with, not the check's own exit status, so a hung check tested
  // against SKIP_EXIT first could land on "did not run" — which does not block
  // a push locally — instead of stopping it.
  assert.deepEqual(classifyResult({ killed: true, code: null }), {
    ok: false,
    skipped: false,
    timedOut: true,
    status: "TIMEOUT",
  });
  assert.deepEqual(
    classifyResult({ killed: true, code: SKIP_EXIT }),
    { ok: false, skipped: false, timedOut: true, status: "TIMEOUT" },
    "a killed check must not be rescued into SKIP by the exit code it happens to carry",
  );
});

test("qa-run names every timed-out check and treats it as a failure", () => {
  const src = read("scripts/qa-run.mjs");
  assert.match(src, /timeout: TIMEOUT_MS/, "the child process must actually be given a timeout");
  assert.match(
    src,
    /TIMED OUT \(killed, verified nothing\): \$\{timedOut\.join/,
    "the summary must list timed-out checks by name",
  );
});

test("qa-run names every skipped check in its exit summary", () => {
  const src = read("scripts/qa-run.mjs");
  assert.match(
    src,
    /SKIPPED \(verified NOTHING\): \$\{didNotRun\.join/,
    "the summary must list skipped checks by name, not just count them",
  );
  assert.match(src, /didNotRun\.length && process\.env\.CI/, "CI must fail on any skipped check");
});

test("the test runner reports skipped tests and refuses an empty discovery walk", () => {
  const src = read("tools/run-tests.mjs");
  assert.match(src, /e\?\.status === SKIP_EXIT/, "run-tests must recognise the skip code");
  assert.match(src, /SKIPPED \(verified nothing\)/, "skipped tests must be named");
  // Finding zero tests is a broken walk, not a clean suite.
  assert.doesNotMatch(
    src,
    /No test scripts found\.[\s\S]{0,80}process\.exit\(0\)/,
    "an empty test discovery must not exit 0",
  );
});

test("every sweeping gate asserts a non-empty subject before it sweeps", () => {
  // The SECOND shape of the same lie. A gate that walks a directory, finds
  // nothing, finds no problems in that nothing, and prints PASS has verified
  // exactly as much as one that skipped — and reads greener. This pins the
  // conversion so a new sweeping gate cannot land without the guard.
  //
  // FAIL, not SKIP: these files are in the repo, so discovering none of them is
  // a broken walk, not a missing environment.
  const SWEEPING_GATES = [
    "scripts/audit-curriculum.mjs",
    "scripts/audit-dead-code.mjs",
    "scripts/audit-duplicate-assets.mjs",
    "scripts/audit-homework-alignment.mjs",
    "scripts/curriculum-scope-sequence.mjs",
    "scripts/validate-ccss.mjs",
    "tools/audit-interaction-depth.mjs",
    "tools/audit-interaction-quality.mjs",
    "tools/audit-save-resume-integration.js",
    "tools/canvas/build-command-center.mjs",
    "tools/validate-css-integrity.mjs",
    "tools/validate-gate-coverage.mjs",
    "tools/validate-js-syntax.mjs",
    "tools/validate-preunit-project.mjs",
    "tools/validate-secrets.mjs",
    "tools/validate-static-site.mjs",
    "tools/validate-uifr.mjs",
  ];
  const missing = SWEEPING_GATES.filter((f) => !read(f).includes("assertNonEmpty("));
  assert.deepEqual(
    missing,
    [],
    `these gates sweep a discovered list without asserting it is non-empty:\n  ${missing.join("\n  ")}`,
  );
});

test("assertNonEmpty fails rather than skips on an empty sweep", () => {
  const src = read("tools/lib/non-empty.mjs");
  assert.match(src, /process\.exit\(1\)/, "an empty sweep must FAIL, not skip");
  assert.doesNotMatch(
    src,
    /SKIP_EXIT|skipExit/,
    "an empty sweep is broken discovery, never a skip",
  );
});
test("no gate script exits 0 on a path that skipped its work", () => {
  // The ratchet. `git ls-files` rather than a hand list, so a new gate is
  // covered the day it lands.
  const files = execFileSync("git", ["ls-files", "tools", "scripts"], {
    cwd: ROOT,
    encoding: "utf8",
  })
    .split("\n")
    .filter((f) => /\.(mjs|js)$/.test(f));
  const skipWords =
    /\b(SKIP|skipped|skipping|not installed|unavailable|could not (?:reach|launch)|offline|no browser)\b/i;
  const offenders = [];
  for (const f of files) {
    const lines = read(f).split("\n");
    lines.forEach((line, i) => {
      if (!/process\.exit\(0\)/.test(line)) return;
      const ctx = lines.slice(Math.max(0, i - 6), i + 1).join("\n");
      // A file that routes through skipExit() has already been converted; the
      // exit(0) sites left in it are genuine passes.
      if (/skipExit\(/.test(ctx)) return;
      if (skipWords.test(ctx)) offenders.push(`${f}:${i + 1}`);
    });
  }
  assert.deepEqual(
    offenders,
    [],
    `these exit 0 after skipping their work — use skipExit() from tools/lib/skip-exit.mjs:\n  ${offenders.join("\n  ")}`,
  );
});
