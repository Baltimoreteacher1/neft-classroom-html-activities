// combine-terms.test.mjs — every number the combine-terms play shows a student.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildCombineTermsPlay, validateCombineTerms as reexported } from "./combine-terms.js";
import {
  combine,
  combineCopy,
  mainChoices,
  mergedAll,
  parseTerm,
  placeCorrect,
  simplifiedText,
  termText,
  transferChoices,
  validateCombineTerms,
  valueAt,
} from "./combine-terms-model.js";

// 6-15: 6x + 4 + 2x + 7 (family page), and 4m + 2m + 6m + 3s + 5s + 1s (microphones and stands).
const CFG = {
  terms: ["6x", "4", "2x", "7"],
  xMax: 5,
  start: 3,
  transfer: {
    terms: ["4m", "2m", "6m", "3s", "5s", "1s"],
    names: {
      m: { en: "microphones", es: "micrófonos" },
      s: { en: "stands", es: "atriles" },
    },
  },
};

const walk = (o, out = []) => {
  if (o && typeof o === "object" && typeof o.en === "string" && "es" in o) out.push(o);
  else if (o && typeof o === "object" && typeof o !== "function")
    for (const x of Object.values(o)) walk(x, out);
  return out;
};

test("parseTerm reads coefficient and letter", () => {
  assert.deepEqual(parseTerm("6x"), { coef: 6, v: "x" });
  assert.deepEqual(parseTerm("7"), { coef: 7, v: null });
  assert.deepEqual(parseTerm("1s"), { coef: 1, v: "s" });
  for (const bad of ["x", "0x", "6xy", "6X", "-4", "4.5", "", "6x²"]) assert.equal(parseTerm(bad), null, bad);
  assert.equal(termText(parseTerm("12m")), "12m");
});

test("the lesson's sums, worked by hand", () => {
  const v = validateCombineTerms(CFG);
  // 6x + 2x = 8x ; 4 + 7 = 11
  assert.equal(6 + 2, 8);
  assert.equal(4 + 7, 11);
  assert.equal(simplifiedText(v.terms), "8x + 11");
  // 4m + 2m + 6m = 12m ; 3s + 5s + 1s = 9s
  assert.equal(4 + 2 + 6, 12);
  assert.equal(3 + 5 + 1, 9);
  assert.equal(simplifiedText(v.transfer.terms), "12m + 9s");
  assert.deepEqual(
    combine(v.terms).map((k) => [k.key, k.sum, k.count]),
    [
      ["x", 8, 2],
      ["#", 11, 2],
    ],
  );
  // Constants always last, letters in the order they first appear.
  assert.equal(simplifiedText([{ coef: 3, v: null }, { coef: 2, v: "y" }, { coef: 1, v: null }, { coef: 4, v: "y" }]), "6y + 4");
});

test("equivalent at every value: 6x + 4 + 2x + 7 = 8x + 11, and 19x is not", () => {
  const v = validateCombineTerms(CFG);
  // Worked out independently for x = 2, 3, 4, 5.
  const hand = { 2: [12 + 4 + 4 + 7, 16 + 11, 38], 3: [18 + 4 + 6 + 7, 24 + 11, 57], 4: [24 + 4 + 8 + 7, 32 + 11, 76], 5: [30 + 4 + 10 + 7, 40 + 11, 95] };
  for (const [x, [orig, simple, wrong]] of Object.entries(hand)) {
    assert.equal(valueAt(v.terms, { x: Number(x) }), orig, `x=${x}`);
    assert.equal(orig, simple, `x=${x}`);
    assert.notEqual(orig, wrong, `x=${x} the wrong answer must disagree`);
  }
  assert.equal(mergedAll(v.terms).sum, 19);
  // x = 1 would hide the slip (8 + 11 = 19), which is why the slider starts at 2.
  assert.equal(valueAt(v.terms, { x: 1 }), 19 * 1);
  assert.equal(validateCombineTerms({ ...CFG, start: 1 }), null);
});

test("mainChoices and transferChoices: one right answer, three real slips", () => {
  const v = validateCombineTerms(CFG);
  assert.deepEqual(
    mainChoices(v.terms).map((o) => [o.kind, o.text, o.correct]),
    [
      ["right", "8x + 11", true],
      ["all", "19x", false],
      ["square", "8x² + 11", false],
      ["swap", "11x + 8", false],
    ],
  );
  assert.deepEqual(
    transferChoices(v.transfer.terms).map((o) => [o.kind, o.text, o.correct]),
    [
      ["right", "12m + 9s", true],
      ["all", "21m", false],
      ["drop", "12m + 9", false],
      ["swap", "12s + 9m", false],
    ],
  );
});

test("cues name the slip and never print the right answer", () => {
  const v = validateCombineTerms(CFG);
  const T = combineCopy(v);
  for (const o of mainChoices(v.terms).filter((x) => !x.correct))
    for (const lang of ["en", "es"]) {
      const cue = T.cue(o)[lang];
      assert.match(cue, /\?/);
      assert.ok(!cue.includes("8x + 11"), cue);
    }
  for (const o of transferChoices(v.transfer.terms).filter((x) => !x.correct))
    for (const lang of ["en", "es"]) {
      const cue = T.transferCue(o)[lang];
      assert.match(cue, /\?/);
      assert.ok(!cue.includes("12m + 9s"), cue);
    }
  for (const t of v.terms) for (const lang of ["en", "es"]) assert.match(T.sortCue(t)[lang], /\?/);
});

test("validateCombineTerms refuses what the stage cannot draw", () => {
  for (const cfg of [
    null,
    {},
    { ...CFG, terms: ["6x", "4", "2x"] }, // only one constant
    { ...CFG, terms: ["6x", "2x", "3x", "4x"] }, // no constant to contrast
    { ...CFG, terms: ["6x", "4", "2y", "7"] }, // two letters in the main expression
    { ...CFG, terms: ["6x", "4", "x", "7"] },
    { ...CFG, terms: ["9x", "4", "9x", "7"] }, // 18 x-tiles do not fit
    { ...CFG, terms: ["6x", "9", "2x", "9"] }, // 18 plain tiles do not fit
    { ...CFG, xMax: 2 },
    { ...CFG, xMax: 9 },
    { ...CFG, start: 6 },
    { ...CFG, transfer: undefined },
    { ...CFG, transfer: { ...CFG.transfer, names: { m: CFG.transfer.names.m } } },
    { ...CFG, transfer: { ...CFG.transfer, terms: ["4m", "2m", "6m", "3s"] } }, // s has one term
    { ...CFG, transfer: { ...CFG.transfer, terms: ["4m", "2m", "6m", "3s", "5s", "1"] } }, // a constant
  ]) {
    assert.equal(validateCombineTerms(cfg), null, JSON.stringify(cfg)?.slice(0, 80));
    assert.equal(buildCombineTermsPlay(cfg), null);
  }
});

test("a slip that would agree with the right answer on the slider is refused", () => {
  // 3x + 6 + 3x + 6: merged "18x" equals 6x + 12 at x = 1 only; with x >= 2 they differ, so it is fine.
  assert.ok(validateCombineTerms({ ...CFG, terms: ["3x", "6", "3x", "6"] }));
  // 2x + 5 + 5x + 2 = 7x + 7; merged 14x equals 7x + 7 at x = 1 only.
  assert.ok(validateCombineTerms({ ...CFG, terms: ["2x", "5", "5x", "2"] }));
});

test("buildCombineTermsPlay: six scenes, gates where the student acts", () => {
  const play = buildCombineTermsPlay(CFG);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["sort", true],
      ["connect", false],
      ["test", true],
      ["transfer", false],
    ],
  );
  assert.doesNotMatch(play.title.en, /8x|11/);
  assert.match(play.printSummary.en, /6x \+ 4 \+ 2x \+ 7 = 8x \+ 11/);
  assert.match(play.printSummary.en, /Check with x = 3: 35 both ways/);
  assert.match(play.printSummary.es, /6x \+ 4 \+ 2x \+ 7 = 8x \+ 11/);
});

test("all copy is bilingual and the Spanish has no English left", () => {
  const v = validateCombineTerms(CFG);
  const T = combineCopy(v);
  const pairs = walk(T);
  for (const o of mainChoices(v.terms).filter((x) => !x.correct)) pairs.push(T.cue(o));
  for (const o of transferChoices(v.transfer.terms).filter((x) => !x.correct)) pairs.push(T.transferCue(o));
  for (const t of v.terms) pairs.push(T.sortCue(t), T.toX(t), T.toNum(t));
  pairs.push(T.sortProgress(2), T.testRow(3), T.tryMore(1), T.tryMore(2));
  assert.ok(pairs.length > 40);
  for (const p of pairs) {
    assert.ok(p.es.trim(), p.en);
    if (/[a-z]{4}/i.test(p.en) && !/^[\dxms +=;:.]+$/i.test(p.en)) assert.notEqual(p.es, p.en, p.en);
    assert.doesNotMatch(p.es, /\b(the|and|each|tiles|pile|stack|plain|combine)\b/i, p.es);
    assert.doesNotMatch(p.es, /\busted|vosotros\b/i);
  }
});

test("placeCorrect keeps every option and moves the right one off slot 0", () => {
  const v = validateCombineTerms(CFG);
  const placed = placeCorrect(mainChoices(v.terms), 2);
  assert.equal(placed.length, 4);
  assert.equal(placed.filter((o) => o.correct).length, 1);
  assert.notEqual(placed[0].correct, true);
});

test("the authored 6-15 config builds, and the registry exposes the play", async () => {
  const cfg = JSON.parse(readFileSync(new URL("../../../lessons/6-15/config.json", import.meta.url), "utf8"));
  const living = cfg.launch.conceptIntro.livingScene;
  assert.equal(living.play, "combine-terms");
  assert.ok(buildCombineTermsPlay(living));
  const { PLAYS } = await import("./cluster-expressions.js");
  assert.equal(await PLAYS["combine-terms"](), buildCombineTermsPlay);
  assert.equal(reexported, validateCombineTerms);
});
