// Whole-number addition and subtraction (13 skills, Kindergarten to Grade 4): compute, missing-number,
// number-line and visual-model here; stories, equations, multi-step and explanations in fam-whole-addsub-more.js.
//
// Level structure (structure, not bigger numbers):
//   compute          1 picture-supported, no regrouping  2 one regroup  3 grade-level  4 regroup in two places or
//                    across a zero  5 three terms, two operations
//   missing-number   1-3 the unknown is an addend/subtrahend (then a regroup)  4-5 both sides are expressions
//   number-line      1 jump right  2 jump left  3 which point  4 two jumps  5 find the start
//   visual-model     1 ones blocks  2 one regroup  3 grade-level  4 regroup twice (blocks show the problem's tens/ones)
import { bi, chance, int, pick } from "./kit.js";
import { EXTRA_TYPES } from "./fam-whole-addsub-more.js";
import { numberLine, placeValue } from "./models.js";
import { Q } from "./rational.js";
import { SPECS, drawPair, expr, nearTen, result, slips, small, stem, stepsFor } from "./whole-core.js";

const WANT = [null, "none", "one", "any", "many"];
const pickOp = (rng, spec) => pick(rng, spec.ops);
const columns = (n) =>
  String(n)
    .split("")
    .map((d, i, all) => ({ unit: Q(10 ** (all.length - 1 - i)), count: Number(d) }))
    .filter((c) => c.count > 0);

function lineFor(a, op, b, spec) {
  const step = small(spec) ? 1 : nearTen(spec) ? 10 : 100;
  return numberLine(Q(0), Q(spec.top), Q(step), [{ value: Q(a), label: "start" }], "", [{ from: Q(a), by: Q(op === "add" ? b : -b) }]);
}

function compute({ rng, level, spec }) {
  const op = pickOp(rng, spec);
  if (level === 5) return threeTerm(rng, spec);
  const zeros = level === 4 && op === "sub" && spec.top >= 100 ? (a) => /0/.test(String(a).slice(1)) : undefined;
  let pair;
  try {
    pair = drawPair(rng, spec, op, WANT[level], zeros);
  } catch {
    pair = drawPair(rng, spec, op, WANT[level]);
  }
  const [a, b] = pair;
  const c = result(op, a, b);
  const model = level === 1 ? (spec.top <= 100 ? lineFor(a, op, b, spec) : placeValue(columns(a))) : null;
  return {
    q: bi(stem(a, op, b)),
    form: "int",
    answer: Q(c),
    bare: stem(a, op, b),
    check: [{ kind: "expr", expr: expr(a, op, b), role: "answer" }],
    wrong: slips(op, a, b, c),
    steps: stepsFor(op, a, b, c),
    model,
  };
}

// (a + b) - c, or (a - b) - c for subtraction-only skills: two operations, one parenthesis.
function threeTerm(rng, spec) {
  const addFirst = spec.ops.includes("add") && (!spec.ops.includes("sub") || chance(rng, 0.6));
  for (let i = 0; i < 200; i += 1) {
    const [a, b] = drawPair(rng, spec, addFirst ? "add" : "sub", "any");
    const x = addFirst ? a + b : a - b;
    if (x < 3) continue;
    const c = int(rng, spec.lo, Math.min(spec.hi, x - 1));
    if (c < 1 || c >= x) continue;
    const r = x - c;
    const sym = addFirst ? "+" : "−";
    const text = `(${a.toLocaleString("en-US")} ${sym} ${b.toLocaleString("en-US")}) − ${c.toLocaleString("en-US")} = ?`;
    return {
      q: bi(text),
      form: "int",
      answer: Q(r),
      bare: text,
      check: [{ kind: "expr", expr: `(${a}${addFirst ? "+" : "-"}${b})-${c}`, role: "answer" }],
      wrong: [
        { v: Q(x), why: "stopped after the first operation" },
        { v: Q(x + c), why: "added the last number instead of subtracting" },
        { v: Q(Math.abs(a - (b - c))), why: "ignored the parentheses and regrouped the numbers" },
        { v: Q(r + 1), why: "counted one too few" },
      ],
      steps: [`Work inside the parentheses first: ${a.toLocaleString("en-US")} ${sym} ${b.toLocaleString("en-US")}.`, `Then take away ${c.toLocaleString("en-US")} from that number.`, `${text.replace("?", r.toLocaleString("en-US"))}`],
    };
  }
  throw new Error("no three-term numbers");
}

function missingNumber({ rng, level, spec }) {
  const op = pickOp(rng, spec);
  const fmt = (n) => n.toLocaleString("en-US");
  const make = (text, es, lhs, rhs, answer, wrong, steps) => ({
    q: bi(`${text}. What belongs in the box?`, `${es}. ¿Qué número va en el recuadro?`),
    form: "int",
    answer: Q(answer),
    check: [{ kind: "solve", var: "x", lhs, rhs, role: "answer" }],
    wrong: wrong.filter((w) => w.v.n >= 0 && w.v.n !== answer),
    steps,
  });
  if (level <= 3) {
    const [a, b] = drawPair(rng, spec, op, WANT[level]);
    const c = result(op, a, b);
    const flipped = level === 2;
    if (op === "add") {
      const text = flipped ? `□ + ${fmt(b)} = ${fmt(c)}` : `${fmt(a)} + □ = ${fmt(c)}`;
      const known = flipped ? b : a;
      const answer = flipped ? a : b;
      return make(text, text, flipped ? `x+${b}` : `${a}+x`, String(c), answer, [
        { v: Q(c), why: "copied the total instead of finding the missing part" },
        { v: Q(c + known), why: "added instead of subtracting" },
        { v: Q(answer + 1), why: "counted one too few" },
      ], [`The parts and the total go together: ${fmt(known)} plus the box makes ${fmt(c)}.`, `Take ${fmt(known)} away from ${fmt(c)} to find the box.`, `The box is ${fmt(answer)}, because ${fmt(known)} + ${fmt(answer)} = ${fmt(c)}.`]);
    }
    const text = flipped ? `□ − ${fmt(b)} = ${fmt(c)}` : `${fmt(a)} − □ = ${fmt(c)}`;
    const answer = flipped ? a : b;
    return make(text, text, flipped ? `x-${b}` : `${a}-x`, String(c), answer, flipped
      ? [{ v: Q(c - b), why: "subtracted again instead of adding back" }, { v: Q(c), why: "copied the difference" }, { v: Q(a + 1), why: "counted one too many" }]
      : [{ v: Q(a + c), why: "added instead of subtracting" }, { v: Q(c), why: "copied the difference" }, { v: Q(b + 1), why: "counted one too many" }],
      flipped
        ? [`Subtraction undone is addition: the box minus ${fmt(b)} leaves ${fmt(c)}.`, `Add ${fmt(b)} back to ${fmt(c)}.`, `The box is ${fmt(a)}, because ${fmt(a)} − ${fmt(b)} = ${fmt(c)}.`]
        : [`Start with ${fmt(a)}. Taking away the box leaves ${fmt(c)}.`, `Find how much was taken: ${fmt(a)} − ${fmt(c)}.`, `The box is ${fmt(b)}, because ${fmt(a)} − ${fmt(b)} = ${fmt(c)}.`]);
  }
  // Levels 4-5: an equation with an expression on each side (the equal sign means "the same as").
  for (let i = 0; i < 200; i += 1) {
    const [a, b] = drawPair(rng, spec, op, "any");
    const total = result(op, a, b);
    const d = int(rng, spec.lo, Math.min(spec.hi, total));
    if (level === 4) {
      const answer = op === "add" ? total - d : total + d;
      if (answer > spec.top || answer < 1 || d >= total + 1) continue;
      const sym = op === "add" ? "+" : "−";
      const text = op === "add" ? `${fmt(a)} + ${fmt(b)} = □ + ${fmt(d)}` : `${fmt(a)} − ${fmt(b)} = □ − ${fmt(d)}`;
      return make(text, text, op === "add" ? `${a}+${b}` : `${a}-${b}`, op === "add" ? `x+${d}` : `x-${d}`, answer, [
        { v: Q(total), why: "wrote the total instead of balancing both sides" },
        { v: Q(op === "add" ? total + d : total - d), why: "used the wrong operation to balance the sides" },
        { v: Q(answer + 1), why: "counted one too few" },
      ], [`Both sides must have the same value. Work out the left side first: ${fmt(a)} ${sym} ${fmt(b)}.`, `The right side, □ ${sym} ${fmt(d)}, must make that same value.`, `The box is ${fmt(answer)}.`]);
    }
    const answer = op === "add" ? b + d - a : a - b + d;
    if (answer < 1 || answer > spec.top || d >= b + 1) continue;
    const text = op === "add" ? `${fmt(a)} + □ = ${fmt(b)} + ${fmt(d)}` : `${fmt(a)} − □ = ${fmt(b)} − ${fmt(d)}`;
    if (op === "sub" && b - d < 0) continue;
    return make(text, text, op === "add" ? `${a}+x` : `${a}-x`, op === "add" ? `${b}+${d}` : `${b}-${d}`, answer, [
      { v: Q(b + d), why: "wrote the right-side total as the box" },
      { v: Q(answer + 1), why: "counted one too few" },
      { v: Q(Math.abs(a - b)), why: "compared only the first numbers on each side" },
    ], [`Find the value of the side with no box: ${fmt(b)} ${op === "add" ? "+" : "−"} ${fmt(d)}.`, `Now find what goes in the box so the other side has the same value.`, `The box is ${fmt(answer)}.`]);
  }
  throw new Error("no balance numbers");
}

function numberLineType({ rng, level, spec }) {
  const op = pickOp(rng, spec);
  const f = (n) => n.toLocaleString("en-US");
  const step = small(spec) ? 1 : 10;
  const line = (points, jumps) => numberLine(Q(0), Q(spec.top), Q(step), points.map((p) => ({ value: Q(p[0]), label: p[1] })), "", jumps.map(([from, by]) => ({ from: Q(from), by: Q(by) })));
  if (level <= 2) {
    const dir = level === 1 ? "add" : "sub";
    const [a, b] = drawPair(rng, spec, dir, level === 1 ? "none" : "any");
    const c = result(dir, a, b);
    const word = dir === "add" ? "right" : "left";
    return {
      q: bi(`Start at ${f(a)} on the number line. Jump ${f(b)} to the ${word}. What number do you land on?`, `Empieza en ${f(a)} en la recta numérica. Salta ${f(b)} hacia la ${dir === "add" ? "derecha" : "izquierda"}. ¿En qué número caes?`),
      form: "int",
      answer: Q(c),
      check: [{ kind: "expr", expr: expr(a, dir, b), role: "answer" }],
      wrong: slips(dir, a, b, c),
      steps: [`Find ${f(a)} on the number line.`, `A jump to the ${word} ${dir === "add" ? "adds" : "subtracts"}. Jump ${f(b)}.`, `${f(a)} ${dir === "add" ? "+" : "−"} ${f(b)} = ${f(c)}.`],
      model: line([[a, "start"]], [[a, dir === "add" ? b : -b]]),
    };
  }
  if (level === 3) {
    const dir = pick(rng, spec.ops);
    const [a, b] = drawPair(rng, spec, dir, "any");
    const c = result(dir, a, b);
    const word = dir === "add" ? "right" : "left";
    const pool = [
      { v: a, why: "stayed at the start and did not jump" },
      { v: dir === "add" ? a - b : a + b, why: "jumped the wrong way" },
      { v: c + 1, why: "jumped one too far" },
      { v: c - 1, why: "jumped one too short" },
      { v: b, why: "started the jump at zero" },
    ].filter((p, i, all) => p.v >= 0 && p.v <= spec.top && p.v !== c && all.findIndex((o) => o.v === p.v) === i);
    if (pool.length < 3) throw new Error("not enough distinct points");
    const picked = pool.slice(0, 3);
    const marks = [{ v: c, key: true }, ...picked].sort((x, y) => x.v - y.v);
    const letters = new Map(marks.map((m, i) => [m, "ABCD"[i]]));
    const keyMark = marks.find((m) => m.key);
    const model = numberLine(Q(0), Q(spec.top), Q(step), [{ value: Q(c), label: letters.get(keyMark) }, ...marks.filter((m) => !m.key).map((m) => ({ value: Q(m.v), label: letters.get(m) })), { value: Q(a), label: "start" }]);
    return {
      q: bi(`A frog starts at ${f(a)} and jumps ${f(b)} to the ${word}. Which point shows where it lands?`, `Una rana empieza en ${f(a)} y salta ${f(b)} hacia la ${dir === "add" ? "derecha" : "izquierda"}. ¿Qué punto muestra dónde cae?`),
      form: "choice",
      answer: letters.get(keyMark),
      options: marks.filter((m) => !m.key).map((m) => ({ text: letters.get(m), why: picked.find((p) => p.v === m.v).why })),
      check: [{ kind: "expr", expr: expr(a, dir, b), role: "answer", value: String(c), map: { [String(c)]: letters.get(keyMark) } }, ...marks.map((m) => ({ kind: "expr", expr: String(m.v), value: String(m.v) }))],
      meta: { points: marks.map((m) => ({ label: letters.get(m), value: m.v })) },
      steps: [`Find ${f(a)} on the number line.`, `A jump to the ${word} ${dir === "add" ? "adds" : "subtracts"}. Jump ${f(b)}.`, `${f(a)} ${dir === "add" ? "+" : "−"} ${f(b)} = ${f(c)}. Find that point.`],
      model,
    };
  }
  if (level === 4) {
    for (let i = 0; i < 200; i += 1) {
      const [a, b] = drawPair(rng, spec, "add", "any");
      const x = a + b;
      const c = int(rng, spec.lo, Math.min(spec.hi, x - 1));
      if (c < 1) continue;
      const r = x - c;
      return {
        q: bi(`A frog starts at ${f(a)} on the number line. It jumps ${f(b)} to the right, then ${f(c)} to the left. Where does it stop?`, `Una rana empieza en ${f(a)} en la recta numérica. Salta ${f(b)} hacia la derecha y luego ${f(c)} hacia la izquierda. ¿Dónde se detiene?`),
        form: "int",
        answer: Q(r),
        check: [{ kind: "expr", expr: `${a}+${b}-${c}`, role: "answer" }],
        wrong: [{ v: Q(x), why: "forgot the jump to the left" }, { v: Q(x + c), why: "jumped right both times" }, { v: Q(r + 1), why: "counted one too few" }],
        steps: [`Find ${f(a)} on the number line.`, `Right jumps add and left jumps subtract.`, `${f(a)} + ${f(b)} − ${f(c)} = ${f(r)}.`],
        model: line([[a, "start"]], [[a, b], [x, -c]]),
      };
    }
  }
  if (level === 5) {
    const dir = spec.ops.includes("add") && (!spec.ops.includes("sub") || chance(rng, 0.5)) ? "add" : "sub";
    const [a, b] = drawPair(rng, spec, dir, "any");
    const c = result(dir, a, b);
    return {
      q: bi(`A frog jumped ${f(b)} to the ${dir === "add" ? "right" : "left"} and landed on ${f(c)}. Where did it start?`, `Una rana saltó ${f(b)} hacia la ${dir === "add" ? "derecha" : "izquierda"} y cayó en ${f(c)}. ¿Dónde empezó?`),
      form: "int",
      answer: Q(a),
      check: [{ kind: "solve", var: "x", lhs: dir === "add" ? `x+${b}` : `x-${b}`, rhs: String(c), role: "answer" }],
      wrong: [{ v: Q(dir === "add" ? c + b : c - b), why: "jumped the same way again instead of undoing the jump" }, { v: Q(b), why: "gave the jump length" }, { v: Q(a + 1), why: "counted one too many" }],
      steps: [`The frog ended on ${f(c)} after one jump of ${f(b)}.`, `Undo the jump: go ${dir === "add" ? "left" : "right"} ${f(b)} from ${f(c)}.`, `The frog started at ${f(a)}.`],
      model: line([[c, "landed"]], [[c, dir === "add" ? -b : b]]),
    };
  }
  throw new Error("number-line level");
}

// Blocks: the picture holds the problem's quantities (two groups pushed together, or one group with some taken away).
function visualModel({ rng, level, spec }) {
  const op = pickOp(rng, spec);
  const [a, b] = drawPair(rng, spec, op, WANT[level]);
  const c = result(op, a, b);
  const f = (n) => n.toLocaleString("en-US");
  const unitsOf = (n) => String(n).split("").map((d, i, all) => ({ unit: Q(10 ** (all.length - 1 - i)), count: Number(d) }));
  if (op === "add") {
    const [A, B] = [unitsOf(a), unitsOf(b)];
    const merged = new Map();
    for (const col of [...A, ...B]) merged.set(col.unit.n, (merged.get(col.unit.n) || 0) + col.count);
    const cols = [...merged].sort((x, y) => y[0] - x[0]).filter(([, count]) => count > 0).map(([unit, count]) => ({ unit: Q(unit), count }));
    const ones = small(spec);
    const model = ones ? placeValue([{ unit: Q(1), count: a, group: "first" }, { unit: Q(1), count: b, group: "second" }]) : placeValue(cols);
    return {
      q: bi(ones ? `The picture shows ${f(a)} blocks and ${f(b)} more blocks. How many blocks are there in all?` : `The blocks for ${f(a)} and ${f(b)} are pushed together, with no trading yet. What is ${f(a)} + ${f(b)}?`, ones ? `La imagen muestra ${f(a)} bloques y ${f(b)} bloques más. ¿Cuántos bloques hay en total?` : `Los bloques de ${f(a)} y de ${f(b)} se juntan, sin cambiar todavía. ¿Cuánto es ${f(a)} + ${f(b)}?`),
      form: "int",
      answer: Q(c),
      check: [{ kind: "expr", expr: expr(a, op, b), role: "answer" }],
      wrong: slips(op, a, b, c),
      steps: ones ? [`Count the first group of blocks.`, `Count the second group, then join the groups.`, `${f(a)} + ${f(b)} = ${f(c)}.`] : stepsFor(op, a, b, c),
      model,
    };
  }
  return {
    q: bi(`The blocks show ${f(a)}. Take away ${f(b)}. How many are left?`, `Los bloques muestran ${f(a)}. Quita ${f(b)}. ¿Cuántos quedan?`),
    form: "int",
    answer: Q(c),
    check: [{ kind: "expr", expr: expr(a, op, b), role: "answer" }],
    wrong: slips(op, a, b, c),
    steps: stepsFor(op, a, b, c),
    model: small(spec) ? placeValue([{ unit: Q(1), count: a }], "", Q(b)) : placeValue(unitsOf(a).filter((col) => col.count > 0), "", Q(b)),
  };
}

export const family = {
  id: "whole-addsub",
  skills: SPECS,
  types: { compute, "missing-number": missingNumber, "number-line": numberLineType, "visual-model": visualModel, ...EXTRA_TYPES },
  range: { "visual-model": [1, 4], "number-line": [1, 5], "multi-step": [2, 5], "real-world": [2, 5], equation: [2, 5], "word-problem": [1, 3] },
  supports: { "number-line": (spec) => spec.top <= 100, "word-problem": (spec) => spec.top <= 9999, "visual-model": (spec) => spec.top <= 1000 },
};
