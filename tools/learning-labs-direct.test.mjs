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
assert.ok(direct >= 33, `at least 25 labs are directly manipulable (${direct})`);
console.log(
  `learning-labs-direct: ${direct} of ${labs.length} labs respond to touch; all pointer positions stay in range.`,
);
