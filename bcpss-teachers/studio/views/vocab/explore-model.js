// Vocabulary explorer data model. Pure functions (no DOM): template choice, safe expressions, spec binding, derived data.
// Documented in STUDIO-SPEC.md, section "Vocab explorer data".
import { shuffle } from "../../core/dom.js";

export const TEMPLATES = ["science-process", "math-quantity", "ela-context", "social-relations", "arts-describe", "movement-cues", "word-picture-sentence", "tap-to-hear"];

export const TEMPLATE_LABEL = {
  "science-process": "Process and cause",
  "math-quantity": "Change it, see it",
  "ela-context": "Context clues and shades of meaning",
  "social-relations": "Places, times and sources",
  "arts-describe": "See, think, wonder",
  "movement-cues": "Movement cue cards",
  "word-picture-sentence": "Word, picture, sentence",
  "tap-to-hear": "Tap to hear",
};

const BY_SUBJECT = {
  science: "science-process",
  math: "math-quantity",
  ela: "ela-context",
  "social-studies": "social-relations",
  arts: "arts-describe",
  "health-pe": "movement-cues",
  "world-languages": "word-picture-sentence",
  esol: "word-picture-sentence",
  sped: "word-picture-sentence",
  cte: "science-process",
  interdisciplinary: "science-process",
};

/** Explicit `explore.template` wins; kindergarten and grade 1 default to picture-and-sound; otherwise the subject decides. */
export function templateFor(collection, entry = null) {
  const explicit = entry?.explore?.template || collection.exploreTemplate;
  if (TEMPLATES.includes(explicit)) return explicit;
  if (["K", "1"].includes(String(collection.grade))) return "tap-to-hear";
  return BY_SUBJECT[collection.subject] || "word-picture-sentence";
}

// ---- safe expressions: numbers, variable names, + - * / % ( ) comparisons, && || !  (no eval, no function calls)

function tokenize(src) {
  const out = [];
  const re = /\s*(\d+\.?\d*|[A-Za-z_][A-Za-z0-9_]*|&&|\|\||==|!=|<=|>=|[-+*/%()<>!])/gy;
  let m;
  let last = 0;
  while ((m = re.exec(src))) {
    out.push(m[1]);
    last = re.lastIndex;
  }
  if (src.slice(last).trim()) throw new Error(`Unexpected text in expression "${src}"`);
  return out;
}

export function evalExpr(src, vars = {}) {
  const t = tokenize(String(src));
  let i = 0;
  const peek = () => t[i];
  const next = () => t[i++];
  const num = (v) => (typeof v === "boolean" ? Number(v) : v);
  function primary() {
    const x = next();
    if (x === undefined) throw new Error("Expression ended early");
    if (x === "(") {
      const v = or();
      if (next() !== ")") throw new Error("Missing )");
      return v;
    }
    if (x === "-") return -num(primary());
    if (x === "!") return !primary();
    if (/^\d/.test(x)) return Number(x);
    if (Object.hasOwn(vars, x)) return vars[x];
    throw new Error(`Unknown name "${x}"`);
  }
  const binary = (ops, sub) => () => {
    let l = sub();
    while (ops.includes(peek())) {
      const op = next();
      const r = sub();
      const a = num(l);
      const b = num(r);
      l = { "*": a * b, "/": b === 0 ? NaN : a / b, "%": b === 0 ? NaN : a % b, "+": a + b, "-": a - b, "<": a < b, ">": a > b, "<=": a <= b, ">=": a >= b, "==": Math.abs(a - b) < 1e-9, "!=": Math.abs(a - b) >= 1e-9, "&&": !!l && !!r, "||": !!l || !!r }[op];
    }
    return l;
  };
  const mul = binary(["*", "/", "%"], primary);
  const add = binary(["+", "-"], mul);
  const cmp = binary(["<", ">", "<=", ">="], add);
  const eq = binary(["==", "!="], cmp);
  const and = binary(["&&"], eq);
  const or = binary(["||"], and);
  const v = or();
  if (i < t.length) throw new Error(`Unexpected "${t[i]}"`);
  return v;
}

const round = (n) => (Number.isInteger(n) ? n : Math.round(n * 100) / 100);

/** "{a} to {b}", "{a+b}": replace each {expression} with its value. Unknown expressions stay as written. */
export function fillTemplate(str, vars) {
  return String(str).replace(/\{([^{}]+)\}/g, (all, expr) => {
    try {
      const v = evalExpr(expr, vars);
      return typeof v === "number" && Number.isFinite(v) ? String(round(v)) : all;
    } catch {
      return all;
    }
  });
}

const BAD = new Set(["__proto__", "constructor", "prototype"]);
/** Copy of `spec` with each bind ({path:"parts.0.units", expr:"a*2"}) applied. */
export function bindSpec(spec, binds, vars) {
  const out = structuredClone(spec);
  for (const b of binds || []) {
    const segs = String(b.path).split(".");
    if (segs.some((s) => BAD.has(s))) continue;
    let node = out;
    for (let k = 0; k < segs.length - 1; k++) {
      node = node?.[segs[k]];
      if (node == null || typeof node !== "object") break;
    }
    const key = segs[segs.length - 1];
    if (node && typeof node === "object") node[key] = round(Number(evalExpr(b.expr ?? b.var, vars)));
  }
  return out;
}

// ---- derived data

export const deriveSteps = (e) => {
  if (e.explore?.steps?.length) return e.explore.steps;
  const v = e.visual;
  if (v?.kind === "cycle") return (v.stages || []).map((s) => ({ label: s.label }));
  if (v?.kind === "flow") return (v.steps || []).map((s) => ({ label: s.label }));
  if (v?.kind === "timeline") return [...(v.events || [])].sort((a, b) => a.at - b.at).map((s) => ({ label: s.label, detail: s.detail }));
  if (v?.kind === "labeled") return (v.labels || []).filter((l) => !l.hidden).map((l) => ({ label: l.text }));
  return [];
};

export const deriveCauseEffect = (e) => e.explore?.causeEffect || [];

/** Example / non-example items for a "does it fit?" sort. */
export function deriveExamples(e) {
  if (e.explore?.examples?.length) return e.explore.examples;
  const out = [{ text: e.context, is: true, why: `It uses "${e.word}" the way the word is used.` }];
  if (e.nonExample) out.push({ text: e.nonExample, is: false, why: "This is the near miss the word does not describe." });
  return out.length > 1 ? out : [];
}

/** Meaning-in-context choices: the real definition and two from other words in the collection, in a stable order. */
export function meaningChoices(e, collection) {
  const wrong = e.explore?.ela?.distractors || collection.entries.filter((x) => x.id !== e.id).map((x) => x.def);
  const picks = shuffle(wrong, `d-${e.id}`).slice(0, 2);
  return shuffle([{ text: e.def, ok: true }, ...picks.map((text) => ({ text, ok: false }))], `m-${e.id}`);
}

export const deriveShades = (e) => (e.explore?.ela?.shades?.words?.length > 2 ? e.explore.ela.shades : null);

const num = (n, fb) => (Number.isFinite(n) ? n : fb);
/** Controls, spec bindings and readout for the math template. Explicit `explore.math` wins; tape, numberline, bars, coord derive. */
export function deriveMath(e) {
  if (e.explore?.math) return { ...e.explore.math, spec: e.explore.math.spec || e.visual };
  const v = e.visual;
  if (!v) return null;
  if (v.kind === "tape" && v.parts?.length) {
    const parts = v.parts.slice(0, 2);
    const vars = parts.map((p, i) => ({ id: "ab"[i], label: `Units of ${p.label}`, min: 1, max: 10, step: 1, start: num(p.units, 2) }));
    const binds = parts.map((_, i) => ({ path: `parts.${i}.units`, var: "ab"[i] }));
    const l = parts.map((p) => p.label);
    const readout = parts.length === 2 ? `${l[0]}: {a} units. ${l[1]}: {b} units. Together: {a+b} units.` : `${l[0]}: {a} units.`;
    const match =
      parts.length === 2
        ? { prompt: "Choose the statement that is true for this picture.", options: [{ text: `The ratio of ${l[0]} to ${l[1]} is {a} to {b}.`, ok: "1" }, { text: `The ratio of ${l[0]} to ${l[1]} is {b} to {a}.`, ok: "a == b" }, { text: `The total is {a*b} units.`, ok: "a + b == a * b" }] }
        : null;
    const reps = parts.length === 2 ? [{ label: "Picture 1", set: {}, ok: "1" }, { label: "Picture 2", set: { a: "b", b: "a" }, ok: "a == b" }] : null;
    const sentence = parts.length === 2 ? `The ratio of ${l[0]} to ${l[1]} is {a} to {b}.` : null;
    return { vars, binds, readout, match, reps, sentence, spec: v };
  }
  if (v.kind === "numberline") {
    const min = num(v.min, 0);
    const max = num(v.max, 10);
    const spec = { ...structuredClone(v), marks: [{ at: num(v.marks?.[0]?.at, min), label: "x" }, ...(v.marks || []).slice(1)] };
    return { vars: [{ id: "x", label: "Move the point", min, max, step: num(v.step, 1), start: spec.marks[0].at }], binds: [{ path: "marks.0.at", var: "x" }], readout: "The point is at {x}.", spec };
  }
  if (v.kind === "bars" && v.data?.length) {
    const top = Math.max(...v.data.map((d) => d.value), 1);
    return { vars: [{ id: "v", label: `Value of ${v.data[0].label}`, min: 0, max: Math.ceil(top * 1.5), step: 1, start: v.data[0].value }], binds: [{ path: "data.0.value", var: "v" }], readout: `${v.data[0].label} is {v}.`, spec: v };
  }
  if (v.kind === "coord" && v.points?.length) {
    return { vars: [{ id: "x", label: "x value of the first point", min: 0, max: num(v.xmax, 10), step: 1, start: v.points[0].x }], binds: [{ path: "points.0.x", var: "x" }], readout: `The first point is at ({x}, ${v.points[0].y}).`, spec: v };
  }
  return null;
}

// ---- social studies / arts / movement / language

export const derivePlaces = (e) => e.explore?.social?.places || (e.visual?.kind === "map" ? (e.visual.regions || []).map((r) => ({ region: r.label, note: "" })) : []);
export const deriveSources = (e) => e.explore?.social?.sources || [];

export function deriveCues(e) {
  if (e.explore?.cues?.length) return e.explore.cues;
  const steps = deriveSteps(e);
  if (steps.length) return steps.map((s) => ({ cue: s.label, detail: s.detail || "" }));
  return [e.context && { cue: e.context, detail: "Say the example, then show it." }, e.everyday && { cue: e.everyday, detail: "Connect it to what you know." }, e.academicSentence && { cue: e.academicSentence, detail: "Say the academic sentence." }].filter(Boolean);
}

/** "The ____ sat on the leaf." with the word and two other words as options. null when the sentence does not contain the word. */
export function cloze(e, collection) {
  const re = new RegExp(`\\b${e.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\w*`, "i");
  const m = e.context.match(re);
  if (!m) return null;
  const sentence = e.context.replace(re, "_____");
  const others = shuffle(collection.entries.filter((x) => x.id !== e.id && !re.test(x.word)).map((x) => x.word), `c-${e.id}`).slice(0, 2);
  const options = shuffle([{ text: m[0], ok: true }, ...others.map((text) => ({ text, ok: false }))], `co-${e.id}`);
  return { sentence, options, answer: m[0] };
}

/** Picture options for "which picture shows the word": the entry's own plus up to two from other entries. */
export function pictureOptions(e, collection, n = 3) {
  const others = shuffle(collection.entries.filter((x) => x.id !== e.id && x.visual), `p-${e.id}`).slice(0, n - 1);
  return shuffle([{ id: e.id, visual: e.visual, ok: true }, ...others.map((x) => ({ id: x.id, visual: x.visual, ok: false }))], `po-${e.id}`);
}
