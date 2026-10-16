// Balance Builder puzzles: the four levels' generators, the unique-whole-answer
// validator (checked against brute force, not against itself), the difficulty
// rating, and the short share code a student sends to a friend.
import assert from "node:assert/strict";
import test from "node:test";
import { eqText } from "./balance-model.js";
import { generate, LEVELS, prng, rate, toEquation, VARIABLES, validatePuzzle } from "./puzzles.js";
import { decodePuzzle, encodePuzzle, normalizeCode } from "./share-code.js";

const spec = (rel, q, l, r, v = 0) => ({ rel, v, q, l: { a: l[0], b: l[1] }, r: { a: r[0], b: r[1] } });

/** Independent oracle: whole numbers that satisfy the sentence, found by trying them all. */
function wholeSolutions(s, lo = -300, hi = 300) {
  const out = [];
  for (let x = lo; x <= hi; x += 1) {
    const left = s.l.a * x + s.l.b * s.q;
    const right = s.r.a * x + s.r.b * s.q;
    const ok =
      s.rel === "="
        ? left === right
        : s.rel === "<"
          ? left < right
          : s.rel === ">"
            ? left > right
            : s.rel === "≤"
              ? left <= right
              : left >= right;
    if (ok) out.push(x);
  }
  return out;
}

test("every built-in puzzle has exactly one whole-number answer (brute force agrees)", () => {
  for (const { id } of LEVELS) {
    for (let i = 0; i < 150; i += 1) {
      const s = generate(id, i);
      const verdict = validatePuzzle(s);
      assert.ok(verdict.ok, `level ${id} #${i}: ${verdict.errors}`);
      if (s.rel === "=") {
        assert.deepEqual(wholeSolutions(s), [verdict.answer], `level ${id} #${i} ${eqText(toEquation(s), "x")}`);
      } else {
        const found = wholeSolutions(s, 0, 300);
        const boundary = verdict.answer;
        assert.ok(found.length > 0, "an inequality has solutions");
        const edge = wholeSolutions({ ...s, rel: "=" });
        assert.deepEqual(edge, [boundary], "the boundary is a whole number");
      }
    }
  }
});

test("levels teach what they say: one-step, two-step, both sides, tilt", () => {
  for (let i = 0; i < 100; i += 1) {
    const one = generate(1, i);
    assert.equal(rate(one).moves, 1);
    assert.equal(one.rel, "=");
    assert.ok(one.l.a === 0 || one.r.a === 0);
    assert.equal(rate(generate(2, i)).moves, 2);
    const both = generate(3, i);
    assert.ok(both.l.a > 0 && both.r.a > 0, "variables on both sides");
    assert.ok(rate(both).features.includes("bothSides"));
    const tilt = generate(4, i);
    assert.notEqual(tilt.rel, "=");
    assert.equal(rate(tilt).moves, 1);
  }
});

test("all four inequality symbols and all four one-step forms appear", () => {
  const rels = new Set();
  const forms = new Set();
  for (let i = 0; i < 40; i += 1) {
    rels.add(generate(4, i).rel);
    const s = generate(1, i);
    forms.add(`${s.q > 1 ? "div" : s.l.a > 1 ? "mul" : s.l.b < 0 ? "sub" : "add"}`);
  }
  assert.equal(rels.size, 4);
  assert.deepEqual([...forms].sort(), ["add", "div", "mul", "sub"]);
});

test("puzzle N of a level never changes, and the first twelve are all different", () => {
  for (const { id } of LEVELS) {
    const seen = new Set();
    for (let i = 0; i < 12; i += 1) {
      assert.deepEqual(generate(id, i), generate(id, i));
      seen.add(JSON.stringify(generate(id, i)));
    }
    assert.equal(seen.size, 12, `level ${id} repeats a puzzle early`);
  }
});

test("the validator refuses what has no single whole-number answer, with a reason", () => {
  const why = (s) => validatePuzzle(s).errors;
  assert.deepEqual(why(spec("=", 1, [2, 3], [2, 9])), ["sameCoefficient"]);
  assert.deepEqual(why(spec("=", 1, [0, 3], [0, 9])), ["noVariable"]);
  assert.deepEqual(why(spec("=", 1, [3, 0], [0, 10])), ["noWholeAnswer"]);
  assert.deepEqual(why(spec("=", 1, [1, 5], [0, 2])), ["negativeAnswer"]);
  assert.deepEqual(why(spec("=", 1, [1, 0], [0, 5])), ["alreadySolved"]);
  assert.deepEqual(why(spec("=", 1, [0, 5], [1, 0])), ["alreadySolved"]);
  assert.deepEqual(why(spec(">", 1, [0, 10], [1, 3])), ["tiltDirection"]);
  assert.deepEqual(why(spec("=", 1, [13, 0], [0, 10])), ["range"]);
  assert.deepEqual(why(spec("=", 1, [1, 100], [0, 5])), ["range"]);
  assert.deepEqual(why(spec("=", 13, [1, 0], [0, 5])), ["range"]);
  assert.deepEqual(why(spec("=", 1, [1, 0.5], [0, 5])), ["range"]);
  assert.deepEqual(why(spec("~", 1, [1, 2], [0, 5])), ["range"]);
  assert.deepEqual(why(spec("=", 1, [1, 2], [0, 5], 9)), ["range"]);
  assert.deepEqual(why(null), ["shape"]);
  assert.deepEqual(why({ rel: "=" }), ["shape"]);
  assert.deepEqual(why(spec("=", 1, [1, 0], [0, 5], "x")), ["range"]);
});

test("validator and brute force agree on 6000 random specs", () => {
  const g = prng(2026);
  let accepted = 0;
  for (let n = 0; n < 6000; n += 1) {
    const s = spec(
      g.pick(["=", "=", "=", "<", ">", "≤", "≥"]),
      g.int(1, 12),
      [g.int(0, 12), g.int(-99, 99)],
      [g.int(0, 12), g.int(-99, 99)],
      g.int(0, 5),
    );
    const answers = wholeSolutions({ ...s, rel: "=" });
    const solved =
      (s.l.a === s.q && s.l.b === 0 && s.r.a === 0) || (s.r.a === s.q && s.r.b === 0 && s.l.a === 0);
    const expected =
      s.l.a + s.r.a > 0 &&
      s.l.a !== s.r.a &&
      answers.length === 1 &&
      answers[0] >= 0 &&
      answers[0] <= 99 &&
      !solved &&
      (s.rel === "=" || s.l.a > s.r.a);
    assert.equal(validatePuzzle(s).ok, expected, JSON.stringify(s));
    if (expected) accepted += 1;
  }
  assert.ok(accepted > 150, `only ${accepted} specs were accepted, the sample is too thin`);
});

test("difficulty rating separates one-step, two-step and both-sides puzzles", () => {
  assert.equal(rate(spec("=", 1, [1, 4], [0, 9])).tier, "easy");
  assert.equal(rate(spec("=", 1, [3, 2], [0, 14])).tier, "medium");
  assert.equal(rate(spec("=", 1, [3, 2], [1, 10])).tier, "hard");
  assert.equal(rate(spec(">", 1, [1, 4], [0, 9])).tier, "medium");
  assert.ok(rate(spec("=", 1, [3, 2], [1, 10])).score > rate(spec("=", 1, [3, 2], [0, 14])).score);
  assert.deepEqual(rate(spec("=", 1, [3, 2], [1, 10])).features, ["bothSides"]);
});

// ── share codes ────────────────────────────────────────────────────────────
test("a code round-trips every built-in puzzle and 1000 random valid ones", () => {
  const specs = LEVELS.flatMap(({ id }) => Array.from({ length: 100 }, (_, i) => generate(id, i)));
  const g = prng(7);
  while (specs.length < 1400) {
    const s = spec(g.pick(["=", "<", ">", "≤", "≥"]), g.int(1, 12), [g.int(0, 12), g.int(-99, 99)], [g.int(0, 12), g.int(-99, 99)], g.int(0, 5));
    if (validatePuzzle(s).ok) specs.push(s);
  }
  for (const s of specs) {
    const code = encodePuzzle(s);
    assert.match(code, /^[0-9A-HJKMNP-TV-Z]{3}-[0-9A-HJKMNP-TV-Z]{3}-[0-9A-HJKMNP-TV-Z]{3}$/);
    assert.deepEqual(decodePuzzle(code), { ok: true, spec: s });
  }
});

test("codes survive lower case, spaces, missing hyphens and look-alike letters", () => {
  const code = encodePuzzle(generate(3, 4));
  const sloppy = code.toLowerCase().replaceAll("-", " ").replace("0", "o").replace("1", "l");
  assert.equal(normalizeCode(sloppy), code.replaceAll("-", ""));
  assert.equal(decodePuzzle(` ${code.toLowerCase()} `).ok, true);
  assert.equal(decodePuzzle(code.replaceAll("-", "")).ok, true);
});

test("any single mistyped character is caught before it becomes a different puzzle", () => {
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  for (const original of [generate(1, 0), generate(3, 5), generate(4, 2)]) {
    const flat = encodePuzzle(original).replaceAll("-", "");
    for (let at = 0; at < flat.length; at += 1) {
      for (const ch of alphabet) {
        if (ch === flat[at]) continue;
        const bad = decodePuzzle(flat.slice(0, at) + ch + flat.slice(at + 1));
        assert.equal(bad.ok, false, `position ${at} -> ${ch}`);
      }
    }
  }
});

test("a code that is the wrong length, has other characters, or encodes a bad puzzle is refused", () => {
  assert.equal(decodePuzzle("").reason, "length");
  assert.equal(decodePuzzle("ABC-DEF").reason, "length");
  assert.equal(decodePuzzle("ABC-DEF-GH!").reason, "chars");
  assert.equal(decodePuzzle("<script>").reason, "length");
  assert.throws(() => encodePuzzle(spec("=", 1, [2, 3], [2, 9])), /not valid/);
  assert.throws(() => encodePuzzle(null), /not valid/);
});

test("decoding random strings never throws and only accepts puzzles the validator accepts", () => {
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const g = prng(99);
  let accepted = 0;
  for (let n = 0; n < 20000; n += 1) {
    const text = Array.from({ length: 9 }, () => alphabet[g.int(0, 31)]).join("");
    const out = decodePuzzle(text);
    if (out.ok) {
      accepted += 1;
      assert.ok(validatePuzzle(out.spec).ok);
      assert.equal(normalizeCode(encodePuzzle(out.spec)), text, "codes are canonical");
    }
  }
  assert.ok(accepted >= 0);
});

test("a shared puzzle carries numbers and a variable letter, never text", () => {
  const s = generate(2, 3);
  const keys = JSON.stringify(Object.keys(s).sort());
  assert.equal(keys, JSON.stringify(["l", "q", "r", "rel", "v"]));
  assert.ok(VARIABLES.includes(VARIABLES[s.v]));
  const back = decodePuzzle(encodePuzzle(s)).spec;
  assert.equal(typeof back.rel, "string");
  assert.ok(["=", "<", ">", "≤", "≥"].includes(back.rel));
  for (const n of [back.v, back.q, back.l.a, back.l.b, back.r.a, back.r.b]) {
    assert.ok(Number.isInteger(n));
  }
});
