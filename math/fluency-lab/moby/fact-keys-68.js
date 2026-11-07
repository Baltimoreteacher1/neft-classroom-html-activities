// Grade 6-8 facts for the per-fact engine: facts a middle-school learner should know without working them out.
// Each key is tracked, answered, practised and reported exactly like a basic fact (fact-model.js):
//   int:mul:-3:4   integer sign rules (add, sub, mul, div)      sq:7    perfect squares (0-15)
//   fdp:3:4        fraction -> percent benchmarks                cube:4  perfect cubes (0-10)
//   dvb:84:3       divisibility rules (yes or no)                gcf:8:12 / lcm:4:6  GCF and LCM pairs (to 12)
//   rate:24:6      unit-rate mental math (24 for 6 -> 4 for 1)
// Pure; no storage, no clock. Answers are checked as typed text, so every accepted form is listed.

const INT_RE = /^int:(add|sub|mul|div):(-?\d{1,2}):(-?\d{1,2})$/;
const ONE_RE = /^(sq|cube):(\d{1,2})$/;
const TWO_RE = /^(fdp|dvb|gcf|lcm|rate):(\d{1,3}):(\d{1,3})$/;
export const QUESTION_TEMPLATES_68 = Object.freeze([
  "Is {n} divisible by {d}? (yes or no)",
  "GCF of {a} and {b} = ?",
  "LCM of {a} and {b} = ?",
  "${total} for {n} items. $? for 1 item",
]);
export const KINDS_68 = Object.freeze(["int", "sq", "cube", "fdp", "dvb", "gcf", "lcm", "rate"]);
const MINUS = "−";
const signed = (n) => (n < 0 ? `${MINUS}${-n}` : String(n));
const paren = (n) => (n < 0 ? `(${signed(n)})` : String(n));
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
// Benchmark fractions whose percent is a whole number or a familiar repeating value.
export const FDP_PAIRS = Object.freeze([
  [1, 2],
  [1, 4],
  [3, 4],
  [1, 5],
  [2, 5],
  [3, 5],
  [4, 5],
  [1, 10],
  [3, 10],
  [7, 10],
  [9, 10],
  [1, 8],
  [3, 8],
  [5, 8],
  [7, 8],
  [1, 20],
  [1, 25],
  [1, 50],
  [1, 100],
]);
const DIVISORS = [2, 3, 4, 5, 6, 9, 10];
const fdpOk = (n, d) => FDP_PAIRS.some(([a, b]) => a === n && b === d);

export function parse68(key) {
  const text = String(key ?? "");
  let m = INT_RE.exec(text);
  if (m) return { kind: "int", op: m[1], x: Number(m[2]), y: Number(m[3]) };
  m = ONE_RE.exec(text);
  if (m) return { kind: m[1], x: Number(m[2]) };
  m = TWO_RE.exec(text);
  if (m) return { kind: m[1], x: Number(m[2]), y: Number(m[3]) };
  return null;
}

export function isTracked68(key) {
  const p = parse68(key);
  if (!p) return false;
  const { kind, op, x, y } = p;
  if (kind === "int") {
    if (x >= 0 && y >= 0) return false; // at least one negative
    if (op === "div") return y !== 0 && Math.abs(y) <= 12 && x % y === 0 && Math.abs(x / y) <= 12;
    return Math.abs(x) <= 12 && Math.abs(y) <= 12;
  }
  if (kind === "sq") return x <= 15;
  if (kind === "cube") return x <= 10;
  if (kind === "fdp") return fdpOk(x, y);
  if (kind === "dvb") return DIVISORS.includes(y) && x >= 12 && x <= 999;
  if (kind === "gcf" || kind === "lcm") return x >= 2 && y > x && y <= 12;
  if (kind === "rate") return y >= 2 && y <= 12 && x % y === 0 && x / y <= 25 && x <= 300;
  return false;
}

// The question, the answer and every accepted way of typing it.
export function parts68(key) {
  if (!isTracked68(key)) return null;
  const { kind, op, x, y } = parse68(key);
  if (kind === "int") {
    const answer = op === "add" ? x + y : op === "sub" ? x - y : op === "mul" ? x * y : x / y;
    const symbol = { add: "+", sub: MINUS, mul: "×", div: "÷" }[op];
    return {
      kind,
      question: `${signed(x)} ${symbol} ${paren(y)} = ?`,
      answer: signed(answer),
      accept: [String(answer), signed(answer)],
    };
  }
  if (kind === "sq")
    return { kind, question: `${x}² = ?`, answer: String(x * x), accept: [String(x * x)] };
  if (kind === "cube")
    return { kind, question: `${x}³ = ?`, answer: String(x ** 3), accept: [String(x ** 3)] };
  if (kind === "fdp") {
    const pct = (x / y) * 100;
    const text = String(Number(pct.toFixed(1)));
    return { kind, question: `${x}/${y} = ?%`, answer: text, accept: [text, `${text}%`] };
  }
  if (kind === "dvb") {
    const yes = x % y === 0;
    return {
      kind,
      question: `Is ${x} divisible by ${y}? (yes or no)`,
      template: "Is {n} divisible by {d}? (yes or no)",
      vars: { n: x, d: y },
      answer: yes ? "yes" : "no",
      accept: yes ? ["yes", "y", "sí", "si"] : ["no", "n"],
    };
  }
  if (kind === "gcf") {
    const g = gcd(x, y);
    return { kind, question: `GCF of ${x} and ${y} = ?`,
      template: "GCF of {a} and {b} = ?",
      vars: { a: x, b: y }, answer: String(g), accept: [String(g)] };
  }
  if (kind === "lcm") {
    const l = (x * y) / gcd(x, y);
    return { kind, question: `LCM of ${x} and ${y} = ?`,
      template: "LCM of {a} and {b} = ?",
      vars: { a: x, b: y }, answer: String(l), accept: [String(l)] };
  }
  return {
    kind,
    question: `$${x} for ${y} items. $? for 1 item`,
    template: "${total} for {n} items. $? for 1 item",
    vars: { total: x, n: y },
    answer: String(x / y),
    accept: [String(x / y), `$${x / y}`],
  };
}

// A hint that names the rule and never the result.
const HINTS = {
  int: {
    add: "Different signs: subtract the sizes and keep the sign of the larger size. Same signs: add and keep the sign.",
    sub: "Subtracting is adding the opposite. Rewrite it as an addition first.",
    mul: "Same signs give a positive product; different signs give a negative product.",
    div: "Same signs give a positive quotient; different signs give a negative quotient.",
  },
  sq: "A square is a number times itself. Build it from a square you know: add the number and the next number.",
  cube: "A cube is the number times itself three times. Square it first, then multiply by the number again.",
  fdp: "Percent means out of 100. Find an equivalent fraction with 100 (or 1,000) as the denominator.",
  dvb: {
    2: "Divisible by 2: the last digit is even.",
    3: "Divisible by 3: the sum of the digits is divisible by 3.",
    4: "Divisible by 4: the last two digits make a number divisible by 4.",
    5: "Divisible by 5: the last digit is 0 or 5.",
    6: "Divisible by 6: divisible by both 2 and 3.",
    9: "Divisible by 9: the sum of the digits is divisible by 9.",
    10: "Divisible by 10: the last digit is 0.",
  },
  gcf: "List the factors of each number. The greatest one on both lists is the GCF.",
  lcm: "List multiples of the larger number until one is also a multiple of the smaller number.",
  rate: "Unit rate: share the total equally among the items. Think of a multiplication fact you know.",
};
export function hint68(key) {
  const p = parse68(key);
  if (!p) return null;
  const entry = HINTS[p.kind];
  const text = typeof entry === "string" ? entry : p.kind === "int" ? entry[p.op] : entry[p.y];
  return { text, template: text, vars: {} };
}
export const HINTS_68 = Object.freeze(
  Object.values(HINTS).flatMap((entry) =>
    typeof entry === "string" ? [entry] : Object.values(entry),
  ),
);

// Bands per grade: Grade 6 benchmarks, divisibility, GCF/LCM, squares and unit rates; Grade 7 integers; Grade 8
// squares, cubes and integer review. Each band is a list (one row per fact) so the progress grid can show it.
const listBand = (id, label, keys) => ({ id, op: id, label, primary: true, maintain: false, keys });
export function bands68(grade) {
  const g = Math.floor(Number(grade));
  if (g < 6) return [];
  const ints = (op) => {
    const keys = [];
    for (let x = -12; x <= 12; x += 1)
      for (let y = -12; y <= 12; y += 1) {
        // For division, x is the quotient and y the divisor, so the dividend is their product.
        const key = op === "div" ? `int:div:${x * y}:${y}` : `int:${op}:${x}:${y}`;
        if (Math.abs(x) <= 10 && Math.abs(y) <= 10 && isTracked68(key)) keys.push(key);
      }
    return keys;
  };
  const dvb = [];
  for (const d of DIVISORS)
    for (const n of [
      12, 18, 24, 27, 30, 35, 36, 42, 45, 48, 54, 60, 72, 75, 81, 84, 90, 96, 105, 108, 111, 120,
      126, 135, 144, 150,
    ])
      dvb.push(`dvb:${n}:${d}`);
  const pairs = (kind) => {
    const keys = [];
    for (let a = 2; a <= 12; a += 1)
      for (let b = a + 1; b <= 12; b += 1) keys.push(`${kind}:${a}:${b}`);
    return keys;
  };
  const rates = [];
  for (let u = 2; u <= 12; u += 1)
    for (let r = 2; r <= 12; r += 1) rates.push(`rate:${u * r}:${u}`);
  const g6 = [
    listBand(
      "fdp",
      "Fraction, decimal and percent benchmarks",
      FDP_PAIRS.map(([a, b]) => `fdp:${a}:${b}`),
    ),
    listBand("dvb", "Divisibility rules", dvb.filter(isTracked68)),
    listBand("gcf", "Greatest common factor", pairs("gcf")),
    listBand("lcm", "Least common multiple", pairs("lcm")),
    listBand(
      "sq",
      "Perfect squares",
      Array.from({ length: 16 }, (_, n) => `sq:${n}`),
    ),
    listBand("rate", "Unit rates", rates.filter(isTracked68)),
  ];
  if (g === 6) return g6;
  const g7 = [
    listBand("int-add", "Add integers", ints("add")),
    listBand("int-sub", "Subtract integers", ints("sub")),
    listBand("int-mul", "Multiply integers", ints("mul")),
    listBand("int-div", "Divide integers", ints("div")),
  ];
  if (g === 7) return [...g7, ...g6.map((band) => ({ ...band, maintain: true }))];
  return [
    listBand(
      "sq",
      "Perfect squares",
      Array.from({ length: 16 }, (_, n) => `sq:${n}`),
    ),
    listBand(
      "cube",
      "Perfect cubes",
      Array.from({ length: 11 }, (_, n) => `cube:${n}`),
    ),
    ...g7.map((band) => ({ ...band, maintain: true })),
  ];
}
