/**
 * Which interactive model a lesson's Explore stage mounts, and how it starts.
 *
 * ONE table, keyed by BASE lesson id (`4-1` covers `4-1` and `4-1-part2`). A Session 2 page starts
 * from the same family with its own override (`part2`), so the two nights of one lesson never
 * drift apart. A lesson not listed has no interactive model yet: its Explore stage shows the
 * authored picture and labs, and `validate:family-mission` reports it as uncovered. The model
 * families live in `assets/family-mission/models/`.
 */

const pct = (whole, unitEn, unitEs, percent, extra = {}) => ({
  family: "percent",
  config: { whole, unit: { en: unitEn, es: unitEs }, percent, maxPercent: 400, ...extra },
});
const VIEWS = {
  table: { table: true, tape: false, line: false },
  "double-number-line": { table: false, tape: false, line: true },
  tape: { table: false, tape: true, line: false },
};
const ratio = (a, b, aEn, aEs, bEn, bEs, n, { focus } = {}) => ({
  family: "ratio",
  config: {
    a,
    b,
    labels: { a: { en: aEn, es: aEs }, b: { en: bEn, es: bEs } },
    rows: [...new Set([1, 2, n])].sort((x, y) => x - y),
    ...(VIEWS[focus] ? { views: VIEWS[focus] } : {}),
  },
});

const fam = (family, config) => ({ family, config });
const lead = (en, es) => ({ leadEn: en, leadEs: es });

/** base lesson id -> { family, config, leadEn, leadEs, part2?: { config?, leadEn?, leadEs? } } */
export const LESSON_MODELS = {
  /* Unit 1: Fraction & Decimal Operations */
  "1-4": {
    ...fam("geometry", { mode: "volume", l: 8, w: 3, h: 10, max: 12 }),
    ...lead(
      "Change the edges. The layers show why a box's volume is length times width times height.",
      "Cambia las aristas. Las capas muestran por qué el volumen de una caja es largo por ancho por alto.",
    ),
    part2: {
      config: { l: 6, w: 4, h: 2, max: 12 },
      ...lead(
        "Compare two beds. Change the edges and see which shapes hold the same volume.",
        "Compara dos camas. Cambia las aristas y mira qué formas tienen el mismo volumen.",
      ),
    },
  },
  /* Hands-on models written for lessons whose earlier model was about another topic. */
  "1-3": {
    ...fam("decimal", {
      mode: "addsub",
      terms: ["2.75", "+2.75"],
      presets: [
        { terms: ["2.75", "+2.75"] },
        { terms: ["1.50", "+1.50", "+1.50"] },
        { terms: ["3.25", "+3.25"] },
      ],
    }),
    ...lead(
      "Add the equal parts of the tape: line up the decimal points and add one column at a time.",
      "Suma las partes iguales de la barra: alinea los puntos decimales y suma una columna a la vez.",
    ),
    /* Session 2 is a minutes problem (500 minutes after midnight), so it uses long division. */
    part2: {
      family: "division",
      config: {
        mode: "whole",
        dividend: 500,
        divisor: 60,
        context: { en: "{q} hours and {r} minutes", es: "{q} horas y {r} minutos" },
        presets: [
          {
            dividend: 500,
            divisor: 60,
            context: { en: "{q} hours and {r} minutes", es: "{q} horas y {r} minutos" },
          },
          {
            dividend: 150,
            divisor: 60,
            context: { en: "{q} hours and {r} minutes", es: "{q} horas y {r} minutos" },
          },
          {
            dividend: 725,
            divisor: 60,
            context: { en: "{q} hours and {r} minutes", es: "{q} horas y {r} minutos" },
          },
        ],
      },
      ...lead(
        "Count the 60-minute hours in the trip. Choose the digit, then see the minutes left over.",
        "Cuenta las horas de 60 minutos del viaje. Elige el dígito y mira los minutos que sobran.",
      ),
    },
  },
  "2-11": {
    ...fam("decimal", {
      mode: "addsub",
      terms: ["128.75", "+46.8", "-19.35"],
      presets: [
        { terms: ["128.75", "+46.8", "-19.35"] },
        { terms: ["342.6", "-128.75", "+56.4"] },
        { terms: ["3.5", "+2.75"] },
      ],
    }),
    ...lead(
      "Line up the decimal points, annex zeros, then add or subtract one column at a time from the right.",
      "Alinea los puntos decimales, agrega ceros y luego suma o resta una columna a la vez, desde la derecha.",
    ),
    part2: {
      config: {
        mode: "addsub",
        terms: ["342.6", "-128.75", "+56.4"],
        presets: [
          { terms: ["342.6", "-128.75", "+56.4"] },
          { terms: ["128.75", "+46.8", "-19.35"] },
          { terms: ["4.5", "-1.25", "+0.8"] },
        ],
      },
      ...lead(
        "Do the first two numbers, then use that answer with the last one. Line up the points every time.",
        "Haz los dos primeros números y luego usa esa respuesta con el último. Alinea los puntos cada vez.",
      ),
    },
  },
  "2-12": {
    ...fam("decimal", {
      mode: "multiply",
      a: "12.60",
      b: "4.5",
      trimTo: 2,
      presets: [
        { a: "12.60", b: "4.5" },
        { a: "3.40", b: "2.5" },
        { a: "6.80", b: "3.5" },
      ],
    }),
    ...lead(
      "Ignore the points and multiply the whole numbers. Then count the decimal places and place the point.",
      "Ignora los puntos y multiplica los números enteros. Luego cuenta los lugares decimales y pon el punto.",
    ),
    part2: {
      config: {
        mode: "multiply",
        a: "3.40",
        b: "2.5",
        trimTo: 2,
        presets: [
          { a: "3.40", b: "2.5" },
          { a: "12.60", b: "4.5" },
          { a: "6.80", b: "3.5" },
        ],
      },
      ...lead(
        "Estimate first, then multiply the whole numbers and place the point. Does the total make sense?",
        "Primero estima, luego multiplica los números enteros y pon el punto. ¿Tiene sentido el total?",
      ),
    },
  },
  "1-2": {
    ...fam("division", {
      mode: "fractionof",
      n: 2,
      d: 3,
      whole: 60,
      unit: { en: "pea pods", es: "vainas de guisantes" },
      presets: [
        { n: 2, d: 3, whole: 60, unit: { en: "pea pods", es: "vainas de guisantes" } },
        { n: 2, d: 3, whole: 12, unit: { en: "beans", es: "frijoles" } },
        { n: 3, d: 4, whole: 24, unit: { en: "pea pods", es: "vainas de guisantes" } },
      ],
    }),
    ...lead(
      "Split the pods into equal groups. Then tap the groups the top number asks for.",
      "Reparte las vainas en grupos iguales. Luego toca los grupos que pide el numerador.",
    ),
  },
  "2-6": {
    ...fam("division", {
      mode: "whole",
      dividend: 1344,
      divisor: 12,
      context: { en: "{q} boxes, with {r} bars left over", es: "{q} cajas, y sobran {r} barras" },
      presets: [
        {
          dividend: 1344,
          divisor: 12,
          context: {
            en: "{q} boxes, with {r} bars left over",
            es: "{q} cajas, y sobran {r} barras",
          },
        },
        { dividend: 384, divisor: 8 },
        {
          dividend: 1205,
          divisor: 12,
          context: {
            en: "{q} boxes, with {r} bars left over",
            es: "{q} cajas, y sobran {r} barras",
          },
        },
      ],
    }),
    ...lead(
      "Choose each digit of the answer. The model says if it is too big, too small, or just right.",
      "Elige cada dígito de la respuesta. El modelo dice si es demasiado grande, demasiado pequeño o justo.",
    ),
    part2: {
      config: {
        mode: "whole",
        dividend: 621000,
        divisor: 20,
        context: { en: "{q} teachers", es: "{q} maestros" },
        presets: [
          { dividend: 621000, divisor: 20, context: { en: "{q} teachers", es: "{q} maestros" } },
          { dividend: 621000, divisor: 15, context: { en: "{q} teachers", es: "{q} maestros" } },
          { dividend: 621000, divisor: 18, context: { en: "{q} teachers", es: "{q} maestros" } },
        ],
      },
      ...lead(
        "Divide the students by the number in each group. Choose each digit of the answer, one at a time.",
        "Divide los estudiantes entre el número de cada grupo. Elige cada dígito de la respuesta, uno por uno.",
      ),
    },
  },
  "2-7": {
    ...fam("division", {
      mode: "decimal",
      dividend: "18.9",
      divisor: "6.3",
      context: { en: "{q} coolers", es: "{q} hieleras" },
      presets: [
        { dividend: "18.9", divisor: "6.3", context: { en: "{q} coolers", es: "{q} hieleras" } },
        { dividend: "9.6", divisor: "0.4", context: { en: "{q} cups", es: "{q} vasos" } },
        { dividend: "4.5", divisor: "0.15" },
      ],
    }),
    ...lead(
      "Move both decimal points the same number of places. Then divide as whole numbers.",
      "Mueve los dos puntos decimales el mismo número de lugares. Luego divide como números enteros.",
    ),
    part2: {
      config: {
        mode: "decimal",
        dividend: "9.6",
        divisor: "0.4",
        context: { en: "{q} cups", es: "{q} vasos" },
        presets: [
          { dividend: "9.6", divisor: "0.4", context: { en: "{q} cups", es: "{q} vasos" } },
          { dividend: "4.5", divisor: "0.15" },
          { dividend: "7.2", divisor: "0.9" },
        ],
      },
      ...lead(
        "Dividing by a number less than 1 gives more groups. Move both points, then divide.",
        "Dividir entre un número menor que 1 da más grupos. Mueve los dos puntos y luego divide.",
      ),
    },
  },
  "6-7": {
    ...fam("numtheory", {
      mode: "gcf",
      a: 48,
      b: 36,
      labels: {
        a: { en: "pencils", es: "lápices" },
        b: { en: "notebooks", es: "cuadernos" },
      },
      presets: [
        { a: 48, b: 36 },
        { a: 30, b: 45 },
        { a: 24, b: 16 },
      ],
    }),
    ...lead(
      "Try pack counts. A pack count works only if it splits both numbers with none left over.",
      "Prueba cantidades de paquetes. Una cantidad sirve solo si reparte los dos números sin que sobre nada.",
    ),
    part2: {
      config: {
        mode: "lcm",
        a: 6,
        b: 9,
        labels: {
          a: { en: "first bus", es: "primer autobús" },
          b: { en: "second bus", es: "segundo autobús" },
        },
        per: { en: "trips", es: "salidas" },
        unit: { en: "minutes", es: "minutos" },
        presets: [
          { a: 6, b: 9 },
          { a: 4, b: 10 },
          { a: 8, b: 12 },
        ],
      },
      ...lead(
        "Count on from each bus, one trip at a time. Find the first minute both buses leave together.",
        "Avanza con cada autobús, una salida a la vez. Halla el primer minuto en que los dos salen juntos.",
      ),
    },
  },
  "6-12": {
    ...fam("numtheory", {
      mode: "lcm",
      a: 4,
      b: 6,
      labels: {
        a: { en: "swim class", es: "clase de natación" },
        b: { en: "art club", es: "club de arte" },
      },
      per: { en: "times", es: "veces" },
      unit: { en: "days", es: "días" },
      presets: [
        { a: 4, b: 6 },
        { a: 3, b: 5 },
        { a: 6, b: 8 },
      ],
    }),
    ...lead(
      "Count on one jump at a time. Look for the first number that is on both lines.",
      "Avanza un salto a la vez. Busca el primer número que está en las dos filas.",
    ),
    part2: {
      config: {
        mode: "lcm",
        a: 6,
        b: 8,
        labels: {
          a: { en: "hot dogs", es: "salchichas" },
          b: { en: "buns", es: "panes" },
        },
        per: { en: "packs", es: "paquetes" },
        presets: [
          { a: 6, b: 8 },
          { a: 4, b: 10 },
          { a: 5, b: 6 },
        ],
      },
      ...lead(
        "Add one pack at a time to each line. Find the first total that matches.",
        "Agrega un paquete a la vez a cada fila. Halla el primer total que coincide.",
      ),
    },
  },
  "6-13": {
    ...fam("numtheory", { mode: "tree", n: 60, presets: [60, 84, 90] }),
    ...lead(
      "Tap a number to split it into a factor pair. Keep going until every leaf is prime, then try another start.",
      "Toca un número para separarlo en un par de factores. Sigue hasta que cada hoja sea un primo y luego prueba otro inicio.",
    ),
    part2: {
      config: { mode: "tree", n: 84, presets: [84, 60, 90] },
      ...lead(
        "Is a tree finished while a piece can still split? Tap the pieces, then try another start.",
        "¿Un árbol está terminado si una pieza todavía se puede separar? Toca las piezas y luego prueba otro inicio.",
      ),
    },
  },
  "1-5": {
    ...fam("pattern", {
      mode: "rule",
      m: "0.1",
      b: "0",
      maxX: 100,
      rows: [1, 2, 3],
      title: { en: "Dimes", es: "Dimes" },
      quantities: { x: { en: "dimes", es: "dimes" }, y: { en: "value", es: "valor" } },
      units: { y: { en: "dollars", es: "dólares" }, yPrefix: "$", yDecimals: 2 },
      presets: [
        { title: { en: "Dimes", es: "Dimes" } },
        {
          title: { en: "Nickels", es: "Nickels" },
          m: "0.05",
          quantities: { x: { en: "nickels", es: "nickels" }, y: { en: "value", es: "valor" } },
        },
        {
          title: { en: "Quarters", es: "Quarters" },
          m: "0.25",
          quantities: { x: { en: "quarters", es: "quarters" }, y: { en: "value", es: "valor" } },
        },
        {
          title: { en: "Bags of chips", es: "Bolsas de papitas" },
          m: "2.5",
          quantities: { x: { en: "bags", es: "bolsas" }, y: { en: "cost", es: "costo" } },
        },
      ],
    }),
    ...lead(
      "Add rows to the table, then try a rule and check it against every row.",
      "Agrega filas a la tabla, prueba una regla y compárala con cada fila.",
    ),
    part2: {
      config: {
        mode: "rule",
        m: "0.025",
        b: "4.5",
        maxX: 1000,
        rows: [1, 2, 3],
        title: { en: "Baby whale", es: "Ballena bebé" },
        quantities: { x: { en: "days", es: "días" }, y: { en: "length", es: "longitud" } },
        units: { y: { en: "meters", es: "metros" } },
        presets: [
          { title: { en: "Baby whale", es: "Ballena bebé" } },
          {
            title: { en: "Puppy", es: "Cachorro" },
            m: "0.5",
            b: "3",
            maxX: 100,
            quantities: { x: { en: "weeks", es: "semanas" }, y: { en: "weight", es: "peso" } },
            units: { y: { en: "kilograms", es: "kilogramos" } },
          },
          {
            title: { en: "Savings", es: "Ahorros" },
            m: "4",
            b: "15",
            maxX: 100,
            quantities: { x: { en: "weeks", es: "semanas" }, y: { en: "savings", es: "ahorros" } },
            units: { y: { en: "dollars", es: "dólares" }, yPrefix: "$", yDecimals: 2 },
          },
        ],
      },
      ...lead(
        "Try a rule for the growing whale. Pick a day far away and test your rule on it.",
        "Prueba una regla para la ballena que crece. Elige un día lejano y prueba tu regla con él.",
      ),
    },
  },
  "9-4": {
    ...fam("pattern", {
      mode: "solve",
      m: "2.5",
      letters: { x: "h", y: "c" },
      title: { en: "Car factory", es: "Fábrica de autos" },
      quantities: { x: { en: "hours", es: "horas" }, y: { en: "cars", es: "autos" } },
      units: { x: { en: "hours", es: "horas" }, y: { en: "cars", es: "autos" } },
      target: "1000",
      given: "8",
      presets: [
        { title: { en: "Car factory", es: "Fábrica de autos" } },
        {
          title: { en: "Printer", es: "Impresora" },
          m: "15",
          letters: { x: "m", y: "p" },
          quantities: { x: { en: "minutes", es: "minutos" }, y: { en: "pages", es: "páginas" } },
          units: { x: { en: "minutes", es: "minutos" }, y: { en: "pages", es: "páginas" } },
          target: "300",
          given: "4",
        },
        {
          title: { en: "Tickets", es: "Boletos" },
          m: "8",
          letters: { x: "t", y: "d" },
          quantities: {
            x: { en: "tickets", es: "boletos" },
            y: { en: "money raised", es: "dinero recaudado" },
          },
          units: { x: { en: "tickets", es: "boletos" }, yPrefix: "$" },
          target: "400",
          given: "6",
        },
      ],
    }),
    ...lead(
      "Choose the number you know, then undo the multiplying on both sides to solve.",
      "Elige el número que conoces y luego deshaz la multiplicación en ambos lados para resolver.",
    ),
    part2: {
      config: {
        mode: "solve",
        m: "26",
        letters: { x: "n", y: "e" },
        title: { en: "Band posters", es: "Carteles de la banda" },
        quantities: {
          x: { en: "posters", es: "carteles" },
          y: { en: "money earned", es: "dinero ganado" },
        },
        units: { x: { en: "posters", es: "carteles" }, yPrefix: "$" },
        target: "1300",
        given: "5",
        presets: [
          { title: { en: "Band posters", es: "Carteles de la banda" } },
          {
            title: { en: "Car wash", es: "Lavado de carros" },
            m: "18",
            letters: { x: "c", y: "r" },
            quantities: {
              x: { en: "cars washed", es: "carros lavados" },
              y: { en: "money raised", es: "dinero recaudado" },
            },
            units: { x: { en: "cars", es: "carros" }, yPrefix: "$" },
            target: "720",
            given: "5",
          },
          {
            title: { en: "Gym membership", es: "Membresía del gimnasio" },
            m: "3",
            b: "15",
            letters: { x: "v", y: "c" },
            quantities: {
              x: { en: "visits", es: "visitas" },
              y: { en: "total cost", es: "costo total" },
            },
            units: { x: { en: "visits", es: "visitas" }, yPrefix: "$" },
            target: "60",
            given: "8",
          },
          {
            title: { en: "Arcade card", es: "Tarjeta de juegos" },
            m: "4",
            b: "20",
            letters: { x: "g", y: "t" },
            quantities: {
              x: { en: "games", es: "juegos" },
              y: { en: "total cost", es: "costo total" },
            },
            units: { x: { en: "games", es: "juegos" }, yPrefix: "$" },
            target: "100",
            given: "5",
          },
        ],
      },
      ...lead(
        "Start from the goal. Undo the multiplying on both sides, then put the answer back to check. With a starting amount, undo the adding first.",
        "Empieza desde la meta. Deshaz la multiplicación en ambos lados y pon la respuesta de nuevo para comprobar. Si hay una cantidad inicial, deshaz primero la suma.",
      ),
    },
  },
  "5-9": {
    ...fam("polygon", {
      n: 6,
      side: 6,
      apothem: 5.2,
      unit: { en: "feet", es: "pies" },
      presets: [
        { n: 6, side: 6, apothem: 5.2 },
        { n: 5, side: 4, apothem: 3, unit: { en: "centimeters", es: "centímetros" } },
        { n: 8, side: 2, apothem: 2.4 },
      ],
    }),
    ...lead(
      "Split the polygon into triangles from the center. Find one triangle, then multiply by how many there are.",
      "Divide el polígono en triángulos desde el centro. Halla un triángulo y multiplica por cuántos hay.",
    ),
    part2: {
      config: {
        n: 10,
        side: 3,
        apothem: 4,
        unit: { en: "feet", es: "pies" },
        presets: [
          { n: 10, side: 3, apothem: 4 },
          { n: 6, side: 4, apothem: 3.5 },
          { n: 5, side: 8, apothem: 5.5 },
        ],
      },
      ...lead(
        "A decagon has 10 sides, so it has 10 triangles. Find one triangle, then multiply.",
        "Un decágono tiene 10 lados, así que tiene 10 triángulos. Halla uno y luego multiplica.",
      ),
    },
  },
  "3-1": {
    ...ratio(3, 5, "red", "rojas", "blue", "azules", 1),
    ...lead(
      "Change the number of batches. Watch both amounts change together.",
      "Cambia el número de lotes. Mira cómo cambian las dos cantidades juntas.",
    ),
  },
  "3-2": {
    ...ratio(12, 4, "dollars", "dólares", "pounds", "libras", 1, { focus: "unit-rate" }),
    ...lead(
      "Find the amount for ONE. Drag the point and read both unit rates.",
      "Encuentra la cantidad para UNO. Arrastra el punto y lee las dos tasas unitarias.",
    ),
  },
  "3-3": {
    ...ratio(2, 3, "cups of flour", "tazas de harina", "cups of sugar", "tazas de azúcar", 4, {
      focus: "table",
    }),
    ...lead(
      "Add rows to the table. Every row keeps the same ratio.",
      "Agrega filas a la tabla. Cada fila conserva la misma razón.",
    ),
  },
  "3-4": {
    ...ratio(2, 3, "cups of flour", "tazas de harina", "cups of sugar", "tazas de azúcar", 3, {
      focus: "double-number-line",
    }),
    ...lead(
      "Drag a point along the double number line. Both lines move together.",
      "Arrastra un punto por la recta numérica doble. Las dos rectas se mueven juntas.",
    ),
  },
  "3-5": {
    ...ratio(4, 6, "red", "rojas", "blue", "azules", 2),
    ...lead(
      "Build a ratio and test whether another pair is equivalent.",
      "Construye una razón y prueba si otro par es equivalente.",
    ),
  },
  "3-6": {
    ...ratio(12, 1, "inches", "pulgadas", "foot", "pie", 3, { focus: "double-number-line" }),
    ...lead(
      "Slide along the double number line. 12 inches always match 1 foot.",
      "Desliza por la recta numérica doble. 12 pulgadas siempre equivalen a 1 pie.",
    ),
  },
  "3-7": {
    ...ratio(5, 2, "miles", "millas", "hours", "horas", 3, { focus: "table" }),
    ...lead(
      "Compare equivalent rates in the table to see which rate moves faster.",
      "Compara tasas equivalentes en la tabla para ver cuál avanza más rápido.",
    ),
  },
  "3-8": {
    ...ratio(12, 4, "dollars", "dólares", "pounds", "libras", 2, { focus: "table" }),
    ...lead(
      "Find the cost for 1 pound, then use it for any number of pounds.",
      "Halla el costo de 1 libra y úsalo para cualquier número de libras.",
    ),
  },
  "3-9": {
    ...ratio(3, 4, "red", "rojas", "blue", "azules", 3, { focus: "tape" }),
    ...lead(
      "Stretch the tape. Both parts grow by the same factor.",
      "Estira la cinta. Las dos partes crecen por el mismo factor.",
    ),
  },
  "3-10": {
    ...ratio(4, 1, "cups", "tazas", "quart", "cuarto", 3, { focus: "double-number-line" }),
    ...lead(
      "Use the double number line to convert between measurement units.",
      "Usa la recta numérica doble para convertir entre unidades de medida.",
    ),
  },
  /* Data (Unit 2): the dot plot is editable; every measure updates as a dot moves. (2-1 stays null for question classifier lab) */
  "2-2": {
    ...fam("data", { values: [1, 2, 2, 3, 4, 4, 4, 6], min: 0, max: 10 }),
    ...lead(
      "Move the dots to observe clusters, peaks, and gaps in the distribution.",
      "Mueve los puntos para observar grupos, picos y espacios en la distribución.",
    ),
  },
  "2-3": {
    ...fam("data", { values: [2, 3, 3, 5, 9], min: 0, max: 12 }),
    ...lead(
      "Move a dot. Watch the median stay in the middle of the ordered data.",
      "Mueve un punto. Mira cómo la mediana se queda en el centro de los datos ordenados.",
    ),
  },
  "2-4": {
    ...fam("data", { values: [1, 2, 4, 5, 5, 7, 8, 12], min: 0, max: 14 }),
    ...lead(
      "Move a dot. Watch the quartiles and the box change.",
      "Mueve un punto. Mira cómo cambian los cuartiles y la caja.",
    ),
  },
  "2-5": {
    ...fam("data", { values: [2, 3, 3, 5, 9], min: 0, max: 12 }),
    ...lead(
      "Add a far-away dot. Compare what happens to the range and to the IQR.",
      "Agrega un punto lejano. Compara qué pasa con el rango y con el RIC.",
    ),
  },
  "2-8": {
    ...fam("data", { values: [3, 4, 4, 5, 9], min: 0, max: 12 }),
    ...lead(
      "Move a dot. The mean is the balance point of the dots.",
      "Mueve un punto. La media es el punto de equilibrio de los puntos.",
    ),
  },
  "2-9": {
    ...fam("data", { values: [3, 4, 4, 5, 9], min: 0, max: 12, mad: true }),
    ...lead(
      "Move a dot. See how far each dot is from the mean.",
      "Mueve un punto. Mira qué tan lejos está cada punto de la media.",
    ),
  },
  "2-10": {
    ...fam("data", { values: [3, 4, 4, 5, 6, 20], min: 0, max: 24 }),
    ...lead(
      "Drag the far dot closer. Which measure changes most?",
      "Acerca el punto lejano. ¿Qué medida cambia más?",
    ),
  },
  /* Geometry (Unit 5) */
  "5-1": {
    ...fam("geometry", { mode: "area", shape: "parallelogram", b: 6, h: 4 }),
    ...lead(
      "Change the base and the height. The slanted side never changes the area.",
      "Cambia la base y la altura. El lado inclinado nunca cambia el área.",
    ),
  },
  "5-2": {
    ...fam("geometry", { mode: "area", shape: "triangle", b: 6, h: 4 }),
    ...lead(
      "Two triangles make a parallelogram. Change the base and height.",
      "Dos triángulos forman un paralelogramo. Cambia la base y la altura.",
    ),
  },
  "5-3": {
    ...fam("geometry", { mode: "area", shape: "trapezoid", b: 6, b2: 4, h: 4 }),
    ...lead(
      "Change both bases and the height. Watch the area follow.",
      "Cambia las dos bases y la altura. Mira cómo cambia el área.",
    ),
  },
  "5-4": {
    ...fam("geometry", { mode: "area", shape: "parallelogram", b: 5, h: 4 }),
    ...lead(
      "Decompose the figure into familiar shapes and add their areas.",
      "Descompón la figura en formas conocidas y suma sus áreas.",
    ),
  },
  "5-5": {
    ...fam("geometry", { mode: "volume", l: 4, w: 3, h: 2 }),
    ...lead(
      "Change the edges. The layers show why volume is base times height.",
      "Cambia las aristas. Las capas muestran por qué el volumen es base por altura.",
    ),
  },
  "5-6": {
    ...fam("geometry", { mode: "net", l: 4, w: 3, h: 2 }),
    ...lead(
      "Fold and unfold the net. Match each face to its place on the prism.",
      "Dobla y desdobla la red. Une cada cara con su lugar en el prisma.",
    ),
  },
  "5-7": {
    ...fam("geometry", { mode: "net", l: 4, w: 3, h: 2 }),
    ...lead(
      "Unfold the net. Add the area of every face for the surface area.",
      "Desdobla la red. Suma el área de cada cara para hallar el área total.",
    ),
  },
  "5-8": {
    ...fam("geometry", { mode: "area", shape: "triangle", b: 8, h: 5 }),
    ...lead(
      "Adjust the base and perpendicular height to find the area of triangular faces.",
      "Ajusta la base y la altura perpendicular para hallar el área de caras triangulares.",
    ),
  },
  "5-10": {
    ...fam("geometry", { mode: "volume", l: "3/2", w: 2, h: "4/3" }),
    ...lead(
      "Edges can be fractions. Count the small cubes in each layer.",
      "Las aristas pueden ser fracciones. Cuenta los cubitos de cada capa.",
    ),
  },
  /* Exponents, expressions, and equations (Units 6, 8, and 9) */
  "6-1": {
    ...fam("kcf", {
      dividend: "3",
      divisor: "1/4",
      presets: [
        { dividend: "3", divisor: "1/4" },
        { dividend: "4", divisor: "1/2" },
        { dividend: "2", divisor: "1/3" },
      ],
    }),
    ...lead(
      "Tap Keep, Change, Flip in order. Watch the division problem turn into a multiplication problem.",
      "Toca Mantener, Cambiar, Invertir en orden. Mira cómo el problema de dividir se convierte en uno de multiplicar.",
    ),
    part2: {
      config: {
        dividend: "3/4",
        divisor: "6",
        presets: [
          { dividend: "3/4", divisor: "6" },
          { dividend: "1/2", divisor: "4" },
          { dividend: "2/3", divisor: "3" },
        ],
      },
      ...lead(
        "Split a fraction into equal shares. Tap Keep, Change, Flip to turn it into multiplying by a unit fraction.",
        "Reparte una fracción en partes iguales. Toca Mantener, Cambiar, Invertir para convertirlo en multiplicar por una fracción unitaria.",
      ),
    },
  },
  "6-2": {
    ...fam("kcf", {
      dividend: "2 1/2",
      divisor: "1/2",
      presets: [
        { dividend: "2 1/2", divisor: "1/2" },
        { dividend: "1 1/2", divisor: "3/4" },
        { dividend: "3 1/3", divisor: "2/3" },
      ],
    }),
    ...lead(
      "Tap Keep, Change, Flip in order. Watch the division problem turn into a multiplication problem.",
      "Toca Mantener, Cambiar, Invertir en orden. Mira cómo el problema de dividir se convierte en uno de multiplicar.",
    ),
    part2: {
      config: {
        dividend: "6 3/4",
        divisor: "2 1/4",
        presets: [
          { dividend: "6 3/4", divisor: "2 1/4" },
          { dividend: "3 1/2", divisor: "1 3/4" },
          { dividend: "4 1/2", divisor: "1 1/2" },
        ],
      },
      ...lead(
        "Write both mixed numbers as fractions first. Then tap Keep, Change, Flip.",
        "Escribe primero los dos números mixtos como fracciones. Luego toca Mantener, Cambiar, Invertir.",
      ),
    },
  },
  "6-3": {
    ...fam("exponents", { mode: "powers", base: 2, exponent: 3, maxExponent: 5, compare: true }),
    ...lead(
      "Double and multiply quantities step by step. Compare repeated multiplication (b^n) with the multiplier trap (b × n).",
      "Duplica y multiplica cantidades paso a paso. Compara la multiplicación repetida (b^n) con la trampa de multiplicar (b × n).",
    ),
    part2: {
      config: { mode: "powers", base: 3, exponent: 3, maxExponent: 5, compare: true },
      ...lead(
        "Explore powers of 3 and zero exponents. Watch how each step multiplies by the base.",
        "Explora potencias de 3 y exponentes cero. Observa cómo cada paso multiplica por la base.",
      ),
    },
  },
  "6-4": {
    /* The same problem as Try Together (5 + 3 × 2²), so the model walks the family through it. */
    ...fam("exponents", { mode: "order", base: 2, exponent: 2, addend: 5, multiplier: 3 }),
    ...lead(
      "Read the order from top to bottom. Tap the step that comes next, and watch the problem get shorter.",
      "Lean el orden de arriba abajo. Toquen el paso que sigue y vean cómo el problema se hace más corto.",
    ),
    /* Part 2 adds grouping: the same problem as its Try Together, then two more with parentheses. */
    part2: {
      config: {
        mode: "order",
        expr: "30 ÷ (11 − 6) + 2³",
        presets: ["4 + 3 × (9 − 7)²", "(8 − 2) × 3 + 2²", "40 − (3 + 1)² ÷ 2"],
      },
      ...lead(
        "Parentheses are the top step now. Tap the step that comes next, and watch the problem get shorter.",
        "Ahora los paréntesis son el primer paso. Toquen el paso que sigue y vean cómo el problema se hace más corto.",
      ),
    },
  },
  "6-5": {
    ...fam("linear-pricing", {
      rate: 12,
      fixed: 50,
      varName: "t",
      initial: 3,
      maxT: 12,
      compareRate: 15,
      compareFixed: 20,
    }),
    ...lead(
      "Change the number of tickets (t) in 12t + 50. Watch the tickets, expression, table, and graph update together.",
      "Cambia el número de boletos (t) en 12t + 50. Mira cómo cambian juntos los boletos, la expresión, la tabla y la gráfica.",
    ),
    part2: {
      config: {
        rate: 12,
        fixed: 50,
        varName: "t",
        initial: 4,
        maxT: 12,
        compareMode: true,
        compareRate: 15,
        compareFixed: 20,
      },
      ...lead(
        "Compare two ticket plans across the table and graph. Find when each plan costs less.",
        "Compara dos planes de boletos en la tabla y la gráfica. Descubre cuándo cuesta menos cada plan.",
      ),
    },
  },
  "6-6": {
    ...fam("balance", { combine: [[3, 2]], x: 3 }),
    ...lead(
      "Substitute values for the variable and evaluate the expression.",
      "Sustituye valores para la variable y evalúa la expresión.",
    ),
  },
  "6-8": {
    ...fam("balance", {
      combine: [
        [2, 3],
        [1, -1],
      ],
      x: 4,
    }),
    ...lead(
      "Combine the x tiles and the number tiles. The value never changes.",
      "Combina los cuadros de x y los de números. El valor nunca cambia.",
    ),
  },
  "6-9": {
    ...fam("kcf", {
      dividend: "4",
      divisor: "1/2",
      presets: [
        { dividend: "4", divisor: "1/2" },
        { dividend: "3", divisor: "1/4" },
        { dividend: "5", divisor: "2/3" },
      ],
    }),
    ...lead(
      "Tap Keep, Change, Flip in order. Watch the division problem turn into a multiplication problem.",
      "Toca Mantener, Cambiar, Invertir en orden. Mira cómo el problema de dividir se convierte en uno de multiplicar.",
    ),
    part2: {
      config: {
        dividend: "6",
        divisor: "2/3",
        presets: [
          { dividend: "6", divisor: "2/3" },
          { dividend: "8", divisor: "3/4" },
          { dividend: "9", divisor: "3/5" },
        ],
      },
      ...lead(
        "Write the whole number over 1. Then tap Keep, Change, Flip.",
        "Escribe el entero sobre 1. Luego toca Mantener, Cambiar, Invertir.",
      ),
    },
  },
  "6-10": {
    ...fam("kcf", {
      dividend: "3 1/2",
      divisor: "1/4",
      presets: [
        { dividend: "3 1/2", divisor: "1/4" },
        { dividend: "2 1/4", divisor: "3/4" },
        { dividend: "1 1/2", divisor: "1/6" },
      ],
    }),
    ...lead(
      "Tap Keep, Change, Flip in order. Watch the division problem turn into a multiplication problem.",
      "Toca Mantener, Cambiar, Invertir en orden. Mira cómo el problema de dividir se convierte en uno de multiplicar.",
    ),
    part2: {
      config: {
        dividend: "4 1/2",
        divisor: "1 1/2",
        presets: [
          { dividend: "4 1/2", divisor: "1 1/2" },
          { dividend: "5 1/4", divisor: "3/4" },
          { dividend: "3 3/4", divisor: "1 1/4" },
        ],
      },
      ...lead(
        "Convert both mixed numbers first. Then tap Keep, Change, Flip.",
        "Convierte primero los dos números mixtos. Luego toca Mantener, Cambiar, Invertir.",
      ),
    },
  },
  "6-11": {
    ...fam("kcf", {
      dividend: "2/3",
      divisor: "1/6",
      presets: [
        { dividend: "2/3", divisor: "1/6" },
        { dividend: "3/4", divisor: "1/8" },
        { dividend: "5/6", divisor: "1/12" },
      ],
    }),
    ...lead(
      "Say the total, then the group. Tap Keep, Change, Flip to find how many groups fit.",
      "Di primero el total y luego el grupo. Toca Mantener, Cambiar, Invertir para hallar cuántos grupos caben.",
    ),
    part2: {
      config: {
        dividend: "5/6",
        divisor: "1/12",
        presets: [
          { dividend: "5/6", divisor: "1/12" },
          { dividend: "7/8", divisor: "1/4" },
          { dividend: "3/4", divisor: "3/8" },
        ],
      },
      ...lead(
        "Say the total, then the group. Tap Keep, Change, Flip to find how many groups fit.",
        "Di primero el total y luego el grupo. Toca Mantener, Cambiar, Invertir para hallar cuántos grupos caben.",
      ),
    },
  },
  "6-14": {
    ...fam("balance", {
      combine: [
        [2, 3],
        [2, 3],
      ],
      x: 3,
    }),
    ...lead(
      "Group equal sets of x-tiles and unit tiles to model the distributive property.",
      "Agrupa conjuntos iguales de fichas x y unidades para modelar la propiedad distributiva.",
    ),
  },
  "6-15": {
    ...fam("balance", {
      combine: [
        [3, 2],
        [2, -5],
      ],
      x: 3,
    }),
    ...lead(
      "Combine like terms. Test x to see both forms agree.",
      "Combina términos semejantes. Prueba x para ver que ambas formas coinciden.",
    ),
  },
  "8-1": {
    ...fam("balance", { a: 2, b: 3, c: 1, d: 7 }),
    ...lead(
      "Try a value for x. Does the balance tip left, tip right, or stay level?",
      "Prueba un valor para x. ¿La balanza se inclina a la izquierda, a la derecha o queda nivelada?",
    ),
  },
  "8-2": {
    ...fam("balance", { a: 1, b: 5, c: 0, d: 12 }),
    ...lead(
      "Subtract the same amount from both sides to keep the balance.",
      "Resta la misma cantidad a los dos lados para mantener el equilibrio.",
    ),
  },
  "8-3": {
    ...fam("balance", { a: 3, b: 0, c: 0, d: 12 }),
    ...lead(
      "Divide both sides by the same number to keep the balance.",
      "Divide los dos lados entre el mismo número para mantener el equilibrio.",
    ),
  },
  "8-7": {
    ...fam("numberline", { mode: "inequality", rule: "x ≥ -1", test: 1 }),
    ...lead(
      "Test boundary and interior points to verify the solution set.",
      "Prueba puntos en el límite y en el interior para verificar el conjunto solución.",
    ),
  },
  "9-1": {
    ...fam("ratio", {
      a: 1,
      b: 4,
      labels: { a: { en: "hours (x)", es: "horas (x)" }, b: { en: "miles (y)", es: "millas (y)" } },
      rows: [1, 2, 3, 4],
      views: { table: true, tape: false, line: true },
    }),
    ...lead(
      "Watch how the dependent variable changes as you step the independent variable.",
      "Observa cómo cambia la variable dependiente al cambiar la variable independiente.",
    ),
  },
  "9-2": {
    ...fam("coordinate", {
      points: [
        [1, 3],
        [2, 5],
        [3, 7],
      ],
      range: 8,
    }),
    ...lead(
      "Explore how the coordinates move together along the linear pattern.",
      "Explora cómo se mueven juntas las coordenadas a lo largo del patrón lineal.",
    ),
  },
  "9-3": {
    ...fam("coordinate", {
      points: [
        [1, 2],
        [2, 4],
        [3, 6],
      ],
      range: 6,
    }),
    ...lead(
      "Plot ordered pairs from the two-variable relationship on the coordinate plane.",
      "Grafica pares ordenados de la relación entre dos variables en el plano de coordenadas.",
    ),
  },
  /* Number line (Units 7 and 8) */
  "7-1": {
    ...fam("numberline", { mode: "opposites", value: 3 }),
    ...lead(
      "Drag a number. Its opposite is the same distance from zero on the other side.",
      "Arrastra un número. Su opuesto está a la misma distancia del cero, al otro lado.",
    ),
  },
  "7-2": {
    ...fam("numberline", { mode: "order", values: [-4, -1, 0, 3] }),
    ...lead(
      "Place positive and negative rational numbers in order from least to greatest.",
      "Coloca números racionales positivos y negativos en orden de menor a mayor.",
    ),
  },
  "7-3": {
    ...fam("numberline", { mode: "opposites", value: -4 }),
    ...lead(
      "Absolute value is the distance from zero. Drag and compare.",
      "El valor absoluto es la distancia al cero. Arrastra y compara.",
    ),
  },
  "7-4": {
    ...fam("numberline", { mode: "order", values: [-5, -2, 1, 4] }),
    ...lead(
      "Order the numbers. The one farther right is greater.",
      "Ordena los números. El que está más a la derecha es mayor.",
    ),
  },
  "8-4": {
    ...fam("numberline", { mode: "inequality", rule: "x > 3" }),
    ...lead(
      "Change the boundary and the direction. Read the inequality aloud.",
      "Cambia el límite y la dirección. Lee la desigualdad en voz alta.",
    ),
  },
  "8-5": {
    ...fam("numberline", { mode: "inequality", rule: "x ≤ 2", test: 2 }),
    ...lead(
      "Test a value. Is it a solution? Notice the closed or open endpoint.",
      "Prueba un valor. ¿Es una solución? Fíjate en el extremo cerrado o abierto.",
    ),
  },
  "8-6": {
    ...fam("numberline", { mode: "inequality", rule: "x < -2" }),
    ...lead(
      "Graph the solutions. Open circle means the boundary is not included.",
      "Grafica las soluciones. El círculo abierto significa que el límite no se incluye.",
    ),
  },
  /* Coordinate plane (Unit 7) */
  "7-5": {
    ...fam("coordinate", { points: [[-2, 3]], range: 6 }),
    ...lead("Drag the point. Read x first, then y.", "Arrastra el punto. Lee primero x y luego y."),
  },
  "7-6": {
    ...fam("coordinate", {
      points: [
        [-3, 2],
        [2, 2],
      ],
      range: 6,
    }),
    ...lead(
      "Move the points on the same row. Count the distance between them.",
      "Mueve los puntos en la misma fila. Cuenta la distancia entre ellos.",
    ),
  },
  "7-7": {
    ...fam("coordinate", {
      points: [
        [1, 1],
        [4, 1],
        [4, 3],
        [1, 3],
      ],
      range: 6,
    }),
    ...lead(
      "Move a corner. Read each vertex as an ordered pair.",
      "Mueve una esquina. Lee cada vértice como un par ordenado.",
    ),
  },
  "7-8": {
    ...fam("coordinate", {
      points: [
        [-3, 2],
        [3, -2],
      ],
      range: 6,
    }),
    ...lead(
      "Drag a point into each quadrant. Watch the signs of x and y.",
      "Arrastra un punto a cada cuadrante. Mira los signos de x y de y.",
    ),
  },
  "7-9": {
    ...fam("coordinate", { points: [[-2, 3]], range: 6, reflect: "y" }),
    ...lead(
      "Reflect across an axis. Which coordinate changes sign?",
      "Refleja sobre un eje. ¿Qué coordenada cambia de signo?",
    ),
  },
  "4-1": {
    ...pct(20, "books", "libros", 50),
    ...lead(
      "The goal is 100%. Drag the handle to show how much was read.",
      "La meta es el 100%. Arrastra el control para mostrar cuánto se leyó.",
    ),
    part2: {
      config: { percent: 150 },
      ...lead(
        "Drag past 100%. A percent over 100 means more than one whole.",
        "Arrastra más allá del 100%. Un porcentaje mayor que 100 significa más de un total.",
      ),
    },
  },
  "4-2": {
    ...pct(100, "squares", "cuadros", 25, {
      views: { grid: true, tape: false, line: true, read: true },
    }),
    ...lead(
      "Move the handle. The fraction, decimal and percent change together.",
      "Mueve el control. La fracción, el decimal y el porcentaje cambian juntos.",
    ),
  },
  "4-3": {
    ...pct(80, "dollars", "dólares", 25),
    ...lead(
      "Snap to 10%, 25%, 50% and 75% to estimate before you calculate.",
      "Usa 10%, 25%, 50% y 75% para estimar antes de calcular.",
    ),
  },
  "4-4": {
    ...pct(60, "students", "estudiantes", 35),
    ...lead(
      "Change the whole and the percent. See how the amount changes.",
      "Cambia el total y el porcentaje. Mira cómo cambia la cantidad.",
    ),
  },
  "4-5": {
    ...pct(40, "points", "puntos", 25),
    ...lead(
      "The part and the percent are known. Change the whole until it fits.",
      "Se conocen la parte y el porcentaje. Cambia el total hasta que encaje.",
    ),
  },
};

/** The model spec for a lesson page, or null when its Explore stage has no interactive model yet. */
export function missionModelFor(config) {
  const id = String(config?.lessonId || "");
  const part2 = /-part2$/.test(id);
  const base = LESSON_MODELS[id.replace(/-part2$/, "")];
  if (!base) return null;
  const over = part2 ? base.part2 || {} : {};
  return {
    family: over.family || base.family,
    config: { ...base.config, ...(over.config || {}) },
    leadEn: over.leadEn || base.leadEn,
    leadEs: over.leadEs || base.leadEs,
  };
}
