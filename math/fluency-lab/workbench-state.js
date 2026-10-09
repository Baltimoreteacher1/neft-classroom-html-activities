// State and rules for the Interactive Math Workbench. No DOM here: workbench.js renders
// this state, and every number a student can type is validated by the ranges below.
import { LIMITS, parseProblem } from "./workbench-parse.js";

const DEFAULT_STRIPS = [2, 3, 4, 6, 8];
const MAX_JUMPS = 30;
const NL_LIMIT = LIMITS.magnitude;

export const boardSize = (n) => (n <= 10 ? 10 : n <= 20 ? 20 : 30);
export const isWholeText = (v) => /^-?\d+$/.test(String(v).trim());

const fresh = () => ({
  tool: "model",
  counters: { total: 20, cells: new Map() },
  numberline: { start: 0, jumps: [], draft: "" },
  fractions: { strips: [...DEFAULT_STRIPS], custom: new Set(), shaded: {}, n: 1, d: 2 },
  array: { rows: 6, cols: 8, split: 5 },
  integers: { pos: 0, neg: 0 },
  balance: { coeff: 1, constant: 0, rhs: 10 },
});

export function createWorkbenchState() {
  let s = fresh();

  const countKind = (...kinds) =>
    [...s.counters.cells.values()].filter((k) => kinds.includes(k)).length;
  const counts = () => ({ a: countKind("a"), b: countKind("b") });
  const filled = () => countKind("a", "b");
  const nlCurrent = () => s.numberline.jumps.reduce((sum, j) => sum + j, s.numberline.start);

  function layoutCounters(a, b = 0, taken = 0, size = a + b) {
    const cells = new Map();
    for (let i = 0; i < a; i++) cells.set(i, i >= a - Math.min(taken, a) ? "x" : "a");
    for (let i = 0; i < b; i++) cells.set(a + i, "b");
    s.counters = { total: boardSize(size), cells };
  }

  function addStrip(d) {
    const f = s.fractions;
    if (f.strips.includes(d)) return;
    f.strips.push(d);
    f.strips.sort((x, y) => x - y);
    f.custom.add(d);
  }

  function shadeStrip(d, n) {
    if (n > 0) s.fractions.shaded[d] = new Set(Array.from({ length: n }, (_, i) => i));
    else delete s.fractions.shaded[d];
  }

  // Set up the practice problem's givens in the tool that fits it, leaving the work
  // (and so the answer) to the student.
  function apply(p) {
    s.tool = p.tool;
    if (p.tool === "counters") layoutCounters(p.a, 0, 0, p.a + p.b);
    else if (p.tool === "numberline") s.numberline = { start: p.start, jumps: [], draft: "" };
    else if (p.tool === "fractions") {
      s.fractions = fresh().fractions;
      for (const { d } of p.fractions) addStrip(d);
    } else if (p.tool === "array") s.array = { rows: p.rows, cols: p.cols, split: Math.min(5, p.cols - 1) };
    else if (p.tool === "integers")
      s.integers = { pos: p.first > 0 ? Math.min(15, p.first) : 0, neg: p.first < 0 ? Math.min(15, -p.first) : 0 };
    else if (p.tool === "balance") s.balance = { coeff: p.coeff, constant: p.constant, rhs: p.rhs };
  }

  function resetToItem(item) {
    s = fresh();
    const q = item?.question ?? "";
    const parsed = parseProblem(q);
    if (parsed && !parsed.error) apply(parsed);
    else if (q.includes("/")) s.tool = "fractions";
  }

  const range = (lo, hi, extra = {}) => ({ range: () => [lo, hi], ...extra });
  const fields = {
    "counters-total": {
      ...range(0, LIMITS.counters),
      get: filled,
      set: (n) => layoutCounters(n),
    },
    "counters-a": {
      range: () => [0, LIMITS.counters - counts().b],
      get: () => counts().a,
      set: (n) => layoutCounters(n, counts().b),
    },
    "counters-b": {
      range: () => [0, LIMITS.counters - counts().a],
      get: () => counts().b,
      set: (n) => layoutCounters(counts().a, n),
    },
    "nl-start": {
      ...range(-NL_LIMIT, NL_LIMIT, { signed: true }),
      get: () => s.numberline.start,
      set: (n) => {
        s.numberline.start = n;
      },
    },
    "fr-num": {
      range: () => [0, s.fractions.d],
      get: () => s.fractions.n,
      set: (n) => {
        s.fractions.n = n;
      },
    },
    "fr-den": {
      ...range(2, LIMITS.maxDenominator),
      get: () => s.fractions.d,
      set: (n) => {
        s.fractions.d = n;
        s.fractions.n = Math.min(s.fractions.n, n);
      },
    },
    rows: { ...range(1, LIMITS.rows), get: () => s.array.rows, set: (n) => (s.array.rows = n) },
    cols: {
      ...range(2, LIMITS.cols),
      get: () => s.array.cols,
      set: (n) => {
        s.array.cols = n;
        s.array.split = Math.min(s.array.split, n - 1);
      },
    },
    split: {
      range: () => [1, s.array.cols - 1],
      get: () => s.array.split,
      set: (n) => (s.array.split = n),
    },
    pos: { ...range(0, LIMITS.chips), get: () => s.integers.pos, set: (n) => (s.integers.pos = n) },
    neg: { ...range(0, LIMITS.chips), get: () => s.integers.neg, set: (n) => (s.integers.neg = n) },
    "bal-coeff": {
      ...range(-20, 20, { signed: true, nonzero: true }),
      get: () => s.balance.coeff,
      set: (n) => (s.balance.coeff = n),
    },
    "bal-const": {
      ...range(-999, 999, { signed: true }),
      get: () => s.balance.constant,
      set: (n) => (s.balance.constant = n),
    },
    "bal-rhs": {
      ...range(-999, 999, { signed: true }),
      get: () => s.balance.rhs,
      set: (n) => (s.balance.rhs = n),
    },
  };

  const actions = {
    toggleCell(i) {
      const cells = s.counters.cells;
      if (cells.get(i) === "a" || cells.get(i) === "b" || cells.get(i) === "x") cells.delete(i);
      else cells.set(i, "a");
    },
    counter(action) {
      const { cells } = s.counters;
      if (action === "clear") cells.clear();
      if (action === "add5") {
        let added = 0;
        for (let i = 0; i < s.counters.total && added < 5; i++) {
          if (!cells.has(i)) {
            cells.set(i, "a");
            added++;
          }
        }
      }
      if (action === "fill10" || action === "fill20") {
        const n = action === "fill10" ? 10 : 20;
        s.counters.total = Math.max(s.counters.total, n);
        s.counters.cells = new Map(Array.from({ length: n }, (_, i) => [i, "a"]));
      }
    },
    addJump(text) {
      const t = String(text).trim().replace(/^\+/, "").replace(/−/g, "-");
      if (!isWholeText(t) || Number(t) === 0)
        return "Type a whole number to jump by, like 5 or -3.";
      if (Math.abs(Number(t)) > NL_LIMIT) return `Jumps can be up to ${NL_LIMIT} either way.`;
      if (s.numberline.jumps.length >= MAX_JUMPS)
        return `That is ${MAX_JUMPS} jumps. Press Reset to start over.`;
      s.numberline.jumps.push(Number(t));
      s.numberline.draft = "";
      return "";
    },
    resetJumps() {
      s.numberline.jumps = [];
    },
    togglePiece(d, p) {
      const set = (s.fractions.shaded[d] ??= new Set());
      if (!set.delete(p)) set.add(p);
    },
    clearShaded() {
      s.fractions.shaded = {};
    },
    addFraction() {
      const { n, d } = s.fractions;
      addStrip(d);
      shadeStrip(d, n);
      return "";
    },
    removeStrip(d) {
      const f = s.fractions;
      f.strips = f.strips.filter((x) => x !== d);
      f.custom.delete(d);
      delete f.shaded[d];
    },
    integers(action) {
      const i = s.integers;
      const bump = (key, by) => (i[key] = Math.min(LIMITS.chips, i[key] + by));
      if (action === "addPos") bump("pos", 1);
      if (action === "add5Pos") bump("pos", 5);
      if (action === "addNeg") bump("neg", 1);
      if (action === "add5Neg") bump("neg", 5);
      if (action === "cancelPairs") {
        const pairs = Math.min(i.pos, i.neg);
        i.pos -= pairs;
        i.neg -= pairs;
      }
      if (action === "clear") s.integers = { pos: 0, neg: 0 };
    },
    balance(action) {
      const b = s.balance;
      if (action === "sub1" || action === "add1") {
        const by = action === "sub1" ? -1 : 1;
        b.constant += by;
        b.rhs += by;
      }
      if (action === "divCoeff" && b.coeff > 1) {
        b.constant /= b.coeff;
        b.rhs /= b.coeff;
        b.coeff = 1;
      }
      if (action === "reset") s.balance = { coeff: 2, constant: 4, rhs: 12 };
    },
  };

  return {
    get state() {
      return s;
    },
    fields,
    actions,
    counts,
    filled,
    nlCurrent,
    resetToItem,
  };
}
