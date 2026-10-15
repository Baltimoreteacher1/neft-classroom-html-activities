/* Direct manipulation of the learning-lab models (curriculum/learning-labs/shared/direct.mjs).
 * Pure geometry: exact hits, then a property sweep over every lab so no pointer position can leave the
 * model's own control limits or break its math. */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { grab, isDirect, move } from "../curriculum/learning-labs/shared/direct.mjs";
import { controls, evaluate } from "../curriculum/learning-labs/shared/math.mjs";

const root = "curriculum/learning-labs";
const labs = readdirSync(root).filter((d) => existsSync(`${root}/${d}/content.json`));
const content = (id) => JSON.parse(readFileSync(`${root}/${id}/content.json`, "utf8"));
const drag = (model, values, p) => {
  const h = grab(model, values, p);
  return h ? move(model, values, p, h, controls(model)) : null;
};

// exact hits
const pct = { kind: "percent", mode: "grid", values: [35, 100] };
assert.deepEqual(
  drag(pct, [35, 100], { x: 35 + 6 * 23 + 10, y: 20 + 10 }),
  [7, 100],
  "square 7 shades 7%",
);
assert.deepEqual(
  drag(pct, [35, 100], { x: 35 + 9 * 23 + 10, y: 20 + 9 * 23 + 10 }),
  [100, 100],
  "last square is 100%",
);
assert.equal(drag(pct, [35, 100], { x: 400, y: 100 }), null, "outside the grid does nothing");

const arr = { kind: "array", mode: "design", values: [6, 4] };
{
  const size = Math.min(34, 450 / 4, 235 / 6),
    left = (600 - 4 * size) / 2;
  assert.deepEqual(
    drag(arr, [6, 4], { x: left + 2.5 * size, y: 22 + 1.5 * size }),
    [2, 3],
    "cell (row 2, col 3)",
  );
}
const ratio = { kind: "ratio", mode: "mixer", values: [3, 2] };
assert.deepEqual(
  drag(ratio, [3, 2], { x: 40 + 5 * 43 + 10, y: 100 }),
  [6, 2],
  "top row sets the first quantity",
);
assert.deepEqual(
  drag(ratio, [3, 2], { x: 40 + 7 * 43 + 10, y: 215 }),
  [3, 8],
  "bottom row sets the second quantity",
);

const line = { kind: "line", mode: "absolute", values: [-7, -3] };
{
  const sx = (n) => 45 + ((n + 10) / 20) * 510;
  assert.deepEqual(
    drag(line, [-7, -3], { x: sx(4), y: 160 }),
    [-7, 4],
    "nearest point moves to the tap",
  );
  assert.deepEqual(
    drag(line, [-7, -3], { x: sx(-9), y: 160 }),
    [-9, -3],
    "the other point is nearer to -9",
  );
}
const coord = { kind: "coordinates", mode: "distance", values: [-3, 4, 2, 4] };
assert.deepEqual(
  drag(coord, [-3, 4, 2, 4], { x: 300 + 5 * 19, y: 146 - 1 * 19 }),
  [-3, 4, 5, 1],
  "B follows the pointer",
);
assert.deepEqual(
  drag(coord, [-3, 4, 2, 4], { x: 300 + 40 * 19, y: 146 }),
  [-3, 4, 6, 0],
  "snaps inside the grid limit",
);

const bal = { kind: "balance", mode: "add", values: [4, 20, 10] };
assert.deepEqual(
  drag(bal, [4, 20, 10], { x: 60 + (480 * 16) / 30, y: 150 }),
  [4, 20, 16],
  "sliding sets the candidate x",
);
const expr = { kind: "expression", mode: "distribute", values: [3, 4, 5] };
assert.equal(
  drag(expr, [3, 4, 5], { x: 70 + 460 * 0.5, y: 100 })[2],
  4,
  "split at the middle makes x equal b",
);

const dec = { kind: "decimal", mode: "receipt", values: [2, 3] };
assert.deepEqual(
  drag(dec, [2, 3], { x: 45 + 210 * 0.5, y: 100 }),
  [5.25, 3],
  "left box slides the price (quarter-dollar steps)",
);
assert.deepEqual(
  drag(dec, [2, 3], { x: 345 + 210, y: 100 }),
  [2, 12],
  "right box slides the count to its max",
);
const pow = { kind: "power", mode: "order", values: [2, 3, 4] };
assert.equal(drag(pow, [2, 3, 4], { x: 70 + 460, y: 60 })[1], 5, "top row sets the exponent");
assert.equal(drag(pow, [2, 3, 4], { x: 70, y: 220 })[2], 0, "bottom row sets the added amount");
const poly = { kind: "area", mode: "polygon", values: [6, 4, 3] };
assert.deepEqual(
  drag(poly, [6, 4, 3], { x: 450, y: 30 }).slice(0, 2),
  [8, 12],
  "right and up: most sides, longest side",
);

// histogram: dragging a bar up pulls observations in from other bins, total unchanged; down pushes them out
{
  const hist = { kind: "data", mode: "histogram", values: [2, 4, 7, 8, 12, 13, 17, 22] };
  const f = controls(hist);
  const binsOf = (v) => {
    const b = Array(5).fill(0);
    v.forEach((n) => b[Math.min(4, Math.floor(n / 5))]++);
    return b;
  };
  const start = binsOf(hist.values);
  const up = drag(hist, hist.values, { x: 50 + (500 / 5) * 4 + 10, y: 240 - 25 * 3 });
  assert.equal(up.length, 8, "histogram keeps every observation");
  assert.equal(binsOf(up)[4], 3, "bin 4 grew to three observations");
  assert.equal(
    binsOf(up).reduce((x, y) => x + y),
    8,
  );
  const down = drag(hist, hist.values, { x: 50 + (500 / 5) * 1 + 10, y: 240 });
  assert.equal(binsOf(down)[1], 0, "bin 1 emptied");
  assert.ok(start[1] > 0);
  void f;
}
// solid net: the middle row sets height from y and the face width from x
{
  const net = { kind: "solid", mode: "net", values: [4, 3, 2] };
  const g = Math.min(500 / (2 * 4 + 2 * 3), 225 / (2 + 2 * 3)),
    top = 24 + 3 * g,
    left = (600 - (2 * 4 + 2 * 3) * g) / 2;
  const h = grab(net, net.values, { x: left + 2 * g, y: top + 1 * g }); // press inside the middle row
  const next = move(net, net.values, { x: left + 2 * g, y: top + 5 * g }, h, controls(net)); // then drag down
  assert.deepEqual(
    [next[0], next[2]],
    [2, 5],
    "face 1 width and the net height follow the pointer",
  );
  assert.equal(
    grab(net, net.values, { x: 100, y: 100 }, "pyramid"),
    null,
    "pyramid nets are not draggable",
  );
}

// every direct lab: sweep the whole picture
let direct = 0;
for (const id of labs) {
  const model = content(id).model;
  if (!isDirect(model)) continue;
  direct++;
  const fields = controls(model);
  for (let x = -20; x <= 620; x += 31)
    for (let y = -20; y <= 320; y += 29) {
      const values = [...model.values];
      const h = grab(model, values, { x, y });
      assert.ok(h, `${id}: grab returns a handle`);
      const next = move(model, values, { x, y }, h, fields);
      if (next === null) continue;
      next.forEach((v, i) => {
        const f = fields[i];
        assert.ok(v >= f.min && v <= f.max, `${id}: value ${i}=${v} within ${f.min}..${f.max}`);
        const k = (v - f.min) / f.step;
        assert.ok(Math.abs(k - Math.round(k)) < 1e-6, `${id}: value ${i}=${v} on the step grid`);
      });
      const r = evaluate(model, next);
      assert.ok(Number.isFinite(r.value), `${id}: evaluates to a number at (${x},${y})`);
    }
}
assert.equal(direct, labs.length, `at least 25 labs are directly manipulable (${direct})`);
console.log(
  `learning-labs-direct: ${direct} of ${labs.length} labs respond to touch; all pointer positions stay in range.`,
);
