// Whole-number addition and subtraction: number domains, regrouping counts, steps and wrong-answer slips,
// shared by fam-whole-addsub.js (types) and fam-whole-addsub-more.js (stories, equations, explanations).
import { ASCII, SYMBOL, fmt, int } from "./kit.js";
import { Q } from "./rational.js";

// lo/hi bound the operands; top bounds the sum (and the minuend). ops lists the operations a skill practises.
export const SPECS = {
  "0:story-add-sub-10": { lo: 1, hi: 5, top: 10, ops: ["add", "sub"] },
  "0:add-sub-5": { lo: 1, hi: 4, top: 5, ops: ["add", "sub"] },
  "1:missing-addend": { lo: 1, hi: 9, top: 20, ops: ["add"] },
  "1:add-10": { lo: 1, hi: 9, top: 10, ops: ["add"] },
  "1:subtract-10": { lo: 1, hi: 9, top: 10, ops: ["sub"] },
  "1:add-20": { lo: 2, hi: 10, top: 20, ops: ["add"] },
  "1:subtract-20": { lo: 2, hi: 10, top: 20, ops: ["sub"] },
  "2:facts-20": { lo: 2, hi: 10, top: 20, ops: ["add"] },
  "2:sub-facts-20": { lo: 2, hi: 10, top: 20, ops: ["sub"] },
  "2:add-100": { lo: 10, hi: 50, top: 100, ops: ["add"] },
  "2:subtract-100": { lo: 10, hi: 50, top: 100, ops: ["sub"] },
  "2:add-1000": { lo: 100, hi: 499, top: 999, ops: ["add"] },
  "3:add-sub-1000": { lo: 100, hi: 499, top: 999, ops: ["add", "sub"] },
  "4:add-large": { lo: 1000, hi: 49999, top: 99999, ops: ["add"] },
  "4:subtract-large": { lo: 1000, hi: 50000, top: 99999, ops: ["sub"] },
};

const digitsOf = (n) => String(n).split("").reverse().map(Number);
export function carries(a, b) {
  const [A, B] = [digitsOf(a), digitsOf(b)];
  let carry = 0;
  let count = 0;
  for (let i = 0; i < Math.max(A.length, B.length); i += 1) {
    carry = (A[i] || 0) + (B[i] || 0) + carry >= 10 ? 1 : 0;
    count += carry;
  }
  return count;
}
export function borrows(a, b) {
  const [A, B] = [digitsOf(a), digitsOf(b)];
  let borrow = 0;
  let count = 0;
  for (let i = 0; i < A.length; i += 1) {
    borrow = A[i] - borrow - (B[i] || 0) < 0 ? 1 : 0;
    count += borrow;
  }
  return count;
}
export const regroups = (op, a, b) => (op === "add" ? carries(a, b) : borrows(a, b));
const FITS = { none: (r) => r === 0, one: (r) => r === 1, many: (r) => r >= 2, any: () => true };
const RELAX = { many: ["many", "one", "any"], one: ["one", "any"], none: ["none", "any"], any: ["any"] };

// A pair (a, b) for op inside the spec, with the wanted amount of regrouping (relaxed when the range has none).
export function drawPair(rng, spec, op, want = "any", extra = () => true) {
  for (const level of RELAX[want]) {
    for (let i = 0; i < 400; i += 1) {
      const b = int(rng, spec.lo, spec.hi);
      const a = op === "add" ? int(rng, spec.lo, spec.hi) : int(rng, Math.max(spec.lo + 1, b + 1), spec.top);
      if (op === "add" ? a + b > spec.top : b >= a) continue;
      if (FITS[level](regroups(op, a, b)) && extra(a, b)) return [a, b];
    }
  }
  throw new Error("no pair");
}
export const result = (op, a, b) => (op === "add" ? a + b : a - b);
export const stem = (a, op, b) => `${fmt(a)} ${SYMBOL[op]} ${fmt(b)} = ?`;
export const expr = (a, op, b) => `${a}${ASCII[op]}${b}`;
export const small = (spec) => spec.top <= 20;
export const nearTen = (spec) => spec.top <= 100;

const PLACE = ["ones", "tens", "hundreds", "thousands", "ten thousands"];
const sumLine = (a, b, i) => {
  const [A, B] = [digitsOf(a), digitsOf(b)];
  return [A[i] || 0, B[i] || 0];
};

// Guided steps. Small numbers: count on / make a ten / count back. Larger: one place per step, right to left.
export function stepsFor(op, a, b, c) {
  const line = `${fmt(a)} ${SYMBOL[op]} ${fmt(b)} = ${fmt(c)}.`;
  if (a <= 20 && b <= 20) {
    if (op === "add" && a < 10 && a + b > 10 && b <= 10)
      return [
        `Make a ten first: ${a} needs ${10 - a} more to reach 10.`,
        `Split ${b} into ${10 - a} and ${b - (10 - a)}.`,
        `Add the ten and the part that is left over.`,
        line,
      ];
    return op === "add"
      ? [`Start with ${a}. Join ${b} more.`, `Count on from ${a}, one at a time, ${b} times.`, line]
      : [`Start with ${a} and take away ${b}.`, `Count back ${b} from ${a}, or think: ${b} plus what makes ${a}?`, line];
  }
  const out = [`Line up the numbers by place value.`];
  const places = Math.max(digitsOf(a).length, digitsOf(b).length);
  let carry = 0;
  for (let i = 0; i < places; i += 1) {
    const [x, y] = sumLine(a, b, i);
    const name = `${PLACE[i][0].toUpperCase()}${PLACE[i].slice(1)}`;
    if (op === "add") {
      const total = x + y + carry;
      out.push(`${name}: ${x} + ${y}${carry ? ` + ${carry}` : ""} = ${total}.${total >= 10 ? ` Write ${total % 10} and carry 1.` : ""}`);
      carry = total >= 10 ? 1 : 0;
    } else {
      const top = x - carry;
      if (top < 0) {
        out.push(`${name}: the digit is 0 and a ten was lent out, so regroup again: 10 − 1 = 9. Then 9 − ${y} = ${9 - y}.`);
        carry = 1;
        continue;
      }
      const need = top < y;
      out.push(`${name}: ${need ? `${top} is less than ${y}, so regroup: ${top + 10} − ${y}` : `${top} − ${y}`} = ${need ? top + 10 - y : top - y}.`);
      carry = need ? 1 : 0;
    }
  }
  if (op === "add" && carry) out.push(`Bring the carried 1 down into the ${PLACE[places]} place.`);
  out.push(line);
  return out;
}

// Plausible wrong answers, each from a named slip. Only whole, non-negative, different values survive.
export function slips(op, a, b, c) {
  const list = [];
  const A = digitsOf(a);
  if (op === "add") {
    list.push({ v: Q(Math.abs(a - b)), why: "subtracted instead of adding" });
    for (let i = 0; i < Math.max(A.length, digitsOf(b).length); i += 1) {
      const [x, y] = sumLine(a, b, i);
      let carry = 0;
      for (let j = 0; j < i; j += 1) {
        const [p, q] = sumLine(a, b, j);
        carry = p + q + carry >= 10 ? 1 : 0;
      }
      if (x + y + carry >= 10) {
        list.push({ v: Q(c - 10 ** (i + 1)), why: "forgot to carry the ten" });
        break;
      }
    }
    list.push({ v: Q(c + 1), why: "counted one too many" }, { v: Q(c - 1), why: "counted one too few" });
  } else {
    list.push({ v: Q(a + b), why: "added instead of subtracting" });
    const colwise = digitsOf(Math.max(a, b)).map((_, i) => Math.abs((A[i] || 0) - (digitsOf(b)[i] || 0)) * 10 ** i).reduce((s, v) => s + v, 0);
    list.push({ v: Q(colwise), why: "subtracted the smaller digit from the larger in each place" });
    if (borrows(a, b)) list.push({ v: Q(c + 10 ** (digitsOf(a).findIndex((d, i) => d - (digitsOf(b)[i] || 0) < 0) + 1)), why: "regrouped but did not reduce the next place" });
    list.push({ v: Q(c + 1), why: "counted back one too few" }, { v: Q(c - 1), why: "counted back one too many" });
  }
  return list.filter((w) => w.v.n >= 0);
}
