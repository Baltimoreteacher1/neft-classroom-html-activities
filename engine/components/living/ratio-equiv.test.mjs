// Pure-function proof for the ratio-equiv living scene (lesson 3-9).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildRatioEquivPlay, validateRatioEquiv as reexported } from "./ratio-equiv.js";
import {
  factorChoices,
  isEquivalent,
  MAX_FACTOR,
  missingChoices,
  placeAway,
  ratioEquivCopy,
  validateRatioEquiv,
  wrongCard,
} from "./ratio-equiv-model.js";

const LESSON = JSON.parse(
  readFileSync(new URL("../../../lessons/3-9/config.json", import.meta.url), "utf8"),
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
    "3:2",
    {},
    mut((c) => {
      c.a = c.b; // adding the same to both would look right
    }),
    mut((c) => {
      c.a = 0;
    }),
    mut((c) => {
      c.b = 10;
    }),
    mut((c) => {
      c.from = 1;
    }),
    mut((c) => {
      c.to = 33; // not a whole number of times the recipe
    }),
    mut((c) => {
      c.to = 8; // factor 1: nothing to scale
    }),
    mut((c) => {
      c.to = 80; // factor 10: past the slider range
    }),
    mut((c) => {
      c.labelA = "";
    }),
    mut((c) => {
      c.labelS = "a label far too long";
    }),
    mut((c) => {
      c.story = undefined;
    }),
    mut((c) => {
      c.transfer = undefined;
    }),
    mut((c) => {
      c.transfer.second = 14; // 14 is not a multiple of 5
    }),
    mut((c) => {
      c.transfer.second = 5; // factor 1
    }),
    mut((c) => {
      c.transfer.a = c.transfer.b;
    }),
    mut((c) => {
      c.transfer.a = c.a;
      c.transfer.b = c.b;
      c.transfer.second = c.b * 3;
    }),
  ];
  for (const cfg of bad) {
    assert.equal(validateRatioEquiv(cfg), null, JSON.stringify(cfg));
    assert.equal(buildRatioEquivPlay(cfg), null, JSON.stringify(cfg));
  }
  assert.equal(reexported, validateRatioEquiv);
});

test("the lesson config builds with the lesson's own numbers", () => {
  const v = validateRatioEquiv(LESSON);
  assert.deepEqual([v.a, v.b, v.from, v.to, v.k], [3, 2, 8, 32, 4]);
  assert.deepEqual([v.transfer.a, v.transfer.b, v.transfer.second, v.transfer.k], [2, 5, 15, 3]);
  const play = buildRatioEquivPlay(LESSON);
  assert.deepEqual(
    play.scenes.map((s) => s.id),
    ["situate", "predict", "scale", "connect", "check", "transfer"],
  );
  assert.deepEqual(
    play.scenes.map((s) => Boolean(s.gate)),
    [false, true, true, false, true, false],
  );
  assert.ok(MAX_FACTOR >= v.k + 2);
});

test("equivalence: the same factor on both terms, in either direction", () => {
  assert.ok(isEquivalent({ a: 3, b: 2 }, { a: 12, b: 8 }));
  assert.ok(isEquivalent({ a: 12, b: 8 }, { a: 3, b: 2 })); // dividing goes back
  assert.ok(isEquivalent({ a: 2, b: 5 }, { a: 6, b: 15 }));
  assert.ok(!isEquivalent({ a: 3, b: 2 }, { a: 12, b: 6 }));
  assert.ok(!isEquivalent({ a: 2, b: 5 }, { a: 4, b: 7 })); // adding 2 to both
  // The lesson's own vocabulary examples.
  assert.ok(isEquivalent({ a: 2, b: 3 }, { a: 4, b: 6 }));
  assert.ok(isEquivalent({ a: 6, b: 9 }, { a: 2, b: 3 }));
  assert.ok(!isEquivalent({ a: 6, b: 9 }, { a: 2, b: 4 }));
  assert.ok(isEquivalent({ a: 2, b: 8 }, { a: 1, b: 4 }));
  assert.ok(!isEquivalent({ a: 2, b: 8 }, { a: 2, b: 5 }));
  for (let a = 1; a <= 9; a++)
    for (let b = 1; b <= 9; b++) {
      if (a === b) continue;
      for (let k = 2; k <= 6; k++) {
        const c = wrongCard(a, b, k);
        assert.ok(!isEquivalent({ a, b }, c), `${a}:${b} k=${k}`);
        assert.ok(isEquivalent({ a, b }, { a: a * k, b: b * k }));
        assert.equal(c.a, a * k);
        assert.equal(c.b, b * (k - 1));
        assert.ok(c.b >= 1);
      }
    }
});

test("factor choices: the quotient, and three real misconceptions", () => {
  assert.deepEqual(factorChoices(8, 32).map((o) => [o.n, o.kind]), [
    [4, "right"],
    [24, "difference"],
    [40, "sum"],
    [256, "product"],
  ]);
  for (let from = 2; from <= 20; from++)
    for (let k = 2; k <= 6; k++) {
      const to = from * k;
      const opts = factorChoices(from, to);
      assert.equal(opts.filter((o) => o.correct).length, 1);
      assert.equal(opts.find((o) => o.correct).n, to / from);
      assert.equal(new Set(opts.map((o) => o.n)).size, opts.length);
      for (const o of opts.filter((x) => !x.correct)) assert.notEqual(o.n, k);
    }
  assert.notEqual(placeAway(factorChoices(8, 32), 8 + 32 + 4).findIndex((o) => o.correct), 0);
});

test("missing-term choices: 2 : 5 = ? : 15", () => {
  const v = validateRatioEquiv(LESSON);
  const opts = missingChoices(v.transfer);
  assert.deepEqual(opts.map((o) => [o.n, o.kind]), [
    [6, "right"],
    [12, "additive"],
    [3, "factor"],
    [10, "difference"],
  ]);
  const right = opts.find((o) => o.correct);
  assert.ok(isEquivalent({ a: 2, b: 5 }, { a: right.n, b: 15 }));
  for (const o of opts.filter((x) => !x.correct)) assert.ok(!isEquivalent({ a: 2, b: 5 }, { a: o.n, b: 15 }), o.kind);
  assert.notEqual(placeAway(opts, 2 + 5 + 3).findIndex((o) => o.correct), 0);
});

test("the copy states the lesson's own numbers in both languages", () => {
  const c = ratioEquivCopy(validateRatioEquiv(LESSON));
  assert.deepEqual(c.card, { a: 12, b: 6 });
  assert.match(nb(c.title.en), /3 : 2 = 12 : 8/);
  assert.match(nb(c.predict.ok.en), /32 ÷ 8 = 4/);
  assert.match(nb(c.predict.cues.difference.en), /24 is how many MORE people/);
  assert.match(nb(c.scale.done.en), /3 × 4 = 12 and 2 × 4 = 8/);
  assert.match(nb(c.scale.done.es), /3 × 4 = 12 y 2 × 4 = 8/);
  assert.match(nb(c.scale.status(4, 3).en), /× 4 on tomatoes but × 3 on broth: 12 : 6/);
  assert.match(nb(c.connect.say.en), /12 : 8 ÷ 4 = 3 : 2/);
  assert.match(nb(c.check.ok.en), /3 × 4 = 12 but 2 × 3 = 6/);
  assert.match(nb(c.transfer.ok.en), /15 ÷ 5 = 3, and 2 × 3 = 6\. So 2 : 5 = 6 : 15/);
  assert.match(nb(c.printSummary.es), /El factor de escala es 32 ÷ 8 = 4/);
  assert.equal(c.check.options.filter((o) => o.correct).length, 1);
  assert.notEqual(c.check.options.findIndex((o) => o.correct), 0);
  for (const o of c.check.options.filter((x) => !x.correct)) assert.ok(o.cue.en && o.cue.es);
  for (const k of ["title", "printSummary", "situate", "ariaLabel"]) assert.ok(c[k].en && c[k].es && c[k].en !== c[k].es, k);
});
