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

/*
 * The gate must not depend on a per-clone setting.
 *
 * .githooks/pre-push only fires when `core.hooksPath` points at .githooks, and
 * that is set by `npm run qa:install-hooks` on each machine — a clone does not
 * carry it. This clone was found with core.hooksPath unset, meaning every push
 * it had made to date went through no gate whatsoever, silently. So ship.sh
 * runs the loop itself, against the worktree it assembled.
 */
test("ship.sh runs the QA loop itself, not only via the hook", () => {
  assert.match(
    ship,
    /npm run qa:loop/,
    "ship.sh must run the QA gate on the deploy path; the pre-push hook is a " +
      "per-clone setting and cannot be the only gate",
  );
});

test("ship.sh gates the tree it is shipping, not the local working tree", () => {
  const gateLine = ship.split("\n").find((l) => l.includes("npm run qa:loop"));
  assert.ok(gateLine, "no qa:loop invocation found in ship.sh");
  assert.match(
    gateLine,
    /\$WT/,
    'the QA loop must run in "$WT" (the assembled deploy worktree). Running it ' +
      "in the local tree gates whatever branch happens to be checked out, with " +
      "whatever uncommitted edits are in flight — not what is about to go live",
  );
});

test("a failing QA gate stops the ship before the push", () => {
  const lines = ship.split("\n");
  const gateAt = lines.findIndex((l) => l.includes("npm run qa:loop"));
  const pushAt = lines.findIndex((l) => /git -C "\$WT" push origin HEAD:main/.test(l));
  assert.ok(gateAt > -1 && pushAt > -1, "expected both a qa:loop run and a push");
  assert.ok(
    gateAt < pushAt,
    "the QA gate must run BEFORE the push, or it is a report rather than a gate",
  );
  const between = lines.slice(gateAt, pushAt).join("\n");
  assert.match(
    between,
    /fail "QA gate failed/,
    "a failing QA gate must abort the ship, not merely print",
  );
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
