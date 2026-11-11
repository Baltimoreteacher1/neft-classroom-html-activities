// Family "exponents": repeated multiplication (b^n), growth columns, factor chains, and
// order-of-operations expressions (a + m × b^n), with a side-by-side comparison against the
// common base × exponent (b × n) multiplier misconception.
import {
  a11y,
  button,
  clamp,
  clear,
  createView,
  defineFamily,
  eq,
  field,
  frac,
  fracToString,
  h,
  isInt,
  isRat,
  makeDraggable,
  put,
  s,
  stext,
  t,
  toFrac,
  toNumber,
  toSvgX,
} from "./core.mjs";

export const id = "exponents";
export const label = { en: "Exponent & growth models", es: "Modelos de exponentes y crecimiento" };

const MODES = ["powers", "order"];
const VIEW_KEYS = ["visual", "factors", "table", "compare"];
const DEFAULT_VIEWS = { visual: true, factors: true, table: true, compare: true };
const ACTIONS = ["base", "exponent", "addend", "multiplier", "compare", "prediction", "views"];

// ── State ────────────────────────────────────────────────────────────────────

function validateState(st) {
  if (!st || !MODES.includes(st.mode)) return false;
  if (!Number.isInteger(st.base) || st.base < 1 || st.base > 10) return false;
  if (!Number.isInteger(st.exponent) || st.exponent < 0 || st.exponent > 6) return false;
  if (!Number.isInteger(st.maxExponent) || st.maxExponent < 3 || st.maxExponent > 6) return false;
  if (st.exponent > st.maxExponent) return false;
  if (!Number.isInteger(st.addend) || st.addend < 0 || st.addend > 50) return false;
  if (!Number.isInteger(st.multiplier) || st.multiplier < 1 || st.multiplier > 12) return false;
  if (typeof st.compare !== "boolean") return false;
  if (st.prediction !== null && !["multiply", "add", "linear"].includes(st.prediction)) return false;
  return !!st.views && VIEW_KEYS.every((k) => typeof st.views[k] === "boolean");
}

function powInt(b, e) {
  let out = 1;
  for (let i = 0; i < e; i++) out *= b;
  return out;
}

function derive(st) {
  const b = st.base;
  const e = st.exponent;
  const power = powInt(b, e);
  const additive = b * e;
  const swapped = powInt(e, b);
  const factors = e === 0 ? [1] : Array.from({ length: e }, () => b);
  const factorsChain = e === 0 ? "1" : e === 1 ? String(b) : factors.join(" × ");
  const growthSteps = [];
  for (let step = 0; step <= st.maxExponent; step++) {
    growthSteps.push({
      step,
      value: powInt(b, step),
      linearValue: b * step,
      active: step === e,
    });
  }
  const expCap = Math.min(e, 4);
  const expTerm = powInt(b, expCap);
  const orderProduct = st.multiplier * expTerm;
  const orderCorrect = st.addend + orderProduct;
  const orderLeftToRightTrap = (st.addend + st.multiplier) * expTerm;
  const orderMultiplyBaseTrap = st.addend + st.multiplier * (b * expCap);
  return {
    ...st,
    power,
    additive,
    swapped,
    factors,
    factorsChain,
    growthSteps,
    expCap,
    expTerm,
    orderProduct,
    orderCorrect,
    orderLeftToRightTrap,
    orderMultiplyBaseTrap,
  };
}

function normalize(config) {
  const c = config || {};
  const mode = c.mode === "order" ? "order" : "powers";
  const intIn = (v, def, lo, hi, name) => {
    if (v === undefined || v === null) return def;
    const r = toFrac(v);
    if (!r || !isInt(r)) throw new TypeError(`exponents: ${name} must be an integer`);
    const n = toNumber(r);
    if (n < lo || n > hi) throw new RangeError(`exponents: ${name} out of range`);
    return n;
  };
  const maxExponent = intIn(c.maxExponent, 5, 3, 6, "maxExponent");
  const base = intIn(c.base, 2, 1, 10, "base");
  const exponent = intIn(c.exponent, 3, 0, maxExponent, "exponent");
  const addend = intIn(c.addend, 4, 0, 50, "addend");
  const multiplier = intIn(c.multiplier, 3, 1, 12, "multiplier");
  const compare = c.compare !== false;
  const views = { ...DEFAULT_VIEWS, ...(c.views || {}) };
  const state = {
    mode,
    base,
    exponent,
    maxExponent,
    addend,
    multiplier,
    compare: Boolean(compare),
    prediction: null,
    views,
  };
  if (!validateState(state)) throw new TypeError("exponents: invalid configuration");
  return { state, task: c.task || null };
}

function reduce(st, patch) {
  if (!patch || typeof patch !== "object") return null;
  if (Object.keys(patch).some((k) => !ACTIONS.includes(k))) return null;
  const next = { ...st, views: { ...st.views } };
  const intOf = (v) => {
    const r = toFrac(v);
    return r && isInt(r) ? toNumber(r) : null;
  };
  if ("base" in patch) {
    const b = intOf(patch.base);
    if (b === null || b < 1 || b > 10) return null;
    next.base = b;
  }
  if ("exponent" in patch) {
    const e = intOf(patch.exponent);
    if (e === null || e < 0 || e > next.maxExponent) return null;
    next.exponent = e;
  }
  if ("addend" in patch) {
    const a = intOf(patch.addend);
    if (a === null || a < 0 || a > 50) return null;
    next.addend = a;
  }
  if ("multiplier" in patch) {
    const m = intOf(patch.multiplier);
    if (m === null || m < 1 || m > 12) return null;
    next.multiplier = m;
  }
  if ("compare" in patch) {
    next.compare = patch.compare === true;
  }
  if ("prediction" in patch) {
    if (patch.prediction !== null && !["multiply", "add", "linear"].includes(patch.prediction)) return null;
    next.prediction = patch.prediction;
  }
  if ("views" in patch && patch.views && typeof patch.views === "object") {
    for (const [k, v] of Object.entries(patch.views)) {
      if (!VIEW_KEYS.includes(k)) return null;
      next.views[k] = Boolean(v);
    }
  }
  return validateState(next) ? next : null;
}

// ── Words & Explanations ─────────────────────────────────────────────────────

function accessibleDescription(st, lang) {
  const d = derive(st);
  if (d.mode === "order") {
    return t(lang, {
      en: `Order of operations model. The expression is ${d.addend} + ${d.multiplier} × ${d.base}^${d.expCap}. Evaluating the exponent first gives ${d.expTerm}, multiplying by ${d.multiplier} gives ${d.orderProduct}, and adding ${d.addend} gives ${d.orderCorrect}.`,
      es: `Modelo de orden de operaciones. La expresión es ${d.addend} + ${d.multiplier} × ${d.base}^${d.expCap}. Evaluar el exponente primero da ${d.expTerm}, multiplicar por ${d.multiplier} da ${d.orderProduct}, y sumar ${d.addend} da ${d.orderCorrect}.`,
    });
  }
  return t(lang, {
    en: `Exponent growth model. Base ${d.base} to the power of ${d.exponent} equals ${d.factorsChain} = ${d.power}. Comparing with ${d.base} times ${d.exponent} gives ${d.additive}.`,
    es: `Modelo de crecimiento exponencial. Base ${d.base} elevada a ${d.exponent} es igual a ${d.factorsChain} = ${d.power}. Comparado con ${d.base} por ${d.exponent} que da ${d.additive}.`,
  });
}

function explanation(st, lang) {
  const d = derive(st);
  if (d.mode === "order") {
    return t(lang, {
      en: `In ${d.addend} + ${d.multiplier} × ${d.base}^${d.expCap}, evaluate the exponent first (${d.base}^${d.expCap} = ${d.expTerm}), then multiply (${d.multiplier} × ${d.expTerm} = ${d.orderProduct}), and add last (${d.addend} + ${d.orderProduct} = ${d.orderCorrect}). Adding ${d.addend} + ${d.multiplier} first would give ${d.orderLeftToRightTrap}, which only works if parentheses are around ${d.addend} + ${d.multiplier}.`,
      es: `En ${d.addend} + ${d.multiplier} × ${d.base}^${d.expCap}, evalúa el exponente primero (${d.base}^${d.expCap} = ${d.expTerm}), luego multiplica (${d.multiplier} × ${d.expTerm} = ${d.orderProduct}), y suma al final (${d.addend} + ${d.orderProduct} = ${d.orderCorrect}). Sumar ${d.addend} + ${d.multiplier} primero daría ${d.orderLeftToRightTrap}, lo cual solo ocurre si hay paréntesis alrededor de ${d.addend} + ${d.multiplier}.`,
    });
  }
  if (d.exponent === 0) {
    return t(lang, {
      en: `${d.base}^0 = 1. Every time the exponent decreases by 1, we divide by ${d.base} (${d.base}^1 ÷ ${d.base} = 1). A zero exponent never makes a positive base equal 0.`,
      es: `${d.base}^0 = 1. Cada vez que el exponente disminuye en 1, dividimos entre ${d.base} (${d.base}^1 ÷ ${d.base} = 1). Un exponente cero nunca hace que una base positiva sea igual a 0.`,
    });
  }
  return t(lang, {
    en: `${d.base}^${d.exponent} means multiplying ${d.exponent} factors of ${d.base}: ${d.factorsChain} = ${d.power}. Each +1 step on the exponent multiplies the total by ${d.base}, whereas ${d.base} × ${d.exponent} = ${d.additive} only adds ${d.base} each time.`,
    es: `${d.base}^${d.exponent} significa multiplicar ${d.exponent} factores de ${d.base}: ${d.factorsChain} = ${d.power}. Cada paso de +1 en el exponente multiplica el total por ${d.base}, mientras que ${d.base} × ${d.exponent} = ${d.additive} solo suma ${d.base} cada vez.`,
  });
}

// ── validate(task) ───────────────────────────────────────────────────────────

function validateTask(st, task) {
  const none = (reason, ok = false) => ({ ok, reason, misconception: null });
  const wrong = (m) => ({ ok: false, reason: "incorrect", misconception: m ? { id: m, confidence: "high" } : null });
  if (!task || typeof task !== "object") return none("no-task");
  const d = derive(st);

  if (task.kind === "evaluate-power") {
    const b = Number.isInteger(task.base) ? task.base : d.base;
    const e = Number.isInteger(task.exponent) ? task.exponent : d.exponent;
    if (b < 1 || e < 0) return none("invalid-task");
    const want = frac(powInt(b, e));
    const given = toFrac(task.answer !== undefined ? task.answer : d.power);
    if (!given) return none("invalid-answer");
    if (eq(given, want)) return none("correct", true);
    if (e > 1 && eq(given, frac(b * e))) return wrong("exponent-as-multiplier");
    if (e > 1 && b !== e && eq(given, frac(powInt(e, b)))) return wrong("swapped-base-exponent");
    if (e === 0 && eq(given, frac(0))) return wrong("zero-power-is-zero");
    if (e === 0 && eq(given, frac(b))) return wrong("zero-power-is-base");
    return wrong(null);
  }

  if (task.kind === "reach-power") {
    const target = toFrac(task.target);
    if (!target) return none("invalid-task");
    const current = frac(d.power);
    if (eq(current, target)) {
      if (Number.isInteger(task.base) && d.base !== task.base) return wrong("different-base");
      return none("correct", true);
    }
    if (d.exponent > 1 && eq(frac(d.additive), target)) return wrong("exponent-as-multiplier");
    return wrong(null);
  }

  if (task.kind === "evaluate-order") {
    const want = frac(d.orderCorrect);
    const given = toFrac(task.answer !== undefined ? task.answer : d.orderCorrect);
    if (!given) return none("invalid-answer");
    if (eq(given, want)) return none("correct", true);
    if (eq(given, frac(d.orderLeftToRightTrap))) return wrong("left-to-right-before-exponent");
    if (eq(given, frac(d.orderMultiplyBaseTrap))) return wrong("exponent-as-multiplier");
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
  track: (patch) => !("views" in patch) && !("prediction" in patch),
  describeConfig: (st) => ({
    mode: st.mode,
    base: fracToString(frac(st.base)),
    exponent: fracToString(frac(st.exponent)),
    maxExponent: st.maxExponent,
    compare: st.compare,
  }),
});

// ── Rendering ────────────────────────────────────────────────────────────────

const STR = {
  titlePowers: { en: "Exponential growth vs. multiplier trap", es: "Crecimiento exponencial vs. trampa de multiplicar" },
  titleOrder: { en: "Order of operations with exponents", es: "Orden de las operaciones con exponentes" },
  base: { en: "Base (b)", es: "Base (b)" },
  exponent: { en: "Exponent (n)", es: "Exponente (n)" },
  power: { en: "Power (b^n)", es: "Potencia (b^n)" },
  factors: { en: "Factor chain", es: "Cadena de factores" },
  linearTrap: { en: "Multiplier trap (b × n)", es: "Trampa lineal (b × n)" },
  compareToggle: { en: "Compare b × n trap", es: "Comparar trampa b × n" },
  tableToggle: { en: "Growth table", es: "Tabla de crecimiento" },
  presetStudio: { en: "Studio 2⁴ = 16", es: "Estudio 2⁴ = 16" },
  presetCube: { en: "Cube 3³ = 27", es: "Cubo 3³ = 27" },
  presetZero: { en: "Zero power 2⁰ = 1", es: "Potencia cero 2⁰ = 1" },
  undo: { en: "Undo", es: "Deshacer" },
  reset: { en: "Start over", es: "Empezar de nuevo" },
  invalid: { en: "Enter a whole number in range.", es: "Escribe un número entero dentro del rango." },
  handleBase: { en: "Base factor. Use arrow keys or drag.", es: "Factor base. Usa las flechas o arrastra." },
  handleExp: { en: "Exponent. Use arrow keys or drag.", es: "Exponente. Usa las flechas o arrastra." },
  stageCol: { en: "Stage", es: "Etapa" },
  expRow: { en: "Repeated multiplication (b^n)", es: "Multiplicación repetida (b^n)" },
  linRow: { en: "Multiplier trap (b × n)", es: "Trampa de multiplicar (b × n)" },
};

const W = 520;
const H = 210;
const TRACK = { x0: 44, x1: 476, y: 24 };
let uid = 0;

export function mount(root, model, { lang = "en", onChange, readonly = false } = {}) {
  const id0 = `fmx${++uid}`;
  let bag;
  let L = lang;
  let ui = {};
  const state = () => model.getState();
  const T = (k) => t(L, STR[k]);

  function makeTrackSlider(labelKey) {
    const svg = s("svg", { class: "fm-svg fm-guess", viewBox: `0 0 ${W} 48`, role: "group", "aria-label": T(labelKey) });
    const g = s("g");
    const handle = readonly
      ? null
      : s("g", { class: "fm-handle" }, s("circle", { class: "fm-hit", r: 36 }), s("circle", { class: "fm-ring", r: 15 }), s("circle", { class: "fm-knob", r: 9 }));
    svg.append(g);
    if (handle) svg.append(handle);
    return { svg, g, handle };
  }

  function wireBaseSlider(node) {
    return makeDraggable(node, {
      get: () => state().base,
      set: (v) => model.setState({ base: Math.round(v) }),
      min: 1,
      max: 10,
      step: 1,
      bigStep: 2,
      label: T("handleBase"),
      valueText: () => `${T("base")} = ${state().base}`,
      toValue: ({ x, node: n }) => {
        const ratio = (toSvgX(n, x, W).x - TRACK.x0) / (TRACK.x1 - TRACK.x0);
        return 1 + Math.round(clamp(ratio, 0, 1) * 9);
      },
    });
  }

  function wireExpSlider(node) {
    return makeDraggable(node, {
      get: () => state().exponent,
      set: (v) => model.setState({ exponent: Math.round(v) }),
      min: 0,
      max: () => state().maxExponent,
      step: 1,
      bigStep: 2,
      label: T("handleExp"),
      valueText: () => `${T("exponent")} = ${state().exponent}`,
      toValue: ({ x, node: n }) => {
        const maxE = state().maxExponent;
        const ratio = (toSvgX(n, x, W).x - TRACK.x0) / (TRACK.x1 - TRACK.x0);
        return Math.round(clamp(ratio, 0, 1) * maxE);
      },
    });
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

    ui.svg = s("svg", {
      class: "fm-svg fm-exp-svg",
      viewBox: `0 0 ${W} ${H}`,
      role: "group",
      "aria-label": T(st.mode === "order" ? "titleOrder" : "titlePowers"),
    });

    ui.baseSlider = makeTrackSlider("base");
    ui.expSlider = makeTrackSlider("exponent");

    ui.baseField = field(bag, {
      id: `${id0}-base`,
      label: T("base"),
      readonly,
      onCommit: (val) => {
        const ok = model.setState({ base: val });
        ui.baseField.invalid(!ok);
        ui.msg.textContent = ok ? "" : T("invalid");
      },
    });
    ui.expField = field(bag, {
      id: `${id0}-exp`,
      label: T("exponent"),
      readonly,
      onCommit: (val) => {
        const ok = model.setState({ exponent: val });
        ui.expField.invalid(!ok);
        ui.msg.textContent = ok ? "" : T("invalid");
      },
    });
    ui.powerField = field(bag, { id: `${id0}-pow`, label: T("power"), readonly: true });
    ui.factorsField = field(bag, { id: `${id0}-fac`, label: T("factors"), readonly: true });
    ui.trapField = field(bag, { id: `${id0}-trap`, label: T("linearTrap"), readonly: true });

    ui.tableWrap = h("div", { class: "fm-view fm-exp-table-wrap" });

    // Prediction reasoning question built into the model
    ui.predictPrompt = h("p", { class: "fm-sub" });
    ui.predictRow = h("div", { class: "fm-row", role: "group" });
    ui.predictFeedback = h("p", { class: "fm-explain", role: "status" });
    ui.predictBox = h("section", { class: "fm-view fm-exp-predict" }, ui.predictPrompt, ui.predictRow, ui.predictFeedback);

    const controls = [];
    if (!readonly) {
      ui.compareBtn = button(bag, T("compareToggle"), {
        pressed: st.compare,
        onClick: () => model.setState({ compare: !state().compare }),
      });
      ui.tableBtn = button(bag, T("tableToggle"), {
        pressed: st.views.table,
        onClick: () => model.setState({ views: { table: !state().views.table } }),
      });
      ui.presetStudio = button(bag, T("presetStudio"), {
        onClick: () => model.setState({ base: 2, exponent: 4, compare: true }),
      });
      ui.presetCube = button(bag, T("presetCube"), {
        onClick: () => model.setState({ base: 3, exponent: 3, compare: true }),
      });
      ui.presetZero = button(bag, T("presetZero"), {
        onClick: () => model.setState({ base: 2, exponent: 0, compare: true }),
      });
      ui.undoBtn = button(bag, T("undo"), { onClick: () => model.undo() });
      ui.resetBtn = button(bag, T("reset"), { onClick: () => model.reset() });

      controls.push(
        h("div", { class: "fm-row" }, ui.presetStudio, ui.presetCube, ui.presetZero),
        h("div", { class: "fm-row" }, ui.compareBtn, ui.tableBtn, ui.undoBtn, ui.resetBtn)
      );
    }

    put(
      root,
      ui.prompt,
      h("section", { class: "fm-view", "aria-label": T("titlePowers") }, ui.svg),
      h(
        "section",
        { class: "fm-view", "aria-label": T("base") },
        ui.baseSlider.svg,
        ui.expSlider.svg,
        h("div", { class: "fm-fields" }, ui.baseField.el, ui.expField.el, ui.powerField.el, ui.factorsField.el, ui.trapField.el)
      ),
      ...controls,
      ui.tableWrap,
      ui.predictBox,
      ui.msg,
      ui.explain,
      ui.desc
    );

    if (ui.baseSlider.handle) v.handles.push(wireBaseSlider(ui.baseSlider.handle));
    if (ui.expSlider.handle) v.handles.push(wireExpSlider(ui.expSlider.handle));
  }

  function drawChart(d) {
    clear(ui.svg);
    a11y(
      ui.svg,
      T(d.mode === "order" ? "titleOrder" : "titlePowers"),
      model.getAccessibleDescription(L)
    );

    if (d.mode === "order") {
      const boxW = 148;
      const boxH = 62;
      const y0 = 34;
      const steps = [
        {
          x: 20,
          cls: "fm-fill-part",
          title: t(L, { en: "1. Exponent first", es: "1. Exponente primero" }),
          val: `${d.base}^${d.expCap} = ${d.expTerm}`,
        },
        {
          x: 186,
          cls: "fm-fill-whole",
          title: t(L, { en: "2. Multiply", es: "2. Multiplicar" }),
          val: `${d.multiplier} × ${d.expTerm} = ${d.orderProduct}`,
        },
        {
          x: 352,
          cls: "fm-fill-given",
          title: t(L, { en: "3. Add last", es: "3. Sumar al final" }),
          val: `${d.addend} + ${d.orderProduct} = ${d.orderCorrect}`,
        },
      ];
      for (const stp of steps) {
        ui.svg.append(
          s("rect", { class: stp.cls, x: stp.x, y: y0, width: boxW, height: boxH, rx: 8 }),
          stext(stp.x + boxW / 2, y0 + 24, stp.title, "fm-svg-text", "middle"),
          stext(stp.x + boxW / 2, y0 + 48, stp.val, "fm-svg-text fm-svg-strong", "middle")
        );
      }
      ui.svg.append(
        stext(
          W / 2,
          144,
          t(L, {
            en: `Left-to-right trap: (${d.addend} + ${d.multiplier}) × ${d.expTerm} = ${d.orderLeftToRightTrap}`,
            es: `Trampa de izquierda a derecha: (${d.addend} + ${d.multiplier}) × ${d.expTerm} = ${d.orderLeftToRightTrap}`,
          }),
          "fm-svg-text fm-tick-label",
          "middle"
        )
      );
      return;
    }

    const padL = 48;
    const padR = 20;
    const padT = 24;
    const padB = 34;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const steps = d.growthSteps;
    const maxVal = Math.max(10, ...steps.map((st) => Math.max(st.value, st.linearValue)));
    const slotW = chartW / steps.length;

    for (let i = 0; i <= 4; i++) {
      const y = Math.round(padT + chartH - (i / 4) * chartH);
      const val = Math.round((i / 4) * maxVal);
      ui.svg.append(
        s("line", { class: "fm-grid-line", x1: padL, y1: y, x2: W - padR, y2: y }),
        stext(padL - 8, y + 4, String(val), "fm-svg-text fm-tick-label", "end")
      );
    }

    steps.forEach((stp, idx) => {
      const cx = Math.round(padL + idx * slotW + slotW / 2);
      const barW = d.compare ? Math.min(24, Math.floor(slotW * 0.34)) : Math.min(34, Math.floor(slotW * 0.52));
      const expH = Math.max(6, Math.round((stp.value / maxVal) * chartH));
      const expY = padT + chartH - expH;
      const expX = d.compare ? cx - barW - 2 : Math.round(cx - barW / 2);

      ui.svg.append(
        s("rect", {
          class: stp.active ? "fm-fill-part" : "fm-fill-whole",
          x: expX,
          y: expY,
          width: barW,
          height: expH,
          rx: 4,
        }),
        stext(
          Math.round(expX + barW / 2),
          Math.max(14, expY - 5),
          String(stp.value),
          stp.active ? "fm-svg-text fm-svg-strong" : "fm-svg-text fm-tick-label",
          "middle"
        )
      );

      if (d.compare) {
        const linH = Math.max(4, Math.round((stp.linearValue / maxVal) * chartH));
        const linY = padT + chartH - linH;
        const linX = cx + 2;
        ui.svg.append(
          s("rect", {
            class: "fm-fill-given",
            x: linX,
            y: linY,
            width: barW,
            height: linH,
            rx: 4,
          }),
          stext(
            Math.round(linX + barW / 2),
            Math.max(14, linY - 5),
            String(stp.linearValue),
            "fm-svg-text fm-tick-label",
            "middle"
          )
        );
      }

      ui.svg.append(
        stext(
          cx,
          H - 10,
          `${d.base}^${stp.step}`,
          stp.active ? "fm-svg-text fm-svg-strong" : "fm-svg-text fm-tick-label",
          "middle"
        )
      );
    });
  }

  function drawSliderTrack(slider, min, max, current, labelPrefix) {
    const g = slider.g;
    clear(g);
    const span = Math.max(1, max - min);
    const X = (n) => TRACK.x0 + ((TRACK.x1 - TRACK.x0) * (n - min)) / span;
    g.append(s("line", { class: "fm-axis", x1: TRACK.x0, x2: TRACK.x1, y1: TRACK.y, y2: TRACK.y }));
    for (let k = min; k <= max; k++) {
      g.append(
        s("line", { class: "fm-tick", x1: X(k), x2: X(k), y1: TRACK.y - 5, y2: TRACK.y + 5 }),
        stext(X(k), TRACK.y + 20, `${labelPrefix}${k}`, "fm-svg-text fm-tick-label", "middle")
      );
    }
    slider.handle?.setAttribute("transform", `translate(${X(clamp(current, min, max))} ${TRACK.y})`);
  }

  function renderTable(d) {
    clear(ui.tableWrap);
    ui.tableWrap.hidden = !d.views.table;
    if (!d.views.table) return;
    const headRow = h(
      "tr",
      null,
      h("th", { scope: "col" }, T("stageCol")),
      ...d.growthSteps.map((s0) => h("th", { scope: "col" }, `${d.base}^${s0.step}`))
    );
    const expRow = h(
      "tr",
      null,
      h("th", { scope: "row" }, T("expRow")),
      ...d.growthSteps.map((s0) => h("td", null, String(s0.value)))
    );
    const linRow = h(
      "tr",
      null,
      h("th", { scope: "row" }, T("linRow")),
      ...d.growthSteps.map((s0) => h("td", null, String(s0.linearValue)))
    );
    put(
      ui.tableWrap,
      h("table", { class: "fm-table" }, h("thead", null, headRow), h("tbody", null, expRow, linRow))
    );
  }

  function renderPrediction(d) {
    const nextPower = d.power * d.base;
    const trapAdd = d.power + d.base;
    const trapLinear = d.base * (d.exponent + 1);
    ui.predictPrompt.textContent = t(L, {
      en: `Predict & Reason: Right now ${d.base}^${d.exponent} = ${d.power}. If you increase the exponent by 1 (to ${d.base}^${d.exponent + 1}), what happens?`,
      es: `Predice y razona: Ahora ${d.base}^${d.exponent} = ${d.power}. Si aumentas el exponente en 1 (a ${d.base}^${d.exponent + 1}), ¿qué ocurre?`,
    });
    clear(ui.predictRow);
    const choices = [
      {
        id: "multiply",
        label: t(L, {
          en: `Multiply by ${d.base} → ${nextPower}`,
          es: `Multiplicar por ${d.base} → ${nextPower}`,
        }),
      },
      {
        id: "add",
        label: t(L, {
          en: `Add ${d.base} → ${trapAdd}`,
          es: `Sumar ${d.base} → ${trapAdd}`,
        }),
      },
      {
        id: "linear",
        label: t(L, {
          en: `Multiply ${d.base} × ${d.exponent + 1} → ${trapLinear}`,
          es: `Multiplicar ${d.base} × ${d.exponent + 1} → ${trapLinear}`,
        }),
      },
    ];
    for (const ch of choices) {
      put(
        ui.predictRow,
        button(bag, ch.label, {
          pressed: d.prediction === ch.id,
          onClick: () => model.setState({ prediction: ch.id }),
        })
      );
    }
    if (!d.prediction) {
      ui.predictFeedback.textContent = "";
    } else if (d.prediction === "multiply") {
      ui.predictFeedback.textContent = t(L, {
        en: `Exact! Increasing the exponent by 1 multiplies by one more factor of ${d.base}: ${d.power} × ${d.base} = ${nextPower}.`,
        es: `¡Exacto! Aumentar el exponente en 1 multiplica por un factor más de ${d.base}: ${d.power} × ${d.base} = ${nextPower}.`,
      });
    } else {
      ui.predictFeedback.textContent = t(L, {
        en: `Look at the factor chain: ${d.base}^${d.exponent + 1} has one more "× ${d.base}" factor, so ${d.power} × ${d.base} = ${nextPower}.`,
        es: `Observa la cadena de factores: ${d.base}^${d.exponent + 1} tiene un factor "× ${d.base}" más, así que ${d.power} × ${d.base} = ${nextPower}.`,
      });
    }
  }

  function sync(v, force) {
    const d = state();
    drawChart(d);
    drawSliderTrack(ui.baseSlider, 1, 10, d.base, "b=");
    drawSliderTrack(ui.expSlider, 0, d.maxExponent, d.exponent, "n=");
    ui.baseField.set(d.base, force);
    ui.expField.set(d.exponent, force);
    ui.powerField.set(d.mode === "order" ? d.orderCorrect : d.power, true);
    ui.factorsField.set(
      d.mode === "order"
        ? `${d.addend} + ${d.multiplier} × ${d.expTerm} = ${d.orderCorrect}`
        : `${d.factorsChain} = ${d.power}`,
      true
    );
    ui.trapField.set(
      d.mode === "order"
        ? `(${d.addend} + ${d.multiplier}) × ${d.expTerm} = ${d.orderLeftToRightTrap}`
        : `${d.base} × ${d.exponent} = ${d.additive}`,
      true
    );
    if (ui.compareBtn) ui.compareBtn.setAttribute("aria-pressed", String(d.compare));
    if (ui.tableBtn) ui.tableBtn.setAttribute("aria-pressed", String(d.views.table));
    if (ui.undoBtn) ui.undoBtn.disabled = !model.canUndo();
    renderTable(d);
    renderPrediction(d);
    ui.explain.textContent = model.getMathematicalExplanation(L);
    ui.desc.textContent = model.getAccessibleDescription(L);
    for (const hd of v.handles) hd.refresh();
  }

  return createView(root, model, {
    lang,
    onChange,
    cls: "fm-exponents",
    build,
    sync,
    say: (st, l) => model.getAccessibleDescription(l),
  });
}
