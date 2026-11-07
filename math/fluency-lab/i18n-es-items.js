// Spanish for graded interactive answers (response-widgets.js, response-check.js). English text is the key; merged
// into ES by i18n-es.js like the language layer. tools/fluency-response-items.test.mjs fails when a nudge or a
// control label has no entry here.
export const ES_ITEMS = {
  "{h} hundreds, {t} tens, {o} ones": "{h} centenas, {t} decenas, {o} unidades",
  "{n} boxes filled": "{n} casillas llenas",
  "{n} dots placed": "{n} puntos colocados",
  "{n} of {d} parts shaded": "{n} de {d} partes sombreadas",
  "A bar cut into {n} equal parts": "Una barra dividida en {n} partes iguales",
  "Add a dot at {v}": "Agregar un punto en {v}",
  "Add one to {place}": "Agregar uno a {place}",
  "Boundary point": "Punto límite",
  "Box {n}": "Casilla {n}",
  Circle: "Círculo",
  "Closed circle": "Círculo cerrado",
  "Coordinate grid. Use the arrow keys to move the point.":
    "Plano de coordenadas. Usa las flechas del teclado para mover el punto.",
  "coordinate grid": "plano de coordenadas",
  Direction: "Dirección",
  "Dots for each value": "Puntos para cada valor",
  "Move {name} left": "Mover {name} a la izquierda",
  "Move {name} right": "Mover {name} a la derecha",
  "Not placed yet": "Todavía sin colocar",
  "Nothing built yet.": "Todavía no has construido nada.",
  "Open circle": "Círculo abierto",
  "Part {n} of {d}": "Parte {n} de {d}",
  "Point on the number line": "Punto en la recta numérica",
  "Remove a dot at {v}": "Quitar un punto en {v}",
  "Shade left": "Sombrear a la izquierda",
  "Shade right": "Sombrear a la derecha",
  "Take away one from {place}": "Quitar uno de {place}",
  "Tap the grid, or focus it and use the arrow keys.":
    "Toca el plano, o selecciónalo y usa las flechas del teclado.",
  "Tap the line, or focus it and use the arrow keys.":
    "Toca la recta, o selecciónala y usa las flechas del teclado.",
  "Ten-frame": "Marco de diez",
  "Your box plot: {v}": "Tu diagrama de caja: {v}",
  "Your graph: {v}": "Tu gráfica: {v}",
  "Your point: {v}": "Tu punto: {v}",
  Minimum: "Mínimo",
  Q1: "Q1",
  Median: "Mediana",
  Q3: "Q3",
  Maximum: "Máximo",
  Hundreds: "Centenas",
  Tens: "Decenas",
  Ones: "Unidades",
  // Nudges after a miss: they name what to check, never the answer.
  "Build an answer first.": "Primero construye una respuesta.",
  "Place a point on the grid first.": "Primero coloca un punto en el plano.",
  "The x-coordinate tells how far to move left or right; the y-coordinate tells up or down.":
    "La coordenada x dice cuánto moverte a la izquierda o a la derecha; la coordenada y dice hacia arriba o hacia abajo.",
  "Check the x-coordinate: count left or right from the origin.":
    "Revisa la coordenada x: cuenta hacia la izquierda o la derecha desde el origen.",
  "Check the y-coordinate: count up or down from the x-axis.":
    "Revisa la coordenada y: cuenta hacia arriba o hacia abajo desde el eje x.",
  "Place a point on the number line first.": "Primero coloca un punto en la recta numérica.",
  "Your point is too far left. Count the equal parts again.":
    "Tu punto está demasiado a la izquierda. Vuelve a contar las partes iguales.",
  "Your point is too far right. Count the equal parts again.":
    "Tu punto está demasiado a la derecha. Vuelve a contar las partes iguales.",
  "Place the circle, then choose a direction.": "Coloca el círculo y luego elige una dirección.",
  "Check where the circle sits: it marks the boundary number.":
    "Revisa dónde está el círculo: marca el número límite.",
  "Check the direction: which side holds the numbers that make it true?":
    "Revisa la dirección: ¿de qué lado están los números que la hacen verdadera?",
  "Check the circle: closed means the boundary number is included, open means it is not.":
    "Revisa el círculo: cerrado significa que el número límite está incluido; abierto, que no lo está.",
  "Add dots above the number line first.": "Primero agrega puntos sobre la recta numérica.",
  "Count your dots: each data value gets exactly one dot.":
    "Cuenta tus puntos: cada dato lleva exactamente un punto.",
  "Every data value needs its dot above its own number. Check each column.":
    "Cada dato necesita su punto sobre su propio número. Revisa cada columna.",
  "Set all five parts of the box plot.": "Coloca las cinco partes del diagrama de caja.",
  "The five parts go in order: minimum, Q1, median, Q3, maximum.":
    "Las cinco partes van en orden: mínimo, Q1, mediana, Q3, máximo.",
  "Check the minimum: the least data value.": "Revisa el mínimo: el dato menor.",
  "Check Q1: the middle of the lower half.": "Revisa Q1: el centro de la mitad inferior.",
  "Check the median: the middle of all the data.":
    "Revisa la mediana: el centro de todos los datos.",
  "Check Q3: the middle of the upper half.": "Revisa Q3: el centro de la mitad superior.",
  "Check the maximum: the greatest data value.": "Revisa el máximo: el dato mayor.",
  "Tap parts of the bar to shade them.": "Toca partes de la barra para sombrearlas.",
  "Too few parts are shaded. What fraction does each part show?":
    "Hay muy pocas partes sombreadas. ¿Qué fracción muestra cada parte?",
  "Too many parts are shaded. What fraction does each part show?":
    "Hay demasiadas partes sombreadas. ¿Qué fracción muestra cada parte?",
  "Tap the boxes to fill the ten-frame.": "Toca las casillas para llenar el marco de diez.",
  "Count again. You need more.": "Cuenta otra vez. Necesitas más.",
  "Count again. You have too many.": "Cuenta otra vez. Tienes demasiados.",
  "Add blocks to build the number.": "Agrega bloques para formar el número.",
  "Your blocks show less than the number. Count by hundreds, tens, then ones.":
    "Tus bloques muestran menos que el número. Cuenta por centenas, decenas y luego unidades.",
  "Your blocks show more than the number. Count by hundreds, tens, then ones.":
    "Tus bloques muestran más que el número. Cuenta por centenas, decenas y luego unidades.",
  // Multi-line work (line-work.js).
  "Solve. Write one step per line.": "Resuelve. Escribe un paso en cada línea.",
  "Rewrite. Write one step per line.": "Reescribe. Escribe un paso en cada línea.",
  "Simplify. Write one step per line.": "Simplifica. Escribe un paso en cada línea.",
  Given: "Dado",
  "Line {n}": "Línea {n}",
  "{n} lines written": "{n} líneas escritas",
  "Add a line": "Agregar una línea",
  "Remove the last line": "Quitar la última línea",
  Follows: "Sigue",
  "Check this line": "Revisa esta línea",
  "Write your next line under the given one.": "Escribe tu siguiente línea debajo de la que se da.",
  "Line {n} cannot be read as an equation. Use one = sign.": "La línea {n} no se puede leer como una ecuación. Usa un solo signo =.",
  "Line {n} cannot be read. Check the symbols.": "La línea {n} no se puede leer. Revisa los símbolos.",
  "Line {n} changes the solution. Check the step from the line above.": "La línea {n} cambia la solución. Revisa el paso desde la línea de arriba.",
  "Line {n} changes the value. Check the step from the line above.": "La línea {n} cambia el valor. Revisa el paso desde la línea de arriba.",
  "Every line is correct. Keep going until the variable is alone on one side.": "Todas las líneas son correctas. Sigue hasta que la variable quede sola en un lado.",
  "Every line is correct. Keep going until one number is left.": "Todas las líneas son correctas. Sigue hasta que quede un solo número.",
  "Every line is correct. Keep going until like terms are combined and no parentheses are left.": "Todas las líneas son correctas. Sigue hasta combinar los términos semejantes y no dejar paréntesis.",
};
