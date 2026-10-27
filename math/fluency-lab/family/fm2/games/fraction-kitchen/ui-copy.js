// Labels, equations and announcements for the Fraction Kitchen widgets, in English and Spanish. @fm2 FM-020 FM-021
const T = (en, es) => ({ en, es });

export const UI = {
  // shared
  undo: T("Undo", "Deshacer"),
  undone: T("Last step undone.", "Se deshizo el último paso."),
  stepUp: T("More: {name}", "Más: {name}"),
  stepDown: T("Fewer: {name}", "Menos: {name}"),
  stepBigUp: T("Up one whole", "Subir un entero"),
  bigUpText: T("+1 whole", "+1 entero"),
  bigDownText: T("−1 whole", "−1 entero"),
  stepBigDown: T("Down one whole", "Bajar un entero"),

  // shapes
  leftover: T("leftover", "lo que sobra"),
  figureEqual: T(
    "{food}, cut into {n} equal parts, {k} served.",
    "{food}, cortado en {n} partes iguales, {k} servidas.",
  ),
  figureUnequal: T(
    "{food}, cut into {n} parts that are not equal, {k} served.",
    "{food}, cortado en {n} partes que no son iguales, {k} servidas.",
  ),
  eqWhole: T("{food} is whole: it is not cut yet.", "{food} está entero: todavía no está cortado."),
  eqNone: T(
    "Cut into {n} equal parts. Nothing is served yet.",
    "Cortado en {n} partes iguales. Todavía no hay nada servido.",
  ),
  eqServed: T("Served: {k} of {n} equal parts", "Servido: {k} de {n} partes iguales"),
  eqPieces: T("Served: {k} pieces, each 1/{n}", "Servido: {k} piezas, cada una de 1/{n}"),
  eqFix: T(
    "{n} equal parts. Each part is {share} of the whole.",
    "{n} partes iguales. Cada parte es {share} del entero.",
  ),
  eqFixUnequal: T("These {n} parts are not all the same size.", "Estas {n} partes no tienen todas el mismo tamaño."),
  eqUnequal: T(
    "Served {value} of the whole. The parts are not equal-sized, so you cannot name it by counting pieces.",
    "Servido: {value} del entero. Las partes no tienen el mismo tamaño, así que no puedes nombrarlo contando piezas.",
  ),
  cmpMore: T("{value} is more than {ref}.", "{value} es mayor que {ref}."),
  cmpLess: T("{value} is less than {ref}.", "{value} es menor que {ref}."),
  cmpEqual: T("{value} is equal to {ref}.", "{value} es igual a {ref}."),
  refMatch: T("Amount to match: {ref}", "Cantidad por igualar: {ref}"),
  refCompare: T("Amount to compare with: {ref}", "Cantidad para comparar: {ref}"),
  refFigure: T("Reference model showing {ref}.", "Modelo de referencia que muestra {ref}."),
  cutName: T("Cut {k}", "Corte {k}"),
  slideBackCircle: T("Turn cut {k} back", "Girar el corte {k} hacia atrás"),
  slideOnCircle: T("Turn cut {k} forward", "Girar el corte {k} hacia adelante"),
  slideLeft: T("Slide cut {k} left", "Deslizar el corte {k} a la izquierda"),
  slideRight: T("Slide cut {k} right", "Deslizar el corte {k} a la derecha"),
  join: T("Join", "Unir"),
  joinAria: T("Join the two pieces beside cut {k}", "Unir las dos piezas junto al corte {k}"),
  slideNote: T(
    "Sliding works with 2, 3, 4 or 6 parts. Use “Even out” to cut equal parts again.",
    "Deslizar funciona con 2, 3, 4 o 6 partes. Usa “Igualar” para cortar partes iguales otra vez.",
  ),
  pieceServed: T("Piece {n} of {total}, served", "Pieza {n} de {total}, servida"),
  pieceNotServed: T("Piece {n} of {total}, not served", "Pieza {n} de {total}, sin servir"),
  piecesLabel: T("Pieces", "Piezas"),
  piecesHint: T(
    "Tap a piece to serve it. Tap again to put it back.",
    "Toca una pieza para servirla. Tócala otra vez para devolverla.",
  ),
  checkWhole: T(
    "Not cut yet. Use the stepper to cut equal parts.",
    "Todavía sin cortar. Usa el contador para cortar partes iguales.",
  ),
  checkEqual: T(
    "Equal-parts check: all {n} parts are the same size.",
    "Revisión de partes iguales: las {n} partes tienen el mismo tamaño.",
  ),
  checkUnequal: T(
    "Equal-parts check: these parts aren't equal-sized ({sizes}).",
    "Revisión de partes iguales: estas partes no tienen el mismo tamaño ({sizes}).",
  ),
  cutInto: T("Cut into", "Cortar en"),
  partsLabel: T("Number of equal parts", "Número de partes iguales"),
  partsText: T("{n} equal parts", "{n} partes iguales"),
  partsWhole: T("1 whole (not cut)", "1 entero (sin cortar)"),
  evenOut: T("Even out the cuts", "Igualar los cortes"),
  showCuts: T("Fine-tune the cuts", "Ajustar los cortes"),
  hideCuts: T("Hide the fine-tuning", "Ocultar el ajuste"),
  submitServe: T("Serve it", "Servir"),
  submitFix: T("Check the cuts", "Revisar los cortes"),

  // cups and number lines
  marksOf: T("{steps} marks of 1/{ticks}", "{steps} marcas de 1/{ticks}"),
  markOf: T("{steps} mark of 1/{ticks}", "{steps} marca de 1/{ticks}"),
  eqLevel: T("Level: {what} = {value}", "Nivel: {what} = {value}"),
  eqMarker: T("Marker: {what} = {value}", "Marcador: {what} = {value}"),
  eqApprox: T(
    "Your fraction: {steps}/{ticks} = {dec} · {symbol} is about {digits}…",
    "Tu fracción: {steps}/{ticks} = {dec} · {symbol} es aproximadamente {digits}…",
  ),
  cupLabel: T(
    "Measuring cup of {food}, marked every 1/{ticks} cup, holding {value}.",
    "Taza medidora de {food}, con marcas cada 1/{ticks} de taza, con {value}.",
  ),
  stripLabel: T(
    "Number line from {lo} to {hi} with marks every 1/{ticks}; the marker is at {value}.",
    "Recta numérica de {lo} a {hi} con marcas cada 1/{ticks}; el marcador está en {value}.",
  ),
  marksBetween: T("Marks between whole numbers", "Marcas entre números enteros"),
  marksText: T("{m} marks", "{m} marcas"),
  marksOption: T("Marks every 1/{m}", "Marcas cada 1/{m}"),
  chooseCup: T("Choose a cup, marked every:", "Elige una taza, con marcas cada:"),
  chooseMarks: T("Marks every:", "Marcas cada:"),
  pourLevel: T("Pour to a level:", "Echa hasta un nivel:"),
  moveMarker: T("Move the marker:", "Mueve el marcador:"),
  levelLabel: T("Level", "Nivel"),
  markerLabel: T("Marker", "Marcador"),
  emptyCup: T("Empty the cup", "Vaciar la taza"),
  backToStart: T("Back to the start", "Volver al inicio"),
  verdictAsk: T("Is your fraction exactly {symbol}?", "¿Tu fracción es exactamente {symbol}?"),
  verdictEqual: T("Yes, exactly", "Sí, exactamente"),
  verdictClose: T("No, it is only close", "No, solo se acerca"),
  submitPour: T("Check my pour", "Revisar mi medida"),
  submitMarker: T("Check the marker", "Revisar el marcador"),

  // pitchers
  eqEmpty: T(
    "The pitcher is empty. Tap a scoop to add it.",
    "La jarra está vacía. Toca un cucharón para agregarlo.",
  ),
  pitcherLabel: T("Pitcher of {food} holding {value}.", "Jarra de {food} con {value}."),
  addScoop: T("Add a {size} scoop", "Agregar un cucharón de {size}"),
  removeScoop: T("Take out one {size} scoop", "Sacar un cucharón de {size}"),
  tapScoops: T("Tap scoops to add them:", "Toca cucharones para agregarlos:"),
  inPitcher: T("Scoops in the pitcher", "Cucharones en la jarra"),
  emptyPitcher: T("Empty the pitcher", "Vaciar la jarra"),
  overflow: T("The pitcher is overflowing!", "¡La jarra se desborda!"),
  maxScoops: T(
    "That is the most scoops the pitcher can take ({max}).",
    "Ese es el máximo de cucharones que cabe en la jarra ({max}).",
  ),
  submitPitcher: T("Check the pitcher", "Revisar la jarra"),
  servingsLabel: T(
    "{k} servings of {size} cup poured out.",
    "{k} porciones de {size} de taza servidas.",
  ),
  eqServing: T(
    "Poured: {k} × {size} = {poured} · Left in the pitcher: {left}",
    "Servido: {k} × {size} = {poured} · Queda en la jarra: {left}",
  ),
  pourOne: T("Pour one {size}-cup serving", "Servir una porción de {size} de taza"),
  pourOneAria: T("Pour one serving of {size}", "Servir una porción de {size}"),
  putBack: T("Put one back", "Devolver una"),
  submitDone: T("Done pouring", "Terminé de servir"),

  // place value
  placeScoop: T(
    "{name} scoops ({unit} cup each)",
    "Cucharones de {name} ({unit} de taza cada uno)",
  ),
  nothingYet: T("nothing yet", "nada todavía"),
  eqPlace: T(
    "In the pitcher: {parts} = {dec} cup = {frac}",
    "En la jarra: {parts} = {dec} de taza = {frac}",
  ),
  stillNeeded: T(
    "Still needed to reach the order: {gap} cup",
    "Todavía falta para llegar al pedido: {gap} de taza",
  ),
  overBy: T("Over the order by {gap} cup", "Te pasaste del pedido por {gap} de taza"),
  never: T("This can never be filled exactly", "Esto nunca se puede llenar con exactitud"),
  blockAsk: T("Which digits repeat forever?", "¿Qué dígitos se repiten para siempre?"),
  blockOption: T("The digits {b} repeat", "Se repiten los dígitos {b}"),
  submitPlace: T("Check my scoops", "Revisar mis cucharones"),
};
