// Family "exponents": repeated multiplication (b^n), growth columns, factor chains, and
// order-of-operations expressions (a + m × b^n). "powers" compares b^n against the common
// base × exponent (b × n) misconception; "order" is a vertical guided stepper: the family taps the
// rung of the order-of-operations ladder that comes next, and each right tap writes one more line.
import {
  a11y,
  button,
  clamp,
  clear,
  createView,
  defineFamily,
  eq,
  field,
  frac,
  fracToString,
  h,
  isInt,
  isRat,
  makeDraggable,
  put,
  s,
  stext,
  t,
  toFrac,
  toNumber,
  toSvgX,
} from "./core.mjs";

export const id = "exponents";
export const label = { en: "Exponent & growth models", es: "Modelos de exponentes y crecimiento" };

const MODES = ["powers", "order"];
const VIEW_KEYS = ["visual", "factors", "table", "compare"];
const DEFAULT_VIEWS = { visual: true, factors: true, table: true, compare: true };
const ACTIONS = ["base", "exponent", "addend", "multiplier", "compare", "prediction", "views", "pick", "reveal", "restart", "expr"];

/* The order-of-operations ladder, top to bottom. */
const RUNGS = ["P", "E", "MD", "AS"];
const SUP = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶" };
const UNSUP = Object.fromEntries(Object.entries(SUP).map(([k, v]) => [v, Number(k)]));
const pow = (b, e) => `${b}${SUP[e]}`;
const MAX_ORDER_STEPS = 8;

// ── Order of operations: one operation per line ──────────────────────────────
// An expression is whole numbers, + − × ÷, parentheses and small powers (2³ or 2^3). orderWalk()
// rewrites it one operation at a time, the way a family writes it on paper, and names the ladder
// rung each line uses: inside parentheses (P), then powers (E), then × ÷ left to right (MD), then
// + − left to right (AS). Every intermediate value must be a whole number at least 0.

function tokenize(src) {
  const out = [];
  const str = String(src ?? "").trim();
  let i = 0;
  while (i < str.length) {
    const c = str[i];
    if (c === " ") i++;
    else if (/\d/.test(c)) {
      let j = i;
      while (j < str.length && /\d/.test(str[j])) j++;
      out.push({ t: "num", v: Number(str.slice(i, j)) });
      i = j;
    } else if (c in UNSUP || c === "^") {
      let e;
      if (c === "^") {
        const m = str.slice(i + 1).match(/^\s*(\d)/);
        if (!m) throw new TypeError("exponents: ^ needs a digit");
        e = Number(m[1]);
        i += 1 + m[0].length;
      } else {
        e = UNSUP[c];
        i++;
      }
      const prev = out[out.length - 1];
      if (!prev || (prev.t !== "num" && prev.t !== ")")) throw new TypeError("exponents: a power needs a base");
      out.push({ t: "pow", v: e });
    } else if ("+-−×*÷/".includes(c)) {
      out.push({ t: "op", v: { "-": "−", "*": "×", "/": "÷" }[c] || c });
      i++;
    } else if (c === "(" || c === ")") {
      out.push({ t: c });
      i++;
    } else throw new TypeError(`exponents: unexpected "${c}" in expression`);
  }
  return out;
}

function show(tokens) {
  let out = "";
  for (const k of tokens) {
    if (k.t === "num") out += (out && !out.endsWith("(") ? " " : "") + k.v;
    else if (k.t === "pow") out += SUP[k.v];
    else if (k.t === "op") out += ` ${k.v}`;
    else if (k.t === "(") out += (out ? " " : "") + "(";
    else out += ")";
  }
  return out.trim();
}

function apply(a, op, b) {
  const v = op === "+" ? a + b : op === "−" ? a - b : op === "×" ? a * b : b !== 0 && a % b === 0 ? a / b : NaN;
  if (!Number.isInteger(v) || v < 0) throw new RangeError("exponents: every step must give a whole number");
  return v;
}

/* Index of the operator to do next in a flat run of tokens (no parentheses), and its rung. */
function nextInFlat(toks, lo, hi, strict = false) {
  for (let i = lo; i < hi; i++) if (toks[i].t === "pow") return { i, rung: "E" };
  if (!strict) for (let i = lo; i < hi; i++) if (toks[i].t === "op" && (toks[i].v === "×" || toks[i].v === "÷")) return { i, rung: "MD" };
  for (let i = lo; i < hi; i++) if (toks[i].t === "op") return { i, rung: "AS" };
  return null;
}

/* One step: returns { rung, work, toks } or null when only a number is left. */
function stepOnce(toks, strict = false) {
  let open = -1;
  let close = -1;
  for (let i = 0; i < toks.length; i++) {
    if (toks[i].t === "(") open = i;
    else if (toks[i].t === ")") {
      close = i;
      break;
    }
  }
  const inParens = open >= 0 && close > open;
  const lo = inParens ? open + 1 : 0;
  const hi = inParens ? close : toks.length;
  const at = nextInFlat(toks, lo, hi, strict);
  if (!at) {
    if (inParens && hi - lo === 1) {
      /* "(5)" is just 5: drop the parentheses and keep going. */
      const next = [...toks.slice(0, open), toks[lo], ...toks.slice(close + 1)];
      return stepOnce(next, strict);
    }
    return null;
  }
  const rung = inParens ? "P" : at.rung;
  let next;
  let work;
  if (toks[at.i].t === "pow") {
    const b = toks[at.i - 1];
    if (b.t !== "num") throw new TypeError("exponents: work inside the parentheses first");
    const e = toks[at.i].v;
    const v = powInt(b.v, e);
    work = `${pow(b.v, e)} = ${e > 1 ? `${Array.from({ length: e }, () => b.v).join(" × ")} = ` : ""}${v}`;
    next = [...toks.slice(0, at.i - 1), { t: "num", v }, ...toks.slice(at.i + 1)];
  } else {
    const a = toks[at.i - 1];
    const b = toks[at.i + 1];
    if (a?.t !== "num" || b?.t !== "num") throw new TypeError("exponents: malformed expression");
    const v = apply(a.v, toks[at.i].v, b.v);
    work = `${a.v} ${toks[at.i].v} ${b.v} = ${v}`;
    next = [...toks.slice(0, at.i - 1), { t: "num", v }, ...toks.slice(at.i + 2)];
  }
  /* A group that is now one number loses its parentheses unless a power still needs them. */
  for (let i = 0; i + 2 < next.length; i++) {
    if (next[i].t === "(" && next[i + 1].t === "num" && next[i + 2].t === ")") next.splice(i, 3, next[i + 1]);
  }
  return { rung, work, toks: next };
}

const walkCache = new Map();
/** The whole walk for an expression: { start, lines: [{ rung, work, after }], value, leftToRight }. */
export function orderWalk(expr) {
  if (walkCache.has(expr)) return walkCache.get(expr);
  let toks = tokenize(expr);
  if (!toks.length || toks.filter((k) => k.t === "(").length !== toks.filter((k) => k.t === ")").length) {
    throw new TypeError("exponents: unbalanced or empty expression");
  }
  const start = show(toks);
  const lines = [];
  for (let r = stepOnce(toks); r; r = stepOnce(toks)) {
    toks = r.toks;
    lines.push({ rung: r.rung, work: r.work, after: show(toks) });
    if (lines.length > MAX_ORDER_STEPS) throw new RangeError("exponents: too many steps for one problem");
  }
  if (toks.length !== 1 || toks[0].t !== "num" || lines.length < 2) {
    throw new TypeError("exponents: an order problem needs at least two operations");
  }
  /* The mistake worth naming: + − × ÷ strictly left to right (powers and parentheses still first). */
  let lr = tokenize(expr);
  let leftToRight = null;
  try {
    for (let r = stepOnce(lr, true); r; r = stepOnce(lr, true)) lr = r.toks;
    leftToRight = lr.length === 1 ? lr[0].v : null;
  } catch {
    leftToRight = null;
  }
  const walk = { start, lines, value: toks[0].v, leftToRight: leftToRight === toks[0].v ? null : leftToRight };
  walkCache.set(expr, walk);
  return walk;
}

// ── State ────────────────────────────────────────────────────────────────────

function validateState(st) {
  if (!st || !MODES.includes(st.mode)) return false;
  if (st.mode === "order") {
    if (typeof st.expr !== "string") return false;
    try {
      if (st.step > orderWalk(st.expr).lines.length) return false;
    } catch {
      return false;
    }
    if (!Array.isArray(st.presets) || !st.presets.length || !st.presets.every((e) => typeof e === "string")) return false;
  } else if (st.expr !== null) return false;
  if (!Number.isInteger(st.step) || st.step < 0) return false;
  if (st.miss !== null && !RUNGS.includes(st.miss)) return false;
  if (!Number.isInteger(st.base) || st.base < 1 || st.base > 10) return false;
  if (!Number.isInteger(st.exponent) || st.exponent < 0 || st.exponent > 6) return false;
  if (!Number.isInteger(st.maxExponent) || st.maxExponent < 3 || st.maxExponent > 6) return false;
  if (st.exponent > st.maxExponent) return false;
  if (!Number.isInteger(st.addend) || st.addend < 0 || st.addend > 50) return false;
  if (!Number.isInteger(st.multiplier) || st.multiplier < 1 || st.multiplier > 12) return false;
  if (typeof st.compare !== "boolean") return false;
  if (st.prediction !== null && !["multiply", "add", "linear"].includes(st.prediction)) return false;
  return !!st.views && VIEW_KEYS.every((k) => typeof st.views[k] === "boolean");
}

function powInt(b, e) {
  let out = 1;
  for (let i = 0; i < e; i++) out *= b;
  return out;
}

function derive(st) {
  const b = st.base;
  const e = st.exponent;
  const power = powInt(b, e);
  const additive = b * e;
  const swapped = powInt(e, b);
  const factors = e === 0 ? [1] : Array.from({ length: e }, () => b);
  const factorsChain = e === 0 ? "1" : e === 1 ? String(b) : factors.join(" × ");
  const growthSteps = [];
  for (let step = 0; step <= st.maxExponent; step++) {
    growthSteps.push({
      step,
      value: powInt(b, step),
      linearValue: b * step,
      active: step === e,
    });
  }
  const expCap = Math.min(e, 4);
  const expTerm = powInt(b, expCap);
  const orderProduct = st.multiplier * expTerm;
  const orderCorrect = st.addend + orderProduct;
  const orderLeftToRightTrap = (st.addend + st.multiplier) * expTerm;
  const orderMultiplyBaseTrap = st.addend + st.multiplier * (b * expCap);
  const walk = st.mode === "order" ? orderWalk(st.expr) : null;
  return {
    ...st,
    walk,
    power,
    additive,
    swapped,
    factors,
    factorsChain,
    growthSteps,
    expCap,
    expTerm,
    orderProduct,
    orderCorrect,
    orderLeftToRightTrap,
    orderMultiplyBaseTrap,
  };
}

function normalize(config) {
  const c = config || {};
  const mode = c.mode === "order" ? "order" : "powers";
  const intIn = (v, def, lo, hi, name) => {
    if (v === undefined || v === null) return def;
    const r = toFrac(v);
    if (!r || !isInt(r)) throw new TypeError(`exponents: ${name} must be an integer`);
    const n = toNumber(r);
    if (n < lo || n > hi) throw new RangeError(`exponents: ${name} out of range`);
    return n;
  };
  const maxExponent = intIn(c.maxExponent, 5, 3, 6, "maxExponent");
  const base = intIn(c.base, 2, 1, 10, "base");
  const exponent = intIn(c.exponent, 3, 0, maxExponent, "exponent");
  const addend = intIn(c.addend, 4, 0, 50, "addend");
  const multiplier = intIn(c.multiplier, 3, 1, 12, "multiplier");
  const compare = c.compare !== false;
  const views = { ...DEFAULT_VIEWS, ...(c.views || {}) };
  const state = {
    mode,
    base,
    exponent,
    maxExponent,
    addend,
    multiplier,
    compare: Boolean(compare),
    prediction: null,
    views,
    step: 0,
    miss: null,
    /* Order mode reads one expression; the older a + m × b^n config still works and builds it. */
    expr: mode === "order" ? (typeof c.expr === "string" ? c.expr : `${addend} + ${multiplier} × ${pow(base, Math.min(exponent, 4))}`) : null,
  };
  if (state.expr) {
    orderWalk(state.expr);
    const list = Array.isArray(c.presets) && c.presets.length ? c.presets.map(String) : DEFAULT_PRESETS;
    for (const e of list) orderWalk(e);
    state.presets = [state.expr, ...list.filter((e) => e !== state.expr)];
  } else state.presets = [];
  if (!validateState(state)) throw new TypeError("exponents: invalid configuration");
  return { state, task: c.task || null };
}

function reduce(st, patch) {
  if (!patch || typeof patch !== "object") return null;
  if (Object.keys(patch).some((k) => !ACTIONS.includes(k))) return null;
  const next = { ...st, views: { ...st.views } };
  const intOf = (v) => {
    const r = toFrac(v);
    return r && isInt(r) ? toNumber(r) : null;
  };
  if ("base" in patch) {
    const b = intOf(patch.base);
    if (b === null || b < 1 || b > 10) return null;
    next.base = b;
  }
  if ("exponent" in patch) {
    const e = intOf(patch.exponent);
    if (e === null || e < 0 || e > next.maxExponent) return null;
    next.exponent = e;
  }
  if ("addend" in patch) {
    const a = intOf(patch.addend);
    if (a === null || a < 0 || a > 50) return null;
    next.addend = a;
  }
  if ("multiplier" in patch) {
    const m = intOf(patch.multiplier);
    if (m === null || m < 1 || m > 12) return null;
    next.multiplier = m;
  }
  if ("compare" in patch) {
    next.compare = patch.compare === true;
  }
  if ("prediction" in patch) {
    if (patch.prediction !== null && !["multiply", "add", "linear"].includes(patch.prediction)) return null;
    next.prediction = patch.prediction;
  }
  if ("views" in patch && patch.views && typeof patch.views === "object") {
    for (const [k, v] of Object.entries(patch.views)) {
      if (!VIEW_KEYS.includes(k)) return null;
      next.views[k] = Boolean(v);
    }
  }
  /* Changing the numbers starts the stepper over. */
  if (["base", "exponent", "addend", "multiplier"].some((k) => k in patch)) {
    next.step = 0;
    next.miss = null;
  }
  if ("expr" in patch) {
    if (next.mode !== "order" || typeof patch.expr !== "string") return null;
    try {
      orderWalk(patch.expr);
    } catch {
      return null;
    }
    next.expr = patch.expr;
    next.step = 0;
    next.miss = null;
  }
  const path = next.mode === "order" ? orderWalk(next.expr).lines.map((l) => l.rung) : [];
  if ("pick" in patch) {
    if (!RUNGS.includes(patch.pick) || next.step >= path.length) return null;
    if (patch.pick === path[next.step]) {
      next.step += 1;
      next.miss = null;
    } else {
      next.miss = patch.pick;
    }
  }
  if (patch.reveal === true) {
    if (next.step >= path.length) return null;
    next.step += 1;
    next.miss = null;
  }
  if (patch.restart === true) {
    next.step = 0;
    next.miss = null;
  }
  return validateState(next) ? next : null;
}

// ── Words & Explanations ─────────────────────────────────────────────────────

function accessibleDescription(st, lang) {
  const d = derive(st);
  if (d.mode === "order") {
    const expr = d.walk.start;
    const done = d.walk.lines.slice(0, d.step);
    if (!done.length) {
      return t(lang, {
        en: `Order of operations steps for ${expr}. No steps done yet. Pick the step that comes first.`,
        es: `Pasos del orden de las operaciones para ${expr}. Todavía no hay pasos. Elige el paso que va primero.`,
      });
    }
    return t(lang, {
      en: `Order of operations steps for ${expr}. ${done.map((l) => `${l.work}, so the expression is now ${l.after}.`).join(" ")}`,
      es: `Pasos del orden de las operaciones para ${expr}. ${done.map((l) => `${l.work}, así que la expresión ahora es ${l.after}.`).join(" ")}`,
    });
  }
  return t(lang, {
    en: `Exponent growth model. Base ${d.base} to the power of ${d.exponent} equals ${d.factorsChain} = ${d.power}. Comparing with ${d.base} times ${d.exponent} gives ${d.additive}.`,
    es: `Modelo de crecimiento exponencial. Base ${d.base} elevada a ${d.exponent} es igual a ${d.factorsChain} = ${d.power}. Comparado con ${d.base} por ${d.exponent} que da ${d.additive}.`,
  });
}

function explanation(st, lang) {
  const d = derive(st);
  if (d.mode === "order") {
    const NAME = {
      P: { en: "inside the parentheses", es: "dentro de los paréntesis" },
      E: { en: "the power", es: "la potencia" },
      MD: { en: "multiply or divide", es: "multiplicar o dividir" },
      AS: { en: "add or subtract", es: "sumar o restar" },
    };
    const parts = d.walk.lines.map((l) => `${t(lang, NAME[l.rung])} (${l.work})`);
    return t(lang, {
      en: `In ${d.walk.start}: ${parts.join(", then ")}. The value is ${d.walk.value}.`,
      es: `En ${d.walk.start}: ${parts.join(", luego ")}. El valor es ${d.walk.value}.`,
    });
  }
  if (d.exponent === 0) {
    return t(lang, {
      en: `${d.base}^0 = 1. Every time the exponent decreases by 1, we divide by ${d.base} (${d.base}^1 ÷ ${d.base} = 1). A zero exponent never makes a positive base equal 0.`,
      es: `${d.base}^0 = 1. Cada vez que el exponente disminuye en 1, dividimos entre ${d.base} (${d.base}^1 ÷ ${d.base} = 1). Un exponente cero nunca hace que una base positiva sea igual a 0.`,
    });
  }
  return t(lang, {
    en: `${d.base}^${d.exponent} means multiplying ${d.exponent} factors of ${d.base}: ${d.factorsChain} = ${d.power}. Each +1 step on the exponent multiplies the total by ${d.base}, whereas ${d.base} × ${d.exponent} = ${d.additive} only adds ${d.base} each time.`,
    es: `${d.base}^${d.exponent} significa multiplicar ${d.exponent} factores de ${d.base}: ${d.factorsChain} = ${d.power}. Cada paso de +1 en el exponente multiplica el total por ${d.base}, mientras que ${d.base} × ${d.exponent} = ${d.additive} solo suma ${d.base} cada vez.`,
  });
}

// ── validate(task) ───────────────────────────────────────────────────────────

function validateTask(st, task) {
  const none = (reason, ok = false) => ({ ok, reason, misconception: null });
  const wrong = (m) => ({ ok: false, reason: "incorrect", misconception: m ? { id: m, confidence: "high" } : null });
  if (!task || typeof task !== "object") return none("no-task");
  const d = derive(st);

  if (task.kind === "evaluate-power") {
    const b = Number.isInteger(task.base) ? task.base : d.base;
    const e = Number.isInteger(task.exponent) ? task.exponent : d.exponent;
    if (b < 1 || e < 0) return none("invalid-task");
    const want = frac(powInt(b, e));
    const given = toFrac(task.answer !== undefined ? task.answer : d.power);
    if (!given) return none("invalid-answer");
    if (eq(given, want)) return none("correct", true);
    if (e > 1 && eq(given, frac(b * e))) return wrong("exponent-as-multiplier");
    if (e > 1 && b !== e && eq(given, frac(powInt(e, b)))) return wrong("swapped-base-exponent");
    if (e === 0 && eq(given, frac(0))) return wrong("zero-power-is-zero");
    if (e === 0 && eq(given, frac(b))) return wrong("zero-power-is-base");
    return wrong(null);
  }

  if (task.kind === "reach-power") {
    const target = toFrac(task.target);
    if (!target) return none("invalid-task");
    const current = frac(d.power);
    if (eq(current, target)) {
      if (Number.isInteger(task.base) && d.base !== task.base) return wrong("different-base");
      return none("correct", true);
    }
    if (d.exponent > 1 && eq(frac(d.additive), target)) return wrong("exponent-as-multiplier");
    return wrong(null);
  }

  if (task.kind === "evaluate-order") {
    const want = frac(d.mode === "order" ? d.walk.value : d.orderCorrect);
    const given = toFrac(task.answer !== undefined ? task.answer : want);
    if (!given) return none("invalid-answer");
    if (eq(given, want)) return none("correct", true);
    const trap = d.mode === "order" ? d.walk.leftToRight : d.orderLeftToRightTrap;
    if (trap !== null && eq(given, frac(trap))) return wrong("left-to-right-before-exponent");
    if (eq(given, frac(d.orderMultiplyBaseTrap))) return wrong("exponent-as-multiplier");
    return wrong(null);
  }

  return none("invalid-task");
}

// ── Model ────────────────────────────────────────────────────────────────────

export const create = defineFamily({
  id,
  normalize,
  reduce,
  validateState,
  derive,
  validateTask,
  accessibleDescription,
  explanation,
  track: (patch) => !("views" in patch) && !("prediction" in patch) && !("pick" in patch),
  describeConfig: (st) => ({
    mode: st.mode,
    base: fracToString(frac(st.base)),
    exponent: fracToString(frac(st.exponent)),
    maxExponent: st.maxExponent,
    compare: st.compare,
  }),
});

// ── Rendering ────────────────────────────────────────────────────────────────

const STR = {
  titlePowers: { en: "Exponential growth vs. multiplier trap", es: "Crecimiento exponencial vs. trampa de multiplicar" },
  titleOrder: { en: "Order of operations with exponents", es: "Orden de las operaciones con exponentes" },
  base: { en: "Base (b)", es: "Base (b)" },
  exponent: { en: "Exponent (n)", es: "Exponente (n)" },
  power: { en: "Power (b^n)", es: "Potencia (b^n)" },
  factors: { en: "Factor chain", es: "Cadena de factores" },
  linearTrap: { en: "Multiplier trap (b × n)", es: "Trampa lineal (b × n)" },
  compareToggle: { en: "Compare b × n trap", es: "Comparar trampa b × n" },
  tableToggle: { en: "Growth table", es: "Tabla de crecimiento" },
  presetStudio: { en: "Studio 2⁴ = 16", es: "Estudio 2⁴ = 16" },
  presetCube: { en: "Cube 3³ = 27", es: "Cubo 3³ = 27" },
  presetZero: { en: "Zero power 2⁰ = 1", es: "Potencia cero 2⁰ = 1" },
  undo: { en: "Undo", es: "Deshacer" },
  reset: { en: "Start over", es: "Empezar de nuevo" },
  invalid: { en: "Enter a whole number in range.", es: "Escribe un número entero dentro del rango." },
  handleBase: { en: "Base factor. Use arrow keys or drag.", es: "Factor base. Usa las flechas o arrastra." },
  handleExp: { en: "Exponent. Use arrow keys or drag.", es: "Exponente. Usa las flechas o arrastra." },
  stageCol: { en: "Stage", es: "Etapa" },
  expRow: { en: "Repeated multiplication (b^n)", es: "Multiplicación repetida (b^n)" },
  linRow: { en: "Multiplier trap (b × n)", es: "Trampa de multiplicar (b × n)" },
};

const OSTR = {
  keys: { P: "P", E: "E", MD: "M D", AS: "A S" },
  rung: {
    P: { en: "Parentheses ( )", es: "Paréntesis ( )" },
    E: { en: "Exponents", es: "Exponentes" },
    MD: { en: "Multiply × or Divide ÷", es: "Multiplicar × o dividir ÷" },
    AS: { en: "Add + or Subtract −", es: "Sumar + o restar −" },
  },
  rungSub: {
    P: { en: "Work inside them first", es: "Primero lo de adentro" },
    E: { en: "Powers like 2³", es: "Potencias como 2³" },
    MD: { en: "Left to right", es: "De izquierda a derecha" },
    AS: { en: "Left to right", es: "De izquierda a derecha" },
  },
  doneTag: { en: " (done)", es: " (hecho)" },
  ladder: { en: "The order, top to bottom", es: "El orden, de arriba abajo" },
  steps: { en: "Our steps", es: "Nuestros pasos" },
  solve: { en: "Solve:", es: "Resuelvan:" },
  start: { en: "Start", es: "Inicio" },
  answer: { en: "Answer:", es: "Respuesta:" },
  askFirst: { en: "What do you do first? Tap that step on the ladder.", es: "¿Qué hacen primero? Toquen ese paso en la escalera." },
  askNext: { en: "Nice! What comes next? Tap the next step on the ladder.", es: "¡Bien! ¿Qué sigue? Toquen el siguiente paso en la escalera." },
  done: { en: "Done! One expression, one answer.", es: "¡Listo! Una expresión, una respuesta." },
  reveal: { en: "Show me the next step", es: "Muéstrame el siguiente paso" },
  next: { en: "New problem", es: "Problema nuevo" },
  restart: { en: "Start over", es: "Empezar de nuevo" },
};

/* "New problem" walks this list unless the lesson names its own (config.presets). Small numbers and
   small powers, so a family can check every line by hand. */
const DEFAULT_PRESETS = ["4 + 3 × 2³", "5 + 3 × 2²", "10 + 2 × 3²", "1 + 4 × 5²", "6 + 2 × 2⁴"];

const W = 520;
const H = 210;
const TRACK = { x0: 44, x1: 476, y: 24 };
let uid = 0;

export function mount(root, model, { lang = "en", onChange, readonly = false } = {}) {
  const id0 = `fmx${++uid}`;
  let bag;
  let L = lang;
  let ui = {};
  const state = () => model.getState();
  const T = (k) => t(L, STR[k]);

  function makeTrackSlider(labelKey) {
    const svg = s("svg", { class: "fm-svg fm-guess", viewBox: `0 0 ${W} 48`, role: "group", "aria-label": T(labelKey) });
    const g = s("g");
    const handle = readonly
      ? null
      : s("g", { class: "fm-handle" }, s("circle", { class: "fm-hit", r: 36 }), s("circle", { class: "fm-ring", r: 15 }), s("circle", { class: "fm-knob", r: 9 }));
    svg.append(g);
    if (handle) svg.append(handle);
    return { svg, g, handle };
  }

  function wireBaseSlider(node) {
    return makeDraggable(node, {
      get: () => state().base,
      set: (v) => model.setState({ base: Math.round(v) }),
      min: 1,
      max: 10,
      step: 1,
      bigStep: 2,
      label: T("handleBase"),
      valueText: () => `${T("base")} = ${state().base}`,
      toValue: ({ x, node: n }) => {
        const ratio = (toSvgX(n, x, W).x - TRACK.x0) / (TRACK.x1 - TRACK.x0);
        return 1 + Math.round(clamp(ratio, 0, 1) * 9);
      },
    });
  }

  function wireExpSlider(node) {
    return makeDraggable(node, {
      get: () => state().exponent,
      set: (v) => model.setState({ exponent: Math.round(v) }),
      min: 0,
      max: () => state().maxExponent,
      step: 1,
      bigStep: 2,
      label: T("handleExp"),
      valueText: () => `${T("exponent")} = ${state().exponent}`,
      toValue: ({ x, node: n }) => {
        const maxE = state().maxExponent;
        const ratio = (toSvgX(n, x, W).x - TRACK.x0) / (TRACK.x1 - TRACK.x0);
        return Math.round(clamp(ratio, 0, 1) * maxE);
      },
    });
  }

  // ── Order mode: a vertical ladder and a vertical list of steps ─────────────
  function buildOrder() {
    ui.expr = h("p", { class: "fm-oo-expr" });
    ui.rungs = {};
    const ladder = h("ol", { class: "fm-oo-ladder", "aria-label": t(L, OSTR.ladder) });
    for (const id of RUNGS) {
      const btn = h(
        "button",
        { type: "button", class: "fm-btn fm-oo-rung", "data-rung": id, disabled: readonly ? "" : null },
        h("span", { class: "fm-oo-key", "aria-hidden": "true" }, OSTR.keys[id]),
        h("span", { class: "fm-oo-name" }, h("strong", null, t(L, OSTR.rung[id])), h("small", null, t(L, OSTR.rungSub[id]))),
        h("span", { class: "fm-oo-tick" }, h("span", { "aria-hidden": "true" }, "✓"), h("span", { class: "fm-sr" }, t(L, OSTR.doneTag))),
      );
      if (!readonly) bag.on(btn, "click", () => model.setState({ pick: id }));
      ui.rungs[id] = btn;
      put(ladder, h("li", null, btn));
    }
    ui.steps = h("ol", { class: "fm-oo-steps", "aria-label": t(L, OSTR.steps) });
    ui.ask = h("p", { class: "fm-oo-ask", role: "status" });
    ui.explain = h("p", { class: "fm-explain" });
    ui.watch = h("p", { class: "fm-oo-watch" });
    ui.desc = h("p", { class: "fm-sr" });
    const controls = [];
    if (!readonly) {
      ui.revealBtn = button(bag, t(L, OSTR.reveal), { onClick: () => model.setState({ reveal: true }) });
      ui.newBtn = button(bag, t(L, OSTR.next), {
        onClick: () => {
          const { presets, expr } = state();
          model.setState({ expr: presets[(presets.indexOf(expr) + 1) % presets.length] });
        },
      });
      ui.restartBtn = button(bag, t(L, OSTR.restart), { onClick: () => model.setState({ restart: true }) });
      controls.push(h("div", { class: "fm-row" }, ui.revealBtn, ui.newBtn, ui.restartBtn));
    }
    put(
      root,
      model.task?.prompt ? h("p", { class: "fm-prompt" }, t(L, model.task.prompt)) : null,
      ui.expr,
      h("div", { class: "fm-oo-grid" }, h("section", { class: "fm-oo-col", "aria-label": t(L, OSTR.ladder) }, h("p", { class: "fm-oo-head" }, t(L, OSTR.ladder)), ladder), h("section", { class: "fm-oo-col", "aria-label": t(L, OSTR.steps) }, h("p", { class: "fm-oo-head" }, t(L, OSTR.steps)), ui.steps)),
      ui.ask,
      ...controls,
      ui.explain,
      ui.watch,
      ui.desc,
    );
  }

  function syncOrder() {
    const d = state();
    const lines = d.walk.lines;
    const expr = d.walk.start;
    clear(ui.expr);
    put(ui.expr, t(L, OSTR.solve), " ", h("strong", { class: "fm-oo-math" }, expr));
    const doneRungs = new Set(lines.slice(0, d.step).map((l) => l.rung));
    for (const id of RUNGS) {
      const btn = ui.rungs[id];
      btn.classList.toggle("is-done", doneRungs.has(id));
      btn.classList.toggle("is-miss", d.miss === id);
      if (!readonly) btn.disabled = d.step >= lines.length;
    }
    clear(ui.steps);
    put(ui.steps, h("li", { class: "fm-oo-line is-start" }, h("span", { class: "fm-oo-badge" }, t(L, OSTR.start)), h("span", { class: "fm-oo-math" }, expr)));
    lines.slice(0, d.step).forEach((l) => {
      put(
        ui.steps,
        h(
          "li",
          { class: "fm-oo-line" },
          h("span", { class: "fm-oo-badge" }, OSTR.keys[l.rung]),
          h(
            "span",
            { class: "fm-oo-work" },
            h("span", { class: "fm-oo-math" }, l.work),
            l.rung === "AS" ? null : h("span", { class: "fm-oo-after" }, "→ ", h("span", { class: "fm-oo-math" }, l.after)),
          ),
        ),
      );
    });
    const finished = d.step >= lines.length;
    if (finished) put(ui.steps, h("li", { class: "fm-oo-line is-answer" }, h("span", { class: "fm-oo-badge" }, "✓"), h("strong", { class: "fm-oo-math" }, `${t(L, OSTR.answer)} ${d.walk.value}`)));
    ui.ask.textContent = finished ? t(L, OSTR.done) : d.miss ? missText(d) : t(L, d.step === 0 ? OSTR.askFirst : OSTR.askNext);
    ui.ask.classList.toggle("is-miss", Boolean(d.miss));
    if (ui.revealBtn) ui.revealBtn.disabled = finished;
    ui.explain.textContent = finished ? model.getMathematicalExplanation(L) : "";
    ui.explain.hidden = !finished;
    const trap = d.walk.leftToRight;
    ui.watch.textContent =
      finished && trap !== null
        ? t(L, {
            en: `Watch out: doing + − × ÷ strictly left to right gives ${trap}, not ${d.walk.value}. That is why the order matters.`,
            es: `Cuidado: hacer + − × ÷ solo de izquierda a derecha da ${trap}, no ${d.walk.value}. Por eso el orden importa.`,
          })
        : "";
    ui.watch.hidden = !ui.watch.textContent;
    ui.desc.textContent = model.getAccessibleDescription(L);
  }

  /** What to say after a wrong rung: why not that one, never the answer. */
  function missText(d) {
    const path = d.walk.lines.map((l) => l.rung);
    const want = path[d.step];
    const order = RUNGS.indexOf(d.miss) - RUNGS.indexOf(want);
    if (d.miss === "P") {
      return t(L, {
        en: "Good habit to check! There are no parentheses left to work in, so move down the ladder.",
        es: "¡Buen hábito revisar! Ya no quedan paréntesis por resolver, así que bajen por la escalera.",
      });
    }
    if (want === "P") {
      return t(L, {
        en: "Not yet. Look for parentheses ( ). Work inside them first.",
        es: "Todavía no. Busquen paréntesis ( ). Primero se trabaja adentro.",
      });
    }
    if (!path.slice(d.step).includes(d.miss)) {
      return t(L, { en: "That kind of step is already done. Look farther down the ladder.", es: "Ese tipo de paso ya está hecho. Miren más abajo en la escalera." });
    }
    if (want === "E") {
      return t(L, {
        en: "Not yet. Is there a power, like 2³? Powers come before × ÷ + −.",
        es: "Todavía no. ¿Hay una potencia, como 2³? Las potencias van antes de × ÷ + −.",
      });
    }
    return order > 0
      ? t(L, { en: "Not yet. × and ÷ come before + and −. Look one step higher.", es: "Todavía no. × y ÷ van antes de + y −. Miren un paso más arriba." })
      : t(L, { en: "Not yet. Look farther down the ladder.", es: "Todavía no. Miren más abajo en la escalera." });
  }

  function build(v) {
    bag = v.bag;
    L = v.lang;
    ui = {};
    const st = state();
    if (st.mode === "order") {
      buildOrder();
      return;
    }

    ui.prompt = model.task?.prompt ? h("p", { class: "fm-prompt" }, t(L, model.task.prompt)) : null;
    ui.explain = h("p", { class: "fm-explain" });
    ui.desc = h("p", { class: "fm-sr" });
    ui.msg = h("p", { class: "fm-msg", role: "status" });

    ui.svg = s("svg", {
      class: "fm-svg fm-exp-svg",
      viewBox: `0 0 ${W} ${H}`,
      role: "group",
      "aria-label": T(st.mode === "order" ? "titleOrder" : "titlePowers"),
    });

    ui.baseSlider = makeTrackSlider("base");
    ui.expSlider = makeTrackSlider("exponent");

    ui.baseField = field(bag, {
      id: `${id0}-base`,
      label: T("base"),
      readonly,
      onCommit: (val) => {
        const ok = model.setState({ base: val });
        ui.baseField.invalid(!ok);
        ui.msg.textContent = ok ? "" : T("invalid");
      },
    });
    ui.expField = field(bag, {
      id: `${id0}-exp`,
      label: T("exponent"),
      readonly,
      onCommit: (val) => {
        const ok = model.setState({ exponent: val });
        ui.expField.invalid(!ok);
        ui.msg.textContent = ok ? "" : T("invalid");
      },
    });
    ui.powerField = field(bag, { id: `${id0}-pow`, label: T("power"), readonly: true });
    ui.factorsField = field(bag, { id: `${id0}-fac`, label: T("factors"), readonly: true });
    ui.trapField = field(bag, { id: `${id0}-trap`, label: T("linearTrap"), readonly: true });

    ui.tableWrap = h("div", { class: "fm-view fm-exp-table-wrap" });

    // Prediction reasoning question built into the model
    ui.predictPrompt = h("p", { class: "fm-sub" });
    ui.predictRow = h("div", { class: "fm-row", role: "group" });
    ui.predictFeedback = h("p", { class: "fm-explain", role: "status" });
    ui.predictBox = h("section", { class: "fm-view fm-exp-predict" }, ui.predictPrompt, ui.predictRow, ui.predictFeedback);

    const controls = [];
    if (!readonly) {
      ui.compareBtn = button(bag, T("compareToggle"), {
        pressed: st.compare,
        onClick: () => model.setState({ compare: !state().compare }),
      });
      ui.tableBtn = button(bag, T("tableToggle"), {
        pressed: st.views.table,
        onClick: () => model.setState({ views: { table: !state().views.table } }),
      });
      ui.presetStudio = button(bag, T("presetStudio"), {
        onClick: () => model.setState({ base: 2, exponent: 4, compare: true }),
      });
      ui.presetCube = button(bag, T("presetCube"), {
        onClick: () => model.setState({ base: 3, exponent: 3, compare: true }),
      });
      ui.presetZero = button(bag, T("presetZero"), {
        onClick: () => model.setState({ base: 2, exponent: 0, compare: true }),
      });
      ui.undoBtn = button(bag, T("undo"), { onClick: () => model.undo() });
      ui.resetBtn = button(bag, T("reset"), { onClick: () => model.reset() });

      controls.push(
        h("div", { class: "fm-row" }, ui.presetStudio, ui.presetCube, ui.presetZero),
        h("div", { class: "fm-row" }, ui.compareBtn, ui.tableBtn, ui.undoBtn, ui.resetBtn)
      );
    }

    put(
      root,
      ui.prompt,
      h("section", { class: "fm-view", "aria-label": T("titlePowers") }, ui.svg),
      h(
        "section",
        { class: "fm-view", "aria-label": T("base") },
        ui.baseSlider.svg,
        ui.expSlider.svg,
        h("div", { class: "fm-fields" }, ui.baseField.el, ui.expField.el, ui.powerField.el, ui.factorsField.el, ui.trapField.el)
      ),
      ...controls,
      ui.tableWrap,
      ui.predictBox,
      ui.msg,
      ui.explain,
      ui.desc
    );

    if (ui.baseSlider.handle) v.handles.push(wireBaseSlider(ui.baseSlider.handle));
    if (ui.expSlider.handle) v.handles.push(wireExpSlider(ui.expSlider.handle));
  }

  function drawChart(d) {
    clear(ui.svg);
    a11y(
      ui.svg,
      T(d.mode === "order" ? "titleOrder" : "titlePowers"),
      model.getAccessibleDescription(L)
    );

    if (d.mode === "order") {
      const boxW = 148;
      const boxH = 62;
      const y0 = 34;
      const steps = [
        {
          x: 20,
          cls: "fm-fill-part",
          title: t(L, { en: "1. Exponent first", es: "1. Exponente primero" }),
          val: `${d.base}^${d.expCap} = ${d.expTerm}`,
        },
        {
          x: 186,
          cls: "fm-fill-whole",
          title: t(L, { en: "2. Multiply", es: "2. Multiplicar" }),
          val: `${d.multiplier} × ${d.expTerm} = ${d.orderProduct}`,
        },
        {
          x: 352,
          cls: "fm-fill-given",
          title: t(L, { en: "3. Add last", es: "3. Sumar al final" }),
          val: `${d.addend} + ${d.orderProduct} = ${d.orderCorrect}`,
        },
      ];
      for (const stp of steps) {
        ui.svg.append(
          s("rect", { class: stp.cls, x: stp.x, y: y0, width: boxW, height: boxH, rx: 8 }),
          stext(stp.x + boxW / 2, y0 + 24, stp.title, "fm-svg-text", "middle"),
          stext(stp.x + boxW / 2, y0 + 48, stp.val, "fm-svg-text fm-svg-strong", "middle")
        );
      }
      ui.svg.append(
        stext(
          W / 2,
          144,
          t(L, {
            en: `Left-to-right trap: (${d.addend} + ${d.multiplier}) × ${d.expTerm} = ${d.orderLeftToRightTrap}`,
            es: `Trampa de izquierda a derecha: (${d.addend} + ${d.multiplier}) × ${d.expTerm} = ${d.orderLeftToRightTrap}`,
          }),
          "fm-svg-text fm-tick-label",
          "middle"
        )
      );
      return;
    }

    const padL = 48;
    const padR = 20;
    const padT = 24;
    const padB = 34;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const steps = d.growthSteps;
    const maxVal = Math.max(10, ...steps.map((st) => Math.max(st.value, st.linearValue)));
    const slotW = chartW / steps.length;

    for (let i = 0; i <= 4; i++) {
      const y = Math.round(padT + chartH - (i / 4) * chartH);
      const val = Math.round((i / 4) * maxVal);
      ui.svg.append(
        s("line", { class: "fm-grid-line", x1: padL, y1: y, x2: W - padR, y2: y }),
        stext(padL - 8, y + 4, String(val), "fm-svg-text fm-tick-label", "end")
      );
    }

    steps.forEach((stp, idx) => {
      const cx = Math.round(padL + idx * slotW + slotW / 2);
      const barW = d.compare ? Math.min(24, Math.floor(slotW * 0.34)) : Math.min(34, Math.floor(slotW * 0.52));
      const expH = Math.max(6, Math.round((stp.value / maxVal) * chartH));
      const expY = padT + chartH - expH;
      const expX = d.compare ? cx - barW - 2 : Math.round(cx - barW / 2);

      ui.svg.append(
        s("rect", {
          class: stp.active ? "fm-fill-part" : "fm-fill-whole",
          x: expX,
          y: expY,
          width: barW,
          height: expH,
          rx: 4,
        }),
        stext(
          Math.round(expX + barW / 2),
          Math.max(14, expY - 5),
          String(stp.value),
          stp.active ? "fm-svg-text fm-svg-strong" : "fm-svg-text fm-tick-label",
          "middle"
        )
      );

      if (d.compare) {
        const linH = Math.max(4, Math.round((stp.linearValue / maxVal) * chartH));
        const linY = padT + chartH - linH;
        const linX = cx + 2;
        ui.svg.append(
          s("rect", {
            class: "fm-fill-given",
            x: linX,
            y: linY,
            width: barW,
            height: linH,
            rx: 4,
          }),
          stext(
            Math.round(linX + barW / 2),
            Math.max(14, linY - 5),
            String(stp.linearValue),
            "fm-svg-text fm-tick-label",
            "middle"
          )
        );
      }

      ui.svg.append(
        stext(
          cx,
          H - 10,
          `${d.base}^${stp.step}`,
          stp.active ? "fm-svg-text fm-svg-strong" : "fm-svg-text fm-tick-label",
          "middle"
        )
      );
    });
  }

  function drawSliderTrack(slider, min, max, current, labelPrefix) {
    const g = slider.g;
    clear(g);
    const span = Math.max(1, max - min);
    const X = (n) => TRACK.x0 + ((TRACK.x1 - TRACK.x0) * (n - min)) / span;
    g.append(s("line", { class: "fm-axis", x1: TRACK.x0, x2: TRACK.x1, y1: TRACK.y, y2: TRACK.y }));
    for (let k = min; k <= max; k++) {
      g.append(
        s("line", { class: "fm-tick", x1: X(k), x2: X(k), y1: TRACK.y - 5, y2: TRACK.y + 5 }),
        stext(X(k), TRACK.y + 20, `${labelPrefix}${k}`, "fm-svg-text fm-tick-label", "middle")
      );
    }
    slider.handle?.setAttribute("transform", `translate(${X(clamp(current, min, max))} ${TRACK.y})`);
  }

  function renderTable(d) {
    clear(ui.tableWrap);
    ui.tableWrap.hidden = !d.views.table;
    if (!d.views.table) return;
    const headRow = h(
      "tr",
      null,
      h("th", { scope: "col" }, T("stageCol")),
      ...d.growthSteps.map((s0) => h("th", { scope: "col" }, `${d.base}^${s0.step}`))
    );
    const expRow = h(
      "tr",
      null,
      h("th", { scope: "row" }, T("expRow")),
      ...d.growthSteps.map((s0) => h("td", null, String(s0.value)))
    );
    const linRow = h(
      "tr",
      null,
      h("th", { scope: "row" }, T("linRow")),
      ...d.growthSteps.map((s0) => h("td", null, String(s0.linearValue)))
    );
    put(
      ui.tableWrap,
      h("table", { class: "fm-table" }, h("thead", null, headRow), h("tbody", null, expRow, linRow))
    );
  }

  function renderPrediction(d) {
    const nextPower = d.power * d.base;
    const trapAdd = d.power + d.base;
    const trapLinear = d.base * (d.exponent + 1);
    ui.predictPrompt.textContent = t(L, {
      en: `Predict & Reason: Right now ${d.base}^${d.exponent} = ${d.power}. If you increase the exponent by 1 (to ${d.base}^${d.exponent + 1}), what happens?`,
      es: `Predice y razona: Ahora ${d.base}^${d.exponent} = ${d.power}. Si aumentas el exponente en 1 (a ${d.base}^${d.exponent + 1}), ¿qué ocurre?`,
    });
    clear(ui.predictRow);
    const choices = [
      {
        id: "multiply",
        label: t(L, {
          en: `Multiply by ${d.base} → ${nextPower}`,
          es: `Multiplicar por ${d.base} → ${nextPower}`,
        }),
      },
      {
        id: "add",
        label: t(L, {
          en: `Add ${d.base} → ${trapAdd}`,
          es: `Sumar ${d.base} → ${trapAdd}`,
        }),
      },
      {
        id: "linear",
        label: t(L, {
          en: `Multiply ${d.base} × ${d.exponent + 1} → ${trapLinear}`,
          es: `Multiplicar ${d.base} × ${d.exponent + 1} → ${trapLinear}`,
        }),
      },
    ];
    for (const ch of choices) {
      put(
        ui.predictRow,
        button(bag, ch.label, {
          pressed: d.prediction === ch.id,
          onClick: () => model.setState({ prediction: ch.id }),
        })
      );
    }
    if (!d.prediction) {
      ui.predictFeedback.textContent = "";
    } else if (d.prediction === "multiply") {
      ui.predictFeedback.textContent = t(L, {
        en: `Exact! Increasing the exponent by 1 multiplies by one more factor of ${d.base}: ${d.power} × ${d.base} = ${nextPower}.`,
        es: `¡Exacto! Aumentar el exponente en 1 multiplica por un factor más de ${d.base}: ${d.power} × ${d.base} = ${nextPower}.`,
      });
    } else {
      ui.predictFeedback.textContent = t(L, {
        en: `Look at the factor chain: ${d.base}^${d.exponent + 1} has one more "× ${d.base}" factor, so ${d.power} × ${d.base} = ${nextPower}.`,
        es: `Observa la cadena de factores: ${d.base}^${d.exponent + 1} tiene un factor "× ${d.base}" más, así que ${d.power} × ${d.base} = ${nextPower}.`,
      });
    }
  }

  function sync(v, force) {
    const d = state();
    if (d.mode === "order") {
      syncOrder();
      return;
    }
    drawChart(d);
    drawSliderTrack(ui.baseSlider, 1, 10, d.base, "b=");
    drawSliderTrack(ui.expSlider, 0, d.maxExponent, d.exponent, "n=");
    ui.baseField.set(d.base, force);
    ui.expField.set(d.exponent, force);
    ui.powerField.set(d.mode === "order" ? d.orderCorrect : d.power, true);
    ui.factorsField.set(
      d.mode === "order"
        ? `${d.addend} + ${d.multiplier} × ${d.expTerm} = ${d.orderCorrect}`
        : `${d.factorsChain} = ${d.power}`,
      true
    );
    ui.trapField.set(
      d.mode === "order"
        ? `(${d.addend} + ${d.multiplier}) × ${d.expTerm} = ${d.orderLeftToRightTrap}`
        : `${d.base} × ${d.exponent} = ${d.additive}`,
      true
    );
    if (ui.compareBtn) ui.compareBtn.setAttribute("aria-pressed", String(d.compare));
    if (ui.tableBtn) ui.tableBtn.setAttribute("aria-pressed", String(d.views.table));
    if (ui.undoBtn) ui.undoBtn.disabled = !model.canUndo();
    renderTable(d);
    renderPrediction(d);
    ui.explain.textContent = model.getMathematicalExplanation(L);
    ui.desc.textContent = model.getAccessibleDescription(L);
    for (const hd of v.handles) hd.refresh();
  }

  return createView(root, model, {
    lang,
    onChange,
    cls: "fm-exponents",
    build,
    sync,
    say: (st, l) => model.getAccessibleDescription(l),
  });
}
