// Turns a typed or authored problem ("15 + 8", "-4 + 7", "6 x 8", "3/4", "2x + 4 = 12")
// into the manipulative that models it. Pure: no DOM, no workbench state.

export const LIMITS = {
  counters: 30, // largest ten-frame board
  chips: 30,
  rows: 15,
  cols: 20,
  maxDenominator: 16,
  magnitude: 9999,
};

const NUM = String.raw`-?\d+(?:\.\d+)?`;
const TAIL = String.raw`\s*(?:=\s*\??\s*)?$`;

const normalize = (text) =>
  String(text ?? "")
    .replace(/[−–—]/g, "-")
    .replace(/×/g, "*")
    .replace(/(\d),(?=\d{3}\b)/g, "$1")
    .trim();

const isWhole = (s) => /^-?\d+$/.test(s);

function parseEquation(text, strict) {
  const lead = strict ? "^\\s*" : "";
  const tail = strict ? "\\s*$" : "";
  const m = text.match(
    new RegExp(`${lead}(-?\\d*)\\s*x(?:\\s*([+-])\\s*(\\d+))?\\s*=\\s*(-?\\d+)${tail}`, "i"),
  );
  if (!m) return null;
  const coeff = m[1] === "" ? 1 : m[1] === "-" ? -1 : Number(m[1]);
  if (coeff === 0) return { error: "The number in front of x can't be 0." };
  const constant = m[2] ? (m[2] === "-" ? -Number(m[3]) : Number(m[3])) : 0;
  return { tool: "balance", coeff, constant, rhs: Number(m[4]) };
}

function parseFractions(text, strict) {
  const found = [...text.matchAll(/(\d+)\s*\/\s*(\d+)/g)];
  if (!found.length) return null;
  if (strict && !/^[\d\s/+*x=?.-]+$/i.test(text)) return null;
  const fractions = found.slice(0, 4).map((m) => ({ n: Number(m[1]), d: Number(m[2]) }));
  const bad = fractions.find((f) => f.d < 2 || f.d > LIMITS.maxDenominator);
  if (bad) return { error: `Fraction strips use denominators from 2 to ${LIMITS.maxDenominator}.` };
  return {
    tool: "fractions",
    fractions: fractions.map((f) => ({ n: Math.min(f.n, f.d), d: f.d })),
  };
}

function parseBinary(text, strict) {
  const m = text.match(
    new RegExp(`^\\s*(${NUM})\\s*([+*x-])\\s*(${NUM})${strict ? TAIL : ""}`, "i"),
  );
  if (!m) return null;
  if (!isWhole(m[1]) || !isWhole(m[3]))
    return { error: "Use whole numbers (no decimals) for these tools." };
  const a = Number(m[1]);
  const b = Number(m[3]);
  if (Math.abs(a) > LIMITS.magnitude || Math.abs(b) > LIMITS.magnitude) {
    return { error: `Keep numbers between -${LIMITS.magnitude} and ${LIMITS.magnitude}.` };
  }
  const op = m[2].toLowerCase() === "x" ? "*" : m[2];
  return route(op, a, b);
}

function route(op, a, b) {
  if (op === "*") {
    if (b < 2 && a >= 2) [a, b] = [b, a];
    if (a < 1 || b < 2 || a > LIMITS.rows || b > LIMITS.cols) {
      return {
        error: `The area model fits ${LIMITS.rows} rows by ${LIMITS.cols} columns (try 6 x 8).`,
      };
    }
    return { tool: "array", rows: a, cols: b };
  }
  const second = op === "-" ? -b : b;
  if (a < 0 || b < 0 || (op === "-" && a < b)) {
    const pos = Math.max(a, 0) + Math.max(second, 0);
    const neg = Math.max(-a, 0) + Math.max(-second, 0);
    return {
      tool: "integers",
      first: a,
      pos: Math.min(pos, LIMITS.chips),
      neg: Math.min(neg, LIMITS.chips),
    };
  }
  if (op === "+" && a + b <= LIMITS.counters) return { tool: "counters", a, b };
  if (op === "-" && a <= LIMITS.counters) return { tool: "counters", a, b: 0, takeAway: b };
  return { tool: "numberline", start: a, jump: second };
}

// strict: the whole text must be the expression (typed entry). Loose: an authored question
// that merely starts with one, e.g. "34 + 18 = ?" or "Solve 2x + 4 = 12".
// Returns { tool, ... }, { error }, or null when nothing recognisable is there.
export function parseProblem(raw, { strict = false } = {}) {
  const text = normalize(raw);
  if (!text) return null;
  if (text.includes("=") && /x/i.test(text)) {
    const eq = parseEquation(text, strict);
    if (eq) return eq;
  }
  return parseBinary(text, strict) ?? parseFractions(text, strict);
}
