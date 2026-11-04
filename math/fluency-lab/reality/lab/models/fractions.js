// Fraction models: one bar (partition, shade, subdivide), two bars that must be the same size before they combine, and
// the X-Ray division bar. All values are exact Rationals; the picture is always derived from the counts.
import { L, R, Rational, clampInt, decimalText, fracText } from "../kernel.js";

const MAX_DEN = 24;

const refuse = (en, es) => ({ refuse: L(en, es) });
const same = (state) => ({ state });

// ---- one fraction bar ------------------------------------------------------------------------------------------
export const fraction = {
  id: "fraction",
  init: ({ den = 1, shaded = [], maxDen = MAX_DEN } = {}) => ({ den, shaded: [...shaded], maxDen, cases: [] }),
  reduce(state, action) {
    switch (action.type) {
      case "partition": {
        const n = clampInt(action.n, 2, 12);
        if (state.den !== 1)
          return refuse(
            "The whole is already cut into equal parts. Use “Cut every part” to make smaller pieces.",
            "El entero ya está dividido en partes iguales. Usa “Corta cada parte” para hacer piezas más pequeñas.",
          );
        if (n > state.maxDen)
          return refuse(
            "That is too many parts for this bar.",
            "Son demasiadas partes para esta barra.",
          );
        return { state: { ...state, den: n, shaded: [] } };
      }
      case "split": {
        const n = clampInt(action.n, 2, 6);
        if (state.den === 1)
          return refuse(
            "Cut the whole into equal parts first.",
            "Primero corta el entero en partes iguales.",
          );
        if (state.den * n > state.maxDen)
          return refuse(
            "The pieces would be too small to show. Try a smaller cut.",
            "Las piezas serían demasiado pequeñas para mostrarlas. Prueba un corte menor.",
          );
        const shaded = state.shaded.flatMap((i) => Array.from({ length: n }, (_, j) => i * n + j));
        return { state: { ...state, den: state.den * n, shaded } };
      }
      case "merge": {
        const n = clampInt(action.n, 2, 6);
        if (state.den % n !== 0 || state.den === 1)
          return refuse(
            "The parts cannot be joined into groups of that size.",
            "Las partes no se pueden unir en grupos de ese tamaño.",
          );
        const set = new Set(state.shaded);
        for (let g = 0; g < state.den / n; g++) {
          const inside = Array.from({ length: n }, (_, j) => set.has(g * n + j));
          if (inside.some(Boolean) && !inside.every(Boolean))
            return refuse(
              "Some pieces in a group are shaded and some are not, so they cannot be joined without changing the amount.",
              "Algunas piezas de un grupo están sombreadas y otras no, así que no se pueden unir sin cambiar la cantidad.",
            );
        }
        const shaded = [...new Set(state.shaded.map((i) => Math.floor(i / n)))];
        return { state: { ...state, den: state.den / n, shaded } };
      }
      case "toggle": {
        if (!Number.isInteger(action.i) || action.i < 0 || action.i >= state.den)
          return same(state);
        const has = state.shaded.includes(action.i);
        const shaded = has
          ? state.shaded.filter((i) => i !== action.i)
          : [...state.shaded, action.i].sort((a, b) => a - b);
        return { state: { ...state, shaded } };
      }
      case "save": {
        if (state.den < 2 || !state.shaded.length)
          return refuse("Make a fraction on the bar first, then save it.", "Primero haz una fracción en la barra, luego guárdala.");
        if (state.cases.some((c) => c.den === state.den && c.num === state.shaded.length))
          return refuse("You already saved that fraction. Make a different one.", "Ya guardaste esa fracción. Haz una diferente.");
        return { state: { ...state, cases: [...state.cases, { num: state.shaded.length, den: state.den }].slice(-12) } };
      }
      case "clearCases":
        return { state: { ...state, cases: [] } };
      case "setShaded": {
        const k = clampInt(action.k, 0, state.den);
        if (k === state.shaded.length && state.shaded.every((v, i) => v === i)) return same(state);
        return { state: { ...state, shaded: Array.from({ length: k }, (_, i) => i) } };
      }
      default:
        return same(state);
    }
  },
  derive(state) {
    const num = state.shaded.length;
    const value = R(num, state.den);
    return {
      den: state.den,
      num,
      value,
      simplest: fracText(value),
      decimal: decimalText(value),
      percent: decimalText(value.mul(100), 4),
      // Where the bar's right edge of the shaded part lands on a number line from 0 to 1.
      position: value,
      ticks: Array.from({ length: state.den + 1 }, (_, i) => R(i, state.den)),
      cases: state.cases.map((c) => ({ ...c, value: R(c.num, c.den) })),
    };
  },
  describe(state, lang) {
    const d = fraction.derive(state);
    if (state.den === 1)
      return lang === "es" ? "Una barra entera, sin dividir." : "One whole bar, not cut yet.";
    return lang === "es"
      ? `Barra dividida en ${d.den} partes iguales, ${d.num} sombreadas. La fracción es ${d.num}/${d.den}, igual a ${d.decimal ?? "un decimal periódico"}.`
      : `A bar cut into ${d.den} equal parts, ${d.num} shaded. The fraction is ${d.num}/${d.den}, which equals ${d.decimal ?? "a repeating decimal"}.`;
  },
};

// ---- two bars that must match before they can be added -----------------------------------------------------------
export const fracadd = {
  id: "fracadd",
  init: ({ a = [1, 2], b = [1, 3], maxDen = MAX_DEN } = {}) => ({
    a: fraction.init({ den: a[1], shaded: Array.from({ length: a[0] }, (_, i) => i), maxDen }),
    b: fraction.init({ den: b[1], shaded: Array.from({ length: b[0] }, (_, i) => i), maxDen }),
    combined: false,
  }),
  reduce(state, action) {
    if (action.type === "on") {
      if (state.combined)
        return refuse(
          "The bars are already combined. Undo to change them.",
          "Las barras ya están combinadas. Deshaz para cambiarlas.",
        );
      const bar = action.bar === "b" ? "b" : "a";
      const out = fraction.reduce(state[bar], action.act);
      if (out.refuse) return out;
      return { state: { ...state, [bar]: out.state } };
    }
    if (action.type === "combine") {
      if (state.combined) return same(state);
      if (state.a.den !== state.b.den)
        return refuse(
          "The pieces are different sizes, so they cannot be counted together yet. Cut both bars until the pieces match.",
          "Las piezas son de distinto tamaño, así que todavía no se pueden contar juntas. Corta las dos barras hasta que las piezas coincidan.",
        );
      return { state: { ...state, combined: true } };
    }
    return same(state);
  },
  derive(state) {
    const a = fraction.derive(state.a);
    const b = fraction.derive(state.b);
    const sameSize = state.a.den === state.b.den;
    const sum = a.value.add(b.value);
    return {
      a,
      b,
      sameSize,
      combined: state.combined,
      total: state.combined ? R(a.num + b.num, state.a.den) : null,
      sum,
      sumText: fracText(sum),
    };
  },
  describe(state, lang) {
    const d = fracadd.derive(state);
    return lang === "es"
      ? `Dos barras: ${d.a.num}/${d.a.den} y ${d.b.num}/${d.b.den}. ${d.sameSize ? "Las piezas son del mismo tamaño." : "Las piezas son de distinto tamaño."}`
      : `Two bars: ${d.a.num}/${d.a.den} and ${d.b.num}/${d.b.den}. ${d.sameSize ? "The pieces are the same size." : "The pieces are different sizes."}`;
  },
};

const lcm = (a, b) => {
  let x = a;
  let y = b;
  while (y) [x, y] = [y, x % y];
  return (a / x) * b;
};

// ---- X-Ray division: how many groups of the divisor fit in the dividend? ----------------------------------------
export const fracdiv = {
  id: "fracdiv",
  init: ({ dividend = [3, 4], divisor = [1, 8] } = {}) => {
    const a = R(dividend[0], dividend[1]);
    const b = R(divisor[0], divisor[1]);
    const unit = Number(lcm(a.d, b.d));
    return { a, b, unit, split: false, xray: false, marked: [] };
  },
  reduce(state, action) {
    const d = fracdiv.derive(state);
    switch (action.type) {
      case "xray":
        return { state: { ...state, xray: Boolean(action.on) } };
      case "split":
        if (state.split) return same(state);
        return { state: { ...state, split: true } };
      case "mark": {
        if (!state.split)
          return refuse(
            "Cut the bar into same-size pieces first. The groups only fit when the pieces match.",
            "Primero corta la barra en piezas del mismo tamaño. Los grupos solo caben cuando las piezas coinciden.",
          );
        if (!Number.isInteger(action.g) || action.g < 0 || action.g >= d.groups.length)
          return same(state);
        const has = state.marked.includes(action.g);
        const marked = has
          ? state.marked.filter((g) => g !== action.g)
          : [...state.marked, action.g].sort((x, y) => x - y);
        return { state: { ...state, marked } };
      }
      case "markNext": {
        if (!state.split)
          return refuse(
            "Cut the bar into same-size pieces first.",
            "Primero corta la barra en piezas del mismo tamaño.",
          );
        const next = d.groups.findIndex((_, g) => !state.marked.includes(g));
        if (next < 0) return same(state);
        return { state: { ...state, marked: [...state.marked, next].sort((x, y) => x - y) } };
      }
      case "clearMarks":
        return { state: { ...state, marked: [] } };
      default:
        return same(state);
    }
  },
  derive(state) {
    const wholes = Math.max(1, Math.ceil(Number(state.a.n) / Number(state.a.d)));
    const cells = wholes * state.unit;
    const dividendCells = Number(state.a.mul(state.unit).n);
    const groupCells = Number(state.b.mul(state.unit).n);
    const full = Math.floor(dividendCells / groupCells);
    const rest = dividendCells - full * groupCells;
    const groups = Array.from({ length: full + (rest ? 1 : 0) }, (_, g) => ({
      from: g * groupCells,
      to: Math.min(dividendCells, (g + 1) * groupCells),
      partial: g >= full,
    }));
    const quotient = state.a.div(state.b);
    const markedAll = state.marked.length === groups.length && groups.length > 0;
    return {
      wholes,
      cells,
      unit: state.unit,
      dividendCells,
      groupCells,
      groups,
      quotient,
      quotientText: fracText(quotient),
      markedCount: state.marked.length,
      markedAll,
      sameUnits: `${dividendCells} ÷ ${groupCells}`,
    };
  },
  describe(state, lang) {
    const d = fracdiv.derive(state);
    return lang === "es"
      ? `Barra de ${d.cells} piezas iguales. El dividendo ocupa ${d.dividendCells} piezas; cada grupo mide ${d.groupCells}. Contados: ${d.markedCount} de ${d.groups.length}.`
      : `A bar of ${d.cells} equal pieces. The dividend covers ${d.dividendCells} pieces; each group is ${d.groupCells}. Counted: ${d.markedCount} of ${d.groups.length}.`;
  },
};

export { Rational };
