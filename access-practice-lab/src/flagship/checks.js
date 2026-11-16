// Rule checks for the flagship Language Games (/language-games). Pure functions, no DOM, so node tests run them.
// A write step names what a strong answer must DO (required ideas from the evidence, a connector job, an evidence
// phrase, a register, a length), never one fixed sentence. Feedback names the first thing missing as a clue; the view
// steps the help up clue → rule → model, so the answer is never stated on the first two tries.
import { CONNECTORS } from "../lang/lexicon.js";

/** Lower case, straight quotes, digits and letters only, single spaces. */
export const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9'$%:. ]+/g, " ")
    .replace(/(\D)[.:]|[.:](\D|$)/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

export const words = (s) => norm(s).split(" ").filter(Boolean);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Does `text` contain the phrase? Whole words; a trailing "*" matches any ending ("repair*" → repaired, repairs).
 * Phrases are normalized the same way as the text, so "4:15" and "$12" work.
 */
export function hasPhrase(text, phrase) {
  const t = ` ${norm(text)} `;
  const p = String(phrase || "").trim();
  if (!p) return false;
  const stem = p.endsWith("*");
  const body = norm(stem ? p.slice(0, -1) : p);
  if (!body) return false;
  const re = new RegExp(
    `(^|\\s)${escapeRe(body).replace(/ /g, "\\s+")}${stem ? "[a-z']*" : ""}(?=\\s|$)`,
  );
  return re.test(t);
}
export const hasAny = (text, list = []) => list.find((p) => hasPhrase(text, p)) || "";

/** Connector jobs found in the text (cause, contrast, sequence, addition, example, evidence, stance, concession, conclusion). */
export function connectorJobs(text) {
  const jobs = new Set();
  for (const [job, list] of Object.entries(CONNECTORS))
    if (list.some((w) => hasPhrase(text, w))) jobs.add(job);
  // Everyday cause words a younger writer uses.
  if (hasAny(text, ["so", "that's why", "that is why", "which means", "this is why"]))
    jobs.add("cause");
  if (hasAny(text, ["if", "unless", "then"])) jobs.add("condition");
  return [...jobs];
}

/** Words that point at evidence: where the writer looked. */
export const EVIDENCE_WORDS = [
  ...CONNECTORS.evidence,
  "the note",
  "the letter",
  "the message",
  "the map",
  "the schedule",
  "the timetable",
  "the diagram",
  "the chart",
  "the graph",
  "the table",
  "the label",
  "the sign",
  "the clue",
  "the log",
  "the record",
  "the receipt",
  "the photo",
  "the picture",
  "the witness",
  "the interview",
  "the source",
  "the data",
  "the numbers",
  "it says",
  "it shows",
  "shows",
  "show",
  "says",
  "said",
  "states",
  "stated",
  "notice*",
  "i saw",
  "i see",
  "we know",
  "proves",
  "tells us",
  "points to",
];

/** Polite markers (asking, thanking, apologizing, softening). */
export const POLITE = [
  "please",
  "could you",
  "could i",
  "would you",
  "would it be",
  "may i",
  "can you please",
  "excuse me",
  "thank you",
  "thanks",
  "sorry",
  "i'm sorry",
  "i am sorry",
  "i'd like",
  "i would like",
  "i was wondering",
  "is it possible",
  "would it be possible",
  "i appreciate",
  "do you mind",
  "if that's okay",
  "if that is okay",
  "i understand",
  "pardon",
];
/** Markers that make a line rude or too blunt for the listener. */
export const RUDE = [
  "give me",
  "gimme",
  "you have to",
  "you better",
  "shut up",
  "whatever",
  "stupid",
  "dumb",
  "your fault",
  "you ruined",
  "you broke",
  "hurry up",
  "i don't care",
  "i dont care",
  "that's ridiculous",
];
/** Clarifying moves used to repair a misunderstanding. */
export const CLARIFY = [
  "do you mean",
  "did you mean",
  "what do you mean",
  "could you repeat",
  "can you repeat",
  "say that again",
  "i mean",
  "i meant",
  "what i meant",
  "let me explain",
  "let me say it another way",
  "to be clear",
  "just to check",
  "so you're saying",
  "so you are saying",
  "is that right",
  "not exactly",
  "actually",
  "sorry i wasn't clear",
  "sorry, i wasn't clear",
  "i think there's a mix up",
  "i think there is a mix up",
  "mix-up",
  "mix up",
  "misunderstanding",
  "clarify",
];
/** Opinion and feeling words a news lead or headline should leave out. */
export const OPINION = [
  "amazing",
  "awesome",
  "terrible",
  "horrible",
  "best",
  "worst",
  "boring",
  "great",
  "awful",
  "i think",
  "i believe",
  "in my opinion",
  "should",
  "beautiful",
  "ugly",
  "fun",
  "cool",
  "wonderful",
];

/** Share of the answer's content words that come straight from the prompt (0..1). */
export function promptOverlap(text, prompt) {
  const p = new Set(words(prompt));
  const w = words(text).filter((x) => x.length > 2);
  if (!w.length) return 1;
  return w.filter((x) => p.has(x)).length / w.length;
}

/**
 * Check one written answer against a step's rule spec:
 *   { min?, max?, ideas?: [{ any: [...phrases], clue: [en, es] }], connector?: [jobs], evidence?: true,
 *     register?: "polite" | "kind", clarify?: true, avoid?: [{ any, clue }], noOpinion?: true }
 * `prompt` is the step's own question text (an answer copied from it fails).
 * Returns { ok, missing: [{ kind, clue: [en, es] }], found: { ideas, jobs, evidence, polite, count } }.
 */
export function checkWrite(text, spec = {}, prompt = "") {
  const count = words(text).length;
  const missing = [];
  const need = (kind, en, es) => missing.push({ kind, clue: [en, es] });
  if (!count) {
    need("empty", "Write your answer first.", "Primero escribe tu respuesta.");
    return { ok: false, missing, found: { count } };
  }
  if (prompt && count >= 3 && promptOverlap(text, prompt) >= 0.85)
    need(
      "copied",
      "These are the question's words. Answer in your own words with what you found.",
      "Esas son las palabras de la pregunta. Responde con tus propias palabras y lo que encontraste.",
    );
  const min = spec.min ?? 0;
  if (count < min)
    need(
      "short",
      `Say more: a full answer here needs at least ${min} words. Add a detail from the evidence.`,
      `Di más: una respuesta completa aquí necesita al menos ${min} palabras. Agrega un detalle de la evidencia.`,
    );
  if (spec.max && count > spec.max)
    need(
      "long",
      `Make it shorter: ${spec.max} words or fewer.`,
      `Hazlo más corto: ${spec.max} palabras o menos.`,
    );
  const ideas = [];
  for (const idea of spec.ideas || []) {
    const hit = hasAny(text, idea.any);
    if (hit) ideas.push(hit);
    else missing.push({ kind: "idea", clue: idea.clue });
  }
  const jobs = connectorJobs(text);
  if (spec.connector?.length && !spec.connector.some((j) => jobs.includes(j)))
    need(
      "connector",
      {
        cause: "Link your idea to your reason with a word like because, so or since.",
        contrast: "Show the difference with a word like but, however or although.",
        sequence: "Show the order with words like first, then or after that.",
        condition: "Show what depends on what with if … then.",
        concession: "Admit the other side first: It is true that … but …",
      }[spec.connector[0]] || "Join your ideas with a connector.",
      {
        cause: "Une tu idea con tu razón usando because, so o since.",
        contrast: "Muestra la diferencia con but, however o although.",
        sequence: "Muestra el orden con first, then o after that.",
        condition: "Muestra qué depende de qué con if … then.",
        concession: "Reconoce primero el otro lado: It is true that … but …",
      }[spec.connector[0]] || "Une tus ideas con un conector.",
    );
  const evidence = hasAny(text, EVIDENCE_WORDS);
  if (spec.evidence && !evidence)
    need(
      "evidence",
      "Point to where you looked: The note says … / The map shows … / According to …",
      "Señala dónde miraste: The note says … / The map shows … / According to …",
    );
  const polite = hasAny(text, POLITE);
  const rude = hasAny(text, RUDE);
  if ((spec.register === "polite" || spec.register === "kind") && rude)
    need(
      "rude",
      `“${rude}” sounds rude to this listener. Say it so they want to help you.`,
      `«${rude}» suena grosero para esta persona. Dilo de manera que quiera ayudarte.`,
    );
  if (spec.register === "polite" && !polite)
    need(
      "polite",
      "This is an adult you do not know well. Add a polite word or a softer question: please, could you, excuse me.",
      "Es un adulto que no conoces bien. Agrega una palabra cortés o una pregunta más suave: please, could you, excuse me.",
    );
  const clarify = hasAny(text, CLARIFY);
  if (spec.clarify && !clarify)
    need(
      "clarify",
      "Fix the misunderstanding out loud: Do you mean …? / What I meant was … / Just to check …",
      "Arregla el malentendido en voz alta: Do you mean …? / What I meant was … / Just to check …",
    );
  for (const a of spec.avoid || []) {
    // A wrong fact the writer rejects ("34 tomatoes, not 50", "instead of the pond") is a correction, not an error.
    const hit = a.any.find(
      (p) =>
        hasPhrase(text, p) &&
        !["not", "not about", "instead of", "rather than", "never"].some((neg) =>
          hasPhrase(text, `${neg} ${p}`),
        ),
    );
    if (hit) missing.push({ kind: "avoid", clue: a.clue, hit });
  }
  const opinion = hasAny(text, OPINION);
  if (spec.noOpinion && opinion)
    need(
      "opinion",
      `“${opinion}” is an opinion. News states facts; let the reader decide how to feel.`,
      `«${opinion}» es una opinión. Las noticias dan hechos; el lector decide qué sentir.`,
    );
  // Name the most useful thing first: an idea from the evidence before style, and length last.
  const ORDER = ["empty", "copied", "idea", "avoid", "rude", "polite", "clarify", "evidence", "connector", "opinion", "long", "short"];
  missing.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
  return {
    ok: missing.length === 0,
    missing,
    found: { ideas, jobs, evidence, polite, clarify, count },
  };
}

/** Check a single choice. Returns { ok, picked }. */
export const checkChoose = (step, id) => ({
  ok: !!step.options.find((o) => o.id === id)?.ok,
  picked: id,
});

/** Check a sort: answers { [itemId]: { cat, reason? } }. Returns { ok, wrong: [itemId] }. */
export function checkSort(step, answers = {}) {
  const wrong = [];
  for (const it of step.items) {
    const a = answers[it.id] || {};
    if (a.cat !== it.cat || (step.reasons && it.reason && a.reason !== it.reason))
      wrong.push(it.id);
  }
  return { ok: wrong.length === 0, wrong };
}
