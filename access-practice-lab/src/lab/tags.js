// Language-error tags and the sentence checker behind them. `analyzeSentence(text)` reads one learner
// sentence (or a short run of them) and names the pattern worth a second look, so the writing workbench can
// say it as the learner builds, and the state store can count it as `languageErrorTag`.
//
// The checks are deliberately narrow and explainable: each is a pattern an English learner is known to
// produce (several come from first-language transfer, for example the dropped subject of Spanish) and each
// returns a hint, never a grade. A sentence with no tag is NOT certified correct: the checker only knows
// these patterns. Text is never stored; only the tag is.
//
// ES text here is chrome (the name of the pattern and the hint); the learner's English is never translated.
export const ERROR_TAGS = Object.freeze({
  MISSING_SUBJECT: {
    en: "Missing subject",
    es: "Falta el sujeto",
    hintEn:
      "Every English sentence needs a subject. Say who or what: “It is raining.”, “She goes to school.”",
    hintEs:
      "Toda oración en inglés necesita un sujeto. Di quién o qué: “It is raining.”, “She goes to school.”",
    game: "sentence-factory",
  },
  ADJECTIVE_ORDER: {
    en: "Adjective order",
    es: "Orden de los adjetivos",
    hintEn:
      "In English the adjective comes before the noun, and opinion comes before size, age and color: “a lovely small red bag”.",
    hintEs:
      "En inglés el adjetivo va antes del sustantivo, y la opinión va antes del tamaño, la edad y el color: “a lovely small red bag”.",
    game: "grammar-jungle",
  },
  VERB_TENSE_SHIFT: {
    en: "Verb tense shift",
    es: "Cambio de tiempo verbal",
    hintEn:
      "Keep one time frame. If the story is in the past, keep every verb in the past: “I walked home and ate dinner.”",
    hintEs:
      "Mantén un solo tiempo. Si el cuento está en pasado, deja todos los verbos en pasado: “I walked home and ate dinner.”",
    game: "grammar-jungle",
  },
  CONNECTOR_MISSING: {
    en: "Connector missing",
    es: "Falta un conector",
    hintEn:
      "Two complete ideas need a connector (and, but, so, because) or a period between them: “It rained, so we stayed inside.”",
    hintEs:
      "Dos ideas completas necesitan un conector (and, but, so, because) o un punto entre ellas: “It rained, so we stayed inside.”",
    game: "connector-climb",
  },
  SUBJECT_VERB_AGREEMENT: {
    en: "Subject–verb agreement",
    es: "Concordancia sujeto-verbo",
    hintEn: "The verb matches the subject: “He goes”, “They go”, “She has”, “We have”.",
    hintEs: "El verbo concuerda con el sujeto: “He goes”, “They go”, “She has”, “We have”.",
    game: "grammar-jungle",
  },
});
export const TAG_IDS = Object.freeze(Object.keys(ERROR_TAGS));
export const remediationGame = (tag) => ERROR_TAGS[tag]?.game || "";

const words = (s) =>
  s
    .toLowerCase()
    .replace(/[“”"]/g, "")
    .match(/[a-z']+|[.,;:!?]/g) || [];
const sentences = (text) =>
  String(text ?? "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

const THIRD_S = new Set([
  "is",
  "was",
  "has",
  "goes",
  "likes",
  "wants",
  "needs",
  "eats",
  "plays",
  "lives",
  "works",
  "walks",
  "looks",
  "makes",
  "takes",
  "comes",
  "rains",
  "snows",
  "seems",
  "becomes",
  "gets",
  "sees",
  "does",
  "loves",
  "helps",
  "runs",
  "reads",
  "writes",
  "speaks",
]);
const SUBJECTS = new Set([
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "this",
  "that",
  "these",
  "those",
  "there",
  "who",
  "what",
  "everyone",
  "someone",
  "nobody",
  "my",
  "your",
  "his",
  "her",
  "our",
  "their",
  "the",
  "a",
  "an",
  "some",
  "many",
  "all",
  "each",
  "every",
  "one",
  "two",
  "three",
  "mr",
  "mrs",
  "ms",
  "dr",
]);

const IRREGULAR_PAST = {
  go: "went",
  eat: "ate",
  see: "saw",
  have: "had",
  make: "made",
  take: "took",
  come: "came",
  get: "got",
  give: "gave",
  find: "found",
  know: "knew",
  think: "thought",
  say: "said",
  tell: "told",
  buy: "bought",
  write: "wrote",
  run: "ran",
  read: "read",
  sit: "sat",
  meet: "met",
  leave: "left",
  begin: "began",
  bring: "brought",
  build: "built",
  feel: "felt",
  keep: "kept",
  lose: "lost",
  sleep: "slept",
  speak: "spoke",
  swim: "swam",
  win: "won",
  is: "was",
  are: "were",
  am: "was",
  do: "did",
};
const PAST_FORMS = new Set(Object.values(IRREGULAR_PAST).filter((w) => w !== "read"));
const PRESENT_FORMS = new Set([
  ...Object.keys(IRREGULAR_PAST).filter((w) => !["read", "am"].includes(w)),
  "goes",
  "eats",
  "sees",
  "has",
  "makes",
  "takes",
  "comes",
  "gets",
  "gives",
  "finds",
  "knows",
  "thinks",
  "says",
  "tells",
  "buys",
  "writes",
  "runs",
  "sits",
  "meets",
  "leaves",
  "begins",
  "brings",
  "builds",
  "feels",
  "keeps",
  "loses",
  "sleeps",
  "speaks",
  "swims",
  "wins",
  "does",
  "plays",
  "walks",
  "likes",
  "wants",
  "needs",
  "looks",
  "lives",
  "works",
]);
const PAST_MARKERS =
  /\b(yesterday|last (?:night|week|month|year|summer|weekend)|ago|in \d{4}|once upon a time)\b/i;
const regularPast = (w) =>
  /^[a-z]{3,}ed$/.test(w) &&
  ![
    "need",
    "feed",
    "seed",
    "speed",
    "weed",
    "bleed",
    "breed",
    "proceed",
    "succeed",
    "exceed",
    "indeed",
    "agreed",
  ].includes(w) &&
  !/^(red|bed|shed|sled|hundred)$/.test(w);

const ADJ_RANK = (() => {
  const groups = [
    [
      "lovely",
      "beautiful",
      "nice",
      "ugly",
      "wonderful",
      "terrible",
      "delicious",
      "favorite",
      "silly",
      "amazing",
      "great",
      "good",
      "bad",
      "pretty",
      "cute",
      "scary",
      "boring",
      "interesting",
    ],
    [
      "big",
      "small",
      "little",
      "large",
      "tiny",
      "huge",
      "tall",
      "short",
      "long",
      "enormous",
      "giant",
      "thin",
      "fat",
      "round",
    ],
    ["old", "new", "young", "ancient", "modern", "fresh"],
    ["square", "circular", "triangular", "flat", "straight", "curved"],
    [
      "red",
      "blue",
      "green",
      "yellow",
      "orange",
      "purple",
      "pink",
      "black",
      "white",
      "brown",
      "gray",
      "grey",
      "golden",
      "silver",
    ],
    [
      "american",
      "mexican",
      "spanish",
      "chinese",
      "italian",
      "french",
      "german",
      "african",
      "asian",
      "korean",
      "japanese",
      "english",
      "salvadoran",
      "guatemalan",
    ],
    [
      "wooden",
      "plastic",
      "metal",
      "cotton",
      "glass",
      "paper",
      "leather",
      "stone",
      "woolen",
      "silk",
    ],
  ];
  const rank = new Map();
  groups.forEach((g, i) => g.forEach((w) => rank.set(w, i)));
  return rank;
})();
const COLORS = new Set([...ADJ_RANK.entries()].filter(([, r]) => r === 4).map(([w]) => w));
const NOT_NOUN_AFTER_DET = new Set([
  ...ADJ_RANK.keys(),
  "very",
  "so",
  "too",
  "and",
  "but",
  "or",
  "is",
  "was",
  "are",
  "were",
  "of",
  "in",
  "on",
  "at",
  "with",
  "from",
  "to",
  "for",
  "that",
  "who",
  "which",
]);

function missingSubject(sentence) {
  if (/\?\s*$/.test(sentence)) return false;
  const first = words(sentence).find((x) => /[a-z]/.test(x));
  // A statement that opens on a third-person verb ("Goes to school.", "Is raining.") has dropped its subject.
  return Boolean(first) && !SUBJECTS.has(first) && THIRD_S.has(first);
}

function adjectiveOrder(sentence) {
  const w = words(sentence);
  // Spanish noun-adjective order: "the car red", "a house big".
  for (let i = 0; i + 2 < w.length; i++) {
    if (
      ["a", "an", "the", "my", "his", "her", "our", "their", "this", "that"].includes(w[i]) &&
      !NOT_NOUN_AFTER_DET.has(w[i + 1]) &&
      /^[a-z]{3,}$/.test(w[i + 1]) &&
      ADJ_RANK.has(w[i + 2]) &&
      ![...THIRD_S].includes(w[i + 1])
    )
      return true;
  }
  // Wrong order inside a run of adjectives: "a red big bag".
  for (let i = 0; i + 1 < w.length; i++) {
    const a = ADJ_RANK.get(w[i]);
    const b = ADJ_RANK.get(w[i + 1]);
    if (a !== undefined && b !== undefined && a > b) return true;
  }
  return false;
}

const AUX_BEFORE_BASE = new Set(["to", "will", "would", "can", "could", "should", "must", "may", "might", "did", "does", "do", "didn't", "don't", "doesn't", "not", "let's"]);
const FUTURE_OR_HABIT = /\b(will|going to|every|usually|always|never|often|sometimes|each day)\b/i;

function verbTenseShift(text) {
  const w = words(text).filter((x) => /[a-z]/.test(x));
  const hasPast = w.some((x) => PAST_FORMS.has(x) || regularPast(x));
  const present = w.filter((x, i) => PRESENT_FORMS.has(x) && !PAST_FORMS.has(x) && !AUX_BEFORE_BASE.has(w[i - 1]));
  if (!present.length || FUTURE_OR_HABIT.test(text)) return false;
  // "Yesterday we go to the park": a past-time word with a present-tense verb.
  if (PAST_MARKERS.test(text)) return true;
  // "She walked home and eats dinner": a past verb and a present verb in one run of ideas.
  return hasPast && /\b(and|then|but|so)\b/i.test(text);
}

function connectorMissing(sentence) {
  const s = sentence.trim();
  const low = s.toLowerCase();
  if (
    /^(when|if|because|although|though|while|since|after|before|as soon as|unless|until|even though|however|therefore|first|then|next|finally|also|for example|in addition)\b/.test(
      low,
    )
  )
    return false;
  // Comma splice: two complete ideas with only a comma: "I was tired, I went to bed."
  const m = low.match(/^(.*?),\s+(i|he|she|we|they|it|you|there)\s+(\w+)/);
  if (
    m &&
    m[1].split(/\s+/).length >= 2 &&
    !/\b(and|but|so|or|yet|because|while|although|however|therefore|moreover|furthermore|instead|otherwise|consequently|nevertheless|then|also)$/.test(m[1].trim())
  )
    return true;
  // Run-on: "I was tired I went to bed." (a new subject + verb with no punctuation or connector between)
  const run = low.match(
    /\b(?:\w+\s){3,}?(i|he|she|we|they)\s+(was|were|went|am|is|are|have|has|had|like|likes|want|wants|need|needs|saw|ate|play|plays|do|did|can|will)\b/,
  );
  if (run) {
    const idx = low.indexOf(run[0]);
    const before = low.slice(0, idx + run[0].length - (run[1].length + 1 + run[2].length)).trim();
    if (
      !/(and|but|so|or|because|that|when|if|while|then|which|who|where|than|as|after|before|until|since|though|although|but|yet|,|;|:)$/.test(
        before,
      ) &&
      before.split(/\s+/).length >= 3 &&
      /\b(was|were|is|are|am|went|saw|ate|have|has|had|play|plays|like|likes)\b/.test(before)
    )
      return true;
  }
  return false;
}

function subjectVerbAgreement(sentence) {
  const l = sentence.toLowerCase();
  return (
    /\b(he|she|it)\s+(go|have|do|eat|like|want|need|play|live|work|walk|look|make|take|come|get|see|read|write|speak|run)\b/.test(
      l,
    ) ||
    /\b(they|we|you|i)\s+(goes|has|does|eats|likes|wants|needs|plays|lives|works|walks|looks|makes|takes|comes|gets|sees|reads|writes|speaks|runs)\b/.test(
      l,
    ) ||
    /\b(he|she|it)\s+(are|were|am)\b/.test(l) ||
    /\b(they|we|you)\s+(is|was|am)\b/.test(l) ||
    /\bi\s+(is|are)\b/.test(l)
  );
}

/**
 * Names every pattern found, in a stable priority order. Returns [{ tag, sentence }].
 * `text` may hold several sentences: each is checked alone, and tense is also checked across the run.
 */
export function analyzeSentence(text) {
  const parts = sentences(text);
  const found = [];
  const add = (tag, sentence) => {
    if (!found.some((f) => f.tag === tag)) found.push({ tag, sentence });
  };
  for (const s of parts) {
    if (missingSubject(s)) add("MISSING_SUBJECT", s);
    if (subjectVerbAgreement(s)) add("SUBJECT_VERB_AGREEMENT", s);
    if (adjectiveOrder(s)) add("ADJECTIVE_ORDER", s);
    if (connectorMissing(s)) add("CONNECTOR_MISSING", s);
    if (verbTenseShift(s)) add("VERB_TENSE_SHIFT", s);
  }
  if (parts.length > 1 && !found.some((f) => f.tag === "VERB_TENSE_SHIFT")) {
    const tenses = parts
      .map((s) => {
        const w = words(s);
        const past = w.some((x) => PAST_FORMS.has(x) || regularPast(x));
        const present = w.some((x) => PRESENT_FORMS.has(x) && !PAST_FORMS.has(x));
        return past && !present ? "past" : present && !past ? "present" : "";
      })
      .filter(Boolean);
    if (
      tenses.includes("past") &&
      tenses.includes("present") &&
      !PAST_MARKERS.test("") &&
      !parts.some((s) => /\b(now|today|always|every|usually|will)\b/i.test(s))
    )
      add("VERB_TENSE_SHIFT", parts.join(" "));
  }
  return found;
}

/** The single tag worth logging for a text: the first one found, or null. */
export const primaryTag = (text) => analyzeSentence(text)[0]?.tag || null;
export const isColor = (w) => COLORS.has(String(w).toLowerCase());
