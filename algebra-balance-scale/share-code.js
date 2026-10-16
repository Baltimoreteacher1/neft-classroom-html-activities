/**
 * Short share codes for student-made puzzles. A code is nine characters such as
 * "4QK-M2B-7VD": a puzzle spec packed into 45 bits, no server, no names, no text.
 * The alphabet leaves out I, L, O and U so a code read aloud or copied by hand
 * survives, and an 8-bit check value turns any single mistyped character into
 * "that code does not look right" instead of a different puzzle.
 */
import { RELATIONS } from "./balance-model.js";
import { LIMITS, validatePuzzle } from "./puzzles.js";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const VERSION = 1n;
const LENGTH = 9;
const CHECK_MOD = 251n;
const OFFSET = BigInt(LIMITS.constant);

// [field, bits] from the most significant end.
const LAYOUT = [
  ["rel", 3],
  ["v", 3],
  ["q", 4],
  ["la", 4],
  ["ra", 4],
  ["lb", 8],
  ["rb", 8],
];
const DATA_BITS = LAYOUT.reduce((sum, [, bits]) => sum + bits, 0);

function pack(spec) {
  const values = {
    rel: RELATIONS.indexOf(spec.rel),
    v: spec.v,
    q: spec.q - 1,
    la: spec.l.a,
    ra: spec.r.a,
    lb: spec.l.b + LIMITS.constant,
    rb: spec.r.b + LIMITS.constant,
  };
  let data = 0n;
  for (const [field, bits] of LAYOUT) data = (data << BigInt(bits)) | BigInt(values[field]);
  return data;
}

function unpack(data) {
  const values = {};
  let rest = data;
  for (const [field, bits] of [...LAYOUT].reverse()) {
    const mask = (1n << BigInt(bits)) - 1n;
    values[field] = Number(rest & mask);
    rest >>= BigInt(bits);
  }
  return {
    rel: RELATIONS[values.rel],
    v: values.v,
    q: values.q + 1,
    l: { a: values.la, b: values.lb - Number(OFFSET) },
    r: { a: values.ra, b: values.rb - Number(OFFSET) },
  };
}

/** Normalizes what a student typed or pasted: case, spaces, hyphens and look-alike letters. */
export function normalizeCode(text) {
  return String(text)
    .toUpperCase()
    .replace(/[\s\-_]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1")
    .replace(/U/g, "V");
}

/** Spec -> "4QK-M2B-7VD". Throws on a spec the validator would reject. */
export function encodePuzzle(spec) {
  if (!validatePuzzle(spec).ok) throw new RangeError("puzzle is not valid");
  const data = pack(spec);
  const full = (VERSION << BigInt(DATA_BITS + 8)) | (data << 8n) | (data % CHECK_MOD);
  let chars = "";
  let rest = full;
  for (let i = 0; i < LENGTH; i += 1) {
    chars = ALPHABET[Number(rest & 31n)] + chars;
    rest >>= 5n;
  }
  return `${chars.slice(0, 3)}-${chars.slice(3, 6)}-${chars.slice(6)}`;
}

/** Code -> { ok: true, spec } or { ok: false, reason } for a friendly message. */
export function decodePuzzle(text) {
  const code = normalizeCode(text);
  if (code.length !== LENGTH) return { ok: false, reason: "length" };
  let full = 0n;
  for (const ch of code) {
    const digit = ALPHABET.indexOf(ch);
    if (digit < 0) return { ok: false, reason: "chars" };
    full = (full << 5n) | BigInt(digit);
  }
  const check = full & 255n;
  const data = (full >> 8n) & ((1n << BigInt(DATA_BITS)) - 1n);
  const versionOk = full >> BigInt(DATA_BITS + 8) === VERSION;
  if (!versionOk || data % CHECK_MOD !== check) return { ok: false, reason: "checksum" };
  const spec = unpack(data);
  const verdict = validatePuzzle(spec);
  return verdict.ok ? { ok: true, spec } : { ok: false, reason: "invalid" };
}
