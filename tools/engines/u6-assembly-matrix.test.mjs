// Assembly Matrix round generators, checked independently of the game's judge.
// 300 seeds x 4 levels x 4 modes. Expressions are checked by EVALUATING both
// sides at several values of x (and y), the greatest common factor by Euclid,
// powers by repeated multiplication. The judge must accept the true answer,
// reject corrupted ones and name the misconception, the parked dials never
// solve a round, and every answer fits its dial.
import assert from "node:assert/strict";
import { rng } from "../../math/games/engines/core/math.js";
import {
  G_MAX,
  IN_MAX,
  judgeFuse,
  judgePack,
  judgePower,
  judgeUnpack,
  MODES,
  makeFuse,
  makePack,
  makePower,
  makeUnpack,
  modeFor,
  OUT_MAX,
  PODS_MAX,
  T1_MAX,
  T2_MAX,
  TILE_MAX,
} from "../../math/games/engines/u6-assembly-matrix/math.js";

const euclid = (a, b) => (b === 0 ? a : euclid(b, a % b));
const XS = [0, 1, 2, 5, 7];
const counts = { unpack: 0, pack: 0, fuse: 0, power: 0, firstOnly: 0, bigger: 0 };

for (let seed = 1; seed <= 300; seed++) {
  for (let level = 1; level <= 4; level++) {
    const next = rng(seed * 131 + level);

    // UNPACK: a(p·x + c) = t1·x + t2 for every x.
    const u = makeUnpack(level, next);
    const uc = `seed ${seed} L${level} unpack ${JSON.stringify(u)}`;
    for (const x of XS) {
      const inner = u.numeric ? u.p + u.c : u.p * x + u.c;
      const outer = u.numeric ? u.t1 + u.t2 : u.t1 * x + u.t2;
      assert.equal(u.a * inner, outer, uc);
    }
    assert.ok(u.t1 <= T1_MAX && u.t2 <= T2_MAX && u.a >= 2, uc);
    assert.ok(u.a * (u.p + u.c) <= TILE_MAX, `tiles fit: ${uc}`);
    assert.equal(judgeUnpack(u, u.t1, u.t2), "ok", uc);
    assert.notEqual(judgeUnpack(u, 0, 0), "ok", `parked solves: ${uc}`);
    assert.equal(judgeUnpack(u, u.t1, u.c), "firstOnly", uc);
    assert.equal(judgeUnpack(u, u.t1 + 1, u.t2), "t1High", uc);
    assert.equal(judgeUnpack(u, u.t1 - 1, u.t2), "t1Low", uc);
    assert.equal(judgeUnpack(u, u.t1, u.t2 + 1), "t2High", uc);
    counts.unpack++;
    counts.firstOnly++;

    // PACK: G(m·x + n) = A·x + B for every x, and G is the GREATEST common factor.
    const p = makePack(level, next);
    const pc = `seed ${seed} L${level} pack ${JSON.stringify(p)}`;
    for (const x of XS)
      assert.equal(
        p.G * ((p.numeric ? p.m : p.m * x) + p.n),
        p.numeric ? p.A + p.B : p.A * x + p.B,
        pc,
      );
    assert.equal(euclid(p.A, p.B), p.G, `G is not the GCF: ${pc}`);
    assert.ok(p.G >= 2 && p.G <= G_MAX && p.m <= IN_MAX && p.n <= IN_MAX, pc);
    assert.ok(p.A + p.B <= TILE_MAX, `tiles fit: ${pc}`);
    assert.equal(judgePack(p, level, p.G, p.m, p.n), "ok", pc);
    assert.notEqual(judgePack(p, level, 1, 0, 0), "ok", `parked solves: ${pc}`);
    assert.equal(judgePack(p, level, 1, p.A, p.B), "needFactor", pc);
    assert.equal(judgePack(p, level, p.G, p.m, p.B), "oneTerm", pc);
    assert.equal(judgePack(p, level, p.G, p.m + 1, p.n), "t1High", pc);
    assert.equal(
      judgePack(p, level, p.G, p.m, p.n + 1),
      p.n + 1 === p.B ? "oneTerm" : "t2High",
      pc,
    );
    // A smaller common factor: equivalent, so accepted below level 3, refused from level 3.
    for (let d = 2; d < p.G; d++) {
      if (p.G % d) continue;
      const v = judgePack(p, level, d, p.A / d, p.B / d);
      if (p.A / d <= IN_MAX && p.B / d <= IN_MAX) {
        assert.equal(v, level >= 3 ? "bigger" : "ok", pc);
        counts.bigger++;
      }
    }
    counts.pack++;

    // FUSE: the simplified field has one pod per kind and the same value at every (x, y).
    const f = makeFuse(level, next);
    const fc = `seed ${seed} L${level} fuse ${JSON.stringify(f)}`;
    assert.ok(f.pods.length <= PODS_MAX && f.pods.length >= 4, fc);
    const kinds = f.pods.map((q) => q.kind);
    assert.notEqual(judgeFuse(kinds), "ok", `starts solved: ${fc}`);
    const totals = {};
    for (const q of f.pods) totals[q.kind] = (totals[q.kind] || 0) + q.coef;
    for (const [x, y] of [
      [0, 0],
      [2, 3],
      [5, 1],
    ]) {
      const val = (k) => (k === "x" ? x : k === "y" ? y : 1);
      const before = f.pods.reduce((s, q) => s + q.coef * val(q.kind), 0);
      const after = Object.entries(totals).reduce((s, [k, c]) => s + c * val(k), 0);
      assert.equal(before, after, fc);
    }
    assert.equal(judgeFuse(Object.keys(totals)), "ok", fc);
    if (level >= 3)
      assert.ok(
        kinds.every((k) => ["x", "y", "1"].includes(k)),
        fc,
      );
    counts.fuse++;

    // POWER: repeated multiplication.
    const w = makePower(level, next);
    const wc = `seed ${seed} L${level} power ${JSON.stringify(w)}`;
    let prod = 1;
    for (let i = 0; i < w.e; i++) prod *= w.b;
    assert.equal(w.value, prod, wc);
    assert.ok(w.e >= 2 && w.value <= OUT_MAX && !(w.b === 2 && w.e === 2), wc);
    assert.equal(judgePower(w, prod), "ok", wc);
    assert.notEqual(judgePower(w, 0), "ok", `parked solves: ${wc}`);
    assert.equal(judgePower(w, w.b * w.e), "timesExp", wc);
    assert.equal(judgePower(w, prod + 1), "high", wc);
    counts.power++;
  }
}
assert.deepEqual([1, 2, 3, 4].map(modeFor), MODES, "every mode appears in machines 1-4");
assert.ok(counts.bigger > 50, "the greatest-common-factor rule is exercised");
console.log(`ok u6-assembly-matrix: ${JSON.stringify(counts)} checked independently`);
