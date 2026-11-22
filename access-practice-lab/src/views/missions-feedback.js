// Mission feedback: the words a learner reads after "Check my answer" / "Check my evidence". Pure (no DOM, no storage) so
// the rules are testable in node. Feedback names the learner's own choice, says what to look at, and after two misses on
// an evidence task shows the supporting statements instead of leaving the learner to guess. Nothing here is a score.

// Coaching after a first miss, keyed by the distractor type authored on each wrong option: [English, Español].
export const COACH = {
  unsupported: [
    "That idea is not stated in the source. Find the sentence that supports an answer.",
    "Esa idea no aparece en la fuente. Busca la oración que apoya una respuesta.",
  ],
  opposite: [
    "That is the opposite of what the source says. Reread for the direction of the change.",
    "Eso es lo contrario de lo que dice la fuente. Vuelve a leer para ver en qué dirección cambia.",
  ],
  "true-not-asked": [
    "That might be true, but it does not answer this question. Check the question word again.",
    "Eso podría ser cierto, pero no responde esta pregunta. Revisa otra vez la palabra de la pregunta.",
  ],
  overgeneralized: [
    "That goes further than the source. Watch for words like all, always, never.",
    "Eso va más allá de la fuente. Ten cuidado con palabras como todo, siempre, nunca.",
  ],
  "detail-trap": [
    "That detail is in the source, but it is not what the question asks about.",
    "Ese detalle está en la fuente, pero no es sobre lo que se pregunta.",
  ],
  partial: [
    "That is only part of the answer. What else does the source say?",
    "Eso es solo una parte de la respuesta. ¿Qué más dice la fuente?",
  ],
};

/** Evidence tasks reveal their supporting statements after this many checks (two retries). */
export const EVIDENCE_REVEAL_AT = 3;

const quote = (t) => `“${t}”`;
const plural = (n, one, many) => (n === 1 ? one : many);

/**
 * What to show after a multiple-choice check. `tries` already counts this check.
 * @returns {{ ok: boolean, done: boolean, msg: string }}
 */
export function questionFeedback(task, pickId, tries, I) {
  const ok = pickId === task.answer;
  const picked = task.options.find((o) => o.id === pickId);
  if (ok) return { ok, done: true, msg: task.explain };
  if (tries >= 2) {
    const right = task.options.find((o) => o.id === task.answer).text;
    return {
      ok,
      done: true,
      msg: I.S(
        `The answer is ${quote(right)}. ${task.explain}`,
        `La respuesta es ${quote(right)}. ${task.explain}`,
      ),
    };
  }
  const coach = COACH[picked?.distractor];
  const you = picked
    ? I.S(`You chose ${quote(picked.text)}. `, `Elegiste ${quote(picked.text)}. `)
    : "";
  return {
    ok,
    done: false,
    msg:
      you +
      (coach
        ? I.S(...coach)
        : I.S(
            "That does not match the source. Reread it and look for the sentence that answers the question.",
            "Eso no coincide con la fuente. Vuelve a leerla y busca la oración que responde la pregunta.",
          )),
  };
}

/**
 * What to show after an evidence check. Names the chosen statements that do not support the idea (never the ones the
 * learner left out), says how many are still missing, and reveals the supporting statements after EVIDENCE_REVEAL_AT.
 * @returns {{ ok: boolean, done: boolean, revealed: boolean, msg: string }}
 */
export function evidenceFeedback(task, picks, tries, I) {
  const want = task.pool.filter((x) => x.supports);
  const got = new Set(picks || []);
  const wrong = task.pool.filter((x) => got.has(x.id) && !x.supports);
  const missed = want.filter((x) => !got.has(x.id));
  const why = task.explain ? ` ${task.explain}` : "";
  const onBoard = I.S(
    "They are on your evidence board.",
    "Están en tu tablero de evidencia.",
  );
  if (!wrong.length && !missed.length)
    return {
      ok: true,
      done: true,
      revealed: false,
      msg: `${I.S("Those statements support the idea.", "Esas afirmaciones apoyan la idea.")}${why} ${onBoard}`,
    };
  if (tries >= EVIDENCE_REVEAL_AT)
    return {
      ok: false,
      done: true,
      revealed: true,
      msg: I.S(
        `These statements support the idea: ${want.map((x) => quote(x.text)).join("; ")}.${why} They are on your evidence board.`,
        `Estas afirmaciones apoyan la idea: ${want.map((x) => quote(x.text)).join("; ")}.${why} Están en tu tablero de evidencia.`,
      ),
    };
  const parts = [];
  if (wrong.length) {
    const first = quote(wrong[0].text);
    const more = wrong.length - 1;
    parts.push(
      I.S(
        `Look again at ${first}${more ? ` and ${more} more` : ""}: ${plural(wrong.length, "it does", "they do")} not answer the question.`,
        `Mira otra vez ${first}${more ? ` y ${more} más` : ""}: no ${plural(wrong.length, "responde", "responden")} la pregunta.`,
      ),
    );
  }
  if (missed.length)
    parts.push(
      I.S(
        `You are missing ${missed.length} supporting ${plural(missed.length, "statement", "statements")}. Reread the source for details that answer the question.`,
        `Te ${plural(missed.length, "falta 1 afirmación", `faltan ${missed.length} afirmaciones`)} de apoyo. Vuelve a leer la fuente para encontrar detalles que respondan la pregunta.`,
      ),
    );
  if (tries === EVIDENCE_REVEAL_AT - 1)
    parts.push(
      I.S(
        "Check once more. If you are still unsure, the supporting statements will be shown.",
        "Comprueba una vez más. Si aún tienes dudas, se mostrarán las afirmaciones de apoyo.",
      ),
    );
  return { ok: false, done: false, revealed: false, msg: parts.join(" ") };
}
