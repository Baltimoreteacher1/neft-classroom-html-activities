// net-fold.test.mjs — the geometry of the nets and every number the net-fold play shows.
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildNetFoldPlay, validateNetFold as reexported } from "./net-fold.js";
import {
  boxArea,
  boxChoices,
  boxPairs,
  fitView,
  foldPoint,
  local,
  netFoldCopy,
  placeCorrect,
  poseFaces,
  projectPoint,
  rectPrism,
  squarePyramid,
  triPrism,
  unitSet,
  validateNetFold,
} from "./net-fold-model.js";

// The 5-6 config: the 8 × 5 × 3 in box of the worked example, then the 4 × 3 × 2 in box.
const CFG = { l: 8, w: 5, h: 3, unit: "in", transfer: { l: 4, w: 3, h: 2 } };

const key = (p) => p.map((v) => Math.round(v * 1e6) / 1e6).join(",");
/** Every edge of the closed solid, as a count of how many faces use it. */
function edgeCounts(solid) {
  const edges = new Map();
  for (const f of solid.faces) {
    const P = f.pts.map((q) => foldPoint(solid, f.id, q, 1));
    for (let i = 0; i < P.length; i++) {
      const k = [key(P[i]), key(P[(i + 1) % P.length])].sort().join("|");
      edges.set(k, (edges.get(k) || 0) + 1);
    }
  }
  return edges;
}
const corners = (solid) => new Set(solid.faces.flatMap((f) => f.pts.map((q) => key(foldPoint(solid, f.id, q, 1)))));

test("a rectangular-prism net folds shut: 12 edges, each shared by exactly two faces, 8 corners", () => {
  for (const [l, w, h] of [[8, 5, 3], [4, 3, 2], [7, 2, 5]]) {
    const s = rectPrism(l, w, h);
    const e = edgeCounts(s);
    assert.equal(e.size, 12);
    assert.ok([...e.values()].every((n) => n === 2), `${l}x${w}x${h}`);
    assert.equal(corners(s).size, 8);
  }
});

test("the folded box has the right size: bounding extents are l, w, h in some order", () => {
  const s = rectPrism(8, 5, 3);
  const pts = s.faces.flatMap((f) => f.pts.map((q) => foldPoint(s, f.id, q, 1)));
  const span = [0, 1, 2].map((k) => {
    const v = pts.map((p) => p[k]);
    return Math.round((Math.max(...v) - Math.min(...v)) * 1e6) / 1e6;
  });
  assert.deepEqual(span.sort((a, b) => a - b), [3, 5, 8]);
});

test("a square-pyramid net folds shut: 8 edges each shared twice, 5 corners, all four apexes meet", () => {
  for (const [b, sl] of [[6, 8], [4, 5]]) {
    const s = squarePyramid(b, sl);
    const e = edgeCounts(s);
    assert.equal(e.size, 8);
    assert.ok([...e.values()].every((n) => n === 2));
    assert.equal(corners(s).size, 5);
    // the apex is `sl` from the middle of each base edge, measured along the face (slant height)
    const apex = s.faces.slice(1).map((f) => foldPoint(s, f.id, f.pts[2], 1));
    for (const p of apex) assert.ok(apex.every((q) => key(q) === key(p)));
  }
});

test("pyramid: slant height is the face's own height, and the pyramid's height is shorter", () => {
  const s = squarePyramid(6, 8);
  const apex = foldPoint(s, "faceN", s.byId.faceN.pts[2], 1);
  const mid = foldPoint(s, "faceN", [(s.byId.faceN.pts[0][0] + s.byId.faceN.pts[1][0]) / 2, s.byId.faceN.pts[0][1]], 1);
  const slant = Math.hypot(...apex.map((v, i) => v - mid[i]));
  assert.ok(Math.abs(slant - 8) < 1e-9);
  const centre = foldPoint(s, "base", local(s, [3, 3]), 1);
  const height = Math.hypot(...apex.map((v, i) => v - centre[i]));
  assert.ok(Math.abs(height - Math.sqrt(64 - 9)) < 1e-9, "h² + 3² = 8²");
  assert.ok(height < slant);
});

test("triangular prism net: faces and areas of the 5-7 worked example", () => {
  const s = triPrism(6, 4, 5, 10);
  assert.equal(s.faces.length, 5);
  assert.deepEqual(s.faces.map((f) => f.area), [50, 60, 50, 12, 12]);
  assert.equal(s.faces.reduce((a, f) => a + f.area, 0), 184);
  assert.ok(Math.abs(Math.hypot(3, 4) - 5) < 1e-12);
});

test("facing: the closed box shows Top, Front and Right; Bottom, Back and Left are hidden; flat shows all", () => {
  const s = rectPrism(8, 5, 3);
  const at = (t) => Object.fromEntries(poseFaces(s, t).map((f) => [f.id, f.facing]));
  assert.deepEqual(at(1), { top: true, front: true, bottom: false, right: true, back: false, left: false });
  assert.ok(Object.values(at(0)).every(Boolean));
  const p = squarePyramid(6, 8);
  const pf = Object.fromEntries(poseFaces(p, 1).map((f) => [f.id, f.facing]));
  assert.equal(pf.base, false, "the base faces away from a viewer looking down at the tip");
});

test("every pose of every solid stays inside the stage", () => {
  for (const solids of [[rectPrism(8, 5, 3)], [rectPrism(4, 3, 2)], [squarePyramid(6, 8)], [triPrism(6, 4, 5, 10)]]) {
    const fit = fitView(solids, 480, 270, 16);
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const { k, ox, oy } = fit.at(solids[0].foldable ? t : 0);
      for (const f of poseFaces(solids[0], solids[0].foldable ? t : 0)) {
        for (const p of f.pts3) {
          const x = ox + p[0] * k;
          const y = oy + p[1] * k;
          assert.ok(x >= 0 && x <= 480 && y >= 0 && y <= 270, `${solids[0].kind} t=${t} (${x | 0},${y | 0})`);
        }
      }
    }
  }
});

test("projectPoint agrees with poseFaces", () => {
  const s = rectPrism(8, 5, 3);
  const f = poseFaces(s, 0.6)[3];
  assert.deepEqual(f.pts3[1], projectPoint(s, f.id, s.byId[f.id].pts[1], 0.6));
});

test("surface area: three pairs, independently recomputed", () => {
  assert.equal(boxArea(8, 5, 3), 158); // 2·40 + 2·24 + 2·15
  assert.equal(boxArea(4, 3, 2), 52); // 2·12 + 2·8 + 2·6
  const sixFaces = (l, w, h) => [l * w, l * w, l * h, l * h, w * h, w * h].reduce((a, b) => a + b, 0);
  for (const [l, w, h] of [[8, 5, 3], [4, 3, 2], [9, 2, 6]]) assert.equal(boxArea(l, w, h), sixFaces(l, w, h));
  assert.deepEqual(boxPairs(8, 5, 3).map((p) => p.area), [40, 24, 15]);
  const s = rectPrism(8, 5, 3);
  assert.equal(s.faces.reduce((a, f) => a + f.area, 0), 158);
  for (const p of boxPairs(8, 5, 3)) {
    assert.deepEqual(p.ids.map((id) => s.byId[id].area), [p.area, p.area]);
  }
});

test("choice sets: exactly one correct; wrong values are real misconceptions", () => {
  for (const [l, w, h] of [[8, 5, 3], [4, 3, 2]]) {
    const c = boxChoices(l, w, h);
    assert.equal(c.length, 4);
    assert.equal(c.filter((o) => o.correct).length, 1);
    assert.equal(c.find((o) => o.correct).value, boxArea(l, w, h));
    assert.equal(c.find((o) => o.kind === "once").value, l * w + l * h + w * h);
    assert.equal(c.find((o) => o.kind === "volume").value, l * w * h);
    assert.ok(c.find((o) => o.kind === "missing").value < boxArea(l, w, h));
    assert.equal(new Set(c.map((o) => o.value)).size, 4);
  }
  assert.deepEqual(boxChoices(4, 3, 2).map((o) => o.value), [52, 26, 24, 40]);
  assert.equal(boxChoices(6, 3, 2), null, "6 × 3 × 2: the volume (36) equals the 'one of each pair' sum (36)");
});

test("placeCorrect moves the right answer off the first slot", () => {
  const placed = placeCorrect(boxChoices(4, 3, 2), 4 * 7 + 3 + 2);
  assert.ok(placed.findIndex((o) => o.correct) > 0);
  assert.equal(placed.length, 4);
});

test("validation accepts the lesson config and refuses configs the stage cannot draw", () => {
  const v = validateNetFold(CFG);
  assert.deepEqual([v.l, v.w, v.h, v.unit.sq.en], [8, 5, 3, "in²"]);
  assert.equal(validateNetFold({ ...CFG, transfer: undefined }).transfer.l, 4);
  const bad = [
    null,
    {},
    { l: 8, w: 5 },
    { ...CFG, l: 5 }, // l = w: the pairs would not be three different sizes
    { ...CFG, h: 3.5 },
    { ...CFG, l: 13 },
    { ...CFG, w: 0 },
    { ...CFG, unit: "furlong" },
    { ...CFG, transfer: { l: 4, w: 4, h: 2 } },
    { ...CFG, transfer: { l: 8, w: 5, h: 3 } }, // same box as the main one
    { ...CFG, transfer: "small" },
  ];
  for (const cfg of bad) {
    assert.equal(validateNetFold(cfg), null, JSON.stringify(cfg));
    assert.equal(buildNetFoldPlay(cfg), null, JSON.stringify(cfg));
  }
});

test("units: square and cubic labels for each lesson unit", () => {
  assert.equal(unitSet("in").sq.es, "pulg²");
  assert.equal(unitSet("cm").cu.en, "cm³");
  assert.equal(unitSet("units").sq.en, "square units");
  assert.equal(unitSet("parsec"), null);
});

test("the play: five scenes, gates where the student acts, no giveaway in the title", () => {
  const play = buildNetFoldPlay(CFG);
  assert.deepEqual(play.scenes.map((s) => [s.id, !!s.gate]), [
    ["net", false],
    ["predict", true],
    ["fold", true],
    ["areas", false],
    ["transfer", false],
  ]);
  assert.doesNotMatch(play.title.en, /158|52/);
  assert.match(play.printSummary.en, /40 \+ 40 \+ 24 \+ 24 \+ 15 \+ 15 = 158 in²/);
  assert.match(play.printSummary.es, /= 158 pulg²/);
  assert.ok(reexported === validateNetFold);
});

test("copy: every statement is true and Spanish has no leftover English cue words", () => {
  const T = netFoldCopy(validateNetFold(CFG));
  assert.match(T.areasDone.en, /2 × 40 \+ 2 × 24 \+ 2 × 15 = 80 \+ 48 \+ 30 = 158/);
  assert.match(T.transferOk.en, /2 × 12 \+ 2 × 8 \+ 2 × 6 = 24 \+ 16 \+ 12 = 52 in²/);
  assert.equal(T.transferExpr, "12 + 12 + 8 + 8 + 6 + 6");
  assert.match(T.pairLine(2).en, /Left and Right: each is 5 × 3 = 15, so together 2 × 15 = 30/);
  for (const id of ["front", "back", "left"]) {
    assert.ok(T.faceCue(id).en.endsWith("?") && T.faceCue(id).es.endsWith("?"));
    assert.doesNotMatch(T.faceCue(id).en, /Bottom/, "a cue never names the answer");
  }
  for (const kind of ["once", "volume", "missing"]) {
    const c = T.miss(kind, 99);
    assert.ok(c.en.includes("99") && c.es.includes("99") && c.en.includes("?") && c.es.includes("?"));
    assert.doesNotMatch(c.en + c.es, /\b52\b|\b158\b/, "a cue never states the total");
  }
  const spanish = JSON.stringify([T.netSay.es, T.predictQ.es, T.foldDone.es, T.transferSay.es, T.explainFrame.es]);
  assert.doesNotMatch(spanish, /\b(the|box|face|faces|fold|net)\b/i);
  assert.doesNotMatch(spanish, /\busted|vosotros/i);
});
