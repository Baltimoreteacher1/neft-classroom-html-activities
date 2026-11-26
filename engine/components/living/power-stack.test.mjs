// power-stack.test.mjs — every number the power-stack play shows a student.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildPowerStackPlay, validatePowerStack as reexported } from "./power-stack.js";
import {
  asProduct,
  asSum,
  choiceSet,
  maxExponent,
  placeCorrect,
  powerCopy,
  running,
  sup,
  validatePowerStack,
} from "./power-stack-model.js";

// The 6-3 lesson: 2³ (worked example), 5² (we do), 2⁴ (you do).
const CFG = { base: 2, exp: 3, transfer: { base: 5, exp: 2 } };

const walk = (o, out = []) => {
  if (o && typeof o === "object" && typeof o.en === "string" && "es" in o) out.push(o);
  else if (o && typeof o === "object") for (const x of Object.values(o)) walk(x, out);
  return out;
};

test("sup prints the raised exponent", () => {
  assert.equal(sup(3), "³");
  assert.equal(sup(14), "¹⁴");
});

test("the numbers: 2³ = 8 (not 2 × 3 = 6), 5² = 25, 2⁴ = 16", () => {
  assert.equal(2 * 2 * 2, 8);
  assert.equal(2 ** 3, 8);
  assert.equal(2 * 3, 6);
  assert.equal(5 * 5, 25);
  assert.equal(2 * 2 * 2 * 2, 16);
  assert.equal(asProduct(2, 3), "2 × 2 × 2");
  assert.equal(asSum(2, 3), "2 + 2 + 2");
  assert.deepEqual([1, 2, 3].map((k) => running(2, k)), [2, 4, 8]);
  assert.equal(running(2, 3), running(2, 2) * 2, "each factor multiplies the running value");
});

test("maxExponent keeps boxes to six and the bar to 125", () => {
  assert.equal(maxExponent(2), 6); // 64
  assert.equal(maxExponent(3), 4); // 81
  assert.equal(maxExponent(4), 3); // 64
  assert.equal(maxExponent(5), 3); // 125
});

test("choiceSet: the power is the one correct choice; wrong ones are real slips", () => {
  const vals = (b, e) => choiceSet(b, e).map((o) => [o.kind, o.value, !!o.correct]);
  assert.deepEqual(vals(2, 3), [
    ["power", 8, true],
    ["times", 6, false],
    ["swap", 9, false],
    ["plus", 5, false],
  ]);
  assert.deepEqual(vals(5, 2), [
    ["power", 25, true],
    ["times", 10, false],
    ["swap", 32, false],
    ["plus", 7, false],
  ]);
  // 2⁴: the swapped power 4² is also 16, so it is dropped; 2³ = 8 equals the times slip, so one is skipped.
  assert.deepEqual(vals(2, 4), [
    ["power", 16, true],
    ["times", 8, false],
    ["plus", 6, false],
    ["long", 32, false],
  ]);
  for (const b of [2, 3, 4, 5])
    for (const e of [2, 3, 4]) {
      if (b ** e > 125 || (b === 2 && e === 2)) continue;
      const c = choiceSet(b, e);
      assert.equal(c.filter((o) => o.correct).length, 1, `${b}^${e}`);
      assert.equal(new Set(c.map((o) => o.value)).size, 4, `${b}^${e} distinct`);
      assert.ok(c.filter((o) => !o.correct).every((o) => o.value !== b ** e));
    }
});

test("cues name the slip and never show the power on a first miss", () => {
  for (const [b, e] of [
    [2, 3],
    [5, 2],
    [2, 4],
    [3, 4],
  ]) {
    const v = validatePowerStack({ base: b, exp: e });
    const T = powerCopy(v);
    const right = String(b ** e);
    for (const o of choiceSet(b, e).filter((x) => !x.correct)) {
      const cue = T.cue(o);
      for (const lang of ["en", "es"]) {
        assert.ok(cue[lang].length > 30, `${b}^${e} ${o.kind} ${lang}`);
        assert.ok(
          !new RegExp(`(?<![\\d.])${right}(?![\\d])`).test(cue[lang].replace(String(o.value), "")),
          `${b}^${e} ${o.kind} ${lang} reveals ${right}: ${cue[lang]}`,
        );
        assert.match(cue[lang], /\?/, "a cue asks a question");
      }
    }
  }
});

test("validatePowerStack accepts the lesson config and refuses undrawable ones", () => {
  const v = validatePowerStack(CFG);
  assert.deepEqual([v.base, v.exp, v.emax], [2, 3, 6]);
  assert.deepEqual(v.transfer, { base: 5, exp: 2 });
  for (const cfg of [
    null,
    {},
    { base: 1, exp: 3 },
    { base: 6, exp: 2 },
    { base: 2, exp: 1 },
    { base: 2, exp: 2 }, // 4 = 2 × 2 = 2 + 2: no wrong choice would be a wrong value
    { base: 2, exp: 5 },
    { base: 5, exp: 4 }, // 625
    { base: 2.5, exp: 3 },
    { base: "2", exp: "x" },
  ]) {
    assert.equal(validatePowerStack(cfg), null, JSON.stringify(cfg));
    assert.equal(buildPowerStackPlay(cfg), null);
  }
});

test("a missing or repeated transfer falls back to a different power", () => {
  assert.deepEqual(validatePowerStack({ base: 2, exp: 3 }).transfer, { base: 5, exp: 2 });
  assert.deepEqual(validatePowerStack({ base: 5, exp: 2 }).transfer, { base: 3, exp: 2 });
  const same = validatePowerStack({ base: 2, exp: 3, transfer: { base: 2, exp: 3 } });
  assert.notDeepEqual([same.transfer.base, same.transfer.exp], [2, 3]);
});

test("buildPowerStackPlay: six scenes, gates where the student acts", () => {
  const play = buildPowerStackPlay(CFG);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["build", true],
      ["connect", false],
      ["change", true],
      ["transfer", false],
    ],
  );
  assert.doesNotMatch(play.title.en, /8/, "the title must not give away the value");
  assert.match(play.printSummary.en, /2³ means 2 is used as a factor 3 times: 2 × 2 × 2 = 8/);
  assert.match(play.printSummary.en, /not 2 × 3 = 6/);
  assert.match(play.printSummary.es, /2 × 2 × 2 = 8/);
});

test("all copy is bilingual and the Spanish has no English left", () => {
  const pairs = walk(powerCopy(validatePowerStack(CFG)));
  assert.ok(pairs.length > 30);
  for (const p of pairs) {
    assert.ok(p.es.trim(), p.en);
    if (/[a-z]{4}/.test(p.en) && p.en !== "base") assert.notEqual(p.es, p.en, p.en);
    assert.doesNotMatch(p.es, /\b(the|and|each|boxes|multiply|exponent)\b/i, p.es);
    assert.doesNotMatch(p.es, /\busted|vosotros\b/i);
  }
});

test("placeCorrect moves the right answer around", () => {
  const spots = new Set();
  for (let s = 0; s < 12; s++)
    spots.add(placeCorrect(choiceSet(2, 3), s).findIndex((o) => o.correct));
  assert.ok(spots.size >= 3);
  assert.notEqual(placeCorrect(choiceSet(2, 3), 8 + 9 + 1).findIndex((o) => o.correct), 0);
});

test("the authored 6-3 config builds, and the registry exposes the play", async () => {
  const cfg = JSON.parse(readFileSync(new URL("../../../lessons/6-3/config.json", import.meta.url), "utf8"));
  const living = cfg.launch.conceptIntro.livingScene;
  assert.equal(living.play, "power-stack");
  assert.ok(buildPowerStackPlay(living));
  const { PLAYS } = await import("./cluster-expressions.js");
  assert.equal(typeof PLAYS["power-stack"], "function");
  assert.equal(await PLAYS["power-stack"](), buildPowerStackPlay);
  assert.equal(reexported, validatePowerStack);
});
