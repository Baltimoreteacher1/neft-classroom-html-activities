// rational-line.test.mjs — every number the rational-line play states (7-2).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { slotFor } from "./numline-model.js";
import { buildRationalLinePlay, validateRationalLine as reexported } from "./rational-line.js";
import {
  partsOf,
  placeCorrect,
  predictChoices,
  rationalCopy,
  transferChoices,
  validateRationalLine,
} from "./rational-line-model.js";

const CFG = JSON.parse(
  readFileSync(new URL("../../../lessons/7-2/config.json", import.meta.url), "utf8"),
).launch.conceptIntro.livingScene;
const clone = (o) => JSON.parse(JSON.stringify(o));
const M = "−";

test("validation accepts the 7-2 config (Buried Gem, Shore Marker, Tide Mark)", () => {
  const v = validateRationalLine(CFG);
  assert.equal(v.target.value, -2.5);
  assert.equal(v.place.value, 0.75);
  assert.equal(v.place.den, 4);
  assert.equal(v.transfer.value, -0.5);
  assert.equal(v.transfer.den, 2);
  assert.deepEqual([v.min, v.max], [-4, 4]);
  assert.equal(reexported, validateRationalLine);
});

test("validation refuses clues the line cannot show or that read as the same thing", () => {
  const mut = (f) => {
    const c = clone(CFG);
    f(c);
    return c;
  };
  const bad = [
    null,
    {},
    mut((c) => {
      c.target.value = -2; // an integer: nothing to split
    }),
    mut((c) => {
      c.target.value = -2.25; // not a half
    }),
    mut((c) => {
      c.target.value = -0.5; // |v| < 1.5: two choices would coincide
    }),
    mut((c) => {
      c.target.value = -3.5; // its neighbour −4.5 is off the line
    }),
    mut((c) => {
      c.place.value = 1; // whole number
    }),
    mut((c) => {
      c.place.value = 0.7; // not on the 1/4 grid
    }),
    mut((c) => {
      c.place.den = 1;
    }),
    mut((c) => {
      c.place.value = 4.75; // off the line
    }),
    mut((c) => {
      c.transfer.value = -1.5; // not a unit fraction below 1
    }),
    mut((c) => {
      c.transfer.value = 0.4; // 2/5 is not 1/d
    }),
    mut((c) => {
      c.max = 20; // too many ticks for a phone
    }),
    mut((c) => {
      c.transfer.name = "";
    }),
    mut((c) => {
      c.target.value = 0.5; // |v| < 1.5
    }),
  ];
  for (const cfg of bad) {
    assert.equal(validateRationalLine(cfg), null, JSON.stringify(cfg)?.slice(0, 160));
    assert.equal(buildRationalLinePlay(cfg), null);
  }
});

test("predictChoices(−2.5): exactly one right spot; the mistakes are really elsewhere", () => {
  const c = predictChoices(-2.5);
  assert.equal(c.filter((o) => o.correct).length, 1);
  assert.deepEqual(
    c.map((o) => [o.kind, o.value]),
    [
      ["exact", -2.5],
      ["closer", -1.5],
      ["mirror", 2.5],
      ["farther", -3.5],
    ],
  );
  // Independent: the halfway point between k and k+1 is k + 0.5, and −2.5 = −3 + 0.5.
  assert.equal(-3 + 0.5, -2.5);
  assert.equal(new Set(c.map((o) => o.value)).size, 4);
  const T = rationalCopy(validateRationalLine(CFG));
  assert.equal(T.predictLabel(-2.5).en, `Halfway between ${M}3 and ${M}2`);
  assert.equal(T.predictLabel(-1.5).en, `Halfway between ${M}2 and ${M}1`);
  assert.equal(T.predictLabel(2.5).en, "Halfway between 2 and 3");
  assert.equal(T.predictLabel(-3.5).en, `Halfway between ${M}4 and ${M}3`);
});

test("partsOf: where 0.75 sits among the quarters, and every slider position says so", () => {
  assert.deepEqual(partsOf(0.75, 4), { whole: false, lo: 0, hi: 1, r: 3, den: 4 });
  assert.deepEqual(partsOf(-0.75, 4), { whole: false, lo: -1, hi: 0, r: 1, den: 4 });
  assert.deepEqual(partsOf(-2.5, 4), { whole: false, lo: -3, hi: -2, r: 2, den: 4 });
  assert.deepEqual(partsOf(2, 4), { whole: true, at: 2 });
  // The reading is consistent: lo + r/den is the value, for every slider step.
  for (let k = -16; k <= 16; k++) {
    const x = k / 4;
    const p = partsOf(x, 4);
    if (!p.whole) assert.equal(p.lo + p.r / p.den, x, `k = ${k}`);
  }
  const T = rationalCopy(validateRationalLine(CFG));
  assert.equal(T.placeRow(0.75).en, "0.75 = 3/4: between 0 and 1, 3 of 4 equal parts from 0.");
  assert.equal(T.placeRow(1).en, "1 is a whole number: it sits right on a mark.");
  assert.match(T.placeRow(-0.25).en, new RegExp(`^${M}0.25 = ${M}1/4: between ${M}1 and 0, 3 of 4`));
});

test("transferChoices(−1/2): one letter is right, each mistake misreads it differently", () => {
  const c = transferChoices(-0.5, 2);
  assert.deepEqual(
    c.map((o) => [o.letter, o.kind, o.value]),
    [
      ["A", "denominator", -2],
      ["B", "whole", -1.5],
      ["C", "exact", -0.5],
      ["D", "sign", 0.5],
    ],
  );
  assert.equal(c.filter((o) => o.correct).length, 1);
  assert.equal(c.find((o) => o.correct).value, -1 / 2);
  assert.ok(c.every((o, i) => !i || o.value > c[i - 1].value), "lettered left to right");
  assert.ok(c.every((o, i) => !i || o.value - c[i - 1].value >= 0.5), "labels do not collide");
});

test("the right answer is never first in the predict set", () => {
  for (const v of [-2.5, 2.5, -3.5, 3.5]) {
    const placed = placeCorrect(predictChoices(v), slotFor(v * 2, 4));
    assert.ok(!placed[0].correct, String(v));
  }
});

test("copy states the lesson's numbers, computed from the config", () => {
  const T = rationalCopy(validateRationalLine(CFG));
  assert.match(T.printSummary.en, new RegExp(`${M}2.5 is between ${M}3 and ${M}2`));
  assert.match(T.printSummary.en, new RegExp(`Its opposite is 2.5`));
  assert.match(T.printSummary.en, /0.75 = 3\/4: split 0 to 1 into 4 equal parts and count 3/);
  assert.match(T.printSummary.en, new RegExp(`${M}1/2 = ${M}0.5`));
  assert.match(T.predictOk.en, new RegExp(`${M}2.5 = ${M}5/2`));
  assert.equal(T.mirrorExpr, `−(${M}2.5) = 2.5`);
  assert.match(T.mirrorFb.en, new RegExp(`${M}5/2 and 5/2`));
  assert.match(T.placeOk.en, /denominator 4 splits the space from 0 to 1 into 4 equal parts, and the numerator 3 counts 3/);
  assert.match(T.transferOk.es, /medio paso a la izquierda del 0/);
  assert.equal(T.unitsOf(2.5).es, "2.5 unidades");
  assert.doesNotMatch(T.title.en, /2\.5|0\.75/, "the title gives nothing away");
});

test("every sentence exists in both languages; Spanish has no English left", () => {
  const T = rationalCopy(validateRationalLine(CFG));
  const all = [];
  const samples = {
    predictCue: [
      ["closer", -1.5],
      ["farther", -3.5],
      ["mirror", 2.5],
    ],
    transferCue: [
      ["sign", 0.5],
      ["whole", -1.5],
      ["denominator", -2],
    ],
  };
  const visit = (x, key = "") => {
    if (typeof x === "function") {
      for (const a of samples[key] || [[0.75], [-0.25], [1], [2.5]]) {
        try {
          visit(x(...a));
        } catch {
          /* wrong arity for this sample */
        }
      }
    } else if (x && typeof x === "object" && "en" in x && "es" in x) all.push(x);
    else if (x && typeof x === "object") for (const [k, y] of Object.entries(x)) visit(y, k);
  };
  visit(T);
  assert.ok(all.length > 25);
  for (const p of all) {
    assert.ok(p.en.trim() && p.es.trim(), JSON.stringify(p));
    assert.doesNotMatch(p.es, /\b(the|and|is|of|you|your|between|equal|parts|whole)\b/i, p.es);
    assert.doesNotMatch(p.es, /\busted\b|\bvosotros\b/i);
  }
});

test("buildRationalLinePlay: five scenes, gates where the student acts", () => {
  const play = buildRationalLinePlay(CFG);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["place", true],
      ["mirror", false],
      ["transfer", false],
    ],
  );
  assert.ok(Number(play.viewBox.split(" ")[2]) <= 480);
});
