// Rigor checks: does a differentiated version ask the same thing and accept the same answers as the original?
// Language support changes ACCESS (frames, word banks, chunking, read-aloud, Spanish, pictures); it never changes the
// task or the answer. WIDA level, content difficulty, reading complexity, task length and amount of support are
// separate controls, and this is the check that keeps the first one honest.

import { marksOf } from "./check.js";
import {
  blocksOf,
  pair,
  passageParts,
  readingWords,
  stepCount,
  vocabItems,
} from "./differentiate-util.js";
import { questionsOf } from "./schema.js";

export const TIER_LABELS = Object.freeze({
  "": pair("Original", "Original"),
  emerging: pair("Emerging", "Emergente"),
  developing: pair("Developing", "En desarrollo"),
  expanding: pair("Expanding", "En expansión"),
  extension: pair("Extension", "Extensión"),
});

/** Fields that are access help, not the task: they may differ between versions without changing rigor. */
const ACCESS_FIELDS = new Set([
  "id",
  "type",
  "hint",
  "explanation",
  "frame",
  "misconception",
  "skill",
  "bank",
]);

const stable = (v) =>
  JSON.stringify(v, (_k, x) =>
    x && typeof x === "object" && !Array.isArray(x)
      ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1)))
      : x,
  );
const taskPrint = (q) => stable([q.format, q.prompt, q.image]);
const keyPrint = (q) =>
  stable(
    Object.entries(q).filter(
      ([k]) => !ACCESS_FIELDS.has(k) && !["format", "prompt", "image"].includes(k),
    ),
  );

/** A correct response for a question, in the shape check.js documents. Used to prove keys still work. */
export function keyResponse(q) {
  switch (q.format) {
    case "choice":
    case "hotspot":
    case "numberline":
    case "number":
      return q.answer;
    case "multi":
      return [...q.answers];
    case "match":
      return Object.fromEntries(q.pairs.map((p) => [p.id, p.id]));
    case "sort":
      return Object.fromEntries(q.items.map((i) => [i.id, i.category]));
    case "order":
      return q.items.map((i) => i.id);
    case "blank":
      return marksOf(q.text).map((m) => m.answers[0]);
    case "short":
      return Array.from({ length: Math.max(1, q.minWords || 1) }, () => "word").join(" ");
    case "identify":
      return marksOf(q.text).map((_, i) => i);
    case "build":
      return [...q.words];
    case "error":
      return { step: q.errorStep, fix: q.fixAnswer };
    case "fillTable": {
      const out = {};
      q.rows.forEach((row, r) =>
        row.forEach((cell, c) => {
          if (cell && typeof cell === "object") out[`${r}:${c}`] = cell.answer;
        }),
      );
      return out;
    }
    case "plot":
      return q.points.map((p) => ({ ...p }));
    default:
      return null;
  }
}

const problem = (code, id, en, es) => ({ code, id, en, es });
const KEY_CODES = new Set(["dropped", "reordered", "format", "key"]);

/**
 * Compare a variant with its original.
 * Same questions (every original id, in the same order, same format), same prompts, same answer keys, same objective.
 * Questions the variant added are allowed only for the `extension` tier, must be listed in `lineage.added`, and must
 * carry a hint and an explanation (written responses also a rubric).
 * @returns {{ ok: boolean, problems: {code, id, en, es}[] }}
 */
export function assertRigor(original, variant) {
  const problems = [];
  const oq = questionsOf(original);
  const vq = questionsOf(variant);
  const byId = new Map(vq.map((q) => [q.id, q]));
  const originalIds = new Set(oq.map((q) => q.id));
  for (const q of oq) {
    const v = byId.get(q.id);
    if (!v) {
      problems.push(
        problem(
          "dropped",
          q.id,
          "A question from the original is missing in this version.",
          "Falta en esta versión una pregunta del original.",
        ),
      );
      continue;
    }
    if (v.format !== q.format)
      problems.push(
        problem(
          "format",
          q.id,
          "A question changed its format.",
          "Una pregunta cambió de formato.",
        ),
      );
    else if (taskPrint(v) !== taskPrint(q))
      problems.push(
        problem(
          "prompt",
          q.id,
          "A question's prompt or picture changed.",
          "Cambió el enunciado o la imagen de una pregunta.",
        ),
      );
    if (v.format === q.format && keyPrint(v) !== keyPrint(q))
      problems.push(
        problem(
          "key",
          q.id,
          "A question's choices or answer key changed.",
          "Cambiaron las opciones o la clave de respuestas de una pregunta.",
        ),
      );
  }
  const kept = vq.filter((q) => originalIds.has(q.id)).map((q) => q.id);
  const expected = oq.map((q) => q.id).filter((id) => byId.has(id));
  if (kept.join("|") !== expected.join("|"))
    problems.push(
      problem(
        "reordered",
        "",
        "The original questions are in a different order.",
        "Las preguntas originales están en otro orden.",
      ),
    );
  const added = vq.filter((q) => !originalIds.has(q.id));
  const listed = new Set(variant.lineage?.added || []);
  for (const q of added) {
    if (variant.lineage?.tier !== "extension")
      problems.push(
        problem(
          "added-not-allowed",
          q.id,
          "Only the Extension version may add questions.",
          "Solo la versión de Extensión puede agregar preguntas.",
        ),
      );
    else if (!listed.has(q.id))
      problems.push(
        problem(
          "added-unlisted",
          q.id,
          "An added question is not listed as added.",
          "Una pregunta agregada no está anotada como agregada.",
        ),
      );
    if (!q.hint.trim() || !q.explanation.trim() || (q.format === "short" && !q.rubric.length))
      problems.push(
        problem(
          "added-incomplete",
          q.id,
          "An added question needs a hint, an explanation and, for written answers, a rubric.",
          "Una pregunta agregada necesita una pista, una explicación y, en respuestas escritas, una rúbrica.",
        ),
      );
  }
  const a = original.context;
  const b = variant.context;
  const codes = (c) => c.standards.map((s) => s.code).join("|");
  if (a.objective !== b.objective || codes(a) !== codes(b) || a.unitId !== b.unitId)
    problems.push(
      problem(
        "objective",
        "",
        "The objective, standards or unit changed.",
        "Cambió el objetivo, los estándares o la unidad.",
      ),
    );
  return { ok: problems.length === 0, problems };
}

// ── comparison table ────────────────────────────────────────────────────────

const blankBank = (a) =>
  questionsOf(a)
    .filter((q) => q.format === "blank" && q.bank)
    .reduce((n, q) => n + new Set(marksOf(q.text).map((m) => m.answers[0])).size, 0);

function previewCount(a) {
  const first = a.blocks.findIndex(
    (b) => b.type === (blocksOf(a, "passage").length ? "passage" : "question"),
  );
  return a.blocks
    .slice(0, first < 0 ? 0 : first)
    .filter((b) => b.type === "vocab")
    .reduce((n, b) => n + b.items.length, 0);
}

const measures = (a) => ({
  wida: a.supports.wida,
  readAloud: a.supports.readAloud,
  chunk: a.supports.chunk,
  frames: a.supports.frames,
  hints: a.supports.hints,
  spanish: a.supports.spanish,
  visuals: a.supports.visuals,
  questions: questionsOf(a).length,
  frameCount: a.supports.frames ? questionsOf(a).filter((q) => q.frame).length : 0,
  wordBank: blankBank(a),
  vocabPreview: previewCount(a),
  directionSteps: blocksOf(a, "text")
    .filter((b) => b.role === "directions")
    .reduce((n, b) => n + stepCount(b.text), 0),
  passageChunks: a.supports.chunk
    ? blocksOf(a, "passage").reduce((n, b) => n + passageParts(b.text), 0)
    : 0,
  readingWords: readingWords(a),
  vocabWords: vocabItems(a).length,
  added: a.lineage?.added?.length || 0,
});

const ROWS = [
  ["wida", "supports", pair("WIDA level", "Nivel WIDA")],
  ["readAloud", "supports", pair("Read-aloud", "Lectura en voz alta")],
  ["chunk", "supports", pair("Short reading parts", "Partes de lectura cortas")],
  ["frames", "supports", pair("Sentence frames on", "Marcos de oraciones activados")],
  ["hints", "supports", pair("Hints on", "Pistas activadas")],
  ["spanish", "supports", pair("Spanish support", "Apoyo en español")],
  ["visuals", "supports", pair("Pictures with words", "Imágenes con palabras")],
  ["questions", "counts", pair("Questions", "Preguntas")],
  ["frameCount", "counts", pair("Sentence frames shown", "Marcos de oraciones visibles")],
  ["wordBank", "counts", pair("Word bank entries", "Palabras en el banco de palabras")],
  ["vocabPreview", "counts", pair("Words shown before reading", "Palabras antes de leer")],
  ["directionSteps", "counts", pair("Direction steps", "Pasos de instrucciones")],
  ["passageChunks", "counts", pair("Reading parts", "Partes de lectura")],
  [
    "readingWords",
    "counts",
    pair(
      "Words to read (text, directions, prompts)",
      "Palabras por leer (texto, instrucciones, preguntas)",
    ),
  ],
  [
    "added",
    "counts",
    pair("Items added by the customizer", "Elementos agregados por el personalizador"),
  ],
];

/**
 * A table to compare versions side by side. `sameObjective` and `sameAnswerKeys` are computed with assertRigor
 * against the first column (the original).
 * @returns {{ columns: {id, title, tier, label}[], rows: {key, group, label, values: any[]}[], sameObjective: boolean, sameAnswerKeys: boolean }}
 */
export function compareVersions(activities) {
  const list = activities || [];
  const [first] = list;
  const rigor = list.map((a) => assertRigor(first, a));
  const sameObjective = rigor.every((r) => !r.problems.some((p) => p.code === "objective"));
  const sameAnswerKeys = rigor.every((r) => !r.problems.some((p) => KEY_CODES.has(p.code)));
  const m = list.map(measures);
  const rows = ROWS.map(([key, group, label]) => ({
    key,
    group,
    label,
    values: m.map((x) => x[key]),
  }));
  rows.push(
    {
      key: "sameObjective",
      group: "rigor",
      label: pair("Same objective as the first column", "Mismo objetivo que la primera columna"),
      values: rigor.map((r) => !r.problems.some((p) => p.code === "objective")),
    },
    {
      key: "sameAnswerKeys",
      group: "rigor",
      label: pair(
        "Same answer keys as the first column",
        "Mismas claves de respuestas que la primera columna",
      ),
      values: rigor.map((r) => !r.problems.some((p) => KEY_CODES.has(p.code))),
    },
  );
  return {
    columns: list.map((a) => ({
      id: a.id,
      title: a.title,
      tier: a.lineage?.tier || "",
      label: TIER_LABELS[a.lineage?.tier || ""],
    })),
    rows,
    sameObjective,
    sameAnswerKeys,
  };
}
