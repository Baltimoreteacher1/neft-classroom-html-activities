// factor-tree.test.mjs — every number the factor-tree play shows a student,
// recomputed without the play's own helpers.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildFactorTreePlay, validateFactorTree as reexported } from "./factor-tree.js";
import {
  buildTree,
  factorizationChoices,
  factorTreeCopy,
  fmtPowers,
  fmtProduct,
  isPrime,
  layout,
  placeCorrect,
  powers,
  primeFactors,
  splitChoices,
  splittable,
  validateFactorTree,
  visibleNodes,
} from "./factor-tree-model.js";

// The 6-13 config: 60 = 6 × 10, the classmate's 2 × 30, and the weDo 12 = 3 × 4.
const CFG = {
  n: 60,
  split: [6, 10],
  alt: [2, 30],
  story: { en: "Mission Control has 60 supply crates.", es: "El Centro de Control tiene 60 cajas." },
  transfer: { n: 12, split: [3, 4] },
};

// An independent prime test and factoriser.
const primeSlow = (n) => n > 1 && Array.from({ length: n - 2 }, (_, i) => i + 2).every((d) => n % d);
const factorSlow = (n) => {
  const out = [];
  for (let d = 2; n > 1; ) {
    if (n % d === 0) {
      out.push(d);
      n /= d;
    } else d++;
  }
  return out;
};

test("isPrime and primeFactors agree with brute force for 2..400", () => {
  for (let n = 2; n <= 400; n++) {
    assert.equal(isPrime(n), primeSlow(n), `isPrime(${n})`);
    assert.deepEqual(primeFactors(n), factorSlow(n), `primeFactors(${n})`);
  }
  assert.equal(isPrime(1), false);
  assert.equal(isPrime(0), false);
});

test("the lesson's numbers: 60 = 2² × 3 × 5 and 12 = 2² × 3", () => {
  assert.equal(fmtPowers(primeFactors(60)), "2² × 3 × 5");
  assert.equal(fmtProduct(primeFactors(60)), "2 × 2 × 3 × 5");
  assert.equal(fmtPowers(primeFactors(12)), "2² × 3");
  assert.deepEqual(powers([2, 2, 3, 5]), [
    { p: 2, e: 2 },
    { p: 3, e: 1 },
    { p: 5, e: 1 },
  ]);
  assert.equal(2 * 2 * 3 * 5, 60);
});

test("buildTree: every internal node is the product of its two children; leaves are prime", () => {
  for (const [n, split] of [
    [60, [6, 10]],
    [60, [2, 30]],
    [12, [3, 4]],
  ]) {
    const nodes = buildTree(n, split);
    for (const nd of nodes) {
      if (nd.kids.length) {
        assert.equal(nd.kids.length, 2);
        assert.equal(nodes[nd.kids[0]].n * nodes[nd.kids[1]].n, nd.n);
        assert.equal(isPrime(nd.n), false);
      } else assert.equal(isPrime(nd.n), true);
    }
    const leaves = nodes.filter((x) => !x.kids.length).map((x) => x.n);
    assert.deepEqual(
      leaves.sort((a, b) => a - b),
      factorSlow(n),
    );
    // Breadth-first ids: a parent always comes before its children.
    for (const nd of nodes) if (nd.parent >= 0) assert.ok(nd.parent < nd.id);
  }
  // The first split is the lesson's: 60 -> 6 and 10.
  const t = buildTree(60, [6, 10]);
  assert.deepEqual([t[1].n, t[2].n], [6, 10]);
});

test("different first splits end on the same prime factors", () => {
  const a = buildTree(60, [6, 10]).filter((x) => !x.kids.length);
  const b = buildTree(60, [2, 30]).filter((x) => !x.kids.length);
  assert.deepEqual(a.map((x) => x.n).sort(), b.map((x) => x.n).sort());
});

test("splittable / visible: only composites on stage can be split, in tree order", () => {
  const nodes = buildTree(60, [6, 10]);
  assert.deepEqual(visibleNodes(nodes, [0]), [0, 1, 2]);
  assert.deepEqual(
    splittable(nodes, [0]).map((id) => nodes[id].n),
    [6, 10],
  );
  assert.deepEqual(
    splittable(nodes, [0, 1]).map((id) => nodes[id].n),
    [10],
  );
  assert.deepEqual(splittable(nodes, [0, 1, 2]), []);
  // A deeper node is not splittable before its parent was split.
  assert.deepEqual(visibleNodes(nodes, []), [0]);
  assert.deepEqual(
    splittable(nodes, []).map((id) => nodes[id].n),
    [60], // before the first split only the root can be split
  );
});

test("layout: every visible node has a place inside the stage and parents sit over children", () => {
  const nodes = buildTree(60, [6, 10]);
  for (const split of [[0], [0, 1], [0, 1, 2]]) {
    const pos = layout(nodes, split);
    for (const id of visibleNodes(nodes, split)) {
      assert.ok(pos[id].x > 20 && pos[id].x < 460, `x of ${id}`);
      assert.ok(pos[id].y > 20 && pos[id].y < 220, `y of ${id}`);
    }
  }
  const pos = layout(nodes, [0, 1, 2]);
  for (const nd of nodes.filter((x) => x.kids.length && pos[x.id])) {
    const xs = nd.kids.map((k) => pos[k].x);
    assert.equal(pos[nd.id].x, (Math.min(...xs) + Math.max(...xs)) / 2);
    for (const k of nd.kids) assert.ok(pos[k].y > pos[nd.id].y);
  }
});

test("splitChoices: exactly one option is the truth; wrong ones carry a real discrepancy", () => {
  const c = splitChoices(6, 10);
  assert.equal(c.length, 4);
  assert.equal(c.filter((o) => o.correct).length, 1);
  assert.deepEqual(c.find((o) => o.correct)?.set, [6, 10]);
  for (const o of c.filter((x) => !x.correct)) assert.ok(o.wrongIn != null || o.missed != null);
  // 12 = 3 × 4: only 4 can be split.
  const d = splitChoices(3, 4);
  assert.deepEqual(d.find((o) => o.correct)?.set, [4]);
  assert.equal(d.filter((o) => o.correct).length, 1);
});

test("factorizationChoices: one right answer; every wrong one multiplies to something else or is unfinished", () => {
  const spec = { n: 12, split: [3, 4], fs: [2, 2, 3] };
  const c = factorizationChoices(spec);
  assert.ok(c.length >= 3);
  assert.equal(c.filter((o) => o.correct).length, 1);
  assert.equal(c.find((o) => o.correct)?.text, "2² × 3");
  const val = (t) =>
    t.split(" × ").reduce((a, f) => {
      const m = /^(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]*)$/.exec(f);
      const e = m?.[2] ? Number([...m[2]].map((ch) => "⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(ch)).join("")) : 1;
      return a * Number(m?.[1]) ** e;
    }, 1);
  for (const o of c) {
    if (o.correct) assert.equal(val(o.text), 12);
    else {
      const fs = o.text.split(" × ").map((x) => Number(x.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/, "")));
      const done = fs.every((x) => primeSlow(x));
      // wrong = unfinished (a composite factor) OR a product that is not 12
      assert.ok(!done || val(o.text) !== 12, `${o.text} must really be wrong`);
    }
  }
  assert.equal(new Set(c.map((o) => o.text)).size, c.length);
  const c60 = factorizationChoices({ n: 60, split: [6, 10], fs: [2, 2, 3, 5] });
  assert.equal(c60.filter((o) => o.correct).length, 1);
});

test("placeCorrect: the right answer is not always first", () => {
  const seats = new Set();
  for (let seed = 0; seed < 8; seed++) {
    const opts = placeCorrect(
      [{ correct: true }, { correct: false }, { correct: false }, { correct: false }],
      seed,
    );
    seats.add(opts.findIndex((o) => o.correct));
  }
  assert.ok(seats.size > 1);
});

test("validation refuses configs the stage cannot draw correctly", () => {
  assert.ok(validateFactorTree(CFG));
  assert.equal(reexported(CFG)?.main.n, 60);
  assert.equal(validateFactorTree(null), null);
  assert.equal(validateFactorTree({ ...CFG, split: [6, 11] }), null); // product is not n
  assert.equal(validateFactorTree({ ...CFG, split: [1, 60] }), null); // 1 is not a split
  assert.equal(validateFactorTree({ ...CFG, alt: [10, 6] }), null); // same split as main
  assert.equal(validateFactorTree({ ...CFG, alt: [4, 15] })?.alt[0], 4);
  assert.equal(validateFactorTree({ ...CFG, alt: [5, 11] }), null);
  assert.equal(validateFactorTree({ ...CFG, alt: undefined }), null);
  assert.equal(validateFactorTree({ ...CFG, n: 7, split: [1, 7] }), null); // prime
  assert.equal(validateFactorTree({ ...CFG, n: 6, split: [2, 3], alt: [3, 2] }), null);
  assert.equal(validateFactorTree({ ...CFG, n: 30, split: [5, 6], alt: [2, 15] }), null); // no repeated prime
  assert.equal(validateFactorTree({ ...CFG, n: 4096, split: [64, 64], alt: [2, 2048] }), null);
  assert.equal(validateFactorTree({ ...CFG, transfer: { n: 60, split: [6, 10] } }), null);
  assert.equal(validateFactorTree({ ...CFG, transfer: { n: 12, split: [3, 5] } }), null);
  assert.equal(validateFactorTree({ ...CFG, transfer: undefined }), null);
  assert.equal(validateFactorTree({ ...CFG, story: 5 }), null);
  assert.equal(buildFactorTreePlay({ ...CFG, split: [6, 11] }), null);
  assert.equal(buildFactorTreePlay({}), null);
});

test("copy states only true numbers and has Spanish for every line", () => {
  const T = factorTreeCopy(validateFactorTree(CFG));
  const all = JSON.stringify(T, (k, v) => (k === "trees" ? undefined : v));
  assert.ok(all.includes("2 × 2 × 3 × 5"));
  assert.ok(all.includes("2² × 3 × 5"));
  assert.ok(all.includes("12 = 2 × 2 × 3 = 2² × 3") || all.includes("2² × 3"));
  const check = [];
  const walk = (o, path) => {
    if (o && typeof o === "object") {
      if ("en" in o && "es" in o) check.push([path, o]);
      else for (const [k, v] of Object.entries(o)) if (k !== "trees") walk(v, `${path}.${k}`);
    }
  };
  walk(T, "T");
  assert.ok(check.length > 20);
  for (const [path, o] of check) {
    assert.ok(o.en && o.es, path);
    assert.notEqual(o.en, o.es, `${path}: Spanish must not be the English copied`);
    assert.ok(!/\b(usted|vosotros)\b/i.test(o.es), `${path}: register`);
  }
  // Function copy: the prime note and split feedback.
  assert.equal(T.splitDone(6, [2, 3]).en, "6 = 2 × 3. 2 and 3 are prime, so those branches stop.");
  assert.equal(
    T.splitDone(4, [2, 2]).es,
    "4 = 2 × 2. 2 y 2 son primos, así que esas ramas se detienen.",
  );
  assert.equal(T.splitDone(12, [3, 4]).en, "12 = 3 × 4. 3 is prime, so that branch stops.");
  assert.equal(T.predictLabel([]).en, "Neither: 6 × 10 = 60 is finished");
});

test("the play builds with 5+ scenes, a gate on predict and grow, and an explain frame", () => {
  const play = buildFactorTreePlay(CFG);
  assert.ok(play);
  assert.deepEqual(
    play.scenes.map((s) => s.id),
    ["situate", "predict", "grow", "connect", "other", "transfer"],
  );
  assert.deepEqual(
    play.scenes.filter((s) => s.gate).map((s) => s.id),
    ["predict", "grow", "other"],
  );
  assert.match(play.viewBox, /^0 0 480 \d+$/);
});

test("the authored 6-13 config builds", () => {
  const lesson = JSON.parse(readFileSync(new URL("../../../lessons/6-13/config.json", import.meta.url), "utf8"));
  const living = lesson.launch.conceptIntro.livingScene;
  assert.equal(living.kind, "living-scene");
  assert.equal(living.play, "factor-tree");
  assert.ok(buildFactorTreePlay(living));
  // The scene uses the lesson's own worked example: 60 = 6 × 10, the weDo 12 = 3 × 4.
  assert.equal(living.n, 60);
  assert.deepEqual(living.split, [6, 10]);
  assert.equal(living.transfer.n, 12);
  const text = JSON.stringify(lesson.launch.conceptIntro.iDo.lines);
  assert.ok(text.includes("60 = 6 × 10"));
});
