// Tokenizer + exact evaluator for numeric claims in prose ("3 in x 4 in x 5 in = 60 in^3", "1/2 of 8 is 4").
// Parsing is conservative: anything that is not fully decidable returns { skip: reason } instead of a guess.
import * as Q from "./rational.mjs";

const LENGTH_UNITS = {
  in: "in",
  inch: "in",
  inches: "in",
  ft: "ft",
  foot: "ft",
  feet: "ft",
  yd: "yd",
  yard: "yd",
  yards: "yd",
  mi: "mi",
  mile: "mi",
  miles: "mi",
  mm: "mm",
  millimeter: "mm",
  millimeters: "mm",
  millimetre: "mm",
  millimetres: "mm",
  cm: "cm",
  centimeter: "cm",
  centimeters: "cm",
  centimetre: "cm",
  centimetres: "cm",
  m: "m",
  meter: "m",
  meters: "m",
  metre: "m",
  metres: "m",
  km: "km",
  kilometer: "km",
  kilometers: "km",
  kilometre: "km",
  kilometres: "km",
  unit: "unit",
  units: "unit",
};
// Short forms that are also ordinary English words: only a unit when no word follows ("5 in the box" is not inches).
const AMBIGUOUS_UNITS = new Set(["in", "m", "mi", "ft", "yd"]);
// Words that end a quantity label: they join separate claims rather than label a number.
const STOP = new Set([
  "and",
  "or",
  "so",
  "then",
  "is",
  "are",
  "was",
  "were",
  "because",
  "since",
  "which",
  "that",
  "but",
  "if",
  "when",
  "to",
  "from",
  "of",
  "for",
  "with",
  "while",
  "than",
  "not",
  "no",
  "the",
  "a",
  "an",
  "by",
  "as",
  "each",
  "per",
  "in",
  "at",
  "on",
  "it",
  "i",
  "we",
  "you",
  "he",
  "she",
  "they",
  "equals",
  "means",
  "gives",
  "makes",
]);
const SUP = { "²": 2, "³": 3 };

const isDigit = (c) => c >= "0" && c <= "9";
const WS = /\s/;

function readNumber(s, i) {
  const m = /^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/.exec(s.slice(i));
  if (!m) return null;
  let text = m[0];
  let end = i + text.length;
  let q = Q.fromDecimal(text);
  let fraction = false;
  // 3/4 (no spaces, integer over integer)
  const f = /^\/(\d+)(?!\d|\.\d|\/\d)/.exec(s.slice(end));
  if (f && /^\d+$/.test(text) && BigInt(f[1]) > 0n) {
    q = Q.make(BigInt(text), BigInt(f[1]));
    end += f[0].length;
    text += f[0];
    fraction = true;
  } else if (/^\d+$/.test(text)) {
    // mixed number: 3 1/5 (proper fraction after one space)
    const mm = /^ (\d+)\/(\d+)(?!\d|\.\d|\/\d)/.exec(s.slice(end));
    if (mm && BigInt(mm[2]) > BigInt(mm[1]) && BigInt(mm[1]) > 0n) {
      q = Q.add(q, Q.make(BigInt(mm[1]), BigInt(mm[2])));
      end += mm[0].length;
      text += mm[0];
      fraction = true;
    }
  }
  return { q, end, text, fraction };
}

function readUnit(s, i) {
  // optional "square"/"cubic"/"sq" prefix, base unit word, optional ^2 / superscript suffix
  let rest = s.slice(i);
  const lead = /^\s*/.exec(rest)[0].length;
  rest = rest.slice(lead);
  let exp = 1;
  let consumed = lead;
  const pre = /^(square|cubic|sq\.?)\s+/i.exec(rest);
  if (pre) {
    exp = /^cubic/i.test(pre[1]) ? 3 : 2;
    rest = rest.slice(pre[0].length);
    consumed += pre[0].length;
  }
  const w = /^[A-Za-z]+/.exec(rest);
  if (!w) return null;
  const base = LENGTH_UNITS[w[0].toLowerCase()];
  if (!base) return null;
  let after = rest.slice(w[0].length);
  consumed += w[0].length;
  const sup = /^(?:\^\s?([23])|([²³]))/.exec(after);
  if (sup) {
    exp = sup[1] ? Number(sup[1]) : SUP[sup[2]];
    consumed += sup[0].length;
    after = after.slice(sup[0].length);
  }
  if (AMBIGUOUS_UNITS.has(w[0].toLowerCase()) && !pre && !sup && /^\s*[A-Za-z]/.test(after))
    return null;
  if (/^[A-Za-z]/.test(after)) return null;
  return { dims: { [base]: exp }, end: i + consumed };
}

// ASCII hyphen is minus only between operands with symmetric spacing (so "3-digit" and "pages 3 -4" are not arithmetic).
function isMinus(c, p, spacedBefore, spacedAfter, nextNonSpace) {
  if (c !== "-" || !nextNonSpace || !(isDigit(nextNonSpace) || nextNonSpace === "(")) return false;
  const binary = p && (p.t === "num" || p.t === "rp");
  if (binary) return spacedBefore === spacedAfter;
  return !spacedAfter;
}

export function tokenize(raw) {
  const s = String(raw);
  const out = [];
  let i = 0;
  const push = (t) => out.push(t);
  const prev = () => out[out.length - 1];
  while (i < s.length) {
    const c = s[i];
    if (WS.test(c) || c === "$") {
      i += 1;
      continue;
    }
    if (isDigit(c)) {
      const n = readNumber(s, i);
      let { q, end } = n;
      let dims = null;
      let after = s.slice(end);
      let pct = false;
      let m;
      if ((m = /^\s?(%|percent\b)/i.exec(after))) {
        q = Q.div(q, Q.make(100n));
        end += m[0].length;
        pct = true;
      } else if ((m = /^(?:\^(\d{1,2})|([²³]))/.exec(after)) && !readUnit(s, end)) {
        const k = m[1] ? Number(m[1]) : SUP[m[2]];
        q = Q.pow(q, k);
        end += m[0].length;
      } else {
        const u = readUnit(s, end);
        if (u) {
          dims = u.dims;
          end = u.end;
        }
      }
      push({
        t: "num",
        q,
        dims: dims || {},
        pct,
        fraction: n.fraction,
        text: s.slice(i, end),
        i0: i,
        i1: end,
      });
      i = end;
      continue;
    }
    if (/[A-Za-z]/.test(c)) {
      const w = /^[A-Za-z]+(?:'[a-z]+)?/.exec(s.slice(i))[0];
      push({ t: "word", v: w.toLowerCase(), raw: w, i0: i, i1: i + w.length });
      i += w.length;
      continue;
    }
    const p = prev();
    const spacedBefore = i > 0 && WS.test(s[i - 1]);
    const spacedAfter = i + 1 < s.length && WS.test(s[i + 1]);
    const nextNonSpace = s.slice(i + 1).trimStart()[0];
    if (c === "+") push({ t: "op", v: "+", i0: i, i1: i + 1 });
    else if (c === "−" || isMinus(c, p, spacedBefore, spacedAfter, nextNonSpace))
      push({ t: "op", v: "-", i0: i, i1: i + 1 });
    else if (c === "×" || c === "*" || c === "·" || c === "⋅")
      push({ t: "op", v: "*", i0: i, i1: i + 1 });
    else if (c === "÷") push({ t: "op", v: "/", i0: i, i1: i + 1 });
    else if (c === "/" && spacedBefore && spacedAfter) push({ t: "op", v: "/", i0: i, i1: i + 1 });
    else if (c === "=") push({ t: "eq", v: "=", i0: i, i1: i + 1 });
    else if (c === "<" || c === ">" || c === "≤" || c === "≥" || c === "≠")
      push({ t: "cmp", v: c, i0: i, i1: i + 1 });
    else if (c === "(") push({ t: "lp", i0: i, i1: i + 1 });
    else if (c === ")") push({ t: "rp", i0: i, i1: i + 1 });
    else if (c === "_") {
      while (s[i + 1] === "_") i += 1;
      push({ t: "blank", i0: i, i1: i + 1 });
    } else push({ t: "punct", v: c, i0: i, i1: i + 1 });
    i += 1;
  }
  // spaced "x" between operands is multiplication
  for (let k = 1; k < out.length - 1; k += 1) {
    const t = out[k];
    if (
      t.t === "word" &&
      t.v === "x" &&
      ["num", "rp"].includes(out[k - 1].t) &&
      ["num", "lp"].includes(out[k + 1].t) &&
      out[k - 1].i1 < t.i0 &&
      t.i1 < out[k + 1].i0
    )
      out[k] = { t: "op", v: "*", i0: t.i0, i1: t.i1 };
  }
  return out;
}

const OPERAND = new Set(["num", "rp"]);
/**
 * Maximal runs of arithmetic tokens that contain at least one relation (=, <, >, ...).
 * Words are bridged only as quantity labels ("12 white tiles / 4 blocks = 3 tiles"), "of" after a fraction or percent
 * means multiply, and "is"/"equals" after an operator expression means "=".
 */
export function findRuns(tokens) {
  const runs = [];
  let cur = [];
  // A single letter next to a run is an algebra variable ("2x + 3 = 11", "n = 5"): the run is not a numeric claim.
  const isVar = (t) => t && t.t === "word" && t.v.length === 1 && t.v !== "a" && t.v !== "i";
  const flush = () => {
    if (cur.some((t) => t.t === "eq" || t.t === "cmp")) {
      const first = tokens.indexOf(cur[0]);
      const last = tokens.indexOf(cur[cur.length - 1]);
      if (!isVar(tokens[first - 1]) && !isVar(tokens[last + 1])) runs.push(cur);
    }
    cur = [];
  };
  for (let k = 0; k < tokens.length; k += 1) {
    const t = tokens[k];
    if (["num", "op", "eq", "cmp", "lp", "rp"].includes(t.t)) {
      cur.push(t);
      continue;
    }
    if (t.t === "word") {
      const last = cur[cur.length - 1];
      if (
        t.v === "of" &&
        last &&
        last.t === "num" &&
        (last.fraction || last.pct) &&
        tokens[k + 1]?.t === "num"
      ) {
        cur.push({ t: "op", v: "*", i0: t.i0, i1: t.i1 });
        continue;
      }
      if (
        (t.v === "equals" || t.v === "is" || t.v === "equal") &&
        last &&
        OPERAND.has(last.t) &&
        cur.some((x, n) => x.t === "op" && n > 0 && OPERAND.has(cur[n - 1].t)) &&
        !cur.some((x) => x.t === "eq" || x.t === "cmp")
      ) {
        let j = k + 1;
        if (
          t.v === "is" &&
          tokens[j]?.t === "word" &&
          tokens[j].v === "equal" &&
          tokens[j + 1]?.t === "word" &&
          tokens[j + 1].v === "to"
        )
          j += 2;
        else if (t.v === "equal" && tokens[j]?.t === "word" && tokens[j].v === "to") j += 1;
        if (tokens[j]?.t === "num") {
          cur.push({ t: "eq", v: "=", i0: t.i0, i1: t.i1 });
          k = j - 1;
          continue;
        }
      }
      if (
        t.v === "is" &&
        tokens[k + 1]?.t === "word" &&
        (tokens[k + 1].v === "less" || tokens[k + 1].v === "greater") &&
        tokens[k + 2]?.v === "than" &&
        last &&
        OPERAND.has(last.t)
      ) {
        cur.push({
          t: "cmp",
          v: tokens[k + 1].v === "less" ? "<" : ">",
          i0: t.i0,
          i1: tokens[k + 2].i1,
        });
        k += 2;
        continue;
      }
      // quantity label: up to 3 non-stop words between an operand and the next operator/relation
      if (last && OPERAND.has(last.t)) {
        let j = k;
        while (
          j < tokens.length &&
          j < k + 3 &&
          tokens[j].t === "word" &&
          !STOP.has(tokens[j].v) &&
          tokens[j].v.length > 1
        )
          j += 1;
        const nxt = tokens[j];
        if (
          j > k &&
          nxt &&
          (nxt.t === "op" || nxt.t === "eq" || nxt.t === "cmp") &&
          tokens.slice(k, j).every((x) => x.t === "word" && !STOP.has(x.v) && x.v.length > 1)
        ) {
          k = j - 1;
          continue;
        }
      }
    }
    flush();
  }
  flush();
  return runs;
}

function sameDims(a, b) {
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((u) => a[u] === b[u]);
}
const mulDims = (a, b, sign) => {
  const r = { ...a };
  for (const [u, e] of Object.entries(b)) {
    r[u] = (r[u] || 0) + sign * e;
    if (r[u] === 0) delete r[u];
  }
  return r;
};

/** Evaluate one side (token list) to { q, dims } or { skip }. */
export function evalSide(tokens) {
  let pos = 0;
  const fail = (why) => {
    throw Object.assign(new Error(why), { skip: why });
  };
  const peek = () => tokens[pos];
  function atom() {
    const t = tokens[pos];
    if (!t) fail("dangling operator");
    if (t.t === "num") {
      pos += 1;
      return { q: t.q, dims: t.dims };
    }
    if (t.t === "lp") {
      pos += 1;
      const v = expr();
      if (peek()?.t !== "rp") fail("unbalanced parenthesis");
      pos += 1;
      return v;
    }
    return fail("not an operand");
  }
  function factor() {
    if (peek()?.t === "op" && peek().v === "-") {
      pos += 1;
      const v = factor();
      return { q: Q.neg(v.q), dims: v.dims };
    }
    return atom();
  }
  function term() {
    let v = factor();
    while (peek()?.t === "op" && (peek().v === "*" || peek().v === "/")) {
      const op = tokens[pos].v;
      pos += 1;
      const r = factor();
      if (op === "/" && Q.isZero(r.q)) fail("division by zero");
      v = {
        q: op === "*" ? Q.mul(v.q, r.q) : Q.div(v.q, r.q),
        dims: mulDims(v.dims, r.dims, op === "*" ? 1 : -1),
      };
    }
    return v;
  }
  function expr() {
    let v = term();
    while (peek()?.t === "op" && (peek().v === "+" || peek().v === "-")) {
      const op = tokens[pos].v;
      pos += 1;
      const r = term();
      const bothUnits = Object.keys(v.dims).length && Object.keys(r.dims).length;
      if (bothUnits && !sameDims(v.dims, r.dims)) fail("mixed units in a sum");
      v = {
        q: op === "+" ? Q.add(v.q, r.q) : Q.sub(v.q, r.q),
        dims: Object.keys(v.dims).length ? v.dims : r.dims,
      };
    }
    return v;
  }
  try {
    const v = expr();
    if (pos !== tokens.length) return { skip: "unparsed tokens" };
    return v;
  } catch (e) {
    if (e.skip) return { skip: e.skip };
    if (e instanceof RangeError) return { skip: e.message };
    throw e;
  }
}

/** Do two evaluated quantities clash in unit shape (same base unit, different exponent)? */
export function dimsClash(a, b) {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (!ka.length || !kb.length || sameDims(a, b)) return false;
  return ka.some((u) => u in b && a[u] !== b[u]);
}
export { sameDims };

export const formatDims = (d) =>
  Object.entries(d)
    .map(([u, e]) => (e === 1 ? u : `${u}^${e}`))
    .join(" ") || "(none)";
