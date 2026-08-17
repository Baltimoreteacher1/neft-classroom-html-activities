#!/usr/bin/env node
/* =============================================================================
 * validate-production.test.mjs — skipped required checks must not look green.
 * -----------------------------------------------------------------------------
 * validate:lesson-boot exits 0 locally when Chromium is missing, and qa:loop
 * prints PASS. That is a known local concession. This test pins the honesty
 * contract of validate:production: that skip is SKIPPED, and a SKIPPED
 * required check makes the command exit 2, not 0.
 * ============================================================================= */
import assert from "node:assert/strict";
import test from "node:test";
import { classify, overallExit, STATUSES } from "../scripts/validate-production.mjs";

test("statuses are the four the command documents", () => {
  assert.deepEqual(STATUSES, ["PASS", "FAIL", "SKIPPED", "NOT AVAILABLE IN THIS ENVIRONMENT"]);
});

test("lesson-boot skip is SKIPPED even when the process exits 0", () => {
  const status = classify({
    name: "validate:lesson-boot",
    exitCode: 0,
    stdout: "",
    stderr: "⚠️  Could not launch Chromium — render smoke SKIPPED (browser missing).",
  });
  assert.equal(status, "SKIPPED");
});

test("an incomplete local build skip is SKIPPED, not PASS", () => {
  assert.equal(
    classify({
      name: "validate:lesson-boot",
      exitCode: 0,
      stdout: "⚠️  Local build is INCOMPLETE — render smoke SKIPPED (not a page defect).\n",
      stderr: "",
    }),
    "SKIPPED",
  );
});

test("a real lesson-boot pass is PASS", () => {
  assert.equal(
    classify({
      name: "validate:lesson-boot",
      exitCode: 0,
      stdout: "16/16 pages rendered\n",
      stderr: "",
    }),
    "PASS",
  );
});

test("a real lesson-boot failure is FAIL", () => {
  assert.equal(
    classify({
      name: "validate:lesson-boot",
      exitCode: 1,
      stdout: "FAIL /lessons/1-1/ blank shell\n",
      stderr: "",
    }),
    "FAIL",
  );
});

test("smoke:live network errors are NOT AVAILABLE, not FAIL", () => {
  assert.equal(
    classify({
      name: "smoke:live",
      exitCode: 1,
      stdout: "",
      stderr: "fetch failed: getaddrinfo ENOTFOUND eduwonderlab.com",
    }),
    "NOT AVAILABLE IN THIS ENVIRONMENT",
  );
});

test("smoke:live 500 is FAIL — production answered, and it was wrong", () => {
  assert.equal(
    classify({
      name: "smoke:live",
      exitCode: 1,
      stdout: "",
      stderr: "✗ PRODUCTION IS DEGRADED — 2 check(s) failed.",
    }),
    "FAIL",
  );
});

test("overallExit: SKIPPED required check is not green", () => {
  assert.equal(
    overallExit([
      { name: "validate", required: true, status: "PASS" },
      { name: "validate:lesson-boot", required: true, status: "SKIPPED" },
    ]),
    2,
  );
});

test("overallExit: FAIL beats SKIPPED", () => {
  assert.equal(
    overallExit([
      { name: "validate", required: true, status: "FAIL" },
      { name: "validate:lesson-boot", required: true, status: "SKIPPED" },
    ]),
    1,
  );
});

test("overallExit: optional NOT AVAILABLE does not fail the run", () => {
  assert.equal(
    overallExit([
      { name: "validate", required: true, status: "PASS" },
      { name: "validate:lesson-boot", required: true, status: "PASS" },
      { name: "smoke:live", required: false, status: "NOT AVAILABLE IN THIS ENVIRONMENT" },
    ]),
    0,
  );
});
