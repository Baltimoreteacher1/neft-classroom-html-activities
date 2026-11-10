// What MathSense remembers on this device, and the one rule that decides independent versus supported work:
// the FIRST check of a mission, with no hint opened, is independent. Every hint, every retry after a miss and every
// repeat of a finished mission is supported, so it can never lift independent mastery.
import { missionById } from "./missions.js";
import { deserialize, initialState, serialize } from "./model.js";

export const KEY = "fluencyMathSense:v1";
const MAX_SENTENCES = 12;
const MAX_SENTENCE_LENGTH = 400;

export const emptyRecord = () => ({
  version: 1,
  workspace: serialize(initialState()),
  open: null,
  progress: {},
  sentences: [],
});

const count = (value, max) => (Number.isInteger(value) && value >= 0 ? Math.min(value, max) : 0);

function cleanEntry(entry) {
  const source = entry && typeof entry === "object" ? entry : {};
  const done = source.done === true;
  return {
    attempts: count(source.attempts, 999),
    hints: count(source.hints, 3),
    done,
    independent: done && source.independent === true,
  };
}

export function sanitize(saved) {
  const base = emptyRecord();
  if (!saved || typeof saved !== "object" || saved.version !== 1) return base;
  const progress = {};
  for (const [id, entry] of Object.entries(
    saved.progress && typeof saved.progress === "object" ? saved.progress : {},
  )) {
    if (missionById(id)) progress[id] = cleanEntry(entry);
  }
  const sentences = (Array.isArray(saved.sentences) ? saved.sentences : [])
    .filter(
      (item) =>
        item && typeof item.text === "string" && item.text.trim() && Number.isFinite(item.at),
    )
    .slice(-MAX_SENTENCES)
    .map((item) => ({
      at: item.at,
      topic: typeof item.topic === "string" ? item.topic.slice(0, 40) : "",
      text: item.text.trim().slice(0, MAX_SENTENCE_LENGTH),
    }));
  return {
    version: 1,
    workspace: serialize(deserialize(saved.workspace)),
    open: missionById(saved.open) ? saved.open : null,
    progress,
    sentences,
  };
}

export const entryFor = (record, id) => record.progress[id] ?? cleanEntry(null);
export const status = (entry) =>
  entry.done
    ? entry.independent
      ? "independent"
      : "supported"
    : entry.attempts || entry.hints
      ? "started"
      : "new";

export function withHint(record, id) {
  const entry = entryFor(record, id);
  const hints = Math.min(3, entry.hints + 1);
  return { ...record, progress: { ...record.progress, [id]: { ...entry, hints } } };
}

// Returns the updated record and whether this attempt is independent evidence.
export function withAttempt(record, id, correct) {
  const entry = entryFor(record, id);
  const independent = entry.attempts === 0 && entry.hints === 0 && !entry.done;
  const done = entry.done || correct;
  const next = {
    attempts: entry.attempts + 1,
    hints: entry.hints,
    done,
    independent: entry.done ? entry.independent : correct && independent,
  };
  return {
    record: { ...record, progress: { ...record.progress, [id]: next } },
    independent,
    attempt: entry.attempts + 1,
  };
}

export function withSentence(record, text, topic, at = Date.now()) {
  const clean = String(text ?? "")
    .trim()
    .slice(0, MAX_SENTENCE_LENGTH);
  if (!clean) return record;
  return {
    ...record,
    sentences: [
      ...record.sentences,
      { at, topic: String(topic ?? "").slice(0, 40), text: clean },
    ].slice(-MAX_SENTENCES),
  };
}

export const withoutSentence = (record, at) => ({
  ...record,
  sentences: record.sentences.filter((item) => item.at !== at),
});

// What the learner's own sentence names (a mirror, never a grade). English and Spanish words both count.
export const NAMED_WORDS = Object.freeze([
  { id: "fraction", re: /fraction|fraccion/ },
  { id: "decimal", re: /decimal/ },
  { id: "percent", re: /percent|porcentaje|por ciento/ },
  { id: "number line", re: /number line|recta numerica/ },
  { id: "bar", re: /\bbar\b|barra/ },
  { id: "grid", re: /grid|cuadricula/ },
  { id: "pieces", re: /piece|partes|piezas/ },
  { id: "whole", re: /whole|entero|total/ },
]);
const CONNECTORS =
  /\b(because|so|same|equal|equals|stays|changes|more|less|greater|porque|igual|mismo|misma|cambia|queda|mas|menos|mayor|menor)\b/;

export function noticeSentence(text) {
  const plain = String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const words = plain.split(/\s+/).filter(Boolean).length;
  return {
    words,
    names: NAMED_WORDS.filter(({ re }) => re.test(plain)).map(({ id }) => id),
    connector: CONNECTORS.test(plain),
    enough: words >= 6,
  };
}
