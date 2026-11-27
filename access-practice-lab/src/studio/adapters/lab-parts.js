// Shared builders for the Language Page lab adapters (studio tasks, TWR, talk table, warm-up, worlds, ...).
// Pure: no DOM, no storage. Every string comes from the source data; these helpers only fit it to the schema's
// limits (text that would be clipped goes to a teacher note instead) and assemble a normalized-shape activity.

import { chunkText, list, packLines, text } from "./util.js";

const NOTE_MAX = 2000;
const TEXT_MAX = 4000;

/** Teacher-note text within the schema limit; lines that do not fit are counted, never clipped. */
export function fitNote(lines) {
  const kept = [];
  let size = 0;
  for (const line of lines.map(text).filter(Boolean)) {
    if (size + line.length + 1 > NOTE_MAX) break;
    kept.push(line);
    size += line.length + 1;
  }
  return { teacher: kept.join("\n"), dropped: lines.filter(Boolean).length - kept.length };
}

/** English with its Spanish on a labeled line when both fit `max`; English alone otherwise. */
export function withSpanish(en, es, max) {
  const e = text(en);
  const s = text(es);
  if (!s || s === e) return e;
  const both = `${e}\n\nEn español: ${s}`;
  return both.length <= max ? both : e;
}

/** Text blocks of at most 4000 characters each (split at sentence boundaries, nothing dropped). */
export const textBlocks = (id, value, role = "body") =>
  packLines(chunkText(value, TEXT_MAX), TEXT_MAX, " ").map((t, n) => ({
    type: "text",
    id: `${id}${n ? `-${n + 1}` : ""}`.slice(0, 32),
    role,
    text: t,
  }));

/** A passage block (12000 characters is the schema limit; longer text is split into parts). */
export function passageBlocks(id, title, paragraphs) {
  const parts = packLines(list(paragraphs).map(text).filter(Boolean), 12000, "\n\n");
  return parts.map((body, n) => ({
    type: "passage",
    id: `${id}${n ? `-${n + 1}` : ""}`.slice(0, 32),
    title: (parts.length > 1 ? `${text(title)} (${n + 1}/${parts.length})` : text(title)).slice(
      0,
      120,
    ),
    text: body,
  }));
}

/** A choice question in the source's own option order; `answer` is the index of the correct option. */
export function choiceAt({ id, prompt, options, answer, hint = "", explanation = "", skill = "" }) {
  const opts = list(options).map((o, n) => ({ id: `o${n + 1}`, text: text(o) }));
  return {
    type: "question",
    id,
    format: "choice",
    prompt: text(prompt),
    options: opts,
    answer: opts[Number(answer)]?.id ?? "",
    hint: text(hint),
    explanation: text(explanation),
    skill: text(skill).slice(0, 80),
  };
}

/** A bar or line chart from the source as a two-column table. */
export const chartRows = (chart) => ({
  caption: text(chart?.title),
  headers: ["", text(chart?.unit) || "Value"],
  rows: list(chart?.data).map((d) => [text(d.label), text(d.value)]),
});

/** The fields every lab draft shares. */
export function labActivity({
  title,
  description = "",
  grade = "",
  subject = "",
  curriculum,
  objective = "",
  sourceNote,
  template = "build-explain",
  blocks,
  teacher = "",
  spanish = false,
  frames = false,
  readAloud = false,
}) {
  return {
    title: text(title).slice(0, 120),
    description: text(description).slice(0, 400),
    kind: "interactive",
    template,
    context: {
      grade: text(grade).slice(0, 8),
      subject: text(subject).slice(0, 40),
      curriculum,
      objective: text(objective).slice(0, 400),
      standards: [],
      source: { origin: "teacher", note: text(sourceNote).slice(0, 200) },
    },
    supports: {
      wida: 0,
      hints: true,
      frames,
      spanish,
      readAloud,
      visuals: false,
      chunk: false,
    },
    options: { shuffle: true, revise: true, answerKey: true },
    blocks,
    notes: { teacher, misconceptions: [] },
  };
}

/** Is `s` a well-formed lab id (the same rule routes.js uses for refs)? */
export const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/i;
