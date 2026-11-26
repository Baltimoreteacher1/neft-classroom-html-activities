// factor-pairs.test.mjs — every number the factor-pairs play shows a student,
// recomputed without the play's own helpers.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildFactorPairsPlay, validateFactorPairs as reexported } from "./factor-pairs.js";
import {
  arrayGeometry,
  arrayView,
  caption,
  cellOf,
  commonFactors,
  factorPairsCopy,
  factorsOf,
  gcd,
  lcm,
  packChoices,
  validateFactorPairs,
} from "./factor-pairs-model.js";

const lessonConfig = () =>
  JSON.parse(readFileSync(new URL("../../../lessons/6-7/config.json", import.meta.url), "utf8"));
const CFG = lessonConfig().launch.conceptIntro.livingScene;

// Brute force.
const factorsSlow = (n) => {
  const out = [];
  for (let d = 1; d <= n; d++) if (n % d === 0) out.push(d);
  return out;
};
const gcdSlow = (a, b) => {
  let best = 1;
  for (let d = 1; d <= Math.min(a, b); d++) if (a % d === 0 && b % d === 0) best = d;
  return best;
};

test("factorsOf / commonFactors / gcd / lcm agree with brute force", () => {
  for (let n = 1; n <= 72; n++) assert.deepEqual(factorsOf(n), factorsSlow(n), `factors ${n}`);
  for (let a = 2; a <= 40; a++)
    for (let b = 2; b <= 40; b++) {
      assert.equal(gcd(a, b), gcdSlow(a, b));
      assert.equal(gcd(a, b) * lcm(a, b), a * b);
      assert.deepEqual(
        commonFactors(a, b),
        factorsSlow(a).filter((d) => b % d === 0),
      );
    }
});

test("the lesson's numbers: 48 and 36 have common factors 1,2,3,4,6,12; the GCF is 12 → 4 and 3 per pack", () => {
  assert.deepEqual(factorsOf(48), [1, 2, 3, 4, 6, 8, 12, 16, 24, 48]);
  assert.deepEqual(factorsOf(36), [1, 2, 3, 4, 6, 9, 12, 18, 36]);
  assert.deepEqual(commonFactors(48, 36), [1, 2, 3, 4, 6, 12]);
  assert.equal(gcdSlow(48, 36), 12);
  assert.deepEqual([48 / 12, 36 / 12], [4, 3]);
  assert.equal(lcm(8, 6), 24); // the youDo: Ayasha's classes
  assert.equal(gcdSlow(12, 18), 6); // the practice pair
});

test("arrayView: a pack count works exactly when it is a common factor", () => {
  for (const [a, b] of [
    [48, 36],
    [12, 18],
    [24, 36],
  ]) {
    for (let n = 1; n <= 48; n++) {
      const v = arrayView(a, b, n);
      assert.equal(v.works, a % n === 0 && b % n === 0, `${a},${b} n=${n}`);
      assert.equal(v.A.left, a - Math.floor(a / n) * n);
      assert.equal(v.B.left, b - Math.floor(b / n) * n);
    }
    // The set of working pack counts is the set of common factors.
    const works = Array.from({ length: Math.max(a, b) }, (_, i) => i + 1).filter(
      (n) => arrayView(a, b, n).works,
    );
    assert.deepEqual(works, commonFactors(a, b));
  }
  const v = arrayView(48, 36, 8);
  assert.deepEqual([v.A.left, v.B.left, v.A.per, v.B.per], [0, 4, 6, 4]);
  const g = arrayView(48, 36, 12);
  assert.deepEqual([g.A.per, g.B.per, g.works], [4, 3, true]);
});

test("arrayGeometry: every item of both arrays lands inside its panel", () => {
  for (let n = 2; n <= 24; n++) {
    const { cell, rows, x0A, x0B, y0 } = arrayGeometry(48, 36, n);
    assert.ok(cell >= 5, `cell at n=${n}`);
    for (const [count, x0] of [
      [48, x0A],
      [36, x0B],
    ]) {
      for (let i = 0; i < count; i++) {
        const { col, row } = cellOf(i, n);
        const x = x0 + col * cell;
        const y = y0 + row * cell;
        assert.ok(x >= 0 && x + cell <= 480, `x n=${n} i=${i}`);
        assert.ok(y >= 0 && y + cell <= 262, `y n=${n} i=${i}`);
      }
    }
    // The two panels do not overlap.
    assert.ok(x0A + Math.min(n, 48) * cell <= x0B + 1);
    assert.equal(rows, Math.max(Math.ceil(48 / n), Math.ceil(36 / n)));
  }
  assert.deepEqual([cellOf(0, 5), cellOf(7, 5)], [
    { col: 0, row: 0 },
    { col: 2, row: 1 },
  ]);
});

test("captions state the factor pair or the true remainder", () => {
  assert.equal(caption(48, 12).en, "48 = 12 × 4");
  assert.equal(caption(36, 8).en, "36 ÷ 8 = 4 R 4");
  assert.equal(caption(36, 8).es, "36 ÷ 8 = 4, sobran 4");
  for (let n = 2; n <= 20; n++) {
    const c = caption(36, n).en;
    if (36 % n === 0) assert.equal(c, `36 = ${n} × ${36 / n}`);
    else assert.equal(c, `36 ÷ ${n} = ${Math.floor(36 / n)} R ${36 % n}`);
  }
});

test("packChoices: the GCF is the only right answer; each wrong one fails for a stated reason", () => {
  const v = validateFactorPairs(CFG);
  for (const s of [v.main, v.transfer]) {
    const c = packChoices(s);
    assert.ok(c.length >= 3);
    assert.equal(c.filter((o) => o.correct).length, 1);
    assert.equal(c.find((o) => o.correct)?.value, gcdSlow(s.a, s.b));
    assert.equal(new Set(c.map((o) => o.value)).size, c.length);
    for (const o of c.filter((x) => !x.correct)) {
      const works = s.a % o.value === 0 && s.b % o.value === 0;
      if (o.kind === "smaller") assert.ok(works && o.value < s.g, "smaller works but is not the most");
      else if (o.kind === "oneOnly")
        assert.ok(!works && (s.a % o.value === 0 || s.b % o.value === 0), "divides only one quantity");
      else if (o.kind === "lcm") assert.equal(o.value, lcm(s.a, s.b));
      else assert.fail(`unknown kind ${o.kind}`);
    }
  }
  assert.deepEqual(
    packChoices(v.main).map((o) => [o.kind, o.value]),
    [
      ["greatest", 12],
      ["smaller", 6],
      ["oneOnly", 24],
      ["lcm", 144],
    ],
  );
  // 24 packs uses all 48 pencils but leaves 12 of the 36 notebooks.
  const v24 = arrayView(48, 36, 24);
  assert.deepEqual([v24.A.left, v24.B.left], [0, 12]);
});

test("setting: start, max and the common-factor list derive from the numbers", () => {
  const v = validateFactorPairs(CFG);
  assert.deepEqual([v.main.g, v.main.startN, v.main.maxN], [12, 6, 16]);
  assert.deepEqual([v.transfer.g, v.transfer.startN, v.transfer.maxN], [6, 3, 10]);
  // The start is a pack count that WORKS but is not the greatest; the max is past the greatest.
  for (const s of [v.main, v.transfer]) {
    assert.ok(arrayView(s.a, s.b, s.startN).works);
    assert.ok(s.startN < s.g && s.maxN > s.g);
    assert.ok(!arrayView(s.a, s.b, s.g + 1).works);
  }
});

test("validation refuses configs the stage cannot draw correctly", () => {
  assert.ok(validateFactorPairs(CFG));
  assert.equal(reexported(CFG)?.main.g, 12);
  assert.equal(validateFactorPairs(null), null);
  assert.equal(validateFactorPairs({ ...CFG, a: 48, b: 48 }), null);
  assert.equal(validateFactorPairs({ ...CFG, a: 12, b: 36 }), null); // one divides the other
  assert.equal(validateFactorPairs({ ...CFG, a: 7, b: 9 }), null); // only the factor 1 in common
  assert.equal(validateFactorPairs({ ...CFG, a: 10, b: 15 }), null); // 1 and 5 only
  assert.equal(validateFactorPairs({ ...CFG, a: 120, b: 36 }), null); // too many items
  assert.equal(validateFactorPairs({ ...CFG, story: undefined }), null);
  assert.equal(validateFactorPairs({ ...CFG, lcm: undefined }), null);
  assert.equal(validateFactorPairs({ ...CFG, lcm: { ...CFG.lcm, a: 4, b: 4 } }), null);
  assert.equal(validateFactorPairs({ ...CFG, lcm: { ...CFG.lcm, question: undefined } }), null);
  assert.equal(validateFactorPairs({ ...CFG, transfer: { a: 48, b: 36 } }), null);
  assert.equal(validateFactorPairs({ ...CFG, transfer: undefined }), null);
  assert.equal(buildFactorPairsPlay({ ...CFG, a: 7, b: 9 }), null);
  assert.equal(buildFactorPairsPlay(undefined), null);
});

test("copy states only true numbers and has Spanish for every line", () => {
  const v = validateFactorPairs(CFG);
  const T = factorPairsCopy(v);
  const flat = JSON.stringify(T, (k, x) => (typeof x === "function" || k === "lcmLanes" ? undefined : x));
  for (const must of ["1, 2, 3, 4, 6, 12", "48 ÷ 12 = 4", "36 ÷ 12 = 3", "12 packs", "24", "MCD"])
    assert.ok(flat.includes(must), must);
  assert.equal(T.buildOk.en.includes("48 = 12 × 4 and 36 = 12 × 3"), true);
  assert.equal(T.transferOk.en, "Yes: 6 packs. Check: 12 ÷ 6 = 2 erasers and 18 ÷ 6 = 3 rulers in each pack.");
  assert.equal(T.leftOver(0, 4, v.main.nameA, v.main.nameB).en, "Pencils left over: 0. Notebooks left over: 4.");
  assert.equal(T.leftOver(0, 4, v.main.nameA, v.main.nameB).es, "Sobran lápices: 0. Sobran cuadernos: 4.");
  const pairs = [];
  const walk = (o, path) => {
    if (typeof o === "function" || path.endsWith("lcmLanes")) return;
    if (o && typeof o === "object") {
      if ("en" in o && "es" in o) pairs.push([path, o]);
      else for (const [k, x] of Object.entries(o)) walk(x, `${path}.${k}`);
    }
  };
  walk(T, "T");
  pairs.push(
    ["packLabel", T.packLabel(12)],
    ["cue.smaller", T.packCue.smaller(6)],
    ["cue.oneOnly", T.packCue.oneOnly(24)],
    ["cue.lcm", T.packCue.lcm(144)],
    ["factorsLabel", T.factorsLabel(48)],
    ["worksNote", T.worksNote(6, [2, 3, 6])],
    ["lcmLabel", T.lcmLabel(24)],
    ["lcmCue", T.lcmCue.later(48)],
  );
  assert.ok(pairs.length > 25);
  for (const [path, o] of pairs) {
    assert.ok(o.en && o.es, path);
    assert.ok(!/\b(usted|vosotros)\b/i.test(o.es), `${path}: register`);
    assert.ok(!/\b(the|and|of|each|packs?)\b/.test(o.es), `${path}: English left in Spanish: ${o.es}`);
  }
  // The 24-pack mistake points at the notebooks (36 does not divide into 24 packs).
  assert.ok(T.packCue.oneOnly(24).en.includes("notebooks"));
  assert.ok(T.packCue.oneOnly(24).en.includes("pencils evenly"));
});

test("the play builds with six scenes and gates on predict, build, lcm", () => {
  const play = buildFactorPairsPlay(CFG);
  assert.ok(play);
  assert.deepEqual(
    play.scenes.map((s) => s.id),
    ["situate", "predict", "build", "connect", "lcm", "transfer"],
  );
  assert.deepEqual(
    play.scenes.filter((s) => s.gate).map((s) => s.id),
    ["predict", "build", "lcm"],
  );
  assert.match(play.viewBox, /^0 0 480 300$/);
});

test("the authored 6-7 config uses the lesson's own numbers", () => {
  const lesson = lessonConfig();
  const living = lesson.launch.conceptIntro.livingScene;
  assert.equal(living.kind, "living-scene");
  assert.equal(living.play, "factor-pairs");
  assert.deepEqual([living.a, living.b], [48, 36]); // iDo
  assert.deepEqual([living.lcm.a, living.lcm.b], [8, 6]); // youDo: Ayasha
  assert.deepEqual([living.transfer.a, living.transfer.b], [12, 18]); // approaching practice
  const ci = JSON.stringify(lesson.launch.conceptIntro);
  assert.ok(ci.includes("48 pencils and 36 notebooks"));
  assert.ok(ci.includes("painting class every 8 weeks"));
  assert.ok(JSON.stringify(lesson.practice).includes("greatest common factor of 12 and 18"));
});
