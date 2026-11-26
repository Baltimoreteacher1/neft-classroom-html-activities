// mean-balance.test.mjs — every number the mean-balance play shows a student.
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMeanBalancePlay, validateMeanBalance as reexported } from "./mean-balance.js";
import {
  applyMove,
  assignBlocks,
  balance,
  choiceSet,
  fmtVal,
  isLevel,
  minMoves,
  niceStep,
  placeCorrect,
  stats,
  validateMeanBalance,
} from "./mean-balance-model.js";

// The 2-8 config: Miguel's dog-walking earnings, one block = $5.
const CFG = {
  values: [15, 25, 10, 10],
  unit: 5,
  prefix: "$",
  labels: [{ en: "Mon", es: "lun" }, "Tue", "Wed", "Thu"],
  transfer: { values: [9, 11, 16, 12] },
};

test("stats: total, mean, median, midrange of the lesson data", () => {
  const s = stats(CFG.values);
  assert.equal(s.total, 60);
  assert.equal(s.mean, 15);
  assert.equal(s.median, 12.5);
  assert.equal(s.midrange, 17.5);
  assert.deepEqual([s.min, s.max, s.n], [10, 25, 4]);
  assert.equal(stats([3, 9, 6]).median, 6); // odd count
});

test("choiceSet: mean is the one correct choice; distractors are median, midrange, total", () => {
  const c = choiceSet(CFG.values);
  assert.deepEqual(
    c.map((o) => [o.kind, o.value, !!o.correct]),
    [
      ["mean", 15, true],
      ["median", 12.5, false],
      ["midrange", 17.5, false],
      ["total", 60, false],
    ],
  );
  const t = choiceSet(CFG.transfer.values);
  assert.deepEqual(
    t.map((o) => o.value),
    [12, 11.5, 12.5, 48],
  );
  // Symmetric data: median = midrange = mean, so the max fills in; values stay distinct.
  const sym = choiceSet([10, 15, 20]);
  assert.deepEqual(
    sym.map((o) => o.kind),
    ["mean", "total", "max"],
  );
  assert.equal(new Set(sym.map((o) => o.value)).size, sym.length);
  assert.equal(sym.filter((o) => o.correct).length, 1);
});

test("balance: distances to the mean sum equally on each side", () => {
  const b = balance(CFG.values);
  assert.equal(b.mean, 15);
  assert.deepEqual(
    b.rows.map((r) => [r.d, r.side]),
    [
      [0, "on"],
      [10, "right"],
      [5, "left"],
      [5, "left"],
    ],
  );
  assert.equal(b.left, 10);
  assert.equal(b.right, 10);
  const t = balance(CFG.transfer.values);
  assert.deepEqual([t.left, t.right], [4, 4]);
  // Any data at all balances, including a non-integer mean.
  for (const vals of [
    [0, 5, 50, 10],
    [3, 4, 4],
    [1, 2, 3, 4, 5, 40],
  ]) {
    const x = balance(vals);
    assert.ok(Math.abs(x.left - x.right) < 1e-9, vals.join());
  }
});

test("applyMove / isLevel / minMoves: leveling the towers", () => {
  const start = [3, 5, 2, 2];
  assert.equal(minMoves(start), 2);
  const a = applyMove(start, 1, 2, 5);
  assert.deepEqual(a, [3, 4, 3, 2]);
  assert.deepEqual(start, [3, 5, 2, 2], "pure: input untouched");
  const b = applyMove(a, 1, 3, 5);
  assert.deepEqual(b, [3, 3, 3, 3]);
  assert.ok(isLevel(b));
  assert.ok(!isLevel(a));
  assert.equal(applyMove(start, 1, 1, 5), null, "same tower");
  assert.equal(applyMove([0, 5, 2, 5], 0, 2, 5), null, "empty source");
  assert.equal(applyMove(start, 0, 1, 5), null, "destination at cap");
  // The total is invariant across every allowed move.
  assert.equal(
    b.reduce((s, v) => s + v, 0),
    12,
  );
});

test("assignBlocks: towers keep their own blocks; surplus travels in order", () => {
  const st = assignBlocks([3, 5, 2, 2], [3, 3, 3, 3]);
  assert.deepEqual(
    st.map((s) => s.length),
    [3, 3, 3, 3],
  );
  assert.deepEqual(st[2][2], { o: 1, j: 3 });
  assert.deepEqual(st[3][2], { o: 1, j: 4 });
  assert.ok(st[0].every((b) => b.o === 0));
  const all = st.flat().map((b) => `${b.o}:${b.j}`);
  assert.equal(new Set(all).size, 12, "no block used twice");
});

test("fmtVal: money keeps cents, repeating means are marked", () => {
  assert.equal(fmtVal(15, "$"), "$15");
  assert.equal(fmtVal(12.5, "$"), "$12.50");
  assert.equal(fmtVal(1.25, "$"), "$1.25");
  assert.equal(fmtVal(40 / 3), "≈ 13.33");
  assert.equal(fmtVal(12.5), "12.5");
});

test("niceStep keeps a number line to about a dozen ticks", () => {
  assert.equal(niceStep(9), 1);
  assert.equal(niceStep(20), 2);
  assert.equal(niceStep(50), 5);
  assert.equal(niceStep(300), 25);
  assert.equal(niceStep(500), 50);
});

test("validateMeanBalance accepts the lesson config", () => {
  const v = validateMeanBalance(CFG);
  assert.deepEqual(v.blocks, [3, 5, 2, 2]);
  assert.equal(v.editIndex, 1, "defaults to the largest value");
  assert.deepEqual(v.labels[0], { en: "Mon", es: "lun" });
  assert.deepEqual(v.labels[1], { en: "Tue", es: "Tue" });
  assert.deepEqual(v.transfer.values, [9, 11, 16, 12]);
});

test("validateMeanBalance refuses configs that would draw a wrong or unreachable model", () => {
  const bad = [
    null,
    {},
    { values: [1, 2] }, // too few
    { values: [1, 2, 3, 4, 5, 6, 7] }, // too many
    { values: [2, 3, 3] }, // mean 8/3 blocks — level unreachable
    { values: [4, 4, 4] }, // already level
    { values: [9, 1, 2] }, // tower taller than 8 blocks
    { values: [-1, 3, 4] }, // negative
    { values: [15, 25, 11, 9], unit: 5 }, // not whole blocks
    { values: [1.5, 2, 2.5] }, // non-integer
    { values: [1, 2, 3], unit: 0 },
  ];
  for (const cfg of bad) assert.equal(validateMeanBalance(cfg), null, JSON.stringify(cfg));
  for (const cfg of bad) assert.equal(buildMeanBalancePlay(cfg), null);
});

test("invalid transfer falls back to a valid derived set", () => {
  const v = validateMeanBalance({ ...CFG, transfer: { values: [1, 2] } });
  assert.deepEqual(v.transfer.values, [15, 25, 30, 50]);
  assert.ok(choiceSet(v.transfer.values));
  assert.equal(stats(v.transfer.values).mean, 30);
});

test("buildMeanBalancePlay: six scenes, gates where the student acts", () => {
  const play = buildMeanBalancePlay(CFG);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["level", true],
      ["balance", false],
      ["change", true],
      ["transfer", false],
    ],
  );
  assert.doesNotMatch(play.title.en, /15/, "the title must not give away the mean");
  assert.match(play.printSummary.en, /\$60 ÷ 4 = \$15/);
  assert.match(play.printSummary.es, /\$60 ÷ 4 = \$15/);
});

test("placeCorrect moves the right answer off the first slot and keeps every option", () => {
  const opts = choiceSet([15, 25, 10, 10]);
  const placed = placeCorrect(opts, 73); // the play's seed for the 2-8 data
  assert.equal(placed.findIndex((o) => o.correct), 1);
  assert.equal(placed.length, opts.length);
});

test("mean-balance.js re-exports the model's validator", () => {
  assert.equal(reexported, validateMeanBalance);
});
