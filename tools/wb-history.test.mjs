import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const ctx = { window: {} };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync("curriculum/math-workbench/wb-history.js", "utf8"), ctx);
const { create, capture, equal, restore } = ctx.WBHist;

const page = (over) => ({ strokes: [], objects: [], bg: "blank", pages: 3, ...over });
const stroke = (n, y) => ({
  tool: "pen",
  color: "#000",
  size: 4,
  pts: Array.from({ length: n }, (_, j) => ({ x: j, y, t: j })),
});
const obj = (i, x = 0) => ({ id: `o${i}`, type: "text", x, y: i * 10, text: `T${i}` });

// --- identical push is ignored; undo/redo restore what was captured
{
  const h = create();
  const s = page({ objects: [obj(1)] });
  h.reset(s);
  assert.equal(h.push(s), false, "an unchanged page is not a new step");
  s.objects[0].x = 40;
  assert.equal(h.push(s), true, "a moved object is a new step");
  assert.equal(h.canUndo(), true);
  const back = h.undo();
  assert.equal(back.objects[0].x, 0, "undo restores the earlier position");
  const fwd = h.redo();
  assert.equal(fwd.objects[0].x, 40, "redo restores the later position");
  assert.equal(h.redo(), null, "nothing to redo at the tip");
}

// --- pushing after undo drops the redo tail
{
  const h = create();
  const s = page();
  h.reset(s);
  s.strokes.push(stroke(3, 1));
  h.push(s);
  s.strokes.push(stroke(3, 2));
  h.push(s);
  const u = h.undo();
  assert.equal(u.strokes.length, 1);
  const s2 = page({ strokes: u.strokes, objects: [obj(9)] });
  h.push(s2);
  assert.equal(h.canRedo(), false, "a new edit clears redo");
  assert.equal(h.size(), 3);
}

// --- step cap behaves like the old 60-step history
{
  const h = create({ maxEntries: 60 });
  const s = page({ objects: [obj(1)] });
  h.reset(s);
  for (let i = 1; i <= 100; i++) {
    s.objects[0].x = i;
    h.push(s);
  }
  assert.equal(h.size(), 60, "history keeps the newest 60 steps");
  let n = 0;
  while (h.canUndo()) {
    h.undo();
    n++;
  }
  assert.equal(n, 59, "59 undos are available at the cap");
}

// --- restore() hands back live copies, not the stored objects
{
  const h = create();
  const s = page({ objects: [obj(1)] });
  h.reset(s);
  s.objects[0].x = 5;
  h.push(s);
  const a = h.undo();
  a.objects[0].x = 999; // mutate the live copy
  const b = h.redo();
  const c = h.undo();
  assert.equal(c.objects[0].x, 0, "mutating a restored page never corrupts history");
  assert.equal(b.objects[0].x, 5);
}

// --- unchanged objects share their JSON string between steps
{
  const s = page({ objects: Array.from({ length: 120 }, (_, i) => obj(i)) });
  const e1 = capture(s, null);
  s.objects[3].x = 77;
  const e2 = capture(s, e1);
  let shared = 0;
  for (let i = 0; i < e1.objs.length; i++) if (e1.objs[i] === e2.objs[i]) shared++;
  assert.ok(shared >= 119, "119 of 120 unchanged objects reuse the previous string");
  assert.equal(equal(e1, e2), false);
}

// --- stress: 400 strokes x 150 points + 120 objects stays well under 15 MB
{
  const strokes = Array.from({ length: 400 }, (_, i) => stroke(150, i));
  const objects = Array.from({ length: 120 }, (_, i) => obj(i));
  const s = page({ strokes, objects });
  const h = create({ maxEntries: 60, maxBytes: 12 * 1024 * 1024 });
  h.reset(s);
  const heapBefore = process.memoryUsage().heapUsed;
  for (let i = 0; i < 80; i++) {
    s.objects[i % 120].x += 1;
    if (i % 5 === 0) s.strokes.push(stroke(50, 500 + i));
    h.push(s);
  }
  const heapGrowth = process.memoryUsage().heapUsed - heapBefore;
  assert.ok(h.bytes() < 15 * 1024 * 1024, `estimated history ${h.bytes()} bytes is under 15 MB`);
  assert.ok(heapGrowth < 40 * 1024 * 1024, `real heap growth ${heapGrowth} bytes stays small`);
  // the old design would have held 60 full copies of the page
  const oldCost = JSON.stringify({ strokes, objects, bg: "blank", pages: 3 }).length * 60;
  assert.ok(h.bytes() * 8 < oldCost, "the new history is far smaller than 60 full snapshots");
}

// --- byte budget trims old steps but always keeps the current one
{
  const big = page({ strokes: [stroke(5000, 1)] });
  const h = create({ maxEntries: 60, maxBytes: 100 * 1024 });
  h.reset(big);
  for (let i = 0; i < 6; i++) {
    big.strokes.push(stroke(5000, 10 + i));
    h.push(big);
  }
  assert.ok(h.size() >= 1 && h.size() < 7, "the byte budget trims old steps");
  assert.equal(restore(capture(big, null)).strokes.length, 7);
}

console.log("wb-history: all assertions passed");
