// "reorder" variants: choices, pairs, sort items and questions are put in a seeded order. Every answer is stored by
// id, so no key changes; anything whose meaning depends on position (an ordered list, "all of the above", "see
// question 3", a game's difficulty path) is left alone and listed in `skipped`.

import { hashSeed, makeRng } from "../core/mathgen/kit.js";
import { T } from "./inspect-text.js";

/** Choices that point at other choices or at their own place in the list. */
const POSITIONAL =
  /\b(?:all|none|both|neither|any)\s+of\s+(?:the\s+)?(?:above|these|them)\b|\b[A-E]\s*(?:and|&|or)\s*[A-E]\b|\b(?:option|choice)s?\s+[A-E]\b|\bboth\s+[A-E]\b/i;
/** Wording that depends on where a question sits. */
const REFERS =
  /\b(?:question|problem|item|number|#)\s*\d+|\b(?:previous|preceding|above|earlier|last|next|following)\s+(?:question|problem|answer|item)\b|\byour (?:answer|work) (?:from|to)\b/i;

const LISTS = {
  choice: "options",
  multi: "options",
  error: "fixOptions",
  match: "pairs",
  sort: "items",
};

/** A seeded order of `list` that differs from the given one whenever it can. */
function shuffled(list, rng) {
  if (list.length < 2) return list;
  const out = rng.shuffle(list);
  return out.every((x, i) => x === list[i]) ? [...out.slice(1), out[0]] : out;
}

/** @returns {{blocks: object[], changes: object[], skipped: object[], review: object[]}} */
export function reorderVariant(a, seed) {
  const changes = [];
  const skipped = [];
  const review = [];
  let moved = false;
  const change = (blockId, en, es) =>
    changes.push({ blockId, mode: "reorder", message: T(en, es) });

  let blocks = a.blocks.map((q) => {
    const key = LISTS[q.format];
    if (q.type !== "question" || !key) return q;
    if (q.format === "choice" || q.format === "multi" || q.format === "error") {
      const list = q[key];
      if (list.some((o) => POSITIONAL.test(o.text))) {
        skipped.push({
          blockId: q.id,
          reason: T(
            "A choice refers to other choices or to its place in the list, so the choices were not reordered.",
            "Una opción se refiere a otras opciones o a su lugar en la lista, así que no se reordenaron las opciones.",
          ),
        });
        return q;
      }
    }
    const next = shuffled(q[key], makeRng(hashSeed(seed, q.id, key)));
    if (next.every((x, i) => x === q[key][i])) return q;
    change(
      q.id,
      "The choices were put in a different order. Each answer still points to the same item.",
      "Se cambió el orden de los elementos. Cada respuesta sigue apuntando al mismo elemento.",
    );
    return { ...q, [key]: next };
  });

  if (a.kind === "game") {
    skipped.push({
      blockId: "",
      reason: T(
        "In a game the order of the questions is its difficulty path, so the questions were not reordered.",
        "En un juego el orden de las preguntas es su camino de dificultad, así que no se reordenaron las preguntas.",
      ),
    });
  } else {
    // Questions move only inside a run of consecutive questions, so each one stays after the passage or picture it follows.
    const out = [];
    for (let i = 0; i < blocks.length; ) {
      if (blocks[i].type !== "question") {
        out.push(blocks[i++]);
        continue;
      }
      let j = i;
      while (j < blocks.length && blocks[j].type === "question") j++;
      const run = blocks.slice(i, j);
      const refers = run.some((q) => REFERS.test(`${q.prompt} ${q.hint} ${q.explanation}`));
      if (run.length < 2) out.push(...run);
      else if (refers) {
        skipped.push({
          blockId: run[0].id,
          reason: T(
            "A question mentions another question or 'above/next', so this group of questions was not reordered.",
            "Una pregunta menciona otra pregunta o «arriba/siguiente», así que este grupo de preguntas no se reordenó.",
          ),
        });
        out.push(...run);
      } else {
        const next = shuffled(run, makeRng(hashSeed(seed, run[0].id, "run")));
        if (next.some((q, k) => q !== run[k])) {
          moved = true;
          change(
            run[0].id,
            `${run.length} questions were put in a different order.`,
            `Se cambió el orden de ${run.length} preguntas.`,
          );
        }
        out.push(...next);
      }
      i = j;
    }
    blocks = out;
  }

  if (moved)
    review.push({
      message: T(
        "Questions were reordered. If the set goes from easier to harder, check that it still does.",
        "Se reordenaron las preguntas. Si el conjunto va de lo más fácil a lo más difícil, revise que siga así.",
      ),
    });
  const typed = JSON.stringify([a.notes, a.blocks.filter((b) => b.type === "note")]);
  if (changes.length && REFERS.test(typed))
    review.push({
      message: T(
        "A teacher note mentions question numbers; check it against the new order.",
        "Una nota para el maestro menciona números de preguntas; revísela con el nuevo orden.",
      ),
    });
  return { blocks, changes, skipped, review };
}
