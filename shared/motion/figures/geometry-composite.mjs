// Motion figure for lesson 5-4 (composite shapes): an L-shaped floor with a rectangular notch cut from one corner. Two strategies
// reach the same area: ADD two rectangles, or SUBTRACT the notch from the whole rectangle. All arithmetic is integer.
import { COLOR } from "../tokens.mjs";
import { FILL, L, P, POP, SQ, T, all, answerBox, card, f1, frameOf, line, notBox, poly, sceneOf, slideFrom, stackBoxes, sub } from "./geometry-kit.mjs";

/** @param {number} W @param {number} H @param {number} w @param {number} h */
export function compositeModel(W, H, w, h) {
  const checks = [[W, 4, 14], [H, 4, 12], [w, 1, 3], [h, 1, 3]];
  for (const [v, lo, hi] of checks) if (!Number.isInteger(v) || v < lo || v > hi) throw new RangeError(`Use a whole number from ${lo} to ${hi}.`);
  const a = (W - w) * H; // the tall left rectangle
  const b = w * (H - h); // the lower right rectangle
  const whole = W * H;
  const notch = w * h;
  return { W, H, w, h, a, b, addTotal: a + b, whole, notch, subTotal: whole - notch, total: whole - notch };
}
/** @typedef {ReturnType<typeof compositeModel>} CompModel */

const MARGIN = 30;
const scaleOf = (/** @type {CompModel} */ m, /** @type {number} */ w) => Math.min((w - MARGIN - 6) / m.W, 170 / m.H, 28);

/** Shared origin of the drawing: x0 of world 0, the top y, and the scale. */
function frameFor(/** @type {CompModel} */ m, /** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w) {
  const c = scaleOf(m, w);
  return { c, x0: x + MARGIN + (w - MARGIN - 6 - m.W * c) / 2, yt: y + 6 };
}

function drawShape(/** @type {CompModel} */ m, /** @type {"shape" | "add" | "sub"} */ mode, /** @type {string} */ lang) {
  return (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w) => {
    const { W, H, w: nw, h: nh } = m;
    const { c, x0, yt } = frameFor(m, x, y, w);
    const yb = yt + H * c;
    const X = (/** @type {number} */ n) => x0 + n * c;
    const Y = (/** @type {number} */ n) => yb - n * c;
    let svg = "";
    if (mode === "shape") {
      svg += poly([[X(0), Y(0)], [X(W), Y(0)], [X(W), Y(H - nh)], [X(W - nw), Y(H - nh)], [X(W - nw), Y(H)], [X(0), Y(H)]], { fill: FILL.teal, fo: 0.35 });
      let grid = "";
      for (let i = 1; i < W; i++) grid += `M${f1(X(i))} ${f1(Y(0))}V${f1(Y(i > W - nw ? H - nh : H))}`;
      for (let j = 1; j < H; j++) grid += `M${f1(X(0))} ${f1(Y(j))}H${f1(X(j > H - nh ? W - nw : W))}`;
      svg += `<path d="${grid}" stroke="${COLOR.ink}" stroke-opacity="0.35" stroke-width="1" fill="none"/>`;
      svg += `<rect x="${f1(X(W - nw))}" y="${f1(Y(H))}" width="${f1(nw * c)}" height="${f1(nh * c)}" fill="none" stroke="${COLOR.ink}" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    } else if (mode === "add") {
      svg += `<g class="gm-piece" data-step="2" data-k="0">${poly([[X(0), Y(0)], [X(W - nw), Y(0)], [X(W - nw), Y(H)], [X(0), Y(H)]], { fill: FILL.teal, fo: 0.35 })}${T(X((W - nw) / 2), Y(H / 2) + 5, "A", { weight: 700, halo: true })}</g>`;
      svg += `<g class="gm-piece" data-step="2" data-k="1">${poly([[X(W - nw), Y(0)], [X(W), Y(0)], [X(W), Y(H - nh)], [X(W - nw), Y(H - nh)]], { fill: FILL.amber, fo: 0.7 })}${T(X(W - nw / 2), Y((H - nh) / 2) + 5, "B", { weight: 700, halo: true })}</g>`;
      svg += line(X(W - nw), Y(0), X(W - nw), Y(H - nh), { dash: "5 4" });
    } else {
      svg += poly([[X(0), Y(0)], [X(W), Y(0)], [X(W), Y(H)], [X(0), Y(H)]], { fill: FILL.teal, fo: 0.35 });
      svg += `<rect x="${f1(X(W - nw))}" y="${f1(Y(H))}" width="${f1(nw * c)}" height="${f1(nh * c)}" fill="${COLOR.white}" stroke="${COLOR.ink}" stroke-width="1.6" stroke-dasharray="5 4"/>`;
      const py = yb + 28;
      const dy = Y(H) - py;
      svg += `<g class="gm-piece" data-step="3" data-dy="${f1(dy)}">${poly([[X(W - nw), py], [X(W), py], [X(W), py + nh * c], [X(W - nw), py + nh * c]], { fill: FILL.amber, fo: 0.7, dash: "5 3" })}${nw * c >= 18 && nh * c >= 18 ? T(X(W - nw / 2), py + (nh * c) / 2 + 5, "−", { weight: 700, size: 16 }) : ""}</g>`;
    }
    svg += T(X(W / 2), yb + 19, `${L(lang, "width", "ancho")} ${W}`, { weight: 700 });
    svg += T(x0 - 6, yt + (H * c) / 2 + 5, String(H), { weight: 700, anchor: "end" });
    return { svg, h: 6 + H * c + (mode === "sub" ? 32 + nh * c : 26) };
  };
}

const para = (/** @type {string[]} */ lines, /** @type {boolean} */ boldLast) => (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w) => {
  let svg = "";
  let h = 0;
  lines.forEach((s, i) => {
    const p = P(x + w / 2, y + h, s, w, { weight: boldLast && i === lines.length - 1 ? 700 : 400, size: 14 });
    svg += p.svg;
    h += p.h;
  });
  return { svg, h };
};

export const compositeFigure = {
  id: "area-composite-lshape",
  keys: ["area:composite"],
  standalone: { values: [10, 8, 3, 2] },
  title: { en: "An L-shaped area two ways: add or subtract", es: "El área de una figura en L de dos maneras: sumar o restar" },
  controls: () => [
    { label: "Outer width", labelEs: "Ancho total", min: 4, max: 14, step: 1 },
    { label: "Outer height", labelEs: "Alto total", min: 4, max: 12, step: 1 },
    { label: "Notch width", labelEs: "Ancho del hueco", min: 1, max: 3, step: 1 },
    { label: "Notch height", labelEs: "Alto del hueco", min: 1, max: 3, step: 1 },
  ],
  build(/** @type {string} */ _key, /** @type {number[]} */ v) {
    if (!Array.isArray(v) || v.length !== 4) throw new RangeError("Wrong number of settings.");
    return compositeModel(v[0], v[1], v[2], v[3]);
  },
  render(/** @type {CompModel} */ m, /** @type {{ lang: "en" | "es", width: number }} */ { lang, width }) {
    const { W, x, w } = frameOf(width);
    let y = 12;
    const c1 = card(x, y, w, 1, L(lang, "An L-shaped floor on a grid: a rectangle with a corner missing", "Un piso en forma de L en una cuadrícula: un rectángulo al que le falta una esquina"), [
      drawShape(m, "shape", lang),
      para([L(lang, `Outer rectangle ${m.W} × ${m.H}. Missing corner (dashed) ${m.w} × ${m.h}.`, `Rectángulo exterior ${m.W} × ${m.H}. Esquina que falta (punteada) ${m.w} × ${m.h}.`)], false),
    ]);
    y += c1.h + 12;
    const c2 = card(x, y, w, 2, L(lang, "Strategy 1, add: cut the L into two rectangles", "Estrategia 1, sumar: corta la L en dos rectángulos"), [
      drawShape(m, "add", lang),
      para([`A: ${m.W - m.w} × ${m.H} = ${m.a}`, `B: ${m.w} × ${m.H - m.h} = ${m.b}`, `${m.a} + ${m.b} = ${m.addTotal}`], true),
    ]);
    y += c2.h + 12;
    const c3 = card(x, y, w, 3, L(lang, "Strategy 2, subtract: the whole rectangle minus the missing corner", "Estrategia 2, restar: el rectángulo completo menos la esquina que falta"), [
      drawShape(m, "sub", lang),
      para([L(lang, `Whole: ${m.W} × ${m.H} = ${m.whole}`, `Completo: ${m.W} × ${m.H} = ${m.whole}`), L(lang, `Corner: ${m.w} × ${m.h} = ${m.notch}`, `Esquina: ${m.w} × ${m.h} = ${m.notch}`), `${m.whole} − ${m.notch} = ${m.subTotal}`], true),
    ]);
    y += c3.h + 12;
    const fin = stackBoxes(x, y, w, [
      (bx, by, bw) => answerBox(bx, by, bw, L(lang, `Same area, two strategies: ${m.a} + ${m.b} = ${m.addTotal} and ${m.whole} − ${m.notch} = ${m.subTotal}. Area = ${m.total} ${SQ.en}`, `Misma área, dos estrategias: ${m.a} + ${m.b} = ${m.addTotal} y ${m.whole} − ${m.notch} = ${m.subTotal}. Área = ${m.total} ${SQ.es}`), 4),
      (bx, by, bw) => notBox(bx, by, bw, L(lang, `Not this: ${m.W} × ${m.H} = ${m.whole} is the whole rectangle. Subtract the missing corner ${m.w} × ${m.h} = ${m.notch}.`, `No así: ${m.W} × ${m.H} = ${m.whole} es el rectángulo completo. Resta la esquina que falta ${m.w} × ${m.h} = ${m.notch}.`), 4),
    ]);
    return { body: c1.svg + c2.svg + c3.svg + fin.svg, width: W, height: Math.ceil(fin.bottom + 14) };
  },
  scene(/** @type {ParentNode} */ root, /** @type {CompModel} */ _m) {
    return sceneOf(root, 3, (win) => [
      ...all(root, '.gm-piece[data-step="2"]').map((el) => {
        const k = Number(el.getAttribute("data-k"));
        const w = sub(win(2), 0.3 + 0.3 * k, 0.6 + 0.3 * k);
        return { els: [el], from: w.from, to: w.to, keyframes: POP };
      }),
      ...all(root, '.gm-piece[data-step="3"]').map((el) => {
        const w = sub(win(3), 0.35, 0.9);
        return { els: [el], from: w.from, to: w.to, keyframes: slideFrom(0, Number(el.getAttribute("data-dy"))) };
      }),
    ]);
  },
  headline: (/** @type {CompModel} */ m, /** @type {string} */ lang) => ({ label: L(lang, "Area of the shape", "Área de la figura"), value: String(m.total) }),
  wrong: (/** @type {CompModel} */ m, /** @type {string} */ lang) => ({ value: String(m.whole), say: L(lang, "Used the whole rectangle and forgot to subtract the notch.", "Usaste el rectángulo completo y olvidaste restar el hueco.") }),
  describe(/** @type {CompModel} */ m, /** @type {"en" | "es"} */ lang) {
    return lang === "es"
      ? `Una figura en L: un rectángulo de ${m.W} por ${m.H} al que le falta una esquina de ${m.w} por ${m.h}. Estrategia 1, sumar: se corta en dos rectángulos, A de ${m.W - m.w} × ${m.H} = ${m.a} y B de ${m.w} × ${m.H - m.h} = ${m.b}, y ${m.a} + ${m.b} = ${m.addTotal}. Estrategia 2, restar: el rectángulo completo ${m.W} × ${m.H} = ${m.whole} menos la esquina ${m.w} × ${m.h} = ${m.notch}, y ${m.whole} − ${m.notch} = ${m.subTotal}. Misma área, dos estrategias: ${m.total} ${SQ.es}. No así: ${m.W} × ${m.H} = ${m.whole} es el rectángulo completo, sin restar la esquina.`
      : `An L-shaped figure: a ${m.W} by ${m.H} rectangle with a ${m.w} by ${m.h} corner missing. Strategy 1, add: cut it into two rectangles, A ${m.W - m.w} × ${m.H} = ${m.a} and B ${m.w} × ${m.H - m.h} = ${m.b}, and ${m.a} + ${m.b} = ${m.addTotal}. Strategy 2, subtract: the whole rectangle ${m.W} × ${m.H} = ${m.whole} minus the corner ${m.w} × ${m.h} = ${m.notch}, and ${m.whole} − ${m.notch} = ${m.subTotal}. Same area, two strategies: ${m.total} ${SQ.en}. Not this: ${m.W} × ${m.H} = ${m.whole} is the whole rectangle, with the corner not subtracted.`;
  },
};

export default [compositeFigure];
