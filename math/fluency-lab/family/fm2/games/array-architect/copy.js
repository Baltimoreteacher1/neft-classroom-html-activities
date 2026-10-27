// Learner-facing text for Array Architect that is not feedback or hints: the game card, how-to steps and prompts.
// @fm2 FM-020 FM-011
import { fmt } from "../../lang.js";

export const GAME_TEXT = {
  title: { en: "Array Architect", es: "Arquitecto de Matrices" },
  tagline: {
    en: "Build arrays, rectangles and area models on a grid to meet the clues.",
    es: "Construye matrices, rectángulos y modelos de área en una cuadrícula para cumplir las pistas.",
  },
  together: {
    en: 'Take turns being the architect. One person builds on the grid while the other reads the clue aloud and asks, "How do you know the area is right?" Then swap.',
    es: 'Túrnense para ser el arquitecto. Una persona construye en la cuadrícula mientras la otra lee la pista en voz alta y pregunta: "¿Cómo sabes que el área está bien?". Luego cambien.',
  },
  howTo: {
    en: [
      "Read the clue at the top. It tells you what to build: a number of squares, certain sides, an area or a perimeter.",
      "Build on the grid. Tap squares, drag across them, or use the plus and minus buttons. With a keyboard, use the arrow keys and Space.",
      "Watch the readout above the grid. It counts rows, columns, area and perimeter as you build.",
      "Press Check my work when your build matches every clue. Some puzzles have many right answers, and some ask you to find them all.",
    ],
    es: [
      "Lee la pista de arriba. Te dice qué construir: una cantidad de cuadros, ciertos lados, un área o un perímetro.",
      "Construye en la cuadrícula. Toca los cuadros, arrastra sobre ellos o usa los botones de más y menos. Con teclado, usa las flechas y la barra espaciadora.",
      "Mira el resumen sobre la cuadrícula. Cuenta filas, columnas, área y perímetro mientras construyes.",
      "Presiona Revisar mi trabajo cuando tu construcción cumpla todas las pistas. Algunos retos tienen muchas respuestas correctas y otros piden encontrarlas todas.",
    ],
  },
};

const P = (en, es) => ({ en, es });
const PROMPTS = {
  rowsColsCounters: P(
    "Make {rows} rows with {cols} counters in each row.",
    "Haz {rows} filas con {cols} fichas en cada fila.",
  ),
  totalRows: P(
    "Make {area} counters in {rows} equal rows.",
    "Pon {area} fichas en {rows} filas iguales.",
  ),
  equalRowsMin: P(
    "Arrange {area} counters in equal rows. Use at least 2 rows and at least 2 counters in each row.",
    "Acomoda {area} fichas en filas iguales. Usa al menos 2 filas y al menos 2 fichas en cada fila.",
  ),
  equalRowsOf: P(
    "Make equal rows of {cols} with {area} counters in all.",
    "Haz filas iguales de {cols} con {area} fichas en total.",
  ),
  repeatAdd: P(
    "Build the array for {eq}. Each number in the sum is one row.",
    "Construye la matriz para {eq}. Cada número de la suma es una fila.",
  ),
  skipCount: P(
    "Build the array for counting by {step}s: {seq}. Each count is one row.",
    "Construye la matriz para contar de {step} en {step}: {seq}. Cada número que dices es una fila.",
  ),
  arrayAsk: P(
    "Build {rows} rows of {cols}. Then type how many there are in all.",
    "Construye {rows} filas de {cols}. Luego escribe cuántos hay en total.",
  ),
  arrayAskCols: P(
    "Build an array with {rows} rows and {area} in all. Then type how many are in each row.",
    "Construye una matriz con {rows} filas y {area} en total. Luego escribe cuántos hay en cada fila.",
  ),
  multArray: P(
    "Build an array for {rows} × {cols}: {rows} rows of {cols}. Then type the product.",
    "Construye una matriz para {rows} × {cols}: {rows} filas de {cols}. Luego escribe el producto.",
  ),
  multDiv: P(
    "A garden has {area} plants in {rows} equal rows. Build it, then type how many plants are in each row.",
    "Un jardín tiene {area} plantas en {rows} filas iguales. Constrúyelo y escribe cuántas plantas hay en cada fila.",
  ),
  paintCount: P(
    "Place {total} counters: tap {total} squares.",
    "Coloca {total} fichas: toca {total} cuadros.",
  ),
  paintPerRow: P(
    "Place {total} counters so that every row you use has {perRow}.",
    "Coloca {total} fichas de modo que cada fila que uses tenga {perRow}.",
  ),
  pairs: P(
    "Put {total} counters in two rows so each counter has a partner under or over it. Then choose even or odd.",
    "Pon {total} fichas en dos filas para que cada ficha tenga una pareja arriba o abajo. Luego elige par o impar.",
  ),
  pairsSide: P("Put {total} counters in two columns so each counter has a partner next to it. Then choose even or odd.", "Pon {total} fichas en dos columnas para que cada ficha tenga una pareja al lado. Luego elige par o impar."),
  commute: P(
    "Build {a} × {b} and add it to your list. Then turn it to build {b} × {a} and add that too.",
    "Construye {a} × {b} y agrégala a tu lista. Luego gírala para construir {b} × {a} y agrégala también.",
  ),
  commuteAll: P(
    "Find every array for {area} with at least 2 rows and 2 columns. Turn each one, too, and add them all to your list.",
    "Encuentra todas las matrices de {area} con al menos 2 filas y 2 columnas. Gira también cada una y agrégalas todas a tu lista.",
  ),
  factors: P(
    "Arrange {area} tiles in every possible rectangle. Add each rectangle to your list. A turned rectangle counts as the same one.",
    "Acomoda {area} baldosas en todos los rectángulos posibles. Agrega cada rectángulo a tu lista. Un rectángulo girado cuenta como el mismo.",
  ),
  tileShape: P(
    "Cover the shape with square tiles: tap each square to place a tile. Then type its area in square units.",
    "Cubre la figura con baldosas cuadradas: toca cada cuadro para poner una baldosa. Luego escribe su área en unidades cuadradas.",
  ),
  decompose: P(
    "Color the squares to cut this shape into rectangles (use at most {parts}). Then type the area of the whole shape.",
    "Colorea los cuadros para cortar esta figura en rectángulos (usa como máximo {parts}). Luego escribe el área de toda la figura.",
  ),
  perim: P(
    "Build a rectangle with a perimeter of {perim} units.",
    "Construye un rectángulo con un perímetro de {perim} unidades.",
  ),
  perimSide: P(
    "Build a rectangle with a perimeter of {perim} units and one side {side} units long.",
    "Construye un rectángulo con un perímetro de {perim} unidades y un lado de {side} unidades.",
  ),
  areaPerim: P(
    "Build a rectangle with an area of {area} square units and a perimeter of {perim} units.",
    "Construye un rectángulo con un área de {area} unidades cuadradas y un perímetro de {perim} unidades.",
  ),
  areaSide: P(
    "Build a rectangle with an area of {area} square units and one side {side} units long.",
    "Construye un rectángulo con un área de {area} unidades cuadradas y un lado de {side} unidades.",
  ),
  maxArea: P(
    "Build the rectangle with a perimeter of {perim} units that has the greatest area.",
    "Construye el rectángulo con un perímetro de {perim} unidades que tenga el área más grande.",
  ),
  modelGiven: P(
    "Use an area model to find {a} × {b}. Here {b} is split as {p} + {q}. Write each partial product and the total.",
    "Usa un modelo de área para hallar {a} × {b}. Aquí {b} se divide en {p} + {q}. Escribe cada producto parcial y el total.",
  ),
  modelPlace: P(
    "Use an area model to find {a} × {b}. Split {b} by place value, then write each partial product and the total.",
    "Usa un modelo de área para hallar {a} × {b}. Divide {b} por valor posicional y escribe cada producto parcial y el total.",
  ),
  modelDecimalGiven: P(
    "Use an area model to find {a} × {b}. Here {b} is split as {p} + {q}. Write each partial product and the total.",
    "Usa un modelo de área para hallar {a} × {b}. Aquí {b} se divide en {p} + {q}. Escribe cada producto parcial y el total.",
  ),
  modelDecimal: P(
    "Use an area model to find {a} × {b}. Split {b} into ones and tenths, then write each partial product and the total.",
    "Usa un modelo de área para hallar {a} × {b}. Divide {b} en unidades y décimos y escribe cada producto parcial y el total.",
  ),
  modelTwoDigit: P(
    "Use an area model to find {a} × {b}. Split both numbers by place value, then write the four partial products and the total.",
    "Usa un modelo de área para hallar {a} × {b}. Divide los dos números por valor posicional y escribe los cuatro productos parciales y el total.",
  ),
  distGiven: P(
    "Use an area model to show {a} × ({p} + {q}). Write each partial product and the total.",
    "Usa un modelo de área para mostrar {a} × ({p} + {q}). Escribe cada producto parcial y el total.",
  ),
  distPlace: P(
    "Use the distributive property to find {a} × {b}. Split {b} into tens and ones, then write each partial product and the total.",
    "Usa la propiedad distributiva para hallar {a} × {b}. Divide {b} en decenas y unidades y escribe cada producto parcial y el total.",
  ),
  distFree: P(
    "Use the distributive property to find {a} × {b}. Split {b} any way you like, then write each partial product and the total.",
    "Usa la propiedad distributiva para hallar {a} × {b}. Divide {b} como quieras y escribe cada producto parcial y el total.",
  ),
  expand: P(
    "Expand {expr} with an area model. Write each partial product and the total.",
    "Desarrolla {expr} con un modelo de área. Escribe cada producto parcial y el total.",
  ),
  prismBuild: P(
    "Build a prism {layers} layers tall, with {rows} rows and {cols} columns in each layer. Then type how many unit cubes it has.",
    "Construye un prisma de {layers} capas, con {rows} filas y {cols} columnas en cada capa. Luego escribe cuántos cubos unitarios tiene.",
  ),
  prismLayers: P(
    "A prism is made of {volume} unit cubes in {layers} equal layers. Build it.",
    "Un prisma está hecho de {volume} cubos unitarios en {layers} capas iguales. Constrúyelo.",
  ),
  prismAny: P(
    "Build a prism made of {volume} unit cubes. Use at least 2 layers, and make each layer at least 2 by 2.",
    "Construye un prisma hecho de {volume} cubos unitarios. Usa al menos 2 capas y haz cada capa de al menos 2 por 2.",
  ),
  scale: P(
    "Scale the {rows} by {cols} rectangle by a factor of {k}. Build the new rectangle, then pick how the area changes.",
    "Escala el rectángulo de {rows} por {cols} con un factor de {k}. Construye el rectángulo nuevo y elige cómo cambia el área.",
  ),
  gcf: P(
    "A floor is {a} units by {b} units. What is the largest square tile that covers it exactly, with no gaps and no cutting? Set the tile side.",
    "Un piso mide {a} unidades por {b} unidades. ¿Cuál es la baldosa cuadrada más grande que lo cubre exacto, sin huecos y sin cortar? Fija el lado de la baldosa.",
  ),
  lcm: P(
    "You have tiles that are {a} units by {b} units. Set the side of the smallest square you can cover exactly with these tiles.",
    "Tienes baldosas de {a} unidades por {b} unidades. Fija el lado del cuadrado más pequeño que puedes cubrir exacto con estas baldosas.",
  ),
  tiles: P(
    "Use these tiles to build one rectangle with no tiles left over: {poly}. Set its width and height.",
    "Usa estas fichas para construir un solo rectángulo sin que sobre ninguna: {poly}. Fija su ancho y su alto.",
  ),
};

export function prompt(key, vars = {}) {
  const p = PROMPTS[key];
  return { en: fmt(p.en, vars), es: fmt(p.es, vars) };
}
