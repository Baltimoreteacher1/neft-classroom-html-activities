// Everything the learner reads that is not generated from a round's numbers: game text, skill names, interface labels.
// English and Spanish side by side; wrong-answer feedback lives in copy-mistakes.js and hints in hints-copy.js.
// @fm2 FM-020 FM-021
const T = (en, es) => ({ en, es });

export const TITLE = T("Math Puzzle Studio", "Estudio de Acertijos Matemáticos");
export const TAGLINE = T(
  "Balance scales, number bonds and grids where every clue has to fit.",
  "Balanzas, enlaces numéricos y cuadrículas donde todas las pistas deben encajar.",
);
export const HOW_TO = {
  en: [
    "Read the puzzle at the top. The clues tell you what has to be true when you are finished.",
    "Tap a tile to pick it up, then tap an empty spot to place it. You can also drag a tile. Tap a placed tile to take it back.",
    "On a balance scale, watch the beam: it tips toward the heavier side and says by how much. On an equation scale, choose a move and do it to both pans.",
    "Press Check when every spot is filled. Undo takes back your last move and Clear starts the board again.",
  ],
  es: [
    "Lee el reto de arriba. Las pistas dicen qué debe ser verdad cuando termines.",
    "Toca una ficha para tomarla y luego toca un lugar vacío para colocarla. También puedes arrastrarla. Toca una ficha colocada para quitarla.",
    "En una balanza, mira la barra: se inclina hacia el lado más pesado y dice por cuánto. En una balanza de ecuaciones, elige un movimiento y hazlo en los dos platillos.",
    "Toca Comprobar cuando todos los lugares estén llenos. Deshacer quita tu último movimiento y Borrar todo empieza el tablero de nuevo.",
  ],
};
export const TOGETHER = T(
  'Take turns. One person places a tile and explains which clue it satisfies; the other asks, "How do you know it fits?" If the scale tips, talk about what to change. Swap roles after every puzzle.',
  "Túrnense. Una persona coloca una ficha y explica qué pista cumple; la otra pregunta: «¿Cómo sabes que encaja?». Si la balanza se inclina, conversen sobre qué cambiar. Cambien de papel después de cada reto.",
);
export const ICON = `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d="M24 12v28" stroke="#1f2740" stroke-width="3" stroke-linecap="round"/><rect x="14" y="38" width="20" height="5" rx="2" fill="#F7F4EC" stroke="#1f2740" stroke-width="2"/><path d="M8 17l32-6" stroke="#1FA6A2" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="14" r="3.5" fill="#d99a12" stroke="#1f2740" stroke-width="1.5"/><path d="M8 17l-4 11h8zM40 11l-4 11h8z" fill="#dff5ec" stroke="#1f2740" stroke-width="2" stroke-linejoin="round"/><rect x="5.5" y="29" width="5" height="5" rx="1" fill="#fbefcf" stroke="#1f2740" stroke-width="1.5"/></svg>`;

const NUMBER = T("Number puzzles", "Acertijos de números");
const GRIDS = T("Grid puzzles", "Acertijos de cuadrícula");
const OPS = T("Operations and forms", "Operaciones y formas");
const ALGEBRA = T("Balance and equations", "Balanza y ecuaciones");

export const SKILL_COPY = {
  "bond-parts": [
    NUMBER,
    T("Number bonds: the missing part", "Enlaces numéricos: la parte que falta"),
  ],
  "balance-same": [
    NUMBER,
    T("Balance the scale: the same amount", "Equilibra la balanza: la misma cantidad"),
  ],
  "equal-sign": [
    NUMBER,
    T("The equal sign means the same amount", "El signo igual significa la misma cantidad"),
  ],
  "missing-addend": [
    NUMBER,
    T("The missing number in an equation", "El número que falta en una ecuación"),
  ],
  "grid-sums": [GRIDS, T("Sum grids", "Cuadrículas de sumas")],
  "magic-triangle": [GRIDS, T("Magic triangles", "Triángulos mágicos")],
  "magic-square": [GRIDS, T("Magic squares", "Cuadrados mágicos")],
  "factor-grid": [GRIDS, T("Factor and product grids", "Cuadrículas de factores y productos")],
  kenken: [GRIDS, T("KenKen cage puzzles", "Acertijos de jaulas KenKen")],
  "factor-pairs": [OPS, T("Factor puzzles", "Acertijos de factores")],
  "target-ops": [OPS, T("Order of operations targets", "Metas con el orden de las operaciones")],
  "equal-forms": [OPS, T("Equal values in different forms", "Valores iguales en distintas formas")],
  "scale-onestep": [ALGEBRA, T("Scale equations: one step", "Ecuaciones en la balanza: un paso")],
  "inequality-scale": [ALGEBRA, T("Inequality scales", "Balanzas de desigualdades")],
  "scale-twostep": [
    ALGEBRA,
    T("Scale equations: two steps", "Ecuaciones en la balanza: dos pasos"),
  ],
  "equiv-expr": [ALGEBRA, T("Equivalent expressions", "Expresiones equivalentes")],
  "scale-system": [ALGEBRA, T("Two scales, two unknowns", "Dos balanzas, dos incógnitas")],
  "scale-both-sides": [ALGEBRA, T("Variables on both sides", "Variables en los dos lados")],
  "pythag-squares": [ALGEBRA, T("Squares that balance", "Cuadrados que se equilibran")],
};

// ---- interface labels -----------------------------------------------------------------------------------------
export const UI = {
  tiles: T("Tiles", "Fichas"),
  board: T("Puzzle board", "Tablero del reto"),
  check: T("Check", "Comprobar"),
  undo: T("Undo", "Deshacer"),
  clear: T("Clear", "Borrar todo"),
  empty: T("empty", "vacío"),
  tip: T(
    "Tap a tile, then tap an empty spot. Tap a placed tile to take it back.",
    "Toca una ficha y luego un lugar vacío. Toca una ficha colocada para quitarla.",
  ),
  fillAll: T(
    "Fill every empty spot first, then check.",
    "Primero llena todos los lugares vacíos y luego comprueba.",
  ),
  selected: T(
    "Selected {tile}. Now tap an empty spot.",
    "Elegiste {tile}. Ahora toca un lugar vacío.",
  ),
  placed: T("Placed {tile} in {spot}.", "Colocaste {tile} en {spot}."),
  removed: T("Took {tile} out of {spot}.", "Quitaste {tile} de {spot}."),
  undone: T("Undid your last move.", "Deshiciste tu último movimiento."),
  cleared: T("Cleared the board.", "Borraste el tablero."),
  nothingToUndo: T("There is nothing to undo.", "No hay nada que deshacer."),
  wrongNumberSpot: T(
    "That spot needs a number, not an operation.",
    "Ese lugar necesita un número, no una operación.",
  ),
  wrongOpSpot: T(
    "That spot needs an operation, not a number.",
    "Ese lugar necesita una operación, no un número.",
  ),
  operation: T("Operation", "Operación"),
  opNames: {
    "+": T("plus", "más"),
    "−": T("minus", "menos"),
    "×": T("times", "por"),
    "÷": T("divided by", "entre"),
  },
  // scales
  scaleN: T("Scale {n}", "Balanza {n}"),
  leftPan: T("Left pan", "Platillo izquierdo"),
  rightPan: T("Right pan", "Platillo derecho"),
  balanced: T("The scale balances.", "La balanza está equilibrada."),
  leftHeavier: T("Left is heavier by {n}{unit}.", "El lado izquierdo pesa {n}{unit} más."),
  rightHeavier: T("Right is heavier by {n}{unit}.", "El lado derecho pesa {n}{unit} más."),
  areaUnit: T(" square units", " unidades cuadradas"),
  goalHeavier: T("Goal: the left pan is heavier.", "Meta: el platillo izquierdo pesa más."),
  goalLighter: T("Goal: the left pan is lighter.", "Meta: el platillo izquierdo pesa menos."),
  goalEqual: T("Goal: both pans weigh the same.", "Meta: los dos platillos pesan lo mismo."),
  weights: T("Weights", "Pesos"),
  placeWeights: T("Place the weights above to see how this scale tips.", "Coloca los pesos de arriba para ver cómo se inclina esta balanza."),
  xWeighs: T("Each x-box weighs", "Cada caja x pesa"),
  cubeWeighs: T("Each cube (x) weighs", "Cada cubo (x) pesa"),
  ballWeighs: T("Each ball (y) weighs", "Cada pelota (y) pesa"),
  boxName: { x: T("x-box", "caja x"), cube: T("cube x", "cubo x"), ball: T("ball y", "pelota y") },
  boxValue: T("{name}, weighs {value}", "{name}, pesa {value}"),
  boxUnset: T("{name}, weight not placed yet", "{name}, peso sin colocar"),
  side: T("side {n}", "lado {n}"),
  area: T("area {n}", "área {n}"),
  sampleX: T("Weight of x", "Peso de x"),
  lowerX: T("Lower x", "Bajar x"),
  raiseX: T("Raise x", "Subir x"),
  sampleHelp: T(
    "Try other weights for x. An equivalent expression balances for every x.",
    "Prueba otros pesos para x. Una expresión equivalente se equilibra con cualquier x.",
  ),
  // slot names
  spot: T("Spot {n}", "Lugar {n}"),
  panSpot: T("{pan}, spot {n}", "{pan}, lugar {n}"),
  bond: [T("Whole", "Total"), T("Left part", "Parte izquierda"), T("Right part", "Parte derecha")],
  cell: T("Row {r}, column {c}", "Fila {r}, columna {c}"),
  cageCell: T("Row {r}, column {c}, cage {label}", "Fila {r}, columna {c}, jaula {label}"),
  triangle: [
    T("Top corner", "Vértice de arriba"),
    T("Bottom left corner", "Vértice de abajo a la izquierda"),
    T("Bottom right corner", "Vértice de abajo a la derecha"),
    T("Left side", "Lado izquierdo"),
    T("Bottom side", "Lado de abajo"),
    T("Right side", "Lado derecho"),
  ],
  colFactor: T("Column factor {c}", "Factor de la columna {c}"),
  rowFactor: T("Row factor {r}", "Factor de la fila {r}"),
  product: T("Product, row {r}, column {c}", "Producto, fila {r}, columna {c}"),
  first: T("First number", "Primer número"),
  second: T("Second number", "Segundo número"),
  numberSpot: T("Number spot {n}", "Lugar de número {n}"),
  opSpot: T("Operation spot {n}", "Lugar de operación {n}"),
  blank: T("The blank", "El espacio"),
  cube: T("Cube weight", "Peso del cubo"),
  ball: T("Ball weight", "Peso de la pelota"),
  xSpot: T("Weight of x", "Peso de x"),
  // boards
  rowTotal: T("Row {r} total", "Total de la fila {r}"),
  colTotal: T("Column {c} total", "Total de la columna {c}"),
  magicSum: T(
    "Every row, column and diagonal adds to {n}.",
    "Cada fila, columna y diagonal suma {n}.",
  ),
  triangleSum: T("Every side adds to {n}.", "Cada lado suma {n}."),
  productClue: T("first number × second number = {n}", "primer número × segundo número = {n}"),
  sumClue: T("first number + second number = {n}", "primer número + segundo número = {n}"),
  gapClue: T(
    "the second number is {n} more than the first",
    "el segundo número es {n} más que el primero",
  ),
  cluesLabel: T("Clues", "Pistas"),
  exprLabel: T("Expression", "Expresión"),
  exprWaiting: T(
    "Fill every spot to see what the expression makes.",
    "Llena todos los lugares para ver cuánto da la expresión.",
  ),
  exprMakes: T("The expression makes {n}.", "La expresión da {n}."),
  exprBelowZero: T(
    "The expression makes a number below zero.",
    "La expresión da un número menor que cero.",
  ),
  exprCannot: T("The expression cannot be worked out.", "La expresión no se puede calcular."),
  target: T("target", "meta"),
  kenkenRules: T(
    "Use 1 to {n}. No repeats in a row or column. Each cage reaches its target.",
    "Usa del 1 al {n}. Sin repetir en filas ni columnas. Cada jaula llega a su meta.",
  ),
  // equation scale
  moveTip: T("Choose an amount and which pans, then choose a move. The beam shows what is true.", "Elige una cantidad y qué platillos, y luego un movimiento. La barra muestra lo que es verdad."),
  amount: T("Amount", "Cantidad"),
  moreAmount: T("More", "Más"),
  lessAmount: T("Less", "Menos"),
  whichPans: T("Which pans?", "¿Qué platillos?"),
  bothPans: T("Both pans", "Los dos platillos"),
  leftOnly: T("Left pan only", "Solo el izquierdo"),
  rightOnly: T("Right pan only", "Solo el derecho"),
  takeWeights: T("Take off weights", "Quitar pesas"),
  takeBoxes: T("Take off x-boxes", "Quitar cajas x"),
  split: T("Split into equal groups", "Dividir en grupos iguales"),
  movesLabel: T("Moves", "Movimientos"),
  history: T("Your moves", "Tus movimientos"),
  noMoves: T("No moves yet.", "Todavía no hay movimientos."),
  loose: T("loose weights", "pesas sueltas"),
  boxes: T("x-boxes", "cajas x"),
  looseWeight: T("{n} loose weight", "{n} pesa suelta"),
  looseWeightsN: T("{n} loose weights", "{n} pesas sueltas"),
  xBox: T("x-box", "caja x"),
  moveTakeK: T("Took {n} loose weights off {pans}.", "Quitaste {n} pesas sueltas de {pans}."),
  moveTakeX: T("Took {n} x-boxes off both pans.", "Quitaste {n} cajas x de los dos platillos."),
  moveSplit: T(
    "Split both pans into {n} equal groups.",
    "Dividiste los dos platillos en {n} grupos iguales.",
  ),
  pansBoth: T("both pans", "los dos platillos"),
  pansLeft: T("the left pan", "el platillo izquierdo"),
  pansRight: T("the right pan", "el platillo derecho"),
  panLeftWord: T("left", "izquierdo"),
  panRightWord: T("right", "derecho"),
  equationNow: T("The scale now shows {text}.", "La balanza ahora muestra {text}."),
  solvedBox: T("One x-box is alone.", "Quedó una caja x sola."),
};
