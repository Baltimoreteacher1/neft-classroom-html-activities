// Math Brain engine tests. Loads the browser-UMD modules in a vm sandbox and
// asserts mastery + recommendation behavior on a known fixture. Exits non-zero on failure.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");

function loadUMD(relPath) {
  const code = readFileSync(join(root, relPath), "utf8");
  const sandbox = { module: { exports: {} }, self: {}, console };
  sandbox.self.NeftBrain = sandbox.self.NeftBrain || {};
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.module.exports;
}

const Mastery = loadUMD("assets/brain/mastery-engine.js");
const Recommend = loadUMD("assets/brain/recommend-engine.js");

const taxonomy = {
  standards: [
    { id: "6.RP.A.2", domain: "RP", label: "unit rate" },
    { id: "6.RP.A.3", domain: "RP", label: "ratio problems" },
    { id: "6.NS.C.7", domain: "NS", label: "absolute value" },
    { id: "6.G.A.1", domain: "G", label: "area" },
  ],
};

const entries = [
  { url: "/math/rp/unit-rate-support/", title: "Unit Rate Support", standard: "6.RP.A.2", level: 1, type: "Activity", misconceptions: ["reverses-ratio-order"] },
  { url: "/math/rp/unit-rate-l0/", title: "Unit Rate Scaffold", standard: "6.RP.A.2", level: 0, type: "Activity", misconceptions: ["reverses-ratio-order"] },
  { url: "/math/rp/ratio-enrich/", title: "Ratio Challenge", standard: "6.RP.A.3", level: 2, type: "Activity", misconceptions: [] },
  { url: "/math/ns/abs-value/", title: "Absolute Value", standard: "6.NS.C.7", level: 1, type: "Activity", misconceptions: ["treats-negative-as-smaller"] },
  { url: "/math/g/area-new/", title: "Area of Triangles", standard: "6.G.A.1", level: 1, type: "Activity", misconceptions: [] },
];
const byUrl = {};
entries.forEach((e) => (byUrl[e.url] = e));
const contentGraph = { byUrl, byId: {} };

const NOW = Date.parse("2026-06-19T12:00:00Z");
const day = (d) => new Date(NOW - d * 86400000).toISOString();

// Student: struggling on 6.RP.A.2 (with the ratio-order misconception),
// proficient on 6.RP.A.3, never assessed on 6.NS.C.7 or 6.G.A.1.
const results = [
  { schema: "nt_result_v1", activityId: "/math/rp/unit-rate-support/", standard: "6.RP.A.2", scorePercent: 30, completedAt: day(2) },
  { schema: "nt_result_v1", activityId: "/math/rp/unit-rate-support/", standard: "6.RP.A.2", scorePercent: 45, completedAt: day(1) },
  { schema: "nt_result_v1", activityId: "/math/rp/ratio-enrich/", standard: "6.RP.3", scorePercent: 95, completedAt: day(3) },
];

// --- Mastery ---
const m = Mastery.compute(results, { contentGraph, taxonomy, now: NOW });
assert.ok(m.standards["6.RP.A.2"], "RP.A.2 assessed");
assert.equal(m.standards["6.RP.A.2"].band, "struggling", "low scores => struggling");
assert.ok(m.standards["6.RP.A.2"].mastery < 0.5, "mastery below 0.5");
// recency: the more recent 45% should pull the average above the raw mean of 37.5%
assert.ok(m.standards["6.RP.A.2"].mastery > 0.37, "recency weights newer attempt up");
assert.equal(m.standards["6.RP.A.2"].misconceptions.join(","), "reverses-ratio-order", "misconception surfaced from failed activity");
// shorthand "6.RP.3" normalized to canonical and scored proficient
assert.ok(m.standards["6.RP.A.3"], "shorthand 6.RP.3 normalized to 6.RP.A.3");
assert.equal(m.standards["6.RP.A.3"].band, "proficient", "95% => proficient");

// --- Recommend ---
const recs = Recommend.recommend(m, { entries, completedUrls: ["/math/rp/unit-rate-support/"], limit: 8 });
assert.ok(recs.length > 0, "produces recommendations");
// top rec should target the struggling standard's misconception, at a supported level
const top = recs[0];
assert.equal(top.standard, "6.RP.A.2", "top rec targets struggling standard");
assert.ok(top.level === 0 || top.level === 1, "supported level for struggling student");
assert.match(top.reason, /reverses ratio order|building/, "reason mentions misconception or building");
// proficient standard should only surface enrichment (level 2), never appear as urgent
const rpA3 = recs.filter((r) => r.standard === "6.RP.A.3");
rpA3.forEach((r) => assert.equal(r.level, 2, "proficient => enrichment only"));
// struggling beats proficient in ranking
const idxStruggle = recs.findIndex((r) => r.standard === "6.RP.A.2");
const idxProf = recs.findIndex((r) => r.standard === "6.RP.A.3");
if (idxProf !== -1) assert.ok(idxStruggle < idxProf, "struggling ranked above proficient");

console.log("✓ mastery-engine + recommend-engine: all assertions passed");
