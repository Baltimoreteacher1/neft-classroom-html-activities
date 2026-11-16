// Nets for the surface-area figures (5-6 to 5-8): the face lists, a net drawing whose faces unfold from their hinge edges, and
// the counting table where each face is added once to a running total. All areas are exact Rats; every pixel position is derived
// from the same integer dimensions.
import { Rat } from "../exact.mjs";
import { COLOR } from "../tokens.mjs";
import { FILL, L, P, T, all, dec, f1, line, poly, R, textW, unfoldFrom, sub, RISE, FADE } from "./geometry-kit.mjs";

/**
 * @typedef {object} Face
 * @property {{ en: string, es: string }} name
 * @property {string} expr "4 × 3 = 12" (computed)
 * @property {string} dims "4 × 3" (computed)
 * @property {Rat} area
 * @property {number[][]} poly world points
 * @property {{ axis: "X" | "Y", at: number[] } | null} hinge scale axis and a world point on the hinge edge
 * @property {number} fill index into FILLS
 */
/** @typedef {{ faces: Face[], outline: number[][], folds: number[][][], ww: number, wh: number, total: Rat, totals: Rat[], sum: string, lineFace?: number, extra?: (c: number, X: (n: number) => number, Y: (n: number) => number) => string }} Net */

const FILLS = [FILL.teal, FILL.amber, FILL.slate, FILL.green];

/** @param {Rat} a @param {Rat} b */
const addRat = (a, b) => a.add(b);

/** Fill in running totals and the sum text from the faces. @param {Omit<Net, "totals" | "total" | "sum">} net */
function finish(net) {
  let run = R(0);
  const totals = net.faces.map((f) => {
    run = addRat(run, f.area);
    return run;
  });
  const sum = `${net.faces.map((f) => dec(f.area)).join(" + ")} = ${dec(run)}`;
  return { ...net, totals, total: run, sum };
}

/** @param {number} a @param {number} b */
const rectFace = (a, b) => ({ dims: `${a} × ${b}`, area: R(a * b), expr: `${a} × ${b} = ${a * b}` });

/** The net of a rectangular prism, faces in the order they unfold from the front face. */
export function prismNet(/** @type {number} */ l, /** @type {number} */ w, /** @type {number} */ h) {
  const rect = (/** @type {number} */ x0, /** @type {number} */ y0, /** @type {number} */ x1, /** @type {number} */ y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const front = { name: { en: "Front", es: "Frente" }, ...rectFace(l, h), poly: rect(0, w, l, w + h), hinge: null, fill: 0 };
  const top = { name: { en: "Top", es: "Arriba" }, ...rectFace(l, w), poly: rect(0, 0, l, w), hinge: { axis: /** @type {"Y"} */ ("Y"), at: [0, w] }, fill: 1 };
  const bottom = { name: { en: "Bottom", es: "Abajo" }, ...rectFace(l, w), poly: rect(0, w + h, l, 2 * w + h), hinge: { axis: /** @type {"Y"} */ ("Y"), at: [0, w + h] }, fill: 1 };
  const right = { name: { en: "Right", es: "Derecha" }, ...rectFace(w, h), poly: rect(l, w, l + w, w + h), hinge: { axis: /** @type {"X"} */ ("X"), at: [l, w] }, fill: 2 };
  const back = { name: { en: "Back", es: "Atrás" }, ...rectFace(l, h), poly: rect(l + w, w, 2 * l + w, w + h), hinge: { axis: /** @type {"X"} */ ("X"), at: [l + w, w] }, fill: 0 };
  const left = { name: { en: "Left", es: "Izquierda" }, ...rectFace(w, h), poly: rect(2 * l + w, w, 2 * l + 2 * w, w + h), hinge: { axis: /** @type {"X"} */ ("X"), at: [2 * l + w, w] }, fill: 2 };
  const xs = [0, l, l + w, 2 * l + w, 2 * l + 2 * w];
  return finish({
    faces: [front, top, bottom, right, back, left],
    outline: [[0, 0], [l, 0], [l, w], [xs[4], w], [xs[4], w + h], [l, w + h], [l, 2 * w + h], [0, 2 * w + h]],
    folds: [[[l, w], [l, w + h]], [[l + w, w], [l + w, w + h]], [[2 * l + w, w], [2 * l + w, w + h]], [[0, w], [l, w]], [[0, w + h], [l, w + h]]],
    ww: 2 * l + 2 * w,
    wh: h + 2 * w,
  });
}

/** The net of a triangular prism whose end is a right triangle with legs a (height) and 4a/3 (base) and hypotenuse 5a/3. */
export function triPrismNet(/** @type {number} */ a, /** @type {number} */ len) {
  const b = (a * 4) / 3;
  const c = (a * 5) / 3;
  const rect = (/** @type {number} */ x0, /** @type {number} */ x1) => [[x0, a], [x1, a], [x1, a + len], [x0, a + len]];
  const tri = new Rat(BigInt(a * b), 2n);
  const triExpr = `${b} × ${a} ÷ 2 = ${dec(tri)}`;
  const base = { name: { en: "Rectangle", es: "Rectángulo" }, ...rectFace(b, len), poly: rect(a, a + b), hinge: null, fill: 0 };
  const up = { name: { en: "Triangle", es: "Triángulo" }, dims: `${b} × ${a}`, area: tri, expr: triExpr, poly: [[a, a], [a + b, a], [a, 0]], hinge: { axis: /** @type {"Y"} */ ("Y"), at: [a, a] }, fill: 1 };
  const down = { name: { en: "Triangle", es: "Triángulo" }, dims: `${b} × ${a}`, area: tri, expr: triExpr, poly: [[a, a + len], [a + b, a + len], [a, 2 * a + len]], hinge: { axis: /** @type {"Y"} */ ("Y"), at: [a, a + len] }, fill: 1 };
  const ra = { name: { en: "Rectangle", es: "Rectángulo" }, ...rectFace(a, len), poly: rect(0, a), hinge: { axis: /** @type {"X"} */ ("X"), at: [a, a] }, fill: 3 };
  const rc = { name: { en: "Rectangle", es: "Rectángulo" }, ...rectFace(c, len), poly: rect(a + b, a + b + c), hinge: { axis: /** @type {"X"} */ ("X"), at: [a + b, a] }, fill: 2 };
  return {
    tri,
    a, b, c, len,
    ...finish({
      faces: [base, up, down, ra, rc],
      outline: [[0, a], [a, a], [a, 0], [a + b, a], [a + b + c, a], [a + b + c, a + len], [a + b, a + len], [a, 2 * a + len], [a, a + len], [0, a + len]],
      folds: [[[a, a], [a, a + len]], [[a + b, a], [a + b, a + len]], [[a, a], [a + b, a]], [[a, a + len], [a + b, a + len]]],
      ww: a + b + c,
      wh: len + 2 * a,
    }),
  };
}

/** The net of a square pyramid: a square base of side s and four triangles of slant height l. */
export function pyramidNet(/** @type {number} */ s, /** @type {number} */ l) {
  const tri = new Rat(BigInt(s * l), 2n);
  const expr = `${s} × ${l} ÷ 2 = ${dec(tri)}`;
  const nm = { en: "Triangle", es: "Triángulo" };
  const base = { name: { en: "Base", es: "Base" }, ...rectFace(s, s), poly: [[l, l], [l + s, l], [l + s, l + s], [l, l + s]], hinge: null, fill: 0 };
  const top = { name: nm, dims: `${s} × ${l}`, area: tri, expr, poly: [[l, l], [l + s, l], [l + s / 2, 0]], hinge: { axis: /** @type {"Y"} */ ("Y"), at: [l, l] }, fill: 1 };
  const right = { name: nm, dims: `${s} × ${l}`, area: tri, expr, poly: [[l + s, l], [l + s, l + s], [2 * l + s, l + s / 2]], hinge: { axis: /** @type {"X"} */ ("X"), at: [l + s, l] }, fill: 1 };
  const bottom = { name: nm, dims: `${s} × ${l}`, area: tri, expr, poly: [[l, l + s], [l + s, l + s], [l + s / 2, 2 * l + s]], hinge: { axis: /** @type {"Y"} */ ("Y"), at: [l, l + s] }, fill: 1 };
  const left = { name: nm, dims: `${s} × ${l}`, area: tri, expr, poly: [[l, l], [l, l + s], [0, l + s / 2]], hinge: { axis: /** @type {"X"} */ ("X"), at: [l, l] }, fill: 1 };
  return {
    s, l, tri,
    ...finish({
      faces: [base, top, right, bottom, left],
      outline: [[l, l], [l + s / 2, 0], [l + s, l], [2 * l + s, l + s / 2], [l + s, l + s], [l + s / 2, 2 * l + s], [l, l + s], [0, l + s / 2]],
      folds: [[[l, l], [l + s, l]], [[l + s, l], [l + s, l + s]], [[l + s, l + s], [l, l + s]], [[l, l + s], [l, l]]],
      ww: s + 2 * l,
      wh: s + 2 * l,
      lineFace: 1,
      extra: (c, X, Y) => {
        const mx = l + s / 2;
        return `${line(X(mx), Y(0), X(mx), Y(l), { dash: "5 4" })}<polyline points="${f1(X(mx))},${f1(Y(l) - 9)} ${f1(X(mx) + 9)},${f1(Y(l) - 9)} ${f1(X(mx) + 9)},${f1(Y(l))}" fill="none" stroke="${COLOR.ink}" stroke-width="1.6"/>${T(X(mx) + 8, Y(0) + 16, `l = ${l}`, { weight: 700, anchor: "start", halo: true })}`;
      },
    }),
  };
}

const bbox = (/** @type {number[][]} */ pts) => {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
};

/** @param {Net} net @param {number} w */
export const netScale = (net, w) => Math.min(w / net.ww, 170 / net.wh, 30);

/**
 * The net as one drawing part. mode "count" puts each face's counting number on it; "dims" writes its two sides.
 * @param {Net} net @param {"count" | "dims"} mode
 */
export function drawNet(net, mode) {
  return (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w) => {
    const c = netScale(net, w);
    const x0 = x + (w - net.ww * c) / 2;
    const y0 = y + 4;
    const X = (/** @type {number} */ n) => x0 + n * c;
    const Y = (/** @type {number} */ n) => y0 + n * c;
    const px = (/** @type {number[][]} */ pts) => pts.map((p) => [X(p[0]), Y(p[1])]);
    let svg = "";
    net.faces.forEach((f, i) => {
      const pts = px(f.poly);
      const b = bbox(pts);
      const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
      const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      const hinge = f.hinge ? ` data-axis="${f.hinge.axis}" data-hx="${f1(X(f.hinge.at[0]))}" data-hy="${f1(Y(f.hinge.at[1]))}"` : "";
      let mark = "";
      const small = Math.min(b.x1 - b.x0, b.y1 - b.y0);
      if (mode === "count" && net.lineFace === i) {
        // the dashed slant height runs down this face's middle, so the number sits beside it where the face is wide enough
        const frac = 0.75;
        const hw = (frac * (b.x1 - b.x0)) / 2;
        if (hw >= 26) mark = `<circle cx="${f1(cx + hw / 2)}" cy="${f1(b.y1 - (1 - frac) * (b.y1 - b.y0))}" r="10" fill="${COLOR.navy}"/>${T(cx + hw / 2, b.y1 - (1 - frac) * (b.y1 - b.y0) + 5, String(i + 1), { weight: 700, fill: COLOR.white })}`;
      } else if (mode === "count" && small >= 26) mark = `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="10" fill="${COLOR.navy}"/>${T(cx, cy + 5, String(i + 1), { weight: 700, fill: COLOR.white })}`;
      else if (mode === "dims" && f.poly.length === 4 && b.x1 - b.x0 >= textW(f.dims, 14, true) + 6 && b.y1 - b.y0 >= 20) mark = T(cx, cy + 5, f.dims, { weight: 700 });
      svg += `<g class="gm-face" data-step="2" data-i="${i}"${hinge}>${poly(pts, { fill: FILLS[f.fill], fo: 0.5, stroke: "none", sw: 0 })}${mark}</g>`;
    });
    svg += poly(px(net.outline), { sw: 2.4 });
    for (const [p, q] of net.folds) svg += line(X(p[0]), Y(p[1]), X(q[0]), Y(q[1]), { dash: "5 4", sw: 1.6 });
    if (net.extra) svg += net.extra(c, X, Y);
    return { svg, h: net.wh * c + 8 };
  };
}

/** The counting table: one row per face, with the running total. @param {Net} net @param {string} lang */
export function drawRows(net, lang) {
  return (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w) => {
    let svg = T(x, y + 13, L(lang, "Face and its area", "Cara y su área"), { size: 13, anchor: "start", fill: COLOR.muted });
    svg += T(x + w, y + 13, L(lang, "Total so far", "Total hasta ahora"), { size: 13, anchor: "end", fill: COLOR.muted });
    let cy = y + 22;
    net.faces.forEach((f, i) => {
      const name = f.name[lang === "es" ? "es" : "en"];
      const total = dec(net.totals[i]);
      const left = `${name} ${f.expr}`;
      const swatch = `<rect x="${f1(x + 26)}" y="${f1(cy + 6)}" width="12" height="12" rx="2" fill="${FILLS[f.fill]}" fill-opacity="0.6" stroke="${COLOR.ink}" stroke-width="1.2"/>`;
      const room = w - 44 - textW(`→ ${total}`, 14, true) - 8;
      const two = textW(left, 14, false) * 0.92 > room;
      const lh = two ? 44 : 28;
      svg += `<g class="gm-row" data-step="2" data-i="${i}"><circle cx="${f1(x + 10)}" cy="${f1(cy + 12)}" r="10" fill="${COLOR.navy}"/>${T(x + 10, cy + 17, String(i + 1), { weight: 700, fill: COLOR.white })}${swatch}`;
      if (!two) svg += T(x + 44, cy + 17, left, { anchor: "start" });
      else svg += T(x + 44, cy + 14, left, { anchor: "start", size: 13 });
      svg += T(x + w, two ? cy + 34 : cy + 17, `→ ${total}`, { weight: 700, anchor: "end" });
      svg += "</g>";
      cy += lh;
    });
    return { svg, h: cy - y };
  };
}

/** Scene pieces for a net: each face unfolds from its hinge and its row appears with it, inside step 2's window. @param {ParentNode} root @param {{ from: number, to: number }} win */
export function netTracks(root, win) {
  /** @type {any[]} */
  const out = [];
  const faces = all(root, ".gm-face");
  faces.forEach((el, i) => {
    const w = sub(win, (0.8 * i) / faces.length + 0.1, (0.8 * (i + 1)) / faces.length + 0.1);
    const axis = el.getAttribute("data-axis");
    const keyframes = axis ? unfoldFrom(/** @type {"X" | "Y"} */ (axis), Number(el.getAttribute("data-hx")), Number(el.getAttribute("data-hy"))) : FADE;
    out.push({ els: [el], from: w.from, to: w.to, keyframes });
    out.push({ els: all(root, `.gm-row[data-i="${i}"]`), from: w.from, to: w.to, keyframes: RISE });
  });
  return out;
}

/** Sentence that lists each face once with its area, for describe(). @param {Net} net @param {"en" | "es"} lang */
export function faceSentence(net, lang) {
  return net.faces.map((f, i) => `${i + 1}. ${f.name[lang]} ${f.expr}, ${lang === "es" ? "total" : "total so far"} ${dec(net.totals[i])}`).join("; ");
}
export { P };
