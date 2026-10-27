// Names the likely mistake behind a board that fails its rules. Pure and DOM-free. A tile can carry a `why` (the
// mistake it stands for); otherwise the failing rules say what went wrong. Returns { key, vars } where `key` indexes
// the feedback catalogue in copy-mistakes.js. @fm2 FM-063
import { cmp, eq, frac, toMixedString } from "../../rational.js";
import { evalTokens, holds, sideWeight, weight } from "./rules.js";

const text = (q) => toMixedString(q);

// Which pan holds the learner's open cell in a scale: "l", "r", or null when both or neither do.
function slotPan(scale) {
  const l = scale.l.some((t) => "c" in t && !t.box);
  const r = scale.r.some((t) => "c" in t && !t.box);
  return l && !r ? "l" : r && !l ? "r" : null;
}

function balanceMistake(round, vals) {
  const xs = round.xs ? frac(round.xs) : frac(1);
  if (round.system) {
    const ok = round.scales.map((s) => eq(sideWeight(s.l, vals, xs), sideWeight(s.r, vals, xs)));
    const good = ok.filter(Boolean).length;
    if (good === 1)
      return { key: "one-scale-only", vars: { which: ok[0] ? 1 : 2, other: ok[0] ? 2 : 1 } };
    const swapped = [vals[1], vals[0]];
    if (round.rules.every((rule) => holds(rule, swapped, round))) return { key: "swapped-weights" };
    return { key: "neither-scale" };
  }
  const scale = round.scales[0];
  const diff = cmp(sideWeight(scale.l, vals, xs), sideWeight(scale.r, vals, xs));
  if (scale.rel !== "=") {
    return diff === 0 ? { key: "equal-not-tip" } : { key: "wrong-way" };
  }
  const pan = slotPan(scale);
  const heavy = pan === "l" ? diff > 0 : pan === "r" ? diff < 0 : null;
  if (heavy === null) return { key: "recheck" };
  return { key: heavy ? "slot-pan-heavy" : "slot-pan-light" };
}

function lineKeys(round, failing) {
  const idx = (rule) => round.rules.indexOf(rule);
  return failing.map(idx);
}

export function diagnose(round, put, vals, failing) {
  const open = round.cells.map((c, i) => (c.v === null ? i : -1)).filter((i) => i >= 0);
  const tiles = open.map((i) => round.pool.find((t) => t.id === put[i]));
  // a repeated number is named first: it is the clearest thing to fix
  const first = failing.find((r) => r.k === "distinct") ?? failing[0];
  if (open.length === 1 && tiles[0]?.why) return { key: tiles[0].why };
  switch (round.layout) {
    case "bond": {
      const sum = weight(vals[1]).n + weight(vals[2]).n;
      return {
        key: sum > weight(vals[0]).n ? "parts-too-much" : "parts-too-little",
        vars: { sum },
      };
    }
    case "balance":
      return balanceMistake(round, vals);
    case "grid": {
      const n = round.n;
      const bad = lineKeys(round, failing);
      const rowsBad = bad.some((i) => i < n);
      const colsBad = bad.some((i) => i >= n);
      return { key: rowsBad && colsBad ? "both-off" : rowsBad ? "row-off" : "col-off" };
    }
    case "triangle":
      return first.k === "distinct" ? { key: "repeat" } : { key: "side-off" };
    case "magic": {
      if (first.k === "distinct") return { key: "repeat" };
      const i = round.rules.indexOf(first);
      return { key: i < 3 ? "row-off" : i < 6 ? "col-off" : "diag-off" };
    }
    case "factor": {
      const rule = first;
      const [a, b, c] = [rule.a, rule.b, rule.c];
      const opened = (i) => round.cells[i].v === null;
      if (!opened(a) && !opened(b)) {
        const sum = weight(vals[a]).n + weight(vals[b]).n;
        return { key: weight(vals[c]).n === sum ? "added-not-multiplied" : "wrong-product" };
      }
      return { key: opened(c) ? "factor-mismatch" : "wrong-factor" };
    }
    case "cage": {
      if (first.k === "distinct")
        return { key: first.line === "row" ? "repeat-row" : "repeat-col" };
      const names = { "+": "cage-add", "−": "cage-sub", "×": "cage-mul", "÷": "cage-div" };
      return { key: names[first.op], vars: { label: `${first.to}${first.op}` } };
    }
    case "pairs": {
      const product = failing.some((r) => r.k === "prod");
      return failing.length === 2
        ? { key: "neither-pair" }
        : product
          ? { key: "only-sum" }
          : { key: "only-product" };
    }
    case "expr": {
      const rule = round.rules[0];
      const flat = evalTokens(rule.toks, vals, "flat");
      if (flat && eq(flat, weight(rule.to))) return { key: "order-of-ops" };
      const bare = evalTokens(rule.toks, vals, "noparen");
      if (bare && eq(bare, weight(rule.to))) return { key: "parens-ignored" };
      const got = evalTokens(rule.toks, vals);
      if (!got || got.d !== 1 || got.n < 0) return { key: "not-whole" };
      return {
        key: got.n > weight(rule.to).n ? "over-target" : "under-target",
        vars: { got: text(got) },
      };
    }
    default:
      return { key: "recheck" };
  }
}
