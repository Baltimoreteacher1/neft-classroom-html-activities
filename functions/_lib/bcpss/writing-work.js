// Writing Lab student work: the one validator for what a student's device sends to be turned into a Word/PDF file.
// The browser posts the same {section: {field: value}} object it keeps in localStorage (bcpss-writing:<unit>).
// Nothing is stored: the endpoint renders it and returns the file. Shapes follow bcpss-teachers/writing-lab/wl-steps-*.js.

export const WORK_SECTIONS = [
  "notes",
  "bbs",
  "expand",
  "frag",
  "appos",
  "sub",
  "spo",
  "draft",
  "revise",
  "pub",
  "mpo",
];

const FIELD_KEY = /^[A-Za-z0-9]{1,16}$/;
const MAX_TEXT = 6000;
const MAX_FIELDS = 120;
const MAX_LIST = 16;

/** Drops control characters (keeps tab/newline), trims, caps length. */
export function cleanText(value) {
  let out = "";
  for (const ch of String(value ?? "")) {
    const code = ch.codePointAt(0);
    if (code === 9 || code === 10 || code >= 32) out += ch;
  }
  return out.replace(/\r\n?/g, "\n").trim().slice(0, MAX_TEXT);
}

function cleanValue(value) {
  if (typeof value === "string") return cleanText(value);
  if (typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.min(9, value));
  if (Array.isArray(value))
    return value
      .filter((v) => typeof v === "string")
      .slice(0, MAX_LIST)
      .map(cleanText)
      .filter(Boolean);
  // Starter match-up progress: { because: true, but: true, so: true }.
  if (value && typeof value === "object") {
    const flags = {};
    for (const k of ["because", "but", "so"]) if (value[k] === true) flags[k] = true;
    return flags;
  }
  return undefined;
}

/** { ok:true, work } or { ok:false, error }. Unknown sections and malformed fields are dropped, never echoed. */
export function sanitizeWork(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    return { ok: false, error: "work must be an object." };
  const work = {};
  let fields = 0;
  for (const section of WORK_SECTIONS) {
    const src = raw[section];
    if (!src || typeof src !== "object" || Array.isArray(src)) continue;
    const out = {};
    for (const [key, value] of Object.entries(src)) {
      if (!FIELD_KEY.test(key)) continue;
      const clean = cleanValue(value);
      if (clean === undefined || clean === "" || (Array.isArray(clean) && !clean.length)) continue;
      if (++fields > MAX_FIELDS) return { ok: false, error: "work has too many fields." };
      out[key] = clean;
    }
    work[section] = out;
  }
  return { ok: true, work };
}
