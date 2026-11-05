// Family "ratio": a base ratio a:b, a table of equivalent rows, a double number line and a pair of
// tapes in equal units. The active row's batch count is the one piece of state all three views
// read and write, so changing the table, dragging the point or stretching the tape moves the rest.
import {
  add,
  button,
  clamp,
  clear,
  cmp,
  createView,
  defineFamily,
  div,
  eq,
  field,
  fmtNumber,
  frac,
  fracToString,
  h,
  isInt,
  isRat,
  makeDraggable,
  put,
  mul,
  s,
  sign,
  stext,
  sub,
  t,
  terminates,
  toDecimalString,
  toFrac,
  toNumber,
  toSvgX,
} from "./core.mjs";

export const id = "ratio";
export const label = { en: "Ratio models", es: "Modelos de razón" };

const VIEW_KEYS = ["tape", "line", "table"];
const DEFAULT_VIEWS = { tape: true, line: true, table: true };
const MAX_ROWS = 12;
const ACTIONS = ["n", "scale", "A", "B", "active", "setRow", "addRow", "removeRow", "half", "views"];

// ── State ────────────────────────────────────────────────────────────────────

const text = (v, fallback) => {
  const o = typeof v === "string" ? { en: v, es: v } : v || {};
  const en = String(o.en ?? fallback.en);
  const out = { en, es: String(o.es ?? (o.en ? en : fallback.es)) };
  if (o.oneEn) out.oneEn = String(o.oneEn);
  if (o.oneEs) out.oneEs = String(o.oneEs);
  return out;
};

function validateState(st) {
  if (!st || !Number.isInteger(st.a) || !Number.isInteger(st.b)) return false;
  if (st.a < 1 || st.a > 1000 || st.b < 1 || st.b > 1000) return false;
  if (!Number.isInteger(st.maxN) || st.maxN < 2 || st.maxN > 100) return false;
  if (!Array.isArray(st.rows) || st.rows.length < 1 || st.rows.length > MAX_ROWS) return false;
  const max = frac(st.maxN);
  if (!st.rows.every((r) => isRat(r) && sign(r) > 0 && cmp(r, max) <= 0)) return false;
  if (!Number.isInteger(st.active) || st.active < 0 || st.active >= st.rows.length) return false;
  if (typeof st.half !== "boolean" || !st.views) return false;
  for (const k of ["a", "b"]) {
    const l = st.labels?.[k];
    if (!l || typeof l.en !== "string" || typeof l.es !== "string") return false;
  }
  return VIEW_KEYS.every((k) => typeof st.views[k] === "boolean");
}

function reduce(st, patch) {
  if (!patch || typeof patch !== "object") return null;
  if (Object.keys(patch).some((k) => !ACTIONS.includes(k))) return null;
  const next = { ...st, rows: [...st.rows], views: { ...st.views } };
  const max = frac(st.maxN);
  const pos = (v) => {
    const r = toFrac(v);
    return r && sign(r) > 0 ? (cmp(r, max) > 0 ? max : r) : null;
  };
  const batches = (key, v) => {
    const r = toFrac(v);
    if (!r) return null;
    return key === "A" ? div(r, frac(st.a)) : key === "B" ? div(r, frac(st.b)) : r;
  };
  if ("half" in patch) next.half = patch.half === true;
  for (const k of ["n", "scale", "A", "B"]) {
    if (!(k in patch)) continue;
    const n = pos(batches(k, patch[k]));
    if (!n) return null;
    next.rows[next.active] = n;
  }
  if ("setRow" in patch) {
    const { index, n: raw } = patch.setRow || {};
    const n = pos(raw);
    if (!n || !Number.isInteger(index) || index < 0 || index >= next.rows.length) return null;
    next.rows[index] = n;
    next.active = index;
  }
  if ("addRow" in patch) {
    let n = null;
    if (patch.addRow === true) {
      for (let k = 1; k <= st.maxN && !n; k++) if (!next.rows.some((r) => eq(r, frac(k)))) n = frac(k);
    } else n = pos(patch.addRow);
    if (!n) return null;
    const at = next.rows.findIndex((r) => eq(r, n));
    if (at >= 0) next.active = at;
    else {
      if (next.rows.length >= MAX_ROWS) return null;
      next.rows.push(n);
      next.active = next.rows.length - 1;
    }
  }
  if ("removeRow" in patch) {
    const i = patch.removeRow;
    if (!Number.isInteger(i) || i < 0 || i >= next.rows.length || next.rows.length < 2) return null;
    next.rows.splice(i, 1);
    next.active = next.active > i ? next.active - 1 : Math.min(next.active, next.rows.length - 1);
  }
  if ("active" in patch) {
    if (!Number.isInteger(patch.active) || patch.active < 0 || patch.active >= next.rows.length) return null;
    next.active = patch.active;
  }
  for (const [k, v] of Object.entries(patch.views || {})) {
    if (!VIEW_KEYS.includes(k)) return null;
    next.views[k] = v === true;
  }
  return next;
}

function derive(st) {
  const n = st.rows[st.active];
  return {
    ...st,
    n,
    A: mul(frac(st.a), n),
    B: mul(frac(st.b), n),
    step: st.half ? frac(1, 2) : frac(1),
    aPerB: frac(st.a, st.b),
    bPerA: frac(st.b, st.a),
  };
}

function normalize(config) {
  const c = config || {};
  const a = c.a ?? 3;
  const b = c.b ?? 5;
  const maxN = c.maxN ?? 12;
  const n = toFrac(c.n ?? c.scale ?? 1);
  if (!n || sign(n) <= 0) throw new TypeError("ratio: n must be a positive number");
  let rows = (c.rows || [1, c.n ?? c.scale ?? 2]).map(toFrac);
  if (rows.some((r) => !r)) throw new TypeError("ratio: rows must be positive numbers");
  rows = rows.filter((r, i) => rows.findIndex((q) => eq(q, r)) === i);
  let active = rows.findIndex((r) => eq(r, n));
  if (active < 0) {
    rows.push(n);
    active = rows.length - 1;
  }
  const state = {
    a,
    b,
    labels: {
      a: text(c.labels?.a, { en: "first quantity", es: "primera cantidad" }),
      b: text(c.labels?.b, { en: "second quantity", es: "segunda cantidad" }),
    },
    rows,
    active,
    maxN,
    half: c.half === true,
    views: { ...DEFAULT_VIEWS, ...(c.views || {}) },
  };
  if (!validateState(state)) throw new TypeError("ratio: invalid configuration");
  return { state, task: c.task || null };
}

// ── Words ────────────────────────────────────────────────────────────────────

const num = fmtNumber;
const rate = (r) => (r.d === 1 || !terminates(r) ? fracToString(r) : `${fracToString(r)} = ${toDecimalString(r)}`);
const lab = (st, k, lang) => t(lang, st.labels[k]);
const one = (st, k, lang) => t(lang, { en: st.labels[k].oneEn ?? st.labels[k].en, es: st.labels[k].oneEs ?? st.labels[k].es });

function accessibleDescription(st, lang) {
  const d = derive(st);
  return t(lang, {
    en: `Ratio model. The base ratio is ${st.a}:${st.b}, ${st.a} ${lab(st, "a", "en")} to ${st.b} ${lab(st, "b", "en")}. With ${num(d.n)} batches the ratio is ${num(d.A)}:${num(d.B)}. The table has ${st.rows.length} rows.`,
    es: `Modelo de razón. La razón base es ${st.a}:${st.b}, ${st.a} ${lab(st, "a", "es")} por ${st.b} ${lab(st, "b", "es")}. Con ${num(d.n)} lotes la razón es ${num(d.A)}:${num(d.B)}. La tabla tiene ${st.rows.length} filas.`,
  });
}

function explanation(st, lang) {
  const d = derive(st);
  const [A, B, N] = [num(d.A), num(d.B), num(d.n)];
  const batch = eq(d.n, frac(1));
  return [
    t(lang, {
      en: `${st.a}:${st.b} means ${st.a} ${lab(st, "a", "en")} for every ${st.b} ${lab(st, "b", "en")}.`,
      es: `${st.a}:${st.b} significa ${st.a} ${lab(st, "a", "es")} por cada ${st.b} ${lab(st, "b", "es")}.`,
    }),
    t(lang, {
      en: `With ${N} ${batch ? "batch" : "batches"} the ratio is ${A}:${B}, because ${st.a} × ${N} = ${A} and ${st.b} × ${N} = ${B}.`,
      es: `Con ${N} ${batch ? "lote" : "lotes"} la razón es ${A}:${B}, porque ${st.a} × ${N} = ${A} y ${st.b} × ${N} = ${B}.`,
    }),
    t(lang, {
      en: "Multiply both parts by the same number. Adding the same amount to both parts does not keep the ratio.",
      es: "Multiplica las dos partes por el mismo número. Sumar la misma cantidad a las dos partes no mantiene la razón.",
    }),
    t(lang, {
      en: `Unit rates: ${rate(d.aPerB)} ${lab(st, "a", "en")} for every 1 ${one(st, "b", "en")}, and ${rate(d.bPerA)} ${lab(st, "b", "en")} for every 1 ${one(st, "a", "en")}.`,
      es: `Tasas unitarias: ${rate(d.aPerB)} ${lab(st, "a", "es")} por cada 1 ${one(st, "b", "es")}, y ${rate(d.bPerA)} ${lab(st, "b", "es")} por cada 1 ${one(st, "a", "es")}.`,
    }),
  ].join(" ");
}

// ── validate(task) ───────────────────────────────────────────────────────────

const pair = (p) => {
  const a = toFrac(p?.a);
  const b = toFrac(p?.b);
  return a && b && sign(a) > 0 && sign(b) > 0 ? { a, b } : null;
};
const sameRatio = (p, q) => eq(mul(p.a, q.b), mul(p.b, q.a));
const verdict = (x, y) => (cmp(x, y) > 0 ? "first" : cmp(x, y) < 0 ? "second" : "equal");
const flip = { first: "second", second: "first", equal: "equal" };

function validateTask(st, task) {
  const none = (reason, ok = false) => ({ ok, reason, misconception: null });
  const wrong = (m) => ({ ok: false, reason: "incorrect", misconception: m && { id: m, confidence: "possible" } });
  if (!task) return none("no-task");
  const d = derive(st);
  const base = task.base ? pair(task.base) : { a: frac(st.a), b: frac(st.b) };
  if (task.kind === "compare") {
    const r1 = pair(task.r1);
    const r2 = pair(task.r2);
    if (!r1 || !r2) return none("invalid-task");
    if (!["first", "second", "equal"].includes(task.answer)) return none("invalid-answer");
    const expected = verdict(mul(r1.a, r2.b), mul(r2.a, r1.b));
    if (task.answer === expected) return none("correct", true);
    if (task.answer === flip[expected]) return wrong("reversed-order");
    const diffs = verdict(sub(r1.a, r1.b), sub(r2.a, r2.b));
    return wrong(task.answer === diffs ? "additive-scaling" : null);
  }
  if (!base) return none("invalid-task");
  if (task.kind === "equivalent") {
    const given = task.answer !== undefined ? pair(task.answer) : { a: d.A, b: d.B };
    if (!given) return none("invalid-answer");
    if (sameRatio(base, given)) return none("correct", true);
    const da = sub(given.a, base.a);
    if (eq(da, sub(given.b, base.b)) && sign(da) !== 0) return wrong("additive-scaling");
    if (eq(mul(given.a, base.a), mul(given.b, base.b))) return wrong("reversed-order");
    const k = div(given.a, base.a);
    const m = div(given.b, base.b);
    const big = (r) => isInt(r) && r.n > 1;
    return wrong(big(k) || big(m) ? "wrong-scale-factor" : null);
  }
  if (task.kind === "missing-value") {
    const side = task.known?.side;
    const value = toFrac(task.known?.value);
    if (!["a", "b"].includes(side) || !value || sign(value) <= 0) return none("invalid-task");
    const [sb, ob] = side === "a" ? [base.a, base.b] : [base.b, base.a];
    const expected = div(mul(value, ob), sb);
    let given;
    if (task.answer !== undefined) given = toFrac(task.answer);
    else if (eq(side === "a" ? d.A : d.B, value)) given = side === "a" ? d.B : d.A;
    else return none("state-mismatch");
    if (!given || sign(given) < 0) return none("invalid-answer");
    if (eq(given, expected)) return none("correct", true);
    if (eq(given, add(ob, sub(value, sb)))) return wrong("additive-scaling");
    if (eq(given, div(mul(value, sb), ob))) return wrong("reversed-order");
    return wrong(eq(given, value) || eq(given, mul(ob, value)) ? "wrong-scale-factor" : null);
  }
  if (task.kind === "unit-rate") {
    const want = { aPerB: div(base.a, base.b), bPerA: div(base.b, base.a) };
    const given = {};
    for (const k of ["aPerB", "bPerA"]) if (task.answer?.[k] !== undefined) given[k] = toFrac(task.answer[k]);
    const keys = Object.keys(given);
    if (!keys.length || keys.some((k) => !given[k] || sign(given[k]) <= 0)) return none("invalid-answer");
    if (keys.every((k) => eq(given[k], want[k]))) return none("correct", true);
    const inverted = keys.some((k) => eq(given[k], want[k === "aPerB" ? "bPerA" : "aPerB"]));
    return wrong(inverted ? "unit-rate-inverted" : null);
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
  track: (patch) => !Object.keys(patch).every((k) => ["half", "views", "active"].includes(k)),
  describeConfig: (st) => ({
    a: st.a,
    b: st.b,
    labels: st.labels,
    rows: st.rows.map(num),
    maxN: st.maxN,
  }),
});

// ── Rendering ────────────────────────────────────────────────────────────────

const STR = {
  views: { en: "Show", es: "Mostrar" },
  tape: { en: "Tapes", es: "Cintas" },
  line: { en: "Double number line", es: "Recta numérica doble" },
  table: { en: "Table", es: "Tabla" },
  top: { en: "Top line", es: "Recta de arriba" },
  bottom: { en: "Bottom line", es: "Recta de abajo" },
  batches: { en: "Batches", es: "Lotes" },
  ratioNow: { en: "Ratio now", es: "Razón ahora" },
  perOf: { en: "per 1", es: "por cada 1" },
  use: { en: "Use row", es: "Usar fila" },
  remove: { en: "Remove row", es: "Quitar fila" },
  add: { en: "Add a row", es: "Agregar una fila" },
  half: { en: "Half batches", es: "Medios lotes" },
  undo: { en: "Undo", es: "Deshacer" },
  reset: { en: "Start over", es: "Empezar de nuevo" },
  invalid: { en: "Type a number like 4, 1.5 or 3/2.", es: "Escribe un número como 4, 1.5 o 3/2." },
  handle: {
    en: "Batches. Drag, or use the arrow keys, to stretch the ratio.",
    es: "Lotes. Arrastra, o usa las flechas, para estirar la razón.",
  },
};
const TAPE = { w: 360, x: 14, len: 300, h: 128 };
const LINE = { w: 360, x0: 20, x1: 340, top: 44, bottom: 96, h: 146 };
let uid = 0;

const stepNum = (d) => toNumber(d.step);
const ticksOf = (d) => Number(toNumber(div(d.n, d.step)).toFixed(6));

export function mount(root, model, { lang = "en", onChange, readonly = false } = {}) {
  const id0 = `fmr${++uid}`;
  let bag;
  let cur;
  let L = lang;
  let ui = {};
  const state = () => model.getState();
  const T = (k) => t(L, STR[k]);

  function setBatches(ticks, source) {
    const d = state();
    const v = source === "pointer" ? Math.round(ticks) : ticks;
    const n = toFrac(Number(v.toFixed(6)));
    if (n) model.setState({ n: mul(n, d.step) });
  }

  function drag(node, kind) {
    const cfg = {
      get: () => ticksOf(state()),
      set: setBatches,
      min: 1,
      max: () => toNumber(div(frac(state().maxN), state().step)),
      step: 1,
      bigStep: () => toNumber(div(frac(Math.max(1, Math.round(state().maxN / 4))), state().step)),
      label: T("handle"),
      ariaNow: (v) => Number((v * stepNum(state())).toFixed(6)),
      valueText: () => {
        const d = state();
        return `${num(d.n)} ${t(L, { en: "batches", es: "lotes" })}: ${num(d.A)}:${num(d.B)}`;
      },
    };
    if (kind === "tape") {
      cfg.toValue = ({ x, start, node: n }) => {
        const d = state();
        const per = TAPE.len / d.maxN;
        return start.value + (toSvgX(n, x, TAPE.w).x - toSvgX(n, start.x, TAPE.w).x) / per / stepNum(d);
      };
    } else {
      cfg.aria = false;
      cfg.toValue = ({ x, node: n }) => {
        const d = state();
        return (((toSvgX(n, x, LINE.w).x - LINE.x0) / (LINE.x1 - LINE.x0)) * d.maxN) / stepNum(d);
      };
    }
    return makeDraggable(node, cfg);
  }

  function commitRow(index, input, f) {
    const ok = model.setState({ setRow: { index, n: input } });
    f.invalid(!ok);
    ui.msg.textContent = ok ? "" : T("invalid");
    if (ok) sync(cur, true);
  }

  const handleNode = (hit = true) =>
    s("g", { class: "fm-handle" }, s("circle", { class: "fm-hit", r: 40 }), hit ? s("circle", { class: "fm-ring", r: 17 }) : null, s("circle", { class: "fm-knob", r: 10 }));

  function build(v) {
    bag = v.bag;
    cur = v;
    L = v.lang;
    const st = state();
    ui = { rows: [] };
    ui.prompt = model.task?.prompt ? h("p", { class: "fm-prompt" }, t(L, model.task.prompt)) : null;
    ui.explain = h("p", { class: "fm-explain" });
    ui.desc = h("p", { class: "fm-sr" });
    ui.msg = h("p", { class: "fm-msg", role: "status" });

    ui.tapeSvg = s("svg", { class: "fm-svg", viewBox: `0 0 ${TAPE.w} ${TAPE.h}`, role: "group", "aria-label": T("tape") });
    ui.tapeBody = s("g");
    ui.tapeHandle = readonly ? null : handleNode();
    ui.tapeSvg.append(ui.tapeBody);
    if (ui.tapeHandle) ui.tapeSvg.append(ui.tapeHandle);

    ui.lineSvg = s("svg", { class: "fm-svg", viewBox: `0 0 ${LINE.w} ${LINE.h}`, role: "group", "aria-label": T("line") });
    ui.lineBody = s("g");
    ui.lineHandle = readonly ? null : handleNode(false);
    ui.lineSvg.append(ui.lineBody);
    if (ui.lineHandle) ui.lineSvg.append(ui.lineHandle);

    ui.tbody = h("tbody");
    ui.table = h(
      "table",
      { class: "fm-table" },
      h("caption", { class: "fm-sr" }, T("table")),
      h("thead", null, h("tr", null, h("th", { scope: "col" }, T("batches")), h("th", { scope: "col" }, lab(st, "a", L)), h("th", { scope: "col" }, lab(st, "b", L)), readonly ? null : h("th", { scope: "col" }, ""))),
      ui.tbody,
    );
    ui.now = field(bag, { id: `${id0}-now`, label: T("ratioNow"), readonly: true });
    ui.aPerB = field(bag, { id: `${id0}-ab`, label: `${lab(st, "a", L)} ${T("perOf")} ${one(st, "b", L)}`, readonly: true });
    ui.bPerA = field(bag, { id: `${id0}-ba`, label: `${lab(st, "b", L)} ${T("perOf")} ${one(st, "a", L)}`, readonly: true });

    const sec = (key, ...kids) => (ui[`sec_${key}`] = h("section", { class: `fm-view fm-view-${key}`, "aria-label": T(key) }, ...kids));
    const controls = [];
    if (!readonly) {
      ui.addBtn = button(bag, T("add"), { onClick: () => model.setState({ addRow: true }) });
      ui.halfBtn = button(bag, T("half"), { pressed: st.half, onClick: () => model.setState({ half: !state().half }) });
      ui.undoBtn = button(bag, T("undo"), { onClick: () => model.undo() });
      controls.push(h("div", { class: "fm-row" }, ui.addBtn, ui.halfBtn, ui.undoBtn, button(bag, T("reset"), { onClick: () => model.reset() })));
    }
    ui.toggles = readonly
      ? null
      : h(
          "div",
          { class: "fm-row fm-toggles", role: "group", "aria-label": T("views") },
          ...VIEW_KEYS.map((k) => (ui[`tog_${k}`] = button(bag, T(k), { pressed: st.views[k], onClick: () => model.setState({ views: { [k]: !state().views[k] } }) }))),
        );
    put(
      root,
      ui.prompt,
      ui.toggles,
      sec("tape", ui.tapeSvg),
      sec(
        "line",
        ui.lineSvg,
        h("p", { class: "fm-cap" }, `${T("top")}: ${lab(st, "a", L)}. ${T("bottom")}: ${lab(st, "b", L)}.`),
      ),
      sec("table", h("div", { class: "fm-table-wrap" }, ui.table), ...controls),
      h("div", { class: "fm-fields" }, ui.now.el, ui.aPerB.el, ui.bPerA.el),
      ui.msg,
      ui.explain,
      ui.desc,
    );
    if (ui.tapeHandle) v.handles.push(drag(ui.tapeHandle, "tape"));
    if (ui.lineHandle) v.handles.push(drag(ui.lineHandle, "line"));
  }

  function drawTable(d) {
    if (ui.rows.length !== d.rows.length) {
      clear(ui.tbody);
      ui.rows = d.rows.map((_, i) => {
        const tr = h("tr");
        const f = field(bag, { id: `${id0}-row${i}`, label: `${T("batches")} ${i + 1}`, readonly, onCommit: (v) => commitRow(i, v, f) });
        const cells = [h("td", null, f.el), h("td", { class: "fm-num" }), h("td", { class: "fm-num" })];
        if (!readonly) {
          cells.push(
            h(
              "td",
              { class: "fm-actions" },
              button(bag, "✓", { ariaLabel: `${T("use")} ${i + 1}`, cls: "fm-step", onClick: () => model.setState({ active: i }) }),
              button(bag, "×", { ariaLabel: `${T("remove")} ${i + 1}`, cls: "fm-step", onClick: () => model.setState({ removeRow: i }) }),
            ),
          );
        }
        tr.append(...cells);
        ui.tbody.append(tr);
        return { tr, f, a: cells[1], b: cells[2] };
      });
    }
    d.rows.forEach((n, i) => {
      const r = ui.rows[i];
      r.f.set(num(n));
      r.a.textContent = num(mul(frac(d.a), n));
      r.b.textContent = num(mul(frac(d.b), n));
      r.tr.classList.toggle("fm-active", i === d.active);
      if (i === d.active) r.tr.setAttribute("aria-current", "true");
      else r.tr.removeAttribute("aria-current");
    });
    for (const btn of ui.tbody.querySelectorAll("button[aria-label^='" + T("remove") + "']")) btn.disabled = d.rows.length < 2;
  }

  function drawTape(d) {
    clear(ui.tapeBody);
    const big = Math.max(d.a, d.b);
    const u = TAPE.len / (big * d.maxN);
    const n = toNumber(d.n);
    const tapes = [
      { k: "a", y: 26, count: d.a, total: d.A },
      { k: "b", y: 82, count: d.b, total: d.B },
    ];
    for (const tp of tapes) {
      ui.tapeBody.append(stext(TAPE.x, tp.y - 8, `${lab(d, tp.k, L)}: ${num(tp.total)}`, "fm-svg-text"));
      for (let i = 0; i < Math.ceil(n); i++) {
        const share = Math.min(1, n - i);
        ui.tapeBody.append(
          s("rect", { class: i % 2 ? "fm-fill fm-fill-alt" : "fm-fill", x: TAPE.x + i * tp.count * u, y: tp.y, width: tp.count * u * share, height: 24 }),
        );
      }
      ui.tapeBody.append(s("rect", { class: "fm-tape-ref", x: TAPE.x, y: tp.y, width: tp.count * u * n, height: 24 }));
    }
    const longest = d.a >= d.b ? tapes[0] : tapes[1];
    ui.tapeHandle?.setAttribute("transform", `translate(${TAPE.x + longest.count * u * n} ${longest.y + 12})`);
  }

  function drawLine(d) {
    clear(ui.lineBody);
    const g = ui.lineBody;
    const X = (n) => LINE.x0 + ((LINE.x1 - LINE.x0) * n) / d.maxN;
    const skip = Math.ceil((d.maxN + 1) / 7);
    g.append(
      s("line", { class: "fm-axis", x1: LINE.x0, x2: LINE.x1, y1: LINE.top, y2: LINE.top }),
      s("line", { class: "fm-axis", x1: LINE.x0, x2: LINE.x1, y1: LINE.bottom, y2: LINE.bottom }),
    );
    for (let k = 0; k <= d.maxN; k++) {
      const x = X(k);
      g.append(s("line", { class: "fm-tick", x1: x, x2: x, y1: LINE.top - 6, y2: LINE.top + 6 }), s("line", { class: "fm-tick", x1: x, x2: x, y1: LINE.bottom - 6, y2: LINE.bottom + 6 }));
      if (k % skip === 0) g.append(stext(x, LINE.top - 10, num(mul(frac(d.a), frac(k))), "fm-svg-text", "middle"), stext(x, LINE.bottom + 24, num(mul(frac(d.b), frac(k))), "fm-svg-text", "middle"));
    }
    for (const r of d.rows) g.append(s("circle", { class: "fm-dot fm-dot-row", cx: X(toNumber(r)), cy: LINE.bottom, r: 4 }));
    const x = X(toNumber(d.n));
    const lx = clamp(x, 34, LINE.w - 34);
    g.append(
      s("line", { class: "fm-connector", x1: x, x2: x, y1: LINE.top, y2: LINE.bottom }),
      s("circle", { class: "fm-dot", cx: x, cy: LINE.top, r: 6 }),
      stext(lx, LINE.top - 28, num(d.A), "fm-svg-text fm-svg-strong", "middle"),
      stext(lx, LINE.bottom + 52, num(d.B), "fm-svg-text fm-svg-strong", "middle"),
    );
    ui.lineHandle?.setAttribute("transform", `translate(${x} ${LINE.bottom})`);
  }

  function sync(v) {
    const d = state();
    for (const k of VIEW_KEYS) {
      ui[`sec_${k}`].hidden = !d.views[k];
      ui[`tog_${k}`]?.setAttribute("aria-pressed", String(d.views[k]));
    }
    ui.halfBtn?.setAttribute("aria-pressed", String(d.half));
    if (ui.undoBtn) ui.undoBtn.disabled = !model.canUndo();
    if (ui.addBtn) ui.addBtn.disabled = d.rows.length >= MAX_ROWS;
    drawTable(d);
    if (d.views.tape) drawTape(d);
    if (d.views.line) drawLine(d);
    ui.now.set(`${num(d.A)} : ${num(d.B)}`);
    ui.aPerB.set(rate(d.aPerB));
    ui.bPerA.set(rate(d.bPerA));
    ui.explain.textContent = model.getMathematicalExplanation(L);
    ui.desc.textContent = model.getAccessibleDescription(L);
    for (const hd of v.handles) hd.refresh();
  }

  return createView(root, model, {
    lang,
    onChange,
    cls: "fm-ratio",
    build,
    sync,
    say: (st, l) => `${num(st.n)} ${t(l, { en: "batches", es: "lotes" })}: ${num(st.A)}:${num(st.B)}`,
  });
}
