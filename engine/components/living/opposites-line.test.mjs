// opposites-line.test.mjs — every number the opposites-line play states (7-1).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { slotFor } from "./numline-model.js";
import { buildOppositesLinePlay, validateOppositesLine as reexported } from "./opposites-line.js";
import {
  oppositesCopy,
  placeCorrect,
  predictChoices,
  transferChoices,
  validateOppositesLine,
} from "./opposites-line-model.js";

const CFG = JSON.parse(
  readFileSync(new URL("../../../lessons/7-1/config.json", import.meta.url), "utf8"),
).launch.conceptIntro.livingScene;
const clone = (o) => JSON.parse(JSON.stringify(o));
const M = "−";

test("validation accepts the 7-1 config and fills the numbers", () => {
  const v = validateOppositesLine(CFG);
  assert.equal(v.value, 9);
  assert.equal(v.max, 12);
  assert.equal(v.min, -12);
  assert.equal(v.unit, "°C");
  assert.equal(v.pos.en, "Toronto");
  assert.equal(v.neg.es, "Reikiavik");
  assert.equal(v.transfer.value, 86);
  assert.equal(v.transfer.max, 100);
  assert.equal(v.transfer.name.en, "Badwater Basin");
  assert.equal(reexported, validateOppositesLine);
});

test("validation refuses lines and numbers the stage cannot draw", () => {
  const mut = (f) => {
    const c = clone(CFG);
    f(c);
    return c;
  };
  const bad = [
    null,
    "x",
    {},
    mut((c) => {
      c.value = 1; // an opposite of 1 would sit beside 0: the labels collide
    }),
    mut((c) => {
      c.value = 13; // off the line
    }),
    mut((c) => {
      c.value = 9.5;
    }),
    mut((c) => {
      c.min = -10; // not symmetric
    }),
    mut((c) => {
      c.labelEvery = 5; // not a multiple of tickEvery 2 below
      c.tickEvery = 2;
    }),
    mut((c) => {
      c.unit = "degrees C"; // too long to label
    }),
    mut((c) => {
      delete c.transfer;
    }),
    mut((c) => {
      c.transfer.name = null;
    }),
    mut((c) => {
      c.transfer.value = 50; // max − b = b: two choices would be the same number
    }),
    mut((c) => {
      c.transfer.value = 100; // max − b = 0
    }),
    mut((c) => {
      c.transfer.value = 150;
    }),
  ];
  for (const cfg of bad) {
    assert.equal(validateOppositesLine(cfg), null, JSON.stringify(cfg)?.slice(0, 120));
    assert.equal(buildOppositesLinePlay(cfg), null);
  }
});

test("predictChoices: the opposite is the one right answer; each mistake is really wrong", () => {
  const c = predictChoices(9);
  assert.equal(c.filter((o) => o.correct).length, 1);
  assert.equal(c.find((o) => o.correct).value, -9);
  assert.deepEqual(
    Object.fromEntries(c.map((o) => [o.kind, o.value])),
    { opposite: -9, same: 9, near: -1, zero: 0 },
  );
  // Independent check: opposites add to 0, so no mistake may.
  for (const o of c.filter((x) => !x.correct)) assert.notEqual(o.value + 9, 0, o.kind);
  assert.equal(new Set(c.map((o) => o.value)).size, 4, "four different numbers");
});

test("transferChoices: 86 is the opposite of −86; the others are not", () => {
  const c = transferChoices(86, 100);
  assert.deepEqual(
    c.map((o) => [o.kind, o.value, !!o.correct]),
    [
      ["opposite", 86, true],
      ["sameSide", -86, false],
      ["end", 14, false],
    ],
  );
  assert.equal(86 + -86, 0, "opposites add to 0");
  assert.notEqual(86 + 14, 0);
});

test("the right answer is never the first choice, whatever the numbers", () => {
  for (let a = 2; a < 40; a++) {
    for (const [n, list] of [
      [4, predictChoices(a)],
      [3, transferChoices(a, a * 3)],
    ]) {
      const placed = placeCorrect(list, slotFor(a, n));
      assert.ok(!placed[0].correct, `a = ${a}`);
    }
  }
});

test("copy states the lesson's numbers, computed from the config", () => {
  const v = validateOppositesLine(CFG);
  const T = oppositesCopy(v);
  assert.match(T.printSummary.en, new RegExp(`Toronto: 9°C, 9 degrees above zero`));
  assert.match(T.printSummary.en, new RegExp(`Reykjavik: ${M}9°C, 9 degrees below zero`));
  assert.match(T.printSummary.en, new RegExp(`−\\(${M}9\\) = 9`));
  assert.match(T.printSummary.en, new RegExp(`the opposite of ${M}86 m is 86 m`));
  assert.match(T.printSummary.es, new RegExp(`el opuesto de ${M}86 m es 86 m`));
  assert.equal(T.notationExpr(0), "9");
  assert.equal(T.notationExpr(1), `−(9) = ${M}9`);
  assert.equal(T.notationExpr(2), `−(${M}9) = 9`);
  assert.equal(T.mirrorRow(5).en, `5°C and its opposite ${M}5°C: each is 5 degrees from 0.`);
  assert.equal(T.mirrorRow(-3).en, `${M}3°C and its opposite 3°C: each is 3 degrees from 0.`);
  assert.match(T.mirrorRow(1).en, /1 degree from 0/);
  assert.match(T.mirrorRow(1).es, /1 grado del 0/);
  assert.equal(T.plain(9, v.uw).es, "9 grados");
  assert.match(T.predictOk.en, /9 degrees below zero, −9°C/);
  assert.match(T.transferOk.es, /86 m está a 86 metros sobre el nivel del mar/);
  assert.doesNotMatch(T.title.en, /9|86/, "the title gives nothing away");
});

test("every sentence exists in both languages; Spanish has no English left", () => {
  const T = oppositesCopy(validateOppositesLine(CFG));
  const all = [];
  const samples = {
    predictCue: ["same", "near", "zero"],
    transferCue: ["sameSide", "end"],
  };
  const visit = (x, key = "") => {
    if (typeof x === "function") {
      for (const a of samples[key] || [0, 1, 2, 3]) {
        try {
          visit(x(a, { en: "degrees", es: "grados" }));
        } catch {
          /* wrong arity for this sample */
        }
      }
    } else if (x && typeof x === "object" && "en" in x && "es" in x) all.push(x);
    else if (x && typeof x === "object") for (const [k, y] of Object.entries(x)) visit(y, k);
  };
  visit(T);
  assert.ok(all.length > 30);
  for (const p of all) {
    assert.ok(p.en.trim() && p.es.trim(), JSON.stringify(p));
    assert.doesNotMatch(p.es, /\b(the|and|is|of|you|your|zero|opposite|from)\b/i, p.es);
    assert.doesNotMatch(p.es, /\busted\b|\bvosotros\b/i);
  }
});

test("buildOppositesLinePlay: six scenes, gates where the student acts", () => {
  const play = buildOppositesLinePlay(CFG);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["mirror", true],
      ["notation", true],
      ["zero", true],
      ["transfer", false],
    ],
  );
  assert.match(play.viewBox, /^0 0 \d+ \d+$/);
  assert.ok(Number(play.viewBox.split(" ")[2]) <= 480, "phone-friendly width");
});
