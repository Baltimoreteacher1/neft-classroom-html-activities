// A generated item's words must agree with its figure. These are the disagreements the forensic audit measured.
//   node tools/studio-gen-figures.test.mjs
import assert from "node:assert/strict";
import { loadStudio } from "./lib/studio-vm.mjs";

const ctx = loadStudio({ gen: true, viz: true });
const G = ctx.StudioGen;
const minus = (s) => Number(String(s).replace(/[−–]/g, "-").replace(/,/g, ""));

// 7-1 integerOpposites: "Point W shows N" must put W at N on the line (it printed the tick count and plotted tick x unit)
let checked = 0;
for (let level = 1; level <= 4; level++)
  for (let seed = 1; seed <= 300; seed++) {
    const it = G.make("integerOpposites", level, seed);
    const m = /Point (\w) shows (−?-?\d+)/.exec(it.q || "");
    if (!m || !it.viz?.marks) continue;
    const at = it.viz.marks.find((x) => x.l === m[1]);
    assert.ok(at, `L${level} #${seed}: point ${m[1]} is on the figure`);
    assert.equal(
      at.v,
      minus(m[2]),
      `L${level} #${seed}: "${it.q.slice(0, 60)}" but ${m[1]} is plotted at ${at.v}`,
    );
    checked++;
  }
assert.ok(checked > 50, `checked ${checked} stems`);
console.log(`studio-gen-figures: ${checked} integer-opposite stems agree with their figures.`);

// 7-7 polygonCoordinates "which point is vertex C": every drawn segment is a SIDE of the rectangle (never a diagonal), and a
// vertex that is not named is not labelled with a letter the question never uses.
let drawn = 0;
for (let level of [1, 3])
  for (let seed = 1; seed <= 300; seed++) {
    const it = G.make("polygonCoordinates", level, seed);
    if (!/Three vertices of rectangle ABCD/.test(it.q)) continue;
    const pts = it.viz.points;
    for (const [a, b] of it.viz.segments || []) {
      const shareX = pts[a].x === pts[b].x;
      const shareY = pts[a].y === pts[b].y;
      assert.ok(
        shareX !== shareY,
        `L${level} #${seed}: segment ${pts[a].l}${pts[b].l} is a diagonal, not a side`,
      );
      drawn++;
    }
    assert.equal(pts.length, 3, "three vertices are shown");
  }
assert.ok(drawn > 100, `checked ${drawn} segments`);
for (let seed = 1; seed <= 300; seed++) {
  const it = G.make("polygonCoordinates", 3, seed);
  if (/Opposite corners are/.test(it.q))
    assert.equal(
      it.viz.points
        .map((p) => p.l)
        .filter(Boolean)
        .sort()
        .join(),
      "P,Q",
      `#${seed}: only P and Q are named`,
    );
}
console.log(
  `studio-gen-figures: ${drawn} rectangle segments are sides; opposite-corner figures label only P and Q.`,
);
