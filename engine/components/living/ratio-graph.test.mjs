// Pure-function proof for the ratio-graph living scene (lesson 3-4).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildRatioGraphPlay, validateRatioGraph as reexported } from "./ratio-graph.js";
import {
  ASKED_ROW,
  checkPlot,
  offPoint,
  PLOT_ROWS,
  pairChoices,
  placeAway,
  ratioGraphCopy,
  ROWS,
  tableRows,
  tickStep,
  validateRatioGraph,
} from "./ratio-graph-model.js";

const LESSON = JSON.parse(
  readFileSync(new URL("../../../lessons/3-4/config.json", import.meta.url), "utf8"),
).launch.conceptIntro.livingScene;
const mut = (f) => {
  const c = JSON.parse(JSON.stringify(LESSON));
  f(c);
  return c;
};
const nb = (s) => s.replaceAll(" ", " ");

test("validation rejects bad configs", () => {
  const bad = [
    null,
    "1:2",
    {},
    mut((c) => {
      c.a = c.b; // (x, y) and (y, x) would be the same pair
    }),
    mut((c) => {
      c.a = 0;
    }),
    mut((c) => {
      c.b = 7;
    }),
    mut((c) => {
      c.a = 1.5;
    }),
    mut((c) => {
      c.labelX = "";
    }),
    mut((c) => {
      c.labelY = "a label that is much too long for the axis";
    }),
    mut((c) => {
      c.story = undefined;
    }),
    mut((c) => {
      c.transfer = undefined;
    }),
    mut((c) => {
      c.transfer.a = c.a;
      c.transfer.b = c.b; // identical to the main ratio
    }),
    mut((c) => {
      c.transfer.b = c.transfer.a;
    }),
  ];
  for (const cfg of bad) {
    assert.equal(validateRatioGraph(cfg), null, JSON.stringify(cfg));
    assert.equal(buildRatioGraphPlay(cfg), null, JSON.stringify(cfg));
  }
  assert.equal(reexported, validateRatioGraph);
});

test("the lesson config builds with the lesson's own numbers", () => {
  const v = validateRatioGraph(LESSON);
  assert.deepEqual([v.a, v.b, v.transfer.a, v.transfer.b], [1, 2, 1, 3]);
  const play = buildRatioGraphPlay(LESSON);
  assert.deepEqual(
    play.scenes.map((s) => s.id),
    ["situate", "predict", "plot", "line", "off", "transfer"],
  );
  assert.deepEqual(
    play.scenes.map((s) => Boolean(s.gate)),
    [false, true, true, false, true, false],
  );
});

test("table rows are n batches and every row is on one line through the origin", () => {
  assert.deepEqual(tableRows(1, 2), [
    { n: 1, x: 1, y: 2 },
    { n: 2, x: 2, y: 4 },
    { n: 3, x: 3, y: 6 },
    { n: 4, x: 4, y: 8 },
  ]);
  for (const [a, b] of [[1, 2], [1, 3], [2, 5], [3, 4]]) {
    const rows = tableRows(a, b);
    assert.equal(rows.length, ROWS);
    for (const r of rows) {
      assert.equal(r.y * a, r.x * b); // y / x = b / a: the slope of the line through (0, 0)
      assert.equal(r.x / a, r.n);
    }
  }
  // The rows to plot plus the row the prediction plots are all four rows, exactly once.
  assert.deepEqual([...PLOT_ROWS, ASKED_ROW].sort(), [1, 2, 3, 4]);
});

test("plot check: swapped, wrong x, wrong y", () => {
  const row = { n: 2, x: 2, y: 4 };
  assert.equal(checkPlot(row, 2, 4), "ok");
  assert.equal(checkPlot(row, 4, 2), "swapped");
  assert.equal(checkPlot(row, 3, 4), "xWrong");
  assert.equal(checkPlot(row, 2, 5), "yWrong");
  assert.equal(checkPlot(row, 0, 0), "xWrong");
  // A square point (x === y) cannot be swapped: it is judged like any other point.
  assert.equal(checkPlot({ n: 1, x: 3, y: 3 }, 3, 3), "ok");
  for (const r of tableRows(1, 2)) {
    assert.equal(checkPlot(r, r.x, r.y), "ok");
    assert.equal(checkPlot(r, r.y, r.x), "swapped");
  }
});

test("the off-line point really is off the line", () => {
  for (const [a, b] of [[1, 2], [1, 3], [2, 5]]) {
    const p = offPoint(a, b);
    assert.equal(p.x, ASKED_ROW * a);
    assert.notEqual(p.y * a, p.x * b);
    assert.ok(p.y >= 1);
  }
  assert.deepEqual(offPoint(1, 2), { x: 3, y: 5 });
});

test("pair choices: exactly one correct, the rest are the named mistakes", () => {
  for (const [a, b] of [[1, 2], [1, 3], [2, 5], [3, 4]]) {
    const opts = pairChoices(a, b, ASKED_ROW);
    assert.equal(opts.filter((o) => o.correct).length, 1);
    const right = opts.find((o) => o.correct);
    assert.deepEqual([right.x, right.y], [ASKED_ROW * a, ASKED_ROW * b]);
    assert.equal(new Set(opts.map((o) => `${o.x},${o.y}`)).size, opts.length);
    const by = Object.fromEntries(opts.map((o) => [o.kind, [o.x, o.y]]));
    assert.deepEqual(by.swapped, [ASKED_ROW * b, ASKED_ROW * a]);
    assert.deepEqual(by.unit, [a, b]);
    assert.deepEqual(by.stale, [ASKED_ROW * a, (ASKED_ROW - 1) * b]);
    for (const o of opts.filter((x) => !x.correct)) assert.notDeepEqual([o.x, o.y], [right.x, right.y]);
  }
  const lesson = pairChoices(1, 2, 3);
  assert.deepEqual(lesson.map((o) => `${o.x},${o.y}`), ["3,6", "6,3", "1,2", "3,4"]);
  assert.notEqual(placeAway(lesson, 1 + 2 + 1).findIndex((o) => o.correct), 0);
  assert.notEqual(placeAway(pairChoices(1, 3, 3), 1 + 3 + 2).findIndex((o) => o.correct), 0);
});

test("tick steps keep an axis to eight labels", () => {
  assert.equal(tickStep(4), 1);
  assert.equal(tickStep(8), 1);
  assert.equal(tickStep(12), 2);
  assert.equal(tickStep(24), 5);
  for (let m = 1; m <= 24; m++) assert.ok(m / tickStep(m) <= 8);
});

test("the copy states the lesson's own numbers in both languages", () => {
  const c = ratioGraphCopy(validateRatioGraph(LESSON));
  assert.match(nb(c.predict.ok.en), /pair is \(3, 6\): go right 3, then up 6/);
  assert.match(nb(c.predict.ok.es), /El par es \(3, 6\)/);
  assert.match(nb(c.line.say.en), /through the origin \(0, 0\)/);
  assert.match(nb(c.line.say.en), /Every step right 1 goes up 2/);
  assert.match(nb(c.off.say.en), /3 sundaes need 5 ounces of sauce and plots \(3, 5\)/);
  assert.match(nb(c.off.ok.en), /point on the line is \(3, 6\)/);
  assert.match(nb(c.plot.say(c.rows[0]).en), /Row 1: sundaes = 1, ounces of sauce = 2/);
  assert.match(nb(c.transfer.ok.en), /3 cups of sugar need 9 cups of flour, the point \(3, 9\)/);
  assert.match(nb(c.transfer.ok.es), /3 tazas de azúcar necesitan 9 tazas de harina/);
  assert.match(nb(c.printSummary.en), /\(1, 2\), \(2, 4\), \(3, 6\), \(4, 8\)/);
  assert.equal(c.off.options.filter((o) => o.correct).length, 1);
  assert.notEqual(c.off.options.findIndex((o) => o.correct), 0);
  for (const o of c.off.options.filter((x) => !x.correct)) assert.ok(o.cue.en && o.cue.es);
  for (const k of ["title", "printSummary", "situate", "ariaLabel"]) assert.ok(c[k].en && c[k].es && c[k].en !== c[k].es, k);
});
