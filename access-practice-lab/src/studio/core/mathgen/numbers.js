// Number sense topics: order of operations, evaluating expressions, integers and the number line.

import { NAMES, choice, errorItem, fillTable, number, numberline, order, sg } from "./kit.js";
import {
  explain,
  lines,
  randomExpression,
  sequence,
  textOf,
  tokenize,
  tryValue,
  wordOf,
} from "./pemdas.js";

// ── order of operations ─────────────────────────────────────────────────────

const lineOf = (s) =>
  s.op === "^"
    ? `${s.a}^${s.b} = ${s.res}`
    : `${s.a} ${{ "*": "×", "/": "÷", "+": "+", "-": "−" }[s.op]} ${s.b} = ${s.res}`;
const seqText = (steps) => steps.map(lineOf).join(". Then ");

const orderOfOperations = [
  {
    id: "compute",
    make({ rng, grade, level }) {
      const { tokens, expr, steps, value } = randomExpression(rng, level, { powers: grade >= 6 });
      const ltr = tryValue(tokens, "ltr");
      return number({
        prompt: `Find the value of ${textOf(tokens)}.`,
        answer: String(value),
        expr,
        hint: "Brackets first. Then powers. Then multiply and divide from left to right. Then add and subtract from left to right.",
        explanation: explain(steps),
        misconception:
          ltr !== null && ltr !== value
            ? `Working from left to right gives ${ltr}, which is wrong.`
            : "Doing the operations in the wrong order.",
      });
    },
  },
  {
    id: "choose",
    make({ rng, grade, level }) {
      const { tokens, expr, steps, value } = randomExpression(rng, level, { powers: grade >= 6 });
      const wrong = [];
      const add = (v, why) => {
        if (v !== null && v !== value) wrong.push({ text: String(v), why });
      };
      add(
        tryValue(tokens, "ltr"),
        "Working from left to right and ignoring the order of operations.",
      );
      add(tryValue(tokens, "low"), "Adding or subtracting before multiplying or dividing.");
      add(tryValue(tokens, "rtl"), "Working from right to left.");
      if (tokens.includes("("))
        add(
          tryValue(
            tokens.filter((t) => t !== "(" && t !== ")"),
            "correct",
          ),
          "Ignoring the brackets.",
        );
      tokens.forEach((t, i) => {
        if (!"+-*/".includes(t) || t === "") return;
        for (const o of ["+", "-", "*"]) {
          if (o === t) continue;
          const alt = [...tokens];
          alt[i] = o;
          add(tryValue(alt, "correct"), "Using a different operation than the one shown.");
        }
      });
      return choice(rng, {
        prompt: `What is the value of ${textOf(tokens)}?`,
        answer: String(value),
        expr,
        wrong,
        hint: "Which operation do you do first?",
        explanation: explain(steps),
        misconception: "Students work from left to right.",
      });
    },
  },
  {
    id: "find-the-mistake",
    make({ rng, level }) {
      let pick = null;
      for (let i = 0; i < 40 && !pick; i++) {
        const e = randomExpression(rng, Math.min(level, 2), { parens: false, powers: false });
        const first = (() => {
          try {
            const idx = e.tokens.findIndex((t) => "+-*/".includes(t));
            return { idx };
          } catch {
            return null;
          }
        })();
        if (!first) continue;
        try {
          const wrongFirst = sequence(e.tokens, "ltr")[0];
          const rest = wrongFirst.tokens.length > 1 ? sequence(wrongFirst.tokens) : [];
          const wrongValue = rest.length ? rest[rest.length - 1].res : Number(wrongFirst.tokens[0]);
          if (wrongValue !== e.value && rest.length <= 3)
            pick = { ...e, wrongFirst, rest, wrongValue };
        } catch {
          // try another expression
        }
      }
      if (!pick) return null;
      const { tokens, expr, steps, value, wrongFirst, rest } = pick;
      const nums = tokens.filter((t) => /\d/.test(t)).map(Number);
      const fixWrong = [];
      try {
        fixWrong.push({
          text: `Work from left to right: ${seqText(sequence(tokens, "ltr"))}.`,
          why: "Working from left to right.",
        });
      } catch {
        // skip
      }
      try {
        fixWrong.push({
          text: `Work from right to left: ${seqText(sequence(tokens, "rtl"))}.`,
          why: "Working from right to left.",
        });
      } catch {
        // skip
      }
      fixWrong.push({
        text: `Add every number: ${nums.join(" + ")} = ${nums.reduce((a, b) => a + b, 0)}.`,
        why: "Adding all the numbers.",
      });
      fixWrong.push({
        text: `Multiply every number: ${nums.join(" × ")} = ${nums.reduce((a, b) => a * b, 1)}.`,
        why: "Multiplying all the numbers.",
      });
      return errorItem(rng, {
        prompt: `Ravi finds the value of ${textOf(tokens)}. One step has a mistake. Find the step and choose the fix.`,
        steps: [
          textOf(tokens),
          `${wordOf(wrongFirst.op)} first: ${textOf(wrongFirst.tokens)}`,
          ...rest.map((s) => `${wordOf(s.op)}: ${textOf(s.tokens)}`),
        ],
        errorIndex: 1,
        expr,
        fixRight: explain(steps),
        fixWrong,
        hint: "Which operation should come first?",
        explanation: explain(steps),
        misconception: "Doing the operations from left to right.",
      });
    },
  },
  {
    id: "steps",
    make({ rng, grade, level }) {
      const { tokens, steps, value } = randomExpression(rng, level, { powers: grade >= 6 });
      return order({
        prompt: `Put the steps in order to find the value of ${textOf(tokens)}.`,
        items: [...lines(steps), `The value is ${value}`],
        hint: "Brackets and powers come before multiplying and dividing.",
        explanation: explain(steps),
        misconception: "Doing the operations from left to right.",
      });
    },
  },
];

// ── evaluating expressions ──────────────────────────────────────────────────

const VARS = ["x", "n", "m", "t"];

/** A shape: how it reads (`disp`) and the numeric expression for a value or table-cell reference `X` (`num`). */
function pickShape(rng, level) {
  const v = rng.pick(VARS);
  const a = rng.int(2, level === 1 ? 5 : 9);
  const b = rng.int(1, 9);
  const kinds = {
    lin: { disp: `${a}${v} + ${b}`, num: (X) => `${a}*${X}+${b}`, xs: [1, level === 1 ? 6 : 10] },
    linSub: {
      disp: `${a}${v} − ${b}`,
      num: (X) => `${a}*${X}-${b}`,
      xs: [Math.ceil((b + 1) / a), 10],
    },
    square: { disp: `${v}^2 + ${b}`, num: (X) => `${X}^2+${b}`, xs: [2, 9] },
    paren: { disp: `${a}(${v} + ${b})`, num: (X) => `${a}*(${X}+${b})`, xs: [1, 8] },
    div: { disp: `${v} ÷ ${a} + ${b}`, num: (X) => `${X}/${a}+${b}`, mult: a, xs: [2, 9] },
    sq2: { disp: `${a}${v}^2 − ${b}`, num: (X) => `${a}*${X}^2-${b}`, xs: [2, 6] },
  };
  const ids =
    level === 1
      ? ["lin", "linSub"]
      : level === 2
        ? ["lin", "linSub", "square", "paren"]
        : ["div", "sq2", "paren", "square"];
  const id = rng.pick(ids);
  return { id, v, a, b, ...kinds[id] };
}

const xFor = (rng, s) => {
  const [lo, hi] = s.xs;
  return s.mult ? s.mult * rng.int(lo, hi) : rng.int(lo, Math.max(lo, hi));
};

const evalAt = (s, x) => {
  const tokens = tokenize(s.num(String(x)));
  const steps = sequence(tokens);
  return { tokens, steps, value: steps[steps.length - 1].res };
};

function shapeAndX(rng, level) {
  for (let i = 0; i < 60; i++) {
    const s = pickShape(rng, level);
    const x = xFor(rng, s);
    try {
      const r = evalAt(s, x);
      if (r.value >= 2 && r.value <= 300) return { s, x, ...r };
    } catch {
      // try again
    }
  }
  throw new Error("mathgen: no expression");
}

const wrongValues = (s, x, truth) => {
  const { id, a, b } = s;
  const cat = (p, q) => Number(`${p}${q}`);
  const out = {
    lin: [
      [cat(a, x) + b, "Writing the coefficient and the number side by side."],
      [a + x + b, "Adding instead of multiplying."],
      [a * (x + b), "Adding before multiplying."],
    ],
    linSub: [
      [cat(a, x) - b, "Writing the coefficient and the number side by side."],
      [a + x - b, "Adding instead of multiplying."],
      [a * (x - b), "Subtracting before multiplying."],
    ],
    square: [
      [2 * x + b, "Treating the exponent as times 2."],
      [(x + b) ** 2, "Adding before squaring."],
      [cat(x, 2) + b, "Writing the exponent as a digit."],
    ],
    paren: [
      [a * x + b, "Multiplying only the first term inside the brackets."],
      [a + x + b, "Adding everything."],
      [a * x * b, "Multiplying everything."],
    ],
    div: [
      [x * a + b, "Multiplying instead of dividing."],
      [(x + b) % a === 0 ? (x + b) / a : -1, "Adding before dividing."],
      [(x / a) * b, "Multiplying by the added number."],
    ],
    sq2: [
      [(a * x) ** 2 - b, "Squaring the coefficient too."],
      [2 * a * x - b, "Treating the exponent as times 2."],
      [cat(a, x) ** 2 - b, "Writing the coefficient and the number side by side."],
    ],
  }[id];
  return out
    .filter(([v]) => Number.isInteger(v) && v > 0 && v !== truth)
    .map(([v, why]) => ({ text: String(v), why }));
};

const WORDS = [
  (a, b, x) => ({
    prompt: `A taxi costs $${b} to start and $${a} for each mile. The cost in dollars is c = ${b} + ${a}m, where m is the number of miles. What is c when m = ${x}?`,
    num: `${b}+${a}*${x}`,
  }),
  (a, b, x) => ({
    prompt: `A gym charges $${b} to join and $${a} for each class. The cost in dollars is c = ${b} + ${a}n, where n is the number of classes. What is c when n = ${x}?`,
    num: `${b}+${a}*${x}`,
  }),
];

const evaluateExpressions = [
  {
    id: "substitute",
    make({ rng, level }) {
      const { s, x, tokens, steps, value } = shapeAndX(rng, level);
      return number({
        prompt: `Evaluate ${s.disp} when ${s.v} = ${x}.`,
        answer: String(value),
        expr: s.num(String(x)),
        hint: `Replace ${s.v} with ${x}. Then follow the order of operations.`,
        explanation: `Replace ${s.v} with ${x}: ${textOf(tokens)}. ${explain(steps)}`,
        misconception: `Putting the numbers side by side (${s.a}${x}) or working in the wrong order.`,
      });
    },
  },
  {
    id: "two-variables",
    levels: [3],
    make({ rng }) {
      const a = rng.int(2, 9);
      const b = rng.int(2, 9);
      const x = rng.int(2, 8);
      const y = rng.int(2, 8);
      const e = `${a}*${x}+${b}*${y}`;
      const steps = sequence(tokenize(e));
      return number({
        prompt: `Evaluate ${a}x + ${b}y when x = ${x} and y = ${y}.`,
        answer: String(steps[steps.length - 1].res),
        expr: e,
        hint: "Replace x and y with their values. Multiply before you add.",
        explanation: `Replace x with ${x} and y with ${y}: ${textOf(tokenize(e))}. ${explain(steps)}`,
        misconception: `Adding first: (${a} + ${b}) × (${x} + ${y}) = ${(a + b) * (x + y)}.`,
      });
    },
  },
  {
    id: "formula",
    levels: [1, 2],
    make({ rng, level }) {
      const a = rng.int(2, level === 1 ? 6 : 12);
      const b = rng.int(2, 15);
      const x = rng.int(2, 9);
      const w = rng.pick(WORDS)(a, b, x);
      const steps = sequence(tokenize(w.num));
      return number({
        prompt: w.prompt,
        answer: String(steps[steps.length - 1].res),
        expr: w.num,
        hint: "Replace the letter with the number. Multiply before you add.",
        explanation: `${textOf(tokenize(w.num))}. ${explain(steps)}`,
        misconception: `Adding first: (${b} + ${a}) × ${x} = ${(b + a) * x}.`,
      });
    },
  },
  {
    id: "choose",
    make({ rng, level }) {
      const { s, x, steps, value } = shapeAndX(rng, level);
      return choice(rng, {
        prompt: `What is the value of ${s.disp} when ${s.v} = ${x}?`,
        answer: String(value),
        expr: s.num(String(x)),
        wrong: wrongValues(s, x, value),
        hint: `Replace ${s.v} with ${x}. Then follow the order of operations.`,
        explanation: `Replace ${s.v} with ${x}: ${textOf(tokenize(s.num(String(x))))}. ${explain(steps)}`,
        misconception: "Students misread an expression such as 3x or x^2.",
      });
    },
  },
  {
    id: "table",
    make({ rng, level }) {
      for (let i = 0; i < 40; i++) {
        const s = pickShape(rng, level);
        const [lo, hi] = s.xs;
        const pool = [];
        for (let x = lo; x <= hi; x++)
          if (!s.mult || x % 1 === 0) pool.push(s.mult ? s.mult * x : x);
        const xs = rng.sample(pool, 4).sort((p, q) => p - q);
        if (xs.length < 4) continue;
        let vals;
        try {
          vals = xs.map((x) => evalAt(s, x).value);
        } catch {
          continue;
        }
        if (vals.some((v) => v > 300)) continue;
        const rows = xs.map((x, r) =>
          r === 0 ? [String(x), String(vals[0])] : [String(x), { answer: String(vals[r]) }],
        );
        const exprs = {};
        for (let r = 1; r < 4; r++) exprs[`${r}:1`] = s.num(`r${r}c0`);
        return fillTable({
          prompt: `Complete the table for the expression ${s.disp}.`,
          headers: [s.v, s.disp],
          rows,
          exprs,
          hint: `Replace ${s.v} with the number in each row.`,
          explanation: `For ${s.v} = ${xs[1]}: ${textOf(tokenize(s.num(String(xs[1]))))}. ${explain(evalAt(s, xs[1]).steps)}`,
          misconception: "Replacing the letter but then working in the wrong order.",
        });
      }
      return null;
    },
  },
  {
    id: "find-the-mistake",
    make({ rng, level }) {
      const lv = Math.min(level, 2);
      const a = rng.int(2, lv === 1 ? 5 : 9);
      const b = rng.int(2, 9);
      const x = rng.int(2, 9);
      const sub = rng.chance();
      if (sub && a * x <= b) return null;
      const v = rng.pick(VARS);
      const op = sub ? "-" : "+";
      const sym = sub ? "−" : "+";
      const truthExpr = `${a}*${x}${op}${b}`;
      const truth = sequence(tokenize(truthExpr));
      const kind = rng.pick(["side", "order"]);
      let steps;
      if (kind === "side") {
        const side = Number(`${a}${x}`);
        const wrongExpr = `${side}${op}${b}`;
        const w = sequence(tokenize(wrongExpr));
        if (w[w.length - 1].res === truth[truth.length - 1].res) return null;
        steps = [
          `Replace ${v} with ${x}: ${side} ${sym} ${b}`,
          `${wordOf(op)}: ${w[w.length - 1].res}`,
        ];
      } else {
        const inner = sub ? x - b : x + b;
        if (inner <= 0) return null;
        steps = [
          `Replace ${v} with ${x}: ${a} × ${x} ${sym} ${b}`,
          `${sub ? "Subtract" : "Add"} first: ${a} × ${inner}`,
          `Multiply: ${a * inner}`,
        ];
        if (a * inner === truth[truth.length - 1].res) return null;
      }
      const value = truth[truth.length - 1].res;
      const side = Number(`${a}${x}`);
      const fixWrong = [
        {
          text: `Write ${a} and ${x} side by side: ${side} ${sym} ${b} = ${sub ? side - b : side + b}.`,
          why: "Writing the coefficient and the number side by side.",
        },
        {
          text: `Add everything: ${a} + ${x} ${sym} ${b} = ${sub ? a + x - b : a + x + b}.`,
          why: "Adding instead of multiplying.",
        },
        {
          text: `${sub ? "Subtract" : "Add"} first: ${x} ${sym} ${b} = ${sub ? x - b : x + b}, then ${a} × ${sub ? x - b : x + b} = ${a * (sub ? x - b : x + b)}.`,
          why: "Adding or subtracting before multiplying.",
        },
        {
          text: `Multiply everything: ${a} × ${x} × ${b} = ${a * x * b}.`,
          why: "Multiplying all three numbers.",
        },
      ].filter((f) => !/= -/.test(f.text));
      return errorItem(rng, {
        prompt: `Lena evaluates ${a}${v} ${sym} ${b} when ${v} = ${x}. One step has a mistake. Find the step and choose the fix.`,
        steps,
        errorIndex: kind === "side" ? 0 : 1,
        expr: truthExpr,
        fixRight: `Multiply first: ${a} × ${x} = ${a * x}. Then ${sub ? "subtract" : "add"}: ${a * x} ${sym} ${b} = ${value}.`,
        fixWrong,
        hint: `${a}${v} means ${a} times ${v}.`,
        explanation: `${a}${v} means ${a} × ${v}. ${a} × ${x} = ${a * x}. ${a * x} ${sym} ${b} = ${value}.`,
        misconception:
          kind === "side"
            ? `Reading ${a}${v} as the number ${a}${x}.`
            : "Adding or subtracting before multiplying.",
      });
    },
  },
];

// ── integers ────────────────────────────────────────────────────────────────

const abs = Math.abs;
const nonZero = (rng, lo, hi) => {
  const n = rng.int(lo, hi);
  return rng.chance() ? -n : n;
};
const paren = (n) => (n < 0 ? `(${sg(n)})` : String(n));
const exprNum = (n) => (n < 0 ? `(${n})` : String(n));

const SIGNED = {
  add: { sym: "+", ex: "+", f: (a, b) => a + b },
  sub: { sym: "−", ex: "-", f: (a, b) => a - b },
  mul: { sym: "×", ex: "*", f: (a, b) => a * b },
  div: { sym: "÷", ex: "/", f: (a, b) => a / b },
};

/** A signed-number operation whose result is not 0 or 1. */
function signedProblem(rng, level, kinds) {
  for (let i = 0; i < 60; i++) {
    const kind = rng.pick(kinds);
    const top = level === 1 ? 9 : level === 2 ? 20 : 40;
    let a;
    let b;
    if (kind === "mul" || kind === "div") {
      const lim = level === 3 ? 12 : 9;
      b = nonZero(rng, 2, lim);
      const q = nonZero(rng, 2, lim);
      a = kind === "mul" ? q : q * b;
    } else {
      a = nonZero(rng, 1, top);
      b = nonZero(rng, 1, top);
    }
    const res = SIGNED[kind].f(a, b);
    if (res === 0 || res === 1 || abs(res) > 400) continue;
    return { kind, a, b, res };
  }
  throw new Error("mathgen: no signed problem");
}

const dispOp = ({ kind, a, b }) => `${sg(a)} ${SIGNED[kind].sym} ${paren(b)}`;
const exprOp = ({ kind, a, b }) => `${a < 0 ? `(${a})` : a}${SIGNED[kind].ex}${exprNum(b)}`;

function workOp(p) {
  const { kind, a, b, res } = p;
  const base = `${dispOp(p)} = ${sg(res)}`;
  if (kind === "sub" && b < 0)
    return `Subtracting ${sg(b)} is the same as adding ${abs(b)}: ${sg(a)} + ${abs(b)} = ${sg(res)}.`;
  if (kind === "add" && a * b < 0)
    return `The signs are different, so find the difference of ${abs(a)} and ${abs(b)} and keep the sign of the number farther from zero: ${base}.`;
  if (kind === "mul" || kind === "div")
    return `${a * b < 0 || (kind === "div" && a / b < 0) ? "The signs are different, so the answer is negative" : "The signs are the same, so the answer is positive"}: ${base}.`;
  return `${base}.`;
}

const signedWrong = (p) => {
  const { kind, a, b, res } = p;
  const out = [[-res, "Right size, wrong sign."]];
  if (kind === "add")
    out.push(
      [abs(a) + abs(b), "Adding the sizes and ignoring the signs."],
      [a - b, "Subtracting instead of adding."],
      [-(abs(a) + abs(b)), "Adding the sizes and always using a negative sign."],
    );
  if (kind === "sub")
    out.push(
      [a + b, "Adding instead of subtracting."],
      [b - a, "Subtracting in the wrong order."],
      [abs(a) + abs(b), "Adding the sizes and ignoring the signs."],
    );
  if (kind === "mul")
    out.push(
      [a + b, "Adding instead of multiplying."],
      [a - b, "Subtracting instead of multiplying."],
      [-(abs(a) * abs(b)), "Always using a negative sign."],
    );
  if (kind === "div")
    out.push(
      [a * b, "Multiplying instead of dividing."],
      [a - b, "Subtracting instead of dividing."],
      [abs(res) + 1, "A division slip."],
    );
  return out.map(([v, why]) => ({ text: sg(v), why }));
};

const CONTEXT = [
  (t, d) => ({
    prompt: `The temperature is ${sg(t)}°C. It drops ${d} degrees. What is the new temperature in °C?`,
    expr: `${t}-${d}`,
    disp: `${sg(t)} − ${d}`,
    v: t - d,
  }),
  (t, d) => ({
    prompt: `A diver is at ${sg(t)} meters. She swims down ${d} more meters. What is her new position in meters?`,
    expr: `${t}-${d}`,
    disp: `${sg(t)} − ${d}`,
    v: t - d,
  }),
  (t, d) => ({
    prompt: `Mia has a balance of ${sg(t)} dollars. She adds ${d} dollars. What is the new balance in dollars?`,
    expr: `${t}+${d}`,
    disp: `${sg(t)} + ${d}`,
    v: t + d,
  }),
];

const diffChain = (high, low) => {
  const d = high - low;
  return {
    start: `${sg(high)} − (${sg(low)})`,
    right: `${sg(high)} + ${abs(low)}`,
    wrong: `${sg(high)} − ${abs(low)}`,
    d,
    wrongV: high - abs(low),
  };
};

function lowHigh(rng, level) {
  for (let i = 0; i < 40; i++) {
    const low = -rng.int(2, level === 3 ? 20 : 9);
    const high = rng.int(low + 2, level === 1 ? 8 : 12);
    if (high - low > 1 && high !== 0 && abs(high - abs(low)) !== high - low) return { low, high };
  }
  throw new Error("mathgen: no integers");
}

const integerOps = [
  // grade 6: meaning of integers, opposites, absolute value, order, distance
  {
    id: "represent",
    grades: [6],
    make({ rng, level }) {
      const t = rng.int(2, level === 3 ? 60 : 15);
      const below = rng.chance();
      const name = rng.pick(NAMES);
      const picks = below
        ? [
            [
              `The temperature is ${t} degrees below zero. What integer shows the temperature?`,
              "Below zero is negative.",
            ],
            [
              `A diver is ${t} meters below sea level. What integer shows her position?`,
              "Below sea level is negative.",
            ],
            [
              `${name} owes $${t}. What integer shows this amount of money?`,
              "Owing money is negative.",
            ],
          ]
        : [
            [
              `The temperature is ${t} degrees above zero. What integer shows the temperature?`,
              "Above zero is positive.",
            ],
            [
              `A kite is ${t} meters above the ground. What integer shows its height?`,
              "Above the ground is positive.",
            ],
          ];
      const [prompt, why] = rng.pick(picks);
      const v = below ? -t : t;
      return number({
        prompt,
        answer: String(v),
        expr: String(v),
        hint: "Is the amount above or below zero?",
        explanation: `${why} The integer is ${sg(v)}.`,
        misconception: below
          ? "Writing a below-zero amount without the negative sign."
          : "Adding a negative sign to an amount above zero.",
      });
    },
  },
  {
    id: "opposite-absolute",
    grades: [6],
    make({ rng, level }) {
      const n = nonZero(rng, 2, level === 1 ? 9 : 40);
      if (rng.chance()) {
        return number({
          prompt: `What is the opposite of ${sg(n)}?`,
          answer: String(-n),
          expr: `0-(${n})`,
          hint: "Opposites are the same distance from zero on different sides.",
          explanation: `The opposite of ${sg(n)} is ${sg(-n)}. Both are ${abs(n)} units from zero.`,
          misconception: `Giving ${sg(n)} again, or ${n < 0 ? "forgetting" : "adding"} the negative sign.`,
        });
      }
      return number({
        prompt: `What is the absolute value of ${sg(n)}?`,
        answer: String(abs(n)),
        expr: String(abs(n)),
        hint: "Absolute value is the distance from zero. A distance is never negative.",
        explanation: `${sg(n)} is ${abs(n)} units from zero. The absolute value is ${abs(n)}.`,
        misconception:
          n < 0
            ? "Keeping the negative sign on an absolute value."
            : "Changing the sign of a positive number.",
      });
    },
  },
  {
    id: "compare",
    grades: [6],
    make({ rng, level }) {
      const top = level === 1 ? 9 : 25;
      const set = new Set();
      while (set.size < 4) set.add(nonZero(rng, 1, top));
      const nums = [...set];
      const greatest = rng.chance();
      const target = greatest ? Math.max(...nums) : Math.min(...nums);
      const farthest = nums.reduce((best, x) => (abs(x) > abs(best) ? x : best));
      const wrong = nums
        .filter((x) => x !== target)
        .map((x) => ({
          text: sg(x),
          why:
            x === farthest && x < 0 && greatest
              ? `Thinking ${sg(x)} is greatest because ${abs(x)} is a big number.`
              : x === farthest && x > 0 && !greatest
                ? `Thinking ${sg(x)} is least because it is far from zero.`
                : greatest
                  ? `${sg(x)} is to the left of ${sg(target)} on the number line.`
                  : `${sg(x)} is to the right of ${sg(target)} on the number line.`,
        }));
      return choice(rng, {
        prompt: `Which number is the ${greatest ? "greatest" : "least"}: ${nums.map(sg).join(", ")}?`,
        answer: sg(target),
        expr: String(target),
        wrong,
        hint: "Picture the numbers on a number line. Numbers to the right are greater.",
        explanation: `On a number line, ${sg(target)} is farthest ${greatest ? "right" : "left"}. So ${sg(target)} is the ${greatest ? "greatest" : "least"}.`,
        misconception:
          "Students think a bigger number after the negative sign means a greater number.",
      });
    },
  },
  {
    id: "click-the-number",
    grades: [6],
    make({ rng }) {
      const n = nonZero(rng, 1, 9);
      return numberline({
        prompt: `Click ${sg(n)} on the number line.`,
        min: -10,
        max: 10,
        answer: String(n),
        expr: String(n),
        hint:
          n < 0
            ? "Negative numbers are to the left of zero."
            : "Positive numbers are to the right of zero.",
        explanation: `${sg(n)} is ${abs(n)} units ${n < 0 ? "left" : "right"} of zero.`,
        misconception: "Placing a negative number on the right of zero.",
      });
    },
  },
  {
    id: "opposites-table",
    grades: [6],
    make({ rng, level }) {
      const ns = [
        ...new Set([
          nonZero(rng, 1, 9),
          nonZero(rng, 1, level === 1 ? 9 : 30),
          nonZero(rng, 1, 9),
          nonZero(rng, 1, 9),
        ]),
      ];
      if (ns.length < 4) return null;
      const rows = ns.map((n, r) =>
        r === 0 ? [sg(n), String(-n)] : [sg(n), { answer: String(-n) }],
      );
      const exprs = {};
      for (let r = 1; r < 4; r++) exprs[`${r}:1`] = `0-r${r}c0`;
      return fillTable({
        prompt: `Write the opposite of each number: ${ns.map(sg).join(", ")}.`,
        headers: ["Number", "Opposite"],
        rows,
        exprs,
        hint: "An opposite has the same size and the other sign.",
        explanation: `The opposite of ${sg(ns[1])} is ${sg(-ns[1])}. The opposite of ${sg(ns[2])} is ${sg(-ns[2])}.`,
        misconception: "Changing the number instead of the sign.",
      });
    },
  },
  {
    id: "distance",
    grades: [6],
    levels: [2, 3],
    make({ rng, level }) {
      const { low, high } = lowHigh(rng, level);
      const d = high - low;
      return number({
        prompt: `A diver is at ${sg(low)} meters. She swims up to ${sg(high)} meters. How many meters does she swim up?`,
        answer: String(d),
        expr: `${high}-(${low})`,
        hint: "Count the distance on the number line from the lower number to the higher number.",
        explanation: `${sg(high)} − (${sg(low)}) = ${d}. She swims up ${d} meters.`,
        misconception: `Ignoring the negative sign and finding ${sg(high - abs(low))}.`,
      });
    },
  },
  // grade 7: operations with signed numbers
  {
    id: "compute",
    grades: [7],
    make({ rng, level }) {
      const p = signedProblem(
        rng,
        level,
        level === 1 ? ["add", "sub"] : ["add", "sub", "mul", "div"],
      );
      return number({
        prompt: `What is ${dispOp(p)}?`,
        answer: String(p.res),
        expr: exprOp(p),
        hint: "Look at the signs first. Same signs and different signs work differently.",
        explanation: workOp(p),
        misconception: signedWrong(p).map((w) => w.why)[0],
      });
    },
  },
  {
    id: "context",
    grades: [7],
    make({ rng, level }) {
      const t = nonZero(rng, 2, level === 3 ? 30 : 15);
      const d = rng.int(2, level === 3 ? 30 : 15);
      const c = rng.pick(CONTEXT)(t, d);
      if (c.v === 0 || c.v === 1) return null;
      return number({
        prompt: c.prompt,
        answer: String(c.v),
        expr: c.expr,
        hint: "Write a number sentence with a positive or negative number. Then solve it.",
        explanation: `${c.disp} = ${sg(c.v)}.`,
        misconception: "Ignoring the negative sign in the starting amount.",
      });
    },
  },
  {
    id: "choose",
    grades: [7],
    make({ rng, level }) {
      const p = signedProblem(
        rng,
        level,
        level === 1 ? ["add", "sub"] : ["add", "sub", "mul", "div"],
      );
      return choice(rng, {
        prompt: `What is ${dispOp(p)}?`,
        answer: sg(p.res),
        expr: exprOp(p),
        wrong: signedWrong(p),
        hint: "Look at the signs first.",
        explanation: workOp(p),
        misconception: "Students work with the sizes of the numbers and lose track of the signs.",
      });
    },
  },
  {
    id: "number-line",
    grades: [7],
    levels: [1, 2],
    make({ rng, level }) {
      const p = signedProblem(rng, level, ["add", "sub"]);
      if (abs(p.res) > 19) return null;
      return numberline({
        prompt: `Show ${dispOp(p)} on the number line.`,
        min: -20,
        max: 20,
        answer: String(p.res),
        expr: exprOp(p),
        hint: "Start at the first number. Move right to add a positive, left to add a negative.",
        explanation: workOp(p),
        misconception: "Moving the wrong way on the number line.",
      });
    },
  },
  {
    id: "change-table",
    grades: [7],
    make({ rng, level }) {
      const top = level === 1 ? 9 : 20;
      const mk = () => {
        const s = nonZero(rng, 1, top);
        const c = nonZero(rng, 1, top);
        return [s, c];
      };
      const data = [mk(), mk(), mk(), mk()];
      const rows = data.map(([s, c], r) =>
        r === 0 ? [sg(s), sg(c), String(s + c)] : [sg(s), sg(c), { answer: String(s + c) }],
      );
      const exprs = {};
      for (let r = 1; r < 4; r++) exprs[`${r}:2`] = `r${r}c0+r${r}c1`;
      return fillTable({
        prompt: `Find each new temperature in °C. Start: ${sg(data[1][0])}, change: ${sg(data[1][1])}.`,
        headers: ["Start (°C)", "Change (°C)", "New (°C)"],
        rows,
        exprs,
        hint: "New temperature = start + change.",
        explanation: `${sg(data[1][0])} + (${sg(data[1][1])}) = ${sg(data[1][0] + data[1][1])}.`,
        misconception: "Subtracting when the change is negative, or losing the sign.",
      });
    },
  },
  {
    id: "find-the-mistake",
    levels: [1, 2, 3],
    make({ rng, grade, level }) {
      if (grade === 6 && level === 1) return null;
      const kind = grade === 6 ? "diff" : rng.pick(["diff", "neg"]);
      if (kind === "diff") {
        const { low, high } = lowHigh(rng, level);
        const c = diffChain(high, low);
        if (c.d === c.wrongV) return null;
        return errorItem(rng, {
          prompt: `Omar finds ${c.start}. One step has a mistake. Find the step and choose the fix.`,
          steps: [c.start, `Subtracting a negative: ${c.wrong}`, sg(c.wrongV)],
          errorIndex: 1,
          expr: `${high}-(${low})`,
          fixRight: `Subtracting a negative is the same as adding: ${c.start} = ${c.right} = ${sg(c.d)}.`,
          fixWrong: [
            {
              text: `Drop the negative sign: ${c.wrong} = ${sg(c.wrongV)}.`,
              why: "Ignoring the negative sign.",
            },
            {
              text: `Subtract in the other order: ${sg(low)} − ${sg(high)} = ${sg(low - high)}.`,
              why: "Subtracting in the wrong order.",
            },
            {
              text: `Add the two numbers: ${sg(high)} + (${sg(low)}) = ${sg(high + low)}.`,
              why: "Adding the two numbers as they are.",
            },
            {
              text: `Find the sizes only: ${abs(high)} + ${abs(low)} = ${abs(high) + abs(low)}.`,
              why: "Adding the sizes and ignoring the signs.",
            },
          ],
          hint: "What does subtracting a negative number do?",
          explanation: `${c.start} = ${c.right} = ${sg(c.d)}.`,
          misconception: "Subtracting the number instead of adding its opposite.",
        });
      }
      const a = rng.int(2, level === 3 ? 30 : 12);
      const b = rng.int(2, level === 3 ? 30 : 12);
      const total = -(a + b);
      const wrong = b - a;
      if (wrong === total) return null;
      return errorItem(rng, {
        prompt: `Zoe finds −${a} − ${b}. One step has a mistake. Find the step and choose the fix.`,
        steps: [`−${a} − ${b}`, `Change the subtraction: −${a} + ${b}`, sg(wrong)],
        errorIndex: 1,
        expr: `-${a}-${b}`,
        fixRight: `Subtracting ${b} moves left: −${a} − ${b} = ${sg(total)}.`,
        fixWrong: [
          {
            text: `Change to adding ${b}: −${a} + ${b} = ${sg(wrong)}.`,
            why: "Changing the subtraction to addition without changing the sign of the second number.",
          },
          {
            text: `Find the sizes only: ${a} + ${b} = ${a + b}.`,
            why: "Dropping the negative sign.",
          },
          {
            text: `Subtract the sizes: ${a} − ${b} = ${sg(a - b)}.`,
            why: "Subtracting the sizes.",
          },
          {
            text: `Use the opposite of the answer: −(−${a} + ${b}) = ${sg(a - b)}.`,
            why: "Using the wrong sign for the answer.",
          },
        ],
        hint: "Start at a negative number. Subtracting moves you farther left.",
        explanation: `−${a} − ${b} = −${a + b}, because both numbers move you left: ${sg(total)}.`,
        misconception: "Changing the minus sign to a plus sign.",
      });
    },
  },
];

export const NUMBER_TEMPLATES = {
  "order-of-operations": orderOfOperations,
  "evaluate-expressions": evaluateExpressions,
  "integer-ops": integerOps,
};
