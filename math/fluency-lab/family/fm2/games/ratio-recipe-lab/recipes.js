// The pantry: bilingual units, ingredient rows and recipe cards. No brands. `opts` are the whole-number amounts one batch
// may use, `fopts` the fractional ones ([n, d]); both are chosen so that sensible multiples stay physically plausible.
// @fm2 FM-014 FM-059
export const UNITS = {
  cup: { en: ["cup", "cups"], es: ["taza", "tazas"] },
  tbsp: { en: ["tablespoon", "tablespoons"], es: ["cucharada", "cucharadas"] },
  scoop: { en: ["scoop", "scoops"], es: ["cucharón", "cucharones"] },
  gallon: { en: ["gallon", "gallons"], es: ["galón", "galones"] },
  ml: { en: ["mL", "mL"], es: ["mL", "mL"] },
  mile: { en: ["mile", "miles"], es: ["milla", "millas"], bare: true },
  hour: { en: ["hour", "hours"], es: ["hora", "horas"], bare: true },
  cm: { en: ["cm", "cm"], es: ["cm", "cm"], bare: true },
  inch: { en: ["inch", "inches"], es: ["pulgada", "pulgadas"], bare: true },
  meter: { en: ["m", "m"], es: ["m", "m"], bare: true },
  foot: { en: ["foot", "feet"], es: ["pie", "pies"], bare: true },
  usd: { prefix: "$", en: ["dollar", "dollars"], es: ["dólar", "dólares"], bare: true },
  minute: { en: ["minute", "minutes"], es: ["minuto", "minutos"], bare: true },
  liter: { en: ["liter", "liters"], es: ["litro", "litros"], bare: true },
  plain: { en: ["", ""], es: ["", ""], bare: true },
};

// A measured ingredient (2 cups of flour) and a counted one (3 eggs).
export const measured = (key, en, es, unit) => ({ key, name: { en, es }, unit });
export const counted = (key, enOne, enMany, esOne, esMany) => ({
  key,
  name: { en: enMany, es: esMany },
  noun: { en: [enOne, enMany], es: [esOne, esMany] },
});

export const PEOPLE = counted("serves", "person", "people", "persona", "personas");
export const BATCHES = counted("batches", "batch", "batches", "tanda", "tandas");

const withOpts = (row, opts, fopts = []) => ({ ...row, opts, fopts });

export const COOK = [
  {
    id: "pancakes",
    family: "cook",
    name: { en: "pancakes", es: "panqueques" },
    serves: [2, 4, 6],
    rows: [
      withOpts(
        measured("flour", "flour", "harina", "cup"),
        [2, 3],
        [
          [1, 2],
          [3, 4],
          [1, 4],
        ],
      ),
      withOpts(
        measured("milk", "milk", "leche", "cup"),
        [1, 2],
        [
          [1, 2],
          [2, 3],
          [3, 4],
        ],
      ),
      withOpts(counted("eggs", "egg", "eggs", "huevo", "huevos"), [1, 2]),
      withOpts(measured("sugar", "sugar", "azúcar", "tbsp"), [1, 2, 3]),
    ],
  },
  {
    id: "muffins",
    family: "cook",
    name: { en: "muffins", es: "muffins" },
    serves: [6],
    rows: [
      withOpts(
        measured("flour", "flour", "harina", "cup"),
        [2, 3],
        [
          [3, 4],
          [1, 2],
        ],
      ),
      withOpts(
        measured("sugar", "sugar", "azúcar", "cup"),
        [1, 2],
        [
          [1, 2],
          [1, 4],
          [3, 4],
        ],
      ),
      withOpts(counted("eggs", "egg", "eggs", "huevo", "huevos"), [1, 2]),
      withOpts(measured("butter", "butter", "mantequilla", "tbsp"), [2, 4]),
    ],
  },
  {
    id: "smoothie",
    family: "cook",
    name: { en: "smoothie", es: "batido de frutas" },
    serves: [2, 4],
    rows: [
      withOpts(counted("bananas", "banana", "bananas", "plátano", "plátanos"), [1, 2]),
      withOpts(
        measured("yogurt", "yogurt", "yogur", "cup"),
        [1, 2],
        [
          [1, 2],
          [3, 4],
          [1, 4],
        ],
      ),
      withOpts(
        measured("juice", "juice", "jugo", "cup"),
        [1, 2],
        [
          [1, 2],
          [1, 4],
          [2, 3],
        ],
      ),
    ],
  },
  {
    id: "lemonade",
    family: "cook",
    name: { en: "lemonade", es: "limonada" },
    serves: [4, 6],
    rows: [
      withOpts(counted("lemons", "lemon", "lemons", "limón", "limones"), [2, 3, 4]),
      withOpts(measured("water", "water", "agua", "cup"), [4, 6]),
      withOpts(measured("sugar", "sugar", "azúcar", "tbsp"), [2, 3, 4]),
    ],
  },
  {
    id: "trail-mix",
    family: "cook",
    name: { en: "trail mix", es: "mezcla de frutos secos" },
    serves: [4, 6, 8],
    rows: [
      withOpts(
        measured("nuts", "nuts", "nueces", "cup"),
        [2, 3],
        [
          [3, 4],
          [1, 2],
        ],
      ),
      withOpts(
        measured("raisins", "raisins", "pasas", "cup"),
        [1, 2],
        [
          [1, 4],
          [1, 2],
          [2, 3],
        ],
      ),
      withOpts(
        measured("seeds", "seeds", "semillas", "cup"),
        [1],
        [
          [1, 2],
          [1, 4],
        ],
      ),
    ],
  },
  {
    id: "rice",
    family: "cook",
    name: { en: "rice", es: "arroz" },
    serves: [4, 6],
    rows: [
      withOpts(
        measured("rice", "rice", "arroz", "cup"),
        [1, 2],
        [
          [3, 4],
          [1, 2],
        ],
      ),
      withOpts(measured("water", "water", "agua", "cup"), [2, 3, 4], [[3, 2]]),
      withOpts(measured("oil", "oil", "aceite", "tbsp"), [1, 2]),
    ],
  },
  {
    id: "soup",
    family: "crowd",
    name: { en: "vegetable soup", es: "sopa de verduras" },
    serves: [4, 6],
    rows: [
      withOpts(measured("broth", "broth", "caldo", "cup"), [4, 6, 8]),
      withOpts(measured("noodles", "noodles", "fideos", "cup"), [1, 2, 3]),
      withOpts(counted("carrots", "carrot", "carrots", "zanahoria", "zanahorias"), [2, 3, 4]),
    ],
  },
  {
    id: "cocoa",
    family: "cook",
    name: { en: "hot cocoa", es: "chocolate caliente" },
    serves: [2, 4],
    rows: [
      withOpts(measured("milk", "milk", "leche", "cup"), [2, 3, 4]),
      withOpts(measured("cocoa", "cocoa", "cacao", "tbsp"), [2, 3, 4]),
      withOpts(measured("sugar", "sugar", "azúcar", "tbsp"), [1, 2]),
    ],
  },
  {
    id: "punch",
    family: "crowd",
    name: {
      en: "fruit punch for the school picnic",
      es: "ponche de frutas para el picnic escolar",
    },
    serves: [8, 10],
    rows: [
      withOpts(measured("juice", "juice", "jugo", "cup"), [2, 3, 4]),
      withOpts(measured("sparkling", "sparkling water", "agua con gas", "cup"), [2, 3]),
      withOpts(counted("limes", "lime", "limes", "lima", "limas"), [1, 2]),
    ],
  },
  {
    id: "play-dough",
    family: "cook",
    name: { en: "play dough", es: "plastilina casera" },
    serves: null,
    rows: [
      withOpts(measured("flour", "flour", "harina", "cup"), [2, 3, 4]),
      withOpts(measured("salt", "salt", "sal", "cup"), [1], [[1, 2]]),
      withOpts(
        measured("water", "water", "agua", "cup"),
        [1, 2],
        [
          [3, 4],
          [1, 2],
        ],
      ),
    ],
  },
];

// Two-part mixes whose parts are counted things (tiles, beads) or measured things (paint, plant food).
export const PAIRS = [
  {
    id: "tiles",
    family: "craft",
    esArt: "Un",
    name: { en: "tile pattern", es: "patrón de fichas" },
    a: counted("blue", "blue tile", "blue tiles", "ficha azul", "fichas azules"),
    b: counted("white", "white tile", "white tiles", "ficha blanca", "fichas blancas"),
  },
  {
    id: "beads",
    family: "craft",
    esArt: "Una",
    name: { en: "bracelet", es: "pulsera" },
    a: counted("red", "red bead", "red beads", "cuenta roja", "cuentas rojas"),
    b: counted("blue", "blue bead", "blue beads", "cuenta azul", "cuentas azules"),
  },
  {
    id: "stickers",
    family: "craft",
    esArt: "Una",
    name: { en: "sticker sheet", es: "hoja de calcomanías" },
    a: counted(
      "stars",
      "star sticker",
      "star stickers",
      "calcomanía de estrella",
      "calcomanías de estrella",
    ),
    b: counted(
      "hearts",
      "heart sticker",
      "heart stickers",
      "calcomanía de corazón",
      "calcomanías de corazón",
    ),
  },
];

// Measured two-part mixes: [paint-like part, other part].
export const MIXES = [
  {
    id: "green",
    family: "craft",
    esArt: "Una",
    name: { en: "green paint", es: "pintura verde" },
    mixName: { en: "green paint mix", es: "mezcla de pintura verde" },
    a: measured("blue", "blue paint", "pintura azul", "cup"),
    b: measured("yellow", "yellow paint", "pintura amarilla", "cup"),
    word: { en: "paint", es: "pintura" },
  },
  {
    id: "plant-food",
    family: "craft",
    esArt: "Un",
    name: { en: "plant food", es: "abono para plantas" },
    mixName: { en: "plant food mix", es: "mezcla de abono para plantas" },
    a: measured("food", "plant food", "abono", "scoop"),
    b: measured("water", "water", "agua", "gallon"),
    word: { en: "plant food", es: "abono" },
  },
  {
    id: "juice-mix",
    family: "craft",
    esArt: "Una",
    name: { en: "juice mix", es: "mezcla de jugo" },
    mixName: { en: "juice mix", es: "mezcla de jugo" },
    a: measured("concentrate", "juice concentrate", "concentrado de jugo", "cup"),
    b: measured("water", "water", "agua", "cup"),
    word: { en: "concentrate", es: "concentrado" },
  },
  {
    id: "dye",
    family: "craft",
    esArt: "Un",
    name: { en: "fabric dye", es: "tinte para tela" },
    mixName: { en: "fabric dye mix", es: "tinte para tela" },
    a: measured("dye", "dye", "tinte", "cup"),
    b: measured("water", "water", "agua", "gallon"),
    word: { en: "dye", es: "tinte" },
  },
];

export const K_ITEMS = [
  measured("raisins", "raisins", "pasas", "scoop"),
  measured("berries", "blueberries", "arándanos", "scoop"),
  measured("cereal", "cereal", "cereal", "scoop"),
  measured("seeds", "seeds", "semillas", "scoop"),
  measured("nuts", "nuts", "nueces", "scoop"),
  measured("corn", "corn", "maíz", "scoop"),
  measured("pasta", "pasta shells", "conchas de pasta", "scoop"),
  measured("popcorn", "popcorn", "palomitas", "scoop"),
  measured("grapes", "grapes", "uvas", "scoop"),
  measured("crackers", "crackers", "galletas saladas", "scoop"),
  measured("beans", "beans", "frijoles", "scoop"),
  measured("oats", "oats", "avena", "scoop"),
];
export const BOWLS = counted("bowls", "bowl", "bowls", "tazón", "tazones");

export const STICKER_ITEMS = [
  counted("count", "sticker", "stickers", "calcomanía", "calcomanías"),
  counted("count", "marble", "marbles", "canica", "canicas"),
  counted("count", "cherry", "cherries", "cereza", "cerezas"),
  counted("count", "shell", "shells", "concha", "conchas"),
  counted("count", "card", "cards", "tarjeta", "tarjetas"),
];
