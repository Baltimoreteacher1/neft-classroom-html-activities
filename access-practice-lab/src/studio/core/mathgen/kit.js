// Shared kit for the verified math generators: a seeded PRNG, number formatting, and block builders that refuse to
// build a block whose answer key disagrees with its own expression. Pure: no DOM, no network, no Math.random.

import {
  evalExpr,
  parseAnswer,
  parseNumber,
  plainMath,
  rat,
  ratEquals,
  ratIsInt,
  ratToString,
} from "../math.js";

// ── seeded randomness ───────────────────────────────────────────────────────

/** A 32-bit integer from any mix of strings and numbers (FNV-1a). */
export function hashSeed(...parts) {
  let h = 2166136261;
  for (const ch of parts.join("|")) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 with the helpers every template needs. */
export function makeRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  const pick = (list) => list[Math.floor(next() * list.length)];
  const shuffle = (list) => {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  return {
    next,
    int,
    pick,
    shuffle,
    chance: (p = 0.5) => next() < p,
    sample: (l, n) => shuffle(l).slice(0, n),
  };
}

export function must(cond, message) {
  if (!cond) throw new Error(`mathgen: ${message}`);
}

// ── numbers and text ────────────────────────────────────────────────────────

export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export const lcm = (a, b) => (a / gcd(a, b)) * b;
/** An exact rational from two integers. */
export const R = (n, d = 1) => rat(BigInt(n), BigInt(d));
/** Display of an integer with a true minus sign. */
export const sg = (n) => (n < 0 ? `−${-n}` : String(n));
export const frac = (n, d) => `{${n}/${d}}`;

/** A non-negative rational as markup: 5, {3/4} or 2 {1/4}. */
export function mk(r) {
  const { n, d } = r;
  if (d === 1n) return n < 0n ? `−${-n}` : String(n);
  must(n > 0n, "mk needs a positive fraction");
  if (n < d) return `{${n}/${d}}`;
  const rem = n % d;
  return rem === 0n ? String(n / d) : `${n / d} {${rem}/${d}}`;
}

/** The same value as the plain answer a student types: 5, 3/4 or 2 1/4. */
export function ans(r) {
  const { n, d } = r;
  if (d === 1n) return String(n);
  must(n > 0n, "ans needs a positive fraction");
  if (n < d) return `${n}/${d}`;
  const rem = n % d;
  return rem === 0n ? String(n / d) : `${n / d} ${rem}/${d}`;
}

/** A terminating decimal with the fewest digits: 7.75, 3, -0.5. */
export function dec(r) {
  const s = ratToString(r, "decimal");
  must(!s.includes("/"), `${r.n}/${r.d} does not terminate`);
  return s;
}

/** A non-negative decimal with exactly `places` digits: 2.50. */
export function fixed(r, places) {
  const scaled = (r.n * 10n ** BigInt(places)) / r.d;
  must(
    (r.n * 10n ** BigInt(places)) % r.d === 0n,
    `${r.n}/${r.d} needs more than ${places} places`,
  );
  const s = scaled.toString().padStart(places + 1, "0");
  return places ? `${s.slice(0, -places)}.${s.slice(-places)}` : s;
}

const flat = (s) => plainMath(s).replace(/[−–]/g, "-").replace(/\s+/g, " ").trim().toLowerCase();
const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/**
 * The number an answer choice shows (leading number, fraction, mixed number, percent, money or a:b ratio),
 * or null when the text is words.
 */
export function valueOfText(text) {
  const s = plainMath(text).replace(/[−–]/g, "-").replace(/[$,]/g, "").trim();
  let m = /^(\d+):(\d+)/.exec(s);
  if (m) return Number(m[2]) ? rat(BigInt(m[1]), BigInt(m[2])) : null;
  m = /^-?\d+ \d+\/\d+/.exec(s) || /^-?\d+\/\d+/.exec(s) || /^-?(?:\d+\.\d+|\.\d+|\d+)%?/.exec(s);
  return m ? parseNumber(m[0]) : null;
}

// ── block builders ──────────────────────────────────────────────────────────

function need(label, value) {
  must(typeof value === "string" && value.trim().length > 0, `${label} is empty`);
}
function core(b) {
  need("prompt", b.prompt);
  need("hint", b.hint);
  need("explanation", b.explanation);
  need("misconception", b.misconception);
  return {
    prompt: b.prompt,
    hint: b.hint,
    explanation: b.explanation,
    misconception: clip(b.misconception, 400),
  };
}
const says = (explanation, text, what) =>
  must(flat(explanation).includes(flat(text)), `explanation does not show ${what} ${text}`);

/** A typed-number question whose key is checked against its own expression. */
export function number({ answer, expr, unit = "", accept = [], ...rest }) {
  const want = evalExpr(expr);
  const got = parseAnswer(answer, unit);
  must(want && got && ratEquals(want, got), `number key ${answer} is not ${expr}`);
  for (const a of accept)
    must(ratEquals(parseAnswer(a, unit), got), `accept ${a} differs from ${answer}`);
  const c = core(rest);
  says(c.explanation, answer, "the answer");
  return { format: "number", ...c, answer, accept, tolerance: 0, unit, expr };
}

/**
 * A four-option choice. `wrong` is a list of { text, why }; three that differ in value from the answer and from
 * each other are chosen. Returns null when fewer than three are usable.
 * `expr` (value of the right option) and `rel` (a relation the right option satisfies) are extra fields the tests read.
 */
export function choice(rng, { answer, wrong, expr, rel, ...rest }) {
  const c = core(rest);
  says(c.explanation, answer, "the answer");
  const av = valueOfText(answer);
  if (expr) must(av && ratEquals(av, evalExpr(expr)), `choice ${answer} is not ${expr}`);
  const seen = new Set([flat(answer)]);
  const values = av ? [av] : [];
  const picked = [];
  for (const w of rng.shuffle(wrong.filter(Boolean))) {
    const v = valueOfText(w.text);
    if (seen.has(flat(w.text)) || (v && values.some((x) => ratEquals(x, v)))) continue;
    seen.add(flat(w.text));
    if (v) values.push(v);
    picked.push(w);
    if (picked.length === 3) break;
  }
  if (picked.length < 3) return null;
  const options = rng.shuffle([{ text: answer, right: true }, ...picked]).map((o, i) => ({
    id: "abcd"[i],
    text: o.text,
    right: o.right === true,
    why: o.why,
  }));
  const keyed = options.find((o) => o.right);
  c.misconception = clip(`${c.misconception} ${picked.map((w) => w.why).join(" ")}`.trim(), 400);
  const out = {
    format: "choice",
    ...c,
    options: options.map(({ id, text }) => ({ id, text })),
    answer: keyed.id,
  };
  if (expr) out.expr = expr;
  if (rel) out.rel = rel;
  return out;
}

/** The text after the last "=" as a number: the result a worked line arrives at. */
export function finalValue(text) {
  const m = /=\s*([^=]*)$/.exec(plainMath(text));
  return m ? valueOfText(m[1]) : null;
}

/**
 * An error-analysis item. `steps` are texts; the step at `errorIndex` is the first wrong one. `expr` is the true
 * value. The right fix ends "= value"; wrong fixes end in a different value.
 */
export function errorItem(rng, { steps, errorIndex, expr, fixRight, fixWrong, ...rest }) {
  const c = core(rest);
  const truth = evalExpr(expr);
  must(truth, `bad truth ${expr}`);
  must(errorIndex >= 0 && errorIndex < steps.length, "errorIndex out of range");
  must(new Set(steps.map(flat)).size === steps.length, "repeated step");
  must(
    ratEquals(finalValue(fixRight) ?? R(0, 1), truth) && finalValue(fixRight),
    `fix does not reach ${expr}`,
  );
  const wrong = [];
  for (const w of rng.shuffle(fixWrong.filter(Boolean))) {
    const v = finalValue(w.text);
    if (!v || ratEquals(v, truth) || wrong.some((x) => flat(x.text) === flat(w.text))) continue;
    wrong.push(w);
    if (wrong.length === 3) break;
  }
  if (wrong.length < 3) return null;
  says(c.explanation, plainMath(fixRight.split("=").pop()).replace(/\.$/, "").trim(), "the result");
  const opts = rng.shuffle([{ text: fixRight, right: true }, ...wrong]).map((o, i) => ({
    id: "abcd"[i],
    text: o.text,
    right: o.right === true,
  }));
  c.misconception = clip(`${c.misconception} ${wrong.map((w) => w.why).join(" ")}`.trim(), 400);
  return {
    format: "error",
    ...c,
    steps: steps.map((text, i) => ({ id: `s${i + 1}`, text })),
    errorStep: `s${errorIndex + 1}`,
    fixOptions: opts.map(({ id, text }) => ({ id, text })),
    fixAnswer: opts.find((o) => o.right).id,
    expr,
  };
}

/** `r<row>c<col>` in a cell expression stands for the cell shown in the table (never a blank). */
export function cellValue(rows, expr) {
  const sub = expr.replace(/r(\d+)c(\d+)/g, (_, r, c) => {
    const cell = rows[Number(r)]?.[Number(c)];
    must(typeof cell === "string", `cell ${r}:${c} is blank or missing`);
    const t = flat(cell).replace(/[$,]/g, "");
    return t.endsWith("%") ? `(${t.slice(0, -1)}/100)` : `(${t})`;
  });
  return evalExpr(sub);
}

/** A fill-in table. `exprs` maps "row:col" of each blank to an expression over visible cells (r1c0 ...). */
export function fillTable({ headers, rows, exprs, ...rest }) {
  const c = core(rest);
  must(headers.length >= 2 && rows.every((r) => r.length === headers.length), "ragged table");
  const blanks = [];
  rows.forEach((row, r) =>
    row.forEach((cell, col) => {
      if (typeof cell === "object") blanks.push([`${r}:${col}`, cell.answer]);
    }),
  );
  must(blanks.length > 0, "table has no blanks");
  for (const [key, answer] of blanks) {
    must(exprs[key], `blank ${key} has no expression`);
    const got = parseAnswer(answer);
    const want = cellValue(rows, exprs[key]);
    must(got && want && ratEquals(got, want), `blank ${key} ${answer} is not ${exprs[key]}`);
  }
  must(Object.keys(exprs).length === blanks.length, "extra table expressions");
  return { format: "fillTable", ...c, headers, rows, exprs };
}

/** Steps listed in the CORRECT order. `expr` (optional) is the value every equation line keeps. */
export function order({ items, expr, ...rest }) {
  const c = core(rest);
  must(items.length >= 3 && new Set(items.map(flat)).size === items.length, "bad order items");
  const out = { format: "order", ...c, items: items.map((text, i) => ({ id: `i${i + 1}`, text })) };
  if (expr) out.expr = expr;
  return out;
}

export function numberline({ min, max, step = 1, answer, expr, ...rest }) {
  const c = core(rest);
  const got = parseAnswer(answer);
  must(got && ratEquals(got, evalExpr(expr)), `numberline ${answer} is not ${expr}`);
  must(ratIsInt(got) ? Number(got.n) >= min && Number(got.n) <= max : true, "answer off the line");
  says(c.explanation, answer, "the answer");
  return { format: "numberline", ...c, min, max, step, answer, tolerance: 0, expr };
}

export function plot({ min, max, points, ...rest }) {
  const c = core(rest);
  must(
    points.every((p) => [p.x, p.y].every((v) => v >= min && v <= max)),
    "point off the grid",
  );
  for (const p of points) says(c.explanation, `(${p.x}, ${p.y})`, "the point");
  return { format: "plot", ...c, min, max, points };
}

/** Select-all with a relation the right options satisfy (`rel`, read by the tests). */
export function multi(rng, { options, answers, rel, ...rest }) {
  const c = core(rest);
  must(answers.length >= 1 && answers.length < options.length, "multi needs some, not all, right");
  must(new Set(options.map(flat)).size === options.length, "repeated option");
  const all = rng.shuffle(options.map((text) => ({ text, right: answers.includes(text) })));
  const opts = all.map((o, i) => ({ id: "abcde"[i], text: o.text, right: o.right }));
  return {
    format: "multi",
    ...c,
    options: opts.map(({ id, text }) => ({ id, text })),
    answers: opts.filter((o) => o.right).map((o) => o.id),
    rel,
  };
}

/** Everyday names and contexts shared by templates. */
export const NAMES = [
  "Mia",
  "Omar",
  "Lena",
  "Sam",
  "Ana",
  "Ravi",
  "Zoe",
  "Luis",
  "Nia",
  "Leo",
  "Maya",
  "Kai",
];
