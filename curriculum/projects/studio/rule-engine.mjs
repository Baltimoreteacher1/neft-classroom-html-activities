/**
 * Rule editor model for the expressions missions (Game Studio Scoring Engine, App Pricing Engine).
 * Pure; no DOM, no eval/Function. A rule is a list of tiles the student places:
 *   a number ("3", "2.5", "1/2"), "x", "+", "-", "*", "(", ")", "^2".
 * A number written right before "x" or "(" multiplies it (a coefficient). "^2" squares the number or
 * parenthesized group just before it; squaring something that contains x is refused, because this
 * editor keeps every rule in the linear form ax + b so equivalence can be decided exactly.
 * Stored under `workbench.rules` as { a: tiles, b: tiles, inputs: number strings, view: "a"|"b" }.
 */
import { add, eq, frac, mul, neg, parse, show, sub } from "./exact.mjs";

export const MAX_TILES = 40;
export const MAX_INPUTS = 8;
export const OPS = ["x", "+", "-", "*", "(", ")", "^2"];
const ZERO = frac(0n);
const ONE = frac(1n);

/** A number tile: nonnegative, at most 8 characters, whole, decimal or fraction. */
export function numberTile(raw) {
  const s = String(raw ?? "").trim();
  if (!/^(\d{1,6}(\.\d{1,3})?|\d{1,3}\/\d{1,3})$/.test(s)) return null;
  const v = parse(s);
  return v ? s : null;
}
const isNum = (t) => typeof t === "string" && numberTile(t) === t;
const isTile = (t) => OPS.includes(t) || isNum(t);

/** Validate stored data. Never throws; garbage becomes the empty value. */
export function cleanRules(raw) {
  const tiles = (list) => (Array.isArray(list) ? list.filter(isTile).slice(0, MAX_TILES) : []);
  const inputs = Array.isArray(raw?.inputs)
    ? raw.inputs.map((s) => inputValue(s)).filter(Boolean).slice(0, MAX_INPUTS)
    : ["0", "1", "10"];
  return { a: tiles(raw?.a), b: tiles(raw?.b), inputs: [...new Set(inputs)], view: raw?.view === "b" ? "b" : "a" };
}
/** Test-bench inputs may be negative; same number rules as the Studio. */
export function inputValue(raw) {
  const s = String(raw ?? "").trim();
  if (!/^-?(\d{1,6}(\.\d{1,3})?|\d{1,3}\/\d{1,3})$/.test(s)) return null;
  return parse(s) ? s : null;
}

/* ------------------------------------------------------------------ parser */
const linear = (a, b) => ({ a, b });
const lAdd = (p, q) => linear(add(p.a, q.a), add(p.b, q.b));
const lSub = (p, q) => linear(sub(p.a, q.a), sub(p.b, q.b));
const isConst = (p) => eq(p.a, ZERO);

/**
 * Parse tiles. Returns { ok: true, form: {a, b}, terms } or { ok: false, error, at } where `error` is a
 * key into the view's messages and `at` the tile index where the problem was found.
 * `terms` lists the top-level terms for the algebra-tile view.
 */
export function parseRule(tiles) {
  if (!tiles.length) return { ok: false, error: "empty", at: 0 };
  let i = 0;
  const fail = (error, at = i) => {
    throw { error, at };
  };
  const peek = () => tiles[i];
  const startsFactor = (t) => t === "x" || t === "(" || isNum(t);
  function expr() {
    const terms = [];
    let sign = 1;
    if (peek() === "-") {
      sign = -1;
      i++;
    } else if (peek() === "+") fail("lead-plus");
    terms.push({ sign, ...term() });
    while (peek() === "+" || peek() === "-") {
      const s = peek() === "+" ? 1 : -1;
      i++;
      if (i >= tiles.length) fail("dangling", i - 1);
      if (!startsFactor(peek())) fail("double-op");
      terms.push({ sign: s, ...term() });
    }
    const form = terms.reduce((acc, t) => (t.sign > 0 ? lAdd(acc, t.form) : lSub(acc, t.form)), linear(ZERO, ZERO));
    return { form, terms };
  }
  function term() {
    const factors = [factor()];
    while (i < tiles.length) {
      if (peek() === "*") {
        i++;
        if (i >= tiles.length) fail("dangling", i - 1);
        if (!startsFactor(peek())) fail("double-op");
        factors.push(factor());
      } else if (startsFactor(peek())) {
        // Two number tiles side by side read as one number ("3 4" looks like 34): ask for ×.
        if (isNum(peek()) && ["num", "square"].includes(factors[factors.length - 1].kind)) fail("two-numbers");
        factors.push(factor());
      } else break;
    }
    let form = factors[0].form;
    for (const f of factors.slice(1)) {
      if (!isConst(form) && !isConst(f.form)) fail("x-times-x", f.at);
      form = isConst(form) ? linear(mul(form.b, f.form.a), mul(form.b, f.form.b)) : linear(mul(form.a, f.form.b), mul(form.b, f.form.b));
    }
    return { form, factors };
  }
  function factor() {
    const at = i;
    const t = peek();
    let node;
    if (t === undefined) fail("dangling", i - 1);
    if (isNum(t)) {
      i++;
      node = { kind: "num", value: parse(t), form: linear(ZERO, parse(t)), at };
    } else if (t === "x") {
      i++;
      node = { kind: "x", form: linear(ONE, ZERO), at };
    } else if (t === "(") {
      i++;
      if (peek() === ")") fail("empty-group");
      const inner = expr();
      if (peek() !== ")") fail("unclosed", at);
      i++;
      node = { kind: "group", form: inner.form, inner, at };
    } else if (t === ")") fail("extra-close");
    else if (t === "^2") fail("square-first");
    else fail("double-op");
    if (peek() === "^2") {
      if (!isConst(node.form)) fail("square-x", i);
      i++;
      const v = node.form.b;
      node = { kind: "square", base: node, form: linear(ZERO, mul(v, v)), at };
    }
    return node;
  }
  try {
    const out = expr();
    if (i < tiles.length) fail(tiles[i] === ")" ? "extra-close" : "double-op");
    return { ok: true, form: out.form, terms: out.terms };
  } catch (e) {
    if (e && typeof e.error === "string") return { ok: false, error: e.error, at: Math.max(0, e.at) };
    throw e;
  }
}

/** Value of a linear form at x (exact). */
export const evaluate = (form, x) => add(mul(form.a, x), form.b);

/** Readable rule text from tiles, with typographic minus and times signs. */
export function ruleText(tiles) {
  let out = "";
  tiles.forEach((t, k) => {
    const prev = tiles[k - 1];
    if (t === "+" || t === "-" || t === "*") out += k === 0 ? (t === "-" ? "−" : t) : ` ${t === "-" ? "−" : t === "*" ? "×" : "+"} `;
    else if (t === "^2") out += "²";
    else if (t === ")") out += ")";
    else {
      const glue = prev === undefined || prev === "(" || ["+", "-", "*"].includes(prev);
      out += glue ? t : t === "x" || t === "(" ? t : ` · ${t}`;
    }
  });
  return out.replace(/^\s+/, "");
}

/** ax + b as text. `fmt(value)` prints one exact value (the view masks hidden answers there). */
export function formText(form, fmt = show) {
  const { a, b } = form;
  const parts = [];
  if (!eq(a, ZERO)) {
    if (eq(a, ONE)) parts.push("x");
    else if (eq(a, neg(ONE))) parts.push("−x");
    else parts.push(`${a.n < 0n ? "−" : ""}${fmt(a.n < 0n ? neg(a) : a)}x`);
  }
  if (!eq(b, ZERO) || !parts.length) {
    const negB = b.n < 0n;
    const mag = fmt(negB ? neg(b) : b);
    parts.push(parts.length ? `${negB ? "−" : "+"} ${mag}` : `${negB ? "−" : ""}${mag}`);
  }
  return parts.join(" ");
}

/**
 * Compare two rules exactly. Symbolic: equal coefficients AND equal constants. Then the test bench.
 * `agreeAt` is the single input where two different lines meet, "never" for parallel lines, or "all".
 */
export function compare(fa, fb, inputs) {
  const equivalent = eq(fa.a, fb.a) && eq(fa.b, fb.b);
  let agreeAt = "all";
  if (!equivalent) {
    const da = sub(fa.a, fb.a);
    agreeAt = eq(da, ZERO) ? "never" : mul(sub(fb.b, fa.b), frac(da.d, da.n));
  }
  const rows = inputs.map((s) => {
    const x = parse(s);
    const ya = evaluate(fa, x);
    const yb = evaluate(fb, x);
    return { x, ya, yb, same: eq(ya, yb) };
  });
  return { equivalent, agreeAt, rows, misleading: !equivalent && rows.some((r) => r.same) };
}

/**
 * Algebra-tile model of one rule. Each top-level term becomes a row:
 *   group:  `copies` copies of the group's x-tiles and unit tiles (distribution regroups them)
 *   x:      a run of x-tiles;  unit: a run of unit tiles;  square: a base-by-base square of unit tiles.
 * Tiles are drawn only for whole-number counts (at most 12 copies and 120 tiles); otherwise
 * `{ drawable: false }` and the view explains why.
 */
export function tileModel(parsed) {
  if (!parsed?.ok) return { drawable: false, reason: "parse" };
  const rows = [];
  const whole = (v) => v.d === 1n && v.n >= 0n && v.n <= 120n;
  for (const t of parsed.terms) {
    let coef = ONE;
    let core = null;
    for (const f of t.factors) {
      if (isConst(f.form) && f.kind !== "square") coef = mul(coef, f.form.b);
      else if (f.kind === "square" && t.factors.length === 1) core = f;
      else if (!core) core = f;
      else coef = mul(coef, f.form.b);
    }
    if (!core) {
      if (!whole(coef)) return { drawable: false, reason: "count" };
      rows.push({ kind: "unit", sign: t.sign, count: Number(coef.n) });
    } else if (core.kind === "square") {
      const base = core.base.form.b;
      if (!eq(coef, ONE) || !whole(base) || base.n > 10n) return { drawable: false, reason: "count" };
      rows.push({ kind: "square", sign: t.sign, base: Number(base.n), value: core.form.b });
    } else if (core.kind === "x") {
      if (!whole(coef)) return { drawable: false, reason: "count" };
      rows.push({ kind: "x", sign: t.sign, count: Number(coef.n) });
    } else {
      const { a, b } = core.form;
      if (!whole(coef) || coef.n > 12n || !whole(a) || !whole(b) || a.n > 12n || b.n > 12n) return { drawable: false, reason: "count" };
      rows.push({ kind: "group", sign: t.sign, copies: Number(coef.n), x: Number(a.n), units: Number(b.n) });
    }
  }
  const total = rows.reduce((s, r) => s + (r.kind === "group" ? r.copies * (r.x + r.units) : r.kind === "square" ? r.base * r.base : r.count), 0);
  if (total > 120) return { drawable: false, reason: "count" };
  const xTotal = rows.reduce((s, r) => s + r.sign * (r.kind === "group" ? r.copies * r.x : r.kind === "x" ? r.count : 0), 0);
  const unitTotal = rows.reduce((s, r) => s + r.sign * (r.kind === "group" ? r.copies * r.units : r.kind === "unit" ? r.count : r.kind === "square" ? r.base * r.base : 0), 0);
  return { drawable: true, rows, xTotal, unitTotal };
}

/** Tiles for the mission's grouped rule a(x + b) + d², from the design values. */
export const missionTiles = (v) => [String(v.a), "(", "x", "+", String(v.b), ")", "+", String(v.d), "^2"];

/**
 * Report lines. The report cannot see which answers are checked, so it prints only what the student
 * built and decided (rules, chosen inputs, verdicts), never a computed output, coefficient or constant.
 */
export function rulesReport(data, values) {
  const lines = [];
  const pa = data.a.length ? parseRule(data.a) : null;
  const pb = data.b.length ? parseRule(data.b) : null;
  if (!pa && !pb) return [];
  lines.push("RULE EDITOR");
  if (pa) lines.push(`Rule A: ${ruleText(data.a)}${pa.ok ? "" : " (not finished)"}`);
  if (pb) lines.push(`Rule B: ${ruleText(data.b)}${pb.ok ? "" : " (not finished)"}`);
  if (data.inputs.length) lines.push(`Test inputs I chose: ${data.inputs.join(", ")}`);
  if (pa?.ok && pb?.ok) {
    const c = compare(pa.form, pb.form, data.inputs);
    lines.push(`Equivalent for every input (exact ax + b check): ${c.equivalent ? "yes" : "NO"}`);
    if (c.rows.length) lines.push(`Inputs where the two rules gave the same output: ${c.rows.filter((r) => r.same).map((r) => show(r.x)).join(", ") || "none"}`);
    if (c.misleading) lines.push("Warning I noted: the rules agree on at least one input but are not equivalent.");
  }
  if (values && pa?.ok) {
    const m = parseRule(missionTiles(values));
    if (m.ok) lines.push(`Rule A is equivalent to the mission rule ${ruleText(missionTiles(values))}: ${eq(m.form.a, pa.form.a) && eq(m.form.b, pa.form.b) ? "yes" : "no"}`);
  }
  lines.push("");
  return lines;
}
