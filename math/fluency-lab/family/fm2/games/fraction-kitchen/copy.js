// Fraction Kitchen: game-level copy (title, how to play, together text), food and ingredient names, and the
// fraction words used in equations. Everything is {en, es}; Spanish is natural classroom Spanish. @fm2 FM-020 FM-021
export const GAME_COPY = {
  title: { en: "Fraction Kitchen", es: "Cocina de Fracciones" },
  tagline: { en: "Cut, serve and pour fractions.", es: "Corta, sirve y mide fracciones." },
  howTo: {
    en: [
      "Read the kitchen order at the top. It tells you what to make: a fair share, a pour, or a pitcher of scoops.",
      "Use the tools: cut a shape into equal parts, tap pieces to serve them, choose a cup and pour mark by mark, or tap scoops into the pitcher.",
      "Look at the picture and the equation under it. They always say the same thing. Parts must be the same size to count as a fraction.",
      "Press the check button when you are ready. Use Undo for the last step, or Reset this puzzle to start again.",
    ],
    es: [
      "Lee el pedido de la cocina arriba. Te dice qué preparar: una parte justa, una medida o una jarra de cucharones.",
      "Usa las herramientas: corta una figura en partes iguales, toca las piezas para servirlas, elige una taza y vierte marca por marca, o toca cucharones para llenar la jarra.",
      "Mira el dibujo y la ecuación de abajo. Siempre dicen lo mismo. Las partes deben ser del mismo tamaño para contar como fracción.",
      "Presiona el botón de revisar cuando estés listo. Usa Deshacer para el último paso o Reiniciar este reto para empezar de nuevo.",
    ],
  },
  together: {
    en: "Take turns being the cook and the checker. The cook builds the order with the tools. The checker reads the equation out loud and asks: How do you know the parts are equal? Could you make the same amount a different way?",
    es: "Túrnense para ser el cocinero y el revisor. El cocinero arma el pedido con las herramientas. El revisor lee la ecuación en voz alta y pregunta: ¿Cómo sabes que las partes son iguales? ¿Podrías hacer la misma cantidad de otra manera?",
  },
};

export const ICON =
  '<svg viewBox="0 0 36 36" aria-hidden="true" focusable="false"><circle cx="15" cy="16" r="11" fill="#fbefcf" stroke="#1f2740" stroke-width="2"/><path d="M15 16 L15 5 A11 11 0 0 1 26 16 Z" fill="#1d9a6c" stroke="#1f2740" stroke-width="2" stroke-linejoin="round"/><rect x="24" y="19" width="9" height="13" rx="2" fill="#dcebfb" stroke="#1f2740" stroke-width="2"/><path d="M24 25 H33" stroke="#1f2740" stroke-width="2"/></svg>';

export const FOOD_IDS = { circle: ["pizza", "pie", "tortilla"], bar: ["sandwich", "chocolate", "brownies"] };
export const FOODS = {
  pizza: { en: { the: "the pizza", a: "a pizza", one: "pizza", pl: "pizzas" }, es: { the: "la pizza", ofthe: "de la pizza", a: "una pizza", one: "pizza", pl: "pizzas" } },
  pie: { en: { the: "the pie", a: "a pie", one: "pie", pl: "pies" }, es: { the: "el pastel", ofthe: "del pastel", a: "un pastel", one: "pastel", pl: "pasteles" } },
  tortilla: { en: { the: "the tortilla", a: "a tortilla", one: "tortilla", pl: "tortillas" }, es: { the: "la tortilla", ofthe: "de la tortilla", a: "una tortilla", one: "tortilla", pl: "tortillas" } },
  sandwich: { en: { the: "the sandwich", a: "a sandwich", one: "sandwich", pl: "sandwiches" }, es: { the: "el sándwich", ofthe: "del sándwich", a: "un sándwich", one: "sándwich", pl: "sándwiches" } },
  chocolate: { en: { the: "the chocolate bar", a: "a chocolate bar", one: "chocolate bar", pl: "chocolate bars" }, es: { the: "la barra de chocolate", ofthe: "de la barra de chocolate", a: "una barra de chocolate", one: "barra de chocolate", pl: "barras de chocolate" } },
  brownies: { en: { the: "the pan of brownies", a: "a pan of brownies", one: "pan of brownies", pl: "pans of brownies" }, es: { the: "la bandeja de brownies", ofthe: "de la bandeja de brownies", a: "una bandeja de brownies", one: "bandeja de brownies", pl: "bandejas de brownies" } },
};

export const INGREDIENTS = ["milk", "juice", "water", "broth"];
export const ING = {
  milk: { en: "milk", es: "leche" },
  juice: { en: "juice", es: "jugo" },
  water: { en: "water", es: "agua" },
  broth: { en: "broth", es: "caldo" },
};

const NAMES = {
  2: ["half", "halves", "medio", "medios"],
  3: ["third", "thirds", "tercio", "tercios"],
  4: ["fourth", "fourths", "cuarto", "cuartos"],
  5: ["fifth", "fifths", "quinto", "quintos"],
  6: ["sixth", "sixths", "sexto", "sextos"],
  7: ["seventh", "sevenths", "séptimo", "séptimos"],
  8: ["eighth", "eighths", "octavo", "octavos"],
  9: ["ninth", "ninths", "noveno", "novenos"],
  10: ["tenth", "tenths", "décimo", "décimos"],
  11: ["eleventh", "elevenths", "onceavo", "onceavos"],
  12: ["twelfth", "twelfths", "doceavo", "doceavos"],
};
// "fourths" (plural name of the parts when cut into d), or "3 fourths" with a count.
export function partName(d, lang, count = null) {
  const row = NAMES[d];
  if (!row) return `1/${d}`;
  const shift = lang === "es" ? 2 : 0;
  const word = count === 1 ? row[shift] : row[shift + 1];
  return count === null ? row[shift + 1] : `${count} ${word}`;
}

export const cap = (text) => text.replace(/^./, (c) => c.toUpperCase());
export const foodText = (id, lang) => FOODS[id][lang];

export const PLACE_NAMES = {
  en: ["ones", "tenths", "hundredths", "thousandths"],
  es: ["unidades", "décimos", "centésimos", "milésimos"],
};

const PLACE_ONE = {
  en: ["one", "tenth", "hundredth", "thousandth"],
  es: ["unidad", "décimo", "centésimo", "milésimo"],
};
// "1 tenth", "7 tenths"
export const placeCount = (place, count, lang) =>
  `${count} ${count === 1 ? PLACE_ONE[lang][place] : PLACE_NAMES[lang][place]}`;
