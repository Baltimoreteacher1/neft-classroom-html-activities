// Task length: shorten and extend-practice. Length changes the amount of practice only. It never changes a kept
// question, the objective or any answer key, and it never invents content: new items come only from the verified
// math generators (core/mathgen.js, each re-checked here) or from the activity's own vocabulary list.

import { dupKey, safeQuestion } from "./differentiate-safe.js";
import {
  freshId,
  insertAfterQuestions,
  pair,
  plural,
  stableNumber,
  takenIds,
  vocabItems,
  withAdded,
} from "./differentiate-util.js";
import { questionPool } from "./generate.js";
import { MATH_TOPICS, generateMath } from "./mathgen.js";
import { questionsOf } from "./schema.js";

const MATH_IDS = new Set(MATH_TOPICS.map((t) => t.id));
const MIN_QUESTIONS = { game: 3, interactive: 1, worksheet: 1, check: 1 };
export const skillOf = (q) => q.skill.trim().toLowerCase() || `format:${q.format}`;

/** Remove about a third of the questions, keeping at least one for every skill. Mutates the working copy `a`. */
export function shorten(a) {
  const qs = questionsOf(a);
  const required = new Set();
  const seen = new Set();
  for (const q of qs) {
    if (seen.has(skillOf(q))) continue;
    seen.add(skillOf(q));
    required.add(q.id);
  }
  const target = Math.max(required.size, MIN_QUESTIONS[a.kind], Math.ceil((qs.length * 2) / 3));
  const removable = qs.filter((q) => !required.has(q.id));
  const drop = Math.min(qs.length - target, removable.length);
  if (drop <= 0)
    return {
      changes: [],
      warnings: [
        pair(
          "Nothing was removed: every question practices a different skill, or the activity is already as short as it can be.",
          "No se quitó nada: cada pregunta practica una destreza distinta, o la actividad ya es tan corta como puede ser.",
        ),
      ],
    };
  // Spread the removals across the activity so no part of it is emptied.
  const out = new Set(
    Array.from(
      { length: drop },
      (_, k) => removable[Math.floor(((k + 0.5) * removable.length) / drop)].id,
    ),
  );
  a.blocks = a.blocks.filter((b) => !out.has(b.id));
  return {
    changes: [
      pair(
        `Shortened the activity from ${qs.length} to ${qs.length - drop} questions. At least one question stays for every skill, and the objective did not change.`,
        `Se acortó la actividad de ${qs.length} a ${qs.length - drop} preguntas. Queda al menos una pregunta de cada destreza y el objetivo no cambió.`,
      ),
    ],
    warnings: [],
  };
}

function mathAdditions(a, seen) {
  const counts = new Map();
  for (const q of questionsOf(a))
    if (MATH_IDS.has(q.skill)) counts.set(q.skill, (counts.get(q.skill) || 0) + 1);
  const out = [];
  for (const [topic, n] of counts) {
    const want = Math.min(4, Math.max(1, Math.ceil(n / 2)));
    const raw = generateMath({
      topic,
      grade: Number(a.context.grade),
      count: want * 3,
      seed: stableNumber(a.id, topic),
      level: 2,
    });
    let added = 0;
    for (const item of raw) {
      const q = safeQuestion(item);
      if (!q || seen.has(dupKey(q)) || added >= want) continue;
      seen.add(dupKey(q));
      out.push(q);
      added += 1;
    }
  }
  return out;
}

const isVocabPractice = (q, terms) =>
  /vocab/i.test(q.skill) ||
  (q.format === "match" &&
    q.pairs.length > 0 &&
    q.pairs.every((p) => terms.has(p.left.toLowerCase())));

function vocabAdditions(a, seen) {
  const items = vocabItems(a);
  const terms = new Set(items.map((v) => v.term.toLowerCase()));
  if (items.length < 2 || !questionsOf(a).some((q) => isVocabPractice(q, terms))) return [];
  const parsed = {
    vocab: items.map(({ term, def, es, example }) => ({ term, def, es, example })),
    questions: [],
    problems: [],
    categories: [],
    sequence: [],
    passage: "",
  };
  const out = [];
  for (const raw of questionPool(parsed, null)) {
    if (raw.format !== "choice" && raw.format !== "blank") continue;
    const q = safeQuestion({ ...raw, id: `ext-v${out.length + 1}` });
    if (!q || seen.has(dupKey(q)) || out.length >= 6) continue;
    seen.add(dupKey(q));
    out.push(q);
  }
  return out;
}

/**
 * Add practice of skills the activity already practices, only where that is verifiably safe. Mutates `a`.
 * @returns {{ changes: object[], warnings: object[] }}
 */
export function extendPractice(a) {
  const seen = new Set(questionsOf(a).map(dupKey));
  const math = mathAdditions(a, seen);
  const vocab = vocabAdditions(a, seen);
  const all = [...math, ...vocab];
  if (!all.length)
    return {
      changes: [],
      warnings: [
        pair(
          "No new practice was added. The studio can only add practice it can prove is correct: more math problems on a topic the activity already practices, or vocabulary questions built from its own word list. This activity has neither, and nothing was invented.",
          "No se agregó práctica nueva. El estudio solo agrega práctica que puede comprobar: más problemas de matemáticas de un tema que la actividad ya practica, o preguntas de vocabulario hechas con su propia lista de palabras. Esta actividad no tiene ninguna de las dos, y no se inventó nada.",
        ),
      ],
    };
  const taken = takenIds(a);
  for (const q of all) {
    q.id = freshId(q.id, taken);
  }
  insertAfterQuestions(a, all);
  withAdded(
    a,
    all.map((q) => q.id),
  );
  const changes = [];
  if (math.length)
    changes.push(
      plural(
        math.length,
        [
          "Added {n} math problem on a topic you already practice. Each answer was computed and checked.",
          "Added {n} math problems on topics you already practice. Each answer was computed and checked.",
        ],
        [
          "Se agregó {n} problema de matemáticas de un tema que ya practican. Cada respuesta se calculó y se comprobó.",
          "Se agregaron {n} problemas de matemáticas de temas que ya practican. Cada respuesta se calculó y se comprobó.",
        ],
      ),
    );
  if (vocab.length)
    changes.push(
      plural(
        vocab.length,
        [
          "Added {n} vocabulary question built only from your word list.",
          "Added {n} vocabulary questions built only from your word list.",
        ],
        [
          "Se agregó {n} pregunta de vocabulario hecha solo con tu lista de palabras.",
          "Se agregaron {n} preguntas de vocabulario hechas solo con tu lista de palabras.",
        ],
      ),
    );
  return { changes, warnings: [] };
}
