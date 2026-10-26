const COPY = {
  en: {
    evidenceNone: "No saved checks yet; this skill has not been measured on this device.",
    evidenceSupported: "Practice is saved, but there are no independent checks yet. Supported work is kept separate.",
    evidence: "Recent independent checks: {correct} correct out of {total}. Supported practice is recorded separately.",
    ask: {
      quantity: "How can you show which group has more without counting everything again?",
      add: "Can you break one number into parts or make a ten? Show how the parts still make the same total.",
      multiply: "Can you draw equal groups or an array? What does each row or group represent?",
      divide: "How could you share these equally? How can you check that every group is fair?",
      fraction: "Where is one whole in the model? How do the parts show which fraction is greater or equivalent?",
      decimal: "What value does each digit represent? Can you show both numbers on a place-value model before calculating?",
      ratio: "What stays in the same relationship when both quantities change?",
      equation: "What operation could you do to both sides and keep the equation balanced?",
      slope: "Which change is the rise and which is the run? How does that show the rate of change?",
      geometry: "Which measurements in the diagram matter for the quantity we need to find?",
      general: "Can you show the quantities with a model or equation? What relationship do you notice?",
    },
    look: "a model, labeled quantities, or an equation that matches the selected skill.",
    lookNoEvidence: "Start with a model or example together. Notice how the learner represents the quantities; no mastery conclusion is available yet.",
    stuckMiss: "If an answer was missed, ask the learner to point to the part that feels uncertain. Rebuild that part with the visual model, then try a different example.",
    stuckSupported: "Recent work included support. Keep the model available, then invite the learner to solve a fresh example without the first hint.",
    stuckIndependent: "If the learner is ready, fade one support and ask them to check the same idea with a new example.",
    stuckGeneral: "If they get stuck, return to the visual model and solve one small part together before trying a new problem.",
    acknowledgeNone: "Thank the learner for explaining or showing one part of their thinking.",
    acknowledgeSupported: "Acknowledge the model or hint they used, then invite them to show one step independently when ready.",
    acknowledgeCorrect: "Name the strategy the learner used on a recent independent check and ask how they could verify it.",
    acknowledge: "Notice the learner’s effort to make the mathematical idea visible.",
  },
  es: {
    evidenceNone: "Todavía no hay comprobaciones guardadas; esta destreza aún no se ha medido en este dispositivo.",
    evidenceSupported: "Hay práctica guardada, pero todavía no hay comprobaciones independientes. La práctica con apoyo se registra por separado.",
    evidence: "Comprobaciones independientes recientes: {correct} correctas de {total}. La práctica con apoyo se registra por separado.",
    ask: {
      quantity: "¿Cómo puedes mostrar cuál grupo tiene más sin volver a contar todo?",
      add: "¿Puedes separar un número en partes o formar diez? Muestra cómo las partes conservan el mismo total.",
      multiply: "¿Puedes dibujar grupos iguales o un arreglo? ¿Qué representa cada fila o grupo?",
      divide: "¿Cómo podrías repartir esto en partes iguales? ¿Cómo compruebas que cada grupo sea justo?",
      fraction: "¿Dónde está el entero en el modelo? ¿Cómo muestran las partes qué fracción es mayor o equivalente?",
      decimal: "¿Qué valor representa cada cifra? ¿Puedes mostrar los números en un modelo de valor posicional antes de calcular?",
      ratio: "¿Qué relación se mantiene cuando cambian las dos cantidades?",
      equation: "¿Qué operación puedes hacer en ambos lados para mantener el equilibrio de la ecuación?",
      slope: "¿Cuál cambio es la elevación y cuál es el recorrido? ¿Cómo muestra eso la tasa de cambio?",
      geometry: "¿Qué medidas del diagrama necesitamos para encontrar la cantidad?",
      general: "¿Puedes mostrar las cantidades con un modelo o una ecuación? ¿Qué relación observas?",
    },
    look: "Escucha si usa un modelo, cantidades etiquetadas o una ecuación que corresponda a la destreza.",
    lookNoEvidence: "Comiencen con un modelo o ejemplo. Observa cómo representa las cantidades; todavía no hay evidencia para juzgar dominio.",
    stuckMiss: "Si hubo una respuesta incorrecta, pregunta qué parte le causa duda. Reconstruyan esa parte con el modelo visual y luego prueben otro ejemplo.",
    stuckSupported: "La práctica reciente incluyó apoyo. Mantén el modelo disponible e invita al estudiante a resolver otro ejemplo nuevo sin la primera pista.",
    stuckIndependent: "Si está listo, retira un apoyo y pídele que compruebe la misma idea con un ejemplo nuevo.",
    stuckGeneral: "Si se atasca, vuelvan al modelo visual y resuelvan juntos una parte pequeña antes de probar otro problema.",
    acknowledgeNone: "Agradece que explique o muestre una parte de su razonamiento.",
    acknowledgeSupported: "Reconoce el modelo o la pista que usó e invítale a mostrar un paso a solas cuando esté listo.",
    acknowledgeCorrect: "Nombra la estrategia que usó en una comprobación independiente reciente y pregunta cómo podría verificarla.",
    acknowledge: "Reconoce su esfuerzo por hacer visible la idea matemática.",
  },
};

function askKey(skill) {
  const generator = skill?.generator;
  if (["countSet", "subitize", "compare", "makeTarget"].includes(generator)) return "quantity";
  if (["fact", "missingAddend"].includes(generator)) {
    const operation = skill?.config?.op;
    return operation === "mul" ? "multiply" : operation === "div" ? "divide" : "add";
  }
  if (["fractionOp", "fractionOf", "fractionEquivalent", "fractionCompare"].includes(generator)) return "fraction";
  if (["decimalOp", "decimalPlace"].includes(generator)) return "decimal";
  if (["ratio", "unitRate", "rateConversion", "proportion"].includes(generator)) return "ratio";
  if (["solve", "equation", "expression"].includes(generator)) return "equation";
  if (generator === "slope" || generator === "functionRule") return "slope";
  if (generator === "geometry") return "geometry";
  return "general";
}

/** Build family-facing coaching only from the selected skill and its saved tutor evidence. */
export function familyCoaching(skill, status = {}, language = "en") {
  const copy = COPY[language === "es" ? "es" : "en"];
  const recent = Array.isArray(status.recent) ? status.recent : [];
  const independent = recent.filter((entry) => entry?.independent && entry.level >= 1);
  const correct = independent.filter((entry) => entry.correct).length;
  const supported = recent.some((entry) => entry?.independent === false);
  const missed = recent.some((entry) => entry?.correct === false);
  let evidence;
  if (!recent.length) evidence = copy.evidenceNone;
  else if (!independent.length) evidence = copy.evidenceSupported;
  else evidence = copy.evidence.replace("{correct}", String(correct)).replace("{total}", String(independent.length));

  return {
    evidence,
    ask: copy.ask[askKey(skill)],
    lookFor: recent.length ? copy.look : copy.lookNoEvidence,
    ifStuck: missed ? copy.stuckMiss : supported ? copy.stuckSupported : independent.length ? copy.stuckIndependent : copy.stuckGeneral,
    acknowledge: !recent.length ? copy.acknowledgeNone : supported ? copy.acknowledgeSupported : correct ? copy.acknowledgeCorrect : copy.acknowledge,
  };
}
