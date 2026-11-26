// data-bins.test.mjs — every number the data-bins play shows a student.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildDataBinsPlay } from "./data-bins.js";
import {
  binOf,
  binsFor,
  dataBinsCopy,
  endOf,
  heightChoices,
  validateDataBins,
} from "./data-bins-model.js";

const lesson = JSON.parse(
  readFileSync(new URL("../../../lessons/2-2/config.json", import.meta.url), "utf8"),
).launch.conceptIntro.livingScene;

// Independent count: how many values satisfy from <= x <= to.
const count = (vals, from, to) => vals.reduce((n, x) => n + (x >= from && x <= to ? 1 : 0), 0);

test("the authored 2-2 config validates and builds", () => {
  assert.ok(validateDataBins(lesson));
  const play = buildDataBinsPlay(lesson);
  assert.ok(play);
  assert.deepEqual(
    play.scenes.map((s) => s.id),
    ["situate", "predict", "bins", "width", "transfer"],
  );
});

test("the practice data in intervals of 10: 3, 5, 5, 2 and the total is every value", () => {
  const v = lesson.values;
  assert.equal(v.length, 15);
  const end = endOf(v, 0, 20);
  assert.equal(end, 40);
  const bins = binsFor(v, 0, end, 10);
  assert.deepEqual(
    bins.map((b) => [b.label, b.count]),
    [
      ["0–9", count(v, 0, 9)],
      ["10–19", count(v, 10, 19)],
      ["20–29", count(v, 20, 29)],
      ["30–39", count(v, 30, 39)],
    ],
  );
  assert.deepEqual(
    bins.map((b) => b.count),
    [3, 5, 5, 2],
  );
});

test("every interval width regroups the same data: equal widths, heights sum to n", () => {
  const v = lesson.values;
  for (const w of lesson.widths) {
    const bins = binsFor(v, 0, 40, w);
    assert.equal(bins.length, 40 / w);
    assert.equal(
      bins.reduce((s, b) => s + b.count, 0),
      v.length,
    );
    for (const b of bins) assert.equal(b.to - b.from + 1, w);
    for (const x of v) {
      const b = bins[binOf(x, 0, w)];
      assert.ok(x >= b.from && x <= b.to);
    }
  }
  assert.deepEqual(
    binsFor(v, 0, 40, 5).map((b) => b.count),
    [0, 1, 2, 3, 4, 5, 6, 7].map((i) => count(v, i * 5, i * 5 + 4)),
  );
  assert.deepEqual(
    binsFor(v, 0, 40, 20).map((b) => b.count),
    [8, 7],
  );
});

test("height choices: the bar, the total, the width, 'this interval and up'", () => {
  const v = lesson.values;
  const c = heightChoices(v, 0, 40, 10, 1);
  assert.deepEqual(
    c.map((o) => [o.kind, o.value, !!o.correct]),
    [
      ["bar", 5, true],
      ["total", 15, false],
      ["width", 10, false],
      ["up", 12, false], // 5 + 5 + 2
    ],
  );
  const x = lesson.transfer;
  const t = heightChoices([...x.values].sort((a, b) => a - b), 50, 100, 10, 3);
  assert.deepEqual(
    t.map((o) => [o.kind, o.value]),
    [
      ["bar", count(x.values, 80, 89)],
      ["total", 15],
      ["width", 10],
      ["up", count(x.values, 80, 99)],
    ],
  );
  assert.equal(count(x.values, 80, 89), 4);
  assert.equal(count(x.values, 80, 99), 7);
  for (const set of [c, t]) assert.equal(new Set(set.map((o) => o.value)).size, set.length);
});

test("validation refuses what the stage cannot draw", () => {
  const bad = (patch) => validateDataBins({ ...lesson, ...patch });
  assert.equal(bad({ values: lesson.values.slice(0, 5) }), null);
  assert.equal(bad({ widths: [10] }), null);
  assert.equal(bad({ widths: [5, 20] }), null); // binWidth missing from widths
  assert.equal(bad({ widths: [1, 10] }), null);
  assert.equal(bad({ askBin: 9 }), null);
  assert.equal(bad({ values: [...lesson.values.slice(1), 3.5] }), null);
  assert.equal(bad({ transfer: { ...lesson.transfer, binWidth: 3 } }), null);
  assert.equal(buildDataBinsPlay({}), null);
  assert.equal(buildDataBinsPlay(null), null);
});

test("copy: bilingual, numbers correct, a miss never states the answer", () => {
  const T = dataBinsCopy(validateDataBins(lesson));
  const walk = (o, path = "") => {
    if (o && typeof o === "object" && "en" in o) assert.ok(o.es?.trim(), `${path} has no Spanish`);
    else if (o && typeof o === "object")
      for (const [k, x] of Object.entries(o)) if (typeof x !== "function") walk(x, `${path}.${k}`);
  };
  walk(T);
  assert.match(T.predictQ.en, /10–19/);
  assert.match(T.predictOk.en, /5 dots fall from 10 to 19/);
  assert.match(T.binsDone.en, /3 \+ 5 \+ 5 \+ 2 = 15/);
  assert.match(T.binsDone.en, /tallest bars, 10–19 and 20–29/);
  assert.match(T.transferQ.en, /80–89/);
  assert.match(T.widthRow(5).en, /8 bars with heights 0, 3, 2, 3, 3, 2, 2, 0/);
  assert.equal(T.sumExpr([3, 5, 5, 2], 15), "3 + 5 + 5 + 2 = 15");
  for (const o of heightChoices(lesson.values, 0, 40, 10, 1).filter((x) => !x.correct)) {
    const c = T.cueHeight(o, 10, 19);
    assert.doesNotMatch(`${c.en} ${c.es}`, /tall|bar is 5|mide 5/);
  }
});
