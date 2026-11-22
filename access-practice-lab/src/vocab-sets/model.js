// Teacher-authored vocabulary sets: parsing a pasted list, cleaning stored or imported sets, building practice
// rounds and share links. Pure functions only (no DOM, no storage), so every rule here is unit-tested.
// A set is { id, title, band, items: [{ id, term, definition, example, translation }], updated }.

export const LIMITS = Object.freeze({
  items: 120,
  term: 60,
  definition: 200,
  example: 240,
  translation: 80,
  title: 80,
  shareChars: 7000,
});
export const BANDS = Object.freeze(["all", "3-5", "6-8"]);

const clip = (value, max) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
const HEADER = /^(word|term|vocabulary|palabra)$/i;

/** Seeded generator so a practice round can be repeated in tests and never depends on Math.random. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(list, rng = Math.random) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const newId = (prefix = "vs") => {
  const cryptoApi = globalThis.crypto;
  const rand = cryptoApi?.randomUUID
    ? cryptoApi.randomUUID().replace(/-/g, "").slice(0, 10)
    : Math.random().toString(36).slice(2, 12);
  return `${prefix}-${rand}`;
};

/**
 * Parse pasted text, one word per line: `word | definition | example | translation`. A tab also separates columns,
 * so a copy from a spreadsheet works. A first line that says "word" or "term" is a header and is skipped.
 * @returns {{ items: Array<{term:string,definition:string,example:string,translation:string}>,
 *   errors: Array<{line:number, key:string}> }} error keys: "term_missing", "too_long", "duplicate", "too_many"
 */
export function parseWordList(text) {
  const items = [];
  const errors = [];
  const seen = new Set();
  const lines = String(text ?? "").split(/\r?\n/);
  lines.forEach((raw, index) => {
    const line = index + 1;
    if (!raw.trim()) return;
    const cells = (raw.includes("\t") ? raw.split("\t") : raw.split("|")).map((c) => c.trim());
    if (items.length === 0 && errors.length === 0 && HEADER.test(cells[0] || "")) return;
    const [term = "", definition = "", example = "", translation = ""] = cells;
    if (!term) return errors.push({ line, key: "term_missing" });
    if (
      term.length > LIMITS.term ||
      definition.length > LIMITS.definition ||
      example.length > LIMITS.example ||
      translation.length > LIMITS.translation
    ) {
      return errors.push({ line, key: "too_long" });
    }
    const dedupe = term.toLowerCase();
    if (seen.has(dedupe)) return errors.push({ line, key: "duplicate" });
    if (items.length >= LIMITS.items) return errors.push({ line, key: "too_many" });
    seen.add(dedupe);
    items.push({
      term: clip(term, LIMITS.term),
      definition: clip(definition, LIMITS.definition),
      example: clip(example, LIMITS.example),
      translation: clip(translation, LIMITS.translation),
    });
  });
  return { items, errors };
}

/** Inverse of parseWordList, so a saved set can be edited as text. */
export const itemsToText = (items) =>
  items
    .map((i) =>
      [i.term, i.definition, i.example, i.translation].join(" | ").replace(/(?: \|)+ ?$/, ""),
    )
    .join("\n");

/** Normalize anything read from storage, an imported file or a link. Returns null when nothing usable remains. */
export function cleanSet(raw) {
  if (!raw || typeof raw !== "object") return null;
  const seen = new Set();
  const items = [];
  for (const it of Array.isArray(raw.items) ? raw.items : []) {
    const term = clip(it?.term, LIMITS.term);
    if (!term || seen.has(term.toLowerCase()) || items.length >= LIMITS.items) continue;
    seen.add(term.toLowerCase());
    items.push({
      id: typeof it.id === "string" && /^[\w-]{1,40}$/.test(it.id) ? it.id : newId("w"),
      term,
      definition: clip(it.definition, LIMITS.definition),
      example: clip(it.example, LIMITS.example),
      translation: clip(it.translation, LIMITS.translation),
    });
  }
  const title = clip(raw.title, LIMITS.title);
  if (!title || !items.length) return null;
  return {
    id: typeof raw.id === "string" && /^[\w-]{1,40}$/.test(raw.id) ? raw.id : newId(),
    title,
    band: BANDS.includes(raw.band) ? raw.band : "all",
    items,
    updated: Number.isFinite(raw.updated) ? raw.updated : 0,
  };
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Sentence-completion rounds built from each item's own example sentence. The blank replaces the word as written,
 * allowing a short ending (plural, -ed, -ing). Items whose example does not contain the word are left out, and the
 * count is returned so the page can say so instead of hiding it.
 */
export function clozeRounds(items) {
  const rounds = [];
  let skipped = 0;
  for (const item of items) {
    const re = new RegExp(`(^|[^\\p{L}])(${escapeRe(item.term)}[\\p{L}]{0,3})(?![\\p{L}])`, "iu");
    const m = item.example ? item.example.match(re) : null;
    if (!m) {
      skipped++;
      continue;
    }
    const start = m.index + m[1].length;
    rounds.push({
      id: item.id,
      prompt: `${item.example.slice(0, start)}_____${item.example.slice(start + m[2].length)}`,
      answer: m[2],
      term: item.term,
      hint: item.definition,
    });
  }
  return { rounds, skipped };
}

/** True when what the learner typed is the answer: case, spacing and a trailing period do not matter. */
export const sameAnswer = (typed, answer) =>
  String(typed ?? "")
    .trim()
    .replace(/[.!?]$/, "")
    .toLowerCase() === String(answer).trim().toLowerCase();

/** "Which word fits?" rounds: the definition is the prompt, the options are real terms from the same set. */
export function quizRounds(items, rng = Math.random, optionCount = 4) {
  const usable = items.filter((i) => i.definition);
  return shuffle(usable, rng).map((item) => {
    const others = shuffle(
      items.filter((o) => o.id !== item.id),
      rng,
    ).slice(0, optionCount - 1);
    return {
      id: item.id,
      prompt: item.definition,
      answer: item.term,
      options: shuffle([item, ...others], rng).map((o) => o.term),
    };
  });
}

/** One matching round: up to `size` terms and their definitions, in two independently shuffled columns. */
export function matchRound(items, rng = Math.random, size = 5) {
  const picked = shuffle(
    items.filter((i) => i.definition),
    rng,
  ).slice(0, size);
  return {
    terms: shuffle(picked, rng).map((i) => ({ id: i.id, text: i.term })),
    definitions: shuffle(picked, rng).map((i) => ({ id: i.id, text: i.definition })),
  };
}

const b64urlEncode = (text) => {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const b64urlDecode = (text) => {
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

/** A set as a link fragment, so a class can open it with no account. Refuses a set too big for a link. */
export function encodeShare(set) {
  const payload = JSON.stringify({
    v: 1,
    t: set.title,
    b: set.band,
    i: set.items.map((i) => [i.term, i.definition, i.example, i.translation]),
  });
  const encoded = b64urlEncode(payload);
  return encoded.length > LIMITS.shareChars
    ? { ok: false, error: "too_big" }
    : { ok: true, encoded };
}

export function decodeShare(encoded) {
  try {
    const data = JSON.parse(b64urlDecode(String(encoded ?? "")));
    if (data?.v !== 1 || !Array.isArray(data.i)) return null;
    return cleanSet({
      title: data.t,
      band: data.b,
      items: data.i.map(([term, definition, example, translation]) => ({
        term,
        definition,
        example,
        translation,
      })),
    });
  } catch {
    return null;
  }
}
