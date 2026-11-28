// Paragraph X-Ray: the pure logic. Lenses peel a paragraph into layers (topic, detail + evidence, explanation,
// conclusion, links); the skeleton is the job order of a model paragraph; "rebuild" fills that skeleton from a
// bank of sentences that includes one that does not belong. No DOM, no storage.
import { JOBS, connectorsIn } from "../lang/labs-check.js";

/** Lens order for the control. `jobs` are the layers a lens lights; "links" lights connectors and pointing words. */
export const LENSES = [
  { id: "plain", name: ["Plain", "Sencillo"], jobs: [] },
  {
    id: "all",
    name: ["All layers", "Todas las capas"],
    jobs: ["topic", "detail", "explain", "conclude"],
  },
  { id: "topic", name: ["Topic", "Idea principal"], jobs: ["topic"] },
  { id: "detail", name: ["Details + evidence", "Detalles + evidencia"], jobs: ["detail"] },
  { id: "explain", name: ["Explanation", "Explicación"], jobs: ["explain"] },
  { id: "conclude", name: ["Conclusion", "Conclusión"], jobs: ["conclude"] },
  { id: "links", name: ["Links", "Enlaces"], jobs: [] },
];
export const lensIds = LENSES.map((l) => l.id);

/** How one sentence looks under a lens: "lit" (full color), "dim" (faded), or "plain" (no layer color). */
export function lensState(lens, job) {
  if (lens === "plain") return "plain";
  if (lens === "all" || lens === "links") return "lit";
  const l = LENSES.find((x) => x.id === lens);
  return l?.jobs.includes(job) ? "lit" : "dim";
}

/** Short layer name ("Topic sentence") without the explanation after the colon. */
export const jobName = (job, i = 0) => JOBS[job][i].split(":")[0];
export const jobGist = (job, i = 0) => JOBS[job][i].split(": ")[1] || "";

/** The skeleton of a model paragraph: one slot per sentence with its job and a position label. */
export function skeleton(sentences) {
  let d = 0;
  const total = sentences.filter((s) => s.job === "detail").length;
  return sentences.map((s, i) => {
    const n = s.job === "detail" ? ++d : 0;
    return { pos: i, job: s.job, n, of: total };
  });
}

export const slotLabel = (slot, S) =>
  slot.job === "detail" && slot.of > 1
    ? S(`Detail ${slot.n}`, `Detalle ${slot.n}`)
    : S(jobName(slot.job, 0), jobName(slot.job, 1));

/** Move the item at `from` to `to` (a copy). Out-of-range moves return the list unchanged. */
export function moveItem(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length)
    return [...list];
  const next = [...list];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}

/** Index of the slot nearest a vertical pointer position, given each slot's [top, bottom] in the same space. */
export function slotAt(y, rects) {
  let best = 0;
  let dist = Infinity;
  rects.forEach(([top, bottom], i) => {
    const d = Math.abs(y - (top + bottom) / 2);
    if (d < dist) {
      dist = d;
      best = i;
    }
  });
  return best;
}

// ── rebuild the paragraph ────────────────────────────────────────────────────
/** One sentence per band that does not belong to the paragraph. It sits in the bank next to the real ones. */
export const DISTRACTOR = {
  "3-5": {
    text: "My cousin has a bright red bicycle.",
    why: {
      en: "This sentence is about a different topic (a bicycle), so it has no job in a paragraph about rainy days.",
      es: "Esta oración trata de otro tema (una bicicleta), así que no tiene función en un párrafo sobre los días de lluvia.",
    },
  },
  "6-8": {
    text: "The cafeteria also serves pizza on Fridays.",
    why: {
      en: "This sentence is about lunch, not start times, so it does not support the claim and has no job here.",
      es: "Esta oración trata del almuerzo, no de la hora de entrada, así que no apoya la afirmación y no tiene función aquí.",
    },
  },
};

/** The bank of cards: indexes 0..n-1 are the real sentences, n is the distractor. A fixed shuffle, the same every visit. */
export function rebuildBank(n) {
  const order = [...Array(n + 1).keys()];
  const fixed = [3, n, 1, 4, 0, 2];
  return fixed.length === order.length ? fixed : order.reverse();
}

/** Check slots[i] (a card index or null) against the paragraph. Cards with index >= n are the distractor. */
export function checkRebuild(item, slots) {
  const results = item.sentences.map((s, i) => {
    const given = slots[i];
    const ok = given === i;
    const distractor = Number.isInteger(given) && given >= item.sentences.length;
    return { i, ok, given, empty: given == null, distractor, clue: s.orderClue || s.clue };
  });
  const full = slots.every((x) => x != null);
  return { ok: results.every((r) => r.ok), full, results };
}

/** Place a card in a slot; a card already in another slot moves, and a card in the target slot goes back to the bank. */
export function place(slots, card, slot) {
  const next = slots.map((x) => (x === card ? null : x));
  next[slot] = card;
  return next;
}
export const unplace = (slots, slot) => slots.map((x, i) => (i === slot ? null : x));

/** Pointing words and connectors found in a sentence, for the Links lens. */
export const linksIn = (text) => connectorsIn(text).map((c) => c.word);

/** Which layers a learner's checked paragraph shows (from K.checkParagraph's result). */
export const layersShown = (r) => ({
  topic: r.topic,
  details: r.conns.length > 0,
  conclusion: r.conclusion,
  enough: r.count >= 4,
});
