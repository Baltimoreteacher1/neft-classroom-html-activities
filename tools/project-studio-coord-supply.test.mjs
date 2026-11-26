/**
 * Pure-logic tests for the Project Studio coordinate map designer (coordinates missions) and the
 * supply-plan simulator (division missions). Every expected value is recomputed here independently
 * (integer loops, cents, point sampling), and negative controls prove the checks reject wrong answers.
 */
import assert from "node:assert/strict";
import * as CM from "../curriculum/projects/studio/coord-map.mjs";
import * as SP from "../curriculum/projects/studio/supply-plan.mjs";
import { DESIGNERS } from "../curriculum/projects/studio/designers.mjs";
import { addCheckpoint, cleanCheckpoints } from "../curriculum/projects/studio/checkpoints.mjs";
import { PROJECTS } from "../curriculum/projects/studio/projects.mjs";
import { model } from "../curriculum/projects/studio/math.mjs";

let n = 0;
const test = (name, fn) => {
  try {
    fn();
    n++;
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
};
const park = PROJECTS.find((p) => p.id === "unit-7-a");
const subm = PROJECTS.find((p) => p.id === "unit-7-b");
const answersOf = (project, design) =>
  Object.fromEntries(model(project, design).checks.map((c) => [c.id, c.answer]));
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

/* ------------------------------------------------------------------ coordinates */
test("cleanMap drops malformed data and never throws", () => {
  for (const raw of [null, 7, "x", [], { items: "no" }])
    assert.deepEqual(CM.cleanMap(raw), CM.empty("park"));
  const m = CM.cleanMap({
    mode: "park",
    items: [
      { id: "p1", kind: "gate", x: 0, y: -10 },
      { id: "p1", kind: "food", x: 1, y: 1 },
      { id: "p2", kind: "wp", x: 1, y: 1 },
      { id: "p3", kind: "food", x: 13, y: 0 },
      { id: "p4", kind: "food", x: 1.5, y: 0 },
      { id: "p5", kind: "stage", x: 2, y: 2, mirrorOf: "p9", axis: "y" },
      { id: "x6", kind: "stage", x: 2, y: 2 },
    ],
    paths: [
      { id: "r1", from: "p1", to: "A", elbow: "v" },
      { id: "r2", from: "A", to: "p1" },
      { id: "r3", from: "p1", to: "p99" },
      { id: "r4", from: "B", to: "B" },
    ],
  });
  assert.deepEqual(
    m.items.map((i) => i.id),
    ["p1", "p5"],
  );
  assert.equal(m.items[1].mirrorOf, undefined);
  assert.deepEqual(m.paths, [{ id: "r1", from: "p1", to: "A", elbow: "v" }]);
  const s = CM.cleanMap({
    mode: "sub",
    items: [
      { id: "p1", kind: "gate", x: 0, y: 0 },
      { id: "p2", kind: "wp", x: 0, y: -3, elbow: "q" },
    ],
    paths: [{ id: "r1", from: "A", to: "B" }],
  });
  assert.deepEqual(s.items, [{ id: "p2", kind: "wp", x: 0, y: -3, elbow: "h" }]);
  assert.deepEqual(s.paths, []);
});

test("legs: each leg is |to − from|, through zero it is |from| + |to|", () => {
  for (let i = 0; i < 2000; i++) {
    const r = () => Math.floor(Math.random() * 25) - 12;
    const p = { x: r(), y: r() },
      q = { x: r(), y: r() };
    for (const elbow of ["h", "v"]) {
      const legs = CM.legsOf(p, q, elbow);
      const total = legs.reduce((s, l) => s + l.length, 0);
      assert.equal(total, Math.abs(q.x - p.x) + Math.abs(q.y - p.y));
      for (const l of legs) {
        let count = 0;
        for (let k = Math.min(l.from, l.to); k < Math.max(l.from, l.to); k++) count++; // unit steps, counted
        assert.equal(l.length, count);
        if (l.crossesZero) assert.equal(l.length, Math.abs(l.from) + Math.abs(l.to));
      }
    }
  }
  assert.equal(
    CM.legText({ from: -4, to: 6, length: 10, crossesZero: true }),
    "|6 − (−4)| = 4 + 6 = 10",
  );
  assert.equal(CM.legText({ from: 2, to: 7, length: 5, crossesZero: false }), "|7 − 2| = 5");
  assert.equal(
    CM.legText({ from: -4, to: 6, length: 10, crossesZero: true }, false),
    "|6 − (−4)| = ?",
  );
});

test("hidden legs are exactly the Test answers they would print (all designs)", () => {
  let checked = 0;
  for (const a of range(-10, 10))
    for (const b of range(-10, 10))
      for (const c of [-9, -3, 0, 4, 10]) {
        if (a === c) continue;
        const ans = answersOf(park, { a, b, c });
        const pts = CM.pointsOf({ a, b, c });
        const lenOf = (p, q) => CM.legsOf(p, q).reduce((s, l) => s + l.length, 0);
        assert.equal(CM.hiddenFor(pts.A, pts.B, pts), "distance");
        assert.equal(lenOf(pts.A, pts.B), ans.distance);
        if (a !== 0) {
          // When B sits on the y-axis the trip is A to B, hidden as the distance (same value as A to zero).
          assert.equal(CM.hiddenFor(pts.A, { x: 0, y: b }, pts), c === 0 ? "distance" : "a-zero");
          assert.equal(lenOf(pts.A, { x: 0, y: b }), ans["a-zero"]);
        }
        if (b !== 0) {
          assert.equal(CM.hiddenFor({ x: a, y: -b }, pts.A, pts), "opposite");
          assert.equal(lenOf(pts.A, { x: a, y: -b }), ans.opposite);
        }
        // Negative control: a trip one unit off any of those is the student's own computation, not hidden.
        assert.equal(CM.hiddenFor(pts.A, { x: a + 1 === c ? a - 1 : a + 1, y: b + 1 }, pts), null);
        checked++;
      }
  assert.ok(checked > 1500);
});

test("park constraints: shared points, fence, one gate with routes, mirrors", () => {
  const pts = CM.pointsOf(park.defaults);
  let d = CM.empty("park");
  d = CM.addItem(d, "gate", pts).data;
  d = CM.addItem(d, "coaster", pts).data;
  let v = CM.evaluate(d, pts);
  assert.ok(v.distinct && v.inside && v.oneGate && !v.routes);
  assert.deepEqual(new Set(v.unreached), new Set(["A", "B", "p2"]));
  for (const [f, t] of [
    ["p1", "A"],
    ["A", "B"],
    ["B", "p2"],
  ])
    d = CM.addPath(d, f, t).data;
  v = CM.evaluate(d, pts);
  assert.ok(v.routes && v.ok);
  assert.equal(v.paths.find((p) => p.from === "A" && p.to === "B").hidden, "distance");
  assert.ok(CM.addPath(d, "B", "A").error === "exists");
  const clash = CM.moveItem(d, "p2", pts.A.x, pts.A.y);
  assert.deepEqual(new Set(CM.evaluate(clash, pts).clashes), new Set(["A", "p2"]));
  assert.deepEqual(CM.evaluate(CM.moveItem(d, "p2", 11, 0), pts).outside, ["p2"]);
  const two = CM.addItem(d, "gate", pts).data;
  assert.ok(!CM.evaluate(two, pts).oneGate);
  const m = CM.mirrorItem(CM.moveItem(d, "p2", 3, 5), "p2", "y", pts);
  assert.deepEqual([m.item.x, m.item.y], [-3, 5]);
  assert.ok(CM.evaluate(m.data, pts).mirrors[0].holds);
  assert.ok(!CM.evaluate(CM.moveItem(m.data, "p2", 4, 5), pts).mirrors[0].holds);
  assert.equal(CM.mirrorItem(CM.moveItem(d, "p2", 0, 5), "p2", "y", pts).error, "on-axis");
  const gone = CM.removeItem(m.data, "p2");
  assert.ok(
    gone.items.every((i) => !i.mirrorOf) &&
      gone.paths.every((p) => p.from !== "p2" && p.to !== "p2"),
  );
});

test("addItem never lands on a used point and fills the park only to the cap", () => {
  const pts = CM.pointsOf({ a: 0, b: 0, c: 1 });
  let d = CM.empty("park");
  for (let i = 0; i < CM.MAX_ITEMS; i++) d = CM.addItem(d, "food", pts).data;
  const keys = new Set([
    `${pts.A.x},${pts.A.y}`,
    `${pts.B.x},${pts.B.y}`,
    ...d.items.map((i) => `${i.x},${i.y}`),
  ]);
  assert.equal(keys.size, CM.MAX_ITEMS + 2);
  assert.equal(CM.addItem(d, "food", pts).error, "full");
  assert.equal(CM.addItem(CM.empty("park"), "wp", pts).error, "unknown");
});

/** Independent hazard test: sample the leg finely and ask whether any sample is strictly inside the box. */
const sampledHit = (p, q, hz) => {
  for (let s = 0; s <= 1000; s++) {
    const x = p.x + ((q.x - p.x) * s) / 1000,
      y = p.y + ((q.y - p.y) * s) / 1000;
    if (x > hz.x0 + 1e-9 && x < hz.x1 - 1e-9 && y > hz.y0 + 1e-9 && y < hz.y1 - 1e-9) return true;
  }
  return false;
};

test("sub: the direct route always hits the hazard and a detour exists (all designs)", () => {
  let n2 = 0;
  for (const a of range(-10, 10))
    for (const c of range(-10, 10))
      for (const b of range(-10, 0)) {
        if (a === c) continue;
        const pts = CM.pointsOf({ a, b, c });
        const hz = CM.hazardOf(pts);
        assert.ok(
          !sampledHit(pts.A, pts.A, hz) && !sampledHit(pts.B, pts.B, hz),
          "hazard covers a mission point",
        );
        const direct = CM.evaluate(CM.empty("sub"), pts);
        assert.ok(!direct.safe && direct.trips[0].hidden === "distance");
        const depth = b - 2 >= -10 ? b - 2 : b + 2;
        let d = {
          ...CM.empty("sub"),
          items: [
            { id: "p1", kind: "wp", x: a, y: depth, elbow: "h" },
            { id: "p2", kind: "wp", x: c, y: depth, elbow: "h" },
          ],
        };
        const v = CM.evaluate(d, pts);
        assert.ok(v.safe && v.inside && v.distinct, `detour fails for ${a},${b},${c}`);
        assert.equal(v.total, Math.abs(c - a) + 2 * Math.abs(depth - b));
        n2++;
      }
  assert.ok(n2 > 4000);
});

test("legHitsHazard agrees with fine sampling on random legs (and a wrong verdict is caught)", () => {
  const hz = { x0: 1, x1: 3, y0: -5.5, y1: -2.5 };
  let disagreements = 0;
  for (let i = 0; i < 3000; i++) {
    const r = () => Math.floor(Math.random() * 25) - 12;
    const p = { x: r(), y: r() },
      q = Math.random() < 0.5 ? { x: r(), y: p.y } : { x: p.x, y: r() };
    for (const leg of CM.legsOf(p, q)) {
      const end = leg.axis === "x" ? { x: leg.to, y: leg.fixed } : { x: leg.fixed, y: leg.to };
      const start =
        leg.axis === "x" ? { x: leg.from, y: leg.fixed } : { x: leg.fixed, y: leg.from };
      if (CM.legHitsHazard(leg, hz) !== sampledHit(start, end, hz)) disagreements++;
    }
  }
  assert.equal(disagreements, 0);
  const crossing = CM.legsOf({ x: 0, y: -4 }, { x: 5, y: -4 })[0];
  assert.notEqual(
    false,
    CM.legHitsHazard(crossing, hz),
    "negative control: a crossing leg must not pass as safe",
  );
  assert.equal(
    CM.legHitsHazard(CM.legsOf({ x: 0, y: -2.5 }, { x: 5, y: -2.5 })[0], hz),
    false,
    "touching the edge is allowed",
  );
});

test("sub route: below surface, order and elbows", () => {
  const pts = CM.pointsOf(subm.defaults);
  let d = CM.addItem(CM.empty("sub"), "wp", pts).data;
  assert.ok(d.items[0].y <= 0);
  d = CM.moveItem(d, "p1", 0, 2);
  assert.deepEqual(CM.evaluate(d, pts).outside, ["p1"]);
  d = CM.addItem(CM.moveItem(d, "p1", -6, -8), "wp", pts).data;
  d = CM.moveItem(d, "p2", 3, -8);
  assert.deepEqual(
    CM.routeTrips(d, pts).map((t) => t.to),
    ["p1", "p2", "B"],
  );
  assert.deepEqual(
    CM.routeTrips(CM.reorder(d, "p2", -1), pts).map((t) => t.to),
    ["p2", "p1", "B"],
  );
  assert.ok(CM.evaluate(d, pts).ok);
  assert.equal(CM.flipTrip(d, "B").endElbow, "v");
  assert.equal(CM.flipTrip(d, "p1").items[0].elbow, "v");
});

test("map report never computes a hidden leg; checkpoint round-trip keeps the map", () => {
  const pts = CM.pointsOf(park.defaults);
  let d = CM.addItem(CM.empty("park"), "gate", pts).data;
  d = CM.addPath(CM.addPath(d, "A", "B").data, "p1", "A").data;
  const lines = CM.mapReport(d, model(park, park.defaults).values).join("\n");
  const dist = answersOf(park, park.defaults).distance;
  assert.ok(lines.includes("your Test answer for the A-to-B distance"));
  assert.ok(!lines.includes(`B: ${dist} units`), "report printed the A-to-B distance");
  const sublines = CM.mapReport(CM.empty("sub"), model(subm, subm.defaults).values);
  assert.deepEqual(sublines, []);
  const subd = CM.addItem(CM.empty("sub"), "wp", CM.pointsOf(subm.defaults)).data;
  assert.ok(
    CM.mapReport(subd, model(subm, subm.defaults).values)
      .join("\n")
      .includes("SUBMARINE ROUTE LOG"),
  );
  const spec = DESIGNERS.coordinates;
  const r = addCheckpoint(park, [], {
    name: "v1",
    reason: "",
    design: { ...park.defaults },
    extra: d,
    matched: 0,
  });
  const back = cleanCheckpoints(park, JSON.parse(JSON.stringify(r.list)));
  assert.deepEqual(back[0].extra, spec.clean(d));
  assert.deepEqual(spec.clean(d), d);
});

/* ------------------------------------------------------------------ division */
const division = PROJECTS.filter((p) => p.family === "division");
const cents = (x) => Math.round(x * 100);

test("cleanPlan validates counts, cap and twist", () => {
  assert.deepEqual(SP.cleanPlan(null), SP.empty());
  assert.deepEqual(
    SP.cleanPlan({
      groups: -1,
      packs: 2.5,
      cuts: 1e6,
      limit: 0,
      twist: { key: "z", from: 1, to: 2 },
    }),
    SP.empty(),
  );
  assert.deepEqual(
    SP.cleanPlan({
      groups: 13,
      packs: 26,
      cuts: 20,
      limit: 12,
      twist: { key: "limit", from: 13, to: 12 },
    }),
    { groups: 13, packs: 26, cuts: 20, limit: 12, twist: { key: "limit", from: 13, to: 12 } },
  );
});

test("seating verdicts: everyone placed with no empty group exactly at the round-up count", () => {
  for (let a = 12; a <= 400; a += 7)
    for (let b = 2; b <= 60; b += 5) {
      let need = 0;
      while (need * b < a) need++; // independent ceiling by repeated addition
      const x = SP.numbersOf({ a, b, c: 10, d: 1, e: 1, f: 1 });
      for (const g of [need - 1, need, need + 1]) {
        const r = SP.evaluate({ ...SP.empty(), groups: g }, x);
        assert.equal(r.everyone && r.noEmpty, g === need, `a=${a} b=${b} g=${g}`);
        assert.equal(SP.show(r.seats), String(g * b));
      }
    }
});

test("budget and material verdicts are exact (cents and marks), with a float negative control", () => {
  for (const p of division) {
    const v = model(p, p.defaults).values;
    const x = SP.numbersOf(v);
    for (let packs = 0; packs <= 60; packs++) {
      const r = SP.evaluate({ ...SP.empty(), packs }, x);
      assert.equal(r.withinBudget, packs * cents(v.d) <= cents(v.c), `${p.id} packs=${packs}`);
      assert.equal(SP.money(r.cost), `$${((packs * cents(v.d)) / 100).toFixed(2)}`);
    }
    const unitsF = v.f * 8,
      unitsE = v.e * 8; // eighths of a meter are exact for every mission
    for (let cuts = 0; cuts <= 40; cuts++)
      assert.equal(SP.evaluate({ ...SP.empty(), cuts }, x).enough, cuts * unitsF <= unitsE);
    const ans = answersOf(p, p.defaults);
    const packsFit = Math.floor(cents(v.c) / cents(v.d));
    assert.equal(ans.packs, packsFit, `${p.id}: Studio answer disagrees with cents`);
  }
  // Negative control: 3 × $0.10 in floating point is 0.30000000000000004 > 0.30; exact arithmetic must still say "within".
  assert.ok(3 * 0.1 > 0.3);
  assert.ok(
    SP.evaluate(
      { ...SP.empty(), packs: 3 },
      SP.numbersOf({ a: 1, b: 1, c: 0.3, d: 0.1, e: 1, f: 1 }),
    ).withinBudget,
  );
  assert.ok(
    !SP.evaluate(
      { ...SP.empty(), packs: 4 },
      SP.numbersOf({ a: 1, b: 1, c: 0.3, d: 0.1, e: 1, f: 1 }),
    ).withinBudget,
  );
});

test("cut marks show the piece as a fraction of a meter", () => {
  const m = SP.cutMarks(SP.numbersOf({ a: 1, b: 1, c: 1, d: 1, e: 12, f: 0.75 }));
  assert.deepEqual(m, { per: 3, unit: 4, total: 48 });
  assert.deepEqual(SP.cutMarks(SP.numbersOf({ a: 1, b: 1, c: 1, d: 1, e: 5, f: 0.125 })), {
    per: 1,
    unit: 8,
    total: 40,
  });
  assert.equal(SP.cutMarks(SP.numbersOf({ a: 1, b: 1, c: 1, d: 1, e: 5, f: 2 })), null);
});

test("each mission twist applies, is detected, and reverts", () => {
  const expect = {
    "pre-unit-a": ["a", 146, 158],
    "unit-1-b": ["f", 0.75, 1],
    "unit-1-c": ["b", 16, 12],
  };
  for (const p of division) {
    const v = model(p, p.defaults).values;
    const plan = { ...SP.empty(), groups: 13 };
    const r = SP.applyTwist(p.id, plan, v);
    if (p.id === "unit-1-a") {
      assert.equal(r.patch, null);
      assert.equal(r.plan.limit, 12);
      assert.ok(
        !SP.evaluate(r.plan, SP.numbersOf(v)).withinLimit,
        "the old 13-table plan breaks the cap",
      );
      assert.ok(SP.evaluate({ ...r.plan, groups: 12 }, SP.numbersOf(v)).withinLimit);
      assert.equal(SP.applyTwist(p.id, SP.empty(), v).error, "plan-first");
    } else {
      const [key, from, to] = expect[p.id];
      assert.deepEqual(r.patch, { [key]: String(to) });
      assert.deepEqual(r.plan.twist, { key, from, to });
      assert.ok(SP.twistActive(r.plan, { ...v, [key]: to }));
      assert.ok(!SP.twistActive(r.plan, v), "twist must read as off once the design is back");
      assert.deepEqual(SP.revertTwist(r.plan).patch, { [key]: String(from) });
    }
    assert.equal(SP.applyTwist(p.id, r.plan, v).error, "applied");
  }
});

test("plan report shows plan consequences and none of the six answers' labels", () => {
  for (const p of division) {
    const v = model(p, p.defaults).values;
    const plan = { ...SP.empty(), groups: 3, packs: 2, cuts: 4 };
    const text = SP.planReport(plan, v).join("\n");
    assert.ok(text.includes(`3 × ${v.b} places = ${3 * v.b} places`));
    for (const banned of ["remainder", "left over", "money left", "leftover", "quotient"])
      assert.ok(!text.toLowerCase().includes(banned), `${p.id}: ${banned}`);
    const r = addCheckpoint(p, [], {
      name: "plan",
      reason: "",
      design: { ...p.defaults },
      extra: plan,
      matched: 0,
    });
    assert.deepEqual(
      cleanCheckpoints(p, JSON.parse(JSON.stringify(r.list)))[0].extra,
      DESIGNERS.division.clean(plan),
    );
  }
  assert.deepEqual(SP.planReport(SP.empty(), model(division[0], division[0].defaults).values), []);
});

console.log(`project-studio-coord-supply: ${n} tests passed`);
