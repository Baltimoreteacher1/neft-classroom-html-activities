// Picture content for the K–3 pages (src/early/phonics.js, src/early/words.js): the Sound Builder word sets, the
// picture word card decks and the garden plot pictures. Pictures are emoji content, kept here with the other
// authored content so the interface source stays emoji-free (tools/access-design-system.test.mjs).

/** The Sound Builder garden: a plot before and after a word is built. */
export const GARDEN = { grown: "🌻", empty: "🟫" };

/** Word sets by band: [word, sound tiles, picture]. Grades 2–3 add digraphs and blends. */
export const SETS = {
  K: [
    ["cat", ["c", "a", "t"], "🐈"],
    ["sun", ["s", "u", "n"], "☀️"],
    ["map", ["m", "a", "p"], "🗺️"],
    ["pig", ["p", "i", "g"], "🐖"],
    ["hen", ["h", "e", "n"], "🐔"],
    ["bus", ["b", "u", "s"], "🚌"],
  ],
  1: [
    ["dog", ["d", "o", "g"], "🐕"],
    ["fan", ["f", "a", "n"], "🪭"],
    ["net", ["n", "e", "t"], "🥅"],
    ["cup", ["c", "u", "p"], "🥤"],
    ["bed", ["b", "e", "d"], "🛏️"],
    ["fox", ["f", "o", "x"], "🦊"],
    ["web", ["w", "e", "b"], "🕸️"],
    ["pen", ["p", "e", "n"], "🖊️"],
  ],
  "2-3": [
    ["ship", ["sh", "i", "p"], "🚢"],
    ["chick", ["ch", "i", "ck"], "🐤"],
    ["fish", ["f", "i", "sh"], "🐟"],
    ["duck", ["d", "u", "ck"], "🦆"],
    ["frog", ["f", "r", "o", "g"], "🐸"],
    ["stop", ["s", "t", "o", "p"], "🛑"],
    ["tent", ["t", "e", "n", "t"], "⛺"],
    ["crab", ["c", "r", "a", "b"], "🦀"],
  ],
};

/** Decks: { id, title: [en, es], cards: [[english, spanish, picture]] }. */
export const DECKS = [
  {
    id: "garden",
    title: ["In the garden", "En el huerto"],
    cards: [
      ["seed", "semilla", "🌰"],
      ["flower", "flor", "🌼"],
      ["tomato", "tomate", "🍅"],
      ["carrot", "zanahoria", "🥕"],
      ["worm", "gusano", "🪱"],
      ["sun", "sol", "☀️"],
      ["water", "agua", "💧"],
      ["leaf", "hoja", "🍃"],
    ],
  },
  {
    id: "food",
    title: ["Food", "Comida"],
    cards: [
      ["apple", "manzana", "🍎"],
      ["banana", "plátano", "🍌"],
      ["bread", "pan", "🍞"],
      ["milk", "leche", "🥛"],
      ["egg", "huevo", "🥚"],
      ["rice", "arroz", "🍚"],
      ["cheese", "queso", "🧀"],
      ["grapes", "uvas", "🍇"],
    ],
  },
  {
    id: "school",
    title: ["At school", "En la escuela"],
    cards: [
      ["book", "libro", "📘"],
      ["pencil", "lápiz", "✏️"],
      ["crayon", "crayón", "🖍️"],
      ["scissors", "tijeras", "✂️"],
      ["backpack", "mochila", "🎒"],
      ["teacher", "maestra", "👩‍🏫"],
      ["bus", "autobús", "🚌"],
      ["clock", "reloj", "🕒"],
    ],
  },
  {
    id: "weather",
    title: ["Weather", "El tiempo"],
    cards: [
      ["sunny", "soleado", "☀️"],
      ["rainy", "lluvioso", "🌧️"],
      ["cloudy", "nublado", "☁️"],
      ["windy", "ventoso", "💨"],
      ["snowy", "nevado", "❄️"],
      ["umbrella", "paraguas", "☂️"],
      ["coat", "abrigo", "🧥"],
      ["boots", "botas", "🥾"],
    ],
  },
  {
    id: "animals",
    title: ["Animals", "Animales"],
    cards: [
      ["cat", "gato", "🐈"],
      ["dog", "perro", "🐕"],
      ["bird", "pájaro", "🐦"],
      ["fish", "pez", "🐟"],
      ["frog", "rana", "🐸"],
      ["duck", "pato", "🦆"],
      ["bee", "abeja", "🐝"],
      ["rabbit", "conejo", "🐇"],
    ],
  },
  {
    id: "feelings",
    title: ["Feelings", "Sentimientos"],
    cards: [
      ["happy", "feliz", "😄"],
      ["sad", "triste", "😢"],
      ["angry", "enojado", "😠"],
      ["scared", "asustado", "😨"],
      ["tired", "cansado", "😴"],
      ["surprised", "sorprendido", "😮"],
      ["silly", "chistoso", "🤪"],
      ["calm", "tranquilo", "😌"],
    ],
  },
];
