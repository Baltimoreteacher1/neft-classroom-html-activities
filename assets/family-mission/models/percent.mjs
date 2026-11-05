// Family "percent": whole, percent and amount as one exact state, drawn as multi-whole 10x10
// grids, a tape with one bar per whole, a double number line and editable readouts. Percents
// above 100 are first-class (150, 250, 300) and so are percents below 1 (0.5).
import {
  a11y,
  add,
  button,
  ceilRat,
  clamp,
  clear,
  cmp,
  createView,
  defineFamily,
  div,
  eq,
  field,
  floorRat,
  fmtNumber,
  frac,
  fracToString,
  h,
  isRat,
  makeDraggable,
  put,
  mul,
  s,
  sign,
  stext,
  sub,
  t,
  toDecimalString,
  toFrac,
  toNumber,
  toSvgX,
} from "./core.mjs";

export const id = "percent";
export const label = { en: "Percent models", es: "Modelos de porcentaje" };

const HUNDRED = frac(100);
const TENTH = frac(1, 10);
const MAX_WHOLE = frac(1000000);
const VIEW_KEYS = ["grid", "tape", "line", "read"];
const DEFAULT_VIEWS = { grid: true, tape: true, line: false, read: true };
const DATA_KEYS = ["whole", "unit", "percent", "decimal", "amount", "fraction"];

// ── State ────────────────────────────────────────────────────────────────────

function parseUnit(u) {
  const o = typeof u === "string" ? { en: u, es: u } : u || {};
  const en = String(o.en ?? "units");
  const out = { en, es: String(o.es ?? (o.en ? en : "unidades")) };
  if (o.oneEn) out.oneEn = String(o.oneEn);
  if (o.oneEs) out.oneEs = String(o.oneEs);
  return out;
}

function validateState(st) {
  if (!st || !isRat(st.whole) || sign(st.whole) <= 0 || cmp(st.whole, MAX_WHOLE) > 0) return false;
  if (!isRat(st.percent) || sign(st.percent) < 0) return false;
  if (!Number.isInteger(st.maxPercent) || st.maxPercent < 100 || st.maxPercent > 1000) return false;
  if (cmp(st.percent, frac(st.maxPercent)) > 0) return false;
  if (!isRat(st.minStep) || sign(st.minStep) <= 0 || cmp(st.minStep, frac(10)) > 0) return false;
  if (typeof st.fine !== "boolean" || typeof st.snap !== "boolean") return false;
  if (!st.unit || typeof st.unit.en !== "string" || typeof st.unit.es !== "string") return false;
  if (st.unit.en.length > 40 || st.unit.es.length > 40) return false;
  return !!st.views && VIEW_KEYS.every((k) => typeof st.views[k] === "boolean");
}

const wholeOf = (percent) => floorRat(div(percent, HUNDRED));

function reduce(st, patch) {
  if (!patch || typeof patch !== "object") return null;
  const next = { ...st, views: { ...st.views } };
  for (const k of Object.keys(patch)) if (!["fine", "snap", "views", ...DATA_KEYS].includes(k)) return null;
  const num = (v) => {
    const r = toFrac(v);
    return r && sign(r) >= 0 ? r : null;
  };
  if ("whole" in patch) {
    const w = num(patch.whole);
    if (!w || sign(w) === 0 || cmp(w, MAX_WHOLE) > 0) return null;
    next.whole = w;
  }
  if ("unit" in patch) next.unit = parseUnit(patch.unit);
  const asPercent = {
    percent: (v) => v,
    decimal: (v) => mul(v, HUNDRED),
    fraction: (v) => mul(v, HUNDRED),
    amount: (v) => div(mul(v, HUNDRED), next.whole),
  };
  for (const k of Object.keys(asPercent)) {
    if (!(k in patch)) continue;
    const v = num(patch[k]);
    if (!v) return null;
    next.percent = asPercent[k](v);
  }
  if ("fine" in patch) {
    next.fine = patch.fine === true;
    if (next.fine) next.snap = false;
  }
  if ("snap" in patch) next.snap = patch.snap === true && !next.fine;
  if ("views" in patch) {
    for (const [k, v] of Object.entries(patch.views || {})) {
      if (!VIEW_KEYS.includes(k)) return null;
      next.views[k] = v === true;
    }
  }
  const max = frac(next.maxPercent);
  if (cmp(next.percent, max) > 0) next.percent = max;
  return next;
}

function derive(st) {
  const share = div(st.percent, HUNDRED);
  const wholes = wholeOf(st.percent);
  return {
    ...st,
    amount: div(mul(st.whole, st.percent), HUNDRED),
    wholes,
    remainder: sub(st.percent, frac(wholes * 100)),
    grids: Math.max(1, ceilRat(share)),
    fraction: share,
    decimal: toDecimalString(share),
    step: st.fine && cmp(st.minStep, TENTH) > 0 ? TENTH : st.minStep,
  };
}

function normalize(config) {
  const c = config || {};
  const whole = toFrac(c.whole ?? 100);
  if (!whole || sign(whole) <= 0 || cmp(whole, MAX_WHOLE) > 0) throw new TypeError("percent: whole must be a positive number");
  const maxPercent = c.maxPercent == null ? 400 : c.maxPercent;
  if (!Number.isInteger(maxPercent) || maxPercent < 100 || maxPercent > 1000) throw new TypeError("percent: maxPercent must be an integer from 100 to 1000");
  const percent = toFrac(c.percent ?? 0);
  if (!percent || sign(percent) < 0) throw new TypeError("percent: percent must be 0 or more");
  const minStep = toFrac(c.minStep ?? 1);
  const fine = c.fine === true;
  const state = {
    whole,
    unit: parseUnit(c.unit),
    percent: cmp(percent, frac(maxPercent)) > 0 ? frac(maxPercent) : percent,
    maxPercent,
    minStep,
    fine,
    snap: c.snap !== false && !fine,
    views: { ...DEFAULT_VIEWS, ...(c.views || {}) },
  };
  if (!validateState(state)) throw new TypeError("percent: invalid configuration");
  return { state, task: c.task || null };
}

// ── Words ────────────────────────────────────────────────────────────────────

const num = fmtNumber;
const pct = (r) => `${num(r)}%`;

function unitWord(st, lang, amount) {
  const one = eq(amount, frac(1));
  return t(lang, {
    en: one && st.unit.oneEn ? st.unit.oneEn : st.unit.en,
    es: one && st.unit.oneEs ? st.unit.oneEs : st.unit.es,
  });
}

function wholesPhrase(lang, d) {
  const r = d.remainder;
  const half = eq(r, frac(50));
  const plural = d.wholes > 1;
  if (lang === "es") {
    const head = `${d.wholes} ${plural ? "totales" : "total"}`;
    if (sign(r) === 0) return head;
    return `${head} y ${half ? "la mitad de otro total" : `${pct(r)} de otro total`}`;
  }
  const head = `${d.wholes} whole${plural ? "s" : ""}`;
  if (sign(r) === 0) return head;
  return `${head} and ${half ? "half of another whole" : `${pct(r)} of another whole`}`;
}

function describe(st, lang) {
  const d = derive(st);
  const W = `${num(st.whole)} ${unitWord(st, lang, st.whole)}`;
  const A = `${num(d.amount)} ${unitWord(st, lang, d.amount)}`;
  const part = d.wholes >= 1 ? wholesPhrase(lang, d) : t(lang, { en: "part of one whole", es: "una parte del total" });
  return { d, W, A, part };
}

function accessibleDescription(st, lang) {
  const { d, W, A, part } = describe(st, lang);
  return t(lang, {
    en: `Percent model. The whole, 100%, is ${W}. The shaded part is ${pct(d.percent)}, which is ${A}: ${part}. It shows ${d.grids} grid${d.grids > 1 ? "s" : ""} and ${d.grids} bar${d.grids > 1 ? "s" : ""}.`,
    es: `Modelo de porcentaje. El total, 100%, es ${W}. La parte sombreada es ${pct(d.percent)}, que son ${A}: ${part}. Muestra ${d.grids} ${d.grids > 1 ? "cuadrículas" : "cuadrícula"} y ${d.grids} ${d.grids > 1 ? "cintas" : "cinta"}.`,
  });
}

function explanation(st, lang) {
  const { d, W, A } = describe(st, lang);
  const P = pct(d.percent);
  const lines = [];
  lines.push(
    t(lang, {
      en: `${P} of ${W} is ${A}.`,
      es: `${P} de ${W} ${eq(d.amount, frac(1)) ? "es" : "son"} ${A}.`,
    }),
  );
  const hundredFor = d.wholes * 100;
  if (eq(d.percent, HUNDRED)) {
    lines.push(t(lang, { en: "100% is exactly one whole.", es: "100% es exactamente un total." }));
  } else if (d.wholes >= 1) {
    const sum = sign(d.remainder) === 0 ? `${d.wholes} × 100 = ${num(d.percent)}` : `${hundredFor} + ${num(d.remainder)} = ${num(d.percent)}`;
    lines.push(
      t(lang, {
        en: `${P} is ${wholesPhrase("en", d)}, because ${sum}.`,
        es: `${P} es ${wholesPhrase("es", d)}, porque ${sum}.`,
      }),
    );
  } else if (sign(d.percent) === 0) {
    lines.push(t(lang, { en: "0% is none of the whole.", es: "0% es nada del total." }));
  } else if (cmp(d.percent, frac(1)) < 0) {
    lines.push(
      t(lang, {
        en: `${P} is less than 1%: less than one cell of the 10 by 10 grid.`,
        es: `${P} es menos de 1%: menos de una celda de la cuadrícula de 10 por 10.`,
      }),
    );
  } else {
    lines.push(
      t(lang, {
        en: `${P} is less than the whole, so ${A} is less than ${W}.`,
        es: `${P} es menos que el total, así que ${A} es menos que ${W}.`,
      }),
    );
  }
  const dec = d.decimal;
  lines.push(
    t(lang, {
      en: `As a fraction, ${P} = ${fracToString(d.fraction)}${dec ? `, which is ${dec} as a decimal` : ""}.`,
      es: `Como fracción, ${P} = ${fracToString(d.fraction)}${dec ? `, que es ${dec} como decimal` : ""}.`,
    }),
  );
  return lines.join(" ");
}

// ── validate(task) ───────────────────────────────────────────────────────────

const R = (x) => toFrac(x);
const maybe = (fn) => {
  try {
    return fn();
  } catch {
    return null;
  }
};

const near = (a, b) => {
  const d = sub(a, b);
  return cmp(frac(Math.abs(d.n), d.d), frac(1, 100)) <= 0;
};

/** Wrong answers that match a known pattern. Always "possible", never certain. */
function misconceptionFor(task, expected, given, parts) {
  const pow = (k) => [div(expected, frac(k)), mul(expected, frac(k))];
  const hit = (list) => list.some((v) => v && eq(v, given));
  if (task.kind === "find-percent") {
    if (cmp(expected, HUNDRED) > 0 && eq(given, HUNDRED)) return "percent-capped-at-100";
    if (eq(given, parts.amount)) return "percent-vs-quantity";
    const reversed = maybe(() => div(mul(parts.whole, HUNDRED), parts.amount));
    if (reversed && near(reversed, given)) return "wrong-whole";
  } else if (task.kind === "find-amount") {
    if (cmp(expected, parts.whole) > 0 && eq(given, parts.whole)) return "percent-capped-at-100";
    if (eq(given, parts.percent)) return "percent-vs-quantity";
  } else if (task.kind === "find-whole") {
    if (hit([div(mul(parts.amount, parts.percent), HUNDRED)])) return "wrong-whole";
    if (eq(given, parts.percent)) return "percent-vs-quantity";
  }
  if (sign(given) > 0 && hit([...pow(10), ...pow(100)])) return "decimal-place";
  return null;
}

function validateTask(st, task) {
  if (!task) return { ok: false, reason: "no-task", misconception: null };
  const d = derive(st);
  const none = (reason, ok = false) => ({ ok, reason, misconception: null });
  if (task.kind === "predict") {
    const p = R(task.percent);
    if (!p || sign(p) < 0) return none("invalid-task");
    const expected = cmp(p, HUNDRED) < 0 ? "less" : eq(p, HUNDRED) ? "equal" : "more";
    if (!["less", "equal", "more"].includes(task.answer)) return none("invalid-answer");
    if (task.answer === expected) return none("correct", true);
    const m = expected === "more" && task.answer === "equal" ? "percent-capped-at-100" : null;
    return { ok: false, reason: "incorrect", misconception: m && { id: m, confidence: "possible" } };
  }
  const given0 = task.answer !== undefined ? R(task.answer) : null;
  const tw = R(task.whole);
  const ta = R(task.amount);
  const tp = R(task.percent);
  let expected;
  let current;
  try {
    if (task.kind === "find-percent") {
      expected = div(mul(ta, HUNDRED), tw);
      if (task.answer === undefined && !eq(st.whole, tw)) return none("whole-mismatch");
      current = d.percent;
    } else if (task.kind === "find-amount") {
      expected = div(mul(tw, tp), HUNDRED);
      if (task.answer === undefined && !eq(st.whole, tw)) return none("whole-mismatch");
      current = d.amount;
    } else if (task.kind === "find-whole") {
      expected = div(mul(ta, HUNDRED), tp);
      current = st.whole;
    } else {
      return none("invalid-task");
    }
  } catch {
    return none("invalid-task");
  }
  if (task.answer !== undefined && (!given0 || sign(given0) < 0)) return none("invalid-answer");
  const given = task.answer !== undefined ? given0 : current;
  if (eq(given, expected)) return none("correct", true);
  const id = misconceptionFor(task, expected, given, { whole: tw, amount: ta, percent: tp });
  return { ok: false, reason: "incorrect", misconception: id && { id, confidence: "possible" } };
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
  track: (patch) => Object.keys(patch).some((k) => DATA_KEYS.includes(k)),
  describeConfig: (st) => ({
    whole: num(st.whole),
    unit: st.unit,
    percent: num(st.percent),
    maxPercent: st.maxPercent,
    minStep: num(st.minStep),
    views: st.views,
  }),
});

// ── Rendering ────────────────────────────────────────────────────────────────

const STR = {
  views: { en: "Show", es: "Mostrar" },
  grid: { en: "Grids", es: "Cuadrículas" },
  tape: { en: "Tape", es: "Cinta" },
  line: { en: "Double number line", es: "Recta numérica doble" },
  read: { en: "Numbers", es: "Números" },
  whole: { en: "Whole (100%)", es: "Total (100%)" },
  percent: { en: "Percent", es: "Porcentaje" },
  amount: { en: "Amount", es: "Cantidad" },
  decimal: { en: "Decimal", es: "Decimal" },
  fraction: { en: "Fraction", es: "Fracción" },
  goal: { en: "Goal reached (100%)", es: "Meta lograda (100%)" },
  double: { en: "Double (200%)", es: "El doble (200%)" },
  half: { en: "Half (50%)", es: "La mitad (50%)" },
  undo: { en: "Undo", es: "Deshacer" },
  reset: { en: "Start over", es: "Empezar de nuevo" },
  snap: { en: "Snap to 5%", es: "Saltar de 5 en 5" },
  fine: { en: "Zoom into 1 cell", es: "Acercar 1 celda" },
  less: { en: "Make the whole 1 smaller", es: "Quita 1 al total" },
  more: { en: "Make the whole 1 bigger", es: "Suma 1 al total" },
  invalid: { en: "Type a number like 150, 1.5 or 3/2.", es: "Escribe un número como 150, 1.5 o 3/2." },
  handle: {
    en: "Shaded amount. Drag, or use the arrow keys, to change the percent.",
    es: "Cantidad sombreada. Arrastra, o usa las flechas, para cambiar el porcentaje.",
  },
  zoom: {
    en: "One cell zoomed in. Each strip is 0.1%.",
    es: "Una celda ampliada. Cada franja es 0.1%.",
  },
};

const TAPE = { w: 360, x: 14, bw: 270, bh: 26, gap: 8 };
const LINE = { w: 360, x0: 20, x1: 340, top: 44, bottom: 96, h: 146 };
const GRID_LINES = Array.from({ length: 11 }, (_, i) => `M2 ${2 + i * 10}H102M${2 + i * 10} 2V102`).join("");
let uid = 0;

const stepNum = (d) => toNumber(d.step);
const ticksOf = (d) => Number(toNumber(div(d.percent, d.step)).toFixed(6));
const maxTicks = (d) => Number(toNumber(div(frac(d.maxPercent), d.step)).toFixed(6));
const fillOf = (percent, i) => {
  const f = sub(percent, frac(i * 100));
  return sign(f) < 0 ? frac(0) : cmp(f, HUNDRED) > 0 ? HUNDRED : f;
};

export function mount(root, model, { lang = "en", onChange, readonly = false } = {}) {
  const id0 = `fmp${++uid}`;
  let bag;
  let cur;
  let L = lang;
  let ui = {};

  const state = () => model.getState();
  const T = (k) => t(L, STR[k]);

  function setPercentFromTicks(ticks, source) {
    const d = state();
    let v = ticks;
    if (source === "pointer") {
      v = Math.round(v);
      if (d.snap && !d.fine) v = Math.round((v * stepNum(d)) / 5) * (5 / stepNum(d));
    }
    const p = toFrac(Number(v.toFixed(6)));
    if (p) model.setState({ percent: mul(p, d.step) });
  }

  function dragConfig(node, kind) {
    const base = {
      get: () => ticksOf(state()),
      set: setPercentFromTicks,
      min: 0,
      max: () => maxTicks(state()),
      step: 1,
      bigStep: () => toNumber(div(frac(10), state().step)),
      label: T("handle"),
      ariaNow: (v) => Number((v * stepNum(state())).toFixed(6)),
      valueText: () => {
        const d = state();
        return `${pct(d.percent)}, ${num(d.amount)} ${unitWord(d, L, d.amount)}`;
      },
    };
    if (kind === "tape") {
      base.toValue = ({ x, start, node: n }) => {
        const d = state();
        const dx = (toSvgX(n, x, TAPE.w).x - toSvgX(n, start.x, TAPE.w).x) / (TAPE.bw / 100);
        return start.value + dx / stepNum(d);
      };
    } else {
      base.aria = false;
      base.toValue = ({ x, node: n }) => {
        const d = state();
        const p = ((toSvgX(n, x, LINE.w).x - LINE.x0) / (LINE.x1 - LINE.x0)) * d.maxPercent;
        return p / stepNum(d);
      };
    }
    return makeDraggable(node, base);
  }

  function commit(key, input, f) {
    const ok = model.setState({ [key]: input });
    f.invalid(!ok);
    ui.msg.textContent = ok ? "" : T("invalid");
    if (ok) sync(cur, true);
  }

  function readoutField(key, labelKey) {
    const f = field(bag, {
      id: `${id0}-${key}`,
      label: T(labelKey),
      readonly,
      onCommit: (v) => commit(key, v, f),
    });
    return f;
  }

  function build(v) {
    bag = v.bag;
    cur = v;
    L = v.lang;
    ui = {};
    const task = model.task;
    ui.prompt = task?.prompt ? h("p", { class: "fm-prompt" }, t(L, task.prompt)) : null;
    ui.explain = h("p", { class: "fm-explain" });
    ui.msg = h("p", { class: "fm-msg", role: "status" });
    ui.desc = h("p", { class: "fm-sr" });

    ui.tapeSvg = s("svg", { class: "fm-svg", viewBox: `0 0 ${TAPE.w} 80`, role: "group", "aria-label": T("tape") });
    ui.bars = s("g");
    ui.tapeHandle = readonly ? null : s("g", { class: "fm-handle" }, s("circle", { class: "fm-hit", r: 40 }), s("circle", { class: "fm-ring", r: 17 }), s("circle", { class: "fm-knob", r: 10 }));
    ui.tapeSvg.append(ui.bars);
    if (ui.tapeHandle) ui.tapeSvg.append(ui.tapeHandle);

    ui.grids = h("div", { class: "fm-grids" });
    ui.zoom = h("div", { class: "fm-zoom" });
    ui.lineSvg = s("svg", { class: "fm-svg", viewBox: `0 0 ${LINE.w} ${LINE.h}`, role: "group", "aria-label": T("line") });
    ui.lineBody = s("g");
    ui.lineHandle = readonly ? null : s("g", { class: "fm-handle" }, s("circle", { class: "fm-hit", r: 40 }), s("circle", { class: "fm-knob", r: 10 }));
    ui.lineSvg.append(ui.lineBody);
    if (ui.lineHandle) ui.lineSvg.append(ui.lineHandle);

    const section = (key, ...kids) => {
      const el = h("section", { class: `fm-view fm-view-${key}`, "aria-label": T(key) }, ...kids);
      ui[`sec_${key}`] = el;
      return el;
    };

    ui.f = {};
    for (const k of ["percent", "amount", "decimal", "fraction"]) ui.f[k] = readoutField(k, k);
    ui.f.whole = readoutField("whole", "whole");
    const controls = [];
    if (!readonly) {
      const chip = (key, patch, cls = "") => button(bag, T(key), { onClick: () => model.setState(patch), cls });
      ui.less = button(bag, "−", { ariaLabel: T("less"), cls: "fm-step", onClick: () => model.setState({ whole: sub(state().whole, frac(1)) }) });
      ui.more = button(bag, "+", { ariaLabel: T("more"), cls: "fm-step", onClick: () => model.setState({ whole: add(state().whole, frac(1)) }) });
      ui.snapBtn = button(bag, T("snap"), { pressed: state().snap, onClick: () => model.setState({ snap: !state().snap }) });
      ui.fineBtn = button(bag, T("fine"), { pressed: state().fine, onClick: () => model.setState({ fine: !state().fine }) });
      ui.undoBtn = button(bag, T("undo"), { onClick: () => model.undo() });
      controls.push(
        h("div", { class: "fm-row fm-presets" }, chip("goal", { percent: 100 }), chip("double", { percent: 200 }), chip("half", { percent: 50 })),
        h("div", { class: "fm-row" }, ui.snapBtn, ui.fineBtn, ui.undoBtn, button(bag, T("reset"), { onClick: () => model.reset() })),
      );
    }

    ui.toggles = readonly
      ? null
      : h(
          "div",
          { class: "fm-row fm-toggles", role: "group", "aria-label": T("views") },
          ...VIEW_KEYS.map((k) => {
            const b = button(bag, T(k), { pressed: state().views[k], onClick: () => model.setState({ views: { [k]: !state().views[k] } }) });
            ui[`tog_${k}`] = b;
            return b;
          }),
        );

    put(
      root,
      ui.prompt,
      ui.toggles,
      section("tape", ui.tapeSvg),
      section("grid", ui.grids, ui.zoom),
      section(
        "line",
        ui.lineSvg,
        h("p", { class: "fm-cap" }, t(L, { en: "Top line: amount. Bottom line: percent.", es: "Recta de arriba: cantidad. Recta de abajo: porcentaje." })),
      ),
      section(
        "read",
        h("div", { class: "fm-fields" }, ui.f.percent.el, ui.f.amount.el, ui.f.decimal.el, ui.f.fraction.el),
        h("div", { class: "fm-fields fm-whole" }, ui.f.whole.el, readonly ? null : h("div", { class: "fm-row" }, ui.less, ui.more)),
        ...controls,
      ),
      ui.msg,
      ui.explain,
      ui.desc,
    );
    if (ui.tapeHandle) v.handles.push(dragConfig(ui.tapeHandle, "tape"));
    if (ui.lineHandle) v.handles.push(dragConfig(ui.lineHandle, "line"));
  }

  function drawTape(d) {
    clear(ui.bars);
    const rows = d.grids;
    const H = 10 + rows * (TAPE.bh + TAPE.gap);
    ui.tapeSvg.setAttribute("viewBox", `0 0 ${TAPE.w} ${H}`);
    let last = { x: TAPE.x, y: 0 };
    for (let i = 0; i < rows; i++) {
      const y = 6 + i * (TAPE.bh + TAPE.gap);
      const f = fillOf(d.percent, i);
      const w = (toNumber(f) / 100) * TAPE.bw;
      ui.bars.append(
        s("rect", { class: "fm-tape-bg", x: TAPE.x, y, width: TAPE.bw, height: TAPE.bh }),
        s("rect", { class: "fm-fill", x: TAPE.x, y, width: w, height: TAPE.bh }),
        s("rect", { class: "fm-tape-ref", x: TAPE.x, y, width: TAPE.bw, height: TAPE.bh }),
        stext(TAPE.x + TAPE.bw + 6, y + TAPE.bh / 2 + 5, pct(f), "fm-svg-text"),
      );
      last = { x: TAPE.x + w, y: y + TAPE.bh / 2 };
    }
    ui.tapeHandle?.setAttribute("transform", `translate(${last.x} ${last.y})`);
  }

  function gridSvg(d, g) {
    const f = fillOf(d.percent, g);
    const cells = floorRat(f);
    const part = toNumber(sub(f, frac(cells)));
    const rows = Math.floor(cells / 10);
    const cols = cells % 10;
    const svg = s("svg", {
      class: "fm-grid",
      viewBox: "0 0 104 104",
      role: "img",
      "aria-label": t(L, {
        en: `Grid ${g + 1} of ${d.grids}: ${num(f)} of 100 cells shaded`,
        es: `Cuadrícula ${g + 1} de ${d.grids}: ${num(f)} de 100 celdas sombreadas`,
      }),
    });
    svg.append(s("rect", { class: "fm-grid-bg", x: 2, y: 2, width: 100, height: 100 }));
    if (rows) svg.append(s("rect", { class: "fm-fill", x: 2, y: 102 - rows * 10, width: 100, height: rows * 10 }));
    if (cols) svg.append(s("rect", { class: "fm-fill", x: 2, y: 92 - rows * 10, width: cols * 10, height: 10 }));
    if (part > 0 && cells < 100) {
      svg.append(s("rect", { class: "fm-fill", x: 2 + cols * 10, y: 102 - (rows + 1) * 10 + 10 * (1 - part), width: 10, height: 10 * part }));
    }
    svg.append(s("path", { class: "fm-grid-lines", d: GRID_LINES }), s("rect", { class: "fm-grid-edge", x: 2, y: 2, width: 100, height: 100 }));
    if (d.fine && g === d.grids - 1) {
      const c = Math.min(99, cells);
      svg.append(s("rect", { class: "fm-zoomcell", x: 2 + (c % 10) * 10, y: 92 - Math.floor(c / 10) * 10, width: 10, height: 10 }));
    }
    return h("figure", { class: "fm-grid-fig" }, svg, h("figcaption", { class: "fm-cap" }, pct(f)));
  }

  function drawGrids(d) {
    clear(ui.grids);
    for (let g = 0; g < d.grids; g++) ui.grids.append(gridSvg(d, g));
    clear(ui.zoom);
    if (!d.fine) return;
    const r = sub(d.percent, frac((d.grids - 1) * 100));
    const c = Math.min(99, floorRat(r));
    const inCell = toNumber(sub(r, frac(c)));
    const svg = s("svg", { class: "fm-zoom-svg", viewBox: "0 0 300 44", role: "img", "aria-label": T("zoom") });
    for (let i = 0; i < 10; i++) {
      const fill = clamp(inCell * 10 - i, 0, 1);
      svg.append(s("rect", { class: "fm-grid-bg", x: 2 + i * 29, y: 2, width: 29, height: 40 }));
      if (fill > 0) svg.append(s("rect", { class: "fm-fill", x: 2 + i * 29, y: 2, width: 29 * fill, height: 40 }));
      svg.append(s("rect", { class: "fm-grid-edge", x: 2 + i * 29, y: 2, width: 29, height: 40 }));
    }
    ui.zoom.append(svg, h("p", { class: "fm-cap" }, T("zoom")));
  }

  function drawLine(d) {
    clear(ui.lineBody);
    const X = (p) => LINE.x0 + ((LINE.x1 - LINE.x0) * p) / d.maxPercent;
    const count = Math.floor(d.maxPercent / 100);
    const skip = Math.ceil((count + 1) / 6);
    const g = ui.lineBody;
    g.append(
      s("line", { class: "fm-axis", x1: LINE.x0, x2: LINE.x1, y1: LINE.top, y2: LINE.top }),
      s("line", { class: "fm-axis", x1: LINE.x0, x2: LINE.x1, y1: LINE.bottom, y2: LINE.bottom }),
    );
    for (let k = 0; k <= count; k++) {
      const x = X(k * 100);
      g.append(
        s("line", { class: "fm-tick", x1: x, x2: x, y1: LINE.top - 7, y2: LINE.top + 7 }),
        s("line", { class: "fm-tick", x1: x, x2: x, y1: LINE.bottom - 7, y2: LINE.bottom + 7 }),
      );
      if (k % skip === 0) {
        g.append(
          stext(x, LINE.top - 10, num(mul(d.whole, frac(k))), "fm-svg-text", "middle"),
          stext(x, LINE.bottom + 24, `${k * 100}%`, "fm-svg-text", "middle"),
        );
      }
    }
    const x = X(toNumber(d.percent));
    const lx = clamp(x, 34, LINE.w - 34);
    g.append(
      s("line", { class: "fm-connector", x1: x, x2: x, y1: LINE.top, y2: LINE.bottom }),
      s("circle", { class: "fm-dot", cx: x, cy: LINE.top, r: 6 }),
      stext(lx, LINE.top - 28, num(d.amount), "fm-svg-text fm-svg-strong", "middle"),
      stext(lx, LINE.bottom + 52, pct(d.percent), "fm-svg-text fm-svg-strong", "middle"),
    );
    ui.lineHandle?.setAttribute("transform", `translate(${x} ${LINE.bottom})`);
  }

  function sync(v, force) {
    const d = state();
    for (const k of VIEW_KEYS) {
      ui[`sec_${k}`].hidden = !d.views[k];
      ui[`tog_${k}`]?.setAttribute("aria-pressed", String(d.views[k]));
    }
    ui.snapBtn?.setAttribute("aria-pressed", String(d.snap));
    ui.fineBtn?.setAttribute("aria-pressed", String(d.fine));
    if (ui.snapBtn) ui.snapBtn.disabled = d.fine;
    if (ui.undoBtn) ui.undoBtn.disabled = !model.canUndo();
    if (ui.less) ui.less.disabled = cmp(d.whole, frac(1)) <= 0;
    if (d.views.tape) drawTape(d);
    if (d.views.grid) drawGrids(d);
    if (d.views.line) drawLine(d);
    ui.f.percent.set(num(d.percent), force);
    ui.f.amount.set(num(d.amount), force);
    ui.f.decimal.set(d.decimal ?? fracToString(d.fraction), force);
    ui.f.fraction.set(fracToString(d.fraction), force);
    ui.f.whole.set(num(d.whole), force);
    ui.explain.textContent = model.getMathematicalExplanation(L);
    ui.desc.textContent = model.getAccessibleDescription(L);
    for (const hd of v.handles) hd.refresh();
  }

  return createView(root, model, {
    lang,
    onChange,
    cls: "fm-percent",
    build,
    sync,
    say: (st, l) => `${pct(st.percent)}, ${num(st.amount)} ${unitWord(st, l, st.amount)}`,
  });
}
