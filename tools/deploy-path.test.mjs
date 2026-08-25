#!/usr/bin/env node
/* =============================================================================
 * deploy-path.test.mjs — which checks actually block a production deploy.
 * -----------------------------------------------------------------------------
 * Authoritative path:
 *   ALLOW_DEPLOY=1 npm run ship -- <sha>
 *     → scripts/ship.sh cherry-picks onto origin/main
 *     → git push
 *     → .githooks/pre-push runs `npm run qa:loop`
 *     → scripts/qa-run.mjs GATE
 *
 * validate:production is a readiness REPORT. It is not the push gate.
 * A skip of validate:lesson-boot is exit 0 inside qa:loop (intentional on
 * machines without Chromium) and exit 2 from validate:production (honest).
 * ============================================================================= */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { GATE } from "../scripts/qa-run.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const prePush = readFileSync(join(ROOT, ".githooks/pre-push"), "utf8");
const ship = readFileSync(join(ROOT, "scripts/ship.sh"), "utf8");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

test("pre-push runs qa:loop", () => {
  assert.match(prePush, /npm run qa:loop/);
});

test("ship.sh pushes through the pre-push hook rather than bypassing it", () => {
  assert.match(ship, /pre-push/);
  assert.doesNotMatch(ship, /git push --no-verify/);
  assert.doesNotMatch(ship, /\bnpm run validate:production\b/);
});

test("the push GATE includes validate and does not treat validate:production as the gate", () => {
  assert.ok(
    GATE.includes("validate"),
    "dropping validate from GATE would undeploy the whole suite",
  );
  assert.ok(GATE.includes("build"));
  assert.ok(GATE.includes("validate:lesson-boot"));
  assert.ok(!GATE.includes("validate:production"));
  assert.ok(!GATE.includes("diagnose:student-access"));
  assert.ok(!GATE.includes("smoke:live"));
});

test("qa:loop and validate:production are distinct npm scripts", () => {
  assert.equal(pkg.scripts["qa:loop"], "node scripts/qa-run.mjs");
  assert.equal(pkg.scripts["validate:production"], "node scripts/validate-production.mjs");
});
