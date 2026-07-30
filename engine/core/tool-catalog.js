// tool-catalog.js — the single source of truth for how an interactive
// manipulative PRESENTS itself to a student, a teacher, or a reviewer.
//
// The engine already knows how to *mount* every manipulative (the REGISTRY in
// interactive-visual.js). What it never had was publisher-grade metadata: a real
// product name, a plain-language purpose, how to work it, and something to try.
// Without that, a tools surface can only fall back to title-casing the config
// slug — so `area-morph` reads "Area Morph", `manip:frac-divide` reads "Frac
// Divide", and `dist-explorer` reads "Dist Explorer". Internal slugs on a
// student page are the clearest possible tell that a product is not finished.
//
// Design notes:
//   • Keyed by REGISTRY `kind`, plus `manip:<name>` for the generic manip bridge
//     (one `kind` covering 11 distinct widgets, so it needs per-widget entries).
//   • Every field is authored, never derived — a "purpose" a machine guessed from
//     a slug is worse than none.
//   • `howTo` is 2–4 imperative steps a sixth grader can follow unaided; the
//     tools surfaces render it as an ordered list.
//   • `tryThis` are open invitations, never graded questions. Interactive Tools
//     is deliberately ungraded practice space, so a prompt must never read like
//     an assessment item with a right answer to submit.
//   • Spanish (`nameEs` / `purposeEs`) mirrors the family-homework convention:
//     English always shows, Spanish stacks beneath it when the Spanish lane is
//     on. Names of tools are translated because a student scanning for a tool
//     reads the name first.
//   • `tools/interactive-tools.test.mjs` fails if any registered kind or any
//     manip authored in the 222 lesson configs is missing from this catalog, so
//     a new manipulative cannot ship nameless.

/**
 * Canonical presentation metadata per tool.
 * @type {Record<string, {name:string, nameEs?:string, purpose:string, purposeEs?:string, howTo:string[], tryThis:string[]}>}
 */
export const TOOL_CATALOG = {
  // ── Number system ────────────────────────────────────────────────────────
  "factor-tree-lab": {
    name: "Factor Tree Lab",
    nameEs: "Laboratorio de árbol de factores",
    purpose:
      "Break any number down into the prime numbers it is built from, and use two numbers' shared primes to find their GCF or LCM.",
    purposeEs:
      "Descompón cualquier número en los números primos que lo forman, y usa los primos compartidos de dos números para hallar su MCD o mcm.",
    howTo: [
      "Type a number in the box and press Build.",
      "Split each composite branch until every end of the tree is prime.",
      "Switch to the GCF or LCM mode to compare two numbers at once.",
    ],
    tryThis: [
      "Build 36 and 48. Which prime factors do they share?",
      "Find a number under 100 whose tree is only 2s.",
      "Build a prime number. What happens to the tree?",
    ],
  },
  "factor-tree": {
    name: "Fill-In Factor Tree",
    nameEs: "Árbol de factores para completar",
    purpose:
      "Finish a partly built factor tree: each blank is a branch you work out, and the tool checks it as you type.",
    purposeEs:
      "Completa un árbol de factores a medio construir: cada espacio es una rama que resuelves, y la herramienta la revisa mientras escribes.",
    howTo: [
      "Read the number at the top of the tree.",
      "Fill each blank branch with a factor pair that multiplies to the number above it.",
      "Keep going until every branch end is prime.",
    ],
    tryThis: [
      "Cover the tree and predict the prime factors before you fill it in.",
      "Write the finished tree as a multiplication sentence with exponents.",
    ],
  },
  "lcm-lab": {
    name: "Least Common Multiple Lab",
    nameEs: "Laboratorio del mínimo común múltiplo",
    purpose:
      "See two numbers' multiples side by side and spot the first value that lands in both lanes — that is the LCM.",
    purposeEs:
      "Observa los múltiplos de dos números uno al lado del otro y encuentra el primer valor que aparece en las dos filas: ese es el mcm.",
    howTo: [
      "Look at the two lanes of multiples.",
      "Find the first number that shows up in BOTH lanes.",
      "Tap it. The lab tells you whether that is really the least common multiple.",
    ],
    tryThis: [
      "Try two numbers where one is a multiple of the other. What is the LCM?",
      "Predict the LCM before you look at the lanes.",
    ],
  },
  "power-builder": {
    name: "Powers & Exponents Lab",
    nameEs: "Laboratorio de potencias y exponentes",
    purpose:
      "Turn a power like 4³ into repeated multiplication and then into a value, so the exponent stops looking like another factor.",
    purposeEs:
      "Convierte una potencia como 4³ en una multiplicación repetida y luego en un valor, para que el exponente deje de parecer otro factor.",
    howTo: [
      "Set the base and the exponent.",
      "Expand the power into repeated multiplication.",
      "Multiply it out and check the value.",
    ],
    tryThis: [
      "Compare 2⁵ and 5². Same digits — same value?",
      "Set the exponent to 1, then to 0. What happens?",
    ],
  },
  "long-division-builder": {
    name: "Partial Quotients Lab",
    nameEs: "Laboratorio de cocientes parciales",
    purpose:
      "Divide big numbers in friendly chunks: take out easy multiples of the divisor, then add the chunks up.",
    purposeEs:
      "Divide números grandes por partes: quita múltiplos fáciles del divisor y luego suma las partes.",
    howTo: [
      "Choose a multiple of the divisor that fits inside what is left.",
      "Subtract it and record that chunk of the quotient.",
      "Repeat until nothing (or a remainder) is left, then add your chunks.",
    ],
    tryThis: [
      "Solve one division two ways — big chunks, then small chunks. Same answer?",
      "Estimate the quotient first, then check how close you were.",
    ],
  },
  "decimal-columns": {
    name: "Decimal Column Lab",
    nameEs: "Laboratorio de columnas decimales",
    purpose:
      "Add or subtract decimals column by column, with the place values lined up and the carrying and regrouping done by hand.",
    purposeEs:
      "Suma o resta decimales columna por columna, con los valores posicionales alineados y llevando o reagrupando a mano.",
    howTo: [
      "Check that the decimal points are lined up.",
      "Work one column at a time, right to left.",
      "Fill the amber boxes when you carry or regroup.",
    ],
    tryThis: [
      "Try 3.4 + 0.85. Why does the 5 have no partner?",
      "Estimate the answer first, then compare.",
    ],
  },
  "decimal-product": {
    name: "Multiply Decimals Lab",
    nameEs: "Laboratorio de multiplicar decimales",
    purpose:
      "Multiply decimals in two clean moves: multiply as whole numbers, then count decimal places to place the point.",
    purposeEs:
      "Multiplica decimales en dos pasos claros: multiplica como números enteros y luego cuenta los lugares decimales para colocar el punto.",
    howTo: [
      "Ignore the decimal points and multiply as whole numbers.",
      "Count the decimal places in BOTH factors.",
      "Place the point that many places from the right.",
    ],
    tryThis: [
      "Multiply 0.4 × 0.3. Why is the answer smaller than both factors?",
      "Estimate with whole numbers first as a reasonableness check.",
    ],
  },
  "decimal-quotient": {
    name: "Divide Decimals Lab",
    nameEs: "Laboratorio de dividir decimales",
    purpose:
      "Divide by a decimal by first shifting both numbers until the divisor is whole — then it is ordinary division.",
    purposeEs:
      "Divide entre un decimal moviendo primero los dos números hasta que el divisor sea entero: después es una división común.",
    howTo: [
      "Shift the decimal point in the divisor until it is a whole number.",
      "Shift the dividend the SAME number of places.",
      "Divide, then check by multiplying back.",
    ],
    tryThis: [
      "Divide 4.5 ÷ 0.9. Why is the quotient bigger than 4.5?",
      "Multiply your quotient by the divisor to check yourself.",
    ],
  },
  "fraction-divide": {
    name: "Divide Fractions Lab",
    nameEs: "Laboratorio de dividir fracciones",
    purpose:
      "Work a fraction division one stage at a time: rewrite as improper fractions, keep–change–flip, then multiply and simplify.",
    purposeEs:
      "Trabaja una división de fracciones por etapas: reescribe como fracciones impropias, mantén–cambia–invierte, y luego multiplica y simplifica.",
    howTo: [
      "Rewrite any mixed numbers as improper fractions.",
      "Keep the first fraction, change ÷ to ×, and flip the second.",
      "Multiply across, then simplify.",
    ],
    tryThis: [
      "Divide 3 ÷ ½. Why does the answer get bigger?",
      "Say the answer as a question about equal groups.",
    ],
  },
  "number-line": {
    name: "Number Line",
    nameEs: "Recta numérica",
    purpose:
      "Place labeled values on a number line so size, order, and distance are something you can see instead of guess.",
    purposeEs:
      "Coloca valores etiquetados en una recta numérica para ver el tamaño, el orden y la distancia en vez de adivinarlos.",
    howTo: [
      "Read each labeled point you need to place.",
      "Drag it onto the tick mark that matches its value.",
      "Check the order of the points left to right.",
    ],
    tryThis: [
      "Place a value between two ticks. How do you name it?",
      "Which two points are farthest apart?",
    ],
  },
  "number-line-explorer": {
    name: "Absolute Value Explorer",
    nameEs: "Explorador del valor absoluto",
    purpose:
      "Drag a point and watch absolute value behave as distance from zero — and see a number and its opposite land the same distance out.",
    purposeEs:
      "Arrastra un punto y observa el valor absoluto como distancia desde cero, y cómo un número y su opuesto quedan a la misma distancia.",
    howTo: [
      "Drag the point along the line.",
      "Watch the value and its distance from zero change together.",
      "Find the opposite of your number and compare the two distances.",
    ],
    tryThis: [
      "Find two different numbers with the same absolute value.",
      "Which is greater: −8 or −3? Which has the greater absolute value?",
    ],
  },

  // ── Ratio, rate, percent ─────────────────────────────────────────────────
  "ratio-table-builder": {
    name: "Ratio Table Lab",
    nameEs: "Laboratorio de tablas de razones",
    purpose:
      "Scale a ratio up and down in a table so a whole family of equivalent ratios appears from one starting pair.",
    purposeEs:
      "Amplía y reduce una razón en una tabla para que aparezca toda una familia de razones equivalentes a partir de un solo par.",
    howTo: [
      "Start from the first ratio in the table.",
      "Multiply or divide BOTH numbers by the same factor to add a row.",
      "Look down the columns for the pattern.",
    ],
    tryThis: [
      "Scale the ratio to a row where one column is 1. What is that row called?",
      "Find two rows whose numbers add to a third row. Is that row equivalent too?",
    ],
  },
  "unit-rate-builder": {
    name: "Unit Rate Lab",
    nameEs: "Laboratorio de tasa unitaria",
    purpose:
      "Divide a pair of quantities to get the 'per 1' rate, and see why the unit rate is what makes two deals comparable.",
    purposeEs:
      "Divide un par de cantidades para obtener la tasa 'por 1' y ver por qué la tasa unitaria permite comparar dos ofertas.",
    howTo: [
      "Read the two quantities in the rate.",
      "Divide to find the amount for exactly 1.",
      "Say the answer with its units — 'per 1 what?'",
    ],
    tryThis: [
      "Find both unit rates for one pair (per item AND per dollar). When is each useful?",
      "Make two rates that look different but share a unit rate.",
    ],
  },
  "percent-builder": {
    name: "Percent Lab",
    nameEs: "Laboratorio de porcentajes",
    purpose:
      "Line up a percent bar against an amount bar so 'percent of a number' becomes two number lines you can read across.",
    purposeEs:
      "Alinea una barra de porcentaje con una barra de cantidad para que 'el porcentaje de un número' sea algo que se lee de un lado al otro.",
    howTo: [
      "Set the whole (100%) on the amount line.",
      "Slide to the percent you want.",
      "Read the matching amount straight across.",
    ],
    tryThis: [
      "Find 25% of 60, then 50% of 30. Why do they match?",
      "Set the percent above 100%. What does that mean here?",
    ],
  },

  // ── Expressions & equations ──────────────────────────────────────────────
  "algebra-expand": {
    name: "Distribute Lab",
    nameEs: "Laboratorio de distribución",
    purpose:
      "Expand an expression like 3(x + 4) on an area model, so distributing is a picture of two rectangles instead of a rule to recall.",
    purposeEs:
      "Desarrolla una expresión como 3(x + 4) en un modelo de área, para que distribuir sea un dibujo de dos rectángulos y no una regla que memorizar.",
    howTo: [
      "Read the factor outside the parentheses — that is the width.",
      "Fill each piece of the rectangle with its product.",
      "Add the pieces to write the expanded expression.",
    ],
    tryThis: [
      "Expand 2(x + 5), then check by letting x = 3 in both forms.",
      "Work backwards: which expression factors to give your answer?",
    ],
  },
  "combine-like-terms": {
    name: "Combine Like Terms Lab",
    nameEs: "Laboratorio de términos semejantes",
    purpose:
      "Group the x-terms and the constants separately, so simplifying stops feeling like adding unrelated things.",
    purposeEs:
      "Agrupa los términos con x y los números por separado, para que simplificar deje de parecer sumar cosas distintas.",
    howTo: [
      "Collect every term with the variable and add those.",
      "Collect the plain numbers and add those.",
      "Write the simplified expression.",
    ],
    tryThis: [
      "Simplify, then test your answer with x = 2 in both forms.",
      "Add a term that is NOT like the others. What can you do with it?",
    ],
  },
  "distributive-builder": {
    name: "Distributive Property Box Model",
    nameEs: "Modelo de caja de la propiedad distributiva",
    purpose:
      "Split one rectangle's area into two to show a(b + c) = a·b + a·c with numbers you choose.",
    purposeEs:
      "Divide el área de un rectángulo en dos para mostrar a(b + c) = a·b + a·c con los números que elijas.",
    howTo: [
      "Set the width and the two parts of the length.",
      "Find each smaller rectangle's area.",
      "Add them and compare with the whole rectangle's area.",
    ],
    tryThis: [
      "Split 7 × 12 as 7 × (10 + 2). Which is easier to do in your head?",
      "Split the same rectangle a different way. Does the total change?",
    ],
  },
  "step-solver": {
    name: "Work It Out — Step Solver",
    nameEs: "Resolver paso a paso",
    purpose:
      "Write your solution one line at a time; each line is checked for staying equivalent to the one above it, so you find your own slip.",
    purposeEs:
      "Escribe tu solución línea por línea; cada línea se revisa para confirmar que sigue siendo equivalente a la anterior, así encuentras tu propio error.",
    howTo: [
      "Do ONE operation per line.",
      "Press Check to confirm the line still means the same thing.",
      "Keep going until you reach the answer.",
    ],
    tryThis: [
      "Solve the same problem in a different order of steps.",
      "Break a step on purpose and read what the checker says.",
    ],
  },
  "equation-balance-lab": {
    name: "Equation Balance Lab",
    nameEs: "Laboratorio de la balanza de ecuaciones",
    purpose:
      "Do the same thing to BOTH sides and watch the equation change while the scale stays level — solving as keeping balance.",
    purposeEs:
      "Haz lo mismo en LOS DOS lados y observa cómo cambia la ecuación mientras la balanza sigue nivelada: resolver es mantener el equilibrio.",
    howTo: [
      "Read the equation on the scale.",
      "Pick an operation — it is applied to both sides at once.",
      "Keep going until the variable stands alone.",
    ],
    tryThis: [
      "Undo your own step. Does the scale stay balanced?",
      "Solve it in two different orders. Same solution?",
    ],
  },

  // ── Geometry & measurement ───────────────────────────────────────────────
  "area-morph": {
    name: "Area Formula Explorer",
    nameEs: "Explorador de fórmulas de área",
    purpose:
      "Drag one slider and watch a figure rearrange itself into a shape whose area you already know — that is where each area formula comes from.",
    purposeEs:
      "Mueve un control y observa cómo una figura se reorganiza en una forma cuya área ya conoces: de ahí sale cada fórmula de área.",
    howTo: [
      "Drag the slider slowly and watch the figure move.",
      "Stop when it becomes a rectangle you can measure.",
      "Compare the rectangle's area with the original figure's formula.",
    ],
    tryThis: [
      "Where does the ÷ 2 in the triangle formula come from?",
      "Change the height. Does the rearranged area still match?",
    ],
  },
  "solid-3d": {
    name: "3D Shape Explorer",
    nameEs: "Explorador de figuras en 3D",
    purpose: "Spin a solid to count its faces, edges, and vertices from every side.",
    purposeEs: "Gira un sólido para contar sus caras, aristas y vértices desde todos los lados.",
    howTo: [
      "Drag the shape to rotate it.",
      "Count faces, edges, and vertices as you turn it.",
      "Look for the faces you cannot see from the front.",
    ],
    tryThis: [
      "Count the faces twice from different angles. Same number?",
      "Which faces are congruent to each other?",
    ],
  },
  "cross-section": {
    name: "Cross Section Slicer",
    nameEs: "Cortador de secciones transversales",
    purpose:
      "Slice a solid and see the flat 2D shape the cut leaves behind — the link between a 3D figure and its net.",
    purposeEs:
      "Corta un sólido y observa la figura plana en 2D que deja el corte: la conexión entre una figura 3D y su plantilla.",
    howTo: [
      "Choose where to slice the solid.",
      "Look at the flat shape the cut makes.",
      "Try a slice in a different direction.",
    ],
    tryThis: [
      "Can you slice a rectangular prism and get a square?",
      "Which slices give the largest cross section?",
    ],
  },
  "net-folder": {
    name: "Net Folder",
    nameEs: "Plegador de plantillas",
    purpose:
      "Fold a flat net up into a solid so surface area reads as 'the total of the faces you just folded'.",
    purposeEs:
      "Dobla una plantilla plana para formar un sólido, así el área de superficie es 'el total de las caras que acabas de doblar'.",
    howTo: [
      "Study the flat net and predict the solid.",
      "Fold it and check your prediction.",
      "Find each face's area, then add them up.",
    ],
    tryThis: [
      "Which faces come in matching pairs?",
      "Unfold it. Can you find a different net for the same solid?",
    ],
  },

  // ── Data & statistics ────────────────────────────────────────────────────
  "stats-data-lab": {
    name: "Data Lab",
    nameEs: "Laboratorio de datos",
    purpose:
      "Build or edit a data set and watch mean, median, mode, range, and MAD update live over a dot plot.",
    purposeEs:
      "Crea o edita un conjunto de datos y observa cómo la media, la mediana, la moda, el rango y la DMA se actualizan en vivo sobre un diagrama de puntos.",
    howTo: [
      "Add values by tapping the line (tap a dot to remove it).",
      "Watch the measures change as the data changes.",
      "Compare the mean marker with the median marker.",
    ],
    tryThis: [
      "Add one very large value. Which measure moves more — mean or median?",
      "Build a data set where the mean and median are equal.",
    ],
  },
  "dist-explorer": {
    name: "Distribution Explorer",
    nameEs: "Explorador de distribuciones",
    purpose:
      "Build a distribution by tapping, then watch an outlier drag the mean while the median barely moves.",
    purposeEs:
      "Construye una distribución tocando la recta y observa cómo un valor extremo arrastra la media mientras la mediana casi no se mueve.",
    howTo: [
      "Tap along the number line to add data points.",
      "Watch the mean, median, and mode markers move.",
      "Add one value far from the rest and watch what happens.",
    ],
    tryThis: [
      "Which measure of center would you trust with an outlier in the data?",
      "Make a distribution with two clear clusters.",
    ],
  },
  "stat-towers": {
    name: "Data Towers",
    nameEs: "Torres de datos",
    purpose:
      "See the mean as the height you get when you level the towers, and MAD as how far each tower sits from that line.",
    purposeEs:
      "Ve la media como la altura que resulta al nivelar las torres, y la DMA como la distancia de cada torre a esa línea.",
    howTo: [
      "Look at the towers — each one is a value.",
      "Level them to find the mean height.",
      "Measure each tower's distance from the line to build MAD.",
    ],
    tryThis: [
      "Make all the towers the same height. What is the MAD?",
      "Raise one tower. Does the mean or the MAD change more?",
    ],
  },
  "box-plot-builder": {
    name: "Box Plot Builder",
    nameEs: "Constructor de diagramas de caja",
    purpose:
      "Place the five-number summary on a number line over the real data, and build the box and whiskers yourself.",
    purposeEs:
      "Coloca el resumen de cinco números sobre una recta numérica encima de los datos reales y construye la caja y los bigotes.",
    howTo: [
      "Find the minimum, Q1, median, Q3, and maximum in the data.",
      "Drag each marker onto its value.",
      "Press Check for coaching on any marker that is off.",
    ],
    tryThis: [
      "What fraction of the data sits inside the box?",
      "Which is longer — the left whisker or the right one? What does that tell you?",
    ],
  },
  "histogram-builder": {
    name: "Histogram Builder",
    nameEs: "Constructor de histogramas",
    purpose:
      "Sort data into intervals and raise each bar to its count, so a histogram becomes something you build rather than read.",
    purposeEs:
      "Agrupa datos en intervalos y sube cada barra a su cantidad, así el histograma es algo que construyes y no solo que lees.",
    howTo: [
      "Look at the interval under each bar.",
      "Count how many data values fall in that interval.",
      "Drag the bar top (or use the arrow keys) to that count.",
    ],
    tryThis: [
      "Do the bar heights add up to the number of data values?",
      "Which interval holds the most data?",
    ],
  },
  histogram: {
    name: "Data Explorer — Histogram",
    nameEs: "Explorador de datos: histograma",
    purpose:
      "Read a histogram, reveal the mean and median on top of it, then test 'what if' changes without losing the original data.",
    purposeEs:
      "Lee un histograma, muestra la media y la mediana encima y prueba cambios de 'qué pasaría si' sin perder los datos originales.",
    howTo: [
      "Read the intervals and the counts.",
      "Reveal the measures of center to see where they fall.",
      "Open the What-if sandbox to test a change (it is reversible).",
    ],
    tryThis: [
      "Which interval is the mode? Is the mean inside it?",
      "Where is the data clustered, and where is it spread out?",
    ],
  },
  "dot-plot": {
    name: "Data Explorer — Dot Plot",
    nameEs: "Explorador de datos: diagrama de puntos",
    purpose:
      "Read a dot plot, reveal mean and median on top of it, then test 'what if' changes without losing the original data.",
    purposeEs:
      "Lee un diagrama de puntos, muestra la media y la mediana encima y prueba cambios de 'qué pasaría si' sin perder los datos originales.",
    howTo: [
      "Count the dots stacked at each value.",
      "Reveal the measures of center.",
      "Open the What-if sandbox to test a change (it is reversible).",
    ],
    tryThis: ["Which value appears most often?", "Are there gaps or clusters in the data?"],
  },
  "box-plot": {
    name: "Data Explorer — Box Plot",
    nameEs: "Explorador de datos: diagrama de caja",
    purpose:
      "Read a box plot's five-number summary, reveal the measures of center, and test reversible 'what if' changes.",
    purposeEs:
      "Lee el resumen de cinco números de un diagrama de caja, muestra las medidas de centro y prueba cambios reversibles.",
    howTo: [
      "Find the minimum, Q1, median, Q3, and maximum.",
      "Reveal the measures of center.",
      "Open the What-if sandbox to test a change (it is reversible).",
    ],
    tryThis: [
      "How wide is the box? That width is the IQR.",
      "Is the median in the middle of the box, or off to one side?",
    ],
  },
  "bar-chart": {
    name: "Data Explorer — Bar Chart",
    nameEs: "Explorador de datos: gráfica de barras",
    purpose:
      "Compare categories on a bar chart, reveal the measures, and test reversible 'what if' changes to the data.",
    purposeEs:
      "Compara categorías en una gráfica de barras, muestra las medidas y prueba cambios reversibles en los datos.",
    howTo: [
      "Read each bar against the scale.",
      "Compare the tallest and shortest bars.",
      "Open the What-if sandbox to test a change (it is reversible).",
    ],
    tryThis: [
      "How many times taller is the biggest bar than the smallest?",
      "Would the story change if the scale started somewhere else?",
    ],
  },

  // ── Modeling & graphing ──────────────────────────────────────────────────
  "tape-diagram": {
    name: "Tape Diagram",
    nameEs: "Diagrama de barras",
    purpose:
      "Draw a problem as one bar cut into parts, so what is known, what is missing, and what is equal is visible before any computing.",
    purposeEs:
      "Dibuja un problema como una barra dividida en partes, para ver lo conocido, lo que falta y lo que es igual antes de calcular.",
    howTo: [
      "Read what the whole bar stands for.",
      "Tap the equal parts to count them.",
      "Match each part to a number in the problem.",
    ],
    tryThis: [
      "Cover the labels. Can you still tell what is missing?",
      "Write the equation your diagram shows.",
    ],
  },
  "coordinate-plane": {
    name: "Coordinate Plane",
    nameEs: "Plano coordenado",
    purpose:
      "Plot listed points right-then-up so ordered pairs, quadrants, and the shape a set of points makes all become visible.",
    purposeEs:
      "Marca los puntos indicados a la derecha y luego hacia arriba para ver los pares ordenados, los cuadrantes y la forma que crean los puntos.",
    howTo: [
      "Read the ordered pair: x first (right/left), y second (up/down).",
      "Tap that spot on the grid.",
      "Plot every listed point, then look at the pattern.",
    ],
    tryThis: [
      "Do your points line up straight? Would the line hit (0, 0)?",
      "Swap the x and y of one point. Where does it land?",
    ],
  },
  "line-grapher": {
    name: "Line Grapher",
    nameEs: "Graficador de rectas",
    purpose:
      "Drag one slider to change the rate in y = kx and watch the line, the table, and the equation move together.",
    purposeEs:
      "Mueve un control para cambiar la tasa en y = kx y observa cómo la recta, la tabla y la ecuación cambian juntas.",
    howTo: [
      "Drag the slider to set the rate k.",
      "Watch the line, the table, and the equation all update.",
      "Read a value off the graph and check it in the table.",
    ],
    tryThis: [
      "Make the line steeper. What happened to k?",
      "Set k to 1. What is special about that line?",
    ],
  },
  "scenario-sim": {
    name: "Scenario Simulator",
    nameEs: "Simulador de situaciones",
    purpose:
      "Change one quantity in a real situation and watch the model and the result recompute live.",
    purposeEs:
      "Cambia una cantidad en una situación real y observa cómo el modelo y el resultado se recalculan en vivo.",
    howTo: [
      "Read the situation.",
      "Drag the slider to change one quantity.",
      "Watch how the result changes with it.",
    ],
    tryThis: [
      "Double the input. Does the result double too?",
      "Find the input that makes the result a round number.",
    ],
  },

  // ── The `manip:` bridge — one kind, many widgets ──────────────────────────
  "manip:gcf-bags": {
    name: "Equal Groups (GCF) Builder",
    nameEs: "Constructor de grupos iguales (MCD)",
    purpose:
      "Split two amounts into equal groups and see which group counts work for BOTH — the largest one is the GCF.",
    purposeEs:
      "Divide dos cantidades en grupos iguales y observa cuáles funcionan para LAS DOS: el número mayor es el MCD.",
    howTo: [
      "Set the two amounts.",
      "Use − / + to change the number of groups.",
      "Watch for the group counts where both amounts split evenly with nothing left over.",
    ],
    tryThis: [
      "Find every group count that works, then name the largest.",
      "Try two amounts that share no factor but 1. What do you notice?",
    ],
  },
  "manip:number-line": {
    name: "Depth Gauge Number Line",
    nameEs: "Recta numérica de profundidad",
    purpose:
      "A vertical number line with 0 at sea level: mark values above and below and read each one's distance from zero.",
    purposeEs:
      "Una recta numérica vertical con 0 al nivel del mar: marca valores arriba y abajo y lee la distancia de cada uno desde cero.",
    howTo: [
      "Tap the line to drop a marker at the nearest whole number.",
      "Read the value and its distance from sea level.",
      "Add a few markers and read them in order.",
    ],
    tryThis: [
      "Mark −20 and 20. Which is farther from sea level?",
      "What is the distance between your lowest and highest marker?",
    ],
  },
  "manip:cube-builder": {
    name: "Cube Builder",
    nameEs: "Constructor de cubos",
    purpose:
      "Build a rectangular prism out of unit cubes and watch volume and surface area change as you resize it.",
    purposeEs:
      "Construye un prisma rectangular con cubos unitarios y observa cómo cambian el volumen y el área de superficie al cambiar su tamaño.",
    howTo: [
      "Set the length, width, and height with the steppers.",
      "Read the volume as L × W × H.",
      "Compare the surface area with the volume as you resize.",
    ],
    tryThis: [
      "Find two different prisms with the same volume. Same surface area?",
      "Double the height. Does the volume double?",
    ],
  },
  "manip:frac-divide": {
    name: "Fraction Divider",
    nameEs: "Divisor de fracciones",
    purpose:
      "Cut a whole amount into serving-sized pieces and count them — fraction division as 'how many fit?'.",
    purposeEs:
      "Divide una cantidad total en porciones y cuéntalas: dividir fracciones es '¿cuántas caben?'.",
    howTo: [
      "Set the whole amount as a fraction.",
      "Set the serving size as a fraction.",
      "Count the full pieces, then read the leftover.",
    ],
    tryThis: [
      "How many ¼-cup servings fit in 2 cups?",
      "Make a problem with a leftover piece. What does the leftover mean?",
    ],
  },
  "manip:ratio-build": {
    name: "Ratio Builder",
    nameEs: "Constructor de razones",
    purpose:
      "Build a ratio out of tiles, then scale it up to see equivalent ratios and the unit rate at the same time.",
    purposeEs:
      "Construye una razón con fichas y luego amplíala para ver razones equivalentes y la tasa unitaria a la vez.",
    howTo: [
      "Set the base ratio with the − / + steppers.",
      "Use the scale stepper to build an equivalent ratio.",
      "Read the equation, the simplified ratio, and the unit rate.",
    ],
    tryThis: [
      "Scale 2 : 3 up to a ratio with 12 in it.",
      "Which base ratios simplify to the same thing?",
    ],
  },
  "manip:fraction-bar": {
    name: "Fraction Bars",
    nameEs: "Barras de fracciones",
    purpose: "Shade two bars side by side to compare unlike fractions and spot equivalent ones.",
    purposeEs:
      "Sombrea dos barras lado a lado para comparar fracciones con distinto denominador y encontrar las equivalentes.",
    howTo: [
      "Use − / + to set the number of equal parts in each bar.",
      "Tap a bar to shade parts.",
      "Read the comparison symbol between the two bars.",
    ],
    tryThis: [
      "Make two bars with different denominators shade to the same amount.",
      "Which is greater: ⅗ or ⅔? Show it with the bars.",
    ],
  },
  "manip:percent-bar": {
    name: "Percent Bar",
    nameEs: "Barra de porcentaje",
    purpose:
      "Apply a percent to an amount on a bar so discounts, tax, and markups become visible pieces of a whole.",
    purposeEs:
      "Aplica un porcentaje a una cantidad en una barra para ver los descuentos, el impuesto y los aumentos como partes de un total.",
    howTo: [
      "Set the starting amount (the whole).",
      "Set the percent.",
      "Read the part and the new total off the bar.",
    ],
    tryThis: [
      "Take 20% off, then add 20% back. Do you return to the start?",
      "Set the percent above 100%. What does the bar show?",
    ],
  },
  "manip:algebra-tiles": {
    name: "Algebra Tiles",
    nameEs: "Fichas de álgebra",
    purpose:
      "Build an expression out of x-tiles and 1-tiles, then slide a value for x to evaluate what you built.",
    purposeEs:
      "Construye una expresión con fichas de x y fichas de 1, y luego desliza un valor de x para evaluarla.",
    howTo: [
      "Add or remove x-tiles and 1-tiles with − / +.",
      "Read the expression the tiles spell out.",
      "Slide the value of x and watch the total change.",
    ],
    tryThis: [
      "Build 3x + 5. What is it worth when x = 4?",
      "Build two different tile sets that are equal when x = 2 but not when x = 5.",
    ],
  },
  "manip:balance": {
    name: "Balance Scale",
    nameEs: "Balanza",
    purpose:
      "Set up a one-step equation on a scale and solve it by applying the inverse operation to both sides.",
    purposeEs:
      "Plantea una ecuación de un paso en una balanza y resuélvela aplicando la operación inversa a los dos lados.",
    howTo: [
      "Pick the equation form and set the numbers.",
      "Watch the scale tip while x is still unknown.",
      "Press Solve it and follow the inverse operation on both sides.",
    ],
    tryThis: [
      "Predict x before you press Solve it.",
      "Change one number. Which way does the scale tip now?",
    ],
  },
  "manip:dot-plot": {
    name: "Dot Plot Builder",
    nameEs: "Constructor de diagramas de puntos",
    purpose:
      "Tap to add data points and watch mean, median, mode, range, and MAD respond to every value you add.",
    purposeEs:
      "Toca para agregar datos y observa cómo la media, la mediana, la moda, el rango y la DMA responden a cada valor.",
    howTo: [
      "Tap a value to add a dot (tap a dot to remove it).",
      "Watch the live statistics change.",
      "Use Undo or Clear to start over.",
    ],
    tryThis: [
      "Add a value far from the others. Which statistic reacts most?",
      "Build a data set with two modes.",
    ],
  },
  "manip:coord-plot": {
    name: "Coordinate Plotter",
    nameEs: "Trazador de coordenadas",
    purpose: "Tap the grid to plot points and read each one's coordinates and quadrant.",
    purposeEs:
      "Toca la cuadrícula para marcar puntos y lee las coordenadas y el cuadrante de cada uno.",
    howTo: [
      "Tap the grid to plot a point.",
      "Read its (x, y) coordinates and quadrant.",
      "Tap a point again to remove it.",
    ],
    tryThis: [
      "Plot (3, −2) and (−2, 3). Are they the same point?",
      "Plot four points that make a rectangle.",
    ],
  },
};

/** Human phase names for the section a tool was authored into. */
export const SECTION_LABEL = {
  explore: "Explore",
  practice: "Practice",
  connect: "Connect",
  launch: "Apply",
  reflect: "Reflect",
};

/** Catalog key for a config block: `manip:<name>` for the bridge, else `kind`. */
export function catalogKey(v) {
  if (!v || typeof v !== "object") return "";
  if (v.kind === "manip") return v.manip ? `manip:${v.manip}` : "";
  return typeof v.kind === "string" ? v.kind : "";
}

function titleCase(slug) {
  return String(slug || "Interactive Tool")
    .replace(/^manip:/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Resolved presentation metadata for one authored tool block.
 *
 * `name` is the CANONICAL tool name (from the catalog) rather than the config's
 * `title`: a lesson's `title` describes that instance ("Breaking 1,344 ÷ 12 with
 * partial quotients"), which is useful as a subtitle but reads as a problem
 * statement where a tool name belongs. Both are returned so a surface can show
 * the tool's name AND what this lesson set it up to do.
 *
 * @returns {{key:string, name:string, nameEs:string, purpose:string, purposeEs:string,
 *            howTo:string[], tryThis:string[], instance:string, catalogued:boolean}}
 */
export function toolMeta(v) {
  const key = catalogKey(v);
  const entry = TOOL_CATALOG[key];
  const instance = String((v && (v.title || v.label)) || "").trim();
  return {
    key,
    name: entry?.name || instance || titleCase(key),
    nameEs: entry?.nameEs || "",
    purpose: entry?.purpose || "",
    purposeEs: entry?.purposeEs || "",
    howTo: entry?.howTo || [],
    tryThis: entry?.tryThis || [],
    // The instance line is redundant when it IS the name we're showing.
    instance: entry ? instance : "",
    catalogued: !!entry,
  };
}

export default TOOL_CATALOG;
