// Independent exact evaluator for the 4.0 problem-type tests. It shares no code with the generators: a tiny
// recursive-descent parser over BigInt rationals (Q from exact-math.mjs) with variables and a function library.
// Grammar: + - * / ^ ( ), unary minus, decimals, variables, f(a, b, ...). ASCII only; * is always explicit.
import { Q } from "./exact-math.mjs";

const abs = (n) => (n < 0n ? -n : n);
const ONE = new Q(1n);
const ZERO = new Q(0n);
const num = (v) => {
  if (v.d !== 1n) throw new Error(`expected a whole number, got ${v.str()}`);
  return v.n;
};
const floorQ = (v) => {
  let n = v.n / v.d;
  if (v.n < 0n && v.n % v.d !== 0n) n -= 1n;
  return new Q(n);
};
const gcdB = (a, b) => (b === 0n ? abs(a) : gcdB(b, a % b));
const vals = (args) => args.map((v) => v);
const sorted = (args) => [...args].sort((a, b) => a.cmp(b));
const sum = (args) => args.reduce((s, v) => s.add(v), ZERO);
const modB = (a, b) => ((a % b) + b) % b;

function sqrtQ(v) {
  const root = (n) => {
    if (n < 0n) throw new Error("sqrt of a negative");
    if (n < 2n) return n;
    let x = BigInt(Math.floor(Math.sqrt(Number(n))));
    while (x * x > n) x -= 1n;
    while ((x + 1n) * (x + 1n) <= n) x += 1n;
    return x;
  };
  const [rn, rd] = [root(v.n), root(v.d)];
  if (rn * rn !== v.n || rd * rd !== v.d) throw new Error(`sqrt(${v.str()}) is not exact`);
  return new Q(rn, rd);
}

export const FUNCTIONS = {
  gcd: ([a, b]) => new Q(gcdB(num(a), num(b))),
  lcm: ([a, b]) => new Q(abs(num(a) * num(b)) / gcdB(num(a), num(b))),
  min: (args) => sorted(args)[0],
  max: (args) => sorted(args).at(-1),
  abs: ([a]) => new Q(abs(a.n), a.d),
  sqrt: ([a]) => sqrtQ(a),
  floor: ([a]) => floorQ(a),
  ceil: ([a]) => floorQ(new Q(-a.n, a.d)).neg(),
  // round to the nearest multiple of p, halves up: round(3749, 100) = 3700
  round: ([x, p]) => floorQ(x.div(p).add(new Q(1n, 2n))).mul(p),
  mod: ([a, b]) => new Q(modB(num(a), num(b))),
  even: ([a]) => (modB(num(a), 2n) === 0n ? ONE : ZERO),
  divides: ([a, b]) => (modB(num(b), num(a)) === 0n ? ONE : ZERO),
  isprime: ([a]) => {
    const n = num(a);
    if (n < 2n) return ZERO;
    for (let d = 2n; d * d <= n; d += 1n) if (n % d === 0n) return ZERO;
    return ONE;
  },
  digit: ([n, p]) => new Q(modB(num(floorQ(n.div(p))), 10n)),
  sign: ([a]) => new Q(a.n > 0n ? 1n : a.n < 0n ? -1n : 0n),
  sum: (args) => sum(args),
  prod: (args) => args.reduce((s, v) => s.mul(v), ONE),
  count: (args) => new Q(BigInt(args.length)),
  mean: (args) => sum(args).div(new Q(BigInt(args.length))),
  median: (args) => {
    const s = sorted(args);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : s[mid - 1].add(s[mid]).div(new Q(2n));
  },
  range: (args) => sorted(args).at(-1).sub(sorted(args)[0]),
  mode: (args) => {
    const counts = new Map();
    for (const v of args) counts.set(v.str(), (counts.get(v.str()) || 0) + 1);
    const best = Math.max(...counts.values());
    const winners = [...counts].filter(([, c]) => c === best);
    if (winners.length !== 1) throw new Error("mode is not unique");
    return args.find((v) => v.str() === winners[0][0]);
  },
  quad: ([x, y]) =>
    x.zero() || y.zero() ? ZERO : new Q(x.n > 0n ? (y.n > 0n ? 1n : 4n) : y.n > 0n ? 2n : 3n),
  vals,
};

const TOKEN = /\s*(\d+(?:\.\d+)?|[A-Za-z_][A-Za-z_0-9]*|[-+*/^(),])/y;
function tokenize(text) {
  const out = [];
  TOKEN.lastIndex = 0;
  let at = 0;
  while (at < text.length) {
    TOKEN.lastIndex = at;
    const m = TOKEN.exec(text);
    if (!m) {
      if (/^\s*$/.test(text.slice(at))) break;
      throw new Error(`cannot read "${text.slice(at)}" in "${text}"`);
    }
    out.push(m[1]);
    at = TOKEN.lastIndex;
  }
  return out;
}
const dec = (t) => {
  const [w, f = ""] = t.split(".");
  return new Q(BigInt(w + f), 10n ** BigInt(f.length));
};

export function evaluate(text, env = {}) {
  const tokens = tokenize(String(text));
  let at = 0;
  const peek = () => tokens[at];
  const eat = (t) => {
    if (tokens[at] !== t) throw new Error(`expected ${t} at ${at} in "${text}"`);
    at += 1;
  };
  function atom() {
    const t = tokens[at];
    if (t === undefined) throw new Error(`unexpected end of "${text}"`);
    if (/^\d/.test(t)) {
      at += 1;
      return dec(t);
    }
    if (t === "(") {
      at += 1;
      const v = add();
      eat(")");
      return v;
    }
    if (/^[A-Za-z_]/.test(t)) {
      at += 1;
      if (peek() === "(") {
        at += 1;
        const args = [];
        if (peek() !== ")") {
          args.push(add());
          while (peek() === ",") {
            at += 1;
            args.push(add());
          }
        }
        eat(")");
        if (!FUNCTIONS[t]) throw new Error(`unknown function ${t}`);
        return FUNCTIONS[t](args);
      }
      if (!(t in env)) throw new Error(`unknown variable ${t}`);
      return env[t];
    }
    throw new Error(`unexpected "${t}" in "${text}"`);
  }
  function power() {
    const base = atom();
    if (peek() !== "^") return base;
    at += 1;
    const exp = num(unary());
    let out = ONE;
    for (let i = 0n; i < abs(exp); i += 1n) out = out.mul(base);
    return exp < 0n ? ONE.div(out) : out;
  }
  function unary() {
    if (peek() === "-") {
      at += 1;
      return unary().neg();
    }
    if (peek() === "+") {
      at += 1;
      return unary();
    }
    return power();
  }
  function mul() {
    let v = unary();
    while (peek() === "*" || peek() === "/") {
      const op = tokens[at];
      at += 1;
      const r = unary();
      v = op === "*" ? v.mul(r) : v.div(r);
    }
    return v;
  }
  function add() {
    let v = mul();
    while (peek() === "+" || peek() === "-") {
      const op = tokens[at];
      at += 1;
      const r = mul();
      v = op === "+" ? v.add(r) : v.sub(r);
    }
    return v;
  }
  const out = add();
  if (at !== tokens.length) throw new Error(`unread input in "${text}"`);
  return out;
}

// Read a rational written as "3/4", "-2", "1.25" (no mixed numbers: meta strings are always exact n/d).
export function qOf(text) {
  const s = String(text).trim();
  const m = s.match(/^(-?\d+)\/(\d+)$/);
  if (m) return new Q(BigInt(m[1]), BigInt(m[2]));
  if (/^-?\d+(\.\d+)?$/.test(s)) return s.startsWith("-") ? dec(s.slice(1)).neg() : dec(s);
  throw new Error(`not a rational: ${text}`);
}
export { Q };
