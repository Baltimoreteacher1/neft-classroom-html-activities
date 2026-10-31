// Whole-number multiplication and division: skill specs, number draws by level, guided steps and wrong-answer slips.
// Shared by fam-muldiv.js (types), muldiv-forms.js (compute, missing-number), muldiv-pictures.js, muldiv-stories.js
// and muldiv-explain.js.
//
// Every problem is x * y = p. For a multiplication skill the stem is "x × y"; for a division skill it is "p ÷ y"
// (x is the quotient, y the divisor). A spec gives the ranges of x and y and the shape of the skill:
//   fact  basic facts (a pool for x for the 0-5 and 6-9 skills)    tens  one digit times a multiple of ten
//   big   multi-digit factors / dividends (regrouping, long division)
import { fmt, int, pick } from "./kit.js";
import { Q } from "./rational.js";

const range = (lo, hi) => ({ lo, hi });
export const SPECS = {
  "3:mul-0-5": { op: "mul", shape: "fact", x: { pool: [0, 1, 2, 3, 4, 5] }, y: range(2, 10) },
  "3:mul-6-9": { op: "mul", shape: "fact", x: { pool: [6, 7, 8, 9] }, y: range(2, 9) },
  "3:mul-10-12": {
    op: "mul",
    shape: "tens",
    x: range(2, 9),
    y: { pool: [10, 20, 30, 40, 50, 60, 70, 80, 90] },
  },
  "3:division-facts": { op: "div", shape: "fact", x: range(2, 9), y: range(2, 9) },
  "4:multiply-1digit": { op: "mul", shape: "big", x: range(100, 999), y: range(2, 9) },
  "4:multiply-2digit": { op: "mul", shape: "big", x: range(10, 99), y: range(10, 99) },
  "4:division": { op: "div", shape: "big", x: range(10, 99), y: range(2, 9), cap: 891 },
  "5:multiply-whole": { op: "mul", shape: "big", x: range(100, 999), y: range(10, 99) },
  "5:divide-whole": {
    op: "div",
    shape: "big",
    x: range(10, 200),
    y: range(2, 24),
    cap: 4800,
    twoDigit: true,
  },
};

export const digitsOf = (n) => String(n).split("").reverse().map(Number);
export const partsOf = (n) =>
  String(n)
    .split("")
    .map((d, i, all) => Number(d) * 10 ** (all.length - 1 - i))
    .filter((v) => v > 0);
export const hasZero = (n) => /0/.test(String(n).slice(1));
export const isTwoDigitY = (spec) => spec.y.lo >= 10 && spec.op === "mul";

// carries produced when x is multiplied by one digit (and by every digit of y)
function carriesBy(x, d) {
  let carry = 0;
  let count = 0;
  for (const digit of digitsOf(x)) {
    carry = Math.floor((digit * d + carry) / 10);
    if (carry) count += 1;
  }
  return count;
}
export const mulCarries = (x, y) =>
  digitsOf(y).reduce((sum, d) => sum + (d ? carriesBy(x, d) : 0), 0);
// remainders carried to the next digit in a long division of p by d
export function divCarries(p, d) {
  let rest = 0;
  let count = 0;
  for (const ch of String(p)) {
    rest = (rest * 10 + Number(ch)) % d;
    if (rest) count += 1;
  }
  return count;
}

const ANY = () => true;
const same = (list) => [...list, list.at(-1)];
const hardFact = (x, y, s) => x >= 3 && y >= (s.x.pool && s.x.pool[0] >= 6 ? 6 : 3);
const bigDivScope = (s, y) => !s.twoDigit || y >= 10;
// RULES[shape/op][level]: a predicate (or a list tried in order, then any) for the (x, y) drawn at that level
const RULES = {
  "fact/mul": [
    ANY,
    (x, y) => x >= 2 && y <= 5,
    (x, y) => [0, 1, 2, 5].includes(x) || [2, 5, 10].includes(y),
    ANY,
    hardFact,
    hardFact,
  ],
  "fact/div": [
    ANY,
    (x, y) => x <= 5 && y <= 5,
    (x, y) => [2, 5].includes(x) || [2, 5].includes(y),
    ANY,
    (x, y) => x >= 4 && y >= 4,
    ANY,
  ],
  "tens/mul": [
    ANY,
    (x, y) => x <= 5 && y <= 30,
    (x, y) => y <= 50,
    ANY,
    (x, y) => (x * y) / 10 >= 10,
    ANY,
  ],
  "big/mul": [
    ANY,
    (x, y, s) => mulCarries(x, y) === 0 && (!isTwoDigitY(s) || y % 10 !== 0),
    (x, y, s) => (isTwoDigitY(s) ? y % 10 === 0 : mulCarries(x, y) === 1),
    (x, y, s) => !isTwoDigitY(s) || y % 10 !== 0,
    [
      (x, y, s) =>
        mulCarries(x, y) >= (isTwoDigitY(s) ? 3 : 2) &&
        hasZero(x) &&
        (!isTwoDigitY(s) || y % 10 !== 0),
      (x, y, s) =>
        mulCarries(x, y) >= (isTwoDigitY(s) ? 3 : 2) && (!isTwoDigitY(s) || y % 10 !== 0),
    ],
    ANY,
  ],
  "big/div": [
    ANY,
    (x, y) => y <= 9 && divCarries(x * y, y) === 0,
    (x, y) => y <= 9 && divCarries(x * y, y) === 1,
    (x, y, s) => bigDivScope(s, y),
    [
      (x, y, s) => bigDivScope(s, y) && hasZero(x) && divCarries(x * y, y) >= 1,
      (x, y, s) => bigDivScope(s, y) && divCarries(x * y, y) >= 2,
    ],
    ANY,
  ],
};

const pickFrom = (rng, r) => (r.pool ? pick(rng, r.pool) : int(rng, r.lo, r.hi));

// (x, y, p) for a skill at a level. visual: both numbers at least 2 (a picture needs rows and columns).
export function draw(rng, spec, level, { visual = false } = {}) {
  const rule = RULES[`${spec.shape}/${spec.op}`][level];
  for (const test of [...[].concat(rule), ANY]) {
    for (let i = 0; i < 1500; i += 1) {
      const x = pickFrom(rng, spec.x);
      const y = pickFrom(rng, spec.y);
      if ((!visual || (x >= 2 && y >= 2)) && test(x, y, spec)) return { x, y, p: x * y };
    }
  }
  throw new Error("no numbers for this level");
}

export const stemOf = (spec, x, y, p) =>
  spec.op === "mul" ? `${fmt(x)} × ${fmt(y)} = ?` : `${fmt(p)} ÷ ${fmt(y)} = ?`;
export const exprOf = (spec, x, y, p) => (spec.op === "mul" ? `${x}*${y}` : `${p}/${y}`);
export const answerOf = (spec, x, p) => (spec.op === "mul" ? p : x);

// Wrong answers: [{ v: number, why }] -> kept only when whole, not negative, unique and not the key.
export function wrongs(list, key) {
  const seen = new Set([key]);
  const out = [];
  for (const w of list) {
    if (!Number.isInteger(w.v) || w.v < 0 || seen.has(w.v)) continue;
    seen.add(w.v);
    out.push({ v: Q(w.v), why: w.why });
  }
  if (!out.length) throw new Error("no usable wrong answers");
  return out;
}

// ---------- guided steps ----------
function factSteps(x, y, p) {
  const line = `${x} × ${y} = ${p}.`;
  if (x === 0 || y === 0)
    return ["Zero groups, or zero in each group, leaves nothing to count.", line];
  if (x === 1) return [`One group of ${y} has just ${y} in it.`, line];
  const big = Math.max(x, y);
  const small = Math.min(x, y);
  if (big === 10)
    return [
      "Multiplying by 10 moves each digit one place to the left.",
      `${small} × 10 is ${small} tens.`,
      line,
    ];
  if (big === 9)
    return [
      `9 is one less than 10. Think of 10 groups of ${small}, then take away 1 group.`,
      `10 × ${small} = ${10 * small}, and 1 × ${small} = ${small}.`,
      `${10 * small} − ${small} = ${p}, so ${line}`,
    ];
  if (big >= 6)
    return [
      `Split ${big} into 5 and ${big - 5}.`,
      `5 × ${small} = ${5 * small}, and ${big - 5} × ${small} = ${(big - 5) * small}.`,
      `${5 * small} + ${(big - 5) * small} = ${p}, so ${line}`,
    ];
  const list = Array.from({ length: x - 1 }, (_, i) => (i + 1) * y).join(", ");
  return [
    `Think of ${x} groups with ${y} in each group.`,
    `Skip count by ${y}, ${x} times: ${list}, …`,
    line,
  ];
}

function tensSteps(x, y, p) {
  const k = y / 10;
  return [
    `Cover the zero in ${y}. Multiply the basic fact: ${x} × ${k}.`,
    `${x} × ${k} = ${x * k}, so the product is ${x * k} tens.`,
    `${x * k} tens is ${fmt(p)}, so ${x} × ${y} = ${fmt(p)}.`,
  ];
}

function bigMulSteps(x, y, p) {
  const line = `${fmt(x)} × ${fmt(y)} = ${fmt(p)}.`;
  if (y >= 10) {
    if (y % 10 === 0)
      return [
        `${y} is ${y / 10} tens. Multiply by ${y / 10} first, then by 10.`,
        `${fmt(x)} × ${y / 10} = ${fmt(x * (y / 10))}.`,
        `Now multiply by 10: ${line}`,
      ];
    const [t, o] = [y - (y % 10), y % 10];
    return [
      `Break ${y} into ${t} + ${o}.`,
      `${fmt(x)} × ${t} = ${fmt(x * t)}, and ${fmt(x)} × ${o} = ${fmt(x * o)}.`,
      `${fmt(x * t)} + ${fmt(x * o)} = ${fmt(p)}, so ${line}`,
    ];
  }
  const parts = partsOf(x);
  if (parts.length < 2) throw new Error("single-part factor");
  const pp = parts.map((part) => part * y);
  return [
    `Break ${fmt(x)} into ${parts.join(" + ")}.`,
    parts.map((part) => `${part} × ${y} = ${fmt(part * y)}`).join(", ") + ".",
    `${pp.map(fmt).join(" + ")} = ${fmt(p)}, so ${line}`,
  ];
}

function factDivSteps(x, y, p) {
  return [
    `Division undoes multiplication: think ${y} × ? = ${p}.`,
    `Count up by ${y} from 0 until you reach ${p}, or use a multiplication fact you know.`,
    `${p} ÷ ${y} = ${x}, because ${y} × ${x} = ${p}.`,
  ];
}

function bigDivSteps(x, y, p) {
  const line = `${fmt(p)} ÷ ${y} = ${fmt(x)}.`;
  const parts = partsOf(x);
  if (parts.length < 2) {
    const z = String(x).length - 1;
    const lead = x / 10 ** z;
    return [
      `Think ${y} × ? = ${fmt(p)}. Use the basic fact for the leading digits.`,
      `${fmt(p / 10 ** z)} ÷ ${y} = ${lead}, so the quotient is ${lead} followed by ${z} zero${z > 1 ? "s" : ""}.`,
      line,
    ];
  }
  return [
    `Split ${fmt(p)} into parts that ${y} divides evenly: ${parts.map((part) => fmt(part * y)).join(" + ")}.`,
    `${parts.map((part) => `${fmt(part * y)} ÷ ${y} = ${fmt(part)}`).join(", ")}.`,
    `${parts.map(fmt).join(" + ")} = ${fmt(x)}, so ${line}`,
  ];
}

const STEPS = {
  "fact/mul": factSteps,
  "tens/mul": tensSteps,
  "big/mul": bigMulSteps,
  "fact/div": factDivSteps,
  "big/div": bigDivSteps,
};
export const stepsFor = (spec, x, y, p) => STEPS[`${spec.shape}/${spec.op}`](x, y, p);

// ---------- wrong answers, each from a named slip ----------
function bigMulSlips(x, y, p) {
  const out = [{ v: x + y, why: "added the factors instead of multiplying" }];
  if (y < 10) {
    const noCarry = digitsOf(x).reduce((s, d, i) => s + ((d * y) % 10) * 10 ** i, 0);
    out.push({
      v: noCarry,
      why: "wrote only the ones digit of each product and forgot the regrouped amount",
    });
    out.push({ v: y * (x % 100), why: "left out the hundreds part of the factor" });
    out.push({
      v: p - y * (x % 10) + y * ((x % 10) + 1),
      why: "added one too many in the ones place",
    });
    return out;
  }
  const [t, o] = [y - (y % 10), y % 10];
  out.push({
    v: x * t + x * o * 1 - x * t + x * (t / 10),
    why: "forgot the zero placeholder: used the tens digit as ones",
  });
  out.push({ v: x * o, why: "left out the tens partial product" });
  const hd = (n) => [Math.floor(n / 10), n % 10];
  if (x < 100)
    out.push({
      v: hd(x)[0] * hd(y)[0] * 100 + hd(x)[1] * hd(y)[1],
      why: "multiplied only tens by tens and ones by ones",
    });
  else out.push({ v: x * t, why: "left out the ones partial product" });
  return out;
}

export function slipsFor(spec, x, y, p) {
  const key = answerOf(spec, x, p);
  const k = `${spec.shape}/${spec.op}`;
  if (k === "fact/mul") {
    const out = [
      { v: x + y, why: "added the factors instead of multiplying" },
      { v: p + y, why: "counted one group too many" },
      { v: p - y, why: "stopped one group early" },
    ];
    if (x === 0 || y === 0)
      out.push({ v: x + y, why: "thought zero times a number leaves the number" });
    return wrongs(out, key);
  }
  if (k === "tens/mul")
    return wrongs(
      [
        { v: p / 10, why: "left off the zero" },
        { v: p * 10, why: "wrote an extra zero" },
        { v: x + y, why: "added instead of multiplying" },
        { v: p + y, why: "counted one group too many" },
      ],
      key,
    );
  if (k === "big/mul") return wrongs(bigMulSlips(x, y, p), key);
  if (k === "fact/div")
    return wrongs(
      [
        { v: p * y, why: "multiplied instead of dividing" },
        { v: p - y, why: "subtracted instead of dividing" },
        { v: x + 1, why: "used the next multiplication fact" },
        { v: x - 1, why: "used the previous multiplication fact" },
      ],
      key,
    );
  const flipped = Number([...String(x)].reverse().join(""));
  return wrongs(
    [
      { v: p - y, why: "subtracted instead of dividing" },
      { v: x + 10, why: "made the first quotient digit one too large" },
      { v: x - 10, why: "made the first quotient digit one too small" },
      { v: flipped, why: "put the quotient digits in the wrong places" },
      { v: Number(String(x).replace(/0/g, "")) || x + 1, why: "dropped a zero from the quotient" },
    ],
    key,
  );
}
