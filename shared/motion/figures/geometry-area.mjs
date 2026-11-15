// Motion figures for the area lessons 5-1 to 5-4: a parallelogram cut and rearranged into a rectangle, a triangle doubled into a
// parallelogram, a trapezoid doubled into a parallelogram. Heights are dashed and perpendicular; the slanted side is never the height.
import { Rat } from "../exact.mjs";
import { COLOR } from "../tokens.mjs";
import {
  FILL, L, P, R, SQ, T, all, answerBox, card, dec, f1, frameOf, halfTurn, line, notBox, poly, rightMark, sceneOf, slideFrom, sqrtText, stackBoxes, sub, textW,
} from "./geometry-kit.mjs";

/** @param {unknown} values @param {Array<[number, number]>} spec */
function rangeCheck(values, spec) {
  if (!Array.isArray(values) || values.length !== spec.length) throw new RangeError("Wrong number of settings.");
  spec.forEach(([lo, hi], i) => {
    if (!Number.isInteger(values[i]) || values[i] < lo || values[i] > hi) throw new RangeError(`Use a whole number from ${lo} to ${hi}.`);
  });
}
const about = (/** @type {string} */ lang, /** @type {{ text: string, approx: boolean }} */ r) => (r.approx ? L(lang, "about ", "aprox. ") : "") + r.text;
const ht = (/** @type {number} */ x, /** @type {number} */ y, /** @type {string} */ s, /** @type {string} */ anchor = "start") => T(x, y, s, { weight: 700, anchor, halo: true });

// ============================================================================================================================
// area:parallelogram  (5-1)
// ============================================================================================================================

/** @param {number} b @param {number} h @param {number} s */
function paraModel(b, h, s) {
  const slabs = Math.max(1, Math.ceil(s / b));
  return {
    b, h, s, slabs,
    area: R(b * h),
    slant: sqrtText(new Rat(BigInt(h * h + s * s))),
    wrong: sqrtText(new Rat(BigInt(b * b * (h * h + s * s)))),
  };
}
/** @typedef {ReturnType<typeof paraModel>} ParaModel */

const paraScale = (/** @type {ParaModel} */ m, /** @type {number} */ w) => Math.min(w / (m.b + m.s), 150 / m.h, 30);

function paraDrawShape(/** @type {ParaModel} */ m, /** @type {string} */ lang) {
  return (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w) => {
    const { b, h, s } = m;
    const c = paraScale(m, w);
    const pw = (b + s) * c;
    const ph = h * c;
    const x0 = x + (w - pw) / 2;
    let top = 6;
    let label = "";
    if (s > 0) {
      const txt = `// ${L(lang, "slanted side", "lado inclinado")}: ${about(lang, m.slant)}`;
      const p = P(Math.max(x + Math.min(w, textW(txt, 14, true)), Math.min(x + w, x0 + pw)), y, txt, w, { weight: 700, anchor: "end" });
      label = p.svg;
      top = p.h + 6;
    }
    const yt = y + top;
    const yb = yt + ph;
    const foot = x0 + s * c;
    let svg = poly([[x0, yb], [x0 + b * c, yb], [x0 + pw, yt], [x0 + s * c, yt]], { fill: FILL.teal, fo: 0.35 });
    if (s > b) svg += line(x0 + b * c, yb, foot, yb, { dash: "5 4", sw: 1.6 });
    svg += line(foot, yt, foot, yb, { dash: "5 4" });
    svg += rightMark(foot, yb, s < b ? 1 : -1, 0, 0, -1, Math.min(10, ph / 3));
    if (s > 0) {
      const ex = s * c;
      const ey = -ph;
      const len = Math.hypot(ex, ey);
      const nx = ey / len;
      const ny = -ex / len;
      for (const t of [0.46, 0.54]) {
        const px = x0 + b * c + ex * t;
        const py = yb + ey * t;
        svg += line(px - nx * 6, py - ny * 6, px + nx * 6, py + ny * 6, { sw: 2 });
      }
    }
    const right = b >= s;
    svg += ht(right ? foot + 8 : foot - 8, yt + ph / 2 + 5, `h = ${h}`, right ? "start" : "end");
    svg += T(x0 + (b * c) / 2, yb + 19, `${L(lang, "base", "base")} ${b}`, { weight: 700 });
    return { svg: label + svg, h: top + ph + 26 };
  };
}

function paraDrawRect(/** @type {ParaModel} */ m, /** @type {string} */ lang) {
  return (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w) => {
    const { b, h, s, slabs } = m;
    const c = paraScale(m, w);
    const ph = h * c;
    const x0 = x + (w - b * c) / 2;
    const yb = y + 6 + ph;
    const hs = h / slabs;
    const sig = s / slabs;
    let svg = "";
    for (let i = 0; i < slabs; i++) {
      const bot = yb - i * hs * c;
      const tp = yb - (i + 1) * hs * c;
      const sh = (s * (i + 1)) / slabs;
      const X = (/** @type {number} */ wx) => x0 + wx * c;
      const dxBody = -(s * c) / 2 + c * sh;
      svg += `<g class="gm-piece" data-step="2" data-slab="${i}" data-dx="${f1(dxBody)}">${poly([[X(0), bot], [X(b - sig), bot], [X(b), tp], [X(0), tp]], { fill: FILL.teal, fo: 0.35, sw: 1.6 })}</g>`;
      if (s > 0) {
        const dxTri = -(s * c) / 2 - c * (b - sh);
        svg += `<g class="gm-piece" data-step="2" data-slab="${i}" data-dx="${f1(dxTri)}">${poly([[X(b - sig), bot], [X(b), bot], [X(b), tp]], { fill: FILL.amber, fo: 0.7, sw: 1.6, dash: "4 3" })}</g>`;
      }
    }
    svg += T(x0 + (b * c) / 2, yb - ph / 2 + 5, `${b} × ${h}`, { weight: 700, halo: true });
    svg += T(x0 + (b * c) / 2, yb + 19, `${L(lang, "base", "base")} ${b}`, { weight: 700 });
    return { svg, h: ph + 26 };
  };
}

export const parallelogramFigure = {
  id: "area-parallelogram-rectangle",
  keys: ["area:parallelogram"],
  title: { en: "Cut and slide a parallelogram into a rectangle", es: "Corta y desliza un paralelogramo hasta formar un rectángulo" },
  controls: () => [
    { label: "Base length", labelEs: "Medida de la base", min: 4, max: 12, step: 1 },
    { label: "Perpendicular height", labelEs: "Altura perpendicular", min: 2, max: 9, step: 1 },
    { label: "Horizontal shift", labelEs: "Desplazamiento horizontal", min: 0, max: 15, step: 1 },
  ],
  build(/** @type {string} */ _key, /** @type {number[]} */ v) {
    rangeCheck(v, [[4, 12], [2, 9], [0, 15]]);
    return paraModel(v[0], v[1], v[2]);
  },
  render(/** @type {ParaModel} */ m, /** @type {{ lang: "en" | "es", width: number }} */ { lang, width }) {
    const { W, x, w } = frameOf(width);
    let y = 12;
    const c1 = card(x, y, w, 1, L(lang, "The height is perpendicular to the base, not along the slanted side", "La altura es perpendicular a la base, no va por el lado inclinado"), [
      paraDrawShape(m, lang),
      (px, py, pw) => P(px + pw / 2, py, L(lang, "Dashed line: the perpendicular height h.", "Línea punteada: la altura perpendicular h."), pw, { size: 13, fill: COLOR.muted }),
    ]);
    y += c1.h + 12;
    const title2 = m.s === 0
      ? L(lang, "No shift, so it is already a rectangle", "Sin desplazamiento, ya es un rectángulo")
      : m.slabs === 1
        ? L(lang, "Cut off the triangle on the left and slide it to the right side", "Corta el triángulo de la izquierda y deslízalo al lado derecho")
        : L(lang, `Cut ${m.slabs} slabs. In each, slide the triangle across`, `Corta ${m.slabs} tiras. En cada una, desliza el triángulo al otro lado`);
    const c2 = card(x, y, w, 2, title2, [
      paraDrawRect(m, lang),
      (px, py, pw) => P(px + pw / 2, py, m.s === 0 ? L(lang, `Base ${m.b}, height ${m.h}.`, `Base ${m.b}, altura ${m.h}.`) : L(lang, `Dashed outline: ${m.slabs === 1 ? "the piece" : "the pieces"} that moved. Base ${m.b}, height ${m.h}.`, `Contorno punteado: ${m.slabs === 1 ? "la pieza que se movió" : "las piezas que se movieron"}. Base ${m.b}, altura ${m.h}.`), pw, { size: 13, fill: COLOR.muted }),
    ]);
    y += c2.h + 12;
    const area = dec(m.area);
    const boxes = [(/** @type {number} */ bx, /** @type {number} */ by, /** @type {number} */ bw) => answerBox(bx, by, bw, L(lang, `Area = ${m.b} × ${m.h} = ${area} ${SQ.en}`, `Área = ${m.b} × ${m.h} = ${area} ${SQ.es}`), 3)];
    if (m.s > 0) {
      const prod = m.wrong.approx ? `${m.b} × ${L(lang, "slanted side ≈", "lado inclinado ≈")} ${m.wrong.text}` : `${m.b} × ${m.slant.text} = ${m.wrong.text}`;
      boxes.push((bx, by, bw) => notBox(bx, by, bw, L(lang, `Not this: ${prod}. The slanted side is longer than the height, so that is too big.`, `No así: ${prod}. El lado inclinado es más largo que la altura, así que da un número demasiado grande.`), 3));
    }
    const fin = stackBoxes(x, y, w, boxes);
    return { body: c1.svg + c2.svg + fin.svg, width: W, height: Math.ceil(fin.bottom + 14) };
  },
  scene(/** @type {ParentNode} */ root, /** @type {ParaModel} */ _m) {
    return sceneOf(root, 2, (win) =>
      all(root, ".gm-piece").map((el) => {
        const i = Number(el.getAttribute("data-slab"));
        const w2 = sub(win(2), 0.35 + 0.1 * i, 0.9);
        return { els: [el], from: w2.from, to: Math.max(w2.from, w2.to), keyframes: slideFrom(Number(el.getAttribute("data-dx")), 0) };
      }),
    );
  },
  describe(/** @type {ParaModel} */ m, /** @type {"en" | "es"} */ lang) {
    const es = lang === "es";
    const parts = [
      es ? `Un paralelogramo con base ${m.b} y altura perpendicular ${m.h}. La altura es la línea punteada, perpendicular a la base.` : `A parallelogram with base ${m.b} and perpendicular height ${m.h}. The height is the dashed line, perpendicular to the base.`,
    ];
    if (m.s === 0) parts.push(es ? "No hay desplazamiento, así que ya es un rectángulo." : "There is no shift, so it is already a rectangle.");
    else {
      parts.push(es ? `El lado inclinado mide ${about(lang, m.slant)}.` : `The slanted side measures ${about(lang, m.slant)}.`);
      parts.push(es ? `Se corta ${m.slabs === 1 ? "un triángulo" : `en ${m.slabs} tiras, y en cada una un triángulo`} y se desliza al otro lado para formar un rectángulo.` : `${m.slabs === 1 ? "A triangle is cut off" : `It is cut into ${m.slabs} slabs and a triangle is cut off each`} and slid to the other side to make a rectangle.`);
    }
    parts.push(es ? `El rectángulo tiene base ${m.b} y altura ${m.h}: área = ${m.b} × ${m.h} = ${dec(m.area)} ${SQ.es}.` : `The rectangle has base ${m.b} and height ${m.h}: area = ${m.b} × ${m.h} = ${dec(m.area)} ${SQ.en}.`);
    if (m.s > 0) parts.push(es ? `No así: usar el lado inclinado como altura, ${m.b} × lado inclinado ${m.wrong.approx ? "≈" : "="} ${m.wrong.text}, da un número demasiado grande.` : `Not this: using the slanted side as the height, ${m.b} × slanted side ${m.wrong.approx ? "≈" : "="} ${m.wrong.text}, is too big.`);
    return parts.join(" ");
  },
};

// ============================================================================================================================
// area:triangle  (5-1, 5-2)
// ============================================================================================================================

/** @param {number} b @param {number} h */
function triModel(b, h) {
  return {
    b, h,
    twice: R(b * h),
    area: new Rat(BigInt(b * h), 2n),
    wrong: sqrtText(new Rat(BigInt(b * b * (b * b + 4 * h * h)), 16n)),
  };
}
/** @typedef {ReturnType<typeof triModel>} TriModel */

const triScale = (/** @type {TriModel} */ m, /** @type {number} */ w) => Math.min(w / (1.5 * m.b), 150 / m.h, 30);

function triDraw(/** @type {TriModel} */ m, /** @type {string} */ lang, /** @type {boolean} */ doubled) {
  return (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w) => {
    const { b, h } = m;
    const c = triScale(m, w);
    const ww = (doubled ? 1.5 : 1) * b;
    const x0 = x + (w - ww * c) / 2;
    const yt = y + 6;
    const yb = yt + h * c;
    const X = (/** @type {number} */ wx) => x0 + wx * c;
    const Y = (/** @type {number} */ wy) => yb - wy * c;
    const A = [X(0), Y(0)];
    const B = [X(b), Y(0)];
    const C = [X(b / 2), Y(h)];
    let svg = poly([A, B, C], { fill: FILL.teal, fo: 0.35 });
    if (doubled) {
      const A2 = [X(1.5 * b), Y(h)];
      svg += `<g class="gm-piece" data-step="2" data-px="${f1(X(0.75 * b))}" data-py="${f1(Y(h / 2))}">${poly([A2, C, B], { fill: FILL.amber, fo: 0.7, dash: "5 3" })}</g>`;
    }
    svg += line(C[0], C[1], C[0], B[1], { dash: "5 4" });
    svg += rightMark(C[0], B[1], 1, 0, 0, -1, Math.min(10, (h * c) / 3));
    svg += ht(C[0] + 8, yt + (h * c) / 2 + 5, `h = ${h}`);
    svg += T(x0 + (b * c) / 2, yb + 19, `${L(lang, "base", "base")} ${b}`, { weight: 700 });
    return { svg, h: 6 + h * c + 26 };
  };
}

export const triangleFigure = {
  id: "area-triangle-half",
  keys: ["area:triangle"],
  title: { en: "Two triangles make a parallelogram, so one is half", es: "Dos triángulos forman un paralelogramo, así que uno es la mitad" },
  controls: () => [
    { label: "Base length", labelEs: "Medida de la base", min: 1, max: 12, step: 1 },
    { label: "Perpendicular height", labelEs: "Altura perpendicular", min: 1, max: 12, step: 1 },
    { label: "Unused", labelEs: "Sin usar", min: 4, max: 4, step: 1 },
  ],
  build(/** @type {string} */ _key, /** @type {number[]} */ v) {
    rangeCheck(v, [[1, 12], [1, 12], [4, 4]]);
    return triModel(v[0], v[1]);
  },
  render(/** @type {TriModel} */ m, /** @type {{ lang: "en" | "es", width: number }} */ { lang, width }) {
    const { W, x, w } = frameOf(width);
    let y = 12;
    const c1 = card(x, y, w, 1, L(lang, "A triangle: the height is the dashed perpendicular line", "Un triángulo: la altura es la línea punteada perpendicular"), [triDraw(m, lang, false)]);
    y += c1.h + 12;
    const c2 = card(x, y, w, 2, L(lang, "Turn a copy upside down: two triangles make a parallelogram", "Gira una copia: dos triángulos forman un paralelogramo"), [
      triDraw(m, lang, true),
      (px, py, pw) => P(px + pw / 2, py, L(lang, `2 triangles: ${m.b} × ${m.h} = ${dec(m.twice)}. The turned copy has a dashed outline.`, `2 triángulos: ${m.b} × ${m.h} = ${dec(m.twice)}. La copia girada tiene contorno punteado.`), pw, { size: 14, weight: 700 }),
    ]);
    y += c2.h + 12;
    const area = dec(m.area);
    const wrongEq = `${m.b} × ${L(lang, "slanted side", "lado inclinado")} ÷ 2 ${m.wrong.approx ? "≈" : "="} ${m.wrong.text}`;
    const fin = stackBoxes(x, y, w, [
      (bx, by, bw) => answerBox(bx, by, bw, L(lang, `One triangle is half: Area = ${m.b} × ${m.h} ÷ 2 = ${area} ${SQ.en}`, `Un triángulo es la mitad: Área = ${m.b} × ${m.h} ÷ 2 = ${area} ${SQ.es}`), 3),
      (bx, by, bw) => notBox(bx, by, bw, L(lang, `Not this: ${m.b} × ${m.h} = ${dec(m.twice)} is two triangles, the whole parallelogram.`, `No así: ${m.b} × ${m.h} = ${dec(m.twice)} son dos triángulos, todo el paralelogramo.`), 3),
      (bx, by, bw) => notBox(bx, by, bw, L(lang, `Not this: ${wrongEq}. A slanted side is not the height.`, `No así: ${wrongEq}. Un lado inclinado no es la altura.`), 3),
    ]);
    return { body: c1.svg + c2.svg + fin.svg, width: W, height: Math.ceil(fin.bottom + 14) };
  },
  scene(/** @type {ParentNode} */ root, /** @type {TriModel} */ _m) {
    return sceneOf(root, 2, (win) =>
      all(root, ".gm-piece").map((el) => {
        const w2 = sub(win(2), 0.3, 0.9);
        return { els: [el], from: w2.from, to: w2.to, keyframes: halfTurn(Number(el.getAttribute("data-px")), Number(el.getAttribute("data-py"))) };
      }),
    );
  },
  describe(/** @type {TriModel} */ m, /** @type {"en" | "es"} */ lang) {
    const es = lang === "es";
    return es
      ? `Un triángulo con base ${m.b} y altura perpendicular ${m.h}, la línea punteada. Al girar una copia y unirla, dos triángulos forman un paralelogramo de base ${m.b} y altura ${m.h}, con área ${m.b} × ${m.h} = ${dec(m.twice)}. Un triángulo es la mitad: ${m.b} × ${m.h} ÷ 2 = ${dec(m.area)} ${SQ.es}. No así: ${m.b} × ${m.h} = ${dec(m.twice)} es el paralelogramo entero. Tampoco sirve usar un lado inclinado como altura: ${m.b} × lado inclinado ÷ 2 ${m.wrong.approx ? "≈" : "="} ${m.wrong.text}.`
      : `A triangle with base ${m.b} and perpendicular height ${m.h}, the dashed line. Turning a copy upside down and joining it makes a parallelogram with base ${m.b} and height ${m.h}, area ${m.b} × ${m.h} = ${dec(m.twice)}. One triangle is half: ${m.b} × ${m.h} ÷ 2 = ${dec(m.area)} ${SQ.en}. Not this: ${m.b} × ${m.h} = ${dec(m.twice)} is the whole parallelogram. A slanted side is not the height either: ${m.b} × slanted side ÷ 2 ${m.wrong.approx ? "≈" : "="} ${m.wrong.text}.`;
  },
};

// ============================================================================================================================
// area:trapezoid  (5-3, 5-4)
// ============================================================================================================================

/** @param {number} b1 @param {number} b2 @param {number} h */
function trapModel(b1, b2, h) {
  const sum = b1 + b2;
  return {
    b1, b2, h, sum,
    twice: R(sum * h),
    area: new Rat(BigInt(sum * h), 2n),
    average: new Rat(BigInt(sum), 2n),
    leg: b1 !== b2,
    wrong: sqrtText(new Rat(BigInt(sum * sum * ((b1 - b2) ** 2 + 4 * h * h)), 16n)),
  };
}
/** @typedef {ReturnType<typeof trapModel>} TrapModel */

const trapScale = (/** @type {TrapModel} */ m, /** @type {number} */ w) => Math.min(w / (m.sum + Math.abs(m.b1 - m.b2) / 2), 150 / m.h, 30);

function trapDraw(/** @type {TrapModel} */ m, /** @type {string} */ lang, /** @type {boolean} */ doubled) {
  return (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w) => {
    const { b1, b2, h } = m;
    const c = trapScale(m, w);
    const t0 = (b1 - b2) / 2;
    const xmin = Math.min(0, t0);
    const span = doubled ? m.sum + Math.abs(t0) : Math.max(b1, b2);
    const x0 = x + (w - span * c) / 2 - xmin * c;
    const top = 22;
    const yb = y + top + h * c;
    const X = (/** @type {number} */ wx) => x0 + wx * c;
    const Y = (/** @type {number} */ wy) => yb - wy * c;
    const A = [X(0), Y(0)];
    const B = [X(b1), Y(0)];
    const C = [X(t0 + b2), Y(h)];
    const D = [X(t0), Y(h)];
    let svg = poly([A, B, C, D], { fill: FILL.teal, fo: 0.35 });
    if (doubled) {
      const Mx = (3 * b1 + b2) / 4;
      const copy = [[X(b1 + b2), Y(0)], B, C, [X(b1 + t0 + b2), Y(h)]];
      svg += `<g class="gm-piece" data-step="2" data-px="${f1(X(Mx))}" data-py="${f1(Y(h / 2))}">${poly([copy[3], C, B, copy[0]], { fill: FILL.amber, fo: 0.7, dash: "5 3" })}</g>`;
      svg += T(X((b1 + b2) / 2), yb + 19, `${b1} + ${b2} = ${m.sum}`, { weight: 700 });
    } else {
      svg += T(X(t0 + b2 / 2), y + 16, `${L(lang, "base", "base")} ${b2}`, { weight: 700 });
      svg += T(X(b1 / 2), yb + 19, `${L(lang, "base", "base")} ${b1}`, { weight: 700 });
    }
    const fx = X(b1 / 2);
    svg += line(fx, Y(h), fx, Y(0), { dash: "5 4" });
    svg += rightMark(fx, Y(0), 1, 0, 0, -1, Math.min(10, (h * c) / 3));
    // a very flat shape has no room for the label beside the dashed line, so it moves out past the base label
    const flat = !doubled && h * c < 36;
    svg += ht(flat ? X(t0 + b2 / 2) + textW(`${L(lang, "base", "base")} ${b2}`, 14, true) / 2 + 12 : fx + 8, flat ? y + 16 : y + top + (h * c) / 2 + 5, `h = ${h}`);
    return { svg, h: top + h * c + 26 };
  };
}

export const trapezoidFigure = {
  id: "area-trapezoid-double",
  keys: ["area:trapezoid"],
  title: { en: "Two trapezoids make a parallelogram, so one is half", es: "Dos trapecios forman un paralelogramo, así que uno es la mitad" },
  controls: () => [
    { label: "First parallel base", labelEs: "Primera base paralela", min: 1, max: 12, step: 1 },
    { label: "Second parallel base", labelEs: "Segunda base paralela", min: 1, max: 12, step: 1 },
    { label: "Perpendicular height", labelEs: "Altura perpendicular", min: 1, max: 12, step: 1 },
  ],
  build(/** @type {string} */ _key, /** @type {number[]} */ v) {
    rangeCheck(v, [[1, 12], [1, 12], [1, 12]]);
    return trapModel(v[0], v[1], v[2]);
  },
  render(/** @type {TrapModel} */ m, /** @type {{ lang: "en" | "es", width: number }} */ { lang, width }) {
    const { W, x, w } = frameOf(width);
    let y = 12;
    const c1 = card(x, y, w, 1, L(lang, "A trapezoid: two parallel bases and a perpendicular height", "Un trapecio: dos bases paralelas y una altura perpendicular"), [trapDraw(m, lang, false)]);
    y += c1.h + 12;
    const c2 = card(x, y, w, 2, L(lang, "Turn a copy upside down: two trapezoids make a parallelogram", "Gira una copia: dos trapecios forman un paralelogramo"), [
      trapDraw(m, lang, true),
      (px, py, pw) => P(px + pw / 2, py, L(lang, `2 trapezoids: (${m.b1} + ${m.b2}) × ${m.h} = ${dec(m.twice)}. The turned copy has a dashed outline.`, `2 trapecios: (${m.b1} + ${m.b2}) × ${m.h} = ${dec(m.twice)}. La copia girada tiene contorno punteado.`), pw, { size: 14, weight: 700 }),
    ]);
    y += c2.h + 12;
    const area = dec(m.area);
    const avg = dec(m.average);
    const wrongEq = `${dec(m.average)} × ${L(lang, "slanted side", "lado inclinado")} ${m.wrong.approx ? "≈" : "="} ${m.wrong.text}`;
    /** @type {Array<(x: number, y: number, w: number) => { svg: string, h: number }>} */
    const boxes = [
      (bx, by, bw) => answerBox(bx, by, bw, L(lang, `One trapezoid is half: Area = (${m.b1} + ${m.b2}) × ${m.h} ÷ 2 = ${area} ${SQ.en}. Same as the average base ${avg} × ${m.h}.`, `Un trapecio es la mitad: Área = (${m.b1} + ${m.b2}) × ${m.h} ÷ 2 = ${area} ${SQ.es}. Es igual a la base promedio ${avg} × ${m.h}.`), 3),
      (bx, by, bw) => notBox(bx, by, bw, L(lang, `Not this: (${m.b1} + ${m.b2}) × ${m.h} = ${dec(m.twice)} is two trapezoids. Divide by 2.`, `No así: (${m.b1} + ${m.b2}) × ${m.h} = ${dec(m.twice)} son dos trapecios. Divide entre 2.`), 3),
    ];
    if (m.leg) boxes.push((bx, by, bw) => notBox(bx, by, bw, L(lang, `Not this: ${wrongEq}. A slanted leg is not the height.`, `No así: ${wrongEq}. Un lado inclinado no es la altura.`), 3));
    const fin = stackBoxes(x, y, w, boxes);
    return { body: c1.svg + c2.svg + fin.svg, width: W, height: Math.ceil(fin.bottom + 14) };
  },
  scene(/** @type {ParentNode} */ root, /** @type {TrapModel} */ _m) {
    return sceneOf(root, 2, (win) =>
      all(root, ".gm-piece").map((el) => {
        const w2 = sub(win(2), 0.3, 0.9);
        return { els: [el], from: w2.from, to: w2.to, keyframes: halfTurn(Number(el.getAttribute("data-px")), Number(el.getAttribute("data-py"))) };
      }),
    );
  },
  describe(/** @type {TrapModel} */ m, /** @type {"en" | "es"} */ lang) {
    const es = lang === "es";
    const leg = m.leg ? (es ? ` Tampoco sirve usar un lado inclinado como altura: ${dec(m.average)} × lado inclinado ${m.wrong.approx ? "≈" : "="} ${m.wrong.text}.` : ` A slanted leg is not the height either: ${dec(m.average)} × slanted leg ${m.wrong.approx ? "≈" : "="} ${m.wrong.text}.`) : "";
    return es
      ? `Un trapecio con bases paralelas ${m.b1} y ${m.b2} y altura perpendicular ${m.h}, la línea punteada. Al girar una copia y unirla, dos trapecios forman un paralelogramo con base ${m.b1} + ${m.b2} = ${m.sum} y altura ${m.h}, con área (${m.b1} + ${m.b2}) × ${m.h} = ${dec(m.twice)}. Un trapecio es la mitad: ${dec(m.area)} ${SQ.es}. Es igual a la base promedio ${dec(m.average)} por la altura ${m.h}. No así: (${m.b1} + ${m.b2}) × ${m.h} = ${dec(m.twice)} son dos trapecios.${leg}`
      : `A trapezoid with parallel bases ${m.b1} and ${m.b2} and perpendicular height ${m.h}, the dashed line. Turning a copy upside down and joining it makes a parallelogram with base ${m.b1} + ${m.b2} = ${m.sum} and height ${m.h}, area (${m.b1} + ${m.b2}) × ${m.h} = ${dec(m.twice)}. One trapezoid is half: ${dec(m.area)} ${SQ.en}. That equals the average base ${dec(m.average)} times the height ${m.h}. Not this: (${m.b1} + ${m.b2}) × ${m.h} = ${dec(m.twice)} is two trapezoids.${leg}`;
  },
};

export default [parallelogramFigure, triangleFigure, trapezoidFigure];
