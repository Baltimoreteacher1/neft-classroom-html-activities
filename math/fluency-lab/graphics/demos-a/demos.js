// Demo configuration for the gallery, one entry per kind. Strings here are gallery chrome (not shipped to learners).
export const DEMOS = {
  "fraction-model": {
    title: { en: "Fraction model", es: "Modelo de fracciones" },
    blurb: {
      en: "Strips and circles, denominators 1 to 12, equivalent fractions, compare, add and subtract on a common unit.",
      es: "Tiras y círculos, denominadores de 1 a 12, fracciones equivalentes, comparar, sumar y restar con una unidad común.",
    },
    modes: {
      explore: { prompt: { en: "Drag the handle, change the parts, compare or add two fractions.", es: "Arrastra el control, cambia las partes, compara o suma dos fracciones." }, config: {} },
      build: { prompt: { en: "Build any fraction you like. Try 7/4 with two wholes.", es: "Construye la fracción que quieras. Prueba 7/4 con dos enteros." }, config: { wholes: 2, maxWholes: 3 } },
      check: { prompt: { en: "Shade 3/4 of the whole, then check.", es: "Sombrea 3/4 del entero y luego comprueba." }, config: { target: { n: 3, d: 4 }, operation: "single" } },
    },
  },
  "number-line": {
    title: { en: "Number line", es: "Recta numérica" },
    blurb: {
      en: "Draggable points and jumps, any rational tick spacing, snapping, zoom, labels, comparing and ordering.",
      es: "Puntos y saltos que se arrastran, cualquier espaciado racional, ajuste, zoom, rótulos, comparar y ordenar.",
    },
    modes: {
      explore: {
        prompt: { en: "Drag A and B, change the tick spacing, zoom, and compare.", es: "Arrastra A y B, cambia el espaciado, acerca y compara." },
        config: { task: "compare", min: -1, max: 2, tick: { n: 1, d: 4 } },
      },
      build: {
        prompt: { en: "Start at 1/2 and jump to add 3/4. Then try a jump to the left.", es: "Empieza en 1/2 y salta para sumar 3/4. Luego prueba un salto a la izquierda." },
        config: { task: "jump", min: 0, max: 3, tick: { n: 1, d: 4 }, points: [{ n: 1, d: 2 }], controls: ["zoom"] },
      },
      check: {
        prompt: { en: "Place point A at 5/4, then check.", es: "Coloca el punto A en 5/4 y luego comprueba." },
        config: { task: "point", min: 0, max: 2, tick: { n: 1, d: 4 }, labels: "all", target: { n: 5, d: 4 } },
      },
    },
  },
  "place-value": {
    title: { en: "Place value blocks", es: "Bloques de valor posicional" },
    blurb: {
      en: "Base-ten blocks and a place-value chart from thousands to thousandths. Add, take away, trade and break.",
      es: "Bloques de base diez y una tabla de valor posicional de millares a milésimas. Agrega, quita, canjea y descompón.",
    },
    modes: {
      explore: { prompt: { en: "Add blocks, trade 10 for 1, or drag a column onto its neighbour.", es: "Agrega bloques, canjea 10 por 1 o arrastra una columna hasta la columna vecina." }, config: {} },
      build: { prompt: { en: "Build 3.45 with decimal blocks. The flat is one whole.", es: "Construye 3.45 con bloques decimales. La plancha es un entero." }, config: { decimals: true } },
      check: { prompt: { en: "Show 1,204 with the fewest blocks, then check.", es: "Muestra 1,204 con la menor cantidad de bloques y luego comprueba." }, config: { target: { n: 1204, d: 1 } } },
    },
  },
  array: {
    title: { en: "Array model", es: "Modelo de matrices" },
    blurb: {
      en: "Rows and columns up to 12 by 12, skip counting, splitting into groups, the area link and equal sharing.",
      es: "Filas y columnas hasta 12 por 12, conteo salteado, dividir en grupos, el vínculo con el área y repartir en partes iguales.",
    },
    modes: {
      explore: { prompt: { en: "Drag the edges, skip count, split into two groups, or switch to area and sharing.", es: "Arrastra los bordes, cuenta salteado, divide en dos grupos o cambia a área y repartir." }, config: {} },
      build: { prompt: { en: "Make an array for 6 × 7, then split it into 6 × 5 and 6 × 2.", es: "Haz una matriz para 6 × 7 y luego divídela en 6 × 5 y 6 × 2." }, config: {} },
      check: { prompt: { en: "Build an array that shows 24. Any rows and columns that work.", es: "Construye una matriz que muestre 24. Sirve cualquier número de filas y columnas." }, config: { target: 24 } },
    },
  },
  "area-model": {
    title: { en: "Area model", es: "Modelo de área" },
    blurb: {
      en: "Partial products with adjustable splits for whole numbers and decimals, and a binomial form for grades 7 and 8.",
      es: "Productos parciales con divisiones ajustables para números enteros y decimales, y una forma de binomios para los grados 7 y 8.",
    },
    modes: {
      explore: { prompt: { en: "Change the factors, drag the dividers, split by place value.", es: "Cambia los factores, arrastra los divisores y divide por valor posicional." }, config: { a: { n: 234, d: 10 }, b: 14 } },
      build: { prompt: { en: "Split 23 × 14 into friendly parts. Try 20 + 3 and 10 + 4.", es: "Divide 23 × 14 en partes fáciles. Prueba 20 + 3 y 10 + 4." }, config: { a: 23, b: 14 } },
      check: { prompt: { en: "Split 23 × 14 into parts, fill in each partial area and the total, then check.", es: "Divide 23 × 14 en partes, escribe cada área parcial y el total y luego comprueba." }, config: { a: 23, b: 14, target: 322 } },
    },
  },
  "area-model-binomial": {
    kind: "area-model",
    title: { en: "Area model, binomials", es: "Modelo de área, binomios" },
    blurb: { en: "Factor form and expanded form for grades 7 and 8.", es: "Forma factorizada y forma desarrollada para los grados 7 y 8." },
    modes: {
      explore: { prompt: { en: "Change the four numbers and watch the product.", es: "Cambia los cuatro números y observa el producto." }, config: { kind: "binomial", a: [1, 2], b: [1, 3] } },
      build: { prompt: { en: "Make (2x − 3)(x + 4). Negative areas are hatched.", es: "Forma (2x − 3)(x + 4). Las áreas negativas tienen rayas." }, config: { kind: "binomial", a: [2, -3], b: [1, 4] } },
      check: { prompt: { en: "Find two binomials whose product is x² + 5x + 6, then check.", es: "Halla dos binomios cuyo producto sea x² + 5x + 6 y luego comprueba." }, config: { kind: "binomial", a: [1, 1], b: [1, 1], target: { x2: 1, x1: 5, x0: 6 } } },
    },
  },
  "ratio-table": {
    title: { en: "Ratio table", es: "Tabla de razones" },
    blurb: {
      en: "Editable equivalent ratios, scale arrows, a unit rate and a tape picture.",
      es: "Razones equivalentes editables, flechas de escala, una tasa unitaria y un dibujo de cinta.",
    },
    modes: {
      explore: { prompt: { en: "Edit any cell, add a scaled row, and watch the arrows and tape.", es: "Edita cualquier celda, agrega una fila escalada y observa las flechas y la cinta." }, config: {} },
      build: { prompt: { en: "Start with 2 : 3 and build rows for 10 and 14 cups of flour.", es: "Empieza con 2 : 3 y construye filas para 10 y 14 tazas de harina." }, config: {} },
      check: {
        prompt: { en: "Fill every blank so each row is the same ratio as 2 : 3, then check.", es: "Llena cada espacio para que cada fila tenga la misma razón que 2 : 3 y luego comprueba." },
        config: { rows: [{ a: 2, b: 3 }, { a: 6, b: null }, { a: null, b: 12 }], target: { a: 2, b: 3 }, unitRate: true },
      },
    },
  },
};
