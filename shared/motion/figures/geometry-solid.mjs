// Motion figures for the solid lessons: unit-cube layers building a prism's volume (5-5, 5-6), and nets that unfold with each face
// counted once into a running surface-area total (5-6 prism, 5-7 triangular prism, 5-8 square pyramid).
import { COLOR } from "../tokens.mjs";
import { CU, FILL, L, P, R, SQ, T, all, answerBox, card, dec, f1, frameOf, line, notBox, poly, sceneOf, stackBoxes, sub } from "./geometry-kit.mjs";
import { drawNet, drawRows, faceSentence, netTracks, prismNet, pyramidNet, triPrismNet } from "./geometry-nets.mjs";

/** @param {unknown} values @param {Array<[number, number]>} spec */
function rangeCheck(values, spec) {
  if (!Array.isArray(values) || values.length !== spec.length) throw new RangeError("Wrong number of settings.");
  spec.forEach(([lo, hi], i) => {
    if (!Number.isInteger(values[i]) || values[i] < lo || values[i] > hi) throw new RangeError(`Use a whole number from ${lo} to ${hi}.`);
  });
}
const sq = (/** @type {string} */ lang) => (lang === "es" ? SQ.es : SQ.en);
const muted = (/** @type {string} */ s) => (/** @type {number} */ px, /** @type {number} */ py, /** @type {number} */ pw) => P(px + pw / 2, py, s, pw, { size: 13, fill: COLOR.muted });

// ============================================================================================================================
// solid:net  (5-5, 5-6): volume by layers, then the net
// ============================================================================================================================

/** @param {number} l @param {number} w @param {number} h */
function volumeModel(l, w, h) {
  const layer = l * w;
  const volume = layer * h;
  return {
    l, w, h, layer, volume,
    cum: Array.from({ length: h }, (_, i) => layer * (i + 1)),
    sum: l + w + h,
    net: prismNet(l, w, h),
  };
}
/** @typedef {ReturnType<typeof volumeModel>} VolModel */

function drawLayer(/** @type {VolModel} */ m, /** @type {string} */ lang) {
  return (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w) => {
    const c = Math.min((w - 90) / m.l, 140 / m.w, 28);
    const gw = m.l * c;
    const gh = m.w * c;
    const x0 = x + (w - gw - 84) / 2;
    const y0 = y + 24;
    let grid = "";
    for (let i = 1; i < m.l; i++) grid += `M${f1(x0 + i * c)} ${f1(y0)}V${f1(y0 + gh)}`;
    for (let j = 1; j < m.w; j++) grid += `M${f1(x0)} ${f1(y0 + j * c)}H${f1(x0 + gw)}`;
    let svg = `<g class="gm-layer1"><rect x="${f1(x0)}" y="${f1(y0)}" width="${f1(gw)}" height="${f1(gh)}" fill="${FILL.teal}" fill-opacity="0.4" stroke="${COLOR.ink}" stroke-width="2"/>`;
    svg += `<path d="${grid}" stroke="${COLOR.ink}" stroke-opacity="0.55" stroke-width="1" fill="none"/></g>`;
    svg += T(x0 + gw / 2, y0 - 7, `${L(lang, "length", "largo")} ${m.l}`, { weight: 700 });
    svg += T(x0 + gw + 8, y0 + gh / 2 + 5, `${L(lang, "width", "ancho")} ${m.w}`.replace(/ /, " "), { weight: 700, anchor: "start" });
    return { svg, h: 24 + gh + 8 };
  };
}

function drawStack(/** @type {VolModel} */ m, /** @type {string} */ lang) {
  return (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w) => {
    const colW = 50;
    const avail = w - colW - 8;
    const c = Math.min(avail / (m.l + 0.45 * m.w), 170 / (m.h + 0.3 * m.w), 28);
    const dx = 0.45 * c;
    const dy = 0.3 * c;
    const x0 = x + colW + (avail - (m.l + 0.45 * m.w) * c) / 2;
    const top = 24;
    const yb = y + top + (m.h + 0.3 * m.w) * c;
    const step = Math.max(1, Math.ceil(20 / c));
    let svg = T(x + colW, y + 14, L(lang, "Cubes", "Cubos"), { size: 13, anchor: "end", fill: COLOR.muted });
    for (let i = 0; i < m.h; i++) {
      const fb = yb - i * c;
      const ft = fb - c;
      const fill = i % 2 ? FILL.amber : FILL.teal;
      const faceFill = { fill, fo: 0.45, sw: 1.6 };
      const backed = (/** @type {number[][]} */ pts) => poly(pts, { fill: COLOR.white, stroke: "none", sw: 0 }) + poly(pts, faceFill);
      const thin = `stroke="${COLOR.ink}" stroke-opacity="0.5" stroke-width="1" fill="none"`;
      let g = backed([[x0, ft], [x0 + m.l * c, ft], [x0 + m.l * c + m.w * dx, ft - m.w * dy], [x0 + m.w * dx, ft - m.w * dy]]);
      let tg = "";
      for (let j = 1; j < m.l; j++) tg += `M${f1(x0 + j * c)} ${f1(ft)}L${f1(x0 + j * c + m.w * dx)} ${f1(ft - m.w * dy)}`;
      for (let j = 1; j < m.w; j++) tg += `M${f1(x0 + j * dx)} ${f1(ft - j * dy)}H${f1(x0 + m.l * c + j * dx)}`;
      g += `<path d="${tg}" ${thin}/>`;
      g += backed([[x0, fb], [x0 + m.l * c, fb], [x0 + m.l * c, ft], [x0, ft]]);
      let fg = "";
      for (let j = 1; j < m.l; j++) fg += `M${f1(x0 + j * c)} ${f1(fb)}V${f1(ft)}`;
      g += `<path d="${fg}" ${thin}/>`;
      g += backed([[x0 + m.l * c, fb], [x0 + m.l * c + m.w * dx, fb - m.w * dy], [x0 + m.l * c + m.w * dx, ft - m.w * dy], [x0 + m.l * c, ft]]);
      let rg = "";
      for (let j = 1; j < m.w; j++) rg += `M${f1(x0 + m.l * c + j * dx)} ${f1(fb - j * dy)}V${f1(ft - j * dy)}`;
      g += `<path d="${rg}" ${thin}/>`;
      if (i === m.h - 1 || ((i + 1) % step === 0 && m.h - 1 - i >= step)) g += T(x + colW, fb - c / 2 + 5, dec(R(m.cum[i])), { weight: 700, anchor: "end" });
      svg += `<g class="gm-layer" data-step="2" data-i="${i}">${g}</g>`;
    }
    return { svg, h: top + (m.h + 0.3 * m.w) * c + 6 };
  };
}

export const volumeFigure = {
  id: "solid-volume-layers",
  keys: ["solid:net"],
  title: { en: "Volume: layers of unit cubes, then the net", es: "Volumen: capas de cubos unitarios y luego la plantilla" },
  controls: () => [
    { label: "Length", labelEs: "Largo", min: 1, max: 10, step: 1 },
    { label: "Width", labelEs: "Ancho", min: 1, max: 10, step: 1 },
    { label: "Height", labelEs: "Altura", min: 1, max: 10, step: 1 },
  ],
  build(/** @type {string} */ _key, /** @type {number[]} */ v) {
    rangeCheck(v, [[1, 10], [1, 10], [1, 10]]);
    return volumeModel(v[0], v[1], v[2]);
  },
  render(/** @type {VolModel} */ m, /** @type {{ lang: "en" | "es", width: number }} */ { lang, width }) {
    const { W, x, w } = frameOf(width);
    let y = 12;
    const cubes = (/** @type {number} */ n) => (lang === "es" ? `${dec(R(n))} ${n === 1 ? "cubo" : "cubos"}` : `${dec(R(n))} ${n === 1 ? "cube" : "cubes"}`);
    const c1 = card(x, y, w, 1, L(lang, `One layer: ${m.l} × ${m.w} = ${cubes(m.layer)}`, `Una capa: ${m.l} × ${m.w} = ${cubes(m.layer)}`), [drawLayer(m, lang), muted(L(lang, "Looking down on one layer of unit cubes.", "Vista desde arriba de una capa de cubos unitarios."))]);
    y += c1.h + 12;
    const layers = (/** @type {number} */ n) => (lang === "es" ? `${n} ${n === 1 ? "capa" : "capas"}` : `${n} ${n === 1 ? "layer" : "layers"}`);
    const c2 = card(x, y, w, 2, L(lang, `Stack ${layers(m.h)}: each layer adds ${cubes(m.layer)}`, `Apila ${layers(m.h)}: cada capa suma ${cubes(m.layer)}`), [
      drawStack(m, lang),
      (px, py, pw) => P(px + pw / 2, py, L(lang, `${layers(m.h)} × ${m.layer} = ${cubes(m.volume)}`, `${layers(m.h)} × ${m.layer} = ${cubes(m.volume)}`), pw, { weight: 700 }),
      muted(L(lang, "The numbers on the left are the cubes counted so far.", "Los números de la izquierda son los cubos contados hasta ahora.")),
    ]);
    y += c2.h + 12;
    const c3 = card(x, y, w, 3, L(lang, "The same box unfolded into a net: 6 faces, 3 matching pairs", "La misma caja desplegada en una plantilla: 6 caras, 3 pares iguales"), [
      drawNet(m.net, "dims"),
      muted(L(lang, "Each face shows two of the box's three edges. Dashed lines are folds.", "Cada cara muestra dos de las tres aristas de la caja. Las líneas punteadas son dobleces.")),
    ]);
    y += c3.h + 12;
    const v = dec(R(m.volume));
    /** @type {Array<(x: number, y: number, w: number) => { svg: string, h: number }>} */
    const boxes = [(bx, by, bw) => answerBox(bx, by, bw, L(lang, `Volume = ${m.l} × ${m.w} × ${m.h} = ${v} ${CU.en}`, `Volumen = ${m.l} × ${m.w} × ${m.h} = ${v} ${CU.es}`), 4)];
    if (m.sum !== m.volume) boxes.push((bx, by, bw) => notBox(bx, by, bw, L(lang, `Not this: ${m.l} + ${m.w} + ${m.h} = ${m.sum}. Volume multiplies the three edges; it does not add them.`, `No así: ${m.l} + ${m.w} + ${m.h} = ${m.sum}. El volumen multiplica las tres aristas; no las suma.`), 4));
    const fin = stackBoxes(x, y, w, boxes);
    return { body: c1.svg + c2.svg + c3.svg + fin.svg, width: W, height: Math.ceil(fin.bottom + 14) };
  },
  scene(/** @type {ParentNode} */ root, /** @type {VolModel} */ m) {
    return sceneOf(root, 3, (win) => {
      const layers = all(root, ".gm-layer").map((el, i) => {
        const w = sub(win(2), 0.25 + (0.7 * i) / m.h, 0.25 + (0.7 * (i + 1)) / m.h);
        return { els: [el], from: w.from, to: w.to, keyframes: [{ opacity: 0, transform: "translateY(-14px)" }, { opacity: 1, transform: "none" }] };
      });
      return [...layers, ...netTracks(root, win(3)).filter((t) => !t.els.some((e) => e.classList.contains("gm-row")))];
    });
  },
  describe(/** @type {VolModel} */ m, /** @type {"en" | "es"} */ lang) {
    const es = lang === "es";
    const run = m.cum.map((n) => dec(R(n))).join(", ");
    return es
      ? `Un prisma rectangular de ${m.l} de largo, ${m.w} de ancho y ${m.h} de altura, hecho de cubos unitarios. Una capa tiene ${m.l} × ${m.w} = ${m.layer} cubos. Se apilan ${m.h} capas y los cubos contados hasta ahora son ${run}. Volumen = ${m.l} × ${m.w} × ${m.h} = ${dec(R(m.volume))} ${CU.es}. La caja desplegada es una plantilla de 6 caras en 3 pares iguales: ${m.l} × ${m.w}, ${m.l} × ${m.h} y ${m.w} × ${m.h}.${m.sum !== m.volume ? ` No así: ${m.l} + ${m.w} + ${m.h} = ${m.sum}; el volumen multiplica, no suma.` : ""}`
      : `A rectangular prism ${m.l} long, ${m.w} wide and ${m.h} tall, built from unit cubes. One layer has ${m.l} × ${m.w} = ${m.layer} cubes. ${m.h} layers are stacked and the cubes counted so far are ${run}. Volume = ${m.l} × ${m.w} × ${m.h} = ${dec(R(m.volume))} ${CU.en}. The unfolded box is a net of 6 faces in 3 matching pairs: ${m.l} × ${m.w}, ${m.l} × ${m.h} and ${m.w} × ${m.h}.${m.sum !== m.volume ? ` Not this: ${m.l} + ${m.w} + ${m.h} = ${m.sum}; volume multiplies, it does not add.` : ""}`;
  },
};

// ============================================================================================================================
// Net figures: surface area
// ============================================================================================================================

/**
 * @typedef {object} NetSpec
 * @property {string} id @property {string[]} keys @property {{ en: string, es: string }} title
 * @property {(key: string) => any[]} controls @property {(key: string, v: number[]) => any} build
 * @property {(m: any) => import("./geometry-nets.mjs").Net} netOf
 * @property {(m: any, lang: string) => string} unfoldTitle @property {(m: any, lang: string) => string} unfoldNote
 * @property {(m: any, lang: string) => string} answer @property {(m: any, lang: string) => string[]} nots
 * @property {(m: any, lang: "en" | "es") => string} tail text for describe after the faces
 */

/** @param {NetSpec} spec */
function netFigure(spec) {
  return {
    id: spec.id,
    keys: spec.keys,
    title: spec.title,
    controls: spec.controls,
    build: spec.build,
    render(/** @type {any} */ m, /** @type {{ lang: "en" | "es", width: number }} */ { lang, width }) {
      const { W, x, w } = frameOf(width);
      const net = spec.netOf(m);
      let y = 12;
      const c1 = card(x, y, w, 1, spec.unfoldTitle(m, lang), [drawNet(net, "count"), muted(spec.unfoldNote(m, lang))]);
      y += c1.h + 12;
      const c2 = card(x, y, w, 2, L(lang, "Count each face once and add its area to the running total", "Cuenta cada cara una sola vez y suma su área al total"), [drawRows(net, lang)]);
      y += c2.h + 12;
      const fin = stackBoxes(x, y, w, [
        (bx, by, bw) => answerBox(bx, by, bw, spec.answer(m, lang), 3),
        ...spec.nots(m, lang).map((s) => (/** @type {number} */ bx, /** @type {number} */ by, /** @type {number} */ bw) => notBox(bx, by, bw, s, 3)),
      ]);
      return { body: c1.svg + c2.svg + fin.svg, width: W, height: Math.ceil(fin.bottom + 14) };
    },
    scene(/** @type {ParentNode} */ root, /** @type {any} */ _m) {
      return sceneOf(root, 2, (win) => netTracks(root, win(2)));
    },
    describe(/** @type {any} */ m, /** @type {"en" | "es"} */ lang) {
      const net = spec.netOf(m);
      return `${spec.unfoldTitle(m, lang)}. ${lang === "es" ? "Caras, contadas una sola vez" : "Faces, each counted once"}: ${faceSentence(net, lang)}. ${spec.answer(m, lang)}. ${spec.tail(m, lang)}`;
    },
  };
}

const dashNote = (/** @type {string} */ lang) => L(lang, "Dashed lines are folds. Matching faces have the same fill.", "Las líneas punteadas son dobleces. Las caras iguales tienen el mismo color.");

/** @param {number} l @param {number} w @param {number} h */
function prismSurface(l, w, h) {
  const net = prismNet(l, w, h);
  const wrong = R(6 * l * w);
  return { l, w, h, net, wrong, differs: !wrong.eq(net.total), pairSum: R(l * w + l * h + w * h) };
}

const prismSpec = {
  controls: () => [
    { label: "Length", labelEs: "Largo", min: 1, max: 10, step: 1 },
    { label: "Width", labelEs: "Ancho", min: 1, max: 10, step: 1 },
    { label: "Height", labelEs: "Altura", min: 1, max: 10, step: 1 },
  ],
  build(/** @type {string} */ _key, /** @type {number[]} */ v) {
    rangeCheck(v, [[1, 10], [1, 10], [1, 10]]);
    return prismSurface(v[0], v[1], v[2]);
  },
  netOf: (/** @type {any} */ m) => m.net,
  unfoldTitle: (/** @type {any} */ _m, /** @type {string} */ lang) => L(lang, "Unfold the box into a net with 6 faces", "Despliega la caja en una plantilla de 6 caras"),
  unfoldNote: (/** @type {any} */ _m, /** @type {string} */ lang) => dashNote(lang),
  answer: (/** @type {any} */ m, /** @type {string} */ lang) => L(lang, `Surface area = ${m.net.sum} ${SQ.en}. In pairs: 2 × (${m.l} × ${m.w} + ${m.l} × ${m.h} + ${m.w} × ${m.h}) = ${dec(R(2).mul(m.pairSum))}.`, `Área de superficie = ${m.net.sum} ${SQ.es}. En pares: 2 × (${m.l} × ${m.w} + ${m.l} × ${m.h} + ${m.w} × ${m.h}) = ${dec(R(2).mul(m.pairSum))}.`),
  nots: (/** @type {any} */ m, /** @type {string} */ lang) => (m.differs ? [L(lang, `Not this: 6 × ${m.l * m.w} = ${dec(m.wrong)}. The six faces are not all the same size.`, `No así: 6 × ${m.l * m.w} = ${dec(m.wrong)}. Las seis caras no son todas del mismo tamaño.`)] : []),
  tail: (/** @type {any} */ m, /** @type {"en" | "es"} */ lang) => (m.differs ? (lang === "es" ? `No así: 6 × ${m.l * m.w} = ${dec(m.wrong)}, porque las caras no son todas iguales.` : `Not this: 6 × ${m.l * m.w} = ${dec(m.wrong)}, because the faces are not all the same size.`) : lang === "es" ? "Todas las caras son cuadrados iguales." : "All six faces are equal squares."),
};

export const prismFigure = netFigure({
  id: "solid-net-surface-prism",
  keys: ["solid:surface", "solid:faces"],
  title: { en: "Unfold the box and add each face once", es: "Despliega la caja y suma cada cara una sola vez" },
  ...prismSpec,
});

/** @param {number} a @param {number} len */
function triPrismModel(a, len) {
  const net = triPrismNet(a, len);
  return { a, len, net, one: net.total.sub(net.tri) };
}
export const triPrismFigure = netFigure({
  id: "solid-net-surface-triangular-prism",
  keys: ["solid:tri-prism"],
  title: { en: "Unfold the triangular prism and add each face once", es: "Despliega el prisma triangular y suma cada cara una sola vez" },
  controls: () => [
    { label: "Triangle height", labelEs: "Altura del triángulo", min: 3, max: 12, step: 3 },
    { label: "Prism length", labelEs: "Largo del prisma", min: 1, max: 10, step: 1 },
  ],
  build(/** @type {string} */ _key, /** @type {number[]} */ v) {
    rangeCheck(v, [[3, 12], [1, 10]]);
    if (v[0] % 3 !== 0) throw new RangeError("Use a triangle height of 3, 6, 9 or 12.");
    return triPrismModel(v[0], v[1]);
  },
  netOf: (/** @type {any} */ m) => m.net,
  unfoldTitle: (/** @type {any} */ _m, /** @type {string} */ lang) => L(lang, "Unfold the triangular prism: 2 triangles and 3 rectangles", "Despliega el prisma triangular: 2 triángulos y 3 rectángulos"),
  unfoldNote: (/** @type {any} */ m, /** @type {string} */ lang) => L(lang, `Triangle sides ${m.net.a}, ${m.net.b}, ${m.net.c}. Each rectangle is as wide as one side and ${m.len} long. Dashed lines are folds.`, `Lados del triángulo ${m.net.a}, ${m.net.b}, ${m.net.c}. Cada rectángulo mide de ancho un lado y ${m.len} de largo. Las líneas punteadas son dobleces.`),
  answer: (/** @type {any} */ m, /** @type {string} */ lang) => L(lang, `Surface area = ${m.net.sum} ${SQ.en}`, `Área de superficie = ${m.net.sum} ${SQ.es}`),
  nots: (/** @type {any} */ m, /** @type {string} */ lang) => [L(lang, `Not this: counting only one triangle end gives ${dec(m.one)}. A prism has two ends.`, `No así: contar un solo extremo triangular da ${dec(m.one)}. Un prisma tiene dos extremos.`)],
  tail: (/** @type {any} */ m, /** @type {"en" | "es"} */ lang) => (lang === "es" ? `No así: contar un solo extremo triangular da ${dec(m.one)}.` : `Not this: counting only one triangle end gives ${dec(m.one)}.`),
});

/** @param {number} s @param {number} l */
function pyramidModel(s, l) {
  const net = pyramidNet(s, l);
  return { s, l, net, formula: R(s * s).add(R(4).mul(net.tri)) };
}
export const pyramidFigure = netFigure({
  id: "solid-net-surface-pyramid",
  keys: ["solid:pyramid-net"],
  title: { en: "Unfold the square pyramid and add each face once", es: "Despliega la pirámide cuadrada y suma cada cara una sola vez" },
  controls: () => [
    { label: "Base side", labelEs: "Lado de la base", min: 1, max: 10, step: 1 },
    { label: "Slant height", labelEs: "Altura inclinada", min: 6, max: 12, step: 1 },
  ],
  build(/** @type {string} */ _key, /** @type {number[]} */ v) {
    rangeCheck(v, [[1, 10], [6, 12]]);
    return pyramidModel(v[0], v[1]);
  },
  netOf: (/** @type {any} */ m) => m.net,
  unfoldTitle: (/** @type {any} */ _m, /** @type {string} */ lang) => L(lang, "Unfold the pyramid: 1 square and 4 triangles", "Despliega la pirámide: 1 cuadrado y 4 triángulos"),
  unfoldNote: (/** @type {any} */ m, /** @type {string} */ lang) => L(lang, `Dashed line l = ${m.l}: the slant height, the height of each triangle, measured along the face.`, `Línea punteada l = ${m.l}: la altura inclinada, la altura de cada triángulo, medida sobre la cara.`),
  answer: (/** @type {any} */ m, /** @type {string} */ lang) => L(lang, `Surface area = ${m.net.sum} ${SQ.en}. Same as ${m.s} × ${m.s} + 4 × ${dec(m.net.tri)}.`, `Área de superficie = ${m.net.sum} ${SQ.es}. Es igual a ${m.s} × ${m.s} + 4 × ${dec(m.net.tri)}.`),
  nots: (/** @type {any} */ m, /** @type {string} */ lang) => [L(lang, `Not this: the height straight up inside the pyramid. Each triangle's height is the slant height ${m.l}, along the face.`, `No así: la altura que sube recta por dentro de la pirámide. La altura de cada triángulo es la altura inclinada ${m.l}, sobre la cara.`)],
  tail: (/** @type {any} */ m, /** @type {"en" | "es"} */ lang) => (lang === "es" ? `No así: la altura recta por dentro de la pirámide; la altura de cada triángulo es la altura inclinada ${m.l}.` : `Not this: the height straight up inside the pyramid; each triangle's height is the slant height ${m.l}.`),
});

export default [volumeFigure, prismFigure, triPrismFigure, pyramidFigure];
