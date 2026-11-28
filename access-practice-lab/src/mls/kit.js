// Math Literacy Studio: the shared kit every problem family builds on. One seeded RNG, one small exact-rational type,
// one set of names and contexts, and `finalize()`, which refuses a malformed Problem (see docs/math-literacy/architecture.md).
// Nothing here touches the DOM, so tools and tests run it in node.

export const MINUS = "−";
export const TIMES = "×";
export const DIVIDE = "÷";

/** Seeded generator (mulberry32). A string seed is hashed first, so seeds can be readable ("g3.muldiv:7"). */
export function makeRng(seed = 1) {
  let s = typeof seed === "number" ? seed >>> 0 : hashStr(String(seed));
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng = {
    next,
    /** Integer in [lo, hi], inclusive. */
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p = 0.5) => next() < p,
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    /** n distinct items. */
    sample: (arr, n) => rng.shuffle(arr).slice(0, n),
  };
  return rng;
}
export function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};
export const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);

/** A small exact rational for generators (always reduced, denominator > 0). Tools verify with scripts/lib/rational.mjs instead. */
export class Fr {
  constructor(n, d = 1) {
    if (d === 0) throw new Error("Fr: zero denominator");
    if (d < 0) [n, d] = [-n, -d];
    const g = gcd(n, d);
    this.n = n / g;
    this.d = d / g;
  }
  add = (o) => new Fr(this.n * o.d + o.n * this.d, this.d * o.d);
  sub = (o) => new Fr(this.n * o.d - o.n * this.d, this.d * o.d);
  mul = (o) => new Fr(this.n * o.n, this.d * o.d);
  div = (o) => new Fr(this.n * o.d, this.d * o.n);
  cmp = (o) => Math.sign(this.n * o.d - o.n * this.d);
  get value() {
    return this.n / this.d;
  }
  /** Canonical answer string: "3", "-2", "3/4" (improper stays improper). */
  toString() {
    return this.d === 1 ? String(this.n) : `${this.n}/${this.d}`;
  }
}
export const fr = (n, d = 1) => new Fr(n, d);

/** Typographic number text: thousands comma from 4 digits, real minus sign. */
export function num(n) {
  const neg = n < 0;
  const s = Math.abs(n).toString();
  const [i, f] = s.split(".");
  const withCommas = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (neg ? MINUS : "") + withCommas + (f ? `.${f}` : "");
}
/** A fraction as text with a slash, e.g. 3/4. Mixed numbers: "1 1/2". */
export function fracText(n, d, { mixed = false } = {}) {
  if (d === 1) return num(n);
  if (mixed && Math.abs(n) > d) {
    const w = Math.trunc(n / d);
    const r = Math.abs(n % d);
    return r === 0 ? num(w) : `${w} ${r}/${d}`;
  }
  return `${n < 0 ? MINUS : ""}${Math.abs(n)}/${d}`;
}
/** Decimal text with a fixed number of places. */
export const dec = (x, places) => (Math.round(x * 10 ** places) / 10 ** places).toFixed(places);

/** Every numeral in a piece of text, commas removed, minus signs normalised. Used to prove language levels share one set of numbers. */
export function numerals(text) {
  const t = String(text).replace(/−/g, "-");
  return (t.match(/-?\d[\d,]*(?:\.\d+)?(?:\/\d+)?/g) || []).map((x) => x.replace(/,/g, ""));
}

/** Diverse first names (short, easy to decode). */
export const NAMES = [
  "Ana", "Omar", "Mei", "Tariq", "Lucia", "Kofi", "Sara", "Diego", "Priya", "Ben",
  "Amara", "Yusuf", "Nia", "Mateo", "Hana", "Jamal", "Rosa", "Eli", "Zara", "Leo",
];
/** Pick two different names. */
export const twoNames = (rng) => rng.sample(NAMES, 2);

/**
 * Story contexts. Each has count nouns ({one, many}) the family can use, a place phrase and a cost scale.
 * Every skill lists the contexts that make sense for it; the teacher can choose one.
 */
export const CONTEXTS = {
  store: { label: "School store", place: "at the school store", things: [{ one: "pencil", many: "pencils" }, { one: "notebook", many: "notebooks" }, { one: "sticker", many: "stickers" }, { one: "eraser", many: "erasers" }] },
  garden: { label: "Garden", place: "in the school garden", things: [{ one: "seed", many: "seeds" }, { one: "tomato", many: "tomatoes" }, { one: "flower", many: "flowers" }, { one: "bean plant", many: "bean plants" }] },
  sports: { label: "Sports", place: "at the field", things: [{ one: "goal", many: "goals" }, { one: "lap", many: "laps" }, { one: "point", many: "points" }, { one: "cone", many: "cones" }] },
  kitchen: { label: "Cooking", place: "in the kitchen", things: [{ one: "cookie", many: "cookies" }, { one: "muffin", many: "muffins" }, { one: "cup of flour", many: "cups of flour" }, { one: "apple", many: "apples" }] },
  pets: { label: "Pets and animals", place: "at the animal shelter", things: [{ one: "fish", many: "fish" }, { one: "bone", many: "bones" }, { one: "bird", many: "birds" }, { one: "rabbit", many: "rabbits" }] },
  library: { label: "Library", place: "in the library", things: [{ one: "book", many: "books" }, { one: "magazine", many: "magazines" }, { one: "bookmark", many: "bookmarks" }, { one: "chair", many: "chairs" }] },
  crafts: { label: "Crafts", place: "in art class", things: [{ one: "bead", many: "beads" }, { one: "ribbon", many: "ribbons" }, { one: "paper star", many: "paper stars" }, { one: "tile", many: "tiles" }] },
  travel: { label: "Travel", place: "at the bus stop", things: [{ one: "bus", many: "buses" }, { one: "ticket", many: "tickets" }, { one: "bike", many: "bikes" }, { one: "backpack", many: "backpacks" }] },
  science: { label: "Science", place: "in the science room", things: [{ one: "plant", many: "plants" }, { one: "magnet", many: "magnets" }, { one: "beaker", many: "beakers" }, { one: "rock", many: "rocks" }] },
  community: { label: "Community", place: "in the neighborhood", things: [{ one: "tree", many: "trees" }, { one: "flyer", many: "flyers" }, { one: "box of food", many: "boxes of food" }, { one: "poster", many: "posters" }] },
};
export const CONTEXT_IDS = Object.keys(CONTEXTS);
/** A count noun for a context (random unless an index is given). */
export const thing = (rng, ctxId, i) => {
  const c = CONTEXTS[ctxId] || CONTEXTS.store;
  return i == null ? rng.pick(c.things) : c.things[i % c.things.length];
};
/** "1 pencil" / "5 pencils". */
export const count = (n, t) => `${num(n)} ${n === 1 ? t.one : t.many}`;

/** Language levels for stems: plain (short, concrete), standard (grade-level), rich (extended, precise). */
export const LANG_LEVELS = ["plain", "standard", "rich"];

/**
 * Normalise and check a Problem. Every family ends with `return finalize(problem)`.
 * It throws (so a bad family fails loudly in tests) when the Problem breaks the contract in docs/math-literacy/architecture.md.
 */
export function finalize(p) {
  const fail = (m) => {
    throw new Error(`[${p.family || "?"}] ${m}`);
  };
  if (!p.family) fail("missing family");
  if (!p.spec || typeof p.spec !== "object") fail("missing spec");
  const tri = (v, what) => {
    if (typeof v === "string") return { plain: v, standard: v, rich: v };
    if (!v || !v.plain || !v.standard || !v.rich) fail(`${what} needs plain, standard and rich text`);
    return v;
  };
  p.stem = p.stem == null ? { plain: "", standard: "", rich: "" } : p.stem && typeof p.stem === "object" && "plain" in p.stem ? p.stem : tri(p.stem, "stem");
  p.ask = tri(p.ask, "ask");
  if (!p.answer || p.answer.value == null || p.answer.value === "") fail("missing answer.value");
  p.answer.value = String(p.answer.value);
  p.answer.text = String(p.answer.text ?? p.answer.value);
  if (!["int", "frac", "dec", "text", "pair", "set", "choice", "bool"].includes(p.answer.kind)) fail(`bad answer.kind ${p.answer.kind}`);
  if (!Array.isArray(p.work) || !p.work.length) fail("work needs at least one step");
  p.visual = p.visual || null;
  if (p.visual && (!p.visual.kind || !p.visual.alt)) fail("visual needs kind and alt");
  p.expr = p.expr || null;
  p.hints = p.hints || {};
  if (!p.hints.conceptual || !p.hints.procedural) fail("hints need conceptual and procedural");
  const seen = new Set([p.answer.text.trim().toLowerCase()]);
  if (!Array.isArray(p.distractors) || p.distractors.length < 3) fail("need at least 3 distractors");
  for (const d of p.distractors) {
    if (!d.text || !d.misconception) fail("distractor needs text and misconception");
    const k = String(d.text).trim().toLowerCase();
    if (seen.has(k)) fail(`distractor repeats another choice: ${d.text}`);
    seen.add(k);
    d.text = String(d.text);
  }
  p.level = p.level || 1;
  // The three language levels must carry the same numbers: simplifying the words may never change the mathematics.
  const base = numerals(p.stem.standard + " " + p.ask.standard).sort().join("|");
  for (const lv of ["plain", "rich"]) {
    const here = numerals(p.stem[lv] + " " + p.ask[lv]).sort().join("|");
    if (here !== base) fail(`${lv} text changes the numbers (${here} vs ${base})`);
  }
  return p;
}

/**
 * Multiple-choice options for a Problem: the answer and its distractors, shuffled by a seed.
 * The correct index depends on the seed only, so a result is reproducible.
 */
export function choicesOf(p, seed = 1) {
  const rng = makeRng(`${p.family}:${seed}:choices`);
  const all = rng.shuffle([{ text: p.answer.text, correct: true }, ...p.distractors.map((d) => ({ text: d.text, correct: false, misconception: d.misconception }))]);
  return all;
}
