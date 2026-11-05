// Family "balance": an equation a·x + b = c·x + d drawn as a balance of algebra tiles (x tiles and
// unit tiles), plus an expression mode (substitute x = n into ax + b and combine like terms). Every
// operation is applied to BOTH sides by construction: the model has no way to touch one side, and a
// patch that names a side is refused. Coefficients become rational after a division (2x = 5).
import {
  add,
  button,
  clamp,
  clear,
  createView,
  defineFamily,
  div,
  eq,
  field,
  frac,
  fracToString,
  h,
  isInt,
  isRat,
  makeDraggable,
  mul,
  put,
  s,
  sign,
  stext,
  sub,
  t,
  toFrac,
  toNumber,
  toSvgX,
} from "./core.mjs";

export const id = "balance";
export const label = { en: "Balance models", es: "Modelos de balanza" };

const ZERO = frac(0);
const ONE = frac(1);
const MODES = ["equation", "expression"];
const OPS = ["add", "subtract", "divide"];
const TERMS = ["const", "x"];
const MAX_LOG = 40;
const MINUS = "−";
const ACTIONS = ["apply", "x", "combined"];

// ── Text helpers ─────────────────────────────────────────────────────────────

const num = (r) => fracToString(r).replace("-", MINUS);
const abs = (r) => (sign(r) < 0 ? frac(-r.n, r.d) : r);
const pv = (r) => (r.d === 1 && r.n >= 0 ? num(r) : `(${num(r)})`);
const q = (n, d) => (sign(d) === 0 ? null : div(n, d));

function coef(a) {
  if (eq(a, ONE)) return "x";
  if (eq(a, frac(-1))) return `${MINUS}x`;
  const v = abs(a);
  return `${sign(a) < 0 ? MINUS : ""}${v.d === 1 ? v.n : `(${fracToString(v)})`}x`;
}
/** "3x + 2", "x − 4", "−x", "0", "(3/2)x". */
function lin(a, b) {
  if (sign(a) === 0) return num(b);
  if (sign(b) === 0) return coef(a);
  return `${coef(a)} ${sign(b) < 0 ? MINUS : "+"} ${num(abs(b))}`;
}
const eqText = (e) => `${lin(e.a, e.b)} = ${lin(e.c, e.d)}`;
const at = (a, b, x) => add(mul(a, x), b);
/** "3 × 5 + 2 = 17" */
const calc = (a, b, x) =>
  `${pv(a)} × ${pv(x)} ${sign(b) < 0 ? MINUS : "+"} ${num(abs(b))} = ${num(at(a, b, x))}`;

// ── State ────────────────────────────────────────────────────────────────────

const isLin = (e) => !!e && ["a", "b", "c", "d"].every((k) => isRat(e[k]));
const small = (r) => Math.abs(r.n) <= 1e9 && r.d <= 1e6;
const isGroup = (g) => !!g && isRat(g.a) && isRat(g.b) && small(g.a) && small(g.b);

function validateState(st) {
  if (!st || !MODES.includes(st.mode) || typeof st.combined !== "boolean") return false;
  if (!Number.isInteger(st.range) || st.range < 2 || st.range > 20) return false;
  if (typeof st.reveal !== "boolean") return false;
  if (st.x !== null && !(isRat(st.x) && small(st.x))) return false;
  if (!Array.isArray(st.log) || st.log.length > MAX_LOG) return false;
  const stepOk = (e) => e && OPS.includes(e.op) && TERMS.includes(e.term) && isRat(e.value) && sign(e.value) !== 0;
  if (!st.log.every(stepOk)) return false;
  if (st.mode === "expression") {
    return st.x !== null && Array.isArray(st.groups) && st.groups.length >= 1 && st.groups.length <= 3 && st.groups.every(isGroup);
  }
  return isLin(st.eq) && isLin(st.start) && Object.values(st.eq).every(small);
}

/** A step as {kind, amount}: kind "const" | "x" | "divide"; amount is the signed change (or the divisor). */
function parseStep(raw) {
  if (!raw || typeof raw !== "object" || !OPS.includes(raw.op)) return null;
  const v = toFrac(raw.value);
  if (!v || sign(v) === 0) return null;
  if (raw.op === "divide") {
    const term = raw.term ?? "all";
    return eq(v, ONE) ? null : { op: "divide", term, kind: "divide", amount: v, sides: raw.sides };
  }
  if (!TERMS.includes(raw.term)) return null;
  return { op: raw.op, term: raw.term, kind: raw.term, amount: raw.op === "add" ? v : mul(v, frac(-1)), sides: raw.sides };
}

function applyStep(st, raw) {
  const keys = Object.keys(raw || {});
  // Only op, term and value exist. A "side" (or any other key) is refused: both sides, always.
  if (keys.some((k) => !["op", "term", "value"].includes(k))) return null;
  const p = parseStep(raw);
  if (!p || (p.op === "divide" && p.term !== "all") || st.log.length >= MAX_LOG) return null;
  const e = { ...st.eq };
  if (p.kind === "const") {
    e.b = add(e.b, p.amount);
    e.d = add(e.d, p.amount);
  } else if (p.kind === "x") {
    e.a = add(e.a, p.amount);
    e.c = add(e.c, p.amount);
  } else {
    for (const k of ["a", "b", "c", "d"]) e[k] = div(e[k], p.amount);
  }
  const entry =
    p.op === "divide"
      ? { op: "divide", term: "const", value: p.amount }
      : { op: sign(p.amount) < 0 ? "subtract" : "add", term: p.term, value: abs(p.amount) };
  return { ...st, eq: e, log: [...st.log, entry] };
}

function reduce(st, patch) {
  if (!patch || typeof patch !== "object" || Object.keys(patch).some((k) => !ACTIONS.includes(k))) return null;
  let next = { ...st };
  if ("apply" in patch) {
    if (st.mode !== "equation") return null;
    next = applyStep(next, patch.apply);
    if (!next) return null;
  }
  if ("x" in patch) {
    if (patch.x === null) {
      if (st.mode === "expression") return null;
      next.x = null;
    } else {
      const v = toFrac(patch.x);
      if (!v || !small(v)) return null;
      next.x = v;
    }
  }
  if ("combined" in patch) {
    if (st.mode !== "expression") return null;
    next.combined = patch.combined === true;
  }
  return next;
}

function solve(e) {
  const A = sub(e.a, e.c);
  const B = sub(e.d, e.b);
  if (sign(A) !== 0) return { kind: "one", x: div(B, A) };
  return { kind: sign(B) === 0 ? "all" : "none" };
}

function derive(st) {
  if (st.mode === "expression") {
    const total = st.groups.reduce((n, g) => ({ a: add(n.a, g.a), b: add(n.b, g.b) }), { a: ZERO, b: ZERO });
    return { ...st, total, value: at(total.a, total.b, st.x), text: lin(total.a, total.b) };
  }
  const e = st.eq;
  const left = st.x ? at(e.a, e.b, st.x) : null;
  const right = st.x ? at(e.c, e.d, st.x) : null;
  const diff = left ? sign(sub(left, right)) : 0;
  const solved = eq(e.a, ONE) && sign(e.b) === 0 && sign(e.c) === 0;
  return { ...st, solution: solve(e), left, right, solved, tilt: !left ? null : diff > 0 ? "left" : diff < 0 ? "right" : "level", text: eqText(e) };
}

function normalize(config) {
  const c = config || {};
  const mode = c.mode ?? (c.combine ? "expression" : "equation");
  if (!MODES.includes(mode)) throw new TypeError("balance: mode must be equation or expression");
  const whole = (v, name) => {
    const r = toFrac(v);
    if (!r || !isInt(r)) throw new TypeError(`balance: ${name} must be an integer`);
    return r;
  };
  const guess = c.x == null ? null : toFrac(c.x);
  if (c.x != null && !guess) throw new TypeError("balance: x must be a number");
  const state = { mode, range: c.range ?? 10, reveal: c.reveal === true, combined: c.combined === true, log: [], x: guess };
  if (mode === "expression") {
    const raw = c.combine ?? [{ a: 2, b: 3 }, { a: 1, b: -1 }];
    state.groups = raw.map((g) => ({ a: whole(Array.isArray(g) ? g[0] : g.a, "a"), b: whole(Array.isArray(g) ? g[1] : g.b, "b") }));
    state.x ??= frac(2);
  } else {
    state.eq = { a: whole(c.a ?? 3, "a"), b: whole(c.b ?? 2, "b"), c: whole(c.c ?? 2, "c"), d: whole(c.d ?? 7, "d") };
    state.start = { ...state.eq };
  }
  if (!validateState(state)) throw new TypeError("balance: invalid configuration");
  return { state, task: c.task || null };
}

// ── Words ────────────────────────────────────────────────────────────────────

function stepText(e, lang) {
  const v = num(e.value);
  const piece = e.term === "x" ? `${v === "1" ? "" : v}x` : v;
  if (e.op === "divide") return t(lang, { en: `Divide both sides by ${v}`, es: `Divide los dos lados entre ${v}` });
  if (e.op === "add") return t(lang, { en: `Add ${piece} to both sides`, es: `Suma ${piece} a los dos lados` });
  return t(lang, { en: `Subtract ${piece} from both sides`, es: `Resta ${piece} de los dos lados` });
}

function countText(v, noun, lang) {
  const w = num(abs(v));
  const one = w === "1";
  const neg = sign(v) < 0;
  const en = noun === "x" ? (one ? "x-tile" : "x-tiles") : one ? "unit tile" : "unit tiles";
  const es = `${one ? "ficha" : "fichas"} ${noun === "x" ? "x" : "de unidad"}`;
  return t(lang, { en: `${w} ${neg ? "negative " : ""}${en}`, es: `${w} ${es}${neg ? (one ? " negativa" : " negativas") : ""}` });
}

/** What happens when the student tries x: the balance tips left, right, or stays level. */
function triedText(st, d, lang) {
  const tilt = {
    left: t(lang, { en: "the balance tips left", es: "la balanza se inclina a la izquierda" }),
    right: t(lang, { en: "the balance tips right", es: "la balanza se inclina a la derecha" }),
    level: t(lang, { en: "the balance is level", es: "la balanza está nivelada" }),
  };
  return t(lang, {
    en: `With x = ${num(st.x)} the left side is ${num(d.left)} and the right side is ${num(d.right)}, so ${tilt[d.tilt]}.`,
    es: `Con x = ${num(st.x)} el lado izquierdo es ${num(d.left)} y el lado derecho es ${num(d.right)}, así que ${tilt[d.tilt]}.`,
  });
}

function accessibleDescription(st, lang) {
  const d = derive(st);
  if (st.mode === "expression") {
    const groups = st.groups.map((g) => `(${lin(g.a, g.b)})`).join(" + ");
    return t(lang, {
      en: `Expression model. The expression is ${groups}. Combined it is ${d.text}. With x = ${num(st.x)} the value is ${num(d.value)}.`,
      es: `Modelo de expresión. La expresión es ${groups}. Juntando términos queda ${d.text}. Con x = ${num(st.x)} el valor es ${num(d.value)}.`,
    });
  }
  const e = st.eq;
  const side = (a, b) => `${countText(a, "x", lang)} ${t(lang, { en: "and", es: "y" })} ${countText(b, "u", lang)}`;
  const tried = st.x ? ` ${triedText(st, d, lang)}` : "";
  return t(lang, {
    en: `Balance model. The equation is ${d.text}. Left side: ${side(e.a, e.b)}. Right side: ${side(e.c, e.d)}.${tried}`,
    es: `Modelo de balanza. La ecuación es ${d.text}. Lado izquierdo: ${side(e.a, e.b)}. Lado derecho: ${side(e.c, e.d)}.${tried}`,
  });
}

/** The explanation as separate sentences so the screen can hold back the solution until it is earned. */
export function explainParts(st, lang) {
  const d = derive(st);
  if (st.mode === "expression") {
    const groups = st.groups.map((g) => lin(g.a, g.b));
    const joined = groups.length > 1 ? groups.map((g) => `(${g})`).join(" + ") : groups[0];
    return [
      t(lang, { en: `The expression is ${joined}.`, es: `La expresión es ${joined}.` }),
      t(lang, {
        en: `Combine like terms: x tiles with x tiles, units with units. The result is ${d.text}.`,
        es: `Junta los términos semejantes: fichas x con fichas x y unidades con unidades. El resultado es ${d.text}.`,
      }),
      t(lang, { en: `With x = ${num(st.x)}: ${calc(d.total.a, d.total.b, st.x)}.`, es: `Con x = ${num(st.x)}: ${calc(d.total.a, d.total.b, st.x)}.` }),
    ];
  }
  const e = st.eq;
  const out = [
    t(lang, {
      en: `${d.text}. Whatever you do to one side of the balance, do to the other side. Then both sides stay equal.`,
      es: `${d.text}. Lo que le haces a un lado de la balanza, se lo haces al otro lado. Así los dos lados siguen iguales.`,
    }),
  ];
  if (st.log.length) {
    const steps = st.log.map((l) => stepText(l, lang)).join("; ");
    out.push(t(lang, { en: `Steps so far: ${steps}.`, es: `Pasos hasta ahora: ${steps}.` }));
  }
  const sol = d.solution;
  if (sol.kind === "one") {
    const x = sol.x;
    out.push(
      t(lang, {
        en: `The solution is x = ${num(x)}. Check: ${calc(e.a, e.b, x)} and ${calc(e.c, e.d, x)}, so both sides are equal.`,
        es: `La solución es x = ${num(x)}. Comprueba: ${calc(e.a, e.b, x)} y ${calc(e.c, e.d, x)}, así que los dos lados son iguales.`,
      }),
    );
  } else if (sol.kind === "all") {
    out.push(t(lang, { en: "Every number is a solution, because both sides are the same.", es: "Cualquier número es solución, porque los dos lados son iguales." }));
  } else {
    out.push(t(lang, { en: "No number is a solution, because the sides can never be equal.", es: "Ningún número es solución, porque los dos lados nunca pueden ser iguales." }));
  }
  if (st.x) out.push(triedText(st, d, lang));
  return out;
}

const explanation = (st, lang) => explainParts(st, lang).join(" ");

// ── validate(task) ───────────────────────────────────────────────────────────

const parseEq = (e) => {
  const o = {};
  for (const k of ["a", "b", "c", "d"]) o[k] = toFrac(e?.[k]);
  return isLin(o) ? o : null;
};

/** Which known wrong method produces `given`? Each formula is the answer that method would reach. */
function solveWrong(e, given) {
  const { a, b, c, d } = e;
  const A = sub(a, c);
  const methods = [
    ["one-side-only", [q(d, A), q(sub(d, b), a)]],
    ["sign-error", [q(add(d, b), A), q(sub(d, b), sub(c, a)), q(sub(d, b), add(a, c))]],
    ["divide-one-term", [q(sub(d, b), sub(ONE, c)), q(sub(q(d, a) ?? ZERO, b), A)]],
  ];
  const hit = methods.find(([, answers]) => answers.some((r) => r && eq(r, given)));
  return hit ? hit[0] : null;
}

function validateTask(st, task) {
  const none = (reason, ok = false) => ({ ok, reason, misconception: null });
  const wrong = (m) => ({ ok: false, reason: "incorrect", misconception: m && { id: m, confidence: "possible" } });
  if (!task) return none("no-task");
  const d = derive(st);
  if (task.kind === "solve") {
    const e = task.eq ? parseEq(task.eq) : st.start;
    if (!e || st.mode !== "equation") return none("invalid-task");
    const sol = solve(e);
    if (sol.kind !== "one") return none("invalid-task");
    const given = toFrac(task.answer !== undefined ? task.answer : st.x);
    if (!given) return none("invalid-answer");
    return eq(given, sol.x) ? none("correct", true) : wrong(solveWrong(e, given));
  }
  if (task.kind === "step") {
    const given = parseStep(task.answer);
    if (!given) return none("invalid-answer");
    if (given.sides && given.sides !== "both") return wrong("one-side-only");
    const want = task.expect ? parseStep(task.expect) : null;
    if (task.expect && !want) return none("invalid-task");
    if (given.op === "divide" && given.term !== "all") return wrong("divide-one-term");
    if (!want) return none("correct", true);
    if (given.kind === want.kind && eq(given.amount, want.amount)) return none("correct", true);
    if (given.kind === want.kind && given.kind !== "divide" && eq(given.amount, mul(want.amount, frac(-1)))) return wrong("sign-error");
    return wrong(null);
  }
  if (task.kind === "tilt") {
    const x = toFrac(task.x ?? st.x);
    if (!x || !["left", "right", "level"].includes(task.answer) || st.mode !== "equation") return none("invalid-task");
    const diff = sign(sub(at(st.eq.a, st.eq.b, x), at(st.eq.c, st.eq.d, x)));
    return task.answer === (diff > 0 ? "left" : diff < 0 ? "right" : "level") ? none("correct", true) : wrong(null);
  }
  if (task.kind === "evaluate" || task.kind === "combine") {
    if (st.mode !== "expression") return none("invalid-task");
    if (task.kind === "evaluate") {
      const x = toFrac(task.x ?? st.x);
      const given = toFrac(task.answer);
      if (!x || !given) return none("invalid-answer");
      if (eq(given, d.value) && eq(x, st.x)) return none("correct", true);
      const want = at(d.total.a, d.total.b, x);
      if (eq(given, want)) return none("correct", true);
      return wrong(eq(given, at(d.total.a, mul(d.total.b, frac(-1)), x)) ? "sign-error" : null);
    }
    const a = toFrac(task.answer?.a);
    const b = toFrac(task.answer?.b);
    if (!a || !b) return none("invalid-answer");
    if (eq(a, d.total.a) && eq(b, d.total.b)) return none("correct", true);
    return wrong(eq(a, d.total.a) && sign(b) !== 0 && eq(b, mul(d.total.b, frac(-1))) ? "sign-error" : null);
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
  track: (patch) => !("combined" in patch) || Object.keys(patch).length > 1,
  describeConfig: (st) =>
    st.mode === "expression"
      ? { mode: st.mode, combine: st.groups.map((g) => ({ a: num(g.a), b: num(g.b) })), x: num(st.x), range: st.range }
      : { mode: st.mode, a: num(st.start.a), b: num(st.start.b), c: num(st.start.c), d: num(st.start.d), range: st.range, reveal: st.reveal },
});

// ── Rendering ────────────────────────────────────────────────────────────────

const STR = {
  add: { en: "Add", es: "Sumar" },
  subtract: { en: "Subtract", es: "Restar" },
  divide: { en: "Divide by", es: "Dividir entre" },
  const: { en: "A number", es: "Un número" },
  x: { en: "x-tiles", es: "Fichas x" },
  amount: { en: "Amount", es: "Cantidad" },
  apply: { en: "Do it to both sides", es: "Hazlo en los dos lados" },
  undo: { en: "Undo", es: "Deshacer" },
  reset: { en: "Start over", es: "Empezar de nuevo" },
  equation: { en: "Equation", es: "Ecuación" },
  steps: { en: "Steps", es: "Pasos" },
  try: { en: "Try x =", es: "Prueba x =" },
  clear: { en: "Hide my try", es: "Quitar mi prueba" },
  left: { en: "Left side", es: "Lado izquierdo" },
  right: { en: "Right side", es: "Lado derecho" },
  combine: { en: "Combine like terms", es: "Juntar términos semejantes" },
  value: { en: "Value", es: "Valor" },
  expr: { en: "Expression", es: "Expresión" },
  balance: { en: "Balance", es: "Balanza" },
  invalid: { en: "Type a number like 4, 1.5 or 3/2.", es: "Escribe un número como 4, 1.5 o 3/2." },
  refused: { en: "Type a number that is not 0.", es: "Escribe un número que no sea 0." },
  handle: { en: "Value of x. Use the arrow keys, or drag.", es: "Valor de x. Usa las flechas, o arrastra." },
};
const W = 360;
const BASE = 150;
const TRACK = { x0: 24, x1: 336, y: 26 };
let uid = 0;

/** Stacks x tiles (24px) then unit tiles (14px) standing on y = base inside [left, left + w]. */
function stack(g, left, w, base, a, b) {
  let y = base;
  const run = (v, size, isX) => {
    const n = Math.abs(v.n);
    const cls = `fm-tile ${isX ? "fm-tile-x" : "fm-tile-u"}${sign(v) < 0 ? " fm-neg" : ""}`;
    if (v.d !== 1 || n > 10) {
      // Not countable as tiles: one wide block carries the exact amount.
      g.append(s("rect", { class: cls, x: left + 4, y: y - 26, width: w - 8, height: 26 }), stext(left + w / 2, y - 8, `${num(v)}${isX ? "x" : ""}`, "fm-svg-text", "middle"));
      y -= 30;
      return;
    }
    const per = Math.max(1, Math.floor((w - 8) / (size + 2)));
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / per);
      const px = left + 4 + (i % per) * (size + 2);
      const py = y - (row + 1) * (size + 2);
      g.append(s("rect", { class: cls, x: px, y: py, width: size, height: size }));
      if (isX) g.append(stext(px + size / 2, py + size - 6, sign(v) < 0 ? `${MINUS}x` : "x", "fm-svg-text fm-tile-label", "middle"));
    }
    y -= Math.ceil(n / per) * (size + 2) + (n ? 4 : 0);
  };
  run(a, 24, true);
  run(b, 14, false);
}

export function mount(root, model, { lang = "en", onChange, readonly = false } = {}) {
  const id0 = `fmb${++uid}`;
  let bag;
  let L = lang;
  let ui = {};
  let pick = { op: "subtract", term: "const" };
  const state = () => model.getState();
  const T = (k) => t(L, STR[k]);

  function guessSlider() {
    const svg = s("svg", { class: "fm-svg fm-guess", viewBox: `0 0 ${W} 54`, role: "group", "aria-label": T("try") });
    const g = s("g");
    const handle = readonly ? null : s("g", { class: "fm-handle" }, s("circle", { class: "fm-hit", r: 40 }), s("circle", { class: "fm-ring", r: 17 }), s("circle", { class: "fm-knob", r: 10 }));
    svg.append(g);
    if (handle) svg.append(handle);
    return { svg, g, handle };
  }

  function wireSlider(node) {
    return makeDraggable(node, {
      get: () => (state().x ? clamp(Math.round(toNumber(state().x)), -state().range, state().range) : 0),
      set: (v) => model.setState({ x: Math.round(v) }),
      min: () => -state().range,
      max: () => state().range,
      step: 1,
      bigStep: 5,
      label: T("handle"),
      valueText: () => `x = ${state().x ? num(state().x) : "0"}`,
      toValue: ({ x, node: n }) => {
        const r = state().range;
        return ((toSvgX(n, x, W).x - TRACK.x0) / (TRACK.x1 - TRACK.x0)) * 2 * r - r;
      },
    });
  }

  function commitX(value, f) {
    const ok = model.setState({ x: value });
    f.invalid(!ok);
    ui.msg.textContent = ok ? "" : T("invalid");
  }

  function applyPick() {
    const f = ui.amount;
    const ok = model.setState({ apply: { op: pick.op, term: pick.op === "divide" ? "all" : pick.term, value: f.input.value } });
    f.invalid(!ok);
    ui.msg.textContent = ok ? "" : T("refused");
  }

  function build(v) {
    bag = v.bag;
    L = v.lang;
    ui = {};
    const st = state();
    const expr = st.mode === "expression";
    ui.prompt = model.task?.prompt ? h("p", { class: "fm-prompt" }, t(L, model.task.prompt)) : null;
    ui.explain = h("p", { class: "fm-explain" });
    ui.desc = h("p", { class: "fm-sr" });
    ui.msg = h("p", { class: "fm-msg", role: "status" });
    ui.svg = s("svg", { class: "fm-svg", viewBox: `0 0 ${W} 214`, role: "group", "aria-label": T(expr ? "expr" : "balance") });
    ui.body = s("g", { class: "fm-beam" });
    ui.fixed = s("g");
    ui.svg.append(ui.body, ui.fixed);
    const sl = guessSlider();
    ui.slider = sl;
    ui.eqNow = field(bag, { id: `${id0}-eq`, label: T(expr ? "expr" : "equation"), readonly: true });
    ui.left = field(bag, { id: `${id0}-l`, label: T("left"), readonly: true });
    ui.right = field(bag, { id: `${id0}-r`, label: T("right"), readonly: true });
    ui.value = field(bag, { id: `${id0}-v`, label: T("value"), readonly: true });
    ui.try = field(bag, { id: `${id0}-x`, label: T("try"), readonly, onCommit: (val) => commitX(val, ui.try) });
    ui.log = h("ol", { class: "fm-log", "aria-label": T("steps") });
    const controls = [];
    if (!readonly) {
      ui.amount = field(bag, { id: `${id0}-amt`, label: T("amount"), onCommit: () => {} });
      ui.amount.input.value = "1";
      ui.opBtns = OPS.map((op) => button(bag, T(op), { pressed: pick.op === op, onClick: () => ((pick.op = op), sync(v)) }));
      ui.termBtns = TERMS.map((tm) => button(bag, T(tm), { pressed: pick.term === tm, onClick: () => ((pick.term = tm), sync(v)) }));
      ui.apply = button(bag, T("apply"), { onClick: applyPick });
      ui.undo = button(bag, T("undo"), { onClick: () => model.undo() });
      ui.clear = button(bag, T("clear"), { onClick: () => model.setState({ x: null }) });
      ui.combine = button(bag, T("combine"), { pressed: st.combined, onClick: () => model.setState({ combined: !state().combined }) });
      ui.opRow = h("div", { class: "fm-row", role: "group", "aria-label": T("apply") }, ...ui.opBtns);
      ui.termRow = h("div", { class: "fm-row", role: "group", "aria-label": T("amount") }, ...ui.termBtns);
      controls.push(ui.opRow, ui.termRow, h("div", { class: "fm-fields" }, ui.amount.el), h("div", { class: "fm-row" }, ui.apply, ui.undo, ui.clear, button(bag, T("reset"), { onClick: () => model.reset() })));
    }
    ui.eqSec = h("section", { class: "fm-view fm-view-equation", "aria-label": T("balance") }, ui.svg, h("div", { class: "fm-fields" }, ui.eqNow.el, ui.left.el, ui.right.el));
    ui.eqCtl = h("div", { class: "fm-view-equation" }, ...controls, h("h3", { class: "fm-sub" }, T("steps")), ui.log);
    ui.exprCtl = h("div", { class: "fm-view-expression fm-row" }, ui.combine, h("div", { class: "fm-fields" }, ui.value.el));
    put(root, ui.prompt, ui.eqSec, h("section", { class: "fm-view", "aria-label": T("try") }, sl.svg, h("div", { class: "fm-fields" }, ui.try.el)), ui.exprCtl, ui.eqCtl, ui.msg, ui.explain, ui.desc);
    if (sl.handle) v.handles.push(wireSlider(sl.handle));
  }

  function drawBalance(d) {
    clear(ui.body);
    clear(ui.fixed);
    const deg = d.tilt === "left" ? -6 : d.tilt === "right" ? 6 : 0;
    ui.body.setAttribute("transform", `rotate(${deg} 180 ${BASE + 4})`);
    ui.body.append(s("rect", { class: "fm-beam-bar", x: 16, y: BASE, width: 328, height: 8, rx: 3 }));
    stack(ui.body, 22, 148, BASE, d.eq.a, d.eq.b);
    stack(ui.body, 190, 148, BASE, d.eq.c, d.eq.d);
    const sym = d.tilt === "left" ? ">" : d.tilt === "right" ? "<" : "=";
    ui.fixed.append(s("path", { class: "fm-fulcrum", d: `M180 ${BASE + 6} L162 ${BASE + 32} L198 ${BASE + 32} Z` }), stext(180, 66, sym, "fm-svg-text fm-sym", "middle"));
    ui.fixed.append(stext(96, 206, lin(d.eq.a, d.eq.b), "fm-svg-text fm-svg-strong", "middle"), stext(264, 206, lin(d.eq.c, d.eq.d), "fm-svg-text fm-svg-strong", "middle"));
  }

  function drawTray(d) {
    clear(ui.body);
    clear(ui.fixed);
    ui.body.removeAttribute("transform");
    const groups = d.combined ? [d.total] : d.groups;
    const w = (W - 12 * (groups.length - 1) - 24) / groups.length;
    groups.forEach((g, i) => {
      const left = 12 + i * (w + 12);
      ui.body.append(s("rect", { class: "fm-tray", x: left, y: 30, width: w, height: BASE - 24, rx: 6 }));
      stack(ui.body, left, w, BASE, g.a, g.b);
      ui.fixed.append(stext(left + w / 2, 182, lin(g.a, g.b), "fm-svg-text fm-svg-strong", "middle"));
    });
    ui.fixed.append(stext(12, 20, `x = ${num(d.x)}`, "fm-svg-text"));
  }

  function drawTrack(d) {
    const g = ui.slider.g;
    clear(g);
    const r = d.range;
    const X = (n) => TRACK.x0 + ((TRACK.x1 - TRACK.x0) * (n + r)) / (2 * r);
    g.append(s("line", { class: "fm-axis", x1: TRACK.x0, x2: TRACK.x1, y1: TRACK.y, y2: TRACK.y }));
    for (let k = -r; k <= r; k++) {
      g.append(s("line", { class: "fm-tick", x1: X(k), x2: X(k), y1: TRACK.y - 5, y2: TRACK.y + 5 }));
      if (k === -r || k === 0 || k === r) g.append(stext(X(k), TRACK.y + 26, num(frac(k)), "fm-svg-text", "middle"));
    }
    const x = d.x ? clamp(toNumber(d.x), -r, r) : 0;
    ui.slider.handle?.setAttribute("transform", `translate(${X(x)} ${TRACK.y})`);
    if (!d.x) ui.slider.handle?.classList.add("fm-idle");
    else ui.slider.handle?.classList.remove("fm-idle");
  }

  function sync(v) {
    const d = state();
    const expr = d.mode === "expression";
    for (const n of root.querySelectorAll(".fm-view-equation")) n.hidden = expr;
    ui.exprCtl.hidden = !expr;
    if (ui.clear) ui.clear.hidden = expr;
    if (expr) drawTray(d);
    else drawBalance(d);
    drawTrack(d);
    ui.try.set(d.x ? num(d.x) : "");
    if (expr) {
      ui.eqNow.set(d.text);
      ui.value.set(calc(d.total.a, d.total.b, d.x));
      ui.combine?.setAttribute("aria-pressed", String(d.combined));
    } else {
      ui.eqNow.set(d.text);
      ui.left.set(d.left ? num(d.left) : "–");
      ui.right.set(d.right ? num(d.right) : "–");
      clear(ui.log);
      for (const e of d.log) put(ui.log, h("li", null, stepText(e, L)));
      if (ui.opBtns) {
        OPS.forEach((op, i) => ui.opBtns[i].setAttribute("aria-pressed", String(pick.op === op)));
        TERMS.forEach((tm, i) => ui.termBtns[i].setAttribute("aria-pressed", String(pick.term === tm)));
        ui.termRow.hidden = pick.op === "divide";
      }
      if (ui.undo) ui.undo.disabled = !model.canUndo();
      if (ui.clear) ui.clear.disabled = !d.x;
    }
    const parts = explainParts(d, L);
    const hide = !expr && !d.reveal && !d.solved;
    // Hold back the solution sentence (index 1 or 2) until the student reaches x = n or reveal is on.
    ui.explain.textContent = hide ? parts.filter((_, i) => i !== parts.length - (d.x ? 2 : 1)).join(" ") : parts.join(" ");
    ui.desc.textContent = model.getAccessibleDescription(L);
    for (const hd of v.handles) hd.refresh();
  }

  return createView(root, model, {
    lang,
    onChange,
    cls: "fm-balance",
    build,
    sync,
    say: (st, l) => (st.mode === "expression" ? `${st.text} = ${num(st.value)}` : st.tilt ? triedText(st, st, l) : st.text),
  });
}
