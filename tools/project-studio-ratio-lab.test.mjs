/**
 * Pure-logic tests for the Project Studio ratio lab (Smoothie Bar, Sports Stats Scout).
 * Equivalence, purchases and projections are recomputed INDEPENDENTLY with integer cross-multiplication;
 * the six answers are cross-checked against math.mjs. Negative controls prove an additive batch, a
 * corrupted projection and garbage save data are rejected.
 */
import assert from "node:assert/strict";
import { addCheckpoint, cleanCheckpoints } from "../curriculum/projects/studio/checkpoints.mjs";
import { DESIGNERS } from "../curriculum/projects/studio/designers.mjs";
import { toNumber } from "../curriculum/projects/studio/exact.mjs";
import { model } from "../curriculum/projects/studio/math.mjs";
import { PROJECTS } from "../curriculum/projects/studio/projects.mjs";
import {
  answersOf,
  cleanRatioLab,
  commonGames,
  guardFor,
  perAttempt,
  projection,
  purchase,
  ratioOf,
  ratioReport,
  show,
  tableRows,
  tasteTest,
  totalsFair,
} from "../curriculum/projects/studio/ratio-lab.mjs";

let n = 0;
const test = (name, fn) => {
  try {
    fn();
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  }
  n++;
};
const smoothie = PROJECTS.find((p) => p.id === "unit-3-a");
const scout = PROJECTS.find((p) => p.id === "unit-3-b");
const str = (d) => Object.fromEntries(Object.entries(d).map(([k, v]) => [k, String(v)]));

test("answers match math.mjs for both missions and variants", () => {
  for (const [p, d] of [
    [smoothie, smoothie.defaults],
    [scout, scout.defaults],
    [scout, { a: 5, b: 4, c: 3, d: 84, e: 6, f: 110, g: 10 }],
    [smoothie, { a: 7, b: 3, c: 4, d: 12.5, e: 7, f: 9.99, g: 3 }],
  ]) {
    const mm = model(p, str(d));
    assert.equal(mm.errors.length, 0);
    const ans = answersOf(ratioOf(mm.values));
    for (const q of mm.checks) assert.ok(Math.abs(toNumber(ans[q.id]) - q.answer) < 1e-9, q.id);
  }
});

test("taste test agrees with integer cross-multiplication on a grid of batches", () => {
  const r = ratioOf({ a: 3, b: 2, c: 6, d: 12, e: 8, f: 15, g: 12 });
  let equal = 0;
  for (let x = 1; x <= 30; x++)
    for (let y = 1; y <= 30; y++) {
      const res = tasteTest(r, String(x), String(y));
      const same = x * 2 === y * 3;
      assert.equal(res.status === "equivalent", same, `${x}:${y}`);
      if (same) {
        equal++;
        assert.equal(toNumber(res.factor), x / 3);
      } else if (x - 3 === y - 2) assert.equal(res.status, "additive", `${x}:${y}`);
      else assert.equal(res.status, "different");
      if (!same) assert.equal(res.richer, x * 2 > y * 3 ? "A" : "B");
    }
  assert.equal(equal, 10);
  // Fractions and decimals are exact.
  assert.equal(tasteTest(r, "1 1/2", "1").status, "equivalent");
  assert.equal(tasteTest(r, "0.3", "0.2").status, "equivalent");
});

test("negative controls: additive scaling, zero and garbage are not equivalent", () => {
  const r = ratioOf({ a: 3, b: 2, c: 6, d: 12, e: 8, f: 15, g: 12 });
  const add = tasteTest(r, "6", "5");
  assert.equal(add.status, "additive");
  assert.equal(show(add.added), "3");
  assert.equal(tasteTest(r, "0", "0").status, "invalid");
  assert.equal(tasteTest(r, "x", "2").status, "invalid");
  assert.notEqual(tasteTest(r, "18", "13").status, "equivalent"); // a corrupted scale-b
});

test("ratio table masks exactly the scale-factor row", () => {
  const r = ratioOf({ a: 3, b: 2, c: 6, d: 12, e: 8, f: 15, g: 12 });
  const rows = tableRows(r, 1);
  assert.deepEqual(
    rows.map((x) => x.n),
    [1, 2, 3, 4, 5, 6],
  );
  for (const row of rows) {
    assert.equal(toNumber(row.A), 3 * row.n);
    assert.equal(toNumber(row.B), 2 * row.n);
    assert.equal(row.guardA.length > 0, row.n === 6);
    assert.equal(row.guardB.length > 0, row.n === 6);
  }
  assert.deepEqual(
    tableRows(r, 9).map((x) => x.n),
    [1, 2, 3, 4, 5, 6, 9],
  );
  const big = ratioOf({ a: 3, b: 2, c: 12, d: 12, e: 8, f: 15, g: 12 });
  assert.ok(tableRows(big, 12).at(-1).guardA.includes("scale-a"));
});

test("purchase plan recomputed independently", () => {
  const r = ratioOf({ a: 3, b: 2, c: 6, d: 12, e: 8, f: 15, g: 12 });
  for (let k = 1; k <= 20; k++)
    for (let na = 0; na <= 5; na++)
      for (let nb = 0; nb <= 5; nb++) {
        const lab = cleanRatioLab({ k, na, nb, budget: "40" });
        const p = purchase(r, lab);
        const need = 3 * k,
          bought = 8 * na + 12 * nb,
          cost = 12 * na + 15 * nb;
        assert.equal(toNumber(p.need), need);
        assert.equal(toNumber(p.bought), bought);
        assert.equal(toNumber(p.cost), cost);
        assert.equal(p.covers, bought >= need);
        assert.equal(p.within, cost <= 40);
        if (p.covers) assert.equal(toNumber(p.leftover), bought - need);
        else assert.equal(toNumber(p.short), need - bought);
        assert.equal(p.guardNeed.length > 0, k === 6);
      }
  assert.equal(purchase(r, cleanRatioLab({ budget: "" })).within, null);
});

test("scout: fair comparison at common game counts", () => {
  const r = ratioOf(scout.defaults); // 84/6 vs 110/10
  assert.equal(totalsFair(r), false);
  assert.deepEqual(commonGames(r), [30, 60, 90]);
  const p = projection(r, 30);
  assert.equal(toNumber(p.pA), (84 * 30) / 6);
  assert.equal(toNumber(p.pB), (110 * 30) / 10);
  assert.equal(p.leader, "A");
  assert.equal(toNumber(p.gap), 90);
  assert.deepEqual([p.guardA, p.guardB, p.guardGap], [[], [], []]);
  // Negative control: a corrupted projection is not the computed one.
  assert.notEqual(toNumber(p.pA), 84 * 30);
  // One game would print the unit rates and their difference, so those are guarded.
  const one = projection(r, 1);
  assert.deepEqual(
    [one.guardA, one.guardB, one.guardGap],
    [["rate-a"], ["rate-b"], ["difference"]],
  );
  assert.deepEqual(commonGames(ratioOf({ ...scout.defaults, e: 2.5 })), []);
  assert.equal(totalsFair(ratioOf({ ...scout.defaults, g: 6 })), true);
});

test("scout: per-attempt rates", () => {
  assert.equal(show(perAttempt({ n: 84n, d: 1n }, "60")), "1.4");
  assert.equal(show(perAttempt({ n: 110n, d: 1n }, "90")), "11/9");
  assert.equal(perAttempt({ n: 84n, d: 1n }, "2.5"), null);
  assert.equal(perAttempt({ n: 84n, d: 1n }, "0"), null);
});

test("guardFor matches only the named answers", () => {
  const r = ratioOf({ a: 3, b: 2, c: 6, d: 12, e: 8, f: 15, g: 12 });
  assert.deepEqual(guardFor({ n: 3n, d: 2n }, r, ["base-rate", "rate-a"]), ["base-rate", "rate-a"]);
  assert.deepEqual(guardFor({ n: 5n, d: 4n }, r, ["rate-b"]), ["rate-b"]);
  assert.deepEqual(guardFor({ n: 18n, d: 1n }, r, ["scale-b"]), []);
});

test("reports withhold answers", () => {
  const values = { a: 3, b: 2, c: 6, d: 12, e: 8, f: 15, g: 12 };
  const lab = cleanRatioLab({ k: 6, na: 1, nb: 1, tx: "6", ty: "5" });
  const text = ratioReport(lab, values).join("\n");
  assert.ok(text.includes("6 batches ? : ?"), text);
  assert.ok(!/18 : 12/.test(text));
  assert.ok(text.includes("the same amount was added to both parts"));
  assert.ok(text.includes("needs (see your Test answer)"));
  const sc = ratioReport(
    cleanRatioLab({ kind: "scout", basis: "game", common: 30, attA: "60", attB: "90" }),
    scout.defaults,
  ).join("\n");
  assert.ok(sc.includes("A 420 points, B 330 points"), sc);
  assert.ok(sc.includes("Points per attempt: A 1.4"));
  assert.ok(!sc.includes(" 14 ") && !sc.includes("11 points per game"));
});

test("cleanRatioLab rejects garbage", () => {
  assert.deepEqual(cleanRatioLab(null), cleanRatioLab({}));
  const c = cleanRatioLab({
    kind: "scout",
    ia: "mango",
    ib: "mango",
    k: 99,
    na: -1,
    basis: "vibes",
    common: 1.5,
    tx: "123456789",
  });
  assert.equal(c.kind, "scout");
  assert.notEqual(c.ia, c.ib);
  assert.equal(c.k, 1);
  assert.equal(c.na, 0);
  assert.equal(c.basis, "total");
  assert.equal(c.common, 0);
  assert.equal(c.tx.length, 8);
});

test("registry and checkpoints carry the lab", () => {
  assert.equal(DESIGNERS.ratio.key, "ratiolab");
  const r = addCheckpoint(smoothie, [], {
    name: "A",
    reason: "",
    design: str(smoothie.defaults),
    matched: 0,
    extra: { k: 4, ia: "spinach", evil: 1 },
  });
  assert.equal(r.entry.extra.k, 4);
  assert.equal(r.entry.extra.evil, undefined);
  assert.equal(cleanCheckpoints(smoothie, [r.entry])[0].extra.ia, "spinach");
});

console.log(`project-studio-ratio-lab: ${n} tests passed`);
