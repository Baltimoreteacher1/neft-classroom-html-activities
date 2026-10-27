// What every card face MEANS. A rep is a small JSON object ({ t: "frac", n: 3, d: 4 }); this file turns it into an
// exact value (a vector of exact fractions) and into the words a screen reader hears. Two faces belong to the same
// set exactly when their values are equal, so equivalence is decided here with exact rationals and never by looking
// at how a card is drawn. @fm2 FM-052 FM-053 FM-054 FM-055 FM-056 FM-057 FM-058 FM-008
import {
  add,
  div,
  frac,
  fromDecimal,
  mul,
  sub,
  toDecimalString,
  toString,
} from "../../rational.js";
import { cap, plural, signed, words } from "./words.js";

export const RATIO_CTX = [
  {
    num: { en: ["mile", "miles"], es: ["milla", "millas"] },
    den: { en: ["hour", "hours"], es: ["hora", "horas"] },
    join: { en: "in", es: "en" },
  },
  {
    num: { en: ["cup", "cups"], es: ["taza", "tazas"] },
    den: { en: ["serving", "servings"], es: ["porción", "porciones"] },
    join: { en: "for", es: "para" },
  },
  {
    num: { en: ["dollar", "dollars"], es: ["dólar", "dólares"] },
    den: { en: ["pound", "pounds"], es: ["libra", "libras"] },
    join: { en: "for", es: "por" },
  },
  {
    num: { en: ["page", "pages"], es: ["página", "páginas"] },
    den: { en: ["minute", "minutes"], es: ["minuto", "minutos"] },
    join: { en: "in", es: "en" },
  },
  {
    num: { en: ["meter", "meters"], es: ["metro", "metros"] },
    den: { en: ["second", "seconds"], es: ["segundo", "segundos"] },
    join: { en: "in", es: "en" },
  },
];
const unit = (ctx, side, count, lang) => RATIO_CTX[ctx][side][lang][count === 1 ? 0 : 1];

const pow10 = (k) => (k >= 0 ? frac(10 ** k) : frac(1, 10 ** -k));
const one = (n) => [frac(n)];

// ---- math helpers shared by values -------------------------------------------------------------------------------
// Left-to-right evaluation with the usual precedence, on exact fractions.
export function evaluate(text) {
  const tokens = text.match(/\d+|[+\-−×÷()]/g) || [];
  let at = 0;
  const factor = () => {
    const token = tokens[at++];
    if (token === "(") {
      const inner = expression();
      at += 1;
      return inner;
    }
    return frac(Number(token));
  };
  const term = () => {
    let value = factor();
    while (tokens[at] === "×" || tokens[at] === "÷")
      value = tokens[at++] === "×" ? mul(value, factor()) : div(value, factor());
    return value;
  };
  const expression = () => {
    let value = term();
    while (tokens[at] === "+" || tokens[at] === "−" || tokens[at] === "-")
      value = tokens[at++] === "+" ? add(value, term()) : sub(value, term());
    return value;
  };
  return expression();
}

const rateText = (v) => {
  if (v.d === 1) return String(v.n);
  const decimal = toDecimalString(v);
  return decimal && decimal.split(".")[1].length <= 2 ? decimal : toString(v);
};
const slope = (mn, md) => {
  const sign = mn < 0 ? "−" : "";
  const m = Math.abs(mn);
  if (md === 1) return m === 1 ? `${sign}x` : `${sign}${m}x`;
  return m === 1 ? `${sign}x/${md}` : `${sign}(${m}/${md})x`;
};
export const lineText = (mn, md, b) =>
  `y = ${slope(mn, md)}${b ? ` ${b < 0 ? "−" : "+"} ${Math.abs(b)}` : ""}`;
export const algText = (a, ad, b) => {
  const coef = ad === 1 ? (a === 1 ? "n" : a === -1 ? "−n" : `${a}n`) : `n/${ad}`;
  if (a === -1 && ad === 1 && b > 0) return `${b} − n`;
  return b ? `${coef} ${b < 0 ? "−" : "+"} ${Math.abs(b)}` : coef;
};
const verbal = (r, lang) => {
  const { a, ad = 1, b } = r;
  const n = lang === "es" ? "un número n" : "a number n";
  if (ad === 2) return lang === "es" ? "Un número n dividido entre 2" : "A number n divided by 2";
  if (a === -1) return lang === "es" ? `${b} menos ${n}` : `${b} minus ${n}`;
  const times = a === 1 ? n : lang === "es" ? `${a} veces ${n}` : `${a} times ${n}`;
  if (!b) return cap(times);
  const more =
    lang === "es" ? (b > 0 ? "más que" : "menos que") : b > 0 ? "more than" : "less than";
  return `${Math.abs(b)} ${more} ${times}`;
};
export const tableValues = (a, ad, b, ns) => ns.map((n) => add(mul(frac(a, ad), frac(n)), frac(b)));
const tableLabel = (head, xs, ys, lang) =>
  `${lang === "es" ? "Tabla" : "Table"}: ${head[0]} ${lang === "es" ? "es" : "is"} ${xs.join(", ")} ${lang === "es" ? "y" : "and"} ${head[1]} ${lang === "es" ? "es" : "is"} ${ys.map(signed).join(", ")}`;
const timeNames = (h, m, lang) => {
  if (lang === "es") return `${h === 1 ? "la 1" : `las ${h}`} ${m ? "y media" : "en punto"}`;
  return m ? `half past ${h}` : `${h} o'clock`;
};
const coinText = (r, lang) => {
  const items = [
    [r.q, 25, "quarter", "quarters"],
    [r.d, 10, "dime", "dimes"],
    [r.n, 5, "nickel", "nickels"],
    [r.p, 1, "penny", "pennies"],
  ].filter((c) => c[0]);
  const list = items.map(([k, cents, one1, many]) =>
    lang === "es" ? `${k} de ${cents}¢` : `${k} ${plural(k, one1, many)} (${cents}¢)`,
  );
  return `${lang === "es" ? "Monedas" : "Coins"}: ${list.join(", ")}`;
};
const fracBarText = (r, lang) => {
  const bars = Math.ceil(r.n / r.d);
  if (bars === 1)
    return lang === "es"
      ? `Barra dividida en ${r.d} partes iguales, ${r.n} ${plural(r.n, "sombreada", "sombreadas")}`
      : `Bar cut into ${r.d} equal parts, ${r.n} shaded`;
  return lang === "es"
    ? `${bars} barras, cada una dividida en ${r.d} partes iguales, ${r.n} partes sombreadas`
    : `${bars} bars, each cut into ${r.d} equal parts, ${r.n} parts shaded`;
};
const unitRateLabel = (r, lang) => {
  const v = frac(r.n, r.d);
  const small = v.n <= v.d;
  const text = rateText(v);
  const noun = unit(r.ctx, "num", small ? 1 : 2, lang);
  const per = unit(r.ctx, "den", 1, lang);
  if (lang === "es") return `${text.includes("/") ? `${text} de` : text} ${noun} por ${per}`;
  return `${text} ${noun} per ${per}`;
};
const propEq = (r) => {
  const v = frac(r.n, r.d);
  if (v.d === 1) return `y = ${v.n}x`;
  const decimal = toDecimalString(v);
  if (decimal && decimal.split(".")[1].length <= 2) return `y = ${decimal}x`;
  return v.n === 1 ? `y = x/${v.d}` : `y = (${v.n}/${v.d})x`;
};
const propVerbal = (r, lang) => {
  const v = frac(r.n, r.d);
  if (v.n < v.d) return lang === "es" ? `y es ${toString(v)} de x` : `y is ${toString(v)} of x`;
  return lang === "es" ? `y es ${rateText(v)} veces x` : `y is ${rateText(v)} times x`;
};

// ---- the table: type -> [value(rep), label(rep, lang)] -----------------------------------------------------------
export const REPS = {
  numeral: [(r) => one(r.n), (r) => signed(r.n)],
  word: [
    (r) => one(r.n),
    (r, l) =>
      r.unit === "cents"
        ? `${words(r.n, l, true)} ${l === "es" ? plural(r.n, "centavo", "centavos") : plural(r.n, "cent", "cents")}`
        : words(r.n, l),
  ],
  dots: [
    (r) => one(r.n),
    (r, l) => `${r.n} ${l === "es" ? plural(r.n, "punto", "puntos") : plural(r.n, "dot", "dots")}`,
  ],
  tenframe: [
    (r) => one(r.n),
    (r, l) =>
      l === "es"
        ? `${r.n > 10 ? "Cuadros" : "Cuadro"} de diez con ${r.n} ${plural(r.n, "ficha", "fichas")}`
        : `${r.n > 10 ? "Ten-frames" : "Ten-frame"} with ${r.n} ${plural(r.n, "counter", "counters")}`,
  ],
  sum: [(r) => one(r.parts.reduce((a, b) => a + b, 0)), (r) => r.parts.join(" + ")],
  skiplist: [
    (r) => one(r.step * r.count),
    (r) => Array.from({ length: r.count }, (_, i) => r.step * (i + 1)).join(", "),
  ],
  groups: [
    (r) => one(r.a + r.b),
    (r, l) =>
      l === "es"
        ? `${r.a} ${plural(r.a, "círculo", "círculos")} y ${r.b} ${plural(r.b, "cuadrado", "cuadrados")}`
        : `${r.a} ${plural(r.a, "circle", "circles")} and ${r.b} ${plural(r.b, "square", "squares")}`,
  ],
  array: [
    (r) => one(r.r * r.c),
    (r, l) =>
      l === "es"
        ? `Arreglo: ${r.r} ${plural(r.r, "fila", "filas")} de ${r.c}`
        : `Array: ${r.r} ${plural(r.r, "row", "rows")} of ${r.c}`,
  ],
  prod: [(r) => one(r.a * r.b), (r) => `${r.a} × ${r.b}`],
  blocks: [
    (r) => one(10 * r.tn + r.o),
    (r, l) =>
      l === "es"
        ? `Bloques de base diez: ${r.tn} ${plural(r.tn, "barra", "barras")} y ${r.o} ${plural(r.o, "cubito", "cubitos")}`
        : `Base-ten blocks: ${r.tn} ${plural(r.tn, "rod", "rods")} and ${r.o} ${plural(r.o, "cube", "cubes")}`,
  ],
  tens: [
    (r) => one(10 * r.tn + r.o),
    (r, l) =>
      l === "es"
        ? `${r.tn} ${plural(r.tn, "decena", "decenas")} + ${r.o} ${plural(r.o, "unidad", "unidades")}`
        : `${r.tn} ${plural(r.tn, "ten", "tens")} + ${r.o} ${plural(r.o, "one", "ones")}`,
  ],
  coins: [(r) => one(25 * r.q + 10 * r.d + 5 * r.n + r.p), coinText],
  cents: [(r) => one(r.n), (r) => `${r.n}¢`],
  clock: [
    (r) => [frac(60 * r.h + r.m, 60)],
    (r, l) => {
      const next = (r.h % 12) + 1;
      if (l === "es")
        return r.m
          ? `Reloj: la manecilla corta está entre el ${r.h} y el ${next}, la larga señala el 6`
          : `Reloj: la manecilla corta señala el ${r.h}, la larga señala el 12`;
      return r.m
        ? `Clock: short hand halfway between ${r.h} and ${next}, long hand points to 6`
        : `Clock: short hand points to ${r.h}, long hand points to 12`;
    },
  ],
  digital: [(r) => [frac(60 * r.h + r.m, 60)], (r) => `${r.h}:${String(r.m).padStart(2, "0")}`],
  timeword: [(r) => [frac(60 * r.h + r.m, 60)], (r, l) => timeNames(r.h, r.m, l)],
  fracbar: [(r) => [frac(r.n, r.d)], fracBarText],
  frac: [(r) => [frac(r.n, r.d)], (r) => `${r.n}/${r.d}`],
  fracline: [
    (r) => [frac(r.n, r.d)],
    (r, l) =>
      l === "es"
        ? `Recta numérica de 0 a ${r.max}, cada entero dividido en ${r.d} partes iguales, punto a ${r.n} ${plural(r.n, "parte", "partes")} del 0`
        : `Number line from 0 to ${r.max}, each whole cut into ${r.d} equal parts, point ${r.n} ${plural(r.n, "part", "parts")} from 0`,
  ],
  decimal: [(r) => [fromDecimal(r.text)], (r) => r.text],
  percent: [(r) => [div(fromDecimal(r.text), frac(100))], (r) => `${r.text}%`],
  hgrid: [
    (r) => [frac(r.k, 100)],
    (r, l) =>
      l === "es"
        ? `Cuadrícula de cien con ${r.k} de 100 cuadrados sombreados`
        : `Hundred grid with ${r.k} of 100 squares shaded`,
  ],
  expanded: [
    (r) => one(r.n),
    (r) =>
      String(r.n)
        .split("")
        .map((digit, i, all) =>
          digit === "0" ? "" : signed(Number(digit) * 10 ** (all.length - 1 - i)),
        )
        .filter(Boolean)
        .join(" + "),
  ],
  calc: [(r) => [evaluate(r.text)], (r) => r.text],
  ratiotable: [
    (r) => [frac(r.rows[0][1], r.rows[0][0])],
    (r, l) =>
      `${l === "es" ? "Tabla de razones" : "Ratio table"}: ${r.rows.map(([d, n]) => `${d} ${unit(r.ctx, "den", d, l)}, ${n} ${unit(r.ctx, "num", n, l)}`).join("; ")}`,
  ],
  ratiostmt: [
    (r) => [frac(r.a, r.b)],
    (r, l) =>
      `${r.a} ${unit(r.ctx, "num", r.a, l)} ${RATIO_CTX[r.ctx].join[l]} ${r.b} ${unit(r.ctx, "den", r.b, l)}`,
  ],
  unitrate: [(r) => [frac(r.n, r.d)], unitRateLabel],
  verbal: [(r) => [frac(r.a, r.ad || 1), frac(r.b)], verbal],
  alg: [(r) => [frac(r.a, r.ad || 1), frac(r.b)], (r) => algText(r.a, r.ad || 1, r.b)],
  vtable: [
    (r) => [frac(r.a, r.ad || 1), frac(r.b)],
    (r, l) =>
      tableLabel(
        ["n", l === "es" ? "el resultado" : "the output"],
        r.ns,
        tableValues(r.a, r.ad || 1, r.b, r.ns).map((v) => v.n),
        l,
      ),
  ],
  ptable: [
    (r) => [frac(r.n, r.d)],
    (r, l) =>
      tableLabel(
        ["x", "y"],
        r.xs,
        r.xs.map((x) => (x * r.n) / r.d),
        l,
      ),
  ],
  peq: [(r) => [frac(r.n, r.d)], propEq],
  pverbal: [(r) => [frac(r.n, r.d)], propVerbal],
  intexpr: [
    (r) => one(r.op === "+" ? r.a + r.b : r.a - r.b),
    (r) => `${signed(r.a)} ${r.op} ${r.b < 0 ? `(${signed(r.b)})` : r.b}`,
  ],
  move: [
    (r) => one(r.a + r.s),
    (r, l) =>
      l === "es"
        ? `Recta numérica: empieza en ${signed(r.a)}, flecha de ${Math.abs(r.s)} ${plural(Math.abs(r.s), "paso", "pasos")} a la ${r.s > 0 ? "derecha" : "izquierda"}`
        : `Number line: start at ${signed(r.a)}, arrow ${Math.abs(r.s)} ${plural(Math.abs(r.s), "step", "steps")} ${r.s > 0 ? "right" : "left"}`,
  ],
  leq: [(r) => [frac(r.mn, r.md), frac(r.b)], (r) => lineText(r.mn, r.md, r.b)],
  lgraph: [
    (r) => [frac(r.mn, r.md), frac(r.b)],
    (r, l) =>
      l === "es"
        ? `Gráfica de una recta: cruza el eje y en ${signed(r.b)}, ${r.mn > 0 ? "sube" : "baja"} ${Math.abs(r.mn)} por cada ${r.md} a la derecha`
        : `Line graph: crosses the y-axis at ${signed(r.b)}, goes ${r.mn > 0 ? "up" : "down"} ${Math.abs(r.mn)} for every ${r.md} right`,
  ],
  ltable: [
    (r) => [frac(r.mn, r.md), frac(r.b)],
    (r, l) =>
      tableLabel(
        ["x", "y"],
        r.xs,
        r.xs.map((x) => (r.mn * x) / r.md + r.b),
        l,
      ),
  ],
  product10: [
    (r) => [mul(frac(r.a * r.b), pow10(r.p + r.q))],
    (r, l) => {
      const power = l === "es" ? "a la potencia" : "to the power";
      return `(${r.a} × 10 ${power} ${signed(r.p)}) × (${r.b} × 10 ${power} ${signed(r.q)})`;
    },
  ],
  plain: [(r) => [fromDecimal(r.text.replaceAll(",", ""))], (r) => r.text],
  sci: [
    (r) => [mul(fromDecimal(r.c), pow10(r.e))],
    (r, l) => `${r.c} × 10 ${l === "es" ? "a la potencia" : "to the power"} ${signed(r.e)}`,
  ],
};

export function repValue(rep) {
  const entry = REPS[rep.t];
  if (!entry) throw new RangeError(`Unknown card type ${rep.t}`);
  return entry[0](rep);
}
export const repLabel = (rep, lang) => REPS[rep.t][1](rep, lang);
export const valueKey = (value) => value.map(toString).join(";");
export const repKey = (rep) => valueKey(repValue(rep));
