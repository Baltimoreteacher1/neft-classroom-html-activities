// living/decimal-area-model.js — the mathematics of the decimal-area play
// (2-12 Multiply Decimals).
//
// Pure functions only (no DOM). Decimals are handled as digit strings so a
// trailing zero (12.60) keeps its place count, and every product is whole-number
// arithmetic on those digits: 4.5 × 12.60 is 45 × 1260 = 56700 with 1 + 2 = 3
// decimal places. Helpers shared with the other decimals plays come from
// place-value-blocks-model.js.

import { fmt, near, okInt, placeCorrect } from "./place-value-blocks-model.js";

export { placeCorrect };

const DEC = /^\d{1,3}(\.\d{1,3})?$/;

/** "12.60" -> { int: 1260, places: 2, text: "12.60" }; null when not a plain decimal. */
export function parseDec(s) {
  const text = typeof s === "number" ? String(s) : s;
  if (typeof text !== "string" || !DEC.test(text)) return null;
  const places = text.includes(".") ? text.length - text.indexOf(".") - 1 : 0;
  return { int: Number(text.replace(".", "")), places, text, value: Number(text) };
}

/** Put the point `places` digits from the right of a whole number: 28,2 -> "0.28". */
export function placePoint(n, places) {
  const d = String(n).padStart(places + 1, "0");
  if (places === 0) return d;
  return `${d.slice(0, d.length - places)}.${d.slice(d.length - places)}`;
}

/** a × b as whole numbers plus a count of decimal places. */
export function multiply(a, b) {
  const x = parseDec(a);
  const y = parseDec(b);
  const prod = x.int * y.int;
  const places = x.places + y.places;
  return { x, y, prod, places, digits: String(prod), text: placePoint(prod, places) };
}

/** Whole-number estimate: round each factor, multiply (4.5 × 12.60 -> 5 × 13 = 65). */
export function estimate(a, b) {
  const x = Math.round(parseDec(a).value);
  const y = Math.round(parseDec(b).value);
  return { x, y, total: x * y };
}

/** tenths × tenths on a 10 × 10 grid: w columns × h rows of hundredths. */
export function areaModel(w, h) {
  const squares = w * h;
  return { w, h, squares, text: placePoint(squares, 2), a: w / 10, b: h / 10 };
}

const tenths = (x) => Math.round(x * 10);
const isTenths = (x) =>
  typeof x === "number" && x > 0 && x < 1 && near(x * 10, tenths(x)) && okInt(tenths(x), 1, 9);

/** Predict choices for tenths × tenths: the product plus the three usual slips. */
export function predictChoices(a, b) {
  const m = areaModel(tenths(a), tenths(b));
  const right = Number(m.text);
  const cands = [
    { kind: "add", text: String(Math.round((a + b) * 100) / 100) },
    { kind: "big", text: placePoint(m.squares, 1) },
    { kind: "small", text: placePoint(m.squares, 3) },
  ];
  const out = [{ kind: "product", text: m.text, correct: true }];
  for (const c of cands) {
    if (!near(Number(c.text), right) && !out.some((o) => near(Number(o.text), Number(c.text))))
      out.push(c);
  }
  return out.length >= 3 ? out : null;
}

/** Where does the point go in the whole-number product? The right place plus 3 slips. */
export function pointChoices(a, b) {
  const m = multiply(a, b);
  const n = m.digits.length;
  const out = [{ kind: "both", places: m.places, text: m.text, correct: true }];
  const slips = [
    { kind: "longer", places: Math.max(m.x.places, m.y.places) },
    { kind: "one", places: Math.min(m.x.places, m.y.places) },
    { kind: "extra", places: m.places + 1 },
  ];
  for (const s of slips) {
    if (s.places < n && !out.some((o) => o.places === s.places))
      out.push({ ...s, text: placePoint(m.prod, s.places) });
  }
  return out.length >= 3 ? out : null;
}

const strOf = (x) => (typeof x === "string" ? x : typeof x === "number" ? String(x) : "");
const textOf = (s) =>
  s && typeof s.en === "string" && s.en.trim()
    ? { en: s.en.slice(0, 300), es: String(s.es || s.en).slice(0, 300) }
    : null;

function validPair(p, { allowMoney = true } = {}) {
  const a = parseDec(strOf(p?.a));
  const b = parseDec(strOf(p?.b));
  if (!a || !b || a.places + b.places < 2) return null;
  const m = multiply(a.text, b.text);
  // The product must have more digits than places, no leading zero in the digit
  // string, and a full set of point slips to choose from.
  if (m.digits.length <= m.places || a.int === 0 || b.int === 0) return null;
  if (!pointChoices(a.text, b.text)) return null;
  const prefix = allowMoney && typeof p.prefix === "string" && p.prefix.length <= 2 ? p.prefix : "";
  return { a: a.text, b: b.text, prefix, story: textOf(p.story) };
}

/**
 * { a, b }            tenths × tenths for the area model (0.4 × 0.7)
 * { big, transfer }   { a, b (strings, keep 12.60), prefix?, story? } whole-number
 *                     products whose point the student places
 */
export function validateDecimalArea(cfg) {
  if (!cfg || !isTenths(cfg.a) || !isTenths(cfg.b)) return null;
  if (!predictChoices(cfg.a, cfg.b)) return null;
  const big = validPair(cfg.big);
  const transfer = validPair(cfg.transfer);
  if (!big || !transfer) return null;
  if (big.a === transfer.a && big.b === transfer.b) return null;
  return {
    a: cfg.a,
    b: cfg.b,
    w: tenths(cfg.a),
    h: tenths(cfg.b),
    big,
    transfer,
    story: textOf(cfg.story),
  };
}

const moneyText = (m, prefix) =>
  prefix && m.places === 3 && m.digits.endsWith("0")
    ? `${prefix}${placePoint(m.prod / 10, 2)}`
    : null;

/** Every sentence the play says, as {en, es} pairs, from the validated config. */
export function decimalAreaCopy(v) {
  const { a, b, w, h } = v;
  const area = areaModel(w, h);
  const A = String(a);
  const B = String(b);
  const placesWord = (n) => ({
    en: n === 1 ? "place" : "places",
    es: n === 1 ? "lugar" : "lugares",
  });
  const pair = (p) => {
    const m = multiply(p.a, p.b);
    const est = estimate(p.a, p.b);
    const money = moneyText(m, p.prefix);
    const pre = p.prefix;
    return {
      m,
      est,
      money,
      pre,
      factors: `${p.a} × ${p.b}`,
      whole: `${fmt(String(m.x.int))} × ${fmt(String(m.y.int))} = ${fmt(m.digits)}`,
      count: {
        en: `${m.x.text}: ${m.x.places} ${placesWord(m.x.places).en}  ·  ${m.y.text}: ${m.y.places} ${placesWord(m.y.places).en}  ·  ${m.x.places} + ${m.y.places} = ${m.places}`,
        es: `${m.x.text}: ${m.x.places} ${placesWord(m.x.places).es}  ·  ${m.y.text}: ${m.y.places} ${placesWord(m.y.places).es}  ·  ${m.x.places} + ${m.y.places} = ${m.places}`,
      },
      estLine: `${est.x} × ${pre}${est.y} = ${pre}${fmt(String(est.total))}`,
    };
  };
  const big = pair(v.big);
  const tr = pair(v.transfer);
  const bigAns = big.money ? `${big.m.text}, ${big.money}` : big.m.text;
  const cueFor = (p, opt) => {
    const e = p.est;
    const ask = {
      en: `Estimate: about ${e.x} × ${p.pre}${e.y} = ${p.pre}${fmt(String(e.total))}. Is ${opt.text} close to that?`,
      es: `Estima: más o menos ${e.x} × ${p.pre}${e.y} = ${p.pre}${fmt(String(e.total))}. ¿Está ${opt.text} cerca de eso?`,
    };
    const lead = {
      longer: {
        en: `${opt.text} has only ${opt.places} decimal places, the count of the longer factor alone.`,
        es: `${opt.text} tiene solo ${opt.places} lugares decimales, los del factor más largo.`,
      },
      one: {
        en: `${opt.text} has only ${opt.places} decimal ${placesWord(opt.places).en}, as if one factor had none.`,
        es: `${opt.text} tiene solo ${opt.places} ${placesWord(opt.places).es} decimal${opt.places === 1 ? "" : "es"}, como si un factor no tuviera ninguno.`,
      },
      extra: {
        en: `${opt.text} has ${opt.places} decimal places. Count the places in each factor and add them.`,
        es: `${opt.text} tiene ${opt.places} lugares decimales. Cuenta los lugares de cada factor y súmalos.`,
      },
    }[opt.kind];
    return { en: `${lead.en} ${ask.en}`, es: `${lead.es} ${ask.es}` };
  };
  return {
    kicker: { en: "See it · Try it · Explain it", es: "Míralo · Pruébalo · Explícalo" },
    title: { en: "Where does the point go?", es: "¿Dónde va el punto?" },
    ariaLabel: {
      en: `A square worth 1 whole, cut into 10 columns of tenths and 10 rows of tenths, so each small square is one hundredth. A rectangle ${A} wide and ${B} tall covers ${area.squares} small squares, which is ${area.text}. Then whole-number products ${fmt(big.m.digits)} and ${fmt(tr.m.digits)} get their decimal points from the count of decimal places.`,
      es: `Un cuadrado que vale 1 entero, cortado en 10 columnas de décimas y 10 filas de décimas, así que cada cuadrito es una centésima. Un rectángulo de ${A} de ancho y ${B} de alto cubre ${area.squares} cuadritos, que son ${area.text}. Luego los productos de números enteros ${fmt(big.m.digits)} y ${fmt(tr.m.digits)} reciben su punto decimal contando los lugares decimales.`,
    },
    printSummary: {
      en: `${A} × ${B}: a rectangle ${w} columns wide and ${h} rows tall on a 10 × 10 grid covers ${w} × ${h} = ${area.squares} small squares, each 0.01, so ${A} × ${B} = ${area.text}. Multiply without points, count the decimal places in both factors (${v.big.a} has ${big.m.x.places}, ${v.big.b} has ${big.m.y.places}), and place the point that many places from the right: ${big.factors} = ${bigAns}.`,
      es: `${A} × ${B}: un rectángulo de ${w} columnas de ancho y ${h} filas de alto en una cuadrícula de 10 × 10 cubre ${w} × ${h} = ${area.squares} cuadritos, cada uno de 0.01, así que ${A} × ${B} = ${area.text}. Multiplica sin puntos, cuenta los lugares decimales de los dos factores (${v.big.a} tiene ${big.m.x.places}, ${v.big.b} tiene ${big.m.y.places}) y pon el punto esa cantidad de lugares desde la derecha: ${big.factors} = ${bigAns}.`,
    },
    scene: {
      situate: { en: "The whole", es: "El entero" },
      predict: { en: "Predict", es: "Predice" },
      build: { en: "Build it", es: "Constrúyelo" },
      connect: { en: "Count it", es: "Cuéntalo" },
      big: { en: "Bigger numbers", es: "Números más grandes" },
      transfer: { en: "On your own", es: "Por tu cuenta" },
    },
    whole: { en: "1 whole = 100 small squares", es: "1 entero = 100 cuadritos" },
    colsLabel: (n) => ({ en: `${n} columns`, es: `${n} columnas` }),
    rowsLabel: (n) => ({ en: `${n} rows`, es: `${n} filas` }),
    situateSay: {
      en: `This square is 1 whole. Cut it into 10 equal columns: each column is one tenth, 0.1. Now cut it into 10 equal rows. Each small square is one tenth of a tenth: 1 of the 100 equal parts of the whole.`,
      es: `Este cuadrado es 1 entero. Córtalo en 10 columnas iguales: cada columna es una décima, 0.1. Ahora córtalo en 10 filas iguales. Cada cuadrito es una décima de una décima: 1 de las 100 partes iguales del entero.`,
    },
    situateExpr: "1 = 10 × 10 = 100",
    predictSay: {
      en: `Multiply ${A} × ${B}: a rectangle ${A} of the whole wide and ${B} of the whole tall, inside the whole square. Before counting, predict the product.`,
      es: `Multiplica ${A} × ${B}: un rectángulo de ${A} del entero de ancho y ${B} del entero de alto, dentro del cuadrado entero. Antes de contar, predice el producto.`,
    },
    predictQ: { en: `${A} × ${B} = ?`, es: `${A} × ${B} = ?` },
    predictCue: (opt) =>
      ({
        add: {
          en: `${opt.text} is ${A} + ${B}: that is adding. The ${A} by ${B} rectangle sits INSIDE the whole square. Can it be worth more than the whole?`,
          es: `${opt.text} es ${A} + ${B}: eso es sumar. El rectángulo de ${A} por ${B} está DENTRO del cuadrado entero. ¿Puede valer más que el entero?`,
        },
        big: {
          en: `${opt.text} is more than ${Math.floor(Number(opt.text))} whole${Math.floor(Number(opt.text)) === 1 ? "" : "s"}. Look at the picture: how many wholes can fit inside the one whole square?`,
          es: `${opt.text} es más de ${Math.floor(Number(opt.text))} entero${Math.floor(Number(opt.text)) === 1 ? "" : "s"}. Mira el dibujo: ¿cuántos enteros caben dentro del único cuadrado entero?`,
        },
        small: {
          en: `${opt.text} is a thousandths amount. Look at one small square in the grid: it is a tenth of a tenth. Is it a thousandth?`,
          es: `${opt.text} es una cantidad de milésimas. Mira un cuadrito de la cuadrícula: es una décima de una décima. ¿Es una milésima?`,
        },
      })[opt.kind],
    predictOk: {
      en: `Yes: ${area.text}. Now build the rectangle and count the small squares to see why.`,
      es: `Sí: ${area.text}. Ahora construye el rectángulo y cuenta los cuadritos para ver por qué.`,
    },
    buildSay: {
      en: `Set the width to ${w} tenths and the height to ${h} tenths. Each column across is a tenth; each row up is a tenth.`,
      es: `Pon el ancho en ${w} décimas y el alto en ${h} décimas. Cada columna es una décima; cada fila es una décima.`,
    },
    widthLabel: { en: "Width, in tenths", es: "Ancho, en décimas" },
    heightLabel: { en: "Height, in tenths", es: "Alto, en décimas" },
    buildNow: (cw, ch) => {
      const m = areaModel(cw, ch);
      return {
        en: `${m.a} × ${m.b}: ${cw} columns × ${ch} rows = ${m.squares} small squares. Each is 0.01, so ${m.squares} hundredths = ${m.text}.`,
        es: `${m.a} × ${m.b}: ${cw} columnas × ${ch} filas = ${m.squares} cuadritos. Cada uno vale 0.01, así que ${m.squares} centésimas = ${m.text}.`,
      };
    },
    buildNeed: {
      en: `Keep going: set the rectangle to ${A} wide and ${B} tall (${w} and ${h} tenths).`,
      es: `Sigue: pon el rectángulo en ${A} de ancho y ${B} de alto (${w} y ${h} décimas).`,
    },
    buildDone: {
      en: `${w} columns × ${h} rows = ${area.squares} small squares of 0.01. ${A} × ${B} = ${area.text}: tenths times tenths make hundredths.`,
      es: `${w} columnas × ${h} filas = ${area.squares} cuadritos de 0.01. ${A} × ${B} = ${area.text}: décimas por décimas dan centésimas.`,
    },
    connectSay: {
      en: `Count from the picture: ${w} columns × ${h} rows = ${area.squares} small squares. Now the written way. Multiply without points: ${w} × ${h} = ${area.squares}. Count the decimal places: ${A} has 1, ${B} has 1, so 1 + 1 = 2. Put the point 2 places from the right: ${area.text}. Tenths times tenths are hundredths, and hundredths have 2 places.`,
      es: `Cuenta en el dibujo: ${w} columnas × ${h} filas = ${area.squares} cuadritos. Ahora la forma escrita. Multiplica sin puntos: ${w} × ${h} = ${area.squares}. Cuenta los lugares decimales: ${A} tiene 1, ${B} tiene 1, así que 1 + 1 = 2. Pon el punto 2 lugares desde la derecha: ${area.text}. Décimas por décimas son centésimas, y las centésimas tienen 2 lugares.`,
    },
    connectRows: [`${w} × ${h} = ${area.squares}`, `1 + 1 = 2`, `${area.squares} → ${area.text}`],
    bigSay: {
      en: `${v.big.story ? `${v.big.story.en} ` : ""}Now ${big.factors}. The grid is too small for these numbers, so use the same steps: multiply without points: ${big.whole}. Then count the decimal places. Where does the point go in ${fmt(big.m.digits)}?`,
      es: `${v.big.story ? `${v.big.story.es} ` : ""}Ahora ${big.factors}. La cuadrícula es muy pequeña para estos números, así que usa los mismos pasos: multiplica sin puntos: ${big.whole}. Luego cuenta los lugares decimales. ¿Dónde va el punto en ${fmt(big.m.digits)}?`,
    },
    bigQ: {
      en: `${big.factors}: the product is ${fmt(big.m.digits)} without points. With the point, it is…`,
      es: `${big.factors}: el producto es ${fmt(big.m.digits)} sin puntos. Con el punto, es…`,
    },
    bigCue: (opt) => cueFor(big, opt),
    bigOk: {
      en: `Yes: ${big.m.x.places} + ${big.m.y.places} = ${big.m.places} places, so ${big.factors} = ${big.m.text}${big.money ? `, or ${big.money}` : ""}. The estimate agrees: ${big.estLine}.`,
      es: `Sí: ${big.m.x.places} + ${big.m.y.places} = ${big.m.places} lugares, así que ${big.factors} = ${big.m.text}${big.money ? `, o sea ${big.money}` : ""}. La estimación coincide: ${big.estLine}.`,
    },
    transferSay: {
      en: `${v.transfer.story ? `${v.transfer.story.en} ` : ""}One more: ${tr.factors}. Multiply without points: ${tr.whole}. Count the places, then check with an estimate.`,
      es: `${v.transfer.story ? `${v.transfer.story.es} ` : ""}Una más: ${tr.factors}. Multiplica sin puntos: ${tr.whole}. Cuenta los lugares y revisa con una estimación.`,
    },
    transferQ: {
      en: `${tr.factors}: the product is ${fmt(tr.m.digits)} without points. With the point, it is…`,
      es: `${tr.factors}: el producto es ${fmt(tr.m.digits)} sin puntos. Con el punto, es…`,
    },
    transferCue: (opt) => cueFor(tr, opt),
    transferOk: {
      en: `Right: ${tr.m.x.places} + ${tr.m.y.places} = ${tr.m.places} places, so ${tr.factors} = ${tr.m.text}${tr.money ? `, or ${tr.money}` : ""}. Estimate: ${tr.estLine}, close.`,
      es: `Correcto: ${tr.m.x.places} + ${tr.m.y.places} = ${tr.m.places} lugares, así que ${tr.factors} = ${tr.m.text}${tr.money ? `, o sea ${tr.money}` : ""}. Estimación: ${tr.estLine}, cerca.`,
    },
    pairs: { big, transfer: tr },
    explainLabel: {
      en: "Explain: why do you add the decimal places of both factors?",
      es: "Explica: ¿por qué sumas los lugares decimales de los dos factores?",
    },
    explainFrame: {
      en: "Tenths times tenths make ___, so the product has ___ decimal places because ___.",
      es: "Décimas por décimas dan ___, así que el producto tiene ___ lugares decimales porque ___.",
    },
  };
}
