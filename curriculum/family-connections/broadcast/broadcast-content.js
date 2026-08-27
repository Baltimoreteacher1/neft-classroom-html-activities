/* =============================================================================
 * Family Weekly Broadcast — shared content module (single source of truth)
 * -----------------------------------------------------------------------------
 * Imported by BOTH:
 *   - functions/api/family-broadcast.js  (Pages Function, bundled at deploy —
 *     same cross-directory import pattern already used by
 *     functions/api/family-connections/[[path]].js)
 *   - curriculum/family-connections/broadcast/broadcast.js (browser ES module)
 *
 * so the endpoint and the offline page can never drift. Everything here is
 * curriculum content: standards, real asset links, the misconception tag table
 * and the kitchen-table activity bank. NOTHING here is student data.
 *
 * WHY THE DATA IS INLINE RATHER THAN READ FROM /data/*.json
 *   Pages Functions cannot read repo data files at runtime (see the same note
 *   in functions/api/class-pulse.js). tools/validate-family-broadcast.mjs
 *   asserts this table stays in step with data/misconception-labels.json.
 *
 * LANGUAGE RULES (enforced by the validator)
 *   - Every family-facing string exists in English AND Spanish. Spanish is a
 *     real translation, never the English string reused.
 *   - Spanish uses the formal "usted" voice already used across
 *     curriculum/family-connections/shared/copy-defaults.js.
 *   - Strength-first vocabulary only. "Still building", never deficit words.
 * ========================================================================== */

/** Pick the string for a language, always with an English fallback. */
export function pick(lang, en, es) {
  return lang === "es" && es ? es : en;
}

/** Lower the first letter of a label so it can sit inside a sentence. */
function lowerFirst(text) {
  const s = String(text || "");
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/* -------------------------------------------------------------- standards --
 * `family` is a plain-language description that reads correctly after
 * "More practice with …" / "Más práctica con …", so it doubles as the reason
 * sentence on the "what is next" card. Labels mirror
 * data/curriculum-nervous-system.json node labels.
 * ------------------------------------------------------------------------ */
export const STANDARDS = Object.freeze({
  "6.AT.1": {
    label: "Understanding ratios",
    labelEs: "Comprender las razones",
    family: "comparing two amounts and saying the comparison out loud",
    familyEs: "comparar dos cantidades y decir la comparación en voz alta",
  },
  "6.AT.2": {
    label: "Unit rates",
    labelEs: "Tasas unitarias",
    family: "working out what one of something costs or covers",
    familyEs: "calcular cuánto cuesta o cubre una sola unidad",
  },
  "6.AT.3": {
    label: "Reasoning with ratios and rates",
    labelEs: "Razonar con razones y tasas",
    family: "using a rate to answer a real question, like a better buy",
    familyEs: "usar una tasa para responder una pregunta real, como cuál compra conviene",
  },
  "6.AT.4": {
    label: "Percents",
    labelEs: "Porcentajes",
    family: "finding a percent of an amount, the way a sale sign works",
    familyEs: "hallar el porcentaje de una cantidad, como funciona un letrero de rebaja",
  },
  "6.AT.5": {
    label: "Exponents",
    labelEs: "Exponentes",
    family: "reading a small raised number as repeated multiplying",
    familyEs: "leer un número pequeño elevado como una multiplicación repetida",
  },
  "6.AT.6a": {
    label: "Writing expressions",
    labelEs: "Escribir expresiones",
    family: "turning a sentence in words into a math expression",
    familyEs: "convertir una oración en palabras en una expresión matemática",
  },
  "6.AT.6c": {
    label: "Evaluating expressions",
    labelEs: "Evaluar expresiones",
    family: "putting a number in place of a letter and finishing the math",
    familyEs: "poner un número en lugar de una letra y terminar la operación",
  },
  "6.DS.4": {
    label: "Average and spread",
    labelEs: "Promedio y dispersión",
    family: "describing a whole set of numbers with one fair number",
    familyEs: "describir todo un conjunto de números con un solo número justo",
  },
  "6.GR.4": {
    label: "Surface area & nets",
    labelEs: "Área total y plantillas",
    family: "measuring the paper it would take to wrap the outside of a box",
    familyEs: "medir el papel que haría falta para envolver el exterior de una caja",
  },
  "6.GR.2": {
    label: "Volume",
    labelEs: "Volumen",
    family: "measuring how much space fills the inside of a box",
    familyEs: "medir cuánto espacio llena el interior de una caja",
  },
  "6.AT.7": {
    label: "Equivalent expressions",
    labelEs: "Expresiones equivalentes",
    family: "rewriting an expression so it says the same thing a different way",
    familyEs: "reescribir una expresión para decir lo mismo de otra manera",
  },
  "6.GR.1": {
    label: "Area",
    labelEs: "Área",
    family: "measuring how much surface a shape covers",
    familyEs: "medir cuánta superficie cubre una figura",
  },
  "6.NOS.1": {
    label: "Dividing fractions",
    labelEs: "Dividir fracciones",
    family: "asking how many small pieces fit inside a bigger amount",
    familyEs: "preguntar cuántas piezas pequeñas caben en una cantidad mayor",
  },
  "6.NOS.2": {
    label: "Dividing larger numbers",
    labelEs: "Dividir números grandes",
    family: "dividing bigger numbers and keeping every place in order",
    familyEs: "dividir números grandes y mantener cada lugar en orden",
  },
  "6.NOS.3": {
    label: "Decimal arithmetic",
    labelEs: "Operaciones con decimales",
    family: "adding, subtracting, multiplying and dividing decimals",
    familyEs: "sumar, restar, multiplicar y dividir decimales",
  },
  "6.NOS.4": {
    label: "Factors and multiples",
    labelEs: "Factores y múltiplos",
    family: "finding the numbers that two amounts share",
    familyEs: "encontrar los números que dos cantidades tienen en común",
  },
  "6.NOS.5": {
    label: "Positive and negative numbers",
    labelEs: "Números positivos y negativos",
    family: "using numbers above and under zero to describe real situations",
    familyEs: "usar números arriba y abajo de cero para describir situaciones reales",
  },
  "6.AT.8": {
    label: "Equations",
    labelEs: "Ecuaciones",
    family: "finding the missing number by undoing what was done to it",
    familyEs: "hallar el número que falta deshaciendo lo que se le hizo",
  },
  "6.AT.9": {
    label: "Inequalities",
    labelEs: "Desigualdades",
    family: "describing a whole range of allowed values, not just one",
    familyEs: "describir todo un rango de valores permitidos, no solo uno",
  },
  "6.DS.1": {
    label: "Statistical questions",
    labelEs: "Preguntas estadísticas",
    family: "telling a question whose answers vary from one with a single fixed answer",
    familyEs:
      "distinguir una pregunta cuyas respuestas varían de una con una sola respuesta fija",
  },
  "6.DS.3": {
    label: "Spread of data",
    labelEs: "Dispersión de los datos",
    family: "saying how scattered a set of numbers is, not just where its middle sits",
    familyEs: "decir qué tan dispersos están los números, no solo dónde está su centro",
  },
  "6.DS.4": {
    label: "Choosing a measure",
    labelEs: "Elegir una medida",
    family: "picking the number that best describes a typical value",
    familyEs: "escoger el número que mejor describe un valor típico",
  },
  "6.DS.5": {
    label: "Reading data displays",
    labelEs: "Leer gráficas de datos",
    family: "reading how many from a graph's height and which values from its labels",
    familyEs: "leer cuántos por la altura de la gráfica y cuáles valores por sus etiquetas",
  },
  "6.NOS.6": {
    label: "Points on the coordinate plane",
    labelEs: "Puntos en el plano de coordenadas",
    family: "naming a location with two numbers, in an order everyone agrees on",
    familyEs: "nombrar un lugar con dos números, en un orden que todos acuerdan",
  },
  "6.NOS.7": {
    label: "All four quadrants",
    labelEs: "Los cuatro cuadrantes",
    family: "plotting points that sit left of zero or under it, not just up and to the right",
    familyEs: "marcar puntos que quedan a la izquierda del cero o debajo, no solo arriba y a la derecha",
  },
  "6.NOS.6c": {
    label: "Opposites on the number line",
    labelEs: "Opuestos en la recta numérica",
    family: "seeing a number and its opposite as the same distance from zero",
    familyEs: "ver un número y su opuesto a la misma distancia del cero",
  },
});

/* ------------------------------------------------------------ asset links --
 * Real, existing paths taken from data/curriculum-nervous-system.json
 * `assets[]`. Titles are the page titles; `titleEs` is authored here so a
 * Spanish broadcast never hands a family an English-only sentence.
 * ------------------------------------------------------------------------ */
export const ASSETS = Object.freeze({
  "6.AT.1": [
    {
      title: "3-1 Understand Ratios",
      titleEs: "3-1 Comprender las razones",
      path: "/lessons/3-1/",
    },
    {
      title: "Unit 3 Culminating Projects",
      titleEs: "Proyectos finales de la Unidad 3",
      path: "/math/unit-3/projects/",
    },
  ],
  "6.AT.2": [
    {
      title: "4-1 Rates and Unit Rates",
      titleEs: "4-1 Tasas y tasas unitarias",
      path: "/lessons/3-2/",
    },
    {
      title: "4-7 Solve Problems with Unit Rates",
      titleEs: "4-7 Resolver problemas con tasas unitarias",
      path: "/lessons/3-8/",
    },
  ],
  "6.AT.3": [
    { title: "3-4 Equivalent Ratios", titleEs: "3-4 Razones equivalentes", path: "/lessons/3-9/" },
    {
      title: "3-7 Ratio and Rate Problem Solving",
      titleEs: "3-7 Resolver problemas de razones y tasas",
      path: "/lessons/3-7/",
    },
  ],
  "6.AT.4": [
    {
      title: "4-4 Find the Percent of a Number",
      titleEs: "4-4 Hallar el porcentaje de un número",
      path: "/lessons/4-4/",
    },
    {
      title: "4-5 Use Percent to Solve Problems",
      titleEs: "4-5 Usar el porcentaje para resolver problemas",
      path: "/lessons/4-5/",
    },
  ],
  "6.AT.5": [
    {
      title: "6-1 Powers and Exponents",
      titleEs: "6-1 Potencias y exponentes",
      path: "/lessons/6-3/",
    },
    {
      title: "Unit 6 Culminating Projects",
      titleEs: "Proyectos finales de la Unidad 6",
      path: "/math/unit-6/projects/",
    },
  ],
  "6.AT.6a": [
    {
      title: "6-3 Write Algebraic Expressions",
      titleEs: "6-3 Escribir expresiones algebraicas",
      path: "/lessons/6-5/",
    },
    {
      title: "6-3 Get Ready: Write Algebraic Expressions",
      titleEs: "6-3 Prepárese: Escribir expresiones algebraicas",
      path: "/lessons/6-5/readiness/",
    },
  ],
  "6.AT.6c": [
    {
      title: "6-2 Evaluate Expressions",
      titleEs: "6-2 Evaluar expresiones",
      path: "/lessons/6-4/",
    },
    {
      title: "6-2 Get Ready: Evaluate Expressions",
      titleEs: "6-2 Prepárese: Evaluar expresiones",
      path: "/lessons/6-4/readiness/",
    },
  ],
  "6.DS.4": [
    {
      title: "8-2 Mean, Median, and Mode",
      titleEs: "8-2 Media, mediana y moda",
      path: "/lessons/2-3/",
    },
    {
      title: "Unit 8 Culminating Projects",
      titleEs: "Proyectos finales de la Unidad 8",
      path: "/math/unit-8/projects/",
    },
  ],
  "6.GR.4": [
    {
      title: "10-3 Surface Area Using Nets",
      titleEs: "10-3 Área total con plantillas",
      path: "/lessons/5-6/",
    },
    {
      title: "10-4 Surface Area of Prisms",
      titleEs: "10-4 Área total de prismas",
      path: "/lessons/5-7/",
    },
  ],
  "6.GR.2": [
    {
      title: "10-1 Volume with Whole Number Edges",
      titleEs: "10-1 Volumen con aristas de números enteros",
      path: "/lessons/5-5/",
    },
  ],
  "6.AT.7": [
    {
      title: "6-6 Equivalent Expressions",
      titleEs: "6-6 Expresiones equivalentes",
      path: "/lessons/6-6/",
    },
  ],
  "6.GR.1": [
    {
      title: "5-3 Area of Triangles",
      titleEs: "5-3 Área de los triángulos",
      path: "/lessons/5-2/",
    },
    {
      title: "5-5 Area of Composite Figures",
      titleEs: "5-5 Área de figuras compuestas",
      path: "/lessons/5-4/",
    },
  ],
  "6.NOS.1": [
    { title: "2-3 Divide Fractions", titleEs: "2-3 Dividir fracciones", path: "/lessons/6-2/" },
    {
      title: "2-5 Fraction Division Problem Solving",
      titleEs: "2-5 Resolver problemas de división de fracciones",
      path: "/lessons/6-11/",
    },
  ],
  "6.NOS.2": [
    {
      title: "1-4 Divide Multi-Digit Numbers",
      titleEs: "1-4 Dividir números de varios dígitos",
      path: "/lessons/2-6/",
    },
    {
      title: "1-4 Get Ready: Divide Multi-Digit Numbers",
      titleEs: "1-4 Prepárese: Dividir números de varios dígitos",
      path: "/lessons/2-6/readiness/",
    },
  ],
  "6.NOS.3": [
    { title: "1-6 Multiply Decimals", titleEs: "1-6 Multiplicar decimales", path: "/lessons/2-12/" },
    { title: "1-7 Divide Decimals", titleEs: "1-7 Dividir decimales", path: "/lessons/2-7/" },
  ],
  "6.NOS.4": [
    {
      title: "1-2 Greatest Common Factor",
      titleEs: "1-2 Máximo común divisor",
      path: "/lessons/6-7/",
    },
    {
      title: "1-3 Least Common Multiple",
      titleEs: "1-3 Mínimo común múltiplo",
      path: "/lessons/6-12/",
    },
  ],
  // 6.NOS.5 / 6.NOS.6c carry no assets of their own in the concept map, so the
  // number-line lessons of 6.NOS.6 stand in for them. Both paths are real.
  "6.NOS.5": [
    {
      title: "9-4 Rational Numbers on the Number Line",
      titleEs: "9-4 Números racionales en la recta numérica",
      path: "/lessons/7-2/",
    },
  ],
  "6.AT.8": [
    {
      title: "8-2 Write and Solve Equations",
      titleEs: "8-2 Escribir y resolver ecuaciones",
      path: "/lessons/8-2/",
    },
  ],
  "6.AT.9": [
    {
      title: "8-4 Write and Represent Inequalities",
      titleEs: "8-4 Escribir y representar desigualdades",
      path: "/lessons/8-4/",
    },
  ],
  "6.DS.3": [
    {
      title: "2-5 Range and Interquartile Range",
      titleEs: "2-5 Rango y rango intercuartílico",
      path: "/lessons/2-5/",
    },
  ],
  "6.DS.4": [
    {
      title: "2-3 Describe the Data Using the Median",
      titleEs: "2-3 Describir los datos con la mediana",
      path: "/lessons/2-3/",
    },
  ],
  "6.DS.5": [
    {
      title: "2-2 Represent and Describe Data in a Histogram",
      titleEs: "2-2 Representar y describir datos en un histograma",
      path: "/lessons/2-2/",
    },
  ],
  "6.NOS.6": [
    {
      title: "7-5 Rational Numbers on the Coordinate Plane",
      titleEs: "7-5 Números racionales en el plano de coordenadas",
      path: "/lessons/7-5/",
    },
  ],
  "6.NOS.7": [
    {
      title: "7-8 Ordered Pairs in All Four Quadrants",
      titleEs: "7-8 Pares ordenados en los cuatro cuadrantes",
      path: "/lessons/7-8/",
    },
  ],
  "6.NOS.6c": [
    {
      title: "9-4 Rational Numbers on the Number Line",
      titleEs: "9-4 Números racionales en la recta numérica",
      path: "/lessons/7-2/",
    },
    {
      title: "9-5 Ordered Pairs in All Four Quadrants",
      titleEs: "9-5 Pares ordenados en los cuatro cuadrantes",
      path: "/lessons/7-8/",
    },
  ],
});

/* ------------------------------------------------------- prerequisite why --
 * Family-facing paraphrases of the `why` sentence on the matching edge in
 * data/curriculum-nervous-system.json `edges[]`. The concept map writes for
 * teachers ("an unmotivated division"); this writes for a parent at a table.
 * `from` names the standard the edge comes from, so the wording stays checkable
 * against the source graph.
 * ------------------------------------------------------------------------ */
export const BRIDGES = Object.freeze({
  "6.AT.2": {
    from: "6.AT.1",
    en: "A unit rate is just a comparison said 'per one'. The comparison has to feel solid first.",
    es: "Una tasa unitaria es una comparación dicha 'por uno'. La comparación tiene que sentirse firme primero.",
  },
  "6.AT.3": {
    from: "6.AT.2",
    en: "Rate questions in real life are unit-rate thinking dropped into a story.",
    es: "Las preguntas de tasas en la vida real son el mismo razonamiento de tasa unitaria dentro de una historia.",
  },
  "6.AT.4": {
    from: "6.AT.3",
    en: "A percent is a rate out of one hundred, so rate thinking carries straight over.",
    es: "Un porcentaje es una tasa de cada cien, así que el razonamiento de tasas se traslada directamente.",
  },
  "6.AT.6a": {
    from: "6.AT.6c",
    en: "Writing an expression from words assumes you already know what an expression says.",
    es: "Escribir una expresión a partir de palabras supone que ya se sabe qué dice una expresión.",
  },
  "6.AT.6c": {
    from: "6.AT.5",
    en: "You can only put a number in for a letter once the raised numbers read easily.",
    es: "Solo se puede sustituir una letra por un número cuando los números elevados se leen con facilidad.",
  },
  "6.DS.4": {
    from: "6.NOS.3",
    en: "An average is a division. A slip in the arithmetic looks like a mix-up about averages.",
    es: "Un promedio es una división. Un desliz en la aritmética parece una confusión sobre promedios.",
  },
  "6.GR.4": {
    from: "6.GR.1",
    en: "Surface area is the area of flat shapes, added up — the net turns a solid back into rectangles and triangles.",
    es: "El área total es la suma de áreas de figuras planas: la plantilla convierte un sólido otra vez en rectángulos y triángulos.",
  },
  "6.GR.2": {
    from: "6.NOS.1",
    en: "Volume with fractional edges is fraction multiplication stacked in three directions.",
    es: "El volumen con aristas fraccionarias es multiplicación de fracciones en tres direcciones.",
  },
  "6.AT.7": {
    from: "6.AT.6b",
    en: "Rewriting an expression means naming its terms and factors first.",
    es: "Reescribir una expresión requiere primero nombrar sus términos y factores.",
  },
  "6.GR.1": {
    from: "6.NOS.3",
    en: "Area of triangles and combined shapes leans on confident decimal and fraction arithmetic.",
    es: "El área de triángulos y figuras compuestas se apoya en una aritmética segura con decimales y fracciones.",
  },
  "6.NOS.1": {
    from: "6.NOS.4",
    en: "Shared factors are what let a fraction answer be simplified into something readable.",
    es: "Los factores en común son los que permiten simplificar una respuesta con fracciones y leerla con claridad.",
  },
  "6.NOS.3": {
    from: "6.NOS.2",
    en: "Decimal steps are the whole-number steps with the place value kept track of.",
    es: "Los pasos con decimales son los mismos de los números enteros, llevando la cuenta del valor posicional.",
  },
  "6.NOS.6c": {
    from: "6.NOS.5",
    en: "Opposites are a statement about matching distance on either side of zero.",
    es: "Los opuestos son una afirmación sobre distancias iguales a cada lado del cero.",
  },
  "6.NOS.7": {
    from: "6.NOS.6",
    en: "Naming a point in one quadrant is the same skill as naming it in any of the four.",
    es: "Nombrar un punto en un cuadrante es la misma destreza que nombrarlo en cualquiera de los cuatro.",
    es: "Los opuestos son una afirmación sobre distancias iguales a cada lado del cero.",
  },
});

/* ---------------------------------------------------------------- tags -----
 * Mirrors data/misconception-labels.json. `watchFor` is the canonical coaching
 * sentence, verbatim; `watchForEs` is authored here.
 * ------------------------------------------------------------------------ */
export const TAGS = Object.freeze({
  "decimal-place-value": {
    label: "Right digits, wrong magnitude",
    labelEs: "Dígitos correctos, magnitud equivocada",
    watchFor: "Estimate to the nearest whole first, then count decimal places out loud.",
    watchForEs:
      "Estime primero al entero más cercano y luego cuente en voz alta los lugares decimales.",
    standards: ["6.NOS.3"],
  },
  "exponent-as-multiplication": {
    label: "Multiplied the base by the exponent",
    labelEs: "Multiplicó la base por el exponente",
    watchFor: "Expand it once — write out every factor before evaluating.",
    watchForEs: "Desarróllelo una vez: escriba cada factor antes de calcular.",
    standards: ["6.AT.5"],
  },
  "fraction-added-denominators": {
    label: "Added the denominators",
    labelEs: "Sumó los denominadores",
    watchFor: "Return to a bar model — thirds plus fifths cannot become eighths.",
    watchForEs: "Vuelva al modelo de barra: tercios más quintos no pueden convertirse en octavos.",
    standards: ["6.NOS.1", "6.NOS.4"],
  },
  "fraction-no-reciprocal": {
    label: "Divided fractions without inverting",
    labelEs: "Dividió fracciones sin invertir",
    watchFor: "Ask them to check with a whole-number case they already trust.",
    watchForEs: "Pídale que lo compruebe con un caso de números enteros en el que ya confía.",
    standards: ["6.NOS.1"],
  },
  "fraction-straight-across-division": {
    label: "Divided numerators and denominators straight across",
    labelEs: "Dividió numeradores y denominadores directamente",
    watchFor: "Reground division as “how many of these fit into that?”",
    watchForEs: "Replantee la división como “¿cuántos de estos caben en aquello?”",
    standards: ["6.NOS.1"],
  },
  "factors-multiples-confused": {
    label: "Confused factors with multiples",
    labelEs: "Confundió factores con múltiplos",
    watchFor: "Ask which number divides which — factors go INTO it, multiples come OUT of it.",
    watchForEs:
      "Pregunte qué número divide a cuál: los factores DIVIDEN al número, los múltiplos SALEN de él.",
    standards: ["6.NOS.4"],
  },
  "property-order-vs-grouping": {
    label: "Confused the commutative and associative properties",
    labelEs: "Confundió la propiedad conmutativa con la asociativa",
    watchFor: "Ask what actually MOVED: the order of the numbers, or the parentheses?",
    watchForEs: "Pregunte qué se MOVIÓ en realidad: el orden de los números o los paréntesis.",
    standards: ["6.AT.7"],
  },
  "division-quotient-missing-zero": {
    label: "Dropped a placeholder zero in the quotient",
    labelEs: "Omiti\u00f3 un cero de posici\u00f3n en el cociente",
    watchFor:
      "Estimate first \u2014 4,896 \u00f7 12 is about 400, not 40 \u2014 then check the quotient has a digit above every digit that was brought down.",
    watchForEs:
      "Pida una estimaci\u00f3n r\u00e1pida antes de empezar la divisi\u00f3n larga y luego revise que la respuesta sea de ese tama\u00f1o.",
    standards: ["6.NOS.2"],
  },
  "factorization-stopped-early": {
    label: "Stopped factoring before every factor was prime",
    labelEs: "Dejó de factorizar antes de que todos los factores fueran primos",
    watchFor: "Point at each factor and ask: can this one still be broken apart?",
    watchForEs: "Señale cada factor y pregunte: ¿este todavía se puede separar?",
    standards: ["6.NOS.4"],
  },
  "pattern-unit-position-miscounted": {
    label: "Landed on the wrong place in the repeating unit",
    labelEs: "Cayó en el lugar equivocado dentro de la unidad que se repite",
    watchFor:
      "Ask them to divide by the unit length out loud and say what the remainder points at.",
    watchForEs:
      "Pídale que divida en voz alta entre la longitud de la unidad y diga a qué apunta el residuo.",
    standards: ["6.NOS.2"],
  },
  "stat-question-no-variability": {
    label: "Chose a question with only one fixed answer",
    labelEs: "Escogió una pregunta con una sola respuesta fija",
    watchFor: "Ask: would two different people give two different answers?",
    watchForEs: "Pregunte: ¿dos personas distintas darían dos respuestas distintas?",
    standards: ["6.DS.1"],
  },
  "ratio-compared-without-common-basis": {
    label: "Compared two ratios without a common basis",
    labelEs: "Comparó dos razones sin una base común",
    watchFor: "Ask what ONE of each is worth before either ratio is compared.",
    watchForEs: "Pregunte cuánto vale UNA de cada una antes de comparar las razones.",
    standards: ["6.AT.3"],
  },
  "geom-triangle-area-no-half": {
    label: "Found base × height but forgot the half",
    labelEs: "Calculó base × altura pero olvidó la mitad",
    watchFor: "Draw the rectangle around the triangle — the triangle is half of it.",
    watchForEs: "Dibuje el rectángulo alrededor del triángulo: el triángulo es la mitad.",
    standards: ["6.GR.1"],
  },
  "geom-surface-area-as-volume": {
    label: "Found the volume instead of the surface area",
    labelEs: "Halló el volumen en vez del área total",
    watchFor:
      "Ask what the unit has to be — square units cover a surface, cubic units fill a space.",
    watchForEs:
      "Pregunte cuál debe ser la unidad: las unidades cuadradas cubren una superficie, las cúbicas llenan un espacio.",
    standards: ["6.GR.4"],
  },
  "geom-volume-added-dimensions": {
    label: "Added the dimensions instead of multiplying",
    labelEs: "Sumó las dimensiones en vez de multiplicarlas",
    watchFor: "Build one layer of unit cubes first, then count the layers.",
    watchForEs: "Arme primero una capa de cubos unitarios y luego cuente las capas.",
    standards: ["6.GR.2"],
  },
  "algebra-distributive-partial": {
    label: "Distributed to the first term only",
    labelEs: "Distribuyó solo al primer término",
    watchFor: "Draw the area model — the outside factor touches BOTH terms.",
    watchForEs: "Dibuje el modelo de área: el factor de afuera toca AMBOS términos.",
    standards: ["6.AT.7"],
  },
  "equation-not-inverse-operation": {
    label: "Did not undo the operation",
    labelEs: "No deshizo la operación",
    watchFor: "Have them name the operation acting on the variable BEFORE they touch both sides.",
    watchForEs: "Pídale que nombre la operación que actúa sobre la variable ANTES de tocar ambos lados.",
    standards: ["6.AT.8"],
  },
  "equation-answered-with-given-number": {
    label: "Answered with a number already in the equation",
    labelEs: "Respondió con un número que ya estaba en la ecuación",
    watchFor: "Ask them to substitute their answer back into the original equation out loud.",
    watchForEs: "Pídale que sustituya su respuesta en la ecuación original en voz alta.",
    standards: ["6.AT.8"],
  },
  "inequality-direction-flipped": {
    label: "Right boundary, symbol reversed",
    labelEs: "Límite correcto, símbolo invertido",
    watchFor: "Ask which moves can flip a symbol — adding and subtracting never do.",
    watchForEs: "Pregunte cuáles pasos pueden voltear un símbolo; sumar y restar nunca lo hacen.",
    standards: ["6.AT.9"],
  },
  "inequality-boundary-inclusion": {
    label: "Boundary value wrongly included or excluded",
    labelEs: "Valor límite incluido o excluido por error",
    watchFor: "Have them test the boundary value itself — does it make the statement true?",
    watchForEs: "Pídale que pruebe el valor límite: ¿hace verdadero el enunciado?",
    standards: ["6.AT.9"],
  },
  "inequality-graph-direction": {
    label: "Graph shaded toward the wrong side",
    labelEs: "Gráfica sombreada hacia el lado equivocado",
    watchFor: "Make them test one number from the shaded side out loud before accepting a graph.",
    watchForEs: "Pídale que pruebe en voz alta un número del lado sombreado antes de aceptar la gráfica.",
    standards: ["6.AT.9"],
  },
  "stat-range-for-iqr": {
    label: "Used the full range instead of the IQR",
    labelEs: "Usó el rango completo en vez del rango intercuartílico",
    watchFor: "Have them mark Q1 and Q3 on the plot and cover everything outside them.",
    watchForEs: "Pídale que marque Q1 y Q3 y tape todo lo que quede fuera.",
    standards: ["6.DS.3"],
  },
  "stat-center-vs-spread": {
    label: "Confused a measure of center with a measure of spread",
    labelEs: "Confundió una medida de centro con una de dispersión",
    watchFor: "Ask what the question wants to know: a typical value, or how scattered the data is?",
    watchForEs: "Pregunte qué quiere saber la pregunta: un valor típico o qué tan dispersos están los datos.",
    standards: ["6.DS.3"],
  },
  "stat-mean-skewed-by-outlier": {
    label: "Chose the mean when an outlier distorts it",
    labelEs: "Eligió la media cuando un valor atípico la distorsiona",
    watchFor: "Have them cover the outlier and recompute — how far does the mean move?",
    watchForEs: "Pídale que tape el valor atípico y recalcule: ¿cuánto se mueve la media?",
    standards: ["6.DS.4"],
  },
  "stat-frequency-vs-value": {
    label: "Reported a data value where a frequency was asked",
    labelEs: "Dio un valor de los datos donde se pedía una frecuencia",
    watchFor: "Ask them to point at the axis their number came from before they answer.",
    watchForEs: "Pídale que señale de qué eje salió su número antes de responder.",
    standards: ["6.DS.5"],
  },
  "coord-xy-swapped": {
    label: "Swapped the x and y coordinates",
    labelEs: "Intercambió las coordenadas x e y",
    watchFor: "Have them trace the horizontal move with a finger before the vertical one.",
    watchForEs: "Pídale que trace con el dedo el movimiento horizontal antes del vertical.",
    standards: ["6.NOS.6", "6.NOS.7"],
  },
  "measure-area-perimeter-swap": {
    label: "Swapped area and perimeter",
    labelEs: "Confundió área y perímetro",
    watchFor: "Ask what the unit should be — units or square units?",
    watchForEs: "Pregunte cuál debería ser la unidad: ¿unidades o unidades cuadradas?",
    standards: ["6.GR.1"],
  },
  "op-added-instead-of-multiplied": {
    label: "Added when the problem multiplies",
    labelEs: "Sumó cuando el problema multiplica",
    watchFor: "Ask what the operation *does* to the quantity before they compute.",
    watchForEs: "Pregunte qué *le hace* la operación a la cantidad antes de que calcule.",
    standards: ["6.AT.6a"],
  },
  "op-divided-instead-of-multiplied": {
    label: "Divided when the problem multiplies",
    labelEs: "Dividió cuando el problema multiplica",
    watchFor: "Estimate first — should the answer be bigger or smaller than you started?",
    watchForEs: "Estime primero: ¿la respuesta debería ser mayor o menor que el punto de partida?",
    standards: ["6.AT.3"],
  },
  "op-multiplied-instead-of-added": {
    label: "Multiplied when the problem adds",
    labelEs: "Multiplicó cuando el problema suma",
    watchFor: "Have them restate the problem as a story, then name the operation.",
    watchForEs:
      "Pídale que vuelva a contar el problema como una historia y luego nombre la operación.",
    standards: ["6.AT.6a"],
  },
  "op-multiplied-instead-of-divided": {
    label: "Multiplied when the problem divides",
    labelEs: "Multiplicó cuando el problema divide",
    watchFor: "Estimate first — should the answer be bigger or smaller than you started?",
    watchForEs: "Estime primero: ¿la respuesta debería ser mayor o menor que el punto de partida?",
    standards: ["6.AT.2"],
  },
  "op-reversed-division": {
    label: "Divided in the wrong order",
    labelEs: "Dividió en el orden equivocado",
    watchFor: "Ask “what is being split, and into how many?” before they write it.",
    watchForEs: "Pregunte “¿qué se está repartiendo y entre cuántos?” antes de que lo escriba.",
    standards: ["6.AT.2", "6.NOS.2"],
  },
  "op-reversed-subtraction": {
    label: "Subtracted in the wrong order",
    labelEs: "Restó en el orden equivocado",
    watchFor: "Anchor both numbers on a number line before subtracting.",
    watchForEs: "Ubique ambos números en una recta numérica antes de restar.",
    standards: ["6.AT.6a"],
  },
  "order-of-operations-left-to-right": {
    label: "Worked left to right instead of by operation order",
    labelEs: "Trabajó de izquierda a derecha en vez de por orden de operaciones",
    watchFor: "Have them circle the operation that must go first, then compute.",
    watchForEs:
      "Pídale que encierre en un círculo la operación que debe ir primero y luego calcule.",
    standards: ["6.AT.5", "6.AT.6c"],
  },
  "percent-scale-off-by-100": {
    label: "Percent answer off by a factor of 100",
    labelEs: "Respuesta de porcentaje errada por un factor de 100",
    watchFor: "Benchmark against 50% and 10% before trusting the number.",
    watchForEs: "Compare con el 50 % y el 10 % antes de confiar en el número.",
    standards: ["6.AT.4"],
  },
  "percent-used-as-whole-number": {
    label: "Used the percent as a plain number",
    labelEs: "Usó el porcentaje como número entero",
    watchFor: "Make them say the percent as “per hundred” out loud.",
    watchForEs: "Pídale que diga el porcentaje en voz alta como “por cada cien”.",
    standards: ["6.AT.4"],
  },
  "rate-not-per-one": {
    label: "Gave the total instead of the unit rate",
    labelEs: "Dio el total en vez de la tasa unitaria",
    watchFor: "Ask “per ONE what?” and make them finish the sentence.",
    watchForEs: "Pregunte “¿por UNO qué?” y pídale que termine la oración.",
    standards: ["6.AT.2"],
  },
  "ratio-inverted": {
    label: "Flipped the ratio",
    labelEs: "Invirtió la razón",
    watchFor: "Have them label both quantities with units before writing the ratio.",
    watchForEs: "Pídale que etiquete ambas cantidades con sus unidades antes de escribir la razón.",
    standards: ["6.AT.1"],
  },
  "ratio-scaled-additively": {
    label: "Scaled a ratio by adding instead of multiplying",
    labelEs: "Escaló una razón sumando en vez de multiplicando",
    watchFor: "Ask what ONE batch is worth, then how many batches — a ratio grows by copies, not by steps.",
    watchForEs:
      "Pregunte cuántas tandas está haciendo y luego revise ambas cantidades contra una sola tanda.",
    standards: ["6.AT.1", "6.AT.3"],
  },
  "ratio-as-difference": {
    label: "Combined the two amounts instead of comparing them",
    labelEs: "Combinó las dos cantidades en vez de compararlas",
    watchFor: "Have them say the comparison out loud — “for every ___ there are ___” — before writing anything.",
    watchForEs: "Pídale que lo diga como “por cada ___ hay ___” antes de escribir nada.",
    standards: ["6.AT.1"],
  },
  "stat-mean-vs-median": {
    label: "Used the mean where the median was asked (or the reverse)",
    labelEs: "Usó la media donde se pedía la mediana (o al revés)",
    watchFor: "Ask them to say which word the question used, then what that word tells you to DO with the numbers.",
    watchForEs:
      "Pregunte qué palabra usó la pregunta y luego qué dice esa palabra que HAY QUE HACER con los números.",
    standards: ["6.DS.4", "6.DS.3"],
  },
  "stat-histogram-bin-misread": {
    label: "Misread the bins or the scale on a data display",
    labelEs: "Leyó mal los intervalos o la escala de una gráfica",
    watchFor: "Have them point to the interval's two endpoints and say which values belong inside it.",
    watchForEs:
      "Pídale que señale los dos extremos del intervalo y diga qué valores caben dentro.",
    standards: ["6.DS.5"],
  },
  "sign-dropped": {
    label: "Right magnitude, lost the negative sign",
    labelEs: "Magnitud correcta, perdió el signo negativo",
    watchFor: "Place the answer on a number line — which side of zero?",
    watchForEs: "Ubique la respuesta en una recta numérica: ¿de qué lado del cero está?",
    standards: ["6.NOS.5", "6.NOS.6c"],
  },
  "stat-summed-instead-of-averaged": {
    label: "Added the data set instead of averaging it",
    labelEs: "Sumó el conjunto de datos en vez de promediarlo",
    watchFor: "Ask whether the answer could be a realistic single value in that set.",
    watchForEs:
      "Pregunte si la respuesta podría ser un valor único realista dentro de ese conjunto.",
    standards: ["6.DS.4"],
  },
});

/* ------------------------------------------------- kitchen-table activities --
 * ONE five-minute thing a family can do tonight, for every tag in TAGS.
 * Rules the validator enforces: at least three steps, English and Spanish
 * versions of every string, and `minutes` no greater than five.
 * Rules that matter just as much and cannot be automated: household objects
 * only, no printing, no worksheet, no device, and no adult needing to teach
 * anything. Every activity is a conversation with an object on the table.
 * ------------------------------------------------------------------------ */
export const KITCHEN_TABLE = Object.freeze({
  "decimal-place-value": {
    minutes: 5,
    title: "The receipt guess",
    titleEs: "La adivinanza del recibo",
    materials: "Any receipt or two price tags, and a scrap of paper.",
    materialsEs: "Cualquier recibo o dos etiquetas de precio y un papel.",
    steps: [
      "Pick two prices off a receipt and read them out loud together.",
      "Before adding, ask your student to guess the total to the nearest whole dollar.",
      "Now add the two prices exactly, on paper.",
      "Compare the exact total with the guess. If they are far apart, look at the decimal point, not the digits.",
    ],
    stepsEs: [
      "Elija dos precios de un recibo y léanlos juntos en voz alta.",
      "Antes de sumar, pida a su estudiante que adivine el total al dólar entero más cercano.",
      "Ahora sumen los dos precios con exactitud, en papel.",
      "Comparen el total exacto con la adivinanza. Si están muy lejos, miren el punto decimal, no los dígitos.",
    ],
    why: "The guess is the safety net. When the guess and the answer disagree, the decimal point is almost always the reason.",
    whyEs:
      "La adivinanza es la red de seguridad. Cuando la adivinanza y la respuesta no coinciden, casi siempre la razón es el punto decimal.",
  },
  "exponent-as-multiplication": {
    minutes: 5,
    title: "Fold the paper, count the layers",
    titleEs: "Doble el papel y cuente las capas",
    materials: "One sheet of paper.",
    materialsEs: "Una hoja de papel.",
    steps: [
      "Fold a sheet of paper in half once and count the layers together. Two.",
      "Fold again and count. Four. Keep folding to four or five folds, saying each count out loud.",
      "Ask what 2 to the fourth power is, and ask your student to write 2 × 2 × 2 × 2 before answering.",
      "Point out that 2 × 4 is 8, but four folds made 16 layers.",
    ],
    stepsEs: [
      "Doble una hoja de papel por la mitad una vez y cuenten juntos las capas. Dos.",
      "Doble otra vez y cuenten. Cuatro. Siga hasta cuatro o cinco dobleces, diciendo cada número en voz alta.",
      "Pregunte cuánto es 2 elevado a la cuarta y pida que escriba 2 × 2 × 2 × 2 antes de responder.",
      "Señale que 2 × 4 es 8, pero cuatro dobleces dieron 16 capas.",
    ],
    why: "The small raised number counts how many factors there are. Holding the folded paper makes that impossible to forget.",
    whyEs:
      "El número pequeño elevado cuenta cuántos factores hay. Tener el papel doblado en la mano hace imposible olvidarlo.",
  },
  "fraction-added-denominators": {
    minutes: 5,
    title: "Two different chocolate bars",
    titleEs: "Dos barras de chocolate distintas",
    materials: "Two strips of paper.",
    materialsEs: "Dos tiras de papel.",
    steps: [
      "Tear one paper strip into three equal parts and the other into five equal parts.",
      "Put one piece of each side by side and ask whether that is two eighths of a bar.",
      "Ask what the pieces would have to look like before you could count them together.",
      "Fold both strips until the pieces match in size, and count again.",
    ],
    stepsEs: [
      "Rompa una tira de papel en tres partes iguales y la otra en cinco partes iguales.",
      "Coloque una pieza de cada una lado a lado y pregunte si eso es dos octavos de una barra.",
      "Pregunte cómo tendrían que ser las piezas para poder contarlas juntas.",
      "Doblen ambas tiras hasta que las piezas midan lo mismo y cuenten otra vez.",
    ],
    why: "The bottom number names the size of the piece. You can only count pieces that are the same size.",
    whyEs:
      "El número de abajo nombra el tamaño de la pieza. Solo se pueden contar piezas del mismo tamaño.",
  },
  "fraction-no-reciprocal": {
    minutes: 5,
    title: "How many half cups?",
    titleEs: "¿Cuántas medias tazas?",
    materials: "A measuring cup, or any two identical cups.",
    materialsEs: "Una taza medidora o dos tazas iguales.",
    steps: [
      "Fill a cup exactly halfway and set it beside three full cups of water or rice.",
      "Ask how many half cups it takes to fill three cups, and let your student actually pour and count.",
      "Write 3 ÷ ½ = 6 together on paper.",
      "Ask why the answer came out bigger than three.",
    ],
    stepsEs: [
      "Llene una taza exactamente hasta la mitad y colóquela junto a tres tazas llenas de agua o arroz.",
      "Pregunte cuántas medias tazas se necesitan para llenar tres tazas, y deje que su estudiante sirva y cuente.",
      "Escriban juntos 3 ÷ ½ = 6 en papel.",
      "Pregunte por qué la respuesta salió mayor que tres.",
    ],
    why: "Dividing by a piece smaller than one asks how many fit, so the answer grows. That is the reason the fraction turns over.",
    whyEs:
      "Dividir entre una pieza menor que uno pregunta cuántas caben, así que la respuesta crece. Esa es la razón por la que la fracción se invierte.",
  },
  "fraction-straight-across-division": {
    minutes: 4,
    title: "Fit the pieces in",
    titleEs: "Hagan caber las piezas",
    materials: "A strip of paper and scissors, or a tortilla.",
    materialsEs: "Una tira de papel y tijeras, o una tortilla.",
    steps: [
      "Cut a paper strip into four equal quarters.",
      "Ask how many quarters fit on top of one half, and have your student lay them out to check.",
      "Write ½ ÷ ¼ = 2 together.",
      "Ask what dividing the tops and bottoms straight across would have given, and compare it with the pieces on the table.",
    ],
    stepsEs: [
      "Corte una tira de papel en cuatro cuartos iguales.",
      "Pregunte cuántos cuartos caben encima de una mitad y pida a su estudiante que los coloque para comprobarlo.",
      "Escriban juntos ½ ÷ ¼ = 2.",
      "Pregunte qué habría dado dividir arriba con arriba y abajo con abajo, y compárenlo con las piezas sobre la mesa.",
    ],
    why: "Division asks how many of these fit into that. The pieces on the table settle the argument in seconds.",
    whyEs:
      "La división pregunta cuántos de estos caben en aquello. Las piezas sobre la mesa resuelven la discusión en segundos.",
  },
  "factors-multiples-confused": {
    minutes: 5,
    title: "Share the snack, then count past it",
    titleEs: "Reparte la botana y luego cuenta más allá",
    materials: "12 crackers, grapes or coins.",
    materialsEs: "12 galletas, uvas o monedas.",
    steps: [
      "Put 12 pieces on the table. Split them into equal groups every way that works with none left over.",
      "Write the group sizes you found: 1, 2, 3, 4, 6, 12. Those are the FACTORS of 12.",
      "Now start at 12 and count on by 12: 12, 24, 36. Those are the MULTIPLES.",
      "Ask: which list has numbers bigger than 12, and which has numbers 12 or smaller?",
    ],
    stepsEs: [
      "Pongan 12 piezas en la mesa. Sepárenlas en grupos iguales de todas las maneras que funcionen sin que sobre nada.",
      "Escriban los tamaños de grupo que encontraron: 1, 2, 3, 4, 6, 12. Esos son los FACTORES del 12.",
      "Ahora empiecen en 12 y cuenten de 12 en 12: 12, 24, 36. Esos son los MÚLTIPLOS.",
      "Pregunte: ¿qué lista tiene números mayores que 12 y cuál tiene números de 12 o menos?",
    ],
    why: "Handling the pieces makes the direction obvious — factors fit INSIDE the number, multiples run past it.",
    whyEs:
      "Tocar las piezas hace obvia la dirección: los factores caben DENTRO del número, los múltiplos se pasan de él.",
  },
  "property-order-vs-grouping": {
    minutes: 5,
    title: "Move the numbers, then move the bag",
    titleEs: "Mueve los números y luego mueve la bolsa",
    materials: "Three small objects and a paper bag or a loop of string.",
    materialsEs: "Tres objetos pequeños y una bolsa de papel o un cordón en círculo.",
    steps: [
      "Line up 2, 5 and 9 written on scraps of paper. Add them out loud.",
      "Swap the 2 and the 9 and add again. Same total? That swap is COMMUTATIVE — the order moved.",
      "Put the papers back in order and drop the first two into the bag, then add. Now bag the last two instead.",
      "Ask: did any number change places that time? Only the bag moved — that is ASSOCIATIVE.",
    ],
    stepsEs: [
      "Acomoden el 2, el 5 y el 9 escritos en papelitos. Súmenlos en voz alta.",
      "Intercambien el 2 y el 9 y sumen otra vez. ¿Mismo total? Ese intercambio es CONMUTATIVO: se movió el orden.",
      "Regresen los papeles a su orden y metan los dos primeros a la bolsa, luego sumen. Ahora metan los dos últimos.",
      "Pregunte: ¿algún número cambió de lugar esa vez? Solo se movió la bolsa: eso es ASOCIATIVO.",
    ],
    why: "The bag makes the parentheses physical, so 'grouping' stops being a word and becomes something you can see move.",
    whyEs:
      "La bolsa hace físicos los paréntesis, así que «agrupación» deja de ser una palabra y se vuelve algo que se ve moverse.",
  },
  "division-quotient-missing-zero": {
    minutes: 5,
    title: "Guess the size first",
    titleEs: "Adivinen el tama\u00f1o primero",
    materials: "Paper and a pencil.",
    materialsEs: "Papel y l\u00e1piz.",
    steps: [
      "Write 4,896 \u00f7 12 and DO NOT solve it yet. Ask: roughly how big will the answer be?",
      "Round together \u2014 about 4,800 \u00f7 12 \u2014 and agree out loud on an estimate near 400.",
      "Now work it out. If the answer comes out as 48, the estimate already told you a place is missing.",
      "Find the missing place: the step where 12 does not fit into 9 still writes a 0 above the 9. Read it back \u2014 408 \u2014 and check with 12 \u00d7 408.",
    ],
    stepsEs: [
      "Escriban 4,896 \u00f7 12 y NO lo resuelvan todav\u00eda. Pregunten: \u00bfm\u00e1s o menos de qu\u00e9 tama\u00f1o ser\u00e1 la respuesta?",
      "Redondeen juntos \u2014 como 4,800 \u00f7 12 \u2014 y acuerden en voz alta una estimaci\u00f3n cerca de 400.",
      "Ahora res\u00faelvanlo. Si la respuesta sale 48, la estimaci\u00f3n ya les dijo que falta un lugar.",
      "Busquen el lugar que falta: el paso donde el 12 no cabe en 9 igual escribe un 0 encima del 9. L\u00e9anlo de nuevo \u2014 408 \u2014 y comprueben con 12 \u00d7 408.",
    ],
    why: "Estimating first turns a place-value slip into something the student catches themselves, before anyone checks the answer.",
    whyEs:
      "Estimar primero convierte un desliz de valor posicional en algo que el estudiante detecta solo, antes de que alguien revise la respuesta.",
  },
  "factorization-stopped-early": {
    minutes: 5,
    title: "Keep splitting until you cannot",
    titleEs: "Sigue separando hasta que ya no puedas",
    materials: "Paper and a pencil.",
    materialsEs: "Papel y lápiz.",
    steps: [
      "Write 12 at the top and split it into any two numbers that multiply to 12 — say 2 and 6.",
      "Point at each one and ask: can THIS number be split again?",
      "The 6 can: 2 × 3. Split it and circle every number that cannot be split.",
      "Read the circled numbers left to right: 2, 2, 3. Multiply them back and check you land on 12.",
    ],
    stepsEs: [
      "Escriban 12 arriba y sepárenlo en dos números cualesquiera que multiplicados den 12, por ejemplo 2 y 6.",
      "Señalen cada uno y pregunten: ¿ESTE número se puede separar otra vez?",
      "El 6 sí: 2 × 3. Sepárenlo y encierren cada número que ya no se pueda separar.",
      "Lean los números encerrados de izquierda a derecha: 2, 2, 3. Multiplíquenlos de regreso y comprueben que dan 12.",
    ],
    why: "Asking 'can this one split again?' at every branch is the whole method — the tree ends when the answer is no.",
    whyEs:
      "Preguntar «¿este se puede separar otra vez?» en cada rama es todo el método: el árbol termina cuando la respuesta es no.",
  },
  "pattern-unit-position-miscounted": {
    minutes: 5,
    title: "The twelfth spoon",
    titleEs: "La cuchara número doce",
    materials: "Three kinds of small object — spoons, forks, and cups work.",
    materialsEs: "Tres tipos de objetos pequeños: cucharas, tenedores y vasos sirven.",
    steps: [
      "Lay out a repeating line on the table: spoon, fork, cup, spoon, fork, cup — keep going to about nine.",
      "Ask your student: without laying out any more, what is number 12?",
      "Then ask HOW they know. If the answer is 'because 12 is even', lay out three more and count together.",
      "Now do it their way and the counting way, and compare: 12 ÷ 3 = 4 with nothing left over, and four complete rounds end on the cup.",
      "Try one more they cannot count quickly — number 25 — and check it with the same two steps.",
    ],
    stepsEs: [
      "Pongan una fila que se repita sobre la mesa: cuchara, tenedor, vaso, cuchara, tenedor, vaso — sigan hasta unos nueve.",
      "Pregunte a su estudiante: sin poner más, ¿cuál es el número 12?",
      "Después pregunte CÓMO lo sabe. Si responde «porque 12 es par», pongan tres más y cuenten juntos.",
      "Ahora háganlo a su manera y contando, y comparen: 12 ÷ 3 = 4 sin que sobre nada, y cuatro rondas completas terminan en el vaso.",
      "Prueben uno que no se pueda contar rápido — el número 25 — y compruébenlo con los mismos dos pasos.",
    ],
    why: "Even and odd cannot decide it when the pattern is three long. Dividing by the length of one round, and asking what is left over, works for any position — including ones too far out to count.",
    whyEs:
      "Par o impar no lo puede decidir cuando el patrón mide tres. Dividir entre la longitud de una ronda, y preguntar qué sobra, funciona para cualquier posición — incluso para las que quedan demasiado lejos para contarlas.",
  },
  "stat-question-no-variability": {
    minutes: 5,
    title: "Two questions at the dinner table",
    titleEs: "Dos preguntas en la mesa",
    materials: "Nothing — just the people at the table.",
    materialsEs: "Nada, solo las personas en la mesa.",
    steps: [
      "Ask everyone: 'How many people are at this table?' Notice that everyone says the same number.",
      "Now ask: 'How many hours did you sleep last night?' Write down each answer.",
      "Compare the two lists. One has a single number; the other has one number per person.",
      "Ask: which question could you make a graph from, and why?",
    ],
    stepsEs: [
      "Pregúntenle a todos: «¿Cuántas personas hay en esta mesa?» Fíjense en que todos dicen el mismo número.",
      "Ahora pregunten: «¿Cuántas horas dormiste anoche?» Anoten cada respuesta.",
      "Comparen las dos listas. Una tiene un solo número; la otra tiene un número por persona.",
      "Pregunte: ¿de cuál pregunta podrían hacer una gráfica, y por qué?",
    ],
    why: "The difference is not the topic — it is whether the answers differ. That is what makes a question statistical.",
    whyEs:
      "La diferencia no es el tema, sino si las respuestas difieren. Eso es lo que hace estadística a una pregunta.",
  },
  "ratio-compared-without-common-basis": {
    minutes: 5,
    title: "Which package is really cheaper?",
    titleEs: "¿Qué paquete es de verdad más barato?",
    materials: "Two packages from the kitchen with the price and the count on them.",
    materialsEs: "Dos paquetes de la cocina con el precio y la cantidad.",
    steps: [
      "Put the two packages side by side and ask which looks cheaper from the price alone.",
      "Read the count on each one. Are they even the same size?",
      "Divide each price by its count to get the cost of ONE. Say both numbers out loud.",
      "Ask: did the cheaper-looking package stay the cheaper one?",
    ],
    stepsEs: [
      "Pongan los dos paquetes lado a lado y pregunten cuál se ve más barato solo por el precio.",
      "Lean la cantidad de cada uno. ¿Son siquiera del mismo tamaño?",
      "Dividan cada precio entre su cantidad para obtener el costo de UNO. Digan los dos números en voz alta.",
      "Pregunte: ¿el paquete que se veía más barato siguió siendo el más barato?",
    ],
    why: "It often flips, and that surprise is the lesson: totals cannot be compared until both are written per one.",
    whyEs:
      "Muchas veces se invierte, y esa sorpresa es la lección: los totales no se pueden comparar hasta que los dos estén escritos por uno.",
  },
  "geom-triangle-area-no-half": {
    minutes: 5,
    title: "Cut the rectangle in half",
    titleEs: "Corta el rectángulo por la mitad",
    materials: "A piece of paper, scissors, and a pencil.",
    materialsEs: "Una hoja de papel, tijeras y un lápiz.",
    steps: [
      "Cut a rectangle out of paper and find its area together: length times width.",
      "Draw one diagonal and cut along it to make two triangles.",
      "Stack the two triangles to show they match exactly.",
      "Ask: if the rectangle was 24 squares, how big is each triangle? Say why out loud.",
    ],
    stepsEs: [
      "Recorten un rectángulo de papel y hallen juntos su área: largo por ancho.",
      "Dibujen una diagonal y córtenla para formar dos triángulos.",
      "Apilen los dos triángulos para mostrar que son idénticos.",
      "Pregunte: si el rectángulo era de 24 cuadrados, ¿cuánto mide cada triángulo? Digan por qué en voz alta.",
    ],
    why: "Seeing the two matching halves is the whole formula — the ½ stops being a rule to memorize.",
    whyEs:
      "Ver las dos mitades idénticas es toda la fórmula: el ½ deja de ser una regla de memoria.",
  },
  "geom-surface-area-as-volume": {
    minutes: 5,
    title: "Unfold the cereal box",
    titleEs: "Desdoblen la caja de cereal",
    materials: "An empty cereal or cracker box, and scissors.",
    materialsEs: "Una caja vacía de cereal o galletas, y tijeras.",
    steps: [
      "Cut along the edges and flatten the box out until it lies completely flat.",
      "Count the rectangles. Ask which ones are the same size as each other, and why.",
      "Point at the flat shape and ask: is this the paper AROUND the box, or the cereal INSIDE it?",
      "Ask: if we wanted to know how much cereal fits, would we measure this flat paper — or something else?",
    ],
    stepsEs: [
      "Corten por los bordes y aplanen la caja hasta que quede completamente plana.",
      "Cuenten los rectángulos. Pregunte cuáles son del mismo tamaño y por qué.",
      "Señale la figura plana y pregunte: ¿esto es el papel de AFUERA o el cereal de ADENTRO?",
      "Pregunte: si quisiéramos saber cuánto cereal cabe, ¿mediríamos este papel plano u otra cosa?",
    ],
    why: "Surface area is the flattened box; volume is what fills it. Cutting one open makes them two different things instead of two formulas to mix up.",
    whyEs:
      "El área total es la caja desdoblada; el volumen es lo que la llena. Abrir una las convierte en dos cosas distintas y no en dos fórmulas que se confunden.",
  },
  "geom-volume-added-dimensions": {
    minutes: 5,
    title: "Fill the box in layers",
    titleEs: "Llena la caja por capas",
    materials: "A small box and anything cube-ish: dice, sugar cubes, or blocks.",
    materialsEs: "Una caja pequeña y algo con forma de cubo: dados, cubos de azúcar o bloques.",
    steps: [
      "Cover just the bottom of the box with cubes and count that one layer.",
      "Ask how many layers like that would stack to the top.",
      "Multiply layer × layers, then check by filling the box if you have enough cubes.",
      "Ask: why does adding the three side lengths NOT tell us how much fits inside?",
    ],
    stepsEs: [
      "Cubran solo el fondo de la caja con cubos y cuenten esa primera capa.",
      "Pregunte cuántas capas como esa se apilarían hasta arriba.",
      "Multipliquen capa × capas y comprueben llenando la caja si tienen cubos suficientes.",
      "Pregunte: ¿por qué sumar los tres lados NO nos dice cuánto cabe adentro?",
    ],
    why: "Volume is filling, not measuring edges. One layer, times the number of layers, is the formula.",
    whyEs:
      "El volumen es llenar, no medir bordes. Una capa, por el número de capas, es la fórmula.",
  },
  "algebra-distributive-partial": {
    minutes: 5,
    title: "Three of everything",
    titleEs: "Tres de todo",
    materials: "Any small snack items: crackers and grapes work well.",
    materialsEs: "Cualquier merienda pequeña: galletas y uvas funcionan bien.",
    steps: [
      "Make one plate with 4 crackers and 2 grapes.",
      "Ask your student to build THREE plates exactly like it.",
      "Count everything: 3 × 4 crackers and 3 × 2 grapes. Write 3(4 + 2) = 12 + 6.",
      "Ask: what goes wrong if only the crackers get tripled?",
    ],
    stepsEs: [
      "Armen un plato con 4 galletas y 2 uvas.",
      "Pida a su estudiante que arme TRES platos exactamente iguales.",
      "Cuenten todo: 3 × 4 galletas y 3 × 2 uvas. Escriban 3(4 + 2) = 12 + 6.",
      "Pregunte: ¿qué sale mal si solo se triplican las galletas?",
    ],
    why: "Three groups means three of EVERYTHING in the group — the parentheses travel together.",
    whyEs: "Tres grupos significa tres de TODO lo que hay en el grupo: el paréntesis viaja junto.",
  },
  "equation-not-inverse-operation": {
    minutes: 5,
    title: "Undo it, don't redo it",
    titleEs: "Deshazlo, no lo repitas",
    materials: "A cup, a few coins, and a small object to hide under the cup.",
    materialsEs: "Un vaso, unas monedas y un objeto pequeño para esconder debajo.",
    steps: [
      "Hide some coins under the cup and put three more beside it. Say: 'together there are eight.'",
      "Ask how many are hidden, and ask them to say the move out loud: 'take away the three.'",
      "Do it wrong on purpose — add three MORE — and ask whether that helped find the hidden number.",
      "Swap roles and let them set the puzzle for you."
],
    stepsEs: [
      "Esconda unas monedas bajo el vaso y ponga tres al lado. Diga: 'en total hay ocho.'",
      "Pregunte cuántas están escondidas y pida que diga el paso en voz alta: 'quitar las tres.'",
      "Hágalo mal a propósito —agregue tres MÁS— y pregunte si eso ayudó a hallar el número escondido.",
      "Cambien de papel y deje que le pongan el reto a usted."
],
    why: "Solving is undoing. Doing the same move again buries the answer deeper, and doing it with your hands makes that obvious.",
    whyEs: "Resolver es deshacer. Repetir el mismo paso entierra más la respuesta, y hacerlo con las manos lo deja claro.",
  },
  "equation-answered-with-given-number": {
    minutes: 5,
    title: "Which number is the mystery?",
    titleEs: "¿Cuál número es el misterio?",
    materials: "Paper and a pen.",
    materialsEs: "Papel y lápiz.",
    steps: [
      "Write a simple equation like n + 12 = 30 and read it aloud together.",
      "Ask which numbers you can already see, and circle them.",
      "Ask which number nobody has told you yet — that one is the answer you are hunting.",
      "Check by putting their answer back in and reading the sentence out loud."
],
    stepsEs: [
      "Escriba una ecuación simple como n + 12 = 30 y léanla juntos.",
      "Pregunte cuáles números ya se ven y enciérrelos.",
      "Pregunte cuál número nadie le ha dicho todavía: ese es el que busca.",
      "Comprueben sustituyendo su respuesta y leyendo la oración en voz alta."
],
    why: "The answer is never a number already printed on the page. Substituting it back is the check that settles it.",
    whyEs: "La respuesta nunca es un número ya impreso en la hoja. Sustituirla es la comprobación que lo resuelve.",
  },
  "inequality-direction-flipped": {
    minutes: 5,
    title: "Taller than, shorter than",
    titleEs: "Más alto que, más bajo que",
    materials: "Nothing — just the two of you and a doorway.",
    materialsEs: "Nada: solo ustedes dos y una puerta.",
    steps: [
      "Stand back to back and say who is taller, out loud, as a sentence.",
      "Both stand on a book. Ask whether that changed who is taller.",
      "Say it as a rule: adding the same to both sides did not change the direction.",
      "Try it with a different-sized book and check again."
],
    stepsEs: [
      "Párense espalda con espalda y digan en voz alta quién es más alto, como oración.",
      "Súbanse los dos a un libro. Pregunte si eso cambió quién es más alto.",
      "Dígalo como regla: sumar lo mismo a ambos lados no cambió la dirección.",
      "Prueben con un libro de otro tamaño y revisen otra vez."
],
    why: "Adding the same amount to both sides never changes which one is bigger. That is the whole rule, felt rather than memorised.",
    whyEs: "Sumar la misma cantidad a ambos lados nunca cambia cuál es mayor. Esa es toda la regla, sentida en vez de memorizada.",
  },
  "inequality-boundary-inclusion": {
    minutes: 5,
    title: "Does exactly that count?",
    titleEs: "¿Cuenta exactamente eso?",
    materials: "Any household rule with a number in it.",
    materialsEs: "Cualquier regla de la casa que tenga un número.",
    steps: [
      "Say a rule out loud: 'you may have at most two snacks.'",
      "Ask whether exactly two is allowed. Then ask about exactly three.",
      "Change the wording to 'fewer than two' and ask the same question again.",
      "Notice together that one word changed who is allowed."
],
    stepsEs: [
      "Diga una regla en voz alta: 'puedes tomar como máximo dos meriendas.'",
      "Pregunte si exactamente dos se permite. Luego pregunte por exactamente tres.",
      "Cambie las palabras a 'menos de dos' y vuelva a preguntar lo mismo.",
      "Noten juntos que una sola palabra cambió a quién se le permite."
],
    why: "The boundary number is the whole question. Testing that exact value is faster than remembering which symbol is which.",
    whyEs: "El número límite es toda la pregunta. Probar ese valor exacto es más rápido que recordar cuál símbolo es cuál.",
  },
  "inequality-graph-direction": {
    minutes: 5,
    title: "Test one and see",
    titleEs: "Prueba uno y observa",
    materials: "Paper, or the edge of a ruler as a number line.",
    materialsEs: "Papel o el borde de una regla como recta numérica.",
    steps: [
      "Draw a line, mark a number on it, and shade one side.",
      "Say what the shading claims: 'every number here works.'",
      "Pick one number from the shaded part and test it against the rule out loud.",
      "If it fails, move the shading and test again."
],
    stepsEs: [
      "Dibuje una recta, marque un número y sombree un lado.",
      "Diga qué afirma el sombreado: 'todos los números de aquí sirven.'",
      "Escoja un número de la parte sombreada y pruébelo con la regla en voz alta.",
      "Si falla, mueva el sombreado y prueben otra vez."
],
    why: "A shaded picture is a claim about every number in it. One test is enough to check the claim.",
    whyEs: "Un dibujo sombreado afirma algo sobre cada número que contiene. Una sola prueba basta para revisarlo.",
  },
  "stat-range-for-iqr": {
    minutes: 5,
    title: "Cover the ends",
    titleEs: "Tapa los extremos",
    materials: "A list of numbers and two fingers.",
    materialsEs: "Una lista de números y dos dedos.",
    steps: [
      "Write down about eight numbers and order them together.",
      "Cover the smallest quarter and the largest quarter with your hands.",
      "Ask what is left in the middle, and how wide that middle stretch is.",
      "Uncover everything and compare: the whole spread is bigger."
],
    stepsEs: [
      "Escriban unos ocho números y ordénenlos juntos.",
      "Tape con las manos el cuarto más pequeño y el cuarto más grande.",
      "Pregunte qué queda en el medio y qué tan ancho es ese tramo central.",
      "Destapen todo y comparen: la dispersión completa es mayor."
],
    why: "The interquartile range is the middle stretch with the ends covered. Covering them with your hands makes the difference visible.",
    whyEs: "El rango intercuartílico es el tramo central con los extremos tapados. Taparlos con las manos hace visible la diferencia.",
  },
  "stat-center-vs-spread": {
    minutes: 5,
    title: "Same middle, different spread",
    titleEs: "Mismo centro, distinta dispersión",
    materials: "Paper and a pen.",
    materialsEs: "Papel y lápiz.",
    steps: [
      "Write two short lists that share a middle value, like 19, 20, 21 and 5, 20, 40.",
      "Ask what is the same about them, and agree on the middle.",
      "Ask whether the two lists look alike, and why not.",
      "Name the second thing out loud: how spread out they are."
],
    stepsEs: [
      "Escriba dos listas cortas con el mismo valor central, como 19, 20, 21 y 5, 20, 40.",
      "Pregunte qué tienen igual y pónganse de acuerdo en el centro.",
      "Pregunte si las dos listas se parecen, y por qué no.",
      "Nombren en voz alta la segunda cosa: qué tan dispersas están."
],
    why: "A center and a spread answer different questions. Two lists with the same middle can look nothing alike.",
    whyEs: "El centro y la dispersión responden preguntas distintas. Dos listas con el mismo centro pueden no parecerse en nada.",
  },
  "stat-mean-skewed-by-outlier": {
    minutes: 5,
    title: "The one that ruins the average",
    titleEs: "El que arruina el promedio",
    materials: "Paper and a pen.",
    materialsEs: "Papel y lápiz.",
    steps: [
      "Write four similar numbers, then add one wildly different one.",
      "Work out the average together and read it aloud.",
      "Ask whether that average describes most of the numbers on the page.",
      "Find the middle value instead and ask the same question."
],
    stepsEs: [
      "Escriba cuatro números parecidos y luego agregue uno muy distinto.",
      "Calculen juntos el promedio y léanlo en voz alta.",
      "Pregunte si ese promedio describe a la mayoría de los números de la hoja.",
      "Hallen el valor del medio y hagan la misma pregunta."
],
    why: "One unusual number drags an average away from the group. The middle value hardly moves, which is why it is often the fairer report.",
    whyEs: "Un número inusual arrastra el promedio lejos del grupo. El valor del medio casi no se mueve, y por eso suele ser el reporte más justo.",
  },
  "stat-frequency-vs-value": {
    minutes: 5,
    title: "Two kinds of number",
    titleEs: "Dos clases de número",
    materials: "Any chart in a newspaper, on a cereal box, or on a phone.",
    materialsEs: "Cualquier gráfica de un periódico, una caja de cereal o el teléfono.",
    steps: [
      "Find a bar chart together and point at the numbers along the bottom.",
      "Point at the numbers up the side and ask what those count.",
      "Ask one 'how many' question and have them point before they answer.",
      "Ask one 'which values' question and notice they point somewhere else."
],
    stepsEs: [
      "Busquen juntos una gráfica de barras y señalen los números de abajo.",
      "Señalen los números del costado y pregunte qué cuentan esos.",
      "Haga una pregunta de 'cuántos' y pida que señalen antes de responder.",
      "Haga una pregunta de 'cuáles valores' y noten que señalan otro lugar."
],
    why: "Every bar chart carries two kinds of number. Pointing before answering is what keeps them apart.",
    whyEs: "Toda gráfica de barras tiene dos clases de número. Señalar antes de responder es lo que los mantiene separados.",
  },
  "coord-xy-swapped": {
    minutes: 5,
    title: "Treasure on the kitchen floor",
    titleEs: "Tesoro en el piso de la cocina",
    materials: "Floor or wall tiles, or a sheet of graph paper, and a small object.",
    materialsEs: "Baldosas del piso o de la pared, o una hoja cuadriculada, y un objeto pequeño.",
    steps: [
      "Pick a corner tile and call it the starting corner.",
      "Hide the object on a tile, then give directions as two numbers only, like 'three, two'.",
      "Agree out loud before you start: the first number always counts sideways, the second always counts away from you.",
      "Swap roles. When someone lands on the wrong tile, ask which number they moved first.",
    ],
    stepsEs: [
      "Elijan una baldosa de esquina y llámenla la esquina de inicio.",
      "Esconda el objeto en una baldosa y dé las indicaciones con solo dos números, como 'tres, dos'.",
      "Acuerden en voz alta antes de empezar: el primer número siempre cuenta de lado y el segundo siempre cuenta alejándose.",
      "Cambien de papel. Cuando alguien caiga en la baldosa equivocada, pregunte cuál número movió primero.",
    ],
    why: "Two numbers only work as directions if both people agree which one goes first. That agreement is exactly what an ordered pair is.",
    whyEs: "Dos números solo sirven como indicaciones si ambas personas acuerdan cuál va primero. Ese acuerdo es toda la idea del par ordenado.",
  },
  "measure-area-perimeter-swap": {
    minutes: 5,
    title: "Ribbon it or cover it",
    titleEs: "Ponerle cinta o cubrirlo",
    materials: "A book or placemat, a piece of string, and sticky notes or playing cards.",
    materialsEs: "Un libro o mantel individual, un pedazo de cuerda y notas adhesivas o naipes.",
    steps: [
      "Pick a rectangle in the room: a book, a placemat, a floor tile.",
      "Ask what you would measure to put a ribbon around the edge, then measure it with the string.",
      "Ask what you would measure to cover the whole top, then cover it with sticky notes and count them.",
      "Say the units out loud: inches of string for the edge, whole notes for the cover.",
    ],
    stepsEs: [
      "Elija un rectángulo en la casa: un libro, un mantel individual, una baldosa.",
      "Pregunte qué medirían para ponerle una cinta alrededor del borde y midan con la cuerda.",
      "Pregunte qué medirían para cubrir toda la superficie, cúbranla con notas adhesivas y cuéntenlas.",
      "Digan las unidades en voz alta: pulgadas de cuerda para el borde, notas enteras para la superficie.",
    ],
    why: "The unit answers the question. A line around the edge, or squares covering the middle.",
    whyEs:
      "La unidad responde la pregunta. Una línea alrededor del borde o cuadrados que cubren el centro.",
  },
  "op-added-instead-of-multiplied": {
    minutes: 5,
    title: "Tell me the story first",
    titleEs: "Cuénteme la historia primero",
    materials: "Any word problem from this week's work.",
    materialsEs: "Cualquier problema con palabras del trabajo de esta semana.",
    steps: [
      "Pick one word problem and read it aloud once.",
      "Ask your student to retell it as a story with no numbers in it at all.",
      "Ask one question: are we putting together groups that are all the same size, or two different amounts?",
      "Only now choose add or multiply, and ask your student to say why out loud.",
    ],
    stepsEs: [
      "Elija un problema con palabras y léanlo en voz alta una vez.",
      "Pida a su estudiante que lo vuelva a contar como una historia, sin ningún número.",
      "Haga una sola pregunta: ¿estamos juntando grupos del mismo tamaño o dos cantidades distintas?",
      "Solo entonces elijan sumar o multiplicar, y pida que diga en voz alta por qué.",
    ],
    why: "Naming what is happening to the amount comes before choosing the operation. The story does that naming.",
    whyEs:
      "Nombrar qué le pasa a la cantidad va antes de elegir la operación. La historia hace ese trabajo.",
  },
  "op-divided-instead-of-multiplied": {
    minutes: 3,
    title: "Bigger or smaller?",
    titleEs: "¿Mayor o menor?",
    materials: "Nothing but a problem and thirty seconds.",
    materialsEs: "Nada más que un problema y treinta segundos.",
    steps: [
      "Before solving anything, ask whether the answer will be bigger or smaller than the number you started with.",
      "Ask your student to commit out loud and say why.",
      "Now solve the problem.",
      "Compare the answer with the prediction. If they disagree, check which operation was used before checking the arithmetic.",
    ],
    stepsEs: [
      "Antes de resolver nada, pregunte si la respuesta será mayor o menor que el número de partida.",
      "Pida a su estudiante que se comprometa en voz alta y diga por qué.",
      "Ahora resuelvan el problema.",
      "Comparen la respuesta con la predicción. Si no coinciden, revisen qué operación se usó antes de revisar los cálculos.",
    ],
    why: "A prediction turns a mixed-up operation into something you can catch in one second instead of at the end.",
    whyEs:
      "Una predicción convierte una operación confundida en algo que se detecta en un segundo, no al final.",
  },
  "op-multiplied-instead-of-added": {
    minutes: 5,
    title: "Same-size groups, or not?",
    titleEs: "¿Grupos del mismo tamaño o no?",
    materials: "A handful of spoons, coins or beans.",
    materialsEs: "Un puñado de cucharas, monedas o frijoles.",
    steps: [
      "Lay out three equal groups of four spoons.",
      "Ask your student to write it two ways: 4 + 4 + 4 and 3 × 4.",
      "Now lay out two piles that are not equal, say five and two, and ask what can be written for those.",
      "Say the rule out loud together: multiplying needs groups that are the same size.",
    ],
    stepsEs: [
      "Coloque tres grupos iguales de cuatro cucharas.",
      "Pida a su estudiante que lo escriba de dos maneras: 4 + 4 + 4 y 3 × 4.",
      "Ahora coloque dos montones desiguales, digamos cinco y dos, y pregunte qué se puede escribir para esos.",
      "Digan juntos la regla en voz alta: multiplicar necesita grupos del mismo tamaño.",
    ],
    why: "Multiplying is a shortcut for equal groups only. Unequal amounts have to be added.",
    whyEs:
      "Multiplicar es un atajo solo para grupos iguales. Las cantidades desiguales hay que sumarlas.",
  },
  "op-multiplied-instead-of-divided": {
    minutes: 4,
    title: "Share it out",
    titleEs: "Repártanlo",
    materials: "Twelve small items: grapes, coins, buttons.",
    materialsEs: "Doce objetos pequeños: uvas, monedas, botones.",
    steps: [
      "Count out twelve small items onto the table.",
      "Ask your student to share them fairly among four people, actually moving them into piles.",
      "Ask what just happened to the twelve: did it get bigger or smaller?",
      "Write 12 ÷ 4 = 3 and ask what each of the three numbers means on the table.",
    ],
    stepsEs: [
      "Cuente doce objetos pequeños sobre la mesa.",
      "Pida a su estudiante que los reparta en partes iguales entre cuatro personas, moviéndolos de verdad.",
      "Pregunte qué le acaba de pasar al doce: ¿se hizo mayor o menor?",
      "Escriban 12 ÷ 4 = 3 y pregunte qué significa cada uno de los tres números sobre la mesa.",
    ],
    why: "Moving the objects shows which way the amount travels, before anything is written down.",
    whyEs: "Mover los objetos muestra hacia dónde va la cantidad, antes de escribir nada.",
  },
  "op-reversed-division": {
    minutes: 4,
    title: "What is being split?",
    titleEs: "¿Qué se está repartiendo?",
    materials: "One division problem and a pencil.",
    materialsEs: "Un problema de división y un lápiz.",
    steps: [
      "Read the problem out loud together.",
      "Ask two questions in this order: what is being split up, and into how many parts?",
      "Ask your student to point at each number in the problem while answering.",
      "Write the division only after both answers have been said out loud.",
    ],
    stepsEs: [
      "Lean el problema juntos en voz alta.",
      "Haga dos preguntas en este orden: ¿qué se está repartiendo y en cuántas partes?",
      "Pida a su estudiante que señale cada número del problema mientras responde.",
      "Escriban la división solo después de decir en voz alta ambas respuestas.",
    ],
    why: "The amount being split always goes first. Saying it aloud fixes the order every time.",
    whyEs:
      "La cantidad que se reparte siempre va primero. Decirlo en voz alta fija el orden cada vez.",
  },
  "op-reversed-subtraction": {
    minutes: 5,
    title: "Walk the number line",
    titleEs: "Caminen la recta numérica",
    materials: "A ruler or a strip of tape, and two coins.",
    materialsEs: "Una regla o una tira de cinta y dos monedas.",
    steps: [
      "Lay a ruler or a strip of tape on the table as a number line.",
      "Mark both numbers from the problem with a coin each.",
      "Ask which coin you are starting from and which direction you travel.",
      "Count the steps between them and write the subtraction in that same order.",
    ],
    stepsEs: [
      "Coloque una regla o una tira de cinta sobre la mesa como recta numérica.",
      "Marque con una moneda cada uno de los dos números del problema.",
      "Pregunte desde cuál moneda comienzan y en qué dirección viajan.",
      "Cuenten los pasos entre ellas y escriban la resta en ese mismo orden.",
    ],
    why: "Subtracting is a trip from one number to another. The starting point decides the order.",
    whyEs: "Restar es un viaje de un número a otro. El punto de partida decide el orden.",
  },
  "order-of-operations-left-to-right": {
    minutes: 4,
    title: "Circle the first move",
    titleEs: "Encierre el primer paso",
    materials: "Paper and a pencil.",
    materialsEs: "Papel y lápiz.",
    steps: [
      "Write one expression from this week's work, for example 3 + 4 × 2.",
      "Before any arithmetic, ask your student to circle the part that has to happen first.",
      "Ask why that part goes first.",
      "Solve it that way, then solve it left to right on purpose, and put the two answers side by side.",
    ],
    stepsEs: [
      "Escriba una expresión del trabajo de esta semana, por ejemplo 3 + 4 × 2.",
      "Antes de calcular nada, pida a su estudiante que encierre la parte que debe hacerse primero.",
      "Pregunte por qué esa parte va primero.",
      "Resuélvanla así y luego resuélvanla de izquierda a derecha a propósito, y pongan las dos respuestas lado a lado.",
    ],
    why: "Two different answers from the same expression is what makes the rule feel worth having.",
    whyEs:
      "Dos respuestas distintas de la misma expresión es lo que hace que la regla valga la pena.",
  },
  "percent-scale-off-by-100": {
    minutes: 5,
    title: "Is that even close?",
    titleEs: "¿Eso siquiera se acerca?",
    materials: "A sale sign, a receipt, or any price.",
    materialsEs: "Un letrero de rebaja, un recibo o cualquier precio.",
    steps: [
      "Take any price and any percent you can find around the house.",
      "Ask first: what would half of that price be? What would a tenth of it be?",
      "Ask your student to say where the answer should land between those two, before computing.",
      "Now work it out, and check the answer against the range you named.",
    ],
    stepsEs: [
      "Tome cualquier precio y cualquier porcentaje que encuentre en casa.",
      "Pregunte primero: ¿cuánto sería la mitad de ese precio? ¿Y la décima parte?",
      "Pida a su estudiante que diga dónde debería caer la respuesta entre esos dos, antes de calcular.",
      "Ahora resuélvanlo y comprueben la respuesta contra el rango que nombraron.",
    ],
    why: "Half and a tenth are easy to picture, and together they catch an answer that landed a hundred times off.",
    whyEs:
      "La mitad y la décima parte son fáciles de imaginar, y juntas detectan una respuesta que quedó cien veces desviada.",
  },
  "percent-used-as-whole-number": {
    minutes: 4,
    title: "Say it per hundred",
    titleEs: "Dígalo por cada cien",
    materials: "A food label, a battery icon, or a sale tag.",
    materialsEs: "Una etiqueta de alimentos, un ícono de batería o una etiqueta de rebaja.",
    steps: [
      "Find any percent in the house: a food label, a phone battery, a sale tag.",
      "Ask your student to read it out loud as “___ out of every hundred”.",
      "Ask what that would be out of two hundred, and then out of fifty.",
      "Write the percent as a fraction over one hundred and as a decimal.",
    ],
    stepsEs: [
      "Busque cualquier porcentaje en casa: una etiqueta de alimentos, la batería del teléfono, una rebaja.",
      "Pida a su estudiante que lo lea en voz alta como “___ de cada cien”.",
      "Pregunte cuánto sería de doscientos y luego de cincuenta.",
      "Escriban el porcentaje como fracción sobre cien y como decimal.",
    ],
    why: "Hearing “per hundred” every single time keeps a percent from quietly turning into a plain number.",
    whyEs:
      "Escuchar “de cada cien” todas las veces evita que un porcentaje se convierta calladamente en un número común.",
  },
  "rate-not-per-one": {
    minutes: 5,
    title: "Per one what?",
    titleEs: "¿Por uno qué?",
    materials: "Two packaged items with a count and a price.",
    materialsEs: "Dos productos empacados con cantidad y precio.",
    steps: [
      "Grab a package with a count and a price on it: a dozen eggs, a pack of drinks.",
      "Ask what ONE of them costs, and let your student work it out.",
      "Make your student finish this sentence out loud: “____ dollars per one ____.”",
      "Do it again with a second package and decide together which is the better deal.",
    ],
    stepsEs: [
      "Tome un paquete que tenga cantidad y precio: una docena de huevos, un paquete de bebidas.",
      "Pregunte cuánto cuesta UNO solo y deje que su estudiante lo calcule.",
      "Pida que termine esta oración en voz alta: “____ dólares por un ____.”",
      "Repítanlo con un segundo paquete y decidan juntos cuál conviene más.",
    ],
    why: "Finishing the “per one what” sentence forces the unit rate to show up with its unit attached.",
    whyEs:
      "Terminar la oración “por un qué” obliga a que la tasa unitaria aparezca con su unidad puesta.",
  },
  "ratio-inverted": {
    minutes: 4,
    title: "Label before you write",
    titleEs: "Etiquete antes de escribir",
    materials: "Six forks and four spoons, or any two kinds of small objects.",
    materialsEs: "Seis tenedores y cuatro cucharas, o dos tipos de objetos pequeños.",
    steps: [
      "Put out six forks and four spoons where you can both see them.",
      "Ask your student to say the comparison in words first: forks to spoons.",
      "Write 6 to 4 with the words written underneath each number.",
      "Now ask for spoons to forks and watch the two numbers change places.",
    ],
    stepsEs: [
      "Ponga seis tenedores y cuatro cucharas donde ambos puedan verlos.",
      "Pida a su estudiante que diga primero la comparación en palabras: tenedores a cucharas.",
      "Escriban 6 a 4 con las palabras escritas debajo de cada número.",
      "Ahora pida cucharas a tenedores y observen cómo los dos números cambian de lugar.",
    ],
    why: "Words written under the numbers make the order of a ratio something you can see instead of remember.",
    whyEs:
      "Las palabras escritas debajo de los números hacen que el orden de una razón se vea, en vez de recordarse.",
  },
  "ratio-scaled-additively": {
    minutes: 5,
    title: "How many batches?",
    titleEs: "¿Cuántas tandas?",
    materials: "Any recipe from a box or a bottle, and paper.",
    materialsEs: "Cualquier receta de una caja o botella, y papel.",
    steps: [
      "Find a recipe with two amounts, like two cups of rice to four cups of water.",
      "Ask your student to make enough for twice as many people, and to say the word “twice” out loud.",
      "Have them double BOTH amounts, then read the new recipe back to you.",
      "Ask what would happen if they added two cups to each instead — would it still be the same food?",
    ],
    stepsEs: [
      "Busque una receta con dos cantidades, como dos tazas de arroz por cuatro de agua.",
      "Pida a su estudiante que haga para el doble de personas y que diga la palabra “doble” en voz alta.",
      "Pídale que duplique AMBAS cantidades y que le lea la nueva receta.",
      "Pregunte qué pasaría si en vez de eso le sumara dos tazas a cada una: ¿seguiría siendo la misma comida?",
    ],
    why: "Counting batches turns an abstract rule into something you can taste — adding to both sides quietly changes the recipe.",
    whyEs:
      "Contar tandas convierte una regla abstracta en algo que se puede probar: sumar a los dos lados cambia la receta sin avisar.",
  },
  "ratio-as-difference": {
    minutes: 4,
    title: "For every ___ there are ___",
    titleEs: "Por cada ___ hay ___",
    materials: "Two kinds of small objects — buttons, coins, or socks.",
    materialsEs: "Dos tipos de objetos pequeños: botones, monedas o calcetines.",
    steps: [
      "Set out three of one object and five of the other.",
      "Ask your student to compare them WITHOUT using the words plus or minus.",
      "Listen for the sentence “for every three ___ there are five ___.”",
      "Ask whether one single number could tell someone else what is on the table.",
    ],
    stepsEs: [
      "Ponga tres de un objeto y cinco del otro.",
      "Pida a su estudiante que los compare SIN usar las palabras más o menos.",
      "Escuche la oración “por cada tres ___ hay cinco ___.”",
      "Pregunte si un solo número podría decirle a otra persona qué hay sobre la mesa.",
    ],
    why: "Saying the comparison as a sentence keeps both numbers in the answer, where a single total or difference loses one of them.",
    whyEs:
      "Decir la comparación como oración conserva los dos números en la respuesta; un solo total o diferencia pierde uno.",
  },
  "stat-mean-vs-median": {
    minutes: 5,
    title: "Middle or share it out?",
    titleEs: "¿El del medio o repartirlo?",
    materials: "Five small slips of paper and a pencil.",
    materialsEs: "Cinco papelitos y un lápiz.",
    steps: [
      "Write five ages, prices, or shoe sizes from around the house, one per slip.",
      "Ask for the MIDDLE one: lay the slips in order and point at the one in the centre.",
      "Now ask for the average: add them and share the total evenly.",
      "Compare the two answers and ask why they are not the same.",
    ],
    stepsEs: [
      "Escriba cinco edades, precios o tallas de zapato de la casa, uno por papelito.",
      "Pida el del MEDIO: acomoden los papelitos en orden y señale el del centro.",
      "Ahora pida el promedio: súmenlos y repartan el total en partes iguales.",
      "Comparen las dos respuestas y pregunte por qué no son iguales.",
    ],
    why: "Doing both procedures side by side makes the two words mean two different actions instead of one vague idea of “typical”.",
    whyEs:
      "Hacer los dos procedimientos lado a lado hace que las dos palabras signifiquen dos acciones distintas y no una idea vaga de “típico”.",
  },
  "stat-histogram-bin-misread": {
    minutes: 4,
    title: "Which box does it go in?",
    titleEs: "¿En qué caja va?",
    materials: "Paper, a pencil, and a handful of small objects.",
    materialsEs: "Papel, lápiz y un puñado de objetos pequeños.",
    steps: [
      "Draw three boxes on a page and label them 0–9, 10–19 and 20–29.",
      "Call out numbers from around the house — prices, page numbers, ages.",
      "Ask your student to say which box each number goes in, and why, before placing an object.",
      "Count each box at the end and ask whether any number could have gone in two boxes.",
    ],
    stepsEs: [
      "Dibuje tres cajas en una hoja y rotúlelas 0–9, 10–19 y 20–29.",
      "Diga números de la casa: precios, números de página, edades.",
      "Pida a su estudiante que diga en qué caja va cada número, y por qué, antes de poner un objeto.",
      "Cuenten cada caja al final y pregunte si algún número pudo haber ido en dos cajas.",
    ],
    why: "Placing an object in exactly one box makes the rule physical: a value belongs to one interval, so the counts can never overlap.",
    whyEs:
      "Poner un objeto en una sola caja hace la regla física: un valor pertenece a un intervalo, así que los conteos nunca se traslapan.",
  },
  "sign-dropped": {
    minutes: 4,
    title: "Which side of zero?",
    titleEs: "¿De qué lado del cero?",
    materials: "Paper and a pencil.",
    materialsEs: "Papel y lápiz.",
    steps: [
      "Draw a line across a page with zero in the middle and a few numbers marked each way.",
      "Give a real situation: five degrees colder than three degrees, or owing four dollars.",
      "Ask your student to point at where the answer sits before writing anything.",
      "Write the answer with the sign first, then the number.",
    ],
    stepsEs: [
      "Dibuje una línea en la hoja con el cero en el centro y algunos números marcados a cada lado.",
      "Dé una situación real: cinco grados más frío que tres grados, o deber cuatro dólares.",
      "Pida a su estudiante que señale dónde queda la respuesta antes de escribir nada.",
      "Escriban la respuesta con el signo primero y después el número.",
    ],
    why: "Pointing at the line first makes a missing negative sign something you notice instead of something you find later.",
    whyEs:
      "Señalar primero en la recta hace que un signo negativo ausente se note en el momento y no después.",
  },
  "stat-summed-instead-of-averaged": {
    minutes: 5,
    title: "Even out the stacks",
    titleEs: "Empareje las torres",
    materials: "About sixteen coins, blocks or crackers.",
    materialsEs: "Unas dieciséis monedas, bloques o galletas.",
    steps: [
      "Build four uneven stacks: two, five, three and six.",
      "Ask your student to move pieces around until every stack is the same height, without adding or taking any away.",
      "Ask what one number now describes all four stacks.",
      "Add all the pieces, divide by four, and compare that with the height of the stacks.",
    ],
    stepsEs: [
      "Arme cuatro torres desiguales: dos, cinco, tres y seis.",
      "Pida a su estudiante que mueva piezas hasta que todas las torres tengan la misma altura, sin agregar ni quitar ninguna.",
      "Pregunte qué número describe ahora las cuatro torres.",
      "Sumen todas las piezas, dividan entre cuatro y comparen con la altura de las torres.",
    ],
    why: "The average is the even-it-out number, so it has to be a height one of the stacks could really have been.",
    whyEs:
      "El promedio es el número que empareja, así que tiene que ser una altura que una torre realmente podría haber tenido.",
  },
});

/** Used when there is no tag to go on: a real activity, never a filler. */
export const DEFAULT_KITCHEN_TABLE = Object.freeze({
  minutes: 5,
  title: "The number at dinner",
  titleEs: "El número de la cena",
  materials: "Anything on the table with a number on it.",
  materialsEs: "Cualquier cosa sobre la mesa que tenga un número.",
  steps: [
    "Pick one number you can see: a price, a serving size, a time on the clock.",
    "Ask your student what that number is counting or measuring.",
    "Ask for one thing that would change if the number doubled.",
    "Let your student ask you the same three questions about a different number.",
  ],
  stepsEs: [
    "Elija un número que puedan ver: un precio, una porción, la hora en el reloj.",
    "Pregunte a su estudiante qué cuenta o qué mide ese número.",
    "Pregunte qué cambiaría si el número se duplicara.",
    "Deje que su estudiante le haga a usted las mismas tres preguntas sobre otro número.",
  ],
  why: "Sixth graders get stronger at math by explaining what a number means, and that works at any table with any number.",
  whyEs:
    "Los estudiantes de sexto se fortalecen en matemáticas al explicar qué significa un número, y eso funciona en cualquier mesa con cualquier número.",
});

/** Curriculum default for "what is next" when there is nothing to go on. */
export const DEFAULT_NEXT_UP = Object.freeze([
  {
    title: "Family Connections: this week in math",
    titleEs: "Conexión con las familias: esta semana en matemáticas",
    path: "/curriculum/family-connections/",
    why: "The week's lesson list, the optional practice and the ways to reach Mr. Neft.",
    whyEs:
      "La lista de lecciones de la semana, la práctica opcional y las maneras de comunicarse con el maestro Neft.",
  },
  {
    title: "Optional family practice",
    titleEs: "Práctica familiar opcional",
    path: "/curriculum/family-connections/#homework-library",
    why: "Any lesson, any unit, never graded, use it only when it fits your week.",
    whyEs:
      "Cualquier lección, cualquier unidad, nunca se califica; úsela solo cuando le venga bien a su semana.",
  },
]);

/* -------------------------------------------------------------- endpoint copy
 * Sentence fragments the endpoint composes into the response. Kept here so the
 * page can render the exact same words when it is working from cache or from
 * the curriculum default.
 * ------------------------------------------------------------------------ */
export const COPY = Object.freeze({
  headline: {
    en: (name) => `${name}'s week in math`,
    es: (name) => `La semana de ${name} en matemáticas`,
  },
  headlineAnon: {
    en: "Your student's week in math",
    es: "La semana de su estudiante en matemáticas",
  },
  noteThin: {
    en: "It was a quiet week in the data. That is all this page can see, and it is not the whole story of a week. The five-minute activity underneath is still worth doing.",
    es: "Fue una semana tranquila en los datos. Eso es todo lo que esta página puede ver, y no es toda la historia de una semana. La actividad de cinco minutos de abajo sigue valiendo la pena.",
  },
  noteOffline: {
    en: "This broadcast is showing the curriculum plan rather than your student's own week. Everything on it is true and usable; it is simply not personal yet.",
    es: "Esta transmisión muestra el plan del currículo y no la semana propia de su estudiante. Todo lo que aparece es cierto y útil; simplemente todavía no es personal.",
  },
  noteFull: {
    en: "Everything here comes from what your student actually did this week.",
    es: "Todo lo que aparece aquí viene de lo que su estudiante hizo realmente esta semana.",
  },
  evidence: {
    finished: {
      en: (title) => `Worked all the way through ${title}.`,
      es: (title) => `Trabajó ${title} de principio a fin.`,
    },
    // Labels are title-cased for the chip beside them, so they are lowered
    // again when they land in the middle of one of these sentences.
    improved: {
      en: (label) => `More of the ${lowerFirst(label)} problems clicked as the week went on.`,
      es: (label) =>
        `Más problemas de ${lowerFirst(label)} le salieron bien conforme avanzó la semana.`,
    },
    steady: {
      en: (label) => `Steady and sure with ${lowerFirst(label)} all week.`,
      es: (label) => `Constante y seguro con ${lowerFirst(label)} toda la semana.`,
    },
    persisted: {
      en: (label, n) => `Stayed with ${lowerFirst(label)} across ${n} tries this week.`,
      es: (label, n) => `Siguió con ${lowerFirst(label)} durante ${n} intentos esta semana.`,
    },
  },
  nextWhy: {
    en: (family) => `More practice with ${family}.`,
    es: (family) => `Más práctica con ${family}.`,
  },
});

/** UI chrome for the page, in both languages. */
export const UI = Object.freeze({
  en: {
    lang: "en",
    skipLink: "Skip to the broadcast",
    brandTop: "6th-Grade Math",
    brandSub: "Weekly Family Broadcast",
    switchTo: "Español",
    backToFamily: "Back to Family Connections",
    gateEyebrow: "Made for one family",
    gateTitle: "A one-minute recap of your student's week.",
    gateBody:
      "Mr. Neft sends each family a private link. Open that link and this page plays a short recap of what your student worked on this week, plus one five-minute thing you can do together at the kitchen table.",
    gatePrivacy:
      "This page only ever shows one student: the one whose code is in the link. It never shows other students, never ranks students, and never shows a grade.",
    gateLabel: "Student code from your link",
    gateHint: "It looks something like RATIOS-4K7M. Ask Mr. Neft if you do not have one.",
    gateSubmit: "Play our broadcast",
    loading: "Putting your broadcast together…",
    errorTitle: "We could not open that broadcast",
    errorBody:
      "Please check the code from your link, or ask Mr. Neft to send it again. Nothing is wrong with your student's work.",
    errorBusy:
      "Too many tries from this connection just now. Please wait five minutes and try once more.",
    errorNetwork: "We could not reach the school right now. Please try again in a few minutes.",
    play: "Play",
    pause: "Pause",
    prev: "Previous",
    next: "Next",
    readAll: "Read it all at once",
    readAsStory: "Play it as a story",
    print: "Print this week",
    cardOf: (i, n) => `Card ${i} of ${n}`,
    cardDid: "What your student worked on",
    cardGrew: "Where it got stronger",
    cardStuck: "Still building",
    cardKitchen: "Five minutes at the kitchen table",
    cardNext: "What comes next",
    cardClose: "One more thing",
    minutesLabel: (m) => `${m} minutes`,
    materialsLabel: "You need",
    whyLabel: "Why this helps",
    watchLabel: "What helps most",
    classLabel: "Across the whole class",
    classNote:
      "Class-wide and anonymous, from the whole group. It says nothing about your student in particular.",
    closingTitle: "Thank you for five minutes.",
    closingBody:
      "You do not need to teach the lesson. Ask what your student notices, listen to the strategy, and encourage the effort. We will check the math at school.",
    emptyDid: "No lessons showed up in the data this week.",
    emptyGrew: "Nothing to call out yet this week. It builds up over a few weeks.",
    emptyStuck: "Nothing your student is stuck on showed up this week.",
    windowLabel: (d) => `The last ${d} days`,
    signedOff: "EduWonderLab · 6th-Grade Math",
  },
  es: {
    lang: "es",
    skipLink: "Saltar a la transmisión",
    brandTop: "Matemáticas de 6.º grado",
    brandSub: "Transmisión familiar semanal",
    switchTo: "English",
    backToFamily: "Volver a Conexión con las familias",
    gateEyebrow: "Hecho para una sola familia",
    gateTitle: "Un resumen de un minuto sobre la semana de su estudiante.",
    gateBody:
      "El maestro Neft envía a cada familia un enlace privado. Abra ese enlace y esta página reproduce un resumen corto de lo que su estudiante trabajó esta semana, además de una actividad de cinco minutos para hacer juntos en la mesa de la cocina.",
    gatePrivacy:
      "Esta página solo muestra a un estudiante: aquel cuyo código está en el enlace. Nunca muestra a otros estudiantes, nunca los clasifica y nunca muestra una calificación.",
    gateLabel: "Código del estudiante que viene en su enlace",
    gateHint: "Se parece a RATIOS-4K7M. Pregúntele al maestro Neft si no tiene uno.",
    gateSubmit: "Reproducir nuestra transmisión",
    loading: "Preparando su transmisión…",
    errorTitle: "No pudimos abrir esa transmisión",
    errorBody:
      "Revise el código de su enlace o pídale al maestro Neft que se lo envíe de nuevo. No hay ningún problema con el trabajo de su estudiante.",
    errorBusy:
      "Hubo demasiados intentos desde esta conexión hace un momento. Espere cinco minutos e inténtelo otra vez.",
    errorNetwork:
      "No pudimos comunicarnos con la escuela en este momento. Inténtelo en unos minutos.",
    play: "Reproducir",
    pause: "Pausar",
    prev: "Anterior",
    next: "Siguiente",
    readAll: "Leerlo todo de una vez",
    readAsStory: "Verlo como historia",
    print: "Imprimir esta semana",
    cardOf: (i, n) => `Tarjeta ${i} de ${n}`,
    cardDid: "En qué trabajó su estudiante",
    cardGrew: "Dónde se fortaleció",
    cardStuck: "Todavía en construcción",
    cardKitchen: "Cinco minutos en la mesa de la cocina",
    cardNext: "Qué sigue",
    cardClose: "Una cosa más",
    minutesLabel: (m) => `${m} minutos`,
    materialsLabel: "Necesita",
    whyLabel: "Por qué ayuda",
    watchLabel: "Lo que más ayuda",
    classLabel: "En todo el grupo",
    classNote: "Es de todo el grupo y anónimo. No dice nada en particular sobre su estudiante.",
    closingTitle: "Gracias por cinco minutos.",
    closingBody:
      "No necesita enseñar la lección. Pregunte qué nota su estudiante, escuche la estrategia y anime su esfuerzo. Nosotros revisamos las matemáticas en la escuela.",
    emptyDid: "Esta semana no aparecieron lecciones en los datos.",
    emptyGrew: "Todavía no hay nada que destacar esta semana. Se va acumulando en unas semanas.",
    emptyStuck: "Esta semana no apareció nada en lo que su estudiante se haya atorado.",
    windowLabel: (d) => `Los últimos ${d} días`,
    signedOff: "EduWonderLab · Matemáticas de 6.º grado",
  },
});

/** Every tag the bank covers — used by the validator and by the endpoint. */
export const TAG_IDS = Object.freeze(Object.keys(TAGS));

/**
 * Resolve a kitchen-table activity for a language.
 * Falls back to the curriculum default rather than inventing one.
 */
export function kitchenTableFor(tag, lang) {
  const a = (tag && KITCHEN_TABLE[tag]) || DEFAULT_KITCHEN_TABLE;
  return {
    title: pick(lang, a.title, a.titleEs),
    minutes: a.minutes,
    materials: pick(lang, a.materials, a.materialsEs),
    steps: (lang === "es" ? a.stepsEs : a.steps).slice(),
    why: pick(lang, a.why, a.whyEs),
  };
}
