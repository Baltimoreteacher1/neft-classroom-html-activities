// Word Lab logic (pure, no DOM): the word bank filters, the morpheme builder checks, cognate cards, context-clue checks, the
// Frayer completeness rule and the Word Garden. The garden reuses the lab's spaced-review pieces from ledger.js
// (REVIEW_INTERVALS_DAYS, dayNumber, reviewSchedule), so a word is "due" by the same expanding 1/3/7/14-day rule as an error pattern.
// Nothing here is random: tray order, distractors and answer positions come from a hash of the ids, so a task is the same
// on every visit and there is no luck in it.
import { REVIEW_INTERVALS_DAYS, dayNumber, reviewSchedule } from "./ledger.js";

export const SUBJECTS = {
  ela: ["Reading and writing", "Lectura y escritura"],
  math: ["Math", "Matemáticas"],
  sci: ["Science", "Ciencias"],
  ss: ["Social studies", "Estudios sociales"],
};
export const MODES = ["explore", "build", "cognates", "families", "detective", "frayer", "garden"];

export function hash(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0;
  return h;
}
/** `n` items from `list` chosen by hash `h`, skipping any item for which `skip` is true. */
export function pickBy(list, h, n, skip = () => false) {
  const out = [];
  if (!list.length) return out;
  for (let i = 0; out.length < n && i < list.length * 2; i++) {
    const item = list[(h + i * 7919) % list.length];
    if (!skip(item) && !out.includes(item)) out.push(item);
  }
  return out;
}

export const bandMatches = (word, band) => word.b === "both" || word.b === band;
export const wordsForBand = (words, band) => words.filter((w) => bandMatches(w, band));
export const byId = (words, id) => words.find((w) => w.id === id) || null;

/** Filter by subject, tier, Spanish-twin kind and a text query over the word, its Spanish and both definitions. */
export function searchWords(words, { q = "", subj = "", tier = "", cog = "" } = {}) {
  const needle = String(q).trim().toLowerCase();
  return words.filter(
    (w) =>
      (!subj || w.s === subj) &&
      (!tier || String(w.t) === String(tier)) &&
      (!cog || w.c === cog) &&
      (!needle ||
        [w.w, w.e, w.d, w.de].some((s) =>
          String(s || "")
            .toLowerCase()
            .includes(needle),
        )),
  );
}

// ── morpheme builder ──────────────────────────────────────────────────────────
export const buildable = (words) => words.filter((w) => Array.isArray(w.p) && w.p.length >= 2);
export const joinParts = (parts) => parts.join("").replace(/-/g, "");
const sameParts = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Tiles for one build: the word's parts plus three look-alike parts of the same kinds, in a fixed mixed order. */
export function buildTray(word, morphemes) {
  const kindOf = (f) => morphemes.find((m) => m.f === f)?.k;
  const kinds = [...new Set(word.p.map(kindOf))];
  const pool = morphemes.filter((m) => kinds.includes(m.k) && !word.p.includes(m.f));
  const extras = pickBy(pool, hash(word.id), 3).map((m) => m.f);
  return [...word.p, ...extras].sort((a, b) => hash(word.id + a) - hash(word.id + b));
}

/**
 * Checks tiles placed in order against the target. `ok` = the target word. `other` = a different real word from the
 * bank (so the learner learns that building words is a real thing, not a guess). `text` is what the tiles spell.
 */
export function checkBuild(words, picked, target) {
  const text = joinParts(picked);
  if (target && sameParts(picked, target.p)) return { ok: true, text, word: target };
  const other = buildable(words).find((w) => sameParts(w.p, picked));
  return { ok: false, text, other: other || null, short: picked.length < (target?.p.length || 2) };
}

/** Each part with its meaning, for the "meaning blend" line: re- (again) + play (to take part in a game). */
export const blendParts = (word, morphemes) =>
  word.p.map((f) => {
    const m = morphemes.find((x) => x.f === f);
    return { f, m: m?.m || "", me: m?.me || "" };
  });

/** Decode questions: choose the meaning that blends the parts. Distractors are other words' definitions. */
export function decodeQuestion(word, words) {
  const pool = words.filter((w) => w.id !== word.id && w.pos === word.pos);
  const wrong = pickBy(pool, hash(word.id + "dec"), 2);
  const opts = placeAnswer(
    { text: word.d, es: word.de, ok: true },
    wrong.map((w) => ({ text: w.d, es: w.de, ok: false })),
    hash(word.id),
  );
  return opts;
}
/** The right option goes in a hash-chosen slot among the wrong ones. */
export function placeAnswer(right, wrong, h) {
  const out = [...wrong];
  out.splice(h % (wrong.length + 1), 0, right);
  return out;
}

// ── cognate cards ─────────────────────────────────────────────────────────────
export const COGNATE_KINDS = ["twin", "catch", "none"];
export const kindOfWord = (w) =>
  w.c === "cog" ? "twin" : w.c === "part" || w.c === "false" ? "catch" : "none";

/** A deck for the detector: bank words (with their Spanish) plus the false-friend cards, in a fixed mixed order. */
export function cognateDeck(words, falseFriends) {
  const fromWords = words.map((w) => ({
    id: w.id,
    en: w.w,
    es: w.e,
    kind: kindOfWord(w),
    note: w.n || "",
    noteEs: w.ne || "",
    ex: w.x,
    exEs: w.xe,
  }));
  const fromFriends = falseFriends.map((f) => ({
    id: f.id,
    en: f.en,
    es: f.es,
    kind: "catch",
    note: `${f.en} means ${f.enMean}. ${f.es} means ${f.esMean}. Say “${f.say}” for the English meaning.`,
    noteEs: `${f.en} significa ${f.enMeanEs}. ${f.es} significa ${f.esMeanEs}. Di «${f.say}» para el significado en inglés.`,
    ex: f.ex,
    exEs: f.exEs,
    friend: true,
  }));
  return [...fromWords, ...fromFriends].sort((a, b) => hash(a.id) - hash(b.id));
}

// ── context-clue detective ────────────────────────────────────────────────────
/** Which chunks the learner marked as the clue versus the real clue chunks. */
export function checkClue(c, picked) {
  const want = new Set(c.clue);
  const got = new Set(picked);
  const hit = [...got].filter((i) => want.has(i));
  const extra = [...got].filter((i) => !want.has(i));
  const missed = [...want].filter((i) => !got.has(i));
  return { ok: !extra.length && !missed.length, hit, extra, missed };
}
export const CLUE_TYPES = {
  definition: ["Definition clue", "Pista de definición", "The text tells you what the word means."],
  synonym: [
    "Synonym clue",
    "Pista de sinónimo",
    "The text uses another word with almost the same meaning.",
  ],
  antonym: [
    "Antonym clue",
    "Pista de antónimo",
    "The text gives an opposite, so the word means the reverse.",
  ],
  example: [
    "Example clue",
    "Pista de ejemplo",
    "The text gives examples that show what the word means.",
  ],
  inference: [
    "Inference clue",
    "Pista de inferencia",
    "The whole situation helps you work out the meaning.",
  ],
};

// ── Frayer model ──────────────────────────────────────────────────────────────
const wordsIn = (s) =>
  String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
/** A Frayer card is complete when the definition is in the learner's own words and each box has something. */
export function frayerStatus(rec, word) {
  const r = rec || {};
  const def = wordsIn(r.def);
  const own = !word || !new RegExp(`\\b${word.w}\\b`, "i").test(r.def || "");
  const parts = {
    def: def.length >= 3 && own,
    chars: wordsIn(r.chars).length >= 2,
    ex: wordsIn(r.ex).length >= 1,
    non: wordsIn(r.non).length >= 1,
  };
  return { parts, done: Object.values(parts).every(Boolean), usesWord: def.length > 0 && !own };
}

// ── Word Garden ───────────────────────────────────────────────────────────────
export const STAGES = ["seed", "sprout", "leaf", "bud", "bloom", "tree"];
export const STAGE_COPY = {
  seed: ["Seed", "Semilla", "Collected. Not reviewed yet."],
  sprout: ["Sprout", "Brote", "Review it again tomorrow."],
  leaf: ["Leaf", "Hoja", "Next review in 3 days."],
  bud: ["Bud", "Capullo", "Next review in 7 days."],
  bloom: ["Bloom", "Flor", "Next review in 14 days."],
  tree: ["Tree", "Árbol", "You have shown it on your own four times."],
};

export function collectWord(state, id, now = Date.now()) {
  state.garden ||= {};
  if (!state.garden[id]) state.garden[id] = { t: new Date(now).toISOString(), ev: [] };
  return state.garden[id];
}
export const dropWord = (state, id) => {
  if (state.garden) delete state.garden[id];
};

/** Where one collected word stands: stage, whether it is due, and days until the next review. */
export function gardenInfo(rec, now = Date.now()) {
  const sched = reviewSchedule(rec?.ev || [], now);
  if (!sched) return { stage: "seed", index: 0, due: true, wait: 0, retired: false };
  if (sched.retired) return { stage: "tree", index: 5, due: false, wait: 0, retired: true };
  return {
    stage: STAGES[Math.min(sched.step + 1, 4)],
    index: Math.min(sched.step + 1, 4),
    due: sched.due,
    wait: Math.max(0, sched.interval - sched.daysSince),
    retired: false,
  };
}
export const dueWords = (state, now = Date.now()) =>
  Object.keys(state.garden || {}).filter(
    (id) => gardenInfo(state.garden[id], now).due && !gardenInfo(state.garden[id], now).retired,
  );

/** One review result. A review with help (hints open) is `independent: false`, so it resets the step like a miss. */
export function reviewWord(state, id, { ok, independent }, now = Date.now()) {
  const rec = collectWord(state, id, now);
  rec.ev.push({
    t: new Date(now).toISOString(),
    ok: Boolean(ok),
    independent: Boolean(independent),
  });
  if (rec.ev.length > 40) rec.ev.splice(0, rec.ev.length - 40);
  return gardenInfo(rec, now);
}

/** A review question for a collected word: meaning, Spanish match, or fill-in-the-blank when the example allows it. */
export function reviewQuestion(word, words, now = Date.now()) {
  const day = dayNumber(now) || 0;
  const h = hash(`${word.id}:${day}`);
  const pool = words.filter((w) => w.id !== word.id);
  const near = pool.filter((w) => w.pos === word.pos && w.s === word.s);
  const wrongPool = near.length >= 4 ? near : pool;
  const blank = new RegExp(`\\b${word.w}\\b`, "i");
  const kinds = ["meaning", "spanish", ...(blank.test(word.x) ? ["sentence"] : [])];
  const kind = kinds[h % kinds.length];
  const wrong = pickBy(wrongPool, h, 2, (w) => w.e === word.e || w.w === word.w);
  if (kind === "spanish")
    return {
      kind,
      opts: placeAnswer(
        { text: word.e, ok: true },
        wrong.map((w) => ({ text: w.e, ok: false })),
        h >> 3,
      ),
    };
  if (kind === "sentence")
    return {
      kind,
      prompt: word.x.replace(blank, "_____"),
      promptEs: word.xe,
      opts: placeAnswer(
        { text: word.w, ok: true },
        wrong.map((w) => ({ text: w.w, ok: false })),
        h >> 3,
      ),
    };
  return {
    kind,
    opts: placeAnswer(
      { text: word.d, es: word.de, ok: true },
      wrong.map((w) => ({ text: w.d, es: w.de, ok: false })),
      h >> 3,
    ),
  };
}

export const INTERVAL_TEXT = REVIEW_INTERVALS_DAYS.join(", ");
