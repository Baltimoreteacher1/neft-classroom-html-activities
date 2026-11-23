// Decimal operations. A decimal is a whole number k with p places (value k / 10^p), so every line of a worked
// solution can show the integer arithmetic it really uses.

import { NAMES, R, choice, dec, errorItem, fillTable, fixed, number } from "./kit.js";

const pow10 = (p) => 10 ** p;
const val = ({ k, p }) => R(k, pow10(p));
const show = (x, places = x.p) => fixed(val(x), places);
/** Plain decimal text with the fewest digits for a value k / 10^p (k may carry extra trailing zeros). */
const plain = (k, p) => dec(R(k, pow10(p)));

/** A decimal with exactly p places whose last digit is not 0, with a whole part in [lo, hi]. */
function decimal(rng, p, lo, hi) {
  for (;;) {
    const k = rng.int(lo * pow10(p), hi * pow10(p) + pow10(p) - 1);
    if (p === 0 || k % 10 !== 0) return { k, p };
  }
}

const PLACES = {
  4: [
    null,
    [[1, 1]],
    [[2, 2]],
    [
      [1, 2],
      [2, 2],
    ],
  ],
  5: [
    null,
    [
      [1, 1],
      [1, 2],
    ],
    [
      [2, 2],
      [2, 3],
    ],
    [
      [3, 3],
      [1, 3],
      [2, 3],
    ],
  ],
  6: [
    null,
    [
      [1, 2],
      [2, 2],
    ],
    [
      [2, 3],
      [1, 3],
    ],
    [
      [3, 3],
      [2, 3],
    ],
  ],
};

function addSubPair(rng, grade, level, { differ = false, op } = {}) {
  for (let i = 0; i < 80; i++) {
    const [pa, pb] = rng.pick(PLACES[grade][level]);
    const top = grade === 4 ? 40 : grade === 5 ? 60 : 99;
    const A = decimal(rng, pa, 1, top);
    const B = decimal(rng, pb, 1, top);
    const o = op || (rng.chance() ? "add" : "sub");
    if (differ && A.p === B.p) continue;
    const a = val(A);
    const b = val(B);
    if (o === "sub" && a.n * b.d <= b.n * a.d) continue;
    const res =
      o === "add"
        ? R(
            A.k * pow10(Math.max(pa, pb) - pa) + B.k * pow10(Math.max(pa, pb) - pb),
            pow10(Math.max(pa, pb)),
          )
        : R(
            A.k * pow10(Math.max(pa, pb) - pa) - B.k * pow10(Math.max(pa, pb) - pb),
            pow10(Math.max(pa, pb)),
          );
    return { A, B, op: o, res, P: Math.max(pa, pb) };
  }
  throw new Error("mathgen: no decimal pair");
}

const SYM = { add: "+", sub: "−" };
const EX = { add: "+", sub: "-" };

function addSubPrompt(rng, s) {
  const { A, B, op } = s;
  const name = rng.pick(NAMES);
  const money = A.p === 2 && B.p === 2;
  const a = money ? `$${show(A)}` : show(A);
  const b = money ? `$${show(B)}` : show(B);
  const texts = money
    ? {
        add: `${name} buys a book for ${a} and a pen for ${b}. How many dollars does ${name} spend in all?`,
        sub: `${name} has ${a}. ${name} spends ${b}. How many dollars does ${name} have left?`,
      }
    : {
        add: `One rope is ${a} meters long. Another rope is ${b} meters long. What is the total length in meters?`,
        sub: `A board is ${a} meters long. A piece ${b} meters long is cut off. How many meters are left?`,
      };
  return rng.chance(0.35)
    ? `${op === "add" ? "Add" : "Subtract"}: ${show(A)} ${SYM[op]} ${show(B)}`
    : texts[op];
}

function addSubWork(s) {
  const { A, B, op, res, P } = s;
  const sym = SYM[op];
  const same = A.p === B.p;
  const lead = same
    ? "Line up the decimal points:"
    : `Line up the decimal points. Add zeros so both have ${P} decimal places:`;
  return `${lead} ${show(A, P)} ${sym} ${show(B, P)} = ${dec(res)}.`;
}

const exprOf = (s) => `${show(s.A)}${EX[s.op]}${show(s.B)}`;

// ── multiplication and division operands ────────────────────────────────────

function mulPair(rng, grade, level) {
  const spec =
    level === 1
      ? { pa: 1, pb: 0 }
      : level === 2
        ? rng.pick([
            { pa: 2, pb: 0 },
            { pa: 1, pb: 1 },
          ])
        : rng.pick([
            { pa: 1, pb: 1 },
            { pa: 2, pb: 1 },
          ]);
  const A = decimal(rng, spec.pa, 1, grade === 6 ? 20 : 9);
  const B = spec.pb === 0 ? { k: rng.int(2, 9), p: 0 } : decimal(rng, spec.pb, 1, 9);
  return { A, B, prod: R(A.k * B.k, pow10(A.p + B.p)) };
}

const places = (n) => `${n} decimal ${n === 1 ? "place" : "places"}`;

function mulWork({ A, B, prod }) {
  const n = A.p + B.p;
  return `Ignore the decimal points: ${A.k} × ${B.k} = ${A.k * B.k}. The factors have ${places(n)} in all, so the answer has ${places(n)}: ${show(A)} × ${show(B)} = ${dec(prod)}.`;
}

function divPair(rng, grade, level) {
  if (grade === 6 && level === 3) {
    const B = rng.pick([
      { k: 2, p: 1 },
      { k: 5, p: 1 },
      { k: 4, p: 1 },
      { k: 25, p: 2 },
      { k: 15, p: 1 },
      { k: 6, p: 1 },
      { k: 3, p: 1 },
    ]);
    const Q = rng.int(3, 40);
    return { kind: "decimal", A: { k: Q * B.k, p: B.p }, B, Q: R(Q) };
  }
  const w = rng.int(2, 9);
  const q =
    level === 1
      ? decimal(rng, 1, 1, 9)
      : decimal(rng, level === 2 ? 1 : 2, 1, grade === 6 ? 30 : 9);
  return { kind: "whole", A: { k: q.k * w, p: q.p }, B: { k: w, p: 0 }, Q: val(q) };
}

function divWork({ kind, A, B, Q }) {
  if (kind === "whole")
    return `${show(A)} ÷ ${B.k} = ${dec(Q)}. Check: ${dec(Q)} × ${B.k} = ${show(A)}.`;
  const m = pow10(B.p);
  return `Multiply both numbers by ${m} so the divisor is a whole number: ${A.k} ÷ ${B.k} = ${dec(Q)}. Check: ${dec(Q)} × ${B.k} = ${A.k}.`;
}

// ── templates ───────────────────────────────────────────────────────────────

const decimalOps = [
  {
    id: "add-subtract",
    make({ rng, grade, level }) {
      const s = addSubPair(rng, grade, level);
      return number({
        prompt: addSubPrompt(rng, s),
        answer: dec(s.res),
        expr: exprOf(s),
        hint: "Line up the decimal points. Add zeros so the numbers have the same number of places.",
        explanation: addSubWork(s),
        misconception: `Not lining up the decimal points, or putting the point in the wrong place (${dec(R(Number(s.res.n) * 10, Number(s.res.d)))} or ${dec(R(Number(s.res.n), Number(s.res.d) * 10))}).`,
      });
    },
  },
  {
    id: "multiply",
    grades: [5, 6],
    make({ rng, grade, level }) {
      const s = mulPair(rng, grade, level);
      const { A, B } = s;
      const prompt =
        B.p === 0
          ? rng.pick([
              `Each ribbon is ${show(A)} meters long. How many meters of ribbon are in ${B.k} ribbons?`,
              `Multiply: ${show(A)} × ${B.k}`,
            ])
          : rng.pick([
              `One pound of grapes costs $${show(A, 2)}. ${rng.pick(NAMES)} buys ${show(B)} pounds. How many dollars does it cost?`,
              `Multiply: ${show(A)} × ${show(B)}`,
            ]);
      const money = prompt.includes("$");
      if (money && A.p > 2) return null;
      return number({
        prompt,
        answer: dec(s.prod),
        expr: `${money ? show(A, 2) : show(A)}*${show(B)}`,
        hint: "Multiply as if there were no decimal points. Then count the decimal places.",
        explanation: mulWork(s),
        misconception: `Counting the decimal places wrongly (${dec(R(Number(s.prod.n) * 10, Number(s.prod.d)))} or ${dec(R(Number(s.prod.n), Number(s.prod.d) * 10))}).`,
      });
    },
  },
  {
    id: "divide",
    grades: [5, 6],
    make({ rng, grade, level }) {
      if (grade === 5 && level === 1) return null;
      const s = divPair(rng, grade, level);
      const { kind, A, B, Q } = s;
      const name = rng.pick(NAMES);
      const prompt =
        kind === "whole"
          ? rng.pick([
              `${B.k} friends share $${show(A, 2)} equally. How many dollars does each friend get?`,
              `Divide: ${show(A)} ÷ ${B.k}`,
            ])
          : `${name} has a ribbon ${show(A)} meters long. ${name} cuts it into pieces ${show(B)} meters long. How many pieces are there?`;
      return number({
        prompt,
        answer: dec(Q),
        expr: `${prompt.includes("$") ? show(A, 2) : show(A)}/${show(B)}`,
        hint:
          kind === "whole"
            ? "Divide as with whole numbers. Keep the decimal point in line."
            : "Make the divisor a whole number. Multiply both numbers by 10 or 100.",
        explanation: divWork(s),
        misconception:
          kind === "whole"
            ? "Dividing the smaller number by the larger, or misplacing the decimal point."
            : "Dividing without first making the divisor a whole number.",
      });
    },
  },
  {
    id: "choose",
    make({ rng, grade, level }) {
      const mul = grade >= 5 && rng.chance(0.4);
      const wrong = [];
      const add = (r, why) => wrong.push({ text: dec(r), why });
      let prompt;
      let answer;
      let work;
      let exprText;
      if (mul) {
        const s = mulPair(rng, grade, level);
        const x10 = R(Number(s.prod.n) * 10, Number(s.prod.d));
        const d10 = R(Number(s.prod.n), Number(s.prod.d) * 10);
        add(x10, "Putting the decimal point one place too far right.");
        add(d10, "Putting the decimal point one place too far left.");
        add(
          R(s.A.k * pow10(s.B.p) + s.B.k * pow10(s.A.p), pow10(s.A.p + s.B.p)),
          "Adding instead of multiplying.",
        );
        prompt = `What is ${show(s.A)} × ${show(s.B)}?`;
        answer = dec(s.prod);
        work = mulWork(s);
        exprText = `${show(s.A)}*${show(s.B)}`;
      } else {
        const s = addSubPair(rng, grade, level);
        const sign = s.op === "add" ? 1 : -1;
        const sx = Math.max(s.A.p, s.B.p);
        add(
          R(Number(s.res.n) * 10, Number(s.res.d)),
          "Putting the decimal point one place too far right.",
        );
        add(
          R(Number(s.res.n), Number(s.res.d) * 10),
          "Putting the decimal point one place too far left.",
        );
        if (s.A.p !== s.B.p)
          add(
            R(s.A.k + sign * s.B.k, pow10(sx)),
            "Adding the digits without lining up the decimal points.",
          );
        const other =
          s.op === "add"
            ? R(s.A.k * pow10(sx - s.A.p) - s.B.k * pow10(sx - s.B.p), pow10(sx))
            : R(s.A.k * pow10(sx - s.A.p) + s.B.k * pow10(sx - s.B.p), pow10(sx));
        if (other.n > 0n)
          add(
            other,
            `${s.op === "add" ? "Subtracting" : "Adding"} instead of ${s.op === "add" ? "adding" : "subtracting"}.`,
          );
        prompt = `What is ${show(s.A)} ${SYM[s.op]} ${show(s.B)}?`;
        answer = dec(s.res);
        work = addSubWork(s);
        exprText = exprOf(s);
      }
      return choice(rng, {
        prompt,
        answer,
        expr: exprText,
        wrong: wrong.filter((w) => !w.text.startsWith("-")),
        hint: "Check where the decimal point goes.",
        explanation: work,
        misconception: "Students misplace the decimal point.",
      });
    },
  },
  {
    id: "find-the-mistake-add",
    make({ rng, grade, level }) {
      const s = addSubPair(rng, grade, level, { differ: true, op: "add" });
      const { A, B, res, P } = s;
      if (A.p > B.p) return null;
      const moved = { k: A.k, p: P };
      const wrongRes = R(moved.k * 1 + B.k, pow10(P));
      return errorItem(rng, {
        prompt: `Omar adds ${show(A)} + ${show(B)}. One step has a mistake. Find the step and choose the fix.`,
        steps: [
          `${show(A)} + ${show(B)}`,
          `Line up the decimal points: ${show(moved)} + ${show(B)}`,
          `Add: ${dec(wrongRes)}`,
        ],
        errorIndex: 1,
        expr: exprOf(s),
        fixRight: `Write ${show(A)} as ${show(A, P)}: ${show(A, P)} + ${show(B)} = ${dec(res)}.`,
        fixWrong: [
          {
            text: `Move the decimal point in ${show(A)}: ${show(moved)} + ${show(B)} = ${dec(wrongRes)}.`,
            why: "Moving the decimal point instead of adding a zero.",
          },
          {
            text: `Add the digits and ignore the decimal points: ${A.k} + ${B.k} = ${A.k + B.k}.`,
            why: "Ignoring the decimal points.",
          },
          {
            text: `Multiply instead: ${show(A)} × ${show(B)} = ${dec(R(A.k * B.k, pow10(A.p + B.p)))}.`,
            why: "Multiplying instead of adding.",
          },
          {
            text: `Subtract instead: ${show(B, P)} − ${show(A, P)} = ${dec(R(B.k - A.k * pow10(P - A.p), pow10(P)))}.`,
            why: "Subtracting instead of adding.",
          },
        ].filter((w) => !/= -/.test(w.text)),
        hint: `${show(A)} and ${show(B)} do not have the same number of decimal places.`,
        explanation: `${show(A, P)} + ${show(B, P)} = ${dec(res)}. Adding a zero to ${show(A)} does not change its value.`,
        misconception: `Treating ${show(A)} as ${show(moved)}: the digits moved to the wrong places.`,
      });
    },
  },
  {
    id: "find-the-mistake-multiply",
    grades: [5, 6],
    make({ rng, grade, level }) {
      const A = decimal(rng, rng.pick([1, 2]), 1, grade === 6 ? 20 : 9);
      const n = rng.int(2, 9);
      const prod = R(A.k * n, pow10(A.p));
      const far = rng.chance(A.p === 2 ? 0.5 : 1) ? "far" : "near";
      const exp = far === "far" ? A.p + 1 : A.p - 1;
      const bad = R(A.k * n, pow10(exp));
      return errorItem(rng, {
        prompt: `Lena multiplies ${show(A)} × ${n}. One step has a mistake. Find the step and choose the fix.`,
        steps: [
          `${show(A)} × ${n}`,
          `Multiply as whole numbers, then divide by ${pow10(exp)}: ${A.k} × ${n} ÷ ${pow10(exp)}`,
          `Place the decimal point: ${dec(bad)}`,
        ],
        errorIndex: 1,
        expr: `${show(A)}*${n}`,
        fixRight: `Count the decimal places in ${show(A)}: ${A.p}. Divide by ${pow10(A.p)}: ${A.k * n} ÷ ${pow10(A.p)} = ${dec(prod)}.`,
        fixWrong: [
          {
            text: `Move the point one place too far: ${A.k * n} ÷ ${pow10(A.p + 1)} = ${dec(R(A.k * n, pow10(A.p + 1)))}.`,
            why: "Counting one decimal place too many.",
          },
          {
            text: `Leave out the decimal point: ${A.k} × ${n} = ${A.k * n}.`,
            why: "Forgetting the decimal point.",
          },
          {
            text: `Add instead: ${show(A)} + ${n} = ${dec(R(A.k + n * pow10(A.p), pow10(A.p)))}.`,
            why: "Adding instead of multiplying.",
          },
          ...(A.p === 2
            ? [
                {
                  text: `Move the point one place too little: ${A.k * n} ÷ ${pow10(A.p - 1)} = ${dec(R(A.k * n, pow10(A.p - 1)))}.`,
                  why: "Counting one decimal place too few.",
                },
              ]
            : []),
        ],
        hint: `${show(A)} has ${places(A.p)}. The answer needs the same number.`,
        explanation: `${A.k} × ${n} = ${A.k * n}. ${show(A)} has ${places(A.p)}, so ${A.k * n} ÷ ${pow10(A.p)} = ${dec(prod)}.`,
        misconception:
          far === "far"
            ? "Counting one decimal place too many."
            : "Counting one decimal place too few.",
      });
    },
  },
  {
    id: "price-table",
    grades: [5, 6],
    make({ rng, level }) {
      const price =
        level === 1
          ? decimal(rng, 1, 1, 9)
          : rng.pick(
              [
                { k: 250, p: 2 },
                { k: 175, p: 2 },
                { k: 325, p: 2 },
                { k: 480, p: 2 },
              ].map((x) => ({ k: x.k + 5 * rng.int(0, 3), p: 2 })),
            );
      const [k1, k2, k3] = rng.sample([2, 3, 4, 5, 6, 7, 8, 9], 3);
      const total = (k) => dec(R(price.k * k, pow10(price.p)));
      const rows = [
        [show(price), String(k1), { answer: total(k1) }],
        [show(price), String(k2), { answer: total(k2) }],
        [show(price), { answer: String(k3) }, total(k3)],
      ];
      return fillTable({
        prompt: `Rice costs $${show(price, 2)} for each kilogram. Complete the table.`,
        headers: ["Price per kg ($)", "Kilograms", "Total cost ($)"],
        rows,
        exprs: { "0:2": "r0c0*r0c1", "1:2": "r1c0*r1c1", "2:1": "r2c2/r2c0" },
        hint: "Total cost = price per kilogram × number of kilograms.",
        explanation: `${show(price)} × ${k1} = ${total(k1)}. ${show(price)} × ${k2} = ${total(k2)}. ${total(k3)} ÷ ${show(price)} = ${k3}.`,
        misconception: "Misplacing the decimal point in the product.",
      });
    },
  },
];

export const DECIMAL_TEMPLATES = { "decimal-ops": decimalOps };
