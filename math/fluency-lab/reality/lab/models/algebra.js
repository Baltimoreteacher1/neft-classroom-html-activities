// Algebra models: the equation balance, typed expressions and equations (parsed exactly, never with eval), ratio
// tables, and a line on a coordinate grid.
import { L, R, Rational, clampInt, fracText, parseRational } from "../kernel.js";

const same = (state) => ({ state });
const refuse = (en, es) => ({ refuse: L(en, es) });

// ---- equation balance: pans hold x-bags and unit blocks; the bag's weight is fixed but hidden ---------------------
const MAX_PIECES = 24;
const sideText = (side) => {
  const parts = [];
  if (side.x) parts.push(side.x === 1 ? "x" : `${side.x}x`);
  if (side.u || !parts.length) parts.push(String(side.u));
  return parts.join(" + ");
};

export const balance = {
  id: "balance",
  init: ({ x = 5, left = { x: 1, u: 3 }, right = { x: 0, u: 8 } } = {}) => ({
    x: R(x),
    left: { ...left },
    right: { ...right },
    ops: [],
  }),
  reduce(state, action) {
    const sides = action.side === "both" ? ["left", "right"] : [action.side === "right" ? "right" : "left"];
    const what = action.what === "x" ? "x" : "u";
    const n = clampInt(action.n ?? 1, 1, MAX_PIECES);
    if (action.type === "remove" || action.type === "add") {
      const delta = action.type === "remove" ? -n : n;
      const next = { left: { ...state.left }, right: { ...state.right } };
      for (const side of sides) {
        const value = next[side][what] + delta;
        if (value < 0)
          return refuse(
            `There ${what === "x" ? "are" : "are"} only ${next[side][what]} ${what === "x" ? "x-bags" : "units"} on that side, so you cannot take away ${n}.`,
            `Solo hay ${next[side][what]} ${what === "x" ? "bolsas x" : "unidades"} en ese lado, así que no puedes quitar ${n}.`,
          );
        if (value > MAX_PIECES) return refuse("That pan is full.", "Ese platillo está lleno.");
        next[side][what] = value;
      }
      const op = { side: action.side, what, n, kind: action.type };
      return { state: { ...state, ...next, ops: [...state.ops, op].slice(-20) } };
    }
    if (action.type === "divide") {
      const k = clampInt(action.k, 2, 12);
      const cells = [state.left.x, state.left.u, state.right.x, state.right.u];
      if (cells.some((c) => c % k !== 0))
        return refuse(
          `Every pile has to split into ${k} equal groups. Some of them cannot.`,
          `Cada montón tiene que dividirse en ${k} grupos iguales. Algunos no pueden.`,
        );
      const left = { x: state.left.x / k, u: state.left.u / k };
      const right = { x: state.right.x / k, u: state.right.u / k };
      return { state: { ...state, left, right, ops: [...state.ops, { side: "both", what: "÷", n: k, kind: "divide" }].slice(-20) } };
    }
    return same(state);
  },
  derive(state) {
    const lw = state.left.x * Number(state.x.n) / Number(state.x.d) + state.left.u;
    const rw = state.right.x * Number(state.x.n) / Number(state.x.d) + state.right.u;
    const lwR = state.x.mul(state.left.x).add(state.left.u);
    const rwR = state.x.mul(state.right.x).add(state.right.u);
    const balanced = lwR.eq(rwR);
    const sym = balanced ? "=" : lwR.gt(rwR) ? ">" : "<";
    const dx = state.left.x - state.right.x;
    const solution = dx === 0 ? null : R(state.right.u - state.left.u, dx);
    return {
      leftWeight: lw,
      rightWeight: rw,
      balanced,
      tilt: balanced ? 0 : lwR.gt(rwR) ? 1 : -1,
      equation: `${sideText(state.left)} ${sym} ${sideText(state.right)}`,
      // The equation still has the same solution as when it began (an invisible truth the pans make visible).
      keepsSolution: solution ? solution.eq(state.x) : false,
      solved: balanced && state.left.x === 1 && state.left.u === 0 && state.right.x === 0,
      xValue: state.x,
      leftText: sideText(state.left),
      rightText: sideText(state.right),
    };
  },
  describe(state, lang) {
    const d = balance.derive(state);
    const verdict = d.balanced
      ? lang === "es" ? "La balanza está equilibrada." : "The scale is balanced."
      : d.tilt > 0
        ? lang === "es" ? "El lado izquierdo pesa más." : "The left side is heavier."
        : lang === "es" ? "El lado derecho pesa más." : "The right side is heavier.";
    return `${lang === "es" ? "Ecuación" : "Equation"}: ${d.equation}. ${verdict}`;
  },
};

// ---- exact parsing of typed arithmetic and linear equations ---------------------------------------------------------
// A value is a linear form a·x + b with exact Rational parts. Plain expressions never contain x.
const TOKEN = /\s*(\d+\.?\d*|\.\d+|[+\-−×÷*/^()=x])/gy;
const norm = (text) => String(text).replace(/·/g, "×");

function tokenize(text) {
  const out = [];
  TOKEN.lastIndex = 0;
  const source = norm(text);
  let match = TOKEN.exec(source);
  let end = 0;
  while (match) {
    out.push(match[1]);
    end = TOKEN.lastIndex;
    match = TOKEN.exec(source);
  }
  if (source.slice(end).trim()) return null;
  return out;
}

class Bad extends Error {
  constructor(en, es) {
    super(en);
    this.l = L(en, es);
  }
}

function parseSide(tokens, allowX) {
  let pos = 0;
  let ops = 0;
  const nums = [];
  const peek = () => tokens[pos];
  const take = () => tokens[pos++];
  const lin = (a, b) => ({ a, b });
  const isConst = (v) => v.a.isZero();
  const expr = () => {
    let left = term();
    while (peek() === "+" || peek() === "-" || peek() === "−") {
      const op = take();
      const right = term();
      ops++;
      left = op === "+" ? lin(left.a.add(right.a), left.b.add(right.b)) : lin(left.a.sub(right.a), left.b.sub(right.b));
    }
    return left;
  };
  const term = () => {
    let left = power();
    for (;;) {
      const t = peek();
      const implicit = allowX && (t === "x" || t === "(") && left;
      if (t === "×" || t === "*" || t === "÷" || t === "/" || (!allowX && t === "x")) {
        take();
        const right = power();
        ops++;
        left = mulDiv(left, right, t === "÷" || t === "/");
      } else if (implicit) {
        const right = power();
        left = mulDiv(left, right, false);
      } else break;
    }
    return left;
  };
  const mulDiv = (l, r, div) => {
    if (div) {
      if (!isConst(r)) throw new Bad("You cannot divide by x here.", "Aquí no se puede dividir entre x.");
      if (r.b.isZero()) throw new Bad("You cannot divide by zero.", "No se puede dividir entre cero.");
      return lin(l.a.div(r.b), l.b.div(r.b));
    }
    if (!isConst(l) && !isConst(r)) throw new Bad("Multiplying x by x makes x², which this builder does not use.", "Multiplicar x por x da x², que este constructor no usa.");
    return isConst(l) ? lin(r.a.mul(l.b), r.b.mul(l.b)) : lin(l.a.mul(r.b), l.b.mul(r.b));
  };
  const power = () => {
    const base = unary();
    if (peek() === "^") {
      take();
      const e = unary();
      if (!isConst(base) || !isConst(e) || !e.b.isInteger() || e.b.lt(0) || e.b.gt(6))
        throw new Bad("Exponents must be whole numbers from 0 to 6.", "Los exponentes deben ser números enteros de 0 a 6.");
      ops++;
      return lin(R(0), base.b.pow(Number(e.b.n)));
    }
    return base;
  };
  const unary = () => {
    if (peek() === "-" || peek() === "−") {
      take();
      const v = unary();
      return lin(v.a.neg(), v.b.neg());
    }
    return atom();
  };
  const atom = () => {
    const t = take();
    if (t === undefined) throw new Bad("The expression stops too soon.", "La expresión termina demasiado pronto.");
    if (t === "(") {
      const v = expr();
      if (take() !== ")") throw new Bad("A bracket is not closed.", "Falta cerrar un paréntesis.");
      return v;
    }
    if (t === "x" && allowX) return lin(R(1), R(0));
    if (/^[\d.]/.test(t)) {
      const q = parseRational(t);
      if (!q) throw new Bad("That is not a number.", "Eso no es un número.");
      nums.push(q);
      return lin(R(0), q);
    }
    throw new Bad(`The symbol “${t}” is not in the right place.`, `El símbolo “${t}” no está en el lugar correcto.`);
  };
  const value = expr();
  if (pos < tokens.length) throw new Bad("Something is left over at the end.", "Sobró algo al final.");
  return { value, ops, nums };
}

export function parseExpression(text) {
  try {
    const tokens = tokenize(text);
    if (!tokens || !tokens.length) return { ok: false, reason: L("Type an expression, like 4 × 9.", "Escribe una expresión, como 4 × 9.") };
    if (tokens.includes("=")) return { ok: false, reason: L("An expression has no equals sign.", "Una expresión no lleva signo igual.") };
    const { value, ops, nums } = parseSide(tokens, false);
    return { ok: true, value: value.b, ops, nums, canon: tokens.join(" ").replace(/\*/g, "×").replace(/\//g, "÷").replace(/-/g, "−") };
  } catch (error) {
    if (error instanceof Bad) return { ok: false, reason: error.l };
    if (error instanceof RangeError) return { ok: false, reason: L("That would divide by zero.", "Eso dividiría entre cero.") };
    throw error;
  }
}

export function parseEquation(text) {
  try {
    const tokens = tokenize(text);
    const at = tokens ? tokens.indexOf("=") : -1;
    if (!tokens || at < 1 || at === tokens.length - 1 || tokens.indexOf("=", at + 1) >= 0)
      return { ok: false, reason: L("An equation has one equals sign with something on both sides.", "Una ecuación tiene un signo igual con algo en ambos lados.") };
    const left = parseSide(tokens.slice(0, at), true);
    const right = parseSide(tokens.slice(at + 1), true);
    const a = left.value.a.sub(right.value.a);
    const b = right.value.b.sub(left.value.b);
    let solution = null;
    let kind = "one";
    if (a.isZero()) kind = b.isZero() ? "all" : "none";
    else solution = b.div(a);
    return { ok: true, kind, solution, ops: left.ops + right.ops, hasX: tokens.includes("x"), canon: tokens.join(" ").replace(/\*/g, "×").replace(/\//g, "÷").replace(/-/g, "−") };
  } catch (error) {
    if (error instanceof Bad) return { ok: false, reason: error.l };
    if (error instanceof RangeError) return { ok: false, reason: L("That would divide by zero.", "Eso dividiría entre cero.") };
    throw error;
  }
}

// ---- a typed construction: every accepted entry is a mathematically parsed object --------------------------------
export const builder = {
  id: "builder",
  init: ({ kind = "expr" } = {}) => ({ kind, text: "", entries: [] }),
  reduce(state, action) {
    switch (action.type) {
      case "text":
        return { state: { ...state, text: String(action.text ?? "").slice(0, 60) } };
      case "append":
        return { state: { ...state, text: `${state.text}${action.token}`.slice(0, 60) } };
      case "backspace":
        return { state: { ...state, text: state.text.slice(0, -1) } };
      case "submit": {
        const parsed = state.kind === "expr" ? parseExpression(state.text) : parseEquation(state.text);
        if (!parsed.ok) return { refuse: parsed.reason };
        if (state.entries.some((e) => e.canon === parsed.canon))
          return refuse("You already built that one. Make a different one.", "Ya construiste esa. Haz una diferente.");
        const entry = {
          text: state.text.trim(),
          canon: parsed.canon,
          ops: parsed.ops,
          value: parsed.value ?? null,
          solution: parsed.solution ?? null,
          kind: parsed.kind ?? null,
          nums: parsed.nums ? parsed.nums.map(String) : [],
        };
        return { state: { ...state, text: "", entries: [...state.entries, entry].slice(-12) } };
      }
      case "drop":
        return { state: { ...state, entries: state.entries.filter((_, i) => i !== action.i) } };
      default:
        return same(state);
    }
  },
  derive(state) {
    const live = state.text.trim() ? (state.kind === "expr" ? parseExpression(state.text) : parseEquation(state.text)) : null;
    return {
      live,
      liveText: live?.ok ? (live.value ? fracText(live.value) : live.solution ? `x = ${fracText(live.solution)}` : live.kind) : null,
      entries: state.entries,
    };
  },
  describe(state, lang) {
    return lang === "es" ? `${state.entries.length} construcciones válidas.` : `${state.entries.length} valid constructions.`;
  },
};

// ---- ratio table: rows the student types; the engine finds out whether they are proportional -----------------------
export const ratiotable = {
  id: "ratiotable",
  init: ({ rows = [["1", ""], ["2", ""], ["3", ""]] } = {}) => ({ rows: rows.map((r) => [...r]) }),
  reduce(state, action) {
    if (action.type === "set") {
      if (!state.rows[action.i] || ![0, 1].includes(action.col)) return same(state);
      const rows = state.rows.map((r, i) => (i === action.i ? r.map((c, j) => (j === action.col ? String(action.value).slice(0, 12) : c)) : r));
      return { state: { rows } };
    }
    if (action.type === "add") {
      if (state.rows.length >= 8) return refuse("The table has room for 8 rows.", "La tabla tiene espacio para 8 filas.");
      return { state: { rows: [...state.rows, ["", ""]] } };
    }
    if (action.type === "remove") return state.rows.length > 1 ? { state: { rows: state.rows.filter((_, i) => i !== action.i) } } : same(state);
    return same(state);
  },
  derive(state) {
    const parsed = state.rows.map(([x, y]) => ({ x: parseRational(x), y: parseRational(y) }));
    const filled = parsed.filter((p) => p.x && p.y);
    const ks = filled.map((p) => (p.x.isZero() ? null : p.y.div(p.x)));
    const k = ks.length && ks.every((v) => v && v.eq(ks[0])) ? ks[0] : null;
    return {
      rows: parsed,
      filled: filled.length,
      constant: k,
      constantText: k ? fracText(k) : null,
      distinctX: new Set(filled.map((p) => String(p.x))).size,
    };
  },
  describe(state, lang) {
    const d = ratiotable.derive(state);
    return lang === "es" ? `Tabla con ${d.filled} filas completas.` : `A table with ${d.filled} complete rows.`;
  },
};

// ---- a line on a coordinate grid ------------------------------------------------------------------------------------
const G = 10;
export const graph = {
  id: "graph",
  init: ({ p1 = [0, 0], p2 = [1, 2] } = {}) => ({ p1: [...p1], p2: [...p2] }),
  reduce(state, action) {
    if (action.type !== "move" && action.type !== "nudge") return same(state);
    const key = action.pt === "p2" ? "p2" : "p1";
    const [x0, y0] = state[key];
    const x = action.type === "move" ? action.x : x0 + (action.dx || 0);
    const y = action.type === "move" ? action.y : y0 + (action.dy || 0);
    if (x < -G || x > G || y < -G || y > G) return refuse(`The grid only goes from −${G} to ${G}.`, `La cuadrícula solo va de −${G} a ${G}.`);
    const other = state[key === "p1" ? "p2" : "p1"];
    if (x === other[0] && y === other[1]) return refuse("The two points must be in different places to make a line.", "Los dos puntos deben estar en lugares distintos para formar una recta.");
    return { state: { ...state, [key]: [x, y] } };
  },
  derive(state) {
    const [x1, y1] = state.p1;
    const [x2, y2] = state.p2;
    const run = x2 - x1;
    const rise = y2 - y1;
    const vertical = run === 0;
    const slope = vertical ? null : R(rise, run);
    const intercept = vertical ? null : R(y1).sub(slope.mul(x1));
    const m = slope ? fracText(slope) : null;
    const b = intercept ? fracText(intercept.abs()) : null;
    const mText = !slope ? null : slope.eq(1) ? "" : slope.eq(-1) ? "−" : m.replace("-", "−");
    const equation = vertical
      ? `x = ${x1}`.replace("-", "−")
      : `y = ${[slope.isZero() ? "" : `${mText}x`, intercept.isZero() ? (slope.isZero() ? "0" : "") : `${slope.isZero() ? "" : intercept.sign() < 0 ? " − " : " + "}${slope.isZero() ? (intercept.sign() < 0 ? "−" : "") : ""}${b}`].join("")}`;
    return {
      p1: state.p1,
      p2: state.p2,
      rise,
      run,
      vertical,
      slope,
      intercept,
      equation,
      proportional: !vertical && intercept.isZero(),
      table: !vertical ? [-2, -1, 0, 1, 2, 3].map((x) => [x, slope.mul(x).add(intercept)]) : [],
    };
  },
  describe(state, lang) {
    const d = graph.derive(state);
    const pts = `(${state.p1.join(", ")}) ${lang === "es" ? "y" : "and"} (${state.p2.join(", ")})`;
    return lang === "es"
      ? `Recta por ${pts}. ${d.vertical ? "Es vertical." : `Pendiente ${fracText(d.slope)}. Ecuación ${d.equation}.`}`
      : `A line through ${pts}. ${d.vertical ? "It is vertical." : `Slope ${fracText(d.slope)}. Equation ${d.equation}.`}`;
  },
};

export { Rational };
