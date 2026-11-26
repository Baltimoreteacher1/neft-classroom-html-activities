// median-fold.test.mjs — every number the median-fold play shows a student.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildMedianFoldPlay } from "./median-fold.js";
import {
  evenChoices,
  fiveNumber,
  isNextSmallest,
  medianFoldCopy,
  oddChoices,
  sortedIds,
  validateMedianFold,
  validPlaced,
} from "./median-fold-model.js";

const lesson = JSON.parse(
  readFileSync(new URL("../../../lessons/2-3/config.json", import.meta.url), "utf8"),
).launch.conceptIntro.livingScene;

// Independent reference: median by sorting and indexing, written differently.
const ref = (a) => {
  const s = a.slice().sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length & 1 ? s[m] : (s[m - 1] + s[m]) / 2;
};

test("the authored 2-3 config validates and builds", () => {
  assert.ok(validateMedianFold(lesson));
  const play = buildMedianFoldPlay(lesson);
  assert.ok(play);
  assert.deepEqual(
    play.scenes.map((s) => s.id),
    ["predict", "order", "fold", "even", "whatIf", "transfer"],
  );
  assert.deepEqual(
    play.scenes.map((s) => !!s.gate),
    [true, true, true, true, true, false],
  );
});

test("medians the scenes state match an independent recompute", () => {
  assert.equal(ref(lesson.values), 4); // 2,4,4,6,9
  assert.equal(fiveNumber(lesson.values).med, 4);
  assert.equal(ref(lesson.even), 5); // (4+6)/2, not in the data
  assert.equal(fiveNumber(lesson.even).med, 5);
  assert.equal(ref(lesson.whatIf.values), 7); // 3,7,7,10,13
  assert.equal(ref(lesson.transfer.values), 10); // 8,9,10,10,11,12,30
  // The what-if claim: the median never moves while the greatest value grows.
  for (let g = 13; g <= 130; g++) assert.equal(ref([3, 7, 7, 10, g]), 7);
});

test("odd choices: one correct; wrong ones are the written middle, mean, midrange", () => {
  const c = oddChoices(lesson.values);
  assert.deepEqual(
    c.map((o) => [o.kind, o.value, !!o.correct]),
    [
      ["median", 4, true],
      ["written", 2, false],
      ["mean", 5, false],
      ["midrange", 5.5, false],
    ],
  );
  const t = oddChoices(lesson.transfer.values);
  assert.deepEqual(
    t.map((o) => o.kind),
    ["median", "written", "mean", "midrange"],
  );
  assert.equal(t[1].value, 12); // 4th of 8,10,9,12,11,10,30 as written
  assert.ok(Math.abs(t[2].value - 90 / 7) < 1e-9);
  for (const set of [c, t, evenChoices(lesson.even)]) {
    assert.equal(set.filter((o) => o.correct).length, 1);
    assert.equal(new Set(set.map((o) => o.value)).size, set.length);
  }
});

test("even choices: the two middle values and the mean are the wrong answers", () => {
  assert.deepEqual(
    evenChoices(lesson.even).map((o) => [o.kind, o.value]),
    [
      ["median", 5],
      ["lower", 4],
      ["upper", 6],
      ["mean", 5.25],
    ],
  );
});

test("ordering rule: only a smallest remaining card, ties either way", () => {
  const v = lesson.values; // 4,9,2,6,4
  assert.equal(isNextSmallest(v, [], 2), true); // the 2
  assert.equal(isNextSmallest(v, [], 0), false);
  assert.equal(isNextSmallest(v, [2], 0), true); // a 4
  assert.equal(isNextSmallest(v, [2], 4), true); // the other 4
  assert.equal(isNextSmallest(v, [2, 0], 3), false); // 6 before the second 4
  assert.equal(validPlaced(v, [2, 4, 0, 3, 1]), true);
  assert.equal(validPlaced(v, [0]), false);
  assert.equal(validPlaced(v, [2, 2]), false);
  assert.equal(validPlaced(v, "x"), false);
  const sorted = sortedIds(v).map((i) => v[i]);
  assert.deepEqual(sorted, [2, 4, 4, 6, 9]);
});

test("validation refuses what the stage cannot draw", () => {
  const bad = (patch) => validateMedianFold({ ...lesson, ...patch });
  assert.equal(bad({ values: [2, 4, 4, 6, 9] }), null); // already sorted
  assert.equal(bad({ values: [4, 9, 2, 6] }), null); // even count
  assert.equal(bad({ values: [4, 9, 2, 6, 4.5] }), null);
  assert.equal(bad({ even: [2, 4, 6] }), null);
  assert.equal(bad({ even: [2, 4, 4, 9] }), null); // equal middle values
  assert.equal(bad({ whatIf: { values: [3, 7, 7, 10, 13], max: 20 } }), null); // too little room
  assert.equal(bad({ whatIf: { values: [3, 7, 7, 13, 13], max: 130 } }), null); // tie at the top
  assert.equal(bad({ transfer: { values: [1, 2, 3, 4, 5] } }), null);
  assert.equal(buildMedianFoldPlay({}), null);
  assert.equal(buildMedianFoldPlay(null), null);
});

test("copy: English and Spanish both present and carry the computed numbers", () => {
  const T = medianFoldCopy(validateMedianFold(lesson));
  const walk = (o, path = "") => {
    if (o && typeof o === "object" && "en" in o) {
      assert.ok(o.es && o.es.trim(), `${path} has no Spanish`);
      assert.notEqual(o.es, o.en, `${path} Spanish equals English`);
    } else if (o && typeof o === "object")
      for (const [k, x] of Object.entries(o)) if (typeof x !== "function") walk(x, `${path}.${k}`);
  };
  walk(T);
  assert.match(T.foldDone.en, /median is 4/);
  assert.match(T.evenOk.en, /\(4 \+ 6\) ÷ 2 = 5/);
  assert.match(T.evenOk.en, /not one of the data values/);
  assert.match(T.transferOk.en, /number 4 of 7, is 10/);
  assert.match(T.whatIfSay.en, /up to 130/);
  const cue = T.cueOdd({ kind: "mean", value: 5 }, lesson.values);
  assert.match(cue.en, /total ÷ 5/);
  assert.doesNotMatch(cue.en, /median is 4/); // a miss never states the answer
  for (const o of oddChoices(lesson.values).filter((x) => !x.correct)) {
    const c = T.cueOdd(o, lesson.values);
    assert.doesNotMatch(`${c.en} ${c.es}`, /median is 4|mediana es 4/);
  }
  assert.doesNotMatch(JSON.stringify(T.cueEven({ kind: "lower", value: 4 })), /= 5/);
});
