/**
 * gen.mjs — problem generators for the Math Literacy & Fluency program (teachers/math-literacy/).
 *
 * Every numeric item carries `expr`, a string the exact-arithmetic helper (scripts/lib/rational.mjs) can evaluate,
 * and `a`, the answer as a student would write it. tools/validate-math-literacy.mjs recomputes every `expr` and
 * requires it to equal `a`, so a generator cannot ship a wrong key. Items that are not arithmetic (naming a shape,
 * picking the longer object) carry a `rule` and `args` instead, and the validator re-derives those too.
 *
 * Deterministic: the same seed gives the same worksheet, so a regenerated file diffs cleanly.
 */

export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, a) => a[Math.floor(r() * a.length)];
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const lcm = (a, b) => (a / gcd(a, b)) * b;
export const comma = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
function frac(n, d) {
  const g = gcd(n, d);
  n /= g;
  d /= g;
  return d === 1 ? String(n) : `${n}/${d}`;
}
function mixed(n, d) {
  const g = gcd(n, d);
  n /= g;
  d /= g;
  const w = Math.floor(n / d);
  const rem = n - w * d;
  if (!rem) return String(w);
  return w ? `${w} ${rem}/${d}` : `${rem}/${d}`;
}
// hundredths integer -> "3.5", "4", "0.25"
function dec(h) {
  const neg = h < 0 ? "-" : "";
  h = Math.abs(h);
  const whole = Math.floor(h / 100);
  const c = h % 100;
  if (!c) return `${neg}${whole}`;
  const cs = String(c).padStart(2, "0").replace(/0$/, "");
  return `${neg}${whole}.${cs}`;
}
const money = (cents) => `$${(cents / 100).toFixed(2)}`;
const moneyExpr = (cents) => (cents / 100).toFixed(2);

const NAMES = [
  "Maya",
  "Jamal",
  "Sofia",
  "Andre",
  "Lina",
  "Omar",
  "Priya",
  "Marcus",
  "Elena",
  "Ben",
  "Zara",
  "Tomás",
  "Nia",
  "Diego",
  "Amira",
  "Kofi",
];
const THINGS = [
  "stickers",
  "books",
  "pencils",
  "apples",
  "stamps",
  "shells",
  "cards",
  "crayons",
  "cookies",
  "buttons",
  "markers",
  "leaves",
];
const SHAPES = ["circle", "triangle", "square", "rectangle", "hexagon", "pentagon"];
const SHAPE_SIDES = { circle: 0, triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6 };
const twoNames = (r) => {
  const a = pick(r, NAMES);
  let b = pick(r, NAMES);
  while (b === a) b = pick(r, NAMES);
  return [a, b];
};
// n values with an integer mean: n-1 random values, the last chosen so the total divides by n.
function meanSet(r, n, lo, hi) {
  const vals = [];
  let s = 0;
  for (let i = 0; i < n - 1; i++) {
    const v = int(r, lo, hi);
    vals.push(v);
    s += v;
  }
  const last = lo + ((n - ((s + lo) % n)) % n);
  vals.push(last);
  return { vals, mean: (s + last) / n };
}
const item = (q, a, expr, extra = {}) => ({ q, a: String(a), expr, ...extra });

/* ---------- fact fluency ---------- */
export const FACT = {
  add: (r, { max = 10, min = 0 }) => {
    const a = int(r, min, max);
    const b = int(r, min, Math.max(min, max - a));
    const s = a + b;
    return item(`${a} + ${b} = ___`, s, `${a}+${b}`, { kind: "add" });
  },
  sub: (r, { max = 10 }) => {
    const a = int(r, 1, max);
    const b = int(r, 0, a);
    return item(`${a} − ${b} = ___`, a - b, `${a}-${b}`, { kind: "sub" });
  },
  makeN: (r, { t = 10 }) => {
    const a = int(r, 0, t);
    return item(`${a} + ___ = ${t}`, t - a, `${t}-${a}`, { kind: "makeN" });
  },
  missSub: (r, { max = 10 }) => {
    const a = int(r, 2, max);
    const b = int(r, 0, a);
    return item(`${a} − ___ = ${a - b}`, b, `${a}-${a - b}`, { kind: "missSub" });
  },
  mul: (r, { lo = 0, hi = 10, alo = 0 }) => {
    const a = int(r, alo, hi);
    const b = int(r, lo, hi);
    return item(`${a} × ${b} = ___`, a * b, `${a}*${b}`, { kind: "mul" });
  },
  div: (r, { lo = 1, hi = 10 }) => {
    const b = int(r, Math.max(lo, 1), hi);
    const q = int(r, 0, hi);
    return item(`${b * q} ÷ ${b} = ___`, q, `${b * q}/${b}`, { kind: "div" });
  },
  missMul: (r, { lo = 1, hi = 10 }) => {
    const a = int(r, Math.max(lo, 1), hi);
    const b = int(r, Math.max(lo, 1), hi);
    return item(`___ × ${a} = ${a * b}`, b, `${a * b}/${a}`, { kind: "missMul" });
  },
};

/* ---------- skill fluency ---------- */
export const SKILL = {
  compare: (r, { max = 20 }) => {
    const a = int(r, 0, max);
    let b = int(r, 0, max);
    if (b === a) b = a === max ? a - 1 : a + 1;
    return item(`Circle the greater number: ${a} or ${b}`, Math.max(a, b), null, {
      kind: "compare",
      rule: "max",
      args: [a, b],
    });
  },
  next: (r, { max = 19 }) => {
    const a = int(r, 1, max - 2);
    return item(`What number comes next? ${a}, ${a + 1}, ${a + 2}, ___`, a + 3, `${a}+3`, {
      kind: "next",
    });
  },
  tenOnes: (r, { lo = 11, hi = 19 }) => {
    const n = int(r, lo, hi);
    const t = Math.floor(n / 10);
    const o = n % 10;
    return item(`${n} = ${t} ${t === 1 ? "ten" : "tens"} and ___ ones`, o, `${n}-${t * 10}`, {
      kind: "tenOnes",
    });
  },
  tensOnesTotal: (r, { maxTens = 9 }) => {
    const t = int(r, 1, maxTens);
    const o = int(r, 0, 9);
    return item(`${t} tens and ${o} ones = ___`, t * 10 + o, `${t}*10+${o}`, {
      kind: "tensOnesTotal",
    });
  },
  addTens: (r, { max = 90 }) => {
    const b = pick(r, [10, 20, 30]);
    const a = int(r, 10, Math.min(max, 99 - b));
    return item(`${a} + ${b} = ___`, a + b, `${a}+${b}`, { kind: "addTens" });
  },
  expanded: (r, { digits = 3 }) => {
    const h = int(r, 1, 9);
    const t = int(r, 0, 9);
    const o = int(r, 0, 9);
    return item(`${h * 100 + t * 10 + o} = ${h} hundreds + ___ tens + ${o} ones`, t, `${t}`, {
      kind: "expanded",
      args: [h, t, o],
    });
  },
  add2d: (r, { regroup = true }) => {
    let a, b;
    do {
      a = int(r, 11, 79);
      b = int(r, 11, 89);
    } while (a + b > 99 || (regroup ? (a % 10) + (b % 10) < 10 : (a % 10) + (b % 10) >= 10));
    return item(`${a} + ${b} = ___`, a + b, `${a}+${b}`, { kind: "add2d" });
  },
  sub2d: (r, { regroup = true }) => {
    let a, b;
    do {
      a = int(r, 21, 99);
      b = int(r, 11, a - 1);
    } while (regroup ? a % 10 >= b % 10 : a % 10 < b % 10);
    return item(`${a} − ${b} = ___`, a - b, `${a}-${b}`, { kind: "sub2d" });
  },
  add3d: (r, { max = 899 }) => {
    const a = int(r, 100, max);
    const b = int(r, 100, 999 - a);
    return item(`${a} + ${b} = ___`, comma(a + b), `${a}+${b}`, { kind: "add3d" });
  },
  sub3d: (r, { max = 999 }) => {
    const a = int(r, 200, max);
    const b = int(r, 100, a - 1);
    return item(`${a} − ${b} = ___`, comma(a - b), `${a}-${b}`, { kind: "sub3d" });
  },
  addBig: (r, { digits = 5 }) => {
    const lo = 10 ** (digits - 1);
    const a = int(r, lo, lo * 6);
    const b = int(r, lo, lo * 3);
    return item(`${comma(a)} + ${comma(b)} = ___`, comma(a + b), `${a}+${b}`, { kind: "addBig" });
  },
  subBig: (r, { digits = 5 }) => {
    const lo = 10 ** (digits - 1);
    const a = int(r, lo * 4, lo * 9);
    const b = int(r, lo, a - 1);
    return item(`${comma(a)} − ${comma(b)} = ___`, comma(a - b), `${a}-${b}`, { kind: "subBig" });
  },
  round: (r, { place = 10, max = 999 }) => {
    const n = int(r, place, max);
    const rounded = Math.round(n / place) * place;
    const nm = {
      10: "ten",
      100: "hundred",
      1000: "thousand",
      10000: "ten thousand",
      100000: "hundred thousand",
    }[place];
    return item(`Round ${comma(n)} to the nearest ${nm}.`, comma(rounded), String(rounded), {
      kind: "round",
      rule: "round",
      args: [n, place],
    });
  },
  arrayTotal: (r, { hi = 5 }) => {
    const a = int(r, 2, hi);
    const b = int(r, 2, hi);
    return item(`An array has ${a} rows and ${b} columns. How many in all?`, a * b, `${a}*${b}`, {
      kind: "arrayTotal",
    });
  },
  coins: (r) => {
    const q = int(r, 0, 3);
    const d = int(r, 0, 4);
    const n = int(r, 0, 4);
    const p = int(r, 0, 4);
    const total = q * 25 + d * 10 + n * 5 + p;
    return item(
      `${q} quarters, ${d} dimes, ${n} nickels, ${p} pennies = ___ cents`,
      total,
      `${q}*25+${d}*10+${n}*5+${p}`,
      { kind: "coins" },
    );
  },
  shapeSides: (r) => {
    const s = pick(r, SHAPES);
    return item(`How many sides does a ${s} have?`, SHAPE_SIDES[s], null, {
      kind: "shapeSides",
      rule: "sides",
      args: [s],
    });
  },
  shapeName: (r) => {
    const s = pick(r, ["triangle", "square", "pentagon", "hexagon"]);
    const n = SHAPE_SIDES[s];
    const extra = s === "square" ? " and all sides equal" : "";
    return item(`Which shape has ${n} sides${extra}?`, s, null, {
      kind: "shapeName",
      rule: "shapeName",
      args: [n, s === "square"],
    });
  },
  compareLen: (r) => {
    const [n1, n2] = twoNames(r);
    const a = int(r, 2, 12);
    let b = int(r, 2, 12);
    if (b === a) b = a + 1;
    const longer = a > b ? n1 : n2;
    return item(
      `${n1}'s ribbon is ${a} units long. ${n2}'s ribbon is ${b} units long. Whose ribbon is longer?`,
      longer,
      null,
      { kind: "compareLen", rule: "longer", args: [n1, a, n2, b] },
    );
  },
  clockHour: (r) => {
    const h = int(r, 1, 12);
    const half = r() < 0.5;
    return item(
      `The short hand points to ${h}${half ? " and the long hand points to 6" : " and the long hand points to 12"}. What time is it?`,
      half ? `${h}:30` : `${h}:00`,
      null,
      { kind: "clockHour", rule: "clock", args: [h, half] },
    );
  },
  tally: (r) => {
    const g = int(r, 1, 3);
    const o = int(r, 0, 4);
    return item(
      `A tally chart shows ${g} groups of 5 and ${o} more marks. How many tally marks?`,
      g * 5 + o,
      `${g}*5+${o}`,
      { kind: "tally" },
    );
  },
  fracName: (r) => {
    const d = pick(r, [2, 3, 4, 6, 8]);
    const n = int(r, 1, d - 1);
    return item(
      `A shape is cut into ${d} equal parts. ${n} ${n === 1 ? "part is" : "parts are"} shaded. What fraction is shaded?`,
      `${n}/${d}`,
      `${n}/${d}`,
      { kind: "fracName" },
    );
  },
  fracCompare: (r, { dens = [2, 3, 4, 6, 8] }) => {
    const d = pick(r, dens);
    const a = int(r, 1, d - 1);
    let b = int(r, 1, d - 1);
    if (a === b) b = a === d - 1 ? a - 1 : a + 1;
    return item(
      `Circle the greater fraction: ${a}/${d} or ${b}/${d}`,
      `${Math.max(a, b)}/${d}`,
      null,
      { kind: "fracCompare", rule: "fracmax", args: [a, b, d] },
    );
  },
  fracEquiv: (r, { dens = [2, 3, 4, 5, 6] }) => {
    const d = pick(r, dens);
    const n = int(r, 1, d - 1);
    const k = int(r, 2, 4);
    return item(`${n}/${d} = ___/${d * k}`, n * k, `${n}/${d}*${d * k}`, {
      kind: "fracEquiv",
      args: [n, d, k],
    });
  },
  fracAddLike: (r, { dens = [4, 5, 6, 8, 10] }) => {
    const d = pick(r, dens);
    const a = int(r, 1, d - 1);
    const b = int(r, 1, d - a + (r() < 0.5 ? 2 : 0));
    return item(`${a}/${d} + ${b}/${d} = ___`, mixed(a + b, d), `${a}/${d}+${b}/${d}`, {
      kind: "fracAddLike",
    });
  },
  fracSubLike: (r, { dens = [4, 5, 6, 8, 10] }) => {
    const d = pick(r, dens);
    const a = int(r, 2, d + 3);
    const b = int(r, 1, a - 1);
    return item(`${mixed(a, d)} − ${b}/${d} = ___`, mixed(a - b, d), `${a}/${d}-${b}/${d}`, {
      kind: "fracSubLike",
    });
  },
  fracAddUnlike: (r) => {
    const pairs = [
      [2, 3],
      [2, 4],
      [3, 6],
      [4, 8],
      [2, 5],
      [3, 4],
      [4, 6],
      [5, 10],
      [3, 5],
    ];
    const [d1, d2] = pick(r, pairs);
    const a = int(r, 1, d1 - 1);
    const b = int(r, 1, d2 - 1);
    const L = lcm(d1, d2);
    const sum = (a * L) / d1 + (b * L) / d2;
    return item(`${a}/${d1} + ${b}/${d2} = ___`, mixed(sum, L), `${a}/${d1}+${b}/${d2}`, {
      kind: "fracAddUnlike",
    });
  },
  fracSubUnlike: (r) => {
    const pairs = [
      [2, 4],
      [3, 6],
      [2, 8],
      [3, 4],
      [4, 6],
      [5, 10],
      [2, 3],
      [3, 5],
    ];
    const [d1, d2] = pick(r, pairs);
    const a = int(r, 1, d1 - 1);
    const b = int(r, 1, d2 - 1);
    const L = lcm(d1, d2);
    const diff = (a * L) / d1 - (b * L) / d2;
    if (diff <= 0) return SKILL.fracSubUnlike(r);
    return item(`${a}/${d1} − ${b}/${d2} = ___`, mixed(diff, L), `${a}/${d1}-${b}/${d2}`, {
      kind: "fracSubUnlike",
    });
  },
  fracMulWhole: (r) => {
    const d = pick(r, [2, 3, 4, 5, 6, 8]);
    const n = int(r, 1, d - 1);
    const w = int(r, 2, 9);
    return item(`${w} × ${n}/${d} = ___`, mixed(w * n, d), `${w}*${n}/${d}`, {
      kind: "fracMulWhole",
    });
  },
  fracMul: (r) => {
    const d1 = pick(r, [2, 3, 4, 5, 6]);
    const d2 = pick(r, [2, 3, 4, 5, 8]);
    const n1 = int(r, 1, d1 - 1);
    const n2 = int(r, 1, d2 - 1);
    return item(
      `${n1}/${d1} × ${n2}/${d2} = ___`,
      mixed(n1 * n2, d1 * d2),
      `${n1}/${d1}*${n2}/${d2}`,
      { kind: "fracMul" },
    );
  },
  fracDiv: (r) => {
    const d1 = pick(r, [2, 3, 4, 5, 6]);
    const d2 = pick(r, [2, 3, 4, 5, 8]);
    const n1 = int(r, 1, d1 - 1);
    const n2 = int(r, 1, d2 - 1);
    return item(
      `${n1}/${d1} ÷ ${n2}/${d2} = ___`,
      mixed(n1 * d2, d1 * n2),
      `(${n1}/${d1})/(${n2}/${d2})`,
      { kind: "fracDiv" },
    );
  },
  unitFracDiv: (r) => {
    const d = pick(r, [2, 3, 4, 5, 6]);
    const w = int(r, 2, 6);
    return item(`1/${d} ÷ ${w} = ___`, `1/${d * w}`, `(1/${d})/${w}`, { kind: "unitFracDiv" });
  },
  mulMD: (r, { a = [12, 99], b = [2, 9] }) => {
    const x = int(r, a[0], a[1]);
    const y = int(r, b[0], b[1]);
    return item(`${x} × ${y} = ___`, comma(x * y), `${x}*${y}`, { kind: "mulMD" });
  },
  divMD: (r, { divisor = [2, 9], q = [12, 99] }) => {
    const d = int(r, divisor[0], divisor[1]);
    const k = int(r, q[0], q[1]);
    return item(`${comma(d * k)} ÷ ${d} = ___`, comma(k), `${d * k}/${d}`, { kind: "divMD" });
  },
  divRem: (r, { divisor = [3, 9], q = [10, 60] }) => {
    const d = int(r, divisor[0], divisor[1]);
    const k = int(r, q[0], q[1]);
    const rem = int(r, 1, d - 1);
    const n = d * k + rem;
    return item(`${n} ÷ ${d} has a remainder of ___`, rem, `${n}-${d}*${k}`, {
      kind: "divRem",
      args: [n, d, k, rem],
    });
  },
  decAdd: (r, { places = 1 }) => {
    const sc = places === 1 ? 10 : 100;
    const a = int(r, 11, 480) * (100 / sc);
    const b = int(r, 11, 480) * (100 / sc);
    return item(`${dec(a)} + ${dec(b)} = ___`, dec(a + b), `${dec(a)}+${dec(b)}`, {
      kind: "decAdd",
    });
  },
  decSub: (r, { places = 1 }) => {
    const sc = places === 1 ? 10 : 100;
    const a = int(r, 150, 900) * (100 / sc);
    const b = int(r, 11, 149) * (100 / sc);
    return item(`${dec(a)} − ${dec(b)} = ___`, dec(a - b), `${dec(a)}-${dec(b)}`, {
      kind: "decSub",
    });
  },
  decCompare: (r, { places = 2 }) => {
    const u = places === 1 ? 10 : 1;
    const a = int(r, 10, 990) * u;
    let b = a + pick(r, [-9, -1, 1, 9, 11, -11]) * u;
    if (b <= 0 || b === a) b = a + 11 * u;
    const A = dec(a),
      B = dec(b);
    return item(`Circle the greater number: ${A} or ${B}`, a > b ? A : B, null, {
      kind: "decCompare",
      rule: "max",
      args: [a, b],
      dec: true,
    });
  },
  decMul: (r) => {
    const a = int(r, 12, 99) * 10; // tenths as hundredths ints, e.g. 1.2 -> 120
    const w = int(r, 2, 9);
    return item(`${dec(a)} × ${w} = ___`, dec(a * w), `${dec(a)}*${w}`, { kind: "decMul" });
  },
  decMulDec: (r) => {
    const a = int(r, 2, 19) * 10;
    const b = int(r, 2, 9) * 10;
    return item(`${dec(a)} × ${dec(b)} = ___`, dec((a * b) / 100), `${dec(a)}*${dec(b)}`, {
      kind: "decMulDec",
    });
  },
  decDiv: (r) => {
    const w = int(r, 2, 9);
    const q = int(r, 11, 99) * 10;
    return item(`${dec(q * w)} ÷ ${w} = ___`, dec(q), `${dec(q * w)}/${w}`, { kind: "decDiv" });
  },
  powerOfTen: (r) => {
    const ni = int(r, 12, 950);
    const n = ni / 10;
    const p = pick(r, [10, 100, 1000]);
    const ans = (ni * p) / 10;
    return item(`${n} × ${p} = ___`, ans, `${n}*${p}`, { kind: "powerOfTen" });
  },
  percentOf: (r, { easy = false }) => {
    const p = easy ? pick(r, [10, 25, 50]) : pick(r, [5, 10, 15, 20, 25, 30, 40, 50, 60, 75]);
    const base = pick(r, [20, 40, 60, 80, 120, 200, 240, 400, 80]);
    const ans = (base * p) / 100;
    return item(`${p}% of ${base} = ___`, ans, `${p}/100*${base}`, { kind: "percentOf" });
  },
  fracToPercent: (r) => {
    const [n, d] = pick(r, [
      [1, 2],
      [1, 4],
      [3, 4],
      [1, 5],
      [2, 5],
      [3, 5],
      [1, 10],
      [7, 10],
      [1, 20],
      [3, 20],
    ]);
    return item(`Write ${n}/${d} as a percent.`, `${(n * 100) / d}%`, `${(n * 100) / d}`, {
      kind: "fracToPercent",
      args: [n, d],
    });
  },
  unitRate: (r) => {
    const rate = int(r, 3, 15);
    const k = int(r, 2, 9);
    const it = pick(r, ["miles", "pages", "dollars", "words"]);
    const unit = { miles: "hours", pages: "minutes", dollars: "pounds", words: "minutes" }[it];
    return item(
      `${rate * k} ${it} in ${k} ${unit}. What is the unit rate in ${it} per ${unit.slice(0, -1)}?`,
      rate,
      `${rate * k}/${k}`,
      { kind: "unitRate" },
    );
  },
  ratioEquiv: (r) => {
    const a = int(r, 1, 6);
    const b = int(r, 2, 9);
    const k = int(r, 2, 6);
    return item(`${a}:${b} = ___:${b * k}`, a * k, `${a * k}`, {
      kind: "ratioEquiv",
      args: [a, b, k],
    });
  },
  proportion: (r) => {
    const a = int(r, 2, 9);
    const b = int(r, 2, 9);
    const k = int(r, 2, 8);
    return item(`${a}/${b} = x/${b * k}. Solve for x.`, a * k, `${a * k}`, {
      kind: "proportion",
      args: [a, b, k],
    });
  },
  intAdd: (r, { max = 12 }) => {
    const a = int(r, -max, max);
    const b = int(r, -max, max);
    const bs = b < 0 ? `(${b})` : String(b);
    return item(`${a} + ${bs} = ___`, a + b, `(${a})+(${b})`, { kind: "intAdd" });
  },
  intSub: (r, { max = 12 }) => {
    const a = int(r, -max, max);
    const b = int(r, -max, max);
    const bs = b < 0 ? `(${b})` : String(b);
    return item(`${a} − ${bs} = ___`, a - b, `(${a})-(${b})`, { kind: "intSub" });
  },
  intMul: (r, { max = 9 }) => {
    const a = int(r, -max, max);
    const b = int(r, -max, max);
    const as = a < 0 ? `(${a})` : String(a);
    const bs = b < 0 ? `(${b})` : String(b);
    return item(`${as} × ${bs} = ___`, a * b, `(${a})*(${b})`, { kind: "intMul" });
  },
  intDiv: (r) => {
    const b = pick(r, [-9, -8, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 8, 9]);
    const q = int(r, -9, 9);
    const bs = b < 0 ? `(${b})` : String(b);
    return item(`${b * q} ÷ ${bs} = ___`, q, `(${b * q})/(${b})`, { kind: "intDiv" });
  },
  absValue: (r) => {
    const a = int(r, -20, 20);
    return item(`|${a}| = ___`, Math.abs(a), null, { kind: "absValue", rule: "abs", args: [a] });
  },
  evalExpr: (r) => {
    const a = int(r, 2, 9);
    const b = int(r, 2, 9);
    const c = int(r, 2, 9);
    const t = int(r, 0, 2);
    if (t === 0)
      return item(`${a} + ${b} × ${c} = ___`, a + b * c, `${a}+${b}*${c}`, { kind: "evalExpr" });
    if (t === 1)
      return item(`(${a} + ${b}) × ${c} = ___`, (a + b) * c, `(${a}+${b})*${c}`, {
        kind: "evalExpr",
      });
    return item(`${a * b} ÷ ${b} + ${c}² = ___`, a + c * c, `${a * b}/${b}+${c}^2`, {
      kind: "evalExpr",
    });
  },
  oneStepEq: (r) => {
    const x = int(r, 2, 15);
    const k = int(r, 2, 9);
    const t = int(r, 0, 2);
    if (t === 0)
      return item(`x + ${k} = ${x + k}. x = ___`, x, `${x + k}-${k}`, { kind: "oneStepEq" });
    if (t === 1)
      return item(`x − ${k} = ${x - k}. x = ___`, x, `${x - k}+${k}`, { kind: "oneStepEq" });
    return item(`${k}x = ${k * x}. x = ___`, x, `${k * x}/${k}`, { kind: "oneStepEq" });
  },
  twoStepEq: (r) => {
    const x = int(r, -6, 12);
    const m = int(r, 2, 8);
    const b = int(r, 1, 12);
    const sign = r() < 0.5 ? 1 : -1;
    const rhs = m * x + sign * b;
    return item(
      `${m}x ${sign > 0 ? "+" : "−"} ${b} = ${rhs}. x = ___`,
      x,
      `(${rhs}${sign > 0 ? "-" : "+"}${b})/${m}`,
      { kind: "twoStepEq" },
    );
  },
  bothSidesEq: (r) => {
    const x = int(r, -5, 10);
    const m = int(r, 3, 8);
    const n = int(r, 1, m - 1);
    const c = int(r, -9, 9);
    const d = c + (m - n) * x;
    return item(
      `${m}x + ${c < 0 ? `(${c})` : c} = ${n}x + ${d < 0 ? `(${d})` : d}. x = ___`,
      x,
      `${x}`,
      { kind: "bothSidesEq", args: [m, c, n, d, x] },
    );
  },
  distribute: (r) => {
    const k = int(r, 2, 8);
    const a = int(r, 1, 9);
    const _b = int(r, 1, 9);
    return item(`${k}(x + ${a}) = ${k}x + ___`, k * a, `${k}*${a}`, {
      kind: "distribute",
      args: [k, a],
    });
  },
  evalSub: (r) => {
    const x = int(r, 2, 9);
    const a = int(r, 2, 6);
    const b = int(r, 1, 9);
    return item(`Evaluate ${a}x + ${b} when x = ${x}.`, a * x + b, `${a}*${x}+${b}`, {
      kind: "evalSub",
    });
  },
  area: (r, { tri = false }) => {
    const l = int(r, 2, 12);
    const w = int(r, 2, 9);
    if (tri) {
      const b = int(r, 2, 10) * 2;
      return item(
        `A triangle has base ${b} and height ${w}. Area = ___`,
        (b * w) / 2,
        `${b}*${w}/2`,
        { kind: "areaTri" },
      );
    }
    return item(
      `A rectangle is ${l} units by ${w} units. Area = ___ square units`,
      l * w,
      `${l}*${w}`,
      { kind: "area" },
    );
  },
  perimeter: (r) => {
    const l = int(r, 2, 15);
    const w = int(r, 2, 12);
    return item(
      `A rectangle is ${l} units by ${w} units. Perimeter = ___ units`,
      2 * (l + w),
      `2*(${l}+${w})`,
      { kind: "perimeter" },
    );
  },
  volume: (r) => {
    const l = int(r, 2, 9);
    const w = int(r, 2, 8);
    const h = int(r, 2, 8);
    return item(
      `A box is ${l} by ${w} by ${h}. Volume = ___ cubic units`,
      l * w * h,
      `${l}*${w}*${h}`,
      { kind: "volume" },
    );
  },
  mean: (r) => {
    const n = pick(r, [4, 5]);
    const { vals, mean } = meanSet(r, n, 3, 24);
    return item(`Find the mean of ${vals.join(", ")}.`, mean, `(${vals.join("+")})/${n}`, {
      kind: "mean",
    });
  },
  median: (r) => {
    const vals = Array.from({ length: 5 }, () => int(r, 1, 30));
    const sorted = [...vals].sort((a, b) => a - b);
    return item(`Find the median of ${vals.join(", ")}.`, sorted[2], null, {
      kind: "median",
      rule: "median",
      args: vals,
    });
  },
  probability: (r) => {
    const red = int(r, 1, 6);
    const blue = int(r, 1, 6);
    return item(
      `A bag has ${red} red and ${blue} blue tiles. P(red) = ___`,
      frac(red, red + blue),
      `${red}/${red + blue}`,
      { kind: "probability" },
    );
  },
  angles: (r) => {
    const a = int(r, 20, 80);
    const sup = r() < 0.5;
    const total = sup ? 180 : 90;
    return item(
      `Two ${sup ? "supplementary" : "complementary"} angles: one is ${a}°. The other is ___°`,
      total - a,
      `${total}-${a}`,
      { kind: "angles" },
    );
  },
  circle: (r) => {
    const rad = int(r, 2, 12);
    return item(
      `A circle has radius ${rad}. Circumference using 3.14 for π = ___`,
      dec(Math.round(2 * 3.14 * rad * 100)),
      `2*3.14*${rad}`,
      { kind: "circle" },
    );
  },
  expRule: (r) => {
    const base = int(r, 2, 5);
    const a = int(r, 2, 6);
    const b = int(r, 2, 6);
    return item(`${base}^${a} × ${base}^${b} = ${base}^___`, a + b, `${a}+${b}`, {
      kind: "expRule",
    });
  },
  expEval: (r) => {
    const base = int(r, 2, 9);
    const p = base <= 3 ? int(r, 2, 5) : 2;
    return item(`${base}^${p} = ___`, base ** p, `${base}^${p}`, { kind: "expEval" });
  },
  sciNote: (r) => {
    const m = int(r, 11, 99) / 10;
    const p = int(r, 2, 6);
    const n = Math.round(m * 10 ** p);
    return item(`Write ${comma(n)} in scientific notation: ${m} × 10^___`, p, `${p}`, {
      kind: "sciNote",
      args: [m, p],
    });
  },
  slope: (r) => {
    const x1 = int(r, -4, 3);
    const dx = int(r, 1, 5);
    const m = int(r, -4, 5);
    const y1 = int(r, -5, 8);
    return item(
      `Find the slope through (${x1}, ${y1}) and (${x1 + dx}, ${y1 + m * dx}).`,
      m,
      `${m * dx}/${dx}`,
      { kind: "slope" },
    );
  },
  linearEval: (r) => {
    const m = int(r, -4, 6);
    const b = int(r, -8, 8);
    const x = int(r, -3, 6);
    return item(
      `y = ${m}x ${b < 0 ? "−" : "+"} ${Math.abs(b)}. When x = ${x}, y = ___`,
      m * x + b,
      `(${m})*(${x})+(${b})`,
      { kind: "linearEval" },
    );
  },
  pythag: (r) => {
    const t = pick(r, [
      [3, 4, 5],
      [5, 12, 13],
      [8, 15, 17],
      [6, 8, 10],
      [9, 12, 15],
      [7, 24, 25],
      [20, 21, 29],
    ]);
    const k = pick(r, [1, 1, 2]);
    const [a, b, c] = t.map((v) => v * k);
    if (r() < 0.5)
      return item(`A right triangle has legs ${a} and ${b}. The hypotenuse = ___`, c, `${c}`, {
        kind: "pythag",
        args: [a, b, c, "hyp"],
      });
    return item(
      `A right triangle has hypotenuse ${c} and one leg ${a}. The other leg = ___`,
      b,
      `${b}`,
      { kind: "pythag", args: [a, b, c, "leg"] },
    );
  },
  cylVolume: (r) => {
    const rad = int(r, 2, 6);
    const h = int(r, 3, 10);
    return item(
      `A cylinder has radius ${rad} and height ${h}. Volume in terms of π = ___π`,
      rad * rad * h,
      `${rad}*${rad}*${h}`,
      { kind: "cylVolume" },
    );
  },
  gcf: (r) => {
    const g = pick(r, [2, 3, 4, 5, 6, 8]);
    const a = g * pick(r, [2, 3, 5]);
    const b = g * pick(r, [3, 4, 7]);
    return item(`GCF of ${a} and ${b} = ___`, gcd(a, b), `${gcd(a, b)}`, {
      kind: "gcf",
      args: [a, b],
    });
  },
  lcm: (r) => {
    const a = pick(r, [2, 3, 4, 5, 6]);
    const b = pick(r, [3, 4, 5, 8, 9]);
    return item(`LCM of ${a} and ${b} = ___`, lcm(a, b), `${lcm(a, b)}`, {
      kind: "lcm",
      args: [a, b],
    });
  },
  convert: (r) => {
    const t = pick(r, [
      ["meters", "centimeters", 100],
      ["kilograms", "grams", 1000],
      ["liters", "milliliters", 1000],
      ["feet", "inches", 12],
      ["yards", "feet", 3],
    ]);
    const n = int(r, 2, 9);
    return item(`${n} ${t[0]} = ___ ${t[1]}`, n * t[2], `${n}*${t[2]}`, { kind: "convert" });
  },
};

/* ---------- word problems ---------- */
// Each returns { text, question, a, expr, unit, frame, extra? } where `extra` is an irrelevant number the student must ignore.
export const WP = {
  join: (r, { max = 10 }) => {
    const [n1, n2] = twoNames(r);
    const th = pick(r, THINGS);
    const a = int(r, 1, max - 1);
    const b = int(r, 1, max - a);
    return {
      text: `${n1} has ${a} ${th}. ${n2} gives ${n1} ${b} more ${th}. How many ${th} does ${n1} have now?`,
      question: `How many ${th} does ${n1} have now?`,
      a: a + b,
      expr: `${a}+${b}`,
      unit: th,
      frame: `${n1} has ___ ${th} now.`,
    };
  },
  separate: (r, { max = 10 }) => {
    const [n1, n2] = twoNames(r);
    const th = pick(r, THINGS);
    const a = int(r, 3, max);
    const b = int(r, 1, a - 1);
    return {
      text: `${n1} has ${a} ${th}. ${n1} gives ${b} ${th} to ${n2}. How many ${th} does ${n1} have left?`,
      question: `How many ${th} does ${n1} have left?`,
      a: a - b,
      expr: `${a}-${b}`,
      unit: th,
      frame: `${n1} has ___ ${th} left.`,
    };
  },
  compare: (r, { max = 20 }) => {
    const [n1, n2] = twoNames(r);
    const th = pick(r, THINGS);
    const b = int(r, 2, max - 3);
    const d = int(r, 1, max - b);
    return {
      text: `${n1} has ${b + d} ${th}. ${n2} has ${b} ${th}. How many more ${th} does ${n1} have than ${n2}?`,
      question: `How many more ${th} does ${n1} have than ${n2}?`,
      a: d,
      expr: `${b + d}-${b}`,
      unit: th,
      frame: `${n1} has ___ more ${th}.`,
    };
  },
  groups: (r, { lo = 2, hi = 9 }) => {
    const n = pick(r, NAMES);
    const g = int(r, lo, hi);
    const per = int(r, lo, hi);
    const th = pick(r, THINGS);
    return {
      text: `${n} puts ${per} ${th} in each bag. ${n} fills ${g} bags. How many ${th} are in the bags in all?`,
      question: `How many ${th} are in the bags in all?`,
      a: g * per,
      expr: `${g}*${per}`,
      unit: th,
      frame: `There are ___ ${th} in all.`,
    };
  },
  share: (r, { lo = 2, hi = 9 }) => {
    const n = pick(r, NAMES);
    const k = int(r, lo, hi);
    const per = int(r, 2, hi);
    const th = pick(r, THINGS);
    return {
      text: `${n} has ${k * per} ${th} to share equally among ${k} friends. How many ${th} does each friend get?`,
      question: `How many ${th} does each friend get?`,
      a: per,
      expr: `${k * per}/${k}`,
      unit: th,
      frame: `Each friend gets ___ ${th}.`,
    };
  },
  shareRem: (r) => {
    const n = pick(r, NAMES);
    const k = int(r, 3, 8);
    const q = int(r, 5, 25);
    const rem = int(r, 1, k - 1);
    return {
      text: `${n} has ${k * q + rem} photos. Each album holds ${k} photos. How many albums can ${n} fill completely?`,
      question: `How many albums can ${n} fill completely?`,
      a: q,
      expr: `${q}`,
      unit: "albums",
      frame: `${n} can fill ___ albums completely.`,
      note: `${k * q + rem} ÷ ${k} = ${q} remainder ${rem}; only whole albums count, so the remainder is not part of the answer.`,
    };
  },
  twoStep: (r, { big = false }) => {
    const n = pick(r, NAMES);
    const th = pick(r, ["tickets", "points", "stickers", "cards"]);
    const a = big ? int(r, 120, 480) : int(r, 12, 60);
    const b = big ? int(r, 60, 200) : int(r, 5, 30);
    const c = int(r, 3, Math.min(a + b - 1, big ? 250 : 40));
    return {
      text: `${n} had ${a} ${th}. ${n} won ${b} more ${th}, then spent ${c} ${th} on a prize. How many ${th} does ${n} have now?`,
      question: `How many ${th} does ${n} have now?`,
      a: a + b - c,
      expr: `${a}+${b}-${c}`,
      unit: th,
      frame: `${n} has ___ ${th} now.`,
    };
  },
  distractor: (r, { lo = 2, hi = 9 }) => {
    const n = pick(r, NAMES);
    const g = int(r, lo, hi);
    const per = int(r, lo, hi);
    const extra = int(r, 3, 12);
    const th = pick(r, ["pencils", "markers", "crayons", "erasers"]);
    return {
      text: `${n} is ${extra + 4} years old. ${n} buys ${g} boxes of ${th}. Each box has ${per} ${th}. How many ${th} does ${n} buy?`,
      question: `How many ${th} does ${n} buy?`,
      a: g * per,
      expr: `${g}*${per}`,
      unit: th,
      frame: `${n} buys ___ ${th}.`,
      extra: extra + 4,
    };
  },
  perimeter: (r) => {
    const n = pick(r, NAMES);
    const l = int(r, 4, 18);
    const w = int(r, 3, 12);
    return {
      text: `${n} is putting a border around a rectangular poster. The poster is ${l} inches long and ${w} inches wide. How many inches of border does ${n} need?`,
      question: `How many inches of border does ${n} need?`,
      a: 2 * (l + w),
      expr: `2*(${l}+${w})`,
      unit: "inches",
      frame: `${n} needs ___ inches of border.`,
    };
  },
  area: (r) => {
    const n = pick(r, NAMES);
    const l = int(r, 3, 15);
    const w = int(r, 3, 12);
    return {
      text: `${n} is covering a rectangular tabletop with paper. The tabletop is ${l} feet long and ${w} feet wide. How many square feet of paper does ${n} need?`,
      question: `How many square feet of paper does ${n} need?`,
      a: l * w,
      expr: `${l}*${w}`,
      unit: "square feet",
      frame: `${n} needs ___ square feet.`,
    };
  },
  fractionOfSet: (r) => {
    const n = pick(r, NAMES);
    const d = pick(r, [2, 3, 4, 5, 6, 8]);
    const k = int(r, 2, 6);
    const num = int(r, 1, d - 1);
    const total = d * k;
    return {
      text: `${n} has ${total} marbles. ${num}/${d} of them are blue. How many marbles are blue?`,
      question: `How many marbles are blue?`,
      a: num * k,
      expr: `${num}/${d}*${total}`,
      unit: "marbles",
      frame: `___ marbles are blue.`,
    };
  },
  fracAddWord: (r) => {
    const n = pick(r, NAMES);
    const d = pick(r, [4, 5, 6, 8]);
    const a = int(r, 1, d - 1);
    const b = int(r, 1, d - 1);
    return {
      text: `${n} ran ${a}/${d} mile on Monday and ${b}/${d} mile on Tuesday. How many miles did ${n} run in all?`,
      question: `How many miles did ${n} run in all?`,
      a: mixed(a + b, d),
      expr: `${a}/${d}+${b}/${d}`,
      unit: "miles",
      frame: `${n} ran ___ miles in all.`,
    };
  },
  fracMulWord: (r) => {
    const n = pick(r, NAMES);
    const d1 = pick(r, [2, 3, 4, 5]);
    const d2 = pick(r, [2, 3, 4, 6]);
    const a = int(r, 1, d1 - 1);
    const b = int(r, 1, d2 - 1);
    return {
      text: `${n} has ${a}/${d1} of a pan of lasagna left. ${n} eats ${b}/${d2} of what is left. What fraction of the whole pan did ${n} eat?`,
      question: `What fraction of the whole pan did ${n} eat?`,
      a: mixed(a * b, d1 * d2),
      expr: `${a}/${d1}*${b}/${d2}`,
      unit: "pan",
      frame: `${n} ate ___ of the whole pan.`,
    };
  },
  money: (r) => {
    const n = pick(r, NAMES);
    const price = int(r, 125, 899);
    const qty = int(r, 2, 6);
    return {
      text: `${n} buys ${qty} notebooks. Each notebook costs ${money(price)}. How much do the notebooks cost in all?`,
      question: `How much do the notebooks cost in all?`,
      a: money(price * qty),
      expr: `${moneyExpr(price)}*${qty}`,
      unit: "dollars",
      frame: `The notebooks cost ___ in all.`,
    };
  },
  unitPrice: (r) => {
    const n = pick(r, NAMES);
    const per = int(r, 2, 9);
    const k = int(r, 3, 8);
    return {
      text: `${n} pays $${per * k} for ${k} pounds of grapes. What is the price for one pound?`,
      question: `What is the price for one pound?`,
      a: `$${per}`,
      expr: `${per * k}/${k}`,
      unit: "dollars per pound",
      frame: `One pound costs $___.`,
    };
  },
  ratioRecipe: (r) => {
    const a = int(r, 2, 5);
    const b = int(r, 2, 6);
    const k = int(r, 2, 5);
    return {
      text: `A paint mix uses ${a} cups of blue for every ${b} cups of white. How many cups of white are needed for ${a * k} cups of blue?`,
      question: `How many cups of white are needed for ${a * k} cups of blue?`,
      a: b * k,
      expr: `${b}*${a * k}/${a}`,
      unit: "cups",
      frame: `___ cups of white are needed.`,
    };
  },
  percentDiscount: (r) => {
    const price = pick(r, [20, 40, 50, 60, 80, 120]);
    const p = pick(r, [10, 20, 25, 50]);
    const n = pick(r, NAMES);
    return {
      text: `A jacket costs $${price}. ${n} has a coupon for ${p}% off. What is the sale price?`,
      question: `What is the sale price?`,
      a: `$${price - (price * p) / 100}`,
      expr: `${price}-${price}*${p}/100`,
      unit: "dollars",
      frame: `The sale price is $___.`,
    };
  },
  tip: (r) => {
    const bill = pick(r, [20, 30, 40, 50, 60, 80]);
    const p = pick(r, [10, 15, 20]);
    const n = pick(r, NAMES);
    return {
      text: `${n}'s family bill is $${bill}. They leave a ${p}% tip. What is the total, bill plus tip?`,
      question: `What is the total, bill plus tip?`,
      a: `$${bill + (bill * p) / 100}`,
      expr: `${bill}+${bill}*${p}/100`,
      unit: "dollars",
      frame: `The total is $___.`,
    };
  },
  meanWord: (r) => {
    const n = pick(r, NAMES);
    const { vals, mean } = meanSet(r, 4, 4, 22);
    return {
      text: `${n} scored ${vals.join(", ")} points in four games. What was ${n}'s mean score?`,
      question: `What was ${n}'s mean score?`,
      a: mean,
      expr: `(${vals.join("+")})/4`,
      unit: "points",
      frame: `${n}'s mean score was ___ points.`,
    };
  },
  temp: (r) => {
    const start = int(r, -8, 6);
    const drop = int(r, 3, 12);
    return {
      text: `At noon it was ${start}°F. By midnight the temperature dropped ${drop} degrees. What was the temperature at midnight?`,
      question: `What was the temperature at midnight?`,
      a: `${start - drop}°F`,
      expr: `(${start})-(${drop})`,
      unit: "degrees",
      frame: `At midnight it was ___°F.`,
    };
  },
  equation: (r) => {
    const n = pick(r, NAMES);
    const x = int(r, 4, 20);
    const k = int(r, 2, 9);
    return {
      text: `${n} saves the same amount each week. After ${k} weeks ${n} has $${k * x}. Write and solve ${k}w = ${k * x}. How much does ${n} save each week?`,
      question: `How much does ${n} save each week?`,
      a: `$${x}`,
      expr: `${k * x}/${k}`,
      unit: "dollars",
      frame: `${n} saves $___ each week.`,
    };
  },
  twoStepEqWord: (r) => {
    const n = pick(r, NAMES);
    const fee = int(r, 5, 25);
    const rate = int(r, 3, 12);
    const h = int(r, 2, 10);
    return {
      text: `A skate park charges a $${fee} entry fee plus $${rate} per hour. ${n} paid $${fee + rate * h} in all. Solve ${rate}h + ${fee} = ${fee + rate * h}. How many hours did ${n} skate?`,
      question: `How many hours did ${n} skate?`,
      a: h,
      expr: `(${fee + rate * h}-${fee})/${rate}`,
      unit: "hours",
      frame: `${n} skated for ___ hours.`,
    };
  },
  pythagWord: (r) => {
    const t = pick(r, [
      [3, 4, 5],
      [5, 12, 13],
      [6, 8, 10],
      [8, 15, 17],
    ]);
    return {
      text: `A ladder reaches ${t[1]} feet up a wall. Its base is ${t[0]} feet from the wall. How long is the ladder?`,
      question: `How long is the ladder?`,
      a: t[2],
      expr: `${t[2]}`,
      unit: "feet",
      frame: `The ladder is ___ feet long.`,
      args: [t[0], t[1], t[2]],
    };
  },
  slopeWord: (r) => {
    const rate = int(r, 2, 9);
    const start = int(r, 3, 20);
    const h = int(r, 2, 8);
    return {
      text: `A plant is ${start} cm tall now and grows ${rate} cm every week. It can be modeled by y = ${rate}x + ${start}. How tall will it be after ${h} weeks?`,
      question: `How tall will it be after ${h} weeks?`,
      a: `${rate * h + start} cm`,
      expr: `${rate}*${h}+${start}`,
      unit: "cm",
      frame: `After ${h} weeks it will be ___ cm tall.`,
    };
  },
  probWord: (r) => {
    const red = int(r, 2, 7);
    const blue = int(r, 2, 7);
    const green = int(r, 1, 5);
    return {
      text: `A bag has ${red} red, ${blue} blue, and ${green} green tiles. One tile is picked without looking. What is the probability it is blue?`,
      question: `What is the probability it is blue?`,
      a: frac(blue, red + blue + green),
      expr: `${blue}/${red + blue + green}`,
      unit: "probability",
      frame: `The probability is ___.`,
    };
  },
  sciWord: (r) => {
    const m = int(r, 11, 99) / 10;
    const p = int(r, 3, 6);
    const n = Math.round(m * 10 ** p);
    return {
      text: `A town has ${comma(n)} people. Write the population in scientific notation as ${m} × 10^p. What is p?`,
      question: `What is p?`,
      a: p,
      expr: `${p}`,
      unit: "power of 10",
      frame: `p = ___.`,
    };
  },
  cylWord: (r) => {
    const rad = int(r, 2, 6);
    const h = int(r, 4, 12);
    return {
      text: `A can has radius ${rad} cm and height ${h} cm. Find its volume in terms of π. (Volume = π × r² × h.)`,
      question: `Find its volume in terms of π.`,
      a: `${rad * rad * h}π cm³`,
      expr: `${rad * rad * h}`,
      unit: "cubic centimeters",
      frame: `The volume is ___π cm³.`,
    };
  },
  // Non-arithmetic literacy items for shape and measure units
  shapeStory: (r) => {
    const n = pick(r, NAMES);
    const s1 = pick(r, ["triangle", "square", "pentagon"]);
    const s2 = pick(r, ["square", "hexagon", "rectangle"]);
    const a = SHAPE_SIDES[s1];
    const b = SHAPE_SIDES[s2];
    return {
      text: `${n} draws a ${s1} and a ${s2}. How many sides do the two shapes have in all?`,
      question: `How many sides do the two shapes have in all?`,
      a: a + b,
      expr: `${a}+${b}`,
      unit: "sides",
      frame: `The shapes have ___ sides in all.`,
    };
  },
};

export function make(table, kind, params, r) {
  const f = table[kind];
  if (!f) throw new Error(`math-literacy: unknown generator "${kind}"`);
  return f(r, params || {});
}

/** Draw n unique-by-text items. */
export function draw(table, kind, params, r, n) {
  const out = [];
  const seen = new Set();
  let guard = 0;
  while (out.length < n && guard++ < n * 60) {
    const it = make(table, kind, params, r);
    const key = it.q || it.text;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}
