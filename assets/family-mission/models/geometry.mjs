// Family "geometry": (a) area by decomposition (rectangle, parallelogram, triangle, trapezoid) with
// draggable base and height, (b) volume of a rectangular prism with fractional edges, counted in
// unit cubes of side 1/n, shown as layers, and (c) the net of a rectangular prism with a fold /
// unfold toggle and a live surface-area sum. All 2D SVG (no WebGL); every measure is an exact fraction.
import {
  add,
  button,
  clear,
  cmp,
  createView,
  defineFamily,
  eq,
  frac,
  fracToString,
  h,
  isRat,
  makeDraggable,
  mul,
  put,
  s,
  sign,
  stext,
  t,
  toFrac,
  toNumber,
} from "./core.mjs";

export const id = "geometry";
export const label = { en: "Geometry models", es: "Modelos de geometría" };

const MODES = ["area", "volume", "net"];
const SHAPES = ["rect", "parallelogram", "triangle", "trapezoid"];
const ACTIONS = ["shape", "b", "b2", "h", "slant", "l", "w", "decompose", "folded"];
const HALF = frac(1, 2);
const TWO = frac(2);
const KEYS = { area: ["b", "b2", "h"], volume: ["l", "w", "h"], net: ["l", "w", "h"] };

const num = (r) => fracToString(r);
const pv = (r) => (r.d === 1 ? num(r) : `(${num(r)})`);
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a / gcd(a, b)) * b;
const pos = (r, max) => isRat(r) && sign(r) > 0 && cmp(r, frac(max)) <= 0;

// ── Measures (pure) ──────────────────────────────────────────────────────────

const areaOf = (shape, d) => {
  const base = shape === "trapezoid" ? add(d.b, d.b2) : d.b;
  const full = mul(base, d.h);
  return shape === "triangle" || shape === "trapezoid" ? mul(full, HALF) : full;
};
const areaExpr = (shape, d, height = d.h) =>
  shape === "triangle"
    ? `½ × ${pv(d.b)} × ${pv(height)}`
    : shape === "trapezoid"
      ? `½ × (${num(d.b)} + ${num(d.b2)}) × ${pv(height)}`
      : `${pv(d.b)} × ${pv(height)}`;
const volumeOf = (d) => mul(mul(d.l, d.w), d.h);
const faces = (d) => [
  { id: "front", a: d.l, b: d.h },
  { id: "back", a: d.l, b: d.h },
  { id: "top", a: d.l, b: d.w },
  { id: "bottom", a: d.l, b: d.w },
  { id: "left", a: d.w, b: d.h },
  { id: "right", a: d.w, b: d.h },
].map((f) => ({ ...f, area: mul(f.a, f.b) }));
const surfaceOf = (d) => faces(d).reduce((n, f) => add(n, f.area), frac(0));
/** Cube edge 1/n where n is the least common denominator of the three edges. */
const cubeN = (d) => [d.l, d.w, d.h].reduce((n, r) => lcm(n, r.d), 1);

// ── State ────────────────────────────────────────────────────────────────────

function validateState(st) {
  if (!st || !MODES.includes(st.mode) || !Number.isInteger(st.max) || st.max < 4 || st.max > 20) return false;
  if (!isRat(st.step) || sign(st.step) <= 0 || cmp(st.step, frac(1)) > 0) return false;
  if (st.mode === "area") {
    if (!SHAPES.includes(st.shape) || typeof st.decompose !== "boolean") return false;
    if (![st.b, st.h, st.slant].every((r) => pos(r, st.max)) || cmp(st.slant, st.h) < 0) return false;
    return st.shape !== "trapezoid" || pos(st.b2, st.max);
  }
  if (![st.l, st.w, st.h].every((r) => pos(r, st.max))) return false;
  return st.mode === "volume" || typeof st.folded === "boolean";
}

function reduce(st, patch) {
  if (!patch || typeof patch !== "object" || Object.keys(patch).some((k) => !ACTIONS.includes(k))) return null;
  const own = st.mode === "area" ? ["shape", "b", "b2", "h", "slant", "decompose"] : st.mode === "net" ? ["l", "w", "h", "folded"] : ["l", "w", "h"];
  if (Object.keys(patch).some((k) => !own.includes(k))) return null;
  const next = { ...st };
  for (const k of ["b", "b2", "h", "slant", "l", "w"]) {
    if (!(k in patch)) continue;
    const r = toFrac(patch[k]);
    if (!r || !pos(r, st.max)) return null;
    next[k] = r;
  }
  if ("shape" in patch) {
    if (!SHAPES.includes(patch.shape)) return null;
    next.shape = patch.shape;
    next.b2 ??= frac(Math.max(1, Math.min(st.max, Math.round(toNumber(st.b) / 2))));
  }
  if ("decompose" in patch) next.decompose = patch.decompose === true;
  if ("folded" in patch) next.folded = patch.folded === true;
  // The height is the perpendicular distance, so it can never be longer than the slanted side.
  if (st.mode === "area" && "h" in patch && cmp(next.h, next.slant) > 0) next.slant = next.h;
  return next;
}

function derive(st) {
  if (st.mode === "area") return { ...st, area: areaOf(st.shape, st) };
  const volume = volumeOf(st);
  const n = cubeN(st);
  const [nl, nw, nh] = [mul(st.l, frac(n)).n, mul(st.w, frac(n)).n, mul(st.h, frac(n)).n];
  return { ...st, volume, surface: surfaceOf(st), faces: faces(st), n, cubes: { perLayer: nl * nw, layers: nh, across: nl, deep: nw, total: nl * nw * nh } };
}

function normalize(config) {
  const c = config || {};
  const mode = c.mode ?? "area";
  if (!MODES.includes(mode)) throw new TypeError("geometry: mode must be area, volume or net");
  const need = (v, name) => {
    const r = toFrac(v);
    if (!r) throw new TypeError(`geometry: ${name} must be a number`);
    return r;
  };
  const state = { mode, max: c.max ?? (mode === "area" ? 10 : 6), step: need(c.step ?? HALF, "step") };
  if (mode === "area") {
    state.shape = c.shape ?? "triangle";
    state.b = need(c.b ?? 6, "b");
    state.h = need(c.h ?? 4, "h");
    state.slant = need(c.slant ?? (cmp(add(state.h, frac(1)), frac(state.max)) > 0 ? state.h : add(state.h, frac(1))), "slant");
    state.b2 = need(c.b2 ?? 4, "b2");
    state.decompose = c.decompose === true;
  } else {
    state.l = need(c.l ?? 3, "l");
    state.w = need(c.w ?? 2, "w");
    state.h = need(c.h ?? 4, "h");
    if (mode === "net") state.folded = c.folded === true;
  }
  if (!validateState(state)) throw new TypeError("geometry: invalid configuration");
  return { state, task: c.task || null };
}

// ── Words ────────────────────────────────────────────────────────────────────

const SHAPE_WORD = {
  rect: { en: "rectangle", es: "rectángulo" },
  parallelogram: { en: "parallelogram", es: "paralelogramo" },
  triangle: { en: "triangle", es: "triángulo" },
  trapezoid: { en: "trapezoid", es: "trapecio" },
};

function accessibleDescription(st, lang) {
  const d = derive(st);
  if (st.mode === "area") {
    const slant = st.shape === "rect" ? "" : t(lang, { en: `, slanted side ${num(st.slant)}`, es: `, lado inclinado ${num(st.slant)}` });
    const bases = st.shape === "trapezoid" ? `${num(st.b)} ${t(lang, { en: "and", es: "y" })} ${num(st.b2)}` : num(st.b);
    return t(lang, {
      en: `Area model: a ${SHAPE_WORD[st.shape].en} with ${st.shape === "trapezoid" ? "bases" : "base"} ${bases} and height ${num(st.h)}${slant}. Area ${areaExpr(st.shape, st)} = ${num(d.area)} square units.`,
      es: `Modelo de área: un ${SHAPE_WORD[st.shape].es} con ${st.shape === "trapezoid" ? "bases" : "base"} ${bases} y altura ${num(st.h)}${slant}. Área ${areaExpr(st.shape, st)} = ${num(d.area)} unidades cuadradas.`,
    });
  }
  const dims = `${num(st.l)} × ${num(st.w)} × ${num(st.h)}`;
  if (st.mode === "volume") {
    return t(lang, {
      en: `Rectangular prism ${dims}. Volume ${num(d.volume)} cubic units, counted as ${d.cubes.layers} layers of ${d.cubes.perLayer} cubes of side 1/${d.n}.`,
      es: `Prisma rectangular ${dims}. Volumen ${num(d.volume)} unidades cúbicas, contado como ${d.cubes.layers} capas de ${d.cubes.perLayer} cubos de lado 1/${d.n}.`,
    });
  }
  return t(lang, {
    en: `Net of a rectangular prism ${dims}, ${st.folded ? "folded into a box" : "unfolded flat"}. Six faces. Surface area ${num(d.surface)} square units.`,
    es: `Red de un prisma rectangular ${dims}, ${st.folded ? "doblada en una caja" : "desplegada"}. Seis caras. Área total ${num(d.surface)} unidades cuadradas.`,
  });
}

function explanation(st, lang) {
  const d = derive(st);
  if (st.mode === "area") {
    const A = num(d.area);
    const how = {
      rect: t(lang, { en: "A rectangle's area is base × height.", es: "El área de un rectángulo es base × altura." }),
      parallelogram: t(lang, {
        en: "Cut the triangle off one end and slide it to the other end. You get a rectangle with the same base and height.",
        es: "Corta el triángulo de un extremo y deslízalo al otro extremo. Queda un rectángulo con la misma base y la misma altura.",
      }),
      triangle: t(lang, {
        en: "Two copies of the triangle make a parallelogram with the same base and height, so one triangle is half of it.",
        es: "Dos copias del triángulo forman un paralelogramo con la misma base y la misma altura, así que un triángulo es la mitad.",
      }),
      trapezoid: t(lang, {
        en: `Two copies of the trapezoid make a parallelogram with base ${num(st.b)} + ${num(st.b2)} = ${num(add(st.b, st.b2))} and the same height, so one trapezoid is half of it.`,
        es: `Dos copias del trapecio forman un paralelogramo con base ${num(st.b)} + ${num(st.b2)} = ${num(add(st.b, st.b2))} y la misma altura, así que un trapecio es la mitad.`,
      }),
    }[st.shape];
    const sum = t(lang, { en: `Area = ${areaExpr(st.shape, st)} = ${A} square units.`, es: `Área = ${areaExpr(st.shape, st)} = ${A} unidades cuadradas.` });
    const warn =
      st.shape === "rect"
        ? ""
        : t(lang, {
            en: ` Use the height ${num(st.h)}, the perpendicular distance, not the slanted side ${num(st.slant)}.`,
            es: ` Usa la altura ${num(st.h)}, la distancia perpendicular, no el lado inclinado ${num(st.slant)}.`,
          });
    return `${how} ${sum}${warn}`;
  }
  const [l, w, hh] = [num(st.l), num(st.w), num(st.h)];
  if (st.mode === "volume") {
    const c = d.cubes;
    return [
      t(lang, {
        en: `Volume = length × width × height = ${pv(st.l)} × ${pv(st.w)} × ${pv(st.h)} = ${num(d.volume)} cubic units.`,
        es: `Volumen = largo × ancho × altura = ${pv(st.l)} × ${pv(st.w)} × ${pv(st.h)} = ${num(d.volume)} unidades cúbicas.`,
      }),
      t(lang, {
        en: `Pack it with cubes of side 1/${d.n}: ${c.across} × ${c.deep} × ${c.layers} = ${c.total} cubes, and each cube is 1/${d.n ** 3} of a cubic unit. ${c.layers} layers of ${c.perLayer} cubes.`,
        es: `Llénalo con cubos de lado 1/${d.n}: ${c.across} × ${c.deep} × ${c.layers} = ${c.total} cubos, y cada cubo es 1/${d.n ** 3} de una unidad cúbica. ${c.layers} capas de ${c.perLayer} cubos.`,
      }),
    ].join(" ");
  }
  const [lw, lh, wh] = [mul(st.l, st.w), mul(st.l, st.h), mul(st.w, st.h)].map(num);
  return [
    t(lang, {
      en: `A rectangular prism has 6 faces: two ${l} × ${w}, two ${l} × ${hh}, and two ${w} × ${hh}. The net lays them flat.`,
      es: `Un prisma rectangular tiene 6 caras: dos de ${l} × ${w}, dos de ${l} × ${hh} y dos de ${w} × ${hh}. La red las pone planas.`,
    }),
    t(lang, {
      en: `Surface area = 2(lw + lh + wh) = 2(${lw} + ${lh} + ${wh}) = ${num(d.surface)} square units. Volume counts cubes inside (${num(d.volume)} cubic units); surface area covers the outside.`,
      es: `Área total = 2(lw + lh + wh) = 2(${lw} + ${lh} + ${wh}) = ${num(d.surface)} unidades cuadradas. El volumen cuenta los cubos de adentro (${num(d.volume)} unidades cúbicas); el área total cubre el exterior.`,
    }),
  ].join(" ");
}

// ── validate(task) ───────────────────────────────────────────────────────────

function dimsOf(st, task, keys) {
  const out = {};
  for (const k of keys) {
    const r = toFrac(task[k] ?? (st[k] === undefined ? null : st[k]));
    if (!r || sign(r) <= 0) return null;
    out[k] = r;
  }
  return out;
}

function validateTask(st, task) {
  const none = (reason, ok = false) => ({ ok, reason, misconception: null });
  const wrong = (m) => ({ ok: false, reason: "incorrect", misconception: m && { id: m, confidence: "possible" } });
  if (!task) return none("no-task");
  const given = task.answer === undefined ? null : toFrac(task.answer);
  if (task.kind === "area") {
    const shape = task.shape ?? st.shape;
    if (!SHAPES.includes(shape)) return none("invalid-task");
    const d = dimsOf(st, task, shape === "trapezoid" ? ["b", "b2", "h"] : ["b", "h"]);
    if (!d) return none("invalid-task");
    if (!given) return none("invalid-answer");
    const want = areaOf(shape, d);
    if (eq(given, want)) return none("correct", true);
    const slant = toFrac(task.slant ?? st.slant);
    if (shape !== "rect" && slant && eq(given, areaOf(shape, { ...d, h: slant }))) return wrong("slant-height-as-height");
    return wrong((shape === "triangle" || shape === "trapezoid") && eq(given, mul(want, TWO)) ? "triangle-forgot-half" : null);
  }
  if (task.kind === "volume" || task.kind === "surface-area") {
    const d = dimsOf(st, task, ["l", "w", "h"]);
    if (!d) return none("invalid-task");
    if (!given) return none("invalid-answer");
    const [want, other] = task.kind === "volume" ? [volumeOf(d), surfaceOf(d)] : [surfaceOf(d), volumeOf(d)];
    if (eq(given, want)) return none("correct", true);
    return wrong(eq(given, other) ? "volume-vs-surface-area" : null);
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
  track: (patch) => !Object.keys(patch).every((k) => ["decompose", "folded"].includes(k)),
  describeConfig: (st) =>
    st.mode === "area"
      ? { mode: st.mode, shape: st.shape, b: num(st.b), b2: num(st.b2), h: num(st.h), slant: num(st.slant), max: st.max }
      : { mode: st.mode, l: num(st.l), w: num(st.w), h: num(st.h), max: st.max },
});

// ── Rendering ────────────────────────────────────────────────────────────────

const STR = {
  figure: { en: "Figure", es: "Figura" },
  shape: { en: "Shape", es: "Figura" },
  rect: { en: "Rectangle", es: "Rectángulo" },
  parallelogram: { en: "Parallelogram", es: "Paralelogramo" },
  triangle: { en: "Triangle", es: "Triángulo" },
  trapezoid: { en: "Trapezoid", es: "Trapecio" },
  decompose: { en: "Show how it works", es: "Mostrar cómo funciona" },
  fold: { en: "Fold into a box", es: "Doblar en una caja" },
  unfold: { en: "Unfold the net", es: "Desplegar la red" },
  undo: { en: "Undo", es: "Deshacer" },
  reset: { en: "Start over", es: "Empezar de nuevo" },
  b: { en: "Base. Use the arrow keys, or drag.", es: "Base. Usa las flechas, o arrastra." },
  b2: { en: "Second base. Use the arrow keys, or drag.", es: "Segunda base. Usa las flechas, o arrastra." },
  h: { en: "Height. Use the arrow keys, or drag.", es: "Altura. Usa las flechas, o arrastra." },
  l: { en: "Length. Use the arrow keys, or drag.", es: "Largo. Usa las flechas, o arrastra." },
  w: { en: "Width. Use the arrow keys, or drag.", es: "Ancho. Usa las flechas, o arrastra." },
  area: { en: "Area", es: "Área" },
  volume: { en: "Volume", es: "Volumen" },
  surface: { en: "Surface area", es: "Área total" },
  cubes: { en: "Cubes", es: "Cubos" },
  faces: { en: "Faces", es: "Caras" },
  face: { en: "Face", es: "Cara" },
  size: { en: "Size", es: "Tamaño" },
  sum: { en: "Total", es: "Total" },
  front: { en: "Front", es: "Frente" },
  back: { en: "Back", es: "Atrás" },
  top: { en: "Top", es: "Arriba" },
  bottom: { en: "Bottom", es: "Abajo" },
  left: { en: "Left", es: "Izquierda" },
  right: { en: "Right", es: "Derecha" },
};
const W = 360;
const H = 232;
const DEPTH = [0.5, -0.38];
let uid = 0;

export function mount(root, model, { lang = "en", onChange, readonly = false } = {}) {
  let L = lang;
  let ui = {};
  const id0 = `fmg${++uid}`;
  const state = () => model.getState();
  const T = (k) => t(L, STR[k]);
  const f = (r) => toNumber(r);

  /** Pixels per unit, fixed for a given mode and shape so dragging never rescales the figure. */
  function unit(d) {
    if (d.mode === "area") {
      const wide = d.shape === "rect" ? 1 : d.shape === "trapezoid" && d.decompose ? 3 : 2;
      return Math.min(300 / (wide * d.max), 170 / d.max);
    }
    if (d.mode === "net" && !d.folded) return Math.min(300 / (4 * d.max), 196 / (3 * d.max));
    return Math.min(300 / (1.6 * d.max), 190 / (1.5 * d.max));
  }

  /** Where each handle sits and how a pixel of drag maps to a value. Recomputed for every draw. */
  function layout(d, u) {
    const out = {};
    const spec = (key, x, y, axis, sg, per = u) => {
      out[key] = { x, y, axis, sg, per, max: d.max };
    };
    if (d.mode === "area") {
      const [ox, oy] = [24, H - 38];
      const skew = Math.sqrt(Math.max(0, f(d.slant) ** 2 - f(d.h) ** 2));
      const sx = d.shape === "rect" ? 0 : skew;
      spec("b", ox + f(d.b) * u, oy, "x", 1);
      spec("h", ox + sx * u, oy - f(d.h) * u, "y", -1);
      if (d.shape === "trapezoid") spec("b2", ox + (sx + f(d.b2)) * u, oy - f(d.h) * u, "x", 1);
      out.h.max = d.shape === "rect" ? d.max : f(d.slant);
      out.geom = { ox, oy, sx };
    } else if (d.mode === "net" && !d.folded) {
      const [ox, oy] = [24, 28 + f(d.w) * u];
      spec("w", ox + f(d.w) * u, oy + (f(d.h) * u) / 2, "x", 1);
      spec("l", ox + (f(d.w) + f(d.l)) * u, oy + (f(d.h) * u) / 2, "x", 1);
      spec("h", ox + (f(d.w) + f(d.l) / 2) * u, oy + f(d.h) * u, "y", 1);
      out.geom = { ox, oy };
    } else {
      const [ox, oy] = [24, H - 22];
      const [dx, dy] = [DEPTH[0] * u, DEPTH[1] * u];
      spec("l", ox + f(d.l) * u, oy, "x", 1);
      spec("h", ox, oy - f(d.h) * u, "y", -1);
      spec("w", ox + f(d.l) * u + f(d.w) * dx, oy - f(d.h) * u + f(d.w) * dy, "x", 1, dx);
      out.geom = { ox, oy, dx, dy };
    }
    return out;
  }

  function drag(node, key) {
    const spec = () => ui.lay?.[key];
    return makeDraggable(node, {
      get: () => f(state()[key]),
      set: (v) => {
        const d = state();
        const k = Math.max(1, Math.round(v / f(d.step)));
        model.setState({ [key]: mul(frac(k), d.step) });
      },
      min: () => f(state().step),
      max: () => spec()?.max ?? state().max,
      step: () => f(state().step),
      bigStep: () => 1,
      label: T(key),
      valueText: () => num(state()[key]),
      toValue: ({ x, y, start, node: n }) => {
        const sp = spec();
        const svg = n.ownerSVGElement;
        const r = svg?.getBoundingClientRect?.();
        const k = r && r.width > 0 ? r.width / W : 1;
        const delta = (sp.axis === "x" ? x - start.x : y - start.y) / k;
        return start.value + (sp.sg * delta) / sp.per;
      },
    });
  }

  function build(v) {
    L = v.lang;
    ui = { handles: {} };
    const st = state();
    ui.prompt = model.task?.prompt ? h("p", { class: "fm-prompt" }, t(L, model.task.prompt)) : null;
    ui.explain = h("p", { class: "fm-explain" });
    ui.desc = h("p", { class: "fm-sr" });
    ui.svg = s("svg", { class: "fm-svg fm-geo", viewBox: `0 0 ${W} ${H}`, role: "group", "aria-label": T("figure") });
    ui.body = s("g");
    ui.svg.append(ui.body);
    if (!readonly) {
      for (const k of KEYS[st.mode]) {
        const g = s("g", { class: "fm-handle" }, s("circle", { class: "fm-hit", r: 40 }), s("circle", { class: "fm-ring", r: 17 }), s("circle", { class: "fm-knob", r: 10 }));
        ui.handles[k] = g;
        ui.svg.append(g);
        v.handles.push(drag(g, k));
      }
    }
    ui.tbody = h("tbody");
    const rows = [];
    if (!readonly) {
      if (st.mode === "area") {
        ui.shapes = SHAPES.map((sh) => button(v.bag, T(sh), { pressed: st.shape === sh, onClick: () => model.setState({ shape: sh }) }));
        ui.dec = button(v.bag, T("decompose"), { pressed: st.decompose, onClick: () => model.setState({ decompose: !state().decompose }) });
        rows.push(h("div", { class: "fm-row", role: "group", "aria-label": T("shape") }, ...ui.shapes), h("div", { class: "fm-row" }, ui.dec));
      }
      if (st.mode === "net") {
        ui.fold = button(v.bag, "", { onClick: () => model.setState({ folded: !state().folded }) });
        rows.push(h("div", { class: "fm-row" }, ui.fold));
      }
      ui.undo = button(v.bag, T("undo"), { onClick: () => model.undo() });
      rows.push(h("div", { class: "fm-row" }, ui.undo, button(v.bag, T("reset"), { onClick: () => model.reset() })));
    }
    const table = st.mode === "net" ? h("section", { class: "fm-view", "aria-label": T("faces") }, h("div", { class: "fm-table-wrap" }, h("table", { class: "fm-table", id: `${id0}-faces` }, h("caption", { class: "fm-sr" }, T("faces")), h("thead", null, h("tr", null, h("th", { scope: "col" }, T("face")), h("th", { scope: "col" }, T("size")), h("th", { scope: "col" }, T("area")))), ui.tbody))) : null;
    ui.read = h("p", { class: "fm-readout", role: "status" });
    put(root, ui.prompt, h("section", { class: "fm-view", "aria-label": T("figure") }, ui.svg), ui.read, table, ...rows, ui.explain, ui.desc);
  }

  const poly = (g, pts, cls) => g.append(s("polygon", { class: cls, points: pts.map((p) => p.join(",")).join(" ") }));

  function drawArea(d, lay) {
    const g = ui.body;
    const { ox, oy, sx } = lay.geom;
    const u = unit(d);
    const P = (x, y) => [ox + x * u, oy - y * u];
    const [b, b2, hh] = [f(d.b), f(d.b2), f(d.h)];
    const shapes = {
      rect: [P(0, 0), P(b, 0), P(b, hh), P(0, hh)],
      parallelogram: [P(0, 0), P(b, 0), P(b + sx, hh), P(sx, hh)],
      triangle: [P(0, 0), P(b, 0), P(sx, hh)],
      trapezoid: [P(0, 0), P(b, 0), P(sx + b2, hh), P(sx, hh)],
    };
    if (d.decompose) {
      const ghosts = {
        parallelogram: sx <= b ? [[P(b, 0), P(b + sx, 0), P(b + sx, hh)]] : [],
        triangle: [[P(b, 0), P(b + sx, hh), P(sx, hh)]],
        trapezoid: [[P(b, 0), P(b + b2, 0), P(b + b2 + sx, hh), P(sx + b2, hh)]],
        rect: [],
      }[d.shape];
      for (const gp of ghosts) poly(g, gp, "fm-ghost-shape");
      if (d.shape === "parallelogram" && sx <= b) g.append(s("line", { class: "fm-height", x1: P(sx, 0)[0], y1: P(sx, 0)[1], x2: P(sx, hh)[0], y2: P(sx, hh)[1] }));
    }
    poly(g, shapes[d.shape], "fm-shape");
    const [ax, ay] = P(sx, hh);
    if (d.shape !== "rect") {
      g.append(s("line", { class: "fm-height", x1: ax, y1: ay, x2: ax, y2: oy }), s("path", { class: "fm-right-angle", d: `M${ax} ${oy - 8} h8 v8` }));
      if (sx > b) g.append(s("line", { class: "fm-height fm-extend", x1: P(b, 0)[0], y1: oy, x2: ax, y2: oy }));
      const [mx, my] = P(sx / 2, hh / 2);
      g.append(stext(mx - 8, my, num(d.slant), "fm-svg-text fm-svg-muted", "end"));
    }
    g.append(stext(ax + 8, (ay + oy) / 2 + 5, `h = ${num(d.h)}`, "fm-svg-text fm-svg-strong"), stext(P(b / 2, 0)[0], oy + 22, `${d.shape === "trapezoid" ? "b₁" : "b"} = ${num(d.b)}`, "fm-svg-text", "middle"));
    if (d.shape === "trapezoid") g.append(stext(P(sx + b2 / 2, hh)[0], ay - 10, `b₂ = ${num(d.b2)}`, "fm-svg-text", "middle"));
  }

  function box(g, d, lay) {
    const { ox, oy, dx, dy } = lay.geom;
    const u = unit(d);
    const [l, w, hh] = [f(d.l) * u, f(d.w), f(d.h) * u];
    const front = [[ox, oy], [ox + l, oy], [ox + l, oy - hh], [ox, oy - hh]];
    const top = [[ox, oy - hh], [ox + l, oy - hh], [ox + l + w * dx, oy - hh + w * dy], [ox + w * dx, oy - hh + w * dy]];
    const side = [[ox + l, oy], [ox + l + w * dx, oy + w * dy], [ox + l + w * dx, oy - hh + w * dy], [ox + l, oy - hh]];
    poly(g, front, "fm-face fm-face-a");
    poly(g, top, "fm-face fm-face-c");
    poly(g, side, "fm-face fm-face-b");
    return { front, top, side, l, hh };
  }

  function drawVolume(d, lay) {
    const g = ui.body;
    const { l, hh } = box(g, d, lay);
    const { ox, oy, dx, dy } = lay.geom;
    const c = d.cubes;
    const wu = f(d.w);
    const topY = oy - hh;
    const line = (x1, y1, x2, y2) => g.append(s("line", { class: "fm-cube-line", x1, y1, x2, y2 }));
    if (d.n <= 12) {
      // Cubes of side 1/n: the bottom row of the front face is one layer.
      g.append(s("rect", { class: "fm-layer", x: ox, y: oy - hh / c.layers, width: l, height: hh / c.layers }));
      for (let i = 1; i < c.across; i++) {
        const x = ox + (l * i) / c.across;
        line(x, oy, x, topY);
        line(x, topY, x + wu * dx, topY + wu * dy);
      }
      for (let j = 1; j < c.layers; j++) line(ox, oy - (hh * j) / c.layers, ox + l, oy - (hh * j) / c.layers);
      for (let k = 1; k < c.deep; k++) line(ox + (wu * dx * k) / c.deep, topY + (wu * dy * k) / c.deep, ox + l + (wu * dx * k) / c.deep, topY + (wu * dy * k) / c.deep);
    }
    g.append(stext(ox + l / 2, oy + 17, `l = ${num(d.l)}`, "fm-svg-text", "middle"), stext(ox - 6, oy - hh / 2 + 5, `h = ${num(d.h)}`, "fm-svg-text", "end"), stext(ox + l + wu * dx + 6, topY + wu * dy + 4, `w = ${num(d.w)}`, "fm-svg-text"));
    ui.read.textContent = `${T("cubes")}: ${c.across} × ${c.deep} × ${c.layers} = ${c.total} · ${T("volume")}: ${num(d.volume)}`;
  }

  function drawNet(d, lay) {
    const g = ui.body;
    if (d.folded) {
      box(g, d, lay);
      const { ox, oy, dx, dy } = lay.geom;
      const u = unit(d);
      g.append(stext(ox + (f(d.l) * u) / 2, oy - (f(d.h) * u) / 2 + 5, `${T("front")} ${num(d.faces[0].area)}`, "fm-svg-text", "middle"), stext(ox + (f(d.l) * u) / 2 + (f(d.w) * dx) / 2, oy - f(d.h) * u + (f(d.w) * dy) / 2 + 5, `${T("top")} ${num(d.faces[2].area)}`, "fm-svg-text", "middle"), stext(ox + f(d.l) * u + (f(d.w) * dx) / 2 + 2, oy - (f(d.h) * u) / 2 + (f(d.w) * dy) / 2 + 5, T("right"), "fm-svg-text fm-svg-muted"));
    } else {
      const { ox, oy } = lay.geom;
      const u = unit(d);
      const [l, w, hh] = [f(d.l) * u, f(d.w) * u, f(d.h) * u];
      const cell = (x, y, cw, ch, id, cls) => {
        g.append(s("rect", { class: `fm-face ${cls}`, x, y, width: cw, height: ch }), stext(x + cw / 2, y + ch / 2 + 5, T(id), "fm-svg-text fm-face-label", "middle"));
      };
      cell(ox, oy, w, hh, "left", "fm-face-b");
      cell(ox + w, oy, l, hh, "front", "fm-face-a");
      cell(ox + w + l, oy, w, hh, "right", "fm-face-b");
      cell(ox + 2 * w + l, oy, l, hh, "back", "fm-face-a");
      cell(ox + w, oy - w, l, w, "top", "fm-face-c");
      cell(ox + w, oy + hh, l, w, "bottom", "fm-face-c");
    }
    ui.read.textContent = `${T("surface")}: ${num(d.surface)}`;
    ui.tbody.replaceChildren();
    for (const fc of d.faces) put(ui.tbody, h("tr", null, h("th", { scope: "row" }, T(fc.id)), h("td", null, `${num(fc.a)} × ${num(fc.b)}`), h("td", { class: "fm-num" }, num(fc.area))));
    put(ui.tbody, h("tr", null, h("th", { scope: "row" }, T("sum")), h("td", null, d.faces.map((x) => num(x.area)).join(" + ")), h("td", { class: "fm-num" }, num(d.surface))));
  }

  function sync(v) {
    const d = state();
    clear(ui.body);
    const lay = layout(d, unit(d));
    ui.lay = lay;
    if (d.mode === "area") {
      drawArea(d, lay);
      ui.read.textContent = `${T("area")} = ${areaExpr(d.shape, d)} = ${num(d.area)}`;
    } else if (d.mode === "volume") drawVolume(d, lay);
    else drawNet(d, lay);
    for (const [k, node] of Object.entries(ui.handles)) {
      const sp = lay[k];
      const live = !!sp && (k !== "b2" || d.shape === "trapezoid");
      node.toggleAttribute("hidden", !live);
      if (live) node.setAttribute("transform", `translate(${sp.x} ${sp.y})`);
    }
    if (ui.shapes) SHAPES.forEach((sh, i) => ui.shapes[i].setAttribute("aria-pressed", String(d.shape === sh)));
    ui.dec?.setAttribute("aria-pressed", String(d.decompose));
    if (ui.fold) ui.fold.textContent = T(d.folded ? "unfold" : "fold");
    if (ui.undo) ui.undo.disabled = !model.canUndo();
    ui.explain.textContent = model.getMathematicalExplanation(L);
    ui.desc.textContent = model.getAccessibleDescription(L);
    for (const hd of v.handles) hd.refresh();
  }

  return createView(root, model, {
    lang,
    onChange,
    cls: "fm-geometry",
    build,
    sync,
    say: (st, l) =>
      st.mode === "area" ? `${t(l, { en: "Area", es: "Área" })} ${num(st.area)}` : st.mode === "volume" ? `${t(l, { en: "Volume", es: "Volumen" })} ${num(st.volume)}` : `${t(l, { en: "Surface area", es: "Área total" })} ${num(st.surface)}`,
  });
}
