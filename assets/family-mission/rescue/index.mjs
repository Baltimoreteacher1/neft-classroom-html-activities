/**
 * Math Rescue & Adaptive Practice Engine
 *
 * 1. Deterministic Misconception Diagnostic Engine (`diagnoseMisconception`):
 *    Analyzes student responses, choice feedback, and numeric relationships across all Grade 6
 *    domains (Exponents, Ratios, Percentages, Fractions/Decimals, Expressions/Equations,
 *    Geometry, Integers/Coordinates, Statistics). Supports multiple possible explanations and
 *    interactive diagnostic questions when a misconception is ambiguous.
 *
 * 2. Interactive Math Rescue Tutor (`mountMathRescue`):
 *    - Identifies the specific misconception (or asks a 2-option diagnostic check if ambiguous)
 *    - Displays a concise, non-judgmental targeted explanation (EN/ES)
 *    - Activates a live interactive visual mini-model right inside the rescue card
 *    - Prompts the student to reconstruct their reasoning
 *    - Generates a fresh equivalent transfer problem to verify understanding
 *    - Feeds evidence into the Adaptive Practice Engine
 *
 * 3. Adaptive Practice Engine (`evaluateAdaptivePathway`, `mountAdaptiveControls`):
 *    - Maintains internal pathway (`support`, `core`, `extend`) without ever visibly labeling
 *      students as low, average, or advanced
 *    - Adapts based on accuracy, misconception recurrence, hint usage, and revision success
 *      (never speed)
 *    - Provides "Practice More", "Show Me Another Way", and "Challenge Me" student-agency tools
 */

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const bi = (en, es) =>
  `<span class="lang-en">${esc(en)}</span><span class="lang-es" lang="es">${esc(es ?? en)}</span>`;

// ── Misconception Catalog across all Grade 6 Units ──────────────────────────

export const MISCONCEPTIONS = {
  "exponent-as-multiplier": {
    id: "exponent-as-multiplier",
    domain: "exponents",
    titleEn: "Multiplying base × exponent instead of repeated multiplication",
    titleEs: "Multiplicar base × exponente en lugar de multiplicación repetida",
    explainEn:
      "An exponent tells how many times to multiply the base by itself. For example, 2³ means 2 × 2 × 2 = 8, not 2 × 3 = 6.",
    explainEs:
      "Un exponente indica cuántas veces se multiplica la base por sí misma. Por ejemplo, 2³ significa 2 × 2 × 2 = 8, no 2 × 3 = 6.",
    reconstructQEn: "In 2³, what operation connects the three 2s?",
    reconstructQEs: "En 2³, ¿qué operación conecta los tres 2?",
    reconstructOpts: [
      { id: "mul", en: "Multiply: 2 × 2 × 2 = 8", es: "Multiplicar: 2 × 2 × 2 = 8", ok: true },
      { id: "add", en: "Add: 2 + 2 + 2 = 6", es: "Sumar: 2 + 2 + 2 = 6", ok: false },
    ],
    modelType: "exponents",
  },
  "swapped-base-exponent": {
    id: "swapped-base-exponent",
    domain: "exponents",
    titleEn: "Swapping the base and the exponent",
    titleEs: "Intercambiar la base y el exponente",
    explainEn:
      "The bottom number is the base (the factor you repeat) and the small raised number is the exponent (how many times the base appears).",
    explainEs:
      "El número de abajo es la base (el factor que se repite) y el número pequeño arriba es el exponente (cuántas veces aparece la base).",
    reconstructQEn: "In 2⁴, which factor is multiplied repeatedly?",
    reconstructQEs: "En 2⁴, ¿qué factor se multiplica repetidamente?",
    reconstructOpts: [
      { id: "two", en: "Four factors of 2: 2 × 2 × 2 × 2 = 16", es: "Cuatro factores de 2: 2 × 2 × 2 × 2 = 16", ok: true },
      { id: "four", en: "Two factors of 4: 4 × 4 = 16", es: "Dos factores de 4: 4 × 4 = 16", ok: false },
    ],
    modelType: "exponents",
  },
  "zero-power-is-zero": {
    id: "zero-power-is-zero",
    domain: "exponents",
    titleEn: "Treating a zero exponent as 0 instead of 1",
    titleEs: "Pensar que un exponente cero da 0 en lugar de 1",
    explainEn:
      "Every time the exponent goes down by 1, we divide by the base: 2² = 4, 2¹ = 2, so 2⁰ = 2 ÷ 2 = 1.",
    explainEs:
      "Cada vez que el exponente baja en 1, dividimos entre la base: 2² = 4, 2¹ = 2, así que 2⁰ = 2 ÷ 2 = 1.",
    reconstructQEn: "Following the pattern 3² = 9, 3¹ = 3, what is 3⁰?",
    reconstructQEs: "Siguiendo el patrón 3² = 9, 3¹ = 3, ¿cuánto es 3⁰?",
    reconstructOpts: [
      { id: "one", en: "3 ÷ 3 = 1", es: "3 ÷ 3 = 1", ok: true },
      { id: "zero", en: "3 × 0 = 0", es: "3 × 0 = 0", ok: false },
    ],
    modelType: "exponents",
  },
  "order-of-operations": {
    id: "order-of-operations",
    domain: "exponents",
    titleEn: "Adding or subtracting before evaluating exponents and multiplication",
    titleEs: "Sumar o restar antes de evaluar exponentes y multiplicación",
    explainEn:
      "Evaluate grouping symbols first, then exponents, then multiply/divide from left to right, and add/subtract last.",
    explainEs:
      "Evalúa primero los símbolos de agrupación, luego los exponentes, después multiplica/divide de izquierda a derecha y suma/resta al final.",
    reconstructQEn: "In 4 + 3 × 2², which step comes first?",
    reconstructQEs: "En 4 + 3 × 2², ¿qué paso va primero?",
    reconstructOpts: [
      { id: "exp", en: "Evaluate 2² = 4 first", es: "Evaluar 2² = 4 primero", ok: true },
      { id: "add", en: "Add 4 + 3 = 7 first", es: "Sumar 4 + 3 = 7 primero", ok: false },
    ],
    modelType: "exponents",
  },
  "additive-ratio": {
    id: "additive-ratio",
    domain: "ratio",
    titleEn: "Adding the same number instead of multiplying by a scale factor",
    titleEs: "Sumar el mismo número en lugar de multiplicar por un factor de escala",
    explainEn:
      "Equivalent ratios grow by multiplying or dividing both quantities by the same scale factor—not by adding the same amount to both.",
    explainEs:
      "Las razones equivalentes crecen multiplicando o dividiendo ambas cantidades por el mismo factor, no sumando la misma cantidad a las dos.",
    reconstructQEn: "If a recipe uses 2 cups of flour for 3 cups of sugar, how much flour goes with 6 cups of sugar?",
    reconstructQEs: "Si una receta usa 2 tazas de harina por 3 de azúcar, ¿cuánta harina va con 6 tazas de azúcar?",
    reconstructOpts: [
      { id: "mul", en: "Multiply both by 2 → 4 cups of flour", es: "Multiplicar ambos por 2 → 4 tazas de harina", ok: true },
      { id: "add", en: "Add 3 to both → 5 cups of flour", es: "Sumar 3 a ambos → 5 tazas de harina", ok: false },
    ],
    modelType: "ratio",
  },
  "part-whole-percent": {
    id: "part-whole-percent",
    domain: "percent",
    titleEn: "Swapping the part, the whole, and the percent",
    titleEs: "Confundir la parte, el total y el porcentaje",
    explainEn:
      "A percent compares a part to 100 equal parts of the whole (100% = 1 whole). Check whether the problem gives you the whole or asks you to find the whole.",
    explainEs:
      "Un porcentaje compara una parte con 100 partes iguales del total (100% = 1 total). Revisa si el problema te da el total o te pide hallarlo.",
    reconstructQEn: "If 25% of a goal is 10 books, is 10 the part or the whole?",
    reconstructQEs: "Si el 25% de una meta son 10 libros, ¿es 10 la parte o el total?",
    reconstructOpts: [
      { id: "part", en: "10 is the part (1/4 of the whole, so the whole is 40)", es: "10 es la parte (1/4 del total, así que el total es 40)", ok: true },
      { id: "whole", en: "10 is the whole", es: "10 es el total", ok: false },
    ],
    modelType: "percent",
  },
  "fraction-division": {
    id: "fraction-division",
    domain: "fractions",
    titleEn: "Dividing numerators or forgetting how many divisor groups fit in the dividend",
    titleEs: "Olvidar contar cuántos grupos del divisor caben en el dividendo",
    explainEn:
      "Dividing by a fraction asks: how many groups of the divisor fit inside the dividend? Multiplying by the reciprocal counts those equal parts.",
    explainEs:
      "Dividir entre una fracción pregunta: ¿cuántos grupos del divisor caben en el dividendo? Multiplicar por el recíproco cuenta esas partes iguales.",
    reconstructQEn: "How many 1/4-cup servings fit inside 2 wholes?",
    reconstructQEs: "¿Cuántas porciones de 1/4 de taza caben en 2 enteros?",
    reconstructOpts: [
      { id: "eight", en: "2 × 4 = 8 servings of 1/4", es: "2 × 4 = 8 porciones de 1/4", ok: true },
      { id: "half", en: "2 ÷ 4 = 1/2 serving", es: "2 ÷ 4 = 1/2 porción", ok: false },
    ],
    modelType: "tape",
  },
  "equation-balance": {
    id: "equation-balance",
    domain: "balance",
    titleEn: "Using the same operation instead of the inverse operation on both sides",
    titleEs: "Usar la misma operación en lugar de la operación inversa en ambos lados",
    explainEn:
      "To isolate x on a balanced equation, undo the operation using its inverse on BOTH sides of the equals sign.",
    explainEs:
      "Para despejar x en una ecuación en equilibrio, deshaz la operación usando su inversa en AMBOS lados del signo igual.",
    reconstructQEn: "To solve x + 5 = 12, what keeps both sides balanced and isolates x?",
    reconstructQEs: "Para resolver x + 5 = 12, ¿qué mantiene ambos lados en equilibrio y despeja x?",
    reconstructOpts: [
      { id: "sub", en: "Subtract 5 from both sides → x = 7", es: "Restar 5 en ambos lados → x = 7", ok: true },
      { id: "add", en: "Add 5 to both sides → x = 17", es: "Sumar 5 en ambos lados → x = 17", ok: false },
    ],
    modelType: "balance",
  },
  "geometry-area-volume": {
    id: "geometry-area-volume",
    domain: "geometry",
    titleEn: "Using slant length instead of perpendicular height or forgetting 1/2 for triangles",
    titleEs: "Usar el lado inclinado en vez de la altura perpendicular u olvidar 1/2 en triángulos",
    explainEn:
      "A triangle is half of a parallelogram with the same base and perpendicular height: Area = ½ × base × height.",
    explainEs:
      "Un triángulo es la mitad de un paralelogramo con la misma base y altura perpendicular: Área = ½ × base × altura.",
    reconstructQEn: "A triangle has base 6 and perpendicular height 4. What is its area?",
    reconstructQEs: "Un triángulo tiene base 6 y altura perpendicular 4. ¿Cuál es su área?",
    reconstructOpts: [
      { id: "half", en: "½ × 6 × 4 = 12 square units", es: "½ × 6 × 4 = 12 unidades cuadradas", ok: true },
      { id: "full", en: "6 × 4 = 24 square units", es: "6 × 4 = 24 unidades cuadradas", ok: false },
    ],
    modelType: "geometry",
  },
  "signed-numbers-order": {
    id: "signed-numbers-order",
    domain: "numberline",
    titleEn: "Comparing negative numbers by magnitude alone instead of position on the number line",
    titleEs: "Comparar números negativos solo por su tamaño sin mirar la recta numérica",
    explainEn:
      "On a horizontal number line, numbers farther to the right are greater. −2 is to the right of −5, so −2 > −5.",
    explainEs:
      "En una recta numérica horizontal, los números más a la derecha son mayores. −2 está a la derecha de −5, así que −2 > −5.",
    reconstructQEn: "Which number is greater: −2 or −6?",
    reconstructQEs: "¿Qué número es mayor: −2 o −6?",
    reconstructOpts: [
      { id: "neg2", en: "−2 is greater because it is farther right on the number line", es: "−2 es mayor porque está más a la derecha en la recta numérica", ok: true },
      { id: "neg6", en: "−6 is greater because 6 > 2", es: "−6 es mayor porque 6 > 2", ok: false },
    ],
    modelType: "numberline",
  },
  "data-center-spread": {
    id: "data-center-spread",
    domain: "data",
    titleEn: "Finding the median without ordering the values first, or confusing mean and median",
    titleEs: "Buscar la mediana sin ordenar los datos primero, o confundir media y mediana",
    explainEn:
      "To find the median, sort the data from least to greatest first, then locate the middle value. To find the mean, add all values and divide by how many there are.",
    explainEs:
      "Para hallar la mediana, ordena primero los datos de menor a mayor y busca el valor central. Para la media, suma todos los valores y divide entre la cantidad de datos.",
    reconstructQEn: "For the data 2, 9, 4, what is the median?",
    reconstructQEs: "Para los datos 2, 9, 4, ¿cuál es la mediana?",
    reconstructOpts: [
      { id: "four", en: "Order first (2, 4, 9) → middle is 4", es: "Ordenar primero (2, 4, 9) → el centro es 4", ok: true },
      { id: "nine", en: "Middle number as written → 9", es: "El número del medio tal como está → 9", ok: false },
    ],
    modelType: "data",
  },
};

export function inferLessonDomain(lessonId = "", stem = "", feedback = "") {
  const id = String(lessonId).replace(/-part2$/, "");
  const unit = Number(id.split("-")[0]);
  const text = `${stem} ${feedback}`.toLowerCase();
  if (id === "6-3" || id === "6-4" || id === "6-14" || /exponent|power|\^|³|²/.test(text)) {
    return "exponents";
  }
  if (unit === 3 || /ratio|rate|per |batches|table/.test(text)) return "ratio";
  if (unit === 4 || /%|percent/.test(text)) return "percent";
  if (unit === 1 || /fraction|reciprocal|decimal|quotient/.test(text)) return "fractions";
  if (unit === 5 || /area|volume|triangle|parallelogram|prism|net/.test(text)) return "geometry";
  if (unit === 7 || /negative|opposite|absolute|quadrant|coordinate/.test(text)) return "numberline";
  if (unit === 2 || /median|mean|iqr|quartile|dot plot|histogram/.test(text)) return "data";
  return "balance";
}

/**
 * Deterministic diagnosis of a student error. Returns `{ misconception, confidence, alternatives }`.
 * When `confidence === "ambiguous"`, the UI asks a short 2-choice diagnostic question rather than
 * falsely claiming certainty.
 */
export function diagnoseMisconception({
  lessonId = "",
  stem = "",
  chosenText = "",
  correctText = "",
  feedbackEn = "",
  feedbackEs = "",
}) {
  const combined = `${stem} ${chosenText} ${feedbackEn}`.toLowerCase();
  const domain = inferLessonDomain(lessonId, stem, feedbackEn);

  if (domain === "exponents") {
    if (/multiply.*base.*exponent|times|multipli|2\s*×\s*3|base\s*×/.test(combined)) {
      return { misconception: MISCONCEPTIONS["exponent-as-multiplier"], confidence: "high", alternatives: [] };
    }
    if (/swap|base.*exponent|3\^2|reversed/.test(combined)) {
      return { misconception: MISCONCEPTIONS["swapped-base-exponent"], confidence: "high", alternatives: [] };
    }
    if (/zero power|\^0|= 0\b/.test(combined) && String(chosenText).trim() === "0") {
      return { misconception: MISCONCEPTIONS["zero-power-is-zero"], confidence: "high", alternatives: [] };
    }
    if (/order of operations|added.*before|left to right/.test(combined)) {
      return { misconception: MISCONCEPTIONS["order-of-operations"], confidence: "high", alternatives: [] };
    }
    return {
      misconception: MISCONCEPTIONS["exponent-as-multiplier"],
      confidence: "ambiguous",
      alternatives: [MISCONCEPTIONS["exponent-as-multiplier"], MISCONCEPTIONS["order-of-operations"]],
    };
  }

  if (domain === "ratio") {
    return {
      misconception: MISCONCEPTIONS["additive-ratio"],
      confidence: /add|sum|difference/.test(combined) ? "high" : "ambiguous",
      alternatives: [MISCONCEPTIONS["additive-ratio"]],
    };
  }
  if (domain === "percent") {
    return {
      misconception: MISCONCEPTIONS["part-whole-percent"],
      confidence: /part|whole|100/.test(combined) ? "high" : "ambiguous",
      alternatives: [MISCONCEPTIONS["part-whole-percent"]],
    };
  }
  if (domain === "fractions") {
    return {
      misconception: MISCONCEPTIONS["fraction-division"],
      confidence: /reciprocal|group|invert|multiply/.test(combined) ? "high" : "ambiguous",
      alternatives: [MISCONCEPTIONS["fraction-division"]],
    };
  }
  if (domain === "geometry") {
    return {
      misconception: MISCONCEPTIONS["geometry-area-volume"],
      confidence: /half|1\/2|slant|height|triangle/.test(combined) ? "high" : "ambiguous",
      alternatives: [MISCONCEPTIONS["geometry-area-volume"]],
    };
  }
  if (domain === "numberline") {
    return {
      misconception: MISCONCEPTIONS["signed-numbers-order"],
      confidence: /right|left|negative|zero|distance/.test(combined) ? "high" : "ambiguous",
      alternatives: [MISCONCEPTIONS["signed-numbers-order"]],
    };
  }
  if (domain === "data") {
    return {
      misconception: MISCONCEPTIONS["data-center-spread"],
      confidence: /order|sort|middle|mean|median/.test(combined) ? "high" : "ambiguous",
      alternatives: [MISCONCEPTIONS["data-center-spread"]],
    };
  }

  return {
    misconception: MISCONCEPTIONS["equation-balance"],
    confidence: /inverse|both sides|subtract|divide/.test(combined) ? "high" : "ambiguous",
    alternatives: [MISCONCEPTIONS["equation-balance"]],
  };
}

// ── Equivalent Transfer Problem Generator ───────────────────────────────────

export function generateEquivalentProblem(domain, seed = 1) {
  const s = Math.abs(Math.round(Number(seed) || 1));
  if (domain === "exponents") {
    const bases = [2, 3, 4, 5];
    const exps = [3, 4, 2, 3];
    const b = bases[s % bases.length];
    const e = exps[s % exps.length];
    const ans = Math.pow(b, e);
    const trapMul = b * e;
    const trapSwap = Math.pow(e, b);
    const trapAdd = ans + b;
    const choices = Array.from(new Set([ans, trapMul, trapSwap, trapAdd]));
    while (choices.length < 4) choices.push(ans + choices.length * 2);
    return {
      stemEn: `Equivalent Transfer Check: What is the value of ${b}^${e}?`,
      stemEs: `Comprobación equivalente: ¿Cuál es el valor de ${b}^${e}?`,
      correct: String(ans),
      choices: choices.map(String),
      explainEn: `${b}^${e} means ${Array.from({ length: e }, () => b).join(" × ")} = ${ans} (not ${b} × ${e} = ${trapMul}).`,
      explainEs: `${b}^${e} significa ${Array.from({ length: e }, () => b).join(" × ")} = ${ans} (no ${b} × ${e} = ${trapMul}).`,
    };
  }
  if (domain === "ratio") {
    const a = 2 + (s % 3);
    const b = a + 1 + (s % 2);
    const k = 3 + (s % 3);
    const ans = a * k;
    const targetB = b * k;
    const trapAdd = a + (targetB - b);
    const choices = Array.from(new Set([ans, trapAdd, ans + a, targetB]));
    return {
      stemEn: `Equivalent Transfer Check: A mix uses ${a} parts blue for every ${b} parts yellow. How many parts blue match ${targetB} parts yellow?`,
      stemEs: `Comprobación equivalente: Una mezcla usa ${a} partes azules por cada ${b} amarillas. ¿Cuántas partes azules corresponden a ${targetB} amarillas?`,
      correct: String(ans),
      choices: choices.map(String),
      explainEn: `Multiply both parts by the scale factor ${k}: ${a} × ${k} = ${ans}.`,
      explainEs: `Multiplica ambas partes por el factor de escala ${k}: ${a} × ${k} = ${ans}.`,
    };
  }
  if (domain === "percent") {
    const pcts = [25, 50, 20, 75];
    const wholes = [40, 60, 80, 120];
    const p = pcts[s % pcts.length];
    const w = wholes[s % wholes.length];
    const ans = (p / 100) * w;
    const choices = Array.from(new Set([ans, p, w - p, ans + 10]));
    return {
      stemEn: `Equivalent Transfer Check: What is ${p}% of ${w}?`,
      stemEs: `Comprobación equivalente: ¿Cuánto es el ${p}% de ${w}?`,
      correct: String(ans),
      choices: choices.map(String),
      explainEn: `${p}% of ${w} is (${p} ÷ 100) × ${w} = ${ans}.`,
      explainEs: `El ${p}% de ${w} es (${p} ÷ 100) × ${w} = ${ans}.`,
    };
  }
  if (domain === "geometry") {
    const base = 6 + 2 * (s % 3);
    const height = 4 + (s % 3);
    const ans = 0.5 * base * height;
    const trapFull = base * height;
    const trapAdd = base + height;
    const choices = Array.from(new Set([ans, trapFull, trapAdd, ans + base]));
    return {
      stemEn: `Equivalent Transfer Check: A triangle has base ${base} cm and perpendicular height ${height} cm. What is its area?`,
      stemEs: `Comprobación equivalente: Un triángulo tiene base de ${base} cm y altura perpendicular de ${height} cm. ¿Cuál es su área?`,
      correct: String(ans),
      choices: choices.map(String),
      explainEn: `Area = ½ × ${base} × ${height} = ${ans} sq cm.`,
      explainEs: `Área = ½ × ${base} × ${height} = ${ans} cm².`,
    };
  }
  if (domain === "numberline") {
    const a = -2 - (s % 3);
    const b = a - 3;
    return {
      stemEn: `Equivalent Transfer Check: Which number is greater, ${a} or ${b}?`,
      stemEs: `Comprobación equivalente: ¿Qué número es mayor, ${a} o ${b}?`,
      correct: String(a),
      choices: [String(a), String(b), "0", String(Math.abs(b))],
      explainEn: `${a} is to the right of ${b} on the number line, so ${a} > ${b}.`,
      explainEs: `${a} está a la derecha de ${b} en la recta numérica, así que ${a} > ${b}.`,
    };
  }
  if (domain === "data") {
    const x = 3 + (s % 4);
    const vals = [x, x + 6, x + 2, x + 8, x + 4];
    const ans = x + 4;
    return {
      stemEn: `Equivalent Transfer Check: Find the median of ${vals.join(", ")}.`,
      stemEs: `Comprobación equivalente: Halla la mediana de ${vals.join(", ")}.`,
      correct: String(ans),
      choices: [String(ans), String(x + 2), String(x + 6), String(x + 8)],
      explainEn: `Ordered from least to greatest: ${[...vals].sort((a, b) => a - b).join(", ")}. The middle value is ${ans}.`,
      explainEs: `Ordenados de menor a mayor: ${[...vals].sort((a, b) => a - b).join(", ")}. El valor central es ${ans}.`,
    };
  }
  // Default: equations/balance
  const add = 4 + (s % 5);
  const xVal = 6 + (s % 6);
  const sum = xVal + add;
  return {
    stemEn: `Equivalent Transfer Check: Solve x + ${add} = ${sum}.`,
    stemEs: `Comprobación equivalente: Resuelve x + ${add} = ${sum}.`,
    correct: String(xVal),
    choices: [String(xVal), String(sum + add), String(add), String(xVal + 2)],
    explainEn: `Subtract ${add} from both sides: x = ${sum} − ${add} = ${xVal}.`,
    explainEs: `Resta ${add} en ambos lados: x = ${sum} − ${add} = ${xVal}.`,
  };
}

// ── Interactive Mini Visual Model inside Math Rescue ────────────────────────

function renderInteractiveMiniModel(host, domain) {
  const wrap = document.createElement("div");
  wrap.className = "fmr-mini-model";
  if (domain === "exponents") {
    let b = 2;
    let e = 3;
    const draw = () => {
      const pow = Math.pow(b, e);
      const lin = b * e;
      const chain = e === 0 ? "1" : Array.from({ length: e }, () => b).join(" × ");
      wrap.innerHTML = `
        <div class="fmr-mm-head">
          <strong>${bi("Interactive Factor Builder", "Constructor interactivo de factores")}</strong>
          <div class="fmr-mm-controls">
            <button type="button" class="fm-btn" data-mm="b-dec">b −</button>
            <span class="fmr-mm-read">${bi(`Base = ${b}`, `Base = ${b}`)}</span>
            <button type="button" class="fm-btn" data-mm="b-inc">b +</button>
            <button type="button" class="fm-btn" data-mm="e-dec">n −</button>
            <span class="fmr-mm-read">${bi(`Exp = ${e}`, `Exp = ${e}`)}</span>
            <button type="button" class="fm-btn" data-mm="e-inc">n +</button>
          </div>
        </div>
        <p class="fmr-mm-eq"><strong>${b}<sup>${e}</sup></strong> = ${esc(chain)} = <strong>${pow}</strong> &nbsp;|&nbsp; <span class="fmr-mm-trap">${bi(`Trap ${b} × ${e} = ${lin}`, `Trampa ${b} × ${e} = ${lin}`)}</span></p>`;
    };
    wrap.addEventListener("click", (ev) => {
      const act = ev.target.closest("[data-mm]")?.getAttribute("data-mm");
      if (!act) return;
      if (act === "b-dec") b = Math.max(2, b - 1);
      if (act === "b-inc") b = Math.min(6, b + 1);
      if (act === "e-dec") e = Math.max(0, e - 1);
      if (act === "e-inc") e = Math.min(5, e + 1);
      draw();
    });
    draw();
  } else if (domain === "ratio") {
    let k = 2;
    const draw = () => {
      wrap.innerHTML = `
        <div class="fmr-mm-head">
          <strong>${bi("Interactive Ratio Scaler", "Escalador interactivo de razones")}</strong>
          <div class="fmr-mm-controls">
            <button type="button" class="fm-btn" data-mm="k-dec">× −</button>
            <span class="fmr-mm-read">${bi(`Scale factor ×${k}`, `Factor ×${k}`)}</span>
            <button type="button" class="fm-btn" data-mm="k-inc">× +</button>
          </div>
        </div>
        <p class="fmr-mm-eq">2 : 3 &nbsp;→&nbsp; (2 × ${k}) : (3 × ${k}) = <strong>${2 * k} : ${3 * k}</strong></p>`;
    };
    wrap.addEventListener("click", (ev) => {
      const act = ev.target.closest("[data-mm]")?.getAttribute("data-mm");
      if (act === "k-dec") k = Math.max(1, k - 1);
      if (act === "k-inc") k = Math.min(8, k + 1);
      draw();
    });
    draw();
  } else {
    let step = 1;
    const draw = () => {
      wrap.innerHTML = `
        <div class="fmr-mm-head">
          <strong>${bi("Interactive Step Visualizer", "Visualizador interactivo de pasos")}</strong>
          <div class="fmr-mm-controls">
            <button type="button" class="fm-btn" data-mm="s-1" aria-pressed="${step === 1}">${bi("1. Model", "1. Modelo")}</button>
            <button type="button" class="fm-btn" data-mm="s-2" aria-pressed="${step === 2}">${bi("2. Operation", "2. Operación")}</button>
            <button type="button" class="fm-btn" data-mm="s-3" aria-pressed="${step === 3}">${bi("3. Verify", "3. Verificar")}</button>
          </div>
        </div>
        <p class="fmr-mm-eq">${
          step === 1
            ? bi("Identify the known parts and the total relationship.", "Identifica las partes conocidas y la relación total.")
            : step === 2
            ? bi("Apply the inverse or multiplicative relationship to both quantities.", "Aplica la relación inversa o multiplicativa a ambas cantidades.")
            : bi("Substitute your answer back into the original problem to verify it fits.", "Sustituye tu respuesta en el problema original para verificar que funciona.")
        }</p>`;
    };
    wrap.addEventListener("click", (ev) => {
      const act = ev.target.closest("[data-mm]")?.getAttribute("data-mm");
      if (act === "s-1") step = 1;
      if (act === "s-2") step = 2;
      if (act === "s-3") step = 3;
      draw();
    });
    draw();
  }
  host.appendChild(wrap);
}

// ── Mount Math Rescue inside a Problem Section ──────────────────────────────

export function mountMathRescue(section, context = {}, callbacks = {}) {
  if (!section) return null;
  let host = section.querySelector("[data-math-rescue]");
  if (!host) {
    host = document.createElement("section");
    host.className = "fmr-card";
    host.setAttribute("data-math-rescue", "true");
    host.setAttribute("aria-label", "Math Rescue Tutor");
    const anchor =
      section.querySelector(".visual-explanation-card, .explanation-box") ||
      section.querySelector(".problem-check-row") ||
      section;
    if (anchor && anchor !== section) anchor.insertAdjacentElement("afterend", host);
    else section.appendChild(host);
  }

  const diag = diagnoseMisconception(context);
  const m = diag.misconception;
  const seed = (Number(context.idx) || 1) + (Number(context.attempts) || 1);
  const transfer = generateEquivalentProblem(m.domain, seed);

  host.innerHTML = `
    <header class="fmr-header">
      <span class="fmr-badge">${bi("🛟 Math Rescue Tutor", "🛟 Tutor de Rescate Matemático")}</span>
      <h4 class="fmr-title">${bi(m.titleEn, m.titleEs)}</h4>
    </header>
    ${
      diag.confidence === "ambiguous"
        ? `<div class="fmr-diag" data-fmr-diag>
            <p class="fmr-diag-q"><strong>${bi("Quick check—how did you start this problem?", "Pregunta rápida: ¿cómo empezaste este problema?")}</strong></p>
            <div class="fmr-diag-opts">
              <button type="button" class="fm-btn" data-fmr-how="concept">${bi("I wasn't sure which operation to use first", "No estaba seguro de qué operación usar primero")}</button>
              <button type="button" class="fm-btn" data-fmr-how="calc">${bi("I set it up, then made a calculation slip", "Lo planteé bien, pero tuve un desliz al calcular")}</button>
            </div>
            <p class="fmr-diag-reply" data-fmr-diag-reply role="status"></p>
          </div>`
        : ""
    }
    <p class="fmr-explain">${bi(
      context.feedbackEn ? `${context.feedbackEn} ${m.explainEn}` : m.explainEn,
      context.feedbackEs ? `${context.feedbackEs} ${m.explainEs}` : m.explainEs
    )}</p>
    <div class="fmr-model-slot" data-fmr-model></div>
    <div class="fmr-reconstruct" data-fmr-reconstruct>
      <p class="fmr-step-label"><strong>${bi("Step 1 — Reconstruct the idea:", "Paso 1 — Reconstruye la idea:")}</strong> ${bi(m.reconstructQEn, m.reconstructQEs)}</p>
      <div class="fmr-opt-row">
        ${m.reconstructOpts
          .map(
            (o) =>
              `<button type="button" class="fm-btn" data-fmr-rec="${esc(o.id)}" data-ok="${o.ok ? "1" : "0"}">${bi(o.en, o.es)}</button>`
          )
          .join("")}
      </div>
      <p class="fmr-feedback" data-fmr-rec-fb role="status"></p>
    </div>
    <div class="fmr-transfer" data-fmr-transfer hidden>
      <p class="fmr-step-label"><strong>${bi("Step 2 — Try a fresh equivalent problem:", "Paso 2 — Prueba un problema equivalente nuevo:")}</strong></p>
      <p class="fmr-transfer-stem">${bi(transfer.stemEn, transfer.stemEs)}</p>
      <div class="fmr-opt-row">
        ${transfer.choices
          .map(
            (c) =>
              `<button type="button" class="fm-btn" data-fmr-tr="${esc(c)}" data-ok="${c === transfer.correct ? "1" : "0"}">${esc(c)}</button>`
          )
          .join("")}
      </div>
      <p class="fmr-feedback" data-fmr-tr-fb role="status"></p>
    </div>`;

  renderInteractiveMiniModel(host.querySelector("[data-fmr-model]"), m.domain);

  host.addEventListener("click", (ev) => {
    const howBtn = ev.target.closest("[data-fmr-how]");
    if (howBtn) {
      const reply = host.querySelector("[data-fmr-diag-reply]");
      const kind = howBtn.getAttribute("data-fmr-how");
      if (reply) {
        reply.innerHTML =
          kind === "concept"
            ? bi("Got it! Let's use the interactive model below to see why the operation works.", "¡Entendido! Usemos el modelo interactivo de abajo para ver por qué funciona la operación.")
            : bi("That happens! Walk through Step 1 below to lock in the setup, then re-check your answer.", "¡Eso pasa! Revisa el Paso 1 abajo para asegurar el planteamiento y vuelve a comprobar.");
      }
      return;
    }

    const recBtn = ev.target.closest("[data-fmr-rec]");
    if (recBtn) {
      const ok = recBtn.getAttribute("data-ok") === "1";
      const fb = host.querySelector("[data-fmr-rec-fb]");
      const trBox = host.querySelector("[data-fmr-transfer]");
      if (fb) {
        fb.innerHTML = ok
          ? bi("✓ Spot on! Now try the equivalent check below—or fix your original answer above.", "✓ ¡Exacto! Ahora prueba el problema equivalente abajo o corrige tu respuesta original arriba.")
          : bi("Not quite—test it in the interactive model above and try the other option.", "Todavía no: pruébalo en el modelo interactivo de arriba e intenta la otra opción.");
      }
      if (ok && trBox) {
        trBox.hidden = false;
        callbacks.onReconstructed?.(m.id);
      }
      return;
    }

    const trBtn = ev.target.closest("[data-fmr-tr]");
    if (trBtn) {
      const ok = trBtn.getAttribute("data-ok") === "1";
      const fb = host.querySelector("[data-fmr-tr-fb]");
      if (fb) {
        fb.innerHTML = ok
          ? bi(`✓ You nailed the transfer problem! ${transfer.explainEn}`, `✓ ¡Resolviste el problema equivalente! ${transfer.explainEs}`)
          : bi(`Look closely: ${transfer.explainEn}`, `Observa bien: ${transfer.explainEs}`);
      }
      if (ok) callbacks.onTransferSolved?.(m.id);
    }
  });

  return { host, misconception: m };
}

// ── Adaptive Practice Engine (Support / Core / Extend, never visibly labeled) ─

export function evaluateAdaptivePathway(evidence = {}) {
  const problems = evidence.problems || {};
  const ids = Object.keys(problems);
  let solved = 0;
  let firstTry = 0;
  let multiMiss = 0;
  let hintHeavy = 0;
  let rescued = Number(evidence.rescuesCompleted || 0);

  for (const id of ids) {
    const p = problems[id];
    if (!p) continue;
    if (p.done) {
      solved++;
      if (!p.wrong && !p.hints && !p.shown) firstTry++;
    }
    if ((p.wrong || 0) >= 2) multiMiss++;
    if ((p.hints || 0) >= 2 || p.shown) hintHeavy++;
  }

  // Internal pathway only — never displayed as low/average/advanced
  let pathway = "core";
  if (solved >= 3 && firstTry / Math.max(1, solved) >= 0.75 && multiMiss === 0) {
    pathway = "extend";
  } else if (multiMiss >= 2 || (hintHeavy >= 2 && firstTry === 0 && rescued === 0)) {
    pathway = "support";
  }

  return {
    pathway,
    solved,
    firstTry,
    multiMiss,
    rescued,
  };
}

/**
 * Mounts the student-agency Adaptive Practice toolbar ("Practice More", "Show Me Another Way",
 * "Challenge Me") without ever using the forbidden class `.hw-pathway-btn` or `#hw_pathway_bar`.
 */
export function mountAdaptiveControls(panel, { lessonId = "", getEvidence, onPracticeMore, onChallengeMe }) {
  if (!panel) return null;
  let bar = panel.querySelector("[data-adaptive-agency]");
  if (!bar) {
    bar = document.createElement("section");
    bar.className = "fma-agency-bar";
    bar.setAttribute("data-adaptive-agency", "true");
    bar.setAttribute("aria-label", "Practice options");
    const levelStrip = panel.querySelector("#hw_levelstrip") || panel.querySelector(".fp-head");
    if (levelStrip && levelStrip.parentNode) {
      levelStrip.parentNode.insertBefore(bar, levelStrip.nextSibling);
    } else {
      panel.insertBefore(bar, panel.firstChild);
    }
  }

  const domain = inferLessonDomain(lessonId);
  let genSeed = 1;

  bar.innerHTML = `
    <div class="fma-agency-row">
      <p class="fma-agency-lead">${bi(
        "Adaptive Practice adjusts to your work. Choose a tool anytime:",
        "La práctica adaptativa se ajusta a tu trabajo. Elige una herramienta cuando quieras:"
      )}</p>
      <div class="fma-agency-btns" role="group" aria-label="Adaptive practice actions">
        <button type="button" class="fm-btn" data-fma-act="another-way">
          <span aria-hidden="true">🔄</span> ${bi("Show Me Another Way", "Muéstrame otra forma")}
        </button>
        <button type="button" class="fm-btn" data-fma-act="practice-more">
          <span aria-hidden="true">➕</span> ${bi("Practice More", "Practicar más")}
        </button>
        <button type="button" class="fm-btn" data-fma-act="challenge-me">
          <span aria-hidden="true">🚀</span> ${bi("Challenge Me", "Dame un reto")}
        </button>
      </div>
    </div>
    <div class="fma-slot" data-fma-slot hidden aria-live="polite"></div>`;

  const slot = bar.querySelector("[data-fma-slot]");

  bar.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-fma-act]");
    if (!btn || !slot) return;
    const act = btn.getAttribute("data-fma-act");
    const state = evaluateAdaptivePathway(getEvidence ? getEvidence() : {});

    if (act === "another-way") {
      slot.hidden = false;
      slot.innerHTML = `
        <div class="fma-card">
          <h4 class="fma-card-title">${bi("Three Ways to See Tonight's Math", "Tres formas de ver la matemática de hoy")}</h4>
          <div class="fma-ways-grid">
            <div class="fma-way">
              <strong>${bi("1. Visual Model", "1. Modelo visual")}</strong>
              <p>${bi("Use the interactive diagram in Try Together to see how the quantities change together.", "Usa el diagrama interactivo en Prueben juntos para ver cómo cambian juntas las cantidades.")}</p>
            </div>
            <div class="fma-way">
              <strong>${bi("2. Table & Pattern", "2. Tabla y patrón")}</strong>
              <p>${bi("Organize known values in a table or factor chain so each step is visible before calculating.", "Organiza los valores conocidos en una tabla o cadena de factores para ver cada paso.")}</p>
            </div>
            <div class="fma-way">
              <strong>${bi("3. Estimation Check", "3. Comprobación por estimación")}</strong>
              <p>${bi("Ask: Should the answer be greater or less than the starting number? Eliminate choices that don't fit.", "Pregunta: ¿La respuesta debe ser mayor o menor que el número inicial? Descarta opciones que no encajen.")}</p>
            </div>
          </div>
        </div>`;
      return;
    }

    if (act === "practice-more") {
      genSeed += 1;
      const item = generateEquivalentProblem(domain, genSeed);
      slot.hidden = false;
      slot.innerHTML = `
        <div class="fma-card" data-fma-generated>
          <h4 class="fma-card-title">${bi("Adaptive Practice Item", "Problema de práctica adaptativa")}</h4>
          <p class="fma-card-stem">${bi(item.stemEn, item.stemEs)}</p>
          ${
            state.pathway === "support"
              ? `<p class="fma-scaffold">${bi("Scaffold tip: Write out each factor or unit step before choosing.", "Pista de apoyo: Escribe cada factor o paso unitario antes de elegir.")}</p>`
              : ""
          }
          <div class="fmr-opt-row">
            ${item.choices
              .map(
                (c) =>
                  `<button type="button" class="fm-btn" data-fma-ans="${esc(c)}" data-ok="${c === item.correct ? "1" : "0"}">${esc(c)}</button>`
              )
              .join("")}
          </div>
          <p class="fmr-feedback" data-fma-fb role="status"></p>
        </div>`;
      onPracticeMore?.();
      return;
    }

    if (act === "challenge-me") {
      genSeed += 2;
      const item = generateEquivalentProblem(domain, genSeed + 5);
      slot.hidden = false;
      slot.innerHTML = `
        <div class="fma-card" data-fma-generated>
          <h4 class="fma-card-title">${bi("Stretch & Reasoning Challenge", "Reto de razonamiento profundo")}</h4>
          <p class="fma-card-stem">${bi(item.stemEn, item.stemEs)}</p>
          <div class="fmr-opt-row">
            ${item.choices
              .map(
                (c) =>
                  `<button type="button" class="fm-btn" data-fma-ans="${esc(c)}" data-ok="${c === item.correct ? "1" : "0"}">${esc(c)}</button>`
              )
              .join("")}
          </div>
          <p class="fmr-feedback" data-fma-fb role="status"></p>
        </div>`;
      onChallengeMe?.();
      return;
    }
  });

  slot.addEventListener("click", (ev) => {
    const ansBtn = ev.target.closest("[data-fma-ans]");
    if (!ansBtn) return;
    const ok = ansBtn.getAttribute("data-ok") === "1";
    const fb = slot.querySelector("[data-fma-fb]");
    if (fb) {
      fb.innerHTML = ok
        ? bi("✓ Correct! Your adaptive practice progress has been updated.", "✓ ¡Correcto! Tu progreso de práctica adaptativa se actualizó.")
        : bi("Not yet—check the relationship between the numbers and try another option.", "Todavía no: revisa la relación entre los números y prueba otra opción.");
    }
  });

  return { bar };
}
