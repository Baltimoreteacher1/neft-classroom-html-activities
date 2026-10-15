/* Daily Boost core: Leitner boxes, due-first planning, history-aware fresh picks, day streaks. Pure, no DOM. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const ctx = {};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync("assets/studio/boost-core.js", "utf8"), ctx);
const C = ctx.StudioBoostCore;
const catalog = [
  { g: "a", title: "A", lesson: "2-1", unit: 2 },
  { g: "b", title: "B", lesson: "2-2", unit: 2 },
  { g: "c", title: "C", lesson: "3-1", unit: 3 },
  { g: "d", title: "D", lesson: "5-1", unit: 5 },
  { g: "e", title: "E", lesson: "7-1", unit: 7 },
];
const seeded = (seed) => () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const T = "2026-10-15";

// dates
assert.equal(C.addDays("2026-10-31", 1), "2026-11-01");
assert.equal(C.addDays("2026-03-01", -1), "2026-02-28");
assert.equal(C.levelFor(0), 2);
assert.equal(C.levelFor(3), 3);
assert.equal(C.levelFor(5), 4);

// record: clean climbs and pushes out; unclean drops to box 1, due tomorrow
{
  const s = {};
  C.record(s, "a", true, T, "2-1");
  assert.deepEqual([s.skills.a.box, s.skills.a.due], [1, "2026-10-16"]);
  C.record(s, "a", true, T);
  C.record(s, "a", true, T);
  assert.deepEqual([s.skills.a.box, s.skills.a.due], [3, "2026-10-22"], "box 3 is a week out");
  C.record(s, "a", false, T);
  assert.deepEqual([s.skills.a.box, s.skills.a.due], [1, "2026-10-16"], "a miss drops to box 1");
  for (let i = 0; i < 9; i++) C.record(s, "a", true, T);
  assert.equal(s.skills.a.box, 5, "capped at box 5");
  assert.equal(s.skills.a.lesson, "2-1", "the lesson it came from is remembered");
  C.record(s, "a", true, T, "0-0");
  assert.equal(s.skills.a.lesson, "2-1", "the boost page does not overwrite the real lesson");
}
// plan: due skills come first and appear exactly once
{
  const s = {
    skills: {
      c: { box: 1, due: "2026-10-14", seen: 2, lesson: "3-1" },
      d: { box: 4, due: "2026-12-01", seen: 3, lesson: "5-1" },
    },
  };
  const p = C.plan(s, catalog, T, seeded(1), 3, ["2-1"]);
  assert.equal(p.length, 3);
  assert.equal(p[0].g, "c", "the due skill leads the run");
  assert.equal(new Set(p.map((x) => x.g)).size, 3, "no skill twice");
  assert.equal(p[0].level, C.levelFor(1));
}
// plan: fresh skills prefer lessons the student has opened
{
  const p = C.plan({ skills: {} }, catalog, T, seeded(2), 2, ["5-1", "7-1"]);
  assert.deepEqual(new Set(p.map((x) => x.g)), new Set(["d", "e"]));
}
// plan: no history at all starts gently (units 2-3)
{
  const p = C.plan({ skills: {} }, catalog, T, seeded(3), 3, []);
  assert.ok(
    p.every((x) => ["a", "b", "c"].includes(x.g)),
    "a first Boost stays in the early units",
  );
}
// plan never exceeds the catalog and always returns n when it can
{
  assert.equal(
    C.plan({ skills: {} }, catalog, T, seeded(4), 10, []).length,
    3 + 0 || 3,
    "only early units on day one",
  );
  const big = {
    skills: Object.fromEntries(
      catalog.map((c) => [c.g, { box: 2, due: "2099-01-01", seen: 1, lesson: c.lesson }]),
    ),
  };
  assert.equal(
    C.plan(big, catalog, T, seeded(5), 4).length,
    4,
    "fills from the weakest when nothing is due",
  );
}
// streak
assert.equal(C.streak(["2026-10-13", "2026-10-14", "2026-10-15"], T), 3);
assert.equal(
  C.streak(["2026-10-13", "2026-10-14"], T),
  2,
  "yesterday still counts until today is missed",
);
assert.equal(C.streak(["2026-10-10"], T), 0);
console.log(
  "studio-boost: Leitner boxes, due-first plan, history-aware fresh picks and streaks behave.",
);
