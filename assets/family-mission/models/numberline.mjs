// Family "numberline": a number line from -N to N in three modes. "inequality" draws a boundary
// rule (x > 3, x ≤ -2, -2 < x ≤ 3) with open or closed draggable endpoints and a test-a-value
// marker; "opposites" shows a number, its opposite and its absolute value; "order" places numbers
// by true position while the student arranges them least to greatest. Exact fractions throughout.
import {
  button,
  clamp,
  clear,
  cmp,
  createView,
  defineFamily,
  eq,
  field,
  frac,
  fracToString,
  h,
  isRat,
  makeDraggable,
  mul,
  put,
  s,
  sign,
  stext,
  sub,
  add,
  t,
  toFrac,
  toNumber,
  toSvgX,
} from "./core.mjs";

export const id = "numberline";
export const label = { en: "Number line models", es: "Modelos de recta numérica" };

const MODES = ["inequality", "opposites", "order"];
const DIRS = ["right", "left", "between"];
const ACTIONS = ["boundary", "boundary2", "closed", "closed2", "dir", "test", "rule", "fine", "value", "swap"];
const MINUS = "−";

const num = (r) => fracToString(r).replace("-", MINUS);
const abs = (r) => (sign(r) < 0 ? frac(-r.n, r.d) : r);
const neg = (r) => frac(-r.n, r.d);

// ── Rules: a spec is { dir, ends: [{ v, closed }] } ──────────────────────────

const sym = (dir, closed) => (dir === "right" ? (closed ? "≥" : ">") : closed ? "≤" : "<");

function ruleText(spec) {
  const [lo, hi] = spec.ends;
  if (spec.dir === "between") return `${num(lo.v)} ${lo.closed ? "≤" : "<"} x ${hi.closed ? "≤" : "<"} ${num(hi.v)}`;
  return `x ${sym(spec.dir, lo.closed)} ${num(lo.v)}`;
}

function contains(spec, x) {
  const [a, b] = spec.ends;
  const above = a.closed ? cmp(x, a.v) >= 0 : cmp(x, a.v) > 0;
  const below = a.closed ? cmp(x, a.v) <= 0 : cmp(x, a.v) < 0;
  if (spec.dir === "right") return above;
  if (spec.dir === "left") return below;
  return above && (b.closed ? cmp(x, b.v) <= 0 : cmp(x, b.v) < 0);
}

/** "x > 3", "x <= -2", "3 < x", "-2 < x ≤ 3" -> spec, or null. Never throws. */
export function parseRule(text) {
  const src = String(text ?? "")
    .replace(/[−–—]/g, "-")
    .replace(/>=|=>/g, "≥")
    .replace(/<=|=</g, "≤")
    .replace(/\s+/g, "");
  const closedOf = (c) => c === "≥" || c === "≤";
  const up = (c) => c === ">" || c === "≥";
  let m = src.match(/^x([<>≤≥])(.+)$/i);
  if (m) {
    const v = toFrac(m[2]);
    return v ? { dir: up(m[1]) ? "right" : "left", ends: [{ v, closed: closedOf(m[1]) }] } : null;
  }
  m = src.match(/^(.+?)([<>≤≥])x$/i);
  if (m) {
    const v = toFrac(m[1]);
    return v ? { dir: up(m[2]) ? "left" : "right", ends: [{ v, closed: closedOf(m[2]) }] } : null;
  }
  m = src.match(/^(.+?)([<>≤≥])x([<>≤≥])(.+)$/i);
  if (!m || up(m[2]) !== up(m[3])) return null;
  let ends = [
    { v: toFrac(m[1]), closed: closedOf(m[2]) },
    { v: toFrac(m[4]), closed: closedOf(m[3]) },
  ];
  if (!ends[0].v || !ends[1].v) return null;
  if (up(m[2])) ends = ends.reverse();
  return cmp(ends[0].v, ends[1].v) < 0 ? { dir: "between", ends } : null;
}

function specOf(raw) {
  if (typeof raw === "string") return parseRule(raw);
  if (raw?.rule) return parseRule(raw.rule);
  if (raw?.dir === "between" && Array.isArray(raw.ends)) {
    const ends = raw.ends.map((e) => ({ v: toFrac(e.v), closed: e.closed === true }));
    return ends.every((e) => e.v) && cmp(ends[0].v, ends[1].v) < 0 ? { dir: "between", ends } : null;
  }
  const v = toFrac(raw?.v);
  return v && (raw.dir === "right" || raw.dir === "left") ? { dir: raw.dir, ends: [{ v, closed: raw.closed === true }] } : null;
}

// ── State ────────────────────────────────────────────────────────────────────

const inRange = (r, range) => isRat(r) && cmp(abs(r), frac(range)) <= 0;

function validateState(st) {
  if (!st || !MODES.includes(st.mode) || typeof st.fine !== "boolean") return false;
  if (!Number.isInteger(st.range) || st.range < 2 || st.range > 50) return false;
  if (st.mode === "opposites") return inRange(st.v, st.range);
  if (st.mode === "order") {
    const n = st.values?.length;
    if (!Array.isArray(st.values) || n < 2 || n > 6 || !st.values.every((v) => inRange(v, st.range))) return false;
    if (st.values.some((v, i) => st.values.findIndex((u) => eq(u, v)) !== i)) return false;
    return Array.isArray(st.order) && st.order.length === n && [...st.order].sort().every((k, i) => k === i);
  }
  if (!DIRS.includes(st.dir) || !Array.isArray(st.ends) || st.ends.length !== (st.dir === "between" ? 2 : 1)) return false;
  if (!st.ends.every((e) => inRange(e.v, st.range) && typeof e.closed === "boolean")) return false;
  if (st.dir === "between" && cmp(st.ends[0].v, st.ends[1].v) >= 0) return false;
  return st.test === null || inRange(st.test, st.range);
}

function reduce(st, patch) {
  if (!patch || typeof patch !== "object" || Object.keys(patch).some((k) => !ACTIONS.includes(k))) return null;
  const only = { inequality: ["boundary", "boundary2", "closed", "closed2", "dir", "test", "rule"], opposites: ["value"], order: ["swap"] };
  if (Object.keys(patch).some((k) => k !== "fine" && !only[st.mode].includes(k))) return null;
  const next = { ...st, ends: st.ends?.map((e) => ({ ...e })), order: st.order && [...st.order] };
  const R = (v) => {
    const r = toFrac(v);
    return r && inRange(r, st.range) ? r : null;
  };
  if ("fine" in patch) next.fine = patch.fine === true;
  if ("value" in patch) {
    next.v = R(patch.value);
    if (!next.v) return null;
  }
  if ("swap" in patch) {
    const i = patch.swap;
    if (!Number.isInteger(i) || i < 0 || i >= next.order.length - 1) return null;
    [next.order[i], next.order[i + 1]] = [next.order[i + 1], next.order[i]];
  }
  if (st.mode !== "inequality") return next;
  if ("rule" in patch) {
    const sp = parseRule(patch.rule);
    if (!sp || !sp.ends.every((e) => inRange(e.v, st.range))) return null;
    next.dir = sp.dir;
    next.ends = sp.ends;
  }
  if ("dir" in patch) {
    if (!DIRS.includes(patch.dir)) return null;
    next.dir = patch.dir;
    if (patch.dir !== "between") next.ends = next.ends.slice(0, 1);
    else if (next.ends.length < 2) {
      const top = frac(st.range);
      let lo = next.ends[0].v;
      const hi = cmp(add(lo, frac(2)), top) > 0 ? top : add(lo, frac(2));
      if (cmp(hi, lo) <= 0) lo = sub(hi, frac(1));
      next.ends = [{ v: lo, closed: next.ends[0].closed }, { v: hi, closed: false }];
    }
  }
  for (const [key, i] of [["boundary", 0], ["boundary2", 1]]) {
    if (!(key in patch)) continue;
    const v = R(patch[key]);
    if (!v || !next.ends[i]) return null;
    next.ends[i].v = v;
  }
  for (const [key, i] of [["closed", 0], ["closed2", 1]]) {
    if (!(key in patch)) continue;
    if (!next.ends[i]) return null;
    next.ends[i].closed = patch[key] === true;
  }
  if ("test" in patch) {
    next.test = patch.test === null ? null : R(patch.test);
    if (patch.test !== null && !next.test) return null;
  }
  if (next.dir === "between" && cmp(next.ends[0].v, next.ends[1].v) >= 0) return null;
  return next;
}

function derive(st) {
  if (st.mode === "opposites") return { ...st, opposite: neg(st.v), abs: abs(st.v) };
  if (st.mode === "order") {
    const arranged = st.order.map((i) => st.values[i]);
    const sorted = [...st.values].sort(cmp);
    return { ...st, arranged, sorted, inOrder: arranged.every((v, i) => eq(v, sorted[i])) };
  }
  return { ...st, rule: ruleText(st), included: st.test ? contains(st, st.test) : null };
}

function normalize(config) {
  const c = config || {};
  const mode = c.mode ?? "inequality";
  if (!MODES.includes(mode)) throw new TypeError("numberline: mode must be inequality, opposites or order");
  const need = (v, name) => {
    const r = toFrac(v);
    if (!r) throw new TypeError(`numberline: ${name} must be a number`);
    return r;
  };
  const state = { mode, range: c.range ?? 10, fine: c.fine === true };
  if (mode === "opposites") state.v = need(c.value ?? -4, "value");
  else if (mode === "order") {
    state.values = (c.values ?? [3, -5, -2]).map((v) => need(v, "values"));
    state.order = state.values.map((_, i) => i);
  } else {
    let spec = c.rule ? parseRule(c.rule) : null;
    if (c.rule && !spec) throw new TypeError("numberline: rule must look like x > 3");
    if (!spec) {
      const dir = c.dir ?? (c.boundary2 != null ? "between" : "right");
      const ends = [{ v: need(c.boundary ?? 3, "boundary"), closed: c.closed === true }];
      if (dir === "between") ends.push({ v: need(c.boundary2 ?? 6, "boundary2"), closed: c.closed2 === true });
      spec = { dir, ends };
    }
    Object.assign(state, spec, { test: c.test == null ? null : need(c.test, "test") });
  }
  if (!validateState(state)) throw new TypeError("numberline: invalid configuration");
  return { state, task: c.task || null };
}

// ── Words ────────────────────────────────────────────────────────────────────

const list = (arr) => arr.map(num).join(", ");

function explainParts(st, lang) {
  const d = derive(st);
  if (st.mode === "opposites") {
    const [v, o, a] = [num(st.v), num(d.opposite), num(d.abs)];
    return [
      t(lang, { en: `The opposite of ${v} is ${o}. Both are ${a} units from 0, so |${v}| = ${a}.`, es: `El opuesto de ${v} es ${o}. Los dos están a ${a} unidades del 0, así que |${v}| = ${a}.` }),
    ];
  }
  if (st.mode === "order") {
    const hasNeg = st.values.some((v) => sign(v) < 0);
    const note = hasNeg
      ? t(lang, { en: " A number farther left on the number line is less, so −5 < −2 even though 5 > 2.", es: " Un número más a la izquierda en la recta es menor, así que −5 < −2 aunque 5 > 2." })
      : "";
    return [
      t(lang, { en: `On the number line, numbers get greater as you move right.${note}`, es: `En la recta numérica, los números aumentan hacia la derecha.${note}` }),
      t(lang, { en: `From least to greatest: ${list(d.sorted)}.`, es: `De menor a mayor: ${list(d.sorted)}.` }),
    ];
  }
  const [lo] = st.ends;
  const b = num(lo.v);
  const out = [];
  if (st.dir === "between") {
    const hi = num(st.ends[1].v);
    out.push(
      t(lang, {
        en: `${d.rule} means every number between ${b} and ${hi}. ${lo.closed ? `${b} is included` : `${b} is not included`}, and ${st.ends[1].closed ? `${hi} is included` : `${hi} is not included`}.`,
        es: `${d.rule} significa todos los números entre ${b} y ${hi}. ${lo.closed ? `El ${b} está incluido` : `El ${b} no está incluido`}, y ${st.ends[1].closed ? `el ${hi} está incluido` : `el ${hi} no está incluido`}.`,
      }),
    );
  } else {
    const right = st.dir === "right";
    out.push(
      t(lang, {
        en: `${d.rule} means every number ${right ? "greater than" : "less than"}${lo.closed ? " or equal to" : ""} ${b}. The ${lo.closed ? "closed" : "open"} circle at ${b} means ${b} ${lo.closed ? "is" : "is not"} included. The shading goes ${right ? "right, toward greater numbers" : "left, toward lesser numbers"}.`,
        es: `${d.rule} significa todos los números ${right ? "mayores que" : "menores que"}${lo.closed ? " o iguales a" : ""} ${b}. El círculo ${lo.closed ? "lleno" : "vacío"} en ${b} significa que el ${b} ${lo.closed ? "sí" : "no"} está incluido. El sombreado va hacia la ${right ? "derecha, hacia los números mayores" : "izquierda, hacia los números menores"}.`,
      }),
    );
  }
  if (st.test) {
    const x = num(st.test);
    out.push(
      t(lang, {
        en: `Testing x = ${x}: ${d.included ? `${x} is a solution, because it is in the shaded part` : `${x} is not a solution, because it is not in the shaded part`}.`,
        es: `Probando x = ${x}: ${d.included ? `${x} sí es solución, porque está en la parte sombreada` : `${x} no es solución, porque no está en la parte sombreada`}.`,
      }),
    );
  }
  return out;
}

const explanation = (st, lang) => explainParts(st, lang).join(" ");

function accessibleDescription(st, lang) {
  const d = derive(st);
  if (st.mode === "opposites") {
    return t(lang, {
      en: `Number line from ${num(neg(frac(st.range)))} to ${st.range}. The number is ${num(st.v)}, its opposite is ${num(d.opposite)}, and the absolute value is ${num(d.abs)}.`,
      es: `Recta numérica de ${num(neg(frac(st.range)))} a ${st.range}. El número es ${num(st.v)}, su opuesto es ${num(d.opposite)} y el valor absoluto es ${num(d.abs)}.`,
    });
  }
  if (st.mode === "order") {
    return t(lang, {
      en: `Number line with ${st.values.length} numbers: ${list(st.values)}. Your order so far is ${list(d.arranged)}.`,
      es: `Recta numérica con ${st.values.length} números: ${list(st.values)}. Tu orden hasta ahora es ${list(d.arranged)}.`,
    });
  }
  const circle = (e) => t(lang, { en: `${e.closed ? "closed" : "open"} circle at ${num(e.v)}`, es: `círculo ${e.closed ? "lleno" : "vacío"} en ${num(e.v)}` });
  const where = st.ends.map(circle).join(t(lang, { en: " and ", es: " y " }));
  const shade = { right: t(lang, { en: "shaded to the right", es: "sombreado a la derecha" }), left: t(lang, { en: "shaded to the left", es: "sombreado a la izquierda" }), between: t(lang, { en: "shaded between them", es: "sombreado entre los dos" }) }[st.dir];
  return t(lang, {
    en: `Number line from ${num(neg(frac(st.range)))} to ${st.range}. The rule is ${d.rule}: ${where}, ${shade}.`,
    es: `Recta numérica de ${num(neg(frac(st.range)))} a ${st.range}. La regla es ${d.rule}: ${where}, ${shade}.`,
  });
}

// ── validate(task) ───────────────────────────────────────────────────────────

const sameEnds = (p, q) => p.ends.length === q.ends.length && p.ends.every((e, i) => eq(e.v, q.ends[i].v));
const flipDir = { right: "left", left: "right" };

/** "ok" when the graphs match, a misconception id, or null for a wrong answer with no known pattern. */
function classify(want, got) {
  if (want.dir === got.dir && sameEnds(want, got)) {
    return want.ends.every((e, i) => e.closed === got.ends[i].closed) ? "ok" : "boundary-inclusion";
  }
  if (flipDir[want.dir] === got.dir && sameEnds(want, got) && want.ends[0].closed === got.ends[0].closed) return "direction-reversed";
  return null;
}

const truth = (a) => (a === true || /^(yes|true|sí|si)$/i.test(String(a)) ? true : a === false || /^(no|false)$/i.test(String(a)) ? false : null);
const bothNeg = (a, b) => sign(a) < 0 && sign(b) < 0;
const sorted = (arr) => [...arr].sort(cmp);

function validateTask(st, task) {
  const none = (reason, ok = false) => ({ ok, reason, misconception: null });
  const wrong = (m) => ({ ok: false, reason: "incorrect", misconception: m && { id: m, confidence: "possible" } });
  if (!task) return none("no-task");
  if (task.kind === "graph" || task.kind === "read") {
    const want = specOf(task.kind === "graph" ? task.rule : task.graph);
    const got = task.answer !== undefined ? specOf(task.answer) : st.mode === "inequality" ? { dir: st.dir, ends: st.ends } : null;
    if (!want) return none("invalid-task");
    if (!got) return none("invalid-answer");
    const r = classify(want, got);
    return r === "ok" ? none("correct", true) : wrong(r);
  }
  if (task.kind === "test") {
    const spec = task.graph ? specOf(task.graph) : st.mode === "inequality" ? { dir: st.dir, ends: st.ends } : null;
    const x = toFrac(task.x ?? st.test);
    const given = truth(task.answer);
    if (!spec || !x) return none("invalid-task");
    if (given === null) return none("invalid-answer");
    if (given === contains(spec, x)) return none("correct", true);
    if (spec.ends.some((e) => eq(e.v, x))) return wrong("boundary-inclusion");
    if (spec.dir === "between") return wrong(null);
    const e = spec.ends[0];
    const byMagnitude = { right: cmp(abs(x), abs(e.v)) > 0, left: cmp(abs(x), abs(e.v)) < 0 }[spec.dir];
    return wrong(bothNeg(x, e.v) && byMagnitude === given ? "sign-order" : "direction-reversed");
  }
  if (task.kind === "opposite" || task.kind === "absolute") {
    const v = toFrac(task.value ?? st.v);
    const given = toFrac(task.answer);
    if (!v) return none("invalid-task");
    if (!given) return none("invalid-answer");
    return eq(given, task.kind === "opposite" ? neg(v) : abs(v)) ? none("correct", true) : wrong(null);
  }
  if (task.kind === "order") {
    const raw = task.answer ?? (st.mode === "order" ? st.order.map((i) => st.values[i]) : null);
    const given = Array.isArray(raw) ? raw.map(toFrac) : null;
    const base = task.values ?? st.values;
    const values = Array.isArray(base) ? base.map(toFrac) : null;
    if (!values || values.some((v) => !v)) return none("invalid-task");
    if (!given || given.some((v) => !v) || given.length !== values.length) return none("invalid-answer");
    const want = sorted(values);
    if (given.every((v, i) => eq(v, want[i]))) return none("correct", true);
    // Treating -5 as greater than -2: negatives come out in reverse, or the order follows |n|.
    const negs = want.filter((v) => sign(v) < 0);
    const reversedNegs = [...negs.reverse(), ...want.filter((v) => sign(v) >= 0)];
    const byAbs = [...values].sort((p, q) => cmp(abs(p), abs(q)));
    const matches = (arr) => arr.length === given.length && arr.every((v, i) => eq(v, given[i]));
    return wrong(negs.length > 1 && matches(reversedNegs) ? "sign-order" : values.some((v) => sign(v) < 0) && matches(byAbs) ? "sign-order" : null);
  }
  if (task.kind === "compare") {
    const a = toFrac(task.a);
    const b = toFrac(task.b);
    if (!a || !b || !["<", ">", "="].includes(task.answer)) return none("invalid-task");
    const want = cmp(a, b) < 0 ? "<" : cmp(a, b) > 0 ? ">" : "=";
    if (task.answer === want) return none("correct", true);
    const byAbs = cmp(abs(a), abs(b)) < 0 ? "<" : cmp(abs(a), abs(b)) > 0 ? ">" : "=";
    return wrong(bothNeg(a, b) && task.answer === byAbs ? "sign-order" : null);
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
  track: (patch) => !Object.keys(patch).every((k) => ["fine", "test"].includes(k)),
  describeConfig: (st) =>
    st.mode === "opposites"
      ? { mode: st.mode, value: num(st.v), range: st.range }
      : st.mode === "order"
        ? { mode: st.mode, values: st.values.map(num), range: st.range }
        : { mode: st.mode, rule: ruleText(st), range: st.range },
});

// ── Rendering ────────────────────────────────────────────────────────────────

const STR = {
  right: { en: "Shade right (greater)", es: "Sombrear a la derecha (mayores)" },
  left: { en: "Shade left (less)", es: "Sombrear a la izquierda (menores)" },
  between: { en: "Between two numbers", es: "Entre dos números" },
  dir: { en: "Shading", es: "Sombreado" },
  include: { en: "Include the boundary", es: "Incluir el límite" },
  include2: { en: "Include the upper boundary", es: "Incluir el límite superior" },
  boundary: { en: "Boundary. Use the arrow keys, or drag.", es: "Límite. Usa las flechas, o arrastra." },
  boundary2: { en: "Upper boundary. Use the arrow keys, or drag.", es: "Límite superior. Usa las flechas, o arrastra." },
  point: { en: "Number. Use the arrow keys, or drag.", es: "Número. Usa las flechas, o arrastra." },
  rule: { en: "Rule", es: "Regla" },
  test: { en: "Test a number", es: "Prueba un número" },
  solution: { en: "Is it a solution?", es: "¿Es una solución?" },
  yes: { en: "Yes ✓", es: "Sí ✓" },
  no: { en: "No ✗", es: "No ✗" },
  half: { en: "Half steps", es: "Medios pasos" },
  number: { en: "Number", es: "Número" },
  opposite: { en: "Opposite", es: "Opuesto" },
  absolute: { en: "Absolute value", es: "Valor absoluto" },
  order: { en: "Your order, least to greatest", es: "Tu orden, de menor a mayor" },
  earlier: { en: "Move earlier", es: "Mover antes" },
  later: { en: "Move later", es: "Mover después" },
  undo: { en: "Undo", es: "Deshacer" },
  reset: { en: "Start over", es: "Empezar de nuevo" },
  line: { en: "Number line", es: "Recta numérica" },
  invalid: { en: "Type a number like 3, −1.5 or 3/2.", es: "Escribe un número como 3, −1.5 o 3/2." },
  invalidRule: { en: "Type a rule like x > 3 or −2 < x ≤ 3.", es: "Escribe una regla como x > 3 o −2 < x ≤ 3." },
};
const W = 360;
const LX = { x0: 24, x1: 336, y: 74 };
let uid = 0;

export function mount(root, model, { lang = "en", onChange, readonly = false } = {}) {
  const id0 = `fmn${++uid}`;
  let bag;
  let L = lang;
  let ui = {};
  const state = () => model.getState();
  const T = (k) => t(L, STR[k]);
  const stepNum = () => (state().fine ? 0.5 : 1);
  const X = (n, r) => LX.x0 + ((LX.x1 - LX.x0) * (n + r)) / (2 * r);
  const snap = (v) => Math.round(v / stepNum()) * stepNum();

  const knob = () => s("g", { class: "fm-handle" }, s("circle", { class: "fm-hit", r: 40 }), s("circle", { class: "fm-ring", r: 17 }), s("circle", { class: "fm-end", r: 9 }));

  function slider(node, { key, get, min, max, label }) {
    return makeDraggable(node, {
      get: () => toNumber(get()),
      set: (v) => model.setState({ [key]: snap(v) }),
      min,
      max,
      step: stepNum,
      bigStep: 5,
      label,
      valueText: () => num(get()),
      toValue: ({ x, node: n }) => {
        const r = state().range;
        return ((toSvgX(n, x, W).x - LX.x0) / (LX.x1 - LX.x0)) * 2 * r - r;
      },
    });
  }

  function commit(f, patch) {
    const ok = model.setState(patch);
    f.invalid(!ok);
    ui.msg.textContent = ok ? "" : T(patch.rule !== undefined ? "invalidRule" : "invalid");
  }

  function build(v) {
    bag = v.bag;
    L = v.lang;
    ui = {};
    const st = state();
    ui.prompt = model.task?.prompt ? h("p", { class: "fm-prompt" }, t(L, model.task.prompt)) : null;
    ui.explain = h("p", { class: "fm-explain" });
    ui.desc = h("p", { class: "fm-sr" });
    ui.msg = h("p", { class: "fm-msg", role: "status" });
    ui.svg = s("svg", { class: "fm-svg", viewBox: `0 0 ${W} 126`, role: "group", "aria-label": T("line") });
    ui.body = s("g");
    ui.svg.append(ui.body);
    ui.h0 = readonly || st.mode === "order" ? null : knob();
    ui.h1 = readonly || st.mode !== "inequality" ? null : knob();
    for (const n of [ui.h0, ui.h1]) if (n) ui.svg.append(n);
    const fine = readonly ? null : button(bag, T("half"), { pressed: st.fine, onClick: () => model.setState({ fine: !state().fine }) });
    ui.fine = fine;
    const fields = [];
    const rows = [];
    if (st.mode === "inequality") {
      ui.rule = field(bag, { id: `${id0}-rule`, label: T("rule"), readonly, onCommit: (val) => commit(ui.rule, { rule: val }) });
      ui.test = field(bag, { id: `${id0}-test`, label: T("test"), readonly, onCommit: (val) => commit(ui.test, { test: val.trim() === "" ? null : val }) });
      ui.answer = field(bag, { id: `${id0}-ans`, label: T("solution"), readonly: true });
      fields.push(ui.rule.el, ui.test.el, ui.answer.el);
      if (!readonly) {
        ui.dirBtns = DIRS.map((dir) => button(bag, T(dir), { pressed: st.dir === dir, onClick: () => model.setState({ dir }) }));
        ui.c0 = button(bag, T("include"), { pressed: st.ends[0].closed, onClick: () => model.setState({ closed: !state().ends[0].closed }) });
        ui.c1 = button(bag, T("include2"), { pressed: false, onClick: () => model.setState({ closed2: !state().ends[1]?.closed }) });
        rows.push(h("div", { class: "fm-row", role: "group", "aria-label": T("dir") }, ...ui.dirBtns), h("div", { class: "fm-row" }, ui.c0, ui.c1, fine));
      }
    } else if (st.mode === "opposites") {
      ui.num = field(bag, { id: `${id0}-num`, label: T("number"), readonly, onCommit: (val) => commit(ui.num, { value: val }) });
      ui.opp = field(bag, { id: `${id0}-opp`, label: T("opposite"), readonly: true });
      ui.abs = field(bag, { id: `${id0}-abs`, label: T("absolute"), readonly: true });
      fields.push(ui.num.el, ui.opp.el, ui.abs.el);
      if (fine) rows.push(h("div", { class: "fm-row" }, fine));
    } else {
      ui.order = h("ol", { class: "fm-order", "aria-label": T("order") });
      rows.push(ui.order);
    }
    if (!readonly) rows.push(h("div", { class: "fm-row" }, button(bag, T("undo"), { onClick: () => model.undo() }), button(bag, T("reset"), { onClick: () => model.reset() })));
    put(root, ui.prompt, h("section", { class: "fm-view", "aria-label": T("line") }, ui.svg), h("div", { class: "fm-fields" }, ...fields), ...rows, ui.msg, ui.explain, ui.desc);
    const hs = [];
    if (ui.h0 && st.mode === "inequality") {
      const lo = () => state().ends[0];
      const hi = () => state().ends[1];
      hs.push(slider(ui.h0, { key: "boundary", get: () => lo().v, min: () => -state().range, max: () => (hi() ? toNumber(hi().v) - stepNum() : state().range), label: T("boundary") }));
      if (ui.h1) hs.push(slider(ui.h1, { key: "boundary2", get: () => hi()?.v ?? lo().v, min: () => toNumber(lo().v) + stepNum(), max: () => state().range, label: T("boundary2") }));
    } else if (ui.h0) {
      hs.push(slider(ui.h0, { key: "value", get: () => state().v, min: () => -state().range, max: () => state().range, label: T("point") }));
    }
    v.handles.push(...hs);
  }

  function axis(g, d) {
    const r = d.range;
    const skip = Math.ceil((2 * r + 1) / 11);
    g.append(s("line", { class: "fm-axis", x1: LX.x0 - 8, x2: LX.x1 + 8, y1: LX.y, y2: LX.y }));
    for (let k = -r; k <= r; k++) {
      const long = k === 0 ? 10 : 6;
      g.append(s("line", { class: "fm-tick", x1: X(k, r), x2: X(k, r), y1: LX.y - long, y2: LX.y + long }));
      if (k % skip === 0 || k === -r || k === r) g.append(stext(X(k, r), LX.y + 30, num(frac(k)), "fm-svg-text", "middle"));
    }
  }

  function arc(a, b, up) {
    const r = Math.abs(b - a) / 2;
    return s("path", { class: "fm-arc", d: `M${a} ${LX.y} A${r} ${r} 0 0 ${b > a === up ? 1 : 0} ${b} ${LX.y}` });
  }

  function drawIneq(d) {
    const g = ui.body;
    axis(g, d);
    const r = d.range;
    const [a, b] = d.ends;
    const xa = X(toNumber(a.v), r);
    const xb = b ? X(toNumber(b.v), r) : null;
    const [from, to] = d.dir === "right" ? [xa, LX.x1 + 8] : d.dir === "left" ? [LX.x0 - 8, xa] : [xa, xb];
    g.append(s("line", { class: "fm-shade", x1: from, x2: to, y1: LX.y, y2: LX.y }));
    if (d.dir !== "between") {
      const tip = d.dir === "right" ? LX.x1 + 14 : LX.x0 - 14;
      const back = d.dir === "right" ? -9 : 9;
      g.append(s("path", { class: "fm-arrowhead", d: `M${tip} ${LX.y} l${back} -8 l0 16 z` }));
    }
    for (const [e, x, hd] of [[a, xa, ui.h0], [b, xb, ui.h1]]) if (e && !hd) g.append(s("circle", { class: `fm-end fm-end-${e.closed ? "closed" : "open"}`, cx: x, cy: LX.y, r: 9 }));
    if (d.test) {
      const x = X(clamp(toNumber(d.test), -r, r), r);
      g.append(s("path", { class: d.included ? "fm-probe fm-probe-in" : "fm-probe", d: `M${x} ${LX.y - 14} l-8 -14 l16 0 z` }), stext(x, LX.y - 36, `${num(d.test)} ${d.included ? "✓" : "✗"}`, "fm-svg-text fm-svg-strong", "middle"));
    }
    const place = (node, e, x) => {
      if (!node) return;
      node.setAttribute("transform", `translate(${x} ${LX.y})`);
      node.querySelector(".fm-end").setAttribute("class", `fm-end fm-end-${e.closed ? "closed" : "open"}`);
    };
    place(ui.h0, a, xa);
    if (b) place(ui.h1, b, xb);
    ui.h1?.toggleAttribute("hidden", !b);
  }

  function drawOpp(d) {
    const g = ui.body;
    axis(g, d);
    const r = d.range;
    const [x0, xv, xo] = [X(0, r), X(toNumber(d.v), r), X(toNumber(d.opposite), r)];
    if (sign(d.v) !== 0) {
      g.append(arc(x0, xv, true), arc(x0, xo, false), stext(xv, LX.y - Math.abs(xv - x0) / 2 - 12, num(d.abs), "fm-svg-text", "middle"), stext(xo, LX.y + Math.abs(xo - x0) / 2 + 38, num(d.abs), "fm-svg-text", "middle"));
    }
    g.append(s("circle", { class: "fm-dot fm-dot-row", cx: xo, cy: LX.y, r: 8 }), s("circle", { class: "fm-end fm-end-closed", cx: xv, cy: LX.y, r: 9 }));
    ui.h0?.setAttribute("transform", `translate(${xv} ${LX.y})`);
  }

  function drawOrder(d) {
    const g = ui.body;
    axis(g, d);
    const rank = (i) => d.order.indexOf(i) + 1;
    const lane = new Map(d.sorted.map((v, k) => [num(v), k]));
    d.values.forEach((v, i) => {
      const x = X(toNumber(v), d.range);
      const y = 22 + (lane.get(num(v)) % 2) * 26;
      g.append(s("line", { class: "fm-connector", x1: x, x2: x, y1: y + 6, y2: LX.y }), stext(x, y, num(v), "fm-svg-text fm-svg-strong", "middle"), s("circle", { class: "fm-end fm-end-closed", cx: x, cy: LX.y, r: 11 }), stext(x, LX.y + 5, String(rank(i)), "fm-svg-text fm-on-dot", "middle"));
    });
    clear(ui.order);
    d.order.forEach((k, pos) => {
      const li = h("li", { class: "fm-order-item" }, h("span", { class: "fm-num" }, num(d.values[k])));
      if (!readonly) {
        li.append(
          button(bag, "←", { cls: "fm-step", ariaLabel: `${T("earlier")}: ${num(d.values[k])}`, disabled: pos === 0, onClick: () => model.setState({ swap: pos - 1 }) }),
          button(bag, "→", { cls: "fm-step", ariaLabel: `${T("later")}: ${num(d.values[k])}`, disabled: pos === d.order.length - 1, onClick: () => model.setState({ swap: pos }) }),
        );
      }
      ui.order.append(li);
    });
  }

  function sync(v) {
    const d = state();
    clear(ui.body);
    if (d.mode === "inequality") {
      drawIneq(d);
      ui.rule.set(d.rule);
      ui.test.set(d.test ? num(d.test) : "");
      ui.answer.set(d.included === null ? "–" : T(d.included ? "yes" : "no"));
      if (ui.dirBtns) {
        DIRS.forEach((dir, i) => ui.dirBtns[i].setAttribute("aria-pressed", String(d.dir === dir)));
        ui.c0.setAttribute("aria-pressed", String(d.ends[0].closed));
        ui.c1.setAttribute("aria-pressed", String(!!d.ends[1]?.closed));
        ui.c1.hidden = d.dir !== "between";
      }
    } else if (d.mode === "opposites") {
      drawOpp(d);
      ui.num.set(num(d.v));
      ui.opp.set(num(d.opposite));
      ui.abs.set(num(d.abs));
    } else drawOrder(d);
    ui.fine?.setAttribute("aria-pressed", String(d.fine));
    const parts = explainParts(d, L);
    ui.explain.textContent = d.mode === "order" && !d.inOrder ? parts[0] : parts.join(" ");
    ui.desc.textContent = model.getAccessibleDescription(L);
    for (const hd of v.handles) hd.refresh();
  }

  return createView(root, model, {
    lang,
    onChange,
    cls: "fm-numberline",
    build,
    sync,
    say: (st) => (st.mode === "opposites" ? `${num(st.v)}, ${num(st.opposite)}` : st.mode === "order" ? list(st.arranged) : st.rule),
  });
}
