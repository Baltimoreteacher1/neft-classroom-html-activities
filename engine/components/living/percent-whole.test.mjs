// percent-whole.test.mjs — the living-scene "percent of a whole" play: config
// validation and every number it puts on the stage, computed independently.
import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPercentWholePlay,
  fdp,
  fmtHundredths,
  partOf,
  placeCorrect,
  predictOptions,
  validatePercentWhole,
  wholeRange,
} from "./percent-whole.js";

const LESSON = {
  percent: 25,
  whole: 60,
  unit: { en: "tickets", es: "boletos" },
  item: { en: "Claw machine", es: "Máquina de garra" },
  partName: { en: "the discount", es: "el descuento" },
  story: {
    en: "The claw machine usually costs 60 tickets, and today it is 25% off.",
    es: "La máquina de garra suele costar 60 boletos, y hoy tiene 25% de descuento.",
  },
  transfer: { percent: 40, whole: 80, item: { en: "Racing game", es: "Juego de carreras" } },
};

// Independent reference: exact part via integer arithmetic on strings.
const refPart = (p, w) => {
  const n = p * w;
  const s = (n / 100).toFixed(2);
  return s.replace(/\.?0+$/, "");
};

test("fmtHundredths formats exact hundredths", () => {
  assert.equal(fmtHundredths(1500), "15");
  assert.equal(fmtHundredths(450), "4.5");
  assert.equal(fmtHundredths(25), "0.25");
  assert.equal(fmtHundredths(40), "0.4");
  assert.equal(fmtHundredths(5), "0.05");
  assert.equal(fmtHundredths(0), "0");
  assert.equal(fmtHundredths(-1), "");
  assert.equal(fmtHundredths(1.5), "");
});

test("partOf is exact across many percents and wholes", () => {
  for (const p of [1, 5, 12, 25, 33, 40, 50, 75, 99])
    for (const w of [2, 7, 30, 60, 80, 125, 333, 1000]) assert.equal(partOf(p, w), refPart(p, w), `${p}% of ${w}`);
  assert.equal(partOf(25, 60), "15");
  assert.equal(partOf(40, 80), "32");
  assert.equal(partOf(15, 30), "4.5");
  assert.equal(partOf(7, 3), "0.21");
});

test("fdp gives fraction, simplest form, decimal and percent", () => {
  assert.deepEqual(fdp(25), { fraction: "25/100", simplified: "1/4", decimal: "0.25", percent: "25%" });
  assert.deepEqual(fdp(40), { fraction: "40/100", simplified: "2/5", decimal: "0.4", percent: "40%" });
  assert.deepEqual(fdp(37), { fraction: "37/100", simplified: null, decimal: "0.37", percent: "37%" });
  assert.equal(fdp(5).decimal, "0.05");
  assert.equal(fdp(60).simplified, "3/5");
});

test("predictOptions: exactly one correct, distinct values, real misconceptions", () => {
  const o = predictOptions(25, 60);
  assert.deepEqual(
    o.map((x) => [x.kind, x.value, x.correct]),
    [
      ["correct", "15", true],
      ["percent", "25", false],
      ["subtract", "35", false],
      ["divide", "0.42", false],
    ],
  );
  for (const [p, w] of [
    [25, 60],
    [40, 80],
    [50, 100],
    [10, 10],
    [99, 2],
    [1, 1000],
    [20, 50],
  ]) {
    const opts = predictOptions(p, w);
    assert.equal(opts.filter((x) => x.correct).length, 1);
    assert.equal(opts.find((x) => x.correct).value, refPart(p, w));
    assert.equal(new Set(opts.map((x) => x.value)).size, opts.length, `${p}/${w} distinct`);
    assert.ok(opts.length >= 3 && opts.length <= 4);
  }
  // 50% of 100 = 50 collides with "the percent itself" and with 100 − 50: both dropped.
  assert.deepEqual(
    predictOptions(50, 100).map((x) => x.kind),
    ["correct", "divide", "times"],
  );
  // whole smaller than percent: no subtraction distractor
  assert.ok(!predictOptions(99, 2).some((x) => x.kind === "subtract"));
  assert.equal(predictOptions(40, 80).find((x) => x.kind === "divide").value, "0.5");
});

test("placeCorrect moves the correct choice off the first slot", () => {
  const opts = predictOptions(25, 60);
  const seen = new Set();
  for (let s = 0; s < 4; s++) {
    const placed = placeCorrect(opts, s);
    assert.equal(placed.length, opts.length);
    seen.add(placed.findIndex((x) => x.correct));
  }
  assert.equal(seen.size, 4);
  assert.equal(
    placeCorrect(opts, 25 + 60).findIndex((x) => x.correct),
    (25 + 60) % 4,
  );
});

test("wholeRange keeps the slider's parts whole and includes the lesson whole", () => {
  assert.deepEqual(wholeRange(25, 60), { step: 4, maxK: 50, startK: 15 });
  assert.deepEqual(wholeRange(40, 80), { step: 5, maxK: 40, startK: 16 });
  assert.equal(wholeRange(12, 60).step, 25);
  assert.equal(wholeRange(37, 60).step, 10); // 100 would leave 2 stops → tenths
  assert.equal(partOf(37, 10 * 7), "25.9");
  for (const p of [5, 12, 25, 40, 75]) {
    const { step, maxK } = wholeRange(p, 60);
    assert.ok(maxK >= 6);
    for (let k = 1; k <= maxK; k++) assert.ok(Number.isInteger((p * k * step) / 100), `${p}% of ${k * step}`);
  }
});

test("validatePercentWhole accepts the lesson config", () => {
  const v = validatePercentWhole(LESSON);
  assert.equal(v.p, 25);
  assert.equal(v.w, 60);
  assert.deepEqual(v.transfer, { p: 40, w: 80, item: LESSON.transfer.item });
  assert.deepEqual(v.story, LESSON.story);
  assert.deepEqual(v.unit, LESSON.unit);
});

test("validatePercentWhole rejects bad numbers", () => {
  for (const bad of [
    null,
    {},
    { percent: 0, whole: 60 },
    { percent: 100, whole: 60 },
    { percent: 25.5, whole: 60 },
    { percent: 25, whole: 1 },
    { percent: 25, whole: 1001 },
    { percent: 25, whole: "sixty" },
    { percent: 25, whole: 60.5 },
  ])
    assert.equal(validatePercentWhole(bad), null, JSON.stringify(bad));
  assert.equal(buildPercentWholePlay({ percent: 120, whole: 60 }), null);
});

test("validatePercentWhole falls back safely", () => {
  // A story that states other numbers than the stage is dropped.
  const v = validatePercentWhole({ ...LESSON, story: { en: "It is 30% off 50 tickets.", es: "30% de 50." } });
  assert.equal(v.story, null);
  // Transfer equal to the main problem, or invalid, gets a deterministic other problem.
  assert.deepEqual(
    (({ p, w }) => ({ p, w }))(validatePercentWhole({ percent: 40, whole: 80, transfer: { percent: 40, whole: 80 } }).transfer),
    { p: 30, w: 50 },
  );
  assert.deepEqual(
    (({ p, w }) => ({ p, w }))(validatePercentWhole({ percent: 25, whole: 60, transfer: { percent: 300 } }).transfer),
    { p: 40, w: 80 },
  );
  // Unit defaults; an over-long unit is refused, not drawn.
  assert.equal(validatePercentWhole({ percent: 25, whole: 60 }).unit.en, "items");
  assert.equal(validatePercentWhole({ percent: 25, whole: 60, unit: "x".repeat(40) }).unit.en, "items");
  // Spanish falls back to English only when missing.
  assert.deepEqual(validatePercentWhole({ percent: 25, whole: 60, unit: "pens" }).unit, { en: "pens", es: "pens" });
});

test("buildPercentWholePlay returns six scenes with gates where the student must act", () => {
  const play = buildPercentWholePlay(LESSON);
  assert.ok(play);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["shade", true],
      ["rescale", true],
      ["fdp", false],
      ["transfer", false],
    ],
  );
  assert.equal(play.viewBox, "0 0 720 270");
  assert.match(play.printSummary.en, /25% of 60 = 0\.25 × 60 = 15 tickets/);
  assert.match(play.printSummary.es, /el 25% de 60 = 0\.25 × 60 = 15 boletos/);
  for (const s of [play.title.es, play.ariaLabel.es, play.printSummary.es]) {
    assert.doesNotMatch(s, /\bel entero\b|\bel todo\b/);
    assert.doesNotMatch(s, /\d %/);
  }
});
