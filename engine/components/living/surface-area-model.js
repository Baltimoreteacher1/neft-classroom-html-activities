// living/surface-area-model.js — the mathematics and the words of the surface-area play.
//
// Pure functions only (no DOM). Two modes share one stage of net faces:
//   "prism"   — a rectangular prism (opposite faces match: 2lw + 2lh + 2wh), then
//               a triangular prism (5 faces: 2 triangles + 3 rectangles)
//   "pyramid" — a square pyramid (base + four triangles that use the SLANT height)
// Every area a scene states is computed here from the config; surface-area.test.mjs
// recomputes them independently.

import {
  boxArea,
  boxChoices,
  boxPairs,
  okInt,
  placeCorrect,
  rectPrism,
  unitSet,
} from "./net-fold-model.js";

export { boxArea, boxChoices, boxPairs, placeCorrect };

const N = (en, es) => ({ en, es });
const both = (f) => ({ en: f("en"), es: f("es") });

// ---- the numbers ----------------------------------------------------------------

/** Triangular prism: two triangle ends (base b, height hg) + rectangles b·len, s·len, s·len. */
export const triPrismArea = (b, hg, s, len) => b * hg + (b + 2 * s) * len;
export const pyramidArea = (b, sl) => b * b + 2 * b * sl;

const distinct = (list) => (new Set(list.map((o) => o.value)).size === list.length ? list : null);

/** Four choices for a triangular prism: the total and three real slips; null when two coincide. */
export function triPrismChoices(b, hg, s, len) {
  const rects = (b + 2 * s) * len;
  return distinct([
    { kind: "total", value: triPrismArea(b, hg, s, len), correct: true },
    { kind: "rects", value: rects },
    { kind: "oneTriangle", value: rects + (b * hg) / 2 },
    { kind: "noHalf", value: rects + 2 * b * hg },
  ]);
}

/** Four choices for a square pyramid: the total and three real slips; null when two coincide. */
export function pyramidChoices(b, sl) {
  return distinct([
    { kind: "total", value: pyramidArea(b, sl), correct: true },
    { kind: "noBase", value: 2 * b * sl },
    { kind: "noHalf", value: b * b + 4 * b * sl },
    { kind: "oneFace", value: b * b + (b * sl) / 2 },
  ]);
}

/** Face-size choices for a box (predict): 1, 2, 3 or 6 different sizes; 3 is right. */
export const sizeChoices = [
  { kind: "one", value: 1 },
  { kind: "two", value: 2 },
  { kind: "three", value: 3, correct: true },
  { kind: "all", value: 6 },
];

/** The three candidate lengths for "½ × base × ___" in a pyramid face. */
export const lengthChoices = (b, sl) => [
  { kind: "slant", value: sl, correct: true },
  { kind: "base", value: b },
  { kind: "height", value: null },
];

// ---- validation ------------------------------------------------------------------

function validBox(c) {
  const l = Number(c?.l);
  const w = Number(c?.w);
  const h = Number(c?.h);
  if (![l, w, h].every((x) => okInt(x, 1, 10)) || l === w || w === h || l === h) return null;
  return boxChoices(l, w, h) ? { l, w, h } : null;
}

function validTri(c) {
  const b = Number(c?.b);
  const hg = Number(c?.hg);
  const s = Number(c?.s);
  const len = Number(c?.len);
  if (!okInt(b, 2, 12) || b % 2 || !okInt(hg, 1, 12) || !okInt(s, 1, 14) || !okInt(len, 1, 14))
    return null;
  // the ends are isosceles: each slanted side is the hypotenuse over half the base and the height
  if (s * s !== (b / 2) ** 2 + hg * hg || !triPrismChoices(b, hg, s, len)) return null;
  return { b, hg, s, len };
}

function validPyramid(c) {
  const b = Number(c?.b);
  const sl = Number(c?.sl);
  if (!okInt(b, 2, 12) || b % 2 || !okInt(sl, b / 2 + 1, 14)) return null;
  return pyramidChoices(b, sl) ? { b, sl } : null;
}

/** Validated config, or null when the stage cannot draw the solid correctly. */
export function validateSurfaceArea(cfg) {
  const unit = unitSet(cfg?.unit ?? "units");
  if (!unit) return null;
  if (cfg?.mode === "prism") {
    const main = validBox(cfg);
    const tri = cfg.transfer == null ? { b: 6, hg: 4, s: 5, len: 10 } : validTri(cfg.transfer);
    const tUnit = unitSet(cfg.transfer?.unit ?? cfg.unit ?? "units");
    if (!main || !tri || !tUnit) return null;
    return { mode: "prism", ...main, unit, tri, triUnit: tUnit, hMax: Math.max(6, main.h + 2) };
  }
  if (cfg?.mode === "pyramid") {
    const main = validPyramid(cfg);
    if (!main) return null;
    const dflt = main.b === 4 && main.sl === 5 ? { b: 6, sl: 8 } : { b: 4, sl: 5 };
    const tr = cfg.transfer == null ? dflt : validPyramid(cfg.transfer);
    if (!tr || (tr.b === main.b && tr.sl === main.sl)) return null;
    const lo = main.b / 2 + 1;
    return { mode: "pyramid", ...main, unit, tr, slMin: lo, slMax: Math.min(14, main.sl + 4) };
  }
  return null;
}

// ---- the words -------------------------------------------------------------------

const KICK = N("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo");

/** Every sentence of the prism mode. `name(id)` gives a face's {en, es} name. */
function prismCopy(v, name) {
  const { l, w, h, unit: u, tri, triUnit: tu } = v;
  const pr = boxPairs(l, w, h);
  const SA = boxArea(l, w, h);
  const [a, b2, c] = pr.map((p) => p.area);
  const size = both((g) => `${l} ${u.len[g]} × ${w} ${u.len[g]} × ${h} ${u.len[g]}`);
  const T = triPrismArea(tri.b, tri.hg, tri.s, tri.len);
  const half = (tri.b * tri.hg) / 2;
  const tSq = (n, g) => `${n} ${tu.sq[g]}`;
  const sums = (x, y, z) => `${2 * x} + ${2 * y} + ${2 * z}`;
  return {
    kicker: KICK,
    title: N("Every face of a prism", "Todas las caras de un prisma"),
    ariaLabel: {
      en: `A rectangular prism ${l} by ${w} by ${h} ${u.len.en} opened into a net of six faces in three matching pairs, then a triangular prism net with five faces.`,
      es: `Un prisma rectangular de ${l} por ${w} por ${h} ${u.len.es} abierto en una plantilla de seis caras en tres pares iguales, y luego la plantilla de un prisma triangular con cinco caras.`,
    },
    printSummary: {
      en: `A rectangular prism ${l} × ${w} × ${h} ${u.len.en} has 6 faces in 3 matching pairs: 2(${l} × ${w}) + 2(${l} × ${h}) + 2(${w} × ${h}) = ${sums(a, b2, c)} = ${SA} ${u.sq.en}. A triangular prism has 5 faces: 2 triangles and 3 rectangles. With triangle base ${tri.b}, height ${tri.hg}, slanted sides ${tri.s} and length ${tri.len}: 2 × ${half} + ${tri.b * tri.len} + ${tri.s * tri.len} + ${tri.s * tri.len} = ${tSq(T, "en")}.`,
      es: `Un prisma rectangular de ${l} × ${w} × ${h} ${u.len.es} tiene 6 caras en 3 pares iguales: 2(${l} × ${w}) + 2(${l} × ${h}) + 2(${w} × ${h}) = ${sums(a, b2, c)} = ${SA} ${u.sq.es}. Un prisma triangular tiene 5 caras: 2 triángulos y 3 rectángulos. Con base del triángulo ${tri.b}, altura ${tri.hg}, lados inclinados ${tri.s} y largo ${tri.len}: 2 × ${half} + ${tri.b * tri.len} + ${tri.s * tri.len} + ${tri.s * tri.len} = ${tSq(T, "es")}.`,
    },
    scene: {
      net: N("The net", "La plantilla"),
      predict: N("Predict", "Predice"),
      pairs: N("Find the pairs", "Halla los pares"),
      formula: N("The formula", "La fórmula"),
      what: N("What if?", "¿Y si…?"),
      transfer: N("A new prism", "Un prisma nuevo"),
    },
    size,
    netSay: {
      en: `A rectangular prism, ${size.en}, opened into a net. Surface area is the total area of all its faces, so every face in the net counts once.`,
      es: `Un prisma rectangular, ${size.es}, abierto en una plantilla. El área de superficie es el área total de todas sus caras, así que cada cara de la plantilla cuenta una vez.`,
    },
    predictSay: {
      en: "Look at the six faces and their measurements. Some faces are the same size as others.",
      es: "Mira las seis caras y sus medidas. Algunas caras tienen el mismo tamaño que otras.",
    },
    predictQ: {
      en: "How many different face sizes does this prism have?",
      es: "¿Cuántos tamaños de cara diferentes tiene este prisma?",
    },
    predictCue: (kind) =>
      ({
        all: both((g) =>
          g === "en"
            ? `Not every face is different. The two outlined faces, Top and Bottom, are both ${l} × ${w}. Are there other matching pairs?`
            : `No todas las caras son diferentes. Las dos caras marcadas, Arriba y Abajo, miden ${l} × ${w}. ¿Hay otros pares iguales?`,
        ),
        one: both((g) =>
          g === "en"
            ? `That would be a cube. Top is ${l} × ${w} and Front is ${l} × ${h}. Are those the same size?`
            : `Eso sería un cubo. Arriba mide ${l} × ${w} y Frente mide ${l} × ${h}. ¿Tienen el mismo tamaño?`,
        ),
        two: both((g) =>
          g === "en"
            ? `Top and Bottom match, and Front and Back match. Compare Right, ${w} × ${h}, with those two. Is it the same size as either one?`
            : `Arriba y Abajo son iguales, y Frente y Atrás son iguales. Compara Derecha, ${w} × ${h}, con esas dos. ¿Tiene el mismo tamaño que alguna?`,
        ),
      })[kind],
    predictOk: {
      en: "Yes: 3 sizes. Opposite faces are the same size, so the box has 3 matching pairs: Top and Bottom, Front and Back, Left and Right.",
      es: "Sí: 3 tamaños. Las caras opuestas tienen el mismo tamaño, así que la caja tiene 3 pares iguales: Arriba y Abajo, Frente y Atrás, Izquierda y Derecha.",
    },
    pairsSay: {
      en: "Tap a face in the net, or choose it below. It and its matching face light up, and you see their area. Find all three pairs.",
      es: "Toca una cara de la plantilla, o elígela abajo. Ella y su cara igual se iluminan y ves su área. Halla los tres pares.",
    },
    pairPick: (id, twin) => {
      const f = pr.find((p) => p.ids.includes(id));
      return both((g) =>
        g === "en"
          ? `${name(id).en} is ${f.a[0]} × ${f.a[1]} = ${f.area} ${u.sq.en}. ${name(twin).en} matches it, so it is also ${f.area}.`
          : `${name(id).es} mide ${f.a[0]} × ${f.a[1]} = ${f.area} ${u.sq.es}. ${name(twin).es} es igual, así que también mide ${f.area}.`,
      );
    },
    pairsLeft: (n) => ({
      en: `Pairs found: ${n} of 3. Find another pair.`,
      es: `Pares hallados: ${n} de 3. Halla otro par.`,
    }),
    pairsDone: {
      en: `All three pairs found: ${a}, ${b2} and ${c}. Every pair counts twice, because there are two matching faces.`,
      es: `Los tres pares hallados: ${a}, ${b2} y ${c}. Cada par cuenta dos veces, porque hay dos caras iguales.`,
    },
    formulaSay: {
      en: "Each pair counts twice, so surface area = 2lw + 2lh + 2wh: the top and bottom, the front and back, the left and right.",
      es: "Cada par cuenta dos veces, así que área de superficie = 2lw + 2lh + 2wh: arriba y abajo, frente y atrás, izquierda y derecha.",
    },
    formulaExpr: both(
      (g) =>
        `2(${l} × ${w}) + 2(${l} × ${h}) + 2(${w} × ${h}) = ${sums(a, b2, c)} = ${SA} ${u.sq[g]}`,
    ),
    whatSay: {
      en: "What if the prism were taller or shorter? Slide the height and watch which faces change.",
      es: "¿Y si el prisma fuera más alto o más bajo? Desliza la altura y mira qué caras cambian.",
    },
    heightLabel: N("Height", "Altura"),
    whatRow: (h2) =>
      both((g) =>
        g === "en"
          ? `Height ${h2}: Top and Bottom stay ${a} each. The four side faces change. Total: 2(${a}) + 2(${l * h2}) + 2(${w * h2}) = ${boxArea(l, w, h2)} ${u.sq.en}.`
          : `Altura ${h2}: Arriba y Abajo siguen midiendo ${a} cada una. Las cuatro caras laterales cambian. Total: 2(${a}) + 2(${l * h2}) + 2(${w * h2}) = ${boxArea(l, w, h2)} ${u.sq.es}.`,
      ),
    whatExpr: (h2) => `2(${a}) + 2(${l * h2}) + 2(${w * h2}) = ${boxArea(l, w, h2)}`,
    tryMore: (n) => ({
      en: n === 1 ? "Try one more height." : "Try two different heights.",
      es: n === 1 ? "Prueba una altura más." : "Prueba dos alturas diferentes.",
    }),
    whatLesson: {
      en: "Only the faces that use the height change. The formula 2lw + 2lh + 2wh still works at every height.",
      es: "Solo cambian las caras que usan la altura. La fórmula 2lw + 2lh + 2wh sigue funcionando con cualquier altura.",
    },
    transferSay: {
      en: `A triangular prism: two triangle ends (base ${tri.b}, height ${tri.hg}) and three rectangles. It is ${tri.len} ${tu.len.en} long and the slanted sides are ${tri.s} ${tu.len.en}. It has 5 faces, not 6.`,
      es: `Un prisma triangular: dos extremos triangulares (base ${tri.b}, altura ${tri.hg}) y tres rectángulos. Mide ${tri.len} ${tu.len.es} de largo y los lados inclinados miden ${tri.s} ${tu.len.es}. Tiene 5 caras, no 6.`,
    },
    transferQ: {
      en: "What is the surface area of this triangular prism?",
      es: "¿Cuál es el área de superficie de este prisma triangular?",
    },
    transferCue: (kind, value) =>
      ({
        rects: both((g) =>
          g === "en"
            ? `${value} adds the three rectangles only. A triangular prism has 5 faces. Which faces are missing from that sum? (Look at the outlined ones.)`
            : `${value} suma solo los tres rectángulos. Un prisma triangular tiene 5 caras. ¿Qué caras faltan en esa suma? (Mira las marcadas.)`,
        ),
        oneTriangle: both((g) =>
          g === "en"
            ? `${value} counts only one triangle end. Look at the net: how many triangle ends are there?`
            : `${value} cuenta un solo extremo triangular. Mira la plantilla: ¿cuántos extremos triangulares hay?`,
        ),
        noHalf: both((g) =>
          g === "en"
            ? `${value} uses base × height for each triangle, without the ½. A triangle is half of a rectangle. What is the area of one triangle end?`
            : `${value} usa base × altura para cada triángulo, sin el ½. Un triángulo es la mitad de un rectángulo. ¿Cuál es el área de un extremo triangular?`,
        ),
      })[kind],
    transferOk: both(
      (g) =>
        `${g === "en" ? "Right" : "Correcto"}: 2 × (½ × ${tri.b} × ${tri.hg}) + ${tri.b} × ${tri.len} + ${tri.s} × ${tri.len} + ${tri.s} × ${tri.len} = ${2 * half} + ${(tri.b + 2 * tri.s) * tri.len} = ${tSq(T, g)}.`,
    ),
    transferExpr: both(
      (g) =>
        `2(½ × ${tri.b} × ${tri.hg}) + ${tri.b * tri.len} + ${tri.s * tri.len} + ${tri.s * tri.len} = ${tSq(T, g)}`,
    ),
    explainLabel: {
      en: "Explain: why is the list of faces different for a triangular prism than for a box?",
      es: "Explica: ¿por qué la lista de caras de un prisma triangular es diferente a la de una caja?",
    },
    explainFrame: {
      en: "A triangular prism has ___ faces: ___ triangles and ___ rectangles. I add ___.",
      es: "Un prisma triangular tiene ___ caras: ___ triángulos y ___ rectángulos. Sumo ___.",
    },
  };
}

/** Every sentence of the pyramid mode. */
function pyramidCopy(v) {
  const { b, sl, unit: u, tr } = v;
  const tri = (b * sl) / 2;
  const SA = pyramidArea(b, sl);
  const tTri = (tr.b * tr.sl) / 2;
  const tSA = pyramidArea(tr.b, tr.sl);
  const sq = (n, g) => `${n} ${u.sq[g]}`;
  const sizeTxt = both((g) => `${b} ${u.len[g]} × ${b} ${u.len[g]}`);
  const rowFor = (s2) => {
    const t2 = (b * s2) / 2;
    return both((g) =>
      g === "en"
        ? `Slant height ${s2}: each triangle is ½ × ${b} × ${s2} = ${t2}. Total: ${b * b} + 4 × ${t2} = ${pyramidArea(b, s2)} ${u.sq.en}.`
        : `Altura inclinada ${s2}: cada triángulo es ½ × ${b} × ${s2} = ${t2}. Total: ${b * b} + 4 × ${t2} = ${pyramidArea(b, s2)} ${u.sq.es}.`,
    );
  };
  return {
    kicker: KICK,
    title: N("The faces of a pyramid", "Las caras de una pirámide"),
    ariaLabel: {
      en: `A square pyramid with a ${b} by ${b} ${u.len.en} base and four triangle faces, opened into a net. The slant height of each face is ${sl} ${u.len.en}.`,
      es: `Una pirámide cuadrada con base de ${b} por ${b} ${u.len.es} y cuatro caras triangulares, abierta en una plantilla. La altura inclinada de cada cara mide ${sl} ${u.len.es}.`,
    },
    printSummary: {
      en: `A square pyramid with a ${b} × ${b} base and slant height ${sl}: base ${b} × ${b} = ${b * b}; each triangle face ½ × ${b} × ${sl} = ${tri}; four faces 4 × ${tri} = ${4 * tri}. Surface area = ${b * b} + ${4 * tri} = ${sq(SA, "en")}. The triangles use the slant height, not the height of the pyramid.`,
      es: `Una pirámide cuadrada con base de ${b} × ${b} y altura inclinada ${sl}: base ${b} × ${b} = ${b * b}; cada cara triangular ½ × ${b} × ${sl} = ${tri}; cuatro caras 4 × ${tri} = ${4 * tri}. Área de superficie = ${b * b} + ${4 * tri} = ${sq(SA, "es")}. Los triángulos usan la altura inclinada, no la altura de la pirámide.`,
    },
    scene: {
      net: N("The net", "La plantilla"),
      predict: N("Predict", "Predice"),
      faces: N("Find the faces", "Halla las caras"),
      formula: N("The formula", "La fórmula"),
      what: N("What if?", "¿Y si…?"),
      transfer: N("A new pyramid", "Una pirámide nueva"),
    },
    slantLabel: (n) => N(`slant ${n}`, `inclinada ${n}`),
    heightLabel: N("height", "altura"),
    netSay: {
      en: `A square pyramid with a ${sizeTxt.en} base, opened into a net: one square base and four triangle faces. The dashed line is the slant height, ${sl} ${u.len.en}: it runs along a triangle face from the middle of its base edge up to the tip.`,
      es: `Una pirámide cuadrada con base de ${sizeTxt.es}, abierta en una plantilla: una base cuadrada y cuatro caras triangulares. La línea punteada es la altura inclinada, ${sl} ${u.len.es}: va por una cara triangular desde la mitad de su arista de la base hasta la punta.`,
    },
    predictQ: {
      en: "The area of a triangle face is ½ × base × ___. Which length goes in the blank?",
      es: "El área de una cara triangular es ½ × base × ___. ¿Qué longitud va en el espacio?",
    },
    lengthLabel: (kind) =>
      ({
        slant: N(
          `${sl}, the slant height (along the face)`,
          `${sl}, la altura inclinada (por la cara)`,
        ),
        base: N(`${b}, the edge of the base`, `${b}, la arista de la base`),
        height: N(
          "the height of the pyramid (straight up inside)",
          "la altura de la pirámide (recto hacia arriba, por dentro)",
        ),
      })[kind],
    lengthCue: (kind) =>
      ({
        base: both((g) =>
          g === "en"
            ? `${b} is the base of the triangle, the side it sits on. The formula needs the base AND a height measured up from it. Which dashed line goes from that base up to the tip, along the face?`
            : `${b} es la base del triángulo, el lado donde se apoya. La fórmula necesita la base Y una altura medida desde ella. ¿Qué línea punteada va desde esa base hasta la punta, por la cara?`,
        ),
        height: both((g) =>
          g === "en"
            ? "The pyramid's own height goes straight up through the inside. A triangle face is a flat piece that slopes. Look at the folded pyramid: which dashed line lies ON a face?"
            : "La altura de la pirámide sube recto por dentro. Una cara triangular es una pieza plana inclinada. Mira la pirámide doblada: ¿qué línea punteada está SOBRE una cara?",
        ),
      })[kind],
    predictOk: {
      en: `Yes: ${sl}. The height of a triangle is measured at a right angle to its base, and on this face that is the slant height. One face is ½ × ${b} × ${sl} = ${tri}.`,
      es: `Sí: ${sl}. La altura de un triángulo se mide en ángulo recto con su base, y en esta cara es la altura inclinada. Una cara es ½ × ${b} × ${sl} = ${tri}.`,
    },
    facesSay: {
      en: "Tap the base, and tap a triangle face, to find each area. You can also fold the net to see the pyramid.",
      es: "Toca la base y toca una cara triangular para hallar cada área. También puedes doblar la plantilla para ver la pirámide.",
    },
    baseBtn: N("Base", "Base"),
    faceBtn: N("A triangle face", "Una cara triangular"),
    foldBtn: N("Fold it", "Dóblala"),
    unfoldBtn: N("Unfold", "Desdoblar"),
    basePick: both((g) =>
      g === "en"
        ? `Base: ${b} × ${b} = ${b * b} ${u.sq.en}. There is one base.`
        : `Base: ${b} × ${b} = ${b * b} ${u.sq.es}. Hay una sola base.`,
    ),
    facePick: both((g) =>
      g === "en"
        ? `One triangle face: ½ × ${b} × ${sl} = ${tri} ${u.sq.en}. There are 4 matching faces, all lit up.`
        : `Una cara triangular: ½ × ${b} × ${sl} = ${tri} ${u.sq.es}. Hay 4 caras iguales, todas iluminadas.`,
    ),
    facesLeft: {
      en: "Find the other one too: the base and a triangle face.",
      es: "Halla también la otra: la base y una cara triangular.",
    },
    facesDone: {
      en: `Base ${b * b}, and four faces of ${tri}: that is ${b * b} + 4 × ${tri}.`,
      es: `Base ${b * b} y cuatro caras de ${tri}: eso es ${b * b} + 4 × ${tri}.`,
    },
    formulaSay: {
      en: "Surface area of a pyramid = base area + all the triangle faces. Each triangle uses ½ × base × slant height.",
      es: "Área de superficie de una pirámide = área de la base + todas las caras triangulares. Cada triángulo usa ½ × base × altura inclinada.",
    },
    formulaExpr: both(
      (g) => `${b} × ${b} + 4(½ × ${b} × ${sl}) = ${b * b} + ${4 * tri} = ${sq(SA, g)}`,
    ),
    whatSay: {
      en: "What if the slant height were longer or shorter? Slide it and watch which faces change.",
      es: "¿Y si la altura inclinada fuera más larga o más corta? Deslízala y mira qué caras cambian.",
    },
    slantRange: N("Slant height", "Altura inclinada"),
    whatRow: rowFor,
    whatExpr: (s2) => `${b * b} + 4 × ${(b * s2) / 2} = ${pyramidArea(b, s2)}`,
    tryMore: (n) => ({
      en: n === 1 ? "Try one more slant height." : "Try two different slant heights.",
      es:
        n === 1 ? "Prueba una altura inclinada más." : "Prueba dos alturas inclinadas diferentes.",
    }),
    whatLesson: {
      en: `The base stayed ${b * b}. Only the four triangles changed with the slant height. Do not forget to add the base.`,
      es: `La base siguió siendo ${b * b}. Solo cambiaron los cuatro triángulos con la altura inclinada. No olvides sumar la base.`,
    },
    transferSay: {
      en: `A smaller square pyramid: base ${tr.b} × ${tr.b}, slant height ${tr.sl}. Same faces, new measurements.`,
      es: `Una pirámide cuadrada más pequeña: base ${tr.b} × ${tr.b}, altura inclinada ${tr.sl}. Las mismas caras, medidas nuevas.`,
    },
    transferQ: {
      en: "What is the surface area of this pyramid?",
      es: "¿Cuál es el área de superficie de esta pirámide?",
    },
    transferCue: (kind, value) =>
      ({
        noBase: both((g) =>
          g === "en"
            ? `${value} adds the four triangle faces only. A pyramid also has a base. Which face is missing from that sum? (Look at the outlined one.)`
            : `${value} suma solo las cuatro caras triangulares. Una pirámide también tiene base. ¿Qué cara falta en esa suma? (Mira la marcada.)`,
        ),
        noHalf: both((g) =>
          g === "en"
            ? `${value} uses base × slant height for each triangle, without the ½. A triangle is half of a rectangle. What is the area of one triangle face?`
            : `${value} usa base × altura inclinada en cada triángulo, sin el ½. Un triángulo es la mitad de un rectángulo. ¿Cuál es el área de una cara triangular?`,
        ),
        oneFace: both((g) =>
          g === "en"
            ? `${value} adds the base and just one triangle. A square pyramid has how many triangle faces? Count them in the net.`
            : `${value} suma la base y un solo triángulo. ¿Cuántas caras triangulares tiene una pirámide cuadrada? Cuéntalas en la plantilla.`,
        ),
      })[kind],
    transferOk: both(
      (g) =>
        `${g === "en" ? "Right" : "Correcto"}: ${tr.b} × ${tr.b} + 4(½ × ${tr.b} × ${tr.sl}) = ${tr.b * tr.b} + ${4 * tTri} = ${sq(tSA, g)}.`,
    ),
    transferExpr: both((g) => `${tr.b * tr.b} + 4 × ${tTri} = ${sq(tSA, g)}`),
    explainLabel: {
      en: "Explain: why do you add the base when you find the surface area of a pyramid?",
      es: "Explica: ¿por qué sumas la base al hallar el área de superficie de una pirámide?",
    },
    explainFrame: {
      en: "The pyramid has ___ triangle faces and ___ base. Each triangle uses the ___ height, and I add ___.",
      es: "La pirámide tiene ___ caras triangulares y ___ base. Cada triángulo usa la altura ___, y sumo ___.",
    },
  };
}

/** The copy for a validated config. Prism copy needs the face names from the net. */
export function surfaceAreaCopy(v) {
  if (v.mode === "prism") {
    const solid = rectPrism(v.l, v.w, v.h);
    return prismCopy(v, (id) => solid.byId[id].name);
  }
  return pyramidCopy(v);
}
