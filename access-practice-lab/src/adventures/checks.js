// Adventure Worlds checks (src/adventures/): pure, rule-based, no DOM, Node-testable. Every message names what the
// learner did and one next move. The feedback ladder never states an answer on the first two tries (clue → rule →
// model), the same ladder the rest of the lab uses. Schema: ADVENTURE-SCHEMA.md (scene kinds clues/choice/order/respond).
import { CONNECTORS } from "../lang/lexicon.js";
import { isStop, stem, tokenize } from "../lang/text.js";

const norm = (s) =>
  ` ${String(s || "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;

/** Connector words by job: the shared lexicon plus the everyday words grade 3-5 writers use for the same job. */
export const CONNECTOR_WORDS = Object.freeze({
  ...CONNECTORS,
  cause: [...CONNECTORS.cause, "so", "that is why", "which means", "that means", "caused"],
  sequence: [...CONNECTORS.sequence, "after", "when", "at first"],
  stance: [...CONNECTORS.stance, "we recommend", "we propose", "we suggest", "i suggest"],
  evidence: [
    ...CONNECTORS.evidence,
    "shows",
    "showed",
    "proves",
    "the clue",
    "the data",
    "i noticed",
    "we found",
  ],
});
export const CONNECTOR_JOB_NAMES = {
  cause: ["cause or result", "causa o resultado"],
  contrast: ["contrast", "contraste"],
  sequence: ["time order", "orden en el tiempo"],
  addition: ["adding on", "agregar información"],
  example: ["example", "ejemplo"],
  evidence: ["evidence", "evidencia"],
  stance: ["opinion or claim", "opinión o afirmación"],
  concession: ["the other side", "el otro lado"],
  conclusion: ["conclusion", "conclusión"],
};

export const countWords = (text) => tokenize(text).length;

/** Connector words of one job that appear in a text (whole words, longest first). */
export function connectorsOfJob(text, job) {
  const t = norm(text);
  return (CONNECTOR_WORDS[job] || []).filter((w) => t.includes(` ${w} `));
}

const stemsOf = (text) =>
  new Set(
    tokenize(text)
      .map((t) => t.lower)
      .filter((w) => /\d/.test(w) || (!isStop(w) && w.length > 2))
      .map(stem),
  );

// Words too common in these worlds to show that a learner used a particular clue.
const GENERIC = new Set(
  "museum gallery clue clues island scientist scientists said says saw seen note notes look looked thing things there people person day time".split(
    " ",
  ),
);

/** The words that show a learner is using a clue: its own `keys` when authored, else its distinctive content words. */
export function clueKeywords(clue) {
  if (Array.isArray(clue?.keys) && clue.keys.length)
    return [...new Set(clue.keys.map((k) => stem(String(k).toLowerCase())))];
  const words = tokenize(clue?.text?.en || "")
    .map((t) => t.lower)
    .filter((w) => /\d/.test(w) || (!isStop(w) && w.length >= 4 && !GENERIC.has(w)));
  return [...new Set(words.map(stem))];
}

/** Does the learner's text use this clue? Two of its key words (or its only key word). */
export function mentionsClue(text, clue) {
  const keys = clueKeywords(clue);
  if (!keys.length) return false;
  const have = stemsOf(text);
  const hits = keys.filter((k) => have.has(k)).length;
  return hits >= Math.min(2, keys.length);
}

const has = (text, word) => {
  const t = norm(text);
  const w = norm(word).trim();
  if (t.includes(` ${w} `)) return true;
  // One-word targets also match their inflections (evidence → evidenced is fine, observe → observed).
  if (!w.includes(" ")) {
    const loose = (x) => stem(x).replace(/e$/, "");
    return [...stemsOf(text)].some((x) => x.replace(/e$/, "") === loose(w));
  }
  return false;
};

/**
 * A respond check. `check`: { minWords, needConnectors, needWords, needAny, evidenceFrom } (all optional).
 * `clues`: the relevant clues this learner collected (for evidenceFrom). Returns
 * { ok, words, items: [{ id, ok, label: {en, es} }], usedClues: [clue ids], next: {en, es} | null }.
 */
export function checkRespond(text, check = {}, clues = []) {
  const words = countWords(text);
  const items = [];
  if (check.minWords)
    items.push({
      id: "words",
      ok: words >= check.minWords,
      label: {
        en: `At least ${check.minWords} words (you have ${words})`,
        es: `Al menos ${check.minWords} palabras (tienes ${words})`,
      },
      next: {
        en: `Add more: say what you noticed and why it matters. You need at least ${check.minWords} words.`,
        es: `Agrega más: di lo que notaste y por qué importa. Necesitas al menos ${check.minWords} palabras.`,
      },
    });
  for (const job of check.needConnectors || []) {
    const found = connectorsOfJob(text, job);
    const [en, es] = CONNECTOR_JOB_NAMES[job] || [job, job];
    const examples = (CONNECTOR_WORDS[job] || []).slice(0, 2).join(", ");
    items.push({
      id: `conn:${job}`,
      ok: found.length > 0,
      label: {
        en: `A ${en} word${found.length ? `: ${found.join(", ")}` : ""}`,
        es: `Una palabra de ${es}${found.length ? `: ${found.join(", ")}` : ""}`,
      },
      next: {
        en: `Join two ideas with a ${en} word, such as ${examples}.`,
        es: `Une dos ideas con una palabra de ${es}, como ${examples}.`,
      },
    });
  }
  for (const w of check.needWords || [])
    items.push({
      id: `word:${w}`,
      ok: has(text, w),
      label: { en: `Use the word “${w}”`, es: `Usa la palabra «${w}»` },
      next: {
        en: `Use the word “${w}” in your answer.`,
        es: `Usa la palabra «${w}» en tu respuesta.`,
      },
    });
  for (const group of check.needAny || [])
    items.push({
      id: `any:${group.join("|")}`,
      ok: group.some((w) => has(text, w)),
      label: { en: `Use one of: ${group.join(", ")}`, es: `Usa una de estas: ${group.join(", ")}` },
      next: {
        en: `Use one of these words: ${group.join(", ")}.`,
        es: `Usa una de estas palabras: ${group.join(", ")}.`,
      },
    });
  const usedClues =
    check.evidenceFrom === "clues"
      ? clues.filter((c) => mentionsClue(text, c)).map((c) => c.id)
      : [];
  if (check.evidenceFrom === "clues")
    items.push({
      id: "evidence",
      ok: usedClues.length > 0,
      label: {
        en: `Name a clue you collected${usedClues.length ? ` (${usedClues.length} used)` : ""}`,
        es: `Nombra una pista que reuniste${usedClues.length ? ` (usaste ${usedClues.length})` : ""}`,
      },
      next: {
        en: "Use your evidence: name one clue from your evidence board in your own words.",
        es: "Usa tu evidencia: nombra con tus palabras una pista de tu tablero de evidencia.",
      },
    });
  const firstMissing = items.find((i) => !i.ok);
  return {
    ok: words > 0 && !firstMissing,
    words,
    items: items.map(({ id, ok, label }) => ({ id, ok, label })),
    usedClues,
    next:
      words === 0
        ? { en: "Write your answer first.", es: "Primero escribe tu respuesta." }
        : firstMissing?.next || null,
  };
}

/** A clue tapped onto the evidence board: relevant clues are kept; others come back with their specific reason. */
export function checkClue(scene, clueId) {
  const clue = scene.clues.find((c) => c.id === clueId);
  if (!clue) return null;
  return { ok: !!clue.relevant, clue, why: clue.why };
}

/** Evidence-board status for a clues scene and the ids a learner has kept. */
export function boardStatus(scene, picked = []) {
  const kept = scene.clues.filter((c) => c.relevant && picked.includes(c.id));
  const need = scene.need ?? 3;
  return { kept: kept.length, need, done: kept.length >= need };
}

/**
 * A choice. `wrongBefore` = wrong picks already made in this scene. A wrong option's own feedback explains; only a
 * third wrong pick reveals which option the evidence supports (never on the first two tries).
 */
export function checkChoice(scene, index, wrongBefore = 0) {
  const opt = scene.options[index];
  if (!opt) return null;
  const correct = scene.options.findIndex((o) => o.correct);
  return {
    ok: !!opt.correct,
    feedback: opt.feedback,
    next: opt.correct && Number.isInteger(opt.next) ? opt.next : null,
    reveal: !opt.correct && wrongBefore >= 2 ? correct : null,
  };
}

/** A deterministic shuffle of n items that is never already in order (same for every visit to the same scene). */
export function shuffledOrder(n, seed = "") {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const o = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    const j = h % (i + 1);
    [o[i], o[j]] = [o[j], o[i]];
  }
  if (n > 1 && o.every((v, i) => v === i)) o.push(o.shift());
  if (n > 2 && o[0] === 0) [o[0], o[1]] = [o[1], o[0]];
  return o;
}

/**
 * An order check. `order` = original item indexes in the learner's current sequence; `tries` = checks before this one.
 * Try 1: how many are in place. Try 2: which position is the first one out of place. Try 3+: the model order.
 */
export function checkOrder(items, order, tries = 0) {
  const inPlace = order.filter((v, i) => v === i).length;
  const ok = inPlace === items.length;
  if (ok)
    return {
      ok,
      inPlace,
      message: { en: "Every step is in order.", es: "Todos los pasos están en orden." },
    };
  const at = order.findIndex((v, i) => v !== i);
  if (tries === 0)
    return {
      ok,
      inPlace,
      message: {
        en: `${inPlace} of ${items.length} are in the right place. Read them in order: does each one need the one before it to happen first?`,
        es: `${inPlace} de ${items.length} están en su lugar. Léelos en orden: ¿cada uno necesita que el anterior pase primero?`,
      },
    };
  if (tries === 1)
    return {
      ok,
      inPlace,
      at,
      message: {
        en: `Look at number ${at + 1}. Something else has to happen before it. Look for time words and causes.`,
        es: `Mira el número ${at + 1}. Otra cosa tiene que pasar antes. Busca palabras de tiempo y causas.`,
      },
    };
  return {
    ok,
    inPlace,
    at,
    model: items.map((it) => it.en),
    message: {
      en: "Here is the order, so you can compare. Move your steps to match it, then check again.",
      es: "Aquí está el orden para que compares. Mueve tus pasos para que coincidan y revisa otra vez.",
    },
  };
}
