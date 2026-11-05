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
  /* Data (Unit 2): the dot plot is editable; every measure updates as a dot moves. */
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
  "5-10": {
    ...fam("geometry", { mode: "volume", l: "3/2", w: 2, h: "4/3" }),
    ...lead(
      "Edges can be fractions. Count the small cubes in each layer.",
      "Las aristas pueden ser fracciones. Cuenta los cubitos de cada capa.",
    ),
  },
  /* Expressions and equations (Units 6 and 8): operations act on both sides. */
  "6-5": {
    ...fam("balance", { combine: [[2, 3]], x: 4 }),
    ...lead(
      "Try different values for x. Watch the tiles and the value change.",
      "Prueba distintos valores de x. Mira cómo cambian los cuadros y el valor.",
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
  /* Number line (Units 7 and 8) */
  "7-1": {
    ...fam("numberline", { mode: "opposites", value: 3 }),
    ...lead(
      "Drag a number. Its opposite is the same distance from zero on the other side.",
      "Arrastra un número. Su opuesto está a la misma distancia del cero, al otro lado.",
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
    family: base.family,
    config: { ...base.config, ...(over.config || {}) },
    leadEn: over.leadEn || base.leadEn,
    leadEs: over.leadEs || base.leadEs,
  };
}
