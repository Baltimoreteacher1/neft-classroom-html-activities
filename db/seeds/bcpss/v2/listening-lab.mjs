// BCPSS Language Studio — Listening Lab: the listening activities derived from a unit's OWN authored studio data.
//
// Every unit file authors exactly one Listening activity (a dictogloss). This module adds two more per unit so every
// unit reaches LAB_MIN_LISTENING, without writing new curriculum:
//   listen-and-choose  hear a vocabulary meaning (`def`), tap the word it describes  (falls back to the clue_game clues)
//   listen-and-sort    hear a word_sort item, tap its group (math notation is read aloud as words, see spokenMath)
// Both run on the existing `listen_and_show` player kind (payload.mode "choose" | "sort", payload.transcript "toggle").
// Nothing here invents a sentence, answer, word or category: each item carries `from`, a pointer to the authored field
// it came from, and the gate G-53 re-reads that field. Pure and deterministic; no I/O, no network, no audio files.
// Audio is on-device speechSynthesis in the player; there are no timers.

export const LAB_VERSION = 1;
export const LAB_MIN_LISTENING = 3;
export const LAB_KIND = "listen_and_show";
export const LAB_GENERATOR = "listening-lab";
const MAX_ITEMS = 6;
const MAX_SORT_ITEMS = 8;
const MIN_ITEMS = 4;

export const DRAFT_LABEL =
  "Built from this unit's own words by a program. Draft: not yet reviewed by a teacher.";

// ── text helpers ──────────────────────────────────────────────────────────────
export const norm = (s) =>
  String(s ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const hash = (s) => {
  let h = 2166136261;
  for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
};
const seeded = (list, seed) =>
  list
    .map((item, i) => ({ item, k: hash(`${seed}:${i}`) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.item);

const sentence = (text) => {
  const t = String(text).trim();
  const s = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?]$/.test(s) ? s : `${s}.`;
};

// ── spoken form of math notation ──────────────────────────────────────────────
const DENOM = {
  2: ["half", "halves"],
  3: ["third", "thirds"],
  4: ["fourth", "fourths"],
  5: ["fifth", "fifths"],
  6: ["sixth", "sixths"],
  7: ["seventh", "sevenths"],
  8: ["eighth", "eighths"],
  9: ["ninth", "ninths"],
  10: ["tenth", "tenths"],
  12: ["twelfth", "twelfths"],
  100: ["hundredth", "hundredths"],
};
const DIGIT = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const OPS = {
  "+": "plus",
  "×": "times",
  "÷": "divided by",
  "=": "equals",
  "<": "is less than",
  ">": "is greater than",
  "≤": "is less than or equal to",
  "≥": "is greater than or equal to",
};
const SUP = { "²": "squared", "³": "cubed" };
const MATH_CHARS = /[0-9+\-−×÷=<>≤≥/²³√π.]/;
const TOKEN = /\s*(\d+(?:\.\d+)?|[+×÷=<>≤≥²³√π−-]|\/)/gy;

function numberWords(tok) {
  if (!tok.includes(".")) return tok;
  const [whole, frac] = tok.split(".");
  return `${whole === "0" ? "zero" : whole} point ${[...frac].map((d) => DIGIT[Number(d)]).join(" ")}`;
}

const INLINE = [
  [/(?<=\d)\s-\s(?=\d)|\s−\s/g, " minus "],
  [/\s*\+\s*/g, " plus "],
  [/\s*×\s*/g, " times "],
  [/\s*÷\s*/g, " divided by "],
  [/\s*≤\s*/g, " is less than or equal to "],
  [/\s*≥\s*/g, " is greater than or equal to "],
  [/\s*<\s*/g, " is less than "],
  [/\s*>\s*/g, " is greater than "],
  [/\s*=\s*/g, " equals "],
  [/²/g, " squared"],
  [/³/g, " cubed"],
];
/** Words with a few math symbols in them ("x + 2 = 9 is one of me"): the symbols are read out. null when unsure. */
function spokenInline(raw) {
  if (/[()%$/…√π]/.test(raw) || /[A-Za-z]\d|\d[A-Za-z]/.test(raw)) return /[+×÷=<>≤≥²³−]/.test(raw) ? null : raw;
  let out = raw;
  for (const [re, words] of INLINE) out = out.replace(re, words);
  return out.replace(/\s+/g, " ").replace(/\s+([.,!?])/g, "$1").trim();
}

/**
 * Math-only text ("3 + 4 = 7", "1/3", "√49") -> the words a teacher would say, or null when this reader is not sure
 * (letters beside digits, parentheses, "…", %, $). Text that already is words is returned unchanged.
 */
export function spokenMath(text) {
  const raw = String(text ?? "").trim();
  if (!raw) return null;
  const hasWords = /[A-Za-z]{2,}/.test(raw);
  const hasMath = /[+×÷=<>≤≥²³√π−/]/.test(raw) || /^[\d.\s-]+$/.test(raw);
  if (hasWords) return spokenInline(raw);
  if (!hasMath || /[^0-9+\-−×÷=<>≤≥/²³√π.\s]/.test(raw)) return null;
  const out = [];
  let prev = null;
  TOKEN.lastIndex = 0;
  let pos = 0;
  for (let m = TOKEN.exec(raw); m; m = TOKEN.exec(raw)) {
    const tok = m[1];
    pos = TOKEN.lastIndex;
    if (/^\d/.test(tok)) {
      if (prev === "/") {
        const den = DENOM[tok];
        const numTok = out.pop();
        if (!den || !/^\d+$/.test(numTok.text)) return null;
        out.push({ text: `${numTok.text} ${numTok.text === "1" ? den[0] : den[1]}`, kind: "num" });
        prev = "num";
        continue;
      }
      out.push({ text: numberWords(tok), kind: "num" });
      prev = "num";
    } else if (tok === "/") {
      if (prev !== "num") return null;
      prev = "/";
    } else if (tok === "−" || tok === "-") {
      out.push({ text: prev === "num" ? "minus" : "negative", kind: "op" });
      prev = "op";
    } else if (tok === "√") {
      out.push({ text: "the square root of", kind: "op" });
      prev = "op";
    } else if (tok === "π") {
      out.push({ text: "pi", kind: "num" });
      prev = "num";
    } else if (SUP[tok]) {
      if (prev !== "num") return null;
      out.push({ text: SUP[tok], kind: "op" });
      prev = "num";
    } else if (OPS[tok]) {
      if (prev !== "num") return null;
      out.push({ text: OPS[tok], kind: "op" });
      prev = "op";
    }
  }
  if (pos < raw.replace(/\s+$/, "").length || prev === "/" || prev === "op") return null;
  const words = out.map((o) => o.text).join(" ");
  return /^negative negative|[a-z] negative negative/.test(words) ? null : words;
}

// ── unit facts ────────────────────────────────────────────────────────────────
const STAGE = {
  choose: {
    title: "Meaning Detectives",
    prompt: "Listen. Then tap the word that matches.",
    group: "Choices",
  },
  clue: {
    title: "Clue Detectives",
    prompt: "Listen to the clue. Then tap the word it describes.",
    group: "Choices",
  },
  sort: {
    title: "Sort by Ear",
    prompt: "Listen. Then tap the group where it belongs.",
    group: "Groups",
  },
};
const SUPPORT = {
  l1_2: "Keep the words on the screen and tap Listen as many times as you like.",
  l3_4: "Listen with the words hidden. Show the words only to check what you heard.",
  l5_6: "Listen with the words hidden, then say why your choice fits.",
};
const TIP =
  "Solo practice on a device with sound or headphones. Students replay and slow the voice as often as they like; there is no timer.";

// Two meanings that share several content words (add / join / plus) could both fit what the student hears.
const contentWords = (text) => new Set(norm(text).split(" ").filter((w) => w.length > 3));
const overlaps = (a, b) => {
  const x = contentWords(a);
  const y = contentWords(b);
  let shared = 0;
  for (const w of x) if (y.has(w)) shared++;
  return shared >= 3 || (x.size > 0 && y.size > 0 && shared / Math.min(x.size, y.size) >= 0.5);
};

const unitWords = (studio) => studio.vocab.map((v) => String(v.term));

function chooseFromVocab(unitId, studio) {
  const terms = unitWords(studio);
  const items = [];
  for (const v of studio.vocab) {
    if (!v.def || !v.example || String(v.def).trim().split(/\s+/).length < 2) continue;
    const say = spokenMath(v.def);
    if (!say) continue; // cannot be read aloud faithfully
    const mine = norm(v.term);
    const def = norm(v.def);
    if (def.includes(mine)) continue; // the meaning must not say the answer
    const others = terms.filter((t) => {
      const n = norm(t);
      const other = studio.vocab.find((x) => x.term === t);
      return (
        n !== mine &&
        !n.includes(mine) &&
        !mine.includes(n) &&
        !def.includes(n) &&
        !overlaps(v.def, other?.def)
      );
    });
    if (others.length < 2) continue;
    const wrong = seeded(others, `${unitId}:${v.term}`).slice(0, 2);
    const options = seeded([v.term, ...wrong], `${unitId}:${v.term}:order`);
    const iconOf = (t) => studio.vocab.find((x) => x.term === t)?.icon || null;
    items.push({
      say: sentence(say),
      options: options.map((label) => (iconOf(label) ? { label, icon: iconOf(label) } : { label })),
      answer: options.indexOf(v.term),
      why: `“${v.term}”: ${v.example}`,
      from: `vocab:${v.term}:def`,
    });
  }
  return items.slice(0, MAX_ITEMS);
}

function chooseFromClues(unitId, studio) {
  const game = studio.activities.find((a) => a.kind === "clue_game");
  if (!game) return [];
  const cards = game.payload.cards || [];
  const terms = cards.map((c) => c.term);
  return cards
    .map((c, ci) => {
      const wrong = seeded(
        terms.filter((t) => norm(t) !== norm(c.term) && !norm(t).includes(norm(c.term)) && !norm(c.term).includes(norm(t))),
        `${unitId}:clue:${c.term}`,
      ).slice(0, 2);
      if (wrong.length < 2) return null;
      const options = seeded([c.term, ...wrong], `${unitId}:clue:${c.term}:order`);
      const at = [1, 0, 2].find((n) => c.clues[n] != null && spokenMath(c.clues[n]));
      if (at === undefined) return null;
      return {
        say: spokenMath(c.clues[at]),
        options: options.map((label) => ({ label })),
        answer: options.indexOf(c.term),
        why: `The answer is “${c.term}”.`,
        from: `clue_game:${ci}:${at}`,
      };
    })
    .filter(Boolean)
    .slice(0, MAX_ITEMS);
}

/** Sort source: the unit's word_sort activities, speakable items only. Returns { categories, items, activityIndex } or null. */
function sortFromWordSort(studio) {
  for (let ai = 0; ai < studio.activities.length; ai++) {
    const a = studio.activities[ai];
    if (a.kind !== "word_sort") continue;
    const cats = a.payload.categories.map((c) => c.name);
    const usable = a.payload.items
      .map((it, ii) => ({ it, ii, say: spokenMath(it.text) }))
      .filter((x) => x.say && x.say.length <= 90);
    const per = Math.ceil(MAX_SORT_ITEMS / cats.length);
    const byCat = cats.map((_, ci) => usable.filter((x) => x.it.cat === ci).slice(0, per));
    if (byCat.some((l) => l.length < 2)) continue;
    const items = [];
    for (let n = 0; items.length < MAX_SORT_ITEMS; n++) {
      let added = false;
      for (const list of byCat) {
        if (n < list.length && items.length < MAX_SORT_ITEMS) {
          items.push(list[n]);
          added = true;
        }
      }
      if (!added) break;
    }
    return { categories: cats, items, activityIndex: ai };
  }
  return null;
}

function sortActivityItems(unitId, src) {
  const options = src.categories.map((label) => ({ label }));
  return seeded(src.items, `${unitId}:sort`).map((x) => ({
    say: x.say,
    options,
    answer: x.it.cat,
    why: `“${x.say}” goes in “${src.categories[x.it.cat]}”.`,
    from: `word_sort:${src.activityIndex}:${x.ii}`,
  }));
}

function activity({ mode, stage, items, mission, source }) {
  return {
    kind: LAB_KIND,
    domain: "Listening",
    title: STAGE[stage].title,
    minutes: Math.min(10, Math.max(4, Math.round(items.length * 1.2))),
    grouping: "Solo",
    mission,
    tip: TIP,
    materials: [],
    support: SUPPORT,
    payload: {
      mode,
      transcript: "toggle",
      prompt: STAGE[stage].prompt,
      groupLabel: STAGE[stage].group,
      items,
    },
    derived: {
      generator: LAB_GENERATOR,
      version: LAB_VERSION,
      status: "draft",
      source,
      notice: DRAFT_LABEL,
    },
  };
}

/** The Listening Lab activities for one authored unit (never mutates `studio`). [] items are skipped, not padded. */
export function deriveListeningLab(unitId, studio) {
  const out = [];
  const preview = unitWords(studio).slice(0, 3).join(", ");

  let items = chooseFromVocab(unitId, studio);
  let stage = "choose";
  let source = "vocab[].def";
  if (items.length < MIN_ITEMS) {
    items = chooseFromClues(unitId, studio);
    stage = "clue";
    source = "clue_game.cards[].clues";
  }
  if (items.length >= MIN_ITEMS)
    out.push(
      activity({
        mode: "choose",
        stage,
        items,
        source,
        mission: `Hear ${items.length} meanings and tap the word for each one. The words include ${preview}.`,
      }),
    );

  const src = sortFromWordSort(studio);
  if (src) {
    const sortItems = sortActivityItems(unitId, src);
    out.push(
      activity({
        mode: "sort",
        stage: "sort",
        items: sortItems,
        source: `activities[${src.activityIndex}].payload (word_sort)`,
        mission: `Hear ${sortItems.length} ${sortItems.length === 1 ? "item" : "items"} and tap the group each one belongs in: ${src.categories.join(", ")}.`,
      }),
    );
  } else if (stage === "choose") {
    // No speakable word_sort: a second listen-and-choose from the unit's own clue_game, so the unit still reaches the floor.
    const clues = chooseFromClues(unitId, studio);
    if (clues.length >= MIN_ITEMS)
      out.push(
        activity({
          mode: "choose",
          stage: "clue",
          items: clues,
          source: "clue_game.cards[].clues",
          mission: `Hear ${clues.length} clues about unit words like ${preview} and tap the word each one describes.`,
        }),
      );
  }
  return out;
}

const cache = new Map();

/** Returns `studio` with the Listening Lab activities appended (existing activity numbers never move). Memoized by unit. */
export function withListeningLab(unitId, studio) {
  if (!studio || !Array.isArray(studio.activities)) return studio;
  if (studio.activities.some((a) => a.derived?.generator === LAB_GENERATOR)) return studio;
  if (!cache.has(unitId))
    cache.set(unitId, { ...studio, activities: [...studio.activities, ...deriveListeningLab(unitId, studio)] });
  return cache.get(unitId);
}
