// Language Time Machine — the learner's reflection on a pair, and the only things this feature stores.
// Key accessPracticeLab:v1:time-machine (it travels in the Passport export like every accessPracticeLab: key):
//   { v: 1,
//     reflections: { [pairId]: { t, answers: { improved, strategy, challenge, goal }, audio: { [promptId]: audioId } } },
//     verified:    { [itemId]: true },        // "these words are right" for a speech-recognition transcript
//     transcripts: { [itemId]: string },      // words the learner typed for a recording that had none
//     links:       { [taskId]: itemId },      // which earlier piece a new-context task was made from
//     shared:      { [pairId]: { t, workId } } }
//
// Rules this module keeps:
//  * It never writes to another feature's store. A verified flag or a typed transcript lives here, next to the
//    source item's id; the source item is read-only.
//  * A reflection is the learner's own words: nothing is scored, counted or judged.
import { safeJson, storage } from "../util.js";

export const TM_KEY = "accessPracticeLab:v1:time-machine";
export const MAX_ANSWER = 600;
const MAX_REFLECTIONS = 60;

/** The four reflection prompts, in order. */
export const PROMPTS = Object.freeze([
  {
    id: "improved",
    q: ["What improved?", "¿Qué mejoró?"],
    hint: [
      "Point to words in your later work that show it.",
      "Señala palabras de tu trabajo posterior que lo muestren.",
    ],
  },
  {
    id: "strategy",
    q: ["What strategy helped?", "¿Qué estrategia te ayudó?"],
    hint: [
      "For example: planning first, reading it aloud, using a model.",
      "Por ejemplo: planear primero, leerlo en voz alta, usar un modelo.",
    ],
  },
  {
    id: "challenge",
    q: ["What remains challenging?", "¿Qué sigue siendo difícil?"],
    hint: ["Name one thing that is still hard.", "Nombra una cosa que todavía es difícil."],
  },
  {
    id: "goal",
    q: ["What is my next goal?", "¿Cuál es mi próxima meta?"],
    hint: [
      "One thing you will try in your next piece of work.",
      "Una cosa que vas a intentar en tu próximo trabajo.",
    ],
  },
]);

const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const empty = () => ({
  v: 1,
  reflections: {},
  verified: {},
  transcripts: {},
  links: {},
  shared: {},
});

export function loadTM(read = (k) => storage.get(k)) {
  const raw = obj(safeJson(read(TM_KEY), null));
  return {
    ...empty(),
    reflections: obj(raw.reflections),
    verified: obj(raw.verified),
    transcripts: obj(raw.transcripts),
    links: obj(raw.links),
    shared: obj(raw.shared),
  };
}

export function saveTM(state, write = (k, v) => storage.set(k, v)) {
  const ids = Object.keys(state.reflections);
  if (ids.length > MAX_REFLECTIONS)
    for (const id of ids
      .sort((a, b) => String(state.reflections[a].t).localeCompare(String(state.reflections[b].t)))
      .slice(0, ids.length - MAX_REFLECTIONS))
      delete state.reflections[id];
  return write(TM_KEY, JSON.stringify(state));
}

const blank = () => ({ t: "", answers: {}, audio: {} });
export const reflectionFor = (state, pairId) => state.reflections[pairId] || blank();

/** Save one typed answer. An empty answer removes it; a reflection with nothing in it is not kept. */
export function setAnswer(state, pairId, promptId, text, now = new Date().toISOString()) {
  if (!PROMPTS.some((p) => p.id === promptId)) return null;
  const r = (state.reflections[pairId] ||= blank());
  const value = String(text ?? "").slice(0, MAX_ANSWER);
  if (value.trim()) r.answers[promptId] = value;
  else delete r.answers[promptId];
  r.t = now;
  if (!hasReflection(r)) delete state.reflections[pairId];
  return r;
}

/** Attach (or with "" remove) a recorded answer; the audio itself lives in audio-store.js. */
export function setAudio(state, pairId, promptId, audioId, now = new Date().toISOString()) {
  if (!PROMPTS.some((p) => p.id === promptId)) return null;
  const r = (state.reflections[pairId] ||= blank());
  if (audioId) r.audio[promptId] = String(audioId);
  else delete r.audio[promptId];
  r.t = now;
  if (!hasReflection(r)) delete state.reflections[pairId];
  return r;
}

export const hasReflection = (r) =>
  Boolean(
    r &&
    (Object.values(obj(r.answers)).some((a) => String(a).trim()) ||
      Object.keys(obj(r.audio)).length),
  );

/** Reflections with something in them, newest first: [{ pairId, t, answers, audio }]. */
export const listReflections = (state) =>
  Object.entries(state.reflections)
    .filter(([, r]) => hasReflection(r))
    .map(([pairId, r]) => ({ pairId, t: r.t || "", answers: obj(r.answers), audio: obj(r.audio) }))
    .sort((a, b) => b.t.localeCompare(a.t));

/** The reflection as plain lines for the evidence packet. A recorded answer is named, never transcribed. */
export function reflectionLines(r) {
  if (!hasReflection(r)) return [];
  return PROMPTS.map((p) => {
    const typed = String(r.answers?.[p.id] || "").trim();
    const said = r.audio?.[p.id] ? "(recorded answer kept on the learner's device)" : "";
    return typed || said ? `${p.q[0]} ${typed || said}` : "";
  }).filter(Boolean);
}

/** "These words are right": only this flag changes, here. The source transcript is never edited. */
export function setVerified(state, itemId, on = true) {
  if (on) state.verified[itemId] = true;
  else delete state.verified[itemId];
  return state;
}

export function setTranscript(state, itemId, text) {
  const value = String(text ?? "").slice(0, 2000);
  if (value.trim()) state.transcripts[itemId] = value;
  else delete state.transcripts[itemId];
  return state;
}

/**
 * Lay this feature's own notes over the collected items WITHOUT touching the stores they came from: a transcript the
 * learner typed here fills an item that had no words (and counts as typed), and a confirmed transcript is `verified`.
 */
export function overlay(items, state) {
  return items.map((x) => {
    const typed = !x.text && state.transcripts[x.id];
    const text = typed ? String(state.transcripts[x.id]).trim() : x.text;
    const source = typed ? "typed" : x.source;
    return { ...x, text, source, verified: source === "typed" || Boolean(state.verified[x.id]) };
  });
}
