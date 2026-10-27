// Integer polynomials in x up to degree 2, stored as [constant, x, x^2]. Used by the algebra area models and tiles.
// @fm2 FM-058 FM-050
export const polyMul = (a, b) => {
  const out = [0, 0, 0];
  a.forEach((p, i) => b.forEach((q, j) => {
    if (i + j > 2) throw new RangeError("Only polynomials up to x^2 are supported.");
    out[i + j] += p * q;
  }));
  return out;
};
export const polyEq = (a, b) => [0, 1, 2].every((i) => (a[i] || 0) === (b[i] || 0));
export const polyAdd = (...list) => [0, 1, 2].map((i) => list.reduce((sum, p) => sum + (p[i] || 0), 0));

const MINUS = "−";

// "x", "3x", "-5", "x^2", "x²", "2x^2 + 3x - 4" -> [c0, c1, c2]; null when the text is not such an expression.
export function polyParse(text) {
  const raw = String(text ?? "").toLowerCase().replaceAll(MINUS, "-").replaceAll("²", "^2").replace(/[\s·*]/g, "");
  if (!raw || raw.length > 40) return null;
  const out = [0, 0, 0];
  const term = /([+-]?)(\d*)(x\^2|x)?/y;
  let at = 0;
  while (at < raw.length) {
    term.lastIndex = at;
    const m = term.exec(raw);
    if (!m || m[0] === "" || (m[2] === "" && !m[3])) return null;
    if (at > 0 && !m[1]) return null;
    const coef = (m[2] === "" ? 1 : Number(m[2])) * (m[1] === "-" ? -1 : 1);
    out[m[3] === "x^2" ? 2 : m[3] === "x" ? 1 : 0] += coef;
    at = term.lastIndex;
  }
  return out;
}

// [3, 5, 1] -> "x² + 5x + 3"; negative terms use a true minus sign.
export function polyText(p) {
  const terms = [];
  for (const power of [2, 1, 0]) {
    const c = p[power] || 0;
    if (!c) continue;
    const body = power === 0 ? String(Math.abs(c)) : `${Math.abs(c) === 1 ? "" : Math.abs(c)}x${power === 2 ? "²" : ""}`;
    terms.push({ sign: c < 0 ? -1 : 1, body });
  }
  if (!terms.length) return "0";
  return terms.map((t, i) => (i === 0 ? (t.sign < 0 ? `${MINUS}${t.body}` : t.body) : `${t.sign < 0 ? MINUS : "+"} ${t.body}`)).join(" ");
}
