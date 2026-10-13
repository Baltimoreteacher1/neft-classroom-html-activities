import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const ctx = {};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync("curriculum/math-workbench/wb-math.js", "utf8"), ctx);
const M = ctx.WBMath;

// --- fractions and decimals parse exactly
assert.deepEqual({ ...M.parseFraction("3/2") }, { n: 3, d: 2 });
assert.deepEqual({ ...M.parseFraction("1 1/2") }, { n: 3, d: 2 });
assert.deepEqual({ ...M.parseFraction("1.5") }, { n: 3, d: 2 });
assert.deepEqual({ ...M.parseFraction("-0.25") }, { n: -1, d: 4 });
assert.equal(M.parseFraction("1/0"), null);
assert.equal(M.parseFraction("abc"), null);
assert.equal(M.parseRate("2/3").toFixed(3), "0.667");

// --- the balance never changes equality and never solves
const start = { left: { x: 1, one: 2 }, right: { x: 0, one: 8 } };
assert.equal(M.balanceText(start), "x + 2 = 8");
const sub = M.balanceOp(start, "sub1");
assert.equal(M.balanceText(sub), "x + 1 = 7");
assert.equal(M.balanceTilt(start, 6), "level", "x = 6 balances x + 2 = 8");
assert.equal(M.balanceTilt(start, 5), "right");
assert.equal(
  M.balanceTilt(start, NaN),
  "level",
  "no tested value means the scale just shows the equation",
);
assert.equal(
  M.balanceOp({ left: { x: 1, one: 2 }, right: { x: 0, one: 8 } }, "subx"),
  null,
  "cannot take an x from a side with none",
);
assert.equal(
  M.balanceOp({ left: { x: 2, one: 3 }, right: { x: 0, one: 8 } }, "half"),
  null,
  "cannot halve odd blocks",
);
const dbl = M.balanceOp({ left: { x: 1, one: 1 }, right: { x: 0, one: 3 } }, "double");
for (const x of [0, 1, 2, 5, 7.5]) {
  const before = M.balanceTilt({ left: { x: 1, one: 1 }, right: { x: 0, one: 3 } }, x);
  assert.equal(M.balanceTilt(dbl, x), before, "doubling both sides keeps the same solutions");
}

// --- factor tree checks
assert.equal(M.checkSplit({ v: 24, kids: [{ v: 4 }, { v: 6 }] }), "ok");
assert.equal(M.checkSplit({ v: 24, kids: [{ v: 5 }, { v: 6 }] }), "bad");
assert.equal(M.checkSplit({ v: 24, kids: [{ v: 1 }, { v: 24 }] }), "bad", "1 x n is not a split");
assert.deepEqual(
  Array.from(M.leafValues({ v: 12, kids: [{ v: 2 }, { v: 6, kids: [{ v: 2 }, { v: 3 }] }] })),
  [2, 2, 3],
);
assert.equal(M.isPrime(13), true);
assert.equal(M.isPrime(21), false);

// --- every net folds closed: each folded vertex is shared by at least two faces
const key = (p) => p.map((v) => Math.round(v * 1000) / 1000 + 0).join(",");
for (const [shape, verts] of [
  ["cube", 8],
  ["rectprism", 8],
  ["sqpyramid", 5],
  ["triprism", 6],
]) {
  const faces = M.netFaces(shape, { l: 4, w: 3, h: 2 });
  const count = {};
  for (const f of M.foldNet(faces, 1)) for (const p of f) count[key(p)] = (count[key(p)] || 0) + 1;
  assert.equal(Object.keys(count).length, verts, `${shape} folds to ${verts} vertices`);
  assert.equal(Object.values(count).filter((c) => c < 2).length, 0, `${shape} has no loose corner`);
  const flat = M.foldNet(faces, 0).flat();
  assert.ok(
    flat.every((p) => Math.abs(p[2]) < 1e-9),
    `${shape} is flat at fold 0`,
  );
}

// --- composite figures: parts tile the outline, and the labels carry no area
for (const shape of ["L", "T", "U"]) {
  const d = { w: 8, h: 6, cw: shape === "L" ? 3 : 2, ch: 2 };
  const add = M.compositeParts(shape, shape === "L" ? "vertical" : "add", d);
  const cut = M.compositeParts(shape, "cut", d);
  const sum = (g, cutSign) => g.parts.reduce((n, p) => n + (p.cut ? -cutSign : 1) * p.w * p.h, 0);
  assert.equal(
    sum(add, 1),
    sum(cut, 1),
    `${shape}: adding the parts and subtracting the cut-out give the same figure`,
  );
}

// --- prism cubes: only whole cubes fit
assert.deepEqual(
  {
    ...M.prismCubes(
      M.parseFraction("3/2"),
      M.parseFraction("1"),
      M.parseFraction("1/2"),
      M.parseFraction("1/2"),
    ),
  },
  { ok: true, nl: 3, nw: 2, nh: 1 },
);
assert.equal(
  M.prismCubes(
    M.parseFraction("3/2"),
    M.parseFraction("1"),
    M.parseFraction("1/2"),
    M.parseFraction("1"),
  ).ok,
  false,
);

// --- mean and MAD
const s = M.stats({ 2: 2, 6: 2 });
assert.equal(s.mean, 4);
assert.equal(s.mad, 2);
assert.ok(Number.isNaN(M.stats({}).mean));

// --- ink: the point eraser splits a stroke and never mutates the original
const stroke = {
  tool: "pen",
  size: 4,
  color: "#000",
  pts: Array.from({ length: 21 }, (_, i) => ({ x: i * 10, y: 0, t: i })),
};
const before = JSON.stringify(stroke);
const pieces = M.splitStroke(stroke, { x: 100, y: 0 }, 16);
assert.equal(pieces.length, 2, "rubbing the middle leaves two pieces");
assert.ok(pieces.every((p) => p.pts.length >= 2));
assert.equal(
  JSON.stringify(stroke),
  before,
  "the original stroke is untouched (history shares it)",
);
assert.equal(M.splitStroke(stroke, { x: 100, y: 500 }, 16), null, "a miss changes nothing");
const proj = M.projectOnLine(50, 30, { x: 0, y: 0 }, { x: 100, y: 0 });
assert.deepEqual([proj.x, proj.y, proj.dist], [50, 0, 30]);

assert.equal(M.quadrant(-2, 3), "Quadrant II");
assert.equal(M.quadrant(0, 4), "y-axis");

console.log("wb-math: all assertions passed");
