import assert from "node:assert/strict";
import {
  rectArea,
  triangleArea,
  polygonArea,
  compositeArea,
  prismVolume,
  decompose,
} from "./geometry-math.js";

// rectArea
assert.equal(rectArea(4, 3), 12);
assert.equal(rectArea(0, 5), 0);
assert.equal(rectArea(2.5, 4), 10);

// triangleArea
assert.equal(triangleArea(6, 4), 12);
assert.equal(triangleArea(3, 3), 4.5);

// polygonArea (shoelace) — a 4x3 rectangle as a polygon
assert.equal(
  polygonArea([
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 0, y: 3 },
  ]),
  12,
);
// right triangle base 6, height 4 -> 12; winding-independent (CW points)
assert.equal(
  polygonArea([
    { x: 0, y: 0 },
    { x: 0, y: 4 },
    { x: 6, y: 0 },
  ]),
  12,
);
// supports {x,z} too
assert.equal(
  polygonArea([
    { x: 0, z: 0 },
    { x: 2, z: 0 },
    { x: 2, z: 2 },
    { x: 0, z: 2 },
  ]),
  4,
);
assert.equal(polygonArea([{ x: 0, y: 0 }]), 0);

// compositeArea — L-shape: 4x3 plus 2x2 = 12 + 4 = 16
assert.equal(
  compositeArea([
    { type: "rect", w: 4, h: 3 },
    { type: "rect", w: 2, h: 2 },
  ]),
  16,
);
// with a subtracted hole: 5x5 minus 2x2 = 21
assert.equal(
  compositeArea([
    { type: "rect", w: 5, h: 5 },
    { type: "rect", w: 2, h: 2, sign: -1 },
  ]),
  21,
);
// mixed parts: rect 4x3 + triangle base 4 height 2 = 12 + 4 = 16
assert.equal(
  compositeArea([
    { type: "rect", w: 4, h: 3 },
    { type: "triangle", base: 4, height: 2 },
  ]),
  16,
);

// prismVolume
assert.equal(prismVolume(2, 3, 4), 24);
assert.equal(prismVolume(1, 1, 1), 1);
assert.equal(prismVolume(2.5, 2, 4), 20);

// decompose
const d = decompose([
  { type: "rect", w: 4, h: 3 },
  { type: "rect", w: 2, h: 2, sign: -1 },
]);
assert.equal(d.total, 8);
assert.equal(d.parts.length, 2);
assert.equal(d.parts[0].area, 12);
assert.equal(d.parts[0].signedArea, 12);
assert.equal(d.parts[1].area, 4);
assert.equal(d.parts[1].signedArea, -4);

console.log("geometry-math: all assertions passed");
