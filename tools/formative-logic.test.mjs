// Formative engine, pure logic: the exit ticket and rubric for EVERY seed unit, the error catalog, distribution
// math, the dominant-misconception pick (deterministic tie-break), top-3, the weekly trend, and CSV safety.
// Negative controls are inline: a made-up error id is not in any catalog; a formula cell is neutralised.
import assert from "node:assert/strict";
import test from "node:test";
import { BCPSS_UNITS } from "../data/bcpss-curriculum-seed.mjs";
import { getUnitDetail } from "../functions/_lib/bcpss/db.js";
import { catalogIds, errorCatalog, reteachActivity } from "../shared/formative/catalog.js";
import {
  LEVELS,
  recentWeeks,
  ticketIdFor,
  unitOfTicket,
  weekStart,
} from "../shared/formative/constants.js";
import {
  csvCell,
  dominantMisconception,
  errorTrend,
  scoreRows,
  toCsv,
  topErrors,
  trendRows,
} from "../shared/formative/insights.js";
import {
  agreement,
  distribution,
  emptyScores,
  scoresFromRows,
  tap,
} from "../shared/formative/scoring.js";
import { buildTicket } from "../shared/formative/ticket.js";

const roster = (n) =>
  Array.from({ length: n }, (_, i) => ({
    studentId: `s${String(i).padStart(10, "0")}`,
    alias: `Star ${i + 1}`,
  }));
const CATALOG = [
  { id: "misc:primary", kind: "misc", label: "primary", example: "", redirect: "r" },
  { id: "doctor:a", kind: "doctor", label: "a", example: "", redirect: "r" },
  { id: "doctor:b", kind: "doctor", label: "b", example: "", redirect: "r" },
];
const tally = (type, count, week = "2026-11-23") => ({ errorType: type, weekStart: week, count });

test("every seed unit has an exit ticket with all three rubric levels and a non-empty error catalog", async () => {
  assert.equal(BCPSS_UNITS.length, 162);
  for (const u of BCPSS_UNITS) {
    const { detail } = await getUnitDetail({}, u.id);
    const ticket = buildTicket(detail);
    assert.ok(ticket, `${u.id}: no exit ticket`);
    for (const l of LEVELS) assert.ok(ticket.rubric[l], `${u.id}: rubric ${l} is empty`);
    assert.equal(ticket.ticketId, ticketIdFor(u.id));
    assert.equal(unitOfTicket(ticket.ticketId), u.id);
    const catalog = errorCatalog(detail);
    assert.equal(
      catalog[0].id,
      "misc:primary",
      `${u.id}: the unit misconception must lead the catalog`,
    );
    assert.equal(
      new Set(catalog.map((e) => e.id)).size,
      catalog.length,
      `${u.id}: duplicate catalog id`,
    );
    for (const e of catalog) {
      assert.ok(e.label && e.redirect, `${u.id} ${e.id}: label and redirect are required`);
      assert.ok(reteachActivity(e, detail), `${u.id} ${e.id}: no reteach activity`);
    }
  }
});

test("negative control: a unit with no rubric has no ticket, and an id outside the catalog is unknown", async () => {
  const { detail } = await getUnitDetail({}, "g6-ela-u1");
  const bare = structuredClone(detail);
  bare.connections[0].language_exit_ticket_json = { prompt: "Explain." };
  assert.equal(buildTicket(bare), null);
  assert.equal(catalogIds(errorCatalog(detail)).has("frame:maria"), false);
  assert.equal(catalogIds(errorCatalog(detail)).has("misc:primary"), true);
});

test("tap sets, replaces and clears; scorers stay separate", () => {
  let s = emptyScores();
  let r = tap(s, "s1", "emerging");
  assert.deepEqual([r.op, r.level, r.scores.teacher.s1], ["set", "emerging", "emerging"]);
  r = tap(r.scores, "s1", "proficient");
  assert.equal(r.scores.teacher.s1, "proficient");
  r = tap(r.scores, "s1", "proficient");
  assert.deepEqual([r.op, r.level, r.scores.teacher.s1], ["clear", null, undefined]);
  s = tap(emptyScores(), "s1", "developing", "self").scores;
  assert.deepEqual([s.teacher.s1, s.self.s1], [undefined, "developing"]);
  assert.throws(() => tap(s, "s1", "expert"), RangeError);
  assert.equal(
    emptyScores().teacher !== emptyScores().teacher,
    true,
    "no shared state between score sets",
  );
});

test("distribution: counts, only roster students count, percents always add to 100", () => {
  const rows = roster(28);
  const levels = {};
  rows.slice(0, 7).forEach((s) => (levels[s.studentId] = "emerging"));
  rows.slice(7, 19).forEach((s) => (levels[s.studentId] = "developing"));
  rows.slice(19, 28).forEach((s) => (levels[s.studentId] = "proficient"));
  levels.s9999999999 = "emerging"; // left the class
  const d = distribution(rows, levels);
  assert.deepEqual(d.counts, { emerging: 7, developing: 12, proficient: 9 });
  assert.deepEqual([d.scored, d.total, d.unscored], [28, 28, 0]);
  assert.equal(
    Object.values(d.percent).reduce((a, b) => a + b, 0),
    100,
  );
  assert.deepEqual(d.percent, { emerging: 25, developing: 43, proficient: 32 });
  for (let n = 1; n <= 60; n++) {
    for (const split of [
      [1, 1, 1],
      [2, 1, 0],
      [1, 0, 0],
      [5, 3, 3],
    ]) {
      const lv = {};
      let i = 0;
      LEVELS.forEach((l, k) => {
        for (let j = 0; j < split[k] * Math.ceil(n / 10); j++) lv[`s${i++}`] = l;
      });
      const ids = Object.keys(lv).map((studentId) => ({ studentId }));
      const sum = Object.values(distribution(ids, lv).percent).reduce((a, b) => a + b, 0);
      assert.equal(sum, ids.length ? 100 : 0);
    }
  }
  assert.deepEqual(distribution([], {}).percent, { emerging: 0, developing: 0, proficient: 0 });
  assert.equal(distribution(rows, {}).unscored, 28);
});

test("scoresFromRows drops invalid rows; agreement counts only students scored both ways", () => {
  const s = scoresFromRows([
    { studentId: "a", level: "emerging", by: "teacher" },
    { studentId: "a", level: "emerging", by: "self" },
    { studentId: "b", level: "proficient", by: "teacher" },
    { studentId: "b", level: "developing", by: "self" },
    { studentId: "c", level: "developing", by: "self" },
    { studentId: "d", level: "bogus", by: "teacher" },
    { studentId: "e", level: "emerging", by: "admin" },
  ]);
  assert.deepEqual(agreement(s), { both: 2, same: 1 });
  assert.equal(s.teacher.d, undefined);
});

test("dominant misconception: nothing scored, all proficient, default, tallies, and a deterministic tie-break", () => {
  const rows = roster(10);
  const dist = (levels) => distribution(rows, levels);
  const half = Object.fromEntries(
    rows.map((s, i) => [s.studentId, i < 5 ? "emerging" : "proficient"]),
  );
  assert.equal(dominantMisconception({ catalog: CATALOG, rows: [], dist: dist({}) }), null);
  const allP = dominantMisconception({
    catalog: CATALOG,
    rows: [tally("doctor:a", 9)],
    dist: dist(Object.fromEntries(rows.map((s) => [s.studentId, "proficient"]))),
  });
  assert.deepEqual([allP.needsReteach, allP.entry], [false, null]);
  const dflt = dominantMisconception({ catalog: CATALOG, rows: [], dist: dist(half) });
  assert.deepEqual(
    [dflt.entry.id, dflt.basis, dflt.struggling],
    ["misc:primary", "unit-default", 5],
  );
  const byTally = dominantMisconception({
    catalog: CATALOG,
    rows: [tally("doctor:b", 4), tally("doctor:a", 2), tally("doctor:b", 1, "2026-11-16")],
    dist: dist(half),
  });
  assert.deepEqual([byTally.entry.id, byTally.count, byTally.basis], ["doctor:b", 5, "tallies"]);
  // Tie: catalog order decides (doctor:a before doctor:b), whatever order the rows arrive in.
  const tie = [tally("doctor:b", 3), tally("doctor:a", 3)];
  for (const r of [tie, [...tie].reverse()])
    assert.equal(
      dominantMisconception({ catalog: CATALOG, rows: r, dist: dist(half) }).entry.id,
      "doctor:a",
    );
  // A tie with the unit's own misconception goes to the unit's misconception.
  const withPrimary = [tally("doctor:a", 2), tally("misc:primary", 2)];
  assert.equal(
    dominantMisconception({ catalog: CATALOG, rows: withPrimary, dist: dist(half) }).entry.id,
    "misc:primary",
  );
  // Tallies for ids not in the catalog are ignored.
  assert.equal(
    dominantMisconception({ catalog: CATALOG, rows: [tally("frame:maria", 99)], dist: dist(half) })
      .basis,
    "unit-default",
  );
});

test("top 3: count, then catalog order; share adds up; zero and unknown rows are dropped", () => {
  const catalog = [
    ...CATALOG,
    { id: "frame:x", kind: "frame", label: "x", example: "", redirect: "r" },
  ];
  const rows = [
    tally("doctor:b", 5),
    tally("doctor:a", 5),
    tally("frame:x", 2),
    tally("misc:primary", 1),
    tally("doctor:a", 0, "2026-11-16"),
    tally("nope", 50),
  ];
  const top = topErrors(rows, catalog);
  assert.deepEqual(
    top.map((t) => [t.entry.id, t.count]),
    [
      ["doctor:a", 5],
      ["doctor:b", 5],
      ["frame:x", 2],
    ],
  );
  assert.equal(top.reduce((s, t) => s + t.share, 0) <= 100, true);
  assert.equal(topErrors([], catalog).length, 0);
});

test("weeks: Monday start in UTC, zero-filled oldest-first spans", () => {
  assert.equal(weekStart(Date.UTC(2026, 10, 25, 12)), "2026-11-23"); // Wednesday
  assert.equal(weekStart(Date.UTC(2026, 10, 23)), "2026-11-23"); // Monday itself
  assert.equal(weekStart(Date.UTC(2026, 10, 22, 23, 59)), "2026-11-16"); // Sunday belongs to the week before
  const weeks = recentWeeks(Date.UTC(2026, 10, 25), 4);
  assert.deepEqual(weeks, ["2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23"]);
});

test("trend: top types over weeks with direction up, down, flat and new", () => {
  const now = Date.UTC(2026, 10, 25);
  const rows = [
    tally("doctor:a", 2, "2026-11-09"),
    tally("doctor:a", 4, "2026-11-16"),
    tally("doctor:a", 6, "2026-11-23"), // up
    tally("doctor:b", 5, "2026-11-16"),
    tally("doctor:b", 1, "2026-11-23"), // down
    tally("misc:primary", 3, "2026-11-23"), // new
  ];
  const t = errorTrend(rows, CATALOG, now, { weeks: 4 });
  const by = Object.fromEntries(t.series.map((s) => [s.entry.id, s]));
  assert.deepEqual(by["doctor:a"].counts, [0, 2, 4, 6]);
  assert.deepEqual(
    [by["doctor:a"].direction, by["doctor:b"].direction, by["misc:primary"].direction],
    ["up", "down", "new"],
  );
  const flat = errorTrend(
    [tally("doctor:a", 2, "2026-11-16"), tally("doctor:a", 2, "2026-11-23")],
    CATALOG,
    now,
    { weeks: 4 },
  );
  assert.equal(flat.series[0].direction, "flat");
});

test("CSV: quoting, formula neutralising, header and rows", () => {
  assert.equal(csvCell('say "hi", ok'), '"say ""hi"", ok"');
  for (const bad of ["=1+1", "+SUM(A1)", "-2", "@cmd", "\tx"])
    assert.ok(csvCell(bad).startsWith("'"), bad); // negative control: raw would run as a formula
  assert.equal(csvCell("plain"), "plain");
  const rows = roster(2);
  const scores = scoresFromRows([
    { studentId: rows[0].studentId, level: "proficient", by: "teacher" },
    { studentId: rows[0].studentId, level: "developing", by: "self" },
  ]);
  const out = scoreRows({ ticketId: "u:exit", unitId: "u", roster: rows, scores });
  assert.deepEqual(out, [
    ["u", "u:exit", "Star 1", "teacher", "proficient"],
    ["u", "u:exit", "Star 1", "self", "developing"],
  ]);
  assert.equal(toCsv(["a", "b"], [["1", "x,y"]]), 'a,b\r\n1,"x,y"');
  const tr = trendRows({
    unitId: "u",
    catalog: CATALOG,
    rows: [
      tally("doctor:a", 2, "2026-11-23"),
      tally("doctor:a", 1, "2026-11-16"),
      tally("doctor:a", 0, "2026-11-09"),
      tally("zzz", 4),
    ],
  });
  assert.deepEqual(
    tr.map((r) => r[3]),
    ["2026-11-16", "2026-11-23"],
  );
});
