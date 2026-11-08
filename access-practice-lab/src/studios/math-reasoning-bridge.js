export function ratioTransferBase({ first, second }) {
  return [first + 1, second + 2];
}

export function ratioTransferTarget(bridge) {
  const [first, second] = ratioTransferBase(bridge);
  return [first * 4, second * 4];
}

export function parseRatioPair(text) {
  const match = String(text ?? "").trim().match(/^(\d{1,3})\s*[:/,]\s*(\d{1,3})$/);
  return match ? [Number(match[1]), Number(match[2])] : null;
}

export function checkRatioTransfer(bridge, response) {
  const pair = parseRatioPair(response);
  const expected = ratioTransferTarget(bridge);
  return Boolean(pair && pair[0] === expected[0] && pair[1] === expected[1]);
}

/** Surface evidence from the response; this is language feedback, never a math or proficiency score. */
export function analyzeRatioExplanation(text) {
  const value = String(text ?? "").toLocaleLowerCase();
  const evidence = {
    namesBoth: /\b(both|each|two quantities|both parts|ambos|ambas|cada|las dos cantidades)\b/u.test(value),
    usesRatioWord: /\b(ratio|relationship|quantities|terms|razón|relación|cantidades|términos)\b/u.test(value),
    connectsReason: /\b(because|so|since|therefore|porque|por eso|ya que|entonces)\b/u.test(value),
  };
  const feedback = evidence.namesBoth && evidence.connectsReason
    ? {
        en: "You name both quantities and connect your ideas with a reason. In your revision, make clear what the same factor did.",
        es: "Nombras las dos cantidades y conectas tus ideas con una razón. En la revisión, precisa qué hizo el mismo factor.",
      }
    : !evidence.namesBoth
      ? {
          en: "Name both quantities or parts so the comparison is clear. Then connect your ideas with because or so.",
          es: "Nombra las dos cantidades o partes para que la comparación quede clara. Luego conecta tus ideas con porque o por eso.",
        }
      : {
          en: "Add a reason word such as because or so to explain how each quantity changed.",
          es: "Agrega una palabra de razón, como porque o por eso, para explicar cómo cambió cada cantidad.",
        };
  return { evidence, feedback };
}

export function supportForLevel(level, language = "en") {
  if (level <= 2) {
    return language === "es"
      ? { bank: ["razón", "ambas", "multiplicar", "mismo factor", "equivalente"], frame: "Ambas cantidades se multiplicaron por ___. La razón sigue siendo equivalente porque ___." }
      : { bank: ["ratio", "both", "multiply", "same factor", "equivalent"], frame: "Both quantities were multiplied by ___. The ratio stays equivalent because ___." };
  }
  if (level === 3) {
    return language === "es"
      ? { bank: ["razón", "factor", "equivalente"], frame: "La razón se mantiene equivalente porque ___." }
      : { bank: ["ratio", "factor", "equivalent"], frame: "The ratio stays equivalent because ___." };
  }
  return null;
}

export function checkPercentTransfer(bridge, response) {
  const text = String(response ?? "").trim();
  if (!/^\d+(?:\.0+)?$/.test(text)) return false;
  return Number(text) === bridge.transferWhole;
}

export function checkFractionTransfer(bridge, response) {
  const text = String(response ?? "").trim();
  if (!/^\d+(?:\.0+)?$/.test(text)) return false;
  return Number(text) === bridge.transferWhole;
}

export function checkFractionLineTransfer(bridge, response) {
  const match = String(response ?? "").trim().match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!match) return false;
  const [numerator, denominator] = match.slice(1).map(Number);
  return denominator > 0 && numerator * bridge.transferDenominator === bridge.transferNumerator * denominator;
}

export function checkDataTransfer(bridge, meanResponse, medianResponse) {
  const parse = (value) => {
    const text = String(value ?? "").trim();
    return /^\d+(?:\.\d+)?$/.test(text) ? Number(text) : null;
  };
  const mean = parse(meanResponse);
  const median = parse(medianResponse);
  return mean !== null && median !== null && mean === bridge.transferMean && median === bridge.transferMedian;
}

export function checkSurfaceAreaTransfer(bridge, response) {
  const text = String(response ?? "").trim().replaceAll(",", "");
  return /^\d+(?:\.0+)?$/u.test(text) && Number(text) === bridge.transferSurfaceArea;
}

function parseVolumeResponse(text) {
  const value = String(text ?? "").trim();
  let match = value.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/u);
  if (match) {
    const [, whole, numerator, denominator] = match.map(Number);
    return denominator > 0 && numerator < denominator
      ? { numerator: whole * denominator + numerator, denominator }
      : null;
  }
  match = value.match(/^(\d+)\s*\/\s*(\d+)$/u);
  if (match) {
    const [, numerator, denominator] = match.map(Number);
    return denominator > 0 ? { numerator, denominator } : null;
  }
  match = value.match(/^(\d+)(?:\.(\d{1,3}))?$/u);
  if (!match) return null;
  const places = match[2]?.length || 0;
  const denominator = 10 ** places;
  const numerator = Number(match[1]) * denominator + Number(match[2] || 0);
  return Number.isSafeInteger(numerator) ? { numerator, denominator } : null;
}

/** Compare exact rational cubic-foot values; accept decimals, fractions, or mixed numbers. */
export function checkFractionalVolumeTransfer(bridge, response) {
  const parsed = parseVolumeResponse(response);
  return Boolean(
    parsed &&
      Number.isSafeInteger(bridge?.transferVolumeEighths) &&
      parsed.numerator * 8 === bridge.transferVolumeEighths * parsed.denominator,
  );
}

/** Observable language features for describing fractional volume; never a math or proficiency score. */
export function analyzeFractionalVolumeExplanation(text) {
  const value = String(text ?? "").toLocaleLowerCase();
  const evidence = {
    namesDimensions: /\b(length|width|height|largo|ancho|alto|altura)\b/u.test(value),
    connectsMultiplication: /\b(multiply|multiplied|times|producto|multiplica|multiplicamos|por)\b|×/u.test(value),
    namesCubicUnits: /\b(cubic feet|cubic foot|pies cúbicos|pie cúbico)\b|ft(?:³|\s*\^?3)/u.test(value),
    explainsFractionalUnit: /\b(1\s*\/\s*8|one eighth|eighth|octavo|octava)\b/u.test(value),
    connectsReason: /\b(because|so|since|therefore|porque|por eso|ya que|entonces)\b/u.test(value),
  };
  const missing = [];
  if (!evidence.namesDimensions) missing.push({ en: "name the length, width, and height", es: "nombra el largo, ancho y alto" });
  if (!evidence.connectsMultiplication) missing.push({ en: "explain how the three dimensions are multiplied", es: "explica cómo se multiplican las tres dimensiones" });
  if (!evidence.explainsFractionalUnit) missing.push({ en: "connect each half-foot cube to one eighth cubic foot", es: "relaciona cada cubo de medio pie con un octavo de pie cúbico" });
  if (!evidence.namesCubicUnits) missing.push({ en: "name cubic feet", es: "nombra los pies cúbicos" });
  if (!evidence.connectsReason) missing.push({ en: "connect the ideas with a reason", es: "conecta las ideas con una razón" });
  return {
    evidence,
    feedback: missing.length
      ? { en: `For clarity, ${missing.map((item) => item.en).join(", then ")}.`, es: `Para mayor claridad, ${missing.map((item) => item.es).join(", luego ")}.` }
      : { en: "You connect the three dimensions, the fractional cube unit, and cubic feet with a reason.", es: "Conectas las tres dimensiones, la unidad fraccionaria del cubo y los pies cúbicos con una razón." },
  };
}

export function fractionalVolumeSupportForLevel(level, language = "en") {
  if (level <= 2) return language === "es"
    ? { bank: ["largo", "ancho", "alto", "capa", "cubo de medio pie", "1/8 pie³", "porque"], frame: "Multipliqué el largo, el ancho y el alto. Cada cubo de medio pie es 1/8 de pie cúbico porque ___." }
    : { bank: ["length", "width", "height", "layer", "half-foot cube", "1/8 ft³", "because"], frame: "I multiplied the length, width, and height. Each half-foot cube is 1/8 ft³ because ___." };
  if (level === 3) return language === "es"
    ? { bank: ["dimensiones", "cubo", "volumen", "pies cúbicos"], frame: "El volumen se mide en pies cúbicos porque ___." }
    : { bank: ["dimensions", "cube", "volume", "cubic feet"], frame: "The volume is measured in cubic feet because ___." };
  return null;
}

/** Language evidence for naming faces, paired areas, and square units; not a math score. */
export function analyzeSurfaceAreaExplanation(text) {
  const value = String(text ?? "").toLocaleLowerCase();
  const evidence = {
    namesFaces: /\b(face|faces|side|sides|cara|caras|lado|lados)\b/u.test(value),
    explainsPairs: /\b(pair|pairs|twice|two of each|both|par|pares|dos de cada|ambos|doble)\b/u.test(value),
    namesArea: /\b(area|surface area|área|superficie)\b/u.test(value),
    namesUnits: /\b(square|squared|cm²|in²|cuadradas|cuadrados|\bcm2\b|\bin2\b)\b/u.test(value),
    connectsReason: /\b(because|so|since|therefore|porque|por eso|ya que|entonces)\b/u.test(value),
  };
  const missing = [];
  if (!evidence.namesFaces) missing.push({ en: "name the prism faces", es: "nombra las caras del prisma" });
  if (!evidence.explainsPairs) missing.push({ en: "explain why matching faces are counted in pairs", es: "explica por qué se cuentan en pares las caras iguales" });
  if (!evidence.namesUnits) missing.push({ en: "include square units", es: "incluye unidades cuadradas" });
  if (!evidence.connectsReason) missing.push({ en: "connect the ideas with a reason", es: "conecta las ideas con una razón" });
  return {
    evidence,
    feedback: missing.length
      ? { en: `For clarity, ${missing.map((item) => item.en).join(", then ")}.`, es: `Para mayor claridad, ${missing.map((item) => item.es).join(", luego ")}.` }
      : { en: "You name the faces, explain the matching pairs, include square units, and connect the reasoning.", es: "Nombras las caras, explicas los pares iguales, incluyes unidades cuadradas y conectas el razonamiento." },
  };
}

export function surfaceAreaSupportForLevel(level, language = "en", { length, width, height, unit } = {}) {
  if (level <= 2) return language === "es"
    ? { bank: ["cara", "par", "área", "unidades cuadradas", "porque"], frame: `Las caras miden ${length}×${width}, ${length}×${height} y ${width}×${height} ${unit}². Cuento cada área dos veces porque ___ .` }
    : { bank: ["face", "pair", "area", "square units", "because"], frame: `The face areas are ${length}×${width}, ${length}×${height}, and ${width}×${height} ${unit}². I count each area twice because ___.` };
  if (level === 3) return language === "es"
    ? { bank: ["caras", "pares", "área", "unidades cuadradas"], frame: "El área de superficie suma los tres pares de caras porque ___ ." }
    : { bank: ["faces", "pairs", "area", "square units"], frame: "Surface area adds the three pairs of faces because ___." };
  return null;
}

export function pyramidSurfaceAreaSupportForLevel(level, language = "en", { side, triangleHeight, unit } = {}) {
  if (level <= 2) return language === "es"
    ? { bank: ["base cuadrada", "triángulo", "cuatro caras", "unidades cuadradas", "porque"], frame: `La base mide ${side}×${side} y cada triángulo mide ${side}×${triangleHeight}÷2 ${unit}². Sumo la base y los cuatro triángulos porque ___ .` }
    : { bank: ["square base", "triangle", "four faces", "square units", "because"], frame: `The base is ${side}×${side}, and each triangle is ${side}×${triangleHeight}÷2 ${unit}². I add the base and four triangles because ___.` };
  if (level === 3) return language === "es"
    ? { bank: ["base", "triángulos", "área", "unidades cuadradas"], frame: "El área de superficie suma una base y cuatro triángulos porque ___ ." }
    : { bank: ["base", "triangles", "area", "square units"], frame: "Surface area adds one base and four triangles because ___." };
  return null;
}

/** Language evidence for describing changes in a data set; it is not a math or proficiency score. */
export function analyzeDataExplanation(text) {
  const value = String(text ?? "").toLocaleLowerCase();
  const evidence = {
    namesBothMeasures: /\b(mean|average|media|promedio)\b/u.test(value) && /\b(median|mediana)\b/u.test(value),
    namesObservation: /\b(point|value|observation|dato|punto|valor|observación)\b/u.test(value),
    connectsReason: /\b(because|so|since|therefore|porque|por eso|ya que|entonces)\b/u.test(value),
  };
  const missing = [];
  if (!evidence.namesBothMeasures) missing.push({ en: "name both the mean and median", es: "nombra la media y la mediana" });
  if (!evidence.namesObservation) missing.push({ en: "describe the data point that changed", es: "describe el dato que cambió" });
  if (!evidence.connectsReason) missing.push({ en: "connect the change to a reason", es: "conecta el cambio con una razón" });
  return {
    evidence,
    feedback: missing.length
      ? { en: `For clarity, ${missing.map((item) => item.en).join(", then ")}.`, es: `Para mayor claridad, ${missing.map((item) => item.es).join(", luego ")}.` }
      : { en: "You name both measures, identify the changed data point, and connect the change to a reason.", es: "Nombras ambas medidas, identificas el dato que cambió y conectas el cambio con una razón." },
  };
}

export function dataSupportForLevel(level, language = "en") {
  if (level <= 2) return language === "es"
    ? { bank: ["media", "mediana", "dato", "valor", "porque"], frame: "La media cambió ___ y la mediana cambió ___. El dato ___ afectó más a ___ porque ___." }
    : { bank: ["mean", "median", "data point", "value", "because"], frame: "The mean changed ___ and the median changed ___. The data point ___ affected ___ more because ___." };
  if (level === 3) return language === "es"
    ? { bank: ["media", "mediana", "dato", "porque"], frame: "El dato cambió más la ___ porque ___." }
    : { bank: ["mean", "median", "data point", "because"], frame: "The data point changed the ___ more because ___." };
  return null;
}

/** Observable language features for this response; never a mathematics or proficiency score. */
export function analyzePercentExplanation(text) {
  const value = String(text ?? "").toLocaleLowerCase();
  const evidence = {
    namesPercent: /(?:\bpercent\b|\bper cent\b|\bpor ciento\b|%)/u.test(value),
    namesWhole: /\b(whole|total|entero|todo|totalidad)\b/u.test(value),
    namesPart: /\b(part|amount|parte|cantidad)\b/u.test(value),
    connectsReason: /\b(because|so|since|therefore|porque|por eso|ya que|entonces)\b/u.test(value),
  };
  const missing = [];
  if (!evidence.namesWhole) missing.push({ en: "name the whole", es: "nombra el todo" });
  if (!evidence.namesPart) missing.push({ en: "identify the part", es: "identifica la parte" });
  if (!evidence.namesPercent) missing.push({ en: "use percent language", es: "usa lenguaje de porcentaje" });
  if (!evidence.connectsReason) missing.push({ en: "connect the ideas with a reason", es: "conecta las ideas con una razón" });
  const feedback = missing.length
    ? {
        en: `For clarity, ${missing.map((item) => item.en).join(", then ")}.`,
        es: `Para mayor claridad, ${missing.map((item) => item.es).join(", luego ")}.`,
      }
    : {
        en: "Your response names the whole and part, uses percent language, and connects the ideas clearly.",
        es: "Tu respuesta nombra el todo y la parte, usa lenguaje de porcentaje y conecta las ideas con claridad.",
      };
  return { evidence, feedback };
}

export function percentSupportForLevel(level, language = "en", { percent, whole, part } = {}) {
  if (level <= 2) {
    return language === "es"
      ? {
          bank: ["por ciento", "todo", "parte", "partes iguales", "de"],
          frame: `${percent}% significa ${percent} de 100 partes iguales. El todo es ${whole}; la parte es ${part} porque ___ .`,
        }
      : {
          bank: ["percent", "whole", "part", "equal parts", "of"],
          frame: `${percent}% means ${percent} of 100 equal parts. The whole is ${whole}; the part is ${part} because ___.`,
        };
  }
  if (level === 3) {
    return language === "es"
      ? { bank: ["porcentaje", "todo", "parte"], frame: `El ${percent}% de ${whole} es ${part} porque ___.` }
      : { bank: ["percent", "whole", "part"], frame: `${percent}% of ${whole} is ${part} because ___.` };
  }
  return null;
}

/** Surface language evidence for a fraction explanation without scoring mathematical correctness. */
export function analyzeFractionExplanation(text) {
  const value = String(text ?? "").toLocaleLowerCase();
  const evidence = {
    namesFraction: /\b(fraction|fractional|fracción|fracciones|numerator|denominator|numerador|denominador)\b|\d+\s*\/\s*\d+/u.test(value),
    namesWhole: /\b(whole|total|entire|todo|entero|totalidad)\b/u.test(value),
    namesPart: /\b(part|piece|portion|parte|pedazo|porción)\b/u.test(value),
    connectsReason: /\b(because|so|since|therefore|porque|por eso|ya que|entonces)\b/u.test(value),
  };
  const missing = [];
  if (!evidence.namesFraction) missing.push({ en: "name the fraction", es: "nombra la fracción" });
  if (!evidence.namesWhole) missing.push({ en: "identify the whole", es: "identifica el todo" });
  if (!evidence.namesPart) missing.push({ en: "describe the part", es: "describe la parte" });
  if (!evidence.connectsReason) missing.push({ en: "connect the ideas with a reason", es: "conecta las ideas con una razón" });
  const feedback = missing.length
    ? {
        en: `For clarity, ${missing.map((item) => item.en).join(", then ")}.`,
        es: `Para mayor claridad, ${missing.map((item) => item.es).join(", luego ")}.`,
      }
    : {
        en: "Your response names the fraction, whole, and part and connects them clearly.",
        es: "Tu respuesta nombra la fracción, el todo y la parte, y los conecta con claridad.",
      };
  return { evidence, feedback };
}

/** Observe language used to explain a point on a fraction line; this is not a math score. */
export function analyzeFractionLineExplanation(text) {
  const value = String(text ?? "").toLocaleLowerCase();
  const evidence = {
    namesWhole: /\b(whole|unit|entero|todo)\b/u.test(value),
    namesEqualIntervals: /\b(denominator|equal (?:parts|spaces|intervals)|intervals|denominador|partes iguales|espacios iguales|intervalos iguales)\b/u.test(value),
    countsFromZero: /\b(from zero|from 0|starting at zero|desde cero|desde 0|empezando en cero)\b/u.test(value),
    connectsReason: /\b(because|so|since|therefore|porque|por eso|ya que|entonces)\b/u.test(value),
  };
  const missing = [];
  if (!evidence.namesWhole) missing.push({ en: "name the whole interval", es: "nombra el intervalo entero" });
  if (!evidence.namesEqualIntervals) missing.push({ en: "name the equal intervals", es: "nombra los intervalos iguales" });
  if (!evidence.countsFromZero) missing.push({ en: "say where you start counting", es: "di desde dónde empiezas a contar" });
  if (!evidence.connectsReason) missing.push({ en: "connect the ideas with a reason", es: "conecta las ideas con una razón" });
  return {
    evidence,
    feedback: missing.length
      ? { en: `For clarity, ${missing.map((item) => item.en).join(", then ")}.`, es: `Para mayor claridad, ${missing.map((item) => item.es).join(", luego ")}.` }
      : { en: "You explain how the equal intervals and counting from zero locate the fraction.", es: "Explicas cómo los intervalos iguales y el conteo desde cero ubican la fracción." },
  };
}

export function fractionSupportForLevel(level, language = "en", { numerator, denominator, whole, part } = {}) {
  if (level <= 2) return language === "es"
    ? { bank: ["fracción", "todo", "parte", "partes iguales", "de"], frame: `${numerator}/${denominator} significa ${numerator} de ${denominator} partes iguales. El todo es ${whole}; la parte es ${part} porque ___.` }
    : { bank: ["fraction", "whole", "part", "equal parts", "of"], frame: `${numerator}/${denominator} means ${numerator} of ${denominator} equal parts. The whole is ${whole}; the part is ${part} because ___.` };
  if (level === 3) return language === "es"
    ? { bank: ["fracción", "todo", "parte"], frame: `La parte es ${numerator}/${denominator} del todo porque ___.` }
    : { bank: ["fraction", "whole", "part"], frame: `The part is ${numerator}/${denominator} of the whole because ___.` };
  return null;
}

export function fractionLineSupportForLevel(level, language = "en", { numerator, denominator } = {}) {
  if (level <= 2) return language === "es"
    ? { bank: ["fracción", "entero", "denominador", "intervalos iguales", "desde cero"], frame: `El denominador ${denominator} indica ___ intervalos iguales en el entero. Desde cero cuento ___ intervalos, así que el punto representa ${numerator}/${denominator} porque ___.` }
    : { bank: ["fraction", "whole", "denominator", "equal intervals", "from zero"], frame: `The denominator ${denominator} names ___ equal intervals in one whole. From zero, I count ___ intervals, so the point is ${numerator}/${denominator} because ___.` };
  if (level === 3) return language === "es"
    ? { bank: ["denominador", "intervalos", "desde cero"], frame: `El punto representa ${numerator}/${denominator} porque ___.` }
    : { bank: ["denominator", "intervals", "from zero"], frame: `The point represents ${numerator}/${denominator} because ___.` };
  return null;
}
