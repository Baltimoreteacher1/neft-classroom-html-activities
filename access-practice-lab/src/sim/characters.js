// Living Language Simulation Engine: characters. A character speaks ONLY its authored topics (its authorized
// knowledge), in its authored wording. This module decides which topic a question means and which authored line is
// shown; it never writes new text and never changes state (the runtime does that through an `ask` or `clarify`
// action). Rules kept here:
//   - a typed or dictated question is matched on the device to a topic by keywords (matchTopic);
//   - a relevant but unexpected question gets the nearest authorized topic; an off-topic one, or a topic that is
//     still closed, gets the character's `fallback` (it stays in role and says what it can talk about);
//   - a repeated question gets a short "as I said" variant;
//   - an optional model may only SELECT one of the open topic ids (or "none"); its reply is checked against the list
//     and any failure falls back to the on-device match. The model never writes a word a learner reads.
import { characterOf, evalCond, topicOf } from "./schema.js";

export const ASSIST_URL = "/api/class/ai/character";
export const MAX_QUESTION = 240;

const STOP = new Set(
  "the a an and or but of to in on at for with from is are was were be been do does did you your i me my we our it its this that these those what when where who why how can could would should about tell please have has had there here not que como cuando donde quien por para con los las el la un una del al es son fue eran hay tu su mi me se lo le de en y o no si mas muy sobre puedes puede dime favor".split(
    " ",
  ),
);

/** Lowercase, no accents, no punctuation: the form keywords and questions are compared in. */
export const normalize = (text) =>
  String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const tokensOf = (text) => normalize(text).split(" ").filter(Boolean);
const contentWords = (text) => tokensOf(text).filter((w) => w.length >= 4 && !STOP.has(w));

/** How strongly a question points at one topic: 2 for a phrase keyword, 1 for a word, up to 1 for shared ask words. */
export function scoreTopic(topic, question) {
  const text = ` ${normalize(question)} `;
  const tokens = tokensOf(question);
  let score = 0;
  for (const raw of topic.keywords || []) {
    const kw = normalize(raw);
    if (!kw) continue;
    if (kw.includes(" ")) score += text.includes(` ${kw} `) ? 2 : 0;
    else if (tokens.some((t) => t === kw || (kw.length >= 4 && t.startsWith(kw)))) score += 1;
  }
  const asked = new Set([...contentWords(topic.ask?.[0]), ...contentWords(topic.ask?.[1])]);
  const shared = contentWords(question).filter((w) => asked.has(w)).length;
  return score + Math.min(1, shared * 0.5);
}

/**
 * Match a question to one of the character's topics.
 * @param {object} character
 * @param {string} question
 * @param {{ open?: string[] }} [options] ids of the topics that are open now (default: all)
 * @returns {{ topic: string | null, score: number, weak: boolean, locked: boolean }}
 *   `weak` means the device is unsure (no keyword, one faint hit, or a tie); `locked` means the best match is a topic
 *   the learner cannot ask yet, so the character gives its fallback.
 */
export function matchTopic(character, question, { open } = {}) {
  const topics = character?.topics || [];
  const allowed = new Set(open || topics.map((t) => t.id));
  const scored = topics
    .map((t, i) => ({ id: t.id, i, score: scoreTopic(t, question) }))
    .sort((a, b) => b.score - a.score || a.i - b.i);
  const [best, second] = scored;
  if (!best || best.score <= 0) return { topic: null, score: 0, weak: true, locked: false };
  if (!allowed.has(best.id)) {
    // The nearest topic is closed. An open topic that scores as well is used instead; otherwise stay in role.
    const alt = scored.find((s) => allowed.has(s.id) && s.score >= best.score && s.score > 0);
    if (!alt) return { topic: null, score: best.score, weak: false, locked: true };
    return { topic: alt.id, score: alt.score, weak: alt.score < 2, locked: false };
  }
  const tie = Boolean(second && second.score === best.score);
  return { topic: best.id, score: best.score, weak: best.score < 2 || tie, locked: false };
}

/** Ask the optional model to SELECT a topic. Resolves to an id from `topics`, "none", or null on any failure. */
export async function assistTopic(question, topics, fetchImpl = (...a) => fetch(...a)) {
  const list = (topics || []).map((t) => ({ id: t.id, label: t.label }));
  if (list.length < 2) return null;
  try {
    const res = await fetchImpl(ASSIST_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question: String(question || "").slice(0, MAX_QUESTION),
        topics: list,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) return null;
    return data.topic === "none" || list.some((t) => t.id === data.topic) ? data.topic : null;
  } catch {
    return null;
  }
}

/**
 * Decide which authored topic answers a typed question: on-device first, the model only when the device is unsure.
 * @returns {Promise<{ topic: string | null, source: "device" | "model", locked: boolean }>}
 */
export async function resolveQuestion(
  def,
  state,
  characterId,
  question,
  { assist = false, fetchImpl } = {},
) {
  const character = characterOf(def, characterId);
  const open = (character?.topics || []).filter((t) => evalCond(t.requires, state, def));
  const local = matchTopic(character, question, { open: open.map((t) => t.id) });
  if (assist && local.weak && !local.locked && open.length >= 2) {
    const picked = await assistTopic(
      question,
      open.map((t) => ({ id: t.id, label: t.ask[0] })),
      fetchImpl,
    );
    if (picked === "none") return { topic: null, source: "model", locked: false };
    if (picked) return { topic: picked, source: "model", locked: false };
  }
  return { topic: local.topic, source: "device", locked: local.locked };
}

const firstSentence = (text) =>
  (String(text).match(/^.*?[.!?](?=\s|$)/)?.[0] || String(text)).trim();

/** The authored line for a runtime event (answer, clarified, fallback): { text: [en, es], kind }. */
export function lineFor(def, event) {
  const character = characterOf(def, event.character);
  if (!character) return null;
  if (event.type === "fallback") return { kind: "fallback", text: character.fallback };
  const topic = topicOf(character, event.topic);
  if (!topic) return null;
  const said = event.type === "clarified" ? topic.clarify.answer : topic.answer;
  if (!event.repeat) return { kind: event.type === "clarified" ? "clarify" : "answer", text: said };
  // Memory: the character knows it already answered this.
  const again = event.type === "answer" && topic.again;
  return {
    kind: "repeat",
    text: again || [`As I said: ${firstSentence(said[0])}`, `Como dije: ${firstSentence(said[1])}`],
  };
}

/**
 * What the dialogue panel offers for a character: new questions first, then clarification questions for topics
 * already answered, then questions already asked (the learner may ask again).
 */
export function suggestions(def, state, characterId) {
  const character = characterOf(def, characterId);
  const memory = state.talk?.[characterId] || { asked: [], clarified: [] };
  const open = (character?.topics || []).filter((t) => evalCond(t.requires, state, def));
  return {
    fresh: open.filter((t) => !memory.asked.includes(t.id)),
    clarify: open.filter(
      (t) => t.clarify && memory.asked.includes(t.id) && !memory.clarified.includes(t.id),
    ),
    asked: open.filter((t) => memory.asked.includes(t.id)),
    closed: (character?.topics || []).length - open.length,
  };
}

/** The dialogue so far with one character, oldest first, as authored lines: [{ who: "me" | "them", text: [en, es] }]. */
export function transcriptOf(def, state, characterId) {
  const character = characterOf(def, characterId);
  const seen = { ask: new Set(), clarify: new Set() };
  const out = [];
  for (const entry of state.talk?.[characterId]?.log || []) {
    if (entry.k === "fallback") {
      out.push({ who: "them", kind: "fallback", text: character.fallback });
      continue;
    }
    const topic = topicOf(character, entry.t);
    if (!topic) continue;
    const repeat = seen[entry.k].has(entry.t);
    seen[entry.k].add(entry.t);
    out.push({
      who: "me",
      kind: entry.k,
      text: entry.k === "clarify" ? topic.clarify.ask : topic.ask,
    });
    const line = lineFor(def, {
      type: entry.k === "clarify" ? "clarified" : "answer",
      character: characterId,
      topic: entry.t,
      repeat,
    });
    out.push({ who: "them", kind: line.kind, text: line.text });
  }
  return out;
}
