// Reality Lab kernel: exact numbers, bilingual text, and the Store every model runs inside.
// A model is a pure object { id, init(params), reduce(state, action), derive(state), describe(state, lang) }.
// reduce() returns { state, note? } for a legal move or { refuse: text } for an impossible one; a refused move changes
// nothing, so a student can always try again. No DOM, no storage, no randomness.
import { R, Rational, parseRational } from "../../e8/rational.js";

export { R, Rational, parseRational };

export const MAX_TRAIL = 200;

// Bilingual text: L("English", "Español"). Templates use {name} placeholders.
export const L = (en, es) => ({ en, es });
export const say = (text, lang = "en", vars = {}) => {
  const raw = typeof text === "string" ? text : (text?.[lang] ?? text?.en ?? "");
  return raw.replace(/\{(\w+)\}/g, (_, key) => (vars[key] === undefined ? "" : String(vars[key])));
};

export const clampInt = (value, lo, hi) => Math.min(hi, Math.max(lo, Math.trunc(Number(value) || 0)));
export const isWhole = (value) => Number.isInteger(value);

// Exact value to a short, honest decimal ("0.75", "0.333… " is never produced: a repeating value says so).
export function decimalText(value, maxPlaces = 6) {
  const v = Rational.of(value);
  if (!v.isTerminating()) return null;
  const places = Math.min(maxPlaces, 12);
  const text = v.toDecimal(places);
  return text.includes(".") ? text.replace(/0+$/, "").replace(/\.$/, "") : text;
}
export const fracText = (value) => {
  const v = Rational.of(value);
  return v.d === 1n ? String(v.n) : `${v.n}/${v.d}`;
};

export function createStore(model, params = {}) {
  const initial = model.init(params);
  let state = initial;
  let past = [];
  let future = [];
  let acts = [];
  const listeners = new Set();
  const api = {
    model,
    get state() {
      return state;
    },
    get initial() {
      return initial;
    },
    get canUndo() {
      return past.length > 0;
    },
    get canRedo() {
      return future.length > 0;
    },
    get actions() {
      return acts;
    },
    derive: () => model.derive(state),
    describe: (lang) => model.describe(state, lang),
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    dispatch(action) {
      const out = model.reduce(state, action);
      if (out.refuse) return { ok: false, reason: out.refuse };
      if (out.state !== state) {
        past = [...past, state].slice(-MAX_TRAIL);
        acts = [...acts, action].slice(-MAX_TRAIL);
        future = [];
        state = out.state;
        for (const fn of listeners) fn(api, action);
      }
      return { ok: true, note: out.note, same: out.state === state && !out.note };
    },
    undo() {
      if (!past.length) return false;
      future = [state, ...future];
      state = past[past.length - 1];
      past = past.slice(0, -1);
      acts = acts.slice(0, -1);
      for (const fn of listeners) fn(api, { type: "undo" });
      return true;
    },
    redo() {
      if (!future.length) return false;
      past = [...past, state];
      state = future[0];
      future = future.slice(1);
      for (const fn of listeners) fn(api, { type: "redo" });
      return true;
    },
    reset() {
      past = [];
      future = [];
      acts = [];
      state = initial;
      for (const fn of listeners) fn(api, { type: "reset" });
    },
    // Every state the student passed through on the way here, oldest first: what Replay plays back.
    frames: () => [...past, state],
    load(next) {
      state = next;
      past = [];
      future = [];
      acts = [];
      for (const fn of listeners) fn(api, { type: "load" });
    },
  };
  return api;
}

// A deterministic generator for transfer problems: the same seed always gives the same numbers.
export function seeded(seed) {
  let s = (Math.trunc(seed) >>> 0) || 1;
  const next = () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
  return {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (list) => list[Math.floor(next() * list.length)],
  };
}
