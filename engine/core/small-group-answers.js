// Single source of truth for student answer checking across the small-group
// studio (final answers, guided fill-in steps, step-guide blanks). Tolerant of
// the ways grade-6 students actually type math — $ and comma formatting,
// fractions ("3/4"), mixed numbers ("1 1/2"), × vs x, trailing units — while
// never crediting a bare number against a non-numeric answer like "2 × 3 × 7".

export const norm = (value) =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[×·*]/g, "x")
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[.,;:]+$/, "")
    .replace(/(\d),(?=\d{3}(?!\d))/g, "$1")
    .replace(/\s*([x+\-=:/(),<>≤≥])\s*/g, "$1")
    .replace(/(\d)\s*r\s*(\d)/g, "$1r$2");

// Strict full-string numeric parse: mixed number, fraction, or plain number
// (with optional $ prefix / % suffix). Returns null for anything else — a
// stem like "x + 2 = 4" must never collapse to its first digit.
export const numberOf = (value) => {
  const text = String(value ?? "")
    .replace(/[$,]/g, "")
    .replace(/%\s*$/, "")
    .trim();
  const mixed = text.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const denominator = Number(mixed[4]);
    if (!denominator) return null;
    const sign = mixed[1] === "-" ? -1 : 1;
    return sign * (Number(mixed[2]) + Number(mixed[3]) / denominator);
  }
  const fraction = text.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (fraction && Number(fraction[2]) !== 0) return Number(fraction[1]) / Number(fraction[2]);
  // Accept ".5" as well as "0.5" — students drop the leading zero constantly.
  const plain = text.match(/^-?(?:\d+(?:\.\d+)?|\.\d+)$/);
  return plain ? Number.parseFloat(plain[0]) : null;
};

export function isRight(input, answer) {
  if (answer == null || !String(input ?? "").trim()) return false;
  if (norm(input) === norm(answer)) return true;
  const target = numberOf(answer);
  if (target == null) return false;
  // Students often append the unit ("3.5 meters", "$0.50 per", "0.5/item")
  // — ignore any trailing non-numeric tail before comparing.
  const typed = numberOf(String(input).replace(/[a-z°²³\s./]+$/i, ""));
  return typed != null && Math.abs(typed - target) < 1e-9;
}
