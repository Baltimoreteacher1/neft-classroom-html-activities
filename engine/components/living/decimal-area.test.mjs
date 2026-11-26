// decimal-area.test.mjs — every number the decimal-area play states (2-12).
// Expected values are recomputed here from whole-number arithmetic, independently
// of the model under test.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildDecimalAreaPlay, validateDecimalArea as reexported } from "./decimal-area.js";
import {
  areaModel,
  decimalAreaCopy,
  estimate,
  multiply,
  parseDec,
  placePoint,
  pointChoices,
  predictChoices,
  validateDecimalArea,
} from "./decimal-area-model.js";

// The 2-12 lesson: weDo 0.4 × 0.7; iDo 4.5 × $12.60; reveal word problem 3.8 × $9.25.
const CFG = {
  a: 0.4,
  b: 0.7,
  big: { a: "4.5", b: "12.60", prefix: "$", story: { en: "The station needs shielding." } },
  transfer: { a: "3.8", b: "9.25", prefix: "$" },
};

test("parseDec keeps a trailing zero's decimal place", () => {
  assert.deepEqual(
    [parseDec("12.60").int, parseDec("12.60").places],
    [1260, 2],
    "12.60 is 1260 with 2 places",
  );
  assert.deepEqual([parseDec("4.5").int, parseDec("4.5").places], [45, 1]);
  assert.equal(parseDec("12.6").places, 1);
  assert.equal(parseDec("7").places, 0);
  for (const bad of ["", "x", "1e3", "-2", "1.2.3", "1,5", ".5", "1000.5", "1.2345", null, undefined])
    assert.equal(parseDec(bad), null, String(bad));
});

test("placePoint puts the point that many digits from the right", () => {
  assert.equal(placePoint(28, 2), "0.28");
  assert.equal(placePoint(28, 3), "0.028");
  assert.equal(placePoint(28, 1), "2.8");
  assert.equal(placePoint(56700, 3), "56.700");
  assert.equal(placePoint(5, 2), "0.05");
  assert.equal(placePoint(120, 0), "120");
});

test("multiply: 4.5 × 12.60 = 45 × 1260 = 56,700 with 1 + 2 = 3 places", () => {
  const m = multiply("4.5", "12.60");
  assert.equal(m.prod, 45 * 1260);
  assert.equal(m.prod, 56700);
  assert.equal(m.places, 3);
  assert.equal(m.text, "56.700");
  assert.equal(Number(m.text), 4.5 * 12.6 > 56.69 ? 56.7 : 0);
  const t = multiply("3.8", "9.25");
  assert.equal(t.prod, 38 * 925);
  assert.equal(t.prod, 35150);
  assert.equal(t.text, "35.150");
  assert.equal(multiply("0.4", "0.7").text, "0.28");
});

test("estimate: 4.5 × 12.60 ≈ 5 × 13 = 65, 3.8 × 9.25 ≈ 4 × 9 = 36", () => {
  assert.deepEqual(Object.values(estimate("4.5", "12.60")), [5, 13, 65]);
  assert.deepEqual(Object.values(estimate("3.8", "9.25")), [4, 9, 36]);
  // The estimate is near the real product: the check that places the point.
  assert.ok(Math.abs(56.7 - 65) < 10);
  assert.ok(Math.abs(35.15 - 36) < 2);
});

test("areaModel: 4 columns × 7 rows = 28 small squares = 0.28", () => {
  const m = areaModel(4, 7);
  assert.equal(m.squares, 28);
  assert.equal(m.text, "0.28");
  assert.equal(m.a * m.b > 0.279 && m.a * m.b < 0.281, true);
  assert.equal(areaModel(5, 6).text, "0.30", "30 hundredths keeps its place");
  assert.equal(areaModel(9, 9).squares, 81);
});

test("predictChoices: one right, three real slips, all distinct", () => {
  const c = predictChoices(0.4, 0.7);
  assert.equal(c.filter((o) => o.correct).length, 1);
  assert.deepEqual(
    c.map((o) => [o.kind, o.text]),
    [
      ["product", "0.28"],
      ["add", "1.1"],
      ["big", "2.8"],
      ["small", "0.028"],
    ],
  );
  assert.equal(0.4 + 0.7 > 1, true, "the sum slip is more than the whole");
  assert.equal(new Set(c.map((o) => Number(o.text))).size, c.length);
  // A product equal to a slip collapses it rather than duplicating a choice.
  const s = predictChoices(0.5, 0.5);
  assert.equal(new Set(s.map((o) => Number(o.text))).size, s.length);
  assert.equal(s.find((o) => o.correct).text, "0.25");
});

test("pointChoices: the right place count plus the three counting slips", () => {
  const c = pointChoices("4.5", "12.60");
  assert.deepEqual(
    c.map((o) => [o.kind, o.places, o.text]),
    [
      ["both", 3, "56.700"],
      ["longer", 2, "567.00"],
      ["one", 1, "5670.0"],
      ["extra", 4, "5.6700"],
    ],
  );
  assert.equal(c.filter((o) => o.correct).length, 1);
  // Every wrong choice is more than 3 decades away from the estimate except none is the product.
  const est = 65;
  const wrongValues = c.filter((o) => !o.correct).map((o) => Number(o.text));
  assert.ok(wrongValues.every((x) => x !== 56.7));
  assert.ok(wrongValues.every((x) => Math.abs(x - est) > Math.abs(56.7 - est)));
  const t = pointChoices("3.8", "9.25").map((o) => o.text);
  assert.deepEqual(t, ["35.150", "351.50", "3515.0", "3.5150"]);
});

test("validation accepts the lesson config and refuses bad ones", () => {
  const v = validateDecimalArea(CFG);
  assert.deepEqual([v.w, v.h], [4, 7]);
  assert.equal(v.big.b, "12.60");
  const bad = [
    null,
    {},
    { ...CFG, a: 0 },
    { ...CFG, a: 1 },
    { ...CFG, a: 0.45 },
    { ...CFG, b: 1.2 },
    { ...CFG, big: undefined },
    { ...CFG, big: { a: "4.5", b: "12.60x" } },
    { ...CFG, big: { a: "4", b: "12" } }, // fewer than 2 decimal places in all
    { ...CFG, big: { a: "0.0", b: "5.5" } }, // a zero factor
    { ...CFG, transfer: { a: "4.5", b: "12.60" } }, // same as big
    { ...CFG, transfer: { a: "0.2", b: "0.3" } }, // product 6, 2 places: digits do not exceed places
  ];
  for (const cfg of bad) {
    assert.equal(validateDecimalArea(cfg), null, JSON.stringify(cfg));
    assert.equal(buildDecimalAreaPlay(cfg), null, JSON.stringify(cfg));
  }
});

test("every sentence states the numbers the arithmetic supports", () => {
  const T = decimalAreaCopy(validateDecimalArea(CFG));
  for (const lang of ["en", "es"]) {
    assert.match(T.buildDone[lang], /4 .* 7 .* 28/);
    assert.match(T.connectSay[lang], /4 × 7 = 28/);
    assert.match(T.connectSay[lang], /1 \+ 1 = 2/);
    assert.match(T.connectSay[lang], /0\.28/);
    assert.match(T.bigSay[lang], /45 × 1,260 = 56,700/);
    assert.match(T.bigOk[lang], /1 \+ 2 = 3/);
    assert.match(T.bigOk[lang], /56\.700/);
    assert.match(T.bigOk[lang], /\$56\.70/);
    assert.match(T.bigOk[lang], /5 × \$13 = \$65/);
    assert.match(T.transferOk[lang], /35\.150/);
    assert.match(T.transferOk[lang], /\$35\.15/);
    assert.match(T.transferOk[lang], /4 × \$9 = \$36/);
    assert.match(T.printSummary[lang], /28 /);
  }
  assert.match(T.buildNow(3, 5).en, /3 columns × 5 rows = 15 small squares.*0\.15/);
  assert.doesNotMatch(T.title.en, /0\.28|56/, "the title does not give an answer away");
  assert.doesNotMatch(T.predictSay.en, /0\.28/);
  assert.equal(T.connectRows.join("|"), "4 × 7 = 28|1 + 1 = 2|28 → 0.28");
});

test("every wrong choice gets its own cue that points at the picture or the estimate, never the answer", () => {
  const v = validateDecimalArea(CFG);
  const T = decimalAreaCopy(v);
  const cues = predictChoices(0.4, 0.7)
    .filter((o) => !o.correct)
    .map((o) => T.predictCue(o).en);
  assert.equal(new Set(cues).size, 3);
  for (const cue of cues) assert.doesNotMatch(cue, /0\.28/);
  const bigCues = pointChoices("4.5", "12.60")
    .filter((o) => !o.correct)
    .map((o) => T.bigCue(o).en);
  assert.equal(new Set(bigCues).size, 3);
  for (const cue of bigCues) {
    assert.doesNotMatch(cue, /56\.700/);
    assert.match(cue, /5 × \$13 = \$65/);
  }
  // Spanish keeps tú and has no English leftovers.
  for (const o of pointChoices("4.5", "12.60").filter((x) => !x.correct))
    assert.doesNotMatch(T.bigCue(o).es, /\b(the|only|estimate|close)\b/i);
  assert.doesNotMatch(T.buildSay.es, /\b(the|set|width)\b/i);
});

test("buildDecimalAreaPlay: six scenes, gates where the student acts", () => {
  const play = buildDecimalAreaPlay(CFG);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["build", true],
      ["connect", false],
      ["big", true],
      ["transfer", false],
    ],
  );
  assert.equal(reexported, validateDecimalArea);
  assert.match(play.printSummary.en, /4 columns wide and 7 rows tall.*28 small squares/);
});

test("the lesson's own config is authored with the lesson's numbers", () => {
  const cfg = JSON.parse(readFileSync(new URL("../../../lessons/2-12/config.json", import.meta.url), "utf8"));
  const ls = cfg.launch.conceptIntro.livingScene;
  assert.equal(ls.play, "decimal-area");
  assert.ok(buildDecimalAreaPlay(ls));
  const weDo = JSON.stringify(cfg.launch.conceptIntro.weDo.lines);
  assert.ok(weDo.includes(`${ls.a} × ${ls.b}`), "weDo uses 0.4 × 0.7");
  const iDo = JSON.stringify(cfg.launch.conceptIntro.iDo.lines);
  assert.ok(iDo.includes(`${ls.big.a} × ${ls.big.b}`), "iDo uses 4.5 × 12.60");
  assert.ok(JSON.stringify(cfg.revealWordProblem).includes(ls.transfer.a));
  assert.ok(JSON.stringify(cfg.revealWordProblem).includes(ls.transfer.b));
});
