// partial-quotients.test.mjs — every number the partial-quotients play states (2-6, 2-7).
// Expected values are recomputed here with plain arithmetic, independently of the model.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  buildPartialQuotientsPlay,
  validatePartialQuotients as reexported,
} from "./partial-quotients.js";
import {
  chunkSizes,
  chunksOf,
  equivalentChoices,
  markerXs,
  longDivision,
  partialQuotientsCopy,
  placeCorrect,
  quotientChoices,
  replayTaken,
  scaledPair,
  slideChoices,
  tapeParts,
  validatePartialQuotients,
  windowChoices,
} from "./partial-quotients-model.js";

// 2-6: 1,344 ÷ 12 = 112 (iDo), 4,896 ÷ 12 = 408 (practice). 2-7: 18.9 ÷ 6.3 = 3 (iDo), 4.8 ÷ 0.6 = 8 (practice).
const WHOLE = { mode: "whole", dividend: 1344, divisor: 12, transfer: { dividend: 4896, divisor: 12 } };
const DEC = { mode: "decimal", dividend: 18.9, divisor: 6.3, transfer: { dividend: 4.8, divisor: 0.6 } };

test("chunksOf: 1,344 ÷ 12 is 100 + 10 + 2 groups, and each chunk's arithmetic is exact", () => {
  const ch = chunksOf(1344, 12);
  assert.deepEqual(
    ch.map((c) => [c.groups, c.take, c.left]),
    [
      [100, 1200, 144],
      [10, 120, 24],
      [2, 24, 0],
    ],
  );
  assert.equal(100 + 10 + 2, 1344 / 12);
  for (const c of ch) assert.equal(c.take, c.groups * 12);
  assert.equal(1344 - 1200 - 120 - 24, 0);
  // A zero digit has no chunk: 4,896 ÷ 12 = 408 = 400 + 8.
  const z = chunksOf(4896, 12);
  assert.deepEqual(
    z.map((c) => [c.groups, c.take, c.left]),
    [
      [400, 4800, 96],
      [8, 96, 0],
    ],
  );
  assert.equal(12 * 408, 4896);
});

test("longDivision: the digits written are the chunks' digits, round by round", () => {
  const ld = longDivision(1344, 12);
  assert.equal(ld.start, 1, "12 does not fit in 1, so the first working number is 13");
  assert.deepEqual(
    ld.rounds.map((r) => [r.work, r.q, r.prod, r.rem, r.bring, r.place]),
    [
      [13, 1, 12, 1, 4, 2],
      [14, 1, 12, 2, 4, 1],
      [24, 2, 24, 0, null, 0],
    ],
  );
  assert.equal(ld.quotient, "112");
  assert.equal(ld.remainder, 0);
  // Every round's place matches a chunk: digit q at place p is q × 10^p groups.
  const ch = chunksOf(1344, 12);
  for (const r of ld.rounds) assert.equal(ch.find((c) => c.place === r.place).groups, r.q * 10 ** r.place);
  const z = longDivision(4896, 12);
  assert.deepEqual(
    z.rounds.map((r) => [r.work, r.q, r.prod, r.rem]),
    [
      [48, 4, 48, 0],
      [9, 0, 0, 9],
      [96, 8, 96, 0],
    ],
  );
  assert.equal(z.quotient, "408");
  const d = longDivision(189, 63);
  assert.deepEqual([d.start, d.rounds.length, d.quotient], [2, 1, "3"]);
});

test("tapeParts: pieces add up to the whole bar", () => {
  const ch = chunksOf(1344, 12);
  const parts = tapeParts(1344, 12, ch);
  assert.equal(parts.length, 3);
  const total = parts.reduce((s, p) => s + p.size, 0);
  assert.ok(Math.abs(total - 1) < 1e-12);
  assert.ok(Math.abs(parts[0].size - 1200 / 1344) < 1e-12);
  // Small quotient: one equal piece per group (18.9 ÷ 6.3 scaled to 189 ÷ 63).
  const u = tapeParts(189, 63, chunksOf(189, 63));
  assert.equal(u.length, 3);
  assert.ok(u.every((p) => Math.abs(p.size - 63 / 189) < 1e-12));
  assert.ok(Math.abs(u[2].from - 2 / 3) < 1e-12);
});

test("windowChoices: the power-of-ten window holding 112 is 100-1,000, the others cannot hold it", () => {
  const w = windowChoices(1344, 12);
  assert.equal(w.filter((x) => x.correct).length, 1);
  const right = w.find((x) => x.correct);
  assert.deepEqual([right.lo, right.hi], [100, 1000]);
  assert.ok(right.lo <= 112 && 112 < right.hi);
  for (const x of w.filter((o) => !o.correct)) assert.ok(!(x.lo <= 112 && 112 < x.hi));
  assert.ok(100 * 12 <= 1344 && 1000 * 12 > 1344);
});

test("slideChoices: the quotient is the same; 10 times and a tenth are the slips", () => {
  assert.deepEqual(
    slideChoices(3).map((o) => [o.kind, o.value]),
    [
      ["same", 3],
      ["big", 30],
      ["small", 0.3],
    ],
  );
  assert.equal(18.9 / 6.3 > 2.99999 && 18.9 / 6.3 < 3.00001, true);
  assert.equal(189 / 63, 3);
});

test("quotientChoices: one right, three named slips that really are wrong", () => {
  const c = quotientChoices(4896, 12);
  assert.deepEqual(
    c.map((o) => [o.kind, o.value]),
    [
      ["quotient", 408],
      ["dropZero", 48],
      ["swap", 480],
      ["tenTimes", 4080],
    ],
  );
  for (const o of c.filter((x) => !x.correct)) assert.notEqual(o.value * 12, 4896, String(o.value));
  assert.equal(new Set(c.map((o) => o.value)).size, 4);
  // No zero in the quotient: the insert-a-zero slip appears instead.
  const k = quotientChoices(384, 8);
  assert.deepEqual(k.map((o) => o.value), [48, 84, 408, 480]);
});

test("equivalentChoices: only sliding BOTH points the same places keeps the quotient", () => {
  const v = validatePartialQuotients(DEC).tr;
  const c = equivalentChoices(v);
  assert.deepEqual(c.map((o) => o.text), ["48 ÷ 6", "4.8 ÷ 6", "48 ÷ 0.6", "480 ÷ 6"]);
  const q = (o) => o.D / o.d;
  assert.ok(Math.abs(q(c[0]) - 8) < 1e-9);
  for (const o of c.slice(1)) assert.ok(Math.abs(q(o) - 8) > 1e-9, o.text);
});

test("validation accepts both lessons' configs and refuses bad ones", () => {
  const w = validatePartialQuotients(WHOLE);
  assert.deepEqual([w.main.q, w.tr.q, w.main.units, w.tr.units], [112, 408, false, false]);
  const d = validatePartialQuotients(DEC);
  assert.deepEqual([d.main.Ds, d.main.ds, d.main.q, d.main.k], [189, 63, 3, 1]);
  assert.deepEqual([d.tr.Ds, d.tr.ds, d.tr.q], [48, 6, 8]);
  const bad = [
    null,
    {},
    { ...WHOLE, mode: "x" },
    { ...WHOLE, dividend: 1345 }, // remainder
    { ...WHOLE, dividend: 108, divisor: 12 }, // quotient 9, below 10
    { ...WHOLE, divisor: 1 },
    { ...WHOLE, dividend: 1.5 },
    { ...WHOLE, transfer: undefined },
    { ...WHOLE, transfer: { dividend: 1344, divisor: 12 } },
    { ...WHOLE, transfer: { dividend: 4897, divisor: 12 } },
    { ...WHOLE, dividend: 1234567, divisor: 7 },
    { ...DEC, divisor: 6 }, // whole divisor: nothing to slide
    { ...DEC, dividend: 18.95 }, // more places than the divisor
    { ...DEC, dividend: 19 }, // 190 ÷ 63 does not divide
    { ...DEC, dividend: 1344 }, // 13440 ÷ 63 is not whole
    { ...DEC, dividend: -18.9 },
    { ...DEC, dividend: 6.3, divisor: 6.3 }, // quotient 1
  ];
  for (const cfg of bad) {
    assert.equal(validatePartialQuotients(cfg), null, JSON.stringify(cfg));
    assert.equal(buildPartialQuotientsPlay(cfg), null, JSON.stringify(cfg));
  }
});

test("every sentence states numbers the arithmetic supports (whole)", () => {
  const T = partialQuotientsCopy(validatePartialQuotients(WHOLE));
  for (const lang of ["en", "es"]) {
    assert.match(T.predictOk[lang], /100 .*1,200/);
    assert.match(T.predictOk[lang], /1,000 .*12,000/);
    assert.match(T.chunkDone([100, 10, 2])[lang], /100 \+ 10 \+ 2 .*112/);
    assert.match(T.ldDone[lang], /1 1 2/);
    assert.match(T.ldDone[lang], /12 × 112 = 1,344/);
    assert.match(T.printSummary[lang], /100 × 12 = 1,200; 10 × 12 = 120; 2 × 12 = 24/);
    assert.match(T.transferOk[lang], /400 × 12 = 4,800/);
    assert.match(T.transferOk[lang], /12 × 408 = 4,896/);
  }
  assert.match(T.roundSay(0).en, /13 ÷ 12 → 1.*1 × 12 = 12.*13 − 12 = 1.*Bring down 4: 14.*100 × 12 = 1,200/);
  assert.match(T.roundSay(2).en, /24 ÷ 12 → 2.*2 × 12 = 24.*24 − 24 = 0.*Nothing is left/);
  assert.match(T.roundSay(0).es, /13 ÷ 12 → 1.*Baja el 4: 14/);
  assert.doesNotMatch(T.title.en, /112/, "the title does not give the quotient away");
  assert.doesNotMatch(T.predictSay.en, /112/);
  assert.doesNotMatch(T.situateSay.en, /112/);
  const tr = T.roundSay;
  assert.ok(tr);
});

test("every sentence states numbers the arithmetic supports (decimal)", () => {
  const T = partialQuotientsCopy(validatePartialQuotients(DEC));
  for (const lang of ["en", "es"]) {
    assert.match(T.slideDone[lang], /18\.9 ÷ 6\.3 = 3 .*189 ÷ 63 = 3/);
    assert.match(T.slideDone[lang], /6\.3 × 3 = 18\.9/);
    assert.match(T.ldDone[lang], /6\.3 × 3 = 18\.9/);
    assert.match(T.transferOk[lang], /48 ÷ 6 = 8/);
    assert.match(T.transferOk[lang], /0\.6 × 8 = 4\.8/);
  }
  assert.match(T.slideNow(0).en, /18\.9 ÷ 6\.3 = 3\. 6\.3 is not a whole number yet/);
  assert.match(T.slideNow(1).en, /189 ÷ 63 = 3\. 63 is a whole number/);
  assert.match(T.slideNow(2).en, /1,890 ÷ 630 = 3/);
  assert.match(T.roundSay(0).en, /63 does not fit into 1 or 18, so work with 189/);
  assert.match(T.predictSay.en, /6\.3 1 place right to make 63/);
  assert.doesNotMatch(T.predictSay.en, /\b3\b chunks/);
});

test("every wrong choice gets its own cue, and none states the right answer", () => {
  const w = partialQuotientsCopy(validatePartialQuotients(WHOLE));
  const cues = quotientChoices(4896, 12)
    .filter((o) => !o.correct)
    .map((o) => w.quotCue(o).en);
  assert.equal(new Set(cues).size, 3);
  for (const cue of cues) {
    assert.doesNotMatch(cue, /\b408\b/);
    assert.match(cue, /12 × \d[\d,]* = [\d,]+\. Does that match 4,896\?/);
  }
  assert.match(cues[0], /12 × 48 = 576/);
  const win = windowChoices(1344, 12)
    .filter((o) => !o.correct)
    .map((o) => w.windowCue(o).en);
  assert.equal(new Set(win).size, 2);
  for (const cue of win) assert.doesNotMatch(cue, /\b112\b/);
  const d = partialQuotientsCopy(validatePartialQuotients(DEC));
  const eq = equivalentChoices(validatePartialQuotients(DEC).tr)
    .filter((o) => !o.correct)
    .map((o) => d.equivCue(o).en);
  assert.equal(new Set(eq).size, 3);
  for (const cue of eq) assert.doesNotMatch(cue, /48 ÷ 6\b(?! )/);
  const sl = slideChoices(3)
    .filter((o) => !o.correct)
    .map((o) => d.slideCue(o).en);
  assert.equal(new Set(sl).size, 2);
  // Spanish stays in tú and has no English words left.
  assert.doesNotMatch(w.chunkSay.es, /\b(the|take|chunk|bar)\b/i);
  assert.doesNotMatch(d.slideSay.es, /\b(the|slide|points)\b/i);
  for (const o of quotientChoices(4896, 12).filter((x) => !x.correct))
    assert.doesNotMatch(w.quotCue(o).es, /\b(the|check|multiply)\b/i);
});

test("buildPartialQuotientsPlay: five scenes in each mode, gates where the student acts", () => {
  for (const cfg of [WHOLE, DEC]) {
    const play = buildPartialQuotientsPlay(cfg);
    assert.deepEqual(
      play.scenes.map((s) => [s.id, !!s.gate]),
      [
        ["situate", false],
        ["predict", true],
        ["chunk", true],
        ["connect", false],
        ["transfer", false],
      ],
    );
  }
  assert.equal(reexported, validatePartialQuotients);
});

test("placeCorrect never leaves the right choice first", () => {
  const opts = windowChoices(1344, 12);
  assert.notEqual(placeCorrect(opts, 112 + 1).findIndex((o) => o.correct), 0);
  const q = quotientChoices(4896, 12);
  assert.notEqual(placeCorrect(q, 408 + 1).findIndex((o) => o.correct), 0);
});

test("the lessons' own configs are authored with the lessons' numbers", () => {
  for (const [id, text] of [
    ["2-6", /1,344 ÷ 12 = 112/],
    ["2-7", /18\.9 ÷ 6\.3/],
  ]) {
    const cfg = JSON.parse(readFileSync(new URL(`../../../lessons/${id}/config.json`, import.meta.url), "utf8"));
    const ls = cfg.launch.conceptIntro.livingScene;
    assert.equal(ls.play, "partial-quotients");
    assert.ok(buildPartialQuotientsPlay(ls), id);
    assert.match(JSON.stringify(cfg.launch.conceptIntro.iDo.lines), text);
    // The transfer is a problem the lesson's own practice uses.
    assert.ok(JSON.stringify(cfg.practice).includes(String(ls.transfer.dividend).replace(/(\d)(?=(\d{3})+$)/g, "$1,")) || JSON.stringify(cfg.practice).includes(String(ls.transfer.dividend)), id);
  }
});

test("chunkSizes and replayTaken: only known sizes that still fit are restored", () => {
  assert.deepEqual(chunkSizes(112), [100, 10, 1]);
  assert.deepEqual(chunkSizes(8), [1]);
  const sizes = chunkSizes(112);
  assert.deepEqual(replayTaken([100, 10, 1, 1], sizes, 1344, 12, 24), [100, 10, 1, 1]);
  assert.deepEqual(replayTaken([100, 100], sizes, 1344, 12, 24), [100], "the second 100 does not fit");
  assert.deepEqual(replayTaken([7, 100], sizes, 1344, 12, 24), [100], "unknown size dropped");
  assert.deepEqual(replayTaken("x", sizes, 1344, 12, 24), []);
  assert.deepEqual(replayTaken(Array(30).fill(1), sizes, 1344, 12, 24), [], "over the cap");
});

test("markerXs keeps markers a dot apart and inside the bar", () => {
  const xs = markerXs([[0, 0.893], [0.893, 0.982], [0.982, 1]], 30, 420);
  assert.ok(xs.every((x, i) => i === 0 || x - xs[i - 1] >= 27 - 1e-9));
  assert.ok(xs.at(-1) <= 30 + 420 - 11 + 1e-9);
  assert.ok(xs[0] > 30);
});

test("scaledPair: sliding both points 1 and 2 places", () => {
  const p = { D: 18.9, d: 6.3 };
  assert.deepEqual(scaledPair(p, 0), { D: "18.9", d: "6.3" });
  assert.deepEqual(scaledPair(p, 1), { D: "189", d: "63" });
  assert.deepEqual(scaledPair(p, 2), { D: "1,890", d: "630" });
});
