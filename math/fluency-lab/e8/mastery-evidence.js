// Mastery evidence model (Enterprise 8). Eight separate indicators, one explainable state per skill:
//   Not Yet Assessed -> Developing -> Practicing -> Demonstrated -> Review Due
// These are platform learning indicators with documented thresholds (below), not an externally validated achievement
// classification. Speed is reported but never moves a skill between states, and supported (hinted, coached or repaired)
// answers never count as independent evidence.
const DAY = 86400000;
const LEVEL_WEIGHT = [0.6, 1, 1.25];

export const THRESHOLDS = Object.freeze({
  developing: { attempts: 1 },
  practicing: { independent: 3, accuracy: 0.6 },
  demonstrated: {
    independent: 6,
    accuracy: 0.85,
    lastCorrect: 3,
    days: 2,
    gradeLevelSuccesses: 1,
    extraEvidence: "transfer or conceptual",
  },
  reviewAfterDays: { default: 7 },
});

export const STATES = Object.freeze([
  "not-yet",
  "developing",
  "practicing",
  "demonstrated",
  "review-due",
]);
export const STATE_LABELS = Object.freeze({
  "not-yet": { en: "Not yet assessed", es: "Aún sin evaluar" },
  developing: { en: "Developing", es: "En desarrollo" },
  practicing: { en: "Practicing", es: "Practicando" },
  demonstrated: { en: "Demonstrated", es: "Demostrado" },
  "review-due": { en: "Review due", es: "Toca repasar" },
});

const day = (t) => new Date(t).toISOString().slice(0, 10);

// A repeated identical problem is one piece of evidence, not several: keep the latest entry per signature.
function distinct(entries) {
  const last = new Map();
  entries.forEach((e, i) => e.sig && last.set(e.sig, i));
  return entries.filter((e, i) => !e.sig || last.get(e.sig) === i);
}

const weightedAccuracy = (list) => {
  let earned = 0;
  let possible = 0;
  list.forEach((e, i) => {
    const recency = 0.5 ** ((list.length - 1 - i) / 8);
    const w = recency * (LEVEL_WEIGHT[e.level] ?? 1);
    possible += w;
    if (e.correct) earned += w;
  });
  return possible ? earned / possible : null;
};

function criteria(independent, extras) {
  const t = THRESHOLDS.demonstrated;
  const acc = weightedAccuracy(independent);
  const lastN = independent.slice(-t.lastCorrect);
  const days = new Set(
    independent.filter((e) => e.correct && e.level >= 1).map((e) => day(e.at)),
  ).size;
  const gradeLevel = independent.filter(
    (e) => e.correct && e.level >= 1,
  ).length;
  const extra =
    (extras.transfer || 0) +
    (extras.explained || 0) +
    (extras.predictedCorrect || 0) +
    independent.filter((e) => e.correct && e.level === 2).length;
  return {
    enough: independent.length >= t.independent,
    accurate: acc !== null && acc >= t.accuracy,
    steady: lastN.length >= t.lastCorrect && lastN.every((e) => e.correct),
    days: days >= t.days,
    gradeLevel: gradeLevel >= t.gradeLevelSuccesses,
    extra: extra >= 1,
    met:
      independent.length >= t.independent &&
      acc !== null &&
      acc >= t.accuracy &&
      lastN.length >= t.lastCorrect &&
      lastN.every((e) => e.correct) &&
      days >= t.days &&
      gradeLevel >= t.gradeLevelSuccesses &&
      extra >= 1,
  };
}

export function evidenceFor(record = {}, extras = {}, now = Date.now()) {
  const entries = distinct(Array.isArray(record.recent) ? record.recent : []);
  const independent = entries.filter((e) => e.independent);
  const supported = entries.filter((e) => !e.independent);
  const indCorrect = independent.filter((e) => e.correct);
  const accuracy = weightedAccuracy(independent);
  const flips = independent
    .slice(-6)
    .slice(1)
    .filter((e, i) => e.correct !== independent.slice(-6)[i].correct).length;
  const last6 = independent.slice(-6);
  const correctDays = [
    ...new Set(indCorrect.filter((e) => e.level >= 1).map((e) => day(e.at))),
  ].sort();
  const gap =
    correctDays.length >= 2
      ? (Date.parse(correctDays.at(-1)) - Date.parse(correctDays[0])) / DAY
      : 0;
  const paced = indCorrect
    .filter((e) => e.paceEligible && Number.isFinite(e.responseMs))
    .map((e) => e.responseMs)
    .sort((a, b) => a - b);

  const indicators = {
    independentAccuracy:
      accuracy === null ? null : { value: accuracy, n: independent.length },
    scaffoldedAccuracy: supported.length
      ? {
          value: supported.filter((e) => e.correct).length / supported.length,
          n: supported.length,
        }
      : null,
    conceptual:
      (extras.predictedCorrect || 0) +
        (extras.explained || 0) +
        (extras.built || 0) >
      0
        ? {
            value: Math.min(
              1,
              ((extras.predictedCorrect || 0) +
                (extras.explained || 0) +
                (extras.built || 0)) /
                3,
            ),
          }
        : null,
    retention: correctDays.length
      ? {
          value:
            correctDays.length >= 3 || gap >= 3
              ? 1
              : correctDays.length === 2
                ? 0.7
                : 0.35,
          days: correctDays.length,
          gapDays: gap,
        }
      : null,
    transfer:
      (extras.transfer || 0) + indCorrect.filter((e) => e.level === 2).length >
      0
        ? {
            value: Math.min(
              1,
              ((extras.transfer || 0) +
                indCorrect.filter((e) => e.level === 2).length) /
                2,
            ),
          }
        : null,
    consistency:
      last6.length >= 3 ? { value: 1 - flips / (last6.length - 1) } : null,
    reasoning:
      (extras.explained || 0) + (extras.reasoning || 0) > 0
        ? {
            value: Math.min(
              1,
              ((extras.explained || 0) + (extras.reasoning || 0)) / 2,
            ),
          }
        : null,
    // Reported for the learner and teacher; deliberately not used by `state`.
    fluency:
      paced.length >= 3
        ? { medianMs: paced[paced.length >> 1], n: paced.length }
        : null,
  };

  const now_ = criteria(independent, extras);
  // Was the skill ever demonstrated earlier in the record? (scan prefixes of the independent evidence)
  let ever = now_.met;
  for (
    let i = THRESHOLDS.demonstrated.independent;
    !ever && i < independent.length;
    i += 1
  )
    ever = criteria(independent.slice(0, i), extras).met;
  const due = Number.isFinite(record.dueAt) ? record.dueAt : null;
  const overdue = due !== null && now > due;
  const recentMiss = independent.length > 0 && !independent.at(-1).correct;

  let state;
  if (!entries.length) state = "not-yet";
  else if (now_.met) state = overdue ? "review-due" : "demonstrated";
  else if (ever && (recentMiss || overdue)) state = "review-due";
  else if (
    independent.length >= THRESHOLDS.practicing.independent &&
    accuracy >= THRESHOLDS.practicing.accuracy
  )
    state = "practicing";
  else state = "developing";

  return {
    state,
    indicators,
    criteria: now_,
    independent: independent.length,
    supported: supported.length,
    dueAt: due,
    overdue,
    everDemonstrated: ever,
    next: nextStep(state, now_, independent, indicators),
  };
}

// What would move this skill forward, in plain words, from the facts above (never a made-up number).
function nextStep(state, c, independent, ind) {
  const t = THRESHOLDS.demonstrated;
  const en = [];
  const es = [];
  if (state === "not-yet")
    return {
      en: "Try a few problems on your own to get started.",
      es: "Prueba unos problemas tú solo para empezar.",
    };
  if (state === "review-due")
    return {
      en: "You have shown this before. A short review will keep it fresh.",
      es: "Ya lo has demostrado antes. Un repaso corto lo mantendrá fresco.",
    };
  if (state === "demonstrated")
    return {
      en: "You have shown this on your own. Look for a challenge or a new skill.",
      es: "Lo has demostrado tú solo. Busca un desafío o una destreza nueva.",
    };
  const need = Math.max(0, t.independent - independent.length);
  if (!c.enough) {
    en.push(`${need} more problem${need === 1 ? "" : "s"} on your own`);
    es.push(`${need} problema${need === 1 ? "" : "s"} más tú solo`);
  }
  if (c.enough && !c.accurate) {
    en.push("more correct answers on your own");
    es.push("más respuestas correctas tú solo");
  }
  if (!c.steady && independent.length >= 3) {
    en.push(`${t.lastCorrect} right in a row`);
    es.push(`${t.lastCorrect} correctas seguidas`);
  }
  if (!c.days) {
    en.push("a correct answer on another day");
    es.push("una respuesta correcta otro día");
  }
  if (!c.extra) {
    en.push("one challenge, or a Show Me Why lesson");
    es.push("un desafío o una lección de Muéstrame por qué");
  }
  return {
    en: en.length
      ? `To show this skill: ${en.join(", ")}.`
      : "Keep practicing on your own.",
    es: es.length
      ? `Para demostrar esta destreza: ${es.join(", ")}.`
      : "Sigue practicando tú solo.",
  };
}

// Plain-language reason for a state, used on skill cards and in the family report.
export const describeState = (state) =>
  ({
    "not-yet": {
      en: "You have not tried this on your own yet.",
      es: "Todavía no lo has intentado tú solo.",
    },
    developing: {
      en: "You are getting started. Support is fine here.",
      es: "Estás empezando. Aquí el apoyo está bien.",
    },
    practicing: {
      en: "You are getting it on your own more often.",
      es: "Cada vez lo logras más tú solo.",
    },
    demonstrated: {
      en: "You showed this on your own across more than one day.",
      es: "Lo demostraste tú solo en más de un día.",
    },
    "review-due": {
      en: "It has been a while, or a recent miss says it is time to review.",
      es: "Ha pasado un tiempo, o un error reciente indica que toca repasar.",
    },
  })[state];
