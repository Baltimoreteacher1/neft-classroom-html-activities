// Small pure helpers shared by every adapter and the registry. No DOM, no fs, no network: runs in Node and in the
// browser. Everything an adapter writes into a draft is deterministic: the same source always gives the same draft.

/** A teacher-visible string pair. */
export const t = (en, es) => ({ en, es });

const isPlain = (v) => v && typeof v === "object" && !Array.isArray(v);

/** JSON with sorted keys, so equal data always serializes to the same text. */
export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (isPlain(value))
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
      .join(",")}}`;
  return JSON.stringify(value ?? null);
}

/** cyrb53: a fast, well-mixed 53-bit string hash. A change fingerprint, not a security feature. */
function cyrb53(str) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** Fingerprint of a source value (<= 24 chars, the schema's `lineage.sourceHash` limit). Key order does not matter. */
export const hashSource = (value) => cyrb53(stableStringify(value)).toString(16).padStart(14, "0");

/** Stable small hash to int, for deterministic option positions. */
export function seedOf(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
export const rotate = (arr, by) => arr.map((_, i) => arr[(i + by) % arr.length]);

/**
 * Split text into pieces of at most `max` characters, at paragraph, sentence, then word boundaries.
 * Joining the pieces with a space (or newline) gives the text back: nothing is dropped.
 */
export function chunkText(text, max) {
  const s = String(text ?? "").trim();
  if (!s) return [];
  if (s.length <= max) return [s];
  const pieces = s.split(/(?<=[.!?])\s+/);
  const out = [];
  let cur = "";
  const push = () => {
    if (cur) out.push(cur);
    cur = "";
  };
  for (const raw of pieces) {
    let piece = raw;
    while (piece.length > max) {
      const cut = piece.lastIndexOf(" ", max);
      const at = cut > 0 ? cut : max;
      push();
      out.push(piece.slice(0, at).trim());
      piece = piece.slice(at).trim();
    }
    if (cur && cur.length + 1 + piece.length > max) push();
    cur = cur ? `${cur} ${piece}` : piece;
  }
  push();
  return out;
}

/** Pack `lines` into the fewest strings of at most `max` characters each (a line is never split here). */
export function packLines(lines, max, sep = "\n") {
  const out = [];
  let cur = "";
  for (const line of lines) {
    if (cur && cur.length + sep.length + line.length > max) {
      out.push(cur);
      cur = "";
    }
    cur = cur ? `${cur}${sep}${line}` : line;
  }
  if (cur) out.push(cur);
  return out;
}

/** Split n items into the fewest balanced groups of at most `max` (every group has at least two when n >= 2). */
export function balancedGroups(items, max = 6) {
  const n = items.length;
  if (!n) return [];
  const k = Math.ceil(n / max);
  const base = Math.floor(n / k);
  let extra = n % k;
  const out = [];
  let at = 0;
  for (let g = 0; g < k; g++) {
    const size = base + (extra > 0 ? 1 : 0);
    extra -= 1;
    out.push(items.slice(at, at + size));
    at += size;
  }
  return out;
}

export const list = (v) => (Array.isArray(v) ? v : []);
export const text = (v) => String(v ?? "").trim();

/** `fetchJson(url)` (resolves parsed JSON, throws on failure) as the Response-shaped fetch that core/curriculum.js takes. */
export const asFetch = (fetchJson) => async (url) => ({ ok: true, json: () => fetchJson(url) });

/** Teacher-only note blocks (each within the schema's note limit) carrying `lines`; ids start with `n` and end with `id`. */
export const noteBlocks = (id, lines, max = 1200) =>
  packLines(lines, max, "\n\n").map((body, n) => ({
    type: "note",
    id: `n${n ? n + 1 : ""}-${id}`.slice(0, 32),
    text: body,
  }));

/** Shorten at the last sentence (or word) boundary that fits `max`, ending in "..."; text that fits is returned as is. */
export function shorten(value, max) {
  const v = String(value ?? "").trim();
  if (v.length <= max) return v;
  const cut = v.slice(0, max);
  const sentence = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (sentence > max / 3) return cut.slice(0, sentence + 1);
  const short = v.slice(0, max - 3);
  const word = short.lastIndexOf(" ");
  return `${short.slice(0, word > 0 ? word : max - 3).trimEnd()}...`;
}

const TABLE = { rows: 20, cols: 6, cell: 80, caption: 200 };

/**
 * A table block when the table fits the schema (<= 20 rows, 6 columns, 80 characters a cell, 200 for the caption).
 * A long caption becomes a text block before the table. A table with a long cell or too many rows or columns becomes
 * a text block of "Column: value" lines instead, so no text is clipped; `flags` gets "table-as-text" when that happens.
 */
export function tableBlocks(id, caption, headers, rows, flags = new Set()) {
  const fits =
    rows.length <= TABLE.rows &&
    headers.length <= TABLE.cols &&
    rows.every((r) => r.length <= TABLE.cols && r.every((c) => c.length <= TABLE.cell)) &&
    headers.every((h) => h.length <= 60);
  const cid = `cap-${id}`.slice(0, 32);
  if (!fits) {
    flags.add("table-as-text");
    const lines = rows.map((r) => r.map((c, i) => `${headers[i] || `Column ${i + 1}`}: ${c}`).join(" | "));
    return [{ type: "text", id: cid, role: "body", text: [caption, ...lines].filter(Boolean).join("\n\n") }];
  }
  const long = caption.length > TABLE.caption;
  const table = { type: "table", id, headers, rows, caption: long ? "" : caption };
  return long ? [{ type: "text", id: cid, role: "body", text: caption }, table] : [table];
}
