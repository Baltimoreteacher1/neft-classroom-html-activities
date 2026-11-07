// Prompt-specific feedback for because / but / so evidence sentences (Quill Reading for Evidence, option a:
// authored keyword rubrics run on the device). Content: content/studio/evidence-sentences.json.
//
// One response is judged against its prompt's ordered checks; the first check that fails gives the next move.
// A response that passes every check is "strong". Feedback never states the answer, and nothing here is a
// score. Grammar notes reuse the errors.js detectors and only appear on a strong response, so the learner
// fixes the idea first.
import { detect } from "./errors.js";

export const EVIDENCE_KEY = "accessPracticeLab:v1:evidence-sentences";
export const MIN_WORDS = 4;
export const COPY_RUN = 8;

const norm = (t) =>
  String(t || "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^\p{L}\p{N}%' ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Does normalized `text` contain `term` as whole words? */
export function hasTerm(text, term) {
  const t = ` ${norm(text)} `;
  return t.includes(` ${norm(term)} `);
}

/** The learner's words after the stem (a learner may retype the stem; it is not their evidence). */
export function ownPart(stem, response) {
  const r = norm(response);
  const s = norm(stem);
  return r.startsWith(s) ? r.slice(s.length).trim() : r;
}

/** A run of COPY_RUN or more words copied from the sources. */
function copiedRun(text, sources) {
  const words = norm(text).split(" ");
  const src = ` ${norm(sources)} `;
  for (let i = 0; i + COPY_RUN <= words.length; i += 1)
    if (src.includes(` ${words.slice(i, i + COPY_RUN).join(" ")} `))
      return words.slice(i, i + COPY_RUN).join(" ");
  return "";
}

/**
 * @returns {{ status: "empty"|"short"|"copied"|"revise"|"strong", feedback: {en:string, es:string}, check?: number, grammar?: object[] }}
 */
export function judge(prompt, response, { sources = "" } = {}) {
  const own = ownPart(prompt.stem, response);
  const words = own ? own.split(" ").length : 0;
  if (!words)
    return {
      status: "empty",
      feedback: {
        en: "Finish the sentence after the last word of the starter.",
        es: "Termina la oración después de la última palabra del inicio.",
      },
    };
  if (words < MIN_WORDS)
    return {
      status: "short",
      feedback: {
        en: "Say more. Add a full idea from the text, with who or what and what happened.",
        es: "Di más. Agrega una idea completa del texto, con quién o qué y qué pasó.",
      },
    };
  if (sources && copiedRun(own, sources))
    return {
      status: "copied",
      feedback: {
        en: "Part of this is copied word for word. Keep the idea and say it in your own words.",
        es: "Parte de esto está copiado palabra por palabra. Mantén la idea y dila con tus propias palabras.",
      },
    };
  const index = prompt.checks.findIndex(
    (c) => !c.all.every((group) => group.some((term) => hasTerm(own, term))),
  );
  if (index >= 0)
    return {
      status: "revise",
      check: index,
      feedback: { en: prompt.checks[index].en, es: prompt.checks[index].es },
    };
  const typed = String(response || "").trim();
  const full = norm(typed).startsWith(norm(prompt.stem)) ? typed : `${prompt.stem} ${typed}`;
  const grammar = detect(full)
    .filter((h) => h.confidence === "high")
    .map((h) => ({ id: h.id, name: h.name, text: h.text }));
  return {
    status: "strong",
    grammar,
    feedback: {
      en: "Strong evidence sentence: it uses the text and finishes the idea.",
      es: "Oración de evidencia sólida: usa el texto y completa la idea.",
    },
  };
}

/** Saved rounds, read defensively: { [taskId]: { [promptId]: { rounds: [{text, status}], done } } }. */
export function normalizeRounds(raw, maxRounds = 15) {
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [task, prompts] of Object.entries(raw)) {
    if (!prompts || typeof prompts !== "object") continue;
    for (const [id, v] of Object.entries(prompts)) {
      const rounds = (Array.isArray(v?.rounds) ? v.rounds : [])
        .filter((r) => r && typeof r.text === "string" && typeof r.status === "string")
        .map((r) => ({ text: r.text.slice(0, 600), status: r.status }))
        .slice(0, maxRounds);
      (out[task] ||= {})[id] = { rounds, done: rounds.some((r) => r.status === "strong") };
    }
  }
  return out;
}

/** Adds a round unless the text is unchanged from the last one or the rounds are used up. */
export function addRound(entry, text, status, maxRounds = 15) {
  const rounds = entry?.rounds || [];
  if (rounds.length >= maxRounds || rounds.at(-1)?.text === text)
    return entry || { rounds, done: false };
  const next = [...rounds, { text: text.slice(0, 600), status }];
  return { rounds: next, done: next.some((r) => r.status === "strong") };
}
