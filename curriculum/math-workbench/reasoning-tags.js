/* Subset of data/misconception-taxonomy.json (label, Spanish label, watch-for) for the
 * misconceptions the analyzer can recognise from a student's own sentence. Keys must
 * exist in the taxonomy; the labels are copied so the Workbench needs no fetch. */
(function (root) {
  "use strict";
  root.MWReasoningTags = Object.freeze({
  "ratio-scaled-additively": {
    "label": "Scaled a ratio by adding instead of multiplying",
    "labelEs": "Escaló una razón sumando en vez de multiplicando",
    "watchFor": "Ask what ONE batch is worth, then how many batches — a ratio grows by copies, not by steps."
  },
  "ratio-as-difference": {
    "label": "Combined the two amounts instead of comparing them",
    "labelEs": "Combinó las dos cantidades en vez de compararlas",
    "watchFor": "Have them say the comparison out loud — “for every ___ there are ___” — before writing anything."
  },
  "ratio-inverted": {
    "label": "Flipped the ratio",
    "labelEs": "Invirtió la razón",
    "watchFor": "Have them label both quantities with units before writing the ratio."
  },
  "rate-not-per-one": {
    "label": "Gave the total instead of the unit rate",
    "labelEs": "Dio el total en vez de la tasa unitaria",
    "watchFor": "Ask “per ONE what?” and make them finish the sentence."
  },
  "op-added-instead-of-multiplied": {
    "label": "Added when the problem multiplies",
    "labelEs": "Sumó cuando el problema multiplica",
    "watchFor": "Ask what the operation *does* to the quantity before they compute."
  },
  "percent-used-as-whole-number": {
    "label": "Used the percent as a plain number",
    "labelEs": "Usó el porcentaje como número entero",
    "watchFor": "Make them say the percent as “per hundred” out loud."
  },
  "percent-scale-off-by-100": {
    "label": "Percent answer off by a factor of 100",
    "labelEs": "Respuesta de porcentaje errada por un factor de 100",
    "watchFor": "Benchmark against 50% and 10% before trusting the number."
  },
  "fraction-straight-across-division": {
    "label": "Divided numerators and denominators straight across",
    "labelEs": "Dividió numeradores y denominadores directamente",
    "watchFor": "Reground division as “how many of these fit into that?”"
  },
  "fraction-no-reciprocal": {
    "label": "Divided fractions without inverting",
    "labelEs": "Dividió fracciones sin invertir",
    "watchFor": "Ask them to check with a whole-number case they already trust."
  },
  "equation-not-inverse-operation": {
    "label": "Did not undo the operation",
    "labelEs": "No deshizo la operación",
    "watchFor": "Have them name the operation acting on the variable BEFORE they touch both sides."
  },
  "equation-answered-with-given-number": {
    "label": "Answered with a number already in the equation",
    "labelEs": "Respondió con un número que ya estaba en la ecuación",
    "watchFor": "Ask them to substitute their answer back into the original equation out loud."
  },
  "geom-triangle-area-no-half": {
    "label": "Found base × height but forgot the half",
    "labelEs": "Calculó base × altura pero olvidó la mitad",
    "watchFor": "Draw the rectangle around the triangle — the triangle is half of it."
  },
  "measure-area-perimeter-swap": {
    "label": "Swapped area and perimeter",
    "labelEs": "Confundió área y perímetro",
    "watchFor": "Ask what the unit should be — units or square units?"
  },
  "geom-volume-added-dimensions": {
    "label": "Added the dimensions instead of multiplying",
    "labelEs": "Sumó las dimensiones en vez de multiplicarlas",
    "watchFor": "Build one layer of unit cubes first, then count the layers."
  },
  "geom-surface-area-as-volume": {
    "label": "Found the volume instead of the surface area",
    "labelEs": "Halló el volumen en vez del área total",
    "watchFor": "Ask what the unit has to be — square units cover a surface, cubic units fill a space."
  },
  "stat-mean-vs-median": {
    "label": "Used the mean where the median was asked (or the reverse)",
    "labelEs": "Usó la media donde se pedía la mediana (o al revés)",
    "watchFor": "Ask them to say which word the question used, then what that word tells you to DO with the numbers."
  },
  "stat-center-vs-spread": {
    "label": "Confused a measure of center with a measure of spread",
    "labelEs": "Confundió una medida de centro con una de dispersión",
    "watchFor": "Ask what the question wants to know: a typical value, or how scattered the data is?"
  },
  "stat-summed-instead-of-averaged": {
    "label": "Added the data set instead of averaging it",
    "labelEs": "Sumó el conjunto de datos en vez de promediarlo",
    "watchFor": "Ask whether the answer could be a realistic single value in that set."
  },
  "exponent-as-multiplication": {
    "label": "Multiplied the base by the exponent",
    "labelEs": "Multiplicó la base por el exponente",
    "watchFor": "Expand it once — write out every factor before evaluating."
  },
  "decimal-place-value": {
    "label": "Right digits, wrong magnitude",
    "labelEs": "Dígitos correctos, magnitud equivocada",
    "watchFor": "Estimate to the nearest whole first, then count decimal places out loud."
  },
  "sign-dropped": {
    "label": "Right magnitude, lost the negative sign",
    "labelEs": "Magnitud correcta, perdió el signo negativo",
    "watchFor": "Place the answer on a number line — which side of zero?"
  },
  "coord-xy-swapped": {
    "label": "Swapped the x and y coordinates",
    "labelEs": "Intercambió las coordenadas x e y",
    "watchFor": "Have them trace the horizontal move with a finger before the vertical one."
  },
  "inequality-direction-flipped": {
    "label": "Right boundary, symbol reversed",
    "labelEs": "Límite correcto, símbolo invertido",
    "watchFor": "Ask which moves can flip a symbol — adding and subtracting never do."
  }
});
})(window);
