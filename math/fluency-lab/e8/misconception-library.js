// Structured misconception catalog (Enterprise 8). Each entry says what the learner does, what idea is missing, how to
// show the idea with a model, and which skills to revisit. Entries marked detect:true have a response signature in
// misconception-detectors.js; the others are used by teachers, the repair studio ("I think I did this") and family guidance,
// and are never inferred from a single answer. Nothing here claims research validation: these are common patterns described
// in the mathematics-education literature and reported by classroom teachers, written fresh for this lab.

const b = (en, es) => ({ en, es });

export const DOMAIN_LABELS = {
  number: b("Number sense", "Sentido numérico"),
  operations: b("Operations", "Operaciones"),
  fractions: b("Fractions and decimals", "Fracciones y decimales"),
  ratio: b("Ratios and percent", "Razones y porcentaje"),
  integers: b("Integers", "Enteros"),
  algebra: b("Algebra", "Álgebra"),
  geometry: b("Geometry and measurement", "Geometría y medición"),
  statistics: b("Statistics", "Estadística"),
};

// models: MathVisualEngine ids that show the idea. skills: library skill keys to revisit (nearest prerequisite first).
export const MISCONCEPTIONS = [
  // ---- Number sense
  {
    id: "place-value-digit-as-value",
    domain: "number",
    grades: [1, 5],
    detect: true,
    title: b(
      "Gives the digit instead of its value",
      "Da el dígito en lugar de su valor",
    ),
    does: b(
      "Asked for the value of the 4 in 345, says 4.",
      "Si le piden el valor del 4 en 345, dice 4.",
    ),
    idea: b(
      "A digit's value depends on its place: the 4 in 345 is 4 tens, or 40.",
      "El valor de un dígito depende de su lugar: el 4 en 345 son 4 decenas, es decir 40.",
    ),
    counter: b(
      "Show 345 with blocks: the 4 is four tens rods, not four ones.",
      "Muestra 345 con bloques: el 4 son cuatro barras de decenas, no cuatro unidades.",
    ),
    models: ["baseTen"],
    skills: ["1:tens-ones", "2:place-1000"],
  },
  {
    id: "counting-off-by-one",
    domain: "number",
    grades: [0, 2],
    detect: true,
    title: b("Counts one too many or too few", "Cuenta uno de más o de menos"),
    does: b(
      "Starts the count on the first number instead of after it, or skips the last.",
      "Empieza a contar en el primer número en vez de después de él, o se salta el último.",
    ),
    idea: b(
      "Counting on starts with the next number; each object is touched exactly once.",
      "Contar hacia adelante empieza con el número siguiente; cada objeto se toca una sola vez.",
    ),
    counter: b(
      "Hop along a number line and say the landing spot, not the start.",
      "Salta por una recta numérica y di dónde caes, no de dónde sales.",
    ),
    models: ["numberLine", "hundredsChart"],
    skills: ["0:count-forward", "1:count-patterns"],
  },
  {
    id: "magnitude-longer-is-larger",
    domain: "number",
    grades: [2, 5],
    detect: false,
    title: b(
      "Thinks the number with more digits after the point is larger",
      "Piensa que el número con más dígitos después del punto es mayor",
    ),
    does: b(
      "Says 0.45 is greater than 0.6 because 45 is greater than 6.",
      "Dice que 0,45 es mayor que 0,6 porque 45 es mayor que 6.",
    ),
    idea: b(
      "Compare place by place from the left: 0.6 is 6 tenths, 0.45 is only 4 tenths and a bit.",
      "Compara lugar por lugar desde la izquierda: 0,6 son 6 décimas y 0,45 son solo 4 décimas y un poco.",
    ),
    counter: b(
      "Shade both on a decimal grid and see which covers more.",
      "Sombrea ambos en una cuadrícula decimal y mira cuál cubre más.",
    ),
    models: ["decimalGrid"],
    skills: ["5:decimal-place"],
  },
  {
    id: "rounding-always-down",
    domain: "number",
    grades: [3, 4],
    detect: true,
    title: b("Always rounds down", "Siempre redondea hacia abajo"),
    does: b(
      "Rounds 997 to the nearest hundred and says 900.",
      "Redondea 997 a la centena más cercana y dice 900.",
    ),
    idea: b(
      "Round to the closer benchmark; at the halfway point round up.",
      "Se redondea al valor de referencia más cercano; en la mitad se redondea hacia arriba.",
    ),
    counter: b(
      "Mark 997 on a number line between 900 and 1,000: it sits right next to 1,000.",
      "Marca 997 en una recta numérica entre 900 y 1.000: está pegado a 1.000.",
    ),
    models: ["numberLine"],
    skills: ["3:round"],
  },
  // ---- Operations
  {
    id: "addition-no-regroup",
    domain: "operations",
    grades: [1, 4],
    detect: true,
    title: b("Does not carry", "No lleva"),
    does: b(
      "Writes 12 in the ones column of 38 + 24 and forgets the carried ten (answers 512 or 52).",
      "Escribe 12 en la columna de las unidades de 38 + 24 y olvida llevar la decena.",
    ),
    idea: b(
      "Ten ones make one ten, which moves to the tens column.",
      "Diez unidades forman una decena, que pasa a la columna de las decenas.",
    ),
    counter: b(
      "Trade ten ones for a ten with blocks and see the total stay the same.",
      "Cambia diez unidades por una decena con bloques y mira que el total no cambia.",
    ),
    models: ["baseTen"],
    skills: ["2:place-1000", "2:add-100"],
  },
  {
    id: "subtract-smaller-from-larger",
    domain: "operations",
    grades: [2, 4],
    detect: true,
    title: b(
      "Subtracts the smaller digit from the larger",
      "Resta el dígito menor del mayor",
    ),
    does: b(
      "In 52 − 27 writes 35 (5 − 2 = 3, 7 − 2 = 5).",
      "En 52 − 27 escribe 35 (5 − 2 = 3, 7 − 2 = 5).",
    ),
    idea: b(
      "Subtraction is not commutative: when the top digit is smaller, regroup from the next place.",
      "La resta no es conmutativa: si el dígito de arriba es menor, se reagrupa del lugar siguiente.",
    ),
    counter: b(
      "Break a ten into ten ones with blocks, then take 7 away.",
      "Separa una decena en diez unidades con bloques y quita 7.",
    ),
    models: ["baseTen"],
    skills: ["2:subtract-100", "2:place-1000"],
  },
  {
    id: "operation-swap",
    domain: "operations",
    grades: [1, 8],
    detect: true,
    title: b("Uses the opposite operation", "Usa la operación contraria"),
    does: b(
      "Adds when asked to subtract, or multiplies when asked to divide.",
      "Suma cuando se pide restar, o multiplica cuando se pide dividir.",
    ),
    idea: b(
      "Read the operation sign, and use the story to decide what is joined, taken away, shared or grouped.",
      "Lee el signo de la operación y usa la historia para decidir qué se junta, se quita, se reparte o se agrupa.",
    ),
    counter: b(
      "Act the problem out with counters: do they come together or go away?",
      "Representa el problema con fichas: ¿se juntan o se van?",
    ),
    models: ["numberBond", "factFamily"],
    skills: ["0:add-sub-5", "3:division-facts"],
  },
  {
    id: "missing-addend-adds",
    domain: "operations",
    grades: [1, 2],
    detect: true,
    title: b(
      "Adds the numbers in a missing-addend problem",
      "Suma los números en un problema de sumando que falta",
    ),
    does: b("For 5 + □ = 12 writes 17.", "En 5 + □ = 12 escribe 17."),
    idea: b(
      "The total is already given; the box is the part that is missing, found by taking away.",
      "El total ya está dado; el cuadro es la parte que falta, que se halla quitando.",
    ),
    counter: b(
      "Show 12 on a number bond with one part 5: what goes in the other part?",
      "Muestra 12 en un enlace numérico con una parte de 5: ¿qué va en la otra parte?",
    ),
    models: ["numberBond"],
    skills: ["1:missing-addend"],
  },
  {
    id: "multiply-adds",
    domain: "operations",
    grades: [3, 5],
    detect: true,
    title: b("Adds instead of multiplying", "Suma en lugar de multiplicar"),
    does: b("For 7 × 6 writes 13.", "En 7 × 6 escribe 13."),
    idea: b(
      "Multiplication counts equal groups: 7 groups of 6, not 7 and 6 together.",
      "La multiplicación cuenta grupos iguales: 7 grupos de 6, no 7 y 6 juntos.",
    ),
    counter: b(
      "Build 7 rows of 6 in an array and count them all.",
      "Construye 7 filas de 6 en una matriz y cuéntalas todas.",
    ),
    models: ["array"],
    skills: ["3:mul-0-5"],
  },
  {
    id: "multi-digit-no-placeholder",
    domain: "operations",
    grades: [4, 5],
    detect: true,
    title: b("Forgets the zero placeholder", "Olvida el cero de relleno"),
    does: b(
      "In 74 × 13 adds 222 and 74 instead of 222 and 740.",
      "En 74 × 13 suma 222 y 74 en lugar de 222 y 740.",
    ),
    idea: b(
      "The 1 in 13 is one ten, so its partial product is ten times as large.",
      "El 1 de 13 es una decena, así que su producto parcial es diez veces mayor.",
    ),
    counter: b(
      "Use the area model: the 10 × 74 piece is a whole ten times wider.",
      "Usa el modelo de área: la parte de 10 × 74 es diez veces más ancha.",
    ),
    models: ["areaMultiply"],
    skills: ["4:multiply-1digit"],
  },
  {
    id: "division-multiplies",
    domain: "operations",
    grades: [3, 5],
    detect: true,
    title: b(
      "Multiplies when asked to divide",
      "Multiplica cuando se pide dividir",
    ),
    does: b("For 36 ÷ 4 writes 144.", "En 36 ÷ 4 escribe 144."),
    idea: b(
      "Division shares into equal groups, so the answer is smaller than the total.",
      "Dividir reparte en grupos iguales, así que la respuesta es menor que el total.",
    ),
    counter: b(
      "Share 36 counters into 4 groups with a fact-family triangle.",
      "Reparte 36 fichas en 4 grupos con un triángulo de familia de operaciones.",
    ),
    models: ["factFamily", "array"],
    skills: ["3:division-facts"],
  },
  {
    id: "order-of-operations-left-to-right",
    domain: "operations",
    grades: [5, 8],
    detect: false,
    title: b(
      "Computes strictly left to right",
      "Calcula siempre de izquierda a derecha",
    ),
    does: b("Calculates 3 + 4 × 2 as 14.", "Calcula 3 + 4 × 2 como 14."),
    idea: b(
      "Multiplication and division bind more tightly than addition and subtraction.",
      "La multiplicación y la división se agrupan antes que la suma y la resta.",
    ),
    counter: b(
      "Draw 3 and then 4 groups of 2: that is 3 + 8.",
      "Dibuja 3 y luego 4 grupos de 2: eso es 3 + 8.",
    ),
    models: ["array", "algebraTiles"],
    skills: ["6:evaluate"],
  },
  // ---- Fractions
  {
    id: "fraction-add-denominators",
    domain: "fractions",
    grades: [4, 7],
    detect: true,
    title: b(
      "Adds the numerators and the denominators",
      "Suma numeradores y denominadores",
    ),
    does: b("Writes 1/3 + 1/4 = 2/7.", "Escribe 1/3 + 1/4 = 2/7."),
    idea: b(
      "The denominator names the size of the parts; parts of different sizes cannot be counted together until they are cut the same.",
      "El denominador nombra el tamaño de las partes; partes de distinto tamaño no se pueden contar juntas hasta cortarlas iguales.",
    ),
    counter: b(
      "Shade 1/3 and 1/4 on bars: 2/7 would be a different length than both together.",
      "Sombrea 1/3 y 1/4 en barras: 2/7 sería de otra longitud que ambas juntas.",
    ),
    models: ["fractionOps", "fractionBar"],
    skills: ["4:fraction-equiv", "5:fraction-add"],
  },
  {
    id: "fraction-equivalent-add",
    domain: "fractions",
    grades: [3, 5],
    detect: true,
    title: b(
      "Adds instead of multiplying to make an equivalent fraction",
      "Suma en lugar de multiplicar para hallar una fracción equivalente",
    ),
    does: b(
      "For 1/2 = □/6 writes 5 (added 4 to both).",
      "En 1/2 = □/6 escribe 5 (sumó 4 a ambos).",
    ),
    idea: b(
      "Equivalent fractions come from multiplying or dividing the numerator and denominator by the same number.",
      "Las fracciones equivalentes salen de multiplicar o dividir numerador y denominador por el mismo número.",
    ),
    counter: b(
      "Cut every half into 3 on a fraction bar and count the shaded pieces.",
      "Corta cada mitad en 3 en una barra de fracciones y cuenta las partes sombreadas.",
    ),
    models: ["fractionBar", "fractionWall"],
    skills: ["3:fraction-equivalence", "4:fraction-equiv"],
  },
  {
    id: "fraction-bigger-denominator-bigger",
    domain: "fractions",
    grades: [3, 5],
    detect: true,
    title: b(
      "Thinks a bigger denominator means a bigger fraction",
      "Piensa que un denominador mayor es una fracción mayor",
    ),
    does: b(
      "Says 1/8 is greater than 1/3 because 8 is greater than 3.",
      "Dice que 1/8 es mayor que 1/3 porque 8 es mayor que 3.",
    ),
    idea: b(
      "More equal parts make each part smaller.",
      "Más partes iguales hacen cada parte más pequeña.",
    ),
    counter: b(
      "Line up 1/3 and 1/8 on a fraction wall.",
      "Alinea 1/3 y 1/8 en un muro de fracciones.",
    ),
    models: ["fractionWall", "fractionBar"],
    skills: ["3:fraction-compare"],
  },
  {
    id: "fraction-of-divides-by-numerator",
    domain: "fractions",
    grades: [4, 6],
    detect: true,
    title: b(
      "Divides by the numerator when finding a fraction of a number",
      "Divide entre el numerador al hallar una fracción de un número",
    ),
    does: b(
      "For 3/4 of 20 divides 20 by 3.",
      "En 3/4 de 20 divide 20 entre 3.",
    ),
    idea: b(
      "Divide by the denominator to find one part, then multiply by the numerator.",
      "Divide entre el denominador para hallar una parte y multiplica por el numerador.",
    ),
    counter: b(
      "Cut 20 into 4 equal parts and take 3 of them.",
      "Corta 20 en 4 partes iguales y toma 3.",
    ),
    models: ["fractionBar"],
    skills: ["5:fraction-of"],
  },
  {
    id: "fraction-whole-number-reasoning",
    domain: "fractions",
    grades: [3, 7],
    detect: false,
    title: b(
      "Treats the numerator and denominator as two separate whole numbers",
      "Trata numerador y denominador como dos enteros separados",
    ),
    does: b(
      "Thinks 3/5 is bigger than 3/4 because 5 is bigger than 4, or multiplies fractions as if they always make bigger numbers.",
      "Piensa que 3/5 es mayor que 3/4 porque 5 es mayor que 4, o cree que al multiplicar fracciones siempre resultan números mayores.",
    ),
    idea: b(
      "A fraction is one number, a quantity, with its own place on the number line.",
      "Una fracción es un solo número, una cantidad, con su propio lugar en la recta numérica.",
    ),
    counter: b(
      "Place both fractions on the same number line.",
      "Ubica ambas fracciones en la misma recta numérica.",
    ),
    models: ["fractionBar", "numberLine"],
    skills: ["3:fraction-compare"],
  },
  // ---- Decimals
  {
    id: "decimal-align-right",
    domain: "fractions",
    grades: [5, 6],
    detect: true,
    title: b(
      "Lines decimals up on the right instead of by place value",
      "Alinea los decimales a la derecha en vez de por valor posicional",
    ),
    does: b(
      "Adds 1.8 and 1.25 as if the last digits line up: 1.43.",
      "Suma 1,8 y 1,25 como si los últimos dígitos se alinearan: 1,43.",
    ),
    idea: b(
      "Add tenths to tenths and hundredths to hundredths: line up the decimal points.",
      "Suma décimas con décimas y centésimas con centésimas: alinea los puntos decimales.",
    ),
    counter: b(
      "Shade 1.8 and 1.25 on grids and combine them.",
      "Sombrea 1,8 y 1,25 en cuadrículas y júntalos.",
    ),
    models: ["decimalGrid"],
    skills: ["5:decimal-place", "5:decimal-add"],
  },
  {
    id: "decimal-product-point",
    domain: "fractions",
    grades: [5, 6],
    detect: true,
    title: b(
      "Puts the decimal point in the wrong place in a product",
      "Coloca mal el punto decimal en un producto",
    ),
    does: b(
      "Multiplies 7.2 × 0.4 and writes 28.8 or 0.288.",
      "Multiplica 7,2 × 0,4 y escribe 28,8 o 0,288.",
    ),
    idea: b(
      "Estimate to place the point: 7 × 0.4 is about 3, so the answer is 2.88.",
      "Estima para colocar el punto: 7 × 0,4 es cerca de 3, así que la respuesta es 2,88.",
    ),
    counter: b(
      "Overlap tenths on a grid: tenths of tenths are hundredths.",
      "Superpón décimas en una cuadrícula: décimas de décimas son centésimas.",
    ),
    models: ["decimalProduct"],
    skills: ["5:decimal-mul"],
  },
  // ---- Ratios and percent
  {
    id: "ratio-additive",
    domain: "ratio",
    grades: [6, 7],
    detect: true,
    title: b(
      "Adds instead of scaling a ratio",
      "Suma en lugar de escalar una razón",
    ),
    does: b(
      "For 2:3 = 6:□ writes 7 (added 4 to both).",
      "En 2:3 = 6:□ escribe 7 (sumó 4 a ambos).",
    ),
    idea: b(
      "Equal ratios multiply both quantities by the same factor, not add the same amount.",
      "Las razones iguales multiplican ambas cantidades por el mismo factor, no suman la misma cantidad.",
    ),
    counter: b(
      "Make copies of the 2:3 tape and read the table.",
      "Haz copias de la cinta 2:3 y lee la tabla.",
    ),
    models: ["tapeRatio"],
    skills: ["6:ratios"],
  },
  {
    id: "ratio-reversed",
    domain: "ratio",
    grades: [6, 7],
    detect: false,
    title: b(
      "Reverses the order of a ratio or rate",
      "Invierte el orden de una razón o tasa",
    ),
    does: b(
      "Writes the ratio of blue to red when asked red to blue, or divides miles by hours when asked hours per mile.",
      "Escribe la razón de azules a rojas cuando se pide rojas a azules.",
    ),
    idea: b(
      "The order of the words is the order of the numbers.",
      "El orden de las palabras es el orden de los números.",
    ),
    counter: b(
      "Label each row of the tape diagram with what it counts.",
      "Rotula cada fila del diagrama de cinta con lo que cuenta.",
    ),
    models: ["tapeRatio"],
    skills: ["6:unit-rates"],
  },
  {
    id: "percent-skips-divide-100",
    domain: "ratio",
    grades: [6, 7],
    detect: true,
    title: b(
      "Multiplies by the percent without dividing by 100",
      "Multiplica por el porcentaje sin dividir entre 100",
    ),
    does: b("For 25% of 60 writes 1,500.", "En 25% de 60 escribe 1.500."),
    idea: b("25% is 25 out of 100, or 0.25.", "25% es 25 de cada 100, o 0,25."),
    counter: b(
      "Mark 25% on a percent bar: it is a quarter, so the part is smaller than the whole.",
      "Marca 25% en una barra de porcentaje: es un cuarto, así que la parte es menor que el todo.",
    ),
    models: ["percentBar"],
    skills: ["6:percent"],
  },
  {
    id: "percent-inverts",
    domain: "ratio",
    grades: [6, 7],
    detect: true,
    title: b(
      "Divides the whole by the percent",
      "Divide el total entre el porcentaje",
    ),
    does: b(
      "For 25% of 60 writes 60 ÷ 25 = 2.4.",
      "En 25% de 60 escribe 60 ÷ 25 = 2,4.",
    ),
    idea: b(
      "Find the part by taking that fraction of the whole.",
      "La parte se halla tomando esa fracción del total.",
    ),
    counter: b(
      "A quarter of 60 must be bigger than 2.4: check the bar.",
      "Un cuarto de 60 debe ser mayor que 2,4: mira la barra.",
    ),
    models: ["percentBar"],
    skills: ["6:percent"],
  },
  {
    id: "percent-change-direction",
    domain: "ratio",
    grades: [7, 8],
    detect: true,
    title: b(
      "Adds the percent as a number instead of taking a percent of the amount",
      "Suma el porcentaje como número en lugar de tomar un porcentaje de la cantidad",
    ),
    does: b(
      "For 80 with a 25% decrease writes 55.",
      "En 80 con una disminución del 25% escribe 55.",
    ),
    idea: b(
      "A percent change is a percent of the starting amount.",
      "Un cambio porcentual es un porcentaje de la cantidad inicial.",
    ),
    counter: b(
      "Find 25% of 80, then take that away.",
      "Halla 25% de 80 y réstalo.",
    ),
    models: ["percentBar"],
    skills: ["6:percent", "7:percent-change"],
  },
  // ---- Integers
  {
    id: "integer-sign-flip",
    domain: "integers",
    grades: [6, 8],
    detect: true,
    title: b(
      "Gets the size right but the sign wrong",
      "Acierta el tamaño pero se equivoca en el signo",
    ),
    does: b("Computes −7 + 3 as 4.", "Calcula −7 + 3 como 4."),
    idea: b(
      "The number with the larger distance from zero decides the sign.",
      "El número con mayor distancia a cero decide el signo.",
    ),
    counter: b(
      "Hop on a number line from −7 three steps right.",
      "Salta en una recta numérica desde −7 tres pasos a la derecha.",
    ),
    models: ["numberLine", "integerChips"],
    skills: ["6:integers", "7:integer-add"],
  },
  {
    id: "integer-subtract-negative",
    domain: "integers",
    grades: [7, 8],
    detect: true,
    title: b(
      "Treats subtracting a negative like subtracting a positive",
      "Trata restar un negativo como restar un positivo",
    ),
    does: b("Computes 5 − (−3) as 2.", "Calcula 5 − (−3) como 2."),
    idea: b(
      "Subtracting a negative is adding its opposite.",
      "Restar un negativo es sumar su opuesto.",
    ),
    counter: b(
      "Add zero pairs, then take away negative chips: the total goes up.",
      "Agrega pares cero y quita fichas negativas: el total sube.",
    ),
    models: ["integerChips"],
    skills: ["7:integer-add"],
  },
  {
    id: "absolute-value-negative",
    domain: "integers",
    grades: [6, 7],
    detect: true,
    title: b(
      "Thinks absolute value keeps the negative sign",
      "Piensa que el valor absoluto conserva el signo negativo",
    ),
    does: b("Says |−5| = −5.", "Dice que |−5| = −5."),
    idea: b(
      "Absolute value is distance from zero, which is never negative.",
      "El valor absoluto es la distancia a cero, que nunca es negativa.",
    ),
    counter: b(
      "Count the steps from −5 to 0 on a number line.",
      "Cuenta los pasos de −5 a 0 en una recta numérica.",
    ),
    models: ["numberLine"],
    skills: ["6:integers"],
  },
  {
    id: "integer-order",
    domain: "integers",
    grades: [6, 7],
    detect: false,
    title: b(
      "Orders negative numbers by size of the digits",
      "Ordena los negativos por el tamaño de sus dígitos",
    ),
    does: b("Says −7 is greater than −3.", "Dice que −7 es mayor que −3."),
    idea: b(
      "Further left on the number line means smaller.",
      "Más a la izquierda en la recta numérica significa menor.",
    ),
    counter: b(
      "Plot both on a number line.",
      "Ubica ambos en una recta numérica.",
    ),
    models: ["numberLine"],
    skills: ["6:integers"],
  },
  // ---- Algebra
  {
    id: "equation-inverse-wrong",
    domain: "algebra",
    grades: [6, 8],
    detect: true,
    title: b(
      "Uses the same operation instead of the inverse",
      "Usa la misma operación en vez de la inversa",
    ),
    does: b("For x + 5 = 12 writes 17.", "En x + 5 = 12 escribe 17."),
    idea: b(
      "To undo an operation, use its opposite on both sides.",
      "Para deshacer una operación se usa su opuesta en ambos lados.",
    ),
    counter: b(
      "Take 5 from both sides of the balance scale.",
      "Quita 5 de ambos lados de la balanza.",
    ),
    models: ["balanceScale"],
    skills: ["6:one-step"],
  },
  {
    id: "equation-skips-constant",
    domain: "algebra",
    grades: [7, 8],
    detect: true,
    title: b(
      "Skips the constant and divides only by the coefficient",
      "Se salta la constante y divide solo entre el coeficiente",
    ),
    does: b("For 5x + 3 = 68 writes 68 ÷ 5.", "En 5x + 3 = 68 escribe 68 ÷ 5."),
    idea: b(
      "Undo addition or subtraction first, then undo multiplication.",
      "Primero se deshace la suma o la resta y luego la multiplicación.",
    ),
    counter: b(
      "Subtract 3 from both sides before dividing.",
      "Resta 3 de ambos lados antes de dividir.",
    ),
    models: ["balanceScale"],
    skills: ["6:one-step", "7:equations"],
  },
  {
    id: "coefficient-multiplies",
    domain: "algebra",
    grades: [6, 7],
    detect: true,
    title: b(
      "Multiplies by the coefficient instead of dividing",
      "Multiplica por el coeficiente en vez de dividir",
    ),
    does: b("For 9x = 18 writes 162.", "En 9x = 18 escribe 162."),
    idea: b(
      "9x means 9 times x; undo it by dividing by 9.",
      "9x significa 9 por x; se deshace dividiendo entre 9.",
    ),
    counter: b(
      "Share 18 among 9 equal groups on the scale.",
      "Reparte 18 entre 9 grupos iguales en la balanza.",
    ),
    models: ["balanceScale", "algebraTiles"],
    skills: ["6:one-step"],
  },
  {
    id: "equal-sign-means-answer",
    domain: "algebra",
    grades: [1, 8],
    detect: false,
    title: b(
      "Reads the equal sign as 'the answer comes next'",
      "Lee el signo igual como 'ahora viene la respuesta'",
    ),
    does: b(
      "Writes 3 + 4 = 7 + 2 = 9, or does not accept 7 = 3 + 4.",
      "Escribe 3 + 4 = 7 + 2 = 9, o no acepta 7 = 3 + 4.",
    ),
    idea: b(
      "The equal sign says both sides have the same value.",
      "El signo igual dice que ambos lados tienen el mismo valor.",
    ),
    counter: b(
      "Put 3 + 4 on one pan and 7 on the other and watch them balance.",
      "Pon 3 + 4 en un platillo y 7 en el otro y mira cómo se equilibran.",
    ),
    models: ["balanceScale"],
    skills: ["1:missing-addend"],
  },
  {
    id: "distribute-first-term-only",
    domain: "algebra",
    grades: [7, 8],
    detect: false,
    title: b(
      "Distributes to the first term only",
      "Distribuye solo al primer término",
    ),
    does: b("Writes 3(x + 4) = 3x + 4.", "Escribe 3(x + 4) = 3x + 4."),
    idea: b(
      "Multiplying by 3 applies to every term inside.",
      "Multiplicar por 3 se aplica a todos los términos de adentro.",
    ),
    counter: b(
      "Draw 3 groups of x + 4 with tiles.",
      "Dibuja 3 grupos de x + 4 con fichas.",
    ),
    models: ["algebraTiles", "areaMultiply"],
    skills: ["6:evaluate"],
  },
  {
    id: "combine-unlike-terms",
    domain: "algebra",
    grades: [6, 8],
    detect: false,
    title: b("Combines unlike terms", "Combina términos no semejantes"),
    does: b("Writes 2x + 3 = 5x.", "Escribe 2x + 3 = 5x."),
    idea: b(
      "Only terms of the same kind can be combined: x tiles with x tiles, ones with ones.",
      "Solo se combinan términos de la misma clase: fichas x con fichas x, unidades con unidades.",
    ),
    counter: b(
      "Try to merge x tiles and unit tiles: they do not fit together.",
      "Intenta juntar fichas x y fichas unidad: no encajan.",
    ),
    models: ["algebraTiles"],
    skills: ["6:evaluate"],
  },
  {
    id: "slope-flipped",
    domain: "algebra",
    grades: [8, 8],
    detect: true,
    title: b("Writes run over rise", "Escribe avance sobre elevación"),
    does: b(
      "Finds the slope through two points as run ÷ rise.",
      "Halla la pendiente por dos puntos como avance ÷ elevación.",
    ),
    idea: b(
      "Slope is how much y changes for each 1 step in x: rise over run.",
      "La pendiente es cuánto cambia y por cada paso de 1 en x: elevación sobre avance.",
    ),
    counter: b(
      "Move the point along the line and watch how much y rises for one step right.",
      "Mueve el punto por la recta y mira cuánto sube y por un paso a la derecha.",
    ),
    models: ["linearGraph"],
    skills: ["8:slope"],
  },
  {
    id: "exponent-times-base",
    domain: "algebra",
    grades: [8, 8],
    detect: true,
    title: b(
      "Multiplies the base by the exponent",
      "Multiplica la base por el exponente",
    ),
    does: b("Computes 7^4 as 28.", "Calcula 7^4 como 28."),
    idea: b(
      "An exponent says how many times the base is a factor.",
      "Un exponente dice cuántas veces la base es un factor.",
    ),
    counter: b(
      "Write 7 × 7 × 7 × 7 and multiply.",
      "Escribe 7 × 7 × 7 × 7 y multiplica.",
    ),
    models: ["array"],
    skills: ["8:exponents"],
  },
  {
    id: "square-root-halves",
    domain: "algebra",
    grades: [8, 8],
    detect: true,
    title: b(
      "Halves the number to find a square root",
      "Divide entre 2 para hallar una raíz cuadrada",
    ),
    does: b("Computes √196 as 98.", "Calcula √196 como 98."),
    idea: b(
      "A square root is the side of a square with that area.",
      "Una raíz cuadrada es el lado de un cuadrado con esa área.",
    ),
    counter: b(
      "Which side length squared gives 196? Try it on a grid.",
      "¿Qué lado al cuadrado da 196? Pruébalo en una cuadrícula.",
    ),
    models: ["areaPerimeter"],
    skills: ["8:square-roots"],
  },
  // ---- Geometry and measurement
  {
    id: "area-perimeter-confusion",
    domain: "geometry",
    grades: [3, 5],
    detect: true,
    title: b("Confuses area and perimeter", "Confunde área y perímetro"),
    does: b(
      "Adds the sides when asked for area, or multiplies them when asked for perimeter.",
      "Suma los lados cuando se pide el área, o los multiplica cuando se pide el perímetro.",
    ),
    idea: b(
      "Area counts squares inside; perimeter measures the distance around.",
      "El área cuenta los cuadrados de adentro; el perímetro mide la distancia alrededor.",
    ),
    counter: b(
      "Shade the squares for area and trace the edge for perimeter.",
      "Sombrea los cuadrados para el área y recorre el borde para el perímetro.",
    ),
    models: ["areaPerimeter"],
    skills: ["3:area", "3:perimeter"],
  },
  {
    id: "triangle-height-slant",
    domain: "geometry",
    grades: [6, 7],
    detect: false,
    title: b(
      "Uses the slanted side as the height",
      "Usa el lado inclinado como altura",
    ),
    does: b(
      "Multiplies base by the slanted side length.",
      "Multiplica la base por el lado inclinado.",
    ),
    idea: b(
      "Height is the perpendicular distance from the base to the opposite corner.",
      "La altura es la distancia perpendicular de la base al vértice opuesto.",
    ),
    counter: b(
      "Slide the top corner: the height, and the area, do not change.",
      "Desliza el vértice superior: la altura, y el área, no cambian.",
    ),
    models: ["triangleArea"],
    skills: ["6:triangle-area"],
  },
  {
    id: "triangle-forgets-half",
    domain: "geometry",
    grades: [6, 6],
    detect: false,
    title: b(
      "Forgets the one half in a triangle's area",
      "Olvida la mitad en el área de un triángulo",
    ),
    does: b(
      "Uses base × height for a triangle.",
      "Usa base × altura para un triángulo.",
    ),
    idea: b(
      "Two triangles make a parallelogram, so one triangle is half.",
      "Dos triángulos forman un paralelogramo, así que un triángulo es la mitad.",
    ),
    counter: b(
      "Fit two copies of the triangle together.",
      "Une dos copias del triángulo.",
    ),
    models: ["triangleArea"],
    skills: ["6:triangle-area"],
  },
  {
    id: "volume-surface-area",
    domain: "geometry",
    grades: [5, 7],
    detect: false,
    title: b(
      "Confuses volume and surface area",
      "Confunde volumen y área de superficie",
    ),
    does: b(
      "Adds the areas of faces when asked for volume.",
      "Suma las áreas de las caras cuando se pide el volumen.",
    ),
    idea: b(
      "Volume counts cubes that fill the inside; surface area covers the outside.",
      "El volumen cuenta cubos que llenan el interior; el área de superficie cubre el exterior.",
    ),
    counter: b(
      "Fill a prism with unit cubes, then unfold its net.",
      "Llena un prisma con cubos unidad y luego despliega su red.",
    ),
    models: ["prismVolume", "netSurface"],
    skills: ["5:volume"],
  },
  {
    id: "unit-conversion-direction",
    domain: "geometry",
    grades: [4, 7],
    detect: true,
    title: b(
      "Multiplies when the conversion should divide (or the reverse)",
      "Multiplica cuando la conversión debe dividir (o al revés)",
    ),
    does: b(
      "Changes 360 minutes to hours and gets 21,600.",
      "Convierte 360 minutos a horas y obtiene 21.600.",
    ),
    idea: b(
      "Smaller units need more of them to make the same length of time.",
      "Las unidades más pequeñas necesitan más cantidad para el mismo tiempo.",
    ),
    counter: b(
      "Use a double number line with hours above minutes.",
      "Usa una doble recta numérica con horas arriba y minutos abajo.",
    ),
    models: ["tapeRatio", "numberLine"],
    skills: ["4:unit-conversion"],
  },
  {
    id: "units-dropped",
    domain: "geometry",
    grades: [3, 8],
    detect: false,
    title: b("Leaves out or mixes up units", "Omite o confunde las unidades"),
    does: b(
      "Writes 12 for an area in square feet, or mixes inches and feet.",
      "Escribe 12 para un área en pies cuadrados, o mezcla pulgadas y pies.",
    ),
    idea: b(
      "A measurement is a number and a unit; area uses square units, volume cubic units.",
      "Una medida es un número y una unidad; el área usa unidades cuadradas y el volumen unidades cúbicas.",
    ),
    counter: b(
      "Count square tiles for area and cubes for volume.",
      "Cuenta baldosas cuadradas para el área y cubos para el volumen.",
    ),
    models: ["areaPerimeter", "prismVolume"],
    skills: ["3:area"],
  },
  // ---- Statistics
  {
    id: "median-unsorted",
    domain: "statistics",
    grades: [6, 7],
    detect: false,
    title: b(
      "Takes the middle of the list without ordering it",
      "Toma el valor del medio sin ordenar la lista",
    ),
    does: b(
      "Says the median of 9, 2, 7, 4, 5 is 7.",
      "Dice que la mediana de 9, 2, 7, 4, 5 es 7.",
    ),
    idea: b(
      "Put the data in order first; the median is the middle of the ordered list.",
      "Primero se ordenan los datos; la mediana es el valor del medio de la lista ordenada.",
    ),
    counter: b(
      "Drag the dots into order on the dot plot.",
      "Ordena los puntos en el diagrama de puntos.",
    ),
    models: ["dotPlot"],
    skills: ["2:interpret-data"],
  },
  {
    id: "mean-is-a-data-point",
    domain: "statistics",
    grades: [6, 7],
    detect: false,
    title: b(
      "Thinks the mean must be one of the data values",
      "Piensa que la media debe ser uno de los datos",
    ),
    does: b(
      "Says the mean of 2, 3 and 7 must be 2, 3 or 7.",
      "Dice que la media de 2, 3 y 7 debe ser 2, 3 o 7.",
    ),
    idea: b(
      "The mean is the fair share or balance point; it can fall between values.",
      "La media es el reparto equitativo o punto de equilibrio; puede quedar entre los valores.",
    ),
    counter: b(
      "Balance the dots on a seesaw: where does it tip level?",
      "Equilibra los puntos en un balancín: ¿dónde queda nivelado?",
    ),
    models: ["dotPlot"],
    skills: ["2:interpret-data"],
  },
  {
    id: "graph-scale-misread",
    domain: "statistics",
    grades: [3, 8],
    detect: false,
    title: b(
      "Reads a graph as if every gridline counts by one",
      "Lee una gráfica como si cada línea contara de uno en uno",
    ),
    does: b(
      "Reads a bar that reaches the second line as 2 when the lines count by 5.",
      "Lee como 2 una barra que llega a la segunda línea cuando las líneas cuentan de 5 en 5.",
    ),
    idea: b(
      "Read the labels on the axis before reading the bars.",
      "Lee los rótulos del eje antes de leer las barras.",
    ),
    counter: b(
      "Change the bin width on a histogram and compare.",
      "Cambia el ancho de los intervalos en un histograma y compara.",
    ),
    models: ["histogram", "dotPlot"],
    skills: ["2:interpret-data"],
  },
  {
    id: "association-is-causation",
    domain: "statistics",
    grades: [8, 8],
    detect: false,
    title: b(
      "Concludes that one variable causes the other",
      "Concluye que una variable causa la otra",
    ),
    does: b(
      "Says a rising scatter plot proves that more of x makes more of y.",
      "Dice que un diagrama de dispersión ascendente prueba que más x produce más y.",
    ),
    idea: b(
      "A pattern shows association; other causes may explain it.",
      "Un patrón muestra asociación; otras causas pueden explicarlo.",
    ),
    counter: b(
      "Name another reason both could rise together.",
      "Nombra otra razón por la que ambos podrían subir juntos.",
    ),
    models: ["scatterPlot"],
    skills: ["8:association"],
  },
];

export const misconceptionById = (id) =>
  MISCONCEPTIONS.find((m) => m.id === id) || null;
export const misconceptionsForSkill = (key) =>
  MISCONCEPTIONS.filter((m) => m.skills.includes(key));
export const misconceptionsForDomain = (domain) =>
  MISCONCEPTIONS.filter((m) => m.domain === domain);
