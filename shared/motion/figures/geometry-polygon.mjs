// Motion figure for lesson 5-9 (and the polygon lab): a regular polygon is split from its centre into congruent triangles whose
// base is a side and whose height is the apothem. The apothem of most regular polygons is irrational, so every readout comes from
// BigInt fixed-point trigonometry (40 digits, no floating point) and is rounded to 2 places the way the lab rounds it, with
// "=" only where the rounded value is exact and "≈" otherwise.
import { COLOR } from "../tokens.mjs";
import { commas } from "../exact.mjs";
import { FILL, L, P, POP, SQ, T, all, answerBox, card, f1, frameOf, line, notBox, poly, rightMark, sceneOf, stackBoxes, sub } from "./geometry-kit.mjs";

const S = 10n ** 40n;

/** arctan(1/x) in fixed point. @param {number} x */
function atanInv(x) {
  const xb = BigInt(x);
  const x2 = xb * xb;
  let pow = S / xb;
  let sum = pow;
  let k = 1n;
  let sign = -1n;
  while (pow > 0n) {
    pow /= x2;
    k += 2n;
    sum += sign * (pow / k);
    sign = -sign;
  }
  return sum;
}
const PI = 16n * atanInv(5) - 4n * atanInv(239);

/** sin and cos of a fixed-point angle (0 to pi/2). @param {bigint} x */
function sinCos(x) {
  let sin = x;
  let term = x;
  let cos = S;
  let ct = S;
  for (let k = 1n; term !== 0n || ct !== 0n; k++) {
    term = (-term * x * x) / (S * S) / ((2n * k) * (2n * k + 1n));
    ct = (-ct * x * x) / (S * S) / ((2n * k - 1n) * (2n * k));
    sin += term;
    cos += ct;
  }
  return { sin, cos };
}

/** Hundredths, rounded half up. @param {bigint} x fixed point */
const hundredths = (x) => (x * 100n + S / 2n) / S;
/** The lab's test for "this 2-place value is exact": within 1e-9. @param {bigint} x */
const isExact2 = (x) => {
  const d = x * 100n - hundredths(x) * S;
  return (d < 0n ? -d : d) < S / 10n ** 7n;
};
/** 1234 hundredths -> "12.34", 1250 -> "12.5", 1200 -> "12". @param {bigint} h */
export function hundText(h) {
  const whole = h / 100n;
  const fr = h % 100n;
  const f = fr === 0n ? "" : fr % 10n === 0n ? `.${fr / 10n}` : `.${String(fr).padStart(2, "0")}`;
  return commas(whole) + f;
}

/** @param {number} n sides @param {number} side */
export function polygonModel(n, side) {
  const { sin, cos } = sinCos(PI / BigInt(n));
  const cot = (cos * S) / sin;
  const apothem = (BigInt(side) * cot) / 2n;
  const triangle = (BigInt(side) * apothem) / 2n;
  const total = BigInt(n) * triangle;
  const radius = (BigInt(side) * S * S) / (2n * sin);
  const wrong = (BigInt(n) * BigInt(side) * radius) / 2n;
  /** @param {bigint} x */
  const q = (x) => ({ text: hundText(hundredths(x)), sym: isExact2(x) ? "=" : "≈", hund: hundredths(x) });
  return { n, side, apothem: q(apothem), triangle: q(triangle), total: q(total), wrong: { text: hundText(hundredths(wrong)), hund: hundredths(wrong) } };
}
/** @typedef {ReturnType<typeof polygonModel>} PolyModel */

const NAMES = [
  ["", ""], ["", ""], ["", ""],
  ["triangle", "triángulo"], ["square", "cuadrado"], ["pentagon", "pentágono"], ["hexagon", "hexágono"], ["heptagon", "heptágono"], ["octagon", "octágono"],
];
const nameOf = (/** @type {number} */ n, /** @type {string} */ lang) => NAMES[n][lang === "es" ? 1 : 0];

function drawPolygon(/** @type {PolyModel} */ m, /** @type {string} */ lang) {
  return (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w) => {
    const { n } = m;
    const r = Math.min(w / 2 - 6, 95);
    const vert = (/** @type {number} */ k) => {
      const t = Math.PI / 2 + Math.PI / n + (2 * Math.PI * k) / n;
      return [Math.cos(t), Math.sin(t)];
    };
    const ys = Array.from({ length: n }, (_, k) => vert(k)[1]);
    const top = Math.min(...ys);
    const cx = x + w / 2;
    const cy = y + 6 - top * r;
    const P2 = (/** @type {number} */ k) => [cx + vert(k % n)[0] * r, cy + vert(k % n)[1] * r];
    let svg = "";
    for (let k = 0; k < n; k++) {
      const [mx, my] = [(P2(k)[0] + P2(k + 1)[0]) / 2, (P2(k)[1] + P2(k + 1)[1]) / 2];
      const lx = cx + 0.55 * (mx - cx);
      const ly = cy + 0.55 * (my - cy);
      const last = k === n - 1;
      svg += `<g class="gm-piece" data-step="1" data-k="${k}">${poly([[cx, cy], P2(k), P2(k + 1)], { fill: last ? FILL.amber : FILL.teal, fo: last ? 0.7 : 0.3, sw: last ? 2.4 : 1.6 })}${last ? "" : T(lx, ly + 5, String(k + 2), { weight: 700, halo: true })}</g>`;
    }
    const baseY = cy + Math.cos(Math.PI / n) * r;
    svg += line(cx, cy, cx, baseY, { dash: "5 4" });
    svg += rightMark(cx, baseY, 1, 0, 0, -1, 9);
    svg += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="3.5" fill="${COLOR.ink}"/>`;
    svg += T(cx - 12, cy + (baseY - cy) * 0.55 + 5, "1", { weight: 700, halo: true });
    svg += T(cx + 8, cy + (baseY - cy) * 0.55 + 5, "a", { weight: 700, anchor: "start", halo: true });
    const bottom = baseY + 20;
    svg += T(cx, bottom, `${L(lang, "side", "lado")} ${m.side}`, { weight: 700 });
    return { svg, h: bottom + 6 - y };
  };
}

function drawTriangle(/** @type {PolyModel} */ m, /** @type {string} */ lang) {
  return (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w) => {
    const ratio = 1 / (2 * Math.tan(Math.PI / m.n));
    const wb = Math.min(w * 0.7, 150, 140 / ratio);
    const ht = wb * ratio;
    const cx = x + w / 2;
    const yt = y + 6;
    const yb = yt + ht;
    let svg = poly([[cx - wb / 2, yb], [cx + wb / 2, yb], [cx, yt]], { fill: FILL.amber, fo: 0.7, sw: 2.4 });
    svg += line(cx, yt, cx, yb, { dash: "5 4" });
    svg += rightMark(cx, yb, 1, 0, 0, -1, Math.min(9, ht / 3));
    svg += T(cx + 8, yt + ht / 2 + 5, `a ${m.apothem.sym} ${m.apothem.text}`, { weight: 700, anchor: "start", halo: true });
    svg += T(cx, yb + 19, `${L(lang, "side", "lado")} ${m.side}`, { weight: 700 });
    return { svg, h: ht + 32 };
  };
}

export const polygonFigure = {
  id: "area-polygon-triangles",
  keys: ["area:polygon", "area:apothem"],
  title: { en: "A regular polygon is made of congruent triangles", es: "Un polígono regular está hecho de triángulos congruentes" },
  controls(/** @type {string} */ key) {
    const two = [
      { label: "Number of equal sides", labelEs: "Número de lados iguales", min: 3, max: 8, step: 1 },
      { label: "Length of each side", labelEs: "Longitud de cada lado", min: 1, max: 12, step: 1 },
    ];
    return key === "area:polygon" ? [...two, { label: "Unused", labelEs: "Sin usar", min: 3, max: 3, step: 1 }] : two;
  },
  build(/** @type {string} */ key, /** @type {number[]} */ v) {
    const len = key === "area:polygon" ? 3 : 2;
    if (!Array.isArray(v) || v.length !== len) throw new RangeError("Wrong number of settings.");
    if (!Number.isInteger(v[0]) || v[0] < 3 || v[0] > 8) throw new RangeError("Use a whole number of sides from 3 to 8.");
    if (!Number.isInteger(v[1]) || v[1] < 1 || v[1] > 12) throw new RangeError("Use a side length from 1 to 12.");
    return polygonModel(v[0], v[1]);
  },
  render(/** @type {PolyModel} */ m, /** @type {{ lang: "en" | "es", width: number }} */ { lang, width }) {
    const { W, x, w } = frameOf(width);
    let y = 12;
    const c1 = card(x, y, w, 1, L(lang, `Cut the ${nameOf(m.n, lang)} from its center into ${m.n} congruent triangles`, `Corta el ${nameOf(m.n, lang)} desde su centro en ${m.n} triángulos congruentes`), [
      drawPolygon(m, lang),
      (px, py, pw) => P(px + pw / 2, py, L(lang, "Dashed line: the apothem a, from the center to the middle of a side, perpendicular to it.", "Línea punteada: el apotema a, del centro al punto medio de un lado, perpendicular a él."), pw, { size: 13, fill: COLOR.muted }),
    ]);
    y += c1.h + 12;
    const t = m.triangle;
    const c2 = card(x, y, w, 2, L(lang, "One triangle: the base is a side and the height is the apothem", "Un triángulo: la base es un lado y la altura es el apotema"), [
      drawTriangle(m, lang),
      (px, py, pw) => P(px + pw / 2, py, `${m.side} × ${m.apothem.text} ÷ 2 ${t.sym} ${t.text}`, pw, { weight: 700 }),
      (px, py, pw) => P(px + pw / 2, py, L(lang, `${m.n} triangles: ${m.n} × ${t.text} ${m.total.sym} ${m.total.text}`, `${m.n} triángulos: ${m.n} × ${t.text} ${m.total.sym} ${m.total.text}`), pw, { weight: 700 }),
    ]);
    y += c2.h + 12;
    const fin = stackBoxes(x, y, w, [
      (bx, by, bw) => answerBox(bx, by, bw, L(lang, `Area ${m.total.sym} ${m.total.text} ${SQ.en}`, `Área ${m.total.sym} ${m.total.text} ${SQ.es}`), 3),
      (bx, by, bw) => notBox(bx, by, bw, L(lang, `Not this: using the line from the center to a corner as the height gives ${m.n} × ${m.side} × that line ÷ 2 ≈ ${m.wrong.text}. That line is longer than the apothem.`, `No así: usar como altura la línea del centro a una esquina da ${m.n} × ${m.side} × esa línea ÷ 2 ≈ ${m.wrong.text}. Esa línea es más larga que el apotema.`), 3),
    ]);
    return { body: c1.svg + c2.svg + fin.svg, width: W, height: Math.ceil(fin.bottom + 14) };
  },
  headline: (/** @type {PolyModel} */ m, /** @type {string} */ lang) => ({ label: L(lang, "Area of the polygon", "Área del polígono"), value: m.total.text.replace(/,/g, ""), approx: m.total.sym === "≈" }),
  wrong: (/** @type {PolyModel} */ m, /** @type {string} */ lang) => ({ value: m.wrong.text.replace(/,/g, ""), say: L(lang, "Used the line from the center to a corner as the height.", "Usaste la línea del centro a una esquina como altura.") }),
  scene(/** @type {ParentNode} */ root, /** @type {PolyModel} */ m) {
    return sceneOf(root, 2, (win) =>
      all(root, ".gm-piece").map((el) => {
        const k = Number(el.getAttribute("data-k"));
        const w = sub(win(1), 0.3 + (0.55 * k) / m.n, 0.55 + (0.4 * k) / m.n);
        return { els: [el], from: w.from, to: w.to, keyframes: POP };
      }),
    );
  },
  describe(/** @type {PolyModel} */ m, /** @type {"en" | "es"} */ lang) {
    const es = lang === "es";
    const nm = nameOf(m.n, lang);
    return es
      ? `Un ${nm} regular con lados de ${m.side}, cortado desde su centro en ${m.n} triángulos congruentes. Cada triángulo tiene como base un lado, ${m.side}, y como altura el apotema, la línea punteada del centro al punto medio de un lado: apotema ${m.apothem.sym} ${m.apothem.text}. Un triángulo: ${m.side} × ${m.apothem.text} ÷ 2 ${m.triangle.sym} ${m.triangle.text}. Los ${m.n} triángulos: ${m.n} × ${m.triangle.text} ${m.total.sym} ${m.total.text}. Área ${m.total.sym} ${m.total.text} ${SQ.es}. No así: usar la línea del centro a una esquina como altura da ≈ ${m.wrong.text}, porque esa línea es más larga que el apotema.`
      : `A regular ${nm} with sides of ${m.side}, cut from its center into ${m.n} congruent triangles. Each triangle has a side, ${m.side}, as its base and the apothem as its height, the dashed line from the center to the middle of a side: apothem ${m.apothem.sym} ${m.apothem.text}. One triangle: ${m.side} × ${m.apothem.text} ÷ 2 ${m.triangle.sym} ${m.triangle.text}. All ${m.n} triangles: ${m.n} × ${m.triangle.text} ${m.total.sym} ${m.total.text}. Area ${m.total.sym} ${m.total.text} ${SQ.en}. Not this: using the line from the center to a corner as the height gives ≈ ${m.wrong.text}, because that line is longer than the apothem.`;
  },
};

export default [polygonFigure];
