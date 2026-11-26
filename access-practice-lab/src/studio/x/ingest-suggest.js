// What the extracted structure supports: each suggestion names the existing kind, template (and transform) it would use.

import { pair } from "../core/differentiate-util.js";

// ── suggestions ─────────────────────────────────────────────────────────────

const SUGGEST = {
  choice: [
    "check",
    "skill-check",
    pair(
      "Turn the multiple-choice questions into a quick check",
      "Convertir las preguntas de opción múltiple en una revisión rápida",
    ),
  ],
  number: [
    "worksheet",
    "guided",
    pair(
      "Turn the number problems into a practice worksheet",
      "Convertir los problemas con números en una hoja de práctica",
    ),
  ],
  blank: [
    "worksheet",
    "guided",
    pair(
      "Turn the fill-in-the-blank items into practice",
      "Convertir los espacios en blanco en práctica",
    ),
  ],
  short: [
    "worksheet",
    "reading-writing",
    pair(
      "Turn the written-response prompts into a writing worksheet",
      "Convertir las preguntas de respuesta escrita en una hoja de escritura",
    ),
  ],
};

export function suggestions(items) {
  const out = [];
  const add = (id, kind, template, label, uses, extra = {}) =>
    out.push({
      id,
      kind,
      template,
      label,
      uses: uses.map((i) => i.id),
      count: uses.length,
      ready: true,
      ...extra,
    });
  const qs = items.filter((i) => i.type === "question");
  const passage = items.find((i) => i.type === "passage");
  for (const format of ["choice", "number", "blank", "short"]) {
    const of = qs.filter((q) => q.format === format);
    const usable = format === "choice" ? of.filter((q) => q.answer) : of;
    if (!of.length) continue;
    const [kind, template, label] = SUGGEST[format];
    const hold = of.length - usable.length;
    const k =
      format === "number" && usable.length < 3 ? ["check", "skill-check"] : [kind, template];
    add(`questions-${format}`, k[0], k[1], label, usable, {
      format,
      ready: usable.length > 0,
      ...(hold && {
        note: pair(
          `${hold} question(s) without an answer will be left out until you mark them.`,
          `${hold} pregunta(s) sin respuesta se dejarán fuera hasta que las marques.`,
        ),
      }),
    });
  }
  const pairs = items.filter((i) => i.type === "pairs" && i.confidence === "high");
  if (pairs.length)
    add(
      "match-pairs",
      "interactive",
      "match-sort",
      pair(
        "Turn the matching pairs into a match question",
        "Convertir las parejas en una pregunta de emparejar",
      ),
      pairs,
      { format: "match" },
    );
  const seq = items.filter((i) => i.type === "sequence");
  if (seq.length)
    add(
      "order-steps",
      "interactive",
      "match-sort",
      pair(
        "Turn the steps into an ordering question",
        "Convertir los pasos en una pregunta de ordenar",
      ),
      seq,
      { format: "order" },
    );
  const cats = items.filter((i) => i.type === "categories");
  if (cats.length)
    add(
      "sort-groups",
      "interactive",
      "match-sort",
      pair(
        "Turn the groups into a sorting question",
        "Convertir los grupos en una pregunta de clasificar",
      ),
      cats,
      { format: "sort" },
    );
  const vocab = items.filter((i) => i.type === "vocab");
  if (vocab.length)
    add(
      "vocab",
      "interactive",
      "match-sort",
      pair(
        "Make a word list and word practice from the vocabulary",
        "Crear una lista de palabras y práctica de vocabulario",
      ),
      vocab,
      {
        format: "match",
        transform: "vocabPractice",
        ready: vocab.flatMap((v) => v.items).length >= 2,
      },
    );
  if (passage)
    add(
      "reading",
      "interactive",
      "interactive-reading",
      pair(
        "Make interactive reading from the passage and its questions",
        "Crear lectura interactiva con el texto y sus preguntas",
      ),
      [passage, ...qs.filter((q) => (q.format === "choice" ? q.answer : q.format === "short"))],
      {
        format: qs.some((q) => q.format === "choice") ? "choice" : "short",
      },
    );
  if (passage) {
    add(
      "writing-task",
      "worksheet",
      "reading-writing",
      pair("Make a writing task from the passage", "Crear una tarea de escritura con el texto"),
      [passage],
      { transform: "writingTask" },
    );
    add(
      "speaking-task",
      "interactive",
      "interactive-reading",
      pair(
        "Make a speaking task from the passage",
        "Crear una tarea de expresión oral con el texto",
      ),
      [passage],
      { transform: "speakingTask" },
    );
  }
  return out;
}

