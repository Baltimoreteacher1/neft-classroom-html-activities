// The market's stock: generic goods with English and Spanish names (no brands). `g` is the Spanish grammatical gender
// ("m"/"f"), used only for "a/one", "each" and "the". Prices are chosen by the generators; these are display names.
export const ITEMS = [
  { id: "marble", en: "marble", enPl: "marbles", es: "canica", esPl: "canicas", g: "f", lo: 5, hi: 25 },
  { id: "button", en: "button", enPl: "buttons", es: "botón", esPl: "botones", g: "m", lo: 5, hi: 30 },
  { id: "balloon", en: "balloon", enPl: "balloons", es: "globo", esPl: "globos", g: "m", lo: 10, hi: 50 },
  { id: "star", en: "sticker", enPl: "stickers", es: "calcomanía", esPl: "calcomanías", g: "f", lo: 5, hi: 25 },
  { id: "banana", en: "banana", enPl: "bananas", es: "plátano", esPl: "plátanos", g: "m", lo: 20, hi: 60 },
  { id: "apple", en: "apple", enPl: "apples", es: "manzana", esPl: "manzanas", g: "f", lo: 30, hi: 90 },
  { id: "pencil", en: "pencil", enPl: "pencils", es: "lápiz", esPl: "lápices", g: "m", lo: 25, hi: 95 },
  { id: "pear", en: "pear", enPl: "pears", es: "pera", esPl: "peras", g: "f", lo: 40, hi: 100 },
  { id: "orange", en: "orange", enPl: "oranges", es: "naranja", esPl: "naranjas", g: "f", lo: 40, hi: 100 },
  { id: "eraser", en: "eraser", enPl: "erasers", es: "borrador", esPl: "borradores", g: "m", lo: 40, hi: 120 },
  { id: "cookie", en: "cookie", enPl: "cookies", es: "galleta", esPl: "galletas", g: "f", lo: 50, hi: 200 },
  { id: "granola", en: "granola bar", enPl: "granola bars", es: "barra de granola", esPl: "barras de granola", g: "f", lo: 80, hi: 200 },
  { id: "juice", en: "juice box", enPl: "juice boxes", es: "caja de jugo", esPl: "cajas de jugo", g: "f", lo: 75, hi: 250 },
  { id: "sticker", en: "sticker pack", enPl: "sticker packs", es: "paquete de calcomanías", esPl: "paquetes de calcomanías", g: "m", lo: 100, hi: 300 },
  { id: "notebook", en: "notebook", enPl: "notebooks", es: "cuaderno", esPl: "cuadernos", g: "m", lo: 150, hi: 450 },
  { id: "bread", en: "loaf of bread", enPl: "loaves of bread", es: "pan", esPl: "panes", g: "m", lo: 200, hi: 450 },
  { id: "crayons", en: "box of crayons", enPl: "boxes of crayons", es: "caja de crayones", esPl: "cajas de crayones", g: "f", lo: 200, hi: 400 },
  { id: "milk", en: "carton of milk", enPl: "cartons of milk", es: "cartón de leche", esPl: "cartones de leche", g: "m", lo: 250, hi: 500 },
  { id: "sandwich", en: "sandwich", enPl: "sandwiches", es: "sándwich", esPl: "sándwiches", g: "m", lo: 300, hi: 650 },
  { id: "ball", en: "ball", enPl: "balls", es: "pelota", esPl: "pelotas", g: "f", lo: 300, hi: 900 },
  { id: "car", en: "toy car", enPl: "toy cars", es: "carrito de juguete", esPl: "carritos de juguete", g: "m", lo: 300, hi: 900 },
  { id: "book", en: "book", enPl: "books", es: "libro", esPl: "libros", g: "m", lo: 500, hi: 1200 },
  { id: "bottle", en: "water bottle", enPl: "water bottles", es: "botella de agua", esPl: "botellas de agua", g: "f", lo: 600, hi: 1400 },
  { id: "cap", en: "cap", enPl: "caps", es: "gorra", esPl: "gorras", g: "f", lo: 800, hi: 1500 },
  { id: "game", en: "board game", enPl: "board games", es: "juego de mesa", esPl: "juegos de mesa", g: "m", lo: 1500, hi: 4500 },
  { id: "helmet", en: "bike helmet", enPl: "bike helmets", es: "casco de bicicleta", esPl: "cascos de bicicleta", g: "m", lo: 2000, hi: 5000 },
  { id: "backpack", en: "backpack", enPl: "backpacks", es: "mochila", esPl: "mochilas", g: "f", lo: 2500, hi: 6000 },
  { id: "jacket", en: "jacket", enPl: "jackets", es: "chaqueta", esPl: "chaquetas", g: "f", lo: 3000, hi: 9000 },
  { id: "skateboard", en: "skateboard", enPl: "skateboards", es: "patineta", esPl: "patinetas", g: "f", lo: 4000, hi: 10000 },
  { id: "tablet", en: "tablet", enPl: "tablets", es: "tableta", esPl: "tabletas", g: "f", lo: 10000, hi: 35000 },
  { id: "bicycle", en: "bicycle", enPl: "bicycles", es: "bicicleta", esPl: "bicicletas", g: "f", lo: 15000, hi: 45000 },
  { id: "laptop", en: "laptop", enPl: "laptops", es: "computadora portátil", esPl: "computadoras portátiles", g: "f", lo: 30000, hi: 90000 },
  { id: "sofa", en: "sofa", enPl: "sofas", es: "sofá", esPl: "sofás", g: "m", lo: 40000, hi: 90000 },
];

// Things a shopper buys by weight, and things a club or pool charges per visit (for the plan skills).
export const byId = (id) => ITEMS.find((item) => item.id === id);
export const BULK = ["juice", "pencil", "apple", "granola", "cookie", "eraser", "sticker", "banana"].map(byId);
export const PENNY_ITEMS = ["marble", "button", "balloon", "star", "banana", "apple", "pencil"].map(byId);
// Everyday goods that cost at most $15: the pool for shopping-cart and change problems.
export const SMALL = ITEMS.filter((item) => item.hi <= 1500 && item.lo >= 20);
export const WEIGHED = [
  { id: "rice", en: "rice", es: "arroz", g: "m", lo: 5, hi: 15 },
  { id: "pasta", en: "pasta", es: "pasta", g: "f", lo: 6, hi: 18 },
  { id: "mix", en: "trail mix", es: "mezcla de frutos secos", g: "f", lo: 30, hi: 90 },
  { id: "cereal", en: "cereal", es: "cereal", g: "m", lo: 20, hi: 45 },
];
export const VISITS = [
  { id: "swim", en: "Swim Club", es: "Club de natación", unit: { en: "visit", enPl: "visits", es: "visita", esPl: "visitas" } },
  { id: "movie", en: "Movie Club", es: "Club de cine", unit: { en: "movie", enPl: "movies", es: "película", esPl: "películas" } },
  { id: "skate", en: "Skate Park", es: "Parque de patinaje", unit: { en: "visit", enPl: "visits", es: "visita", esPl: "visitas" } },
  { id: "music", en: "Music Class", es: "Clase de música", unit: { en: "lesson", enPl: "lessons", es: "lección", esPl: "lecciones" } },
];
export const SHOPPERS = ["Ana", "Leo", "Maya", "Sam", "Noor", "Eli"];

export const itemName = (item, lang, count = 1) => (lang === "es" ? (count === 1 ? item.es : item.esPl) : count === 1 ? item.en : item.enPl);
export const unitName = (unit, lang, count = 1) => (lang === "es" ? (count === 1 ? unit.es : unit.esPl) : count === 1 ? unit.en : unit.enPl);
// {en, es} display name for a count of items, ready for a round's copy.
export const named = (item, count = 1) => ({ en: itemName(item, "en", count), es: itemName(item, "es", count) });
export const each = (item) => (item.g === "f" ? "cada una" : "cada uno");
// "a pencil" / "an apple", "un lápiz" / "una pera". The Spanish forms are capitalised by the caller when they start a sentence.
export const aEn = (item) => `${/^[aeiou]/i.test(item.en) ? "an" : "a"} ${item.en}`;
export const aEs = (item) => `${item.g === "f" ? "una" : "un"} ${item.es}`;
export const theEs = (item) => `${item.g === "f" ? "la" : "el"} ${item.es}`;
export const cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// A price (whole cents, a multiple of `step`) inside an item's realistic range, never below `step`.
export const priceIn = (rng, item, step = 1, lo = item.lo, hi = item.hi) => {
  const low = Math.ceil(Math.max(lo, step) / step);
  const high = Math.max(low, Math.floor(hi / step));
  return step * (low + Math.floor(rng() * (high - low + 1)));
};
// An item whose real-world price range contains `cents` (the nearest range if none does).
export const itemFor = (rng, cents, pool = ITEMS, not = []) => {
  const open = pool.filter((item) => !not.includes(item));
  const gap = (item) => Math.max(item.lo - cents, cents - item.hi, 0);
  const best = Math.min(...open.map(gap));
  const near = open.filter((item) => gap(item) === best);
  return near[Math.floor(rng() * near.length)];
};
