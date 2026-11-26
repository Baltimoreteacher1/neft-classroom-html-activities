// Pure-function proof for the ratio-parts living scene (lesson 3-1).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildRatioPartsPlay, validateRatioParts as reexported } from "./ratio-parts.js";
import {
  partToPartChoices,
  partToWholeChoices,
  partValue,
  placeCorrect,
  READINGS,
  ratioPartsCopy,
  validateRatioParts,
} from "./ratio-parts-model.js";

const LESSON_3_1 = {
  a: 3,
  b: 2,
  labelA: { en: "apple juice", es: "jugo de manzana" },
  labelB: { en: "sparkling water", es: "agua con gas" },
  whole: { en: "the whole drink", es: "toda la bebida" },
  story: {
    en: "Chef Reyes uses 3 cups of apple juice for every 2 cups of sparkling water.",
    es: "El chef Reyes usa 3 tazas de jugo de manzana por cada 2 tazas de agua con gas.",
  },
  transfer: {
    a: 4,
    b: 1,
    labelA: { en: "apples", es: "manzanas" },
    labelB: { en: "oranges", es: "naranjas" },
    whole: { en: "all the fruit", es: "toda la fruta" },
    story: { en: "A bowl has 4 apples and 1 orange.", es: "Un tazón tiene 4 manzanas y 1 naranja." },
  },
};
const clone = () => JSON.parse(JSON.stringify(LESSON_3_1));

test("validation rejects bad configs", () => {
  const mut = (f) => {
    const c = clone();
    f(c);
    return c;
  };
  const bad = [
    null,
    "3:2",
    {},
    mut((c) => {
      c.a = 2; // equal parts: order would not matter
    }),
    mut((c) => {
      c.a = 0;
    }),
    mut((c) => {
      c.a = 9;
    }),
    mut((c) => {
      c.a = 6; // 6 + 5 > 10 parts
      c.b = 5;
    }),
    mut((c) => {
      c.b = 1.5;
    }),
    mut((c) => {
      c.labelA = "";
    }),
    mut((c) => {
      c.labelA = "a label that is far too long to fit on the stage";
    }),
    mut((c) => {
      c.story = undefined;
    }),
    mut((c) => {
      c.whole = 4;
    }),
    mut((c) => {
      c.transfer = undefined;
    }),
    mut((c) => {
      c.transfer.a = c.transfer.b;
    }),
    mut((c) => {
      c.transfer.a = 3; // identical to the main ratio
      c.transfer.b = 2;
    }),
  ];
  for (const cfg of bad) {
    assert.equal(validateRatioParts(cfg), null, JSON.stringify(cfg));
    assert.equal(buildRatioPartsPlay(cfg), null, JSON.stringify(cfg));
  }
  assert.equal(reexported, validateRatioParts);
});

test("the lesson config is accepted and builds", () => {
  const v = validateRatioParts(LESSON_3_1);
  assert.deepEqual([v.a, v.b, v.transfer.a, v.transfer.b], [3, 2, 4, 1]);
  const play = buildRatioPartsPlay(LESSON_3_1);
  assert.deepEqual(
    play.scenes.map((s) => s.id),
    ["situate", "predict", "readings", "write", "transfer"],
  );
  assert.deepEqual(
    play.scenes.map((s) => Boolean(s.gate)),
    [false, true, true, false, false],
  );
});

test("part-to-part choices: one correct, order and whole mistakes are really different", () => {
  for (let a = 1; a <= 8; a++)
    for (let b = 1; a + b <= 10 && b <= 8; b++) {
      if (a === b) continue;
      const opts = partToPartChoices(a, b);
      assert.equal(opts.filter((o) => o.correct).length, 1);
      const key = (o) => `${o.x}:${o.y}`;
      assert.equal(new Set(opts.map(key)).size, opts.length, `${a}:${b}`);
      const right = opts.find((o) => o.correct);
      assert.deepEqual([right.x, right.y], [a, b]);
      for (const o of opts.filter((x) => !x.correct)) assert.notDeepEqual([o.x, o.y], [a, b]);
      assert.deepEqual(opts.find((o) => o.kind === "reversed"), { x: b, y: a, correct: false, kind: "reversed" });
      assert.equal(opts.find((o) => o.kind === "whole").y, a + b);
    }
});

test("part-to-whole choices: the whole is every tile, a + b", () => {
  const opts = partToWholeChoices(4, 1);
  assert.deepEqual(
    opts.map((o) => `${o.x}:${o.y}:${o.correct}`),
    ["4:5:true", "4:1:false", "1:5:false", "5:4:false"],
  );
  for (let a = 1; a <= 8; a++)
    for (let b = 1; a + b <= 10 && b <= 8; b++) {
      if (a === b) continue;
      const o = partToWholeChoices(a, b);
      assert.equal(new Set(o.map((x) => `${x.x}:${x.y}`)).size, o.length);
      assert.equal(o.filter((x) => x.correct).length, 1);
    }
});

test("placeCorrect never leaves the correct choice in one slot", () => {
  const slots = new Set(
    [0, 1, 2, 3, 4, 5].map((s) => placeCorrect(partToPartChoices(3, 2), s).findIndex((o) => o.correct)),
  );
  assert.ok(slots.size >= 3);
  // The lesson's own seeds put the correct choice off the first slot.
  assert.notEqual(placeCorrect(partToPartChoices(3, 2), 5).findIndex((o) => o.correct), 0);
  assert.notEqual(placeCorrect(partToWholeChoices(4, 1), 4 + 2 * 1).findIndex((o) => o.correct), 0);
});

test("readings: each reading's numbers are recomputed from the picture", () => {
  const v = validateRatioParts(LESSON_3_1);
  const written = Object.fromEntries(
    Object.entries(READINGS).map(([id, r]) => [id, `${partValue(v, r.first)}:${partValue(v, r.second)}`]),
  );
  assert.deepEqual(written, { ab: "3:2", ba: "2:3", aw: "3:5", bw: "2:5" });
  assert.equal(partValue(v, "W"), 3 + 2);
});

test("the copy states the lesson's own numbers in both languages", () => {
  const c = ratioPartsCopy(validateRatioParts(LESSON_3_1));
  assert.match(c.title.en, /3 : 2 is not 2 : 3/);
  assert.match(c.predict.ok.en, /3 to 2, or 3 : 2/);
  assert.match(c.readings.say1.aw.en, /3 to 5/);
  assert.match(c.readings.say1.bw.es, /2 a 5/);
  assert.match(c.readings.done.en, /3 : 2, 2 : 3, 3 : 5 and 2 : 5/);
  assert.match(c.write.say.en, /3 : 2, 3 to 2, and 3\/2/);
  assert.match(c.transfer.ok.en, /4 of the 5 parts are apples/);
  assert.match(c.transfer.ok.es, /4 de las 5 partes son manzanas/);
  assert.match(c.predict.cues.whole.en, /tile in the strip: 5\./);
  assert.match(c.printSummary.en, /3 : 5 \(part to whole\)/);
  for (const k of ["title", "printSummary", "situate"]) {
    assert.ok(c[k].en && c[k].es && c[k].en !== c[k].es, k);
  }
});

test("the 3-1 lesson authors this scene and it builds", () => {
  const cfg = JSON.parse(readFileSync(new URL("../../../lessons/3-1/config.json", import.meta.url), "utf8"));
  const ls = cfg.launch.conceptIntro.livingScene;
  assert.equal(ls.play, "ratio-parts");
  assert.ok(buildRatioPartsPlay(ls));
  assert.deepEqual([ls.a, ls.b], [3, 2]);
});
