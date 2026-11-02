import assert from "node:assert/strict";
import test from "node:test";
import { COUNTRIES, routeProgress, STOPS, stopSlices } from "../access-practice-lab/src/journey.js";
import { CORE_DOMAINS, LEVEL_KEYS } from "../access-practice-lab/src/util.js";

const rows = (domain, level, n, doneIds = []) =>
  Array.from({ length: n }, (_, i) => ({
    id: `${domain}-${level}-${i}`,
    domain,
    level,
    record: { complete: doneIds.includes(i) ? [`${domain}-${level}-${i}`] : [], results: {} },
  }));

test("twelve countries, one for every skill and level, with Spanish names", () => {
  const names = CORE_DOMAINS.flatMap((d) => LEVEL_KEYS.map((l) => COUNTRIES[d][l]));
  assert.equal(names.length, 12);
  assert.equal(new Set(names.map(([en]) => en)).size, 12);
  for (const [en, es] of names) assert.ok(en && es);
});

test("stop slices cover every activity exactly once, in order", () => {
  for (const n of [1, 5, 12, 24, 25, 27, 28]) {
    const slices = stopSlices(n);
    assert.equal(slices.length, Math.min(STOPS, n));
    assert.equal(slices[0][0], 0);
    assert.equal(slices.at(-1)[1], n);
    slices.forEach(([from, to], i) => {
      assert.ok(to > from, `n=${n} stop ${i} is empty`);
      if (i) assert.equal(from, slices[i - 1][1]);
    });
  }
  assert.deepEqual(
    stopSlices(12).map(([a, b]) => b - a),
    Array(12).fill(1),
  );
  assert.deepEqual(
    stopSlices(24).map(([a, b]) => b - a),
    Array(12).fill(2),
  );
});

test("a stop is finished only when all of its activities are", () => {
  const [route] = routeProgress(rows("Reading", "A", 24, [0, 1, 2, 4]));
  assert.equal(route.country[0], "Egypt");
  assert.equal(route.stops.length, 12);
  assert.deepEqual(route.stops.slice(0, 3), [true, false, false]);
  assert.equal(route.stopsDone, 1);
  assert.equal(route.complete, false);
});

test("a route is complete when every activity is finished; routes follow skill then level order", () => {
  const all = [...rows("Writing", "C", 12, [...Array(12).keys()]), ...rows("Listening", "B", 12)];
  const routes = routeProgress(all);
  assert.deepEqual(
    routes.map((r) => [r.domain, r.level]),
    [
      ["Listening", "B"],
      ["Writing", "C"],
    ],
  );
  assert.equal(routes[1].complete, true);
  assert.equal(routes[0].complete, false);
});
