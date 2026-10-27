// Number Builder: game-level copy (title, how to play, together), skill titles, and the interface labels.
// Round-level copy (prompts, rules, hints, feedback) lives in copy-text.js / copy-hints.js / copy-help.js.
// @fm2 FM-007 FM-020
export const TITLE = { en: "Number Builder", es: "Constructor de números" };
export const TAGLINE = {
  en: "Add and take away pieces until your build is worth the goal.",
  es: "Agrega y quita piezas hasta que tu construcción valga la meta.",
};
export const HOW_TO = {
  en: [
    "Read the goal and the rules at the top of the puzzle.",
    "Tap a piece to add it. Tap Remove to take one away. The total under the mat changes as you build.",
    "Use Undo to step back, or Clear to start over with an empty mat.",
    "When your total matches the goal and the rules are met, press Check my build. Some puzzles ask for two different builds.",
  ],
  es: [
    "Lee la meta y las reglas en la parte de arriba del reto.",
    "Toca una pieza para agregarla. Toca Quitar para sacar una. El total debajo de la mesa cambia mientras construyes.",
    "Usa Deshacer para volver un paso, o Borrar todo para empezar con la mesa vacía.",
    "Cuando tu total sea la meta y se cumplan las reglas, toca Revisar mi construcción. Algunos retos piden dos construcciones diferentes.",
  ],
};
export const TOGETHER = {
  en: "Take turns being the builder and the checker. The builder places the pieces and says the total out loud; the checker reads the rules and asks, “How do you know that is worth the goal? Can you build it another way?”",
  es: "Túrnense para ser quien construye y quien revisa. Quien construye pone las piezas y dice el total en voz alta; quien revisa lee las reglas y pregunta: “¿Cómo sabes que vale la meta? ¿Puedes construirlo de otra manera?”",
};

const strand = (en, es) => ({ en, es });
const PV = strand("Place value", "Valor posicional");
export const SKILL_COPY = {
  "k-count": {
    strand: strand("Counting", "Conteo"),
    title: { en: "Fill the ten-frame", es: "Llena el cuadro de diez" },
  },
  "k-bonds": {
    strand: strand("Number bonds", "Composición de números"),
    title: { en: "Make 5 and 10 with two colors", es: "Forma 5 y 10 con dos colores" },
  },
  "g1-tens-ones": { strand: PV, title: { en: "Tens and ones", es: "Decenas y unidades" } },
  "g1-teen": {
    strand: PV,
    title: { en: "A ten and some ones", es: "Una decena y algunas unidades" },
  },
  "g2-hundreds": {
    strand: PV,
    title: { en: "Hundreds, tens and ones", es: "Centenas, decenas y unidades" },
  },
  "g2-regroup": {
    strand: PV,
    title: { en: "Build it a different way", es: "Constrúyelo de otra manera" },
  },
  "g3-discs": {
    strand: PV,
    title: { en: "Place-value discs to 9,999", es: "Discos de valor posicional hasta 9,999" },
  },
  "g3-expanded": { strand: PV, title: { en: "Expanded form", es: "Forma desarrollada" } },
  "g4-discs": {
    strand: PV,
    title: { en: "Place-value discs to 999,999", es: "Discos de valor posicional hasta 999,999" },
  },
  "g4-tile-chart": {
    strand: PV,
    title: { en: "Digit tiles in a chart", es: "Fichas de dígitos en una tabla" },
  },
  "g5-decimal-pieces": {
    strand: strand("Decimals", "Decimales"),
    title: { en: "Decimals with base-ten pieces", es: "Decimales con piezas de base diez" },
  },
  "g5-decimal-regroup": {
    strand: strand("Decimals", "Decimales"),
    title: { en: "Trade tenths and hundredths", es: "Cambia décimas y centésimas" },
  },
  "g6-chips": {
    strand: strand("Integers", "Enteros"),
    title: { en: "Build integers with chips", es: "Construye enteros con fichas" },
  },
  "g6-zero-pairs": {
    strand: strand("Integers", "Enteros"),
    title: { en: "Zero pairs", es: "Pares cero" },
  },
  "g7-signed-chips": {
    strand: strand("Rational numbers", "Números racionales"),
    title: { en: "Signed decimal chips", es: "Fichas decimales con signo" },
  },
  "g7-zero-sum": {
    strand: strand("Rational numbers", "Números racionales"),
    title: { en: "Zero-sum combinations", es: "Combinaciones que suman cero" },
  },
  "g7-exponent-discs": {
    strand: strand("Exponents", "Exponentes"),
    title: { en: "Powers-of-ten discs", es: "Discos de potencias de diez" },
  },
  "g8-sci-build": {
    strand: strand("Scientific notation", "Notación científica"),
    title: { en: "Build scientific notation", es: "Construye notación científica" },
  },
  "g8-exp-equivalence": {
    strand: strand("Scientific notation", "Notación científica"),
    title: { en: "Same value, new exponent", es: "Mismo valor, otro exponente" },
  },
};

const UI = {
  mat: ["Your build", "Tu construcción"],
  tray: ["Pieces", "Piezas"],
  worth: ["Your build is worth {value}", "Tu construcción vale {value}"],
  worthEmpty: ["Your build is worth 0. Add a piece.", "Tu construcción vale 0. Agrega una pieza."],
  rules: ["Rules", "Reglas"],
  ruleMet: ["met", "se cumple"],
  ruleOpen: ["not yet", "todavía no"],
  have: ["you have {n}", "tienes {n}"],
  addPiece: ["Add {name}", "Agregar {name}"],
  removePiece: ["Remove {name}", "Quitar {name}"],
  count: ["{n} on the mat", "{n} en la mesa"],
  undo: ["Undo", "Deshacer"],
  clear: ["Clear all", "Borrar todo"],
  check: ["Check my build", "Revisar mi construcción"],
  keep: ["Keep build {n}", "Guardar construcción {n}"],
  checkBoth: ["Check both builds", "Revisar las dos construcciones"],
  change: ["Change build {n}", "Cambiar construcción {n}"],
  keptTitle: ["Build {n}", "Construcción {n}"],
  kept: [
    "Build {n} is saved. Now make a different build.",
    "La construcción {n} está guardada. Ahora haz una construcción diferente.",
  ],
  added: ["Added {name}. {value} so far.", "Se agregó {name}. Van {value}."],
  removed: ["Removed {name}. {value} so far.", "Se quitó {name}. Van {value}."],
  nothingToRemove: ["There is no {name} to remove.", "No hay {name} para quitar."],
  full: [
    "The mat is full. Take a piece away first.",
    "La mesa está llena. Quita una pieza primero.",
  ],
  maxed: ["No more of that piece fit on the mat.", "Ya no caben más de esa pieza en la mesa."],
  cleared: ["Cleared. Your build is worth 0.", "Borrado. Tu construcción vale 0."],
  undone: ["Undone. {value} so far.", "Deshecho. Van {value}."],
  nothingToUndo: ["There is nothing to undo.", "No hay nada que deshacer."],
  frame: ["Ten-frame", "Cuadro de diez"],
  chartTitle: ["Place-value chart", "Tabla de valor posicional"],
  tilesTitle: ["Digit tiles", "Fichas de dígitos"],
  slotEmpty: ["{place}: empty", "{place}: vacío"],
  slotFilled: ["{place}: tile {d}", "{place}: ficha {d}"],
  tileUsed: ["Tile {d} (already placed)", "Ficha {d} (ya colocada)"],
  tileFree: ["Tile {d}", "Ficha {d}"],
  placed: ["Put tile {d} in the {place}. {value}", "Pusiste la ficha {d} en {place}. {value}"],
  lifted: ["Took tile {d} out of the {place}.", "Sacaste la ficha {d} de {place}."],
  chartValue: ["Your number is {value}", "Tu número es {value}"],
  chartValueOpen: [
    "Your number: place every tile to see it",
    "Tu número: coloca todas las fichas para verlo",
  ],
  sciTitle: ["Scientific notation builder", "Constructor de notación científica"],
  coefficient: ["Coefficient", "Coeficiente"],
  exponent: ["Exponent", "Exponente"],
  digitUp: ["Increase the {place} digit", "Subir la cifra de {place}"],
  digitDown: ["Decrease the {place} digit", "Bajar la cifra de {place}"],
  digitValue: ["{place} digit: {d}", "Cifra de {place}: {d}"],
  expUp: ["Increase the exponent", "Subir el exponente"],
  expDown: ["Decrease the exponent", "Bajar el exponente"],
  sciValue: ["{coef} × 10^{exp} = {value}", "{coef} × 10^{exp} = {value}"],
  edge: ["That is as far as it goes.", "Hasta aquí se puede."],
  buildsHeading: ["Your builds", "Tus construcciones"],
};
const fill = (text, vars = {}) =>
  text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
export const t = (key, lang, vars) => fill(UI[key][lang === "en" ? 0 : 1], vars);

export const PLACE_NAMES = {
  en: ["ones", "tens", "hundreds", "thousands", "ten thousands", "hundred thousands"],
  es: ["unidades", "decenas", "centenas", "millares", "decenas de millar", "centenas de millar"],
};
export const SCI_PLACE_NAMES = {
  en: ["hundreds", "tens", "ones", "tenths", "hundredths"],
  es: ["centenas", "decenas", "unidades", "décimas", "centésimas"],
};
