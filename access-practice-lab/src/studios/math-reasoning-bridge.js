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
