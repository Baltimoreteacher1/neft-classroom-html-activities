// Family "coordinate": a four-quadrant plane with draggable points (snapping to whole units, or to
// halves in fine mode), a linked table of ordered pairs, a reflection toggle across either axis and
// the distance between two points on the same horizontal or vertical line. Exact fractions.
import {
  button,
  clamp,
  clear,
  cmp,
  createView,
  defineFamily,
  eq,
  field,
  frac,
  fracToString,
  h,
  isRat,
  put,
  s,
  sign,
  stext,
  sub,
  t,
  toFrac,
  toNumber,
} from "./core.mjs";

export const id = "coordinate";
export const label = { en: "Coordinate plane models", es: "Modelos de plano de coordenadas" };

const MAX_POINTS = 6;
const MINUS = "−";
const NAMES = "ABCDEF";
const ACTIONS = ["point", "add", "remove", "reflect", "fine", "pair"];

const num = (r) => fracToString(r).replace("-", MINUS);
const abs = (r) => (sign(r) < 0 ? frac(-r.n, r.d) : r);
const neg = (r) => frac(-r.n, r.d);
const pairText = (p) => `(${num(p.x)}, ${num(p.y)})`;
const reflectPoint = (p, axis) => (axis === "x" ? { x: p.x, y: neg(p.y) } : { x: neg(p.x), y: p.y });
const samePoint = (p, q) => eq(p.x, q.x) && eq(p.y, q.y);

/** "(−2, 3)", "-2, 3", [x, y] or {x, y} -> {x, y} rationals, or null. Never throws. */
export function parsePair(raw) {
  let x;
  let y;
  if (Array.isArray(raw)) [x, y] = raw;
  else if (raw && typeof raw === "object") ({ x, y } = raw);
  else {
    const parts = String(raw ?? "")
      .replace(/[−–]/g, "-")
      .replace(/[()\s]/g, "")
      .split(",");
    if (parts.length !== 2) return null;
    [x, y] = parts;
  }
  const p = { x: toFrac(x), y: toFrac(y) };
  return p.x && p.y ? p : null;
}

function quadrant(p) {
  if (sign(p.x) === 0 || sign(p.y) === 0) return "axis";
  return sign(p.x) > 0 ? (sign(p.y) > 0 ? "I" : "IV") : sign(p.y) > 0 ? "II" : "III";
}

/** Distance along a shared horizontal or vertical line, with the arithmetic that shows why. */
function distanceOf(a, b) {
  const horizontal = eq(a.y, b.y);
  const vertical = eq(a.x, b.x);
  if (!horizontal && !vertical) return null;
  const [p, q] = horizontal ? [a.x, b.x] : [a.y, b.y];
  const opposite = sign(p) * sign(q) < 0;
  return { axis: horizontal ? "horizontal" : "vertical", d: abs(sub(p, q)), p, q, opposite };
}

// ── State ────────────────────────────────────────────────────────────────────

const inBox = (p, range) => !!p && isRat(p.x) && isRat(p.y) && cmp(abs(p.x), frac(range)) <= 0 && cmp(abs(p.y), frac(range)) <= 0;

function validateState(st) {
  if (!st || !Number.isInteger(st.range) || st.range < 2 || st.range > 10) return false;
  if (typeof st.fine !== "boolean" || ![null, "x", "y"].includes(st.reflect)) return false;
  if (!Array.isArray(st.points) || st.points.length < 1 || st.points.length > MAX_POINTS) return false;
  if (!st.points.every((p) => inBox(p, st.range))) return false;
  if (st.pair === null) return true;
  const n = st.points.length;
  return Array.isArray(st.pair) && st.pair.length === 2 && st.pair.every((i) => Number.isInteger(i) && i >= 0 && i < n) && st.pair[0] !== st.pair[1];
}

const defaultPair = (n) => (n >= 2 ? [0, 1] : null);

function reduce(st, patch) {
  if (!patch || typeof patch !== "object" || Object.keys(patch).some((k) => !ACTIONS.includes(k))) return null;
  const next = { ...st, points: st.points.map((p) => ({ ...p })) };
  const spot = (raw) => {
    const p = parsePair(raw);
    return p && inBox(p, st.range) ? p : null;
  };
  if ("fine" in patch) next.fine = patch.fine === true;
  if ("reflect" in patch) {
    if (![null, "x", "y"].includes(patch.reflect)) return null;
    next.reflect = patch.reflect;
  }
  if ("point" in patch) {
    const { i } = patch.point || {};
    const p = spot(patch.point);
    if (!Number.isInteger(i) || i < 0 || i >= next.points.length || !p) return null;
    next.points[i] = p;
  }
  if ("add" in patch) {
    if (next.points.length >= MAX_POINTS) return null;
    let p = patch.add === true ? null : spot(patch.add);
    if (patch.add === true) {
      for (let k = 0; k <= st.range * 2 && !p; k++) {
        const c = { x: frac(k % (st.range + 1)), y: frac(Math.floor(k / (st.range + 1))) };
        if (!next.points.some((q) => samePoint(q, c))) p = c;
      }
    }
    if (!p) return null;
    next.points.push(p);
    next.pair = next.pair ?? defaultPair(next.points.length);
  }
  if ("remove" in patch) {
    const i = patch.remove;
    if (!Number.isInteger(i) || i < 0 || i >= next.points.length || next.points.length < 2) return null;
    next.points.splice(i, 1);
    next.pair = defaultPair(next.points.length);
  }
  if ("pair" in patch) next.pair = patch.pair;
  return next;
}

function derive(st) {
  const d = st.pair ? distanceOf(st.points[st.pair[0]], st.points[st.pair[1]]) : null;
  return {
    ...st,
    quadrants: st.points.map(quadrant),
    images: st.reflect ? st.points.map((p) => reflectPoint(p, st.reflect)) : null,
    distance: d,
    step: st.fine ? frac(1, 2) : frac(1),
  };
}

function normalize(config) {
  const c = config || {};
  const range = c.range ?? 6;
  const raw = c.points ?? [{ x: -2, y: 3 }];
  const points = raw.map((p) => {
    const q = parsePair(p);
    if (!q) throw new TypeError("coordinate: every point needs an x and a y");
    return q;
  });
  const state = { range, fine: c.fine === true, reflect: c.reflect ?? null, points, pair: c.pair ?? defaultPair(points.length) };
  if (!validateState(state)) throw new TypeError("coordinate: invalid configuration");
  return { state, task: c.task || null };
}

// ── Words ────────────────────────────────────────────────────────────────────

const AXIS = { x: { en: "x-axis", es: "eje x" }, y: { en: "y-axis", es: "eje y" } };
const quadWord = (q, lang) => (q === "axis" ? t(lang, { en: "on an axis", es: "sobre un eje" }) : t(lang, { en: `in quadrant ${q}`, es: `en el cuadrante ${q}` }));

function accessibleDescription(st, lang) {
  const d = derive(st);
  const lo = num(neg(frac(st.range)));
  const pts = st.points.map((p, i) => `${NAMES[i]} ${t(lang, { en: "at", es: "en" })} ${pairText(p)} ${quadWord(d.quadrants[i], lang)}`).join("; ");
  const refl = d.images
    ? t(lang, {
        en: ` Reflected across the ${AXIS[st.reflect].en}: ${d.images.map((p, i) => `${NAMES[i]}′ at ${pairText(p)}`).join("; ")}.`,
        es: ` Reflejados en el ${AXIS[st.reflect].es}: ${d.images.map((p, i) => `${NAMES[i]}′ en ${pairText(p)}`).join("; ")}.`,
      })
    : "";
  return t(lang, {
    en: `Coordinate plane from ${lo} to ${st.range} on both axes. ${pts}.${refl}`,
    es: `Plano de coordenadas de ${lo} a ${st.range} en los dos ejes. ${pts}.${refl}`,
  });
}

function distanceText(st, d, lang) {
  const [a, b] = st.pair.map((i) => NAMES[i]);
  if (!d.distance) {
    return t(lang, {
      en: `${a} and ${b} are not on the same horizontal or vertical line, so you cannot count straight across.`,
      es: `${a} y ${b} no están en la misma recta horizontal ni vertical, así que no se puede contar en línea recta.`,
    });
  }
  const { p, q, d: dist, opposite, axis } = d.distance;
  const line = axis === "horizontal" ? t(lang, { en: "horizontal", es: "horizontal" }) : t(lang, { en: "vertical", es: "vertical" });
  const coord = axis === "horizontal" ? "x" : "y";
  const how = opposite
    ? t(lang, {
        en: `The ${coord}-coordinates ${num(p)} and ${num(q)} are on opposite sides of 0: ${num(abs(p))} + ${num(abs(q))} = ${num(dist)}.`,
        es: `Las coordenadas ${coord} ${num(p)} y ${num(q)} están en lados opuestos del 0: ${num(abs(p))} + ${num(abs(q))} = ${num(dist)}.`,
      })
    : t(lang, {
        en: `The ${coord}-coordinates are on the same side of 0: |${num(p)} ${MINUS} ${num(q)}| = ${num(dist)}.`,
        es: `Las coordenadas ${coord} están del mismo lado del 0: |${num(p)} ${MINUS} ${num(q)}| = ${num(dist)}.`,
      });
  return t(lang, {
    en: `${a} and ${b} are on a ${line} line, ${num(dist)} units apart. ${how}`,
    es: `${a} y ${b} están en una recta ${line}, a ${num(dist)} unidades. ${how}`,
  });
}

function explanation(st, lang) {
  const d = derive(st);
  const p = st.points[0];
  const out = [
    t(lang, {
      en: `A point is written (x, y). The first number tells how far left or right of the origin, and the second tells how far up or down. Point A is ${pairText(p)}: x = ${num(p.x)}, y = ${num(p.y)}.`,
      es: `Un punto se escribe (x, y). El primer número dice cuánto a la izquierda o a la derecha del origen, y el segundo cuánto arriba o abajo. El punto A es ${pairText(p)}: x = ${num(p.x)}, y = ${num(p.y)}.`,
    }),
  ];
  if (st.reflect) {
    const flips = st.reflect === "y" ? "x" : "y";
    const img = d.images[0];
    out.push(
      t(lang, {
        en: `Reflecting across the ${AXIS[st.reflect].en} changes the sign of ${flips} and keeps the other coordinate: ${pairText(p)} becomes ${pairText(img)}.`,
        es: `Reflejar en el ${AXIS[st.reflect].es} cambia el signo de ${flips} y deja igual la otra coordenada: ${pairText(p)} pasa a ${pairText(img)}.`,
      }),
    );
  }
  if (st.pair) out.push(distanceText(st, d, lang));
  return out.join(" ");
}

// ── validate(task) ───────────────────────────────────────────────────────────

/** Why a point is not where it should be: swapped coordinates, or the right size with a wrong sign. */
function pointWrong(want, got) {
  if (eq(got.x, want.y) && eq(got.y, want.x)) return "swapped-coordinates";
  if (eq(abs(got.x), abs(want.x)) && eq(abs(got.y), abs(want.y))) return "sign-error-quadrant";
  return null;
}

function validateTask(st, task) {
  const none = (reason, ok = false) => ({ ok, reason, misconception: null });
  const wrong = (m) => ({ ok: false, reason: "incorrect", misconception: m && { id: m, confidence: "possible" } });
  if (!task) return none("no-task");
  const at = (i, fallback) => st.points[Number.isInteger(i) ? i : fallback];
  if (task.kind === "plot-point" || task.kind === "read-point") {
    const want = task.kind === "plot-point" ? parsePair(task.target) : parsePair(task.point ?? at(task.index, 0));
    const got = task.answer !== undefined ? parsePair(task.answer) : task.kind === "plot-point" ? at(task.index, 0) : null;
    if (!want) return none("invalid-task");
    if (!got) return none("invalid-answer");
    return samePoint(want, got) ? none("correct", true) : wrong(pointWrong(want, got));
  }
  if (task.kind === "reflect") {
    const axis = task.axis ?? st.reflect;
    const from = parsePair(task.point ?? at(task.index, 0));
    if (!["x", "y"].includes(axis) || !from) return none("invalid-task");
    const got = task.answer !== undefined ? parsePair(task.answer) : at(task.imageIndex, 1);
    if (!got) return none("invalid-answer");
    const want = reflectPoint(from, axis);
    if (samePoint(want, got)) return none("correct", true);
    if (samePoint(reflectPoint(from, axis === "x" ? "y" : "x"), got)) return wrong("sign-error-quadrant");
    const swapped = (p) => eq(got.x, p.y) && eq(got.y, p.x);
    return wrong(swapped(from) || swapped(want) ? "swapped-coordinates" : null);
  }
  if (task.kind === "distance") {
    const [a, b] = task.from && task.to ? [parsePair(task.from), parsePair(task.to)] : st.pair ? st.pair.map((i) => st.points[i]) : [null, null];
    const dist = a && b ? distanceOf(a, b) : null;
    if (!dist) return none("invalid-task");
    const given = toFrac(task.answer);
    if (!given || sign(given) < 0) return none("invalid-answer");
    if (eq(given, dist.d)) return none("correct", true);
    // Subtracting sizes (|3| and |4| -> 1) instead of crossing zero (3 + 4 -> 7).
    return wrong(dist.opposite && eq(given, abs(sub(abs(dist.p), abs(dist.q)))) ? "distance-ignores-sign-change" : null);
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
  track: (patch) => !Object.keys(patch).every((k) => ["fine", "reflect"].includes(k)),
  describeConfig: (st) => ({ range: st.range, points: st.points.map(pairText), reflect: st.reflect, pair: st.pair }),
});

// ── Rendering ────────────────────────────────────────────────────────────────

const STR = {
  plane: { en: "Coordinate plane", es: "Plano de coordenadas" },
  handle: { en: "Arrow keys move it: left and right change x, up and down change y.", es: "Las flechas lo mueven: izquierda y derecha cambian x, arriba y abajo cambian y." },
  point: { en: "Point", es: "Punto" },
  table: { en: "Ordered pairs", es: "Pares ordenados" },
  reflect: { en: "Reflect across", es: "Reflejar en" },
  none: { en: "No reflection", es: "Sin reflexión" },
  half: { en: "Half steps", es: "Medios pasos" },
  add: { en: "Add a point", es: "Agregar un punto" },
  remove: { en: "Remove point", es: "Quitar punto" },
  undo: { en: "Undo", es: "Deshacer" },
  reset: { en: "Start over", es: "Empezar de nuevo" },
  image: { en: "Image", es: "Imagen" },
  distance: { en: "Distance", es: "Distancia" },
  invalid: { en: "Type a number like 2, −1.5 or 1/2, inside the plane.", es: "Escribe un número como 2, −1.5 o 1/2, dentro del plano." },
};
const W = 360;
const HALF = 160;
let uid = 0;

export function mount(root, model, { lang = "en", onChange, readonly = false } = {}) {
  const id0 = `fmc${++uid}`;
  let bag;
  let L = lang;
  let ui = {};
  const state = () => model.getState();
  const T = (k) => t(L, STR[k]);
  const unit = (d) => HALF / d.range;
  const X = (v, d) => W / 2 + toNumber(v) * unit(d);
  const Y = (v, d) => W / 2 - toNumber(v) * unit(d);

  /** One draggable point: pointer drag, arrow keys (x with left/right, y with up/down). */
  function pointHandle(i) {
    const g = s("g", { class: "fm-handle fm-point-handle", role: "slider", tabindex: "0" }, s("circle", { class: "fm-hit", r: 40 }), s("circle", { class: "fm-ring", r: 17 }), s("circle", { class: "fm-knob", r: 9 }), stext(13, -11, NAMES[i], "fm-svg-text fm-svg-strong"));
    g.style.touchAction = "none";
    const move = (x, y) => {
      const d = state();
      const step = toNumber(d.step);
      const snap = (v) => clamp(Math.round(v / step) * step, -d.range, d.range);
      model.setState({ point: { i, x: snap(x), y: snap(y) } });
    };
    bag.on(g, "keydown", (e) => {
      const d = state();
      const p = d.points[i];
      const step = e.shiftKey ? 5 : toNumber(d.step);
      const dx = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
      const dy = e.key === "ArrowUp" ? step : e.key === "ArrowDown" ? -step : 0;
      if (!dx && !dy) return;
      e.preventDefault();
      move(toNumber(p.x) + dx, toNumber(p.y) + dy);
    });
    let drag = false;
    const at = (e) => {
      const r = ui.svg.getBoundingClientRect?.();
      const k = r && r.width > 0 ? r.width / W : 1;
      const d = state();
      return [((e.clientX - (r ? r.left : 0)) / k - W / 2) / unit(d), (W / 2 - (e.clientY - (r ? r.top : 0)) / k) / unit(d)];
    };
    bag.on(g, "pointerdown", (e) => {
      if (e.button) return;
      drag = true;
      try {
        g.setPointerCapture?.(e.pointerId);
      } catch {
        // synthetic events carry no live pointer
      }
      g.classList.add("fm-dragging");
      g.focus?.({ preventScroll: true });
      e.preventDefault();
    });
    bag.on(g, "pointermove", (e) => {
      if (drag) move(...at(e));
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
      bag.on(g, type, () => {
        drag = false;
        g.classList.remove("fm-dragging");
      });
    }
    return g;
  }

  function commitCell(i, axis, f, value) {
    const p = state().points[i];
    const ok = model.setState({ point: { i, x: axis === "x" ? value : p.x, y: axis === "y" ? value : p.y } });
    f.invalid(!ok);
    ui.msg.textContent = ok ? "" : T("invalid");
  }

  function build(v) {
    bag = v.bag;
    L = v.lang;
    ui = { rows: [], handles: [] };
    const st = state();
    ui.prompt = model.task?.prompt ? h("p", { class: "fm-prompt" }, t(L, model.task.prompt)) : null;
    ui.explain = h("p", { class: "fm-explain" });
    ui.desc = h("p", { class: "fm-sr" });
    ui.msg = h("p", { class: "fm-msg", role: "status" });
    ui.svg = s("svg", { class: "fm-svg fm-plane", viewBox: `0 0 ${W} ${W}`, role: "group", "aria-label": T("plane") });
    ui.body = s("g");
    ui.svg.append(ui.body);
    ui.tbody = h("tbody");
    ui.thead = h("tr");
    ui.table = h("table", { class: "fm-table" }, h("caption", { class: "fm-sr" }, T("table")), h("thead", null, ui.thead), ui.tbody);
    ui.dist = field(bag, { id: `${id0}-dist`, label: T("distance"), readonly: true });
    const controls = [];
    if (!readonly) {
      ui.add = button(bag, T("add"), { onClick: () => model.setState({ add: true }) });
      ui.half = button(bag, T("half"), { pressed: st.fine, onClick: () => model.setState({ fine: !state().fine }) });
      ui.undo = button(bag, T("undo"), { onClick: () => model.undo() });
      ui.refl = [null, "x", "y"].map((axis) =>
        button(bag, axis ? `${T("reflect")} ${t(L, AXIS[axis])}` : T("none"), { pressed: st.reflect === axis, onClick: () => model.setState({ reflect: axis }) }),
      );
      controls.push(h("div", { class: "fm-row", role: "group", "aria-label": T("reflect") }, ...ui.refl), h("div", { class: "fm-row" }, ui.add, ui.half, ui.undo, button(bag, T("reset"), { onClick: () => model.reset() })));
    }
    put(root, ui.prompt, h("section", { class: "fm-view", "aria-label": T("plane") }, ui.svg), h("section", { class: "fm-view fm-view-table", "aria-label": T("table") }, h("div", { class: "fm-table-wrap" }, ui.table)), ...controls, h("div", { class: "fm-fields" }, ui.dist.el), ui.msg, ui.explain, ui.desc);
  }

  function drawPlane(d) {
    const g = ui.body;
    clear(g);
    const u = unit(d);
    // Every gridline is numbered; a wide range shrinks the numerals (>= 9px) instead of skipping.
    const fs = u >= 26 ? "" : `font-size:${Math.max(9, Math.floor(u * 0.6))}px`;
    const tick = (x, y, v, anchor) => {
      const el = stext(x, y, num(frac(v)), "fm-svg-text fm-tick-label", anchor);
      if (fs) el.setAttribute("style", fs);
      return el;
    };
    for (let k = -d.range; k <= d.range; k++) {
      const p = W / 2 + k * u;
      g.append(s("line", { class: "fm-grid-line", x1: p, x2: p, y1: W / 2 - HALF, y2: W / 2 + HALF }), s("line", { class: "fm-grid-line", y1: p, y2: p, x1: W / 2 - HALF, x2: W / 2 + HALF }));
    }
    g.append(s("line", { class: `fm-axis${d.reflect === "x" ? " fm-mirror" : ""}`, x1: W / 2 - HALF - 6, x2: W / 2 + HALF + 6, y1: W / 2, y2: W / 2 }), s("line", { class: `fm-axis${d.reflect === "y" ? " fm-mirror" : ""}`, y1: W / 2 - HALF - 6, y2: W / 2 + HALF + 6, x1: W / 2, x2: W / 2 }));
    g.append(tick(W / 2 - 6, W / 2 + 18, 0, "end"));
    for (let k = 1; k <= d.range; k++) {
      for (const sg of [1, -1]) {
        g.append(tick(W / 2 + sg * k * u, W / 2 + 18, sg * k, "middle"), tick(W / 2 - 6, W / 2 - sg * k * u + 5, sg * k, "end"));
      }
    }
    g.append(stext(W - 8, W / 2 - 8, "x", "fm-svg-text fm-svg-strong", "end"), stext(W / 2 + 10, 14, "y", "fm-svg-text fm-svg-strong"));
    if (d.distance) {
      const [a, b] = d.pair.map((i) => d.points[i]);
      const off = 16;
      const horizontal = d.distance.axis === "horizontal";
      const [x1, y1, x2, y2] = horizontal ? [X(a.x, d), Y(a.y, d) + off, X(b.x, d), Y(b.y, d) + off] : [X(a.x, d) + off, Y(a.y, d), X(b.x, d) + off, Y(b.y, d)];
      g.append(s("line", { class: "fm-bracket", x1, y1, x2, y2 }), stext((x1 + x2) / 2 + (horizontal ? 0 : 8), (y1 + y2) / 2 + (horizontal ? 18 : 5), num(d.distance.d), "fm-svg-text fm-svg-strong", horizontal ? "middle" : "start"));
    }
    d.images?.forEach((p, i) => {
      const o = d.points[i];
      const [cx, cy] = [X(p.x, d), Y(p.y, d)];
      g.append(s("line", { class: "fm-connector", x1: X(o.x, d), y1: Y(o.y, d), x2: cx, y2: cy }), s("rect", { class: "fm-ghost", x: cx - 7, y: cy - 7, width: 14, height: 14, transform: `rotate(45 ${cx} ${cy})` }), stext(cx + 12, cy - 11, `${NAMES[i]}′`, "fm-svg-text"));
    });
    d.points.forEach((p, i) => {
      if (readonly) {
        g.append(s("circle", { class: "fm-knob", cx: X(p.x, d), cy: Y(p.y, d), r: 9 }), stext(X(p.x, d) + 13, Y(p.y, d) - 11, NAMES[i], "fm-svg-text fm-svg-strong"));
      }
    });
    if (readonly) return;
    d.points.forEach((p, i) => {
      if (!ui.handles[i]) {
        ui.handles[i] = pointHandle(i);
        ui.svg.append(ui.handles[i]);
      }
      const hd = ui.handles[i];
      hd.removeAttribute("hidden");
      hd.setAttribute("transform", `translate(${X(p.x, d)} ${Y(p.y, d)})`);
      hd.setAttribute("aria-label", `${T("point")} ${NAMES[i]}. ${T("handle")}`);
      hd.setAttribute("aria-valuemin", String(-d.range));
      hd.setAttribute("aria-valuemax", String(d.range));
      hd.setAttribute("aria-valuenow", String(toNumber(p.x)));
      hd.setAttribute("aria-valuetext", `${NAMES[i]} ${pairText(p)}`);
    });
    ui.handles.forEach((hd, i) => {
      if (i >= d.points.length) hd.setAttribute("hidden", "");
    });
  }

  function drawTable(d) {
    const cols = [T("point"), "x", "y", d.images ? `${T("image")} x` : null, d.images ? `${T("image")} y` : null, readonly ? null : ""];
    if (ui.cols !== cols.join("|") || ui.rows.length !== d.points.length) {
      ui.cols = cols.join("|");
      clear(ui.thead);
      for (const c of cols) if (c !== null) ui.thead.append(h("th", { scope: "col" }, c === "" ? h("span", { class: "fm-sr" }, T("remove")) : c));
      clear(ui.tbody);
      ui.rows = d.points.map((_, i) => {
        const fx = field(bag, { id: `${id0}-r${i}x`, label: `${NAMES[i]} x`, readonly, onCommit: (val) => commitCell(i, "x", fx, val) });
        const fy = field(bag, { id: `${id0}-r${i}y`, label: `${NAMES[i]} y`, readonly, onCommit: (val) => commitCell(i, "y", fy, val) });
        const ix = h("td", { class: "fm-num" });
        const iy = h("td", { class: "fm-num" });
        const tr = h("tr", null, h("th", { scope: "row" }, NAMES[i]), h("td", null, fx.el), h("td", null, fy.el), d.images ? ix : null, d.images ? iy : null);
        if (!readonly) tr.append(h("td", { class: "fm-actions" }, button(bag, "×", { cls: "fm-step", ariaLabel: `${T("remove")} ${NAMES[i]}`, disabled: d.points.length < 2, onClick: () => model.setState({ remove: i }) })));
        ui.tbody.append(tr);
        return { fx, fy, ix, iy };
      });
    }
    d.points.forEach((p, i) => {
      const r = ui.rows[i];
      r.fx.set(num(p.x));
      r.fy.set(num(p.y));
      r.ix.textContent = d.images ? num(d.images[i].x) : "";
      r.iy.textContent = d.images ? num(d.images[i].y) : "";
    });
  }

  function sync(v) {
    const d = state();
    drawPlane(d);
    drawTable(d);
    ui.dist.set(!d.pair ? "–" : d.distance ? `${NAMES[d.pair[0]]}${NAMES[d.pair[1]]} = ${num(d.distance.d)}` : "–");
    if (ui.refl) [null, "x", "y"].forEach((axis, i) => ui.refl[i].setAttribute("aria-pressed", String(d.reflect === axis)));
    ui.half?.setAttribute("aria-pressed", String(d.fine));
    if (ui.undo) ui.undo.disabled = !model.canUndo();
    if (ui.add) ui.add.disabled = d.points.length >= MAX_POINTS;
    ui.explain.textContent = model.getMathematicalExplanation(L);
    ui.desc.textContent = model.getAccessibleDescription(L);
    for (const hd of v.handles) hd.refresh();
  }

  return createView(root, model, {
    lang,
    onChange,
    cls: "fm-coordinate",
    build,
    sync,
    say: (st, l) => st.points.map((p, i) => `${NAMES[i]} ${t(l, { en: "at", es: "en" })} ${pairText(p)}`).join("; "),
  });
}
