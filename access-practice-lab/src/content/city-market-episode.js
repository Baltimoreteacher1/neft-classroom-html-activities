// Language City episode: Saturday at the Community Market (/city/market/community-market).
// An illustrated outdoor market on the Corner Market's block. The learner inspects signs and goods, hears vendors talk
// with a shopper, compares prices, shops for a recipe inside a budget, rehearses a question aloud and writes a short
// message. One scene for every support level; only the language expected of the learner changes by level:
//   A  more support:  pictures with every word, a word bank, short sentence starters
//   B  some support:  sentence frames, one comparison
//   C  on my own:     compare and explain with connected sentences (because / but / so)
// Every price is in whole cents so the arithmetic is exact (tools/access-city-market.test.mjs recomputes it).
// Every learner-facing string is a { en, es } pair. Practice, not a test: nothing here is a WIDA or ACCESS item.
import { bi } from "./city-kit.js";

export const EPISODE_ID = "community-market";
export const EPISODE_PLACE = "market";
export const LEVELS = ["A", "B", "C"];

export const TITLE = bi("Saturday at the Community Market", "Sábado en el Mercado Comunitario");
export const BLURB = bi(
  "Explore the market, listen to the vendors, compare prices and shop for a taco recipe with $10.00.",
  "Explora el mercado, escucha a los vendedores, compara precios y compra lo necesario para unos tacos con $10.00.",
);

/** What each support level asks for. The scene and the facts never change. */
export const LEVEL_INFO = {
  A: {
    label: bi("More support", "Más apoyo"),
    expect: bi(
      "Pictures with every word, a word bank and short sentence starters.",
      "Dibujos con cada palabra, un banco de palabras y comienzos de oración cortos.",
    ),
  },
  B: {
    label: bi("Some support", "Algo de apoyo"),
    expect: bi(
      "Sentence frames. You compare two prices and say what you bought.",
      "Estructuras de oración. Comparas dos precios y dices qué compraste.",
    ),
  },
  C: {
    label: bi("On my own", "Por mi cuenta"),
    expect: bi(
      "Compare the offers and explain your decisions in connected sentences with because, but and so.",
      "Compara las ofertas y explica tus decisiones con oraciones conectadas usando because, but y so.",
    ),
  },
};

// ── people ──────────────────────────────────────────────────────────────────
export const PEOPLE = {
  delgado: {
    name: "Mr. Delgado",
    role: bi("produce vendor", "vendedor de frutas y verduras"),
    look: { skin: "#e0ac84", hair: "#2b1b12", style: "cap", shirt: "#5A9481", acc: "none" },
  },
  haddad: {
    name: "Mr. Haddad",
    role: bi("baker", "panadero"),
    look: { skin: "#c98e62", hair: "#2a1d17", style: "short", shirt: "#ea8a2b", acc: "none" },
  },
  okafor: {
    name: "Ms. Okafor",
    role: bi("farmer", "granjera"),
    look: { skin: "#7d4b2e", hair: "#1b1b1b", style: "bun", shirt: "#3b7dc4", acc: "none" },
  },
  maya: {
    name: "Maya",
    role: bi("shopper", "compradora"),
    look: { skin: "#e9b48a", hair: "#4a2f20", style: "ponytail", shirt: "#c8553d", acc: "none" },
  },
};

// ── the stalls (camera stops) ────────────────────────────────────────────────
/** `focus` is the scene x (0-100%) the camera centres on when the learner visits a stall. */
export const STALLS = [
  { id: "all", name: bi("Whole market", "Todo el mercado"), focus: 50 },
  { id: "produce", name: bi("Produce stall", "Puesto de verduras"), focus: 27 },
  { id: "bakery", name: bi("Bakery stall", "Puesto de panadería"), focus: 54 },
  { id: "farm", name: bi("Farm stand", "Puesto de la granja"), focus: 80.5 },
];

// ── what is for sale (cents) ─────────────────────────────────────────────────
/**
 * `count` is how many come in one purchase, `covers` names the recipe need it fills. The shopping step buys each item
 * once, in the amount the recipe uses (4 tomatoes, 1 pepper), so the learner compares packs rather than counting.
 */
export const ITEMS = [
  {
    id: "tomatoes",
    stall: "produce",
    name: bi("4 tomatoes", "4 tomates"),
    detail: bi("$0.50 each", "$0.50 cada uno"),
    unitCents: 50,
    qty: 4,
    covers: "tomato",
    count: 4,
  },
  {
    id: "pepper",
    stall: "produce",
    name: bi("1 green pepper", "1 pimiento verde"),
    detail: bi("$1.00 each", "$1.00 cada uno"),
    unitCents: 100,
    qty: 1,
    covers: "pepper",
    count: 1,
  },
  {
    id: "avocado",
    stall: "produce",
    name: bi("1 avocado", "1 aguacate"),
    detail: bi("$1.50 each", "$1.50 cada uno"),
    unitCents: 150,
    qty: 1,
    covers: "",
    count: 1,
  },
  {
    id: "corn",
    stall: "bakery",
    name: bi("Corn tortillas, pack of 10", "Tortillas de maíz, paquete de 10"),
    detail: bi("$3.00 a pack", "$3.00 el paquete"),
    unitCents: 300,
    qty: 1,
    covers: "tortilla",
    count: 10,
  },
  {
    id: "flour",
    stall: "bakery",
    name: bi("Flour tortillas, pack of 8", "Tortillas de harina, paquete de 8"),
    detail: bi("$4.00 a pack", "$4.00 el paquete"),
    unitCents: 400,
    qty: 1,
    covers: "tortilla",
    count: 8,
  },
  {
    id: "shredded",
    stall: "farm",
    name: bi("Shredded cheese, 8-ounce bag", "Queso rallado, bolsa de 8 onzas"),
    detail: bi("$3.50 a bag", "$3.50 la bolsa"),
    unitCents: 350,
    qty: 1,
    covers: "cheese",
    count: 1,
  },
  {
    id: "block",
    stall: "farm",
    name: bi("Block cheese, 8 ounces", "Queso en bloque, 8 onzas"),
    detail: bi("$4.50 a block", "$4.50 el bloque"),
    unitCents: 450,
    qty: 1,
    covers: "cheese",
    count: 1,
  },
  {
    id: "eggs",
    stall: "farm",
    name: bi("Eggs, one dozen", "Huevos, una docena"),
    detail: bi("$4.00 a dozen", "$4.00 la docena"),
    unitCents: 400,
    qty: 1,
    covers: "",
    count: 12,
  },
];
export const itemOf = (id) => ITEMS.find((i) => i.id === id) || null;
export const costOf = (item) => item.unitCents * item.qty;

/** The offer on the bakery sign: two packs of corn tortillas for $5.00. Not needed for 8 tortillas. */
export const OFFER = { item: "corn", packs: 2, cents: 500 };

// ── the recipe and the budget ────────────────────────────────────────────────
export const BUDGET_CENTS = 1000;
/** The recipe needs; `count` is the least amount that fills the need. */
export const RECIPE = {
  title: bi("Veggie tacos for 4 people", "Tacos de verduras para 4 personas"),
  needs: [
    { id: "tortilla", count: 8, label: bi("8 tortillas", "8 tortillas") },
    { id: "cheese", count: 1, label: bi("1 bag or block of cheese", "1 bolsa o bloque de queso") },
    { id: "tomato", count: 4, label: bi("4 tomatoes", "4 tomates") },
    { id: "pepper", count: 1, label: bi("1 green pepper", "1 pimiento verde") },
  ],
};

// ── what the learner can inspect ─────────────────────────────────────────────
/**
 * Inspectable spots on the scene. `at` is the centre as % of the scene width and height. A `sign` spot shows a printed
 * sign (lines are [en, es]); every spot puts one word in the learner's word basket. `icon` names the small picture
 * the word gets at level A (src/views/city-episode-art.js ICONS).
 */
const sign = (head, lines) => ({ head: bi(...head), lines: lines.map(([en, es]) => bi(en, es)) });
const word = (en, es, defEn, defEs, icon) => ({ en, es, def: bi(defEn, defEs), icon });

export const SPOTS = [
  {
    id: "hours",
    stall: "produce",
    at: [13.5, 57.5],
    label: bi("market sign", "letrero del mercado"),
    sign: sign(
      ["Community Market", "Mercado Comunitario"],
      [
        ["Open Saturdays", "Abierto los sábados"],
        ["8:00 a.m. to 1:00 p.m.", "de 8:00 a. m. a 1:00 p. m."],
        ["Cash and cards", "Efectivo y tarjetas"],
      ],
    ),
    word: word("open", "abierto", "ready for shoppers", "listo para los compradores", "clock"),
  },
  {
    id: "recipe",
    stall: "bakery",
    at: [43, 80],
    label: bi("Maya's recipe card", "la tarjeta de receta de Maya"),
    sign: sign(
      ["Veggie tacos for 4 people", "Tacos de verduras para 4 personas"],
      [
        ["8 tortillas", "8 tortillas"],
        ["1 bag or block of cheese", "1 bolsa o bloque de queso"],
        ["4 tomatoes and 1 green pepper", "4 tomates y 1 pimiento verde"],
        ["Money to spend: $10.00", "Dinero para gastar: $10.00"],
      ],
    ),
    word: word(
      "budget",
      "presupuesto",
      "the money you can spend",
      "el dinero que puedes gastar",
      "wallet",
    ),
  },
  {
    id: "produce-sign",
    stall: "produce",
    at: [17, 44.5],
    label: bi("produce price board", "pizarra de precios de verduras"),
    sign: sign(
      ["Fresh today", "Fresco hoy"],
      [
        ["Tomatoes · $0.50 each", "Tomates · $0.50 cada uno"],
        ["Green peppers · $1.00 each", "Pimientos verdes · $1.00 cada uno"],
        ["Avocados · $1.50 each", "Aguacates · $1.50 cada uno"],
      ],
    ),
    word: word("each", "cada uno", "for one of them", "por uno solo", "one"),
  },
  {
    id: "tomatoes",
    stall: "produce",
    at: [22, 64],
    label: bi("tomatoes", "tomates"),
    word: word("tomato", "tomate", "a round red vegetable", "una verdura roja y redonda", "tomato"),
  },
  {
    id: "peppers",
    stall: "produce",
    at: [29, 64],
    label: bi("green peppers", "pimientos verdes"),
    word: word(
      "green pepper",
      "pimiento verde",
      "a green vegetable, crunchy and hollow",
      "una verdura verde, crujiente y hueca",
      "pepper",
    ),
  },
  {
    id: "bakery-sign",
    stall: "bakery",
    at: [43.5, 44.5],
    label: bi("bakery price board", "pizarra de precios de la panadería"),
    sign: sign(
      ["Baked this morning", "Horneado esta mañana"],
      [
        ["Corn tortillas · pack of 10 · $3.00", "Tortillas de maíz · paquete de 10 · $3.00"],
        ["Flour tortillas · pack of 8 · $4.00", "Tortillas de harina · paquete de 8 · $4.00"],
        [
          "Offer: 2 packs of corn tortillas for $5.00",
          "Oferta: 2 paquetes de tortillas de maíz por $5.00",
        ],
      ],
    ),
    word: word("offer", "oferta", "a special price", "un precio especial", "tag"),
  },
  {
    id: "tortillas",
    stall: "bakery",
    at: [50, 64],
    label: bi("tortillas", "tortillas"),
    word: word(
      "pack",
      "paquete",
      "a group of things sold together",
      "un grupo de cosas que se venden juntas",
      "tortilla",
    ),
  },
  {
    id: "farm-sign",
    stall: "farm",
    at: [70, 44.5],
    label: bi("farm stand price board", "pizarra de precios de la granja"),
    sign: sign(
      ["From our farm", "De nuestra granja"],
      [
        ["Shredded cheese · 8-ounce bag · $3.50", "Queso rallado · bolsa de 8 onzas · $3.50"],
        ["Block cheese · 8 ounces · $4.50", "Queso en bloque · 8 onzas · $4.50"],
        ["Eggs · one dozen · $4.00", "Huevos · una docena · $4.00"],
      ],
    ),
    word: word(
      "shredded",
      "rallado",
      "cut into thin little pieces",
      "cortado en pedacitos finos",
      "grater",
    ),
  },
  {
    id: "cheese",
    stall: "farm",
    at: [76, 64],
    label: bi("cheese", "queso"),
    word: word("cheese", "queso", "a food made from milk", "un alimento hecho de leche", "cheese"),
  },
  {
    id: "coins",
    stall: "farm",
    at: [90, 64],
    label: bi("cash box", "caja del dinero"),
    word: word("change", "cambio", "the money you get back", "el dinero que te devuelven", "coins"),
  },
];
export const spotOf = (id) => SPOTS.find((s) => s.id === id) || null;

/** How many spots a level asks the learner to inspect before moving on. */
export const SPOTS_NEEDED = { A: 5, B: 6, C: 8 };

// ── the conversation (listening) ─────────────────────────────────────────────
/** One line per turn. `who` is a PEOPLE key. The totals spoken here match ITEMS (the test recomputes them). */
export const DIALOGUE = [
  {
    who: "delgado",
    ...bi(
      "Good morning! Tomatoes are fifty cents each today.",
      "¡Buenos días! Hoy los tomates cuestan cincuenta centavos cada uno.",
    ),
  },
  {
    who: "maya",
    ...bi(
      "Good morning. I need four tomatoes and one green pepper for tacos.",
      "Buenos días. Necesito cuatro tomates y un pimiento verde para unos tacos.",
    ),
  },
  {
    who: "delgado",
    ...bi(
      "That is three dollars. The bakery has tortillas, and the farm stand has cheese.",
      "Son tres dólares. La panadería tiene tortillas y el puesto de la granja tiene queso.",
    ),
  },
  {
    who: "haddad",
    ...bi(
      "Corn tortillas are three dollars for a pack of ten. Flour tortillas are four dollars for a pack of eight.",
      "Las tortillas de maíz cuestan tres dólares el paquete de diez. Las de harina cuestan cuatro dólares el paquete de ocho.",
    ),
  },
  {
    who: "maya",
    ...bi(
      "I only have ten dollars, so I need to compare prices.",
      "Solo tengo diez dólares, así que necesito comparar precios.",
    ),
  },
  {
    who: "okafor",
    ...bi(
      "The shredded cheese is three fifty. The block is four fifty, but you have to grate it yourself.",
      "El queso rallado cuesta tres cincuenta. El bloque cuesta cuatro cincuenta, pero tienes que rallarlo tú.",
    ),
  },
];

// ── check questions (one per level, per step) ───────────────────────────────
const options = (rows) =>
  rows.map(([id, en, es, whyEn, whyEs]) => ({ id, ...bi(en, es), why: bi(whyEn, whyEs) }));
const question = (askEn, askEs, rows, answer) => ({
  ask: bi(askEn, askEs),
  opts: options(rows),
  answer,
});

export const LISTEN_Q = {
  A: question(
    "How much is one tomato?",
    "¿Cuánto cuesta un tomate?",
    [
      [
        "a",
        "Three dollars",
        "Tres dólares",
        "Three dollars is what Maya pays for four tomatoes and a pepper together.",
        "Tres dólares es lo que Maya paga por cuatro tomates y un pimiento juntos.",
      ],
      [
        "b",
        "Fifty cents",
        "Cincuenta centavos",
        "Yes. Mr. Delgado says tomatoes are fifty cents each.",
        "Sí. El señor Delgado dice que los tomates cuestan cincuenta centavos cada uno.",
      ],
      [
        "c",
        "Ten dollars",
        "Diez dólares",
        "Ten dollars is all the money Maya has.",
        "Diez dólares es todo el dinero que tiene Maya.",
      ],
    ],
    "b",
  ),
  B: question(
    "How much does Maya pay Mr. Delgado?",
    "¿Cuánto le paga Maya al señor Delgado?",
    [
      [
        "a",
        "Fifty cents",
        "Cincuenta centavos",
        "That is the price of one tomato. Maya buys more than one thing.",
        "Ese es el precio de un tomate. Maya compra más de una cosa.",
      ],
      [
        "b",
        "Four dollars",
        "Cuatro dólares",
        "Four dollars is the price of the flour tortillas at the bakery.",
        "Cuatro dólares es el precio de las tortillas de harina en la panadería.",
      ],
      [
        "c",
        "Three dollars",
        "Tres dólares",
        "Yes. Four tomatoes at fifty cents is two dollars, plus one dollar for the pepper.",
        "Sí. Cuatro tomates a cincuenta centavos son dos dólares, más un dólar por el pimiento.",
      ],
    ],
    "c",
  ),
  C: question(
    "Why does Maya say she needs to compare prices?",
    "¿Por qué dice Maya que necesita comparar precios?",
    [
      [
        "a",
        "The bakery closes soon.",
        "La panadería cierra pronto.",
        "Nobody talks about closing time in the conversation.",
        "Nadie habla de la hora de cierre en la conversación.",
      ],
      [
        "b",
        "She has only ten dollars, so she must choose carefully.",
        "Solo tiene diez dólares, así que debe elegir con cuidado.",
        "Yes. She has only ten dollars, and the word so tells you what she must do next.",
        "Sí. Solo tiene diez dólares, y la palabra so te dice lo que debe hacer.",
      ],
      [
        "c",
        "Mr. Delgado has no tomatoes.",
        "El señor Delgado no tiene tomates.",
        "He sells her four tomatoes, so he has them.",
        "Él le vende cuatro tomates, así que sí tiene.",
      ],
    ],
    "b",
  ),
};

export const READ_Q = {
  A: question(
    "Read the market sign. What time does the market close?",
    "Lee el letrero del mercado. ¿A qué hora cierra el mercado?",
    [
      [
        "a",
        "8:00 a.m.",
        "8:00 a. m.",
        "8:00 a.m. is when the market opens.",
        "Las 8:00 a. m. es cuando el mercado abre.",
      ],
      [
        "b",
        "10:00 a.m.",
        "10:00 a. m.",
        "Look again: 10:00 is not on the sign.",
        "Mira otra vez: las 10:00 no están en el letrero.",
      ],
      [
        "c",
        "1:00 p.m.",
        "1:00 p. m.",
        "Yes. The sign says 8:00 a.m. to 1:00 p.m.",
        "Sí. El letrero dice de 8:00 a. m. a 1:00 p. m.",
      ],
    ],
    "c",
  ),
  B: question(
    "Compare the bakery prices. Which pack of tortillas costs less?",
    "Compara los precios de la panadería. ¿Qué paquete de tortillas cuesta menos?",
    [
      [
        "a",
        "The corn tortillas",
        "Las tortillas de maíz",
        "Yes. A pack of corn tortillas is $3.00 and a pack of flour tortillas is $4.00.",
        "Sí. Un paquete de maíz cuesta $3.00 y uno de harina cuesta $4.00.",
      ],
      [
        "b",
        "The flour tortillas",
        "Las tortillas de harina",
        "Check the price of each pack on the bakery board.",
        "Revisa el precio de cada paquete en la pizarra de la panadería.",
      ],
      [
        "c",
        "They cost the same",
        "Cuestan lo mismo",
        "The two packs have different prices on the board.",
        "Los dos paquetes tienen precios diferentes en la pizarra.",
      ],
    ],
    "a",
  ),
  C: question(
    "The bakery offer is 2 packs of corn tortillas for $5.00. Is the offer a good choice for Maya's recipe?",
    "La oferta de la panadería es 2 paquetes de tortillas de maíz por $5.00. ¿Es una buena opción para la receta de Maya?",
    [
      [
        "a",
        "Yes, because 2 packs for $5.00 costs less than 1 pack.",
        "Sí, porque 2 paquetes por $5.00 cuestan menos que 1 paquete.",
        "Compare the totals: one pack alone costs $3.00.",
        "Compara los totales: un paquete solo cuesta $3.00.",
      ],
      [
        "b",
        "Yes, because the recipe needs 20 tortillas.",
        "Sí, porque la receta necesita 20 tortillas.",
        "Read the recipe card again for the number of tortillas.",
        "Lee otra vez la tarjeta de receta para ver el número de tortillas.",
      ],
      [
        "c",
        "No. One pack has 10 tortillas, which is enough for 8, so the offer costs $2.00 more than she needs to spend.",
        "No. Un paquete trae 10 tortillas, suficientes para 8, así que la oferta cuesta $2.00 más de lo que necesita gastar.",
        "Yes. 10 is enough for 8, and $5.00 minus $3.00 is $2.00 extra.",
        "Sí. 10 alcanzan para 8, y $5.00 menos $3.00 son $2.00 de más.",
      ],
    ],
    "c",
  ),
};

// ── speaking: ask a vendor a question ───────────────────────────────────────
export const SPEAK = {
  A: {
    task: bi("Ask Ms. Okafor about the cheese.", "Pregúntale a la señora Okafor por el queso."),
    starters: [
      bi("How much is ___?", "¿Cuánto cuesta ___?"),
      bi("Do you have ___?", "¿Tiene ___?"),
    ],
    bank: ["cheese", "shredded", "each"],
    model: bi("How much is the shredded cheese?", "¿Cuánto cuesta el queso rallado?"),
  },
  B: {
    task: bi(
      "Ask Ms. Okafor to tell you the price of each cheese.",
      "Pide a la señora Okafor que te diga el precio de cada queso.",
    ),
    starters: [
      bi("Excuse me, how much is ___ ?", "Disculpe, ¿cuánto cuesta ___?"),
      bi("Is the ___ cheaper than the ___ ?", "¿Es el ___ más barato que el ___?"),
    ],
    bank: [],
    model: bi(
      "Excuse me, how much is the block cheese? Is the shredded cheese cheaper than the block?",
      "Disculpe, ¿cuánto cuesta el queso en bloque? ¿Es el queso rallado más barato que el bloque?",
    ),
  },
  C: {
    task: bi(
      "Ask Ms. Okafor which cheese is better for tacos, and explain why you are asking.",
      "Pregunta a la señora Okafor qué queso es mejor para tacos y explica por qué preguntas.",
    ),
    starters: [
      bi(
        "Excuse me, which cheese is better for ___ , the ___ or the ___ ?",
        "Disculpe, ¿qué queso es mejor para ___, el ___ o el ___?",
      ),
      bi("I am asking because ___ , so ___ .", "Pregunto porque ___, así que ___."),
    ],
    bank: [],
    model: bi(
      "Excuse me, which cheese is better for tacos, the shredded or the block? I am asking because I have only ten dollars, so I need the one that costs less and is ready to use.",
      "Disculpe, ¿qué queso es mejor para tacos, el rallado o el de bloque? Pregunto porque solo tengo diez dólares, así que necesito el que cueste menos y esté listo para usar.",
    ),
  },
};

// ── writing: a short message home ───────────────────────────────────────────
export const WRITE = {
  A: {
    task: bi(
      "Write a message to Grandma Lucía. Say what you bought.",
      "Escribe un mensaje a la abuela Lucía. Di qué compraste.",
    ),
    frames: [bi("I bought ___ .", "Compré ___."), bi("It cost ___ .", "Costó ___.")],
    bank: ["tomato", "green pepper", "pack", "cheese", "change"],
    minWords: 4,
  },
  B: {
    task: bi(
      "Write a message to Grandma Lucía. Say what you bought, the total and the money left.",
      "Escribe un mensaje a la abuela Lucía. Di qué compraste, el total y el dinero que sobró.",
    ),
    frames: [
      bi("I bought ___ and ___ .", "Compré ___ y ___."),
      bi("The total was ___ . I have ___ left.", "El total fue ___. Me sobran ___."),
    ],
    bank: [],
    minWords: 10,
  },
  C: {
    task: bi(
      "Write a message to Grandma Lucía that explains your choices. Connect your ideas with because, but and so.",
      "Escribe un mensaje a la abuela Lucía que explique tus decisiones. Conecta tus ideas con because, but y so.",
    ),
    frames: [
      bi("I chose the ___ because ___ .", "Elegí ___ porque ___."),
      bi("The ___ looked good, but ___ .", "El ___ se veía bien, pero ___."),
      bi("I had $10.00, so ___ .", "Tenía $10.00, así que ___."),
    ],
    bank: [],
    minWords: 25,
  },
};
/** The Writing Revolution conjunctions the level C self-check looks for. Shown, never scored. */
export const CONNECTORS = ["because", "but", "so"];

// ── the chain ────────────────────────────────────────────────────────────────
/** The six steps in order, each with the domain it practises. */
export const STEPS = [
  { id: "look", domain: "Reading", title: bi("Look around", "Mira a tu alrededor") },
  { id: "listen", domain: "Listening", title: bi("Listen", "Escucha") },
  { id: "compare", domain: "Reading", title: bi("Compare", "Compara") },
  { id: "shop", domain: "Reading", title: bi("Shop", "Compra") },
  { id: "speak", domain: "Speaking", title: bi("Ask", "Pregunta") },
  { id: "write", domain: "Writing", title: bi("Write", "Escribe") },
];
export const DOMAIN_NAME = {
  Listening: bi("Listening", "Escuchar"),
  Reading: bi("Reading", "Leer"),
  Speaking: bi("Speaking", "Hablar"),
  Writing: bi("Writing", "Escribir"),
};
