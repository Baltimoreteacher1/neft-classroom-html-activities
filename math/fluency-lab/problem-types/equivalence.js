// Mathematically equivalent responses for the 4.0 problem types. A generated item carries an `equiv` descriptor
//   { form: "number" | "percent" | "ratio" | "point" | "clock" | "text",
//     value: "n/d" (exact), pair: [..] (ratio / point), minutes: n (clock), texts: [..] (text),
//     simplest?: true (a fraction or ratio must be in lowest terms), accept?: ["int","decimal","fraction","mixed"],
//     units?: ["cm", "square centimeters", ...] (optional trailing words) }
// and checkEquivalent() answers { ok, reason? }. problem-bank.js validateAnswer() delegates here for such items.
// Reasons (never shown as the answer): "empty" | "format" | "wrong" | "not-simplified" | "mixed-improper" | "form".
import { Q, gcd, parseQ } from "./rational.js";

const clean = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("−", "-")
    .replaceAll("–", "-")
    .replace(/\s+/g, " ");

const GROUPED = /^-?\d{1,3}(,\d{3})+(\.\d+)?$/;
export const DEFAULT_ACCEPT = ["int", "decimal", "fraction", "mixed"];

function stripUnits(text, units = []) {
  let out = text;
  for (const raw of [...units].sort((a, b) => b.length - a.length)) {
    const unit = clean(raw);
    if (unit === "$" && out.startsWith("$")) out = out.slice(1).trim();
    else if (unit !== "$" && out.endsWith(unit)) {
      const rest = out.slice(0, -unit.length).trim();
      if (/\d$/.test(rest) || /^-?[\d./ ]+$/.test(rest)) out = rest;
    }
  }
  return out.replace(/\.$/, "").trim();
}

// Reads one number: integer, decimal, fraction or mixed number. Returns { q, shape, reduced } or { error }.
export function readNumber(raw, eq = {}) {
  let text = clean(raw);
  if (!text) return { error: "empty" };
  text = text.replace(/^[a-z]\s*=\s*/, "").replace(/^answer\s*[:=]?\s*/, "");
  text = stripUnits(text, eq.units);
  if (eq.form === "percent") text = text.replace(/\s*%$/, "");
  text = text.replace(/\s*\/\s*/g, "/").trim();
  if (text.includes(",")) {
    if (!GROUPED.test(text)) return { error: "format" };
    text = text.replaceAll(",", "");
  }
  let m = text.match(/^(-?)(\d+) (\d+)\/(\d+)$/);
  if (m) {
    const [whole, n, d] = [Number(m[2]), Number(m[3]), Number(m[4])];
    if (d === 0) return { error: "format" };
    if (n >= d) return { error: "mixed-improper" };
    return {
      q: Q((m[1] ? -1 : 1) * (whole * d + n), d),
      shape: "mixed",
      reduced: gcd(n, d) === 1 && n > 0,
    };
  }
  m = text.match(/^(-?)(\d+)\/(\d+)$/);
  if (m) {
    const [n, d] = [Number(m[2]), Number(m[3])];
    if (d === 0) return { error: "format" };
    return { q: Q((m[1] ? -1 : 1) * n, d), shape: "fraction", reduced: gcd(n, d) === 1 && d > 1 };
  }
  m = text.match(/^-?(\d+\.?\d*|\.\d+)$/);
  if (m) {
    try {
      return { q: parseQ(text), shape: text.includes(".") ? "decimal" : "int", reduced: true };
    } catch {
      return { error: "format" };
    }
  }
  return { error: "format" };
}

const numeric = (text, eq) => {
  const read = readNumber(text, eq);
  if (read.error) return { ok: false, reason: read.error };
  const accept = eq.accept || DEFAULT_ACCEPT;
  if (!accept.includes(read.shape)) return { ok: false, reason: "form" };
  const key = parseQ(eq.value);
  if (read.q.n !== key.n || read.q.d !== key.d) return { ok: false, reason: "wrong" };
  if (eq.simplest && !read.reduced && (read.shape === "fraction" || read.shape === "mixed"))
    return { ok: false, reason: "not-simplified" };
  return { ok: true };
};

const pairOf = (text, pattern) => {
  const m = text.match(pattern);
  return m ? [m[1], m[2]] : null;
};

export function checkEquivalent(value, item) {
  const eq = item.equiv;
  const text = clean(value);
  if (!text) return { ok: false, reason: "empty" };
  if (eq.form === "ratio") {
    const got = pairOf(text, /^(\d+)\s*(?::|to)\s*(\d+)$/);
    if (!got) return { ok: false, reason: "format" };
    const [a, b] = got.map(Number);
    const [ka, kb] = eq.pair.map(Number);
    if (b === 0 || a * kb !== b * ka) return { ok: false, reason: "wrong" };
    if (eq.simplest && gcd(a, b) !== 1) return { ok: false, reason: "not-simplified" };
    return { ok: true };
  }
  if (eq.form === "point") {
    const m = text.match(/^\(\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*\)$/) || text.match(/^(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)$/);
    if (!m) return { ok: false, reason: "format" };
    try {
      const [x, y] = [parseQ(m[1]), parseQ(m[2])];
      const [kx, ky] = eq.pair.map(parseQ);
      return x.n === kx.n && x.d === kx.d && y.n === ky.n && y.d === ky.d ? { ok: true } : { ok: false, reason: "wrong" };
    } catch {
      return { ok: false, reason: "format" };
    }
  }
  if (eq.form === "clock") {
    const m = text.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
    if (!m || Number(m[2]) > 59 || Number(m[1]) > 23) return { ok: false, reason: "format" };
    const minutes = (Number(m[1]) % 12) * 60 + Number(m[2]);
    return minutes === eq.minutes ? { ok: true } : { ok: false, reason: "wrong" };
  }
  if (eq.form === "text") {
    const squash = (s) => clean(s).replace(/[\s.]+/g, "");
    const want = [...(eq.texts || []), ...(item.answers || [])].map(squash);
    return want.includes(squash(value)) ? { ok: true } : { ok: false, reason: "wrong" };
  }
  return numeric(text, eq);
}

// Legacy items (no `equiv`): the usual typed extras still count: "x = 5", a trailing unit, thousands commas.
export function looseNumberMatch(value, item) {
  const units = item.unit ? [item.unit] : [];
  const read = readNumber(value, { units });
  if (read.error) return false;
  return (item.answers || []).some((answer) => {
    try {
      const key = readNumber(answer, {});
      return !key.error && key.q.n === read.q.n && key.q.d === read.q.d;
    } catch {
      return false;
    }
  });
}
