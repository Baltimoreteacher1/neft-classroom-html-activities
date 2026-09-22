/**
 * Visual-first, concept-specific manipulatives for family homework.
 * Generated pages keep a static SVG fallback and progressively enhance it with
 * accessible range controls. No answer-key data is exposed to students.
 */

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const LABS = {
  exponents: {
    name: "Exponent Builder",
    nameEs: "Constructor de exponentes",
    prompt: "Change the base and exponent. Watch repeated multiplication grow.",
    promptEs: "Cambia la base y el exponente. Observa cómo crece la multiplicación repetida.",
    coachEn: "Ask: 'Which number is being multiplied, and which number tells how many times?'",
    coachEs: "Pregunta: '¿Qué número se multiplica y qué número indica cuántas veces?'",
    legend: [
      { color: "teal", labelEn: "Base factor", labelEs: "Factor base" },
      { color: "coral", labelEn: "Repeated factor", labelEs: "Factor repetido" },
    ],
    presets: [
      { labelEn: "Doubling (2³ = 8)", labelEs: "Duplicar (2³ = 8)", values: { base: 2, power: 3 } },
      {
        labelEn: "Tripling (3² = 9)",
        labelEs: "Triplicar (3² = 9)",
        values: { base: 3, power: 2 },
      },
      {
        labelEn: "Powers of 4 (4² = 16)",
        labelEs: "Potencias de 4 (4² = 16)",
        values: { base: 4, power: 2 },
      },
    ],
    controls: [
      ["base", "Base", "Base", 2, 5, 2],
      ["power", "Exponent", "Exponente", 1, 4, 3],
    ],
  },
  ratios: {
    name: "Ratio Mixer",
    nameEs: "Mezclador de razones",
    prompt: "Build equivalent batches and compare the two colors.",
    promptEs: "Construye lotes equivalentes y compara los dos colores.",
    coachEn: "Ask: 'If we make twice as many batches, what happens to both colors?'",
    coachEs: "Pregunta: 'Si preparamos el doble de lotes, ¿qué les pasa a ambos colores?'",
    legend: [
      { color: "teal", labelEn: "Blue parts", labelEs: "Partes azules" },
      { color: "coral", labelEn: "Coral parts", labelEs: "Partes corales" },
    ],
    presets: [
      {
        labelEn: "Single batch (1 : 3)",
        labelEs: "Lote individual (1 : 3)",
        values: { batches: 1, blue: 1 },
      },
      {
        labelEn: "Double batch (2 : 3)",
        labelEs: "Doble lote (2 : 3)",
        values: { batches: 2, blue: 2 },
      },
      {
        labelEn: "Triple batch (3 : 3)",
        labelEs: "Triple lote (3 : 3)",
        values: { batches: 3, blue: 3 },
      },
    ],
    controls: [
      ["batches", "Batches", "Lotes", 1, 5, 2],
      ["blue", "Blue per batch", "Azules por lote", 1, 4, 2],
    ],
  },
  equations: {
    name: "Balance the Equation",
    nameEs: "Equilibra la ecuación",
    prompt: "Change the unknown and the added blocks. Both pans stay equal.",
    promptEs: "Cambia la incógnita y los bloques añadidos. Ambos lados quedan iguales.",
    coachEn: "Ask: 'What do we need to remove from both pans to leave x all by itself?'",
    coachEs: "Pregunta: '¿Qué debemos quitar de ambos lados para que x quede sola?'",
    legend: [
      { color: "teal", labelEn: "Left pan (x + add)", labelEs: "Plato izquierdo (x + suma)" },
      { color: "coral", labelEn: "Right pan (total)", labelEs: "Plato derecho (total)" },
    ],
    presets: [
      { labelEn: "x + 3 = 8", labelEs: "x + 3 = 8", values: { unknown: 5, add: 3 } },
      { labelEn: "x + 6 = 10", labelEs: "x + 6 = 10", values: { unknown: 4, add: 6 } },
      { labelEn: "x + 4 = 11", labelEs: "x + 4 = 11", values: { unknown: 7, add: 4 } },
    ],
    controls: [
      ["unknown", "Unknown x", "Incógnita x", 1, 12, 5],
      ["add", "Add to x", "Suma a x", 1, 10, 3],
    ],
  },
  inequalities: {
    name: "Inequality Number Line",
    nameEs: "Recta de desigualdades",
    prompt: "Move the boundary and test a point in the shaded solution set.",
    promptEs: "Mueve el límite y prueba un punto en el conjunto sombreado.",
    coachEn: "Ask: 'Is our test point inside the shaded solution set? What does that prove?'",
    coachEs: "Pregunta: '¿Está el punto de prueba en el conjunto sombreado? ¿Qué demuestra eso?'",
    legend: [
      { color: "teal", labelEn: "Solution set", labelEs: "Conjunto solución" },
      { color: "coral", labelEn: "Boundary point", labelEs: "Punto límite" },
    ],
    presets: [
      {
        labelEn: "Above zero (x > 0)",
        labelEs: "Mayor que cero (x > 0)",
        values: { boundary: 0, test: 3 },
      },
      {
        labelEn: "Freezing (x > -2)",
        labelEs: "Congelación (x > -2)",
        values: { boundary: -2, test: 1 },
      },
      {
        labelEn: "Outside set (x > 2)",
        labelEs: "Fuera de rango (x > 2)",
        values: { boundary: 2, test: 0 },
      },
    ],
    controls: [
      ["boundary", "Boundary", "Límite", -5, 5, 1],
      ["test", "Test point", "Punto de prueba", -5, 5, 3],
    ],
  },
  properties: {
    name: "Distributive Array",
    nameEs: "Arreglo distributivo",
    prompt: "Split one array into two parts without changing its total area.",
    promptEs: "Divide un arreglo en dos partes sin cambiar su área total.",
    coachEn: "Ask: 'Does splitting the array into two pieces change the total number of squares?'",
    coachEs: "Pregunta: '¿Dividir el arreglo en dos partes cambia el número total de cuadrados?'",
    legend: [
      { color: "teal", labelEn: "Left section", labelEs: "Sección izquierda" },
      { color: "coral", labelEn: "Right section", labelEs: "Sección derecha" },
    ],
    presets: [
      { labelEn: "3 × (2 + 3)", labelEs: "3 × (2 + 3)", values: { rows: 3, left: 2, right: 3 } },
      { labelEn: "4 × (3 + 3)", labelEs: "4 × (3 + 3)", values: { rows: 4, left: 3, right: 3 } },
      { labelEn: "2 × (5 + 2)", labelEs: "2 × (5 + 2)", values: { rows: 2, left: 5, right: 2 } },
    ],
    controls: [
      ["rows", "Rows", "Filas", 1, 6, 3],
      ["left", "Left columns", "Columnas izquierdas", 1, 6, 2],
      ["right", "Right columns", "Columnas derechas", 1, 6, 3],
    ],
  },
  expressions: {
    name: "Algebra Tile Builder",
    nameEs: "Constructor de fichas algebraicas",
    prompt: "Change the coefficient and constant to build an expression.",
    promptEs: "Cambia el coeficiente y la constante para construir una expresión.",
    coachEn: "Ask: 'Which tiles can change value when x changes, and which stay fixed?'",
    coachEs:
      "Pregunta: '¿Qué fichas pueden cambiar de valor cuando cambia x y cuáles quedan fijas?'",
    legend: [
      { color: "teal", labelEn: "Variable tiles (x)", labelEs: "Fichas de variable (x)" },
      { color: "coral", labelEn: "Unit tiles", labelEs: "Fichas de unidad" },
    ],
    presets: [
      {
        labelEn: "Expression 3x + 2",
        labelEs: "Expresión 3x + 2",
        values: { coefficient: 3, constant: 2 },
      },
      {
        labelEn: "Expression 2x + 5",
        labelEs: "Expresión 2x + 5",
        values: { coefficient: 2, constant: 5 },
      },
      {
        labelEn: "Expression 4x + 1",
        labelEs: "Expresión 4x + 1",
        values: { coefficient: 4, constant: 1 },
      },
    ],
    controls: [
      ["coefficient", "x tiles", "Fichas x", 1, 6, 3],
      ["constant", "Unit tiles", "Fichas de unidad", 0, 10, 5],
    ],
  },
  area: {
    name: "Area Grid",
    nameEs: "Cuadrícula de área",
    prompt: "Resize the rectangle. Count rows and columns of square units.",
    promptEs: "Cambia el rectángulo. Cuenta filas y columnas de unidades cuadradas.",
    coachEn: "Ask: 'How can we find the total squares quickly using multiplication?'",
    coachEs:
      "Pregunta: '¿Cómo podemos calcular los cuadrados rápidamente usando la multiplicación?'",
    legend: [{ color: "teal", labelEn: "Square units", labelEs: "Unidades cuadradas" }],
    presets: [
      {
        labelEn: "Living room (6 × 4)",
        labelEs: "Habitación (6 × 4)",
        values: { width: 6, height: 4 },
      },
      {
        labelEn: "Square patio (4 × 4)",
        labelEs: "Patio cuadrado (4 × 4)",
        values: { width: 4, height: 4 },
      },
      {
        labelEn: "Narrow path (8 × 2)",
        labelEs: "Sendero estrecho (8 × 2)",
        values: { width: 8, height: 2 },
      },
    ],
    controls: [
      ["width", "Width", "Ancho", 1, 10, 6],
      ["height", "Height", "Altura", 1, 7, 4],
    ],
  },
  volume: {
    name: "Volume Layer Builder",
    nameEs: "Constructor de capas de volumen",
    prompt: "Resize a prism and see how many unit cubes fill each layer.",
    promptEs: "Cambia un prisma y observa cuántos cubos llenan cada capa.",
    coachEn: "Ask: 'How many cubes are in one flat layer? How many layers make the full height?'",
    coachEs:
      "Pregunta: '¿Cuántos cubos hay en una capa plana? ¿Cuántas capas forman la altura total?'",
    legend: [
      { color: "teal", labelEn: "Base layer cubes", labelEs: "Cubos de capa base" },
      { color: "coral", labelEn: "Stacked layers", labelEs: "Capas apiladas" },
    ],
    presets: [
      {
        labelEn: "Box (4 × 3 × 2)",
        labelEs: "Caja (4 × 3 × 2)",
        values: { length: 4, width: 3, height: 2 },
      },
      {
        labelEn: "Cube (3 × 3 × 3)",
        labelEs: "Cubo (3 × 3 × 3)",
        values: { length: 3, width: 3, height: 3 },
      },
      {
        labelEn: "Flat tray (5 × 4 × 1)",
        labelEs: "Bandeja plana (5 × 4 × 1)",
        values: { length: 5, width: 4, height: 1 },
      },
    ],
    controls: [
      ["length", "Length", "Largo", 1, 6, 4],
      ["width", "Width", "Ancho", 1, 5, 3],
      ["height", "Layers", "Capas", 1, 5, 2],
    ],
  },
  "surface-area": {
    name: "Prism Net Studio",
    nameEs: "Estudio de redes de prismas",
    prompt: "Resize the prism. Watch all six faces change in its net.",
    promptEs: "Cambia el prisma. Observa cómo cambian las seis caras de su red.",
    coachEn: "Ask: 'Which matching pairs of opposite faces share the exact same area?'",
    coachEs: "Pregunta: '¿Qué parejas de caras opuestas tienen exactamente la misma área?'",
    legend: [
      { color: "teal", labelEn: "Front and back", labelEs: "Frente y dorso" },
      { color: "gold", labelEn: "Top and bottom", labelEs: "Arriba y abajo" },
      { color: "coral", labelEn: "Left and right", labelEs: "Izquierda y derecha" },
    ],
    presets: [
      {
        labelEn: "Solid brick (4 × 3 × 2)",
        labelEs: "Ladrillo (4 × 3 × 2)",
        values: { length: 4, width: 3, height: 2 },
      },
      {
        labelEn: "Equal cube (3 × 3 × 3)",
        labelEs: "Cubo igual (3 × 3 × 3)",
        values: { length: 3, width: 3, height: 3 },
      },
      {
        labelEn: "Flat carton (5 × 3 × 1)",
        labelEs: "Caja plana (5 × 3 × 1)",
        values: { length: 5, width: 3, height: 1 },
      },
    ],
    controls: [
      ["length", "Length", "Largo", 1, 6, 4],
      ["width", "Width", "Ancho", 1, 5, 3],
      ["height", "Height", "Altura", 1, 5, 2],
    ],
  },
  statistics: {
    name: "Data Shape Studio",
    nameEs: "Estudio de forma de datos",
    prompt: "Change the center and spread. Watch the dot plot reshape.",
    promptEs: "Cambia el centro y la dispersión. Observa cómo cambia el diagrama.",
    coachEn: "Ask: 'Where is the center point, and how widely spread are the outer dots?'",
    coachEs:
      "Pregunta: '¿Dónde está el centro y qué tan dispersos están los puntos de los extremos?'",
    legend: [
      { color: "coral", labelEn: "Center value", labelEs: "Valor central" },
      { color: "teal", labelEn: "Data points", labelEs: "Puntos de datos" },
    ],
    presets: [
      {
        labelEn: "Balanced center (5)",
        labelEs: "Centro equilibrado (5)",
        values: { center: 5, spread: 2 },
      },
      {
        labelEn: "Clustered tight (6)",
        labelEs: "Muy agrupados (6)",
        values: { center: 6, spread: 1 },
      },
      {
        labelEn: "Wide spread (5)",
        labelEs: "Gran dispersión (5)",
        values: { center: 5, spread: 4 },
      },
    ],
    controls: [
      ["center", "Center", "Centro", 3, 8, 5],
      ["spread", "Spread", "Dispersión", 1, 4, 2],
    ],
  },
  "coordinate-plane": {
    name: "Coordinate Mover",
    nameEs: "Punto móvil de coordenadas",
    prompt: "Move x and y. Track the ordered pair across the four quadrants.",
    promptEs: "Mueve x y y. Sigue el par ordenado por los cuatro cuadrantes.",
    coachEn: "Ask: 'Which number tells us left/right (x), and which tells us up/down (y)?'",
    coachEs: "Pregunta: '¿Qué número indica izquierda/derecha (x) y cuál indica arriba/abajo (y)?'",
    legend: [{ color: "coral", labelEn: "Point (x, y)", labelEs: "Punto (x, y)" }],
    presets: [
      { labelEn: "Quadrant I (3, 2)", labelEs: "Cuadrante I (3, 2)", values: { x: 3, y: 2 } },
      { labelEn: "Quadrant II (-4, 3)", labelEs: "Cuadrante II (-4, 3)", values: { x: -4, y: 3 } },
      {
        labelEn: "Quadrant III (-3, -2)",
        labelEs: "Cuadrante III (-3, -2)",
        values: { x: -3, y: -2 },
      },
    ],
    controls: [
      ["x", "x-coordinate", "Coordenada x", -5, 5, 3],
      ["y", "y-coordinate", "Coordenada y", -5, 5, 2],
    ],
  },
  "number-line": {
    name: "Integer Number Line",
    nameEs: "Recta de enteros",
    prompt: "Move the point and change its distance from zero.",
    promptEs: "Mueve el punto y cambia su distancia desde cero.",
    coachEn: "Ask: 'When we add a positive number, does the jump move to the right or left?'",
    coachEs:
      "Pregunta: 'Cuando sumamos un número positivo, ¿el salto va a la derecha o a la izquierda?'",
    legend: [
      { color: "teal", labelEn: "Start point", labelEs: "Punto de partida" },
      { color: "coral", labelEn: "Landing point", labelEs: "Punto de llegada" },
    ],
    presets: [
      {
        labelEn: "Jump right (-4 + 7)",
        labelEs: "Salto derecha (-4 + 7)",
        values: { point: -4, jump: 7 },
      },
      {
        labelEn: "Jump left (3 − 6)",
        labelEs: "Salto izquierda (3 − 6)",
        values: { point: 3, jump: -6 },
      },
      {
        labelEn: "Crossing zero (-2 + 5)",
        labelEs: "Cruzar el cero (-2 + 5)",
        values: { point: -2, jump: 5 },
      },
    ],
    controls: [
      ["point", "Point", "Punto", -10, 10, -4],
      ["jump", "Jump", "Salto", -5, 5, 3],
    ],
  },
  fractions: {
    name: "Fraction Bar Builder",
    nameEs: "Constructor de barras de fracciones",
    prompt: "Change the numerator and denominator. Watch the part-whole model.",
    promptEs: "Cambia el numerador y el denominador. Observa el modelo parte-todo.",
    coachEn: "Ask: 'What does the bottom number (denominator) tell us about each whole bar?'",
    coachEs: "Pregunta: '¿Qué nos dice el número de abajo (denominador) sobre cada barra entera?'",
    legend: [
      { color: "teal", labelEn: "Shaded fraction parts", labelEs: "Partes sombreadas" },
      { color: "gold", labelEn: "Remaining parts", labelEs: "Partes restantes" },
    ],
    presets: [
      {
        labelEn: "One half (1/2)",
        labelEs: "Un medio (1/2)",
        values: { numerator: 1, denominator: 2 },
      },
      {
        labelEn: "Three fourths (3/4)",
        labelEs: "Tres cuartos (3/4)",
        values: { numerator: 3, denominator: 4 },
      },
      {
        labelEn: "Over a whole (5/4)",
        labelEs: "Más de un entero (5/4)",
        values: { numerator: 5, denominator: 4 },
      },
    ],
    controls: [
      ["numerator", "Numerator", "Numerador", 0, 12, 3],
      ["denominator", "Denominator", "Denominador", 2, 12, 4],
    ],
  },
  division: {
    name: "Long Division Algorithm Lab",
    nameEs: "Laboratorio del algoritmo de división larga",
    prompt:
      "Follow the standard algorithm: Divide (D) → Multiply (M) → Subtract (S) → Bring down (B) to find the quotient.",
    promptEs:
      "Sigue el algoritmo estándar: Divide (D) → Multiplica (M) → Resta (S) → Baja (B) para hallar el cociente.",
    coachEn: "Ask: 'Can you name the 4 algorithm steps: Divide, Multiply, Subtract, Bring down?'",
    coachEs:
      "Pregunta: '¿Recuerdas los 4 pasos del algoritmo: Dividir, Multiplicar, Restar, Bajar?'",
    legend: [
      { color: "gold", labelEn: "Completed steps", labelEs: "Pasos completados" },
      { color: "coral", labelEn: "Active step", labelEs: "Paso activo" },
    ],
    presets: [
      {
        labelEn: "Exact division (144 ÷ 12)",
        labelEs: "División exacta (144 ÷ 12)",
        values: { dividend: 144, divisor: 12, step: 4 },
      },
      {
        labelEn: "With remainder (125 ÷ 10)",
        labelEs: "Con residuo (125 ÷ 10)",
        values: { dividend: 125, divisor: 10, step: 4 },
      },
      {
        labelEn: "Step 1: Divide (D)",
        labelEs: "Paso 1: Dividir (D)",
        values: { dividend: 1344, divisor: 12, step: 1 },
      },
    ],
    controls: [
      ["dividend", "Dividend (Total)", "Dividendo (Total)", 100, 2400, 1344],
      ["divisor", "Divisor (Groups)", "Divisor (Grupos)", 2, 25, 12],
      ["step", "Algorithm Step (DMSB)", "Paso del algoritmo (DMSB)", 1, 4, 4],
    ],
  },
  decimals: {
    name: "Hundred Grid",
    nameEs: "Cuadrícula de cien",
    prompt: "Shade hundredths and connect the picture, decimal, and percent.",
    promptEs: "Sombrea centésimos y conecta el dibujo, decimal y porcentaje.",
    coachEn: "Ask: 'How many small squares make up one full column of ten?'",
    coachEs: "Pregunta: '¿Cuántos cuadritos forman una columna completa de diez?'",
    legend: [{ color: "teal", labelEn: "Shaded hundredths", labelEs: "Centésimos sombreados" }],
    presets: [
      {
        labelEn: "Quarter: 0.25 (25%)",
        labelEs: "Un cuarto: 0.25 (25%)",
        values: { hundredths: 25 },
      },
      { labelEn: "Half: 0.50 (50%)", labelEs: "Mitad: 0.50 (50%)", values: { hundredths: 50 } },
      {
        labelEn: "Three quarters: 0.75 (75%)",
        labelEs: "Tres cuartos: 0.75 (75%)",
        values: { hundredths: 75 },
      },
    ],
    controls: [["hundredths", "Hundredths", "Centésimos", 0, 100, 37]],
  },
  factors: {
    name: "Factor Array Lab",
    nameEs: "Laboratorio de arreglos de factores",
    prompt: "Arrange dots in equal rows. A complete rectangle shows a factor pair.",
    promptEs: "Ordena puntos en filas iguales. Un rectángulo completo muestra un par de factores.",
    coachEn: "Ask: 'Does this form a complete rectangle, or are there dots left over?'",
    coachEs: "Pregunta: '¿Forma esto un rectángulo completo o sobran puntos?'",
    legend: [{ color: "teal", labelEn: "Complete rows", labelEs: "Filas completas" }],
    presets: [
      {
        labelEn: "Array for 12 (3 × 4)",
        labelEs: "Arreglo de 12 (3 × 4)",
        values: { number: 12, columns: 4 },
      },
      {
        labelEn: "Square for 16 (4 × 4)",
        labelEs: "Cuadrado de 16 (4 × 4)",
        values: { number: 16, columns: 4 },
      },
      {
        labelEn: "Prime 13 (no rectangle)",
        labelEs: "Primo 13 (sin rectángulo)",
        values: { number: 13, columns: 4 },
      },
    ],
    controls: [
      ["number", "Number of dots", "Número de puntos", 2, 36, 24],
      ["columns", "Columns", "Columnas", 1, 12, 6],
    ],
  },
  fallback: {
    name: "Math Model Builder",
    nameEs: "Constructor de modelos matemáticos",
    prompt: "Change the groups and items. Explain what stays the same.",
    promptEs: "Cambia los grupos y los objetos. Explica qué permanece igual.",
    coachEn: "Ask: 'How many equal groups are there, and how many items are in each group?'",
    coachEs: "Pregunta: '¿Cuántos grupos iguales hay y cuántos objetos hay en cada grupo?'",
    legend: [{ color: "teal", labelEn: "Equal group items", labelEs: "Objetos de grupo igual" }],
    presets: [
      { labelEn: "3 groups of 4", labelEs: "3 grupos de 4", values: { groups: 3, items: 4 } },
      { labelEn: "4 groups of 5", labelEs: "4 grupos de 5", values: { groups: 4, items: 5 } },
      { labelEn: "2 groups of 6", labelEs: "2 grupos de 6", values: { groups: 2, items: 6 } },
    ],
    controls: [
      ["groups", "Groups", "Grupos", 1, 6, 3],
      ["items", "Items per group", "Objetos por grupo", 1, 8, 4],
    ],
  },
};

function initialPreview() {
  const dots = Array.from({ length: 12 }, (_, i) => {
    const x = 124 + (i % 6) * 48;
    const y = 74 + Math.floor(i / 6) * 58;
    const color = i % 2 ? "#ff775f" : "#0b8f87";
    return `<circle cx="${x}" cy="${y}" r="16" fill="${color}"/><circle cx="${x - 5}" cy="${y - 4}" r="3" fill="#fff" opacity=".85"/>`;
  }).join("");
  return `<svg viewBox="0 0 520 220" role="img" aria-label="Interactive math model preview"><rect width="520" height="220" rx="24" fill="#f8fbf2"/><path d="M28 38H492M28 82H492M28 126H492M28 170H492" stroke="#d7e7df"/><path d="M76 20V200M124 20V200M172 20V200M220 20V200M268 20V200M316 20V200M364 20V200M412 20V200M460 20V200" stroke="#d7e7df"/>${dots}<path d="M84 190h352" stroke="#173a5e" stroke-width="5" stroke-linecap="round"/><text x="260" y="210" text-anchor="middle" font-size="14" font-weight="800" fill="#173a5e">Move a slider to change the math</text></svg>`;
}

function renderSharedLessonModel(topic, config, lessonModel) {
  const kind = lessonModel.kind || "interactive model";
  const isFactorTree = kind === "factor-tree" || kind === "factor-tree-lab";
  let modelName = lessonModel.title;
  let modelNameEs = "";
  let icon = isFactorTree ? "🌳" : kind === "fraction-divide" ? "🥞" : "🖐️";

  if (kind === "fraction-divide") {
    modelName = "Fraction Division Visualizer & Lab";
    modelNameEs = "Visualizador interactivo de división de fracciones";
    icon = "🥞";
  } else if (!modelName || modelName === "Interactive Lesson Model") {
    if (kind === "unit-rate-builder") {
      modelName = "Unit Rate & Price Calculator";
      modelNameEs = "Calculadora de tasa unitaria y precios";
      icon = "⚖️";
    } else if (kind === "ratio-table-builder") {
      modelName = "Ratio Table Builder";
      modelNameEs = "Constructor de tablas de razones";
      icon = "📊";
    } else if (kind === "line-grapher") {
      modelName = "Ratio Line Grapher";
      modelNameEs = "Graficador de razones";
      icon = "📈";
    } else if (kind === "tape-diagram") {
      modelName = "Equal Batches Tape Diagram";
      modelNameEs = "Diagrama de cinta de lotes iguales";
      icon = "📏";
    } else if (isFactorTree) {
      modelName = "Factor Tree Builder";
      modelNameEs = "Constructor de árboles de factores";
      icon = "🌳";
    } else {
      modelName = config.title ? `${config.title} Model` : "Interactive Lesson Model";
      modelNameEs = "Modelo interactivo de la lección";
    }
  } else {
    modelNameEs = lessonModel.titleEs || "Modelo interactivo de la lección";
  }

  const prompt = isFactorTree
    ? "Enter two factors for each composite circle. Keep splitting until every leaf is prime."
    : kind === "fraction-divide"
      ? "Choose a division problem. Watch how the total amount is cut into equal fraction pieces."
      : "Use the same interactive model from the lesson. Change it, notice the pattern, and explain what the model shows.";
  const promptEs = isFactorTree
    ? "Escribe dos factores para cada círculo compuesto. Sigue dividiendo hasta que cada hoja sea prima."
    : kind === "fraction-divide"
      ? "Elige un problema de división. Observa cómo la cantidad total se divide en partes fraccionarias iguales."
      : "Usa el mismo modelo interactivo de la lección. Cámbialo, observa el patrón y explica lo que muestra.";
  const idea =
    config.launch?.conceptIntro?.keyIdea ||
    config.explore?.conceptIntro?.keyIdea ||
    config.contentObjective ||
    config.title;

  /* The three TOUCH & TRY cards default to text that is IDENTICAL on all 164
     family homeworks — "Move, type, tap, or drag in the model" tells a family
     nothing about tonight's mathematics. A lesson whose model shows more than
     one idea cannot ask for either one without saying so, which is how 3-1
     ended up with a tape diagram that can show part-to-part AND part-to-whole
     and a prompt that named neither. A lesson authors its own in the
     family-note sidecar under `touchAndTry`; everything unset falls back. */
  const authored = config.familyNotes?.touchAndTry || {};
  const touch = {
    touchEn:
      authored.touchEn ||
      (isFactorTree
        ? "Choose two factors that multiply to the number in the circle."
        : "Move, type, tap, or drag in the model. Watch what changes."),
    touchEs:
      authored.touchEs ||
      (isFactorTree
        ? "Elige dos factores cuyo producto sea el número del círculo."
        : "Mueve, escribe, toca o arrastra en el modelo. Observa qué cambia."),
    mathEn: authored.mathEn || "Record one equation, value, or relationship you can see.",
    mathEs: authored.mathEs || "Escribe una ecuación, un valor o una relación que puedas ver.",
    explainEn: authored.explainEn || "I notice ___ changes when ___ changes. This shows ___.",
    explainEs: authored.explainEs || "Noto que ___ cambia cuando ___ cambia. Esto muestra ___.",
  };

  return `<section class="family-visual-lab" data-visual-lab="${esc(topic)}" data-lesson-model="${esc(kind)}" aria-labelledby="visual_lab_title">
    <div class="visual-lab-heading">
      <div><span class="visual-lab-kicker"><span class="lang-en">TOUCH &amp; TRY</span><span class="lang-es" lang="es">TOCA Y PRUEBA</span></span>
      <h2 id="visual_lab_title"><span aria-hidden="true">${icon}</span> <span class="lang-en">${esc(modelName)}</span><span class="lang-es" lang="es">${esc(modelNameEs)}</span></h2></div>
      <p><span class="lang-en">${esc(prompt)}</span><span class="lang-es" lang="es">${esc(promptEs)}</span></p>
    </div>
    <div class="visual-lab-stage" data-lesson-model-host>${lessonModel.html}</div>
    <div class="visual-representation-grid" aria-label="Three ways to understand the lesson model">
      <article class="visual-representation-card visual-representation-model"><span class="representation-number">1</span><h3><span class="lang-en">Touch and change</span><span class="lang-es" lang="es">Toca y cambia</span></h3><p><span class="lang-en">${esc(touch.touchEn)}</span><span class="lang-es" lang="es">${esc(touch.touchEs)}</span></p></article>
      <article class="visual-representation-card visual-representation-math"><span class="representation-number">2</span><h3><span class="lang-en">Write the math</span><span class="lang-es" lang="es">Escribe las matemáticas</span></h3><p><span class="lang-en">${esc(touch.mathEn)}</span><span class="lang-es" lang="es">${esc(touch.mathEs)}</span></p></article>
      <article class="visual-representation-card visual-representation-words">
        <span class="representation-number">3</span>
        <h3><span class="lang-en">Explain the model</span><span class="lang-es" lang="es">Explica el modelo</span></h3>
        <p><span class="lang-en">${esc(touch.explainEn)}</span><span class="lang-es" lang="es">${esc(touch.explainEs)}</span></p>
        <div class="visual-coach-box">
          <strong>💬 <span class="lang-en">Family conversation:</span><span class="lang-es" lang="es">Conversación familiar:</span></strong>
          <p class="visual-coach-q"><span class="lang-en">Ask: "Where do you see the numbers from tonight&#039;s math in this model?"</span><span class="lang-es" lang="es">Pregunta: "¿Dónde ves los números de la tarea de hoy en este modelo?"</span></p>
        </div>
        <details><summary><span class="lang-en">Lesson connection</span><span class="lang-es" lang="es">Conexión con la lección</span></summary><p class="visual-source-idea">${esc(idea)}</p></details>
      </article>
    </div>
  </section>`;
}

export function renderVisualMathLab(topic, config, lessonModel = null) {
  if (lessonModel?.html) return renderSharedLessonModel(topic, config, lessonModel);
  const lab = LABS[topic] || LABS.fallback;
  const controls = lab.controls
    .map(
      ([
        key,
        en,
        es,
        min,
        max,
        value,
      ]) => `<label class="visual-lab-control" for="visual_${esc(key)}">
        <span class="visual-lab-control-label"><span class="lang-en">${esc(en)}</span><span class="lang-es" lang="es">${esc(es)}</span> <output data-lab-output="${esc(key)}">${value}</output></span>
        <input id="visual_${esc(key)}" type="range" min="${min}" max="${max}" value="${value}" step="1" data-lab-input="${esc(key)}" />
      </label>`,
    )
    .join("");
  const presetsHtml = (lab.presets || [])
    .map(
      (
        p,
      ) => `<button type="button" class="preset-pill-btn" data-preset="${esc(JSON.stringify(p.values))}">
        <span class="lang-en">${esc(p.labelEn)}</span><span class="lang-es" lang="es">${esc(p.labelEs)}</span>
      </button>`,
    )
    .join("");

  const legendHtml = (lab.legend || [])
    .map(
      (l) =>
        `<span class="legend-chip"><span class="legend-swatch swatch-${esc(l.color)}"></span> <span class="lang-en">${esc(l.labelEn)}</span><span class="lang-es" lang="es">${esc(l.labelEs)}</span></span>`,
    )
    .join("");

  const idea =
    config.launch?.conceptIntro?.keyIdea ||
    config.explore?.conceptIntro?.keyIdea ||
    config.contentObjective ||
    config.title ||
    "Explain what changes and what stays the same.";

  return `<section class="family-visual-lab" data-visual-lab="${esc(topic)}" aria-labelledby="visual_lab_title">
    <div class="visual-lab-heading">
      <div><span class="visual-lab-kicker"><span class="lang-en">TOUCH &amp; TRY</span><span class="lang-es" lang="es">TOCA Y PRUEBA</span></span>
      <h2 id="visual_lab_title"><span aria-hidden="true">🖐️</span> <span class="lang-en">${esc(lab.name)}</span><span class="lang-es" lang="es">${esc(lab.nameEs)}</span></h2></div>
      <p><span class="lang-en">${esc(lab.prompt)}</span><span class="lang-es" lang="es">${esc(lab.promptEs)}</span></p>
    </div>
    <div class="visual-lab-layout">
      <div class="visual-lab-canvas-wrap">
        <div class="visual-lab-stage" data-lab-stage>${initialPreview()}</div>
        ${legendHtml ? `<div class="visual-lab-legend" aria-label="Visual model color guide">${legendHtml}</div>` : ""}
        <p class="visual-lab-status" data-lab-status role="status" aria-live="polite"></p>
      </div>
      <div class="visual-lab-controls" aria-label="Interactive math controls">
        ${presetsHtml ? `<div class="visual-lab-presets" role="group" aria-label="Quick scenarios"><span class="presets-label"><span class="lang-en">⚡ Quick Try:</span><span class="lang-es" lang="es">⚡ Prueba rápida:</span></span><div class="preset-pill-group">${presetsHtml}</div></div>` : ""}
        ${controls}
        <div class="visual-lab-actions">
          <button type="button" class="visual-lab-button" data-lab-random><span class="lang-en">🎲 Try another</span><span class="lang-es" lang="es">🎲 Prueba otro</span></button>
          <button type="button" class="visual-lab-button visual-lab-button-quiet" data-lab-reset><span class="lang-en">↺ Reset</span><span class="lang-es" lang="es">↺ Reiniciar</span></button>
        </div>
      </div>
    </div>
    <div class="visual-representation-grid" aria-label="Three ways to understand the math">
      <article class="visual-representation-card visual-representation-model"><span class="representation-number">1</span><h3><span class="lang-en">Picture it</span><span class="lang-es" lang="es">Dibújalo</span></h3><div class="mini-model" data-lab-mini aria-hidden="true"></div></article>
      <article class="visual-representation-card visual-representation-math"><span class="representation-number">2</span><h3><span class="lang-en">Write the math</span><span class="lang-es" lang="es">Escribe las matemáticas</span></h3><p data-lab-equation>—</p></article>
      <article class="visual-representation-card visual-representation-words">
        <span class="representation-number">3</span>
        <h3><span class="lang-en">Say what you notice</span><span class="lang-es" lang="es">Di lo que notas</span></h3>
        <p data-lab-observation>—</p>
        <div class="visual-coach-box">
          <strong>💬 <span class="lang-en">Family conversation:</span><span class="lang-es" lang="es">Conversación familiar:</span></strong>
          <p class="visual-coach-q"><span class="lang-en">${esc(lab.coachEn || "What stays the same when you change the numbers?")}</span><span class="lang-es" lang="es">${esc(lab.coachEs || "¿Qué permanece igual cuando cambias los números?")}</span></p>
        </div>
        <details><summary><span class="lang-en">Sentence frame</span><span class="lang-es" lang="es">Marco de oración</span></summary><p><span class="lang-en">I notice ___ changes when ___ changes.</span><span class="lang-es" lang="es">Noto que ___ cambia cuando ___ cambia.</span></p><p class="visual-source-idea">${esc(idea)}</p></details>
      </article>
    </div>
  </section>`;
}

export const VISUAL_LABS_CSS = String.raw`
.family-visual-lab{--lab-ink:#173a5e;--lab-teal:#0b8f87;--lab-coral:#ff775f;--lab-sun:#f6c94c;margin:26px 0;padding:clamp(18px,3vw,30px);border:3px solid var(--lab-ink);border-radius:28px;background:#fffdf5;box-shadow:8px 8px 0 var(--lab-ink);color:var(--lab-ink)}
.visual-lab-heading{display:grid;grid-template-columns:minmax(240px,.85fr) minmax(260px,1.15fr);gap:20px;align-items:end;margin-bottom:20px}.visual-lab-heading h2{margin:6px 0 0;font-size:clamp(24px,4vw,38px);line-height:1.05}.visual-lab-heading p{margin:0;padding:14px 16px;border-left:5px solid var(--lab-sun);background:#fff8d9;font-size:17px;font-weight:700;line-height:1.45}.visual-lab-kicker{display:inline-flex;padding:5px 10px;border-radius:999px;background:var(--lab-ink);color:#fff;font-size:12px;font-weight:800;letter-spacing:.12em}.visual-lab-kicker .lang-en,.visual-lab-kicker .lang-es{color:inherit}
.visual-lab-layout{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(230px,.8fr);gap:18px;align-items:stretch}.visual-lab-canvas-wrap{min-width:0;padding:12px;border-radius:22px;background-color:#eef8f4;background-image:linear-gradient(#cee3dc 1px,transparent 1px),linear-gradient(90deg,#cee3dc 1px,transparent 1px);background-size:24px 24px;border:2px solid var(--lab-ink)}.visual-lab-stage{display:grid;place-items:center;min-height:280px}.visual-lab-stage svg{display:block;width:100%;max-height:320px;overflow:visible}.visual-lab-status{min-height:26px;margin:5px 8px 0;padding:7px 10px;border-radius:10px;background:#fff;font-weight:800;text-align:center}
.visual-lab-presets{display:flex;flex-direction:column;gap:6px;padding:10px 12px;background:rgba(255,255,255,.1);border-radius:14px;border:1px solid rgba(255,255,255,.2);margin-bottom:4px}
.presets-label{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--lab-sun)}
.preset-pill-group{display:flex;flex-wrap:wrap;gap:6px}
.preset-pill-btn{padding:5px 10px;border-radius:999px;border:1.5px solid rgba(255,255,255,.4);background:rgba(255,255,255,.15);color:#fff;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s ease;display:inline-flex;align-items:center}
.preset-pill-btn:hover{background:var(--lab-sun);color:var(--lab-ink);border-color:var(--lab-sun);transform:translateY(-1px)}
.preset-pill-btn.is-active{background:var(--lab-coral);color:#fff;border-color:#fff;box-shadow:0 2px 6px rgba(0,0,0,.25)}
.preset-pill-btn:focus-visible{outline:3px solid var(--lab-sun);outline-offset:2px}
.visual-lab-legend{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:8px 6px 2px}
.legend-chip{display:inline-flex;align-items:center;gap:6px;padding:3px 9px;border-radius:8px;background:rgba(255,255,255,.88);border:1px solid rgba(23,58,94,.18);font-size:12px;font-weight:700;color:var(--lab-ink)}
.legend-swatch{display:inline-block;width:11px;height:11px;border-radius:3px;border:1px solid rgba(0,0,0,.25)}
.legend-swatch.swatch-teal{background:var(--lab-teal)}
.legend-swatch.swatch-coral{background:var(--lab-coral)}
.legend-swatch.swatch-gold{background:var(--lab-sun)}
.visual-coach-box{margin-top:10px;padding:9px 12px;border-radius:12px;background:rgba(255,255,255,.85);border:1.5px solid rgba(23,58,94,.14)}
.visual-coach-box strong{display:block;margin-bottom:3px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--lab-ink)}
.visual-coach-q{margin:0!important;font-size:13.5px!important;font-weight:700!important;line-height:1.35!important;color:#183654!important;font-style:italic}
.visual-lab-controls{display:flex;flex-direction:column;gap:14px;padding:18px;border-radius:22px;background:var(--lab-ink);color:#fff}.visual-lab-control{display:grid;gap:7px;font-weight:800}.visual-lab-control-label{display:flex;justify-content:space-between;gap:10px;align-items:center}.visual-lab-control output{min-width:38px;padding:3px 8px;border-radius:8px;background:var(--lab-sun);color:#102f4e;text-align:center;font-size:18px}.visual-lab-control input[type=range]{width:100%;min-height:28px;accent-color:var(--lab-coral);cursor:pointer}.visual-lab-control input[type=range]:focus-visible{outline:4px solid #fff;outline-offset:4px}.visual-lab-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:auto}.visual-lab-button{min-height:48px;border:2px solid #fff;border-radius:13px;background:var(--lab-coral);color:#182f48;font:inherit;font-weight:800;cursor:pointer}.visual-lab-button-quiet{background:#fff}.visual-lab-button:hover{transform:translateY(-2px)}.visual-lab-button:focus-visible{outline:4px solid var(--lab-sun);outline-offset:3px}
.visual-representation-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:18px}.visual-representation-card{position:relative;min-height:150px;padding:18px 16px 15px;border:2px solid var(--lab-ink);border-radius:18px;background:#fff}.visual-representation-card h3{margin:0 0 10px;padding-left:30px;font-size:17px}.visual-representation-card p{margin:7px 0;font-size:16px;line-height:1.4}.representation-number{position:absolute;top:12px;left:12px;display:grid;width:27px;height:27px;place-items:center;border-radius:50%;background:var(--lab-ink);color:#fff;font-weight:800}.visual-representation-model{background:#dff5ee}.visual-representation-math{background:#fff2c2}.visual-representation-words{background:#ffe4dd}.visual-representation-math [data-lab-equation]{font-size:clamp(22px,3vw,32px);font-weight:800;text-align:center}.mini-model{display:flex;flex-wrap:wrap;gap:7px;align-content:center;min-height:76px;padding:8px}.mini-dot{width:18px;height:18px;border:2px solid var(--lab-ink);border-radius:50%;background:var(--lab-teal)}.visual-representation-card details{margin-top:10px}.visual-representation-card summary{cursor:pointer;font-weight:800;text-decoration:underline}.visual-source-idea{font-size:13px!important;color:#344f69}
.lab-label{font:800 16px "Outfit",sans-serif;fill:#173a5e}.lab-small{font:700 12px "Hanken Grotesk",sans-serif;fill:#173a5e}.lab-big{font:800 24px "Outfit",sans-serif;fill:#173a5e}.lab-grid{stroke:#bcd7d0;stroke-width:1}.lab-axis{stroke:#173a5e;stroke-width:3}.lab-accent{fill:#ff775f;stroke:#173a5e;stroke-width:2}.lab-teal{fill:#0b8f87;stroke:#173a5e;stroke-width:2}.lab-sun{fill:#f6c94c;stroke:#173a5e;stroke-width:2}
[data-lesson-model-host]{display:block;min-height:300px;padding:16px;border:2px solid var(--lab-ink);border-radius:22px;background-color:#eef8f4;background-image:linear-gradient(#cee3dc 1px,transparent 1px),linear-gradient(90deg,#cee3dc 1px,transparent 1px);background-size:24px 24px;overflow:auto}[data-lesson-model-host]>.interactive-visual{width:100%;margin:0!important}[data-lesson-model-host] .ftb-wrap,[data-lesson-model-host] .ftlab{max-width:760px}[data-lesson-model-host] input,[data-lesson-model-host] button{font-size:max(16px,1em)}[data-lesson-model] .visual-representation-card p{font-weight:700}
@media(max-width:760px){.family-visual-lab{border-radius:20px;box-shadow:5px 5px 0 var(--lab-ink)}.visual-lab-heading,.visual-lab-layout{grid-template-columns:1fr}.visual-lab-stage{min-height:230px}.visual-representation-grid{grid-template-columns:1fr}.visual-representation-card{min-height:120px}.visual-lab-actions{grid-template-columns:1fr 1fr}}
@media(prefers-reduced-motion:reduce){.visual-lab-button{transition:none!important}.visual-lab-button:hover{transform:none}}
@media print{.family-visual-lab{box-shadow:none;break-inside:avoid}.visual-lab-controls,.visual-lab-actions{display:none}.visual-lab-layout{grid-template-columns:1fr}.visual-representation-grid{grid-template-columns:repeat(3,1fr)}}
`;

export const VISUAL_LABS_JS = String.raw`
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function svgWrap(body, label) { return '<svg viewBox="0 0 560 280" role="img" aria-label="' + label + '"><rect x="8" y="8" width="544" height="264" rx="24" fill="#f8fbf2" stroke="#173a5e" stroke-width="3"/>' + body + '</svg>'; }
  function text(x,y,value,cls,anchor){return '<text x="'+x+'" y="'+y+'" class="'+(cls||'lab-label')+'" text-anchor="'+(anchor||'start')+'">'+value+'</text>';}
  function circle(x,y,r,cls){return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" class="'+(cls||'lab-teal')+'"/>';}
  function rect(x,y,w,h,cls,rx){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(rx||0)+'" class="'+(cls||'lab-teal')+'"/>';}
  function line(x1,y1,x2,y2,cls){return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" class="'+(cls||'lab-axis')+'"/>';}
  function gridLines(x,y,cols,rows,cell){var s='';for(var c=0;c<=cols;c++)s+=line(x+c*cell,y,x+c*cell,y+rows*cell,'lab-grid');for(var r=0;r<=rows;r++)s+=line(x,y+r*cell,x+cols*cell,y+r*cell,'lab-grid');return s;}
  function dots(count,cols,startX,startY,gap){var s='';for(var i=0;i<count;i++)s+=circle(startX+(i%cols)*gap,startY+Math.floor(i/cols)*gap,Math.min(12,gap*.28),i%2?'lab-accent':'lab-teal');return s;}
  function result(svg,equation,observation,status,mini){return{svg:svg,equation:equation,observation:observation,status:status,mini:mini||Math.min(18,Math.max(3,parseInt(equation,10)||8))};}
  function render(topic,v){
    var body='',eq='',obs='',status='',mini=8;
    if(topic==='exponents'){var total=Math.pow(v.base,v.power);for(var i=0;i<v.power;i++){body+=rect(70+i*105,92,72,72,i%2?'lab-accent':'lab-teal',14)+text(106+i*105,138,String(v.base),'lab-big','middle');if(i<v.power-1)body+=text(160+i*105,138,'×','lab-big','middle');}body+=text(280,220,'Multiply '+v.base+' a total of '+v.power+' times','lab-label','middle');eq=Array(v.power).fill(v.base).join(' × ')+' = '+total;obs='The exponent tells how many equal factors to use.';status=v.base+' to the power of '+v.power+' equals '+total;mini=v.power;}
    else if(topic==='ratios'){var a=v.batches*v.blue,b=v.batches*3;body+=dots(a,v.blue,90,72,36)+dots(b,3,350,72,36)+text(150,224,a+' blue','lab-big','middle')+text(410,224,b+' coral','lab-big','middle')+text(280,46,v.batches+' equivalent batch'+(v.batches===1?'':'es'),'lab-label','middle');eq=a+' : '+b+' = '+v.blue+' : 3';obs='Both parts are multiplied by the same number of batches.';status='The ratio is '+a+' to '+b;mini=Math.min(18,a+b);}
    else if(topic==='equations'){var totalEq=v.unknown+v.add;body+=line(90,105,470,105)+line(280,105,280,235)+rect(235,235,90,18,'lab-sun',6)+rect(80,125,180,70,'lab-teal',14)+rect(300,125,180,70,'lab-accent',14)+text(170,167,'x  +  '+v.add,'lab-big','middle')+text(390,167,String(totalEq),'lab-big','middle')+text(280,58,'Both sides have the same value','lab-label','middle');eq='x + '+v.add+' = '+totalEq+'  →  x = '+v.unknown;obs='Removing the same amount from both sides keeps the scale balanced.';status='The unknown value is '+v.unknown;mini=v.add;}
    else if(topic==='inequalities'){var start=70,step=42,y=145;body+=line(start,y,start+10*step,y);for(var ni=-5;ni<=5;ni++){var nx=start+(ni+5)*step;body+=line(nx,y-8,nx,y+8,'lab-axis')+text(nx,y+30,String(ni),'lab-small','middle');}var bx=start+(v.boundary+5)*step;body+='<rect x="'+bx+'" y="125" width="'+(start+10*step-bx)+'" height="40" fill="#0b8f87" opacity=".28"/>'+circle(bx,y,11,'lab-accent');var tx=start+(v.test+5)*step;body+=circle(tx,82,12,v.test>v.boundary?'lab-teal':'lab-sun')+line(tx,94,tx,126,'lab-axis')+text(280,52,'Shaded values are greater than '+v.boundary,'lab-label','middle');eq='x > '+v.boundary;obs=v.test+(v.test>v.boundary?' is':' is not')+' in the shaded solution set.';status='Test point '+v.test+(v.test>v.boundary?' works':' does not work');mini=Math.abs(v.test-v.boundary)+2;}
    else if(topic==='properties'){var cols=v.left+v.right,cell=Math.min(34,300/cols),gx=130,gy=58;body+=gridLines(gx,gy,cols,v.rows,cell);body+='<rect x="'+gx+'" y="'+gy+'" width="'+(v.left*cell)+'" height="'+(v.rows*cell)+'" fill="#0b8f87" opacity=".55"/><rect x="'+(gx+v.left*cell)+'" y="'+gy+'" width="'+(v.right*cell)+'" height="'+(v.rows*cell)+'" fill="#ff775f" opacity=".55"/>';body+=text(280,245,v.rows+' rows split into '+v.left+' and '+v.right+' columns','lab-label','middle');eq=v.rows+'('+v.left+' + '+v.right+') = '+(v.rows*v.left)+' + '+(v.rows*v.right)+' = '+(v.rows*cols);obs='Splitting the array does not change its total number of squares.';status='Total area: '+(v.rows*cols)+' square units';mini=Math.min(18,v.rows*cols);}
    else if(topic==='expressions'){for(var xt=0;xt<v.coefficient;xt++)body+=rect(55+xt*76,65,54,120,xt%2?'lab-accent':'lab-teal',9)+text(82+xt*76,135,'x','lab-big','middle');body+=dots(v.constant,5,135,225,33)+text(280,42,'Algebra tiles','lab-label','middle');eq=v.coefficient+'x + '+v.constant;obs='Long tiles represent x; small tiles represent units.';status=v.coefficient+' variable tiles and '+v.constant+' unit tiles';mini=v.coefficient+v.constant;}
    else if(topic==='area'){var cellA=Math.min(30,300/v.width,150/v.height),ax=130,ay=52;body+=gridLines(ax,ay,v.width,v.height,cellA)+'<rect x="'+ax+'" y="'+ay+'" width="'+(v.width*cellA)+'" height="'+(v.height*cellA)+'" fill="#0b8f87" opacity=".38"/>';body+=text(ax+v.width*cellA/2,ay+v.height*cellA+35,v.width+' columns','lab-label','middle')+text(75,ay+v.height*cellA/2,v.height+' rows','lab-label','middle');eq=v.width+' × '+v.height+' = '+(v.width*v.height)+' square units';obs='Area counts every square inside the shape.';status='Area: '+(v.width*v.height)+' square units';mini=Math.min(18,v.width*v.height);}
    else if(topic==='volume'){var layer=v.length*v.width,totalV=layer*v.height;for(var z=0;z<v.height;z++){var ox=105+z*18,oy=165-z*30;body+='<polygon points="'+ox+','+oy+' '+(ox+v.length*38)+','+oy+' '+(ox+v.length*38+v.width*18)+','+(oy-v.width*18)+' '+(ox+v.width*18)+','+(oy-v.width*18)+'" fill="'+(z%2?'#ff775f':'#0b8f87')+'" opacity=".52" stroke="#173a5e" stroke-width="2"/>';}body+=text(280,45,v.height+' layer'+(v.height===1?'':'s')+' · '+layer+' cubes each','lab-label','middle')+text(280,242,totalV+' unit cubes','lab-big','middle');eq=v.length+' × '+v.width+' × '+v.height+' = '+totalV+' cubic units';obs='Each layer has length × width cubes.';status='Volume: '+totalV+' cubic units';mini=Math.min(18,totalV);}
    else if(topic==='surface-area'){var scale=18,l=v.length*scale,w=v.width*scale,h=v.height*scale,cx=280,cy=135;body+=rect(cx-l/2,cy-h/2,l,h,'lab-teal')+rect(cx-l/2,cy-h/2-w,l,w,'lab-sun')+rect(cx-l/2,cy+h/2,l,w,'lab-sun')+rect(cx-l/2-w,cy-h/2,w,h,'lab-accent')+rect(cx+l/2,cy-h/2,w,h,'lab-accent')+rect(cx-l/2,cy+h/2+w,l,w,'lab-teal');var sa=2*(v.length*v.width+v.length*v.height+v.width*v.height);body+=text(280,45,'Six faces unfold into one net','lab-label','middle')+text(280,255,'Add every face','lab-label','middle');eq='2('+v.length+'×'+v.width+' + '+v.length+'×'+v.height+' + '+v.width+'×'+v.height+') = '+sa;obs='Opposite faces have matching dimensions and areas.';status='Surface area: '+sa+' square units';mini=6;}
    else if(topic==='statistics'){var vals=[v.center-v.spread,v.center-1,v.center,v.center,v.center+1,v.center+v.spread];var counts={},dataMin=Math.min.apply(null,vals)-1,dataMax=Math.max.apply(null,vals)+1,dataSpan=dataMax-dataMin;vals.forEach(function(n){counts[n]=(counts[n]||0)+1;});body+=line(70,220,490,220);for(var sn=dataMin;sn<=dataMax;sn++){var sx=70+(sn-dataMin)*(420/dataSpan);body+=line(sx,212,sx,228,'lab-axis')+text(sx,250,String(sn),'lab-small','middle');}Object.keys(counts).forEach(function(k){for(var di=0;di<counts[k];di++)body+=circle(70+(Number(k)-dataMin)*(420/dataSpan),195-di*32,11,Number(k)===v.center?'lab-accent':'lab-teal');});body+=text(280,45,'Data values: '+vals.join(', '),'lab-label','middle');eq='center = '+v.center+' · range = '+(Math.max.apply(null,vals)-Math.min.apply(null,vals));obs='A larger spread moves the outside dots farther from the center.';status='Six data points centered near '+v.center;mini=6;}
    else if(topic==='coordinate-plane'){var ox=280,oy=140,st=22;for(var gi=-5;gi<=5;gi++){body+=line(ox+gi*st,30,ox+gi*st,250,'lab-grid')+line(170,oy+gi*st,390,oy+gi*st,'lab-grid');}body+=line(160,oy,400,oy)+line(ox,20,ox,260)+circle(ox+v.x*st,oy-v.y*st,13,'lab-accent')+line(ox,oy-v.y*st,ox+v.x*st,oy-v.y*st,'lab-grid')+line(ox+v.x*st,oy,ox+v.x*st,oy-v.y*st,'lab-grid')+text(ox+v.x*st+18,oy-v.y*st-10,'('+v.x+', '+v.y+')','lab-label');eq='(x, y) = ('+v.x+', '+v.y+')';obs='Move across for x first, then move up or down for y.';status='Point at '+v.x+', '+v.y;mini=Math.abs(v.x)+Math.abs(v.y)+2;}
    else if(topic==='number-line'){var nstart=70,nstep=14,ny=150;body+=line(nstart,ny,nstart+30*nstep,ny);for(var nn=-15;nn<=15;nn++){var xx=nstart+(nn+15)*nstep;body+=line(xx,ny-7,xx,ny+7,'lab-axis');if(nn%5===0)body+=text(xx,ny+28,String(nn),'lab-small','middle');}var end=v.point+v.jump,p1=nstart+(v.point+15)*nstep,p2=nstart+(end+15)*nstep;body+=circle(p1,ny,12,'lab-teal')+circle(p2,ny,12,'lab-accent')+'<path d="M'+p1+' 115 Q'+((p1+p2)/2)+' 68 '+p2+' 115" fill="none" stroke="#ff775f" stroke-width="5"/>';body+=text(280,48,'Start '+v.point+' · jump '+v.jump,'lab-label','middle');eq=v.point+(v.jump>=0?' + ':' − ')+Math.abs(v.jump)+' = '+end;obs='Positive jumps move right; negative jumps move left.';status='The jump lands on '+end;mini=Math.abs(v.jump)+3;}
    else if(topic==='fractions'){var den=v.denominator,num=clamp(v.numerator,0,12),barCount=Math.max(1,Math.ceil(num/den)),bw=380/den,barH=Math.min(38,150/barCount),barGap=8,fy=64;for(var fb=0;fb<barCount;fb++){for(var fi=0;fi<den;fi++){var part=fb*den+fi;body+=rect(90+fi*bw,fy+fb*(barH+barGap),bw,barH,part<num?'lab-teal':'lab-sun',0);}}body+=text(280,42,num+' shaded parts · '+den+' equal parts per whole','lab-label','middle')+text(280,250,num+'/'+den,'lab-big','middle');eq=num+' / '+den;obs='The denominator sets equal parts in each whole; the numerator counts all shaded parts.';status=num+' parts are shaded in groups of '+den;mini=Math.min(18,Math.max(den,num));}
    else if(topic==='decimals'){var hv=v.hundredths,cellD=18,dx=190,dy=38;body+=gridLines(dx,dy,10,10,cellD);for(var hi=0;hi<hv;hi++)body+='<rect x="'+(dx+(hi%10)*cellD)+'" y="'+(dy+Math.floor(hi/10)*cellD)+'" width="'+cellD+'" height="'+cellD+'" fill="'+(hi%10===0?'#ff775f':'#0b8f87')+'" opacity=".75"/>';body+=text(110,126,(hv/100).toFixed(2),'lab-big','middle')+text(450,126,hv+'%','lab-big','middle');eq=hv+'/100 = '+(hv/100).toFixed(2)+' = '+hv+'%';obs='Each small square is one hundredth of the whole grid.';status=hv+' hundredths are shaded';mini=Math.min(18,Math.ceil(hv/6));}
    else if(topic==='division'){var dNum=clamp(v.dividend||1344,10,9999),qDiv=clamp(v.divisor||12,1,99),quot=Math.floor(dNum/qDiv),rem=dNum%qDiv,curStep=clamp(v.step||4,1,4);body+=rect(30,30,500,220,'lab-sun',16);body+=text(140,88,String(qDiv),'lab-big','end')+line(150,55,150,102,'lab-axis')+line(150,55,340,55,'lab-axis')+text(165,88,String(dNum),'lab-big','start')+text(165,46,curStep>=1?String(quot):'?','lab-big','start');var stepLetters=['D','M','S','B'],stepLabels=['Divide','Multiply','Subtract','Bring down'],stepNames=['1. D — Divide: determine quotient digit','2. M — Multiply: multiply quotient digit × divisor','3. S — Subtract: find difference (must be < divisor)','4. B — Bring down: bring next digit down and repeat'];for(var si=0;si<4;si++){var px=45+si*118,py=120,isAct=(si+1)===curStep;body+=rect(px,py,110,34,isAct?'lab-accent':(si+1<curStep?'lab-teal':'lab-sun'),8)+circle(px+16,py+17,10,isAct?'lab-sun':'lab-teal')+text(px+16,py+22,stepLetters[si],'lab-small','middle')+text(px+34,py+22,stepLabels[si],'lab-small','start');}body+=text(280,188,stepNames[curStep-1],'lab-label','middle')+text(280,225,dNum+' ÷ '+qDiv+' = '+quot+(rem>0?' R '+rem:''),'lab-big','middle');eq=dNum+' ÷ '+qDiv+' = '+quot+(rem>0?' R '+rem:'');obs='Long division standard algorithm: Divide → Multiply → Subtract → Bring down (DMSB).';status=dNum+' ÷ '+qDiv+' = '+quot+(rem>0?' with remainder '+rem:'')+' · Check: '+qDiv+' × '+quot+(rem>0?' + '+rem:'')+' = '+dNum;mini=4;}
    else{var total=v.groups*v.items;for(var gr=0;gr<v.groups;gr++){body+=rect(45+gr*82,70,66,130,gr%2?'lab-accent':'lab-teal',14)+text(78+gr*82,58,'Group '+(gr+1),'lab-small','middle')+dots(v.items,2,66+gr*82,95,25);}eq=v.groups+' × '+v.items+' = '+total;obs='Equal groups connect a picture to multiplication.';status=total+' items in all';mini=Math.min(18,total);}
    return result(svgWrap(body,status||'Interactive math visual'),eq,obs,status,mini);
  }
  function values(lab){var out={};lab.querySelectorAll('[data-lab-input]').forEach(function(input){out[input.getAttribute('data-lab-input')]=Number(input.value);});return out;}
  function update(lab){var v=values(lab),topic=lab.getAttribute('data-visual-lab')||'fallback',r=render(topic,v);lab.querySelector('[data-lab-stage]').innerHTML=r.svg;lab.querySelector('[data-lab-equation]').textContent=r.equation;lab.querySelector('[data-lab-observation]').textContent=r.observation;lab.querySelector('[data-lab-status]').textContent=r.status;lab.querySelectorAll('[data-lab-output]').forEach(function(o){o.value=v[o.getAttribute('data-lab-output')];o.textContent=v[o.getAttribute('data-lab-output')];});var mini=lab.querySelector('[data-lab-mini]');mini.innerHTML='';for(var i=0;i<r.mini;i++){var dot=document.createElement('span');dot.className='mini-dot';mini.appendChild(dot);}}
  function init(lab){var initial={};lab.querySelectorAll('[data-lab-input]').forEach(function(input){initial[input.getAttribute('data-lab-input')]=input.value;input.addEventListener('input',function(){lab.querySelectorAll('[data-preset]').forEach(function(b){b.classList.remove('is-active');});update(lab);});});lab.querySelectorAll('[data-preset]').forEach(function(btn){btn.addEventListener('click',function(){try{var vals=JSON.parse(btn.getAttribute('data-preset'));lab.querySelectorAll('[data-preset]').forEach(function(b){b.classList.remove('is-active');});btn.classList.add('is-active');Object.keys(vals).forEach(function(k){var inp=lab.querySelector('[data-lab-input="'+k+'"]');if(inp)inp.value=vals[k];});update(lab);}catch(e){}});});lab.querySelector('[data-lab-reset]').addEventListener('click',function(){lab.querySelectorAll('[data-preset]').forEach(function(b){b.classList.remove('is-active');});lab.querySelectorAll('[data-lab-input]').forEach(function(input){input.value=initial[input.getAttribute('data-lab-input')];});update(lab);});lab.querySelector('[data-lab-random]').addEventListener('click',function(){lab.querySelectorAll('[data-preset]').forEach(function(b){b.classList.remove('is-active');});lab.querySelectorAll('[data-lab-input]').forEach(function(input){var min=Number(input.min),max=Number(input.max);input.value=Math.floor(Math.random()*(max-min+1))+min;});update(lab);});update(lab);}
  function initAll(){document.querySelectorAll('[data-visual-lab]').forEach(function(lab){if(lab.getAttribute('data-visual-ready')||lab.querySelector('[data-lesson-model-host]'))return;lab.setAttribute('data-visual-ready','1');init(lab);});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initAll);else initAll();
})();
`;
