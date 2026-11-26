// nexus/resource.mjs — the Living Resource: ONE authoritative instructional
// object from which every version (interactive mission, worksheet, answer key,
// Word file, offline HTML, vocabulary cards) is derived. A resource stores only
// what a person decided — the kit, the model numbers, context, objective,
// vocabulary, language support, goal and any wording a teacher overrode. Every
// answer is DERIVED from the validated model (kits.mjs), never stored, so no
// version can carry a key that disagrees with its numbers. Pure; no DOM.

import { KITS, validModel } from "./kits.mjs";

export const SCHEMA = "nexus-resource/1";
export const GOALS = ["understand", "practice", "explain", "transfer"];
export const SUPPORT = ["off", "light", "full"];
export const MAX_SHARE = 7000; // characters of encoded resource in a link

const P = (en, es) => ({ en, es });
const str = (v, n) => (typeof v === "string" ? v.replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, n) : "");

/** {en, es} with both trimmed; Spanish may be empty (reported as a missing translation, never faked). */
export function pair(v, n = 300) {
  if (typeof v === "string") return { en: str(v, n), es: "" };
  if (!v || typeof v !== "object") return { en: "", es: "" };
  return { en: str(v.en, n), es: str(v.es, n) };
}

/**
 * Flagship resources. Each model is the living-scene config authored in the
 * named lesson (kept identical by tools/nexus.test.mjs), so the curriculum
 * relationship is VERIFIED from source, not asserted.
 */
export const LIBRARY = [
  {
    id: "juice-bar",
    kit: "ratio-scale",
    title: P("Juice Bar Mix Lab", "Laboratorio de mezclas del bar de jugos"),
    objective: P("Scale a recipe so every batch tastes the same, and explain why multiplying keeps the mix.", "Escalar una receta para que cada tanda sepa igual y explicar por qué multiplicar mantiene la mezcla."),
    curriculum: { lesson: "3-3", source: "lessons/3-3/config.json · launch.conceptIntro.livingScene" },
    model: { a: 2, b: 3, k: 4, labelA: { en: "cups of mix", es: "tazas de mezcla" }, labelB: { en: "cups of milk", es: "tazas de leche" }, transfer: { a: 1, b: 4, k: 3, labelA: { en: "cups of juice", es: "tazas de jugo" }, labelB: { en: "cups of water", es: "tazas de agua" } } },
    vocab: [
      { term: P("ratio", "razón"), def: P("A comparison of two amounts.", "Una comparación de dos cantidades.") },
      { term: P("equivalent ratios", "razones equivalentes"), def: P("Ratios that describe the same mix.", "Razones que describen la misma mezcla.") },
      { term: P("unit rate", "tasa unitaria"), def: P("How much of one amount goes with 1 of the other.", "Cuánto de una cantidad va con 1 de la otra.") },
      { term: P("scale", "escalar"), def: P("Multiply both amounts by the same number.", "Multiplicar ambas cantidades por el mismo número.") },
    ],
    language: "compare",
  },
  {
    id: "discount-day",
    kit: "percent-whole",
    title: P("Discount Day Store", "Tienda del día de descuentos"),
    objective: P("Find a percent of a whole price and decide what a shopper really pays.", "Hallar un porcentaje de un precio total y decidir cuánto paga de verdad un comprador."),
    curriculum: { lesson: "4-4", source: "lessons/4-4/config.json · launch.conceptIntro.livingScene" },
    model: { percent: 25, whole: 60, unit: { en: "tickets", es: "boletos" }, item: { en: "Claw machine", es: "Máquina de garra" }, partName: { en: "the discount", es: "el descuento" } },
    vocab: [
      { term: P("percent", "porcentaje"), def: P("A number out of 100.", "Un número de cada 100.") },
      { term: P("whole", "total"), def: P("The full amount, 100%.", "La cantidad completa, el 100%.") },
      { term: P("discount", "descuento"), def: P("The amount taken off a price.", "La cantidad que se resta de un precio.") },
      { term: P("sale price", "precio de oferta"), def: P("What you pay after the discount.", "Lo que pagas después del descuento.") },
    ],
    language: "explain",
  },
  {
    id: "fair-share",
    kit: "mean-balance",
    title: P("Fair Share Dog-Walking Fund", "Fondo justo de paseo de perros"),
    objective: P("Use the mean as a fair share and predict how a new value changes it.", "Usar la media como reparto justo y predecir cómo la cambia un valor nuevo."),
    curriculum: { lesson: "2-8", source: "lessons/2-8/config.json · launch.conceptIntro.livingScene" },
    model: { values: [15, 25, 10, 10], unit: 5, prefix: "$", labels: [{ en: "Mon", es: "lun" }, { en: "Tue", es: "mar" }, { en: "Wed", es: "mié" }, { en: "Thu", es: "jue" }], story: { en: "Miguel walks dogs after school. His notebook shows what he earned on 4 days: Monday $15, Tuesday $25, Wednesday $10 and Thursday $10.", es: "Miguel pasea perros después de la escuela. Su cuaderno muestra lo que ganó en 4 días: lunes $15, martes $25, miércoles $10 y jueves $10." } },
    vocab: [
      { term: P("mean", "media"), def: P("The fair share when a total is split evenly.", "El reparto justo cuando un total se divide por igual.") },
      { term: P("median", "mediana"), def: P("The middle value when data is in order.", "El valor del medio cuando los datos están en orden.") },
      { term: P("data", "datos"), def: P("Information collected as numbers.", "Información reunida como números.") },
      { term: P("total", "total"), def: P("All the values added together.", "Todos los valores sumados.") },
    ],
    language: "justify",
  },
  {
    id: "patio-planner",
    kit: "parallelogram-area",
    title: P("Patio Planner", "Planificador de patios"),
    objective: P("Find the area of a parallelogram and use it to price materials.", "Hallar el área de un paralelogramo y usarla para calcular el costo de materiales."),
    curriculum: { lesson: "5-1", source: "lessons/5-1/config.json · launch.conceptIntro.livingScene" },
    model: { base: 14, height: 9, slant: 10, unit: { en: "ft", es: "ft" }, transfer: [{ base: 10, height: 7, slant: 8, unit: { en: "cm", es: "cm" } }, { base: 12, height: 5, slant: 6, unit: { en: "m", es: "m" } }, { base: 8, height: 6, slant: 7, unit: { en: "in", es: "pulg" } }] },
    env: { price: 4 },
    vocab: [
      { term: P("area", "área"), def: P("The number of square units inside a shape.", "La cantidad de unidades cuadradas dentro de una figura.") },
      { term: P("base", "base"), def: P("The side the height is measured from.", "El lado desde el que se mide la altura.") },
      { term: P("height", "altura"), def: P("The straight-up distance at a right angle to the base.", "La distancia recta en ángulo recto con la base.") },
      { term: P("parallelogram", "paralelogramo"), def: P("A four-sided shape with two pairs of parallel sides.", "Una figura de cuatro lados con dos pares de lados paralelos.") },
    ],
    language: "explain",
  },
  {
    id: "sea-level",
    kit: "integers-opposites",
    title: P("Above and Below Sea Level", "Sobre y bajo el nivel del mar"),
    objective: P("Use opposites and distance from zero to compare places above and below a zero point.", "Usar opuestos y la distancia al cero para comparar lugares sobre y bajo un punto cero."),
    curriculum: { lesson: "7-1", source: "lessons/7-1/config.json · launch.conceptIntro.livingScene" },
    model: { value: -86, unit: { en: "m", es: "m" }, zeroLabel: { en: "sea level", es: "el nivel del mar" }, place: { en: "Badwater Basin", es: "Cuenca Badwater" } },
    vocab: [
      { term: P("integer", "entero"), def: P("A whole number or its opposite, including zero.", "Un número natural o su opuesto, incluido el cero.") },
      { term: P("opposite", "opuesto"), def: P("The number the same distance from zero on the other side.", "El número a la misma distancia del cero del otro lado.") },
      { term: P("absolute value", "valor absoluto"), def: P("A number's distance from zero.", "La distancia de un número al cero.") },
      { term: P("negative", "negativo"), def: P("Less than zero.", "Menor que cero.") },
    ],
    language: "compare",
  },
];

const byId = Object.fromEntries(LIBRARY.map((r) => [r.id, r]));

/** A fresh editable resource from a library entry and a goal. */
export function fromLibrary(id, goal = "understand") {
  const base = byId[id];
  if (!base) return null;
  return normalize({ ...structuredClone(base), schema: SCHEMA, source: id, goal, support: "light", overrides: {}, notes: P("", ""), version: 1 });
}

/** Validate and clean anything (saved, shared, edited). Returns {resource, errors}. */
export function validate(raw) {
  const errors = [];
  if (!raw || typeof raw !== "object") return { resource: null, errors: ["Not a mission."] };
  const kit = KITS[raw.kit];
  if (!kit) return { resource: null, errors: ["Unknown topic."] };
  const v = validModel(raw.kit, raw.model, raw.env);
  if (!v) errors.push("Those numbers do not make a model the activity can draw truthfully. Try other numbers.");
  const lib = byId[raw.source];
  // A curriculum link is VERIFIED only when the model is still the lesson's own; edited numbers keep the
  // lesson as a reference but lose the verified badge.
  const sameModel = lib && JSON.stringify(lib.model) === JSON.stringify(raw.model);
  const resource = {
    schema: SCHEMA,
    id: str(raw.id, 40) || "mission",
    source: lib ? lib.id : "",
    kit: raw.kit,
    title: pair(raw.title, 80),
    objective: pair(raw.objective, 300),
    curriculum: lib ? { lesson: lib.curriculum.lesson, source: lib.curriculum.source, status: sameModel ? "verified" : "adapted" } : { status: "unverified" },
    model: raw.model && typeof raw.model === "object" ? raw.model : {},
    env: raw.env && typeof raw.env === "object" ? raw.env : {},
    vocab: (Array.isArray(raw.vocab) ? raw.vocab : []).slice(0, 12).map((x) => ({ term: pair(x?.term, 40), def: pair(x?.def, 160) })).filter((x) => x.term.en),
    language: ["compare", "explain", "justify"].includes(raw.language) ? raw.language : "explain",
    goal: GOALS.includes(raw.goal) ? raw.goal : "understand",
    support: SUPPORT.includes(raw.support) ? raw.support : "light",
    overrides: cleanOverrides(raw.overrides),
    notes: pair(raw.notes, 600),
    version: Number.isInteger(raw.version) && raw.version > 0 ? raw.version : 1,
    history: Array.isArray(raw.history) ? raw.history.slice(0, 15).filter((h) => Number.isInteger(h?.v) && h.snapshot && typeof h.snapshot === "object") : [],
  };
  if (!resource.title.en) errors.push("Give the mission a title.");
  if (!resource.objective.en) errors.push("Say what students should accomplish.");
  return { resource, errors };
}

export function normalize(raw) {
  return validate(raw).resource;
}

function cleanOverrides(o) {
  const out = {};
  if (!o || typeof o !== "object") return out;
  for (const [k, val] of Object.entries(o).slice(0, 20)) {
    if (!/^(q[1-3]|t1):stem$/.test(k)) continue;
    const p = pair(val?.text, 300);
    if (p.en) out[k] = { text: p, base: pair(val?.base, 300) };
  }
  return out;
}

/** The validated model with env merged, or null. */
export const modelOf = (r) => validModel(r.kit, r.model, r.env);

/**
 * Questions derived from the model. A teacher wording override replaces the stem only — the answer
 * is always recomputed — and a misconception answer equal to the right answer is dropped (it would
 * not be diagnostic).
 */
export function questions(r) {
  const v = modelOf(r);
  if (!v) return [];
  return KITS[r.kit].questions(v).map((q) => withOverride(r, clean(q)));
}

export function transferQuestion(r, seed = "t") {
  const v = modelOf(r);
  return v ? withOverride(r, clean(KITS[r.kit].transfer(v, seed))) : null;
}

const clean = (q) => ({ ...q, miscon: q.miscon.filter((m, i, all) => Math.abs(m.answer - q.answer) > 1e-9 && all.findIndex((x) => x.answer === m.answer) === i) });

function withOverride(r, q) {
  const o = r.overrides[`${q.id}:stem`];
  return o ? { ...q, stem: o.text, generatedStem: q.stem, overridden: true } : q;
}

export function story(r) {
  const v = modelOf(r);
  return v ? KITS[r.kit].story(v) : P("", "");
}

export function consequences(r) {
  const v = modelOf(r);
  return v ? KITS[r.kit].consequences(v) : [];
}

// ---- answers --------------------------------------------------------------

/** Parse a typed answer: "12", "$12.50", "3/2", "1 1/2", "-86 m", "25%". Returns a number or null. */
export function parseAnswer(text) {
  const s = String(text ?? "").replace(/(\d),(?=\d{3}(?!\d))/g, "$1").replace(/[$,\s]+/g, " ").replace(/−/g, "-").trim();
  const mixed = s.match(/^(-?\d+) (\d+)\/(\d+)\b/);
  if (mixed) return Number(mixed[3]) ? Math.sign(Number(mixed[1]) || 1) * (Math.abs(Number(mixed[1])) + Number(mixed[2]) / Number(mixed[3])) : null;
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/);
  if (frac) return Number(frac[2]) ? Number(frac[1]) / Number(frac[2]) : null;
  const num = s.match(/^-?\d*\.?\d+/);
  return num ? Number(num[0]) : null;
}

/** Judge an answer against a derived question: {correct, miscon|null, parsed}. */
export function judge(q, text) {
  const n = parseAnswer(text);
  if (n == null) return { correct: false, miscon: null, parsed: null };
  const near = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b)) || Math.abs(a - b) < 0.0051 && !Number.isInteger(b);
  if (near(n, q.answer)) return { correct: true, miscon: null, parsed: n };
  return { correct: false, miscon: q.miscon.find((m) => near(n, m.answer)) || null, parsed: n };
}

// ---- sharing --------------------------------------------------------------

const toB64 = (s) => (typeof btoa === "function" ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, "utf8").toString("base64"));
const fromB64 = (s) => (typeof atob === "function" ? decodeURIComponent(escape(atob(s))) : Buffer.from(s, "base64").toString("utf8"));

/** The resource as a URL-safe string for a student link. Teacher notes are never shared. */
export function encode(r) {
  const { notes, history, ...pub } = r;
  return toB64(JSON.stringify(pub)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decode(s) {
  if (typeof s !== "string" || !s || s.length > MAX_SHARE) return null;
  try {
    const { resource, errors } = validate(JSON.parse(fromB64(s.replace(/-/g, "+").replace(/_/g, "/"))));
    return resource && !errors.length && modelOf(resource) ? resource : null;
  } catch {
    return null;
  }
}

/** A short stable hash (save keys, version identity). */
export function hashOf(r) {
  let h = 2166136261;
  for (const ch of JSON.stringify([r.kit, r.model, r.env, r.overrides, r.goal])) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0).toString(36);
}
