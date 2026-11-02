// Family Math Studio (Enterprise 8): "Tonight" plans a family can do in a few minutes with no materials, built from the
// same evidence the learner and teacher see. It tells a family WHAT to do, WHAT TO ASK (questions that never give the
// answer away), and WHAT TO AVOID, in English and Spanish. It never shows a score ranking, never labels a child, and
// states plainly when there is not yet enough evidence. Supported work done together is never counted as independent.
import { planPractice } from "./practice-selector.js";
import { buildGraph } from "./knowledge-graph.js";
import { STATE_LABELS } from "./mastery-evidence.js";
import { DOMAINS } from "./tokens.js";

export const MINUTES = Object.freeze([5, 10, 15]);
const b = (en, es) => ({ en, es });

// Home activities: no materials beyond what a household has, one per domain, with a talk move in each.
export const HOME_ACTIVITIES = Object.freeze({
  number: b(
    "Pick any number on a receipt, a clock or a page. Say it, build it with coins or fingers, then say what each digit is worth.",
    "Elige un número en un recibo, un reloj o una página. Dilo, constrúyelo con monedas o con los dedos y di cuánto vale cada dígito.",
  ),
  operations: b(
    "Make a story together that fits the problem (groups of snacks, people on a bus). Act it out, then write the number sentence.",
    "Inventen juntos una historia que encaje con el problema (grupos de meriendas, personas en un autobús). Represéntenla y luego escriban la oración numérica.",
  ),
  fractions: b(
    "Fold paper or share something into equal parts. Ask which part is bigger and how you can tell without counting pieces.",
    "Doblen papel o repartan algo en partes iguales. Pregunta qué parte es mayor y cómo lo saben sin contar piezas.",
  ),
  ratio: b(
    "Use a recipe or a mix of two things. Double it, halve it, then ask what stays the same.",
    "Usen una receta o una mezcla de dos cosas. Dóblenla, redúzcanla a la mitad y pregunta qué se mantiene igual.",
  ),
  algebra: b(
    "Think of a number puzzle (“I think of a number, add 3, and get 10”). Take turns making puzzles and undoing the steps.",
    "Piensen en un acertijo numérico (“Pienso un número, le sumo 3 y obtengo 10”). Túrnense para inventar acertijos y deshacer los pasos.",
  ),
  geometry: b(
    "Find shapes at home. Describe one without naming it (sides, corners, flat or round) and let the other person guess.",
    "Busquen formas en casa. Describan una sin nombrarla (lados, esquinas, plana o redonda) y la otra persona adivina.",
  ),
  data: b(
    "Ask a quick question at home (favorite fruit?). Tally the answers and say two things the tally tells you.",
    "Hagan una pregunta rápida en casa (¿fruta favorita?). Cuenten las respuestas y digan dos cosas que muestra el conteo.",
  ),
  measurement: b(
    "Measure something with a non-standard unit (a shoe, a hand span), then guess how many of another unit it would take.",
    "Midan algo con una unidad no estándar (un zapato, un palmo) y estimen cuántas de otra unidad harían falta.",
  ),
});

// Questions that move thinking without telling the answer (shared across domains, then one domain-specific question).
export const ASK_ANYTIME = Object.freeze([
  b("What did you notice first?", "¿Qué fue lo primero que notaste?"),
  b(
    "How could you show that with a picture or objects?",
    "¿Cómo podrías mostrarlo con un dibujo u objetos?",
  ),
  b("Is there another way to get there?", "¿Hay otra manera de llegar?"),
  b("How do you know it makes sense?", "¿Cómo sabes que tiene sentido?"),
]);
export const ASK_BY_DOMAIN = Object.freeze({
  number: b(
    "Which digit changes the size the most? Why?",
    "¿Qué dígito cambia más el tamaño? ¿Por qué?",
  ),
  operations: b(
    "What is happening in the story: joining, separating, or groups?",
    "¿Qué pasa en la historia: se junta, se separa o son grupos?",
  ),
  fractions: b(
    "What is the whole here? How many equal parts?",
    "¿Cuál es el entero aquí? ¿Cuántas partes iguales?",
  ),
  ratio: b("What is being compared to what?", "¿Qué se compara con qué?"),
  algebra: b(
    "What happens if you undo the last step?",
    "¿Qué pasa si deshaces el último paso?",
  ),
  geometry: b(
    "Which feature makes this shape different from the others?",
    "¿Qué característica hace diferente a esta forma?",
  ),
  data: b(
    "What does the biggest group tell us? What does it not tell us?",
    "¿Qué nos dice el grupo mayor? ¿Qué no nos dice?",
  ),
  measurement: b(
    "Which unit makes the most sense here, and why?",
    "¿Qué unidad tiene más sentido aquí y por qué?",
  ),
});
export const AVOID = Object.freeze([
  b(
    "Avoid “this is easy” or “you should know this”. It can make a child stop trying.",
    "Evita decir “esto es fácil” o “ya deberías saberlo”. Puede hacer que tu hijo deje de intentar.",
  ),
  b(
    "Avoid giving the answer straight away. Ask a question, then wait.",
    "Evita dar la respuesta enseguida. Haz una pregunta y espera.",
  ),
  b(
    "A different method from the one you learned is fine. Ask them to explain it.",
    "Un método distinto al que aprendiste está bien. Pídele que lo explique.",
  ),
]);

const ROLE_VERB = {
  learn: b("Explore a new idea", "Explorar una idea nueva"),
  practice: b("Practice together", "Practicar juntos"),
  review: b("Remember an earlier idea", "Recordar una idea anterior"),
  transfer: b("Use it in a new place", "Usarlo en un lugar nuevo"),
  demonstrate: b("Let your child show it", "Dejar que tu hijo lo demuestre"),
  challenge: b("A fun stretch", "Un reto divertido"),
};
// The practice planner speaks to the learner ("your path"); a family reads it about their child.
const toFamilyVoice = (reason) =>
  reason && typeof reason === "object"
    ? {
        en: String(reason.en ?? "").replace(/\byour\b/gi, "their").replace(/\byou\b/gi, "your child"),
        es: String(reason.es ?? "").replace(/\btu\b/gi, "su").replace(/\btus\b/gi, "sus").replace(/\bte\b/gi, "le"),
      }
    : { en: "", es: "" };
const perMinutes = (minutes) => (minutes <= 5 ? 1 : minutes <= 10 ? 2 : 3);

// Build tonight's plan. `evidenceCount` is how many skills have any answer at all; with none, the plan is a gentle start.
export function buildTonight({
  tutor,
  e8 = null,
  grade,
  minutes = 10,
  now = Date.now(),
} = {}) {
  const m = MINUTES.includes(minutes) ? minutes : 10;
  const plan = planPractice({
    tutor,
    extras: e8?.skills || {},
    grade,
    now,
    size: 6,
  });
  const { nodes } = buildGraph();
  const picks = plan.items.slice(0, perMinutes(m));
  const assessed = Object.values(plan.evidence).filter(
    (e) => e.state !== "not-yet",
  ).length;
  const activities = picks.map((item) => {
    const domain = DOMAINS.includes(nodes.get(item.key)?.domain)
      ? nodes.get(item.key).domain
      : "number";
    return {
      key: item.key,
      title: item.title,
      role: item.role,
      domain,
      stateLabel: STATE_LABELS[item.state],
      verb: ROLE_VERB[item.role] || ROLE_VERB.practice,
      doThis: HOME_ACTIVITIES[domain],
      ask: [ASK_ANYTIME[0], ASK_BY_DOMAIN[domain]],
      why: toFamilyVoice(item.reason),
      minutes: Math.max(2, Math.round(m / picks.length)),
    };
  });
  return {
    minutes: m,
    grade: Number(grade),
    activities,
    avoid: AVOID,
    evidence: {
      assessed,
      enough: assessed >= 3,
      note:
        assessed >= 3
          ? b(
              "These ideas come from your child's recent work in the Fluency Lab.",
              "Estas ideas vienen del trabajo reciente de tu hijo en el Laboratorio de fluidez.",
            )
          : b(
              "There is not much practice on record yet, so these are gentle starting ideas, not a measure of your child.",
              "Todavía hay poca práctica registrada, así que estas son ideas suaves para empezar, no una medida de tu hijo.",
            ),
    },
    // Work done together at home is supported practice. The plan says so, so nobody mistakes it for a mastery check.
    supportNote: b(
      "Practice done together counts as supported practice. It helps learning, and independent practice is how mastery is shown.",
      "La práctica hecha juntos cuenta como práctica con apoyo. Ayuda a aprender; la práctica independiente es lo que demuestra el dominio.",
    ),
  };
}

// Plain-text copy of the plan for messages and printed fridge sheets.
export function planText(plan, lang = "en") {
  const l = lang === "es" ? "es" : "en";
  const lines = [
    l === "es"
      ? `Matemáticas de hoy (${plan.minutes} minutos)`
      : `Tonight's math (${plan.minutes} minutes)`,
    plan.evidence.note[l],
    "",
  ];
  plan.activities.forEach((a, i) => {
    lines.push(`${i + 1}. ${a.verb[l]}: ${a.title} (${a.minutes} min)`);
    lines.push(`   ${a.doThis[l]}`);
    for (const q of a.ask) lines.push(`   - ${q[l]}`);
  });
  lines.push("", plan.supportNote[l]);
  return lines.join("\n");
}
