// Feature entitlement foundation (access-practice-lab/src/platform/entitlements.js). Pins the promise made to teachers
// and families: free access is preserved, nothing is gated, and no payment or advertising code exists here.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  canUse,
  ENTITLEMENTS,
  TIERS,
  tierOf,
} from "../access-practice-lab/src/platform/entitlements.js";

const SRC = fileURLToPath(
  new URL("../access-practice-lab/src/platform/entitlements.js", import.meta.url),
);
const sitemap = readFileSync(
  fileURLToPath(new URL("../access-practice-lab/src/sitemap.js", import.meta.url)),
  "utf8",
);
const featureIds = new Set([...sitemap.matchAll(/\bid:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]));

test("nothing is enforced, every feature is free and every call returns yes", () => {
  assert.equal(ENTITLEMENTS.enforced, false);
  assert.equal(ENTITLEMENTS.defaultTier, "free");
  assert.deepEqual({ ...ENTITLEMENTS.overrides }, {});
  for (const id of featureIds) {
    assert.equal(tierOf(id), "free");
    assert.equal(canUse(id), true, id);
  }
  assert.equal(canUse("a-feature-that-does-not-exist"), true);
});

test("every override names a real feature and a known tier (checked against a trial config)", () => {
  const trial = { ...ENTITLEMENTS, overrides: { demand: "school" } };
  assert.ok(featureIds.has("demand"));
  assert.ok(TIERS.includes(trial.overrides.demand));
  assert.equal(canUse("demand", "free", trial), true, "not enforced: still open");
  const on = { ...trial, enforced: true };
  assert.equal(canUse("demand", "free", on), false);
  assert.equal(canUse("demand", "school", on), true);
  assert.equal(canUse("teach-back", "free", on), true, "features without an override stay free");
  for (const id of Object.keys(ENTITLEMENTS.overrides))
    assert.ok(featureIds.has(id), `unknown feature ${id}`);
});

test("no payment, subscription, advertising or tracking code lives in the entitlement module", () => {
  const code = readFileSync(SRC, "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(
    code,
    /stripe|paypal|checkout|paywall|subscribe|price|payment|advert|analytics|gtag|fetch\(/i,
  );
});
