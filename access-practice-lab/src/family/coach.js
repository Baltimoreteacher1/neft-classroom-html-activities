// Content-aware Family Co-Pilot coaching. Pure functions: no DOM, no storage.
//
// content/family-coach.json holds three variants for every coaching slot per skill, with {placeholders}.
// This module fills them from the activity the child is actually on (its learning goal, sentence frame,
// listen-for word, vocabulary) and picks variants by a stable hash of the activity id, so two activities
// show different coaching and a reload shows the same words. A line whose placeholder the activity cannot
// supply is dropped, never filled with a guess. Nothing here reads a child's answers or errors.

const BLANK = /^\s*$/;

/** Stable 32-bit hash so variant choice is deterministic per activity and slot. */
export function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** The facts about one activity that coaching may quote. Every field is null when the activity has none. */
export function coachFacts(activity, es = {}) {
  const frames = (activity.frames || []).filter((f) => !BLANK.test(f));
  const word = (activity.vocabulary || []).find((v) => Array.isArray(v) && v[0]);
  const wordEs = word && typeof word[2] === "string" ? word[2].split(":")[0].trim() : "";
  return {
    skillEn: activity.skill || "",
    skillEs: es.skill || "",
    title: activity.title || "",
    frame: frames.find((f) => f.includes("___")) || frames[0] || "",
    listenFor: (activity.listenFor || []).find((x) => typeof x === "string" && x.trim()) || "",
    word: word ? String(word[0]) : "",
    wordEs,
  };
}

/** Which `needs` tokens an activity can satisfy. */
export const available = (facts) => ({
  frame: Boolean(facts.frame),
  listenFor: Boolean(facts.listenFor),
  word: Boolean(facts.word && facts.wordEs),
  skill: Boolean(facts.skillEn),
});

/** A learning goal is a capitalized phrase; inside a sentence it reads naturally in lower case (acronyms stay). */
const inSentence = (phrase) => (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(phrase) ? phrase[0].toLowerCase() + phrase.slice(1) : phrase);

function fill(text, facts, lang) {
  const skillRaw = lang === "es" ? facts.skillEs || (facts.skillEn ? `“${facts.skillEn}”` : "") : facts.skillEn;
  const skill = inSentence(skillRaw);
  const values = { skill, title: facts.title, frame: facts.frame, listenFor: facts.listenFor, word: facts.word, wordEs: facts.wordEs };
  return text.replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match));
}

/** Placeholders a line uses, so a line can never claim a fact the activity lacks. */
export const placeholdersOf = (line) => new Set([...`${line.en} ${line.es}`.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));

/** Choose the variant for a slot, skipping lines the activity cannot support. Returns null when none can. */
export function pickLine(lines, seed, facts) {
  const ok = available(facts);
  const usable = (lines || []).filter((line) => {
    const needs = new Set(line.needs || []);
    for (const p of placeholdersOf(line)) {
      if (p === "skill") needs.add("skill");
      else if (p === "frame" || p === "listenFor") needs.add(p);
      else if (p === "word" || p === "wordEs") needs.add("word");
    }
    return [...needs].every((n) => ok[n]);
  });
  if (!usable.length) return null;
  const line = usable[hash(seed) % usable.length];
  return { en: fill(line.en, facts, "en"), es: fill(line.es, facts, "es"), id: lines.indexOf(line) };
}

const PHASES = {
  before: ["ask", "success"],
  during: ["say", "listen", "stuck", "explain", "support"],
  after: ["praise", "reinforce", "ask", "away"],
};

/**
 * Coaching for one activity. `coach` is content/family-coach.json, `es` is the activity's es-guide entry.
 * `contentAware` is true when the activity supplied a learning goal; otherwise every line is a general
 * strategy and the panel says so rather than pretending to know the task.
 */
export function buildCoaching(activity, domain, coach, es = {}) {
  const facts = coachFacts(activity, es);
  const set = coach?.coach?.[domain];
  if (!set) return null;
  const out = { phases: {}, facts, contentAware: Boolean(facts.skillEn), minutes: activity.time || "" };
  for (const [phase, slots] of Object.entries(PHASES)) {
    out.phases[phase] = {};
    for (const slot of slots) {
      const line = pickLine(set[phase]?.[slot], `${activity.id}:${phase}:${slot}`, facts);
      if (line) out.phases[phase][slot] = line;
    }
  }
  const tip = pickLine(coach.types?.[activity.type]?.tip, `${activity.id}:type`, facts);
  if (tip) out.phases.during.tip = tip;
  return out;
}
