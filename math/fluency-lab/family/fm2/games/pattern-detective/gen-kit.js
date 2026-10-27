// Shared pieces for the Pattern Detective round generators: names of the quantities, probe allowances, the
// round skeleton and a few number helpers. Every round is plain JSON built from (skillId, level, rng, grade).
// @fm2 FM-061 FM-065 FM-026
import { frac } from "../../rational.js";
import { int } from "../../rng.js";

export const PROBES = { 1: 4, 2: 4, 3: 3 };
export const PROBES_TWO = { 1: 6, 2: 6, 3: 5 };
export const SYMBOLS = ["circle", "square", "triangle", "star"];

export const NAMES = {
  machine: { in: { en: "Input", es: "Entrada" }, out: { en: "Output", es: "Salida" } },
  term: { in: { en: "Term number", es: "Número de término" }, out: { en: "Term", es: "Término" } },
  figure: {
    in: { en: "Figure number", es: "Número de figura" },
    out: { en: "Tiles", es: "Fichas" },
  },
  row: { in: { en: "Row", es: "Fila" }, out: { en: "Table value", es: "Valor de la tabla" } },
  chart: {
    in: { en: "Term number", es: "Número de término" },
    out: { en: "Number on the chart", es: "Número en el tablero" },
  },
  step: { in: { en: "Step", es: "Paso" }, out: { en: "Output", es: "Salida" } },
};

// Context pairs for grade 6 machines: the input quantity and the output quantity that depends on it.
export const CONTEXTS = [
  { in: { en: "hours", es: "horas" }, out: { en: "dollars", es: "dólares" } },
  { in: { en: "boxes", es: "cajas" }, out: { en: "pencils", es: "lápices" } },
  { in: { en: "minutes", es: "minutos" }, out: { en: "pages", es: "páginas" } },
  { in: { en: "packs", es: "paquetes" }, out: { en: "stickers", es: "calcomanías" } },
  { in: { en: "weeks", es: "semanas" }, out: { en: "dollars saved", es: "dólares ahorrados" } },
  { in: { en: "laps", es: "vueltas" }, out: { en: "meters", es: "metros" } },
];

export const pair = (value) =>
  Array.isArray(value) ? [frac(value[0], value[1]).n, frac(value[0], value[1]).d] : [value, 1];
export const lin = (a, b = 0) => ({ t: "lin", a: pair(a), b: pair(b) });
export const geo = (c, r, x0) => ({ t: "geo", c: pair(c), r: pair(r), x0 });
export const sq = (a, b = 0) => ({ t: "sq", a: pair(a), b: pair(b) });
export const skip = (start, step) => lin(step, start - step);
export const R = (rng, lo, hi) => int(rng, lo, hi);

export function domainValues(dom) {
  const out = [];
  const first = Math.ceil(dom.lo / dom.mult) * dom.mult;
  for (let x = first; x <= dom.hi; x += dom.mult) out.push(x);
  return out;
}

// The "well-chosen" probes the solver and the identifiability proof use: the first distinct inputs that are not free clues.
export function defaultPlan(dom, seed, count, machines = 1) {
  const free = new Set(seed.map((row) => `${row.m}:${row.x}`));
  const plan = [];
  for (const x of domainValues(dom)) {
    for (let m = 0; m < machines; m += 1) {
      if (!free.has(`${m}:${x}`) && plan.length < count * machines) plan.push({ m, x });
    }
    if (plan.length >= count * machines) break;
  }
  return plan;
}

export function makeBase(skillId, level, grade, o) {
  const machines = o.machines;
  const dom = o.dom;
  const seed = o.seed || [];
  const probes = o.probes ?? PROBES[level];
  return {
    v: 1,
    skillId,
    level,
    grade,
    form: o.form,
    show: o.show || "machine",
    vars: o.vars || "n",
    showVars: Boolean(o.showVars),
    x0: o.x0 ?? 0,
    machines,
    dom,
    probes,
    seed,
    far: o.far,
    farM: o.farM || 0,
    plan:
      o.plan ||
      defaultPlan(dom, seed, Math.min(3, probes), machines.length > 1 ? machines.length : 1),
    say: o.say || {},
    ops: o.ops || null,
    cls: o.cls || null,
    names: o.names || NAMES.machine,
    fig: o.fig || null,
    alpha: o.alpha || null,
    ctx: o.ctx || null,
  };
}

// A far input just past the probe range, kept small enough that the answer stays under `cap`.
export function fitFar(rng, lo, hi, valueAt, cap) {
  let far = int(rng, lo, hi);
  while (far > lo && valueAt(far) > cap) far -= 1;
  return far;
}
