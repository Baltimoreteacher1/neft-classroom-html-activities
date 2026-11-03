// Independent checks for the Soccer Stadium model: every expectation is recomputed here with plain integer
// arithmetic, never by calling the code under test a second time.
import assert from "node:assert/strict";
import {
  CELL_METERS, COST, DEFAULT_STADIUM, LIMITS, areaCurve, clean, consequences, costLine, derive, frac, percentText,
  problems, scaleField, seatsWithinBudget, setField,
} from "./stadium-math.js";

const rng = (() => { let x = 12345; return () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648); })();
const int = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const fresh = () => ({
  length: int(...LIMITS.length), width: int(...LIMITS.width), sections: int(...LIMITS.sections),
  seatsPerSection: int(...LIMITS.seatsPerSection), price: int(...LIMITS.price), sold: 0, budget: int(...LIMITS.budget),
});

assert.deepEqual(problems(DEFAULT_STADIUM), [], "default state is valid");

// The headline fact: doubling BOTH dimensions multiplies area by 4, perimeter by 2; doubling ONE multiplies area by 2.
{
  const s = { ...DEFAULT_STADIUM, length: 40, width: 20 };
  const both = scaleField(s, frac(2, 1));
  assert.deepEqual([both.state.length, both.state.width], [80, 40]);
  const [c] = consequences(s, both.state);
  assert.equal(c.id, "scale-both");
  assert.deepEqual(c.areaFactor, { n: 4, d: 1 });
  assert.deepEqual(c.perimeterFactor, { n: 2, d: 1 });
  assert.deepEqual(c.before, { area: 800, perimeter: 120 });
  assert.deepEqual(c.after, { area: 3200, perimeter: 240 });
  const one = setField(s, "length", 80).state;
  const [o] = consequences(s, one);
  assert.equal(o.id, "scale-one");
  assert.deepEqual(o.areaFactor, { n: 2, d: 1 });
}

// Property: for any valid field and integer k that stays in range, area scales by k^2 and perimeter by k.
for (let i = 0; i < 400; i += 1) {
  const s = fresh();
  const k = int(2, 5);
  const r = scaleField(s, frac(k, 1));
  if (r.error) {
    assert.ok(s.length * k > LIMITS.length[1] || s.width * k > LIMITS.width[1], `rejected only when out of range (${r.error})`);
    continue;
  }
  const [c] = consequences(s, r.state);
  assert.equal(c.areaFactor.n / c.areaFactor.d, k * k);
  assert.equal(c.perimeterFactor.n / c.perimeterFactor.d, k);
  assert.equal(derive(r.state).area, s.length * k * s.width * k);
}

// Halving works only when both sides are even; otherwise it is refused (never a fractional metre).
assert.equal(scaleField({ ...DEFAULT_STADIUM, length: 41, width: 20 }, frac(1, 2)).error, "not-whole-metres");
assert.deepEqual(scaleField({ ...DEFAULT_STADIUM, length: 40, width: 20 }, frac(1, 2)).state.length, 20);
assert.equal(scaleField({ ...DEFAULT_STADIUM, length: 150, width: 20 }, frac(2, 1)).error, "length-out-of-range");

// Derived quantities against hand arithmetic.
{
  const d = derive({ length: 40, width: 20, sections: 4, seatsPerSection: 5, price: 10, sold: 12, budget: 60000 });
  assert.equal(d.area, 800);
  assert.equal(d.perimeter, 120);
  assert.equal(d.capacity, 20);
  assert.deepEqual(d.occupancy, { n: 3, d: 5 });
  assert.equal(d.occupancyText, "60%");
  assert.equal(d.revenue, 120);
  assert.equal(d.cost, 800 * COST.fieldPerM2 + 20 * COST.perSeat);
  assert.deepEqual(d.cells, { across: 8, down: 4 });
  assert.deepEqual(d.lengthToWidth, { n: 2, d: 1 });
}
assert.equal(derive({ ...DEFAULT_STADIUM, length: 42, width: 20 }).cells, null, "no whole-cell grid when sides are not multiples of 5");

// Percent text is exact to one decimal and never shows a float artifact.
assert.equal(percentText(1, 3), "33.3%");
assert.equal(percentText(2, 3), "66.7%");
assert.equal(percentText(1, 8), "12.5%");
assert.equal(percentText(0, 0), "0%");
for (let i = 0; i < 200; i += 1) assert.doesNotMatch(percentText(int(0, 60), int(1, 60)), /\d\.\d\d|e|NaN|Infinity/);

// Invariants: sold can never exceed capacity, and shrinking the stands pulls sold down with them.
assert.ok(problems({ ...DEFAULT_STADIUM, sold: 21 }).includes("sold-exceeds-capacity"));
{
  const r = setField({ ...DEFAULT_STADIUM, sold: 18 }, "sections", 2);
  assert.equal(r.state.sold, 10, "sold is clamped to the new capacity (2 x 5)");
}
assert.equal(setField(DEFAULT_STADIUM, "length", 5).error, "length-out-of-range");
assert.equal(setField(DEFAULT_STADIUM, "length", 12.5).error, "bad-input");
assert.equal(setField(DEFAULT_STADIUM, "nope", 3).error, "bad-input");

// Saved data is repaired, never trusted.
assert.deepEqual(clean(null), DEFAULT_STADIUM);
assert.deepEqual(clean({ length: "x", width: 9999, sold: -4 }).length, DEFAULT_STADIUM.length);
assert.equal(clean({ width: 9999 }).width, LIMITS.width[1]);
assert.equal(clean({ sold: -4 }).sold, 0);
for (let i = 0; i < 200; i += 1) assert.deepEqual(problems(clean({ length: int(-50, 500), width: int(-50, 500), sections: int(-5, 30), seatsPerSection: int(-5, 90), sold: int(-5, 5000), price: int(-9, 200), budget: int(-9, 9e6) })), []);

// Occupancy ratio is unchanged when capacity and sold scale together (the proportional-reasoning fact).
{
  const a = { ...DEFAULT_STADIUM, sections: 4, seatsPerSection: 5, sold: 12 };
  const b = { ...a, sections: 8, sold: 24 };
  const occ = consequences(a, b).find((c) => c.id === "occupancy");
  assert.equal(occ.sameRatio, true);
  const capacity = consequences(a, b).find((c) => c.id === "capacity");
  assert.deepEqual(capacity.factor, { n: 2, d: 1 });
}

// Grade-8 linear cost: cost(seats) = field cost + 50 seats; the budget inverse is a floor division.
{
  const s = { ...DEFAULT_STADIUM, length: 40, width: 20, budget: 60000 };
  const line = costLine(s);
  assert.equal(line.fixed, 16000);
  assert.equal(line.at(0), 16000);
  assert.equal(line.at(10) - line.at(9), 50, "slope is the cost per seat");
  assert.equal(seatsWithinBudget(s), 880);
  assert.equal(seatsWithinBudget({ ...s, budget: 15000 }), null);
  for (let i = 0; i < 100; i += 1) {
    const t = { ...fresh(), budget: int(5000, 300000) };
    const n = seatsWithinBudget(t);
    if (n === null) assert.ok(t.length * t.width * COST.fieldPerM2 > t.budget);
    else {
      assert.ok(costLine(t).at(n) <= t.budget && costLine(t).at(n + 1) > t.budget, "largest affordable seat count");
    }
  }
}

// The area curve is A(k) = L W k^2 exactly, with rational k.
{
  const pts = areaCurve({ ...DEFAULT_STADIUM, length: 10, width: 10 }, [frac(1, 2), frac(1, 1), frac(3, 2), frac(2, 1)]);
  assert.deepEqual(pts.map((p) => p.area), [{ n: 25, d: 1 }, { n: 100, d: 1 }, { n: 225, d: 1 }, { n: 400, d: 1 }]);
}
assert.equal(CELL_METERS, 5);
console.log("stadium-math: exact area/perimeter scaling, invariants, repair, cost line and curve checks passed");
