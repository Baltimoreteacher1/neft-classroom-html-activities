// Spanish UI strings for the "Touch & Try" labs that family-homework pages embed.
//
// Until now every lab drew English only, and the homework page told Spanish-
// reading families so ("esta herramienta ... solo está en inglés"). A lab calls
// `labT(key, en)` around each visible string. The English is passed in place, so
// the call site still reads as the English a maintainer expects, and the English
// output is byte-identical to the unpatched lab.
//
// This file is the ONE table. Every entry is [English, Spanish]. The English in
// the table must equal the English at the call site (lab-strings-es.test.mjs
// enforces it), so a copy edit cannot silently orphan its translation.
//
// Provenance: none of this Spanish has been read by a native speaker yet. Every
// string is listed in data/spanish-review-queue.json as "needs-native-review".
//
// Spanish conventions (match data/homework-*-spanish.json): US Spanish, "tú"
// form, glossary terms from engine/core/math-glossary.js (razón, tasa unitaria,
// porcentaje, mediana, ...). Numbers, symbols and units that are the same in
// both languages are left to the caller (they are not passed through labT).

/** @typedef {"en" | "es" | "bilingual"} LabMode */

/**
 * Which language the page is in. Homework pages carry `lang-mode-*` on <body>
 * (English / Español / both); every other lesson surface mirrors the saved
 * choice onto <html lang>. English is the default, never the browser guess.
 * @returns {LabMode}
 */
export function labMode() {
  if (typeof document === "undefined") return "en";
  const cls = document.body?.classList;
  if (cls?.contains("lang-mode-bilingual")) return "bilingual";
  if (cls?.contains("lang-mode-es")) return "es";
  if (cls?.contains("lang-mode-en")) return "en";
  return document.documentElement?.lang === "es" ? "es" : "en";
}

/**
 * @param {string} template
 * @param {Record<string, string | number> | undefined} vars
 */
function fill(template, vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name) =>
    Object.hasOwn(vars, name) ? String(vars[name]) : whole,
  );
}

/**
 * The string for one spot in a lab. `en` is the English exactly as the lab
 * rendered it before translation; `{name}` placeholders are filled from `vars`
 * in every language, so interpolated numbers stay the caller's.
 *
 * English page -> English. Spanish page -> Spanish. Bilingual page -> both, as
 * "English / Español" (once, when the two are the same text), because a bilingual
 * family reads the English too. A key with no Spanish yet falls back to the
 * English, never to a blank.
 *
 * @param {string} key
 * @param {string} en
 * @param {Record<string, string | number>} [vars]
 */
export function labT(key, en, vars) {
  const mode = labMode();
  if (mode === "en") return fill(en, vars);
  const es = LAB_STRINGS[key]?.[1];
  if (!es) return fill(en, vars);
  const english = fill(en, vars);
  const spanish = fill(es, vars);
  if (mode === "es" || english === spanish) return spanish;
  return `${english} / ${spanish}`;
}

/**
 * Touch & Try lab kinds (interactive-visual registry keys) whose interface is
 * localized, mapped to the lab files that draw it. A homework page keeps its
 * "this tool is English-only" note for every kind NOT listed here.
 * @type {Readonly<Record<string, readonly string[]>>}
 */
export const LAB_KIND_FILES = {
  "fraction-divide": ["fraction-divide.js"],
  "area-morph": ["area-morph.js"],
  "stats-data-lab": ["stats-data-lab.js"],
  "number-line": ["number-line.js"],
  "bar-chart": ["data-live.js"],
  "equation-balance-lab": ["equation-balance-lab.js"],
  "coordinate-plane": ["coordinate-plot-lab.js"],
  "number-line-explorer": ["number-line-explorer.js"],
  "net-folder": ["net-folder.js"],
  "unit-rate-builder": ["unit-rate-builder.js"],
  "percent-builder": ["percent-builder.js"],
  "long-division-builder": [
    "long-division-builder.js",
    "long-division-chrome.js",
    "long-division-narration.js",
    "long-division-steps.js",
  ],
  "lcm-lab": ["lcm-lab.js"],
  "box-plot-builder": ["box-plot-builder.js"],
  "prism-volume": ["prism-volume.js"],
  "power-builder": ["power-builder.js"],
  "histogram-builder": ["histogram-builder.js"],
  "factor-tree": ["factor-tree-fill.js"],
  "distributive-builder": ["distributive-builder.js"],
  "decimal-product": ["decimal-product.js"],
  "decimal-columns": ["decimal-columns.js"],
  "combine-like-terms": ["combine-like-terms.js"],
};

/** @type {Record<string, readonly [string, string]>} */
export const LAB_STRINGS = {
  // fraction-divide
  "fraction-divide.answer-aria": ["final answer", "respuesta final"],
  "fraction-divide.answer-placeholder": ["answer", "respuesta"],
  "fraction-divide.cannot-read": ["Could not read this problem.", "No se pudo leer este problema."],
  "fraction-divide.check": ["Check", "Comprobar"],
  "fraction-divide.default-title": ["Divide: {a} ÷ {b}", "Divide: {a} ÷ {b}"],
  "fraction-divide.flip-miss": [
    "Not yet — flipping a fraction swaps its top and bottom.",
    "Todavía no — invertir una fracción intercambia el numerador y el denominador.",
  ],
  "fraction-divide.hint": [
    "Keep–Change–Flip: keep the first fraction, change ÷ to ×, and flip the divisor. Type each answer as a fraction or mixed number.",
    "Mantén–Cambia–Invierte: mantén la primera fracción, cambia ÷ por × e invierte el divisor. Escribe cada respuesta como fracción o número mixto.",
  ],
  "fraction-divide.improper-ready": ["Improper fractions ready.", "Fracciones impropias listas."],
  "fraction-divide.kcf-done": ["Keep · Change · Flip.", "Mantén · Cambia · Invierte."],
  "fraction-divide.mixed-aria": ["{str} as an improper fraction", "{str} como fracción impropia"],
  "fraction-divide.mixed-hint": [
    "{str} is a mixed number — rewrite it as an improper fraction.",
    "{str} es un número mixto — escríbelo como fracción impropia.",
  ],
  "fraction-divide.mixed-miss": [
    "Multiply the whole number by the denominator, then add the numerator, for {str}.",
    "Para {str}, multiplica el número entero por el denominador y luego suma el numerador.",
  ],
  "fraction-divide.multiplied": ["Multiplied and simplified.", "Multiplicado y simplificado."],
  "fraction-divide.multiply-miss": [
    "Not yet — multiply the numerators, multiply the denominators, then simplify.",
    "Todavía no — multiplica los numeradores, multiplica los denominadores y luego simplifica.",
  ],
  "fraction-divide.not-yet": ["Not yet — {msg}", "Todavía no — {msg}"],
  "fraction-divide.pick-problem": ["Pick a problem", "Elige un problema"],
  "fraction-divide.recip-aria": ["reciprocal of the divisor", "recíproco del divisor"],
  "fraction-divide.right-flip": [
    "Right — flip {div} to {rn}/{rd}. Now multiply.",
    "Correcto — invierte {div} y queda {rn}/{rd}. Ahora multiplica.",
  ],
  "fraction-divide.show-me": ["Show me", "Muéstrame"],
  "fraction-divide.simplify-more": [
    "Correct value — simplify all the way to {ans}.",
    "Valor correcto — simplifica hasta llegar a {ans}.",
  ],
  "fraction-divide.step-1-title": [
    "Step 1 · Fractions on both sides",
    "Paso 1 · Fracciones en ambos lados",
  ],
  "fraction-divide.step-2-prompt": [
    "Change ÷ to ×, then <strong>flip the divisor</strong>. Write the divisor's reciprocal:",
    "Cambia ÷ por ×, luego <strong>invierte el divisor</strong>. Escribe el recíproco del divisor:",
  ],
  "fraction-divide.step-2-title": [
    "Step 2 · Keep · Change · Flip",
    "Paso 2 · Mantén · Cambia · Invierte",
  ],
  "fraction-divide.step-3-prompt": [
    "Multiply across, then simplify to lowest terms (use a mixed number if it's more than 1):",
    "Multiplica los numeradores y los denominadores, luego simplifica a su mínima expresión (usa un número mixto si es mayor que 1):",
  ],
  "fraction-divide.step-3-title": [
    "Step 3 · Multiply &amp; simplify",
    "Paso 3 · Multiplica y simplifica",
  ],
  "fraction-divide.thats-it": ["That's it!", "¡Eso es!"],
  "fraction-divide.type-answer": [
    "Type a fraction, whole, or mixed number.",
    "Escribe una fracción, un número entero o un número mixto.",
  ],
  "fraction-divide.whole-aria": ["{str} written over 1", "{str} escrito sobre 1"],
  "fraction-divide.whole-hint": [
    "{str} is a whole number — put a 1 under it.",
    "{str} es un número entero — pon un 1 debajo.",
  ],
  "fraction-divide.whole-miss": [
    "{str} goes over 1 — try {str}/1.",
    "{str} va sobre 1 — prueba con {str}/1.",
  ],
  "fraction-divide.yes-flip": [
    "Yes — now keep, change, flip.",
    "Sí — ahora mantén, cambia, invierte.",
  ],
  // area-morph
  "area-morph.blank": ["blank", "espacio en blanco"],
  "area-morph.composite-caption-1": [
    "A composite (L-shaped) figure — no single formula fits it. Drag the slider below.",
    "Una figura compuesta (en forma de L): ninguna fórmula sola le sirve. Arrastra el control deslizante de abajo.",
  ],
  "area-morph.composite-caption-2": [
    "Pull it apart into shapes you already know…",
    "Sepárala en figuras que ya conoces…",
  ],
  "area-morph.composite-caption-3": [
    "Two plain rectangles: {a1} + {a2} = {total} square units. Split, solve, add.",
    "Dos rectángulos sencillos: {a1} + {a2} = {total} unidades cuadradas. Divide, resuelve y suma.",
  ],
  "area-morph.figure-composite": ["composite", "figura compuesta"],
  "area-morph.figure-parallelogram": ["parallelogram", "paralelogramo"],
  "area-morph.figure-polygon": ["polygon", "polígono"],
  "area-morph.figure-trapezoid": ["trapezoid", "trapecio"],
  "area-morph.figure-triangle": ["triangle", "triángulo"],
  "area-morph.jump-to-step": ["Jump to a step", "Ir a un paso"],
  "area-morph.parallelogram-caption-1": [
    "A slanted parallelogram, base {base} and height {height}. Drag the slider below to cut and slide it.",
    "Un paralelogramo inclinado, con base {base} y altura {height}. Arrastra el control deslizante de abajo para cortarlo y deslizar la pieza.",
  ],
  "area-morph.parallelogram-caption-2": [
    "Slicing the triangle off one end and carrying it to the other…",
    "Cortamos el triángulo de un extremo y lo llevamos al otro…",
  ],
  "area-morph.parallelogram-caption-3": [
    "Same pieces, zero area lost — it IS a {B} × {H} rectangle. That is why A = b · h.",
    "Las mismas piezas, sin perder nada de área: ES un rectángulo de {B} × {H}. Por eso A = b · h.",
  ],
  "area-morph.polygon-caption-1": [
    "A regular hexagon looks hard to measure. Drag the slider below and watch what it is made of.",
    "Un hexágono regular parece difícil de medir. Arrastra el control deslizante de abajo y mira de qué está hecho.",
  ],
  "area-morph.polygon-caption-2": [
    "…it breaks into congruent triangles, all the same size.",
    "…se divide en triángulos congruentes, todos del mismo tamaño.",
  ],
  "area-morph.polygon-caption-3": [
    "Six identical triangles. Find ONE triangle's area (½ · s · h), then multiply by 6. Decomposition beats memorization.",
    "Seis triángulos idénticos. Halla el área de UN triángulo (½ · s · h) y luego multiplica por 6. Descomponer es mejor que memorizar.",
  ],
  "area-morph.predict-bigger": ["Gets bigger", "Se hace mayor"],
  "area-morph.predict-locked": [
    "Prediction locked in — now move the slider and find out.",
    "Predicción guardada. Ahora mueve el control deslizante y descúbrelo.",
  ],
  "area-morph.predict-question": [
    "Before you move it — does the AREA get bigger, smaller, or stay the same?",
    "Antes de moverla, ¿el ÁREA se hace mayor, menor o queda igual?",
  ],
  "area-morph.predict-same": ["Stays the same", "Queda igual"],
  "area-morph.predict-smaller": ["Gets smaller", "Se hace menor"],
  "area-morph.rectangle-1": ["(rectangle 1)", "(rectángulo 1)"],
  "area-morph.rectangle-2": ["(rectangle 2)", "(rectángulo 2)"],
  "area-morph.slider-label": [
    "Drag to transform the figure",
    "Arrastra para transformar la figura",
  ],
  "area-morph.square-units": ["square units", "unidades cuadradas"],
  "area-morph.step-break-apart": ["Break apart", "Sepáralo"],
  "area-morph.step-cut-slide": ["Cut & slide", "Corta y desliza"],
  "area-morph.step-hexagon": ["Hexagon", "Hexágono"],
  "area-morph.step-l-shape": ["L-shape", "Figura en L"],
  "area-morph.step-parallelogram": ["Parallelogram", "Paralelogramo"],
  "area-morph.step-rectangle": ["Rectangle", "Rectángulo"],
  "area-morph.step-rotate-a-copy": ["Rotate a copy", "Gira una copia"],
  "area-morph.step-six-triangles": ["Six triangles", "Seis triángulos"],
  "area-morph.step-split-it": ["Split it", "Divídela"],
  "area-morph.step-trapezoid": ["Trapezoid", "Trapecio"],
  "area-morph.step-triangle": ["Triangle", "Triángulo"],
  "area-morph.step-two-rectangles": ["Two rectangles", "Dos rectángulos"],
  "area-morph.svg-label": [
    "{figure} area transformation, {pct}% complete. {caption}",
    "Transformación del área, {figure}, {pct}% completa. {caption}",
  ],
  "area-morph.trapezoid-caption-1": [
    "One trapezoid: two different parallel bases, a = {baseA} and b = {baseB}. Drag the slider below.",
    "Un trapecio: dos bases paralelas distintas, a = {baseA} y b = {baseB}. Arrastra el control deslizante de abajo.",
  ],
  "area-morph.trapezoid-caption-2": [
    "An identical copy is rotating 180° to dock against it…",
    "Una copia idéntica está girando 180° para encajar con él…",
  ],
  "area-morph.trapezoid-caption-3": [
    "Together they make a parallelogram with base (a + b) = {sum}. One trapezoid is HALF of it: ½ ({A} + {B}) · {H} = {area}.",
    "Juntos forman un paralelogramo con base (a + b) = {sum}. Un trapecio es la MITAD: ½ ({A} + {B}) · {H} = {area}.",
  ],
  "area-morph.triangle-caption-1": [
    "One triangle, base {base} and height {height}. Its area formula is the mystery — drag the slider below.",
    "Un triángulo con base {base} y altura {height}. La fórmula de su área es un misterio. Arrastra el control deslizante de abajo.",
  ],
  "area-morph.triangle-caption-2": [
    "A copy of the SAME triangle is rotating 180°…",
    "Una copia del MISMO triángulo está girando 180°…",
  ],
  "area-morph.triangle-caption-3": [
    "Two identical triangles tile a parallelogram of area b · h. So ONE triangle is HALF of it: ½ · {B} · {H} = {area}.",
    "Dos triángulos idénticos forman un paralelogramo con área b · h. Entonces UN triángulo es la MITAD: ½ · {B} · {H} = {area}.",
  ],
  "area-morph.verdict-bigger": [
    "You predicted the area would get bigger. Look closely:",
    "Predijiste que el área sería mayor. Mira con atención:",
  ],
  "area-morph.verdict-same": [
    "You predicted the area would stay the same — watch why that is right:",
    "Predijiste que el área se quedaría igual. Mira por qué tienes razón:",
  ],
  "area-morph.verdict-smaller": [
    "You predicted the area would get smaller. Look closely:",
    "Predijiste que el área sería menor. Mira con atención:",
  ],
  "area-morph.watch-it": ["Watch it", "Míralo"],
  "area-morph.watch-whole": ["Watch the whole transformation", "Mira toda la transformación"],
  // stats-data-lab
  "stats-data-lab.add-value": ["+ Add value", "+ Agregar valor"],
  "stats-data-lab.clear": ["Clear", "Borrar"],
  "stats-data-lab.data": ["Data", "Datos"],
  "stats-data-lab.data-set-n": ["Data set {n}", "Conjunto de datos {n}"],
  "stats-data-lab.data-with-unit": ["Data ({unit})", "Datos ({unit})"],
  "stats-data-lab.focus-center": [
    "Three ways to describe the center. Add an outlier and watch the mean chase it while the median barely moves.",
    "Tres maneras de describir el centro. Agrega un valor atípico y observa cómo la media lo persigue mientras la mediana casi no se mueve.",
  ],
  "stats-data-lab.focus-choose": [
    "Which measure best describes this data? Add an outlier and compare: the mean gets pulled toward it, the median resists.",
    "¿Qué medida describe mejor estos datos? Agrega un valor atípico y compara: la media se jala hacia él, la mediana resiste.",
  ],
  "stats-data-lab.focus-mean": [
    "The mean is the total divided by the number of observations. Change a value and check the fair share.",
    "La media es el total dividido entre el número de observaciones. Cambia un valor y revisa el reparto equitativo.",
  ],
  "stats-data-lab.focus-median": [
    "Order the values. Find the middle value, or average the two middle values when the count is even.",
    "Ordena los valores. Halla el valor del medio, o calcula la media de los dos valores del medio cuando la cantidad es par.",
  ],
  "stats-data-lab.focus-shape": [
    "Each dot is one observation. Compare the stacks, peaks, gaps, and shape of the data.",
    "Cada punto es una observación. Compara las pilas, los picos, los espacios vacíos y la forma de los datos.",
  ],
  "stats-data-lab.focus-spread": [
    "The MAD measures spread: the average distance each value sits from the mean. Spread the data out and watch it grow.",
    "La DMA mide la dispersión: la distancia promedio de cada valor a la media. Separa más los datos y observa cómo crece.",
  ],
  "stats-data-lab.focus-variability": [
    "These are answers to a statistical question — they vary from case to case. Add or remove values and watch how spread out the data is.",
    "Estas son respuestas a una pregunta estadística: varían de un caso a otro. Agrega o quita valores y observa qué tan dispersos están los datos.",
  ],
  "stats-data-lab.m-count": ["Count", "Cantidad"],
  "stats-data-lab.m-iqr": ["IQR", "RIC"],
  "stats-data-lab.m-mad": ["MAD", "DMA"],
  "stats-data-lab.m-mean": ["Mean", "Media"],
  "stats-data-lab.m-median": ["Median", "Mediana"],
  "stats-data-lab.m-mode": ["Mode", "Moda"],
  "stats-data-lab.m-observations": ["Observations", "Observaciones"],
  "stats-data-lab.m-range": ["Range", "Rango"],
  "stats-data-lab.m-total": ["Total", "Total"],
  "stats-data-lab.marker-mean": ["mean {v}", "media {v}"],
  "stats-data-lab.marker-median": ["median {v}", "mediana {v}"],
  "stats-data-lab.mode-none": ["none", "ninguna"],
  "stats-data-lab.msg-close": [
    "The mean ({mean}) and median ({median}) are close, so the data is fairly <strong>symmetric</strong> — the mean is a good summary of the center.",
    "La media ({mean}) y la mediana ({median}) están cerca, así que los datos son bastante <strong>simétricos</strong>: la media resume bien el centro.",
  ],
  "stats-data-lab.msg-far": [
    "The mean ({mean}) and median ({median}) are far apart — a sign of an <strong>outlier or skew</strong>. When that happens the <strong>median</strong> usually describes the typical value better.",
    "La media ({mean}) y la mediana ({median}) están muy separadas: es señal de un <strong>valor atípico o sesgo</strong>. Cuando pasa eso, la <strong>mediana</strong> suele describir mejor el valor típico.",
  ],
  "stats-data-lab.msg-same": [
    "Every value is the same — there's no variability, so this wouldn't be a statistical question.",
    "Todos los valores son iguales: no hay variabilidad, así que esta no sería una pregunta estadística.",
  ],
  "stats-data-lab.msg-spread": [
    "On average each value sits <strong>{mad} {unit}</strong> from the mean. A larger MAD means the data is more spread out; a smaller MAD means it clusters near the mean.",
    "En promedio, cada valor está a <strong>{mad} {unit}</strong> de la media. Una DMA más grande significa que los datos están más dispersos; una DMA más pequeña significa que se agrupan cerca de la media.",
  ],
  "stats-data-lab.msg-varies": [
    "The values range across <strong>{range} {unit}</strong>. Because the answers vary, this is a <strong>statistical question</strong> worth collecting data on.",
    "Los valores abarcan <strong>{range} {unit}</strong>. Como las respuestas varían, esta es una <strong>pregunta estadística</strong> que vale la pena investigar con datos.",
  ],
  "stats-data-lab.new-value-label": ["New data value", "Nuevo valor de datos"],
  "stats-data-lab.no-data": ["No data — add some values.", "No hay datos: agrega algunos valores."],
  "stats-data-lab.note-mean": [
    "{total} ÷ {count} = {mean}. The mean is the fair share for each observation.",
    "{total} ÷ {count} = {mean}. La media es el reparto equitativo para cada observación.",
  ],
  "stats-data-lab.note-middle-one": ["The middle value is {v}.", "El valor del medio es {v}."],
  "stats-data-lab.note-middle-two": [
    "The two middle values are {a} and {b}. Their mean is ({a} + {b}) ÷ 2 = {med}.",
    "Los dos valores del medio son {a} y {b}. Su media es ({a} + {b}) ÷ 2 = {med}.",
  ],
  "stats-data-lab.note-ordered": ["Ordered data: {list}.", "Datos ordenados: {list}."],
  "stats-data-lab.note-shape": [
    "One dot represents one observation. Describe the peaks, gaps, and whether the two sides look similar.",
    "Un punto representa una observación. Describe los picos, los espacios vacíos y si los dos lados se ven parecidos.",
  ],
  "stats-data-lab.pick-data-set": ["Pick a data set", "Elige un conjunto de datos"],
  "stats-data-lab.plot-mean": [
    "Dot plot of the data with the mean marked as a balance point",
    "Diagrama de puntos de los datos con la media marcada como punto de equilibrio",
  ],
  "stats-data-lab.plot-median": [
    "Dot plot with the median marked",
    "Diagrama de puntos con la mediana marcada",
  ],
  "stats-data-lab.plot-shape": [
    "Dot plot with one dot for each observation",
    "Diagrama de puntos con un punto por cada observación",
  ],
  "stats-data-lab.remove-value": ["Remove {v}", "Quitar {v}"],
  "stats-data-lab.tap-to-remove": ["Tap to remove", "Toca para quitar"],
  "stats-data-lab.title": ["Data Lab", "Laboratorio de datos"],
  "stats-data-lab.value-placeholder": ["value", "valor"],
  // number-line
  "number-line.all-decimals-placed": [
    "All {total} decimals placed! 🎉 Snap landed on {value} because that tick matches the place value.",
    "¡Colocaste los {total} decimales! 🎉 El punto se ajustó a {value} porque esa marca coincide con el valor posicional.",
  ],
  "number-line.all-points-placed": [
    "All {total} points placed correctly! Each point matches its value on this number line.",
    "¡Colocaste bien los {total} puntos! Cada punto coincide con su valor en esta recta numérica.",
  ],
  "number-line.answer-is": ["The answer is {answer}.", "La respuesta es {answer}."],
  "number-line.aria-graph-closed-left": [
    "Number line: closed circle at {b}, shaded left",
    "Recta numérica: círculo cerrado en {b}, sombreado hacia la izquierda",
  ],
  "number-line.aria-graph-closed-right": [
    "Number line: closed circle at {b}, shaded right",
    "Recta numérica: círculo cerrado en {b}, sombreado hacia la derecha",
  ],
  "number-line.aria-graph-open-left": [
    "Number line: open circle at {b}, shaded left",
    "Recta numérica: círculo abierto en {b}, sombreado hacia la izquierda",
  ],
  "number-line.aria-graph-open-right": [
    "Number line: open circle at {b}, shaded right",
    "Recta numérica: círculo abierto en {b}, sombreado hacia la derecha",
  ],
  "number-line.aria-jumps": [
    "Number line from {min} to {max} with {jumps} equal jumps",
    "Recta numérica de {min} a {max} con {jumps} saltos iguales",
  ],
  "number-line.aria-range": ["Number line from {min} to {max}", "Recta numérica de {min} a {max}"],
  "number-line.aria-write-ineq": ["Write the inequality", "Escribe la desigualdad"],
  "number-line.check": ["Check", "Comprobar"],
  "number-line.check-placement": ["Check placement", "Comprobar posición"],
  "number-line.check-placement-title": ["Check Placement", "Comprobar posición"],
  "number-line.correct-answer-is": [
    "Correct! The answer is {answer}.",
    "¡Correcto! La respuesta es {answer}.",
  ],
  "number-line.correct-ineq": ["Correct! {answer}", "¡Correcto! {answer}"],
  "number-line.count-correct": ["{correct} of {total} correct.", "{correct} de {total} correctos."],
  "number-line.count-jumps": [
    "Count the jumps one at a time from the start.",
    "Cuenta los saltos uno por uno desde el inicio.",
  ],
  "number-line.diag-negative-order": [
    "On a number line, further LEFT means smaller. {target} is less than {placed}, so it belongs further to the left, not to the right.",
    "En una recta numérica, más a la IZQUIERDA significa menor. {target} es menor que {placed}, así que va más a la izquierda, no a la derecha.",
  ],
  "number-line.diag-opposite": [
    "You are the right distance from 0, but on the wrong side. {placed} and {target} are opposites — they sit the same distance from 0 in opposite directions. Which side of 0 does {target} belong on?",
    "Estás a la distancia correcta de 0, pero del lado equivocado. {placed} y {target} son opuestos: están a la misma distancia de 0, en direcciones contrarias. ¿De qué lado de 0 va {target}?",
  ],
  "number-line.diag-place-larger": [
    "Your digits are right but the size is off: {placed} is {n} times larger than {target}. Check which place each digit is in, then count the ticks again.",
    "Tus dígitos son correctos, pero el tamaño no: {placed} es {n} veces mayor que {target}. Fíjate en qué lugar está cada dígito y vuelve a contar las marcas.",
  ],
  "number-line.diag-place-smaller": [
    "Your digits are right but the size is off: {placed} is {n} times smaller than {target}. Check which place each digit is in, then count the ticks again.",
    "Tus dígitos son correctos, pero el tamaño no: {placed} es {n} veces menor que {target}. Fíjate en qué lugar está cada dígito y vuelve a contar las marcas.",
  ],
  "number-line.diag-tick-left-many": [
    "Close — you are {n} ticks to the left of {target}. Each tick is {step}. Count them from a labelled mark rather than from where you started.",
    "Casi: estás {n} marcas más a la izquierda que {target}. Cada marca vale {step}. Cuéntalas desde una marca con número, no desde donde empezaste.",
  ],
  "number-line.diag-tick-left-one": [
    "Close — you are {n} tick to the left of {target}. Each tick is {step}. Count them from a labelled mark rather than from where you started.",
    "Casi: estás {n} marca más a la izquierda que {target}. Cada marca vale {step}. Cuéntalas desde una marca con número, no desde donde empezaste.",
  ],
  "number-line.diag-tick-right-many": [
    "Close — you are {n} ticks to the right of {target}. Each tick is {step}. Count them from a labelled mark rather than from where you started.",
    "Casi: estás {n} marcas más a la derecha que {target}. Cada marca vale {step}. Cuéntalas desde una marca con número, no desde donde empezaste.",
  ],
  "number-line.diag-tick-right-one": [
    "Close — you are {n} tick to the right of {target}. Each tick is {step}. Count them from a labelled mark rather than from where you started.",
    "Casi: estás {n} marca más a la derecha que {target}. Cada marca vale {step}. Cuéntalas desde una marca con número, no desde donde empezaste.",
  ],
  "number-line.enter-answer-first": ["Enter your answer first.", "Primero escribe tu respuesta."],
  "number-line.every-decimal-right": [
    "Nice — every decimal is in the right spot.",
    "¡Muy bien! Cada decimal está en su lugar.",
  ],
  "number-line.ineq-boundary": [
    "Your inequality turns at {yours}, but the circle on the graph sits at {b}. Read the tick the circle is on first — that number is the boundary.",
    "Tu desigualdad cambia en {yours}, pero el círculo de la gráfica está en {b}. Primero lee la marca donde está el círculo: ese número es el límite.",
  ],
  "number-line.ineq-circle-filled": [
    "The circle at {b} is filled in, so {b} itself IS a solution. Is {b} {symbol} {b} true? You need the symbol that also allows equal.",
    "El círculo en {b} está relleno, así que {b} SÍ es una solución. ¿Es verdad que {b} {symbol} {b}? Necesitas el símbolo que también permite la igualdad.",
  ],
  "number-line.ineq-circle-open": [
    "The circle at {b} is open, so {b} itself is NOT a solution. Your symbol allows {b} = {b}, which the open circle rules out.",
    "El círculo en {b} está abierto, así que {b} NO es una solución. Tu símbolo permite {b} = {b}, y el círculo abierto lo descarta.",
  ],
  "number-line.ineq-two-left-closed": [
    "Two things to fix: the shading runs to the left, so the solutions are the numbers less than {b} — and the circle is closed, so {b} itself IS a solution.",
    "Hay dos cosas por corregir: el sombreado va hacia la izquierda, así que las soluciones son los números menores que {b}, y el círculo está cerrado, así que {b} SÍ es una solución.",
  ],
  "number-line.ineq-two-left-open": [
    "Two things to fix: the shading runs to the left, so the solutions are the numbers less than {b} — and the circle is open, so {b} itself is NOT a solution.",
    "Hay dos cosas por corregir: el sombreado va hacia la izquierda, así que las soluciones son los números menores que {b}, y el círculo está abierto, así que {b} NO es una solución.",
  ],
  "number-line.ineq-two-right-closed": [
    "Two things to fix: the shading runs to the right, so the solutions are the numbers greater than {b} — and the circle is closed, so {b} itself IS a solution.",
    "Hay dos cosas por corregir: el sombreado va hacia la derecha, así que las soluciones son los números mayores que {b}, y el círculo está cerrado, así que {b} SÍ es una solución.",
  ],
  "number-line.ineq-two-right-open": [
    "Two things to fix: the shading runs to the right, so the solutions are the numbers greater than {b} — and the circle is open, so {b} itself is NOT a solution.",
    "Hay dos cosas por corregir: el sombreado va hacia la derecha, así que las soluciones son los números mayores que {b}, y el círculo está abierto, así que {b} NO es una solución.",
  ],
  "number-line.ineq-way-left": [
    "You have the boundary right, but you shaded the wrong way. The ray points left, so the solutions are the numbers less than {b}. Pick a number on the shaded part and test it in your inequality.",
    "El límite está bien, pero sombreaste hacia el lado equivocado. El rayo apunta hacia la izquierda, así que las soluciones son los números menores que {b}. Elige un número de la parte sombreada y pruébalo en tu desigualdad.",
  ],
  "number-line.ineq-way-right": [
    "You have the boundary right, but you shaded the wrong way. The ray points right, so the solutions are the numbers greater than {b}. Pick a number on the shaded part and test it in your inequality.",
    "El límite está bien, pero sombreaste hacia el lado equivocado. El rayo apunta hacia la derecha, así que las soluciones son los números mayores que {b}. Elige un número de la parte sombreada y pruébalo en tu desigualdad.",
  ],
  "number-line.look-at": ["Look at {what}:", "Mira {what}:"],
  "number-line.move-dot-to": ["Move the dot to:", "Mueve el punto a:"],
  "number-line.not-yet-away": [
    "Not yet — you landed near {landed}. {value} is {delta} away. The green circle shows the snap target.",
    "Todavía no: quedaste cerca de {landed}. {value} está a {delta} de distancia. El círculo verde muestra el lugar correcto.",
  ],
  "number-line.placeholder-ineq": ["e.g. x ≥ 5", "p. ej., x ≥ 5"],
  "number-line.point-n": ["Point {n}", "Punto {n}"],
  "number-line.progress-n-of-total": ["({n} of {total})", "({n} de {total})"],
  "number-line.red-dots-not-yet": [
    "{correct} of {total} correct. The red dots are not on their values yet. Find a labelled tick near each one and count the ticks from there.",
    "{correct} de {total} correctos. Los puntos rojos todavía no están en sus valores. Busca una marca con número cerca de cada uno y cuenta las marcas desde ahí.",
  ],
  "number-line.snapped-next": [
    "Snapped to {value} — that tick matches the place value. Now the next one.",
    "Se ajustó a {value}: esa marca coincide con el valor posicional. Ahora sigue con el siguiente.",
  ],
  "number-line.snapped-to-ticks": [
    "{correct} of {total} correct. The line snapped your dots to nearby ticks — green circles show where the remaining points belong and why.",
    "{correct} de {total} correctos. La recta ajustó tus puntos a marcas cercanas: los círculos verdes muestran dónde van los puntos que faltan y por qué.",
  ],
  "number-line.task-unavailable": [
    "This number-line task is unavailable.",
    "Esta actividad de la recta numérica no está disponible.",
  ],
  "number-line.type-ineq-first": ["Type the inequality first.", "Primero escribe la desigualdad."],
  "number-line.write-it-as": [
    "Write it as a letter, a symbol, then a number — like x > {b}. Read the circle first, then the shading.",
    "Escríbela con una letra, un símbolo y luego un número, como x > {b}. Lee primero el círculo y luego el sombreado.",
  ],
  "number-line.your-answer": ["Your answer", "Tu respuesta"],
  // bar-chart
  "data-live.appears-n": ["The value {v} appears {n} times.", "El valor {v} aparece {n} veces."],
  "data-live.appears-once": ["The value {v} appears 1 time.", "El valor {v} aparece 1 vez."],
  "data-live.badge": ["Data Live", "Datos en vivo"],
  "data-live.bar": ["bar", "barra"],
  "data-live.bar-chart": ["Bar chart", "Gráfica de barras"],
  "data-live.bar-chart-aria": ["Interactive bar chart", "Gráfica de barras interactiva"],
  "data-live.bar-edit": [
    "Choose a bar, then use ▲ ▼ to change its value.",
    "Elige una barra y luego usa ▲ ▼ para cambiar su valor.",
  ],
  "data-live.bar-explore": [
    "Tap a bar to read its value and compare categories.",
    "Toca una barra para ver su valor y comparar categorías.",
  ],
  "data-live.box-aria": ["Interactive box plot", "Diagrama de caja interactivo"],
  "data-live.box-edit": [
    "Choose a handle, then nudge it with ◀ ▶. Order stays min ≤ Q1 ≤ median ≤ Q3 ≤ max.",
    "Elige un control y luego muévelo con ◀ ▶. El orden se mantiene: mín ≤ Q1 ≤ mediana ≤ Q3 ≤ máx.",
  ],
  "data-live.box-explore": [
    "Tap the box or a whisker to read what it shows. Reveal the math for the IQR and range.",
    "Toca la caja o un bigote para ver qué muestra. Muestra las matemáticas para ver el RIC y el rango.",
  ],
  "data-live.box-plot": ["Box plot", "Diagrama de caja"],
  "data-live.chg-mad": ["MAD {a} → {b}", "DMA {a} → {b}"],
  "data-live.chg-mean": ["mean {a} → {b}", "media {a} → {b}"],
  "data-live.chg-median": ["median {a} → {b}", "mediana {a} → {b}"],
  "data-live.chg-none": [
    "The data changed, but the mean, median and MAD all stayed the same.",
    "Los datos cambiaron, pero la media, la mediana y la DMA quedaron igual.",
  ],
  "data-live.chg-spread": [
    "The typical distance from the mean changed while the middle value did not.",
    "La distancia típica a la media cambió, pero el valor del medio no.",
  ],
  "data-live.count": ["Count", "Cantidad"],
  "data-live.decrease": ["Decrease", "Disminuir"],
  "data-live.dot-aria": ["Interactive dot plot", "Diagrama de puntos interactivo"],
  "data-live.dot-edit": [
    "Tap the number line to add a dot; tap a dot to remove it.",
    "Toca la recta numérica para agregar un punto; toca un punto para quitarlo.",
  ],
  "data-live.dot-explore": [
    "Tap a stack to read how many. Press “Reveal the math” to see the mean vs. median.",
    "Toca una pila para ver cuántos hay. Presiona “Mostrar las matemáticas” para ver la media y la mediana.",
  ],
  "data-live.dot-plot": ["Dot plot", "Diagrama de puntos"],
  "data-live.greatest": ["Greatest", "Mayor"],
  "data-live.handle-max": ["Max", "Máx"],
  "data-live.handle-med": ["Med", "Med"],
  "data-live.handle-min": ["Min", "Mín"],
  "data-live.hist-explore": [
    "Tap an interval to read its frequency. Reveal the math to name the shape.",
    "Toca un intervalo para ver su frecuencia. Muestra las matemáticas para nombrar la forma.",
  ],
  "data-live.hist-read": [
    "The interval {label} has a frequency of {value}.",
    "El intervalo {label} tiene una frecuencia de {value}.",
  ],
  "data-live.histogram": ["Histogram", "Histograma"],
  "data-live.histogram-aria": ["Interactive histogram", "Histograma interactivo"],
  "data-live.increase": ["Increase", "Aumentar"],
  "data-live.intervals": ["Intervals", "Intervalos"],
  "data-live.iqr": ["IQR", "RIC"],
  "data-live.least": ["Least", "Menor"],
  "data-live.mad": ["MAD", "DMA"],
  "data-live.marker-mean": ["mean {v}", "media {v}"],
  "data-live.marker-median": ["median {v}", "mediana {v}"],
  "data-live.max": ["Max", "Máx"],
  "data-live.mean": ["Mean", "Media"],
  "data-live.measures": ["Measures", "Medidas"],
  "data-live.median": ["Median", "Mediana"],
  "data-live.min": ["Min", "Mín"],
  "data-live.modal-interval": ["Modal interval", "Intervalo modal"],
  "data-live.mode": ["Mode", "Moda"],
  "data-live.name-max": ["max", "máx"],
  "data-live.name-median": ["median", "mediana"],
  "data-live.name-min": ["min", "mín"],
  "data-live.none": ["none", "ninguna"],
  "data-live.range": ["Range", "Rango"],
  "data-live.reset": ["Reset data", "Reiniciar datos"],
  "data-live.reset-note": [
    "Data reset to the original.",
    "Los datos volvieron a los valores originales.",
  ],
  "data-live.reveal": ["Reveal the math", "Mostrar las matemáticas"],
  "data-live.shape": ["Shape", "Forma"],
  "data-live.shape-left": ["skewed left", "sesgado a la izquierda"],
  "data-live.shape-right": ["skewed right", "sesgado a la derecha"],
  "data-live.shape-sym": ["roughly symmetric", "casi simétrico"],
  "data-live.shape-uniform": ["uniform", "uniforme"],
  "data-live.that-category": ["That category", "Esa categoría"],
  "data-live.tip-box": [
    "The box holds the middle 50% of the data, from Q1 {a} to Q3 {b}.",
    "La caja contiene el 50% central de los datos, de Q1 {a} a Q3 {b}.",
  ],
  "data-live.tip-lower": [
    "Lower whisker: the bottom 25% of the data, from {a} to {b}.",
    "Bigote inferior: el 25% más bajo de los datos, de {a} a {b}.",
  ],
  "data-live.tip-upper": [
    "Upper whisker: the top 25% of the data, from {a} to {b}.",
    "Bigote superior: el 25% más alto de los datos, de {a} a {b}.",
  ],
  "data-live.total": ["Total", "Total"],
  "data-live.what-if": ["What if?", "¿Y si…?"],
  // equation-balance-lab
  "equation-balance-lab.applied": [
    "Applied <strong>{note}</strong> to both sides — still balanced. ",
    "Aplicaste <strong>{note}</strong> a ambos lados: sigue en equilibrio. ",
  ],
  "equation-balance-lab.cannot-read": [
    "Could not read that equation.",
    "No se pudo leer esa ecuación.",
  ],
  "equation-balance-lab.intro": [
    "Whatever you do to one side, do to the other — that keeps the scale balanced. Choose an operation and a number to peel away everything next to the variable until it stands alone.",
    "Lo que le hagas a un lado, hazlo también al otro: así la balanza se mantiene en equilibrio. Elige una operación y un número para quitar todo lo que está junto a la variable hasta que quede sola.",
  ],
  "equation-balance-lab.no-zero": [
    "You can't multiply or divide both sides by 0.",
    "No puedes multiplicar ni dividir ambos lados por 0.",
  ],
  "equation-balance-lab.number": ["Number", "Número"],
  "equation-balance-lab.op-add": ["＋ Add to both sides", "＋ Sumar a ambos lados"],
  "equation-balance-lab.op-divide": ["÷ Divide both sides", "÷ Dividir ambos lados"],
  "equation-balance-lab.op-multiply": ["× Multiply both sides", "× Multiplicar ambos lados"],
  "equation-balance-lab.op-subtract": ["－ Subtract from both sides", "－ Restar de ambos lados"],
  "equation-balance-lab.operations": ["Operations", "Operaciones"],
  "equation-balance-lab.pick-equation": ["Pick an equation", "Elige una ecuación"],
  "equation-balance-lab.progress-coef-closer": [
    "Closer: the coefficient moved from {from} to {to}. ",
    "Te acercas: el coeficiente pasó de {from} a {to}. ",
  ],
  "equation-balance-lab.progress-coef-one": [
    "{v} now has a coefficient of 1 — it stands alone. ",
    "{v} ahora tiene un coeficiente de 1: queda sola. ",
  ],
  "equation-balance-lab.progress-coef-wrong": [
    "Legal, but further from the goal: {v}'s coefficient moved from {from} to {to}, and you need it to be 1. ",
    "Es válido, pero te aleja de la meta: el coeficiente de {v} pasó de {from} a {to}, y necesitas que sea 1. ",
  ],
  "equation-balance-lab.progress-const-closer": [
    "Closer: the number beside {v} went from {from} to {to}. ",
    "Te acercas: el número junto a {v} pasó de {from} a {to}. ",
  ],
  "equation-balance-lab.progress-const-gone": [
    "The number is gone from the {v} side — that is what you wanted. ",
    "El número ya no está en el lado de {v}: eso era lo que querías. ",
  ],
  "equation-balance-lab.progress-const-wrong": [
    "Both sides stayed equal, so that move was legal — but it went the wrong way: the number beside {v} grew from {from} to {to}. To clear {from}, apply its inverse. ",
    "Los dos lados siguieron iguales, así que el paso fue válido, pero te alejó: el número junto a {v} creció de {from} a {to}. Para quitar {from}, usa su operación inversa. ",
  ],
  "equation-balance-lab.progress-no-change": [
    "Still balanced, but nothing about the equation changed. ",
    "Sigue en equilibrio, pero la ecuación no cambió. ",
  ],
  "equation-balance-lab.scale-aria": [
    "Balance scale for {left} equals {right}",
    "Balanza para {left} igual a {right}",
  ],
  "equation-balance-lab.solved": [
    "🎉 <strong>Solved!</strong> The variable is alone: <strong>{v} = {sol}</strong>. Every move kept both sides equal, so the scale stayed balanced. Substitute {sol} back into the original equation to prove it.",
    "🎉 <strong>¡Resuelto!</strong> La variable quedó sola: <strong>{v} = {sol}</strong>. Cada paso mantuvo los dos lados iguales, así que la balanza siguió en equilibrio. Sustituye {sol} en la ecuación original para comprobarlo.",
  ],
  "equation-balance-lab.start-over": ["Start over", "Empezar de nuevo"],
  "equation-balance-lab.stepped-back": ["Stepped back one move.", "Retrocediste un paso."],
  "equation-balance-lab.title": [
    "⚖️ Equation Balance Lab",
    "⚖️ Laboratorio de la balanza de ecuaciones",
  ],
  "equation-balance-lab.type-number": [
    "Type a number in the box first, then choose an operation.",
    "Primero escribe un número en el cuadro y luego elige una operación.",
  ],
  "equation-balance-lab.undo": ["↩ Undo", "↩ Deshacer"],
  "equation-balance-lab.value-aria": [
    "Value to apply to both sides",
    "Valor que se aplica a ambos lados",
  ],
  "equation-balance-lab.whats-left": [
    "What's left to remove from the {v} side?",
    "¿Qué falta quitar del lado de {v}?",
  ],
  // coordinate-plane
  "coordinate-plot-lab.all-plotted": ["All points plotted!", "¡Marcaste todos los puntos!"],
  "coordinate-plot-lab.aria-plane": [
    "Coordinate plane. Tap to plot each listed point.",
    "Plano de coordenadas. Toca para marcar cada punto de la lista.",
  ],
  "coordinate-plot-lab.hint": [
    "Tap the grid to plot each point in the list. Go right for x, then up for y.",
    "Toca la cuadrícula para marcar cada punto de la lista. Ve a la derecha para x y luego hacia arriba para y.",
  ],
  "coordinate-plot-lab.not-in-list": [
    "You tapped ({gx}, {gy}) — that isn't one of the points in the list. Go right for x, then up for y.",
    "Tocaste ({gx}, {gy}): ese punto no está en la lista. Ve a la derecha para x y luego hacia arriba para y.",
  ],
  "coordinate-plot-lab.plotted-to-go": [
    "Plotted ({gx}, {gy}). {left} to go.",
    "Marcaste ({gx}, {gy}). Por marcar: {left}.",
  ],
  // number-line-explorer
  "number-line-explorer.aria-plot": ["Number line explorer", "Explorador de la recta numérica"],
  "number-line-explorer.distance-many": [
    "<b>{a}</b> is <b>{abs}</b> units from zero, so <b>|{a}| = {abs}</b>.",
    "<b>{a}</b> está a <b>{abs}</b> unidades de cero, así que <b>|{a}| = {abs}</b>.",
  ],
  "number-line-explorer.distance-one": [
    "<b>{a}</b> is <b>{abs}</b> unit from zero, so <b>|{a}| = {abs}</b>.",
    "<b>{a}</b> está a <b>{abs}</b> unidad de cero, así que <b>|{a}| = {abs}</b>.",
  ],
  "number-line-explorer.equal": ["the two points are equal.", "los dos puntos son iguales."],
  "number-line-explorer.farther": [
    "But |{a}| = {absA} and |{b}| = {absB}, so <b>{far}</b> is farther from zero.",
    "Pero |{a}| = {absA} y |{b}| = {absB}, así que <b>{far}</b> está más lejos de cero.",
  ],
  "number-line-explorer.greater": [
    "<b>{g}</b> is greater because it sits farther to the right.",
    "<b>{g}</b> es mayor porque está más a la derecha.",
  ],
  "number-line-explorer.intro-absolute": [
    "Drag the point along the line. Its absolute value is its distance from zero — see the segment light up, and find its opposite on the other side.",
    "Arrastra el punto por la recta. Su valor absoluto es su distancia a cero: mira cómo se ilumina el segmento y encuentra su opuesto al otro lado.",
  ],
  "number-line-explorer.intro-compare": [
    "Drag both points. The number farther to the right is greater — and watch how a number can be less than another yet be farther from zero.",
    "Arrastra los dos puntos. El número que está más a la derecha es mayor; fíjate en que un número puede ser menor que otro y aun así estar más lejos de cero.",
  ],
  "number-line-explorer.opposite": ["opposite (not draggable)", "opuesto (no se puede arrastrar)"],
  "number-line-explorer.opposite-at": [
    "opposite (not draggable) at {v}",
    "opuesto (no se puede arrastrar) en {v}",
  ],
  "number-line-explorer.opposite-note": [
    "Its opposite is <b>{opp}</b> — the same distance from zero, on the other side. Opposites always have the <em>same</em> absolute value.",
    "Su opuesto es <b>{opp}</b>: está a la misma distancia de cero, pero del otro lado. Los opuestos siempre tienen el <em>mismo</em> valor absoluto.",
  ],
  "number-line-explorer.point": ["point", "punto"],
  "number-line-explorer.point-a": ["point A", "punto A"],
  "number-line-explorer.point-a-at": ["point A at {v}", "punto A en {v}"],
  "number-line-explorer.point-at": ["point at {v}", "punto en {v}"],
  "number-line-explorer.point-b": ["point B", "punto B"],
  "number-line-explorer.point-b-at": ["point B at {v}", "punto B en {v}"],
  "number-line-explorer.same-distance": [
    "They are the same distance from zero: |{a}| = |{b}| = {abs}.",
    "Están a la misma distancia de cero: |{a}| = |{b}| = {abs}.",
  ],
  "number-line-explorer.tip": [
    "drag a point, or focus it and use ← →",
    "arrastra un punto, o selecciónalo y usa ← →",
  ],
  "number-line-explorer.title": ["Number Line Explorer", "Explorador de la recta numérica"],
  // net-folder
  "net-folder.a-cube": ["a cube", "un cubo"],
  "net-folder.a-rectangular-prism": ["a rectangular prism", "un prisma rectangular"],
  "net-folder.a-square-pyramid": ["a square pyramid", "una pirámide cuadrada"],
  "net-folder.check": ["Check", "Comprobar"],
  "net-folder.correct": ["Correct!", "¡Correcto!"],
  "net-folder.explode": ["💥 Explode Net", "💥 Separar caras"],
  "net-folder.explode-title": [
    "Deconstruct 3D faces in spatial view",
    "Separa las caras del sólido 3D en la vista espacial",
  ],
  "net-folder.fold-aria": [
    "Fold the net into a solid",
    "Pliega el desarrollo plano para formar un sólido",
  ],
  "net-folder.fold-label": ["Fold the net:", "Pliega el desarrollo plano:"],
  "net-folder.folded-live": [
    "The net has folded into {solid}.",
    "El desarrollo plano se plegó y formó {solid}.",
  ],
  "net-folder.nice-fold": [
    "Nice fold! The net closes into {solid}.",
    "¡Bien plegado! El desarrollo plano se cierra y forma {solid}.",
  ],
  "net-folder.not-quite": [
    "Not quite — fold the net all the way and look at the faces again.",
    "Todavía no. Pliega el desarrollo plano por completo y observa las caras otra vez.",
  ],
  "net-folder.open-pro": ["Open NetFold Pro 3D Studio", "Abrir el estudio 3D NetFold Pro"],
  "net-folder.stage-label": [
    "Net of {solid} that folds into a 3D solid",
    "Desarrollo plano de {solid} que se pliega y forma un sólido 3D",
  ],
  // unit-rate-builder
  "unit-rate-builder.alt-title": ["{b} per 1 {a}:", "{b} por 1 {a}:"],
  "unit-rate-builder.alternative": ["Alternative", "Otra forma"],
  "unit-rate-builder.divide-both": [
    "Divide both parts by the bottom number ({b}):",
    "Divide las dos partes entre el número de abajo ({b}):",
  ],
  "unit-rate-builder.divide-both-by": ["Divide both by {a}:", "Divide los dos entre {a}:"],
  "unit-rate-builder.explain": [
    "<strong>How to find a Unit Rate:</strong> Write the rate as a fraction, divide both parts (top and bottom) by the bottom number, and write your unit rate in fraction form over 1!",
    "<strong>Cómo hallar una tasa unitaria:</strong> Escribe la tasa como fracción, divide las dos partes (la de arriba y la de abajo) entre el número de abajo y escribe tu tasa unitaria en forma de fracción sobre 1.",
  ],
  "unit-rate-builder.find": ["Find unit rate →", "Hallar tasa unitaria →"],
  "unit-rate-builder.fraction": ["Fraction:", "Fracción:"],
  "unit-rate-builder.hint": [
    "A <strong>unit rate</strong> tells you how much for just <strong>one</strong>. Type the two amounts and divide to find each per-1 rate.",
    "Una <strong>tasa unitaria</strong> te dice cuánto hay por solo <strong>uno</strong>. Escribe las dos cantidades y divide para hallar cada tasa por 1.",
  ],
  "unit-rate-builder.per": ["per", "por"],
  "unit-rate-builder.per-one": ["{rate} {a} per 1 {b}", "{rate} {a} por 1 {b}"],
  "unit-rate-builder.quick-pick": ["Quick-pick rates", "Tasas para elegir rápido"],
  "unit-rate-builder.rate-fraction": ["Rate as a Fraction:", "La tasa como fracción:"],
  "unit-rate-builder.step-1": ["Step 1", "Paso 1"],
  "unit-rate-builder.step-2": ["Step 2", "Paso 2"],
  "unit-rate-builder.step-3": ["Step 3", "Paso 3"],
  "unit-rate-builder.title": ["Unit Rate Lab", "Laboratorio de tasa unitaria"],
  "unit-rate-builder.unit-rate-over-1": [
    "Unit Rate in fraction form over 1:",
    "Tasa unitaria en forma de fracción sobre 1:",
  ],
  // percent-builder
  "percent-builder.chip": ["{p}% of {w}", "{p}% de {w}"],
  "percent-builder.chip-off": ["{p}% of {w} off", "{p}% de {w} de descuento"],
  "percent-builder.chip-on": ["{p}% of {w} added", "{p}% de {w} sumado"],
  "percent-builder.eqn": [
    "{pct}% of {whole} = {pct}/100 × {whole} = <strong>{part}</strong>",
    "{pct}% de {whole} = {pct}/100 × {whole} = <strong>{part}</strong>",
  ],
  "percent-builder.eqn-step-1": [
    "Step 1 — {pct}% of {whole} = {pct}/100 × {whole} = <strong>{part}</strong>",
    "Paso 1 — {pct}% de {whole} = {pct}/100 × {whole} = <strong>{part}</strong>",
  ],
  "percent-builder.explain": [
    "Move {pct}% of the way along the line: {pct}% is the same fraction as {pct}/100, so you take {pct}/100 of {whole}.",
    "Avanza {pct}% del camino sobre la recta: {pct}% es la misma fracción que {pct}/100, así que tomas {pct}/100 de {whole}.",
  ],
  "percent-builder.explain-off": [
    "A discount comes off the original price, so the answer must be <strong>less</strong> than {whole}.",
    "Un descuento se quita del precio original, así que la respuesta debe ser <strong>menor</strong> que {whole}.",
  ],
  "percent-builder.explain-on": [
    "Tax, a tip, and markup go on top of the original price, so the answer must be <strong>more</strong> than {whole}.",
    "El impuesto, la propina y el aumento de precio se suman al precio original, así que la respuesta debe ser <strong>mayor</strong> que {whole}.",
  ],
  "percent-builder.find": ["Find it →", "Hallarlo →"],
  "percent-builder.finished": [
    "The finished answer is {total} — not {part}, which is only the amount you found in step 1.",
    "La respuesta final es {total}, no {part}, que es solo la cantidad que hallaste en el paso 1.",
  ],
  "percent-builder.hint": [
    '"Percent" means "out of 100." Type a percent and a whole to find that part of the number.',
    '"Por ciento" significa "de cada 100". Escribe un porcentaje y un total para hallar esa parte del número.',
  ],
  "percent-builder.hint-apply": [
    "Finding the percent is only step 1. Pick what the problem does with that amount — a discount comes <strong>off</strong> the price, while tax, a tip, and markup go <strong>on</strong> top.",
    "Hallar el porcentaje es solo el paso 1. Elige qué hace el problema con esa cantidad: un descuento se <strong>quita</strong> del precio, mientras que el impuesto, la propina y el aumento de precio se <strong>suman</strong>.",
  ],
  "percent-builder.of": ["% of", "% de"],
  "percent-builder.op-off": ["take it OFF (discount, sale)", "quitarlo (descuento, oferta)"],
  "percent-builder.op-on": [
    "add it ON (tax, tip, markup)",
    "sumarlo (impuesto, propina, aumento de precio)",
  ],
  "percent-builder.op-part": ["just the part", "solo la parte"],
  "percent-builder.percent": ["Percent", "Porcentaje"],
  "percent-builder.percent-aria": ["Percent (0 to 100)", "Porcentaje (de 0 a 100)"],
  "percent-builder.quick-pick": ["Quick-pick problems", "Problemas para elegir rápido"],
  "percent-builder.step-2": [
    "Step 2 — {whole} {verb} {part} = <strong>{total}</strong>",
    "Paso 2 — {whole} {verb} {part} = <strong>{total}</strong>",
  ],
  "percent-builder.svg-aria": [
    "Double number line: {pct} percent of {whole} is {part}",
    "Recta numérica doble: {pct} por ciento de {whole} es {part}",
  ],
  "percent-builder.then": ["Then", "Luego"],
  "percent-builder.then-aria": [
    "What the problem does with that amount",
    "Qué hace el problema con esa cantidad",
  ],
  "percent-builder.title": ["Percent of a Number Lab", "Laboratorio de porcentaje de un número"],
  "percent-builder.title-apply": ["Percent Problem Lab", "Laboratorio de problemas de porcentaje"],
  "percent-builder.whole": ["Whole", "Total"],
  "percent-builder.whole-aria": ["The whole number", "El número total"],
  // long-division-builder
  "long-division-builder.added-multiply": [
    "That is what you get by ADDING. This step multiplies. ",
    "Eso es lo que sale al SUMAR. Este paso multiplica. ",
  ],
  "long-division-builder.added-subtract": [
    "That is what you get by ADDING. This step subtracts. ",
    "Eso es lo que sale al SUMAR. Este paso resta. ",
  ],
  "long-division-builder.all-divided": [
    "✓ Every digit is divided — the division is finished.",
    "✓ Se dividieron todos los dígitos — la división está terminada.",
  ],
  "long-division-builder.answer-label": ["{label} — your answer", "{label} — tu respuesta"],
  "long-division-builder.board-digits": [
    "Quotient digits written so far: {digits}.",
    "Dígitos del cociente escritos hasta ahora: {digits}.",
  ],
  "long-division-builder.board-none": [
    "No quotient digits written yet.",
    "Todavía no se ha escrito ningún dígito del cociente.",
  ],
  "long-division-builder.board-summary": [
    "Long division: {dividend} divided by {divisor}. ",
    "División larga: {dividend} dividido entre {divisor}. ",
  ],
  "long-division-builder.both-moved": [
    '<span class="ldl-shift-done">✓ Both points moved {places}:</span> ',
    '<span class="ldl-shift-done">✓ Moviste los dos puntos {places}:</span> ',
  ],
  "long-division-builder.bring-btn": ["Bring down the {digit} ↓", "Bajar el {digit} ↓"],
  "long-division-builder.cannot-divide": [
    "That problem cannot be divided. Try different numbers.",
    "No se puede dividir ese problema. Prueba con otros números.",
  ],
  "long-division-builder.cannot-divide-why": [
    "That problem cannot be divided: {why}.",
    "No se puede dividir ese problema: {why}.",
  ],
  "long-division-builder.check-back": [
    "Check by multiplying back:",
    "Comprueba con la operación inversa:",
  ],
  "long-division-builder.coach-bringdown": [
    "Bring down the very next digit of the dividend and write it beside what is left, making one new number to divide.",
    "Baja el siguiente dígito del dividendo y escríbelo junto a lo que quedó, para formar un número nuevo que dividir.",
  ],
  "long-division-builder.coach-divide": [
    "Try skip-counting by {v}: {ladder}… Stop at the last one that is not past {current}, and count how many {v}s that took — that count is the digit.",
    "Prueba contando de {v} en {v}: {ladder}… Detente en el último número que no se pase de {current} y cuenta cuántas veces usaste {v} — esa cantidad es el dígito.",
  ],
  "long-division-builder.coach-multiply": [
    "Multiply the digit you just wrote above the bar by the divisor {v}. If it helps, add {v} to itself that many times.",
    "Multiplica el dígito que acabas de escribir arriba de la barra por el divisor {v}. Si te ayuda, suma {v} consigo mismo esa cantidad de veces.",
  ],
  "long-division-builder.coach-subtract": [
    "Subtract what you just wrote ({product}) from the number above it ({current}). Line the digits up in their columns first.",
    "Resta lo que acabas de escribir ({product}) del número que está arriba ({current}). Primero alinea los dígitos en sus columnas.",
  ],
  "long-division-builder.cycle-complete": [
    '<b class="ldl-stepname">Cycle complete.</b> Every digit has been divided, so there is nothing left to bring down — the last difference is the remainder.',
    '<b class="ldl-stepname">Ciclo completo.</b> Ya se dividieron todos los dígitos, así que no queda nada por bajar — la última diferencia es el residuo.',
  ],
  "long-division-builder.cycle-done": [
    "Cycle {n} complete — there are still digits to divide, so REPEAT the cycle: divide again.",
    "Ciclo {n} completo — todavía quedan dígitos por dividir, así que REPITE el ciclo: divide otra vez.",
  ],
  "long-division-builder.cycle-of": ["Cycle {n} of {total}", "Ciclo {n} de {total}"],
  "long-division-builder.cycle-restarts": ["↻ Cycle restarts.", "↻ El ciclo vuelve a empezar."],
  "long-division-builder.difference-too-big": [
    "A difference of {value} is not smaller than the divisor {v}, so something is off. ",
    "Una diferencia de {value} no es menor que el divisor {v}, así que algo anda mal. ",
  ],
  "long-division-builder.divisor-moved": [
    '<span class="ldl-shift-done">✓ Divisor moved {places}:</span> ',
    '<span class="ldl-shift-done">✓ Moviste el divisor {places}:</span> ',
  ],
  "long-division-builder.enter-number": ["Enter a number.", "Escribe un número."],
  "long-division-builder.facts-for": [
    "Multiplication Facts for {d}:",
    "Tabla de multiplicar del {d}:",
  ],
  "long-division-builder.frame-count": ["{n} of {total}", "{n} de {total}"],
  "long-division-builder.move-dividend-btn": [
    "Move the dividend {places} →",
    "Mover el dividendo {places} →",
  ],
  "long-division-builder.move-divisor-btn": ["Move the divisor →", "Mover el divisor →"],
  "long-division-builder.n-places": ["{n} places", "{n} lugares"],
  "long-division-builder.no-problem": [
    "No problem set up yet.",
    "Todavía no hay ningún problema preparado.",
  ],
  "long-division-builder.not-yet": ["Not yet. {why}{tail}", "Todavía no. {why}{tail}"],
  "long-division-builder.note-bringdown": [
    "Pull the next digit straight down.",
    "Baja directamente el siguiente dígito.",
  ],
  "long-division-builder.note-divide": [
    "Write the digit above the place you are working in.",
    "Escribe el dígito arriba del lugar en el que estás trabajando.",
  ],
  "long-division-builder.note-multiply": [
    "Write the product under the working number.",
    "Escribe el producto debajo del número con el que trabajas.",
  ],
  "long-division-builder.note-subtract": ["Draw the line and subtract.", "Traza la línea y resta."],
  "long-division-builder.now-whole": [
    " — now it is a whole-number divisor, so the cycle works exactly the same.",
    " — ahora el divisor es un número entero, así que el ciclo funciona exactamente igual.",
  ],
  "long-division-builder.one-digit": [
    "This step is one digit, 0 to 9. ",
    "Este paso es un solo dígito, del 0 al 9. ",
  ],
  "long-division-builder.one-place": ["1 place", "1 lugar"],
  "long-division-builder.pause": ["⏸ Pause", "⏸ Pausa"],
  "long-division-builder.places-label": ["places", "lugares"],
  "long-division-builder.point-moved": [
    '<span class="ldl-shift-done">✓ Point moved {places}:</span> ',
    '<span class="ldl-shift-done">✓ Se movió el punto {places}:</span> ',
  ],
  "long-division-builder.prompt-move-dividend": [
    "Now move the dividend the same number of places, then the cycle begins.",
    "Ahora mueve el dividendo la misma cantidad de lugares y después empieza el ciclo.",
  ],
  "long-division-builder.prompt-move-divisor": [
    "First make the divisor a whole number, then the cycle begins.",
    "Primero convierte el divisor en un número entero y después empieza el ciclo.",
  ],
  "long-division-builder.repeat": ["↻ repeat", "↻ repetir"],
  "long-division-builder.result-exact": [
    "{shown} is exactly <b>{quotient}</b> — nothing left over.",
    "{shown} es exactamente <b>{quotient}</b> — no sobra nada.",
  ],
  "long-division-builder.result-remainder": [
    "{shown} is <b>{quotient}</b> with <b>{remainder}</b> left over.",
    "{shown} es <b>{quotient}</b> con <b>{remainder}</b> de residuo.",
  ],
  "long-division-builder.rounded-down": [
    "It does not come out even, so this quotient is rounded down at that last place.",
    "No sale exacto, así que este cociente se redondea hacia abajo en ese último lugar.",
  ],
  "long-division-builder.step-1-ask": [
    "<b>Step 1 — MOVE THE DIVISOR.</b> The divisor <b>{divisor}</b> is not a whole number. How many places to the right must its decimal point move to make it whole?",
    "<b>Paso 1 — MUEVE EL DIVISOR.</b> El divisor <b>{divisor}</b> no es un número entero. ¿Cuántos lugares a la derecha debe moverse su punto decimal para que sea un número entero?",
  ],
  "long-division-builder.step-2": [
    "<b>Step 2 — MOVE THE DIVIDEND.</b> Move <b>{dividend}</b> the same {places} to the right, so the answer does not change.",
    "<b>Paso 2 — MUEVE EL DIVIDENDO.</b> Mueve <b>{dividend}</b> {places} a la derecha, igual que el divisor, para que la respuesta no cambie.",
  ],
  "long-division-builder.step-done": [
    "✓ {label} done. Next: {next}.",
    "✓ Paso completo: {label}. Sigue: {next}.",
  ],
  "long-division-builder.step-heading": [
    '<b class="ldl-stepname">Step {n} — {label}:</b> ',
    '<b class="ldl-stepname">Paso {n} — {label}:</b> ',
  ],
  "long-division-builder.too-big": [
    "{value} × {v} = {product}, and that is bigger than {current}. Choose a smaller digit. ",
    "{value} × {v} = {product}, y eso es mayor que {current}. Elige un dígito menor. ",
  ],
  "long-division-builder.too-small": [
    "{value} × {v} = {product}, which leaves {left} — another {v} still fits. Choose a bigger digit. ",
    "{value} × {v} = {product}, y sobran {left} — todavía cabe otro {v}. Elige un dígito mayor. ",
  ],
  "long-division-builder.type-answer": [
    "Type your answer for this step first.",
    "Primero escribe tu respuesta para este paso.",
  ],
  "long-division-builder.type-places": [
    "Type how many places, then press Move the divisor.",
    "Escribe cuántos lugares y luego presiona Mover el divisor.",
  ],
  "long-division-builder.watch-again": ["Watch it again", "Verlo otra vez"],
  "long-division-builder.watch-mode": [
    "Watch mode: press Next step, or Play to let it run.",
    "Modo observar: presiona Siguiente paso, o Reproducir para que avance solo.",
  ],
  "long-division-builder.watch-step-0": [
    "<b>Step 0 — MOVE THE POINT.</b> The divisor <b>{divisor}</b> is not a whole number. Slide the point {places} to the right in <em>both</em> numbers, then divide as usual.",
    "<b>Paso 0 — MUEVE EL PUNTO.</b> El divisor <b>{divisor}</b> no es un número entero. Desliza el punto {places} a la derecha en <em>los dos</em> números y luego divide como siempre.",
  ],
  "long-division-builder.whole-places": [
    "Use a whole number of places, like 1 or 2.",
    "Usa un número entero de lugares, como 1 o 2.",
  ],
  "long-division-builder.work-again": ["Work it again", "Resolverlo otra vez"],
  "long-division-builder.wrong-places": [
    "Moving {places} does not make {divisor} a whole number. Count the digits after its decimal point.",
    "Mover {places} no hace que {divisor} sea un número entero. Cuenta los dígitos que hay después de su punto decimal.",
  ],
  "long-division-builder.your-turn": [
    "Your turn — same problem, and you write every number this time.",
    "Te toca a ti — el mismo problema, y esta vez tú escribes cada número.",
  ],
  "long-division-chrome.back": ["← Back", "← Atrás"],
  "long-division-chrome.badge-s": ["S", "R"],
  "long-division-chrome.banner-label": [
    "Algorithm steps: Divide, Multiply, Subtract, Bring down",
    "Pasos del algoritmo: Dividir, Multiplicar, Restar, Bajar",
  ],
  "long-division-chrome.board-label": ["Long division notation", "Notación de la división larga"],
  "long-division-chrome.bring-down": ["Bring down ↓", "Bajar ↓"],
  "long-division-chrome.check": ["Check", "Comprobar"],
  "long-division-chrome.chip-bring-down": ["Bring down", "Bajar"],
  "long-division-chrome.chip-divide": ["Divide", "Dividir"],
  "long-division-chrome.chip-multiply": ["Multiply", "Multiplicar"],
  "long-division-chrome.chip-subtract": ["Subtract", "Restar"],
  "long-division-chrome.clear": ["Clear", "Borrar"],
  "long-division-chrome.dividend": ["Dividend", "Dividendo"],
  "long-division-chrome.divisor": ["Divisor", "Divisor"],
  "long-division-chrome.fact-helper": ["💡 Fact Helper", "💡 Ayuda de tablas"],
  "long-division-chrome.fact-helper-title": [
    "Show multiplication facts helper",
    "Mostrar la ayuda con la tabla de multiplicar",
  ],
  "long-division-chrome.keypad-label": [
    "Interactive Number Keypad",
    "Teclado numérico interactivo",
  ],
  "long-division-chrome.next-step": ["Next step →", "Siguiente paso →"],
  "long-division-chrome.play": ["▶ Play", "▶ Reproducir"],
  "long-division-chrome.playback-label": ["Playback", "Reproducción"],
  "long-division-chrome.presets-label": ["Quick-pick problems", "Problemas para elegir rápido"],
  "long-division-chrome.replay": ["↻ Replay", "↻ Otra vez"],
  "long-division-chrome.set-up": ["Set up this problem", "Preparar este problema"],
  "long-division-chrome.strip-label": ["The four steps of the cycle", "Los cuatro pasos del ciclo"],
  "long-division-chrome.you-try": ["Now you try this one →", "Ahora prueba tú este →"],
  "long-division-chrome.your-answer": ["Your answer", "Tu respuesta"],
  "long-division-narration.bringdown": [
    "Pull the next digit, {brought}, straight down beside the {difference} to make {made}. That finishes cycle {n} — now REPEAT the cycle from the top: divide {made} by {v}.",
    "Baja directamente el siguiente dígito, {brought}, junto al {difference} para formar {made}. Con esto termina el ciclo {n} — ahora REPITE el ciclo desde el principio: divide {made} entre {v}.",
  ],
  "long-division-narration.divide-digit": [
    "How many {v}s fit into {current}? {digit}, because {digit} × {v} = {product}, and {next} × {v} = {bigger} would be too big. Write {digit} above the {column}.",
    "¿Cuántos {v} caben en {current}? {digit}, porque {digit} × {v} = {product}, y {next} × {v} = {bigger} sería demasiado grande. Escribe {digit} arriba del {column}.",
  ],
  "long-division-narration.divide-zero": [
    "How many {v}s fit into {current}? None — {v} is bigger than {current}. Write 0 above the {column} and keep going, because that 0 holds the place.",
    "¿Cuántos {v} caben en {current}? Ninguno — {v} es mayor que {current}. Escribe 0 arriba del {column} y sigue, porque ese 0 guarda el lugar.",
  ],
  "long-division-narration.finish-decimal": [
    "There is nothing left to bring down at this place and {remainder} is still left over, so {shown} is about {quotient} — the quotient is cut off at that last place.",
    "No queda nada por bajar en este lugar y todavía sobra {remainder}, así que {shown} es aproximadamente {quotient} — el cociente se corta en ese último lugar.",
  ],
  "long-division-narration.finish-exact": [
    "There is nothing left to bring down and the last difference is 0, so the division is exact: {shown} = {quotient}. Check it by multiplying back: {check}.",
    "No queda nada por bajar y la última diferencia es 0, así que la división es exacta: {shown} = {quotient}. Compruébalo con la operación inversa: {check}.",
  ],
  "long-division-narration.finish-remainder": [
    "There is nothing left to bring down, so the last difference IS the remainder: {shown} = {quotient} remainder {remainder}. Check it by multiplying back: {check}.",
    "No queda nada por bajar, así que la última diferencia ES el residuo: {shown} = {quotient} residuo {remainder}. Compruébalo con la operación inversa: {check}.",
  ],
  "long-division-narration.finished": ["Finished", "Terminado"],
  "long-division-narration.move-point": ["Move the point", "Mover el punto"],
  "long-division-narration.multiply": [
    "{digit} × {v} = {product}. Write {product} under the {current} — that is how much of the {current} is used up by {groups} of {v}.",
    "{digit} × {v} = {product}. Escribe {product} debajo del {current} — eso es cuánto del {current} usan {groups} de {v}.",
  ],
  "long-division-narration.n-groups": ["{n} groups", "{n} grupos"],
  "long-division-narration.n-places": ["{n} places", "{n} lugares"],
  "long-division-narration.one-group": ["1 group", "1 grupo"],
  "long-division-narration.one-place": ["1 place", "1 lugar"],
  "long-division-narration.shift": [
    "The divisor {divisor} is not a whole number, so slide the point {places} to the right in BOTH numbers: {dividend} ÷ {divisor} becomes {workingDividend} ÷ {workingDivisor}. The answer does not change, and now the cycle runs exactly as it does with whole numbers.",
    "El divisor {divisor} no es un número entero, así que desliza el punto {places} a la derecha en LOS DOS números: {dividend} ÷ {divisor} se convierte en {workingDividend} ÷ {workingDivisor}. La respuesta no cambia, y ahora el ciclo funciona igual que con los números enteros.",
  ],
  "long-division-narration.step-0-headline": ["Step 0 — MOVE THE POINT", "Paso 0 — MOVER EL PUNTO"],
  "long-division-narration.step-headline": ["Step {n} — {label}", "Paso {n} — {label}"],
  "long-division-narration.subtract": [
    "{current} − {product} = {difference}. The {difference} left over is smaller than {v}, which is how you know {digit} was the right digit — if {difference} were {v} or more, another {v} would still fit.",
    "{current} − {product} = {difference}. El {difference} que sobra es menor que {v}, y así sabes que {digit} fue el dígito correcto — si {difference} fuera {v} o más, todavía cabría otro {v}.",
  ],
  "long-division-steps.badge-s": ["S", "R"],
  "long-division-steps.bringdown-hint": [
    "Pull the {digit} straight down next to {difference} to make the new number to divide.",
    "Baja el {digit} directamente junto al {difference} para formar el nuevo número que se va a dividir.",
  ],
  "long-division-steps.bringdown-prompt": [
    "Bring down the next digit: {digit}.",
    "Baja el siguiente dígito: {digit}.",
  ],
  "long-division-steps.divide-by-zero": [
    "You cannot divide by 0 — no number of empty groups will ever fill a number. Try a divisor of 1 or more.",
    "No se puede dividir entre 0 — ninguna cantidad de grupos vacíos llenará jamás un número. Prueba con un divisor de 1 o más.",
  ],
  "long-division-steps.divide-hint-skip": [
    "Skip-count: {divisor}, {double}, {triple}, … Take the biggest one that is still {current} or less. The answer is one digit (0–9).",
    "Cuenta de {divisor} en {divisor}: {divisor}, {double}, {triple}, … Toma el más grande que todavía sea {current} o menos. La respuesta es un solo dígito (0–9).",
  ],
  "long-division-steps.divide-hint-zero": [
    "{divisor} is bigger than {current}, so no whole {divisor} fits yet. Write 0 here and keep going.",
    "{divisor} es mayor que {current}, así que todavía no cabe ningún {divisor} completo. Escribe 0 aquí y sigue.",
  ],
  "long-division-steps.divide-prompt": [
    "How many {divisor}s fit into {current}?",
    "¿Cuántos {divisor} caben en {current}?",
  ],
  "long-division-steps.dividend-nan": [
    "“{typed}” is not a number. Use digits only, like 754.",
    "“{typed}” no es un número. Usa solo dígitos, como 754.",
  ],
  "long-division-steps.dividend-negative": [
    "Use a dividend of 0 or more — this lab divides positive numbers.",
    "Usa un dividendo de 0 o más — este laboratorio divide números positivos.",
  ],
  "long-division-steps.dividend-too-long": [
    "That dividend has {count} digits. Use {max} or fewer so the whole board still fits on the screen.",
    "Ese dividendo tiene {count} dígitos. Usa {max} o menos para que todo el tablero quepa en la pantalla.",
  ],
  "long-division-steps.divisor-bigger-notice": [
    "{divisor} is bigger than {dividend}, so the quotient starts with 0 and the whole {dividend} is left over. That is a real answer — watch what the algorithm does with it.",
    "{divisor} es mayor que {dividend}, así que el cociente empieza con 0 y sobra todo el {dividend}. Es una respuesta real — mira qué hace el algoritmo con ella.",
  ],
  "long-division-steps.divisor-floors-to-zero": [
    "This lab is set to whole numbers, so {typed} would become 0 — and nothing can be divided by 0. Type a divisor of 1 or more.",
    "Este laboratorio usa números enteros, así que {typed} se volvería 0 — y nada se puede dividir entre 0. Escribe un divisor de 1 o más.",
  ],
  "long-division-steps.divisor-nan": [
    "“{typed}” is not a number. Use digits only, like 6.",
    "“{typed}” no es un número. Usa solo dígitos, como 6.",
  ],
  "long-division-steps.divisor-negative": [
    "Use a divisor of 1 or more — this lab divides positive numbers.",
    "Usa un divisor de 1 o más — este laboratorio divide números positivos.",
  ],
  "long-division-steps.divisor-too-long": [
    "That divisor has {count} digits. Use {max} or fewer so the whole board still fits on the screen.",
    "Ese divisor tiene {count} dígitos. Usa {max} o menos para que todo el tablero quepa en la pantalla.",
  ],
  "long-division-steps.label-bringdown": ["Bring Down", "Bajar"],
  "long-division-steps.label-divide": ["Divide", "Dividir"],
  "long-division-steps.label-multiply": ["Multiply", "Multiplicar"],
  "long-division-steps.label-subtract": ["Subtract", "Restar"],
  "long-division-steps.multiply-hint": [
    "Multiply the digit you just wrote, {digit}, by the divisor {divisor}. Write the product under {current}.",
    "Multiplica el dígito que acabas de escribir, {digit}, por el divisor {divisor}. Escribe el producto debajo del {current}.",
  ],
  "long-division-steps.multiply-prompt": [
    "Multiply: {digit} × {divisor} = ?",
    "Multiplica: {digit} × {divisor} = ?",
  ],
  "long-division-steps.need-dividend": [
    "Type a dividend first — the number being divided.",
    "Escribe primero un dividendo — el número que se divide.",
  ],
  "long-division-steps.need-divisor": [
    "Type a divisor first — the number you are dividing by.",
    "Escribe primero un divisor — el número entre el que vas a dividir.",
  ],
  "long-division-steps.subtract-hint": [
    "Take {product} away from {current}. The difference must be smaller than the divisor {divisor} — if it is not, the digit you chose was too small.",
    "Quítale {product} a {current}. La diferencia debe ser menor que el divisor {divisor} — si no lo es, el dígito que elegiste era demasiado pequeño.",
  ],
  "long-division-steps.subtract-prompt": [
    "Subtract: {current} − {product} = ?",
    "Resta: {current} − {product} = ?",
  ],
  "long-division-steps.whole-numbers-notice": [
    "Heads up: this lab is set to whole numbers, so {dividend} ÷ {divisor} is worked as {wholeDividend} ÷ {wholeDivisor}.",
    "Ojo: este laboratorio usa números enteros, así que {dividend} ÷ {divisor} se resuelve como {wholeDividend} ÷ {wholeDivisor}.",
  ],
  // lcm-lab
  "lcm-lab.chip": ["LCM({a}, {b})", "mcm({a}, {b})"],
  "lcm-lab.clear": ["Clear", "Borrar"],
  "lcm-lab.count-by": ["Count by {n}", "Cuenta de {n} en {n}"],
  "lcm-lab.default-title": [
    "Find the least common multiple of {a} and {b}.",
    "Halla el mínimo común múltiplo de {a} y {b}.",
  ],
  "lcm-lab.first-match": [
    "The first match in both lanes is {target}.",
    "La primera coincidencia en ambos carriles es {target}.",
  ],
  "lcm-lab.intro": [
    "Count by each number. Click the FIRST value that shows up in BOTH lanes — that's the LCM.",
    "Cuenta de salto en salto con cada número. Toca el PRIMER valor que aparece en AMBOS carriles: ese es el mínimo común múltiplo (mcm).",
  ],
  "lcm-lab.not-smallest": [
    "{value} is a common multiple, but not the <strong>smallest</strong> — look for an earlier match in both lanes.",
    "{value} es un múltiplo común, pero no el <strong>menor</strong>: busca una coincidencia anterior en ambos carriles.",
  ],
  "lcm-lab.one-lane": [
    "{value} is only in the “count by {n}” lane. The LCM has to appear in <strong>both</strong> lanes.",
    "{value} solo está en el carril “cuenta de {n} en {n}”. El mcm tiene que aparecer en <strong>ambos</strong> carriles.",
  ],
  "lcm-lab.pick-problem": ["Pick a problem", "Elige un problema"],
  "lcm-lab.result": ["LCM({a}, {b}) = {target}", "mcm({a}, {b}) = {target}"],
  "lcm-lab.show-me": ["Show me", "Muéstrame"],
  "lcm-lab.yes": [
    "🎉 <strong>Yes!</strong> {target} is the first number in both lanes.",
    "🎉 <strong>¡Sí!</strong> {target} es el primer número que está en ambos carriles.",
  ],
  // box-plot-builder
  "box-plot-builder.check": ["Check my box plot", "Comprobar mi diagrama de caja"],
  "box-plot-builder.check-colon": ["Check:", "Revisa:"],
  "box-plot-builder.data": ["Data", "Datos"],
  "box-plot-builder.data-set-n": ["Data set {n}", "Conjunto de datos {n}"],
  "box-plot-builder.data-with-unit": ["Data ({unit})", "Datos ({unit})"],
  "box-plot-builder.drag-tip": [
    "drag a handle, or focus it and use ← →",
    "arrastra un control, o selecciónalo y usa ← →",
  ],
  "box-plot-builder.handle-aria": ["{label} handle", "Control {label}"],
  "box-plot-builder.handle-max": ["Max", "Máx"],
  "box-plot-builder.handle-med": ["Med", "Med"],
  "box-plot-builder.handle-min": ["Min", "Mín"],
  "box-plot-builder.handle-valuetext": ["{label} at {v}", "{label} en {v}"],
  "box-plot-builder.hint-max": [
    "Max should sit on the largest data value — look at the rightmost dot.",
    "Máx debe quedar sobre el valor más grande de los datos: mira el punto que está más a la derecha.",
  ],
  "box-plot-builder.hint-med": [
    "Med is the middle of the ordered list. Count in from both ends at the same time; with an even count, it's halfway between the two middle values.",
    "Med es el centro de la lista ordenada. Cuenta desde los dos extremos al mismo tiempo; si la cantidad es par, queda a mitad de camino entre los dos valores del medio.",
  ],
  "box-plot-builder.hint-min": [
    "Min should sit on the smallest data value — look at the leftmost dot.",
    "Mín debe quedar sobre el valor más pequeño de los datos: mira el punto que está más a la izquierda.",
  ],
  "box-plot-builder.hint-q1": [
    "Q1 is the median of the LOWER half (don't include the median itself when the count is odd).",
    "Q1 es la mediana de la mitad INFERIOR (no incluyas la mediana misma cuando la cantidad es impar).",
  ],
  "box-plot-builder.hint-q3": [
    "Q3 is the median of the UPPER half (don't include the median itself when the count is odd).",
    "Q3 es la mediana de la mitad SUPERIOR (no incluyas la mediana misma cuando la cantidad es impar).",
  ],
  "box-plot-builder.intro": [
    "Build the box plot yourself: sort the data, then drag Min, Q1, Med, Q3, and Max into place on the number line. Check when you think all five are set.",
    "Construye el diagrama de caja por tu cuenta: ordena los datos y luego arrastra Mín, Q1, Med, Q3 y Máx a su lugar en la recta numérica. Comprueba cuando creas que los cinco están listos.",
  ],
  "box-plot-builder.n-of-5": [
    "<strong>{n} of 5 placed correctly.</strong> ",
    "<strong>{n} de 5 en su lugar correcto.</strong> ",
  ],
  "box-plot-builder.pick-data-set": ["Pick a data set", "Elige un conjunto de datos"],
  "box-plot-builder.plot-aria": [
    "Number line with data dots and your box plot",
    "Recta numérica con los puntos de datos y tu diagrama de caja",
  ],
  "box-plot-builder.sort": ["Sort the data →", "Ordenar los datos →"],
  "box-plot-builder.tip-sort": [
    "Tip: sort the data first — it makes every one of these easier. ",
    "Consejo: ordena primero los datos; así todo esto se hace más fácil. ",
  ],
  "box-plot-builder.title": ["Box Plot Builder", "Constructor de diagramas de caja"],
  "box-plot-builder.win-read": [
    "Now read your own plot: the <strong>range</strong> is {max} − {min} = <strong>{range}</strong>, and the <strong>IQR</strong> (the box) is {q3} − {q1} = <strong>{iqr}</strong> — the spread of the middle half of the data.",
    "Ahora lee tu propio diagrama: el <strong>rango</strong> es {max} − {min} = <strong>{range}</strong>, y el <strong>rango intercuartílico (RIC)</strong> (la caja) es {q3} − {q1} = <strong>{iqr}</strong>, la dispersión de la mitad central de los datos.",
  ],
  "box-plot-builder.win-title": [
    "<strong>That's the box plot!</strong> All five values are placed correctly. ",
    "<strong>¡Ese es el diagrama de caja!</strong> Los cinco valores están en su lugar correcto. ",
  ],
  // prism-volume
  "prism-volume.base-area": [
    "Base area  B = l × w = {L} × {W} = {B} square {unit}",
    "Área de la base  B = l × w = {L} × {W} = {B} {unit}²",
  ],
  "prism-volume.decrease": [
    "decrease {name} by {amount} {unit}",
    "disminuir {name} en {amount} {unit}",
  ],
  "prism-volume.height": ["Height", "Alto"],
  "prism-volume.increase": [
    "increase {name} by {amount} {unit}",
    "aumentar {name} en {amount} {unit}",
  ],
  "prism-volume.length": ["Length", "Largo"],
  "prism-volume.same-answer": [
    "Same answer the other way:  l × w × h = {L} × {W} × {H} = {V}",
    "La misma respuesta de otra forma:  l × w × h = {L} × {W} × {H} = {V}",
  ],
  "prism-volume.svg-label": [
    "A rectangular prism {L} by {W} by {H} {unit}. Its shaded base has area {B} square {unit}, and stacking that base {H} {unit} high gives a volume of {V} cubic {unit}.",
    "Un prisma rectangular de {L} por {W} por {H} {unit}. Su base sombreada tiene un área de {B} {unit}², y al apilar esa base hasta {H} {unit} de altura, el volumen es {V} {unit}³.",
  ],
  "prism-volume.tap-half": [
    "Each tap changes an edge by one half {unit}.",
    "Cada toque cambia una arista en ½ {unit}.",
  ],
  "prism-volume.tap-step": [
    "Each tap changes an edge by {amount} {unit}.",
    "Cada toque cambia una arista en {amount} {unit}.",
  ],
  "prism-volume.units": ["units", "unidades"],
  "prism-volume.volume": [
    "Volume  V = B × h = {B} × {H} = {V} cubic {unit}",
    "Volumen  V = B × h = {B} × {H} = {V} {unit}³",
  ],
  "prism-volume.width": ["Width", "Ancho"],
  // power-builder
  "power-builder.base": ["Base", "Base"],
  "power-builder.base-aria": ["Base (0 to 20)", "Base (de 0 a 20)"],
  "power-builder.exponent": ["Exponent", "Exponente"],
  "power-builder.exponent-aria": ["Exponent (0 to 12)", "Exponente (de 0 a 12)"],
  "power-builder.first-power": [
    "A number to the <strong>first power</strong> is just the base itself — you use it as a factor exactly once.",
    "Un número elevado a la <strong>primera potencia</strong> es solo la base — la usas como factor exactamente una vez.",
  ],
  "power-builder.go": ["Expand &amp; evaluate →", "Desarrollar y calcular →"],
  "power-builder.hint": [
    "An exponent tells you <strong>how many times</strong> to use the base as a factor. Type a base and an exponent, then expand and evaluate it.",
    "Un exponente te dice <strong>cuántas veces</strong> usar la base como factor. Escribe una base y un exponente, luego desarróllala y calcula el valor.",
  ],
  "power-builder.not-multiply": [
    "Use the base <strong>{base}</strong> as a factor <strong>{exp} times</strong>. Notice it is <em>not</em> {base} × {exp} = {product}; a common mistake is to multiply the base by the exponent.",
    "Usa la base <strong>{base}</strong> como factor <strong>{exp} veces</strong>. Fíjate en que <em>no</em> es {base} × {exp} = {product}; un error común es multiplicar la base por el exponente.",
  ],
  "power-builder.quick-pick": ["Quick-pick powers", "Potencias para elegir rápido"],
  "power-builder.title": ["Powers &amp; Exponents Lab", "Laboratorio de potencias y exponentes"],
  "power-builder.to-the": ["to the", "elevado a"],
  "power-builder.too-big": [
    "Use the base <strong>{base}</strong> as a factor <strong>{exp} times</strong> — this one grows past {max}, so keep the exponent smaller to see the exact value.",
    "Usa la base <strong>{base}</strong> como factor <strong>{exp} veces</strong> — este resultado pasa de {max}, así que usa un exponente más pequeño para ver el valor exacto.",
  ],
  "power-builder.zero-power": [
    "Any number (except 0) to the <strong>zero power</strong> is <strong>1</strong> — there are no factors to multiply, so you start from 1.",
    "Cualquier número (excepto 0) elevado al <strong>exponente cero</strong> es <strong>1</strong> — no hay factores que multiplicar, así que empiezas desde 1.",
  ],
  // histogram-builder
  "histogram-builder.bar-aria": ["Bar for interval {label}", "Barra del intervalo {label}"],
  "histogram-builder.check": ["Check my histogram", "Comprobar mi histograma"],
  "histogram-builder.check-colon": ["Check:", "Revisa:"],
  "histogram-builder.data": ["Data", "Datos"],
  "histogram-builder.data-set-n": ["Data set {n}", "Conjunto de datos {n}"],
  "histogram-builder.data-with-unit": ["Data ({unit})", "Datos ({unit})"],
  "histogram-builder.drag-tip": [
    "drag a bar's top edge, or focus a bar and use ↑ ↓",
    "arrastra el borde superior de una barra, o selecciona una barra y usa ↑ ↓",
  ],
  "histogram-builder.intro": [
    "Build the histogram yourself: sort the data, count how many values fall in each interval, then raise each bar to match. A value on a boundary belongs to the interval it STARTS (20 goes in 20–29, not 10–19).",
    "Construye el histograma por tu cuenta: ordena los datos, cuenta cuántos valores caen en cada intervalo y luego sube cada barra para que coincida. Un valor en el límite pertenece al intervalo que EMPIEZA ahí (el 20 va en 20–29, no en 10–19).",
  ],
  "histogram-builder.n-correct": [
    "<strong>{n} of {total} bars correct.</strong>",
    "<strong>{n} de {total} barras correctas.</strong>",
  ],
  "histogram-builder.pick-data-set": ["Pick a data set", "Elige un conjunto de datos"],
  "histogram-builder.plot-aria": [
    "Histogram you are building, one bar per interval",
    "Histograma que estás construyendo, una barra por intervalo",
  ],
  "histogram-builder.recount": [
    "recount the values from {lo} up to (but not including) {hi}.",
    "vuelve a contar los valores desde {lo} hasta {hi} (sin incluir {hi}).",
  ],
  "histogram-builder.sort": ["Sort the data →", "Ordenar los datos →"],
  "histogram-builder.tip-sort": [
    "Tip: sort the data first — counting each interval gets much easier. ",
    "Consejo: ordena primero los datos; contar cada intervalo se vuelve mucho más fácil. ",
  ],
  "histogram-builder.title": ["Histogram Builder", "Constructor de histogramas"],
  "histogram-builder.total-note": [
    "Your bars add up to {placed}, but there are {total} data values — every value belongs in exactly one bar.",
    "Tus barras suman {placed}, pero hay {total} valores de datos: cada valor pertenece a una sola barra.",
  ],
  "histogram-builder.win-match": [
    "<strong>That's the histogram!</strong> All {bars} bars match the data ({total} values total).",
    "<strong>¡Ese es el histograma!</strong> Las {bars} barras coinciden con los datos ({total} valores en total).",
  ],
  "histogram-builder.win-read": [
    "Now read your own display: the tallest bar is <strong>{label}</strong> — that interval holds the most values. Where is the data clustered, and where are the gaps?",
    "Ahora lee tu propia gráfica: la barra más alta es <strong>{label}</strong>; ese intervalo tiene la mayor cantidad de valores. ¿Dónde se agrupan los datos y dónde hay espacios vacíos?",
  ],
  // factor-tree
  "factor-tree-fill.already-prime": [
    "{n} is already a prime number. 🎉",
    "{n} ya es un número primo. 🎉",
  ],
  "factor-tree-fill.check-exponents": ["Check exponents", "Comprobar exponentes"],
  "factor-tree-fill.complete": [
    "Every branch is prime — factorization complete! 🎉",
    "Todas las ramas terminan en números primos: ¡la factorización está completa! 🎉",
  ],
  "factor-tree-fill.exp-hint": [
    "Tap each small box and type how many times that prime appears. A prime used once has exponent 1.",
    "Toca cada cuadro pequeño y escribe cuántas veces aparece ese primo. Un primo que se usa una vez tiene exponente 1.",
  ],
  "factor-tree-fill.exp-title": [
    "Now write it in exponent form ✍️",
    "Ahora escríbelo con exponentes ✍️",
  ],
  "factor-tree-fill.exponent-label": ["exponent for prime {p}", "exponente del primo {p}"],
  "factor-tree-fill.fill-every-exponent": [
    "Fill in every exponent.",
    "Completa todos los exponentes.",
  ],
  "factor-tree-fill.first-factor-label": ["first factor of {n}", "primer factor de {n}"],
  "factor-tree-fill.greater-than-1": ["Use factors greater than 1.", "Usa factores mayores que 1."],
  "factor-tree-fill.hint": [
    "Break the number into <b>two factors</b> that multiply to it. Keep splitting each branch until every circle is a <b>prime</b> number. You choose the factors — any correct path works!",
    "Separa el número en <b>dos factores</b> que al multiplicarse den ese número. Sigue separando cada rama hasta que todos los círculos sean números <b>primos</b>. ¡Tú eliges los factores: cualquier camino correcto sirve!",
  ],
  "factor-tree-fill.keep-splitting": [
    "Keep splitting until every circle is a prime number.",
    "Sigue separando hasta que todos los círculos sean números primos.",
  ],
  "factor-tree-fill.not-yet-count": [
    "Not yet — count how many times each prime appears in your tree.",
    "Todavía no. Cuenta cuántas veces aparece cada primo en tu árbol.",
  ],
  "factor-tree-fill.one-way": [
    "Here's one way — every path reaches the same primes.",
    "Esta es una forma: todos los caminos llegan a los mismos primos.",
  ],
  "factor-tree-fill.prime-tag": ["prime ✓", "primo ✓"],
  "factor-tree-fill.second-factor-label": ["second factor of {n}", "segundo factor de {n}"],
  "factor-tree-fill.show-one-way": ["Show me one way", "Muéstrame una forma"],
  "factor-tree-fill.split": ["Split", "Separar"],
  "factor-tree-fill.start-over": ["Start over", "Reiniciar"],
  "factor-tree-fill.type-two": ["Type two numbers.", "Escribe dos números."],
  "factor-tree-fill.wrong-product": [
    "{a} × {b} = {product}, not {n}. Try factors of {n}.",
    "{a} × {b} = {product}, no {n}. Prueba con factores de {n}.",
  ],
  // distributive-builder
  "distributive-builder.area-aria": [
    "Area model of {a} times open paren {b} plus {c} close paren",
    "Modelo de área de {a} por abre paréntesis {b} más {c} cierra paréntesis",
  ],
  "distributive-builder.aria-a": ["a (1 to 12)", "a (de 1 a 12)"],
  "distributive-builder.aria-b": ["b (1 to 20)", "b (de 1 a 20)"],
  "distributive-builder.aria-c": ["c (1 to 20)", "c (de 1 a 20)"],
  "distributive-builder.explain": [
    "Both the whole rectangle ({a} × {bc} = {total}) and the two parts ({ab} + {ac}) count the same area.",
    "Tanto el rectángulo completo ({a} × {bc} = {total}) como las dos partes ({ab} + {ac}) cubren la misma área.",
  ],
  "distributive-builder.hint": [
    "The area of the whole rectangle can be counted two ways. Type a, b, and c to see why <strong>a(b + c) = a·b + a·c</strong>.",
    "El área de todo el rectángulo se puede contar de dos maneras. Escribe a, b y c para ver por qué <strong>a(b + c) = a·b + a·c</strong>.",
  ],
  "distributive-builder.quick-pick": ["Quick-pick expressions", "Expresiones para elegir rápido"],
  "distributive-builder.show": ["Show →", "Mostrar →"],
  "distributive-builder.title": [
    "Distributive Property Lab",
    "Laboratorio de la propiedad distributiva",
  ],
  // decimal-product
  "decimal-product.check": ["Check", "Comprobar"],
  "decimal-product.decimal-moved": [
    "Decimal moved in {n} {unit}.",
    "El punto decimal se movió {n} {unit}.",
  ],
  "decimal-product.decimal-place-many": ["decimal places", "lugares decimales"],
  "decimal-product.decimal-place-one": ["decimal place", "lugar decimal"],
  "decimal-product.expr-label": ["{a} times {b}", "{a} por {b}"],
  "decimal-product.has": ["has", "tiene"],
  "decimal-product.hint": [
    "Multiply as if there were no decimal points, then place the decimal by counting decimal places.",
    "Multiplica como si no hubiera puntos decimales. Luego coloca el punto decimal contando los lugares decimales.",
  ],
  "decimal-product.multiply-digits": ["Multiply the digits.", "Multiplica los dígitos."],
  "decimal-product.not-yet-add": ["Not yet — add {a} + {b}.", "Todavía no. Suma {a} + {b}."],
  "decimal-product.not-yet-count": [
    "Not yet — count {n} {unit} in from the right.",
    "Todavía no. Cuenta {n} {unit} desde la derecha.",
  ],
  "decimal-product.not-yet-multiply": [
    "Not yet — multiply {a} × {b} again.",
    "Todavía no. Multiplica {a} × {b} otra vez.",
  ],
  "decimal-product.perfect": ["Perfect placement!", "¡Punto decimal bien colocado!"],
  "decimal-product.pick-problem": ["Pick a problem", "Elige un problema"],
  "decimal-product.place-many": ["places", "lugares"],
  "decimal-product.place-one": ["place", "lugar"],
  "decimal-product.right-in-all": ["Right — {n} {unit} in all.", "Correcto: {n} {unit} en total."],
  "decimal-product.show-me": ["Show me", "Muéstrame"],
  "decimal-product.step-1-input-label": ["product of {a} times {b}", "producto de {a} por {b}"],
  "decimal-product.step-1-prompt": [
    "Ignore the decimals and multiply the whole numbers:",
    "Ignora los decimales y multiplica los números enteros:",
  ],
  "decimal-product.step-1-title": [
    "Step 1 · Multiply the digits",
    "Paso 1 · Multiplica los dígitos",
  ],
  "decimal-product.step-2-input-label": [
    "total number of decimal places",
    "total de lugares decimales",
  ],
  "decimal-product.step-2-prompt": [
    "Count the decimal places in each factor:",
    "Cuenta los lugares decimales de cada factor:",
  ],
  "decimal-product.step-2-title": [
    "Step 2 · Count decimal places",
    "Paso 2 · Cuenta los lugares decimales",
  ],
  "decimal-product.step-3-input-label": ["final decimal product", "producto decimal final"],
  "decimal-product.step-3-prompt": [
    "Take {n} and place the decimal point so the answer has",
    "Toma {n} y coloca el punto decimal para que la respuesta tenga",
  ],
  "decimal-product.step-3-title": [
    "Step 3 · Place the decimal point",
    "Paso 3 · Coloca el punto decimal",
  ],
  "decimal-product.type-answer": [
    "Type the answer, then check.",
    "Escribe la respuesta y luego comprueba.",
  ],
  "decimal-product.type-number": ["Type a number like {n}.", "Escribe un número como {n}."],
  "decimal-product.type-product": [
    "Type the product, then check.",
    "Escribe el producto y luego comprueba.",
  ],
  "decimal-product.type-total": [
    "Type the total, then check.",
    "Escribe el total y luego comprueba.",
  ],
  "decimal-product.yes-count": [
    "Yes! Now count the decimal places.",
    "¡Sí! Ahora cuenta los lugares decimales.",
  ],
  // decimal-columns
  "decimal-columns.answer-cell-label": [
    "{place} place of the answer",
    "Columna de {place} de la respuesta",
  ],
  "decimal-columns.bottom-cell-label": [
    "Bottom number, {place} place",
    "Número de abajo, columna de {place}",
  ],
  "decimal-columns.carry": ["Carry", "Llevar"],
  "decimal-columns.check": ["Check", "Comprobar"],
  "decimal-columns.clear": ["Clear", "Borrar"],
  "decimal-columns.fill-every-box": [
    "Fill in every answer box.",
    "Completa todos los cuadros de la respuesta.",
  ],
  "decimal-columns.grid-label-add": [
    "Vertical decimal addition of {a} and {b}",
    "Suma decimal vertical de {a} y {b}",
  ],
  "decimal-columns.grid-label-subtract": [
    "Vertical decimal subtraction of {a} and {b}",
    "Resta decimal vertical de {a} y {b}",
  ],
  "decimal-columns.hint-add": [
    "Each place value has its own column. When a column makes 10 or more, write the carry in the amber “{label}” box above the next column, then fill the answer.",
    "Cada valor posicional tiene su propia columna. Cuando una columna suma 10 o más, escribe lo que llevas en el cuadro ámbar “{label}” sobre la siguiente columna y luego completa la respuesta.",
  ],
  "decimal-columns.hint-subtract": [
    "Each place value has its own column. When the top digit is too small, borrow: write the regrouped top value in the amber “{label}” box, then fill the answer.",
    "Cada valor posicional tiene su propia columna. Cuando el dígito de arriba es muy pequeño, reagrupa: escribe el nuevo valor de arriba en el cuadro ámbar “{label}” y luego completa la respuesta.",
  ],
  "decimal-columns.not-yet-add": [
    "Not yet — check the red boxes, and remember to carry when a column makes 10 or more.",
    "Todavía no. Revisa los cuadros rojos y recuerda llevar cuando una columna suma 10 o más.",
  ],
  "decimal-columns.not-yet-subtract": [
    "Not yet — check the red boxes. Where the top digit is too small, borrow before you subtract.",
    "Todavía no. Revisa los cuadros rojos. Si el dígito de arriba es muy pequeño, reagrupa antes de restar.",
  ],
  "decimal-columns.pick-problem": ["Pick a problem", "Elige un problema"],
  "decimal-columns.place-hundred-thousands": ["hundred-thousands", "centenas de millar"],
  "decimal-columns.place-hundred-thousandths": ["hundred-thousandths", "cienmilésimas"],
  "decimal-columns.place-hundreds": ["hundreds", "centenas"],
  "decimal-columns.place-hundredths": ["hundredths", "centésimas"],
  "decimal-columns.place-millions": ["millions", "millones"],
  "decimal-columns.place-n": ["decimal place {n}", "lugar decimal {n}"],
  "decimal-columns.place-ones": ["ones", "unidades"],
  "decimal-columns.place-ten-thousands": ["ten-thousands", "decenas de millar"],
  "decimal-columns.place-ten-thousandths": ["ten-thousandths", "diezmilésimas"],
  "decimal-columns.place-tens": ["tens", "decenas"],
  "decimal-columns.place-tenths": ["tenths", "décimas"],
  "decimal-columns.place-thousands": ["thousands", "unidades de millar"],
  "decimal-columns.place-thousandths": ["thousandths", "milésimas"],
  "decimal-columns.regroup": ["Regroup", "Reagrupar"],
  "decimal-columns.reveal": [
    "Here's the lined-up work, regroups and all.",
    "Aquí está el trabajo alineado, con todas las reagrupaciones.",
  ],
  "decimal-columns.rg-cell-label": [
    "{label} for the {place} column",
    "{label} para la columna de {place}",
  ],
  "decimal-columns.right-check-carry": [
    "Your answer is right — but check the amber carry boxes. A carry is written above the column to the left.",
    "Tu respuesta es correcta, pero revisa los cuadros ámbar de llevar. Lo que llevas se escribe sobre la columna de la izquierda.",
  ],
  "decimal-columns.right-check-regroup": [
    "Your answer is right — but check the amber regroup boxes. Each borrow makes the top digit smaller by 1 and adds 10 to the column on the right.",
    "Tu respuesta es correcta, pero revisa los cuadros ámbar de reagrupar. Cada vez que reagrupas, el dígito de arriba baja 1 y se suman 10 a la columna de la derecha.",
  ],
  "decimal-columns.show-me": ["Show me", "Muéstrame"],
  "decimal-columns.success": [
    "That's it — decimals lined up perfectly! 🎉",
    "¡Eso es! ¡Los decimales quedaron perfectamente alineados! 🎉",
  ],
  "decimal-columns.title-add": [
    "Line up the decimal points and add.",
    "Alinea los puntos decimales y suma.",
  ],
  "decimal-columns.title-subtract": [
    "Line up the decimal points and subtract.",
    "Alinea los puntos decimales y resta.",
  ],
  "decimal-columns.top-cell-label": [
    "Top number, {place} place",
    "Número de arriba, columna de {place}",
  ],
  // combine-like-terms
  "combine-like-terms.aria-c": ["combined constant", "constante combinada"],
  "combine-like-terms.aria-expr": ["simplified expression", "expresión simplificada"],
  "combine-like-terms.aria-x": ["combined x coefficient", "coeficiente de x combinado"],
  "combine-like-terms.c-combined": ["Numbers combined.", "Números combinados."],
  "combine-like-terms.cannot-read": [
    "Could not read this expression.",
    "No se pudo leer esta expresión.",
  ],
  "combine-like-terms.check": ["Check", "Comprobar"],
  "combine-like-terms.default-title": ["Simplify: {expr}", "Simplifica: {expr}"],
  "combine-like-terms.done": [
    "That's it — fully simplified!",
    "¡Eso es! Quedó totalmente simplificada.",
  ],
  "combine-like-terms.hint": [
    "Add the like terms: combine the <strong>x-terms</strong>, then combine the <strong>number terms</strong>.",
    "Suma los términos semejantes: combina los <strong>términos con x</strong> y luego combina los <strong>términos numéricos</strong>.",
  ],
  "combine-like-terms.not-yet-c": [
    "Not yet — add the constant terms, keeping each sign.",
    "Todavía no: suma los términos constantes, conservando cada signo.",
  ],
  "combine-like-terms.not-yet-expr": [
    "Not yet — combine both parts into one expression.",
    "Todavía no: combina las dos partes en una sola expresión.",
  ],
  "combine-like-terms.not-yet-x": [
    "Not yet — add the numbers in front of each x (watch the signs).",
    "Todavía no: suma los números que están delante de cada x (cuidado con los signos).",
  ],
  "combine-like-terms.pick-problem": ["Pick a problem", "Elige un problema"],
  "combine-like-terms.placeholder-expr": ["e.g. 8x - 2", "p. ej. 8x - 2"],
  "combine-like-terms.prompt-1": [
    "Add the coefficients of the x-terms:",
    "Suma los coeficientes de los términos con x:",
  ],
  "combine-like-terms.prompt-2": [
    "Add the constant number terms (keep their signs):",
    "Suma los términos numéricos constantes (conserva sus signos):",
  ],
  "combine-like-terms.prompt-3": [
    "Put it together in simplest form:",
    "Júntalo todo en su forma más simple:",
  ],
  "combine-like-terms.right-c": [
    "Right — the numbers combine to {c}.",
    "Correcto: los números se combinan en {c}.",
  ],
  "combine-like-terms.right-x": [
    "Right — the x-terms make {x}x.",
    "Correcto: los términos con x dan {x}x.",
  ],
  "combine-like-terms.right-x-cancel": [
    "Right — the x-terms cancel out.",
    "Correcto: los términos con x se anulan.",
  ],
  "combine-like-terms.show-me": ["Show me", "Muéstrame"],
  "combine-like-terms.simplified": ["Simplified.", "Simplificada."],
  "combine-like-terms.step-1": [
    "Step 1 · Combine the x-terms",
    "Paso 1 · Combina los términos con x",
  ],
  "combine-like-terms.step-2": ["Step 2 · Combine the numbers", "Paso 2 · Combina los números"],
  "combine-like-terms.step-3": [
    "Step 3 · Write the simplified expression",
    "Paso 3 · Escribe la expresión simplificada",
  ],
  "combine-like-terms.write-like": ["Write it like 8x - 2.", "Escríbelo así: 8x - 2."],
  "combine-like-terms.x-combined": ["x-terms combined.", "Términos con x combinados."],
};
