// Names, rules and prompts for Number Builder: everything a round says about itself, in English and Spanish.
// Pure functions of a round, so a round stays plain JSON. @fm2 FM-007 FM-020
import { fmtNum, wordsFor } from "./words.js";

const SUP = {
  0: "⁰",
  1: "¹",
  2: "²",
  3: "³",
  4: "⁴",
  5: "⁵",
  6: "⁶",
  7: "⁷",
  8: "⁸",
  9: "⁹",
  "-": "⁻",
};
export const sup = (n) =>
  String(n)
    .split("")
    .map((c) => SUP[c] ?? c)
    .join("");
export const power = (n) => `10${sup(n)}`;
const minus = (n) => String(n).replace("-", "−");
export const signed = (text) => (text.startsWith("-") ? `−${text.slice(1)}` : `+${text}`);

const NAMES = {
  "unit:1": [
    ["ones unit", "ones units"],
    ["cubo de unidades", "cubos de unidades"],
  ],
  "rod:10": [
    ["tens rod", "tens rods"],
    ["barra de decenas", "barras de decenas"],
  ],
  "flat:100": [
    ["hundreds flat", "hundreds flats"],
    ["plancha de centenas", "planchas de centenas"],
  ],
  "flat:1": [
    ["whole flat", "whole flats"],
    ["plancha entera", "planchas enteras"],
  ],
  "rod:0.1": [
    ["tenths rod", "tenths rods"],
    ["barra de décimas", "barras de décimas"],
  ],
  "unit:0.01": [
    ["hundredths unit", "hundredths units"],
    ["cubo de centésimas", "cubos de centésimas"],
  ],
  "mini:0.001": [
    ["thousandths dot", "thousandths dots"],
    ["punto de milésimas", "puntos de milésimas"],
  ],
  "disc:1": [
    ["ones disc", "ones discs"],
    ["disco de unidades", "discos de unidades"],
  ],
  "disc:10": [
    ["tens disc", "tens discs"],
    ["disco de decenas", "discos de decenas"],
  ],
  "disc:100": [
    ["hundreds disc", "hundreds discs"],
    ["disco de centenas", "discos de centenas"],
  ],
  "disc:1000": [
    ["thousands disc", "thousands discs"],
    ["disco de millares", "discos de millares"],
  ],
  "disc:10000": [
    ["ten-thousands disc", "ten-thousands discs"],
    ["disco de decenas de millar", "discos de decenas de millar"],
  ],
  "disc:100000": [
    ["hundred-thousands disc", "hundred-thousands discs"],
    ["disco de centenas de millar", "discos de centenas de millar"],
  ],
  "counter:red": [
    ["red counter", "red counters"],
    ["ficha roja", "fichas rojas"],
  ],
  "counter:yellow": [
    ["yellow counter", "yellow counters"],
    ["ficha amarilla", "fichas amarillas"],
  ],
};
const NOUN = {
  counters: ["counters", "fichas"],
  chips: ["chips", "fichas"],
  discs: ["discs", "discos"],
  expdiscs: ["discs", "discos"],
  base10: ["pieces", "piezas"],
  decimal: ["pieces", "piezas"],
};
export const nounFor = (round, lang) => NOUN[round.kit][lang === "en" ? 0 : 1];

export function pieceName(piece, lang, n = 2) {
  const li = lang === "en" ? 0 : 1;
  const plural = n === 1 ? 0 : 1;
  if (piece.kind === "chip") {
    const mag = piece.value.replace("-", "");
    const neg = piece.value.startsWith("-");
    if (mag === "1")
      return lang === "en"
        ? `${neg ? "negative" : "positive"} chip${plural ? "s" : ""}`
        : `ficha${plural ? "s" : ""} ${neg ? "negativa" : "positiva"}${plural ? "s" : ""}`;
    return lang === "en"
      ? `${signed(piece.value)} chip${plural ? "s" : ""}`
      : `ficha${plural ? "s" : ""} de ${signed(piece.value)}`;
  }
  if (piece.kind === "expdisc")
    return lang === "en"
      ? `${power(piece.exp)} disc${plural ? "s" : ""}`
      : `disco${plural ? "s" : ""} de ${power(piece.exp)}`;
  const key = piece.kind === "counter" ? `counter:${piece.color}` : `${piece.kind}:${piece.value}`;
  return NAMES[key][li][plural];
}

// Face text printed on a piece: its value (or its power of ten).
export const pieceFace = (piece) =>
  piece.kind === "expdisc"
    ? power(piece.exp)
    : piece.kind === "chip"
      ? signed(piece.value)
      : fmtNum(piece.value);

const sameMagnitude = (round, ids) =>
  new Set(ids.map((id) => round.pieces.find((p) => p.id === id).value.replace("-", ""))).size === 1;
export function groupName(round, ids, lang, n = 2) {
  if (ids.length === 1)
    return pieceName(
      round.pieces.find((p) => p.id === ids[0]),
      lang,
      n,
    );
  const ps = ids.map((id) => round.pieces.find((p) => p.id === id));
  const en = lang === "en";
  if (ps.every((p) => !p.value.startsWith("-"))) return en ? "positive chips" : "fichas positivas";
  if (ps.every((p) => p.value.startsWith("-"))) return en ? "negative chips" : "fichas negativas";
  if (sameMagnitude(round, ids)) {
    const m = fmtNum(ps[0].value.replace("-", ""));
    return en ? `chips worth +${m} or −${m}` : `fichas de +${m} o −${m}`;
  }
  return en ? "chips from this group" : "fichas de este grupo";
}

const UNIT_WORDS = {
  1: [["one", "ones"], ["unidad", "unidades"]],
  10: [["ten", "tens"], ["decena", "decenas"]],
  100: [["hundred", "hundreds"], ["centena", "centenas"]],
  1000: [["thousand", "thousands"], ["millar", "millares"]],
};

const OPS = {
  en: { eq: "exactly", ge: "at least", le: "at most" },
  es: { eq: "exactamente", ge: "al menos", le: "como máximo" },
};

export function ruleText(round, c, lang) {
  const en = lang === "en";
  if (c.t === "count") {
    const name = groupName(round, c.of, lang, c.n);
    if (c.op === "eq" && c.n === 0) return en ? `Use no ${name}` : `No uses ${name}`;
    return en ? `Use ${OPS.en[c.op]} ${c.n} ${name}` : `Usa ${OPS.es[c.op]} ${c.n} ${name}`;
  }
  if (c.t === "pieces")
    return en
      ? `Use ${OPS.en[c.op]} ${c.n} ${nounFor(round, lang)} in all`
      : `Usa ${OPS.es[c.op]} ${c.n} ${nounFor(round, lang)} en total`;
  if (c.t === "kinds")
    return en
      ? `Use at least ${c.n} different kinds of ${nounFor(round, lang)}`
      : `Usa al menos ${c.n} tipos distintos de ${nounFor(round, lang)}`;
  if (c.t === "normalized")
    return en
      ? "The coefficient must be at least 1 and less than 10"
      : "El coeficiente debe ser mayor o igual que 1 y menor que 10";
  if (c.t === "exp")
    return c.op === "eq"
      ? en
        ? `Use the exponent ${minus(c.n)}`
        : `Usa el exponente ${minus(c.n)}`
      : en
        ? `Use an exponent other than ${minus(c.n)}`
        : `Usa un exponente distinto de ${minus(c.n)}`;
  return "";
}

export const waysText = (lang) =>
  lang === "en" ? "Make two different builds" : "Haz dos construcciones diferentes";
export const rulesOf = (round, lang) => [
  ...(round.ways === 2 ? [waysText(lang)] : []),
  ...round.constraints.map((c) => ruleText(round, c, lang)),
];

const joinList = (items, lang) =>
  items.length < 2
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} ${lang === "en" ? "and" : "y"} ${items.at(-1)}`;
const asNumber = (text) => fmtNum(text);

function goalText(round, lang) {
  const en = lang === "en";
  const f = round.form || { type: "numeral" };
  const t = asNumber(round.target);
  if (round.mode === "chart") {
    const tiles = joinList(round.tiles.map(String), lang);
    const how = {
      largest: en ? "the largest number you can" : "el número más grande que puedas",
      smallest: en
        ? "the smallest number you can (a number cannot start with 0)"
        : "el número más pequeño que puedas (un número no puede empezar con 0)",
      largestEven: en ? "the largest even number you can" : "el número par más grande que puedas",
      nearest: en ? `the number closest to ${t}` : `el número más cercano a ${t}`,
    }[round.goal];
    return en
      ? `Use all the tiles ${tiles} to make ${how}.`
      : `Usa todas las fichas ${tiles} para formar ${how}.`;
  }
  if (round.mode === "sci") {
    if (round.expr)
      return en
        ? `Build a number equal to ${round.expr.c} × ${power(round.expr.e)}.`
        : `Construye un número igual a ${round.expr.c} × ${power(round.expr.e)}.`;
    return en ? `Write ${t} in scientific notation.` : `Escribe ${t} en notación científica.`;
  }
  if (f.type === "words")
    return en
      ? `Build the number ${wordsFor(round.target, "en")}.`
      : `Construye el número ${wordsFor(round.target, "es")}.`;
  if (f.type === "expanded")
    return en
      ? `Build ${f.terms.map(asNumber).join(" + ")}.`
      : `Construye ${f.terms.map(asNumber).join(" + ")}.`;
  if (f.type === "unit") {
    const word = (p, n) => UNIT_WORDS[p][lang === "en" ? 0 : 1][n === 1 ? 0 : 1];
    const parts = f.terms.map(({ n, p }) => `${n} ${word(p, n)}`);
    return en ? `Build ${parts.join(" + ")}.` : `Construye ${parts.join(" + ")}.`;
  }
  const names = joinList([...new Set(round.pieces.map((p) => pieceName(p, lang)))], lang);
  if (round.kit === "counters")
    return en ? `Show ${t} with ${names}.` : `Muestra ${t} con ${names}.`;
  if (round.target === "0" && round.kit === "chips")
    return en ? "Build zero with chips." : "Construye cero con fichas.";
  return en ? `Build ${t} with ${names}.` : `Construye ${t} con ${names}.`;
}

export function promptFor(round) {
  const make = (lang) =>
    [goalText(round, lang), ...rulesOf(round, lang).map((r) => `${r}.`)].join(" ");
  return { en: make("en"), es: make("es") };
}
