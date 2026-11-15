// Pure state for the "pattern" family (no DOM). Two modes share one rule y = m·x + b:
//  "rule"  (5.OA.B.3) the student picks inputs for a table, tries "start at b, add m each step" or
//          "multiply by m", and the model compares that rule with every row shown.
//  "solve" (6.AT.11)  the equation y = m·x is shown; the student says which variable is known,
//          undoes the multiplication on both sides, and the model checks by substituting back.
// Every number is an exact rational (core.mjs); decimals in the config are parsed, never floated.
import { add, cmp, defineFamily, div, eq, frac, mul, parseRational, toDecimalString } from "./core.mjs";
import { accessibleText, explanationText } from "./pattern-text.mjs";

export const MAX_PRESETS = 4;
export const MAX_ROWS = 8;
const MODES = ["rule", "solve"];
const OPS = ["mul", "add", "sub"];
const BAD_TEXT = /undefined|NaN|\[object/;

// ── Numbers ──────────────────────────────────────────────────────────────────

const clean = (v) => String(v ?? "").trim();
const NUM = /^\d{1,7}(\.\d{1,4})?$/;

/** "2.5", "1,000", 26 -> exact rational, or null (never throws). At most 4 decimals, at most `hi`. */
export function parseNum(text, hi = 1e6) {
  const s = clean(text);
  const plain = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s) ? s.replaceAll(",", "") : s;
  if (!NUM.test(plain)) return null;
  const v = parseRational(plain);
  return v && cmp(v, frac(hi)) <= 0 ? v : null;
}
const canon = (v) => toDecimalString(v);

// ── Config -> problem ────────────────────────────────────────────────────────

const bad = (msg) => {
  throw new TypeError(`pattern: ${msg}`);
};
function words(o, what) {
  const en = clean(o?.en);
  const es = clean(o?.es);
  if (!en || !es || en.length > 40 || es.length > 40 || BAD_TEXT.test(en + es)) bad(`${what} needs short English and Spanish text`);
  return { en, es };
}
const optWords = (o, what) => (o === undefined || o === null ? null : words(o, what));
const letter = (s) => (/^[A-Za-z]$/.test(s) ? s : bad("a letter must be one character, A-Z"));

/** The canonical problem; validateState re-runs this and demands the same JSON back. */
export function normalizeProblem(c, mode) {
  if (!c || typeof c !== "object") bad("config must be an object");
  if (!MODES.includes(mode)) bad(`mode must be one of ${MODES.join(", ")}`);
  const m = parseNum(c.m, 1e5);
  const b = parseNum(c.b ?? "0");
  if (!m || m.n === 0) bad("m must be a number above 0");
  if (!b) bad("b must be a number of 0 or more");
  if (mode === "solve" && b.n !== 0) bad("solve mode uses y = m × x, so b must be 0");
  const letters = { x: letter(c.letters?.x ?? "x"), y: letter(c.letters?.y ?? "y") };
  if (letters.x === letters.y) bad("the two letters must differ");
  const u = c.units || {};
  const prefix = clean(u.yPrefix);
  const decimals = u.yDecimals ?? 0;
  if (prefix.length > 3 || BAD_TEXT.test(prefix) || !Number.isInteger(decimals) || decimals < 0 || decimals > 4) bad("units.yPrefix is up to 3 characters and units.yDecimals is 0 to 4");
  const p = {
    mode,
    m: canon(m),
    b: canon(b),
    letters,
    quantities: { x: words(c.quantities?.x, "quantities.x"), y: words(c.quantities?.y, "quantities.y") },
    units: { x: optWords(u.x, "units.x"), y: optWords(u.y, "units.y"), yPrefix: prefix, yDecimals: decimals },
    title: optWords(c.title, "title"),
  };
  if (mode === "rule") {
    const maxX = c.maxX ?? 100;
    if (!Number.isInteger(maxX) || maxX < 2 || maxX > 1000) bad("maxX must be a whole number from 2 to 1000");
    const rows = [...new Set(c.rows ?? [])].sort((a, z) => a - z);
    if (rows.length > MAX_ROWS || rows.some((x) => !Number.isInteger(x) || x < 1 || x > maxX)) bad(`rows are up to ${MAX_ROWS} whole numbers from 1 to maxX`);
    return { ...p, maxX, rows };
  }
  const target = parseNum(c.target);
  const given = parseNum(c.given);
  if (!target || target.n === 0 || !given || given.n === 0) bad("target and given must be numbers above 0");
  return { ...p, target: canon(target), given: canon(given) };
}

const inheritFrom = ({ presets, title, ...rest }) => rest;

function normalize(config) {
  const c = config || {};
  const problem = normalizeProblem(c, c.mode);
  const list = c.presets || [];
  if (!Array.isArray(list) || list.length > MAX_PRESETS) bad(`up to ${MAX_PRESETS} presets`);
  const presets = list.map((p) => {
    if (p?.mode !== undefined && p.mode !== c.mode) bad("a preset must use the same mode");
    return normalizeProblem({ ...inheritFrom(c), ...p }, c.mode);
  });
  return { state: { problem, presets, ...fresh(problem) }, task: c.task || null };
}

const fresh = (p) =>
  p.mode === "rule"
    ? { rule: { xs: p.rows, guess: { kind: "add", start: "", step: "" }, checked: false } }
    : { solve: { known: "y", values: { x: p.given, y: p.target }, stage: 0, tried: null } };

// ── State checks ─────────────────────────────────────────────────────────────

const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function problemOk(p) {
  try {
    return sameJson(normalizeProblem(p, p?.mode), p);
  } catch {
    return false;
  }
}
const blankOr = (text, hi) => text === "" || parseNum(text, hi) !== null;
const ruleOk = (r, p) =>
  !!r &&
  Array.isArray(r.xs) &&
  r.xs.length <= MAX_ROWS &&
  r.xs.every((x, i) => Number.isInteger(x) && x >= 1 && x <= p.maxX && (i === 0 || x > r.xs[i - 1])) &&
  ["add", "times"].includes(r.guess?.kind) &&
  typeof r.guess.start === "string" &&
  typeof r.guess.step === "string" &&
  blankOr(r.guess.start, 1e6) &&
  blankOr(r.guess.step, 1e5) &&
  typeof r.checked === "boolean";
const positive = (text) => {
  const v = typeof text === "string" ? parseNum(text) : null;
  return !!v && v.n > 0;
};
const solveOk = (v) =>
  !!v &&
  ["x", "y"].includes(v.known) &&
  positive(v.values?.x) &&
  positive(v.values?.y) &&
  Number.isInteger(v.stage) &&
  v.stage >= 0 &&
  v.stage <= 3 &&
  (v.tried === null || OPS.includes(v.tried));

function validateState(st) {
  if (!st || !problemOk(st.problem)) return false;
  if (!Array.isArray(st.presets) || st.presets.length > MAX_PRESETS) return false;
  if (!st.presets.every((p) => problemOk(p) && p.mode === st.problem.mode)) return false;
  return st.problem.mode === "rule" ? ruleOk(st.rule, st.problem) : solveOk(st.solve);
}

// ── Moves ────────────────────────────────────────────────────────────────────

const needsOp = (v) => v.known === "y" && v.stage === 1;

function reduceRule(st, patch) {
  const r = { ...st.rule };
  if ("addX" in patch) {
    const raw = typeof patch.addX === "string" && /^\d{1,4}$/.test(patch.addX.trim()) ? Number(patch.addX) : patch.addX;
    if (!Number.isInteger(raw) || raw < 1 || raw > st.problem.maxX) throw new RangeError("pattern: the input is out of range");
    if (r.xs.includes(raw) || r.xs.length >= MAX_ROWS) throw new RangeError("pattern: that row cannot be added");
    r.xs = [...r.xs, raw].sort((a, z) => a - z);
    r.checked = false;
  }
  if (patch.guess) {
    const g = Object.fromEntries(Object.entries(patch.guess).map(([k, v]) => [k, clean(v)]));
    r.guess = { ...r.guess, ...g };
    r.checked = false;
  }
  if (patch.check) {
    if (!r.xs.length) throw new RangeError("pattern: add a row first");
    r.checked = true;
  }
  return { ...st, rule: r };
}

function reduceSolve(st, patch) {
  const v = { ...st.solve };
  if (patch.known) {
    if (!["x", "y"].includes(patch.known)) throw new RangeError("pattern: known is x or y");
    return { ...st, solve: { ...v, known: patch.known, stage: 0, tried: null } };
  }
  if ("value" in patch) {
    const n = parseNum(patch.value);
    if (!n || n.n === 0) throw new RangeError("pattern: the known number must be above 0");
    return { ...st, solve: { ...v, values: { ...v.values, [v.known]: canon(n) }, stage: 0, tried: null } };
  }
  if (patch.advance) {
    if (needsOp(v) || v.stage >= 3) throw new RangeError("pattern: nothing to advance");
    return { ...st, solve: { ...v, stage: v.stage + 1, tried: null } };
  }
  if (patch.op) {
    if (!needsOp(v)) throw new RangeError("pattern: no move to choose now");
    if (patch.op === "div") return { ...st, solve: { ...v, stage: 2, tried: null } };
    if (!OPS.includes(patch.op)) throw new RangeError("pattern: unknown operation");
    return { ...st, solve: { ...v, tried: patch.op } };
  }
  throw new RangeError("pattern: unknown move");
}

function reduce(st, patch) {
  if ("preset" in patch) {
    const p = st.presets[patch.preset];
    if (!p) throw new RangeError("pattern: no such preset");
    return { ...st, problem: p, ...fresh(p) };
  }
  return st.problem.mode === "rule" ? reduceRule(st, patch) : reduceSolve(st, patch);
}

// ── Derived values ───────────────────────────────────────────────────────────

const guessParts = (g) => ({
  step: g.step === "" ? null : parseNum(g.step, 1e5),
  start: g.kind === "add" ? (g.start === "" ? null : parseNum(g.start)) : frac(0),
});
const guessAt = ({ start, step }, x) => (step && start ? add(start, mul(step, frac(x))) : null);

function deriveRule(st, d) {
  const { rule: r, problem: p } = st;
  const m = parseNum(p.m, 1e5);
  const b = parseNum(p.b);
  const gp = guessParts(r.guess);
  const rows = r.xs.map((x) => {
    const y = add(mul(m, frac(x)), b);
    const g = guessAt(gp, x);
    return { x, y, guess: g, status: !r.checked || !g ? "idle" : eq(g, y) ? "match" : "differs" };
  });
  const complete = rows.length > 0 && rows.every((row) => row.guess);
  const free = [...Array(p.maxX).keys()].map((i) => i + 1).filter((x) => !r.xs.includes(x));
  const after = free.find((x) => x > (r.xs.at(-1) ?? 0));
  return {
    ...d,
    rows,
    guess: { kind: r.guess.kind, startText: r.guess.start, stepText: r.guess.step, ...gp, complete: guessAt(gp, 1) !== null },
    checked: r.checked,
    result: !r.checked ? null : !complete ? "incomplete" : rows.every((row) => row.status === "match") ? "all" : "some",
    canAdd: r.xs.length < MAX_ROWS && free.length > 0,
    nextX: after ?? free[0] ?? null,
    maxX: p.maxX,
    m,
    b,
  };
}

function deriveSolve(st, d) {
  const { solve: v } = st;
  const m = parseNum(st.problem.m, 1e5);
  const value = parseNum(v.values[v.known]);
  const known = v.known;
  const answer = known === "y" ? div(value, m) : mul(m, value);
  const back = known === "y" ? mul(m, answer) : div(answer, m);
  return {
    ...d,
    known,
    unknown: known === "y" ? "x" : "y",
    value,
    answer,
    back,
    checkOk: eq(back, value),
    stage: v.stage,
    tried: v.tried,
    needsOp: needsOp(v),
    finished: v.stage === 3,
    m,
  };
}

function derive(st) {
  const p = st.problem;
  const d = { mode: p.mode, letters: p.letters, quantities: p.quantities, units: p.units, problem: p, presets: st.presets };
  return p.mode === "rule" ? deriveRule(st, d) : deriveSolve(st, d);
}

function validateTask(st, task) {
  if (!task) return { ok: false, reason: "no-task", misconception: null };
  const d = derive(st);
  if (d.mode === "rule") {
    if (!d.checked || d.result === "incomplete") return { ok: false, reason: "not-finished", misconception: null };
    return { ok: d.result === "all", reason: d.result === "all" ? "correct" : "incorrect", misconception: null };
  }
  if (!d.finished) return { ok: false, reason: "not-finished", misconception: null };
  const want = task.answer === undefined ? null : parseNum(String(task.answer));
  const same = !want || eq(want, d.answer);
  return { ok: same, reason: same ? "correct" : "incorrect", misconception: null };
}

export const create = defineFamily({
  id: "pattern",
  normalize,
  reduce,
  validateState,
  derive,
  validateTask,
  accessibleDescription: (st, lang) => accessibleText(derive(st), lang),
  explanation: (st, lang) => explanationText(derive(st), lang),
  describeConfig: (st) => ({ ...st.problem, presets: st.presets }),
});
