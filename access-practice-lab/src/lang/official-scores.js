// Official ACCESS for ELLs results, typed in by a teacher from the score report, kept on the
// teacher's device, and shown NEXT TO the practice evidence, never merged with it. The lab does not
// compute, estimate or predict any official result: this module only validates what was typed and
// reports the difference between two reported levels. A reported level is a number from 1.0 to 6.0.

export const OFFICIAL_DOMAINS = Object.freeze(["Listening", "Speaking", "Reading", "Writing"]);
export const LEVEL_MIN = 1;
export const LEVEL_MAX = 6;
export const OFFICIAL_NOTE = {
  en: "Official results are entered by the teacher from the score report. They are shown beside the practice evidence and are never combined with it. A difference between two years is arithmetic on two reported levels. It is not a growth target, a prediction or a placement.",
  es: "Los resultados oficiales los anota la maestra o el maestro desde el informe de puntajes. Se muestran junto a la evidencia de práctica y nunca se combinan con ella. La diferencia entre dos años es solo una resta de dos niveles reportados. No es una meta de crecimiento, una predicción ni una colocación.",
};

/** A reported level as a number with one decimal in 1.0–6.0, or null for anything else (blank included). */
export function parseLevel(value) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).trim();
  if (!/^\d(?:\.\d)?$/.test(text)) return null;
  const n = Number(text);
  return n >= LEVEL_MIN && n <= LEVEL_MAX ? n : null;
}

/** "2025-26" or "2025-2026" → "2025-26"; the second year must follow the first. */
export function parseYear(value) {
  const m = String(value ?? "").trim().match(/^(\d{4})\s*[-–/]\s*(\d{2}|\d{4})$/);
  if (!m) return null;
  const start = Number(m[1]);
  const end = m[2].length === 2 ? Number(`${String(start).slice(0, 2)}${m[2]}`) : Number(m[2]);
  return end === start + 1 && start >= 2000 && start <= 2100 ? `${start}-${String(end).slice(2)}` : null;
}

/**
 * Validate one typed result. Returns `{ ok, value, errors }`; a blank domain is allowed (a student may
 * have no Speaking result yet) but a result with no level at all is not.
 */
export function makeResult({ year, levels = {}, overall = "" } = {}) {
  const errors = [];
  const y = parseYear(year);
  if (!y) errors.push("Enter the school year as 2025-26.");
  const out = {};
  for (const d of OFFICIAL_DOMAINS) {
    const raw = levels[d];
    if (raw === "" || raw === undefined || raw === null) continue;
    const n = parseLevel(raw);
    if (n === null) errors.push(`${d}: enter a level from 1.0 to 6.0 with at most one decimal.`);
    else out[d] = n;
  }
  const o = parseLevel(overall);
  if (overall !== "" && overall != null && o === null) errors.push("Overall: enter a level from 1.0 to 6.0 with at most one decimal.");
  if (!Object.keys(out).length && o === null) errors.push("Enter at least one level.");
  return errors.length ? { ok: false, errors } : { ok: true, errors, value: { year: y, levels: out, overall: o } };
}

/** Replace the result for the same school year, keep the list oldest first. Never mutates its input. */
export function upsertResult(list, result) {
  return [...(Array.isArray(list) ? list : []).filter((r) => r.year !== result.year), result].sort((a, b) => a.year.localeCompare(b.year));
}

const diff = (from, to) => (from == null || to == null ? null : Math.round((to - from) * 10) / 10);
const direction = (change) => (change === null ? "none" : change > 0 ? "up" : change < 0 ? "down" : "same");

/** Differences between each pair of consecutive years, by domain and for the overall as reported. */
export function growth(list) {
  const rows = [...(Array.isArray(list) ? list : [])].sort((a, b) => a.year.localeCompare(b.year));
  const pairs = [];
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1];
    const b = rows[i];
    const domains = Object.fromEntries(
      OFFICIAL_DOMAINS.map((d) => {
        const change = diff(a.levels?.[d], b.levels?.[d]);
        return [d, { from: a.levels?.[d] ?? null, to: b.levels?.[d] ?? null, change, direction: direction(change) }];
      }),
    );
    const change = diff(a.overall, b.overall);
    pairs.push({ from: a.year, to: b.year, domains, overall: { from: a.overall ?? null, to: b.overall ?? null, change, direction: direction(change) } });
  }
  return pairs;
}
