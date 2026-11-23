// Equation topics: one-step and two-step equations. The solution is chosen first and the equation is built from it,
// so the key never has to be solved backwards.

import {
  NAMES,
  R,
  choice,
  dec,
  errorItem,
  fillTable,
  number,
  numberline,
  order,
  sg,
} from "./kit.js";

const abs = Math.abs;
const nonZero = (rng, lo, hi) => (rng.chance() ? -rng.int(lo, hi) : rng.int(lo, hi));
const VARS = ["x", "n", "y", "m"];

// ── one-step equations ──────────────────────────────────────────────────────

/** Integers scaled by s (1, or 10 for tenths): { type, A, B, C, X, s } with the equation and its solution X. */
function oneStep(rng, grade, level, { plain = false } = {}) {
  const type = rng.pick(["add", "sub", "mul", "div"]);
  const tenths = !plain && grade === 6 && level === 3 && (type === "add" || type === "sub");
  const s = tenths ? 10 : 1;
  const top = level === 1 ? 12 : level === 2 ? 40 : 60;
  const signed = grade === 7 && level >= 2 && !plain;
  const tenth = () => {
    for (;;) {
      const k = rng.int(11, 99);
      if (k % 10) return k;
    }
  };
  const whole = (lo, hi) => (tenths ? tenth() : rng.int(lo, hi));
  const pickX = (lo, hi) => (signed ? nonZero(rng, lo, hi) : whole(lo, hi));
  let A = 0;
  let B = 0;
  let C = 0;
  let X = 0;
  if (type === "add" || type === "sub") {
    A = whole(2, top);
    X = pickX(2, top);
    B = type === "add" ? X + A : X - A;
  } else if (type === "mul") {
    C = grade === 7 && level === 3 && !plain && rng.chance() ? -rng.int(2, 9) : rng.int(2, 12);
    X = signed ? nonZero(2, 12) : rng.int(2, 12);
    B = C * X;
  } else {
    A = rng.int(2, 12);
    B = signed ? nonZero(2, 12) : rng.int(2, 12);
    X = A * B;
  }
  if (B === 0 || X === 0) return oneStep(rng, grade, level, { plain });
  return { type, A, B, C, X, s };
}

function oneStepView(p, v) {
  const num = (k) => dec(R(k, p.s));
  const shown = (k) => num(k).replace("-", "−");
  const ex = (k) => (k < 0 ? `(${num(k)})` : num(k));
  const par = (k) => (k < 0 ? `(${shown(k)})` : shown(k));
  const { type, A, B, C, X } = p;
  const eq = {
    add: `${v} + ${shown(A)} = ${shown(B)}`,
    sub: `${v} − ${shown(A)} = ${shown(B)}`,
    mul: `${shown(C)}${v} = ${shown(B)}`,
    div: `${v} ÷ ${shown(A)} = ${shown(B)}`,
  }[type];
  const truth = {
    add: `${ex(B)}-${ex(A)}`,
    sub: `${ex(B)}+${ex(A)}`,
    mul: `${ex(B)}/${ex(C)}`,
    div: `${ex(B)}*${ex(A)}`,
  }[type];
  const inverse = {
    add: `Subtract ${shown(A)} from both sides`,
    sub: `Add ${shown(A)} to both sides`,
    mul: `Divide both sides by ${shown(C)}`,
    div: `Multiply both sides by ${shown(A)}`,
  }[type];
  const calc = {
    add: `${shown(B)} − ${shown(A)}`,
    sub: `${shown(B)} + ${shown(A)}`,
    mul: `${shown(B)} ÷ ${par(C)}`,
    div: `${shown(B)} × ${shown(A)}`,
  }[type];
  const check = {
    add: `${shown(X)} + ${shown(A)} = ${shown(B)}`,
    sub: `${par(X)} − ${shown(A)} = ${shown(B)}`,
    mul: `${shown(C)} × ${par(X)} = ${shown(B)}`,
    div: `${shown(X)} ÷ ${shown(A)} = ${shown(B)}`,
  }[type];
  // the wrong inverse operation, and what it gives
  const wrongCalc = {
    add: [`${shown(B)} + ${shown(A)}`, B + A],
    sub: [`${shown(B)} − ${shown(A)}`, B - A],
    mul: [`${shown(B)} × ${par(C)}`, B * C],
    div: [`${shown(B)} ÷ ${shown(A)}`, null],
  }[type];
  return { num, shown, ex, par, eq, truth, inverse, calc, check, wrongCalc, answer: num(X) };
}

const STORIES = {
  add: (A, B, n) => `${n} had some stickers. Then ${n} got ${A} more. Now ${n} has ${B} stickers.`,
  sub: (A, B, n) => `${n} had some apples. ${n} gave away ${A} of them. Now ${n} has ${B} apples.`,
  mul: (C, B) => `A box holds ${C} pencils. There are ${B} pencils in all, in full boxes.`,
  div: (A, B, n) =>
    `${n} shared some cards equally among ${A} friends. Each friend got ${B} cards.`,
};

const oneStepEquations = [
  {
    id: "solve",
    make({ rng, grade, level }) {
      const p = oneStep(rng, grade, level);
      const v = rng.pick(VARS);
      const view = oneStepView(p, v);
      const [, wrongValue] = view.wrongCalc;
      return number({
        prompt: `Solve for ${v}: ${view.eq}`,
        answer: view.answer,
        expr: view.truth,
        hint: "Use the opposite operation on both sides to get the letter alone.",
        explanation: `${view.inverse}: ${view.calc} = ${view.shown(p.X)}. So ${v} = ${view.shown(p.X)}. Check: ${view.check}.`,
        misconception:
          wrongValue === null
            ? "Using the same operation as the equation instead of the opposite one."
            : `Using the same operation as the equation instead of the opposite one (${view.wrongCalc[0]} = ${view.shown(wrongValue)}).`,
      });
    },
  },
  {
    id: "story",
    levels: [1, 2],
    make({ rng, grade, level }) {
      const p = oneStep(rng, grade, level, { plain: true });
      if (p.B < 0 || p.X < 0 || p.C < 0) return null;
      const view = oneStepView(p, "x");
      const name = rng.pick(NAMES);
      const story = STORIES[p.type](p.type === "mul" ? p.C : p.A, p.B, name);
      const q = {
        add: `How many stickers did ${name} have at first?`,
        sub: `How many apples did ${name} have at first?`,
        mul: "How many boxes are there?",
        div: `How many cards did ${name} start with?`,
      }[p.type];
      return number({
        prompt: `${story} ${q}`,
        answer: view.answer,
        expr: view.truth,
        hint: "Write an equation for the story. Use a letter for the number you do not know.",
        explanation: `The equation is ${view.eq}. ${view.inverse}: ${view.calc} = ${view.shown(p.X)}.`,
        misconception: "Choosing the wrong operation because of a key word in the story.",
      });
    },
  },
  {
    id: "which-equation",
    levels: [1, 2],
    make({ rng, grade, level }) {
      const p = oneStep(rng, grade, level, { plain: true });
      if (p.B < 0 || p.X < 0 || p.C < 0) return null;
      const v = rng.pick(["x", "n"]);
      const name = rng.pick(NAMES);
      const A = p.type === "mul" ? p.C : p.A;
      const eqs = {
        add: `${v} + ${A} = ${p.B}`,
        sub: `${v} − ${A} = ${p.B}`,
        mul: `${A}${v} = ${p.B}`,
        div: `${v} ÷ ${A} = ${p.B}`,
      };
      const sols = { add: p.B - A, sub: p.B + A, mul: p.B / A, div: p.B * A };
      if (new Set(Object.values(sols)).size !== 4) return null;
      const why = {
        add: "Using addition for a story about getting more.",
        sub: "Using subtraction for a story about giving away.",
        mul: "Using multiplication for a story about equal groups.",
        div: "Using division for a story about sharing.",
      };
      const story = STORIES[p.type](A, p.B, name);
      const unknown = {
        add: "the number of stickers at first",
        sub: "the number of apples at first",
        mul: "the number of boxes",
        div: "the number of cards at first",
      }[p.type];
      return choice(rng, {
        prompt: `${story} Let ${v} be ${unknown}. Which equation matches the story?`,
        answer: eqs[p.type],
        expr: String(sols[p.type]),
        wrong: Object.keys(eqs)
          .filter((t) => t !== p.type)
          .map((t) => ({ text: eqs[t], why: why[t] })),
        hint: "Is the unknown number being added, taken away, put in groups, or shared?",
        explanation: `${eqs[p.type]} matches the story. Solving it gives ${v} = ${sols[p.type]}.`,
        misconception: "Choosing the operation from a key word instead of from the story.",
      });
    },
  },
  {
    id: "find-the-mistake",
    make({ rng, grade, level }) {
      const p = oneStep(rng, grade, level);
      const v = rng.pick(VARS);
      const view = oneStepView(p, v);
      const { shown, num } = view;
      const [wrongText, wrongValue] = view.wrongCalc;
      const slipKind = wrongValue === null || rng.chance(0.4) ? "slip" : "inverse";
      const slip = rng.pick([1, -1, 2, -2]) * p.s;
      const wrongInverse = {
        add: `Add ${shown(p.A)} to both sides`,
        sub: `Subtract ${shown(p.A)} from both sides`,
        mul: `Multiply both sides by ${shown(p.C)}`,
        div: `Divide both sides by ${shown(p.A)}`,
      }[p.type];
      const steps =
        slipKind === "inverse"
          ? [
              view.eq,
              `${wrongInverse}: ${v} = ${wrongText}`,
              `Calculate: ${v} = ${shown(wrongValue)}`,
            ]
          : [
              view.eq,
              `${view.inverse}: ${v} = ${view.calc}`,
              `Calculate: ${v} = ${shown(p.X + slip)}`,
            ];
      const fixWrong = [
        {
          text: `${wrongInverse}: ${wrongText} = ${wrongValue === null ? "?" : shown(wrongValue)}.`,
          why: "Using the same operation as the equation.",
        },
        {
          text: `Swap the numbers: ${shown(p.A || p.C)} − ${shown(p.B)} = ${shown((p.A || p.C) - p.B)}.`,
          why: "Subtracting in the wrong order.",
        },
        {
          text: `Add the numbers: ${shown(p.B)} + ${shown(p.A || p.C)} = ${shown(p.B + (p.A || p.C))}.`,
          why: "Adding both numbers.",
        },
        {
          text: `Multiply the numbers: ${shown(p.B)} × ${shown(p.A || p.C)} = ${shown(p.B * (p.A || p.C))}.`,
          why: "Multiplying both numbers.",
        },
      ].filter((f) => !f.text.includes("?") && !(p.s !== 1 && /×/.test(f.text)));
      if (p.type === "mul" && p.C < 0) return null;
      void num;
      return errorItem(rng, {
        prompt: `Sam solves ${view.eq}. One step has a mistake. Find the step and choose the fix.`,
        steps,
        errorIndex: slipKind === "inverse" ? 1 : 2,
        expr: view.truth,
        fixRight: `${view.inverse}: ${view.calc} = ${shown(p.X)}.`,
        fixWrong,
        hint: "Use the opposite operation. Then check the answer in the equation.",
        explanation: `${view.inverse}: ${view.calc} = ${shown(p.X)}. Check: ${view.check}.`,
        misconception:
          slipKind === "inverse"
            ? "Using the same operation instead of the opposite one."
            : "A calculation slip in the last step.",
      });
    },
  },
  {
    id: "steps",
    make({ rng, grade, level }) {
      const p = oneStep(rng, grade, level);
      const v = rng.pick(VARS);
      const view = oneStepView(p, v);
      return order({
        prompt: `Put the steps in order to solve ${view.eq}.`,
        items: [
          `Write the equation: ${view.eq}`,
          `${view.inverse}: ${v} = ${view.shown(p.X)}`,
          `Check: ${view.check}`,
        ],
        expr: view.truth,
        hint: "Get the letter alone first. Check your answer last.",
        explanation: `${view.inverse}: ${view.calc} = ${view.shown(p.X)}. Check: ${view.check}.`,
        misconception: "Checking before solving, or skipping the check.",
      });
    },
  },
];

// ── two-step equations ──────────────────────────────────────────────────────

/** One of five shapes with the solution X chosen first. All of a, b are positive; X and c may be negative (grade 7). */
function twoStep(rng, grade, level) {
  const signed = grade === 7 && level >= 2;
  const shapes =
    level === 1
      ? ["lin+", "lin-"]
      : level === 2
        ? ["lin+", "lin-", "div+", "div-"]
        : ["lin+", "lin-", "div+", "div-", "paren"];
  const shape = rng.pick(shapes);
  const a = rng.int(2, level === 1 ? 5 : 9);
  const b = rng.int(1, level === 1 ? 9 : 15);
  const pickX = (lo, hi) => (signed ? nonZero(rng, lo, hi) : rng.int(lo, hi));
  let X;
  let c;
  if (shape === "lin+") [X, c] = ((x) => [x, a * x + b])(pickX(1, 12));
  else if (shape === "lin-") [X, c] = ((x) => [x, a * x - b])(pickX(1, 12));
  else if (shape === "div+") {
    const k = pickX(1, 9);
    [X, c] = [a * k, k + b];
  } else if (shape === "div-") {
    const k = pickX(1, 9);
    [X, c] = [a * k, k - b];
  } else {
    const x = pickX(1, 10);
    [X, c] = [x, a * (x + b)];
  }
  if (c === 0 || X === 0) return twoStep(rng, grade, level);
  return { shape, a, b, c, X };
}

const S = sg;
const P = (n) => (n < 0 ? `(${sg(n)})` : String(n));
const ex = (n) => (n < 0 ? `(${n})` : String(n));

function twoStepView(p, v) {
  const { shape, a, b, c, X } = p;
  const eq = {
    "lin+": `${a}${v} + ${b} = ${S(c)}`,
    "lin-": `${a}${v} − ${b} = ${S(c)}`,
    "div+": `${v} ÷ ${a} + ${b} = ${S(c)}`,
    "div-": `${v} ÷ ${a} − ${b} = ${S(c)}`,
    paren: `${a}(${v} + ${b}) = ${S(c)}`,
  }[shape];
  const truth = {
    "lin+": `(${ex(c)}-${b})/${a}`,
    "lin-": `(${ex(c)}+${b})/${a}`,
    "div+": `(${ex(c)}-${b})*${a}`,
    "div-": `(${ex(c)}+${b})*${a}`,
    paren: `${ex(c)}/${a}-${b}`,
  }[shape];
  const two = {
    "lin+": [
      `Subtract ${b} from both sides: ${a}${v} = ${S(c)} − ${b} = ${S(c - b)}`,
      `Divide both sides by ${a}: ${v} = ${S(c - b)} ÷ ${a} = ${S(X)}`,
    ],
    "lin-": [
      `Add ${b} to both sides: ${a}${v} = ${S(c)} + ${b} = ${S(c + b)}`,
      `Divide both sides by ${a}: ${v} = ${S(c + b)} ÷ ${a} = ${S(X)}`,
    ],
    "div+": [
      `Subtract ${b} from both sides: ${v} ÷ ${a} = ${S(c)} − ${b} = ${S(c - b)}`,
      `Multiply both sides by ${a}: ${v} = ${S(c - b)} × ${a} = ${S(X)}`,
    ],
    "div-": [
      `Add ${b} to both sides: ${v} ÷ ${a} = ${S(c)} + ${b} = ${S(c + b)}`,
      `Multiply both sides by ${a}: ${v} = ${S(c + b)} × ${a} = ${S(X)}`,
    ],
    paren: [
      `Divide both sides by ${a}: ${v} + ${b} = ${S(c)} ÷ ${a} = ${S(c / a)}`,
      `Subtract ${b} from both sides: ${v} = ${S(c / a)} − ${b} = ${S(X)}`,
    ],
  }[shape];
  const check = {
    "lin+": `${a} × ${P(X)} + ${b} = ${S(c)}`,
    "lin-": `${a} × ${P(X)} − ${b} = ${S(c)}`,
    "div+": `${P(X)} ÷ ${a} + ${b} = ${S(c)}`,
    "div-": `${P(X)} ÷ ${a} − ${b} = ${S(c)}`,
    paren: `${a} × (${S(X)} + ${b}) = ${S(c)}`,
  }[shape];
  // each step as an equation line (label: equation), for chains and ordering
  const mid = {
    "lin+": `${a}${v} = ${S(c - b)}`,
    "lin-": `${a}${v} = ${S(c + b)}`,
    "div+": `${v} ÷ ${a} = ${S(c - b)}`,
    "div-": `${v} ÷ ${a} = ${S(c + b)}`,
    paren: `${v} + ${b} = ${S(c / a)}`,
  }[shape];
  const labels = {
    "lin+": [`Subtract ${b} from both sides`, `Divide both sides by ${a}`],
    "lin-": [`Add ${b} to both sides`, `Divide both sides by ${a}`],
    "div+": [`Subtract ${b} from both sides`, `Multiply both sides by ${a}`],
    "div-": [`Add ${b} to both sides`, `Multiply both sides by ${a}`],
    paren: [`Divide both sides by ${a}`, `Subtract ${b} from both sides`],
  }[shape];
  return { eq, truth, two, check, mid, labels };
}

const wrongSolutions = ({ shape, a, b, c, X }) => {
  const list = {
    "lin+": [
      [(c + b) / a, "Adding " + b + " instead of subtracting."],
      [c - b, "Forgetting the last step: dividing by " + a + "."],
      [(c - b) * a, "Multiplying instead of dividing."],
      [c + b, "Adding and forgetting to divide."],
    ],
    "lin-": [
      [(c - b) / a, "Subtracting " + b + " instead of adding."],
      [c + b, "Forgetting the last step: dividing by " + a + "."],
      [(c + b) * a, "Multiplying instead of dividing."],
      [c - b, "Subtracting and forgetting to divide."],
    ],
    "div+": [
      [(c + b) * a, "Adding " + b + " instead of subtracting."],
      [c - b, "Forgetting to multiply by " + a + "."],
      [(c - b) / a, "Dividing instead of multiplying."],
      [c * a - b, "Multiplying first and then subtracting."],
    ],
    "div-": [
      [(c - b) * a, "Subtracting " + b + " instead of adding."],
      [c + b, "Forgetting to multiply by " + a + "."],
      [(c + b) / a, "Dividing instead of multiplying."],
      [c * a + b, "Multiplying first and then adding."],
    ],
    paren: [
      [c / a + b, "Adding " + b + " instead of subtracting."],
      [c - b, "Subtracting " + b + " from " + c + " first."],
      [(c - b) / a, "Dividing only the " + b + "... after subtracting."],
      [c * a - b, "Multiplying instead of dividing."],
    ],
  }[shape];
  return list
    .filter(([v]) => Number.isInteger(v) && v !== X)
    .map(([v, why]) => ({ text: S(v), why }));
};

const twoStepEquations = [
  {
    id: "solve",
    make({ rng, grade, level }) {
      const p = twoStep(rng, grade, level);
      const v = rng.pick(VARS);
      const view = twoStepView(p, v);
      return number({
        prompt: `Solve for ${v}: ${view.eq}`,
        answer: String(p.X),
        expr: view.truth,
        hint: "Undo the adding or subtracting first. Then undo the multiplying or dividing.",
        explanation: `${view.two[0]}. ${view.two[1]}. Check: ${view.check}.`,
        misconception: wrongSolutions(p)[0]?.why ?? "Doing the steps in the wrong order.",
      });
    },
  },
  {
    id: "story",
    levels: [1, 2, 3],
    make({ rng, grade, level }) {
      const a = rng.int(2, level === 1 ? 5 : 9);
      const b = rng.int(5, 30);
      const n = rng.int(2, 12);
      if (grade === 6 && level === 1 && b > 20) return null;
      const c = a * n + b;
      const name = rng.pick(NAMES);
      const ctx = rng.pick([
        {
          prompt: `A gym charges $${b} to join and $${a} for each class. ${name} paid $${c} in all. How many classes did ${name} take?`,
          v: "n",
        },
        {
          prompt: `A taxi ride costs $${b} to start plus $${a} for each mile. The ride cost $${c}. How many miles was the ride?`,
          v: "m",
        },
      ]);
      return number({
        prompt: ctx.prompt,
        answer: String(n),
        expr: `(${c}-${b})/${a}`,
        hint: "Write an equation. The fixed cost is added once. The other cost is multiplied.",
        explanation: `The equation is ${a}${ctx.v} + ${b} = ${c}. Subtract ${b}: ${c} − ${b} = ${c - b}. Divide by ${a}: ${c - b} ÷ ${a} = ${n}.`,
        misconception: `Dividing ${c} by ${a} first and forgetting the starting cost of $${b}.`,
      });
    },
  },
  {
    id: "choose",
    make({ rng, grade, level }) {
      const p = twoStep(rng, grade, level);
      const v = rng.pick(VARS);
      const view = twoStepView(p, v);
      return choice(rng, {
        prompt: `What is the solution of ${view.eq}?`,
        answer: S(p.X),
        expr: String(p.X),
        wrong: wrongSolutions(p),
        hint: "Undo the last operation first.",
        explanation: `${view.two[0]}. ${view.two[1]}. Check: ${view.check}.`,
        misconception:
          "Students do the steps in the wrong order or use the wrong inverse operation.",
      });
    },
  },
  {
    id: "find-the-mistake",
    make({ rng, grade, level }) {
      const p = twoStep(rng, grade, level);
      if (p.shape !== "lin+" && p.shape !== "lin-") return null;
      const v = rng.pick(VARS);
      const view = twoStepView(p, v);
      const { a, b, c, X } = p;
      const add = p.shape === "lin-";
      const mid = add ? c + b : c - b;
      const wrongMid = add ? c - b : c + b;
      const kind = rng.pick(["inverse", "multiply"]);
      const wrongX = kind === "inverse" ? wrongMid / a : mid * a;
      if (kind === "inverse" && !Number.isInteger(wrongX)) return null;
      const steps =
        kind === "inverse"
          ? [
              view.eq,
              `${add ? "Subtract" : "Add"} ${b} ${add ? "from" : "to"} both sides: ${a}${v} = ${S(wrongMid)}`,
              `Divide both sides by ${a}: ${v} = ${S(wrongX)}`,
            ]
          : [
              view.eq,
              view.labels[0] + `: ${view.mid}`,
              `Multiply both sides by ${a}: ${v} = ${S(wrongX)}`,
            ];
      return errorItem(rng, {
        prompt: `Nia solves ${view.eq}. One step has a mistake. Find the step and choose the fix.`,
        steps,
        errorIndex: kind === "inverse" ? 1 : 2,
        expr: view.truth,
        fixRight: `${view.two[0]}. ${view.two[1]}.`,
        fixWrong: [
          {
            text: `${add ? "Subtract" : "Add"} ${b} first: ${a}${v} = ${S(wrongMid)}, so ${v} = ${S(wrongMid)} ÷ ${a} = ${Number.isInteger(wrongMid / a) ? S(wrongMid / a) : dec(R(wrongMid, a))}.`,
            why: "Using the wrong inverse operation in the first step.",
          },
          {
            text: `Multiply by ${a}: ${S(mid)} × ${a} = ${S(mid * a)}.`,
            why: "Multiplying instead of dividing.",
          },
          {
            text: `Stop early: ${a}${v} = ${S(mid)}, so ${v} = ${S(mid)}.`,
            why: `Forgetting to divide by ${a}.`,
          },
          {
            text: `Divide first: ${S(c)} ÷ ${a} = ${Number.isInteger(c / a) ? S(c / a) : dec(R(c, a))}.`,
            why: `Dividing only ${c} by ${a} and ignoring the ${b}.`,
          },
        ].filter((f) => !f.text.includes("NaN")),
        hint: "Check each step. Is each one the opposite operation?",
        explanation: `${view.two[0]}. ${view.two[1]}. Check: ${view.check}.`,
        misconception:
          kind === "inverse"
            ? "Using the wrong inverse operation in the first step."
            : "Multiplying instead of dividing in the last step.",
      });
      void X;
    },
  },
  {
    id: "steps",
    make({ rng, grade, level }) {
      const p = twoStep(rng, grade, level);
      const v = rng.pick(VARS);
      const view = twoStepView(p, v);
      return order({
        prompt: `Put the steps in order to solve ${view.eq}.`,
        items: [
          `Write the equation: ${view.eq}`,
          `${view.labels[0]}: ${view.mid}`,
          `${view.labels[1]}: ${v} = ${S(p.X)}`,
          `Check: ${view.check}`,
        ],
        expr: view.truth,
        hint: "Undo the last operation first. Check your answer last.",
        explanation: `${view.two[0]}. ${view.two[1]}. Check: ${view.check}.`,
        misconception: "Undoing multiplication or division before addition or subtraction.",
      });
    },
  },
  {
    id: "table",
    make({ rng, grade, level }) {
      const p = twoStep(rng, grade, level);
      if (p.shape !== "lin+" && p.shape !== "lin-") return null;
      const v = rng.pick(VARS);
      const view = twoStepView(p, v);
      const { a, b, c, X } = p;
      const start = Math.max(signedStart(grade, X), X - 1);
      const xs = [start, start + 1, start + 2, start + 3];
      if (!xs.includes(X)) xs[3] = X;
      xs.sort((m, n) => m - n);
      const f = (x) => (p.shape === "lin+" ? a * x + b : a * x - b);
      const rows = xs.map((x, r) => (r === 0 ? [S(x), S(f(x))] : [S(x), { answer: String(f(x)) }]));
      const exprs = {};
      for (let r = 1; r < 4; r++)
        exprs[`${r}:1`] = `${a}*${ex(xs[r])}${p.shape === "lin+" ? "+" : "-"}${b}`.replace(
          ex(xs[r]),
          `r${r}c0`,
        );
      return fillTable({
        prompt: `Complete the table. Find the value of ${v} that makes ${view.eq} true.`,
        headers: [v, `${a}${v} ${p.shape === "lin+" ? "+" : "−"} ${b}`],
        rows,
        exprs,
        hint: `Look for the row where the second column equals ${c}.`,
        explanation: `${a} × ${P(X)} ${p.shape === "lin+" ? "+" : "−"} ${b} = ${S(c)}, so ${v} = ${S(X)} makes the equation true.`,
        misconception: "Stopping at the first row instead of testing each value.",
      });
    },
  },
  {
    id: "number-line",
    make({ rng, grade, level }) {
      const p = twoStep(rng, grade, level);
      if (abs(p.X) > 12) return null;
      const v = rng.pick(VARS);
      const view = twoStepView(p, v);
      return numberline({
        prompt: `Solve ${view.eq}. Click the solution on the number line.`,
        min: -12,
        max: 12,
        answer: String(p.X),
        expr: view.truth,
        hint: "Solve the equation first. Then find the number on the line.",
        explanation: `${view.two[0]}. ${view.two[1]}. The solution is ${S(p.X)}.`,
        misconception: "Placing a negative solution on the wrong side of zero.",
      });
    },
  },
];

function signedStart(grade, X) {
  return grade === 7 && X < 0 ? X - 1 : 1;
}

export const EQUATION_TEMPLATES = {
  "one-step-equations": oneStepEquations,
  "two-step-equations": twoStepEquations,
};
