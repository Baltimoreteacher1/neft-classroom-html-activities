// Expression Factory — the mathematics. Pure functions, no DOM.
// Lessons 6-5 (write and evaluate algebraic expressions), 6-6 / 6-8
// (equivalent expressions), 6-14 (the distributive property), 6-15
// (simplify). A production line is a chain of machines, each one operation:
//   { op: "+", k }  { op: "-", k }  { op: "*", k }  { op: "/", k }  { op: "+x" }  { op: "-x" }  { op: "*x" }
// A crate enters carrying a value of x and leaves carrying the expression's
// value. Values are exact fractions { n, d } so ÷ never rounds.

const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};
export const frac = (n, d = 1) => {
  const g = gcd(n, d) * (d < 0 ? -1 : 1);
  return { n: n / g, d: d / g };
};
export const eqFrac = (a, b) => a.n === b.n && a.d === b.d;
export const fracText = (f) => (f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);

/** Run one machine on a crate value; `x` is the crate's original input. */
export function runMachine(m, v, x) {
  switch (m.op) {
    case "+":
      return frac(v.n + m.k * v.d, v.d);
    case "-":
      return frac(v.n - m.k * v.d, v.d);
    case "*":
      return frac(v.n * m.k, v.d);
    case "/":
      return frac(v.n, v.d * m.k);
    case "+x":
      return frac(v.n + x * v.d, v.d);
    case "-x":
      return frac(v.n - x * v.d, v.d);
    case "*x":
      return frac(v.n * x, v.d);
    default:
      return v;
  }
}

/** Every intermediate value of a crate through a line, input first. */
export function trace(line, x) {
  const out = [frac(x)];
  for (const m of line) out.push(runMachine(m, out.at(-1), x));
  return out;
}

export const evaluate = (line, x) => trace(line, x).at(-1);

/** The line as a linear form a·x + b (exact fractions). */
export function linear(line) {
  const at0 = evaluate(line, 0);
  const at1 = evaluate(line, 1);
  return { a: frac(at1.n * at0.d - at0.n * at1.d, at1.d * at0.d), b: at0 };
}

/** True when the line is a·x + b: multiplying by x makes a line a polynomial of higher degree. */
export const isLinear = (line) => !line.some((m) => m.op === "*x");

/**
 * Two lines are equivalent when they agree for every value of x. A line has
 * at most one × x per machine, so five values settle any line the factory can
 * build; the factory still tests every crate, because that is what the
 * student sees.
 */
export function equivalent(a, b) {
  return [0, 1, 2, 3, 4].every((x) => eqFrac(evaluate(a, x), evaluate(b, x)));
}

/** Written form of a line, the way a person writes it: 3(x + 2), 2x + 6, (x + 4) ÷ 2. */
export function write(line) {
  let s = "x";
  let kind = "mono"; // mono | prod | sum
  let coef = 1; // while the expression is still one term, coef·x^pow
  let pow = 1;
  const mono = () => `${coef === 1 ? "" : coef}x${pow === 2 ? "²" : ""}`;
  for (const m of line) {
    if (m.op === "*") {
      if (kind === "mono") {
        coef *= m.k;
        s = mono();
      } else {
        s = `${m.k}(${s})`;
        kind = "prod";
      }
    } else if (m.op === "*x") {
      if (kind === "mono" && pow === 1) {
        pow = 2;
        s = mono();
      } else {
        s = `x(${s})`;
        kind = "prod";
      }
    } else if (m.op === "/") {
      s = kind === "sum" ? `(${s}) ÷ ${m.k}` : `${s} ÷ ${m.k}`;
      kind = "prod";
    } else if (m.op === "+") {
      s = `${s} + ${m.k}`;
      kind = "sum";
    } else if (m.op === "-") {
      s = `${s} − ${m.k}`;
      kind = "sum";
    } else if (m.op === "+x") {
      s = `${s} + x`;
      kind = "sum";
    } else if (m.op === "-x") {
      s = `${s} − x`;
      kind = "sum";
    }
  }
  return s;
}

/** The simplest written form of a line's linear form: 3x + 5, 2x − 1, 4x. */
export function simplest(line) {
  if (!isLinear(line)) return write(line);
  const { a, b } = linear(line);
  const A = fracText(a);
  const ax = a.n === 0 ? "" : A === "1" ? "x" : A === "-1" ? "−x" : `${A}x`;
  if (b.n === 0) return ax || "0";
  const B = fracText({ n: Math.abs(b.n), d: b.d });
  if (!ax) return b.n < 0 ? `−${B}` : B;
  return `${ax} ${b.n < 0 ? "−" : "+"} ${B}`;
}

export const sameChain = (a, b) =>
  a.length === b.length && a.every((m, i) => m.op === b[i].op && (m.k ?? 0) === (b[i].k ?? 0));

export const machineText = (m) =>
  m.op === "-x"
    ? "− x"
    : m.op === "+x"
    ? "+ x"
    : m.op === "*x"
    ? "× x"
    : m.op === "*"
      ? `× ${m.k}`
      : m.op === "/"
        ? `÷ ${m.k}`
        : m.op === "-"
          ? `− ${m.k}`
          : `+ ${m.k}`;
