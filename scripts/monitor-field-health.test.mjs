import assert from "node:assert/strict";
import { evaluateFieldStatus } from "./monitor-field-health.mjs";

assert.equal(evaluateFieldStatus(null).ok, false);
assert.equal(evaluateFieldStatus({ backend: "d1" }).ok, false);

const healthy = evaluateFieldStatus({
  backend: "d1",
  ok: true,
  clientErrors: { hits: 1, views: 100, ratePercent: 1, status: "good" },
  vitals: [{ metric: "LCP", device: "mobile", samples: 40, goodPercent: 90, status: "good" }],
});
assert.equal(healthy.ok, true);
assert.match(healthy.lines.join("\n"), /90% good/);

const alert = evaluateFieldStatus({
  backend: "d1",
  ok: false,
  clientErrors: { hits: 20, views: 100, ratePercent: 20, status: "alert" },
  vitals: [],
});
assert.equal(alert.ok, false);
assert.match(alert.lines.join("\n"), /awaiting field samples/);

console.log("field health monitor: payload validation and alert handling passed");
