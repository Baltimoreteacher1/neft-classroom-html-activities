import assert from "node:assert/strict";
import { assessFieldHealth, vitalRating } from "./[[path]].js";

assert.equal(vitalRating("LCP", 2500), "good");
assert.equal(vitalRating("LCP", 2500.1), "needs-improvement");
assert.equal(vitalRating("LCP", 4000.1), "poor");
assert.equal(vitalRating("INP", 200), "good");
assert.equal(vitalRating("INP", 500), "needs-improvement");
assert.equal(vitalRating("CLS", 0.1), "good");
assert.equal(vitalRating("CLS", 0.25), "needs-improvement");
assert.equal(vitalRating("CLS", 0.251), "poor");
assert.equal(vitalRating("FID", 1), "");
assert.equal(vitalRating("LCP", -1), "");

const healthy = assessFieldHealth({
  errors: 1,
  views: 100,
  vitals: [{ metric: "LCP", device: "mobile", samples: 40, good: 34 }],
});
assert.equal(healthy.ok, true);
assert.equal(healthy.clientErrors.ratePercent, 1);
assert.equal(healthy.vitals[0].goodPercent, 85);
assert.equal(healthy.vitals[0].status, "good");

const unhealthy = assessFieldHealth({
  errors: 12,
  views: 100,
  vitals: [{ metric: "INP", device: "desktop", samples: 40, good: 20 }],
});
assert.equal(unhealthy.ok, false);
assert.equal(unhealthy.clientErrors.status, "alert");
assert.equal(unhealthy.vitals[0].status, "alert");

const sparse = assessFieldHealth({
  vitals: [{ metric: "CLS", device: "tablet", samples: 19, good: 0 }],
});
assert.equal(sparse.ok, true);
assert.equal(sparse.vitals[0].status, "insufficient-data");

console.log("signal policy: Core Web Vitals thresholds and health alerts passed");
