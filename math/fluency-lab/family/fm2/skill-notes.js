// One plain sentence per skill: what the learner does and what mathematics it practices, in English and Spanish.
// Keyed "game:skill" because skill ids repeat across games (k-count lives in three). The family home reads these for
// its mission, skill browser and share message; tools/fm2/skill-notes.test.mjs fails when a skill has no note, a
// note has no skill, or a note falls back to generic wording. Describes the activity only; it never changes a game's
// rules or states an answer. @fm2 FM-028 FM-035
import { strandKey } from "./coach.js";

const n = (en, es) => ({ en, es });

export const SKILL_NOTES = {
  // number-builder
  "number-builder:k-count": n(
    "Add counters to fill the ten-frame and show how many there are.",
    "Agrega fichas para llenar el marco de diez y mostrar cuántas hay.",
  ),
  "number-builder:k-bonds": n(
    "Use two colors of counters to make 5 or 10 in different ways.",
    "Usa dos colores de fichas para formar 5 o 10 de distintas maneras.",
  ),
  "number-builder:g1-tens-ones": n(
    "Build a number from tens and ones pieces to match the goal.",
    "Construye un número con piezas de decenas y unidades para igualar la meta.",
  ),
  "number-builder:g1-teen": n(
    "Build teen numbers as one ten and some ones.",
    "Construye los números del 11 al 19 como una decena y algunas unidades.",
  ),
  "number-builder:g2-hundreds": n(
    "Build three-digit numbers from hundreds, tens, and ones pieces.",
    "Construye números de tres cifras con piezas de centenas, decenas y unidades.",
  ),
  "number-builder:g2-regroup": n(
    "Show the same number another way by trading ten ones for a ten, or ten tens for a hundred.",
    "Muestra el mismo número de otra manera cambiando diez unidades por una decena, o diez decenas por una centena.",
  ),
  "number-builder:g3-discs": n(
    "Add and remove place-value discs to build numbers up to 9,999.",
    "Agrega y quita discos de valor posicional para formar números hasta 9,999.",
  ),
  "number-builder:g3-expanded": n(
    "Build a number and write it as a sum of its place values.",
    "Forma un número y escríbelo como suma de sus valores posicionales.",
  ),
  "number-builder:g4-discs": n(
    "Add and remove place-value discs to build numbers up to 999,999.",
    "Agrega y quita discos de valor posicional para formar números hasta 999,999.",
  ),
  "number-builder:g4-tile-chart": n(
    "Place digit tiles in a place-value chart to make the goal number.",
    "Coloca fichas de dígitos en una tabla de valor posicional para formar el número de la meta.",
  ),
  "number-builder:g5-decimal-pieces": n(
    "Build decimals from base-ten pieces for ones, tenths, and hundredths.",
    "Forma decimales con piezas de base diez para unidades, décimas y centésimas.",
  ),
  "number-builder:g5-decimal-regroup": n(
    "Trade 10 hundredths for 1 tenth, or 10 tenths for 1 one, to show the same decimal another way.",
    "Cambia 10 centésimas por 1 décima, o 10 décimas por 1 unidad, para mostrar el mismo decimal de otra manera.",
  ),
  "number-builder:g6-chips": n(
    "Use positive and negative chips to build the integer in the goal.",
    "Usa fichas positivas y negativas para formar el entero de la meta.",
  ),
  "number-builder:g6-zero-pairs": n(
    "Add pairs of one positive and one negative chip, which make zero, to show the same value in new ways.",
    "Agrega pares de una ficha positiva y una negativa, que suman cero, para mostrar el mismo valor de otras maneras.",
  ),
  "number-builder:g7-signed-chips": n(
    "Build positive and negative decimals with chips to match the goal.",
    "Forma decimales positivos y negativos con fichas para igualar la meta.",
  ),
  "number-builder:g7-zero-sum": n(
    "Combine positive and negative amounts that add up to zero.",
    "Combina cantidades positivas y negativas que suman cero.",
  ),
  "number-builder:g7-exponent-discs": n(
    "Build numbers with powers-of-ten discs, where each disc is worth ten times the one before.",
    "Forma números con discos de potencias de diez, donde cada disco vale diez veces el anterior.",
  ),
  "number-builder:g8-sci-build": n(
    "Build a number in scientific notation by choosing its digits and its power of ten.",
    "Forma un número en notación científica eligiendo sus dígitos y su potencia de diez.",
  ),
  "number-builder:g8-exp-equivalence": n(
    "Change the digits and the power of ten together so the value stays the same.",
    "Cambia a la vez los dígitos y la potencia de diez para que el valor siga igual.",
  ),

  // math-match
  "math-match:k-count": n(
    "Match numbers, dot pictures, and number words that show the same amount.",
    "Une números, puntos y palabras que muestran la misma cantidad.",
  ),
  "math-match:k-teen": n(
    "Match teen numbers with pictures of one ten and some ones.",
    "Une los números del 11 al 19 con imágenes de una decena y algunas unidades.",
  ),
  "math-match:g1-add": n(
    "Match addition equations, pictures, and sums that mean the same thing.",
    "Une ecuaciones de suma, imágenes y sumas que significan lo mismo.",
  ),
  "math-match:g1-time": n(
    "Match clocks, digital times, and time words that show the same time.",
    "Une relojes, horas digitales y palabras que muestran la misma hora.",
  ),
  "math-match:g2-skip": n(
    "Match skip counting, repeated addition, and arrays that show the same total.",
    "Une conteo salteado, suma repetida y matrices que muestran el mismo total.",
  ),
  "math-match:g2-place": n(
    "Match two-digit numbers with tens-and-ones blocks and with their tens and ones.",
    "Une números de dos cifras con bloques de decenas y unidades y con sus decenas y unidades.",
  ),
  "math-match:g2-coins": n(
    "Match coins with their values in cents and with number words.",
    "Une monedas con su valor en centavos y con el nombre del número.",
  ),
  "math-match:g3-fraction": n(
    "Match fraction models, fractions, and points on a number line.",
    "Une modelos de fracciones, fracciones y puntos en la recta numérica.",
  ),
  "math-match:g3-multiply": n(
    "Match arrays, multiplication equations, and products.",
    "Une matrices, ecuaciones de multiplicación y productos.",
  ),
  "math-match:g4-equiv": n(
    "Match fractions that name the same amount.",
    "Une fracciones que nombran la misma cantidad.",
  ),
  "math-match:g4-fracdec": n(
    "Match tenths and hundredths shown as fractions, decimals, and grids.",
    "Une décimas y centésimas escritas como fracciones, decimales y cuadrículas.",
  ),
  "math-match:g4-wordform": n(
    "Match a number's word form, standard form, and expanded form.",
    "Une la forma en palabras, la forma estándar y la forma desarrollada de un número.",
  ),
  "math-match:g5-fdp": n(
    "Match benchmark fractions, decimals, and percents that have the same value, like 1/2, 0.5, and 50%.",
    "Une fracciones, decimales y porcentajes de referencia con el mismo valor, como 1/2, 0.5 y 50%.",
  ),
  "math-match:g5-order": n(
    "Match order-of-operations expressions with their values.",
    "Une expresiones con orden de las operaciones y sus valores.",
  ),
  "math-match:g6-ratio": n(
    "Match ratio tables, ratio statements, and unit rates that describe the same relationship.",
    "Une tablas de razones, enunciados de razón y tasas unitarias que describen la misma relación.",
  ),
  "math-match:g6-fdp": n(
    "Match fractions, decimals, and percents that name the same amount.",
    "Une fracciones, decimales y porcentajes que nombran la misma cantidad.",
  ),
  "math-match:g6-verbal": n(
    "Match word descriptions, expressions, and tables that describe the same rule.",
    "Une descripciones en palabras, expresiones y tablas que describen la misma regla.",
  ),
  "math-match:g7-prop": n(
    "Match proportional tables, equations, and word descriptions of the same relationship.",
    "Une tablas proporcionales, ecuaciones y descripciones en palabras de la misma relación.",
  ),
  "math-match:g7-integers": n(
    "Match integer operations with the number-line move and the result.",
    "Une operaciones con enteros con el movimiento en la recta numérica y el resultado.",
  ),
  "math-match:g8-linear": n(
    "Match linear equations with their graphs and tables.",
    "Une ecuaciones lineales con sus gráficas y tablas.",
  ),
  "math-match:g8-exponents": n(
    "Match powers of ten, their values, and scientific notation.",
    "Une potencias de diez, sus valores y la notación científica.",
  ),

  // fraction-kitchen
  "fraction-kitchen:fair-shares": n(
    "Share food into equal parts so everyone gets a fair share.",
    "Reparte comida en partes iguales para que a cada quien le toque lo mismo.",
  ),
  "fraction-kitchen:fix-the-cuts": n(
    "Decide whether the cuts make equal parts, and fix the ones that do not.",
    "Decide si los cortes hacen partes iguales y arregla los que no.",
  ),
  "fraction-kitchen:serve-parts": n(
    "Cut and serve the fraction the order asks for.",
    "Corta y sirve la fracción que pide el pedido.",
  ),
  "fraction-kitchen:pizza-equiv": n(
    "Cut a pizza different ways to show fractions that name the same amount.",
    "Corta una pizza de distintas maneras para mostrar fracciones que son la misma cantidad.",
  ),
  "fraction-kitchen:compare-pieces": n(
    "Compare fractions of the same whole and decide which share is bigger.",
    "Compara fracciones del mismo entero y decide cuál parte es mayor.",
  ),
  "fraction-kitchen:line-marker": n(
    "Place fractions on a number line.",
    "Ubica fracciones en una recta numérica.",
  ),
  "fraction-kitchen:pour-cup": n(
    "Pour measuring cups to the fraction the order asks for.",
    "Llena tazas medidoras hasta la fracción que pide el pedido.",
  ),
  "fraction-kitchen:tenths-cup": n(
    "Scoop tenths and hundredths of a cup.",
    "Sirve décimas y centésimas de taza.",
  ),
  "fraction-kitchen:mixed-scoops": n(
    "Fill the pitcher with scoops to make mixed numbers.",
    "Llena la jarra con medidas para formar números mixtos.",
  ),
  "fraction-kitchen:batch-recipe": n(
    "Make a recipe in whole or part batches and find how much of each ingredient you need.",
    "Prepara una receta en tandas completas o parciales y halla cuánto necesitas de cada ingrediente.",
  ),
  "fraction-kitchen:unlike-bars": n(
    "Use scoops of different sizes to add and subtract fractions with different denominators.",
    "Usa medidas de distintos tamaños para sumar y restar fracciones con denominadores diferentes.",
  ),
  "fraction-kitchen:part-of-part": n(
    "Find a fraction of a fraction, like 1/2 of 3/4.",
    "Halla una fracción de una fracción, como 1/2 de 3/4.",
  ),
  "fraction-kitchen:divide-unit": n(
    "Share or scoop to divide a unit fraction by a whole number, or a whole number by a unit fraction.",
    "Reparte o sirve para dividir una fracción unitaria entre un número entero, o un entero entre una fracción unitaria.",
  ),
  "fraction-kitchen:divide-fractions": n(
    "Divide fractions to find how many servings fit.",
    "Divide fracciones para hallar cuántas porciones caben.",
  ),
  "fraction-kitchen:percent-amount": n(
    "Find a percent of a cup.",
    "Halla un porcentaje de una taza.",
  ),
  "fraction-kitchen:pour-spill": n(
    "Pour in and spill out amounts to add and subtract positive and negative fractions.",
    "Agrega y derrama cantidades para sumar y restar fracciones positivas y negativas.",
  ),
  "fraction-kitchen:repeating-decimals": n(
    "Decide whether a fraction makes a decimal that ends or one that repeats.",
    "Decide si una fracción da un decimal que termina o uno que se repite.",
  ),
  "fraction-kitchen:rational-approx": n(
    "Decide whether a fraction is exactly equal to a number like π or only a close estimate.",
    "Decide si una fracción es exactamente igual a un número como π o solo una estimación cercana.",
  ),
  "fraction-kitchen:sci-measures": n(
    "Read and write recipe measurements in scientific notation.",
    "Lee y escribe medidas de recetas en notación científica.",
  ),

  // math-market
  "math-market:penny-count": n(
    "Count pennies to find the price.",
    "Cuenta centavos para hallar el precio.",
  ),
  "math-market:costs-more": n(
    "Compare two prices and choose which costs more.",
    "Compara dos precios y elige cuál cuesta más.",
  ),
  "math-market:count-pnd": n(
    "Count pennies, nickels, and dimes to make a price.",
    "Cuenta monedas de 1, 5 y 10 centavos para formar un precio.",
  ),
  "math-market:dollars-cents": n(
    "Count dollars and cents to find a total.",
    "Cuenta dólares y centavos para hallar un total.",
  ),
  "math-market:make-change": n(
    "Count up or subtract to make change from a payment.",
    "Cuenta hacia arriba o resta para dar el cambio de un pago.",
  ),
  "math-market:exact-pay": n(
    "Pay an exact price with the fewest coins and bills.",
    "Paga un precio exacto con la menor cantidad de monedas y billetes.",
  ),
  "math-market:round-prices": n(
    "Round prices to estimate the total.",
    "Redondea precios para estimar el total.",
  ),
  "math-market:fill-budget": n(
    "Choose items to buy without going over your budget.",
    "Elige artículos para comprar sin pasarte de tu presupuesto.",
  ),
  "math-market:multi-step-money": n(
    "Solve money problems that take more than one step.",
    "Resuelve problemas de dinero que necesitan más de un paso.",
  ),
  "math-market:decimal-ops": n(
    "Add, subtract, multiply, and divide decimal prices.",
    "Suma, resta, multiplica y divide precios con decimales.",
  ),
  "math-market:better-buy": n(
    "Find each unit price to decide which is the better buy.",
    "Halla el precio por unidad para decidir cuál es la mejor compra.",
  ),
  "math-market:rate-table": n(
    "Use a rate table to find the cost for different amounts.",
    "Usa una tabla de tasas para hallar el costo de distintas cantidades.",
  ),
  "math-market:percent-off": n(
    "Find the sale price after a percent discount.",
    "Halla el precio de oferta después de un descuento en porcentaje.",
  ),
  "math-market:tax-tip": n(
    "Calculate sales tax and tips and add them to the price.",
    "Calcula el impuesto de venta y la propina y súmalos al precio.",
  ),
  "math-market:percent-change": n(
    "Find the new price after a markup or markdown, and the percent it changed.",
    "Halla el precio nuevo después de un aumento o una rebaja y el porcentaje que cambió.",
  ),
  "math-market:simple-interest": n(
    "Use simple interest to find how much money is earned or owed over time.",
    "Usa el interés simple para hallar cuánto dinero se gana o se debe con el tiempo.",
  ),
  "math-market:compare-plans": n(
    "Compare membership plans to see which costs less for how much you use it.",
    "Compara planes de membresía para ver cuál cuesta menos según cuánto lo uses.",
  ),
  "math-market:break-even": n(
    "Find the point where two costs are equal.",
    "Halla el punto donde dos costos son iguales.",
  ),
  "math-market:slope-unit-cost": n(
    "Read the slope of a cost line as the price per unit.",
    "Lee la pendiente de una línea de costo como el precio por unidad.",
  ),

  // array-architect
  "array-architect:k-rows": n("Place counters in equal rows.", "Coloca fichas en filas iguales."),
  "array-architect:k-count": n(
    "Place the number of counters the clue asks for.",
    "Coloca la cantidad de fichas que pide la pista.",
  ),
  "array-architect:g1-equal-rows": n(
    "Build equal rows with up to 20 counters.",
    "Forma filas iguales con hasta 20 fichas.",
  ),
  "array-architect:g1-repeat-add": n(
    "Build arrays and write the repeated addition that matches.",
    "Forma matrices y escribe la suma repetida que corresponde.",
  ),
  "array-architect:g2-array-eq": n(
    "Build arrays up to 5 by 5 and write the equation.",
    "Forma matrices de hasta 5 por 5 y escribe la ecuación.",
  ),
  "array-architect:g2-even-odd": n(
    "Arrange counters in pairs to decide if a number is even or odd.",
    "Ordena fichas en parejas para decidir si un número es par o impar.",
  ),
  "array-architect:g3-mult-array": n(
    "Build arrays to show multiplication facts.",
    "Forma matrices para mostrar operaciones de multiplicación.",
  ),
  "array-architect:g3-commute": n(
    "Turn an array to see that switching the factors gives the same product.",
    "Gira una matriz para ver que cambiar el orden de los factores da el mismo producto.",
  ),
  "array-architect:g3-area-tile": n(
    "Cover a shape with square tiles to find its area.",
    "Cubre una figura con losetas cuadradas para hallar su área.",
  ),
  "array-architect:g3-perimeter": n(
    "Build a rectangle with the perimeter the clue gives.",
    "Construye un rectángulo con el perímetro que da la pista.",
  ),
  "array-architect:g4-area-perim": n(
    "Build rectangles that fit clues about area and perimeter.",
    "Construye rectángulos que cumplan pistas sobre área y perímetro.",
  ),
  "array-architect:g4-factor-pairs": n(
    "Build every rectangle for a number to find all its factor pairs.",
    "Construye todos los rectángulos de un número para hallar todos sus pares de factores.",
  ),
  "array-architect:g4-area-model": n(
    "Use an area model to multiply a two-digit number by a one-digit number.",
    "Usa un modelo de área para multiplicar un número de dos cifras por uno de una cifra.",
  ),
  "array-architect:g5-area-model": n(
    "Use an area model to multiply a two-digit number or a decimal.",
    "Usa un modelo de área para multiplicar un número de dos cifras o un decimal.",
  ),
  "array-architect:g5-volume": n(
    "Build a box layer by layer to find its volume.",
    "Construye una caja capa por capa para hallar su volumen.",
  ),
  "array-architect:g6-composite": n(
    "Split a shape made of rectangles into parts and add their areas.",
    "Divide una figura hecha de rectángulos en partes y suma sus áreas.",
  ),
  "array-architect:g6-distribute": n(
    "Use the areas of rectangles to see the distributive property.",
    "Usa las áreas de rectángulos para ver la propiedad distributiva.",
  ),
  "array-architect:g6-gcf": n(
    "Find the greatest common factor as the side of the biggest square tile that fits.",
    "Halla el máximo común divisor como el lado de la loseta cuadrada más grande que cabe.",
  ),
  "array-architect:g6-lcm": n(
    "Find the least common multiple as the side of the smallest square both sizes can build.",
    "Halla el mínimo común múltiplo como el lado del cuadrado más pequeño que se puede formar con ambos tamaños.",
  ),
  "array-architect:g7-expand": n(
    "Use an area model to expand a(b + c).",
    "Usa un modelo de área para desarrollar a(b + c).",
  ),
  "array-architect:g7-scale": n(
    "See how scaling the sides changes the area.",
    "Observa cómo cambia el área cuando se escalan los lados.",
  ),
  "array-architect:g8-expand": n("Use the two binomials as side lengths of a rectangle area model. Find each partial area, add the partial areas, and combine like terms.", "Usa los dos binomios como lados de un modelo de área rectangular. Halla cada área parcial, suma las áreas parciales y combina términos semejantes."),
  "array-architect:g8-factor": n(
    "Use algebra tiles to factor an expression into two binomials.",
    "Usa fichas de álgebra para factorizar una expresión en dos binomios.",
  ),

  // number-line-quest
  "number-line-quest:k-next-on-line": n(
    "Count on and back on the number line.",
    "Cuenta hacia adelante y hacia atrás en la recta numérica.",
  ),
  "number-line-quest:k-place-to-20": n(
    "Place numbers from 0 to 20 on the line.",
    "Ubica números del 0 al 20 en la recta.",
  ),
  "number-line-quest:k-hop-count": n(
    "Hop along the line by counting to reach the goal.",
    "Salta por la recta contando para llegar a la meta.",
  ),
  "number-line-quest:g1-place-100": n(
    "Place numbers up to 100 on the line.",
    "Ubica números hasta el 100 en la recta.",
  ),
  "number-line-quest:g1-hop-tens-ones": n(
    "Hop by tens and ones to reach the goal.",
    "Salta de diez en diez y de uno en uno para llegar a la meta.",
  ),
  "number-line-quest:g2-skip-hops": n(
    "Hop by 2s, 5s, 10s, or other jumps to reach the goal.",
    "Salta de 2 en 2, de 5 en 5, de 10 en 10 u otros saltos para llegar a la meta.",
  ),
  "number-line-quest:g2-place-1000": n(
    "Place numbers up to 1,000 on the line.",
    "Ubica números hasta el 1,000 en la recta.",
  ),
  "number-line-quest:g2-even-odd": n(
    "Find even and odd numbers on the line.",
    "Encuentra números pares e impares en la recta.",
  ),
  "number-line-quest:g3-fractions-line": n(
    "Place fractions on a number line.",
    "Ubica fracciones en una recta numérica.",
  ),
  "number-line-quest:g3-round-nearest": n(
    "Round to the nearest 10 or 100 by seeing which mark is closer.",
    "Redondea a la decena o centena más cercana viendo qué marca está más cerca.",
  ),
  "number-line-quest:g4-frac-dec": n(
    "Place decimals and mixed numbers on a number line.",
    "Ubica decimales y números mixtos en una recta numérica.",
  ),
  "number-line-quest:g4-equivalent-positions": n(
    "See that equivalent fractions land on the same spot on the line.",
    "Observa que las fracciones equivalentes caen en el mismo lugar de la recta.",
  ),
  "number-line-quest:g5-zoom-decimals": n(
    "Zoom in on the line to place decimals between the marks.",
    "Acerca la recta para ubicar decimales entre las marcas.",
  ),
  "number-line-quest:g5-round-decimals": n(
    "Round decimals by seeing which mark on the line is closer.",
    "Redondea decimales viendo qué marca de la recta está más cerca.",
  ),
  "number-line-quest:g5-order-decimals": n(
    "Place decimals on the line to put them in order.",
    "Ubica decimales en la recta para ordenarlos.",
  ),
  "number-line-quest:g6-integers-rationals": n(
    "Place integers and other rational numbers, including negatives, on the line.",
    "Ubica enteros y otros números racionales, incluidos los negativos, en la recta.",
  ),
  "number-line-quest:g6-opposite-absolute": n(
    "Find opposites and measure the distance from zero to see absolute value.",
    "Halla opuestos y mide la distancia desde cero para ver el valor absoluto.",
  ),
  "number-line-quest:g6-order-rationals": n(
    "Place rational numbers on the line to put them in order.",
    "Ubica números racionales en la recta para ordenarlos.",
  ),
  "number-line-quest:g7-hop-rationals": n(
    "Hop along the line by positive and negative rational amounts to reach the goal.",
    "Salta por la recta con cantidades racionales positivas y negativas para llegar a la meta.",
  ),
  "number-line-quest:g7-hop-place": n(
    "Add and subtract signed numbers by hopping on the line and placing the result.",
    "Suma y resta números con signo saltando en la recta y ubicando el resultado.",
  ),
  "number-line-quest:g7-distance-between": n(
    "Find the distance between two points on the line.",
    "Halla la distancia entre dos puntos de la recta.",
  ),
  "number-line-quest:g8-square-roots": n(
    "Place square roots on the line between the two whole numbers they fall between.",
    "Ubica raíces cuadradas en la recta entre los dos números enteros donde caen.",
  ),
  "number-line-quest:g8-cube-roots": n(
    "Place cube roots on the line between the two whole numbers they fall between.",
    "Ubica raíces cúbicas en la recta entre los dos números enteros donde caen.",
  ),
  "number-line-quest:g8-scientific-positions": n(
    "Place numbers written in scientific notation on a line.",
    "Ubica en una recta números escritos en notación científica.",
  ),

  // pattern-detective
  "pattern-detective:k-core": n(
    "Find the part that repeats in a pattern.",
    "Encuentra la parte que se repite en un patrón.",
  ),
  "pattern-detective:k-count-on": n(
    "Test a counting machine to find how many it adds each time.",
    "Prueba una máquina de contar para hallar cuántos suma cada vez.",
  ),
  "pattern-detective:g1-count-pattern": n(
    "Find number patterns that count by 1s, 2s, 5s, and 10s.",
    "Encuentra patrones numéricos que cuentan de 1 en 1, de 2 en 2, de 5 en 5 y de 10 en 10.",
  ),
  "pattern-detective:g1-grow-shape": n(
    "Find how a shape pattern grows at each step.",
    "Descubre cómo crece cada paso de un patrón de figuras.",
  ),
  "pattern-detective:g2-skip": n(
    "Find the secret start and jump in a skip-counting pattern.",
    "Descubre el inicio secreto y el salto de un patrón de conteo salteado.",
  ),
  "pattern-detective:g2-hundred-chart": n(
    "Find a +n pattern by looking at the numbers on a hundred chart.",
    "Encuentra un patrón de +n observando los números en una tabla del cien.",
  ),
  "pattern-detective:g2-even-odd": n(
    "Find patterns in even and odd numbers.",
    "Encuentra patrones en los números pares e impares.",
  ),
  "pattern-detective:g3-times-table": n(
    "Find patterns in addition and multiplication tables and explain why they work.",
    "Encuentra patrones en tablas de suma y multiplicación y explica por qué funcionan.",
  ),
  "pattern-detective:g3-arith-rule": n(
    "Find the rule in a number pattern that adds or subtracts the same amount each time.",
    "Encuentra la regla de un patrón numérico que suma o resta la misma cantidad cada vez.",
  ),
  "pattern-detective:g4-rule-pattern": n(
    "Build number patterns from a rule that adds or multiplies.",
    "Forma patrones numéricos a partir de una regla que suma o multiplica.",
  ),
  "pattern-detective:g4-shape-nth": n(
    "Find the rule for how many pieces the nth shape has.",
    "Halla la regla para saber cuántas piezas tiene la figura número n.",
  ),
  "pattern-detective:g5-two-rules": n(
    "Compare two rules and write their ordered pairs.",
    "Compara dos reglas y escribe sus pares ordenados.",
  ),
  "pattern-detective:g5-numerical-pattern": n(
    "Find number patterns that follow a two-step rule.",
    "Encuentra patrones numéricos que siguen una regla de dos pasos.",
  ),
  "pattern-detective:g6-io-table": n(
    "Fill input-output tables to find rules like y = x + a and y = ax.",
    "Completa tablas de entrada y salida para hallar reglas como y = x + a y y = ax.",
  ),
  "pattern-detective:g6-variables": n(
    "Tell which quantity depends on the other, and name the dependent and independent variables.",
    "Indica qué cantidad depende de la otra y nombra la variable dependiente y la independiente.",
  ),
  "pattern-detective:g7-proportional": n(
    "Decide whether a table or graph shows a proportional relationship.",
    "Decide si una tabla o una gráfica muestra una relación proporcional.",
  ),
  "pattern-detective:g7-constant-k": n(
    "Find the constant of proportionality from a table.",
    "Halla la constante de proporcionalidad en una tabla.",
  ),
  "pattern-detective:g7-linear-eq": n(
    "Write y = mx + b from a table of values.",
    "Escribe y = mx + b a partir de una tabla de valores.",
  ),
  "pattern-detective:g8-linear-nonlinear": n(
    "Decide whether a function is linear or nonlinear.",
    "Decide si una función es lineal o no lineal.",
  ),
  "pattern-detective:g8-slope": n(
    "Find the rate of change, or slope, from two points.",
    "Halla la tasa de cambio, o pendiente, a partir de dos puntos.",
  ),
  "pattern-detective:g8-exponential": n(
    "Find patterns that multiply by the same amount at each step.",
    "Encuentra patrones que multiplican por la misma cantidad en cada paso.",
  ),

  // ratio-recipe-lab
  "ratio-recipe-lab:bowls-groups": n(
    "Count scoops in bowls that each hold the same amount.",
    "Cuenta las medidas en tazones que tienen la misma cantidad.",
  ),
  "ratio-recipe-lab:more-fewer": n(
    "Compare trays of scoops to tell which has more.",
    "Compara bandejas de medidas para decir cuál tiene más.",
  ),
  "ratio-recipe-lab:share-bowls": n(
    "Share scoops equally into bowls.",
    "Reparte medidas en partes iguales entre tazones.",
  ),
  "ratio-recipe-lab:double-half": n(
    "Double or halve a mix and see how every amount changes.",
    "Duplica o reduce a la mitad una mezcla y observa cómo cambia cada cantidad.",
  ),
  "ratio-recipe-lab:repeat-batch": n(
    "Find the total for trays that all hold the same amount.",
    "Halla el total de bandejas que tienen la misma cantidad.",
  ),
  "ratio-recipe-lab:times-as-many": n(
    'Compare amounts using "times as many."',
    "Compara cantidades usando «veces más».",
  ),
  "ratio-recipe-lab:scale-whole": n(
    "Scale a recipe up or down to make enough, or find the biggest batch you can make.",
    "Aumenta o reduce una receta para que alcance, o halla la tanda más grande que puedes hacer.",
  ),
  "ratio-recipe-lab:table-100": n(
    "Use ratio tables to scale amounts up to 100.",
    "Usa tablas de razones para escalar cantidades hasta 100.",
  ),
  "ratio-recipe-lab:fraction-batch": n(
    "Make half batches and other part batches and find each amount.",
    "Prepara medias tandas y otras tandas parciales y halla cada cantidad.",
  ),
  "ratio-recipe-lab:fraction-scale": n(
    "Scale a recipe by a fraction and find the biggest batch you can make.",
    "Escala una receta con una fracción y halla la tanda más grande que puedes hacer.",
  ),
  "ratio-recipe-lab:graph-pairs": n(
    "Plot batch amounts as points on a graph.",
    "Marca las cantidades de las tandas como puntos en una gráfica.",
  ),
  "ratio-recipe-lab:equiv-ratios": n(
    "Complete ratio tables and write equivalent ratios as a:b.",
    "Completa tablas de razones y escribe razones equivalentes como a:b.",
  ),
  "ratio-recipe-lab:unit-rate": n(
    "Find the amount for 1 unit.",
    "Halla la cantidad para 1 unidad.",
  ),
  "ratio-recipe-lab:percent-per-100": n(
    "Use the meaning of percent as a rate per 100.",
    "Usa el significado de porcentaje como una tasa por cada 100.",
  ),
  "ratio-recipe-lab:constant-speed": n(
    "Use distance and time to solve problems about steady speed.",
    "Usa la distancia y el tiempo para resolver problemas de rapidez constante.",
  ),
  "ratio-recipe-lab:stronger-mix": n(
    "Compare two mixes to decide which is stronger.",
    "Compara dos mezclas para decidir cuál es más fuerte.",
  ),
  "ratio-recipe-lab:const-k": n(
    "Find k, the constant of proportionality, from a table.",
    "Halla k, la constante de proporcionalidad, en una tabla.",
  ),
  "ratio-recipe-lab:equation-ykx": n(
    "Use y = kx to find an output from an input, or an input from an output.",
    "Usa y = kx para hallar una salida a partir de una entrada, o una entrada a partir de una salida.",
  ),
  "ratio-recipe-lab:scale-drawing": n(
    "Use a scale to connect a length in a drawing to the real length.",
    "Usa una escala para relacionar una longitud del dibujo con la longitud real.",
  ),
  "ratio-recipe-lab:percent-prop": n(
    "Use proportions to solve tips, sales tax, and discounts.",
    "Usa proporciones para resolver propinas, impuestos y descuentos.",
  ),
  "ratio-recipe-lab:line-origin": n(
    "See that the slope of a line through the origin is the unit rate.",
    "Observa que la pendiente de una recta que pasa por el origen es la tasa unitaria.",
  ),
  "ratio-recipe-lab:compare-rates": n(
    "Compare rates shown in a table, an equation, and a graph to decide which is greater.",
    "Compara tasas dadas en una tabla, una ecuación y una gráfica para decidir cuál es mayor.",
  ),
  "ratio-recipe-lab:direct-variation": n(
    "Find k in a direct variation, then use y = kx.",
    "Halla k en una variación directa y luego usa y = kx.",
  ),

  // math-puzzle-studio
  "math-puzzle-studio:bond-parts": n(
    "Find the missing part in a number bond.",
    "Halla la parte que falta en un enlace numérico.",
  ),
  "math-puzzle-studio:balance-same": n(
    "Balance a scale so both sides hold the same amount.",
    "Equilibra una balanza para que los dos lados tengan la misma cantidad.",
  ),
  "math-puzzle-studio:equal-sign": n(
    "See that the equal sign means both sides have the same amount.",
    "Observa que el signo igual significa que los dos lados tienen la misma cantidad.",
  ),
  "math-puzzle-studio:missing-addend": n(
    "Find the missing number that makes an equation true.",
    "Halla el número que falta para que una ecuación sea verdadera.",
  ),
  "math-puzzle-studio:grid-sums": n(
    "Fill in a grid so its rows and columns add up to the sums shown.",
    "Completa una cuadrícula para que sus filas y columnas sumen lo indicado.",
  ),
  "math-puzzle-studio:magic-triangle": n(
    "Place numbers on a triangle so each side adds up to the same sum.",
    "Coloca números en un triángulo para que cada lado sume lo mismo.",
  ),
  "math-puzzle-studio:magic-square": n(
    "Fill a square so every row, column, and diagonal has the same sum.",
    "Completa un cuadrado para que cada fila, columna y diagonal sume lo mismo.",
  ),
  "math-puzzle-studio:factor-grid": n(
    "Fill a grid using factors and products.",
    "Completa una cuadrícula usando factores y productos.",
  ),
  "math-puzzle-studio:kenken": n(
    "Fill a grid so each cage reaches its target with the operation shown.",
    "Completa una cuadrícula para que cada jaula llegue a su meta con la operación indicada.",
  ),
  "math-puzzle-studio:factor-pairs": n(
    "Solve puzzles that use factors and factor pairs.",
    "Resuelve rompecabezas que usan factores y pares de factores.",
  ),
  "math-puzzle-studio:target-ops": n(
    "Use the order of operations to make a target number.",
    "Usa el orden de las operaciones para formar un número meta.",
  ),
  "math-puzzle-studio:equal-forms": n(
    "Find values written in different forms that are equal.",
    "Encuentra valores escritos de distintas formas que son iguales.",
  ),
  "math-puzzle-studio:scale-onestep": n(
    "Solve one-step equations by balancing a scale.",
    "Resuelve ecuaciones de un paso equilibrando una balanza.",
  ),
  "math-puzzle-studio:inequality-scale": n(
    "Use a tipped scale to show and solve an inequality.",
    "Usa una balanza inclinada para mostrar y resolver una desigualdad.",
  ),
  "math-puzzle-studio:scale-twostep": n(
    "Solve two-step equations by balancing a scale.",
    "Resuelve ecuaciones de dos pasos equilibrando una balanza.",
  ),
  "math-puzzle-studio:equiv-expr": n(
    "Find expressions that always have the same value.",
    "Encuentra expresiones que siempre tienen el mismo valor.",
  ),
  "math-puzzle-studio:scale-system": n(
    "Use two scales to find two unknown values.",
    "Usa dos balanzas para hallar dos valores desconocidos.",
  ),
  "math-puzzle-studio:scale-both-sides": n(
    "Solve equations with variables on both sides by balancing scales.",
    "Resuelve ecuaciones con variables en ambos lados equilibrando balanzas.",
  ),
  "math-puzzle-studio:pythag-squares": n(
    "Use squares on the sides of a right triangle to see how the areas balance.",
    "Usa cuadrados sobre los lados de un triángulo rectángulo para ver cómo se equilibran las áreas.",
  ),

  // family-math-duel
  "family-math-duel:k-compare": n(
    "Compare your card with your partner's and see who has more.",
    "Compara tu carta con la de tu compañero y mira quién tiene más.",
  ),
  "family-math-duel:k-make10": n("Use cards to make ten.", "Usa cartas para formar diez."),
  "family-math-duel:g1-biggest-sum": n(
    "Pick cards to make the biggest sum.",
    "Elige cartas para formar la suma más grande.",
  ),
  "family-math-duel:g1-closest": n(
    "Pick cards to make a sum closest to the target.",
    "Elige cartas para formar una suma lo más cerca posible de la meta.",
  ),
  "family-math-duel:g2-place-number": n(
    "Place digit cards to build the biggest number.",
    "Coloca cartas de dígitos para formar el número más grande.",
  ),
  "family-math-duel:g2-two-digit-sums": n(
    "Build two-digit numbers with cards and add them.",
    "Forma números de dos cifras con cartas y súmalos.",
  ),
  "family-math-duel:g3-product-war": n(
    "Play cards to make the greater product.",
    "Juega cartas para formar el producto mayor.",
  ),
  "family-math-duel:g3-closest-product": n(
    "Pick cards to make a product closest to the target.",
    "Elige cartas para formar un producto lo más cerca posible de la meta.",
  ),
  "family-math-duel:g4-big-number": n(
    "Build big numbers with cards to reach or beat a target.",
    "Forma números grandes con cartas para alcanzar o superar una meta.",
  ),
  "family-math-duel:g4-multiply-tens": n(
    "Multiply by tens using cards.",
    "Multiplica por decenas usando cartas.",
  ),
  "family-math-duel:g5-compare-values": n(
    "Make fractions or decimals with cards and decide who has the bigger value.",
    "Forma fracciones o decimales con cartas y decide quién tiene el valor mayor.",
  ),
  "family-math-duel:g5-near-one": n(
    "Make a fraction as close to one as you can.",
    "Forma una fracción lo más cerca de uno que puedas.",
  ),
  "family-math-duel:g5-decimal-sums": n(
    "Make decimals with cards and add them.",
    "Forma decimales con cartas y súmalos.",
  ),
  "family-math-duel:g6-order-of-ops": n(
    "Use cards and the order of operations to hit a target value.",
    "Usa cartas y el orden de las operaciones para llegar a un valor meta.",
  ),
  "family-math-duel:g6-zero-sum": n(
    "Use positive and negative cards to make a sum of zero.",
    "Usa cartas positivas y negativas para formar una suma de cero.",
  ),
  "family-math-duel:g6-smallest-fraction": n(
    "Use cards to make the smallest positive fraction.",
    "Usa cartas para formar la fracción positiva más pequeña.",
  ),
  "family-math-duel:g7-percent-of": n(
    "Use cards to find a percent of a number.",
    "Usa cartas para hallar un porcentaje de un número.",
  ),
  "family-math-duel:g7-signed-product": n(
    "Use positive and negative cards to make a product.",
    "Usa cartas positivas y negativas para formar un producto.",
  ),
  "family-math-duel:g8-power": n(
    "Use cards to build powers and compare their values.",
    "Usa cartas para formar potencias y comparar sus valores.",
  ),
  "family-math-duel:g8-scinot": n(
    "Use cards to build numbers in scientific notation.",
    "Usa cartas para formar números en notación científica.",
  ),
  "family-math-duel:g8-roots": n(
    "Use cards to make square roots that hit a target.",
    "Usa cartas para formar raíces cuadradas que lleguen a una meta.",
  ),
};

export const noteKey = (gameId, skillId) => `${gameId}:${skillId}`;

// A skill id that only one game uses can be looked up without the game; shared ids (k-count) need it.
export function noteFor(gameId, skillId) {
  if (gameId) return SKILL_NOTES[noteKey(gameId, skillId)] || null;
  const hits = Object.keys(SKILL_NOTES).filter((key) => key.endsWith(`:${skillId}`));
  return hits.length === 1 ? SKILL_NOTES[hits[0]] : null;
}

// What each skill is about, in the coaching and browsing vocabulary (coach.js STRAND_KEYS, plus "binomial-area"). Authored
// per skill because the CCSS domain names on the games ("Operations and algebraic thinking") and keywords in titles
// both misfile skills: matching addition read as algebra, clocks as data.
export const SKILL_TOPICS = {
  // number-builder
  "number-builder:k-count": "counting-place-value",
  "number-builder:g1-tens-ones": "counting-place-value",
  "number-builder:g1-teen": "counting-place-value",
  "number-builder:g2-hundreds": "counting-place-value",
  "number-builder:g2-regroup": "counting-place-value",
  "number-builder:g3-discs": "counting-place-value",
  "number-builder:g3-expanded": "counting-place-value",
  "number-builder:g4-discs": "counting-place-value",
  "number-builder:g4-tile-chart": "counting-place-value",
  "number-builder:g7-exponent-discs": "counting-place-value",
  "number-builder:g8-sci-build": "counting-place-value",
  "number-builder:g8-exp-equivalence": "counting-place-value",
  "number-builder:k-bonds": "addition-subtraction",
  "number-builder:g5-decimal-pieces": "decimals",
  "number-builder:g5-decimal-regroup": "decimals",
  "number-builder:g6-chips": "number-line",
  "number-builder:g6-zero-pairs": "number-line",
  "number-builder:g7-signed-chips": "number-line",
  "number-builder:g7-zero-sum": "number-line",
  // math-match
  "math-match:k-count": "counting-place-value",
  "math-match:k-teen": "counting-place-value",
  "math-match:g2-place": "counting-place-value",
  "math-match:g4-wordform": "counting-place-value",
  "math-match:g8-exponents": "counting-place-value",
  "math-match:g1-add": "addition-subtraction",
  "math-match:g1-time": "geometry-measure",
  "math-match:g2-skip": "multiplication-division",
  "math-match:g3-multiply": "multiplication-division",
  "math-match:g2-coins": "money",
  "math-match:g3-fraction": "fractions",
  "math-match:g4-equiv": "fractions",
  "math-match:g4-fracdec": "fractions",
  "math-match:g5-fdp": "fractions",
  "math-match:g5-order": "equations",
  "math-match:g6-verbal": "equations",
  "math-match:g6-ratio": "ratios-percents",
  "math-match:g6-fdp": "ratios-percents",
  "math-match:g7-prop": "ratios-percents",
  "math-match:g7-integers": "number-line",
  "math-match:g8-linear": "patterns-algebra",
  // fraction-kitchen
  "fraction-kitchen:fair-shares": "fractions",
  "fraction-kitchen:fix-the-cuts": "fractions",
  "fraction-kitchen:serve-parts": "fractions",
  "fraction-kitchen:pizza-equiv": "fractions",
  "fraction-kitchen:compare-pieces": "fractions",
  "fraction-kitchen:line-marker": "fractions",
  "fraction-kitchen:pour-cup": "fractions",
  "fraction-kitchen:mixed-scoops": "fractions",
  "fraction-kitchen:batch-recipe": "fractions",
  "fraction-kitchen:unlike-bars": "fractions",
  "fraction-kitchen:part-of-part": "fractions",
  "fraction-kitchen:divide-unit": "fractions",
  "fraction-kitchen:divide-fractions": "fractions",
  "fraction-kitchen:rational-approx": "fractions",
  "fraction-kitchen:tenths-cup": "decimals",
  "fraction-kitchen:repeating-decimals": "decimals",
  "fraction-kitchen:percent-amount": "ratios-percents",
  "fraction-kitchen:pour-spill": "number-line",
  "fraction-kitchen:sci-measures": "counting-place-value",
  // math-market
  "math-market:penny-count": "money",
  "math-market:costs-more": "money",
  "math-market:count-pnd": "money",
  "math-market:dollars-cents": "money",
  "math-market:make-change": "money",
  "math-market:exact-pay": "money",
  "math-market:round-prices": "money",
  "math-market:fill-budget": "money",
  "math-market:multi-step-money": "money",
  "math-market:decimal-ops": "money",
  "math-market:better-buy": "ratios-percents",
  "math-market:rate-table": "ratios-percents",
  "math-market:percent-off": "ratios-percents",
  "math-market:tax-tip": "ratios-percents",
  "math-market:percent-change": "ratios-percents",
  "math-market:simple-interest": "ratios-percents",
  "math-market:slope-unit-cost": "ratios-percents",
  "math-market:compare-plans": "equations",
  "math-market:break-even": "equations",
  // array-architect
  "array-architect:k-rows": "counting-place-value",
  "array-architect:k-count": "counting-place-value",
  "array-architect:g2-even-odd": "counting-place-value",
  "array-architect:g1-equal-rows": "multiplication-division",
  "array-architect:g1-repeat-add": "multiplication-division",
  "array-architect:g2-array-eq": "multiplication-division",
  "array-architect:g3-mult-array": "multiplication-division",
  "array-architect:g3-commute": "multiplication-division",
  "array-architect:g4-factor-pairs": "multiplication-division",
  "array-architect:g4-area-model": "multiplication-division",
  "array-architect:g5-area-model": "multiplication-division",
  "array-architect:g6-distribute": "multiplication-division",
  "array-architect:g6-gcf": "multiplication-division",
  "array-architect:g6-lcm": "multiplication-division",
  "array-architect:g3-area-tile": "geometry-measure",
  "array-architect:g3-perimeter": "geometry-measure",
  "array-architect:g4-area-perim": "geometry-measure",
  "array-architect:g5-volume": "geometry-measure",
  "array-architect:g6-composite": "geometry-measure",
  "array-architect:g7-expand": "equations",
  "array-architect:g7-scale": "ratios-percents",
  "array-architect:g8-expand": "binomial-area",
  "array-architect:g8-factor": "binomial-area",
  // number-line-quest
  "number-line-quest:k-next-on-line": "counting-place-value",
  "number-line-quest:k-hop-count": "counting-place-value",
  "number-line-quest:k-place-to-20": "number-line",
  "number-line-quest:g1-place-100": "number-line",
  "number-line-quest:g1-hop-tens-ones": "number-line",
  "number-line-quest:g2-skip-hops": "number-line",
  "number-line-quest:g2-place-1000": "number-line",
  "number-line-quest:g2-even-odd": "number-line",
  "number-line-quest:g3-round-nearest": "number-line",
  "number-line-quest:g6-integers-rationals": "number-line",
  "number-line-quest:g6-opposite-absolute": "number-line",
  "number-line-quest:g6-order-rationals": "number-line",
  "number-line-quest:g7-hop-rationals": "number-line",
  "number-line-quest:g7-hop-place": "number-line",
  "number-line-quest:g7-distance-between": "number-line",
  "number-line-quest:g8-square-roots": "number-line",
  "number-line-quest:g8-cube-roots": "number-line",
  "number-line-quest:g8-scientific-positions": "number-line",
  "number-line-quest:g3-fractions-line": "fractions",
  "number-line-quest:g4-equivalent-positions": "fractions",
  "number-line-quest:g4-frac-dec": "decimals",
  "number-line-quest:g5-zoom-decimals": "decimals",
  "number-line-quest:g5-round-decimals": "decimals",
  "number-line-quest:g5-order-decimals": "decimals",
  // pattern-detective
  "pattern-detective:k-core": "patterns-algebra",
  "pattern-detective:k-count-on": "patterns-algebra",
  "pattern-detective:g1-count-pattern": "patterns-algebra",
  "pattern-detective:g1-grow-shape": "patterns-algebra",
  "pattern-detective:g2-skip": "patterns-algebra",
  "pattern-detective:g2-hundred-chart": "patterns-algebra",
  "pattern-detective:g2-even-odd": "patterns-algebra",
  "pattern-detective:g3-times-table": "patterns-algebra",
  "pattern-detective:g3-arith-rule": "patterns-algebra",
  "pattern-detective:g4-rule-pattern": "patterns-algebra",
  "pattern-detective:g4-shape-nth": "patterns-algebra",
  "pattern-detective:g5-two-rules": "patterns-algebra",
  "pattern-detective:g5-numerical-pattern": "patterns-algebra",
  "pattern-detective:g6-io-table": "patterns-algebra",
  "pattern-detective:g7-linear-eq": "patterns-algebra",
  "pattern-detective:g8-linear-nonlinear": "patterns-algebra",
  "pattern-detective:g8-slope": "patterns-algebra",
  "pattern-detective:g8-exponential": "patterns-algebra",
  "pattern-detective:g6-variables": "equations",
  "pattern-detective:g7-proportional": "ratios-percents",
  "pattern-detective:g7-constant-k": "ratios-percents",
  // ratio-recipe-lab
  "ratio-recipe-lab:more-fewer": "counting-place-value",
  "ratio-recipe-lab:bowls-groups": "multiplication-division",
  "ratio-recipe-lab:share-bowls": "multiplication-division",
  "ratio-recipe-lab:repeat-batch": "multiplication-division",
  "ratio-recipe-lab:times-as-many": "multiplication-division",
  "ratio-recipe-lab:double-half": "ratios-percents",
  "ratio-recipe-lab:scale-whole": "ratios-percents",
  "ratio-recipe-lab:table-100": "ratios-percents",
  "ratio-recipe-lab:graph-pairs": "ratios-percents",
  "ratio-recipe-lab:equiv-ratios": "ratios-percents",
  "ratio-recipe-lab:unit-rate": "ratios-percents",
  "ratio-recipe-lab:percent-per-100": "ratios-percents",
  "ratio-recipe-lab:constant-speed": "ratios-percents",
  "ratio-recipe-lab:stronger-mix": "ratios-percents",
  "ratio-recipe-lab:const-k": "ratios-percents",
  "ratio-recipe-lab:scale-drawing": "ratios-percents",
  "ratio-recipe-lab:percent-prop": "ratios-percents",
  "ratio-recipe-lab:line-origin": "ratios-percents",
  "ratio-recipe-lab:compare-rates": "ratios-percents",
  "ratio-recipe-lab:direct-variation": "ratios-percents",
  "ratio-recipe-lab:fraction-batch": "fractions",
  "ratio-recipe-lab:fraction-scale": "fractions",
  "ratio-recipe-lab:equation-ykx": "equations",
  // math-puzzle-studio
  "math-puzzle-studio:bond-parts": "addition-subtraction",
  "math-puzzle-studio:missing-addend": "addition-subtraction",
  "math-puzzle-studio:grid-sums": "addition-subtraction",
  "math-puzzle-studio:magic-triangle": "addition-subtraction",
  "math-puzzle-studio:magic-square": "addition-subtraction",
  "math-puzzle-studio:factor-grid": "multiplication-division",
  "math-puzzle-studio:kenken": "multiplication-division",
  "math-puzzle-studio:factor-pairs": "multiplication-division",
  "math-puzzle-studio:balance-same": "equations",
  "math-puzzle-studio:equal-sign": "equations",
  "math-puzzle-studio:target-ops": "equations",
  "math-puzzle-studio:equal-forms": "equations",
  "math-puzzle-studio:scale-onestep": "equations",
  "math-puzzle-studio:inequality-scale": "equations",
  "math-puzzle-studio:scale-twostep": "equations",
  "math-puzzle-studio:equiv-expr": "equations",
  "math-puzzle-studio:scale-system": "equations",
  "math-puzzle-studio:scale-both-sides": "equations",
  "math-puzzle-studio:pythag-squares": "geometry-measure",
  // family-math-duel
  "family-math-duel:k-compare": "counting-place-value",
  "family-math-duel:g2-place-number": "counting-place-value",
  "family-math-duel:g4-big-number": "counting-place-value",
  "family-math-duel:g8-scinot": "counting-place-value",
  "family-math-duel:k-make10": "addition-subtraction",
  "family-math-duel:g1-biggest-sum": "addition-subtraction",
  "family-math-duel:g1-closest": "addition-subtraction",
  "family-math-duel:g2-two-digit-sums": "addition-subtraction",
  "family-math-duel:g3-product-war": "multiplication-division",
  "family-math-duel:g3-closest-product": "multiplication-division",
  "family-math-duel:g4-multiply-tens": "multiplication-division",
  "family-math-duel:g8-power": "multiplication-division",
  "family-math-duel:g8-roots": "multiplication-division",
  "family-math-duel:g5-compare-values": "fractions",
  "family-math-duel:g5-near-one": "fractions",
  "family-math-duel:g6-smallest-fraction": "fractions",
  "family-math-duel:g5-decimal-sums": "decimals",
  "family-math-duel:g6-order-of-ops": "equations",
  "family-math-duel:g6-zero-sum": "number-line",
  "family-math-duel:g7-signed-product": "number-line",
  "family-math-duel:g7-percent-of": "ratios-percents",
};

export const topicFor = (gameId, skillId) => SKILL_TOPICS[noteKey(gameId, skillId)] || null;

// The topic of a skill: authored when the table has it, the keyword match only for a skill added after this was written.
export const topicOfSkill = (game, skill) => topicFor(game?.id, skill?.id) || strandKey(skill?.strand, skill?.id, game?.id);
