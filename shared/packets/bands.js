// Mixed-band class packets: bands, band counts and the opaque variant codes.
// Plain browser-safe ESM: used by the Pages Function, the document builders and the Studio view.
//
// A "band" is a WIDA-inspired support band (1_2, 3_4, 5_6). It is a TEACHER-SIDE idea. The only place a band
// is decoded is the teacher cover sheet; a student paper carries just its opaque variant code (for example "K7").
// Inspired by WIDA ACCESS, not official, not a score, not a placement tool.

export const BANDS = Object.freeze(["1_2", "3_4", "5_6"]);
export const BAND_LABEL = Object.freeze({
  "1_2": "Levels 1–2",
  "3_4": "Levels 3–4",
  "5_6": "Levels 5–6",
});
export const MAX_PER_BAND = 60;
export const NOT_A_SCORE =
  "Inspired by WIDA ACCESS. Not official, not a score, not a placement tool.";

export const isBand = (v) => BANDS.includes(v);

/**
 * Band counts from "1_2:8,3_4:12,5_6:5" (a string) or { "1_2": 8, ... } (an object).
 * Every band is optional (missing = 0); every count must be a whole number 0..MAX_PER_BAND; at least one student.
 * Returns { ok:true, counts } or { ok:false, error }. Never throws.
 */
export function parseCounts(input) {
  let raw = input;
  if (typeof input === "string") {
    raw = {};
    for (const part of input.split(",")) {
      const [band, n, extra] = part.split(":").map((s) => s.trim());
      if (!band && !n) continue;
      if (extra !== undefined || n === undefined)
        return { ok: false, error: `bad counts entry "${part}"` };
      if (Object.hasOwn(raw, band)) return { ok: false, error: `band ${band} given twice` };
      raw[band] = n;
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "counts must be a string like 1_2:8,3_4:12,5_6:5" };
  }
  const counts = { "1_2": 0, "3_4": 0, "5_6": 0 };
  for (const [band, value] of Object.entries(raw)) {
    if (!isBand(band)) return { ok: false, error: `unknown band "${band}"` };
    const s = String(value).trim();
    if (!/^\d{1,3}$/.test(s))
      return { ok: false, error: `count for ${band} must be a whole number` };
    const n = Number(s);
    if (n > MAX_PER_BAND) return { ok: false, error: `count for ${band} is over ${MAX_PER_BAND}` };
    counts[band] = n;
  }
  if (BANDS.every((b) => counts[b] === 0))
    return { ok: false, error: "enter at least one student" };
  return { ok: true, counts };
}

export const countsToString = (counts) => BANDS.map((b) => `${b}:${counts[b] || 0}`).join(",");

// ---- opaque variant codes -----------------------------------------------------------------------------------
// One consonant (no vowels, so a code never spells a word; no I, L, O, Q, U, Y: easy to misread) plus one digit 2-9.
const LETTERS = "BCDFGHJKMNPRSTVWXZ";
const DIGITS = "23456789";
export const CODE_RE = /^[BCDFGHJKMNPRSTVWXZ][2-9]$/;

function fnv(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/**
 * { "1_2": "K7", "3_4": "M3", "5_6": "T9" } for a unit. Deterministic (the same unit always gets the same codes),
 * distinct within the unit, and carrying no order: a code never reveals which band it belongs to.
 */
export function variantCodes(unitId) {
  const out = {};
  const used = new Set();
  for (const band of BANDS) {
    for (let salt = 0; ; salt++) {
      const h = fnv(`packet-variant:${unitId}:${band}:${salt}`);
      const code = `${LETTERS[h % LETTERS.length]}${DIGITS[Math.floor(h / LETTERS.length) % DIGITS.length]}`;
      if (!used.has(code)) {
        used.add(code);
        out[band] = code;
        break;
      }
    }
  }
  return out;
}
