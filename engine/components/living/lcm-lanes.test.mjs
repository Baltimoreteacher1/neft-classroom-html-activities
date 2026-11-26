// lcm-lanes.test.mjs — every number the lcm-lanes play shows a student,
// recomputed without the play's own helpers.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildLcmLanesPlay, validateLcmLanes as reexported } from "./lcm-lanes.js";
import {
  commonMultiples,
  firstChoices,
  gcd,
  hopState,
  lcm,
  lcmLanesCopy,
  multiples,
  nextChoices,
  placeCorrect,
  validateLcmLanes,
  xOf,
} from "./lcm-lanes-model.js";

// The 6-12 config: Reyes checks oxygen every 4 hours, Chen water every 6; weDo 3 and 5.
const CFG = {
  a: 4,
  b: 6,
  nameA: { en: "Oxygen check", es: "Revisión de oxígeno" },
  nameB: { en: "Water check", es: "Revisión de agua" },
  unit: { en: "hours", es: "horas" },
  story: { en: "Reyes checks oxygen every 4 hours.", es: "Reyes revisa el oxígeno cada 4 horas." },
  transfer: { a: 3, b: 5 },
};

// Brute force: the first t > 0 that both numbers divide.
const lcmSlow = (a, b) => {
  for (let t = 1; ; t++) if (t % a === 0 && t % b === 0) return t;
};

test("lcm / gcd agree with brute force over every pair 2..12", () => {
  for (let a = 2; a <= 12; a++)
    for (let b = 2; b <= 12; b++) {
      assert.equal(lcm(a, b), lcmSlow(a, b), `lcm(${a},${b})`);
      assert.equal(gcd(a, b) * lcm(a, b), a * b);
    }
});

test("the lesson's numbers: multiples of 4 and 6, common 12, 24; weDo 3 and 5 → 15", () => {
  assert.deepEqual(multiples(4, 24), [0, 4, 8, 12, 16, 20, 24]);
  assert.deepEqual(multiples(6, 24), [0, 6, 12, 18, 24]);
  assert.deepEqual(commonMultiples(4, 6, 36), [12, 24, 36]);
  assert.equal(lcmSlow(4, 6), 12);
  assert.deepEqual(commonMultiples(3, 5, 30), [15, 30]);
  assert.equal(lcmSlow(3, 5), 15);
  // 12 ÷ 4 = 3 and 12 ÷ 6 = 2 — the iDo's check.
  assert.deepEqual([12 / 4, 12 / 6], [3, 2]);
});

test("xOf puts 0 and the span at the ends of the lane, evenly in between", () => {
  assert.equal(xOf(0, 36), 40);
  assert.equal(xOf(36, 36), 440);
  assert.equal(xOf(18, 36), 240);
  assert.ok(Math.abs(xOf(12, 36) - xOf(0, 36) - (xOf(24, 36) - xOf(12, 36))) < 1e-9);
});

test("firstChoices: the LCM is the only correct one; wrong ones are not common-and-first", () => {
  for (const [a, b] of [
    [4, 6],
    [3, 5],
    [8, 6],
    [6, 9],
    [4, 10],
    [5, 7],
  ]) {
    const L = lcmSlow(a, b);
    const c = firstChoices({ a, b, L });
    assert.ok(c.length >= 3, `${a},${b}: at least three choices`);
    assert.equal(c.filter((o) => o.correct).length, 1);
    assert.equal(c.find((o) => o.correct)?.value, L);
    assert.equal(new Set(c.map((o) => o.value)).size, c.length);
    for (const o of c.filter((x) => !x.correct)) {
      // A wrong choice is either not a common multiple, or a later one than the least.
      const common = o.value % a === 0 && o.value % b === 0;
      assert.ok(!common || o.value > L, `${a},${b}: ${o.value} must really be wrong`);
    }
  }
  const four = firstChoices({ a: 4, b: 6, L: 12 });
  assert.deepEqual(
    four.map((o) => [o.kind, o.value]),
    [
      ["least", 12],
      ["sum", 10],
      ["later", 24],
      ["factor", 2],
    ],
  );
  // 3 and 5: the product IS the LCM, so the "later" mistake is 2 × LCM; gcd 1 → "larger".
  assert.deepEqual(
    firstChoices({ a: 3, b: 5, L: 15 }).map((o) => [o.kind, o.value]),
    [
      ["least", 15],
      ["sum", 8],
      ["later", 30],
      ["larger", 5],
    ],
  );
});

test("nextChoices: 3L is the next meeting; the others miss at least one lane", () => {
  const c = nextChoices({ a: 4, b: 6, L: 12 });
  assert.equal(c.filter((o) => o.correct).length, 1);
  assert.equal(c.find((o) => o.correct)?.value, 36);
  for (const o of c.filter((x) => !x.correct)) {
    const both = o.value % 4 === 0 && o.value % 6 === 0;
    // 48 is a common multiple, but it skips 36, so "next after 24" is wrong.
    assert.ok(!both || o.value > 36, `${o.value}`);
  }
  assert.deepEqual(
    c.map((o) => o.value),
    [36, 28, 30, 48],
  );
});

test("hopState: dots meet at the first place both lanes stand together", () => {
  const s = { a: 4, b: 6, L: 12 };
  assert.deepEqual(hopState(s, 0, 0), { pa: 0, pb: 0, meet: false, first: false });
  assert.equal(hopState(s, 3, 2).first, true); // 12 = 3 × 4 = 2 × 6
  assert.equal(hopState(s, 6, 4).meet, true); // 24
  assert.equal(hopState(s, 6, 4).first, false); // …but not the first time
  assert.equal(hopState(s, 2, 1).meet, false); // 8 vs 6
  // Exhaustive: the first meeting over every pair of hop counts is the LCM.
  let first = Infinity;
  for (let ka = 1; ka <= 9; ka++)
    for (let kb = 1; kb <= 6; kb++) if (hopState(s, ka, kb).meet) first = Math.min(first, ka * 4);
  assert.equal(first, 12);
});

test("placeCorrect: the right answer is not always first", () => {
  const seats = new Set();
  for (let seed = 0; seed < 8; seed++)
    seats.add(
      placeCorrect(
        [{ correct: true }, { correct: false }, { correct: false }, { correct: false }],
        seed,
      ).findIndex((o) => o.correct),
    );
  assert.ok(seats.size > 1);
  assert.notEqual(
    placeCorrect(firstChoices({ a: 4, b: 6, L: 12 }), 13).findIndex((o) => o.correct),
    0,
  );
});

test("validation refuses pairs the lanes cannot draw correctly", () => {
  assert.ok(validateLcmLanes(CFG));
  assert.equal(reexported(CFG)?.main.L, 12);
  assert.equal(validateLcmLanes(null), null);
  assert.equal(validateLcmLanes({ ...CFG, a: 4, b: 4 }), null); // equal
  assert.equal(validateLcmLanes({ ...CFG, a: 3, b: 6 }), null); // one divides the other
  assert.equal(validateLcmLanes({ ...CFG, a: 1, b: 6 }), null);
  assert.equal(validateLcmLanes({ ...CFG, a: 4.5, b: 6 }), null);
  assert.equal(validateLcmLanes({ ...CFG, a: 11, b: 12 }), null); // 3 × 132 = 396 across 11 per dot
  assert.equal(validateLcmLanes({ ...CFG, story: undefined }), null);
  assert.equal(validateLcmLanes({ ...CFG, nameA: 5 }), null);
  assert.equal(validateLcmLanes({ ...CFG, transfer: { a: 4, b: 6 } }), null); // same as main
  assert.equal(validateLcmLanes({ ...CFG, transfer: { a: 3, b: 9 } }), null);
  assert.equal(buildLcmLanesPlay({ ...CFG, a: 4, b: 4 }), null);
  assert.equal(buildLcmLanesPlay(undefined), null);
  // Names default when not authored.
  const d = validateLcmLanes({ ...CFG, nameA: undefined });
  assert.equal(d?.main.nameA.en, "Every 4");
});

test("copy states only true numbers and has Spanish for every line", () => {
  const v = validateLcmLanes(CFG);
  const T = lcmLanesCopy(v);
  const flat = JSON.stringify(T);
  for (const must of ["12", "24", "36", "15", "30", "3 and 5", "3 y 5"]) assert.ok(flat.includes(must), must);
  assert.deepEqual(T.listA, [4, 8, 12, 16, 20, 24]);
  assert.deepEqual(T.listB, [6, 12, 18, 24]);
  assert.deepEqual(T.common, [12, 24]);
  assert.equal(T.hopOk.en.includes("3 hops of 4 and 2 hops of 6"), true);
  assert.equal(T.hopOk.es.includes("3 saltos de 4 y 2 saltos de 6"), true);
  assert.equal(
    T.printSummary.en,
    "Multiples of 4: 4, 8, 12, 16, 20, 24. Multiples of 6: 6, 12, 18, 24. Common multiples: 12, 24. The least common multiple is 12, because 12 ÷ 4 = 3 and 12 ÷ 6 = 2. Then 3 and 5: the least common multiple is 15.",
  );
  const check = [];
  const walk = (o, path) => {
    if (typeof o === "function") return;
    if (o && typeof o === "object") {
      if ("en" in o && "es" in o) check.push([path, o]);
      else for (const [k, x] of Object.entries(o)) walk(x, `${path}.${k}`);
    }
  };
  walk(T, "T");
  // Function-valued copy is exercised directly.
  const fns = [
    T.firstLabel(12),
    T.firstCue.sum(10),
    T.firstCue.factor(2),
    T.firstCue.larger(5),
    T.firstCue.later(24),
    T.hopBtn("a"),
    T.hopBtn("b"),
    T.hopAt(8, 6),
    T.hopLater(24),
    T.nextCue.oneLane(28),
    T.listLabel(4),
    T.laneLabel(v.main, "a", v.unit),
    T.laneLabel(v.transfer, "b", v.transfer.unit),
  ];
  fns.forEach((p, i) => check.push([`fn${i}`, p]));
  assert.ok(check.length > 25);
  for (const [path, o] of check) {
    assert.ok(o.en && o.es, path);
    if (!/^T\.(transferLabel|scene)/.test(path) && !/^fn0$/.test(path)) assert.ok(o.en !== o.es || /^\d/.test(o.en), `${path}: Spanish must not be English copied`);
    assert.ok(!/\b(usted|vosotros)\b/i.test(o.es), `${path}: register`);
    assert.ok(!/\b(the|and|is|are)\b/.test(o.es), `${path}: English left in Spanish: ${o.es}`);
  }
  assert.equal(T.laneLabel(v.main, "a", v.unit).en, "Oxygen check · every 4 hours");
  assert.equal(T.laneLabel(v.main, "b", v.unit).es, "Revisión de agua · cada 6 horas");
});

test("the play builds with six scenes and gates on predict, hop, next", () => {
  const play = buildLcmLanesPlay(CFG);
  assert.ok(play);
  assert.deepEqual(
    play.scenes.map((s) => s.id),
    ["situate", "predict", "hop", "connect", "next", "transfer"],
  );
  assert.deepEqual(
    play.scenes.filter((s) => s.gate).map((s) => s.id),
    ["predict", "hop", "next"],
  );
});

test("the authored 6-12 config builds and uses the lesson's own numbers", () => {
  const lesson = JSON.parse(
    readFileSync(new URL("../../../lessons/6-12/config.json", import.meta.url), "utf8"),
  );
  const living = lesson.launch.conceptIntro.livingScene;
  assert.equal(living.kind, "living-scene");
  assert.equal(living.play, "lcm-lanes");
  assert.ok(buildLcmLanesPlay(living));
  assert.deepEqual([living.a, living.b], [4, 6]); // iDo: LCM of 4 and 6
  assert.deepEqual([living.transfer.a, living.transfer.b], [3, 5]); // weDo
  const iDo = JSON.stringify(lesson.launch.conceptIntro.iDo.lines);
  assert.ok(iDo.includes("LCM of 4 and 6"));
  assert.ok(JSON.stringify(lesson.launch.conceptIntro.weDo.lines).includes("LCM of 3 and 5"));
});
