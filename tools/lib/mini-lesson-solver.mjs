// An independent solver for the Fluency Lab question shapes, built on the repo's exact rational arithmetic
// (scripts/lib/rational.mjs). It never calls a generator: it reads the question text and recomputes the answer.
// solve(question) -> exact Rat, a string (choices, digits, times), or null when the shape is not covered.
import { evaluateExpression, Rat } from "../../scripts/lib/rational.mjs";
import { solveStrand } from "./strand-solver.mjs";

const val = (text) => evaluateExpression(String(text));
const pad = (n) => String(n).padStart(2, "0");
const PLACES = {
  ones: 0,
  tens: 1,
  hundreds: 2,
  thousands: 3,
  "ten-thousands": 4,
  "hundred-thousands": 5,
  tenths: -1,
  hundredths: -2,
  thousandths: -3,
};
// The digit in a named place of a number, or (value = true) what that digit is worth.
function placeDigit(place, text, value) {
  const at = PLACES[place];
  if (at === undefined) return null;
  const [whole, fraction = ""] = text.replaceAll(",", "").split(".");
  const digit = at >= 0 ? Number(whole.at(-1 - at) ?? 0) : Number(fraction[-at - 1] ?? 0);
  return value ? val(`${digit}*${at >= 0 ? 10 ** at : `1/${10 ** -at}`}`) : Rat.from(BigInt(digit));
}
const UNITS = {
  "kilograms-grams": 1000,
  "meters-centimeters": 100,
  "liters-milliliters": 1000,
  "hours-minutes": 60,
  "feet-inches": 12,
  "yards-feet": 3,
  "weeks-days": 7,
  "days-hours": 24,
  "gallons-quarts": 4,
  "pounds-ounces": 16,
  "minutes-seconds": 60,
  "kilometers-meters": 1000,
  "yards-inches": 36,
  "quarts-pints": 2,
  "pints-cups": 2,
  "cups-ounces": 8,
};
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const cmp = (a, b) => (a.sub(b).n === 0n ? "=" : a.sub(b).n > 0n ? ">" : "<");

// Find x by substituting whole numbers: for "9x = 90", "8x + 7 = 103", "x/3 = 4", "8/9 = x/63".
function bySubstitution(left, right, variable) {
  const fix = (side, value) =>
    side.replace(/(\d)\s*([a-z□?])/g, "$1*$2").replaceAll(variable, `(${value})`);
  for (let v = -400; v <= 4000; v += 1) {
    const a = val(fix(left, v));
    const b = val(fix(right, v));
    if (a && b && a.eq(b)) return Rat.from(BigInt(v));
  }
  return null;
}

const FORMS = [
  [
    /^Round ([\d,]+) to the nearest ([a-z-]+)\.$/,
    (value, place) => {
      const size = {
        ten: 10,
        hundred: 100,
        thousand: 1000,
        "ten-thousand": 10000,
        "hundred-thousand": 100000,
      }[place];
      const n = Number(value.replaceAll(",", ""));
      return size ? Rat.from(BigInt(Math.floor(n / size + 0.5) * size)) : null;
    },
  ],
  [/^What is (\d+)\/(\d+) of (\d+)\?$/, (a, b, w) => val(`${a}/${b}*${w}`)],
  [/^What is ([\d.]+)% of ([\d.]+)\?$/, (p, w) => val(`${p}%*${w}`)],
  [/^Area of a rectangle with length (\d+) and width (\d+)\?$/, (l, w) => val(`${l}*${w}`)],
  [
    /^Perimeter of a rectangle with length (\d+) and width (\d+)\?$/,
    (l, w) => val(`2*(${l}+${w})`),
  ],
  [/^Volume of a rectangular prism: (\d+) × (\d+) × (\d+)\?$/, (l, w, h) => val(`${l}*${w}*${h}`)],
  [/^Area of a triangle with base (\d+) and height (\d+)\?$/, (b, h) => val(`${b}*${h}/2`)],
  [/^A circle has radius (\d+)\./, (r) => val(`${r}*${r}`)],
  [/^(\d+) of (\d+) equal sections are winning sections/, (a, b) => val(`${a}/${b}`)],
  [
    /^A right triangle has legs (\d+) and (\d+)\./,
    (a, b) => Rat.from(BigInt(Math.round(Math.sqrt(a * a + b * b)))),
  ],
  [/^√(\d+) = \?$/, (n) => Rat.from(BigInt(Math.round(Math.sqrt(Number(n)))))],
  [
    /^Find the (GCF|LCM) of (\d+) and (\d+)\.$/,
    (kind, a, b) => Rat.from(BigInt(kind === "GCF" ? gcd(+a, +b) : (+a * +b) / gcd(+a, +b))),
  ],
  [
    /^([\d.]+) for (\d+) items\. How much for 1 item\?$/,
    (total, items) => val(`${total}/${items}`),
  ],
  [
    /^([\d.]+) with a (\d+)% (increase|decrease) equals what\?$/,
    (v, p, dir) => val(`${v}*(1${dir === "increase" ? "+" : "-"}${p}/100)`),
  ],
  [
    /^Find the slope through \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)\.$/,
    (x1, y1, x2, y2) => val(`(${y2}-(${y1}))/(${x2}-(${x1}))`),
  ],
  [/^x \+ y = (-?\d+) and x − y = (-?\d+)\. Find x\.$/, (s, d) => val(`(${s}+(${d}))/2`)],
  [
    /^Evaluate (.+) when x = (-?\d+)\.$/,
    (expr, x) => val(expr.replace(/(\d)x/g, "$1*x").replaceAll("x", `(${x})`)),
  ],
  [
    /^If y = (.+), find y when x = (-?\d+)\.$/,
    (expr, x) => val(expr.replace(/(\d)x/g, "$1*x").replaceAll("x", `(${x})`)),
  ],
  [/^(\d+)\^(\d+) = \?$/, (b, e) => Rat.from(BigInt(b) ** BigInt(e))],
  [
    /^([\d.]+) × 10\^(-?\d+) = \?$/,
    (m, e) =>
      val(`${m}*${Number(e) >= 0 ? `1${"0".repeat(Number(e))}` : `1/1${"0".repeat(-Number(e))}`}`),
  ],
  [
    /^What time is (\d+) minutes after (\d+):(\d+)\?$/,
    (add, h, m) => {
      const total = Number(h) * 60 + Number(m) + Number(add);
      return `${((Math.floor(total / 60) + 11) % 12) + 1}:${pad(total % 60)}`;
    },
  ],
  [/^(\d+)\/(\d+) = (\d+)\/□$/, (a, b, c) => val(`${c}*${b}/${a}`)],
  [/^(\d+)\/(\d+) = □\/(\d+)$/, (a, b, d) => val(`${a}*${d}/${b}`)],
  [/^(\d+):(\d+) = □:(\d+)$/, (a, b, d) => val(`${a}*${d}/${b}`)],
  [/^(\d+):(\d+) = (\d+):□$/, (a, b, c) => val(`${b}*${c}/${a}`)],
  [/^(\d+)\/(\d+) = x\/(\d+)\. Find x\.$/, (a, b, d) => val(`${a}*${d}/${b}`)],
  [
    /^(-?[\d,]+(?:\.\d+)?|\d+\/\d+) ___ (-?[\d,]+(?:\.\d+)?|\d+\/\d+)$/,
    (a, b) => cmp(val(a), val(b)),
  ],
  [/^Is (\d+) even or odd\?$/, (n) => (Number(n) % 2 ? "odd" : "even")],
  [/^Is (\d+) a factor of (\d+)\?$/, (a, b) => (Number(b) % Number(a) ? "no" : "yes")],
  [
    /^Is (-?\d+) a solution to x ([<>≤≥]) (-?\d+)\?$/,
    (x, op, c) => {
      const order = cmp(val(x), val(c));
      const holds = {
        "<": order === "<",
        ">": order === ">",
        "≤": order !== ">",
        "≥": order !== "<",
      }[op];
      return holds ? "yes" : "no";
    },
  ],
  [/^What is the (\d+)(?:st|nd|rd|th) multiple of (\d+)\?$/, (n, k) => val(`${n}*${k}`)],
  [
    /^A class vote shows (.+)\. Which fruit got the most votes\?$/,
    (list) => {
      const rows = list.split(", ").map((part) => part.split(": "));
      return rows.sort((a, b) => Number(b[1]) - Number(a[1]))[0][0];
    },
  ],
  [
    /^Is (\d+) prime or composite\?$/,
    (n) =>
      Number(n) > 1 &&
      Array.from({ length: Number(n) - 2 }, (_, i) => i + 2).every((d) => Number(n) % d)
        ? "prime"
        : "composite",
  ],
  [
    /^Find the mean: ((?:-?\d+(?:, )?)+)\.$/,
    (list) => {
      const v = list.split(", ").map(Number);
      return val(`(${v.join("+")})/${v.length}`);
    },
  ],
  [
    /^What digit is in the ([a-z-]+) place of ([\d,.]+)\?$/,
    (place, n) => placeDigit(place, n, false),
  ],
  [
    /^What is the value of the digit in the ([a-z-]+) place of ([\d,.]+)\?$/,
    (place, n) => placeDigit(place, n, true),
  ],
  [/^Is (\d+) a multiple of (\d+)\?$/, (a, b) => (Number(a) % Number(b) ? "no" : "yes")],
  [
    /^(\d+) ([a-z]+) = how many ([a-z]+)\?$/,
    (n, from, to) => (UNITS[`${from}-${to}`] ? val(`${n}*${UNITS[`${from}-${to}`]}`) : null),
  ],
  [
    /^A ribbon that is 1\/(\d+) meter long is shared equally by (\d+) students\./,
    (a, b) => val(`1/${a}/${b}`),
  ],
  [
    /^A jug holds (\d+) liters\. How many 1\/(\d+)-liter servings can it fill\?$/,
    (a, b) => val(`${a}*${b}`),
  ],
  [/^\|(-?\d+)\| = \?$/, (n) => val(String(Math.abs(Number(n))))],
  [
    /^Find the range: ((?:-?\d+(?:, )?)+)\.$/,
    (list) => {
      const v = list.split(", ").map(Number);
      return Rat.from(BigInt(Math.max(...v) - Math.min(...v)));
    },
  ],
  [
    /^Two (supplementary|complementary) angles include one angle that measures (\d+)°\./,
    (kind, a) => val(`${kind === "supplementary" ? 180 : 90}-${a}`),
  ],
  [/^Reflect \((-?\d+), (-?\d+)\) across the x-axis\.$/, (x, y) => `(${x}, ${-Number(y) || 0})`],
  [
    /^How many factors does (\d+) have\?$/,
    (n) =>
      Rat.from(
        BigInt(
          Array.from({ length: Number(n) }, (_, i) => i + 1).filter((d) => Number(n) % d === 0)
            .length,
        ),
      ),
  ],
  [
    /^Which quadrant contains \((-?\d+), (-?\d+)\)\?$/,
    (x, y) => (Number(x) > 0 ? (Number(y) > 0 ? "I" : "IV") : Number(y) > 0 ? "II" : "III"),
  ],
  [
    /^Find the median: ((?:-?\d+(?:, )?)+)\.$/,
    (list) => {
      const v = list
        .split(", ")
        .map(Number)
        .sort((p, q) => p - q);
      return val(
        String(v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2),
      );
    },
  ],
  [
    /^Reflect \((-?\d+), (-?\d+)\) across the origin\.$/,
    (x, y) => `(${-Number(x) || 0}, ${-Number(y) || 0})`,
  ],
  [
    /^(\d+) quarters \+ (\d+) dimes \+ (\d+) nickels \+ (\d+) pennies = how many cents\?$/,
    (q, d, n, p) => val(`${q}*25+${d}*10+${n}*5+${p}`),
  ],
  [/^A strip starts at (\d+) cm and ends at (\d+) cm on a ruler\./, (a, b) => val(`${b}-${a}`)],
  [/^Reflect \((-?\d+), (-?\d+)\) across the y-axis\.$/, (x, y) => `(${-Number(x) || 0}, ${y})`],
  [/^One of two vertical angles measures (\d+)°\./, (a) => Rat.from(BigInt(a))],
  [
    /^A scale drawing uses (\d+) cm to represent (\d+) m\. A wall is (\d+) cm long/,
    (a, b, c) => val(`${c}*${b}/${a}`),
  ],
];

export function solve(question) {
  const text = String(question).trim();
  const strand = solveStrand(text);
  if (strand !== null && strand !== undefined) return strand;
  for (const [pattern, run] of FORMS) {
    const match = text.match(pattern);
    if (match) return run(...match.slice(1));
  }
  const sequence = text.match(/^((?:-?[\d,]+, )+)___$/);
  if (sequence) {
    const values = sequence[1]
      .split(", ")
      .filter(Boolean)
      .map((x) => Number(x.replaceAll(",", "")));
    const step = values[1] - values[0];
    return values.slice(1).every((v, i) => v - values[i] === step)
      ? Rat.from(BigInt(values.at(-1) + step))
      : null;
  }
  const open = text.match(/^(.+?) = \?$/);
  if (open) return val(open[1]);
  const blank = text.match(
    /^(.+) = (.+)\. (?:Find x|What belongs in the box)\.?\??$|^(.+?) = (.+?)\. (?:What belongs in the box\?)$/,
  );
  const sides = text.match(/^(.+?) = (-?[\d.,]+)\. (?:Find x\.|What belongs in the box\?)$/);
  if (sides)
    return bySubstitution(
      sides[1],
      sides[2],
      sides[1].includes("x") ? "x" : sides[1].includes("□") ? "□" : "?",
    );
  void blank;
  const missing = text.match(/^(.+) = (-?[\d.,]+)\?$/);
  void missing;
  const question2 = text.match(/^(.+\?.*) = (-?[\d.,]+)$/) || text.match(/^(.*[?□].*) = (-?\d+)$/);
  if (question2)
    return bySubstitution(question2[1], question2[2], question2[1].includes("□") ? "□" : "?");
  return null;
}

// Does this answer string state the value the solver found?
export function sameValue(found, answer) {
  if (found === null || found === undefined) return null;
  if (typeof found === "string")
    return (
      String(answer).toLowerCase().replace(/\s+/g, "") === found.toLowerCase().replace(/\s+/g, "")
    );
  const stated = evaluateExpression(
    String(answer)
      .replace(/[a-z°¢ ]+$/i, "")
      .replace(/^(\d+)\s+(\d+\/\d+)$/, "($1+$2)"),
  );
  return stated !== null && found.eq(stated);
}
