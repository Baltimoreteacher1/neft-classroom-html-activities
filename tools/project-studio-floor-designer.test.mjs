/** Pure-logic tests for the Project Studio floor-plan designer (area missions). */
import assert from "node:assert/strict";
import { addCheckpoint, cleanCheckpoints } from "../curriculum/projects/studio/checkpoints.mjs";
import { DESIGNERS } from "../curriculum/projects/studio/designers.mjs";
import {
  addItem,
  boxOnFloor,
  cleanLayout,
  evaluate,
  layoutReport,
  MAX_ITEMS,
  nudgeItem,
  roomOf,
  rotateItem,
  sizeOf,
} from "../curriculum/projects/studio/floor-designer.mjs";
import { PROJECTS } from "../curriculum/projects/studio/projects.mjs";

const room = roomOf({ a: 6, b: 4, c: 3, d: 2, f: 2, g: 1, h: 1.5 });
let n = 0;
const test = (name, fn) => {
  fn();
  n++;
};

test("roomOf rejects invalid values", () => {
  assert.equal(roomOf(null), null);
  assert.equal(roomOf({ a: 6, b: Number.NaN, c: 3, d: 2, f: 2, g: 1 }), null);
});

test("boxOnFloor: rectangle, nook and outside", () => {
  assert.ok(boxOnFloor({ x0: 0, y0: 0, x1: 6, y1: 4 }, room));
  assert.ok(!boxOnFloor({ x0: -0.5, y0: 0, x1: 1, y1: 1 }, room));
  assert.ok(!boxOnFloor({ x0: 0, y0: 3.5, x1: 1, y1: 4.5 }, room));
  // nook: (x-6)/3 + y/2 <= 1
  assert.ok(boxOnFloor({ x0: 6, y0: 0, x1: 7.5, y1: 1 }, room)); // corner (7.5,1): 0.5+0.5 = 1
  assert.ok(!boxOnFloor({ x0: 6, y0: 0, x1: 8, y1: 1 }, room));
  // straddling the shared wall: left part under b, right corner inside nook
  assert.ok(boxOnFloor({ x0: 5, y0: 0, x1: 7, y1: 1 }, room));
  assert.ok(!boxOnFloor({ x0: 5, y0: 0, x1: 7, y1: 2 }, room));
  // nook taller than the room: the part right of the wall may rise above b
  const tall = roomOf({ a: 4, b: 3, c: 4, d: 6, f: 1, g: 1 });
  assert.ok(boxOnFloor({ x0: 4, y0: 3, x1: 4.5, y1: 5 }, tall)); // (0.5/4 + 5/6) <= 1
  assert.ok(!boxOnFloor({ x0: 3.5, y0: 3, x1: 4.5, y1: 4 }, tall)); // left part above the top wall
});

test("evaluate flags overlap, outside and unreachable items", () => {
  const ok = [{ id: "i1", type: "sofa", x: 3, y: 3, rot: 0 }];
  const v = evaluate(ok, room);
  assert.ok(v.inside && v.noOverlap && v.path);
  assert.equal(v.footprint, 2);
  const clash = [...ok, { id: "i2", type: "chair", x: 4, y: 3, rot: 0 }];
  const vc = evaluate(clash, room);
  assert.ok(!vc.noOverlap);
  assert.deepEqual(vc.items[0].overlaps, ["i2"]);
  const outside = [{ id: "i1", type: "chair", x: 5.5, y: 3.5, rot: 0 }];
  assert.ok(!evaluate(outside, room).inside);
  // A wall of shelves across the room cuts the back off: the item behind it has no path.
  const wall = [
    { id: "i1", type: "shelf", x: 0, y: 2, rot: 0 },
    { id: "i2", type: "shelf", x: 2, y: 2, rot: 0 },
    { id: "i3", type: "shelf", x: 4, y: 2, rot: 0 },
    { id: "i4", type: "chair", x: 0, y: 3, rot: 0 },
  ];
  const vw = evaluate(wall, room);
  assert.ok(vw.inside && vw.noOverlap && !vw.path);
  assert.equal(vw.items.find((x) => x.id === "i4").reachable, false);
  // Blocking the doorway blocks everything.
  const door = [{ id: "i1", type: "chair", x: 0.5, y: 0, rot: 0 }];
  assert.equal(evaluate(door, room).doorOpen, false);
});

test("a 0.5 m gap is too narrow for the 1 m walker", () => {
  const narrow = [
    { id: "i1", type: "shelf", x: 0, y: 2, rot: 0 },
    { id: "i2", type: "shelf", x: 2.5, y: 2, rot: 0 },
    { id: "i3", type: "table", x: 4.5, y: 2, rot: 0 },
    { id: "i4", type: "chair", x: 0, y: 3, rot: 0 },
  ];
  assert.equal(evaluate(narrow, room).path, false);
  const wide = narrow.map((it) =>
    it.id === "i2" ? { ...it, x: 3 } : it.id === "i3" ? { ...it, x: 5, type: "chair" } : it,
  );
  assert.equal(evaluate(wide, room).items.find((x) => x.id === "i4").reachable, true);
});

test("storage box uses the design's own footprint and rotates", () => {
  const it = { id: "i1", type: "storage", x: 0, y: 0, rot: 0 };
  assert.deepEqual(sizeOf(it, room), { w: 2, h: 1 });
  assert.deepEqual(sizeOf(rotateItem([it], "i1")[0], room), { w: 1, h: 2 });
});

test("addItem places validly, keeps the path and reports a full room", () => {
  let layout = [];
  for (const type of ["sofa", "shelf", "chair", "table", "storage"]) {
    const r = addItem(layout, type, room);
    assert.ok(r.layout, type);
    layout = r.layout;
  }
  const v = evaluate(layout, room);
  assert.ok(v.inside && v.noOverlap && v.path, JSON.stringify(layout));
  const tiny = roomOf({ a: 2, b: 2, c: 1, d: 1, f: 0.5, g: 0.5 });
  assert.equal(addItem([], "sofa", tiny).layout?.length ?? 0, 1);
  const crowded = Array.from({ length: MAX_ITEMS }, (_, i) => ({
    id: `i${i + 1}`,
    type: "chair",
    x: 0,
    y: 0,
    rot: 0,
  }));
  assert.equal(addItem(crowded, "chair", room).error, "full");
});

test("cleanLayout drops garbage and snaps to the grid", () => {
  const out = cleanLayout([
    { id: "i1", type: "sofa", x: 1.24, y: 0.76, rot: 1 },
    { id: "i1", type: "sofa", x: 0, y: 0 },
    { id: "x", type: "sofa", x: 0, y: 0 },
    { id: "i2", type: "rocket", x: 0, y: 0 },
    { id: "i3", type: "chair", x: "1", y: 0 },
    { id: "i4", type: "chair", x: 999, y: 0 },
    null,
  ]);
  assert.deepEqual(out, [{ id: "i1", type: "sofa", x: 1, y: 1, rot: 1 }]);
  assert.deepEqual(cleanLayout("nope"), []);
  assert.equal(nudgeItem(out, "i1", 0.5, -0.5)[0].x, 1.5);
});

test("report lines state the constraint verdicts", () => {
  const lines = layoutReport([{ id: "i1", type: "sofa", x: 3, y: 3, rot: 0 }], room);
  assert.match(lines.join("\n"), /Sofa 2 m × 1 m/);
  assert.match(lines.join("\n"), /No overlaps: yes/);
  assert.deepEqual(layoutReport([], room), []);
});

test("checkpoints keep a cleaned layout for area missions only", () => {
  const area = PROJECTS.find((p) => p.id === "unit-5-a");
  const ratio = PROJECTS.find((p) => p.family === "ratio");
  const design = Object.fromEntries(Object.entries(area.defaults).map(([k, v]) => [k, String(v)]));
  const r = addCheckpoint(area, [], {
    name: "A",
    reason: "",
    design,
    matched: 0,
    extra: [{ id: "i1", type: "sofa", x: 1, y: 1, rot: 0 }, { bad: 1 }],
  });
  assert.equal(r.entry.extra.length, 1);
  assert.equal(cleanCheckpoints(area, [r.entry])[0].extra.length, 1);
  assert.equal(DESIGNERS.area.key, "layout");
  const rd = Object.fromEntries(Object.entries(ratio.defaults).map(([k, v]) => [k, String(v)]));
  if (!DESIGNERS.ratio)
    assert.equal(
      addCheckpoint(ratio, [], { name: "B", reason: "", design: rd, matched: 0, extra: [1] }).entry
        .extra,
      undefined,
    );
});

console.log(`project-studio-floor-designer: ${n} tests passed`);
