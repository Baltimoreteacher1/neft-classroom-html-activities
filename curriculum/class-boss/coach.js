/* =============================================================================
 * Class Boss — student coaching (EN/ES).
 * -----------------------------------------------------------------------------
 * The repo's misconception labels carry a `watchFor` line, but it is written
 * for the TEACHER ("Ask them to…"). A student who misses a question needs a
 * line written to THEM. Two tiers per tag, earned in order:
 *
 *   t1  after the first wrong try — the METHOD. Never states the answer.
 *   t2  after the second wrong try — a concrete step to carry out. Still
 *       never states the answer; it names the move, the student does it.
 *
 * Every tag in BOSS_TAGS must have an entry; boss.js falls back to the
 * teacher line only if one is missing.
 * ========================================================================== */

/** @type {Record<string, { t1: [string, string], t2: [string, string] }>} */
export const STUDENT_COACH = {
  "algebra-distributive-partial": {
    t1: [
      "The number outside the parentheses multiplies EVERY term inside, not just the first one.",
      "El número de afuera multiplica CADA término de adentro, no solo el primero.",
    ],
    t2: [
      "Multiply the outside number by the first term. Then multiply it by the second term. Then combine the two products.",
      "Multiplica el número de afuera por el primer término. Luego multiplícalo por el segundo término. Después combina los dos productos.",
    ],
  },
  "coord-xy-swapped": {
    t1: [
      "An ordered pair is (x, y). The left-right move comes first. The up-down move comes second.",
      "Un par ordenado es (x, y). El movimiento izquierda-derecha va primero. El movimiento arriba-abajo va segundo.",
    ],
    t2: [
      "Write ( , ). Put the left/right number in the first spot and the up/down number in the second spot. Moving left or down makes a number negative.",
      "Escribe ( , ). Pon el número de izquierda/derecha en el primer lugar y el de arriba/abajo en el segundo. Moverse a la izquierda o hacia abajo hace el número negativo.",
    ],
  },
  "equation-answered-with-given-number": {
    t1: [
      "The answer is the value of the letter. It is usually NOT a number you can already see in the equation.",
      "La respuesta es el valor de la letra. Casi nunca es un número que ya ves en la ecuación.",
    ],
    t2: [
      "Undo the operation on the letter. Then put your answer back into the equation and check that both sides match.",
      "Deshaz la operación que tiene la letra. Luego pon tu respuesta en la ecuación y comprueba que los dos lados sean iguales.",
    ],
  },
  "equation-not-inverse-operation": {
    t1: [
      "To get the letter alone, do the OPPOSITE of what is being done to it.",
      "Para dejar la letra sola, haz lo CONTRARIO de lo que le están haciendo.",
    ],
    t2: [
      "Name the operation on the letter (+, −, ×, or ÷). Do the inverse operation to both sides. Then check by putting your answer back in.",
      "Nombra la operación que tiene la letra (+, −, × o ÷). Haz la operación inversa en los dos lados. Luego comprueba poniendo tu respuesta en la ecuación.",
    ],
  },
  "inequality-boundary-inclusion": {
    t1: [
      "Read the key words. “At least” and “at most” include the boundary number. “More than” and “fewer than” do not.",
      "Lee las palabras clave. “Al menos” y “como máximo” incluyen el número límite. “Más de” y “menos de” no lo incluyen.",
    ],
    t2: [
      "Ask: is the boundary number itself allowed? If yes, the symbol has a line under it (≥ or ≤). If no, it does not (> or <).",
      "Pregúntate: ¿se permite el número límite? Si sí, el símbolo lleva una raya debajo (≥ o ≤). Si no, no la lleva (> o <).",
    ],
  },
  "inequality-direction-flipped": {
    t1: [
      "Adding or subtracting on both sides never flips the inequality symbol.",
      "Sumar o restar en los dos lados nunca voltea el símbolo de desigualdad.",
    ],
    t2: [
      "Solve it like an equation to find the boundary number. Then keep the same symbol you started with.",
      "Resuélvela como una ecuación para hallar el número límite. Luego conserva el mismo símbolo con el que empezaste.",
    ],
  },
  "inequality-graph-direction": {
    t1: [
      "Pick a number on the shaded side and test it in the inequality. It must make the statement true.",
      "Escoge un número del lado sombreado y pruébalo en la desigualdad. Tiene que hacer verdadera la afirmación.",
    ],
    t2: [
      "“Greater than” shades to the right. “Less than” shades to the left. A filled circle means the number is included; an open circle means it is not.",
      "“Mayor que” se sombrea a la derecha. “Menor que” se sombrea a la izquierda. Un círculo relleno incluye el número; un círculo abierto no lo incluye.",
    ],
  },
  "stat-center-vs-spread": {
    t1: [
      "Decide what the question wants: a typical value (center) or how spread out the data is (spread).",
      "Decide qué pide la pregunta: un valor típico (centro) o qué tan dispersos están los datos (dispersión).",
    ],
    t2: [
      "Center measures: mean, median, mode. Spread measures: range, interquartile range. Match the question's words to the right group.",
      "Medidas de centro: media, mediana, moda. Medidas de dispersión: rango, rango intercuartílico. Une las palabras de la pregunta con el grupo correcto.",
    ],
  },
  "stat-frequency-vs-value": {
    t1: [
      "On a histogram, the HEIGHT of a bar tells how many values are in that interval.",
      "En un histograma, la ALTURA de una barra dice cuántos valores hay en ese intervalo.",
    ],
    t2: [
      "The numbers under a bar are the edges of the interval, not a count. Use the bar's height to answer “how many”.",
      "Los números debajo de una barra son los extremos del intervalo, no un conteo. Usa la altura de la barra para responder “cuántos”.",
    ],
  },
  "stat-mean-skewed-by-outlier": {
    t1: [
      "Look for one value that is far away from the others. That outlier pulls the mean toward it.",
      "Busca un valor que esté muy lejos de los demás. Ese valor atípico jala la media hacia él.",
    ],
    t2: [
      "Cover the outlier with your finger. Which measure stays close to the middle values? That one describes a typical value best.",
      "Tapa el valor atípico con el dedo. ¿Qué medida se queda cerca de los valores del medio? Esa describe mejor un valor típico.",
    ],
  },
  "stat-range-for-iqr": {
    t1: [
      "The IQR uses only the middle half of the data: Q1 and Q3.",
      "El rango intercuartílico usa solo la mitad central de los datos: Q1 y Q3.",
    ],
    t2: [
      "Ignore the least and greatest values. Subtract Q3 − Q1.",
      "Ignora el valor mínimo y el máximo. Resta Q3 − Q1.",
    ],
  },
  "decimal-place-value": {
    t1: [
      "Estimate first. Should the answer be bigger or smaller than the number you started with?",
      "Estima primero. ¿La respuesta debe ser mayor o menor que el número con el que empezaste?",
    ],
    t2: [
      "Work it as whole numbers. Then place the decimal point: count the decimal places, or move the point one place for each 10. Check against your estimate.",
      "Hazlo con números enteros. Luego coloca el punto decimal: cuenta los lugares decimales, o mueve el punto un lugar por cada 10. Compara con tu estimación.",
    ],
  },
  "division-quotient-missing-zero": {
    t1: [
      "Estimate first: about how big should the quotient be? How many digits should it have?",
      "Estima primero: ¿más o menos de qué tamaño debe ser el cociente? ¿Cuántos dígitos debe tener?",
    ],
    t2: [
      "In long division, every time you bring down a digit you must write a digit in the quotient. Write 0 when the divisor does not fit.",
      "En la división larga, cada vez que bajas un dígito debes escribir un dígito en el cociente. Escribe 0 cuando el divisor no cabe.",
    ],
  },
  "exponent-as-multiplication": {
    t1: [
      "An exponent tells how many times to multiply the base by ITSELF. It is not base × exponent.",
      "Un exponente dice cuántas veces se multiplica la base por SÍ MISMA. No es base × exponente.",
    ],
    t2: [
      "Write the base as many times as the exponent says, with × between them. Then multiply step by step.",
      "Escribe la base tantas veces como dice el exponente, con × entre ellas. Luego multiplica paso a paso.",
    ],
  },
  "fraction-added-denominators": {
    t1: [
      "You can add fractions only when the pieces are the same size, so the denominators must match.",
      "Solo puedes sumar fracciones cuando las partes son del mismo tamaño, así que los denominadores deben ser iguales.",
    ],
    t2: [
      "Find a common denominator. Rewrite both fractions with it. Then add only the numerators.",
      "Busca un denominador común. Reescribe las dos fracciones con él. Luego suma solo los numeradores.",
    ],
  },
  "fraction-no-reciprocal": {
    t1: [
      "Dividing by a fraction is the same as multiplying by its reciprocal (the second fraction flipped).",
      "Dividir entre una fracción es lo mismo que multiplicar por su recíproco (la segunda fracción volteada).",
    ],
    t2: [
      "Keep the first fraction. Change ÷ to ×. Flip the second fraction. Multiply tops, multiply bottoms, then simplify.",
      "Conserva la primera fracción. Cambia ÷ por ×. Voltea la segunda fracción. Multiplica arriba, multiplica abajo y simplifica.",
    ],
  },
  "fraction-straight-across-division": {
    t1: [
      "Ask: how many of the second amount fit into the first? Should the answer be more than 1 or less than 1?",
      "Pregúntate: ¿cuántas veces cabe la segunda cantidad en la primera? ¿La respuesta debe ser mayor o menor que 1?",
    ],
    t2: [
      "Keep the first fraction. Change ÷ to ×. Flip the second fraction. Multiply, then simplify.",
      "Conserva la primera fracción. Cambia ÷ por ×. Voltea la segunda fracción. Multiplica y simplifica.",
    ],
  },
  "factors-multiples-confused": {
    t1: [
      "Factors go INTO a number evenly. Multiples come OUT of it when you skip-count.",
      "Los factores CABEN exactamente en un número. Los múltiplos SALEN de él cuando cuentas de tanto en tanto.",
    ],
    t2: [
      "For a factor, check: does it divide in with no remainder? For a multiple, skip-count by the number.",
      "Para un factor, comprueba: ¿divide sin residuo? Para un múltiplo, cuenta de tanto en tanto con ese número.",
    ],
  },
  "factorization-stopped-early": {
    t1: [
      "Keep breaking factors apart until every factor is prime.",
      "Sigue separando los factores hasta que todos sean primos.",
    ],
    t2: [
      "Make a factor tree. Split any factor that is not prime. Then count every prime at the bottom, repeats included.",
      "Haz un árbol de factores. Separa cada factor que no sea primo. Luego cuenta todos los primos de abajo, incluidos los repetidos.",
    ],
  },
  "property-order-vs-grouping": {
    t1: [
      "Ask what changed from one side to the other: the ORDER of the numbers, or the PARENTHESES?",
      "Pregúntate qué cambió de un lado al otro: ¿el ORDEN de los números o los PARÉNTESIS?",
    ],
    t2: [
      "Commutative: the numbers swap places. Associative: the parentheses move to group different numbers.",
      "Conmutativa: los números cambian de lugar. Asociativa: los paréntesis se mueven para agrupar otros números.",
    ],
  },
  "ratio-compared-without-common-basis": {
    t1: [
      "Find the value for ONE item before you answer or compare.",
      "Halla el valor de UN artículo antes de responder o comparar.",
    ],
    t2: [
      "Divide the total by the number of items. That gives the amount for one.",
      "Divide el total entre el número de artículos. Así obtienes la cantidad para uno.",
    ],
  },
  "stat-question-no-variability": {
    t1: [
      "A statistical question expects many different answers, not one fixed fact.",
      "Una pregunta estadística espera muchas respuestas diferentes, no un solo dato fijo.",
    ],
    t2: [
      "Ask: if I asked many people, would the answers be different? Look for the word “each”.",
      "Pregúntate: si les pregunto a muchas personas, ¿las respuestas serían diferentes? Busca la palabra “cada”.",
    ],
  },
  "pattern-unit-position-miscounted": {
    t1: [
      "Find how long the repeating unit is. Then work out where the position falls inside that unit.",
      "Halla cuántos elementos tiene la unidad que se repite. Luego busca dónde cae la posición dentro de esa unidad.",
    ],
    t2: [
      "Divide the position number by the unit length. The remainder tells the place in the unit. A remainder of 0 means the LAST item.",
      "Divide el número de la posición entre el largo de la unidad. El residuo dice el lugar dentro de la unidad. Un residuo de 0 significa el ÚLTIMO elemento.",
    ],
  },
  "geom-triangle-area-no-half": {
    t1: [
      "A triangle is half of a rectangle with the same base and height.",
      "Un triángulo es la mitad de un rectángulo con la misma base y altura.",
    ],
    t2: [
      "Multiply base × height. Then take half of that.",
      "Multiplica base × altura. Luego toma la mitad de eso.",
    ],
  },
  "geom-surface-area-as-volume": {
    t1: [
      "Surface area COVERS the outside (square units). Volume FILLS the inside (cubic units).",
      "El área de superficie CUBRE el exterior (unidades cuadradas). El volumen LLENA el interior (unidades cúbicas).",
    ],
    t2: [
      "Find the area of the three different faces (length × width, length × height, width × height). Double each one. Add all six faces.",
      "Halla el área de las tres caras diferentes (largo × ancho, largo × alto, ancho × alto). Duplica cada una. Suma las seis caras.",
    ],
  },
  "geom-volume-added-dimensions": {
    t1: [
      "Volume counts the cubes that fill the box, so the dimensions are multiplied, not added.",
      "El volumen cuenta los cubos que llenan la caja, así que las medidas se multiplican, no se suman.",
    ],
    t2: [
      "Find how many cubes fit in one layer (length × width). Then multiply by the number of layers (height).",
      "Halla cuántos cubos caben en una capa (largo × ancho). Luego multiplica por el número de capas (alto).",
    ],
  },
  "measure-area-perimeter-swap": {
    t1: [
      "Check what the question asks for. Square units means area. Plain units around the edge means perimeter.",
      "Revisa qué pide la pregunta. Unidades cuadradas significa área. Unidades simples alrededor del borde significa perímetro.",
    ],
    t2: [
      "Area = length × width. Perimeter = add all four sides.",
      "Área = largo × ancho. Perímetro = suma los cuatro lados.",
    ],
  },
  "op-added-instead-of-multiplied": {
    t1: [
      "Look for equal groups: “each”, “every”, “per”. Equal groups mean multiply.",
      "Busca grupos iguales: “cada”, “por”. Los grupos iguales significan multiplicar.",
    ],
    t2: [
      "Say it as a sentence: ___ groups of ___. Then multiply the two numbers.",
      "Dilo como una oración: ___ grupos de ___. Luego multiplica los dos números.",
    ],
  },
  "op-divided-instead-of-multiplied": {
    t1: [
      "Should the answer be bigger or smaller than the numbers in the problem? Putting equal groups together makes it bigger.",
      "¿La respuesta debe ser mayor o menor que los números del problema? Juntar grupos iguales la hace mayor.",
    ],
    t2: [
      "Number of groups × amount in each group = total.",
      "Número de grupos × cantidad en cada grupo = total.",
    ],
  },
  "op-multiplied-instead-of-added": {
    t1: [
      "Two amounts put together, with no equal groups, means add.",
      "Dos cantidades que se juntan, sin grupos iguales, significa sumar.",
    ],
    t2: [
      "Retell the story: one amount, then more joins it. Add the two amounts.",
      "Vuelve a contar la historia: hay una cantidad y luego se le junta otra. Suma las dos cantidades.",
    ],
  },
  "op-multiplied-instead-of-divided": {
    t1: [
      "Sharing or splitting into equal parts makes each part SMALLER than the total.",
      "Repartir o dividir en partes iguales hace que cada parte sea MENOR que el total.",
    ],
    t2: [
      "Total ÷ number of equal parts = amount in each part.",
      "Total ÷ número de partes iguales = cantidad en cada parte.",
    ],
  },
  "op-reversed-division": {
    t1: [
      "Ask: what is being shared, and into how many parts? The total goes first.",
      "Pregúntate: ¿qué se reparte y en cuántas partes? El total va primero.",
    ],
    t2: [
      "Write total ÷ number of parts. The amount for one should make sense in the story.",
      "Escribe total ÷ número de partes. La cantidad para uno debe tener sentido en la historia.",
    ],
  },
  "op-reversed-subtraction": {
    t1: [
      "“How many more” and “how many are left” ask for a gap. Start with the bigger amount.",
      "“¿Cuántos más?” y “¿cuántos quedan?” piden una diferencia. Empieza con la cantidad mayor.",
    ],
    t2: [
      "Bigger amount − smaller amount. Picture both on a number line and count the gap between them.",
      "Cantidad mayor − cantidad menor. Imagina las dos en una recta numérica y cuenta la distancia entre ellas.",
    ],
  },
  "order-of-operations-left-to-right": {
    t1: [
      "Multiplication and division come before addition and subtraction.",
      "La multiplicación y la división van antes que la suma y la resta.",
    ],
    t2: [
      "Circle the × or ÷ part and do it first. Then add or subtract.",
      "Encierra la parte con × o ÷ y hazla primero. Luego suma o resta.",
    ],
  },
  "percent-scale-off-by-100": {
    t1: [
      "A percent means “out of 100”. A part of the whole should not be bigger than the whole.",
      "Un porcentaje significa “de cada 100”. Una parte del total no debe ser mayor que el total.",
    ],
    t2: [
      "Write the percent as a fraction over 100 (or a decimal). Multiply it by the whole. Check: 10% is the whole ÷ 10.",
      "Escribe el porcentaje como fracción sobre 100 (o decimal). Multiplícalo por el total. Comprueba: el 10 % es el total ÷ 10.",
    ],
  },
  "percent-used-as-whole-number": {
    t1: [
      "A percent is not a number of points or dollars. First find what that percent of the amount is.",
      "Un porcentaje no es una cantidad de puntos ni de dólares. Primero halla cuánto es ese porcentaje de la cantidad.",
    ],
    t2: [
      "Find the percent of the starting amount. Then add it (for “more”) or subtract it (for “less” or “left”).",
      "Halla el porcentaje de la cantidad inicial. Luego súmalo (si dice “más”) o réstalo (si dice “menos” o “quedan”).",
    ],
  },
  "rate-not-per-one": {
    t1: [
      "The question asks about ONE. Ask yourself: per ONE what?",
      "La pregunta es sobre UNO. Pregúntate: ¿por UNO de qué?",
    ],
    t2: [
      "Divide the total by how many there are. That gives the amount for one.",
      "Divide el total entre cuántos hay. Así obtienes la cantidad para uno.",
    ],
  },
  "ratio-inverted": {
    t1: [
      "Write the numbers in the same order as the words. The first thing named goes first.",
      "Escribe los números en el mismo orden que las palabras. Lo primero que se nombra va primero.",
    ],
    t2: [
      "Label each number with its item. Put them in the order the question asks. Then divide both by the same number to simplify.",
      "Ponle a cada número su etiqueta. Ordénalos como pide la pregunta. Luego divide los dos entre el mismo número para simplificar.",
    ],
  },
  "ratio-scaled-additively": {
    t1: [
      "A ratio grows by multiplying, not by adding the same amount to both parts.",
      "Una razón crece multiplicando, no sumando la misma cantidad a las dos partes.",
    ],
    t2: [
      "Find how many times bigger the new amount is (divide). Multiply the other part by that same number.",
      "Halla cuántas veces más grande es la nueva cantidad (divide). Multiplica la otra parte por ese mismo número.",
    ],
  },
  "ratio-as-difference": {
    t1: [
      "A ratio compares two amounts with a colon. It keeps BOTH numbers.",
      "Una razón compara dos cantidades con dos puntos. Conserva LOS DOS números.",
    ],
    t2: [
      "Write first amount : second amount. Then divide both by their greatest common factor.",
      "Escribe primera cantidad : segunda cantidad. Luego divide las dos entre su máximo común divisor.",
    ],
  },
  "stat-mean-vs-median": {
    t1: [
      "Read the question's word. Median means the middle value. Mean means the average.",
      "Lee la palabra de la pregunta. Mediana es el valor del medio. Media es el promedio.",
    ],
    t2: [
      "For the median, put the values in order and find the one in the middle.",
      "Para la mediana, ordena los valores y busca el que queda en el medio.",
    ],
  },
  "stat-histogram-bin-misread": {
    t1: [
      "Read which interval (or intervals) the question asks about. Use the bar heights for only those.",
      "Lee qué intervalo (o intervalos) pide la pregunta. Usa las alturas de las barras solo de esos.",
    ],
    t2: [
      "Point to each interval the question names. Write each height. Combine only those heights.",
      "Señala cada intervalo que nombra la pregunta. Escribe cada altura. Junta solo esas alturas.",
    ],
  },
  "sign-dropped": {
    t1: [
      "Picture a number line. Which side of zero should the answer be on?",
      "Imagina una recta numérica. ¿De qué lado del cero debe quedar la respuesta?",
    ],
    t2: [
      "Start at the first number on the number line. Move the right direction and distance. If you end below zero, keep the negative sign.",
      "Empieza en el primer número de la recta. Muévete en la dirección y la distancia correctas. Si terminas debajo de cero, conserva el signo negativo.",
    ],
  },
  "stat-summed-instead-of-averaged": {
    t1: [
      "The mean is a typical value. It should be between the smallest and largest data values.",
      "La media es un valor típico. Debe estar entre el valor más pequeño y el más grande de los datos.",
    ],
    t2: [
      "Add all the values. Then divide by how many values there are.",
      "Suma todos los valores. Luego divide entre cuántos valores hay.",
    ],
  },
};

/* Word answers the bank emits in English. The button's VALUE stays the bank's
 * English string (that is what is compared); only the label is translated. */
const WORD_ES = {
  mode: "moda",
  median: "mediana",
  range: "rango",
  mean: "media",
  "interquartile range": "rango intercuartílico",
  "the greatest value": "el valor mayor",
  "the least value": "el valor menor",
  "Associative Property": "Propiedad asociativa",
  "Identity Property": "Propiedad de identidad",
  "Commutative Property": "Propiedad conmutativa",
  "Distributive Property": "Propiedad distributiva",
  "How many minutes are in an hour?": "¿Cuántos minutos hay en una hora?",
  "How tall is each student in our class?": "¿Cuánto mide cada estudiante de nuestra clase?",
  "How many students are in our class?": "¿Cuántos estudiantes hay en nuestra clase?",
  "What day of the week is it?": "¿Qué día de la semana es?",
  "What time does the bell ring?": "¿A qué hora suena el timbre?",
  "How many days are in a week?": "¿Cuántos días tiene una semana?",
  "How many minutes did each student read last night?":
    "¿Cuántos minutos leyó cada estudiante anoche?",
  "How many minutes are in one hour?": "¿Cuántos minutos hay en una hora?",
  "How many players are on the team?": "¿Cuántos jugadores hay en el equipo?",
  "What colour is the team jersey?": "¿De qué color es la camiseta del equipo?",
  "How many quarters are in the game?": "¿Cuántos cuartos tiene el partido?",
  "What shoe size does each player on the team wear?":
    "¿Qué talla de zapato usa cada jugador del equipo?",
  "What month is it?": "¿Qué mes es?",
  "How many pets does each family in our class have?":
    "¿Cuántas mascotas tiene cada familia de nuestra clase?",
  "How many legs does one dog have?": "¿Cuántas patas tiene un perro?",
  "How many families are in our class?": "¿Cuántas familias hay en nuestra clase?",
  square: "cuadrado",
  circle: "círculo",
  triangle: "triángulo",
  "it cannot be determined": "no se puede saber",
  "the pattern starts over": "el patrón vuelve a empezar",
  yellow: "amarillo",
  green: "verde",
  red: "rojo",
  blue: "azul",
};

/** The Spanish label for a word answer; numbers and symbols pass through. */
export function choiceLabelEs(value) {
  const text = String(value);
  if (WORD_ES[text]) return WORD_ES[text];
  const graph = /^(filled|open) circle at (-?[\d.]+), shade (left|right)$/.exec(text);
  if (graph) {
    const circle = graph[1] === "filled" ? "círculo relleno" : "círculo abierto";
    const side = graph[3] === "left" ? "izquierda" : "derecha";
    return `${circle} en ${graph[2]}, sombrear a la ${side}`;
  }
  const shape = /^there is no shape (\d+)$/.exec(text);
  if (shape) return `no hay figura ${shape[1]}`;
  return text;
}
