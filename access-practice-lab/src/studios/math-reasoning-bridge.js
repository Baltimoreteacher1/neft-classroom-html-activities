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

export function checkDataTransfer(bridge, meanResponse, medianResponse) {
  const parse = (value) => {
    const text = String(value ?? "").trim();
    return /^\d+(?:\.\d+)?$/.test(text) ? Number(text) : null;
  };
  const mean = parse(meanResponse);
  const median = parse(medianResponse);
  return mean !== null && median !== null && mean === bridge.transferMean && median === bridge.transferMedian;
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

export function fractionSupportForLevel(level, language = "en", { numerator, denominator, whole, part } = {}) {
  if (level <= 2) return language === "es"
    ? { bank: ["fracción", "todo", "parte", "partes iguales", "de"], frame: `${numerator}/${denominator} significa ${numerator} de ${denominator} partes iguales. El todo es ${whole}; la parte es ${part} porque ___.` }
    : { bank: ["fraction", "whole", "part", "equal parts", "of"], frame: `${numerator}/${denominator} means ${numerator} of ${denominator} equal parts. The whole is ${whole}; the part is ${part} because ___.` };
  if (level === 3) return language === "es"
    ? { bank: ["fracción", "todo", "parte"], frame: `La parte es ${numerator}/${denominator} del todo porque ___.` }
    : { bank: ["fraction", "whole", "part"], frame: `The part is ${numerator}/${denominator} of the whole because ___.` };
  return null;
}
