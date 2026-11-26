// living/net-fold-model.js — the geometry of nets (shared with surface-area) and
// the mathematics of the net-fold play.
//
// Pure functions only (no DOM). A solid is a set of flat faces laid out as a
// net, each hinged to a parent face. Folding is a REAL rotation about each
// hinge (Rodrigues), so the folded pose is a true orthographic drawing of the
// solid — nothing is hand-drawn, and net-fold.test.mjs proves that the folded
// faces close up into the solid (every edge is shared by exactly two faces).
//
// Axes: x right, y down, z AWAY from the viewer (right-handed). A viewer sees a
// face when its outward normal has z < 0.

export const D2R = Math.PI / 180;
export const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
export const near = (a, b) => Math.abs(a - b) < 1e-9;
export const sum = (a) => a.reduce((s, v) => s + v, 0);

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** Linear blend of two numbers. */
export const lerp = (a, b, u) => a + (b - a) * u;
const mean3 = (ps) => [0, 1, 2].map((k) => sum(ps.map((p) => p[k])) / ps.length);

/** Rotate point p about the line through a with unit direction d by th radians. */
export function rotateAbout(p, a, d, th) {
  const v = sub(p, a);
  const c = Math.cos(th);
  const s = Math.sin(th);
  const k = cross(d, v);
  const dv = dot(d, v) * (1 - c);
  return [0, 1, 2].map((i) => a[i] + v[i] * c + k[i] * s + d[i] * dv);
}

function rotateAxis(p, axis, a) {
  const [x, y, z] = p;
  const c = Math.cos(a);
  const s = Math.sin(a);
  if (axis === "x") return [x, y * c - z * s, y * s + z * c];
  if (axis === "y") return [x * c + z * s, y, -x * s + z * c];
  return [x * c - y * s, x * s + y * c, z];
}

const rect = (x, y, w, h) => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];

/** Fix each hinge's turning direction and which side of every face is "outside". */
function finish(solid) {
  // Centre the flat net on the origin so nets of different sizes share a centre.
  const xs = solid.faces.flatMap((f) => f.pts.map((p) => p[0]));
  const ys = solid.faces.flatMap((f) => f.pts.map((p) => p[1]));
  const sh = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  const mv = (p) => [p[0] - sh[0], p[1] - sh[1]];
  solid.shift = sh;
  solid.faces = solid.faces.map((f) => ({
    ...f,
    pts: f.pts.map(mv),
    hinge: f.hinge ? f.hinge.map(mv) : null,
  }));
  const byId = Object.fromEntries(solid.faces.map((f) => [f.id, f]));
  solid.byId = byId;
  for (const f of solid.faces) {
    if (!f.hinge) continue;
    const [a, b] = f.hinge;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const d = [(b[0] - a[0]) / len, (b[1] - a[1]) / len, 0];
    const c = f.pts.reduce(
      (s, p) => [s[0] + p[0] / f.pts.length, s[1] + p[1] / f.pts.length],
      [0, 0],
    );
    const n = [c[0] - a[0], c[1] - a[1], 0];
    const side = Math.sign(d[0] * n[1] - d[1] * n[0]);
    f.rot = { a: [a[0], a[1], 0], d, sign: side * solid.foldDir };
  }
  if (!solid.foldable) return solid;
  const posed = solid.faces.map((f) => f.pts.map((P) => foldPoint(solid, f.id, P, 1)));
  const centre = mean3(posed.map(mean3));
  solid.faces.forEach((f, i) => {
    const n = cross(sub(posed[i][1], posed[i][0]), sub(posed[i][2], posed[i][0]));
    f.flip = Math.sign(dot(n, sub(mean3(posed[i]), centre))) || 1;
  });
  return solid;
}

/** A point given in the net's own drawing coordinates, in the solid's centred coordinates. */
export const local = (solid, P) => [P[0] - solid.shift[0], P[1] - solid.shift[1]];

/** Where flat point P of face `id` is after folding by fraction t (0 flat … 1 closed). */
export function foldPoint(solid, id, P, t) {
  let p = [P[0], P[1], 0];
  for (let f = solid.byId[id]; f; f = f.parent ? solid.byId[f.parent] : null) {
    if (f.rot) p = rotateAbout(p, f.rot.a, f.rot.d, f.rot.sign * f.fold * t);
  }
  return p;
}

const N = (en, es) => ({ en, es });

/** A rectangular prism l × w × h as a cross net around the Front face. */
export function rectPrism(l, w, h) {
  const F = (id, name, pts, area, pair, dims, parent = null, hinge = null) => ({
    id,
    name,
    pts,
    shape: "rect",
    area,
    pair,
    dims,
    parent,
    hinge,
    fold: hinge ? Math.PI / 2 : 0,
  });
  const lw = [l, w];
  const lh = [l, h];
  const wh = [w, h];
  return finish({
    kind: "rect-prism",
    foldable: true,
    foldDir: 1,
    camera: [
      { axis: "y", deg: 28 },
      { axis: "x", deg: 24 },
    ],
    dims: { l, w, h },
    faces: [
      F("top", N("Top", "Arriba"), rect(0, -w, l, w), l * w, "lw", lw, "front", [
        [0, 0],
        [l, 0],
      ]),
      F("front", N("Front", "Frente"), rect(0, 0, l, h), l * h, "lh", lh),
      F("bottom", N("Bottom", "Abajo"), rect(0, h, l, w), l * w, "lw", lw, "front", [
        [0, h],
        [l, h],
      ]),
      F("right", N("Right", "Derecha"), rect(l, 0, w, h), w * h, "wh", wh, "front", [
        [l, 0],
        [l, h],
      ]),
      F("back", N("Back", "Atrás"), rect(l + w, 0, l, h), l * h, "lh", lh, "right", [
        [l + w, 0],
        [l + w, h],
      ]),
      F("left", N("Left", "Izquierda"), rect(2 * l + w, 0, w, h), w * h, "wh", wh, "back", [
        [2 * l + w, 0],
        [2 * l + w, h],
      ]),
    ],
  });
}

/** A triangular prism: isosceles triangle ends (base b, height hg, slanted sides s), length len. Net only. */
export function triPrism(b, hg, s, len) {
  const face = (id, name, shape, pts, area, pair, dims) => ({
    id,
    name,
    shape,
    pts,
    area,
    pair,
    dims,
    parent: null,
    hinge: null,
    fold: 0,
  });
  const ends = [N("Triangle", "Triángulo"), N("Triangle", "Triángulo")];
  return finish({
    kind: "tri-prism",
    foldable: false,
    foldDir: 1,
    camera: [],
    dims: { b, hg, s, len },
    faces: [
      face("slantL", N("Side", "Lado"), "rect", rect(0, 0, s, len), s * len, "slant", [s, len]),
      face("bottom", N("Bottom", "Fondo"), "rect", rect(s, 0, b, len), b * len, "bottom", [b, len]),
      face("slantR", N("Side", "Lado"), "rect", rect(s + b, 0, s, len), s * len, "slant", [s, len]),
      face(
        "endA",
        ends[0],
        "tri",
        [
          [s, 0],
          [s + b, 0],
          [s + b / 2, -hg],
        ],
        (b * hg) / 2,
        "end",
        [b, hg],
      ),
      face(
        "endB",
        ends[1],
        "tri",
        [
          [s, len],
          [s + b, len],
          [s + b / 2, len + hg],
        ],
        (b * hg) / 2,
        "end",
        [b, hg],
      ),
    ],
  });
}

/** A square pyramid: base b × b, four triangle faces with slant height `sl`. Folds toward the viewer. */
export function squarePyramid(b, sl) {
  const tri = (id, pts, hinge) => ({
    id,
    name: N("Face", "Cara"),
    shape: "tri",
    pts,
    area: (b * sl) / 2,
    pair: "face",
    dims: [b, sl],
    parent: "base",
    hinge,
    fold: Math.PI - Math.acos(b / 2 / sl),
  });
  const m = b / 2;
  return finish({
    kind: "sq-pyramid",
    foldable: true,
    foldDir: -1,
    camera: [
      { axis: "z", deg: 38 },
      { axis: "x", deg: -62 },
    ],
    dims: { b, sl },
    faces: [
      {
        id: "base",
        name: N("Base", "Base"),
        shape: "rect",
        pts: rect(0, 0, b, b),
        area: b * b,
        pair: "base",
        dims: [b, b],
        parent: null,
        hinge: null,
        fold: 0,
      },
      tri(
        "faceN",
        [
          [0, 0],
          [b, 0],
          [m, -sl],
        ],
        [
          [0, 0],
          [b, 0],
        ],
      ),
      tri(
        "faceE",
        [
          [b, 0],
          [b, b],
          [b + sl, m],
        ],
        [
          [b, 0],
          [b, b],
        ],
      ),
      tri(
        "faceS",
        [
          [b, b],
          [0, b],
          [m, b + sl],
        ],
        [
          [0, b],
          [b, b],
        ],
      ),
      tri(
        "faceW",
        [
          [0, b],
          [0, 0],
          [-sl, m],
        ],
        [
          [0, 0],
          [0, b],
        ],
      ),
    ],
  });
}

/** Flat point P of face `id` after folding by t and applying the camera (t scales the camera too). */
export function projectPoint(solid, id, P, t) {
  let p = foldPoint(solid, id, P, t);
  for (const c of solid.camera) p = rotateAxis(p, c.axis, c.deg * D2R * t);
  return p;
}

/** Every face of the solid at fold fraction t, as camera-space points with a facing flag. */
export function poseFaces(solid, t) {
  return solid.faces.map((f) => {
    const p3 = f.pts.map((P) => projectPoint(solid, f.id, P, t));
    const n = cross(sub(p3[1], p3[0]), sub(p3[2], p3[0]));
    const out = f.flip ? n.map((v) => v * f.flip) : n;
    return {
      id: f.id,
      pts3: p3,
      z: sum(p3.map((p) => p[2])) / p3.length,
      facing: !solid.foldable || t < 1e-3 || out[2] < -1e-9,
    };
  });
}

/**
 * Scale and offset that keep every solid inside a W × H stage. The fit is
 * computed at eleven fold fractions and blended between them, so the flat net and
 * the closed box each fill the stage and nothing clips mid-fold.
 * Returns { at(t) -> { k, ox, oy } }.
 */
export function fitView(solids, W, H, pad, flatOnly = false) {
  const foldable = !flatOnly && solids.some((s) => s.foldable);
  const samples = foldable ? Array.from({ length: 11 }, (_, i) => i / 10) : [0];
  const fits = samples.map((t) => {
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const s of solids) {
      for (const f of poseFaces(s, s.foldable ? t : 0)) {
        for (const p of f.pts3) {
          x0 = Math.min(x0, p[0]);
          x1 = Math.max(x1, p[0]);
          y0 = Math.min(y0, p[1]);
          y1 = Math.max(y1, p[1]);
        }
      }
    }
    const k = Math.min((W - 2 * pad) / (x1 - x0), (H - 2 * pad) / (y1 - y0));
    return { k, ox: W / 2 - ((x0 + x1) / 2) * k, oy: H / 2 - ((y0 + y1) / 2) * k };
  });
  return {
    at(t) {
      if (fits.length === 1) return fits[0];
      const x = Math.min(0.999999, Math.max(0, t)) * (fits.length - 1);
      const i = Math.floor(x);
      const u = x - i;
      const [a, b] = [fits[i], fits[i + 1]];
      return { k: lerp(a.k, b.k, u), ox: lerp(a.ox, b.ox, u), oy: lerp(a.oy, b.oy, u) };
    },
  };
}

// ---- units -----------------------------------------------------------------

const LEN = {
  in: N("in", "pulg"),
  ft: N("ft", "pies"),
  cm: N("cm", "cm"),
  m: N("m", "m"),
};

/** {len, sq, cu} pairs for a unit key ("in", "ft", "cm", "m" or "units"); null if unknown. */
export function unitSet(key) {
  if (key == null || key === "units")
    return {
      len: N("units", "unidades"),
      sq: N("square units", "unidades cuadradas"),
      cu: N("cubic units", "unidades cúbicas"),
    };
  const u = LEN[key];
  if (!u) return null;
  return {
    len: u,
    sq: N(`${u.en}²`, `${u.es}²`),
    cu: N(`${u.en}³`, `${u.es}³`),
  };
}

/** Stable position for the correct choice — never always first. */
export function placeCorrect(options, seed) {
  const k = seed % options.length;
  const correct = options.find((o) => o.correct);
  const rest = options.filter((o) => !o.correct);
  rest.splice(k, 0, correct);
  return rest;
}

// ---- rectangular-prism surface area (net-fold, and surface-area's prism mode) --

export const boxArea = (l, w, h) => 2 * (l * w + l * h + w * h);

/** Surface-area choices: the total plus three real misconceptions; null if fewer than 4 distinct values. */
export function boxChoices(l, w, h) {
  const pairs = [l * w, l * h, w * h];
  const out = [
    { kind: "total", value: boxArea(l, w, h), correct: true },
    { kind: "once", value: sum(pairs) },
    { kind: "volume", value: l * w * h },
    { kind: "missing", value: boxArea(l, w, h) - 2 * Math.min(...pairs) },
  ];
  return new Set(out.map((o) => o.value)).size === out.length ? out : null;
}

/** The three face pairs of a box, with their areas. */
export function boxPairs(l, w, h) {
  return [
    { key: "lw", a: [l, w], area: l * w, ids: ["top", "bottom"] },
    { key: "lh", a: [l, h], area: l * h, ids: ["front", "back"] },
    { key: "wh", a: [w, h], area: w * h, ids: ["right", "left"] },
  ];
}

// ---- net-fold play: validation and copy ---------------------------------------

const distinct3 = (l, w, h) => l !== w && w !== h && l !== h;

function validBox(b) {
  const l = Number(b?.l);
  const w = Number(b?.w);
  const h = Number(b?.h);
  if (![l, w, h].every((v) => okInt(v, 1, 12)) || !distinct3(l, w, h)) return null;
  return boxChoices(l, w, h) ? { l, w, h } : null;
}

export function validateNetFold(cfg) {
  const main = validBox(cfg);
  const unit = unitSet(cfg?.unit ?? "units");
  if (!main || !unit) return null;
  let transfer = cfg?.transfer == null ? null : validBox(cfg.transfer);
  if (cfg?.transfer != null && !transfer) return null;
  if (!transfer) transfer = { l: 4, w: 3, h: 2 };
  if (boxArea(transfer.l, transfer.w, transfer.h) === boxArea(main.l, main.w, main.h)) return null;
  return { ...main, unitKey: cfg.unit ?? "units", unit, transfer };
}

const fmtPair = (a) => `${a[0]} × ${a[1]}`;

/** Every sentence the play says, as {en, es} pairs built from the validated config. */
export function netFoldCopy(v) {
  const { l, w, h, unit } = v;
  const sq = (n, lang) => `${n} ${unit.sq[lang]}`;
  const both = (f) => ({ en: f("en"), es: f("es") });
  const pairs = boxPairs(l, w, h);
  const SA = boxArea(l, w, h);
  const tr = v.transfer;
  const tPairs = boxPairs(tr.l, tr.w, tr.h);
  const tSA = boxArea(tr.l, tr.w, tr.h);
  const pairSum = (ps) => ps.map((p) => `2 × ${p.area}`).join(" + ");
  const addAll = (ps) => ps.map((p) => `${p.area} + ${p.area}`).join(" + ");
  const sizeEn = `${l} ${unit.len.en} long, ${w} ${unit.len.en} wide and ${h} ${unit.len.en} tall`;
  const sizeEs = `${l} ${unit.len.es} de largo, ${w} ${unit.len.es} de ancho y ${h} ${unit.len.es} de alto`;
  const miss = (kind, value) => {
    if (kind === "once")
      return both((g) =>
        g === "en"
          ? `${value} is one face from each pair. A box has 6 faces, and the net shows all of them. How many faces did that add? Look at Top and Bottom.`
          : `${value} es una cara de cada par. Una caja tiene 6 caras y la plantilla las muestra todas. ¿Cuántas caras sumaste así? Mira Arriba y Abajo.`,
      );
    if (kind === "volume")
      return both((g) =>
        g === "en"
          ? `${value} is length × width × height: the cubes inside the box. Surface area covers the outside. What do you get when you add the areas of the faces in the net?`
          : `${value} es largo × ancho × alto: los cubos dentro de la caja. El área de superficie cubre el exterior. ¿Qué obtienes al sumar las áreas de las caras de la plantilla?`,
      );
    return both((g) =>
      g === "en"
        ? `${value} adds only four of the six faces. Count the faces in the net. Which pair is missing?`
        : `${value} suma solo cuatro de las seis caras. Cuenta las caras de la plantilla. ¿Qué par falta?`,
    );
  };
  const faceCue = (id) => {
    const nm = {
      front: N("Front", "Frente"),
      back: N("Back", "Atrás"),
      left: N("Left", "Izquierda"),
    }[id];
    if (id === "front")
      return {
        en: `${nm.en} is joined to Top along a fold line, so the two share an edge and sit side by side. Which face shares NO edge with Top?`,
        es: `${nm.es} está unida a Arriba por una línea de doblez, así que comparten una arista y quedan lado a lado. ¿Qué cara NO comparte ninguna arista con Arriba?`,
      };
    return {
      en: `${nm.en} folds up and meets Top along an edge, so it is beside Top, not across from it. Which face never touches Top?`,
      es: `${nm.es} se dobla hacia arriba y toca a Arriba en una arista, así que está al lado, no enfrente. ¿Qué cara nunca toca a Arriba?`,
    };
  };
  return {
    kicker: N("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: N("From a flat net to a box", "De una plantilla plana a una caja"),
    ariaLabel: {
      en: `A net of a box ${sizeEn}: six rectangles joined along fold lines, in three matching pairs. Folded, it closes into the box. Adding the six face areas gives ${sq(SA, "en")}.`,
      es: `Una plantilla de una caja de ${sizeEs}: seis rectángulos unidos por líneas de doblez, en tres pares iguales. Doblada, forma la caja. Sumar las áreas de las seis caras da ${sq(SA, "es")}.`,
    },
    printSummary: {
      en: `A box ${sizeEn} unfolds into a net of 6 rectangles in 3 matching pairs: Top and Bottom ${fmtPair(pairs[0].a)} = ${pairs[0].area}, Front and Back ${fmtPair(pairs[1].a)} = ${pairs[1].area}, Left and Right ${fmtPair(pairs[2].a)} = ${pairs[2].area}. Adding all six faces: ${addAll(pairs)} = ${sq(SA, "en")}.`,
      es: `Una caja de ${sizeEs} se desdobla en una plantilla de 6 rectángulos en 3 pares iguales: Arriba y Abajo ${fmtPair(pairs[0].a)} = ${pairs[0].area}, Frente y Atrás ${fmtPair(pairs[1].a)} = ${pairs[1].area}, Izquierda y Derecha ${fmtPair(pairs[2].a)} = ${pairs[2].area}. Sumando las seis caras: ${addAll(pairs)} = ${sq(SA, "es")}.`,
    },
    scene: {
      net: N("The net", "La plantilla"),
      predict: N("Predict", "Predice"),
      fold: N("Fold it", "Dóblala"),
      areas: N("Add the faces", "Suma las caras"),
      transfer: N("On your own", "Por tu cuenta"),
    },
    hidden: N("hidden face", "cara oculta"),
    netSay: {
      en: `A box ${sizeEn}, cut open and laid flat. This flat pattern is a net: six rectangles joined along fold lines. Each face keeps its name when it folds.`,
      es: `Una caja de ${sizeEs}, abierta y extendida. Este patrón plano es una plantilla: seis rectángulos unidos por líneas de doblez. Cada cara conserva su nombre al doblarse.`,
    },
    predictSay: {
      en: "The net will fold into a closed box. Before it moves, think about where each face ends up.",
      es: "La plantilla se doblará hasta formar una caja cerrada. Antes de que se mueva, piensa dónde queda cada cara.",
    },
    predictQ: {
      en: "When the box is closed, which face is directly across from Top?",
      es: "Cuando la caja está cerrada, ¿qué cara queda justo enfrente de Arriba?",
    },
    predictOk: {
      en: "Yes: Bottom. It is the only face that shares no edge with Top, and it is the same size, so Top and Bottom are a matching pair. Now fold the net to check.",
      es: "Sí: Abajo. Es la única cara que no comparte ninguna arista con Arriba, y tiene el mismo tamaño, así que Arriba y Abajo son un par igual. Ahora dobla la plantilla para comprobarlo.",
    },
    faceCue,
    foldSay: {
      en: "Slide to fold the net. Front stays still; the other faces swing up behind it. Dashed faces are hidden behind the front of the box.",
      es: "Desliza para doblar la plantilla. Frente se queda quieta; las otras caras giran hacia atrás. Las caras con línea punteada están ocultas detrás del frente de la caja.",
    },
    foldLabel: N("Fold", "Doblar"),
    foldAuto: N("Fold it for me", "Dóblala por mí"),
    unfold: N("Unfold", "Desdoblar"),
    nextPair: N("Add the next pair", "Suma el siguiente par"),
    allPairs: N("All three pairs added", "Los tres pares sumados"),
    foldHint: {
      en: "Slide all the way to close the box.",
      es: "Desliza hasta el final para cerrar la caja.",
    },
    foldDone: {
      en: "Closed! Six faces in the net became six faces on the box, and Top is across from Bottom. Nothing was added or lost, so the net holds every face you need.",
      es: "¡Cerrada! Las seis caras de la plantilla se volvieron las seis caras de la caja, y Arriba queda enfrente de Abajo. No se agregó ni se perdió nada, así que la plantilla tiene todas las caras que necesitas.",
    },
    areasSay: {
      en: "Back to the flat net. Add the area of every face, one matching pair at a time.",
      es: "De vuelta a la plantilla plana. Suma el área de cada cara, un par igual a la vez.",
    },
    pairNames: [
      N("Top and Bottom", "Arriba y Abajo"),
      N("Front and Back", "Frente y Atrás"),
      N("Left and Right", "Izquierda y Derecha"),
    ],
    pairLine: (i) => ({
      en: `${["Top and Bottom", "Front and Back", "Left and Right"][i]}: each is ${fmtPair(pairs[i].a)} = ${pairs[i].area}, so together 2 × ${pairs[i].area} = ${2 * pairs[i].area}.`,
      es: `${["Arriba y Abajo", "Frente y Atrás", "Izquierda y Derecha"][i]}: cada una es ${fmtPair(pairs[i].a)} = ${pairs[i].area}, así que juntas 2 × ${pairs[i].area} = ${2 * pairs[i].area}.`,
    }),
    sums: pairs.map((p) => 2 * p.area),
    areasExpr: {
      en: `${addAll(pairs)} = ${sq(SA, "en")}`,
      es: `${addAll(pairs)} = ${sq(SA, "es")}`,
    },
    areasDone: {
      en: `All six faces: ${pairSum(pairs)} = ${pairs.map((p) => 2 * p.area).join(" + ")} = ${SA}. The surface area is ${sq(SA, "en")}. Square units, because it covers flat faces.`,
      es: `Las seis caras: ${pairSum(pairs)} = ${pairs.map((p) => 2 * p.area).join(" + ")} = ${SA}. El área de superficie es ${sq(SA, "es")}. Unidades cuadradas, porque cubre caras planas.`,
    },
    transferSay: {
      en: `A smaller box: ${tr.l} ${unit.len.en} long, ${tr.w} ${unit.len.en} wide, ${tr.h} ${unit.len.en} tall. The same six faces, now smaller.`,
      es: `Una caja más pequeña: ${tr.l} ${unit.len.es} de largo, ${tr.w} ${unit.len.es} de ancho, ${tr.h} ${unit.len.es} de alto. Las mismas seis caras, ahora más pequeñas.`,
    },
    transferQ: {
      en: "What is the surface area of this box?",
      es: "¿Cuál es el área de superficie de esta caja?",
    },
    transferOk: {
      en: `Right: ${tPairs.map((p) => `2 × ${p.area}`).join(" + ")} = ${tPairs.map((p) => 2 * p.area).join(" + ")} = ${tSA} ${unit.sq.en}.`,
      es: `Correcto: ${tPairs.map((p) => `2 × ${p.area}`).join(" + ")} = ${tPairs.map((p) => 2 * p.area).join(" + ")} = ${tSA} ${unit.sq.es}.`,
    },
    transferExpr: tPairs.map((p) => `${p.area} + ${p.area}`).join(" + "),
    explainLabel: {
      en: "Explain: why do you add six faces to find the surface area of a box?",
      es: "Explica: ¿por qué sumas seis caras para hallar el área de superficie de una caja?",
    },
    explainFrame: {
      en: "The net shows ___ faces. They come in ___ matching pairs, so I add ___.",
      es: "La plantilla muestra ___ caras. Vienen en ___ pares iguales, así que sumo ___.",
    },
    miss,
    sq,
  };
}
