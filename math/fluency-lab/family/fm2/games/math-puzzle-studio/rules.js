// The rule language every "place tiles" puzzle is written in, the evaluator that judges a filled board, and a
// depth-first solver that enumerates every solution. Pure and DOM-free; all arithmetic is exact (fm2/rational.js).
// A board is `cells` (a value, or null for an open spot) plus `rules`:
//   cmp      sum of terms on the left  <rel>  sum of terms on the right   (balance scales, sums, bonds, equations)
//   mul      cell a x cell b = cell c                                     (factor grids)
//   prod     the cells multiply to `to`
//   cage     KenKen cage: op + - x / = over its cells reaches `to`
//   distinct every listed cell holds a different value
//   expr     a token template ( "(", ")", {c:i} ) that evaluates, with order of operations, to `to`
//   equiv    the tile in cell c is the same expression a*x + b as `lin`
// A term is {v} a constant, {c, m?, p?} a cell (times m, to the power p), or {lin:[a,b]} the expression a*x + b.
// @fm2 FM-017 FM-019 FM-058 FM-059 FM-060
import { add, cmp, div, eq, frac, mul, sub } from "../../rational.js";

export const OPS = ["+", "−", "×", "÷"];
export const isOp = (v) => typeof v === "string";

// The exact weight of a tile value: a whole number, a fraction {n,d}, or the expression {lin:[a,b]} at x = xs.
export function weight(v, xs = frac(1)) {
  if (v === null || v === undefined) return frac(0);
  if (typeof v === "number") return frac(v);
  if (v.lin) return add(mul(frac(v.lin[0]), xs), frac(v.lin[1]));
  return v;
}

export function termWeight(term, vals, xs = frac(1)) {
  if (term.lin) return weight({ lin: term.lin }, xs);
  if ("v" in term) return weight(term.v, xs);
  let w = weight(vals[term.c], xs);
  if (term.p === 2) w = mul(w, w);
  return term.m ? mul(w, frac(term.m)) : w;
}

export const sideWeight = (terms, vals, xs) =>
  terms.reduce((sum, t) => add(sum, termWeight(t, vals, xs)), frac(0));

export function ruleCells(rule) {
  if (rule.k === "cmp") return [...rule.l, ...rule.r].filter((t) => "c" in t).map((t) => t.c);
  if (rule.k === "mul") return [rule.a, rule.b, rule.c];
  if (rule.k === "equiv") return [rule.c];
  if (rule.k === "expr") return rule.toks.filter((t) => typeof t === "object").map((t) => t.c);
  return rule.cells;
}

// Evaluate a token template. `mode` "standard" is real order of operations; "flat" treats every operator alike,
// left to right (the classic mistake); "noparen" drops the parentheses. Returns a fraction or null (not a number).
export function evalTokens(toks, vals, mode = "standard", trace = null) {
  const items = [];
  for (const t of toks) {
    if (t === "(" || t === ")") {
      if (mode !== "noparen") items.push(t);
    } else items.push(vals[t.c]);
  }
  let at = 0;
  const num = (v) => (typeof v === "string" ? null : weight(v));
  function atom() {
    if (items[at] === "(") {
      at += 1;
      const inner = expression();
      if (items[at] !== ")") return null;
      at += 1;
      return inner;
    }
    const v = items[at] === undefined ? null : num(items[at]);
    if (v) at += 1;
    return v;
  }
  const apply = (op, a, b) => {
    if (!a || !b) return null;
    let out;
    if (op === "+") out = add(a, b);
    else if (op === "−") out = sub(a, b);
    else if (op === "×") out = mul(a, b);
    else out = b.n === 0 ? null : div(a, b);
    if (trace && out) trace.push(out);
    return out;
  };
  function product() {
    let left = atom();
    while (left && (items[at] === "×" || items[at] === "÷") && mode !== "flat") {
      const op = items[at];
      at += 1;
      left = apply(op, left, atom());
    }
    return left;
  }
  function expression() {
    let left = product();
    const wide = mode === "flat" ? ["+", "−", "×", "÷"] : ["+", "−"];
    while (left && wide.includes(items[at])) {
      const op = items[at];
      at += 1;
      left = apply(op, left, product());
    }
    return left;
  }
  const out = expression();
  return out && at === items.length ? out : null;
}

export function cageValue(rule, vals) {
  const w = rule.cells.map((i) => weight(vals[i]));
  if (rule.op === "+") return w.reduce((a, b) => add(a, b), frac(0));
  if (rule.op === "×") return w.reduce((a, b) => mul(a, b), frac(1));
  if (rule.op === "=") return w[0];
  const [hi, lo] = cmp(w[0], w[1]) >= 0 ? [w[0], w[1]] : [w[1], w[0]];
  if (rule.op === "−") return sub(hi, lo);
  return lo.n === 0 ? null : div(hi, lo);
}

export function holds(rule, vals, round) {
  const xs = round.xs ? frac(round.xs) : frac(1);
  switch (rule.k) {
    case "cmp": {
      const c = cmp(sideWeight(rule.l, vals, xs), sideWeight(rule.r, vals, xs));
      return rule.rel === "=" ? c === 0 : rule.rel === "<" ? c < 0 : c > 0;
    }
    case "mul":
      return eq(mul(weight(vals[rule.a]), weight(vals[rule.b])), weight(vals[rule.c]));
    case "prod":
      return eq(
        rule.cells.reduce((p, i) => mul(p, weight(vals[i])), frac(1)),
        weight(rule.to),
      );
    case "cage": {
      const got = cageValue(rule, vals);
      return got !== null && eq(got, weight(rule.to));
    }
    case "distinct": {
      const seen = rule.cells.map((i) => JSON.stringify(vals[i]));
      return new Set(seen).size === seen.length;
    }
    case "expr": {
      const got = evalTokens(rule.toks, vals);
      return got !== null && eq(got, weight(rule.to));
    }
    case "equiv": {
      const t = vals[rule.c];
      return Boolean(t?.lin) && t.lin[0] === rule.lin[0] && t.lin[1] === rule.lin[1];
    }
    default:
      throw new RangeError(`Unknown rule ${rule.k}`);
  }
}

export const failingRules = (round, vals) =>
  round.rules.filter((rule) => !holds(rule, vals, round));

export const openCells = (round) =>
  round.cells.map((c, i) => (c.v === null ? i : -1)).filter((i) => i >= 0);
export const tileById = (round, id) => round.pool.find((t) => t.id === id);

// The board values for a response: given cells keep their value, open cells take their tile's value (null if empty).
export function boardValues(round, put) {
  return round.cells.map((c, i) => {
    if (c.v !== null) return c.v;
    const tile = put?.[i] ? tileById(round, put[i]) : null;
    return tile ? tile.v : null;
  });
}

// Every way to fill the open cells that satisfies every rule (distinct by value), as arrays of tile ids in open-cell
// order. Stops after `limit` solutions and reports whether it stopped early. Prunes on `distinct` and on rules whose
// cells are all placed; the test suite checks this solver against its own, unpruned search.
export function solveAll(round, limit = 50) {
  const open = openCells(round);
  const vals = round.cells.map((c) => c.v);
  const at = new Map(open.map((cell, pos) => [cell, pos]));
  const closing = open.map(() => []);
  const upfront = [];
  for (const rule of round.rules) {
    const last = Math.max(-1, ...ruleCells(rule).map((c) => (at.has(c) ? at.get(c) : -1)));
    (last < 0 ? upfront : closing[last]).push(rule);
  }
  if (upfront.some((rule) => !holds(rule, vals, round))) return { solutions: [], capped: false };
  const distinct = round.rules.filter((r) => r.k === "distinct");
  const solutions = [];
  const used = new Set();
  let capped = false;
  function clash(cell) {
    for (const rule of distinct) {
      if (!rule.cells.includes(cell)) continue;
      for (const other of rule.cells) {
        if (
          other !== cell &&
          vals[other] !== null &&
          JSON.stringify(vals[other]) === JSON.stringify(vals[cell])
        )
          return true;
      }
    }
    return false;
  }
  function walk(pos, ids) {
    if (capped) return;
    if (pos === open.length) {
      solutions.push([...ids]);
      if (solutions.length >= limit) capped = true;
      return;
    }
    const cell = open[pos];
    const tried = new Set();
    for (const tile of round.pool) {
      const sig = JSON.stringify(tile.v);
      if (tried.has(sig) || (!round.reuse && used.has(tile.id))) continue;
      // the first unused tile with a given value stands for every tile of that value
      tried.add(sig);
      vals[cell] = tile.v;
      if (!clash(cell) && closing[pos].every((rule) => holds(rule, vals, round))) {
        used.add(tile.id);
        ids.push(tile.id);
        walk(pos + 1, ids);
        ids.pop();
        used.delete(tile.id);
      }
      vals[cell] = null;
      if (capped) return;
    }
  }
  walk(0, []);
  return { solutions, capped };
}

// A short readable form of a tile or given value.
export function show(v, label) {
  if (label) return label;
  if (v === null || v === undefined) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (v.lin) return `${v.lin[0] === 1 ? "" : v.lin[0]}x${v.lin[1] ? ` + ${v.lin[1]}` : ""}`;
  return v.d === 1 ? String(v.n) : `${v.n}/${v.d}`;
}
