// Science Investigation Lab content: twelve stages, one case per grade band, bilingual (English and Spanish).
// Cases are authored in science-lab-ice.js (6-8) and science-lab-soil.js (3-5); this module is the single place
// that fixes the stage list, the stage metadata and the normalized case shape the engine and the views read.
//
// Rules the content keeps (tools/access-science-lab.test.mjs enforces them):
//  * every learner-facing string has English and Spanish; Spanish is machine-assisted and not human-reviewed;
//  * help gives structure and questions, never an answer, a score, or the condition that wins;
//  * datasets are classroom sample data and say so; they are never presented as real measurements.
import { ICE_CASE } from "./science-lab-ice.js";
import { SOIL_CASE } from "./science-lab-soil.js";

export const STAGES = [
  "notice",
  "question",
  "hypothesis",
  "plan",
  "collect",
  "represent",
  "claim",
  "evidence",
  "reasoning",
  "revise",
  "present",
  "reflect",
];

/** The transfer attempt is a thirteenth, help-free piece of work on a new phenomenon; it is not a route stage. */
export const TRANSFER_STAGE = "transfer";

const meta = (en, es, domain, klu, taskEn, taskEs) => ({
  title: { en, es },
  domain,
  klu,
  task: { en: taskEn, es: taskEs },
});

/** Model-free stage metadata: Writing everywhere except `present` (Speaking, typed transcript). */
export const STAGE_META = {
  notice: meta(
    "Notice",
    "Observar",
    "Writing",
    "Narrate",
    "Describe what you notice in the phenomenon before you explain it.",
    "Describe lo que observas en el fenómeno antes de explicarlo.",
  ),
  question: meta(
    "Ask a question",
    "Hacer una pregunta",
    "Writing",
    "Inform",
    "Write one question you could answer by running a test.",
    "Escribe una pregunta que podrías responder haciendo una prueba.",
  ),
  hypothesis: meta(
    "Predict",
    "Predecir",
    "Writing",
    "Explain",
    "Write a prediction with a reason.",
    "Escribe una predicción con una razón.",
  ),
  plan: meta(
    "Plan a fair test",
    "Planear una prueba justa",
    "Writing",
    "Inform",
    "Plan what you will change, what you will keep the same, and what you will measure.",
    "Planea qué vas a cambiar, qué vas a mantener igual y qué vas a medir.",
  ),
  collect: meta(
    "Collect data",
    "Reunir datos",
    "Writing",
    "Narrate",
    "Run the tests and record each result with its conditions.",
    "Haz las pruebas y anota cada resultado con sus condiciones.",
  ),
  represent: meta(
    "Show the data",
    "Mostrar los datos",
    "Writing",
    "Inform",
    "Build a table or graph that makes the differences easy to see.",
    "Construye una tabla o gráfica que haga fáciles de ver las diferencias.",
  ),
  claim: meta(
    "Make a claim",
    "Hacer una afirmación",
    "Writing",
    "Argue",
    "Write a claim that answers the investigation question.",
    "Escribe una afirmación que responda la pregunta de la investigación.",
  ),
  evidence: meta(
    "Choose evidence",
    "Elegir evidencia",
    "Writing",
    "Argue",
    "Select the rows of data that support your claim.",
    "Selecciona las filas de datos que apoyan tu afirmación.",
  ),
  reasoning: meta(
    "Explain your reasoning",
    "Explicar tu razonamiento",
    "Writing",
    "Explain",
    "Connect your evidence to your claim and explain why it counts.",
    "Conecta tu evidencia con tu afirmación y explica por qué cuenta.",
  ),
  revise: meta(
    "Revise",
    "Revisar",
    "Writing",
    "Argue",
    "Use the questions to improve one part of your writing.",
    "Usa las preguntas para mejorar una parte de tu texto.",
  ),
  present: meta(
    "Present",
    "Presentar",
    "Speaking",
    "Explain",
    "Tell your investigation out loud, then type what you said.",
    "Cuenta tu investigación en voz alta y luego escribe lo que dijiste.",
  ),
  reflect: meta(
    "Reflect",
    "Reflexionar",
    "Writing",
    "Narrate",
    "Look back at how your thinking and writing changed.",
    "Mira atrás cómo cambiaron tu pensamiento y tu escritura.",
  ),
};

/** Group `[stage, kind, en, es]` tuples into `{ [stage]: [{ id, kind, text: { en, es } }] }`. */
function groupHelp(tuples) {
  const out = Object.fromEntries(STAGES.map((s) => [s, []]));
  for (const [stage, kind, en, es] of tuples)
    out[stage].push({ id: `${stage}-${out[stage].length + 1}`, kind, text: { en, es } });
  return out;
}

const build = ({ help, ...rest }) => ({ ...rest, help: groupHelp(help) });

export const CASES = { "6-8": [build(ICE_CASE)], "3-5": [build(SOIL_CASE)] };
export const BANDS = Object.keys(CASES);

/** Find a case by band and id (null when unknown). Its `transfer` is a full case shape for the help-free attempt. */
export function findCase(band, caseId) {
  const found = (CASES[band] || []).find((c) => c.id === caseId);
  return found || null;
}
