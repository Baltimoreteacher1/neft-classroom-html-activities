// Number Builder logic: scoring, solving and hints. Pure; works on plain-JSON rounds. A build is a set of pieces
// (counts), an arrangement of digit tiles (slots), or a coefficient with an exponent (digits, exp). The round is
// solved when the build's value equals the target and every rule holds; many builds can be correct.
// @fm2 FM-007 FM-019 FM-032 FM-033 FM-060
import { add, cmp, div, eq, frac, fromDecimal, mul, neg, toDecimalString } from "../../rational.js";
import * as help from "./copy-help.js";
import {
  chartBest,
  evalChart,
  evalSci,
  sciRules,
  sciSolutions,
  sciValue,
  solveChart,
} from "./logic-modes.js";

const val = (text) => fromDecimal(text);
const okOp = (have, op, n) =>
  op === "eq" ? have === n : op === "ge" ? have >= n : op === "le" ? have <= n : have !== n;
const sum = (counts, ids) => ids.reduce((n, id) => n + (counts[id] || 0), 0);
export const totalPieces = (counts) => Object.values(counts).reduce((n, c) => n + c, 0);
export const emptyCounts = (round) => Object.fromEntries(round.pieces.map((p) => [p.id, 0]));

export function cleanCounts(round, counts) {
  if (!counts || typeof counts !== "object" || Array.isArray(counts)) return null;
  if (Object.keys(counts).some((id) => !round.pieces.some((p) => p.id === id))) return null;
  const out = {};
  for (const p of round.pieces) {
    const n = counts[p.id] ?? 0;
    if (!Number.isInteger(n) || n < 0 || n > p.max) return null;
    out[p.id] = n;
  }
  return round.cap && totalPieces(out) > round.cap ? null : out;
}

export const piecesValue = (round, counts) =>
  round.pieces.reduce((acc, p) => add(acc, mul(frac(counts[p.id]), val(p.value))), frac(0));

export function pieceRules(round, counts) {
  return round.constraints.map((c) => {
    const have =
      c.t === "count"
        ? sum(counts, c.of)
        : c.t === "pieces"
          ? totalPieces(counts)
          : round.pieces.filter((p) => counts[p.id] > 0).length;
    return { c, have, ok: okOp(have, c.op ?? "ge", c.n) };
  });
}

// Canonical digits of the target over the round's place-value pieces (largest first), or null.
function canonical(placed, target) {
  let rest = target;
  const digits = [];
  for (const p of placed) {
    const q = div(rest, val(p.value));
    const whole = Math.floor(q.n / q.d);
    digits.push(whole);
    rest = add(rest, neg(mul(frac(whole), val(p.value))));
  }
  return rest.n === 0 ? digits : null;
}

function pieceMistake(round, counts, value, target) {
  const total = totalPieces(counts);
  const text = toDecimalString(value) ?? "?";
  const vars = {
    value: text,
    diff:
      toDecimalString(
        value.n * target.d > target.n * value.d ? add(value, neg(target)) : add(target, neg(value)),
      ) ?? "?",
    total,
  };
  if (total === 0) return { key: "empty", vars };
  if (target.n === 0) return { key: "notZero", vars };
  if (eq(value, neg(target))) return { key: "signFlip", vars };
  if (eq(value, mul(target, frac(10)))) return { key: "tenTimes", vars };
  if (eq(value, div(target, frac(10)))) return { key: "tenth", vars };
  const placed = round.pieces.every(
    (p) =>
      !p.value.startsWith("-") &&
      ["unit", "rod", "flat", "mini", "disc", "expdisc"].includes(p.kind),
  )
    ? [...round.pieces].sort((a, b) => cmp(val(b.value), val(a.value)))
    : null;
  if (placed) {
    const digits = canonical(placed, target);
    const have = placed.map((p) => counts[p.id]);
    for (let i = 0; digits && i < digits.length; i += 1)
      for (let j = i + 1; j < digits.length; j += 1) {
        const swap = [...digits];
        [swap[i], swap[j]] = [swap[j], swap[i]];
        if (swap.join() === have.join() && swap.join() !== digits.join())
          return { key: "swapped", vars: { ...vars, a: placed[i].id, b: placed[j].id } };
      }
    if (target.d === 1 && total === target.n && total > 1) return { key: "countedPieces", vars };
  }
  return { key: cmp(value, target) > 0 ? "tooMuch" : "tooLittle", vars };
}

export function evalPieces(round, build) {
  const counts = cleanCounts(round, build?.counts);
  if (!counts) return { ok: false, key: "invalid", vars: {} };
  const value = piecesValue(round, counts);
  const target = val(round.target);
  const text = toDecimalString(value) ?? "?";
  if (eq(value, target)) {
    const failed = pieceRules(round, counts).find((r) => !r.ok);
    return failed
      ? { ok: false, key: "rule", vars: { rule: failed.c, have: failed.have }, value: text }
      : { ok: true, key: null, vars: {}, value: text };
  }
  return { ok: false, value: text, ...pieceMistake(round, counts, value, target) };
}

export function evaluate(round, build) {
  return round.mode === "chart"
    ? evalChart(round, build)
    : round.mode === "sci"
      ? evalSci(round, build)
      : evalPieces(round, build);
}

// ---------- search ----------
const decimals = (text) => (text.split(".")[1] || "").length;

export function pieceSolutions(round, cap = 4000) {
  const places = Math.max(decimals(round.target), ...round.pieces.map((p) => decimals(p.value)));
  const q = (text) => {
    const f = val(text);
    return f.n * (10 ** places / f.d);
  };
  const order = [...round.pieces].sort(
    (a, b) => Math.abs(q(b.value)) - Math.abs(q(a.value)) || (a.id < b.id ? -1 : 1),
  );
  const qv = order.map((p) => q(p.value));
  const lo = order.map(() => 0);
  const hi = order.map((p) => Math.min(p.max, round.cap ?? p.max));
  round.constraints.forEach((c) => {
    if (c.t === "pieces" && (c.op === "eq" || c.op === "le"))
      hi.forEach((h, i) => {
        hi[i] = Math.min(h, c.n);
      });
    if (c.t !== "count" || c.of.length !== 1) return;
    const i = order.findIndex((p) => p.id === c.of[0]);
    if (c.op === "eq") [lo[i], hi[i]] = [Math.max(lo[i], c.n), Math.min(hi[i], c.n)];
    if (c.op === "ge") lo[i] = Math.max(lo[i], c.n);
    if (c.op === "le") hi[i] = Math.min(hi[i], c.n);
  });
  const m = order.length;
  const sufMin = new Array(m + 1).fill(0);
  const sufMax = new Array(m + 1).fill(0);
  for (let i = m - 1; i >= 0; i -= 1) {
    sufMin[i] = sufMin[i + 1] + Math.min(lo[i] * qv[i], hi[i] * qv[i]);
    sufMax[i] = sufMax[i + 1] + Math.max(lo[i] * qv[i], hi[i] * qv[i]);
  }
  const limit = Math.min(round.cap ?? Infinity, ...round.constraints.filter((c) => c.t === "pieces" && c.op !== "ge").map((c) => c.n));
  const out = [];
  const counts = new Array(m).fill(0);
  const leaf = () => {
    const byId = Object.fromEntries(order.map((p, i) => [p.id, counts[i]]));
    if (round.cap && totalPieces(byId) > round.cap) return;
    if (pieceRules(round, byId).every((r) => r.ok))
      out.push({ counts: Object.fromEntries(round.pieces.map((p) => [p.id, byId[p.id]])) });
  };
  const go = (i, rest, used) => {
    if (out.length >= cap) return;
    if (i === m - 1) {
      if (rest % qv[i] !== 0) return;
      const c = rest / qv[i];
      if (c < lo[i] || c > hi[i] || used + c > limit) return;
      counts[i] = c;
      leaf();
      return;
    }
    for (let c = Math.min(hi[i], limit - used); c >= lo[i]; c -= 1) {
      const r = rest - c * qv[i];
      if (r < sufMin[i + 1] || r > sufMax[i + 1]) continue;
      counts[i] = c;
      go(i + 1, r, used + c);
    }
  };
  go(0, q(round.target), 0);
  return out.sort((a, b) => totalPieces(a.counts) - totalPieces(b.counts));
}

export function solutions(round, limit = round.ways) {
  if (round.mode === "chart") return [solveChart(round)];
  const all = round.mode === "sci" ? sciSolutions(round) : pieceSolutions(round);
  return all.slice(0, limit);
}

export const distinct = (round, a, b) =>
  round.mode === "sci" ? a.exp !== b.exp : JSON.stringify(a.counts) !== JSON.stringify(b.counts);

// ---------- the contract ----------
export function check(round, response) {
  const builds = response?.builds;
  const fail = (e, which = 0) => ({
    correct: false,
    mistake: e.key,
    feedback: help.feedback(round, e, which),
  });
  if (!Array.isArray(builds) || builds.length < 1 || builds.length > round.ways)
    return fail({ key: "invalid", vars: {} });
  const results = builds.map((b) => evaluate(round, b));
  const bad = results.findIndex((r) => !r.ok);
  if (bad >= 0) return fail(results[bad], round.ways === 2 ? bad + 1 : 0);
  if (builds.length < round.ways) return fail({ key: "needTwo", vars: {} });
  if (round.ways === 2 && !distinct(round, builds[0], builds[1]))
    return fail({ key: "sameBuild", vars: {} });
  return { correct: true, feedback: help.success(round, builds, results) };
}

export function solve(round) {
  return { builds: solutions(round, round.ways) };
}

export const answerText = (round) => help.answerKey(round, solutions(round, round.ways));

export function hint(round, tier) {
  return help.hint(round, tier, tier >= 3 ? solutions(round, round.ways) : []);
}

// Live values for the interface.
export function liveValue(round, build) {
  if (round.mode === "chart")
    return build.slots.every((s) => s !== null) ? build.slots.join("") : null;
  if (round.mode === "sci") return toDecimalString(sciValue(build), 9);
  return toDecimalString(piecesValue(round, build.counts));
}

export const liveRules = (round, build) =>
  round.mode === "sci"
    ? sciRules(round, build)
    : round.mode === "chart"
      ? []
      : pieceRules(round, build.counts);
export { chartBest };
