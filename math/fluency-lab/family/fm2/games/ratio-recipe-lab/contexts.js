// Story settings for the non-recipe skills: trays and cookies, sticker names, unit-rate sentences, constant speed, two-
// variable relationships, maps, percents. Amounts are kept physically sensible. @fm2 FM-014 FM-056 FM-059
import { counted, measured } from "./recipes.js";

export const HOLDERS = [
  {
    holder: counted("holders", "tray", "trays", "bandeja", "bandejas"),
    item: counted("items", "cookie", "cookies", "galleta", "galletas"),
  },
  {
    holder: counted("holders", "bag", "bags", "bolsa", "bolsas"),
    item: counted("items", "apple", "apples", "manzana", "manzanas"),
  },
  {
    holder: counted("holders", "box", "boxes", "caja", "cajas"),
    item: counted("items", "crayon", "crayons", "crayón", "crayones"),
  },
  {
    holder: counted("holders", "pack", "packs", "paquete", "paquetes"),
    item: counted("items", "pencil", "pencils", "lápiz", "lápices"),
  },
];

export const NAMES = [
  ["Mia", "Leo"],
  ["Ana", "Sam"],
  ["Noa", "Eli"],
  ["Luz", "Max"],
];

export const TIMES = counted(
  "times",
  "time as many",
  "times as many",
  "vez la cantidad",
  "veces la cantidad",
);

// "6 cups of flour make 4 loaves": a is the amount, b the count it serves.
export const RATE_CONTEXTS = [
  {
    id: "bread",
    a: measured("flour", "flour", "harina", "cup"),
    b: counted("loaves", "loaf", "loaves", "pan", "panes"),
    say: { en: (A, B) => `${A} make ${B} of bread.`, es: (A, B) => `${A} alcanzan para ${B}.` },
    perB: { en: "How much flour makes 1 loaf?", es: "¿Cuánta harina se necesita para 1 pan?" },
    perA: {
      en: "How many loaves does 1 cup of flour make?",
      es: "¿Cuántos panes salen con 1 taza de harina?",
    },
  },
  {
    id: "ribbon",
    a: measured("ribbon", "ribbon", "cinta", "meter"),
    b: counted("bows", "bow", "bows", "moño", "moños"),
    say: {
      en: (A, B) => `${A} of ribbon make ${B}.`,
      es: (A, B) => `${A} de cinta alcanzan para ${B}.`,
    },
    perB: {
      en: "How many meters of ribbon make 1 bow?",
      es: "¿Cuántos metros de cinta se necesitan para 1 moño?",
    },
    perA: {
      en: "How many bows does 1 meter of ribbon make?",
      es: "¿Cuántos moños salen con 1 metro de cinta?",
    },
  },
  {
    id: "notebooks",
    a: measured("cost", "cost", "costo", "usd"),
    b: counted("notebooks", "notebook", "notebooks", "cuaderno", "cuadernos"),
    say: { en: (A, B) => `${B} cost ${A}.`, es: (A, B) => `${B} cuestan ${A}.` },
    perB: { en: "How much does 1 notebook cost?", es: "¿Cuánto cuesta 1 cuaderno?" },
    perA: {
      en: "How many notebooks can you buy for $1?",
      es: "¿Cuántos cuadernos puedes comprar con $1?",
    },
  },
  {
    id: "paint",
    a: measured("paint", "paint", "pintura", "gallon"),
    b: counted("rooms", "room", "rooms", "cuarto", "cuartos"),
    say: { en: (A, B) => `${A} cover ${B}.`, es: (A, B) => `${A} cubren ${B}.` },
    perB: {
      en: "How many gallons of paint cover 1 room?",
      es: "¿Cuántos galones de pintura cubren 1 cuarto?",
    },
    perA: {
      en: "How many rooms does 1 gallon of paint cover?",
      es: "¿Cuántos cuartos cubre 1 galón de pintura?",
    },
  },
];

export const TRAVEL = [
  { who: { en: "A cyclist", es: "Una ciclista" }, speeds: [8, 10, 12, 15] },
  { who: { en: "A hiker", es: "Un excursionista" }, speeds: [3, 4] },
  { who: { en: "A bus", es: "Un autobús" }, speeds: [40, 45, 50, 60] },
  { who: { en: "A train", es: "Un tren" }, speeds: [60, 70, 80] },
];

// Two quantities in a proportional relationship y = kx. ks are rationals [n, d] (whole numbers as [n]).
export const XY = [
  {
    id: "notebooks",
    x: counted("x", "notebook", "notebooks", "cuaderno", "cuadernos"),
    y: measured("y", "cost", "costo", "usd"),
    sym: ["n", "c"],
    xDesc: { en: "the number of notebooks", es: "el número de cuadernos" },
    yDesc: { en: "the cost", es: "el costo" },
    ks: [[3, 2], [2], [5, 2], [3], [4], [7, 4]],
    rel: { en: "The cost of notebooks", es: "El costo de los cuadernos" },
  },
  {
    id: "fuel",
    x: measured("x", "gas", "gasolina", "gallon"),
    y: measured("y", "distance", "distancia", "mile"),
    sym: ["g", "m"],
    xDesc: { en: "the gallons of gas used", es: "los galones de gasolina usados" },
    yDesc: { en: "the miles driven", es: "las millas recorridas" },
    ks: [[20], [24], [25], [30], [32]],
    rel: { en: "The miles a car drives", es: "Las millas que recorre un carro" },
  },
  {
    id: "wage",
    x: measured("x", "time worked", "tiempo trabajado", "hour"),
    y: measured("y", "pay", "pago", "usd"),
    sym: ["h", "p"],
    xDesc: { en: "the hours worked", es: "las horas trabajadas" },
    yDesc: { en: "the pay", es: "el pago" },
    ks: [[8], [9], [10], [12], [15], [25, 2]],
    rel: { en: "Pay at a job", es: "El pago en un trabajo" },
  },
  {
    id: "reading",
    x: measured("x", "time", "tiempo", "minute"),
    y: counted("y", "page", "pages", "página", "páginas"),
    sym: ["m", "p"],
    xDesc: { en: "the minutes spent reading", es: "los minutos de lectura" },
    yDesc: { en: "the pages read", es: "las páginas leídas" },
    ks: [[2], [3], [4], [3, 2], [5, 2]],
    rel: { en: "Pages a student reads", es: "Las páginas que lee un estudiante" },
  },
  {
    id: "pump",
    x: measured("x", "time", "tiempo", "minute"),
    y: measured("y", "water", "agua", "liter"),
    sym: ["t", "w"],
    xDesc: { en: "the minutes the pump runs", es: "los minutos que funciona la bomba" },
    yDesc: { en: "the liters moved", es: "los litros movidos" },
    ks: [[4], [5], [6], [5, 2], [9, 2]],
    rel: { en: "The water a pump moves", es: "El agua que mueve una bomba" },
  },
];

export const MAPS = [
  {
    id: "park",
    drawing: measured("drawing", "drawing", "dibujo", "cm"),
    actual: measured("actual", "real distance", "distancia real", "meter"),
    ks: [[2], [3], [4], [5], [6], [8], [10], [3, 2], [5, 2], [9, 2]],
    place: { en: "A map of the park", es: "Un mapa del parque" },
    scaleText: {
      en: (k) => `1 cm on the map is ${k} m in real life`,
      es: (k) => `1 cm en el mapa son ${k} m en la realidad`,
    },
  },
  {
    id: "plan",
    drawing: measured("drawing", "drawing", "dibujo", "inch"),
    actual: measured("actual", "real length", "longitud real", "foot"),
    ks: [[2], [3], [4], [5], [6], [5, 2], [7, 2], [9, 2]],
    place: { en: "A floor plan", es: "Un plano de una casa" },
    scaleText: {
      en: (k) => `1 inch on the plan is ${k} ft in real life`,
      es: (k) => `1 pulgada en el plano son ${k} pies en la realidad`,
    },
  },
];

export const PERCENT_SHOPS = [
  {
    id: "tip",
    easy: [10, 20, 25],
    ps: [12, 15, 18, 20],
    part: { en: "tip", es: "propina" },
    whole: { en: "bill", es: "cuenta" },
    total: { en: "total with tip", es: "total con propina" },
    sign: 1,
    story: {
      en: (p, W) => `A family leaves a ${p}% tip on a ${W} bill.`,
      es: (p, W) => `Una familia deja una propina del ${p} % sobre una cuenta de ${W}.`,
    },
  },
  {
    id: "tax",
    easy: [5, 10],
    ps: [6, 7, 8, 9],
    part: { en: "tax", es: "impuesto" },
    whole: { en: "price", es: "precio" },
    total: { en: "total with tax", es: "total con impuesto" },
    sign: 1,
    story: {
      en: (p, W) => `Sales tax is ${p}% on a ${W} purchase.`,
      es: (p, W) => `El impuesto sobre la venta es ${p} % en una compra de ${W}.`,
    },
  },
  {
    id: "sale",
    easy: [10, 20, 25, 50],
    ps: [15, 30, 35, 40, 60],
    part: { en: "discount", es: "descuento" },
    whole: { en: "regular price", es: "precio regular" },
    total: { en: "sale price", es: "precio de oferta" },
    sign: -1,
    story: {
      en: (p, W) => `A jacket with a regular price of ${W} is ${p}% off.`,
      es: (p, W) => `Una chaqueta con precio regular de ${W} tiene ${p} % de descuento.`,
    },
  },
];

export const GRAPH_CONTEXTS = [
  {
    x: measured("x", "time", "tiempo", "minute"),
    y: measured("y", "distance", "distancia", "meter"),
    says: {
      en: "A toy robot moves at a steady speed.",
      es: "Un robot de juguete se mueve a velocidad constante.",
    },
  },
  {
    x: counted("x", "ticket", "tickets", "boleto", "boletos"),
    y: measured("y", "cost", "costo", "usd"),
    says: { en: "Tickets at the school play.", es: "Boletos para la obra de la escuela." },
  },
  {
    x: measured("x", "time", "tiempo", "hour"),
    y: measured("y", "pay", "pago", "usd"),
    says: {
      en: "A dog walker is paid by the hour.",
      es: "Una persona que pasea perros cobra por hora.",
    },
  },
  {
    x: measured("x", "time", "tiempo", "minute"),
    y: measured("y", "water", "agua", "liter"),
    says: { en: "A tank fills at a steady rate.", es: "Un tanque se llena a un ritmo constante." },
  },
  {
    x: measured("x", "time", "tiempo", "hour"),
    y: measured("y", "distance", "distancia", "mile"),
    says: { en: "A car drives at a steady speed.", es: "Un carro avanza a velocidad constante." },
  },
];
