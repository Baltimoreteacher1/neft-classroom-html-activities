// mad-spread.test.mjs — every number the mad-spread play shows for lesson 2-9,
// recomputed independently of the play.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildMadSpreadPlay, validateMadSpread as reexported } from "./mad-spread.js";
import {
  axisFor,
  distanceChoices,
  eq,
  fmt,
  madChoices,
  madSpreadCopy,
  madStats,
  okSet,
  placeCorrect,
  stepFor,
  validateMadSpread,
} from "./mad-spread-model.js";

const lesson = JSON.parse(readFileSync(new URL("../../../lessons/2-9/config.json", import.meta.url)));
const CFG = lesson.launch.conceptIntro.livingScene;
const clone = () => structuredClone(CFG);

// Independent reference: mean, distances, MAD with exact rational arithmetic (numerator / n).
function ref(values) {
  const n = values.length;
  const total = values.reduce((a, b) => a + b, 0);
  assert.equal(total % n, 0, "whole mean");
  const mean = total / n;
  const dist = values.map((x) => (x > mean ? x - mean : mean - x));
  const sumd = dist.reduce((a, b) => a + b, 0);
  return { mean, dist, sumd, madNum: sumd, madDen: n };
}

test("madStats matches the worked example in the lesson: 6, 8, 10, 12 -> MAD 2", () => {
  const s = madStats([6, 8, 10, 12]);
  assert.equal(s.mean, 9);
  assert.deepEqual(s.dist, [3, 1, 1, 3]);
  assert.equal(s.sumd, 8);
  assert.equal(s.mad, 2);
  // The lesson's own text states exactly these numbers.
  const lines = lesson.launch.conceptIntro.iDo.lines.join(" ");
  assert.match(lines, /36 ÷ 4 = 9/);
  assert.match(lines, /3 \+ 1 \+ 1 \+ 3 = 8, then 8 ÷ 4 = 2/);
});

test("the authored 2-9 scene builds and uses the lesson's own data", () => {
  const v = validateMadSpread(CFG);
  assert.ok(v);
  assert.deepEqual(v.values, [6, 8, 10, 12]);
  assert.deepEqual(v.compare.a.values, [18, 22, 20, 24, 16]); // Player A's scores
  assert.deepEqual(v.compare.b.values, [20, 21, 20, 19, 20]); // the "tightly clustered" preset
  assert.deepEqual(v.transfer.values, [9, 10, 11]); // the Let's-try-together set
  assert.ok(buildMadSpreadPlay(CFG));
  assert.equal(reexported, validateMadSpread);
});

test("the comparison is honest: same mean, different MAD", () => {
  const v = validateMadSpread(CFG);
  const [ra, rb] = [ref(v.compare.a.values), ref(v.compare.b.values)];
  assert.equal(ra.mean, 20);
  assert.equal(rb.mean, 20);
  assert.equal(ra.sumd, 12); // 2 + 2 + 0 + 4 + 4
  assert.equal(rb.sumd, 2); // 0 + 1 + 0 + 1 + 0
  assert.equal(ra.madNum / ra.madDen, 2.4);
  assert.equal(rb.madNum / rb.madDen, 0.4);
  const T = madSpreadCopy(v);
  assert.match(T.compareOk.en, /2 ÷ 5 = 0\.4, compared with 12 ÷ 5 = 2\.4 for Player A/);
  assert.match(T.compareOk.es, /2 ÷ 5 = 0\.4, frente a 12 ÷ 5 = 2\.4 de «Jugador A»/);
  assert.equal(T.shareCap(v.compare.a.values), "12 ÷ 5 = 2.4");
  assert.equal(T.lineCap(v.compare.a.values), "2 + 2 + 0 + 4 + 4 = 12");
  assert.equal(T.lineCap(v.compare.b.values), "0 + 1 + 0 + 1 + 0 = 2");
  const opts = T.compareOptions;
  assert.equal(opts.filter((o) => o.correct).length, 1);
  assert.equal(opts.find((o) => o.correct).label.en, "Tightly clustered");
});

test("transfer MAD is the lesson's 2/3 and is shown as approximate", () => {
  const r = ref([9, 10, 11]);
  assert.deepEqual([r.mean, r.dist, r.sumd], [10, [1, 0, 1], 2]);
  assert.equal(fmt(2 / 3), "≈ 0.67");
  assert.equal(eq(2 / 3), "≈ 0.67");
  assert.equal(eq(2.4), "= 2.4");
  assert.equal(fmt(2), "2");
  const T = madSpreadCopy(validateMadSpread(CFG));
  assert.match(T.transferOk.en, /1 \+ 0 \+ 1 = 2, and 2 ÷ 3 ≈ 0\.67/);
});

test("distance choices: exactly one correct; the others are real mix-ups", () => {
  const c = distanceChoices([6, 8, 10, 12]);
  assert.deepEqual(
    c.map((o) => [o.kind, o.text, !!o.correct]),
    [
      ["distance", "3, 1, 1, 3", true],
      ["signed", "−3, −1, 1, 3", false],
      ["fromMin", "0, 2, 4, 6", false],
      ["values", "6, 8, 10, 12", false],
    ],
  );
  assert.equal(new Set(c.map((o) => o.text)).size, c.length);
  const placed = placeCorrect(c, 4 + 2 * 4 + 1 + 36 - 4);
  assert.equal(placed.filter((o) => o.correct).length, 1);
  assert.equal(c.filter((o) => o.correct).length, 1);
  // A data set whose distances equal its distances-from-min would collapse a choice: it must stay distinct.
  assert.ok(distanceChoices([0, 2, 4, 12]).every((o, _, a) => a.filter((x) => x.text === o.text).length === 1));
});

test("MAD choices: the MAD, the undivided total, the signed zero, the mean", () => {
  const c = madChoices([9, 10, 11]);
  assert.deepEqual(
    c.map((o) => [o.kind, o.correct === true]),
    [
      ["mad", true],
      ["total", false],
      ["signed", false],
      ["mean", false],
    ],
  );
  assert.deepEqual(
    c.map((o) => o.label.en),
    ["≈ 0.67", "2", "0", "10"],
  );
  assert.equal(c.filter((o) => o.correct).length, 1);
  // Player A: 12 total, signed deviations sum to 0 (the lesson's own mistake).
  const a = [18, 22, 20, 24, 16];
  assert.equal(a.reduce((s, x) => s + (x - 20), 0), 0);
  assert.deepEqual(madChoices(a).map((o) => o.label.en), ["2.4", "12", "0", "20"]);
});

test("cues are questions and never state the MAD", () => {
  const v = validateMadSpread(CFG);
  const T = madSpreadCopy(v);
  for (const k of ["signed", "fromMin", "values"]) {
    const cue = T.distanceCue(k);
    assert.ok(cue.en.endsWith("?") && cue.es.endsWith("?"), k);
  }
  for (const k of ["total", "signed", "mean"]) {
    const cue = T.madCue(k);
    assert.ok(cue.en.endsWith("?") && cue.es.endsWith("?"), k);
    assert.doesNotMatch(cue.en, /0\.67/);
  }
  for (const k of ["large", "same", "unknown"]) {
    const cue = T.compareCue(k);
    assert.ok(cue.en.endsWith("?") && cue.es.endsWith("?"), k);
    assert.doesNotMatch(cue.en, /smaller MAD|0\.4/);
  }
});

test("copy exists in both languages, Spanish uses tú and no English", () => {
  const T = madSpreadCopy(validateMadSpread(CFG));
  const check = (x, path) => {
    if (!(x && typeof x === "object" && "en" in x)) return;
    assert.ok(typeof x.es === "string" && x.es.trim(), `${path} needs Spanish`);
    assert.doesNotMatch(x.es, /\b(the|and|each|mean|scores?|distances?)\b/i, `${path}: English in Spanish`);
    assert.doesNotMatch(x.es, /\b(usted|ustedes|vosotros)\b/i);
    assert.doesNotMatch(x.es, /\d %/);
  };
  for (const [k, val] of Object.entries(T)) {
    if (typeof val === "function" || typeof val === "string") continue;
    if (Array.isArray(val)) val.forEach((o, i) => check(o.label, `${k}[${i}]`));
    else if ("en" in val) check(val, k);
    else for (const [k2, v2] of Object.entries(val)) check(v2, `${k}.${k2}`);
  }
  check(T.drawn(0), "drawn");
  check(T.away(6, 3), "away");
  check(T.distanceCue("signed"), "cue");
});

test("axis: wide enough for the bars laid end to end, labels at most about nine", () => {
  assert.deepEqual(axisFor([[6, 8, 10, 12]]), { lo: 5, hi: 13, step: 1 });
  assert.deepEqual(axisFor([[18, 22, 20, 24, 16], [20, 21, 20, 19, 20]]), { lo: 14, hi: 26, step: 2 });
  for (const sets of [[[6, 8, 10, 12]], [[18, 22, 20, 24, 16], [20, 21, 20, 19, 20]], [[9, 10, 11]], [[2, 4, 6, 8, 10]]]) {
    const ax = axisFor(sets);
    for (const s of sets) {
      assert.ok(ax.hi - ax.lo >= ref(s).sumd, "bars end to end fit the line");
      assert.ok(Math.min(...s) >= ax.lo && Math.max(...s) <= ax.hi, "every value is on the line");
    }
    assert.ok((ax.hi - ax.lo) / ax.step <= 9);
    assert.ok(ax.lo >= 0);
  }
  assert.equal(stepFor(8), 1);
  assert.equal(stepFor(12), 2);
  assert.equal(stepFor(24), 5);
  assert.equal(axisFor([[0, 1, 2, 90]]), null, "a line longer than the stage allows");
});

test("okSet refuses what cannot be drawn", () => {
  for (const bad of [[1, 2], [1, 2, 3, 4, 5, 6], [5, 5, 5], [1, 2, 4], [1.5, 2.5, 3.5, 4.5], [-1, 3, 4], [1, 2, 100]])
    assert.equal(okSet(bad), null, JSON.stringify(bad));
  assert.deepEqual(okSet([9, 10, 11], false), [9, 10, 11]);
  assert.equal(okSet([9, 10, 11]), null, "2/3 is not exact to hundredths");
});

test("validation refuses configs the stage cannot draw correctly", () => {
  const mutate = (fn) => {
    const c = clone();
    fn(c);
    return c;
  };
  const bad = [
    null,
    {},
    mutate((c) => (c.values = [4, 4, 4, 4])),
    mutate((c) => (c.values = [6, 8, 10, 13])), // mean not whole
    mutate((c) => (c.compare.b.values = [18, 22, 20, 24, 16])), // identical MADs
    mutate((c) => (c.compare.b.values = [20, 21, 20, 19, 21])), // different means
    mutate((c) => (c.compare.b.values = [20, 21, 19, 20])), // different sizes
    mutate((c) => (c.transfer.values = [10, 10, 10])),
    mutate((c) => delete c.unit),
    mutate((c) => delete c.story),
    mutate((c) => (c.compare.a.name = { en: "A" })),
    mutate((c) => delete c.transfer),
  ];
  for (const cfg of bad) {
    assert.equal(validateMadSpread(cfg), null, JSON.stringify(cfg)?.slice(0, 100));
    assert.equal(buildMadSpreadPlay(cfg), null);
  }
});

test("buildMadSpreadPlay: six scenes, gates where the student acts", () => {
  const play = buildMadSpreadPlay(CFG);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["draw", true],
      ["share", true],
      ["compare", true],
      ["transfer", false],
    ],
  );
  assert.doesNotMatch(play.title.en, /MAD|\b2\b/, "the title must not give away the MAD");
  assert.match(play.printSummary.en, /8 ÷ 4 = 2/);
  assert.match(play.printSummary.es, /8 ÷ 4 = 2/);
  assert.match(play.viewBox, /^0 0 480 \d+$/);
});
