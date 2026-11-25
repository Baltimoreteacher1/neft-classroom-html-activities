// Transformations: turn an activity into another kind of task, only when it can really run on the content present.
// Every transform uses content the activity already has (its words, meanings, examples, questions, passage). None
// drops an answer key it keeps, none changes a fact, none invents a definition, a sample answer or a translation.
// Each returns { activity, notes, ran }: `notes` are {en, es} lines for the teacher; `ran` is false (and the activity
// is an unchanged copy) when the content cannot support it. `availableTransforms` lists only the ones that can run.
//
//   toKind        change how students use it (worksheet, interactive, game, quick check): same questions, same keys (in place)
//   vocabPractice a word practice activity built only from the activity's word list
//   exitTicket    a 3-6 question quick check made of questions that already check automatically
//   speakingTask  a retell/explain speaking task from a passage or transcript   (transforms-writing.js)
//   writingTask   a short writing task from a passage                           (transforms-writing.js)
//
// The four content transforms make a NEW activity (fresh id, lineage.variantOf = the source); pass `{ inPlace: true }`
// to edit the draft instead. toKind always converts in place.

import { convertActivity } from "./convert.js";
import { skillOf } from "./differentiate-length.js";
import { dupKey, keyChecks, safeQuestion } from "./differentiate-safe.js";
import {
  blocksOf,
  clone,
  freshId,
  pair,
  plural,
  vocabItems,
} from "./differentiate-util.js";
import { questionPool } from "./generate.js";
import { KINDS, questionsOf } from "./schema.js";
import { DIRECTION_STEPS, NEEDS, cannot, derive, draftFrom } from "./transforms-base.js";
import { speakingTask, writingSource, writingTask } from "./transforms-writing.js";

export { speakingTask, writingTask };

const KIND_LABEL = {
  worksheet: pair("Make a worksheet", "Hacer una hoja de trabajo"),
  interactive: pair("Make an interactive activity", "Hacer una actividad interactiva"),
  game: pair("Make a game", "Hacer un juego"),
  check: pair("Make a quick check", "Hacer una revisión rápida"),
};

const SAME_KIND = pair("It is already that kind of activity.", "Ya es ese tipo de actividad.");

/** Change the kind (and template) of the draft in place. Wraps convertActivity and returns its notes. */
export function toKind(activity, kind, template = "") {
  const qs = questionsOf(activity);
  if (!KINDS.includes(kind))
    return cannot(
      activity,
      pair("That is not a kind of activity.", "Eso no es un tipo de actividad."),
    );
  if (kind === activity.kind && !template)
    return cannot(
      activity,
      SAME_KIND,
    );
  if (!qs.length)
    return cannot(
      activity,
      pair("Add at least one question first.", "Primero agrega al menos una pregunta."),
    );
  if (kind === "game" && qs.length < 3)
    return cannot(
      activity,
      pair("A game needs at least three questions.", "Un juego necesita al menos tres preguntas."),
    );
  const { activity: next, notes } = convertActivity(activity, kind, template);
  return { activity: next, notes, ran: true };
}

// ── vocabulary practice ─────────────────────────────────────────────────────

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Fill-in-the-blank questions made from a word's OWN example sentence (only when the example contains the word). */
function exampleBlanks(items) {
  const out = [];
  for (const v of items) {
    const m = v.example.match(new RegExp(`\\b${escapeRe(v.term)}\\b`, "i"));
    if (!m || out.length >= 4) continue;
    out.push({
      format: "blank",
      prompt: "Fill in the missing word.",
      text: v.example.replace(m[0], `[[${m[0]}]]`),
      bank: true,
      hint: `Think about the meaning: ${v.def}`,
      explanation: `"${v.term}" means ${v.def}.`,
      skill: "vocabulary in context",
    });
  }
  return out;
}

const VOCAB_DIRECTIONS = [
  "Match each word to its meaning.",
  "Use the word list to answer the other questions.",
  "If an answer is not right yet, use the hint and try again.",
];

/** A word practice activity built only from the terms, meanings and examples already in the activity's word list. */
export function vocabPractice(activity, deps = {}) {
  const items = vocabItems(activity);
  if (items.length < 2)
    return cannot(activity, NEEDS.vocabPractice);
  const parsed = {
    vocab: items.map(({ term, def, es, example }) => ({ term, def, es, example })),
    questions: [],
    problems: [],
    categories: [],
    sequence: [],
    passage: "",
  };
  const seen = new Set();
  const qs = [];
  for (const raw of [...questionPool(parsed, null), ...exampleBlanks(items)]) {
    const q = safeQuestion(raw);
    if (!q || seen.has(dupKey(q))) continue;
    seen.add(dupKey(q));
    qs.push(q);
  }
  const a = draftFrom(activity, [], { kind: "interactive", template: "match-sort" });
  const taken = new Set();
  const used = new Set();
  const list = items.map((v, i) => ({
    ...v,
    id: used.has(v.id) ? `v${i + 1}-${i}` : (used.add(v.id), v.id),
  }));
  for (const b of blocksOf(activity, "vocab")) taken.add(b.id);
  const added = [];
  const dirId = freshId("vp-directions", taken);
  const vocabId = freshId("vp-words", taken);
  added.push(dirId, vocabId);
  a.blocks = [
    { id: dirId, type: "text", role: "directions", text: DIRECTION_STEPS(VOCAB_DIRECTIONS) },
    { id: vocabId, type: "vocab", items: list },
  ];
  qs.forEach((q, i) => {
    q.id = freshId(`vp-${i + 1}`, taken);
    added.push(q.id);
    a.blocks.push(q);
  });
  return derive(activity, a, {
    suffix: "Word Practice",
    added,
    deps,
    notes: [
      plural(
        qs.length,
        [
          "Made a word practice activity with {n} question built only from your word list (terms, meanings and examples). The original's other questions were not copied.",
          "Made a word practice activity with {n} questions built only from your word list (terms, meanings and examples). The original's other questions were not copied.",
        ],
        [
          "Se hizo una actividad de práctica de palabras con {n} pregunta hecha solo con tu lista de palabras (términos, significados y ejemplos). Las demás preguntas del original no se copiaron.",
          "Se hizo una actividad de práctica de palabras con {n} preguntas hechas solo con tu lista de palabras (términos, significados y ejemplos). Las demás preguntas del original no se copiaron.",
        ],
      ),
    ],
  });
}

// ── exit ticket ─────────────────────────────────────────────────────────────

const CONTEXT_BLOCKS = new Set(["passage", "image", "table", "math", "audio"]);
const EXIT_DIRECTIONS = "Answer each question. After you check, fix any answer you want to change.";

/** `n` evenly spread items, always including the first and last when n >= 2. */
const spreadPick = (list, n) =>
  n >= list.length
    ? list
    : [
        ...new Set(
          Array.from(
            { length: n },
            (_, i) => list[Math.round((i * (list.length - 1)) / Math.max(n - 1, 1))],
          ),
        ),
      ];

const gradable = (activity) =>
  questionsOf(activity).filter((q) => q.format !== "short" && keyChecks(q));

function chooseExit(activity) {
  const pool = gradable(activity);
  const target = Math.min(pool.length, Math.max(3, Math.min(6, Math.round(pool.length / 3))));
  const seen = new Set();
  const firsts = pool.filter((q) => !seen.has(skillOf(q)) && seen.add(skillOf(q)));
  const rest = pool.filter((q) => !firsts.includes(q));
  const picked =
    firsts.length >= target
      ? spreadPick(firsts, target)
      : [...firsts, ...spreadPick(rest, target - firsts.length)];
  return pool.filter((q) => picked.includes(q));
}

/** A quick check of 3-6 questions the activity already has, all of which check automatically. Keys are untouched. */
export function exitTicket(activity, deps = {}) {
  if (gradable(activity).length < 3)
    return cannot(activity, NEEDS.exitTicket);
  const chosen = chooseExit(activity);
  const ids = new Set(chosen.map((q) => q.id));
  const last = Math.max(...chosen.map((q) => activity.blocks.findIndex((b) => b.id === q.id)));
  const a = draftFrom(activity, [], { kind: "check", template: "exit-ticket" });
  const context = activity.blocks.filter((b, i) => i < last && CONTEXT_BLOCKS.has(b.type));
  const dirId = freshId("exit-directions", new Set(activity.blocks.map((b) => b.id)));
  a.blocks = [
    { id: dirId, type: "text", role: "directions", text: EXIT_DIRECTIONS },
    ...clone(context),
    ...clone(activity.blocks.filter((b) => ids.has(b.id))),
  ];
  return derive(activity, a, {
    suffix: "Exit Ticket",
    added: [dirId],
    deps,
    notes: [
      pair(
        `Made a quick check from ${chosen.length} of your ${questionsOf(activity).length} questions. They are copied exactly, with their answer keys. ${context.length ? "The text and pictures they use were kept." : ""}`.trim(),
        `Se hizo una revisión rápida con ${chosen.length} de tus ${questionsOf(activity).length} preguntas. Se copiaron tal cual, con sus claves de respuestas. ${context.length ? "Se conservaron el texto y las imágenes que usan." : ""}`.trim(),
      ),
    ],
  });
}

// ── what can run ────────────────────────────────────────────────────────────

const LABELS = {
  vocabPractice: pair("Word practice", "Práctica de palabras"),
  exitTicket: pair("Exit ticket", "Boleto de salida"),
  speakingTask: pair("Speaking task", "Tarea de expresión oral"),
  writingTask: pair("Writing task", "Tarea de escritura"),
};
function kindReason(activity, kind) {
  const n = questionsOf(activity).length;
  if (kind === activity.kind)
    return SAME_KIND;
  if (!n) return pair("Add at least one question first.", "Primero agrega al menos una pregunta.");
  if (kind === "game" && n < 3)
    return pair(
      "A game needs at least three questions.",
      "Un juego necesita al menos tres preguntas.",
    );
  return null;
}

/** Every transformation with whether it can run here and, when it cannot, why. */
export function transformStatus(activity) {
  const kinds = KINDS.map((kind) => ({
    id: `toKind:${kind}`,
    label: KIND_LABEL[kind],
    reason: kindReason(activity, kind),
  }));
  const can = {
    vocabPractice: vocabItems(activity).length >= 2,
    exitTicket: gradable(activity).length >= 3,
    speakingTask: writingSource(activity, "speaking"),
    writingTask: writingSource(activity, "writing"),
  };
  const rest = Object.keys(LABELS).map((id) => ({
    id,
    label: LABELS[id],
    reason: can[id] ? null : NEEDS[id],
  }));
  return [...kinds, ...rest].map((t) => ({ ...t, can: !t.reason }));
}

/** Only the transformations that can run on this activity's content: [{ id, label }]. */
export const availableTransforms = (activity) =>
  transformStatus(activity)
    .filter((t) => t.can)
    .map(({ id, label }) => ({ id, label }));

const RUN = { vocabPractice, exitTicket, speakingTask, writingTask };

/** Run a transformation by the id availableTransforms gives. Unknown ids do nothing and say so. */
export function runTransform(activity, id, deps = {}) {
  if (id.startsWith("toKind:")) return toKind(activity, id.slice(7), deps.template);
  if (RUN[id]) return RUN[id](activity, deps);
  return cannot(activity, pair("That change is not available.", "Ese cambio no está disponible."));
}
