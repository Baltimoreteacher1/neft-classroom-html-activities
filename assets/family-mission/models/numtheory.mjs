// Family "numtheory": factors and multiples in three hands-on modes.
//   gcf  - try pack counts k; the model says whether k splits BOTH numbers with none left over, builds
//          a factor list for each number, and ends when the student names the greatest common factor.
//   lcm  - two skip-count tracks the student extends one step at a time; matches are labelled "both",
//          the least common multiple is named only once the first match is on screen.
//   tree - a factor tree: tap a composite number, choose one of its real factor pairs; primes stop;
//          done when every leaf is prime (product written with exponents). A second start is compared.
// Everything is exact integer arithmetic on numbers from 2 to 500.
import { defineFamily } from "./core.mjs";
import { gcd, inRange, isPrime, lcm, MAX, MAX_STEPS, MIN, pairsOf, powerForm, product, sortedNums, toInt } from "./numtheory-math.mjs";
import { describe, explain } from "./numtheory-text.mjs";

export { mount } from "./numtheory-view.mjs";
export const id = "numtheory";
export const label = { en: "Factors and multiples", es: "Factores y múltiplos" };

const MODES = ["gcf", "lcm", "tree"];
const MAX_PRESETS = 4;
const MAX_NODES = 40;
const MAX_SEEN = 12;
const STR_MAX = 40;
const DEFAULT_CTX = {
  a: { en: "first items", es: "artículos del primer grupo" },
  b: { en: "second items", es: "artículos del segundo grupo" },
  per: { en: "packs", es: "paquetes" },
  unit: null,
};

// ── Problems ─────────────────────────────────────────────────────────────────

function problemOk(mode, p) {
  if (!p) return false;
  if (mode === "tree") return inRange(p.n) && !isPrime(p.n);
  if (!inRange(p.a) || !inRange(p.b)) return false;
  if (mode === "gcf") return true;
  const l = lcm(p.a, p.b);
  return l / p.a <= MAX_STEPS && l / p.b <= MAX_STEPS;
}

const readProblem = (mode, x) => (mode === "tree" ? { n: toInt(typeof x === "object" && x ? x.n : x) } : { a: toInt(x?.a), b: toInt(x?.b) });

function text2(x, fallback, what) {
  if (x === undefined || x === null) return fallback;
  const ok = (s) => typeof s === "string" && s.trim() !== "" && s.length <= STR_MAX;
  if (!ok(x.en) || !ok(x.es)) throw new TypeError(`numtheory: ${what} needs short en and es text`);
  return { en: x.en.trim(), es: x.es.trim() };
}

function fresh(mode, p, ctx, presets) {
  const base = { mode, ctx, presets };
  if (mode === "gcf") return { ...base, a: p.a, b: p.b, k: 1, tried: [], last: null, claimed: null };
  if (mode === "lcm") return { ...base, a: p.a, b: p.b, na: 0, nb: 0, counted: false };
  return { ...base, n: p.n, nodes: [{ v: p.n, kids: null }], sel: null, seen: [] };
}

function normalize(config) {
  const c = config || {};
  if (!MODES.includes(c.mode)) throw new TypeError(`numtheory: mode must be one of ${MODES.join(", ")}`);
  const mode = c.mode;
  const p = readProblem(mode, c);
  if (!problemOk(mode, p)) {
    throw new TypeError(
      mode === "tree"
        ? `numtheory: the tree needs a composite whole number from ${MIN} to ${MAX}`
        : `numtheory: a and b must be whole numbers from ${MIN} to ${MAX}${mode === "lcm" ? ` whose multiples meet within ${MAX_STEPS} steps` : ""}`,
    );
  }
  const presets = (c.presets || []).slice(0, MAX_PRESETS).map((x) => readProblem(mode, x));
  for (const x of presets) if (!problemOk(mode, x)) throw new TypeError("numtheory: every preset must be a valid problem of the same mode");
  const labels = c.labels || {};
  const ctx = {
    a: text2(labels.a, DEFAULT_CTX.a, "labels.a"),
    b: text2(labels.b, DEFAULT_CTX.b, "labels.b"),
    per: text2(c.per, DEFAULT_CTX.per, "per"),
    unit: text2(c.unit, null, "unit"),
  };
  return { state: fresh(mode, p, ctx, presets), task: c.task || null };
}

// ── State rules ──────────────────────────────────────────────────────────────

const stepsOk = (n) => Number.isInteger(n) && n >= 0 && n <= MAX_STEPS;

/** The first number on both skip-count lists, or null until both lists have reached it. */
function matchesOf(a, b, na, nb) {
  const out = [];
  for (let i = 1; i <= na; i += 1) if ((a * i) % b === 0 && a * i <= nb * b) out.push(a * i);
  return out;
}

function treeOk(st) {
  const { nodes, sel, seen } = st;
  if (!Array.isArray(nodes) || nodes.length < 1 || nodes.length > MAX_NODES || nodes[0]?.v !== st.n) return false;
  const used = new Set();
  for (const [i, nd] of nodes.entries()) {
    if (!nd || !Number.isInteger(nd.v) || nd.v < 2 || nd.v > MAX) return false;
    if (nd.kids === null) continue;
    if (!Array.isArray(nd.kids) || nd.kids.length !== 2) return false;
    const [x, y] = nd.kids;
    if (!(x > i && y === x + 1 && y < nodes.length) || used.has(x) || used.has(y)) return false;
    if (nodes[x].v * nodes[y].v !== nd.v || nodes[x].v < 2 || nodes[x].v > nodes[y].v) return false;
    used.add(x).add(y);
  }
  if (used.size !== nodes.length - 1) return false;
  if (sel !== null && !(Number.isInteger(sel) && nodes[sel]?.kids === null && !isPrime(nodes[sel].v))) return false;
  const seenOk = (e) =>
    e && Array.isArray(e.start) && e.start.length === 2 && e.start[0] * e.start[1] === st.n && Array.isArray(e.primes) && e.primes.every(isPrime) && product(e.primes) === st.n;
  return Array.isArray(seen) && seen.length <= MAX_SEEN && seen.every(seenOk);
}

function validateState(st) {
  if (!st || !MODES.includes(st.mode) || !st.ctx || !Array.isArray(st.presets)) return false;
  if (!st.presets.every((p) => problemOk(st.mode, p))) return false;
  if (!problemOk(st.mode, st)) return false;
  if (st.mode === "tree") return treeOk(st);
  if (st.mode === "lcm") return stepsOk(st.na) && stepsOk(st.nb) && typeof st.counted === "boolean" && (!st.counted || matchesOf(st.a, st.b, st.na, st.nb).length > 0);
  const kOk = (k) => Number.isInteger(k) && k >= 1 && k <= Math.min(st.a, st.b);
  if (!kOk(st.k) || !Array.isArray(st.tried) || !st.tried.every(kOk) || new Set(st.tried).size !== st.tried.length) return false;
  if (st.last !== null && !st.tried.includes(st.last)) return false;
  return st.claimed === null || (st.tried.includes(st.claimed) && st.claimed === gcd(st.a, st.b));
}

const bad = (msg) => {
  throw new RangeError(`numtheory: ${msg}`);
};

function reduceGcf(st, p) {
  const next = { ...st };
  if (st.claimed !== null) bad("the greatest common factor is already found");
  const pack = (k) => (Number.isInteger(k) && k >= 1 && k <= Math.min(st.a, st.b) ? k : bad("pack count out of range"));
  if ("k" in p) next.k = pack(p.k);
  if ("try" in p) {
    next.k = pack(p.try);
    next.last = next.k;
    if (!st.tried.includes(next.k)) next.tried = [...st.tried, next.k];
  }
  if ("claim" in p) {
    const k = pack(p.claim);
    if (!st.tried.includes(k) || k !== gcd(st.a, st.b)) bad("that is not the greatest common factor");
    next.claimed = k;
  }
  return next;
}

function reduceLcm(st, p) {
  const next = { ...st };
  if ("extend" in p) {
    const key = p.extend === "a" ? "na" : p.extend === "b" ? "nb" : bad("extend takes a or b");
    if (st.counted || st[key] >= MAX_STEPS) bad("that track cannot grow");
    next[key] += 1;
  }
  if ("count" in p) {
    if (matchesOf(st.a, st.b, st.na, st.nb).length === 0) bad("no match yet");
    next.counted = true;
  }
  return next;
}

const leavesOf = (nodes) => nodes.filter((nd) => nd.kids === null).map((nd) => nd.v);

function reduceTree(st, p) {
  const next = { ...st, nodes: st.nodes.map((nd) => ({ ...nd })) };
  const composite = (i) => Number.isInteger(i) && st.nodes[i]?.kids === null && !isPrime(st.nodes[i].v);
  if ("sel" in p) {
    if (p.sel !== null && !composite(p.sel)) bad("only a composite leaf can be split");
    next.sel = p.sel;
  }
  if ("split" in p) {
    const { node, p: small } = p.split || {};
    if (!composite(node)) bad("only a composite leaf can be split");
    const v = st.nodes[node].v;
    if (!Number.isInteger(small) || small < 2 || v % small !== 0 || small > v / small) bad("not a real factor pair");
    next.nodes[node].kids = [next.nodes.length, next.nodes.length + 1];
    next.nodes.push({ v: small, kids: null }, { v: v / small, kids: null });
    next.sel = null;
  }
  if (p.restart === true) {
    const leaves = leavesOf(st.nodes);
    const start = st.nodes[0].kids?.map((i) => st.nodes[i].v);
    const key = (s) => s.join("x");
    if (start && leaves.every(isPrime) && !st.seen.some((e) => key(e.start) === key(start))) {
      next.seen = [...st.seen, { start, primes: sortedNums(leaves) }].slice(-MAX_SEEN);
    }
    next.nodes = [{ v: st.n, kids: null }];
    next.sel = null;
  }
  return next;
}

function reduce(st, patch) {
  const keys = st.mode === "tree" ? ["n"] : ["a", "b"];
  if (keys.some((k) => k in patch)) {
    const q = readProblem(st.mode, st.mode === "tree" ? patch.n : { a: patch.a ?? st.a, b: patch.b ?? st.b });
    if (!problemOk(st.mode, q)) throw new TypeError("numtheory: not a valid problem");
    return fresh(st.mode, q, st.ctx, st.presets);
  }
  return st.mode === "gcf" ? reduceGcf(st, patch) : st.mode === "lcm" ? reduceLcm(st, patch) : reduceTree(st, patch);
}

// The stepper value and the selected tree node are not "moves": Undo skips them.
const track = (patch) => !("k" in patch || "sel" in patch);

// ── Derived view of the state ────────────────────────────────────────────────

function deriveGcf(st) {
  const { a, b, tried } = st;
  const facA = sortedNums(tried.filter((k) => a % k === 0));
  const facB = sortedNums(tried.filter((k) => b % k === 0));
  const common = facA.filter((k) => b % k === 0);
  const lk = st.last;
  const last = lk === null ? null : { k: lk, qa: Math.floor(a / lk), ra: a % lk, qb: Math.floor(b / lk), rb: b % lk };
  const finished = st.claimed !== null;
  return {
    k: st.k,
    max: Math.min(a, b),
    tried: [...tried],
    facA,
    facB,
    common,
    missed: sortedNums(tried.filter((k) => !common.includes(k))),
    last: last && { ...last, both: last.ra === 0 && last.rb === 0 },
    finished,
    gcf: finished ? st.claimed : null,
    pack: finished ? { a: a / st.claimed, b: b / st.claimed } : null,
    next: finished ? null : common.length ? "claim" : tried.length ? "keep" : "try",
  };
}

function deriveLcm(st) {
  const { a, b, na, nb } = st;
  const both = matchesOf(a, b, na, nb);
  const match = both.length ? both[0] : null;
  return {
    na,
    nb,
    listA: Array.from({ length: na }, (_, i) => a * (i + 1)),
    listB: Array.from({ length: nb }, (_, i) => b * (i + 1)),
    both,
    match,
    counted: st.counted,
    qa: st.counted ? match / a : null,
    qb: st.counted ? match / b : null,
    finished: st.counted,
    next: match === null ? "extend" : st.counted ? null : "count",
  };
}

function deriveTree(st) {
  const nodes = st.nodes.map((nd, i) => ({ id: i, v: nd.v, kids: nd.kids, prime: isPrime(nd.v) }));
  const leaves = leavesOf(st.nodes);
  const finished = leaves.every(isPrime);
  const primes = finished ? sortedNums(leaves) : null;
  const start = st.nodes[0].kids ? st.nodes[0].kids.map((i) => st.nodes[i].v) : null;
  return {
    n: st.n,
    nodes,
    sel: st.sel,
    pairs: st.sel === null ? [] : pairsOf(st.nodes[st.sel].v),
    leaves,
    finished,
    primes,
    power: primes && powerForm(primes),
    product: primes && product(primes),
    start,
    earlier: finished && start ? st.seen.filter((e) => e.start.join("x") !== start.join("x")) : [],
    next: finished ? null : st.sel === null ? "pick" : "pair",
  };
}

function derive(st) {
  const body = st.mode === "gcf" ? deriveGcf(st) : st.mode === "lcm" ? deriveLcm(st) : deriveTree(st);
  return { mode: st.mode, a: st.a, b: st.b, ctx: st.ctx, presets: st.presets, ...body };
}

function validateTask(st, task) {
  if (!task) return { ok: false, reason: "no-task", misconception: null };
  const d = derive(st);
  if (!d.finished) return { ok: false, reason: "not-finished", misconception: null };
  if (task.answer === undefined) return { ok: true, reason: "correct", misconception: null };
  let same;
  if (d.mode === "tree") {
    const given = Array.isArray(task.answer) ? task.answer.map(Number) : (String(task.answer).match(/\d+/g) || []).map(Number);
    same = sortedNums(given).join(",") === d.primes.join(",");
  } else {
    same = toInt(task.answer) === (d.mode === "gcf" ? d.gcf : d.match);
  }
  return { ok: same, reason: same ? "correct" : "incorrect", misconception: null };
}

const build = defineFamily({
  id,
  normalize,
  reduce,
  validateState,
  track,
  derive,
  validateTask,
  accessibleDescription: (st, lang) => describe(derive(st), lang),
  explanation: (st, lang) => explain(derive(st), lang),
  describeConfig: (st) => ({
    mode: st.mode,
    ...(st.mode === "tree" ? { n: st.n } : { a: st.a, b: st.b }),
    presets: st.presets,
    labels: { a: st.ctx.a, b: st.ctx.b },
    per: st.ctx.per,
    unit: st.ctx.unit,
  }),
});

/** A model keeps the mode it was made with: a saved state from another mode is refused. */
export function create(config) {
  const model = build(config);
  const { mode } = model.getState();
  const restore = model.restore;
  model.restore = (json) => {
    try {
      const saved = typeof json === "string" ? JSON.parse(json) : json;
      return saved?.state?.mode === mode && restore(json);
    } catch {
      return false;
    }
  };
  return model;
}
