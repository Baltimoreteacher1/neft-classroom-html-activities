// Power Up! (lesson 6-4 arcade): the order-of-operations engine and the generator.
// Every generated expression is solved by the game's stepper AND by an independent
// precedence-climbing evaluator; the two must agree, every intermediate value must be a whole
// number, and each stage's plan (operation, exponent and parenthesis counts) must hold.
import assert from "node:assert/strict";
import { crystalCards, glitchPuzzle } from "../math/games/u6-power-up-arcade/bonus.js";
import {
  allowedOps,
  apply,
  LP,
  nextRank,
  num,
  op,
  RP,
  reduceAt,
  solve,
} from "../math/games/u6-power-up-arcade/expr.js";
import { makeWorld, WORLDS } from "../math/games/u6-power-up-arcade/gen.js";

const T = (...x) => x;
const N = num;
const O = op;

/** Independent evaluator: precedence climbing over the token list. */
function evaluate(tokens) {
  let p = 0;
  const atom = () => {
    const t = tokens[p++];
    if (t.k === "n") return t.v;
    assert.equal(t.k, "(");
    const v = sum();
    assert.equal(tokens[p++].k, ")");
    return v;
  };
  const pow = () => {
    const b = atom();
    if (tokens[p]?.v === "^") {
      p++;
      return b ** atom();
    }
    return b;
  };
  const prod = () => {
    let v = pow();
    while (tokens[p]?.v === "*" || tokens[p]?.v === "/")
      v = tokens[p++].v === "*" ? v * pow() : v / pow();
    return v;
  };
  const sum = () => {
    let v = prod();
    while (tokens[p]?.v === "+" || tokens[p]?.v === "-")
      v = tokens[p++].v === "+" ? v + prod() : v - prod();
    return v;
  };
  return sum();
}

// ── allowedOps: the rules of the order of operations ─────────────────────────
const at = (t) => allowedOps(t).map((i) => t[i].v);
assert.deepEqual(at(T(N(2), O("+"), N(3), O("*"), N(4))), ["*"], "multiply before add");
assert.deepEqual(at(T(N(2), O("+"), N(3), O("^"), N(2))), ["^"], "exponent before add");
assert.deepEqual(at(T(N(2), O("*"), N(3), O("^"), N(2))), ["^"], "exponent before multiply");
assert.deepEqual(at(T(N(8), O("/"), N(4), O("*"), N(2))), ["/"], "left to right across × ÷");
assert.deepEqual(at(T(N(9), O("-"), N(3), O("+"), N(1))), ["-"], "left to right across + −");
assert.deepEqual(
  at(T(N(2), O("*"), N(3), O("+"), N(4), O("*"), N(5))).length,
  2,
  "independent products",
);
assert.deepEqual(
  at(T(N(2), O("*"), LP, N(3), O("+"), N(4), RP, O("^"), N(2))),
  ["+"],
  "parentheses before everything",
);
assert.equal(nextRank(T(N(2), O("*"), LP, N(3), O("+"), N(4), RP)), "paren");
assert.equal(nextRank(T(N(2), O("+"), N(3), O("^"), N(2))), 3);
// A power whose base is still a group is not available until the group is done.
const grouped = T(LP, N(1), O("+"), N(2), RP, O("^"), N(2));
assert.deepEqual(allowedOps(grouped), [2]);
const collapsed = reduceAt(grouped, 2, 3);
assert.deepEqual(
  collapsed.map((x) => x.v ?? x.k),
  [3, "^", 2],
  "parentheses drop around a lone number",
);
assert.equal(apply("-", 2, 5), null);
assert.equal(apply("/", 7, 2), null);
assert.equal(apply("^", 3, 4), 81);
assert.equal(solve(T(N(2), O("+"), N(3), O("^"), N(2), O("*"), N(2))).final, 20);

// ── generator ────────────────────────────────────────────────────────────────
const SEEDS = 120;
let generated = 0;
for (const level of ["regular", "challenging"]) {
  assert.equal(WORLDS[level].length, 3, `${level}: three worlds`);
  assert.equal(WORLDS[level][0].mode, "steps", `${level}: World 1 is the step-by-step warm-up`);
  assert.ok(
    WORLDS[level].slice(1).every((w) => w.mode === "full"),
    `${level}: later worlds are full problems`,
  );
  const problems = WORLDS[level].flatMap((w) => w.battles.flat()).length;
  assert.ok(
    problems >= 25,
    `${level}: ${problems} problems is too short for a 20-30 minute campaign`,
  );
  for (let w = 0; w < 3; w++) {
    assert.equal(WORLDS[level][w].battles.length, 5, `${level} world ${w + 1}: five battles`);
    for (let seed = 1; seed <= SEEDS; seed++) {
      const world = makeWorld(level, w, seed);
      const keys = world.flat().map((e) => e.tokens.map((x) => x.v ?? x.k).join(""));
      assert.equal(new Set(keys).size, keys.length, "no repeats in a world");
      world.forEach((battle, b) =>
        battle.forEach((e, k) => {
          const plan = WORLDS[level][w].battles[b][k];
          const label = `${level} W${w + 1} seed ${seed} battle ${b + 1}.${k + 1}`;
          const ops = e.tokens.filter((x) => x.k === "o");
          const pows = ops.filter((x) => x.v === "^").length;
          const parens = e.tokens.filter((x) => x.k === "(").length;
          assert.equal(ops.length, plan.ops, `${label}: operation count`);
          assert.ok(pows >= plan.pow[0] && pows <= plan.pow[1], `${label}: exponent count ${pows}`);
          assert.ok(
            parens >= plan.paren[0] && parens <= plan.paren[1],
            `${label}: parentheses ${parens}`,
          );
          assert.equal(
            e.answer,
            evaluate(e.tokens),
            `${label}: stepper disagrees with the independent evaluator`,
          );
          assert.ok(Number.isInteger(e.answer) && e.answer >= 0, `${label}: whole-number answer`);
          for (const s of e.steps) {
            assert.ok(Number.isInteger(s.v) && s.v >= 0, `${label}: whole intermediate`);
            const trivial =
              ((s.o === "*" || s.o === "/" || s.o === "^") && (s.a <= 1 || s.b <= 1)) ||
              (s.o === "/" && s.a === s.b);
            assert.ok(!trivial, `${label}: trivial step ${s.a}${s.o}${s.b}`);
          }
          generated++;
        }),
      );
    }
  }
}
assert.deepEqual(
  makeWorld("challenging", 2, 9)
    .flat()
    .map((e) => e.answer),
  makeWorld("challenging", 2, 9)
    .flat()
    .map((e) => e.answer),
  "deterministic for a seed",
);

// ── bonus rounds ─────────────────────────────────────────────────────────────
let glitches = 0;
for (const level of ["regular", "challenging"]) {
  for (let seed = 1; seed <= 150; seed++) {
    const cards = crystalCards(level, seed);
    assert.equal(cards.length, 3, `${level} seed ${seed}: three crystal cards`);
    for (const c of cards) {
      assert.ok(c.answer >= 0 && c.answer < c.choices.length, "answer index in range");
      assert.equal(
        new Set(c.choices).size,
        c.choices.length,
        `distinct choices: ${c.prompt} ${c.choices}`,
      );
      assert.ok(c.why.length > 10);
    }
    const g = glitchPuzzle(level, seed);
    assert.ok(
      g.wrong >= 1 && g.wrong < g.lines.length,
      "glitched line is a worked line, not the problem",
    );
    const last = Number(g.lines.at(-1).replace(/,/g, ""));
    assert.ok(
      Number.isInteger(last) && last !== g.answer,
      `${level} seed ${seed}: the glitch must change the answer`,
    );
    glitches++;
  }
}
// The crystal answer keys, recomputed: "What is b^e?" must key b^e.
const SUPS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
for (let seed = 1; seed <= 300; seed++)
  for (const c of crystalCards("challenging", seed)) {
    const m = c.prompt.match(/^What is (\d+)([⁰-⁹¹²³]+)\?$/u);
    if (!m) continue;
    const e = Number([...m[2]].map((ch) => SUPS.indexOf(ch)).join(""));
    assert.equal(Number(c.choices[c.answer].replace(/,/g, "")), Number(m[1]) ** e, c.prompt);
  }
console.log(
  `power-up-arcade: ${generated} expressions verified, ${glitches} glitch puzzles and crystal decks checked`,
);
