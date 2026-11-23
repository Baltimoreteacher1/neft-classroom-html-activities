// Inequalities: solutions, graphs on a number line (as descriptions a student can choose), words to symbols, solving.
// `rel` on a block is the inequality written in plain ASCII ("x+3>10"); the tests check every keyed option against it.

import { choice, errorItem, multi, number, numberline, sg } from "./kit.js";

const SHOW = { ">": ">", "<": "<", ">=": "≥", "<=": "≤" };
const SYMS = [">", "<", ">=", "<="];
const holds = (sym, a, b) => ({ ">": a > b, "<": a < b, ">=": a >= b, "<=": a <= b })[sym];
const flip = (sym) => ({ ">": "<", "<": ">", ">=": "<=", "<=": ">=" })[sym];
const strict = (sym) => sym === ">" || sym === "<";
const right = (sym) => sym === ">" || sym === ">=";
const nonZero = (rng, lo, hi) => (rng.chance() ? -rng.int(lo, hi) : rng.int(lo, hi));

/** An inequality with a positive coefficient: boundary t, display, ASCII relation, and the sign. */
function problem(rng, grade, level, { kinds } = {}) {
  const sym = rng.pick(SYMS);
  const list = kinds || (level === 1 ? ["add", "sub"] : level === 2 ? ["add", "sub", "mul", "div"] : grade === 7 ? ["two", "mul", "div"] : ["mul", "div", "add"]);
  const kind = rng.pick(list);
  const t = grade === 7 && level >= 2 ? nonZero(rng, 1, 12) : rng.int(1, 14);
  const a = rng.int(2, 9);
  const s = sym;
  let b;
  let c;
  let display;
  let rel;
  if (kind === "add") {
    b = t + a;
    display = `x + ${a} ${SHOW[s]} ${sg(b)}`;
    rel = `x+${a}${s}${b < 0 ? `(${b})` : b}`;
  } else if (kind === "sub") {
    b = t - a;
    display = `x − ${a} ${SHOW[s]} ${sg(b)}`;
    rel = `x-${a}${s}${b < 0 ? `(${b})` : b}`;
  } else if (kind === "mul") {
    b = a * t;
    display = `${a}x ${SHOW[s]} ${sg(b)}`;
    rel = `${a}*x${s}${b < 0 ? `(${b})` : b}`;
  } else if (kind === "div") {
    const k = rng.int(2, 4);
    const q = grade === 7 && level >= 2 ? nonZero(rng, 1, 9) : rng.int(1, 9);
    display = `x ÷ ${k} ${SHOW[s]} ${sg(q)}`;
    rel = `x/${k}${s}${q < 0 ? `(${q})` : q}`;
    return { kind, sym: s, t: k * q, a: k, b: q, display, rel, sat: (v) => holds(s, v, k * q), expr: `${q < 0 ? `(${q})` : q}*${k}` };
  } else {
    c = a * t + rng.int(1, 9);
    const bb = c - a * t;
    display = `${a}x + ${bb} ${SHOW[s]} ${sg(c)}`;
    rel = `${a}*x+${bb}${s}${c < 0 ? `(${c})` : c}`;
    return { kind, sym: s, t, a, b: c, c: bb, display, rel, sat: (v) => holds(s, v, t), expr: `(${c < 0 ? `(${c})` : c}-${bb})/${a}` };
  }
  const expr = { add: `${b < 0 ? `(${b})` : b}-${a}`, sub: `${b < 0 ? `(${b})` : b}+${a}`, mul: `${b < 0 ? `(${b})` : b}/${a}` }[kind];
  return { kind, sym: s, t, a, b, display, rel, sat: (v) => holds(s, v, t), expr };
}

const inequalities = [
  {
    id: "which-value",
    make({ rng, grade, level }) {
      const p = problem(rng, grade, level);
      const { t, sym } = p;
      const dir = right(sym) ? 1 : -1;
      const gap = rng.int(strict(sym) ? 1 : 0, 4);
      const v = t + dir * gap;
      const candidates = [
        [t, "The boundary number is a solution only for ≥ or ≤."],
        [t - dir, "That number is on the wrong side of the boundary."],
        [t - dir * 2, "That number is on the wrong side of the boundary."],
        [t - dir * 3, "That number is on the wrong side of the boundary."],
        [p.b, "Using the number from the right side without solving."],
      ];
      const wrong = candidates.filter(([n]) => !p.sat(n)).map(([n, why]) => ({ text: sg(n), why }));
      return choice(rng, {
        prompt: `Which value is a solution of ${p.display}?`,
        answer: sg(v),
        expr: String(v),
        rel: p.rel,
        wrong,
        hint: "Try each value in the inequality. Does it make the statement true?",
        explanation: `Solving gives x ${SHOW[sym]} ${sg(t)}. ${v === t ? `${sg(v)} is the boundary, and ${SHOW[sym]} includes it, so ${sg(v)} works.` : `${sg(v)} is on the solution side, so ${sg(v)} works.`}`,
        misconception: "Students think the boundary number is always a solution, or pick a number on the wrong side.",
      });
    },
  },
  {
    id: "select-all",
    make({ rng, grade, level }) {
      const p = problem(rng, grade, level);
      const { t, sym } = p;
      const start = t - 2 - rng.int(0, 1);
      const values = [0, 1, 2, 3, 4].map((i) => start + i);
      const good = values.filter(p.sat);
      if (good.length < 1 || good.length > 4) return null;
      return multi(rng, {
        prompt: `Select all the values that are solutions of ${p.display}.`,
        options: values.map(sg),
        answers: good.map(sg),
        rel: p.rel,
        hint: "Test each number in the inequality.",
        explanation: `Solving gives x ${SHOW[sym]} ${sg(t)}. The solutions here are ${good.map(sg).join(", ")}.`,
        misconception: "Leaving out the boundary number for ≥ and ≤, or including it for > and <.",
      });
    },
  },
  {
    id: "words-to-symbols",
    make({ rng, level }) {
      const n = rng.int(level === 1 ? 5 : 10, level === 3 ? 90 : 60);
      const ctx = rng.pick([
        { s: ">=", v: "h", text: `A ride sign says: "You must be at least ${n} inches tall."`, q: "Which inequality shows the heights h that can ride?" },
        { s: "<=", v: "p", text: `A bus holds at most ${n} people.`, q: "Which inequality shows the number of people p on the bus?" },
        { s: ">", v: "s", text: `You need more than ${n} points to win.`, q: "Which inequality shows the points s that win?" },
        { s: "<", v: "c", text: `There are fewer than ${n} chairs in the room.`, q: "Which inequality shows the number of chairs c?" },
        { s: "<=", v: "w", text: `A bag can hold no more than ${n} pounds.`, q: "Which inequality shows the weight w in the bag?" },
        { s: ">=", v: "a", text: `A club needs no less than ${n} members.`, q: "Which inequality shows the number of members a?" },
      ]);
      const opt = (s) => `${ctx.v} ${SHOW[s]} ${n}`;
      const why = {
        ">": "Using > when the words include equal to.",
        ">=": "Using ≥ when the words do not include equal to.",
        "<": "Using < when the words include equal to.",
        "<=": "Using ≤ when the words do not include equal to.",
      };
      return choice(rng, {
        prompt: `${ctx.text} ${ctx.q}`,
        answer: opt(ctx.s),
        wrong: SYMS.filter((s) => s !== ctx.s).map((s) => ({
          text: opt(s),
          why: s === flip(ctx.s) ? "Using the symbol that points the wrong way." : why[s],
        })),
        hint: "Is the number allowed? Which way does the amount go?",
        explanation: `${opt(ctx.s)} matches the words. ${strict(ctx.s) ? "The number itself is not included." : "The number itself is included."}`,
        misconception: "Mixing up at least / at most, or forgetting whether the number itself is included.",
      });
    },
  },
  {
    id: "graph-description",
    make({ rng, grade }) {
      const n = grade === 7 ? nonZero(rng, 1, 12) : rng.int(1, 14);
      const sym = rng.pick(SYMS);
      const desc = (o, d) => `${o ? "Open" : "Closed"} circle at ${sg(n)}, arrow pointing ${d}`;
      const answer = desc(strict(sym), right(sym) ? "right" : "left");
      return choice(rng, {
        prompt: `Which description shows the graph of x ${SHOW[sym]} ${sg(n)} on a number line?`,
        answer,
        wrong: [
          { text: desc(!strict(sym), right(sym) ? "right" : "left"), why: strict(sym) ? "A closed circle means the number is included, but the symbol does not include it." : "An open circle means the number is not included, but the symbol includes it." },
          { text: desc(strict(sym), right(sym) ? "left" : "right"), why: "The arrow points the wrong way." },
          { text: desc(!strict(sym), right(sym) ? "left" : "right"), why: "Both the circle and the arrow are wrong." },
        ],
        hint: "Open circle: the number is not included. The arrow points to the numbers that work.",
        explanation: `x ${SHOW[sym]} ${sg(n)}: ${strict(sym) ? "the number is not included, so the circle is open" : "the number is included, so the circle is closed"}, and the arrow points ${right(sym) ? "right to bigger" : "left to smaller"} numbers.`,
        misconception: "Mixing up open and closed circles, or the direction of the arrow.",
      });
    },
  },
  {
    id: "graph-to-inequality",
    make({ rng, grade }) {
      const n = grade === 7 ? nonZero(rng, 1, 12) : rng.int(1, 14);
      const sym = rng.pick(SYMS);
      const opt = (s) => `x ${SHOW[s]} ${sg(n)}`;
      return choice(rng, {
        prompt: `A number line has ${strict(sym) ? "an open" : "a closed"} circle at ${sg(n)}. The arrow points to the ${right(sym) ? "right" : "left"}. Which inequality does the graph show?`,
        answer: opt(sym),
        wrong: SYMS.filter((s) => s !== sym).map((s) => ({
          text: opt(s),
          why: s === flip(sym) ? "The arrow points the other way." : right(s) === right(sym) ? "The circle shows whether the number is included." : "Both the circle and the arrow are different.",
        })),
        hint: "Which numbers does the arrow cover? Is the circle number included?",
        explanation: `${opt(sym)}: the arrow covers ${right(sym) ? "greater" : "smaller"} numbers and the ${strict(sym) ? "open" : "closed"} circle means ${sg(n)} is ${strict(sym) ? "not " : ""}included.`,
        misconception: "Reading the arrow direction backwards.",
      });
    },
  },
  {
    id: "boundary",
    make({ rng, grade, level }) {
      const p = problem(rng, grade, level);
      return number({
        prompt: `Solve ${p.display}. The answer looks like x ${SHOW[p.sym]} ___. What number goes in the blank?`,
        answer: String(p.t),
        expr: p.expr,
        hint: "Solve it like an equation. Use the opposite operation on both sides.",
        explanation: `Solving ${p.display} gives x ${SHOW[p.sym]} ${sg(p.t)}. The blank is ${sg(p.t)}.`,
        misconception: "Using the same operation as the inequality instead of the opposite one.",
      });
    },
  },
  {
    id: "boundary-on-line",
    make({ rng, grade, level }) {
      const p = problem(rng, grade, level);
      return numberline({
        prompt: `Solve ${p.display}. Click the number where the circle goes on the number line.`,
        min: -50,
        max: 50,
        answer: String(p.t),
        expr: p.expr,
        hint: "The circle goes on the boundary number you find when you solve.",
        explanation: `Solving ${p.display} gives x ${SHOW[p.sym]} ${sg(p.t)}. The circle goes at ${sg(p.t)}.`,
        misconception: "Putting the circle at the number on the right side of the inequality.",
      });
    },
  },
  {
    id: "find-the-mistake",
    make({ rng, grade, level }) {
      const p = problem(rng, grade, Math.min(level, 2), { kinds: ["add", "sub"] });
      const { a, b, t, sym } = p;
      const add = p.kind === "add";
      const wrongT = add ? b + a : b - a;
      const kind = rng.pick(["inverse", "slip"]);
      const slip = rng.pick([1, -1, 2]);
      const inv = add ? `Subtract ${a} from both sides` : `Add ${a} to both sides`;
      const wrongInv = add ? `Add ${a} to both sides` : `Subtract ${a} from both sides`;
      const s = SHOW[sym];
      return errorItem(rng, {
        prompt: `Omar solves ${p.display}. One step has a mistake. Find the step and choose the fix.`,
        steps:
          kind === "inverse"
            ? [p.display, `${wrongInv}: x ${s} ${sg(b)} ${add ? "+" : "−"} ${a}`, `Calculate: x ${s} ${sg(wrongT)}`]
            : [p.display, `${inv}: x ${s} ${sg(b)} ${add ? "−" : "+"} ${a}`, `Calculate: x ${s} ${sg(t + slip)}`],
        errorIndex: kind === "inverse" ? 1 : 2,
        expr: p.expr,
        fixRight: `${inv}: ${sg(b)} ${add ? "−" : "+"} ${a} = ${sg(t)}, so x ${s} ${sg(t)}.`,
        fixWrong: [
          { text: `${wrongInv}: ${sg(b)} ${add ? "+" : "−"} ${a} = ${sg(wrongT)}, so x ${s} ${sg(wrongT)}.`, why: "Using the same operation as the inequality." },
          { text: `Use the number on the right: ${sg(b)} = ${sg(b)}, so x ${s} ${sg(b)}.`, why: "Not solving at all." },
          { text: `Swap the numbers: ${a} − ${sg(b)} = ${sg(a - b)}, so x ${s} ${sg(a - b)}.`, why: "Subtracting in the wrong order." },
          { text: `Multiply: ${sg(b)} × ${a} = ${sg(b * a)}, so x ${s} ${sg(b * a)}.`, why: "Multiplying instead of using the opposite operation." },
        ],
        hint: "Use the opposite operation to get x alone.",
        explanation: `${inv}: ${sg(b)} ${add ? "−" : "+"} ${a} = ${sg(t)}, so x ${s} ${sg(t)}.`,
        misconception: kind === "inverse" ? "Using the same operation as the inequality." : "A calculation slip in the last step.",
      });
    },
  },
  {
    id: "flip-the-sign",
    grades: [7],
    levels: [2, 3],
    make({ rng }) {
      const sym = rng.pick(SYMS);
      const a = rng.int(2, 9);
      const t = nonZero(rng, 1, 12);
      const b = -a * t;
      const f = flip(sym);
      const opt = (s, v) => `x ${SHOW[s]} ${sg(v)}`;
      return choice(rng, {
        prompt: `Solve −${a}x ${SHOW[sym]} ${sg(b)}. Which answer is correct?`,
        answer: opt(f, t),
        rel: `-${a}*x${sym}${b < 0 ? `(${b})` : b}`,
        wrong: [
          { text: opt(sym, t), why: "Not flipping the inequality sign when dividing by a negative number." },
          { text: opt(f, -t), why: "Using the wrong sign for the number." },
          { text: opt(sym, -t), why: "Using the wrong sign for the number and not flipping the sign." },
        ],
        hint: "When you multiply or divide both sides by a negative number, flip the inequality sign.",
        explanation: `Divide both sides by −${a}: ${sg(b)} ÷ (−${a}) = ${sg(t)}. Dividing by a negative flips the sign, so x ${SHOW[f]} ${sg(t)}.`,
        misconception: "Forgetting to flip the sign when dividing by a negative number.",
      });
    },
  },
];

export const INEQUALITY_TEMPLATES = { inequalities };
