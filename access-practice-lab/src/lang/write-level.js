// Leveled writing assignments. A teacher picks one of six support levels for a Writing Studio task and gets a link (or a
// printable sheet) whose supports, length and scope fit that level. Pure data and pure functions: no DOM, no storage.
//
// Everything a level shows is cut from what the task already authors (its guided frames, its two word banks, its organizer,
// its Spanish vocabulary, its success criteria and revision prompts). Nothing here writes new task content, so a level can
// never say something the task does not.
//
// A level is an instructional support grouping the TEACHER chooses. It is not an official WIDA proficiency level, it is not
// inferred from a learner's writing, and it never appears in a score. The level names follow the WIDA ELD Framework's six
// level names (book/lang/profiles.js); the support recipes are original to this application.
import { LEVELS } from "../book/lang/profiles.js";

export const WRITE_LEVELS = Object.freeze([1, 2, 3, 4, 5, 6]);
export const LEVEL_NOTE = Object.freeze([
  "A support level is the teacher's choice of how much help this task offers. It is not an official WIDA proficiency level or score.",
  "Un nivel de apoyo es la decisión del docente sobre cuánta ayuda ofrece esta tarea. No es un nivel oficial de dominio de WIDA ni una puntuación.",
]);

/** Starting help setting for each level, in the Writing Studio's own three stages. */
export const LEVEL_STAGE = Object.freeze({ 1: "guided", 2: "guided", 3: "supported", 4: "supported", 5: "independent", 6: "independent" });

// How much of the task's usual length each level aims for. Entering and Emerging write fewer, complete sentences.
const MIN_SHARE = Object.freeze({ 1: 0.3, 2: 0.45, 3: 0.65, 4: 0.85, 5: 1, 6: 1 });
const MAX_SHARE = Object.freeze({ 1: 0.45, 2: 0.65, 3: 0.85, 4: 1, 5: 1, 6: 1.15 });
const SENTENCES = Object.freeze({ 1: 2, 2: 3, 3: 4 });
const CRITERIA = Object.freeze({ 1: 2, 2: 3 });
const REVISION = Object.freeze({ 1: 0, 2: 0, 3: 2, 4: 3 });

const CONNECTORS = new Set([
  "because", "for example", "for instance", "as a result", "this shows that", "therefore", "however", "in contrast",
  "compared to", "first", "next", "then", "finally", "also", "on the other hand", "so", "although", "while", "since",
  "but", "after", "before", "suddenly", "in conclusion", "one reason", "another reason",
]);

const round5 = (n) => Math.max(5, Math.round(n / 5) * 5);
const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean);

/** A level number from a link's search string, or 0 when there is none or it is not 1 to 6. Free text is never shown. */
export function parseLevel(search) {
  const raw = new URLSearchParams(search).get("level") || "";
  const n = /^[1-6]$/.test(raw) ? Number(raw) : 0;
  return n;
}

export const levelName = (n) => {
  const l = LEVELS[n - 1];
  return l ? { en: l.en, es: l.es } : null;
};

/** The first words of a frame, up to its first blank: the part a writer is given when the rest is theirs to write. */
export function starterOf(frame) {
  const f = String(frame || "").trim();
  const head = f.split("___")[0].trim();
  if (words(head).length >= 2) return `${head} …`;
  // A frame that opens with a blank or one word ("First, ___ went to ___."): give its first four words, cut before a trailing blank.
  return `${words(f).slice(0, 4).join(" ").replace(/\s*___[^\s]*$/, "")} …`;
}

/** The Spanish word for a bank entry, when the task's own vocabulary list defines it. Never invented. */
export function glossOf(task, term) {
  const hit = (task.vocab || []).find((v) => String(v.term || "").toLowerCase() === String(term || "").toLowerCase());
  const es = hit?.es ? String(hit.es).split(":")[0].trim() : "";
  return es || "";
}

function bankFor(task, n) {
  const g = task.stages?.guided?.bank || [];
  const s = task.stages?.supported?.bank || [];
  if (n === 1) return { words: g, open: true, glosses: true, label: ["Words to use", "Palabras para usar"] };
  if (n === 2) return { words: [...new Set([...g, ...s])].slice(0, 12), open: true, glosses: true, label: ["Word bank", "Banco de palabras"] };
  if (n === 3) return { words: s, open: false, glosses: false, label: ["Word bank (open it when you need it)", "Banco de palabras (ábrelo cuando lo necesites)"] };
  if (n === 4) {
    const linking = s.filter((w) => CONNECTORS.has(String(w).toLowerCase()));
    const multi = s.filter((w) => /\s/.test(w));
    const pick = linking.length >= 3 ? linking : multi.length >= 3 ? multi : [];
    return { words: pick, open: false, glosses: false, label: ["Linking words (open when you need them)", "Palabras para enlazar (ábrelas cuando las necesites)"] };
  }
  return { words: [], open: false, glosses: false, label: ["", ""] };
}

/**
 * What one level changes for one task. `n` is 1 to 6; any other value gives null (the task is then unchanged).
 * The shape is plain data so the page, the printed sheet and the tests all read the same answer.
 */
export function levelPlan(task, n) {
  if (!Number.isInteger(n) || n < 1 || n > 6 || !task?.stages?.guided) return null;
  const e = task.expected || { minWords: 50, maxWords: 100, paragraphs: 1 };
  const frames = task.stages.guided.frames || [];
  const org = task.organizer || [];
  const min = Math.min(round5(e.minWords * MIN_SHARE[n]), e.minWords);
  const max = Math.max(round5(e.maxWords * MAX_SHARE[n]), min + 5);
  const take = SENTENCES[n] ? Math.min(SENTENCES[n], frames.length) : frames.length;
  const support = n <= 2 ? "frames" : n === 3 ? "starters" : n === 4 ? "outline" : "none";
  const criteria = (task.successCriteria || []).slice(0, CRITERIA[n] || undefined);
  const revision = n >= 5 ? task.revisionPrompts || [] : (task.revisionPrompts || []).slice(0, REVISION[n] || 0);
  return {
    level: n,
    name: levelName(n),
    stage: LEVEL_STAGE[n],
    expected: { minWords: min, maxWords: max, paragraphs: n <= 2 ? 1 : e.paragraphs || 1 },
    sentences: SENTENCES[n] ? take : null,
    support,
    frames: n <= 2 ? frames.slice(0, take) : [],
    starters: n === 3 ? frames.map(starterOf) : [],
    outline: n === 4 ? org.map((o) => ({ label: o.label, hint: o.hint })) : [],
    bank: bankFor(task, n),
    homeLanguage: n <= 3 ? "open" : n === 4 ? "on-request" : "off",
    sayFirst: n <= 4 ? (n <= 3 ? "each sentence" : "your claim") : "",
    model: n <= 2 ? "available" : "none",
    criteria,
    revision,
    // What the level changes, in the order a teacher would say it out loud (English, Spanish).
    changes: [
      [
        n <= 2 ? `Write ${take} sentences (about ${min}–${max} words).` : `Write about ${min}–${max} words${(e.paragraphs || 1) > 1 && n >= 4 ? ` in ${e.paragraphs} paragraphs` : ""}.`,
        n <= 2 ? `Escribe ${take} oraciones (unas ${min}–${max} palabras).` : `Escribe unas ${min}–${max} palabras${(e.paragraphs || 1) > 1 && n >= 4 ? ` en ${e.paragraphs} párrafos` : ""}.`,
      ],
      support === "frames"
        ? ["Complete sentence frames, with a model to read.", "Marcos de oraciones para completar, con un modelo para leer."]
        : support === "starters"
          ? ["Sentence starters only; the writer finishes each sentence.", "Solo el inicio de cada oración; el escritor la termina."]
          : support === "outline"
            ? ["A plan outline (the parts of the task), no starters.", "Un esquema del plan (las partes de la tarea), sin inicios de oración."]
            : ["No frames or word bank. Sources, notes and the success checklist.", "Sin marcos ni banco de palabras. Fuentes, notas y la lista de metas."],
      n <= 3
        ? ["Spanish directions and word meanings are open, and the writer says each sentence aloud first.", "Las instrucciones y los significados en español están abiertos, y el escritor dice cada oración en voz alta primero."]
        : n === 4
          ? ["Spanish directions open on request; the writer says the claim aloud first.", "Las instrucciones en español se abren si se piden; el escritor dice la afirmación en voz alta primero."]
          : ["Help tools stay available on request.", "Las herramientas de ayuda siguen disponibles si se piden."],
      revision.length
        ? [`Revise with ${revision.length === (task.revisionPrompts || []).length ? "all" : revision.length} conference question${revision.length === 1 ? "" : "s"}.`, `Revisa con ${revision.length === (task.revisionPrompts || []).length ? "todas las" : revision.length} pregunta${revision.length === 1 ? "" : "s"} de conferencia.`]
        : ["Focus on getting the ideas down; revision comes after this first draft.", "Concéntrate en escribir las ideas; la revisión viene después de este primer borrador."],
    ],
  };
}

/** The student link a teacher copies. Carries only a level (1 to 6) and, optionally, a focus from the fixed list. */
export function leveledLink(origin, base, band, taskId, n, focus = "") {
  const q = new URLSearchParams({ grades: band });
  if (Number.isInteger(n) && n >= 1 && n <= 6) q.set("level", String(n));
  if (focus) q.set("focus", focus);
  return `${origin}${base}/write/${taskId}?${q.toString()}`;
}

/** Number of ruled lines a printed sheet gives the writer, from the level's length target. */
export const linesFor = (plan) => Math.min(18, Math.max(5, Math.ceil(plan.expected.maxWords / 11)));
