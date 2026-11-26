// percent-fdp.test.mjs — the living-scene "one region, three names" play:
// config validation and every number it puts on the stage, computed
// independently.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildPercentFdpPlay, validatePercentFdp } from "./percent-fdp.js";
import { choicesFor, cut, DENOMS, EXPLORE, fdpCopy } from "./percent-fdp-model.js";

const lesson = () =>
  JSON.parse(readFileSync(new URL("../../../lessons/4-2/config.json", import.meta.url), "utf8"))
    .launch.conceptIntro.livingScene;

// Independent reference: exact decimal text of n/d from integer long division.
const refDecimal = (n, d) => {
  const hundredths = (n * 100) / d;
  assert.ok(Number.isInteger(hundredths), `${n}/${d} is not exact in hundredths`);
  return (hundredths / 100).toString();
};

test("the 4-2 config is the lesson's 3/4 and 1/5", () => {
  const v = validatePercentFdp(lesson());
  assert.ok(v);
  assert.deepEqual([v.n, v.d, v.k, v.p, v.dec], [3, 4, 25, 75, "0.75"]);
  assert.deepEqual(
    [v.transfer.n, v.transfer.d, v.transfer.k, v.transfer.p, v.transfer.dec],
    [1, 5, 20, 20, "0.2"],
  );
});

test("every explore fraction is exact and has the same three names", () => {
  assert.ok(EXPLORE.some(([n, d]) => n === 3 && d === 4));
  assert.ok(EXPLORE.some(([n, d]) => n === 1 && d === 5));
  for (const [n, d] of EXPLORE) {
    assert.ok(DENOMS.includes(d), `${n}/${d}`);
    assert.ok(n < d);
    const p = (n * 100) / d;
    assert.ok(Number.isInteger(p));
    assert.equal(refDecimal(n, d), String(p / 100));
  }
});

test("every legal fraction cuts into exactly 100 pieces with p shaded", () => {
  for (const d of DENOMS)
    for (let n = 1; n < d; n++) {
      const v = validatePercentFdp({ n, d, transfer: { n: 1, d: n === 1 && d === 2 ? 4 : 2 } });
      if (!v) continue;
      const end = cut(v, v.k);
      assert.deepEqual([end.parts, end.shaded], [100, (n * 100) / d]);
      for (let j = 1; j <= v.k; j++) {
        const c = cut(v, j);
        // the shaded fraction never changes size while the pieces get smaller
        assert.equal(c.shaded * d, c.parts * n);
      }
    }
});

test("choicesFor: p is correct; complement, side-by-side digits and adding are wrong", () => {
  const o = choicesFor(validatePercentFdp(lesson()));
  assert.deepEqual(
    o.map((x) => [x.kind, x.p]),
    [
      ["correct", 75],
      ["complement", 25],
      ["concat", 34],
      ["add", 99],
    ],
  );
  const t = choicesFor(validatePercentFdp(lesson()).transfer);
  assert.deepEqual(
    t.map((x) => [x.kind, x.p]),
    [
      ["correct", 20],
      ["complement", 80],
      ["concat", 15],
      ["add", 96],
    ],
  );
  // 1/2: complement equals the answer, so it is dropped
  const half = choicesFor({ n: 1, d: 2, p: 50 });
  assert.equal(half.filter((x) => x.correct).length, 1);
  assert.ok(!half.some((x) => x.kind === "complement"));
  for (const d of DENOMS)
    for (let n = 1; n < d; n++) {
      const c = choicesFor({ n, d, p: (n * 100) / d });
      if (!c) continue;
      assert.equal(c.filter((x) => x.correct).length, 1);
      assert.equal(new Set(c.map((x) => x.p)).size, c.length);
    }
});

test("validatePercentFdp refuses what it cannot draw", () => {
  const t = { n: 1, d: 5 };
  for (const cfg of [
    null,
    {},
    { n: 1, d: 3, transfer: t },
    { n: 1, d: 8, transfer: t },
    { n: 4, d: 4, transfer: t },
    { n: 0, d: 4, transfer: t },
    { n: 1.5, d: 4, transfer: t },
    { n: 3, d: 4 }, // no transfer
    { n: 3, d: 4, transfer: { n: 3, d: 4 } }, // same fraction
    { n: 1, d: 5, transfer: { n: 2, d: 10 } }, // same percent
  ])
    assert.equal(validatePercentFdp(cfg), null, JSON.stringify(cfg));
  assert.equal(buildPercentFdpPlay({ n: 1, d: 3 }), null);
});

test("the play has six scenes with gates on predict, cut and explore", () => {
  const play = buildPercentFdpPlay(lesson());
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["cut", true],
      ["names", false],
      ["explore", true],
      ["transfer", false],
    ],
  );
  assert.equal(play.viewBox, "0 0 480 290");
});

test("copy states 3/4 = 75/100 = 0.75 = 75% in both languages", () => {
  const c = fdpCopy(validatePercentFdp(lesson()));
  assert.match(c.printSummary.en, /3\/4 = 75\/100 = 0\.75 = 75%\./);
  assert.match(c.printSummary.en, /3 × 25 = 75 of 4 × 25 = 100/);
  assert.match(c.printSummary.es, /3\/4 = 75\/100 = 0\.75 = 75%\./);
  assert.match(c.printSummary.es, /75 centésimas/);
  assert.match(c.transfer.ok.en, /5 × 20 = 100 and 1 × 20 = 20, so 1\/5 = 20\/100 = 0\.2 = 20%/);
  assert.match(c.predict.cue("concat", 34).en, /34 puts the two numbers side by side/);
  assert.equal(c.explore.chain({ n: 1, d: 4, p: 25, dec: "0.25" }), "1/4 = 25/100 = 0.25 = 25%");
  for (const text of [c.title.es, c.ariaLabel.es, c.printSummary.es, c.cut.done.es, c.names.say.es])
    assert.doesNotMatch(text, /\busted\b|\bel entero\b|\d %/);
});
