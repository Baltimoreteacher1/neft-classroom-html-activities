// es-unit-lexicon.mjs — deterministic Spanish for the SHORT, formulaic answer
// choices in small-group practice ("18 sq ft", "3x + 12", "-12°C and 12°C").
//
// WHY A LEXICON INSTEAD OF HAND-AUTHORING ALL 1,306 CHOICES
//
// Most choices are a number and a unit. Typing 1,300 of those by hand is not
// translation work, it is transcription work — and transcription is where the
// typos live: one mistyped digit in a distractor silently changes which answer
// is correct. A lexicon translates the WORD and copies the NUMBER verbatim, so
// no quantity can drift, and every phrase in the curriculum has exactly one
// Spanish form.
//
// It is deliberately narrow. A choice is translated only when the whole string
// is recognised: a numeric quantity plus a known unit, a pure algebraic
// expression (identical in both languages), or a conjunction of parts that each
// pass on their own. Anything with prose in it — "18 is the part, 30% is the
// percent" — returns null and goes to the hand-authored translation memory.

/** Unit and count nouns, longest match first. Symbols that are already
 *  international (cm, m³, mL, kg, km, GB, °C, %) stay as they are. */
const UNITS = {
  // time
  hours: "horas",
  hour: "hora",
  minutes: "minutos",
  minute: "minuto",
  seconds: "segundos",
  second: "segundo",
  days: "días",
  day: "día",
  weeks: "semanas",
  week: "semana",
  months: "meses",
  month: "mes",
  years: "años",
  year: "año",
  // length / area / volume, imperial
  "square feet": "pies cuadrados",
  "square foot": "pie cuadrado",
  "square inches": "pulgadas cuadradas",
  "square inch": "pulgada cuadrada",
  "cubic feet": "pies cúbicos",
  "cubic foot": "pie cúbico",
  "cubic inches": "pulgadas cúbicas",
  "cubic inch": "pulgada cúbica",
  "cubic centimeters": "centímetros cúbicos",
  "sq ft": "pies cuadrados",
  "sq in": "pulgadas cuadradas",
  "sq cm": "cm cuadrados",
  "sq m": "m cuadrados",
  feet: "pies",
  foot: "pie",
  inches: "pulgadas",
  inch: "pulgada",
  yards: "yardas",
  yard: "yarda",
  miles: "millas",
  mile: "milla",
  meters: "metros",
  meter: "metro",
  centimeters: "centímetros",
  kilometers: "kilómetros",
  ft: "pies",
  in: "pulgadas",
  "in²": "pulg²",
  "in³": "pulg³",
  "ft²": "pies²",
  "ft³": "pies³",
  // capacity / mass
  gallons: "galones",
  gallon: "galón",
  quarts: "cuartos de galón",
  cups: "tazas",
  cup: "taza",
  pounds: "libras",
  pound: "libra",
  ounces: "onzas",
  ounce: "onza",
  liters: "litros",
  liter: "litro",
  // money & counting nouns that appear as answer units
  dollars: "dólares",
  dollar: "dólar",
  cents: "centavos",
  points: "puntos",
  point: "punto",
  units: "unidades",
  unit: "unidad",
  steps: "pasos",
  step: "paso",
  moves: "movimientos",
  move: "movimiento",
  times: "veces",
  rotations: "rotaciones",
  rotation: "rotación",
  "round trips": "viajes de ida y vuelta",
  "round trip": "viaje de ida y vuelta",
  rides: "viajes",
  ride: "viaje",
  trips: "viajes",
  trip: "viaje",
  laps: "vueltas",
  lap: "vuelta",
  pages: "páginas",
  page: "página",
  books: "libros",
  book: "libro",
  shapes: "figuras",
  shape: "figura",
  teeth: "dientes",
  tooth: "diente",
  leaves: "hojas",
  leaf: "hoja",
  plants: "plantas",
  plant: "planta",
  flowers: "flores",
  flower: "flor",
  seeds: "semillas",
  cars: "carros",
  car: "carro",
  buses: "autobuses",
  bus: "autobús",
  tokens: "fichas",
  token: "ficha",
  games: "juegos",
  game: "juego",
  players: "jugadores",
  player: "jugador",
  students: "estudiantes",
  student: "estudiante",
  people: "personas",
  passengers: "pasajeros",
  cookies: "galletas",
  batches: "tandas",
  boxes: "cajas",
  box: "caja",
  bags: "bolsas",
  bag: "bolsa",
  packs: "paquetes",
  pack: "paquete",
  pencils: "lápices",
  pencil: "lápiz",
  markers: "marcadores",
  stickers: "calcomanías",
  tiles: "azulejos",
  cubes: "cubos",
  cube: "cubo",
  shots: "tiros",
  shot: "tiro",
  goals: "goles",
  quarters: "monedas de 25¢",
  dimes: "monedas de 10¢",
  nickels: "monedas de 5¢",
  pennies: "monedas de 1¢",
  degrees: "grados",
  slices: "rebanadas",
  servings: "porciones",
  scoops: "bolas",
  laps_: "vueltas",
};

/** Units whose Spanish form is the source string unchanged. */
const IDENTICAL = new Set([
  "cm",
  "cm²",
  "cm³",
  "m",
  "m²",
  "m³",
  "km",
  "mm",
  "mL",
  "L",
  "kg",
  "g",
  "GB",
  "MB",
  "°C",
  "°F",
  "%",
]);

const UNIT_KEYS = Object.keys(UNITS)
  .concat([...IDENTICAL])
  .sort((a, b) => b.length - a.length);

/** A leading quantity: digits, decimal point, thousands commas, sign, $, fractions. */
const QUANTITY = /^[-−+]?\$?\d[\d,.]*(?:\s*[½¼¾⅓⅔])?%?/;

/** Pure math: digits, single-letter variables, operators, parentheses. Reads
 *  identically in Spanish, so it is passed through rather than "translated". */
const EXPRESSION = /^[\s\d\p{L}+\-−*/=<>≤≥().,^²³·×÷$%]*$/u;
const hasWord = (text) => /[a-zA-Z]{2,}/.test(text);

/** Translate one atomic part ("18 sq ft"), or null when it is not recognised. */
function part(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // "3x + 12", "12n = 30", "-40", "$12.75", "0.25 rotations" handled below —
  // an expression with no word characters is identical in Spanish.
  if (!hasWord(trimmed) && EXPRESSION.test(trimmed)) return trimmed;

  const quantity = trimmed.match(QUANTITY);
  if (!quantity) return null;
  const rest = trimmed.slice(quantity[0].length).trim();
  if (!rest) return trimmed;
  if (IDENTICAL.has(rest)) return trimmed;
  for (const key of UNIT_KEYS) {
    if (rest.toLowerCase() !== key.toLowerCase()) continue;
    const spanish = IDENTICAL.has(key) ? key : UNITS[key];
    return `${quantity[0]} ${spanish}`;
  }
  return null;
}

/**
 * Spanish for a formulaic choice, or null when the string needs a human.
 *
 * @param {string} text
 * @returns {string|null}
 */
export function translateChoice(text) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) return null;

  // Estimation answers ("About 400 hours") are a quantity behind one word.
  const about = trimmed.match(/^About\s+(.+)$/i);
  if (about) {
    const rest = translateChoice(about[1]);
    return rest ? `Aproximadamente ${rest}` : null;
  }

  // "-12°C and 12°C", "4 hours to 6 cm", "10 and 12" — a conjunction survives
  // only when BOTH sides survive on their own.
  for (const [pattern, joiner] of [
    [/\s+and\s+/, " y "],
    [/\s+to\s+/, " a "],
    [/\s+vs\.?\s+/, " vs. "],
  ]) {
    if (!pattern.test(trimmed)) continue;
    const pieces = trimmed.split(pattern);
    if (pieces.length !== 2) return null;
    const translated = pieces.map(part);
    if (translated.some((piece) => piece === null)) return null;
    return translated.join(joiner);
  }
  return part(trimmed);
}
