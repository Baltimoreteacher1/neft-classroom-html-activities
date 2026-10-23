// Spanish wording for the Fluency Lab's generated question stems. A learner can peek at the Spanish and hear it
// read aloud while the English stays on screen, so the English is still what they practice. Only the words
// change: every number, symbol and variable is copied from the English question. A stem with no words in it
// (for example "34 + 50 = ?") has no Spanish and returns null. tools/fluency-language.test.mjs generates
// thousands of questions across all 88 skills and fails on any wordy stem that has no rule here.
const NUM = String.raw`[-−]?\d[\d,]*(?:\.\d+)?`;
const VAL = String.raw`(?:${NUM}(?: \d+/\d+)?|\d+/\d+)`;
const PAIR = String.raw`\([^)]*\)`;

const PLACES = {
  ones: "las unidades",
  tens: "las decenas",
  hundreds: "las centenas",
  thousands: "las unidades de millar",
  "ten-thousands": "las decenas de millar",
  "hundred-thousands": "las centenas de millar",
  tenths: "las décimas",
  hundredths: "las centésimas",
  thousandths: "las milésimas",
};
const ROUND_TO = {
  ten: "la decena",
  hundred: "la centena",
  thousand: "la unidad de millar",
  tenth: "la décima",
  hundredth: "la centésima",
};
// [Spanish plural, "m"/"f"] so "cuántos / cuántas" agrees.
const UNITS = {
  hours: ["horas", "f"],
  minutes: ["minutos", "m"],
  seconds: ["segundos", "m"],
  days: ["días", "m"],
  weeks: ["semanas", "f"],
  yards: ["yardas", "f"],
  feet: ["pies", "m"],
  inches: ["pulgadas", "f"],
  miles: ["millas", "f"],
  meters: ["metros", "m"],
  centimeters: ["centímetros", "m"],
  millimeters: ["milímetros", "m"],
  kilometers: ["kilómetros", "m"],
  kilograms: ["kilogramos", "m"],
  grams: ["gramos", "m"],
  pounds: ["libras", "f"],
  ounces: ["onzas", "f"],
  liters: ["litros", "m"],
  milliliters: ["mililitros", "m"],
  gallons: ["galones", "m"],
  quarts: ["cuartos", "m"],
  pints: ["pintas", "f"],
  cups: ["tazas", "f"],
};
const ONE = {
  horas: "hora", minutos: "minuto", segundos: "segundo", días: "día", semanas: "semana", yardas: "yarda", pies: "pie",
  pulgadas: "pulgada", millas: "milla", metros: "metro", centímetros: "centímetro", milímetros: "milímetro",
  kilómetros: "kilómetro", kilogramos: "kilogramo", gramos: "gramo", libras: "libra", onzas: "onza", litros: "litro",
  mililitros: "mililitro", galones: "galón", cuartos: "cuarto", pintas: "pinta", tazas: "taza",
};
const unitWord = (en, count = "2") => (count === "1" ? ONE[UNITS[en]?.[0]] : UNITS[en]?.[0]) || en;
const how = (en) => (UNITS[en]?.[1] === "f" ? "cuántas" : "cuántos");

// [pattern, builder(match) → Spanish]. Patterns are anchored on the whole stem; order matters only where noted.
const RULES = [
  [
    /^What is the value of the digit in the ([\w-]+) place of (.+)\?$/,
    (m) => `¿Cuál es el valor del dígito en el lugar de ${PLACES[m[1]]} de ${m[2]}?`,
  ],
  [
    /^What digit is in the ([\w-]+) place of (.+)\?$/,
    (m) => `¿Qué dígito está en el lugar de ${PLACES[m[1]]} de ${m[2]}?`,
  ],
  [
    new RegExp(`^(.+) \\+ □ = (.+)\\. What belongs in the box\\?$`),
    (m) => `${m[1]} + □ = ${m[2]}. ¿Qué número va en el recuadro?`,
  ],
  [
    /^What time is (\d+) minutes after (\d+:\d+)\?$/,
    (m) => `¿Qué hora será ${m[1]} minutos después de ${m[2].startsWith("1:") ? "la" : "las"} ${m[2]}?`,
  ],
  [/^A strip starts at (\d+) cm and ends at (\d+) cm on a ruler\. How long is the strip\?$/, (m) => `Una tira empieza en ${m[1]} cm y termina en ${m[2]} cm en una regla. ¿Cuánto mide la tira?`],
  [/^A class vote shows apples: (\d+), bananas: (\d+), oranges: (\d+), pears: (\d+)\. Which fruit got the most votes\?$/, (m) => `Una votación de la clase muestra manzanas: ${m[1]}, plátanos: ${m[2]}, naranjas: ${m[3]}, peras: ${m[4]}. ¿Qué fruta obtuvo más votos?`],
  [/^A scale drawing uses 1 cm to represent (\d+) m\. A wall is (\d+) cm long in the drawing\. How long is the real wall in meters\?$/, (m) => `En un dibujo a escala, 1 cm representa ${m[1]} m. Una pared mide ${m[2]} cm en el dibujo. ¿Cuánto mide la pared real en metros?`],
  [/^One of two vertical angles measures (\d+)°\. What is the measure of the other angle\?$/, (m) => `Uno de dos ángulos opuestos por el vértice mide ${m[1]}°. ¿Cuánto mide el otro ángulo?`],
  [/^Two (complementary|supplementary) angles include one angle that measures (\d+)°\. What is the other angle\?$/, (m) => `Dos ángulos ${m[1] === "complementary" ? "complementarios" : "suplementarios"} incluyen uno que mide ${m[2]}°. ¿Cuánto mide el otro ángulo?`],
  [/^Is (.+) even or odd\?$/, (m) => `¿Es ${m[1]} par o impar?`],
  [
    /^(\d+) quarters \+ (\d+) dimes \+ (\d+) nickels \+ (\d+) pennies = how many cents\?$/,
    (m) =>
      `Monedas de veinticinco centavos: ${m[1]}; de diez centavos: ${m[2]}; de cinco centavos: ${m[3]}; de un centavo: ${m[4]}. ¿Cuántos centavos hay en total?`,
  ],
  [
    /^Round (.+) to the nearest (ten|hundred|thousand|tenth|hundredth)\.$/,
    (m) => `Redondea ${m[1]} a ${ROUND_TO[m[2]]} más cercana.`,
  ],
  [
    new RegExp(`^Area of a rectangle with length (.+) and width (.+)\\?$`),
    (m) => `¿Cuál es el área de un rectángulo con largo ${m[1]} y ancho ${m[2]}?`,
  ],
  [/^Area of a triangle with base (.+) and height (.+)\?$/, (m) => `¿Cuál es el área de un triángulo con base ${m[1]} y altura ${m[2]}?`],
  [/^A ribbon that is 1\/(\d+) meter long is shared equally by (\d+) students\. What length of ribbon does each student get\?$/, (m) => `Una cinta de 1/${m[1]} metro de largo se reparte por igual entre ${m[2]} estudiantes. ¿Cuánto mide la parte que recibe cada estudiante?`],
  [/^A jug holds (\d+) liters\. How many 1\/(\d+)-liter servings can it fill\?$/, (m) => `Una jarra contiene ${m[1]} litros. ¿Cuántas porciones de 1/${m[2]} litro se pueden servir?`],
  [
    new RegExp(`^Perimeter of a rectangle with length (.+) and width (.+)\\?$`),
    (m) => `¿Cuál es el perímetro de un rectángulo con largo ${m[1]} y ancho ${m[2]}?`,
  ],
  [
    /^What is the (\d+)(?:st|nd|rd|th) multiple of (.+)\?$/,
    (m) => `¿Cuál es el ${m[1]}.º múltiplo de ${m[2]}?`,
  ],
  [/^Is (.+) a factor of (.+)\?$/, (m) => `¿Es ${m[1]} un factor de ${m[2]}?`],
  [/^How many factors does (.+) have\?$/, (m) => `¿Cuántos factores tiene ${m[1]}?`],
  [/^Is (.+) prime or composite\?$/, (m) => `¿Es ${m[1]} primo o compuesto?`],
  [/^Is (.+) a multiple of (.+)\?$/, (m) => `¿Es ${m[1]} múltiplo de ${m[2]}?`],
  [new RegExp(`^What is (\\d+/\\d+) of (${VAL})\\?$`), (m) => `¿Cuánto es ${m[1]} de ${m[2]}?`],
  [
    /^Volume of a rectangular prism: (.+)\?$/,
    (m) => `Prisma rectangular: ${m[1]}. ¿Cuál es su volumen?`,
  ],
  [
    /^Find the GCF of (.+) and (.+)\.$/,
    (m) => `Halla el máximo común divisor (MCD) de ${m[1]} y ${m[2]}.`,
  ],
  [
    /^Find the LCM of (.+) and (.+)\.$/,
    (m) => `Halla el mínimo común múltiplo (MCM) de ${m[1]} y ${m[2]}.`,
  ],
  [
    /^(.+) for (.+) items\. How much for (.+) item\?$/,
    (m) => `${m[2]} artículos cuestan ${m[1]}. ¿Cuánto cuesta ${m[3]} artículo?`,
  ],
  [
    /^(.+) ([a-z]+) = how many ([a-z]+)\?$/,
    (m) => `${m[1]} ${unitWord(m[2], m[1])} = ¿${how(m[3])} ${unitWord(m[3])}?`,
  ],
  [/^What is (.+)% of (.+)\?$/, (m) => `¿Cuánto es el ${m[1]}% de ${m[2]}?`],
  [/^Evaluate (.+) when ([a-z]) = (.+)\.$/, (m) => `Evalúa ${m[1]} cuando ${m[2]} = ${m[3]}.`],
  [/^(.+) and (.+)\. Find ([a-z])\.$/, (m) => `Primera ecuación: ${m[1]}. Segunda ecuación: ${m[2]}. Halla ${m[3]}.`],
  [/^(.+)\. Find ([a-z])\.$/, (m) => `${m[1]}. Halla ${m[2]}.`],
  [/^Which quadrant contains (\(.+\))\?$/, (m) => `¿En qué cuadrante está ${m[1]}?`],
  [
    /^(.+) with a (.+)% (increase|decrease) equals what\?$/,
    (m) =>
      `Si ${m[1]} tiene ${m[3] === "increase" ? "un aumento" : "una disminución"} del ${m[2]}%, ¿cuál es el nuevo valor?`,
  ],
  [/^Is (.+) a solution to (.+)\?$/, (m) => `¿Es ${m[1]} una solución de ${m[2]}?`],
  [
    /^A circle has radius (.+)\. What number multiplies π to give its area\?$/,
    (m) => `Un círculo tiene un radio de ${m[1]}. ¿Qué número se multiplica por π para obtener su área?`,
  ],
  [
    /^(.+) of (.+) equal sections are winning sections\. What is P\(win\)\?$/,
    (m) => `${m[1]} de ${m[2]} secciones iguales son ganadoras. ¿Cuál es P(ganar)?`,
  ],
  [
    /^Find the (median|range|mean): (.+)\.$/,
    (m) => `Halla ${{ median: "la mediana", range: "el rango", mean: "la media" }[m[1]]}: ${m[2]}.`,
  ],
  [
    new RegExp(`^Find the slope through (${PAIR}) and (${PAIR})\\.$`),
    (m) => `Halla la pendiente de la recta que pasa por ${m[1]} y ${m[2]}.`,
  ],
  [
    /^If ([^,]+?),? find ([a-z]) when ([a-z]) = (.+)\.$/,
    (m) => `Si ${m[1]}, halla ${m[2]} cuando ${m[3]} = ${m[4]}.`,
  ],
  [
    new RegExp(`^Reflect (${PAIR}) across the (x-axis|y-axis|origin)\\.$`),
    (m) =>
      `Refleja ${m[1]} ${{ "x-axis": "sobre el eje x", "y-axis": "sobre el eje y", origin: "respecto al origen" }[m[2]]}.`,
  ],
  [
    /^A right triangle has legs (.+) and (.+)\. Find the hypotenuse\.$/,
    (m) => `Un triángulo rectángulo tiene catetos ${m[1]} y ${m[2]}. Halla la hipotenusa.`,
  ],
  [
    /^A data table has x-values (.+) and y-values (.+)\. Which association best describes the data\?$/,
    (m) =>
      `En una tabla de datos, los valores de x son ${m[1]}. Los valores de y son ${m[2]}. ¿Qué asociación describe mejor los datos?`,
  ],
];

// True when the English stem is more than numbers and symbols, so a missing rule is a gap worth reporting.
export const isWordy = (text) => /[A-Za-z]{3,}/.test(String(text || "").replace(/\b[xy]\b/g, ""));

export function questionEs(item) {
  if (!item) return null;
  if (item.questionEs) return item.questionEs;
  const text = String(item.question || "").trim();
  for (const [pattern, build] of RULES) {
    const match = text.match(pattern);
    if (match) return build(match);
  }
  return null;
}

const CHOICES = {
  even: "par", odd: "impar", yes: "sí", no: "no", prime: "primo", composite: "compuesto",
  positive: "positiva", negative: "negativa", none: "ninguna",
};
// Spanish for the word choices on a multiple-choice item ("even", "odd", ...); symbols and numbers pass through.
export function choicesEs(item) {
  const labels = (item?.choices || []).map((choice) => (typeof choice === "string" ? choice : choice?.label || choice?.text || ""));
  if (!labels.some((label) => CHOICES[String(label).toLowerCase()])) return null;
  return labels.map((label) => CHOICES[String(label).toLowerCase()] || label);
}

