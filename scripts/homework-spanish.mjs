/**
 * Vocabulary-aware EN→ES helpers for family guided notes.
 * Uses lesson vocab termEs/definitionEs plus phrase/verb maps — not machine translation.
 */

const VERB_MAP = [
  ["find the", "encontrar el"],
  ["find", "encontrar"],
  ["write and evaluate", "escribir y evaluar"],
  ["write", "escribir"],
  ["use a", "usar una"],
  ["use the", "usar la"],
  ["use", "usar"],
  ["explain how i broke a number down", "explicar cómo descompuse un número"],
  ["explain my description", "explicar mi descripción"],
  ["explain my reasoning", "explicar mi razonamiento"],
  ["explain my histogram", "explicar mi histograma"],
  ["explain my box plot", "explicar mi diagrama de caja"],
  ["explain my choice", "explicar mi elección"],
  ["explain my table", "explicar mi tabla"],
  ["explain my work", "explicar mi trabajo"],
  ["explain", "explicar"],
  ["describe the shape of a data distribution", "describir la forma de una distribución de datos"],
  ["describe", "describir"],
  ["compare and order", "comparar y ordenar"],
  ["compare", "comparar"],
  ["order", "ordenar"],
  ["solve", "resolver"],
  ["evaluate", "evaluar"],
  ["identify", "identificar"],
  ["determine", "determinar"],
  ["apply", "aplicar"],
  ["model", "modelar"],
  ["represent", "representar"],
  ["convert", "convertir"],
  ["graph", "graficar"],
  ["plot", "trazar"],
  ["calculate", "calcular"],
  ["divide", "dividir"],
  ["multiply", "multiplicar"],
];

const PHRASE_MAP = [
  ["write inequalities to represent real-world situations", "escribir desigualdades para representar situaciones de la vida real"],
  ["find the area of a trapezoid using the formula a = ½(b1 + b2) × h", "encontrar el área de un trapecio usando la fórmula A = ½(b1 + b2) × h"],
  ["write a number as a product of its prime factors using a factor tree", "escribir un número como producto de sus factores primos usando un árbol de factores"],
  ["describe the shape of a data distribution as symmetric, skewed, or having clusters and gaps", "describir la forma de una distribución de datos como simétrica, sesgada o con agrupamientos y huecos"],
  ["as a product of its prime factors using a factor tree", "como producto de sus factores primos usando un árbol de factores"],
  ["numbers in exponent form using a base and a power", "números en forma de exponente usando una base y una potencia"],
  ["a ratio table to find equivalent ratios", "una tabla de razones para encontrar razones equivalentes"],
  ["the volume of a rectangular prism with whole-number edges using length × width × height", "el volumen de un prisma rectangular con aristas enteras usando largo × ancho × alto"],
  ["the volume of a rectangular prism, including ones with fractional edge lengths, using base area × height", "el volumen de un prisma rectangular, incluidos los de aristas fraccionarias, usando área de la base × altura"],
  ["the surface area of rectangular and triangular prisms", "el área de superficie de prismas rectangulares y triangulares"],
  ["the surface area of a solid by using its net", "el área de superficie de un sólido usando su red"],
  ["the surface area of a pyramid by adding the base area and the lateral faces", "el área de superficie de una pirámide sumando el área de la base y las caras laterales"],
  ["the mean, median, and mode of a data set", "la media, la mediana y la moda de un conjunto de datos"],
  ["the mean absolute deviation (mad) to describe how spread out data is", "la desviación absoluta media (DAM) para describir qué tan dispersos están los datos"],
  ["the distance between two points on the coordinate plane using absolute value", "la distancia entre dos puntos en el plano coordenado usando valor absoluto"],
  ["as symmetric, skewed, or having clusters and gaps", "como simétrica, sesgada, o con agrupamientos y huecos"],
  ["using the words", "usando las palabras"],
  ["using my", "usando mi"],
  ["and evaluate", "y evaluar"],
  ["prime number", "número primo"],
  ["composite number", "número compuesto"],
  ["prime factorization", "factorización prima"],
  ["factor tree", "árbol de factores"],
  ["ratio table", "tabla de razones"],
  ["equivalent ratio", "razón equivalente"],
  ["equivalent ratios", "razones equivalentes"],
  ["scale factor", "factor de escala"],
  ["rectangular prism", "prisma rectangular"],
  ["triangular prism", "prisma triangular"],
  ["cubic units", "unidades cúbicas"],
  ["surface area", "área de superficie"],
  ["coordinate plane", "plano coordenado"],
  ["ordered pair", "par ordenado"],
  ["absolute value", "valor absoluto"],
  ["box plot", "diagrama de caja"],
  ["interquartile range", "rango intercuartílico"],
  ["mean absolute deviation", "desviación absoluta media"],
  ["statistical question", "pregunta estadística"],
  ["lateral face", "cara lateral"],
  ["slant height", "altura inclinada"],
  ["two-dimensional", "bidimensional"],
  ["base area", "área de la base"],
  ["fractional edge lengths", "aristas fraccionarias"],
  ["whole-number edges", "aristas de números enteros"],
  ["data distribution", "distribución de datos"],
  ["clusters and gaps", "agrupamientos y huecos"],
  ["horizontal distance", "distancia horizontal"],
  ["vertical distance", "distancia vertical"],
  ["negative coordinate", "coordenada negativa"],
  ["rational number", "número racional"],
  ["number line", "recta numérica"],
  ["greater than", "mayor que"],
  ["less than", "menor que"],
  ["positive", "positivo"],
  ["negative", "negativo"],
  ["opposite", "opuesto"],
  ["x-axis", "eje x"],
  ["y-axis", "eje y"],
  ["symmetry", "simetría"],
  ["reflection", "reflexión"],
  ["quadrant", "cuadrante"],
  ["origin", "origen"],
  ["outlier", "valor atípico"],
  ["skewed", "sesgado"],
  ["symmetric", "simétrico"],
  ["cluster", "agrupamiento"],
  ["gap", "hueco"],
  ["frequency", "frecuencia"],
  ["interval", "intervalo"],
  ["distribution", "distribución"],
  ["histogram", "histograma"],
  ["median", "mediana"],
  ["quartile", "cuartil"],
  ["mean", "media"],
  ["mode", "moda"],
  ["spread", "dispersión"],
  ["deviation", "desviación"],
  ["variability", "variabilidad"],
  ["survey", "encuesta"],
  ["data", "datos"],
  ["exponent", "exponente"],
  ["base", "base"],
  ["power", "potencia"],
  ["factor", "factor"],
  ["pattern", "patrón"],
  ["volume", "volumen"],
  ["edge", "arista"],
  ["face", "cara"],
  ["net", "red"],
  ["pyramid", "pirámide"],
  ["dimensions", "dimensiones"],
  ["length", "largo"],
  ["width", "ancho"],
  ["height", "altura"],
  ["area", "área"],
  ["decimal", "decimal"],
  ["fraction", "fracción"],
  ["integer", "entero"],
  ["compare", "comparar"],
  ["order", "ordenar"],
  ["evaluate", "evaluar"],
  ["trapezoid", "trapecio"],
  ["inequalities", "desigualdades"],
  ["real-world situations", "situaciones de la vida real"],
  ["prime factors", "factores primos"],
  ["3d shape", "figura tridimensional"],
  ["you cannot split anymore", "ya no se puede dividir más"],
  ["mirrors around the center", "se reflejan alrededor del centro"],
  ["long tail", "cola larga"],
];

const SENTENCE_MAP = [
  ["To keep a ratio the same, multiply both numbers by the same scale factor.", "Para mantener la misma razón, multiplica ambos números por el mismo factor de escala."],
  ["A power like 2³ is a short way to write repeated multiplication: 2 × 2 × 2.", "Una potencia como 2³ es una forma breve de escribir multiplicación repetida: 2 × 2 × 2."],
  ["To find the volume of a box, multiply all three edges: V = length × width × height.", "Para encontrar el volumen de una caja, multiplica las tres aristas: V = largo × ancho × alto."],
  ["Keep breaking a number apart until every factor is a prime number you cannot split anymore.", "Sigue dividiendo un número hasta que cada factor sea un número primo que ya no se puede dividir más."],
  ["Symmetric data mirrors around the center; skewed data has a long tail, and the skew is named for the direction the tail points.", "Los datos simétricos se reflejan alrededor del centro; los datos sesgados tienen una cola larga, y el sesgo se nombra por la dirección de la cola."],
  ["Area of a trapezoid = ½ × (base 1 + base 2) × height. We add the two bases first, then take half.", "Área de un trapecio = ½ × (base 1 + base 2) × altura. Primero sumamos las dos bases y luego tomamos la mitad."],
  ["'At least' means ≥ and 'at most' means ≤; 'more than' means > and 'less than' means <.", "'Al menos' significa ≥ y 'como máximo' significa ≤; 'más que' significa > y 'menor que' significa <."],
  ["Volume is how much space is inside a 3D shape. For a rectangular prism (a box), volume = length × width × height, measured in cubic units.", "El volumen es cuánto espacio hay dentro de una figura tridimensional. Para un prisma rectangular (una caja), volumen = largo × ancho × alto, medido en unidades cúbicas."],
  ["A ratio table lists equal ratios in rows. To make a new row, you multiply BOTH numbers by the same amount, called the scale factor.", "Una tabla de razones muestra razones iguales en filas. Para hacer una fila nueva, multiplicas AMBOS números por la misma cantidad, llamada factor de escala."],
];

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applySentenceMap(text) {
  let out = String(text || "");
  for (const [en, es] of SENTENCE_MAP) {
    out = out.replace(new RegExp(escapeRegExp(en), "gi"), es);
  }
  return out;
}

function englishWordRatio(text) {
  const words = String(text || "").match(/\b[a-zA-Z]{3,}\b/g) || [];
  if (!words.length) return 0;
  const spanishHints =
    /(?:ción|dad|mente|que|para|como|son|del|las|los|una|uno|un|con|por|más|menos|tres|dos|razón|número|datos|figura|prisma|potencia|tabla|factor|volumen|área|arista|exponente|primo|sesg|simétr|agrup|hueco|multiplic|divid|suma|resta|encuentr|escrib|explic|describ|practic|estudiante|familia|lección|palabra|significa|observa|verif|primero|juntos|repaso|ayuda|trabajo|oración|espacio|interior|mantener|mantien|equivalente|distribuci|desiguald|trapecio|formula|fórmula|altura|ancho|largo|base|breve|repetida|caja|aristas|misma|mismo|ambos|escala|mitad|máximo|al menos|como máximo|hogar|dibujos|ejemplos|potencia|exponente|desigualdades|situaciones|vida|real|producto|factores|árbol|enteras|sesgada|simétrica|agrupamientos)/i;
  const englishy = words.filter((w) => !spanishHints.test(w));
  return englishy.length / words.length;
}

export function polishSpanish(text, config) {
  let out = String(text || "").trim();
  if (!out || englishWordRatio(out) < 0.5) return out.endsWith(".") ? out : `${out}.`;
  const objective = translateFamilyText(config.contentObjective, config.vocabulary || []);
  if (objective && englishWordRatio(objective) < 0.5) return objective;
  const kernel = spanishKernel(config);
  if (kernel && englishWordRatio(kernel) < 0.55) return kernel.endsWith(".") ? kernel : `${kernel}.`;
  const core = objective.replace(/^Puedo\s/i, "").replace(/\.$/, "");
  return `Esta noche practican: ${core}. Usen el vocabulario y dejen que su estudiante explique con dibujos o ejemplos del hogar.`;
}

function applyVocab(text, vocab = []) {
  let out = String(text || "");
  const sorted = [...vocab]
    .filter((v) => v.term && v.termEs)
    .sort((a, b) => b.term.length - a.term.length);
  for (const v of sorted) {
    out = out.replace(
      new RegExp(`\\b${escapeRegExp(v.term)}\\b`, "gi"),
      v.termEs,
    );
  }
  return out;
}

function applyPhraseMap(text) {
  let out = String(text || "");
  const sorted = [...PHRASE_MAP].sort((a, b) => b[0].length - a[0].length);
  for (const [en, es] of sorted) {
    const pattern = en.includes(" ")
      ? new RegExp(escapeRegExp(en), "gi")
      : new RegExp(`\\b${escapeRegExp(en)}\\b`, "gi");
    out = out.replace(pattern, es);
  }
  return out;
}

function applyVerbMap(text) {
  let out = String(text || "").trim();
  for (const [en, es] of VERB_MAP) {
    const re = new RegExp(`^${escapeRegExp(en)}\\b`, "i");
    if (re.test(out)) {
      return es + out.slice(en.length);
    }
  }
  return out;
}

export function plainObjective(text) {
  return String(text || "")
    .replace(/^I can\s+/i, "")
    .replace(/\.$/, "")
    .trim();
}

export function translateFamilyText(text, vocab = []) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  if (/^Puedo\s/i.test(raw)) return raw.endsWith(".") ? raw : `${raw}.`;

  let core = plainObjective(raw);
  if (/^I can\s/i.test(raw)) {
    core = applyPhraseMap(core);
    core = applyVerbMap(core);
    core = applyVocab(core, vocab);
    return `Puedo ${core.charAt(0).toLowerCase()}${core.slice(1)}.`;
  }

  let out = applyPhraseMap(raw);
  out = applyVocab(out, vocab);
  return out.endsWith(".") ? out : `${out}.`;
}

export function translateLanguageObjective(text, vocab = []) {
  const core = plainObjective(text);
  const match = core.match(/^explain (.+) using the words (.+)$/i);
  if (match) {
    const tail = match[1]
      .replace(/^my work$/i, "mi trabajo")
      .replace(/^my table$/i, "mi tabla")
      .replace(/^my reasoning$/i, "mi razonamiento")
      .replace(/^my description$/i, "mi descripción")
      .replace(/^my histogram$/i, "mi histograma")
      .replace(/^my box plot$/i, "mi diagrama de caja")
      .replace(/^my choice$/i, "mi elección")
      .replace(/^how i broke a number down$/i, "cómo descompuse un número");
    const words = match[2]
      .replace(/\band\b/gi, "y")
      .split(/,\s*|\s+y\s+/)
      .map((w) => w.trim())
      .filter(Boolean);
    const esWords = words.map((w) => {
      const hit = vocab.find((v) => v.term?.toLowerCase() === w.toLowerCase());
      return hit?.termEs || applyVocab(w, vocab);
    });
    return `Puedo explicar ${tail} usando las palabras ${esWords.join(", ")}.`;
  }
  return translateFamilyText(text, vocab);
}

export function translateConceptLine(text, vocab = []) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  let out = applySentenceMap(raw);
  out = out
    .replace(/\bI multiply both numbers by\b/gi, "Multiplico ambos números por")
    .replace(/\bI do NOT add\b/gi, "NO sumo")
    .replace(/\bTo make (\d+) batches\b/gi, "Para hacer $1 tandas")
    .replace(/\bmy scale factor is\b/gi, "mi factor de escala es")
    .replace(/\bSo I write\b/gi, "Entonces escribo")
    .replace(/\bThe small (\d+) tells me\b/gi, "El pequeño $1 me dice")
    .replace(/\bI want to find\b/gi, "Quiero encontrar")
    .replace(/\bI want the prime factorization of\b/gi, "Quiero la factorización prima de")
    .replace(/\bI start by splitting it\b/gi, "Empiezo dividiéndolo")
    .replace(/\bis not prime, so I break it\b/gi, "no es primo, así que lo divido")
    .replace(/\bBoth sides look like mirror images\b/gi, "Ambos lados parecen imágenes en espejo")
    .replace(/\bthis shape is symmetric\b/gi, "esta forma es simétrica")
    .replace(/\bNOT 2 \+ 2 \+ 2\b/g, "NO es 2 + 2 + 2")
    .replace(/\bthat's addition\b/gi, "eso es suma");
  out = applyPhraseMap(out);
  out = applyVocab(out, vocab);
  return out.endsWith(".") ? out : `${out}.`;
}

export function spanishKernel(config) {
  const talk = Array.isArray(config.turnAndTalk) ? config.turnAndTalk[0] : null;
  if (talk?.kernelEs) return talk.kernelEs;
  if (talk?.kernel) return translateConceptLine(talk.kernel, config.vocabulary || []);
  return "";
}

export function spanishKeyIdea(config) {
  const vocab = config.vocabulary || [];
  const intro = config.launch?.conceptIntro || config.explore?.conceptIntro;
  if (intro?.keyIdeaEs) return intro.keyIdeaEs;
  if (intro?.keyIdea) return polishSpanish(translateConceptLine(intro.keyIdea, vocab), config);
  const kernel = spanishKernel(config);
  if (kernel) return polishSpanish(kernel, config);
  return translateFamilyText(config.contentObjective, vocab);
}
