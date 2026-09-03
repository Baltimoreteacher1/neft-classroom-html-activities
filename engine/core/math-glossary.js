// Shared grade-6 math glossary. These common terms get the same tap-to-open
// definition+image popup as a lesson's own vocabulary, so a math word is defined
// wherever it appears — not only in lessons that happen to list it. Kept to
// clearly-mathematical terms (and safe multi-word phrases) to avoid underlining
// ordinary English words. Each entry: { term, termEs, definition, definitionEs }.
// Images resolve automatically via resolveVocabImage (a dedicated SVG when one
// exists, otherwise a category illustration). Lesson-authored vocabulary always
// wins over a glossary entry with the same term.
//
// Acronyms (LCM, GCF, MAD, IQR, SA…) are handled by MATH_ACRONYMS below: each
// one becomes a synthetic vocab entry carrying the FULL term's definition,
// translation, example, and image, so "LCM" in a problem stem underlines and
// opens exactly the same popup as "least common multiple".

import { hasRealVocabImage, resolveVocabImage } from "./vocab-images.js";

export const MATH_GLOSSARY = [
  // — operations & number —
  {
    term: "sum",
    termEs: "suma",
    definition: "The answer when you add numbers.",
    definitionEs: "El resultado de sumar números.",
  },
  {
    term: "difference",
    termEs: "diferencia",
    definition: "The answer when you subtract.",
    definitionEs: "El resultado de restar.",
  },
  {
    term: "product",
    termEs: "producto",
    definition: "The answer when you multiply.",
    definitionEs: "El resultado de multiplicar.",
  },
  {
    term: "quotient",
    termEs: "cociente",
    definition: "The answer when you divide.",
    definitionEs: "El resultado de dividir.",
  },
  {
    term: "factor",
    termEs: "factor",
    definition:
      "A factor of a whole number divides it evenly, with no remainder. For example, 3 is a factor of 12 because 12 ÷ 3 = 4.",
    definitionEs:
      "Un factor de un número entero lo divide exactamente, sin dejar residuo. Por ejemplo, 3 es un factor de 12 porque 12 ÷ 3 = 4.",
  },
  {
    term: "multiple",
    termEs: "múltiplo",
    definition:
      "The result of multiplying a number by a whole number (6, 12, 18… are multiples of 6).",
    definitionEs:
      "El resultado de multiplicar un número por un entero (6, 12, 18… son múltiplos de 6).",
  },
  {
    term: "remainder",
    termEs: "residuo",
    definition: "What is left over after dividing.",
    definitionEs: "Lo que sobra después de dividir.",
  },
  {
    term: "digit",
    termEs: "dígito",
    definition: "Any of the symbols 0–9 used to write numbers.",
    definitionEs: "Cualquiera de los símbolos 0–9 que se usan para escribir números.",
  },
  {
    // One word, one popup. Without this entry the matcher only knows "digit",
    // so "Multi-Digit" rendered as plain "Multi-" plus an underlined "Digit" —
    // two words where the lesson means one. Longest-surface-first matching
    // makes this entry win over "digit" wherever the compound appears.
    term: "multi-digit",
    termEs: "de varios dígitos",
    definition: "Having more than one digit — 26, 348, and 1,344 are all multi-digit numbers.",
    definitionEs: "Que tiene más de un dígito: 26, 348 y 1,344 son números de varios dígitos.",
  },
  {
    term: "whole number",
    termEs: "número entero",
    definition: "A counting number with no fraction or decimal (0, 1, 2, 3…).",
    definitionEs: "Un número de contar sin fracción ni decimal (0, 1, 2, 3…).",
  },
  {
    term: "prime factorization",
    termEs: "factorización prima",
    definition: "Writing a number as a product of only prime numbers.",
    definitionEs: "Escribir un número como un producto de solo números primos.",
  },
  {
    term: "greatest common factor",
    termEs: "máximo común divisor",
    definition: "The largest factor that two numbers share.",
    definitionEs: "El factor más grande que comparten dos números.",
  },
  {
    term: "least common multiple",
    termEs: "mínimo común múltiplo",
    definition: "The smallest multiple that two numbers share.",
    definitionEs: "El múltiplo más pequeño que comparten dos números.",
  },
  {
    term: "exponent",
    termEs: "exponente",
    definition: "A small number that tells how many times to multiply the base by itself.",
    definitionEs: "Un número pequeño que indica cuántas veces multiplicar la base por sí misma.",
  },
  // The operation NAMES and the standard algorithm. A student meets "division",
  // "the algorithm", "bring down" on nearly every page of Units 1–2, and until
  // these entries existed those words had a definition only on the lessons that
  // happened to list them as vocabulary — so on lesson 2.7 "division" was plain,
  // undefined prose sitting inside the definition of "dividend". Every math word
  // gets a picture and a simple meaning wherever it appears (Joel, 2026-08-23).
  {
    term: "division",
    termEs: "división",
    definition: "Splitting a total into equal groups.",
    definitionEs: "Repartir un total en grupos iguales.",
    visual: "12 ÷ 3 = 4 — twelve split into 3 equal groups of 4.",
  },
  {
    term: "divide",
    termEs: "dividir",
    definition: "Split a total into equal groups.",
    definitionEs: "Repartir un total en grupos iguales.",
    visual: "Divide 12 by 3 to get 4 in each group.",
  },
  {
    term: "multiplication",
    termEs: "multiplicación",
    definition: "Adding equal groups over and over.",
    definitionEs: "Sumar grupos iguales una y otra vez.",
    visual: "4 × 3 = 12 — four groups of 3.",
  },
  {
    term: "multiply",
    termEs: "multiplicar",
    definition: "Put equal groups together to find a total.",
    definitionEs: "Juntar grupos iguales para hallar un total.",
    visual: "4 × 3 = 12.",
  },
  {
    term: "addition",
    termEs: "suma",
    definition: "Putting amounts together to find a total.",
    definitionEs: "Juntar cantidades para hallar un total.",
    visual: "8 + 5 = 13.",
  },
  {
    term: "subtraction",
    termEs: "resta",
    definition: "Taking an amount away, or finding how far apart two amounts are.",
    definitionEs: "Quitar una cantidad, o hallar la diferencia entre dos cantidades.",
    visual: "13 − 5 = 8.",
  },
  {
    term: "algorithm",
    termEs: "algoritmo",
    definition: "A set of steps you repeat the same way every time to get an answer.",
    definitionEs: "Un conjunto de pasos que repites igual cada vez para obtener una respuesta.",
    visual: "Long division repeats: divide, multiply, subtract, bring down.",
  },
  {
    term: "long division",
    termEs: "división larga",
    definition:
      "A way to divide big numbers by repeating four steps: divide, multiply, subtract, bring down.",
    definitionEs:
      "Una forma de dividir números grandes repitiendo cuatro pasos: divide, multiplica, resta y baja el siguiente dígito.",
    visual: "Divide → Multiply → Subtract → Bring down, then repeat.",
  },
  {
    term: "bring down",
    termEs: "bajar el dígito",
    definition: "The fourth step of long division: move the next digit down next to what is left.",
    definitionEs:
      "El cuarto paso de la división larga: baja el siguiente dígito junto a lo que quedó.",
    visual: "After subtracting, bring the next digit down and start the cycle again.",
  },
  {
    term: "regroup",
    termEs: "reagrupar",
    definition: "Trade 10 of one place for 1 of the next place (or the other way around).",
    definitionEs: "Cambiar 10 de un lugar por 1 del siguiente lugar (o al revés).",
    visual: "10 ones regroup into 1 ten.",
  },
  {
    term: "place value",
    termEs: "valor posicional",
    definition: "What a digit is worth because of the column it sits in.",
    definitionEs: "Lo que vale un dígito según la columna en la que está.",
    visual: "In 3.47, the 4 is 4 tenths and the 7 is 7 hundredths.",
  },
  {
    term: "estimate",
    termEs: "estimar",
    definition: "A close-enough answer you find quickly, without doing the exact math.",
    definitionEs: "Una respuesta cercana que hallas rápido, sin hacer la cuenta exacta.",
    visual: "18.9 ÷ 6.3 is about 18 ÷ 6 = 3.",
  },
  // — decimals & fractions —
  {
    term: "decimal point",
    termEs: "punto decimal",
    definition: "The dot that separates whole numbers from parts of a whole.",
    definitionEs: "El punto que separa los enteros de las partes de un entero.",
  },
  {
    term: "numerator",
    termEs: "numerador",
    definition: "The top number of a fraction — how many parts you have.",
    definitionEs: "El número de arriba de una fracción — cuántas partes tienes.",
  },
  {
    term: "denominator",
    termEs: "denominador",
    definition: "The bottom number of a fraction — how many equal parts in the whole.",
    definitionEs:
      "El número de abajo de una fracción — en cuántas partes iguales se divide el entero.",
  },
  {
    term: "equivalent",
    termEs: "equivalente",
    definition: "Equal in value, even if written differently (1/2 and 2/4).",
    definitionEs: "Igual en valor, aunque se escriba diferente (1/2 y 2/4).",
  },
  {
    term: "reciprocal",
    termEs: "recíproco",
    definition: "A fraction flipped upside down; two reciprocals multiply to 1.",
    definitionEs: "Una fracción volteada; dos recíprocos multiplicados dan 1.",
  },
  {
    term: "mixed number",
    termEs: "número mixto",
    definition: "A whole number and a fraction together, like 2 1/3.",
    definitionEs: "Un número entero y una fracción juntos, como 2 1/3.",
  },
  {
    term: "decimal",
    termEs: "decimal",
    definition: "A number with a point in it that shows part of a whole, like 0.5 or 18.9.",
    definitionEs: "Un número con punto que muestra parte de un entero, como 0.5 o 18.9.",
    visual: "0.5 is half of one whole.",
  },
  {
    term: "tenths",
    termEs: "décimas",
    definition: "The first place after the decimal point — one whole split into 10 equal parts.",
    definitionEs: "El primer lugar después del punto decimal — un entero dividido en 10 partes.",
    visual: "In 0.4 the 4 is 4 tenths.",
  },
  {
    term: "hundredths",
    termEs: "centésimas",
    definition: "The second place after the decimal point — one whole split into 100 equal parts.",
    definitionEs: "El segundo lugar después del punto decimal — un entero dividido en 100 partes.",
    visual: "In 0.07 the 7 is 7 hundredths.",
  },
  {
    term: "fraction",
    termEs: "fracción",
    definition: "A number that names equal parts of a whole, written as one number over another.",
    definitionEs: "Un número que nombra partes iguales de un entero, escrito uno sobre otro.",
    visual: "3/4 means 3 of 4 equal parts.",
  },
  {
    term: "improper fraction",
    termEs: "fracción impropia",
    definition: "A fraction whose top number is bigger than its bottom number, so it is 1 or more.",
    definitionEs: "Una fracción cuyo numerador es mayor que su denominador, así que vale 1 o más.",
    visual: "7/4 is more than one whole.",
  },
  {
    term: "simplify",
    termEs: "simplificar",
    definition: "Rewrite something in its smallest, cleanest equal form.",
    definitionEs: "Reescribir algo en su forma equivalente más simple.",
    visual: "6/8 simplifies to 3/4.",
  },
  // — ratios & percent —
  {
    term: "ratio",
    termEs: "razón",
    definition: "A comparison of two quantities, like 2 to 3.",
    definitionEs: "Una comparación de dos cantidades, como 2 a 3.",
  },
  {
    term: "unit rate",
    termEs: "tasa unitaria",
    definition: "A rate for exactly one of something (miles per 1 hour).",
    definitionEs: "Una tasa por exactamente uno de algo (millas por 1 hora).",
  },
  {
    term: "percent",
    termEs: "por ciento",
    definition: "A part out of 100.",
    definitionEs: "Una parte de 100.",
  },
  {
    term: "proportion",
    termEs: "proporción",
    definition: "An equation that says two ratios are equal.",
    definitionEs: "Una ecuación que dice que dos razones son iguales.",
  },
  // — algebra —
  {
    term: "variable",
    termEs: "variable",
    definition: "A letter that stands for a number that is unknown or can change.",
    definitionEs: "Una letra que representa un número desconocido o que puede cambiar.",
  },
  {
    term: "expression",
    termEs: "expresión",
    definition: "Numbers, variables, and operations with no equals sign.",
    definitionEs: "Números, variables y operaciones sin signo de igual.",
  },
  {
    term: "equation",
    termEs: "ecuación",
    definition: "A math sentence with an equals sign showing two equal amounts.",
    definitionEs:
      "Una oración matemática con un signo de igual que muestra dos cantidades iguales.",
  },
  {
    term: "coefficient",
    termEs: "coeficiente",
    definition: "The number multiplied by a variable (the 3 in 3x).",
    definitionEs: "El número multiplicado por una variable (el 3 en 3x).",
  },
  {
    term: "substitute",
    termEs: "sustituir",
    definition: "Replace a variable with a number, then simplify.",
    definitionEs: "Reemplazar una variable por un número y luego simplificar.",
  },
  {
    term: "inequality",
    termEs: "desigualdad",
    definition: "A math sentence that uses <, >, ≤ or ≥ instead of an equal sign.",
    definitionEs: "Una oración matemática que usa <, >, ≤ o ≥ en lugar del signo igual.",
    visual: "x > 5 means x is any number bigger than 5.",
  },
  {
    term: "evaluate",
    termEs: "evaluar",
    definition: "Work out the value of an expression.",
    definitionEs: "Hallar el valor de una expresión.",
    visual: "Evaluate 3n when n = 4 to get 12.",
  },
  {
    term: "like terms",
    termEs: "términos semejantes",
    definition: "Terms with exactly the same variable part, so they can be combined.",
    definitionEs: "Términos con la misma parte variable, así que se pueden combinar.",
    visual: "5x and 2x are like terms; 5x and 2y are not.",
  },
  // — integers & coordinate plane —
  {
    term: "integer",
    termEs: "entero",
    definition: "Whole numbers and their opposites, like -2, -1, 0, 1, 2.",
    definitionEs: "Un número entero que puede ser positivo, negativo o cero.",
  },
  {
    term: "absolute value",
    termEs: "valor absoluto",
    definition: "A number's distance from zero — always positive.",
    definitionEs: "La distancia de un número desde cero — siempre positiva.",
  },
  {
    term: "opposite",
    termEs: "opuesto",
    definition: "A number the same distance from zero but on the other side (3 and −3).",
    definitionEs: "Un número a la misma distancia de cero pero del otro lado (3 y −3).",
  },
  {
    term: "coordinate plane",
    termEs: "plano de coordenadas",
    definition: "A grid made by a horizontal and a vertical number line.",
    definitionEs: "Una cuadrícula formada por una recta numérica horizontal y una vertical.",
  },
  {
    term: "ordered pair",
    termEs: "par ordenado",
    definition: "Two numbers (x, y) that name a point on the grid.",
    definitionEs: "Dos números (x, y) que nombran un punto en la cuadrícula.",
  },
  {
    term: "origin",
    termEs: "origen",
    definition: "The point (0, 0) where the axes cross.",
    definitionEs: "El punto (0, 0) donde se cruzan los ejes.",
  },
  // — geometry —
  {
    term: "perimeter",
    termEs: "perímetro",
    definition: "The total distance around the outside of a shape.",
    definitionEs: "La distancia total alrededor de una figura.",
  },
  {
    term: "volume",
    termEs: "volumen",
    definition: "The amount of space inside a 3-D solid.",
    definitionEs: "La cantidad de espacio dentro de un sólido en 3-D.",
  },
  {
    term: "surface area",
    termEs: "área de superficie",
    definition: "The total area of all the flat sides of a solid.",
    definitionEs: "El área total de todos los lados planos de un sólido.",
  },
  {
    term: "area",
    termEs: "área",
    definition: "How much flat space a shape covers, counted in square units.",
    definitionEs: "Cuánto espacio plano cubre una figura, contado en unidades cuadradas.",
    visual: "A 3 × 4 rectangle covers 12 square units.",
  },
  {
    term: "triangle",
    termEs: "triángulo",
    definition: "A closed shape with 3 straight sides.",
    definitionEs: "Una figura cerrada con 3 lados rectos.",
  },
  {
    term: "rectangle",
    termEs: "rectángulo",
    definition: "A 4-sided shape with 4 square corners.",
    definitionEs: "Una figura de 4 lados con 4 esquinas rectas.",
  },
  {
    term: "parallelogram",
    termEs: "paralelogramo",
    definition: "A 4-sided shape whose opposite sides are parallel and the same length.",
    definitionEs: "Una figura de 4 lados cuyos lados opuestos son paralelos e iguales.",
  },
  {
    term: "trapezoid",
    termEs: "trapecio",
    definition: "A 4-sided shape with exactly one pair of parallel sides.",
    definitionEs: "Una figura de 4 lados con exactamente un par de lados paralelos.",
  },
  {
    term: "rhombus",
    termEs: "rombo",
    definition: "A 4-sided shape whose four sides are all the same length.",
    definitionEs: "Una figura de 4 lados con los cuatro lados iguales.",
  },
  {
    term: "polygon",
    termEs: "polígono",
    definition: "A closed shape made only of straight sides.",
    definitionEs: "Una figura cerrada formada solo por lados rectos.",
  },
  {
    term: "prism",
    termEs: "prisma",
    definition: "A 3-D solid with two identical ends joined by flat sides.",
    definitionEs: "Un sólido en 3-D con dos extremos idénticos unidos por lados planos.",
  },
  {
    term: "pyramid",
    termEs: "pirámide",
    definition: "A 3-D solid with one base whose sides are triangles meeting at a point.",
    definitionEs:
      "Un sólido en 3-D con una base cuyos lados son triángulos que se unen en un punto.",
  },
  {
    term: "net",
    termEs: "plantilla",
    definition: "A flat pattern that folds up into a 3-D solid.",
    definitionEs: "Un patrón plano que se dobla para formar un sólido en 3-D.",
  },
  {
    term: "vertex",
    termEs: "vértice",
    definition: "A corner point where sides or edges meet.",
    definitionEs: "Un punto de esquina donde se juntan lados o aristas.",
  },
  {
    term: "edge",
    termEs: "arista",
    definition: "The line where two flat sides of a solid meet.",
    definitionEs: "La línea donde se juntan dos caras planas de un sólido.",
  },
  {
    // Grade 6 uses "segment" in two places and means the same thing in both:
    // the piece of a line between two endpoints (coordinate-plane distance,
    // the sides of a polygon) and the equal piece a length is cut into ("a
    // 3½-mile route divided into ¼-mile segments" — Unit 6 fraction division).
    // The word shows up in lesson prose, stems and sample answers far more
    // often than any lesson lists it as vocabulary, which is exactly what the
    // shared glossary is for. The plural is handled by the matcher, so
    // "segments" underlines and opens this popup too. Its picture is
    // assets/vocab-images/segment.svg (registered in vocab-images.js).
    term: "segment",
    termEs: "segmento",
    definition:
      "A piece of a line, a number line, or a length that has a beginning and an end. Equal segments are the same-size pieces a whole is cut into — a 3 1/2-mile route split into 1/4-mile segments has 14 of them.",
    definitionEs:
      "Un pedazo de una recta, de una recta numérica o de una longitud, con un principio y un final. Los segmentos iguales son las partes del mismo tamaño en que se divide un entero: una ruta de 3 1/2 millas dividida en segmentos de 1/4 de milla tiene 14.",
  },
  {
    // The geometry-class phrase, kept as its own entry so "line segment" opens
    // one popup instead of underlining only its second word. Longest-surface-
    // first matching makes this win over "segment" wherever both could match.
    term: "line segment",
    termEs: "segmento de recta",
    definition:
      "The straight path between two endpoints. It does not keep going the way a line does — it stops at both ends.",
    definitionEs:
      "El camino recto entre dos extremos. No sigue sin fin como una recta: termina en los dos extremos.",
  },
  // — statistics —
  {
    term: "median",
    termEs: "mediana",
    definition: "The middle number when you put them in order.",
    definitionEs: "El número del medio cuando los pones en orden.",
  },
  {
    term: "outlier",
    termEs: "valor atípico",
    definition: "A data value much larger or smaller than the rest.",
    definitionEs: "Un dato mucho mayor o menor que los demás.",
  },
  {
    term: "interquartile range",
    termEs: "rango intercuartílico",
    definition: "The spread of the middle half of the data.",
    definitionEs: "La dispersión de la mitad central de los datos.",
  },
  {
    term: "mean absolute deviation",
    termEs: "desviación media absoluta",
    definition: "The average distance each data value sits from the mean.",
    definitionEs: "La distancia promedio entre cada dato y la media.",
    visual: "A small one means the data clump near the mean; a big one means they spread out.",
  },
  {
    // Unit 2 prose says "Then I use KCF: ___ × ___ = ___" and nothing on the
    // page said what KCF was — the mnemonic was written as though already
    // taught. Defining it here wires the acronym everywhere it appears.
    term: "keep-change-flip",
    termEs: "mantén-cambia-invierte",
    definition:
      "A way to remember dividing by a fraction: keep the first fraction, change ÷ to ×, and flip the second fraction.",
    definitionEs:
      "Una forma de recordar cómo dividir entre una fracción: mantén la primera fracción, cambia ÷ por ×, e invierte la segunda fracción.",
    visual: "3/4 ÷ 2/5 becomes 3/4 × 5/2.",
  },
  {
    term: "data",
    termEs: "datos",
    definition: "The numbers or answers you collect to study a question.",
    definitionEs: "Los números o respuestas que reúnes para estudiar una pregunta.",
  },
  {
    term: "histogram",
    termEs: "histograma",
    definition: "A bar graph that shows how many values fall in each equal-size interval.",
    definitionEs: "Una gráfica de barras que muestra cuántos valores caen en cada intervalo igual.",
  },
  {
    term: "box plot",
    termEs: "diagrama de caja",
    definition: "A graph that shows a data set split into four equal parts by its quartiles.",
    definitionEs: "Una gráfica que muestra un conjunto de datos dividido en cuatro partes iguales.",
  },
  {
    term: "dot plot",
    termEs: "diagrama de puntos",
    definition: "A graph that stacks one dot above the number line for each value.",
    definitionEs: "Una gráfica que apila un punto sobre la recta numérica por cada valor.",
  },
  {
    term: "quartile",
    termEs: "cuartil",
    definition: "One of the three values that cut ordered data into four equal groups.",
    definitionEs:
      "Uno de los tres valores que dividen los datos ordenados en cuatro grupos iguales.",
  },
  {
    term: "frequency",
    termEs: "frecuencia",
    definition: "How many times a value shows up in the data.",
    definitionEs: "Cuántas veces aparece un valor en los datos.",
  },
  {
    term: "distribution",
    termEs: "distribución",
    definition: "The overall shape of the data — where it clumps up and where it spreads out.",
    definitionEs: "La forma general de los datos — dónde se agrupan y dónde se dispersan.",
  },
  {
    term: "cluster",
    termEs: "agrupación",
    definition: "A group of data values bunched close together.",
    definitionEs: "Un grupo de valores de datos muy juntos.",
  },
  // — two-word math terms —
  // Registered so the WHOLE phrase underlines as one definition+image popup.
  // Without these, a sub-word that is itself a glossary term ("factor", "ratio",
  // "equivalent", "expression") would underline alone and split the phrase into
  // one or two partial popups. Longest-match-first in the underliner guarantees
  // these win over their single-word parts.
  {
    term: "scale factor",
    termEs: "factor de escala",
    definition:
      "The number you multiply every part of a ratio (or figure) by to make an equivalent one.",
    definitionEs:
      "El número por el que multiplicas cada parte de una razón (o figura) para formar una equivalente.",
  },
  {
    term: "equivalent ratio",
    termEs: "razón equivalente",
    definition:
      "A ratio that shows the same comparison, made by multiplying or dividing both parts by the same number.",
    definitionEs:
      "Una razón que muestra la misma comparación, formada al multiplicar o dividir ambas partes por el mismo número.",
  },
  {
    term: "equivalent expression",
    termEs: "expresión equivalente",
    definition:
      "An expression that always has the same value as another, just written a different way.",
    definitionEs:
      "Una expresión que siempre tiene el mismo valor que otra, solo escrita de otra manera.",
    image: "/assets/vocab-images/expression.svg",
  },
  {
    term: "equivalent fraction",
    termEs: "fracción equivalente",
    definition: "A fraction that names the same amount as another (1/2 and 2/4).",
    definitionEs: "Una fracción que nombra la misma cantidad que otra (1/2 y 2/4).",
    image: "/assets/vocab-images/fraction.svg",
  },
  {
    term: "common factor",
    termEs: "factor común",
    definition: "A number that divides evenly into two or more numbers.",
    definitionEs: "Un número que divide exactamente a dos o más números.",
    image: "/assets/vocab-images/factor.svg",
  },
  {
    term: "common multiple",
    termEs: "múltiplo común",
    definition: "A number that is a multiple of two or more numbers.",
    definitionEs: "Un número que es múltiplo de dos o más números.",
  },
  {
    term: "least common denominator",
    termEs: "mínimo común denominador",
    definition: "The smallest denominator two fractions can share so you can compare or add them.",
    definitionEs:
      "El denominador más pequeño que dos fracciones pueden compartir para compararlas o sumarlas.",
    visual: "For 3/5 and 4/7 the least common denominator is 35: 21/35 and 20/35.",
  },
  {
    term: "prime factor",
    termEs: "factor primo",
    definition:
      "A prime factor is a factor that is also a prime number. For example, the prime factors of 12 are 2 and 3 because 12 = 2 × 2 × 3.",
    definitionEs:
      "Un factor primo es un factor que también es un número primo. Por ejemplo, los factores primos de 12 son 2 y 3 porque 12 = 2 × 2 × 3.",
    image: "/assets/vocab-images/factor.svg",
  },
  {
    term: "conversion factor",
    termEs: "factor de conversión",
    definition: "A rate you multiply by to change one unit into another.",
    definitionEs: "Una tasa por la que multiplicas para cambiar una unidad por otra.",
  },
  {
    term: "algebraic expression",
    termEs: "expresión algebraica",
    definition: "An expression that uses at least one variable.",
    definitionEs: "Una expresión que usa al menos una variable.",
    image: "/assets/vocab-images/expression.svg",
  },
];

// Acronyms students actually meet in this curriculum's print and problem stems.
// Each row maps a written acronym to the FULL vocabulary term it stands for, so
// the acronym gets the identical underline + tap-to-open definition popup. `es`
// is the Spanish acronym for the same idea (Spanish lesson lanes write MCM /
// MCD / RIC / DMA), which resolves to the same definition entry.
// Only unambiguously-mathematical acronyms belong here: they are matched
// CASE-SENSITIVELY (uppercase as written), so ordinary words like "mad" or "sa"
// inside a sentence are never underlined.
// `es` accepts a string or an array, because Spanish maths writes some of these
// two ways and the curriculum uses both: "desviación media absoluta" gives DMA,
// "desviación absoluta media" gives DAM, and Unit 8 has 32 of the first and 9 of
// the second. Registering only one left the other with no definition behind it.
export const MATH_ACRONYMS = [
  { acronym: "LCM", term: "least common multiple", es: "MCM", esTerm: "mínimo común múltiplo" },
  { acronym: "GCF", term: "greatest common factor", es: "MCD", esTerm: "máximo común divisor" },
  { acronym: "GCD", term: "greatest common factor" },
  { acronym: "LCD", term: "least common denominator" },
  { acronym: "IQR", term: "interquartile range", es: "RIC", esTerm: "rango intercuartílico" },
  {
    acronym: "MAD",
    term: "mean absolute deviation",
    es: ["DMA", "DAM"],
    esTerm: "desviación media absoluta",
  },
  { acronym: "SA", term: "surface area" },
  { acronym: "KCF", term: "keep-change-flip", es: "MCI", esTerm: "mantén-cambia-invierte" },
];

const normTerm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/s$/, "")
    .trim();

// Build the synthetic acronym entries for a merged vocabulary list. An acronym
// is only wired when its full term is actually defined (lesson vocabulary or
// shared glossary), and never when the list already defines that acronym itself.
// The entry copies the full term's definition/translation/example verbatim and
// carries `expandsTo` so the popup can title itself "LCM — least common
// multiple", plus `caseSensitive` so only the uppercase form matches.
function acronymEntries(list) {
  const byTerm = new Map();
  for (const v of list) {
    const key = normTerm(v && v.term);
    if (key && !byTerm.has(key)) byTerm.set(key, v);
  }
  const taken = new Set(list.map((v) => String((v && v.term) || "").trim()));
  const out = [];
  const add = (acronym, base, expandsTo) => {
    if (!acronym || taken.has(acronym)) return;
    taken.add(acronym);
    const image =
      hasRealVocabImage(base.term, base.image) && resolveVocabImage(base.term, base.image);
    out.push({
      term: acronym,
      termEs: base.termEs || "",
      definition: base.definition || "",
      definitionEs: base.definitionEs || "",
      visual: base.visual || "",
      example: base.example || "",
      ...(image ? { image } : {}),
      acronym: true,
      caseSensitive: true,
      expandsTo,
    });
  };
  for (const row of MATH_ACRONYMS) {
    const base = byTerm.get(normTerm(row.term));
    if (!base) continue;
    add(row.acronym, base, base.term);
    // Spanish lanes write the Spanish acronym; its expansion comes from the
    // acronym row (not the lesson entry) so the title never degenerates into
    // "MCM — MCM" when a lesson abbreviates its own translation. `es` may list
    // several accepted spellings of the same acronym (see DMA/DAM above).
    const esForms = Array.isArray(row.es) ? row.es : row.es ? [row.es] : [];
    for (const form of esForms) add(form, base, row.esTerm || base.termEs || base.term);
  }
  return out;
}

// Merge a lesson's own vocabulary with the shared glossary. Lesson entries win on
// any duplicate term (so a lesson can define a word its own way). Returns a new
// array safe to pass to the vocab underliner / popup wiring.
export function augmentVocabWithGlossary(vocab) {
  const list = Array.isArray(vocab) ? vocab.filter(Boolean) : [];
  const seen = new Set(
    list.map((v) =>
      String((v && v.term) || "")
        .toLowerCase()
        .replace(/s$/, "")
        .trim(),
    ),
  );
  const extras = MATH_GLOSSARY.filter((g) => {
    const key = g.term.toLowerCase().replace(/s$/, "").trim();
    return !seen.has(key);
  });
  const merged = list.concat(extras);
  return merged.concat(acronymEntries(merged));
}

// True when an entry only matches its exact written form (the acronym entries
// above). Shared by every underliner so "MAD" opens the popup and "mad" never
// does. Plurals ("LCMs") still match — only the lowercase plural suffix is
// stripped before comparing.
export function surfaceMatchesEntry(surface, entry) {
  if (!entry || !entry.caseSensitive) return true;
  return String(surface || "").replace(/(?:es|s)$/, "") === String(entry.term);
}

export default MATH_GLOSSARY;
