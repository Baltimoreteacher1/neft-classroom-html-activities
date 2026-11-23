// Fraction topics: add and subtract, multiply, divide. Fractions are exact rationals; display goes through kit.mk
// (reduced, mixed numbers) except where a worked line must show an unreduced fraction on purpose.

import { plainMath, ratAdd, ratCmp, ratDiv, ratMul, ratSub } from "../math.js";
import {
  NAMES,
  R,
  ans,
  choice,
  errorItem,
  fillTable,
  frac,
  gcd,
  lcm,
  mk,
  number,
  order,
} from "./kit.js";

const fr = frac;
const expr = (r) => `${r.n}/${r.d}`;
const num = (x) => Number(x);
const recip = (r) => R(num(r.d), num(r.n));
const properOver = (rng, d) =>
  rng.pick([...Array(d - 1).keys()].map((i) => i + 1).filter((a) => gcd(a, d) === 1));
const tidy = (r) => mk(r);
/** "A = B" when the two texts differ, else a plain sentence. */
const equalsOrIs = (unreduced, r) =>
  plainMath(unreduced) === plainMath(mk(r))
    ? `The answer is ${mk(r)}.`
    : `${unreduced} = ${mk(r)}.`;

// ── add and subtract ────────────────────────────────────────────────────────

const LIKE = [3, 4, 5, 6, 8, 10, 12];
const RELATED = [
  [2, 4],
  [3, 6],
  [4, 8],
  [5, 10],
  [2, 6],
  [3, 9],
  [4, 12],
  [2, 8],
];
const COPRIME = [
  [2, 3],
  [3, 4],
  [2, 5],
  [3, 5],
  [4, 5],
  [2, 7],
  [3, 7],
  [5, 6],
];
const HARD = [
  [4, 6],
  [6, 8],
  [6, 9],
  [10, 15],
  [4, 10],
  [6, 10],
  [8, 12],
  [9, 12],
];

/** Two proper fractions a/b and c/d (lowest terms), an operation, and the exact result. */
function addSubNumbers(rng, grade, level, { mixed = false, op } = {}) {
  for (let i = 0; i < 80; i++) {
    let b;
    let d;
    if (grade === 4) b = d = rng.pick(LIKE);
    else {
      [b, d] = rng.pick(level === 1 ? RELATED : level === 2 ? COPRIME : HARD);
      if (rng.chance()) [b, d] = [d, b];
    }
    const a = properOver(rng, b);
    const c = properOver(rng, d);
    const w1 = mixed ? rng.int(1, 4) : 0;
    const w2 = mixed ? rng.int(1, 3) : 0;
    const x = ratAdd(R(a, b), R(w1));
    const y = ratAdd(R(c, d), R(w2));
    const o = op || (rng.chance() ? "add" : "sub");
    if (o === "sub" && ratCmp(x, y) <= 0) continue;
    const res = o === "add" ? ratAdd(x, y) : ratSub(x, y);
    if (res.d === 1n || (level === 1 && ratCmp(res, R(2)) > 0)) continue;
    if (grade === 4 && level === 1 && ratCmp(res, R(1)) > 0) continue;
    return { a, b, c, d, x, y, op: o, res, L: lcm(b, d) };
  }
  throw new Error("mathgen: no fraction pair");
}

const SYM = { add: "+", sub: "−" };
const WORD = { add: "Add", sub: "Subtract" };
const apply = { add: ratAdd, sub: ratSub };

/** Worked lines for x op y with a common denominator (handles mixed numbers). */
function addSubWork(s) {
  const { x, y, op, res, L } = s;
  const lines = [];
  const mixedShown = x.d === 1n ? false : x.n > x.d || y.n > y.d;
  if (mixedShown)
    lines.push(`Write as fractions: ${mk(x)} = ${fr(x.n, x.d)} and ${mk(y)} = ${fr(y.n, y.d)}.`);
  const t1 = num(x.n) * (L / num(x.d));
  const t2 = num(y.n) * (L / num(y.d));
  if (num(x.d) !== num(y.d))
    lines.push(
      `Common denominator ${L}: ${fr(x.n, x.d)} = ${fr(t1, L)} and ${fr(y.n, y.d)} = ${fr(t2, L)}.`,
    );
  const t = op === "add" ? t1 + t2 : t1 - t2;
  lines.push(`${WORD[op]} the tops: ${t1} ${SYM[op]} ${t2} = ${t}.`);
  lines.push(equalsOrIs(fr(t, L), res));
  return { text: lines.join(" "), t1, t2, t, L };
}

const addSubWords = {
  add: (A, B) =>
    `A recipe uses ${A} cups of flour and ${B} cups of sugar. How many cups of flour and sugar are used in all?`,
  sub: (A, B) =>
    `A jug has ${A} liters of juice. ${B} liters are poured out. How many liters are left?`,
};

const fractionAddSub = [
  {
    id: "compute",
    make({ rng, grade, level }) {
      const s = addSubNumbers(rng, grade, level, { mixed: level === 3 && grade >= 5 });
      const { x, y, op, res } = s;
      const bare = rng.chance(0.4);
      const prompt = bare
        ? `${WORD[op]}: ${mk(x)} ${SYM[op]} ${mk(y)}. Write the answer in simplest form.`
        : `${addSubWords[op](mk(x), mk(y))} Write the answer in simplest form.`;
      const work = addSubWork(s);
      return number({
        prompt,
        answer: ans(res),
        accept: res.n > res.d ? [expr(res)] : [],
        expr: `${expr(x)}${op === "add" ? "+" : "-"}${expr(y)}`,
        hint: "Make the denominators the same. Then add or subtract only the tops.",
        explanation: work.text,
        misconception: `${WORD[op]}ing the tops and the bottoms (${fr(num(x.n) + num(y.n), num(x.d) + num(y.d))}) instead of using a common denominator.`,
      });
    },
  },
  {
    id: "choose",
    make({ rng, grade, level }) {
      const s = addSubNumbers(rng, grade, level);
      const { a, b, c, d, x, y, op, res, L } = s;
      const sign = op === "add" ? a + c : a - c;
      const wrong = [];
      const add = (num_, den, why) => {
        if (num_ > 0 && den > 0) wrong.push({ text: mk(R(num_, den)), why });
      };
      add(sign, op === "add" ? b + d : b - d, `${WORD[op]}ing the tops and the bottoms.`);
      add(sign, L === b ? L * 2 : L, "Not renaming the tops when the denominator changes.");
      add(a * c, b * d, "Multiplying instead of " + (op === "add" ? "adding." : "subtracting."));
      add(
        op === "add" ? a + c : Math.abs(a - c),
        b === d ? b * 2 : b * d,
        "Using the wrong common denominator.",
      );
      add(sign, b === d ? b * d : Math.max(b, d), "Using only one of the denominators.");
      const work = addSubWork(s);
      return choice(rng, {
        prompt: `${WORD[op]}: ${mk(x)} ${SYM[op]} ${mk(y)}`,
        answer: mk(res),
        expr: `${expr(x)}${op === "add" ? "+" : "-"}${expr(y)}`,
        wrong,
        hint: "Find a common denominator first.",
        explanation: work.text,
        misconception: "Students work with the tops and bottoms separately.",
      });
    },
  },
  {
    id: "find-the-mistake",
    make({ rng, grade, level }) {
      const s = addSubNumbers(rng, grade, level);
      const { a, b, c, d, x, y, op, res, L } = s;
      const sym = SYM[op];
      const x1 = a * (L / b);
      const x2 = c * (L / d);
      const t = op === "add" ? x1 + x2 : x1 - x2;
      const w = WORD[op];
      const like = b === d;
      const variants = like ? ["bottoms"] : ["unscaled", "bottoms", "across"];
      const v = rng.pick(variants);
      const alt = op === "add" ? x1 + c : x1 - c;
      if (v === "unscaled" && (x2 === c || alt <= 0)) return null;
      if (v === "across" && op === "sub" && (b <= d || a - c <= 0)) return null;
      if (like && op === "sub") return null;
      const steps = like
        ? [
            `${mk(x)} ${sym} ${mk(y)}`,
            `${w} the tops: ${fr(t, L)}`,
            `Write the answer: ${tidy(res)}`,
          ]
        : [
            `${mk(x)} ${sym} ${mk(y)}`,
            `Rename with common denominator ${L}: ${fr(x1, L)} ${sym} ${fr(x2, L)}`,
            `${w} the tops: ${fr(t, L)}`,
          ];
      let errorIndex = 2;
      if (v === "bottoms") {
        steps[like ? 1 : 2] = `${w} the tops and the bottoms: ${fr(t, 2 * L)}`;
        if (like) steps[2] = `Write the answer: ${tidy(R(t, 2 * L))}`;
        errorIndex = like ? 1 : 2;
      } else if (v === "unscaled") {
        steps[1] = `Rename with common denominator ${L}: ${fr(x1, L)} ${sym} ${fr(c, L)}`;
        steps[2] = `${w} the tops: ${fr(alt, L)}`;
        errorIndex = 1;
      } else if (v === "across") {
        steps[1] = `${w} across: ${fr(op === "add" ? a + c : a - c, op === "add" ? b + d : b - d)}`;
        steps[2] = `Write the answer: ${fr(op === "add" ? a + c : a - c, op === "add" ? b + d : b - d)}`;
        errorIndex = 1;
      }
      const sumText = fr(t, L);
      return errorItem(rng, {
        prompt: `Zoe works out ${mk(x)} ${sym} ${mk(y)}. One step has a mistake. Find the step and choose the fix.`,
        steps,
        errorIndex,
        expr: `${expr(x)}${op === "add" ? "+" : "-"}${expr(y)}`,
        fixRight: like
          ? `Keep the denominator ${L}: ${fr(a, L)} ${sym} ${fr(c, L)} = ${sumText}.`
          : `Use a common denominator: ${fr(x1, L)} ${sym} ${fr(x2, L)} = ${sumText}.`,
        fixWrong: [
          {
            text: `${w} across: ${fr(a, b)} ${sym} ${fr(c, d)} = ${fr(Math.abs(a - (op === "add" ? -c : c)) || 1, b + d)}.`,
            why: `${w}ing the bottoms too.`,
          },
          {
            text: `Do not rename: ${fr(a, L)} ${sym} ${fr(c, L)} = ${fr(Math.abs(a - (op === "add" ? -c : c)) || 1, L)}.`,
            why: "Not renaming the fractions.",
          },
          {
            text: `Multiply instead: ${mk(x)} × ${mk(y)} = ${mk(ratMul(x, y))}.`,
            why: "Multiplying instead of " + (op === "add" ? "adding." : "subtracting."),
          },
          {
            text: `Do the opposite: ${mk(x)} ${op === "add" ? "−" : "+"} ${mk(y)} = ${op === "add" ? (ratCmp(x, y) > 0 ? mk(ratSub(x, y)) : mk(ratSub(y, x))) : mk(ratAdd(x, y))}.`,
            why: "Using the wrong operation.",
          },
        ],
        hint: "Check the denominators in each step. Do they stay the same?",
        explanation: `${like ? fr(a, L) : fr(x1, L)} ${sym} ${like ? fr(c, L) : fr(x2, L)} = ${sumText}. ${like ? "Keep the denominator" : "Rename both fractions with the same denominator"}, then ${op === "add" ? "add" : "subtract"} only the tops.`,
        misconception:
          v === "bottoms"
            ? "Adding or subtracting the bottoms as well as the tops."
            : v === "unscaled"
              ? "Renaming only one numerator."
              : "Working across the tops and bottoms.",
      });
    },
  },
  {
    id: "steps",
    grades: [5, 6],
    make({ rng, grade, level }) {
      const s = addSubNumbers(rng, grade, level);
      const { a, b, c, d, x, y, op, res, L } = s;
      if (b === d) return null;
      const w = addSubWork(s);
      return order({
        prompt: `Put the steps in order to find ${mk(x)} ${SYM[op]} ${mk(y)}.`,
        items: [
          `Find a common denominator: ${L}`,
          `Rename the fractions: ${fr(a, b)} = ${fr(w.t1, L)} and ${fr(c, d)} = ${fr(w.t2, L)}`,
          `${WORD[op]} the tops: ${w.t1} ${SYM[op]} ${w.t2} = ${w.t}`,
          plainMath(fr(w.t, L)) === plainMath(mk(res))
            ? `Write the answer: ${mk(res)}`
            : `Simplify: ${fr(w.t, L)} = ${mk(res)}`,
        ],
        hint: "Rename first. Add or subtract after the denominators match.",
        explanation: w.text,
        misconception: "Adding the tops before the denominators match.",
      });
    },
  },
];

// ── multiply ────────────────────────────────────────────────────────────────

/** Operand pair for multiplication: whole × fraction (grade 4), fraction × fraction, mixed numbers later. */
function mulNumbers(rng, grade, level) {
  for (let i = 0; i < 80; i++) {
    let X;
    let Y;
    let kind = "frac";
    const g = () => {
      const d = rng.pick(level === 1 ? [2, 3, 4, 5] : [3, 4, 5, 6, 8, 9, 10]);
      return R(properOver(rng, d), d);
    };
    if (grade === 4) {
      X = R(rng.int(2, level === 3 ? 12 : 8));
      Y = g();
      kind = "whole";
    } else if (grade === 5 && level < 3) {
      X = g();
      Y = g();
    } else {
      X = rng.chance(level === 3 ? 0.6 : 0.3) ? ratAdd(R(rng.int(1, 3)), g()) : g();
      Y = rng.chance(level === 3 ? 0.4 : 0) ? ratAdd(R(rng.int(1, 2)), g()) : g();
    }
    const res = ratMul(X, Y);
    if (ratCmp(res, R(1)) === 0 || (res.d === 1n && grade !== 4)) continue;
    if (ratCmp(res, R(40)) > 0) continue;
    return { X, Y, res, kind };
  }
  throw new Error("mathgen: no multiplication pair");
}

function mulWork({ X, Y, res }) {
  const lines = [];
  const improper = (r) => r.d !== 1n && r.n > r.d;
  if (improper(X) || improper(Y) || X.d === 1n || Y.d === 1n)
    lines.push(`Write each as a fraction: ${mk(X)} = ${fr(X.n, X.d)} and ${mk(Y)} = ${fr(Y.n, Y.d)}.`);
  const top = num(X.n) * num(Y.n);
  const bottom = num(X.d) * num(Y.d);
  lines.push(
    `Multiply the tops: ${X.n} × ${Y.n} = ${top}. Multiply the bottoms: ${X.d} × ${Y.d} = ${bottom}.`,
  );
  lines.push(equalsOrIs(fr(top, bottom), res));
  return lines.join(" ");
}

const fractionMultiply = [
  {
    id: "compute",
    make({ rng, grade, level }) {
      const s = mulNumbers(rng, grade, level);
      return number({
        prompt: `Multiply: ${mk(s.X)} × ${mk(s.Y)}. Write the answer in simplest form.`,
        answer: ans(s.res),
        accept: s.res.n > s.res.d && s.res.d !== 1n ? [expr(s.res)] : [],
        expr: `${expr(s.X)}*${expr(s.Y)}`,
        hint: "Multiply the tops. Multiply the bottoms. Then simplify.",
        explanation: mulWork(s),
        misconception: `Adding instead of multiplying (${mk(ratAdd(s.X, s.Y))}), or keeping the first denominator.`,
      });
    },
  },
  {
    id: "word",
    make({ rng, grade, level }) {
      const s = mulNumbers(rng, grade, level);
      const name = rng.pick(NAMES);
      const prompt =
        s.kind === "whole"
          ? `Each bottle holds ${mk(s.Y)} liter of water. How many liters are in ${mk(s.X)} bottles? Write the answer in simplest form.`
          : `A recipe uses ${mk(s.X)} cups of milk. ${name} makes ${mk(s.Y)} of the recipe. How many cups of milk does ${name} use? Write the answer in simplest form.`;
      return number({
        prompt,
        answer: ans(s.res),
        accept: s.res.n > s.res.d && s.res.d !== 1n ? [expr(s.res)] : [],
        expr: `${expr(s.X)}*${expr(s.Y)}`,
        hint: "Of means multiply. Multiply the two numbers.",
        explanation: mulWork(s),
        misconception: "Students add the two amounts instead of finding a part of an amount.",
      });
    },
  },
  {
    id: "choose",
    make({ rng, grade, level }) {
      const lv = grade === 4 ? level : Math.min(level, 2);
      const { X, Y, res, kind } = mulNumbers(rng, grade, lv);
      const wrong = [];
      const add = (r, why) => {
        if (r && r.n > 0n) wrong.push({ text: mk(r), why });
      };
      add(ratAdd(X, Y), "Adding the two numbers instead of multiplying.");
      if (kind === "whole") {
        add(
          R(num(X.n) * num(Y.n), num(X.d) * num(Y.d) * num(X.n)),
          "Multiplying the top and the bottom by the whole number.",
        );
        add(R(num(Y.n), num(Y.d) * num(X.n)), "Multiplying the denominator by the whole number.");
        add(R(num(Y.n) + num(X.n), num(Y.d)), "Adding the whole number to the top.");
      } else {
        add(R(num(X.n) * num(Y.n), num(X.d)), "Multiplying the tops and keeping the first bottom.");
        add(
          R(num(X.n) * num(Y.n), num(X.d) + num(Y.d)),
          "Multiplying the tops and adding the bottoms.",
        );
        add(ratDiv(X, Y), "Dividing instead of multiplying.");
        add(R(num(X.n) * num(Y.d), num(X.d) * num(Y.n)), "Flipping the second fraction.");
      }
      return choice(rng, {
        prompt: `What is ${mk(X)} × ${mk(Y)}?`,
        answer: mk(res),
        expr: `${expr(X)}*${expr(Y)}`,
        wrong,
        hint: "Multiply the tops. Multiply the bottoms.",
        explanation: mulWork({ X, Y, res }),
        misconception: "Students use the rule for adding fractions when they multiply.",
      });
    },
  },
  {
    id: "find-the-mistake",
    make({ rng, grade, level }) {
      const { X, Y, res, kind } = mulNumbers(rng, grade, Math.min(level, 2));
      if (kind !== "whole" && (X.n > X.d || Y.n > Y.d)) return null;
      const top = num(X.n) * num(Y.n);
      const bottom = num(X.d) * num(Y.d);
      let steps;
      let wrongValue;
      let fixRight;
      let fixWrong;
      let kindName;
      if (kind === "whole") {
        const n = num(X.n);
        wrongValue = R(top, bottom * n);
        steps = [
          `${n} × ${mk(Y)}`,
          `Multiply the top and the bottom by ${n}: ${fr(top, num(Y.d) * n)}`,
          `Write the answer: ${mk(wrongValue)}`,
        ];
        fixRight = `Multiply only the top by ${n}: ${n} × ${fr(Y.n, Y.d)} = ${fr(top, Y.d)}.`;
        fixWrong = [
          {
            text: `Multiply the top and the bottom by ${n}: ${fr(top, num(Y.d) * n)} = ${mk(wrongValue)}.`,
            why: "Multiplying the denominator too.",
          },
          {
            text: `Add ${n} to the top: ${fr(num(Y.n) + n, Y.d)} = ${mk(R(num(Y.n) + n, num(Y.d)))}.`,
            why: "Adding the whole number to the top.",
          },
          {
            text: `Add instead: ${n} + ${mk(Y)} = ${mk(ratAdd(X, Y))}.`,
            why: "Adding instead of multiplying.",
          },
          {
            text: `Divide instead: ${n} ÷ ${mk(Y)} = ${mk(ratDiv(X, Y))}.`,
            why: "Dividing instead of multiplying.",
          },
        ];
        kindName = "Multiplying the denominator by the whole number.";
      } else {
        const keep = rng.chance();
        wrongValue = keep ? R(top, num(X.d)) : R(top, num(X.d) + num(Y.d));
        steps = [
          `${mk(X)} × ${mk(Y)}`,
          keep
            ? `Multiply the tops and keep the first bottom: ${fr(top, X.d)}`
            : `Multiply the tops and add the bottoms: ${fr(top, num(X.d) + num(Y.d))}`,
          `Write the answer: ${mk(wrongValue)}`,
        ];
        fixRight = `Multiply the tops and the bottoms: ${fr(X.n, X.d)} × ${fr(Y.n, Y.d)} = ${fr(top, bottom)}.`;
        fixWrong = [
          {
            text: `Multiply the tops, keep the first bottom: ${fr(top, X.d)}.`.replace(
              /\.$/,
              ` = ${mk(R(top, num(X.d)))}.`,
            ),
            why: "Keeping one denominator.",
          },
          {
            text: `Add the bottoms: ${fr(top, num(X.d) + num(Y.d))} = ${mk(R(top, num(X.d) + num(Y.d)))}.`,
            why: "Adding the denominators.",
          },
          {
            text: `Add instead: ${mk(X)} + ${mk(Y)} = ${mk(ratAdd(X, Y))}.`,
            why: "Adding instead of multiplying.",
          },
          {
            text: `Divide instead: ${mk(X)} ÷ ${mk(Y)} = ${mk(ratDiv(X, Y))}.`,
            why: "Dividing instead of multiplying.",
          },
        ];
        kindName = keep ? "Keeping a denominator when multiplying." : "Adding the denominators.";
      }
      return errorItem(rng, {
        prompt: `Mia multiplies ${mk(X)} × ${mk(Y)}. One step has a mistake. Find the step and choose the fix.`,
        steps,
        errorIndex: 1,
        expr: `${expr(X)}*${expr(Y)}`,
        fixRight,
        fixWrong,
        hint: "Which part of the fraction should be multiplied?",
        explanation:
          kind === "whole"
            ? `${X.n} × ${Y.n} = ${top}, so ${fr(top, Y.d)} = ${mk(res)}.`
            : mulWork({ X, Y, res }),
        misconception: kindName,
      });
    },
  },
];

// ── divide ──────────────────────────────────────────────────────────────────

/** Dividend and divisor: whole ÷ unit fraction and unit fraction ÷ whole (grade 5), fraction ÷ fraction (grade 6). */
function divNumbers(rng, grade, level, { integerOnly = false } = {}) {
  for (let i = 0; i < 100; i++) {
    let X;
    let Y;
    if (grade === 5) {
      const d = rng.int(2, level === 3 ? 10 : 6);
      const n = rng.int(2, level === 3 ? 12 : 8);
      if (rng.chance()) [X, Y] = [R(n), R(1, d)];
      else [X, Y] = [R(1, d), R(n)];
    } else if (level === 1) {
      const d = rng.pick([3, 4, 5, 6, 8]);
      const c = rng.int(1, 2);
      const q = rng.int(2, 6);
      Y = R(c, d);
      X = ratMul(R(q), Y);
    } else {
      const d1 = rng.pick([2, 3, 4, 5, 6, 8]);
      const d2 = rng.pick([2, 3, 4, 5, 6, 8]);
      Y = R(properOver(rng, d2), d2);
      X = integerOnly ? ratMul(R(rng.int(2, 6)), Y) : R(properOver(rng, d1), d1);
      if (level === 3 && !integerOnly && rng.chance()) X = ratAdd(X, R(rng.int(1, 2)));
    }
    const res = ratDiv(X, Y);
    if (integerOnly && res.d !== 1n) continue;
    if (
      ratCmp(res, R(1)) === 0 ||
      ratCmp(res, R(40)) > 0 ||
      ratCmp(X, R(1)) === 0 ||
      ratCmp(Y, R(1)) === 0
    )
      continue;
    if (grade === 6 && ratCmp(X, Y) === 0) continue;
    return { X, Y, res };
  }
  throw new Error("mathgen: no division pair");
}

function divWork({ X, Y, res }) {
  const r = recip(Y);
  return `Dividing by ${mk(Y)} is the same as multiplying by its reciprocal ${mk(r)}. ${mk(X)} × ${mk(r)} = ${mk(res)}.`;
}

const divExpr = ({ X, Y }) => `${expr(X)}/(${expr(Y)})`;

const fractionDivide = [
  {
    id: "compute",
    make({ rng, grade, level }) {
      const s = divNumbers(rng, grade, level);
      return number({
        prompt: `Divide: ${mk(s.X)} ÷ ${mk(s.Y)}. Write the answer in simplest form.`,
        answer: ans(s.res),
        accept: s.res.n > s.res.d && s.res.d !== 1n ? [expr(s.res)] : [],
        expr: divExpr(s),
        hint: "Change the division to multiplication. Flip the second number.",
        explanation: divWork(s),
        misconception: `Multiplying without flipping (${mk(ratMul(s.X, s.Y))}), or flipping the first number.`,
      });
    },
  },
  {
    id: "word",
    make({ rng, grade, level }) {
      const s = divNumbers(rng, grade, level, { integerOnly: true });
      const name = rng.pick(NAMES);
      return number({
        prompt:
          `${name} has ${mk(s.X)} pound of cheese. Each sandwich uses ${mk(s.Y)} pound. How many sandwiches can ${name} make?`.replace(
            /pound of/,
            s.X.n > s.X.d ? "pounds of" : "pound of",
          ),
        answer: ans(s.res),
        expr: divExpr(s),
        hint: "How many groups of the small amount fit in the big amount? That is division.",
        explanation: divWork(s),
        misconception: "Multiplying the two amounts instead of dividing.",
      });
    },
  },
  {
    id: "choose",
    make({ rng, grade, level }) {
      const { X, Y, res } = divNumbers(rng, grade, level);
      const wrong = [];
      const add = (r, why) => {
        if (r && r.n > 0n) wrong.push({ text: mk(r), why });
      };
      add(ratMul(X, Y), "Multiplying without flipping the second number.");
      add(ratMul(recip(X), Y), "Flipping the first number instead of the second.");
      add(recip(res), "Dividing the wrong way around.");
      add(ratMul(recip(X), recip(Y)), "Flipping both numbers.");
      if (ratCmp(X, Y) > 0) add(ratSub(X, Y), "Subtracting instead of dividing.");
      return choice(rng, {
        prompt: `What is ${mk(X)} ÷ ${mk(Y)}?`,
        answer: mk(res),
        expr: divExpr({ X, Y }),
        wrong,
        hint: "Flip the second number and multiply.",
        explanation: divWork({ X, Y, res }),
        misconception: "Students flip the wrong fraction or forget to flip.",
      });
    },
  },
  {
    id: "find-the-mistake",
    make({ rng, grade, level }) {
      const { X, Y, res } = divNumbers(rng, grade, Math.min(level, 2));
      const rY = recip(Y);
      const rX = recip(X);
      const v = rng.pick(["first", "noflip"]);
      const wrongValue = v === "first" ? ratMul(rX, Y) : ratMul(X, Y);
      const wrong = [
        {
          text: `Flip the first number: ${mk(rX)} × ${mk(Y)} = ${mk(ratMul(rX, Y))}.`,
          why: "Flipping the first number.",
        },
        {
          text: `Multiply without flipping: ${mk(X)} × ${mk(Y)} = ${mk(ratMul(X, Y))}.`,
          why: "Not flipping at all.",
        },
        {
          text: `Flip both: ${mk(rX)} × ${mk(rY)} = ${mk(ratMul(rX, rY))}.`,
          why: "Flipping both numbers.",
        },
      ];
      if (ratCmp(X, Y) > 0)
        wrong.push({
          text: `Subtract: ${mk(X)} − ${mk(Y)} = ${mk(ratSub(X, Y))}.`,
          why: "Subtracting instead of dividing.",
        });
      return errorItem(rng, {
        prompt: `Ravi divides ${mk(X)} ÷ ${mk(Y)}. One step has a mistake. Find the step and choose the fix.`,
        steps: [
          `${mk(X)} ÷ ${mk(Y)}`,
          v === "first"
            ? `Flip the first number: ${mk(rX)} × ${mk(Y)}`
            : `Multiply across: ${mk(X)} × ${mk(Y)}`,
          `Multiply: ${mk(wrongValue)}`,
        ],
        errorIndex: 1,
        expr: divExpr({ X, Y }),
        fixRight: `Flip the second number and multiply: ${mk(X)} × ${mk(rY)} = ${mk(res)}.`,
        fixWrong: wrong,
        hint: "Which number do you flip when you divide?",
        explanation: divWork({ X, Y, res }),
        misconception:
          v === "first" ? "Flipping the first fraction." : "Multiplying without flipping.",
      });
    },
  },
  {
    id: "servings",
    make({ rng, level }) {
      const d = rng.pick(
        level === 1 ? [2, 3, 4] : level === 2 ? [2, 3, 4, 5, 6] : [3, 4, 5, 6, 8, 10],
      );
      const [n0, n1, n2, n3] = rng.sample([1, 2, 3, 4, 5, 6, 7, 8], 4);
      const rows = [
        [String(n0), String(n0 * d)],
        [String(n1), { answer: String(n1 * d) }],
        [String(n2), { answer: String(n2 * d) }],
        [{ answer: String(n3) }, String(n3 * d)],
      ];
      return fillTable({
        prompt: `A serving is 1/${d} cup. Complete the table to show how many servings are in each amount.`,
        headers: ["Cups of juice", `Servings of 1/${d} cup`],
        rows,
        exprs: { "1:1": `r1c0/(1/${d})`, "2:1": `r2c0/(1/${d})`, "3:0": `r3c1*(1/${d})` },
        hint: `Each cup has ${d} servings of 1/${d} cup.`,
        explanation: `${n1} ÷ {1/${d}} = ${n1} × ${d} = ${n1 * d}. ${n2} × ${d} = ${n2 * d}. ${n3 * d} ÷ ${d} = ${n3}.`,
        misconception: `Dividing by ${d} instead of multiplying by ${d}.`,
      });
    },
  },
];

export const FRACTION_TEMPLATES = {
  "fraction-add-sub": fractionAddSub,
  "fraction-multiply": fractionMultiply,
  "fraction-divide": fractionDivide,
};
