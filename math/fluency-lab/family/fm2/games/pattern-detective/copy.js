// Pattern Detective words: title, how to play, family play, and every label on the screen. English and Spanish.
// @fm2 FM-013 FM-020 FM-021
export const TITLE = { en: "Pattern Detective", es: "Detective de Patrones" };
export const TAGLINE = {
  en: "Test a hidden rule with a few clues, then prove you found it.",
  es: "Pon a prueba una regla escondida con pocas pistas y demuestra que la encontraste.",
};
export const HOW_TO = {
  en: [
    "A rule is hidden. Use a probe to ask the pattern or machine a question, and see what comes back.",
    "You only get a few probes, so choose them carefully. Every answer goes into your clue table.",
    "Build your rule from your clues. If it disagrees with a clue, you will be told which one.",
    "Last, predict a faraway answer. If your rule and your prediction are both right, you solved the case!",
  ],
  es: [
    "Hay una regla escondida. Usa una prueba para hacerle una pregunta al patrón o a la máquina y mira qué responde.",
    "Solo tienes pocas pruebas, así que elígelas con cuidado. Cada respuesta se anota en tu tabla de pistas.",
    "Arma tu regla con tus pistas. Si no coincide con una pista, te diremos con cuál.",
    "Al final, predice una respuesta lejana. Si tu regla y tu predicción son correctas, ¡resolviste el caso!",
  ],
};
export const TOGETHER = {
  en: 'One person is the Detective and chooses each probe. The other is the Partner: ask, "Why that input?" before the probe, and "What does the clue tell us?" after it. Agree on the rule together, then each of you predicts the faraway answer before you check. Swap roles every round.',
  es: 'Una persona es la Detective y elige cada prueba. La otra es la Compañera: pregunta "¿Por qué esa entrada?" antes de la prueba y "¿Qué nos dice la pista?" después. Pónganse de acuerdo en la regla y cada una predice la respuesta lejana antes de comprobar. Cambien de papel en cada ronda.',
};

export const UI = {
  probesLeft: { en: "Probes left: {left} of {total}", es: "Pruebas que quedan: {left} de {total}" },
  probeBtn: { en: "Probe", es: "Probar" },
  tryLabel: { en: "{name} to try", es: "{name} para probar" },
  tableTitle: { en: "Clue table", es: "Tabla de pistas" },
  noClues: {
    en: "No clues yet. Use a probe to get one.",
    es: "Aún no hay pistas. Usa una prueba para conseguir una.",
  },
  freeClue: { en: "free clue", es: "pista gratis" },
  machine: { en: "Machine", es: "Máquina" },
  gotBack: { en: "You tried {name} {x}. It gave {y}.", es: "Probaste {name} {x}. Dio {y}." },
  already: {
    en: "You already tried {x}: it gave {y}. That did not use a probe.",
    es: "Ya probaste {x}: dio {y}. Eso no gastó una prueba.",
  },
  needWhole: { en: "Type a whole number to try.", es: "Escribe un número entero para probar." },
  outOfRange: {
    en: "Try a whole number from {lo} to {hi}.",
    es: "Prueba con un número entero de {lo} a {hi}.",
  },
  onlyMultiples: {
    en: "This machine takes multiples of {m} from {lo} to {hi}.",
    es: "Esta máquina recibe múltiplos de {m} de {lo} a {hi}.",
  },
  noProbes: {
    en: "No probes left. Study your clues, or press Reset this puzzle for a fresh set of probes.",
    es: "No quedan pruebas. Estudia tus pistas o pulsa Reiniciar este reto para tener pruebas nuevas.",
  },
  ruleTitle: { en: "My rule", es: "Mi regla" },
  coreTitle: { en: "My core: the part that repeats", es: "Mi núcleo: la parte que se repite" },
  coreEmpty: {
    en: "Tap the shapes below to build the core.",
    es: "Toca las figuras de abajo para armar el núcleo.",
  },
  coreAdd: { en: "Add {name} to the core", es: "Agregar {name} al núcleo" },
  coreSlot: { en: "Core shape {n}: {name}", es: "Figura {n} del núcleo: {name}" },
  undo: { en: "Undo", es: "Deshacer" },
  clear: { en: "Clear", es: "Borrar" },
  cell: { en: "Cell {n}", es: "Casilla {n}" },
  cellHidden: {
    en: "Cell {n}, hidden. Press to reveal it.",
    es: "Casilla {n}, escondida. Pulsa para descubrirla.",
  },
  cellShown: { en: "Cell {n}: {name}", es: "Casilla {n}: {name}" },
  cellFree: { en: "Cell {n}: {name} (free clue)", es: "Casilla {n}: {name} (pista gratis)" },
  cellLocked: {
    en: "Cell {n}, hidden. No probes left.",
    es: "Casilla {n}, escondida. No quedan pruebas.",
  },
  strip: { en: "Pattern strip", es: "Tira del patrón" },
  readoutCell: { en: "Cell {n} is {name}.", es: "La casilla {n} es {name}." },
  predictCell: {
    en: "Prediction: which shape is in cell {far}?",
    es: "Predicción: ¿qué figura está en la casilla {far}?",
  },
  predictNum: { en: "Prediction: when “{in}” is {far}, what is “{out}”?", es: "Predicción: si «{in}» es {far}, ¿cuánto vale «{out}»?" },
  predictTwo: {
    en: "Prediction: what is machine B's output at step {far}?",
    es: "Predicción: ¿cuál es la salida de la máquina B en el paso {far}?",
  },
  predictLabel: { en: "Your prediction", es: "Tu predicción" },
  check: { en: "Check my rule and prediction", es: "Comprobar mi regla y mi predicción" },
  incomplete: {
    en: "Fill in your rule and your prediction first.",
    es: "Primero completa tu regla y tu predicción.",
  },
  incompleteClass: {
    en: "Answer the question about the pattern too.",
    es: "Responde también la pregunta sobre el patrón.",
  },
  solved: {
    en: "Case solved. Your rule is locked in.",
    es: "Caso resuelto. Tu regla quedó fijada.",
  },
  figEmpty: { en: "Figures you probe will appear here.", es: "Las figuras que pruebes aparecerán aquí." },
  tilesWord: { en: "tiles", es: "fichas" },
  fig1: { en: "Figure 1 has", es: "La figura 1 tiene" },
  eachNextFig: { en: "Each next figure", es: "Cada figura siguiente" },
  term1: { en: "Term 1 is", es: "El término 1 es" },
  atZero: { en: "When {v} is 0 the output is", es: "Cuando {v} es 0 la salida es" },
  eachNext: { en: "Each next one", es: "Cada siguiente" },
  adds: { en: "adds", es: "suma" },
  multiplies: { en: "multiplies by", es: "multiplica por" },
  startsAt: { en: "Starts at", es: "Empieza en" },
  stepLabel: { en: "Amount", es: "Cantidad" },
  startLabel: { en: "Starting number", es: "Número inicial" },
  opLabel: { en: "Adds or multiplies", es: "Suma o multiplica" },
  machineA: { en: "Machine A", es: "Máquina A" },
  machineB: { en: "Machine B", es: "Máquina B" },
  outputIs: { en: "Output =", es: "Salida =" },
  inputWord: { en: "input", es: "entrada" },
  thenDo: { en: "then", es: "luego" },
  firstOp: { en: "First operation", es: "Primera operación" },
  secondOp: { en: "Second operation", es: "Segunda operación" },
  firstNum: { en: "First number", es: "Primer número" },
  secondNum: { en: "Second number", es: "Segundo número" },
  noSecond: { en: "(no second step)", es: "(sin segundo paso)" },
  slope: { en: "Number multiplying {v}", es: "Número que multiplica a {v}" },
  intercept: { en: "Number added", es: "Número que se suma" },
  typeOwn: { en: "Type my own rule", es: "Escribir mi propia regla" },
  useBuilder: { en: "Use the rule builder", es: "Usar el armador de reglas" },
  typedLabel: { en: "Your rule, for example 2{v} + 1", es: "Tu regla, por ejemplo 2{v} + 1" },
  keypad: { en: "Rule keys", es: "Teclas de la regla" },
  insert: { en: "Insert {key}", es: "Insertar {key}" },
  graphTitle: { en: "Graph of your clues", es: "Gráfica de tus pistas" },
  graphNone: { en: "Your clues will be plotted here.", es: "Aquí se marcarán tus pistas." },
  pairsTitle: { en: "Ordered pairs (A, B)", es: "Pares ordenados (A, B)" },
  opNames: {
    en: { "+": "plus", "−": "minus", "×": "times", "÷": "divided by", none: "no second step" },
    es: { "+": "más", "−": "menos", "×": "por", "÷": "dividido entre", none: "sin segundo paso" },
  },
  clsQ: {
    parity: { en: "What do the terms look like?", es: "¿Cómo son los términos?" },
    prop: { en: "Is this relationship proportional?", es: "¿Esta relación es proporcional?" },
    linear: {
      en: "Is this function linear or nonlinear?",
      es: "¿Esta función es lineal o no lineal?",
    },
    dep: {
      en: "Which quantity is the dependent variable?",
      es: "¿Cuál cantidad es la variable dependiente?",
    },
    times: {
      en: "Each B term is how many times the A term at the same step?",
      es: "¿Cuántas veces el término A del mismo paso es cada término B?",
    },
  },
  clsOpt: {
    even: { en: "All even", es: "Todos pares" },
    odd: { en: "All odd", es: "Todos impares" },
    alt: { en: "They switch between even and odd", es: "Alternan entre pares e impares" },
    yes: { en: "Yes, proportional", es: "Sí, es proporcional" },
    no: { en: "No, not proportional", es: "No es proporcional" },
    lin: { en: "Linear", es: "Lineal" },
    non: { en: "Nonlinear", es: "No lineal" },
    times: { en: "{n} times", es: "{n} veces" },
  },
  symbols: {
    circle: { en: "circle", es: "círculo" },
    square: { en: "square", es: "cuadrado" },
    triangle: { en: "triangle", es: "triángulo" },
    star: { en: "star", es: "estrella" },
  },
  figureAlt: { en: "Figure {n} has {y} tiles", es: "La figura {n} tiene {y} fichas" },
  chartTitle: { en: "Hundred chart", es: "Tablero de cien" },
};
