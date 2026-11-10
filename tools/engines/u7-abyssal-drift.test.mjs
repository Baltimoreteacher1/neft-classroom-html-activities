// Abyssal Drift round generators, checked independently of the game's own judge.
// 300 seeds x 4 levels x 4 modes: every target is recomputed here from the
// round's givens (ordering by our own sort, distance by the Pythagorean formula,
// reflection by negating one coordinate), the judge must accept exactly that
// answer and reject corrupted ones, no round starts solved from the parked
// controls (sliders at 0, tether at 0), and every answer sits on its slider.
import assert from "node:assert/strict";
import { rng } from "../../math/games/engines/core/math.js";
import {
  judgeHull,
  judgeMirror,
  judgePoint,
  judgeTether,
  MODES,
  makeHull,
  makeMirror,
  makeNav,
  makeTether,
  modeFor,
  RANGE,
  stepFor,
  TETHER_MAX,
} from "../../math/games/engines/u7-abyssal-drift/math.js";

const onDial = (v, min, max, step) => v >= min && v <= max && Number.isInteger((v - min) / step);
const seen = new Set();
for (let r = 1; r <= 4; r++) seen.add(modeFor(r));
assert.equal(seen.size, MODES.length, "all four modes appear in rounds 1-4");

const counts = { nav: 0, hull: 0, tether: 0, mirror: 0, variants: new Set(), across: 0, halves: 0 };
for (let seed = 1; seed <= 300; seed++) {
  for (let level = 1; level <= 4; level++) {
    const next = rng(seed * 97 + level);
    const step = stepFor(level);
    const tag = `seed ${seed} L${level}`;

    // NAVIGATE
    const n = makeNav(level, next);
    assert.ok(
      onDial(n.x, -RANGE, RANGE, step) && onDial(n.y, -RANGE, RANGE, step),
      `${tag} nav fits`,
    );
    assert.ok(n.x !== 0 && n.y !== 0, `${tag} nav starts solved at the origin`);
    assert.equal(judgePoint(n, n.x, n.y).verdict, "ok");
    assert.equal(judgePoint(n, 0, 0).verdict === "ok", false);
    assert.equal(judgePoint(n, n.y, n.x).verdict, "swapped", `${tag} swap not caught`);
    const east = judgePoint(n, n.x + step, n.y);
    assert.ok(east.verdict !== "ok" && east.dx === 1 && east.dy === 0);
    const deep = judgePoint(n, n.x, n.y - step);
    assert.ok(deep.verdict !== "ok" && deep.dy === -1 && deep.dx === 0);
    if (!Number.isInteger(n.x) || !Number.isInteger(n.y)) counts.halves++;
    counts.nav++;

    // HULL — recompute the answer from the givens.
    const h = makeHull(level, next);
    counts.variants.add(h.variant);
    let truth;
    if (h.variant === "match") {
      truth = -h.given;
      assert.equal(
        Math.abs(truth),
        Math.abs(h.given),
        "opposites share a distance from the surface",
      );
      assert.equal(h.drone, h.given > 0, "a drone hovers above, an anchor rests below");
    } else {
      const r = h.readings;
      assert.equal(r.length, 3);
      let lo = r[0];
      let hi = r[0];
      let near = r[0];
      let far = r[0];
      for (const v of r) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
        if (Math.abs(v) < Math.abs(near)) near = v;
        if (Math.abs(v) > Math.abs(far)) far = v;
      }
      const mid = r.find((v) => v !== lo && v !== hi);
      truth = { deepest: lo, highest: hi, closest: near, farthest: far, middle: mid }[h.variant];
      assert.ok(
        new Set(r.map(Math.abs)).size === 3,
        "distinct distances, so 'closest/farthest' is unique",
      );
      assert.notEqual(h.trap, truth, "every order round can catch the sign/distance mix-up");
    }
    assert.equal(h.answer, truth, `${tag} hull ${h.variant}: ${JSON.stringify(h)}`);
    assert.ok(
      onDial(truth, -RANGE, RANGE, step) && truth !== 0,
      `${tag} hull answer on the ballast`,
    );
    assert.equal(judgeHull(h, truth).verdict, "ok");
    assert.notEqual(judgeHull(h, 0).verdict, "ok", "hull starts solved");
    assert.equal(judgeHull(h, truth + step).dir, 1);
    assert.equal(judgeHull(h, truth - step).dir, -1);
    assert.equal(judgeHull(h, h.trap).verdict, "trap");
    if (level === 1) assert.ok(["match", "deepest", "highest"].includes(h.variant));
    counts.hull++;

    // TETHER — distance by the distance formula on the two beacons.
    const t = makeTether(level, next);
    const sameX = t.A.x === t.B.x;
    const sameY = t.A.y === t.B.y;
    assert.ok(sameX !== sameY, `${tag} beacons share exactly one coordinate`);
    const d = Math.hypot(t.B.x - t.A.x, t.B.y - t.A.y);
    assert.equal(t.distance, d, `${tag} tether distance`);
    assert.ok(onDial(d, 0, TETHER_MAX, step) && d > 0, `${tag} tether fits the dial`);
    for (const p of [t.A, t.B])
      assert.ok(onDial(p.x, -RANGE, RANGE, step / 2) && Math.abs(p.y) <= RANGE);
    const varying = sameY ? [t.A.x, t.B.x] : [t.A.y, t.B.y];
    const crosses = varying[0] * varying[1] < 0;
    assert.equal(t.across, crosses, `${tag} 'across' matches the beacons`);
    if (crosses) counts.across++;
    assert.equal(judgeTether(t, d).verdict, "ok");
    assert.notEqual(judgeTether(t, 0).verdict, "ok", "tether starts solved");
    assert.equal(judgeTether(t, d + step).dir, 1);
    assert.equal(judgeTether(t, d - step).dir, -1);
    const wrong = crosses
      ? Math.abs(Math.abs(varying[0]) - Math.abs(varying[1]))
      : Math.abs(varying[0]) + Math.abs(varying[1]);
    assert.equal(
      judgeTether(t, wrong).verdict,
      crosses ? "subtracted" : "added",
      `${tag} misconception`,
    );
    counts.tether++;

    // MIRROR — reflect by negating the coordinate across the named axis.
    const m = makeMirror(level, next);
    const img = m.axis === "x" ? [m.p.x, -m.p.y] : [-m.p.x, m.p.y];
    assert.deepEqual([m.image.x, m.image.y], img, `${tag} mirror image`);
    assert.ok(
      img.every((v) => onDial(v, -RANGE, RANGE, step) && v !== 0),
      `${tag} image on the sliders`,
    );
    assert.equal(judgeMirror(m, img[0], img[1]).verdict, "ok");
    assert.notEqual(judgeMirror(m, 0, 0).verdict, "ok", "mirror starts solved");
    assert.equal(judgeMirror(m, m.p.x, m.p.y).verdict, "unchanged");
    assert.equal(judgeMirror(m, -m.p.x, -m.p.y).verdict, "bothFlipped");
    const other = m.axis === "x" ? [-m.p.x, m.p.y] : [m.p.x, -m.p.y];
    assert.equal(judgeMirror(m, other[0], other[1]).verdict, "wrongAxis");
    assert.notEqual(judgeMirror(m, img[0] + step, img[1]).verdict, "ok");
    counts.mirror++;
  }
}
assert.equal(counts.variants.size, 6, "every hull variant is generated");
assert.ok(counts.across > 100, "tethers cross the axis often");
assert.ok(counts.halves > 50, "rational (half-unit) coordinates appear at levels 3-4");
console.log(
  `ok u7-abyssal-drift: ${counts.nav} navigate, ${counts.hull} hull, ${counts.tether} tether (${counts.across} across an axis), ${counts.mirror} mirror rounds checked independently`,
);
