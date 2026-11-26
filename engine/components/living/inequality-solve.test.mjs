// inequality-solve.test.mjs — every value the inequality-solve play (8-6) tests or
// states, recomputed here by enumeration.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildInequalitySolvePlay, validateInequalitySolve as reexported } from "./inequality-solve.js";
import {
  disagreement,
  holdsOrig,
  lhsOf,
  makeIneq,
  moveChoices,
  origText,
  solveCopy,
  solvedChoices,
  solvedText,
  stepText,
  subLine,
  validateInequalitySolve,
  verdictBoth,
} from "./inequality-solve-model.js";
import { rangeFor } from "./inequality-line-model.js";

const CFG = JSON.parse(
  readFileSync(new URL("../../../lessons/8-6/config.json", import.meta.url), "utf8"),
).launch.conceptIntro.livingScene;
const SYMS = ["<", ">", "≤", "≥"];
const truth = { "<": (x, l) => x < l, ">": (x, l) => x > l, "≤": (x, l) => x <= l, "≥": (x, l) => x >= l };
const story = { en: "A story.", es: "Una historia." };
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

const GRID = [];
for (const form of ["add", "sub"])
  for (const sym of SYMS)
    for (const a of [3, 4, 5, 7])
      for (const b of [8, 10, 15, 53])
        GRID.push(makeIneq({ form, a, sym, b, letter: "x", story }));
const GOOD = GRID.filter(Boolean);

test("makeIneq: the boundary is b ∓ a, and the solved inequality has the same solutions", () => {
  assert.ok(GOOD.length > 40);
  for (const q of GOOD) {
    assert.equal(q.limit, q.form === "add" ? q.b - q.a : q.b + q.a);
    for (const x of range(-5, 130)) {
      // Original: x ± a ⋄ b, evaluated directly. Solved: x ⋄ limit. They must agree everywhere.
      const left = q.form === "add" ? x + q.a : x - q.a;
      assert.equal(truth[q.sym](left, q.b), truth[q.sym](x, q.limit), `${origText(q)} at ${x}`);
      assert.equal(holdsOrig(q, x), truth[q.sym](x, q.limit));
    }
  }
  assert.equal(makeIneq({ form: "add", a: 3, sym: ">", b: 53, letter: "x", story }).limit, 50);
  assert.equal(makeIneq({ form: "sub", a: 5, sym: "≤", b: 8, letter: "x", story }).limit, 13);
});

test("makeIneq refuses what the line cannot show or the lesson does not cover", () => {
  for (const s of [
    null,
    {},
    { form: "mul", a: 3, sym: ">", b: 53, story },
    { form: "add", a: 3, sym: "=", b: 53, story },
    { form: "add", a: 52, sym: ">", b: 53, story }, // boundary 1
    { form: "add", a: 60, sym: ">", b: 53, story }, // negative boundary
    { form: "add", a: 3, sym: ">", b: 53 }, // no story
    { form: "add", a: 3.5, sym: ">", b: 53, story },
  ])
    assert.equal(makeIneq(s ?? {}), null, JSON.stringify(s));
  assert.equal(origText(GOOD[0]).includes("−") || origText(GOOD[0]).includes("+"), true);
  assert.equal(origText(makeIneq({ form: "sub", a: 5, sym: "≤", b: 8, story })), "x − 5 ≤ 8");
  assert.equal(stepText(makeIneq({ form: "add", a: 3, sym: ">", b: 53, story })), "x + 3 − 3 > 53 − 3");
  assert.equal(stepText(makeIneq({ form: "sub", a: 5, sym: "≤", b: 8, story })), "x − 5 + 5 ≤ 8 + 5");
});

test("solvedChoices: one right solution; each wrong one disagrees with the original at the cue's value", () => {
  for (const q of GOOD) {
    const opts = solvedChoices(q);
    if (opts.some((o) => !o.correct && o.v == null)) continue; // validate refuses these configs
    assert.equal(opts.length, 4);
    assert.equal(opts.filter((o) => o.correct).length, 1);
    const right = opts.find((o) => o.correct);
    assert.equal(right.text, `x ${q.sym} ${q.limit}`);
    const { lo, hi } = rangeFor(q.limit);
    for (const o of opts) {
      const agrees = range(lo, hi).every((x) => truth[o.sym](x, o.limit) === holdsOrig(q, x));
      assert.equal(agrees, !!o.correct, `${origText(q)} vs ${o.text}`);
      if (!o.correct) {
        assert.notEqual(truth[o.sym](o.v, o.limit), holdsOrig(q, o.v));
        assert.ok(o.cue.en.includes(`${q.letter} = ${o.v}`));
        assert.ok(o.cue.en.includes(`${o.v} + ${q.a} = ${o.v + q.a}`) || o.cue.en.includes(`${o.v} − ${q.a} = ${o.v - q.a}`));
        assert.ok(!o.cue.en.includes(`x ${q.sym} ${q.limit}`) || o.id !== "op", "a cue never prints the right answer");
      }
    }
  }
});

test("the 8-6 wrong answers are the real slips: +3 instead of −3, copying 53, flipping the symbol", () => {
  const q = makeIneq({ form: "add", a: 3, sym: ">", b: 53, story });
  assert.deepEqual(
    solvedChoices(q).map((o) => o.text).sort(),
    ["x < 50", "x > 50", "x > 53", "x > 56"].sort(),
  );
  const opts = Object.fromEntries(solvedChoices(q).map((o) => [o.id, o]));
  assert.equal(opts.op.v, 51); // 51 + 3 = 54 > 53 is true but 51 > 56 is false
  assert.equal(opts.copy.v, 51);
  assert.equal(opts.flip.v, 49); // 49 + 3 = 52 > 53 is false but 49 < 50 is true
  assert.match(opts.op.cue.en, /51 \+ 3 = 54, and 54 > 53 is true/);
  const t = makeIneq({ form: "sub", a: 5, sym: "≤", b: 8, story });
  assert.deepEqual(
    solvedChoices(t).map((o) => o.text).sort(),
    ["x < 13".replace("<", "≥"), "x ≤ 13", "x ≤ 3", "x ≤ 8"].sort(),
  );
});

test("moveChoices: the inverse move on both sides is right; the slips are cued", () => {
  for (const q of GOOD) {
    const opts = moveChoices(q);
    assert.equal(opts.length, 3);
    assert.equal(opts.filter((o) => o.correct).length, 1);
    const inv = q.form === "add" ? `Subtract ${q.a} from both sides` : `Add ${q.a} to both sides`;
    assert.equal(opts.find((o) => o.correct).label.en, inv);
    const one = opts.find((o) => o.id === "one");
    if (one.v != null) assert.notEqual(truth[q.sym](one.v, q.b), holdsOrig(q, one.v), "left-only result x ⋄ b is wrong");
    assert.ok(opts.find((o) => o.id === "same").cue.en.includes(`${2 * q.a}`));
  }
});

test("disagreement picks the value nearest the boundary", () => {
  const q = makeIneq({ form: "add", a: 3, sym: ">", b: 53, story });
  assert.equal(disagreement(q, { sym: ">", limit: 56 }), 51);
  assert.equal(disagreement(q, { sym: ">", limit: 50 }), null);
  assert.equal(lhsOf(q, 52), 55);
  assert.equal(subLine(q, 52), "52 + 3 = 55, and 55 > 53");
});

test("verdictBoth: the original and the solved form always give the same answer", () => {
  for (const q of GOOD)
    for (const x of range(q.limit - 5, q.limit + 5)) {
      const t = verdictBoth(q, x).en;
      const ok = truth[q.sym](x, q.limit);
      const lhs = q.form === "add" ? x + q.a : x - q.a;
      assert.equal(truth[q.sym](lhs, q.b), ok);
      assert.ok(t.endsWith(`${ok ? "true" : "false"} ${ok ? "✓" : "✗"}`));
      assert.equal((t.match(/is true/g) || t.match(/is false/g)).length, 2, "both forms state the same verdict");
    }
});

test("validateInequalitySolve accepts the 8-6 config and refuses bad ones", () => {
  const v = validateInequalitySolve(CFG);
  assert.deepEqual([v.main.limit, v.transfer.limit], [50, 13]);
  const t = CFG.transfer;
  for (const c of [
    null,
    {},
    { ...CFG, mode: "graph" },
    { ...CFG, transfer: { ...t, form: "add", a: 5, b: 20, sym: "≤" } }, // same form
    { ...CFG, transfer: { ...t, sym: ">" } }, // same picture (open, right)
    { ...CFG, transfer: undefined },
    { ...CFG, story: undefined },
    { ...CFG, a: 70 },
  ]) {
    assert.equal(validateInequalitySolve(c), null, JSON.stringify(c)?.slice(0, 80));
    assert.equal(buildInequalitySolvePlay(c), null);
  }
});

test("the 8-6 scenes: shape, gates and stated numbers", () => {
  const play = buildInequalitySolvePlay(CFG);
  assert.deepEqual(
    play.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["inequality", false],
      ["predict", true],
      ["move", true],
      ["check", true],
      ["transfer", false],
    ],
  );
  assert.match(play.printSummary.en, /x \+ 3 − 3 > 53 − 3, so x > 50\. Graph an open circle ○ \(not included\) at 50, shaded right/);
  assert.match(play.printSummary.en, /x − 5 ≤ 8 works the same way: x ≤ 13/);
  assert.match(play.printSummary.es, /x ≤ 13/);
  assert.doesNotMatch(play.title.en, /\d|>|≤/);
  const T = solveCopy(validateInequalitySolve(CFG));
  assert.match(T.moveOk(validateInequalitySolve(CFG).main).en, /The symbol stays >/);
  assert.equal(solvedText(validateInequalitySolve(CFG).main), "x > 50");
});

test("copy: Spanish has no English left", () => {
  const english = /\b(the|which|and|your|both|choose|check|value|test|then|true|false|move|solution)\b/i;
  const v = validateInequalitySolve(CFG);
  const walk = (o, path) => {
    if (o && typeof o === "object" && typeof o.en === "string") {
      assert.doesNotMatch(o.es, english, `${path}: ${o.es}`);
      if (/[A-Za-z]{3,}/.test(o.en)) assert.notEqual(o.es, o.en, path);
    } else if (o && typeof o === "object") for (const [k, x] of Object.entries(o)) walk(x, `${path}.${k}`);
  };
  const T = solveCopy(v);
  for (const [k, x] of Object.entries(T)) if (typeof x !== "function") walk(x, k);
  for (const q of [v.main, v.transfer]) {
    walk(T.moveOk(q), "moveOk");
    for (const o of [...solvedChoices(q), ...moveChoices(q)])
      for (const p of [o.label, o.cue]) if (p && p.es) assert.doesNotMatch(p.es, english, p.es);
    for (const x of range(q.limit - 2, q.limit + 2)) assert.doesNotMatch(verdictBoth(q, x).es, english);
  }
});

test("inequality-solve.js re-exports the model's validator", () => {
  assert.equal(reexported, validateInequalitySolve);
});
