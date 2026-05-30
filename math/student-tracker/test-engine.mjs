// Headless audit of the Student Growth Tracker stat engine.
// Stubs the minimal DOM so the IIFE can load, then exercises the pure math.
import fs from "node:fs";

const src = fs.readFileSync(new URL("./app.js", import.meta.url), "utf8");

const store = {};
const noop = () => {};
const fakeEl = () =>
  new Proxy(
    { style: {}, classList: { toggle: noop, add: noop, remove: noop }, setAttribute: noop, appendChild: noop, addEventListener: noop, focus: noop, querySelector: () => fakeEl(), querySelectorAll: () => [] },
    { get: (t, p) => (p in t ? t[p] : noop) }
  );
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => (store[k] = String(v)),
  removeItem: (k) => delete store[k],
};
global.document = {
  readyState: "complete",
  addEventListener: noop,
  querySelector: () => fakeEl(),
  querySelectorAll: () => [],
  createElement: () => fakeEl(),
  createElementNS: () => fakeEl(),
  createTextNode: () => ({}),
  body: fakeEl(),
  hidden: false,
};
global.window = global;
global.addEventListener = noop;
global.Blob = class {};
global.URL = { createObjectURL: () => "blob:x" };

new Function(src)(); // execute IIFE in this global scope
const T = global.NeftTracker;

let pass = 0,
  fail = 0;
const approx = (a, b, e = 0.5) => Math.abs(a - b) <= e;
function check(name, cond, got) {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.log("  FAIL:", name, "=> got", got);
  }
}

const DAY = 86400000;
const dnum = (iso) => Math.floor(Date.parse(iso) / DAY);

// --- bands ---
check("band 90 Strong", T._masteryBand(90) === "Strong", T._masteryBand(90));
check("band 72 Likely", T._masteryBand(72) === "Likely Ready", T._masteryBand(72));
check("band 63 Approaching", T._masteryBand(63) === "Approaching", T._masteryBand(63));
check("band 40 Reteach", T._masteryBand(40) === "Needs Reteach", T._masteryBand(40));

// --- stdev ---
check("stdev 0 single", T._stdev([50]) === 0, T._stdev([50]));
check("stdev known", approx(T._stdev([2, 4, 4, 4, 5, 5, 7, 9]), 2, 0.01), T._stdev([2, 4, 4, 4, 5, 5, 7, 9]));

// --- regression: perfectly increasing 10pts/week (≈1.4286/day) ---
const recsUp = [
  { date: dnum("2026-05-01"), pct: 50 },
  { date: dnum("2026-05-08"), pct: 60 },
  { date: dnum("2026-05-15"), pct: 70 },
  { date: dnum("2026-05-22"), pct: 80 },
];
const regUp = T._regression(recsUp);
check("regression slope ~+10/wk", approx(regUp.slopePerWeek, 10), regUp.slopePerWeek);

const regFlat = T._regression([
  { date: dnum("2026-05-01"), pct: 70 },
  { date: dnum("2026-05-08"), pct: 70 },
]);
check("regression flat ~0", approx(regFlat.slopePerWeek, 0), regFlat.slopePerWeek);
check("regression <2 pts null", T._regression([{ date: 1, pct: 50 }]) === null, "n/a");
check("regression same-day null", T._regression([{ date: 5, pct: 50 }, { date: 5, pct: 90 }]) === null, "n/a");

// --- recency weighting: recent higher should pull weighted > simple mean ---
const now = Math.floor(Date.now() / DAY);
const recsRecency = [
  { date: now - 60, pct: 40 },
  { date: now - 1, pct: 90 },
];
const rw = T._recencyWeighted(recsRecency);
check("recency weights recent higher", rw > 65, rw);

// --- summarize end-to-end via localStorage feed ---
store["rma_gradebook"] = JSON.stringify([
  { studentName: "Ana", studentPeriod: "P1", standard: "6.NS.1", lessonTitle: "L1", pct: 45, date: "2026-05-02" },
  { studentName: "Ana", studentPeriod: "P1", standard: "6.NS.1", lessonTitle: "L2", pct: 40, date: "2026-05-20" },
  { studentName: "Bo", studentPeriod: "P1", standard: "6.RP.3", lessonTitle: "L1", pct: 95, date: "2026-05-20" },
]);
store["nt_results_log"] = JSON.stringify([
  { "Student Name": "Cy", Class: "P2", Assessment: "U2", Score: 8, Percent: 80, Standard: "6.NS.1", Skill: "Overall", "Question/Item": "10 items", Date: "2026-05-21" },
  { "Student Name": "Cy", Class: "P2", Assessment: "U2", Score: 4, Percent: 80, Standard: "6.NS.1", Skill: "Vocabulary", "Question/Item": "5 items", Date: "2026-05-21" },
]);
// Re-read feeds by re-running summarize through the exposed state path:
// simulate ingestion by calling summarize on normalized-equivalent records.
const built = T._summarize([
  { student: "Ana", period: "P1", standard: "6.NS.1", label: "L1", pct: 45, date: dnum("2026-05-02") },
  { student: "Ana", period: "P1", standard: "6.NS.1", label: "L2", pct: 40, date: dnum("2026-05-20") },
  { student: "Bo", period: "P1", standard: "6.RP.3", label: "L1", pct: 95, date: dnum("2026-05-20") },
]);
const ana = built.find((s) => s.name === "Ana");
const bo = built.find((s) => s.name === "Bo");
check("summarize produces 2 students", built.length === 2, built.length);
check("Ana low band reteach", ana.band === "Needs Reteach", ana.band);
check("Ana higher risk than Bo", ana.risk > bo.risk, ana.risk + " vs " + bo.risk);
check("Bo on track", bo.riskLevel === "On Track", bo.riskLevel);
// Readiness matrix: Reteach + not improving => At Risk (interpretable flag)
check("Ana (reteach, declining) At Risk", ana.riskLevel === "At Risk", ana.riskLevel);
const lvl = (recs) => T._summarize(recs)[0].riskLevel;
const D = (i, p) => ({ student: "Z", period: "P", standard: "6.X", label: "L", pct: p, date: dnum("2026-05-01") + i * 7 });
check("Approaching+declining => At Risk", lvl([D(0, 68), D(1, 63), D(2, 60)]) === "At Risk", lvl([D(0, 68), D(1, 63), D(2, 60)]));
check("Likely+declining => Watch", lvl([D(0, 84), D(1, 78), D(2, 72)]) === "Watch", lvl([D(0, 84), D(1, 78), D(2, 72)]));
check("Strong+flat => On Track", lvl([D(0, 90), D(1, 90), D(2, 90)]) === "On Track", lvl([D(0, 90), D(1, 90), D(2, 90)]));
check("Reteach+improving => Watch", lvl([D(0, 30), D(1, 45), D(2, 58)]) === "Watch", lvl([D(0, 30), D(1, 45), D(2, 58)]));
check("Ana per-standard present", ana.standards[0].standard === "6.NS.1", ana.standards[0]);
check("risk within 0..100", ana.risk >= 0 && ana.risk <= 100 && bo.risk >= 0 && bo.risk <= 100, ana.risk);

console.log(`\nENGINE AUDIT: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
