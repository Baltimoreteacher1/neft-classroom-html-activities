// Shared text walkers for the Studio X modules. Only fields that carry words are visited: ids, answer keys,
// formats and other structure are never read or rewritten, so a text transform can never break an answer reference.

/** Keys whose string values are structure or answer keys, never prose. */
export const SKIP_KEYS = new Set([
  "id",
  "type",
  "format",
  "role",
  "kind",
  "skill",
  "answer",
  "answers",
  "accept",
  "errorStep",
  "fixAnswer",
  "category",
  "src",
  "unit",
  "expr",
  "exprs",
  "rel",
  "sample",
  "rubric",
]);

/** A copy of `value` with `fn(text, key)` applied to every prose string (see SKIP_KEYS). */
export function mapStrings(value, fn, key = "") {
  if (typeof value === "string") return SKIP_KEYS.has(key) ? value : fn(value, key);
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, fn, key));
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapStrings(v, fn, k)]));
  return value;
}

/** Every prose string in `value`, in document order. */
export function proseOf(value) {
  const out = [];
  mapStrings(value, (s) => {
    out.push(s);
    return s;
  });
  return out;
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const escapeRe = esc;

/** Apply `fn` to the parts of `text` outside [[answer]] markers; the marker text is returned untouched. */
export function outsideMarkers(text, fn) {
  return String(text)
    .split(/(\[\[[^\]]+\]\])/)
    .map((part, i) => (i % 2 ? part : fn(part)))
    .join("");
}

/** An English/Spanish pair. */
export const T = (en, es) => ({ en, es });
export const questionsOf = (a) => a.blocks.filter((b) => b.type === "question");
/** Where a finding about question `q` points. */
export const at = (q) => ({ blockId: q.id, questionId: q.id });
