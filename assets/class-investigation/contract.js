// Our Class Investigation — the data contract.
//
// Pure functions, no DOM and no network: the browser validates with these before
// it queues a contribution, and the Pages Function validates again with the very
// same code before it writes a row. A payload the client would never build (a
// hand-made curl, a script, a student with DevTools) meets the same rules.
//
// Every rule here protects one of three things:
//   1. NO PII. Only declared fields are accepted, and a declared field is a
//      number in a range or one id from a list. There is nowhere to put a name.
//   2. A TRUE DATASET. Ranges, steps and types keep "300 steps" and "banana"
//      out of the class's statistics.
//   3. A BOUNDED ONE. Sizes and counts are capped so a loop cannot fill a table.

import { activeFields, getTemplate, resolveOptions } from "./templates.js";

export const LIMITS = Object.freeze({
  /** Contributions held for one investigation (a class, or several sections). */
  maxEntriesPerInvestigation: 600,
  /** Investigations a single class code may hold across the year. */
  maxInvestigationsPerClass: 12,
  /** A request body above this is refused before it is parsed. */
  maxBodyBytes: 4_096,
  /** Days a class is kept after the last contribution or teacher action. */
  retentionDays: 300,
  /** Entries returned in one read. */
  maxEntriesPerRead: 600,
});

// Unambiguous alphabet: no O/0, no I/1/L. A code is read off a board and typed
// on a Chromebook; one that is hard to transcribe becomes a support request.
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;
const CODE_RE = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);
const ENTRY_ID_RE = /^[a-f0-9]{24,40}$/;
const CLIENT_ID_RE = /^[a-f0-9]{24,64}$/;

export const SOURCES = Object.freeze(["class", "home"]);

/** What a person typed -> the canonical code, or "" when it cannot be one. */
export function normalizeClassCode(raw) {
  const text = String(raw ?? "")
    .toUpperCase()
    .replace(/[\s-]+/g, "");
  return CODE_RE.test(text) ? text : "";
}

export const isClassCode = (code) => typeof code === "string" && CODE_RE.test(code);
export const isEntryId = (id) => typeof id === "string" && ENTRY_ID_RE.test(id);
export const isClientId = (id) => typeof id === "string" && CLIENT_ID_RE.test(id);

/** `ABC-DEF`, for reading aloud and for the board. */
export const displayCode = (code) => `${code.slice(0, 3)}-${code.slice(3)}`;

/** @param {Uint8Array} bytes random bytes, at least CODE_LENGTH long */
export function codeFromBytes(bytes) {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

/** 24 random hex characters: an idempotency key or a local contributor id. */
export function randomHex(bytesLength = 12, cryptoImpl = globalThis.crypto) {
  const bytes = new Uint8Array(bytesLength);
  cryptoImpl.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * The only way a device is known to the server: a salted hash of a random id
 * that lives in that browser. The server never stores or returns the id itself,
 * and without the class salt (and the optional pepper) the hash cannot be
 * recomputed from a guess. It identifies "the same browser", never a person.
 * @param {string} classSalt per-class random salt, stored with the class
 * @param {string} pepper optional deployment secret ("" when unset)
 * @param {string} clientId
 */
export async function contributorHash(
  classSalt,
  pepper,
  clientId,
  subtle = globalThis.crypto.subtle,
) {
  const data = new TextEncoder().encode(`ewl-class-data|${classSalt}|${pepper}|${clientId}`);
  const digest = new Uint8Array(await subtle.digest("SHA-256", data));
  return Array.from(digest.slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/** Whole-number multiple of `step` (0.5, 1, ...) without float drift. */
function onStep(value, step) {
  const q = value / step;
  return Math.abs(q - Math.round(q)) < 1e-9;
}

/**
 * Check one field value. Returns `{ ok: true, value }` or `{ ok: false, error }`
 * where error is a stable code the client turns into a friendly sentence.
 * @param {import("./templates.js").Field} field
 * @param {unknown} raw
 */
export function validateFieldValue(field, raw) {
  if (field.kind === "choice") {
    const ids = (field.choices ?? []).map((c) => c.id);
    return typeof raw === "string" && ids.includes(raw)
      ? { ok: true, value: raw }
      : { ok: false, error: "bad-choice" };
  }
  if (typeof raw !== "number" || !Number.isFinite(raw)) return { ok: false, error: "not-a-number" };
  const { min = -Infinity, max = Infinity, step = 1 } = field;
  if (raw < min) return { ok: false, error: "too-small" };
  if (raw > max) return { ok: false, error: "too-large" };
  if (!onStep(raw, step)) return { ok: false, error: "bad-step" };
  return { ok: true, value: raw };
}

/**
 * Whether a valid value still looks surprising for a Grade 6 class. The form
 * asks "is this right?" before sending; the server does not refuse these.
 * @param {import("./templates.js").Field} field
 * @param {number} value
 */
export function isUnusual(field, value) {
  if (field.kind !== "number") return false;
  if (field.likelyMin != null && value < field.likelyMin) return true;
  if (field.likelyMax != null && value > field.likelyMax) return true;
  return false;
}

/**
 * Validate the `values` object of a contribution against a template + options.
 * Strict: every key must be a declared, currently-active field.
 * @returns {{ ok: true, values: Record<string, number|string> } | { ok: false, error: string, field?: string }}
 */
export function validateValues(templateId, options, values) {
  const template = getTemplate(templateId);
  if (!template) return { ok: false, error: "bad-template" };
  if (!isPlainObject(values)) return { ok: false, error: "bad-values" };
  const fields = activeFields(template, resolveOptions(template, options));
  const allowed = new Set(fields.map((f) => f.id));
  for (const key of Object.keys(values)) {
    if (!allowed.has(key)) return { ok: false, error: "unknown-field", field: key.slice(0, 24) };
  }
  /** @type {Record<string, number|string>} */
  const clean = {};
  for (const field of fields) {
    const present = Object.hasOwn(values, field.id) && values[field.id] !== null;
    if (!present) {
      if (field.optional) continue;
      return { ok: false, error: "missing-field", field: field.id };
    }
    const r = validateFieldValue(field, values[field.id]);
    if (!r.ok) return { ok: false, error: r.error, field: field.id };
    clean[field.id] = r.value;
  }
  return { ok: true, values: clean };
}

const CONTRIBUTE_KEYS = ["code", "templateId", "entryId", "clientId", "source", "values"];

/**
 * Validate the request body of a contribution (everything except the options
 * check, which needs the class row). Unknown top-level keys are refused: an
 * extra `name` property must not be silently ignored, it must be a visible 400.
 * @returns {{ ok: true, value: { code: string, templateId: string, entryId: string, clientId: string, source: string, values: unknown } } | { ok: false, error: string }}
 */
export function validateContributionShape(body) {
  if (!isPlainObject(body)) return { ok: false, error: "bad-body" };
  for (const key of Object.keys(body)) {
    if (!CONTRIBUTE_KEYS.includes(key)) return { ok: false, error: "unexpected-field" };
  }
  const code = normalizeClassCode(body.code);
  if (!code) return { ok: false, error: "bad-code" };
  if (!getTemplate(body.templateId)) return { ok: false, error: "bad-template" };
  if (!isEntryId(body.entryId)) return { ok: false, error: "bad-entry-id" };
  if (!isClientId(body.clientId)) return { ok: false, error: "bad-client-id" };
  if (!SOURCES.includes(body.source)) return { ok: false, error: "bad-source" };
  return {
    ok: true,
    value: {
      code,
      templateId: body.templateId,
      entryId: body.entryId,
      clientId: body.clientId,
      source: body.source,
      values: body.values,
    },
  };
}

/**
 * Teacher-chosen options for an investigation: only the template's own boolean
 * options, nothing else.
 * @returns {{ ok: true, options: Record<string, boolean> } | { ok: false, error: string }}
 */
export function validateOptions(templateId, given) {
  const template = getTemplate(templateId);
  if (!template) return { ok: false, error: "bad-template" };
  if (given === undefined || given === null)
    return { ok: true, options: resolveOptions(template, {}) };
  if (!isPlainObject(given)) return { ok: false, error: "bad-options" };
  const known = new Set(template.options.map((o) => o.id));
  for (const [key, val] of Object.entries(given)) {
    if (!known.has(key) || typeof val !== "boolean") return { ok: false, error: "bad-options" };
  }
  return { ok: true, options: resolveOptions(template, given) };
}

/** A CSV cell that a spreadsheet will never run as a formula. */
export function csvCell(value) {
  const text = String(value ?? "");
  const safe = /^[=+\-@\t\r]/.test(text) && Number.isNaN(Number(text)) ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/**
 * The teacher export: one row per contribution, one column per active field, and
 * nothing that identifies a device. Rows are in arrival order.
 * @param {string} templateId
 * @param {Record<string, boolean>} options
 * @param {{ values: Record<string, unknown>, source: string, day: string }[]} entries
 */
export function entriesToCsv(templateId, options, entries) {
  const template = getTemplate(templateId);
  if (!template) return "";
  const fields = activeFields(template, resolveOptions(template, options));
  const head = ["n", "day", "source", ...fields.map((f) => f.id)];
  const rows = entries.map((e, i) =>
    [i + 1, e.day, e.source, ...fields.map((f) => e.values[f.id] ?? "")].map(csvCell).join(","),
  );
  return `${[head.map(csvCell).join(","), ...rows].join("\n")}\n`;
}
