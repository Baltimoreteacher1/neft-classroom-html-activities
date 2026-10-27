// The expression templates a duel hand is played on. A template lists its slots (each takes one kind of card), how the
// expression reads on the page, and how it is evaluated with exact rationals. Pure and DOM-free.
// @fm2 FM-016 FM-050 FM-052 FM-053 FM-054 FM-055 FM-058
import { add, div, frac, mul, sub } from "../../rational.js";

const ZERO = frac(0);
const ONE = frac(1);
const TEN = frac(10);

export function powQ(base, exp) {
  if (exp.d !== 1) throw new RangeError("Exponents are whole numbers");
  let out = ONE;
  for (let i = 0; i < Math.abs(exp.n); i += 1) out = mul(out, base);
  return exp.n < 0 ? div(ONE, out) : out;
}

export function rootQ(value) {
  const r = Math.round(Math.sqrt(value.n));
  if (value.d !== 1 || value.n < 0 || r * r !== value.n)
    throw new RangeError("Only perfect squares have an exact root");
  return frac(r);
}

const digits = (vals) => vals.reduce((acc, v) => add(mul(acc, TEN), v), ZERO);
const absQ = (q) => frac(Math.abs(q.n), q.d);

// a op b op c with × before + and −; every other pair is read left to right.
function ops3(v) {
  const [a, o1, b, o2, c] = v;
  const apply = (x, o, y) => (o === "+" ? add(x, y) : o === "−" ? sub(x, y) : mul(x, y));
  if (o2 === "×" && o1 !== "×") return apply(a, o1, apply(b, o2, c));
  return apply(apply(a, o1, b), o2, c);
}

// The wrong order some learners use: strictly left to right.
export function leftToRight(v) {
  const [a, o1, b, o2, c] = v;
  const apply = (x, o, y) => (o === "+" ? add(x, y) : o === "−" ? sub(x, y) : mul(x, y));
  return apply(apply(a, o1, b), o2, c);
}

const T = (slots, layout, fn, extra = {}) => ({
  slots,
  layout: typeof layout === "string" ? { en: layout, es: layout } : layout,
  fn,
  ...extra,
});

export const TEMPLATES = {
  single: T(["num"], "{0}", (v) => v[0], { free: true, noun: "value" }),
  sum2: T(["num", "num"], "{0} + {1}", (v) => add(v[0], v[1]), { free: true, noun: "sum" }),
  sum3: T(["num", "num", "num"], "{0} + {1} + {2}", (v) => add(add(v[0], v[1]), v[2]), {
    free: true,
    noun: "sum",
  }),
  sum4: T(["num", "num", "num", "num"], "{0} + {1} + {2} + {3}", (v) => v.reduce(add), {
    free: true,
    noun: "total",
  }),
  num2: T(["num", "num"], "{0}{1}", digits, { noun: "number", places: true }),
  num3: T(["num", "num", "num"], "{0}{1}{2}", digits, { noun: "number", places: true }),
  num4: T(["num", "num", "num", "num"], "{0}{1}{2}{3}", digits, { noun: "number", places: true }),
  dsum2: T(
    ["num", "num", "num", "num"],
    "{0}{1} + {2}{3}",
    (v) => add(digits([v[0], v[1]]), digits([v[2], v[3]])),
    { noun: "sum", places: true },
  ),
  ddiff2: T(
    ["num", "num", "num", "num"],
    "|{0}{1} − {2}{3}|",
    (v) => absQ(sub(digits([v[0], v[1]]), digits([v[2], v[3]]))),
    { noun: "diff", places: true },
  ),
  prod2: T(["num", "num"], "{0} × {1}", (v) => mul(v[0], v[1]), { free: true, noun: "product" }),
  prodsum: T(["num", "num", "num"], "{0} × {1} + {2}", (v) => add(mul(v[0], v[1]), v[2]), {
    noun: "value",
  }),
  paren: T(["num", "num", "num"], "({0} + {1}) × {2}", (v) => mul(add(v[0], v[1]), v[2]), {
    noun: "value",
  }),
  ops3: T(["num", "op", "num", "op", "num"], "{0} {1} {2} {3} {4}", ops3, {
    noun: "value",
    ops: true,
  }),
  frac2: T(["num", "num"], "{0} / {1}", (v) => div(v[0], v[1]), { noun: "fraction" }),
  fracdiv: T(
    ["num", "num", "num", "num"],
    "({0} / {1}) ÷ ({2} / {3})",
    (v) => div(div(v[0], v[1]), div(v[2], v[3])),
    { noun: "quotient" },
  ),
  pct: T(
    ["num", "num"],
    { en: "{0}% of {1}", es: "{0}% de {1}" },
    (v) => mul(div(v[0], frac(100)), v[1]),
    { noun: "amount" },
  ),
  pow: T(["num", "exp"], "{0}^{1}", (v) => powQ(v[0], v[1]), { noun: "power" }),
  powsum: T(
    ["num", "exp", "num", "exp"],
    "{0}^{1} + {2}^{3}",
    (v) => add(powQ(v[0], v[1]), powQ(v[2], v[3])),
    { noun: "sum" },
  ),
  sci: T(["num", "exp"], "{0} × 10^{1}", (v) => mul(v[0], powQ(TEN, v[1])), { noun: "sci" }),
  root2: T(["num", "num"], "√{0} + √{1}", (v) => add(rootQ(v[0]), rootQ(v[1])), {
    free: true,
    noun: "rootsum",
  }),
  root3: T(
    ["num", "num", "num"],
    "√{0} + √{1} + √{2}",
    (v) => add(add(rootQ(v[0]), rootQ(v[1])), rootQ(v[2])),
    { free: true, noun: "rootsum" },
  ),
};

export const KINDS = ["num", "exp", "op"];

export const slotKinds = (tplId) => TEMPLATES[tplId].slots;
export const slotCount = (tplId) => TEMPLATES[tplId].slots.length;

// Number of slots of one kind in a template.
export const kindCount = (tplId, kind) => TEMPLATES[tplId].slots.filter((k) => k === kind).length;

// Fill a layout with display texts (one per slot): "{0} × {1}" + ["7","8"] -> "7 × 8". Empty slots show "_".
export function fillLayout(tplId, texts, lang = "en") {
  return TEMPLATES[tplId].layout[lang].replace(/\{(\d)\}/g, (_, i) => texts[Number(i)] ?? "_");
}

// Split a layout into text and slot parts for rendering: [{text}, {slot: 0}, ...].
export function layoutParts(tplId, lang = "en") {
  return TEMPLATES[tplId].layout[lang]
    .split(/(\{\d\})/)
    .filter(Boolean)
    .map((part) => {
      const m = /^\{(\d)\}$/.exec(part);
      return m ? { slot: Number(m[1]) } : { text: part };
    });
}
