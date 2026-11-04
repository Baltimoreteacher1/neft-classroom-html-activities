// Number models: place-value mats with trading, signed chips with zero pairs, ten-frames, and a hopping number line.
// Every picture is derived from small integer counts, and every value is an exact Rational.
import { L, R, clampInt, decimalText, fracText, parseRational } from "../kernel.js";

const same = (state) => ({ state });
const refuse = (en, es) => ({ refuse: L(en, es) });

// ---- place value: add pieces, combine two numbers, trade ten of one place for one of the next ----------------------
export const PLACE_SETS = {
  decimal: [
    { id: "ones", value: R(1), name: L("ones", "unidades") },
    { id: "tenths", value: R(1, 10), name: L("tenths", "décimos") },
    { id: "hundredths", value: R(1, 100), name: L("hundredths", "centésimos") },
  ],
  whole4: [
    { id: "thousands", value: R(1000), name: L("thousands", "millares") },
    { id: "hundreds", value: R(100), name: L("hundreds", "centenas") },
    { id: "tens", value: R(10), name: L("tens", "decenas") },
    { id: "ones", value: R(1), name: L("ones", "unidades") },
  ],
  whole: [
    { id: "hundreds", value: R(100), name: L("hundreds", "centenas") },
    { id: "tens", value: R(10), name: L("tens", "decenas") },
    { id: "ones", value: R(1), name: L("ones", "unidades") },
  ],
};
const CAP = 60;
const blank = (set) => Object.fromEntries(set.map((p) => [p.id, 0]));
const worth = (set, counts) => set.reduce((sum, p) => sum.add(p.value.mul(counts[p.id] || 0)), R(0));

export const place = {
  id: "place",
  init: ({ set = "decimal", rows = ["A", "B"], counts = {} } = {}) => {
    const places = PLACE_SETS[set];
    const state = { set, rows: {}, combined: rows.length === 1 };
    for (const id of rows) state.rows[id] = blank(places);
    state.rows.T = { ...blank(places), ...counts };
    return state;
  },
  reduce(state, action) {
    const places = PLACE_SETS[state.set];
    const ids = places.map((p) => p.id);
    const row = action.row;
    switch (action.type) {
      case "add":
      case "remove": {
        if (!state.rows[row]) return same(state);
        if (state.combined && row !== "T") return refuse("The two numbers are already joined. Undo to change one.", "Los dos números ya están unidos. Deshaz para cambiar uno.");
        if (row === "T" && Object.keys(state.rows).length > 1) return same(state);
        if (!ids.includes(action.place)) return same(state);
        const n = clampInt(action.n ?? 1, 1, CAP);
        const now = state.rows[row][action.place];
        const next = action.type === "add" ? now + n : now - n;
        if (next < 0) return refuse("There is nothing left there to take away.", "Ya no queda nada ahí para quitar.");
        if (next > CAP) return refuse("That place is full.", "Ese lugar está lleno.");
        return { state: { ...state, rows: { ...state.rows, [row]: { ...state.rows[row], [action.place]: next } } } };
      }
      case "combine": {
        if (state.combined) return same(state);
        const source = Object.keys(state.rows).filter((k) => k !== "T");
        const totals = blank(places);
        for (const k of source) for (const id of ids) totals[id] += state.rows[k][id];
        if (ids.every((id) => totals[id] === 0)) return refuse("Build a number first, then join them.", "Primero construye un número, luego únelos.");
        return { state: { ...state, combined: true, rows: { ...state.rows, T: totals } } };
      }
      case "trade": {
        if (!state.combined) return refuse("Join the numbers first, then trade.", "Primero une los números, luego intercambia.");
        const i = ids.indexOf(action.place);
        if (i < 0) return same(state);
        if (i === 0) return refuse("There is no bigger place to trade into.", "No hay un lugar mayor al que intercambiar.");
        if (state.rows.T[action.place] < 10) return refuse("You need 10 in this place before you can trade them for 1.", "Necesitas 10 en este lugar antes de poder cambiarlos por 1.");
        const T = { ...state.rows.T, [action.place]: state.rows.T[action.place] - 10, [ids[i - 1]]: state.rows.T[ids[i - 1]] + 1 };
        return { state: { ...state, rows: { ...state.rows, T } } };
      }
      case "unpack": {
        if (!state.combined) return refuse("Join the numbers first.", "Primero une los números.");
        const i = ids.indexOf(action.place);
        if (i < 0) return same(state);
        if (i === ids.length - 1) return refuse("There is no smaller place to break this into.", "No hay un lugar menor para descomponer esto.");
        if (state.rows.T[action.place] < 1) return refuse("There is nothing in this place to break apart.", "No hay nada en este lugar para descomponer.");
        if (state.rows.T[ids[i + 1]] + 10 > CAP) return refuse("The next place is full.", "El siguiente lugar está lleno.");
        const T = { ...state.rows.T, [action.place]: state.rows.T[action.place] - 1, [ids[i + 1]]: state.rows.T[ids[i + 1]] + 10 };
        return { state: { ...state, rows: { ...state.rows, T } } };
      }
      default:
        return same(state);
    }
  },
  derive(state) {
    const places = PLACE_SETS[state.set];
    const rowValue = (k) => worth(places, state.rows[k]);
    const sources = Object.keys(state.rows).filter((k) => k !== "T");
    const total = state.combined ? rowValue("T") : sources.reduce((s, k) => s.add(rowValue(k)), R(0));
    const T = state.rows.T;
    return {
      places,
      rows: Object.fromEntries(sources.map((k) => [k, { counts: state.rows[k], value: rowValue(k) }])),
      combined: state.combined,
      total,
      totalText: decimalText(total) ?? fracText(total),
      counts: state.combined ? T : null,
      regrouped: state.combined && places.every((p) => T[p.id] < 10),
      expanded: places.filter((p) => state.combined && T[p.id] > 0).map((p) => ({ id: p.id, count: T[p.id], name: p.name })),
    };
  },
  describe(state, lang) {
    const d = place.derive(state);
    return lang === "es"
      ? `Tablero de valor posicional. Total ${d.totalText}${d.combined ? "." : ", aún sin unir."}`
      : `A place-value mat. The total is ${d.totalText}${d.combined ? "." : ", not joined yet."}`;
  },
};

// ---- signed chips: positives, negatives and zero pairs ---------------------------------------------------------------
export const chips = {
  id: "chips",
  init: ({ pos = 0, neg = 0 } = {}) => ({ pos, neg }),
  reduce(state, action) {
    const n = clampInt(action.n ?? 1, 1, 20);
    switch (action.type) {
      case "add": {
        const key = action.sign === "neg" ? "neg" : "pos";
        if (state[key] + n > 24) return refuse("The mat is full.", "El tablero está lleno.");
        return { state: { ...state, [key]: state[key] + n } };
      }
      case "remove": {
        const key = action.sign === "neg" ? "neg" : "pos";
        if (state[key] < n) return refuse("There are not that many chips of that kind to take away.", "No hay tantas fichas de ese tipo para quitar.");
        return { state: { ...state, [key]: state[key] - n } };
      }
      case "addZeroPair": {
        if (state.pos + n > 24 || state.neg + n > 24) return refuse("The mat is full.", "El tablero está lleno.");
        return { state: { pos: state.pos + n, neg: state.neg + n } };
      }
      case "cancel": {
        const k = Math.min(n, state.pos, state.neg);
        if (!k) return refuse("A zero pair needs one positive chip and one negative chip.", "Un par cero necesita una ficha positiva y una negativa.");
        return { state: { pos: state.pos - k, neg: state.neg - k } };
      }
      default:
        return same(state);
    }
  },
  derive(state) {
    const pairs = Math.min(state.pos, state.neg);
    return { pos: state.pos, neg: state.neg, value: state.pos - state.neg, pairs, left: { pos: state.pos - pairs, neg: state.neg - pairs } };
  },
  describe(state, lang) {
    const d = chips.derive(state);
    const v = String(d.value).replace("-", "−");
    return lang === "es"
      ? `${d.pos} fichas positivas y ${d.neg} negativas, ${d.pairs} pares cero. Valor ${v}.`
      : `${d.pos} positive and ${d.neg} negative chips, ${d.pairs} zero pairs. The value is ${v}.`;
  },
};

// ---- ten-frames: two colours of counters, one or two frames --------------------------------------------------------------
export const tenframe = {
  id: "tenframe",
  init: ({ a = 0, b = 0, frames = 1 } = {}) => ({ a, b, frames }),
  reduce(state, action) {
    const cap = state.frames * 10;
    const key = action.color === "b" ? "b" : "a";
    const n = clampInt(action.n ?? 1, 1, cap);
    if (action.type === "add") {
      if (state.a + state.b + n > cap) return refuse(`The frame${state.frames > 1 ? "s hold" : " holds"} only ${cap} counters.`, `${state.frames > 1 ? "Los marcos solo caben" : "El marco solo cabe"} ${cap} fichas.`);
      return { state: { ...state, [key]: state[key] + n } };
    }
    if (action.type === "remove") {
      if (state[key] < n) return refuse("There are no more counters of that colour to take away.", "No quedan más fichas de ese color para quitar.");
      return { state: { ...state, [key]: state[key] - n } };
    }
    return same(state);
  },
  derive(state) {
    const total = state.a + state.b;
    return { a: state.a, b: state.b, total, fullFrames: Math.floor(total / 10), toTen: total % 10 === 0 ? 0 : 10 - (total % 10), cap: state.frames * 10, equation: `${state.a} + ${state.b} = ${total}` };
  },
  describe(state, lang) {
    const d = tenframe.derive(state);
    return lang === "es" ? `${d.a} fichas rojas y ${d.b} amarillas: ${d.total} en total.` : `${d.a} red and ${d.b} yellow counters: ${d.total} in all.`;
  },
};

// ---- a number line with hops --------------------------------------------------------------------------------------------------
export const numline = {
  id: "numline",
  init: ({ min = 0, max = 20, start = 0, step = "1" } = {}) => ({ min: R(min), max: R(max), start: R(start), pos: R(start), hops: [], step: parseRational(step) }),
  reduce(state, action) {
    if (action.type === "hop") {
      const by = parseRational(action.by ?? state.step);
      if (!by || by.isZero()) return refuse("A hop needs a size, like 2 or 1/4.", "Un salto necesita un tamaño, como 2 o 1/4.");
      const to = state.pos.add(by);
      if (to.lt(state.min) || to.gt(state.max)) return refuse("That hop would land off the number line.", "Ese salto caería fuera de la recta numérica.");
      if (state.hops.length >= 40) return refuse("That is a lot of hops. Start again from zero.", "Son muchos saltos. Vuelve a empezar.");
      return { state: { ...state, pos: to, hops: [...state.hops, by] } };
    }
    if (action.type === "setStep") {
      const step = parseRational(action.step);
      if (!step || step.isZero()) return same(state);
      return { state: { ...state, step } };
    }
    return same(state);
  },
  derive(state) {
    const sign = (q) => (q.sign() < 0 ? "−" : "+");
    const equation = state.hops.length
      ? `${fracText(state.start).replace("-", "−")} ${state.hops.map((h) => `${sign(h)} ${fracText(h.abs())}`).join(" ")} = ${fracText(state.pos).replace("-", "−")}`
      : fracText(state.start);
    return { pos: state.pos, hops: state.hops, equation, count: state.hops.length, step: state.step, min: state.min, max: state.max };
  },
  describe(state, lang) {
    const d = numline.derive(state);
    return lang === "es" ? `Estás en ${fracText(d.pos)} después de ${d.count} saltos.` : `You are at ${fracText(d.pos)} after ${d.count} hops.`;
  },
};
