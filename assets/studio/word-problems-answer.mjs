// How a typed word-problem answer is read. Shared by the page runtime (assets/studio/word-problems.mjs)
// and the authoring gate (scripts/lib/word-problems-data.mjs), so the key and the check can never disagree.

/** "12", "-3.5", "$1,200", "3/4", "1 1/2", "−7", "18 pencils" -> number, or NaN. */
export function parseAnswer(/** @type {any} */ v) {
  const t = String(v ?? "")
    .trim()
    .replace(/−/g, "-")
    .replace(/^\$\s*/, "")
    .replace(/(\d),(?=\d{3}\b)/g, "$1")
    .replace(/\s*(%|[a-záéíóúñ][a-záéíóúñ .²³]*)$/i, "")
    .trim();
  let m = t.match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/);
  if (m) return (m[1] ? -1 : 1) * (Number(m[2]) + Number(m[3]) / Number(m[4]));
  m = t.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (m && Number(m[2]) !== 0) return Number(m[1]) / Number(m[2]);
  return /^-?(\d+(\.\d*)?|\.\d+)$/.test(t) ? Number(t) : Number.NaN;
}

/** True when two answers name the same number (1.50 = 1.5, 3/4 = 0.75). */
export const sameValue = (/** @type {number} */ a, /** @type {number} */ b) =>
  Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
