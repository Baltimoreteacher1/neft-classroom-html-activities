// "My week" on the Student Hub (access-practice-lab/src/engagement.js myWeek): counts only, from what the device records.
// Practice days against the learner's own goal, the four skills this week, and one next skill.
import assert from "node:assert/strict";
import { test } from "node:test";

const mem = new Map();
globalThis.localStorage ??= {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  key: (i) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size;
  },
};
const { myWeek } = await import("../access-practice-lab/src/engagement.js");

const FRI = new Date("2026-11-27T15:00:00"); // a Friday; the week starts Monday 2026-11-23
const at = (iso) => new Date(`${iso}T10:00:00`).toISOString();
const rec = (band, domain, dates, extra = {}) => ({
  band,
  domain,
  level: "B",
  record: {
    results: Object.fromEntries(
      dates.map((d, i) => [`${domain}${i}`, { date: at(d), ok: true, ...extra }]),
    ),
  },
});

test("the week runs Monday to Sunday and marks practiced days, today and the future", () => {
  const w = myWeek({ today: FRI, records: [], days: ["2026-11-23", "2026-11-27", "2026-11-20"] });
  assert.equal(w.start, "2026-11-23");
  assert.deepEqual(
    w.week.map((d) => d.iso),
    [
      "2026-11-23",
      "2026-11-24",
      "2026-11-25",
      "2026-11-26",
      "2026-11-27",
      "2026-11-28",
      "2026-11-29",
    ],
  );
  assert.deepEqual(
    w.week.map((d) => d.done),
    [true, false, false, false, true, false, false],
  );
  assert.equal(w.week[4].today, true);
  assert.equal(w.week[5].future, true);
  assert.equal(w.done, 2, "last week's practice does not count");
});

test("goal comes from the learner's own setting, defaulting to 3", () => {
  assert.equal(myWeek({ today: FRI, records: [], days: [] }).goal, 3);
  const w = myWeek({
    today: FRI,
    records: [],
    days: ["2026-11-24", "2026-11-25"],
    prefs: { engagement: { weeklyGoal: 4 } },
  });
  assert.equal(w.goal, 4);
  assert.equal(w.reached, false);
  assert.equal(
    myWeek({ today: FRI, records: [], days: ["2026-11-24", "2026-11-25", "2026-11-26"] }).reached,
    true,
  );
});

test("skills count this week's practice in the learner's band only, and skip non-practice results", () => {
  const records = [
    rec("6-8", "Reading", ["2026-11-24", "2026-11-26"]),
    rec("6-8", "Listening", ["2026-11-20"]),
    rec("3-5", "Writing", ["2026-11-25"]),
    rec("6-8", "Speaking", ["2026-11-25"], { meaningful: false }),
  ];
  const w = myWeek({ today: FRI, records, days: [], bands: ["6-8"] });
  assert.deepEqual(w.skills, { Listening: 0, Reading: 2, Speaking: 0, Writing: 0 });
});

test("the next skill is one not touched this week; none once all four are even", () => {
  const two = [rec("6-8", "Reading", ["2026-11-24"]), rec("6-8", "Listening", ["2026-11-24"])];
  assert.equal(myWeek({ today: FRI, records: two, days: [] }).next, "Speaking");
  assert.equal(myWeek({ today: FRI, records: [], days: [] }).next, "Listening");
  const all = ["Listening", "Reading", "Speaking", "Writing"].map((d) =>
    rec("6-8", d, ["2026-11-24"]),
  );
  assert.equal(myWeek({ today: FRI, records: all, days: [] }).next, "");
  all.push(rec("6-8", "Reading", ["2026-11-25"]));
  assert.notEqual(
    myWeek({ today: FRI, records: all, days: [] }).next,
    "Reading",
    "the busiest skill is never the suggestion",
  );
});
