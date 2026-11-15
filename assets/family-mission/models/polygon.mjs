// Family "polygon": the area of a REGULAR polygon by splitting it into n equal triangles from its
// center (lesson 5-9). The family taps the steps in order: split off the triangles one at a time
// (a text count says "k of n triangles"), look at one triangle (its base is a side, its height is
// the given apothem), find that triangle's area with ½ × base × height, then multiply by n. A
// stepper changes n (3 to 12) while the side and the apothem stay as given. The apothem is a given
// measurement, never computed. Every number is an exact rational; floats appear only to place the
// drawing's vertices.
import { button, createView, defineFamily, fmtNumber, frac, h, isRat, mul, put, s, stext, t, toFrac } from "./core.mjs";

export const id = "polygon";
export const label = { en: "Area of a regular polygon", es: "Área de un polígono regular" };

const MIN_N = 3;
const MAX_N = 12;
const MAX_PRESETS = 4;
const MAX_VALUE = 10000;
const MAX_DEN = 100;
const HALF = frac(1, 2);
const NEXT = ["focus", "triangle", "total"];

// ── State ────────────────────────────────────────────────────────────────────

const textOk = (x) => typeof x === "string" && x.trim() !== "" && x.length <= 40;
const unitOk = (u) => !!u && textOk(u.en) && textOk(u.es) && !!u.area && textOk(u.area.en) && textOk(u.area.es);
const measureOk = (r) => isRat(r) && r.n > 0 && r.d <= MAX_DEN && r.n <= MAX_VALUE * r.d;
const problemOk = (p) => !!p && Number.isInteger(p.n) && p.n >= MIN_N && p.n <= MAX_N && measureOk(p.side) && measureOk(p.apothem) && unitOk(p.unit);

function validateState(st) {
  return (
    !!st &&
    problemOk(st) &&
    Array.isArray(st.presets) &&
    st.presets.length <= MAX_PRESETS &&
    st.presets.every(problemOk) &&
    Number.isInteger(st.split) &&
    st.split >= 0 &&
    st.split <= st.n &&
    Number.isInteger(st.stage) &&
    st.stage >= 0 &&
    st.stage <= 3 &&
    (st.stage === 0 || st.split === st.n)
  );
}

/** Config problem -> state problem: exact rationals, and the area unit derived when not given. */
function problem(p) {
  const u = p && typeof p === "object" ? p.unit : null;
  if (!u || !textOk(u.en) || !textOk(u.es)) throw new TypeError("polygon: unit needs an en and an es name (plural, like feet / pies)");
  const out = {
    n: p.n,
    side: toFrac(p.side),
    apothem: toFrac(p.apothem),
    unit: { en: u.en.trim(), es: u.es.trim(), area: u.area || { en: `square ${u.en.trim()}`, es: `${u.es.trim()} cuadrados` } },
  };
  if (!problemOk(out)) {
    throw new TypeError(`polygon: n must be a whole number from ${MIN_N} to ${MAX_N}; side and apothem must be positive, at most ${MAX_VALUE}, with at most two decimals`);
  }
  return out;
}

function normalize(config) {
  const c = config || {};
  const base = problem(c);
  const presets = (Array.isArray(c.presets) ? c.presets : []).slice(0, MAX_PRESETS).map((p) => problem({ unit: c.unit, ...p }));
  const stage = c.stage === undefined ? 0 : c.stage;
  const state = { ...base, split: stage ? base.n : 0, stage, presets };
  if (!validateState(state)) throw new TypeError("polygon: stage must be 0, 1, 2 or 3");
  return { state, task: c.task || null };
}

/** One change per call. The steps go in order; changing n keeps a finished split finished. */
function reduce(st, patch) {
  const keys = Object.keys(patch || {});
  if (keys.length !== 1) throw new TypeError("polygon: one change at a time");
  const [k] = keys;
  const v = patch[k];
  if (k === "split") {
    if (v !== st.split + 1 || v > st.n) throw new RangeError("polygon: split one triangle at a time");
    return { ...st, split: v };
  }
  if (k === "splitAll") {
    if (v !== true) throw new TypeError("polygon: splitAll takes true");
    return { ...st, split: st.n };
  }
  if (k === "stage") {
    if (st.split !== st.n || v !== st.stage + 1 || v > 3) throw new RangeError("polygon: the steps go in order");
    return { ...st, stage: v };
  }
  if (k === "n") {
    if (!Number.isInteger(v) || v < MIN_N || v > MAX_N) throw new RangeError("polygon: n is 3 to 12");
    return { ...st, n: v, split: st.split === st.n ? v : Math.min(st.split, v) };
  }
  if (k === "preset") {
    const p = st.presets[v];
    if (!p) throw new RangeError("polygon: no such preset");
    return { ...st, ...p, split: 0, stage: 0 };
  }
  throw new TypeError(`polygon: unknown change "${k}"`);
}

// ── Arithmetic ───────────────────────────────────────────────────────────────

function derive(st) {
  const rect = mul(st.side, st.apothem);
  const tri = mul(rect, HALF);
  const allSplit = st.split === st.n;
  return {
    n: st.n,
    side: st.side,
    apothem: st.apothem,
    unit: st.unit,
    presets: st.presets,
    split: st.split,
    stage: st.stage,
    allSplit,
    next: allSplit ? (NEXT[st.stage] ?? null) : "split",
    rect,
    tri,
    total: mul(tri, frac(st.n)),
    nRect: mul(rect, frac(st.n)),
    finished: st.stage === 3,
  };
}

// ── Words (every string has an English and a Spanish form) ───────────────────

const NAMES = [
  { en: "regular triangle", es: "triángulo regular" },
  { en: "square", es: "cuadrado" },
  { en: "regular pentagon", es: "pentágono regular" },
  { en: "regular hexagon", es: "hexágono regular" },
  { en: "regular heptagon", es: "heptágono regular" },
  { en: "regular octagon", es: "octágono regular" },
  { en: "regular nonagon", es: "eneágono regular" },
  { en: "regular decagon", es: "decágono regular" },
  { en: "regular 11-gon", es: "polígono regular de 11 lados" },
  { en: "regular dodecagon", es: "dodecágono regular" },
];
const STR = {
  shapes: { en: "Pick a polygon", es: "Elige un polígono" },
  sides: { en: "Number of sides", es: "Número de lados" },
  fewer: { en: "Fewer sides", es: "Menos lados" },
  more: { en: "More sides", es: "Más lados" },
  same: { en: "Same side and apothem.", es: "Mismo lado y misma apotema." },
  sketch: { en: "The drawing is a sketch, not to scale.", es: "El dibujo es un boceto, no está a escala." },
  steps: { en: "Tap the next step", es: "Toca el siguiente paso" },
  undo: { en: "Undo", es: "Deshacer" },
  reset: { en: "Start over", es: "Empezar de nuevo" },
  done: { en: "All steps done. Change the number of sides to try another polygon.", es: "Todos los pasos hechos. Cambia el número de lados para probar otro polígono." },
  center: { en: "center", es: "centro" },
};
const LABEL = {
  split: { en: "Split off a triangle", es: "Separar un triángulo" },
  focus: { en: "Look at one triangle", es: "Mirar un triángulo" },
  triangle: { en: "Find one triangle's area", es: "Hallar el área de un triángulo" },
  total: { en: "Find the whole area", es: "Hallar el área completa" },
};

const T2 = (lang, en, es) => t(lang, { en, es });
const num = (x) => fmtNumber(x);
const len = (d, lang, x) => `${num(x)} ${t(lang, d.unit)}`;
const sq = (d, lang) => t(lang, d.unit.area);
const shapeName = (d, lang) => t(lang, NAMES[d.n - MIN_N]);

const countLine = (d, lang) => T2(lang, `${d.split} of ${d.n} triangles`, `${d.split} de ${d.n} triángulos`);
const givenLine = (d, lang) =>
  T2(lang, `Side: ${len(d, "en", d.side)}. Apothem: ${len(d, "en", d.apothem)}.`, `Lado: ${len(d, "es", d.side)}. Apotema: ${len(d, "es", d.apothem)}.`);
const focusLine = (d, lang) =>
  T2(
    lang,
    `Base: one side of the polygon, ${len(d, "en", d.side)}. Height: from the center straight to the middle of that side, ${len(d, "en", d.apothem)}. This height is the apothem.`,
    `Base: un lado del polígono, ${len(d, "es", d.side)}. Altura: del centro, en línea recta, al punto medio de ese lado, ${len(d, "es", d.apothem)}. Esta altura es la apotema.`,
  );
const triLine = (d, lang) => T2(lang, `One triangle: ½ × ${num(d.side)} × ${num(d.apothem)} = ${num(d.tri)} ${sq(d, "en")}.`, `Un triángulo: ½ × ${num(d.side)} × ${num(d.apothem)} = ${num(d.tri)} ${sq(d, "es")}.`);
const rectLine = (d, lang) =>
  T2(
    lang,
    `A rectangle ${num(d.side)} by ${num(d.apothem)} is ${num(d.rect)} ${sq(d, "en")}. The triangle is half of it.`,
    `Un rectángulo de ${num(d.side)} por ${num(d.apothem)} mide ${num(d.rect)} ${sq(d, "es")}. El triángulo es la mitad.`,
  );
const totalLine = (d, lang) => T2(lang, `Whole polygon: ${d.n} × ${num(d.tri)} = ${num(d.total)} ${sq(d, "en")}.`, `Polígono completo: ${d.n} × ${num(d.tri)} = ${num(d.total)} ${sq(d, "es")}.`);
const checkLine = (d, lang) =>
  T2(
    lang,
    `Check: ${d.n} rectangles ${num(d.side)} by ${num(d.apothem)} would be ${num(d.nRect)} ${sq(d, "en")}. The polygon is half of that.`,
    `Comprueba: ${d.n} rectángulos de ${num(d.side)} por ${num(d.apothem)} serían ${num(d.nRect)} ${sq(d, "es")}. El polígono es la mitad de eso.`,
  );
const sidesLine = (d, lang) => T2(lang, `${d.n} sides, ${d.n} triangles.`, `${d.n} lados, ${d.n} triángulos.`);

function hint(d, lang) {
  if (d.next === "split") return T2(lang, "Draw a line from the center to each corner. Each tap cuts off one triangle.", "Traza una línea del centro a cada esquina. Cada toque corta un triángulo.");
  if (d.next === "focus") return T2(lang, "All the triangles match. Tap to look at just one.", "Todos los triángulos son iguales. Toca para mirar solo uno.");
  if (d.next === "triangle") return T2(lang, "A triangle is half of a rectangle. Multiply base × height, then take half.", "Un triángulo es la mitad de un rectángulo. Multiplica base × altura y luego toma la mitad.");
  if (d.next === "total") return T2(lang, `The ${d.n} triangles match. Multiply one triangle's area by ${d.n}.`, `Los ${d.n} triángulos son iguales. Multiplica el área de un triángulo por ${d.n}.`);
  return t(lang, STR.done);
}

/** What is true so far, one sentence per revealed step. */
function status(d, lang) {
  if (!d.allSplit) return `${countLine(d, lang)}.`;
  if (d.stage === 0) return `${countLine(d, lang)}. ${sidesLine(d, lang)}`;
  if (d.stage === 1) return focusLine(d, lang);
  if (d.stage === 2) return `${triLine(d, lang)} ${rectLine(d, lang)}`;
  return `${totalLine(d, lang)} ${checkLine(d, lang)}`;
}

function accessibleDescription(st, lang) {
  const d = derive(st);
  return T2(
    lang,
    `Area of a regular polygon model. Shape: ${shapeName(d, "en")}, ${d.n} sides. ${givenLine(d, "en")} ${status(d, "en")} ${hint(d, "en")}`,
    `Modelo del área de un polígono regular. Figura: ${shapeName(d, "es")}, ${d.n} lados. ${givenLine(d, "es")} ${status(d, "es")} ${hint(d, "es")}`,
  );
}

function explanation(st, lang) {
  const d = derive(st);
  const lines = [T2(lang, `A ${shapeName(d, "en")} has ${d.n} sides, so it splits into ${d.n} equal triangles from its center.`, `Un ${shapeName(d, "es")} tiene ${d.n} lados, así que se divide en ${d.n} triángulos iguales desde su centro.`)];
  if (d.stage >= 1) lines.push(focusLine(d, lang));
  if (d.stage >= 2) lines.push(triLine(d, lang), rectLine(d, lang));
  if (d.stage >= 3) lines.push(totalLine(d, lang), checkLine(d, lang));
  else lines.push(hint(d, lang));
  return lines.join(" ");
}

function validateTask(st, task) {
  if (!task) return { ok: false, reason: "no-task", misconception: null };
  const d = derive(st);
  if (!d.finished) return { ok: false, reason: "not-finished", misconception: null };
  const want = task.area === undefined ? null : toFrac(String(task.area));
  if (!want) return { ok: true, reason: "correct", misconception: null };
  const same = want.n === d.total.n && want.d === d.total.d;
  return { ok: same, reason: same ? "correct" : "incorrect", misconception: null };
}

export const create = defineFamily({
  id,
  normalize,
  reduce,
  validateState,
  derive,
  validateTask,
  accessibleDescription,
  explanation,
  describeConfig: (st) => ({ n: st.n, side: st.side, apothem: st.apothem, unit: st.unit, presets: st.presets }),
});

// ── Drawing (floats are fine here: they only place the picture) ──────────────

const W = 320;
const H = 272;
const CX = 160;
const CY = 126;
const R = 104;
const f1 = (v) => v.toFixed(1);
const pts = (list) => list.map(([x, y]) => `${f1(x)},${f1(y)}`).join(" ");
const angle = (n, i) => Math.PI / 2 - Math.PI / n + (2 * Math.PI * i) / n;
const vertex = (n, i) => [CX + R * Math.cos(angle(n, i)), CY + R * Math.sin(angle(n, i))];

function wedgeClass(d, i) {
  const done = i < d.split;
  const focus = d.stage >= 1 && i === 0;
  return `fm-polygon-wedge ${done ? "is-split" : "is-next"}${focus ? " is-focus" : ""}${d.stage >= 1 && !focus ? " is-dim" : ""}`;
}

function drawFigure(d, L) {
  const g = s("g");
  const v = Array.from({ length: d.n }, (_, i) => vertex(d.n, i));
  g.append(s("polygon", { class: "fm-polygon-shape", points: pts(v) }));
  for (let i = 0; i <= Math.min(d.split, d.n - 1); i++) {
    g.append(s("polygon", { class: wedgeClass(d, i), points: pts([[CX, CY], v[i], v[(i + 1) % d.n]]) }));
  }
  g.append(s("circle", { class: "fm-polygon-center", cx: CX, cy: CY, r: 4 }));
  if (d.stage === 0) {
    for (let i = 0; i < d.split; i++) {
      const a = angle(d.n, i) + Math.PI / d.n;
      g.append(stext(CX + R * 0.74 * Math.cos(a), CY + R * 0.74 * Math.sin(a) + 5, String(i + 1), "fm-svg-text fm-polygon-num", "middle"));
    }
    if (d.split === 0) g.append(stext(CX + 10, CY - 8, t(L, STR.center), "fm-svg-text fm-svg-muted"));
  } else {
    const baseY = CY + R * Math.cos(Math.PI / d.n);
    g.append(
      s("line", { class: "fm-polygon-base", x1: v[0][0], y1: v[0][1], x2: v[1][0], y2: v[1][1] }),
      s("line", { class: "fm-polygon-height", x1: CX, y1: CY, x2: CX, y2: baseY }),
      s("path", { class: "fm-polygon-right", d: `M${f1(CX - 9)},${f1(baseY)} v-9 h9` }),
      stext(CX, baseY + 24, `base = ${len(d, L, d.side)}`, "fm-svg-text fm-polygon-tag", "middle"),
      stext(CX + 10, (CY + baseY) / 2 + 5, `${T2(L, "height", "altura")} = ${len(d, L, d.apothem)}`, "fm-svg-text fm-polygon-tag fm-svg-strong"),
    );
  }
  return g;
}

const presetLabel = (p, L) => T2(L, `${NAMES[p.n - MIN_N].en}: side ${num(p.side)}, apothem ${num(p.apothem)} ${p.unit.en}`, `${NAMES[p.n - MIN_N].es}: lado ${num(p.side)}, apotema ${num(p.apothem)} ${p.unit.es}`);

export function mount(root, model, { lang = "en", onChange, readonly = false } = {}) {
  let L = lang;
  let ui = {};
  const T = (k) => t(L, STR[k]);

  function build(v) {
    L = v.lang;
    ui = {};
    const bag = v.bag;
    const st0 = model.getState();
    ui.prompt = model.task?.prompt ? h("p", { class: "fm-prompt" }, t(L, model.task.prompt)) : null;
    ui.picks = st0.presets.length > 1 && !readonly ? h("div", { class: "fm-polygon-picks", role: "group", "aria-label": T("shapes") }) : null;
    ui.given = h("p", { class: "fm-polygon-given" });
    ui.less = button(bag, "−", { cls: "fm-step", ariaLabel: T("fewer"), disabled: readonly, onClick: () => model.setState({ n: model.getState().n - 1 }) });
    ui.more = button(bag, "+", { cls: "fm-step", ariaLabel: T("more"), disabled: readonly, onClick: () => model.setState({ n: model.getState().n + 1 }) });
    ui.count = h("output", { class: "fm-num fm-polygon-sides" });
    ui.stepper = h("div", { class: "fm-polygon-stepper", role: "group", "aria-label": T("sides") }, ui.less, ui.count, ui.more);
    ui.note = h("p", { class: "fm-cap fm-polygon-note" }, `${T("same")} ${T("sketch")}`);
    ui.svg = s("svg", { class: "fm-svg fm-polygon-svg", viewBox: `0 0 ${W} ${H}`, role: "img" });
    ui.tally = h("p", { class: "fm-polygon-tally" });
    ui.moves = h("div", { class: "fm-polygon-moves", role: "group", "aria-label": T("steps") });
    ui.hint = h("p", { class: "fm-explain fm-polygon-hint", role: "status" });
    ui.result = h("div", { class: "fm-polygon-result", hidden: "" });
    ui.desc = h("p", { class: "fm-sr" });
    if (!readonly) {
      bag.on(ui.moves, "click", (e) => {
        const b = e.target.closest?.("[data-act]");
        if (!b || b.disabled) return;
        const st = model.getState();
        const act = b.dataset.act;
        if (act === "split") model.setState({ split: st.split + 1 });
        else if (act === "all") model.setState({ splitAll: true });
        else model.setState({ stage: st.stage + 1 });
      });
      if (ui.picks) {
        bag.on(ui.picks, "click", (e) => {
          const b = e.target.closest?.("[data-pick]");
          if (b) model.setState({ preset: Number(b.dataset.pick) });
        });
      }
    }
    put(root, ui.prompt, ui.picks, ui.given, ui.stepper, ui.note, ui.svg, ui.tally, ui.moves, ui.hint, ui.result, ui.desc);
    if (!readonly) {
      ui.undo = button(bag, T("undo"), { onClick: () => model.undo() });
      ui.reset = button(bag, T("reset"), { onClick: () => model.reset() });
      put(root, h("div", { class: "fm-actions" }, ui.undo, ui.reset));
    }
  }

  function actionButton(act, text) {
    return h("button", { type: "button", class: "fm-btn fm-polygon-move is-next", "data-act": act, disabled: readonly }, text);
  }

  function sync() {
    const d = model.getState();
    ui.given.textContent = givenLine(d, L);
    ui.count.textContent = T2(L, `${d.n} sides`, `${d.n} lados`);
    ui.less.disabled = readonly || d.n <= MIN_N;
    ui.more.disabled = readonly || d.n >= MAX_N;
    ui.svg.replaceChildren(drawFigure(d, L));
    ui.svg.setAttribute("aria-label", `${shapeName(d, L)}: ${countLine(d, L)}`);
    ui.tally.textContent = `${countLine(d, L)}. ${d.allSplit ? sidesLine(d, L) : ""}`.trim();
    const hadFocus = ui.moves.contains(globalThis.document.activeElement);
    const buttons = [];
    if (d.next === "split") buttons.push(actionButton("split", t(L, LABEL.split)), actionButton("all", T2(L, `Split all ${d.n}`, `Separar los ${d.n}`)));
    else if (d.next) buttons.push(actionButton("stage", t(L, LABEL[d.next])));
    ui.moves.replaceChildren(...buttons);
    if (hadFocus) (ui.moves.querySelector("button") || ui.stepper.querySelector("button:not(:disabled)"))?.focus({ preventScroll: true });
    ui.hint.textContent = hint(d, L);
    ui.result.hidden = d.stage < 2;
    if (d.stage >= 2) {
      ui.result.replaceChildren(
        h("p", { class: "fm-polygon-eq" }, triLine(d, L)),
        h("p", null, rectLine(d, L)),
        d.stage >= 3 ? h("p", { class: "fm-polygon-eq" }, totalLine(d, L)) : null,
        d.stage >= 3 ? h("p", null, checkLine(d, L)) : null,
      );
    }
    if (ui.picks) {
      ui.picks.replaceChildren(
        ...d.presets.map((p, i) => {
          const on = p.n === d.n && p.side.n === d.side.n && p.side.d === d.side.d && p.apothem.n === d.apothem.n && p.apothem.d === d.apothem.d;
          return h("button", { type: "button", class: "fm-btn", "aria-pressed": String(on), "data-pick": String(i) }, presetLabel(p, L));
        }),
      );
    }
    if (ui.undo) ui.undo.disabled = !model.canUndo();
    ui.desc.textContent = model.getAccessibleDescription(L);
  }

  const say = (d, lang2) => `${status(d, lang2)} ${hint(d, lang2)}`;
  return createView(root, model, { lang, onChange, cls: "fm-polygon", build, sync, say });
}
