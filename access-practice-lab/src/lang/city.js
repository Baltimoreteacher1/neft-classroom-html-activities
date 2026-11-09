// Language City logic (pure, no DOM): checking a step, tracking one attempt at a mission, and the progress that records
// independent and supported attempts separately. The wording check for the closing "say it" step is the one from
// Real-Life Scenarios (src/lang/scenarios.js); this module does not duplicate it. No score, level or timer exists here.
import { TAGS, checkLine } from "./scenarios.js";

export const CITY_KEY = "accessPracticeLab:v1:city";
export const SUPPORTS = ["none", "bank", "frame"];
export const SUPPORT_COPY = {
  none: [
    "On my own",
    "Por mi cuenta",
    "No word bank and no frames. You can still open help; it is marked as help.",
    "Sin banco de palabras ni estructuras. Aún puedes abrir ayuda; se marca como ayuda.",
  ],
  bank: [
    "Word bank",
    "Banco de palabras",
    "Useful words and phrases for each step, with Spanish meanings.",
    "Palabras y frases útiles para cada paso, con su significado en español.",
  ],
  frame: [
    "Sentence frames",
    "Estructuras de oración",
    "A sentence with blanks for each step. You fill in the words.",
    "Una oración con espacios en blanco para cada paso. Tú completas las palabras.",
  ],
};
export const ROLE_COPY = {
  read: ["Read", "Leer", "Find the facts in a sign, menu, bill, label or schedule.", "Encuentra los datos en un letrero, menú, cuenta, etiqueta u horario."],
  listen: ["Listen", "Escuchar", "Hear a character and pick out what matters.", "Escucha a un personaje y detecta lo importante."],
  respond: ["Respond", "Responder", "Choose a reply that fits the situation.", "Elige una respuesta que encaje con la situación."],
  ask: ["Ask", "Preguntar", "Build a question word by word.", "Forma una pregunta palabra por palabra."],
  clarify: ["Clarify", "Aclarar", "Check what you heard or understood.", "Verifica lo que oíste o entendiste."],
  repair: ["Repair", "Reparar", "Fix a misunderstanding politely.", "Arregla una confusión con cortesía."],
  say: ["Say it", "Dilo", "Write the line in your own words.", "Escribe la frase con tus propias palabras."],
};

// ── order and checking ──────────────────────────────────────────────────────────
const SALT = "city-6";
function seedOf(text) {
  let seed = 0;
  for (const ch of text) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  return seed;
}
/** The same shuffled order of a step's options every time, so the right answer is not always in one place. */
export function optionOrder(missionId, step) {
  const n = step.opts.length;
  const order = Array.from({ length: n }, (_, i) => i);
  let seed = seedOf(`${SALT}:${missionId}:${step.id}`);
  for (let i = n - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
export const answerPosition = (missionId, step) =>
  optionOrder(missionId, step).findIndex((i) => step.opts[i].id === step.answer);

/** Result of picking option `id`: { ok, why } where why is the option's own explanation. */
export function checkChoice(step, id) {
  const opt = step.opts.find((o) => o.id === id);
  if (!opt) return { ok: false, why: null };
  return { ok: id === step.answer, why: opt.why };
}

const GENERIC = {
  question: {
    en: "A question ends with a question mark. Add it at the end.",
    es: "Una pregunta termina con un signo de interrogación. Agrégalo al final.",
  },
  short: {
    en: "Your sentence is missing a word. Read it aloud and listen for the gap.",
    es: "A tu oración le falta una palabra. Léela en voz alta y escucha el hueco.",
  },
  long: {
    en: "Your sentence has a word it does not need. Read it aloud and listen.",
    es: "Tu oración tiene una palabra que no necesita. Léela en voz alta y escucha.",
  },
  order: {
    en: "All the right kinds of words are here, but the order is off. Read it aloud and try moving one word.",
    es: "Están las palabras necesarias, pero el orden no es correcto. Léela en voz alta y prueba mover una palabra.",
  },
};
const joined = (seq) => seq.join(" ");

/** Result of a tile sentence: { ok, empty, why } - a named slip when the order is a known one, a general note otherwise. */
export function checkBuild(step, seq) {
  if (!seq.length) return { ok: false, empty: true, why: null };
  const text = joined(seq);
  if (step.ok.some((o) => joined(o) === text)) return { ok: true, why: null };
  const slip = step.slips.find((s) => joined(s.order) === text);
  if (slip) return { ok: false, why: slip.why };
  const target = step.ok[0];
  if (step.target === "question" && seq.at(-1) !== "?") return { ok: false, why: GENERIC.question };
  if (seq.length < target.length) return { ok: false, why: GENERIC.short };
  if (seq.length > target.length) return { ok: false, why: GENERIC.long };
  return { ok: false, why: GENERIC.order };
}

/** The closing step: does the learner's own line show the language target? Words only, never accent. */
export function checkSay(step, text) {
  const r = checkLine(step.target, text);
  return { ...r, tag: step.target, label: TAGS[step.target] };
}

// ── one attempt at a mission ──────────────────────────────────────────────────
const OPENED_BY_SUPPORT = { none: {}, bank: { bank: true }, frame: { frames: true } };

/** A fresh attempt. `opened` lists every support used so far; the attempt is independent only while it stays empty. */
export function newAttempt(mission, support = "none") {
  return {
    m: mission.id,
    p: mission.place,
    support,
    opened: { ...OPENED_BY_SUPPORT[support] },
    i: 0,
    res: {},
    tries: {},
    first: {},
    done: false,
  };
}
/** Change the support. Choosing more help opens it for the rest of the attempt; choosing less never undoes what was used. */
export function setSupport(att, support) {
  if (!SUPPORTS.includes(support)) return att;
  att.support = support;
  Object.assign(att.opened, OPENED_BY_SUPPORT[support]);
  return att;
}
/** Opening a help (hint, Spanish, written words) marks the attempt supported. */
export function openHelp(att, key) {
  att.opened[key] = true;
  return att;
}
export const isIndependent = (att) => !Object.values(att.opened).some(Boolean);

/** Record one try at a step. The first try decides whether the step was right on the first go. `keep` holds what a
 * resumed page needs to show a solved step again: the option id or the tile order, never typed text. */
export function recordTry(att, step, ok, keep = {}) {
  att.tries[step.id] = (att.tries[step.id] || 0) + 1;
  if (att.first[step.id] === undefined) att.first[step.id] = Boolean(ok);
  if (ok || step.kind === "say") att.res[step.id] = { ok: Boolean(ok), ...keep };
  return att;
}
/** A step is finished when it is solved; the "say it" step when it has been checked at least once. */
export const stepDone = (att, step) => Boolean(att.res[step.id]);
export const firstTryCount = (att) => Object.values(att.first).filter(Boolean).length;
export const extraTries = (att) =>
  Object.values(att.tries).reduce((n, t) => n + Math.max(0, t - 1), 0);

/** Counts for the ledger entry: ids and numbers only, never what the learner typed. */
export function attemptStats(att, mission) {
  return {
    steps: mission.steps.length,
    firstTry: firstTryCount(att),
    retries: extraTries(att),
    helps: Object.values(att.opened).filter(Boolean).length,
    targets: new Set(
      mission.steps.filter((s) => s.target && att.res[s.id]?.ok).map((s) => s.target),
    ).size,
  };
}

// ── progress on this device ────────────────────────────────────────────────────
/** Add a finished attempt to the progress record: independent and supported runs are counted separately. */
export function finishAttempt(prog, att, mission) {
  const rec = (prog[mission.id] ||= { indep: 0, supp: 0, steps: 0, firstTry: 0 });
  const independent = isIndependent(att);
  if (independent) rec.indep += 1;
  else rec.supp += 1;
  const s = attemptStats(att, mission);
  rec.steps += s.steps;
  rec.firstTry += s.firstTry;
  rec.last = independent ? "independent" : "supported";
  return { rec, independent, stats: s };
}
export const runsOf = (rec) => (rec ? rec.indep + rec.supp : 0);
/** "independent" once a mission was finished with no help; "supported" if only helped runs exist; else "new". */
export function missionStatus(prog, id) {
  const rec = prog[id];
  if (rec?.indep > 0) return "independent";
  if (rec?.supp > 0) return "supported";
  return "new";
}
export function totalsFor(prog, missions) {
  let independent = 0;
  let supported = 0;
  for (const m of missions) {
    const s = missionStatus(prog, m.id);
    if (s === "independent") independent += 1;
    else if (s === "supported") supported += 1;
  }
  return {
    total: missions.length,
    independent,
    supported,
    left: missions.length - independent - supported,
  };
}
/** The next mission to suggest: one not yet finished at all, else one finished only with support. */
export function nextMission(prog, missions) {
  return (
    missions.find((m) => missionStatus(prog, m.id) === "new") ||
    missions.find((m) => missionStatus(prog, m.id) === "supported") ||
    null
  );
}
