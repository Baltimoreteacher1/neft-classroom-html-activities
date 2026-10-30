// Word cards and partner talk, built from the vocabulary every activity already carries
// ([term, English meaning, Spanish gloss]). The learner rates each card "I know it" or "Not yet";
// review follows the lab's 1 → 3 → 7 → 14 day ladder. Nothing is scored, timed or compared.
import { REVIEW_INTERVALS_DAYS } from "./ledger.js";

const norm = (t) => String(t).trim().toLowerCase();

/** Unique cards (by term) for one level, optionally limited to one strand. Order follows the level. */
export function buildDeck(levelData, categoryId = "") {
  const byId = new Map((levelData?.activities || []).map((a) => [a.id, a]));
  const ids = categoryId ? (levelData?.categories || []).find((c) => c.id === categoryId)?.activityIds || [] : [...byId.keys()];
  const seen = new Set();
  const cards = [];
  for (const id of ids) {
    for (const row of byId.get(id)?.vocabulary || []) {
      const [term, def, es] = Array.isArray(row) ? row : [];
      if (!term || !def || seen.has(norm(term))) continue;
      seen.add(norm(term));
      cards.push({ term: String(term), def: String(def), es: String(es || ""), activityId: id });
    }
  }
  return cards;
}

/** A card after the learner's answer. A miss returns tomorrow; each "I know it" moves one step up the ladder. */
export function rate(entry, knew, today) {
  const box = knew ? Math.min((entry?.box ?? -1) + 1, REVIEW_INTERVALS_DAYS.length - 1) : 0;
  return { box, due: today + REVIEW_INTERVALS_DAYS[box], seen: (entry?.seen || 0) + 1 };
}

/** The next card to show: due cards first, then new ones in deck order. `waiting` = days until the next one is due. */
export function nextCard(cards, state = {}, today = 0) {
  const known = cards.filter((c) => state[norm(c.term)]);
  const due = known.filter((c) => state[norm(c.term)].due <= today).sort((a, b) => state[norm(a.term)].due - state[norm(b.term)].due);
  if (due.length) return { card: due[0], reason: "due", waiting: 0 };
  const fresh = cards.find((c) => !state[norm(c.term)]);
  if (fresh) return { card: fresh, reason: "new", waiting: 0 };
  const soonest = known.map((c) => state[norm(c.term)].due).sort((a, b) => a - b)[0];
  return { card: null, reason: "caught-up", waiting: soonest == null ? 0 : Math.max(1, soonest - today) };
}

const TEMPLATES = [
  {
    a: { en: "Say the word “{w}” and explain it to your partner in your own words.", es: "Di la palabra “{w}” y explícasela a tu compañero con tus propias palabras." },
    b: { en: "Listen. Then use “{w}” in a sentence about school, your family or a place you know.", es: "Escucha. Luego usa “{w}” en una oración sobre la escuela, tu familia o un lugar que conoces." },
  },
  {
    a: { en: "Give an example of “{w}”.", es: "Da un ejemplo de “{w}”." },
    b: { en: "Give a non-example and say why it is not an example.", es: "Da algo que no sea un ejemplo y di por qué no lo es." },
  },
  {
    a: { en: "Say what “{w}” means in the language you know best. Then say it in English.", es: "Di qué significa “{w}” en el idioma que mejor conoces. Luego dilo en inglés." },
    b: { en: "Say “{w}” back slowly. Ask one question that uses the word.", es: "Repite “{w}” despacio. Haz una pregunta que use la palabra." },
  },
  {
    a: { en: "Say one sentence with “{w}” and leave the word out. Say “blank” instead.", es: "Di una oración con “{w}” y deja la palabra fuera. Di “blank” en su lugar." },
    b: { en: "Guess the missing word. Then say the whole sentence.", es: "Adivina la palabra que falta. Luego di la oración completa." },
  },
  {
    a: { en: "Tell your partner two things you know about “{w}”.", es: "Dile a tu compañero dos cosas que sabes sobre “{w}”." },
    b: { en: "Add one more detail. Start with “Also, …” or “For example, …”.", es: "Agrega un detalle más. Empieza con “Also, …” o “For example, …”." },
  },
  {
    a: { en: "Use “{w}” to explain something you did this week.", es: "Usa “{w}” para explicar algo que hiciste esta semana." },
    b: { en: "Ask “Why?” or “What happened next?” and listen to the answer.", es: "Pregunta “Why?” o “What happened next?” y escucha la respuesta." },
  },
];
const fill = (t, w) => ({ en: t.en.replaceAll("{w}", w), es: t.es.replaceAll("{w}", w) });

/** Partner prompts for a deck: one per word, templates rotating. Partners swap roles every other prompt. */
export function pairTalk(cards, { count = 6, offset = 0 } = {}) {
  if (!cards.length) return [];
  return Array.from({ length: Math.min(count, cards.length) }, (_, i) => {
    const card = cards[(offset + i) % cards.length];
    const t = TEMPLATES[(offset + i) % TEMPLATES.length];
    return { word: card.term, speaker: fill(t.a, card.term), listener: fill(t.b, card.term), swap: (offset + i) % 2 === 1 };
  });
}
