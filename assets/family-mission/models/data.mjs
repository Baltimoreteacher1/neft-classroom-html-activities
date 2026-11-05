// Family "data": an editable dot plot on an integer axis with live exact statistics: mean (a
// fraction, plus a decimal when it terminates), median, mode, range, quartiles, IQR, optional MAD
// and outlier highlighting. Quartiles use the median of each half and leave the median out when
// the number of values is odd (the grade 6 method); outliers are beyond 1.5 x IQR from Q1 or Q3.
import {
  button,
  clamp,
  clear,
  cmp,
  createView,
  defineFamily,
  div,
  eq,
  frac,
  fracToString,
  h,
  isInt,
  makeDraggable,
  mul,
  put,
  s,
  sign,
  stext,
  sub,
  add,
  t,
  terminates,
  toDecimalString,
  toFrac,
  toSvgX,
} from "./core.mjs";

export const id = "data";
export const label = { en: "Data models", es: "Modelos de datos" };

const MAX_DOTS = 30;
const ACTIONS = ["add", "remove", "move", "cursor", "mad", "values"];
const MINUS = "−";
const FENCE = frac(3, 2);

const num = (r) => fracToString(r).replace("-", MINUS);
/** "22/5 = 4.4" when the decimal terminates, "10/3" when it does not, "3" for a whole number. */
const exact = (r) => (r.d === 1 || !terminates(r) ? num(r) : `${num(r)} = ${toDecimalString(r).replace("-", MINUS)}`);
const abs = (r) => (sign(r) < 0 ? frac(-r.n, r.d) : r);
const listOf = (arr) => arr.map((v) => String(v).replace("-", MINUS)).join(", ");

// ── Statistics ───────────────────────────────────────────────────────────────

const midOf = (arr) => {
  const n = arr.length;
  return n % 2 ? frac(arr[(n - 1) / 2]) : frac(arr[n / 2 - 1] + arr[n / 2], 2);
};

/** Exact statistics of a list of integers (any order). */
export function stats(list) {
  const v = [...list].sort((a, b) => a - b);
  const n = v.length;
  const mean = frac(
    v.reduce((a, b) => a + b, 0),
    n,
  );
  const median = midOf(v);
  const lower = v.slice(0, Math.floor(n / 2));
  const upper = v.slice(Math.ceil(n / 2));
  const q1 = lower.length ? midOf(lower) : null;
  const q3 = upper.length ? midOf(upper) : null;
  const iqr = q1 && q3 ? sub(q3, q1) : null;
  const counts = new Map();
  for (const x of v) counts.set(x, (counts.get(x) ?? 0) + 1);
  const top = Math.max(...counts.values());
  const modes = top > 1 ? [...counts].filter(([, c]) => c === top).map(([x]) => x) : [];
  const mad = div(
    v.reduce((a, x) => add(a, abs(sub(frac(x), mean))), frac(0)),
    frac(n),
  );
  const fences = iqr ? { lo: sub(q1, mul(FENCE, iqr)), hi: add(q3, mul(FENCE, iqr)) } : null;
  const outliers = fences ? v.filter((x) => cmp(frac(x), fences.lo) < 0 || cmp(frac(x), fences.hi) > 0) : [];
  return { n, sorted: v, mean, median, range: v[n - 1] - v[0], q1, q3, iqr, modes, mad, fences, outliers, counts };
}

// ── State ────────────────────────────────────────────────────────────────────

function validateState(st) {
  if (!st || !Number.isInteger(st.min) || !Number.isInteger(st.max) || st.min >= st.max || st.max - st.min > 40) return false;
  if (!Array.isArray(st.values) || st.values.length < 1 || st.values.length > MAX_DOTS) return false;
  if (!st.values.every((x, i) => Number.isInteger(x) && x >= st.min && x <= st.max && (i === 0 || st.values[i - 1] <= x))) return false;
  return Number.isInteger(st.cursor) && st.cursor >= st.min && st.cursor <= st.max && typeof st.mad === "boolean";
}

function reduce(st, patch) {
  if (!patch || typeof patch !== "object" || Object.keys(patch).some((k) => !ACTIONS.includes(k))) return null;
  const next = { ...st, values: [...st.values] };
  const whole = (raw) => {
    const r = toFrac(raw);
    return r && isInt(r) && r.n >= st.min && r.n <= st.max ? r.n : null;
  };
  const sortIn = () => next.values.sort((a, b) => a - b);
  if ("values" in patch) {
    if (!Array.isArray(patch.values)) return null;
    next.values = patch.values.map(whole);
    if (next.values.some((x) => x === null)) return null;
    sortIn();
  }
  if ("add" in patch) {
    const v = whole(patch.add);
    if (v === null || next.values.length >= MAX_DOTS) return null;
    next.values.push(v);
    sortIn();
    next.cursor = v;
  }
  if ("remove" in patch) {
    const v = whole(patch.remove);
    const at = v === null ? -1 : next.values.indexOf(v);
    if (at < 0 || next.values.length < 2) return null;
    next.values.splice(at, 1);
  }
  if ("move" in patch) {
    const from = whole(patch.move?.from);
    const to = whole(patch.move?.to);
    const at = from === null ? -1 : next.values.indexOf(from);
    if (at < 0 || to === null) return null;
    next.values[at] = to;
    sortIn();
    next.cursor = to;
  }
  if ("cursor" in patch) {
    const v = whole(patch.cursor);
    if (v === null) return null;
    next.cursor = v;
  }
  if ("mad" in patch) next.mad = patch.mad === true;
  return next;
}

const derive = (st) => ({ ...st, stats: stats(st.values) });

function normalize(config) {
  const c = config || {};
  const values = (c.values ?? [2, 3, 3, 5, 9]).map((x) => {
    const r = toFrac(x);
    if (!r || !isInt(r)) throw new TypeError("data: values must be whole numbers");
    return r.n;
  });
  values.sort((a, b) => a - b);
  const min = c.min ?? Math.min(0, ...values);
  const max = c.max ?? Math.max(12, ...values);
  const state = { min, max, values, cursor: clamp(c.cursor ?? values[0], min, max), mad: c.mad === true };
  if (!validateState(state)) throw new TypeError("data: invalid configuration");
  return { state, task: c.task || null };
}

// ── Words ────────────────────────────────────────────────────────────────────

function modeText(S, lang) {
  if (!S.modes.length) return t(lang, { en: "none (every value appears once)", es: "no hay (cada valor aparece una vez)" });
  return listOf(S.modes);
}

function outlierText(S, lang) {
  if (!S.fences) return t(lang, { en: "needs at least 2 values", es: "necesita al menos 2 valores" });
  return S.outliers.length ? listOf(S.outliers) : t(lang, { en: "none", es: "ninguno" });
}

function accessibleDescription(st, lang) {
  const S = stats(st.values);
  const out = S.outliers.length ? t(lang, { en: ` Outlier${S.outliers.length > 1 ? "s" : ""}: ${listOf(S.outliers)}.`, es: ` Valor${S.outliers.length > 1 ? "es atípicos" : " atípico"}: ${listOf(S.outliers)}.` }) : "";
  return t(lang, {
    en: `Dot plot on an axis from ${String(st.min).replace("-", MINUS)} to ${st.max} with ${S.n} dots: ${listOf(S.sorted)}. Mean ${exact(S.mean)}, median ${num(S.median)}, range ${S.range}.${out}`,
    es: `Gráfica de puntos en un eje de ${String(st.min).replace("-", MINUS)} a ${st.max} con ${S.n} puntos: ${listOf(S.sorted)}. Media ${exact(S.mean)}, mediana ${num(S.median)}, rango ${S.range}.${out}`,
  });
}

function explanation(st, lang) {
  const S = stats(st.values);
  const n = S.n;
  const sum = S.sorted.reduce((a, b) => a + b, 0);
  const total = n <= 8 ? S.sorted.map((x) => String(x).replace("-", MINUS)).join(" + ") : null;
  const sumEn = total ? `${total} = ${String(sum).replace("-", MINUS)}` : `the sum of the ${n} values is ${String(sum).replace("-", MINUS)}`;
  const sumEs = total ? `${total} = ${String(sum).replace("-", MINUS)}` : `la suma de los ${n} valores es ${String(sum).replace("-", MINUS)}`;
  const parts = [
    t(lang, { en: `Dot plot of ${n} value${n > 1 ? "s" : ""}: ${listOf(S.sorted)}.`, es: `Gráfica de puntos de ${n} valor${n > 1 ? "es" : ""}: ${listOf(S.sorted)}.` }),
    t(lang, { en: `Mean: ${sumEn}, and ${String(sum).replace("-", MINUS)} ÷ ${n} = ${exact(S.mean)}.`, es: `Media: ${sumEs}, y ${String(sum).replace("-", MINUS)} ÷ ${n} = ${exact(S.mean)}.` }),
    t(lang, { en: `Median: the middle of the ordered list is ${exact(S.median)}.`, es: `Mediana: el valor del medio de la lista ordenada es ${exact(S.median)}.` }),
    t(lang, { en: `Mode: ${modeText(S, "en")}.`, es: `Moda: ${modeText(S, "es")}.` }),
    t(lang, { en: `Range: ${S.sorted[n - 1]} − ${S.sorted[0]} = ${S.range}.`.replace(/-/g, MINUS), es: `Rango: ${S.sorted[n - 1]} − ${S.sorted[0]} = ${S.range}.`.replace(/-/g, MINUS) }),
  ];
  if (S.iqr) {
    parts.push(
      t(lang, {
        en: `Quartiles use the median of each half of the ordered list, and leave the median out when the number of values is odd: Q1 = ${exact(S.q1)}, Q3 = ${exact(S.q3)}, so IQR = ${num(S.q3)} − ${num(S.q1)} = ${exact(S.iqr)}.`,
        es: `Los cuartiles usan la mediana de cada mitad de la lista ordenada, y no incluyen la mediana cuando la cantidad de valores es impar: Q1 = ${exact(S.q1)}, Q3 = ${exact(S.q3)}, así que RIC = ${num(S.q3)} − ${num(S.q1)} = ${exact(S.iqr)}.`,
      }),
      t(lang, {
        en: `A value is an outlier when it is below Q1 − 1.5 × IQR = ${exact(S.fences.lo)} or above Q3 + 1.5 × IQR = ${exact(S.fences.hi)}. Outliers: ${outlierText(S, "en")}.`,
        es: `Un valor es atípico si está por debajo de Q1 − 1.5 × RIC = ${exact(S.fences.lo)} o por encima de Q3 + 1.5 × RIC = ${exact(S.fences.hi)}. Valores atípicos: ${outlierText(S, "es")}.`,
      }),
    );
  }
  if (st.mad) parts.push(t(lang, { en: `MAD (mean absolute deviation): the mean of the distances from the mean is ${exact(S.mad)}.`, es: `DAM (desviación absoluta media): el promedio de las distancias a la media es ${exact(S.mad)}.` }));
  return parts.join(" ");
}

// ── validate(task) ───────────────────────────────────────────────────────────

const dirOf = (a, b) => (cmp(b, a) > 0 ? "increase" : cmp(b, a) < 0 ? "decrease" : "same");
const DIR_ALIAS = { up: "increase", increase: "increase", down: "decrease", decrease: "decrease", same: "same", none: "same", "no change": "same" };

function validateTask(st, task) {
  const none = (reason, ok = false) => ({ ok, reason, misconception: null });
  const wrong = (m) => ({ ok: false, reason: "incorrect", misconception: m && { id: m, confidence: "possible" } });
  if (!task) return none("no-task");
  const listed = Array.isArray(task.values) ? task.values.map((x) => toFrac(x)) : null;
  if (listed && listed.some((r) => !r || !isInt(r))) return none("invalid-task");
  const values = listed ? listed.map((r) => r.n) : st.values;
  const S = stats(values);
  if (task.kind === "set-mean" || task.kind === "set-median") {
    const target = toFrac(task.target);
    if (!target) return none("invalid-task");
    const got = task.kind === "set-mean" ? S.mean : S.median;
    if (eq(got, target)) return none("correct", true);
    // The median is the middle value, the mean is the balance point: building the median and calling it the mean.
    return wrong(task.kind === "set-mean" && eq(S.median, target) ? "mean-is-middle-value" : null);
  }
  if (task.kind === "find") {
    const stat = task.stat;
    const given = toFrac(task.answer);
    if (!["mean", "median", "mode", "range", "iqr", "q1", "q3", "mad"].includes(stat)) return none("invalid-task");
    if (!given) return none("invalid-answer");
    const want = stat === "range" ? frac(S.range) : S[stat];
    if (stat === "mode" ? S.modes.some((m) => eq(frac(m), given)) : want && eq(want, given)) return none("correct", true);
    if (!want && stat !== "mode") return none("invalid-task");
    if (stat === "median" && listed && eq(midOf(values), given)) return wrong("median-unsorted");
    if (stat === "mean" && eq(S.median, given)) return wrong("mean-is-middle-value");
    if (stat === "range" && S.iqr && eq(S.iqr, given)) return wrong("range-vs-iqr");
    if (stat === "iqr" && eq(frac(S.range), given)) return wrong("range-vs-iqr");
    return wrong(null);
  }
  if (task.kind === "add-outlier") {
    const extra = toFrac(task.add);
    if (!extra || !isInt(extra) || !task.answer || typeof task.answer !== "object") return none("invalid-answer");
    const A = stats([...values, extra.n]);
    const want = { mean: dirOf(S.mean, A.mean), median: dirOf(S.median, A.median), range: dirOf(frac(S.range), frac(A.range)) };
    if (S.iqr && A.iqr) want.iqr = dirOf(S.iqr, A.iqr);
    const given = {};
    for (const [k, v] of Object.entries(task.answer)) {
      if (!(k in want)) return none("invalid-answer");
      given[k] = DIR_ALIAS[String(v).toLowerCase()];
      if (!given[k]) return none("invalid-answer");
    }
    if (!Object.keys(given).length) return none("invalid-answer");
    if (Object.entries(given).every(([k, v]) => want[k] === v)) return none("correct", true);
    // Predicting that the median chases the mean, or that the IQR grows with the range.
    if (given.median && given.median !== want.median && given.median === want.mean) return wrong("mean-is-middle-value");
    if (given.iqr && given.iqr !== want.iqr && given.iqr === want.range) return wrong("range-vs-iqr");
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
  track: (patch) => !Object.keys(patch).every((k) => ["cursor", "mad"].includes(k)),
  describeConfig: (st) => ({ values: st.values, min: st.min, max: st.max, mad: st.mad }),
});

// ── Rendering ────────────────────────────────────────────────────────────────

const STR = {
  plot: { en: "Dot plot", es: "Gráfica de puntos" },
  cursor: { en: "Axis position. Arrow keys move it. Plus adds a dot, Delete removes one.", es: "Posición en el eje. Las flechas la mueven. Más agrega un punto, Suprimir quita uno." },
  add: { en: "Add a dot at", es: "Agregar un punto en" },
  remove: { en: "Remove a dot at", es: "Quitar un punto en" },
  mad: { en: "Show MAD", es: "Mostrar DAM" },
  undo: { en: "Undo", es: "Deshacer" },
  reset: { en: "Start over", es: "Empezar de nuevo" },
  stats: { en: "Statistics", es: "Estadísticas" },
  mean: { en: "Mean ▲", es: "Media ▲" },
  median: { en: "Median ┆", es: "Mediana ┆" },
  mode: { en: "Mode", es: "Moda" },
  range: { en: "Range", es: "Rango" },
  q1: { en: "Q1", es: "Q1" },
  q3: { en: "Q3", es: "Q3" },
  iqr: { en: "IQR", es: "RIC" },
  madRow: { en: "MAD", es: "DAM" },
  outliers: { en: "Outliers ◇", es: "Atípicos ◇" },
  n: { en: "Dots", es: "Puntos" },
};
const W = 360;
const AX = { x0: 24, x1: 336, base: 112, h: 196 };

export function mount(root, model, { lang = "en", onChange, readonly = false } = {}) {
  let L = lang;
  let ui = {};
  const state = () => model.getState();
  const T = (k) => t(L, STR[k]);
  const X = (v, d) => AX.x0 + ((AX.x1 - AX.x0) * (v - d.min)) / (d.max - d.min);
  const column = (e, d) => {
    const r = ui.svg.getBoundingClientRect?.();
    const k = r && r.width > 0 ? r.width / W : 1;
    const x = (e.clientX - (r ? r.left : 0)) / k;
    return clamp(Math.round(d.min + ((x - AX.x0) / (AX.x1 - AX.x0)) * (d.max - d.min)), d.min, d.max);
  };

  function build(v) {
    L = v.lang;
    ui = {};
    const st = state();
    ui.prompt = model.task?.prompt ? h("p", { class: "fm-prompt" }, t(L, model.task.prompt)) : null;
    ui.explain = h("p", { class: "fm-explain" });
    ui.desc = h("p", { class: "fm-sr" });
    ui.svg = s("svg", { class: "fm-svg fm-dotplot", viewBox: `0 0 ${W} ${AX.h}`, role: "group", "aria-label": T("plot") });
    ui.body = s("g");
    ui.svg.append(ui.body);
    ui.cur = readonly ? null : s("g", { class: "fm-handle" }, s("circle", { class: "fm-hit", r: 40 }), s("circle", { class: "fm-ring", r: 17 }), s("path", { class: "fm-knob", d: "M0 -11 L10 6 L-10 6 Z" }));
    if (ui.cur) ui.svg.append(ui.cur);
    ui.tbody = h("tbody");
    const rows = [];
    if (!readonly) {
      ui.add = button(v.bag, "", { onClick: () => model.setState({ add: state().cursor }) });
      ui.rem = button(v.bag, "", { onClick: () => model.setState({ remove: state().cursor }) });
      ui.mad = button(v.bag, T("mad"), { pressed: st.mad, onClick: () => model.setState({ mad: !state().mad }) });
      ui.undo = button(v.bag, T("undo"), { onClick: () => model.undo() });
      rows.push(h("div", { class: "fm-row" }, ui.add, ui.rem, ui.mad, ui.undo, button(v.bag, T("reset"), { onClick: () => model.reset() })));
    }
    put(root, ui.prompt, h("section", { class: "fm-view", "aria-label": T("plot") }, ui.svg), ...rows, h("section", { class: "fm-view", "aria-label": T("stats") }, h("div", { class: "fm-table-wrap" }, h("table", { class: "fm-table fm-stats" }, h("caption", { class: "fm-sr" }, T("stats")), ui.tbody))), ui.explain, ui.desc);
    if (readonly) return;
    v.handles.push(
      makeDraggable(ui.cur, {
        get: () => state().cursor,
        set: (x) => model.setState({ cursor: Math.round(x) }),
        min: () => state().min,
        max: () => state().max,
        step: 1,
        bigStep: 5,
        label: T("cursor"),
        valueText: () => `${state().cursor}`,
        toValue: ({ x, node }) => {
          const d = state();
          return d.min + ((toSvgX(node, x, W).x - AX.x0) / (AX.x1 - AX.x0)) * (d.max - d.min);
        },
      }),
    );
    v.bag.on(ui.cur, "keydown", (e) => {
      if (e.key === "+" || e.key === "Enter") model.setState({ add: state().cursor });
      else if (e.key === "Delete" || e.key === "Backspace" || e.key === "-") model.setState({ remove: state().cursor });
      else return;
      e.preventDefault();
    });
    // Tap an empty spot on the plot to add a dot there; drag a dot sideways to move it.
    let drag = null;
    v.bag.on(ui.svg, "click", (e) => {
      if (e.target.closest?.(".fm-dot-data") || e.target.closest?.(".fm-handle")) return;
      model.setState({ add: column(e, state()) });
    });
    v.bag.on(ui.svg, "pointerdown", (e) => {
      const dot = e.target.closest?.(".fm-dot-data");
      if (!dot || e.button) return;
      drag = Number(dot.getAttribute("data-v"));
      try {
        ui.svg.setPointerCapture?.(e.pointerId);
      } catch {
        // synthetic events carry no live pointer
      }
      model.setState({ cursor: drag });
      e.preventDefault();
    });
    v.bag.on(ui.svg, "pointermove", (e) => {
      if (drag === null) return;
      const to = column(e, state());
      if (to !== drag && model.setState({ move: { from: drag, to } })) drag = to;
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) v.bag.on(ui.svg, type, () => (drag = null));
  }

  function draw(d) {
    const g = ui.body;
    clear(g);
    const S = d.stats;
    g.append(s("line", { class: "fm-axis", x1: AX.x0 - 8, x2: AX.x1 + 8, y1: AX.base, y2: AX.base }));
    const skip = Math.ceil((d.max - d.min + 1) / 14);
    for (let k = d.min; k <= d.max; k++) {
      g.append(s("line", { class: "fm-tick", x1: X(k, d), x2: X(k, d), y1: AX.base, y2: AX.base + 6 }));
      if ((k - d.min) % skip === 0) g.append(stext(X(k, d), AX.base + 26, String(k).replace("-", MINUS), "fm-svg-text", "middle"));
    }
    const tallest = Math.max(...S.counts.values());
    const size = Math.min(20, (AX.base - 24) / tallest);
    for (const [v, c] of S.counts) {
      const out = S.outliers.includes(v);
      for (let i = 0; i < c; i++) {
        const cy = AX.base - size * (i + 0.5);
        const r = Math.max(4, size / 2 - 1);
        g.append(
          out
            ? s("rect", { class: "fm-dot-data fm-outlier", "data-v": v, x: X(v, d) - r, y: cy - r, width: 2 * r, height: 2 * r, transform: `rotate(45 ${X(v, d)} ${cy})` })
            : s("circle", { class: "fm-dot-data", "data-v": v, cx: X(v, d), cy, r }),
        );
      }
    }
    const mx = X(Number(S.mean.n) / S.mean.d, d);
    const md = X(Number(S.median.n) / S.median.d, d);
    g.append(s("line", { class: "fm-median", x1: md, x2: md, y1: 8, y2: AX.base }), s("path", { class: "fm-mean", d: `M${mx} ${AX.base + 8} l-8 14 l16 0 z` }));
    ui.cur?.setAttribute("transform", `translate(${X(d.cursor, d)} ${AX.h - 20})`);
    ui.tbody.replaceChildren();
    const rows = [
      ["n", String(S.n)],
      ["mean", exact(S.mean)],
      ["median", exact(S.median)],
      ["mode", modeText(S, L)],
      ["range", String(S.range)],
      ["q1", S.q1 ? exact(S.q1) : "–"],
      ["q3", S.q3 ? exact(S.q3) : "–"],
      ["iqr", S.iqr ? exact(S.iqr) : "–"],
      ...(d.mad ? [["madRow", exact(S.mad)]] : []),
      ["outliers", outlierText(S, L)],
    ];
    for (const [k, val] of rows) put(ui.tbody, h("tr", null, h("th", { scope: "row" }, T(k)), h("td", { class: "fm-num" }, val)));
  }

  function sync(v) {
    const d = state();
    draw(d);
    if (!readonly) {
      const c = String(d.cursor).replace("-", MINUS);
      ui.add.textContent = `${T("add")} ${c}`;
      ui.rem.textContent = `${T("remove")} ${c}`;
      ui.rem.disabled = !d.values.includes(d.cursor) || d.values.length < 2;
      ui.add.disabled = d.values.length >= MAX_DOTS;
      ui.mad.setAttribute("aria-pressed", String(d.mad));
      ui.undo.disabled = !model.canUndo();
    }
    ui.explain.textContent = model.getMathematicalExplanation(L);
    ui.desc.textContent = model.getAccessibleDescription(L);
    for (const hd of v.handles) hd.refresh();
  }

  return createView(root, model, {
    lang,
    onChange,
    cls: "fm-data",
    build,
    sync,
    say: (st, l) => t(l, { en: `${st.stats.n} dots. Mean ${exact(st.stats.mean)}, median ${num(st.stats.median)}.`, es: `${st.stats.n} puntos. Media ${exact(st.stats.mean)}, mediana ${num(st.stats.median)}.` }),
  });
}
