// MathVisualEngine (Enterprise 8): one state, many linked representations.
//
// A model owns a small immutable state. Every representation a learner sees (the picture, the table, the
// equation, the sentence and the screen-reader text) is derived from that one state, so they cannot disagree.
// Each model also re-derives its key quantities a second, independent way in `verify`, so a bug in a renderer
// or a reducer shows up as a failed check rather than as a wrong picture.
//
// Model contract:
//   id, title{en,es}, grades[], domain, variants[]            metadata
//   init(params)                                                -> state
//   reduce(state, action, params)                               -> new state, or throw new ModelError(reason)
//   derive(state, params)                                       -> { facts, equation, verbal{en,es}, numeric?, steps? }
//   render(state, params, variant?)                             -> SVG markup
//   controls(state, params)                                     -> [{ id, label{en,es}, action, disabled? }]
//   describe(state, params)                                     -> { en, es } text alternative
//   verify(state, params)                                       -> [] when every representation agrees
//   generate(rng, grade)                                        -> params for a parallel problem

export class ModelError extends Error {
  constructor(reason) {
    super(reason.en || reason);
    this.reason = typeof reason === "string" ? { en: reason, es: reason } : reason;
  }
}

export const bi = (en, es) => ({ en, es });
export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c],
  );

// Minimal SVG helpers. Cells carry class "cell on|off" so tests (and CSS) can count them independently of the state.
export const svg = (w, h, inner, label) =>
  `<svg class="e8-model" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}" focusable="false" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
export const rect = (x, y, w, h, attrs = "") =>
  `<rect x="${+x.toFixed(2)}" y="${+y.toFixed(2)}" width="${+w.toFixed(2)}" height="${+h.toFixed(2)}" ${attrs}/>`;
export const circle = (x, y, r, attrs = "") =>
  `<circle cx="${+x.toFixed(2)}" cy="${+y.toFixed(2)}" r="${r}" ${attrs}/>`;
export const line = (x1, y1, x2, y2, attrs = "") =>
  `<line x1="${+x1.toFixed(2)}" y1="${+y1.toFixed(2)}" x2="${+x2.toFixed(2)}" y2="${+y2.toFixed(2)}" ${attrs}/>`;
export const text = (x, y, content, attrs = "") =>
  `<text x="${+x.toFixed(2)}" y="${+y.toFixed(2)}" ${attrs}>${esc(content)}</text>`;

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
export const intIn = (value, lo, hi, what = { en: "That number", es: "Ese número" }) => {
  if (!Number.isInteger(value))
    throw new ModelError(
      bi(`${what.en} must be a whole number.`, `${what.es} debe ser un número entero.`),
    );
  if (value < lo || value > hi)
    throw new ModelError(
      bi(`${what.en} must be from ${lo} to ${hi}.`, `${what.es} debe estar entre ${lo} y ${hi}.`),
    );
  return value;
};

const REGISTRY = new Map();
export function registerModel(model) {
  if (REGISTRY.has(model.id)) throw new Error(`Duplicate model ${model.id}`);
  for (const key of [
    "id",
    "title",
    "grades",
    "domain",
    "init",
    "reduce",
    "derive",
    "render",
    "controls",
    "describe",
    "verify",
    "generate",
  ])
    if (!(key in model)) throw new Error(`Model ${model.id || "?"} is missing ${key}`);
  REGISTRY.set(model.id, Object.freeze(model));
  return model;
}
export const getModel = (id) => REGISTRY.get(id) || null;
export const listModels = () => [...REGISTRY.values()];
export const modelsForGrade = (grade) =>
  listModels().filter((model) => model.grades.includes(Number(grade)));

// A small seeded generator so a "parallel problem" is reproducible in tests and across a refresh.
export function seeded(seed) {
  let s = Number(seed) >>> 0 || 1;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  next.pick = (list) => list[Math.floor(next() * list.length)];
  return next;
}

export class MathVisualEngine {
  constructor(modelId, params = {}, { mode = "guided", onEvent = () => {} } = {}) {
    const model = getModel(modelId);
    if (!model) throw new Error(`Unknown model ${modelId}`);
    this.model = model;
    this.params = { ...params };
    this.mode = mode === "independent" ? "independent" : "guided";
    this.onEvent = onEvent;
    this.initial = model.init(this.params);
    this.state = this.initial;
    this.past = [];
    this.future = [];
    this.log = [];
  }

  emit(type, detail = {}) {
    const event = { type, model: this.model.id, mode: this.mode, at: Date.now(), ...detail };
    this.log.push(event);
    if (this.log.length > 400) this.log.shift();
    this.onEvent(event);
    return event;
  }

  // Apply an action through the model's rules. An impossible move changes nothing and says why.
  dispatch(action) {
    try {
      const next = this.model.reduce(this.state, action, this.params);
      if (next !== this.state) {
        this.past.push(this.state);
        if (this.past.length > 200) this.past.shift();
        this.future = [];
        this.state = next;
      }
      this.emit("move", { action, ok: true });
      return { ok: true };
    } catch (error) {
      if (!(error instanceof ModelError)) throw error;
      this.emit("move", { action, ok: false, reason: error.reason });
      return { ok: false, reason: error.reason };
    }
  }

  undo() {
    if (!this.past.length) return false;
    this.future.push(this.state);
    this.state = this.past.pop();
    this.emit("undo");
    return true;
  }
  redo() {
    if (!this.future.length) return false;
    this.past.push(this.state);
    this.state = this.future.pop();
    this.emit("redo");
    return true;
  }
  reset() {
    if (this.state !== this.initial) this.past.push(this.state);
    this.state = this.initial;
    this.future = [];
    this.emit("reset");
  }

  setMode(mode) {
    this.mode = mode === "independent" ? "independent" : "guided";
  }

  // Pointer and keyboard input are optional per model; every model also offers plain buttons.
  pointer(hit) {
    const planned = this.model.pointer?.(this.state, this.params, hit);
    if (!planned) return { ok: false };
    let result = { ok: false };
    for (const action of Array.isArray(planned) ? planned : [planned]) {
      result = this.dispatch(action);
      if (!result.ok) break;
    }
    return result;
  }
  keyMap() {
    return this.model.keys ? this.model.keys(this.state, this.params) : {};
  }

  derive() {
    return this.model.derive(this.state, this.params);
  }
  render(variant) {
    return this.model.render(this.state, this.params, variant);
  }
  controls() {
    return this.model.controls(this.state, this.params);
  }
  describe() {
    return this.model.describe(this.state, this.params);
  }
  verify() {
    return this.model.verify(this.state, this.params);
  }

  // Concrete -> visual -> numerical -> symbolic -> verbal, all from the one state.
  views() {
    const derived = this.derive();
    const visual = this.render();
    return {
      visual,
      variants: Object.fromEntries(
        (this.model.variants || [])
          .map((v) => [v, this.render(v)])
          // A variant that is the default picture is not shown twice.
          .filter(([, markup]) => markup !== visual),
      ),
      numeric: derived.numeric || null,
      symbolic: derived.equation,
      verbal: derived.verbal,
      concrete: this.describe(),
      facts: derived.facts,
    };
  }

  // Serialisable snapshot; states hold only JSON-safe values (Rationals are stored as strings by each model).
  serialize() {
    return JSON.stringify({
      v: 1,
      model: this.model.id,
      params: this.params,
      state: this.state,
      mode: this.mode,
    });
  }
  static restore(json, options = {}) {
    const data = typeof json === "string" ? JSON.parse(json) : json;
    if (!data || data.v !== 1) throw new Error("Unsupported model snapshot");
    const engine = new MathVisualEngine(data.model, data.params, { ...options, mode: data.mode });
    const problems = engine.model.verify(data.state, engine.params);
    if (problems.length) throw new Error(`Snapshot fails verification: ${problems.join("; ")}`);
    engine.state = data.state;
    return engine;
  }
}
