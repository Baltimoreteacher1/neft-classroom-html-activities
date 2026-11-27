// Block and question builders shared by the Language Page practice adapters (lab activities, Access Prep, grammar,
// city, adventures and the other studios). Everything is built from what the source already holds: a key is only ever
// a key the source marks, and an item without one becomes an open response, never an invented multiple choice.
// Every string is fitted to the schema limit here (shortened at a sentence boundary), and the full text of anything
// shortened is kept in `overflow` so the adapter can put it in a teacher-only note: nothing is silently lost.

import { listenBlocks } from "./listen-blocks.js";
import { chunkText, list, noteBlocks, shorten, tableBlocks, text } from "./util.js";

export const MAX = Object.freeze({
  prompt: 4000,
  text: 4000,
  passage: 12000,
  option: 400,
  hint: 400,
  explanation: 800,
  frame: 300,
  skill: 80,
  label: 80,
  rubric: 300,
  title: 120,
  objective: 400,
  description: 400,
});

const ID_OK = /^[a-z][a-z0-9_-]{0,31}$/i;
/** A schema-safe block or option id: the source id when it is one, else `prefix` + position. */
export const safeId = (id, prefix, n) => {
  const s = String(id ?? "");
  return ID_OK.test(s) ? s : `${prefix}${n}`;
};
export const blockId = (...parts) =>
  parts
    .join("-")
    .replace(/[^a-z0-9_-]/gi, "")
    .slice(0, 32);

/** A pair stored as [en, es] or {en, es}, as {en, es}. */
export const pairOf = (v) =>
  Array.isArray(v)
    ? { en: text(v[0]), es: text(v[1]) }
    : v && typeof v === "object"
      ? { en: text(v.en), es: text(v.es) }
      : { en: text(v), es: "" };

/** Cut at the last word boundary that fits (for short labels such as a skill name). */
export const clipWords = (value, max) => {
  const s = text(value);
  if (s.length <= max) return s;
  const cut = s.slice(0, max + 1);
  const at = cut.lastIndexOf(" ");
  return (at > 0 ? cut.slice(0, at) : s.slice(0, max)).trimEnd();
};

/** Teacher-only note blocks for lines of any length: a line longer than one note is split at sentence boundaries. */
export const overflowNotes = (id, lines) =>
  noteBlocks(
    id,
    lines.flatMap((l) => chunkText(l, 1150)),
  );

/** A per-extract fitter: `fit(value, max, label)` returns the value within `max`; the full text goes to `overflow`. */
export function fitter() {
  const overflow = [];
  const fit = (value, max, label = "Text") => {
    const s = text(value);
    const out = shorten(s, max);
    if (out !== s) overflow.push(`${label} (full text): ${s}`);
    return out;
  };
  return { fit, overflow };
}

/** English plus its Spanish, when there is one and both fit; else the English alone. */
export function withSpanish(en, es, max, lead = "En español:") {
  const e = text(en);
  const s = text(es);
  if (!s || s === e) return e;
  if (!e) return `${lead} ${s}`.length <= max ? `${lead} ${s}` : "";
  const both = `${e}\n\n${lead} ${s}`;
  return both.length <= max ? both : e;
}

/** A text block (directions, a heading or body text). */
export const textBlock = (id, body, role = "body", fit) =>
  text(body) ? { type: "text", id, role, text: fit(body, MAX.text, "Directions") } : null;

/** A reading block; over-long readings split into numbered parts so no sentence is dropped. */
export function passageBlocks(id, title, paragraphs) {
  const body = list(paragraphs).map(text).filter(Boolean).join("\n\n");
  if (!body) return [];
  if (body.length <= MAX.passage)
    return [{ type: "passage", id, title: text(title).slice(0, 120), text: body }];
  const parts = [];
  let cur = "";
  for (const p of body.split("\n\n")) {
    if (cur && cur.length + 2 + p.length > MAX.passage) {
      parts.push(cur);
      cur = "";
    }
    cur = cur ? `${cur}\n\n${p}` : p;
  }
  if (cur) parts.push(cur);
  return parts.map((t, n) => ({
    type: "passage",
    id: `${id}-${n + 1}`.slice(0, 32),
    title: `${text(title)} (${n + 1}/${parts.length})`.slice(0, 120),
    text: t,
  }));
}

/** Read-aloud lines as audio blocks plus a transcript (see listen-blocks.js). */
export const audioBlocks = (id, title, lines) => {
  const l = list(lines).map(text).filter(Boolean);
  return l.length ? listenBlocks(id, text(title) || "Listen", l) : [];
};

/** A chart ({title, unit, data:[{label, value}]}) as a table: the numbers it draws, never re-computed. */
export function chartBlocks(id, chart, flags) {
  if (!chart || !list(chart.data).length) return [];
  const unit = text(chart.unit);
  const headers = [text(chart.xLabel) || "Item", unit ? `Value (${unit})` : "Value"];
  const rows = chart.data.map((d) => [text(d.label), text(d.value)]);
  return tableBlocks(id, text(chart.title), headers, rows, flags);
}

/** A same-site picture as an image block (the lab's pictures folder). */
export function imageBlock(id, pic, fit, base = "/access-practice-lab/") {
  const src = text(pic?.src);
  if (!src || src.includes("..") || /^[a-z]+:/i.test(src)) return null;
  return {
    type: "image",
    id,
    src: src.startsWith("/") ? src : `${base}${src}`,
    alt: fit(pic.alt, 300, "Picture description"),
    decorative: false,
    caption: "",
  };
}

/** Options as [{id, text}], ids kept when schema-safe. */
export const optionsOf = (opts, fit, getText = (o) => o.text) =>
  list(opts).map((o, n) => ({
    id: safeId(o?.id, "o", n + 1),
    text: fit(getText(o), MAX.option, "Answer choice"),
  }));

/** "Why not" lines for the wrong choices that carry a reason. */
export const whyNot = (lines) =>
  lines.length ? `Why the other choices are not correct:\n${lines.join("\n")}` : "";

/** The common question fields, all fitted. */
export function questionBase(fit, { id, prompt, hint, explanation, frame, skill, misconception }) {
  return {
    type: "question",
    id,
    prompt: fit(prompt, MAX.prompt, "Question"),
    hint: fit(hint, MAX.hint, "Hint"),
    explanation: fit(explanation, MAX.explanation, "Explanation"),
    frame: fit(frame, MAX.frame, "Sentence frame"),
    skill: clipWords(skill, MAX.skill),
    misconception: fit(misconception, 400, "Watch-out"),
  };
}

/** A choice (one key) or multi (several keys) question over the source's own options. */
export function pickQuestion(fit, base, options, answers) {
  const q = questionBase(fit, base);
  return answers.length > 1
    ? { ...q, format: "multi", options, answers: [...answers] }
    : { ...q, format: "choice", options, answer: answers[0] ?? "" };
}

/**
 * Parts of a fill-in sentence (strings and {options, answer} blanks) as blank-format text, with the choices for each
 * blank listed so the student sees exactly the words the source offers.
 */
export function blankFromParts(parts) {
  const blanks = list(parts).filter((p) => p && typeof p === "object");
  if (!blanks.length) return null;
  const marked = list(parts)
    .map((p) => (p && typeof p === "object" ? `[[${text(p.answer)}]]` : String(p ?? "")))
    .join("")
    .trim();
  const lists = blanks.map((b) => list(b.options).map(text).join(", "));
  const same = lists.every((l) => l === lists[0]);
  const lead =
    blanks.length === 1 || same
      ? `Choose from: ${lists[0]}.`
      : lists.map((l, n) => `Blank ${n + 1}: ${l}.`).join("\n");
  return { text: marked, lead };
}

/** An open response (never auto-graded). */
export function openQuestion(fit, base, { kind = "explain", sample = "", rubric = [] } = {}) {
  const marks = list(rubric).map(text).filter(Boolean);
  return {
    ...questionBase(fit, base),
    format: "short",
    kind: kind === "write" ? "write" : "explain",
    sample: fit(sample, MAX.text, "Sample response"),
    rubric: marks.slice(0, 6).map((r) => fit(r, MAX.rubric, "Self-check line")),
  };
}

/** An order question; `items` are given in the CORRECT order. */
export const orderQuestion = (fit, base, items) => ({
  ...questionBase(fit, base),
  format: "order",
  items: items.map((it, n) => ({
    id: safeId(it.id, "i", n + 1),
    text: fit(it.text, MAX.option, "Item"),
  })),
});

/** A sort question: categories [{label}], items [{id?, text, label}] whose label names their category. */
export function sortQuestion(fit, base, labels, items) {
  const categories = labels.map((label, n) => ({
    id: `c${n + 1}`,
    label: text(label).slice(0, 80),
  }));
  return {
    ...questionBase(fit, base),
    format: "sort",
    categories,
    items: items.map((it, n) => ({
      id: safeId(it.id, "i", n + 1),
      text: fit(it.text, MAX.option, "Item"),
      category: categories.find((c) => c.label === text(it.label).slice(0, 80))?.id ?? "",
    })),
  };
}

/** A vocabulary block from {term, def, es, example} rows, every field within its limit. */
export function vocabItems(rows, fit) {
  const items = rows
    .filter((v) => text(v.term) && text(v.def))
    .map((v) => ({
      term: fit(v.term, 80, "Word"),
      def: fit(v.def, 300, `Meaning of "${text(v.term)}"`),
      es: fit(v.es, 80, `Spanish for "${text(v.term)}"`),
      example: fit(v.example, 300, `Example for "${text(v.term)}"`),
    }));
  return items.length ? { type: "vocab", id: "vocab", items } : null;
}

/** Teacher lines that fit the 2,000-character teacher note; the rest go to `rest` (for note blocks). */
export function teacherLines(lines, max = 2000) {
  const all = lines.map(text).filter(Boolean);
  const kept = [];
  let size = 0;
  for (const line of all) {
    if (size + line.length + 1 > max) break;
    kept.push(line);
    size += line.length + 1;
  }
  return { teacher: kept.join("\n"), rest: all.slice(kept.length) };
}

/**
 * The common activity shell of a practice draft. `blocks` are content and questions; teacher lines past the teacher
 * note and every shortened field's full text are appended as teacher-only note blocks.
 */
export function practiceDraft(fit, overflow, o) {
  const note = teacherLines(o.teacher || []);
  const title = fit(o.title, MAX.title, "Title");
  const description = fit(o.description, MAX.description, "Description");
  const objective = fit(o.objective, MAX.objective, "Objective");
  const blocks = [...o.blocks.filter(Boolean), ...overflowNotes("teacher", [...note.rest, ...overflow])];
  const questions = blocks.filter((b) => b.type === "question");
  return {
    title,
    description,
    kind: "interactive",
    template: o.template || "explore-practice",
    context: {
      grade: text(o.grade).slice(0, 8),
      subject: text(o.subject).slice(0, 40),
      curriculum: "The Language Page",
      objective,
      standards: [],
      source: { origin: "teacher", note: text(o.sourceNote).slice(0, 200).trimEnd() },
    },
    supports: {
      wida: 0,
      hints: questions.some((q) => q.hint),
      frames: questions.some((q) => q.frame),
      spanish: Boolean(o.spanish),
      readAloud: blocks.some((b) => b.type === "audio"),
      visuals: false,
      chunk: false,
    },
    options: { shuffle: true, revise: true, answerKey: true },
    blocks,
    notes: { teacher: note.teacher, misconceptions: [] },
  };
}
