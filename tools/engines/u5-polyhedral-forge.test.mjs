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
  judgeShield,
  makeChamber,
  makeShield,
  newSolid,
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
const kinds = new Set();
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
  }
}
assert.deepEqual([...kinds].sort(), ["para", "trap", "tri"], "all three plate kinds appear");
console.log(
  `ok u5-polyhedral-forge: ${shields} plates, ${solids} solids, ${chambers} chambers checked independently`,
);
