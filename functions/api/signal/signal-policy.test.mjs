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

// The family-practice counter's write surface. A closed vocabulary is the whole
// privacy argument: an open referrer field would make this a tracking surface.
import { normalizePracticeOpen } from "./[[path]].js";

assert.deepEqual(normalizePracticeOpen({ lessonId: "3-1", source: "week" }), {
  lessonId: "3-1",
  source: "week",
});
assert.deepEqual(normalizePracticeOpen({ lessonId: "10-6", source: "LIBRARY" }), {
  lessonId: "10-6",
  source: "library",
});
assert.deepEqual(normalizePracticeOpen({ lessonId: "3-1-flagship", source: "spotlight" }), {
  lessonId: "3-1-flagship",
  source: "spotlight",
});
for (const bad of [
  null,
  {},
  { lessonId: "3-1" },
  { lessonId: "", source: "week" },
  { lessonId: "3-1", source: "https://evil.example/referrer" },
  { lessonId: "3-1", source: "period-602" },
  { lessonId: "../../etc/passwd", source: "week" },
  { lessonId: "3-1-catchup", source: "week" },
  { lessonId: "3-1", source: "" },
]) {
  assert.equal(normalizePracticeOpen(bad), null, `accepted a bad practice beacon: ${JSON.stringify(bad)}`);
}
console.log("signal policy: family practice counter vocabulary passed");
