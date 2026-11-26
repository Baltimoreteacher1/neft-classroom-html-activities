// balance-solve.test.mjs — every number the balance-solve play shows a student,
// recomputed here without the play's own helpers.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildBalanceSolvePlay, validateBalanceSolve as reexported } from "./balance-solve.js";
import {
  balanceCopy,
  checkText,
  contrastChoices,
  eqText,
  lhsText,
  makeEq,
  modelChoices,
  opChoices,
  PAN_PX,
  POOL,
  resultChoices,
  scaleFor,
  stages,
  tiltFor,
  total,
  validateBalanceSolve,
} from "./balance-solve-model.js";

const lesson = (id) =>
  JSON.parse(readFileSync(new URL(`../../../lessons/${id}/config.json`, import.meta.url), "utf8"))
    .launch.conceptIntro.livingScene;

// Independent: the left side of each form evaluated at v, and the solution of b.
const lhs = (form, a, v) => ({ add: v + a, sub: v - a, mul: a * v, div: v / a })[form];
const solve = (form, a, b) => ({ add: b - a, sub: b + a, mul: b / a, div: b * a })[form];

const GRID = [];
for (const form of ["add", "sub", "mul", "div"]) {
  for (const a of [2, 3, 4, 5, 6, 7, 23]) {
    for (const b of [9, 12, 20, 21, 36, 45, 58, 85]) GRID.push({ form, a, b, letter: "n" });
  }
}
const GOOD = GRID.map((s) => makeEq(s)).filter(Boolean);

test("makeEq: the solution is recomputed independently for every form", () => {
  assert.ok(GOOD.length > 100);
  for (const e of GOOD) {
    const s = solve(e.form, e.a, e.b);
    assert.equal(e.x, s, JSON.stringify(e));
    assert.equal(lhs(e.form, e.a, e.x), e.b, `${eqText(e)} is true at its solution`);
  }
  assert.equal(makeEq({ form: "add", a: 23, b: 58, letter: "n" }).x, 35);
  assert.equal(makeEq({ form: "mul", a: 3, b: 21, letter: "x" }).x, 7);
  assert.equal(makeEq({ form: "sub", a: 4, b: 9, letter: "x" }).x, 13);
  assert.equal(makeEq({ form: "div", a: 4, b: 9, letter: "x" }).x, 36);
});

test("makeEq refuses what has no whole-number solution or cannot be drawn", () => {
  for (const s of [
    null,
    {},
    { form: "add", a: 9, b: 9 }, // x = 0
    { form: "add", a: 10, b: 9 }, // negative
    { form: "mul", a: 4, b: 21 }, // 21/4
    { form: "mul", a: 1, b: 21 }, // a·x with a = 1 is not a move
    { form: "div", a: 9, b: 4 }, // more than six parts
    { form: "pow", a: 2, b: 4 },
    { form: "add", a: 2.5, b: 9 },
    { form: "add", a: 2, b: 1000 },
  ])
    assert.equal(makeEq(s ?? {}), null, JSON.stringify(s));
  assert.equal(lhsText(makeEq({ form: "mul", a: 3, b: 21, letter: "x" })), "3x");
  assert.equal(lhsText(makeEq({ form: "div", a: 4, b: 9, letter: "x" })), "x ÷ 4");
});

test("stages: both pans always hold the same total, and end on the solution", () => {
  for (const e of GOOD) {
    const st = stages(e);
    for (const phase of ["start", "mid", "end"]) {
      const s = st[phase];
      assert.equal(s.L.length, POOL);
      assert.equal(s.R.length, POOL);
      assert.equal(total(s.L), total(s.R), `${eqText(e)} ${phase} balances`);
    }
    assert.equal(total(st.start.L), e.b, `${eqText(e)} starts at the right side's value`);
    assert.equal(total(st.end.L), solve(e.form, e.a, e.b), `${eqText(e)} ends at the solution`);
    assert.equal(st.end.top.R, String(e.x));
  }
});

test("stages: the top labels and the ladder state the same step", () => {
  const e = makeEq({ form: "add", a: 23, b: 58, letter: "n" });
  const st = stages(e);
  assert.deepEqual(st.start.top, { L: "n + 23", R: "58" });
  assert.deepEqual(st.mid.top, { L: "n + 23 − 23", R: "58 − 23" });
  assert.deepEqual(st.end.top, { L: "n", R: "35" });
  const d = makeEq({ form: "div", a: 4, b: 9, letter: "x" });
  assert.deepEqual(stages(d).mid.top, { L: "x ÷ 4 × 4", R: "9 × 4" });
  assert.equal(checkText(d), "36 ÷ 4 = 9");
});

test("scaleFor: the largest content fills one pan and every piece is readable", () => {
  for (const e of GOOD.filter((q) => scaleFor(q) * Math.min(q.a, q.b, q.x) >= 30)) {
    const widest = Math.max(
      ...["start", "mid", "end"].flatMap((p) =>
        ["L", "R"].map((s) => total(stages(e)[p][s]) * scaleFor(e)),
      ),
    );
    assert.ok(widest <= PAN_PX + 1e-9, `${eqText(e)} fits one pan`);
  }
});

test("opChoices: one correct move, three real mistakes, every wrong move has a cue", () => {
  for (const e of GOOD) {
    const opts = opChoices(e);
    assert.equal(opts.length, 4);
    assert.equal(opts.filter((o) => o.correct).length, 1);
    assert.equal(new Set(opts.map((o) => o.label.en)).size, 4);
    const ok = opts.find((o) => o.correct);
    const expected = {
      add: `Subtract ${e.a} from both sides`,
      sub: `Add ${e.a} to both sides`,
      mul: `Divide both sides by ${e.a}`,
      div: `Multiply both sides by ${e.a}`,
    }[e.form];
    assert.equal(ok.label.en, expected);
    assert.equal(opts.filter((o) => o.tilt).length, 1, "exactly one move changes one side only");
    for (const o of opts.filter((x) => !x.correct)) {
      assert.ok(o.cue.en.length > 20 && o.cue.es.length > 20);
      assert.ok(
        !o.cue.en.includes(`${e.L} = ${e.x}`),
        `${eqText(e)}: a cue may not state the solution`,
      );
    }
  }
  // The correct choice is not always first.
  const slots = new Set(
    GOOD.map((e) => opChoices(e).findIndex((o) => o.correct)),
  );
  assert.ok(slots.size >= 3, `correct slot varies (${[...slots]})`);
});

test("opChoices: the 'move it over' mistakes really fail when substituted", () => {
  const add = makeEq({ form: "add", a: 23, b: 58, letter: "n" });
  const moved = opChoices(add).find((o) => o.id === "move");
  assert.equal(58 + 23 + 23 === 58, false); // n = 81 would need 81 + 23 = 58
  assert.match(moved.cue.en, /n = 81/);
  assert.match(moved.cue.en, /81 \+ 23 = 104/);
  const sub = makeEq({ form: "sub", a: 4, b: 9, letter: "x" });
  const m2 = opChoices(sub).find((o) => o.id === "move");
  assert.match(m2.cue.en, /x = 5/);
  assert.match(m2.cue.en, /5 − 4 = 1, not 9/);
  const mul = makeEq({ form: "mul", a: 3, b: 21, letter: "x" });
  assert.match(opChoices(mul).find((o) => o.id === "same").cue.en, /9x = 63/);
  assert.match(opChoices(mul).find((o) => o.id === "move").cue.en, /3x − 3 = 18/);
});

test("resultChoices: exactly the solution is right; every wrong value fails when substituted", () => {
  for (const e of GOOD) {
    const opts = resultChoices(e);
    assert.equal(opts.length, 4);
    assert.equal(opts.filter((o) => o.correct).length, 1);
    assert.equal(Number(opts.find((o) => o.correct).text), solve(e.form, e.a, e.b));
    for (const o of opts.filter((x) => !x.correct)) {
      assert.notEqual(lhs(e.form, e.a, Number(o.text)), e.b, `${eqText(e)}: ${o.text} is wrong`);
      assert.ok(o.cue.en.includes(`${e.b}`));
    }
  }
});

test("modelChoices: one model matches the story; the traps do not", () => {
  const e = makeEq({ form: "div", a: 4, b: 85, letter: "t" });
  const opts = modelChoices(e, "<");
  assert.equal(opts.filter((o) => o.correct).length, 1);
  assert.deepEqual(
    opts.map((o) => o.text).sort(),
    ["4t = 85", "t ÷ 4 < 85", "t ÷ 4 = 85", "t − 4 = 85"].sort(),
  );
  assert.equal(opts.find((o) => o.correct).text, "t ÷ 4 = 85");
  // The multiplication trap has a different solution (85/4), the subtraction trap another (89).
  assert.notEqual(85 / 4, 340);
  assert.notEqual(85 + 4, 340);
  assert.ok(opts.find((o) => o.text === "t ÷ 4 < 85").cue.en.includes("one exact amount"));
  assert.ok(!opts.some((o) => !o.correct && o.cue.en.includes("340")));
});

test("contrastChoices: the relation in the story is the only right model", () => {
  const vals = {
    "<": (x, l) => x < l,
    ">": (x, l) => x > l,
    "≤": (x, l) => x <= l,
    "≥": (x, l) => x >= l,
  };
  for (const sym of Object.keys(vals)) {
    const c = { L: "e", sym, limit: 50 };
    const opts = contrastChoices(c);
    assert.equal(opts.length, 4);
    assert.equal(opts.find((o) => o.correct).text, `e ${sym} 50`);
    const wrong = opts.filter((o) => !o.correct).map((o) => o.text);
    assert.equal(new Set(wrong).size, 3);
    assert.ok(wrong.includes("e = 50"));
    // The opposite direction fails the example the story gives.
    const ex = sym === "<" || sym === "≤" ? 30 : 70;
    assert.ok(vals[sym](ex, 50));
    const oppSym = { "<": ">", ">": "<", "≤": "≥", "≥": "≤" }[sym];
    assert.ok(!vals[oppSym](ex, 50));
    // The inclusive trap differs from the story exactly at the limit.
    const inclSym = { "<": "≤", ">": "≥", "≤": "<", "≥": ">" }[sym];
    assert.notEqual(vals[sym](50, 50), vals[inclSym](50, 50));
  }
});

test("tiltFor: sign follows the heavier side and stays on the stage", () => {
  assert.equal(tiltFor(0), 0);
  assert.ok(tiltFor(-7) < 0 && tiltFor(7) > 0);
  assert.ok(Math.abs(tiltFor(1000)) <= 22 && Math.abs(tiltFor(1)) >= 8);
});

test("validateBalanceSolve accepts the lessons' configs and refuses bad ones", () => {
  for (const id of ["8-2", "8-3", "8-7"]) assert.ok(validateBalanceSolve(lesson(id)), id);
  const base = lesson("8-2");
  const bad = [
    null,
    {},
    { ...base, mode: "nope" },
    { ...base, mode: "test" }, // test mode belongs to balance-test
    { ...base, a: 70 }, // piece too narrow
    { ...base, transfer: { form: "add", a: 4, b: 9 } }, // same form twice
    { ...base, transfer: { form: "mul", a: 3, b: 21 } }, // other family
    { ...base, transfer: undefined },
    { ...lesson("8-7"), reason: undefined },
    { ...lesson("8-7"), story: undefined },
    { ...lesson("8-7"), transfer: { ...lesson("8-7").transfer, sym: "=" } },
    { ...lesson("8-7"), transfer: { ...lesson("8-7").transfer, example: 60 } }, // 60 is not < 50
    { ...lesson("8-7"), transfer: { ...lesson("8-7").transfer, example: 50 } },
    { ...lesson("8-7"), transfer: { ...lesson("8-7").transfer, limit: 1 } },
  ];
  for (const c of bad) {
    assert.equal(validateBalanceSolve(c), null, JSON.stringify(c)?.slice(0, 120));
    assert.equal(buildBalanceSolvePlay(c), null);
  }
});

test("the lessons' scenes: shape, gates and the numbers each one states", () => {
  const p2 = buildBalanceSolvePlay(lesson("8-2"));
  assert.deepEqual(
    p2.scenes.map((s) => [s.id, !!s.gate]),
    [
      ["situate", false],
      ["predict", true],
      ["move", true],
      ["symbols", false],
      ["transfer", false],
    ],
  );
  assert.match(p2.printSummary.en, /n \+ 23 − 23 = 58 − 23, so n = 35/);
  assert.match(p2.printSummary.en, /x − 4 \+ 4 = 9 \+ 4, so x = 13/);
  const p3 = buildBalanceSolvePlay(lesson("8-3"));
  assert.match(p3.printSummary.en, /3x ÷ 3 = 21 ÷ 3, so x = 7/);
  assert.match(p3.printSummary.es, /x ÷ 4 × 4 = 9 × 4, así que x = 36/);
  const p7 = buildBalanceSolvePlay(lesson("8-7"));
  assert.deepEqual(
    p7.scenes.map((s) => s.id),
    ["situate", "write", "move", "check", "transfer"],
  );
  assert.match(p7.printSummary.en, /t ÷ 4 = 85, so t = 340/);
  assert.match(p7.printSummary.en, /e < 50/);
  for (const p of [p2, p3, p7]) {
    assert.doesNotMatch(p.title.en, /\d/, "titles never give away a number");
    assert.ok(p.scenes.length >= 5 && p.scenes.every((s) => p.setup && s.label.es));
  }
});

test("copy: Spanish has no English left, titles hide the answer", () => {
  const english = /\b(the|which|and|your|both|choose|check|move|scale|only)\b/i;
  const walk = (o, path, out) => {
    if (o && typeof o === "object" && typeof o.en === "string") {
      assert.ok(o.es && o.es !== o.en, `${path} has a Spanish line`);
      assert.doesNotMatch(o.es, english, `${path}: ${o.es}`);
    } else if (typeof o === "function") return;
    else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) walk(v, `${path}.${k}`, out);
  };
  for (const id of ["8-2", "8-3", "8-7"]) {
    const v = validateBalanceSolve(lesson(id));
    const T = balanceCopy(v);
    walk(T, id, []);
    for (const e of [v.eq]) {
      for (const o of opChoices(e)) {
        assert.doesNotMatch(o.label.es, english, o.label.es);
        if (o.cue) assert.doesNotMatch(o.cue.es, english, o.cue.es);
      }
      for (const o of resultChoices(e).filter((x) => !x.correct)) assert.doesNotMatch(o.cue.es, english);
    }
  }
});

test("balance-solve.js re-exports the model's validator", () => {
  assert.equal(reexported, validateBalanceSolve);
});
