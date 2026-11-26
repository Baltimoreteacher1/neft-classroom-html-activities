// percent-estimate.test.mjs — the living-scene "estimate a percent of a number"
// play: config validation and every number it puts on the stage, computed
// independently.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildPercentEstimatePlay, validatePercentEstimate } from "./percent-estimate.js";
import {
  amt,
  BENCHES,
  checkChoices,
  choicesFor,
  estimateCopy,
  numTxt,
} from "./percent-estimate-model.js";

const lesson = () =>
  JSON.parse(readFileSync(new URL("../../../lessons/4-3/config.json", import.meta.url), "utf8"))
    .launch.conceptIntro.livingScene;

test("the 4-3 config estimates 24% of $81 with 25% of 80, and 8.6% of 216 with 10% of 220", () => {
  const v = validatePercentEstimate(lesson());
  assert.ok(v);
  assert.deepEqual([v.percent, v.whole, v.compat, v.bench, v.est], [24, 81, 80, 25, 20]);
  // exact 0.24 × 81 = 19.44, computed by integers: 24 × 81 = 1944 hundredths
  assert.equal(v.exactH, 24 * 81);
  assert.equal(v.exactRounded, false);
  assert.equal(v.verdict, "high");
  const t = v.transfer;
  assert.deepEqual([t.percent, t.whole, t.compat, t.bench, t.est], [8.6, 216, 220, 10, 22]);
  assert.equal(t.t10, 86);
});

test("the estimate really is a benchmark of the friendly whole", () => {
  for (const s of [validatePercentEstimate(lesson()), validatePercentEstimate(lesson()).transfer]) {
    assert.ok(BENCHES.includes(s.bench));
    assert.equal((s.compat * s.bench) % 100, 0);
    assert.equal(s.est, (s.compat * s.bench) / 100);
    assert.ok(Math.abs(s.bench - s.percent) <= 10); // the benchmark is near the percent
    assert.ok(Math.abs(s.compat - s.whole) / s.whole <= 0.1); // the whole is barely rounded
  }
});

test("amounts print as money or as numbers with units", () => {
  const v = validatePercentEstimate(lesson());
  assert.equal(amt(v, 8100), "$81");
  assert.equal(numTxt(v, 1944), "$19.44");
  assert.equal(amt(v.transfer, 22000), "220 pounds");
  assert.equal(numTxt(v.transfer, 2200), "22");
});

test("choicesFor: one correct estimate; the rest are the percent's own number or another benchmark", () => {
  const v = validatePercentEstimate(lesson());
  assert.deepEqual(
    choicesFor(v).map((o) => [o.kind, o.v]),
    [
      ["correct", 20],
      ["number", 24],
      ["b10", 8],
      ["b50", 40],
    ],
  );
  assert.deepEqual(
    choicesFor(v.transfer).map((o) => [o.kind, o.v]),
    [
      ["correct", 22],
      ["number", 9],
      ["b25", 55],
      ["b50", 110],
    ],
  );
  for (const s of [v, v.transfer]) {
    const o = choicesFor(s);
    assert.equal(o.filter((x) => x.correct).length, 1);
    assert.equal(new Set(o.map((x) => x.v)).size, o.length);
  }
});

test("checkChoices: the verdict comes from comparing the estimate with the exact value", () => {
  const v = validatePercentEstimate(lesson());
  assert.ok(v.est * 100 > v.exactH);
  const o = checkChoices(v.verdict);
  assert.deepEqual(
    o.filter((x) => x.correct).map((x) => x.kind),
    ["high"],
  );
  assert.equal(o.length, 3);
  // a low estimate flips the verdict
  const low = validatePercentEstimate({
    ...lesson(),
    percent: 26,
    whole: 81,
    compat: 80,
    bench: 25,
  });
  assert.equal(low.verdict, "low"); // 25% of 80 = 20 < 21.06
  assert.deepEqual(
    checkChoices(low.verdict).find((x) => x.correct).kind,
    "low",
  );
});

test("validatePercentEstimate refuses numbers it cannot draw or check", () => {
  const base = lesson();
  const no = (patch) =>
    assert.equal(validatePercentEstimate({ ...base, ...patch }), null, JSON.stringify(patch).slice(0, 80));
  no({ percent: 0.5 });
  no({ percent: 100 });
  no({ percent: 24.55 });
  no({ bench: 75 }); // not a drawn benchmark
  no({ bench: 10 }); // 24% is not near 10%
  no({ compat: 70 }); // too far from 81
  no({ compat: 82 }); // 25% of 82 is not whole
  no({ whole: 1 });
  no({ prefix: "", unit: undefined });
  no({ compat: 81, whole: 81, percent: 25, bench: 25 }); // 81 is not a multiple of 4
  no({ percent: 25, compat: 80, whole: 80 }); // estimate would be exact: no check to teach
  no({ transfer: undefined });
  assert.equal(buildPercentEstimatePlay(null), null);
  assert.ok(validatePercentEstimate(base));
});

test("the play has six scenes with gates on predict, benchmarks and check", () => {
  const play = buildPercentEstimatePlay(lesson());
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["bench", true],
      ["estimate", false],
      ["check", true],
      ["transfer", false],
    ],
  );
  assert.equal(play.viewBox, "0 0 480 300");
});

test("copy states the lesson's numbers in both languages", () => {
  const c = estimateCopy(validatePercentEstimate(lesson()));
  assert.match(c.printSummary.en, /24% of \$81/);
  assert.match(c.printSummary.en, /25% of \$80 is \$20/);
  assert.match(c.printSummary.en, /0\.24 × 81, is \$19\.44, so the estimate is a little high/);
  assert.match(c.printSummary.es, /el 24% de \$81/);
  assert.match(c.printSummary.es, /un poco alta/);
  assert.match(c.check.ok.en, /0\.24 × 81 = \$19\.44/);
  assert.match(c.transfer.ok.en, /10% of 220 = 22 pounds/);
  assert.match(c.transfer.ok.es, /alrededor de 22 libras/);
  assert.equal(c.check.exactLine, "0.24 × 81 = $19.44");
  // the wrong choices explain; none states the exact answer 19.44
  for (const kind of ["number", "b10", "b50"]) assert.doesNotMatch(c.predict.cue(kind, 8).en, /19\.44|\b20\b/);
  for (const kind of ["high", "low", "exact"]) assert.doesNotMatch(c.check.cue(kind).en, /19\.44/);
  for (const text of [c.title.es, c.ariaLabel.es, c.printSummary.es, c.check.ok.es, c.predict.cue("b10", 8).es])
    assert.doesNotMatch(text, /\busted\b|\bel entero\b|\d %/);
});
