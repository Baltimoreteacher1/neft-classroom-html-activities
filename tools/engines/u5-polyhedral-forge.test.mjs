// Polyhedral Forge round generators, checked independently of the game's judges.
// 300 seeds x 4 levels: shield areas by the shoelace formula on the drawn
// vertices, surface areas by summing 3-D face areas (cross products) of the
// closed solid that foldSolid builds, chamber volumes by exact fraction
// multiplication of the edge lengths. Also: the fold is rigid (every edge keeps
// its length at every fold amount), the net lies flat, no round starts solved,
// answers fit the controls, and each judge accepts the truth and rejects
// corrupted values.
import assert from "node:assert/strict";
import { frac, rng } from "../../math/games/engines/core/math.js";
import {
  AREA_MAX,
  COUNT_MAX,
  checkSolid,
  faceHalves,
  foldSolid,
  judgeChamber,
  judgeRegular,
  judgeShield,
  makeChamber,
  makeRegular,
  makeShield,
  newSolid,
  REG_TRI_MAX,
  regTotalMax,
  SA_MAX,
  VOL_MAX,
} from "../../math/games/engines/u5-polyhedral-forge/math.js";

const shoelace = (pts) => {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    s += x0 * y1 - x1 * y0;
  }
  return Math.abs(s) / 2;
};

function shieldPolygon(s) {
  if (s.kind === "para")
    return [
      [0, 0],
      [s.b, 0],
      [s.b + s.off, s.h],
      [s.off, s.h],
    ];
  if (s.kind === "tri")
    return [
      [0, 0],
      [s.b, 0],
      [s.b - s.off, s.h],
    ];
  return [
    [0, 0],
    [s.b, 0],
    [s.b, s.h],
    [s.off, s.h],
  ];
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a) => Math.hypot(a[0], a[1], a[2]);
const polyArea3 = (pts) => {
  // fan triangulation of a planar convex polygon
  let A = 0;
  for (let i = 1; i + 1 < pts.length; i++)
    A += norm(cross(sub(pts[i], pts[0]), sub(pts[i + 1], pts[0]))) / 2;
  return A;
};

function faces(solid, uq) {
  const out = new Float64Array(72);
  const prism = solid.kind === "prism";
  foldSolid(out, prism ? 0 : 1, prism ? solid.L : solid.s, prism ? solid.W : solid.l, solid.H, uq);
  const sizes = prism ? [4, 4, 4, 4, 4, 4] : [4, 3, 3, 3, 3];
  const list = [];
  let v = 0;
  for (const n of sizes) {
    const f = [];
    for (let k = 0; k < n; k++, v++) f.push([out[3 * v], out[3 * v + 1], out[3 * v + 2]]);
    list.push(f);
  }
  return list;
}

const edgeLengths = (fs) => fs.map((f) => f.map((p, i) => norm(sub(f[(i + 1) % f.length], p))));
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`);

let shields = 0;
let solids = 0;
let chambers = 0;
let regulars = 0;
const kinds = new Set();
const regShapes = new Set();

// Independent: one centre triangle with base s on the x-axis and apex at
// height a (the apothem) has shoelace area ½·s·a; the polygon is n of them.
// Exact in hundredths: s and a·10 are integers, so 100·area = 5·s·(10a) per triangle.
function regularTruth(r) {
  const a = r.a10 / 10;
  const tri = shoelace([
    [-r.s / 2, 0],
    [r.s / 2, 0],
    [0, a],
  ]);
  const tri100 = 5 * r.s * r.a10;
  assert.ok(Math.abs(tri * 100 - tri100) < 1e-6, "shoelace triangle = ½ × side × apothem");
  return { tri100, total100: r.n * tri100 };
}
for (let seed = 1; seed <= 300; seed++) {
  for (let level = 1; level <= 4; level++) {
    const next = rng(seed * 37 + level);

    // ---- shield plate ----
    const s = makeShield(level, next);
    kinds.add(s.kind);
    assert.equal(
      s.h * s.h + s.off * s.off,
      s.slant * s.slant,
      "slanted side is the true hypotenuse",
    );
    assert.ok(s.off < s.b, "the cut-off triangle fits inside the base");
    const area = shoelace(shieldPolygon(s));
    assert.equal(area * 2, s.areaHalves, `seed ${seed} L${level}: ${JSON.stringify(s)} area`);
    if (s.kind === "trap") assert.equal(s.b - s.off, s.b2, "top base length");
    assert.ok(area > 0 && area <= AREA_MAX, `area fits the dial: ${area}`);
    assert.equal(judgeShield(s, area).key, "ok", "judge accepts the true area");
    assert.notEqual(judgeShield(s, area + 0.5).key, "ok");
    assert.notEqual(judgeShield(s, area - 0.5).key, "ok");
    assert.notEqual(judgeShield(s, 0).key, "ok", "starts solved at dial 0");
    const slantArea = shoelace(shieldPolygon(s)) * (s.slant / s.h);
    assert.equal(judgeShield(s, slantArea).tag, "slant-as-height", "slant misconception named");
    if (s.kind !== "para") assert.equal(judgeShield(s, area * 2).tag, "forgot-half");
    assert.match(judgeShield(s, area + 1).key, /high|slant|forgotHalf/);
    assert.equal(judgeShield(s, Math.max(0, area - 1)).key, "low");
    if (level === 1) assert.notEqual(s.kind, "trap");
    shields++;

    // ---- solid: surface area from the closed solid's real 3-D faces ----
    const solid = newSolid(level, next);
    const closed = faces(solid, 0);
    const sa = closed.reduce((t, f) => t + polyArea3(f), 0);
    near(sa, solid.sa, `seed ${seed} L${level}: ${JSON.stringify(solid)} surface area`);
    faceHalves(solid).forEach((h2, i) => near(polyArea3(closed[i]) * 2, h2, "face area table"));
    assert.ok(solid.sa <= SA_MAX && Number.isInteger(solid.sa), "SA fits the dial");
    // rigid fold: edge lengths never change; the net is flat
    const ref = edgeLengths(closed);
    for (const uq of [2500, 5000, 7500, 10000]) {
      const e = edgeLengths(faces(solid, uq));
      e.forEach((f, i) => f.forEach((len, j) => near(len, ref[i][j], `rigid fold uq ${uq}`)));
    }
    for (const f of faces(solid, 10000)) for (const p of f) near(p[2], 0, "net lies flat");
    if (solid.kind === "prism") {
      for (const p of closed[5]) near(p[2], solid.H, "lid closes on top");
    } else {
      const apexes = [closed[1][2], closed[2][2], closed[3][2], closed[4][2]];
      for (const a of apexes) {
        near(a[0], solid.s / 2, "apex x");
        near(a[1], solid.s / 2, "apex y");
        near(a[2], apexes[0][2], "apexes meet");
      }
    }
    assert.equal(checkSolid(solid, solid.sa).key, "ok");
    assert.notEqual(checkSolid(solid, solid.sa + 1).key, "ok");
    assert.notEqual(checkSolid(solid, solid.sa - 1).key, "ok");
    assert.notEqual(checkSolid(solid, 0).key, "ok", "starts solved at dial 0");
    if (solid.kind === "prism") assert.equal(checkSolid(solid, solid.sa / 2).tag, "half-the-faces");
    else assert.equal(checkSolid(solid, solid.s ** 2 + 4 * solid.s * solid.l).tag, "forgot-half");
    if (level === 1) assert.equal(solid.kind, "prism");
    solids++;

    // ---- chamber ----
    const c = makeChamber(level, next);
    const vol = [c.hl, c.hw, c.hh].reduce((f, h) => frac(f.n * h, f.d * 2), { n: 1, d: 1 });
    assert.equal(vol.n * (8 / vol.d), c.cubes, `seed ${seed}: volume = cubes x 1/8`);
    assert.ok(
      [c.hl, c.hw, c.hh].some((h) => h % 2 === 1),
      "a fractional edge",
    );
    for (const h of [c.hl, c.hw, c.hh])
      assert.ok(h >= 2 && h <= COUNT_MAX, "count fits the slider");
    const v = vol.n / vol.d;
    assert.ok(v <= VOL_MAX, "volume fits the dial");
    assert.equal(judgeChamber(c, c.hl, c.hw, c.hh, v).key, "ok", "judge accepts the truth");
    assert.notEqual(judgeChamber(c, c.hl, c.hw, c.hh, v + 0.125).key, "ok");
    assert.notEqual(judgeChamber(c, c.hl, c.hw, c.hh, v - 0.125).key, "ok");
    assert.equal(judgeChamber(c, c.hl + 1, c.hw, c.hh, v).key, "tooMany");
    assert.match(judgeChamber(c, c.hl, c.hw - 1, c.hh, v).key, /tooFew|inchCubes/);
    // the game parks the counts at 1 and the dial at 0: never solved at start
    assert.notEqual(judgeChamber(c, 1, 1, 1, 0).key, "ok");
    if (c.cubes <= VOL_MAX)
      assert.equal(judgeChamber(c, c.hl, c.hw, c.hh, c.cubes).tag, "cubes-as-volume");
    chambers++;

    // ---- regular polygon (lesson 5-9) ----
    const g = makeRegular(level, next);
    regShapes.add(g.n);
    if (level === 1) assert.equal(g.n, 6, "level 1 is the hexagon");
    assert.ok([5, 6, 8].includes(g.n));
    assert.equal(g.twoDials, level <= 2, "levels 3-4 ask for the total only");
    // the given apothem is the real apothem of a regular n-gon, to the nearest tenth
    const trueA = g.s / (2 * Math.tan(Math.PI / g.n));
    assert.ok(Math.abs(g.a10 / 10 - trueA) <= 0.05 + 1e-9, `apothem ${g.a10 / 10} vs ${trueA}`);
    const { tri100, total100 } = regularTruth(g);
    assert.equal(tri100 % 10, 0, "one triangle lands on the 0.1 grid");
    assert.equal(total100 % 10, 0, "total lands on the 0.1 grid");
    assert.equal(g.tri10 * 10, tri100, `seed ${seed} L${level} ${JSON.stringify(g)} one triangle`);
    assert.equal(g.total10 * 10, total100, "total = n triangles");
    // the rounded apothem gives an estimate within half a tenth per unit of perimeter
    const trueArea = (g.n * g.s * trueA) / 2;
    assert.ok(
      Math.abs(total100 / 100 - trueArea) <= (g.n * g.s * 0.05) / 2 + 1e-9,
      "close estimate",
    );
    const triV = tri100 / 100;
    const totV = total100 / 100;
    assert.ok(triV <= REG_TRI_MAX || !g.twoDials, "triangle fits its dial");
    assert.ok(totV > 0 && totV <= regTotalMax(level), `total ${totV} fits its dial`);
    assert.equal(judgeRegular(g, triV, totV).key, "ok", "judge accepts the truth");
    assert.notEqual(judgeRegular(g, 0, 0).key, "ok", "starts solved with dials at 0");
    assert.notEqual(judgeRegular(g, triV, totV + 0.1).key, "ok");
    assert.notEqual(judgeRegular(g, triV, totV - 0.1).key, "ok");
    const half = (g.s * g.a10) / 10; // side × apothem
    const sideH = (g.s * g.s) / 2; // ½ × side × side
    assert.equal(judgeRegular(g, triV, triV).tag, "one-triangle-only");
    assert.equal(judgeRegular(g, triV, g.n * half).tag, "forgot-half");
    assert.equal(judgeRegular(g, triV, g.n * sideH).tag, "side-as-apothem");
    for (const k of [g.n - 1, g.n + 1]) {
      const r = judgeRegular(g, triV, Math.round(k * triV * 10) / 10);
      assert.notEqual(r.key, "ok");
      if (Math.round(k * triV * 10) !== Math.round(g.n * sideH * 10))
        assert.equal(r.tag, "wrong-triangle-count", `count ${k} for n ${g.n}`);
    }
    if (g.twoDials) {
      assert.equal(judgeRegular(g, half, totV).tag, "forgot-half", "triangle without the half");
      assert.equal(judgeRegular(g, sideH, totV).tag, "side-as-apothem", "side as the height");
      assert.notEqual(
        judgeRegular(g, triV + 0.1, totV).key,
        "ok",
        "a wrong triangle blocks the solve",
      );
      assert.notEqual(judgeRegular(g, triV - 0.1, totV).key, "ok");
    } else {
      assert.equal(judgeRegular(g, 0, totV).key, "ok", "one-dial rounds ignore the triangle dial");
    }
    regulars++;
  }
}
assert.deepEqual([...regShapes].sort(), [5, 6, 8], "pentagon, hexagon and octagon all appear");
assert.deepEqual([...kinds].sort(), ["para", "trap", "tri"], "all three plate kinds appear");
console.log(
  `ok u5-polyhedral-forge: ${shields} plates, ${solids} solids, ${chambers} chambers, ${regulars} regular polygons checked independently`,
);
