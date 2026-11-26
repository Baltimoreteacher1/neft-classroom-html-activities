// "context" variants: swap a registered name, place or object for another from a small original table, everywhere it
// appears in the same activity (so the story stays consistent). Numbers, vocabulary, answers and ids are never
// touched; a token that also appears in a vocabulary block is not swapped at all.

import { hashSeed, makeRng } from "../core/mathgen/kit.js";
import { T, escapeRe, mapStrings, proseOf } from "./inspect-text.js";

/** Interchangeable tokens, grouped so that a swap keeps the grammar of the sentence. */
export const CONTEXT_TABLE = Object.freeze({
  // Grouped by the pronoun the stories around them use, so "Ana ... She" stays "Zoe ... She". A name with no
  // fixed pronoun (`any`) is only swapped in text that has no he/she/his/her at all.
  names: {
    she: ["Mia", "Lena", "Ana", "Zoe", "Nia", "Maya", "Rosa", "Amara", "Tala"],
    he: ["Omar", "Ravi", "Luis", "Leo", "Dev", "Jin", "Eli", "Theo"],
    any: ["Sam", "Kai", "Noor"],
  },
  places: [
    ["the park", "the playground", "the school garden", "the beach"],
    ["the library", "the museum", "the gym", "the community center"],
  ],
  // Small countable things that start with a consonant ("a marble"), singular then plural.
  objects: [
    ["marble", "marbles"],
    ["sticker", "stickers"],
    ["button", "buttons"],
    ["stamp", "stamps"],
    ["shell", "shells"],
    ["bead", "beads"],
    ["pencil", "pencils"],
    ["crayon", "crayons"],
  ],
});

const GENDERED = /\b(?:he|him|his|himself|she|her|hers|herself)\b/i;
const inWords = (text, token) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(token)}(?![\\p{L}\\p{N}])`, "iu").test(text);

/** Keep the capital letters of what was found: "Marble" -> "Sticker", "MARBLES" -> "STICKERS". */
function like(found, word) {
  if (found.length > 1 && found === found.toUpperCase()) return word.toUpperCase();
  return found[0] === found[0].toUpperCase() && found[0] !== found[0].toLowerCase()
    ? word[0].toUpperCase() + word.slice(1)
    : word;
}

/** @returns {{blocks: object[], title: string, description: string, changes: object[], skipped: object[], review: object[]}} */
export function contextVariant(a, seed) {
  const changes = [];
  const skipped = [];
  const review = [];
  const swappable = a.blocks.filter((b) => b.type !== "vocab");
  const corpus = [a.title, a.description, a.context.objective, ...proseOf(swappable)].join("\n");
  const vocabText = proseOf(a.blocks.filter((b) => b.type === "vocab")).join("\n");
  const rng = makeRng(hashSeed(seed, a.id, "context"));

  /** token groups present in the text, minus vocabulary words */
  const present = (tokens) => tokens.filter((t) => inWords(corpus, t) && !inWords(vocabText, t));
  const blockedByVocab = (tokens) =>
    tokens.filter((t) => inWords(corpus, t) && inWords(vocabText, t));

  const map = new Map(); // found token (lowercase) -> replacement
  const note = (from, to) =>
    changes.push({
      blockId: "",
      mode: "context",
      message: T(
        `"${from}" became "${to}" everywhere in the activity.`,
        `«${from}» se cambió a «${to}» en toda la actividad.`,
      ),
    });
  /** one swap per present token, chosen from the unused members of the same group */
  const swapGroup = (members, found, key = (x) => x) => {
    const free = rng.shuffle(
      members.filter((m) => !inWords(corpus, key(m)) && ![...map.values()].includes(m)),
    );
    for (const f of found) {
      const to = free.shift();
      if (!to) break;
      map.set(key(f).toLowerCase(), to);
      note(key(f), key(to));
    }
  };

  for (const [group, members] of Object.entries(CONTEXT_TABLE.names)) {
    const found = present(members);
    if (group === "any" && found.length && GENDERED.test(corpus))
      skipped.push({
        blockId: "",
        reason: T(
          `${found.join(", ")} can be any pronoun and the text uses he/she/his/her, so ${found.length > 1 ? "these names were" : "this name was"} not swapped.`,
          `${found.join(", ")} puede llevar cualquier pronombre y el texto usa él/ella/su, así que no se cambió.`,
        ),
      });
    else swapGroup(members, found);
  }
  for (const group of CONTEXT_TABLE.places) swapGroup(group, present(group));
  for (const [sg, pl] of CONTEXT_TABLE.objects) {
    if (inWords(vocabText, sg) || inWords(vocabText, pl)) continue; // either form is a vocabulary word
    const foundPair = present([sg, pl]);
    if (!foundPair.length) continue;
    const free = rng.shuffle(
      CONTEXT_TABLE.objects.filter(
        ([s, p]) => !inWords(corpus, s) && !inWords(corpus, p) && ![...map.values()].includes(p),
      ),
    );
    const to = free[0];
    if (!to) continue;
    map.set(sg, to[0]);
    map.set(pl, to[1]);
    note(foundPair.includes(pl) ? pl : sg, foundPair.includes(pl) ? to[1] : to[0]);
  }
  const held = [
    ...Object.values(CONTEXT_TABLE.names).flatMap(blockedByVocab),
    ...CONTEXT_TABLE.places.flatMap(blockedByVocab),
    ...CONTEXT_TABLE.objects.flatMap(blockedByVocab),
  ];
  for (const t of held)
    skipped.push({
      blockId: "",
      reason: T(
        `"${t}" is also a vocabulary word, so it was not swapped.`,
        `«${t}» también es una palabra de vocabulario, así que no se cambió.`,
      ),
    });

  const tokens = [...map.keys()].sort((x, y) => y.length - x.length);
  const re = tokens.length
    ? new RegExp(
        `(?<![\\p{L}\\p{N}])(?:${tokens.map(escapeRe).join("|")})(?![\\p{L}\\p{N}])`,
        "giu",
      )
    : null;
  const swap = (s) => (re ? s.replace(re, (m) => like(m, map.get(m.toLowerCase()))) : s);
  const blocks = a.blocks.map((b) => (b.type === "vocab" ? b : mapStrings(b, swap)));

  if (changes.length && a.blocks.some((b) => b.type === "image" || b.image?.src))
    review.push({
      message: T(
        "Pictures were not changed. Check that they still match the new names, places and objects.",
        "Las imágenes no se cambiaron. Revise que sigan correspondiendo a los nombres, lugares y objetos nuevos.",
      ),
    });
  if (changes.length)
    review.push({
      message: T(
        "Read each story once: a new place or object can change what makes sense.",
        "Lea cada historia una vez: un lugar u objeto nuevo puede cambiar lo que tiene sentido.",
      ),
    });
  return {
    blocks,
    title: swap(a.title),
    description: swap(a.description),
    changes,
    skipped,
    review,
  };
}
